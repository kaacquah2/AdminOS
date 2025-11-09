-- Storage RLS Policies (Skip ALTER TABLE)
-- This version skips "ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY"
-- which requires owner privileges. RLS might already be enabled.
-- Run this script - if policies fail, use Dashboard UI method instead

-- ============================================
-- Helper Functions (Run these first)
-- ============================================

-- Helper function to check if user has role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(required_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND required_permission = ANY(permissions)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AVATARS POLICIES
-- ============================================

CREATE POLICY IF NOT EXISTS "Avatar images are viewable by authenticated users"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- RECEIPTS POLICIES
-- ============================================

CREATE POLICY IF NOT EXISTS "Users can view relevant receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin') OR
    has_role('finance_director') OR
    has_role('accountant')
  )
);

CREATE POLICY IF NOT EXISTS "Users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin') OR
    has_role('finance_director')
  )
);

CREATE POLICY IF NOT EXISTS "Users can update own receipts"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'receipts' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin') OR
    has_role('finance_director')
  )
);

CREATE POLICY IF NOT EXISTS "Users can delete own receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin') OR
    has_role('finance_director')
  )
);

-- ============================================
-- ATTACHMENTS POLICIES
-- ============================================

CREATE POLICY IF NOT EXISTS "Users can view relevant attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin')
  )
);

CREATE POLICY IF NOT EXISTS "Users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' AND
  auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Users can update own attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'attachments' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin')
  )
);

CREATE POLICY IF NOT EXISTS "Users can delete own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin')
  )
);

-- ============================================
-- DOCUMENTS POLICIES
-- ============================================

CREATE POLICY IF NOT EXISTS "Users can view accessible documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin')
  )
);

CREATE POLICY IF NOT EXISTS "Users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Users can update own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin')
  )
);

CREATE POLICY IF NOT EXISTS "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin')
  )
);

-- ============================================
-- RESUMES POLICIES
-- ============================================

CREATE POLICY IF NOT EXISTS "HR can view resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' AND
  (
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_role('hr_officer') OR
    has_role('recruiter')
  )
);

CREATE POLICY IF NOT EXISTS "HR can upload resumes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resumes' AND
  (
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_role('hr_officer') OR
    has_role('recruiter')
  )
);

CREATE POLICY IF NOT EXISTS "HR can update resumes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resumes' AND
  (
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_role('recruiter')
  )
);

CREATE POLICY IF NOT EXISTS "HR can delete resumes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resumes' AND
  (
    has_role('super_admin') OR
    has_role('hr_head')
  )
);

-- ============================================
-- CERTIFICATES POLICIES
-- ============================================

CREATE POLICY IF NOT EXISTS "Users can view relevant certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificates' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_role('trainer')
  )
);

CREATE POLICY IF NOT EXISTS "Trainers can upload certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certificates' AND
  (
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_role('trainer')
  )
);

CREATE POLICY IF NOT EXISTS "Trainers can update certificates"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'certificates' AND
  (
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_role('trainer')
  )
);

CREATE POLICY IF NOT EXISTS "Trainers can delete certificates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'certificates' AND
  (
    has_role('super_admin') OR
    has_role('hr_head')
  )
);

-- ============================================
-- ASSETS POLICIES
-- ============================================

CREATE POLICY IF NOT EXISTS "Authorized users can view assets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assets' AND
  (
    has_role('super_admin') OR
    has_role('procurement_officer') OR
    has_role('facilities_manager') OR
    auth.role() = 'authenticated'
  )
);

CREATE POLICY IF NOT EXISTS "Authorized users can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assets' AND
  (
    has_role('super_admin') OR
    has_role('procurement_officer') OR
    has_role('facilities_manager')
  )
);

CREATE POLICY IF NOT EXISTS "Authorized users can update assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'assets' AND
  (
    has_role('super_admin') OR
    has_role('procurement_officer') OR
    has_role('facilities_manager')
  )
);

CREATE POLICY IF NOT EXISTS "Authorized users can delete assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'assets' AND
  (
    has_role('super_admin') OR
    has_role('procurement_officer') OR
    has_role('facilities_manager')
  )
);

-- ============================================
-- AUDIT POLICIES
-- ============================================

CREATE POLICY IF NOT EXISTS "Audit team can view audit files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'audit' AND
  (
    has_role('super_admin') OR
    has_role('audit_head') OR
    has_role('audit_manager') OR
    has_role('internal_auditor')
  )
);

CREATE POLICY IF NOT EXISTS "Audit team can upload audit files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audit' AND
  (
    has_role('super_admin') OR
    has_role('audit_head') OR
    has_role('audit_manager') OR
    has_role('internal_auditor')
  )
);

CREATE POLICY IF NOT EXISTS "Audit team can update audit files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'audit' AND
  (
    has_role('super_admin') OR
    has_role('audit_head') OR
    has_role('audit_manager')
  )
);

CREATE POLICY IF NOT EXISTS "Audit head can delete audit files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audit' AND
  (
    has_role('super_admin') OR
    has_role('audit_head')
  )
);

