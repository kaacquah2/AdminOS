-- ============================================
-- FIX FUNCTION SEARCH_PATH FOR SECURITY
-- ============================================
-- This migration fixes all functions to set search_path explicitly
-- to prevent search path manipulation attacks (CWE-79)
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- ============================================
-- 1. FIX FUNCTIONS IN PUBLIC SCHEMA
-- ============================================

-- Fix update_employees_updated_at
CREATE OR REPLACE FUNCTION public.update_employees_updated_at()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix is_in_department
CREATE OR REPLACE FUNCTION public.is_in_department(dept TEXT)
RETURNS BOOLEAN
SET search_path = ''
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND department = dept
  );
END;
$$;

-- Fix get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
SET search_path = ''
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT role FROM public.user_profiles WHERE id = auth.uid());
END;
$$;

-- Fix has_role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
SET search_path = ''
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = required_role
  );
END;
$$;

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix has_permission
CREATE OR REPLACE FUNCTION public.has_permission(required_permission TEXT)
RETURNS BOOLEAN
SET search_path = ''
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND required_permission = ANY(permissions)
  );
END;
$$;

-- Fix update_support_requests_updated_at
CREATE OR REPLACE FUNCTION public.update_support_requests_updated_at()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix update_vendor_stats
CREATE OR REPLACE FUNCTION public.update_vendor_stats()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql AS $$
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
$$;

-- Fix calculate_order_item_total
CREATE OR REPLACE FUNCTION public.calculate_order_item_total()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  NEW.total_price = NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$;

-- Fix update_po_value_from_items
CREATE OR REPLACE FUNCTION public.update_po_value_from_items()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql AS $$
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
$$;

-- Fix update_inventory_on_receipt
CREATE OR REPLACE FUNCTION public.update_inventory_on_receipt()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql AS $$
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
$$;

-- Fix get_role_permissions
CREATE OR REPLACE FUNCTION public.get_role_permissions(role_name_param TEXT)
RETURNS TABLE(permission_key TEXT)
SET search_path = ''
LANGUAGE sql STABLE SECURITY DEFINER AS $$
WITH RECURSIVE role_hierarchy AS (
  -- Base case: start with the given role
  SELECT role_name_param AS role_name, 0 AS depth
  UNION ALL
  -- Recursive case: get parent roles
  SELECT r.inherits_from[i], rh.depth + 1
  FROM role_hierarchy rh
  JOIN public.roles r ON r.role_name = rh.role_name
  CROSS JOIN LATERAL generate_subscripts(r.inherits_from, 1) AS i
  WHERE rh.depth < 10 -- Prevent infinite recursion
)
SELECT DISTINCT rp.permission_key
FROM role_hierarchy rh
JOIN public.role_permissions rp ON rp.role_name = rh.role_name
ORDER BY rp.permission_key;
$$;

-- Fix role_has_permission
CREATE OR REPLACE FUNCTION public.role_has_permission(role_name_param TEXT, permission_key_param TEXT)
RETURNS BOOLEAN
SET search_path = ''
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.get_role_permissions(role_name_param)
    WHERE permission_key = permission_key_param
  );
END;
$$;

-- Fix update_support_request_activity
CREATE OR REPLACE FUNCTION public.update_support_request_activity()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix auto_assign_support_ticket
CREATE OR REPLACE FUNCTION public.auto_assign_support_ticket(ticket_id UUID)
RETURNS UUID
SET search_path = ''
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  assigned_agent_id UUID;
  ticket_priority TEXT;
BEGIN
  -- Get ticket priority
  SELECT priority INTO ticket_priority
  FROM public.support_requests
  WHERE id = ticket_id;
  
  -- Find available agent with least tickets
  SELECT stm.user_id INTO assigned_agent_id
  FROM public.support_team_members stm
  WHERE stm.availability_status = 'available'
    AND stm.current_ticket_count < stm.max_concurrent_tickets
  ORDER BY stm.current_ticket_count ASC, 
           CASE WHEN ticket_priority = 'High' THEN 
             CASE WHEN 'High' = ANY(stm.specialization_tags) THEN 0 ELSE 1 END
           ELSE 0 END
  LIMIT 1;
  
  -- Update ticket assignment
  IF assigned_agent_id IS NOT NULL THEN
    UPDATE public.support_requests
    SET assignee_id = assigned_agent_id,
        assignee_name = (SELECT full_name FROM public.user_profiles WHERE id = assigned_agent_id),
        status = 'In Progress',
        first_response_at = NOW()
    WHERE id = ticket_id;
    
    -- Update agent ticket count
    UPDATE public.support_team_members
    SET current_ticket_count = current_ticket_count + 1
    WHERE user_id = assigned_agent_id;
  END IF;
  
  RETURN assigned_agent_id;
END;
$$;

-- Fix get_sla_status
CREATE OR REPLACE FUNCTION public.get_sla_status(ticket_id UUID)
RETURNS TEXT
SET search_path = ''
LANGUAGE plpgsql AS $$
DECLARE
  ticket_record RECORD;
  hours_elapsed DECIMAL;
  sla_status TEXT;
BEGIN
  SELECT * INTO ticket_record
  FROM public.support_requests
  WHERE id = ticket_id;
  
  IF ticket_record.status IN ('Resolved', 'Closed') THEN
    RETURN 'met';
  END IF;
  
  -- Calculate hours since creation
  hours_elapsed := EXTRACT(EPOCH FROM (NOW() - ticket_record.created_at)) / 3600;
  
  -- Check if first response was made
  IF ticket_record.first_response_at IS NULL THEN
    -- Check first response SLA
    IF hours_elapsed > (ticket_record.sla_target_hours * 0.5) THEN
      sla_status := 'at_risk';
    ELSE
      sla_status := 'on_track';
    END IF;
  ELSE
    -- Check resolution SLA
    IF hours_elapsed > ticket_record.sla_target_hours THEN
      sla_status := 'breached';
    ELSIF hours_elapsed > (ticket_record.sla_target_hours * 0.8) THEN
      sla_status := 'at_risk';
    ELSE
      sla_status := 'on_track';
    END IF;
  END IF;
  
  RETURN sla_status;
END;
$$;

-- Fix update_hse_updated_at
CREATE OR REPLACE FUNCTION public.update_hse_updated_at()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix calculate_trir
CREATE OR REPLACE FUNCTION public.calculate_trir(start_date DATE, end_date DATE)
RETURNS DECIMAL
SET search_path = ''
LANGUAGE plpgsql AS $$
DECLARE
  recordable_incidents INTEGER;
  total_hours DECIMAL;
  trir_value DECIMAL;
BEGIN
  -- Count recordable incidents (excluding first aid and near misses)
  SELECT COUNT(*) INTO recordable_incidents
  FROM public.safety_incidents
  WHERE incident_date BETWEEN start_date AND end_date
    AND incident_type IN ('injury', 'property_damage', 'environmental')
    AND severity IN ('moderate', 'serious', 'critical', 'fatal');
  
  -- Estimate total hours (assuming 40 hours/week per employee, adjust as needed)
  -- This should ideally come from actual timesheet data
  SELECT COUNT(*) * 40 * 52 INTO total_hours
  FROM public.user_profiles
  WHERE created_at <= end_date;
  
  IF total_hours = 0 THEN
    RETURN 0;
  END IF;
  
  trir_value := (recordable_incidents::DECIMAL * 200000) / total_hours;
  RETURN ROUND(trir_value, 2);
END;
$$;

-- Fix calculate_ltifr
CREATE OR REPLACE FUNCTION public.calculate_ltifr(start_date DATE, end_date DATE)
RETURNS DECIMAL
SET search_path = ''
LANGUAGE plpgsql AS $$
DECLARE
  lost_time_incidents INTEGER;
  total_hours DECIMAL;
  ltifr_value DECIMAL;
BEGIN
  -- Count lost time incidents (serious, critical, fatal injuries)
  SELECT COUNT(*) INTO lost_time_incidents
  FROM public.safety_incidents
  WHERE incident_date BETWEEN start_date AND end_date
    AND incident_type = 'injury'
    AND severity IN ('serious', 'critical', 'fatal');
  
  SELECT COUNT(*) * 40 * 52 INTO total_hours
  FROM public.user_profiles
  WHERE created_at <= end_date;
  
  IF total_hours = 0 THEN
    RETURN 0;
  END IF;
  
  ltifr_value := (lost_time_incidents::DECIMAL * 1000000) / total_hours;
  RETURN ROUND(ltifr_value, 2);
END;
$$;

-- Fix create_user_with_profile
CREATE OR REPLACE FUNCTION public.create_user_with_profile(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_department TEXT,
  p_position TEXT,
  p_role TEXT,
  p_permissions TEXT[] DEFAULT '{}',
  p_accessible_modules TEXT[] DEFAULT '{}'
)
RETURNS UUID
SET search_path = ''
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Create auth user (requires service role)
  -- Note: In Supabase, this is typically done via Admin API
  -- For SQL execution, we'll generate UUID and let Admin API handle auth.users
  v_user_id := uuid_generate_v4();
  
  -- Insert user profile (will be linked when auth user is created)
  INSERT INTO public.user_profiles (
    id, email, full_name, department, position, role, permissions, accessible_modules, is_active
  ) VALUES (
    v_user_id, p_email, p_full_name, p_department, p_position, p_role, p_permissions, p_accessible_modules, true
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    department = EXCLUDED.department,
    position = EXCLUDED.position,
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    accessible_modules = EXCLUDED.accessible_modules,
    is_active = EXCLUDED.is_active;
  
  RETURN v_user_id;
END;
$$;

-- Fix generate_security_alert_from_log
CREATE OR REPLACE FUNCTION public.generate_security_alert_from_log()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  alert_number VARCHAR(50);
  alert_severity VARCHAR(50);
  alert_title VARCHAR(255);
  alert_description TEXT;
BEGIN
  -- Check for failed login attempts (3+ in 5 minutes)
  IF NEW.action_type = 'failed_login' AND NEW.status = 'failed' THEN
    -- Count failed logins in last 5 minutes from same IP
    IF (
      SELECT COUNT(*) 
      FROM public.access_logs 
      WHERE action_type = 'failed_login' 
        AND status = 'failed'
        AND ip_address = NEW.ip_address
        AND created_at > NOW() - INTERVAL '5 minutes'
    ) >= 3 THEN
      alert_number := 'SEC-ALERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
      alert_severity := 'high';
      alert_title := 'Multiple Failed Login Attempts';
      alert_description := 'Multiple failed login attempts detected from IP ' || NEW.ip_address || ' in the last 5 minutes.';
      
      INSERT INTO public.security_alerts (
        alert_number,
        alert_type,
        severity,
        status,
        title,
        description,
        affected_user_id,
        affected_user_name,
        source_ip,
        detected_at
      ) VALUES (
        alert_number,
        'failed_login',
        alert_severity,
        'active',
        alert_title,
        alert_description,
        NEW.user_id,
        NEW.user_name,
        NEW.ip_address,
        NOW()
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Check for unauthorized access attempts
  IF NEW.action_type = 'data_access' AND NEW.status = 'denied' THEN
    alert_number := 'SEC-ALERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    alert_severity := CASE 
      WHEN NEW.severity = 'critical' THEN 'critical'
      WHEN NEW.severity = 'high' THEN 'high'
      ELSE 'medium'
    END;
    alert_title := 'Unauthorized Access Attempt';
    alert_description := 'User ' || NEW.user_name || ' attempted to access ' || COALESCE(NEW.resource_name, NEW.resource_type) || ' without authorization.';
    
    INSERT INTO public.security_alerts (
      alert_number,
      alert_type,
      severity,
      status,
      title,
      description,
      affected_user_id,
      affected_user_name,
      source_ip,
      detected_at
    ) VALUES (
      alert_number,
      'unauthorized_access',
      alert_severity,
      'active',
      alert_title,
      alert_description,
      NEW.user_id,
      NEW.user_name,
      NEW.ip_address,
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check for suspicious activity (unusual access patterns)
  IF NEW.action_type = 'permission_change' OR NEW.action_type = 'role_assignment' THEN
    -- Check if user has made multiple permission/role changes in short time
    IF (
      SELECT COUNT(*) 
      FROM public.access_logs 
      WHERE user_id = NEW.user_id
        AND (action_type = 'permission_change' OR action_type = 'role_assignment')
        AND created_at > NOW() - INTERVAL '1 hour'
    ) >= 5 THEN
      alert_number := 'SEC-ALERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
      alert_severity := 'medium';
      alert_title := 'Suspicious Permission Activity';
      alert_description := 'User ' || NEW.user_name || ' has made multiple permission/role changes in the last hour.';
      
      INSERT INTO public.security_alerts (
        alert_number,
        alert_type,
        severity,
        status,
        title,
        description,
        affected_user_id,
        affected_user_name,
        source_ip,
        detected_at
      ) VALUES (
        alert_number,
        'suspicious_activity',
        alert_severity,
        'active',
        alert_title,
        alert_description,
        NEW.user_id,
        NEW.user_name,
        NEW.ip_address,
        NOW()
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix check_critical_access_patterns
CREATE OR REPLACE FUNCTION public.check_critical_access_patterns()
RETURNS void
SET search_path = ''
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  alert_number VARCHAR(50);
BEGIN
  -- Check for users accessing sensitive data outside business hours (9 AM - 5 PM)
  FOR alert_number IN
    SELECT DISTINCT 'SEC-ALERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
    FROM public.access_logs
    WHERE action_type = 'data_access'
      AND resource_type IN ('confidential', 'restricted')
      AND EXTRACT(HOUR FROM created_at) NOT BETWEEN 9 AND 17
      AND created_at > NOW() - INTERVAL '1 hour'
      AND NOT EXISTS (
        SELECT 1 FROM public.security_alerts 
        WHERE affected_user_id = access_logs.user_id 
          AND alert_type = 'suspicious_activity'
          AND detected_at > NOW() - INTERVAL '1 hour'
      )
  LOOP
    INSERT INTO public.security_alerts (
      alert_number,
      alert_type,
      severity,
      status,
      title,
      description,
      affected_user_id,
      affected_user_name,
      source_ip,
      detected_at
    )
    SELECT
      alert_number,
      'suspicious_activity',
      'medium',
      'active',
      'After-Hours Access to Sensitive Data',
      'User ' || user_name || ' accessed ' || resource_name || ' outside business hours.',
      user_id,
      user_name,
      ip_address,
      NOW()
    FROM public.access_logs
    WHERE action_type = 'data_access'
      AND resource_type IN ('confidential', 'restricted')
      AND EXTRACT(HOUR FROM created_at) NOT BETWEEN 9 AND 17
      AND created_at > NOW() - INTERVAL '1 hour'
    LIMIT 1
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- Fix calculate_employee_wellness_points
CREATE OR REPLACE FUNCTION public.calculate_employee_wellness_points(emp_id UUID)
RETURNS INTEGER
SET search_path = ''
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(points_earned) FROM public.wellness_points WHERE employee_id = emp_id),
    0
  );
END;
$$;

-- Fix update_program_participant_count
CREATE OR REPLACE FUNCTION public.update_program_participant_count()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.wellness_programs
    SET current_participants = current_participants + 1
    WHERE id = NEW.program_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.wellness_programs
    SET current_participants = GREATEST(current_participants - 1, 0)
    WHERE id = OLD.program_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Fix update_challenge_participant_count
CREATE OR REPLACE FUNCTION public.update_challenge_participant_count()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.wellness_challenges
    SET current_participants = current_participants + 1
    WHERE id = NEW.challenge_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.wellness_challenges
    SET current_participants = GREATEST(current_participants - 1, 0)
    WHERE id = OLD.challenge_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Fix update_event_attendee_count
CREATE OR REPLACE FUNCTION public.update_event_attendee_count()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.wellness_events
    SET current_attendees = current_attendees + 1
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.wellness_events
    SET current_attendees = GREATEST(current_attendees - 1, 0)
    WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Fix create_executive_profile_if_exists
CREATE OR REPLACE FUNCTION public.create_executive_profile_if_exists(
  p_email TEXT,
  p_full_name TEXT,
  p_department TEXT,
  p_position TEXT,
  p_role TEXT,
  p_permissions TEXT[],
  p_accessible_modules TEXT[]
)
RETURNS VOID
SET search_path = ''
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if auth user exists with this email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  -- If auth user exists, create or update profile
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_profiles (
      id, email, full_name, department, position, role, permissions, accessible_modules, is_active
    ) VALUES (
      v_user_id, p_email, p_full_name, p_department, p_position, p_role, p_permissions, p_accessible_modules, true
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      department = EXCLUDED.department,
      position = EXCLUDED.position,
      role = EXCLUDED.role,
      permissions = EXCLUDED.permissions,
      accessible_modules = EXCLUDED.accessible_modules,
      is_active = EXCLUDED.is_active;
  END IF;
END;
$$;

-- Fix create_legal_profile_if_exists
CREATE OR REPLACE FUNCTION public.create_legal_profile_if_exists(
  p_email TEXT,
  p_full_name TEXT,
  p_department TEXT,
  p_position TEXT,
  p_role TEXT,
  p_permissions TEXT[],
  p_accessible_modules TEXT[]
)
RETURNS VOID
SET search_path = ''
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if auth user exists with this email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  -- If auth user exists, create or update profile
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_profiles (
      id, email, full_name, department, position, role, permissions, accessible_modules, is_active
    ) VALUES (
      v_user_id, p_email, p_full_name, p_department, p_position, p_role, p_permissions, p_accessible_modules, true
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      department = EXCLUDED.department,
      position = EXCLUDED.position,
      role = EXCLUDED.role,
      permissions = EXCLUDED.permissions,
      accessible_modules = EXCLUDED.accessible_modules,
      is_active = EXCLUDED.is_active;
  END IF;
END;
$$;

-- Fix update_license_usage
CREATE OR REPLACE FUNCTION public.update_license_usage()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'Active' THEN
    UPDATE public.software_licenses
    SET used_licenses = used_licenses + 1,
        updated_at = NOW()
    WHERE id = NEW.license_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'Active' AND NEW.status != 'Active' THEN
      UPDATE public.software_licenses
      SET used_licenses = GREATEST(0, used_licenses - 1),
          updated_at = NOW()
      WHERE id = NEW.license_id;
    ELSIF OLD.status != 'Active' AND NEW.status = 'Active' THEN
      UPDATE public.software_licenses
      SET used_licenses = used_licenses + 1,
          updated_at = NOW()
      WHERE id = NEW.license_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'Active' THEN
    UPDATE public.software_licenses
    SET used_licenses = GREATEST(0, used_licenses - 1),
        updated_at = NOW()
    WHERE id = OLD.license_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix calculate_incident_resolution_time
CREATE OR REPLACE FUNCTION public.calculate_incident_resolution_time()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'resolved' AND NEW.resolved_at IS NOT NULL AND OLD.status != 'resolved' THEN
    NEW.resolution_time_minutes := EXTRACT(EPOCH FROM (NEW.resolved_at - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix calculate_system_health_score
CREATE OR REPLACE FUNCTION public.calculate_system_health_score()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql AS $$
BEGIN
  -- Calculate health score based on metrics (0-100)
  NEW.health_score := CASE
    WHEN NEW.status = 'down' THEN 0
    WHEN NEW.status = 'degraded' THEN 30
    WHEN NEW.status = 'maintenance' THEN 50
    WHEN NEW.cpu_usage > 90 OR NEW.memory_usage > 90 OR NEW.disk_usage > 90 THEN 40
    WHEN NEW.cpu_usage > 80 OR NEW.memory_usage > 80 OR NEW.disk_usage > 80 THEN 60
    WHEN NEW.response_time_ms > 1000 THEN 70
    WHEN NEW.status = 'operational' THEN 90 + LEAST(10, (100 - COALESCE(NEW.cpu_usage, 0) - COALESCE(NEW.memory_usage, 0) - COALESCE(NEW.disk_usage, 0)) / 3)
    ELSE 80
  END;
  RETURN NEW;
END;
$$;

-- ============================================
-- SUMMARY
-- ============================================
-- All functions have been updated with SET search_path = ''
-- This prevents search path manipulation attacks
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

COMMENT ON FUNCTION public.update_employees_updated_at() IS 'Trigger function to update employees.updated_at - Fixed search_path for security';
COMMENT ON FUNCTION public.is_in_department(TEXT) IS 'Check if user is in department - Fixed search_path for security';
COMMENT ON FUNCTION public.get_user_role() IS 'Get current user role - Fixed search_path for security';
COMMENT ON FUNCTION public.has_role(TEXT) IS 'Check if user has role - Fixed search_path for security';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Trigger function to update updated_at - Fixed search_path for security';
COMMENT ON FUNCTION public.has_permission(TEXT) IS 'Check if user has permission - Fixed search_path for security';
COMMENT ON FUNCTION public.update_support_requests_updated_at() IS 'Trigger function to update support_requests.updated_at - Fixed search_path for security';
COMMENT ON FUNCTION public.update_vendor_stats() IS 'Update vendor statistics - Fixed search_path for security';
COMMENT ON FUNCTION public.calculate_order_item_total() IS 'Calculate order item total - Fixed search_path for security';
COMMENT ON FUNCTION public.update_po_value_from_items() IS 'Update PO value from items - Fixed search_path for security';
COMMENT ON FUNCTION public.update_inventory_on_receipt() IS 'Update inventory on receipt - Fixed search_path for security';
COMMENT ON FUNCTION public.get_role_permissions(TEXT) IS 'Get role permissions - Fixed search_path for security';
COMMENT ON FUNCTION public.role_has_permission(TEXT, TEXT) IS 'Check if role has permission - Fixed search_path for security';
COMMENT ON FUNCTION public.update_support_request_activity() IS 'Update support request activity - Fixed search_path for security';
COMMENT ON FUNCTION public.auto_assign_support_ticket(UUID) IS 'Auto-assign support ticket - Fixed search_path for security';
COMMENT ON FUNCTION public.get_sla_status(UUID) IS 'Get SLA status - Fixed search_path for security';
COMMENT ON FUNCTION public.update_hse_updated_at() IS 'Update HSE updated_at - Fixed search_path for security';
COMMENT ON FUNCTION public.calculate_trir(DATE, DATE) IS 'Calculate TRIR - Fixed search_path for security';
COMMENT ON FUNCTION public.calculate_ltifr(DATE, DATE) IS 'Calculate LTIFR - Fixed search_path for security';
COMMENT ON FUNCTION public.create_user_with_profile(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[]) IS 'Create user with profile - Fixed search_path for security';
COMMENT ON FUNCTION public.generate_security_alert_from_log() IS 'Generate security alert from log - Fixed search_path for security';
COMMENT ON FUNCTION public.check_critical_access_patterns() IS 'Check critical access patterns - Fixed search_path for security';
COMMENT ON FUNCTION public.calculate_employee_wellness_points(UUID) IS 'Calculate employee wellness points - Fixed search_path for security';
COMMENT ON FUNCTION public.update_program_participant_count() IS 'Update program participant count - Fixed search_path for security';
COMMENT ON FUNCTION public.update_challenge_participant_count() IS 'Update challenge participant count - Fixed search_path for security';
COMMENT ON FUNCTION public.update_event_attendee_count() IS 'Update event attendee count - Fixed search_path for security';
COMMENT ON FUNCTION public.create_executive_profile_if_exists(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[]) IS 'Create executive profile if exists - Fixed search_path for security';
COMMENT ON FUNCTION public.create_legal_profile_if_exists(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[]) IS 'Create legal profile if exists - Fixed search_path for security';
COMMENT ON FUNCTION public.update_license_usage() IS 'Update license usage - Fixed search_path for security';
COMMENT ON FUNCTION public.calculate_incident_resolution_time() IS 'Calculate incident resolution time - Fixed search_path for security';
COMMENT ON FUNCTION public.calculate_system_health_score() IS 'Calculate system health score - Fixed search_path for security';

