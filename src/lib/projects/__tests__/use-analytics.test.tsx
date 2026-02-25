/**
 * Test suite for useAnalytics hook in FeedbackPulse v2.
 * 
 * Tests the analytics data fetching hook's ability to:
 * - Fetch analytics data via SWR from the REST API
 * - Handle date range filtering parameters
 * - Process loading, error, and success states
 * - Manage authentication requirements
 * - Refresh data on demand
 */

import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useAnalytics, type DateRange } from '../use-analytics'

// Mock next-auth
vi.mock('next-auth/react')
const mockUseSession = vi.mocked(useSession)

// Mock SWR
vi.mock('swr')
import useSWR from 'swr'
const mockUseSWR = vi.mocked(useSWR)

// Mock fetch for the fetcher function
global.fetch = vi.fn()
const mockFetch = vi.mocked(fetch)

describe('useAnalytics', () => {
  const projectId = 'test-project-id'
  
  const mockAnalyticsData = {
    totalFeedback: 150,
    averageRating: 4.2,
    feedbackGrowth: 15.5,
    ratingTrend: -2.1,
    chartData: [
      { date: '2024-01-15', feedback: 25, rating: 4.3 },
      { date: '2024-01-16', feedback: 30, rating: 4.1 },
      { date: '2024-01-17', feedback: 35, rating: 4.2 }
    ],
    sentimentBreakdown: {
      positive: 90,
      neutral: 35,
      negative: 25
    },
    recentFeedback: [
      {
        id: 'feedback-1',
        content: 'Great experience!',
        rating: 5,
        createdAt: '2024-01-17T10:30:00Z',
        userEmail: 'user@example.com'
      },
      {
        id: 'feedback-2',
        content: 'Good service',
        rating: 4,
        createdAt: '2024-01-16T15:20:00Z'
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default session mock (authenticated)
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      status: 'authenticated'
    } as any)

    // Default SWR mock (success)
    mockUseSWR.mockReturnValue({
      data: mockAnalyticsData,
      error: null,
      isLoading: false,
      mutate: vi.fn()
    } as any)

    // Default fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAnalyticsData)
    } as any)
  })

  it('should fetch analytics data without date range', () => {
    const { result } = renderHook(() => useAnalytics(projectId))

    expect(mockUseSWR).toHaveBeenCalledWith(
      `/api/projects/${projectId}/analytics`,
      expect.any(Function),
      expect.objectContaining({
        refreshInterval: 5 * 60 * 1000,
        revalidateOnFocus: true,
        revalidateOnReconnect: true
      })
    )

    expect(result.current.data).toEqual(mockAnalyticsData)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.isUnauthorized).toBe(false)
  })

  it('should include date range in query parameters', () => {
    const dateRange: DateRange = {
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-17T23:59:59Z')
    }

    renderHook(() => useAnalytics(projectId, dateRange))

    expect(mockUseSWR).toHaveBeenCalledWith(
      expect.stringMatching(
        new RegExp(`/api/projects/${projectId}/analytics\\?startDate=.*&endDate=.*`)
      ),
      expect.any(Function),
      expect.any(Object)
    )
  })

  it('should handle loading state', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
      mutate: vi.fn()
    } as any)

    const { result } = renderHook(() => useAnalytics(projectId))

    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBe(null)
  })

  it('should handle error state', () => {
    const mockError = new Error('API Error')
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: mockError,
      isLoading: false,
      mutate: vi.fn()
    } as any)

    const { result } = renderHook(() => useAnalytics(projectId))

    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(mockError)
  })

  it('should handle unauthorized state (no session)', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated'
    } as any)

    const { result } = renderHook(() => useAnalytics(projectId))

    expect(mockUseSWR).toHaveBeenCalledWith(
      null, // Should not fetch when no session
      expect.any(Function),
      expect.any(Object)
    )

    expect(result.current.isUnauthorized).toBe(true)
  })

  it('should not fetch when projectId is empty', () => {
    const { result } = renderHook(() => useAnalytics(''))

    expect(mockUseSWR).toHaveBeenCalledWith(
      null,
      expect.any(Function),
      expect.any(Object)
    )
  })

  it('should provide refresh function', () => {
    const mockMutate = vi.fn()
    mockUseSWR.mockReturnValue({
      data: mockAnalyticsData,
      error: null,
      isLoading: false,
      mutate: mockMutate
    } as any)

    const { result } = renderHook(() => useAnalytics(projectId))

    expect(result.current.refresh).toBe(mockMutate)
    expect(typeof result.current.refresh).toBe('function')
  })

  it('should update query when date range changes', () => {
    const { rerender } = renderHook(
      ({ dateRange }) => useAnalytics(projectId, dateRange),
      {
        initialProps: { dateRange: undefined }
      }
    )

    // Initially no date range
    expect(mockUseSWR).toHaveBeenLastCalledWith(
      `/api/projects/${projectId}/analytics`,
      expect.any(Function),
      expect.any(Object)
    )

    // Add date range
    const dateRange: DateRange = {
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-17')
    }

    rerender({ dateRange })

    expect(mockUseSWR).toHaveBeenLastCalledWith(
      expect.stringMatching(
        new RegExp(`/api/projects/${projectId}/analytics\\?startDate=.*&endDate=.*`)
      ),
      expect.any(Function),
      expect.any(Object)
    )
  })

  describe('fetcher function', async () => {
    it('should handle successful API response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData)
      } as any)

      const fetcher = mockUseSWR.mock.calls[0][1]
      const result = await fetcher('/api/test')

      expect(mockFetch).toHaveBeenCalledWith('/api/test')
      expect(result).toEqual(mockAnalyticsData)
    })

    it('should handle API error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500
      } as any)

      const fetcher = mockUseSWR.mock.calls[0][1]
      
      await expect(fetcher('/api/test')).rejects.toThrow('Analytics API error: 500')
    })

    it('should handle network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const fetcher = mockUseSWR.mock.calls[0][1]
      
      await expect(fetcher('/api/test')).rejects.toThrow('Network error')
    })
  })
})