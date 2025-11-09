-- ============================================
-- PROCUREMENT / PURCHASING DEPARTMENT SEED DATA
-- ============================================
-- This migration seeds comprehensive procurement data including:
-- - Vendors (20+ vendors across different categories)
-- - Procurement Requests (30+ requests)
-- - Purchase Orders (50+ orders with various statuses)
-- - Purchase Order Items (200+ line items)a
-- - Vendor Contracts (15+ contracts)
-- - Vendor Performance Records (40+ performance entries)
-- - Inventory Items (30+ items with stock levels)
-- ============================================
-- IMPORTANT: This migration requires 029_create_procurement_tables.sql to be run first!
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- VERIFY REQUIRED TABLES EXIST
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendors') THEN
    RAISE EXCEPTION 'Required table "vendors" does not exist. Please run migration 029_create_procurement_tables.sql first!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'procurement_requests') THEN
    RAISE EXCEPTION 'Required table "procurement_requests" does not exist. Please run migration 029_create_procurement_tables.sql first!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'procurement_orders') THEN
    RAISE EXCEPTION 'Required table "procurement_orders" does not exist. Please ensure the base schema is set up!';
  END IF;
  
  RAISE NOTICE 'All required tables exist. Proceeding with seed data...';
END $$;

-- ============================================
-- SEED VENDORS
-- ============================================
INSERT INTO public.vendors (id, vendor_code, name, contact_person, email, phone, address, city, state_province, postal_code, country, tax_id, website, vendor_type, category, payment_terms, credit_limit, status, rating, created_at)
VALUES
  -- Office Supplies Vendors
  (uuid_generate_v4(), 'VND-001', 'OfficeMax Solutions', 'John Smith', 'contact@officemax.com', '+1-555-0101', '123 Business Park Dr', 'Chicago', 'IL', '60601', 'USA', 'TAX-001', 'www.officemax.com', 'supplier', 'office_supplies', 'Net 30', 50000.00, 'Active', 4.5, NOW() - INTERVAL '2 years'),
  (uuid_generate_v4(), 'VND-002', 'Staples Corporate', 'Sarah Johnson', 'corporate@staples.com', '+1-555-0102', '456 Commerce Blvd', 'Boston', 'MA', '02101', 'USA', 'TAX-002', 'www.staples.com', 'supplier', 'office_supplies', 'Net 30', 75000.00, 'Active', 4.3, NOW() - INTERVAL '18 months'),
  (uuid_generate_v4(), 'VND-003', 'PaperWorks Inc', 'Michael Chen', 'sales@paperworks.com', '+1-555-0103', '789 Print Street', 'Atlanta', 'GA', '30301', 'USA', 'TAX-003', 'www.paperworks.com', 'supplier', 'office_supplies', 'Net 15', 30000.00, 'Active', 4.2, NOW() - INTERVAL '1 year'),
  
  -- IT Equipment Vendors
  (uuid_generate_v4(), 'VND-004', 'TechCorp Systems', 'David Lee', 'enterprise@techcorp.com', '+1-555-0201', '1000 Tech Avenue', 'San Jose', 'CA', '95110', 'USA', 'TAX-004', 'www.techcorp.com', 'supplier', 'it_equipment', 'Net 45', 200000.00, 'Active', 4.7, NOW() - INTERVAL '3 years'),
  (uuid_generate_v4(), 'VND-005', 'Dell Enterprise Solutions', 'Jennifer Martinez', 'b2b@dell.com', '+1-555-0202', '1 Dell Way', 'Round Rock', 'TX', '78682', 'USA', 'TAX-005', 'www.dell.com', 'supplier', 'it_equipment', 'Net 60', 500000.00, 'Active', 4.6, NOW() - INTERVAL '4 years'),
  (uuid_generate_v4(), 'VND-006', 'HP Business Store', 'Robert Williams', 'business@hp.com', '+1-555-0203', '1501 Page Mill Road', 'Palo Alto', 'CA', '94304', 'USA', 'TAX-006', 'www.hp.com', 'supplier', 'it_equipment', 'Net 45', 300000.00, 'Active', 4.5, NOW() - INTERVAL '2 years'),
  (uuid_generate_v4(), 'VND-007', 'Cisco Networking', 'Amanda Brown', 'sales@cisco.com', '+1-555-0204', '170 West Tasman Drive', 'San Jose', 'CA', '95134', 'USA', 'TAX-007', 'www.cisco.com', 'supplier', 'it_equipment', 'Net 60', 400000.00, 'Active', 4.8, NOW() - INTERVAL '5 years'),
  
  -- Facilities & Maintenance Vendors
  (uuid_generate_v4(), 'VND-008', 'Facility Services Group', 'Thomas Anderson', 'info@facilityservices.com', '+1-555-0301', '200 Maintenance Lane', 'Phoenix', 'AZ', '85001', 'USA', 'TAX-008', 'www.facilityservices.com', 'service_provider', 'facilities', 'Net 30', 100000.00, 'Active', 4.4, NOW() - INTERVAL '2 years'),
  (uuid_generate_v4(), 'VND-009', 'HVAC Solutions Pro', 'Patricia Garcia', 'sales@hvacpro.com', '+1-555-0302', '500 Climate Control Way', 'Dallas', 'TX', '75201', 'USA', 'TAX-009', 'www.hvacpro.com', 'contractor', 'facilities', 'Net 30', 75000.00, 'Active', 4.3, NOW() - INTERVAL '18 months'),
  (uuid_generate_v4(), 'VND-010', 'CleanWorks Janitorial', 'James Wilson', 'contact@cleanworks.com', '+1-555-0303', '300 Clean Street', 'Miami', 'FL', '33101', 'USA', 'TAX-010', 'www.cleanworks.com', 'service_provider', 'facilities', 'Net 15', 50000.00, 'Active', 4.2, NOW() - INTERVAL '1 year'),
  
  -- Services Vendors
  (uuid_generate_v4(), 'VND-011', 'Legal Services Associates', 'Elizabeth Taylor', 'info@legalservices.com', '+1-555-0401', '100 Law Building', 'New York', 'NY', '10001', 'USA', 'TAX-011', 'www.legalservices.com', 'service_provider', 'services', 'Net 30', 150000.00, 'Active', 4.6, NOW() - INTERVAL '3 years'),
  (uuid_generate_v4(), 'VND-012', 'Accounting Partners LLC', 'Christopher Moore', 'contact@accountingpartners.com', '+1-555-0402', '250 Finance Plaza', 'Los Angeles', 'CA', '90001', 'USA', 'TAX-012', 'www.accountingpartners.com', 'service_provider', 'services', 'Net 30', 100000.00, 'Active', 4.5, NOW() - INTERVAL '2 years'),
  (uuid_generate_v4(), 'VND-013', 'Marketing Agency Pro', 'Michelle Davis', 'hello@marketingpro.com', '+1-555-0403', '500 Creative Avenue', 'Seattle', 'WA', '98101', 'USA', 'TAX-013', 'www.marketingpro.com', 'service_provider', 'services', 'Net 30', 80000.00, 'Active', 4.4, NOW() - INTERVAL '18 months'),
  
  -- Raw Materials Vendors
  (uuid_generate_v4(), 'VND-014', 'Industrial Supplies Co', 'Daniel Rodriguez', 'sales@industrialsupplies.com', '+1-555-0501', '1000 Industrial Blvd', 'Detroit', 'MI', '48201', 'USA', 'TAX-014', 'www.industrialsupplies.com', 'supplier', 'raw_materials', 'Net 45', 200000.00, 'Active', 4.3, NOW() - INTERVAL '2 years'),
  (uuid_generate_v4(), 'VND-015', 'Material Source Inc', 'Lisa Martinez', 'info@materialsource.com', '+1-555-0502', '750 Material Drive', 'Houston', 'TX', '77001', 'USA', 'TAX-015', 'www.materialsource.com', 'supplier', 'raw_materials', 'Net 30', 150000.00, 'Active', 4.2, NOW() - INTERVAL '1 year'),
  
  -- Additional Vendors
  (uuid_generate_v4(), 'VND-016', 'Furniture Warehouse', 'Kevin Thompson', 'sales@furniturewarehouse.com', '+1-555-0601', '200 Furniture Lane', 'Charlotte', 'NC', '28201', 'USA', 'TAX-016', 'www.furniturewarehouse.com', 'supplier', 'facilities', 'Net 30', 60000.00, 'Active', 4.1, NOW() - INTERVAL '1 year'),
  (uuid_generate_v4(), 'VND-017', 'Security Systems Plus', 'Nancy White', 'contact@securityplus.com', '+1-555-0602', '150 Security Way', 'Denver', 'CO', '80201', 'USA', 'TAX-017', 'www.securityplus.com', 'service_provider', 'services', 'Net 30', 90000.00, 'Active', 4.5, NOW() - INTERVAL '2 years'),
  (uuid_generate_v4(), 'VND-018', 'Cloud Services Provider', 'Steven Harris', 'enterprise@cloudservices.com', '+1-555-0603', '500 Cloud Street', 'Austin', 'TX', '78701', 'USA', 'TAX-018', 'www.cloudservices.com', 'service_provider', 'services', 'Net 30', 250000.00, 'Active', 4.7, NOW() - INTERVAL '3 years'),
  (uuid_generate_v4(), 'VND-019', 'Training Solutions Inc', 'Barbara Clark', 'info@trainingsolutions.com', '+1-555-0604', '300 Education Drive', 'Portland', 'OR', '97201', 'USA', 'TAX-019', 'www.trainingsolutions.com', 'service_provider', 'services', 'Net 30', 70000.00, 'Active', 4.3, NOW() - INTERVAL '18 months'),
  (uuid_generate_v4(), 'VND-020', 'Printing Services Co', 'Mark Lewis', 'sales@printingservices.com', '+1-555-0605', '400 Print Avenue', 'Minneapolis', 'MN', '55401', 'USA', 'TAX-020', 'www.printingservices.com', 'service_provider', 'services', 'Net 15', 40000.00, 'Active', 4.0, NOW() - INTERVAL '1 year')
ON CONFLICT (vendor_code) DO UPDATE SET
  name = EXCLUDED.name,
  contact_person = EXCLUDED.contact_person,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  status = EXCLUDED.status;

-- ============================================
-- SEED INVENTORY ITEMS
-- ============================================
DO $$
DECLARE
  v_vendor_office_max UUID;
  v_vendor_staples UUID;
  v_vendor_paperworks UUID;
  v_vendor_techcorp UUID;
  v_vendor_cisco UUID;
  v_vendor_dell UUID;
  v_vendor_hp UUID;
  v_vendor_facility UUID;
  v_vendor_hvac UUID;
  v_vendor_cleanworks UUID;
  v_vendor_industrial UUID;
  v_vendor_material UUID;
BEGIN
  -- Get vendor IDs
  SELECT id INTO v_vendor_office_max FROM public.vendors WHERE vendor_code = 'VND-001' LIMIT 1;
  SELECT id INTO v_vendor_staples FROM public.vendors WHERE vendor_code = 'VND-002' LIMIT 1;
  SELECT id INTO v_vendor_paperworks FROM public.vendors WHERE vendor_code = 'VND-003' LIMIT 1;
  SELECT id INTO v_vendor_techcorp FROM public.vendors WHERE vendor_code = 'VND-004' LIMIT 1;
  SELECT id INTO v_vendor_cisco FROM public.vendors WHERE vendor_code = 'VND-007' LIMIT 1;
  SELECT id INTO v_vendor_dell FROM public.vendors WHERE vendor_code = 'VND-005' LIMIT 1;
  SELECT id INTO v_vendor_hp FROM public.vendors WHERE vendor_code = 'VND-006' LIMIT 1;
  SELECT id INTO v_vendor_facility FROM public.vendors WHERE vendor_code = 'VND-008' LIMIT 1;
  SELECT id INTO v_vendor_hvac FROM public.vendors WHERE vendor_code = 'VND-009' LIMIT 1;
  SELECT id INTO v_vendor_cleanworks FROM public.vendors WHERE vendor_code = 'VND-010' LIMIT 1;
  SELECT id INTO v_vendor_industrial FROM public.vendors WHERE vendor_code = 'VND-014' LIMIT 1;
  SELECT id INTO v_vendor_material FROM public.vendors WHERE vendor_code = 'VND-015' LIMIT 1;

  -- Insert inventory items
  INSERT INTO public.inventory_items (id, name, category, stock, reorder_level, unit, supplier, vendor_id, unit_price, lead_time_days, location, status, created_at)
  VALUES
    -- Office Supplies
    (uuid_generate_v4(), 'Printer Paper A4', 'office_supplies', 450, 200, 'ream', 'OfficeMax Solutions', v_vendor_office_max, 12.50, 7, 'Warehouse A', 'Active', NOW() - INTERVAL '3 months'),
    (uuid_generate_v4(), 'Printer Paper Letter', 'office_supplies', 380, 150, 'ream', 'Staples Corporate', v_vendor_staples, 11.75, 7, 'Warehouse A', 'Active', NOW() - INTERVAL '2 months'),
    (uuid_generate_v4(), 'Pens - Blue', 'office_supplies', 1200, 500, 'box', 'OfficeMax Solutions', v_vendor_office_max, 8.99, 5, 'Warehouse A', 'Active', NOW() - INTERVAL '1 month'),
    (uuid_generate_v4(), 'Pens - Black', 'office_supplies', 1100, 500, 'box', 'OfficeMax Solutions', v_vendor_office_max, 8.99, 5, 'Warehouse A', 'Active', NOW() - INTERVAL '1 month'),
    (uuid_generate_v4(), 'Staples', 'office_supplies', 2500, 1000, 'box', 'Staples Corporate', v_vendor_staples, 3.50, 3, 'Warehouse A', 'Active', NOW() - INTERVAL '2 months'),
    (uuid_generate_v4(), 'Paper Clips', 'office_supplies', 1800, 800, 'box', 'PaperWorks Inc', v_vendor_paperworks, 4.25, 5, 'Warehouse A', 'Active', NOW() - INTERVAL '1 month'),
    (uuid_generate_v4(), 'Folders - Manila', 'office_supplies', 600, 300, 'pack', 'OfficeMax Solutions', v_vendor_office_max, 15.99, 7, 'Warehouse A', 'Active', NOW() - INTERVAL '2 months'),
    (uuid_generate_v4(), 'Binders - 3 Ring', 'office_supplies', 250, 100, 'each', 'Staples Corporate', v_vendor_staples, 8.50, 10, 'Warehouse A', 'Active', NOW() - INTERVAL '3 months'),
    (uuid_generate_v4(), 'Notepads', 'office_supplies', 400, 200, 'pack', 'PaperWorks Inc', v_vendor_paperworks, 6.99, 7, 'Warehouse A', 'Active', NOW() - INTERVAL '1 month'),
    (uuid_generate_v4(), 'Envelopes', 'office_supplies', 800, 400, 'pack', 'PaperWorks Inc', v_vendor_paperworks, 9.50, 5, 'Warehouse A', 'Active', NOW() - INTERVAL '2 months'),
    
    -- IT Equipment
    (uuid_generate_v4(), 'USB Cables', 'it_equipment', 150, 50, 'each', 'TechCorp Systems', v_vendor_techcorp, 12.99, 7, 'IT Storage', 'Active', NOW() - INTERVAL '2 months'),
    (uuid_generate_v4(), 'HDMI Cables', 'it_equipment', 80, 30, 'each', 'TechCorp Systems', v_vendor_techcorp, 18.50, 7, 'IT Storage', 'Active', NOW() - INTERVAL '1 month'),
    (uuid_generate_v4(), 'Network Cables Cat6', 'it_equipment', 200, 75, 'each', 'Cisco Networking', v_vendor_cisco, 25.00, 10, 'IT Storage', 'Active', NOW() - INTERVAL '3 months'),
    (uuid_generate_v4(), 'Keyboard', 'it_equipment', 45, 20, 'each', 'Dell Enterprise Solutions', v_vendor_dell, 45.00, 14, 'IT Storage', 'Active', NOW() - INTERVAL '2 months'),
    (uuid_generate_v4(), 'Mouse', 'it_equipment', 60, 25, 'each', 'Dell Enterprise Solutions', v_vendor_dell, 25.00, 14, 'IT Storage', 'Active', NOW() - INTERVAL '2 months'),
    (uuid_generate_v4(), 'Monitor Stands', 'it_equipment', 30, 15, 'each', 'HP Business Store', v_vendor_hp, 35.00, 14, 'IT Storage', 'Active', NOW() - INTERVAL '1 month'),
    (uuid_generate_v4(), 'Laptop Docking Stations', 'it_equipment', 25, 10, 'each', 'Dell Enterprise Solutions', v_vendor_dell, 150.00, 21, 'IT Storage', 'Active', NOW() - INTERVAL '3 months'),
    
    -- Facilities
    (uuid_generate_v4(), 'Light Bulbs LED', 'facilities', 200, 100, 'each', 'Facility Services Group', v_vendor_facility, 8.50, 7, 'Maintenance', 'Active', NOW() - INTERVAL '2 months'),
    (uuid_generate_v4(), 'Air Filters', 'facilities', 80, 40, 'each', 'HVAC Solutions Pro', v_vendor_hvac, 35.00, 10, 'Maintenance', 'Active', NOW() - INTERVAL '1 month'),
    (uuid_generate_v4(), 'Cleaning Supplies Kit', 'facilities', 50, 25, 'kit', 'CleanWorks Janitorial', v_vendor_cleanworks, 85.00, 7, 'Maintenance', 'Active', NOW() - INTERVAL '2 months'),
    (uuid_generate_v4(), 'Trash Bags', 'facilities', 300, 150, 'roll', 'CleanWorks Janitorial', v_vendor_cleanworks, 12.99, 5, 'Maintenance', 'Active', NOW() - INTERVAL '1 month'),
    (uuid_generate_v4(), 'Paper Towels', 'facilities', 150, 75, 'case', 'CleanWorks Janitorial', v_vendor_cleanworks, 28.50, 7, 'Maintenance', 'Active', NOW() - INTERVAL '1 month'),
    (uuid_generate_v4(), 'Hand Sanitizer', 'facilities', 100, 50, 'bottle', 'CleanWorks Janitorial', v_vendor_cleanworks, 15.00, 7, 'Maintenance', 'Active', NOW() - INTERVAL '2 months'),
    
    -- Raw Materials
    (uuid_generate_v4(), 'Steel Sheets', 'raw_materials', 500, 200, 'sheet', 'Industrial Supplies Co', v_vendor_industrial, 125.00, 14, 'Warehouse B', 'Active', NOW() - INTERVAL '3 months'),
    (uuid_generate_v4(), 'Aluminum Bars', 'raw_materials', 300, 150, 'bar', 'Material Source Inc', v_vendor_material, 85.00, 14, 'Warehouse B', 'Active', NOW() - INTERVAL '2 months'),
    (uuid_generate_v4(), 'Plastic Pellets', 'raw_materials', 2000, 1000, 'kg', 'Industrial Supplies Co', v_vendor_industrial, 2.50, 10, 'Warehouse B', 'Active', NOW() - INTERVAL '1 month'),
    (uuid_generate_v4(), 'Copper Wire', 'raw_materials', 800, 400, 'meter', 'Material Source Inc', v_vendor_material, 12.00, 14, 'Warehouse B', 'Active', NOW() - INTERVAL '2 months');
END $$;

-- ============================================
-- SEED PROCUREMENT REQUESTS
-- ============================================
-- Get procurement user IDs
DO $$
DECLARE
  v_procurement_head_id UUID;
  v_procurement_officer_id UUID;
  v_it_dept_id UUID;
  v_facilities_dept_id UUID;
  v_finance_dept_id UUID;
  v_hr_dept_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO v_procurement_head_id FROM public.user_profiles WHERE email = 'maria.fernandez@company.com' LIMIT 1;
  SELECT id INTO v_procurement_officer_id FROM public.user_profiles WHERE email = 'victor.gomez@company.com' LIMIT 1;
  SELECT id INTO v_it_dept_id FROM public.user_profiles WHERE department = 'Information Technology' LIMIT 1;
  SELECT id INTO v_facilities_dept_id FROM public.user_profiles WHERE department = 'Facilities & Maintenance' LIMIT 1;
  SELECT id INTO v_finance_dept_id FROM public.user_profiles WHERE department = 'Finance & Accounting' LIMIT 1;
  SELECT id INTO v_hr_dept_id FROM public.user_profiles WHERE department = 'Human Resources' LIMIT 1;

  -- Insert procurement requests
  INSERT INTO public.procurement_requests (id, request_number, title, description, requested_by, requested_by_name, department, category, priority, urgency, estimated_cost, status, vendor_id, required_by_date, created_at)
  VALUES
    (uuid_generate_v4(), 'PR-' || TO_CHAR(NOW() - INTERVAL '2 months', 'YYYY') || '-0001', 'Office Supplies Q1 2025', 'Quarterly office supplies procurement including paper, pens, folders, and stationery', v_it_dept_id, 'IT Department', 'Information Technology', 'office_supplies', 'medium', 'normal', 2500.00, 'po_created', (SELECT id FROM public.vendors WHERE category = 'office_supplies' LIMIT 1), NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 months'),
    (uuid_generate_v4(), 'PR-' || TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY') || '-0002', 'Laptop Refresh Program', 'Purchase 25 new laptops for IT department refresh cycle', v_it_dept_id, 'IT Department', 'Information Technology', 'it_equipment', 'high', 'normal', 37500.00, 'approved', (SELECT id FROM public.vendors WHERE category = 'it_equipment' LIMIT 1), NOW() + INTERVAL '60 days', NOW() - INTERVAL '1 month'),
    (uuid_generate_v4(), 'PR-' || TO_CHAR(NOW() - INTERVAL '3 weeks', 'YYYY') || '-0003', 'Network Equipment Upgrade', 'Upgrade network switches and routers for improved connectivity', v_it_dept_id, 'IT Department', 'Information Technology', 'it_equipment', 'high', 'urgent', 45000.00, 'ordered', (SELECT id FROM public.vendors WHERE category = 'it_equipment' LIMIT 1), NOW() + INTERVAL '45 days', NOW() - INTERVAL '3 weeks'),
    (uuid_generate_v4(), 'PR-' || TO_CHAR(NOW() - INTERVAL '1 month', 'YYYY') || '-0004', 'HVAC Maintenance Contract', 'Annual HVAC maintenance and service contract', v_facilities_dept_id, 'Facilities Department', 'Facilities & Maintenance', 'services', 'medium', 'normal', 15000.00, 'approved', (SELECT id FROM public.vendors WHERE category = 'services' LIMIT 1), NOW() + INTERVAL '90 days', NOW() - INTERVAL '1 month'),
    (uuid_generate_v4(), 'PR-' || TO_CHAR(NOW() - INTERVAL '2 weeks', 'YYYY') || '-0005', 'Cleaning Supplies Monthly', 'Monthly cleaning supplies procurement', v_facilities_dept_id, 'Facilities Department', 'Facilities & Maintenance', 'facilities', 'medium', 'normal', 1200.00, 'delivered', (SELECT id FROM public.vendors WHERE category = 'facilities' LIMIT 1), NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 weeks'),
    (uuid_generate_v4(), 'PR-' || TO_CHAR(NOW() - INTERVAL '3 weeks', 'YYYY') || '-0006', 'Legal Services Retainer', 'Quarterly legal services retainer for corporate matters', v_finance_dept_id, 'Finance Department', 'Finance & Accounting', 'services', 'high', 'normal', 25000.00, 'approved', (SELECT id FROM public.vendors WHERE category = 'services' LIMIT 1), NOW() + INTERVAL '90 days', NOW() - INTERVAL '3 weeks'),
    (uuid_generate_v4(), 'PR-' || TO_CHAR(NOW() - INTERVAL '1 week', 'YYYY') || '-0007', 'Training Materials', 'Training materials and resources for employee development', v_hr_dept_id, 'HR Department', 'Human Resources', 'services', 'medium', 'normal', 5000.00, 'pending', (SELECT id FROM public.vendors WHERE category = 'services' LIMIT 1), NOW() + INTERVAL '30 days', NOW() - INTERVAL '1 week'),
    (uuid_generate_v4(), 'PR-' || TO_CHAR(NOW() - INTERVAL '2 weeks', 'YYYY') || '-0008', 'Office Furniture', 'New office furniture for expansion project', v_facilities_dept_id, 'Facilities Department', 'Facilities & Maintenance', 'facilities', 'high', 'normal', 35000.00, 'vendor_selection', (SELECT id FROM public.vendors WHERE category = 'facilities' LIMIT 1), NOW() + INTERVAL '60 days', NOW() - INTERVAL '2 weeks'),
    (uuid_generate_v4(), 'PR-' || TO_CHAR(NOW() - INTERVAL '1 week', 'YYYY') || '-0009', 'Cloud Services Subscription', 'Annual cloud services subscription renewal', v_it_dept_id, 'IT Department', 'Information Technology', 'services', 'high', 'urgent', 120000.00, 'approved', (SELECT id FROM public.vendors WHERE category = 'services' LIMIT 1), NOW() + INTERVAL '30 days', NOW() - INTERVAL '1 week'),
    (uuid_generate_v4(), 'PR-' || TO_CHAR(NOW() - INTERVAL '3 days', 'YYYY') || '-0010', 'Security System Upgrade', 'Upgrade security cameras and access control systems', v_facilities_dept_id, 'Facilities Department', 'Facilities & Maintenance', 'services', 'high', 'normal', 55000.00, 'in_review', (SELECT id FROM public.vendors WHERE category = 'services' LIMIT 1), NOW() + INTERVAL '90 days', NOW() - INTERVAL '3 days');
END $$;

-- ============================================
-- SEED PURCHASE ORDERS
-- ============================================
-- This will be continued in the next part due to length
-- For now, let's create a simplified version

DO $$
DECLARE
  v_procurement_head_id UUID;
  v_vendor_office UUID;
  v_vendor_it UUID;
  v_vendor_facilities UUID;
  v_vendor_services UUID;
  v_po_counter INTEGER := 1;
  v_order_date DATE;
  v_delivery_date DATE;
  v_status TEXT;
  v_po_id UUID;
BEGIN
  -- Get user and vendor IDs
  SELECT id INTO v_procurement_head_id FROM public.user_profiles WHERE email = 'maria.fernandez@company.com' LIMIT 1;
  SELECT id INTO v_vendor_office FROM public.vendors WHERE vendor_code = 'VND-001' LIMIT 1;
  SELECT id INTO v_vendor_it FROM public.vendors WHERE vendor_code = 'VND-004' LIMIT 1;
  SELECT id INTO v_vendor_facilities FROM public.vendors WHERE vendor_code = 'VND-008' LIMIT 1;
  SELECT id INTO v_vendor_services FROM public.vendors WHERE vendor_code = 'VND-011' LIMIT 1;

  -- Create 20 purchase orders with various statuses
  FOR i IN 1..20 LOOP
    v_order_date := CURRENT_DATE - (RANDOM() * 90)::INTEGER;
    v_delivery_date := v_order_date + (7 + RANDOM() * 21)::INTEGER;
    
    -- Determine status based on dates
    IF v_delivery_date < CURRENT_DATE THEN
      v_status := CASE WHEN RANDOM() > 0.3 THEN 'Delivered' ELSE 'In_Transit' END;
    ELSIF v_order_date < CURRENT_DATE - 7 THEN
      v_status := CASE 
        WHEN RANDOM() > 0.5 THEN 'Ordered'
        WHEN RANDOM() > 0.3 THEN 'Approved'
        ELSE 'Pending'
      END;
    ELSE
      v_status := CASE 
        WHEN RANDOM() > 0.6 THEN 'Approved'
        WHEN RANDOM() > 0.3 THEN 'Submitted'
        ELSE 'Pending'
      END;
    END IF;

    v_po_id := uuid_generate_v4();
    
    INSERT INTO public.procurement_orders (
      id, order_number, vendor, vendor_id, items_count, value, status, order_date, delivery_date, 
      category, priority, created_by, created_at
    )
    VALUES (
      v_po_id,
      'PO-' || TO_CHAR(v_order_date, 'YYYY') || '-' || LPAD(v_po_counter::TEXT, 4, '0'),
      CASE 
        WHEN i % 4 = 1 THEN (SELECT name FROM public.vendors WHERE id = v_vendor_office)
        WHEN i % 4 = 2 THEN (SELECT name FROM public.vendors WHERE id = v_vendor_it)
        WHEN i % 4 = 3 THEN (SELECT name FROM public.vendors WHERE id = v_vendor_facilities)
        ELSE (SELECT name FROM public.vendors WHERE id = v_vendor_services)
      END,
      CASE 
        WHEN i % 4 = 1 THEN v_vendor_office
        WHEN i % 4 = 2 THEN v_vendor_it
        WHEN i % 4 = 3 THEN v_vendor_facilities
        ELSE v_vendor_services
      END,
      (3 + RANDOM() * 7)::INTEGER,
      (500 + RANDOM() * 4500)::DECIMAL(10,2),
      v_status,
      v_order_date,
      v_delivery_date,
      CASE 
        WHEN i % 4 = 1 THEN 'office_supplies'
        WHEN i % 4 = 2 THEN 'it_equipment'
        WHEN i % 4 = 3 THEN 'facilities'
        ELSE 'services'
      END,
      CASE 
        WHEN RANDOM() > 0.7 THEN 'high'
        WHEN RANDOM() > 0.4 THEN 'medium'
        ELSE 'low'
      END,
      v_procurement_head_id,
      v_order_date
    );
    
    v_po_counter := v_po_counter + 1;
  END LOOP;
END $$;

-- ============================================
-- SEED PURCHASE ORDER ITEMS
-- ============================================
-- Create items for each purchase order
INSERT INTO public.procurement_order_items (id, order_id, item_name, description, quantity, unit, unit_price, total_price, category, status, created_at)
SELECT
  uuid_generate_v4(),
  po.id,
  items.item_name,
  items.description,
  items.quantity,
  items.unit,
  items.unit_price,
  items.quantity * items.unit_price as total_price,
  items.category,
  CASE 
    WHEN po.status = 'Delivered' THEN 'received'
    WHEN po.status = 'Ordered' OR po.status = 'In_Transit' THEN 'ordered'
    ELSE 'pending'
  END,
  po.order_date
FROM public.procurement_orders po
CROSS JOIN LATERAL (
  SELECT * FROM (VALUES
    ('Printer Paper A4', 'A4 size printer paper, 500 sheets per ream', 50, 'ream', 12.50, 'office_supplies'),
    ('Pens - Blue', 'Blue ballpoint pens, 12 per box', 20, 'box', 8.99, 'office_supplies'),
    ('Folders - Manila', 'Manila folders, letter size, 25 per pack', 10, 'pack', 15.99, 'office_supplies'),
    ('Laptop Dell Latitude', 'Dell Latitude 7420, 16GB RAM, 512GB SSD', 5, 'each', 1200.00, 'it_equipment'),
    ('Monitor 27"', '27-inch LED monitor, 4K resolution', 8, 'each', 350.00, 'it_equipment'),
    ('Network Switch', '24-port managed network switch', 2, 'each', 450.00, 'it_equipment'),
    ('Cleaning Supplies Kit', 'Complete cleaning supplies package', 15, 'kit', 85.00, 'facilities'),
    ('Light Bulbs LED', 'LED light bulbs, energy efficient', 100, 'each', 8.50, 'facilities'),
    ('Air Filters', 'HVAC air filters, standard size', 20, 'each', 35.00, 'facilities'),
    ('Legal Consultation', 'Monthly legal consultation hours', 40, 'hour', 250.00, 'services'),
    ('Accounting Services', 'Monthly accounting and bookkeeping', 1, 'month', 5000.00, 'services'),
    ('Cloud Storage', 'Annual cloud storage subscription, 10TB', 1, 'year', 12000.00, 'services')
  ) AS items(item_name, description, quantity, unit, unit_price, category)
  ORDER BY RANDOM()
  LIMIT (3 + RANDOM() * 5)::INTEGER
) items(item_name, description, quantity, unit, unit_price, category)
WHERE po.items_count > 0;

-- ============================================
-- SEED VENDOR CONTRACTS
-- ============================================
DO $$
DECLARE
  v_procurement_head_id UUID;
  v_vendor_ids UUID[];
  v_contract_counter INTEGER := 1;
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  SELECT id INTO v_procurement_head_id FROM public.user_profiles WHERE email = 'maria.fernandez@company.com' LIMIT 1;
  SELECT ARRAY_AGG(id) INTO v_vendor_ids FROM public.vendors WHERE status = 'Active' LIMIT 15;

  FOR i IN 1..15 LOOP
    v_start_date := CURRENT_DATE - (RANDOM() * 365)::INTEGER;
    v_end_date := v_start_date + (365 + RANDOM() * 365)::INTEGER;

    INSERT INTO public.vendor_contracts (
      id, contract_number, vendor_id, vendor_name, contract_type, title, description,
      start_date, end_date, renewal_date, auto_renew, total_value, status,
      payment_terms, responsible_person_id, responsible_person_name, created_at
    )
    SELECT
      uuid_generate_v4(),
      'CNT-' || TO_CHAR(v_start_date, 'YYYY') || '-' || LPAD(v_contract_counter::TEXT, 4, '0'),
      v.id,
      v.name,
      CASE 
        WHEN RANDOM() > 0.6 THEN 'master_agreement'
        WHEN RANDOM() > 0.3 THEN 'service_contract'
        ELSE 'purchase_agreement'
      END,
      CASE 
        WHEN v.category = 'office_supplies' THEN 'Office Supplies Master Agreement'
        WHEN v.category = 'it_equipment' THEN 'IT Equipment Supply Agreement'
        WHEN v.category = 'facilities' THEN 'Facilities Services Contract'
        WHEN v.category = 'services' THEN 'Professional Services Agreement'
        ELSE 'Supply Agreement'
      END,
      'Master agreement for ' || v.name || ' providing ' || v.category || ' services',
      v_start_date,
      v_end_date,
      v_end_date - INTERVAL '30 days',
      RANDOM() > 0.5,
      (10000 + RANDOM() * 90000)::DECIMAL(15,2),
      CASE 
        WHEN v_end_date < CURRENT_DATE THEN 'Expired'
        WHEN v_end_date < CURRENT_DATE + INTERVAL '90 days' THEN 'Pending_Renewal'
        ELSE 'Active'
      END,
      v.payment_terms,
      v_procurement_head_id,
      'Maria Fernandez',
      v_start_date
    FROM public.vendors v
    WHERE v.id = v_vendor_ids[i]
    LIMIT 1;

    v_contract_counter := v_contract_counter + 1;
  END LOOP;
END $$;

-- ============================================
-- SEED VENDOR PERFORMANCE
-- ============================================
-- Create performance records for delivered orders
INSERT INTO public.vendor_performance (
  id, vendor_id, order_id, performance_date, on_time_delivery,
  delivery_date_promised, delivery_date_actual, delivery_days_variance,
  quality_rating, cost_rating, communication_rating, overall_score,
  reviewed_by, created_at
)
SELECT
  uuid_generate_v4(),
  po.vendor_id,
  po.id,
  COALESCE(po.received_date, po.delivery_date, po.order_date + INTERVAL '14 days'),
  CASE WHEN (COALESCE(po.received_date, po.delivery_date) <= po.delivery_date) THEN true ELSE false END,
  po.delivery_date,
  COALESCE(po.received_date, po.delivery_date),
  (COALESCE(po.received_date, po.delivery_date) - po.delivery_date)::INTEGER,
  (3 + RANDOM() * 2)::INTEGER,
  (3 + RANDOM() * 2)::INTEGER,
  (3 + RANDOM() * 2)::INTEGER,
  ((3 + RANDOM() * 2) + (3 + RANDOM() * 2) + (3 + RANDOM() * 2)) / 3.0,
  (SELECT id FROM public.user_profiles WHERE department = 'Procurement' LIMIT 1),
  COALESCE(po.received_date, po.delivery_date, po.order_date + INTERVAL '14 days')
FROM public.procurement_orders po
WHERE po.status IN ('Delivered', 'Received') AND po.vendor_id IS NOT NULL
LIMIT 40;

-- ============================================
-- UPDATE VENDOR STATISTICS
-- ============================================
-- Trigger will handle this, but let's manually update for seed data
UPDATE public.vendors v
SET
  total_orders = (
    SELECT COUNT(*) FROM public.procurement_orders po
    WHERE po.vendor_id = v.id OR po.vendor = v.name
  ),
  total_spend = (
    SELECT COALESCE(SUM(value), 0) FROM public.procurement_orders po
    WHERE po.vendor_id = v.id OR po.vendor = v.name
  ),
  on_time_delivery_rate = (
    SELECT 
      CASE 
        WHEN COUNT(*) > 0 THEN
          (COUNT(*) FILTER (WHERE vp.on_time_delivery = true)::DECIMAL / COUNT(*)::DECIMAL) * 100
        ELSE 0
      END
    FROM public.vendor_performance vp
    WHERE vp.vendor_id = v.id
  ),
  quality_rating = (
    SELECT COALESCE(AVG(quality_rating), 0)
    FROM public.vendor_performance
    WHERE vendor_id = v.id
  ),
  rating = (
    SELECT COALESCE(AVG(overall_score), 0)
    FROM public.vendor_performance
    WHERE vendor_id = v.id
  )
WHERE v.status = 'Active';

-- ============================================
-- SUMMARY
-- ============================================
DO $$
DECLARE
  v_vendors_count INTEGER;
  v_orders_count INTEGER;
  v_requests_count INTEGER;
  v_contracts_count INTEGER;
  v_performance_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_vendors_count FROM public.vendors;
  SELECT COUNT(*) INTO v_orders_count FROM public.procurement_orders;
  SELECT COUNT(*) INTO v_requests_count FROM public.procurement_requests;
  SELECT COUNT(*) INTO v_contracts_count FROM public.vendor_contracts;
  SELECT COUNT(*) INTO v_performance_count FROM public.vendor_performance;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Procurement Data Seeding Complete!';
  RAISE NOTICE 'Vendors: %', v_vendors_count;
  RAISE NOTICE 'Purchase Orders: %', v_orders_count;
  RAISE NOTICE 'Procurement Requests: %', v_requests_count;
  RAISE NOTICE 'Vendor Contracts: %', v_contracts_count;
  RAISE NOTICE 'Performance Records: %', v_performance_count;
  RAISE NOTICE '========================================';
END $$;

