import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import UserManagement from "@/components/admin/user-management"

export default async function AdminUsersPage() {
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

  // Get all users
  const { data: users } = await supabase
    .from("users")
    .select(`
      *,
      invited_by:users!users_invited_by_fkey(full_name, email)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-slate-400">Manage user accounts, roles, and permissions</p>
      </div>

      <UserManagement users={users || []} />
    </div>
  )
}
