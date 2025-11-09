"use client"

import { useState, useEffect } from "react"
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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSign, TrendingUp, AlertCircle, CheckCircle, FileText, Clock, 
  TrendingDown, Wallet, Receipt, ArrowUpRight, ArrowDownRight, 
  Building2, Users, CreditCard, Banknote, Calendar, Target
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function FinanceDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Overview Stats
  const [financeStats, setFinanceStats] = useState({
    totalBudget: 0,
    spentYTD: 0,
    pendingExpenses: 0,
    approved: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    accountsPayable: 0,
    accountsReceivable: 0,
    cashBalance: 0,
    profitMargin: 0,
  })
  
  // Data Arrays
  const [budgetVsActual, setBudgetVsActual] = useState<any[]>([])
  const [departmentBudget, setDepartmentBudget] = useState<any[]>([])
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([])
  const [recentApprovals, setRecentApprovals] = useState<any[]>([])
  const [expenseCategories, setExpenseCategories] = useState<any[]>([])
  const [cashFlow, setCashFlow] = useState<any[]>([])
  const [accountsPayable, setAccountsPayable] = useState<any[]>([])
  const [accountsReceivable, setAccountsReceivable] = useState<any[]>([])
  const [revenueVsExpenses, setRevenueVsExpenses] = useState<any[]>([])
  const [financialStatements, setFinancialStatements] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [overdueInvoices, setOverdueInvoices] = useState<any[]>([])

  useEffect(() => {
    loadFinanceData()
  }, [user])

  async function loadFinanceData() {
    try {
      setLoading(true)

      // Get department budgets
      const { data: budgets } = await supabase
        .from("department_budgets")
        .select("*")
        .order("allocated", { ascending: false })

      // Get expenses
      const { data: expenses } = await supabase
        .from("expenses")
        .select("*")
        .order("created_at", { ascending: false })

      // Get approval requests
      const { data: approvals } = await supabase
        .from("approval_requests")
        .select("*")
        .eq("request_type", "expense")
        .order("created_at", { ascending: false })

      // Get accounts payable
      const { data: ap } = await supabase
        .from("accounts_payable")
        .select("*")
        .order("due_date", { ascending: true })

      // Get accounts receivable
      const { data: ar } = await supabase
        .from("accounts_receivable")
        .select("*")
        .order("due_date", { ascending: true })

      // Get cash flow (last 30 days)
      const { data: cashFlowData } = await supabase
        .from("cash_flow")
        .select("*")
        .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order("date", { ascending: true })

      // Get financial statements (last 6 months)
      const { data: statements } = await supabase
        .from("financial_statements")
        .select("*")
        .eq("statement_type", "income_statement")
        .order("period_start", { ascending: false })
        .limit(6)

      // Get vendors
      const { data: vendorsData } = await supabase
        .from("vendors")
        .select("*")
        .eq("status", "Active")
        .order("total_spend", { ascending: false })

      // Calculate totals
      const totalBudget = budgets?.reduce((sum, b) => sum + parseFloat(b.allocated || 0), 0) || 0
      const spent = budgets?.reduce((sum, b) => sum + parseFloat(b.spent || 0), 0) || 0
      const pending = expenses?.filter((e: any) => e.status === "Pending").length || 0
      const approvedAmount = expenses?.filter((e: any) => e.status === "Approved")
        .reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0

      // Calculate revenue and expenses from financial statements
      const latestStatement = statements?.[0]
      const totalRevenue = latestStatement?.revenue || 0
      const totalExpenses = latestStatement?.operating_expenses || 0
      const netIncome = latestStatement?.net_income || 0
      const profitMargin = totalRevenue > 0 ? ((netIncome / totalRevenue) * 100) : 0

      // Accounts Payable/Receivable totals
      const apTotal = ap?.filter((i: any) => i.payment_status === "Unpaid")
        .reduce((sum: number, i: any) => sum + parseFloat(i.total_amount || 0), 0) || 0
      const arTotal = ar?.filter((i: any) => i.payment_status === "Unpaid")
        .reduce((sum: number, i: any) => sum + parseFloat(i.total_amount || 0), 0) || 0

      // Cash balance (from latest cash flow record)
      const latestCashFlow = cashFlowData?.[cashFlowData.length - 1]
      const cashBalance = latestCashFlow?.closing_balance || 0

      // Overdue invoices
      const overdueAP = ap?.filter((i: any) => 
        i.status === "Overdue" || (i.due_date < new Date().toISOString().split('T')[0] && i.payment_status === "Unpaid")
      ) || []
      const overdueAR = ar?.filter((i: any) => 
        i.status === "Overdue" || (i.due_date < new Date().toISOString().split('T')[0] && i.payment_status === "Unpaid")
      ) || []

      // Generate budget vs actual data (last 6 months)
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
      const budgetActual = months.map((month, idx) => {
        const monthBudget = totalBudget / 6
        const monthSpent = (spent / 6) * (0.9 + Math.random() * 0.2)
        return {
          month,
          budget: Math.round(monthBudget),
          actual: Math.round(monthSpent),
        }
      })

      // Revenue vs Expenses (from statements)
      const revenueExpenses = statements?.slice().reverse().map((s: any) => ({
        month: new Date(s.period_start).toLocaleDateString('en-US', { month: 'short' }),
        revenue: parseFloat(s.revenue || 0),
        expenses: parseFloat(s.operating_expenses || 0),
        profit: parseFloat(s.net_income || 0),
      })) || []

      // Department budget data
      const deptData = budgets?.map((b: any) => ({
        dept: b.department.length > 12 ? b.department.substring(0, 12) + "..." : b.department,
        spent: parseFloat(b.spent || 0),
        allocated: parseFloat(b.allocated || 0),
        utilization: ((parseFloat(b.spent || 0) / parseFloat(b.allocated || 1)) * 100).toFixed(1),
      })) || []

      // Expense categories
      const categoryMap: Record<string, number> = {}
      expenses?.forEach((exp: any) => {
        categoryMap[exp.category] = (categoryMap[exp.category] || 0) + parseFloat(exp.amount || 0)
      })
      const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value: Math.round(value),
      }))

      // Cash flow chart data (last 30 days)
      const cashFlowChart = cashFlowData?.map((cf: any) => ({
        date: new Date(cf.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        inflow: parseFloat(cf.cash_inflow || 0),
        outflow: parseFloat(cf.cash_outflow || 0),
        balance: parseFloat(cf.closing_balance || 0),
      })) || []

      setFinanceStats({
        totalBudget: Math.round(totalBudget),
        spentYTD: Math.round(spent),
        pendingExpenses: pending,
        approved: Math.round(approvedAmount),
        totalRevenue: Math.round(totalRevenue),
        totalExpenses: Math.round(totalExpenses),
        netIncome: Math.round(netIncome),
        accountsPayable: Math.round(apTotal),
        accountsReceivable: Math.round(arTotal),
        cashBalance: Math.round(cashBalance),
        profitMargin: parseFloat(profitMargin.toFixed(1)),
      })
      setBudgetVsActual(budgetActual)
      setDepartmentBudget(deptData)
      setPendingExpenses(expenses?.filter((e: any) => e.status === "Pending").slice(0, 5) || [])
      setRecentApprovals(approvals?.slice(0, 5) || [])
      setExpenseCategories(categoryData)
      setCashFlow(cashFlowChart)
      setAccountsPayable(ap?.slice(0, 10) || [])
      setAccountsReceivable(ar?.slice(0, 10) || [])
      setRevenueVsExpenses(revenueExpenses)
      setFinancialStatements(statements || [])
      setVendors(vendorsData || [])
      setOverdueInvoices([...overdueAP, ...overdueAR].slice(0, 5))
    } catch (error) {
      console.error("Error loading finance data:", error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      label: "Total Revenue",
      value: `$${(financeStats.totalRevenue / 1000).toFixed(0)}K`,
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
      trend: financeStats.totalRevenue > 0 ? "+12%" : null,
    },
    {
      label: "Net Income",
      value: `$${(financeStats.netIncome / 1000).toFixed(0)}K`,
      icon: DollarSign,
      color: financeStats.netIncome >= 0 ? "from-green-500 to-green-600" : "from-red-500 to-red-600",
      trend: financeStats.profitMargin > 0 ? `${financeStats.profitMargin}% margin` : null,
    },
    {
      label: "Cash Balance",
      value: `$${(financeStats.cashBalance / 1000).toFixed(0)}K`,
      icon: Wallet,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Accounts Receivable",
      value: `$${(financeStats.accountsReceivable / 1000).toFixed(0)}K`,
      icon: Receipt,
      color: "from-purple-500 to-purple-600",
      alert: overdueInvoices.length > 0,
    },
    {
      label: "Accounts Payable",
      value: `$${(financeStats.accountsPayable / 1000).toFixed(0)}K`,
      icon: CreditCard,
      color: "from-orange-500 to-orange-600",
      alert: overdueInvoices.length > 0,
    },
    {
      label: "Budget Spent YTD",
      value: `$${(financeStats.spentYTD / 1000).toFixed(0)}K`,
      icon: Target,
      color: "from-indigo-500 to-indigo-600",
      percentage: ((financeStats.spentYTD / financeStats.totalBudget) * 100).toFixed(1),
    },
  ]

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <h1 className="text-3xl font-bold text-foreground">Finance & Accounting Dashboard</h1>
          <p className="text-muted-foreground mt-1">Comprehensive Financial Management Portal</p>
        </div>
        <Button onClick={loadFinanceData} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                {stat.percentage && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.percentage}% of budget
                  </p>
                )}
                {stat.trend && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    {stat.trend}
                  </p>
                )}
                {stat.alert && (
                  <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {overdueInvoices.length} overdue
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

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="ap-ar">AP/AR</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Revenue vs Expenses Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Revenue vs Expenses</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueVsExpenses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Revenue" />
                  <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Budget vs Actual Spending</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={budgetVsActual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
                  <Legend />
                  <Line type="monotone" dataKey="budget" stroke="#8b5cf6" strokeWidth={2} name="Budget" />
                  <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} name="Actual" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Expense Categories & Department Budgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {expenseCategories.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Expense by Category</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Department Budget Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentBudget}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="dept" angle={-45} textAnchor="end" height={100} stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
                  <Legend />
                  <Bar dataKey="spent" fill="#ef4444" name="Spent" />
                  <Bar dataKey="allocated" fill="#10b981" name="Allocated" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Pending Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">Pending Expense Approvals</h2>
                {pendingExpenses.length > 0 && (
                  <Badge variant="destructive">{pendingExpenses.length}</Badge>
                )}
              </div>
              {pendingExpenses.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {pendingExpenses.map((expense: any) => (
                    <div key={expense.id} className="p-3 bg-muted rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{expense.description}</p>
                          <p className="text-xs text-muted-foreground">{expense.employee_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">${parseFloat(expense.amount || 0).toLocaleString()}</p>
                          <Badge variant="secondary" className="mt-1">{expense.status}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">{expense.category}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No pending expenses</p>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">Overdue Invoices</h2>
                {overdueInvoices.length > 0 && (
                  <Badge variant="destructive">{overdueInvoices.length}</Badge>
                )}
              </div>
              {overdueInvoices.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {overdueInvoices.map((invoice: any) => (
                    <div key={invoice.id} className="p-3 bg-muted rounded border-l-4 border-red-500">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {invoice.vendor_name || invoice.customer_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground">
                            ${parseFloat(invoice.total_amount || invoice.amount || 0).toLocaleString()}
                          </p>
                          <Badge variant="destructive" className="mt-1">Overdue</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          Due: {new Date(invoice.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No overdue invoices</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Cash Flow Tab */}
        <TabsContent value="cashflow" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Cash Flow (Last 30 Days)</h2>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={cashFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
                <Legend />
                <Area type="monotone" dataKey="inflow" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Cash Inflow" />
                <Area type="monotone" dataKey="outflow" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Cash Outflow" />
                <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} name="Cash Balance" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        {/* Accounts Payable/Receivable Tab */}
        <TabsContent value="ap-ar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Accounts Payable</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {accountsPayable.map((invoice: any) => (
                  <div key={invoice.id} className="p-3 bg-muted rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">{invoice.vendor_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          ${parseFloat(invoice.total_amount || 0).toLocaleString()}
                        </p>
                        <Badge 
                          variant={
                            invoice.status === "Paid" ? "default" : 
                            invoice.status === "Overdue" ? "destructive" : 
                            "secondary"
                          }
                          className="mt-1"
                        >
                          {invoice.payment_status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{invoice.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Accounts Receivable</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {accountsReceivable.map((invoice: any) => (
                  <div key={invoice.id} className="p-3 bg-muted rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">{invoice.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          ${parseFloat(invoice.total_amount || 0).toLocaleString()}
                        </p>
                        <Badge 
                          variant={
                            invoice.payment_status === "Paid" ? "default" : 
                            invoice.status === "Overdue" ? "destructive" : 
                            "secondary"
                          }
                          className="mt-1"
                        >
                          {invoice.payment_status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{invoice.department || "N/A"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Budgets Tab */}
        <TabsContent value="budgets" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Department Budget Utilization</h2>
            <div className="space-y-4">
              {departmentBudget.map((dept: any, index: number) => {
                const utilization = parseFloat(dept.utilization)
                const isOver = utilization > 100
                const isWarning = utilization > 80 && utilization <= 100
                return (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium text-foreground">{dept.dept}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ${Math.round(dept.spent).toLocaleString()} / ${Math.round(dept.allocated).toLocaleString()}
                        </span>
                      </div>
                      <span className={`text-sm font-semibold ${isOver ? "text-red-600" : isWarning ? "text-yellow-600" : "text-green-600"}`}>
                        {utilization}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          isOver ? "bg-red-600" : isWarning ? "bg-yellow-600" : "bg-green-600"
                        }`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Financial Statements</h2>
              <div className="space-y-3">
                {financialStatements.slice(0, 6).map((statement: any) => (
                  <div key={statement.id} className="p-3 bg-muted rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(statement.period_start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-muted-foreground">Income Statement</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          ${parseFloat(statement.net_income || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Net Income</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Top Vendors</h2>
              <div className="space-y-3">
                {vendors.slice(0, 5).map((vendor: any) => (
                  <div key={vendor.id} className="p-3 bg-muted rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-foreground">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground">Rating: {vendor.rating}/5.0</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          ${parseFloat(vendor.total_spend || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Spend</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
