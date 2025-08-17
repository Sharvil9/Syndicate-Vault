import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardStats from "@/components/vault/dashboard-stats"
import RecentItems from "@/components/vault/recent-items"
import QuickActions from "@/components/vault/quick-actions"

export default async function VaultDashboard() {
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

  // Get user's spaces and recent items
  const { data: spaces } = await supabase.from("spaces").select("*").or(`owner_id.eq.${user.id},type.eq.common`)

  const { data: recentItems } = await supabase
    .from("items")
    .select(`
      *,
      category:categories(name, icon, color),
      space:spaces(name, type)
    `)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(6)

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Welcome back to your vault</p>
      </div>

      <DashboardStats userId={user.id} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentItems items={recentItems || []} />
        </div>
        <div>
          <QuickActions spaces={spaces || []} />
        </div>
      </div>
    </div>
  )
}
