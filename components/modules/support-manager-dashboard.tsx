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
  Users, 
  AlertTriangle, 
  ArrowUp,
  Eye,
  UserPlus,
  Search,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { 
  getSupportRequests, 
  updateSupportRequest, 
  getSupportTeamMembers,
  addCommentToSupportRequest,
  escalateSupportRequest,
  type SupportRequest 
} from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface SupportManagerDashboardProps {
  requests: SupportRequest[]
  onRefresh: () => void
}

export function SupportManagerDashboard({ requests, onRefresh }: SupportManagerDashboardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedTicket, setSelectedTicket] = useState<SupportRequest | null>(null)
  const [showTicketDetail, setShowTicketDetail] = useState(false)
  const [showEscalateDialog, setShowEscalateDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [escalationReason, setEscalationReason] = useState("")
  const [escalationNotes, setEscalationNotes] = useState("")
  const [selectedAssignee, setSelectedAssignee] = useState("")
  const [newComment, setNewComment] = useState("")
  const [isInternalComment, setIsInternalComment] = useState(false)
  const [queueFilter, setQueueFilter] = useState<{status?: string; priority?: string; assignee_id?: string}>({})
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadTeamMembers()
  }, [])

  async function loadTeamMembers() {
    try {
      const members = await getSupportTeamMembers()
      setTeamMembers(members || [])
    } catch (error) {
      console.error("Error loading team members:", error)
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
      onRefresh()
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
      onRefresh()
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
      onRefresh()
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
      onRefresh()
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
      return { status: "met", color: "bg-green-100 text-green-800", label: "Met" }
    }
    
    if (hoursOpen > slaTarget) {
      return { status: "breached", color: "bg-red-100 text-red-800", label: "Breached" }
    }
    
    if (hoursOpen > slaTarget * 0.8) {
      return { status: "at_risk", color: "bg-yellow-100 text-yellow-800", label: "At Risk" }
    }
    
    return { status: "on_track", color: "bg-green-100 text-green-800", label: "On Track" }
  }

  // Support Manager specific calculations
  const unassignedTickets = requests.filter(r => !r.assignee_id && r.status === "Pending").length
  const ticketsAtRisk = requests.filter(r => {
    const sla = getSLAStatus(r)
    return sla.status === "at_risk" || sla.status === "breached"
  }).length
  const escalatedTickets = requests.filter(r => (r.escalation_level || 0) > 0).length
  const openRequests = requests.filter(r => r.status === "Pending" || r.status === "In Progress").length
  
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

  // Resolution trend
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

  // Request types
  const requestTypesMap = new Map<string, number>()
  requests.forEach((r) => {
    requestTypesMap.set(r.type, (requestTypesMap.get(r.type) || 0) + 1)
  })
  const requestTypes = Array.from(requestTypesMap.entries()).map(([name, value]) => ({ name, value }))
  const colors = ["#6366f1", "#f87171", "#34d399", "#fbbf24"]

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="queue">Queue</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="sla">SLA Monitor</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-6">
        {/* Manager Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Unassigned</p>
                  <p className="text-3xl font-bold">{unassignedTickets}</p>
                </div>
                <UserPlus className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-xs text-yellow-600 mt-2">Need assignment</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">SLA At Risk</p>
                  <p className="text-3xl font-bold text-yellow-600">{ticketsAtRisk}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Escalated</p>
                  <p className="text-3xl font-bold text-red-600">{escalatedTickets}</p>
                </div>
                <ArrowUp className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Require review</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Open Requests</p>
                  <p className="text-3xl font-bold">{openRequests}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Active tickets</p>
            </CardContent>
          </Card>
        </div>

        {/* Critical Tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Critical Tickets Requiring Attention</CardTitle>
          </CardHeader>
          <CardContent>
            {requests.filter(r => {
              const sla = getSLAStatus(r)
              return (sla.status === "breached" || sla.status === "at_risk" || r.priority === "High") && r.status !== "Resolved"
            }).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No critical tickets at this time.
              </div>
            ) : (
              <div className="space-y-2">
                {requests
                  .filter(r => {
                    const sla = getSLAStatus(r)
                    return (sla.status === "breached" || sla.status === "at_risk" || r.priority === "High") && r.status !== "Resolved"
                  })
                  .slice(0, 10)
                  .map(ticket => {
                    const sla = getSLAStatus(ticket)
                    return (
                      <div
                        key={ticket.id}
                        className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedTicket(ticket)
                          setShowTicketDetail(true)
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={sla.color}>{sla.label}</Badge>
                              <Badge className={
                                ticket.priority === "High" ? "bg-red-100 text-red-800" :
                                ticket.priority === "Medium" ? "bg-yellow-100 text-yellow-800" :
                                "bg-blue-100 text-blue-800"
                              }>
                                {ticket.priority}
                              </Badge>
                              {ticket.escalation_level && ticket.escalation_level > 0 && (
                                <Badge className="bg-purple-100 text-purple-800">
                                  Escalated (L{ticket.escalation_level})
                                </Badge>
                              )}
                            </div>
                            <p className="font-semibold text-sm">{ticket.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {ticket.requester_name} • {ticket.assignee_name || "Unassigned"} • {getHoursOpen(ticket)}h open
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTicket(ticket)
                              setShowTicketDetail(true)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Queue Tab - Continue in next part due to length */}
      <TabsContent value="queue" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Ticket Queue</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
                <Select
                  value={queueFilter.status || "all"}
                  onValueChange={(value) => setQueueFilter({ ...queueFilter, status: value === "all" ? undefined : value })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={queueFilter.priority || "all"}
                  onValueChange={(value) => setQueueFilter({ ...queueFilter, priority: value === "all" ? undefined : value })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Title</th>
                    <th className="text-left py-3 px-4 font-semibold">Requester</th>
                    <th className="text-left py-3 px-4 font-semibold">Assigned</th>
                    <th className="text-left py-3 px-4 font-semibold">Priority</th>
                    <th className="text-left py-3 px-4 font-semibold">SLA</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No tickets found
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map(ticket => {
                      const sla = getSLAStatus(ticket)
                      return (
                        <tr key={ticket.id} className="border-b border-border hover:bg-secondary/50">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium">{ticket.title}</p>
                              <p className="text-xs text-muted-foreground">{ticket.category || ticket.type}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">{ticket.requester_name}</td>
                          <td className="py-4 px-4">{ticket.assignee_name || "Unassigned"}</td>
                          <td className="py-4 px-4">
                            <Select
                              value={ticket.priority}
                              onValueChange={(value) => handleUpdatePriority(ticket.id, value)}
                            >
                              <SelectTrigger className="w-24 h-7">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={sla.color}>{sla.label}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">{getHoursOpen(ticket)}h</p>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={
                              ticket.status === "Resolved" ? "bg-green-100 text-green-800" :
                              ticket.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {ticket.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedTicket(ticket)
                                  setShowTicketDetail(true)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!ticket.assignee_id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedTicket(ticket)
                                    setShowAssignDialog(true)
                                  }}
                                >
                                  <UserPlus className="w-4 h-4" />
                                </Button>
                              )}
                              {(ticket.status === "Pending" || ticket.status === "In Progress") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedTicket(ticket)
                                    setShowEscalateDialog(true)
                                  }}
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Team Tab */}
      <TabsContent value="team" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Team Workload & Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {teamWorkload.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No team members found. Add team members to the support_team_members table.
              </div>
            ) : (
              <div className="space-y-4">
                {teamWorkload.map(member => (
                  <div key={member.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{member.user_profiles?.full_name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.team_role} • {member.availability_status}
                        </p>
                      </div>
                      <Badge className={
                        parseFloat(member.utilization) > 90 ? "bg-red-100 text-red-800" :
                        parseFloat(member.utilization) > 70 ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"
                      }>
                        {member.utilization}% utilized
                      </Badge>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Active Tickets: {member.ticketCount}</span>
                        <span>Max: {member.max_concurrent_tickets}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            parseFloat(member.utilization) > 90 ? "bg-red-600" :
                            parseFloat(member.utilization) > 70 ? "bg-yellow-600" :
                            "bg-green-600"
                          }`}
                          style={{ width: `${Math.min(parseFloat(member.utilization), 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* SLA Monitor Tab */}
      <TabsContent value="sla" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>SLA Compliance Monitor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">On Track</p>
                <p className="text-3xl font-bold text-green-600">
                  {requests.filter(r => getSLAStatus(r).status === "on_track").length}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">At Risk</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {requests.filter(r => getSLAStatus(r).status === "at_risk").length}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Breached</p>
                <p className="text-3xl font-bold text-red-600">
                  {requests.filter(r => getSLAStatus(r).status === "breached").length}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {requests
                .filter(r => {
                  const sla = getSLAStatus(r)
                  return (sla.status === "at_risk" || sla.status === "breached") && r.status !== "Resolved"
                })
                .map(ticket => {
                  const sla = getSLAStatus(ticket)
                  return (
                    <div
                      key={ticket.id}
                      className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedTicket(ticket)
                        setShowTicketDetail(true)
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={sla.color}>{sla.label}</Badge>
                            <Badge>{ticket.priority}</Badge>
                          </div>
                          <p className="font-semibold text-sm">{ticket.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getHoursOpen(ticket)}h / {ticket.sla_target_hours || 24}h target
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Reports Tab */}
      <TabsContent value="reports" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Resolution Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={resolutionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="week" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip />
                <Bar dataKey="resolved" fill="var(--color-primary)" />
                <Bar dataKey="pending" fill="var(--color-secondary)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Request Types</h3>
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">No data</div>
            )}
          </Card>
        </div>
      </TabsContent>

      {/* Dialogs */}
      {/* Escalation Dialog */}
      <Dialog open={showEscalateDialog} onOpenChange={setShowEscalateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalate Ticket</DialogTitle>
            <DialogDescription>
              Escalate this ticket to a senior agent or manager.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Escalate To</Label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map(member => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.user_profiles?.full_name || "Unknown"} ({member.team_role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Select value={escalationReason} onValueChange={setEscalationReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sla_at_risk">SLA At Risk</SelectItem>
                  <SelectItem value="sla_breached">SLA Breached</SelectItem>
                  <SelectItem value="technical_complexity">Technical Complexity</SelectItem>
                  <SelectItem value="customer_complaint">Customer Complaint</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={escalationNotes}
                onChange={(e) => setEscalationNotes(e.target.value)}
                placeholder="Add escalation notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEscalateDialog(false)}>Cancel</Button>
            <Button onClick={handleEscalate} disabled={!selectedAssignee || !escalationReason}>
              Escalate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Ticket</DialogTitle>
            <DialogDescription>
              Assign this ticket to a team member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Assign To</Label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map(member => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.user_profiles?.full_name || "Unknown"} ({member.team_role}) - {member.ticketCount || 0} tickets
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedAssignee}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDetail} onOpenChange={setShowTicketDetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getSLAStatus(selectedTicket).color}>
                  {getSLAStatus(selectedTicket).label}
                </Badge>
                <Badge className={
                  selectedTicket.priority === "High" ? "bg-red-100 text-red-800" :
                  selectedTicket.priority === "Medium" ? "bg-yellow-100 text-yellow-800" :
                  "bg-blue-100 text-blue-800"
                }>
                  {selectedTicket.priority}
                </Badge>
                {selectedTicket.escalation_level && selectedTicket.escalation_level > 0 && (
                  <Badge className="bg-purple-100 text-purple-800">
                    Escalated Level {selectedTicket.escalation_level}
                  </Badge>
                )}
              </div>

              <div>
                <Label>Title</Label>
                <p className="text-sm font-semibold">{selectedTicket.title}</p>
              </div>

              <div>
                <Label>Description</Label>
                <p className="text-sm">{selectedTicket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Requester</Label>
                  <p className="text-sm">{selectedTicket.requester_name}</p>
                </div>
                <div>
                  <Label>Assigned To</Label>
                  <p className="text-sm">{selectedTicket.assignee_name || "Unassigned"}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p className="text-sm">{selectedTicket.status}</p>
                </div>
                <div>
                  <Label>Hours Open</Label>
                  <p className="text-sm">{getHoursOpen(selectedTicket)}h</p>
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <Label>Comments</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedTicket.comments?.map(comment => (
                    <div key={comment.id} className="p-2 bg-secondary rounded text-sm">
                      <p className="font-medium text-xs">{comment.author}</p>
                      <p className="text-xs text-muted-foreground">{new Date(comment.timestamp).toLocaleString()}</p>
                      <p className="mt-1">{comment.text}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="internal"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                    />
                    <Label htmlFor="internal" className="text-sm">Internal note (team only)</Label>
                  </div>
                  <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                    Add Comment
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                {!selectedTicket.assignee_id && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTicketDetail(false)
                      setShowAssignDialog(true)
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assign
                  </Button>
                )}
                {(selectedTicket.status === "Pending" || selectedTicket.status === "In Progress") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTicketDetail(false)
                      setShowEscalateDialog(true)
                    }}
                  >
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Escalate
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}

