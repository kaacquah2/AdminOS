-- Simplified Storage RLS Policies
-- These policies work without requiring owner privileges
-- Run this script in Supabase SQL Editor
-- If you still get errors, use the Dashboard UI method instead

-- ============================================
-- STEP 1: Enable RLS (This might fail if not owner)
-- ============================================
-- Try this first - if it fails, skip to STEP 2
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Create Helper Functions (These should work)
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
-- STEP 3: Create Policies (Run these one at a time if needed)
-- ============================================

-- AVATARS: Simple policies
DROP POLICY IF EXISTS "Avatar images are viewable by authenticated users" ON storage.objects;
CREATE POLICY "Avatar images are viewable by authenticated users"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RECEIPTS: Simple policies
DROP POLICY IF EXISTS "Users can view relevant receipts" ON storage.objects;
CREATE POLICY "Users can view relevant receipts"
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

DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;
CREATE POLICY "Users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin') OR
    has_role('finance_director')
  )
);

DROP POLICY IF EXISTS "Users can update own receipts" ON storage.objects;
CREATE POLICY "Users can update own receipts"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'receipts' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin') OR
    has_role('finance_director')
  )
);

DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;
CREATE POLICY "Users can delete own receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin') OR
    has_role('finance_director')
  )
);

-- ATTACHMENTS: Simple policies
DROP POLICY IF EXISTS "Users can view relevant attachments" ON storage.objects;
CREATE POLICY "Users can view relevant attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin')
  )
);

DROP POLICY IF EXISTS "Users can upload attachments" ON storage.objects;
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update own attachments" ON storage.objects;
CREATE POLICY "Users can update own attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'attachments' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin')
  )
);

DROP POLICY IF EXISTS "Users can delete own attachments" ON storage.objects;
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin')
  )
);

-- DOCUMENTS: Simple policies
DROP POLICY IF EXISTS "Users can view accessible documents" ON storage.objects;
CREATE POLICY "Users can view accessible documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin')
  )
);

DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin')
  )
);

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin')
  )
);

-- RESUMES: Simple policies
DROP POLICY IF EXISTS "HR can view resumes" ON storage.objects;
CREATE POLICY "HR can view resumes"
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

DROP POLICY IF EXISTS "HR can upload resumes" ON storage.objects;
CREATE POLICY "HR can upload resumes"
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

DROP POLICY IF EXISTS "HR can update resumes" ON storage.objects;
CREATE POLICY "HR can update resumes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resumes' AND
  (
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_role('recruiter')
  )
);

DROP POLICY IF EXISTS "HR can delete resumes" ON storage.objects;
CREATE POLICY "HR can delete resumes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resumes' AND
  (
    has_role('super_admin') OR
    has_role('hr_head')
  )
);

-- CERTIFICATES: Simple policies
DROP POLICY IF EXISTS "Users can view relevant certificates" ON storage.objects;
CREATE POLICY "Users can view relevant certificates"
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

DROP POLICY IF EXISTS "Trainers can upload certificates" ON storage.objects;
CREATE POLICY "Trainers can upload certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certificates' AND
  (
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_role('trainer')
  )
);

DROP POLICY IF EXISTS "Trainers can update certificates" ON storage.objects;
CREATE POLICY "Trainers can update certificates"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'certificates' AND
  (
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_role('trainer')
  )
);

DROP POLICY IF EXISTS "Trainers can delete certificates" ON storage.objects;
CREATE POLICY "Trainers can delete certificates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'certificates' AND
  (
    has_role('super_admin') OR
    has_role('hr_head')
  )
);

-- ASSETS: Simple policies
DROP POLICY IF EXISTS "Authorized users can view assets" ON storage.objects;
CREATE POLICY "Authorized users can view assets"
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

DROP POLICY IF EXISTS "Authorized users can upload assets" ON storage.objects;
CREATE POLICY "Authorized users can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assets' AND
  (
    has_role('super_admin') OR
    has_role('procurement_officer') OR
    has_role('facilities_manager')
  )
);

DROP POLICY IF EXISTS "Authorized users can update assets" ON storage.objects;
CREATE POLICY "Authorized users can update assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'assets' AND
  (
    has_role('super_admin') OR
    has_role('procurement_officer') OR
    has_role('facilities_manager')
  )
);

DROP POLICY IF EXISTS "Authorized users can delete assets" ON storage.objects;
CREATE POLICY "Authorized users can delete assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'assets' AND
  (
    has_role('super_admin') OR
    has_role('procurement_officer') OR
    has_role('facilities_manager')
  )
);

-- AUDIT: Simple policies
DROP POLICY IF EXISTS "Audit team can view audit files" ON storage.objects;
CREATE POLICY "Audit team can view audit files"
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

DROP POLICY IF EXISTS "Audit team can upload audit files" ON storage.objects;
CREATE POLICY "Audit team can upload audit files"
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

DROP POLICY IF EXISTS "Audit team can update audit files" ON storage.objects;
CREATE POLICY "Audit team can update audit files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'audit' AND
  (
    has_role('super_admin') OR
    has_role('audit_head') OR
    has_role('audit_manager')
  )
);

DROP POLICY IF EXISTS "Audit head can delete audit files" ON storage.objects;
CREATE POLICY "Audit head can delete audit files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audit' AND
  (
    has_role('super_admin') OR
    has_role('audit_head')
  )
);

