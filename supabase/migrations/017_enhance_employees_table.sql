-- ============================================
-- AdminOS - Enhance Employees Table with Full Employee Details
-- ============================================
-- This migration adds comprehensive employee fields for complete HR management
-- ============================================

-- Add new columns to employees table
ALTER TABLE public.employees
  -- Personal Information
  ADD COLUMN IF NOT EXISTS employee_number VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS middle_name TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20), -- Male, Female, Other, Prefer not to say
  ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20), -- Single, Married, Divorced, Widowed, Other
  ADD COLUMN IF NOT EXISTS nationality VARCHAR(50),
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  
  -- Contact Information (Enhanced)
  ADD COLUMN IF NOT EXISTS mobile_phone TEXT,
  ADD COLUMN IF NOT EXISTS work_phone TEXT,
  ADD COLUMN IF NOT EXISTS personal_email TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state_province TEXT,
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'USA',
  
  -- Emergency Contact (Enhanced)
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT, -- Spouse, Parent, Sibling, Friend, Other
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_email TEXT,
  
  -- Employment Information (Enhanced)
  ADD COLUMN IF NOT EXISTS position TEXT, -- Job title/position
  ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manager_name TEXT,
  ADD COLUMN IF NOT EXISTS employment_type VARCHAR(30) DEFAULT 'Full-time', -- Full-time, Part-time, Contract, Intern, Consultant, Temporary
  ADD COLUMN IF NOT EXISTS work_location TEXT, -- Office location, Remote, Hybrid
  ADD COLUMN IF NOT EXISTS office_location TEXT, -- Physical office address
  ADD COLUMN IF NOT EXISTS termination_date DATE,
  ADD COLUMN IF NOT EXISTS termination_reason TEXT,
  ADD COLUMN IF NOT EXISTS probation_end_date DATE,
  ADD COLUMN IF NOT EXISTS notice_period_days INTEGER DEFAULT 30,
  
  -- Compensation & Benefits
  ADD COLUMN IF NOT EXISTS base_salary DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(3) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS pay_frequency VARCHAR(20) DEFAULT 'monthly', -- monthly, biweekly, weekly, annual
  ADD COLUMN IF NOT EXISTS benefits_enrolled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS health_insurance_provider TEXT,
  ADD COLUMN IF NOT EXISTS retirement_plan TEXT, -- 401k, Pension, None
  
  -- Documents & Compliance
  ADD COLUMN IF NOT EXISTS social_security_number TEXT, -- Encrypted/masked in production
  ADD COLUMN IF NOT EXISTS tax_id TEXT, -- For non-US employees
  ADD COLUMN IF NOT EXISTS passport_number TEXT,
  ADD COLUMN IF NOT EXISTS passport_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS work_permit_number TEXT,
  ADD COLUMN IF NOT EXISTS work_permit_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS visa_type TEXT,
  ADD COLUMN IF NOT EXISTS visa_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS contract_document_url TEXT,
  
  -- Additional Information
  ADD COLUMN IF NOT EXISTS bio TEXT, -- Employee bio/about
  ADD COLUMN IF NOT EXISTS skills TEXT[], -- Array of skills
  ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]', -- Array of certification objects
  ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]', -- Array of education objects
  ADD COLUMN IF NOT EXISTS previous_experience JSONB DEFAULT '[]', -- Array of previous work experience
  ADD COLUMN IF NOT EXISTS languages TEXT[], -- Languages spoken
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/New_York',
  
  -- System & Tracking
  ADD COLUMN IF NOT EXISTS last_review_date DATE,
  ADD COLUMN IF NOT EXISTS next_review_date DATE,
  ADD COLUMN IF NOT EXISTS performance_rating VARCHAR(20), -- Excellent, Good, Satisfactory, Needs Improvement
  ADD COLUMN IF NOT EXISTS notes TEXT, -- Internal HR notes
  ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT false, -- For sensitive positions
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_employees_employee_number ON public.employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON public.employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_employment_type ON public.employees(employment_type);

-- Update existing records to populate new fields from existing data
-- Split name into first_name and last_name
UPDATE public.employees
SET 
  first_name = CASE 
    WHEN name LIKE '% %' THEN SPLIT_PART(name, ' ', 1)
    ELSE name
  END,
  last_name = CASE 
    WHEN name LIKE '% %' THEN SPLIT_PART(name, ' ', array_length(string_to_array(name, ' '), 1))
    ELSE ''
  END,
  position = role
WHERE first_name IS NULL OR last_name IS NULL;

-- Update employee_number using a CTE to work around window function limitation in UPDATE
WITH numbered_employees AS (
  SELECT 
    id,
    'EMP-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 6, '0') AS emp_num
  FROM public.employees
  WHERE employee_number IS NULL
)
UPDATE public.employees e
SET employee_number = ne.emp_num
FROM numbered_employees ne
WHERE e.id = ne.id;

-- Update emergency contact fields from existing emergency_contact text
UPDATE public.employees
SET 
  emergency_contact_name = CASE 
    WHEN emergency_contact LIKE '%:%' THEN TRIM(SPLIT_PART(emergency_contact, ':', 2))
    ELSE emergency_contact
  END,
  emergency_contact_relationship = CASE 
    WHEN emergency_contact LIKE '%Spouse%' THEN 'Spouse'
    WHEN emergency_contact LIKE '%Parent%' THEN 'Parent'
    WHEN emergency_contact LIKE '%Relative%' THEN 'Relative'
    ELSE 'Other'
  END,
  emergency_contact_phone = CASE 
    WHEN emergency_contact LIKE '%+1-%' THEN 
      SUBSTRING(emergency_contact FROM '%+1-([0-9-]+)%')
    ELSE NULL
  END
WHERE emergency_contact IS NOT NULL 
  AND (emergency_contact_name IS NULL OR emergency_contact_phone IS NULL);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_employees_updated_at_trigger ON public.employees;
CREATE TRIGGER update_employees_updated_at_trigger
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION update_employees_updated_at();

-- Add RLS policies for enhanced employees table
-- Employees can view their own record
DROP POLICY IF EXISTS "Employees can view own record" ON public.employees;
CREATE POLICY "Employees can view own record"
  ON public.employees
  FOR SELECT
  USING (auth.uid() = user_id);

-- Managers can view employees in their department
DROP POLICY IF EXISTS "Managers can view department employees" ON public.employees;
CREATE POLICY "Managers can view department employees"
  ON public.employees
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.role IN ('dept_manager', 'hr_head', 'hr_officer', 'super_admin')
        OR (up.role = 'manager' AND up.department = employees.department)
      )
    )
  );

-- HR can view all employees
DROP POLICY IF EXISTS "HR can view all employees" ON public.employees;
CREATE POLICY "HR can view all employees"
  ON public.employees
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('hr_head', 'hr_officer', 'super_admin')
    )
  );

-- HR and managers can update employees
DROP POLICY IF EXISTS "HR and managers can update employees" ON public.employees;
CREATE POLICY "HR and managers can update employees"
  ON public.employees
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('hr_head', 'hr_officer', 'dept_manager', 'super_admin')
    )
  );

-- HR can insert new employees
DROP POLICY IF EXISTS "HR can insert employees" ON public.employees;
CREATE POLICY "HR can insert employees"
  ON public.employees
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('hr_head', 'hr_officer', 'super_admin')
    )
  );

-- Add comments to document the new columns
COMMENT ON COLUMN public.employees.employee_number IS 'Unique employee identification number';
COMMENT ON COLUMN public.employees.first_name IS 'Employee first name';
COMMENT ON COLUMN public.employees.last_name IS 'Employee last name';
COMMENT ON COLUMN public.employees.date_of_birth IS 'Employee date of birth';
COMMENT ON COLUMN public.employees.gender IS 'Employee gender';
COMMENT ON COLUMN public.employees.marital_status IS 'Marital status';
COMMENT ON COLUMN public.employees.manager_id IS 'Reference to manager/ supervisor';
COMMENT ON COLUMN public.employees.employment_type IS 'Type of employment (Full-time, Part-time, etc.)';
COMMENT ON COLUMN public.employees.base_salary IS 'Base annual salary';
COMMENT ON COLUMN public.employees.social_security_number IS 'SSN (should be encrypted in production)';
COMMENT ON COLUMN public.employees.skills IS 'Array of employee skills';
COMMENT ON COLUMN public.employees.certifications IS 'JSON array of certifications';
COMMENT ON COLUMN public.employees.education IS 'JSON array of education history';
COMMENT ON COLUMN public.employees.previous_experience IS 'JSON array of previous work experience';

-- ============================================
-- SUMMARY
-- ============================================
-- Enhanced employees table with comprehensive employee details:
-- - Personal information (name, DOB, gender, marital status, etc.)
-- - Enhanced contact information (multiple phones, addresses)
-- - Enhanced emergency contact details
-- - Employment details (manager, employment type, work location)
-- - Compensation & benefits information
-- - Documents & compliance (SSN, passport, work permit, visa)
-- - Additional information (skills, certifications, education, experience)
-- - System tracking (reviews, performance ratings, notes)
-- ============================================

