// Payroll utility functions for calculations and processing

export interface PayrollCalculation {
  grossPay: number
  deductions: {
    federalTax: number
    stateTax: number
    socialSecurity: number
    medicare: number
    healthInsurance: number
    retirementContribution: number
    otherDeductions: number
    total: number
  }
  netPay: number
}

/**
 * Calculate payroll for an employee based on salary and deductions
 */
export function calculatePayroll(
  baseSalary: number,
  hoursWorked: number = 0,
  overtimeHours: number = 0,
  overtimeRate: number = 0,
  bonus: number = 0,
  commission: number = 0,
  allowances: number = 0,
  otherEarnings: number = 0,
  taxWithholdingPercentage: number = 0,
  stateTaxWithholdingPercentage: number = 0,
  socialSecurityPercentage: number = 6.2,
  medicarePercentage: number = 1.45,
  healthInsuranceDeduction: number = 0,
  retirementContributionPercentage: number = 0,
  otherDeductions: number = 0,
): PayrollCalculation {
  // Calculate overtime pay
  const overtimePay = overtimeHours * overtimeRate

  // Calculate gross pay
  const grossPay = baseSalary + overtimePay + bonus + commission + allowances + otherEarnings

  // Calculate deductions
  const federalTax = (grossPay * taxWithholdingPercentage) / 100
  const stateTax = (grossPay * stateTaxWithholdingPercentage) / 100
  const socialSecurity = (grossPay * socialSecurityPercentage) / 100
  const medicare = (grossPay * medicarePercentage) / 100
  const retirementContribution = (grossPay * retirementContributionPercentage) / 100

  const totalDeductions =
    federalTax +
    stateTax +
    socialSecurity +
    medicare +
    healthInsuranceDeduction +
    retirementContribution +
    otherDeductions

  const netPay = grossPay - totalDeductions

  return {
    grossPay: Math.round(grossPay * 100) / 100,
    deductions: {
      federalTax: Math.round(federalTax * 100) / 100,
      stateTax: Math.round(stateTax * 100) / 100,
      socialSecurity: Math.round(socialSecurity * 100) / 100,
      medicare: Math.round(medicare * 100) / 100,
      healthInsurance: Math.round(healthInsuranceDeduction * 100) / 100,
      retirementContribution: Math.round(retirementContribution * 100) / 100,
      otherDeductions: Math.round(otherDeductions * 100) / 100,
      total: Math.round(totalDeductions * 100) / 100,
    },
    netPay: Math.round(netPay * 100) / 100,
  }
}

/**
 * Generate payslip HTML content (printable format)
 */
export function generatePayslipHTML(payslip: {
  employeeName: string
  employeeEmail: string
  employeeId: string
  payPeriodStart: string
  payPeriodEnd: string
  payDate: string
  baseSalary: number
  hoursWorked?: number
  overtimeHours?: number
  overtimePay?: number
  bonus?: number
  commission?: number
  allowances?: number
  otherEarnings?: number
  grossPay: number
  federalTax?: number
  stateTax?: number
  socialSecurity?: number
  medicare?: number
  healthInsurance?: number
  retirementContribution?: number
  otherDeductions?: number
  totalDeductions: number
  netPay: number
  ytdGrossPay?: number
  ytdDeductions?: number
  ytdNetPay?: number
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${payslip.employeeName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #2563eb;
    }
    .company-info {
      text-align: right;
      color: #666;
      font-size: 14px;
    }
    .employee-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .info-section h3 {
      margin-top: 0;
      color: #2563eb;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 5px;
    }
    .info-section p {
      margin: 5px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background-color: #f3f4f6;
      font-weight: bold;
      color: #374151;
    }
    .text-right {
      text-align: right;
    }
    .total-row {
      font-weight: bold;
      background-color: #f9fafb;
      border-top: 2px solid #2563eb;
    }
    .net-pay {
      font-size: 24px;
      color: #2563eb;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>PAYSLIP</h1>
    <div class="company-info">
      <p><strong>AdminOS</strong></p>
      <p>Enterprise Management Platform</p>
    </div>
  </div>

  <div class="employee-info">
    <div class="info-section">
      <h3>Employee Information</h3>
      <p><strong>Name:</strong> ${payslip.employeeName}</p>
      <p><strong>Email:</strong> ${payslip.employeeEmail}</p>
      <p><strong>Employee ID:</strong> ${payslip.employeeId}</p>
    </div>
    <div class="info-section">
      <h3>Pay Period</h3>
      <p><strong>Period:</strong> ${new Date(payslip.payPeriodStart).toLocaleDateString()} - ${new Date(payslip.payPeriodEnd).toLocaleDateString()}</p>
      <p><strong>Pay Date:</strong> ${new Date(payslip.payDate).toLocaleDateString()}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Earnings</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Base Salary</td>
        <td class="text-right">$${payslip.baseSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
      ${payslip.hoursWorked ? `<tr><td>Hours Worked</td><td class="text-right">${payslip.hoursWorked}</td></tr>` : ''}
      ${payslip.overtimeHours && payslip.overtimePay ? `<tr><td>Overtime (${payslip.overtimeHours} hrs)</td><td class="text-right">$${payslip.overtimePay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>` : ''}
      ${payslip.bonus ? `<tr><td>Bonus</td><td class="text-right">$${payslip.bonus.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>` : ''}
      ${payslip.commission ? `<tr><td>Commission</td><td class="text-right">$${payslip.commission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>` : ''}
      ${payslip.allowances ? `<tr><td>Allowances</td><td class="text-right">$${payslip.allowances.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>` : ''}
      ${payslip.otherEarnings ? `<tr><td>Other Earnings</td><td class="text-right">$${payslip.otherEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>` : ''}
      <tr class="total-row">
        <td><strong>Gross Pay</strong></td>
        <td class="text-right"><strong>$${payslip.grossPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
      </tr>
    </tbody>
  </table>

  <table>
    <thead>
      <tr>
        <th>Deductions</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${payslip.federalTax ? `<tr><td>Federal Tax</td><td class="text-right">$${payslip.federalTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>` : ''}
      ${payslip.stateTax ? `<tr><td>State Tax</td><td class="text-right">$${payslip.stateTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>` : ''}
      ${payslip.socialSecurity ? `<tr><td>Social Security</td><td class="text-right">$${payslip.socialSecurity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>` : ''}
      ${payslip.medicare ? `<tr><td>Medicare</td><td class="text-right">$${payslip.medicare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>` : ''}
      ${payslip.healthInsurance ? `<tr><td>Health Insurance</td><td class="text-right">$${payslip.healthInsurance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>` : ''}
      ${payslip.retirementContribution ? `<tr><td>Retirement Contribution</td><td class="text-right">$${payslip.retirementContribution.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>` : ''}
      ${payslip.otherDeductions ? `<tr><td>Other Deductions</td><td class="text-right">$${payslip.otherDeductions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>` : ''}
      <tr class="total-row">
        <td><strong>Total Deductions</strong></td>
        <td class="text-right"><strong>$${payslip.totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
      </tr>
    </tbody>
  </table>

  <table>
    <tbody>
      <tr class="total-row">
        <td><strong class="net-pay">Net Pay</strong></td>
        <td class="text-right"><strong class="net-pay">$${payslip.netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
      </tr>
    </tbody>
  </table>

  ${payslip.ytdGrossPay !== undefined ? `
  <table>
    <thead>
      <tr>
        <th colspan="2">Year-to-Date Summary</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>YTD Gross Pay</td>
        <td class="text-right">$${payslip.ytdGrossPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td>YTD Deductions</td>
        <td class="text-right">$${(payslip.ytdDeductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td><strong>YTD Net Pay</strong></td>
        <td class="text-right"><strong>$${(payslip.ytdNetPay || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
      </tr>
    </tbody>
  </table>
  ` : ''}

  <div class="footer">
    <p>This is a computer-generated payslip. No signature is required.</p>
    <p>For inquiries, please contact HR Department.</p>
  </div>
</body>
</html>
  `
}

/**
 * Generate bank export file in ACH format (CSV)
 * ACH format typically includes: Account Number, Routing Number, Amount, Name
 */
export function generateBankExportACH(
  payslips: Array<{
    employeeName: string
    bankAccountNumber: string
    bankRoutingNumber: string
    netPay: number
  }>,
): string {
  // ACH CSV format: Account Number, Routing Number, Amount, Name, Reference
  const header = "Account Number,Routing Number,Amount,Employee Name,Reference\n"
  const rows = payslips.map((payslip, index) => {
    // Mask account number for security (show last 4 digits only)
    const maskedAccount = payslip.bankAccountNumber
      ? `****${payslip.bankAccountNumber.slice(-4)}`
      : "N/A"
    
    return `${maskedAccount},${payslip.bankRoutingNumber || "N/A"},${payslip.netPay.toFixed(2)},${payslip.employeeName},PAY-${index + 1}`
  }).join("\n")

  return header + rows
}

/**
 * Generate bank export file in BACS format (Fixed Width)
 * BACS format is UK standard - using simplified format here
 */
export function generateBankExportBACS(
  payslips: Array<{
    employeeName: string
    bankAccountNumber: string
    bankSortCode: string
    netPay: number
  }>,
): string {
  // BACS format (simplified): Sort Code (6), Account Number (8), Amount (11), Name (18), Reference (18)
  const rows = payslips.map((payslip, index) => {
    const sortCode = (payslip.bankSortCode || "000000").padStart(6, "0")
    const accountNumber = (payslip.bankAccountNumber || "00000000").padStart(8, "0")
    const amount = (payslip.netPay * 100).toFixed(0).padStart(11, "0") // Amount in pence/cents
    const name = payslip.employeeName.substring(0, 18).padEnd(18, " ")
    const reference = `PAY-${index + 1}`.padEnd(18, " ")
    
    return `${sortCode}${accountNumber}${amount}${name}${reference}`
  }).join("\n")

  return rows
}

/**
 * Generate bank export file in generic CSV format
 */
export function generateBankExportCSV(
  payslips: Array<{
    employeeName: string
    bankAccountNumber: string
    bankRoutingNumber?: string
    bankName?: string
    netPay: number
  }>,
): string {
  const header = "Employee Name,Bank Name,Account Number,Routing Number,Amount,Currency\n"
  const rows = payslips.map((payslip) => {
    // Mask account number for security
    const maskedAccount = payslip.bankAccountNumber
      ? `****${payslip.bankAccountNumber.slice(-4)}`
      : "N/A"
    
    return `"${payslip.employeeName}","${payslip.bankName || "N/A"}","${maskedAccount}","${payslip.bankRoutingNumber || "N/A"}",${payslip.netPay.toFixed(2)},USD`
  }).join("\n")

  return header + rows
}

