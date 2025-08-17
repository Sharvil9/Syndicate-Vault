import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/api/middleware"
import { errorResponse } from "@/lib/api/response"
import { z } from "zod"

const exportSchema = z.object({
  format: z.enum(["json", "csv", "markdown"]).default("json"),
  space_ids: z.array(z.string().uuid()).optional(),
  include_attachments: z.boolean().default(false),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
})

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const supabase = createClient()
    const body = await request.json()

    const validation = exportSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(errorResponse("Invalid export parameters"), { status: 400 })
    }

    const { format, space_ids, include_attachments, date_from, date_to } = validation.data

    // Get user's accessible spaces
    let spaceQuery = supabase
      .from("spaces")
      .select("id")
      .or(`owner_id.eq.${user.id},type.eq.common`)
      .is("deleted_at", null)

    if (space_ids && space_ids.length > 0) {
      spaceQuery = spaceQuery.in("id", space_ids)
    }

    const { data: spaces } = await spaceQuery
    const accessibleSpaceIds = spaces?.map((s) => s.id) || []

    if (accessibleSpaceIds.length === 0) {
      return NextResponse.json(errorResponse("No accessible spaces found"), { status: 404 })
    }

    // Build items query
    let itemsQuery = supabase
      .from("items")
      .select(`
        *,
        category:categories(id, name, icon, color),
        space:spaces(id, name, type),
        ${include_attachments ? "attachments(id, filename, original_filename, mime_type, file_size, storage_path)" : ""}
      `)
      .in("space_id", accessibleSpaceIds)
      .is("deleted_at", null)

    if (date_from) {
      itemsQuery = itemsQuery.gte("created_at", date_from)
    }

    if (date_to) {
      itemsQuery = itemsQuery.lte("created_at", date_to)
    }

    const { data: items, error } = await itemsQuery.order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json(errorResponse(error.message), { status: 500 })
    }

    // Format data based on requested format
    let exportData: any
    let contentType: string
    let filename: string

    switch (format) {
      case "json":
        exportData = {
          export_info: {
            user_id: user.id,
            exported_at: new Date().toISOString(),
            total_items: items?.length || 0,
            format: "json",
          },
          items: items || [],
        }
        contentType = "application/json"
        filename = `vault-export-${new Date().toISOString().split("T")[0]}.json`
        break

      case "csv":
        const csvHeaders = [
          "id",
          "title",
          "content",
          "url",
          "excerpt",
          "type",
          "tags",
          "space_name",
          "category_name",
          "is_favorite",
          "created_at",
          "updated_at",
        ]

        const csvRows = items?.map((item) => [
          item.id,
          `"${(item.title || "").replace(/"/g, '""')}"`,
          `"${(item.content || "").replace(/"/g, '""')}"`,
          item.url || "",
          `"${(item.excerpt || "").replace(/"/g, '""')}"`,
          item.type,
          `"${item.tags.join(", ")}"`,
          item.space?.name || "",
          item.category?.name || "",
          item.is_favorite,
          item.created_at,
          item.updated_at,
        ])

        exportData = [csvHeaders.join(","), ...(csvRows?.map((row) => row.join(",")) || [])].join("\n")
        contentType = "text/csv"
        filename = `vault-export-${new Date().toISOString().split("T")[0]}.csv`
        break

      case "markdown":
        const markdownContent = [
          "# Vault Export",
          "",
          `Exported on: ${new Date().toLocaleDateString()}`,
          `Total items: ${items?.length || 0}`,
          "",
          ...(items?.flatMap((item) => [
            `## ${item.title}`,
            "",
            `**Type:** ${item.type}`,
            `**Space:** ${item.space?.name}`,
            item.category ? `**Category:** ${item.category.name}` : "",
            item.url ? `**URL:** ${item.url}` : "",
            item.tags.length > 0 ? `**Tags:** ${item.tags.join(", ")}` : "",
            `**Created:** ${new Date(item.created_at).toLocaleDateString()}`,
            "",
            item.content || item.excerpt || "",
            "",
            "---",
            "",
          ]) || []),
        ].join("\n")

        exportData = markdownContent
        contentType = "text/markdown"
        filename = `vault-export-${new Date().toISOString().split("T")[0]}.md`
        break
    }

    // Log export activity
    await supabase.from("activity_log").insert({
      user_id: user.id,
      action: "export_data",
      resource_type: "vault",
      details: {
        format,
        item_count: items?.length || 0,
        include_attachments,
        space_ids: accessibleSpaceIds,
      },
      ip_address: request.headers.get("x-forwarded-for") || "127.0.0.1",
      user_agent: request.headers.get("user-agent"),
    })

    // Return file download
    return new NextResponse(typeof exportData === "string" ? exportData : JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json(errorResponse("Export failed"), { status: 500 })
  }
})
