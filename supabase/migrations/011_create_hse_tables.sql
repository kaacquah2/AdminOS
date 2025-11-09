-- ============================================
-- HSE (Health, Safety & Environment) Tables
-- ============================================
-- This migration creates tables for comprehensive HSE management

-- Safety incidents table
CREATE TABLE IF NOT EXISTS public.safety_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_number TEXT UNIQUE NOT NULL,
  incident_type TEXT NOT NULL, -- injury, near_miss, property_damage, environmental, first_aid
  severity TEXT NOT NULL, -- minor, moderate, serious, critical, fatal
  status TEXT NOT NULL DEFAULT 'reported', -- reported, investigating, resolved, closed
  location TEXT NOT NULL,
  department TEXT NOT NULL,
  reported_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reported_by_name TEXT NOT NULL,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  incident_date TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  immediate_cause TEXT,
  root_cause TEXT,
  corrective_actions TEXT[] DEFAULT '{}',
  investigation_notes TEXT,
  investigation_completed_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety inspections table
CREATE TABLE IF NOT EXISTS public.safety_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_number TEXT UNIQUE NOT NULL,
  inspection_type TEXT NOT NULL, -- routine, scheduled, unscheduled, follow_up, audit
  location TEXT NOT NULL,
  department TEXT NOT NULL,
  inspector_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  inspector_name TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, in_progress, completed, overdue, cancelled
  findings TEXT[] DEFAULT '{}',
  non_conformances INTEGER DEFAULT 0,
  corrective_actions_required INTEGER DEFAULT 0,
  notes TEXT,
  next_inspection_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety training records table
CREATE TABLE IF NOT EXISTS public.safety_training_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  training_type TEXT NOT NULL, -- general_safety, hazard_awareness, first_aid, fire_safety, equipment_specific, environmental
  training_name TEXT NOT NULL,
  provider TEXT,
  completed_date DATE,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, in_progress, completed, expired, cancelled
  certification_number TEXT,
  score DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Environmental metrics table
CREATE TABLE IF NOT EXISTS public.environmental_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_type TEXT NOT NULL, -- waste, emissions, water, energy, recycling
  category TEXT NOT NULL, -- hazardous_waste, non_hazardous_waste, co2_emissions, water_consumption, energy_consumption
  measurement_date DATE NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL, -- kg, tons, m3, kWh, etc.
  location TEXT,
  department TEXT,
  recorded_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  recorded_by_name TEXT NOT NULL,
  notes TEXT,
  compliance_status TEXT DEFAULT 'compliant', -- compliant, non_compliant, at_risk
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Corrective actions table
CREATE TABLE IF NOT EXISTS public.corrective_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_number TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL, -- incident, inspection, audit, observation
  source_id UUID NOT NULL, -- reference to incident/inspection/etc
  description TEXT NOT NULL,
  assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  assigned_to_name TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  due_date DATE NOT NULL,
  completed_date DATE,
  status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, completed, overdue, cancelled
  completion_notes TEXT,
  verified_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety observations table
CREATE TABLE IF NOT EXISTS public.safety_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  observation_number TEXT UNIQUE NOT NULL,
  observation_type TEXT NOT NULL, -- safe_behavior, unsafe_condition, unsafe_act, positive
  location TEXT NOT NULL,
  department TEXT NOT NULL,
  observed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  observed_by_name TEXT NOT NULL,
  observation_date TIMESTAMPTZ DEFAULT NOW(),
  description TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'low', -- low, medium, high, critical
  immediate_action_taken TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open, action_required, resolved, closed
  action_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_safety_incidents_type ON public.safety_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_status ON public.safety_incidents(status);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_date ON public.safety_incidents(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_safety_inspections_status ON public.safety_inspections(status);
CREATE INDEX IF NOT EXISTS idx_safety_inspections_scheduled ON public.safety_inspections(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_safety_training_expiry ON public.safety_training_records(expiry_date);
CREATE INDEX IF NOT EXISTS idx_safety_training_status ON public.safety_training_records(status);
CREATE INDEX IF NOT EXISTS idx_environmental_metrics_date ON public.environmental_metrics(measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_status ON public.corrective_actions(status);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_due ON public.corrective_actions(due_date);
CREATE INDEX IF NOT EXISTS idx_safety_observations_type ON public.safety_observations(observation_type);
CREATE INDEX IF NOT EXISTS idx_safety_observations_status ON public.safety_observations(status);

-- Enable RLS
ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_observations ENABLE ROW LEVEL SECURITY;

-- RLS Policies - HSE Manager and department can view all, others view their own
DROP POLICY IF EXISTS "HSE team can view all incidents" ON public.safety_incidents;
CREATE POLICY "HSE team can view all incidents" ON public.safety_incidents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND (role IN ('hse_manager', 'dept_manager', 'super_admin') OR department = 'Health, Safety & Environment')
    ) OR reported_by = auth.uid()
  );

DROP POLICY IF EXISTS "HSE team can manage incidents" ON public.safety_incidents;
CREATE POLICY "HSE team can manage incidents" ON public.safety_incidents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND (role IN ('hse_manager', 'dept_manager', 'super_admin') OR department = 'Health, Safety & Environment')
    )
  );

-- Similar policies for other tables
DROP POLICY IF EXISTS "HSE team can view all inspections" ON public.safety_inspections;
CREATE POLICY "HSE team can view all inspections" ON public.safety_inspections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND (role IN ('hse_manager', 'dept_manager', 'super_admin') OR department = 'Health, Safety & Environment')
    ) OR inspector_id = auth.uid()
  );

DROP POLICY IF EXISTS "HSE team can manage inspections" ON public.safety_inspections;
CREATE POLICY "HSE team can manage inspections" ON public.safety_inspections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND (role IN ('hse_manager', 'dept_manager', 'super_admin') OR department = 'Health, Safety & Environment')
    )
  );

DROP POLICY IF EXISTS "Users can view own training" ON public.safety_training_records;
CREATE POLICY "Users can view own training" ON public.safety_training_records
  FOR SELECT
  USING (
    employee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND (role IN ('hse_manager', 'dept_manager', 'super_admin', 'hr_head') OR department = 'Health, Safety & Environment')
    )
  );

DROP POLICY IF EXISTS "HSE team can manage training" ON public.safety_training_records;
CREATE POLICY "HSE team can manage training" ON public.safety_training_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND (role IN ('hse_manager', 'dept_manager', 'super_admin', 'hr_head') OR department = 'Health, Safety & Environment')
    )
  );

DROP POLICY IF EXISTS "HSE team can view environmental metrics" ON public.environmental_metrics;
CREATE POLICY "HSE team can view environmental metrics" ON public.environmental_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND (role IN ('hse_manager', 'dept_manager', 'super_admin') OR department = 'Health, Safety & Environment')
    )
  );

DROP POLICY IF EXISTS "HSE team can manage environmental metrics" ON public.environmental_metrics;
CREATE POLICY "HSE team can manage environmental metrics" ON public.environmental_metrics
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND (role IN ('hse_manager', 'dept_manager', 'super_admin') OR department = 'Health, Safety & Environment')
    )
  );

DROP POLICY IF EXISTS "Users can view relevant corrective actions" ON public.corrective_actions;
CREATE POLICY "Users can view relevant corrective actions" ON public.corrective_actions
  FOR SELECT
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND (role IN ('hse_manager', 'dept_manager', 'super_admin') OR department = 'Health, Safety & Environment')
    )
  );

DROP POLICY IF EXISTS "HSE team can manage corrective actions" ON public.corrective_actions;
CREATE POLICY "HSE team can manage corrective actions" ON public.corrective_actions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND (role IN ('hse_manager', 'dept_manager', 'super_admin') OR department = 'Health, Safety & Environment')
    ) OR assigned_to = auth.uid()
  );

DROP POLICY IF EXISTS "HSE team can view observations" ON public.safety_observations;
CREATE POLICY "HSE team can view observations" ON public.safety_observations
  FOR SELECT
  USING (
    observed_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND (role IN ('hse_manager', 'dept_manager', 'super_admin') OR department = 'Health, Safety & Environment')
    )
  );

DROP POLICY IF EXISTS "Users can create observations" ON public.safety_observations;
CREATE POLICY "Users can create observations" ON public.safety_observations
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "HSE team can manage observations" ON public.safety_observations;
CREATE POLICY "HSE team can manage observations" ON public.safety_observations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND (role IN ('hse_manager', 'dept_manager', 'super_admin') OR department = 'Health, Safety & Environment')
    ) OR observed_by = auth.uid()
  );

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_hse_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_safety_incidents_updated_at ON public.safety_incidents;
CREATE TRIGGER update_safety_incidents_updated_at
  BEFORE UPDATE ON public.safety_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_hse_updated_at();

DROP TRIGGER IF EXISTS update_safety_inspections_updated_at ON public.safety_inspections;
CREATE TRIGGER update_safety_inspections_updated_at
  BEFORE UPDATE ON public.safety_inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_hse_updated_at();

DROP TRIGGER IF EXISTS update_safety_training_updated_at ON public.safety_training_records;
CREATE TRIGGER update_safety_training_updated_at
  BEFORE UPDATE ON public.safety_training_records
  FOR EACH ROW
  EXECUTE FUNCTION update_hse_updated_at();

DROP TRIGGER IF EXISTS update_environmental_metrics_updated_at ON public.environmental_metrics;
CREATE TRIGGER update_environmental_metrics_updated_at
  BEFORE UPDATE ON public.environmental_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_hse_updated_at();

DROP TRIGGER IF EXISTS update_corrective_actions_updated_at ON public.corrective_actions;
CREATE TRIGGER update_corrective_actions_updated_at
  BEFORE UPDATE ON public.corrective_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_hse_updated_at();

DROP TRIGGER IF EXISTS update_safety_observations_updated_at ON public.safety_observations;
CREATE TRIGGER update_safety_observations_updated_at
  BEFORE UPDATE ON public.safety_observations
  FOR EACH ROW
  EXECUTE FUNCTION update_hse_updated_at();

-- Function to calculate TRIR (Total Recordable Incident Rate)
-- TRIR = (Number of recordable injuries × 200,000) / Total hours worked
CREATE OR REPLACE FUNCTION calculate_trir(start_date DATE, end_date DATE)
RETURNS DECIMAL AS $$
DECLARE
  recordable_incidents INTEGER;
  total_hours DECIMAL;
  trir_value DECIMAL;
BEGIN
  -- Count recordable incidents (excluding first aid and near misses)
  SELECT COUNT(*) INTO recordable_incidents
  FROM public.safety_incidents
  WHERE incident_date BETWEEN start_date AND end_date
    AND incident_type IN ('injury', 'property_damage', 'environmental')
    AND severity IN ('moderate', 'serious', 'critical', 'fatal');
  
  -- Estimate total hours (assuming 40 hours/week per employee, adjust as needed)
  -- This should ideally come from actual timesheet data
  SELECT COUNT(*) * 40 * 52 INTO total_hours
  FROM public.user_profiles
  WHERE created_at <= end_date;
  
  IF total_hours = 0 THEN
    RETURN 0;
  END IF;
  
  trir_value := (recordable_incidents::DECIMAL * 200000) / total_hours;
  RETURN ROUND(trir_value, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate LTIFR (Lost Time Injury Frequency Rate)
CREATE OR REPLACE FUNCTION calculate_ltifr(start_date DATE, end_date DATE)
RETURNS DECIMAL AS $$
DECLARE
  lost_time_incidents INTEGER;
  total_hours DECIMAL;
  ltifr_value DECIMAL;
BEGIN
  -- Count lost time incidents (serious, critical, fatal injuries)
  SELECT COUNT(*) INTO lost_time_incidents
  FROM public.safety_incidents
  WHERE incident_date BETWEEN start_date AND end_date
    AND incident_type = 'injury'
    AND severity IN ('serious', 'critical', 'fatal');
  
  SELECT COUNT(*) * 40 * 52 INTO total_hours
  FROM public.user_profiles
  WHERE created_at <= end_date;
  
  IF total_hours = 0 THEN
    RETURN 0;
  END IF;
  
  ltifr_value := (lost_time_incidents::DECIMAL * 1000000) / total_hours;
  RETURN ROUND(ltifr_value, 2);
END;
$$ LANGUAGE plpgsql;

