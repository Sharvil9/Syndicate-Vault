"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface PendingRequestsProps {
  requests: any[]
}

export default function PendingRequests({ requests }: PendingRequestsProps) {
  if (requests.length === 0) {
    return (
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Pending Edit Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-slate-400">No pending requests</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Pending Edit Requests</CardTitle>
        <Link href="/vault/admin/requests">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-start gap-4 p-4 rounded-lg bg-slate-900/30 hover:bg-slate-900/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium text-white truncate">
                  {request.title || request.item?.title || "Untitled"}
                </h3>
                <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400">
                  Pending
                </Badge>
              </div>

              <p className="text-sm text-slate-400 mb-2">
                Requested by {request.requested_by?.full_name || request.requested_by?.email}
              </p>

              {request.reason && <p className="text-sm text-slate-300 mb-2 line-clamp-2">"{request.reason}"</p>}

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}</span>
                {request.item?.space && (
                  <>
                    <span>•</span>
                    <span>{request.item.space.name}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="destructive">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
