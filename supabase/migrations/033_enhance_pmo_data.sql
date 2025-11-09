-- ============================================
-- PMO - Enhanced Seed Data
-- ============================================
-- This migration enhances existing PMO data with additional projects,
-- milestones, resources, risks, and issues for comprehensive testing
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- HELPER: Get employee ID by email
-- ============================================
CREATE OR REPLACE FUNCTION get_employee_id_by_email(p_email TEXT)
RETURNS UUID AS $$
DECLARE
  v_employee_id UUID;
BEGIN
  SELECT e.id INTO v_employee_id
  FROM public.employees e
  JOIN public.user_profiles up ON e.user_id = up.id
  WHERE up.email = p_email
  LIMIT 1;
  
  RETURN v_employee_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER: Get user profile ID by email
-- ============================================
CREATE OR REPLACE FUNCTION get_user_profile_id_by_email(p_email TEXT)
RETURNS UUID AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id
  FROM public.user_profiles
  WHERE email = p_email
  LIMIT 1;
  
  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. ADDITIONAL PMO PROJECTS
-- ============================================

DO $$
DECLARE
  v_kevin_id UUID;
  v_kevin_employee_id UUID;
  v_rachel_id UUID;
  v_project1_id UUID;
  v_project2_id UUID;
  v_project3_id UUID;
  v_pmo_project1_id UUID;
  v_pmo_project2_id UUID;
  v_pmo_project3_id UUID;
BEGIN
  -- Get user IDs
  SELECT get_user_profile_id_by_email('kevin.brooks@company.com') INTO v_kevin_id;
  SELECT get_employee_id_by_email('kevin.brooks@company.com') INTO v_kevin_employee_id;
  SELECT get_user_profile_id_by_email('rachel.young@company.com') INTO v_rachel_id;

  -- Create additional base projects (one at a time to capture IDs)
  INSERT INTO public.projects (name, department, status, progress, due_date, owner_id, owner_name, description, budget)
  VALUES
    ('Cloud Infrastructure Migration', 'Information Technology', 'In Progress', 50, '2025-04-30', v_kevin_employee_id, 'Kevin Brooks',
     'Migrate all on-premise infrastructure to cloud. Includes data migration, application deployment, and security configuration.', 750000.00)
  RETURNING id INTO v_project1_id;
  
  INSERT INTO public.projects (name, department, status, progress, due_date, owner_id, owner_name, description, budget)
  VALUES
    ('Customer Experience Enhancement', 'Marketing & Communications', 'In Progress', 35, '2025-05-31', v_kevin_employee_id, 'Kevin Brooks',
     'Enhance customer experience across all touchpoints. Includes website redesign, mobile app updates, and customer service improvements.', 450000.00)
  RETURNING id INTO v_project2_id;
  
  INSERT INTO public.projects (name, department, status, progress, due_date, owner_id, owner_name, description, budget)
  VALUES
    ('Supply Chain Optimization', 'Procurement', 'Planning', 15, '2025-06-30', v_kevin_employee_id, 'Kevin Brooks',
     'Optimize supply chain processes. Includes vendor consolidation, inventory management, and logistics improvements.', 320000.00)
  RETURNING id INTO v_project3_id;

  -- Create PMO projects linked to base projects (one at a time to capture IDs)
  INSERT INTO public.pmo_projects (
    project_id, project_number, project_type, priority, health_indicator, complexity,
    start_date, planned_end_date, planned_duration_days,
    budget_allocated, budget_spent, budget_remaining,
    project_manager_id, project_manager_name,
    sponsor_id, sponsor_name,
    business_case, success_criteria,
    created_by, created_by_name
  )
  VALUES
    (
      v_project1_id, 'PMO-2024-009', 'infrastructure', 'high', 'yellow', 'high',
      CURRENT_DATE - INTERVAL '60 days', '2025-04-30', 180,
      750000.00, 375000.00, 375000.00,
      v_kevin_id, 'Kevin Brooks',
      v_kevin_id, 'Kevin Brooks',
      'Migrate to cloud for improved scalability, cost reduction, and disaster recovery capabilities.',
      '100% infrastructure migrated, zero downtime, 30% cost reduction',
      v_kevin_id, 'Kevin Brooks'
    )
  RETURNING id INTO v_pmo_project1_id;
  
  INSERT INTO public.pmo_projects (
    project_id, project_number, project_type, priority, health_indicator, complexity,
    start_date, planned_end_date, planned_duration_days,
    budget_allocated, budget_spent, budget_remaining,
    project_manager_id, project_manager_name,
    sponsor_id, sponsor_name,
    business_case, success_criteria,
    created_by, created_by_name
  )
  VALUES
    (
      v_project2_id, 'PMO-2024-010', 'strategic', 'critical', 'green', 'medium',
      CURRENT_DATE - INTERVAL '45 days', '2025-05-31', 150,
      450000.00, 157500.00, 292500.00,
      v_rachel_id, 'Rachel Young',
      v_kevin_id, 'Kevin Brooks',
      'Enhance customer experience to improve satisfaction scores and increase retention.',
      'Customer satisfaction score > 4.5/5, 20% increase in retention',
      v_kevin_id, 'Kevin Brooks'
    )
  RETURNING id INTO v_pmo_project2_id;
  
  INSERT INTO public.pmo_projects (
    project_id, project_number, project_type, priority, health_indicator, complexity,
    start_date, planned_end_date, planned_duration_days,
    budget_allocated, budget_spent, budget_remaining,
    project_manager_id, project_manager_name,
    sponsor_id, sponsor_name,
    business_case, success_criteria,
    created_by, created_by_name
  )
  VALUES
    (
      v_project3_id, 'PMO-2024-011', 'operations', 'medium', 'green', 'medium',
      CURRENT_DATE - INTERVAL '30 days', '2025-06-30', 120,
      320000.00, 48000.00, 272000.00,
      v_rachel_id, 'Rachel Young',
      v_kevin_id, 'Kevin Brooks',
      'Optimize supply chain to reduce costs and improve delivery times.',
      '15% cost reduction, 25% improvement in delivery times',
      v_kevin_id, 'Kevin Brooks'
    )
  RETURNING id INTO v_pmo_project3_id;

  -- Add milestones for new projects
  INSERT INTO public.pmo_milestones (
    milestone_number, pmo_project_id, milestone_name, milestone_type,
    planned_date, status, completion_percentage, is_critical, assigned_to_name
  )
  VALUES
    -- Cloud Migration milestones
    ('MIL-009-001', v_pmo_project1_id, 'Infrastructure Assessment Complete', 'phase_gate', CURRENT_DATE - INTERVAL '30 days', 'completed', 100, true, 'Rachel Young'),
    ('MIL-009-002', v_pmo_project1_id, 'Data Migration Planning Complete', 'phase_gate', CURRENT_DATE + INTERVAL '30 days', 'in_progress', 60, true, 'Rachel Young'),
    ('MIL-009-003', v_pmo_project1_id, 'Pilot Migration Complete', 'deliverable', CURRENT_DATE + INTERVAL '60 days', 'pending', 0, true, 'Rachel Young'),
    ('MIL-009-004', v_pmo_project1_id, 'Full Migration Complete', 'go_live', '2025-04-30', 'pending', 0, true, 'Rachel Young'),
    
    -- Customer Experience milestones
    ('MIL-010-001', v_pmo_project2_id, 'User Research Complete', 'phase_gate', CURRENT_DATE - INTERVAL '15 days', 'completed', 100, false, 'Mark Taylor'),
    ('MIL-010-002', v_pmo_project2_id, 'Design Phase Complete', 'deliverable', CURRENT_DATE + INTERVAL '30 days', 'in_progress', 40, true, 'Mark Taylor'),
    ('MIL-010-003', v_pmo_project2_id, 'Development Phase Complete', 'deliverable', CURRENT_DATE + INTERVAL '90 days', 'pending', 0, true, 'Mark Taylor'),
    ('MIL-010-004', v_pmo_project2_id, 'Launch Complete', 'go_live', '2025-05-31', 'pending', 0, true, 'Mark Taylor'),
    
    -- Supply Chain milestones
    ('MIL-011-001', v_pmo_project3_id, 'Current State Analysis Complete', 'phase_gate', CURRENT_DATE + INTERVAL '15 days', 'pending', 0, false, 'Hannah Reed'),
    ('MIL-011-002', v_pmo_project3_id, 'Vendor Evaluation Complete', 'deliverable', CURRENT_DATE + INTERVAL '45 days', 'pending', 0, true, 'Hannah Reed'),
    ('MIL-011-003', v_pmo_project3_id, 'Implementation Complete', 'go_live', '2025-06-30', 'pending', 0, true, 'Hannah Reed');

  -- Add resources for new projects
  INSERT INTO public.pmo_project_resources (
    pmo_project_id, employee_id, employee_name, role_in_project,
    allocation_percentage, planned_hours, actual_hours, status
  )
  SELECT 
    v_pmo_project1_id,
    get_employee_id_by_email('rachel.young@company.com'),
    'Rachel Young',
    'project_manager',
    100,
    1600.00,
    800.00,
    'active'
  WHERE EXISTS (SELECT 1 FROM public.employees WHERE email = 'rachel.young@company.com')
  UNION ALL
  SELECT 
    v_pmo_project2_id,
    get_employee_id_by_email('mark.taylor@company.com'),
    'Mark Taylor',
    'project_coordinator',
    75,
    1200.00,
    420.00,
    'active'
  WHERE EXISTS (SELECT 1 FROM public.employees WHERE email = 'mark.taylor@company.com')
  UNION ALL
  SELECT 
    v_pmo_project3_id,
    get_employee_id_by_email('hannah.reed@company.com'),
    'Hannah Reed',
    'project_coordinator',
    50,
    800.00,
    120.00,
    'active'
  WHERE EXISTS (SELECT 1 FROM public.employees WHERE email = 'hannah.reed@company.com');

  -- Add risks for new projects
  INSERT INTO public.pmo_project_risks (
    risk_number, pmo_project_id, risk_title, risk_description,
    risk_category, probability, impact
  )
  VALUES
    ('RISK-009-001', v_pmo_project1_id, 'Data Migration Downtime', 'Risk of extended downtime during data migration affecting business operations', 'technical', 'medium', 'high'),
    ('RISK-009-002', v_pmo_project1_id, 'Cloud Provider Outage', 'Risk of cloud provider service outage affecting migrated systems', 'external', 'low', 'critical'),
    ('RISK-010-001', v_pmo_project2_id, 'User Adoption Resistance', 'Risk of users resisting new customer experience changes', 'resource', 'medium', 'medium'),
    ('RISK-010-002', v_pmo_project2_id, 'Development Timeline Delay', 'Risk of development delays affecting launch date', 'schedule', 'high', 'high'),
    ('RISK-011-001', v_pmo_project3_id, 'Vendor Contract Negotiation', 'Risk of delays in vendor contract negotiations', 'schedule', 'medium', 'medium');

  -- Add issues for new projects
  INSERT INTO public.pmo_project_issues (
    issue_number, pmo_project_id, issue_title, issue_description,
    priority, status, assigned_to_name
  )
  VALUES
    ('ISS-009-001', v_pmo_project1_id, 'Legacy System Compatibility', 'Legacy systems require additional configuration for cloud migration', 'high', 'open', 'Rachel Young'),
    ('ISS-010-001', v_pmo_project2_id, 'Design Approval Delayed', 'Design approval from stakeholders delayed by 1 week', 'medium', 'open', 'Mark Taylor'),
    ('ISS-011-001', v_pmo_project3_id, 'Vendor Response Time', 'Some vendors have slow response times affecting evaluation', 'low', 'open', 'Hannah Reed');
END $$;

-- ============================================
-- 2. ADDITIONAL WORKFLOW TASKS FOR PMO
-- ============================================

DO $$
DECLARE
  v_kevin_id UUID;
  v_rachel_id UUID;
  v_mark_id UUID;
  v_hannah_id UUID;
  v_brian_id UUID;
BEGIN
  -- Get user profile IDs
  SELECT get_user_profile_id_by_email('kevin.brooks@company.com') INTO v_kevin_id;
  SELECT get_user_profile_id_by_email('rachel.young@company.com') INTO v_rachel_id;
  SELECT get_user_profile_id_by_email('mark.taylor@company.com') INTO v_mark_id;
  SELECT get_user_profile_id_by_email('hannah.reed@company.com') INTO v_hannah_id;
  SELECT get_user_profile_id_by_email('brian.singh@company.com') INTO v_brian_id;

  -- Insert PMO workflow tasks
  INSERT INTO public.workflow_tasks (title, description, department, status, priority, assigned_to, assigned_by, due_date)
  VALUES
    ('Portfolio Health Review - Q4', 'Conduct quarterly portfolio health review. Assess all projects and identify at-risk items.', 'Project Management', 'pending', 'high', v_kevin_id, v_kevin_id, CURRENT_DATE + INTERVAL '7 days'),
    ('Resource Allocation Planning', 'Plan resource allocation for next quarter. Identify capacity and conflicts.', 'Project Management', 'in_progress', 'high', v_rachel_id, v_kevin_id, CURRENT_DATE + INTERVAL '14 days'),
    ('Risk Register Update', 'Update risk register for all active projects. Review mitigation strategies.', 'Project Management', 'pending', 'medium', v_mark_id, v_rachel_id, CURRENT_DATE + INTERVAL '10 days'),
    ('Milestone Tracking Review', 'Review upcoming milestones for next 30 days. Identify potential delays.', 'Project Management', 'pending', 'medium', v_hannah_id, v_rachel_id, CURRENT_DATE + INTERVAL '5 days'),
    ('Project Status Report Preparation', 'Prepare monthly project status report for executive team.', 'Project Management', 'pending', 'high', v_brian_id, v_kevin_id, CURRENT_DATE + INTERVAL '3 days'),
    ('Stakeholder Communication Plan', 'Update stakeholder communication plan for all active projects.', 'Project Management', 'pending', 'low', v_mark_id, v_rachel_id, CURRENT_DATE + INTERVAL '21 days'),
    ('Project Methodology Documentation', 'Document and update project management methodology and best practices.', 'Project Management', 'in_progress', 'medium', v_rachel_id, v_kevin_id, CURRENT_DATE + INTERVAL '30 days'),
    ('Lessons Learned Session', 'Conduct lessons learned session for completed projects. Document insights.', 'Project Management', 'pending', 'low', v_hannah_id, v_kevin_id, CURRENT_DATE + INTERVAL '45 days');

  -- Completed tasks
  INSERT INTO public.workflow_tasks (title, description, department, status, priority, assigned_to, assigned_by, due_date, completed_at)
  VALUES
    ('Q3 Portfolio Review', 'Completed Q3 portfolio review. All projects assessed and reported.', 'Project Management', 'completed', 'high', v_kevin_id, v_kevin_id, '2024-09-30', '2024-09-30 17:00:00'),
    ('Resource Allocation - Q3', 'Completed Q3 resource allocation planning. All conflicts resolved.', 'Project Management', 'completed', 'high', v_rachel_id, v_kevin_id, '2024-09-25', '2024-09-25 15:30:00'),
    ('Monthly Status Report - September', 'Completed September status report. Submitted to executive team.', 'Project Management', 'completed', 'high', v_brian_id, v_kevin_id, '2024-09-28', '2024-09-28 14:00:00');
END $$;

-- ============================================
-- CLEANUP: Drop helper functions
-- ============================================
DROP FUNCTION IF EXISTS get_employee_id_by_email(TEXT);
DROP FUNCTION IF EXISTS get_user_profile_id_by_email(TEXT);

-- ============================================
-- VERIFICATION QUERIES (for testing)
-- ============================================
-- Uncomment to verify data:
-- SELECT COUNT(*) as pmo_projects FROM public.pmo_projects;
-- SELECT COUNT(*) as milestones FROM public.pmo_milestones;
-- SELECT COUNT(*) as resources FROM public.pmo_project_resources;
-- SELECT COUNT(*) as risks FROM public.pmo_project_risks;
-- SELECT COUNT(*) as issues FROM public.pmo_project_issues;
-- SELECT COUNT(*) as workflow_tasks FROM public.workflow_tasks WHERE department = 'Project Management';

