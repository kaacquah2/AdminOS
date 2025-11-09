"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Download, FileText, Calendar, AlertCircle, CheckCircle2 } from "lucide-react"
import {
  getEmployees,
  getEmployeeSalaries,
  getPayrollRuns,
  createPayrollRun,
  updatePayrollRun,
  getPayslips,
  createPayslip,
  createBankExport,
  getBankExports,
} from "@/lib/database"
import { calculatePayroll, generateBankExportACH, generateBankExportCSV } from "@/lib/payroll-utils"
import { PayslipModal } from "@/components/modals/payslip-modal"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export function PayrollModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [employees, setEmployees] = useState<any[]>([])
  const [employeeSalaries, setEmployeeSalaries] = useState<Record<string, any>>({})
  const [payrollRuns, setPayrollRuns] = useState<any[]>([])
  const [payslips, setPayslips] = useState<any[]>([])
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [payPeriodStart, setPayPeriodStart] = useState("")
  const [payPeriodEnd, setPayPeriodEnd] = useState("")
  const [payDate, setPayDate] = useState("")

  const colors = ["#6366f1", "#60a5fa", "#f87171", "#34d399"]

  useEffect(() => {
    loadData()
    // Set default dates for current month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const nextPayDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    
    setPayPeriodStart(firstDay.toISOString().split("T")[0])
    setPayPeriodEnd(lastDay.toISOString().split("T")[0])
    setPayDate(nextPayDate.toISOString().split("T")[0])
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [employeesData, salariesData, runsData] = await Promise.all([
        getEmployees(),
        getEmployeeSalaries(),
        getPayrollRuns(),
      ])

      setEmployees(employeesData || [])
      
      // Create a map of employee_id -> salary
      const salaryMap: Record<string, any> = {}
      salariesData?.forEach((salary: any) => {
        if (!salaryMap[salary.employee_id] || new Date(salary.effective_date) > new Date(salaryMap[salary.employee_id].effective_date)) {
          salaryMap[salary.employee_id] = salary
        }
      })
      setEmployeeSalaries(salaryMap)
      
      setPayrollRuns(runsData || [])
      
      // Load payslips for the most recent completed run
      const completedRuns = (runsData || []).filter((r: any) => r.status === "completed")
      if (completedRuns.length > 0) {
        const recentRun = completedRuns[0]
        const payslipsData = await getPayslips(undefined, recentRun.id)
        setPayslips(payslipsData || [])
      }
    } catch (error) {
      console.error("Error loading payroll data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate payroll summary from employees and salaries
  const payrollSummary = employees.reduce(
    (acc, emp) => {
      const salary = employeeSalaries[emp.id]
      if (!salary) return acc

      const calculation = calculatePayroll(
        parseFloat(salary.base_salary || 0),
        0, // hours worked
        0, // overtime hours
        0, // overtime rate
        0, // bonus
        0, // commission
        0, // allowances
        0, // other earnings
        parseFloat(salary.tax_withholding_percentage || 0),
        parseFloat(salary.state_tax_withholding_percentage || 0),
        parseFloat(salary.social_security_percentage || 6.2),
        parseFloat(salary.medicare_percentage || 1.45),
        parseFloat(salary.health_insurance_deduction || 0),
        parseFloat(salary.retirement_contribution_percentage || 0),
        0, // other deductions
      )

      acc.totalGross += calculation.grossPay
      acc.totalDeductions += calculation.deductions.total
      acc.totalNet += calculation.netPay
      return acc
    },
    { totalGross: 0, totalDeductions: 0, totalNet: 0 },
  )

  // Calculate salary distribution
  const salaryDistribution = (() => {
    const ranges = [
      { range: "$50-75K", min: 50000, max: 75000 },
      { range: "$75-100K", min: 75000, max: 100000 },
      { range: "$100-125K", min: 100000, max: 125000 },
      { range: "$125-150K", min: 125000, max: 150000 },
      { range: "$150K+", min: 150000, max: Infinity },
    ]

    return ranges.map((range) => {
      const count = employees.filter((emp) => {
        const salary = employeeSalaries[emp.id]
        if (!salary) return false
        const baseSalary = parseFloat(salary.base_salary || 0)
        return baseSalary >= range.min && baseSalary < range.max
      }).length
      return { range: range.range, count }
    })
  })()

  // Calculate benefits breakdown
  const benefitsBreakdown = employees.reduce(
    (acc, emp) => {
      const salary = employeeSalaries[emp.id]
      if (!salary) return acc

      acc.healthInsurance += parseFloat(salary.health_insurance_deduction || 0) * 12 // Annual
      acc.retirement +=
        (parseFloat(salary.base_salary || 0) * parseFloat(salary.retirement_contribution_percentage || 0)) / 100 * 12
      return acc
    },
    { healthInsurance: 0, retirement: 0 },
  )

  const benefitsData = [
    { name: "Health Insurance", value: benefitsBreakdown.healthInsurance },
    { name: "Retirement", value: benefitsBreakdown.retirement },
    { name: "Other", value: benefitsBreakdown.healthInsurance * 0.3 }, // Estimated
  ]

  // Get next payroll run date
  const nextPayrollRun = payrollRuns.find((run) => run.status === "draft" || run.status === "processing")
  const nextPayrollDate = nextPayrollRun
    ? new Date(nextPayrollRun.pay_date)
    : new Date(new Date().setDate(new Date().getDate() + 5))
  const daysUntilPayroll = Math.ceil((nextPayrollDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  const handleProcessPayroll = async () => {
    if (!payPeriodStart || !payPeriodEnd || !payDate) {
      toast({
        title: "Validation Error",
        description: "Please set pay period dates",
        variant: "destructive",
      })
      return
    }

    try {
      setProcessing(true)

      // Generate run number
      const runNumber = `PR-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(payrollRuns.length + 1).padStart(3, "0")}`

      // Create payroll run
      const payrollRun = await createPayrollRun({
        run_number: runNumber,
        pay_period_start: payPeriodStart,
        pay_period_end: payPeriodEnd,
        pay_date: payDate,
        status: "processing",
        processed_by: user?.id,
      })

      // Process each employee
      let totalGross = 0
      let totalDeductions = 0
      let totalNet = 0
      const processedPayslips: any[] = []

      for (const employee of employees) {
        const salary = employeeSalaries[employee.id]
        if (!salary || employee.status !== "Active") continue

        // Calculate payroll
        const calculation = calculatePayroll(
          parseFloat(salary.base_salary || 0),
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          parseFloat(salary.tax_withholding_percentage || 0),
          parseFloat(salary.state_tax_withholding_percentage || 0),
          parseFloat(salary.social_security_percentage || 6.2),
          parseFloat(salary.medicare_percentage || 1.45),
          parseFloat(salary.health_insurance_deduction || 0),
          parseFloat(salary.retirement_contribution_percentage || 0),
          0,
        )

        // Get YTD totals (simplified - would calculate from previous payslips)
        const previousPayslips = await getPayslips(employee.id)
        const ytdGross = previousPayslips.reduce((sum, p) => sum + parseFloat(p.gross_pay || 0), 0) + calculation.grossPay
        const ytdDeductions = previousPayslips.reduce((sum, p) => sum + parseFloat(p.total_deductions || 0), 0) + calculation.deductions.total
        const ytdNet = ytdGross - ytdDeductions

        // Create payslip
        const payslip = await createPayslip({
          payroll_run_id: payrollRun.id,
          employee_id: employee.id,
          employee_name: employee.name,
          employee_email: employee.email,
          pay_period_start: payPeriodStart,
          pay_period_end: payPeriodEnd,
          pay_date: payDate,
          base_salary: parseFloat(salary.base_salary || 0),
          gross_pay: calculation.grossPay,
          federal_tax: calculation.deductions.federalTax,
          state_tax: calculation.deductions.stateTax,
          social_security: calculation.deductions.socialSecurity,
          medicare: calculation.deductions.medicare,
          health_insurance: calculation.deductions.healthInsurance,
          retirement_contribution: calculation.deductions.retirementContribution,
          total_deductions: calculation.deductions.total,
          net_pay: calculation.netPay,
          ytd_gross_pay: ytdGross,
          ytd_deductions: ytdDeductions,
          ytd_net_pay: ytdNet,
        })

        processedPayslips.push(payslip)
        totalGross += calculation.grossPay
        totalDeductions += calculation.deductions.total
        totalNet += calculation.netPay
      }

      // Update payroll run
      await updatePayrollRun(payrollRun.id, {
        status: "completed",
        total_employees: processedPayslips.length,
        total_gross_pay: totalGross,
        total_deductions: totalDeductions,
        total_net_pay: totalNet,
        processed_at: new Date().toISOString(),
      })

      setPayslips(processedPayslips)
      await loadData()
      toast({
        title: "Success",
        description: `Payroll processed successfully for ${processedPayslips.length} employees!`,
      })
    } catch (error) {
      console.error("Error processing payroll:", error)
      toast({
        title: "Error",
        description: "Error processing payroll. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleGeneratePaySlips = async () => {
    if (payslips.length === 0) {
      toast({
        title: "No Payslips",
        description: "No payslips available. Please process payroll first.",
        variant: "destructive",
      })
      return
    }

    // Mark payslips as sent (in a real system, you'd email them)
    toast({
      title: "Success",
      description: `Payslips generated for ${payslips.length} employees. You can view individual payslips by clicking on them.`,
    })
  }

  const handleExportToBank = async () => {
    if (payslips.length === 0) {
      toast({
        title: "No Payslips",
        description: "No payslips available. Please process payroll first.",
        variant: "destructive",
      })
      return
    }

    try {
      // Get bank information from salaries
      const exportData = payslips.map((payslip) => {
        const employee = employees.find((e) => e.id === payslip.employee_id)
        const salary = employeeSalaries[payslip.employee_id]
        return {
          employeeName: payslip.employee_name,
          bankAccountNumber: salary?.bank_account_number || "",
          bankRoutingNumber: salary?.bank_routing_number || "",
          bankName: salary?.bank_name || "",
          netPay: parseFloat(payslip.net_pay || 0),
        }
      })

      // Generate ACH format file
      const achContent = generateBankExportACH(exportData)
      const blob = new Blob([achContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `bank-export-ach-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      // Also create bank export record
      const payrollRun = payrollRuns.find((r) => r.status === "completed")
      if (payrollRun) {
        const totalAmount = exportData.reduce((sum, e) => sum + e.netPay, 0)
        await createBankExport({
          payroll_run_id: payrollRun.id,
          export_type: "ACH",
          file_format: "CSV",
          file_name: `bank-export-ach-${new Date().toISOString().split("T")[0]}.csv`,
          total_amount: totalAmount,
          total_transactions: exportData.length,
          export_date: new Date().toISOString().split("T")[0],
          status: "pending",
          created_by: user?.id,
        })
      }

      toast({
        title: "Success",
        description: `Bank export file generated for ${exportData.length} employees!`,
      })
    } catch (error) {
      console.error("Error exporting to bank:", error)
      toast({
        title: "Error",
        description: "Error generating bank export. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payroll Management</h1>
          <p className="text-muted-foreground">Manage salaries, bonuses, benefits, and payroll processing.</p>
        </div>
      </div>

      {/* Pay Period Selection */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Pay Period Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Pay Period Start</label>
            <input
              type="date"
              value={payPeriodStart}
              onChange={(e) => setPayPeriodStart(e.target.value)}
              className="w-full p-2 border rounded-lg bg-background"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Pay Period End</label>
            <input
              type="date"
              value={payPeriodEnd}
              onChange={(e) => setPayPeriodEnd(e.target.value)}
              className="w-full p-2 border rounded-lg bg-background"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Pay Date</label>
            <input
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="w-full p-2 border rounded-lg bg-background"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Monthly Payroll</p>
          <p className="text-3xl font-bold">
            ${loading ? "..." : (payrollSummary.totalNet / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-blue-600 mt-2">For {employees.length} employees</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Annual Benefits Cost</p>
          <p className="text-3xl font-bold">
            ${loading ? "..." : ((benefitsBreakdown.healthInsurance + benefitsBreakdown.retirement) / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-green-600 mt-2">Per annum</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Next Payroll Run</p>
          <p className="text-3xl font-bold">{loading ? "..." : daysUntilPayroll} days</p>
          <p className="text-xs text-orange-600 mt-2">
            {nextPayrollDate.toLocaleDateString()}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Salary Distribution by Range</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salaryDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis stroke="var(--color-muted-foreground)" angle={-45} textAnchor="end" height={80} dataKey="range" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Benefits Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={benefitsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: $${(value / 1000).toFixed(0)}K`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {benefitsData.map((entry, index) => (
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

      {/* Payroll Runs History */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Payroll Runs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Run Number</th>
                <th className="text-left py-3 px-4 font-semibold">Pay Period</th>
                <th className="text-left py-3 px-4 font-semibold">Pay Date</th>
                <th className="text-right py-3 px-4 font-semibold">Employees</th>
                <th className="text-right py-3 px-4 font-semibold">Total Net Pay</th>
                <th className="text-left py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-4 px-4 text-center text-muted-foreground">
                    Loading payroll runs...
                  </td>
                </tr>
              ) : payrollRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 px-4 text-center text-muted-foreground">
                    No payroll runs found
                  </td>
                </tr>
              ) : (
                payrollRuns.slice(0, 5).map((run) => (
                  <tr key={run.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="py-4 px-4 font-medium">{run.run_number}</td>
                    <td className="py-4 px-4">
                      {new Date(run.pay_period_start).toLocaleDateString()} - {new Date(run.pay_period_end).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">{new Date(run.pay_date).toLocaleDateString()}</td>
                    <td className="py-4 px-4 text-right">{run.total_employees || 0}</td>
                    <td className="py-4 px-4 text-right font-semibold">
                      ${parseFloat(run.total_net_pay || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          run.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : run.status === "processing"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {run.status === "completed" && <CheckCircle2 className="w-3 h-3" />}
                        {run.status === "processing" && <AlertCircle className="w-3 h-3" />}
                        {run.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payslips */}
      {payslips.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Generated Payslips</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Employee</th>
                  <th className="text-left py-3 px-4 font-semibold">Pay Period</th>
                  <th className="text-right py-3 px-4 font-semibold">Gross Pay</th>
                  <th className="text-right py-3 px-4 font-semibold">Deductions</th>
                  <th className="text-right py-3 px-4 font-semibold">Net Pay</th>
                  <th className="text-left py-3 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((payslip) => (
                  <tr key={payslip.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="py-4 px-4 font-medium">{payslip.employee_name}</td>
                    <td className="py-4 px-4">
                      {new Date(payslip.pay_period_start).toLocaleDateString()} - {new Date(payslip.pay_period_end).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">${parseFloat(payslip.gross_pay || 0).toLocaleString()}</td>
                    <td className="py-4 px-4 text-right text-red-600">
                      ${parseFloat(payslip.total_deductions || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold">
                      ${parseFloat(payslip.net_pay || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPayslip(payslip)}
                        className="gap-2"
                      >
                        <FileText className="w-3 h-3" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Employee Payroll Summary */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Employee Payroll Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Name</th>
                <th className="text-left py-3 px-4 font-semibold">Department</th>
                <th className="text-right py-3 px-4 font-semibold">Base Salary</th>
                <th className="text-right py-3 px-4 font-semibold">Estimated Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-4 px-4 text-center text-muted-foreground">
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 px-4 text-center text-muted-foreground">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.slice(0, 10).map((emp) => {
                  const salary = employeeSalaries[emp.id]
                  if (!salary) return null

                  const calculation = calculatePayroll(
                    parseFloat(salary.base_salary || 0),
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    0,
                    parseFloat(salary.tax_withholding_percentage || 0),
                    parseFloat(salary.state_tax_withholding_percentage || 0),
                    parseFloat(salary.social_security_percentage || 6.2),
                    parseFloat(salary.medicare_percentage || 1.45),
                    parseFloat(salary.health_insurance_deduction || 0),
                    parseFloat(salary.retirement_contribution_percentage || 0),
                    0,
                  )

                  return (
                    <tr key={emp.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="py-4 px-4 font-medium">{emp.name}</td>
                      <td className="py-4 px-4">{emp.department}</td>
                      <td className="py-4 px-4 text-right">${parseFloat(salary.base_salary || 0).toLocaleString()}</td>
                      <td className="py-4 px-4 text-right font-semibold">${calculation.netPay.toLocaleString()}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleProcessPayroll} disabled={processing || !payPeriodStart || !payPeriodEnd || !payDate}>
            {processing ? "Processing..." : "Process Payroll"}
          </Button>
          <Button variant="outline" onClick={handleGeneratePaySlips} disabled={payslips.length === 0}>
            <FileText className="w-4 h-4 mr-2" />
            Generate Pay Slips
          </Button>
          <Button variant="outline" onClick={handleExportToBank} disabled={payslips.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export to Bank
          </Button>
        </div>
      </Card>

      {selectedPayslip && (
        <PayslipModal isOpen={!!selectedPayslip} onClose={() => setSelectedPayslip(null)} payslip={selectedPayslip} />
      )}
    </div>
  )
}
