/**
 * Test suite for useAnalytics hook.
 * 
 * Tests the analytics data fetching hook's ability to:
 * - Fetch and aggregate feedback data from Supabase
 * - Calculate metrics (total responses, average rating, response rate)
 * - Process rating distribution for charts
 * - Handle loading and error states
 * - Refresh data on demand
 */

import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { useAnalytics } from '../use-analytics'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  channel: vi.fn(),
  removeChannel: vi.fn()
}

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase
}))

describe('useAnalytics', () => {
  const projectId = 'test-project-id'
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mock implementations
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn(),
          order: vi.fn().mockReturnValue({
            eq: vi.fn()
          })
        })
      })
    })

    // Mock channel subscriptions
    mockSupabase.channel.mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn()
      })
    })
  })

  it('should fetch and calculate analytics metrics', async () => {
    // Mock sessions data
    const mockSessions = [
      { id: 'session-1' },
      { id: 'session-2' },
      { id: 'session-3' },
      { id: 'session-4' },
      { id: 'session-5' }
    ]

    // Mock submissions data
    const mockSubmissions = [
      {
        id: 'sub-1',
        rating: 5,
        comment: 'Great service!',
        submitted_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 'sub-2',
        rating: 4,
        comment: 'Good experience',
        submitted_at: '2024-01-15T09:15:00Z'
      },
      {
        id: 'sub-3',
        rating: 4,
        comment: 'Pretty good',
        submitted_at: '2024-01-14T16:45:00Z'
      },
      {
        id: 'sub-4',
        rating: 3,
        comment: 'Average',
        submitted_at: '2024-01-14T14:20:00Z'
      }
    ]

    // Setup mock responses
    mockSupabase.from
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockSessions,
            error: null
          })
        })
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockSubmissions,
              error: null
            })
          })
        })
      })

    const { result } = renderHook(() => useAnalytics(projectId))

    // Initially loading
    expect(result.current.loading).toBe(true)
    expect(result.current.analytics).toBe(null)
    expect(result.current.error).toBe(null)

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Check calculated metrics
    const analytics = result.current.analytics
    expect(analytics).not.toBe(null)
    expect(analytics?.totalResponses).toBe(4)
    expect(analytics?.averageRating).toBe(4.0) // (5+4+4+3)/4 = 4.0
    expect(analytics?.responseRate).toBe(80) // 4 responses / 5 sessions = 80%

    // Check rating distribution
    expect(analytics?.ratingDistribution).toEqual([
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 1 },
      { rating: 4, count: 2 },
      { rating: 5, count: 1 }
    ])

    // Check recent feedback (should be ordered by submitted_at desc)
    expect(analytics?.recentFeedback).toHaveLength(4)
    expect(analytics?.recentFeedback[0].id).toBe('sub-1') // Most recent
    expect(analytics?.recentFeedback[0].rating).toBe(5)
    expect(analytics?.recentFeedback[0].comment).toBe('Great service!')
  })

  it('should handle empty data correctly', async () => {
    // Mock empty responses
    mockSupabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      })

    const { result } = renderHook(() => useAnalytics(projectId))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const analytics = result.current.analytics
    expect(analytics?.totalResponses).toBe(0)
    expect(analytics?.averageRating).toBe(0)
    expect(analytics?.responseRate).toBe(0)
    expect(analytics?.recentFeedback).toEqual([])
    expect(analytics?.ratingDistribution).toEqual([
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 0 },
      { rating: 4, count: 0 },
      { rating: 5, count: 0 }
    ])
  })

  it('should handle sessions error', async () => {
    const mockError = new Error('Database connection failed')
    
    mockSupabase.from.mockReturnValueOnce({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: mockError
        })
      })
    })

    const { result } = renderHook(() => useAnalytics(projectId))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.error?.message).toContain('Failed to fetch sessions')
    expect(result.current.analytics).toBe(null)
  })

  it('should handle submissions error', async () => {
    const mockError = new Error('Permission denied')
    
    // Sessions succeed
    mockSupabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: 'session-1' }],
            error: null
          })
        })
      })
      // Submissions fail
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: mockError
            })
          })
        })
      })

    const { result } = renderHook(() => useAnalytics(projectId))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.error?.message).toContain('Failed to fetch submissions')
    expect(result.current.analytics).toBe(null)
  })

  it('should limit recent feedback to 10 items', async () => {
    const mockSubmissions = Array.from({ length: 15 }, (_, i) => ({
      id: `sub-${i + 1}`,
      rating: 5,
      comment: `Comment ${i + 1}`,
      submitted_at: `2024-01-${String(15 - i).padStart(2, '0')}T10:30:00Z`
    }))

    mockSupabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: 'session-1' }],
            error: null
          })
        })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockSubmissions,
              error: null
            })
          })
        })
      })

    const { result } = renderHook(() => useAnalytics(projectId))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should limit to 10 recent feedback items
    expect(result.current.analytics?.recentFeedback).toHaveLength(10)
  })

  it('should provide refresh function', async () => {
    // Initial data
    mockSupabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: 'session-1' }],
            error: null
          })
        })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [{ id: 'sub-1', rating: 5, comment: 'Great!', submitted_at: '2024-01-15T10:30:00Z' }],
              error: null
            })
          })
        })
      })

    const { result } = renderHook(() => useAnalytics(projectId))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.analytics?.totalResponses).toBe(1)

    // Mock updated data for refresh
    mockSupabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: 'session-1' }, { id: 'session-2' }],
            error: null
          })
        })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [
                { id: 'sub-1', rating: 5, comment: 'Great!', submitted_at: '2024-01-15T10:30:00Z' },
                { id: 'sub-2', rating: 4, comment: 'Good!', submitted_at: '2024-01-15T11:30:00Z' }
              ],
              error: null
            })
          })
        })
      })

    // Call refresh
    await result.current.refresh()

    await waitFor(() => {
      expect(result.current.analytics?.totalResponses).toBe(2)
    })
  })

  it('should handle edge case ratings correctly', async () => {
    const mockSubmissions = [
      { id: 'sub-1', rating: 0, comment: 'Invalid rating', submitted_at: '2024-01-15T10:30:00Z' }, // Should be ignored
      { id: 'sub-2', rating: 6, comment: 'Invalid rating', submitted_at: '2024-01-15T09:15:00Z' }, // Should be ignored
      { id: 'sub-3', rating: 1, comment: 'Poor', submitted_at: '2024-01-14T16:45:00Z' },
      { id: 'sub-4', rating: 5, comment: 'Excellent', submitted_at: '2024-01-14T14:20:00Z' }
    ]

    mockSupabase.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: 'session-1' }],
            error: null
          })
        })
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockSubmissions,
              error: null
            })
          })
        })
      })

    const { result } = renderHook(() => useAnalytics(projectId))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const analytics = result.current.analytics
    // All 4 responses should count for total and average (even invalid ratings)
    expect(analytics?.totalResponses).toBe(4)
    expect(analytics?.averageRating).toBe(3.0) // (0+6+1+5)/4 = 3.0

    // But rating distribution should only count valid ratings (1-5)
    expect(analytics?.ratingDistribution).toEqual([
      { rating: 1, count: 1 },
      { rating: 2, count: 0 },
      { rating: 3, count: 0 },
      { rating: 4, count: 0 },
      { rating: 5, count: 1 }
    ])
  })
})