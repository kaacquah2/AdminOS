"use client"

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card } from "@/components/ui/card"
import { Users, FileText, AlertCircle } from "lucide-react"

export function AdminDashboard() {
  const systemStats = [
    { label: "Total Employees", value: "156", icon: Users, color: "from-blue-500 to-blue-600" },
    { label: "Active Users", value: "148", icon: Users, color: "from-green-500 to-green-600" },
    { label: "Pending Tasks", value: "23", icon: FileText, color: "from-yellow-500 to-yellow-600" },
    { label: "System Alerts", value: "5", icon: AlertCircle, color: "from-red-500 to-red-600" },
  ]

  const userRoleDistribution = [
    { name: "Admin", value: 2 },
    { name: "HR Manager", value: 3 },
    { name: "Finance Manager", value: 2 },
    { name: "Department Manager", value: 8 },
    { name: "Employees", value: 141 },
  ]

  const systemActivityData = [
    { month: "Jan", logins: 1200, actions: 2400 },
    { month: "Feb", logins: 1100, actions: 2210 },
    { month: "Mar", logins: 1300, actions: 2290 },
    { month: "Apr", logins: 1500, actions: 2000 },
    { month: "May", logins: 1400, actions: 2181 },
    { month: "Jun", logins: 1600, actions: 2500 },
  ]

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">System Overview & Management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStats.map((stat, index) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground mb-4">System Activity Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={systemActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
              <Legend />
              <Line type="monotone" dataKey="logins" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="actions" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">User Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userRoleDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {userRoleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
