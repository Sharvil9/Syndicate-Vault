import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || ""
    const sortBy = searchParams.get("sort_by") || "created_at"
    const sortOrder = searchParams.get("sort_order") || "desc"

    let query = supabase
      .from("attachments")
      .select(`
        *,
        item:items(id, title),
        uploader:users!uploaded_by(full_name, email)
      `)
      .eq("uploaded_by", user.id)

    // Apply search filter
    if (search) {
      query = query.ilike("original_filename", `%${search}%`)
    }

    // Apply type filter
    if (type) {
      switch (type) {
        case "image":
          query = query.like("mime_type", "image/%")
          break
        case "video":
          query = query.like("mime_type", "video/%")
          break
        case "audio":
          query = query.like("mime_type", "audio/%")
          break
        case "document":
          query = query.in("mime_type", [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
          ])
          break
      }
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" })

    const { data: files, error } = await query

    if (error) {
      console.error("Files fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ files: files || [] })
  } catch (error) {
    console.error("Files API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
