// Create Storage Buckets Script
// Run this script to create all storage buckets using the Supabase Admin API
// Usage: node supabase/create-buckets.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const buckets = [
  {
    id: 'avatars',
    name: 'avatars',
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  {
    id: 'receipts',
    name: 'receipts',
    public: false,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf']
  },
  {
    id: 'attachments',
    name: 'attachments',
    public: false,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.*', 'text/*', 'application/zip']
  },
  {
    id: 'documents',
    name: 'documents',
    public: false,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
  },
  {
    id: 'resumes',
    name: 'resumes',
    public: false,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  {
    id: 'certificates',
    name: 'certificates',
    public: false,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf']
  },
  {
    id: 'assets',
    name: 'assets',
    public: false,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.*']
  },
  {
    id: 'audit',
    name: 'audit',
    public: false,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.*', 'image/*', 'application/zip']
  }
]

async function createBuckets() {
  console.log('Creating storage buckets...\n')

  for (const bucket of buckets) {
    try {
      // Check if bucket already exists
      const { data: existingBuckets } = await supabase.storage.listBuckets()
      const exists = existingBuckets?.some(b => b.id === bucket.id)

      if (exists) {
        console.log(`✓ Bucket "${bucket.id}" already exists, skipping...`)
        continue
      }

      // Create bucket
      const { data, error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes
      })

      if (error) {
        console.error(`✗ Failed to create bucket "${bucket.id}":`, error.message)
      } else {
        console.log(`✓ Created bucket "${bucket.id}" (${bucket.public ? 'public' : 'private'})`)
      }
    } catch (error) {
      console.error(`✗ Error creating bucket "${bucket.id}":`, error.message)
    }
  }

  console.log('\n✅ Bucket creation completed!')
  console.log('\nNext steps:')
  console.log('1. Run the storage-buckets.sql script in Supabase SQL Editor to create RLS policies')
  console.log('2. Verify buckets in Supabase Dashboard > Storage')
}

createBuckets().catch(console.error)

