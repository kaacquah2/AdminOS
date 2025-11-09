"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FlaskConical,
  Lightbulb,
  FileText,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Beaker,
  Microscope,
  Plus,
  Eye,
  Zap,
  BookOpen,
  Download
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { 
  getRNDProjects,
  getRNDExperiments,
  getRNDPatents,
  getRNDLabBookings,
  getRNDCollaborations,
  getRNDMilestones,
  createRNDProject,
  createRNDExperiment,
  createRNDPatent,
  createRNDLabBooking,
  updateRNDProject,
  updateRNDExperiment,
  updateRNDPatent,
} from "@/lib/database"
import { NewRNDProjectModal } from "@/components/modals/new-rnd-project-modal"
import { NewRNDExperimentModal } from "@/components/modals/new-rnd-experiment-modal"
import { NewRNDPatentModal } from "@/components/modals/new-rnd-patent-modal"
import { BookLabModal } from "@/components/modals/book-lab-modal"

export function RNDDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Data states
  const [projects, setProjects] = useState<any[]>([])
  const [experiments, setExperiments] = useState<any[]>([])
  const [patents, setPatents] = useState<any[]>([])
  const [labBookings, setLabBookings] = useState<any[]>([])
  const [collaborations, setCollaborations] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])

  // Modal states
  const [showNewProject, setShowNewProject] = useState(false)
  const [showNewExperiment, setShowNewExperiment] = useState(false)
  const [showNewPatent, setShowNewPatent] = useState(false)
  const [showBookLab, setShowBookLab] = useState(false)

  // Metrics
  const [metrics, setMetrics] = useState({
    activeProjects: 0,
    totalBudget: 0,
    budgetUtilized: 0,
    patentsFiled: 0,
    patentsGranted: 0,
    activeExperiments: 0,
    completedExperiments: 0,
    upcomingMilestones: 0,
    activeCollaborations: 0,
  })

  const isManager = user?.role === "rnd_manager" || 
                    user?.role === "dept_manager" || 
                    user?.role === "super_admin" ||
                    user?.department === "Research & Development"

  useEffect(() => {
    loadRNDData()
  }, [user])

  async function loadRNDData() {
    if (!user) return

    try {
      setLoading(true)

      // Load R&D projects
      const projectsData = await getRNDProjects()
      setProjects(projectsData || [])

      // Load experiments
      const experimentsData = await getRNDExperiments()
      setExperiments(experimentsData || [])

      // Load patents
      const patentsData = await getRNDPatents()
      setPatents(patentsData || [])

      // Load lab bookings
      const bookingsData = await getRNDLabBookings()
      setLabBookings(bookingsData || [])

      // Load collaborations
      const collaborationsData = await getRNDCollaborations()
      setCollaborations(collaborationsData || [])

      // Load milestones
      const milestonesData = await getRNDMilestones()
      setMilestones(milestonesData || [])

      // Calculate metrics
      const activeProjects = (projectsData || []).filter((p: any) => p.status === "active").length
      const totalBudget = (projectsData || []).reduce((sum: number, p: any) => sum + parseFloat(p.budget_allocated || 0), 0)
      const budgetUtilized = (projectsData || []).reduce((sum: number, p: any) => sum + parseFloat(p.budget_utilized || 0), 0)
      
      const patentsFiled = (patentsData || []).filter((p: any) => p.status === "filed" || p.status === "under_review" || p.status === "published" || p.status === "granted").length
      const patentsGranted = (patentsData || []).filter((p: any) => p.status === "granted").length

      const activeExperiments = (experimentsData || []).filter((e: any) => e.status === "in_progress" || e.status === "planned").length
      const completedExperiments = (experimentsData || []).filter((e: any) => e.status === "completed").length

      const now = new Date()
      const upcomingMilestones = (milestonesData || []).filter((m: any) => {
        const targetDate = new Date(m.target_date)
        return m.status !== "completed" && targetDate >= now && targetDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      }).length

      const activeCollaborations = (collaborationsData || []).filter((c: any) => c.status === "active").length

      setMetrics({
        activeProjects,
        totalBudget,
        budgetUtilized,
        patentsFiled,
        patentsGranted,
        activeExperiments,
        completedExperiments,
        upcomingMilestones,
        activeCollaborations,
      })
    } catch (error) {
      console.error("Error loading R&D data:", error)
      toast({
        title: "Error",
        description: "Failed to load R&D data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Projects by phase
  const projectsByPhase = projects.reduce((acc: any, p: any) => {
    acc[p.research_phase] = (acc[p.research_phase] || 0) + 1
    return acc
  }, {})

  const phaseData = Object.entries(projectsByPhase).map(([phase, count]) => ({
    phase: phase.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    count,
  }))

  // Budget utilization
  const budgetUtilization = projects.length > 0 
    ? (metrics.budgetUtilized / metrics.totalBudget) * 100 
    : 0

  // Experiments success rate
  const totalExperiments = experiments.length
  const successfulExperiments = experiments.filter((e: any) => e.success === true).length
  const successRate = totalExperiments > 0 ? (successfulExperiments / totalExperiments) * 100 : 0

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

  // Handler functions
  const handleCreateProject = async (data: any) => {
    try {
      await createRNDProject(data)
      await loadRNDData()
      toast({
        title: "Success",
        description: "R&D project created successfully.",
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

  const handleCreateExperiment = async (data: any) => {
    try {
      await createRNDExperiment(data)
      await loadRNDData()
      toast({
        title: "Success",
        description: "Experiment created successfully.",
      })
    } catch (error) {
      console.error("Error creating experiment:", error)
      toast({
        title: "Error",
        description: "Failed to create experiment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCreatePatent = async (data: any) => {
    try {
      await createRNDPatent(data)
      await loadRNDData()
      toast({
        title: "Success",
        description: "Patent filing created successfully.",
      })
    } catch (error) {
      console.error("Error creating patent:", error)
      toast({
        title: "Error",
        description: "Failed to file patent. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBookLab = async (data: any) => {
    try {
      await createRNDLabBooking(data)
      await loadRNDData()
      toast({
        title: "Success",
        description: "Lab booking created successfully.",
      })
    } catch (error: any) {
      console.error("Error booking lab:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to book lab. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleExportReport = async (reportType: string) => {
    try {
      let data: any[] = []
      let filename = ""

      switch (reportType) {
        case "projects":
          data = projects
          filename = `rnd_projects_${new Date().toISOString().split("T")[0]}.csv`
          break
        case "experiments":
          data = experiments
          filename = `rnd_experiments_${new Date().toISOString().split("T")[0]}.csv`
          break
        case "patents":
          data = patents
          filename = `rnd_patents_${new Date().toISOString().split("T")[0]}.csv`
          break
        case "lab_bookings":
          data = labBookings
          filename = `rnd_lab_bookings_${new Date().toISOString().split("T")[0]}.csv`
          break
        case "collaborations":
          data = collaborations
          filename = `rnd_collaborations_${new Date().toISOString().split("T")[0]}.csv`
          break
        case "milestones":
          data = milestones
          filename = `rnd_milestones_${new Date().toISOString().split("T")[0]}.csv`
          break
        default:
          return
      }

      if (data.length === 0) {
        toast({
          title: "No Data",
          description: "No data available to export.",
          variant: "destructive",
        })
        return
      }

      // Convert to CSV
      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(","),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header]
            if (value === null || value === undefined) return ""
            if (Array.isArray(value)) return JSON.stringify(value)
            if (typeof value === "object") return JSON.stringify(value)
            return String(value).replace(/"/g, '""')
          }).join(",")
        )
      ]

      const csvContent = csvRows.join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: `Report exported as ${filename}`,
      })
    } catch (error) {
      console.error("Error exporting report:", error)
      toast({
        title: "Error",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading R&D dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Research & Development Dashboard</h1>
          <p className="text-muted-foreground">
            {isManager 
              ? "Manage research projects, innovation pipeline, patents, and lab resources."
              : "View your research projects and experiments."}
          </p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <Button onClick={() => setShowNewProject(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
            <Button variant="outline" onClick={() => setShowNewPatent(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              File Patent
            </Button>
            <Button variant="outline" onClick={() => {
              const menu = document.createElement("div")
              menu.className = "fixed bg-white border rounded-lg shadow-lg p-2 z-50 min-w-[200px]"
              menu.style.top = "60px"
              menu.style.right = "20px"
              
              const options = [
                { label: "Export Projects", value: "projects" },
                { label: "Export Experiments", value: "experiments" },
                { label: "Export Patents", value: "patents" },
                { label: "Export Lab Bookings", value: "lab_bookings" },
                { label: "Export Collaborations", value: "collaborations" },
                { label: "Export Milestones", value: "milestones" },
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="patents">Patents</TabsTrigger>
          <TabsTrigger value="lab">Lab</TabsTrigger>
          <TabsTrigger value="collaborations">Collaborations</TabsTrigger>
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
                    <p className="text-xs text-muted-foreground mt-1">{projects.length} total</p>
                  </div>
                  <FlaskConical className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Budget Utilization</p>
                    <p className="text-3xl font-bold">{budgetUtilization.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ${(metrics.budgetUtilized / 1000).toFixed(0)}K / ${(metrics.totalBudget / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Patents Filed</p>
                    <p className="text-3xl font-bold">{metrics.patentsFiled}</p>
                    <p className="text-xs text-muted-foreground mt-1">{metrics.patentsGranted} granted</p>
                  </div>
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Experiments</p>
                    <p className="text-3xl font-bold">{metrics.activeExperiments}</p>
                    <p className="text-xs text-muted-foreground mt-1">{metrics.completedExperiments} completed</p>
                  </div>
                  <Beaker className="w-8 h-8 text-orange-600" />
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
                    <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                    <p className="text-2xl font-bold">{successRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{successfulExperiments} / {totalExperiments} experiments</p>
                  </div>
                  <Target className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Upcoming Milestones</p>
                    <p className="text-2xl font-bold">{metrics.upcomingMilestones}</p>
                    <p className="text-xs text-muted-foreground mt-1">Next 30 days</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Collaborations</p>
                    <p className="text-2xl font-bold">{metrics.activeCollaborations}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Projects by Phase</CardTitle>
              </CardHeader>
              <CardContent>
                {phaseData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={phaseData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ phase, count }) => `${phase}: ${count}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {phaseData.map((entry, index) => (
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

            <Card>
              <CardHeader>
                <CardTitle>Budget Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Utilized</span>
                      <span>{budgetUtilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full ${
                          budgetUtilization > 90 ? "bg-red-600" :
                          budgetUtilization > 75 ? "bg-orange-600" :
                          "bg-green-600"
                        }`}
                        style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Budget</p>
                      <p className="font-semibold">${(metrics.totalBudget / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Utilized</p>
                      <p className="font-semibold">${(metrics.budgetUtilized / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {projects.slice(0, 5).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No projects</div>
                ) : (
                  <div className="space-y-3">
                    {projects.slice(0, 5).map((project: any) => (
                      <div key={project.id} className="p-3 bg-secondary rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{project.project_number}</p>
                            <p className="text-xs text-muted-foreground mt-1">{project.research_objective.substring(0, 60)}...</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {project.research_phase.replace("_", " ")} • {project.status}
                            </p>
                          </div>
                          <Badge className={
                            project.status === "active" ? "bg-green-100 text-green-800" :
                            project.status === "completed" ? "bg-blue-100 text-blue-800" :
                            project.status === "on_hold" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }>
                            {project.status}
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
                <CardTitle>Recent Patents</CardTitle>
              </CardHeader>
              <CardContent>
                {patents.slice(0, 5).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No patents</div>
                ) : (
                  <div className="space-y-3">
                    {patents.slice(0, 5).map((patent: any) => (
                      <div key={patent.id} className="p-3 bg-secondary rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{patent.patent_number}</p>
                            <p className="text-xs text-muted-foreground mt-1">{patent.patent_title.substring(0, 60)}...</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {patent.patent_office || "N/A"} • {patent.status}
                            </p>
                          </div>
                          <Badge className={
                            patent.status === "granted" ? "bg-green-100 text-green-800" :
                            patent.status === "filed" ? "bg-blue-100 text-blue-800" :
                            patent.status === "under_review" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }>
                            {patent.status}
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

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>R&D Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Project #</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Phase</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Budget</th>
                      <th className="text-left py-3 px-4 font-semibold">Utilized</th>
                      <th className="text-left py-3 px-4 font-semibold">Start Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No R&D projects
                        </td>
                      </tr>
                    ) : (
                      projects.map((project: any) => (
                        <tr key={project.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{project.project_number}</td>
                          <td className="py-4 px-4">{project.project_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">{project.research_phase.replace("_", " ")}</td>
                          <td className="py-4 px-4">
                            <Badge className={
                              project.status === "active" ? "bg-green-100 text-green-800" :
                              project.status === "completed" ? "bg-blue-100 text-blue-800" :
                              project.status === "on_hold" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {project.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">${(parseFloat(project.budget_allocated || 0) / 1000).toFixed(0)}K</td>
                          <td className="py-4 px-4">${(parseFloat(project.budget_utilized || 0) / 1000).toFixed(0)}K</td>
                          <td className="py-4 px-4">{new Date(project.start_date).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experiments Tab */}
        <TabsContent value="experiments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Experiments</CardTitle>
                <Button onClick={() => setShowNewExperiment(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Experiment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Experiment #</th>
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Project</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Success</th>
                      <th className="text-left py-3 px-4 font-semibold">Conducted By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {experiments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No experiments
                        </td>
                      </tr>
                    ) : (
                      experiments.map((experiment: any) => (
                        <tr key={experiment.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{experiment.experiment_number}</td>
                          <td className="py-4 px-4">{experiment.experiment_name}</td>
                          <td className="py-4 px-4">{experiment.rnd_project_id ? "Linked" : "N/A"}</td>
                          <td className="py-4 px-4">{new Date(experiment.experiment_date).toLocaleDateString()}</td>
                          <td className="py-4 px-4">
                            <Badge className={
                              experiment.status === "completed" ? "bg-green-100 text-green-800" :
                              experiment.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                              experiment.status === "failed" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {experiment.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            {experiment.success === true ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : experiment.success === false ? (
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-4 px-4">{experiment.conducted_by_name}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patents Tab */}
        <TabsContent value="patents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Patents</CardTitle>
                {isManager && (
                  <Button onClick={() => setShowNewPatent(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    File Patent
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Patent #</th>
                      <th className="text-left py-3 px-4 font-semibold">Title</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Office</th>
                      <th className="text-left py-3 px-4 font-semibold">Filing Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          No patents
                        </td>
                      </tr>
                    ) : (
                      patents.map((patent: any) => (
                        <tr key={patent.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{patent.patent_number}</td>
                          <td className="py-4 px-4">{patent.patent_title}</td>
                          <td className="py-4 px-4">{patent.patent_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">{patent.patent_office || "N/A"}</td>
                          <td className="py-4 px-4">{patent.filing_date ? new Date(patent.filing_date).toLocaleDateString() : "N/A"}</td>
                          <td className="py-4 px-4">
                            <Badge className={
                              patent.status === "granted" ? "bg-green-100 text-green-800" :
                              patent.status === "filed" ? "bg-blue-100 text-blue-800" :
                              patent.status === "under_review" ? "bg-yellow-100 text-yellow-800" :
                              patent.status === "rejected" ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {patent.status}
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

        {/* Lab Tab */}
        <TabsContent value="lab" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Lab Bookings</CardTitle>
                <Button onClick={() => setShowBookLab(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Book Lab
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Booking #</th>
                      <th className="text-left py-3 px-4 font-semibold">Lab Space</th>
                      <th className="text-left py-3 px-4 font-semibold">Equipment</th>
                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Time</th>
                      <th className="text-left py-3 px-4 font-semibold">Duration</th>
                      <th className="text-left py-3 px-4 font-semibold">Booked By</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labBookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                          No lab bookings
                        </td>
                      </tr>
                    ) : (
                      labBookings.map((booking: any) => (
                        <tr key={booking.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{booking.booking_number}</td>
                          <td className="py-4 px-4">{booking.lab_space}</td>
                          <td className="py-4 px-4">{booking.equipment_name || "N/A"}</td>
                          <td className="py-4 px-4">{new Date(booking.booking_date).toLocaleDateString()}</td>
                          <td className="py-4 px-4">{booking.start_time} - {booking.end_time}</td>
                          <td className="py-4 px-4">{booking.duration_hours ? `${booking.duration_hours}h` : "N/A"}</td>
                          <td className="py-4 px-4">{booking.booked_by_name}</td>
                          <td className="py-4 px-4">
                            <Badge className={
                              booking.status === "completed" ? "bg-green-100 text-green-800" :
                              booking.status === "in_use" ? "bg-blue-100 text-blue-800" :
                              booking.status === "scheduled" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {booking.status}
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

        {/* Collaborations Tab */}
        <TabsContent value="collaborations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collaborations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Collaboration #</th>
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Partner</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Start Date</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collaborations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No collaborations
                        </td>
                      </tr>
                    ) : (
                      collaborations.map((collab: any) => (
                        <tr key={collab.id} className="border-b hover:bg-secondary/50">
                          <td className="py-4 px-4 font-medium">{collab.collaboration_number}</td>
                          <td className="py-4 px-4">{collab.collaboration_name}</td>
                          <td className="py-4 px-4">{collab.partner_name}</td>
                          <td className="py-4 px-4">{collab.collaboration_type.replace("_", " ")}</td>
                          <td className="py-4 px-4">{new Date(collab.start_date).toLocaleDateString()}</td>
                          <td className="py-4 px-4">
                            <Badge className={
                              collab.status === "active" ? "bg-green-100 text-green-800" :
                              collab.status === "completed" ? "bg-blue-100 text-blue-800" :
                              collab.status === "on_hold" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {collab.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">${(parseFloat(collab.budget_allocated || 0) / 1000).toFixed(0)}K</td>
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
      <NewRNDProjectModal
        isOpen={showNewProject}
        onClose={() => setShowNewProject(false)}
        onSubmit={handleCreateProject}
      />

      <NewRNDExperimentModal
        isOpen={showNewExperiment}
        onClose={() => setShowNewExperiment(false)}
        onSubmit={handleCreateExperiment}
      />

      <NewRNDPatentModal
        isOpen={showNewPatent}
        onClose={() => setShowNewPatent(false)}
        onSubmit={handleCreatePatent}
      />

      <BookLabModal
        isOpen={showBookLab}
        onClose={() => setShowBookLab(false)}
        onSubmit={handleBookLab}
      />
    </div>
  )
}

