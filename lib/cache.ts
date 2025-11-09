/**
 * Caching utilities
 * 
 * In-memory cache implementation. For production, consider using Redis.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class Cache {
  private store = new Map<string, CacheEntry<unknown>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }

    return entry.value as T
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL)
    this.store.set(key, { value, expiresAt })
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.store.delete(key)
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return false
    }

    return true
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt < now) {
        this.store.delete(key)
      }
    }
  }
}

// Global cache instance
export const cache = new Cache()

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    cache.cleanup()
  }, 5 * 60 * 1000)
}

// Cache key generators
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  department: (dept: string) => `dept:${dept}`,
  project: (projectId: string) => `project:${projectId}`,
  api: (path: string, params?: Record<string, string>) => {
    const paramStr = params ? `:${JSON.stringify(params)}` : ""
    return `api:${path}${paramStr}`
  },
}

// Cache wrapper for async functions
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Execute function and cache result
  const result = await fn()
  cache.set(key, result, ttl)
  return result
}

