/**
 * Simple in-memory rate limiting for API endpoints.
 * 
 * This module provides basic rate limiting functionality using an in-memory
 * store. For production use with multiple instances, consider Redis or
 * database-backed rate limiting.
 */

/**
 * Rate limit configuration options.
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed within the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional custom message when rate limit is exceeded */
  message?: string;
}

/**
 * Rate limit check result.
 */
export interface RateLimitResult {
  /** Whether the request should be allowed */
  allowed: boolean;
  /** Current number of requests in the window */
  currentCount: number;
  /** Maximum requests allowed */
  limit: number;
  /** Milliseconds until the window resets */
  resetTime: number;
  /** Error message if rate limited */
  message?: string;
}

/**
 * In-memory store for rate limit tracking.
 * Each key maps to an array of request timestamps.
 */
const rateLimitStore = new Map<string, number[]>();

/**
 * Cleanup interval to remove expired entries from memory.
 * Runs every 5 minutes to prevent memory leaks.
 */
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Initializes the cleanup process for expired rate limit entries.
 * This prevents memory leaks by periodically removing old timestamps.
 */
function initCleanup() {
  if (cleanupInterval) return; // Already initialized
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    
    // Clean up entries older than 1 hour
    for (const [key, timestamps] of rateLimitStore.entries()) {
      const validTimestamps = timestamps.filter(time => now - time < 60 * 60 * 1000);
      
      if (validTimestamps.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, validTimestamps);
      }
    }
  }, 5 * 60 * 1000); // Run every 5 minutes
}

/**
 * Checks if a request should be rate limited based on the provided identifier.
 * 
 * Uses a sliding window approach where requests within the time window are counted.
 * When the limit is exceeded, subsequent requests are rejected until the window slides.
 * 
 * @param identifier - Unique identifier for the rate limit (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns RateLimitResult indicating whether the request is allowed
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  // Initialize cleanup on first use
  initCleanup();
  
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // Get existing timestamps for this identifier
  const timestamps = rateLimitStore.get(identifier) || [];
  
  // Remove timestamps outside the current window
  const validTimestamps = timestamps.filter(time => time > windowStart);
  
  // Check if limit is exceeded
  const currentCount = validTimestamps.length;
  const allowed = currentCount < config.maxRequests;
  
  if (allowed) {
    // Add current timestamp and update store
    validTimestamps.push(now);
    rateLimitStore.set(identifier, validTimestamps);
  }
  
  // Calculate reset time (when the oldest request in window expires)
  const oldestTimestamp = validTimestamps[0] || now;
  const resetTime = Math.max(0, config.windowMs - (now - oldestTimestamp));
  
  return {
    allowed,
    currentCount: allowed ? currentCount + 1 : currentCount,
    limit: config.maxRequests,
    resetTime,
    message: allowed ? undefined : (config.message || 'Rate limit exceeded')
  };
}

/**
 * Gets the current rate limit status without incrementing the count.
 * Useful for checking limits without consuming a request slot.
 * 
 * @param identifier - Unique identifier for the rate limit
 * @param config - Rate limit configuration
 * @returns Current rate limit status
 */
export function getRateLimitStatus(identifier: string, config: RateLimitConfig): Omit<RateLimitResult, 'allowed'> {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  const timestamps = rateLimitStore.get(identifier) || [];
  const validTimestamps = timestamps.filter(time => time > windowStart);
  
  const oldestTimestamp = validTimestamps[0] || now;
  const resetTime = Math.max(0, config.windowMs - (now - oldestTimestamp));
  
  return {
    currentCount: validTimestamps.length,
    limit: config.maxRequests,
    resetTime
  };
}

/**
 * Clears rate limit data for a specific identifier.
 * Useful for testing or administrative actions.
 * 
 * @param identifier - Identifier to clear
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Clears all rate limit data.
 * Useful for testing or system resets.
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Default rate limit configurations for common scenarios.
 */
export const DEFAULT_RATE_LIMITS = {
  /** Conservative limit for feedback submissions */
  FEEDBACK_SUBMISSION: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many feedback submissions. Please try again in 15 minutes.'
  },
  
  /** General API rate limit */
  GENERAL_API: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Rate limit exceeded. Please try again later.'
  },
  
  /** Strict limit for sensitive operations */
  STRICT: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Rate limit exceeded. Please try again in 1 hour.'
  }
} as const;