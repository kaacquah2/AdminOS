import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
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

// GET /api/admin/data/[table] - Query any table (bypasses RLS)
export async function GET(request: NextRequest) {
  try {
    const { error } = await verifyAdmin(request)
    if (error) {
      return NextResponse.json({ error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table')
    const query = searchParams.get('query') || '*'

    if (!table) {
      return NextResponse.json({ error: 'Table name is required' }, { status: 400 })
    }

    const { data, error: dbError } = await supabaseAdmin.from(table).select(query)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/admin/data/[table] - Insert data (bypasses RLS)
export async function POST(request: NextRequest) {
  try {
    const { error } = await verifyAdmin(request)
    if (error) {
      return NextResponse.json({ error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table')

    if (!table) {
      return NextResponse.json({ error: 'Table name is required' }, { status: 400 })
    }

    const body = await request.json()
    const { data, error: dbError } = await supabaseAdmin.from(table).insert(body).select()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/admin/data/[table] - Update data (bypasses RLS)
export async function PUT(request: NextRequest) {
  try {
    const { error } = await verifyAdmin(request)
    if (error) {
      return NextResponse.json({ error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table')
    const id = searchParams.get('id')

    if (!table || !id) {
      return NextResponse.json({ error: 'Table name and ID are required' }, { status: 400 })
    }

    const body = await request.json()
    const { data, error: dbError } = await supabaseAdmin
      .from(table)
      .update(body)
      .eq('id', id)
      .select()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/admin/data/[table] - Delete data (bypasses RLS)
export async function DELETE(request: NextRequest) {
  try {
    const { error } = await verifyAdmin(request)
    if (error) {
      return NextResponse.json({ error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table')
    const id = searchParams.get('id')

    if (!table || !id) {
      return NextResponse.json({ error: 'Table name and ID are required' }, { status: 400 })
    }

    const { error: dbError } = await supabaseAdmin.from(table).delete().eq('id', id)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

