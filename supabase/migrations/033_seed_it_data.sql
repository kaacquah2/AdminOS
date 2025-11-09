-- ============================================
-- INFORMATION TECHNOLOGY (IT) DEPARTMENT SEED DATA
-- ============================================
-- This migration seeds comprehensive IT data including:
-- - Software Licenses (20+ licenses)
-- - Software License Assignments (50+ assignments)
-- - System Monitoring (15+ systems)
-- - System Incidents (20+ incidents)
-- - IT Projects (10+ projects)
-- - Support Requests (30+ tickets)
-- - IT Asset Maintenance (25+ maintenance records)
-- ============================================
-- IMPORTANT: This migration requires 032_create_it_tables.sql to be run first!
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- VERIFY REQUIRED TABLES EXIST
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'software_licenses') THEN
    RAISE EXCEPTION 'Required table "software_licenses" does not exist. Please run migration 032_create_it_tables.sql first!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_monitoring') THEN
    RAISE EXCEPTION 'Required table "system_monitoring" does not exist. Please run migration 032_create_it_tables.sql first!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_requests') THEN
    RAISE EXCEPTION 'Required table "support_requests" does not exist. Please ensure the base schema is set up!';
  END IF;
  
  RAISE NOTICE 'All required tables exist. Proceeding with IT seed data...';
END $$;

-- ============================================
-- SEED SOFTWARE LICENSES
-- ============================================
DO $$
DECLARE
  v_it_manager_id UUID;
BEGIN
  -- Get IT manager ID
  SELECT id INTO v_it_manager_id FROM public.user_profiles WHERE email = 'jason.miller@company.com' LIMIT 1;

  -- Insert software licenses
  INSERT INTO public.software_licenses (
    id, license_number, software_name, vendor, license_type, total_licenses, used_licenses,
    purchase_date, expiration_date, renewal_date, auto_renew, cost, currency, status,
    support_level, managed_by, created_at
  )
  VALUES
    -- Microsoft Licenses
    (uuid_generate_v4(), 'MS-O365-001', 'Microsoft Office 365 Business Premium', 'Microsoft', 'subscription', 100, 85, 
     CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '6 months', CURRENT_DATE + INTERVAL '5 months', true, 15000.00, 'USD', 'Active', 'premium', v_it_manager_id, CURRENT_DATE - INTERVAL '6 months'),
    (uuid_generate_v4(), 'MS-AZURE-001', 'Microsoft Azure Enterprise Agreement', 'Microsoft', 'subscription', 1, 1,
     CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '11 months', CURRENT_DATE + INTERVAL '10 months', true, 50000.00, 'USD', 'Active', 'enterprise', v_it_manager_id, CURRENT_DATE - INTERVAL '1 year'),
    (uuid_generate_v4(), 'MS-WIN-001', 'Windows 11 Enterprise', 'Microsoft', 'perpetual', 50, 45,
     CURRENT_DATE - INTERVAL '2 years', NULL, NULL, false, 25000.00, 'USD', 'Active', 'standard', v_it_manager_id, CURRENT_DATE - INTERVAL '2 years'),
    (uuid_generate_v4(), 'MS-SQL-001', 'SQL Server 2022 Standard', 'Microsoft', 'perpetual', 5, 3,
     CURRENT_DATE - INTERVAL '18 months', NULL, NULL, false, 15000.00, 'USD', 'Active', 'premium', v_it_manager_id, CURRENT_DATE - INTERVAL '18 months'),
    
    -- Adobe Licenses
    (uuid_generate_v4(), 'ADOBE-CC-001', 'Adobe Creative Cloud Enterprise', 'Adobe', 'subscription', 25, 22,
     CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '9 months', CURRENT_DATE + INTERVAL '8 months', true, 18000.00, 'USD', 'Active', 'enterprise', v_it_manager_id, CURRENT_DATE - INTERVAL '3 months'),
    (uuid_generate_v4(), 'ADOBE-ACRO-001', 'Adobe Acrobat Pro DC', 'Adobe', 'subscription', 50, 48,
     CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '11 months', CURRENT_DATE + INTERVAL '10 months', true, 12000.00, 'USD', 'Active', 'standard', v_it_manager_id, CURRENT_DATE - INTERVAL '1 month'),
    
    -- Development Tools
    (uuid_generate_v4(), 'JETBRAINS-001', 'JetBrains All Products Pack', 'JetBrains', 'subscription', 20, 18,
     CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '10 months', CURRENT_DATE + INTERVAL '9 months', true, 8000.00, 'USD', 'Active', 'standard', v_it_manager_id, CURRENT_DATE - INTERVAL '2 months'),
    (uuid_generate_v4(), 'GITHUB-ENT-001', 'GitHub Enterprise', 'GitHub', 'subscription', 1, 1,
     CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '11 months', CURRENT_DATE + INTERVAL '10 months', true, 21000.00, 'USD', 'Active', 'enterprise', v_it_manager_id, CURRENT_DATE - INTERVAL '1 year'),
    
    -- Security Software
    (uuid_generate_v4(), 'CROWDSTRIKE-001', 'CrowdStrike Falcon Enterprise', 'CrowdStrike', 'subscription', 100, 95,
     CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE + INTERVAL '8 months', CURRENT_DATE + INTERVAL '7 months', true, 35000.00, 'USD', 'Active', 'enterprise', v_it_manager_id, CURRENT_DATE - INTERVAL '4 months'),
    (uuid_generate_v4(), 'OKTA-001', 'Okta Workforce Identity', 'Okta', 'subscription', 1, 1,
     CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '6 months', CURRENT_DATE + INTERVAL '5 months', true, 24000.00, 'USD', 'Active', 'enterprise', v_it_manager_id, CURRENT_DATE - INTERVAL '6 months'),
    
    -- Collaboration Tools
    (uuid_generate_v4(), 'SLACK-ENT-001', 'Slack Enterprise Grid', 'Slack', 'subscription', 1, 1,
     CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '9 months', CURRENT_DATE + INTERVAL '8 months', true, 15000.00, 'USD', 'Active', 'enterprise', v_it_manager_id, CURRENT_DATE - INTERVAL '3 months'),
    (uuid_generate_v4(), 'ZOOM-ENT-001', 'Zoom Enterprise', 'Zoom', 'subscription', 1, 1,
     CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '10 months', CURRENT_DATE + INTERVAL '9 months', true, 12000.00, 'USD', 'Active', 'enterprise', v_it_manager_id, CURRENT_DATE - INTERVAL '2 months'),
    
    -- Database & Analytics
    (uuid_generate_v4(), 'TABLEAU-001', 'Tableau Desktop Professional', 'Tableau', 'subscription', 15, 12,
     CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE + INTERVAL '7 months', CURRENT_DATE + INTERVAL '6 months', true, 18000.00, 'USD', 'Active', 'premium', v_it_manager_id, CURRENT_DATE - INTERVAL '5 months'),
    (uuid_generate_v4(), 'SALESFORCE-001', 'Salesforce Enterprise Edition', 'Salesforce', 'subscription', 50, 48,
     CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '11 months', CURRENT_DATE + INTERVAL '10 months', true, 60000.00, 'USD', 'Active', 'enterprise', v_it_manager_id, CURRENT_DATE - INTERVAL '1 year'),
    
    -- Expiring Soon (for alerts)
    (uuid_generate_v4(), 'EXPIRING-001', 'Test Software License', 'Test Vendor', 'subscription', 10, 8,
     CURRENT_DATE - INTERVAL '11 months', CURRENT_DATE + INTERVAL '25 days', CURRENT_DATE + INTERVAL '20 days', false, 5000.00, 'USD', 'Pending_Renewal', 'standard', v_it_manager_id, CURRENT_DATE - INTERVAL '11 months'),
    (uuid_generate_v4(), 'EXPIRING-002', 'Another Expiring License', 'Test Vendor', 'subscription', 5, 4,
     CURRENT_DATE - INTERVAL '11 months', CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE + INTERVAL '55 days', false, 3000.00, 'USD', 'Pending_Renewal', 'standard', v_it_manager_id, CURRENT_DATE - INTERVAL '11 months'),
    
    -- Additional Licenses
    (uuid_generate_v4(), 'VMWARE-001', 'VMware vSphere Enterprise Plus', 'VMware', 'perpetual', 10, 8,
     CURRENT_DATE - INTERVAL '2 years', NULL, NULL, false, 40000.00, 'USD', 'Active', 'premium', v_it_manager_id, CURRENT_DATE - INTERVAL '2 years'),
    (uuid_generate_v4(), 'CISCO-001', 'Cisco AnyConnect VPN', 'Cisco', 'subscription', 100, 90,
     CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '9 months', CURRENT_DATE + INTERVAL '8 months', true, 10000.00, 'USD', 'Active', 'standard', v_it_manager_id, CURRENT_DATE - INTERVAL '3 months'),
    (uuid_generate_v4(), 'ATLASSIAN-001', 'Atlassian Jira & Confluence', 'Atlassian', 'subscription', 1, 1,
     CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '6 months', CURRENT_DATE + INTERVAL '5 months', true, 14000.00, 'USD', 'Active', 'enterprise', v_it_manager_id, CURRENT_DATE - INTERVAL '6 months'),
    (uuid_generate_v4(), 'SERVICENOW-001', 'ServiceNow IT Service Management', 'ServiceNow', 'subscription', 1, 1,
     CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '11 months', CURRENT_DATE + INTERVAL '10 months', true, 45000.00, 'USD', 'Active', 'enterprise', v_it_manager_id, CURRENT_DATE - INTERVAL '1 year');
END $$;

-- ============================================
-- SEED SOFTWARE LICENSE ASSIGNMENTS
-- ============================================
-- Assign licenses to random users
INSERT INTO public.software_license_assignments (
  id, license_id, assigned_to, assigned_to_name, assigned_date, status, device_name, installation_date, created_at
)
SELECT
  uuid_generate_v4(),
  sl.id,
  up.id,
  up.full_name,
  sl.purchase_date + (RANDOM() * 30)::INTEGER,
  'Active',
  CASE 
    WHEN RANDOM() > 0.5 THEN 'Laptop-' || LPAD((RANDOM() * 1000)::INTEGER::TEXT, 4, '0')
    ELSE 'Desktop-' || LPAD((RANDOM() * 500)::INTEGER::TEXT, 4, '0')
  END,
  sl.purchase_date + (RANDOM() * 30)::INTEGER,
  sl.purchase_date + (RANDOM() * 30)::INTEGER
FROM public.software_licenses sl
CROSS JOIN LATERAL (
  SELECT id, full_name FROM public.user_profiles
  WHERE is_active = true
  ORDER BY RANDOM()
  LIMIT sl.used_licenses
) up
WHERE sl.status = 'Active' AND sl.used_licenses > 0
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED SYSTEM MONITORING
-- ============================================
DO $$
DECLARE
  v_it_manager_id UUID;
BEGIN
  SELECT id INTO v_it_manager_id FROM public.user_profiles WHERE email = 'jason.miller@company.com' LIMIT 1;

  INSERT INTO public.system_monitoring (
    id, system_name, system_type, environment, status, uptime_percentage,
    cpu_usage, memory_usage, disk_usage, network_latency_ms, response_time_ms,
    location, ip_address, hostname, operating_system, version, monitored_by, created_at
  )
  VALUES
    -- Production Servers
    (uuid_generate_v4(), 'Production Database Server', 'database', 'production', 'operational', 99.98,
     45.2, 62.5, 58.3, 12, 25, 'Primary Data Center', '10.0.1.10', 'db-prod-01', 'Linux', 'Ubuntu 22.04', v_it_manager_id, CURRENT_DATE - INTERVAL '2 years'),
    (uuid_generate_v4(), 'Production Application Server', 'application', 'production', 'operational', 99.95,
     52.8, 68.2, 45.7, 15, 30, 'Primary Data Center', '10.0.1.20', 'app-prod-01', 'Linux', 'Ubuntu 22.04', v_it_manager_id, CURRENT_DATE - INTERVAL '2 years'),
    (uuid_generate_v4(), 'Email Server', 'application', 'production', 'operational', 99.92,
     38.5, 55.3, 42.1, 10, 20, 'Primary Data Center', '10.0.1.30', 'mail-prod-01', 'Windows Server', '2022', v_it_manager_id, CURRENT_DATE - INTERVAL '2 years'),
    (uuid_generate_v4(), 'File Server', 'server', 'production', 'operational', 99.90,
     28.3, 48.7, 72.5, 8, 15, 'Primary Data Center', '10.0.1.40', 'file-prod-01', 'Windows Server', '2022', v_it_manager_id, CURRENT_DATE - INTERVAL '2 years'),
    
    -- Network Infrastructure
    (uuid_generate_v4(), 'Core Router', 'network', 'production', 'operational', 99.99,
     15.2, 25.8, NULL, 5, NULL, 'Primary Data Center', '10.0.0.1', 'router-core-01', 'Cisco IOS', '15.7', v_it_manager_id, CURRENT_DATE - INTERVAL '3 years'),
    (uuid_generate_v4(), 'Core Switch', 'network', 'production', 'operational', 99.97,
     12.5, 22.3, NULL, 3, NULL, 'Primary Data Center', '10.0.0.2', 'switch-core-01', 'Cisco IOS', '15.7', v_it_manager_id, CURRENT_DATE - INTERVAL '3 years'),
    (uuid_generate_v4(), 'Firewall', 'network', 'production', 'operational', 99.96,
     18.7, 30.5, NULL, 4, NULL, 'Primary Data Center', '10.0.0.3', 'fw-main-01', 'FortiOS', '7.2', v_it_manager_id, CURRENT_DATE - INTERVAL '2 years'),
    
    -- Cloud Services
    (uuid_generate_v4(), 'Azure Production Environment', 'cloud_service', 'production', 'operational', 99.94,
     55.3, 70.2, 60.8, 25, 45, 'Azure East US', 'cloud', 'azure-prod', 'Azure', 'Latest', v_it_manager_id, CURRENT_DATE - INTERVAL '1 year'),
    (uuid_generate_v4(), 'AWS Backup Storage', 'cloud_service', 'production', 'operational', 99.93,
     22.1, 35.6, 85.2, 30, NULL, 'AWS S3', 'cloud', 'aws-backup', 'AWS', 'Latest', v_it_manager_id, CURRENT_DATE - INTERVAL '1 year'),
    
    -- Staging/Development
    (uuid_generate_v4(), 'Staging Database Server', 'database', 'staging', 'operational', 99.85,
     35.8, 50.2, 45.3, 18, 35, 'Secondary Data Center', '10.0.2.10', 'db-staging-01', 'Linux', 'Ubuntu 22.04', v_it_manager_id, CURRENT_DATE - INTERVAL '1 year'),
    (uuid_generate_v4(), 'Development Server', 'server', 'development', 'operational', 99.80,
     48.5, 65.7, 52.4, 20, 40, 'Secondary Data Center', '10.0.2.20', 'dev-server-01', 'Linux', 'Ubuntu 22.04', v_it_manager_id, CURRENT_DATE - INTERVAL '6 months'),
    
    -- Systems with Issues (for testing alerts)
    (uuid_generate_v4(), 'Backup Server', 'server', 'production', 'degraded', 98.50,
     75.2, 88.5, 92.3, 45, 120, 'Primary Data Center', '10.0.1.50', 'backup-prod-01', 'Windows Server', '2022', v_it_manager_id, CURRENT_DATE - INTERVAL '2 years'),
    (uuid_generate_v4(), 'Test Environment', 'application', 'development', 'maintenance', 95.00,
     15.3, 25.8, 30.2, 10, 25, 'Secondary Data Center', '10.0.2.30', 'test-env-01', 'Linux', 'Ubuntu 22.04', v_it_manager_id, CURRENT_DATE - INTERVAL '3 months'),
    
    -- Additional Systems
    (uuid_generate_v4(), 'Monitoring Server', 'server', 'production', 'operational', 99.88,
     25.6, 40.3, 35.7, 12, 22, 'Primary Data Center', '10.0.1.60', 'monitor-prod-01', 'Linux', 'Ubuntu 22.04', v_it_manager_id, CURRENT_DATE - INTERVAL '1 year'),
    (uuid_generate_v4(), 'DNS Server', 'server', 'production', 'operational', 99.99,
     8.5, 15.2, 20.4, 2, 5, 'Primary Data Center', '10.0.1.70', 'dns-prod-01', 'Linux', 'Ubuntu 22.04', v_it_manager_id, CURRENT_DATE - INTERVAL '3 years');
END $$;

-- ============================================
-- SEED SYSTEM INCIDENTS
-- ============================================
DO $$
DECLARE
  v_it_manager_id UUID;
  v_support_lead_id UUID;
  v_network_engineer_id UUID;
  v_system_admin_id UUID;
  v_systems UUID[];
  v_incident_counter INTEGER := 1;
BEGIN
  -- Get IT staff IDs
  SELECT id INTO v_it_manager_id FROM public.user_profiles WHERE email = 'jason.miller@company.com' LIMIT 1;
  SELECT id INTO v_support_lead_id FROM public.user_profiles WHERE email = 'alice.wong@company.com' LIMIT 1;
  SELECT id INTO v_network_engineer_id FROM public.user_profiles WHERE email = 'thomas.allen@company.com' LIMIT 1;
  SELECT id INTO v_system_admin_id FROM public.user_profiles WHERE email = 'nia.rodriguez@company.com' LIMIT 1;
  
  SELECT ARRAY_AGG(id) INTO v_systems FROM public.system_monitoring LIMIT 15;

  -- Insert system incidents
  FOR i IN 1..20 LOOP
    INSERT INTO public.system_incidents (
      id, incident_number, system_id, system_name, title, description, severity, status,
      reported_by, reported_by_name, assigned_to, assigned_to_name, started_at, resolved_at,
      resolution_time_minutes, impact_description, root_cause, resolution_steps, affected_users,
      created_at
    )
    SELECT
      uuid_generate_v4(),
      'INC-' || TO_CHAR(CURRENT_DATE - (RANDOM() * 90)::INTEGER, 'YYYY') || '-' || LPAD(v_incident_counter::TEXT, 4, '0'),
      v_systems[(RANDOM() * (array_length(v_systems, 1) - 1) + 1)::INTEGER],
      sm.system_name,
      CASE 
        WHEN RANDOM() > 0.7 THEN 'System Performance Degradation'
        WHEN RANDOM() > 0.5 THEN 'Network Connectivity Issue'
        WHEN RANDOM() > 0.3 THEN 'Application Error'
        ELSE 'Service Interruption'
      END,
      'Detailed description of the incident and its impact on operations.',
      CASE 
        WHEN RANDOM() > 0.8 THEN 'critical'
        WHEN RANDOM() > 0.5 THEN 'high'
        WHEN RANDOM() > 0.3 THEN 'medium'
        ELSE 'low'
      END,
      CASE 
        WHEN RANDOM() > 0.6 THEN 'resolved'
        WHEN RANDOM() > 0.3 THEN 'investigating'
        ELSE 'open'
      END,
      v_it_manager_id,
      'Jason Miller',
      CASE 
        WHEN RANDOM() > 0.6 THEN v_support_lead_id
        WHEN RANDOM() > 0.3 THEN v_network_engineer_id
        ELSE v_system_admin_id
      END,
      CASE 
        WHEN RANDOM() > 0.6 THEN 'Alice Wong'
        WHEN RANDOM() > 0.3 THEN 'Thomas Allen'
        ELSE 'Nia Rodriguez'
      END,
      CURRENT_DATE - (RANDOM() * 90)::INTEGER + (RANDOM() * 12)::INTEGER,
      CASE 
        WHEN RANDOM() > 0.6 THEN CURRENT_DATE - (RANDOM() * 30)::INTEGER + (RANDOM() * 12)::INTEGER
        ELSE NULL
      END,
      CASE 
        WHEN RANDOM() > 0.6 THEN (30 + RANDOM() * 240)::INTEGER
        ELSE NULL
      END,
      'Impact description: ' || CASE WHEN RANDOM() > 0.5 THEN 'Affected multiple users' ELSE 'Limited impact' END,
      CASE 
        WHEN RANDOM() > 0.6 THEN 'Root cause identified and documented'
        ELSE NULL
      END,
      CASE 
        WHEN RANDOM() > 0.6 THEN 'Resolution steps: 1. Identified issue 2. Applied fix 3. Verified resolution'
        ELSE NULL
      END,
      (10 + RANDOM() * 90)::INTEGER,
      CURRENT_DATE - (RANDOM() * 90)::INTEGER + (RANDOM() * 12)::INTEGER
    FROM public.system_monitoring sm
    WHERE sm.id = v_systems[(RANDOM() * (array_length(v_systems, 1) - 1) + 1)::INTEGER]
    LIMIT 1;

    v_incident_counter := v_incident_counter + 1;
  END LOOP;
END $$;

-- ============================================
-- SEED IT PROJECTS
-- ============================================
DO $$
DECLARE
  v_it_manager_user_id UUID;
  v_support_lead_user_id UUID;
  v_network_engineer_user_id UUID;
  v_system_admin_user_id UUID;
  v_it_manager_employee_id UUID;
  v_support_lead_employee_id UUID;
  v_network_engineer_employee_id UUID;
  v_system_admin_employee_id UUID;
BEGIN
  -- Get IT staff user profile IDs
  SELECT id INTO v_it_manager_user_id FROM public.user_profiles WHERE email = 'jason.miller@company.com' LIMIT 1;
  SELECT id INTO v_support_lead_user_id FROM public.user_profiles WHERE email = 'alice.wong@company.com' LIMIT 1;
  SELECT id INTO v_network_engineer_user_id FROM public.user_profiles WHERE email = 'thomas.allen@company.com' LIMIT 1;
  SELECT id INTO v_system_admin_user_id FROM public.user_profiles WHERE email = 'nia.rodriguez@company.com' LIMIT 1;

  -- Get corresponding employee IDs (projects.owner_id references employees.id)
  SELECT id INTO v_it_manager_employee_id FROM public.employees WHERE user_id = v_it_manager_user_id LIMIT 1;
  SELECT id INTO v_support_lead_employee_id FROM public.employees WHERE user_id = v_support_lead_user_id LIMIT 1;
  SELECT id INTO v_network_engineer_employee_id FROM public.employees WHERE user_id = v_network_engineer_user_id LIMIT 1;
  SELECT id INTO v_system_admin_employee_id FROM public.employees WHERE user_id = v_system_admin_user_id LIMIT 1;

  -- Insert IT projects (using employee IDs for owner_id)
  INSERT INTO public.projects (
    id, name, department, status, progress, due_date, owner_id, owner_name, description, budget,
    project_type, technology_stack, infrastructure_impact, risk_level, technical_lead_id, technical_lead_name,
    created_at
  )
  VALUES
    (uuid_generate_v4(), 'Email System Migration to Office 365', 'Information Technology', 'Active', 75,
     CURRENT_DATE + INTERVAL '2 months', v_it_manager_employee_id, 'Jason Miller',
     'Migrate entire email infrastructure from on-premise Exchange to Office 365 cloud solution',
     50000.00, 'migration', ARRAY['Office 365', 'Exchange', 'Azure AD'], 'High impact - affects all users', 'high',
     v_system_admin_user_id, 'Nia Rodriguez', CURRENT_DATE - INTERVAL '3 months'),
     
    (uuid_generate_v4(), 'Network Infrastructure Upgrade', 'Information Technology', 'Active', 60,
     CURRENT_DATE + INTERVAL '4 months', v_it_manager_employee_id, 'Jason Miller',
     'Upgrade core network infrastructure with new switches, routers, and firewalls',
     120000.00, 'infrastructure', ARRAY['Cisco', 'Fortinet'], 'Critical infrastructure upgrade', 'critical',
     v_network_engineer_user_id, 'Thomas Allen', CURRENT_DATE - INTERVAL '2 months'),
     
    (uuid_generate_v4(), 'Security Enhancement Project', 'Information Technology', 'Active', 45,
     CURRENT_DATE + INTERVAL '3 months', v_it_manager_employee_id, 'Jason Miller',
     'Implement multi-factor authentication and enhance security monitoring',
     35000.00, 'security', ARRAY['Okta', 'CrowdStrike', 'SIEM'], 'Improves overall security posture', 'high',
     v_system_admin_user_id, 'Nia Rodriguez', CURRENT_DATE - INTERVAL '1 month'),
     
    (uuid_generate_v4(), 'Backup System Modernization', 'Information Technology', 'Active', 80,
     CURRENT_DATE + INTERVAL '1 month', v_it_manager_employee_id, 'Jason Miller',
     'Upgrade backup systems with new hardware and cloud backup integration',
     45000.00, 'infrastructure', ARRAY['Veeam', 'AWS S3', 'Azure Backup'], 'Improves data protection', 'medium',
     v_system_admin_user_id, 'Nia Rodriguez', CURRENT_DATE - INTERVAL '4 months'),
     
    (uuid_generate_v4(), 'Help Desk System Implementation', 'Information Technology', 'Planning', 25,
     CURRENT_DATE + INTERVAL '6 months', v_it_manager_employee_id, 'Jason Miller',
     'Implement new IT service management system for better ticket tracking',
     60000.00, 'software_development', ARRAY['ServiceNow', 'REST API'], 'Improves support efficiency', 'medium',
     v_support_lead_user_id, 'Alice Wong', CURRENT_DATE - INTERVAL '1 month'),
     
    (uuid_generate_v4(), 'Server Virtualization Project', 'Information Technology', 'Active', 90,
     CURRENT_DATE + INTERVAL '2 weeks', v_it_manager_employee_id, 'Jason Miller',
     'Virtualize remaining physical servers to improve resource utilization',
     75000.00, 'infrastructure', ARRAY['VMware vSphere', 'ESXi'], 'Improves server efficiency', 'medium',
     v_system_admin_user_id, 'Nia Rodriguez', CURRENT_DATE - INTERVAL '5 months'),
     
    (uuid_generate_v4(), 'Cloud Migration Phase 1', 'Information Technology', 'Active', 55,
     CURRENT_DATE + INTERVAL '5 months', v_it_manager_employee_id, 'Jason Miller',
     'Migrate non-critical applications to Azure cloud infrastructure',
     100000.00, 'migration', ARRAY['Azure', 'Docker', 'Kubernetes'], 'Reduces on-premise infrastructure', 'high',
     v_system_admin_user_id, 'Nia Rodriguez', CURRENT_DATE - INTERVAL '2 months'),
     
    (uuid_generate_v4(), 'WiFi Network Expansion', 'Information Technology', 'Planning', 15,
     CURRENT_DATE + INTERVAL '8 months', v_it_manager_employee_id, 'Jason Miller',
     'Expand WiFi coverage to all office areas with new access points',
     30000.00, 'infrastructure', ARRAY['Cisco Meraki', '802.11ax'], 'Improves connectivity', 'low',
     v_network_engineer_user_id, 'Thomas Allen', CURRENT_DATE - INTERVAL '2 weeks'),
     
    (uuid_generate_v4(), 'Database Performance Optimization', 'Information Technology', 'Active', 70,
     CURRENT_DATE + INTERVAL '2 months', v_it_manager_employee_id, 'Jason Miller',
     'Optimize database performance with indexing and query improvements',
     25000.00, 'maintenance', ARRAY['SQL Server', 'PostgreSQL'], 'Improves application performance', 'medium',
     v_system_admin_user_id, 'Nia Rodriguez', CURRENT_DATE - INTERVAL '3 months'),
     
    (uuid_generate_v4(), 'Disaster Recovery Site Setup', 'Information Technology', 'Planning', 10,
     CURRENT_DATE + INTERVAL '12 months', v_it_manager_employee_id, 'Jason Miller',
     'Establish secondary disaster recovery site for business continuity',
     150000.00, 'infrastructure', ARRAY['VMware', 'Storage', 'Network'], 'Critical for business continuity', 'critical',
     v_it_manager_user_id, 'Jason Miller', CURRENT_DATE - INTERVAL '1 month');
END $$;

-- ============================================
-- SEED SUPPORT REQUESTS (IT-Specific)
-- ============================================
DO $$
DECLARE
  v_it_manager_id UUID;
  v_support_lead_id UUID;
  v_network_engineer_id UUID;
  v_system_admin_id UUID;
  v_it_technician_id UUID;
  v_random_users UUID[];
  v_systems UUID[];
  v_assets UUID[];
  v_projects UUID[];
  v_ticket_counter INTEGER := 1;
BEGIN
  -- Get IT staff IDs
  SELECT id INTO v_it_manager_id FROM public.user_profiles WHERE email = 'jason.miller@company.com' LIMIT 1;
  SELECT id INTO v_support_lead_id FROM public.user_profiles WHERE email = 'alice.wong@company.com' LIMIT 1;
  SELECT id INTO v_network_engineer_id FROM public.user_profiles WHERE email = 'thomas.allen@company.com' LIMIT 1;
  SELECT id INTO v_system_admin_id FROM public.user_profiles WHERE email = 'nia.rodriguez@company.com' LIMIT 1;
  SELECT id INTO v_it_technician_id FROM public.user_profiles WHERE email = 'peter.osei@company.com' LIMIT 1;
  
  SELECT ARRAY_AGG(id) INTO v_random_users FROM public.user_profiles WHERE is_active = true AND department != 'Information Technology' LIMIT 50;
  SELECT ARRAY_AGG(id) INTO v_systems FROM public.system_monitoring LIMIT 10;
  SELECT ARRAY_AGG(id) INTO v_assets FROM public.assets WHERE category IN ('IT Equipment', 'Hardware', 'Network Equipment') LIMIT 20;
  SELECT ARRAY_AGG(id) INTO v_projects FROM public.projects WHERE department = 'Information Technology' LIMIT 5;

  -- Insert support requests
  FOR i IN 1..30 LOOP
    DECLARE
      v_requester_id UUID;
      v_requester_name VARCHAR(255);
      v_assignee_id UUID;
      v_assignee_name VARCHAR(255);
      v_project_id UUID;
      v_project_name VARCHAR(255);
      v_asset_id UUID;
      v_asset_name VARCHAR(255);
      v_system_id UUID;
      v_system_name VARCHAR(255);
      v_assignee_random DECIMAL;
    BEGIN
      -- Select random requester (once)
      v_requester_id := v_random_users[(RANDOM() * (array_length(v_random_users, 1) - 1) + 1)::INTEGER];
      SELECT COALESCE(full_name, 'Unknown User') INTO v_requester_name FROM public.user_profiles WHERE id = v_requester_id LIMIT 1;
      
      -- Ensure we have a valid requester name
      IF v_requester_name IS NULL THEN
        v_requester_name := 'Unknown User';
      END IF;
      
      -- Select assignee (using single random value)
      v_assignee_random := RANDOM();
      IF v_assignee_random > 0.6 THEN
        v_assignee_id := v_support_lead_id;
        v_assignee_name := 'Alice Wong';
      ELSIF v_assignee_random > 0.4 THEN
        v_assignee_id := v_it_technician_id;
        v_assignee_name := 'Peter Osei';
      ELSIF v_assignee_random > 0.2 THEN
        v_assignee_id := v_system_admin_id;
        v_assignee_name := 'Nia Rodriguez';
      ELSE
        v_assignee_id := NULL;
        v_assignee_name := NULL;
      END IF;
      
      -- Select optional project
      IF RANDOM() > 0.7 AND array_length(v_projects, 1) > 0 THEN
        v_project_id := v_projects[(RANDOM() * (array_length(v_projects, 1) - 1) + 1)::INTEGER];
        SELECT name INTO v_project_name FROM public.projects WHERE id = v_project_id LIMIT 1;
      ELSE
        v_project_id := NULL;
        v_project_name := NULL;
      END IF;
      
      -- Select optional asset
      IF RANDOM() > 0.6 AND array_length(v_assets, 1) > 0 THEN
        v_asset_id := v_assets[(RANDOM() * (array_length(v_assets, 1) - 1) + 1)::INTEGER];
        SELECT name INTO v_asset_name FROM public.assets WHERE id = v_asset_id LIMIT 1;
      ELSE
        v_asset_id := NULL;
        v_asset_name := NULL;
      END IF;
      
      -- Select optional system
      IF RANDOM() > 0.5 AND array_length(v_systems, 1) > 0 THEN
        v_system_id := v_systems[(RANDOM() * (array_length(v_systems, 1) - 1) + 1)::INTEGER];
        SELECT system_name INTO v_system_name FROM public.system_monitoring WHERE id = v_system_id LIMIT 1;
      ELSE
        v_system_id := NULL;
        v_system_name := NULL;
      END IF;
      
      -- Insert support request
      INSERT INTO public.support_requests (
        id, type, title, description, requester_id, requester_name, assignee_id, assignee_name,
        priority, status, category, subcategory, source, sla_target_hours, first_response_at,
        due_date, project_id, project_name, asset_id, asset_name, system_id, system_name,
        created_at, updated_at
      )
      VALUES (
        uuid_generate_v4(),
        CASE 
          WHEN RANDOM() > 0.7 THEN 'Hardware'
          WHEN RANDOM() > 0.5 THEN 'Software'
          WHEN RANDOM() > 0.3 THEN 'Network'
          ELSE 'Technical'
        END,
        CASE 
          WHEN RANDOM() > 0.8 THEN 'Cannot access email account'
          WHEN RANDOM() > 0.6 THEN 'Laptop not connecting to WiFi'
          WHEN RANDOM() > 0.4 THEN 'Software installation request'
          WHEN RANDOM() > 0.2 THEN 'Password reset needed'
          ELSE 'Printer not working'
        END,
        'Detailed description of the support request and issue encountered.',
        v_requester_id,
        v_requester_name,
        v_assignee_id,
        v_assignee_name,
      CASE 
        WHEN RANDOM() > 0.8 THEN 'Critical'
        WHEN RANDOM() > 0.5 THEN 'High'
        WHEN RANDOM() > 0.3 THEN 'Medium'
        ELSE 'Low'
      END,
      CASE 
        WHEN RANDOM() > 0.6 THEN 'Resolved'
        WHEN RANDOM() > 0.4 THEN 'In Progress'
        WHEN RANDOM() > 0.2 THEN 'Pending'
        ELSE 'Pending'
      END,
      CASE 
        WHEN RANDOM() > 0.7 THEN 'Technical'
        WHEN RANDOM() > 0.5 THEN 'Hardware'
        WHEN RANDOM() > 0.3 THEN 'Software'
        ELSE 'Account'
      END,
      CASE 
        WHEN RANDOM() > 0.5 THEN 'Email'
        WHEN RANDOM() > 0.3 THEN 'Network'
        ELSE 'General'
      END,
      CASE 
        WHEN RANDOM() > 0.6 THEN 'Portal'
        WHEN RANDOM() > 0.4 THEN 'Email'
        WHEN RANDOM() > 0.2 THEN 'Phone'
        ELSE 'Internal'
      END,
      CASE 
        WHEN RANDOM() > 0.8 THEN 1
        WHEN RANDOM() > 0.5 THEN 4
        ELSE 24
      END,
      CASE 
        WHEN RANDOM() > 0.5 THEN CURRENT_DATE - (RANDOM() * 30)::INTEGER + (RANDOM() * 12)::INTEGER
        ELSE NULL
      END,
      CURRENT_DATE - (RANDOM() * 30)::INTEGER + (RANDOM() * 12)::INTEGER + INTERVAL '2 days',
      v_project_id,
      v_project_name,
      v_asset_id,
      v_asset_name,
      v_system_id,
      v_system_name,
      CURRENT_DATE - (RANDOM() * 60)::INTEGER + (RANDOM() * 12)::INTEGER,
      CURRENT_DATE - (RANDOM() * 30)::INTEGER + (RANDOM() * 12)::INTEGER
      );
    END;
  END LOOP;
END $$;

-- ============================================
-- SEED IT ASSET MAINTENANCE
-- ============================================
DO $$
DECLARE
  v_it_technician_id UUID;
  v_system_admin_id UUID;
  v_assets UUID[];
BEGIN
  SELECT id INTO v_it_technician_id FROM public.user_profiles WHERE email = 'peter.osei@company.com' LIMIT 1;
  SELECT id INTO v_system_admin_id FROM public.user_profiles WHERE email = 'nia.rodriguez@company.com' LIMIT 1;
  
  SELECT ARRAY_AGG(id) INTO v_assets FROM public.assets WHERE category IN ('IT Equipment', 'Hardware', 'Network Equipment') LIMIT 25;

  -- Insert maintenance records
  FOR i IN 1..25 LOOP
    INSERT INTO public.it_asset_maintenance (
      id, asset_id, maintenance_type, scheduled_date, completed_date,
      performed_by, performed_by_name, cost, description, status, created_at
    )
    SELECT
      uuid_generate_v4(),
      v_assets[i],
      CASE 
        WHEN RANDOM() > 0.6 THEN 'preventive'
        WHEN RANDOM() > 0.4 THEN 'repair'
        WHEN RANDOM() > 0.2 THEN 'upgrade'
        ELSE 'security_patch'
      END,
      CURRENT_DATE - (RANDOM() * 180)::INTEGER,
      CASE 
        WHEN RANDOM() > 0.5 THEN CURRENT_DATE - (RANDOM() * 90)::INTEGER
        ELSE NULL
      END,
      CASE 
        WHEN RANDOM() > 0.5 THEN v_it_technician_id
        ELSE v_system_admin_id
      END,
      CASE 
        WHEN RANDOM() > 0.5 THEN 'Peter Osei'
        ELSE 'Nia Rodriguez'
      END,
      (50 + RANDOM() * 500)::DECIMAL(10,2),
      'Maintenance description and work performed on the asset.',
      CASE 
        WHEN RANDOM() > 0.6 THEN 'completed'
        WHEN RANDOM() > 0.3 THEN 'in_progress'
        ELSE 'scheduled'
      END,
      CURRENT_DATE - (RANDOM() * 180)::INTEGER
    WHERE i <= array_length(v_assets, 1);
  END LOOP;
END $$;

-- ============================================
-- SUMMARY
-- ============================================
DO $$
DECLARE
  v_licenses_count INTEGER;
  v_assignments_count INTEGER;
  v_systems_count INTEGER;
  v_incidents_count INTEGER;
  v_projects_count INTEGER;
  v_tickets_count INTEGER;
  v_maintenance_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_licenses_count FROM public.software_licenses;
  SELECT COUNT(*) INTO v_assignments_count FROM public.software_license_assignments;
  SELECT COUNT(*) INTO v_systems_count FROM public.system_monitoring;
  SELECT COUNT(*) INTO v_incidents_count FROM public.system_incidents;
  SELECT COUNT(*) INTO v_projects_count FROM public.projects WHERE department = 'Information Technology';
  SELECT COUNT(*) INTO v_tickets_count FROM public.support_requests;
  SELECT COUNT(*) INTO v_maintenance_count FROM public.it_asset_maintenance;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'IT Data Seeding Complete!';
  RAISE NOTICE 'Software Licenses: %', v_licenses_count;
  RAISE NOTICE 'License Assignments: %', v_assignments_count;
  RAISE NOTICE 'System Monitoring: %', v_systems_count;
  RAISE NOTICE 'System Incidents: %', v_incidents_count;
  RAISE NOTICE 'IT Projects: %', v_projects_count;
  RAISE NOTICE 'Support Requests: %', v_tickets_count;
  RAISE NOTICE 'Asset Maintenance: %', v_maintenance_count;
  RAISE NOTICE '========================================';
END $$;

