"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { Plus, Calendar, MapPin, Users, RefreshCw, DollarSign } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  getMarketingEvents,
  createMarketingEvent,
  type MarketingEvent
} from "@/lib/database"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function MarketingEventsModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<MarketingEvent[]>([])
  const [showNewEvent, setShowNewEvent] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [formData, setFormData] = useState({
    event_name: "",
    event_type: "",
    description: "",
    location: "",
    venue_name: "",
    venue_address: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    registration_required: false,
    registration_url: "",
    max_attendees: "",
    budget_allocated: "",
  })

  const isManager = user?.role === "dept_manager" || 
                    user?.role === "super_admin" ||
                    user?.department === "Marketing & Communications"

  useEffect(() => {
    loadEvents()
  }, [user])

  async function loadEvents() {
    if (!user) return
    try {
      setLoading(true)
      const data = await getMarketingEvents()
      setEvents(data || [])
    } catch (error) {
      console.error("Error loading events:", error)
      toast({
        title: "Error",
        description: "Failed to load events.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateEvent() {
    if (!user || !formData.event_name || !formData.event_type || !formData.start_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      await createMarketingEvent({
        event_name: formData.event_name,
        event_type: formData.event_type,
        description: formData.description,
        location: formData.location,
        venue_name: formData.venue_name,
        venue_address: formData.venue_address,
        start_date: formData.start_date,
        start_time: formData.start_time || undefined,
        end_date: formData.end_date || undefined,
        end_time: formData.end_time || undefined,
        registration_required: formData.registration_required,
        registration_url: formData.registration_url || undefined,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : undefined,
        budget_allocated: formData.budget_allocated ? parseFloat(formData.budget_allocated) : undefined,
        event_manager_id: user.id,
        event_manager_name: user.fullName,
        created_by: user.id,
        created_by_name: user.fullName,
      })
      await loadEvents()
      setShowNewEvent(false)
      setFormData({
        event_name: "",
        event_type: "",
        description: "",
        location: "",
        venue_name: "",
        venue_address: "",
        start_date: "",
        start_time: "",
        end_date: "",
        end_time: "",
        registration_required: false,
        registration_url: "",
        max_attendees: "",
        budget_allocated: "",
      })
      toast({
        title: "Success",
        description: "Event created successfully.",
      })
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Error",
        description: "Failed to create event.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "planning":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredEvents = events.filter((e) => {
    if (activeTab === "all") return true
    return e.status.toLowerCase() === activeTab.toLowerCase()
  })

  const now = new Date()
  const upcomingEvents = events.filter((e) => new Date(e.start_date) >= now && e.status !== "cancelled")
  const pastEvents = events.filter((e) => new Date(e.start_date) < now)
  const totalBudget = events.reduce((sum, e) => sum + (e.budget_allocated || 0), 0)
  const totalSpent = events.reduce((sum, e) => sum + (e.budget_spent || 0), 0)
  const totalLeads = events.reduce((sum, e) => sum + (e.leads_generated || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Event Management</h1>
          <p className="text-muted-foreground">Plan, manage, and track marketing events</p>
        </div>
        {isManager && (
          <Button onClick={() => setShowNewEvent(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Event
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">All events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalBudget / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">${(totalSpent / 1000).toFixed(1)}K spent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Leads Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">From all events</p>
          </CardContent>
        </Card>
      </div>

      {/* New Event Modal */}
      {showNewEvent && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Name *</Label>
                <Input
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  placeholder="Product Launch 2024"
                />
              </div>
              <div>
                <Label>Event Type *</Label>
                <Select value={formData.event_type} onValueChange={(value) => setFormData({ ...formData, event_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="trade_show">Trade Show</SelectItem>
                    <SelectItem value="product_launch">Product Launch</SelectItem>
                    <SelectItem value="networking">Networking</SelectItem>
                    <SelectItem value="press_event">Press Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, State"
                />
              </div>
              <div>
                <Label>Venue Name</Label>
                <Input
                  value={formData.venue_name}
                  onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                  placeholder="Venue name"
                />
              </div>
            </div>
            <div>
              <Label>Venue Address</Label>
              <Textarea
                value={formData.venue_address}
                onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                placeholder="Full address..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="registration_required"
                checked={formData.registration_required}
                onChange={(e) => setFormData({ ...formData, registration_required: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="registration_required">Registration Required</Label>
            </div>
            {formData.registration_required && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Registration URL</Label>
                  <Input
                    value={formData.registration_url}
                    onChange={(e) => setFormData({ ...formData, registration_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Max Attendees</Label>
                  <Input
                    type="number"
                    value={formData.max_attendees}
                    onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>
            )}
            <div>
              <Label>Budget Allocated</Label>
              <Input
                type="number"
                value={formData.budget_allocated}
                onChange={(e) => setFormData({ ...formData, budget_allocated: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateEvent} className="flex-1">
                Create Event
              </Button>
              <Button onClick={() => setShowNewEvent(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "upcoming" ? "Upcoming Events" : activeTab === "all" ? "All Events" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Events`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : (activeTab === "upcoming" ? upcomingEvents : filteredEvents).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No events found</p>
              ) : (
                <div className="space-y-4">
                  {(activeTab === "upcoming" ? upcomingEvents : filteredEvents).map((event) => (
                    <div key={event.id} className="p-4 border rounded-lg hover:bg-accent/50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{event.event_name}</h3>
                            <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                            <Badge variant="outline">{event.event_type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Date
                              </p>
                              <p className="font-medium">
                                {new Date(event.start_date).toLocaleDateString()}
                                {event.start_time && ` at ${event.start_time}`}
                              </p>
                            </div>
                            {event.location && (
                              <div>
                                <p className="text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  Location
                                </p>
                                <p className="font-medium">{event.location}</p>
                              </div>
                            )}
                            {event.registration_required && (
                              <div>
                                <p className="text-muted-foreground flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  Registration
                                </p>
                                <p className="font-medium">
                                  {event.registered_attendees} / {event.max_attendees || "∞"}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-muted-foreground flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                Budget
                              </p>
                              <p className="font-medium">
                                ${(event.budget_spent / 1000).toFixed(1)}K / ${(event.budget_allocated / 1000).toFixed(1)}K
                              </p>
                            </div>
                          </div>
                          {event.leads_generated > 0 && (
                            <div className="mt-2">
                              <Badge className="bg-green-100 text-green-800">
                                {event.leads_generated} leads generated
                              </Badge>
                            </div>
                          )}
                          {event.registration_url && (
                            <div className="mt-2">
                              <a
                                href={event.registration_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                Registration Link →
                              </a>
                            </div>
                          )}
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

