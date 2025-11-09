-- ============================================
-- AdminOS - Seed Hardcoded/Mocked Data
-- ============================================
-- This script migrates all hardcoded/mocked data from components
-- into the database tables for proper data persistence.
-- 
-- Data Sources:
-- - components/modules/asset-module.tsx
-- - components/modules/finance-module.tsx
-- - components/modules/projects-module.tsx
-- - components/modules/training-module.tsx
-- - components/modules/payroll-module.tsx
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ASSETS (from asset-module.tsx)
-- ============================================
-- Note: Assignee names will be matched to existing employees
-- If employee doesn't exist, assignee_id will be NULL

INSERT INTO public.assets (name, category, assignee_name, status, value, purchase_date, condition)
VALUES 
  ('MacBook Pro 16"', 'IT Equipment', 'Sarah Chen', 'In Use', 2499.00, '2023-03-15', 'Excellent'),
  ('Dell Monitor 27"', 'IT Equipment', 'Marcus Johnson', 'In Use', 450.00, '2022-11-20', 'Good'),
  ('Office Chair Pro', 'Furniture', 'Emily Rodriguez', 'In Use', 350.00, '2021-08-10', 'Fair'),
  ('Canon Printer', 'Office Equipment', NULL, 'Available', 800.00, '2021-05-30', 'Good'),
  ('Tesla Model 3', 'Vehicle', 'James Wilson', 'In Use', 45000.00, '2022-01-15', 'Excellent')
ON CONFLICT DO NOTHING;

-- Update assignee_id for assets where employee exists
UPDATE public.assets a
SET assignee_id = e.id
FROM public.employees e
WHERE a.assignee_name = e.name
  AND a.assignee_id IS NULL;

-- ============================================
-- 2. INVENTORY ITEMS (from asset-module.tsx)
-- ============================================

INSERT INTO public.inventory_items (name, category, stock, reorder_level, unit)
VALUES 
  ('A4 Paper (Reams)', 'Office Supplies', 250, 100, 'Reams'),
  ('Printer Ink Cartridges', 'Office Supplies', 45, 50, 'Units'),
  ('Office Supplies Bundle', 'Office Supplies', 80, 30, 'Bundles')
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. PROCUREMENT ORDERS (from asset-module.tsx)
-- ============================================

INSERT INTO public.procurement_orders (order_number, vendor, items_count, value, status, order_date)
VALUES 
  ('PO-001', 'TechSupply Inc', 5, 15000.00, 'Delivered', '2024-11-01'),
  ('PO-002', 'Office Furniture Ltd', 12, 8500.00, 'In Transit', '2024-10-28'),
  ('PO-003', 'IT Solutions Co', 8, 22000.00, 'Pending', '2024-10-25')
ON CONFLICT (order_number) DO UPDATE SET
  vendor = EXCLUDED.vendor,
  items_count = EXCLUDED.items_count,
  value = EXCLUDED.value,
  status = EXCLUDED.status,
  order_date = EXCLUDED.order_date;

-- ============================================
-- 4. ASSET MAINTENANCE SCHEDULE (from asset-module.tsx)
-- ============================================

INSERT INTO public.asset_maintenance (asset_id, maintenance_type, scheduled_date)
SELECT 
  a.id,
  CASE 
    WHEN a.name = 'Tesla Model 3' THEN 'Oil Change'
    WHEN a.name = 'Canon Printer' THEN 'Toner Replacement'
    WHEN a.name = 'MacBook Pro 16"' THEN 'Software Update'
    ELSE 'General Maintenance'
  END as maintenance_type,
  CASE 
    WHEN a.name = 'Tesla Model 3' THEN '2024-11-20'::DATE
    WHEN a.name = 'Canon Printer' THEN '2024-11-15'::DATE
    WHEN a.name = 'MacBook Pro 16"' THEN '2024-12-01'::DATE
    ELSE CURRENT_DATE + INTERVAL '30 days'
  END as scheduled_date
FROM public.assets a
WHERE a.name IN ('Tesla Model 3', 'Canon Printer', 'MacBook Pro 16"')
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. EXPENSES (from finance-module.tsx)
-- ============================================

INSERT INTO public.expenses (employee_id, employee_name, amount, category, date, status, description)
SELECT 
  e.id as employee_id,
  e.name as employee_name,
  exp_data.amount,
  exp_data.category,
  exp_data.date::DATE,
  exp_data.status,
  exp_data.description
FROM (VALUES
  ('Sarah Chen', 450.00, 'Travel', '2024-11-03', 'Pending', 'Flight to NYC client meeting'),
  ('Marcus Johnson', 230.00, 'Meals', '2024-11-02', 'Approved', 'Client lunch meeting'),
  ('Emily Rodriguez', 890.00, 'Software', '2024-11-01', 'Approved', 'Design tool subscription annual'),
  ('James Wilson', 125.00, 'Equipment', '2024-10-31', 'Pending', 'Keyboard and mouse'),
  ('Lisa Anderson', 65.00, 'Meals', '2024-10-30', 'Rejected', 'Personal meal')
) AS exp_data(employee_name, amount, category, date, status, description)
LEFT JOIN public.employees e ON e.name = exp_data.employee_name
WHERE e.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.expenses ex
    WHERE ex.employee_id = e.id
      AND ex.amount = exp_data.amount
      AND ex.date = exp_data.date::DATE
      AND ex.description = exp_data.description
  );

-- ============================================
-- 6. DEPARTMENT BUDGETS (from finance-module.tsx)
-- ============================================

INSERT INTO public.department_budgets (department, allocated, spent, period)
VALUES 
  ('Engineering', 50000.00, 48200.00, '2024'),
  ('Sales', 35000.00, 34100.00, '2024'),
  ('Marketing', 25000.00, 23500.00, '2024'),
  ('Operations', 15000.00, 15200.00, '2024')
ON CONFLICT (department) DO UPDATE SET
  allocated = EXCLUDED.allocated,
  spent = EXCLUDED.spent,
  period = EXCLUDED.period;

-- ============================================
-- 7. PROJECTS (from projects-module.tsx)
-- ============================================

INSERT INTO public.projects (name, department, status, progress, due_date, owner_name)
SELECT 
  proj_data.name,
  proj_data.department,
  proj_data.status,
  proj_data.progress,
  proj_data.due_date::DATE,
  proj_data.owner_name
FROM (VALUES
  ('Website Redesign', 'Engineering', 'In Progress', 65, '2024-12-15', 'Sarah Chen'),
  ('Q4 Sales Campaign', 'Marketing', 'In Progress', 45, '2024-11-30', 'Emily Rodriguez'),
  ('Mobile App Launch', 'Engineering', 'Planning', 20, '2025-01-31', 'Marcus Johnson'),
  ('Customer Portal', 'Engineering', 'Completed', 100, '2024-10-30', 'James Wilson'),
  ('Annual Compliance Audit', 'HR', 'In Progress', 75, '2024-11-20', 'Lisa Anderson')
) AS proj_data(name, department, status, progress, due_date, owner_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.projects p
  WHERE p.name = proj_data.name
    AND p.department = proj_data.department
);

-- Update owner_id for projects where employee exists
UPDATE public.projects p
SET owner_id = e.id
FROM public.employees e
WHERE p.owner_name = e.name
  AND p.owner_id IS NULL;

-- ============================================
-- 8. TRAINING PROGRAMS (from training-module.tsx)
-- ============================================

INSERT INTO public.training_programs (title, description, category, duration, enrolled_count, status)
VALUES 
  ('Leadership Essentials', 'Comprehensive leadership training program', 'Leadership', 4, 28, 'Active'),
  ('Technical Skills 2024', 'Advanced technical skills development', 'Technical', 6, 45, 'Active'),
  ('Customer Service Excellence', 'Customer service best practices', 'Customer Service', 3, 35, 'Completed'),
  ('Advanced Excel', 'Excel advanced features and functions', 'Technical', 2, 22, 'Active')
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. TRAINING ENROLLMENTS (from training-module.tsx)
-- ============================================
-- Note: Creating enrollments for employees mentioned in training plans

INSERT INTO public.training_enrollments (program_id, employee_id, status)
SELECT 
  tp.id as program_id,
  e.id as employee_id,
  CASE 
    WHEN tp.title = 'Customer Service Excellence' THEN 'completed'
    ELSE 'enrolled'
  END as status
FROM public.training_programs tp
CROSS JOIN public.employees e
WHERE (tp.title = 'Leadership Essentials' AND e.name = 'Sarah Chen')
   OR (tp.title = 'Advanced Excel' AND e.name = 'Sarah Chen')
   OR (tp.title = 'Customer Service Excellence' AND e.name = 'Marcus Johnson')
   OR (tp.title = 'Sales Excellence' AND e.name = 'Marcus Johnson')
   OR (tp.title = 'Marketing Analytics' AND e.name = 'Emily Rodriguez')
   OR (tp.title = 'Data Visualization' AND e.name = 'Emily Rodriguez')
ON CONFLICT (program_id, employee_id) DO NOTHING;

-- ============================================
-- 10. ADDITIONAL SAMPLE DATA
-- ============================================
-- Adding more sample data to make the system more realistic

-- Additional Assets
INSERT INTO public.assets (name, category, assignee_name, status, value, purchase_date, condition)
SELECT 
  'Laptop Dell XPS 15',
  'IT Equipment',
  e.name,
  'In Use',
  1299.00,
  CURRENT_DATE - INTERVAL '6 months',
  'Good'
FROM public.employees e
WHERE e.department = 'Information Technology'
LIMIT 3
ON CONFLICT DO NOTHING;

-- Additional Inventory Items
INSERT INTO public.inventory_items (name, category, stock, reorder_level, unit)
VALUES 
  ('Staples (Box)', 'Office Supplies', 150, 50, 'Boxes'),
  ('Pens (Pack)', 'Office Supplies', 200, 100, 'Packs'),
  ('Notebooks', 'Office Supplies', 75, 30, 'Units'),
  ('Toner Cartridges', 'Office Supplies', 30, 20, 'Units')
ON CONFLICT DO NOTHING;

-- Additional Projects
INSERT INTO public.projects (name, department, status, progress, due_date, owner_name)
SELECT 
  'Q1 2025 Planning',
  e.department,
  'Planning',
  15,
  CURRENT_DATE + INTERVAL '2 months',
  e.name
FROM public.employees e
WHERE e.department IN ('Engineering', 'Marketing', 'Sales')
LIMIT 3
ON CONFLICT DO NOTHING;

-- ============================================
-- SUMMARY
-- ============================================

DO $$
DECLARE
  v_assets_count INTEGER;
  v_inventory_count INTEGER;
  v_procurement_count INTEGER;
  v_expenses_count INTEGER;
  v_projects_count INTEGER;
  v_training_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_assets_count FROM public.assets;
  SELECT COUNT(*) INTO v_inventory_count FROM public.inventory_items;
  SELECT COUNT(*) INTO v_procurement_count FROM public.procurement_orders;
  SELECT COUNT(*) INTO v_expenses_count FROM public.expenses;
  SELECT COUNT(*) INTO v_projects_count FROM public.projects;
  SELECT COUNT(*) INTO v_training_count FROM public.training_programs;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Hardcoded Data Seeding Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Assets: %', v_assets_count;
  RAISE NOTICE 'Inventory Items: %', v_inventory_count;
  RAISE NOTICE 'Procurement Orders: %', v_procurement_count;
  RAISE NOTICE 'Expenses: %', v_expenses_count;
  RAISE NOTICE 'Projects: %', v_projects_count;
  RAISE NOTICE 'Training Programs: %', v_training_count;
  RAISE NOTICE '========================================';
END $$;

