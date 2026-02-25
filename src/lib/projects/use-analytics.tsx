"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";

/**
 * Interface for date range filtering in analytics.
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Interface representing analytics metrics for a FeedbackPulse project.
 * Contains aggregated data about feedback volume, sentiment, and trends.
 */
export interface AnalyticsData {
  /** Total number of feedback submissions in the date range */
  totalFeedback: number;
  /** Average rating across all feedback (1-5 scale) */
  averageRating: number;
  /** Percentage change in feedback volume compared to previous period */
  feedbackGrowth: number;
  /** Percentage change in average rating compared to previous period */
  ratingTrend: number;
  /** Time-series data for charts showing feedback volume over time */
  chartData: Array<{
    date: string;
    feedback: number;
    rating: number;
  }>;
  /** Breakdown of feedback by sentiment categories */
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  /** Recent feedback items for preview display */
  recentFeedback: Array<{
    id: string;
    content: string;
    rating: number;
    createdAt: string;
    userEmail?: string;
  }>;
}

/**
 * SWR fetcher function that includes authentication headers.
 * 
 * @param url - API endpoint URL to fetch from
 * @returns Parsed JSON response data
 * @throws Error if the request fails or returns non-200 status
 */
async function fetcher(url: string): Promise<AnalyticsData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Analytics API error: ${response.status}`);
  }
  return response.json();
}

/**
 * React hook for fetching and managing project analytics data in FeedbackPulse v2.
 * Provides aggregated metrics including feedback counts, response trends, and sentiment analysis.
 * Automatically refetches data when project ID or date range changes.
 * 
 * @param projectId - UUID of the project to fetch analytics for
 * @param dateRange - Date range filter for analytics data (optional)
 * @returns Analytics data with loading states and error handling
 */
export function useAnalytics(projectId: string, dateRange?: DateRange) {
  const { data: session } = useSession();

  // Build query parameters for date filtering
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (dateRange) {
      params.set('startDate', dateRange.startDate.toISOString());
      params.set('endDate', dateRange.endDate.toISOString());
    }
    return params.toString();
  }, [dateRange]);

  // Construct the API URL with query parameters
  const apiUrl = useMemo(() => {
    if (!projectId) return null;
    const baseUrl = `/api/projects/${projectId}/analytics`;
    return queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
  }, [projectId, queryParams]);

  const { data, error, isLoading, mutate } = useSWR(
    // Only fetch if we have a project ID and user session
    session && apiUrl ? apiUrl : null,
    fetcher,
    {
      // Refresh every 5 minutes to keep data current
      refreshInterval: 5 * 60 * 1000,
      // Keep data fresh but allow stale data while revalidating
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    /** Analytics data or undefined if still loading */
    data,
    /** Loading state - true while fetching initial data */
    isLoading,
    /** Error object if the fetch failed */
    error,
    /** Function to manually trigger a data refresh */
    refresh: mutate,
    /** True if user is not authenticated (blocks data fetching) */
    isUnauthorized: !session
  };
}