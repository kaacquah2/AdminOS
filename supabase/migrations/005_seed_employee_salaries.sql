-- ============================================
-- AdminOS - Seed Employee Salaries
-- ============================================
-- This script creates sample salary records for employees
-- Note: Bank account numbers are masked for security
-- 
-- ⚠️ PREREQUISITE: Run 004_create_payroll_tables.sql first!
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CHECK IF TABLES EXIST
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'employee_salaries'
  ) THEN
    RAISE EXCEPTION 'Table employee_salaries does not exist. Please run 004_create_payroll_tables.sql first!';
  END IF;
END $$;

-- ============================================
-- SEED EMPLOYEE SALARIES
-- ============================================
-- Create salary records for active employees
-- Using realistic salary ranges based on department and position

INSERT INTO public.employee_salaries (
  employee_id,
  base_salary,
  currency,
  pay_frequency,
  tax_withholding_percentage,
  state_tax_withholding_percentage,
  social_security_percentage,
  medicare_percentage,
  health_insurance_deduction,
  retirement_contribution_percentage,
  bank_account_number,
  bank_routing_number,
  bank_name,
  account_type,
  effective_date,
  is_active
)
SELECT 
  e.id as employee_id,
  -- Base salary based on department and role
  CASE 
    WHEN e.department = 'Executive Management' AND e.role LIKE '%CEO%' THEN 250000
    WHEN e.department = 'Executive Management' AND e.role LIKE '%CFO%' THEN 220000
    WHEN e.department = 'Executive Management' AND e.role LIKE '%COO%' THEN 200000
    WHEN e.department = 'Finance & Accounting' AND e.role LIKE '%Director%' THEN 150000
    WHEN e.department = 'Finance & Accounting' AND e.role LIKE '%Accountant%' THEN 75000
    WHEN e.department = 'Human Resources' AND e.role LIKE '%Head%' THEN 120000
    WHEN e.department = 'Human Resources' AND e.role LIKE '%Officer%' THEN 65000
    WHEN e.department = 'Information Technology' AND e.role LIKE '%Manager%' THEN 130000
    WHEN e.department = 'Information Technology' THEN 95000
    WHEN e.department = 'Procurement' AND e.role LIKE '%Head%' THEN 110000
    WHEN e.department = 'Procurement' AND e.role LIKE '%Officer%' THEN 70000
    WHEN e.department = 'Facilities & Maintenance' AND e.role LIKE '%Head%' THEN 100000
    WHEN e.department = 'Facilities & Maintenance' THEN 55000
    WHEN e.department = 'Legal & Compliance' AND e.role LIKE '%Officer%' THEN 140000
    WHEN e.department = 'Legal & Compliance' THEN 80000
    WHEN e.department = 'Project Management' AND e.role LIKE '%Head%' THEN 125000
    WHEN e.department = 'Project Management' THEN 85000
    WHEN e.department = 'Marketing & Communications' AND e.role LIKE '%Head%' THEN 115000
    WHEN e.department = 'Marketing & Communications' THEN 70000
    WHEN e.department = 'Training & Development' AND e.role LIKE '%Head%' THEN 105000
    WHEN e.department = 'Training & Development' THEN 65000
    WHEN e.department = 'Customer Support' AND e.role LIKE '%Manager%' THEN 90000
    WHEN e.department = 'Customer Support' THEN 50000
    WHEN e.department = 'Health, Safety & Environment' AND e.role LIKE '%Manager%' THEN 110000
    WHEN e.department = 'Health, Safety & Environment' THEN 70000
    WHEN e.department = 'CSR / Sustainability' AND e.role LIKE '%Manager%' THEN 100000
    WHEN e.department = 'CSR / Sustainability' THEN 60000
    WHEN e.department = 'Security & Access Control' AND e.role LIKE '%Head%' THEN 95000
    WHEN e.department = 'Security & Access Control' THEN 50000
    WHEN e.department = 'Research & Development' AND e.role LIKE '%Head%' THEN 160000
    WHEN e.department = 'Research & Development' THEN 100000
    WHEN e.department = 'Employee Wellness & Engagement' AND e.role LIKE '%Manager%' THEN 95000
    WHEN e.department = 'Employee Wellness & Engagement' THEN 55000
    WHEN e.role LIKE '%Manager%' OR e.role LIKE '%Head%' THEN 100000
    WHEN e.role LIKE '%Officer%' THEN 70000
    ELSE 55000
  END as base_salary,
  'USD' as currency,
  'monthly' as pay_frequency,
  -- Tax withholding (federal)
  CASE 
    WHEN e.department = 'Executive Management' THEN 24.0
    WHEN e.department = 'Finance & Accounting' OR e.department = 'Legal & Compliance' THEN 22.0
    ELSE 18.0
  END as tax_withholding_percentage,
  -- State tax (varies by state, using average)
  5.0 as state_tax_withholding_percentage,
  6.2 as social_security_percentage,
  1.45 as medicare_percentage,
  -- Health insurance deduction (monthly)
  CASE 
    WHEN e.department = 'Executive Management' THEN 500
    ELSE 300
  END as health_insurance_deduction,
  -- Retirement contribution percentage (401k)
  CASE 
    WHEN e.department = 'Executive Management' THEN 10.0
    WHEN e.role LIKE '%Manager%' OR e.role LIKE '%Head%' THEN 8.0
    ELSE 5.0
  END as retirement_contribution_percentage,
  -- Bank account (masked - last 4 digits)
  '****' || LPAD((ABS(HASHTEXT(e.email)) % 10000)::TEXT, 4, '0') as bank_account_number,
  -- Bank routing number (sample format)
  LPAD((ABS(HASHTEXT(e.email)) % 1000000)::TEXT, 9, '0') as bank_routing_number,
  -- Bank name (varied)
  CASE (ABS(HASHTEXT(e.email)) % 5)
    WHEN 0 THEN 'Chase Bank'
    WHEN 1 THEN 'Bank of America'
    WHEN 2 THEN 'Wells Fargo'
    WHEN 3 THEN 'Citibank'
    ELSE 'US Bank'
  END as bank_name,
  'checking' as account_type,
  e.join_date as effective_date,
  true as is_active
FROM public.employees e
WHERE e.status = 'Active'
  AND NOT EXISTS (
    SELECT 1 FROM public.employee_salaries es
    WHERE es.employee_id = e.id
      AND es.is_active = true
  )
ON CONFLICT (employee_id, effective_date) DO NOTHING;

-- ============================================
-- SUMMARY
-- ============================================

DO $$
DECLARE
  v_total_salaries INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_salaries 
  FROM public.employee_salaries 
  WHERE is_active = true;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Employee Salaries Seeding Complete!';
  RAISE NOTICE 'Total Active Salary Records: %', v_total_salaries;
  RAISE NOTICE '========================================';
END $$;

