-- ============================================
-- AdminOS - Add kaacquah@company.com as Super Admin
-- ============================================
-- This migration ensures kaacquah@company.com is set up as a super admin
-- with all access and privileges
-- ============================================

-- Function to create or update user profile for super admin
CREATE OR REPLACE FUNCTION create_or_update_super_admin(
  p_email TEXT,
  p_full_name TEXT,
  p_department TEXT DEFAULT 'Management',
  p_position TEXT DEFAULT 'Super Administrator'
)
RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_all_permissions TEXT[];
  v_all_modules TEXT[];
BEGIN
  -- Get all permissions from role_permissions for super_admin
  SELECT ARRAY_AGG(permission_key) INTO v_all_permissions
  FROM public.role_permissions
  WHERE role_name = 'super_admin';

  -- Define all accessible modules for super admin
  v_all_modules := ARRAY[
    'dashboard',
    'employees',
    'finance',
    'expenses',
    'leave',
    'assets',
    'requests',
    'projects',
    'analytics',
    'payroll',
    'training',
    'recruitment',
    'communication',
    'compliance',
    'search',
    'bulkActions',
    'notifications',
    'settings',
    'workflows',
    'messaging',
    'announcements',
    'approvals',
    'emailLogs',
    'campaigns',
    'contentCalendar',
    'socialMedia',
    'marketingEvents',
    'brandAssets'
  ];

  -- Try to find existing user by email in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  -- If user doesn't exist in auth.users, raise an error with instructions
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User % not found in auth.users. Please create the auth user first using Supabase Admin API or Dashboard, then run this migration again.', p_email;
  END IF;

  -- Insert or update user profile with super_admin role and all privileges
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    department,
    position,
    role,
    permissions,
    accessible_modules,
    is_active
  ) VALUES (
    v_user_id,
    p_email,
    p_full_name,
    p_department,
    p_position,
    'super_admin',
    COALESCE(v_all_permissions, ARRAY[
      'manage_all',
      'manage_users',
      'manage_roles',
      'assign_roles',
      'assign_permissions',
      'manage_employees',
      'manage_finance',
      'manage_compliance',
      'manage_settings',
      'view_analytics',
      'export_data',
      'audit_access',
      'system_settings',
      'manage_assets',
      'view_assets',
      'assign_assets',
      'approve_expenses',
      'view_expenses',
      'create_expenses',
      'approve_leave',
      'view_leave',
      'create_leave',
      'manage_projects',
      'view_projects',
      'create_projects',
      'manage_announcements',
      'view_announcements',
      'export_audit',
      'procurement_create',
      'procurement_approve_tier1',
      'procurement_approve_tier2',
      'view_financial_reports',
      'export_fin_reports',
      'onboard_employee',
      'terminate_employee',
      'view_confidential',
      'view_restricted',
      'breakglass_authorize',
      'cross_entity_view',
      'system_override'
    ]),
    v_all_modules,
    true
  )
  ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    department = EXCLUDED.department,
    position = EXCLUDED.position,
    role = 'super_admin',
    permissions = EXCLUDED.permissions,
    accessible_modules = EXCLUDED.accessible_modules,
    is_active = true,
    updated_at = NOW();

  RAISE NOTICE 'Super admin user % has been created/updated with all privileges', p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or update kaacquah@company.com as super admin
-- NOTE: This will only work if the auth user already exists in auth.users
-- To create the auth user first, use Supabase Admin API:
-- 
-- Using Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add user" 
-- 3. Email: kaacquah@company.com
-- 4. Password: (set a secure password)
-- 5. Auto Confirm User: Yes
--
-- OR using Supabase Admin API (Node.js example):
-- const { createClient } = require('@supabase/supabase-js')
-- const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
-- await supabase.auth.admin.createUser({
--   email: 'kaacquah@company.com',
--   password: 'your-secure-password',
--   email_confirm: true
-- })

DO $$
BEGIN
  -- Check if user exists in auth.users first
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'kaacquah@company.com') THEN
    PERFORM create_or_update_super_admin(
      'kaacquah@company.com',
      'Kaacquah Admin',
      'Management',
      'Super Administrator'
    );
    RAISE NOTICE '✅ Super admin profile created/updated for kaacquah@company.com';
  ELSE
    RAISE WARNING '⚠️ User kaacquah@company.com not found in auth.users. Skipping profile creation.';
    RAISE NOTICE 'Please create the auth user first, then run this migration again.';
  END IF;
END $$;

-- Verify the user was created/updated
DO $$
DECLARE
  v_user_exists BOOLEAN;
  v_role TEXT;
  v_module_count INT;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.user_profiles WHERE email = 'kaacquah@company.com'
  ) INTO v_user_exists;

  IF v_user_exists THEN
    SELECT role, array_length(accessible_modules, 1) INTO v_role, v_module_count
    FROM public.user_profiles
    WHERE email = 'kaacquah@company.com';

    RAISE NOTICE '✅ User kaacquah@company.com verified:';
    RAISE NOTICE '   - Role: %', v_role;
    RAISE NOTICE '   - Accessible Modules: %', v_module_count;
    RAISE NOTICE '   - Status: Active with all privileges';
  ELSE
    RAISE WARNING '⚠️ User kaacquah@company.com profile not found. Please ensure auth user is created first.';
  END IF;
END $$;

-- Clean up the function (optional - can be kept for future use)
-- DROP FUNCTION IF EXISTS create_or_update_super_admin(TEXT, TEXT, TEXT, TEXT);

