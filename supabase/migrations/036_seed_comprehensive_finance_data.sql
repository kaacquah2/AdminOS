-- ============================================
-- COMPREHENSIVE FINANCE & ACCOUNTING SEED DATA
-- ============================================
-- This script seeds realistic finance data for a complete finance portal
-- Based on real-world finance management scenarios

-- ============================================
-- 1. VENDORS/SUPPLIERS
-- ============================================
-- Note: Using existing vendors table schema from procurement migration
-- Insert vendors only if they don't already exist (check by name)
-- Note: last_purchase_date is optional and will be added by migration 035 if needed
INSERT INTO public.vendors (
  vendor_code, name, contact_person, email, phone, address, 
  city, state_province, postal_code, country, tax_id, 
  vendor_type, payment_terms, rating, total_spend, status
)
SELECT * FROM (VALUES
  ('VND-FIN-001', 'TechSupply Co.', 'John Martinez', 'john.martinez@techsupply.com', '+1-555-0101', '123 Tech Street', 'San Francisco', 'CA', '94105', 'USA', 'TAX-123456', 'supplier', 'Net 30', 4.5, 125000.00, 'Active'),
  ('VND-FIN-002', 'Office Solutions Inc.', 'Sarah Thompson', 'sarah.t@officesolutions.com', '+1-555-0102', '456 Office Blvd', 'New York', 'NY', '10001', 'USA', 'TAX-234567', 'supplier', 'Net 15', 4.8, 85000.00, 'Active'),
  ('VND-FIN-003', 'Cloud Services Pro', 'Michael Chen', 'mchen@cloudservices.com', '+1-555-0103', '789 Cloud Avenue', 'Seattle', 'WA', '98101', 'USA', 'TAX-345678', 'service_provider', 'Net 30', 4.7, 250000.00, 'Active'),
  ('VND-FIN-004', 'Marketing Agency Global', 'Emily Rodriguez', 'emily@marketingglobal.com', '+1-555-0104', '321 Marketing Way', 'Los Angeles', 'CA', '90001', 'USA', 'TAX-456789', 'service_provider', 'Net 30', 4.6, 180000.00, 'Active'),
  ('VND-FIN-005', 'Legal Advisors LLC', 'David Kim', 'david.kim@legaladvisors.com', '+1-555-0105', '654 Legal Plaza', 'Chicago', 'IL', '60601', 'USA', 'TAX-567890', 'service_provider', 'Net 30', 4.9, 95000.00, 'Active'),
  ('VND-FIN-006', 'Utilities Plus', 'Jennifer White', 'jwhite@utilitiesplus.com', '+1-555-0106', '987 Utility Road', 'Houston', 'TX', '77001', 'USA', 'TAX-678901', 'service_provider', 'Due on Receipt', 4.4, 45000.00, 'Active'),
  ('VND-FIN-007', 'Facilities Management Corp', 'Robert Brown', 'rbrown@facilitiesmgmt.com', '+1-555-0107', '147 Facilities Drive', 'Phoenix', 'AZ', '85001', 'USA', 'TAX-789012', 'service_provider', 'Net 30', 4.5, 120000.00, 'Active'),
  ('VND-FIN-008', 'IT Solutions Group', 'Lisa Anderson', 'lisa@itsolutions.com', '+1-555-0108', '258 IT Boulevard', 'Boston', 'MA', '02101', 'USA', 'TAX-890123', 'service_provider', 'Net 15', 4.8, 200000.00, 'Active')
) AS v(vendor_code, name, contact_person, email, phone, address, city, state_province, postal_code, country, tax_id, vendor_type, payment_terms, rating, total_spend, status)
WHERE NOT EXISTS (
  SELECT 1 FROM public.vendors WHERE vendors.name = v.name
)
ON CONFLICT (vendor_code) DO NOTHING;

-- Update last_purchase_date if the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vendors' 
    AND column_name = 'last_purchase_date'
  ) THEN
    UPDATE public.vendors
    SET last_purchase_date = CASE name
      WHEN 'TechSupply Co.' THEN '2024-11-15'::DATE
      WHEN 'Office Solutions Inc.' THEN '2024-11-20'::DATE
      WHEN 'Cloud Services Pro' THEN '2024-11-18'::DATE
      WHEN 'Marketing Agency Global' THEN '2024-11-22'::DATE
      WHEN 'Legal Advisors LLC' THEN '2024-11-10'::DATE
      WHEN 'Utilities Plus' THEN '2024-11-25'::DATE
      WHEN 'Facilities Management Corp' THEN '2024-11-12'::DATE
      WHEN 'IT Solutions Group' THEN '2024-11-19'::DATE
    END
    WHERE name IN ('TechSupply Co.', 'Office Solutions Inc.', 'Cloud Services Pro', 
                   'Marketing Agency Global', 'Legal Advisors LLC', 'Utilities Plus',
                   'Facilities Management Corp', 'IT Solutions Group')
      AND last_purchase_date IS NULL;
  END IF;
END $$;

-- ============================================
-- 2. ACCOUNTS PAYABLE (Vendor Invoices)
-- ============================================
INSERT INTO public.accounts_payable (
  invoice_number, vendor_id, vendor_name, invoice_date, due_date, amount, tax_amount, total_amount,
  status, payment_status, category, description, department, approval_status
)
SELECT 
  'INV-' || LPAD(ROW_NUMBER() OVER (ORDER BY v.id)::TEXT, 6, '0'),
  v.id,
  v.name,
  (CURRENT_DATE - INTERVAL '1 day' * (ROW_NUMBER() OVER () % 60))::DATE,
  (CURRENT_DATE - INTERVAL '1 day' * (ROW_NUMBER() OVER () % 60) + INTERVAL '30 days')::DATE,
  ap_data.amount,
  ROUND(ap_data.amount * 0.08, 2) as tax_amount,
  ROUND(ap_data.amount * 1.08, 2) as total_amount,
  ap_data.status,
  CASE WHEN ap_data.status = 'Paid' THEN 'Paid' ELSE 'Unpaid' END,
  ap_data.category,
  ap_data.description,
  ap_data.department,
  CASE WHEN ap_data.status = 'Paid' THEN 'Approved' ELSE 'Pending' END
FROM public.vendors v
CROSS JOIN (VALUES
  (8500.00, 'Pending', 'Services', 'Monthly cloud hosting services', 'Information Technology'),
  (3200.00, 'Approved', 'Supplies', 'Office supplies Q4 2024', 'Administration'),
  (15000.00, 'Pending', 'Services', 'Marketing campaign services', 'Marketing & Communications'),
  (4500.00, 'Paid', 'Services', 'Legal consultation services', 'Legal & Compliance'),
  (2800.00, 'Pending', 'Utilities', 'Electricity and water bill', 'Facilities & Maintenance'),
  (12000.00, 'Approved', 'Services', 'IT infrastructure maintenance', 'Information Technology'),
  (6500.00, 'Pending', 'Services', 'Facilities cleaning services', 'Facilities & Maintenance'),
  (9500.00, 'Approved', 'Services', 'Software licensing renewal', 'Information Technology'),
  (4200.00, 'Pending', 'Supplies', 'Marketing materials and printing', 'Marketing & Communications'),
  (7800.00, 'Approved', 'Services', 'HR consulting services', 'Human Resources'),
  (5500.00, 'Pending', 'Services', 'Accounting and bookkeeping', 'Finance & Accounting'),
  (3200.00, 'Overdue', 'Services', 'Telecommunications services', 'Information Technology'),
  (8900.00, 'Pending', 'Services', 'Security services', 'Security & Access Control'),
  (2100.00, 'Approved', 'Supplies', 'Office furniture', 'Administration'),
  (12500.00, 'Pending', 'Services', 'Training and development programs', 'Training & Development')
) AS ap_data(amount, status, category, description, department)
WHERE v.id IN (SELECT id FROM public.vendors ORDER BY id LIMIT 8)
ON CONFLICT (invoice_number) DO NOTHING;

-- Update some invoices to be overdue
UPDATE public.accounts_payable
SET status = 'Overdue', payment_status = 'Unpaid'
WHERE due_date < CURRENT_DATE 
  AND status = 'Pending'
  AND RANDOM() < 0.3;

-- ============================================
-- 3. ACCOUNTS RECEIVABLE (Customer Invoices)
-- ============================================
INSERT INTO public.accounts_receivable (
  invoice_number, customer_name, customer_email, invoice_date, due_date, amount, tax_amount, total_amount,
  status, payment_status, description, department
)
VALUES
  ('CUST-INV-2024-001', 'Acme Corporation', 'billing@acmecorp.com', '2024-10-15', '2024-11-14', 45000.00, 3600.00, 48600.00, 'Paid', 'Paid', 'Q4 2024 Software License', 'Information Technology'),
  ('CUST-INV-2024-002', 'Global Industries Ltd', 'accounts@globalind.com', '2024-10-20', '2024-11-19', 32000.00, 2560.00, 34560.00, 'Paid', 'Paid', 'Consulting Services', 'Project Management'),
  ('CUST-INV-2024-003', 'TechStart Inc', 'finance@techstart.com', '2024-11-01', '2024-12-01', 28000.00, 2240.00, 30240.00, 'Sent', 'Unpaid', 'Development Services', 'Information Technology'),
  ('CUST-INV-2024-004', 'Enterprise Solutions', 'billing@enterprise.com', '2024-11-05', '2024-12-05', 55000.00, 4400.00, 59400.00, 'Sent', 'Unpaid', 'Annual Support Contract', 'Information Technology'),
  ('CUST-INV-2024-005', 'Innovation Partners', 'ap@innovation.com', '2024-11-10', '2024-12-10', 18000.00, 1440.00, 19440.00, 'Sent', 'Unpaid', 'Marketing Services', 'Marketing & Communications'),
  ('CUST-INV-2024-006', 'Digital Ventures', 'accounts@digitalventures.com', '2024-11-15', '2024-12-15', 42000.00, 3360.00, 45360.00, 'Sent', 'Unpaid', 'Custom Development Project', 'Information Technology'),
  ('CUST-INV-2024-007', 'Strategic Consulting Group', 'billing@strategic.com', '2024-10-25', '2024-11-24', 25000.00, 2000.00, 27000.00, 'Overdue', 'Unpaid', 'Strategic Planning Services', 'Project Management'),
  ('CUST-INV-2024-008', 'Premier Services Co', 'finance@premier.com', '2024-11-18', '2024-12-18', 35000.00, 2800.00, 37800.00, 'Sent', 'Unpaid', 'Implementation Services', 'Information Technology')
ON CONFLICT (invoice_number) DO NOTHING;

-- ============================================
-- 4. ENHANCED EXPENSES (with project links)
-- ============================================
-- Get some projects to link expenses to
DO $$
DECLARE
  project_rec RECORD;
  employee_rec RECORD;
  expense_categories TEXT[] := ARRAY['Travel', 'Meals', 'Software', 'Equipment', 'Supplies', 'Services', 'Training', 'Utilities'];
  expense_statuses TEXT[] := ARRAY['Pending', 'Approved', 'Rejected'];
  i INTEGER;
BEGIN
  -- Get Finance department employees
  FOR employee_rec IN 
    SELECT e.id, e.name 
    FROM public.employees e
    JOIN public.user_profiles up ON e.user_id = up.id
    WHERE up.department = 'Finance & Accounting'
    LIMIT 5
  LOOP
    -- Create 3-5 expenses per employee
    FOR i IN 1..(3 + FLOOR(RANDOM() * 3)::INTEGER) LOOP
      INSERT INTO public.expenses (
        employee_id, employee_name, amount, category, date, status, description, project_id, project_name
      )
      SELECT 
        employee_rec.id,
        employee_rec.name,
        (50 + RANDOM() * 2000)::DECIMAL(10,2),
        expense_categories[1 + FLOOR(RANDOM() * array_length(expense_categories, 1))::INTEGER],
        (CURRENT_DATE - INTERVAL '1 day' * FLOOR(RANDOM() * 90)::INTEGER)::DATE,
        expense_statuses[1 + FLOOR(RANDOM() * array_length(expense_statuses, 1))::INTEGER],
        'Expense: ' || expense_categories[1 + FLOOR(RANDOM() * array_length(expense_categories, 1))::INTEGER] || ' - ' || 
        CASE FLOOR(RANDOM() * 5)::INTEGER
          WHEN 0 THEN 'Client meeting'
          WHEN 1 THEN 'Team training'
          WHEN 2 THEN 'Software subscription'
          WHEN 3 THEN 'Office supplies'
          ELSE 'Business travel'
        END,
        p.id,
        p.name
      FROM (
        SELECT id, name 
        FROM public.projects 
        WHERE status IN ('Active', 'Planning')
        ORDER BY RANDOM() 
        LIMIT 1
      ) p
      WHERE NOT EXISTS (
        SELECT 1 FROM public.expenses e2
        WHERE e2.employee_id = employee_rec.id
          AND e2.description = 'Expense: ' || expense_categories[1 + FLOOR(RANDOM() * array_length(expense_categories, 1))::INTEGER]
      )
      LIMIT 1;
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- 5. FINANCIAL TRANSACTIONS (General Ledger)
-- ============================================
INSERT INTO public.financial_transactions (
  transaction_number, transaction_date, transaction_type, account_type, account_name,
  amount, debit_amount, credit_amount, description, reference_type, department
)
SELECT 
  'TXN-' || TO_CHAR(CURRENT_DATE - INTERVAL '1 day' * (ROW_NUMBER() OVER () % 90), 'YYYYMMDD') || '-' || LPAD(ROW_NUMBER() OVER ()::TEXT, 4, '0'),
  (CURRENT_DATE - INTERVAL '1 day' * (ROW_NUMBER() OVER () % 90))::DATE,
  txn_data.transaction_type,
  txn_data.account_type,
  txn_data.account_name,
  txn_data.amount,
  CASE WHEN txn_data.transaction_type IN ('Expense', 'Payment') THEN txn_data.amount ELSE 0 END,
  CASE WHEN txn_data.transaction_type IN ('Revenue', 'Receipt') THEN txn_data.amount ELSE 0 END,
  txn_data.description,
  txn_data.reference_type,
  txn_data.department
FROM (VALUES
  ('Revenue', 'Revenue', 'Sales Revenue', 125000.00, 'Monthly sales revenue', 'Invoice', 'Sales'),
  ('Expense', 'Expense', 'Operating Expenses', 45000.00, 'General operating expenses', 'Expense', 'Operations'),
  ('Revenue', 'Revenue', 'Service Revenue', 85000.00, 'IT service revenue', 'Invoice', 'Information Technology'),
  ('Expense', 'Expense', 'Salaries and Wages', 95000.00, 'Monthly payroll', 'Payroll', 'Human Resources'),
  ('Revenue', 'Revenue', 'Consulting Revenue', 65000.00, 'Consulting services revenue', 'Invoice', 'Project Management'),
  ('Expense', 'Expense', 'Utilities', 12000.00, 'Monthly utilities bill', 'Invoice', 'Facilities & Maintenance'),
  ('Payment', 'Liability', 'Accounts Payable', 35000.00, 'Vendor payment', 'Payment', 'Finance & Accounting'),
  ('Receipt', 'Asset', 'Accounts Receivable', 125000.00, 'Customer payment received', 'Payment', 'Finance & Accounting'),
  ('Expense', 'Expense', 'Marketing Expenses', 28000.00, 'Marketing campaign costs', 'Expense', 'Marketing & Communications'),
  ('Revenue', 'Revenue', 'License Revenue', 150000.00, 'Software license sales', 'Invoice', 'Information Technology'),
  ('Expense', 'Expense', 'Rent', 25000.00, 'Office rent payment', 'Invoice', 'Administration'),
  ('Payment', 'Liability', 'Accounts Payable', 42000.00, 'Vendor invoice payment', 'Payment', 'Finance & Accounting'),
  ('Receipt', 'Asset', 'Accounts Receivable', 85000.00, 'Customer payment', 'Payment', 'Finance & Accounting'),
  ('Expense', 'Expense', 'Software Subscriptions', 18000.00, 'Monthly software subscriptions', 'Expense', 'Information Technology'),
  ('Revenue', 'Revenue', 'Support Revenue', 75000.00, 'Support services revenue', 'Invoice', 'Information Technology')
) AS txn_data(transaction_type, account_type, account_name, amount, description, reference_type, department)
ON CONFLICT (transaction_number) DO NOTHING;

-- ============================================
-- 6. CASH FLOW DATA (Last 90 days)
-- ============================================
WITH cash_flow_data AS (
  SELECT 
    date_series.date,
    (5000 + RANDOM() * 50000)::DECIMAL(15,2) as cash_inflow,
    (3000 + RANDOM() * 40000)::DECIMAL(15,2) as cash_outflow,
    CASE FLOOR(RANDOM() * 4)::INTEGER
      WHEN 0 THEN 'Sales'
      WHEN 1 THEN 'Investments'
      WHEN 2 THEN 'Loans'
      ELSE 'Other Income'
    END as inflow_category,
    CASE FLOOR(RANDOM() * 4)::INTEGER
      WHEN 0 THEN 'Expenses'
      WHEN 1 THEN 'Purchases'
      WHEN 2 THEN 'Loan Payments'
      ELSE 'Other Payments'
    END as outflow_category
  FROM generate_series(
    CURRENT_DATE - INTERVAL '90 days',
    CURRENT_DATE,
    '1 day'::INTERVAL
  ) AS date_series(date)
),
cash_flow_with_balance AS (
  SELECT 
    date,
    cash_inflow,
    cash_outflow,
    inflow_category,
    outflow_category,
    500000.00 + SUM(cash_inflow - cash_outflow) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as closing_balance
  FROM cash_flow_data
)
INSERT INTO public.cash_flow (
  date, opening_balance, cash_inflow, cash_outflow, closing_balance, inflow_category, outflow_category, description
)
SELECT 
  date,
  COALESCE(LAG(closing_balance) OVER (ORDER BY date), 500000.00) as opening_balance,
  cash_inflow,
  cash_outflow,
  closing_balance,
  inflow_category,
  outflow_category,
  'Daily cash flow transaction'
FROM cash_flow_with_balance
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. FINANCIAL STATEMENTS (Monthly P&L)
-- ============================================
INSERT INTO public.financial_statements (
  statement_type, period_type, period_start, period_end, year, month,
  revenue, cost_of_goods_sold, gross_profit, operating_expenses, operating_income,
  other_income, other_expenses, net_income, status
)
SELECT 
  'income_statement',
  'monthly',
  date_trunc('month', month_date)::DATE,
  (date_trunc('month', month_date) + INTERVAL '1 month' - INTERVAL '1 day')::DATE,
  EXTRACT(YEAR FROM month_date)::INTEGER,
  EXTRACT(MONTH FROM month_date)::INTEGER,
  (200000 + RANDOM() * 100000)::DECIMAL(15,2) as revenue,
  (80000 + RANDOM() * 40000)::DECIMAL(15,2) as cost_of_goods_sold,
  (120000 + RANDOM() * 60000)::DECIMAL(15,2) as gross_profit,
  (60000 + RANDOM() * 30000)::DECIMAL(15,2) as operating_expenses,
  (60000 + RANDOM() * 30000)::DECIMAL(15,2) as operating_income,
  (5000 + RANDOM() * 10000)::DECIMAL(15,2) as other_income,
  (3000 + RANDOM() * 5000)::DECIMAL(15,2) as other_expenses,
  (62000 + RANDOM() * 35000)::DECIMAL(15,2) as net_income,
  CASE WHEN month_date < CURRENT_DATE - INTERVAL '1 month' THEN 'Final' ELSE 'Draft' END
FROM generate_series(
  CURRENT_DATE - INTERVAL '6 months',
  CURRENT_DATE,
  '1 month'::INTERVAL
) AS month_date
ON CONFLICT (statement_type, period_type, period_start, period_end) DO NOTHING;

-- ============================================
-- 8. BUDGET FORECASTS
-- ============================================
INSERT INTO public.budget_forecasts (
  department, category, forecast_type, period_start, period_end, forecasted_amount, actual_amount,
  variance, variance_percentage, confidence_level, assumptions
)
VALUES
  ('Information Technology', 'Expense', 'Monthly', '2024-12-01', '2024-12-31', 125000.00, 0, 0, 0, 'High', 'Based on historical spending patterns'),
  ('Marketing & Communications', 'Expense', 'Monthly', '2024-12-01', '2024-12-31', 45000.00, 0, 0, 0, 'Medium', 'Q4 campaign activities'),
  ('Sales', 'Revenue', 'Monthly', '2024-12-01', '2024-12-31', 350000.00, 0, 0, 0, 'High', 'Year-end sales push'),
  ('Operations', 'Expense', 'Monthly', '2024-12-01', '2024-12-31', 85000.00, 0, 0, 0, 'High', 'Standard operational costs'),
  ('Human Resources', 'Expense', 'Monthly', '2024-12-01', '2024-12-31', 95000.00, 0, 0, 0, 'High', 'Payroll and benefits'),
  ('Finance & Accounting', 'Expense', 'Monthly', '2024-12-01', '2024-12-31', 55000.00, 0, 0, 0, 'High', 'Accounting services and software'),
  ('Information Technology', 'Revenue', 'Quarterly', '2025-01-01', '2025-03-31', 1200000.00, 0, 0, 0, 'Medium', 'Q1 2025 revenue projection'),
  ('Sales', 'Revenue', 'Quarterly', '2025-01-01', '2025-03-31', 1500000.00, 0, 0, 0, 'Medium', 'Q1 2025 sales forecast')
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. UPDATE DEPARTMENT BUDGETS (Add Finance & Accounting)
-- ============================================
INSERT INTO public.department_budgets (department, allocated, spent, period)
VALUES 
  ('Finance & Accounting', 125000.00, 98500.00, '2024'),
  ('Human Resources', 180000.00, 172000.00, '2024'),
  ('Legal & Compliance', 95000.00, 87500.00, '2024'),
  ('Security & Access Control', 75000.00, 68200.00, '2024'),
  ('Research & Development', 350000.00, 328500.00, '2024'),
  ('Employee Wellness & Engagement', 45000.00, 41200.00, '2024'),
  ('CSR / Sustainability', 65000.00, 58900.00, '2024'),
  ('Training & Development', 85000.00, 78200.00, '2024'),
  ('Customer Support', 95000.00, 89100.00, '2024'),
  ('Project Management', 200000.00, 187500.00, '2024')
ON CONFLICT (department) DO UPDATE SET
  allocated = EXCLUDED.allocated,
  spent = EXCLUDED.spent;

-- ============================================
-- SUMMARY
-- ============================================
DO $$
DECLARE
  v_vendors INTEGER;
  v_ap INTEGER;
  v_ar INTEGER;
  v_transactions INTEGER;
  v_cash_flow INTEGER;
  v_statements INTEGER;
  v_forecasts INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_vendors FROM public.vendors;
  SELECT COUNT(*) INTO v_ap FROM public.accounts_payable;
  SELECT COUNT(*) INTO v_ar FROM public.accounts_receivable;
  SELECT COUNT(*) INTO v_transactions FROM public.financial_transactions;
  SELECT COUNT(*) INTO v_cash_flow FROM public.cash_flow;
  SELECT COUNT(*) INTO v_statements FROM public.financial_statements;
  SELECT COUNT(*) INTO v_forecasts FROM public.budget_forecasts;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Finance & Accounting Seed Data Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Vendors: %', v_vendors;
  RAISE NOTICE 'Accounts Payable: %', v_ap;
  RAISE NOTICE 'Accounts Receivable: %', v_ar;
  RAISE NOTICE 'Financial Transactions: %', v_transactions;
  RAISE NOTICE 'Cash Flow Records: %', v_cash_flow;
  RAISE NOTICE 'Financial Statements: %', v_statements;
  RAISE NOTICE 'Budget Forecasts: %', v_forecasts;
  RAISE NOTICE '========================================';
END $$;

