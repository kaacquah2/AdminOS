-- Storage Buckets Setup Script
-- This script creates storage buckets using Supabase Storage API functions
-- Note: Some operations require admin privileges. If you get permission errors,
-- use the alternative method: Create buckets via Supabase Dashboard or use the 
-- Node.js script (supabase/create-buckets.js)

-- ============================================
-- STORAGE BUCKETS CREATION
-- ============================================

-- Note: Direct INSERT into storage.buckets requires superuser privileges
-- If you get permission errors, use one of these alternatives:
-- 1. Create buckets via Supabase Dashboard (Storage > New bucket)
-- 2. Use the Node.js script: node supabase/create-buckets.js
-- 3. Use Supabase Admin API (service role key)

-- For now, we'll create the RLS policies assuming buckets exist
-- You can create buckets manually via Dashboard or use the Node.js script

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

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

-- Anyone authenticated can view avatars (public bucket)
CREATE POLICY "Avatar images are viewable by authenticated users"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- RECEIPTS POLICIES
-- ============================================

-- Users can view their own receipts or receipts for expenses they manage
CREATE POLICY "Users can view relevant receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' AND
  (
    -- Own receipts
    auth.uid()::text = (storage.foldername(name))[1] OR
    -- Receipts for own expenses
    EXISTS (
      SELECT 1 FROM public.expenses
      WHERE receipt_url LIKE '%' || storage.objects.name || '%'
      AND employee_id IN (
        SELECT id FROM public.employees WHERE user_id = auth.uid()
      )
    ) OR
    -- Finance team can view all receipts
    has_role('super_admin') OR
    has_role('finance_director') OR
    has_role('accountant') OR
    has_permission('approve_expenses')
  )
);

-- Users can upload receipts for their own expenses
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

-- Users can update their own receipts
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

-- Users can delete their own receipts
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

-- ============================================
-- ATTACHMENTS POLICIES
-- ============================================

-- Users can view attachments they've sent/received or are part of workflows
CREATE POLICY "Users can view relevant attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments' AND
  (
    -- Own attachments
    auth.uid()::text = (storage.foldername(name))[1] OR
    -- Attachments in messages they sent/received
    EXISTS (
      SELECT 1 FROM public.messages
      WHERE name = ANY(attachments)
      AND (sender_id = auth.uid() OR recipient_id = auth.uid())
    ) OR
    -- Attachments in tasks assigned to them
    EXISTS (
      SELECT 1 FROM public.workflow_tasks
      WHERE name = ANY(attachments)
      AND (assigned_to = auth.uid() OR assigned_by = auth.uid())
    ) OR
    -- Admins can view all
    has_role('super_admin')
  )
);

-- Authenticated users can upload attachments
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' AND
  auth.role() = 'authenticated'
);

-- Users can update their own attachments
CREATE POLICY "Users can update own attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'attachments' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin')
  )
);

-- Users can delete their own attachments
CREATE POLICY "Users can delete own attachments"
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

-- Users can view documents they have access to
CREATE POLICY "Users can view accessible documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (
    -- Own documents
    auth.uid()::text = (storage.foldername(name))[1] OR
    -- Documents in their department
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND department = (storage.foldername(name))[2]
    ) OR
    -- Admins can view all
    has_role('super_admin') OR
    has_permission('view_documents')
  )
);

-- Users can upload documents
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('super_admin')
  )
);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
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

-- HR and recruiters can view resumes
CREATE POLICY "HR can view resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' AND
  (
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_role('hr_officer') OR
    has_role('recruiter') OR
    has_permission('manage_recruitment')
  )
);

-- Recruiters and HR can upload resumes
CREATE POLICY "HR can upload resumes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resumes' AND
  (
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_role('hr_officer') OR
    has_role('recruiter') OR
    has_permission('manage_recruitment')
  )
);

-- HR can update resumes
CREATE POLICY "HR can update resumes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resumes' AND
  (
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_role('recruiter') OR
    has_permission('manage_recruitment')
  )
);

-- HR can delete resumes
CREATE POLICY "HR can delete resumes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resumes' AND
  (
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_permission('manage_recruitment')
  )
);

-- ============================================
-- CERTIFICATES POLICIES
-- ============================================

-- Users can view their own certificates or HR can view all
CREATE POLICY "Users can view relevant certificates"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificates' AND
  (
    -- Own certificates
    auth.uid()::text = (storage.foldername(name))[1] OR
    -- HR can view all
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_role('trainer') OR
    has_permission('manage_training')
  )
);

-- Trainers and HR can upload certificates
CREATE POLICY "Trainers can upload certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certificates' AND
  (
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_role('trainer') OR
    has_permission('manage_training')
  )
);

-- Trainers can update certificates
CREATE POLICY "Trainers can update certificates"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'certificates' AND
  (
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_role('trainer') OR
    has_permission('manage_training')
  )
);

-- Trainers can delete certificates
CREATE POLICY "Trainers can delete certificates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'certificates' AND
  (
    has_role('super_admin') OR
    has_role('hr_head') OR
    has_permission('manage_training')
  )
);

-- ============================================
-- ASSETS POLICIES
-- ============================================

-- Authorized users can view asset files
CREATE POLICY "Authorized users can view assets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'assets' AND
  (
    has_role('super_admin') OR
    has_role('procurement_officer') OR
    has_role('facilities_manager') OR
    has_permission('manage_assets') OR
    auth.role() = 'authenticated' -- All authenticated users can view
  )
);

-- Procurement and facilities can upload asset files
CREATE POLICY "Authorized users can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assets' AND
  (
    has_role('super_admin') OR
    has_role('procurement_officer') OR
    has_role('facilities_manager') OR
    has_permission('manage_assets')
  )
);

-- Authorized users can update assets
CREATE POLICY "Authorized users can update assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'assets' AND
  (
    has_role('super_admin') OR
    has_role('procurement_officer') OR
    has_role('facilities_manager') OR
    has_permission('manage_assets')
  )
);

-- Authorized users can delete assets
CREATE POLICY "Authorized users can delete assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'assets' AND
  (
    has_role('super_admin') OR
    has_role('procurement_officer') OR
    has_role('facilities_manager') OR
    has_permission('manage_assets')
  )
);

-- ============================================
-- AUDIT POLICIES
-- ============================================

-- Only audit team can view audit files
CREATE POLICY "Audit team can view audit files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'audit' AND
  (
    has_role('super_admin') OR
    has_role('audit_head') OR
    has_role('audit_manager') OR
    has_role('internal_auditor') OR
    has_permission('audit_access')
  )
);

-- Audit team can upload audit files
CREATE POLICY "Audit team can upload audit files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audit' AND
  (
    has_role('super_admin') OR
    has_role('audit_head') OR
    has_role('audit_manager') OR
    has_role('internal_auditor') OR
    has_permission('audit_access')
  )
);

-- Audit team can update audit files
CREATE POLICY "Audit team can update audit files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'audit' AND
  (
    has_role('super_admin') OR
    has_role('audit_head') OR
    has_role('audit_manager') OR
    has_permission('audit_access')
  )
);

-- Only audit head and super admin can delete audit files
CREATE POLICY "Audit head can delete audit files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audit' AND
  (
    has_role('super_admin') OR
    has_role('audit_head') OR
    has_permission('audit_access')
  )
);
