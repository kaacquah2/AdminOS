import { NextRequest, NextResponse } from "next/server"

// In-memory rate limit store (use Redis in production)
interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

// Rate limit configuration
export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string // Custom key generator
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
}

// Clean up old entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }, 60000) // Clean up every minute
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.ip || "unknown"
  return ip
}

export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config }

  return async (req: NextRequest): Promise<
    | { success: true }
    | { success: false; response: NextResponse }
  > => {
    const key = finalConfig.keyGenerator
      ? finalConfig.keyGenerator(req)
      : getClientIp(req)

    const now = Date.now()
    const record = rateLimitStore.get(key)

    if (!record || record.resetTime < now) {
      // Create new record
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + finalConfig.windowMs,
      })
      return { success: true }
    }

    if (record.count >= finalConfig.maxRequests) {
      const remainingTime = Math.ceil((record.resetTime - now) / 1000)
      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Too many requests",
            message: `Rate limit exceeded. Please try again in ${remainingTime} seconds.`,
            retryAfter: remainingTime,
          },
          {
            status: 429,
            headers: {
              "Retry-After": remainingTime.toString(),
              "X-RateLimit-Limit": finalConfig.maxRequests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": new Date(record.resetTime).toISOString(),
            },
          }
        ),
      }
    }

    // Increment count
    record.count++
    return { success: true }
  }
}

// Pre-configured rate limiters
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute for API
})

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
})

export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 uploads per minute
})

