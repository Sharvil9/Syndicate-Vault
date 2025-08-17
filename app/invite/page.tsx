import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import InviteSignupForm from "@/components/auth/invite-signup-form"

export default async function InvitePage() {
  const supabase = createClient()

  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      redirect("/vault")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <InviteSignupForm />
    </div>
  )
}
