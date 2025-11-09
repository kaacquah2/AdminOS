"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Briefcase, 
  TrendingUp, 
  DollarSign,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Plus,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  AlertCircle,
  Zap,
  Shield
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend } from "recharts"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  getPMOProjects,
  getPMOMilestones,
  getPMOProjectResources,
  getPMOProjectRisks,
  getPMOProjectIssues,
  getPMOStatusReports,
  getProjects,
  getEmployees,
  type PMOProject,
  type PMOMilestone,
  type PMOProjectRisk,
  type PMOProjectIssue
} from "@/lib/database"

interface PMODashboardProps {
  onNavigate?: (module: string) => void
}

const COLORS = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
  blue: "#3b82f6",
  purple: "#a855f7"
}

export function PMODashboard({ onNavigate }: PMODashboardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Data states
  const [pmoProjects, setPmoProjects] = useState<PMOProject[]>([])
  const [allProjects, setAllProjects] = useState<any[]>([])
  const [milestones, setMilestones] = useState<PMOMilestone[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [risks, setRisks] = useState<PMOProjectRisk[]>([])
  const [issues, setIssues] = useState<PMOProjectIssue[]>([])
  const [statusReports, setStatusReports] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])

  // Metrics
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    atRiskProjects: 0,
    totalBudget: 0,
    totalSpent: 0,
    budgetUtilization: 0,
    onTimeDeliveryRate: 0,
    resourceUtilization: 0,
    criticalRisks: 0,
    openIssues: 0,
    upcomingMilestones: 0,
  })

  const isPMO = user?.department === "Project Management" || 
                user?.role === "project_manager" ||
                user?.role === "dept_manager"

  useEffect(() => {
    loadPMOData()
  }, [user])

  async function loadPMOData() {
    if (!user) return

    try {
      setLoading(true)

      // Load all PMO data
      const [
        pmoProjectsData,
        allProjectsData,
        milestonesData,
        resourcesData,
        risksData,
        issuesData,
        reportsData,
        employeesData
      ] = await Promise.all([
        getPMOProjects(),
        getProjects(),
        getPMOMilestones(),
        getPMOProjectResources(),
        getPMOProjectRisks(),
        getPMOProjectIssues(),
        getPMOStatusReports(),
        getEmployees()
      ])

      setPmoProjects(pmoProjectsData || [])
      setAllProjects(allProjectsData || [])
      setMilestones(milestonesData || [])
      setResources(resourcesData || [])
      setRisks(risksData || [])
      setIssues(issuesData || [])
      setStatusReports(reportsData || [])
      setEmployees(employeesData || [])

      // Calculate metrics
      const totalProjects = allProjectsData?.length || 0
      const activeProjects = allProjectsData?.filter(
        (p: any) => p.status === "In Progress" || p.status === "Planning"
      ).length || 0
      const completedProjects = allProjectsData?.filter(
        (p: any) => p.status === "Completed"
      ).length || 0

      const pmoProjectsWithHealth = pmoProjectsData || []
      const atRiskProjects = pmoProjectsWithHealth.filter(
        (p: PMOProject) => p.health_indicator === "red" || p.health_indicator === "yellow"
      ).length

      const totalBudget = pmoProjectsWithHealth.reduce(
        (sum: number, p: PMOProject) => sum + parseFloat(String(p.budget_allocated || 0)), 0
      )
      const totalSpent = pmoProjectsWithHealth.reduce(
        (sum: number, p: PMOProject) => sum + parseFloat(String(p.budget_spent || 0)), 0
      )
      const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

      // Calculate on-time delivery rate (simplified)
      const completedPMOProjects = pmoProjectsWithHealth.filter(
        (p: PMOProject) => p.actual_end_date !== null
      )
      const onTimeProjects = completedPMOProjects.filter((p: PMOProject) => {
        if (!p.planned_end_date || !p.actual_end_date) return false
        return new Date(p.actual_end_date) <= new Date(p.planned_end_date)
      }).length
      const onTimeDeliveryRate = completedPMOProjects.length > 0
        ? (onTimeProjects / completedPMOProjects.length) * 100
        : 0

      // Resource utilization
      const totalAllocation = resourcesData?.reduce(
        (sum: number, r: any) => sum + (r.allocation_percentage || 0), 0
      ) || 0
      const resourceUtilization = employeesData?.length > 0
        ? Math.min((totalAllocation / employeesData.length) / 100, 100)
        : 0

      const criticalRisks = (risksData || []).filter(
        (r: PMOProjectRisk) => r.risk_level === "critical" && r.status === "open"
      ).length

      const openIssues = (issuesData || []).filter(
        (i: PMOProjectIssue) => i.status === "open" || i.status === "in_progress"
      ).length

      const now = new Date()
      const upcomingMilestones = (milestonesData || []).filter((m: PMOMilestone) => {
        const milestoneDate = new Date(m.planned_date)
        const daysUntil = (milestoneDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        return daysUntil >= 0 && daysUntil <= 30 && m.status !== "completed"
      }).length

      setMetrics({
        totalProjects,
        activeProjects,
        completedProjects,
        atRiskProjects,
        totalBudget,
        totalSpent,
        budgetUtilization,
        onTimeDeliveryRate,
        resourceUtilization: resourceUtilization * 100,
        criticalRisks,
        openIssues,
        upcomingMilestones,
      })
    } catch (error: any) {
      console.error("Error loading PMO data:", error)
      const errorMessage = error?.message || error?.error?.message || JSON.stringify(error) || "Unknown error"
      console.error("Error details:", {
        message: errorMessage,
        error: error,
        stack: error?.stack
      })
      toast({
        title: "Error",
        description: `Failed to load PMO data: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Prepare chart data
  const projectStatusData = [
    { name: "Active", value: metrics.activeProjects, color: COLORS.blue },
    { name: "Completed", value: metrics.completedProjects, color: COLORS.green },
    { name: "At Risk", value: metrics.atRiskProjects, color: COLORS.red },
  ]

  const projectTypeData = pmoProjects.reduce((acc: any[], project: PMOProject) => {
    const existing = acc.find((item) => item.name === project.project_type)
    if (existing) {
      existing.value += 1
    } else {
      acc.push({ name: project.project_type, value: 1 })
    }
    return acc
  }, [])

  const healthIndicatorData = pmoProjects.reduce((acc: any[], project: PMOProject) => {
    const existing = acc.find((item) => item.name === project.health_indicator)
    if (existing) {
      existing.value += 1
    } else {
      acc.push({ name: project.health_indicator, value: 1 })
    }
    return acc
  }, [])

  const recentProjects = pmoProjects.slice(0, 5)
  const upcomingMilestonesList = milestones
    .filter((m) => {
      const milestoneDate = new Date(m.planned_date)
      const now = new Date()
      const daysUntil = (milestoneDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      return daysUntil >= 0 && daysUntil <= 30 && m.status !== "completed"
    })
    .sort((a, b) => new Date(a.planned_date).getTime() - new Date(b.planned_date).getTime())
    .slice(0, 5)

  const criticalRisksList = risks
    .filter((r) => r.risk_level === "critical" && r.status === "open")
    .slice(0, 5)

  const openIssuesList = issues
    .filter((i) => i.status === "open" || i.status === "in_progress")
    .sort((a, b) => {
      const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
    })
    .slice(0, 5)

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Project Management Office</h1>
          <p className="text-muted-foreground">Portfolio overview and project management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadPMOData} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button size="sm" className="gap-2" onClick={() => onNavigate?.("projects")}>
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : metrics.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeProjects} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `${metrics.budgetUtilization.toFixed(1)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              ${(metrics.totalSpent / 1000).toFixed(1)}K / ${(metrics.totalBudget / 1000).toFixed(1)}K
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `${metrics.onTimeDeliveryRate.toFixed(1)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.completedProjects} completed projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `${metrics.resourceUtilization.toFixed(1)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              Team capacity allocation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At-Risk Projects</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {loading ? "..." : metrics.atRiskProjects}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Risks</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? "..." : metrics.criticalRisks}
            </div>
            <p className="text-xs text-muted-foreground">
              Open critical risks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {loading ? "..." : metrics.openIssues}
            </div>
            <p className="text-xs text-muted-foreground">
              Require resolution
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Portfolio Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="risks">Risks & Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Project Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Project Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Project Health Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Project Health Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={healthIndicatorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6">
                      {healthIndicatorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          entry.name === "green" ? COLORS.green :
                          entry.name === "yellow" ? COLORS.yellow :
                          COLORS.red
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Projects</CardTitle>
                <Button size="sm" variant="outline" onClick={() => onNavigate?.("projects")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading projects...</p>
                ) : recentProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No projects found</p>
                ) : (
                  recentProjects.map((project) => (
                    <div key={project.id} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{project.project_number}</p>
                          <p className="text-sm text-muted-foreground">{project.project_type}</p>
                        </div>
                        <Badge
                          variant={
                            project.health_indicator === "green" ? "default" :
                            project.health_indicator === "yellow" ? "secondary" :
                            "destructive"
                          }
                        >
                          {project.health_indicator}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span>Budget: ${(project.budget_allocated / 1000).toFixed(1)}K</span>
                        <span>Priority: {project.priority}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Projects</CardTitle>
                <Button size="sm" className="gap-2" onClick={() => onNavigate?.("projects")}>
                  <Plus className="w-4 h-4" />
                  New Project
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading projects...</p>
                ) : pmoProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No PMO projects found</p>
                ) : (
                  pmoProjects.map((project) => (
                    <div key={project.id} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">{project.project_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {project.project_type} • {project.project_manager_name || "Unassigned"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{project.priority}</Badge>
                          <Badge
                            variant={
                              project.health_indicator === "green" ? "default" :
                              project.health_indicator === "yellow" ? "secondary" :
                              "destructive"
                            }
                          >
                            {project.health_indicator}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Budget:</span>
                          <p className="font-semibold">
                            ${(project.budget_spent / 1000).toFixed(1)}K / ${(project.budget_allocated / 1000).toFixed(1)}K
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Timeline:</span>
                          <p className="font-semibold">
                            {project.planned_end_date
                              ? new Date(project.planned_end_date).toLocaleDateString()
                              : "Not set"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Variance:</span>
                          <p className={`font-semibold ${project.timeline_variance_days > 0 ? "text-red-600" : "text-green-600"}`}>
                            {project.timeline_variance_days > 0 ? "+" : ""}{project.timeline_variance_days} days
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading resources...</p>
                ) : resources.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No resources allocated</p>
                ) : (
                  resources.map((resource) => (
                    <div key={resource.id} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{resource.employee_name}</p>
                          <p className="text-sm text-muted-foreground">{resource.role_in_project}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{resource.allocation_percentage}%</p>
                          <p className="text-sm text-muted-foreground">
                            {resource.planned_hours}h planned
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Critical Risks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  Critical Risks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading risks...</p>
                  ) : criticalRisksList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No critical risks</p>
                  ) : (
                    criticalRisksList.map((risk) => (
                      <div key={risk.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
                        <p className="font-semibold text-sm">{risk.risk_title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{risk.risk_description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="destructive">{risk.risk_level}</Badge>
                          <Badge variant="outline">{risk.status}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Open Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Open Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading issues...</p>
                  ) : openIssuesList.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No open issues</p>
                  ) : (
                    openIssuesList.map((issue) => (
                      <div key={issue.id} className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                        <p className="font-semibold text-sm">{issue.issue_title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{issue.issue_description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={
                            issue.priority === "critical" ? "destructive" :
                            issue.priority === "high" ? "secondary" :
                            "outline"
                          }>
                            {issue.priority}
                          </Badge>
                          <Badge variant="outline">{issue.status}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Milestones (Next 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading milestones...</p>
                ) : upcomingMilestonesList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming milestones</p>
                ) : (
                  upcomingMilestonesList.map((milestone) => (
                    <div key={milestone.id} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{milestone.milestone_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {milestone.milestone_type} • {milestone.assigned_to_name || "Unassigned"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {new Date(milestone.planned_date).toLocaleDateString()}
                          </p>
                          <Badge variant={milestone.is_critical ? "destructive" : "outline"}>
                            {milestone.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

