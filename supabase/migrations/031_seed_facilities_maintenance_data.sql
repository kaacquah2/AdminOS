-- ============================================
-- Facilities & Maintenance - Complete Seed Data
-- ============================================
-- This migration creates comprehensive seed data for Facilities & Maintenance department
-- Includes: Facility Assets, Asset Maintenance Records, Workflow Tasks, and Projects
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
-- 1. FACILITY ASSETS
-- ============================================
-- Insert facility-related assets (HVAC, elevators, generators, etc.)

INSERT INTO public.assets (name, category, status, value, purchase_date, condition, location, serial_number, notes)
VALUES 
  -- HVAC Systems
  ('HVAC Unit - Building A - Floor 1', 'Facilities', 'Available', 45000.00, '2020-03-15', 'Good', 'Building A, Floor 1, Mechanical Room', 'HVAC-A1-2020-001', 'Central air conditioning unit, 10-ton capacity'),
  ('HVAC Unit - Building A - Floor 2', 'Facilities', 'Available', 45000.00, '2020-03-15', 'Good', 'Building A, Floor 2, Mechanical Room', 'HVAC-A2-2020-002', 'Central air conditioning unit, 10-ton capacity'),
  ('HVAC Unit - Building A - Floor 3', 'Facilities', 'Maintenance', 45000.00, '2020-03-15', 'Fair', 'Building A, Floor 3, Mechanical Room', 'HVAC-A3-2020-003', 'Requires filter replacement'),
  ('HVAC Unit - Building B - Floor 1', 'Facilities', 'Available', 50000.00, '2021-06-20', 'Excellent', 'Building B, Floor 1, Mechanical Room', 'HVAC-B1-2021-001', 'Newer model, energy efficient'),
  ('HVAC Unit - Building B - Floor 2', 'Facilities', 'Available', 50000.00, '2021-06-20', 'Excellent', 'Building B, Floor 2, Mechanical Room', 'HVAC-B2-2021-002', 'Newer model, energy efficient'),
  
  -- Elevators
  ('Elevator 1 - Building A', 'Building', 'Available', 125000.00, '2019-05-10', 'Good', 'Building A, Main Lobby', 'ELEV-A1-2019-001', 'Passenger elevator, 3500 lb capacity'),
  ('Elevator 2 - Building A', 'Building', 'Available', 125000.00, '2019-05-10', 'Good', 'Building A, Main Lobby', 'ELEV-A2-2019-002', 'Passenger elevator, 3500 lb capacity'),
  ('Freight Elevator - Building A', 'Building', 'Available', 150000.00, '2019-05-10', 'Good', 'Building A, Loading Dock', 'ELEV-AF-2019-003', 'Freight elevator, 5000 lb capacity'),
  ('Elevator 1 - Building B', 'Building', 'Available', 135000.00, '2020-08-15', 'Excellent', 'Building B, Main Lobby', 'ELEV-B1-2020-001', 'Passenger elevator, 4000 lb capacity'),
  
  -- Generators & Power Systems
  ('Backup Generator - Building A', 'Equipment', 'Available', 85000.00, '2018-11-20', 'Good', 'Building A, Basement', 'GEN-A-2018-001', '500kW diesel generator'),
  ('Backup Generator - Building B', 'Equipment', 'Available', 90000.00, '2020-02-10', 'Excellent', 'Building B, Basement', 'GEN-B-2020-001', '600kW diesel generator'),
  ('UPS System - Server Room A', 'Equipment', 'Available', 25000.00, '2021-09-05', 'Excellent', 'Building A, Server Room', 'UPS-A-SRV-2021-001', '100kVA uninterruptible power supply'),
  ('UPS System - Server Room B', 'Equipment', 'Available', 25000.00, '2021-09-05', 'Excellent', 'Building B, Server Room', 'UPS-B-SRV-2021-002', '100kVA uninterruptible power supply'),
  
  -- Plumbing & Water Systems
  ('Water Heater - Building A', 'Facilities', 'Available', 12000.00, '2020-01-15', 'Good', 'Building A, Basement', 'WH-A-2020-001', 'Commercial water heater, 200 gallons'),
  ('Water Heater - Building B', 'Facilities', 'Available', 12000.00, '2020-01-15', 'Good', 'Building B, Basement', 'WH-B-2020-002', 'Commercial water heater, 200 gallons'),
  ('Water Filtration System', 'Facilities', 'Available', 18000.00, '2021-04-10', 'Excellent', 'Building A, Basement', 'WFS-A-2021-001', 'Whole building water filtration'),
  
  -- Fire Safety Systems
  ('Fire Sprinkler System - Building A', 'Building', 'Available', 95000.00, '2019-07-01', 'Good', 'Building A, All Floors', 'FSP-A-2019-001', 'Wet pipe sprinkler system'),
  ('Fire Sprinkler System - Building B', 'Building', 'Available', 105000.00, '2020-09-15', 'Excellent', 'Building B, All Floors', 'FSP-B-2020-001', 'Wet pipe sprinkler system'),
  ('Fire Alarm System - Building A', 'Building', 'Available', 35000.00, '2020-03-20', 'Good', 'Building A, All Floors', 'FAL-A-2020-001', 'Addressable fire alarm system'),
  ('Fire Alarm System - Building B', 'Building', 'Available', 35000.00, '2020-03-20', 'Good', 'Building B, All Floors', 'FAL-B-2020-002', 'Addressable fire alarm system'),
  
  -- Security Systems
  ('Access Control System - Building A', 'Building', 'Available', 42000.00, '2021-01-10', 'Excellent', 'Building A, All Entries', 'ACS-A-2021-001', 'Card reader access control'),
  ('Access Control System - Building B', 'Building', 'Available', 42000.00, '2021-01-10', 'Excellent', 'Building B, All Entries', 'ACS-B-2021-002', 'Card reader access control'),
  ('CCTV System - Building A', 'Building', 'Available', 28000.00, '2020-11-05', 'Good', 'Building A, All Floors', 'CCTV-A-2020-001', '32 camera surveillance system'),
  ('CCTV System - Building B', 'Building', 'Available', 28000.00, '2020-11-05', 'Good', 'Building B, All Floors', 'CCTV-B-2020-002', '32 camera surveillance system'),
  
  -- Maintenance Equipment
  ('Floor Scrubber - Industrial', 'Maintenance', 'Available', 8500.00, '2021-05-20', 'Good', 'Building A, Maintenance Closet', 'FS-IND-2021-001', 'Automatic floor scrubber'),
  ('Pressure Washer', 'Maintenance', 'Assigned', 1200.00, '2020-08-10', 'Good', 'Building A, Maintenance Closet', 'PW-2020-001', 'Commercial pressure washer'),
  ('Ladder - Extension 24ft', 'Maintenance', 'Available', 450.00, '2021-02-15', 'Good', 'Building A, Maintenance Closet', 'LAD-24-2021-001', 'Aluminum extension ladder'),
  ('Ladder - Extension 32ft', 'Maintenance', 'Available', 650.00, '2021-02-15', 'Good', 'Building B, Maintenance Closet', 'LAD-32-2021-002', 'Aluminum extension ladder'),
  ('Tool Set - Complete', 'Maintenance', 'Assigned', 2500.00, '2020-06-01', 'Good', 'Building A, Maintenance Closet', 'TS-COMP-2020-001', 'Complete maintenance tool set'),
  
  -- Building Infrastructure
  ('Roof - Building A', 'Building', 'Available', 250000.00, '2018-04-15', 'Fair', 'Building A, Roof', 'ROOF-A-2018-001', 'Flat roof, requires periodic inspection'),
  ('Roof - Building B', 'Building', 'Available', 275000.00, '2019-06-20', 'Good', 'Building B, Roof', 'ROOF-B-2019-001', 'Flat roof, newer installation'),
  ('Parking Lot - Main', 'Building', 'Available', 180000.00, '2019-08-10', 'Fair', 'Main Parking Area', 'PARK-MAIN-2019-001', 'Asphalt parking lot, 150 spaces'),
  ('Landscaping System', 'Facilities', 'Available', 35000.00, '2020-04-01', 'Good', 'Building Grounds', 'LAND-2020-001', 'Irrigation and landscaping system')
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. ASSET MAINTENANCE RECORDS
-- ============================================
-- Create maintenance schedules and completed maintenance records

DO $$
DECLARE
  v_hvac_a1_id UUID;
  v_hvac_a2_id UUID;
  v_hvac_a3_id UUID;
  v_hvac_b1_id UUID;
  v_hvac_b2_id UUID;
  v_elev_a1_id UUID;
  v_elev_a2_id UUID;
  v_elev_af_id UUID;
  v_elev_b1_id UUID;
  v_gen_a_id UUID;
  v_gen_b_id UUID;
  v_ups_a_id UUID;
  v_ups_b_id UUID;
  v_wh_a_id UUID;
  v_wh_b_id UUID;
  v_fsp_a_id UUID;
  v_fsp_b_id UUID;
  v_fal_a_id UUID;
  v_fal_b_id UUID;
  v_roof_a_id UUID;
  v_roof_b_id UUID;
BEGIN
  -- Get asset IDs
  SELECT id INTO v_hvac_a1_id FROM public.assets WHERE serial_number = 'HVAC-A1-2020-001';
  SELECT id INTO v_hvac_a2_id FROM public.assets WHERE serial_number = 'HVAC-A2-2020-002';
  SELECT id INTO v_hvac_a3_id FROM public.assets WHERE serial_number = 'HVAC-A3-2020-003';
  SELECT id INTO v_hvac_b1_id FROM public.assets WHERE serial_number = 'HVAC-B1-2021-001';
  SELECT id INTO v_hvac_b2_id FROM public.assets WHERE serial_number = 'HVAC-B2-2021-002';
  SELECT id INTO v_elev_a1_id FROM public.assets WHERE serial_number = 'ELEV-A1-2019-001';
  SELECT id INTO v_elev_a2_id FROM public.assets WHERE serial_number = 'ELEV-A2-2019-002';
  SELECT id INTO v_elev_af_id FROM public.assets WHERE serial_number = 'ELEV-AF-2019-003';
  SELECT id INTO v_elev_b1_id FROM public.assets WHERE serial_number = 'ELEV-B1-2020-001';
  SELECT id INTO v_gen_a_id FROM public.assets WHERE serial_number = 'GEN-A-2018-001';
  SELECT id INTO v_gen_b_id FROM public.assets WHERE serial_number = 'GEN-B-2020-001';
  SELECT id INTO v_ups_a_id FROM public.assets WHERE serial_number = 'UPS-A-SRV-2021-001';
  SELECT id INTO v_ups_b_id FROM public.assets WHERE serial_number = 'UPS-B-SRV-2021-002';
  SELECT id INTO v_wh_a_id FROM public.assets WHERE serial_number = 'WH-A-2020-001';
  SELECT id INTO v_wh_b_id FROM public.assets WHERE serial_number = 'WH-B-2020-002';
  SELECT id INTO v_fsp_a_id FROM public.assets WHERE serial_number = 'FSP-A-2019-001';
  SELECT id INTO v_fsp_b_id FROM public.assets WHERE serial_number = 'FSP-B-2020-001';
  SELECT id INTO v_fal_a_id FROM public.assets WHERE serial_number = 'FAL-A-2020-001';
  SELECT id INTO v_fal_b_id FROM public.assets WHERE serial_number = 'FAL-B-2020-002';
  SELECT id INTO v_roof_a_id FROM public.assets WHERE serial_number = 'ROOF-A-2018-001';
  SELECT id INTO v_roof_b_id FROM public.assets WHERE serial_number = 'ROOF-B-2019-001';

  -- Completed Maintenance (Past)
  INSERT INTO public.asset_maintenance (asset_id, maintenance_type, scheduled_date, completed_date, cost, notes)
  VALUES
    -- HVAC Maintenance (Completed)
    (v_hvac_a1_id, 'Preventive Maintenance', '2024-10-15', '2024-10-15', 850.00, 'Filter replacement, coil cleaning, system check'),
    (v_hvac_a2_id, 'Preventive Maintenance', '2024-10-20', '2024-10-20', 850.00, 'Filter replacement, coil cleaning, system check'),
    (v_hvac_b1_id, 'Preventive Maintenance', '2024-10-25', '2024-10-25', 900.00, 'Filter replacement, coil cleaning, system check'),
    (v_hvac_b2_id, 'Preventive Maintenance', '2024-10-28', '2024-10-28', 900.00, 'Filter replacement, coil cleaning, system check'),
    
    -- Elevator Maintenance (Completed)
    (v_elev_a1_id, 'Monthly Inspection', '2024-10-01', '2024-10-01', 450.00, 'Monthly safety inspection and lubrication'),
    (v_elev_a2_id, 'Monthly Inspection', '2024-10-01', '2024-10-01', 450.00, 'Monthly safety inspection and lubrication'),
    (v_elev_af_id, 'Monthly Inspection', '2024-10-01', '2024-10-01', 500.00, 'Monthly safety inspection and lubrication'),
    (v_elev_b1_id, 'Monthly Inspection', '2024-10-01', '2024-10-01', 450.00, 'Monthly safety inspection and lubrication'),
    
    -- Generator Maintenance (Completed)
    (v_gen_a_id, 'Quarterly Service', '2024-09-15', '2024-09-15', 1200.00, 'Oil change, filter replacement, load test'),
    (v_gen_b_id, 'Quarterly Service', '2024-09-20', '2024-09-20', 1300.00, 'Oil change, filter replacement, load test'),
    
    -- UPS Maintenance (Completed)
    (v_ups_a_id, 'Battery Replacement', '2024-09-10', '2024-09-10', 3500.00, 'Battery bank replacement, system test'),
    (v_ups_b_id, 'Battery Replacement', '2024-09-10', '2024-09-10', 3500.00, 'Battery bank replacement, system test'),
    
    -- Water Heater Maintenance (Completed)
    (v_wh_a_id, 'Annual Service', '2024-08-15', '2024-08-15', 350.00, 'Tank flush, anode rod check, pressure test'),
    (v_wh_b_id, 'Annual Service', '2024-08-15', '2024-08-15', 350.00, 'Tank flush, anode rod check, pressure test'),
    
    -- Fire Safety Maintenance (Completed)
    (v_fsp_a_id, 'Annual Inspection', '2024-07-01', '2024-07-01', 2500.00, 'Full system inspection, flow test, valve check'),
    (v_fsp_b_id, 'Annual Inspection', '2024-07-05', '2024-07-05', 2600.00, 'Full system inspection, flow test, valve check'),
    (v_fal_a_id, 'Semi-Annual Test', '2024-09-01', '2024-09-01', 800.00, 'Full system test, sensor check, battery replacement'),
    (v_fal_b_id, 'Semi-Annual Test', '2024-09-01', '2024-09-01', 800.00, 'Full system test, sensor check, battery replacement'),
    
    -- Roof Maintenance (Completed)
    (v_roof_a_id, 'Inspection', '2024-08-20', '2024-08-20', 600.00, 'Roof inspection, minor repairs, sealant check'),
    (v_roof_b_id, 'Inspection', '2024-08-20', '2024-08-20', 600.00, 'Roof inspection, minor repairs, sealant check');

  -- Scheduled Maintenance (Upcoming)
  INSERT INTO public.asset_maintenance (asset_id, maintenance_type, scheduled_date, cost, notes)
  VALUES
    -- HVAC Scheduled Maintenance (Next 30 days)
    (v_hvac_a1_id, 'Preventive Maintenance', '2024-12-15', 850.00, 'Scheduled filter replacement and system check'),
    (v_hvac_a2_id, 'Preventive Maintenance', '2024-12-20', 850.00, 'Scheduled filter replacement and system check'),
    (v_hvac_a3_id, 'Repair', '2024-11-25', 1200.00, 'Filter replacement and system diagnostics - URGENT'),
    (v_hvac_b1_id, 'Preventive Maintenance', '2024-12-25', 900.00, 'Scheduled filter replacement and system check'),
    (v_hvac_b2_id, 'Preventive Maintenance', '2024-12-28', 900.00, 'Scheduled filter replacement and system check'),
    
    -- Elevator Scheduled Maintenance
    (v_elev_a1_id, 'Monthly Inspection', '2024-12-01', 450.00, 'Monthly safety inspection scheduled'),
    (v_elev_a2_id, 'Monthly Inspection', '2024-12-01', 450.00, 'Monthly safety inspection scheduled'),
    (v_elev_af_id, 'Monthly Inspection', '2024-12-01', 500.00, 'Monthly safety inspection scheduled'),
    (v_elev_b1_id, 'Monthly Inspection', '2024-12-01', 450.00, 'Monthly safety inspection scheduled'),
    
    -- Generator Scheduled Maintenance
    (v_gen_a_id, 'Quarterly Service', '2024-12-15', 1200.00, 'Quarterly service scheduled'),
    (v_gen_b_id, 'Quarterly Service', '2024-12-20', 1300.00, 'Quarterly service scheduled'),
    
    -- Fire Safety Scheduled Maintenance
    (v_fal_a_id, 'Semi-Annual Test', '2024-12-01', 800.00, 'Semi-annual fire alarm test scheduled'),
    (v_fal_b_id, 'Semi-Annual Test', '2024-12-01', 800.00, 'Semi-annual fire alarm test scheduled');
END $$;

-- ============================================
-- 3. WORKFLOW TASKS (Maintenance Requests)
-- ============================================

DO $$
DECLARE
  v_patrick_id UUID;
  v_sonia_id UUID;
  v_george_id UUID;
  v_chloe_id UUID;
  v_alex_id UUID;
BEGIN
  -- Get user profile IDs
  SELECT get_user_profile_id_by_email('patrick.collins@company.com') INTO v_patrick_id;
  SELECT get_user_profile_id_by_email('sonia.rivera@company.com') INTO v_sonia_id;
  SELECT get_user_profile_id_by_email('george.li@company.com') INTO v_george_id;
  SELECT get_user_profile_id_by_email('chloe.brown@company.com') INTO v_chloe_id;
  SELECT get_user_profile_id_by_email('alex.novak@company.com') INTO v_alex_id;

  -- Active Maintenance Requests
  INSERT INTO public.workflow_tasks (title, description, department, status, priority, assigned_to, assigned_by, due_date)
  VALUES
    -- Critical Priority
    ('HVAC Unit A3 - Filter Replacement Urgent', 'HVAC unit on Building A Floor 3 requires immediate filter replacement. Air quality concerns reported.', 'Facilities & Maintenance', 'in_progress', 'critical', v_george_id, v_patrick_id, CURRENT_DATE + INTERVAL '2 days'),
    ('Elevator 1 - Building A - Unusual Noise', 'Elevator making grinding noise between floors 2-3. Requires immediate inspection.', 'Facilities & Maintenance', 'pending', 'critical', NULL, v_patrick_id, CURRENT_DATE + INTERVAL '1 day'),
    
    -- High Priority
    ('Water Leak - Building A - Floor 2 Restroom', 'Water leak detected in men''s restroom on Floor 2. Possible pipe issue.', 'Facilities & Maintenance', 'in_progress', 'high', v_george_id, v_sonia_id, CURRENT_DATE + INTERVAL '3 days'),
    ('Parking Lot Pothole Repair', 'Multiple potholes in main parking lot need repair before winter.', 'Facilities & Maintenance', 'pending', 'high', NULL, v_patrick_id, CURRENT_DATE + INTERVAL '7 days'),
    ('Fire Alarm System - Building A - False Alarm Investigation', 'Multiple false alarms reported. System requires diagnostic check.', 'Facilities & Maintenance', 'pending', 'high', NULL, v_sonia_id, CURRENT_DATE + INTERVAL '5 days'),
    
    -- Medium Priority
    ('Light Fixture Replacement - Building B - Floor 1', 'Several fluorescent lights flickering on Floor 1. Need replacement.', 'Facilities & Maintenance', 'pending', 'medium', NULL, v_sonia_id, CURRENT_DATE + INTERVAL '14 days'),
    ('Carpet Cleaning - Building A - Conference Rooms', 'Deep cleaning required for all conference rooms in Building A.', 'Facilities & Maintenance', 'pending', 'medium', v_alex_id, v_sonia_id, CURRENT_DATE + INTERVAL '10 days'),
    ('Window Cleaning - Building A - Exterior', 'Exterior window cleaning scheduled for Building A.', 'Facilities & Maintenance', 'pending', 'medium', NULL, v_sonia_id, CURRENT_DATE + INTERVAL '21 days'),
    ('Generator Load Test - Building B', 'Quarterly load test required for backup generator.', 'Facilities & Maintenance', 'pending', 'medium', NULL, v_sonia_id, CURRENT_DATE + INTERVAL '14 days'),
    ('Roof Inspection - Building A', 'Annual roof inspection and minor repair assessment.', 'Facilities & Maintenance', 'pending', 'medium', NULL, v_patrick_id, CURRENT_DATE + INTERVAL '30 days'),
    
    -- Low Priority
    ('Landscaping - Fall Cleanup', 'Fall season landscaping cleanup and preparation for winter.', 'Facilities & Maintenance', 'pending', 'low', NULL, v_patrick_id, CURRENT_DATE + INTERVAL '45 days'),
    ('Signage Update - Building Directory', 'Update building directory with new tenant information.', 'Facilities & Maintenance', 'pending', 'low', NULL, v_sonia_id, CURRENT_DATE + INTERVAL '20 days'),
    ('Storage Room Organization', 'Organize and inventory maintenance storage room.', 'Facilities & Maintenance', 'pending', 'low', v_alex_id, v_sonia_id, CURRENT_DATE + INTERVAL '30 days');

  -- Completed Tasks (Recent)
  INSERT INTO public.workflow_tasks (title, description, department, status, priority, assigned_to, assigned_by, due_date, completed_at)
  VALUES
    ('HVAC Unit B1 - Filter Replacement', 'Routine filter replacement completed for Building B Floor 1 HVAC unit.', 'Facilities & Maintenance', 'completed', 'medium', v_george_id, v_sonia_id, '2024-10-25', '2024-10-25 14:30:00'),
    ('Elevator 2 - Building A - Annual Service', 'Annual elevator service and safety inspection completed.', 'Facilities & Maintenance', 'completed', 'high', v_george_id, v_patrick_id, '2024-10-15', '2024-10-15 16:00:00'),
    ('Water Heater - Building A - Annual Service', 'Annual water heater service completed. System operating normally.', 'Facilities & Maintenance', 'completed', 'medium', v_george_id, v_sonia_id, '2024-10-20', '2024-10-20 11:15:00'),
    ('Fire Sprinkler Inspection - Building B', 'Annual fire sprinkler system inspection completed. All systems operational.', 'Facilities & Maintenance', 'completed', 'high', v_george_id, v_patrick_id, '2024-10-10', '2024-10-10 09:00:00'),
    ('Light Bulb Replacement - Building A - Floor 2', 'Replaced 12 fluorescent bulbs on Floor 2. All lights operational.', 'Facilities & Maintenance', 'completed', 'low', v_alex_id, v_sonia_id, '2024-10-28', '2024-10-28 13:45:00'),
    ('Carpet Cleaning - Building B - Lobby', 'Deep cleaning of lobby carpet completed.', 'Facilities & Maintenance', 'completed', 'medium', v_alex_id, v_sonia_id, '2024-10-22', '2024-10-22 15:30:00');
END $$;

-- ============================================
-- 4. FACILITY PROJECTS
-- ============================================

DO $$
DECLARE
  v_patrick_employee_id UUID;
BEGIN
  -- Get Patrick Collins employee ID
  SELECT get_employee_id_by_email('patrick.collins@company.com') INTO v_patrick_employee_id;

  -- Insert facility projects
  INSERT INTO public.projects (name, department, status, progress, due_date, owner_id, owner_name, description, budget)
  VALUES
    ('Building A HVAC System Upgrade', 'Facilities & Maintenance', 'In Progress', 65, '2025-02-28', v_patrick_employee_id, 'Patrick Collins', 
     'Complete upgrade of HVAC system in Building A. Includes replacement of 3 HVAC units, ductwork improvements, and installation of smart thermostats. Project aims to improve energy efficiency by 30% and reduce maintenance costs.', 450000.00),
    
    ('Parking Lot Resurfacing Project', 'Facilities & Maintenance', 'Planning', 15, '2025-04-30', v_patrick_employee_id, 'Patrick Collins',
     'Complete resurfacing of main parking lot. Includes asphalt replacement, line striping, and installation of new lighting. Project will improve safety and aesthetics.', 180000.00),
    
    ('Building B Security System Enhancement', 'Facilities & Maintenance', 'In Progress', 40, '2025-01-31', v_patrick_employee_id, 'Patrick Collins',
     'Upgrade security systems in Building B. Includes new access control readers, enhanced CCTV coverage, and integration with building management system.', 95000.00),
    
    ('Roof Replacement - Building A', 'Facilities & Maintenance', 'Planning', 5, '2025-06-30', v_patrick_employee_id, 'Patrick Collins',
     'Complete roof replacement for Building A. Current roof is 6 years old and showing signs of wear. Project includes new membrane, insulation, and drainage improvements.', 275000.00),
    
    ('Energy Efficiency Retrofit', 'Facilities & Maintenance', 'In Progress', 55, '2025-03-15', v_patrick_employee_id, 'Patrick Collins',
     'Comprehensive energy efficiency improvements across both buildings. Includes LED lighting replacement, smart building controls, and energy monitoring systems. Expected to reduce energy costs by 25%.', 320000.00),
    
    ('Generator Backup System Upgrade', 'Facilities & Maintenance', 'Completed', 100, '2024-09-30', v_patrick_employee_id, 'Patrick Collins',
     'Upgraded backup generator systems for both buildings. Installed new 600kW generators with automatic transfer switches and enhanced monitoring systems.', 180000.00),
    
    ('Water Filtration System Installation', 'Facilities & Maintenance', 'Completed', 100, '2024-05-15', v_patrick_employee_id, 'Patrick Collins',
     'Installed whole-building water filtration system in Building A. Improves water quality and reduces maintenance on plumbing fixtures.', 18000.00),
    
    ('Fire Safety System Modernization', 'Facilities & Maintenance', 'In Progress', 75, '2024-12-31', v_patrick_employee_id, 'Patrick Collins',
     'Modernizing fire safety systems in both buildings. Includes new addressable fire alarm panels, upgraded sprinkler heads, and integration with building management system.', 125000.00);
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
-- SELECT COUNT(*) as facility_assets FROM public.assets WHERE category IN ('Facilities', 'Maintenance', 'Building', 'Equipment');
-- SELECT COUNT(*) as maintenance_records FROM public.asset_maintenance;
-- SELECT COUNT(*) as workflow_tasks FROM public.workflow_tasks WHERE department = 'Facilities & Maintenance';
-- SELECT COUNT(*) as projects FROM public.projects WHERE department = 'Facilities & Maintenance';

