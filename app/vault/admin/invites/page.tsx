import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import InviteManagement from "@/components/admin/invite-management"

export default async function AdminInvitesPage() {
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

  // Check if user is admin
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/vault")
  }

  // Get all invite codes
  const { data: invites } = await supabase
    .from("invite_codes")
    .select(`
      *,
      created_by:users!invite_codes_created_by_fkey(full_name, email),
      used_by:users!invite_codes_used_by_fkey(full_name, email)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Invite Management</h1>
        <p className="text-slate-400">Generate and manage invite codes</p>
      </div>

      <InviteManagement invites={invites || []} />
    </div>
  )
}
