// Create Storage Bucket RLS Policies Script
// This script uses Supabase Management API to execute SQL
// Usage: node supabase/create-storage-policies.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// Read the SQL file
const fs = require('fs')
const path = require('path')

let policiesSQL
try {
  policiesSQL = fs.readFileSync(
    path.join(__dirname, 'storage-buckets.sql'),
    'utf8'
  )
} catch (error) {
  console.error('Could not read storage-buckets.sql file')
  process.exit(1)
}

async function createPolicies() {
  console.log('Attempting to create storage RLS policies...\n')
  console.log('⚠️  Note: Supabase requires SQL to be executed via SQL Editor.\n')
  console.log('📋 SQL Script Location: supabase/storage-buckets.sql\n')
  console.log('📝 Manual Steps Required:\n')
  console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard')
  console.log('2. Select your project')
  console.log('3. Navigate to SQL Editor (left sidebar)')
  console.log('4. Click "New query"')
  console.log('5. Copy the entire contents of supabase/storage-buckets.sql')
  console.log('6. Paste into the SQL Editor')
  console.log('7. Click "Run" or press Ctrl+Enter\n')
  console.log('💡 Tip: Make sure you\'re logged in as the project owner/creator')
  console.log('   (Check Settings > General to verify)\n')
  
  // Try to use PostgREST REST API directly
  console.log('🔄 Attempting alternative method...\n')
  
  try {
    // Extract project ID from URL
    const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
    
    if (!projectId) {
      console.log('❌ Could not extract project ID from URL')
      console.log('\n✅ Please follow the manual steps above.')
      return
    }

    // Try using Supabase Management API
    const managementUrl = `https://api.supabase.com/v1/projects/${projectId}/sql`
    
    // Split SQL into individual statements
    const statements = policiesSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`)
    console.log('⚠️  Management API requires authentication token (not service role key)')
    console.log('📝 Manual execution is required\n')
    
    console.log('✅ Summary:')
    console.log(`   - Project URL: ${supabaseUrl}`)
    console.log(`   - Project ID: ${projectId}`)
    console.log(`   - SQL file: supabase/storage-buckets.sql`)
    console.log(`   - Statements: ${statements.length}`)
    console.log('\n🎯 Next step: Run the SQL manually in Supabase Dashboard > SQL Editor')
    
  } catch (error) {
    console.error('Error:', error.message)
    console.log('\n✅ Please follow the manual steps above.')
  }
}

createPolicies().catch(console.error)
