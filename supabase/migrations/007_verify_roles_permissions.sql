-- Verification script for roles and permissions migration
-- Run this AFTER executing 007_create_roles_and_permissions.sql
-- This will verify that all tables, data, and functions were created successfully

-- ============================================
-- VERIFY TABLES EXIST
-- ============================================

SELECT 
  'Tables Check' AS check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles') 
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permissions_master')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_permissions')
    THEN '✅ All tables exist'
    ELSE '❌ Missing tables'
  END AS status;

-- ============================================
-- VERIFY ROLES COUNT
-- ============================================

SELECT 
  'Roles Count' AS check_type,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) = 20 THEN '✅ All 20 roles inserted'
    ELSE '❌ Expected 20 roles, found ' || COUNT(*)::TEXT
  END AS status
FROM public.roles;

-- ============================================
-- VERIFY PERMISSIONS COUNT
-- ============================================

SELECT 
  'Permissions Count' AS check_type,
  COUNT(*) AS count,
  CASE 
    WHEN COUNT(*) >= 33 THEN '✅ All permissions inserted'
    ELSE '❌ Expected at least 33 permissions, found ' || COUNT(*)::TEXT
  END AS status
FROM public.permissions_master;

-- ============================================
-- VERIFY ROLE-PERMISSION MAPPINGS
-- ============================================

SELECT 
  'Role-Permission Mappings' AS check_type,
  COUNT(*) AS total_mappings,
  COUNT(DISTINCT role_name) AS roles_with_permissions,
  CASE 
    WHEN COUNT(*) > 100 THEN '✅ Sufficient mappings created'
    ELSE '❌ Expected more mappings, found ' || COUNT(*)::TEXT
  END AS status
FROM public.role_permissions;

-- ============================================
-- VERIFY SPECIFIC ROLES
-- ============================================

SELECT 
  'Key Roles Check' AS check_type,
  STRING_AGG(role_name, ', ') AS roles_found,
  CASE 
    WHEN COUNT(*) = 5 THEN '✅ All key roles exist'
    ELSE '❌ Missing some key roles'
  END AS status
FROM public.roles
WHERE role_name IN ('super_admin', 'employee', 'hr_head', 'finance_director', 'dept_manager');

-- ============================================
-- VERIFY FUNCTIONS EXIST
-- ============================================

SELECT 
  'Functions Check' AS check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'get_role_permissions'
    ) AND EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'role_has_permission'
    )
    THEN '✅ Helper functions exist'
    ELSE '❌ Missing helper functions'
  END AS status;

-- ============================================
-- VERIFY RLS POLICIES
-- ============================================

SELECT 
  'RLS Policies Check' AS check_type,
  COUNT(*) AS policy_count,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ RLS policies exist'
    ELSE '❌ Missing RLS policies'
  END AS status
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('roles', 'permissions_master', 'role_permissions');

-- ============================================
-- VERIFY INHERITANCE RELATIONSHIPS
-- ============================================

SELECT 
  'Inheritance Check' AS check_type,
  role_name,
  inherits_from,
  CASE 
    WHEN array_length(inherits_from, 1) > 0 THEN '✅ Has parent roles'
    ELSE 'No inheritance'
  END AS status
FROM public.roles
WHERE array_length(inherits_from, 1) > 0
ORDER BY role_name;

-- ============================================
-- TEST HELPER FUNCTION
-- ============================================

SELECT 
  'Function Test' AS check_type,
  COUNT(*) AS permissions_for_employee,
  CASE 
    WHEN COUNT(*) >= 7 THEN '✅ get_role_permissions() works'
    ELSE '❌ Function may not be working correctly'
  END AS status
FROM public.get_role_permissions('employee');

-- ============================================
-- SUMMARY REPORT
-- ============================================

SELECT 
  '=== MIGRATION VERIFICATION SUMMARY ===' AS report;

SELECT 
  'Total Roles' AS metric,
  COUNT(*)::TEXT AS value
FROM public.roles

UNION ALL

SELECT 
  'Total Permissions' AS metric,
  COUNT(*)::TEXT AS value
FROM public.permissions_master

UNION ALL

SELECT 
  'Total Mappings' AS metric,
  COUNT(*)::TEXT AS value
FROM public.role_permissions

UNION ALL

SELECT 
  'Roles with Inheritance' AS metric,
  COUNT(*)::TEXT AS value
FROM public.roles
WHERE array_length(inherits_from, 1) > 0;

