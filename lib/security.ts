import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

/**
 * Security utilities and middleware helpers
 */

// CSRF token generation and validation
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  // In a real implementation, store tokens in session and validate
  // For now, simple comparison (enhance with session storage)
  return token === sessionToken
}

// XSS prevention - sanitize user input
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

// SQL injection prevention (basic check)
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|;|\/\*|\*\/|xp_|sp_)/i,
  ]

  return sqlPatterns.some((pattern) => pattern.test(input))
}

// Security headers middleware helper
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval in dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ")

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

  // Only set CSP in production (Next.js dev mode needs more permissive CSP)
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Content-Security-Policy", csp)
  }

  return response
}

// Validate request origin
export function isValidOrigin(origin: string | null): boolean {
  if (!origin) return false

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:3000",
  ]

  return allowedOrigins.some((allowed) => origin.startsWith(allowed))
}

// Rate limiting per user (enhanced)
export function getUserRateLimitKey(userId: string, endpoint: string): string {
  return `ratelimit:user:${userId}:${endpoint}`
}

