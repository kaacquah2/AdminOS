-- ============================================
-- PROCUREMENT / PURCHASING DEPARTMENT TABLES
-- ============================================
-- This migration creates comprehensive tables for procurement operations
-- including vendors, procurement requests, contracts, and vendor performance tracking
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- VENDORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(50),
  country VARCHAR(100) DEFAULT 'USA',
  tax_id VARCHAR(100),
  website VARCHAR(255),
  vendor_type VARCHAR(100), -- supplier, service_provider, contractor, consultant
  category VARCHAR(100), -- office_supplies, it_equipment, facilities, services, raw_materials
  payment_terms VARCHAR(100), -- net_30, net_60, prepaid, etc.
  credit_limit DECIMAL(15,2),
  status VARCHAR(50) NOT NULL DEFAULT 'Active', -- Active, Inactive, Suspended, Pending
  rating DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 5.00
  total_orders INTEGER DEFAULT 0,
  total_spend DECIMAL(15,2) DEFAULT 0,
  on_time_delivery_rate DECIMAL(5,2) DEFAULT 0.00, -- percentage
  quality_rating DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 5.00
  notes TEXT,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROCUREMENT REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.procurement_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requested_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  requested_by_name VARCHAR(255),
  department VARCHAR(100) NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name VARCHAR(255),
  category VARCHAR(100), -- office_supplies, it_equipment, facilities, services, raw_materials
  priority VARCHAR(50) NOT NULL DEFAULT 'medium', -- critical, high, medium, low
  urgency VARCHAR(50) DEFAULT 'normal', -- urgent, normal, low
  estimated_cost DECIMAL(15,2),
  budget_allocated DECIMAL(15,2),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_review, vendor_selection, po_created, approved, rejected, cancelled
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  vendor_name VARCHAR(255),
  workflow_task_id UUID REFERENCES public.workflow_tasks(id) ON DELETE SET NULL,
  approval_workflow_id UUID REFERENCES public.approval_workflows(id) ON DELETE SET NULL,
  required_by_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENHANCE PROCUREMENT_ORDERS TABLE
-- ============================================
-- Add additional columns to existing procurement_orders table
ALTER TABLE public.procurement_orders
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS procurement_request_id UUID REFERENCES public.procurement_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS approval_workflow_id UUID REFERENCES public.approval_workflows(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS received_date DATE,
  ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue
  ADD COLUMN IF NOT EXISTS payment_date DATE,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update status enum to include more states
-- Note: This is informational - actual status values are text
-- Status values: Draft, Pending, Submitted, Approved, Rejected, Ordered, In_Transit, Delivered, Received, Closed, Cancelled

-- ============================================
-- PROCUREMENT ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.procurement_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.procurement_orders(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit VARCHAR(50), -- each, box, case, kg, etc.
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  category VARCHAR(100),
  received_quantity INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, ordered, received, partial, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VENDOR PERFORMANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vendor_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.procurement_orders(id) ON DELETE SET NULL,
  performance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  on_time_delivery BOOLEAN,
  delivery_date_promised DATE,
  delivery_date_actual DATE,
  delivery_days_variance INTEGER,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5), -- 1-5 scale
  cost_rating INTEGER CHECK (cost_rating >= 1 AND cost_rating <= 5), -- 1-5 scale
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5), -- 1-5 scale
  overall_score DECIMAL(3,2), -- Calculated average
  issues TEXT[], -- Array of issues encountered
  notes TEXT,
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VENDOR CONTRACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vendor_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_number VARCHAR(50) UNIQUE NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  vendor_name VARCHAR(255) NOT NULL,
  contract_type VARCHAR(100), -- purchase_agreement, service_contract, master_agreement, framework
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_date DATE,
  auto_renew BOOLEAN DEFAULT false,
  total_value DECIMAL(15,2),
  status VARCHAR(50) NOT NULL DEFAULT 'Active', -- Active, Expired, Terminated, Pending_Renewal
  payment_terms VARCHAR(100),
  key_terms TEXT,
  contract_document_url TEXT,
  responsible_person_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  responsible_person_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENHANCE INVENTORY_ITEMS TABLE
-- ============================================
-- Add additional columns for better inventory management
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS total_value DECIMAL(12,2) GENERATED ALWAYS AS (stock * COALESCE(unit_price, 0)) STORED,
  ADD COLUMN IF NOT EXISTS last_order_date DATE,
  ADD COLUMN IF NOT EXISTS last_received_date DATE,
  ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 7,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active', -- Active, Discontinued, Obsolete
  ADD COLUMN IF NOT EXISTS location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON public.vendors(category);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_status ON public.procurement_requests(status);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_project ON public.procurement_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_procurement_orders_status ON public.procurement_orders(status);
CREATE INDEX IF NOT EXISTS idx_procurement_orders_vendor ON public.procurement_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_procurement_orders_project ON public.procurement_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_procurement_order_items_order ON public.procurement_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_vendor_performance_vendor ON public.vendor_performance(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_vendor ON public.vendor_contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_status ON public.vendor_contracts(status);
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_end_date ON public.vendor_contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_vendor ON public.inventory_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_stock ON public.inventory_items(stock, reorder_level);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_contracts ENABLE ROW LEVEL SECURITY;

-- Vendors: Procurement department can view all, others can view active only
CREATE POLICY "Procurement can view all vendors" ON public.vendors
  FOR SELECT USING (
    public.is_in_department('Procurement') OR
    public.has_role('procurement_officer') OR
    public.has_role('super_admin')
  );

CREATE POLICY "Others can view active vendors" ON public.vendors
  FOR SELECT USING (status = 'Active');

CREATE POLICY "Procurement can manage vendors" ON public.vendors
  FOR ALL USING (
    public.is_in_department('Procurement') OR
    public.has_role('procurement_officer') OR
    public.has_role('super_admin')
  );

-- Procurement Requests: Requesters can view their own, procurement can view all
CREATE POLICY "Users can view own requests" ON public.procurement_requests
  FOR SELECT USING (requested_by = auth.uid());

CREATE POLICY "Procurement can view all requests" ON public.procurement_requests
  FOR SELECT USING (
    public.is_in_department('Procurement') OR
    public.has_role('procurement_officer') OR
    public.has_role('super_admin')
  );

CREATE POLICY "Users can create requests" ON public.procurement_requests
  FOR INSERT WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Procurement can manage requests" ON public.procurement_requests
  FOR ALL USING (
    public.is_in_department('Procurement') OR
    public.has_role('procurement_officer') OR
    public.has_role('super_admin')
  );

-- Procurement Order Items: Same as orders
CREATE POLICY "Procurement can manage order items" ON public.procurement_order_items
  FOR ALL USING (
    public.is_in_department('Procurement') OR
    public.has_role('procurement_officer') OR
    public.has_role('super_admin')
  );

CREATE POLICY "Users can view order items" ON public.procurement_order_items
  FOR SELECT USING (true); -- Read access for all authenticated users

-- Vendor Performance: Procurement can manage, others can view
CREATE POLICY "Procurement can manage vendor performance" ON public.vendor_performance
  FOR ALL USING (
    public.is_in_department('Procurement') OR
    public.has_role('procurement_officer') OR
    public.has_role('super_admin')
  );

CREATE POLICY "Users can view vendor performance" ON public.vendor_performance
  FOR SELECT USING (true);

-- Vendor Contracts: Procurement can manage, others can view active
CREATE POLICY "Procurement can manage contracts" ON public.vendor_contracts
  FOR ALL USING (
    public.is_in_department('Procurement') OR
    public.has_role('procurement_officer') OR
    public.has_role('super_admin')
  );

CREATE POLICY "Users can view active contracts" ON public.vendor_contracts
  FOR SELECT USING (status = 'Active' OR status = 'Pending_Renewal');

-- ============================================
-- FUNCTIONS FOR AUTOMATED UPDATES
-- ============================================

-- Function to update vendor statistics
CREATE OR REPLACE FUNCTION public.update_vendor_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.vendors
    SET
      total_orders = (
        SELECT COUNT(*) FROM public.procurement_orders
        WHERE vendor_id = NEW.vendor_id OR vendor = vendors.name
      ),
      total_spend = (
        SELECT COALESCE(SUM(value), 0) FROM public.procurement_orders
        WHERE vendor_id = NEW.vendor_id OR vendor = vendors.name
      ),
      on_time_delivery_rate = (
        SELECT 
          CASE 
            WHEN COUNT(*) > 0 THEN
              (COUNT(*) FILTER (WHERE on_time_delivery = true)::DECIMAL / COUNT(*)::DECIMAL) * 100
            ELSE 0
          END
        FROM public.vendor_performance
        WHERE vendor_id = NEW.vendor_id
      ),
      quality_rating = (
        SELECT COALESCE(AVG(quality_rating), 0)
        FROM public.vendor_performance
        WHERE vendor_id = NEW.vendor_id
      ),
      rating = (
        SELECT COALESCE(AVG(overall_score), 0)
        FROM public.vendor_performance
        WHERE vendor_id = NEW.vendor_id
      ),
      updated_at = NOW()
    WHERE id = NEW.vendor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vendor stats when orders change
CREATE TRIGGER trigger_update_vendor_stats_on_order
  AFTER INSERT OR UPDATE ON public.procurement_orders
  FOR EACH ROW
  WHEN (NEW.vendor_id IS NOT NULL)
  EXECUTE FUNCTION public.update_vendor_stats();

-- Trigger to update vendor stats when performance changes
CREATE TRIGGER trigger_update_vendor_stats_on_performance
  AFTER INSERT OR UPDATE ON public.vendor_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendor_stats();

-- Function to calculate order item total
CREATE OR REPLACE FUNCTION public.calculate_order_item_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_price = NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate order item total
CREATE TRIGGER trigger_calculate_order_item_total
  BEFORE INSERT OR UPDATE ON public.procurement_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_order_item_total();

-- Function to update PO value from items
CREATE OR REPLACE FUNCTION public.update_po_value_from_items()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.procurement_orders
  SET
    value = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM public.procurement_order_items
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ),
    items_count = (
      SELECT COUNT(*)
      FROM public.procurement_order_items
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update PO value when items change
CREATE TRIGGER trigger_update_po_value_from_items
  AFTER INSERT OR UPDATE OR DELETE ON public.procurement_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_po_value_from_items();

-- Function to update inventory when items are received
CREATE OR REPLACE FUNCTION public.update_inventory_on_receipt()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'received' AND OLD.status != 'received' AND NEW.inventory_item_id IS NOT NULL THEN
    UPDATE public.inventory_items
    SET
      stock = stock + NEW.received_quantity,
      last_received_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE id = NEW.inventory_item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update inventory on receipt
CREATE TRIGGER trigger_update_inventory_on_receipt
  AFTER UPDATE ON public.procurement_order_items
  FOR EACH ROW
  WHEN (NEW.status = 'received' AND OLD.status != 'received')
  EXECUTE FUNCTION public.update_inventory_on_receipt();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE public.vendors IS 'Vendor master data with performance metrics';
COMMENT ON TABLE public.procurement_requests IS 'Procurement requests from departments';
COMMENT ON TABLE public.procurement_order_items IS 'Line items for purchase orders';
COMMENT ON TABLE public.vendor_performance IS 'Vendor performance tracking per order';
COMMENT ON TABLE public.vendor_contracts IS 'Vendor contracts and agreements';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Procurement tables migration completed successfully!';
  RAISE NOTICE 'Created tables: vendors, procurement_requests, procurement_order_items, vendor_performance, vendor_contracts';
  RAISE NOTICE 'Enhanced tables: procurement_orders, inventory_items';
END $$;

