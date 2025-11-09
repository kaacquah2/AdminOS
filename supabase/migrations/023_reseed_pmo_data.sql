-- ============================================
-- Clean up and re-seed PMO data
-- ============================================
-- This script will:
-- 1. Delete existing PMO data (optional - comment out if you want to keep existing)
-- 2. Ensure all 8 base projects exist
-- 3. Create PMO projects for all base projects
-- 4. Add milestones, risks, issues, stakeholders, and status reports
-- ============================================

-- WARNING: Uncomment the DELETE statements below if you want to clean up existing data first
-- Otherwise, the script will use ON CONFLICT DO NOTHING to avoid duplicates

/*
-- Clean up existing PMO data (optional)
DELETE FROM public.pmo_status_reports;
DELETE FROM public.pmo_project_stakeholders;
DELETE FROM public.pmo_project_issues;
DELETE FROM public.pmo_project_risks;
DELETE FROM public.pmo_project_resources;
DELETE FROM public.pmo_milestones;
DELETE FROM public.pmo_projects;
DELETE FROM public.projects WHERE name IN (
  'ERP System Implementation',
  'Office Relocation',
  'Digital Transformation',
  'Compliance Audit',
  'Product Launch Q4',
  'Security Upgrade',
  'Training Program Rollout',
  'Customer Portal Development'
);
*/

-- ============================================
-- 1. ENSURE ALL BASE PROJECTS EXIST
-- ============================================

DO $$
DECLARE
  v_project_names TEXT[] := ARRAY[
    'ERP System Implementation',
    'Office Relocation',
    'Digital Transformation',
    'Compliance Audit',
    'Product Launch Q4',
    'Security Upgrade',
    'Training Program Rollout',
    'Customer Portal Development'
  ];
  v_project_name TEXT;
  v_created_count INTEGER := 0;
BEGIN
  FOREACH v_project_name IN ARRAY v_project_names
  LOOP
    INSERT INTO public.projects (id, name, department, status, progress, due_date, owner_name, description, budget, created_at, updated_at)
    SELECT 
      gen_random_uuid(),
      v_project_name,
      CASE 
        WHEN v_project_name = 'ERP System Implementation' THEN 'IT'
        WHEN v_project_name = 'Office Relocation' THEN 'Operations'
        WHEN v_project_name = 'Digital Transformation' THEN 'IT'
        WHEN v_project_name = 'Compliance Audit' THEN 'Compliance'
        WHEN v_project_name = 'Product Launch Q4' THEN 'Product'
        WHEN v_project_name = 'Security Upgrade' THEN 'IT'
        WHEN v_project_name = 'Training Program Rollout' THEN 'HR'
        WHEN v_project_name = 'Customer Portal Development' THEN 'IT'
        ELSE 'Operations'
      END,
      CASE 
        WHEN v_project_name IN ('ERP System Implementation', 'Digital Transformation', 'Compliance Audit', 'Security Upgrade', 'Training Program Rollout') THEN 'In Progress'
        ELSE 'Planning'
      END,
      CASE 
        WHEN v_project_name = 'ERP System Implementation' THEN 45
        WHEN v_project_name = 'Office Relocation' THEN 15
        WHEN v_project_name = 'Digital Transformation' THEN 60
        WHEN v_project_name = 'Compliance Audit' THEN 75
        WHEN v_project_name = 'Product Launch Q4' THEN 20
        WHEN v_project_name = 'Security Upgrade' THEN 55
        WHEN v_project_name = 'Training Program Rollout' THEN 40
        WHEN v_project_name = 'Customer Portal Development' THEN 10
        ELSE 0
      END,
      CASE 
        WHEN v_project_name = 'ERP System Implementation' THEN CURRENT_DATE + INTERVAL '90 days'
        WHEN v_project_name = 'Office Relocation' THEN CURRENT_DATE + INTERVAL '120 days'
        WHEN v_project_name = 'Digital Transformation' THEN CURRENT_DATE + INTERVAL '180 days'
        WHEN v_project_name = 'Compliance Audit' THEN CURRENT_DATE + INTERVAL '30 days'
        WHEN v_project_name = 'Product Launch Q4' THEN CURRENT_DATE + INTERVAL '150 days'
        WHEN v_project_name = 'Security Upgrade' THEN CURRENT_DATE + INTERVAL '60 days'
        WHEN v_project_name = 'Training Program Rollout' THEN CURRENT_DATE + INTERVAL '45 days'
        WHEN v_project_name = 'Customer Portal Development' THEN CURRENT_DATE + INTERVAL '200 days'
        ELSE CURRENT_DATE + INTERVAL '100 days'
      END,
      CASE 
        WHEN v_project_name IN ('ERP System Implementation', 'Digital Transformation', 'Security Upgrade', 'Customer Portal Development') THEN 'Rachel Young'
        WHEN v_project_name IN ('Office Relocation', 'Product Launch Q4') THEN 'Mark Taylor'
        WHEN v_project_name IN ('Compliance Audit', 'Training Program Rollout') THEN 'Hannah Reed'
        ELSE 'Project Manager'
      END,
      CASE 
        WHEN v_project_name = 'ERP System Implementation' THEN 'Implement new ERP system across all departments'
        WHEN v_project_name = 'Office Relocation' THEN 'Relocate headquarters to new building'
        WHEN v_project_name = 'Digital Transformation' THEN 'Digital transformation initiative for customer experience'
        WHEN v_project_name = 'Compliance Audit' THEN 'Annual compliance audit and certification'
        WHEN v_project_name = 'Product Launch Q4' THEN 'Launch new product line in Q4'
        WHEN v_project_name = 'Security Upgrade' THEN 'Upgrade security infrastructure and protocols'
        WHEN v_project_name = 'Training Program Rollout' THEN 'Company-wide training program implementation'
        WHEN v_project_name = 'Customer Portal Development' THEN 'Develop new customer self-service portal'
        ELSE 'Project description'
      END,
      CASE 
        WHEN v_project_name = 'ERP System Implementation' THEN 500000.00
        WHEN v_project_name = 'Office Relocation' THEN 750000.00
        WHEN v_project_name = 'Digital Transformation' THEN 1200000.00
        WHEN v_project_name = 'Compliance Audit' THEN 150000.00
        WHEN v_project_name = 'Product Launch Q4' THEN 800000.00
        WHEN v_project_name = 'Security Upgrade' THEN 400000.00
        WHEN v_project_name = 'Training Program Rollout' THEN 200000.00
        WHEN v_project_name = 'Customer Portal Development' THEN 600000.00
        ELSE 100000.00
      END,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    WHERE NOT EXISTS (
      SELECT 1 FROM public.projects WHERE name = v_project_name
    );
    
    IF FOUND THEN
      v_created_count := v_created_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Created % new base projects', v_created_count;
END $$;

-- ============================================
-- 2. CREATE PMO PROJECTS FOR ALL BASE PROJECTS
-- ============================================

DO $$
DECLARE
  v_pm_id UUID;
  v_pm_name VARCHAR(255);
  v_sponsor_id UUID;
  v_sponsor_name VARCHAR(255);
  v_creator_id UUID;
  v_creator_name VARCHAR(255);
  v_project_id UUID;
  v_pmo_project_id UUID;
  v_counter INTEGER := 0;
  v_created_count INTEGER := 0;
BEGIN
  -- Get project manager (Kevin Brooks - PMO Head)
  SELECT id, full_name INTO v_pm_id, v_pm_name
  FROM public.user_profiles 
  WHERE email = 'kevin.brooks@company.com'
  LIMIT 1;
  
  -- If not found, get any PMO dept_manager
  IF v_pm_id IS NULL THEN
    SELECT id, full_name INTO v_pm_id, v_pm_name
    FROM public.user_profiles 
    WHERE department = 'Project Management' AND role = 'dept_manager'
    LIMIT 1;
  END IF;
  
  -- Get sponsor (any executive or dept_manager)
  SELECT id, full_name INTO v_sponsor_id, v_sponsor_name
  FROM public.user_profiles 
  WHERE role IN ('super_admin', 'executive', 'dept_manager')
  LIMIT 1;
  
  -- Get creator (same as PM)
  v_creator_id := v_pm_id;
  v_creator_name := v_pm_name;
  
  -- Insert PMO projects for each base project
  FOR v_project_id IN 
    SELECT id FROM public.projects 
    WHERE name IN (
      'ERP System Implementation',
      'Office Relocation',
      'Digital Transformation',
      'Compliance Audit',
      'Product Launch Q4',
      'Security Upgrade',
      'Training Program Rollout',
      'Customer Portal Development'
    )
    ORDER BY name
  LOOP
    v_counter := v_counter + 1;
    
    INSERT INTO public.pmo_projects (
      project_id, project_number, project_type, priority, health_indicator, complexity,
      strategic_alignment, start_date, planned_end_date, planned_duration_days,
      budget_allocated, budget_spent, budget_remaining, budget_variance,
      project_manager_id, project_manager_name, sponsor_id, sponsor_name,
      business_case, success_criteria, created_by, created_by_name
    )
    SELECT 
      v_project_id,
      'PRJ-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(v_counter::TEXT, 4, '0'),
      CASE 
        WHEN p.name = 'ERP System Implementation' THEN 'it_project'
        WHEN p.name = 'Office Relocation' THEN 'operations'
        WHEN p.name = 'Digital Transformation' THEN 'strategic'
        WHEN p.name = 'Compliance Audit' THEN 'compliance'
        WHEN p.name = 'Product Launch Q4' THEN 'strategic'
        WHEN p.name = 'Security Upgrade' THEN 'it_project'
        WHEN p.name = 'Training Program Rollout' THEN 'operations'
        WHEN p.name = 'Customer Portal Development' THEN 'it_project'
        ELSE 'operations'
      END,
      CASE 
        WHEN p.name IN ('Digital Transformation', 'Security Upgrade') THEN 'critical'
        WHEN p.name IN ('ERP System Implementation', 'Compliance Audit', 'Product Launch Q4', 'Customer Portal Development') THEN 'high'
        ELSE 'medium'
      END,
      CASE 
        WHEN p.name = 'Security Upgrade' THEN 'red'
        WHEN p.name IN ('ERP System Implementation', 'Digital Transformation', 'Customer Portal Development') THEN 'yellow'
        ELSE 'green'
      END,
      CASE 
        WHEN p.name = 'Digital Transformation' THEN 'very_high'
        WHEN p.name IN ('ERP System Implementation', 'Product Launch Q4', 'Customer Portal Development') THEN 'high'
        WHEN p.name = 'Compliance Audit' THEN 'low'
        ELSE 'medium'
      END,
      CASE 
        WHEN p.name = 'ERP System Implementation' THEN ARRAY['operational_efficiency', 'digital_transformation']
        WHEN p.name = 'Office Relocation' THEN ARRAY['facilities_improvement', 'cost_reduction']
        WHEN p.name = 'Digital Transformation' THEN ARRAY['digital_transformation', 'customer_experience', 'competitive_advantage']
        WHEN p.name = 'Compliance Audit' THEN ARRAY['regulatory_compliance', 'risk_mitigation']
        WHEN p.name = 'Product Launch Q4' THEN ARRAY['revenue_growth', 'market_expansion']
        WHEN p.name = 'Security Upgrade' THEN ARRAY['security', 'risk_mitigation', 'compliance']
        WHEN p.name = 'Training Program Rollout' THEN ARRAY['employee_development', 'skill_enhancement']
        WHEN p.name = 'Customer Portal Development' THEN ARRAY['customer_experience', 'digital_transformation']
        ELSE ARRAY[]::TEXT[]
      END,
      CASE 
        WHEN p.name = 'ERP System Implementation' THEN CURRENT_DATE - INTERVAL '60 days'
        WHEN p.name = 'Office Relocation' THEN CURRENT_DATE - INTERVAL '30 days'
        WHEN p.name = 'Digital Transformation' THEN CURRENT_DATE - INTERVAL '90 days'
        WHEN p.name = 'Compliance Audit' THEN CURRENT_DATE - INTERVAL '45 days'
        WHEN p.name = 'Product Launch Q4' THEN CURRENT_DATE - INTERVAL '20 days'
        WHEN p.name = 'Security Upgrade' THEN CURRENT_DATE - INTERVAL '30 days'
        WHEN p.name = 'Training Program Rollout' THEN CURRENT_DATE - INTERVAL '15 days'
        WHEN p.name = 'Customer Portal Development' THEN CURRENT_DATE - INTERVAL '10 days'
        ELSE CURRENT_DATE
      END,
      p.due_date,
      CASE 
        WHEN p.name = 'ERP System Implementation' THEN 150
        WHEN p.name = 'Office Relocation' THEN 150
        WHEN p.name = 'Digital Transformation' THEN 270
        WHEN p.name = 'Compliance Audit' THEN 75
        WHEN p.name = 'Product Launch Q4' THEN 170
        WHEN p.name = 'Security Upgrade' THEN 90
        WHEN p.name = 'Training Program Rollout' THEN 60
        WHEN p.name = 'Customer Portal Development' THEN 210
        ELSE 100
      END,
      p.budget,
      CASE 
        WHEN p.name = 'ERP System Implementation' THEN 225000.00
        WHEN p.name = 'Office Relocation' THEN 112500.00
        WHEN p.name = 'Digital Transformation' THEN 720000.00
        WHEN p.name = 'Compliance Audit' THEN 112500.00
        WHEN p.name = 'Product Launch Q4' THEN 160000.00
        WHEN p.name = 'Security Upgrade' THEN 280000.00
        WHEN p.name = 'Training Program Rollout' THEN 80000.00
        WHEN p.name = 'Customer Portal Development' THEN 60000.00
        ELSE 0
      END,
      p.budget - CASE 
        WHEN p.name = 'ERP System Implementation' THEN 225000.00
        WHEN p.name = 'Office Relocation' THEN 112500.00
        WHEN p.name = 'Digital Transformation' THEN 720000.00
        WHEN p.name = 'Compliance Audit' THEN 112500.00
        WHEN p.name = 'Product Launch Q4' THEN 160000.00
        WHEN p.name = 'Security Upgrade' THEN 280000.00
        WHEN p.name = 'Training Program Rollout' THEN 80000.00
        WHEN p.name = 'Customer Portal Development' THEN 60000.00
        ELSE 0
      END,
      CASE 
        WHEN p.name = 'ERP System Implementation' THEN 225000.00 - p.budget
        WHEN p.name = 'Office Relocation' THEN 112500.00 - p.budget
        WHEN p.name = 'Digital Transformation' THEN 720000.00 - p.budget
        WHEN p.name = 'Compliance Audit' THEN 112500.00 - p.budget
        WHEN p.name = 'Product Launch Q4' THEN 160000.00 - p.budget
        WHEN p.name = 'Security Upgrade' THEN 280000.00 - p.budget
        WHEN p.name = 'Training Program Rollout' THEN 80000.00 - p.budget
        WHEN p.name = 'Customer Portal Development' THEN 60000.00 - p.budget
        ELSE 0
      END,
      v_pm_id,
      v_pm_name,
      v_sponsor_id,
      v_sponsor_name,
      CASE 
        WHEN p.name = 'ERP System Implementation' THEN 'Implement ERP to improve operational efficiency and reduce manual processes'
        WHEN p.name = 'Office Relocation' THEN 'Relocate to modern facility to improve working conditions and reduce costs'
        WHEN p.name = 'Digital Transformation' THEN 'Transform customer experience through digital channels'
        WHEN p.name = 'Compliance Audit' THEN 'Ensure compliance with industry regulations and standards'
        WHEN p.name = 'Product Launch Q4' THEN 'Launch new product line to capture market share'
        WHEN p.name = 'Security Upgrade' THEN 'Upgrade security infrastructure to protect against cyber threats'
        WHEN p.name = 'Training Program Rollout' THEN 'Roll out comprehensive training program for all employees'
        WHEN p.name = 'Customer Portal Development' THEN 'Develop self-service portal to improve customer experience'
        ELSE 'Project business case'
      END,
      CASE 
        WHEN p.name = 'ERP System Implementation' THEN 'ERP deployed successfully, 90% user adoption, 30% reduction in processing time'
        WHEN p.name = 'Office Relocation' THEN 'Successful relocation with zero downtime, 20% cost reduction'
        WHEN p.name = 'Digital Transformation' THEN 'Digital channels operational, 50% increase in customer satisfaction'
        WHEN p.name = 'Compliance Audit' THEN 'Audit passed, all findings addressed, certification renewed'
        WHEN p.name = 'Product Launch Q4' THEN 'Product launched on schedule, 1000 units sold in first month'
        WHEN p.name = 'Security Upgrade' THEN 'Security upgrade completed, zero security incidents'
        WHEN p.name = 'Training Program Rollout' THEN '90% completion rate, improved employee satisfaction scores'
        WHEN p.name = 'Customer Portal Development' THEN 'Portal launched, 50% reduction in support tickets'
        ELSE 'Project success criteria'
      END,
      v_creator_id,
      v_creator_name
    FROM public.projects p
    WHERE p.id = v_project_id
    ON CONFLICT (project_number) DO NOTHING
    RETURNING id INTO v_pmo_project_id;
    
    IF v_pmo_project_id IS NOT NULL THEN
      v_created_count := v_created_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Created % PMO projects', v_created_count;
END $$;

-- Continue with the rest of the seed file (milestones, risks, issues, etc.)
-- This is the same as the original 021_seed_pmo_data.sql file from line 265 onwards

