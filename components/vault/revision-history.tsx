"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useNotifications } from "@/components/ui/notification-system"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { History, RotateCcw, Eye, User, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Revision } from "@/lib/types/database"

interface RevisionHistoryProps {
  itemId: string
  onRevert?: (revisionId: string) => void
}

interface RevisionWithUser extends Revision {
  creator: {
    id: string
    full_name?: string
    email: string
  }
}

export default function RevisionHistory({ itemId, onRevert }: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<RevisionWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [reverting, setReverting] = useState<string | null>(null)
  const [selectedRevision, setSelectedRevision] = useState<RevisionWithUser | null>(null)
  const { addNotification } = useNotifications()

  useEffect(() => {
    fetchRevisions()
  }, [itemId])

  const fetchRevisions = async () => {
    try {
      const response = await fetch(`/api/items/${itemId}/revisions`)
      const data = await response.json()

      if (response.ok) {
        setRevisions(data.revisions)
      } else {
        throw new Error(data.error || "Failed to fetch revisions")
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Failed to Load Revisions",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRevert = async (revisionId: string) => {
    setReverting(revisionId)
    try {
      const response = await fetch(`/api/items/${itemId}/revert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId }),
      })

      const data = await response.json()

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Item Reverted",
          description: "The item has been successfully reverted to the selected revision.",
        })
        onRevert?.(revisionId)
        fetchRevisions() // Refresh to show new revision
      } else {
        throw new Error(data.error || "Failed to revert item")
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Revert Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      })
    } finally {
      setReverting(null)
    }
  }

  const getChangedFieldsDisplay = (fields: string[]) => {
    const fieldLabels: Record<string, string> = {
      title: "Title",
      content: "Content",
      tags: "Tags",
      category_id: "Category",
      is_favorite: "Favorite Status",
      url: "URL",
      excerpt: "Excerpt",
    }

    return fields.map((field) => fieldLabels[field] || field).join(", ")
  }

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-slate-400">Loading revision history...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <History className="h-5 w-5" />
          Revision History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {revisions.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No revision history available</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {revisions.map((revision, index) => (
                <div
                  key={revision.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-purple-400">{revisions.length - index}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="border-slate-600 text-slate-400">
                        {getChangedFieldsDisplay(revision.changed_fields)}
                      </Badge>
                      {index === 0 && <Badge className="bg-green-600 text-white">Current</Badge>}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{revision.creator.full_name || revision.creator.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(revision.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>

                    {revision.title && (
                      <div className="mb-2">
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Title:</span>
                        <p className="text-sm text-slate-300 mt-1">{revision.title}</p>
                      </div>
                    )}

                    {revision.content && (
                      <div className="mb-2">
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Content:</span>
                        <p className="text-sm text-slate-300 mt-1 line-clamp-3">{revision.content}</p>
                      </div>
                    )}

                    {revision.tags && revision.tags.length > 0 && (
                      <div className="mb-2">
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Tags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {revision.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs border-slate-600 text-slate-400">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRevision(revision)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {index > 0 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white"
                            disabled={reverting === revision.id}
                          >
                            {reverting === revision.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-800 border-slate-700">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Revert to This Revision</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-400">
                              Are you sure you want to revert to this revision? This will create a new revision with the
                              content from the selected version.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevert(revision.id)}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              Revert
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Revision Preview Modal */}
        {selectedRevision && (
          <AlertDialog open={!!selectedRevision} onOpenChange={() => setSelectedRevision(null)}>
            <AlertDialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Revision Preview</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  Viewing revision from{" "}
                  {formatDistanceToNow(new Date(selectedRevision.created_at), { addSuffix: true })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="max-h-96 overflow-y-auto space-y-4">
                {selectedRevision.title && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Title</h4>
                    <p className="text-slate-300 bg-slate-900/50 p-3 rounded">{selectedRevision.title}</p>
                  </div>
                )}
                {selectedRevision.content && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Content</h4>
                    <div className="text-slate-300 bg-slate-900/50 p-3 rounded whitespace-pre-wrap">
                      {selectedRevision.content}
                    </div>
                  </div>
                )}
                {selectedRevision.tags && selectedRevision.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRevision.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="border-slate-600 text-slate-400">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600">Close</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  )
}
