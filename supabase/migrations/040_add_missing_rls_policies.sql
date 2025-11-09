-- ============================================
-- ADD MISSING RLS POLICIES
-- ============================================
-- This migration adds RLS policies for tables that have RLS enabled
-- but no policies defined, addressing security linter warnings
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

-- ============================================
-- 1. APPROVAL WORKFLOWS
-- ============================================

-- Users can view workflows they created or are part of the approval chain
DROP POLICY IF EXISTS "Users can view own approval workflows" ON public.approval_workflows;
CREATE POLICY "Users can view own approval workflows" ON public.approval_workflows
  FOR SELECT
  USING (
    requested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('dept_manager', 'super_admin', 'finance_manager', 'hr_manager')
        OR department IN ('Finance', 'Human Resources', 'Administration'))
    )
  );

-- Managers and admins can manage all workflows
DROP POLICY IF EXISTS "Managers can manage approval workflows" ON public.approval_workflows;
CREATE POLICY "Managers can manage approval workflows" ON public.approval_workflows
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('dept_manager', 'super_admin', 'finance_manager', 'hr_manager')
        OR department IN ('Finance', 'Human Resources', 'Administration'))
    )
  );

-- Users can create workflows
DROP POLICY IF EXISTS "Users can create approval workflows" ON public.approval_workflows;
CREATE POLICY "Users can create approval workflows" ON public.approval_workflows
  FOR INSERT
  WITH CHECK (requested_by = auth.uid());

-- ============================================
-- 2. ASSET MAINTENANCE
-- ============================================

-- Operations and asset managers can view all maintenance records
DROP POLICY IF EXISTS "Operations can view asset maintenance" ON public.asset_maintenance;
CREATE POLICY "Operations can view asset maintenance" ON public.asset_maintenance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('operations_manager', 'dept_manager', 'super_admin', 'facilities_manager')
        OR department IN ('Operations', 'Facilities Management', 'Administration'))
    )
    OR EXISTS (
      SELECT 1 FROM public.assets a
      WHERE a.id = asset_maintenance.asset_id
      AND a.assignee_id = auth.uid()
    )
  );

-- Operations can manage maintenance records
DROP POLICY IF EXISTS "Operations can manage asset maintenance" ON public.asset_maintenance;
CREATE POLICY "Operations can manage asset maintenance" ON public.asset_maintenance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('operations_manager', 'dept_manager', 'super_admin', 'facilities_manager')
        OR department IN ('Operations', 'Facilities Management', 'Administration'))
    )
  );

-- ============================================
-- 3. ATTENDANCE RECORDS
-- ============================================

-- Employees can view their own attendance
DROP POLICY IF EXISTS "Employees can view own attendance" ON public.attendance_records;
CREATE POLICY "Employees can view own attendance" ON public.attendance_records
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('hr_manager', 'dept_manager', 'super_admin')
        OR department = 'Human Resources')
    )
  );

-- HR and managers can manage attendance
DROP POLICY IF EXISTS "HR can manage attendance records" ON public.attendance_records;
CREATE POLICY "HR can manage attendance records" ON public.attendance_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('hr_manager', 'dept_manager', 'super_admin')
        OR department = 'Human Resources')
    )
  );

-- ============================================
-- 4. AUDIT FINDINGS
-- ============================================

-- Audit team and executives can view findings
DROP POLICY IF EXISTS "Audit team can view findings" ON public.audit_findings;
CREATE POLICY "Audit team can view findings" ON public.audit_findings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('audit_manager', 'compliance_manager', 'dept_manager', 'super_admin', 'executive')
        OR department IN ('Internal Audit', 'Legal & Compliance', 'Executive'))
    )
  );

-- Audit team can manage findings
DROP POLICY IF EXISTS "Audit team can manage findings" ON public.audit_findings;
CREATE POLICY "Audit team can manage findings" ON public.audit_findings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('audit_manager', 'compliance_manager', 'dept_manager', 'super_admin')
        OR department IN ('Internal Audit', 'Legal & Compliance'))
    )
  );

-- ============================================
-- 5. AUDIT REPORTS
-- ============================================

-- Audit team and executives can view reports
DROP POLICY IF EXISTS "Audit team can view reports" ON public.audit_reports;
CREATE POLICY "Audit team can view reports" ON public.audit_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('audit_manager', 'compliance_manager', 'dept_manager', 'super_admin', 'executive')
        OR department IN ('Internal Audit', 'Legal & Compliance', 'Executive'))
    )
  );

-- Audit team can manage reports
DROP POLICY IF EXISTS "Audit team can manage reports" ON public.audit_reports;
CREATE POLICY "Audit team can manage reports" ON public.audit_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('audit_manager', 'compliance_manager', 'dept_manager', 'super_admin')
        OR department IN ('Internal Audit', 'Legal & Compliance'))
    )
  );

-- ============================================
-- 6. CANDIDATES
-- ============================================

-- HR and hiring managers can view candidates
DROP POLICY IF EXISTS "HR can view candidates" ON public.candidates;
CREATE POLICY "HR can view candidates" ON public.candidates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('hr_manager', 'dept_manager', 'super_admin', 'hiring_manager')
        OR department = 'Human Resources')
    )
  );

-- HR can manage candidates
DROP POLICY IF EXISTS "HR can manage candidates" ON public.candidates;
CREATE POLICY "HR can manage candidates" ON public.candidates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('hr_manager', 'dept_manager', 'super_admin', 'hiring_manager')
        OR department = 'Human Resources')
    )
  );

-- ============================================
-- 7. DEPARTMENT BUDGETS
-- ============================================

-- Finance and department managers can view budgets
DROP POLICY IF EXISTS "Finance can view department budgets" ON public.department_budgets;
CREATE POLICY "Finance can view department budgets" ON public.department_budgets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('finance_manager', 'dept_manager', 'super_admin', 'executive')
        OR department IN ('Finance', 'Executive'))
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND department = department_budgets.department
      AND role IN ('dept_manager', 'super_admin')
    )
  );

-- Finance can manage budgets
DROP POLICY IF EXISTS "Finance can manage department budgets" ON public.department_budgets;
CREATE POLICY "Finance can manage department budgets" ON public.department_budgets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('finance_manager', 'dept_manager', 'super_admin')
        OR department = 'Finance')
    )
  );

-- ============================================
-- 8. INVENTORY ITEMS
-- ============================================

-- Procurement and operations can view inventory
DROP POLICY IF EXISTS "Procurement can view inventory" ON public.inventory_items;
CREATE POLICY "Procurement can view inventory" ON public.inventory_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('procurement_manager', 'operations_manager', 'dept_manager', 'super_admin')
        OR department IN ('Procurement', 'Operations', 'Administration'))
    )
  );

-- Procurement can manage inventory
DROP POLICY IF EXISTS "Procurement can manage inventory" ON public.inventory_items;
CREATE POLICY "Procurement can manage inventory" ON public.inventory_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('procurement_manager', 'operations_manager', 'dept_manager', 'super_admin')
        OR department IN ('Procurement', 'Operations', 'Administration'))
    )
  );

-- ============================================
-- 9. JOB POSTINGS
-- ============================================

-- All authenticated users can view open job postings
DROP POLICY IF EXISTS "Users can view job postings" ON public.job_postings;
CREATE POLICY "Users can view job postings" ON public.job_postings
  FOR SELECT
  USING (
    status = 'open'
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('hr_manager', 'dept_manager', 'super_admin', 'hiring_manager')
        OR department = 'Human Resources')
    )
  );

-- HR can manage job postings
DROP POLICY IF EXISTS "HR can manage job postings" ON public.job_postings;
CREATE POLICY "HR can manage job postings" ON public.job_postings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('hr_manager', 'dept_manager', 'super_admin', 'hiring_manager')
        OR department = 'Human Resources')
    )
  );

-- ============================================
-- 10. LEAVE BALANCES
-- ============================================

-- Employees can view their own leave balances
DROP POLICY IF EXISTS "Employees can view own leave balances" ON public.leave_balances;
CREATE POLICY "Employees can view own leave balances" ON public.leave_balances
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('hr_manager', 'dept_manager', 'super_admin')
        OR department = 'Human Resources')
    )
  );

-- HR can manage leave balances
DROP POLICY IF EXISTS "HR can manage leave balances" ON public.leave_balances;
CREATE POLICY "HR can manage leave balances" ON public.leave_balances
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('hr_manager', 'dept_manager', 'super_admin')
        OR department = 'Human Resources')
    )
  );

-- ============================================
-- 11. PROCUREMENT ORDERS
-- ============================================

-- Procurement and finance can view orders
DROP POLICY IF EXISTS "Procurement can view orders" ON public.procurement_orders;
CREATE POLICY "Procurement can view orders" ON public.procurement_orders
  FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('procurement_manager', 'finance_manager', 'dept_manager', 'super_admin')
        OR department IN ('Procurement', 'Finance', 'Administration'))
    )
  );

-- Procurement can manage orders
DROP POLICY IF EXISTS "Procurement can manage orders" ON public.procurement_orders;
CREATE POLICY "Procurement can manage orders" ON public.procurement_orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('procurement_manager', 'finance_manager', 'dept_manager', 'super_admin')
        OR department IN ('Procurement', 'Finance', 'Administration'))
    )
  );

-- Users can create orders
DROP POLICY IF EXISTS "Users can create procurement orders" ON public.procurement_orders;
CREATE POLICY "Users can create procurement orders" ON public.procurement_orders
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- ============================================
-- 12. RISK ASSESSMENTS
-- ============================================

-- Risk management team and executives can view assessments
DROP POLICY IF EXISTS "Risk team can view assessments" ON public.risk_assessments;
CREATE POLICY "Risk team can view assessments" ON public.risk_assessments
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('risk_manager', 'compliance_manager', 'dept_manager', 'super_admin', 'executive')
        OR department IN ('Risk Management', 'Legal & Compliance', 'Executive'))
    )
  );

-- Risk management team can manage assessments
DROP POLICY IF EXISTS "Risk team can manage assessments" ON public.risk_assessments;
CREATE POLICY "Risk team can manage assessments" ON public.risk_assessments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('risk_manager', 'compliance_manager', 'dept_manager', 'super_admin')
        OR department IN ('Risk Management', 'Legal & Compliance'))
    )
  );

-- ============================================
-- 13. TASK COMMENTS
-- ============================================

-- Users can view comments on tasks they're assigned to or created
DROP POLICY IF EXISTS "Users can view task comments" ON public.task_comments;
CREATE POLICY "Users can view task comments" ON public.task_comments
  FOR SELECT
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workflow_tasks wt
      WHERE wt.id = task_comments.task_id
      AND (wt.assigned_to = auth.uid() OR wt.assigned_by = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('dept_manager', 'super_admin')
        OR department IN ('Administration', 'Operations'))
    )
  );

-- Users can create comments on tasks they're involved with
DROP POLICY IF EXISTS "Users can create task comments" ON public.task_comments;
CREATE POLICY "Users can create task comments" ON public.task_comments
  FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.workflow_tasks wt
      WHERE wt.id = task_comments.task_id
      AND (wt.assigned_to = auth.uid() OR wt.assigned_by = auth.uid())
    )
  );

-- Managers can manage all comments
DROP POLICY IF EXISTS "Managers can manage task comments" ON public.task_comments;
CREATE POLICY "Managers can manage task comments" ON public.task_comments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('dept_manager', 'super_admin')
        OR department IN ('Administration', 'Operations'))
    )
  );

-- ============================================
-- 14. TRAINING ENROLLMENTS
-- ============================================

-- Employees can view their own enrollments
DROP POLICY IF EXISTS "Employees can view own enrollments" ON public.training_enrollments;
CREATE POLICY "Employees can view own enrollments" ON public.training_enrollments
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('hr_manager', 'dept_manager', 'super_admin', 'training_manager')
        OR department = 'Human Resources')
    )
  );

-- HR and employees can manage enrollments
DROP POLICY IF EXISTS "HR can manage enrollments" ON public.training_enrollments;
CREATE POLICY "HR can manage enrollments" ON public.training_enrollments
  FOR ALL
  USING (
    employee_id IN (
      SELECT id FROM public.employees WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('hr_manager', 'dept_manager', 'super_admin', 'training_manager')
        OR department = 'Human Resources')
    )
  );

-- ============================================
-- 15. TRAINING PROGRAMS
-- ============================================

-- All authenticated users can view training programs
DROP POLICY IF EXISTS "Users can view training programs" ON public.training_programs;
CREATE POLICY "Users can view training programs" ON public.training_programs
  FOR SELECT
  USING (true);

-- HR can manage training programs
DROP POLICY IF EXISTS "HR can manage training programs" ON public.training_programs;
CREATE POLICY "HR can manage training programs" ON public.training_programs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('hr_manager', 'dept_manager', 'super_admin', 'training_manager')
        OR department = 'Human Resources')
    )
  );

-- ============================================
-- 16. WELLNESS BADGE AWARDS
-- ============================================

-- Employees can view their own badge awards
DROP POLICY IF EXISTS "Employees can view own badge awards" ON public.wellness_badge_awards;
CREATE POLICY "Employees can view own badge awards" ON public.wellness_badge_awards
  FOR SELECT
  USING (
    employee_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('wellness_manager', 'hr_manager', 'dept_manager', 'super_admin')
        OR department IN ('Employee Wellness & Engagement', 'Human Resources'))
    )
  );

-- Wellness team can manage badge awards
DROP POLICY IF EXISTS "Wellness team can manage badge awards" ON public.wellness_badge_awards;
CREATE POLICY "Wellness team can manage badge awards" ON public.wellness_badge_awards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('wellness_manager', 'hr_manager', 'dept_manager', 'super_admin')
        OR department IN ('Employee Wellness & Engagement', 'Human Resources'))
    )
  );

-- ============================================
-- 17. WELLNESS BADGES
-- ============================================

-- All authenticated users can view badges
DROP POLICY IF EXISTS "Users can view wellness badges" ON public.wellness_badges;
CREATE POLICY "Users can view wellness badges" ON public.wellness_badges
  FOR SELECT
  USING (true);

-- Wellness team can manage badges
DROP POLICY IF EXISTS "Wellness team can manage badges" ON public.wellness_badges;
CREATE POLICY "Wellness team can manage badges" ON public.wellness_badges
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('wellness_manager', 'hr_manager', 'dept_manager', 'super_admin')
        OR department IN ('Employee Wellness & Engagement', 'Human Resources'))
    )
  );

-- ============================================
-- 18. WELLNESS CHALLENGE PARTICIPATION
-- ============================================

-- Employees can view their own participation
DROP POLICY IF EXISTS "Employees can view own challenge participation" ON public.wellness_challenge_participation;
CREATE POLICY "Employees can view own challenge participation" ON public.wellness_challenge_participation
  FOR SELECT
  USING (
    participant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('wellness_manager', 'hr_manager', 'dept_manager', 'super_admin')
        OR department IN ('Employee Wellness & Engagement', 'Human Resources'))
    )
  );

-- Wellness team and employees can manage participation
DROP POLICY IF EXISTS "Wellness team can manage challenge participation" ON public.wellness_challenge_participation;
CREATE POLICY "Wellness team can manage challenge participation" ON public.wellness_challenge_participation
  FOR ALL
  USING (
    participant_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('wellness_manager', 'hr_manager', 'dept_manager', 'super_admin')
        OR department IN ('Employee Wellness & Engagement', 'Human Resources'))
    )
  );

-- ============================================
-- 19. WELLNESS EVENT ATTENDANCE
-- ============================================

-- Employees can view their own attendance
DROP POLICY IF EXISTS "Employees can view own event attendance" ON public.wellness_event_attendance;
CREATE POLICY "Employees can view own event attendance" ON public.wellness_event_attendance
  FOR SELECT
  USING (
    attendee_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('wellness_manager', 'hr_manager', 'dept_manager', 'super_admin')
        OR department IN ('Employee Wellness & Engagement', 'Human Resources'))
    )
  );

-- Wellness team and employees can manage attendance
DROP POLICY IF EXISTS "Wellness team can manage event attendance" ON public.wellness_event_attendance;
CREATE POLICY "Wellness team can manage event attendance" ON public.wellness_event_attendance
  FOR ALL
  USING (
    attendee_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('wellness_manager', 'hr_manager', 'dept_manager', 'super_admin')
        OR department IN ('Employee Wellness & Engagement', 'Human Resources'))
    )
  );

-- ============================================
-- 20. WELLNESS EVENTS
-- ============================================

-- All authenticated users can view wellness events
DROP POLICY IF EXISTS "Users can view wellness events" ON public.wellness_events;
CREATE POLICY "Users can view wellness events" ON public.wellness_events
  FOR SELECT
  USING (true);

-- Wellness team can manage events
DROP POLICY IF EXISTS "Wellness team can manage events" ON public.wellness_events;
CREATE POLICY "Wellness team can manage events" ON public.wellness_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('wellness_manager', 'hr_manager', 'dept_manager', 'super_admin')
        OR department IN ('Employee Wellness & Engagement', 'Human Resources'))
    )
  );

-- ============================================
-- 21. WELLNESS RESOURCES
-- ============================================

-- All authenticated users can view wellness resources
DROP POLICY IF EXISTS "Users can view wellness resources" ON public.wellness_resources;
CREATE POLICY "Users can view wellness resources" ON public.wellness_resources
  FOR SELECT
  USING (true);

-- Wellness team can manage resources
DROP POLICY IF EXISTS "Wellness team can manage resources" ON public.wellness_resources;
CREATE POLICY "Wellness team can manage resources" ON public.wellness_resources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('wellness_manager', 'hr_manager', 'dept_manager', 'super_admin')
        OR department IN ('Employee Wellness & Engagement', 'Human Resources'))
    )
  );

-- ============================================
-- 22. WELLNESS SURVEYS
-- ============================================

-- All authenticated users can view active surveys
DROP POLICY IF EXISTS "Users can view wellness surveys" ON public.wellness_surveys;
CREATE POLICY "Users can view wellness surveys" ON public.wellness_surveys
  FOR SELECT
  USING (
    status IN ('active', 'draft')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('wellness_manager', 'hr_manager', 'dept_manager', 'super_admin')
        OR department IN ('Employee Wellness & Engagement', 'Human Resources'))
    )
  );

-- Wellness team can manage surveys
DROP POLICY IF EXISTS "Wellness team can manage surveys" ON public.wellness_surveys;
CREATE POLICY "Wellness team can manage surveys" ON public.wellness_surveys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (role IN ('wellness_manager', 'hr_manager', 'dept_manager', 'super_admin')
        OR department IN ('Employee Wellness & Engagement', 'Human Resources'))
    )
  );

-- ============================================
-- SUMMARY
-- ============================================
-- RLS policies have been added for all tables that had RLS enabled
-- but no policies defined. This addresses the security linter warnings
-- and ensures proper access control for all tables.
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

