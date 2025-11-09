"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Briefcase, 
  Users, 
  Target, 
  Leaf,
  TrendingUp,
  Calendar,
  Award,
  Heart,
  Globe,
  DollarSign,
  Activity,
  CheckCircle,
  Clock,
  Plus,
  Eye,
  X
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  getCSRProjects,
  getVolunteerActivities,
  getVolunteerParticipation,
  getCSRSustainabilityMetrics,
  getCommunityImpact,
  createCSRProject,
  createVolunteerActivity,
  createVolunteerParticipation,
  createCSRSustainabilityMetric,
  createCommunityImpact,
  updateCSRProject,
  updateCommunityImpact,
} from "@/lib/database"
import { NewCSRProjectModal } from "@/components/modals/new-csr-project-modal"
import { NewVolunteerActivityModal } from "@/components/modals/new-volunteer-activity-modal"
import { ReportEnvironmentalMetricModal } from "@/components/modals/report-environmental-metric-modal"
import { RecordCommunityImpactModal } from "@/components/modals/record-community-impact-modal"

export function CSRDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Data states
  const [projects, setProjects] = useState<any[]>([])
  const [volunteerActivities, setVolunteerActivities] = useState<any[]>([])
  const [volunteerParticipation, setVolunteerParticipation] = useState<any[]>([])
  const [sustainabilityMetrics, setSustainabilityMetrics] = useState<any[]>([])
  const [communityImpact, setCommunityImpact] = useState<any[]>([])

  // Modal states
  const [showNewProject, setShowNewProject] = useState(false)
  const [showNewVolunteerActivity, setShowNewVolunteerActivity] = useState(false)
  const [showRecordSustainability, setShowRecordSustainability] = useState(false)
  const [showRecordImpact, setShowRecordImpact] = useState(false)
  const [showVolunteerParticipation, setShowVolunteerParticipation] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<any>(null)
  const [participationHours, setParticipationHours] = useState("")

  // Metrics
  const [metrics, setMetrics] = useState({
    activeProjects: 0,
    totalVolunteerHours: 0,
    peopleReached: 0,
    carbonReduced: 0,
    totalBudget: 0,
    spentAmount: 0,
    employeeParticipation: 0,
  })

  const isManager = user?.role === "csr_manager" || 
                    user?.role === "dept_manager" || 
                    user?.role === "super_admin" ||
                    user?.department === "CSR / Sustainability"

  useEffect(() => {
    loadCSRData()
  }, [user])

  async function loadCSRData() {
    if (!user) return

    try {
      setLoading(true)

      // Load CSR projects
      const projectsData = await getCSRProjects()
      setProjects(projectsData || [])

      // Load volunteer activities
      const activitiesData = await getVolunteerActivities()
      setVolunteerActivities(activitiesData || [])

      // Load volunteer participation
      const participationData = await getVolunteerParticipation(
        isManager ? undefined : { employee_id: user.id }
      )
      setVolunteerParticipation(participationData || [])

      // Load sustainability metrics
      const metricsData = await getCSRSustainabilityMetrics(
        isManager ? undefined : { department: user.department || "" }
      )
      setSustainabilityMetrics(metricsData || [])

      // Load community impact
      const impactData = await getCommunityImpact()
      setCommunityImpact(impactData || [])

      // Calculate metrics
      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 1)

      const activeProjects = (projectsData || []).filter(
        (p: any) => p.status === "active" || p.status === "planning"
      ).length

      const ytdParticipation = (participationData || []).filter(
        (p: any) => new Date(p.participation_date) >= startOfYear
      )
      const totalVolunteerHours = ytdParticipation.reduce(
        (sum: number, p: any) => sum + parseFloat(p.hours_contributed || 0), 0
      )

      const ytdImpact = (impactData || []).filter(
        (i: any) => i.impact_type === "people_reached" && new Date(i.impact_date) >= startOfYear
      )
      const peopleReached = ytdImpact.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0)

      const carbonMetrics = (metricsData || []).filter(
        (m: any) => m.metric_type === "carbon_footprint" && 
        m.category === "co2_reduced" &&
        new Date(m.measurement_date) >= startOfYear
      )
      const carbonReduced = carbonMetrics.reduce((sum: number, m: any) => sum + parseFloat(m.value || 0), 0)

      const totalBudget = (projectsData || []).reduce(
        (sum: number, p: any) => sum + parseFloat(p.budget_amount || 0), 0
      )
      const spentAmount = (projectsData || []).reduce(
        (sum: number, p: any) => sum + parseFloat(p.spent_amount || 0), 0
      )

      const uniqueEmployees = new Set(ytdParticipation.map((p: any) => p.employee_id)).size

      setMetrics({
        activeProjects,
        totalVolunteerHours: Math.round(totalVolunteerHours),
        peopleReached,
        carbonReduced: Math.round(carbonReduced),
        totalBudget,
        spentAmount,
        employeeParticipation: uniqueEmployees,
      })
    } catch (error) {
      console.error("Error loading CSR data:", error)
      toast({
        title: "Error",
        description: "Failed to load CSR data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handler functions for creating/recording data
  const handleCreateProject = async (data: any) => {
    try {
      await createCSRProject(data)
      await loadCSRData()
      toast({
        title: "Success",
        description: "CSR project created successfully.",
      })
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCreateVolunteerActivity = async (data: any) => {
    try {
      await createVolunteerActivity(data)
      await loadCSRData()
      toast({
        title: "Success",
        description: "Volunteer activity scheduled successfully.",
      })
    } catch (error) {
      console.error("Error creating activity:", error)
      toast({
        title: "Error",
        description: "Failed to schedule activity. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRecordSustainability = async (data: any) => {
    try {
      await createCSRSustainabilityMetric({
        ...data,
        recorded_by: user?.id || "",
        recorded_by_name: user?.fullName || "Unknown",
      })
      await loadCSRData()
      toast({
        title: "Success",
        description: "Sustainability metric recorded successfully.",
      })
    } catch (error) {
      console.error("Error recording metric:", error)
      toast({
        title: "Error",
        description: "Failed to record metric. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRecordImpact = async (data: any) => {
    try {
      await createCommunityImpact(data)
      await loadCSRData()
      toast({
        title: "Success",
        description: "Community impact recorded successfully.",
      })
    } catch (error) {
      console.error("Error recording impact:", error)
      toast({
        title: "Error",
        description: "Failed to record impact. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleJoinVolunteerActivity = async () => {
    if (!selectedActivity || !participationHours) {
      toast({
        title: "Error",
        description: "Please select an activity and enter hours.",
        variant: "destructive",
      })
      return
    }

    try {
      await createVolunteerParticipation({
        activity_id: selectedActivity.id,
        employee_id: user?.id || "",
        employee_name: user?.fullName || "Unknown",
        department: user?.department || "",
        hours_contributed: parseFloat(participationHours),
        participation_date: selectedActivity.activity_date,
        role: "volunteer",
      })
      await loadCSRData()
      setShowVolunteerParticipation(false)
      setSelectedActivity(null)
      setParticipationHours("")
      toast({
        title: "Success",
        description: "You've successfully joined the volunteer activity!",
      })
    } catch (error) {
      console.error("Error joining activity:", error)
      toast({
        title: "Error",
        description: "Failed to join activity. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Project trends (last 12 months)
  const projectTrends = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (11 - i))
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const monthProjects = projects.filter((p: any) => {
      const startDate = new Date(p.start_date)
      return startDate >= monthStart && startDate <= monthEnd
    })

    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      projects: monthProjects.length,
      completed: monthProjects.filter((p: any) => p.status === "completed").length,
    }
  })

  // Project by type
  const projectByType = projects.reduce((acc: any, p: any) => {
    acc[p.project_type] = (acc[p.project_type] || 0) + 1
    return acc
  }, {})

  const projectTypeData = Object.entries(projectByType).map(([type, count]) => ({
    type: type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    count,
  }))

  // Volunteer hours trend
  const volunteerTrend = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (11 - i))
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    const monthHours = volunteerParticipation
      .filter((p: any) => {
        const pDate = new Date(p.participation_date)
        return pDate >= monthStart && pDate <= monthEnd
      })
      .reduce((sum: number, p: any) => sum + parseFloat(p.hours_contributed || 0), 0)

    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      hours: Math.round(monthHours),
    }
  })

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading CSR dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">CSR Dashboard</h1>
          <p className="text-muted-foreground">
            {isManager 
              ? "Corporate Social Responsibility & Sustainability - Track projects, impact, and community engagement."
              : "View CSR projects and volunteer opportunities."}
          </p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <Button onClick={() => setShowNewProject(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
            <Button variant="outline" onClick={() => setShowNewVolunteerActivity(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Schedule Activity
            </Button>
          </div>
        )}
        {!isManager && (
          <Button onClick={() => setShowVolunteerParticipation(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Join Volunteer Activity
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
          <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Projects</p>
                    <p className="text-3xl font-bold">{metrics.activeProjects}</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Volunteer Hours (YTD)</p>
                    <p className="text-3xl font-bold">{metrics.totalVolunteerHours}</p>
                    <p className="text-xs text-muted-foreground mt-1">hours</p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">People Reached (YTD)</p>
                    <p className="text-3xl font-bold">{metrics.peopleReached.toLocaleString()}</p>
                  </div>
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Carbon Reduced (YTD)</p>
                    <p className="text-3xl font-bold">{metrics.carbonReduced > 0 ? `${(metrics.carbonReduced / 1000).toFixed(1)}T` : "0"}</p>
                    <p className="text-xs text-muted-foreground mt-1">CO2 equivalent</p>
                  </div>
                  <Leaf className="w-8 h-8 text-green-600" />
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
                    <p className="text-sm text-muted-foreground mb-1">Total Budget</p>
                    <p className="text-2xl font-bold">${(metrics.totalBudget / 1000).toFixed(1)}K</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Spent Amount</p>
                    <p className="text-2xl font-bold">${(metrics.spentAmount / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {metrics.totalBudget > 0 ? `${Math.round((metrics.spentAmount / metrics.totalBudget) * 100)}%` : "0%"} of budget
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Employee Participation</p>
                    <p className="text-2xl font-bold">{metrics.employeeParticipation}</p>
                    <p className="text-xs text-muted-foreground mt-1">volunteers</p>
                  </div>
                  <Heart className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Trends (12 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={projectTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="projects" stroke="#3b82f6" name="Total Projects" />
                    <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projects by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {projectTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={projectTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, count }) => `${type}: ${count}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {projectTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No project data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Volunteer Hours Trend (12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={volunteerTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>CSR Projects</CardTitle>
                {isManager && (
                  <Button onClick={() => setShowNewProject(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Project
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Project #</th>
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Start Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No CSR projects
                        </td>
                      </tr>
                    ) : (
                      projects.map((project: any) => (
                        <tr key={project.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{project.project_number}</td>
                          <td className="py-4 px-4">{project.project_name}</td>
                          <td className="py-4 px-4">{project.project_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">
                            <Badge className={
                              project.status === "completed" ? "bg-green-100 text-green-800" :
                              project.status === "active" ? "bg-blue-100 text-blue-800" :
                              project.status === "on_hold" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {project.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">{new Date(project.start_date).toLocaleDateString()}</td>
                          <td className="py-4 px-4">
                            {project.budget_amount ? `$${(project.budget_amount / 1000).toFixed(1)}K` : "N/A"}
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

        {/* Volunteers Tab */}
        <TabsContent value="volunteers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Volunteer Activities</CardTitle>
                {isManager ? (
                  <Button onClick={() => setShowNewVolunteerActivity(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Schedule Activity
                  </Button>
                ) : (
                  <Button onClick={() => setShowVolunteerParticipation(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Join Activity
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Activity #</th>
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Volunteers</th>
                      <th className="text-left py-3 px-4 font-semibold">Total Hours</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteerActivities.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No volunteer activities
                        </td>
                      </tr>
                    ) : (
                      volunteerActivities.map((activity: any) => (
                        <tr key={activity.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{activity.activity_number}</td>
                          <td className="py-4 px-4">{activity.activity_name}</td>
                          <td className="py-4 px-4">{activity.activity_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">{new Date(activity.activity_date).toLocaleDateString()}</td>
                          <td className="py-4 px-4">{activity.total_volunteers || 0}</td>
                          <td className="py-4 px-4">{Math.round(parseFloat(activity.total_hours || 0))}</td>
                          <td className="py-4 px-4">
                            <Badge className={
                              activity.status === "completed" ? "bg-green-100 text-green-800" :
                              activity.status === "cancelled" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {activity.status}
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

        {/* Sustainability Tab */}
        <TabsContent value="sustainability" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Sustainability Metrics</CardTitle>
                <Button onClick={() => setShowRecordSustainability(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Record Metric
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Metric #</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Category</th>
                      <th className="text-left py-3 px-4 font-semibold">Value</th>
                      <th className="text-left py-3 px-4 font-semibold">Unit</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sustainabilityMetrics.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No sustainability metrics
                        </td>
                      </tr>
                    ) : (
                      sustainabilityMetrics.map((metric: any) => (
                        <tr key={metric.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{metric.metric_number}</td>
                          <td className="py-4 px-4">{metric.metric_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">{metric.category.replace("_", " ")}</td>
                          <td className="py-4 px-4">{parseFloat(metric.value).toLocaleString()}</td>
                          <td className="py-4 px-4">{metric.unit}</td>
                          <td className="py-4 px-4">{new Date(metric.measurement_date).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Impact Tab */}
        <TabsContent value="impact" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Community Impact</CardTitle>
                <Button onClick={() => setShowRecordImpact(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Record Impact
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Impact #</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Description</th>
                      <th className="text-left py-3 px-4 font-semibold">Quantity</th>
                      <th className="text-left py-3 px-4 font-semibold">Beneficiary Group</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {communityImpact.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No community impact records
                        </td>
                      </tr>
                    ) : (
                      communityImpact.map((impact: any) => (
                        <tr key={impact.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{impact.impact_number}</td>
                          <td className="py-4 px-4">{impact.impact_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">{impact.description.substring(0, 50)}...</td>
                          <td className="py-4 px-4">{impact.quantity.toLocaleString()} {impact.unit}</td>
                          <td className="py-4 px-4">{impact.beneficiary_group || "N/A"}</td>
                          <td className="py-4 px-4">{new Date(impact.impact_date).toLocaleDateString()}</td>
                          <td className="py-4 px-4">
                            <Badge className={
                              impact.verification_status === "verified" ? "bg-green-100 text-green-800" :
                              impact.verification_status === "rejected" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {impact.verification_status}
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
      </Tabs>

      {/* Modals */}
      <NewCSRProjectModal
        isOpen={showNewProject}
        onClose={() => setShowNewProject(false)}
        onSubmit={handleCreateProject}
      />

      <NewVolunteerActivityModal
        isOpen={showNewVolunteerActivity}
        onClose={() => setShowNewVolunteerActivity(false)}
        onSubmit={handleCreateVolunteerActivity}
      />

      <ReportEnvironmentalMetricModal
        isOpen={showRecordSustainability}
        onClose={() => setShowRecordSustainability(false)}
        onSubmit={handleRecordSustainability}
      />

      <RecordCommunityImpactModal
        isOpen={showRecordImpact}
        onClose={() => setShowRecordImpact(false)}
        onSubmit={handleRecordImpact}
      />

      {/* Volunteer Participation Dialog */}
      {showVolunteerParticipation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 relative">
            <button onClick={() => {
              setShowVolunteerParticipation(false)
              setSelectedActivity(null)
              setParticipationHours("")
            }} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold mb-6">Join Volunteer Activity</h2>

            <div className="space-y-4">
              <div>
                <Label>Select Activity</Label>
                <Select value={selectedActivity?.id || ""} onValueChange={(value) => {
                  const activity = volunteerActivities.find((a: any) => a.id === value)
                  setSelectedActivity(activity)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an activity..." />
                  </SelectTrigger>
                  <SelectContent>
                    {volunteerActivities
                      .filter((a: any) => a.status === "scheduled")
                      .map((activity: any) => (
                        <SelectItem key={activity.id} value={activity.id}>
                          {activity.activity_name} - {new Date(activity.activity_date).toLocaleDateString()}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedActivity && (
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-sm font-semibold">{selectedActivity.activity_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedActivity.description.substring(0, 100)}...</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Date: {new Date(selectedActivity.activity_date).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <Label>Hours You'll Contribute *</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={participationHours}
                  onChange={(e) => setParticipationHours(e.target.value)}
                  placeholder="4.0"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => {
                  setShowVolunteerParticipation(false)
                  setSelectedActivity(null)
                  setParticipationHours("")
                }}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleJoinVolunteerActivity} disabled={!selectedActivity || !participationHours}>
                  Join Activity
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

