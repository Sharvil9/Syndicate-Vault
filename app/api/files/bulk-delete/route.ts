import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { file_ids } = await request.json()

    if (!Array.isArray(file_ids) || file_ids.length === 0) {
      return NextResponse.json({ error: "Invalid file IDs" }, { status: 400 })
    }

    // Get file details for cleanup
    const { data: files } = await supabase
      .from("attachments")
      .select("storage_path")
      .in("id", file_ids)
      .eq("uploaded_by", user.id)

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files found or access denied" }, { status: 404 })
    }

    // Delete from storage
    const storagePaths = files.map((f) => f.storage_path)
    await supabase.storage.from("vault-files").remove(storagePaths)

    // Delete from database
    const { error: deleteError } = await supabase
      .from("attachments")
      .delete()
      .in("id", file_ids)
      .eq("uploaded_by", user.id)

    if (deleteError) {
      console.error("Database delete error:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: user.id,
      action: "bulk_delete",
      resource_type: "files",
      details: { deleted_count: files.length },
    })

    return NextResponse.json({ success: true, deleted_count: files.length })
  } catch (error) {
    console.error("Bulk delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
