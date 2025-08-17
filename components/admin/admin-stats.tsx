import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, AlertCircle, Key } from "lucide-react"

export default async function AdminStats() {
  const supabase = createClient()

  if (!supabase) {
    return null
  }

  // Get admin stats
  const [{ count: totalUsers }, { count: totalItems }, { count: pendingRequests }, { count: activeInvites }] =
    await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("items").select("*", { count: "exact", head: true }),
      supabase.from("edit_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("invite_codes").select("*", { count: "exact", head: true }).is("used_by", null),
    ])

  const stats = [
    {
      title: "Total Users",
      value: totalUsers || 0,
      icon: Users,
      color: "text-blue-400",
    },
    {
      title: "Total Items",
      value: totalItems || 0,
      icon: FileText,
      color: "text-green-400",
    },
    {
      title: "Pending Requests",
      value: pendingRequests || 0,
      icon: AlertCircle,
      color: "text-yellow-400",
    },
    {
      title: "Active Invites",
      value: activeInvites || 0,
      icon: Key,
      color: "text-purple-400",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
