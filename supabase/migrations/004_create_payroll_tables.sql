-- ============================================
-- AdminOS - Payroll Tables Migration
-- ============================================
-- This script creates tables for payroll management including:
-- - Employee salaries and compensation
-- - Payroll runs (processing batches)
-- - Payslips (generated pay statements)
-- - Bank export records
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- EMPLOYEE SALARIES TABLE
-- ============================================
-- Stores base salary and compensation information for employees
CREATE TABLE IF NOT EXISTS public.employee_salaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  base_salary DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  pay_frequency TEXT NOT NULL DEFAULT 'monthly', -- monthly, biweekly, weekly
  tax_id TEXT, -- SSN or Tax ID
  bank_account_number TEXT, -- Encrypted or masked
  bank_routing_number TEXT, -- Bank routing number
  bank_name TEXT,
  account_type TEXT, -- checking, savings
  tax_withholding_percentage DECIMAL(5,2) DEFAULT 0, -- Federal tax withholding %
  state_tax_withholding_percentage DECIMAL(5,2) DEFAULT 0, -- State tax withholding %
  social_security_percentage DECIMAL(5,2) DEFAULT 6.2, -- SS tax %
  medicare_percentage DECIMAL(5,2) DEFAULT 1.45, -- Medicare tax %
  health_insurance_deduction DECIMAL(10,2) DEFAULT 0,
  retirement_contribution_percentage DECIMAL(5,2) DEFAULT 0, -- 401k, etc.
  other_deductions JSONB DEFAULT '{}', -- Flexible deductions
  effective_date DATE NOT NULL,
  end_date DATE, -- NULL if currently active
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, effective_date)
);

-- ============================================
-- PAYROLL RUNS TABLE
-- ============================================
-- Tracks each payroll processing batch/run
CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_number TEXT UNIQUE NOT NULL, -- e.g., PR-2024-01-001
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  pay_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, processing, completed, cancelled
  total_employees INTEGER DEFAULT 0,
  total_gross_pay DECIMAL(12,2) DEFAULT 0,
  total_deductions DECIMAL(12,2) DEFAULT 0,
  total_net_pay DECIMAL(12,2) DEFAULT 0,
  processed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYSLIPS TABLE
-- ============================================
-- Stores generated payslips for each employee per pay period
CREATE TABLE IF NOT EXISTS public.payslips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_run_id UUID REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  employee_email TEXT NOT NULL,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  pay_date DATE NOT NULL,
  
  -- Earnings
  base_salary DECIMAL(10,2) NOT NULL,
  hours_worked DECIMAL(6,2) DEFAULT 0,
  overtime_hours DECIMAL(6,2) DEFAULT 0,
  overtime_rate DECIMAL(10,2) DEFAULT 0,
  overtime_pay DECIMAL(10,2) DEFAULT 0,
  bonus DECIMAL(10,2) DEFAULT 0,
  commission DECIMAL(10,2) DEFAULT 0,
  allowances DECIMAL(10,2) DEFAULT 0,
  other_earnings DECIMAL(10,2) DEFAULT 0,
  gross_pay DECIMAL(10,2) NOT NULL,
  
  -- Deductions
  federal_tax DECIMAL(10,2) DEFAULT 0,
  state_tax DECIMAL(10,2) DEFAULT 0,
  social_security DECIMAL(10,2) DEFAULT 0,
  medicare DECIMAL(10,2) DEFAULT 0,
  health_insurance DECIMAL(10,2) DEFAULT 0,
  retirement_contribution DECIMAL(10,2) DEFAULT 0,
  other_deductions DECIMAL(10,2) DEFAULT 0,
  total_deductions DECIMAL(10,2) DEFAULT 0,
  
  -- Net Pay
  net_pay DECIMAL(10,2) NOT NULL,
  
  -- Year-to-date totals
  ytd_gross_pay DECIMAL(12,2) DEFAULT 0,
  ytd_deductions DECIMAL(12,2) DEFAULT 0,
  ytd_net_pay DECIMAL(12,2) DEFAULT 0,
  
  -- Payslip generation
  payslip_pdf_url TEXT, -- URL to generated PDF if stored
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(payroll_run_id, employee_id)
);

-- ============================================
-- BANK EXPORT RECORDS TABLE
-- ============================================
-- Tracks bank export files generated for payroll
CREATE TABLE IF NOT EXISTS public.bank_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_run_id UUID REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL DEFAULT 'ACH', -- ACH, BACS, Wire, etc.
  file_format TEXT NOT NULL DEFAULT 'CSV', -- CSV, Fixed Width, etc.
  file_name TEXT NOT NULL,
  file_url TEXT, -- URL to exported file if stored
  total_amount DECIMAL(12,2) NOT NULL,
  total_transactions INTEGER NOT NULL,
  bank_name TEXT,
  export_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, uploaded, processed, failed
  uploaded_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_employee_salaries_employee_id ON public.employee_salaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_salaries_active ON public.employee_salaries(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON public.payroll_runs(status);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_pay_date ON public.payroll_runs(pay_date);
CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON public.payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_payroll_run_id ON public.payslips(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payslips_pay_date ON public.payslips(pay_date);
CREATE INDEX IF NOT EXISTS idx_bank_exports_payroll_run_id ON public.bank_exports(payroll_run_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE public.employee_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_exports ENABLE ROW LEVEL SECURITY;

-- Employees can view their own salary information
CREATE POLICY "Employees can view own salary" ON public.employee_salaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = employee_salaries.employee_id 
      AND user_id = auth.uid()
    )
  );

-- HR and Finance can manage salaries
CREATE POLICY "HR can manage salaries" ON public.employee_salaries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('super_admin', 'hr_head', 'hr_officer', 'finance_director', 'accountant')
        OR 'manage_payroll' = ANY(permissions))
    )
  );

-- Employees can view their own payslips
CREATE POLICY "Employees can view own payslips" ON public.payslips
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = payslips.employee_id 
      AND user_id = auth.uid()
    )
  );

-- HR and Finance can view all payslips
CREATE POLICY "HR can view all payslips" ON public.payslips
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('super_admin', 'hr_head', 'hr_officer', 'finance_director', 'accountant')
        OR 'manage_payroll' = ANY(permissions))
    )
  );

-- HR and Finance can create/update payslips
CREATE POLICY "HR can manage payslips" ON public.payslips
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('super_admin', 'hr_head', 'hr_officer', 'finance_director', 'accountant')
        OR 'manage_payroll' = ANY(permissions))
    )
  );

-- HR and Finance can manage payroll runs
CREATE POLICY "HR can manage payroll runs" ON public.payroll_runs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('super_admin', 'hr_head', 'hr_officer', 'finance_director', 'accountant')
        OR 'manage_payroll' = ANY(permissions))
    )
  );

-- HR and Finance can manage bank exports
CREATE POLICY "HR can manage bank exports" ON public.bank_exports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('super_admin', 'hr_head', 'hr_officer', 'finance_director', 'accountant')
        OR 'manage_payroll' = ANY(permissions))
    )
  );

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_employee_salaries_updated_at BEFORE UPDATE ON public.employee_salaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_runs_updated_at BEFORE UPDATE ON public.payroll_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payslips_updated_at BEFORE UPDATE ON public.payslips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_exports_updated_at BEFORE UPDATE ON public.bank_exports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

