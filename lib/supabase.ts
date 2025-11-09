import { createClient } from '@supabase/supabase-js'

// These should be set in your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL and Anon Key must be set in environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function to get the current user profile
// Optimized: Uses session user ID directly when available
export async function getCurrentUserProfile(userId?: string) {
  let userIdToUse = userId
  
  if (!userIdToUse) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    userIdToUse = user.id
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userIdToUse)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return profile
}

// Helper function to check if user has permission
export async function checkPermission(permission: string): Promise<boolean> {
  const profile = await getCurrentUserProfile()
  if (!profile) return false
  
  return profile.permissions?.includes(permission) || profile.role === 'super_admin'
}

// Helper function to check if user has role
export async function checkRole(role: string): Promise<boolean> {
  const profile = await getCurrentUserProfile()
  if (!profile) return false
  
  return profile.role === role || profile.role === 'super_admin'
}

