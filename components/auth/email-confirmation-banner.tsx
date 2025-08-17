"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mail, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"

interface EmailConfirmationBannerProps {
  userEmail: string
  isConfirmed: boolean
  onResend?: () => Promise<void>
}

export function EmailConfirmationBanner({ userEmail, isConfirmed, onResend }: EmailConfirmationBannerProps) {
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")

  const handleResend = async () => {
    if (!onResend) return

    setIsResending(true)
    setResendMessage("")

    try {
      await onResend()
      setResendMessage("Confirmation email sent! Check your inbox.")
    } catch (error) {
      setResendMessage("Failed to send email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  if (isConfirmed) {
    return (
      <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-green-300 font-medium">Email Confirmed</p>
            <p className="text-green-400/80 text-sm">Your email {userEmail} has been verified.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <p className="text-amber-300 font-medium">Email Confirmation Required</p>
            <p className="text-amber-400/80 text-sm mb-2">
              Please check your email ({userEmail}) and click the confirmation link to verify your account.
            </p>
            {resendMessage && (
              <p className={`text-sm ${resendMessage.includes("sent") ? "text-green-400" : "text-red-400"}`}>
                {resendMessage}
              </p>
            )}
          </div>
        </div>
        {onResend && (
          <Button
            onClick={handleResend}
            disabled={isResending}
            variant="outline"
            size="sm"
            className="border-amber-600 text-amber-300 hover:bg-amber-900/30 bg-transparent"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Resend Email
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
