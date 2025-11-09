-- ============================================
-- DATABASE ROBUSTNESS FIXES
-- ============================================
-- This script applies fixes to make the database more robust
-- Run the audit script (037) first to identify issues, then run this to fix them
-- WARNING: Review all changes before applying to production!

-- ============================================
-- 1. CREATE MISSING UPDATE_UPDATED_AT_COLUMN FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Trigger function to automatically update updated_at timestamp';

-- ============================================
-- 2. ADD MISSING INDEXES ON FOREIGN KEYS
-- ============================================

-- Accounts Payable indexes
CREATE INDEX IF NOT EXISTS idx_accounts_payable_approved_by ON public.accounts_payable(approved_by);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_created_at ON public.accounts_payable(created_at);

-- Accounts Receivable indexes
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_project ON public.accounts_receivable(project_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_created_at ON public.accounts_receivable(created_at);

-- Financial Statements indexes
CREATE INDEX IF NOT EXISTS idx_financial_statements_approved_by ON public.financial_statements(approved_by);

-- Financial Transactions indexes
CREATE INDEX IF NOT EXISTS idx_financial_transactions_project ON public.financial_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_vendor ON public.financial_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_created_by ON public.financial_transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reference ON public.financial_transactions(reference_type, reference_id);

-- Cash Flow indexes
CREATE INDEX IF NOT EXISTS idx_cash_flow_transaction ON public.cash_flow(transaction_id);

-- Budget Forecasts indexes
CREATE INDEX IF NOT EXISTS idx_budget_forecasts_created_by ON public.budget_forecasts(created_by);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_employee ON public.expenses(employee_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_department ON public.projects(department);

-- Employees indexes
CREATE INDEX IF NOT EXISTS idx_employees_user ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);

-- Leave Requests indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_date ON public.leave_requests(from_date, to_date);

-- Assets indexes
CREATE INDEX IF NOT EXISTS idx_assets_assignee ON public.assets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category ON public.assets(category);

-- Performance Reviews indexes
CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee ON public.performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_reviewer ON public.performance_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_status ON public.performance_reviews(status);

-- Leave Balances indexes
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee ON public.leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON public.leave_balances(year);

-- Attendance Records indexes
CREATE INDEX IF NOT EXISTS idx_attendance_records_employee ON public.attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON public.attendance_records(status);

-- Training Programs indexes
CREATE INDEX IF NOT EXISTS idx_training_programs_status ON public.training_programs(status);
CREATE INDEX IF NOT EXISTS idx_training_programs_category ON public.training_programs(category);

-- Training Enrollments indexes
CREATE INDEX IF NOT EXISTS idx_training_enrollments_employee ON public.training_enrollments(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_program ON public.training_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_training_enrollments_status ON public.training_enrollments(status);

-- Department Budgets indexes
CREATE INDEX IF NOT EXISTS idx_department_budgets_department ON public.department_budgets(department);
CREATE INDEX IF NOT EXISTS idx_department_budgets_period ON public.department_budgets(period);

-- Employee Salaries indexes
CREATE INDEX IF NOT EXISTS idx_employee_salaries_employee ON public.employee_salaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_salaries_effective_date ON public.employee_salaries(effective_date);

-- Payroll Runs indexes
CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON public.payroll_runs(pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON public.payroll_runs(status);

-- Payslips indexes
CREATE INDEX IF NOT EXISTS idx_payslips_employee ON public.payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_payroll_run ON public.payslips(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON public.payslips(pay_period_start, pay_period_end);

-- Support Requests indexes
CREATE INDEX IF NOT EXISTS idx_support_requests_requester ON public.support_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_assignee ON public.support_requests(assignee_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON public.support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_priority ON public.support_requests(priority);
CREATE INDEX IF NOT EXISTS idx_support_requests_created_at ON public.support_requests(created_at);

-- Audit Findings indexes
CREATE INDEX IF NOT EXISTS idx_audit_findings_audit_id ON public.audit_findings(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_findings_status ON public.audit_findings(status);
CREATE INDEX IF NOT EXISTS idx_audit_findings_severity ON public.audit_findings(severity);

-- Regulatory Deadlines indexes (compliance-related)
CREATE INDEX IF NOT EXISTS idx_regulatory_deadlines_deadline_date ON public.regulatory_deadlines(deadline_date);
CREATE INDEX IF NOT EXISTS idx_regulatory_deadlines_status ON public.regulatory_deadlines(status);
CREATE INDEX IF NOT EXISTS idx_regulatory_deadlines_department ON public.regulatory_deadlines(department);

-- Legal Documents indexes
CREATE INDEX IF NOT EXISTS idx_legal_documents_type ON public.legal_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_legal_documents_status ON public.legal_documents(status);
CREATE INDEX IF NOT EXISTS idx_legal_documents_expiry_date ON public.legal_documents(expiry_date);

-- Contracts indexes
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON public.contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON public.contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_owner ON public.contracts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contracts_renewal_date ON public.contracts(renewal_date);

-- Safety Incidents indexes (HSE)
CREATE INDEX IF NOT EXISTS idx_safety_incidents_reported_by ON public.safety_incidents(reported_by);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_status ON public.safety_incidents(status);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_severity ON public.safety_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_date ON public.safety_incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_safety_incidents_type ON public.safety_incidents(incident_type);

-- System Incidents indexes (IT)
CREATE INDEX IF NOT EXISTS idx_system_incidents_reported_by ON public.system_incidents(reported_by);
CREATE INDEX IF NOT EXISTS idx_system_incidents_status ON public.system_incidents(status);
CREATE INDEX IF NOT EXISTS idx_system_incidents_severity ON public.system_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_system_incidents_started_at ON public.system_incidents(started_at);
CREATE INDEX IF NOT EXISTS idx_system_incidents_assigned_to ON public.system_incidents(assigned_to);

-- Safety Training Records indexes (HSE)
CREATE INDEX IF NOT EXISTS idx_safety_training_records_employee ON public.safety_training_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_safety_training_records_status ON public.safety_training_records(status);
CREATE INDEX IF NOT EXISTS idx_safety_training_records_completion_date ON public.safety_training_records(completed_date);
CREATE INDEX IF NOT EXISTS idx_safety_training_records_expiry_date ON public.safety_training_records(expiry_date);

-- CSR Projects indexes
CREATE INDEX IF NOT EXISTS idx_csr_projects_status ON public.csr_projects(status);
CREATE INDEX IF NOT EXISTS idx_csr_projects_type ON public.csr_projects(project_type);
CREATE INDEX IF NOT EXISTS idx_csr_projects_start_date ON public.csr_projects(start_date);
CREATE INDEX IF NOT EXISTS idx_csr_projects_created_by ON public.csr_projects(created_by);

-- Volunteer Activities indexes
CREATE INDEX IF NOT EXISTS idx_volunteer_activities_project ON public.volunteer_activities(csr_project_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_activities_date ON public.volunteer_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_volunteer_activities_status ON public.volunteer_activities(status);

-- Volunteer Participation indexes
CREATE INDEX IF NOT EXISTS idx_volunteer_participation_activity ON public.volunteer_participation(activity_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_participation_employee ON public.volunteer_participation(employee_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_participation_date ON public.volunteer_participation(participation_date);

-- Wellness Programs indexes
CREATE INDEX IF NOT EXISTS idx_wellness_programs_status ON public.wellness_programs(status);
CREATE INDEX IF NOT EXISTS idx_wellness_programs_type ON public.wellness_programs(program_type);

-- Wellness Program Participation indexes
CREATE INDEX IF NOT EXISTS idx_wellness_program_participation_participant ON public.wellness_program_participation(participant_id);
CREATE INDEX IF NOT EXISTS idx_wellness_program_participation_program ON public.wellness_program_participation(program_id);
CREATE INDEX IF NOT EXISTS idx_wellness_program_participation_status ON public.wellness_program_participation(status);

-- Security Incidents indexes
CREATE INDEX IF NOT EXISTS idx_security_incidents_detected_by ON public.security_incidents(detected_by);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON public.security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON public.security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_assigned_to ON public.security_incidents(assigned_to);

-- Access Logs indexes
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON public.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON public.access_logs(action_type);

-- Security Alerts indexes
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON public.security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON public.security_alerts(created_at);

-- R&D Projects indexes
CREATE INDEX IF NOT EXISTS idx_rnd_projects_status ON public.rnd_projects(status);
CREATE INDEX IF NOT EXISTS idx_rnd_projects_type ON public.rnd_projects(project_type);
CREATE INDEX IF NOT EXISTS idx_rnd_projects_phase ON public.rnd_projects(research_phase);

-- R&D Patents indexes
CREATE INDEX IF NOT EXISTS idx_rnd_patents_status ON public.rnd_patents(status);
CREATE INDEX IF NOT EXISTS idx_rnd_patents_filing_date ON public.rnd_patents(filing_date);

-- R&D Publications indexes
CREATE INDEX IF NOT EXISTS idx_rnd_publications_publication_date ON public.rnd_publications(publication_date);
CREATE INDEX IF NOT EXISTS idx_rnd_publications_type ON public.rnd_publications(publication_type);

-- Procurement Orders indexes
CREATE INDEX IF NOT EXISTS idx_procurement_orders_vendor ON public.procurement_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_procurement_orders_status ON public.procurement_orders(status);
CREATE INDEX IF NOT EXISTS idx_procurement_orders_created_by ON public.procurement_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_procurement_orders_approved_by ON public.procurement_orders(approved_by);

-- Vendors indexes
CREATE INDEX IF NOT EXISTS idx_vendors_type ON public.vendors(vendor_type);
CREATE INDEX IF NOT EXISTS idx_vendors_country ON public.vendors(country);

-- Facilities Maintenance indexes
CREATE INDEX IF NOT EXISTS idx_facilities_maintenance_status ON public.facilities_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_facilities_maintenance_priority ON public.facilities_maintenance(priority);
CREATE INDEX IF NOT EXISTS idx_facilities_maintenance_scheduled_date ON public.facilities_maintenance(scheduled_date);

-- Maintenance Requests indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_requested_by ON public.maintenance_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON public.maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_priority ON public.maintenance_requests(priority);

-- PMO Projects indexes
CREATE INDEX IF NOT EXISTS idx_pmo_projects_status ON public.pmo_projects(status);
CREATE INDEX IF NOT EXISTS idx_pmo_projects_department ON public.pmo_projects(department);
CREATE INDEX IF NOT EXISTS idx_pmo_projects_manager ON public.pmo_projects(project_manager_id);

-- PMO Tasks indexes
CREATE INDEX IF NOT EXISTS idx_pmo_tasks_project ON public.pmo_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_pmo_tasks_assignee ON public.pmo_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_pmo_tasks_status ON public.pmo_tasks(status);
CREATE INDEX IF NOT EXISTS idx_pmo_tasks_priority ON public.pmo_tasks(priority);

-- PMO Milestones indexes
CREATE INDEX IF NOT EXISTS idx_pmo_milestones_project ON public.pmo_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_pmo_milestones_status ON public.pmo_milestones(status);
CREATE INDEX IF NOT EXISTS idx_pmo_milestones_date ON public.pmo_milestones(milestone_date);

-- PMO Resources indexes
CREATE INDEX IF NOT EXISTS idx_pmo_resources_project ON public.pmo_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_pmo_resources_employee ON public.pmo_resources(employee_id);

-- Marketing Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type ON public.marketing_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_start_date ON public.marketing_campaigns(start_date);

-- Marketing Analytics indexes
CREATE INDEX IF NOT EXISTS idx_marketing_analytics_campaign ON public.marketing_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_analytics_date ON public.marketing_analytics(analytics_date);

-- ============================================
-- 3. ADD MISSING UPDATED_AT TRIGGERS
-- ============================================

-- Function to add updated_at trigger to a table
DO $$
DECLARE
  table_rec RECORD;
BEGIN
  FOR table_rec IN 
    SELECT DISTINCT t.table_name
    FROM information_schema.tables t
    JOIN information_schema.columns c 
      ON t.table_name = c.table_name
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND c.column_name = 'updated_at'
    AND NOT EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      AND event_object_table = t.table_name
      AND trigger_name LIKE '%updated_at%'
    )
  LOOP
    EXECUTE format('
      CREATE TRIGGER update_%I_updated_at 
      BEFORE UPDATE ON public.%I 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column()',
      table_rec.table_name, table_rec.table_name
    );
    RAISE NOTICE 'Created updated_at trigger for table: %', table_rec.table_name;
  END LOOP;
END $$;

-- ============================================
-- 4. ADD MISSING NOT NULL CONSTRAINTS
-- ============================================
-- Note: Review each constraint before applying - some columns may legitimately allow NULL

-- Add NOT NULL to critical columns (review before applying)
-- Uncomment and modify as needed:

/*
ALTER TABLE public.accounts_payable 
  ALTER COLUMN invoice_number SET NOT NULL,
  ALTER COLUMN vendor_name SET NOT NULL,
  ALTER COLUMN invoice_date SET NOT NULL,
  ALTER COLUMN due_date SET NOT NULL,
  ALTER COLUMN amount SET NOT NULL,
  ALTER COLUMN total_amount SET NOT NULL;

ALTER TABLE public.accounts_receivable 
  ALTER COLUMN invoice_number SET NOT NULL,
  ALTER COLUMN customer_name SET NOT NULL,
  ALTER COLUMN invoice_date SET NOT NULL,
  ALTER COLUMN due_date SET NOT NULL,
  ALTER COLUMN amount SET NOT NULL,
  ALTER COLUMN total_amount SET NOT NULL;

ALTER TABLE public.financial_transactions 
  ALTER COLUMN transaction_number SET NOT NULL,
  ALTER COLUMN transaction_date SET NOT NULL,
  ALTER COLUMN transaction_type SET NOT NULL,
  ALTER COLUMN account_type SET NOT NULL,
  ALTER COLUMN account_name SET NOT NULL,
  ALTER COLUMN amount SET NOT NULL,
  ALTER COLUMN description SET NOT NULL;
*/

-- ============================================
-- 5. ADD MISSING DEFAULT VALUES
-- ============================================

-- Add defaults where missing (review before applying)
DO $$
BEGIN
  -- Accounts Payable defaults
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'accounts_payable' 
             AND column_name = 'status' 
             AND column_default IS NULL) THEN
    ALTER TABLE public.accounts_payable 
      ALTER COLUMN status SET DEFAULT 'Pending';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'accounts_payable' 
             AND column_name = 'payment_status' 
             AND column_default IS NULL) THEN
    ALTER TABLE public.accounts_payable 
      ALTER COLUMN payment_status SET DEFAULT 'Unpaid';
  END IF;

  -- Accounts Receivable defaults
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'accounts_receivable' 
             AND column_name = 'status' 
             AND column_default IS NULL) THEN
    ALTER TABLE public.accounts_receivable 
      ALTER COLUMN status SET DEFAULT 'Draft';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'accounts_receivable' 
             AND column_name = 'payment_status' 
             AND column_default IS NULL) THEN
    ALTER TABLE public.accounts_receivable 
      ALTER COLUMN payment_status SET DEFAULT 'Unpaid';
  END IF;

  -- Financial Transactions defaults
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'financial_transactions' 
             AND column_name = 'status' 
             AND column_default IS NULL) THEN
    ALTER TABLE public.financial_transactions 
      ALTER COLUMN status SET DEFAULT 'Posted';
  END IF;

  -- Financial Statements defaults
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'financial_statements' 
             AND column_name = 'status' 
             AND column_default IS NULL) THEN
    ALTER TABLE public.financial_statements 
      ALTER COLUMN status SET DEFAULT 'Draft';
  END IF;

  -- Budget Forecasts defaults
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'budget_forecasts' 
             AND column_name = 'confidence_level' 
             AND column_default IS NULL) THEN
    ALTER TABLE public.budget_forecasts 
      ALTER COLUMN confidence_level SET DEFAULT 'Medium';
  END IF;
END $$;

-- ============================================
-- 6. ADD CHECK CONSTRAINTS FOR DATA VALIDATION
-- ============================================

-- Accounts Payable validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'accounts_payable'
    AND constraint_name = 'check_ap_total_amount'
  ) THEN
    ALTER TABLE public.accounts_payable
      ADD CONSTRAINT check_ap_total_amount 
      CHECK (total_amount >= amount);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'accounts_payable'
    AND constraint_name = 'check_ap_paid_amount'
  ) THEN
    ALTER TABLE public.accounts_payable
      ADD CONSTRAINT check_ap_paid_amount 
      CHECK (paid_amount >= 0 AND paid_amount <= total_amount);
  END IF;
END $$;

-- Accounts Receivable validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'accounts_receivable'
    AND constraint_name = 'check_ar_total_amount'
  ) THEN
    ALTER TABLE public.accounts_receivable
      ADD CONSTRAINT check_ar_total_amount 
      CHECK (total_amount >= amount);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'accounts_receivable'
    AND constraint_name = 'check_ar_paid_amount'
  ) THEN
    ALTER TABLE public.accounts_receivable
      ADD CONSTRAINT check_ar_paid_amount 
      CHECK (paid_amount >= 0 AND paid_amount <= total_amount);
  END IF;
END $$;

-- Cash Flow validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'cash_flow'
    AND constraint_name = 'check_cash_flow_balances'
  ) THEN
    ALTER TABLE public.cash_flow
      ADD CONSTRAINT check_cash_flow_balances 
      CHECK (cash_inflow >= 0 AND cash_outflow >= 0);
  END IF;
END $$;

-- Financial Statements validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'financial_statements'
    AND constraint_name = 'check_fs_period'
  ) THEN
    ALTER TABLE public.financial_statements
      ADD CONSTRAINT check_fs_period 
      CHECK (period_end >= period_start);
  END IF;
END $$;

-- Budget Forecasts validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
    AND table_name = 'budget_forecasts'
    AND constraint_name = 'check_bf_period'
  ) THEN
    ALTER TABLE public.budget_forecasts
      ADD CONSTRAINT check_bf_period 
      CHECK (period_end >= period_start);
  END IF;
END $$;

-- ============================================
-- 7. ADD TABLE COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.accounts_payable IS 'Vendor invoices that need to be paid - tracks accounts payable';
COMMENT ON TABLE public.accounts_receivable IS 'Customer invoices for payment collection - tracks accounts receivable';
COMMENT ON TABLE public.financial_statements IS 'Financial statements including P&L, Balance Sheet, and Cash Flow statements';
COMMENT ON TABLE public.financial_transactions IS 'General ledger transactions for double-entry bookkeeping';
COMMENT ON TABLE public.cash_flow IS 'Daily cash flow tracking with opening and closing balances';
COMMENT ON TABLE public.budget_forecasts IS 'Budget forecasts and projections with variance analysis';

-- ============================================
-- 8. CREATE VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Overdue Accounts Payable
CREATE OR REPLACE VIEW public.v_overdue_accounts_payable AS
SELECT 
  ap.*,
  v.name as vendor_name,
  v.email as vendor_email,
  CURRENT_DATE - ap.due_date as days_overdue
FROM public.accounts_payable ap
LEFT JOIN public.vendors v ON ap.vendor_id = v.id
WHERE ap.status = 'Overdue' 
  OR (ap.due_date < CURRENT_DATE AND ap.payment_status != 'Paid')
ORDER BY ap.due_date ASC;

COMMENT ON VIEW public.v_overdue_accounts_payable IS 'View of all overdue accounts payable invoices';

-- View: Overdue Accounts Receivable
CREATE OR REPLACE VIEW public.v_overdue_accounts_receivable AS
SELECT 
  ar.*,
  CURRENT_DATE - ar.due_date as days_overdue
FROM public.accounts_receivable ar
WHERE ar.status = 'Overdue' 
  OR (ar.due_date < CURRENT_DATE AND ar.payment_status != 'Paid')
ORDER BY ar.due_date ASC;

COMMENT ON VIEW public.v_overdue_accounts_receivable IS 'View of all overdue accounts receivable invoices';

-- View: Financial Summary
CREATE OR REPLACE VIEW public.v_financial_summary AS
SELECT 
  'Accounts Payable' as category,
  COUNT(*) as total_count,
  SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
  SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue_count,
  SUM(total_amount) as total_amount,
  SUM(paid_amount) as paid_amount,
  SUM(total_amount - paid_amount) as outstanding_amount
FROM public.accounts_payable
UNION ALL
SELECT 
  'Accounts Receivable' as category,
  COUNT(*) as total_count,
  SUM(CASE WHEN status = 'Sent' THEN 1 ELSE 0 END) as pending_count,
  SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue_count,
  SUM(total_amount) as total_amount,
  SUM(paid_amount) as paid_amount,
  SUM(total_amount - paid_amount) as outstanding_amount
FROM public.accounts_receivable;

COMMENT ON VIEW public.v_financial_summary IS 'Summary view of accounts payable and receivable';

-- ============================================
-- 9. SUMMARY
-- ============================================
DO $$
DECLARE
  index_count INTEGER;
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE ROBUSTNESS FIXES APPLIED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Indexes: %', index_count;
  RAISE NOTICE 'Total Triggers: %', trigger_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Fixes Applied:';
  RAISE NOTICE '1. ✓ Created/Updated update_updated_at_column function';
  RAISE NOTICE '2. ✓ Added indexes on foreign keys and common query columns';
  RAISE NOTICE '3. ✓ Added updated_at triggers to all tables with updated_at column';
  RAISE NOTICE '4. ✓ Added default values where appropriate';
  RAISE NOTICE '5. ✓ Added check constraints for data validation';
  RAISE NOTICE '6. ✓ Added table comments for documentation';
  RAISE NOTICE '7. ✓ Created useful views for common queries';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Review and apply NOT NULL constraints as needed';
  RAISE NOTICE '2. Run the audit script (037) again to verify fixes';
  RAISE NOTICE '3. Test application performance with new indexes';
  RAISE NOTICE '4. Monitor query performance and adjust indexes as needed';
  RAISE NOTICE '========================================';
END $$;

