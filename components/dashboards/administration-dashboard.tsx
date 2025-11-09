"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Briefcase, 
  FileCheck, 
  Package, 
  TrendingUp, 
  Users, 
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  BarChart3
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

export function AdministrationDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingRequests: 0,
    totalAssets: 0,
    assetUtilization: 0,
  })
  const [projects, setProjects] = useState<any[]>([])
  const [assets, setAssets] = useState<any[]>([])
  const [approvalRequests, setApprovalRequests] = useState<any[]>([])
  const [workflowTasks, setWorkflowTasks] = useState<any[]>([])

  useEffect(() => {
    loadAdministrationData()
  }, [user])

  async function loadAdministrationData() {
    try {
      setLoading(true)

      // Get Administration projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("department", "Administration")
        .order("created_at", { ascending: false })

      // Get office assets
      const { data: assetsData } = await supabase
        .from("assets")
        .select("*")
        .in("category", ["Furniture", "Office Equipment", "Supplies"])
        .order("created_at", { ascending: false })

      // Get approval requests
      const { data: requestsData } = await supabase
        .from("approval_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      // Get workflow tasks
      const { data: tasksData } = await supabase
        .from("workflow_tasks")
        .select("*")
        .eq("department", "Administration")
        .order("created_at", { ascending: false })

      // Calculate stats
      const activeProjects = projectsData?.filter(
        (p: any) => p.status === "In Progress" || p.status === "Planning"
      ).length || 0

      const pendingRequests = requestsData?.length || 0
      const totalAssets = assetsData?.length || 0
      const assignedAssets = assetsData?.filter(
        (a: any) => a.status === "Assigned" || a.status === "In Use"
      ).length || 0
      const assetUtilization = totalAssets > 0 
        ? Math.round((assignedAssets / totalAssets) * 100) 
        : 0

      setStats({
        activeProjects,
        pendingRequests,
        totalAssets,
        assetUtilization,
      })
      setProjects(projectsData || [])
      setAssets(assetsData?.slice(0, 12) || [])
      setApprovalRequests(requestsData?.slice(0, 10) || [])
      setWorkflowTasks(tasksData?.slice(0, 10) || [])
    } catch (error) {
      console.error("Error loading administration data:", error)
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      label: "Active Projects",
      value: stats.activeProjects.toString(),
      icon: Briefcase,
      color: "from-blue-500/10 to-blue-500/5",
      iconColor: "text-blue-600",
    },
    {
      label: "Pending Requests",
      value: stats.pendingRequests.toString(),
      icon: FileCheck,
      color: "from-orange-500/10 to-orange-500/5",
      iconColor: "text-orange-600",
    },
    {
      label: "Office Assets",
      value: stats.totalAssets.toString(),
      icon: Package,
      color: "from-green-500/10 to-green-500/5",
      iconColor: "text-green-600",
    },
    {
      label: "Asset Utilization",
      value: `${stats.assetUtilization}%`,
      icon: TrendingUp,
      color: "from-purple-500/10 to-purple-500/5",
      iconColor: "text-purple-600",
    },
  ]

  if (loading) {
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Administration & Operations Dashboard</h1>
          <p className="text-muted-foreground mt-2">Project management, asset tracking, and operational coordination</p>
        </div>
        <Button onClick={loadAdministrationData} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className={`p-6 bg-gradient-to-br ${stat.color} hover:shadow-lg transition-shadow`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`w-10 h-10 ${stat.iconColor}`} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Administration Projects */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">Administration Projects</h3>
            <Badge variant="outline">{projects.length} projects</Badge>
          </div>
          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((project: any) => (
                <div key={project.id} className="p-4 bg-muted rounded">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FolderKanban className="w-4 h-4 text-muted-foreground" />
                        <p className="font-semibold text-foreground">{project.name}</p>
                      </div>
                      {project.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    <Badge
                      variant={
                        project.status === "Completed"
                          ? "default"
                          : project.status === "In Progress"
                          ? "secondary"
                          : project.status === "On Hold"
                          ? "outline"
                          : "secondary"
                      }
                      className="text-xs ml-2"
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Progress</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-background rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{project.progress || 0}%</span>
                      </div>
                    </div>
                    {project.due_date && (
                      <div>
                        <p className="text-xs text-muted-foreground">Due Date</p>
                        <p className="text-xs font-medium mt-1">
                          {new Date(project.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                  {project.budget && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="text-xs font-medium mt-1">
                        ${parseFloat(project.budget).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No projects found</p>
            </div>
          )}
        </Card>

        {/* Pending Approval Requests */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">Pending Approval Requests</h3>
            {approvalRequests.length > 0 && (
              <Badge variant="secondary">{approvalRequests.length} pending</Badge>
            )}
          </div>
          {approvalRequests.length > 0 ? (
            <div className="space-y-3">
              {approvalRequests.map((request: any) => (
                <div key={request.id} className="p-3 bg-muted rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">{request.request_type}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{request.description}</p>
                    </div>
                    {request.amount && (
                      <Badge variant="outline" className="text-xs ml-2">
                        ${parseFloat(request.amount).toLocaleString()}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(request.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending requests</p>
            </div>
          )}
        </Card>
      </div>

      {/* Office Assets */}
      {assets.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">Office Assets</h3>
            <Badge variant="outline">{assets.length} assets</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {assets.map((asset: any) => (
              <div key={asset.id} className="p-3 bg-muted rounded">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">{asset.category}</p>
                  </div>
                  <Badge
                    variant={
                      asset.status === "Available"
                        ? "default"
                        : asset.status === "Assigned" || asset.status === "In Use"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs"
                  >
                    {asset.status}
                  </Badge>
                </div>
                {asset.location && (
                  <p className="text-xs text-muted-foreground mt-2">{asset.location}</p>
                )}
                {asset.assignee_name && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Assigned to: {asset.assignee_name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Workflow Tasks */}
      {workflowTasks.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground">Operational Tasks</h3>
            <Badge variant="outline">{workflowTasks.length} tasks</Badge>
          </div>
          <div className="space-y-3">
            {workflowTasks.map((task: any) => (
              <div key={task.id} className="p-3 bg-muted rounded flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{task.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      task.priority === "critical"
                        ? "destructive"
                        : task.priority === "high"
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {task.priority}
                  </Badge>
                  <Badge
                    variant={
                      task.status === "completed"
                        ? "default"
                        : task.status === "in_progress"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs"
                  >
                    {task.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

