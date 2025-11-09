"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Check, Trash2 } from "lucide-react"

export function NotificationsModule() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "approval",
      title: "Expense Report Awaiting Approval",
      message: "Sarah Chen's expense report for $2,450 needs your approval",
      timestamp: "2 minutes ago",
      read: false,
      action: "Review",
    },
    {
      id: 2,
      type: "alert",
      title: "Leave Request Submitted",
      message: "Marcus Johnson submitted a leave request for Dec 15-20",
      timestamp: "1 hour ago",
      read: false,
      action: "Review",
    },
    {
      id: 3,
      type: "update",
      title: "Budget Alert",
      message: "Engineering department has exceeded 85% of monthly budget",
      timestamp: "3 hours ago",
      read: true,
      action: "View",
    },
    {
      id: 4,
      type: "reminder",
      title: "Payroll Processing",
      message: "Monthly payroll processing is due today",
      timestamp: "5 hours ago",
      read: true,
      action: "Process",
    },
    {
      id: 5,
      type: "info",
      title: "System Maintenance",
      message: "Scheduled maintenance completed successfully",
      timestamp: "1 day ago",
      read: true,
      action: "Dismiss",
    },
  ])

  const markAsRead = (id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const typeColors: Record<string, string> = {
    approval: "bg-blue-100 text-blue-800",
    alert: "bg-red-100 text-red-800",
    update: "bg-yellow-100 text-yellow-800",
    reminder: "bg-purple-100 text-purple-800",
    info: "bg-green-100 text-green-800",
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Notifications</h1>
        <p className="text-muted-foreground">
          {unreadCount > 0
            ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
            : "All caught up!"}
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          Mark all as read
        </Button>
        <Button variant="outline" size="sm">
          Clear all
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`p-4 ${!notification.read ? "bg-primary/5 border-primary/20" : ""} hover:bg-secondary/50 transition-colors`}
          >
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-2 mb-1">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${typeColors[notification.type]}`}
                  >
                    {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                  </span>
                  {!notification.read && <div className="w-2 h-2 rounded-full bg-primary mt-1" />}
                </div>
                <p className="font-semibold text-sm mb-1">{notification.title}</p>
                <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline">
                  {notification.action}
                </Button>
                <div className="flex gap-2">
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="p-1 hover:bg-secondary rounded transition-colors"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-1 hover:bg-secondary rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
