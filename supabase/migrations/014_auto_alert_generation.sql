-- ============================================
-- AUTO-ALERT GENERATION FROM ACCESS LOGS
-- ============================================

-- Function to generate security alerts from access logs
CREATE OR REPLACE FUNCTION generate_security_alert_from_log()
RETURNS TRIGGER AS $$
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
      FROM access_logs 
      WHERE action_type = 'failed_login' 
        AND status = 'failed'
        AND ip_address = NEW.ip_address
        AND created_at > NOW() - INTERVAL '5 minutes'
    ) >= 3 THEN
      alert_number := 'SEC-ALERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
      alert_severity := 'high';
      alert_title := 'Multiple Failed Login Attempts';
      alert_description := 'Multiple failed login attempts detected from IP ' || NEW.ip_address || ' in the last 5 minutes.';
      
      INSERT INTO security_alerts (
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
    
    INSERT INTO security_alerts (
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
      FROM access_logs 
      WHERE user_id = NEW.user_id
        AND (action_type = 'permission_change' OR action_type = 'role_assignment')
        AND created_at > NOW() - INTERVAL '1 hour'
    ) >= 5 THEN
      alert_number := 'SEC-ALERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
      alert_severity := 'medium';
      alert_title := 'Suspicious Permission Activity';
      alert_description := 'User ' || NEW.user_name || ' has made multiple permission/role changes in the last hour.';
      
      INSERT INTO security_alerts (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-generate alerts
DROP TRIGGER IF EXISTS auto_generate_security_alert ON public.access_logs;
CREATE TRIGGER auto_generate_security_alert
  AFTER INSERT ON public.access_logs
  FOR EACH ROW
  EXECUTE FUNCTION generate_security_alert_from_log();

-- Function to check for critical access patterns and generate alerts
CREATE OR REPLACE FUNCTION check_critical_access_patterns()
RETURNS void AS $$
DECLARE
  alert_number VARCHAR(50);
BEGIN
  -- Check for users accessing sensitive data outside business hours (9 AM - 5 PM)
  FOR alert_number IN
    SELECT DISTINCT 'SEC-ALERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
    FROM access_logs
    WHERE action_type = 'data_access'
      AND resource_type IN ('confidential', 'restricted')
      AND EXTRACT(HOUR FROM created_at) NOT BETWEEN 9 AND 17
      AND created_at > NOW() - INTERVAL '1 hour'
      AND NOT EXISTS (
        SELECT 1 FROM security_alerts 
        WHERE affected_user_id = access_logs.user_id 
          AND alert_type = 'suspicious_activity'
          AND detected_at > NOW() - INTERVAL '1 hour'
      )
  LOOP
    INSERT INTO security_alerts (
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
    FROM access_logs
    WHERE action_type = 'data_access'
      AND resource_type IN ('confidential', 'restricted')
      AND EXTRACT(HOUR FROM created_at) NOT BETWEEN 9 AND 17
      AND created_at > NOW() - INTERVAL '1 hour'
    LIMIT 1
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule function to run periodically (can be called by cron job or scheduled task)
-- Note: This would typically be set up as a cron job or scheduled task in your application
-- For now, we'll create a function that can be called manually or via a scheduled task

COMMENT ON FUNCTION check_critical_access_patterns() IS 'Checks for critical access patterns and generates alerts. Should be run periodically (e.g., every hour).';

