/**
 * API route for public feedback view endpoint.
 * Provides read-only access to project feedback data via public token.
 * No authentication required, but rate limited to 30 requests/min per IP.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { checkRateLimit, PUBLIC_FEEDBACK_RATE_LIMIT } from '@/lib/rate-limit'

/**
 * Public feedback data structure returned by the API
 */
interface PublicFeedbackData {
  /** Project name */
  project_name: string
  /** Total number of feedback responses */
  total_responses: number
  /** Average rating across all responses */
  average_rating: number
  /** Recent feedback responses (top 20 most helpful/recent) */
  recent_feedback: Array<{
    id: string
    rating: number
    feedback_text: string | null
    helpful_votes: number
    created_at: string
  }>
}

/**
 * GET /api/feedback/[public_token]
 * 
 * Retrieves public feedback data for a project using its public token.
 * Returns project name, total responses, average rating, and recent feedback.
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing public_token
 * @returns JSON response with feedback data or error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { public_token: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = checkRateLimit(request, PUBLIC_FEEDBACK_RATE_LIMIT)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.' 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': PUBLIC_FEEDBACK_RATE_LIMIT.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }
    
    const { public_token } = params
    
    if (!public_token) {
      return NextResponse.json(
        { error: 'Public token is required' },
        { status: 400 }
      )
    }
    
    // Create admin Supabase client (bypasses RLS for public endpoints)
    const supabase = createAdminSupabaseClient()
    
    // Find project by public token
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('public_token', public_token)
      .single() as { data: { id: string, name: string } | null, error: any }
    
    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or public sharing not enabled' },
        { status: 404 }
      )
    }
    
    // Get feedback statistics
    const { data: responses, error: responsesError } = await supabase
      .from('feedback_responses')
      .select('id, rating, feedback_text, helpful_votes, created_at')
      .eq('project_id', project.id)
      .order('helpful_votes', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20) as { data: any[] | null, error: any }
    
    if (responsesError) {
      console.error('Error fetching feedback responses:', responsesError)
      return NextResponse.json(
        { error: 'Failed to fetch feedback data' },
        { status: 500 }
      )
    }
    
    // Get total count and average rating
    const { data: stats, error: statsError } = await supabase
      .from('feedback_responses')
      .select('rating')
      .eq('project_id', project.id) as { data: { rating: number }[] | null, error: any }
    
    if (statsError) {
      console.error('Error fetching feedback stats:', statsError)
      return NextResponse.json(
        { error: 'Failed to fetch feedback statistics' },
        { status: 500 }
      )
    }
    
    // Calculate statistics
    const totalResponses = stats?.length || 0
    const averageRating = totalResponses > 0
      ? stats!.reduce((sum, response) => sum + response.rating, 0) / totalResponses
      : 0
    
    // Prepare response data
    const feedbackData: PublicFeedbackData = {
      project_name: project.name,
      total_responses: totalResponses,
      average_rating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
      recent_feedback: responses || []
    }
    
    // Add rate limit headers to successful response
    return NextResponse.json(feedbackData, {
      headers: {
        'X-RateLimit-Limit': PUBLIC_FEEDBACK_RATE_LIMIT.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
        'Cache-Control': 'public, s-maxage=60' // Cache for 1 minute
      }
    })
    
  } catch (error) {
    console.error('Error in public feedback API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}