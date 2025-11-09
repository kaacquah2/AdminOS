"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target, 
  ArrowUp, 
  ArrowDown, 
  BarChart3, 
  PieChart as PieChartIcon,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Briefcase,
  Activity,
  Shield,
  AlertCircle,
  FileText,
  Calendar
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  getPMOProjects,
  getPMOMilestones,
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
import { supabase } from "@/lib/supabase"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ExecutiveDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [healthFilter, setHealthFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  
  // Executive Metrics
  const [executiveMetrics, setExecutiveMetrics] = useState({
    totalRevenue: 0,
    profitMargin: 0,
    employeeSatisfaction: 0,
    marketShare: 0,
    portfolioHealth: 0,
  })
  
  // PMO Data
  const [pmoProjects, setPmoProjects] = useState<PMOProject[]>([])
  const [allProjects, setAllProjects] = useState<any[]>([])
  const [milestones, setMilestones] = useState<PMOMilestone[]>([])
  const [risks, setRisks] = useState<PMOProjectRisk[]>([])
  const [issues, setIssues] = useState<PMOProjectIssue[]>([])
  const [statusReports, setStatusReports] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  
  // Analytics Data
  const [financialData, setFinancialData] = useState<any[]>([])
  const [workforceAnalytics, setWorkforceAnalytics] = useState<any[]>([])
  const [departmentPerformance, setDepartmentPerformance] = useState<any[]>([])
  const [strategicPriorities, setStrategicPriorities] = useState<any[]>([])
  const [budgetSummary, setBudgetSummary] = useState<any>({})
  const [projectPortfolio, setProjectPortfolio] = useState<any[]>([])
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      console.log("ExecutiveDashboard: Loading data for user:", user.email, user.role, user.department)
      loadExecutiveData()
    } else {
      console.warn("ExecutiveDashboard: No user object available")
      setLoading(false)
    }
  }, [user])

  async function loadExecutiveData() {
    try {
      console.log("ExecutiveDashboard: Starting data load...")
      setLoading(true)

      // Load PMO data
      const [
        pmoProjectsData,
        allProjectsData,
        milestonesData,
        risksData,
        issuesData,
        reportsData,
        employeesData
      ] = await Promise.all([
        getPMOProjects(),
        getProjects(),
        getPMOMilestones(),
        getPMOProjectRisks(),
        getPMOProjectIssues(),
        getPMOStatusReports(),
        getEmployees()
      ])

      setPmoProjects(pmoProjectsData || [])
      setAllProjects(allProjectsData || [])
      setMilestones(milestonesData || [])
      setRisks(risksData || [])
      setIssues(issuesData || [])
      setStatusReports(reportsData || [])
      setEmployees(employeesData || [])

      // Get department budgets
      const { data: budgets } = await supabase
        .from("department_budgets")
        .select("*")

      // Calculate financial metrics
      const totalBudget = budgets?.reduce((sum, b) => sum + parseFloat(b.allocated || 0), 0) || 0
      const totalSpent = budgets?.reduce((sum, b) => sum + parseFloat(b.spent || 0), 0) || 0
      const revenue = totalBudget * 5 // Simulated revenue (5x budget)
      const profit = revenue - totalSpent
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0

      // Calculate PMO project metrics
      const pmoTotalBudget = pmoProjectsData?.reduce(
        (sum, p) => sum + parseFloat(String(p.budget_allocated || 0)), 0
      ) || 0
      const pmoTotalSpent = pmoProjectsData?.reduce(
        (sum, p) => sum + parseFloat(String(p.budget_spent || 0)), 0
      ) || 0

      // Portfolio health calculation
      const greenProjects = pmoProjectsData?.filter(p => p.health_indicator === "green").length || 0
      const yellowProjects = pmoProjectsData?.filter(p => p.health_indicator === "yellow").length || 0
      const redProjects = pmoProjectsData?.filter(p => p.health_indicator === "red").length || 0
      const totalPMOProjects = pmoProjectsData?.length || 0
      const portfolioHealth = totalPMOProjects > 0 
        ? ((greenProjects * 100 + yellowProjects * 50) / totalPMOProjects) 
        : 0

      // Workforce analytics
      const deptCounts: Record<string, number> = {}
      employeesData?.forEach((emp: any) => {
        deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1
      })

      const workforceData = Object.entries(deptCounts)
        .slice(0, 6)
        .map(([dept, count]) => ({
          department: dept.length > 15 ? dept.substring(0, 15) + "..." : dept,
          employees: count,
        }))

      // Department performance
      const deptPerformance: Record<string, { projects: number; completed: number; avgProgress: number }> = {}
      allProjectsData?.forEach((proj: any) => {
        if (!deptPerformance[proj.department]) {
          deptPerformance[proj.department] = { projects: 0, completed: 0, avgProgress: 0 }
        }
        deptPerformance[proj.department].projects++
        if (proj.status === "Completed") {
          deptPerformance[proj.department].completed++
        }
        deptPerformance[proj.department].avgProgress += proj.progress || 0
      })

      const perfData = Object.entries(deptPerformance).map(([dept, data]) => ({
        department: dept.length > 15 ? dept.substring(0, 15) + "..." : dept,
        completionRate: data.projects > 0 ? Math.round((data.completed / data.projects) * 100) : 0,
        avgProgress: data.projects > 0 ? Math.round(data.avgProgress / data.projects) : 0,
      }))

      // Generate quarterly financial data
      const quarters = ["Q1", "Q2", "Q3", "Q4"]
      const financial = quarters.map((q, idx) => {
        const quarterRevenue = revenue / 4 * (0.9 + Math.random() * 0.2)
        const quarterProfit = quarterRevenue * (profitMargin / 100)
        return {
          name: q,
          revenue: Math.round(quarterRevenue),
          profit: Math.round(quarterProfit),
        }
      })

      // Strategic priorities from PMO projects
      const priorities = pmoProjectsData
        ?.filter(p => p.priority === "critical" || p.priority === "high")
        .slice(0, 4)
        .map((p: PMOProject) => {
          // Calculate progress from milestones or use a default
          const projectMilestones = milestonesData?.filter(m => m.pmo_project_id === p.id) || []
          const completedMilestones = projectMilestones.filter(m => m.status === "completed").length
          const progress = projectMilestones.length > 0 
            ? (completedMilestones / projectMilestones.length) * 100 
            : 0

          return {
            name: p.project_number || "Unknown Project",
            progress: Math.round(progress),
            description: p.project_type || "Strategic Initiative",
            projectId: p.id,
            health: p.health_indicator
          }
        }) || []

      // Project portfolio data
      const portfolioData = pmoProjectsData?.map((p: PMOProject) => ({
        id: p.id,
        name: p.project_number,
        projectName: allProjectsData?.find(proj => proj.id === p.project_id)?.name || "Unknown",
        health: p.health_indicator,
        priority: p.priority,
        budget: parseFloat(String(p.budget_allocated || 0)),
        spent: parseFloat(String(p.budget_spent || 0)),
        budgetVariance: parseFloat(String(p.budget_variance || 0)),
        timelineVariance: p.timeline_variance_days || 0,
        status: allProjectsData?.find(proj => proj.id === p.project_id)?.status || "Unknown",
        department: allProjectsData?.find(proj => proj.id === p.project_id)?.department || "Unknown",
        projectManager: p.project_manager_name || "Unassigned"
      })) || []

      // Critical alerts
      const alerts: any[] = []
      
      // Red health projects
      pmoProjectsData?.filter(p => p.health_indicator === "red").forEach((p: PMOProject) => {
        alerts.push({
          type: "critical",
          title: `Critical Project: ${p.project_number}`,
          message: "Project is at critical risk",
          projectId: p.id,
          projectName: allProjectsData?.find(proj => proj.id === p.project_id)?.name || "Unknown",
          icon: AlertTriangle,
          color: "red"
        })
      })

      // High priority risks
      risksData?.filter(r => r.risk_level === "critical" || r.risk_level === "high").slice(0, 5).forEach((r: PMOProjectRisk) => {
        const project = pmoProjectsData?.find(p => p.id === r.pmo_project_id)
        alerts.push({
          type: "risk",
          title: `High Risk: ${r.risk_title}`,
          message: r.risk_description?.substring(0, 100) || "",
          projectId: r.pmo_project_id,
          projectName: allProjectsData?.find(proj => proj.id === project?.project_id)?.name || "Unknown",
          icon: Shield,
          color: "orange"
        })
      })

      // Critical issues
      issuesData?.filter(i => i.priority === "critical" && i.status !== "resolved").slice(0, 5).forEach((i: PMOProjectIssue) => {
        const project = pmoProjectsData?.find(p => p.id === i.pmo_project_id)
        alerts.push({
          type: "issue",
          title: `Critical Issue: ${i.issue_title}`,
          message: i.issue_description?.substring(0, 100) || "",
          projectId: i.pmo_project_id,
          projectName: allProjectsData?.find(proj => proj.id === project?.project_id)?.name || "Unknown",
          icon: AlertCircle,
          color: "red"
        })
      })

      // Budget overruns
      pmoProjectsData?.filter(p => parseFloat(String(p.budget_variance || 0)) < -10000).slice(0, 3).forEach((p: PMOProject) => {
        alerts.push({
          type: "budget",
          title: `Budget Overrun: ${p.project_number}`,
          message: `Over budget by $${Math.abs(parseFloat(String(p.budget_variance || 0))).toLocaleString()}`,
          projectId: p.id,
          projectName: allProjectsData?.find(proj => proj.id === p.project_id)?.name || "Unknown",
          icon: DollarSign,
          color: "red"
        })
      })

      setExecutiveMetrics({
        totalRevenue: revenue,
        profitMargin,
        employeeSatisfaction: 8.2, // Simulated
        marketShare: 15.8, // Simulated
        portfolioHealth: Math.round(portfolioHealth)
      })
      setFinancialData(financial)
      setWorkforceAnalytics(workforceData)
      setDepartmentPerformance(perfData)
      setStrategicPriorities(priorities)
      setProjectPortfolio(portfolioData)
      setCriticalAlerts(alerts)
      setBudgetSummary({
        total: totalBudget,
        spent: totalSpent,
        remaining: totalBudget - totalSpent,
        utilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        pmoTotal: pmoTotalBudget,
        pmoSpent: pmoTotalSpent,
        pmoRemaining: pmoTotalBudget - pmoTotalSpent,
        pmoUtilization: pmoTotalBudget > 0 ? (pmoTotalSpent / pmoTotalBudget) * 100 : 0,
      })
    } catch (error) {
      console.error("Error loading executive data:", error)
      // Even if data loading fails, show the dashboard with empty data
      // This prevents the dashboard from being stuck in loading state
    } finally {
      console.log("ExecutiveDashboard: Data load complete, setting loading to false")
      setLoading(false)
    }
  }

  // Filter projects based on search and filters
  const filteredProjects = projectPortfolio.filter((project) => {
    const matchesSearch = searchQuery === "" || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.department.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    const matchesHealth = healthFilter === "all" || project.health === healthFilter
    const matchesPriority = priorityFilter === "all" || project.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesHealth && matchesPriority
  })

  const stats = [
    {
      label: "Total Revenue",
      value: `$${(executiveMetrics.totalRevenue / 1000000).toFixed(2)}M`,
      icon: DollarSign,
      color: "from-primary/10 to-primary/5",
      trend: "+12%",
      trendColor: "text-green-600",
    },
    {
      label: "Profit Margin",
      value: `${executiveMetrics.profitMargin.toFixed(1)}%`,
      icon: TrendingUp,
      color: "from-accent/10 to-accent/5",
      trend: "+2.3%",
      trendColor: "text-green-600",
    },
    {
      label: "Portfolio Health",
      value: `${executiveMetrics.portfolioHealth}%`,
      icon: Activity,
      color: executiveMetrics.portfolioHealth >= 75 
        ? "from-green-500/10 to-green-500/5"
        : executiveMetrics.portfolioHealth >= 50
        ? "from-yellow-500/10 to-yellow-500/5"
        : "from-red-500/10 to-red-500/5",
      trend: "On Track",
      trendColor: executiveMetrics.portfolioHealth >= 75 ? "text-green-600" : "text-yellow-600",
    },
    {
      label: "Active Projects",
      value: `${pmoProjects.length}`,
      icon: Briefcase,
      color: "from-blue-500/10 to-blue-500/5",
      trend: `${filteredProjects.filter(p => p.health === "green").length} Healthy`,
      trendColor: "text-blue-600",
    },
  ]

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

  const getHealthColor = (health: string) => {
    switch (health) {
      case "green": return "bg-green-500"
      case "yellow": return "bg-yellow-500"
      case "red": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const getHealthBadge = (health: string) => {
    switch (health) {
      case "green": return <Badge className="bg-green-500">On Track</Badge>
      case "yellow": return <Badge className="bg-yellow-500">At Risk</Badge>
      case "red": return <Badge className="bg-red-500">Critical</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Show loading state only if we have a user and are actually loading
  if (loading && user) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // If no user, show a message
  if (!user) {
    return (
      <div className="p-6 space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">Executive Dashboard</h2>
          <p className="text-muted-foreground">Please log in to view the Executive Dashboard.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Executive Dashboard</h1>
          <p className="text-muted-foreground mt-2">Strategic oversight and project portfolio management</p>
        </div>
        <Button onClick={loadExecutiveData} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats && stats.length > 0 ? stats.map((stat, index) => (
          <Card key={index} className={`p-6 bg-gradient-to-br ${stat.color} hover:shadow-lg transition-shadow`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                <p className={`text-xs ${stat.trendColor} mt-2 flex items-center gap-1`}>
                  {stat.trend.includes("+") ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : stat.trend.includes("-") ? (
                    <ArrowDown className="w-3 h-3" />
                  ) : null}
                  {stat.trend}
                </p>
              </div>
              <stat.icon className="w-10 h-10 text-primary" />
            </div>
          </Card>
        )) : (
          <Card className="p-6 col-span-4">
            <p className="text-muted-foreground">Loading metrics...</p>
          </Card>
        )}
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="p-6 border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Critical Alerts Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.slice(0, 5).map((alert, index) => {
                const Icon = alert.icon
                const colorClass = alert.color === "red" 
                  ? "text-red-600 dark:text-red-400" 
                  : alert.color === "orange"
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-yellow-600 dark:text-yellow-400"
                return (
                  <div key={index} className="flex items-start gap-3 p-3 bg-background rounded-lg border border-red-200 dark:border-red-900">
                    <Icon className={`w-5 h-5 ${colorClass} mt-0.5`} />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">Project: {alert.projectName}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Portfolio with Search */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Project Portfolio</CardTitle>
          <p className="text-sm text-muted-foreground">Search and filter projects by name, status, health, or priority</p>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search projects by name, number, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Planning">Planning</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={healthFilter} onValueChange={setHealthFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Health" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Health</SelectItem>
                <SelectItem value="green">On Track</SelectItem>
                <SelectItem value="yellow">At Risk</SelectItem>
                <SelectItem value="red">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Projects Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Project</th>
                  <th className="text-left p-2">Department</th>
                  <th className="text-left p-2">Health</th>
                  <th className="text-left p-2">Priority</th>
                  <th className="text-left p-2">Budget</th>
                  <th className="text-left p-2">Variance</th>
                  <th className="text-left p-2">Timeline</th>
                  <th className="text-left p-2">Manager</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-muted-foreground">
                      No projects found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr key={project.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div>
                          <p className="font-semibold">{project.projectName}</p>
                          <p className="text-xs text-muted-foreground">{project.name}</p>
                        </div>
                      </td>
                      <td className="p-2">{project.department}</td>
                      <td className="p-2">{getHealthBadge(project.health)}</td>
                      <td className="p-2">
                        <Badge variant={project.priority === "critical" ? "destructive" : "outline"}>
                          {project.priority}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div>
                          <p className="text-sm">${(project.budget / 1000).toFixed(0)}K</p>
                          <p className="text-xs text-muted-foreground">
                            Spent: ${(project.spent / 1000).toFixed(0)}K
                          </p>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className={project.budgetVariance < 0 ? "text-red-600" : "text-green-600"}>
                          ${(project.budgetVariance / 1000).toFixed(0)}K
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={project.timelineVariance > 0 ? "text-red-600" : "text-green-600"}>
                          {project.timelineVariance > 0 ? `+${project.timelineVariance}d` : `${project.timelineVariance}d`}
                        </span>
                      </td>
                      <td className="p-2 text-sm">{project.projectManager}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Quarterly Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={financialData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
            <Bar dataKey="profit" fill="#10b981" name="Profit" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Company Budget Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                ${(budgetSummary.total / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="p-4 bg-muted rounded">
              <p className="text-sm text-muted-foreground">Spent</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                ${(budgetSummary.spent / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="p-4 bg-muted rounded">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                ${(budgetSummary.remaining / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="p-4 bg-muted rounded">
              <p className="text-sm text-muted-foreground">Utilization</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {budgetSummary.utilization?.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">PMO Project Budget</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                ${(budgetSummary.pmoTotal / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="p-4 bg-muted rounded">
              <p className="text-sm text-muted-foreground">Spent</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                ${(budgetSummary.pmoSpent / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="p-4 bg-muted rounded">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                ${(budgetSummary.pmoRemaining / 1000000).toFixed(2)}M
              </p>
            </div>
            <div className="p-4 bg-muted rounded">
              <p className="text-sm text-muted-foreground">Utilization</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {budgetSummary.pmoUtilization?.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Workforce & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Workforce Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workforceAnalytics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
              <Bar dataKey="employees" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Department Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
              <Legend />
              <Bar dataKey="completionRate" fill="#10b981" name="Completion %" />
              <Bar dataKey="avgProgress" fill="#8b5cf6" name="Avg Progress %" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Strategic Priorities */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Strategic Priorities</h3>
        <div className="space-y-3">
          {strategicPriorities.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No strategic priorities available</p>
          ) : (
            strategicPriorities.map((priority, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
              <div className="flex-1">
                  <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{priority.name}</p>
                    {getHealthBadge(priority.health)}
                  </div>
                <p className="text-sm text-muted-foreground">{priority.description}</p>
                <p className="text-sm text-muted-foreground mt-1">{priority.progress}% complete</p>
              </div>
              <div className="w-32 h-2 bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    priority.progress >= 75
                      ? "bg-green-600"
                      : priority.progress >= 50
                      ? "bg-blue-600"
                      : "bg-amber-600"
                  }`}
                  style={{ width: `${priority.progress}%` }}
                />
              </div>
            </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
