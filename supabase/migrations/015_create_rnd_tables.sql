-- ============================================
-- RESEARCH & DEVELOPMENT (R&D) TABLES
-- ============================================

-- R&D Projects Table (extends projects with R&D-specific fields)
CREATE TABLE IF NOT EXISTS public.rnd_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  project_number VARCHAR(50) UNIQUE NOT NULL,
  project_type VARCHAR(100) NOT NULL, -- basic_research, applied_research, product_development, process_improvement, technology_transfer
  research_phase VARCHAR(100) NOT NULL DEFAULT 'ideation', -- ideation, research, development, testing, commercialization
  research_objective TEXT NOT NULL,
  hypothesis TEXT,
  methodology TEXT,
  expected_outcomes TEXT,
  success_criteria TEXT,
  risk_level VARCHAR(50) DEFAULT 'medium', -- low, medium, high, critical
  innovation_potential VARCHAR(50) DEFAULT 'medium', -- low, medium, high, breakthrough
  commercialization_readiness INTEGER DEFAULT 0, -- 0-100 scale
  start_date DATE NOT NULL,
  target_completion_date DATE,
  actual_completion_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'planning', -- planning, active, on_hold, completed, cancelled
  budget_allocated DECIMAL(15,2) DEFAULT 0,
  budget_utilized DECIMAL(15,2) DEFAULT 0,
  team_lead_id UUID REFERENCES auth.users(id),
  team_lead_name VARCHAR(255),
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- R&D Experiments Table
CREATE TABLE IF NOT EXISTS public.rnd_experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_number VARCHAR(50) UNIQUE NOT NULL,
  rnd_project_id UUID REFERENCES public.rnd_projects(id) ON DELETE CASCADE,
  experiment_name VARCHAR(255) NOT NULL,
  experiment_type VARCHAR(100), -- lab_experiment, simulation, field_test, prototype_test, analysis
  hypothesis TEXT NOT NULL,
  objective TEXT NOT NULL,
  methodology TEXT,
  protocol TEXT,
  equipment_used TEXT[],
  materials_used TEXT[],
  conducted_by UUID REFERENCES auth.users(id),
  conducted_by_name VARCHAR(255),
  experiment_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'planned', -- planned, in_progress, completed, failed, cancelled
  results TEXT,
  findings TEXT,
  conclusions TEXT,
  success BOOLEAN,
  data_files TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- R&D Patents Table
CREATE TABLE IF NOT EXISTS public.rnd_patents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patent_number VARCHAR(50) UNIQUE NOT NULL,
  patent_title VARCHAR(255) NOT NULL,
  patent_type VARCHAR(100) NOT NULL, -- utility_patent, design_patent, plant_patent, provisional
  rnd_project_id UUID REFERENCES public.rnd_projects(id) ON DELETE SET NULL,
  technology_area VARCHAR(255),
  inventors TEXT[],
  filing_date DATE,
  priority_date DATE,
  publication_date DATE,
  grant_date DATE,
  expiry_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, filed, under_review, published, granted, rejected, expired, abandoned
  patent_office VARCHAR(100), -- USPTO, EPO, WIPO, etc.
  application_number VARCHAR(100),
  patent_number_official VARCHAR(100),
  maintenance_fees_due DATE,
  next_maintenance_date DATE,
  estimated_value DECIMAL(15,2),
  licensing_status VARCHAR(50), -- none, licensed_in, licensed_out, exclusive, non_exclusive
  related_patents TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- R&D Lab Bookings Table
CREATE TABLE IF NOT EXISTS public.rnd_lab_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number VARCHAR(50) UNIQUE NOT NULL,
  lab_space VARCHAR(255) NOT NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  equipment_name VARCHAR(255),
  rnd_project_id UUID REFERENCES public.rnd_projects(id) ON DELETE SET NULL,
  experiment_id UUID REFERENCES public.rnd_experiments(id) ON DELETE SET NULL,
  booked_by UUID REFERENCES auth.users(id),
  booked_by_name VARCHAR(255),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours DECIMAL(5,2),
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- scheduled, in_use, completed, cancelled, no_show
  purpose TEXT,
  special_requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- R&D Research Data Table
CREATE TABLE IF NOT EXISTS public.rnd_research_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data_number VARCHAR(50) UNIQUE NOT NULL,
  rnd_project_id UUID REFERENCES public.rnd_projects(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES public.rnd_experiments(id) ON DELETE SET NULL,
  data_name VARCHAR(255) NOT NULL,
  data_type VARCHAR(100), -- raw_data, processed_data, analysis_results, models, simulations, images, documents
  data_category VARCHAR(100),
  description TEXT,
  file_paths TEXT[],
  file_size_mb DECIMAL(10,2),
  data_format VARCHAR(50), -- csv, json, excel, pdf, image, video, etc.
  version VARCHAR(50) DEFAULT '1.0',
  collected_by UUID REFERENCES auth.users(id),
  collected_by_name VARCHAR(255),
  collection_date DATE NOT NULL,
  analysis_status VARCHAR(50) DEFAULT 'raw', -- raw, processing, analyzed, published
  confidentiality_level VARCHAR(50) DEFAULT 'internal', -- public, internal, confidential, restricted
  access_level VARCHAR(50) DEFAULT 'team', -- public, team, department, restricted
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- R&D Collaborations Table
CREATE TABLE IF NOT EXISTS public.rnd_collaborations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collaboration_number VARCHAR(50) UNIQUE NOT NULL,
  collaboration_name VARCHAR(255) NOT NULL,
  collaboration_type VARCHAR(100) NOT NULL, -- academic_partnership, industry_partnership, government_contract, joint_venture, consulting
  rnd_project_id UUID REFERENCES public.rnd_projects(id) ON DELETE SET NULL,
  partner_name VARCHAR(255) NOT NULL,
  partner_type VARCHAR(100), -- university, company, government_agency, research_institute, consultant
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, completed, on_hold, terminated
  collaboration_scope TEXT,
  deliverables TEXT[],
  budget_allocated DECIMAL(15,2) DEFAULT 0,
  budget_utilized DECIMAL(15,2) DEFAULT 0,
  intellectual_property_terms TEXT,
  publication_rights TEXT,
  lead_contact_id UUID REFERENCES auth.users(id),
  lead_contact_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- R&D Milestones Table
CREATE TABLE IF NOT EXISTS public.rnd_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_number VARCHAR(50) UNIQUE NOT NULL,
  rnd_project_id UUID REFERENCES public.rnd_projects(id) ON DELETE CASCADE,
  milestone_name VARCHAR(255) NOT NULL,
  milestone_type VARCHAR(100), -- technical_milestone, regulatory_milestone, commercial_milestone, research_milestone
  description TEXT,
  target_date DATE NOT NULL,
  actual_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, delayed, cancelled
  completion_percentage INTEGER DEFAULT 0,
  dependencies TEXT[],
  assigned_to UUID REFERENCES auth.users(id),
  assigned_to_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rnd_projects_project_id ON public.rnd_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_rnd_projects_status ON public.rnd_projects(status);
CREATE INDEX IF NOT EXISTS idx_rnd_projects_phase ON public.rnd_projects(research_phase);
CREATE INDEX IF NOT EXISTS idx_rnd_experiments_project ON public.rnd_experiments(rnd_project_id);
CREATE INDEX IF NOT EXISTS idx_rnd_experiments_status ON public.rnd_experiments(status);
CREATE INDEX IF NOT EXISTS idx_rnd_patents_project ON public.rnd_patents(rnd_project_id);
CREATE INDEX IF NOT EXISTS idx_rnd_patents_status ON public.rnd_patents(status);
CREATE INDEX IF NOT EXISTS idx_rnd_lab_bookings_date ON public.rnd_lab_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_rnd_lab_bookings_status ON public.rnd_lab_bookings(status);
CREATE INDEX IF NOT EXISTS idx_rnd_research_data_project ON public.rnd_research_data(rnd_project_id);
CREATE INDEX IF NOT EXISTS idx_rnd_collaborations_project ON public.rnd_collaborations(rnd_project_id);
CREATE INDEX IF NOT EXISTS idx_rnd_collaborations_status ON public.rnd_collaborations(status);
CREATE INDEX IF NOT EXISTS idx_rnd_milestones_project ON public.rnd_milestones(rnd_project_id);
CREATE INDEX IF NOT EXISTS idx_rnd_milestones_status ON public.rnd_milestones(status);

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_rnd_projects_updated_at ON public.rnd_projects;
CREATE TRIGGER update_rnd_projects_updated_at
  BEFORE UPDATE ON public.rnd_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rnd_experiments_updated_at ON public.rnd_experiments;
CREATE TRIGGER update_rnd_experiments_updated_at
  BEFORE UPDATE ON public.rnd_experiments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rnd_patents_updated_at ON public.rnd_patents;
CREATE TRIGGER update_rnd_patents_updated_at
  BEFORE UPDATE ON public.rnd_patents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rnd_lab_bookings_updated_at ON public.rnd_lab_bookings;
CREATE TRIGGER update_rnd_lab_bookings_updated_at
  BEFORE UPDATE ON public.rnd_lab_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rnd_research_data_updated_at ON public.rnd_research_data;
CREATE TRIGGER update_rnd_research_data_updated_at
  BEFORE UPDATE ON public.rnd_research_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rnd_collaborations_updated_at ON public.rnd_collaborations;
CREATE TRIGGER update_rnd_collaborations_updated_at
  BEFORE UPDATE ON public.rnd_collaborations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rnd_milestones_updated_at ON public.rnd_milestones;
CREATE TRIGGER update_rnd_milestones_updated_at
  BEFORE UPDATE ON public.rnd_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.rnd_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rnd_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rnd_patents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rnd_lab_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rnd_research_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rnd_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rnd_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "R&D managers can view all R&D projects" ON public.rnd_projects;
CREATE POLICY "R&D managers can view all R&D projects" ON public.rnd_projects
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('rnd_manager', 'dept_manager', 'super_admin')
    OR team_lead_id = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Research & Development'
    )
  );

DROP POLICY IF EXISTS "R&D managers can manage R&D projects" ON public.rnd_projects;
CREATE POLICY "R&D managers can manage R&D projects" ON public.rnd_projects
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('rnd_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Research & Development'
        AND role IN ('rnd_manager', 'dept_manager')
    )
  );

DROP POLICY IF EXISTS "R&D team can view experiments" ON public.rnd_experiments;
CREATE POLICY "R&D team can view experiments" ON public.rnd_experiments
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('rnd_manager', 'dept_manager', 'super_admin')
    OR conducted_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Research & Development'
    )
  );

DROP POLICY IF EXISTS "R&D team can manage experiments" ON public.rnd_experiments;
CREATE POLICY "R&D team can manage experiments" ON public.rnd_experiments
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('rnd_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Research & Development'
    )
  );

DROP POLICY IF EXISTS "R&D team can view patents" ON public.rnd_patents;
CREATE POLICY "R&D team can view patents" ON public.rnd_patents
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('rnd_manager', 'dept_manager', 'super_admin')
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Research & Development'
    )
  );

DROP POLICY IF EXISTS "R&D managers can manage patents" ON public.rnd_patents;
CREATE POLICY "R&D managers can manage patents" ON public.rnd_patents
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('rnd_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Research & Development'
        AND role IN ('rnd_manager', 'dept_manager')
    )
  );

DROP POLICY IF EXISTS "R&D team can view lab bookings" ON public.rnd_lab_bookings;
CREATE POLICY "R&D team can view lab bookings" ON public.rnd_lab_bookings
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('rnd_manager', 'dept_manager', 'super_admin')
    OR booked_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Research & Development'
    )
  );

DROP POLICY IF EXISTS "R&D team can manage lab bookings" ON public.rnd_lab_bookings;
CREATE POLICY "R&D team can manage lab bookings" ON public.rnd_lab_bookings
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('rnd_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Research & Development'
    )
  );

DROP POLICY IF EXISTS "R&D team can view research data" ON public.rnd_research_data;
CREATE POLICY "R&D team can view research data" ON public.rnd_research_data
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('rnd_manager', 'dept_manager', 'super_admin')
    OR collected_by = auth.uid()
    OR access_level IN ('public', 'team', 'department')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Research & Development'
        AND access_level IN ('team', 'department')
    )
  );

DROP POLICY IF EXISTS "R&D team can manage research data" ON public.rnd_research_data;
CREATE POLICY "R&D team can manage research data" ON public.rnd_research_data
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('rnd_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Research & Development'
    )
  );

DROP POLICY IF EXISTS "R&D team can view collaborations" ON public.rnd_collaborations;
CREATE POLICY "R&D team can view collaborations" ON public.rnd_collaborations
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('rnd_manager', 'dept_manager', 'super_admin')
    OR lead_contact_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Research & Development'
    )
  );

DROP POLICY IF EXISTS "R&D managers can manage collaborations" ON public.rnd_collaborations;
CREATE POLICY "R&D managers can manage collaborations" ON public.rnd_collaborations
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('rnd_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Research & Development'
        AND role IN ('rnd_manager', 'dept_manager')
    )
  );

DROP POLICY IF EXISTS "R&D team can view milestones" ON public.rnd_milestones;
CREATE POLICY "R&D team can view milestones" ON public.rnd_milestones
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('rnd_manager', 'dept_manager', 'super_admin')
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Research & Development'
    )
  );

DROP POLICY IF EXISTS "R&D team can manage milestones" ON public.rnd_milestones;
CREATE POLICY "R&D team can manage milestones" ON public.rnd_milestones
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('rnd_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Research & Development'
    )
  );

