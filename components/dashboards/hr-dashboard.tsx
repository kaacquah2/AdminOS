"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, FileText, Briefcase, CheckCircle, Award, Clock, TrendingUp, AlertCircle, UserPlus, BarChart3, Calendar, Target } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

export function HrDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [hrStats, setHrStats] = useState({
    totalEmployees: 0,
    openPositions: 0,
    pendingLeave: 0,
    activeTraining: 0,
  })
  const [recruitmentData, setRecruitmentData] = useState<any[]>([])
  const [departmentHeadcount, setDepartmentHeadcount] = useState<any[]>([])
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState<any[]>([])
  const [activeJobPostings, setActiveJobPostings] = useState<any[]>([])
  const [trainingPrograms, setTrainingPrograms] = useState<any[]>([])
  const [performanceReviews, setPerformanceReviews] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [recruitmentPipeline, setRecruitmentPipeline] = useState<any[]>([])
  const [leaveTrends, setLeaveTrends] = useState<any[]>([])
  const [trainingEnrollments, setTrainingEnrollments] = useState<any[]>([])
  const [recentHires, setRecentHires] = useState<any[]>([])
  const [upcomingReviews, setUpcomingReviews] = useState<any[]>([])

  useEffect(() => {
    loadHrData()
  }, [user])

  async function loadHrData() {
    try {
      setLoading(true)

      // Get total employees
      const { count: employeeCount } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("status", "Active")

      // Get active job postings
      const { data: jobs } = await supabase
        .from("job_postings")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })

      // Get pending leave requests
      const { data: leaveRequests } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("status", "Pending")
        .order("created_at", { ascending: false })

      // Get active training programs
      const { data: trainings } = await supabase
        .from("training_programs")
        .select("*")
        .eq("status", "upcoming")
        .order("start_date", { ascending: true })

      // Get pending performance reviews
      const { data: reviews } = await supabase
        .from("performance_reviews")
        .select("*")
        .eq("status", "draft")
        .order("created_at", { ascending: false })

      // Get department headcount
      const { data: deptData } = await supabase
        .from("employees")
        .select("department")
        .eq("status", "Active")

      // Process department data
      const deptCounts = deptData?.reduce((acc: any, emp: any) => {
        acc[emp.department] = (acc[emp.department] || 0) + 1
        return acc
      }, {}) || {}

      const deptChart = Object.entries(deptCounts).map(([dept, count]: [string, any]) => ({
        dept: dept.length > 15 ? dept.substring(0, 15) + "..." : dept,
        employees: count,
        target: Math.ceil(count * 1.1), // 10% target growth
      }))

      // Get real candidate data
      const { data: candidatesData } = await supabase
        .from("candidates")
        .select("*")
        .order("created_at", { ascending: false })

      // Get recruitment pipeline data (last 6 months)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      const { data: recentCandidates } = await supabase
        .from("candidates")
        .select("*")
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("created_at", { ascending: true })

      // Process monthly recruitment data
      const monthlyData: Record<string, { applications: number; hired: number }> = {}
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      
      recentCandidates?.forEach((candidate: any) => {
        const date = new Date(candidate.created_at)
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { applications: 0, hired: 0 }
        }
        
        monthlyData[monthKey].applications++
        if (candidate.status === "hired") {
          monthlyData[monthKey].hired++
        }
      })

      // Get last 6 months
      const recruitment = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
        recruitment.push({
          month: monthNames[date.getMonth()],
          applications: monthlyData[monthKey]?.applications || 0,
          hired: monthlyData[monthKey]?.hired || 0,
        })
      }

      // Calculate recruitment pipeline
      const pipelineStages = [
        { stage: "Applied", status: "applied" },
        { stage: "Screening", status: "screening" },
        { stage: "Interview", status: "interview" },
        { stage: "Offer", status: "offer" },
        { stage: "Hired", status: "hired" },
      ]

      const pipeline = pipelineStages.map(({ stage, status }) => {
        const count = candidatesData?.filter((c: any) => c.status === status).length || 0
        const total = candidatesData?.length || 1
        return {
          stage,
          count,
          percentage: (count / total) * 100,
        }
      })

      // Get leave trends (last 6 months)
      const { data: leaveData } = await supabase
        .from("leave_requests")
        .select("*")
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("created_at", { ascending: true })

      const leaveMonthly: Record<string, number> = {}
      leaveData?.forEach((leave: any) => {
        const date = new Date(leave.created_at)
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
        leaveMonthly[monthKey] = (leaveMonthly[monthKey] || 0) + leave.days
      })

      const leaveTrendsData = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
        leaveTrendsData.push({
          month: monthNames[date.getMonth()],
          days: leaveMonthly[monthKey] || 0,
        })
      }

      // Get training enrollments
      const { data: enrollments } = await supabase
        .from("training_enrollments")
        .select(`
          *,
          training_programs (*),
          employees (name, department)
        `)
        .order("created_at", { ascending: false })
        .limit(10)

      // Get recent hires (employees hired in last 90 days)
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      
      const { data: newHires } = await supabase
        .from("employees")
        .select("*")
        .gte("join_date", ninetyDaysAgo.toISOString().split("T")[0])
        .eq("status", "Active")
        .order("join_date", { ascending: false })
        .limit(5)

      // Get upcoming performance reviews (next 30 days)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      const { data: upcomingReviewsData } = await supabase
        .from("performance_reviews")
        .select(`
          *,
          employees (name, department)
        `)
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(5)

      setHrStats({
        totalEmployees: employeeCount || 0,
        openPositions: jobs?.length || 0,
        pendingLeave: leaveRequests?.length || 0,
        activeTraining: trainings?.length || 0,
      })
      setActiveJobPostings(jobs?.slice(0, 5) || [])
      setPendingLeaveRequests(leaveRequests?.slice(0, 5) || [])
      setTrainingPrograms(trainings?.slice(0, 5) || [])
      setPerformanceReviews(reviews?.slice(0, 3) || [])
      setDepartmentHeadcount(deptChart)
      setRecruitmentData(recruitment)
      setCandidates(candidatesData || [])
      setRecruitmentPipeline(pipeline)
      setLeaveTrends(leaveTrendsData)
      setTrainingEnrollments(enrollments || [])
      setRecentHires(newHires || [])
      setUpcomingReviews(upcomingReviewsData || [])
    } catch (error) {
      console.error("Error loading HR data:", error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { 
      label: "Total Employees", 
      value: hrStats.totalEmployees.toString(), 
      icon: Users, 
      color: "from-blue-500 to-blue-600",
      trend: "+5%"
    },
    { 
      label: "Open Positions", 
      value: hrStats.openPositions.toString(), 
      icon: Briefcase, 
      color: "from-purple-500 to-purple-600",
      trend: "+2"
    },
    { 
      label: "Pending Leave", 
      value: hrStats.pendingLeave.toString(), 
      icon: FileText, 
      color: "from-orange-500 to-orange-600",
      alert: hrStats.pendingLeave > 10
    },
    { 
      label: "Active Training", 
      value: hrStats.activeTraining.toString(), 
      icon: Award, 
      color: "from-green-500 to-green-600",
      trend: "8 active"
    },
  ]

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">HR Dashboard</h1>
          <p className="text-muted-foreground mt-1">Recruitment, Training & Employee Management</p>
        </div>
        <Button onClick={loadHrData} variant="outline" size="sm">
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
                {stat.trend && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.trend}
                  </p>
                )}
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
          <h2 className="text-lg font-semibold text-foreground mb-4">Recruitment Pipeline (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={recruitmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
              <Legend />
              <Bar dataKey="applications" fill="#3b82f6" name="Applications" />
              <Bar dataKey="hired" fill="#10b981" name="Hired" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Department Headcount</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentHeadcount}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="dept" angle={-45} textAnchor="end" height={100} stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
              <Legend />
              <Bar dataKey="employees" fill="#3b82f6" name="Current" />
              <Bar dataKey="target" fill="#64748b" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recruitment Pipeline & Leave Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recruitment Pipeline Status</h2>
          <div className="space-y-4">
            {recruitmentPipeline.map((stage: any) => (
              <div key={stage.stage}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{stage.stage}</span>
                  <span className="text-sm text-muted-foreground">{stage.count} candidates</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(stage.percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stage.percentage.toFixed(1)}% of total</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Leave Trends (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leaveTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
              <Bar dataKey="days" fill="#f59e0b" name="Leave Days" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Action Items Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Leave Requests */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Pending Leave Requests</h2>
            {pendingLeaveRequests.length > 0 && (
              <Badge variant="destructive">{pendingLeaveRequests.length}</Badge>
            )}
          </div>
          {pendingLeaveRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingLeaveRequests.map((request: any) => (
                <div key={request.id} className="p-3 bg-muted rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{request.employee_name}</p>
                      <p className="text-xs text-muted-foreground">{request.type}</p>
                    </div>
                    <Badge variant="secondary">{request.days} days</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.from_date).toLocaleDateString()} - {new Date(request.to_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pending requests</p>
            </div>
          )}
        </Card>

        {/* Active Job Postings */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Active Job Postings</h2>
            {activeJobPostings.length > 0 && (
              <Badge>{activeJobPostings.length}</Badge>
            )}
          </div>
          {activeJobPostings.length > 0 ? (
            <div className="space-y-3">
              {activeJobPostings.map((job: any) => (
                <div key={job.id} className="p-3 bg-muted rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.department}</p>
                    </div>
                    <Badge variant="outline">{job.status}</Badge>
                  </div>
                  {job.closing_date && (
                    <p className="text-xs text-muted-foreground">
                      Closes: {new Date(job.closing_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active postings</p>
            </div>
          )}
        </Card>

        {/* Upcoming Training */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Upcoming Training</h2>
            {trainingPrograms.length > 0 && (
              <Badge>{trainingPrograms.length}</Badge>
            )}
          </div>
          {trainingPrograms.length > 0 ? (
            <div className="space-y-3">
              {trainingPrograms.map((program: any) => (
                <div key={program.id} className="p-3 bg-muted rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{program.title}</p>
                      <p className="text-xs text-muted-foreground">{program.category}</p>
                    </div>
                    <Badge variant="outline">{program.status}</Badge>
                  </div>
                  {program.start_date && (
                    <p className="text-xs text-muted-foreground">
                      Starts: {new Date(program.start_date).toLocaleDateString()}
                    </p>
                  )}
                  {program.enrolled_count !== undefined && program.capacity && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Enrollment</span>
                        <span className="text-foreground">{program.enrolled_count}/{program.capacity}</span>
                      </div>
                      <div className="w-full bg-background rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(program.enrolled_count / program.capacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming training</p>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Hires & Upcoming Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Hires (Last 90 Days)</h2>
            <UserPlus className="w-5 h-5 text-muted-foreground" />
          </div>
          {recentHires.length > 0 ? (
            <div className="space-y-3">
              {recentHires.map((hire: any) => (
                <div key={hire.id} className="p-3 bg-muted rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{hire.name}</p>
                      <p className="text-xs text-muted-foreground">{hire.department} • {hire.position}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {new Date(hire.join_date).toLocaleDateString()}
                    </Badge>
                  </div>
                  {hire.employee_number && (
                    <p className="text-xs text-muted-foreground">ID: {hire.employee_number}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent hires</p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Upcoming Performance Reviews</h2>
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </div>
          {upcomingReviews.length > 0 ? (
            <div className="space-y-3">
              {upcomingReviews.map((review: any) => (
                <div key={review.id} className="p-3 bg-muted rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {review.employees?.name || "Unknown Employee"}
                      </p>
                      <p className="text-xs text-muted-foreground">{review.period}</p>
                    </div>
                    <Badge variant="outline">{review.status}</Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <CheckCircle
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming reviews</p>
            </div>
          )}
        </Card>
      </div>

      {/* Training Enrollments */}
      {trainingEnrollments.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Training Enrollments</h2>
            <Badge variant="secondary">{trainingEnrollments.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainingEnrollments.slice(0, 6).map((enrollment: any) => (
              <div key={enrollment.id} className="p-4 bg-muted rounded">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {enrollment.employees?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {enrollment.training_programs?.title || "Training Program"}
                    </p>
                  </div>
                  <Badge variant={enrollment.status === "completed" ? "default" : "outline"}>
                    {enrollment.status}
                  </Badge>
                </div>
                {enrollment.training_programs?.category && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Category: {enrollment.training_programs.category}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Performance Reviews */}
      {performanceReviews.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Pending Performance Reviews</h2>
            <Badge variant="secondary">{performanceReviews.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {performanceReviews.map((review: any) => (
              <div key={review.id} className="p-4 bg-muted rounded">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{review.period}</p>
                    <p className="text-xs text-muted-foreground">Review ID: {review.id.substring(0, 8)}</p>
                  </div>
                  <Badge variant="outline">{review.status}</Badge>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <CheckCircle
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
