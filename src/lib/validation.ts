/**
 * Input validation utilities for FeedbackPulse v2 API endpoints.
 * 
 * This module provides functions to validate user input for feedback submissions,
 * ensuring data integrity and security before processing.
 */

/**
 * Feedback submission data structure expected by the API.
 */
export interface FeedbackSubmission {
  /** ID of the project this feedback is for */
  projectId: string;
  /** Rating score (1-5 scale) */
  rating: number;
  /** Optional text comment from the user */
  comment?: string;
  /** Optional email address for follow-up */
  email?: string;
  /** Source of the feedback (e.g., 'widget', 'app', 'email') */
  source: string;
}

/**
 * Validation result containing the validated data or error information.
 */
export interface ValidationResult<T> {
  /** Whether validation passed */
  success: boolean;
  /** Validated and sanitized data (only present if success is true) */
  data?: T;
  /** Error message describing validation failure */
  error?: string;
}

/**
 * Validates feedback submission data against business rules and security requirements.
 * Performs input sanitization, type checking, and business logic validation.
 * 
 * @param input - Raw input data from the request body
 * @returns ValidationResult containing either validated data or error message
 */
export function validateFeedbackSubmission(input: any): ValidationResult<FeedbackSubmission> {
  // Check if input is an object
  if (!input || typeof input !== 'object') {
    return {
      success: false,
      error: 'Request body must be a valid JSON object'
    };
  }

  // Validate required fields
  if (!input.projectId || typeof input.projectId !== 'string') {
    return {
      success: false,
      error: 'projectId is required and must be a string'
    };
  }

  // Validate project ID format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(input.projectId)) {
    return {
      success: false,
      error: 'projectId must be a valid UUID'
    };
  }

  // Validate rating
  if (input.rating === undefined || input.rating === null) {
    return {
      success: false,
      error: 'rating is required'
    };
  }

  // Reject non-numeric types first
  if (typeof input.rating !== 'number') {
    return {
      success: false,
      error: 'rating must be an integer between 1 and 5'
    };
  }

  const rating = input.rating;
  if (isNaN(rating) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return {
      success: false,
      error: 'rating must be an integer between 1 and 5'
    };
  }

  // Validate source
  if (!input.source || typeof input.source !== 'string') {
    return {
      success: false,
      error: 'source is required and must be a string'
    };
  }

  // Sanitize and validate optional comment
  let comment: string | undefined;
  if (input.comment) {
    if (typeof input.comment !== 'string') {
      return {
        success: false,
        error: 'comment must be a string if provided'
      };
    }
    
    // Trim whitespace and check length
    comment = input.comment.trim();
    if (comment.length > 2000) {
      return {
        success: false,
        error: 'comment must not exceed 2000 characters'
      };
    }
    
    // Set to undefined if empty after trimming
    if (comment.length === 0) {
      comment = undefined;
    }
  }

  // Validate optional email
  let email: string | undefined;
  if (input.email) {
    if (typeof input.email !== 'string') {
      return {
        success: false,
        error: 'email must be a string if provided'
      };
    }
    
    // Strict email validation
    const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*[a-zA-Z0-9]@[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$|^[a-zA-Z0-9]@[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    email = input.email.trim().toLowerCase();
    if (email && !emailRegex.test(email)) {
      return {
        success: false,
        error: 'email must be a valid email address'
      };
    }
    
    // Set to undefined if empty after trimming
    if (email.length === 0) {
      email = undefined;
    }
  }

  // Validate source constraints
  const allowedSources = ['widget', 'app', 'email', 'api', 'survey'];
  if (!allowedSources.includes(input.source)) {
    return {
      success: false,
      error: `source must be one of: ${allowedSources.join(', ')}`
    };
  }

  // Return validated data
  return {
    success: true,
    data: {
      projectId: input.projectId,
      rating,
      comment,
      email,
      source: input.source
    }
  };
}