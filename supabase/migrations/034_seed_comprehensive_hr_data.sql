-- ============================================
-- AdminOS - Comprehensive HR Data Seeding
-- ============================================
-- This script populates comprehensive HR-related data:
-- - Job Postings (various departments, statuses)
-- - Candidates (with different stages in recruitment pipeline)
-- - Training Programs (various categories and statuses)
-- - Training Enrollments (employees enrolled in programs)
-- - Performance Reviews (various statuses and ratings)
-- - Leave Requests (additional sample data)
-- - HR Projects
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. JOB POSTINGS
-- ============================================

INSERT INTO public.job_postings (title, department, description, requirements, status, posted_by, closing_date)
SELECT 
  job_data.title,
  job_data.department,
  job_data.description,
  job_data.requirements::TEXT[],
  job_data.status,
  hr_user.id as posted_by,
  job_data.closing_date::DATE
FROM (VALUES
  ('Senior Software Engineer', 'Information Technology', 
   'We are seeking an experienced Senior Software Engineer to join our dynamic IT team. You will be responsible for designing, developing, and maintaining scalable software solutions.',
   ARRAY['5+ years of software development experience', 'Proficiency in JavaScript/TypeScript', 'Experience with cloud platforms (AWS/Azure)', 'Strong problem-solving skills'],
   'open', CURRENT_DATE + INTERVAL '30 days'),
  
  ('HR Business Partner', 'Human Resources',
   'Join our HR team as a Business Partner to support multiple departments. You will provide strategic HR guidance and manage employee relations.',
   ARRAY['Bachelor''s degree in HR or related field', '5+ years HR experience', 'Strong communication skills', 'HR certification preferred'],
   'open', CURRENT_DATE + INTERVAL '21 days'),
  
  ('Financial Analyst', 'Finance & Accounting',
   'We are looking for a Financial Analyst to support financial planning, analysis, and reporting activities.',
   ARRAY['Bachelor''s degree in Finance or Accounting', '3+ years financial analysis experience', 'Proficiency in Excel and financial modeling', 'CPA preferred'],
   'open', CURRENT_DATE + INTERVAL '25 days'),
  
  ('Marketing Manager', 'Marketing & Communications',
   'Lead our marketing initiatives and develop strategies to enhance brand awareness and drive business growth.',
   ARRAY['Bachelor''s degree in Marketing', '7+ years marketing experience', 'Digital marketing expertise', 'Strong analytical skills'],
   'open', CURRENT_DATE + INTERVAL '20 days'),
  
  ('IT Support Specialist', 'Information Technology',
   'Provide technical support to employees and maintain IT infrastructure. Troubleshoot hardware and software issues.',
   ARRAY['Associate degree in IT or related', '2+ years IT support experience', 'Knowledge of Windows/Mac OS', 'Excellent customer service skills'],
   'open', CURRENT_DATE + INTERVAL '15 days'),
  
  ('Project Manager', 'Project Management',
   'Manage multiple projects from initiation to completion. Coordinate resources and ensure timely delivery.',
   ARRAY['PMP certification preferred', '5+ years project management experience', 'Strong leadership skills', 'Experience with Agile methodologies'],
   'open', CURRENT_DATE + INTERVAL '28 days'),
  
  ('Data Scientist', 'Research & Development',
   'Analyze complex data sets to drive business insights and support decision-making processes.',
   ARRAY['Master''s degree in Data Science or related', '3+ years data science experience', 'Proficiency in Python/R', 'Machine learning expertise'],
   'open', CURRENT_DATE + INTERVAL '35 days'),
  
  ('Operations Coordinator', 'Administration',
   'Coordinate daily operations and support administrative functions across the organization.',
   ARRAY['Bachelor''s degree in Business or related', '2+ years operations experience', 'Strong organizational skills', 'Proficiency in MS Office'],
   'open', CURRENT_DATE + INTERVAL '18 days'),
  
  ('Safety Officer', 'Health, Safety & Environment',
   'Ensure workplace safety compliance and develop safety programs to protect employees.',
   ARRAY['OSHA certification', '3+ years safety experience', 'Knowledge of safety regulations', 'Strong attention to detail'],
   'open', CURRENT_DATE + INTERVAL '22 days'),
  
  ('Customer Support Agent', 'Customer Support',
   'Provide excellent customer service and resolve customer inquiries via phone, email, and chat.',
   ARRAY['High school diploma or equivalent', '1+ years customer service experience', 'Strong communication skills', 'Bilingual preferred'],
   'open', CURRENT_DATE + INTERVAL '12 days'),
  
  ('Senior Accountant', 'Finance & Accounting',
   'Manage accounting functions including financial reporting, budgeting, and compliance.',
   ARRAY['Bachelor''s degree in Accounting', '5+ years accounting experience', 'CPA required', 'Experience with ERP systems'],
   'closed', CURRENT_DATE - INTERVAL '5 days'),
  
  ('Product Designer', 'Research & Development',
   'Design user-centered products and create intuitive user experiences.',
   ARRAY['Bachelor''s degree in Design', '4+ years product design experience', 'Proficiency in Figma/Adobe XD', 'Portfolio required'],
   'closed', CURRENT_DATE - INTERVAL '10 days')
) AS job_data(title, department, description, requirements, status, closing_date)
CROSS JOIN LATERAL (
  SELECT id FROM public.user_profiles 
  WHERE department = 'Human Resources' 
  AND role IN ('hr_head', 'hr_officer')
  ORDER BY random() LIMIT 1
) hr_user
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. CANDIDATES (Recruitment Pipeline)
-- ============================================

INSERT INTO public.candidates (job_posting_id, name, email, phone, status, interview_date, notes, created_at)
SELECT 
  jp.id as job_posting_id,
  cand_data.name,
  cand_data.email,
  cand_data.phone,
  cand_data.status,
  CASE 
    WHEN cand_data.status IN ('interview', 'offer') THEN 
      (CURRENT_DATE + INTERVAL '7 days' + (random() * 14)::INTEGER * INTERVAL '1 day')::TIMESTAMPTZ
    ELSE NULL
  END as interview_date,
  cand_data.notes,
  (CURRENT_DATE - (random() * 180)::INTEGER * INTERVAL '1 day')::TIMESTAMPTZ as created_at
FROM (
  SELECT id FROM public.job_postings WHERE status = 'open' ORDER BY random() LIMIT 8
) jp
CROSS JOIN (VALUES
  ('John Martinez', 'john.martinez@example.com', '+1-555-0101', 'applied', 'Applied through company website. Strong background in software development.'),
  ('Sarah Chen', 'sarah.chen@example.com', '+1-555-0102', 'screening', 'Resume reviewed. Qualifications match requirements. Proceeding to screening.'),
  ('Michael Thompson', 'michael.thompson@example.com', '+1-555-0103', 'screening', 'Initial screening completed. Good communication skills.'),
  ('Emily Rodriguez', 'emily.rodriguez@example.com', '+1-555-0104', 'interview', 'Scheduled for technical interview. Strong technical background.'),
  ('David Kim', 'david.kim@example.com', '+1-555-0105', 'interview', 'First round interview completed. Positive feedback from interviewers.'),
  ('Jessica White', 'jessica.white@example.com', '+1-555-0106', 'interview', 'Final round interview scheduled. Excellent candidate.'),
  ('Robert Taylor', 'robert.taylor@example.com', '+1-555-0107', 'offer', 'All interviews completed. Extending offer. Expected start date: Next month.'),
  ('Amanda Brown', 'amanda.brown@example.com', '+1-555-0108', 'offer', 'Offer extended. Awaiting response.'),
  ('Christopher Lee', 'christopher.lee@example.com', '+1-555-0109', 'hired', 'Offer accepted. Onboarding scheduled.'),
  ('Maria Garcia', 'maria.garcia@example.com', '+1-555-0110', 'hired', 'Successfully hired. Started last month.'),
  ('James Wilson', 'james.wilson@example.com', '+1-555-0111', 'applied', 'Recent application. Resume under review.'),
  ('Patricia Moore', 'patricia.moore@example.com', '+1-555-0112', 'applied', 'Applied for position. Initial screening pending.'),
  ('Daniel Anderson', 'daniel.anderson@example.com', '+1-555-0113', 'screening', 'Screening in progress. Checking references.'),
  ('Lisa Jackson', 'lisa.jackson@example.com', '+1-555-0114', 'screening', 'Background check completed. Moving to interview stage.'),
  ('Matthew Harris', 'matthew.harris@example.com', '+1-555-0115', 'interview', 'Technical assessment completed. Scheduling interview.'),
  ('Nancy Clark', 'nancy.clark@example.com', '+1-555-0116', 'interview', 'Interview scheduled for next week.'),
  ('Mark Lewis', 'mark.lewis@example.com', '+1-555-0117', 'offer', 'Offer prepared. Awaiting management approval.'),
  ('Betty Walker', 'betty.walker@example.com', '+1-555-0118', 'hired', 'New employee. Onboarding completed.'),
  ('Donald Hall', 'donald.hall@example.com', '+1-555-0119', 'applied', 'Application received. Under review.'),
  ('Sandra Young', 'sandra.young@example.com', '+1-555-0120', 'applied', 'Recent application. Qualifications being assessed.')
) AS cand_data(name, email, phone, status, notes)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. TRAINING PROGRAMS
-- ============================================

INSERT INTO public.training_programs (title, description, category, duration, instructor, capacity, enrolled_count, status, start_date, end_date)
VALUES
  ('Leadership Development Program', 
   'Comprehensive program designed to develop leadership skills and management capabilities for current and future leaders.',
   'Leadership', 12, 'Dr. Jennifer Adams', 25, 18, 'upcoming', 
   CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE + INTERVAL '86 days'),
  
  ('Project Management Fundamentals', 
   'Learn essential project management skills including planning, execution, and risk management.',
   'Professional Development', 8, 'Kevin Brooks', 30, 24, 'upcoming',
   CURRENT_DATE + INTERVAL '21 days', CURRENT_DATE + INTERVAL '77 days'),
  
  ('Advanced Excel & Data Analysis', 
   'Master Excel functions, pivot tables, and data analysis techniques for business intelligence.',
   'Technical Skills', 6, 'Laura Chen', 20, 15, 'upcoming',
   CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '49 days'),
  
  ('Cybersecurity Awareness', 
   'Essential cybersecurity training to protect company data and systems from threats.',
   'Compliance & Safety', 4, 'Jason Miller', 50, 42, 'upcoming',
   CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '38 days'),
  
  ('Effective Communication Skills', 
   'Improve workplace communication through active listening, presentation skills, and conflict resolution.',
   'Soft Skills', 6, 'Sarah Johnson', 25, 20, 'upcoming',
   CURRENT_DATE + INTERVAL '28 days', CURRENT_DATE + INTERVAL '70 days'),
  
  ('Agile & Scrum Methodology', 
   'Learn Agile principles and Scrum framework for software development and project management.',
   'Professional Development', 10, 'Rachel Young', 20, 16, 'upcoming',
   CURRENT_DATE + INTERVAL '35 days', CURRENT_DATE + INTERVAL '105 days'),
  
  ('Financial Planning & Budgeting', 
   'Develop skills in financial planning, budgeting, and financial analysis for non-finance professionals.',
   'Finance', 8, 'Robert Smith', 30, 22, 'upcoming',
   CURRENT_DATE + INTERVAL '42 days', CURRENT_DATE + INTERVAL '98 days'),
  
  ('Diversity & Inclusion Workshop', 
   'Promote understanding of diversity, equity, and inclusion in the workplace.',
   'HR & Compliance', 4, 'Emily Carter', 40, 35, 'upcoming',
   CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '33 days'),
  
  ('Customer Service Excellence', 
   'Enhance customer service skills and learn techniques for handling difficult situations.',
   'Customer Service', 6, 'Jessica Morgan', 25, 19, 'upcoming',
   CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '57 days'),
  
  ('Time Management & Productivity', 
   'Learn strategies to manage time effectively and increase workplace productivity.',
   'Professional Development', 4, 'Daniel Perez', 30, 25, 'upcoming',
   CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '31 days'),
  
  ('Introduction to Data Science', 
   'Basic data science concepts and tools for business professionals.',
   'Technical Skills', 12, 'Harper Jones', 15, 12, 'completed',
   CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE - INTERVAL '6 days'),
  
  ('Workplace Safety Training', 
   'OSHA-compliant safety training for all employees.',
   'Compliance & Safety', 2, 'Richard Adams', 100, 95, 'completed',
   CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '58 days')
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. TRAINING ENROLLMENTS
-- ============================================

INSERT INTO public.training_enrollments (program_id, employee_id, status, completion_date, certificate_url)
SELECT 
  tp.id as program_id,
  e.id as employee_id,
  CASE 
    WHEN tp.status = 'completed' THEN 
      CASE WHEN random() < 0.85 THEN 'completed' ELSE 'enrolled' END
    ELSE 'enrolled'
  END as status,
  CASE 
    WHEN tp.status = 'completed' AND random() < 0.85 THEN 
      tp.end_date - (random() * 5)::INTEGER * INTERVAL '1 day'
    ELSE NULL
  END as completion_date,
  CASE 
    WHEN tp.status = 'completed' AND random() < 0.85 THEN 
      'https://certificates.company.com/' || replace(gen_random_uuid()::TEXT, '-', '')
    ELSE NULL
  END as certificate_url
FROM public.training_programs tp
CROSS JOIN LATERAL (
  SELECT id FROM public.employees 
  WHERE status = 'Active' 
  ORDER BY random() 
  LIMIT (tp.enrolled_count)
) e
WHERE tp.enrolled_count > 0
ON CONFLICT (program_id, employee_id) DO NOTHING;

-- ============================================
-- 5. PERFORMANCE REVIEWS
-- ============================================

INSERT INTO public.performance_reviews (employee_id, reviewer_id, period, rating, comments, goals, status)
SELECT 
  e.id as employee_id,
  reviewer.id as reviewer_id,
  review_data.period,
  review_data.rating,
  review_data.comments,
  review_data.goals::TEXT[],
  review_data.status
FROM (
  SELECT id FROM public.employees 
  WHERE status = 'Active' 
  ORDER BY random() 
  LIMIT 30
) e
CROSS JOIN LATERAL (
  SELECT id FROM public.user_profiles 
  WHERE role IN ('dept_manager', 'hr_head', 'hr_officer', 'super_admin')
  ORDER BY random() 
  LIMIT 1
) reviewer
CROSS JOIN (VALUES
  ('Q4 2024', 5, 'Outstanding performance throughout the quarter. Exceeded all goals and demonstrated strong leadership.', 
   ARRAY['Continue mentoring junior team members', 'Lead new project initiative', 'Complete advanced certification'],
   'draft'),
  ('Q4 2024', 4, 'Strong performance with consistent delivery. Met all objectives and contributed positively to team.',
   ARRAY['Improve cross-department collaboration', 'Take on additional responsibilities', 'Enhance technical skills'],
   'draft'),
  ('Q4 2024', 4, 'Good performance overall. Met most expectations and showed improvement in key areas.',
   ARRAY['Focus on time management', 'Strengthen communication skills', 'Complete assigned training programs'],
   'draft'),
  ('Q3 2024', 5, 'Exceptional work this quarter. Went above and beyond expectations.',
   ARRAY['Maintain high performance standards', 'Share best practices with team', 'Pursue leadership opportunities'],
   'submitted'),
  ('Q3 2024', 3, 'Satisfactory performance. Some areas need improvement.',
   ARRAY['Improve project delivery timelines', 'Enhance technical knowledge', 'Increase team collaboration'],
   'submitted'),
  ('Annual 2024', 4, 'Solid annual performance. Consistent contributor to team success.',
   ARRAY['Develop leadership capabilities', 'Expand skill set', 'Mentor new team members'],
   'submitted')
) AS review_data(period, rating, comments, goals, status)
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. ADDITIONAL LEAVE REQUESTS
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
  SELECT id, name FROM public.employees 
  WHERE status = 'Active' 
  ORDER BY random() 
  LIMIT 15
) e
CROSS JOIN (VALUES
  ('Vacation', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE + INTERVAL '15 days', 5, 'Pending', 'Family vacation'),
  ('Sick', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '6 days', 2, 'Pending', 'Medical appointment'),
  ('Personal', CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE + INTERVAL '20 days', 1, 'Pending', 'Personal matter'),
  ('Vacation', CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '37 days', 6, 'Pending', 'Holiday travel'),
  ('Sick', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '4 days', 2, 'Pending', 'Illness'),
  ('Vacation', CURRENT_DATE + INTERVAL '45 days', CURRENT_DATE + INTERVAL '52 days', 6, 'Pending', 'Family event'),
  ('Personal', CURRENT_DATE + INTERVAL '12 days', CURRENT_DATE + INTERVAL '12 days', 1, 'Pending', 'Personal appointment'),
  ('Vacation', CURRENT_DATE + INTERVAL '25 days', CURRENT_DATE + INTERVAL '29 days', 4, 'Pending', 'Rest and relaxation'),
  ('Sick', CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '8 days', 2, 'Pending', 'Medical procedure'),
  ('Vacation', CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE + INTERVAL '67 days', 6, 'Pending', 'Summer vacation'),
  ('Personal', CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '15 days', 1, 'Pending', 'Personal day'),
  ('Vacation', CURRENT_DATE + INTERVAL '40 days', CURRENT_DATE + INTERVAL '44 days', 4, 'Pending', 'Long weekend'),
  ('Sick', CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '3 days', 2, 'Pending', 'Recovery'),
  ('Vacation', CURRENT_DATE + INTERVAL '50 days', CURRENT_DATE + INTERVAL '56 days', 5, 'Pending', 'Holiday break'),
  ('Personal', CURRENT_DATE + INTERVAL '18 days', CURRENT_DATE + INTERVAL '18 days', 1, 'Pending', 'Personal commitment')
) AS leave_data(type, from_date, to_date, days, status, reason)
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. HR PROJECTS
-- ============================================

INSERT INTO public.projects (name, department, status, progress, description, budget, owner_id, owner_name, due_date)
SELECT 
  project_data.name,
  'Human Resources' as department,
  project_data.status,
  project_data.progress,
  project_data.description,
  project_data.budget,
  hr_employee.id as owner_id,
  hr_employee.name as owner_name,
  project_data.due_date::DATE
FROM (VALUES
  ('Q1 2025 Recruitment Drive', 'Active', 45, 
   'Comprehensive recruitment campaign to fill 15 open positions across various departments.',
   50000.00, CURRENT_DATE + INTERVAL '60 days'),
  
  ('Employee Onboarding System Implementation', 'Active', 70,
   'Implement new automated onboarding system to streamline new hire processes.',
   75000.00, CURRENT_DATE + INTERVAL '45 days'),
  
  ('Annual Performance Review Cycle 2025', 'Planning', 10,
   'Prepare and execute annual performance review process for all employees.',
   15000.00, CURRENT_DATE + INTERVAL '90 days'),
  
  ('Training Program Development', 'Active', 60,
   'Develop and launch 10 new training programs covering leadership, technical skills, and compliance.',
   100000.00, CURRENT_DATE + INTERVAL '75 days'),
  
  ('HR Policy Update Project', 'Active', 35,
   'Review and update all HR policies to ensure compliance with latest regulations.',
   25000.00, CURRENT_DATE + INTERVAL '50 days'),
  
  ('Employee Engagement Survey 2025', 'Planning', 5,
   'Conduct comprehensive employee engagement survey and analyze results.',
   20000.00, CURRENT_DATE + INTERVAL '30 days'),
  
  ('Benefits Optimization Initiative', 'Active', 55,
   'Review and optimize employee benefits package to improve satisfaction and retention.',
   150000.00, CURRENT_DATE + INTERVAL '120 days'),
  
  ('Diversity & Inclusion Program Launch', 'Active', 40,
   'Launch new diversity and inclusion initiatives and training programs.',
   60000.00, CURRENT_DATE + INTERVAL '80 days')
) AS project_data(name, status, progress, description, budget, due_date)
CROSS JOIN LATERAL (
  SELECT e.id, e.name FROM public.employees e
  JOIN public.user_profiles up ON e.user_id = up.id
  WHERE e.department = 'Human Resources' 
  AND e.status = 'Active'
  AND up.role IN ('hr_head', 'hr_officer')
  ORDER BY random() 
  LIMIT 1
) hr_employee
ON CONFLICT DO NOTHING;

-- ============================================
-- SUMMARY
-- ============================================

DO $$
DECLARE
  v_job_postings INTEGER;
  v_candidates INTEGER;
  v_training_programs INTEGER;
  v_training_enrollments INTEGER;
  v_performance_reviews INTEGER;
  v_leave_requests INTEGER;
  v_hr_projects INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_job_postings FROM public.job_postings;
  SELECT COUNT(*) INTO v_candidates FROM public.candidates;
  SELECT COUNT(*) INTO v_training_programs FROM public.training_programs;
  SELECT COUNT(*) INTO v_training_enrollments FROM public.training_enrollments;
  SELECT COUNT(*) INTO v_performance_reviews FROM public.performance_reviews;
  SELECT COUNT(*) INTO v_leave_requests FROM public.leave_requests;
  SELECT COUNT(*) INTO v_hr_projects FROM public.projects WHERE department = 'Human Resources';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'HR Data Seeding Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Job Postings: %', v_job_postings;
  RAISE NOTICE 'Candidates: %', v_candidates;
  RAISE NOTICE 'Training Programs: %', v_training_programs;
  RAISE NOTICE 'Training Enrollments: %', v_training_enrollments;
  RAISE NOTICE 'Performance Reviews: %', v_performance_reviews;
  RAISE NOTICE 'Leave Requests: %', v_leave_requests;
  RAISE NOTICE 'HR Projects: %', v_hr_projects;
  RAISE NOTICE '========================================';
END $$;

