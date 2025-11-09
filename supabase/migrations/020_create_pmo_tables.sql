-- ============================================
-- PROJECT MANAGEMENT OFFICE (PMO) TABLES
-- ============================================

-- Enhanced Projects Table (extends base projects table)
CREATE TABLE IF NOT EXISTS public.pmo_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  project_number VARCHAR(50) UNIQUE NOT NULL,
  project_type VARCHAR(100) NOT NULL, -- it_project, operations, strategic, compliance, infrastructure, rnd, marketing
  priority VARCHAR(50) NOT NULL DEFAULT 'medium', -- critical, high, medium, low
  health_indicator VARCHAR(50) DEFAULT 'green', -- green, yellow, red
  complexity VARCHAR(50) DEFAULT 'medium', -- low, medium, high, very_high
  strategic_alignment TEXT[], -- array of strategic goals this project supports
  start_date DATE NOT NULL,
  planned_end_date DATE,
  actual_end_date DATE,
  planned_duration_days INTEGER,
  actual_duration_days INTEGER,
  timeline_variance_days INTEGER DEFAULT 0,
  budget_allocated DECIMAL(15,2) DEFAULT 0,
  budget_spent DECIMAL(15,2) DEFAULT 0,
  budget_remaining DECIMAL(15,2) DEFAULT 0,
  budget_variance DECIMAL(15,2) DEFAULT 0,
  forecasted_cost DECIMAL(15,2),
  project_manager_id UUID REFERENCES auth.users(id),
  project_manager_name VARCHAR(255),
  sponsor_id UUID REFERENCES auth.users(id),
  sponsor_name VARCHAR(255),
  business_case TEXT,
  success_criteria TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Milestones Table
CREATE TABLE IF NOT EXISTS public.pmo_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_number VARCHAR(50) UNIQUE NOT NULL,
  pmo_project_id UUID REFERENCES public.pmo_projects(id) ON DELETE CASCADE,
  milestone_name VARCHAR(255) NOT NULL,
  milestone_type VARCHAR(100), -- phase_gate, deliverable, approval, go_live, review
  description TEXT,
  planned_date DATE NOT NULL,
  actual_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, delayed, cancelled
  completion_percentage INTEGER DEFAULT 0,
  dependencies TEXT[], -- array of milestone IDs this depends on
  assigned_to UUID REFERENCES auth.users(id),
  assigned_to_name VARCHAR(255),
  is_critical BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Resources Table (team members assigned to projects)
CREATE TABLE IF NOT EXISTS public.pmo_project_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pmo_project_id UUID REFERENCES public.pmo_projects(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name VARCHAR(255) NOT NULL,
  role_in_project VARCHAR(100) NOT NULL, -- project_manager, team_member, consultant, stakeholder, sponsor
  allocation_percentage INTEGER DEFAULT 100 CHECK (allocation_percentage >= 0 AND allocation_percentage <= 100),
  planned_hours DECIMAL(10,2) DEFAULT 0,
  actual_hours DECIMAL(10,2) DEFAULT 0,
  hourly_rate DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, removed
  skills_required TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pmo_project_id, employee_id)
);

-- Project Risks Table
CREATE TABLE IF NOT EXISTS public.pmo_project_risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_number VARCHAR(50) UNIQUE NOT NULL,
  pmo_project_id UUID REFERENCES public.pmo_projects(id) ON DELETE CASCADE,
  risk_title VARCHAR(255) NOT NULL,
  risk_description TEXT NOT NULL,
  risk_category VARCHAR(100), -- technical, financial, schedule, resource, external, quality
  probability VARCHAR(50) DEFAULT 'medium', -- low, medium, high
  impact VARCHAR(50) DEFAULT 'medium', -- low, medium, high, critical
  risk_level VARCHAR(50) GENERATED ALWAYS AS (
    CASE 
      WHEN (probability = 'high' AND impact IN ('high', 'critical')) OR 
           (probability = 'medium' AND impact = 'critical') THEN 'critical'
      WHEN (probability = 'high' AND impact = 'medium') OR 
           (probability = 'medium' AND impact = 'high') OR
           (probability = 'low' AND impact = 'critical') THEN 'high'
      WHEN (probability = 'medium' AND impact = 'medium') OR
           (probability = 'low' AND impact = 'high') THEN 'medium'
      ELSE 'low'
    END
  ) STORED,
  status VARCHAR(50) DEFAULT 'open', -- open, mitigated, closed, escalated
  mitigation_strategy TEXT,
  mitigation_owner_id UUID REFERENCES auth.users(id),
  mitigation_owner_name VARCHAR(255),
  mitigation_due_date DATE,
  residual_risk_level VARCHAR(50),
  identified_by UUID REFERENCES auth.users(id),
  identified_by_name VARCHAR(255),
  identified_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Issues Table
CREATE TABLE IF NOT EXISTS public.pmo_project_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_number VARCHAR(50) UNIQUE NOT NULL,
  pmo_project_id UUID REFERENCES public.pmo_projects(id) ON DELETE CASCADE,
  issue_title VARCHAR(255) NOT NULL,
  issue_description TEXT NOT NULL,
  issue_category VARCHAR(100), -- blocker, delay, quality, resource, technical, scope
  priority VARCHAR(50) DEFAULT 'medium', -- critical, high, medium, low
  status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved, closed, escalated
  impact_description TEXT,
  resolution_plan TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_to_name VARCHAR(255),
  due_date DATE,
  resolved_date DATE,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_by_name VARCHAR(255),
  reported_by UUID REFERENCES auth.users(id),
  reported_by_name VARCHAR(255),
  reported_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Stakeholders Table
CREATE TABLE IF NOT EXISTS public.pmo_project_stakeholders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pmo_project_id UUID REFERENCES public.pmo_projects(id) ON DELETE CASCADE,
  stakeholder_id UUID REFERENCES auth.users(id),
  stakeholder_name VARCHAR(255) NOT NULL,
  stakeholder_email VARCHAR(255),
  stakeholder_role VARCHAR(100), -- sponsor, executive, end_user, team_member, vendor, customer
  interest_level VARCHAR(50) DEFAULT 'medium', -- high, medium, low
  influence_level VARCHAR(50) DEFAULT 'medium', -- high, medium, low
  engagement_strategy TEXT,
  communication_frequency VARCHAR(50), -- daily, weekly, bi_weekly, monthly, as_needed
  communication_preference VARCHAR(50), -- email, meeting, dashboard, report
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  last_contact_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pmo_project_id, stakeholder_id)
);

-- Project Status Reports Table
CREATE TABLE IF NOT EXISTS public.pmo_status_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number VARCHAR(50) UNIQUE NOT NULL,
  pmo_project_id UUID REFERENCES public.pmo_projects(id) ON DELETE CASCADE,
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  report_type VARCHAR(50) DEFAULT 'weekly', -- weekly, monthly, milestone, ad_hoc
  status_summary TEXT NOT NULL,
  accomplishments TEXT[],
  challenges TEXT[],
  next_steps TEXT[],
  budget_status TEXT,
  timeline_status TEXT,
  risk_summary TEXT,
  issue_summary TEXT,
  overall_health VARCHAR(50), -- green, yellow, red
  reported_by UUID REFERENCES auth.users(id),
  reported_by_name VARCHAR(255),
  report_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Templates Table (for standardizing project setup)
CREATE TABLE IF NOT EXISTS public.pmo_project_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name VARCHAR(255) NOT NULL UNIQUE,
  template_type VARCHAR(100) NOT NULL, -- it_project, operations, strategic, compliance
  description TEXT,
  default_milestones JSONB DEFAULT '[]', -- array of milestone definitions
  default_phases JSONB DEFAULT '[]', -- array of phase definitions
  default_roles JSONB DEFAULT '[]', -- array of required roles
  default_budget_categories JSONB DEFAULT '[]', -- array of budget categories
  checklist_items JSONB DEFAULT '[]', -- array of checklist items
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pmo_projects_project_id ON public.pmo_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_pmo_projects_type ON public.pmo_projects(project_type);
CREATE INDEX IF NOT EXISTS idx_pmo_projects_priority ON public.pmo_projects(priority);
CREATE INDEX IF NOT EXISTS idx_pmo_projects_health ON public.pmo_projects(health_indicator);
CREATE INDEX IF NOT EXISTS idx_pmo_projects_manager ON public.pmo_projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_pmo_milestones_project ON public.pmo_milestones(pmo_project_id);
CREATE INDEX IF NOT EXISTS idx_pmo_milestones_status ON public.pmo_milestones(status);
CREATE INDEX IF NOT EXISTS idx_pmo_milestones_date ON public.pmo_milestones(planned_date);
CREATE INDEX IF NOT EXISTS idx_pmo_resources_project ON public.pmo_project_resources(pmo_project_id);
CREATE INDEX IF NOT EXISTS idx_pmo_resources_employee ON public.pmo_project_resources(employee_id);
CREATE INDEX IF NOT EXISTS idx_pmo_risks_project ON public.pmo_project_risks(pmo_project_id);
CREATE INDEX IF NOT EXISTS idx_pmo_risks_status ON public.pmo_project_risks(status);
CREATE INDEX IF NOT EXISTS idx_pmo_risks_level ON public.pmo_project_risks(risk_level);
CREATE INDEX IF NOT EXISTS idx_pmo_issues_project ON public.pmo_project_issues(pmo_project_id);
CREATE INDEX IF NOT EXISTS idx_pmo_issues_status ON public.pmo_project_issues(status);
CREATE INDEX IF NOT EXISTS idx_pmo_issues_priority ON public.pmo_project_issues(priority);
CREATE INDEX IF NOT EXISTS idx_pmo_stakeholders_project ON public.pmo_project_stakeholders(pmo_project_id);
CREATE INDEX IF NOT EXISTS idx_pmo_status_reports_project ON public.pmo_status_reports(pmo_project_id);
CREATE INDEX IF NOT EXISTS idx_pmo_status_reports_date ON public.pmo_status_reports(report_date);

-- Add RLS policies
ALTER TABLE public.pmo_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmo_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmo_project_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmo_project_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmo_project_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmo_project_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmo_status_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pmo_project_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for PMO Projects
CREATE POLICY "PMO projects viewable by PMO and managers"
  ON public.pmo_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Project Management'
        OR up.role IN ('super_admin', 'dept_manager', 'project_manager')
        OR EXISTS (
          SELECT 1 FROM public.pmo_project_resources pr
          WHERE pr.pmo_project_id = pmo_projects.id
          AND pr.employee_id IN (
            SELECT id FROM public.employees WHERE user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "PMO projects creatable by PMO and managers"
  ON public.pmo_projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Project Management'
        OR up.role IN ('super_admin', 'dept_manager', 'project_manager')
        OR up.permissions && ARRAY['manage_projects']
      )
    )
  );

CREATE POLICY "PMO projects updatable by PMO and managers"
  ON public.pmo_projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Project Management'
        OR up.role IN ('super_admin', 'dept_manager', 'project_manager')
        OR up.permissions && ARRAY['manage_projects']
        OR project_manager_id = auth.uid()
      )
    )
  );

-- Similar policies for other PMO tables (simplified for brevity)
CREATE POLICY "PMO milestones viewable by project team"
  ON public.pmo_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pmo_projects pp
      WHERE pp.id = pmo_milestones.pmo_project_id
    )
  );

CREATE POLICY "PMO resources viewable by project team"
  ON public.pmo_project_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pmo_projects pp
      WHERE pp.id = pmo_project_resources.pmo_project_id
    )
  );

CREATE POLICY "PMO risks viewable by project team"
  ON public.pmo_project_risks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pmo_projects pp
      WHERE pp.id = pmo_project_risks.pmo_project_id
    )
  );

CREATE POLICY "PMO issues viewable by project team"
  ON public.pmo_project_issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pmo_projects pp
      WHERE pp.id = pmo_project_issues.pmo_project_id
    )
  );

CREATE POLICY "PMO stakeholders viewable by project team"
  ON public.pmo_project_stakeholders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pmo_projects pp
      WHERE pp.id = pmo_project_stakeholders.pmo_project_id
    )
  );

CREATE POLICY "PMO status reports viewable by project team"
  ON public.pmo_status_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pmo_projects pp
      WHERE pp.id = pmo_status_reports.pmo_project_id
    )
  );

CREATE POLICY "PMO templates viewable by all authenticated users"
  ON public.pmo_project_templates FOR SELECT
  USING (auth.role() = 'authenticated');

