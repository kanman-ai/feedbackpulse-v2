/**
 * React hook for fetching and managing project analytics data in FeedbackPulse v2.
 * 
 * Provides:
 * - Real-time analytics metrics (total responses, average rating, response rate)
 * - Rating distribution data for charts
 * - Recent feedback submissions list
 * - Loading and error state management
 * - Automatic data refresh via Supabase subscriptions
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type FeedbackSubmission = Database['public']['Tables']['feedback_submissions']['Row']
type FeedbackSession = Database['public']['Tables']['feedback_sessions']['Row']

/**
 * Analytics data structure returned by the hook.
 * Contains all metrics and lists needed for the dashboard.
 */
export interface AnalyticsData {
  totalResponses: number
  averageRating: number
  responseRate: number
  ratingDistribution: Array<{
    rating: number
    count: number
  }>
  recentFeedback: Array<{
    id: string
    rating: number
    comment: string | null
    submitted_at: string
  }>
}

/**
 * Hook return type with data, loading, and error states.
 */
interface UseAnalyticsReturn {
  analytics: AnalyticsData | null
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

/**
 * Custom hook to fetch and manage analytics data for a project.
 * Automatically refreshes data and provides real-time updates.
 * 
 * @param projectId - UUID of the project to fetch analytics for
 * @returns Analytics data with loading and error states
 */
export function useAnalytics(projectId: string): UseAnalyticsReturn {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Using the shared Supabase client instance

  /**
   * Fetches analytics data from the database and calculates metrics.
   * Handles all data aggregation and formatting for the dashboard.
   */
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all feedback sessions for this project to calculate response rate
      const { data: sessions, error: sessionsError } = await supabase
        .from('feedback_sessions')
        .select('id')
        .eq('project_id', projectId)

      if (sessionsError) {
        throw new Error(`Failed to fetch sessions: ${sessionsError.message}`)
      }

      // Fetch all feedback submissions for this project with optional date filtering
      let submissionsQuery = supabase
        .from('feedback_submissions')
        .select(`
          id,
          rating,
          comment,
          submitted_at,
          feedback_sessions!inner(project_id)
        `)
        .eq('feedback_sessions.project_id', projectId)

      // Apply date range filtering if provided
      if (dateRange?.from) {
        submissionsQuery = submissionsQuery.gte('submitted_at', dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        submissionsQuery = submissionsQuery.lte('submitted_at', dateRange.to.toISOString())
      }

      submissionsQuery = submissionsQuery.order('submitted_at', { ascending: false })

      const { data: submissions, error: submissionsError } = await submissionsQuery

      if (submissionsError) {
        throw new Error(`Failed to fetch submissions: ${submissionsError.message}`)
      }

      // Calculate metrics
      const totalSessions = sessions?.length || 0
      const totalSubmissions = submissions?.length || 0
      
      // Calculate average rating
      const totalRating = submissions?.reduce((sum, sub) => sum + sub.rating, 0) || 0
      const averageRating = totalSubmissions > 0 ? totalRating / totalSubmissions : 0

      // Calculate response rate (percentage of sessions with feedback)
      const responseRate = totalSessions > 0 ? (totalSubmissions / totalSessions) * 100 : 0

      // Calculate rating distribution for chart
      const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      submissions?.forEach(submission => {
        if (submission.rating >= 1 && submission.rating <= 5) {
          ratingCounts[submission.rating as keyof typeof ratingCounts]++
        }
      })

      const ratingDistribution = Object.entries(ratingCounts).map(([rating, count]) => ({
        rating: parseInt(rating),
        count
      }))

      // Prepare recent feedback (top 10)
      const recentFeedback = (submissions?.slice(0, 10) || []).map(submission => ({
        id: submission.id,
        rating: submission.rating,
        comment: submission.comment,
        submitted_at: submission.submitted_at
      }))

      const analyticsData: AnalyticsData = {
        totalResponses: totalSubmissions,
        averageRating,
        responseRate,
        ratingDistribution,
        recentFeedback
      }

      setAnalytics(analyticsData)
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setLoading(false)
    }
  }, [projectId, dateRange?.from, dateRange?.to, supabase])

  /**
   * Public method to manually refresh analytics data.
   * Useful for triggering updates after new feedback is submitted.
   */
  const refresh = useCallback(async () => {
    await fetchAnalytics()
  }, [fetchAnalytics])

  // Initial data fetch - triggers when project or date range changes
  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Set up real-time subscriptions for automatic updates
  useEffect(() => {
    // Subscribe to feedback submissions changes
    const submissionsChannel = supabase
      .channel('analytics-submissions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feedback_submissions',
          filter: `feedback_sessions.project_id=eq.${projectId}`
        },
        () => {
          // Refresh analytics when feedback submissions change
          fetchAnalytics()
        }
      )
      .subscribe()

    // Subscribe to feedback sessions changes (affects response rate)
    const sessionsChannel = supabase
      .channel('analytics-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feedback_sessions',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          // Refresh analytics when sessions change
          fetchAnalytics()
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(submissionsChannel)
      supabase.removeChannel(sessionsChannel)
    }
  }, [projectId, supabase, fetchAnalytics])

  return {
    analytics,
    loading,
    error,
    refresh
  }
}