"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { createWorkflowTask, getWorkflowTasks, updateWorkflowTask } from "@/lib/database"
import { dbToWorkflowTask, workflowTaskToDb, type WorkflowTask } from "@/lib/type-adapters"
import { Clock, Plus, Filter, MessageSquare, Send } from "lucide-react"

export function WorkflowsModule() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<WorkflowTask[]>([])
  const [filter, setFilter] = useState<"all" | "assigned" | "created" | "completed">("all")
  const [showNewTask, setShowNewTask] = useState(false)
  const [selectedTask, setSelectedTask] = useState<WorkflowTask | null>(null)
  const [newComment, setNewComment] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium" as const,
    dueDate: "",
  })

  useEffect(() => {
    loadTasks()
  }, [user])

  async function loadTasks() {
    if (user) {
      const dbTasks = await getWorkflowTasks(user.id)
      setTasks(dbTasks.map(dbToWorkflowTask))
    }
  }

  async function handleCreateTask() {
    if (!user || !formData.title || !formData.assignedTo) return

    const taskData = workflowTaskToDb({
      title: formData.title,
      description: formData.description,
      assignedTo: formData.assignedTo,
      assignedBy: user.id,
      department: user.department,
      status: "pending",
      priority: formData.priority,
      dueDate: formData.dueDate,
      attachments: [],
      comments: [],
    })

    const dbTask = await createWorkflowTask(taskData)
    if (dbTask) {
      const task = dbToWorkflowTask(dbTask)
      setTasks([...tasks, task])
      setFormData({ title: "", description: "", assignedTo: "", priority: "medium", dueDate: "" })
      setShowNewTask(false)
    }
  }

  async function handleStatusChange(taskId: string, newStatus: WorkflowTask["status"]) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    
    const dbTask = await updateWorkflowTask(taskId, { status: newStatus })
    if (dbTask) {
      const updated = dbToWorkflowTask(dbTask)
      setTasks(tasks.map((t) => (t.id === taskId ? updated : t)))
      if (selectedTask?.id === taskId) {
        setSelectedTask(updated)
      }
    }
  }

  async function handleAddComment(taskId: string) {
    if (!user || !newComment.trim()) return

    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const updatedComments = [
      ...(task.comments || []),
      {
        id: `comment-${Date.now()}`,
        author: user.fullName,
        text: newComment,
        timestamp: new Date().toISOString(),
      },
    ]

    const dbTask = await updateWorkflowTask(taskId, {
      comments: updatedComments.map(c => ({
        id: c.id,
        author: c.author,
        text: c.text,
        timestamp: c.timestamp,
      })),
    })
    
    if (dbTask) {
      const updated = dbToWorkflowTask(dbTask)
      setTasks(tasks.map((t) => (t.id === taskId ? updated : t)))
      setSelectedTask(updated)
      setNewComment("")
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === "assigned") return task.assignedTo === user?.id
    if (filter === "created") return task.assignedBy === user?.id
    if (filter === "completed") return task.status === "completed"
    return true
  })

  const statusColors: Record<WorkflowTask["status"], string> = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
  }

  const priorityColors: Record<WorkflowTask["priority"], string> = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workflows & Tasks</h1>
          <p className="text-muted-foreground">Manage team tasks and project workflows</p>
        </div>
        <Button onClick={() => setShowNewTask(!showNewTask)} className="gap-2">
          <Plus size={20} />
          New Task
        </Button>
      </div>

      {showNewTask && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Create New Task</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Task Title</label>
                <Input
                  placeholder="Enter task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option>low</option>
                  <option>medium</option>
                  <option>high</option>
                  <option>critical</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                placeholder="Task description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Assign To</label>
                <Input
                  placeholder="User ID"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateTask} className="flex-1">
                Create Task
              </Button>
              <Button onClick={() => setShowNewTask(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        {(["all", "assigned", "created", "completed"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="gap-2">
            <Filter size={16} />
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock size={48} className="text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tasks found</p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Card
                key={task.id}
                className="cursor-pointer hover:border-primary/50 transition"
                onClick={() => setSelectedTask(task)}
              >
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      <div className="flex gap-2 mt-3">
                        <Badge className={statusColors[task.status]}>{task.status}</Badge>
                        <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                        {task.dueDate && <Badge variant="outline">{new Date(task.dueDate).toLocaleDateString()}</Badge>}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          ⋮
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {task.status !== "completed" && (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusChange(task.id, "in_progress")}>
                              Start Work
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(task.id, "completed")}>
                              Mark Complete
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => handleStatusChange(task.id, "approved")}>
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(task.id, "rejected")}
                          className="text-red-600"
                        >
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {selectedTask && (
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={`${statusColors[selectedTask.status]} mt-1`}>{selectedTask.status}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <Badge className={`${priorityColors[selectedTask.priority]} mt-1`}>{selectedTask.priority}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assigned To</p>
                <p className="font-medium">{selectedTask.assignedTo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{new Date(selectedTask.dueDate).toLocaleDateString()}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare size={18} />
                  Comments ({selectedTask.comments?.length || 0})
                </h4>
                <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                  {(selectedTask.comments || []).map((comment) => (
                    <div key={comment.id} className="bg-muted p-3 rounded text-sm">
                      <p className="font-medium">{comment.author}</p>
                      <p className="text-muted-foreground text-xs">{new Date(comment.timestamp).toLocaleString()}</p>
                      <p className="mt-1">{comment.text}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={() => handleAddComment(selectedTask.id)} disabled={!newComment.trim()}>
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
