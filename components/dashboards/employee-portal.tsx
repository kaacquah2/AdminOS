"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { Calendar, Clock, FileText, Briefcase, Award, TrendingUp, AlertCircle, UserCheck } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { 
  getWorkflowTasks as fetchWorkflowTasks 
} from "@/lib/database"

export function EmployeePortal() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [leaveBalance, setLeaveBalance] = useState({ vacation: 0, sick: 0, personal: 0 })
  const [pendingTasks, setPendingTasks] = useState(0)
  const [activeProjects, setActiveProjects] = useState(0)
  const [workHours, setWorkHours] = useState(0)
  const [recentReviews, setRecentReviews] = useState<any[]>([])
  const [pendingLeave, setPendingLeave] = useState<any[]>([])
  const [monthlyHours, setMonthlyHours] = useState<any[]>([])
  const [leaveHistory, setLeaveHistory] = useState<any[]>([])

  useEffect(() => {
    loadEmployeeData()
  }, [user])

  async function loadEmployeeData() {
    if (!user) return
    
    try {
      setLoading(true)
      
      // Get employee ID from user profile
      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (employee) {
        // Load leave balances
        const balances = await getLeaveBalances(employee.id)
        if (balances && balances.length > 0) {
          const current = balances[0]
          setLeaveBalance({
            vacation: current.vacation_days || 0,
            sick: current.sick_days || 0,
            personal: current.personal_days || 0
          })
        }

        // Load pending leave requests
        const leaveRequests = await getLeaveRequests(employee.id)
        const pending = leaveRequests?.filter((req: any) => req.status === "Pending") || []
        setPendingLeave(pending.slice(0, 3))

        // Load workflow tasks
        const tasks = await fetchWorkflowTasks(user.id)
        const pendingCount = tasks?.filter((t: any) => 
          t.status === "pending" || t.status === "in_progress"
        ).length || 0
        setPendingTasks(pendingCount)

        // Load projects
        const projects = await getProjects()
        const active = projects?.filter((p: any) => 
          p.status === "In Progress" || p.status === "Planning"
        ).length || 0
        setActiveProjects(active)

        // Load performance reviews
        const reviews = await getPerformanceReviews(employee.id)
        setRecentReviews(reviews?.slice(0, 2) || [])

        // Calculate work hours (simulated - would come from attendance records)
        setWorkHours(calculateWorkHours())

        // Generate chart data
        generateChartData(leaveRequests || [])
      }
    } catch (error) {
      console.error("Error loading employee data:", error)
    } finally {
      setLoading(false)
    }
  }

  function calculateWorkHours() {
    // Simulated calculation - would integrate with attendance records
    const weeks = 4
    const hoursPerWeek = 40
    return weeks * hoursPerWeek
  }

  function generateChartData(leaveRequests: any[]) {
    // Generate monthly hours (simulated)
    const weeks = ["W1", "W2", "W3", "W4"]
    const hours = weeks.map(() => ({
      week: weeks.shift() || "",
      hours: Math.floor(Math.random() * 5) + 38
    }))
    setMonthlyHours(hours)

    // Generate leave history from actual requests
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    const history = months.map(month => {
      const used = leaveRequests.filter((req: any) => {
        const reqMonth = new Date(req.from_date).toLocaleDateString("en-US", { month: "short" })
        return reqMonth === month && req.status === "Approved"
      }).length
      return { month, used, planned: Math.floor(Math.random() * 2) }
    })
    setLeaveHistory(history)
  }

  const employeeStats = [
    { 
      label: "Leave Balance", 
      value: `${leaveBalance.vacation + leaveBalance.sick + leaveBalance.personal} days`, 
      icon: Calendar, 
      color: "from-blue-500 to-blue-600",
      detail: `${leaveBalance.vacation} Vacation, ${leaveBalance.sick} Sick, ${leaveBalance.personal} Personal`
    },
    { 
      label: "Active Projects", 
      value: activeProjects.toString(), 
      icon: Briefcase, 
      color: "from-purple-500 to-purple-600" 
    },
    { 
      label: "Pending Tasks", 
      value: pendingTasks.toString(), 
      icon: FileText, 
      color: "from-orange-500 to-orange-600" 
    },
    { 
      label: "Work Hours (Month)", 
      value: `${workHours} hrs`, 
      icon: Clock, 
      color: "from-green-500 to-green-600" 
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Employee Portal</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.fullName}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {user?.position} • {user?.department}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {employeeStats.map((stat, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                {stat.detail && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.detail}</p>
                )}
              </div>
              <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Balance Breakdown */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Leave Breakdown</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Vacation</span>
                <span className="text-sm text-muted-foreground">{leaveBalance.vacation} days</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(leaveBalance.vacation / 20) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Sick Leave</span>
                <span className="text-sm text-muted-foreground">{leaveBalance.sick} days</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(leaveBalance.sick / 10) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Personal Days</span>
                <span className="text-sm text-muted-foreground">{leaveBalance.personal} days</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${(leaveBalance.personal / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Performance Reviews */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Performance Reviews</h2>
          {recentReviews.length > 0 ? (
            <div className="space-y-3">
              {recentReviews.map((review: any) => (
                <div key={review.id} className="p-3 bg-muted rounded">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-foreground">{review.period}</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Award
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{review.comments}</p>
                  <Badge className="mt-2" variant={review.status === "reviewed" ? "default" : "secondary"}>
                    {review.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No reviews yet</p>
            </div>
          )}
        </Card>

        {/* Pending Leave Requests */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Pending Leave Requests</h2>
          {pendingLeave.length > 0 ? (
            <div className="space-y-3">
              {pendingLeave.map((request: any) => (
                <div key={request.id} className="p-3 bg-muted rounded">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-foreground">{request.type}</span>
                    <Badge variant="secondary">{request.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.from_date).toLocaleDateString()} - {new Date(request.to_date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{request.days} days</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending requests</p>
            </div>
          )}
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Weekly Hours</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
              <Bar dataKey="hours" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Leave Usage Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={leaveHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
              <Legend />
              <Line type="monotone" dataKey="used" stroke="#ef4444" strokeWidth={2} name="Used" />
              <Line type="monotone" dataKey="planned" stroke="#3b82f6" strokeWidth={2} name="Planned" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
            <Calendar className="w-6 h-6" />
            <span className="text-sm">Request Leave</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
            <FileText className="w-6 h-6" />
            <span className="text-sm">Submit Expense</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
            <Briefcase className="w-6 h-6" />
            <span className="text-sm">View Projects</span>
          </Button>
          <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
            <Award className="w-6 h-6" />
            <span className="text-sm">View Training</span>
          </Button>
        </div>
      </Card>
    </div>
  )
}

// Helper function to get leave balances
async function getLeaveBalances(employeeId: string) {
  const { supabase } = await import("@/lib/supabase")
  const { data, error } = await supabase
    .from("leave_balances")
    .select("*")
    .eq("employee_id", employeeId)
    .order("year", { ascending: false })

  if (error) throw error
  return data
}

// Import supabase for direct queries
import { supabase } from "@/lib/supabase"

// Helper functions that might be missing
async function getLeaveRequests(employeeId: string) {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

async function getWorkflowTasks(userId: string) {
  const { data, error } = await supabase
    .from("workflow_tasks")
    .select("*")
    .or(`assigned_to.eq.${userId},assigned_by.eq.${userId}`)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

async function getProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}

async function getPerformanceReviews(employeeId: string) {
  const { data, error } = await supabase
    .from("performance_reviews")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}
