import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Star, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface RecentItemsProps {
  items: any[]
}

export default function RecentItems({ items }: RecentItemsProps) {
  if (items.length === 0) {
    return (
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">No items yet</p>
            <Button className="bg-purple-600 hover:bg-purple-700">Add Your First Item</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Recent Items</CardTitle>
        <Link href="/vault/items">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-4 p-4 rounded-lg bg-slate-900/30 hover:bg-slate-900/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium text-white truncate">{item.title}</h3>
                {item.is_favorite && <Star className="h-4 w-4 text-yellow-400 fill-current" />}
                {item.url && (
                  <Link href={item.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 text-slate-400 hover:text-white" />
                  </Link>
                )}
              </div>

              {item.excerpt && <p className="text-sm text-slate-400 mb-2 line-clamp-2">{item.excerpt}</p>}

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                {item.category && (
                  <>
                    <span>•</span>
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{ backgroundColor: item.category.color + "20", color: item.category.color }}
                    >
                      {item.category.icon} {item.category.name}
                    </Badge>
                  </>
                )}
                {item.space && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{item.space.type} Space</span>
                  </>
                )}
              </div>
            </div>

            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
