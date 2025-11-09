"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Clock, Users, Shield, Server, HardDrive, Zap, Package, FileText, TrendingUp, Activity, Code, Database, Wifi, Cloud } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { getWorkflowTasks } from "@/lib/database"

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export function ITDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [itStats, setItStats] = useState({
    systemUptime: 99.98,
    activeTickets: 0,
    securityAlerts: 0,
    usersConnected: 0,
    itAssets: 0,
    softwareLicenses: 0,
    expiringLicenses: 0,
    activeProjects: 0,
    avgResolutionTime: 0,
  })
  const [itAssets, setItAssets] = useState<any[]>([])
  const [supportTickets, setSupportTickets] = useState<any[]>([])
  const [systemMonitoring, setSystemMonitoring] = useState<any[]>([])
  const [systemIncidents, setSystemIncidents] = useState<any[]>([])
  const [softwareLicenses, setSoftwareLicenses] = useState<any[]>([])
  const [expiringLicenses, setExpiringLicenses] = useState<any[]>([])
  const [itProjects, setItProjects] = useState<any[]>([])
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([])
  const [ticketTrends, setTicketTrends] = useState<any[]>([])
  const [ticketsByCategory, setTicketsByCategory] = useState<any[]>([])
  const [systemHealth, setSystemHealth] = useState<any[]>([])

  useEffect(() => {
    loadITData()
  }, [user])

  async function loadITData() {
    try {
      setLoading(true)

      // Get IT assets
      const { data: assets } = await supabase
        .from("assets")
        .select("*")
        .in("category", ["IT Equipment", "Software", "Hardware", "Network Equipment"])
        .order("created_at", { ascending: false })

      // Get support tickets from support_requests table
      const { data: tickets } = await supabase
        .from("support_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)

      // Get system monitoring data
      const { data: systems } = await supabase
        .from("system_monitoring")
        .select("*")
        .order("system_name", { ascending: true })

      // Get system incidents
      const { data: incidents } = await supabase
        .from("system_incidents")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10)

      // Get software licenses
      const { data: licenses } = await supabase
        .from("software_licenses")
        .select("*")
        .order("expiration_date", { ascending: true })

      // Get IT projects
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .eq("department", "Information Technology")
        .order("created_at", { ascending: false })

      // Get active users
      const { count: userCount } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true)

      // Get security alerts from audit logs
      const { data: audits } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("severity", "high")
        .or("module.eq.security,module.eq.access")
        .order("created_at", { ascending: false })
        .limit(5)

      // Calculate statistics
      const activeTickets = tickets?.filter((t: any) => t.status !== "Resolved" && t.status !== "Closed").length || 0
      const resolvedTickets = tickets?.filter((t: any) => t.resolved_at) || []
      const avgResolutionTime = resolvedTickets.length > 0 
        ? resolvedTickets.reduce((sum: number, t: any) => {
            if (t.resolved_at && t.created_at) {
              const hours = (new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60)
              return sum + hours
            }
            return sum
          }, 0) / resolvedTickets.length
        : 0

      // Calculate system uptime (average of all systems)
      const avgUptime = systems && systems.length > 0
        ? systems.reduce((sum: number, s: any) => sum + parseFloat(s.uptime_percentage || 0), 0) / systems.length
        : 99.98

      // Expiring licenses (within 90 days)
      const expiring = licenses?.filter((l: any) => {
        if (!l.expiration_date) return false
        const daysUntilExpiry = Math.ceil((new Date(l.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        return daysUntilExpiry <= 90 && daysUntilExpiry > 0 && l.status === "Active"
      }) || []

      // Active projects
      const activeProjects = projects?.filter((p: any) => p.status === "Active" || p.status === "Planning").length || 0

      // Generate ticket trends (last 6 months)
      const months = []
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthName = monthNames[date.getMonth()]
        const monthTickets = tickets?.filter((t: any) => {
          const ticketDate = new Date(t.created_at)
          return ticketDate.getMonth() === date.getMonth() && ticketDate.getFullYear() === date.getFullYear()
        }) || []
        months.push({
          month: monthName,
          tickets: monthTickets.length,
          resolved: monthTickets.filter((t: any) => t.status === "Resolved" || t.status === "Closed").length,
        })
      }

      // Tickets by category
      const categoryCount: Record<string, number> = {}
      tickets?.forEach((t: any) => {
        const category = t.category || "Other"
        categoryCount[category] = (categoryCount[category] || 0) + 1
      })
      const categoryData = Object.entries(categoryCount).map(([name, value]) => ({
        name,
        value,
      }))

      // System health by type
      const healthByType: Record<string, { operational: number; total: number }> = {}
      systems?.forEach((s: any) => {
        const type = s.system_type || "other"
        if (!healthByType[type]) {
          healthByType[type] = { operational: 0, total: 0 }
        }
        healthByType[type].total++
        if (s.status === "operational") {
          healthByType[type].operational++
        }
      })
      const healthData = Object.entries(healthByType).map(([name, data]) => ({
        name: name.replace("_", " "),
        operational: data.operational,
        total: data.total,
        percentage: Math.round((data.operational / data.total) * 100),
      }))

      setItStats({
        systemUptime: Math.round(avgUptime * 100) / 100,
        activeTickets: activeTickets,
        securityAlerts: audits?.length || 0,
        usersConnected: userCount || 0,
        itAssets: assets?.length || 0,
        softwareLicenses: licenses?.length || 0,
        expiringLicenses: expiring.length,
        activeProjects: activeProjects,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      })
      setItAssets(assets?.slice(0, 12) || [])
      setSupportTickets(tickets?.slice(0, 15) || [])
      setSystemMonitoring(systems || [])
      setSystemIncidents(incidents || [])
      setSoftwareLicenses(licenses || [])
      setExpiringLicenses(expiring)
      setItProjects(projects?.slice(0, 10) || [])
      setSecurityAlerts(audits || [])
      setTicketTrends(months)
      setTicketsByCategory(categoryData)
      setSystemHealth(healthData)
    } catch (error) {
      console.error("Error loading IT data:", error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      label: "System Uptime",
      value: `${itStats.systemUptime}%`,
      icon: CheckCircle2,
      color: "from-green-500/10 to-green-500/5",
      iconColor: "text-green-600",
    },
    {
      label: "Active Tickets",
      value: itStats.activeTickets.toString(),
      icon: Clock,
      color: "from-amber-500/10 to-amber-500/5",
      iconColor: "text-amber-600",
      alert: itStats.activeTickets > 20,
    },
    {
      label: "Security Alerts",
      value: itStats.securityAlerts.toString(),
      icon: Shield,
      color: "from-red-500/10 to-red-500/5",
      iconColor: "text-red-600",
      alert: itStats.securityAlerts > 0,
    },
    {
      label: "Active Users",
      value: itStats.usersConnected.toString(),
      icon: Users,
      color: "from-blue-500/10 to-blue-500/5",
      iconColor: "text-blue-600",
    },
    {
      label: "IT Assets",
      value: itStats.itAssets.toString(),
      icon: HardDrive,
      color: "from-purple-500/10 to-purple-500/5",
      iconColor: "text-purple-600",
    },
    {
      label: "Software Licenses",
      value: itStats.softwareLicenses.toString(),
      icon: FileText,
      color: "from-cyan-500/10 to-cyan-500/5",
      iconColor: "text-cyan-600",
    },
    {
      label: "Expiring Licenses",
      value: itStats.expiringLicenses.toString(),
      icon: AlertCircle,
      color: "from-orange-500/10 to-orange-500/5",
      iconColor: "text-orange-600",
      alert: itStats.expiringLicenses > 0,
    },
    {
      label: "Active Projects",
      value: itStats.activeProjects.toString(),
      icon: Code,
      color: "from-indigo-500/10 to-indigo-500/5",
      iconColor: "text-indigo-600",
    },
  ]

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">IT Department Dashboard</h1>
          <p className="text-muted-foreground mt-2">Infrastructure monitoring, support tickets, software licenses, IT projects, and security</p>
        </div>
        <Button onClick={loadITData} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className={`p-6 bg-gradient-to-br ${stat.color} hover:shadow-lg transition-shadow`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                {stat.alert && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Action needed
                  </p>
                )}
              </div>
              <stat.icon className={`w-10 h-10 ${stat.iconColor}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Support Ticket Trends (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ticketTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
              <Legend />
              <Bar dataKey="tickets" fill="#3b82f6" name="Total Tickets" />
              <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Tickets by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ticketsByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ticketsByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Monitoring */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Infrastructure Status
            </h3>
            <Badge variant="outline">{systemMonitoring.length} systems</Badge>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {systemMonitoring.length > 0 ? (
              systemMonitoring.map((system: any) => {
                const statusColor = system.status === "operational" ? "green" : system.status === "degraded" ? "yellow" : system.status === "down" ? "red" : "gray"
                return (
                  <div key={system.id} className="p-4 rounded border border-border bg-muted">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{system.system_name}</p>
                        <p className="text-sm text-muted-foreground">{system.system_type} • {system.environment}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${statusColor}-600`}></div>
                        <Badge variant={system.status === "operational" ? "default" : "destructive"} className="text-xs">
                          {system.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mt-2">
                      <div>
                        <span>Uptime: </span>
                        <span className="font-semibold text-foreground">{system.uptime_percentage}%</span>
                      </div>
                      {system.cpu_usage && (
                        <div>
                          <span>CPU: </span>
                          <span className="font-semibold text-foreground">{system.cpu_usage}%</span>
                        </div>
                      )}
                      {system.memory_usage && (
                        <div>
                          <span>Memory: </span>
                          <span className="font-semibold text-foreground">{system.memory_usage}%</span>
                        </div>
                      )}
                    </div>
                    {system.health_score !== null && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Health Score</span>
                          <span>{system.health_score}/100</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              system.health_score >= 80 ? "bg-green-500" :
                              system.health_score >= 60 ? "bg-yellow-500" :
                              system.health_score >= 40 ? "bg-orange-500" : "bg-red-500"
                            }`}
                            style={{ width: `${system.health_score}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <Server className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No systems monitored</p>
              </div>
            )}
          </div>
        </Card>

        {/* Support Tickets */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">Support Tickets</h3>
            {supportTickets.filter((t: any) => t.status !== "Resolved" && t.status !== "Closed").length > 0 && (
              <Badge variant="secondary">
                {supportTickets.filter((t: any) => t.status !== "Resolved" && t.status !== "Closed").length} active
              </Badge>
            )}
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {supportTickets.length > 0 ? (
              supportTickets.map((ticket: any) => (
                <div key={ticket.id} className="p-4 rounded border border-border bg-muted">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground">{ticket.requester_name} • {ticket.category || ticket.type}</p>
                      {ticket.project_name && (
                        <p className="text-xs text-muted-foreground mt-1">Project: {ticket.project_name}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={
                          ticket.priority === "Critical" ? "destructive" :
                          ticket.priority === "High" ? "default" :
                          "secondary"
                        }
                        className="text-xs"
                      >
                        {ticket.priority}
                      </Badge>
                      <Badge
                        variant={
                          ticket.status === "Resolved" || ticket.status === "Closed" ? "default" :
                          ticket.status === "In Progress" ? "secondary" :
                          "outline"
                        }
                        className="text-xs"
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {ticket.assignee_name && <span>Assigned: {ticket.assignee_name}</span>}
                    {ticket.created_at && (
                      <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No support tickets</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Two Column Layout - Projects & Licenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IT Projects */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Code className="w-5 h-5" />
              IT Projects
            </h3>
            <Badge variant="outline">{itProjects.length} projects</Badge>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {itProjects.length > 0 ? (
              itProjects.map((project: any) => (
                <div key={project.id} className="p-4 rounded border border-border bg-muted">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.project_type || "IT Project"}</p>
                    </div>
                    <Badge
                      variant={
                        project.status === "Completed" ? "default" :
                        project.status === "Active" ? "secondary" :
                        "outline"
                      }
                      className="text-xs"
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${project.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  {project.budget && (
                    <p className="text-xs text-muted-foreground mt-2">Budget: ${parseFloat(project.budget || 0).toLocaleString()}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Code className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No IT projects</p>
              </div>
            )}
          </div>
        </Card>

        {/* Expiring Licenses */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Expiring Licenses
            </h3>
            {expiringLicenses.length > 0 && (
              <Badge variant="destructive">{expiringLicenses.length} expiring</Badge>
            )}
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {expiringLicenses.length > 0 ? (
              expiringLicenses.map((license: any) => {
                const daysUntilExpiry = Math.ceil((new Date(license.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={license.id} className="p-4 rounded border border-orange-500/50 bg-orange-500/5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{license.software_name}</p>
                        <p className="text-xs text-muted-foreground">{license.vendor}</p>
                      </div>
                      <Badge variant={daysUntilExpiry <= 30 ? "destructive" : "secondary"} className="text-xs">
                        {daysUntilExpiry} days
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Expires: {new Date(license.expiration_date).toLocaleDateString()}</span>
                      {license.total_licenses && (
                        <span>Licenses: {license.used_licenses}/{license.total_licenses}</span>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No licenses expiring soon</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* System Incidents */}
      {systemIncidents.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Recent System Incidents
            </h3>
            <Badge variant="outline">{systemIncidents.length} incidents</Badge>
          </div>
          <div className="space-y-3">
            {systemIncidents.map((incident: any) => (
              <div key={incident.id} className={`p-4 rounded border ${
                incident.severity === "critical" ? "border-red-500/50 bg-red-500/5" :
                incident.severity === "high" ? "border-orange-500/50 bg-orange-500/5" :
                "border-border bg-muted"
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{incident.title}</p>
                    <p className="text-sm text-muted-foreground">{incident.system_name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      variant={
                        incident.severity === "critical" ? "destructive" :
                        incident.severity === "high" ? "default" :
                        "secondary"
                      }
                      className="text-xs"
                    >
                      {incident.severity}
                    </Badge>
                    <Badge
                      variant={
                        incident.status === "resolved" ? "default" :
                        incident.status === "investigating" ? "secondary" :
                        "outline"
                      }
                      className="text-xs"
                    >
                      {incident.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {incident.started_at && (
                    <span>Started: {new Date(incident.started_at).toLocaleString()}</span>
                  )}
                  {incident.resolved_at && (
                    <span>Resolved: {new Date(incident.resolved_at).toLocaleString()}</span>
                  )}
                  {incident.resolution_time_minutes && (
                    <span>Duration: {Math.round(incident.resolution_time_minutes / 60)}h {incident.resolution_time_minutes % 60}m</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* IT Assets */}
      {itAssets.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">IT Assets Overview</h3>
            <Badge variant="outline">{itAssets.length} assets</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {itAssets.map((asset: any) => (
              <div key={asset.id} className="p-3 bg-muted rounded">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">{asset.category}</p>
                  </div>
                  <Badge
                    variant={
                      asset.status === "Available" ? "default" :
                      asset.status === "Assigned" ? "secondary" :
                      "outline"
                    }
                    className="text-xs"
                  >
                    {asset.status}
                  </Badge>
                </div>
                {asset.assignee_name && (
                  <p className="text-xs text-muted-foreground">Assigned to: {asset.assignee_name}</p>
                )}
                {asset.value && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Value: ${parseFloat(asset.value).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <Card className="p-6 border-red-500/20 bg-red-500/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Security Alerts
            </h3>
            <Badge variant="destructive">{securityAlerts.length}</Badge>
          </div>
          <div className="space-y-3">
            {securityAlerts.map((alert: any) => (
              <div key={alert.id} className="p-3 bg-background rounded border border-red-500/20">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-foreground">{alert.action}</p>
                    <p className="text-xs text-muted-foreground">{alert.module}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
