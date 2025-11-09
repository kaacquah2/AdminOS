"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Plus, Calendar, Clock, TrendingUp, CheckCircle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { RequestLeaveModal } from "@/components/modals/request-leave-modal"
import {
  getLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  getEmployees,
  getLeaveBalances,
} from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface LeaveRequest {
  id: string
  employee_id: string
  employee_name: string
  type: string
  from_date: string
  to_date: string
  days: number
  status: string
  reason?: string
}

interface LeaveBalance {
  id: string
  employee_id: string
  vacation_days: number
  sick_days: number
  personal_days: number
  year: number
}

export function LeaveModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestLeaveModal, setShowRequestLeaveModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [user])

  async function loadData() {
    try {
      setLoading(true)
      const [leaveData, balanceData, employeeData] = await Promise.all([
        getLeaveRequests(),
        getLeaveBalances(),
        getEmployees(),
      ])
      setLeaves(leaveData || [])
      setLeaveBalances(balanceData || [])
      setEmployees(employeeData || [])
    } catch (error) {
      console.error("Error loading leave data:", error)
      toast({
        title: "Error",
        description: "Failed to load leave data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReviewLeave = async (id: string) => {
    try {
      await updateLeaveRequest(id, {
        status: "Approved",
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      })
      await loadData()
      toast({
        title: "Success",
        description: "Leave request approved successfully.",
      })
    } catch (error) {
      console.error("Error approving leave:", error)
      toast({
        title: "Error",
        description: "Failed to approve leave request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRejectLeave = async (id: string) => {
    if (!confirm("Are you sure you want to reject this leave request?")) {
      return
    }

    try {
      await updateLeaveRequest(id, {
        status: "Rejected",
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
      })
      await loadData()
      toast({
        title: "Success",
        description: "Leave request rejected.",
      })
    } catch (error) {
      console.error("Error rejecting leave:", error)
      toast({
        title: "Error",
        description: "Failed to reject leave request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmitLeaveRequest = async (data: any) => {
    if (!user) return

    // Find employee ID
    const employee = employees.find((e) => e.email === user.email || e.name === user.fullName)
    if (!employee) {
      toast({
        title: "Error",
        description: "Employee record not found. Please contact HR.",
        variant: "destructive",
      })
      return
    }

    try {
      const fromDate = new Date(data.fromDate)
      const toDate = new Date(data.toDate)
      const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

      await createLeaveRequest({
        employee_id: employee.id,
        employee_name: employee.name,
        type: data.leaveType,
        from_date: data.fromDate,
        to_date: data.toDate,
        days,
        reason: data.reason,
      })
      await loadData()
      setShowRequestLeaveModal(false)
      toast({
        title: "Success",
        description: "Leave request submitted successfully.",
      })
    } catch (error) {
      console.error("Error creating leave request:", error)
      toast({
        title: "Error",
        description: "Failed to submit leave request. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Calculate stats
  const today = new Date().toISOString().split("T")[0]
  const onLeaveToday = leaves.filter((l) => {
    return l.status === "Approved" && l.from_date <= today && l.to_date >= today
  }).length

  const pendingRequests = leaves.filter((l) => l.status === "Pending").length

  // Calculate attendance stats (simplified - would need attendance_records table for real data)
  const presentToday = employees.length - onLeaveToday
  const remoteToday = 0 // Would need attendance_records to calculate

  // Calculate leave distribution
  const leaveDistribution = [
    { name: "Vacation", value: leaves.filter((l) => l.type === "Vacation").length },
    { name: "Sick Leave", value: leaves.filter((l) => l.type === "Sick Leave").length },
    { name: "Personal", value: leaves.filter((l) => l.type === "Personal").length },
    { name: "Other", value: leaves.filter((l) => !["Vacation", "Sick Leave", "Personal"].includes(l.type)).length },
  ]

  // Calculate attendance trend (last 5 months)
  const attendanceTrend = Array.from({ length: 5 }, (_, i) => {
    const month = new Date()
    month.setMonth(month.getMonth() - (4 - i))
    const monthStr = month.toLocaleDateString("en-US", { month: "short" })

    // Simplified calculation - would need attendance_records for real data
    return {
      month: monthStr,
      present: employees.length - Math.floor(Math.random() * 20),
      absent: Math.floor(Math.random() * 15),
      remote: Math.floor(Math.random() * 10),
    }
  })

  const colors = ["#6366f1", "#f87171", "#34d399", "#fbbf24"]

  // Get leave balance for display
  const getLeaveBalance = (employeeId: string) => {
    const balance = leaveBalances.find((b) => b.employee_id === employeeId && b.year === new Date().getFullYear())
    return balance || { vacation_days: 0, sick_days: 0, personal_days: 0 }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading leave data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Leave & Attendance</h1>
          <p className="text-muted-foreground">Track employee leave requests and daily attendance.</p>
        </div>
        <Button className="gap-2" onClick={() => setShowRequestLeaveModal(true)}>
          <Plus className="w-4 h-4" />
          Request Leave
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">On Leave Today</p>
          <p className="text-3xl font-bold">{onLeaveToday}</p>
          <p className="text-xs text-blue-600 mt-2">Employees</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Present Today</p>
          <p className="text-3xl font-bold">{presentToday}</p>
          <p className="text-xs text-green-600 mt-2">In office</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Remote Today</p>
          <p className="text-3xl font-bold">{remoteToday}</p>
          <p className="text-xs text-blue-600 mt-2">Working from home</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Pending Requests</p>
          <p className="text-3xl font-bold">{pendingRequests}</p>
          <p className="text-xs text-yellow-600 mt-2">Awaiting approval</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Attendance Trend (5 Months)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="present" fill="var(--color-primary)" />
              <Bar dataKey="remote" fill="var(--color-accent)" />
              <Bar dataKey="absent" fill="var(--color-destructive)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Leave Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leaveDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {leaveDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Leave Requests
        </h3>
        <div className="space-y-3">
          {leaves.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No leave requests found</p>
          ) : (
            leaves.map((leave) => (
              <div
                key={leave.id}
                className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border"
              >
                <div>
                  <p className="font-medium text-sm">{leave.employee_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {leave.type} • {leave.days} days • {new Date(leave.from_date).toLocaleDateString()} to{" "}
                    {new Date(leave.to_date).toLocaleDateString()}
                  </p>
                  {leave.reason && <p className="text-xs text-muted-foreground mt-1">Reason: {leave.reason}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      leave.status === "Approved"
                        ? "bg-green-100 text-green-800"
                        : leave.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : leave.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {leave.status}
                  </span>
                  {leave.status === "Pending" && (user?.role === "hr_head" || user?.role === "super_admin") && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent"
                        onClick={() => handleReviewLeave(leave.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent"
                        onClick={() => handleRejectLeave(leave.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {leaveBalances.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Employee Leave Balance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Employee</th>
                  <th className="text-left py-3 px-4 font-semibold">Vacation Days</th>
                  <th className="text-left py-3 px-4 font-semibold">Sick Days</th>
                  <th className="text-left py-3 px-4 font-semibold">Personal Days</th>
                  <th className="text-left py-3 px-4 font-semibold">Total Available</th>
                </tr>
              </thead>
              <tbody>
                {leaveBalances
                  .filter((b) => b.year === new Date().getFullYear())
                  .map((balance) => {
                    const employee = employees.find((e) => e.id === balance.employee_id)
                    if (!employee) return null
                    const total = balance.vacation_days + balance.sick_days + balance.personal_days
                    return (
                      <tr key={balance.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="py-4 px-4 font-medium">{employee.name}</td>
                        <td className="py-4 px-4">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            {balance.vacation_days}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                            {balance.sick_days}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            {balance.personal_days}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-primary">{total} days</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <RequestLeaveModal
        isOpen={showRequestLeaveModal}
        onClose={() => setShowRequestLeaveModal(false)}
        onSubmit={handleSubmitLeaveRequest}
      />
    </div>
  )
}
