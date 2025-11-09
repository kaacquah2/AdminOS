// ============================================
// AdminOS - Create Sample Users via Supabase Admin API
// ============================================
// This script creates 85 sample users in Supabase Auth
// Format: Firstname.Lastname@company.com
// Default Password: AdminOS@2025 (must be changed on first login)
//
// Usage: node supabase/create-sample-users.js
//
// ⚠️ SECURITY NOTE: 
// - These are sample credentials for development/testing only
// - Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
// - Run this AFTER running the SQL migration script
// ============================================

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// Create Supabase Admin Client (requires service role key)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Default password for all users
const DEFAULT_PASSWORD = 'AdminOS@2025'

// Helper function to generate random phone number
function generatePhoneNumber() {
  const area = Math.floor(Math.random() * 900 + 100).toString().padStart(3, '0')
  const exchange = Math.floor(Math.random() * 900 + 100).toString().padStart(3, '0')
  const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `+1-${area}-${exchange}-${number}`
}

// Helper function to generate sample address
function generateAddress(email) {
  const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const addresses = [
    `123 Main Street, Suite ${(hash % 100) + 1}, New York, NY 10001`,
    `456 Oak Avenue, Apt ${(hash % 50) + 1}, Los Angeles, CA 90001`,
    `789 Pine Road, Unit ${(hash % 30) + 1}, Chicago, IL 60601`,
    `321 Elm Street, Floor ${(hash % 10) + 1}, Houston, TX 77001`,
    `555 Maple Drive, #${(hash % 25) + 1}, Phoenix, AZ 85001`
  ]
  return addresses[hash % 5]
}

// Helper function to generate emergency contact
function generateEmergencyContact(fullName, email) {
  const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const nameParts = fullName.split(' ')
  
  if (hash % 3 === 0) {
    // Spouse
    const spouseName = nameParts.length > 1 
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1]} (Spouse)`
      : `${fullName} (Spouse)`
    return `${spouseName} - ${generatePhoneNumber()}`
  } else if (hash % 3 === 1) {
    // Parent
    const parentName = nameParts.length > 1
      ? `Mr./Mrs. ${nameParts[nameParts.length - 1]} (Parent)`
      : `${fullName} (Parent)`
    return `${parentName} - ${generatePhoneNumber()}`
  } else {
    // Relative
    return `Emergency Contact: ${fullName} (Relative) - ${generatePhoneNumber()}`
  }
}

// User data structure: [Name, Email, Username, Department, Position, Role]
const users = [
  // 1. HUMAN RESOURCES (HR DEPARTMENT)
  ['Sarah Johnson', 'sarah.johnson@company.com', 'sjohnson', 'Human Resources', 'HR Head', 'hr_head'],
  ['Daniel Perez', 'daniel.perez@company.com', 'dperez', 'Human Resources', 'HR Officer', 'hr_officer'],
  ['Emily Carter', 'emily.carter@company.com', 'ecarter', 'Human Resources', 'HR Officer', 'hr_officer'],
  ['Michael Nguyen', 'michael.nguyen@company.com', 'mnguyen', 'Human Resources', 'HR Assistant', 'employee'],
  ['Olivia Kim', 'olivia.kim@company.com', 'okim', 'Human Resources', 'HR Intern', 'employee'],
  
  // 2. FINANCE & ACCOUNTING
  ['Robert Smith', 'robert.smith@company.com', 'rsmith', 'Finance & Accounting', 'Finance Director', 'finance_director'],
  ['Priya Patel', 'priya.patel@company.com', 'ppatel', 'Finance & Accounting', 'Accountant', 'accountant'],
  ['Ahmed Hassan', 'ahmed.hassan@company.com', 'ahassan', 'Finance & Accounting', 'Accounts Officer', 'accountant'],
  ['Laura Chen', 'laura.chen@company.com', 'lchen', 'Finance & Accounting', 'Finance Analyst', 'employee'],
  ['Henry Davis', 'henry.davis@company.com', 'hdavis', 'Finance & Accounting', 'Accounts Assistant', 'employee'],
  
  // 3. ADMINISTRATION / OPERATIONS
  ['Anthony Brown', 'anthony.brown@company.com', 'abrown', 'Administration', 'Admin Head', 'dept_manager'],
  ['Grace Lee', 'grace.lee@company.com', 'glee', 'Administration', 'Admin Officer', 'employee'],
  ['Carlos Gomez', 'carlos.gomez@company.com', 'cgomez', 'Administration', 'Operations Coordinator', 'employee'],
  ['Megan White', 'megan.white@company.com', 'mwhite', 'Administration', 'Admin Assistant', 'employee'],
  ['Raj Kumar', 'raj.kumar@company.com', 'rkumar', 'Administration', 'Office Support Staff', 'employee'],
  
  // 4. INFORMATION TECHNOLOGY (IT)
  ['Jason Miller', 'jason.miller@company.com', 'jmiller', 'Information Technology', 'IT Manager', 'dept_manager'],
  ['Alice Wong', 'alice.wong@company.com', 'awong', 'Information Technology', 'IT Support Lead', 'employee'],
  ['Thomas Allen', 'thomas.allen@company.com', 'tallen', 'Information Technology', 'Network Engineer', 'employee'],
  ['Nia Rodriguez', 'nia.rodriguez@company.com', 'nrodriguez', 'Information Technology', 'System Admin', 'employee'],
  ['Peter Osei', 'peter.osei@company.com', 'posei', 'Information Technology', 'IT Technician', 'employee'],
  
  // 5. PROCUREMENT / PURCHASING
  ['Maria Fernandez', 'maria.fernandez@company.com', 'mfernandez', 'Procurement', 'Procurement Head', 'procurement_officer'],
  ['Victor Gomez', 'victor.gomez@company.com', 'vgomez', 'Procurement', 'Procurement Officer', 'procurement_officer'],
  ['Zoe Adams', 'zoe.adams@company.com', 'zadams', 'Procurement', 'Vendor Coordinator', 'employee'],
  ['Ethan Clarke', 'ethan.clarke@company.com', 'eclarke', 'Procurement', 'Purchase Analyst', 'employee'],
  ['Linda Zhao', 'linda.zhao@company.com', 'lzhao', 'Procurement', 'Procurement Assistant', 'employee'],
  
  // 6. FACILITIES & MAINTENANCE
  ['Patrick Collins', 'patrick.collins@company.com', 'pcollins', 'Facilities & Maintenance', 'Facilities Head', 'facilities_manager'],
  ['Sonia Rivera', 'sonia.rivera@company.com', 'srivera', 'Facilities & Maintenance', 'Maintenance Supervisor', 'employee'],
  ['George Li', 'george.li@company.com', 'gli', 'Facilities & Maintenance', 'Maintenance Technician', 'employee'],
  ['Chloe Brown', 'chloe.brown@company.com', 'cbrown', 'Facilities & Maintenance', 'Scheduler', 'employee'],
  ['Alex Novak', 'alex.novak@company.com', 'anovak', 'Facilities & Maintenance', 'Custodian', 'employee'],
  
  // 7. LEGAL & COMPLIANCE
  ['Laura Martinez', 'laura.martinez@company.com', 'lmartinez', 'Legal & Compliance', 'Legal Officer', 'compliance_officer'],
  ['David Green', 'david.green@company.com', 'dgreen', 'Legal & Compliance', 'Compliance Officer', 'compliance_officer'],
  ['Anna Park', 'anna.park@company.com', 'apark', 'Legal & Compliance', 'Paralegal', 'employee'],
  ['John Fraser', 'john.fraser@company.com', 'jfraser', 'Legal & Compliance', 'Legal Analyst', 'employee'],
  ['Maya Desai', 'maya.desai@company.com', 'mdesai', 'Legal & Compliance', 'Legal Assistant', 'employee'],
  
  // 8. EXECUTIVE MANAGEMENT
  ['Emma Williams', 'emma.williams@company.com', 'ewilliams', 'Executive Management', 'CEO', 'super_admin'],
  ['Benjamin Scott', 'benjamin.scott@company.com', 'bscott', 'Executive Management', 'CFO', 'dept_manager'],
  ['Isabella Rossi', 'isabella.rossi@company.com', 'irossi', 'Executive Management', 'COO', 'dept_manager'],
  ['David Kim', 'david.kim@company.com', 'dkim', 'Executive Management', 'Executive Assistant', 'employee'],
  ['Olivia Jones', 'olivia.jones@company.com', 'ojones', 'Executive Management', 'Strategy Analyst', 'employee'],
  
  // 9. PROJECT MANAGEMENT / PMO
  ['Kevin Brooks', 'kevin.brooks@company.com', 'kbrooks', 'Project Management', 'PMO Head', 'dept_manager'],
  ['Rachel Young', 'rachel.young@company.com', 'ryoung', 'Project Management', 'Project Manager', 'employee'],
  ['Mark Taylor', 'mark.taylor@company.com', 'mtaylor', 'Project Management', 'Project Coordinator', 'employee'],
  ['Hannah Reed', 'hannah.reed@company.com', 'hreed', 'Project Management', 'Scheduler', 'employee'],
  ['Brian Singh', 'brian.singh@company.com', 'bsingh', 'Project Management', 'PM Assistant', 'employee'],
  
  // 10. MARKETING & COMMUNICATIONS
  ['Natalie Brown', 'natalie.brown@company.com', 'nbrown', 'Marketing & Communications', 'Marketing Head', 'dept_manager'],
  ['Omar Ali', 'omar.ali@company.com', 'oali', 'Marketing & Communications', 'Communications Officer', 'employee'],
  ['Lisa Chen', 'lisa.chen@company.com', 'lchen2', 'Marketing & Communications', 'Marketing Designer', 'employee'],
  ['Daniel Lee', 'daniel.lee@company.com', 'dlee', 'Marketing & Communications', 'PR Specialist', 'employee'],
  ['Grace Patel', 'grace.patel@company.com', 'gpatel', 'Marketing & Communications', 'Social Media Coordinator', 'employee'],
  
  // 11. TRAINING & DEVELOPMENT
  ['Karen Roberts', 'karen.roberts@company.com', 'kroberts', 'Training & Development', 'L&D Head', 'dept_manager'],
  ['Tim Evans', 'tim.evans@company.com', 'tevans', 'Training & Development', 'Trainer', 'employee'],
  ['Sara Lopez', 'sara.lopez@company.com', 'slopez', 'Training & Development', 'L&D Specialist', 'employee'],
  ['William Carter', 'william.carter@company.com', 'wcarter', 'Training & Development', 'Course Developer', 'employee'],
  ['Lily Nguyen', 'lily.nguyen@company.com', 'lnguyen', 'Training & Development', 'Learning Assistant', 'employee'],
  
  // 12. CUSTOMER SUPPORT / CLIENT SERVICES
  ['Jessica Morgan', 'jessica.morgan@company.com', 'jmorgan', 'Customer Support', 'Support Manager', 'dept_manager'],
  ['Jacob Ross', 'jacob.ross@company.com', 'jross', 'Customer Support', 'Support Agent', 'employee'],
  ['Fatima Khan', 'fatima.khan@company.com', 'fkhan', 'Customer Support', 'Support Agent', 'employee'],
  ['Noah White', 'noah.white@company.com', 'nwhite', 'Customer Support', 'QA Specialist', 'employee'],
  ['Chloe Davis', 'chloe.davis@company.com', 'cdavis', 'Customer Support', 'Support Assistant', 'employee'],
  
  // 13. HEALTH, SAFETY & ENVIRONMENT (HSE)
  ['Richard Adams', 'richard.adams@company.com', 'radams', 'Health, Safety & Environment', 'HSE Manager', 'dept_manager'],
  ['Stella Brown', 'stella.brown@company.com', 'sbrown', 'Health, Safety & Environment', 'Safety Officer', 'compliance_officer'],
  ['Ivan Petrov', 'ivan.petrov@company.com', 'ipetrov', 'Health, Safety & Environment', 'Compliance Specialist', 'employee'],
  ['Julia Green', 'julia.green@company.com', 'jgreen', 'Health, Safety & Environment', 'Risk Analyst', 'employee'],
  ['Ethan Moore', 'ethan.moore@company.com', 'emoore', 'Health, Safety & Environment', 'Safety Assistant', 'employee'],
  
  // 14. CSR / SUSTAINABILITY
  ['Mia Hernandez', 'mia.hernandez@company.com', 'mhernandez', 'CSR / Sustainability', 'CSR Manager', 'dept_manager'],
  ['Jack Wilson', 'jack.wilson@company.com', 'jwilson', 'CSR / Sustainability', 'CSR Coordinator', 'employee'],
  ['Sofia Lee', 'sofia.lee@company.com', 'slee', 'CSR / Sustainability', 'CSR Analyst', 'employee'],
  ['Luke Parker', 'luke.parker@company.com', 'lparker', 'CSR / Sustainability', 'CSR Officer', 'employee'],
  ['Nora Ahmed', 'nora.ahmed@company.com', 'nahmed', 'CSR / Sustainability', 'CSR Assistant', 'employee'],
  
  // 15. SECURITY & ACCESS CONTROL
  ['Samuel Carter', 'samuel.carter@company.com', 'scarter', 'Security & Access Control', 'Security Head', 'dept_manager'],
  ['Ivan Lopez', 'ivan.lopez@company.com', 'ilopez', 'Security & Access Control', 'Security Officer', 'employee'],
  ['Rachel Stone', 'rachel.stone@company.com', 'rstone', 'Security & Access Control', 'Access Controller', 'employee'],
  ['Kevin Young', 'kevin.young@company.com', 'kyoung', 'Security & Access Control', 'Surveillance Operator', 'employee'],
  ['Oscar Rivera', 'oscar.rivera@company.com', 'orivera', 'Security & Access Control', 'Security Guard', 'employee'],
  
  // 16. RESEARCH & DEVELOPMENT (R&D)
  ['Amelia Clark', 'amelia.clark@company.com', 'aclark', 'Research & Development', 'R&D Head', 'dept_manager'],
  ['Leo Murphy', 'leo.murphy@company.com', 'lmurphy', 'Research & Development', 'Research Engineer', 'employee'],
  ['Harper Jones', 'harper.jones@company.com', 'hjones', 'Research & Development', 'Data Scientist', 'employee'],
  ['Oliver Brown', 'oliver.brown@company.com', 'obrown', 'Research & Development', 'Lab Technician', 'employee'],
  ['Eva Patel', 'eva.patel@company.com', 'epatel', 'Research & Development', 'Research Assistant', 'employee'],
  
  // 17. EMPLOYEE WELLNESS & ENGAGEMENT
  ['Michelle Davis', 'michelle.davis@company.com', 'mdavis', 'Employee Wellness & Engagement', 'Wellness Manager', 'dept_manager'],
  ['Ryan Chen', 'ryan.chen@company.com', 'rchen', 'Employee Wellness & Engagement', 'Wellness Coordinator', 'employee'],
  ['Zoe Turner', 'zoe.turner@company.com', 'zturner', 'Employee Wellness & Engagement', 'HR Liaison', 'employee'],
  ['Dylan Scott', 'dylan.scott@company.com', 'dscott', 'Employee Wellness & Engagement', 'Event Planner', 'employee'],
  ['Ava Reed', 'ava.reed@company.com', 'areed', 'Employee Wellness & Engagement', 'Wellness Assistant', 'employee']
]

async function createUsers() {
  console.log('🚀 Starting user creation process...\n')
  console.log(`📊 Total users to create: ${users.length}\n`)
  
  let successCount = 0
  let errorCount = 0
  const errors = []
  
  for (let i = 0; i < users.length; i++) {
    const [fullName, email, username, department, position, role] = users[i]
    
    try {
      console.log(`[${i + 1}/${users.length}] Creating: ${fullName} (${email})...`)
      
      // Create auth user via Admin API
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: DEFAULT_PASSWORD,
        email_confirm: true, // Auto-confirm email for development
        user_metadata: {
          full_name: fullName,
          username: username,
          department: department,
          position: position,
          role: role
        }
      })
      
      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`   ⚠️  User already exists, skipping...`)
          // Update existing user profile
          const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email)
          if (existingUser?.user) {
            await updateUserProfile(existingUser.user.id, fullName, email, department, position, role)
            successCount++
          } else {
            errors.push({ email, error: 'User exists but cannot fetch' })
            errorCount++
          }
        } else {
          throw authError
        }
      } else {
        // Update user profile with auth user ID
        await updateUserProfile(authUser.user.id, fullName, email, department, position, role)
        successCount++
        console.log(`   ✅ Created successfully`)
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`)
      errors.push({ email, error: error.message })
      errorCount++
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Successfully created/updated: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📝 Total processed: ${users.length}`)
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS:')
    errors.forEach(({ email, error }) => {
      console.log(`   - ${email}: ${error}`)
    })
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('🔐 LOGIN CREDENTIALS')
  console.log('='.repeat(50))
  console.log(`📧 Email format: firstname.lastname@company.com`)
  console.log(`🔑 Default password: ${DEFAULT_PASSWORD}`)
  console.log(`⚠️  All users must change password on first login`)
  console.log(`\n💡 Tip: Users can log in immediately (emails are auto-confirmed)`)
  console.log('='.repeat(50))
}

async function updateUserProfile(userId, fullName, email, department, position, role) {
  // Update user_profiles table to link with auth user
  const { error } = await supabaseAdmin
    .from('user_profiles')
    .upsert({
      id: userId,
      email: email,
      full_name: fullName,
      department: department,
      position: position,
      role: role,
      is_active: true
    }, {
      onConflict: 'id'
    })
  
  if (error) {
    console.warn(`   ⚠️  Could not update user_profile: ${error.message}`)
  }
  
  // Generate random join date within last 4 years
  const joinDate = new Date()
  joinDate.setFullYear(joinDate.getFullYear() - Math.floor(Math.random() * 4 + 1))
  joinDate.setMonth(Math.floor(Math.random() * 12))
  joinDate.setDate(Math.floor(Math.random() * 28) + 1)
  
  // Update employees table with complete HR data
  const { error: empError } = await supabaseAdmin
    .from('employees')
    .upsert({
      user_id: userId,
      name: fullName,
      email: email,
      department: department,
      role: position,
      status: 'Active',
      join_date: joinDate.toISOString().split('T')[0],
      phone: generatePhoneNumber(),
      address: generateAddress(email),
      emergency_contact: generateEmergencyContact(fullName, email)
    }, {
      onConflict: 'email'
    })
  
  if (empError) {
    console.warn(`   ⚠️  Could not update employee record: ${empError.message}`)
  }
}

// Run the script
createUsers().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

