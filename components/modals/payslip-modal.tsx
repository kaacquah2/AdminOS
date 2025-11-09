"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"
import { generatePayslipHTML } from "@/lib/payroll-utils"

interface PayslipModalProps {
  isOpen: boolean
  onClose: () => void
  payslip: any
}

export function PayslipModal({ isOpen, onClose, payslip }: PayslipModalProps) {
  if (!payslip) return null

  const handlePrint = () => {
    const html = generatePayslipHTML({
      employeeName: payslip.employee_name,
      employeeEmail: payslip.employee_email,
      employeeId: payslip.employee_id,
      payPeriodStart: payslip.pay_period_start,
      payPeriodEnd: payslip.pay_period_end,
      payDate: payslip.pay_date,
      baseSalary: parseFloat(payslip.base_salary || 0),
      hoursWorked: parseFloat(payslip.hours_worked || 0),
      overtimeHours: parseFloat(payslip.overtime_hours || 0),
      overtimePay: parseFloat(payslip.overtime_pay || 0),
      bonus: parseFloat(payslip.bonus || 0),
      commission: parseFloat(payslip.commission || 0),
      allowances: parseFloat(payslip.allowances || 0),
      otherEarnings: parseFloat(payslip.other_earnings || 0),
      grossPay: parseFloat(payslip.gross_pay || 0),
      federalTax: parseFloat(payslip.federal_tax || 0),
      stateTax: parseFloat(payslip.state_tax || 0),
      socialSecurity: parseFloat(payslip.social_security || 0),
      medicare: parseFloat(payslip.medicare || 0),
      healthInsurance: parseFloat(payslip.health_insurance || 0),
      retirementContribution: parseFloat(payslip.retirement_contribution || 0),
      otherDeductions: parseFloat(payslip.other_deductions || 0),
      totalDeductions: parseFloat(payslip.total_deductions || 0),
      netPay: parseFloat(payslip.net_pay || 0),
      ytdGrossPay: parseFloat(payslip.ytd_gross_pay || 0),
      ytdDeductions: parseFloat(payslip.ytd_deductions || 0),
      ytdNetPay: parseFloat(payslip.ytd_net_pay || 0),
    })

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const handleDownload = () => {
    const html = generatePayslipHTML({
      employeeName: payslip.employee_name,
      employeeEmail: payslip.employee_email,
      employeeId: payslip.employee_id,
      payPeriodStart: payslip.pay_period_start,
      payPeriodEnd: payslip.pay_period_end,
      payDate: payslip.pay_date,
      baseSalary: parseFloat(payslip.base_salary || 0),
      hoursWorked: parseFloat(payslip.hours_worked || 0),
      overtimeHours: parseFloat(payslip.overtime_hours || 0),
      overtimePay: parseFloat(payslip.overtime_pay || 0),
      bonus: parseFloat(payslip.bonus || 0),
      commission: parseFloat(payslip.commission || 0),
      allowances: parseFloat(payslip.allowances || 0),
      otherEarnings: parseFloat(payslip.other_earnings || 0),
      grossPay: parseFloat(payslip.gross_pay || 0),
      federalTax: parseFloat(payslip.federal_tax || 0),
      stateTax: parseFloat(payslip.state_tax || 0),
      socialSecurity: parseFloat(payslip.social_security || 0),
      medicare: parseFloat(payslip.medicare || 0),
      healthInsurance: parseFloat(payslip.health_insurance || 0),
      retirementContribution: parseFloat(payslip.retirement_contribution || 0),
      otherDeductions: parseFloat(payslip.other_deductions || 0),
      totalDeductions: parseFloat(payslip.total_deductions || 0),
      netPay: parseFloat(payslip.net_pay || 0),
      ytdGrossPay: parseFloat(payslip.ytd_gross_pay || 0),
      ytdDeductions: parseFloat(payslip.ytd_deductions || 0),
      ytdNetPay: parseFloat(payslip.ytd_net_pay || 0),
    })

    const blob = new Blob([html], { type: "text/html" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payslip-${payslip.employee_name}-${payslip.pay_date}.html`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payslip - {payslip.employee_name}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
        <div
          className="border rounded-lg p-6 bg-white"
          dangerouslySetInnerHTML={{
            __html: generatePayslipHTML({
              employeeName: payslip.employee_name,
              employeeEmail: payslip.employee_email,
              employeeId: payslip.employee_id,
              payPeriodStart: payslip.pay_period_start,
              payPeriodEnd: payslip.pay_period_end,
              payDate: payslip.pay_date,
              baseSalary: parseFloat(payslip.base_salary || 0),
              hoursWorked: parseFloat(payslip.hours_worked || 0),
              overtimeHours: parseFloat(payslip.overtime_hours || 0),
              overtimePay: parseFloat(payslip.overtime_pay || 0),
              bonus: parseFloat(payslip.bonus || 0),
              commission: parseFloat(payslip.commission || 0),
              allowances: parseFloat(payslip.allowances || 0),
              otherEarnings: parseFloat(payslip.other_earnings || 0),
              grossPay: parseFloat(payslip.gross_pay || 0),
              federalTax: parseFloat(payslip.federal_tax || 0),
              stateTax: parseFloat(payslip.state_tax || 0),
              socialSecurity: parseFloat(payslip.social_security || 0),
              medicare: parseFloat(payslip.medicare || 0),
              healthInsurance: parseFloat(payslip.health_insurance || 0),
              retirementContribution: parseFloat(payslip.retirement_contribution || 0),
              otherDeductions: parseFloat(payslip.other_deductions || 0),
              totalDeductions: parseFloat(payslip.total_deductions || 0),
              netPay: parseFloat(payslip.net_pay || 0),
              ytdGrossPay: parseFloat(payslip.ytd_gross_pay || 0),
              ytdDeductions: parseFloat(payslip.ytd_deductions || 0),
              ytdNetPay: parseFloat(payslip.ytd_net_pay || 0),
            }),
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

