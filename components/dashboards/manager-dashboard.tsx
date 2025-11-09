"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, CheckCircle, AlertCircle, TrendingUp, Briefcase, Clock, Target, FileCheck } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { getWorkflowTasks, getApprovalRequests } from "@/lib/database"

export function ManagerDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [managerStats, setManagerStats] = useState({
    teamMembers: 0,
    activeProjects: 0,
    completedTasks: 0,
    pendingApprovals: 0,
  })
  const [teamProductivity, setTeamProductivity] = useState<any[]>([])
  const [projectStatus, setProjectStatus] = useState<any[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [taskDistribution, setTaskDistribution] = useState<any[]>([])

  useEffect(() => {
    loadManagerData()
  }, [user])

  async function loadManagerData() {
    if (!user) return
    
    try {
      setLoading(true)

      // Get team members (employees in same department)
      const { data: employees } = await supabase
        .from("employees")
        .select("*")
        .eq("department", user.department)
        .eq("status", "Active")

      // Get projects for department
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .eq("department", user.department)
        .order("created_at", { ascending: false })

      // Get workflow tasks for team
      const tasks = await getWorkflowTasks()
      const teamTasks = tasks?.filter((t: any) => t.department === user.department) || []

      // Get approval requests
      const approvals = await getApprovalRequests(user.id)
      const pending = approvals?.filter((a: any) => a.status === "pending") || []

      // Calculate stats
      const activeProjects = projects?.filter((p: any) => 
        p.status === "In Progress" || p.status === "Planning"
      ).length || 0

      const completedTasks = teamTasks?.filter((t: any) => t.status === "completed").length || 0

      // Generate productivity data (last 4 weeks)
      const weeks = ["W1", "W2", "W3", "W4"]
      const productivity = weeks.map((week, idx) => {
        const weekTasks = teamTasks?.filter((t: any) => {
          const taskDate = new Date(t.created_at)
          const weekStart = new Date()
          weekStart.setDate(weekStart.getDate() - (4 - idx) * 7)
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekEnd.getDate() + 7)
          return taskDate >= weekStart && taskDate < weekEnd
        }) || []
        const completed = weekTasks.filter((t: any) => t.status === "completed").length
        const pending = weekTasks.filter((t: any) => 
          t.status === "pending" || t.status === "in_progress"
        ).length
        return { week, completed, pending }
      })

      // Project status
      const projectData = projects?.slice(0, 4).map((p: any) => ({
        project: p.name.length > 20 ? p.name.substring(0, 20) + "..." : p.name,
        progress: p.progress || 0,
        status: p.status,
      })) || []

      // Task distribution by priority
      const priorityMap: Record<string, number> = {}
      teamTasks?.forEach((t: any) => {
        priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1
      })
      const taskDist = Object.entries(priorityMap).map(([priority, count]) => ({
        priority: priority.charAt(0).toUpperCase() + priority.slice(1),
        count,
      }))

      setManagerStats({
        teamMembers: employees?.length || 0,
        activeProjects,
        completedTasks,
        pendingApprovals: pending.length,
      })
      setTeamMembers(employees?.slice(0, 8) || [])
      setProjectStatus(projectData)
      setPendingApprovals(pending.slice(0, 5))
      setTeamProductivity(productivity)
      setTaskDistribution(taskDist)
    } catch (error) {
      console.error("Error loading manager data:", error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      label: "Team Members",
      value: managerStats.teamMembers.toString(),
      icon: Users,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Active Projects",
      value: managerStats.activeProjects.toString(),
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
    },
    {
      label: "Completed Tasks",
      value: managerStats.completedTasks.toString(),
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
    },
    {
      label: "Pending Approvals",
      value: managerStats.pendingApprovals.toString(),
      icon: AlertCircle,
      color: "from-yellow-500 to-yellow-600",
      alert: managerStats.pendingApprovals > 5,
    },
  ]

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manager Dashboard</h1>
          <p className="text-muted-foreground mt-1">Team Performance & Project Tracking</p>
          <p className="text-sm text-muted-foreground mt-1">
            Managing {user?.department} • {managerStats.teamMembers} team members
          </p>
        </div>
        <Button onClick={loadManagerData} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                {stat.alert && (
                  <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Action needed
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Team Productivity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamProductivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Task Distribution by Priority</h2>
          {taskDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ priority, percent }) => `${priority}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {taskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No task data available</p>
            </div>
          )}
        </Card>
      </div>

      {/* Project Progress */}
      {projectStatus.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Project Progress</h2>
          <div className="space-y-4">
            {projectStatus.map((project, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{project.project}</span>
                    <Badge variant="outline" className="text-xs">{project.status}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{project.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      project.progress >= 80
                        ? "bg-green-600"
                        : project.progress >= 50
                        ? "bg-blue-600"
                        : "bg-yellow-600"
                    }`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Items Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Pending Approvals</h2>
            {pendingApprovals.length > 0 && (
              <Badge variant="destructive">{pendingApprovals.length}</Badge>
            )}
          </div>
          {pendingApprovals.length > 0 ? (
            <div className="space-y-3">
              {pendingApprovals.map((approval: any) => (
                <div key={approval.id} className="p-3 bg-muted rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{approval.description}</p>
                      <p className="text-xs text-muted-foreground">{approval.request_type}</p>
                    </div>
                    {approval.amount && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          ${parseFloat(approval.amount).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">{approval.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(approval.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending approvals</p>
            </div>
          )}
        </Card>

        {/* Team Members */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Team Members</h2>
            <Badge variant="outline">{teamMembers.length}</Badge>
          </div>
          {teamMembers.length > 0 ? (
            <div className="space-y-3">
              {teamMembers.map((member: any) => (
                <div key={member.id} className="p-3 bg-muted rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                    <Badge variant="default" className="text-xs">{member.status}</Badge>
                  </div>
                  {member.email && (
                    <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No team members found</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
