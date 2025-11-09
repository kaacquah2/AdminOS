/**
 * API Versioning Utilities
 * 
 * This module provides utilities for API versioning.
 * Current version: v1
 */

export const API_VERSION = "v1"
export const API_PREFIX = `/api/${API_VERSION}`

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  version: string
}

export function createApiResponse<T>(
  data?: T,
  error?: string,
  message?: string
): ApiResponse<T> {
  return {
    success: !error,
    data,
    error,
    message,
    version: API_VERSION,
  }
}

// Version header for API responses
export const VERSION_HEADER = "X-API-Version"

