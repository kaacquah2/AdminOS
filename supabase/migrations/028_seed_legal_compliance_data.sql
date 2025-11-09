-- ============================================
-- Legal & Compliance - Complete Seed Data
-- ============================================
-- This migration creates comprehensive seed data for Legal & Compliance
-- Includes: User profiles, Employee records, Contracts, Deadlines, Certifications, Audit data
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- HELPER: Create user profile if auth user exists
-- ============================================
CREATE OR REPLACE FUNCTION create_legal_profile_if_exists(
  p_email TEXT,
  p_full_name TEXT,
  p_department TEXT,
  p_position TEXT,
  p_role TEXT,
  p_permissions TEXT[],
  p_accessible_modules TEXT[]
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if auth user exists with this email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  -- If auth user exists, create or update profile
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_profiles (
      id, email, full_name, department, position, role, permissions, accessible_modules, is_active
    ) VALUES (
      v_user_id, p_email, p_full_name, p_department, p_position, p_role, p_permissions, p_accessible_modules, true
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      department = EXCLUDED.department,
      position = EXCLUDED.position,
      role = EXCLUDED.role,
      permissions = EXCLUDED.permissions,
      accessible_modules = EXCLUDED.accessible_modules,
      is_active = EXCLUDED.is_active;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 1. LEGAL & COMPLIANCE USER PROFILES
-- ============================================

DO $$
BEGIN
  -- Legal Officer - Compliance Officer
  PERFORM create_legal_profile_if_exists(
    'laura.martinez@company.com',
    'Laura Martinez',
    'Legal & Compliance',
    'Legal Officer',
    'compliance_officer',
    ARRAY['audit_access', 'manage_compliance', 'view_analytics', 'manage_contracts', 'manage_documents', 'manage_deadlines'],
    ARRAY['dashboard', 'compliance', 'analytics', 'legal-dashboard']
  );

  -- Compliance Officer
  PERFORM create_legal_profile_if_exists(
    'david.green@company.com',
    'David Green',
    'Legal & Compliance',
    'Compliance Officer',
    'compliance_officer',
    ARRAY['audit_access', 'manage_compliance', 'view_analytics'],
    ARRAY['dashboard', 'compliance', 'legal-dashboard']
  );

  -- Department Manager - Legal Counsel
  PERFORM create_legal_profile_if_exists(
    'sarah.connor@company.com',
    'Sarah Connor',
    'Legal & Compliance',
    'Legal Counsel',
    'dept_manager',
    ARRAY['audit_access', 'manage_compliance', 'manage_contracts', 'manage_documents', 'manage_deadlines', 'view_analytics', 'export_data'],
    ARRAY['dashboard', 'compliance', 'analytics', 'legal-dashboard']
  );

  -- Paralegal
  PERFORM create_legal_profile_if_exists(
    'anna.park@company.com',
    'Anna Park',
    'Legal & Compliance',
    'Paralegal',
    'employee',
    ARRAY['view_compliance', 'view_documents'],
    ARRAY['employee-portal', 'dashboard', 'compliance', 'legal-dashboard']
  );

  -- Legal Analyst
  PERFORM create_legal_profile_if_exists(
    'john.fraser@company.com',
    'John Fraser',
    'Legal & Compliance',
    'Legal Analyst',
    'employee',
    ARRAY['view_compliance', 'view_documents', 'view_analytics'],
    ARRAY['employee-portal', 'dashboard', 'compliance', 'analytics', 'legal-dashboard']
  );

  -- Legal Assistant
  PERFORM create_legal_profile_if_exists(
    'maya.desai@company.com',
    'Maya Desai',
    'Legal & Compliance',
    'Legal Assistant',
    'employee',
    ARRAY['view_compliance'],
    ARRAY['employee-portal', 'dashboard', 'compliance', 'legal-dashboard']
  );
END $$;

-- Update existing profiles
UPDATE public.user_profiles up
SET 
  full_name = CASE 
    WHEN up.email = 'laura.martinez@company.com' THEN 'Laura Martinez'
    WHEN up.email = 'david.green@company.com' THEN 'David Green'
    WHEN up.email = 'sarah.connor@company.com' THEN 'Sarah Connor'
    WHEN up.email = 'anna.park@company.com' THEN 'Anna Park'
    WHEN up.email = 'john.fraser@company.com' THEN 'John Fraser'
    WHEN up.email = 'maya.desai@company.com' THEN 'Maya Desai'
    ELSE up.full_name
  END,
  department = CASE 
    WHEN up.email IN ('laura.martinez@company.com', 'david.green@company.com', 'sarah.connor@company.com', 
                      'anna.park@company.com', 'john.fraser@company.com', 'maya.desai@company.com') THEN 'Legal & Compliance'
    ELSE up.department
  END,
  position = CASE 
    WHEN up.email = 'laura.martinez@company.com' THEN 'Legal Officer'
    WHEN up.email = 'david.green@company.com' THEN 'Compliance Officer'
    WHEN up.email = 'sarah.connor@company.com' THEN 'Legal Counsel'
    WHEN up.email = 'anna.park@company.com' THEN 'Paralegal'
    WHEN up.email = 'john.fraser@company.com' THEN 'Legal Analyst'
    WHEN up.email = 'maya.desai@company.com' THEN 'Legal Assistant'
    ELSE up.position
  END,
  role = CASE 
    WHEN up.email = 'sarah.connor@company.com' THEN 'dept_manager'
    WHEN up.email IN ('laura.martinez@company.com', 'david.green@company.com') THEN 'compliance_officer'
    WHEN up.email IN ('anna.park@company.com', 'john.fraser@company.com', 'maya.desai@company.com') THEN 'employee'
    ELSE up.role
  END,
  is_active = true
WHERE up.email IN ('laura.martinez@company.com', 'david.green@company.com', 'sarah.connor@company.com', 
                   'anna.park@company.com', 'john.fraser@company.com', 'maya.desai@company.com')
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = up.id);

-- ============================================
-- 2. LEGAL & COMPLIANCE EMPLOYEE RECORDS
-- ============================================

DO $$
DECLARE
  v_user_profile RECORD;
  v_employee_id UUID;
  v_join_date DATE;
  v_phone TEXT;
  v_address TEXT;
  v_emergency_name TEXT;
  v_emergency_phone TEXT;
  v_emergency_relationship TEXT;
BEGIN
  FOR v_user_profile IN 
    SELECT * FROM public.user_profiles up
    WHERE up.department = 'Legal & Compliance'
      AND EXISTS (SELECT 1 FROM auth.users WHERE id = up.id)
  LOOP
    -- Check if employee already exists
    SELECT id INTO v_employee_id
    FROM public.employees
    WHERE email = v_user_profile.email
    LIMIT 1;

    -- Calculate join date
    v_join_date := CASE 
      WHEN v_user_profile.position LIKE '%Counsel%' THEN CURRENT_DATE - INTERVAL '6 years'
      WHEN v_user_profile.position LIKE '%Officer%' THEN CURRENT_DATE - INTERVAL '4 years'
      WHEN v_user_profile.position LIKE '%Analyst%' THEN CURRENT_DATE - INTERVAL '3 years'
      WHEN v_user_profile.position LIKE '%Paralegal%' THEN CURRENT_DATE - INTERVAL '2 years'
      ELSE CURRENT_DATE - INTERVAL '1 year'
    END;

    -- Set phone
    v_phone := CASE 
      WHEN v_user_profile.email = 'laura.martinez@company.com' THEN '+1-212-555-0201'
      WHEN v_user_profile.email = 'david.green@company.com' THEN '+1-212-555-0202'
      WHEN v_user_profile.email = 'sarah.connor@company.com' THEN '+1-212-555-0203'
      WHEN v_user_profile.email = 'anna.park@company.com' THEN '+1-212-555-0204'
      WHEN v_user_profile.email = 'john.fraser@company.com' THEN '+1-212-555-0205'
      WHEN v_user_profile.email = 'maya.desai@company.com' THEN '+1-212-555-0206'
      ELSE '+1-212-555-0000'
    END;

    -- Set address
    v_address := CASE 
      WHEN v_user_profile.email = 'laura.martinez@company.com' THEN '120 Park Avenue, New York, NY 10017'
      WHEN v_user_profile.email = 'david.green@company.com' THEN '150 Broadway, New York, NY 10038'
      WHEN v_user_profile.email = 'sarah.connor@company.com' THEN '200 Park Avenue, New York, NY 10166'
      WHEN v_user_profile.email = 'anna.park@company.com' THEN '300 5th Avenue, New York, NY 10118'
      WHEN v_user_profile.email = 'john.fraser@company.com' THEN '400 Park Avenue, New York, NY 10022'
      WHEN v_user_profile.email = 'maya.desai@company.com' THEN '500 Park Avenue, New York, NY 10022'
      ELSE 'New York, NY'
    END;

    -- Set emergency contact
    v_emergency_name := 'Emergency Contact';
    v_emergency_phone := '+1-212-555-0000';
    v_emergency_relationship := 'Family';

    -- Update existing employee or insert new one
    IF v_employee_id IS NOT NULL THEN
      UPDATE public.employees
      SET 
        user_id = v_user_profile.id,
        name = v_user_profile.full_name,
        email = v_user_profile.email,
        department = v_user_profile.department,
        role = v_user_profile.role,
        position = v_user_profile.position,
        status = 'Active',
        join_date = v_join_date,
        phone = v_phone,
        address = v_address,
        emergency_contact_name = v_emergency_name,
        emergency_contact_phone = v_emergency_phone,
        emergency_contact_relationship = v_emergency_relationship
      WHERE id = v_employee_id;
    ELSE
      INSERT INTO public.employees (
        id, user_id, name, email, department, role, position, status, join_date, 
        phone, address, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship
      ) VALUES (
        v_user_profile.id,
        v_user_profile.id,
        v_user_profile.full_name,
        v_user_profile.email,
        v_user_profile.department,
        v_user_profile.role,
        v_user_profile.position,
        'Active',
        v_join_date,
        v_phone,
        v_address,
        v_emergency_name,
        v_emergency_phone,
        v_emergency_relationship
      );
    END IF;
  END LOOP;
END $$;

-- ============================================
-- 3. LEGAL & COMPLIANCE SALARIES
-- ============================================

DO $$
DECLARE
  v_employee RECORD;
  v_salary DECIMAL(10,2);
  v_existing_salary_id UUID;
BEGIN
  FOR v_employee IN 
    SELECT id, position FROM public.employees 
    WHERE department = 'Legal & Compliance'
  LOOP
    -- Calculate salary based on position
    v_salary := CASE 
      WHEN v_employee.position LIKE '%Counsel%' THEN 180000.00
      WHEN v_employee.position LIKE '%Officer%' THEN 120000.00
      WHEN v_employee.position LIKE '%Analyst%' THEN 85000.00
      WHEN v_employee.position LIKE '%Paralegal%' THEN 65000.00
      WHEN v_employee.position LIKE '%Assistant%' THEN 55000.00
      ELSE 70000.00
    END;

    -- Check if there's an active salary record for today
    SELECT id INTO v_existing_salary_id
    FROM public.employee_salaries
    WHERE employee_id = v_employee.id
      AND effective_date = CURRENT_DATE
    LIMIT 1;

    IF v_existing_salary_id IS NOT NULL THEN
      UPDATE public.employee_salaries
      SET base_salary = v_salary, updated_at = NOW()
      WHERE id = v_existing_salary_id;
    ELSE
      -- Check if there's an active salary record
      SELECT id INTO v_existing_salary_id
      FROM public.employee_salaries
      WHERE employee_id = v_employee.id
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        AND is_active = true
      ORDER BY effective_date DESC
      LIMIT 1;

      IF v_existing_salary_id IS NOT NULL THEN
        UPDATE public.employee_salaries
        SET base_salary = v_salary, effective_date = CURRENT_DATE, updated_at = NOW()
        WHERE id = v_existing_salary_id;
      ELSE
        INSERT INTO public.employee_salaries (
          employee_id, base_salary, currency, effective_date, pay_frequency, is_active
        ) VALUES (
          v_employee.id, v_salary, 'USD', CURRENT_DATE, 'monthly', true
        );
      END IF;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- 4. LEAVE BALANCES FOR LEGAL & COMPLIANCE
-- ============================================

DO $$
DECLARE
  v_employee RECORD;
  v_vacation_days INTEGER;
  v_sick_days INTEGER;
  v_personal_days INTEGER;
  v_year INTEGER;
  v_existing_balance_id UUID;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  FOR v_employee IN 
    SELECT id, position FROM public.employees 
    WHERE department = 'Legal & Compliance'
  LOOP
    -- Calculate leave days based on position
    IF v_employee.position LIKE '%Counsel%' OR v_employee.position LIKE '%Officer%' THEN
      v_vacation_days := 25;
      v_sick_days := 12;
      v_personal_days := 8;
    ELSE
      v_vacation_days := 20;
      v_sick_days := 10;
      v_personal_days := 5;
    END IF;

    -- Check if leave balance already exists for this year
    SELECT id INTO v_existing_balance_id
    FROM public.leave_balances
    WHERE employee_id = v_employee.id
      AND year = v_year
    LIMIT 1;

    IF v_existing_balance_id IS NOT NULL THEN
      UPDATE public.leave_balances
      SET 
        vacation_days = v_vacation_days,
        sick_days = v_sick_days,
        personal_days = v_personal_days,
        updated_at = NOW()
      WHERE id = v_existing_balance_id;
    ELSE
      INSERT INTO public.leave_balances (
        employee_id, vacation_days, sick_days, personal_days, year
      ) VALUES (
        v_employee.id, v_vacation_days, v_sick_days, v_personal_days, v_year
      );
    END IF;
  END LOOP;
END $$;

-- ============================================
-- 5. CONTRACTS
-- ============================================

DO $$
DECLARE
  v_legal_counsel_id UUID;
  v_legal_officer_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO v_legal_counsel_id FROM public.user_profiles WHERE email = 'sarah.connor@company.com';
  SELECT id INTO v_legal_officer_id FROM public.user_profiles WHERE email = 'laura.martinez@company.com';

  -- Vendor Contracts
  INSERT INTO public.contracts (
    contract_number, contract_name, contract_type, party_name, party_type, status,
    start_date, end_date, renewal_date, auto_renew, value, currency, department,
    owner_id, owner_name, description
  ) VALUES
    ('CNT-2024-001', 'Cloud Services Agreement', 'vendor', 'TechCloud Solutions Inc.', 'vendor', 'active',
     CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '2 years', CURRENT_DATE + INTERVAL '1 year 11 months', true,
     500000.00, 'USD', 'IT', v_legal_counsel_id, 'Sarah Connor',
     'Multi-year cloud infrastructure and services agreement'),
    
    ('CNT-2024-002', 'Office Lease Agreement', 'lease', 'Metro Properties LLC', 'landlord', 'active',
     CURRENT_DATE - INTERVAL '3 years', CURRENT_DATE + INTERVAL '2 years', CURRENT_DATE + INTERVAL '1 year 11 months', false,
     1200000.00, 'USD', 'Facilities', v_legal_counsel_id, 'Sarah Connor',
     'Corporate headquarters office space lease'),
    
    ('CNT-2024-003', 'Software Licensing Agreement', 'vendor', 'Enterprise Software Corp', 'vendor', 'active',
     CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '2 years 6 months', CURRENT_DATE + INTERVAL '2 years 5 months', true,
     250000.00, 'USD', 'IT', v_legal_officer_id, 'Laura Martinez',
     'Enterprise software licensing and support agreement')
  ON CONFLICT (contract_number) DO NOTHING;

  -- Client Contracts
  INSERT INTO public.contracts (
    contract_number, contract_name, contract_type, party_name, party_type, status,
    start_date, end_date, renewal_date, auto_renew, value, currency, department,
    owner_id, owner_name, description
  ) VALUES
    ('CNT-2024-004', 'Master Services Agreement', 'client', 'Global Industries Ltd', 'client', 'active',
     CURRENT_DATE - INTERVAL '2 years', NULL, NULL, false,
     2000000.00, 'USD', 'Sales', v_legal_counsel_id, 'Sarah Connor',
     'Master services agreement with key client'),
    
    ('CNT-2024-005', 'Consulting Services Agreement', 'client', 'Strategic Partners Inc', 'client', 'active',
     CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '1 year', CURRENT_DATE + INTERVAL '11 months', true,
     750000.00, 'USD', 'Consulting', v_legal_officer_id, 'Laura Martinez',
     'Consulting services agreement with strategic partner')
  ON CONFLICT (contract_number) DO NOTHING;
END $$;

-- ============================================
-- 6. REGULATORY DEADLINES
-- ============================================

DO $$
DECLARE
  v_compliance_officer_id UUID;
  v_legal_officer_id UUID;
BEGIN
  SELECT id INTO v_compliance_officer_id FROM public.user_profiles WHERE email = 'david.green@company.com';
  SELECT id INTO v_legal_officer_id FROM public.user_profiles WHERE email = 'laura.martinez@company.com';

  INSERT INTO public.regulatory_deadlines (
    deadline_number, title, description, regulatory_body, regulation_type,
    deadline_date, reminder_date, status, department, assigned_to, assigned_to_name
  ) VALUES
    ('REG-2024-001', 'Annual Tax Filing', 'Corporate income tax return filing', 'IRS', 'filing',
     CURRENT_DATE + INTERVAL '2 months', CURRENT_DATE + INTERVAL '1 month 3 weeks', 'pending', 'Finance', v_compliance_officer_id, 'David Green'),
    
    ('REG-2024-002', 'Data Privacy Compliance Review', 'Annual GDPR and data protection compliance review', 'Data Protection Authority', 'compliance',
     CURRENT_DATE + INTERVAL '3 months', CURRENT_DATE + INTERVAL '2 months 3 weeks', 'pending', 'IT', v_legal_officer_id, 'Laura Martinez'),
    
    ('REG-2024-003', 'Environmental Permit Renewal', 'Renewal of environmental operating permits', 'Environmental Protection Agency', 'renewal',
     CURRENT_DATE + INTERVAL '45 days', CURRENT_DATE + INTERVAL '30 days', 'pending', 'Operations', v_compliance_officer_id, 'David Green'),
    
    ('REG-2024-004', 'Safety Certification Audit', 'Annual workplace safety certification audit', 'OSHA', 'audit',
     CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE + INTERVAL '45 days', 'pending', 'HSE', v_compliance_officer_id, 'David Green'),
    
    ('REG-2024-005', 'Financial Reporting Submission', 'Quarterly financial reporting to regulatory body', 'SEC', 'reporting',
     CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE + INTERVAL '10 days', 'pending', 'Finance', v_legal_officer_id, 'Laura Martinez')
  ON CONFLICT (deadline_number) DO NOTHING;
END $$;

-- ============================================
-- 7. CERTIFICATIONS AND LICENSES
-- ============================================

INSERT INTO public.certifications_licenses (
  cert_number, name, cert_type, issuing_body, issue_date, expiry_date, renewal_date,
  status, department, holder_type, requirements
) VALUES
  ('CERT-2024-001', 'ISO 9001:2015 Quality Management', 'certification', 'ISO Certification Body', 
   CURRENT_DATE - INTERVAL '2 years', CURRENT_DATE + INTERVAL '1 year', CURRENT_DATE + INTERVAL '11 months',
   'active', 'Quality', 'organization', ARRAY['Annual audit', 'Documentation review', 'Management review']),
  
  ('CERT-2024-002', 'ISO 27001 Information Security', 'certification', 'ISO Certification Body',
   CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '2 years', CURRENT_DATE + INTERVAL '1 year 11 months',
   'active', 'IT', 'organization', ARRAY['Security audit', 'Risk assessment', 'Control review']),
  
  ('CERT-2024-003', 'Business License', 'license', 'State Business Bureau',
   CURRENT_DATE - INTERVAL '5 years', CURRENT_DATE + INTERVAL '1 year', CURRENT_DATE + INTERVAL '11 months',
   'active', 'Corporate', 'organization', ARRAY['Annual fee payment', 'Business information update']),
  
  ('CERT-2024-004', 'Professional Liability Insurance', 'license', 'Insurance Provider',
   CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '11 months', CURRENT_DATE + INTERVAL '10 months',
   'active', 'Legal & Compliance', 'organization', ARRAY['Premium payment', 'Coverage review'])
ON CONFLICT (cert_number) DO NOTHING;

-- ============================================
-- 8. LEGAL DOCUMENTS
-- ============================================

DO $$
DECLARE
  v_legal_counsel_id UUID;
  v_legal_officer_id UUID;
BEGIN
  SELECT id INTO v_legal_counsel_id FROM public.user_profiles WHERE email = 'sarah.connor@company.com';
  SELECT id INTO v_legal_officer_id FROM public.user_profiles WHERE email = 'laura.martinez@company.com';

  INSERT INTO public.legal_documents (
    document_number, title, document_type, category, version, status,
    effective_date, review_date, department, owner_id, owner_name, document_url, summary
  ) VALUES
    ('DOC-2024-001', 'Employee Privacy Policy', 'policy', 'privacy', '2.1', 'active',
     CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '6 months', 'HR', v_legal_counsel_id, 'Sarah Connor',
     '/documents/policies/employee-privacy-policy-v2.1.pdf', 'Comprehensive employee data privacy and protection policy'),
    
    ('DOC-2024-002', 'Data Protection Agreement Template', 'agreement', 'data_protection', '1.0', 'active',
     CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '9 months', 'Legal & Compliance', v_legal_officer_id, 'Laura Martinez',
     '/documents/agreements/data-protection-template.pdf', 'Standard data protection agreement for vendor contracts'),
    
    ('DOC-2024-003', 'Code of Conduct', 'policy', 'corporate', '3.0', 'active',
     CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '11 months', 'Corporate', v_legal_counsel_id, 'Sarah Connor',
     '/documents/policies/code-of-conduct-v3.0.pdf', 'Corporate code of conduct and ethics policy'),
    
    ('DOC-2024-004', 'Intellectual Property Policy', 'policy', 'intellectual_property', '1.5', 'active',
     CURRENT_DATE - INTERVAL '8 months', CURRENT_DATE + INTERVAL '4 months', 'R&D', v_legal_officer_id, 'Laura Martinez',
     '/documents/policies/ip-policy-v1.5.pdf', 'Intellectual property protection and management policy')
  ON CONFLICT (document_number) DO NOTHING;
END $$;

-- ============================================
-- 9. AUDIT FINDINGS
-- ============================================

DO $$
DECLARE
  v_auditor_id UUID;
  v_compliance_officer_id UUID;
BEGIN
  SELECT id INTO v_auditor_id FROM public.user_profiles WHERE email = 'david.green@company.com' LIMIT 1;
  SELECT id INTO v_compliance_officer_id FROM public.user_profiles WHERE email = 'laura.martinez@company.com' LIMIT 1;

  IF v_auditor_id IS NOT NULL THEN
    INSERT INTO public.audit_findings (
      audit_id, audited_by, finding_type, severity, description, recommendation,
      status, due_date
    ) VALUES
      ('AUD-2024-001', v_auditor_id, 'compliance', 'high',
       'Data retention policy not consistently applied across departments', 
       'Implement automated data retention system and conduct training',
       'in_progress', CURRENT_DATE + INTERVAL '30 days'),
      
      ('AUD-2024-001', v_auditor_id, 'compliance', 'medium',
       'Some vendor contracts missing data protection clauses',
       'Review all vendor contracts and add standard data protection clauses',
       'open', CURRENT_DATE + INTERVAL '45 days'),
      
      ('AUD-2024-002', v_auditor_id, 'control', 'low',
       'Document version control could be improved',
       'Implement document management system with version control',
       'open', CURRENT_DATE + INTERVAL '60 days'),
      
      ('AUD-2024-002', v_auditor_id, 'compliance', 'critical',
       'Regulatory deadline tracking system needs improvement',
       'Implement automated deadline tracking with reminders',
       'in_progress', CURRENT_DATE + INTERVAL '15 days')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 10. RISK ASSESSMENTS
-- ============================================

DO $$
DECLARE
  v_legal_counsel_id UUID;
  v_compliance_officer_id UUID;
BEGIN
  SELECT id INTO v_legal_counsel_id FROM public.user_profiles WHERE email = 'sarah.connor@company.com' LIMIT 1;
  SELECT id INTO v_compliance_officer_id FROM public.user_profiles WHERE email = 'david.green@company.com' LIMIT 1;

  IF v_legal_counsel_id IS NOT NULL THEN
    INSERT INTO public.risk_assessments (
      risk_category, description, probability, impact, mitigation, owner_id, owner_name,
      status, last_review_date
    ) VALUES
      ('Regulatory Compliance', 'Risk of non-compliance with new data protection regulations', 'medium', 'high',
       'Regular compliance audits and training programs', v_compliance_officer_id, 'David Green',
       'active', CURRENT_DATE - INTERVAL '1 month'),
      
      ('Contract Management', 'Risk of missing contract renewal deadlines', 'low', 'high',
       'Automated contract management system with renewal alerts', v_legal_counsel_id, 'Sarah Connor',
       'active', CURRENT_DATE - INTERVAL '2 months'),
      
      ('Legal Liability', 'Risk of legal disputes with vendors or clients', 'low', 'critical',
       'Regular contract reviews and legal counsel consultation', v_legal_counsel_id, 'Sarah Connor',
       'active', CURRENT_DATE - INTERVAL '3 months'),
      
      ('Data Breach', 'Risk of data breach and regulatory penalties', 'medium', 'critical',
       'Enhanced security measures and incident response plan', v_compliance_officer_id, 'David Green',
       'mitigated', CURRENT_DATE - INTERVAL '1 month')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 11. AUDIT REPORTS
-- ============================================

DO $$
DECLARE
  v_auditor_id UUID;
  v_legal_counsel_id UUID;
BEGIN
  SELECT id INTO v_auditor_id FROM public.user_profiles WHERE email = 'david.green@company.com' LIMIT 1;
  SELECT id INTO v_legal_counsel_id FROM public.user_profiles WHERE email = 'sarah.connor@company.com' LIMIT 1;

  IF v_auditor_id IS NOT NULL AND v_legal_counsel_id IS NOT NULL THEN
    INSERT INTO public.audit_reports (
      title, period, audited_area, created_by, approved_by, status,
      findings, observations, conclusion, published_at
    ) VALUES
      ('Q4 2024 Compliance Audit Report', 'Q4 2024', 'Legal & Compliance Operations',
       v_auditor_id, v_legal_counsel_id, 'published',
       ARRAY['Data retention policy compliance', 'Contract management processes', 'Regulatory deadline tracking'],
       'Overall compliance posture is good with some areas for improvement identified.',
       'Compliance framework is sound. Recommendations should be implemented within next quarter.',
       CURRENT_DATE - INTERVAL '1 month'),
      
      ('Annual Data Protection Audit 2024', '2024', 'Data Protection & Privacy',
       v_auditor_id, v_legal_counsel_id, 'published',
       ARRAY['GDPR compliance', 'Data processing agreements', 'Privacy policy updates'],
       'Data protection measures are comprehensive and up-to-date.',
       'Organization is compliant with data protection regulations.',
       CURRENT_DATE - INTERVAL '2 months')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 12. SUMMARY
-- ============================================
DO $$
DECLARE
  v_total_users INTEGER;
  v_total_employees INTEGER;
  v_total_contracts INTEGER;
  v_total_deadlines INTEGER;
  v_total_certifications INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM public.user_profiles WHERE department = 'Legal & Compliance';
  SELECT COUNT(*) INTO v_total_employees FROM public.employees WHERE department = 'Legal & Compliance';
  SELECT COUNT(*) INTO v_total_contracts FROM public.contracts;
  SELECT COUNT(*) INTO v_total_deadlines FROM public.regulatory_deadlines;
  SELECT COUNT(*) INTO v_total_certifications FROM public.certifications_licenses;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Legal & Compliance Seed Data Complete!';
  RAISE NOTICE 'Total Legal & Compliance User Profiles: %', v_total_users;
  RAISE NOTICE 'Total Legal & Compliance Employee Records: %', v_total_employees;
  RAISE NOTICE 'Total Contracts: %', v_total_contracts;
  RAISE NOTICE 'Total Regulatory Deadlines: %', v_total_deadlines;
  RAISE NOTICE 'Total Certifications: %', v_total_certifications;
  RAISE NOTICE '========================================';
END $$;

