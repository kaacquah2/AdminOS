-- Create support_requests table for Requests & Ticketing module
CREATE TABLE IF NOT EXISTS public.support_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requester_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  assignee_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  assignee_name TEXT,
  priority TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  comments JSONB DEFAULT '[]'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_support_requests_requester ON public.support_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_assignee ON public.support_requests(assignee_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON public.support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_type ON public.support_requests(type);

-- Enable RLS
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own requests or requests assigned to them
CREATE POLICY "Users can view relevant requests" ON public.support_requests
  FOR SELECT
  USING (
    requester_id = auth.uid() OR 
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND (role IN ('super_admin', 'hr_head', 'it_head') OR has_permission('view_all_requests'))
    )
  );

-- Users can create their own requests
CREATE POLICY "Users can create requests" ON public.support_requests
  FOR INSERT
  WITH CHECK (requester_id = auth.uid());

-- Users can update their own requests or assigned requests
CREATE POLICY "Users can update relevant requests" ON public.support_requests
  FOR UPDATE
  USING (
    requester_id = auth.uid() OR 
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() 
      AND (role IN ('super_admin', 'hr_head', 'it_head') OR has_permission('manage_requests'))
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_support_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_requests_updated_at
  BEFORE UPDATE ON public.support_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_support_requests_updated_at();

