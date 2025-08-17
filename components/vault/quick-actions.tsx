import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Link, FileText, Upload, Bookmark } from "lucide-react"
import type { Space } from "@/lib/types/database"

interface QuickActionsProps {
  spaces: Space[]
}

export default function QuickActions({ spaces }: QuickActionsProps) {
  const actions = [
    {
      title: "Add Bookmark",
      description: "Save a link from the web",
      icon: Bookmark,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Create Note",
      description: "Write a new note",
      icon: FileText,
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Upload File",
      description: "Upload documents or media",
      icon: Upload,
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      title: "Quick Capture",
      description: "Use bookmarklet to save",
      icon: Link,
      color: "bg-orange-600 hover:bg-orange-700",
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant="ghost"
              className="w-full justify-start h-auto p-4 text-left hover:bg-slate-700/50"
            >
              <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                <action.icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-white">{action.title}</div>
                <div className="text-sm text-slate-400">{action.description}</div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Your Spaces</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {spaces.map((space) => (
            <div key={space.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-700/30">
              <div>
                <div className="font-medium text-white text-sm">{space.name}</div>
                <div className="text-xs text-slate-400 capitalize">{space.type}</div>
              </div>
              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
