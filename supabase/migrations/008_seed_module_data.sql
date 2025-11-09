-- ============================================
-- AdminOS - Seed Module Data
-- ============================================
-- This script populates sample data for all modules/pages that need data
-- 
-- Modules covered:
-- - Workflows & Tasks (workflow_tasks, task_comments)
-- - Messaging (messages)
-- - Announcements (announcements)
-- - Approvals (approval_requests, approval_workflows)
-- - Recruitment (job_postings, candidates)
-- - Leave & Attendance (leave_requests, attendance_records)
-- - Requests & Ticketing (support_requests)
-- - Compliance & Audit (audit_logs, audit_findings, audit_reports, risk_assessments)
-- - Email Logs (email_logs)
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. WORKFLOW TASKS & COMMENTS
-- ============================================

-- Insert workflow tasks (assigning to various employees)
INSERT INTO public.workflow_tasks (title, description, assigned_to, assigned_by, department, status, priority, due_date)
SELECT 
  task_data.title,
  task_data.description,
  assignee.id as assigned_to,
  assigner.id as assigned_by,
  assignee.department,
  task_data.status,
  task_data.priority,
  task_data.due_date::DATE
FROM (VALUES
  ('Complete Q4 Financial Report', 'Prepare and review quarterly financial statements', 'hr_head', 'super_admin', 'Human Resources', 'in_progress', 'high', CURRENT_DATE + INTERVAL '5 days'),
  ('Update Employee Handbook', 'Review and update company policies in employee handbook', 'hr_officer', 'hr_head', 'Human Resources', 'pending', 'medium', CURRENT_DATE + INTERVAL '10 days'),
  ('Review Security Audit Findings', 'Address security vulnerabilities identified in recent audit', 'it_manager', 'super_admin', 'Information Technology', 'pending', 'critical', CURRENT_DATE + INTERVAL '3 days'),
  ('Prepare Budget Proposal', 'Draft budget proposal for next fiscal year', 'finance_director', 'executive', 'Finance', 'in_progress', 'high', CURRENT_DATE + INTERVAL '7 days'),
  ('Onboard New Hires', 'Complete onboarding process for 5 new employees', 'hr_officer', 'hr_head', 'Human Resources', 'pending', 'medium', CURRENT_DATE + INTERVAL '14 days'),
  ('Implement New Payroll System', 'Migrate to new payroll software platform', 'accountant', 'finance_director', 'Finance', 'pending', 'high', CURRENT_DATE + INTERVAL '30 days'),
  ('Conduct Performance Reviews', 'Complete annual performance reviews for team', 'dept_manager', 'hr_head', 'Engineering', 'in_progress', 'medium', CURRENT_DATE + INTERVAL '20 days'),
  ('Update Company Website', 'Refresh website content and design', 'project_manager', 'executive', 'Marketing', 'pending', 'low', CURRENT_DATE + INTERVAL '15 days')
) AS task_data(title, description, assignee_role, assigner_role, department, status, priority, due_date)
LEFT JOIN public.user_profiles assignee ON assignee.role = task_data.assignee_role AND assignee.department = task_data.department
LEFT JOIN public.user_profiles assigner ON assigner.role = task_data.assigner_role
WHERE assignee.id IS NOT NULL AND assigner.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Insert task comments (add comments to first few tasks)
INSERT INTO public.task_comments (task_id, author_id, author_name, text)
SELECT 
  t.id as task_id,
  u.id as author_id,
  u.full_name as author_name,
  comment_data.text
FROM (
  SELECT id FROM public.workflow_tasks ORDER BY created_at LIMIT 5
) t
CROSS JOIN (VALUES
  ('Started working on this task. Will update progress by end of week.'),
  ('Need clarification on requirements. Can we schedule a meeting?'),
  ('Completed first phase. Waiting for approval to proceed.')
) AS comment_data(text)
CROSS JOIN LATERAL (
  SELECT id, full_name FROM public.user_profiles 
  WHERE role IN ('hr_head', 'hr_officer', 'it_manager', 'finance_director', 'dept_manager')
  ORDER BY random() LIMIT 1
) u
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. MESSAGES
-- ============================================

-- Insert direct messages
INSERT INTO public.messages (sender_id, sender_name, recipient_id, recipient_name, subject, body, type, status)
SELECT 
  sender.id as sender_id,
  sender.full_name as sender_name,
  recipient.id as recipient_id,
  recipient.full_name as recipient_name,
  msg_data.subject,
  msg_data.body,
  'direct' as type,
  CASE WHEN random() < 0.3 THEN 'read' ELSE 'unread' END as status
FROM (VALUES
  ('Meeting Reminder', 'Hi, just a reminder about our meeting tomorrow at 2 PM.'),
  ('Project Update', 'The project is progressing well. We should be on track for the deadline.'),
  ('Question About Policy', 'Can you clarify the new leave policy? I have a few questions.'),
  ('Thank You', 'Thanks for your help with the budget review. Much appreciated!'),
  ('Urgent: Need Approval', 'I need your approval on the expense report by end of day.'),
  ('Team Lunch', 'Are you free for team lunch this Friday?'),
  ('Document Review', 'Please review the attached document and provide feedback.'),
  ('Holiday Schedule', 'Here is the updated holiday schedule for next quarter.')
) AS msg_data(subject, body)
CROSS JOIN LATERAL (
  SELECT id, full_name, department FROM public.user_profiles 
  WHERE role IN ('employee', 'dept_manager', 'hr_officer', 'finance_officer')
  ORDER BY random() LIMIT 1
) sender
CROSS JOIN LATERAL (
  SELECT id, full_name FROM public.user_profiles 
  WHERE id != sender.id AND department = sender.department
  ORDER BY random() LIMIT 1
) recipient
ON CONFLICT DO NOTHING;

-- Insert department messages
INSERT INTO public.messages (sender_id, sender_name, department_id, subject, body, type, status)
SELECT 
  sender.id as sender_id,
  sender.full_name as sender_name,
  sender.department as department_id,
  dept_msg_data.subject,
  dept_msg_data.body,
  'department' as type,
  'unread' as status
FROM (VALUES
  ('Department Meeting', 'All team members are required to attend the monthly department meeting on Friday.'),
  ('New Policy Announcement', 'Please review the updated remote work policy effective next month.'),
  ('Team Building Event', 'Save the date for our team building event next month. More details to follow.'),
  ('Performance Review Period', 'Performance review period starts next week. Please prepare your self-assessments.')
) AS dept_msg_data(subject, body)
CROSS JOIN LATERAL (
  SELECT id, full_name, department FROM public.user_profiles 
  WHERE role IN ('dept_manager', 'hr_head', 'hr_officer')
  ORDER BY random() LIMIT 1
) sender
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. ANNOUNCEMENTS
-- ============================================

INSERT INTO public.announcements (created_by, title, content, priority, visibility, target_department, expires_at)
SELECT 
  creator.id as created_by,
  ann_data.title,
  ann_data.content,
  ann_data.priority,
  ann_data.visibility,
  ann_data.target_department,
  ann_data.expires_at::TIMESTAMPTZ
FROM (VALUES
  ('Company Holiday Schedule', 'The company will be closed on December 25th and January 1st. Please plan accordingly.', 'high', 'all', NULL, CURRENT_DATE + INTERVAL '30 days'),
  ('New Health Insurance Benefits', 'We are pleased to announce enhanced health insurance benefits starting next month.', 'medium', 'all', NULL, CURRENT_DATE + INTERVAL '60 days'),
  ('IT Maintenance Window', 'Scheduled maintenance this weekend. System may be unavailable Saturday 2-4 AM.', 'high', 'all', NULL, CURRENT_DATE + INTERVAL '3 days'),
  ('Q4 Town Hall Meeting', 'Join us for the Q4 town hall meeting next Friday at 3 PM in the main conference room.', 'medium', 'all', NULL, CURRENT_DATE + INTERVAL '7 days'),
  ('Engineering Team Update', 'Engineering team: New development tools are now available. Check the IT portal for details.', 'low', 'department', 'Engineering', CURRENT_DATE + INTERVAL '14 days'),
  ('Finance Department Training', 'Mandatory training session for all finance team members next Tuesday.', 'medium', 'department', 'Finance', CURRENT_DATE + INTERVAL '5 days')
) AS ann_data(title, content, priority, visibility, target_department, expires_at)
CROSS JOIN LATERAL (
  SELECT id FROM public.user_profiles 
  WHERE role IN ('super_admin', 'executive', 'hr_head')
  ORDER BY random() LIMIT 1
) creator
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. APPROVAL REQUESTS
-- ============================================

INSERT INTO public.approval_requests (request_type, requested_by, status, amount, description, details)
SELECT 
  req_data.request_type,
  requester.id as requested_by,
  req_data.status,
  req_data.amount,
  req_data.description,
  jsonb_build_object('category', req_data.category, 'notes', req_data.notes) as details
FROM (VALUES
  ('expense', 'pending', 450.00, 'Business trip to client site', 'Travel', 'Flight and hotel expenses'),
  ('expense', 'approved', 230.00, 'Client lunch meeting', 'Meals', 'Approved by finance director'),
  ('expense', 'pending', 890.00, 'Software license renewal', 'Software', 'Annual subscription'),
  ('leave', 'pending', NULL, 'Vacation leave request', 'Leave', 'Family vacation'),
  ('leave', 'approved', NULL, 'Sick leave', 'Leave', 'Medical appointment'),
  ('purchase', 'pending', 1500.00, 'Office equipment purchase', 'Equipment', 'New monitors for team'),
  ('purchase', 'rejected', 5000.00, 'Conference room upgrade', 'Facilities', 'Budget constraints'),
  ('budget', 'pending', 25000.00, 'Q1 Marketing budget approval', 'Budget', 'Marketing campaign funds')
) AS req_data(request_type, status, amount, description, category, notes)
CROSS JOIN LATERAL (
  SELECT id FROM public.user_profiles 
  WHERE role IN ('employee', 'dept_manager', 'finance_officer')
  ORDER BY random() LIMIT 1
) requester
ON CONFLICT DO NOTHING;

-- Update approved requests with approver
UPDATE public.approval_requests ar
SET approved_by = approver.id,
    approved_at = CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM (
  SELECT id FROM public.user_profiles 
  WHERE role IN ('finance_director', 'hr_head', 'dept_manager')
  ORDER BY random() LIMIT 1
) approver
WHERE ar.status = 'approved' 
  AND ar.approved_by IS NULL
  AND ar.id IN (
    SELECT id FROM public.approval_requests 
    WHERE status = 'approved' AND approved_by IS NULL 
    LIMIT 3
  );

-- ============================================
-- 5. APPROVAL WORKFLOWS (Multi-level)
-- ============================================

INSERT INTO public.approval_workflows (request_type, requested_by, approval_chain, current_approval_level, overall_status, amount, description, details)
SELECT 
  wf_data.request_type,
  requester.id as requested_by,
  wf_data.approval_chain::jsonb,
  wf_data.current_approval_level,
  wf_data.overall_status,
  wf_data.amount,
  wf_data.description,
  jsonb_build_object('category', wf_data.category) as details
FROM (VALUES
  ('expense', 'pending', 0, 'pending', 5000.00, 'Large equipment purchase', 'Equipment', 
   '[{"role": "dept_manager", "status": "pending", "approverIds": []}, {"role": "finance_director", "status": "pending", "approverIds": []}]'::text),
  ('budget', 'pending', 1, 'pending', 50000.00, 'Annual department budget', 'Budget',
   '[{"role": "dept_manager", "status": "approved", "approverIds": []}, {"role": "finance_director", "status": "pending", "approverIds": []}, {"role": "executive", "status": "pending", "approverIds": []}]'::text),
  ('purchase', 'approved', 2, 'approved', 10000.00, 'Software license purchase', 'Software',
   '[{"role": "dept_manager", "status": "approved", "approverIds": []}, {"role": "finance_director", "status": "approved", "approverIds": []}, {"role": "executive", "status": "approved", "approverIds": []}]'::text)
) AS wf_data(request_type, overall_status, current_approval_level, status, amount, description, category, approval_chain)
CROSS JOIN LATERAL (
  SELECT id FROM public.user_profiles 
  WHERE role IN ('dept_manager', 'finance_officer')
  ORDER BY random() LIMIT 1
) requester
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. JOB POSTINGS
-- ============================================

INSERT INTO public.job_postings (title, department, description, requirements, status, posted_by, closing_date)
SELECT 
  job_data.title,
  job_data.department,
  job_data.description,
  job_data.requirements::text[],
  job_data.status,
  poster.id as posted_by,
  job_data.closing_date::DATE
FROM (VALUES
  ('Senior Software Engineer', 'Engineering', 'We are looking for an experienced software engineer to join our team.', ARRAY['5+ years experience', 'Bachelor degree', 'Strong problem-solving skills'], 'open', 'recruiter', CURRENT_DATE + INTERVAL '30 days'),
  ('Marketing Manager', 'Marketing', 'Lead our marketing initiatives and campaigns.', ARRAY['3+ years marketing experience', 'MBA preferred', 'Strong analytical skills'], 'open', 'recruiter', CURRENT_DATE + INTERVAL '25 days'),
  ('HR Coordinator', 'Human Resources', 'Support HR operations and employee relations.', ARRAY['2+ years HR experience', 'Bachelor degree', 'Excellent communication skills'], 'open', 'recruiter', CURRENT_DATE + INTERVAL '20 days'),
  ('Financial Analyst', 'Finance', 'Analyze financial data and prepare reports.', ARRAY['3+ years finance experience', 'CPA preferred', 'Advanced Excel skills'], 'open', 'recruiter', CURRENT_DATE + INTERVAL '35 days'),
  ('IT Support Specialist', 'Information Technology', 'Provide technical support to employees.', ARRAY['2+ years IT support', 'Technical certifications', 'Customer service skills'], 'closed', 'recruiter', CURRENT_DATE - INTERVAL '5 days')
) AS job_data(title, department, description, requirements, status, poster_role, closing_date)
CROSS JOIN LATERAL (
  SELECT id FROM public.user_profiles 
  WHERE role = 'recruiter'
  ORDER BY random() LIMIT 1
) poster
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. CANDIDATES
-- ============================================

INSERT INTO public.candidates (job_posting_id, name, email, phone, status, notes)
SELECT 
  jp.id as job_posting_id,
  cand_data.name,
  cand_data.email,
  cand_data.phone,
  cand_data.status,
  cand_data.notes
FROM public.job_postings jp
CROSS JOIN (VALUES
  ('John Smith', 'john.smith@email.com', '555-0101', 'applied', 'Strong background in software development'),
  ('Sarah Johnson', 'sarah.j@email.com', '555-0102', 'screening', 'Relevant experience, good cultural fit'),
  ('Michael Brown', 'm.brown@email.com', '555-0103', 'interview', 'Scheduled for technical interview'),
  ('Emily Davis', 'emily.davis@email.com', '555-0104', 'offer', 'Made offer, waiting for response'),
  ('David Wilson', 'd.wilson@email.com', '555-0105', 'hired', 'Accepted offer, start date confirmed'),
  ('Lisa Anderson', 'lisa.a@email.com', '555-0106', 'applied', 'Recent graduate, eager to learn'),
  ('Robert Taylor', 'r.taylor@email.com', '555-0107', 'screening', 'Good qualifications, checking references'),
  ('Jennifer Martinez', 'j.martinez@email.com', '555-0108', 'interview', 'Second round interview scheduled')
) AS cand_data(name, email, phone, status, notes)
WHERE jp.status = 'open'
LIMIT 15
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. LEAVE REQUESTS
-- ============================================

INSERT INTO public.leave_requests (employee_id, employee_name, type, from_date, to_date, days, status, reason)
SELECT 
  e.id as employee_id,
  e.name as employee_name,
  leave_data.type,
  leave_data.from_date::DATE,
  leave_data.to_date::DATE,
  leave_data.days,
  leave_data.status,
  leave_data.reason
FROM (
  SELECT id, name FROM public.employees ORDER BY random() LIMIT 10
) e
CROSS JOIN (VALUES
  ('Vacation', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '15 days', 6, 'Pending', 'Family vacation'),
  ('Sick Leave', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE - INTERVAL '1 day', 2, 'Approved', 'Medical appointment'),
  ('Personal', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '5 days', 1, 'Pending', 'Personal matters'),
  ('Vacation', CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE + INTERVAL '25 days', 6, 'Pending', 'Holiday trip'),
  ('Sick Leave', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '3 days', 3, 'Approved', 'Illness'),
  ('Personal', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '7 days', 1, 'Rejected', 'Not enough leave balance')
) AS leave_data(type, from_date, to_date, days, status, reason)
ON CONFLICT DO NOTHING;

-- Update approved leave requests
UPDATE public.leave_requests lr
SET approved_by = approver.id,
    approved_at = CURRENT_TIMESTAMP - INTERVAL '3 days'
FROM (
  SELECT id FROM public.user_profiles 
  WHERE role IN ('hr_head', 'hr_officer', 'dept_manager')
  ORDER BY random() LIMIT 1
) approver
WHERE lr.status = 'Approved' 
  AND lr.approved_by IS NULL
  AND lr.id IN (
    SELECT id FROM public.leave_requests 
    WHERE status = 'Approved' AND approved_by IS NULL 
    LIMIT 3
  );

-- ============================================
-- 9. ATTENDANCE RECORDS
-- ============================================

-- Insert attendance records for the past 30 days
INSERT INTO public.attendance_records (employee_id, date, status, check_in, check_out, notes)
SELECT 
  e.id as employee_id,
  date_series.date,
  CASE 
    WHEN random() < 0.05 THEN 'absent'
    WHEN random() < 0.1 THEN 'late'
    ELSE 'present'
  END as status,
  CASE 
    WHEN random() < 0.05 THEN NULL
    ELSE (date_series.date + TIME '09:00:00' + (random() * INTERVAL '30 minutes'))::TIMESTAMPTZ
  END as check_in,
  CASE 
    WHEN random() < 0.05 THEN NULL
    ELSE (date_series.date + TIME '17:00:00' + (random() * INTERVAL '30 minutes'))::TIMESTAMPTZ
  END as check_out,
  CASE WHEN random() < 0.1 THEN 'Worked from home' ELSE NULL END as notes
FROM public.employees e
CROSS JOIN generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '1 day', INTERVAL '1 day') as date_series(date)
WHERE date_series.date::text NOT IN (
  SELECT DISTINCT date::text FROM public.leave_requests 
  WHERE status = 'Approved' 
    AND date_series.date BETWEEN from_date AND to_date
    AND e.id = employee_id
)
LIMIT 500
ON CONFLICT (employee_id, date) DO NOTHING;

-- ============================================
-- 10. SUPPORT REQUESTS
-- ============================================

INSERT INTO public.support_requests (type, title, description, requester_id, requester_name, assignee_id, assignee_name, priority, status, resolved_at)
SELECT 
  req_data.type,
  req_data.title,
  req_data.description,
  requester.id as requester_id,
  requester.full_name as requester_name,
  assignee.id as assignee_id,
  assignee.full_name as assignee_name,
  req_data.priority,
  req_data.status,
  CASE WHEN req_data.status = 'Resolved' THEN CURRENT_TIMESTAMP - INTERVAL '2 days' ELSE NULL END as resolved_at
FROM (VALUES
  ('IT Support', 'Laptop not connecting to WiFi', 'My laptop cannot connect to the office WiFi network. Tried restarting but issue persists.', 'High', 'In Progress', 'it_support'),
  ('IT Support', 'Software installation request', 'Need Adobe Creative Suite installed on my workstation.', 'Medium', 'Pending', 'it_support'),
  ('Facilities', 'Office temperature too cold', 'The office temperature is too cold. Can we adjust the thermostat?', 'Low', 'Resolved', 'facilities_manager'),
  ('HR', 'Update emergency contact', 'I need to update my emergency contact information in the system.', 'Low', 'Resolved', 'hr_officer'),
  ('IT Support', 'Password reset needed', 'I forgot my password and need it reset.', 'High', 'Resolved', 'it_support'),
  ('Facilities', 'Broken chair', 'My office chair is broken and needs replacement.', 'Medium', 'Pending', 'facilities_manager'),
  ('HR', 'Benefits question', 'I have questions about the new health insurance benefits.', 'Medium', 'In Progress', 'hr_officer'),
  ('IT Support', 'Printer not working', 'The office printer is showing an error and not printing.', 'High', 'Pending', 'it_support'),
  ('Facilities', 'Parking space request', 'I need a parking space assigned near the building entrance.', 'Low', 'Pending', 'facilities_manager'),
  ('HR', 'Leave balance inquiry', 'Can you provide my current leave balance?', 'Low', 'Resolved', 'hr_officer')
) AS req_data(type, title, description, priority, status, assignee_role)
CROSS JOIN LATERAL (
  SELECT id, full_name FROM public.user_profiles 
  WHERE role IN ('employee', 'dept_manager')
  ORDER BY random() LIMIT 1
) requester
LEFT JOIN LATERAL (
  SELECT id, full_name FROM public.user_profiles 
  WHERE role = req_data.assignee_role
  ORDER BY random() LIMIT 1
) assignee ON true
ON CONFLICT DO NOTHING;

-- ============================================
-- 11. AUDIT LOGS
-- ============================================

INSERT INTO public.audit_logs (user_id, user_name, department, action, module, severity, details)
SELECT 
  actor.id as user_id,
  actor.full_name as user_name,
  actor.department,
  log_data.action,
  log_data.module,
  log_data.severity,
  jsonb_build_object('description', log_data.description, 'ip_address', log_data.ip_address) as details
FROM (VALUES
  ('Employee Record Updated', 'employees', 'medium', 'Updated salary information for employee', '192.168.1.100'),
  ('Expense Report Approved', 'finance', 'low', 'Approved expense report #EXP-2024-001', '192.168.1.101'),
  ('Leave Request Denied', 'leave', 'medium', 'Denied leave request for Dec 25-31', '192.168.1.102'),
  ('Unauthorized Access Attempt', 'security', 'high', 'Multiple failed login attempts from IP 192.168.1.200', '192.168.1.200'),
  ('Settings Modified', 'settings', 'low', 'Changed company timezone setting', '192.168.1.103'),
  ('User Created', 'users', 'medium', 'Created new user account', '192.168.1.104'),
  ('Asset Assigned', 'assets', 'low', 'Assigned laptop to employee', '192.168.1.105'),
  ('Project Created', 'projects', 'low', 'Created new project: Website Redesign', '192.168.1.106'),
  ('Budget Updated', 'finance', 'high', 'Updated department budget allocation', '192.168.1.107'),
  ('Permission Changed', 'security', 'high', 'Modified user permissions', '192.168.1.108'),
  ('Data Export', 'reports', 'medium', 'Exported employee data report', '192.168.1.109'),
  ('Login Failed', 'security', 'medium', 'Failed login attempt for user account', '192.168.1.201'),
  ('Password Reset', 'security', 'low', 'Password reset requested', '192.168.1.110'),
  ('Document Deleted', 'documents', 'medium', 'Deleted confidential document', '192.168.1.111'),
  ('System Backup', 'system', 'low', 'Automated system backup completed', '192.168.1.112')
) AS log_data(action, module, severity, description, ip_address)
CROSS JOIN LATERAL (
  SELECT id, full_name, department FROM public.user_profiles 
  WHERE role IN ('super_admin', 'hr_head', 'finance_director', 'it_manager', 'dept_manager')
  ORDER BY random() LIMIT 1
) actor
ON CONFLICT DO NOTHING;

-- ============================================
-- 12. AUDIT FINDINGS
-- ============================================

INSERT INTO public.audit_findings (audit_id, audited_by, finding_type, severity, description, recommendation, status, due_date)
SELECT 
  'AUDIT-' || LPAD((row_number() OVER ())::text, 4, '0') as audit_id,
  auditor.id as audited_by,
  finding_data.finding_type,
  finding_data.severity,
  finding_data.description,
  finding_data.recommendation,
  finding_data.status,
  finding_data.due_date::DATE
FROM (VALUES
  ('Compliance', 'high', 'Missing documentation for expense approvals', 'Implement mandatory documentation requirement for all expense approvals', 'open', CURRENT_DATE + INTERVAL '14 days'),
  ('Security', 'high', 'Weak password policy enforcement', 'Enforce stronger password requirements and regular password changes', 'open', CURRENT_DATE + INTERVAL '7 days'),
  ('Process', 'medium', 'Inconsistent leave approval process', 'Standardize leave approval workflow across all departments', 'open', CURRENT_DATE + INTERVAL '21 days'),
  ('Data', 'medium', 'Incomplete employee records', 'Complete missing employee information in HR system', 'open', CURRENT_DATE + INTERVAL '30 days'),
  ('Security', 'low', 'Outdated software versions', 'Update all software to latest versions', 'resolved', CURRENT_DATE - INTERVAL '5 days'),
  ('Compliance', 'high', 'Missing audit trail for sensitive operations', 'Implement comprehensive audit logging for all sensitive operations', 'open', CURRENT_DATE + INTERVAL '10 days')
) AS finding_data(finding_type, severity, description, recommendation, status, due_date)
CROSS JOIN LATERAL (
  SELECT id FROM public.user_profiles 
  WHERE role IN ('audit_head', 'audit_manager', 'internal_auditor', 'super_admin')
  ORDER BY random() LIMIT 1
) auditor
ON CONFLICT DO NOTHING;

-- ============================================
-- 13. AUDIT REPORTS
-- ============================================

INSERT INTO public.audit_reports (title, period, audited_area, created_by, approved_by, status, findings, observations, conclusion)
SELECT 
  report_data.title,
  report_data.period,
  report_data.audited_area,
  creator.id as created_by,
  approver.id as approved_by,
  report_data.status,
  report_data.findings::text[],
  report_data.observations,
  report_data.conclusion
FROM (VALUES
  ('Q4 2024 Security Audit', 'Q4 2024', 'Information Security', 'draft', ARRAY['AUDIT-0001', 'AUDIT-0002'], 'Overall security posture is good but needs improvement in password policies.', 'Recommend implementing stronger authentication measures.'),
  ('Annual Compliance Review', '2024', 'HR Compliance', 'published', ARRAY['AUDIT-0003', 'AUDIT-0004'], 'HR processes are compliant with most regulations.', 'Continue monitoring and regular reviews.'),
  ('Financial Controls Audit', 'Q3 2024', 'Finance', 'draft', ARRAY['AUDIT-0001'], 'Financial controls are effective but documentation needs improvement.', 'Enhance documentation practices.')
) AS report_data(title, period, audited_area, status, findings, observations, conclusion)
CROSS JOIN LATERAL (
  SELECT id FROM public.user_profiles 
  WHERE role IN ('audit_head', 'audit_manager', 'super_admin')
  ORDER BY random() LIMIT 1
) creator
LEFT JOIN LATERAL (
  SELECT id FROM public.user_profiles 
  WHERE role = 'executive'
  ORDER BY random() LIMIT 1
) approver ON true
ON CONFLICT DO NOTHING;

-- Update published reports
UPDATE public.audit_reports
SET published_at = CURRENT_TIMESTAMP - INTERVAL '10 days'
WHERE status = 'published';

-- ============================================
-- 14. RISK ASSESSMENTS
-- ============================================

INSERT INTO public.risk_assessments (risk_category, description, probability, impact, mitigation, owner_id, owner_name, status, last_review_date)
SELECT 
  risk_data.risk_category,
  risk_data.description,
  risk_data.probability,
  risk_data.impact,
  risk_data.mitigation,
  owner.id as owner_id,
  owner.full_name as owner_name,
  risk_data.status,
  risk_data.last_review_date::DATE
FROM (VALUES
  ('Security', 'Data breach risk from external threats', 'medium', 'high', 'Implement multi-factor authentication and regular security audits', 'active', CURRENT_DATE - INTERVAL '30 days'),
  ('Operational', 'Key person dependency in critical roles', 'low', 'high', 'Cross-train employees and document processes', 'active', CURRENT_DATE - INTERVAL '60 days'),
  ('Financial', 'Budget overruns on projects', 'medium', 'medium', 'Implement stricter budget controls and regular monitoring', 'active', CURRENT_DATE - INTERVAL '45 days'),
  ('Compliance', 'Regulatory non-compliance risk', 'low', 'high', 'Regular compliance reviews and training', 'active', CURRENT_DATE - INTERVAL '90 days'),
  ('Technology', 'System downtime affecting operations', 'medium', 'high', 'Implement redundancy and backup systems', 'active', CURRENT_DATE - INTERVAL '20 days')
) AS risk_data(risk_category, description, probability, impact, mitigation, status, last_review_date)
CROSS JOIN LATERAL (
  SELECT id, full_name FROM public.user_profiles 
  WHERE role IN ('it_manager', 'finance_director', 'hr_head', 'dept_manager', 'compliance_officer')
  ORDER BY random() LIMIT 1
) owner
ON CONFLICT DO NOTHING;

-- ============================================
-- 15. EMAIL LOGS
-- ============================================

INSERT INTO public.email_logs (to_email, subject, body, status, type, sent_at)
SELECT 
  email_data.to_email,
  email_data.subject,
  email_data.body,
  email_data.status,
  email_data.type,
  email_data.sent_at::TIMESTAMPTZ
FROM (VALUES
  ('employee@company.com', 'Task Assignment: Complete Q4 Report', 'You have been assigned a new task. Please review and complete.', 'sent', 'task_assignment', CURRENT_TIMESTAMP - INTERVAL '2 days'),
  ('manager@company.com', 'Approval Required: Expense Report', 'An expense report requires your approval. Please review.', 'sent', 'approval', CURRENT_TIMESTAMP - INTERVAL '1 day'),
  ('employee@company.com', 'Leave Request Approved', 'Your leave request has been approved.', 'sent', 'notification', CURRENT_TIMESTAMP - INTERVAL '3 days'),
  ('employee@company.com', 'Reminder: Performance Review Due', 'Your performance review is due next week.', 'sent', 'reminder', CURRENT_TIMESTAMP - INTERVAL '5 days'),
  ('employee@company.com', 'Welcome to the Team', 'Welcome to our company! We are excited to have you.', 'sent', 'notification', CURRENT_TIMESTAMP - INTERVAL '10 days'),
  ('employee@company.com', 'Password Reset Request', 'You requested a password reset. Click the link to reset.', 'pending', 'notification', NULL),
  ('manager@company.com', 'Budget Approval Needed', 'Department budget requires your approval.', 'sent', 'approval', CURRENT_TIMESTAMP - INTERVAL '4 days'),
  ('employee@company.com', 'Training Program Enrollment', 'You have been enrolled in the Leadership Essentials program.', 'sent', 'notification', CURRENT_TIMESTAMP - INTERVAL '7 days'),
  ('employee@company.com', 'System Maintenance Notice', 'Scheduled maintenance this weekend. System may be unavailable.', 'sent', 'notification', CURRENT_TIMESTAMP - INTERVAL '1 day'),
  ('employee@company.com', 'Task Reminder: Update Handbook', 'Reminder: Your task is due in 3 days.', 'sent', 'reminder', CURRENT_TIMESTAMP - INTERVAL '6 hours')
) AS email_data(to_email, subject, body, status, type, sent_at)
ON CONFLICT DO NOTHING;

-- ============================================
-- SUMMARY
-- ============================================

DO $$
DECLARE
  v_workflow_tasks INTEGER;
  v_messages INTEGER;
  v_announcements INTEGER;
  v_approval_requests INTEGER;
  v_approval_workflows INTEGER;
  v_job_postings INTEGER;
  v_candidates INTEGER;
  v_leave_requests INTEGER;
  v_attendance_records INTEGER;
  v_support_requests INTEGER;
  v_audit_logs INTEGER;
  v_audit_findings INTEGER;
  v_audit_reports INTEGER;
  v_risk_assessments INTEGER;
  v_email_logs INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_workflow_tasks FROM public.workflow_tasks;
  SELECT COUNT(*) INTO v_messages FROM public.messages;
  SELECT COUNT(*) INTO v_announcements FROM public.announcements;
  SELECT COUNT(*) INTO v_approval_requests FROM public.approval_requests;
  SELECT COUNT(*) INTO v_approval_workflows FROM public.approval_workflows;
  SELECT COUNT(*) INTO v_job_postings FROM public.job_postings;
  SELECT COUNT(*) INTO v_candidates FROM public.candidates;
  SELECT COUNT(*) INTO v_leave_requests FROM public.leave_requests;
  SELECT COUNT(*) INTO v_attendance_records FROM public.attendance_records;
  SELECT COUNT(*) INTO v_support_requests FROM public.support_requests;
  SELECT COUNT(*) INTO v_audit_logs FROM public.audit_logs;
  SELECT COUNT(*) INTO v_audit_findings FROM public.audit_findings;
  SELECT COUNT(*) INTO v_audit_reports FROM public.audit_reports;
  SELECT COUNT(*) INTO v_risk_assessments FROM public.risk_assessments;
  SELECT COUNT(*) INTO v_email_logs FROM public.email_logs;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Module Data Seeding Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Workflow Tasks: %', v_workflow_tasks;
  RAISE NOTICE 'Messages: %', v_messages;
  RAISE NOTICE 'Announcements: %', v_announcements;
  RAISE NOTICE 'Approval Requests: %', v_approval_requests;
  RAISE NOTICE 'Approval Workflows: %', v_approval_workflows;
  RAISE NOTICE 'Job Postings: %', v_job_postings;
  RAISE NOTICE 'Candidates: %', v_candidates;
  RAISE NOTICE 'Leave Requests: %', v_leave_requests;
  RAISE NOTICE 'Attendance Records: %', v_attendance_records;
  RAISE NOTICE 'Support Requests: %', v_support_requests;
  RAISE NOTICE 'Audit Logs: %', v_audit_logs;
  RAISE NOTICE 'Audit Findings: %', v_audit_findings;
  RAISE NOTICE 'Audit Reports: %', v_audit_reports;
  RAISE NOTICE 'Risk Assessments: %', v_risk_assessments;
  RAISE NOTICE 'Email Logs: %', v_email_logs;
  RAISE NOTICE '========================================';
END $$;

