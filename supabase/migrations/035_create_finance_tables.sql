-- ============================================
-- COMPREHENSIVE FINANCE & ACCOUNTING TABLES
-- ============================================
-- This migration creates additional tables for a complete finance portal
-- Based on real-world finance management systems

-- ============================================
-- 1. VENDORS/SUPPLIERS TABLE
-- ============================================
-- Note: Vendors table already exists from procurement migration
-- We'll add any missing columns if needed
DO $$ 
BEGIN
  -- Add currency column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vendors' 
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.vendors ADD COLUMN currency TEXT DEFAULT 'USD';
  END IF;
  
  -- Add last_purchase_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vendors' 
    AND column_name = 'last_purchase_date'
  ) THEN
    ALTER TABLE public.vendors ADD COLUMN last_purchase_date DATE;
  END IF;
END $$;

-- ============================================
-- 2. ACCOUNTS PAYABLE (INVOICES FROM VENDORS)
-- ============================================
CREATE TABLE IF NOT EXISTS public.accounts_payable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  vendor_name TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'Pending', -- Pending, Approved, Paid, Overdue, Cancelled
  payment_status TEXT DEFAULT 'Unpaid', -- Unpaid, Partially Paid, Paid
  paid_amount DECIMAL(15,2) DEFAULT 0,
  payment_date DATE,
  payment_method TEXT, -- Check, Wire Transfer, ACH, Credit Card
  category TEXT, -- Utilities, Services, Supplies, Equipment, etc.
  description TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name TEXT,
  department TEXT,
  approval_status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  invoice_url TEXT, -- Link to invoice document
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. ACCOUNTS RECEIVABLE (INVOICES TO CUSTOMERS)
-- ============================================
CREATE TABLE IF NOT EXISTS public.accounts_receivable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT 'Draft', -- Draft, Sent, Paid, Overdue, Cancelled
  payment_status TEXT DEFAULT 'Unpaid', -- Unpaid, Partially Paid, Paid
  paid_amount DECIMAL(15,2) DEFAULT 0,
  payment_date DATE,
  payment_method TEXT,
  currency TEXT DEFAULT 'USD',
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name TEXT,
  department TEXT,
  description TEXT,
  invoice_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. FINANCIAL STATEMENTS (P&L, Balance Sheet, Cash Flow)
-- ============================================
CREATE TABLE IF NOT EXISTS public.financial_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statement_type TEXT NOT NULL, -- income_statement, balance_sheet, cash_flow
  period_type TEXT NOT NULL, -- monthly, quarterly, annual
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER, -- 1-12 for monthly/quarterly
  quarter INTEGER, -- 1-4 for quarterly
  revenue DECIMAL(15,2) DEFAULT 0,
  cost_of_goods_sold DECIMAL(15,2) DEFAULT 0,
  gross_profit DECIMAL(15,2) DEFAULT 0,
  operating_expenses DECIMAL(15,2) DEFAULT 0,
  operating_income DECIMAL(15,2) DEFAULT 0,
  other_income DECIMAL(15,2) DEFAULT 0,
  other_expenses DECIMAL(15,2) DEFAULT 0,
  net_income DECIMAL(15,2) DEFAULT 0,
  total_assets DECIMAL(15,2) DEFAULT 0,
  total_liabilities DECIMAL(15,2) DEFAULT 0,
  total_equity DECIMAL(15,2) DEFAULT 0,
  cash_flow_operating DECIMAL(15,2) DEFAULT 0,
  cash_flow_investing DECIMAL(15,2) DEFAULT 0,
  cash_flow_financing DECIMAL(15,2) DEFAULT 0,
  net_cash_flow DECIMAL(15,2) DEFAULT 0,
  status TEXT DEFAULT 'Draft', -- Draft, Final, Approved
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(statement_type, period_type, period_start, period_end)
);

-- ============================================
-- 5. FINANCIAL TRANSACTIONS (General Ledger)
-- ============================================
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_number TEXT NOT NULL UNIQUE,
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL, -- Revenue, Expense, Payment, Receipt, Transfer, Adjustment
  account_type TEXT NOT NULL, -- Asset, Liability, Equity, Revenue, Expense
  account_name TEXT NOT NULL, -- Cash, Accounts Receivable, Accounts Payable, etc.
  amount DECIMAL(15,2) NOT NULL,
  debit_amount DECIMAL(15,2) DEFAULT 0,
  credit_amount DECIMAL(15,2) DEFAULT 0,
  description TEXT NOT NULL,
  reference_type TEXT, -- Invoice, Expense, Payment, etc.
  reference_id UUID, -- ID of related record
  department TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name TEXT,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  vendor_name TEXT,
  status TEXT DEFAULT 'Posted', -- Draft, Posted, Reversed
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. CASH FLOW TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS public.cash_flow (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  opening_balance DECIMAL(15,2) NOT NULL,
  cash_inflow DECIMAL(15,2) DEFAULT 0,
  cash_outflow DECIMAL(15,2) DEFAULT 0,
  closing_balance DECIMAL(15,2) NOT NULL,
  inflow_category TEXT, -- Sales, Investments, Loans, etc.
  outflow_category TEXT, -- Expenses, Purchases, Loan Payments, etc.
  description TEXT,
  transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. BUDGET FORECASTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.budget_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department TEXT,
  category TEXT, -- Revenue, Expense, etc.
  forecast_type TEXT NOT NULL, -- Monthly, Quarterly, Annual
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  forecasted_amount DECIMAL(15,2) NOT NULL,
  actual_amount DECIMAL(15,2) DEFAULT 0,
  variance DECIMAL(15,2) DEFAULT 0,
  variance_percentage DECIMAL(5,2) DEFAULT 0,
  confidence_level TEXT DEFAULT 'Medium', -- Low, Medium, High
  assumptions TEXT,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. EXPENSE ENHANCEMENTS (Add project_id to expenses)
-- ============================================
-- Add project_id column to expenses if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'expenses' 
    AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.expenses 
    ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    ADD COLUMN project_name TEXT;
  END IF;
END $$;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON public.vendors(name);

CREATE INDEX IF NOT EXISTS idx_accounts_payable_vendor ON public.accounts_payable(vendor_id);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_status ON public.accounts_payable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_due_date ON public.accounts_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_department ON public.accounts_payable(department);

CREATE INDEX IF NOT EXISTS idx_accounts_receivable_status ON public.accounts_receivable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_due_date ON public.accounts_receivable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_customer ON public.accounts_receivable(customer_name);

CREATE INDEX IF NOT EXISTS idx_financial_statements_type ON public.financial_statements(statement_type);
CREATE INDEX IF NOT EXISTS idx_financial_statements_period ON public.financial_statements(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_financial_statements_year ON public.financial_statements(year);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON public.financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_account ON public.financial_transactions(account_name);

CREATE INDEX IF NOT EXISTS idx_cash_flow_date ON public.cash_flow(date);

CREATE INDEX IF NOT EXISTS idx_budget_forecasts_department ON public.budget_forecasts(department);
CREATE INDEX IF NOT EXISTS idx_budget_forecasts_period ON public.budget_forecasts(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_expenses_project ON public.expenses(project_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all finance tables
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_forecasts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ACCOUNTS PAYABLE POLICIES
-- ============================================

-- Finance department can view all accounts payable
CREATE POLICY "Finance can view accounts payable" ON public.accounts_payable
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (
        role IN ('super_admin', 'finance_director', 'accountant', 'dept_manager')
        OR department = 'Finance & Accounting'
        OR 'manage_finance' = ANY(permissions)
        OR 'approve_expenses' = ANY(permissions)
      )
    )
  );

-- Finance department can manage accounts payable
CREATE POLICY "Finance can manage accounts payable" ON public.accounts_payable
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (
        role IN ('super_admin', 'finance_director', 'accountant')
        OR department = 'Finance & Accounting'
        OR 'manage_finance' = ANY(permissions)
      )
    )
  );

-- ============================================
-- ACCOUNTS RECEIVABLE POLICIES
-- ============================================

-- Finance department can view all accounts receivable
CREATE POLICY "Finance can view accounts receivable" ON public.accounts_receivable
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (
        role IN ('super_admin', 'finance_director', 'accountant', 'dept_manager')
        OR department = 'Finance & Accounting'
        OR 'manage_finance' = ANY(permissions)
      )
    )
  );

-- Finance department can manage accounts receivable
CREATE POLICY "Finance can manage accounts receivable" ON public.accounts_receivable
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (
        role IN ('super_admin', 'finance_director', 'accountant')
        OR department = 'Finance & Accounting'
        OR 'manage_finance' = ANY(permissions)
      )
    )
  );

-- ============================================
-- FINANCIAL STATEMENTS POLICIES
-- ============================================

-- Finance department and executives can view financial statements
CREATE POLICY "Finance can view financial statements" ON public.financial_statements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (
        role IN ('super_admin', 'finance_director', 'accountant', 'dept_manager')
        OR department IN ('Finance & Accounting', 'Executive Management')
        OR 'manage_finance' = ANY(permissions)
        OR 'view_analytics' = ANY(permissions)
      )
    )
  );

-- Finance department can manage financial statements
CREATE POLICY "Finance can manage financial statements" ON public.financial_statements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (
        role IN ('super_admin', 'finance_director', 'accountant')
        OR department = 'Finance & Accounting'
        OR 'manage_finance' = ANY(permissions)
      )
    )
  );

-- ============================================
-- FINANCIAL TRANSACTIONS POLICIES
-- ============================================

-- Finance department can view financial transactions
CREATE POLICY "Finance can view financial transactions" ON public.financial_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (
        role IN ('super_admin', 'finance_director', 'accountant', 'dept_manager')
        OR department = 'Finance & Accounting'
        OR 'manage_finance' = ANY(permissions)
      )
    )
  );

-- Finance department can manage financial transactions
CREATE POLICY "Finance can manage financial transactions" ON public.financial_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (
        role IN ('super_admin', 'finance_director', 'accountant')
        OR department = 'Finance & Accounting'
        OR 'manage_finance' = ANY(permissions)
      )
    )
  );

-- ============================================
-- CASH FLOW POLICIES
-- ============================================

-- Finance department and executives can view cash flow
CREATE POLICY "Finance can view cash flow" ON public.cash_flow
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (
        role IN ('super_admin', 'finance_director', 'accountant', 'dept_manager')
        OR department IN ('Finance & Accounting', 'Executive Management')
        OR 'manage_finance' = ANY(permissions)
        OR 'view_analytics' = ANY(permissions)
      )
    )
  );

-- Finance department can manage cash flow
CREATE POLICY "Finance can manage cash flow" ON public.cash_flow
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (
        role IN ('super_admin', 'finance_director', 'accountant')
        OR department = 'Finance & Accounting'
        OR 'manage_finance' = ANY(permissions)
      )
    )
  );

-- ============================================
-- BUDGET FORECASTS POLICIES
-- ============================================

-- Finance department and managers can view budget forecasts
CREATE POLICY "Finance can view budget forecasts" ON public.budget_forecasts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (
        role IN ('super_admin', 'finance_director', 'accountant', 'dept_manager')
        OR department = 'Finance & Accounting'
        OR 'manage_finance' = ANY(permissions)
        OR 'manage_budgets' = ANY(permissions)
        OR 'view_analytics' = ANY(permissions)
      )
    )
  );

-- Finance department can manage budget forecasts
CREATE POLICY "Finance can manage budget forecasts" ON public.budget_forecasts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND (
        role IN ('super_admin', 'finance_director', 'accountant')
        OR department = 'Finance & Accounting'
        OR 'manage_finance' = ANY(permissions)
        OR 'manage_budgets' = ANY(permissions)
      )
    )
  );

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE public.vendors IS 'Vendor/Supplier master data for accounts payable';
COMMENT ON TABLE public.accounts_payable IS 'Invoices received from vendors that need to be paid';
COMMENT ON TABLE public.accounts_receivable IS 'Invoices sent to customers for payment';
COMMENT ON TABLE public.financial_statements IS 'Financial statements (P&L, Balance Sheet, Cash Flow)';
COMMENT ON TABLE public.financial_transactions IS 'General ledger transactions for accounting';
COMMENT ON TABLE public.cash_flow IS 'Daily cash flow tracking';
COMMENT ON TABLE public.budget_forecasts IS 'Budget forecasts and projections';

