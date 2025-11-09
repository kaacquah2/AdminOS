-- ============================================
-- Add resolution_notes field to audit_findings
-- ============================================
-- This migration adds a resolution_notes field to track notes and comments
-- when resolving compliance findings

ALTER TABLE public.audit_findings 
ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

COMMENT ON COLUMN public.audit_findings.resolution_notes IS 'Notes and comments added when resolving or updating a compliance finding';

