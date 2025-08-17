import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/api/middleware"
import { successResponse, errorResponse, validationErrorResponse } from "@/lib/api/response"
import { cache } from "@/lib/utils/cache"
import { QueryOptimizer, withPerformanceMonitoring } from "@/lib/utils/performance"

const createItemSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  url: z.string().url().optional(),
  excerpt: z.string().max(500).optional(),
  type: z.enum(["bookmark", "note", "file", "snippet"]).default("bookmark"),
  tags: z.array(z.string().max(50)).max(20).default([]),
  category_id: z.string().uuid().optional(),
  space_id: z.string().uuid(),
  html_snapshot: z.string().optional(),
})

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const supabase = createClient()
    const body = await request.json()

    const validation = createItemSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.error.errors), { status: 400 })
    }

    const validatedData = validation.data

    const { data: space } = await supabase
      .from("spaces")
      .select("*")
      .eq("id", validatedData.space_id)
      .is("deleted_at", null)
      .single()

    if (!space) {
      return NextResponse.json(errorResponse("Space not found"), { status: 404 })
    }

    // Check permissions
    if (space.type === "personal" && space.owner_id !== user.id) {
      return NextResponse.json(errorResponse("Access denied"), { status: 403 })
    }

    // For common spaces, create edit request if user is not admin
    if (space.type === "common") {
      const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (userProfile?.role !== "admin") {
        const { data: editRequest, error: editError } = await supabase
          .from("edit_requests")
          .insert({
            item_id: null,
            requested_by: user.id,
            title: validatedData.title,
            content: validatedData.content,
            tags: validatedData.tags,
            reason: "New item submission",
          })
          .select()
          .single()

        if (editError) {
          return NextResponse.json(errorResponse("Failed to create edit request"), { status: 500 })
        }

        return NextResponse.json(successResponse(editRequest, "Edit request created for admin approval"))
      }
    }

    // Create the item
    const { data: item, error } = await supabase
      .from("items")
      .insert({
        ...validatedData,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(errorResponse(error.message), { status: 500 })
    }

    await supabase.from("activity_log").insert({
      user_id: user.id,
      action: "create",
      resource_type: "item",
      resource_id: item.id,
      details: {
        title: item.title,
        type: item.type,
        space_id: item.space_id,
        category_id: item.category_id,
      },
      ip_address: request.headers.get("x-forwarded-for") || "127.0.0.1",
      user_agent: request.headers.get("user-agent"),
    })

    return NextResponse.json(successResponse(item, "Item created successfully"))
  } catch (error) {
    console.error("Create item error:", error)
    return NextResponse.json(errorResponse("Internal server error"), { status: 500 })
  }
})

export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get("space_id")
    const categoryId = searchParams.get("category_id")
    const type = searchParams.get("type")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "20"), 100)
    const offset = Math.max(Number.parseInt(searchParams.get("offset") || "0"), 0)

    const cacheKey = cache.generateKey("items", {
      userId: user.id,
      spaceId,
      categoryId,
      type,
      limit,
      offset,
    })

    const result = await QueryOptimizer.executeWithCache(
      cacheKey,
      async () => {
        return await withPerformanceMonitoring("get_items", async () => {
          const supabase = createClient()

          // Use optimized materialized view instead of joining tables
          const query = QueryOptimizer.buildOptimizedQuery(supabase, "item_search_view", {
            select: `
              id, title, content, url, excerpt, type, tags, is_favorite,
              created_at, updated_at, space_id, category_id, created_by,
              space_name, space_type, category_name, category_icon, creator_name
            `,
            filters: {
              created_by: user.id,
              space_id: spaceId,
              category_id: categoryId,
              type: type,
            },
            orderBy: { column: "created_at", ascending: false },
            limit,
            offset,
          })

          const { data: items, error, count } = await query

          if (error) {
            throw new Error(error.message)
          }

          return {
            items: items || [],
            total: count || 0,
            offset,
            limit,
            hasMore: offset + limit < (count || 0),
          }
        })
      },
      300, // 5 minutes cache
      [`user:${user.id}`, "items"],
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
    console.error("Get items error:", error)
    return NextResponse.json(errorResponse("Internal server error"), { status: 500 })
  }
})
