-- Create roles and permissions tables for RBAC system
-- This migration creates the role-based access control structure

-- ============================================
-- CREATE TABLES
-- ============================================

-- Roles table
CREATE TABLE IF NOT EXISTS public.roles (
  role_name TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  level INTEGER NOT NULL,
  inherits_from TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions master table (catalog of all available permissions)
CREATE TABLE IF NOT EXISTS public.permissions_master (
  key TEXT PRIMARY KEY,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role permissions junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_name TEXT REFERENCES public.roles(role_name) ON DELETE CASCADE,
  permission_key TEXT REFERENCES public.permissions_master(key) ON DELETE CASCADE,
  PRIMARY KEY (role_name, permission_key)
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_roles_level ON public.roles(level);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_permissions_master_category ON public.permissions_master(category);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Drop existing policies if they exist (for idempotent migration)
DROP POLICY IF EXISTS "Users can view roles" ON public.roles;
DROP POLICY IF EXISTS "Users can view permissions" ON public.permissions_master;
DROP POLICY IF EXISTS "Users can view role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.roles;
DROP POLICY IF EXISTS "Super admins can manage permissions" ON public.permissions_master;
DROP POLICY IF EXISTS "Super admins can manage role permissions" ON public.role_permissions;

-- All authenticated users can view roles and permissions (for UI display)
CREATE POLICY "Users can view roles" ON public.roles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view permissions" ON public.permissions_master
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view role permissions" ON public.role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only super admins can manage roles and permissions
CREATE POLICY "Super admins can manage roles" ON public.roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage permissions" ON public.permissions_master
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage role permissions" ON public.role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================
-- INSERT PERMISSIONS MASTER
-- ============================================

INSERT INTO public.permissions_master (key, description, category) VALUES
  ('manage_users', 'Create, update, and delete user accounts', 'User Management'),
  ('manage_roles', 'Create, update, and delete roles', 'User Management'),
  ('assign_roles', 'Assign roles to users', 'User Management'),
  ('assign_permissions', 'Assign permissions to roles', 'User Management'),
  ('manage_assets', 'Create, update, and delete assets', 'Asset Management'),
  ('view_assets', 'View asset information', 'Asset Management'),
  ('assign_assets', 'Assign assets to employees', 'Asset Management'),
  ('approve_expenses', 'Approve expense requests', 'Finance'),
  ('view_expenses', 'View expense records', 'Finance'),
  ('create_expenses', 'Create expense requests', 'Finance'),
  ('approve_leave', 'Approve leave requests', 'HR'),
  ('view_leave', 'View leave records', 'HR'),
  ('create_leave', 'Create leave requests', 'HR'),
  ('manage_projects', 'Create, update, and delete projects', 'Project Management'),
  ('view_projects', 'View project information', 'Project Management'),
  ('create_projects', 'Create new projects', 'Project Management'),
  ('manage_announcements', 'Create, update, and delete announcements', 'Communication'),
  ('view_announcements', 'View announcements', 'Communication'),
  ('audit_access', 'Access audit logs and reports', 'Audit & Compliance'),
  ('export_audit', 'Export audit logs and reports', 'Audit & Compliance'),
  ('procurement_create', 'Create procurement orders', 'Procurement'),
  ('procurement_approve_tier1', 'Approve tier 1 procurement orders', 'Procurement'),
  ('procurement_approve_tier2', 'Approve tier 2 procurement orders', 'Procurement'),
  ('view_financial_reports', 'View financial reports', 'Finance'),
  ('export_fin_reports', 'Export financial reports', 'Finance'),
  ('onboard_employee', 'Onboard new employees', 'HR'),
  ('terminate_employee', 'Terminate employees', 'HR'),
  ('view_confidential', 'View confidential information', 'Security'),
  ('view_restricted', 'View restricted information', 'Security'),
  ('breakglass_authorize', 'Authorize breakglass access', 'Security'),
  ('cross_entity_view', 'View data across entities', 'Security'),
  ('system_override', 'System-level override permissions', 'System')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- INSERT ROLES
-- ============================================

INSERT INTO public.roles (role_name, description, level, inherits_from) VALUES
  ('super_admin', 'Full system administrator with unrestricted access across all modules and entities.', 100, '{}'),
  ('security_admin', 'Manages authentication, SSO, password policies, and security monitoring.', 95, '{}'),
  ('security_manager', 'Manages security operations, access control, incident response, and access reviews.', 80, ARRAY['security_admin']),
  ('it_admin', 'Manages infrastructure, device provisioning, and system maintenance.', 90, '{}'),
  ('hr_head', 'Leads HR operations across all departments and entities.', 85, '{}'),
  ('hr_manager', 'Manages HR workflows for a specific department or region.', 80, ARRAY['hr_head']),
  ('dept_manager', 'Oversees department operations, budgets, and approvals.', 75, '{}'),
  ('team_lead', 'Supervises team tasks and approvals under department manager.', 70, ARRAY['dept_manager']),
  ('finance_director', 'Manages finance operations, budgets, and high-tier approvals.', 80, '{}'),
  ('accountant', 'Handles day-to-day financial entries and expense verification.', 60, ARRAY['finance_director']),
  ('payroll_officer', 'Processes employee salaries and reimbursements.', 55, ARRAY['accountant']),
  ('procurement_officer', 'Creates and manages procurement orders and vendor relationships.', 70, '{}'),
  ('facilities_manager', 'Oversees physical assets, maintenance, and facility vendors.', 65, ARRAY['procurement_officer']),
  ('hse_manager', 'Manages health, safety, and environmental compliance, incidents, and training.', 75, '{}'),
  ('csr_manager', 'Manages corporate social responsibility initiatives, sustainability programs, and community impact.', 70, '{}'),
  ('rnd_manager', 'Manages research and development projects, innovation pipeline, patents, and lab resources.', 75, '{}'),
  ('support_manager', 'Manages customer support operations, team workload, and SLA compliance.', 70, '{}'),
  ('wellness_manager', 'Oversees employee wellness programs and engagement initiatives.', 60, '{}'),
  ('audit_head', 'Leads internal audit and compliance efforts.', 85, '{}'),
  ('audit_manager', 'Manages audit engagements and findings.', 75, ARRAY['audit_head']),
  ('internal_auditor', 'Performs field audits with restricted data access.', 60, ARRAY['audit_manager']),
  ('legal_counsel', 'Advises on contracts, compliance, and data governance.', 70, '{}'),
  ('compliance_officer', 'Ensures policy, regulatory, and audit compliance.', 65, ARRAY['legal_counsel']),
  ('employee', 'Base role for all authenticated users; limited self-service access.', 10, '{}'),
  ('contractor', 'External or temporary worker with scoped project access only.', 5, ARRAY['employee']),
  ('system_service', 'Non-interactive service account for backend automation and event processing.', 99, '{}')
ON CONFLICT (role_name) DO UPDATE SET
  description = EXCLUDED.description,
  level = EXCLUDED.level,
  inherits_from = EXCLUDED.inherits_from,
  updated_at = NOW();

-- ============================================
-- INSERT ROLE PERMISSIONS
-- ============================================

-- super_admin
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('super_admin', 'manage_users'),
  ('super_admin', 'manage_roles'),
  ('super_admin', 'assign_roles'),
  ('super_admin', 'assign_permissions'),
  ('super_admin', 'manage_assets'),
  ('super_admin', 'view_assets'),
  ('super_admin', 'assign_assets'),
  ('super_admin', 'approve_expenses'),
  ('super_admin', 'view_expenses'),
  ('super_admin', 'create_expenses'),
  ('super_admin', 'approve_leave'),
  ('super_admin', 'view_leave'),
  ('super_admin', 'create_leave'),
  ('super_admin', 'manage_projects'),
  ('super_admin', 'view_projects'),
  ('super_admin', 'create_projects'),
  ('super_admin', 'manage_announcements'),
  ('super_admin', 'view_announcements'),
  ('super_admin', 'audit_access'),
  ('super_admin', 'export_audit'),
  ('super_admin', 'procurement_create'),
  ('super_admin', 'procurement_approve_tier1'),
  ('super_admin', 'procurement_approve_tier2'),
  ('super_admin', 'view_financial_reports'),
  ('super_admin', 'export_fin_reports'),
  ('super_admin', 'onboard_employee'),
  ('super_admin', 'terminate_employee'),
  ('super_admin', 'view_confidential'),
  ('super_admin', 'view_restricted'),
  ('super_admin', 'breakglass_authorize'),
  ('super_admin', 'cross_entity_view'),
  ('super_admin', 'system_override')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- security_admin
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('security_admin', 'manage_users'),
  ('security_admin', 'assign_roles'),
  ('security_admin', 'assign_permissions'),
  ('security_admin', 'audit_access'),
  ('security_admin', 'breakglass_authorize'),
  ('security_admin', 'view_confidential')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- it_admin
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('it_admin', 'manage_assets'),
  ('it_admin', 'assign_assets'),
  ('it_admin', 'manage_projects'),
  ('it_admin', 'view_projects'),
  ('it_admin', 'audit_access')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- hr_head
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('hr_head', 'manage_users'),
  ('hr_head', 'onboard_employee'),
  ('hr_head', 'terminate_employee'),
  ('hr_head', 'approve_leave'),
  ('hr_head', 'view_leave'),
  ('hr_head', 'create_leave'),
  ('hr_head', 'view_expenses'),
  ('hr_head', 'approve_expenses'),
  ('hr_head', 'view_confidential'),
  ('hr_head', 'view_announcements'),
  ('hr_head', 'manage_announcements'),
  ('hr_head', 'view_projects'),
  ('hr_head', 'manage_projects'),
  ('hr_head', 'audit_access')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- hr_manager
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('hr_manager', 'onboard_employee'),
  ('hr_manager', 'approve_leave'),
  ('hr_manager', 'view_leave'),
  ('hr_manager', 'view_expenses'),
  ('hr_manager', 'view_projects'),
  ('hr_manager', 'create_leave'),
  ('hr_manager', 'view_announcements')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- dept_manager
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('dept_manager', 'approve_expenses'),
  ('dept_manager', 'view_expenses'),
  ('dept_manager', 'create_expenses'),
  ('dept_manager', 'approve_leave'),
  ('dept_manager', 'view_leave'),
  ('dept_manager', 'view_projects'),
  ('dept_manager', 'manage_projects'),
  ('dept_manager', 'view_assets'),
  ('dept_manager', 'view_announcements')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- team_lead
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('team_lead', 'approve_leave'),
  ('team_lead', 'create_expenses'),
  ('team_lead', 'view_expenses'),
  ('team_lead', 'view_projects'),
  ('team_lead', 'manage_projects'),
  ('team_lead', 'view_assets')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- finance_director
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('finance_director', 'approve_expenses'),
  ('finance_director', 'view_expenses'),
  ('finance_director', 'view_financial_reports'),
  ('finance_director', 'export_fin_reports'),
  ('finance_director', 'procurement_approve_tier2'),
  ('finance_director', 'audit_access')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- accountant
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('accountant', 'view_expenses'),
  ('accountant', 'approve_expenses'),
  ('accountant', 'create_expenses'),
  ('accountant', 'view_financial_reports')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- payroll_officer
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('payroll_officer', 'view_expenses'),
  ('payroll_officer', 'approve_expenses'),
  ('payroll_officer', 'view_confidential')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- procurement_officer
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('procurement_officer', 'procurement_create'),
  ('procurement_officer', 'procurement_approve_tier1'),
  ('procurement_officer', 'manage_assets'),
  ('procurement_officer', 'assign_assets'),
  ('procurement_officer', 'view_assets'),
  ('procurement_officer', 'view_expenses')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- facilities_manager
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('facilities_manager', 'manage_assets'),
  ('facilities_manager', 'assign_assets'),
  ('facilities_manager', 'view_assets'),
  ('facilities_manager', 'procurement_create'),
  ('facilities_manager', 'procurement_approve_tier1')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- audit_head
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('audit_head', 'audit_access'),
  ('audit_head', 'export_audit'),
  ('audit_head', 'view_financial_reports'),
  ('audit_head', 'view_confidential'),
  ('audit_head', 'view_projects'),
  ('audit_head', 'view_assets')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- audit_manager
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('audit_manager', 'audit_access'),
  ('audit_manager', 'view_financial_reports'),
  ('audit_manager', 'view_projects'),
  ('audit_manager', 'view_assets')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- internal_auditor
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('internal_auditor', 'audit_access'),
  ('internal_auditor', 'view_assets'),
  ('internal_auditor', 'view_projects')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- legal_counsel
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('legal_counsel', 'audit_access'),
  ('legal_counsel', 'view_confidential'),
  ('legal_counsel', 'view_restricted'),
  ('legal_counsel', 'view_projects')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- compliance_officer
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('compliance_officer', 'audit_access'),
  ('compliance_officer', 'export_audit'),
  ('compliance_officer', 'view_confidential'),
  ('compliance_officer', 'view_assets')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- employee
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('employee', 'create_expenses'),
  ('employee', 'view_expenses'),
  ('employee', 'create_leave'),
  ('employee', 'view_leave'),
  ('employee', 'view_projects'),
  ('employee', 'view_assets'),
  ('employee', 'view_announcements')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- contractor
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('contractor', 'view_projects'),
  ('contractor', 'view_assets')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- system_service
INSERT INTO public.role_permissions (role_name, permission_key) VALUES
  ('system_service', 'system_override'),
  ('system_service', 'audit_access'),
  ('system_service', 'manage_assets'),
  ('system_service', 'assign_assets'),
  ('system_service', 'manage_projects'),
  ('system_service', 'approve_expenses')
ON CONFLICT (role_name, permission_key) DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS FOR ROLE INHERITANCE
-- ============================================

-- Function to get all permissions for a role (including inherited)
CREATE OR REPLACE FUNCTION public.get_role_permissions(role_name_param TEXT)
RETURNS TABLE(permission_key TEXT) AS $$
WITH RECURSIVE role_hierarchy AS (
  -- Base case: start with the given role
  SELECT role_name_param AS role_name, 0 AS depth
  UNION ALL
  -- Recursive case: get parent roles
  SELECT r.inherits_from[i], rh.depth + 1
  FROM role_hierarchy rh
  JOIN public.roles r ON r.role_name = rh.role_name
  CROSS JOIN LATERAL generate_subscripts(r.inherits_from, 1) AS i
  WHERE rh.depth < 10 -- Prevent infinite recursion
)
SELECT DISTINCT rp.permission_key
FROM role_hierarchy rh
JOIN public.role_permissions rp ON rp.role_name = rh.role_name
ORDER BY rp.permission_key;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Function to check if a role has a permission (including inherited)
CREATE OR REPLACE FUNCTION public.role_has_permission(role_name_param TEXT, permission_key_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.get_role_permissions(role_name_param)
    WHERE permission_key = permission_key_param
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- UPDATE TRIGGER FOR ROLES
-- ============================================

-- Drop existing trigger if it exists (for idempotent migration)
DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

