-- ============================================
-- INFORMATION TECHNOLOGY (IT) DEPARTMENT TABLES
-- ============================================
-- This migration creates comprehensive tables for IT operations
-- including software licenses, IT projects, system monitoring, and IT-specific support
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SOFTWARE LICENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.software_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_number VARCHAR(100) UNIQUE NOT NULL,
  software_name VARCHAR(255) NOT NULL,
  vendor VARCHAR(255) NOT NULL,
  license_type VARCHAR(100) NOT NULL, -- perpetual, subscription, concurrent, named_user, site_license
  total_licenses INTEGER NOT NULL DEFAULT 1,
  used_licenses INTEGER DEFAULT 0,
  available_licenses INTEGER GENERATED ALWAYS AS (total_licenses - used_licenses) STORED,
  purchase_date DATE NOT NULL,
  expiration_date DATE,
  renewal_date DATE,
  auto_renew BOOLEAN DEFAULT false,
  cost DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'Active', -- Active, Expired, Suspended, Pending_Renewal
  purchase_order_id UUID REFERENCES public.procurement_orders(id) ON DELETE SET NULL,
  vendor_contact VARCHAR(255),
  vendor_email VARCHAR(255),
  support_level VARCHAR(100), -- standard, premium, enterprise
  notes TEXT,
  managed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SOFTWARE LICENSE ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.software_license_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_id UUID REFERENCES public.software_licenses(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  assigned_to_name VARCHAR(255),
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  unassigned_date DATE,
  status VARCHAR(50) DEFAULT 'Active', -- Active, Inactive
  device_name VARCHAR(255),
  installation_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partial unique index for active assignments only
CREATE UNIQUE INDEX IF NOT EXISTS idx_software_license_assignments_active_unique
ON public.software_license_assignments(license_id, assigned_to)
WHERE status = 'Active';

-- ============================================
-- IT PROJECTS TABLE (Enhanced from projects)
-- ============================================
-- Note: This extends the base projects table with IT-specific fields
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_type VARCHAR(100), -- infrastructure, software_development, migration, upgrade, security, maintenance
  ADD COLUMN IF NOT EXISTS technology_stack TEXT[], -- Array of technologies used
  ADD COLUMN IF NOT EXISTS infrastructure_impact TEXT, -- Impact on infrastructure
  ADD COLUMN IF NOT EXISTS risk_level VARCHAR(50) DEFAULT 'medium', -- low, medium, high, critical
  ADD COLUMN IF NOT EXISTS technical_lead_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS technical_lead_name VARCHAR(255);

-- ============================================
-- SYSTEM MONITORING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.system_monitoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  system_name VARCHAR(255) NOT NULL,
  system_type VARCHAR(100) NOT NULL, -- server, database, network, application, cloud_service
  environment VARCHAR(50) NOT NULL, -- production, staging, development
  status VARCHAR(50) NOT NULL DEFAULT 'operational', -- operational, degraded, down, maintenance
  uptime_percentage DECIMAL(5,2) DEFAULT 99.00,
  last_check_at TIMESTAMPTZ DEFAULT NOW(),
  cpu_usage DECIMAL(5,2),
  memory_usage DECIMAL(5,2),
  disk_usage DECIMAL(5,2),
  network_latency_ms INTEGER,
  response_time_ms INTEGER,
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  location VARCHAR(255), -- data_center, cloud_region, office_location
  ip_address VARCHAR(50),
  hostname VARCHAR(255),
  operating_system VARCHAR(255),
  version VARCHAR(100),
  notes TEXT,
  monitored_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SYSTEM INCIDENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.system_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_number VARCHAR(50) UNIQUE NOT NULL,
  system_id UUID REFERENCES public.system_monitoring(id) ON DELETE SET NULL,
  system_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(50) NOT NULL DEFAULT 'medium', -- critical, high, medium, low
  status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, investigating, resolved, closed
  reported_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reported_by_name VARCHAR(255),
  assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  assigned_to_name VARCHAR(255),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_time_minutes INTEGER,
  impact_description TEXT,
  root_cause TEXT,
  resolution_steps TEXT,
  affected_users INTEGER,
  related_ticket_id UUID REFERENCES public.support_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENHANCE SUPPORT_REQUESTS FOR IT
-- ============================================
ALTER TABLE public.support_requests
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS asset_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS system_id UUID REFERENCES public.system_monitoring(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS system_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS resolution_steps TEXT,
  ADD COLUMN IF NOT EXISTS knowledge_base_url TEXT;

-- ============================================
-- IT ASSET MAINTENANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.it_asset_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(100) NOT NULL, -- preventive, repair, upgrade, security_patch, firmware_update
  scheduled_date DATE,
  completed_date DATE,
  performed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  performed_by_name VARCHAR(255),
  cost DECIMAL(10,2),
  description TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_software_licenses_status ON public.software_licenses(status);
CREATE INDEX IF NOT EXISTS idx_software_licenses_expiration ON public.software_licenses(expiration_date);
CREATE INDEX IF NOT EXISTS idx_software_licenses_vendor ON public.software_licenses(vendor);
CREATE INDEX IF NOT EXISTS idx_software_license_assignments_license ON public.software_license_assignments(license_id);
CREATE INDEX IF NOT EXISTS idx_software_license_assignments_user ON public.software_license_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_system_monitoring_status ON public.system_monitoring(status);
CREATE INDEX IF NOT EXISTS idx_system_monitoring_type ON public.system_monitoring(system_type);
CREATE INDEX IF NOT EXISTS idx_system_incidents_status ON public.system_incidents(status);
CREATE INDEX IF NOT EXISTS idx_system_incidents_system ON public.system_incidents(system_id);
CREATE INDEX IF NOT EXISTS idx_system_incidents_severity ON public.system_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_support_requests_project ON public.support_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_asset ON public.support_requests(asset_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_system ON public.support_requests(system_id);
CREATE INDEX IF NOT EXISTS idx_it_asset_maintenance_asset ON public.it_asset_maintenance(asset_id);
CREATE INDEX IF NOT EXISTS idx_it_asset_maintenance_status ON public.it_asset_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON public.projects(project_type);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.software_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_license_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_asset_maintenance ENABLE ROW LEVEL SECURITY;

-- Software Licenses: IT department can view all, others can view active only
CREATE POLICY "IT can view all licenses" ON public.software_licenses
  FOR SELECT USING (
    public.is_in_department('Information Technology') OR
    public.has_role('dept_manager') OR
    public.has_role('super_admin')
  );

CREATE POLICY "Others can view active licenses" ON public.software_licenses
  FOR SELECT USING (status = 'Active');

CREATE POLICY "IT can manage licenses" ON public.software_licenses
  FOR ALL USING (
    public.is_in_department('Information Technology') OR
    public.has_role('dept_manager') OR
    public.has_role('super_admin')
  );

-- Software License Assignments: Users can view their own, IT can view all
CREATE POLICY "Users can view own assignments" ON public.software_license_assignments
  FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "IT can view all assignments" ON public.software_license_assignments
  FOR SELECT USING (
    public.is_in_department('Information Technology') OR
    public.has_role('dept_manager') OR
    public.has_role('super_admin')
  );

CREATE POLICY "IT can manage assignments" ON public.software_license_assignments
  FOR ALL USING (
    public.is_in_department('Information Technology') OR
    public.has_role('dept_manager') OR
    public.has_role('super_admin')
  );

-- System Monitoring: IT can manage, others can view operational status
CREATE POLICY "IT can manage system monitoring" ON public.system_monitoring
  FOR ALL USING (
    public.is_in_department('Information Technology') OR
    public.has_role('dept_manager') OR
    public.has_role('super_admin')
  );

CREATE POLICY "Users can view system status" ON public.system_monitoring
  FOR SELECT USING (true); -- Read access for all authenticated users

-- System Incidents: IT can manage, others can view
CREATE POLICY "IT can manage incidents" ON public.system_incidents
  FOR ALL USING (
    public.is_in_department('Information Technology') OR
    public.has_role('dept_manager') OR
    public.has_role('super_admin')
  );

CREATE POLICY "Users can view incidents" ON public.system_incidents
  FOR SELECT USING (true);

-- IT Asset Maintenance: IT can manage, others can view
CREATE POLICY "IT can manage asset maintenance" ON public.it_asset_maintenance
  FOR ALL USING (
    public.is_in_department('Information Technology') OR
    public.has_role('dept_manager') OR
    public.has_role('super_admin')
  );

CREATE POLICY "Users can view asset maintenance" ON public.it_asset_maintenance
  FOR SELECT USING (true);

-- ============================================
-- FUNCTIONS FOR AUTOMATED UPDATES
-- ============================================

-- Function to update license usage count
CREATE OR REPLACE FUNCTION public.update_license_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'Active' THEN
    UPDATE public.software_licenses
    SET used_licenses = used_licenses + 1,
        updated_at = NOW()
    WHERE id = NEW.license_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'Active' AND NEW.status != 'Active' THEN
      UPDATE public.software_licenses
      SET used_licenses = GREATEST(0, used_licenses - 1),
          updated_at = NOW()
      WHERE id = NEW.license_id;
    ELSIF OLD.status != 'Active' AND NEW.status = 'Active' THEN
      UPDATE public.software_licenses
      SET used_licenses = used_licenses + 1,
          updated_at = NOW()
      WHERE id = NEW.license_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'Active' THEN
    UPDATE public.software_licenses
    SET used_licenses = GREATEST(0, used_licenses - 1),
        updated_at = NOW()
    WHERE id = OLD.license_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update license usage
CREATE TRIGGER trigger_update_license_usage
  AFTER INSERT OR UPDATE OR DELETE ON public.software_license_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_license_usage();

-- Function to calculate incident resolution time
CREATE OR REPLACE FUNCTION public.calculate_incident_resolution_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND NEW.resolved_at IS NOT NULL AND OLD.status != 'resolved' THEN
    NEW.resolution_time_minutes := EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate resolution time
CREATE TRIGGER trigger_calculate_incident_resolution_time
  BEFORE UPDATE ON public.system_incidents
  FOR EACH ROW
  WHEN (NEW.status = 'resolved' AND OLD.status != 'resolved')
  EXECUTE FUNCTION public.calculate_incident_resolution_time();

-- Function to update system monitoring health score
CREATE OR REPLACE FUNCTION public.calculate_system_health_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate health score based on metrics (0-100)
  NEW.health_score := CASE
    WHEN NEW.status = 'down' THEN 0
    WHEN NEW.status = 'degraded' THEN 30
    WHEN NEW.status = 'maintenance' THEN 50
    WHEN NEW.cpu_usage > 90 OR NEW.memory_usage > 90 OR NEW.disk_usage > 90 THEN 40
    WHEN NEW.cpu_usage > 80 OR NEW.memory_usage > 80 OR NEW.disk_usage > 80 THEN 60
    WHEN NEW.response_time_ms > 1000 THEN 70
    WHEN NEW.status = 'operational' THEN 90 + LEAST(10, (100 - COALESCE(NEW.cpu_usage, 0) - COALESCE(NEW.memory_usage, 0) - COALESCE(NEW.disk_usage, 0)) / 3)
    ELSE 80
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate health score
CREATE TRIGGER trigger_calculate_system_health_score
  BEFORE INSERT OR UPDATE ON public.system_monitoring
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_system_health_score();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE public.software_licenses IS 'Software license inventory and management';
COMMENT ON TABLE public.software_license_assignments IS 'User assignments for software licenses';
COMMENT ON TABLE public.system_monitoring IS 'IT infrastructure system monitoring and health';
COMMENT ON TABLE public.system_incidents IS 'System incidents and outages tracking';
COMMENT ON TABLE public.it_asset_maintenance IS 'IT asset maintenance schedules and history';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'IT tables migration completed successfully!';
  RAISE NOTICE 'Created tables: software_licenses, software_license_assignments, system_monitoring, system_incidents, it_asset_maintenance';
  RAISE NOTICE 'Enhanced tables: projects, support_requests';
END $$;

