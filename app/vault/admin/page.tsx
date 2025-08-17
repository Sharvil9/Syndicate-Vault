import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AdminStats from "@/components/admin/admin-stats"
import RecentActivity from "@/components/admin/recent-activity"
import PendingRequests from "@/components/admin/pending-requests"

export default async function AdminDashboard() {
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

  // Get pending edit requests
  const { data: pendingRequests } = await supabase
    .from("edit_requests")
    .select(`
      *,
      item:items(title, space:spaces(name)),
      requested_by:users!edit_requests_requested_by_fkey(full_name, email)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5)

  // Get recent activity
  const { data: recentActivity } = await supabase
    .from("activity_log")
    .select(`
      *,
      user:users(full_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">Manage users, permissions, and system activity</p>
      </div>

      <AdminStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PendingRequests requests={pendingRequests || []} />
        <RecentActivity activities={recentActivity || []} />
      </div>
    </div>
  )
}
