-- ============================================
-- COMPREHENSIVE DATABASE AUDIT & HEALTH CHECK
-- ============================================
-- This script performs a comprehensive audit of the database schema
-- to identify missing components, inconsistencies, and areas for improvement
-- Run this script to generate a detailed report of database health

-- ============================================
-- 1. TABLE EXISTENCE CHECK
-- ============================================
DO $$
DECLARE
  expected_tables TEXT[] := ARRAY[
    'user_profiles', 'employees', 'assets', 'projects', 'leave_requests', 
    'expenses', 'announcements', 'audit_logs', 'performance_reviews', 
    'leave_balances', 'attendance_records', 'training_programs', 
    'training_enrollments', 'department_budgets', 'payroll_runs', 
    'employee_salaries', 'payslips', 'bank_exports', 'support_requests',
    'audit_findings', 'compliance_records', 'legal_documents', 
    'contracts', 'incidents', 'hse_incidents', 'hse_training', 
    'csr_programs', 'csr_contributions', 'wellness_programs', 
    'wellness_enrollments', 'security_incidents', 'access_logs', 
    'security_alerts', 'rnd_projects', 'rnd_patents', 'rnd_publications',
    'procurement_orders', 'vendors', 'facilities_maintenance', 
    'maintenance_requests', 'pmo_projects', 'pmo_tasks', 'pmo_milestones',
    'pmo_resources', 'marketing_campaigns', 'marketing_analytics',
    'accounts_payable', 'accounts_receivable', 'financial_statements',
    'financial_transactions', 'cash_flow', 'budget_forecasts',
    'roles', 'permissions_master', 'role_permissions'
  ];
  missing_tables TEXT[];
  expected_table TEXT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '1. TABLE EXISTENCE CHECK';
  RAISE NOTICE '========================================';
  
  FOREACH expected_table IN ARRAY expected_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables t
      WHERE t.table_schema = 'public' 
      AND t.table_name = expected_table
    ) THEN
      missing_tables := array_append(missing_tables, expected_table);
      RAISE NOTICE 'MISSING TABLE: %', expected_table;
    END IF;
  END LOOP;
  
  IF array_length(missing_tables, 1) IS NULL THEN
    RAISE NOTICE '✓ All expected tables exist';
  ELSE
    RAISE NOTICE '✗ Missing % table(s)', array_length(missing_tables, 1);
  END IF;
END $$;

-- ============================================
-- 2. PRIMARY KEY CHECK
-- ============================================
SELECT 
  '2. PRIMARY KEY CHECK' as section,
  t.table_name,
  CASE 
    WHEN pk.constraint_name IS NULL THEN 'MISSING PRIMARY KEY'
    ELSE '✓ Has Primary Key'
  END as status,
  pk.constraint_name
FROM information_schema.tables t
LEFT JOIN (
  SELECT tc.table_name, tc.constraint_name
  FROM information_schema.table_constraints tc
  WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
) pk ON t.table_name = pk.table_name
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- ============================================
-- 3. FOREIGN KEY CONSTRAINTS CHECK
-- ============================================
SELECT 
  '3. FOREIGN KEY CONSTRAINTS' as section,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name,
  CASE 
    WHEN rc.delete_rule = 'NO ACTION' THEN '⚠ Consider CASCADE/SET NULL'
    ELSE '✓ ' || rc.delete_rule
  END as delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 4. MISSING INDEXES ON FOREIGN KEYS
-- ============================================
WITH fk_columns AS (
  SELECT DISTINCT
    tc.table_name,
    kcu.column_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
),
indexed_columns AS (
  SELECT
    t.relname AS table_name,
    a.attname AS column_name
  FROM pg_class t
  JOIN pg_index ix ON t.oid = ix.indrelid
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
  AND t.relkind = 'r'
)
SELECT 
  '4. MISSING INDEXES ON FOREIGN KEYS' as section,
  fk.table_name,
  fk.column_name,
  'MISSING INDEX - Add: CREATE INDEX idx_' || fk.table_name || '_' || fk.column_name || 
  ' ON public.' || fk.table_name || '(' || fk.column_name || ');' as recommendation
FROM fk_columns fk
LEFT JOIN indexed_columns idx 
  ON fk.table_name = idx.table_name 
  AND fk.column_name = idx.column_name
WHERE idx.table_name IS NULL
ORDER BY fk.table_name, fk.column_name;

-- ============================================
-- 5. MISSING NOT NULL CONSTRAINTS
-- ============================================
SELECT 
  '5. MISSING NOT NULL CONSTRAINTS' as section,
  t.table_name,
  c.column_name,
  c.data_type,
  CASE 
    WHEN c.column_name IN ('id', 'created_at', 'updated_at') THEN '✓ OK (has default)'
    WHEN c.is_nullable = 'YES' AND c.column_default IS NULL THEN 
      '⚠ Consider NOT NULL: ' || c.column_name || ' in ' || t.table_name
    ELSE '✓ OK'
  END as recommendation
FROM information_schema.tables t
JOIN information_schema.columns c 
  ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
AND c.is_nullable = 'YES'
AND c.column_default IS NULL
AND c.column_name NOT IN ('notes', 'description', 'bio', 'assumptions', 'comments')
ORDER BY t.table_name, c.column_name;

-- ============================================
-- 6. MISSING DEFAULT VALUES
-- ============================================
SELECT 
  '6. MISSING DEFAULT VALUES' as section,
  t.table_name,
  c.column_name,
  c.data_type,
  CASE 
    WHEN c.column_name = 'status' THEN '⚠ Add DEFAULT value for status column'
    WHEN c.column_name = 'created_at' THEN '⚠ Add DEFAULT NOW() for created_at'
    WHEN c.column_name = 'updated_at' THEN '⚠ Add DEFAULT NOW() for updated_at'
    WHEN c.data_type = 'boolean' AND c.column_default IS NULL THEN '⚠ Add DEFAULT false'
    WHEN c.data_type LIKE '%int%' AND c.column_name LIKE '%count%' THEN '⚠ Add DEFAULT 0'
    ELSE 'Review if default needed'
  END as recommendation
FROM information_schema.tables t
JOIN information_schema.columns c 
  ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
AND c.column_default IS NULL
AND c.is_nullable = 'YES'
AND c.column_name IN ('status', 'created_at', 'updated_at', 'is_active', 'is_confidential', 'enrolled_count')
ORDER BY t.table_name, c.column_name;

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS) CHECK
-- ============================================
SELECT 
  '7. ROW LEVEL SECURITY CHECK' as section,
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✓ RLS Enabled'
    ELSE '⚠ RLS NOT Enabled - Security Risk!'
  END as rls_status,
  'ALTER TABLE public.' || tablename || ' ENABLE ROW LEVEL SECURITY;' as fix_command
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- ============================================
-- 8. MISSING RLS POLICIES
-- ============================================
WITH tables_with_rls AS (
  SELECT tablename
  FROM pg_tables
  WHERE schemaname = 'public'
  AND rowsecurity = true
),
tables_with_policies AS (
  SELECT DISTINCT tablename
  FROM pg_policies
  WHERE schemaname = 'public'
)
SELECT 
  '8. MISSING RLS POLICIES' as section,
  t.tablename,
  '⚠ No RLS policies found - Add SELECT, INSERT, UPDATE, DELETE policies' as recommendation
FROM tables_with_rls t
LEFT JOIN tables_with_policies p ON t.tablename = p.tablename
WHERE p.tablename IS NULL
ORDER BY t.tablename;

-- ============================================
-- 9. MISSING UPDATED_AT TRIGGERS
-- ============================================
WITH tables_with_updated_at AS (
  SELECT DISTINCT t.table_name
  FROM information_schema.tables t
  JOIN information_schema.columns c 
    ON t.table_name = c.table_name
  WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND c.column_name = 'updated_at'
),
tables_with_triggers AS (
  SELECT DISTINCT event_object_table as table_name
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%updated_at%'
)
SELECT 
  '9. MISSING UPDATED_AT TRIGGERS' as section,
  t.table_name,
  '⚠ Missing updated_at trigger - Add: CREATE TRIGGER update_' || t.table_name || '_updated_at BEFORE UPDATE ON public.' || t.table_name || ' FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();' as recommendation
FROM tables_with_updated_at t
LEFT JOIN tables_with_triggers tr ON t.table_name = tr.table_name
WHERE tr.table_name IS NULL
ORDER BY t.table_name;

-- ============================================
-- 10. UNIQUE CONSTRAINTS CHECK
-- ============================================
SELECT 
  '10. UNIQUE CONSTRAINTS' as section,
  tc.table_name,
  tc.constraint_name,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns,
  '✓ Unique constraint exists' as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
AND tc.table_schema = 'public'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;

-- ============================================
-- 11. CHECK CONSTRAINTS
-- ============================================
SELECT 
  '11. CHECK CONSTRAINTS' as section,
  tc.table_name,
  tc.constraint_name,
  cc.check_clause,
  '✓ Check constraint exists' as status
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
  AND tc.table_schema = cc.constraint_schema
WHERE tc.constraint_type = 'CHECK'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================
-- 12. ORPHANED RECORDS CHECK
-- ============================================
SELECT 
  '12. ORPHANED RECORDS CHECK' as section,
  'accounts_payable' as table_name,
  'vendor_id' as foreign_key_column,
  COUNT(*) as orphaned_count,
  '⚠ Orphaned records found - vendor_id references non-existent vendors' as issue
FROM public.accounts_payable ap
LEFT JOIN public.vendors v ON ap.vendor_id = v.id
WHERE ap.vendor_id IS NOT NULL AND v.id IS NULL

UNION ALL

SELECT 
  '12. ORPHANED RECORDS CHECK' as section,
  'accounts_payable' as table_name,
  'project_id' as foreign_key_column,
  COUNT(*) as orphaned_count,
  '⚠ Orphaned records found - project_id references non-existent projects' as issue
FROM public.accounts_payable ap
LEFT JOIN public.projects p ON ap.project_id = p.id
WHERE ap.project_id IS NOT NULL AND p.id IS NULL

UNION ALL

SELECT 
  '12. ORPHANED RECORDS CHECK' as section,
  'expenses' as table_name,
  'employee_id' as foreign_key_column,
  COUNT(*) as orphaned_count,
  '⚠ Orphaned records found - employee_id references non-existent employees' as issue
FROM public.expenses e
LEFT JOIN public.employees emp ON e.employee_id = emp.id
WHERE e.employee_id IS NOT NULL AND emp.id IS NULL

UNION ALL

SELECT 
  '12. ORPHANED RECORDS CHECK' as section,
  'expenses' as table_name,
  'project_id' as foreign_key_column,
  COUNT(*) as orphaned_count,
  '⚠ Orphaned records found - project_id references non-existent projects' as issue
FROM public.expenses e
LEFT JOIN public.projects p ON e.project_id = p.id
WHERE e.project_id IS NOT NULL AND p.id IS NULL

UNION ALL

SELECT 
  '12. ORPHANED RECORDS CHECK' as section,
  'financial_transactions' as table_name,
  'project_id' as foreign_key_column,
  COUNT(*) as orphaned_count,
  '⚠ Orphaned records found - project_id references non-existent projects' as issue
FROM public.financial_transactions ft
LEFT JOIN public.projects p ON ft.project_id = p.id
WHERE ft.project_id IS NOT NULL AND p.id IS NULL

UNION ALL

SELECT 
  '12. ORPHANED RECORDS CHECK' as section,
  'employees' as table_name,
  'user_id' as foreign_key_column,
  COUNT(*) as orphaned_count,
  '⚠ Orphaned records found - user_id references non-existent user_profiles' as issue
FROM public.employees e
LEFT JOIN public.user_profiles up ON e.user_id = up.id
WHERE e.user_id IS NOT NULL AND up.id IS NULL;

-- ============================================
-- 13. DATA INTEGRITY ISSUES
-- ============================================
SELECT 
  '13. DATA INTEGRITY ISSUES' as section,
  'accounts_payable' as table_name,
  'Total amount mismatch' as issue,
  COUNT(*) as count,
  '⚠ total_amount != (amount + tax_amount) for some records' as description
FROM public.accounts_payable
WHERE ABS(total_amount - (amount + tax_amount)) > 0.01

UNION ALL

SELECT 
  '13. DATA INTEGRITY ISSUES' as section,
  'accounts_receivable' as table_name,
  'Total amount mismatch' as issue,
  COUNT(*) as count,
  '⚠ total_amount != (amount + tax_amount) for some records' as description
FROM public.accounts_receivable
WHERE ABS(total_amount - (amount + tax_amount)) > 0.01

UNION ALL

SELECT 
  '13. DATA INTEGRITY ISSUES' as section,
  'accounts_payable' as table_name,
  'Payment status inconsistency' as issue,
  COUNT(*) as count,
  '⚠ status = Paid but payment_status != Paid' as description
FROM public.accounts_payable
WHERE status = 'Paid' AND payment_status != 'Paid'

UNION ALL

SELECT 
  '13. DATA INTEGRITY ISSUES' as section,
  'cash_flow' as table_name,
  'Balance calculation error' as issue,
  COUNT(*) as count,
  '⚠ closing_balance != (opening_balance + cash_inflow - cash_outflow)' as description
FROM public.cash_flow
WHERE ABS(closing_balance - (opening_balance + cash_inflow - cash_outflow)) > 0.01

UNION ALL

SELECT 
  '13. DATA INTEGRITY ISSUES' as section,
  'financial_statements' as table_name,
  'Net income calculation' as issue,
  COUNT(*) as count,
  '⚠ net_income != (operating_income + other_income - other_expenses)' as description
FROM public.financial_statements
WHERE ABS(net_income - (operating_income + other_income - other_expenses)) > 0.01;

-- ============================================
-- 14. MISSING INDEXES ON COMMON QUERY COLUMNS
-- ============================================
WITH common_query_columns AS (
  SELECT 'status' as column_name, 'Most tables' as tables
  UNION ALL SELECT 'created_at', 'Most tables'
  UNION ALL SELECT 'department', 'employees, projects'
  UNION ALL SELECT 'date', 'expenses, leave_requests, attendance'
  UNION ALL SELECT 'due_date', 'accounts_payable, accounts_receivable'
)
SELECT 
  '14. MISSING INDEXES ON COMMON QUERY COLUMNS' as section,
  t.table_name,
  'status' as column_name,
  '⚠ Consider adding index on status for filtering' as recommendation
FROM information_schema.tables t
JOIN information_schema.columns c 
  ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
AND c.column_name = 'status'
AND NOT EXISTS (
  SELECT 1 FROM pg_indexes 
  WHERE schemaname = 'public' 
  AND tablename = t.table_name 
  AND indexname LIKE '%status%'
)
ORDER BY t.table_name;

-- ============================================
-- 15. FUNCTION EXISTENCE CHECK
-- ============================================
SELECT 
  '15. FUNCTION EXISTENCE CHECK' as section,
  routine_name,
  routine_type,
  CASE 
    WHEN routine_name = 'update_updated_at_column' THEN '✓ Required function exists'
    WHEN routine_name = 'get_role_permissions' THEN '✓ Required function exists'
    WHEN routine_name = 'role_has_permission' THEN '✓ Required function exists'
    ELSE 'Review if needed'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ============================================
-- 16. MISSING UPDATE_UPDATED_AT_COLUMN FUNCTION
-- ============================================
SELECT 
  '16. MISSING UPDATE_UPDATED_AT_COLUMN FUNCTION' as section,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name = 'update_updated_at_column'
    ) THEN '✓ Function exists'
    ELSE '⚠ MISSING - Create function: CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;'
  END as status;

-- ============================================
-- 17. TABLE COMMENTS CHECK
-- ============================================
SELECT 
  '17. TABLE COMMENTS CHECK' as section,
  t.table_name,
  CASE 
    WHEN obj_description(c.oid, 'pg_class') IS NOT NULL THEN '✓ Has comment'
    ELSE '⚠ Missing table comment - Add: COMMENT ON TABLE public.' || t.table_name || ' IS ''Description'';'
  END as status
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- ============================================
-- 18. PERFORMANCE: LARGE TABLES WITHOUT PARTITIONING
-- ============================================
SELECT 
  '18. PERFORMANCE: LARGE TABLES' as section,
  schemaname,
  relname as tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as size,
  n_live_tup as row_count,
  CASE 
    WHEN n_live_tup > 100000 THEN '⚠ Consider partitioning or archiving'
    WHEN n_live_tup > 10000 THEN '✓ Monitor growth'
    ELSE '✓ OK'
  END as recommendation
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC
LIMIT 10;

-- ============================================
-- 19. MISSING SEQUENCES FOR SERIAL COLUMNS
-- ============================================
SELECT 
  '19. SEQUENCES CHECK' as section,
  sequence_name,
  '✓ Sequence exists' as status
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- ============================================
-- 20. COMPREHENSIVE SUMMARY REPORT
-- ============================================
DO $$
DECLARE
  total_tables INTEGER;
  tables_with_rls INTEGER;
  tables_with_policies INTEGER;
  tables_without_pk INTEGER;
  missing_indexes INTEGER;
  orphaned_records INTEGER;
  integrity_issues INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO total_tables
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  -- Count tables with RLS
  SELECT COUNT(*) INTO tables_with_rls
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true;
  
  -- Count tables with policies
  SELECT COUNT(DISTINCT tablename) INTO tables_with_policies
  FROM pg_policies
  WHERE schemaname = 'public';
  
  -- Count tables without primary key
  SELECT COUNT(*) INTO tables_without_pk
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
    AND tc.table_name = t.table_name
    AND tc.constraint_type = 'PRIMARY KEY'
  );
  
  -- Count missing indexes on foreign keys (approximate)
  SELECT COUNT(*) INTO missing_indexes
  FROM (
    SELECT DISTINCT tc.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = tc.table_name
      AND indexdef LIKE '%' || kcu.column_name || '%'
    )
  ) fk;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'COMPREHENSIVE DATABASE AUDIT SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Tables: %', total_tables;
  RAISE NOTICE 'Tables with RLS Enabled: %', tables_with_rls;
  RAISE NOTICE 'Tables with RLS Policies: %', tables_with_policies;
  RAISE NOTICE 'Tables without Primary Key: %', tables_without_pk;
  RAISE NOTICE 'Foreign Keys Missing Indexes: %', missing_indexes;
  RAISE NOTICE '';
  RAISE NOTICE 'RECOMMENDATIONS:';
  RAISE NOTICE '1. Review all sections above for specific issues';
  RAISE NOTICE '2. Add missing indexes on foreign keys for performance';
  RAISE NOTICE '3. Ensure all tables have RLS policies';
  RAISE NOTICE '4. Fix orphaned records and data integrity issues';
  RAISE NOTICE '5. Add missing NOT NULL constraints where appropriate';
  RAISE NOTICE '6. Add updated_at triggers to all tables with updated_at column';
  RAISE NOTICE '7. Add table comments for documentation';
  RAISE NOTICE '========================================';
END $$;

