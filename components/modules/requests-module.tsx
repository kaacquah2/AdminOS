"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { 
  Plus, 
  TrendingUp, 
  MessageCircle, 
  Filter, 
  Users, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  ArrowUp,
  Eye,
  Edit,
  UserPlus,
  Search,
  X
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"
import { NewRequestModal } from "@/components/modals/new-request-modal"
import { 
  getSupportRequests, 
  createSupportRequest, 
  updateSupportRequest, 
  getSupportQueue,
  getSupportTeamMembers,
  addCommentToSupportRequest,
  escalateSupportRequest,
  type SupportRequest 
} from "@/lib/database"
import { SupportManagerDashboard } from "./support-manager-dashboard"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export function RequestsModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  
  // Support Manager specific states
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedTicket, setSelectedTicket] = useState<SupportRequest | null>(null)
  const [showTicketDetail, setShowTicketDetail] = useState(false)
  const [showEscalateDialog, setShowEscalateDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [escalationReason, setEscalationReason] = useState("")
  const [escalationNotes, setEscalationNotes] = useState("")
  const [selectedAssignee, setSelectedAssignee] = useState("")
  const [newComment, setNewComment] = useState("")
  const [isInternalComment, setIsInternalComment] = useState(false)
  const [queueFilter, setQueueFilter] = useState<{status?: string; priority?: string; assignee_id?: string}>({})
  const [searchQuery, setSearchQuery] = useState("")
  
  const isSupportManager = user?.role === "support_manager" || user?.role === "super_admin"

  useEffect(() => {
    loadRequests()
    if (isSupportManager) {
      loadTeamMembers()
    }
  }, [user, isSupportManager])

  async function loadRequests() {
    try {
      setLoading(true)
      const data = isSupportManager 
        ? await getSupportRequests() // Load all tickets for manager
        : await getSupportRequests(user?.id) // Load user's tickets only
      setRequests(data || [])
    } catch (error) {
      console.error("Error loading requests:", error)
      toast({
        title: "Error",
        description: "Failed to load requests. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadTeamMembers() {
    try {
      const members = await getSupportTeamMembers()
      setTeamMembers(members || [])
    } catch (error) {
      console.error("Error loading team members:", error)
    }
  }

  const handleResolveRequest = async (id: string) => {
    try {
      await updateSupportRequest(id, {
        status: "Resolved",
        resolved_at: new Date().toISOString(),
      })
      await loadRequests()
      toast({
        title: "Success",
        description: "Request resolved successfully.",
      })
    } catch (error) {
      console.error("Error resolving request:", error)
      toast({
        title: "Error",
        description: "Failed to resolve request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEscalate = async () => {
    if (!selectedTicket || !selectedAssignee) return

    try {
      await escalateSupportRequest(selectedTicket.id, {
        escalated_by: user?.id || "",
        escalated_to: selectedAssignee,
        reason: escalationReason,
        notes: escalationNotes,
      })
      await loadRequests()
      setShowEscalateDialog(false)
      setSelectedTicket(null)
      setEscalationReason("")
      setEscalationNotes("")
      setSelectedAssignee("")
      toast({
        title: "Success",
        description: "Ticket escalated successfully.",
      })
    } catch (error) {
      console.error("Error escalating ticket:", error)
      toast({
        title: "Error",
        description: "Failed to escalate ticket. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAssign = async () => {
    if (!selectedTicket || !selectedAssignee) return

    try {
      const assignee = teamMembers.find(m => m.user_id === selectedAssignee)
      await updateSupportRequest(selectedTicket.id, {
        assignee_id: selectedAssignee,
        assignee_name: assignee?.user_profiles?.full_name || "Unknown",
        status: "In Progress",
        first_response_at: new Date().toISOString(),
      })
      await loadRequests()
      setShowAssignDialog(false)
      setSelectedTicket(null)
      setSelectedAssignee("")
      toast({
        title: "Success",
        description: "Ticket assigned successfully.",
      })
    } catch (error) {
      console.error("Error assigning ticket:", error)
      toast({
        title: "Error",
        description: "Failed to assign ticket. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddComment = async () => {
    if (!selectedTicket || !newComment.trim()) return

    try {
      await addCommentToSupportRequest(selectedTicket.id, {
        author: user?.fullName || "Unknown",
        text: newComment,
        isInternal: isInternalComment,
      })
      await loadRequests()
      setNewComment("")
      setIsInternalComment(false)
      toast({
        title: "Success",
        description: "Comment added successfully.",
      })
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePriority = async (ticketId: string, priority: string) => {
    try {
      await updateSupportRequest(ticketId, { priority })
      await loadRequests()
      toast({
        title: "Success",
        description: "Priority updated successfully.",
      })
    } catch (error) {
      console.error("Error updating priority:", error)
      toast({
        title: "Error",
        description: "Failed to update priority. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmitNewRequest = async (data: any) => {
    if (!user) return

    try {
      await createSupportRequest({
        type: data.type,
        title: data.title,
        description: data.description,
        requester_id: user.id,
        requester_name: user.fullName || "Unknown",
        priority: data.priority,
      })
      await loadRequests()
      setShowNewRequestModal(false)
      toast({
        title: "Success",
        description: "Request created successfully.",
      })
    } catch (error) {
      console.error("Error creating request:", error)
      toast({
        title: "Error",
        description: "Failed to create request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredRequests = filterPriority ? requests.filter((r) => r.priority === filterPriority) : requests

  // Calculate stats from actual data
  const openRequests = requests.filter((r) => r.status === "Pending" || r.status === "In Progress").length
  const resolvedThisMonth = requests.filter((r) => {
    if (r.status !== "Resolved" || !r.resolved_at) return false
    const resolvedDate = new Date(r.resolved_at)
    const now = new Date()
    return resolvedDate.getMonth() === now.getMonth() && resolvedDate.getFullYear() === now.getFullYear()
  }).length
  const highPriority = requests.filter((r) => r.priority === "High" && (r.status === "Pending" || r.status === "In Progress")).length

  // Calculate average resolution time (in days)
  const resolvedRequests = requests.filter((r) => r.status === "Resolved" && r.resolved_at && r.created_at)
  const avgResolutionTime =
    resolvedRequests.length > 0
      ? (
          resolvedRequests.reduce((acc, r) => {
            const created = new Date(r.created_at)
            const resolved = new Date(r.resolved_at!)
            return acc + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          }, 0) / resolvedRequests.length
        ).toFixed(1)
      : "0"

  // Calculate request types distribution
  const requestTypesMap = new Map<string, number>()
  requests.forEach((r) => {
    requestTypesMap.set(r.type, (requestTypesMap.get(r.type) || 0) + 1)
  })
  const requestTypes = Array.from(requestTypesMap.entries()).map(([name, value]) => ({ name, value }))

  // Calculate resolution trend (last 4 weeks)
  const now = new Date()
  const resolutionTrend = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (i + 1) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const resolved = requests.filter((r) => {
      if (!r.resolved_at) return false
      const resolvedDate = new Date(r.resolved_at)
      return resolvedDate >= weekStart && resolvedDate < weekEnd
    }).length

    const pending = requests.filter((r) => {
      const createdDate = new Date(r.created_at)
      return createdDate >= weekStart && createdDate < weekEnd && (r.status === "Pending" || r.status === "In Progress")
    }).length

    return {
      week: `Week ${4 - i}`,
      resolved,
      pending,
    }
  }).reverse()

  // Calculate priority stats
  const priorityStats = [
    {
      priority: "High",
      open: requests.filter((r) => r.priority === "High" && (r.status === "Pending" || r.status === "In Progress")).length,
      resolved: requests.filter((r) => r.priority === "High" && r.status === "Resolved").length,
    },
    {
      priority: "Medium",
      open: requests.filter((r) => r.priority === "Medium" && (r.status === "Pending" || r.status === "In Progress")).length,
      resolved: requests.filter((r) => r.priority === "Medium" && r.status === "Resolved").length,
    },
    {
      priority: "Low",
      open: requests.filter((r) => r.priority === "Low" && (r.status === "Pending" || r.status === "In Progress")).length,
      resolved: requests.filter((r) => r.priority === "Low" && r.status === "Resolved").length,
    },
  ]

  // Recent activity (last 5 resolved requests)
  const recentActivity = requests
    .filter((r) => r.status === "Resolved" && r.resolved_at)
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      request: r.title,
      user: r.assignee_name || r.requester_name,
      action: "Resolved",
      time: new Date(r.resolved_at!).toLocaleString(),
    }))

  const colors = ["#6366f1", "#f87171", "#34d399", "#fbbf24"]

  // Calculate days open
  const getDaysOpen = (request: SupportRequest) => {
    const created = new Date(request.created_at)
    const now = new Date()
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Calculate hours open for SLA
  const getHoursOpen = (request: SupportRequest) => {
    const created = new Date(request.created_at)
    const now = new Date()
    return ((now.getTime() - created.getTime()) / (1000 * 60 * 60)).toFixed(1)
  }

  // Get SLA status
  const getSLAStatus = (request: SupportRequest) => {
    const hoursOpen = parseFloat(getHoursOpen(request))
    const slaTarget = request.sla_target_hours || 24
    
    if (request.status === "Resolved" || request.status === "Closed") {
      return { status: "met", color: "bg-green-100 text-green-800" }
    }
    
    if (hoursOpen > slaTarget) {
      return { status: "breached", color: "bg-red-100 text-red-800" }
    }
    
    if (hoursOpen > slaTarget * 0.8) {
      return { status: "at_risk", color: "bg-yellow-100 text-yellow-800" }
    }
    
    return { status: "on_track", color: "bg-green-100 text-green-800" }
  }

  // Support Manager specific calculations
  const unassignedTickets = requests.filter(r => !r.assignee_id && r.status === "Pending").length
  const ticketsAtRisk = requests.filter(r => {
    const sla = getSLAStatus(r)
    return sla.status === "at_risk" || sla.status === "breached"
  }).length
  const escalatedTickets = requests.filter(r => (r.escalation_level || 0) > 0).length
  
  // Team workload
  const teamWorkload = teamMembers.map(member => {
    const memberTickets = requests.filter(r => r.assignee_id === member.user_id && (r.status === "Pending" || r.status === "In Progress"))
    return {
      ...member,
      ticketCount: memberTickets.length,
      utilization: member.max_concurrent_tickets > 0 
        ? (memberTickets.length / member.max_concurrent_tickets * 100).toFixed(0)
        : "0"
    }
  })

  // Filtered queue
  const filteredQueue = requests.filter(req => {
    const matchesStatus = !queueFilter.status || req.status === queueFilter.status
    const matchesPriority = !queueFilter.priority || req.priority === queueFilter.priority
    const matchesAssignee = !queueFilter.assignee_id || req.assignee_id === queueFilter.assignee_id
    const matchesSearch = !searchQuery || 
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requester_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesPriority && matchesAssignee && matchesSearch
  })

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading requests...</p>
        </div>
      </div>
    )
  }

  // Show Support Manager Dashboard if user is support manager
  if (isSupportManager) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Support Manager Dashboard</h1>
            <p className="text-muted-foreground">
              Manage team, monitor SLA compliance, and oversee support operations.
            </p>
          </div>
          <Button className="gap-2" onClick={() => setShowNewRequestModal(true)}>
            <Plus className="w-4 h-4" />
            New Request
          </Button>
        </div>
        <SupportManagerDashboard requests={requests} onRefresh={loadRequests} />
        <NewRequestModal
          isOpen={showNewRequestModal}
          onClose={() => setShowNewRequestModal(false)}
          onSubmit={handleSubmitNewRequest}
        />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Requests & Ticketing</h1>
          <p className="text-muted-foreground">Track and manage all internal requests and support tickets.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowNewRequestModal(true)}>
          <Plus className="w-4 h-4" />
          New Request
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Open Requests</p>
          <p className="text-3xl font-bold">{openRequests}</p>
          <p className="text-xs text-yellow-600 mt-2">Need attention</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Resolved This Month</p>
          <p className="text-3xl font-bold">{resolvedThisMonth}</p>
          <p className="text-xs text-green-600 mt-2">Completed</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Avg Resolution Time</p>
          <p className="text-3xl font-bold">{avgResolutionTime} days</p>
          <p className="text-xs text-blue-600 mt-2">Target: 2 days</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">High Priority</p>
          <p className="text-3xl font-bold">{highPriority}</p>
          <p className="text-xs text-red-600 mt-2">In progress</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Resolution Trend (Monthly)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resolutionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="week" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="resolved" fill="var(--color-primary)" />
              <Bar dataKey="pending" fill="var(--color-secondary)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Request Types Distribution</h3>
          {requestTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={requestTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {requestTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">No data available</div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Priority Status Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {priorityStats.map((stat) => (
            <div key={stat.priority} className="border border-border rounded-lg p-4">
              <p className="font-medium mb-2">{stat.priority} Priority</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Open</span>
                  <span className="text-lg font-semibold text-red-600">{stat.open}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Resolved (Month)</span>
                  <span className="text-lg font-semibold text-green-600">{stat.resolved}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Recent Requests</h3>
          <div className="flex gap-2">
            <Button
              variant={filterPriority === null ? "default" : "outline"}
              size="sm"
              className="gap-2 bg-transparent"
              onClick={() => setFilterPriority(null)}
            >
              <Filter className="w-4 h-4" />
              All
            </Button>
            {["High", "Medium", "Low"].map((priority) => (
              <Button
                key={priority}
                variant={filterPriority === priority ? "default" : "outline"}
                size="sm"
                className="gap-2 bg-transparent"
                onClick={() => setFilterPriority(priority)}
              >
                {priority}
              </Button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Request Type</th>
                <th className="text-left py-3 px-4 font-semibold">Title</th>
                <th className="text-left py-3 px-4 font-semibold">Requester</th>
                <th className="text-left py-3 px-4 font-semibold">Assigned To</th>
                <th className="text-left py-3 px-4 font-semibold">Priority</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
                <th className="text-left py-3 px-4 font-semibold">Days Open</th>
                <th className="text-left py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    No requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="py-4 px-4 font-medium">{req.type}</td>
                    <td className="py-4 px-4">{req.title}</td>
                    <td className="py-4 px-4">{req.requester_name}</td>
                    <td className="py-4 px-4">{req.assignee_name || "Unassigned"}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          req.priority === "High"
                            ? "bg-red-100 text-red-800"
                            : req.priority === "Medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {req.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          req.status === "Resolved"
                            ? "bg-green-100 text-green-800"
                            : req.status === "In Progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium">{getDaysOpen(req)}d</td>
                    <td className="py-4 px-4">
                      {req.status !== "Resolved" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveRequest(req.id)}
                          className="bg-transparent"
                        >
                          Resolve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {recentActivity.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 pb-4 border-b border-border last:border-b-0 last:pb-0"
              >
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.request}</p>
                  <p className="text-xs text-muted-foreground">{activity.user}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.action}</p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <NewRequestModal
        isOpen={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
        onSubmit={handleSubmitNewRequest}
      />
    </div>
  )
}
