/**
 * Rate limiting utilities for FeedbackPulse v2 API endpoints.
 * Implements in-memory rate limiting with configurable windows and limits.
 */

import { NextRequest } from 'next/server'

interface RateLimitConfig {
  /** Maximum number of requests allowed per window */
  limit: number
  /** Time window in milliseconds */
  window: number
}

interface RateLimitEntry {
  /** Request count in current window */
  count: number
  /** Timestamp when current window started */
  windowStart: number
}

// In-memory store for rate limiting data
// In production, this should be replaced with Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>()

// Export for testing purposes only
export const __internal = {
  rateLimitStore,
  clearStore: () => rateLimitStore.clear()
}

/**
 * Extracts client IP address from request headers.
 * Handles various proxy configurations and forwarded headers.
 * 
 * @param request - The incoming NextRequest
 * @returns Client IP address or 'unknown' if not determinable
 */
function getClientIP(request: NextRequest): string {
  // Check for forwarded IP in various common headers
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  const cfIP = request.headers.get('cf-connecting-ip')
  if (cfIP) {
    return cfIP
  }
  
  // Fallback to connection remote address (may not be available in all environments)
  return 'unknown'
}

/**
 * Checks if a request is within rate limits and updates the counter.
 * Uses a sliding window approach with cleanup of expired entries.
 * 
 * @param request - The incoming NextRequest to check
 * @param config - Rate limiting configuration (limit and window)
 * @returns Object containing whether request is allowed and remaining requests
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const clientIP = getClientIP(request)
  const now = Date.now()
  const key = `${clientIP}:${request.url}`
  
  // Clean up expired entries (older than 1 hour to prevent memory leaks)
  const oneHourAgo = now - 60 * 60 * 1000
  for (const [entryKey, entry] of rateLimitStore.entries()) {
    if (entry.windowStart < oneHourAgo) {
      rateLimitStore.delete(entryKey)
    }
  }
  
  // Get or create rate limit entry for this client
  let entry = rateLimitStore.get(key)
  
  // If no entry exists or window has expired, create new window
  if (!entry || (now - entry.windowStart) >= config.window) {
    entry = {
      count: 1,
      windowStart: now
    }
    rateLimitStore.set(key, entry)
    
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetTime: now + config.window
    }
  }
  
  // Window is still active, check if under limit
  if (entry.count < config.limit) {
    entry.count++
    
    return {
      allowed: true,
      remaining: config.limit - entry.count,
      resetTime: entry.windowStart + config.window
    }
  }
  
  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.windowStart + config.window
  }
}

/**
 * Standard rate limit configuration for public feedback endpoints.
 * Allows 30 requests per minute per IP address.
 */
export const PUBLIC_FEEDBACK_RATE_LIMIT: RateLimitConfig = {
  limit: 30,
  window: 60 * 1000 // 1 minute
}