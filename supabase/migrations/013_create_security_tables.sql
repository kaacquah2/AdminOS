-- ============================================
-- SECURITY & ACCESS CONTROL TABLES
-- ============================================

-- Access Logs Table
CREATE TABLE IF NOT EXISTS public.access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_name VARCHAR(255),
  action_type VARCHAR(100) NOT NULL, -- login, logout, permission_change, role_assignment, data_access, failed_login
  resource_type VARCHAR(100), -- module, data, file, system
  resource_id VARCHAR(255),
  resource_name VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(50) NOT NULL, -- success, failed, denied, blocked
  details TEXT,
  severity VARCHAR(50) DEFAULT 'low', -- low, medium, high, critical
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Incidents Table
CREATE TABLE IF NOT EXISTS public.security_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_number VARCHAR(50) UNIQUE NOT NULL,
  incident_type VARCHAR(100) NOT NULL, -- unauthorized_access, data_breach, malware, phishing, policy_violation, suspicious_activity
  severity VARCHAR(50) NOT NULL, -- low, medium, high, critical
  status VARCHAR(50) NOT NULL DEFAULT 'reported', -- reported, investigating, resolved, closed
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  affected_users INTEGER DEFAULT 0,
  affected_systems TEXT[],
  detected_by UUID REFERENCES auth.users(id),
  detected_by_name VARCHAR(255),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_to_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Access Requests Table
CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  requester_id UUID REFERENCES auth.users(id),
  requester_name VARCHAR(255),
  request_type VARCHAR(100) NOT NULL, -- role_change, permission_add, permission_remove, breakglass_access, data_access
  requested_resource VARCHAR(255),
  requested_permission VARCHAR(255),
  requested_role VARCHAR(100),
  justification TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, expired
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_by_name VARCHAR(255),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Access Reviews Table
CREATE TABLE IF NOT EXISTS public.access_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_number VARCHAR(50) UNIQUE NOT NULL,
  review_type VARCHAR(100) NOT NULL, -- user_access, role_permissions, department_access, system_access
  target_user_id UUID REFERENCES auth.users(id),
  target_user_name VARCHAR(255),
  target_role VARCHAR(100),
  target_department VARCHAR(100),
  reviewer_id UUID REFERENCES auth.users(id),
  reviewer_name VARCHAR(255),
  review_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, revoked, needs_review
  findings TEXT[],
  recommendations TEXT,
  next_review_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Alerts Table
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_number VARCHAR(50) UNIQUE NOT NULL,
  alert_type VARCHAR(100) NOT NULL, -- failed_login, suspicious_activity, policy_violation, system_anomaly, threat_detected
  severity VARCHAR(50) NOT NULL, -- low, medium, high, critical
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, acknowledged, resolved, false_positive
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  affected_user_id UUID REFERENCES auth.users(id),
  affected_user_name VARCHAR(255),
  source_ip VARCHAR(45),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_by_name VARCHAR(255),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permission Changes Audit Table
CREATE TABLE IF NOT EXISTS public.permission_changes_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  change_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_name VARCHAR(255),
  change_type VARCHAR(50) NOT NULL, -- permission_added, permission_removed, role_assigned, role_removed
  permission_key VARCHAR(255),
  role_name VARCHAR(100),
  changed_by UUID REFERENCES auth.users(id),
  changed_by_name VARCHAR(255),
  reason TEXT,
  change_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON public.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON public.access_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_access_logs_date ON public.access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON public.security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON public.security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_requester ON public.access_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_access_reviews_status ON public.access_reviews(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON public.security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_permission_changes_user ON public.permission_changes_audit(user_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_security_incidents_updated_at ON public.security_incidents;
CREATE TRIGGER update_security_incidents_updated_at
  BEFORE UPDATE ON public.security_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_access_requests_updated_at ON public.access_requests;
CREATE TRIGGER update_access_requests_updated_at
  BEFORE UPDATE ON public.access_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_access_reviews_updated_at ON public.access_reviews;
CREATE TRIGGER update_access_reviews_updated_at
  BEFORE UPDATE ON public.access_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_security_alerts_updated_at ON public.security_alerts;
CREATE TRIGGER update_security_alerts_updated_at
  BEFORE UPDATE ON public.security_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_changes_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Security managers and admins can view all, others view their own
DROP POLICY IF EXISTS "Security admins can view all access logs" ON public.access_logs;
CREATE POLICY "Security admins can view all access logs" ON public.access_logs
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('security_admin', 'security_manager', 'dept_manager', 'super_admin')
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Security admins can manage access logs" ON public.access_logs;
CREATE POLICY "Security admins can manage access logs" ON public.access_logs
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('security_admin', 'dept_manager', 'super_admin')
  );

DROP POLICY IF EXISTS "Security admins can view all security incidents" ON public.security_incidents;
CREATE POLICY "Security admins can view all security incidents" ON public.security_incidents
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('security_admin', 'security_manager', 'dept_manager', 'super_admin')
    OR detected_by = auth.uid()
  );

DROP POLICY IF EXISTS "Security admins can manage security incidents" ON public.security_incidents;
CREATE POLICY "Security admins can manage security incidents" ON public.security_incidents
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('security_admin', 'security_manager', 'dept_manager', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can view their own access requests" ON public.access_requests;
CREATE POLICY "Users can view their own access requests" ON public.access_requests
  FOR SELECT
  USING (
    requester_id = auth.uid()
    OR auth.jwt() ->> 'role' IN ('security_admin', 'security_manager', 'dept_manager', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can create access requests" ON public.access_requests;
CREATE POLICY "Users can create access requests" ON public.access_requests
  FOR INSERT
  WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "Security admins can manage access requests" ON public.access_requests;
CREATE POLICY "Security admins can manage access requests" ON public.access_requests
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' IN ('security_admin', 'security_manager', 'dept_manager', 'super_admin')
  );

DROP POLICY IF EXISTS "Security admins can view all access reviews" ON public.access_reviews;
CREATE POLICY "Security admins can view all access reviews" ON public.access_reviews
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('security_admin', 'security_manager', 'dept_manager', 'super_admin')
    OR target_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Security admins can manage access reviews" ON public.access_reviews;
CREATE POLICY "Security admins can manage access reviews" ON public.access_reviews
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('security_admin', 'security_manager', 'dept_manager', 'super_admin')
  );

DROP POLICY IF EXISTS "Security admins can view all security alerts" ON public.security_alerts;
CREATE POLICY "Security admins can view all security alerts" ON public.security_alerts
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('security_admin', 'security_manager', 'dept_manager', 'super_admin')
    OR affected_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Security admins can manage security alerts" ON public.security_alerts;
CREATE POLICY "Security admins can manage security alerts" ON public.security_alerts
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('security_admin', 'security_manager', 'dept_manager', 'super_admin')
  );

DROP POLICY IF EXISTS "Security admins can view all permission changes" ON public.permission_changes_audit;
CREATE POLICY "Security admins can view all permission changes" ON public.permission_changes_audit
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('security_admin', 'security_manager', 'dept_manager', 'super_admin')
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Security admins can create permission changes audit" ON public.permission_changes_audit;
CREATE POLICY "Security admins can create permission changes audit" ON public.permission_changes_audit
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('security_admin', 'security_manager', 'dept_manager', 'super_admin')
  );

