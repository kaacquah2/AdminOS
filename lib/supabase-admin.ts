import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role key
// This bypasses RLS and should ONLY be used in API routes or server components
// NEVER expose this key to the client!

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Supabase Service Role Key must be set in environment variables for admin operations')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Admin-only functions that bypass RLS
export async function adminCreateUser(userData: {
  email: string
  password: string
  email_confirmed?: boolean
  user_metadata?: Record<string, any>
}) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: userData.email_confirmed ?? true,
    user_metadata: userData.user_metadata
  })

  if (error) throw error
  return data
}

export async function adminDeleteUser(userId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) throw error
  return data
}

export async function adminUpdateUser(userId: string, updates: {
  email?: string
  password?: string
  email_confirm?: boolean
  user_metadata?: Record<string, any>
}) {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, updates)
  if (error) throw error
  return data
}

export async function adminGetUser(userId: string) {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (error) throw error
  return data
}

export async function adminListUsers(page = 1, perPage = 50) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page,
    perPage
  })
  if (error) throw error
  return data
}

// Bypass RLS for admin queries
export async function adminQuery(table: string, query: string = '*') {
  const { data, error } = await supabaseAdmin.from(table).select(query)
  if (error) throw error
  return data
}

export async function adminInsert(table: string, records: any | any[]) {
  const { data, error } = await supabaseAdmin.from(table).insert(records).select()
  if (error) throw error
  return data
}

export async function adminUpdate(table: string, updates: any, filter: Record<string, any>) {
  let query = supabaseAdmin.from(table).update(updates)
  
  Object.entries(filter).forEach(([key, value]) => {
    query = query.eq(key, value)
  })
  
  const { data, error } = await query.select()
  if (error) throw error
  return data
}

export async function adminDelete(table: string, filter: Record<string, any>) {
  let query = supabaseAdmin.from(table).delete()
  
  Object.entries(filter).forEach(([key, value]) => {
    query = query.eq(key, value)
  })
  
  const { data, error } = await query
  if (error) throw error
  return data
}

