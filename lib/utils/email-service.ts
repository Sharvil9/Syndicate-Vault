import { emailTemplates } from "./email-templates"
import { createClient } from "@/lib/supabase/server"

export class EmailService {
  private static instance: EmailService

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async sendWelcomeEmail(userId: string, email: string, fullName: string, isFirstUser = false) {
    try {
      const template = emailTemplates.welcome(fullName, isFirstUser)

      // Log the email sending attempt
      const supabase = createClient()
      await supabase.from("activity_log").insert({
        user_id: userId,
        action: "email_sent",
        resource_type: "email",
        resource_id: email,
        details: {
          template: "welcome",
          subject: template.subject,
          is_first_user: isFirstUser,
        },
      })

      // In a real implementation, you would integrate with an email service like:
      // - Resend (recommended for Supabase)
      // - SendGrid
      // - Mailgun
      // - AWS SES

      console.log(`[EMAIL] Welcome email would be sent to ${email}:`, {
        subject: template.subject,
        isFirstUser,
        preview: template.text.substring(0, 100) + "...",
      })

      return { success: true, messageId: `welcome_${Date.now()}` }
    } catch (error) {
      console.error("Failed to send welcome email:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  async sendAccountApprovedEmail(userId: string, email: string, fullName: string) {
    try {
      const template = emailTemplates.accountApproved(fullName)

      const supabase = createClient()
      await supabase.from("activity_log").insert({
        user_id: userId,
        action: "email_sent",
        resource_type: "email",
        resource_id: email,
        details: {
          template: "account_approved",
          subject: template.subject,
        },
      })

      console.log(`[EMAIL] Account approved email would be sent to ${email}:`, {
        subject: template.subject,
        preview: template.text.substring(0, 100) + "...",
      })

      return { success: true, messageId: `approved_${Date.now()}` }
    } catch (error) {
      console.error("Failed to send account approved email:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  async sendMagicLinkEmail(email: string, fullName: string, magicLinkUrl: string) {
    try {
      const template = emailTemplates.magicLink(fullName, magicLinkUrl)

      console.log(`[EMAIL] Magic link email would be sent to ${email}:`, {
        subject: template.subject,
        linkUrl: magicLinkUrl,
        preview: template.text.substring(0, 100) + "...",
      })

      return { success: true, messageId: `magic_${Date.now()}` }
    } catch (error) {
      console.error("Failed to send magic link email:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  async resendConfirmationEmail(userId: string, email: string) {
    try {
      const supabase = createClient()

      // Get user details
      const { data: user } = await supabase.from("users").select("full_name, status").eq("id", userId).single()

      if (!user) {
        return { success: false, error: "User not found" }
      }

      // Use Supabase's built-in resend functionality
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/vault`,
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Log the resend attempt
      await supabase.from("activity_log").insert({
        user_id: userId,
        action: "email_resent",
        resource_type: "email",
        resource_id: email,
        details: {
          template: "confirmation_resend",
        },
      })

      return { success: true, messageId: `resend_${Date.now()}` }
    } catch (error) {
      console.error("Failed to resend confirmation email:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }
}

export const emailService = EmailService.getInstance()
