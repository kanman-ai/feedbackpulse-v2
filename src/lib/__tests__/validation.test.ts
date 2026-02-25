/**
 * Test suite for feedback validation utilities.
 * 
 * Tests input validation, sanitization, and error handling for
 * feedback submission data to ensure security and data integrity.
 */

import { describe, it, expect } from 'vitest';
import { validateFeedbackSubmission, type FeedbackSubmission } from '../validation';

describe('validateFeedbackSubmission', () => {
  // Valid test data for positive test cases
  const validSubmission: FeedbackSubmission = {
    projectId: '12345678-1234-1234-1234-123456789012',
    rating: 5,
    comment: 'Great product!',
    email: 'user@example.com',
    source: 'widget'
  };

  describe('successful validation', () => {
    it('should validate a complete valid submission', () => {
      const result = validateFeedbackSubmission(validSubmission);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validSubmission);
      expect(result.error).toBeUndefined();
    });

    it('should validate minimal required fields', () => {
      const minimal = {
        projectId: '12345678-1234-1234-1234-123456789012',
        rating: 3,
        source: 'api'
      };
      
      const result = validateFeedbackSubmission(minimal);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        ...minimal,
        comment: undefined,
        email: undefined
      });
    });

    it('should accept all valid rating values', () => {
      for (let rating = 1; rating <= 5; rating++) {
        const submission = { ...validSubmission, rating };
        const result = validateFeedbackSubmission(submission);
        
        expect(result.success).toBe(true);
        expect(result.data?.rating).toBe(rating);
      }
    });

    it('should accept all valid source types', () => {
      const validSources = ['widget', 'app', 'email', 'api', 'survey'];
      
      validSources.forEach(source => {
        const submission = { ...validSubmission, source };
        const result = validateFeedbackSubmission(submission);
        
        expect(result.success).toBe(true);
        expect(result.data?.source).toBe(source);
      });
    });

    it('should trim and clean comment text', () => {
      const submissionWithWhitespace = {
        ...validSubmission,
        comment: '  This has whitespace  \\n\\n  '
      };
      
      const result = validateFeedbackSubmission(submissionWithWhitespace);
      
      expect(result.success).toBe(true);
      expect(result.data?.comment).toBe('This has whitespace  \\n\\n');
    });

    it('should normalize email addresses', () => {
      const submissionWithCaps = {
        ...validSubmission,
        email: '  USER@EXAMPLE.COM  '
      };
      
      const result = validateFeedbackSubmission(submissionWithCaps);
      
      expect(result.success).toBe(true);
      expect(result.data?.email).toBe('user@example.com');
    });

    it('should handle empty optional fields correctly', () => {
      const submissionWithEmptyFields = {
        ...validSubmission,
        comment: '   ',
        email: ''
      };
      
      const result = validateFeedbackSubmission(submissionWithEmptyFields);
      
      expect(result.success).toBe(true);
      expect(result.data?.comment).toBeUndefined();
      expect(result.data?.email).toBeUndefined();
    });
  });

  describe('input type validation', () => {
    it('should reject null or undefined input', () => {
      expect(validateFeedbackSubmission(null).success).toBe(false);
      expect(validateFeedbackSubmission(undefined).success).toBe(false);
      expect(validateFeedbackSubmission(null).error).toContain('JSON object');
    });

    it('should reject non-object input', () => {
      expect(validateFeedbackSubmission('string').success).toBe(false);
      expect(validateFeedbackSubmission(123).success).toBe(false);
      expect(validateFeedbackSubmission([]).success).toBe(false);
    });
  });

  describe('projectId validation', () => {
    it('should reject missing projectId', () => {
      const submission = { ...validSubmission };
      delete (submission as any).projectId;
      
      const result = validateFeedbackSubmission(submission);
      expect(result.success).toBe(false);
      expect(result.error).toContain('projectId is required');
    });

    it('should reject non-string projectId', () => {
      const submission = { ...validSubmission, projectId: 123 as any };
      const result = validateFeedbackSubmission(submission);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('projectId is required and must be a string');
    });

    it('should reject invalid UUID format', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '123',
        '12345678-1234-1234-1234-12345678901',  // Too short
        '12345678-1234-1234-1234-1234567890123', // Too long
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  // Invalid characters
        '12345678-1234-1234-1234-123456789012x'  // Extra character
      ];
      
      invalidUUIDs.forEach(invalidUUID => {
        const submission = { ...validSubmission, projectId: invalidUUID };
        const result = validateFeedbackSubmission(submission);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('valid UUID');
      });
    });
  });

  describe('rating validation', () => {
    it('should reject missing rating', () => {
      const submission = { ...validSubmission };
      delete (submission as any).rating;
      
      const result = validateFeedbackSubmission(submission);
      expect(result.success).toBe(false);
      expect(result.error).toContain('rating is required');
    });

    it('should reject null rating', () => {
      const submission = { ...validSubmission, rating: null as any };
      const result = validateFeedbackSubmission(submission);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('rating is required');
    });

    it('should reject non-numeric ratings', () => {
      const invalidRatings = ['5', true, [], {}, 'five'];
      
      invalidRatings.forEach(rating => {
        const submission = { ...validSubmission, rating: rating as any };
        const result = validateFeedbackSubmission(submission);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('integer between 1 and 5');
      });
    });

    it('should reject decimal ratings', () => {
      const submission = { ...validSubmission, rating: 4.5 };
      const result = validateFeedbackSubmission(submission);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('integer between 1 and 5');
    });

    it('should reject ratings outside valid range', () => {
      const invalidRatings = [0, -1, 6, 10, 100];
      
      invalidRatings.forEach(rating => {
        const submission = { ...validSubmission, rating };
        const result = validateFeedbackSubmission(submission);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('integer between 1 and 5');
      });
    });
  });

  describe('source validation', () => {
    it('should reject missing source', () => {
      const submission = { ...validSubmission };
      delete (submission as any).source;
      
      const result = validateFeedbackSubmission(submission);
      expect(result.success).toBe(false);
      expect(result.error).toContain('source is required');
    });

    it('should reject non-string source', () => {
      const submission = { ...validSubmission, source: 123 as any };
      const result = validateFeedbackSubmission(submission);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('source is required and must be a string');
    });

    it('should reject invalid source values', () => {
      const invalidSources = ['invalid', 'website', 'mobile', 'desktop'];
      
      invalidSources.forEach(source => {
        const submission = { ...validSubmission, source };
        const result = validateFeedbackSubmission(submission);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('source must be one of');
      });
    });
  });

  describe('comment validation', () => {
    it('should reject non-string comments', () => {
      const invalidComments = [123, true, [], {}];
      
      invalidComments.forEach(comment => {
        const submission = { ...validSubmission, comment: comment as any };
        const result = validateFeedbackSubmission(submission);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('comment must be a string');
      });
    });

    it('should reject comments exceeding character limit', () => {
      const longComment = 'a'.repeat(2001); // Exceed 2000 character limit
      const submission = { ...validSubmission, comment: longComment };
      
      const result = validateFeedbackSubmission(submission);
      expect(result.success).toBe(false);
      expect(result.error).toContain('2000 characters');
    });

    it('should accept comments at character limit', () => {
      const maxLengthComment = 'a'.repeat(2000);
      const submission = { ...validSubmission, comment: maxLengthComment };
      
      const result = validateFeedbackSubmission(submission);
      expect(result.success).toBe(true);
      expect(result.data?.comment).toBe(maxLengthComment);
    });
  });

  describe('email validation', () => {
    it('should reject non-string emails', () => {
      const invalidEmails = [123, true, [], {}];
      
      invalidEmails.forEach(email => {
        const submission = { ...validSubmission, email: email as any };
        const result = validateFeedbackSubmission(submission);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('email must be a string');
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'not-an-email',
        'missing-at-sign.com',
        '@missing-local.com',
        'missing-domain@',
        'spaces in@email.com',
        'double@@signs.com',
        'no-tld@domain',
        '.starts-with-dot@domain.com'
      ];
      
      invalidEmails.forEach(email => {
        const submission = { ...validSubmission, email };
        const result = validateFeedbackSubmission(submission);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('valid email address');
      });
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.org',
        'firstname.lastname@company.com',
        'user123@test-domain.net'
      ];
      
      validEmails.forEach(email => {
        const submission = { ...validSubmission, email };
        const result = validateFeedbackSubmission(submission);
        
        expect(result.success).toBe(true);
        expect(result.data?.email).toBe(email.toLowerCase());
      });
    });
  });
});