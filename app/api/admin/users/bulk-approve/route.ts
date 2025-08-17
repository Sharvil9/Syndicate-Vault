import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/api/middleware"
import { successResponse, errorResponse } from "@/lib/api/response"
import { z } from "zod"

const bulkApproveSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(100),
})

export const POST = withAdminAuth(async (request: NextRequest, user: any) => {
  try {
    const supabase = createClient()
    const body = await request.json()

    const validation = bulkApproveSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(errorResponse("Invalid request data"), { status: 400 })
    }

    const { userIds } = validation.data

    // Update users status to approved
    const { error: updateError } = await supabase
      .from("users")
      .update({ status: "approved" })
      .in("id", userIds)
      .neq("status", "approved") // Only update non-approved users

    if (updateError) {
      return NextResponse.json(errorResponse(updateError.message), { status: 500 })
    }

    // Log bulk approval activity
    const activities = userIds.map((userId) => ({
      user_id: user.id,
      action: "bulk_approve_users",
      resource_type: "user",
      resource_id: userId,
      details: {
        bulk_operation: true,
        approved_user_id: userId,
        total_users: userIds.length,
      },
      ip_address: request.headers.get("x-forwarded-for") || "127.0.0.1",
      user_agent: request.headers.get("user-agent"),
    }))

    await supabase.from("activity_log").insert(activities)

    return NextResponse.json(
      successResponse({ approved_count: userIds.length }, `Successfully approved ${userIds.length} user(s)`),
    )
  } catch (error) {
    console.error("Bulk approve error:", error)
    return NextResponse.json(errorResponse("Internal server error"), { status: 500 })
  }
})
