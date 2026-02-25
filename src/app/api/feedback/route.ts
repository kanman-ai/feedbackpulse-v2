/**
 * Feedback submission API endpoint for FeedbackPulse v2.
 * 
 * This endpoint handles POST requests for feedback submissions from various sources
 * including embeddable widgets, direct app interactions, and API integrations.
 * 
 * Features:
 * - Input validation and sanitization
 * - Rate limiting to prevent spam
 * - CORS headers for cross-origin widget support
 * - Automatic sentiment analysis
 * - Supabase storage with proper error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase';
import { validateFeedbackSubmission } from '../../../lib/validation';
import { analyzeSentiment } from '../../../lib/sentiment';
import { checkRateLimit, DEFAULT_RATE_LIMITS } from '../../../lib/rate-limit';

/**
 * CORS headers for cross-origin requests (needed for embeddable widgets).
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
} as const;

/**
 * Handles OPTIONS requests for CORS preflight.
 * Required for embeddable widgets making cross-origin requests.
 * 
 * @returns Response with CORS headers allowing POST requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS
  });
}

/**
 * Extracts client IP address from request headers.
 * Handles various proxy and CDN configurations.
 * 
 * @param request - The incoming request object
 * @returns The client IP address or null if not determinable
 */
function getClientIP(request: NextRequest): string | null {
  // Try various headers in order of reliability
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to connection remote address (may be proxy)
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return null; // Unable to determine IP
}

/**
 * Creates a rate limiting identifier from request.
 * Uses IP address primarily, falls back to user agent for basic protection.
 * 
 * @param request - The incoming request object
 * @returns Identifier string for rate limiting
 */
function getRateLimitIdentifier(request: NextRequest): string {
  const ip = getClientIP(request);
  if (ip) {
    return `ip:${ip}`;
  }
  
  // Fallback to user agent (less reliable but better than nothing)
  const userAgent = request.headers.get('user-agent');
  if (userAgent) {
    // Hash the user agent to avoid storing full strings
    const hash = userAgent.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `ua:${Math.abs(hash)}`;
  }
  
  // Last resort - static identifier (minimal protection)
  return 'unknown';
}

/**
 * Handles POST requests for feedback submission.
 * 
 * Process flow:
 * 1. Validate request method and content type
 * 2. Check rate limiting to prevent spam
 * 3. Parse and validate input data
 * 4. Perform sentiment analysis on comment
 * 5. Store feedback in Supabase database
 * 6. Return success response with CORS headers
 * 
 * @param request - The incoming POST request
 * @returns JSON response with success/error status
 */
export async function POST(request: NextRequest) {
  try {
    // Check rate limiting first to prevent abuse
    const rateLimitId = getRateLimitIdentifier(request);
    const rateLimitResult = checkRateLimit(rateLimitId, DEFAULT_RATE_LIMITS.FEEDBACK_SUBMISSION);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimitResult.message,
          retryAfter: Math.ceil(rateLimitResult.resetTime / 1000) // Convert to seconds
        },
        { 
          status: 429, // Too Many Requests
          headers: {
            ...CORS_HEADERS,
            'Retry-After': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': Math.max(0, rateLimitResult.limit - rateLimitResult.currentCount).toString(),
            'X-RateLimit-Reset': new Date(Date.now() + rateLimitResult.resetTime).toISOString()
          }
        }
      );
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body'
        },
        { 
          status: 400,
          headers: CORS_HEADERS
        }
      );
    }

    // Validate input data
    const validation = validateFeedbackSubmission(requestBody);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error
        },
        { 
          status: 400,
          headers: CORS_HEADERS
        }
      );
    }

    const feedbackData = validation.data!;

    // Perform sentiment analysis on comment
    const sentimentAnalysis = analyzeSentiment(feedbackData.comment);

    // Extract additional request metadata
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent');
    const referer = request.headers.get('referer'); // Source URL

    // Create Supabase client
    const supabase = createClient();

    // Prepare database record
    const feedbackRecord = {
      project_id: feedbackData.projectId,
      rating: feedbackData.rating,
      comment: feedbackData.comment,
      email: feedbackData.email,
      source_url: referer,
      source_type: feedbackData.source as 'widget' | 'email' | 'manual' | 'api',
      sentiment: sentimentAnalysis.sentiment,
      user_agent: userAgent,
      ip_address: clientIP,
      // created_at is handled by database default
    };

    // Insert feedback into database
    const { data: insertedFeedback, error: insertError } = await supabase
      .from('feedback')
      .insert(feedbackRecord)
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      
      // Check if it's a foreign key constraint error (invalid project ID)
      if (insertError.code === '23503') {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid project ID. The specified project does not exist.'
          },
          { 
            status: 400,
            headers: CORS_HEADERS
          }
        );
      }
      
      // Generic database error
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save feedback. Please try again later.'
        },
        { 
          status: 500,
          headers: CORS_HEADERS
        }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Feedback submitted successfully',
        data: {
          id: insertedFeedback.id,
          sentiment: sentimentAnalysis.sentiment,
          sentimentConfidence: sentimentAnalysis.confidence
        }
      },
      { 
        status: 201, // Created
        headers: {
          ...CORS_HEADERS,
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': Math.max(0, rateLimitResult.limit - rateLimitResult.currentCount).toString(),
        }
      }
    );

  } catch (error) {
    console.error('Unexpected error in feedback submission:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again later.'
      },
      { 
        status: 500,
        headers: CORS_HEADERS
      }
    );
  }
}

/**
 * Handles unsupported HTTP methods.
 * Returns 405 Method Not Allowed with proper CORS headers.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to submit feedback.'
    },
    {
      status: 405,
      headers: {
        ...CORS_HEADERS,
        'Allow': 'POST, OPTIONS'
      }
    }
  );
}

// Export the same handler for other unsupported methods
export const PUT = GET;
export const DELETE = GET;
export const PATCH = GET;