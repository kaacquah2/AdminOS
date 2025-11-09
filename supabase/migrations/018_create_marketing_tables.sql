-- ============================================
-- MARKETING & COMMUNICATIONS TABLES
-- ============================================

-- Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_number VARCHAR(50) UNIQUE NOT NULL,
  campaign_name VARCHAR(255) NOT NULL,
  campaign_type VARCHAR(100) NOT NULL, -- digital, print, social_media, email, event, pr, content, video, influencer
  description TEXT NOT NULL,
  objective TEXT NOT NULL, -- brand_awareness, lead_generation, sales, engagement, education
  target_audience TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'planning', -- planning, active, paused, completed, cancelled
  budget_allocated DECIMAL(12, 2) DEFAULT 0,
  budget_spent DECIMAL(12, 2) DEFAULT 0,
  expected_roi DECIMAL(5, 2), -- percentage
  actual_roi DECIMAL(5, 2), -- percentage
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5, 2), -- percentage
  cost_per_click DECIMAL(10, 2),
  cost_per_conversion DECIMAL(10, 2),
  revenue_generated DECIMAL(12, 2) DEFAULT 0,
  campaign_manager_id UUID REFERENCES auth.users(id),
  campaign_manager_name VARCHAR(255),
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(255),
  department VARCHAR(100) DEFAULT 'Marketing & Communications',
  channels TEXT[], -- array of channels: website, facebook, instagram, linkedin, twitter, email, etc.
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Calendar Table
CREATE TABLE IF NOT EXISTS public.content_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL, -- blog_post, social_media, video, infographic, newsletter, press_release, case_study, whitepaper
  description TEXT,
  content_text TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  publish_date DATE,
  publish_time TIME,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, scheduled, published, archived, cancelled
  priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high
  assigned_to UUID REFERENCES auth.users(id),
  assigned_to_name VARCHAR(255),
  campaign_id UUID REFERENCES public.marketing_campaigns(id),
  channels TEXT[], -- where content will be published
  target_audience TEXT,
  keywords TEXT[],
  seo_meta_title VARCHAR(255),
  seo_meta_description TEXT,
  content_url TEXT, -- URL where content is published
  thumbnail_url TEXT,
  approval_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, needs_revision
  approved_by UUID REFERENCES auth.users(id),
  approved_by_name VARCHAR(255),
  approval_date TIMESTAMP WITH TIME ZONE,
  performance_metrics JSONB DEFAULT '{}', -- views, likes, shares, comments, etc.
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Media Posts Table
CREATE TABLE IF NOT EXISTS public.social_media_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_number VARCHAR(50) UNIQUE NOT NULL,
  platform VARCHAR(100) NOT NULL, -- facebook, instagram, linkedin, twitter, youtube, tiktok, pinterest
  account_name VARCHAR(255) NOT NULL,
  post_type VARCHAR(100) NOT NULL, -- post, story, reel, video, carousel, live
  content_text TEXT NOT NULL,
  media_urls TEXT[], -- array of image/video URLs
  scheduled_date DATE,
  scheduled_time TIME,
  published_date DATE,
  published_time TIME,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, scheduled, published, archived
  campaign_id UUID REFERENCES public.marketing_campaigns(id),
  content_calendar_id UUID REFERENCES public.content_calendar(id),
  hashtags TEXT[],
  mentions TEXT[],
  link_url TEXT,
  performance_metrics JSONB DEFAULT '{}', -- likes, comments, shares, saves, reach, impressions, clicks
  engagement_rate DECIMAL(5, 2),
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing Events Table
CREATE TABLE IF NOT EXISTS public.marketing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_number VARCHAR(50) UNIQUE NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL, -- conference, webinar, workshop, trade_show, product_launch, networking, press_event
  description TEXT NOT NULL,
  location VARCHAR(255),
  venue_name VARCHAR(255),
  venue_address TEXT,
  start_date DATE NOT NULL,
  start_time TIME,
  end_date DATE,
  end_time TIME,
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  status VARCHAR(50) NOT NULL DEFAULT 'planning', -- planning, scheduled, in_progress, completed, cancelled
  registration_required BOOLEAN DEFAULT false,
  registration_url TEXT,
  max_attendees INTEGER,
  registered_attendees INTEGER DEFAULT 0,
  actual_attendees INTEGER DEFAULT 0,
  budget_allocated DECIMAL(12, 2) DEFAULT 0,
  budget_spent DECIMAL(12, 2) DEFAULT 0,
  campaign_id UUID REFERENCES public.marketing_campaigns(id),
  event_manager_id UUID REFERENCES auth.users(id),
  event_manager_name VARCHAR(255),
  speakers TEXT[], -- array of speaker names
  sponsors TEXT[],
  partners TEXT[],
  marketing_channels TEXT[], -- how event is promoted
  event_website_url TEXT,
  event_recording_url TEXT,
  feedback_score DECIMAL(3, 2), -- 1-5 rating
  leads_generated INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand Assets Table
CREATE TABLE IF NOT EXISTS public.brand_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_number VARCHAR(50) UNIQUE NOT NULL,
  asset_name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(100) NOT NULL, -- logo, image, video, document, template, font, color_palette, icon
  category VARCHAR(100), -- brand_identity, marketing_materials, social_media, presentations, documents
  description TEXT,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size BIGINT, -- in bytes
  file_format VARCHAR(50), -- jpg, png, pdf, ai, psd, etc.
  tags TEXT[],
  usage_rights VARCHAR(100), -- internal_only, external_use, public, restricted
  version VARCHAR(50) DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_by_name VARCHAR(255),
  approval_date TIMESTAMP WITH TIME ZONE,
  brand_guideline_compliant BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  last_used_date DATE,
  campaign_id UUID REFERENCES public.marketing_campaigns(id),
  content_calendar_id UUID REFERENCES public.content_calendar(id),
  created_by UUID REFERENCES auth.users(id),
  created_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing Analytics/Metrics Table (for tracking KPIs over time)
CREATE TABLE IF NOT EXISTS public.marketing_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date DATE NOT NULL,
  metric_type VARCHAR(100) NOT NULL, -- website_traffic, social_media_followers, email_subscribers, lead_generation, conversion_rate, brand_awareness
  metric_name VARCHAR(255) NOT NULL,
  metric_value DECIMAL(15, 2) NOT NULL,
  metric_unit VARCHAR(50), -- count, percentage, currency, etc.
  campaign_id UUID REFERENCES public.marketing_campaigns(id),
  channel VARCHAR(100), -- website, facebook, instagram, email, etc.
  platform VARCHAR(100), -- specific platform if applicable
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  recorded_by_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Performance Tracking Table (daily/weekly snapshots)
CREATE TABLE IF NOT EXISTS public.campaign_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0, -- likes, shares, comments combined
  revenue DECIMAL(12, 2) DEFAULT 0,
  spend DECIMAL(12, 2) DEFAULT 0,
  ctr DECIMAL(5, 2), -- click-through rate percentage
  conversion_rate DECIMAL(5, 2), -- conversion rate percentage
  cpc DECIMAL(10, 2), -- cost per click
  cpa DECIMAL(10, 2), -- cost per acquisition/conversion
  roas DECIMAL(5, 2), -- return on ad spend
  roi DECIMAL(5, 2), -- return on investment percentage
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, snapshot_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type ON public.marketing_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_dates ON public.marketing_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON public.content_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON public.content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_content_calendar_campaign ON public.content_calendar(campaign_id);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_platform ON public.social_media_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_status ON public.social_media_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_campaign ON public.social_media_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_events_date ON public.marketing_events(start_date);
CREATE INDEX IF NOT EXISTS idx_marketing_events_status ON public.marketing_events(status);
CREATE INDEX IF NOT EXISTS idx_brand_assets_type ON public.brand_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_brand_assets_category ON public.brand_assets(category);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_date ON public.marketing_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_marketing_metrics_type ON public.marketing_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_campaign ON public.campaign_performance(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_date ON public.campaign_performance(snapshot_date);

-- Add RLS policies
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_performance ENABLE ROW LEVEL SECURITY;

-- Marketing team can view all marketing data
CREATE POLICY "Marketing can view campaigns" ON public.marketing_campaigns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Marketing & Communications'
        OR up.role IN ('super_admin', 'executive', 'dept_manager')
      )
    )
  );

CREATE POLICY "Marketing can manage campaigns" ON public.marketing_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Marketing & Communications'
        OR up.role IN ('super_admin', 'dept_manager')
      )
    )
  );

-- Similar policies for other tables
CREATE POLICY "Marketing can view content calendar" ON public.content_calendar
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Marketing & Communications'
        OR up.role IN ('super_admin', 'executive', 'dept_manager')
      )
    )
  );

CREATE POLICY "Marketing can manage content calendar" ON public.content_calendar
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Marketing & Communications'
        OR up.role IN ('super_admin', 'dept_manager')
      )
    )
  );

CREATE POLICY "Marketing can view social media posts" ON public.social_media_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Marketing & Communications'
        OR up.role IN ('super_admin', 'executive', 'dept_manager')
      )
    )
  );

CREATE POLICY "Marketing can manage social media posts" ON public.social_media_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Marketing & Communications'
        OR up.role IN ('super_admin', 'dept_manager')
      )
    )
  );

CREATE POLICY "Marketing can view events" ON public.marketing_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Marketing & Communications'
        OR up.role IN ('super_admin', 'executive', 'dept_manager')
      )
    )
  );

CREATE POLICY "Marketing can manage events" ON public.marketing_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Marketing & Communications'
        OR up.role IN ('super_admin', 'dept_manager')
      )
    )
  );

CREATE POLICY "Marketing can view brand assets" ON public.brand_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Marketing & Communications'
        OR up.role IN ('super_admin', 'executive', 'dept_manager')
      )
    )
  );

CREATE POLICY "Marketing can manage brand assets" ON public.brand_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Marketing & Communications'
        OR up.role IN ('super_admin', 'dept_manager')
      )
    )
  );

CREATE POLICY "Marketing can view metrics" ON public.marketing_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Marketing & Communications'
        OR up.role IN ('super_admin', 'executive', 'dept_manager')
      )
    )
  );

CREATE POLICY "Marketing can manage metrics" ON public.marketing_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Marketing & Communications'
        OR up.role IN ('super_admin', 'dept_manager')
      )
    )
  );

CREATE POLICY "Marketing can view campaign performance" ON public.campaign_performance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Marketing & Communications'
        OR up.role IN ('super_admin', 'executive', 'dept_manager')
      )
    )
  );

CREATE POLICY "Marketing can manage campaign performance" ON public.campaign_performance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Marketing & Communications'
        OR up.role IN ('super_admin', 'dept_manager')
      )
    )
  );

-- Add comments
COMMENT ON TABLE public.marketing_campaigns IS 'Marketing campaigns with performance tracking';
COMMENT ON TABLE public.content_calendar IS 'Content calendar for scheduling marketing content';
COMMENT ON TABLE public.social_media_posts IS 'Social media posts across platforms';
COMMENT ON TABLE public.marketing_events IS 'Marketing events and their management';
COMMENT ON TABLE public.brand_assets IS 'Brand assets library for marketing materials';
COMMENT ON TABLE public.marketing_metrics IS 'Marketing KPIs and metrics tracking';
COMMENT ON TABLE public.campaign_performance IS 'Daily/weekly campaign performance snapshots';

