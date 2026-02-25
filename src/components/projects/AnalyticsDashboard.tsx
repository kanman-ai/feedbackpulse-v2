/**
 * Analytics dashboard component for FeedbackPulse v2 project insights.
 * 
 * Displays:
 * - Three key metric cards (total responses, average rating, response rate)
 * - Bar chart showing rating distribution (1-5 stars) using Recharts
 * - Recent feedback list with latest 10 submissions
 * 
 * Uses client-side data fetching with real-time updates via Supabase subscriptions.
 */

'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Calendar } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAnalytics, DateRangeValue } from '@/lib/projects/use-analytics'
import { DateRangePicker, DATE_RANGE_PRESETS } from '@/components/ui/date-range-picker'

interface AnalyticsDashboardProps {
  projectId: string
}

/**
 * Main analytics dashboard component that orchestrates data display.
 * Manages loading states and error handling for analytics data.
 * 
 * @param projectId - UUID of the project to show analytics for
 */
export function AnalyticsDashboard({ projectId }: AnalyticsDashboardProps) {
  // State for managing selected date range filter
  const [dateRange, setDateRange] = useState<DateRangeValue | undefined>(() => {
    // Default to last 30 days for better initial UX
    return DATE_RANGE_PRESETS.LAST_30_DAYS.getRange()
  })
  
  const { analytics, loading, error } = useAnalytics(projectId, dateRange)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Analytics</CardTitle>
          <CardDescription>
            {error.message || 'Failed to load analytics data. Please try again.'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Analytics Data</CardTitle>
          <CardDescription>
            No feedback submissions found for this project yet.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header with Date Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Insights and metrics for your feedback data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Select date range"
            className="w-[280px]"
          />
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Total Responses"
          value={analytics.totalResponses.toString()}
          description="Total feedback submissions received"
        />
        <MetricCard
          title="Average Rating"
          value={analytics.averageRating.toFixed(1)}
          description="Average rating across all feedback"
          suffix="/ 5.0"
        />
        <MetricCard
          title="Response Rate"
          value={analytics.responseRate.toFixed(1)}
          description="Percentage of sessions with feedback"
          suffix="%"
        />
      </div>

      {/* Rating Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
          <CardDescription>
            Breakdown of feedback ratings from 1 to 5 stars
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.ratingDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="rating" 
                  tickFormatter={(value) => `${value} Star${value === 1 ? '' : 's'}`}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, 'Count']}
                  labelFormatter={(label) => `${label} Star${label === '1' ? '' : 's'}`}
                />
                <Bar 
                  dataKey="count" 
                  fill="#8884d8" 
                  name="Responses"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>
            Latest 10 feedback submissions with ratings and comments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.recentFeedback.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No feedback submissions yet.
            </p>
          ) : (
            <div className="space-y-4">
              {analytics.recentFeedback.map((feedback) => (
                <FeedbackItem key={feedback.id} feedback={feedback} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Metric card component for displaying key analytics numbers.
 * Provides consistent styling for dashboard stats.
 * 
 * @param title - Display name of the metric
 * @param value - Primary metric value to display
 * @param description - Explanatory text for the metric
 * @param suffix - Optional suffix to append to the value
 */
interface MetricCardProps {
  title: string
  value: string
  description: string
  suffix?: string
}

function MetricCard({ title, value, description, suffix }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

/**
 * Individual feedback item display component.
 * Shows rating, comment preview, and submission timestamp.
 * 
 * @param feedback - Feedback submission data to display
 */
interface FeedbackItemProps {
  feedback: {
    id: string
    rating: number
    comment: string | null
    submitted_at: string
  }
}

function FeedbackItem({ feedback }: FeedbackItemProps) {
  // Format the timestamp for display
  const submittedDate = new Date(feedback.submitted_at)
  const timeAgo = getTimeAgo(submittedDate)
  
  // Truncate long comments for preview
  const commentPreview = feedback.comment 
    ? feedback.comment.length > 100 
      ? feedback.comment.substring(0, 100) + '...'
      : feedback.comment
    : 'No comment provided'

  return (
    <div className="border-b border-border pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center">
              {/* Star rating display */}
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-sm ${
                    star <= feedback.rating 
                      ? 'text-yellow-400' 
                      : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {feedback.rating}/5
            </span>
          </div>
          <p className="text-sm text-foreground break-words">
            {commentPreview}
          </p>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
          {timeAgo}
        </span>
      </div>
    </div>
  )
}

/**
 * Calculates a human-readable "time ago" string from a date.
 * Returns relative time like "2 minutes ago" or "3 hours ago".
 * 
 * @param date - Date to calculate time difference from
 * @returns Human-readable relative time string
 */
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`
  }

  // For older dates, show the actual date
  return date.toLocaleDateString()
}