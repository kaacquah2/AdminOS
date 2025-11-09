"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { createAnnouncement, getAnnouncements } from "@/lib/database"
import { dbToAnnouncement, type Announcement } from "@/lib/type-adapters"
import { useToast } from "@/hooks/use-toast"
import { Bell, Plus, Pin } from "lucide-react"

export function AnnouncementsModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showNew, setShowNew] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "medium" as const,
    visibility: "all" as const,
  })

  useEffect(() => {
    loadAnnouncements()
  }, [user])

  async function loadAnnouncements() {
    if (user) {
      try {
        const userAnnouncements = await getAnnouncements(user.department, user.role)
        // Convert database format (snake_case) to frontend format (camelCase)
        const convertedAnnouncements = Array.isArray(userAnnouncements)
          ? userAnnouncements.map(dbToAnnouncement)
          : []
        setAnnouncements(convertedAnnouncements)
      } catch (error) {
        console.error('Error loading announcements:', error)
        setAnnouncements([]) // Ensure announcements is always an array
      }
    } else {
      setAnnouncements([]) // Ensure announcements is always an array when no user
    }
  }

  async function handleCreate() {
    if (!user || !formData.title || !formData.content) return

    try {
      const dbAnnouncement = await createAnnouncement({
        created_by: user.id,
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        visibility: formData.visibility,
        target_department: (formData.visibility as string) === "department" ? (user?.department || undefined) : undefined,
        target_role: (formData.visibility as string) === "role" ? (user?.role || undefined) : undefined,
      })

      // Convert to frontend format and add to announcements
      const announcement = dbToAnnouncement(dbAnnouncement)
      setAnnouncements([announcement, ...announcements]) // Add to beginning for newest first
      setFormData({ title: "", content: "", priority: "medium", visibility: "all" })
      setShowNew(false)
      
      // Reload announcements to get fresh data from database
      await loadAnnouncements()
      toast({
        title: "Success",
        description: "Announcement created successfully.",
      })
    } catch (error) {
      console.error('Error creating announcement:', error)
      toast({
        title: "Error",
        description: "Failed to create announcement. Please try again.",
        variant: "destructive",
      })
    }
  }

  const priorityColors: Record<string, string> = {
    low: "bg-blue-100 text-blue-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground">Important updates and company-wide announcements</p>
        </div>
        {(user?.role === "super_admin" || user?.permissions?.includes("manage_announcements")) && (
          <Button onClick={() => setShowNew(!showNew)} className="gap-2">
            <Plus size={20} />
            New Announcement
          </Button>
        )}
      </div>

      {showNew && (user?.role === "super_admin" || user?.permissions?.includes("manage_announcements")) && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Create Announcement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Announcement title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <textarea
                placeholder="Announcement content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option>low</option>
                  <option>medium</option>
                  <option>high</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Visibility</label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="all">All</option>
                  <option value="department">Department</option>
                  <option value="role">Role</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} className="flex-1">
                Create
              </Button>
              <Button onClick={() => setShowNew(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {announcements.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell size={48} className="text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No announcements</p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      <Badge className={priorityColors[announcement.priority]}>{announcement.priority}</Badge>
                    </div>
                    <CardDescription>By {announcement.createdBy}</CardDescription>
                  </div>
                  <Pin size={18} className="text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{announcement.content}</p>
                <p className="text-xs text-muted-foreground">{new Date(announcement.createdAt).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
