import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/api/middleware"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api/response"
import { cache } from "@/lib/utils/cache"
import { QueryOptimizer, withPerformanceMonitoring } from "@/lib/utils/performance"

const searchSchema = z.object({
  query: z.string().optional(),
  type: z.enum(["bookmark", "note", "file", "snippet"]).optional(),
  space_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  is_favorite: z.boolean().optional(),
  sort_by: z.enum(["created_at", "updated_at", "title", "relevance"]).default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
})

export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url)
    const params = {
      query: searchParams.get("query") || undefined,
      type: searchParams.get("type") || undefined,
      space_id: searchParams.get("space_id") || undefined,
      category_id: searchParams.get("category_id") || undefined,
      tags: searchParams.get("tags")?.split(",").filter(Boolean) || undefined,
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
      is_favorite: searchParams.get("is_favorite") === "true" ? true : undefined,
      sort_by: searchParams.get("sort_by") || "created_at",
      sort_order: searchParams.get("sort_order") || "desc",
      limit: Number.parseInt(searchParams.get("limit") || "20"),
      offset: Number.parseInt(searchParams.get("offset") || "0"),
    }

    const validatedParams = searchSchema.parse(params)

    const cacheKey = cache.generateKey("search", {
      userId: user.id,
      ...validatedParams,
    })

    const result = await QueryOptimizer.executeWithCache(
      cacheKey,
      async () => {
        return await withPerformanceMonitoring("search_items", async () => {
          const supabase = createClient()

          // Get user's accessible spaces with caching
          const spaceCacheKey = cache.generateKey("user_spaces", { userId: user.id })
          const userSpaces = await QueryOptimizer.executeWithCache(
            spaceCacheKey,
            async () => {
              const { data } = await supabase
                .from("spaces")
                .select("id")
                .or(`owner_id.eq.${user.id},and(type.eq.common,is_public.eq.true)`)
                .is("deleted_at", null)
              return data || []
            },
            600, // 10 minutes cache for spaces
            [`user:${user.id}`, "spaces"],
          )

          const spaceIds = userSpaces.map((s: any) => s.id)
          if (spaceIds.length === 0) {
            return { items: [], total: 0, hasMore: false }
          }

          // Use materialized view for better performance
          let query = supabase.from("item_search_view").select(
            `
            id, title, content, url, excerpt, type, tags, is_favorite,
            created_at, updated_at, space_id, category_id, created_by,
            space_name, space_type, category_name, category_icon, creator_name
          `,
            { count: "exact" },
          )

          query = query.in("space_id", spaceIds)

          // Apply filters efficiently
          if (validatedParams.query) {
            query = query.textSearch("search_vector", validatedParams.query, {
              type: "websearch",
              config: "english",
            })
          }

          if (validatedParams.type) {
            query = query.eq("type", validatedParams.type)
          }

          if (validatedParams.space_id) {
            query = query.eq("space_id", validatedParams.space_id)
          }

          if (validatedParams.category_id) {
            query = query.eq("category_id", validatedParams.category_id)
          }

          if (validatedParams.tags && validatedParams.tags.length > 0) {
            query = query.overlaps("tags", validatedParams.tags)
          }

          if (validatedParams.date_from) {
            query = query.gte("created_at", validatedParams.date_from)
          }

          if (validatedParams.date_to) {
            query = query.lte("created_at", validatedParams.date_to)
          }

          if (validatedParams.is_favorite !== undefined) {
            query = query.eq("is_favorite", validatedParams.is_favorite)
          }

          // Apply sorting
          if (validatedParams.sort_by === "relevance" && validatedParams.query) {
            query = query.order("ts_rank(search_vector, websearch_to_tsquery('english', $1))", {
              ascending: false,
            })
          } else {
            query = query.order(validatedParams.sort_by, {
              ascending: validatedParams.sort_order === "asc",
            })
          }

          // Apply pagination
          const {
            data: items,
            error,
            count,
          } = await query.range(validatedParams.offset, validatedParams.offset + validatedParams.limit - 1)

          if (error) {
            throw new Error(error.message)
          }

          return {
            items: items || [],
            total: count || 0,
            hasMore: validatedParams.offset + validatedParams.limit < (count || 0),
            offset: validatedParams.offset,
            limit: validatedParams.limit,
          }
        })
      },
      60, // 1 minute cache for search results
      [`user:${user.id}`, "search", "items"],
    )

    return NextResponse.json(
      successResponse(result.items, undefined, {
        total: result.total,
        offset: result.offset,
        limit: result.limit,
        hasMore: result.hasMore,
      }),
    )
  } catch (error) {
    console.error("Search error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(validationErrorResponse(error.errors), { status: 400 })
    }
    return NextResponse.json(errorResponse("Internal server error"), { status: 500 })
  }
})
