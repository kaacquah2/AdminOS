import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rate limiting store (in-memory, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limit configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  apiMaxRequests: 60, // 60 API requests per minute
}

// Clean up old rate limit entries
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

function getRateLimitKey(request: NextRequest): string {
  // Use IP address for rate limiting
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : request.ip || "unknown"
  return ip
}

function checkRateLimit(request: NextRequest, isApiRoute: boolean): boolean {
  const key = getRateLimitKey(request)
  const now = Date.now()
  const maxRequests = isApiRoute ? RATE_LIMIT.apiMaxRequests : RATE_LIMIT.maxRequests

  const record = rateLimitStore.get(key)

  if (!record || record.resetTime < now) {
    // Create new rate limit record
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  // Increment count
  record.count++
  return true
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next()
  }

  // Check rate limiting
  const isApiRoute = pathname.startsWith("/api/")
  if (!checkRateLimit(request, isApiRoute)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": isApiRoute
            ? RATE_LIMIT.apiMaxRequests.toString()
            : RATE_LIMIT.maxRequests.toString(),
        },
      }
    )
  }

  // Security headers
  const response = NextResponse.next()

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval in dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in",
    "frame-ancestors 'none'",
  ].join("; ")

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  // Only set CSP in production (Next.js dev mode needs more permissive CSP)
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Content-Security-Policy", csp)
  }

  // CORS headers for API routes
  if (isApiRoute) {
    const origin = request.headers.get("origin")
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
      process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:3000",
    ]

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin)
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
      response.headers.set("Access-Control-Allow-Credentials", "true")
    }

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      })
    }
  }

  // Log request (in development)
  if (process.env.NODE_ENV === "development") {
    console.log(`[Middleware] ${request.method} ${pathname}`)
  }

  return response
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

