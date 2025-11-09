"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { CheckCircle, Clock, Plus, Users, Award, Calendar } from "lucide-react"
import { getTrainingPrograms, getTrainingEnrollments, getEmployees, createTrainingProgram, createTrainingEnrollment } from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function TrainingModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [courses, setCourses] = useState<any[]>([])
  const [trainingPlans, setTrainingPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProgramModal, setShowNewProgramModal] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<any>(null)
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    duration: "",
    instructor: "",
    capacity: "",
    start_date: "",
    end_date: "",
    status: "upcoming",
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [programsData, enrollmentsData, employeesData] = await Promise.all([
        getTrainingPrograms(),
        getTrainingEnrollments(),
        getEmployees(),
      ])

      // Transform programs to courses format
      const transformedCourses = (programsData || []).map((program: any) => {
        const programEnrollments = (enrollmentsData || []).filter((e: any) => e.program_id === program.id)
        const completed = programEnrollments.filter((e: any) => e.status === "completed").length
        return {
          id: program.id,
          title: program.title,
          duration: program.duration ? `${program.duration} weeks` : "N/A",
          enrolled: programEnrollments.length,
          completed,
          status: program.status === "completed" ? "Completed" : "Active",
        }
      })
      setCourses(transformedCourses)

      // Create training plans from enrollments
      const plansMap = new Map()
      enrollmentsData?.forEach((enrollment: any) => {
        const employee = employeesData?.find((e: any) => e.id === enrollment.employee_id)
        if (!employee) return

        if (!plansMap.has(employee.id)) {
          plansMap.set(employee.id, {
            id: employee.id,
            employee: employee.name,
            courses: [],
            completed: 0,
            total: 0,
          })
        }
        const plan = plansMap.get(employee.id)
        const program = programsData?.find((p: any) => p.id === enrollment.program_id)
        if (program) {
          plan.courses.push(program.title)
          plan.total++
          if (enrollment.status === "completed") plan.completed++
        }
      })

      const plans = Array.from(plansMap.values()).map((plan: any) => ({
        ...plan,
        progress: plan.total > 0 ? Math.round((plan.completed / plan.total) * 100) : 0,
      }))
      setTrainingPlans(plans.slice(0, 10)) // Limit to 10 plans
    } catch (error) {
      console.error("Error loading training data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats
  const activeCourses = courses.filter((c) => c.status === "Active").length
  const totalEnrollments = courses.reduce((sum, c) => sum + c.enrolled, 0)
  const certifiedEmployees = trainingPlans.filter((p) => p.progress === 100).length

  const handleCreateProgram = async () => {
    if (!formData.title || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      await createTrainingProgram({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        instructor: formData.instructor,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        status: formData.status,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      })
      await loadData()
      setShowNewProgramModal(false)
      setFormData({
        title: "",
        description: "",
        category: "",
        duration: "",
        instructor: "",
        capacity: "",
        start_date: "",
        end_date: "",
        status: "upcoming",
      })
      toast({
        title: "Success",
        description: "Training program created successfully.",
      })
    } catch (error) {
      console.error("Error creating program:", error)
      toast({
        title: "Error",
        description: "Failed to create training program. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEnrollEmployee = async (programId: string, employeeId: string) => {
    try {
      await createTrainingEnrollment({
        program_id: programId,
        employee_id: employeeId,
        status: "enrolled",
      })
      await loadData()
      setShowEnrollmentModal(false)
      toast({
        title: "Success",
        description: "Employee enrolled successfully.",
      })
    } catch (error) {
      console.error("Error enrolling employee:", error)
      toast({
        title: "Error",
        description: "Failed to enroll employee. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Training & Development</h1>
          <p className="text-muted-foreground">
            Manage employee training programs, certifications, and development plans.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowNewProgramModal(true)}>
          <Plus className="w-4 h-4" />
          New Program
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Active Courses</p>
          <p className="text-3xl font-bold">{loading ? "..." : activeCourses}</p>
          <p className="text-xs text-blue-600 mt-2">{totalEnrollments} total enrollments</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Certified Employees</p>
          <p className="text-3xl font-bold">{loading ? "..." : certifiedEmployees}</p>
          <p className="text-xs text-green-600 mt-2">Completed all courses</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Programs</p>
          <p className="text-3xl font-bold">{loading ? "..." : courses.length}</p>
          <p className="text-xs text-orange-600 mt-2">Training programs available</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Active Courses</h2>
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading courses...</p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No courses found</p>
            ) : (
              courses.map((course) => (
                <div key={course.id} className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{course.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.duration}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded font-semibold ${
                        course.status === "Active" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                      }`}
                    >
                      {course.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {course.completed} of {course.enrolled} completed
                  </div>
                  <div className="w-full bg-secondary-foreground/20 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${course.enrolled > 0 ? (course.completed / course.enrolled) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Development Plans</h2>
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading training plans...</p>
            ) : trainingPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No training plans found</p>
            ) : (
              trainingPlans.map((plan) => (
                <div key={plan.id} className="p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{plan.employee}</p>
                      <p className="text-sm text-muted-foreground">{plan.courses.join(", ") || "No courses"}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">{plan.progress}%</span>
                  </div>
                  <div className="w-full bg-secondary-foreground/20 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${plan.progress}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* New Program Modal */}
      <Dialog open={showNewProgramModal} onOpenChange={setShowNewProgramModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Training Program</DialogTitle>
            <DialogDescription>Create a new training program for employees.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Leadership Development Program"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Program description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Leadership">Leadership</SelectItem>
                    <SelectItem value="Professional Development">Professional Development</SelectItem>
                    <SelectItem value="Technical Skills">Technical Skills</SelectItem>
                    <SelectItem value="Compliance & Safety">Compliance & Safety</SelectItem>
                    <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="HR & Compliance">HR & Compliance</SelectItem>
                    <SelectItem value="Customer Service">Customer Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (weeks)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 8"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Instructor</Label>
                <Input
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  placeholder="Instructor name"
                />
              </div>
              <div>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="Max participants"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProgramModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProgram}>Create Program</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
