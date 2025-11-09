-- ============================================
-- Executive Management - Complete Seed Data
-- ============================================
-- This migration creates comprehensive seed data for Executive Management
-- Includes: User profiles, Employee records, Leave balances, and Sample associations
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- HELPER: Create user profile if auth user exists
-- ============================================
-- This function creates user_profiles for auth users that don't have profiles yet
CREATE OR REPLACE FUNCTION create_executive_profile_if_exists(
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
-- 1. EXECUTIVE MANAGEMENT USER PROFILES
-- ============================================
-- This creates/updates user_profiles for executives IF their auth.users exist
-- To create new users: First create auth.users via Admin API, then run this migration

-- CEO - Super Admin
SELECT create_executive_profile_if_exists(
  'emma.williams@company.com',
  'Emma Williams',
  'Executive Management',
  'Chief Executive Officer',
  'super_admin',
  ARRAY['manage_all', 'manage_employees', 'manage_finance', 'manage_compliance', 'manage_settings', 'view_analytics', 'export_data', 'audit_access', 'system_settings', 'manage_projects', 'manage_budgets', 'strategic_planning'],
  ARRAY['admin-dashboard', 'executive-dashboard', 'dashboard', 'employees', 'finance', 'leave', 'assets', 'requests', 'projects', 'analytics', 'payroll', 'training', 'recruitment', 'communication', 'compliance', 'search', 'bulkActions', 'notifications', 'settings']
);

-- CFO - Department Manager
SELECT create_executive_profile_if_exists(
  'benjamin.scott@company.com',
  'Benjamin Scott',
  'Executive Management',
  'Chief Financial Officer',
  'dept_manager',
  ARRAY['manage_finance', 'view_analytics', 'export_data', 'manage_budgets', 'approve_expenses', 'financial_planning', 'strategic_planning'],
  ARRAY['executive-dashboard', 'manager-dashboard', 'finance-dashboard', 'dashboard', 'finance', 'expenses', 'analytics', 'payroll', 'projects']
);

-- COO - Department Manager
SELECT create_executive_profile_if_exists(
  'isabella.rossi@company.com',
  'Isabella Rossi',
  'Executive Management',
  'Chief Operating Officer',
  'dept_manager',
  ARRAY['manage_projects', 'view_analytics', 'manage_employees', 'manage_operations', 'strategic_planning', 'resource_allocation'],
  ARRAY['executive-dashboard', 'manager-dashboard', 'dashboard', 'employees', 'projects', 'analytics', 'workflows', 'communication']
);

-- Executive Assistant
SELECT create_executive_profile_if_exists(
  'david.kim@company.com',
  'David Kim',
  'Executive Management',
  'Executive Assistant',
  'employee',
  ARRAY['view_calendar', 'manage_schedules', 'coordinate_meetings'],
  ARRAY['employee-portal', 'dashboard', 'employees', 'projects', 'communication', 'calendar']
);

-- Strategy Analyst
SELECT create_executive_profile_if_exists(
  'olivia.jones@company.com',
  'Olivia Jones',
  'Executive Management',
  'Strategy Analyst',
  'employee',
  ARRAY['view_analytics', 'view_projects', 'view_finance', 'generate_reports'],
  ARRAY['employee-portal', 'dashboard', 'projects', 'analytics', 'finance']
);

-- Chief Technology Officer (CTO)
SELECT create_executive_profile_if_exists(
  'michael.chen@company.com',
  'Michael Chen',
  'Executive Management',
  'Chief Technology Officer',
  'dept_manager',
  ARRAY['manage_projects', 'view_analytics', 'manage_technology', 'strategic_planning', 'manage_it'],
  ARRAY['executive-dashboard', 'manager-dashboard', 'dashboard', 'projects', 'analytics', 'it-dashboard']
);

-- Chief Marketing Officer (CMO)
SELECT create_executive_profile_if_exists(
  'sophia.anderson@company.com',
  'Sophia Anderson',
  'Executive Management',
  'Chief Marketing Officer',
  'dept_manager',
  ARRAY['manage_marketing', 'view_analytics', 'manage_budgets', 'strategic_planning'],
  ARRAY['executive-dashboard', 'manager-dashboard', 'marketing-dashboard', 'dashboard', 'analytics', 'projects']
);

-- Also update existing profiles (for users that already have profiles)
UPDATE public.user_profiles up
SET 
  full_name = CASE 
    WHEN up.email = 'emma.williams@company.com' THEN 'Emma Williams'
    WHEN up.email = 'benjamin.scott@company.com' THEN 'Benjamin Scott'
    WHEN up.email = 'isabella.rossi@company.com' THEN 'Isabella Rossi'
    WHEN up.email = 'david.kim@company.com' THEN 'David Kim'
    WHEN up.email = 'olivia.jones@company.com' THEN 'Olivia Jones'
    WHEN up.email = 'michael.chen@company.com' THEN 'Michael Chen'
    WHEN up.email = 'sophia.anderson@company.com' THEN 'Sophia Anderson'
    ELSE up.full_name
  END,
  department = CASE 
    WHEN up.email IN ('emma.williams@company.com', 'benjamin.scott@company.com', 'isabella.rossi@company.com', 
                      'david.kim@company.com', 'olivia.jones@company.com', 'michael.chen@company.com', 
                      'sophia.anderson@company.com') THEN 'Executive Management'
    ELSE up.department
  END,
  position = CASE 
    WHEN up.email = 'emma.williams@company.com' THEN 'Chief Executive Officer'
    WHEN up.email = 'benjamin.scott@company.com' THEN 'Chief Financial Officer'
    WHEN up.email = 'isabella.rossi@company.com' THEN 'Chief Operating Officer'
    WHEN up.email = 'david.kim@company.com' THEN 'Executive Assistant'
    WHEN up.email = 'olivia.jones@company.com' THEN 'Strategy Analyst'
    WHEN up.email = 'michael.chen@company.com' THEN 'Chief Technology Officer'
    WHEN up.email = 'sophia.anderson@company.com' THEN 'Chief Marketing Officer'
    ELSE up.position
  END,
  role = CASE 
    WHEN up.email = 'emma.williams@company.com' THEN 'super_admin'
    WHEN up.email IN ('benjamin.scott@company.com', 'isabella.rossi@company.com', 'michael.chen@company.com', 'sophia.anderson@company.com') THEN 'dept_manager'
    WHEN up.email IN ('david.kim@company.com', 'olivia.jones@company.com') THEN 'employee'
    ELSE up.role
  END,
  permissions = CASE 
    WHEN up.email = 'emma.williams@company.com' THEN ARRAY['manage_all', 'manage_employees', 'manage_finance', 'manage_compliance', 'manage_settings', 'view_analytics', 'export_data', 'audit_access', 'system_settings', 'manage_projects', 'manage_budgets', 'strategic_planning']
    WHEN up.email = 'benjamin.scott@company.com' THEN ARRAY['manage_finance', 'view_analytics', 'export_data', 'manage_budgets', 'approve_expenses', 'financial_planning', 'strategic_planning']
    WHEN up.email = 'isabella.rossi@company.com' THEN ARRAY['manage_projects', 'view_analytics', 'manage_employees', 'manage_operations', 'strategic_planning', 'resource_allocation']
    WHEN up.email = 'david.kim@company.com' THEN ARRAY['view_calendar', 'manage_schedules', 'coordinate_meetings']
    WHEN up.email = 'olivia.jones@company.com' THEN ARRAY['view_analytics', 'view_projects', 'view_finance', 'generate_reports']
    WHEN up.email = 'michael.chen@company.com' THEN ARRAY['manage_projects', 'view_analytics', 'manage_technology', 'strategic_planning', 'manage_it']
    WHEN up.email = 'sophia.anderson@company.com' THEN ARRAY['manage_marketing', 'view_analytics', 'manage_budgets', 'strategic_planning']
    ELSE up.permissions
  END,
  accessible_modules = CASE 
    WHEN up.email = 'emma.williams@company.com' THEN ARRAY['admin-dashboard', 'executive-dashboard', 'dashboard', 'employees', 'finance', 'leave', 'assets', 'requests', 'projects', 'analytics', 'payroll', 'training', 'recruitment', 'communication', 'compliance', 'search', 'bulkActions', 'notifications', 'settings']
    WHEN up.email = 'benjamin.scott@company.com' THEN ARRAY['executive-dashboard', 'manager-dashboard', 'finance-dashboard', 'dashboard', 'finance', 'expenses', 'analytics', 'payroll', 'projects']
    WHEN up.email = 'isabella.rossi@company.com' THEN ARRAY['executive-dashboard', 'manager-dashboard', 'dashboard', 'employees', 'projects', 'analytics', 'workflows', 'communication']
    WHEN up.email = 'david.kim@company.com' THEN ARRAY['employee-portal', 'dashboard', 'employees', 'projects', 'communication', 'calendar']
    WHEN up.email = 'olivia.jones@company.com' THEN ARRAY['employee-portal', 'dashboard', 'projects', 'analytics', 'finance']
    WHEN up.email = 'michael.chen@company.com' THEN ARRAY['executive-dashboard', 'manager-dashboard', 'dashboard', 'projects', 'analytics', 'it-dashboard']
    WHEN up.email = 'sophia.anderson@company.com' THEN ARRAY['executive-dashboard', 'manager-dashboard', 'marketing-dashboard', 'dashboard', 'analytics', 'projects']
    ELSE up.accessible_modules
  END,
  is_active = true
WHERE up.email IN ('emma.williams@company.com', 'benjamin.scott@company.com', 'isabella.rossi@company.com', 
                   'david.kim@company.com', 'olivia.jones@company.com', 'michael.chen@company.com', 
                   'sophia.anderson@company.com')
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = up.id);

-- ============================================
-- 2. EXECUTIVE MANAGEMENT EMPLOYEE RECORDS
-- ============================================
-- These will be linked to user_profiles via email matching
-- Only creates/updates employees for users that exist in auth.users
-- Uses DO block to handle both INSERT and UPDATE cases

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
    WHERE up.department = 'Executive Management'
      AND EXISTS (SELECT 1 FROM auth.users WHERE id = up.id)
  LOOP
    -- Check if employee already exists
    SELECT id INTO v_employee_id
    FROM public.employees
    WHERE email = v_user_profile.email
    LIMIT 1;

    -- Calculate join date
    v_join_date := CASE 
      WHEN v_user_profile.position LIKE '%CEO%' THEN CURRENT_DATE - INTERVAL '8 years'
      WHEN v_user_profile.position LIKE '%CFO%' THEN CURRENT_DATE - INTERVAL '7 years'
      WHEN v_user_profile.position LIKE '%COO%' THEN CURRENT_DATE - INTERVAL '6 years'
      WHEN v_user_profile.position LIKE '%CTO%' THEN CURRENT_DATE - INTERVAL '5 years'
      WHEN v_user_profile.position LIKE '%CMO%' THEN CURRENT_DATE - INTERVAL '5 years'
      WHEN v_user_profile.position LIKE '%Assistant%' THEN CURRENT_DATE - INTERVAL '3 years'
      ELSE CURRENT_DATE - INTERVAL '2 years'
    END;

    -- Set phone
    v_phone := CASE 
      WHEN v_user_profile.email = 'emma.williams@company.com' THEN '+1-212-555-0101'
      WHEN v_user_profile.email = 'benjamin.scott@company.com' THEN '+1-212-555-0102'
      WHEN v_user_profile.email = 'isabella.rossi@company.com' THEN '+1-212-555-0103'
      WHEN v_user_profile.email = 'david.kim@company.com' THEN '+1-212-555-0104'
      WHEN v_user_profile.email = 'olivia.jones@company.com' THEN '+1-212-555-0105'
      WHEN v_user_profile.email = 'michael.chen@company.com' THEN '+1-212-555-0106'
      WHEN v_user_profile.email = 'sophia.anderson@company.com' THEN '+1-212-555-0107'
      ELSE '+1-212-555-0000'
    END;

    -- Set address
    v_address := CASE 
      WHEN v_user_profile.email = 'emma.williams@company.com' THEN '1 Central Park West, New York, NY 10023'
      WHEN v_user_profile.email = 'benjamin.scott@company.com' THEN '15 Park Avenue, New York, NY 10016'
      WHEN v_user_profile.email = 'isabella.rossi@company.com' THEN '200 West End Avenue, New York, NY 10023'
      WHEN v_user_profile.email = 'david.kim@company.com' THEN '350 5th Avenue, New York, NY 10118'
      WHEN v_user_profile.email = 'olivia.jones@company.com' THEN '100 Broadway, New York, NY 10005'
      WHEN v_user_profile.email = 'michael.chen@company.com' THEN '500 Park Avenue, New York, NY 10022'
      WHEN v_user_profile.email = 'sophia.anderson@company.com' THEN '250 West 57th Street, New York, NY 10019'
      ELSE 'New York, NY'
    END;

    -- Set emergency contact
    v_emergency_name := CASE 
      WHEN v_user_profile.position LIKE '%CEO%' THEN 'James Williams'
      WHEN v_user_profile.position LIKE '%CFO%' THEN 'Sarah Scott'
      WHEN v_user_profile.position LIKE '%COO%' THEN 'Marco Rossi'
      WHEN v_user_profile.position LIKE '%CTO%' THEN 'Lisa Chen'
      WHEN v_user_profile.position LIKE '%CMO%' THEN 'Robert Anderson'
      ELSE 'Emergency Contact'
    END;

    v_emergency_phone := CASE 
      WHEN v_user_profile.position LIKE '%CEO%' THEN '+1-212-555-0201'
      WHEN v_user_profile.position LIKE '%CFO%' THEN '+1-212-555-0202'
      WHEN v_user_profile.position LIKE '%COO%' THEN '+1-212-555-0203'
      WHEN v_user_profile.position LIKE '%CTO%' THEN '+1-212-555-0204'
      WHEN v_user_profile.position LIKE '%CMO%' THEN '+1-212-555-0205'
      ELSE '+1-212-555-0000'
    END;

    v_emergency_relationship := CASE 
      WHEN v_user_profile.position LIKE '%CEO%' THEN 'Spouse'
      WHEN v_user_profile.position LIKE '%CFO%' THEN 'Spouse'
      WHEN v_user_profile.position LIKE '%COO%' THEN 'Spouse'
      WHEN v_user_profile.position LIKE '%CTO%' THEN 'Spouse'
      WHEN v_user_profile.position LIKE '%CMO%' THEN 'Spouse'
      ELSE 'Family'
    END;

    -- Update existing employee or insert new one
    IF v_employee_id IS NOT NULL THEN
      -- Update existing employee
      UPDATE public.employees
      SET 
        user_id = v_user_profile.id,
        name = v_user_profile.full_name,
        email = v_user_profile.email,
        department = v_user_profile.department,
        role = v_user_profile.role,
        position = v_user_profile.position,
        status = 'Active',
        phone = v_phone,
        address = v_address,
        emergency_contact_name = v_emergency_name,
        emergency_contact_phone = v_emergency_phone,
        emergency_contact_relationship = v_emergency_relationship
      WHERE id = v_employee_id;
    ELSE
      -- Insert new employee
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
-- 3. EXECUTIVE SALARIES
-- ============================================
-- Update salaries for executive positions
-- This will update the most recent active salary or insert a new one

DO $$
DECLARE
  v_employee RECORD;
  v_salary DECIMAL(10,2);
  v_existing_salary_id UUID;
BEGIN
  FOR v_employee IN 
    SELECT id, position FROM public.employees 
    WHERE department = 'Executive Management'
  LOOP
    -- Calculate salary based on position
    v_salary := CASE 
      WHEN v_employee.position LIKE '%CEO%' THEN 350000.00
      WHEN v_employee.position LIKE '%CFO%' THEN 280000.00
      WHEN v_employee.position LIKE '%COO%' THEN 280000.00
      WHEN v_employee.position LIKE '%CTO%' THEN 260000.00
      WHEN v_employee.position LIKE '%CMO%' THEN 250000.00
      WHEN v_employee.position LIKE '%Assistant%' THEN 75000.00
      WHEN v_employee.position LIKE '%Analyst%' THEN 95000.00
      ELSE 100000.00
    END;

    -- Check if there's an active salary record for today
    SELECT id INTO v_existing_salary_id
    FROM public.employee_salaries
    WHERE employee_id = v_employee.id
      AND effective_date = CURRENT_DATE
    LIMIT 1;

    IF v_existing_salary_id IS NOT NULL THEN
      -- Update existing record for today
      UPDATE public.employee_salaries
      SET base_salary = v_salary,
          updated_at = NOW()
      WHERE id = v_existing_salary_id;
    ELSE
      -- Check if there's an active salary record (end_date IS NULL)
      SELECT id INTO v_existing_salary_id
      FROM public.employee_salaries
      WHERE employee_id = v_employee.id
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        AND is_active = true
      ORDER BY effective_date DESC
      LIMIT 1;

      IF v_existing_salary_id IS NOT NULL THEN
        -- Update the most recent active salary
        UPDATE public.employee_salaries
        SET base_salary = v_salary,
            effective_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE id = v_existing_salary_id;
      ELSE
        -- Insert new salary record
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
-- 4. LEAVE BALANCES FOR EXECUTIVES
-- ============================================
-- Executives typically have more leave days
-- This will update existing leave balances or insert new ones

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
    WHERE department = 'Executive Management'
  LOOP
    -- Calculate leave days based on position
    IF v_employee.position LIKE '%CEO%' OR 
       v_employee.position LIKE '%CFO%' OR 
       v_employee.position LIKE '%COO%' OR 
       v_employee.position LIKE '%CTO%' OR 
       v_employee.position LIKE '%CMO%' THEN
      v_vacation_days := 30;
      v_sick_days := 15;
      v_personal_days := 10;
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
      -- Update existing leave balance
      UPDATE public.leave_balances
      SET 
        vacation_days = v_vacation_days,
        sick_days = v_sick_days,
        personal_days = v_personal_days,
        updated_at = NOW()
      WHERE id = v_existing_balance_id;
    ELSE
      -- Insert new leave balance
      INSERT INTO public.leave_balances (
        employee_id, vacation_days, sick_days, personal_days, year
      ) VALUES (
        v_employee.id, v_vacation_days, v_sick_days, v_personal_days, v_year
      );
    END IF;
  END LOOP;
END $$;

-- ============================================
-- 5. EXECUTIVE PROJECT ASSOCIATIONS
-- ============================================
-- Link executives as sponsors/stakeholders to strategic projects
-- This assumes PMO projects already exist

DO $$
DECLARE
  v_ceo_id UUID;
  v_cfo_id UUID;
  v_coo_id UUID;
  v_cto_id UUID;
  v_cmo_id UUID;
  v_strategic_project_id UUID;
BEGIN
  -- Get executive user IDs
  SELECT id INTO v_ceo_id FROM public.user_profiles WHERE email = 'emma.williams@company.com';
  SELECT id INTO v_cfo_id FROM public.user_profiles WHERE email = 'benjamin.scott@company.com';
  SELECT id INTO v_coo_id FROM public.user_profiles WHERE email = 'isabella.rossi@company.com';
  SELECT id INTO v_cto_id FROM public.user_profiles WHERE email = 'michael.chen@company.com';
  SELECT id INTO v_cmo_id FROM public.user_profiles WHERE email = 'sophia.anderson@company.com';

  -- Link CEO as sponsor to strategic projects
  IF v_ceo_id IS NOT NULL THEN
    UPDATE public.pmo_projects 
    SET sponsor_id = v_ceo_id, sponsor_name = 'Emma Williams'
    WHERE id IN (
      SELECT id FROM public.pmo_projects
      WHERE priority = 'critical' AND sponsor_id IS NULL
      LIMIT 3
    );
  END IF;

  -- Link CFO as sponsor to financial projects
  IF v_cfo_id IS NOT NULL THEN
    UPDATE public.pmo_projects 
    SET sponsor_id = v_cfo_id, sponsor_name = 'Benjamin Scott'
    WHERE id IN (
      SELECT id FROM public.pmo_projects
      WHERE project_type IN ('compliance', 'infrastructure') AND sponsor_id IS NULL
      LIMIT 2
    );
  END IF;

  -- Link COO as sponsor to operational projects
  IF v_coo_id IS NOT NULL THEN
    UPDATE public.pmo_projects 
    SET sponsor_id = v_coo_id, sponsor_name = 'Isabella Rossi'
    WHERE id IN (
      SELECT id FROM public.pmo_projects
      WHERE project_type IN ('operations', 'strategic') AND sponsor_id IS NULL
      LIMIT 2
    );
  END IF;

  -- Link CTO as sponsor to IT projects
  IF v_cto_id IS NOT NULL THEN
    UPDATE public.pmo_projects 
    SET sponsor_id = v_cto_id, sponsor_name = 'Michael Chen'
    WHERE id IN (
      SELECT id FROM public.pmo_projects
      WHERE project_type = 'it_project' AND sponsor_id IS NULL
      LIMIT 2
    );
  END IF;

  -- Link CMO as sponsor to marketing projects
  IF v_cmo_id IS NOT NULL THEN
    UPDATE public.pmo_projects 
    SET sponsor_id = v_cmo_id, sponsor_name = 'Sophia Anderson'
    WHERE id IN (
      SELECT id FROM public.pmo_projects
      WHERE project_type = 'marketing' AND sponsor_id IS NULL
      LIMIT 2
    );
  END IF;
END $$;

-- ============================================
-- 6. EXECUTIVE STAKEHOLDER ASSOCIATIONS
-- ============================================
-- Add executives as stakeholders to key projects

DO $$
DECLARE
  v_ceo_id UUID;
  v_cfo_id UUID;
  v_coo_id UUID;
  v_project_ids UUID[];
  v_project_id UUID;
BEGIN
  -- Get executive user IDs
  SELECT id INTO v_ceo_id FROM public.user_profiles WHERE email = 'emma.williams@company.com';
  SELECT id INTO v_cfo_id FROM public.user_profiles WHERE email = 'benjamin.scott@company.com';
  SELECT id INTO v_coo_id FROM public.user_profiles WHERE email = 'isabella.rossi@company.com';

  -- Get strategic project IDs
  SELECT ARRAY_AGG(id) INTO v_project_ids
  FROM public.pmo_projects
  WHERE priority IN ('critical', 'high')
  LIMIT 5;

  -- Add CEO as stakeholder to all strategic projects
  IF v_ceo_id IS NOT NULL AND v_project_ids IS NOT NULL THEN
    FOREACH v_project_id IN ARRAY v_project_ids
    LOOP
      INSERT INTO public.pmo_project_stakeholders (
        pmo_project_id, stakeholder_id, stakeholder_name, stakeholder_email,
        stakeholder_role, interest_level, influence_level, communication_frequency
      )
      VALUES (
        v_project_id, v_ceo_id, 'Emma Williams', 'emma.williams@company.com',
        'executive', 'high', 'high', 'weekly'
      )
      ON CONFLICT (pmo_project_id, stakeholder_id) DO NOTHING;
    END LOOP;
  END IF;

  -- Add CFO as stakeholder to financial projects
  IF v_cfo_id IS NOT NULL THEN
    INSERT INTO public.pmo_project_stakeholders (
      pmo_project_id, stakeholder_id, stakeholder_name, stakeholder_email,
      stakeholder_role, interest_level, influence_level, communication_frequency
    )
    SELECT 
      pp.id, v_cfo_id, 'Benjamin Scott', 'benjamin.scott@company.com',
      'executive', 'high', 'high', 'monthly'
    FROM public.pmo_projects pp
    WHERE pp.project_type IN ('compliance', 'infrastructure')
    LIMIT 3
    ON CONFLICT (pmo_project_id, stakeholder_id) DO NOTHING;
  END IF;

  -- Add COO as stakeholder to operational projects
  IF v_coo_id IS NOT NULL THEN
    INSERT INTO public.pmo_project_stakeholders (
      pmo_project_id, stakeholder_id, stakeholder_name, stakeholder_email,
      stakeholder_role, interest_level, influence_level, communication_frequency
    )
    SELECT 
      pp.id, v_coo_id, 'Isabella Rossi', 'isabella.rossi@company.com',
      'executive', 'high', 'high', 'monthly'
    FROM public.pmo_projects pp
    WHERE pp.project_type IN ('operations', 'strategic')
    LIMIT 3
    ON CONFLICT (pmo_project_id, stakeholder_id) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 7. SUMMARY
-- ============================================
DO $$
DECLARE
  v_total_executives INTEGER;
  v_total_employees INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_executives FROM public.user_profiles WHERE department = 'Executive Management';
  SELECT COUNT(*) INTO v_total_employees FROM public.employees WHERE department = 'Executive Management';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Executive Management Seed Data Complete!';
  RAISE NOTICE 'Total Executive User Profiles: %', v_total_executives;
  RAISE NOTICE 'Total Executive Employee Records: %', v_total_employees;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'EXECUTIVE USERS CREATED:';
  RAISE NOTICE '1. Emma Williams (CEO) - super_admin';
  RAISE NOTICE '2. Benjamin Scott (CFO) - dept_manager';
  RAISE NOTICE '3. Isabella Rossi (COO) - dept_manager';
  RAISE NOTICE '4. David Kim (Executive Assistant) - employee';
  RAISE NOTICE '5. Olivia Jones (Strategy Analyst) - employee';
  RAISE NOTICE '6. Michael Chen (CTO) - dept_manager';
  RAISE NOTICE '7. Sophia Anderson (CMO) - dept_manager';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Create auth users in Supabase Auth (via Admin API or Dashboard)';
  RAISE NOTICE '   - Use the emails: emma.williams@company.com, benjamin.scott@company.com, etc.';
  RAISE NOTICE '   - Default password: AdminOS@2025';
  RAISE NOTICE '2. After creating auth users, run this migration again to update profiles';
  RAISE NOTICE '3. Or manually insert user_profiles with matching auth.users.id';
  RAISE NOTICE '4. Executives can then access Executive Dashboard';
  RAISE NOTICE '';
  RAISE NOTICE 'NOTE: This migration only updates existing user_profiles that have';
  RAISE NOTICE '      corresponding auth.users. It does not create new user_profiles.';
  RAISE NOTICE '========================================';
END $$;

