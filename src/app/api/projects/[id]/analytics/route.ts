/**
 * Analytics API endpoint for FeedbackPulse v2 projects.
 * 
 * Provides aggregated analytics data for a specific project, with optional
 * date range filtering. Returns metrics including feedback counts, average
 * ratings, sentiment analysis, and time-series data for charts.
 * 
 * Query Parameters:
 * - startDate: ISO string for filtering start date (optional)
 * - endDate: ISO string for filtering end date (optional)
 * 
 * @example GET /api/projects/123/analytics?startDate=2024-01-01&endDate=2024-01-31
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * Interface for analytics response data.
 */
export interface AnalyticsResponse {
  totalFeedback: number
  averageRating: number
  feedbackGrowth: number
  ratingTrend: number
  chartData: Array<{
    date: string
    feedback: number
    rating: number
  }>
  sentimentBreakdown: {
    positive: number
    neutral: number
    negative: number
  }
  recentFeedback: Array<{
    id: string
    content: string
    rating: number
    createdAt: string
    userEmail?: string
  }>
}

/**
 * GET handler for project analytics endpoint.
 * 
 * Fetches and aggregates feedback data for a specific project with optional
 * date range filtering. Requires authentication and project access permissions.
 * 
 * @param request - Next.js request object with query parameters
 * @param context - Route context containing project ID parameter
 * @returns JSON response with analytics data or error message
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<AnalyticsResponse | { error: string }>> {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const projectId = params.id
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Initialize Supabase client
    const supabase = createClient()

    // Verify project access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Build base query for feedback data
    let feedbackQuery = supabase
      .from('feedback')
      .select('*')
      .eq('project_id', projectId)

    // Apply date range filtering if provided
    if (startDate) {
      feedbackQuery = feedbackQuery.gte('created_at', startDate)
    }
    if (endDate) {
      feedbackQuery = feedbackQuery.lte('created_at', endDate)
    }

    // Fetch feedback data
    const { data: feedbackData, error: feedbackError } = await feedbackQuery
      .order('created_at', { ascending: false })

    if (feedbackError) {
      console.error('Feedback query error:', feedbackError)
      return NextResponse.json(
        { error: 'Failed to fetch feedback data' },
        { status: 500 }
      )
    }

    const feedback = feedbackData || []

    // Calculate total feedback count
    const totalFeedback = feedback.length

    // Calculate average rating
    const ratingsSum = feedback.reduce((sum, item) => {
      const rating = typeof item.rating === 'number' ? item.rating : 0
      return sum + rating
    }, 0)
    const averageRating = totalFeedback > 0 ? ratingsSum / totalFeedback : 0

    // Calculate growth metrics (compare with previous period)
    const periodStart = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const periodEnd = endDate ? new Date(endDate) : new Date()
    const periodDuration = periodEnd.getTime() - periodStart.getTime()
    
    const previousPeriodStart = new Date(periodStart.getTime() - periodDuration)
    const previousPeriodEnd = new Date(periodStart.getTime())

    // Fetch previous period data for comparison
    let previousQuery = supabase
      .from('feedback')
      .select('rating')
      .eq('project_id', projectId)
      .gte('created_at', previousPeriodStart.toISOString())
      .lte('created_at', previousPeriodEnd.toISOString())

    const { data: previousData } = await previousQuery
    const previousFeedback = previousData || []
    const previousCount = previousFeedback.length
    const previousRatingSum = previousFeedback.reduce((sum, item) => {
      return sum + (typeof item.rating === 'number' ? item.rating : 0)
    }, 0)
    const previousAverageRating = previousCount > 0 ? previousRatingSum / previousCount : 0

    // Calculate growth percentages
    const feedbackGrowth = previousCount > 0 
      ? ((totalFeedback - previousCount) / previousCount) * 100 
      : 0
    const ratingTrend = previousAverageRating > 0 
      ? ((averageRating - previousAverageRating) / previousAverageRating) * 100 
      : 0

    // Generate chart data (daily aggregations)
    const chartData = generateChartData(feedback, periodStart, periodEnd)

    // Calculate sentiment breakdown
    const sentimentBreakdown = calculateSentimentBreakdown(feedback)

    // Get recent feedback (limit to 10 items)
    const recentFeedback = feedback.slice(0, 10).map(item => ({
      id: item.id,
      content: item.content || '',
      rating: typeof item.rating === 'number' ? item.rating : 0,
      createdAt: item.created_at,
      userEmail: item.user_email || undefined
    }))

    const response: AnalyticsResponse = {
      totalFeedback,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      feedbackGrowth: Math.round(feedbackGrowth * 10) / 10,
      ratingTrend: Math.round(ratingTrend * 10) / 10,
      chartData,
      sentimentBreakdown,
      recentFeedback
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generates time-series chart data by aggregating feedback by day.
 * 
 * @param feedback - Raw feedback data array
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @returns Array of daily aggregated data points
 */
function generateChartData(
  feedback: any[],
  startDate: Date,
  endDate: Date
): Array<{ date: string; feedback: number; rating: number }> {
  const chartData: Array<{ date: string; feedback: number; rating: number }> = []
  
  // Create a map to store daily aggregations
  const dailyData = new Map<string, { count: number; ratingSum: number }>()

  // Process each feedback item
  feedback.forEach(item => {
    const date = new Date(item.created_at).toISOString().split('T')[0] // Get YYYY-MM-DD
    const rating = typeof item.rating === 'number' ? item.rating : 0
    
    if (dailyData.has(date)) {
      const existing = dailyData.get(date)!
      dailyData.set(date, {
        count: existing.count + 1,
        ratingSum: existing.ratingSum + rating
      })
    } else {
      dailyData.set(date, {
        count: 1,
        ratingSum: rating
      })
    }
  })

  // Fill in missing days with zero data
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const data = dailyData.get(dateStr) || { count: 0, ratingSum: 0 }
    
    chartData.push({
      date: dateStr,
      feedback: data.count,
      rating: data.count > 0 ? data.ratingSum / data.count : 0
    })
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return chartData.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Calculates sentiment breakdown based on feedback ratings.
 * 
 * Uses rating thresholds:
 * - Positive: 4-5 stars
 * - Neutral: 3 stars  
 * - Negative: 1-2 stars
 * 
 * @param feedback - Raw feedback data array
 * @returns Object with positive, neutral, and negative counts
 */
function calculateSentimentBreakdown(feedback: any[]): {
  positive: number
  neutral: number
  negative: number
} {
  let positive = 0
  let neutral = 0
  let negative = 0

  feedback.forEach(item => {
    const rating = typeof item.rating === 'number' ? item.rating : 0
    
    if (rating >= 4) {
      positive++
    } else if (rating === 3) {
      neutral++
    } else if (rating >= 1) {
      negative++
    }
    // Items with rating 0 or invalid ratings are excluded
  })

  return { positive, neutral, negative }
}