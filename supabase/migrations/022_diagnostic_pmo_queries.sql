-- ============================================
-- DIAGNOSTIC QUERIES - Run these to check what data exists
-- ============================================

-- Check how many base projects exist
SELECT COUNT(*) as base_projects_count FROM public.projects 
WHERE name IN (
  'ERP System Implementation',
  'Office Relocation',
  'Digital Transformation',
  'Compliance Audit',
  'Product Launch Q4',
  'Security Upgrade',
  'Training Program Rollout',
  'Customer Portal Development'
);

-- List all base projects
SELECT id, name, department, status FROM public.projects 
WHERE name IN (
  'ERP System Implementation',
  'Office Relocation',
  'Digital Transformation',
  'Compliance Audit',
  'Product Launch Q4',
  'Security Upgrade',
  'Training Program Rollout',
  'Customer Portal Development'
);

-- Check how many PMO projects exist
SELECT COUNT(*) as pmo_projects_count FROM public.pmo_projects;

-- List all PMO projects
SELECT pp.project_number, p.name as project_name, pp.project_type, pp.priority, pp.health_indicator
FROM public.pmo_projects pp
LEFT JOIN public.projects p ON pp.project_id = p.id;

-- Check if users exist
SELECT COUNT(*) as pmo_users_count FROM public.user_profiles 
WHERE department = 'Project Management';

-- List PMO users
SELECT id, full_name, email, role FROM public.user_profiles 
WHERE department = 'Project Management';

