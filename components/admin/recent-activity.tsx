import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface RecentActivityProps {
  activities: any[]
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "create":
        return "bg-green-600/20 text-green-400"
      case "update":
        return "bg-blue-600/20 text-blue-400"
      case "delete":
        return "bg-red-600/20 text-red-400"
      case "login":
        return "bg-purple-600/20 text-purple-400"
      default:
        return "bg-slate-600/20 text-slate-400"
    }
  }

  if (activities.length === 0) {
    return (
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-slate-400">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg bg-slate-900/30">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className={getActionColor(activity.action)}>
                  {activity.action}
                </Badge>
                <span className="text-sm text-slate-400 capitalize">{activity.resource_type}</span>
              </div>

              <p className="text-sm text-white mb-1">
                {activity.user?.full_name || activity.user?.email || "Unknown user"}
              </p>

              <div className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
