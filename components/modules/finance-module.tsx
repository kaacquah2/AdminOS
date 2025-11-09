"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Plus, Filter, Check, Clock, X, TrendingUp, Download } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { NewExpenseModal } from "@/components/modals/new-expense-modal"
import { getExpenses, updateExpense, createExpense, getDepartmentBudgets } from "@/lib/database"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

export function FinanceModule() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<any[]>([])
  const [departmentBudgets, setDepartmentBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewExpenseModal, setShowNewExpenseModal] = useState(false)

  const colors = ["#6366f1", "#60a5fa", "#f87171", "#34d399", "#fbbf24"]

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [expensesData, budgetsData] = await Promise.all([
        getExpenses(),
        getDepartmentBudgets(),
      ])

      setExpenses(expensesData || [])
      
      // Transform budgets data
      const transformedBudgets = (budgetsData || []).map((budget: any) => {
        const percentage = (parseFloat(budget.spent || 0) / parseFloat(budget.allocated || 1)) * 100
        return {
          dept: budget.department,
          allocated: parseFloat(budget.allocated || 0),
          spent: parseFloat(budget.spent || 0),
          percentage: percentage.toFixed(1),
          status: percentage > 100 ? "over-budget" : "on-track",
        }
      })
      setDepartmentBudgets(transformedBudgets)
    } catch (error) {
      console.error("Error loading finance data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate expenses trend (last 6 months)
  const expensesTrend = (() => {
    const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const now = new Date()
    return months.map((month, idx) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1)
      const monthExpenses = expenses.filter((e) => {
        const expenseDate = new Date(e.date)
        return expenseDate.getMonth() === monthDate.getMonth() && expenseDate.getFullYear() === monthDate.getFullYear()
      })
      const actual = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
      return { month, budget: 10000, actual }
    })
  })()

  // Calculate category breakdown
  const categoryBreakdown = expenses.reduce((acc: any[], expense: any) => {
    const existing = acc.find((a) => a.category === expense.category)
    if (existing) {
      existing.amount += parseFloat(expense.amount || 0)
    } else {
      acc.push({ category: expense.category, amount: parseFloat(expense.amount || 0), budget: 10000 })
    }
    return acc
  }, [])

  // Calculate stats
  const totalExpensesYTD = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
  const pendingExpenses = expenses.filter((e) => e.status === "Pending")
  const pendingAmount = pendingExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
  const approvedThisMonth = expenses.filter((e) => {
    const expenseDate = new Date(e.date)
    const now = new Date()
    return e.status === "Approved" && expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
  })
  const reimbursedThisMonth = approvedThisMonth.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)

  const handleApproveExpense = async (id: string) => {
    try {
      await updateExpense(id, { status: "Approved", approved_at: new Date().toISOString() })
      await loadData()
    } catch (error) {
      console.error("Error approving expense:", error)
    }
  }

  const handleExportReport = () => {
    const csvContent =
      "Employee,Amount,Category,Date,Status\n" +
      expenses.map((e) => `${e.employee_name},${e.amount},${e.category},${e.date},${e.status}`).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "finance-report.csv"
    a.click()
  }

  const handleSubmitNewExpense = async (data: any) => {
    try {
      // Get current user's employee ID
      const { data: employee } = await supabase
        .from("employees")
        .select("id, name")
        .eq("user_id", user?.id)
        .single()

      if (!employee) {
        console.error("Employee not found")
        return
      }

      await createExpense({
        employee_id: employee.id,
        employee_name: employee.name,
        amount: Number.parseFloat(data.amount),
        category: data.category,
        date: data.date,
        status: "Pending",
        description: data.description,
      })
      await loadData()
    } catch (error) {
      console.error("Error creating expense:", error)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Finance Management</h1>
          <p className="text-muted-foreground">Manage expenses, reimbursements, and financial approvals.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent" onClick={handleExportReport}>
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button className="gap-2" onClick={() => setShowNewExpenseModal(true)}>
            <Plus className="w-4 h-4" />
            New Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Expenses (YTD)</p>
          <p className="text-3xl font-bold">
            ${loading ? "..." : totalExpensesYTD.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 mt-2">On budget</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Pending Approval</p>
          <p className="text-3xl font-bold">
            ${loading ? "..." : pendingAmount.toLocaleString()}
          </p>
          <p className="text-xs text-yellow-600 mt-2">{pendingExpenses.length} requests</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Reimbursed This Month</p>
          <p className="text-3xl font-bold">
            ${loading ? "..." : reimbursedThisMonth.toLocaleString()}
          </p>
          <p className="text-xs text-blue-600 mt-2">{approvedThisMonth.length} transactions</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Average Approval Time</p>
          <p className="text-3xl font-bold">2.4 days</p>
          <p className="text-xs text-blue-600 mt-2">Target: 3 days</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Budget vs Actual (6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expensesTrend}>
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
              <Bar dataKey="budget" fill="var(--color-secondary)" />
              <Bar dataKey="actual" fill="var(--color-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Expense by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" stroke="var(--color-muted-foreground)" />
              <YAxis dataKey="category" type="category" stroke="var(--color-muted-foreground)" width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="budget" fill="var(--color-secondary)" />
              <Bar dataKey="amount" fill="var(--color-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Department Budget Status</h3>
        <div className="space-y-4">
          {departmentBudgets.map((dept) => (
            <div key={dept.dept} className="border border-border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">{dept.dept}</p>
                  <p className="text-sm text-muted-foreground">Allocated: ${dept.allocated.toLocaleString()}</p>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    dept.status === "on-track" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {dept.status === "on-track" ? "On Track" : "Over Budget"}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${dept.status === "on-track" ? "bg-green-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(dept.percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">${dept.spent.toLocaleString()} spent</span>
                <span className="text-xs font-semibold">{dept.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-lg">Recent Expenses</h3>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleExportReport}>
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Employee</th>
                <th className="text-left py-3 px-4 font-semibold">Description</th>
                <th className="text-left py-3 px-4 font-semibold">Category</th>
                <th className="text-left py-3 px-4 font-semibold">Amount</th>
                <th className="text-left py-3 px-4 font-semibold">Date</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
                <th className="text-left py-3 px-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-4 px-4 text-center text-muted-foreground">
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 px-4 text-center text-muted-foreground">
                    No expenses found
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="py-4 px-4 font-medium">{exp.employee_name}</td>
                    <td className="py-4 px-4 text-muted-foreground">{exp.description}</td>
                    <td className="py-4 px-4">{exp.category}</td>
                    <td className="py-4 px-4 font-semibold">${parseFloat(exp.amount || 0).toLocaleString()}</td>
                    <td className="py-4 px-4">{new Date(exp.date).toLocaleDateString()}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        exp.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : exp.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {exp.status === "Approved" && <Check className="w-3 h-3" />}
                      {exp.status === "Pending" && <Clock className="w-3 h-3" />}
                      {exp.status === "Rejected" && <X className="w-3 h-3" />}
                      {exp.status}
                    </span>
                  </td>
                    <td className="py-4 px-4">
                      {exp.status === "Pending" && (
                        <Button variant="outline" size="sm" onClick={() => handleApproveExpense(exp.id)}>
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <NewExpenseModal
        isOpen={showNewExpenseModal}
        onClose={() => setShowNewExpenseModal(false)}
        onSubmit={handleSubmitNewExpense}
      />
    </div>
  )
}
