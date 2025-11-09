import { z } from "zod"
import { NextRequest, NextResponse } from "next/server"

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

export const idSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
})

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(1, "Full name is required"),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  role: z.string().min(1, "Role is required"),
})

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().uuid("Invalid ID format"),
})

// File upload validation
export const fileUploadSchema = z.object({
  bucket: z.string().min(1, "Bucket is required"),
  path: z.string().min(1, "Path is required"),
  upsert: z.coerce.boolean().default(false),
})

// Generic validation middleware
export function validateRequest<T extends z.ZodType>(
  schema: T,
  getData: (req: NextRequest) => Promise<unknown> | unknown
) {
  return async (req: NextRequest): Promise<
    | { success: true; data: z.infer<T> }
    | { success: false; error: NextResponse }
  > => {
    try {
      const data = await getData(req)
      const validated = await schema.parseAsync(data)
      return { success: true, data: validated }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: NextResponse.json(
            {
              error: "Validation failed",
              details: error.errors.map((e) => ({
                path: e.path.join("."),
                message: e.message,
              })),
            },
            { status: 400 }
          ),
        }
      }
      return {
        success: false,
        error: NextResponse.json(
          { error: "Invalid request" },
          { status: 400 }
        ),
      }
    }
  }
}

// Helper to get JSON body from request
export async function getJsonBody<T = unknown>(req: NextRequest): Promise<T> {
  try {
    return await req.json()
  } catch {
    return {} as T
  }
}

// Helper to get query params from request
export function getQueryParams(req: NextRequest): Record<string, string> {
  const params: Record<string, string> = {}
  req.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

