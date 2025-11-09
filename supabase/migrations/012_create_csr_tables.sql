-- ============================================
-- CSR / SUSTAINABILITY TABLES
-- ============================================

-- CSR Projects Table
CREATE TABLE IF NOT EXISTS public.csr_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_number VARCHAR(50) UNIQUE NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  project_type VARCHAR(100) NOT NULL, -- community_engagement, environmental, education, health, disaster_relief
  description TEXT NOT NULL,
  location VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'planning', -- planning, active, completed, on_hold
  budget_amount DECIMAL(12, 2),
  spent_amount DECIMAL(12, 2) DEFAULT 0,
  beneficiaries_count INTEGER DEFAULT 0,
  impact_description TEXT,
  partner_organizations TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(255),
  department VARCHAR(100) DEFAULT 'CSR / Sustainability',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Volunteer Activities Table
CREATE TABLE IF NOT EXISTS public.volunteer_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_number VARCHAR(50) UNIQUE NOT NULL,
  activity_name VARCHAR(255) NOT NULL,
  activity_type VARCHAR(100) NOT NULL, -- community_service, environmental_cleanup, mentoring, fundraising
  description TEXT NOT NULL,
  location VARCHAR(255),
  activity_date DATE NOT NULL,
  duration_hours DECIMAL(5, 2) NOT NULL,
  total_volunteers INTEGER DEFAULT 0,
  total_hours DECIMAL(8, 2) DEFAULT 0,
  csr_project_id UUID REFERENCES public.csr_projects(id),
  organizer_id UUID REFERENCES auth.users(id),
  organizer_name VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled
  impact_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Volunteer Participation Table
CREATE TABLE IF NOT EXISTS public.volunteer_participation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES public.volunteer_activities(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES auth.users(id),
  employee_name VARCHAR(255),
  department VARCHAR(100),
  hours_contributed DECIMAL(5, 2) NOT NULL,
  participation_date DATE NOT NULL,
  role VARCHAR(100), -- volunteer, organizer, coordinator
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sustainability Metrics Table (CSR-specific, separate from HSE)
CREATE TABLE IF NOT EXISTS public.csr_sustainability_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_number VARCHAR(50) UNIQUE NOT NULL,
  metric_type VARCHAR(100) NOT NULL, -- carbon_footprint, energy, waste, water, renewable_energy
  category VARCHAR(100) NOT NULL,
  measurement_date DATE NOT NULL,
  value DECIMAL(12, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  baseline_value DECIMAL(12, 2),
  target_value DECIMAL(12, 2),
  location VARCHAR(255),
  department VARCHAR(100),
  recorded_by UUID REFERENCES auth.users(id),
  recorded_by_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Impact Table
CREATE TABLE IF NOT EXISTS public.community_impact (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  impact_number VARCHAR(50) UNIQUE NOT NULL,
  impact_type VARCHAR(100) NOT NULL, -- people_reached, funds_donated, jobs_created, training_provided
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit VARCHAR(50) NOT NULL, -- people, dollars, jobs, hours
  location VARCHAR(255),
  beneficiary_group VARCHAR(255), -- youth, elderly, underserved_communities, environment
  csr_project_id UUID REFERENCES public.csr_projects(id),
  impact_date DATE NOT NULL,
  recorded_by UUID REFERENCES auth.users(id),
  recorded_by_name VARCHAR(255),
  verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ESG Reporting Table
CREATE TABLE IF NOT EXISTS public.esg_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number VARCHAR(50) UNIQUE NOT NULL,
  report_type VARCHAR(100) NOT NULL, -- annual, quarterly, environmental, social, governance
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, in_review, published
  environmental_score DECIMAL(5, 2),
  social_score DECIMAL(5, 2),
  governance_score DECIMAL(5, 2),
  overall_score DECIMAL(5, 2),
  prepared_by UUID REFERENCES auth.users(id),
  prepared_by_name VARCHAR(255),
  approved_by UUID REFERENCES auth.users(id),
  approved_by_name VARCHAR(255),
  approval_date DATE,
  report_file_url TEXT,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_csr_projects_status ON public.csr_projects(status);
CREATE INDEX IF NOT EXISTS idx_csr_projects_type ON public.csr_projects(project_type);
CREATE INDEX IF NOT EXISTS idx_volunteer_activities_date ON public.volunteer_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_volunteer_participation_employee ON public.volunteer_participation(employee_id);
CREATE INDEX IF NOT EXISTS idx_csr_sustainability_metrics_date ON public.csr_sustainability_metrics(measurement_date);
CREATE INDEX IF NOT EXISTS idx_community_impact_project ON public.community_impact(csr_project_id);
CREATE INDEX IF NOT EXISTS idx_esg_reports_period ON public.esg_reports(reporting_period_start, reporting_period_end);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_csr_projects_updated_at ON public.csr_projects;
CREATE TRIGGER update_csr_projects_updated_at
  BEFORE UPDATE ON public.csr_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_volunteer_activities_updated_at ON public.volunteer_activities;
CREATE TRIGGER update_volunteer_activities_updated_at
  BEFORE UPDATE ON public.volunteer_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_csr_sustainability_metrics_updated_at ON public.csr_sustainability_metrics;
CREATE TRIGGER update_csr_sustainability_metrics_updated_at
  BEFORE UPDATE ON public.csr_sustainability_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_impact_updated_at ON public.community_impact;
CREATE TRIGGER update_community_impact_updated_at
  BEFORE UPDATE ON public.community_impact
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_esg_reports_updated_at ON public.esg_reports;
CREATE TRIGGER update_esg_reports_updated_at
  BEFORE UPDATE ON public.esg_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.csr_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csr_sustainability_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_impact ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esg_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies - CSR Manager and department can view all, others view their own
DROP POLICY IF EXISTS "CSR managers can view all projects" ON public.csr_projects;
CREATE POLICY "CSR managers can view all projects" ON public.csr_projects
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('csr_manager', 'dept_manager', 'super_admin')
    OR department = 'CSR / Sustainability'
  );

DROP POLICY IF EXISTS "CSR managers can manage all projects" ON public.csr_projects;
CREATE POLICY "CSR managers can manage all projects" ON public.csr_projects
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('csr_manager', 'dept_manager', 'super_admin')
    OR department = 'CSR / Sustainability'
  );

DROP POLICY IF EXISTS "Employees can view volunteer activities" ON public.volunteer_activities;
CREATE POLICY "Employees can view volunteer activities" ON public.volunteer_activities
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "CSR managers can manage volunteer activities" ON public.volunteer_activities;
CREATE POLICY "CSR managers can manage volunteer activities" ON public.volunteer_activities
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('csr_manager', 'dept_manager', 'super_admin')
    OR organizer_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can view their own participation" ON public.volunteer_participation;
CREATE POLICY "Users can view their own participation" ON public.volunteer_participation
  FOR SELECT
  USING (
    employee_id = auth.uid()
    OR auth.jwt() ->> 'role' IN ('csr_manager', 'dept_manager', 'super_admin')
  );

DROP POLICY IF EXISTS "Users can create their own participation" ON public.volunteer_participation;
CREATE POLICY "Users can create their own participation" ON public.volunteer_participation
  FOR INSERT
  WITH CHECK (employee_id = auth.uid());

DROP POLICY IF EXISTS "CSR managers can view all sustainability metrics" ON public.csr_sustainability_metrics;
CREATE POLICY "CSR managers can view all sustainability metrics" ON public.csr_sustainability_metrics
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('csr_manager', 'dept_manager', 'super_admin')
    OR department = 'CSR / Sustainability'
    OR recorded_by = auth.uid()
  );

DROP POLICY IF EXISTS "CSR managers can manage sustainability metrics" ON public.csr_sustainability_metrics;
CREATE POLICY "CSR managers can manage sustainability metrics" ON public.csr_sustainability_metrics
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('csr_manager', 'dept_manager', 'super_admin')
    OR recorded_by = auth.uid()
  );

DROP POLICY IF EXISTS "CSR managers can view all community impact" ON public.community_impact;
CREATE POLICY "CSR managers can view all community impact" ON public.community_impact
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('csr_manager', 'dept_manager', 'super_admin')
    OR recorded_by = auth.uid()
  );

DROP POLICY IF EXISTS "CSR managers can manage community impact" ON public.community_impact;
CREATE POLICY "CSR managers can manage community impact" ON public.community_impact
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('csr_manager', 'dept_manager', 'super_admin')
    OR recorded_by = auth.uid()
  );

DROP POLICY IF EXISTS "CSR managers can view all ESG reports" ON public.esg_reports;
CREATE POLICY "CSR managers can view all ESG reports" ON public.esg_reports
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('csr_manager', 'dept_manager', 'super_admin', 'executive')
  );

DROP POLICY IF EXISTS "CSR managers can manage ESG reports" ON public.esg_reports;
CREATE POLICY "CSR managers can manage ESG reports" ON public.esg_reports
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('csr_manager', 'dept_manager', 'super_admin')
  );

