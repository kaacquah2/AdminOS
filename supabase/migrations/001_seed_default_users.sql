-- Migration script to seed default users
-- Run this AFTER creating the schema and setting up Supabase Auth
-- Note: This script assumes you've already created users in Supabase Auth
-- You'll need to create auth users first, then update their profiles

-- This script creates user profiles for the default users
-- Make sure to create auth users first using Supabase Dashboard or API

-- Example: To create a user, first use Supabase Auth API:
-- supabase.auth.admin.createUser({
--   email: 'admin@adminOS.com',
--   password: 'admin123',
--   email_confirm: true
-- })

-- Then run this SQL to create the profile (replace the UUID with actual auth user ID):

-- Super Admin
INSERT INTO public.user_profiles (
  id, email, full_name, department, position, role, permissions, accessible_modules, is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual UUID from auth.users
  'admin@adminOS.com',
  'Alex Chen',
  'Management',
  'Super Admin',
  'super_admin',
  ARRAY[
    'manage_all',
    'manage_employees',
    'manage_finance',
    'manage_compliance',
    'manage_settings',
    'view_analytics',
    'export_data',
    'audit_access',
    'system_settings'
  ],
  ARRAY[
    'admin-dashboard',
    'dashboard',
    'employees',
    'finance',
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
    'settings'
  ],
  true
) ON CONFLICT (id) DO NOTHING;

-- You can add more default users following the same pattern
-- Remember to:
-- 1. Create auth user first via Supabase Auth
-- 2. Get the UUID from auth.users table
-- 3. Insert profile with matching UUID

