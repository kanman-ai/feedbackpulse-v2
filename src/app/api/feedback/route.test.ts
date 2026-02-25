/**
 * FeedbackPulse v2 - Feedback API Route Tests
 * 
 * Integration tests for the feedback submission API endpoint.
 * Tests validation, database integration, and error handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, OPTIONS } from './route';

// Mock Supabase client
const mockSupabaseResponse = {
  data: { id: '123' },
  error: null
};

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: 'project-123' }, error: null }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve(mockSupabaseResponse))
      }))
    }))
  }))
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}));

describe('Feedback API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/feedback', () => {
    /**
     * Creates a mock NextRequest with the specified body data
     * 
     * @param body - Request body data
     * @param headers - Optional request headers
     * @returns Mock NextRequest instance
     */
    function createMockRequest(body: any, headers: Record<string, string> = {}): NextRequest {
      return {
        json: vi.fn().mockResolvedValue(body),
        headers: {
          get: vi.fn((key: string) => headers[key] || null)
        },
        ip: '192.168.1.1'
      } as unknown as NextRequest;
    }

    it('should handle feedback submission', async () => {
      const validFeedback = {
        project_id: 'project-123',
        rating: 5,
        comment: 'Great product!',
        email: 'user@example.com',
        source: 'widget'
      };

      const request = createMockRequest(validFeedback);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Feedback submitted successfully');
      expect(responseData.feedback_id).toBe('123');
    });

    it('should validate required fields', async () => {
      const invalidFeedback = {
        rating: 5,
        comment: 'Missing project_id'
      };

      const request = createMockRequest(invalidFeedback);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Project ID is required');
    });

    it('should validate rating range', async () => {
      const invalidFeedback = {
        project_id: 'project-123',
        rating: 10, // Invalid rating
        comment: 'Test comment',
        source: 'widget'
      };

      const request = createMockRequest(invalidFeedback);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Rating must be a number between 1 and 5');
    });

    it('should validate email format when provided', async () => {
      const invalidFeedback = {
        project_id: 'project-123',
        rating: 5,
        comment: 'Test comment',
        email: 'invalid-email',
        source: 'widget'
      };

      const request = createMockRequest(invalidFeedback);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid email format');
    });

    it('should validate comment length', async () => {
      const longComment = 'a'.repeat(501); // Too long
      const invalidFeedback = {
        project_id: 'project-123',
        rating: 5,
        comment: longComment,
        source: 'widget'
      };

      const request = createMockRequest(invalidFeedback);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Comment must be 500 characters or less');
    });

    it('should handle missing comment', async () => {
      const invalidFeedback = {
        project_id: 'project-123',
        rating: 5,
        comment: '',
        source: 'widget'
      };

      const request = createMockRequest(invalidFeedback);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Comment is required');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const errorMock = vi.fn().mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: new Error('DB Error') }))
          }))
        }))
      });
      mockSupabase.from.mockReturnValueOnce(errorMock as any);

      const validFeedback = {
        project_id: 'invalid-project',
        rating: 5,
        comment: 'Test comment',
        source: 'widget'
      };

      const request = createMockRequest(validFeedback);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Invalid project ID');
    });

    it('should work without optional email', async () => {
      const validFeedback = {
        project_id: 'project-123',
        rating: 4,
        comment: 'Good product!',
        source: 'widget'
      };

      const request = createMockRequest(validFeedback);
      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
    });
  });

  describe('OPTIONS /api/feedback', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    });
  });
});
