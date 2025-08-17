"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useNotifications } from "@/components/ui/notification-system"
import { CheckSquare, Square, Users, UserCheck, UserX, Trash2, Shield } from "lucide-react"
import type { UserWithStats } from "@/lib/types/database"

interface BulkOperationsProps {
  users: UserWithStats[]
  onUsersUpdate: () => void
}

export default function BulkOperations({ users, onUsersUpdate }: BulkOperationsProps) {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const { addNotification } = useNotifications()

  const selectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)))
    }
  }

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const executeBulkAction = async () => {
    if (!bulkAction || selectedUsers.size === 0) return

    setIsLoading(true)
    try {
      const userIds = Array.from(selectedUsers)
      let endpoint = ""
      let method = "POST"
      const body: any = { userIds }

      switch (bulkAction) {
        case "approve":
          endpoint = "/api/admin/users/bulk-approve"
          break
        case "suspend":
          endpoint = "/api/admin/users/bulk-suspend"
          break
        case "make_admin":
          endpoint = "/api/admin/users/bulk-role"
          body.role = "admin"
          break
        case "make_member":
          endpoint = "/api/admin/users/bulk-role"
          body.role = "member"
          break
        case "delete":
          endpoint = "/api/admin/users/bulk-delete"
          method = "DELETE"
          break
      }

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (response.ok) {
        addNotification({
          type: "success",
          title: "Bulk Operation Completed",
          description: `Successfully ${bulkAction.replace("_", " ")} ${selectedUsers.size} user(s).`,
        })
        setSelectedUsers(new Set())
        setBulkAction("")
        onUsersUpdate()
      } else {
        throw new Error(result.error || "Bulk operation failed")
      }
    } catch (error) {
      addNotification({
        type: "error",
        title: "Bulk Operation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getBulkActionLabel = (action: string) => {
    switch (action) {
      case "approve":
        return "Approve Users"
      case "suspend":
        return "Suspend Users"
      case "make_admin":
        return "Make Admin"
      case "make_member":
        return "Make Member"
      case "delete":
        return "Delete Users"
      default:
        return "Select Action"
    }
  }

  const getBulkActionIcon = (action: string) => {
    switch (action) {
      case "approve":
        return <UserCheck className="h-4 w-4" />
      case "suspend":
        return <UserX className="h-4 w-4" />
      case "make_admin":
        return <Shield className="h-4 w-4" />
      case "make_member":
        return <Users className="h-4 w-4" />
      case "delete":
        return <Trash2 className="h-4 w-4" />
      default:
        return null
    }
  }

  const isDestructiveAction = (action: string) => {
    return ["suspend", "delete"].includes(action)
  }

  return (
    <div className="space-y-4">
      {/* Bulk Selection Header */}
      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={selectAll} className="text-slate-300 hover:text-white">
            {selectedUsers.size === users.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          </Button>
          <span className="text-sm text-slate-300">
            {selectedUsers.size > 0 ? (
              <>
                {selectedUsers.size} of {users.length} selected
              </>
            ) : (
              "Select users for bulk operations"
            )}
          </span>
        </div>

        {selectedUsers.size > 0 && (
          <div className="flex items-center gap-3">
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="w-48 bg-slate-900/50 border-slate-600">
                <SelectValue placeholder="Choose action..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="approve">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Approve Users
                  </div>
                </SelectItem>
                <SelectItem value="suspend">
                  <div className="flex items-center gap-2">
                    <UserX className="h-4 w-4" />
                    Suspend Users
                  </div>
                </SelectItem>
                <SelectItem value="make_admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Make Admin
                  </div>
                </SelectItem>
                <SelectItem value="make_member">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Make Member
                  </div>
                </SelectItem>
                <SelectItem value="delete">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Users
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {bulkAction && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant={isDestructiveAction(bulkAction) ? "destructive" : "default"}
                    disabled={isLoading}
                    className={isDestructiveAction(bulkAction) ? "" : "bg-purple-600 hover:bg-purple-700"}
                  >
                    {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : getBulkActionIcon(bulkAction)}
                    {isLoading ? "Processing..." : getBulkActionLabel(bulkAction)}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-800 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Confirm Bulk Action</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                      Are you sure you want to {bulkAction.replace("_", " ")} {selectedUsers.size} user(s)?
                      {isDestructiveAction(bulkAction) && (
                        <span className="block mt-2 text-red-400 font-medium">This action cannot be undone.</span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={executeBulkAction}
                      className={
                        isDestructiveAction(bulkAction)
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-purple-600 hover:bg-purple-700"
                      }
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </div>

      {/* User List with Selection */}
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
              selectedUsers.has(user.id)
                ? "bg-purple-600/20 border-purple-500/50"
                : "bg-slate-800/50 border-slate-700 hover:bg-slate-800/70"
            }`}
          >
            <Checkbox checked={selectedUsers.has(user.id)} onCheckedChange={() => toggleUser(user.id)} />

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="font-medium text-white">{user.full_name || "Unnamed User"}</span>
                <span className="text-slate-400">{user.email}</span>
                <Badge
                  variant={user.role === "admin" ? "default" : "secondary"}
                  className={user.role === "admin" ? "bg-purple-600 text-white" : "bg-slate-600 text-slate-300"}
                >
                  {user.role}
                </Badge>
                <Badge
                  variant={user.status === "approved" ? "default" : "secondary"}
                  className={
                    user.status === "approved"
                      ? "bg-green-600 text-white"
                      : user.status === "pending"
                        ? "bg-yellow-600 text-white"
                        : "bg-red-600 text-white"
                  }
                >
                  {user.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                <span>{user.item_count || 0} items</span>
                <span>{user.space_count || 0} spaces</span>
                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
