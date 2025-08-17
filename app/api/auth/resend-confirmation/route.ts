import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { emailService } from "@/lib/utils/email-service"
import { withAuth, withRateLimit } from "@/lib/api/middleware"

export async function POST(request: NextRequest) {
  return withRateLimit(
    withAuth(async (request: NextRequest, { user }) => {
      try {
        const { data: userProfile } = await createClient()
          .from("users")
          .select("email, full_name, status")
          .eq("id", user.id)
          .single()

        if (!userProfile) {
          return NextResponse.json({ error: "User profile not found" }, { status: 404 })
        }

        if (userProfile.status === "approved") {
          return NextResponse.json({ error: "Account is already approved" }, { status: 400 })
        }

        const result = await emailService.resendConfirmationEmail(user.id, userProfile.email)

        if (!result.success) {
          return NextResponse.json({ error: result.error || "Failed to resend confirmation email" }, { status: 500 })
        }

        return NextResponse.json({
          message: "Confirmation email sent successfully",
          messageId: result.messageId,
        })
      } catch (error) {
        console.error("Resend confirmation error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
      }
    }),
  )(request)
}
