/**
 * Test suite for the feedback submission API endpoint.
 * 
 * Tests the POST /api/feedback endpoint including validation, rate limiting,
 * CORS handling, and Supabase integration.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, OPTIONS, GET } from '../route';

// Mock the Next.js modules
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    NextRequest: class MockNextRequest {
      constructor(url, options = {}) {
        this.url = url;
        this.method = options.method || 'GET';
        this.headers = new Map(Object.entries(options.headers || {}));
        this._body = options.body;
      }
      
      headers = {
        get: (name) => this.headers.get(name.toLowerCase())
      };
      
      async json() {
        try {
          return JSON.parse(this._body);
        } catch {
          throw new Error('Invalid JSON');
        }
      }
    },
    NextResponse: {
      json: (data, init = {}) => ({
        json: async () => data,
        status: init.status || 200,
        headers: new Map(Object.entries(init.headers || {}))
      })
    }
  };
});

// Mock Supabase client
const mockSupabaseInsert = vi.fn();
const mockSupabaseFrom = vi.fn(() => ({
  insert: mockSupabaseInsert
}));

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({
    from: mockSupabaseFrom
  })
}));

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({
    allowed: true,
    currentCount: 1,
    limit: 5,
    resetTime: 900000 // 15 minutes
  })),
  DEFAULT_RATE_LIMITS: {
    FEEDBACK_SUBMISSION: {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000,
      message: 'Too many feedback submissions. Please try again in 15 minutes.'
    }
  }
}));

// Mock sentiment analysis
vi.mock('@/lib/sentiment', () => ({
  analyzeSentiment: vi.fn(() => ({
    sentiment: 'positive',
    confidence: 0.8
  }))
}));

describe('/api/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful database response
    mockSupabaseInsert.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn(() => ({
          data: {
            id: '12345678-1234-1234-1234-123456789012'
          },
          error: null
        }))
      }))
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('OPTIONS (CORS preflight)', () => {
    it('should return proper CORS headers', async () => {
      const response = await OPTIONS();
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    });
  });

  describe('POST', () => {
    const validFeedback = {
      projectId: '12345678-1234-1234-1234-123456789012',
      rating: 5,
      comment: 'Great product!',
      email: 'user@example.com',
      source: 'widget'
    };

    function createRequest(body: any, headers: Record<string, string> = {}) {
      return new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(body)
      });
    }

    it('should successfully process valid feedback submission', async () => {
      const request = createRequest(validFeedback);
      const response = await POST(request);
      
      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Feedback submitted successfully');
      expect(data.data.id).toBe('12345678-1234-1234-1234-123456789012');
      expect(data.data.sentiment).toBe('positive');
      expect(data.data.sentimentConfidence).toBe(0.8);
    });

    it('should include CORS headers in successful response', async () => {
      const request = createRequest(validFeedback);
      const response = await POST(request);
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('4');
    });

    it('should reject invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      });
      
      const response = await POST(request);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid JSON');
    });

    it('should reject missing required fields', async () => {
      const invalidFeedback = {
        rating: 5,
        source: 'widget'
        // missing projectId
      };
      
      const request = createRequest(invalidFeedback);
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('projectId is required');
    });

    it('should handle rate limiting correctly', async () => {
      const { checkRateLimit } = await import('@/lib/rate-limit');
      vi.mocked(checkRateLimit).mockReturnValueOnce({
        allowed: false,
        currentCount: 5,
        limit: 5,
        resetTime: 900000,
        message: 'Too many feedback submissions. Please try again in 15 minutes.'
      });

      const request = createRequest(validFeedback);
      const response = await POST(request);
      
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('900');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Too many feedback submissions');
      expect(data.retryAfter).toBe(900);
    });

    it('should extract client IP from various headers', async () => {
      const testCases = [
        { header: 'x-forwarded-for', value: '192.168.1.1, 10.0.0.1' },
        { header: 'x-real-ip', value: '192.168.1.1' },
        { header: 'cf-connecting-ip', value: '192.168.1.1' }
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();
        const request = createRequest(validFeedback, {
          [testCase.header]: testCase.value
        });
        
        await POST(request);
        
        // Verify database insert was called with correct IP
        const insertCall = mockSupabaseInsert.mock.calls[0][0];
        expect(insertCall.ip_address).toBe('192.168.1.1');
      }
    });

    it('should store correct data in database', async () => {
      const request = createRequest(validFeedback, {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0 Test Browser',
        'referer': 'https://example.com/widget'
      });
      
      await POST(request);
      
      expect(mockSupabaseInsert).toHaveBeenCalledWith({
        project_id: validFeedback.projectId,
        rating: validFeedback.rating,
        comment: validFeedback.comment,
        email: validFeedback.email,
        source_url: 'https://example.com/widget',
        source_type: validFeedback.source,
        sentiment: 'positive',
        user_agent: 'Mozilla/5.0 Test Browser',
        ip_address: '192.168.1.1'
      });
    });

    it('should handle database foreign key error (invalid project)', async () => {
      mockSupabaseInsert.mockReturnValue({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: { code: '23503', message: 'Foreign key constraint violation' }
          }))
        }))
      });

      const request = createRequest(validFeedback);
      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid project ID');
    });

    it('should handle generic database errors', async () => {
      mockSupabaseInsert.mockReturnValue({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: { code: '50000', message: 'Database error' }
          }))
        }))
      });

      const request = createRequest(validFeedback);
      const response = await POST(request);
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to save feedback');
    });

    it('should handle unexpected errors gracefully', async () => {
      // Mock an unexpected error during processing
      mockSupabaseInsert.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = createRequest(validFeedback);
      const response = await POST(request);
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('unexpected error occurred');
    });

    it('should handle minimal valid submission (optional fields omitted)', async () => {
      const minimalFeedback = {
        projectId: '12345678-1234-1234-1234-123456789012',
        rating: 3,
        source: 'api'
      };
      
      const request = createRequest(minimalFeedback);
      const response = await POST(request);
      
      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      // Verify database call with undefined optional fields
      const insertCall = mockSupabaseInsert.mock.calls[0][0];
      expect(insertCall.comment).toBeUndefined();
      expect(insertCall.email).toBeUndefined();
    });

    it('should call sentiment analysis for comments', async () => {
      const { analyzeSentiment } = await import('@/lib/sentiment');
      
      const request = createRequest(validFeedback);
      await POST(request);
      
      expect(vi.mocked(analyzeSentiment)).toHaveBeenCalledWith(validFeedback.comment);
    });

    it('should call rate limiting with proper identifier', async () => {
      const { checkRateLimit } = await import('@/lib/rate-limit');
      
      const request = createRequest(validFeedback, {
        'x-forwarded-for': '192.168.1.1'
      });
      
      await POST(request);
      
      expect(vi.mocked(checkRateLimit)).toHaveBeenCalledWith(
        'ip:192.168.1.1',
        expect.objectContaining({
          maxRequests: 5,
          windowMs: 15 * 60 * 1000
        })
      );
    });

    it('should fallback to user agent for rate limiting when no IP', async () => {
      const { checkRateLimit } = await import('@/lib/rate-limit');
      
      const request = createRequest(validFeedback, {
        'user-agent': 'Mozilla/5.0 Test Browser'
      });
      
      await POST(request);
      
      const rateLimitCall = vi.mocked(checkRateLimit).mock.calls[0];
      expect(rateLimitCall[0]).toMatch(/^ua:\d+$/); // Should be user agent hash
    });
  });

  describe('Unsupported methods', () => {
    it('should reject GET requests', async () => {
      const response = await GET();
      
      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('POST, OPTIONS');
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Method not allowed');
    });

    it('should include CORS headers in method not allowed response', async () => {
      const response = await GET();
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    });
  });
});