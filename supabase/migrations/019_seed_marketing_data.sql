-- ============================================
-- AdminOS - Seed Marketing & Communications Data
-- ============================================
-- This script populates sample data for Marketing modules
-- 
-- Tables covered:
-- - marketing_campaigns
-- - content_calendar
-- - social_media_posts
-- - marketing_events
-- - brand_assets
-- - campaign_performance
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. MARKETING CAMPAIGNS
-- ============================================

INSERT INTO public.marketing_campaigns (
  campaign_number, campaign_name, campaign_type, description, objective, 
  target_audience, start_date, end_date, status, budget_allocated, budget_spent,
  expected_roi, actual_roi, impressions, clicks, conversions, engagement_rate,
  cost_per_click, cost_per_conversion, revenue_generated, campaign_manager_id,
  campaign_manager_name, created_by, created_by_name, department, channels, tags
)
SELECT 
  'MKT-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(ROW_NUMBER() OVER ()::TEXT, 4, '0'),
  campaign_data.campaign_name,
  campaign_data.campaign_type,
  campaign_data.description,
  campaign_data.objective,
  campaign_data.target_audience,
  campaign_data.start_date::DATE,
  campaign_data.end_date::DATE,
  campaign_data.status,
  campaign_data.budget_allocated,
  campaign_data.budget_spent,
  campaign_data.expected_roi,
  campaign_data.actual_roi,
  campaign_data.impressions,
  campaign_data.clicks,
  campaign_data.conversions,
  campaign_data.engagement_rate,
  campaign_data.cost_per_click,
  campaign_data.cost_per_conversion,
  campaign_data.revenue_generated,
  manager.id as campaign_manager_id,
  manager.full_name as campaign_manager_name,
  creator.id as created_by,
  creator.full_name as created_by_name,
  'Marketing & Communications' as department,
  campaign_data.channels::TEXT[],
  campaign_data.tags::TEXT[]
FROM (VALUES
  ('Summer Sale 2024', 'digital', 'Promote summer product line with digital ads across multiple platforms', 'sales', 'Millennials, Gen Z', 
   CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '15 days', 'active', 50000.00, 32500.00, 
   25.0, 28.5, 1250000, 45000, 1250, 3.6, 0.72, 26.00, 62500.00,
   ARRAY['website', 'facebook', 'instagram', 'google_ads'], ARRAY['summer', 'sale', 'promotion']),
  
  ('Brand Awareness Q4', 'social_media', 'Increase brand visibility and engagement on social media platforms', 'brand_awareness', 'General Audience',
   CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '30 days', 'active', 30000.00, 18500.00,
   15.0, 18.2, 2500000, 75000, 0, 3.0, 0.25, NULL, 0.00,
   ARRAY['facebook', 'instagram', 'linkedin', 'twitter'], ARRAY['brand', 'awareness', 'engagement']),
  
  ('Product Launch Campaign', 'email', 'Announce and promote new product launch through email marketing', 'lead_generation', 'Existing Customers, B2B',
   CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', 'active', 15000.00, 8500.00,
   30.0, 32.5, 500000, 25000, 850, 5.0, 0.34, 10.00, 27625.00,
   ARRAY['email', 'website'], ARRAY['product', 'launch', 'new']),
  
  ('Holiday Marketing', 'print', 'Traditional print advertising for holiday season', 'sales', 'All Demographics',
   CURRENT_DATE + INTERVAL '45 days', CURRENT_DATE + INTERVAL '75 days', 'planning', 40000.00, 0.00,
   20.0, NULL, 0, 0, 0, NULL, NULL, NULL, 0.00,
   ARRAY['magazine', 'newspaper', 'billboard'], ARRAY['holiday', 'seasonal', 'print']),
  
  ('Influencer Partnership', 'influencer', 'Collaborate with influencers to reach new audiences', 'engagement', 'Gen Z, Millennials',
   CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '10 days', 'active', 25000.00, 22000.00,
   22.0, 24.8, 800000, 120000, 0, 15.0, 0.18, NULL, 0.00,
   ARRAY['instagram', 'youtube', 'tiktok'], ARRAY['influencer', 'partnership', 'collaboration']),
  
  ('Content Marketing Drive', 'content', 'Create and distribute valuable content to attract customers', 'education', 'B2B, Professionals',
   CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '30 days', 'active', 20000.00, 16500.00,
   18.0, 20.5, 600000, 45000, 320, 7.5, 0.37, 51.56, 16499.20,
   ARRAY['website', 'blog', 'linkedin'], ARRAY['content', 'seo', 'education'])
) AS campaign_data(
  campaign_name, campaign_type, description, objective, target_audience,
  start_date, end_date, status, budget_allocated, budget_spent,
  expected_roi, actual_roi, impressions, clicks, conversions, engagement_rate,
  cost_per_click, cost_per_conversion, revenue_generated, channels, tags
)
CROSS JOIN LATERAL (
  SELECT id, full_name FROM public.user_profiles 
  WHERE department = 'Marketing & Communications' 
  AND role IN ('dept_manager', 'super_admin')
  ORDER BY random() LIMIT 1
) manager
CROSS JOIN LATERAL (
  SELECT id, full_name FROM public.user_profiles 
  WHERE department = 'Marketing & Communications'
  ORDER BY random() LIMIT 1
) creator
ON CONFLICT (campaign_number) DO NOTHING;

-- ============================================
-- 2. CONTENT CALENDAR
-- ============================================

INSERT INTO public.content_calendar (
  content_number, title, content_type, description, content_text,
  scheduled_date, scheduled_time, status, priority, assigned_to,
  assigned_to_name, campaign_id, channels, target_audience, keywords,
  created_by, created_by_name
)
SELECT 
  'CNT-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(ROW_NUMBER() OVER ()::TEXT, 4, '0'),
  content_data.title,
  content_data.content_type,
  content_data.description,
  content_data.content_text,
  content_data.scheduled_date::DATE,
  content_data.scheduled_time::TIME,
  content_data.status,
  content_data.priority,
  assignee.id as assigned_to,
  assignee.full_name as assigned_to_name,
  campaign.id as campaign_id,
  content_data.channels::TEXT[],
  content_data.target_audience,
  content_data.keywords::TEXT[],
  creator.id as created_by,
  creator.full_name as created_by_name
FROM (VALUES
  ('10 Tips for Better Marketing', 'blog_post', 'Educational blog post about marketing best practices', 
   'Marketing is constantly evolving. Here are 10 proven tips to improve your marketing strategy...',
   CURRENT_DATE + INTERVAL '3 days', '09:00:00', 'scheduled', 'high',
   ARRAY['website', 'blog'], 'Marketing Professionals', ARRAY['marketing', 'tips', 'strategy']),
  
  ('Product Feature Announcement', 'social_media', 'Announce new product features on social media',
   'Exciting news! Our new product now includes these amazing features...',
   CURRENT_DATE + INTERVAL '1 day', '10:00:00', 'scheduled', 'high',
   ARRAY['facebook', 'instagram', 'linkedin'], 'Existing Customers', ARRAY['product', 'features', 'update']),
  
  ('Q4 Newsletter', 'newsletter', 'Quarterly newsletter with company updates',
   'Welcome to our Q4 newsletter! Read about our latest achievements...',
   CURRENT_DATE + INTERVAL '7 days', '08:00:00', 'draft', 'medium',
   ARRAY['email'], 'All Subscribers', ARRAY['newsletter', 'updates', 'quarterly']),
  
  ('Case Study: Success Story', 'case_study', 'Customer success story case study',
   'Learn how Company X achieved 300% ROI using our solution...',
   CURRENT_DATE + INTERVAL '5 days', '14:00:00', 'scheduled', 'medium',
   ARRAY['website', 'linkedin'], 'B2B Prospects', ARRAY['case_study', 'success', 'roi']),
  
  ('Video: Product Demo', 'video', 'Product demonstration video',
   'Watch our comprehensive product demo to see all the features in action.',
   CURRENT_DATE + INTERVAL '2 days', '11:00:00', 'scheduled', 'high',
   ARRAY['youtube', 'website'], 'Prospects', ARRAY['video', 'demo', 'product']),
  
  ('Press Release: Partnership', 'press_release', 'Announce new strategic partnership',
   'We are excited to announce our new partnership with Industry Leader...',
   CURRENT_DATE + INTERVAL '4 days', '09:00:00', 'draft', 'high',
   ARRAY['website', 'pr_distribution'], 'Media, Investors', ARRAY['partnership', 'announcement', 'press'])
) AS content_data(
  title, content_type, description, content_text, scheduled_date, scheduled_time,
  status, priority, channels, target_audience, keywords
)
CROSS JOIN LATERAL (
  SELECT id FROM public.marketing_campaigns ORDER BY random() LIMIT 1
) campaign
CROSS JOIN LATERAL (
  SELECT id, full_name FROM public.user_profiles 
  WHERE department = 'Marketing & Communications'
  ORDER BY random() LIMIT 1
) assignee
CROSS JOIN LATERAL (
  SELECT id, full_name FROM public.user_profiles 
  WHERE department = 'Marketing & Communications'
  ORDER BY random() LIMIT 1
) creator
ON CONFLICT (content_number) DO NOTHING;

-- ============================================
-- 3. SOCIAL MEDIA POSTS
-- ============================================

INSERT INTO public.social_media_posts (
  post_number, platform, account_name, post_type, content_text,
  scheduled_date, scheduled_time, published_date, published_time, status,
  campaign_id, content_calendar_id, hashtags, mentions, link_url,
  performance_metrics, engagement_rate, created_by, created_by_name
)
SELECT 
  'SOC-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(ROW_NUMBER() OVER ()::TEXT, 4, '0'),
  post_data.platform,
  post_data.account_name,
  post_data.post_type,
  post_data.content_text,
  post_data.scheduled_date::DATE,
  post_data.scheduled_time::TIME,
  post_data.published_date::DATE,
  post_data.published_time::TIME,
  post_data.status,
  campaign.id as campaign_id,
  content.id as content_calendar_id,
  post_data.hashtags::TEXT[],
  post_data.mentions::TEXT[],
  post_data.link_url,
  post_data.performance_metrics::JSONB,
  post_data.engagement_rate,
  creator.id as created_by,
  creator.full_name as created_by_name
FROM (VALUES
  ('facebook', '@CompanyName', 'post', 'Exciting news! Check out our latest product features. #Innovation #Tech',
   CURRENT_DATE - INTERVAL '5 days', '10:00:00', CURRENT_DATE - INTERVAL '5 days', '10:00:00', 'published',
   ARRAY['innovation', 'tech', 'product'], ARRAY[]::TEXT[], 'https://company.com/product',
   '{"likes": 1250, "comments": 89, "shares": 234}'::JSONB, 12.5),
  
  ('instagram', '@company_official', 'reel', 'Behind the scenes of our product launch! 🚀',
   CURRENT_DATE - INTERVAL '3 days', '14:00:00', CURRENT_DATE - INTERVAL '3 days', '14:00:00', 'published',
   ARRAY['behindthescenes', 'launch', 'product'], ARRAY[]::TEXT[], 'https://company.com/launch',
   '{"likes": 3450, "comments": 156, "saves": 890}'::JSONB, 15.2),
  
  ('linkedin', 'Company Name', 'post', 'We are proud to announce our Q4 results. Thank you to our amazing team!',
   CURRENT_DATE - INTERVAL '7 days', '09:00:00', CURRENT_DATE - INTERVAL '7 days', '09:00:00', 'published',
   ARRAY['results', 'team', 'success'], ARRAY[]::TEXT[], 'https://company.com/results',
   '{"likes": 890, "comments": 45, "shares": 120}'::JSONB, 8.5),
  
  ('twitter', '@CompanyHandle', 'post', 'New product launch tomorrow! Stay tuned for exciting updates. #NewProduct',
   CURRENT_DATE + INTERVAL '1 day', '08:00:00', NULL, NULL, 'scheduled',
   ARRAY['newproduct', 'launch'], ARRAY[]::TEXT[], 'https://company.com/product',
   NULL::JSONB, NULL),
  
  ('youtube', 'Company Channel', 'video', 'Watch our comprehensive product demo and learn about all the features.',
   CURRENT_DATE - INTERVAL '10 days', '12:00:00', CURRENT_DATE - INTERVAL '10 days', '12:00:00', 'published',
   ARRAY['demo', 'product', 'tutorial'], ARRAY[]::TEXT[], 'https://youtube.com/watch?v=demo123',
   '{"views": 12500, "likes": 450, "comments": 67}'::JSONB, 4.2),
  
  ('instagram', '@company_official', 'story', 'Swipe up to learn more about our summer sale!',
   CURRENT_DATE, '11:00:00', CURRENT_DATE, '11:00:00', 'published',
   ARRAY['sale', 'summer'], ARRAY[]::TEXT[], 'https://company.com/sale',
   '{"views": 8900, "clicks": 1200}'::JSONB, 13.5)
) AS post_data(
  platform, account_name, post_type, content_text, scheduled_date, scheduled_time,
  published_date, published_time, status, hashtags, mentions, link_url,
  performance_metrics, engagement_rate
)
CROSS JOIN LATERAL (
  SELECT id FROM public.marketing_campaigns ORDER BY random() LIMIT 1
) campaign
CROSS JOIN LATERAL (
  SELECT id FROM public.content_calendar ORDER BY random() LIMIT 1
) content
CROSS JOIN LATERAL (
  SELECT id, full_name FROM public.user_profiles 
  WHERE department = 'Marketing & Communications'
  ORDER BY random() LIMIT 1
) creator
ON CONFLICT (post_number) DO NOTHING;

-- ============================================
-- 4. MARKETING EVENTS
-- ============================================

INSERT INTO public.marketing_events (
  event_number, event_name, event_type, description, location, venue_name,
  venue_address, start_date, start_time, end_date, end_time, status,
  registration_required, registration_url, max_attendees, registered_attendees,
  actual_attendees, budget_allocated, budget_spent, campaign_id,
  event_manager_id, event_manager_name, speakers, created_by, created_by_name
)
SELECT 
  'EVT-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(ROW_NUMBER() OVER ()::TEXT, 4, '0'),
  event_data.event_name,
  event_data.event_type,
  event_data.description,
  event_data.location,
  event_data.venue_name,
  event_data.venue_address,
  event_data.start_date::DATE,
  event_data.start_time::TIME,
  event_data.end_date::DATE,
  event_data.end_time::TIME,
  event_data.status,
  event_data.registration_required,
  event_data.registration_url,
  event_data.max_attendees,
  event_data.registered_attendees,
  event_data.actual_attendees,
  event_data.budget_allocated,
  event_data.budget_spent,
  campaign.id as campaign_id,
  manager.id as event_manager_id,
  manager.full_name as event_manager_name,
  event_data.speakers::TEXT[],
  creator.id as created_by,
  creator.full_name as created_by_name
FROM (VALUES
  ('Product Launch Event', 'product_launch', 'Official product launch event with demos and networking',
   'New York', 'Convention Center', '123 Main St, New York, NY 10001',
   CURRENT_DATE + INTERVAL '30 days', '18:00:00', CURRENT_DATE + INTERVAL '30 days', '21:00:00',
   'scheduled', true, 'https://company.com/events/launch', 500, 320, 0,
   25000.00, 8500.00, ARRAY['CEO John Smith', 'CTO Jane Doe', 'Product Manager']),
  
  ('Marketing Webinar Series', 'webinar', 'Monthly marketing best practices webinar',
   'Virtual', NULL, NULL,
   CURRENT_DATE + INTERVAL '7 days', '14:00:00', CURRENT_DATE + INTERVAL '7 days', '15:30:00',
   'scheduled', true, 'https://company.com/webinar', 1000, 750, 0,
   5000.00, 2500.00, ARRAY['Marketing Director', 'Industry Expert']),
  
  ('Trade Show 2024', 'trade_show', 'Annual industry trade show participation',
   'Las Vegas', 'Las Vegas Convention Center', '3150 Paradise Rd, Las Vegas, NV 89109',
   CURRENT_DATE + INTERVAL '60 days', '09:00:00', CURRENT_DATE + INTERVAL '62 days', '17:00:00',
   'planning', false, NULL, NULL, 0, 0,
   45000.00, 12000.00, ARRAY[]::TEXT[]),
  
  ('Customer Success Workshop', 'workshop', 'Hands-on workshop for existing customers',
   'San Francisco', 'Tech Hub', '456 Market St, San Francisco, CA 94105',
   CURRENT_DATE - INTERVAL '15 days', '10:00:00', CURRENT_DATE - INTERVAL '15 days', '16:00:00',
   'completed', true, 'https://company.com/workshop', 100, 95, 88,
   15000.00, 14200.00, ARRAY['Customer Success Manager'])
) AS event_data(
  event_name, event_type, description, location, venue_name, venue_address,
  start_date, start_time, end_date, end_time, status, registration_required,
  registration_url, max_attendees, registered_attendees, actual_attendees,
  budget_allocated, budget_spent, speakers
)
CROSS JOIN LATERAL (
  SELECT id FROM public.marketing_campaigns ORDER BY random() LIMIT 1
) campaign
CROSS JOIN LATERAL (
  SELECT id, full_name FROM public.user_profiles 
  WHERE department = 'Marketing & Communications' 
  AND role IN ('dept_manager', 'super_admin')
  ORDER BY random() LIMIT 1
) manager
CROSS JOIN LATERAL (
  SELECT id, full_name FROM public.user_profiles 
  WHERE department = 'Marketing & Communications'
  ORDER BY random() LIMIT 1
) creator
ON CONFLICT (event_number) DO NOTHING;

-- ============================================
-- 5. BRAND ASSETS
-- ============================================

INSERT INTO public.brand_assets (
  asset_number, asset_name, asset_type, category, description,
  file_url, thumbnail_url, file_size, file_format, tags,
  usage_rights, version, is_active, is_approved, brand_guideline_compliant,
  download_count, campaign_id, content_calendar_id, created_by, created_by_name
)
SELECT 
  'AST-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(ROW_NUMBER() OVER ()::TEXT, 4, '0'),
  asset_data.asset_name,
  asset_data.asset_type,
  asset_data.category,
  asset_data.description,
  asset_data.file_url,
  asset_data.thumbnail_url,
  asset_data.file_size,
  asset_data.file_format,
  asset_data.tags::TEXT[],
  asset_data.usage_rights,
  asset_data.version,
  asset_data.is_active,
  asset_data.is_approved,
  asset_data.brand_guideline_compliant,
  asset_data.download_count,
  campaign.id as campaign_id,
  content.id as content_calendar_id,
  creator.id as created_by,
  creator.full_name as created_by_name
FROM (VALUES
  ('Company Logo - Primary', 'logo', 'brand_identity', 'Primary company logo in PNG format',
   'https://company.com/assets/logo-primary.png', 'https://company.com/assets/logo-primary-thumb.png',
   245760, 'PNG', ARRAY['logo', 'primary', 'brand'], 'public', '2.0', true, true, true, 1250),
  
  ('Company Logo - White', 'logo', 'brand_identity', 'White version of company logo for dark backgrounds',
   'https://company.com/assets/logo-white.png', 'https://company.com/assets/logo-white-thumb.png',
   245760, 'PNG', ARRAY['logo', 'white', 'brand'], 'public', '2.0', true, true, true, 890),
  
  ('Brand Color Palette', 'color_palette', 'brand_identity', 'Official brand color palette with hex codes',
   'https://company.com/assets/color-palette.pdf', 'https://company.com/assets/color-palette-thumb.png',
   512000, 'PDF', ARRAY['colors', 'palette', 'brand'], 'internal_only', '1.0', true, true, true, 450),
  
  ('Product Hero Image', 'image', 'marketing_materials', 'High-resolution hero image for product pages',
   'https://company.com/assets/product-hero.jpg', 'https://company.com/assets/product-hero-thumb.jpg',
   2048000, 'JPG', ARRAY['product', 'hero', 'marketing'], 'external_use', '1.0', true, true, true, 320),
  
  ('Social Media Template', 'template', 'social_media', 'Instagram post template with brand guidelines',
   'https://company.com/assets/social-template.psd', 'https://company.com/assets/social-template-thumb.png',
   5120000, 'PSD', ARRAY['template', 'social', 'instagram'], 'internal_only', '1.0', true, true, true, 180),
  
  ('Brand Font Package', 'font', 'brand_identity', 'Company brand fonts package',
   'https://company.com/assets/brand-fonts.zip', 'https://company.com/assets/fonts-thumb.png',
   1536000, 'ZIP', ARRAY['fonts', 'typography', 'brand'], 'internal_only', '1.0', true, true, true, 95),
  
  ('Product Demo Video', 'video', 'marketing_materials', 'Product demonstration video for marketing',
   'https://company.com/assets/product-demo.mp4', 'https://company.com/assets/product-demo-thumb.jpg',
   52428800, 'MP4', ARRAY['video', 'demo', 'product'], 'public', '1.0', true, true, true, 560),
  
  ('Company Presentation Template', 'template', 'presentations', 'PowerPoint template with company branding',
   'https://company.com/assets/presentation-template.pptx', 'https://company.com/assets/presentation-thumb.png',
   3072000, 'PPTX', ARRAY['template', 'presentation', 'powerpoint'], 'internal_only', '1.0', true, true, true, 210)
) AS asset_data(
  asset_name, asset_type, category, description, file_url, thumbnail_url,
  file_size, file_format, tags, usage_rights, version, is_active,
  is_approved, brand_guideline_compliant, download_count
)
CROSS JOIN LATERAL (
  SELECT id FROM public.marketing_campaigns ORDER BY random() LIMIT 1
) campaign
CROSS JOIN LATERAL (
  SELECT id FROM public.content_calendar ORDER BY random() LIMIT 1
) content
CROSS JOIN LATERAL (
  SELECT id, full_name FROM public.user_profiles 
  WHERE department = 'Marketing & Communications'
  ORDER BY random() LIMIT 1
) creator
ON CONFLICT (asset_number) DO NOTHING;

-- ============================================
-- 6. CAMPAIGN PERFORMANCE DATA
-- ============================================

-- Insert performance snapshots for active campaigns
INSERT INTO public.campaign_performance (
  campaign_id, snapshot_date, impressions, clicks, conversions, engagement,
  revenue, spend, ctr, conversion_rate, cpc, cpa, roas, roi
)
SELECT 
  campaign.id as campaign_id,
  snapshot_date::DATE,
  performance_data.impressions,
  performance_data.clicks,
  performance_data.conversions,
  performance_data.engagement,
  performance_data.revenue,
  performance_data.spend,
  CASE WHEN performance_data.impressions > 0 
    THEN (performance_data.clicks::DECIMAL / performance_data.impressions * 100) 
    ELSE 0 END as ctr,
  CASE WHEN performance_data.clicks > 0 
    THEN (performance_data.conversions::DECIMAL / performance_data.clicks * 100) 
    ELSE 0 END as conversion_rate,
  CASE WHEN performance_data.clicks > 0 
    THEN (performance_data.spend / performance_data.clicks) 
    ELSE 0 END as cpc,
  CASE WHEN performance_data.conversions > 0 
    THEN (performance_data.spend / performance_data.conversions) 
    ELSE NULL END as cpa,
  CASE WHEN performance_data.spend > 0 
    THEN (performance_data.revenue / performance_data.spend) 
    ELSE NULL END as roas,
  CASE WHEN performance_data.spend > 0 
    THEN ((performance_data.revenue - performance_data.spend) / performance_data.spend * 100) 
    ELSE NULL END as roi
FROM (
  SELECT id, start_date FROM public.marketing_campaigns 
  WHERE status = 'active' AND start_date <= CURRENT_DATE
) campaign
CROSS JOIN (
  SELECT generate_series(
    GREATEST(campaign.start_date, CURRENT_DATE - INTERVAL '30 days'),
    CURRENT_DATE,
    INTERVAL '1 day'
  )::DATE as snapshot_date
  FROM public.marketing_campaigns campaign
  WHERE campaign.status = 'active' AND campaign.start_date <= CURRENT_DATE
  LIMIT 1
) dates
CROSS JOIN LATERAL (
  SELECT 
    (50000 + random() * 50000)::INTEGER as impressions,
    (500 + random() * 2000)::INTEGER as clicks,
    (10 + random() * 50)::INTEGER as conversions,
    (100 + random() * 500)::INTEGER as engagement,
    (500 + random() * 2000)::DECIMAL as revenue,
    (200 + random() * 800)::DECIMAL as spend
) performance_data
ON CONFLICT (campaign_id, snapshot_date) DO NOTHING;

-- ============================================
-- SUMMARY
-- ============================================
-- Seeded Marketing & Communications data:
-- - 6 Marketing Campaigns (various types and statuses)
-- - 6 Content Calendar Items (blog posts, social media, newsletters, etc.)
-- - 6 Social Media Posts (across multiple platforms)
-- - 4 Marketing Events (product launch, webinars, trade shows, workshops)
-- - 8 Brand Assets (logos, templates, videos, fonts, etc.)
-- - Campaign Performance snapshots for active campaigns
-- ============================================

