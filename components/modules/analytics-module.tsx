"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
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
import { Download, Filter, TrendingUp } from "lucide-react"

export function AnalyticsModule() {
  const yearOverYear = [
    { metric: "Total Employees", current: 342, previous: 310, change: "+10.3%" },
    { metric: "Revenue (Millions)", current: 12.5, previous: 10.2, change: "+22.5%" },
    { metric: "Customer Satisfaction", current: 94.2, previous: 91.8, change: "+2.4%" },
    { metric: "Employee Retention", current: 91.4, previous: 88.9, change: "+2.5%" },
  ]

  const hiringPipeline = [
    { stage: "Applied", count: 245 },
    { stage: "Screening", count: 156 },
    { stage: "Interview", count: 87 },
    { stage: "Offer", count: 23 },
    { stage: "Hired", count: 12 },
  ]

  const deptHeadcount = [
    { month: "Jan", eng: 85, sales: 58, marketing: 38, ops: 105, hr: 24 },
    { month: "Feb", eng: 87, sales: 60, marketing: 39, ops: 107, hr: 24 },
    { month: "Mar", eng: 90, sales: 62, marketing: 40, ops: 108, hr: 25 },
    { month: "Apr", eng: 92, sales: 63, marketing: 41, ops: 110, hr: 26 },
    { month: "May", eng: 93, sales: 64, marketing: 41, ops: 111, hr: 27 },
    { month: "Jun", eng: 95, sales: 65, marketing: 42, ops: 112, hr: 28 },
  ]

  const budgetPerformance = [
    { dept: "Engineering", budgeted: 50000, spent: 48200, remaining: 1800, efficiency: "96%" },
    { dept: "Sales", budgeted: 35000, spent: 34100, remaining: 900, efficiency: "97%" },
    { dept: "Marketing", budgeted: 25000, spent: 23500, remaining: 1500, efficiency: "94%" },
    { dept: "Operations", budgeted: 15000, spent: 15200, remaining: -200, efficiency: "101%" },
  ]

  const perfMetrics = [
    { category: "Goal Completion", value: 87 },
    { category: "Quality", value: 91 },
    { category: "Attendance", value: 94 },
    { category: "Teamwork", value: 88 },
    { category: "Communication", value: 85 },
  ]

  const kpiTrend = [
    { month: "Jul", productivity: 85, satisfaction: 82, revenue: 1.8 },
    { month: "Aug", productivity: 87, satisfaction: 83, revenue: 1.9 },
    { month: "Sep", productivity: 86, satisfaction: 85, revenue: 2.0 },
    { month: "Oct", productivity: 88, satisfaction: 86, revenue: 2.1 },
    { month: "Nov", productivity: 90, satisfaction: 88, revenue: 2.2 },
  ]

  const departmentPerformance = [
    { dept: "Engineering", headcount: 95, productivity: 92, satisfaction: 88 },
    { dept: "Sales", headcount: 65, productivity: 85, satisfaction: 82 },
    { dept: "Marketing", headcount: 42, productivity: 88, satisfaction: 85 },
    { dept: "Operations", headcount: 112, productivity: 90, satisfaction: 83 },
    { dept: "HR", headcount: 28, productivity: 87, satisfaction: 90 },
  ]

  const expensesTrend = [
    { month: "Jan", expenses: 8500 },
    { month: "Feb", expenses: 9200 },
    { month: "Mar", expenses: 8900 },
    { month: "Apr", expenses: 9800 },
    { month: "May", expenses: 10200 },
    { month: "Jun", expenses: 9500 },
  ]

  const assetCondition = [
    { name: "Excellent", value: 520 },
    { name: "Good", value: 220 },
    { name: "Fair", value: 80 },
    { name: "Needs Repair", value: 22 },
  ]

  const colors = ["#6366f1", "#60a5fa", "#f87171", "#34d399"]

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics & Reports</h1>
          <p className="text-muted-foreground">Comprehensive insights and reporting across the organization.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Avg Employee Satisfaction</p>
          <p className="text-3xl font-bold">85.6%</p>
          <p className="text-xs text-green-600 mt-2">+2.3% from last quarter</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Avg Department Productivity</p>
          <p className="text-3xl font-bold">88.4%</p>
          <p className="text-xs text-blue-600 mt-2">Consistent performance</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Expense Variance</p>
          <p className="text-3xl font-bold">+3.2%</p>
          <p className="text-xs text-yellow-600 mt-2">Above budget</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Asset Utilization</p>
          <p className="text-3xl font-bold">94.8%</p>
          <p className="text-xs text-green-600 mt-2">Excellent utilization</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Year-over-Year Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {yearOverYear.map((item) => (
            <div key={item.metric} className="border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">{item.metric}</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">{item.current}</p>
                <span className="text-xs text-green-600 font-semibold">{item.change}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Previous: {item.previous}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Department Performance Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="dept" stroke="var(--color-muted-foreground)" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="productivity" fill="var(--color-primary)" />
              <Bar dataKey="satisfaction" fill="var(--color-accent)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Monthly KPI Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kpiTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="productivity" stroke="var(--color-primary)" strokeWidth={2} />
              <Line type="monotone" dataKey="satisfaction" stroke="var(--color-accent)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Department Headcount Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={deptHeadcount}>
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
              <Legend />
              <Line type="monotone" dataKey="eng" stroke="#6366f1" strokeWidth={2} name="Engineering" />
              <Line type="monotone" dataKey="sales" stroke="#60a5fa" strokeWidth={2} name="Sales" />
              <Line type="monotone" dataKey="marketing" stroke="#f87171" strokeWidth={2} name="Marketing" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Hiring Pipeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hiringPipeline} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" stroke="var(--color-muted-foreground)" />
              <YAxis dataKey="stage" type="category" stroke="var(--color-muted-foreground)" width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" fill="var(--color-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Department Budget Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Department</th>
                <th className="text-left py-3 px-4 font-semibold">Budgeted</th>
                <th className="text-left py-3 px-4 font-semibold">Spent</th>
                <th className="text-left py-3 px-4 font-semibold">Remaining</th>
                <th className="text-left py-3 px-4 font-semibold">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {budgetPerformance.map((dept) => (
                <tr key={dept.dept} className="border-b border-border hover:bg-secondary/50">
                  <td className="py-4 px-4 font-medium">{dept.dept}</td>
                  <td className="py-4 px-4">${dept.budgeted.toLocaleString()}</td>
                  <td className="py-4 px-4">${dept.spent.toLocaleString()}</td>
                  <td className="py-4 px-4 font-semibold">${dept.remaining.toLocaleString()}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        Number.parseInt(dept.efficiency) > 100
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {dept.efficiency}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Monthly Expenses Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={expensesTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis stroke="var(--color-muted-foreground)" />
            <YAxis stroke="var(--color-muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
              }}
            />
            <Line type="monotone" dataKey="expenses" stroke="var(--color-primary)" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Asset Condition Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={assetCondition}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {assetCondition.map((entry, index) => (
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

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Key Metrics</h3>
          <div className="space-y-4">
            <div className="border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Request Fulfillment Rate</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">96.2%</p>
                <p className="text-xs text-green-600">+1.8% this month</p>
              </div>
            </div>
            <div className="border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Employee Retention Rate</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">91.4%</p>
                <p className="text-xs text-green-600">Above industry avg</p>
              </div>
            </div>
            <div className="border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Budget Adherence</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">97.8%</p>
                <p className="text-xs text-green-600">Well controlled</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
