"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { Plus, Calendar, FileText, RefreshCw, Edit } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  getContentCalendar,
  createContentCalendarItem,
  type ContentCalendar
} from "@/lib/database"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ContentCalendarModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [contentItems, setContentItems] = useState<ContentCalendar[]>([])
  const [showNewContent, setShowNewContent] = useState(false)
  const [activeTab, setActiveTab] = useState("calendar")
  const [formData, setFormData] = useState({
    title: "",
    content_type: "",
    description: "",
    content_text: "",
    scheduled_date: "",
    scheduled_time: "",
    priority: "medium",
    channels: [] as string[],
    target_audience: "",
    keywords: [] as string[],
  })

  const isManager = user?.role === "dept_manager" || 
                    user?.role === "super_admin" ||
                    user?.department === "Marketing & Communications"

  useEffect(() => {
    loadContent()
  }, [user])

  async function loadContent() {
    if (!user) return
    try {
      setLoading(true)
      const data = await getContentCalendar()
      setContentItems(data || [])
    } catch (error) {
      console.error("Error loading content:", error)
      toast({
        title: "Error",
        description: "Failed to load content calendar.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateContent() {
    if (!user || !formData.title || !formData.content_type || !formData.scheduled_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      await createContentCalendarItem({
        title: formData.title,
        content_type: formData.content_type,
        description: formData.description,
        content_text: formData.content_text,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time || undefined,
        priority: formData.priority,
        assigned_to: user.id,
        assigned_to_name: user.fullName,
        created_by: user.id,
        created_by_name: user.fullName,
        channels: formData.channels,
        target_audience: formData.target_audience || undefined,
        keywords: formData.keywords,
      })
      await loadContent()
      setShowNewContent(false)
      setFormData({
        title: "",
        content_type: "",
        description: "",
        content_text: "",
        scheduled_date: "",
        scheduled_time: "",
        priority: "medium",
        channels: [],
        target_audience: "",
        keywords: [],
      })
      toast({
        title: "Success",
        description: "Content scheduled successfully.",
      })
    } catch (error) {
      console.error("Error creating content:", error)
      toast({
        title: "Error",
        description: "Failed to schedule content.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Group content by date
  const contentByDate = contentItems.reduce((acc: any, item: ContentCalendar) => {
    const date = item.scheduled_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(item)
    return acc
  }, {})

  const sortedDates = Object.keys(contentByDate).sort()

  // Get upcoming content (next 7 days)
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const upcomingContent = contentItems.filter((item) => {
    const itemDate = new Date(item.scheduled_date)
    return itemDate >= today && itemDate <= nextWeek
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Calendar</h1>
          <p className="text-muted-foreground">Schedule and manage your marketing content</p>
        </div>
        {isManager && (
          <Button onClick={() => setShowNewContent(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Schedule Content
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentItems.length}</div>
            <p className="text-xs text-muted-foreground">All items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contentItems.filter((c) => c.status === "scheduled").length}
            </div>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contentItems.filter((c) => c.status === "published").length}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingContent.length}</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* New Content Modal */}
      {showNewContent && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Schedule New Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Content title"
                />
              </div>
              <div>
                <Label>Content Type *</Label>
                <Select value={formData.content_type} onValueChange={(value) => setFormData({ ...formData, content_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog_post">Blog Post</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="infographic">Infographic</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="press_release">Press Release</SelectItem>
                    <SelectItem value="case_study">Case Study</SelectItem>
                    <SelectItem value="whitepaper">Whitepaper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Content description..."
                rows={2}
              />
            </div>
            <div>
              <Label>Content Text</Label>
              <Textarea
                value={formData.content_text}
                onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                placeholder="Content body text..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Scheduled Date *</Label>
                <Input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Scheduled Time</Label>
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Audience</Label>
                <Input
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  placeholder="e.g., B2B, Millennials"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateContent} className="flex-1">
                Schedule Content
              </Button>
              <Button onClick={() => setShowNewContent(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : sortedDates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No content scheduled</p>
              ) : (
                <div className="space-y-6">
                  {sortedDates.map((date) => (
                    <div key={date}>
                      <h3 className="font-semibold mb-3 text-lg">
                        {new Date(date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </h3>
                      <div className="space-y-3">
                        {contentByDate[date].map((item: ContentCalendar) => (
                          <div key={item.id} className="p-4 border rounded-lg hover:bg-accent/50 transition">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{item.title}</h4>
                                  <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                                  <Badge variant="outline">{item.content_type}</Badge>
                                  <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  {item.scheduled_time && (
                                    <span>
                                      <Calendar className="w-3 h-3 inline mr-1" />
                                      {item.scheduled_time}
                                    </span>
                                  )}
                                  {item.assigned_to_name && (
                                    <span>Assigned to: {item.assigned_to_name}</span>
                                  )}
                                  {item.channels && item.channels.length > 0 && (
                                    <span>Channels: {item.channels.join(", ")}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Content</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : contentItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No content found</p>
              ) : (
                <div className="space-y-3">
                  {contentItems.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg hover:bg-accent/50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{item.title}</h4>
                            <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                            <Badge variant="outline">{item.content_type}</Badge>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {new Date(item.scheduled_date).toLocaleDateString()}
                              {item.scheduled_time && ` at ${item.scheduled_time}`}
                            </span>
                            {item.assigned_to_name && <span>By: {item.assigned_to_name}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Content (Next 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingContent.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No upcoming content</p>
              ) : (
                <div className="space-y-3">
                  {upcomingContent.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg hover:bg-accent/50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{item.title}</h4>
                            <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                            <Badge variant="outline">{item.content_type}</Badge>
                            <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {new Date(item.scheduled_date).toLocaleDateString()}
                              {item.scheduled_time && ` at ${item.scheduled_time}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

