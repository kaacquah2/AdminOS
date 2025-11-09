-- ============================================
-- Administration / Operations - Complete Seed Data
-- ============================================
-- This migration creates comprehensive seed data for Administration / Operations department
-- Includes: Office Assets, Projects, Approval Requests, and Workflow Tasks
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
-- 1. OFFICE ASSETS
-- ============================================
-- Insert office-related assets (furniture, equipment, supplies)

INSERT INTO public.assets (name, category, status, value, purchase_date, condition, location, serial_number, notes, assignee_name)
VALUES 
  -- Office Furniture
  ('Executive Desk - Mahogany', 'Furniture', 'Assigned', 2500.00, '2021-03-15', 'Excellent', 'Building A, Floor 3, Office 301', 'DESK-EXEC-001', 'Executive office desk', 'Anthony Brown'),
  ('Conference Table - 12 Seater', 'Furniture', 'Available', 4500.00, '2020-06-20', 'Good', 'Building A, Floor 2, Conference Room 201', 'TBL-CONF-12-001', 'Large conference table', NULL),
  ('Conference Table - 8 Seater', 'Furniture', 'Available', 3200.00, '2020-06-20', 'Good', 'Building A, Floor 2, Conference Room 202', 'TBL-CONF-8-001', 'Medium conference table', NULL),
  ('Office Chair - Ergonomic', 'Furniture', 'Assigned', 450.00, '2022-01-10', 'Excellent', 'Building A, Floor 3, Office 301', 'CHR-ERG-001', 'Ergonomic office chair', 'Anthony Brown'),
  ('Office Chair - Ergonomic', 'Furniture', 'Assigned', 450.00, '2022-01-10', 'Excellent', 'Building A, Floor 2, Office 205', 'CHR-ERG-002', 'Ergonomic office chair', 'Grace Lee'),
  ('Filing Cabinet - 4 Drawer', 'Furniture', 'Assigned', 650.00, '2021-05-15', 'Good', 'Building A, Floor 2, Office 205', 'CAB-FILE-001', '4-drawer filing cabinet', 'Grace Lee'),
  ('Bookshelf - 5 Tier', 'Furniture', 'Available', 350.00, '2021-08-20', 'Good', 'Building A, Floor 2, Common Area', 'SHELF-5T-001', '5-tier bookshelf', NULL),
  ('Reception Desk', 'Furniture', 'Available', 2800.00, '2019-09-10', 'Good', 'Building A, Floor 1, Reception', 'DESK-REC-001', 'Main reception desk', NULL),
  
  -- Office Equipment
  ('Multifunction Printer - Canon', 'Office Equipment', 'Available', 1200.00, '2021-11-05', 'Good', 'Building A, Floor 2, Print Room', 'PRT-CAN-001', 'Canon multifunction printer', NULL),
  ('Multifunction Printer - HP', 'Office Equipment', 'Available', 1100.00, '2021-11-05', 'Good', 'Building B, Floor 1, Print Room', 'PRT-HP-001', 'HP multifunction printer', NULL),
  ('Projector - Epson', 'Office Equipment', 'Available', 850.00, '2020-04-15', 'Good', 'Building A, Floor 2, Conference Room 201', 'PROJ-EP-001', 'Epson projector for presentations', NULL),
  ('Projector - BenQ', 'Office Equipment', 'Available', 750.00, '2020-04-15', 'Good', 'Building A, Floor 2, Conference Room 202', 'PROJ-BQ-001', 'BenQ projector for presentations', NULL),
  ('Whiteboard - Mobile 4x6', 'Office Equipment', 'Available', 450.00, '2021-02-10', 'Excellent', 'Building A, Floor 2, Conference Room 201', 'WB-MOB-001', 'Mobile whiteboard', NULL),
  ('Whiteboard - Wall Mount 4x6', 'Office Equipment', 'Available', 380.00, '2021-02-10', 'Excellent', 'Building A, Floor 2, Conference Room 202', 'WB-WALL-001', 'Wall-mounted whiteboard', NULL),
  ('Telephone System - IP Phone', 'Office Equipment', 'Assigned', 250.00, '2022-03-01', 'Excellent', 'Building A, Floor 3, Office 301', 'PHN-IP-001', 'IP telephone system', 'Anthony Brown'),
  ('Telephone System - IP Phone', 'Office Equipment', 'Assigned', 250.00, '2022-03-01', 'Excellent', 'Building A, Floor 2, Office 205', 'PHN-IP-002', 'IP telephone system', 'Grace Lee'),
  
  -- Office Supplies
  ('Paper Shredder - Industrial', 'Office Equipment', 'Available', 650.00, '2021-07-20', 'Good', 'Building A, Floor 2, Storage Room', 'SHR-IND-001', 'Industrial paper shredder', NULL),
  ('Binding Machine', 'Office Equipment', 'Available', 320.00, '2021-09-15', 'Good', 'Building A, Floor 2, Storage Room', 'BIND-001', 'Document binding machine', NULL),
  ('Laminator', 'Office Equipment', 'Available', 280.00, '2021-09-15', 'Good', 'Building A, Floor 2, Storage Room', 'LAM-001', 'Document laminator', NULL),
  ('Label Maker', 'Office Equipment', 'Available', 150.00, '2022-01-05', 'Excellent', 'Building A, Floor 2, Office 205', 'LAB-001', 'Electronic label maker', NULL),
  
  -- IT Equipment (Admin managed)
  ('Laptop - Dell Latitude', 'IT Equipment', 'Assigned', 1200.00, '2022-06-10', 'Excellent', 'Building A, Floor 2, Office 205', 'LAP-DELL-ADM-001', 'Administration laptop', 'Grace Lee'),
  ('Monitor - Dell 27"', 'IT Equipment', 'Assigned', 450.00, '2022-06-10', 'Excellent', 'Building A, Floor 2, Office 205', 'MON-DELL-ADM-001', '27-inch monitor', 'Grace Lee'),
  ('Keyboard & Mouse Set', 'IT Equipment', 'Assigned', 85.00, '2022-06-10', 'Excellent', 'Building A, Floor 2, Office 205', 'KM-ADM-001', 'Wireless keyboard and mouse', 'Grace Lee')
ON CONFLICT DO NOTHING;

-- Update assignee_id for assets where employee exists
UPDATE public.assets a
SET assignee_id = e.id
FROM public.employees e
WHERE a.assignee_name = e.name
  AND a.assignee_id IS NULL;

-- ============================================
-- 2. ADMINISTRATION PROJECTS
-- ============================================

DO $$
DECLARE
  v_anthony_employee_id UUID;
BEGIN
  -- Get Anthony Brown employee ID
  SELECT get_employee_id_by_email('anthony.brown@company.com') INTO v_anthony_employee_id;

  -- Insert Administration projects
  INSERT INTO public.projects (name, department, status, progress, due_date, owner_id, owner_name, description, budget)
  VALUES
    ('Office Space Optimization Project', 'Administration', 'In Progress', 65, '2025-01-31', v_anthony_employee_id, 'Anthony Brown',
     'Optimize office space utilization across both buildings. Includes space planning, furniture rearrangement, and efficiency improvements. Goal is to increase capacity by 20% without additional space.', 85000.00),
    
    ('Digital Document Management System', 'Administration', 'In Progress', 45, '2025-02-28', v_anthony_employee_id, 'Anthony Brown',
     'Implement comprehensive digital document management system. Includes scanning, indexing, and cloud storage for all administrative documents. Reduces paper usage by 80%.', 125000.00),
    
    ('Office Supplies Procurement Automation', 'Administration', 'Planning', 20, '2025-03-31', v_anthony_employee_id, 'Anthony Brown',
     'Automate office supplies procurement process. Includes vendor integration, automated reordering, and inventory tracking. Reduces procurement time by 60%.', 45000.00),
    
    ('Reception Area Renovation', 'Administration', 'In Progress', 75, '2024-12-31', v_anthony_employee_id, 'Anthony Brown',
     'Renovate main reception area in Building A. Includes new furniture, lighting, and branding elements. Improves first impression for visitors.', 35000.00),
    
    ('Conference Room Technology Upgrade', 'Administration', 'Completed', 100, '2024-10-15', v_anthony_employee_id, 'Anthony Brown',
     'Upgrade all conference rooms with modern AV equipment. Includes new projectors, sound systems, and video conferencing capabilities.', 65000.00),
    
    ('Office Security Access System', 'Administration', 'In Progress', 55, '2025-01-15', v_anthony_employee_id, 'Anthony Brown',
     'Implement new access control system for office areas. Includes card readers, visitor management, and integration with existing security systems.', 95000.00),
    
    ('Employee Break Room Enhancement', 'Administration', 'Planning', 10, '2025-04-30', v_anthony_employee_id, 'Anthony Brown',
     'Enhance employee break rooms with new appliances, furniture, and amenities. Improves employee satisfaction and workplace culture.', 28000.00),
    
    ('Administrative Process Automation', 'Administration', 'In Progress', 40, '2025-03-15', v_anthony_employee_id, 'Anthony Brown',
     'Automate routine administrative processes. Includes workflow automation, approval routing, and reporting. Reduces manual work by 50%.', 75000.00);
END $$;

-- ============================================
-- 3. APPROVAL REQUESTS
-- ============================================

DO $$
DECLARE
  v_anthony_id UUID;
  v_grace_id UUID;
  v_carlos_id UUID;
  v_megan_id UUID;
  v_raj_id UUID;
  v_employee1_id UUID;
  v_employee2_id UUID;
BEGIN
  -- Get user profile IDs
  SELECT get_user_profile_id_by_email('anthony.brown@company.com') INTO v_anthony_id;
  SELECT get_user_profile_id_by_email('grace.lee@company.com') INTO v_grace_id;
  SELECT get_user_profile_id_by_email('carlos.gomez@company.com') INTO v_carlos_id;
  SELECT get_user_profile_id_by_email('megan.white@company.com') INTO v_megan_id;
  SELECT get_user_profile_id_by_email('raj.kumar@company.com') INTO v_raj_id;
  
  -- Get some employee IDs for requesters (using other departments)
  SELECT get_employee_id_by_email('sarah.chen@company.com') INTO v_employee1_id;
  SELECT get_employee_id_by_email('marcus.johnson@company.com') INTO v_employee2_id;

  -- Insert approval requests
  INSERT INTO public.approval_requests (request_type, requested_by, status, amount, description, details)
  VALUES
    ('asset_request', v_employee1_id, 'pending', 450.00, 'Request for ergonomic office chair', '{"asset_type": "Office Chair", "reason": "Current chair causing back pain", "priority": "medium"}'::jsonb),
    ('asset_request', v_employee2_id, 'pending', 850.00, 'Request for standing desk', '{"asset_type": "Standing Desk", "reason": "Health and ergonomics", "priority": "low"}'::jsonb),
    ('project_approval', v_anthony_id, 'pending', 50000.00, 'Approval for office renovation project', '{"project_name": "Office Renovation Phase 2", "department": "Administration", "priority": "high"}'::jsonb),
    ('budget_approval', v_anthony_id, 'pending', 25000.00, 'Additional budget for supplies procurement', '{"category": "Office Supplies", "reason": "Increased demand", "priority": "medium"}'::jsonb),
    ('asset_request', v_carlos_id, 'pending', 1200.00, 'Request for new multifunction printer', '{"asset_type": "Printer", "reason": "Current printer outdated", "priority": "high"}'::jsonb),
    ('project_approval', v_grace_id, 'pending', 35000.00, 'Approval for break room enhancement project', '{"project_name": "Break Room Enhancement", "department": "Administration", "priority": "medium"}'::jsonb),
    ('budget_approval', v_anthony_id, 'pending', 15000.00, 'Budget for office furniture replacement', '{"category": "Furniture", "reason": "Wear and tear replacement", "priority": "low"}'::jsonb),
    ('asset_request', v_megan_id, 'pending', 320.00, 'Request for binding machine', '{"asset_type": "Binding Machine", "reason": "Document preparation needs", "priority": "low"}'::jsonb);
END $$;

-- ============================================
-- 4. WORKFLOW TASKS
-- ============================================

DO $$
DECLARE
  v_anthony_id UUID;
  v_grace_id UUID;
  v_carlos_id UUID;
  v_megan_id UUID;
  v_raj_id UUID;
BEGIN
  -- Get user profile IDs
  SELECT get_user_profile_id_by_email('anthony.brown@company.com') INTO v_anthony_id;
  SELECT get_user_profile_id_by_email('grace.lee@company.com') INTO v_grace_id;
  SELECT get_user_profile_id_by_email('carlos.gomez@company.com') INTO v_carlos_id;
  SELECT get_user_profile_id_by_email('megan.white@company.com') INTO v_megan_id;
  SELECT get_user_profile_id_by_email('raj.kumar@company.com') INTO v_raj_id;

  -- Active Tasks
  INSERT INTO public.workflow_tasks (title, description, department, status, priority, assigned_to, assigned_by, due_date)
  VALUES
    ('Office Space Audit - Building A', 'Conduct comprehensive audit of office space utilization in Building A. Document current usage and identify optimization opportunities.', 'Administration', 'in_progress', 'high', v_grace_id, v_anthony_id, CURRENT_DATE + INTERVAL '7 days'),
    ('Vendor Contract Review', 'Review and renew contracts with office supply vendors. Compare pricing and negotiate better terms.', 'Administration', 'pending', 'medium', v_carlos_id, v_anthony_id, CURRENT_DATE + INTERVAL '14 days'),
    ('Document Scanning Project - Phase 1', 'Begin scanning and digitizing historical documents. Focus on HR and Finance documents first.', 'Administration', 'in_progress', 'medium', v_megan_id, v_grace_id, CURRENT_DATE + INTERVAL '21 days'),
    ('Conference Room Booking System Setup', 'Set up and configure new conference room booking system. Train staff on usage.', 'Administration', 'pending', 'high', v_carlos_id, v_anthony_id, CURRENT_DATE + INTERVAL '10 days'),
    ('Office Supplies Inventory Count', 'Conduct quarterly inventory count of all office supplies. Update inventory records.', 'Administration', 'pending', 'medium', v_raj_id, v_grace_id, CURRENT_DATE + INTERVAL '5 days'),
    ('Visitor Management System Training', 'Train reception staff on new visitor management system. Create user guides.', 'Administration', 'pending', 'medium', v_megan_id, v_grace_id, CURRENT_DATE + INTERVAL '7 days'),
    ('Break Room Equipment Maintenance', 'Schedule maintenance for break room appliances. Coordinate with Facilities department.', 'Administration', 'pending', 'low', v_raj_id, v_grace_id, CURRENT_DATE + INTERVAL '30 days'),
    ('Administrative Process Documentation', 'Document all administrative processes and create standard operating procedures.', 'Administration', 'in_progress', 'medium', v_grace_id, v_anthony_id, CURRENT_DATE + INTERVAL '21 days'),
    ('Office Furniture Relocation', 'Coordinate relocation of office furniture for space optimization project.', 'Administration', 'pending', 'high', v_carlos_id, v_anthony_id, CURRENT_DATE + INTERVAL '3 days'),
    ('Vendor Performance Evaluation', 'Evaluate performance of current vendors. Prepare vendor scorecards.', 'Administration', 'pending', 'low', v_carlos_id, v_anthony_id, CURRENT_DATE + INTERVAL '45 days');

  -- Completed Tasks
  INSERT INTO public.workflow_tasks (title, description, department, status, priority, assigned_to, assigned_by, due_date, completed_at)
  VALUES
    ('Conference Room AV Installation', 'Install new AV equipment in all conference rooms. System tested and operational.', 'Administration', 'completed', 'high', v_carlos_id, v_anthony_id, '2024-10-10', '2024-10-10 16:00:00'),
    ('Office Supplies Procurement - Q4', 'Complete Q4 office supplies procurement. All items received and distributed.', 'Administration', 'completed', 'medium', v_grace_id, v_anthony_id, '2024-10-15', '2024-10-15 14:30:00'),
    ('Reception Area Furniture Delivery', 'Coordinate delivery and setup of new reception area furniture.', 'Administration', 'completed', 'medium', v_megan_id, v_grace_id, '2024-10-20', '2024-10-20 11:00:00'),
    ('Access Control System Testing', 'Test new access control system. All card readers operational.', 'Administration', 'completed', 'high', v_carlos_id, v_anthony_id, '2024-10-25', '2024-10-25 15:45:00');
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
-- SELECT COUNT(*) as office_assets FROM public.assets WHERE category IN ('Furniture', 'Office Equipment', 'Supplies');
-- SELECT COUNT(*) as projects FROM public.projects WHERE department = 'Administration';
-- SELECT COUNT(*) as approval_requests FROM public.approval_requests WHERE status = 'pending';
-- SELECT COUNT(*) as workflow_tasks FROM public.workflow_tasks WHERE department = 'Administration';

