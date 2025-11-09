"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Award, BookOpen, Users, TrendingUp, Calendar, CheckCircle, Clock, Target } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

export function TrainingDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [trainingStats, setTrainingStats] = useState({
    activePrograms: 0,
    certifiedEmployees: 0,
    inProgress: 0,
    completionRate: 0,
  })
  const [trainingEnrollment, setTrainingEnrollment] = useState<any[]>([])
  const [certificationStatus, setCertificationStatus] = useState<any[]>([])
  const [activePrograms, setActivePrograms] = useState<any[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])
  const [completionRates, setCompletionRates] = useState<any[]>([])

  useEffect(() => {
    loadTrainingData()
  }, [user])

  async function loadTrainingData() {
    try {
      setLoading(true)

      // Get training programs
      const { data: programs } = await supabase
        .from("training_programs")
        .select("*")
        .order("start_date", { ascending: true })

      // Get training enrollments
      const { data: enrollments } = await supabase
        .from("training_enrollments")
        .select("*")
        .order("created_at", { ascending: false })

      // Calculate stats
      const active = programs?.filter((p: any) => p.status === "upcoming" || p.status === "in_progress").length || 0
      const completed = enrollments?.filter((e: any) => e.status === "completed").length || 0
      const inProgress = enrollments?.filter((e: any) => e.status === "enrolled").length || 0
      const totalEnrolled = enrollments?.length || 0
      const completionRate = totalEnrolled > 0 ? Math.round((completed / totalEnrolled) * 100) : 0

      // Active programs
      const activeList = programs?.filter((p: any) => p.status === "upcoming" || p.status === "in_progress").slice(0, 5) || []

      // Upcoming sessions (next 30 days)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      const upcoming = programs?.filter((p: any) => {
        if (!p.start_date) return false
        const start = new Date(p.start_date)
        return start <= thirtyDaysFromNow && start >= new Date()
      }).slice(0, 5) || []

      // Generate enrollment data (last 6 months)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
      const enrollmentData = months.map((month, idx) => {
        const monthEnrollments = enrollments?.filter((e: any) => {
          const enrollMonth = new Date(e.created_at).getMonth()
          return enrollMonth === idx
        }) || []
        const monthCompleted = enrollments?.filter((e: any) => {
          if (!e.completion_date) return false
          const completeMonth = new Date(e.completion_date).getMonth()
          return completeMonth === idx
        }) || []
        return {
          month,
          enrolled: monthEnrollments.length,
          completed: monthCompleted.length,
        }
      })

      // Certification status by program
      const certMap: Record<string, number> = {}
      programs?.forEach((program: any) => {
        const programCompletions = enrollments?.filter(
          (e: any) => e.program_id === program.id && e.status === "completed"
        ).length || 0
        if (programCompletions > 0) {
          certMap[program.title] = programCompletions
        }
      })
      const certData = Object.entries(certMap)
        .slice(0, 5)
        .map(([cert, count]) => ({
          cert: cert.length > 20 ? cert.substring(0, 20) + "..." : cert,
          count,
        }))

      // Completion rates by category
      const categoryMap: Record<string, { enrolled: number; completed: number }> = {}
      programs?.forEach((program: any) => {
        if (!categoryMap[program.category || "Other"]) {
          categoryMap[program.category || "Other"] = { enrolled: 0, completed: 0 }
        }
        const programEnrollments = enrollments?.filter((e: any) => e.program_id === program.id).length || 0
        const programCompletions = enrollments?.filter(
          (e: any) => e.program_id === program.id && e.status === "completed"
        ).length || 0
        categoryMap[program.category || "Other"].enrolled += programEnrollments
        categoryMap[program.category || "Other"].completed += programCompletions
      })
      const completionData = Object.entries(categoryMap).map(([category, data]) => ({
        category: category.length > 15 ? category.substring(0, 15) + "..." : category,
        rate: data.enrolled > 0 ? Math.round((data.completed / data.enrolled) * 100) : 0,
      }))

      setTrainingStats({
        activePrograms: active,
        certifiedEmployees: completed,
        inProgress,
        completionRate,
      })
      setActivePrograms(activeList)
      setUpcomingSessions(upcoming)
      setTrainingEnrollment(enrollmentData)
      setCertificationStatus(certData)
      setCompletionRates(completionData)
    } catch (error) {
      console.error("Error loading training data:", error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      label: "Active Programs",
      value: trainingStats.activePrograms.toString(),
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Certified Employees",
      value: trainingStats.certifiedEmployees.toString(),
      icon: Award,
      color: "from-green-500 to-green-600",
    },
    {
      label: "In Progress",
      value: trainingStats.inProgress.toString(),
      icon: Users,
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Completion Rate",
      value: `${trainingStats.completionRate}%`,
      icon: TrendingUp,
      color: "from-orange-500 to-orange-600",
    },
  ]

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
          <h1 className="text-3xl font-bold text-foreground">Training Dashboard</h1>
          <p className="text-muted-foreground mt-1">Employee Development & Certifications</p>
        </div>
        <Button onClick={loadTrainingData} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
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
          <h2 className="text-lg font-semibold text-foreground mb-4">Training Enrollment & Completion</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trainingEnrollment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
              <Legend />
              <Line type="monotone" dataKey="enrolled" stroke="#3b82f6" strokeWidth={2} name="Enrolled" />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Certification Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={certificationStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="cert" angle={-45} textAnchor="end" height={100} stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Active Programs */}
      {activePrograms.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Active Training Programs</h2>
            <Badge variant="outline">{activePrograms.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePrograms.map((program: any) => {
              const enrollmentPct = program.capacity > 0
                ? Math.round((program.enrolled_count / program.capacity) * 100)
                : 0
              return (
                <div key={program.id} className="p-4 bg-muted rounded">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{program.title}</p>
                      <p className="text-xs text-muted-foreground">{program.category}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{program.status}</Badge>
                  </div>
                  {program.start_date && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Calendar className="w-3 h-3" />
                      <span>Starts: {new Date(program.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {program.capacity && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Enrollment</span>
                        <span className="text-foreground font-semibold">
                          {program.enrolled_count || 0}/{program.capacity}
                        </span>
                      </div>
                      <div className="w-full bg-background rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            enrollmentPct >= 90 ? "bg-red-600" : enrollmentPct >= 70 ? "bg-yellow-600" : "bg-blue-600"
                          }`}
                          style={{ width: `${Math.min(enrollmentPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {program.duration && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Duration: {program.duration} {program.duration === 1 ? "day" : "days"}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Completion Rates by Category */}
      {completionRates.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Completion Rates by Category</h2>
          <div className="space-y-4">
            {completionRates.map((item: any, index: number) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{item.category}</span>
                  <span className="text-sm font-semibold text-foreground">{item.rate}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      item.rate >= 80 ? "bg-green-600" : item.rate >= 60 ? "bg-yellow-600" : "bg-red-600"
                    }`}
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Upcoming Training Sessions</h2>
            <Badge variant="secondary">{upcomingSessions.length}</Badge>
          </div>
          <div className="space-y-3">
            {upcomingSessions.map((session: any) => {
              const daysUntil = session.start_date
                ? Math.ceil(
                    (new Date(session.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  )
                : null
              return (
                <div key={session.id} className="p-3 bg-muted rounded">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{session.title}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {session.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(session.start_date).toLocaleDateString()}
                          </span>
                        )}
                        {session.instructor && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {session.instructor}
                          </span>
                        )}
                        {session.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.duration} days
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {daysUntil !== null && (
                        <Badge variant={daysUntil <= 7 ? "default" : "secondary"} className="text-xs">
                          {daysUntil} days
                        </Badge>
                      )}
                      {session.enrolled_count !== undefined && session.capacity && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {session.enrolled_count}/{session.capacity} enrolled
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
