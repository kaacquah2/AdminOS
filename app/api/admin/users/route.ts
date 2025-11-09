import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, adminCreateUser, adminDeleteUser, adminUpdateUser, adminGetUser, adminListUsers } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

// Helper to verify admin access
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { error: 'Unauthorized', user: null }
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { error: 'Invalid token', user: null }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    return { error: 'Forbidden - Admin access required', user: null }
  }

  return { error: null, user }
}

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await verifyAdmin(request)
    if (error) {
      return NextResponse.json({ error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '50')

    const users = await adminListUsers(page, perPage)
    return NextResponse.json({ users })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/admin/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const { error, user } = await verifyAdmin(request)
    if (error) {
      return NextResponse.json({ error }, { status: 401 })
    }

    const body = await request.json()
    const { email, password, email_confirmed, user_metadata, profile_data } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Create auth user
    const authUser = await adminCreateUser({
      email,
      password,
      email_confirmed: email_confirmed ?? true,
      user_metadata
    })

    // Create user profile if profile_data is provided
    if (profile_data && authUser.user) {
      const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
        id: authUser.user.id,
        email: authUser.user.email,
        full_name: profile_data.fullName || profile_data.full_name,
        department: profile_data.department,
        position: profile_data.position,
        role: profile_data.role || 'employee',
        permissions: profile_data.permissions || [],
        accessible_modules: profile_data.accessibleModules || profile_data.accessible_modules || [],
        is_active: profile_data.isActive ?? true
      })

      if (profileError) {
        // Rollback: delete auth user if profile creation fails
        await adminDeleteUser(authUser.user.id)
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ user: authUser.user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/admin/users/[id] - Update a user
export async function PUT(request: NextRequest) {
  try {
    const { error, user } = await verifyAdmin(request)
    if (error) {
      return NextResponse.json({ error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { email, password, email_confirm, user_metadata, profile_data } = body

    // Update auth user if auth fields are provided
    if (email || password || email_confirm !== undefined || user_metadata) {
      await adminUpdateUser(userId, {
        email,
        password,
        email_confirm,
        user_metadata
      })
    }

    // Update profile if profile_data is provided
    if (profile_data) {
      const updateData: any = {}
      if (profile_data.fullName || profile_data.full_name) updateData.full_name = profile_data.fullName || profile_data.full_name
      if (profile_data.department) updateData.department = profile_data.department
      if (profile_data.position) updateData.position = profile_data.position
      if (profile_data.role) updateData.role = profile_data.role
      if (profile_data.permissions) updateData.permissions = profile_data.permissions
      if (profile_data.accessibleModules || profile_data.accessible_modules) {
        updateData.accessible_modules = profile_data.accessibleModules || profile_data.accessible_modules
      }
      if (profile_data.isActive !== undefined) updateData.is_active = profile_data.isActive

      await supabaseAdmin.from('user_profiles').update(updateData).eq('id', userId)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] - Delete a user
export async function DELETE(request: NextRequest) {
  try {
    const { error, user } = await verifyAdmin(request)
    if (error) {
      return NextResponse.json({ error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    await adminDeleteUser(userId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

