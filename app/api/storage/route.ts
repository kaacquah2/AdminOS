import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { uploadFile, getSignedUrl, deleteFile } from '@/lib/storage'

// Helper to verify authentication
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { error: 'Unauthorized', user: null }
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { error: 'Invalid token', user: null }
  }

  return { error: null, user }
}

// POST /api/storage/upload - Upload a file
export async function POST(request: NextRequest) {
  try {
    const { error, user } = await verifyAuth(request)
    if (error) {
      return NextResponse.json({ error }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string
    const path = formData.get('path') as string
    const upsert = formData.get('upsert') === 'true'

    if (!file || !bucket || !path) {
      return NextResponse.json(
        { error: 'File, bucket, and path are required' },
        { status: 400 }
      )
    }

    // Validate file size (check bucket limits)
    const maxSizes: Record<string, number> = {
      avatars: 5242880,
      receipts: 5242880,
      attachments: 52428800,
      documents: 10485760,
      resumes: 10485760,
      certificates: 5242880,
      assets: 10485760,
      audit: 52428800
    }

    if (file.size > (maxSizes[bucket] || 10485760)) {
      return NextResponse.json(
        { error: `File size exceeds limit for ${bucket} bucket` },
        { status: 400 }
      )
    }

    const result = await uploadFile({
      bucket,
      path,
      file,
      upsert
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/storage/url - Get signed URL for private file
export async function GET(request: NextRequest) {
  try {
    const { error, user } = await verifyAuth(request)
    if (error) {
      return NextResponse.json({ error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket')
    const path = searchParams.get('path')
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600')

    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'Bucket and path are required' },
        { status: 400 }
      )
    }

    const signedUrl = await getSignedUrl(bucket, path, expiresIn)

    return NextResponse.json({ url: signedUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/storage/delete - Delete a file
export async function DELETE(request: NextRequest) {
  try {
    const { error, user } = await verifyAuth(request)
    if (error) {
      return NextResponse.json({ error }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket')
    const path = searchParams.get('path')

    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'Bucket and path are required' },
        { status: 400 }
      )
    }

    await deleteFile(bucket, path)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

