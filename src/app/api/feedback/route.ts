/**
 * API route handler for feedback submissions from the embeddable widget.
 * 
 * This endpoint receives feedback data from embedded widgets on customer websites,
 * validates the data, and stores it in the database for processing.
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Type definition for incoming feedback data
 */
interface FeedbackSubmission {
  projectId: string
  type: 'bug' | 'feature' | 'improvement' | 'other'
  message: string
  email?: string
  url: string
  userAgent: string
  timestamp: string
}

/**
 * Validates the incoming feedback data
 * @param data - The data to validate
 * @returns True if valid, false otherwise
 */
function validateFeedbackData(data: any): data is FeedbackSubmission {
  return (
    typeof data === 'object' &&
    typeof data.projectId === 'string' &&
    data.projectId.length > 0 &&
    typeof data.type === 'string' &&
    ['bug', 'feature', 'improvement', 'other'].includes(data.type) &&
    typeof data.message === 'string' &&
    data.message.trim().length > 0 &&
    typeof data.url === 'string' &&
    typeof data.userAgent === 'string' &&
    typeof data.timestamp === 'string' &&
    (data.email === undefined || typeof data.email === 'string')
  )
}

/**
 * Sanitizes text input to prevent XSS and other security issues
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 5000) // Limit length
}

/**
 * Stores feedback in the database (placeholder implementation)
 * In a real application, this would integrate with your database layer
 * @param feedback - The validated feedback data
 * @returns Promise resolving to the stored feedback record
 */
async function storeFeedback(feedback: FeedbackSubmission) {
  // TODO: Integrate with your database layer (Supabase, Prisma, etc.)
  // For now, we'll simulate storage and return a mock response
  
  const feedbackRecord = {
    id: generateId(),
    projectId: feedback.projectId,
    type: feedback.type,
    message: sanitizeText(feedback.message),
    email: feedback.email ? sanitizeText(feedback.email) : null,
    url: feedback.url,
    userAgent: feedback.userAgent,
    timestamp: feedback.timestamp,
    status: 'new',
    createdAt: new Date().toISOString()
  }

  // In a real implementation, you would save to your database here
  console.log('Storing feedback:', feedbackRecord)
  
  return feedbackRecord
}

/**
 * Generates a simple ID (in production, use a proper UUID library)
 * @returns A random ID string
 */
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Handles POST requests to submit feedback
 * @param request - The incoming request
 * @returns Response with success or error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate the feedback data
    if (!validateFeedbackData(body)) {
      return NextResponse.json(
        { error: 'Invalid feedback data provided' },
        { status: 400 }
      )
    }

    // Store the feedback
    const storedFeedback = await storeFeedback(body)

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      id: storedFeedback.id
    })

  } catch (error) {
    console.error('Error processing feedback:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handles OPTIONS requests for CORS preflight
 * @returns Response with CORS headers
 */
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}