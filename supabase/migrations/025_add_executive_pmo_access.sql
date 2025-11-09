-- ============================================
-- Add Executive Access to PMO Data
-- ============================================
-- This migration ensures executives can access PMO project data
-- Executives need full visibility into all projects for strategic oversight
-- ============================================

-- Update PMO projects policy to include executives
DROP POLICY IF EXISTS "PMO projects viewable by PMO and managers" ON public.pmo_projects;
CREATE POLICY "PMO projects viewable by PMO and managers"
  ON public.pmo_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Project Management'
        OR up.department = 'Executive Management'
        OR up.role IN ('super_admin', 'executive', 'dept_manager', 'project_manager')
        OR project_manager_id = auth.uid()
      )
    )
  );

-- Update PMO milestones policy to include executives
DROP POLICY IF EXISTS "PMO milestones viewable by PMO and managers" ON public.pmo_milestones;
CREATE POLICY "PMO milestones viewable by PMO and managers"
  ON public.pmo_milestones FOR SELECT
  USING (
    -- User is in Project Management or Executive Management department or has manager/admin role
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Project Management'
        OR up.department = 'Executive Management'
        OR up.role IN ('super_admin', 'executive', 'dept_manager', 'project_manager')
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

-- Update PMO resources policy to include executives
DROP POLICY IF EXISTS "PMO resources viewable by PMO and managers" ON public.pmo_project_resources;
CREATE POLICY "PMO resources viewable by PMO and managers"
  ON public.pmo_project_resources FOR SELECT
  USING (
    -- User is in Project Management or Executive Management department or has manager/admin role
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Project Management'
        OR up.department = 'Executive Management'
        OR up.role IN ('super_admin', 'executive', 'dept_manager', 'project_manager')
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

-- Update PMO risks policy to include executives
DROP POLICY IF EXISTS "PMO risks viewable by PMO and managers" ON public.pmo_project_risks;
CREATE POLICY "PMO risks viewable by PMO and managers"
  ON public.pmo_project_risks FOR SELECT
  USING (
    -- User is in Project Management or Executive Management department or has manager/admin role
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Project Management'
        OR up.department = 'Executive Management'
        OR up.role IN ('super_admin', 'executive', 'dept_manager', 'project_manager')
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

-- Update PMO issues policy to include executives
DROP POLICY IF EXISTS "PMO issues viewable by PMO and managers" ON public.pmo_project_issues;
CREATE POLICY "PMO issues viewable by PMO and managers"
  ON public.pmo_project_issues FOR SELECT
  USING (
    -- User is in Project Management or Executive Management department or has manager/admin role
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Project Management'
        OR up.department = 'Executive Management'
        OR up.role IN ('super_admin', 'executive', 'dept_manager', 'project_manager')
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

-- Update PMO stakeholders policy to include executives
DROP POLICY IF EXISTS "PMO stakeholders viewable by PMO and managers" ON public.pmo_project_stakeholders;
CREATE POLICY "PMO stakeholders viewable by PMO and managers"
  ON public.pmo_project_stakeholders FOR SELECT
  USING (
    -- User is in Project Management or Executive Management department or has manager/admin role
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Project Management'
        OR up.department = 'Executive Management'
        OR up.role IN ('super_admin', 'executive', 'dept_manager', 'project_manager')
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

-- Update PMO status reports policy to include executives
DROP POLICY IF EXISTS "PMO status reports viewable by PMO and managers" ON public.pmo_status_reports;
CREATE POLICY "PMO status reports viewable by PMO and managers"
  ON public.pmo_status_reports FOR SELECT
  USING (
    -- User is in Project Management or Executive Management department or has manager/admin role
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Project Management'
        OR up.department = 'Executive Management'
        OR up.role IN ('super_admin', 'executive', 'dept_manager', 'project_manager')
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

