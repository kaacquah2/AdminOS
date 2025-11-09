"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Plus, CheckCircle2, Clock } from "lucide-react"
import { NewProjectModal } from "@/components/modals/new-project-modal"
import { getProjects, createProject } from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

export function ProjectsModule() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const projectsData = await getProjects()
      setProjects(projectsData || [])
    } catch (error) {
      console.error("Error loading projects:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const activeProjects = projects.filter((p) => p.status === "In Progress" || p.status === "Planning").length
  const completedProjects = projects.filter((p) => p.status === "Completed").length
  const onScheduleProjects = projects.filter((p) => {
    if (!p.due_date || p.status === "Completed") return false
    const dueDate = new Date(p.due_date)
    const now = new Date()
    const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    const expectedProgress = (daysUntilDue / 30) * 100 // Assuming 30 days project
    return p.progress >= expectedProgress
  }).length
  const atRiskProjects = projects.filter((p) => {
    if (!p.due_date || p.status === "Completed") return false
    const dueDate = new Date(p.due_date)
    const now = new Date()
    const daysUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return daysUntilDue < 7 && p.progress < 80
  }).length

  const handleSubmitNewProject = async (data: any) => {
    try {
      // Get current user's employee ID
      const { data: employee } = await supabase
        .from("employees")
        .select("id, name")
        .eq("user_id", user?.id)
        .single()

      await createProject({
        name: data.name,
        department: data.department,
        status: "Planning",
        progress: 0,
        due_date: data.dueDate,
        owner_id: employee?.id,
        owner_name: employee?.name || "Current User",
      })
      await loadData()
    } catch (error) {
      console.error("Error creating project:", error)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projects & Tasks</h1>
          <p className="text-muted-foreground">Manage company projects and track deliverables.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowNewProjectModal(true)}>
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Active Projects</p>
          <p className="text-3xl font-bold">{loading ? "..." : activeProjects}</p>
          <p className="text-xs text-blue-600 mt-2">In progress or planning</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Completed</p>
          <p className="text-3xl font-bold">{loading ? "..." : completedProjects}</p>
          <p className="text-xs text-green-600 mt-2">This year</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">On Schedule</p>
          <p className="text-3xl font-bold">{loading ? "..." : onScheduleProjects}</p>
          <p className="text-xs text-green-600 mt-2">No delays</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">At Risk</p>
          <p className="text-3xl font-bold">{loading ? "..." : atRiskProjects}</p>
          <p className="text-xs text-red-600 mt-2">Needs attention</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Active Projects</h3>
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects found</p>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="border border-border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">{project.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.department} • Owner: {project.owner_name || "Unassigned"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : project.status === "In Progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {project.status === "Completed" && <CheckCircle2 className="w-3 h-3" />}
                    {project.status === "In Progress" && <Clock className="w-3 h-3" />}
                    {project.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-semibold">{project.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${project.progress || 0}%` }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Due: {project.due_date ? new Date(project.due_date).toLocaleDateString() : "Not set"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onSubmit={handleSubmitNewProject}
      />
    </div>
  )
}
