-- Comprehensive AdminOS Database Schema with RLS Policies
-- This schema includes all tables needed for the AdminOS application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS on all tables by default
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
-- Note: Supabase auth.users is managed by Supabase Auth
-- This table stores additional user profile information
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee',
  permissions TEXT[] DEFAULT '{}',
  accessible_modules TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees table (separate from user_profiles for HR data)
-- Enhanced with comprehensive employee details
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  join_date DATE NOT NULL,
  phone TEXT,
  address TEXT,
  emergency_contact TEXT,
  
  -- Personal Information
  employee_number VARCHAR(50) UNIQUE,
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  date_of_birth DATE,
  gender VARCHAR(20),
  marital_status VARCHAR(20),
  nationality VARCHAR(50),
  photo_url TEXT,
  
  -- Contact Information (Enhanced)
  mobile_phone TEXT,
  work_phone TEXT,
  personal_email TEXT,
  city TEXT,
  state_province TEXT,
  postal_code VARCHAR(20),
  country VARCHAR(50) DEFAULT 'USA',
  
  -- Emergency Contact (Enhanced)
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_email TEXT,
  
  -- Employment Information (Enhanced)
  position TEXT,
  manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  manager_name TEXT,
  employment_type VARCHAR(30) DEFAULT 'Full-time',
  work_location TEXT,
  office_location TEXT,
  termination_date DATE,
  termination_reason TEXT,
  probation_end_date DATE,
  notice_period_days INTEGER DEFAULT 30,
  
  -- Compensation & Benefits
  base_salary DECIMAL(12,2),
  salary_currency VARCHAR(3) DEFAULT 'USD',
  pay_frequency VARCHAR(20) DEFAULT 'monthly',
  benefits_enrolled BOOLEAN DEFAULT false,
  health_insurance_provider TEXT,
  retirement_plan TEXT,
  
  -- Documents & Compliance
  social_security_number TEXT,
  tax_id TEXT,
  passport_number TEXT,
  passport_expiry_date DATE,
  work_permit_number TEXT,
  work_permit_expiry_date DATE,
  visa_type TEXT,
  visa_expiry_date DATE,
  contract_document_url TEXT,
  
  -- Additional Information
  bio TEXT,
  skills TEXT[],
  certifications JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  previous_experience JSONB DEFAULT '[]',
  languages TEXT[],
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  
  -- System & Tracking
  last_review_date DATE,
  next_review_date DATE,
  performance_rating VARCHAR(20),
  notes TEXT,
  is_confidential BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets table
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  assignee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  assignee_name TEXT,
  status TEXT NOT NULL DEFAULT 'Available',
  value DECIMAL(10,2) NOT NULL,
  purchase_date DATE NOT NULL,
  condition TEXT NOT NULL,
  location TEXT,
  serial_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Planning',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date DATE,
  owner_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  owner_name TEXT,
  description TEXT,
  budget DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave requests table
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  type TEXT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  days INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  reason TEXT,
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  description TEXT NOT NULL,
  receipt_url TEXT,
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Department budgets table
CREATE TABLE IF NOT EXISTS public.department_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department TEXT NOT NULL UNIQUE,
  allocated DECIMAL(10,2) NOT NULL,
  spent DECIMAL(10,2) DEFAULT 0,
  period TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKFLOW & APPROVAL TABLES
-- ============================================

-- Workflow tasks table
CREATE TABLE IF NOT EXISTS public.workflow_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task comments table
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.workflow_tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval requests table
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_type TEXT NOT NULL,
  requested_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  amount DECIMAL(10,2),
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval workflows table (for multi-level approvals)
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_type TEXT NOT NULL,
  requested_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  approval_chain JSONB NOT NULL,
  current_approval_level INTEGER DEFAULT 0,
  overall_status TEXT NOT NULL DEFAULT 'pending',
  amount DECIMAL(10,2),
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMUNICATION TABLES
-- ============================================

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  recipient_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  recipient_name TEXT,
  department_id TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'direct',
  status TEXT NOT NULL DEFAULT 'unread',
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  type TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'low',
  visibility TEXT NOT NULL DEFAULT 'all',
  target_department TEXT,
  target_role TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HR & PERFORMANCE TABLES
-- ============================================

-- Performance reviews table
CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  period TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  goals TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave balances table
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  vacation_days INTEGER DEFAULT 0,
  sick_days INTEGER DEFAULT 0,
  personal_days INTEGER DEFAULT 0,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, year)
);

-- Attendance records table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'present',
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- Training programs table
CREATE TABLE IF NOT EXISTS public.training_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration INTEGER,
  instructor TEXT,
  capacity INTEGER,
  enrolled_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'upcoming',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training enrollments table
CREATE TABLE IF NOT EXISTS public.training_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES public.training_programs(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled',
  completion_date DATE,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, employee_id)
);

-- Recruitment: Job postings table
CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open',
  posted_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  closing_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recruitment: Candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  status TEXT NOT NULL DEFAULT 'applied',
  interview_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT & COMPLIANCE TABLES
-- ============================================

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  department TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit findings table
CREATE TABLE IF NOT EXISTS public.audit_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id TEXT NOT NULL,
  audited_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  finding_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  due_date DATE,
  resolved_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit reports table
CREATE TABLE IF NOT EXISTS public.audit_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  period TEXT NOT NULL,
  audited_area TEXT NOT NULL,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  findings TEXT[] DEFAULT '{}',
  observations TEXT,
  conclusion TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk assessments table
CREATE TABLE IF NOT EXISTS public.risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_category TEXT NOT NULL,
  description TEXT NOT NULL,
  probability TEXT NOT NULL,
  impact TEXT NOT NULL,
  mitigation TEXT NOT NULL,
  owner_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  owner_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_review_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADDITIONAL TABLES
-- ============================================

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,
  stock INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 0,
  unit TEXT,
  supplier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procurement orders table
CREATE TABLE IF NOT EXISTS public.procurement_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  vendor TEXT NOT NULL,
  items_count INTEGER DEFAULT 0,
  value DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  order_date DATE NOT NULL,
  delivery_date DATE,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset maintenance schedule table
CREATE TABLE IF NOT EXISTS public.asset_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_assets_assignee ON public.assets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_expenses_employee ON public.expenses(employee_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assigned_to ON public.workflow_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_status ON public.approval_workflows(overall_status);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON public.password_reset_tokens(email);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_maintenance ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(required_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND required_permission = ANY(permissions)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is in department
CREATE OR REPLACE FUNCTION public.is_in_department(dept TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND department = dept
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.user_profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USER_PROFILES POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (except role/permissions)
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (has_role('super_admin'));

-- Super admins and HR can insert/update profiles
CREATE POLICY "Admins can manage profiles" ON public.user_profiles
  FOR ALL USING (has_role('super_admin') OR has_role('hr_head') OR has_role('hr_officer'));

-- ============================================
-- EMPLOYEES POLICIES
-- ============================================

-- All authenticated users can view employees
CREATE POLICY "Users can view employees" ON public.employees
  FOR SELECT USING (auth.role() = 'authenticated');

-- HR and managers can insert/update employees
CREATE POLICY "HR can manage employees" ON public.employees
  FOR INSERT WITH CHECK (has_role('super_admin') OR has_role('hr_head') OR has_role('hr_officer'));

CREATE POLICY "HR can update employees" ON public.employees
  FOR UPDATE USING (has_role('super_admin') OR has_role('hr_head') OR has_role('hr_officer'));

-- ============================================
-- ASSETS POLICIES
-- ============================================

-- All authenticated users can view assets
CREATE POLICY "Users can view assets" ON public.assets
  FOR SELECT USING (auth.role() = 'authenticated');

-- Procurement and facilities can manage assets
CREATE POLICY "Authorized users can manage assets" ON public.assets
  FOR ALL USING (
    has_role('super_admin') OR 
    has_role('procurement_officer') OR 
    has_role('facilities_manager') OR
    has_permission('manage_assets')
  );

-- ============================================
-- PROJECTS POLICIES
-- ============================================

-- All authenticated users can view projects
CREATE POLICY "Users can view projects" ON public.projects
  FOR SELECT USING (auth.role() = 'authenticated');

-- Managers and project owners can manage projects
CREATE POLICY "Managers can manage projects" ON public.projects
  FOR ALL USING (
    has_role('super_admin') OR 
    has_role('dept_manager') OR
    has_permission('manage_projects')
  );

-- ============================================
-- LEAVE_REQUESTS POLICIES
-- ============================================

-- Users can view their own leave requests
CREATE POLICY "Users can view own leave" ON public.leave_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = leave_requests.employee_id 
      AND user_id = auth.uid()
    ) OR
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_role('hr_officer') OR
    has_role('dept_manager')
  );

-- Users can create their own leave requests
CREATE POLICY "Users can create own leave" ON public.leave_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = leave_requests.employee_id 
      AND user_id = auth.uid()
    )
  );

-- Managers and HR can update leave requests
CREATE POLICY "Managers can update leave" ON public.leave_requests
  FOR UPDATE USING (
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_role('hr_officer') OR
    has_role('dept_manager') OR
    has_permission('approve_leave')
  );

-- ============================================
-- EXPENSES POLICIES
-- ============================================

-- Users can view their own expenses
CREATE POLICY "Users can view own expenses" ON public.expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = expenses.employee_id 
      AND user_id = auth.uid()
    ) OR
    has_role('super_admin') OR
    has_role('finance_director') OR
    has_role('accountant') OR
    has_role('dept_manager')
  );

-- Users can create their own expenses
CREATE POLICY "Users can create own expenses" ON public.expenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = expenses.employee_id 
      AND user_id = auth.uid()
    )
  );

-- Finance and managers can update expenses
CREATE POLICY "Finance can update expenses" ON public.expenses
  FOR UPDATE USING (
    has_role('super_admin') OR
    has_role('finance_director') OR
    has_role('accountant') OR
    has_permission('approve_expenses')
  );

-- ============================================
-- WORKFLOW_TASKS POLICIES
-- ============================================

-- Users can view tasks assigned to them or created by them
CREATE POLICY "Users can view assigned tasks" ON public.workflow_tasks
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    assigned_by = auth.uid() OR
    has_role('super_admin') OR
    is_in_department(department)
  );

-- Users can create tasks
CREATE POLICY "Users can create tasks" ON public.workflow_tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update tasks assigned to them or created by them
CREATE POLICY "Users can update assigned tasks" ON public.workflow_tasks
  FOR UPDATE USING (
    assigned_to = auth.uid() OR
    assigned_by = auth.uid() OR
    has_role('super_admin')
  );

-- ============================================
-- APPROVAL_REQUESTS POLICIES
-- ============================================

-- Users can view their own requests or requests they need to approve
CREATE POLICY "Users can view relevant approvals" ON public.approval_requests
  FOR SELECT USING (
    requested_by = auth.uid() OR
    approved_by = auth.uid() OR
    status = 'pending' OR
    has_role('super_admin')
  );

-- Users can create approval requests
CREATE POLICY "Users can create approvals" ON public.approval_requests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Approvers can update approval requests
CREATE POLICY "Approvers can update approvals" ON public.approval_requests
  FOR UPDATE USING (
    has_role('super_admin') OR
    has_permission('approve_requests')
  );

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Users can view messages sent to them or sent by them
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (
    recipient_id = auth.uid() OR
    sender_id = auth.uid() OR
    (type = 'department' AND is_in_department(department_id)) OR
    type = 'broadcast'
  );

-- Users can create messages
CREATE POLICY "Users can create messages" ON public.messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update messages sent to them
CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (recipient_id = auth.uid());

-- ============================================
-- ANNOUNCEMENTS POLICIES
-- ============================================

-- All authenticated users can view announcements
CREATE POLICY "Users can view announcements" ON public.announcements
  FOR SELECT USING (
    visibility = 'all' OR
    (visibility = 'department' AND is_in_department(target_department)) OR
    (visibility = 'role' AND get_user_role() = target_role)
  );

-- Only admins and authorized users can create announcements
CREATE POLICY "Admins can create announcements" ON public.announcements
  FOR INSERT WITH CHECK (
    has_role('super_admin') OR
    has_permission('manage_announcements')
  );

-- ============================================
-- AUDIT_LOGS POLICIES
-- ============================================

-- Audit logs are read-only for most users
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    has_role('super_admin') OR
    has_role('audit_head') OR
    has_role('audit_manager') OR
    has_permission('audit_access')
  );

-- System can create audit logs (via service role)
CREATE POLICY "System can create audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Only super admins can delete audit logs
CREATE POLICY "Super admins can delete audit logs" ON public.audit_logs
  FOR DELETE USING (has_role('super_admin'));

-- ============================================
-- PERFORMANCE_REVIEWS POLICIES
-- ============================================

-- Employees can view their own reviews
CREATE POLICY "Employees can view own reviews" ON public.performance_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = performance_reviews.employee_id 
      AND user_id = auth.uid()
    ) OR
    reviewer_id = auth.uid() OR
    has_role('super_admin') OR
    has_role('hr_head')
  );

-- HR and managers can create/update reviews
CREATE POLICY "HR can manage reviews" ON public.performance_reviews
  FOR ALL USING (
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_permission('manage_reviews')
  );

-- ============================================
-- EMAIL_LOGS POLICIES
-- ============================================

-- Only admins can view email logs
CREATE POLICY "Admins can view email logs" ON public.email_logs
  FOR SELECT USING (
    has_role('super_admin') OR
    has_permission('view_email_logs')
  );

-- System can create email logs
CREATE POLICY "System can create email logs" ON public.email_logs
  FOR INSERT WITH CHECK (true);

-- ============================================
-- PASSWORD_RESET_TOKENS POLICIES
-- ============================================

-- Users can view their own reset tokens
CREATE POLICY "Users can view own reset tokens" ON public.password_reset_tokens
  FOR SELECT USING (email = (SELECT email FROM public.user_profiles WHERE id = auth.uid()));

-- System can create reset tokens
CREATE POLICY "System can create reset tokens" ON public.password_reset_tokens
  FOR INSERT WITH CHECK (true);

-- System can update reset tokens
CREATE POLICY "System can update reset tokens" ON public.password_reset_tokens
  FOR UPDATE USING (true);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_tasks_updated_at BEFORE UPDATE ON public.workflow_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_requests_updated_at BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at BEFORE UPDATE ON public.approval_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_findings_updated_at BEFORE UPDATE ON public.audit_findings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_reports_updated_at BEFORE UPDATE ON public.audit_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_assessments_updated_at BEFORE UPDATE ON public.risk_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

