import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import BookmarkletSetup from "@/components/vault/bookmarklet-setup"

export default async function BookmarkletPage() {
  const supabase = createClient()

  if (!supabase) {
    redirect("/auth/login")
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Save from Web</h1>
        <p className="text-slate-400">Set up tools to capture content from any website</p>
      </div>

      <BookmarkletSetup />
    </div>
  )
}
