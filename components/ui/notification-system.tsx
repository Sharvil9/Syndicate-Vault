"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { ToastComponent, type Toast } from "@/components/ui/toast"
import { createClient } from "@/lib/supabase/client"

interface NotificationContextType {
  addNotification: (notification: Omit<Toast, "id">) => void
  removeNotification: (id: string) => void
  notifications: Toast[]
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
  userId?: string
}

export function NotificationProvider({ children, userId }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Toast[]>([])

  const addNotification = useCallback((notification: Omit<Toast, "id">) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
    setNotifications((prev) => [...prev, { ...notification, id }])
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // Real-time notifications via Supabase
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    // Subscribe to activity log for real-time notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_log",
          filter: `user_id=neq.${userId}`, // Don't notify about own actions
        },
        (payload) => {
          const activity = payload.new

          // Only show notifications for relevant actions
          const notifiableActions = [
            "user_approved",
            "edit_request_approved",
            "edit_request_rejected",
            "item_shared",
            "space_invitation",
          ]

          if (notifiableActions.includes(activity.action)) {
            addNotification({
              type: "info",
              title: getNotificationTitle(activity.action),
              description: getNotificationDescription(activity),
              duration: 8000,
            })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, addNotification])

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification, notifications }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {notifications.map((notification) => (
          <ToastComponent key={notification.id} {...notification} onRemove={removeNotification} />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

function getNotificationTitle(action: string): string {
  switch (action) {
    case "user_approved":
      return "Account Approved"
    case "edit_request_approved":
      return "Edit Request Approved"
    case "edit_request_rejected":
      return "Edit Request Rejected"
    case "item_shared":
      return "Item Shared"
    case "space_invitation":
      return "Space Invitation"
    default:
      return "Notification"
  }
}

function getNotificationDescription(activity: any): string {
  switch (activity.action) {
    case "user_approved":
      return "Your account has been approved by an administrator."
    case "edit_request_approved":
      return `Your edit request for "${activity.details?.title || "an item"}" has been approved.`
    case "edit_request_rejected":
      return `Your edit request for "${activity.details?.title || "an item"}" has been rejected.`
    case "item_shared":
      return `An item has been shared with you.`
    case "space_invitation":
      return `You've been invited to join a space.`
    default:
      return "You have a new notification."
  }
}
