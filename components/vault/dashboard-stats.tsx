import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Folder, Star, Users } from "lucide-react"

interface DashboardStatsProps {
  userId: string
}

export default async function DashboardStats({ userId }: DashboardStatsProps) {
  const supabase = createClient()

  if (!supabase) {
    return null
  }

  // Get stats
  const [{ count: totalItems }, { count: personalItems }, { count: favoriteItems }, { count: categories }] =
    await Promise.all([
      supabase.from("items").select("*", { count: "exact", head: true }).eq("created_by", userId),
      supabase
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("created_by", userId)
        .in(
          "space_id",
          (await supabase.from("spaces").select("id").eq("owner_id", userId).eq("type", "personal")).data?.map(
            (s) => s.id,
          ) || [],
        ),
      supabase
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("created_by", userId)
        .eq("is_favorite", true),
      supabase.from("categories").select("*", { count: "exact", head: true }).eq("created_by", userId),
    ])

  const stats = [
    {
      title: "Total Items",
      value: totalItems || 0,
      icon: BookOpen,
      color: "text-blue-400",
    },
    {
      title: "Personal Items",
      value: personalItems || 0,
      icon: Users,
      color: "text-green-400",
    },
    {
      title: "Favorites",
      value: favoriteItems || 0,
      icon: Star,
      color: "text-yellow-400",
    },
    {
      title: "Categories",
      value: categories || 0,
      icon: Folder,
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
