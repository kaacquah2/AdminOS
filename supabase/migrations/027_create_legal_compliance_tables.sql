-- ============================================
-- Legal & Compliance - Additional Tables
-- ============================================
-- This migration creates tables for:
-- - Contracts management
-- - Regulatory deadlines tracking
-- - Certifications and licenses
-- - Legal documents
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CONTRACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_number TEXT UNIQUE NOT NULL,
  contract_name TEXT NOT NULL,
  contract_type TEXT NOT NULL, -- vendor, client, employment, service, lease, partnership, nda, msa
  party_name TEXT NOT NULL, -- Other party to the contract
  party_type TEXT, -- vendor, client, employee, partner, landlord
  status TEXT NOT NULL DEFAULT 'active', -- draft, active, expired, terminated, pending_renewal
  start_date DATE NOT NULL,
  end_date DATE,
  renewal_date DATE, -- When contract needs to be renewed
  auto_renew BOOLEAN DEFAULT false,
  value DECIMAL(12,2), -- Contract value
  currency TEXT DEFAULT 'USD',
  department TEXT, -- Department responsible
  owner_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  owner_name TEXT,
  description TEXT,
  key_terms TEXT[], -- Array of key terms/clauses
  document_url TEXT, -- Link to contract document
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

-- ============================================
-- REGULATORY DEADLINES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.regulatory_deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deadline_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  regulatory_body TEXT NOT NULL, -- Name of regulatory body
  regulation_type TEXT NOT NULL, -- filing, renewal, audit, certification, reporting, compliance
  deadline_date DATE NOT NULL,
  reminder_date DATE, -- When to send reminder
  status TEXT NOT NULL DEFAULT 'pending', -- pending, submitted, approved, rejected, overdue
  department TEXT, -- Department responsible
  assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  related_project_id UUID, -- Link to PMO project if applicable
  related_contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  filing_reference TEXT, -- Reference number for filing
  submission_date DATE, -- When actually submitted
  approval_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

-- ============================================
-- CERTIFICATIONS AND LICENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.certifications_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cert_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  cert_type TEXT NOT NULL, -- certification, license, permit, accreditation
  issuing_body TEXT NOT NULL, -- Organization that issued it
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  renewal_date DATE, -- When renewal process should start
  status TEXT NOT NULL DEFAULT 'active', -- active, expired, pending_renewal, revoked, suspended
  department TEXT, -- Department that holds this certification
  holder_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL, -- If held by individual
  holder_name TEXT,
  holder_type TEXT DEFAULT 'organization', -- organization, individual
  document_url TEXT, -- Link to certificate document
  requirements TEXT[], -- Array of renewal requirements
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

-- ============================================
-- LEGAL DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL, -- policy, procedure, agreement, memo, opinion, filing, notice
  category TEXT, -- employment, privacy, data_protection, intellectual_property, corporate, regulatory
  version TEXT DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, archived, superseded
  effective_date DATE,
  expiry_date DATE,
  review_date DATE, -- Next review date
  department TEXT, -- Department that owns this document
  owner_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  owner_name TEXT,
  document_url TEXT NOT NULL, -- Link to document
  summary TEXT,
  related_contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  related_deadline_id UUID REFERENCES public.regulatory_deadlines(id) ON DELETE SET NULL,
  approval_status TEXT, -- pending, approved, rejected
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_renewal_date ON public.contracts(renewal_date);
CREATE INDEX IF NOT EXISTS idx_contracts_department ON public.contracts(department);

CREATE INDEX IF NOT EXISTS idx_regulatory_deadlines_date ON public.regulatory_deadlines(deadline_date);
CREATE INDEX IF NOT EXISTS idx_regulatory_deadlines_status ON public.regulatory_deadlines(status);
CREATE INDEX IF NOT EXISTS idx_regulatory_deadlines_department ON public.regulatory_deadlines(department);

CREATE INDEX IF NOT EXISTS idx_certifications_expiry ON public.certifications_licenses(expiry_date);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON public.certifications_licenses(status);
CREATE INDEX IF NOT EXISTS idx_certifications_department ON public.certifications_licenses(department);

CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON public.legal_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_status ON public.legal_documents(status);
CREATE INDEX IF NOT EXISTS idx_legal_documents_department ON public.legal_documents(department);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Contracts viewable by Legal & Compliance and executives" ON public.contracts;
DROP POLICY IF EXISTS "Regulatory deadlines viewable by Legal & Compliance and executives" ON public.regulatory_deadlines;
DROP POLICY IF EXISTS "Certifications viewable by Legal & Compliance and executives" ON public.certifications_licenses;
DROP POLICY IF EXISTS "Legal documents viewable by Legal & Compliance and executives" ON public.legal_documents;

-- Contracts: Viewable by Legal & Compliance, Executives, and assigned owners
CREATE POLICY "Contracts viewable by Legal & Compliance and executives"
  ON public.contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Legal & Compliance'
        OR up.role IN ('super_admin', 'executive', 'dept_manager')
        OR owner_id = auth.uid()
      )
    )
  );

-- Regulatory Deadlines: Viewable by Legal & Compliance, Executives, and assigned users
CREATE POLICY "Regulatory deadlines viewable by Legal & Compliance and executives"
  ON public.regulatory_deadlines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Legal & Compliance'
        OR up.role IN ('super_admin', 'executive', 'dept_manager')
        OR assigned_to = auth.uid()
        OR department = up.department
      )
    )
  );

-- Certifications: Viewable by Legal & Compliance, Executives, and holders
CREATE POLICY "Certifications viewable by Legal & Compliance and executives"
  ON public.certifications_licenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Legal & Compliance'
        OR up.role IN ('super_admin', 'executive', 'dept_manager')
        OR holder_id = auth.uid()
        OR department = up.department
      )
    )
  );

-- Legal Documents: Viewable by Legal & Compliance, Executives, and owners
CREATE POLICY "Legal documents viewable by Legal & Compliance and executives"
  ON public.legal_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid()
      AND (
        up.department = 'Legal & Compliance'
        OR up.role IN ('super_admin', 'executive', 'dept_manager')
        OR owner_id = auth.uid()
        OR department = up.department
      )
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.contracts IS 'Contract management for vendor, client, employment, and other agreements';
COMMENT ON TABLE public.regulatory_deadlines IS 'Tracking of regulatory filing deadlines, renewals, and compliance requirements';
COMMENT ON TABLE public.certifications_licenses IS 'Organization and individual certifications, licenses, and permits';
COMMENT ON TABLE public.legal_documents IS 'Legal documents including policies, procedures, agreements, and filings';

