-- ============================================
-- AdminOS - Sample User Credentials Seeding Script
-- ============================================
-- This script creates 85 sample users across 17 departments
-- Format: Firstname.Lastname@company.com
-- Default Password: AdminOS@2025 (must be changed on first login)
-- 
-- ⚠️ SECURITY NOTE: 
-- - These are sample credentials for development/testing only
-- - In production, use secure password generation and MFA
-- - This script requires SERVICE ROLE privileges to create auth users
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Helper Function: Create Auth User and Profile
-- ============================================
-- This function creates both auth.users and public.user_profiles
-- Requires service role (execute with elevated privileges)
CREATE OR REPLACE FUNCTION create_user_with_profile(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_department TEXT,
  p_position TEXT,
  p_role TEXT,
  p_permissions TEXT[] DEFAULT '{}',
  p_accessible_modules TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Create auth user (requires service role)
  -- Note: In Supabase, this is typically done via Admin API
  -- For SQL execution, we'll generate UUID and let Admin API handle auth.users
  v_user_id := uuid_generate_v4();
  
  -- Insert user profile (will be linked when auth user is created)
  INSERT INTO public.user_profiles (
    id, email, full_name, department, position, role, permissions, accessible_modules, is_active
  ) VALUES (
    v_user_id, p_email, p_full_name, p_department, p_position, p_role, p_permissions, p_accessible_modules, true
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    department = EXCLUDED.department,
    position = EXCLUDED.position,
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    accessible_modules = EXCLUDED.accessible_modules,
    is_active = EXCLUDED.is_active;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 1. HUMAN RESOURCES (HR DEPARTMENT)
-- ============================================
INSERT INTO public.user_profiles (id, email, full_name, department, position, role, permissions, accessible_modules, is_active)
VALUES 
  (uuid_generate_v4(), 'sarah.johnson@company.com', 'Sarah Johnson', 'Human Resources', 'HR Head', 'hr_head', 
   ARRAY['manage_employees', 'approve_leave', 'view_analytics', 'manage_reviews'], 
   ARRAY['hr-dashboard', 'dashboard', 'employees', 'leave', 'training', 'recruitment', 'analytics'], true),
  (uuid_generate_v4(), 'daniel.perez@company.com', 'Daniel Perez', 'Human Resources', 'HR Officer', 'hr_officer',
   ARRAY['manage_employees', 'approve_leave'], 
   ARRAY['hr-dashboard', 'dashboard', 'employees', 'leave', 'training'], true),
  (uuid_generate_v4(), 'emily.carter@company.com', 'Emily Carter', 'Human Resources', 'HR Officer', 'hr_officer',
   ARRAY['manage_employees', 'approve_leave'], 
   ARRAY['hr-dashboard', 'dashboard', 'employees', 'leave', 'training'], true),
  (uuid_generate_v4(), 'michael.nguyen@company.com', 'Michael Nguyen', 'Human Resources', 'HR Assistant', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'employees'], true),
  (uuid_generate_v4(), 'olivia.kim@company.com', 'Olivia Kim', 'Human Resources', 'HR Intern', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard'], true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  accessible_modules = EXCLUDED.accessible_modules;

-- ============================================
-- 2. FINANCE & ACCOUNTING
-- ============================================
INSERT INTO public.user_profiles (id, email, full_name, department, position, role, permissions, accessible_modules, is_active)
VALUES 
  (uuid_generate_v4(), 'robert.smith@company.com', 'Robert Smith', 'Finance & Accounting', 'Finance Director', 'finance_director',
   ARRAY['manage_finance', 'approve_expenses', 'manage_budgets', 'view_analytics', 'export_data'], 
   ARRAY['finance-dashboard', 'dashboard', 'finance', 'expenses', 'analytics', 'payroll'], true),
  (uuid_generate_v4(), 'priya.patel@company.com', 'Priya Patel', 'Finance & Accounting', 'Accountant', 'accountant',
   ARRAY['approve_expenses', 'manage_budgets'], 
   ARRAY['finance-dashboard', 'dashboard', 'finance', 'expenses'], true),
  (uuid_generate_v4(), 'ahmed.hassan@company.com', 'Ahmed Hassan', 'Finance & Accounting', 'Accounts Officer', 'accountant',
   ARRAY['approve_expenses'], 
   ARRAY['finance-dashboard', 'dashboard', 'finance', 'expenses'], true),
  (uuid_generate_v4(), 'laura.chen@company.com', 'Laura Chen', 'Finance & Accounting', 'Finance Analyst', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'finance'], true),
  (uuid_generate_v4(), 'henry.davis@company.com', 'Henry Davis', 'Finance & Accounting', 'Accounts Assistant', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'finance'], true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  accessible_modules = EXCLUDED.accessible_modules;

-- ============================================
-- 3. ADMINISTRATION / OPERATIONS
-- ============================================
INSERT INTO public.user_profiles (id, email, full_name, department, position, role, permissions, accessible_modules, is_active)
VALUES 
  (uuid_generate_v4(), 'anthony.brown@company.com', 'Anthony Brown', 'Administration', 'Admin Head', 'dept_manager',
   ARRAY['manage_assets', 'manage_projects', 'approve_requests'], 
   ARRAY['manager-dashboard', 'dashboard', 'assets', 'projects', 'requests', 'analytics'], true),
  (uuid_generate_v4(), 'grace.lee@company.com', 'Grace Lee', 'Administration', 'Admin Officer', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'assets', 'projects'], true),
  (uuid_generate_v4(), 'carlos.gomez@company.com', 'Carlos Gomez', 'Administration', 'Operations Coordinator', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'projects'], true),
  (uuid_generate_v4(), 'megan.white@company.com', 'Megan White', 'Administration', 'Admin Assistant', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard'], true),
  (uuid_generate_v4(), 'raj.kumar@company.com', 'Raj Kumar', 'Administration', 'Office Support Staff', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard'], true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  accessible_modules = EXCLUDED.accessible_modules;

-- ============================================
-- 4. INFORMATION TECHNOLOGY (IT)
-- ============================================
INSERT INTO public.user_profiles (id, email, full_name, department, position, role, permissions, accessible_modules, is_active)
VALUES 
  (uuid_generate_v4(), 'jason.miller@company.com', 'Jason Miller', 'Information Technology', 'IT Manager', 'dept_manager',
   ARRAY['manage_assets', 'manage_projects', 'system_settings'], 
   ARRAY['it-dashboard', 'manager-dashboard', 'dashboard', 'assets', 'projects', 'requests', 'analytics', 'settings'], true),
  (uuid_generate_v4(), 'alice.wong@company.com', 'Alice Wong', 'Information Technology', 'IT Support Lead', 'employee',
   ARRAY['manage_assets'], 
   ARRAY['employee-portal', 'dashboard', 'assets', 'requests'], true),
  (uuid_generate_v4(), 'thomas.allen@company.com', 'Thomas Allen', 'Information Technology', 'Network Engineer', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'assets'], true),
  (uuid_generate_v4(), 'nia.rodriguez@company.com', 'Nia Rodriguez', 'Information Technology', 'System Admin', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'assets', 'settings'], true),
  (uuid_generate_v4(), 'peter.osei@company.com', 'Peter Osei', 'Information Technology', 'IT Technician', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'assets'], true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  accessible_modules = EXCLUDED.accessible_modules;

-- ============================================
-- 5. PROCUREMENT / PURCHASING
-- ============================================
INSERT INTO public.user_profiles (id, email, full_name, department, position, role, permissions, accessible_modules, is_active)
VALUES 
  (uuid_generate_v4(), 'maria.fernandez@company.com', 'Maria Fernandez', 'Procurement', 'Procurement Head', 'procurement_officer',
   ARRAY['manage_assets', 'approve_requests', 'manage_procurement'], 
   ARRAY['procurement-dashboard', 'dashboard', 'assets', 'requests', 'analytics'], true),
  (uuid_generate_v4(), 'victor.gomez@company.com', 'Victor Gomez', 'Procurement', 'Procurement Officer', 'procurement_officer',
   ARRAY['manage_assets', 'approve_requests'], 
   ARRAY['procurement-dashboard', 'dashboard', 'assets', 'requests'], true),
  (uuid_generate_v4(), 'zoe.adams@company.com', 'Zoe Adams', 'Procurement', 'Vendor Coordinator', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'assets'], true),
  (uuid_generate_v4(), 'ethan.clarke@company.com', 'Ethan Clarke', 'Procurement', 'Purchase Analyst', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'assets'], true),
  (uuid_generate_v4(), 'linda.zhao@company.com', 'Linda Zhao', 'Procurement', 'Procurement Assistant', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard'], true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  accessible_modules = EXCLUDED.accessible_modules;

-- ============================================
-- 6. FACILITIES & MAINTENANCE
-- ============================================
INSERT INTO public.user_profiles (id, email, full_name, department, position, role, permissions, accessible_modules, is_active)
VALUES 
  (uuid_generate_v4(), 'patrick.collins@company.com', 'Patrick Collins', 'Facilities & Maintenance', 'Facilities Head', 'facilities_manager',
   ARRAY['manage_assets', 'manage_projects'], 
   ARRAY['facilities-dashboard', 'dashboard', 'assets', 'projects', 'requests'], true),
  (uuid_generate_v4(), 'sonia.rivera@company.com', 'Sonia Rivera', 'Facilities & Maintenance', 'Maintenance Supervisor', 'employee',
   ARRAY['manage_assets'], 
   ARRAY['employee-portal', 'dashboard', 'assets', 'requests'], true),
  (uuid_generate_v4(), 'george.li@company.com', 'George Li', 'Facilities & Maintenance', 'Maintenance Technician', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'assets'], true),
  (uuid_generate_v4(), 'chloe.brown@company.com', 'Chloe Brown', 'Facilities & Maintenance', 'Scheduler', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'assets'], true),
  (uuid_generate_v4(), 'alex.novak@company.com', 'Alex Novak', 'Facilities & Maintenance', 'Custodian', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard'], true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  accessible_modules = EXCLUDED.accessible_modules;

-- ============================================
-- 7. LEGAL & COMPLIANCE
-- ============================================
INSERT INTO public.user_profiles (id, email, full_name, department, position, role, permissions, accessible_modules, is_active)
VALUES 
  (uuid_generate_v4(), 'laura.martinez@company.com', 'Laura Martinez', 'Legal & Compliance', 'Legal Officer', 'compliance_officer',
   ARRAY['audit_access', 'manage_compliance', 'view_analytics'], 
   ARRAY['dashboard', 'compliance', 'analytics'], true),
  (uuid_generate_v4(), 'david.green@company.com', 'David Green', 'Legal & Compliance', 'Compliance Officer', 'compliance_officer',
   ARRAY['audit_access', 'manage_compliance'], 
   ARRAY['dashboard', 'compliance'], true),
  (uuid_generate_v4(), 'anna.park@company.com', 'Anna Park', 'Legal & Compliance', 'Paralegal', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'compliance'], true),
  (uuid_generate_v4(), 'john.fraser@company.com', 'John Fraser', 'Legal & Compliance', 'Legal Analyst', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'compliance'], true),
  (uuid_generate_v4(), 'maya.desai@company.com', 'Maya Desai', 'Legal & Compliance', 'Legal Assistant', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard'], true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  accessible_modules = EXCLUDED.accessible_modules;

-- ============================================
-- 8. EXECUTIVE MANAGEMENT
-- ============================================
INSERT INTO public.user_profiles (id, email, full_name, department, position, role, permissions, accessible_modules, is_active)
VALUES 
  (uuid_generate_v4(), 'emma.williams@company.com', 'Emma Williams', 'Executive Management', 'CEO', 'super_admin',
   ARRAY['manage_all', 'manage_employees', 'manage_finance', 'manage_compliance', 'manage_settings', 'view_analytics', 'export_data', 'audit_access', 'system_settings'], 
   ARRAY['admin-dashboard', 'dashboard', 'employees', 'finance', 'leave', 'assets', 'requests', 'projects', 'analytics', 'payroll', 'training', 'recruitment', 'communication', 'compliance', 'search', 'bulkActions', 'notifications', 'settings'], true),
  (uuid_generate_v4(), 'benjamin.scott@company.com', 'Benjamin Scott', 'Executive Management', 'CFO', 'dept_manager',
   ARRAY['manage_finance', 'view_analytics', 'export_data', 'manage_budgets'], 
   ARRAY['executive-dashboard', 'manager-dashboard', 'finance-dashboard', 'dashboard', 'finance', 'expenses', 'analytics', 'payroll'], true),
  (uuid_generate_v4(), 'isabella.rossi@company.com', 'Isabella Rossi', 'Executive Management', 'COO', 'dept_manager',
   ARRAY['manage_projects', 'view_analytics', 'manage_employees'], 
   ARRAY['executive-dashboard', 'manager-dashboard', 'dashboard', 'employees', 'projects', 'analytics'], true),
  (uuid_generate_v4(), 'david.kim@company.com', 'David Kim', 'Executive Management', 'Executive Assistant', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'employees', 'projects'], true),
  (uuid_generate_v4(), 'olivia.jones@company.com', 'Olivia Jones', 'Executive Management', 'Strategy Analyst', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'projects', 'analytics'], true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  accessible_modules = EXCLUDED.accessible_modules;

-- ============================================
-- 9. PROJECT MANAGEMENT / PMO
-- ============================================
INSERT INTO public.user_profiles (id, email, full_name, department, position, role, permissions, accessible_modules, is_active)
VALUES 
  (uuid_generate_v4(), 'kevin.brooks@company.com', 'Kevin Brooks', 'Project Management', 'PMO Head', 'dept_manager',
   ARRAY['manage_projects', 'approve_requests', 'view_analytics'], 
   ARRAY['manager-dashboard', 'dashboard', 'projects', 'requests', 'analytics'], true),
  (uuid_generate_v4(), 'rachel.young@company.com', 'Rachel Young', 'Project Management', 'Project Manager', 'employee',
   ARRAY['manage_projects'], 
   ARRAY['employee-portal', 'dashboard', 'projects', 'requests'], true),
  (uuid_generate_v4(), 'mark.taylor@company.com', 'Mark Taylor', 'Project Management', 'Project Coordinator', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'projects'], true),
  (uuid_generate_v4(), 'hannah.reed@company.com', 'Hannah Reed', 'Project Management', 'Scheduler', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'projects'], true),
  (uuid_generate_v4(), 'brian.singh@company.com', 'Brian Singh', 'Project Management', 'PM Assistant', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard'], true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  accessible_modules = EXCLUDED.accessible_modules;

-- ============================================
-- 10. MARKETING & COMMUNICATIONS
-- ============================================
INSERT INTO public.user_profiles (id, email, full_name, department, position, role, permissions, accessible_modules, is_active)
VALUES 
  (uuid_generate_v4(), 'natalie.brown@company.com', 'Natalie Brown', 'Marketing & Communications', 'Marketing Head', 'dept_manager',
   ARRAY['manage_projects', 'manage_announcements'], 
   ARRAY['manager-dashboard', 'dashboard', 'projects', 'communication', 'analytics'], true),
  (uuid_generate_v4(), 'omar.ali@company.com', 'Omar Ali', 'Marketing & Communications', 'Communications Officer', 'employee',
   ARRAY['manage_announcements'], 
   ARRAY['employee-portal', 'dashboard', 'communication'], true),
  (uuid_generate_v4(), 'lisa.chen@company.com', 'Lisa Chen', 'Marketing & Communications', 'Marketing Designer', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'projects'], true),
  (uuid_generate_v4(), 'daniel.lee@company.com', 'Daniel Lee', 'Marketing & Communications', 'PR Specialist', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'communication'], true),
  (uuid_generate_v4(), 'grace.patel@company.com', 'Grace Patel', 'Marketing & Communications', 'Social Media Coordinator', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'communication'], true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  accessible_modules = EXCLUDED.accessible_modules;

-- ============================================
-- 11. TRAINING & DEVELOPMENT
-- ============================================
INSERT INTO public.user_profiles (id, email, full_name, department, position, role, permissions, accessible_modules, is_active)
VALUES 
  (uuid_generate_v4(), 'karen.roberts@company.com', 'Karen Roberts', 'Training & Development', 'L&D Head', 'dept_manager',
   ARRAY['manage_training', 'manage_employees'], 
   ARRAY['training-dashboard', 'manager-dashboard', 'dashboard', 'training', 'employees', 'analytics'], true),
  (uuid_generate_v4(), 'tim.evans@company.com', 'Tim Evans', 'Training & Development', 'Trainer', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'training-dashboard', 'dashboard', 'training'], true),
  (uuid_generate_v4(), 'sara.lopez@company.com', 'Sara Lopez', 'Training & Development', 'L&D Specialist', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'training'], true),
  (uuid_generate_v4(), 'william.carter@company.com', 'William Carter', 'Training & Development', 'Course Developer', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'training'], true),
  (uuid_generate_v4(), 'lily.nguyen@company.com', 'Lily Nguyen', 'Training & Development', 'Learning Assistant', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard'], true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  accessible_modules = EXCLUDED.accessible_modules;

-- ============================================
-- 12. CUSTOMER SUPPORT / CLIENT SERVICES
-- ============================================
INSERT INTO public.user_profiles (id, email, full_name, department, position, role, permissions, accessible_modules, is_active)
VALUES 
  (uuid_generate_v4(), 'jessica.morgan@company.com', 'Jessica Morgan', 'Customer Support', 'Support Manager', 'dept_manager',
   ARRAY['manage_projects', 'view_analytics'], 
   ARRAY['manager-dashboard', 'dashboard', 'projects', 'analytics'], true),
  (uuid_generate_v4(), 'jacob.ross@company.com', 'Jacob Ross', 'Customer Support', 'Support Agent', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'projects'], true),
  (uuid_generate_v4(), 'fatima.khan@company.com', 'Fatima Khan', 'Customer Support', 'Support Agent', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'projects'], true),
  (uuid_generate_v4(), 'noah.white@company.com', 'Noah White', 'Customer Support', 'QA Specialist', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'projects'], true),
  (uuid_generate_v4(), 'chloe.davis@company.com', 'Chloe Davis', 'Customer Support', 'Support Assistant', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard'], true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  accessible_modules = EXCLUDED.accessible_modules;

-- ============================================
-- 13. HEALTH, SAFETY & ENVIRONMENT (HSE)
-- ============================================
INSERT INTO public.user_profiles (id, email, full_name, department, position, role, permissions, accessible_modules, is_active)
VALUES 
  (uuid_generate_v4(), 'richard.adams@company.com', 'Richard Adams', 'Health, Safety & Environment', 'HSE Manager', 'hse_manager',
   ARRAY['audit_access', 'manage_compliance', 'view_analytics', 'manage_hse', 'view_safety_incidents', 'manage_inspections'], 
   ARRAY['manager-dashboard', 'dashboard', 'compliance', 'analytics'], true),
  (uuid_generate_v4(), 'stella.brown@company.com', 'Stella Brown', 'Health, Safety & Environment', 'Safety Officer', 'compliance_officer',
   ARRAY['audit_access', 'manage_compliance'], 
   ARRAY['dashboard', 'compliance'], true),
  (uuid_generate_v4(), 'ivan.petrov@company.com', 'Ivan Petrov', 'Health, Safety & Environment', 'Compliance Specialist', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'compliance'], true),
  (uuid_generate_v4(), 'julia.green@company.com', 'Julia Green', 'Health, Safety & Environment', 'Risk Analyst', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'compliance'], true),
  (uuid_generate_v4(), 'ethan.moore@company.com', 'Ethan Moore', 'Health, Safety & Environment', 'Safety Assistant', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard'], true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  accessible_modules = EXCLUDED.accessible_modules;

-- ============================================
-- 14. CSR / SUSTAINABILITY
-- ============================================
INSERT INTO public.user_profiles (id, email, full_name, department, position, role, permissions, accessible_modules, is_active)
VALUES 
  (uuid_generate_v4(), 'mia.hernandez@company.com', 'Mia Hernandez', 'CSR / Sustainability', 'CSR Manager', 'csr_manager',
   ARRAY['manage_projects', 'manage_announcements', 'view_analytics'], 
   ARRAY['manager-dashboard', 'dashboard', 'projects', 'communication', 'analytics'], true),
  (uuid_generate_v4(), 'jack.wilson@company.com', 'Jack Wilson', 'CSR / Sustainability', 'CSR Coordinator', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'projects'], true),
  (uuid_generate_v4(), 'sofia.lee@company.com', 'Sofia Lee', 'CSR / Sustainability', 'CSR Analyst', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'projects'], true),
  (uuid_generate_v4(), 'luke.parker@company.com', 'Luke Parker', 'CSR / Sustainability', 'CSR Officer', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'projects'], true),
  (uuid_generate_v4(), 'nora.ahmed@company.com', 'Nora Ahmed', 'CSR / Sustainability', 'CSR Assistant', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard'], true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  accessible_modules = EXCLUDED.accessible_modules;

-- ============================================
-- 15. SECURITY & ACCESS CONTROL
-- ============================================
INSERT INTO public.user_profiles (id, email, full_name, department, position, role, permissions, accessible_modules, is_active)
VALUES 
  (uuid_generate_v4(), 'samuel.carter@company.com', 'Samuel Carter', 'Security & Access Control', 'Security Head', 'security_manager',
   ARRAY['audit_access', 'system_settings', 'view_analytics'], 
   ARRAY['manager-dashboard', 'dashboard', 'compliance', 'analytics', 'settings'], true),
  (uuid_generate_v4(), 'ivan.lopez@company.com', 'Ivan Lopez', 'Security & Access Control', 'Security Officer', 'employee',
   ARRAY['audit_access'], 
   ARRAY['employee-portal', 'dashboard', 'compliance'], true),
  (uuid_generate_v4(), 'rachel.stone@company.com', 'Rachel Stone', 'Security & Access Control', 'Access Controller', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'compliance'], true),
  (uuid_generate_v4(), 'kevin.young@company.com', 'Kevin Young', 'Security & Access Control', 'Surveillance Operator', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard'], true),
  (uuid_generate_v4(), 'oscar.rivera@company.com', 'Oscar Rivera', 'Security & Access Control', 'Security Guard', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard'], true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  accessible_modules = EXCLUDED.accessible_modules;

-- ============================================
-- 16. RESEARCH & DEVELOPMENT (R&D)
-- ============================================
INSERT INTO public.user_profiles (id, email, full_name, department, position, role, permissions, accessible_modules, is_active)
VALUES 
  (uuid_generate_v4(), 'amelia.clark@company.com', 'Amelia Clark', 'Research & Development', 'R&D Head', 'rnd_manager',
   ARRAY['manage_projects', 'manage_assets', 'view_analytics'], 
   ARRAY['manager-dashboard', 'dashboard', 'projects', 'assets', 'analytics'], true),
  (uuid_generate_v4(), 'leo.murphy@company.com', 'Leo Murphy', 'Research & Development', 'Research Engineer', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'projects', 'assets'], true),
  (uuid_generate_v4(), 'harper.jones@company.com', 'Harper Jones', 'Research & Development', 'Data Scientist', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'projects', 'analytics'], true),
  (uuid_generate_v4(), 'oliver.brown@company.com', 'Oliver Brown', 'Research & Development', 'Lab Technician', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'assets'], true),
  (uuid_generate_v4(), 'eva.patel@company.com', 'Eva Patel', 'Research & Development', 'Research Assistant', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard'], true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  accessible_modules = EXCLUDED.accessible_modules;

-- ============================================
-- 17. EMPLOYEE WELLNESS & ENGAGEMENT
-- ============================================
INSERT INTO public.user_profiles (id, email, full_name, department, position, role, permissions, accessible_modules, is_active)
VALUES 
  (uuid_generate_v4(), 'michelle.davis@company.com', 'Michelle Davis', 'Employee Wellness & Engagement', 'Wellness Manager', 'wellness_manager',
   ARRAY['manage_employees', 'manage_announcements'], 
   ARRAY['manager-dashboard', 'dashboard', 'employees', 'communication', 'training'], true),
  (uuid_generate_v4(), 'ryan.chen@company.com', 'Ryan Chen', 'Employee Wellness & Engagement', 'Wellness Coordinator', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'communication'], true),
  (uuid_generate_v4(), 'zoe.turner@company.com', 'Zoe Turner', 'Employee Wellness & Engagement', 'HR Liaison', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'employees'], true),
  (uuid_generate_v4(), 'dylan.scott@company.com', 'Dylan Scott', 'Employee Wellness & Engagement', 'Event Planner', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard', 'communication'], true),
  (uuid_generate_v4(), 'ava.reed@company.com', 'Ava Reed', 'Employee Wellness & Engagement', 'Wellness Assistant', 'employee',
   ARRAY[]::TEXT[], 
   ARRAY['employee-portal', 'dashboard'], true)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  accessible_modules = EXCLUDED.accessible_modules;

-- ============================================
-- CREATE EMPLOYEES TABLE RECORDS
-- ============================================
-- Link employees to user_profiles and create employee records with complete HR data
-- Note: This uses the enhanced employees table schema with full employee details
INSERT INTO public.employees (
  user_id, name, email, department, role, status, join_date, 
  phone, address, emergency_contact,
  -- Enhanced fields
  employee_number, first_name, last_name, 
  mobile_phone, work_phone, city, state_province, postal_code, country,
  emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
  position, employment_type, work_location, base_salary, salary_currency, pay_frequency,
  date_of_birth, gender, marital_status, nationality
)
SELECT 
  id as user_id,
  full_name as name,
  email,
  department,
  position as role,
  'Active' as status,
  CURRENT_DATE - INTERVAL '1 year' * (RANDOM() * 3 + 1) as join_date, -- Random join date within last 4 years
  
  -- Basic contact info
  '+1-' || LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0') || '-' || 
  LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0') || '-' || 
  LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') as phone,
  
  -- Address components
  CASE 
    WHEN (ABS(HASHTEXT(email)) % 5) = 0 THEN '123 Main Street, Suite ' || (ABS(HASHTEXT(email)) % 100 + 1)
    WHEN (ABS(HASHTEXT(email)) % 5) = 1 THEN '456 Oak Avenue, Apt ' || (ABS(HASHTEXT(email)) % 50 + 1)
    WHEN (ABS(HASHTEXT(email)) % 5) = 2 THEN '789 Pine Road, Unit ' || (ABS(HASHTEXT(email)) % 30 + 1)
    WHEN (ABS(HASHTEXT(email)) % 5) = 3 THEN '321 Elm Street, Floor ' || (ABS(HASHTEXT(email)) % 10 + 1)
    ELSE '555 Maple Drive, #' || (ABS(HASHTEXT(email)) % 25 + 1)
  END as address,
  
  -- Legacy emergency contact (for backward compatibility)
  CASE 
    WHEN (ABS(HASHTEXT(email)) % 3) = 0 THEN 'Spouse: ' || 
      CASE 
        WHEN full_name LIKE '% %' THEN SPLIT_PART(full_name, ' ', 1) || ' ' || SPLIT_PART(full_name, ' ', 2) || ' - +1-' || 
          LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0') || '-' || 
          LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0') || '-' || 
          LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
        ELSE full_name || ' - +1-555-123-4567'
      END
    WHEN (ABS(HASHTEXT(email)) % 3) = 1 THEN 'Parent: ' || 
      CASE 
        WHEN full_name LIKE '% %' THEN 'Mr./Mrs. ' || SPLIT_PART(full_name, ' ', 2) || ' - +1-' || 
          LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0') || '-' || 
          LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0') || '-' || 
          LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
        ELSE full_name || ' - +1-555-123-4567'
      END
    ELSE 'Emergency Contact: ' || full_name || ' - +1-' || 
      LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0') || '-' || 
      LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0') || '-' || 
      LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
  END as emergency_contact,
  
  -- Enhanced fields
  'EMP-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 6, '0') as employee_number,
  CASE 
    WHEN full_name LIKE '% %' THEN SPLIT_PART(full_name, ' ', 1)
    ELSE full_name
  END as first_name,
  CASE 
    WHEN full_name LIKE '% %' THEN SPLIT_PART(full_name, ' ', array_length(string_to_array(full_name, ' '), 1))
    ELSE ''
  END as last_name,
  
  -- Phone numbers
  '+1-' || LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0') || '-' || 
  LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0') || '-' || 
  LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') as mobile_phone,
  '+1-' || LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0') || '-' || 
  LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0') || '-' || 
  LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') as work_phone,
  
  -- Address components
  CASE 
    WHEN (ABS(HASHTEXT(email)) % 5) = 0 THEN 'New York'
    WHEN (ABS(HASHTEXT(email)) % 5) = 1 THEN 'Los Angeles'
    WHEN (ABS(HASHTEXT(email)) % 5) = 2 THEN 'Chicago'
    WHEN (ABS(HASHTEXT(email)) % 5) = 3 THEN 'Houston'
    ELSE 'Phoenix'
  END as city,
  CASE 
    WHEN (ABS(HASHTEXT(email)) % 5) = 0 THEN 'NY'
    WHEN (ABS(HASHTEXT(email)) % 5) = 1 THEN 'CA'
    WHEN (ABS(HASHTEXT(email)) % 5) = 2 THEN 'IL'
    WHEN (ABS(HASHTEXT(email)) % 5) = 3 THEN 'TX'
    ELSE 'AZ'
  END as state_province,
  CASE 
    WHEN (ABS(HASHTEXT(email)) % 5) = 0 THEN '10001'
    WHEN (ABS(HASHTEXT(email)) % 5) = 1 THEN '90001'
    WHEN (ABS(HASHTEXT(email)) % 5) = 2 THEN '60601'
    WHEN (ABS(HASHTEXT(email)) % 5) = 3 THEN '77001'
    ELSE '85001'
  END as postal_code,
  'USA' as country,
  
  -- Emergency contact details
  CASE 
    WHEN (ABS(HASHTEXT(email)) % 3) = 0 THEN 
      CASE 
        WHEN full_name LIKE '% %' THEN SPLIT_PART(full_name, ' ', 1) || ' ' || SPLIT_PART(full_name, ' ', 2)
        ELSE full_name
      END
    WHEN (ABS(HASHTEXT(email)) % 3) = 1 THEN 
      CASE 
        WHEN full_name LIKE '% %' THEN 'Mr./Mrs. ' || SPLIT_PART(full_name, ' ', 2)
        ELSE full_name
      END
    ELSE full_name
  END as emergency_contact_name,
  CASE 
    WHEN (ABS(HASHTEXT(email)) % 3) = 0 THEN 'Spouse'
    WHEN (ABS(HASHTEXT(email)) % 3) = 1 THEN 'Parent'
    ELSE 'Relative'
  END as emergency_contact_relationship,
  '+1-' || LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0') || '-' || 
  LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0') || '-' || 
  LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') as emergency_contact_phone,
  
  -- Employment details
  position as position,
  CASE 
    WHEN (ABS(HASHTEXT(email)) % 10) < 8 THEN 'Full-time'
    WHEN (ABS(HASHTEXT(email)) % 10) = 8 THEN 'Part-time'
    ELSE 'Contract'
  END as employment_type,
  CASE 
    WHEN (ABS(HASHTEXT(email)) % 3) = 0 THEN 'Office'
    WHEN (ABS(HASHTEXT(email)) % 3) = 1 THEN 'Remote'
    ELSE 'Hybrid'
  END as work_location,
  
  -- Compensation (randomized based on role)
  CASE 
    WHEN position LIKE '%Director%' OR position LIKE '%Head%' THEN 120000 + (RANDOM() * 80000)::INTEGER
    WHEN position LIKE '%Manager%' THEN 80000 + (RANDOM() * 40000)::INTEGER
    WHEN position LIKE '%Senior%' THEN 70000 + (RANDOM() * 30000)::INTEGER
    WHEN position LIKE '%Lead%' THEN 75000 + (RANDOM() * 25000)::INTEGER
    ELSE 50000 + (RANDOM() * 30000)::INTEGER
  END as base_salary,
  'USD' as salary_currency,
  'monthly' as pay_frequency,
  
  -- Personal details
  DATE '1980-01-01' + (RANDOM() * (DATE '2000-01-01' - DATE '1980-01-01'))::INTEGER as date_of_birth,
  CASE 
    WHEN (ABS(HASHTEXT(email)) % 3) = 0 THEN 'Male'
    WHEN (ABS(HASHTEXT(email)) % 3) = 1 THEN 'Female'
    ELSE 'Other'
  END as gender,
  CASE 
    WHEN (ABS(HASHTEXT(email)) % 4) = 0 THEN 'Single'
    WHEN (ABS(HASHTEXT(email)) % 4) = 1 THEN 'Married'
    WHEN (ABS(HASHTEXT(email)) % 4) = 2 THEN 'Divorced'
    ELSE 'Other'
  END as marital_status,
  'United States' as nationality
  
FROM public.user_profiles
WHERE email LIKE '%@company.com'
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  emergency_contact = EXCLUDED.emergency_contact,
  -- Update enhanced fields if they don't exist
  first_name = COALESCE(employees.first_name, EXCLUDED.first_name),
  last_name = COALESCE(employees.last_name, EXCLUDED.last_name),
  employee_number = COALESCE(employees.employee_number, EXCLUDED.employee_number),
  position = COALESCE(employees.position, EXCLUDED.position),
  employment_type = COALESCE(employees.employment_type, EXCLUDED.employment_type);

-- ============================================
-- CREATE LEAVE BALANCES FOR ALL EMPLOYEES
-- ============================================
INSERT INTO public.leave_balances (employee_id, vacation_days, sick_days, personal_days, year)
SELECT 
  e.id,
  20 as vacation_days,
  10 as sick_days,
  5 as personal_days,
  EXTRACT(YEAR FROM CURRENT_DATE) as year
FROM public.employees e
WHERE e.status = 'Active'
ON CONFLICT (employee_id, year) DO NOTHING;

-- ============================================
-- SUMMARY
-- ============================================
-- Total Users Created: 85
-- Departments: 17
-- Default Password: AdminOS@2025
-- Note: Auth users must be created via Supabase Admin API or Dashboard
--       This script creates user_profiles and employees records
-- ============================================

-- Display summary
DO $$
DECLARE
  v_total_users INTEGER;
  v_total_employees INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM public.user_profiles WHERE email LIKE '%@company.com';
  SELECT COUNT(*) INTO v_total_employees FROM public.employees WHERE email LIKE '%@company.com';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User Seeding Complete!';
  RAISE NOTICE 'Total User Profiles: %', v_total_users;
  RAISE NOTICE 'Total Employee Records: %', v_total_employees;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Create auth users in Supabase Auth (via Admin API or Dashboard)';
  RAISE NOTICE '2. Update user_profiles.id to match auth.users.id';
  RAISE NOTICE '3. Default password: AdminOS@2025';
  RAISE NOTICE '4. Users must change password on first login';
  RAISE NOTICE '========================================';
END $$;

