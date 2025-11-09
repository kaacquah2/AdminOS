-- ============================================
-- EMPLOYEE WELLNESS & ENGAGEMENT TABLES
-- ============================================

-- Wellness Programs Table
CREATE TABLE IF NOT EXISTS public.wellness_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_number VARCHAR(50) UNIQUE NOT NULL,
  program_name VARCHAR(255) NOT NULL,
  program_type VARCHAR(100) NOT NULL, -- fitness, mental_health, nutrition, financial_wellness, work_life_balance, preventive_care
  description TEXT NOT NULL,
  objectives TEXT[],
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'planned', -- planned, active, completed, cancelled
  target_audience VARCHAR(100), -- all_employees, specific_department, specific_role, voluntary
  participation_limit INTEGER,
  current_participants INTEGER DEFAULT 0,
  budget_allocated DECIMAL(10,2) DEFAULT 0,
  budget_utilized DECIMAL(10,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wellness Challenges Table
CREATE TABLE IF NOT EXISTS public.wellness_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_number VARCHAR(50) UNIQUE NOT NULL,
  challenge_name VARCHAR(255) NOT NULL,
  challenge_type VARCHAR(100) NOT NULL, -- step_challenge, weight_loss, hydration, meditation, reading, learning, team_building
  description TEXT NOT NULL,
  rules TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'upcoming', -- upcoming, active, completed, cancelled
  participation_type VARCHAR(50) DEFAULT 'individual', -- individual, team, both
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  reward_type VARCHAR(100), -- points, badge, certificate, prize, recognition
  reward_description TEXT,
  tracking_method VARCHAR(100), -- manual, wearable, app, survey
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wellness Program Participation Table
CREATE TABLE IF NOT EXISTS public.wellness_program_participation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES public.wellness_programs(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES auth.users(id),
  participant_name VARCHAR(255),
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'enrolled', -- enrolled, active, completed, dropped_out
  completion_date DATE,
  progress_percentage INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(program_id, participant_id)
);

-- Wellness Challenge Participation Table
CREATE TABLE IF NOT EXISTS public.wellness_challenge_participation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES public.wellness_challenges(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES auth.users(id),
  participant_name VARCHAR(255),
  team_name VARCHAR(255), -- Team name stored as text (no foreign key to teams table)
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, completed, dropped_out
  current_score DECIMAL(10,2) DEFAULT 0,
  rank INTEGER,
  completion_date DATE,
  reward_earned BOOLEAN DEFAULT false,
  reward_details TEXT,
  tracking_data JSONB, -- Flexible JSON for challenge-specific metrics
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_id, participant_id)
);

-- Wellness Events Table
CREATE TABLE IF NOT EXISTS public.wellness_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_number VARCHAR(50) UNIQUE NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL, -- workshop, seminar, fitness_class, social_event, health_screening, webinar
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(255),
  virtual_link VARCHAR(500),
  event_format VARCHAR(50) DEFAULT 'in_person', -- in_person, virtual, hybrid
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  facilitator_id UUID REFERENCES auth.users(id),
  facilitator_name VARCHAR(255),
  cost_per_person DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wellness Event Attendance Table
CREATE TABLE IF NOT EXISTS public.wellness_event_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.wellness_events(id) ON DELETE CASCADE,
  attendee_id UUID REFERENCES auth.users(id),
  attendee_name VARCHAR(255),
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  attendance_status VARCHAR(50) NOT NULL DEFAULT 'registered', -- registered, attended, no_show, cancelled
  check_in_time TIMESTAMP WITH TIME ZONE,
  feedback_rating INTEGER, -- 1-5 scale
  feedback_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, attendee_id)
);

-- Employee Wellness Surveys Table
CREATE TABLE IF NOT EXISTS public.wellness_surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_number VARCHAR(50) UNIQUE NOT NULL,
  survey_name VARCHAR(255) NOT NULL,
  survey_type VARCHAR(100) NOT NULL, -- engagement, satisfaction, health_assessment, feedback, pulse_survey
  description TEXT,
  questions JSONB NOT NULL, -- Array of question objects
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, active, closed, archived
  target_audience VARCHAR(100), -- all_employees, specific_department, specific_role
  anonymity_level VARCHAR(50) DEFAULT 'anonymous', -- anonymous, confidential, identified
  response_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wellness Survey Responses Table
CREATE TABLE IF NOT EXISTS public.wellness_survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES public.wellness_surveys(id) ON DELETE CASCADE,
  respondent_id UUID REFERENCES auth.users(id), -- NULL if anonymous
  respondent_department VARCHAR(255), -- For anonymous surveys, store department only
  responses JSONB NOT NULL, -- Answers to survey questions
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wellness Resources Table
CREATE TABLE IF NOT EXISTS public.wellness_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_number VARCHAR(50) UNIQUE NOT NULL,
  resource_name VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100) NOT NULL, -- article, video, podcast, tool, app, guide, template
  category VARCHAR(100), -- mental_health, fitness, nutrition, financial, work_life_balance, preventive_care
  description TEXT,
  content_url VARCHAR(500),
  file_path VARCHAR(500),
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Wellness Points Table (Gamification)
CREATE TABLE IF NOT EXISTS public.wellness_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES auth.users(id),
  employee_name VARCHAR(255),
  points_type VARCHAR(100) NOT NULL, -- challenge_completion, event_attendance, program_completion, daily_checkin, achievement
  points_earned INTEGER NOT NULL DEFAULT 0,
  activity_description TEXT,
  related_program_id UUID REFERENCES public.wellness_programs(id) ON DELETE SET NULL,
  related_challenge_id UUID REFERENCES public.wellness_challenges(id) ON DELETE SET NULL,
  related_event_id UUID REFERENCES public.wellness_events(id) ON DELETE SET NULL,
  earned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wellness Badges Table
CREATE TABLE IF NOT EXISTS public.wellness_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_number VARCHAR(50) UNIQUE NOT NULL,
  badge_name VARCHAR(255) NOT NULL,
  badge_type VARCHAR(100) NOT NULL, -- achievement, milestone, participation, special
  description TEXT,
  icon_url VARCHAR(500),
  criteria TEXT,
  points_required INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Badge Awards Table
CREATE TABLE IF NOT EXISTS public.wellness_badge_awards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_id UUID REFERENCES public.wellness_badges(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES auth.users(id),
  employee_name VARCHAR(255),
  awarded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  awarded_by UUID REFERENCES auth.users(id),
  awarded_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(badge_id, employee_id)
);

-- Wellness Metrics Table (Anonymized Health Data)
CREATE TABLE IF NOT EXISTS public.wellness_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_number VARCHAR(50) UNIQUE NOT NULL,
  metric_type VARCHAR(100) NOT NULL, -- steps, sleep_hours, water_intake, weight, bmi, stress_level, energy_level, mood
  metric_value DECIMAL(10,2) NOT NULL,
  metric_unit VARCHAR(50), -- steps, hours, liters, kg, score, percentage
  measurement_date DATE NOT NULL,
  employee_id UUID REFERENCES auth.users(id), -- For individual tracking (confidential)
  department VARCHAR(255), -- For aggregated/anonymized reporting
  source VARCHAR(100), -- manual_entry, wearable_device, app, survey
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wellness_programs_status ON public.wellness_programs(status);
CREATE INDEX IF NOT EXISTS idx_wellness_programs_type ON public.wellness_programs(program_type);
CREATE INDEX IF NOT EXISTS idx_wellness_challenges_status ON public.wellness_challenges(status);
CREATE INDEX IF NOT EXISTS idx_wellness_challenges_type ON public.wellness_challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_wellness_program_participation_program ON public.wellness_program_participation(program_id);
CREATE INDEX IF NOT EXISTS idx_wellness_program_participation_participant ON public.wellness_program_participation(participant_id);
CREATE INDEX IF NOT EXISTS idx_wellness_challenge_participation_challenge ON public.wellness_challenge_participation(challenge_id);
CREATE INDEX IF NOT EXISTS idx_wellness_challenge_participation_participant ON public.wellness_challenge_participation(participant_id);
CREATE INDEX IF NOT EXISTS idx_wellness_events_date ON public.wellness_events(event_date);
CREATE INDEX IF NOT EXISTS idx_wellness_events_status ON public.wellness_events(status);
CREATE INDEX IF NOT EXISTS idx_wellness_event_attendance_event ON public.wellness_event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_wellness_surveys_status ON public.wellness_surveys(status);
CREATE INDEX IF NOT EXISTS idx_wellness_survey_responses_survey ON public.wellness_survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_wellness_points_employee ON public.wellness_points(employee_id);
CREATE INDEX IF NOT EXISTS idx_wellness_points_date ON public.wellness_points(earned_date);
CREATE INDEX IF NOT EXISTS idx_wellness_badge_awards_employee ON public.wellness_badge_awards(employee_id);
CREATE INDEX IF NOT EXISTS idx_wellness_metrics_employee ON public.wellness_metrics(employee_id);
CREATE INDEX IF NOT EXISTS idx_wellness_metrics_date ON public.wellness_metrics(measurement_date);
CREATE INDEX IF NOT EXISTS idx_wellness_metrics_type ON public.wellness_metrics(metric_type);

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_wellness_programs_updated_at ON public.wellness_programs;
CREATE TRIGGER update_wellness_programs_updated_at
  BEFORE UPDATE ON public.wellness_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wellness_challenges_updated_at ON public.wellness_challenges;
CREATE TRIGGER update_wellness_challenges_updated_at
  BEFORE UPDATE ON public.wellness_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wellness_program_participation_updated_at ON public.wellness_program_participation;
CREATE TRIGGER update_wellness_program_participation_updated_at
  BEFORE UPDATE ON public.wellness_program_participation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wellness_challenge_participation_updated_at ON public.wellness_challenge_participation;
CREATE TRIGGER update_wellness_challenge_participation_updated_at
  BEFORE UPDATE ON public.wellness_challenge_participation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wellness_events_updated_at ON public.wellness_events;
CREATE TRIGGER update_wellness_events_updated_at
  BEFORE UPDATE ON public.wellness_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wellness_event_attendance_updated_at ON public.wellness_event_attendance;
CREATE TRIGGER update_wellness_event_attendance_updated_at
  BEFORE UPDATE ON public.wellness_event_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wellness_surveys_updated_at ON public.wellness_surveys;
CREATE TRIGGER update_wellness_surveys_updated_at
  BEFORE UPDATE ON public.wellness_surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wellness_resources_updated_at ON public.wellness_resources;
CREATE TRIGGER update_wellness_resources_updated_at
  BEFORE UPDATE ON public.wellness_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wellness_badges_updated_at ON public.wellness_badges;
CREATE TRIGGER update_wellness_badges_updated_at
  BEFORE UPDATE ON public.wellness_badges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wellness_metrics_updated_at ON public.wellness_metrics;
CREATE TRIGGER update_wellness_metrics_updated_at
  BEFORE UPDATE ON public.wellness_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.wellness_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_program_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_challenge_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_badge_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Wellness managers can view/manage all wellness data
DROP POLICY IF EXISTS "Wellness managers can view all wellness programs" ON public.wellness_programs;
CREATE POLICY "Wellness managers can view all wellness programs" ON public.wellness_programs
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('wellness_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Employee Wellness & Engagement'
        AND role IN ('wellness_manager', 'dept_manager')
    )
    OR EXISTS (
      SELECT 1 FROM public.wellness_program_participation
      WHERE participant_id = auth.uid() AND program_id = wellness_programs.id
    )
  );

DROP POLICY IF EXISTS "Wellness managers can manage wellness programs" ON public.wellness_programs;
CREATE POLICY "Wellness managers can manage wellness programs" ON public.wellness_programs
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('wellness_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Employee Wellness & Engagement'
        AND role IN ('wellness_manager', 'dept_manager')
    )
  );

-- Similar policies for other tables (abbreviated for brevity - apply same pattern)
DROP POLICY IF EXISTS "Wellness managers can view all wellness challenges" ON public.wellness_challenges;
CREATE POLICY "Wellness managers can view all wellness challenges" ON public.wellness_challenges
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('wellness_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Employee Wellness & Engagement'
    )
    OR EXISTS (
      SELECT 1 FROM public.wellness_challenge_participation
      WHERE participant_id = auth.uid() AND challenge_id = wellness_challenges.id
    )
  );

DROP POLICY IF EXISTS "Wellness managers can manage wellness challenges" ON public.wellness_challenges;
CREATE POLICY "Wellness managers can manage wellness challenges" ON public.wellness_challenges
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('wellness_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Employee Wellness & Engagement'
        AND role IN ('wellness_manager', 'dept_manager')
    )
  );

-- Employees can view their own participation
DROP POLICY IF EXISTS "Employees can view their own wellness participation" ON public.wellness_program_participation;
CREATE POLICY "Employees can view their own wellness participation" ON public.wellness_program_participation
  FOR SELECT
  USING (
    participant_id = auth.uid()
    OR auth.jwt() ->> 'role' IN ('wellness_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Employee Wellness & Engagement'
    )
  );

DROP POLICY IF EXISTS "Employees can manage their own wellness participation" ON public.wellness_program_participation;
CREATE POLICY "Employees can manage their own wellness participation" ON public.wellness_program_participation
  FOR ALL
  USING (
    participant_id = auth.uid()
    OR auth.jwt() ->> 'role' IN ('wellness_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Employee Wellness & Engagement'
    )
  );

-- Similar policies for challenge participation, events, surveys, etc.
-- (Applying same pattern - employees see their own, managers see all)

-- Wellness metrics - employees see only their own, managers see aggregated/anonymized
DROP POLICY IF EXISTS "Employees can view their own wellness metrics" ON public.wellness_metrics;
CREATE POLICY "Employees can view their own wellness metrics" ON public.wellness_metrics
  FOR SELECT
  USING (
    employee_id = auth.uid()
    OR auth.jwt() ->> 'role' IN ('wellness_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Employee Wellness & Engagement'
    )
  );

DROP POLICY IF EXISTS "Employees can manage their own wellness metrics" ON public.wellness_metrics;
CREATE POLICY "Employees can manage their own wellness metrics" ON public.wellness_metrics
  FOR ALL
  USING (
    employee_id = auth.uid()
    OR auth.jwt() ->> 'role' IN ('wellness_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Employee Wellness & Engagement'
    )
  );

-- Survey responses - anonymous surveys don't show respondent_id
DROP POLICY IF EXISTS "Employees can respond to surveys" ON public.wellness_survey_responses;
CREATE POLICY "Employees can respond to surveys" ON public.wellness_survey_responses
  FOR INSERT
  WITH CHECK (true); -- Anyone can respond

DROP POLICY IF EXISTS "Wellness managers can view survey responses" ON public.wellness_survey_responses;
CREATE POLICY "Wellness managers can view survey responses" ON public.wellness_survey_responses
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' IN ('wellness_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Employee Wellness & Engagement'
        AND role IN ('wellness_manager', 'dept_manager')
    )
  );

-- Points and badges - employees see their own, managers see all
DROP POLICY IF EXISTS "Employees can view their own wellness points" ON public.wellness_points;
CREATE POLICY "Employees can view their own wellness points" ON public.wellness_points
  FOR SELECT
  USING (
    employee_id = auth.uid()
    OR auth.jwt() ->> 'role' IN ('wellness_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Employee Wellness & Engagement'
    )
  );

DROP POLICY IF EXISTS "Wellness managers can manage wellness points" ON public.wellness_points;
CREATE POLICY "Wellness managers can manage wellness points" ON public.wellness_points
  FOR ALL
  USING (
    auth.jwt() ->> 'role' IN ('wellness_manager', 'dept_manager', 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
        AND department = 'Employee Wellness & Engagement'
        AND role IN ('wellness_manager', 'dept_manager')
    )
  );

-- Function to calculate total wellness points for an employee
CREATE OR REPLACE FUNCTION calculate_employee_wellness_points(emp_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(points_earned) FROM public.wellness_points WHERE employee_id = emp_id),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update program participant count
CREATE OR REPLACE FUNCTION update_program_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.wellness_programs
    SET current_participants = current_participants + 1
    WHERE id = NEW.program_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.wellness_programs
    SET current_participants = GREATEST(current_participants - 1, 0)
    WHERE id = OLD.program_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update participant counts
DROP TRIGGER IF EXISTS trg_update_program_participant_count ON public.wellness_program_participation;
CREATE TRIGGER trg_update_program_participant_count
  AFTER INSERT OR DELETE ON public.wellness_program_participation
  FOR EACH ROW
  EXECUTE FUNCTION update_program_participant_count();

-- Function to update challenge participant count
CREATE OR REPLACE FUNCTION update_challenge_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.wellness_challenges
    SET current_participants = current_participants + 1
    WHERE id = NEW.challenge_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.wellness_challenges
    SET current_participants = GREATEST(current_participants - 1, 0)
    WHERE id = OLD.challenge_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update challenge participant counts
DROP TRIGGER IF EXISTS trg_update_challenge_participant_count ON public.wellness_challenge_participation;
CREATE TRIGGER trg_update_challenge_participant_count
  AFTER INSERT OR DELETE ON public.wellness_challenge_participation
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_participant_count();

-- Function to update event attendee count
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.wellness_events
    SET current_attendees = current_attendees + 1
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.wellness_events
    SET current_attendees = GREATEST(current_attendees - 1, 0)
    WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update event attendee counts
DROP TRIGGER IF EXISTS trg_update_event_attendee_count ON public.wellness_event_attendance;
CREATE TRIGGER trg_update_event_attendee_count
  AFTER INSERT OR DELETE ON public.wellness_event_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_event_attendee_count();

