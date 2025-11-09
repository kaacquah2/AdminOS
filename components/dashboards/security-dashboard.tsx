"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, 
  AlertTriangle, 
  AlertCircle,
  Lock,
  UserCheck,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Key,
  FileSearch,
  Plus,
  Eye as EyeIcon,
  Download
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  getAccessLogs,
  getSecurityIncidents,
  getAccessRequests,
  getAccessReviews,
  getSecurityAlerts,
  getPermissionChangesAudit,
  createSecurityIncident,
  createAccessRequest,
  createAccessReview,
  updateSecurityIncident,
  updateAccessRequest,
  updateAccessReview,
  updateSecurityAlert,
} from "@/lib/database"
import { ReportSecurityIncidentModal } from "@/components/modals/report-security-incident-modal"
import { CreateAccessRequestModal } from "@/components/modals/create-access-request-modal"
import { ScheduleAccessReviewModal } from "@/components/modals/schedule-access-review-modal"

export function SecurityDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Data states
  const [accessLogs, setAccessLogs] = useState<any[]>([])
  const [securityIncidents, setSecurityIncidents] = useState<any[]>([])
  const [accessRequests, setAccessRequests] = useState<any[]>([])
  const [accessReviews, setAccessReviews] = useState<any[]>([])
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([])
  const [permissionChanges, setPermissionChanges] = useState<any[]>([])

  // Modal states
  const [showReportIncident, setShowReportIncident] = useState(false)
  const [showCreateRequest, setShowCreateRequest] = useState(false)
  const [showScheduleReview, setShowScheduleReview] = useState(false)
  const [showRequestDetail, setShowRequestDetail] = useState(false)
  const [showIncidentDetail, setShowIncidentDetail] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [selectedIncident, setSelectedIncident] = useState<any>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [incidentResolution, setIncidentResolution] = useState("")

  // Metrics
  const [metrics, setMetrics] = useState({
    activeAlerts: 0,
    criticalAlerts: 0,
    failedLogins24h: 0,
    failedLogins7d: 0,
    pendingRequests: 0,
    openIncidents: 0,
    resolvedIncidents: 0,
    accessReviewsDue: 0,
    permissionChanges30d: 0,
  })

  const isManager = user?.role === "security_manager" || 
                    user?.role === "security_admin" || 
                    user?.role === "super_admin" ||
                    user?.department === "Security & Access Control"

  useEffect(() => {
    loadSecurityData()
  }, [user])

  async function loadSecurityData() {
    if (!user) return

    try {
      setLoading(true)

      // Load access logs - managers see all, others see their own
      const logsData = await getAccessLogs(
        isManager ? undefined : { user_id: user.id }
      )
      setAccessLogs(logsData || [])

      // Load security incidents - managers see all
      const incidentsData = isManager 
        ? await getSecurityIncidents()
        : await getSecurityIncidents({ status: "reported" })
      setSecurityIncidents(incidentsData || [])

      // Load access requests - managers see all, others see their own
      const requestsData = await getAccessRequests(
        isManager ? undefined : { requester_id: user.id }
      )
      setAccessRequests(requestsData || [])

      // Load access reviews - managers see all
      const reviewsData = isManager 
        ? await getAccessReviews()
        : await getAccessReviews({ target_user_id: user.id })
      setAccessReviews(reviewsData || [])

      // Load security alerts - managers see all
      const alertsData = await getSecurityAlerts()
      setSecurityAlerts(alertsData || [])

      // Load permission changes audit - managers see all
      const changesData = await getPermissionChangesAudit(
        isManager ? undefined : { user_id: user.id }
      )
      setPermissionChanges(changesData || [])

      // Calculate metrics
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const activeAlerts = (alertsData || []).filter((a: any) => a.status === "active").length
      const criticalAlerts = (alertsData || []).filter((a: any) => a.status === "active" && a.severity === "critical").length

      const failedLogins24h = (logsData || []).filter(
        (l: any) => l.action_type === "failed_login" && new Date(l.created_at) >= yesterday
      ).length

      const failedLogins7d = (logsData || []).filter(
        (l: any) => l.action_type === "failed_login" && new Date(l.created_at) >= sevenDaysAgo
      ).length

      const pendingRequests = (requestsData || []).filter((r: any) => r.status === "pending").length

      const openIncidents = (incidentsData || []).filter(
        (i: any) => i.status === "reported" || i.status === "investigating"
      ).length

      const resolvedIncidents = (incidentsData || []).filter((i: any) => i.status === "resolved" || i.status === "closed").length

      const reviewsDue = (reviewsData || []).filter(
        (r: any) => r.status === "pending" && new Date(r.review_date) <= now
      ).length

      const changes30d = (changesData || []).filter(
        (c: any) => new Date(c.change_date) >= thirtyDaysAgo
      ).length

      setMetrics({
        activeAlerts,
        criticalAlerts,
        failedLogins24h,
        failedLogins7d,
        pendingRequests,
        openIncidents,
        resolvedIncidents,
        accessReviewsDue: reviewsDue,
        permissionChanges30d: changes30d,
      })
    } catch (error) {
      console.error("Error loading security data:", error)
      toast({
        title: "Error",
        description: "Failed to load security data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleExportReport(reportType: string) {
    // Export functionality placeholder
    toast({
      title: "Export",
      description: `Exporting ${reportType} report...`,
    })
    // TODO: Implement actual export functionality
  }

  // Failed login trends (last 7 days)
  const failedLoginTrend = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayStart = new Date(date.setHours(0, 0, 0, 0))
    const dayEnd = new Date(date.setHours(23, 59, 59, 999))

    const dayLogins = accessLogs.filter((l: any) => {
      const logDate = new Date(l.created_at)
      return l.action_type === "failed_login" && logDate >= dayStart && logDate <= dayEnd
    }).length

    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      count: dayLogins,
    }
  })

  // Access logs by action type
  const logsByAction = accessLogs.reduce((acc: any, log: any) => {
    acc[log.action_type] = (acc[log.action_type] || 0) + 1
    return acc
  }, {})

  const logsByActionData = Object.entries(logsByAction).map(([action, count]) => ({
    action: action.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    count,
  }))

  // Security incidents by type
  const incidentsByType = securityIncidents.reduce((acc: any, inc: any) => {
    acc[inc.incident_type] = (acc[inc.incident_type] || 0) + 1
    return acc
  }, {})

  const incidentsByTypeData = Object.entries(incidentsByType).map(([type, count]) => ({
    type: type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    count,
  }))

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading security dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Security & Access Control Dashboard</h1>
          <p className="text-muted-foreground">
            {isManager 
              ? "Monitor security events, access control, incidents, and compliance."
              : "View your access logs and security-related information."}
          </p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <Button onClick={() => setShowReportIncident(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Report Incident
            </Button>
            <Button variant="outline" onClick={() => setShowScheduleReview(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Schedule Review
            </Button>
            <Button variant="outline" onClick={() => {
              // Create dropdown menu
              const menu = document.createElement("div")
              menu.className = "fixed bg-white border rounded-lg shadow-lg p-2 z-50 min-w-[200px]"
              menu.style.top = "60px"
              menu.style.right = "20px"
              
              const options = [
                { label: "Export Access Logs", value: "access_logs" },
                { label: "Export Incidents", value: "security_incidents" },
                { label: "Export Requests", value: "access_requests" },
                { label: "Export Reviews", value: "access_reviews" },
                { label: "Export Alerts", value: "security_alerts" },
                { label: "Export Permission Changes", value: "permission_changes" },
              ]
              
              options.forEach(option => {
                const button = document.createElement("button")
                button.className = "w-full text-left px-4 py-2 hover:bg-gray-100 rounded text-sm"
                button.textContent = option.label
                button.onclick = () => {
                  handleExportReport(option.value)
                  if (document.body.contains(menu)) {
                    document.body.removeChild(menu)
                  }
                }
                menu.appendChild(button)
              })
              
              document.body.appendChild(menu)
              
              // Close menu when clicking outside
              const closeMenu = (e: MouseEvent) => {
                if (document.body.contains(menu) && !menu.contains(e.target as Node)) {
                  document.body.removeChild(menu)
                  document.removeEventListener("click", closeMenu)
                }
              }
              setTimeout(() => document.addEventListener("click", closeMenu), 100)
            }} className="gap-2">
              <Download className="w-4 h-4" />
              Export Reports
            </Button>
          </div>
        )}
        {!isManager && (
          <Button onClick={() => setShowCreateRequest(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Request Access
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Access Logs</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="requests">Access Requests</TabsTrigger>
          <TabsTrigger value="reviews">Access Reviews</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Security Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Alerts</p>
                    <p className="text-3xl font-bold">{metrics.activeAlerts}</p>
                    {metrics.criticalAlerts > 0 && (
                      <p className="text-xs text-red-600 mt-1">{metrics.criticalAlerts} critical</p>
                    )}
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Failed Logins (24h)</p>
                    <p className="text-3xl font-bold">{metrics.failedLogins24h}</p>
                    <p className="text-xs text-muted-foreground mt-1">{metrics.failedLogins7d} in last 7 days</p>
                  </div>
                  <Shield className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pending Requests</p>
                    <p className="text-3xl font-bold text-yellow-600">{metrics.pendingRequests}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Open Incidents</p>
                    <p className="text-3xl font-bold text-red-600">{metrics.openIncidents}</p>
                    <p className="text-xs text-muted-foreground mt-1">{metrics.resolvedIncidents} resolved</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Access Reviews Due</p>
                    <p className="text-2xl font-bold">{metrics.accessReviewsDue}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Permission Changes (30d)</p>
                    <p className="text-2xl font-bold">{metrics.permissionChanges30d}</p>
                  </div>
                  <Key className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Access Logs</p>
                    <p className="text-2xl font-bold">{accessLogs.length}</p>
                  </div>
                  <FileSearch className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Failed Login Attempts (7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={failedLoginTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Access Logs by Action Type</CardTitle>
              </CardHeader>
              <CardContent>
                {logsByActionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={logsByActionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ action, count }) => `${action}: ${count}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {logsByActionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No access log data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Critical Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Security Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {securityAlerts.filter((a: any) => a.status === "active").slice(0, 5).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No active alerts</div>
                ) : (
                  <div className="space-y-3">
                    {securityAlerts
                      .filter((a: any) => a.status === "active")
                      .slice(0, 5)
                      .map((alert: any) => (
                        <div key={alert.id} className="p-3 bg-secondary rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-sm">{alert.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{alert.description.substring(0, 60)}...</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(alert.detected_at).toLocaleDateString()} • {alert.source_ip || "N/A"}
                              </p>
                            </div>
                            <Badge className={
                              alert.severity === "critical" ? "bg-red-600 text-white" :
                              alert.severity === "high" ? "bg-red-100 text-red-800" :
                              alert.severity === "medium" ? "bg-orange-100 text-orange-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {alert.severity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Security Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                {securityIncidents.filter((i: any) => i.status !== "closed").slice(0, 5).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No open incidents</div>
                ) : (
                  <div className="space-y-3">
                    {securityIncidents
                      .filter((i: any) => i.status !== "closed")
                      .slice(0, 5)
                      .map((incident: any) => (
                        <div key={incident.id} className="p-3 bg-secondary rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-sm">{incident.incident_number}</p>
                              <p className="text-xs text-muted-foreground mt-1">{incident.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(incident.detected_at).toLocaleDateString()} • {incident.detected_by_name}
                              </p>
                            </div>
                            <Badge className={
                              incident.severity === "critical" ? "bg-red-600 text-white" :
                              incident.severity === "high" ? "bg-red-100 text-red-800" :
                              incident.severity === "medium" ? "bg-orange-100 text-orange-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {incident.severity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Access Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Access Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Time</th>
                      <th className="text-left py-3 px-4 font-semibold">User</th>
                      <th className="text-left py-3 px-4 font-semibold">Action</th>
                      <th className="text-left py-3 px-4 font-semibold">Resource</th>
                      <th className="text-left py-3 px-4 font-semibold">IP Address</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No access logs
                        </td>
                      </tr>
                    ) : (
                      accessLogs.slice(0, 100).map((log: any) => (
                        <tr key={log.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="py-4 px-4">{log.user_name}</td>
                          <td className="py-4 px-4">{log.action_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">{log.resource_name || log.resource_type || "N/A"}</td>
                          <td className="py-4 px-4">{log.ip_address || "N/A"}</td>
                          <td className="py-4 px-4">
                            <Badge className={
                              log.status === "success" ? "bg-green-100 text-green-800" :
                              log.status === "failed" ? "bg-red-100 text-red-800" :
                              log.status === "denied" ? "bg-orange-100 text-orange-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {log.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={
                              log.severity === "critical" ? "bg-red-600 text-white" :
                              log.severity === "high" ? "bg-red-100 text-red-800" :
                              log.severity === "medium" ? "bg-orange-100 text-orange-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {log.severity}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Security Incidents</CardTitle>
                {isManager && (
                  <Button onClick={() => {
                    toast({
                      title: "Info",
                      description: "Incident creation feature coming soon.",
                    })
                  }} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Report Incident
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Incident #</th>
                      <th className="text-left py-3 px-4 font-semibold">Title</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Severity</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Detected</th>
                      <th className="text-left py-3 px-4 font-semibold">Assigned To</th>
                      {isManager && <th className="text-left py-3 px-4 font-semibold">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {securityIncidents.length === 0 ? (
                      <tr>
                        <td colSpan={isManager ? 8 : 7} className="py-8 text-center text-muted-foreground">
                          No security incidents
                        </td>
                      </tr>
                    ) : (
                      securityIncidents.map((incident: any) => (
                        <tr key={incident.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{incident.incident_number}</td>
                          <td className="py-4 px-4">{incident.title}</td>
                          <td className="py-4 px-4">{incident.incident_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">
                            <Badge className={
                              incident.severity === "critical" ? "bg-red-600 text-white" :
                              incident.severity === "high" ? "bg-red-100 text-red-800" :
                              incident.severity === "medium" ? "bg-orange-100 text-orange-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {incident.severity}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={
                              incident.status === "closed" ? "bg-green-100 text-green-800" :
                              incident.status === "resolved" ? "bg-blue-100 text-blue-800" :
                              incident.status === "investigating" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }>
                              {incident.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">{new Date(incident.detected_at).toLocaleDateString()}</td>
                          <td className="py-4 px-4">{incident.assigned_to_name || "Unassigned"}</td>
                          {isManager && (
                            <td className="py-4 px-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedIncident(incident)
                                  setShowIncidentDetail(true)
                                }}
                              >
                                <EyeIcon className="w-4 h-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Access Requests</CardTitle>
                {!isManager && (
                  <Button onClick={() => setShowCreateRequest(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Request
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Request #</th>
                      <th className="text-left py-3 px-4 font-semibold">Requester</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Requested</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Requested At</th>
                      <th className="text-left py-3 px-4 font-semibold">Reviewed By</th>
                      {isManager && <th className="text-left py-3 px-4 font-semibold">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {accessRequests.length === 0 ? (
                      <tr>
                        <td colSpan={isManager ? 8 : 7} className="py-8 text-center text-muted-foreground">
                          No access requests
                        </td>
                      </tr>
                    ) : (
                      accessRequests.map((request: any) => (
                        <tr key={request.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{request.request_number}</td>
                          <td className="py-4 px-4">{request.requester_name}</td>
                          <td className="py-4 px-4">{request.request_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">
                            {request.requested_role || request.requested_permission || request.requested_resource || "N/A"}
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={
                              request.status === "approved" ? "bg-green-100 text-green-800" :
                              request.status === "rejected" ? "bg-red-100 text-red-800" :
                              request.status === "expired" ? "bg-gray-100 text-gray-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {request.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">{new Date(request.requested_at).toLocaleDateString()}</td>
                          <td className="py-4 px-4">{request.reviewed_by_name || "Pending"}</td>
                          {isManager && request.status === "pending" && (
                            <td className="py-4 px-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request)
                                  setShowRequestDetail(true)
                                }}
                              >
                                <EyeIcon className="w-4 h-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Access Reviews</CardTitle>
                {isManager && (
                  <Button onClick={() => setShowScheduleReview(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Schedule Review
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Review #</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Target</th>
                      <th className="text-left py-3 px-4 font-semibold">Review Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Reviewer</th>
                      <th className="text-left py-3 px-4 font-semibold">Next Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessReviews.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No access reviews
                        </td>
                      </tr>
                    ) : (
                      accessReviews.map((review: any) => (
                        <tr key={review.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{review.review_number}</td>
                          <td className="py-4 px-4">{review.review_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">
                            {review.target_user_name || review.target_role || review.target_department || "N/A"}
                          </td>
                          <td className="py-4 px-4">{new Date(review.review_date).toLocaleDateString()}</td>
                          <td className="py-4 px-4">
                            <Badge className={
                              review.status === "approved" ? "bg-green-100 text-green-800" :
                              review.status === "revoked" ? "bg-red-100 text-red-800" :
                              review.status === "needs_review" ? "bg-orange-100 text-orange-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {review.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">{review.reviewer_name}</td>
                          <td className="py-4 px-4">
                            {review.next_review_date ? new Date(review.next_review_date).toLocaleDateString() : "N/A"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Alert #</th>
                      <th className="text-left py-3 px-4 font-semibold">Title</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Severity</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Affected User</th>
                      <th className="text-left py-3 px-4 font-semibold">Source IP</th>
                      <th className="text-left py-3 px-4 font-semibold">Detected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityAlerts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                          No security alerts
                        </td>
                      </tr>
                    ) : (
                      securityAlerts.map((alert: any) => (
                        <tr key={alert.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{alert.alert_number}</td>
                          <td className="py-4 px-4">{alert.title}</td>
                          <td className="py-4 px-4">{alert.alert_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">
                            <Badge className={
                              alert.severity === "critical" ? "bg-red-600 text-white" :
                              alert.severity === "high" ? "bg-red-100 text-red-800" :
                              alert.severity === "medium" ? "bg-orange-100 text-orange-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {alert.severity}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={
                              alert.status === "resolved" ? "bg-green-100 text-green-800" :
                              alert.status === "false_positive" ? "bg-gray-100 text-gray-800" :
                              alert.status === "acknowledged" ? "bg-blue-100 text-blue-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {alert.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">{alert.affected_user_name || "N/A"}</td>
                          <td className="py-4 px-4">{alert.source_ip || "N/A"}</td>
                          <td className="py-4 px-4">{new Date(alert.detected_at).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

