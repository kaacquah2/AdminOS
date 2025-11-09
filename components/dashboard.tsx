"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Users,
  DollarSign,
  Calendar,
  AlertCircle,
  AlertTriangle,
  FileText,
  CheckCircle,
  Clock,
  TrendingUp,
  Briefcase,
  Target,
  Wallet,
  Award,
  Zap,
  Package,
  Hammer,
  BookOpen,
  Shield,
  Leaf,
  FlaskConical,
  Beaker,
  Heart,
  Trophy,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import {
  getEmployees,
  getWorkflowTasks,
  getApprovalRequests,
  getLeaveRequests,
  getExpenses,
  getProjects,
  getSupportRequests,
  getJobPostings,
  getTrainingPrograms,
  getDepartmentBudgets,
} from "@/lib/database"
import { HSEDashboard } from "@/components/dashboards/hse-dashboard"
import { CSRDashboard } from "@/components/dashboards/csr-dashboard"
import { SecurityDashboard } from "@/components/dashboards/security-dashboard"
import { RNDDashboard } from "@/components/dashboards/rnd-dashboard"
import { WellnessDashboard } from "@/components/dashboards/wellness-dashboard"
import { MarketingDashboard } from "@/components/dashboards/marketing-dashboard"
import { PMODashboard } from "@/components/dashboards/pmo-dashboard"
import { ExecutiveDashboard } from "@/components/dashboards/executive-dashboard"
import { LegalComplianceDashboard } from "@/components/dashboards/legal-compliance-dashboard"
import { FacilitiesDashboard } from "@/components/dashboards/facilities-dashboard"
import { AdministrationDashboard } from "@/components/dashboards/administration-dashboard"
// Navigation handled by parent component

interface DashboardProps {
  onNavigate?: (module: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})
  const [workflowData, setWorkflowData] = useState<any>({
    pendingTasks: [],
    pendingApprovals: [],
    recentRequests: [],
  })
  const [chartData, setChartData] = useState<any>({})

  useEffect(() => {
    if (user) {
      // Defer heavy data loading - load minimal data first
      loadDashboardData()
    }
  }, [user])

  async function loadDashboardData() {
    if (!user) return

    try {
      setLoading(true)

      // Load minimal workflow data in parallel (limit queries)
      const [tasks, approvals] = await Promise.all([
        getWorkflowTasks(user.id).catch(() => []),
        getApprovalRequests(user.id).catch(() => []),
      ])

      const pendingTasks = tasks?.filter((t: any) => t.status === "pending" || t.status === "in_progress") || []
      const pendingApprovals = approvals?.filter((a: any) => a.status === "pending") || []

      setWorkflowData({ 
        pendingTasks, 
        pendingApprovals, 
        recentRequests: [] // Load on demand
      })

      // Load role-specific data (only essential metrics)
      switch (user.role) {
        case "super_admin":
          await loadAdminDashboard()
          break
        case "executive":
          await loadExecutiveDashboard()
          break
        case "hr_head":
        case "hr_officer":
          await loadHrDashboard()
          break
        case "finance_director":
        case "accountant":
        case "finance_officer":
          await loadFinanceDashboard()
          break
        case "dept_manager":
        case "project_manager":
          await loadManagerDashboard()
          break
        case "employee":
          await loadEmployeeDashboard()
          break
        case "it_manager":
        case "it_support":
          await loadITDashboard()
          break
        case "trainer":
          await loadTrainingDashboard()
          break
        case "procurement_officer":
          await loadProcurementDashboard()
          break
        case "facilities_manager":
          await loadFacilitiesDashboard()
          break
        case "hse_manager":
          await loadHSEDashboard()
          break
        case "csr_manager":
          await loadCSRDashboard()
          break
        case "security_manager":
        case "security_admin":
          await loadSecurityDashboard()
          break
        case "rnd_manager":
          await loadRNDDashboard()
          break
        case "wellness_manager":
          await loadWellnessDashboard()
          break
        default:
          await loadDefaultDashboard()
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function loadAdminDashboard() {
    const [employees, projects, expenses] = await Promise.all([
      getEmployees(),
      getProjects(),
      getExpenses(),
    ])

    const totalEmployees = employees?.length || 0
    const activeProjects = projects?.filter((p: any) => p.status === "In Progress").length || 0
    const pendingExpenses = expenses?.filter((e: any) => e.status === "Pending").length || 0
    const openRequests = workflowData.recentRequests.length

    setStats({
      totalEmployees,
      activeProjects,
      pendingExpenses,
      openRequests,
    })

    // Department distribution
    const deptCounts: Record<string, number> = {}
    employees?.forEach((emp: any) => {
      deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1
    })
    setChartData({
      departmentData: Object.entries(deptCounts).map(([name, value]) => ({ name, value })),
    })
  }

  async function loadExecutiveDashboard() {
    const [budgets, employees, projects] = await Promise.all([
      getDepartmentBudgets(),
      getEmployees(),
      getProjects(),
    ])

    const totalBudget = budgets?.reduce((sum: number, b: any) => sum + parseFloat(b.allocated || 0), 0) || 0
    const totalSpent = budgets?.reduce((sum: number, b: any) => sum + parseFloat(b.spent || 0), 0) || 0
    const totalEmployees = employees?.length || 0
    const activeProjects = projects?.filter((p: any) => p.status === "In Progress").length || 0

    setStats({
      totalBudget: `$${(totalBudget / 1000).toFixed(0)}K`,
      totalSpent: `$${(totalSpent / 1000).toFixed(0)}K`,
      totalEmployees,
      activeProjects,
    })
  }

  async function loadHrDashboard() {
    const [employees, jobPostings, leaveRequests, trainingPrograms] = await Promise.all([
      getEmployees(),
      getJobPostings("open"),
      getLeaveRequests(),
      getTrainingPrograms("upcoming"),
    ])

    const totalEmployees = employees?.length || 0
    const openPositions = jobPostings?.length || 0
    const pendingLeave = leaveRequests?.filter((l: any) => l.status === "Pending").length || 0
    const activeTraining = trainingPrograms?.length || 0

    setStats({
      totalEmployees,
      openPositions,
      pendingLeave,
      activeTraining,
    })
  }

  async function loadFinanceDashboard() {
    const [budgets, expenses] = await Promise.all([getDepartmentBudgets(), getExpenses()])

    const totalBudget = budgets?.reduce((sum: number, b: any) => sum + parseFloat(b.allocated || 0), 0) || 0
    const totalSpent = budgets?.reduce((sum: number, b: any) => sum + parseFloat(b.spent || 0), 0) || 0
    const pendingExpenses = expenses?.filter((e: any) => e.status === "Pending").length || 0
    const approvedAmount = expenses
      ?.filter((e: any) => e.status === "Approved")
      .reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0

    setStats({
      totalBudget: `$${(totalBudget / 1000).toFixed(0)}K`,
      totalSpent: `$${(totalSpent / 1000).toFixed(0)}K`,
      pendingExpenses,
      approvedAmount: `$${(approvedAmount / 1000).toFixed(1)}K`,
    })
  }

  async function loadManagerDashboard() {
    if (!user) return
    const [employees, projects, tasks] = await Promise.all([
      getEmployees(user.department),
      getProjects(user.department),
      getWorkflowTasks(),
    ])

    const teamMembers = employees?.length || 0
    const activeProjects = projects?.filter((p: any) => p.status === "In Progress").length || 0
    const completedTasks = tasks?.filter((t: any) => t.status === "completed" && t.department === user.department).length || 0
    const pendingApprovals = workflowData.pendingApprovals.length

    setStats({
      teamMembers,
      activeProjects,
      completedTasks,
      pendingApprovals,
    })
  }

  async function loadEmployeeDashboard() {
    if (!user) return
    const [leaves, projects, tasks] = await Promise.all([
      getLeaveRequests(),
      getProjects(),
      getWorkflowTasks(user.id),
    ])

    const myLeaves = leaves?.filter((l: any) => l.employee_id === user.id) || []
    const myProjects = projects?.filter((p: any) => p.owner_id === user.id || p.owner_name === user.fullName).length || 0
    const myTasks = tasks?.filter((t: any) => t.assigned_to === user.id) || []
    const pendingTasks = myTasks.filter((t: any) => t.status === "pending" || t.status === "in_progress").length

    setStats({
      leaveBalance: myLeaves.filter((l: any) => l.status === "Approved").length,
      activeProjects: myProjects,
      pendingTasks,
      completedTasks: myTasks.filter((t: any) => t.status === "completed").length,
    })
  }

  async function loadITDashboard() {
    const [requests, employees] = await Promise.all([getSupportRequests(), getEmployees()])

    const openRequests = requests?.filter((r: any) => r.status === "Pending" || r.status === "In Progress").length || 0
    const resolvedRequests = requests?.filter((r: any) => r.status === "Resolved").length || 0
    const totalEmployees = employees?.length || 0
    const highPriority = requests?.filter((r: any) => r.priority === "High").length || 0

    setStats({
      openRequests,
      resolvedRequests,
      totalEmployees,
      highPriority,
    })
  }

  async function loadTrainingDashboard() {
    const [programs, employees] = await Promise.all([getTrainingPrograms(), getEmployees()])

    const activePrograms = programs?.filter((p: any) => p.status === "upcoming" || p.status === "ongoing").length || 0
    const totalEmployees = employees?.length || 0
    const completedPrograms = programs?.filter((p: any) => p.status === "completed").length || 0

    setStats({
      activePrograms,
      totalEmployees,
      completedPrograms,
    })
  }

  async function loadProcurementDashboard() {
    const [expenses, budgets] = await Promise.all([getExpenses(), getDepartmentBudgets()])

    const pendingOrders = expenses?.filter((e: any) => e.status === "Pending" && e.category === "Equipment").length || 0
    const totalBudget = budgets?.reduce((sum: number, b: any) => sum + parseFloat(b.allocated || 0), 0) || 0

    setStats({
      pendingOrders,
      totalBudget: `$${(totalBudget / 1000).toFixed(0)}K`,
    })
  }

  async function loadFacilitiesDashboard() {
    const [requests] = await Promise.all([getSupportRequests()])

    const facilityRequests = requests?.filter((r: any) => r.type === "Office" || r.type === "Facilities").length || 0

    setStats({
      facilityRequests,
    })
  }

  async function loadCSRDashboard() {
    const { data: projects } = await supabase
      .from("csr_projects")
      .select("id, status")
      .order("created_at", { ascending: false })

    const { data: volunteerData } = await supabase
      .from("volunteer_participation")
      .select("hours_contributed")
      .gte("participation_date", new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0])

    const { data: impactData } = await supabase
      .from("community_impact")
      .select("quantity, unit")
      .eq("impact_type", "people_reached")
      .gte("impact_date", new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0])

    const { data: carbonData } = await supabase
      .from("csr_sustainability_metrics")
      .select("value, unit")
      .eq("metric_type", "carbon_footprint")
      .eq("category", "co2_reduced")
      .gte("measurement_date", new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0])

    const activeProjects = projects?.filter((p: any) => p.status === "active" || p.status === "planning").length || 0
    const totalVolunteerHours = volunteerData?.reduce((sum: number, v: any) => sum + parseFloat(v.hours_contributed || 0), 0) || 0
    const peopleReached = impactData?.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0) || 0
    const carbonReduced = carbonData?.reduce((sum: number, c: any) => sum + parseFloat(c.value || 0), 0) || 0

    setStats({
      activeCSRProjects: activeProjects,
      totalVolunteerHours: Math.round(totalVolunteerHours),
      peopleReached,
      carbonReduced: carbonReduced > 0 ? `${(carbonReduced / 1000).toFixed(1)}T` : "0",
    })
  }

  async function loadSecurityDashboard() {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const { data: alerts } = await supabase
      .from("security_alerts")
      .select("id, status, severity")
      .eq("status", "active")

    const { data: failedLogins } = await supabase
      .from("access_logs")
      .select("id")
      .eq("action_type", "failed_login")
      .gte("created_at", yesterday.toISOString())

    const { data: requests } = await supabase
      .from("access_requests")
      .select("id, status")
      .eq("status", "pending")

    const { data: incidents } = await supabase
      .from("security_incidents")
      .select("id, status")
      .in("status", ["reported", "investigating"])

    const criticalAlerts = alerts?.filter((a: any) => a.severity === "critical").length || 0

    setStats({
      activeSecurityAlerts: alerts?.length || 0,
      failedLogins24h: failedLogins?.length || 0,
      pendingAccessRequests: requests?.length || 0,
      openSecurityIncidents: incidents?.length || 0,
      criticalAlerts,
    })
  }

  async function loadHSEDashboard() {
    const { data: incidents } = await supabase
      .from("safety_incidents")
      .select("id, incident_type, severity, incident_date")
      .order("incident_date", { ascending: false })

    const { data: inspections } = await supabase
      .from("safety_inspections")
      .select("id, status, scheduled_date")
      .order("scheduled_date", { ascending: false })

    const { data: training } = await supabase
      .from("safety_training_records")
      .select("id, status, expiry_date")
      .order("expiry_date", { ascending: true })

    const { data: actions } = await supabase
      .from("corrective_actions")
      .select("id, status, due_date")
      .order("due_date", { ascending: true })

    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    
    const recordableIncidents = incidents?.filter(
      (i: any) => i.incident_type === "injury" && 
      ["moderate", "serious", "critical", "fatal"].includes(i.severity) &&
      new Date(i.incident_date) >= startOfYear
    ).length || 0

    const totalHours = 100 * 2000 // Simplified calculation
    const trir = totalHours > 0 ? (recordableIncidents * 200000) / totalHours : 0

    const overdueInspections = inspections?.filter(
      (i: any) => i.status === "scheduled" && new Date(i.scheduled_date) < now
    ).length || 0

    const expiringTraining = training?.filter(
      (t: any) => t.expiry_date && 
      new Date(t.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
      new Date(t.expiry_date) > now
    ).length || 0

    const openActions = actions?.filter((a: any) => a.status !== "completed").length || 0

    setStats({
      totalIncidents: incidents?.length || 0,
      trir: Math.round(trir * 100) / 100,
      overdueInspections,
      expiringTraining,
      openActions,
    })
  }

  async function loadRNDDashboard() {
    // Load R&D dashboard data
    const [projectsResult, experimentsResult, patentsResult] = await Promise.all([
      supabase.from("rnd_projects").select("id, status").eq("status", "active"),
      supabase.from("rnd_experiments").select("id, status").eq("status", "in_progress"),
      supabase.from("rnd_patents").select("id, status").eq("status", "pending"),
    ])

    const projects = projectsResult.data || []
    const experiments = experimentsResult.data || []
    const patents = patentsResult.data || []

    setStats({
      activeRNDProjects: projects.length,
      activeExperiments: experiments.length,
      pendingPatents: patents.length,
    })
  }

  async function loadWellnessDashboard() {
    // Load only essential counts, not full data - optimized for performance
    const [programsResult, challengesResult, eventsResult, surveysResult] = await Promise.all([
      supabase.from("wellness_programs").select("id, status, current_participants").eq("status", "active"),
      supabase.from("wellness_challenges").select("id, status, current_participants").eq("status", "active"),
      supabase.from("wellness_events").select("id, status, event_date").eq("status", "scheduled"),
      supabase.from("wellness_surveys").select("id").eq("status", "active"),
    ])

    const programs = programsResult.data || []
    const challenges = challengesResult.data || []
    const events = eventsResult.data || []
    const surveys = surveysResult.data || []

    const activePrograms = programs.length
    const activeChallenges = challenges.length
    const now = new Date()
    const upcomingEvents = events.filter((e: any) => {
      const eventDate = new Date(e.event_date)
      return eventDate >= now
    }).length
    const totalParticipants = programs.reduce((sum: number, p: any) => sum + (p.current_participants || 0), 0) +
                              challenges.reduce((sum: number, c: any) => sum + (c.current_participants || 0), 0)

    setStats({
      activeWellnessPrograms: activePrograms,
      activeWellnessChallenges: activeChallenges,
      upcomingWellnessEvents: upcomingEvents,
      totalWellnessParticipants: totalParticipants,
      activeWellnessSurveys: surveys.length,
    })
  }

  async function loadDefaultDashboard() {
    const [employees, projects] = await Promise.all([getEmployees(), getProjects()])

    setStats({
      totalEmployees: employees?.length || 0,
      activeProjects: projects?.filter((p: any) => p.status === "In Progress").length || 0,
    })
  }

  const getRoleStats = () => {
    const role = user?.role || ""
    const statsConfig: Record<string, any> = {
      super_admin: [
        { label: "Total Employees", value: stats.totalEmployees || 0, icon: Users, color: "from-blue-500 to-blue-600" },
        { label: "Active Projects", value: stats.activeProjects || 0, icon: Briefcase, color: "from-purple-500 to-purple-600" },
        { label: "Pending Expenses", value: stats.pendingExpenses || 0, icon: DollarSign, color: "from-yellow-500 to-yellow-600" },
        { label: "Open Requests", value: stats.openRequests || 0, icon: AlertCircle, color: "from-red-500 to-red-600" },
      ],
      executive: [
        { label: "Total Budget", value: stats.totalBudget || "$0K", icon: Wallet, color: "from-green-500 to-green-600" },
        { label: "Total Spent", value: stats.totalSpent || "$0K", icon: DollarSign, color: "from-blue-500 to-blue-600" },
        { label: "Total Employees", value: stats.totalEmployees || 0, icon: Users, color: "from-purple-500 to-purple-600" },
        { label: "Active Projects", value: stats.activeProjects || 0, icon: Briefcase, color: "from-orange-500 to-orange-600" },
      ],
      hr_head: [
        { label: "Total Employees", value: stats.totalEmployees || 0, icon: Users, color: "from-blue-500 to-blue-600" },
        { label: "Open Positions", value: stats.openPositions || 0, icon: Briefcase, color: "from-green-500 to-green-600" },
        { label: "Pending Leave", value: stats.pendingLeave || 0, icon: Calendar, color: "from-yellow-500 to-yellow-600" },
        { label: "Active Training", value: stats.activeTraining || 0, icon: BookOpen, color: "from-purple-500 to-purple-600" },
      ],
      hr_officer: [
        { label: "Total Employees", value: stats.totalEmployees || 0, icon: Users, color: "from-blue-500 to-blue-600" },
        { label: "Open Positions", value: stats.openPositions || 0, icon: Briefcase, color: "from-green-500 to-green-600" },
        { label: "Pending Leave", value: stats.pendingLeave || 0, icon: Calendar, color: "from-yellow-500 to-yellow-600" },
        { label: "Active Training", value: stats.activeTraining || 0, icon: BookOpen, color: "from-purple-500 to-purple-600" },
      ],
      finance_director: [
        { label: "Total Budget", value: stats.totalBudget || "$0K", icon: Wallet, color: "from-green-500 to-green-600" },
        { label: "Total Spent", value: stats.totalSpent || "$0K", icon: DollarSign, color: "from-blue-500 to-blue-600" },
        { label: "Pending Expenses", value: stats.pendingExpenses || 0, icon: AlertCircle, color: "from-yellow-500 to-yellow-600" },
        { label: "Approved Amount", value: stats.approvedAmount || "$0K", icon: CheckCircle, color: "from-purple-500 to-purple-600" },
      ],
      accountant: [
        { label: "Total Budget", value: stats.totalBudget || "$0K", icon: Wallet, color: "from-green-500 to-green-600" },
        { label: "Total Spent", value: stats.totalSpent || "$0K", icon: DollarSign, color: "from-blue-500 to-blue-600" },
        { label: "Pending Expenses", value: stats.pendingExpenses || 0, icon: AlertCircle, color: "from-yellow-500 to-yellow-600" },
        { label: "Approved Amount", value: stats.approvedAmount || "$0K", icon: CheckCircle, color: "from-purple-500 to-purple-600" },
      ],
      finance_officer: [
        { label: "Total Budget", value: stats.totalBudget || "$0K", icon: Wallet, color: "from-green-500 to-green-600" },
        { label: "Total Spent", value: stats.totalSpent || "$0K", icon: DollarSign, color: "from-blue-500 to-blue-600" },
        { label: "Pending Expenses", value: stats.pendingExpenses || 0, icon: AlertCircle, color: "from-yellow-500 to-yellow-600" },
        { label: "Approved Amount", value: stats.approvedAmount || "$0K", icon: CheckCircle, color: "from-purple-500 to-purple-600" },
      ],
      dept_manager: [
        { label: "Team Members", value: stats.teamMembers || 0, icon: Users, color: "from-blue-500 to-blue-600" },
        { label: "Active Projects", value: stats.activeProjects || 0, icon: Briefcase, color: "from-green-500 to-green-600" },
        { label: "Completed Tasks", value: stats.completedTasks || 0, icon: CheckCircle, color: "from-purple-500 to-purple-600" },
        { label: "Pending Approvals", value: stats.pendingApprovals || 0, icon: AlertCircle, color: "from-yellow-500 to-yellow-600" },
      ],
      project_manager: [
        { label: "Team Members", value: stats.teamMembers || 0, icon: Users, color: "from-blue-500 to-blue-600" },
        { label: "Active Projects", value: stats.activeProjects || 0, icon: Briefcase, color: "from-green-500 to-green-600" },
        { label: "Completed Tasks", value: stats.completedTasks || 0, icon: CheckCircle, color: "from-purple-500 to-purple-600" },
        { label: "Pending Approvals", value: stats.pendingApprovals || 0, icon: AlertCircle, color: "from-yellow-500 to-yellow-600" },
      ],
      employee: [
        { label: "Leave Balance", value: stats.leaveBalance || 0, icon: Calendar, color: "from-blue-500 to-blue-600" },
        { label: "Active Projects", value: stats.activeProjects || 0, icon: Briefcase, color: "from-green-500 to-green-600" },
        { label: "Pending Tasks", value: stats.pendingTasks || 0, icon: Clock, color: "from-yellow-500 to-yellow-600" },
        { label: "Completed Tasks", value: stats.completedTasks || 0, icon: CheckCircle, color: "from-purple-500 to-purple-600" },
      ],
      it_manager: [
        { label: "Open Requests", value: stats.openRequests || 0, icon: AlertCircle, color: "from-red-500 to-red-600" },
        { label: "Resolved", value: stats.resolvedRequests || 0, icon: CheckCircle, color: "from-green-500 to-green-600" },
        { label: "Total Employees", value: stats.totalEmployees || 0, icon: Users, color: "from-blue-500 to-blue-600" },
        { label: "High Priority", value: stats.highPriority || 0, icon: Zap, color: "from-yellow-500 to-yellow-600" },
      ],
      it_support: [
        { label: "Open Requests", value: stats.openRequests || 0, icon: AlertCircle, color: "from-red-500 to-red-600" },
        { label: "Resolved", value: stats.resolvedRequests || 0, icon: CheckCircle, color: "from-green-500 to-green-600" },
        { label: "Total Employees", value: stats.totalEmployees || 0, icon: Users, color: "from-blue-500 to-blue-600" },
        { label: "High Priority", value: stats.highPriority || 0, icon: Zap, color: "from-yellow-500 to-yellow-600" },
      ],
      trainer: [
        { label: "Active Programs", value: stats.activePrograms || 0, icon: BookOpen, color: "from-blue-500 to-blue-600" },
        { label: "Total Employees", value: stats.totalEmployees || 0, icon: Users, color: "from-green-500 to-green-600" },
        { label: "Completed Programs", value: stats.completedPrograms || 0, icon: CheckCircle, color: "from-purple-500 to-purple-600" },
      ],
      procurement_officer: [
        { label: "Pending Orders", value: stats.pendingOrders || 0, icon: Package, color: "from-yellow-500 to-yellow-600" },
        { label: "Total Budget", value: stats.totalBudget || "$0K", icon: Wallet, color: "from-green-500 to-green-600" },
      ],
      facilities_manager: [
        { label: "Facility Requests", value: stats.facilityRequests || 0, icon: Hammer, color: "from-blue-500 to-blue-600" },
      ],
      hse_manager: [
        { label: "TRIR", value: stats.trir || 0, icon: Shield, color: "from-blue-500 to-blue-600" },
        { label: "Total Incidents", value: stats.totalIncidents || 0, icon: AlertCircle, color: "from-red-500 to-red-600" },
        { label: "Overdue Inspections", value: stats.overdueInspections || 0, icon: Clock, color: "from-yellow-500 to-yellow-600" },
        { label: "Open Actions", value: stats.openActions || 0, icon: Target, color: "from-orange-500 to-orange-600" },
      ],
      csr_manager: [
        { label: "Active Projects", value: stats.activeCSRProjects || 0, icon: Briefcase, color: "from-green-500 to-green-600" },
        { label: "Volunteer Hours", value: stats.totalVolunteerHours || 0, icon: Users, color: "from-blue-500 to-blue-600" },
        { label: "People Reached", value: stats.peopleReached || 0, icon: Target, color: "from-purple-500 to-purple-600" },
        { label: "Carbon Reduced", value: stats.carbonReduced || "0", icon: Leaf, color: "from-green-500 to-green-600" },
      ],
      rnd_manager: [
        { label: "Active Projects", value: stats.activeRNDProjects || 0, icon: FlaskConical, color: "from-blue-500 to-blue-600" },
        { label: "Budget Utilization", value: `${stats.rndBudgetUtilization || 0}%`, icon: DollarSign, color: "from-green-500 to-green-600" },
        { label: "Patents Filed", value: stats.rndPatentsFiled || 0, icon: Award, color: "from-purple-500 to-purple-600" },
        { label: "Active Experiments", value: stats.activeRNDExperiments || 0, icon: Beaker, color: "from-orange-500 to-orange-600" },
      ],
      wellness_manager: [
        { label: "Active Programs", value: stats.activeWellnessPrograms || 0, icon: Heart, color: "from-red-500 to-red-600" },
        { label: "Active Challenges", value: stats.activeWellnessChallenges || 0, icon: Trophy, color: "from-yellow-500 to-yellow-600" },
        { label: "Upcoming Events", value: stats.upcomingWellnessEvents || 0, icon: Calendar, color: "from-green-500 to-green-600" },
        { label: "Total Participants", value: stats.totalWellnessParticipants || 0, icon: Users, color: "from-blue-500 to-blue-600" },
      ],
      security_manager: [
        { label: "Active Alerts", value: stats.activeSecurityAlerts || 0, icon: AlertCircle, color: "from-red-500 to-red-600" },
        { label: "Failed Logins (24h)", value: stats.failedLogins24h || 0, icon: Shield, color: "from-orange-500 to-orange-600" },
        { label: "Pending Requests", value: stats.pendingAccessRequests || 0, icon: Clock, color: "from-yellow-500 to-yellow-600" },
        { label: "Open Incidents", value: stats.openSecurityIncidents || 0, icon: AlertTriangle, color: "from-red-500 to-red-600" },
      ],
      security_admin: [
        { label: "Active Alerts", value: stats.activeSecurityAlerts || 0, icon: AlertCircle, color: "from-red-500 to-red-600" },
        { label: "Failed Logins (24h)", value: stats.failedLogins24h || 0, icon: Shield, color: "from-orange-500 to-orange-600" },
        { label: "Pending Requests", value: stats.pendingAccessRequests || 0, icon: Clock, color: "from-yellow-500 to-yellow-600" },
        { label: "Open Incidents", value: stats.openSecurityIncidents || 0, icon: AlertTriangle, color: "from-red-500 to-red-600" },
      ],
    }

    return statsConfig[role] || [
      { label: "Total Employees", value: stats.totalEmployees || 0, icon: Users, color: "from-blue-500 to-blue-600" },
      { label: "Active Projects", value: stats.activeProjects || 0, icon: Briefcase, color: "from-green-500 to-green-600" },
    ]
  }

  const getDashboardTitle = () => {
    const roleTitles: Record<string, string> = {
      super_admin: "Admin Dashboard",
      executive: "Executive Dashboard",
      hr_head: "HR Dashboard",
      hr_officer: "HR Dashboard",
      finance_director: "Finance Dashboard",
      accountant: "Finance Dashboard",
      finance_officer: "Finance Dashboard",
      dept_manager: "Manager Dashboard",
      project_manager: "Manager Dashboard",
      employee: "My Portal",
      it_manager: "IT Dashboard",
      it_support: "IT Dashboard",
      trainer: "Training Dashboard",
      procurement_officer: "Procurement Dashboard",
      facilities_manager: "Facilities Dashboard",
      hse_manager: "HSE Dashboard",
      csr_manager: "CSR Dashboard",
      rnd_manager: "R&D Dashboard",
      wellness_manager: "Wellness Dashboard",
      security_manager: "Security Dashboard",
      security_admin: "Security Dashboard",
    }
    return roleTitles[user?.role || ""] || "Dashboard"
  }

  const colors = ["#6366f1", "#60a5fa", "#f87171", "#34d399", "#fbbf24"]

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Render HSE-specific dashboard for HSE managers or HSE department managers
  if (user?.role === "hse_manager" || 
      (user?.role === "dept_manager" && user?.department === "Health, Safety & Environment")) {
    return <HSEDashboard />
  }

  // Render CSR-specific dashboard for CSR managers or CSR department managers
  if (user?.role === "csr_manager" || 
      (user?.role === "dept_manager" && user?.department === "CSR / Sustainability")) {
    return <CSRDashboard />
  }

  // Render R&D-specific dashboard for R&D managers or R&D department managers
  if (user?.role === "rnd_manager" || 
      (user?.role === "dept_manager" && user?.department === "Research & Development")) {
    return <RNDDashboard />
  }

  // Render Wellness-specific dashboard for Wellness managers or Wellness department managers
  if (user?.role === "wellness_manager" || 
      (user?.role === "dept_manager" && user?.department === "Employee Wellness & Engagement")) {
    return <WellnessDashboard />
  }

  // Render Marketing-specific dashboard for Marketing managers or Marketing department managers
  if ((user?.role === "dept_manager" && user?.department === "Marketing & Communications") ||
      user?.department === "Marketing & Communications") {
    return <MarketingDashboard onNavigate={onNavigate} />
  }

  // Render Executive-specific dashboard for executives or Executive Management department
  // Check with trimmed strings to handle any whitespace issues
  const userRole = user?.role?.trim()
  const userDept = user?.department?.trim()
  const isExecutive = userRole === "executive"
  const isDeptManagerInExec = userRole === "dept_manager" && userDept === "Executive Management"
  const isSuperAdminInExec = userRole === "super_admin" && userDept === "Executive Management"
  
  if (isExecutive || isDeptManagerInExec || isSuperAdminInExec) {
    console.log("✅ Rendering Executive Dashboard for user:", { 
      role: userRole, 
      department: userDept,
      email: user?.email,
      conditions: {
        isExecutive,
        isDeptManagerInExec,
        isSuperAdminInExec
      }
    })
    return <ExecutiveDashboard />
  }
  
  // Debug: Log why Executive Dashboard is not rendering
  if (userDept === "Executive Management" || userDept?.includes("Executive")) {
    console.warn("⚠️ User is in Executive Management but dashboard not rendering:", {
      role: userRole,
      department: userDept,
      email: user?.email,
      rawRole: user?.role,
      rawDept: user?.department,
      conditions: {
        isExecutive,
        isDeptManagerInExec,
        isSuperAdminInExec,
        roleMatch: userRole === "dept_manager",
        deptMatch: userDept === "Executive Management"
      }
    })
  }

  // Render Legal & Compliance-specific dashboard for Legal & Compliance department
  if (userDept === "Legal & Compliance" || 
      (userRole === "dept_manager" && userDept === "Legal & Compliance") ||
      userRole === "compliance_officer" || 
      userRole === "legal_counsel") {
    return <LegalComplianceDashboard />
  }

  // Render PMO-specific dashboard for PMO managers or Project Management department
  if ((user?.role === "dept_manager" && user?.department === "Project Management") ||
      user?.role === "project_manager" ||
      user?.department === "Project Management") {
    return <PMODashboard onNavigate={onNavigate} />
  }

  // Render Facilities & Maintenance-specific dashboard
  if (user?.role === "facilities_manager" ||
      (user?.role === "dept_manager" && user?.department === "Facilities & Maintenance") ||
      user?.department === "Facilities & Maintenance") {
    return <FacilitiesDashboard />
  }

  // Render Administration & Operations-specific dashboard
  if ((user?.role === "dept_manager" && user?.department === "Administration") ||
      user?.department === "Administration") {
    return <AdministrationDashboard />
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{getDashboardTitle()}</h1>
        <p className="text-muted-foreground">Welcome back, {user?.fullName}! Here's your workflow overview.</p>
      </div>

      {/* Role-specific Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getRoleStats().map((stat: any, index: number) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Essential Workflow Features - Common to All Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Tasks */}
        {workflowData.pendingTasks.length > 0 && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Tasks ({workflowData.pendingTasks.length})
              </h3>
              <Button variant="outline" size="sm" onClick={() => onNavigate?.("workflows")}>
                View All
              </Button>
            </div>
            <div className="space-y-2">
              {workflowData.pendingTasks.slice(0, 5).map((task: any) => (
                <div key={task.id} className="p-3 bg-secondary/50 rounded-lg">
                  <p className="font-medium text-sm">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Pending Approvals */}
        {workflowData.pendingApprovals.length > 0 && (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Pending Approvals ({workflowData.pendingApprovals.length})
              </h3>
              <Button variant="outline" size="sm" onClick={() => onNavigate?.("approvals")}>
                View All
              </Button>
            </div>
            <div className="space-y-2">
              {workflowData.pendingApprovals.slice(0, 5).map((approval: any) => (
                <div key={approval.id} className="p-3 bg-secondary/50 rounded-lg">
                  <p className="font-medium text-sm capitalize">{approval.request_type}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{approval.description}</p>
                  {approval.amount && (
                    <p className="text-xs font-semibold mt-1">${parseFloat(approval.amount).toFixed(2)}</p>
                  )}
                </div>
              ))}
            </div>
        </Card>
        )}

        {/* Recent Requests */}
        {workflowData.recentRequests.length > 0 && (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Recent Requests ({workflowData.recentRequests.length})
              </h3>
              <Button variant="outline" size="sm" onClick={() => onNavigate?.("requests")}>
                View All
              </Button>
            </div>
            <div className="space-y-2">
              {workflowData.recentRequests.slice(0, 5).map((request: any) => (
                <div key={request.id} className="p-3 bg-secondary/50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{request.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{request.type}</p>
                    </div>
                    <Badge
                      className={
                        request.priority === "High"
                          ? "bg-red-100 text-red-800"
                          : request.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                      }
                    >
                      {request.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
        </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {user?.role === "super_admin" && (
            <>
              <Button variant="outline" onClick={() => onNavigate?.("employees")} className="gap-2">
                <Users className="w-4 h-4" />
                Manage Employees
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.("finance")} className="gap-2">
                <DollarSign className="w-4 h-4" />
                View Finance
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.("analytics")} className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Analytics
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.("settings")} className="gap-2">
                <Target className="w-4 h-4" />
                Settings
              </Button>
            </>
          )}
          {user?.role === "hr_head" && (
            <>
              <Button variant="outline" onClick={() => onNavigate?.("employees")} className="gap-2">
                <Users className="w-4 h-4" />
                Employees
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.("recruitment")} className="gap-2">
                <Briefcase className="w-4 h-4" />
                Recruitment
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.("leave")} className="gap-2">
                <Calendar className="w-4 h-4" />
                Leave Requests
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.("training")} className="gap-2">
                <BookOpen className="w-4 h-4" />
                Training
              </Button>
            </>
          )}
          {user?.role === "finance_director" && (
            <>
              <Button variant="outline" onClick={() => onNavigate?.("finance")} className="gap-2">
                <DollarSign className="w-4 h-4" />
                Expenses
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.("payroll")} className="gap-2">
                <Wallet className="w-4 h-4" />
                Payroll
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.("approvals")} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Approvals
              </Button>
            </>
          )}
          {user?.role === "dept_manager" && (
            <>
              <Button variant="outline" onClick={() => onNavigate?.("projects")} className="gap-2">
                <Briefcase className="w-4 h-4" />
                Projects
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.("workflows")} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Tasks
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.("approvals")} className="gap-2">
                <AlertCircle className="w-4 h-4" />
                Approvals
              </Button>
            </>
          )}
          {user?.role === "employee" && (
            <>
              <Button variant="outline" onClick={() => onNavigate?.("leave")} className="gap-2">
                <Calendar className="w-4 h-4" />
                Request Leave
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.("requests")} className="gap-2">
                <FileText className="w-4 h-4" />
                New Request
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.("workflows")} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                My Tasks
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.("projects")} className="gap-2">
                <Briefcase className="w-4 h-4" />
                My Projects
              </Button>
            </>
          )}
          {/* Default quick actions for other roles */}
          {!["super_admin", "hr_head", "finance_director", "dept_manager", "employee"].includes(user?.role || "") && (
            <>
              <Button variant="outline" onClick={() => onNavigate?.("workflows")} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Tasks
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.("requests")} className="gap-2">
                <FileText className="w-4 h-4" />
                Requests
              </Button>
              <Button variant="outline" onClick={() => onNavigate?.("messaging")} className="gap-2">
                <FileText className="w-4 h-4" />
                Messages
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
