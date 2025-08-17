import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: "User ID and role are required" }, { status: 400 })
    }

    if (!["admin", "member"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const supabase = createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Check if current user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: adminProfile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Update user role
    const { error } = await supabase.from("users").update({ role }).eq("id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the activity
    await supabase.from("activity_log").insert({
      user_id: user.id,
      action: "update_user_role",
      resource_type: "user",
      resource_id: userId,
      details: { new_role: role, target_user_id: userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Role update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
