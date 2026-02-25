/**
 * FeedbackPulse v2 Feedback API Route
 * 
 * Handles submission of user feedback from the widget component.
 * Accepts feedback data including rating, comment, optional email,
 * and project context, then stores it in the Supabase database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

/**
 * Interface for feedback submission payload
 */
interface FeedbackSubmission {
  project_id: string;
  rating: number;
  comment: string;
  email?: string;
  source: string;
}

/**
 * Validates the incoming feedback data to ensure all required fields are present
 * and meet the expected format requirements.
 * 
 * @param data - Raw feedback data from request body
 * @returns Validation result with success flag and error message
 */
function validateFeedbackData(data: any): { isValid: boolean; error?: string } {
  if (!data) {
    return { isValid: false, error: 'No data provided' };
  }

  if (!data.project_id || typeof data.project_id !== 'string') {
    return { isValid: false, error: 'Project ID is required' };
  }

  if (!data.rating || typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5) {
    return { isValid: false, error: 'Rating must be a number between 1 and 5' };
  }

  if (!data.comment || typeof data.comment !== 'string' || !data.comment.trim()) {
    return { isValid: false, error: 'Comment is required' };
  }

  if (data.comment.length > 500) {
    return { isValid: false, error: 'Comment must be 500 characters or less' };
  }

  if (data.email && (typeof data.email !== 'string' || !isValidEmail(data.email))) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (!data.source || typeof data.source !== 'string') {
    return { isValid: false, error: 'Source is required' };
  }

  return { isValid: true };
}

/**
 * Validates email format using a simple regex pattern.
 * 
 * @param email - Email string to validate
 * @returns True if email format is valid, false otherwise
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * POST handler for feedback submissions.
 * Validates the incoming data and stores it in the database.
 * 
 * @param request - Next.js request object containing feedback data
 * @returns JSON response with success/error status
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate the incoming data
    const validation = validateFeedbackData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Create Supabase client for database operations
    const supabase = createClient();
    
    // Verify that the project exists and is accessible
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', body.project_id)
      .single();

    if (projectError || !project) {
      console.error('Project validation failed:', projectError);
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 404 }
      );
    }

    // Insert feedback into the database
    const { data: feedback, error: insertError } = await supabase
      .from('feedback')
      .insert({
        project_id: body.project_id,
        rating: body.rating,
        comment: body.comment.trim(),
        email: body.email?.trim() || null,
        source: body.source,
        submitted_at: new Date().toISOString(),
        user_agent: request.headers.get('user-agent') || null,
        ip_address: request.ip || request.headers.get('x-forwarded-for') || null
      } as any)
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert feedback:', insertError);
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback_id: feedback?.id
    }, { status: 201 });

  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS requests for CORS preflight.
 * Allows the widget to submit feedback from any domain.
 * 
 * @returns Response with CORS headers
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
