-- ============================================
-- Fix PMO RLS Policies
-- ============================================
-- The original policies only checked if projects exist,
-- but didn't check if users have permission to view them.
-- This migration updates the policies to match the pmo_projects policy.
-- 
-- IMPORTANT: Fixed infinite recursion issue where pmo_project_resources
-- policy was querying itself, and pmo_projects policy was querying
-- pmo_project_resources which could cause circular dependencies.
-- ============================================

-- Drop existing policies (both old and new names in case migration was partially run)
DROP POLICY IF EXISTS "PMO projects viewable by PMO and managers" ON public.pmo_projects;
DROP POLICY IF EXISTS "PMO milestones viewable by project team" ON public.pmo_milestones;
DROP POLICY IF EXISTS "PMO milestones viewable by PMO and managers" ON public.pmo_milestones;
DROP POLICY IF EXISTS "PMO resources viewable by project team" ON public.pmo_project_resources;
DROP POLICY IF EXISTS "PMO resources viewable by PMO and managers" ON public.pmo_project_resources;
DROP POLICY IF EXISTS "PMO risks viewable by project team" ON public.pmo_project_risks;
DROP POLICY IF EXISTS "PMO risks viewable by PMO and managers" ON public.pmo_project_risks;
DROP POLICY IF EXISTS "PMO issues viewable by project team" ON public.pmo_project_issues;
DROP POLICY IF EXISTS "PMO issues viewable by PMO and managers" ON public.pmo_project_issues;
DROP POLICY IF EXISTS "PMO stakeholders viewable by project team" ON public.pmo_project_stakeholders;
DROP POLICY IF EXISTS "PMO stakeholders viewable by PMO and managers" ON public.pmo_project_stakeholders;
DROP POLICY IF EXISTS "PMO status reports viewable by project team" ON public.pmo_status_reports;
DROP POLICY IF EXISTS "PMO status reports viewable by PMO and managers" ON public.pmo_status_reports;

-- Fix pmo_projects policy to avoid recursion when checking project resources
-- The original policy queried pmo_project_resources which could cause infinite recursion
-- This version does NOT query pmo_project_resources to avoid circular dependencies
-- Users assigned to projects can access them through pmo_project_resources table directly
CREATE POLICY "PMO projects viewable by PMO and managers"
  ON public.pmo_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Project Management'
        OR up.role IN ('super_admin', 'dept_manager', 'project_manager')
        OR project_manager_id = auth.uid()
        -- NOTE: We intentionally do NOT check pmo_project_resources here to avoid recursion
        -- Users assigned to projects can access them through the pmo_project_resources table
        -- and other related tables (milestones, risks, etc.) will check project resources separately
      )
    )
  );

-- Create updated policies that check user permissions
-- These policies ensure users can only see milestones for projects they have access to
CREATE POLICY "PMO milestones viewable by PMO and managers"
  ON public.pmo_milestones FOR SELECT
  USING (
    -- User is in Project Management department or has manager/admin role
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Project Management'
        OR up.role IN ('super_admin', 'dept_manager', 'project_manager')
      )
    )
    -- OR user is the project manager of the associated project
    OR EXISTS (
      SELECT 1 FROM public.pmo_projects pp
      WHERE pp.id = pmo_milestones.pmo_project_id
      AND pp.project_manager_id = auth.uid()
    )
    -- OR user is assigned to the milestone
    OR pmo_milestones.assigned_to = auth.uid()
    -- OR user's employee record is in the project resources (check directly via employees table)
    OR EXISTS (
      SELECT 1 FROM public.pmo_projects pp
      JOIN public.employees e ON e.user_id = auth.uid()
      WHERE pp.id = pmo_milestones.pmo_project_id
      AND EXISTS (
        SELECT 1 FROM public.pmo_project_resources pr
        WHERE pr.pmo_project_id = pp.id
        AND pr.employee_id = e.id
      )
    )
  );

CREATE POLICY "PMO resources viewable by PMO and managers"
  ON public.pmo_project_resources FOR SELECT
  USING (
    -- User is in Project Management department or has manager/admin role
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Project Management'
        OR up.role IN ('super_admin', 'dept_manager', 'project_manager')
      )
    )
    -- OR user is viewing their own resource record
    OR EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = pmo_project_resources.employee_id
      AND e.user_id = auth.uid()
    )
    -- OR user is the project manager of the associated project
    OR EXISTS (
      SELECT 1 FROM public.pmo_projects pp
      WHERE pp.id = pmo_project_resources.pmo_project_id
      AND pp.project_manager_id = auth.uid()
    )
  );

CREATE POLICY "PMO risks viewable by PMO and managers"
  ON public.pmo_project_risks FOR SELECT
  USING (
    -- User is in Project Management department or has manager/admin role
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Project Management'
        OR up.role IN ('super_admin', 'dept_manager', 'project_manager')
      )
    )
    -- OR user is the project manager of the associated project
    OR EXISTS (
      SELECT 1 FROM public.pmo_projects pp
      WHERE pp.id = pmo_project_risks.pmo_project_id
      AND pp.project_manager_id = auth.uid()
    )
    -- OR user is the mitigation owner
    OR pmo_project_risks.mitigation_owner_id = auth.uid()
    -- OR user's employee record is in the project resources
    OR EXISTS (
      SELECT 1 FROM public.pmo_projects pp
      JOIN public.employees e ON e.user_id = auth.uid()
      WHERE pp.id = pmo_project_risks.pmo_project_id
      AND EXISTS (
        SELECT 1 FROM public.pmo_project_resources pr
        WHERE pr.pmo_project_id = pp.id
        AND pr.employee_id = e.id
      )
    )
  );

CREATE POLICY "PMO issues viewable by PMO and managers"
  ON public.pmo_project_issues FOR SELECT
  USING (
    -- User is in Project Management department or has manager/admin role
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Project Management'
        OR up.role IN ('super_admin', 'dept_manager', 'project_manager')
      )
    )
    -- OR user is the project manager of the associated project
    OR EXISTS (
      SELECT 1 FROM public.pmo_projects pp
      WHERE pp.id = pmo_project_issues.pmo_project_id
      AND pp.project_manager_id = auth.uid()
    )
    -- OR user is assigned to the issue
    OR pmo_project_issues.assigned_to = auth.uid()
    -- OR user reported the issue
    OR pmo_project_issues.reported_by = auth.uid()
    -- OR user's employee record is in the project resources
    OR EXISTS (
      SELECT 1 FROM public.pmo_projects pp
      JOIN public.employees e ON e.user_id = auth.uid()
      WHERE pp.id = pmo_project_issues.pmo_project_id
      AND EXISTS (
        SELECT 1 FROM public.pmo_project_resources pr
        WHERE pr.pmo_project_id = pp.id
        AND pr.employee_id = e.id
      )
    )
  );

CREATE POLICY "PMO stakeholders viewable by PMO and managers"
  ON public.pmo_project_stakeholders FOR SELECT
  USING (
    -- User is in Project Management department or has manager/admin role
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Project Management'
        OR up.role IN ('super_admin', 'dept_manager', 'project_manager')
      )
    )
    -- OR user is the project manager of the associated project
    OR EXISTS (
      SELECT 1 FROM public.pmo_projects pp
      WHERE pp.id = pmo_project_stakeholders.pmo_project_id
      AND pp.project_manager_id = auth.uid()
    )
    -- OR user is the stakeholder themselves
    OR pmo_project_stakeholders.stakeholder_id = auth.uid()
    -- OR user's employee record is in the project resources
    OR EXISTS (
      SELECT 1 FROM public.pmo_projects pp
      JOIN public.employees e ON e.user_id = auth.uid()
      WHERE pp.id = pmo_project_stakeholders.pmo_project_id
      AND EXISTS (
        SELECT 1 FROM public.pmo_project_resources pr
        WHERE pr.pmo_project_id = pp.id
        AND pr.employee_id = e.id
      )
    )
  );

CREATE POLICY "PMO status reports viewable by PMO and managers"
  ON public.pmo_status_reports FOR SELECT
  USING (
    -- User is in Project Management department or has manager/admin role
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Project Management'
        OR up.role IN ('super_admin', 'dept_manager', 'project_manager')
      )
    )
    -- OR user is the project manager of the associated project
    OR EXISTS (
      SELECT 1 FROM public.pmo_projects pp
      WHERE pp.id = pmo_status_reports.pmo_project_id
      AND pp.project_manager_id = auth.uid()
    )
    -- OR user created the report
    OR pmo_status_reports.reported_by = auth.uid()
    -- OR user's employee record is in the project resources
    OR EXISTS (
      SELECT 1 FROM public.pmo_projects pp
      JOIN public.employees e ON e.user_id = auth.uid()
      WHERE pp.id = pmo_status_reports.pmo_project_id
      AND EXISTS (
        SELECT 1 FROM public.pmo_project_resources pr
        WHERE pr.pmo_project_id = pp.id
        AND pr.employee_id = e.id
      )
    )
  );

