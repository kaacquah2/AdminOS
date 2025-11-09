// Storage utility functions for Supabase
import { supabase } from "@/lib/supabase"

export interface UploadOptions {
  bucket: string
  path: string
  file: File
  cacheControl?: string
  upsert?: boolean
}

export interface UploadResult {
  path: string
  fullPath: string
  publicUrl?: string
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { bucket, path, file, cacheControl, upsert } = options

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: cacheControl || '3600',
      upsert: upsert || false
    })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL if bucket is public
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return {
    path: data.path,
    fullPath: data.fullPath,
    publicUrl: publicUrl || undefined
  }
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/avatar.${fileExt}`
  
  const result = await uploadFile({
    bucket: 'avatars',
    path: fileName,
    file,
    upsert: true
  })

  return result.publicUrl || result.fullPath
}

/**
 * Upload expense receipt
 */
export async function uploadReceipt(expenseId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${expenseId}/receipt.${fileExt}`
  
  const result = await uploadFile({
    bucket: 'receipts',
    path: fileName,
    file
  })

  // Return path for private bucket
  return result.fullPath
}

/**
 * Upload attachment (for messages or workflow tasks)
 */
export async function uploadAttachment(
  userId: string,
  file: File,
  folder?: string
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const fileName = folder 
    ? `${userId}/${folder}/${timestamp}-${file.name}`
    : `${userId}/${timestamp}-${file.name}`
  
  const result = await uploadFile({
    bucket: 'attachments',
    path: fileName,
    file
  })

  return result.fullPath
}

/**
 * Upload resume
 */
export async function uploadResume(candidateId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${candidateId}/resume.${fileExt}`
  
  const result = await uploadFile({
    bucket: 'resumes',
    path: fileName,
    file,
    upsert: true
  })

  return result.fullPath
}

/**
 * Upload training certificate
 */
export async function uploadCertificate(
  enrollmentId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${enrollmentId}/certificate.${fileExt}`
  
  const result = await uploadFile({
    bucket: 'certificates',
    path: fileName,
    file,
    upsert: true
  })

  return result.fullPath
}

/**
 * Upload asset file
 */
export async function uploadAssetFile(
  assetId: string,
  file: File,
  type: 'image' | 'document' = 'image'
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${assetId}/${type}.${fileExt}`
  
  const result = await uploadFile({
    bucket: 'assets',
    path: fileName,
    file
  })

  return result.fullPath
}

/**
 * Upload audit document
 */
export async function uploadAuditDocument(
  auditId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const fileName = `${auditId}/${timestamp}-${file.name}`
  
  const result = await uploadFile({
    bucket: 'audit',
    path: fileName,
    file
  })

  return result.fullPath
}

/**
 * Upload document
 */
export async function uploadDocument(
  userId: string,
  file: File,
  folder?: string
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const fileName = folder
    ? `${userId}/${folder}/${timestamp}-${file.name}`
    : `${userId}/${timestamp}-${file.name}`
  
  const result = await uploadFile({
    bucket: 'documents',
    path: fileName,
    file
  })

  return result.fullPath
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Get signed URL for a private file (valid for 1 hour)
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * Delete a file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * List files in a bucket/folder
 */
export async function listFiles(
  bucket: string,
  folder?: string,
  limit: number = 100
): Promise<any[]> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder || '', {
      limit,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    })

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`)
  }

  return data || []
}

/**
 * Download a file as blob
 */
export async function downloadFile(bucket: string, path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(bucket).download(path)

  if (error) {
    throw new Error(`Failed to download file: ${error.message}`)
  }

  return data
}

/**
 * Copy a file within the same bucket
 */
export async function copyFile(
  bucket: string,
  sourcePath: string,
  destinationPath: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .copy(sourcePath, destinationPath)

  if (error) {
    throw new Error(`Failed to copy file: ${error.message}`)
  }
}

/**
 * Move a file within the same bucket
 */
export async function moveFile(
  bucket: string,
  sourcePath: string,
  destinationPath: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .move(sourcePath, destinationPath)

  if (error) {
    throw new Error(`Failed to move file: ${error.message}`)
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(bucket: string, path: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path.split('/').slice(0, -1).join('/'), {
      search: path.split('/').pop()
    })

  if (error) {
    throw new Error(`Failed to get file metadata: ${error.message}`)
  }

  return data?.[0]
}

