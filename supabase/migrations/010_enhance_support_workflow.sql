-- ============================================
-- Enhance Support Requests for Customer Support Workflow
-- ============================================
-- This migration adds fields for comprehensive customer support workflow
-- including SLA tracking, escalation, customer info, and team management

-- Add new columns to support_requests table
ALTER TABLE public.support_requests 
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sla_target_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS first_response_time_hours DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS escalated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS escalated_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Internal', -- Internal, Email, Phone, Portal, Chat
ADD COLUMN IF NOT EXISTS satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
ADD COLUMN IF NOT EXISTS satisfaction_feedback TEXT,
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS related_ticket_id UUID REFERENCES public.support_requests(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();

-- Update last_activity_at trigger
CREATE OR REPLACE FUNCTION update_support_request_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_support_request_activity_trigger ON public.support_requests;

CREATE TRIGGER update_support_request_activity_trigger
  BEFORE UPDATE ON public.support_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR 
        OLD.assignee_id IS DISTINCT FROM NEW.assignee_id OR
        OLD.comments IS DISTINCT FROM NEW.comments)
  EXECUTE FUNCTION update_support_request_activity();

-- Create support_team_members table for team management
CREATE TABLE IF NOT EXISTS public.support_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  team_role TEXT NOT NULL DEFAULT 'agent', -- manager, senior_agent, agent, trainee
  max_concurrent_tickets INTEGER DEFAULT 10,
  specialization_tags TEXT[] DEFAULT '{}',
  availability_status TEXT DEFAULT 'available', -- available, busy, away, offline
  current_ticket_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create support_sla_rules table for SLA management
CREATE TABLE IF NOT EXISTS public.support_sla_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  priority TEXT NOT NULL,
  category TEXT,
  first_response_hours INTEGER NOT NULL,
  resolution_hours INTEGER NOT NULL,
  escalation_hours INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default SLA rules
INSERT INTO public.support_sla_rules (priority, first_response_hours, resolution_hours, escalation_hours) VALUES
  ('High', 1, 4, 2),
  ('Medium', 4, 24, 12),
  ('Low', 8, 72, 48)
ON CONFLICT DO NOTHING;

-- Create support_escalations table for tracking escalations
CREATE TABLE IF NOT EXISTS public.support_escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES public.support_requests(id) ON DELETE CASCADE NOT NULL,
  escalated_from UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  escalated_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending', -- pending, accepted, resolved, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_requests_category ON public.support_requests(category);
CREATE INDEX IF NOT EXISTS idx_support_requests_status_priority ON public.support_requests(status, priority);
CREATE INDEX IF NOT EXISTS idx_support_requests_assignee_status ON public.support_requests(assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_support_requests_due_date ON public.support_requests(due_date);
CREATE INDEX IF NOT EXISTS idx_support_requests_last_activity ON public.support_requests(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_team_members_user ON public.support_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_support_escalations_ticket ON public.support_escalations(ticket_id);

-- Add comments to columns
COMMENT ON COLUMN public.support_requests.customer_name IS 'External customer name (if applicable)';
COMMENT ON COLUMN public.support_requests.customer_email IS 'Customer contact email';
COMMENT ON COLUMN public.support_requests.customer_phone IS 'Customer contact phone';
COMMENT ON COLUMN public.support_requests.category IS 'Main category: Technical, Billing, Account, Feature Request, Bug Report, etc.';
COMMENT ON COLUMN public.support_requests.sla_target_hours IS 'SLA target in hours for resolution';
COMMENT ON COLUMN public.support_requests.first_response_time_hours IS 'Time taken for first response in hours';
COMMENT ON COLUMN public.support_requests.escalation_level IS 'Number of times ticket has been escalated (0 = not escalated)';
COMMENT ON COLUMN public.support_requests.source IS 'How the ticket was created: Internal, Email, Phone, Portal, Chat';
COMMENT ON COLUMN public.support_requests.satisfaction_rating IS 'Customer satisfaction rating 1-5';
COMMENT ON COLUMN public.support_requests.internal_notes IS 'Internal notes visible only to support team';
COMMENT ON COLUMN public.support_requests.related_ticket_id IS 'Link to related ticket (e.g., follow-up, duplicate)';

-- Enable RLS on new tables
ALTER TABLE public.support_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_escalations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_team_members (drop if exists first)
DROP POLICY IF EXISTS "Support managers can view all team members" ON public.support_team_members;
CREATE POLICY "Support managers can view all team members" ON public.support_team_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND role IN ('support_manager', 'super_admin', 'hr_head')
    )
  );

DROP POLICY IF EXISTS "Users can view own team membership" ON public.support_team_members;
CREATE POLICY "Users can view own team membership" ON public.support_team_members
  FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policies for support_sla_rules (drop if exists first)
DROP POLICY IF EXISTS "Support team can view SLA rules" ON public.support_sla_rules;
CREATE POLICY "Support team can view SLA rules" ON public.support_sla_rules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND (role IN ('support_manager', 'super_admin') OR 
           EXISTS (SELECT 1 FROM public.support_team_members WHERE user_id = auth.uid()))
    )
  );

-- RLS Policies for support_escalations (drop if exists first)
DROP POLICY IF EXISTS "Users can view relevant escalations" ON public.support_escalations;
CREATE POLICY "Users can view relevant escalations" ON public.support_escalations
  FOR SELECT
  USING (
    escalated_from = auth.uid() OR 
    escalated_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.support_requests sr
      WHERE sr.id = ticket_id 
      AND (sr.requester_id = auth.uid() OR sr.assignee_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND role IN ('support_manager', 'super_admin')
    )
  );

-- Create function to auto-assign tickets based on workload
CREATE OR REPLACE FUNCTION auto_assign_support_ticket(ticket_id UUID)
RETURNS UUID AS $$
DECLARE
  assigned_agent_id UUID;
  ticket_priority TEXT;
BEGIN
  -- Get ticket priority
  SELECT priority INTO ticket_priority
  FROM public.support_requests
  WHERE id = ticket_id;
  
  -- Find available agent with least tickets
  SELECT stm.user_id INTO assigned_agent_id
  FROM public.support_team_members stm
  WHERE stm.availability_status = 'available'
    AND stm.current_ticket_count < stm.max_concurrent_tickets
  ORDER BY stm.current_ticket_count ASC, 
           CASE WHEN ticket_priority = 'High' THEN 
             CASE WHEN 'High' = ANY(stm.specialization_tags) THEN 0 ELSE 1 END
           ELSE 0 END
  LIMIT 1;
  
  -- Update ticket assignment
  IF assigned_agent_id IS NOT NULL THEN
    UPDATE public.support_requests
    SET assignee_id = assigned_agent_id,
        assignee_name = (SELECT full_name FROM public.user_profiles WHERE id = assigned_agent_id),
        status = 'In Progress',
        first_response_at = NOW()
    WHERE id = ticket_id;
    
    -- Update agent ticket count
    UPDATE public.support_team_members
    SET current_ticket_count = current_ticket_count + 1
    WHERE user_id = assigned_agent_id;
  END IF;
  
  RETURN assigned_agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate SLA status
CREATE OR REPLACE FUNCTION get_sla_status(ticket_id UUID)
RETURNS TEXT AS $$
DECLARE
  ticket_record RECORD;
  hours_elapsed DECIMAL;
  sla_status TEXT;
BEGIN
  SELECT * INTO ticket_record
  FROM public.support_requests
  WHERE id = ticket_id;
  
  IF ticket_record.status IN ('Resolved', 'Closed') THEN
    RETURN 'met';
  END IF;
  
  -- Calculate hours since creation
  hours_elapsed := EXTRACT(EPOCH FROM (NOW() - ticket_record.created_at)) / 3600;
  
  -- Check if first response was made
  IF ticket_record.first_response_at IS NULL THEN
    -- Check first response SLA
    IF hours_elapsed > (ticket_record.sla_target_hours * 0.5) THEN
      sla_status := 'at_risk';
    ELSE
      sla_status := 'on_track';
    END IF;
  ELSE
    -- Check resolution SLA
    IF hours_elapsed > ticket_record.sla_target_hours THEN
      sla_status := 'breached';
    ELSIF hours_elapsed > (ticket_record.sla_target_hours * 0.8) THEN
      sla_status := 'at_risk';
    ELSE
      sla_status := 'on_track';
    END IF;
  END IF;
  
  RETURN sla_status;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers (drop if exists first)
DROP TRIGGER IF EXISTS update_support_team_members_updated_at ON public.support_team_members;
CREATE TRIGGER update_support_team_members_updated_at
  BEFORE UPDATE ON public.support_team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_sla_rules_updated_at ON public.support_sla_rules;
CREATE TRIGGER update_support_sla_rules_updated_at
  BEFORE UPDATE ON public.support_sla_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

