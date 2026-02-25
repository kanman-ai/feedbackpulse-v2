/**
 * Test suite for rate limiting utilities.
 * 
 * Tests the in-memory rate limiter to ensure proper request throttling,
 * sliding window behavior, and prevention of abuse.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  checkRateLimit, 
  getRateLimitStatus, 
  clearRateLimit, 
  clearAllRateLimits,
  DEFAULT_RATE_LIMITS,
  type RateLimitConfig 
} from '../rate-limit';

describe('rate limiting', () => {
  // Clean up between tests
  beforeEach(() => {
    clearAllRateLimits();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkRateLimit', () => {
    const testConfig: RateLimitConfig = {
      maxRequests: 3,
      windowMs: 60000, // 1 minute
      message: 'Test rate limit exceeded'
    };

    it('should allow requests within limit', () => {
      const result1 = checkRateLimit('user1', testConfig);
      expect(result1.allowed).toBe(true);
      expect(result1.currentCount).toBe(1);
      expect(result1.limit).toBe(3);

      const result2 = checkRateLimit('user1', testConfig);
      expect(result2.allowed).toBe(true);
      expect(result2.currentCount).toBe(2);

      const result3 = checkRateLimit('user1', testConfig);
      expect(result3.allowed).toBe(true);
      expect(result3.currentCount).toBe(3);
    });

    it('should reject requests when limit is exceeded', () => {
      // Fill up the limit
      checkRateLimit('user1', testConfig);
      checkRateLimit('user1', testConfig);
      checkRateLimit('user1', testConfig);

      // This should be rejected
      const result = checkRateLimit('user1', testConfig);
      expect(result.allowed).toBe(false);
      expect(result.currentCount).toBe(3);
      expect(result.message).toBe('Test rate limit exceeded');
    });

    it('should track different identifiers separately', () => {
      // Fill up user1's limit
      checkRateLimit('user1', testConfig);
      checkRateLimit('user1', testConfig);
      checkRateLimit('user1', testConfig);

      // user2 should still be allowed
      const result = checkRateLimit('user2', testConfig);
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(1);
    });

    it('should reset after time window expires', () => {
      // Fill up the limit
      checkRateLimit('user1', testConfig);
      checkRateLimit('user1', testConfig);
      checkRateLimit('user1', testConfig);

      // Should be rejected
      expect(checkRateLimit('user1', testConfig).allowed).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(testConfig.windowMs + 1000);

      // Should be allowed again
      const result = checkRateLimit('user1', testConfig);
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(1);
    });

    it('should implement sliding window correctly', () => {
      const startTime = Date.now();
      vi.setSystemTime(startTime);

      // Make requests at different times within window
      checkRateLimit('user1', testConfig); // t=0
      
      vi.advanceTimersByTime(20000); // t=20s
      checkRateLimit('user1', testConfig);
      
      vi.advanceTimersByTime(20000); // t=40s
      checkRateLimit('user1', testConfig);
      
      // Should be at limit
      expect(checkRateLimit('user1', testConfig).allowed).toBe(false);
      
      // Advance time so first request expires
      vi.advanceTimersByTime(25000); // t=65s (first request at t=0 is now expired)
      
      // Should be allowed again (sliding window)
      const result = checkRateLimit('user1', testConfig);
      expect(result.allowed).toBe(true);
      expect(result.currentCount).toBe(3); // 2 previous + 1 new
    });

    it('should calculate reset time correctly', () => {
      const startTime = Date.now();
      vi.setSystemTime(startTime);

      const result1 = checkRateLimit('user1', testConfig);
      expect(result1.resetTime).toBe(testConfig.windowMs);

      // Advance time and check again
      vi.advanceTimersByTime(30000); // 30 seconds
      const result2 = checkRateLimit('user1', testConfig);
      expect(result2.resetTime).toBe(testConfig.windowMs - 30000); // 30 seconds remaining
    });

    it('should handle edge case of zero window time', () => {
      const zeroConfig: RateLimitConfig = {
        maxRequests: 1,
        windowMs: 0
      };

      // Should always be allowed with zero window
      expect(checkRateLimit('user1', zeroConfig).allowed).toBe(true);
      expect(checkRateLimit('user1', zeroConfig).allowed).toBe(true);
    });

    it('should use default message when none provided', () => {
      const configNoMessage: RateLimitConfig = {
        maxRequests: 1,
        windowMs: 60000
      };

      checkRateLimit('user1', configNoMessage);
      const result = checkRateLimit('user1', configNoMessage);
      
      expect(result.allowed).toBe(false);
      expect(result.message).toBe('Rate limit exceeded');
    });
  });

  describe('getRateLimitStatus', () => {
    const testConfig: RateLimitConfig = {
      maxRequests: 3,
      windowMs: 60000
    };

    it('should return status without incrementing count', () => {
      // Make some requests first
      checkRateLimit('user1', testConfig);
      checkRateLimit('user1', testConfig);

      // Check status multiple times
      const status1 = getRateLimitStatus('user1', testConfig);
      const status2 = getRateLimitStatus('user1', testConfig);

      expect(status1.currentCount).toBe(2);
      expect(status2.currentCount).toBe(2);
      expect(status1.limit).toBe(3);
      
      // Should still be able to make one more request
      expect(checkRateLimit('user1', testConfig).allowed).toBe(true);
    });

    it('should return correct status for new identifier', () => {
      const status = getRateLimitStatus('newuser', testConfig);
      
      expect(status.currentCount).toBe(0);
      expect(status.limit).toBe(3);
      expect(status.resetTime).toBe(testConfig.windowMs);
    });
  });

  describe('clearRateLimit', () => {
    const testConfig: RateLimitConfig = {
      maxRequests: 1,
      windowMs: 60000
    };

    it('should clear specific identifier', () => {
      // Fill up the limit
      checkRateLimit('user1', testConfig);
      expect(checkRateLimit('user1', testConfig).allowed).toBe(false);

      // Clear the limit
      clearRateLimit('user1');

      // Should be allowed again
      expect(checkRateLimit('user1', testConfig).allowed).toBe(true);
    });

    it('should not affect other identifiers', () => {
      // Fill up both users' limits
      checkRateLimit('user1', testConfig);
      checkRateLimit('user2', testConfig);

      // Clear only user1
      clearRateLimit('user1');

      // user1 should be allowed, user2 should still be blocked
      expect(checkRateLimit('user1', testConfig).allowed).toBe(true);
      expect(checkRateLimit('user2', testConfig).allowed).toBe(false);
    });
  });

  describe('clearAllRateLimits', () => {
    const testConfig: RateLimitConfig = {
      maxRequests: 1,
      windowMs: 60000
    };

    it('should clear all rate limit data', () => {
      // Fill up multiple users' limits
      checkRateLimit('user1', testConfig);
      checkRateLimit('user2', testConfig);
      checkRateLimit('user3', testConfig);

      // All should be blocked
      expect(checkRateLimit('user1', testConfig).allowed).toBe(false);
      expect(checkRateLimit('user2', testConfig).allowed).toBe(false);
      expect(checkRateLimit('user3', testConfig).allowed).toBe(false);

      // Clear all
      clearAllRateLimits();

      // All should be allowed again
      expect(checkRateLimit('user1', testConfig).allowed).toBe(true);
      expect(checkRateLimit('user2', testConfig).allowed).toBe(true);
      expect(checkRateLimit('user3', testConfig).allowed).toBe(true);
    });
  });

  describe('DEFAULT_RATE_LIMITS', () => {
    it('should provide reasonable feedback submission limits', () => {
      const config = DEFAULT_RATE_LIMITS.FEEDBACK_SUBMISSION;
      
      expect(config.maxRequests).toBe(5);
      expect(config.windowMs).toBe(15 * 60 * 1000); // 15 minutes
      expect(config.message).toContain('15 minutes');
    });

    it('should provide general API limits', () => {
      const config = DEFAULT_RATE_LIMITS.GENERAL_API;
      
      expect(config.maxRequests).toBe(100);
      expect(config.windowMs).toBe(60 * 1000); // 1 minute
    });

    it('should provide strict limits', () => {
      const config = DEFAULT_RATE_LIMITS.STRICT;
      
      expect(config.maxRequests).toBe(10);
      expect(config.windowMs).toBe(60 * 60 * 1000); // 1 hour
      expect(config.message).toContain('1 hour');
    });

    it('should work with actual rate limiting', () => {
      const config = DEFAULT_RATE_LIMITS.FEEDBACK_SUBMISSION;
      
      // Should allow up to maxRequests
      for (let i = 0; i < config.maxRequests; i++) {
        expect(checkRateLimit('testuser', config).allowed).toBe(true);
      }
      
      // Should block the next request
      expect(checkRateLimit('testuser', config).allowed).toBe(false);
    });
  });

  describe('memory cleanup behavior', () => {
    it('should handle large numbers of identifiers', () => {
      const testConfig: RateLimitConfig = {
        maxRequests: 1,
        windowMs: 60000
      };

      // Create many rate limit entries
      for (let i = 0; i < 1000; i++) {
        checkRateLimit(`user${i}`, testConfig);
      }

      // All should be tracked independently
      for (let i = 0; i < 10; i++) {
        expect(checkRateLimit(`user${i}`, testConfig).allowed).toBe(false);
      }
    });

    it('should handle concurrent requests to same identifier', () => {
      const testConfig: RateLimitConfig = {
        maxRequests: 2,
        windowMs: 60000
      };

      // Simulate concurrent requests
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(checkRateLimit('user1', testConfig));
      }

      // First 2 should be allowed, rest blocked
      expect(results[0].allowed).toBe(true);
      expect(results[1].allowed).toBe(true);
      expect(results[2].allowed).toBe(false);
      expect(results[3].allowed).toBe(false);
      expect(results[4].allowed).toBe(false);
    });
  });
});