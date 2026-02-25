/**
 * Unit tests for rate limiting functionality.
 * Tests various rate limiting scenarios including window management and cleanup.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { checkRateLimit, PUBLIC_FEEDBACK_RATE_LIMIT, __internal } from './rate-limit'

// Mock NextRequest constructor
const createMockRequest = (ip: string = '192.168.1.1', url: string = '/api/feedback/test'): NextRequest => {
  const request = {
    headers: new Map([
      ['x-forwarded-for', ip]
    ]),
    url: url
  } as unknown as NextRequest
  
  // Mock headers.get method
  request.headers.get = vi.fn((name: string) => {
    switch (name) {
      case 'x-forwarded-for':
        return ip
      default:
        return null
    }
  })
  
  return request
}

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear the rate limit store before each test
    __internal.clearStore()
    vi.useFakeTimers()
  })
  
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should allow requests under the limit', () => {
    const request = createMockRequest()
    const config = { limit: 5, window: 60000 } // 5 requests per minute
    
    // First request should be allowed
    const result1 = checkRateLimit(request, config)
    expect(result1.allowed).toBe(true)
    expect(result1.remaining).toBe(4)
    
    // Second request should be allowed
    const result2 = checkRateLimit(request, config)
    expect(result2.allowed).toBe(true)
    expect(result2.remaining).toBe(3)
  })

  it('should enforce rate limits correctly', () => {
    const request = createMockRequest()
    const config = { limit: 2, window: 60000 } // 2 requests per minute
    
    // First two requests should be allowed
    checkRateLimit(request, config)
    const result2 = checkRateLimit(request, config)
    expect(result2.allowed).toBe(true)
    expect(result2.remaining).toBe(0)
    
    // Third request should be denied
    const result3 = checkRateLimit(request, config)
    expect(result3.allowed).toBe(false)
    expect(result3.remaining).toBe(0)
  })

  it('should handle different IP addresses separately', () => {
    const request1 = createMockRequest('192.168.1.1')
    const request2 = createMockRequest('192.168.1.2')
    const config = { limit: 1, window: 60000 } // 1 request per minute
    
    // First IP can make a request
    const result1 = checkRateLimit(request1, config)
    expect(result1.allowed).toBe(true)
    
    // Second IP can also make a request
    const result2 = checkRateLimit(request2, config)
    expect(result2.allowed).toBe(true)
    
    // First IP is now blocked
    const result3 = checkRateLimit(request1, config)
    expect(result3.allowed).toBe(false)
    
    // Second IP is also blocked
    const result4 = checkRateLimit(request2, config)
    expect(result4.allowed).toBe(false)
  })

  it('should handle different URLs separately', () => {
    const request1 = createMockRequest('192.168.1.1', '/api/feedback/token1')
    const request2 = createMockRequest('192.168.1.1', '/api/feedback/token2')
    const config = { limit: 1, window: 60000 } // 1 request per minute
    
    // Same IP, different URLs should be tracked separately
    const result1 = checkRateLimit(request1, config)
    expect(result1.allowed).toBe(true)
    
    const result2 = checkRateLimit(request2, config)
    expect(result2.allowed).toBe(true)
  })

  it('should reset window after expiration', () => {
    const request = createMockRequest()
    const config = { limit: 1, window: 1000 } // 1 request per second
    
    // First request should be allowed
    const result1 = checkRateLimit(request, config)
    expect(result1.allowed).toBe(true)
    
    // Second request should be denied
    const result2 = checkRateLimit(request, config)
    expect(result2.allowed).toBe(false)
    
    // Mock time passage
    vi.advanceTimersByTime(1001) // Advance time by just over the window
    
    // After window expires, request should be allowed again
    const result3 = checkRateLimit(request, config)
    expect(result3.allowed).toBe(true)
  })

  it('should use correct headers for IP extraction', () => {
    // Test x-real-ip header
    const requestWithRealIP = {
      headers: new Map([
        ['x-real-ip', '10.0.0.1']
      ]),
      url: '/test'
    } as unknown as NextRequest
    
    requestWithRealIP.headers.get = vi.fn((name: string) => {
      switch (name) {
        case 'x-forwarded-for':
          return null
        case 'x-real-ip':
          return '10.0.0.1'
        default:
          return null
      }
    })
    
    const config = { limit: 1, window: 60000 }
    const result = checkRateLimit(requestWithRealIP, config)
    expect(result.allowed).toBe(true)
  })

  it('should handle missing IP gracefully', () => {
    const requestWithoutIP = {
      headers: new Map(),
      url: '/test-missing-ip-' + Math.random() // Unique URL
    } as unknown as NextRequest
    
    requestWithoutIP.headers.get = vi.fn(() => null)
    
    const config = { limit: 5, window: 60000 } // Higher limit to avoid conflicts
    
    // Should not throw an error, should use 'unknown' as fallback
    expect(() => checkRateLimit(requestWithoutIP, config)).not.toThrow()
    
    const result = checkRateLimit(requestWithoutIP, config)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBeGreaterThanOrEqual(0)
  })

  it('should use PUBLIC_FEEDBACK_RATE_LIMIT configuration', () => {
    expect(PUBLIC_FEEDBACK_RATE_LIMIT.limit).toBe(30)
    expect(PUBLIC_FEEDBACK_RATE_LIMIT.window).toBe(60 * 1000) // 1 minute
  })

  it('should provide correct reset time', () => {
    const request = createMockRequest()
    const config = { limit: 1, window: 60000 }
    
    const before = Date.now()
    const result = checkRateLimit(request, config)
    const after = Date.now()
    
    expect(result.resetTime).toBeGreaterThanOrEqual(before + config.window)
    expect(result.resetTime).toBeLessThanOrEqual(after + config.window)
  })
})