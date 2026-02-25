/**
 * Test suite for useAnalytics hook with date range filtering
 * Tests the hook's behavior with and without date filters
 */

import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { useAnalytics, DateRangeValue } from './use-analytics'

// Mock Supabase client
const mockSupabaseQuery = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
}

const mockSupabase = {
  from: vi.fn(() => mockSupabaseQuery),
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn()
  }))
}

// Mock the supabase client
vi.mock('@/lib/supabase-client', () => ({
  supabase: mockSupabase
}))

describe('useAnalytics Hook', () => {
  const projectId = 'test-project-id'
  const mockSubmissionsData = [
    {
      id: '1',
      rating: 5,
      comment: 'Great service',
      submitted_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2', 
      rating: 4,
      comment: 'Good experience',
      submitted_at: '2024-01-20T14:30:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Default successful response
    mockSupabaseQuery.mockResolvedValue({
      data: mockSubmissionsData,
      error: null
    })
  })

  /**
   * Test basic hook functionality without date filtering
   */
  it('should fetch analytics data without date filtering', async () => {
    mockSupabaseQuery.mockResolvedValueOnce({
      data: mockSubmissionsData,
      error: null
    })

    const { result } = renderHook(() => useAnalytics(projectId))

    // Initially loading
    expect(result.current.loading).toBe(true)
    expect(result.current.analytics).toBeNull()

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Verify Supabase was called correctly
    expect(mockSupabase.from).toHaveBeenCalledWith('feedback_submissions')
    expect(mockSupabaseQuery.select).toHaveBeenCalled()
    expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('feedback_sessions.project_id', projectId)
    expect(mockSupabaseQuery.order).toHaveBeenCalledWith('submitted_at', { ascending: false })
    
    // Should NOT have been called with date filters
    expect(mockSupabaseQuery.gte).not.toHaveBeenCalled()
    expect(mockSupabaseQuery.lte).not.toHaveBeenCalled()
  })

  /**
   * Test hook with date range filtering - both from and to dates
   */
  it('should fetch analytics data with date range filtering', async () => {
    const dateRange: DateRangeValue = {
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31')
    }

    mockSupabaseQuery.mockResolvedValueOnce({
      data: mockSubmissionsData,
      error: null
    })

    const { result } = renderHook(() => useAnalytics(projectId, dateRange))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Verify date filters were applied
    expect(mockSupabaseQuery.gte).toHaveBeenCalledWith('submitted_at', dateRange.from!.toISOString())
    expect(mockSupabaseQuery.lte).toHaveBeenCalledWith('submitted_at', dateRange.to!.toISOString())
  })

  /**
   * Test hook with only 'from' date filtering
   */
  it('should fetch analytics data with only from date filtering', async () => {
    const dateRange: DateRangeValue = {
      from: new Date('2024-01-01')
    }

    mockSupabaseQuery.mockResolvedValueOnce({
      data: mockSubmissionsData,
      error: null
    })

    const { result } = renderHook(() => useAnalytics(projectId, dateRange))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should apply gte filter for from date
    expect(mockSupabaseQuery.gte).toHaveBeenCalledWith('submitted_at', dateRange.from!.toISOString())
    // Should NOT apply lte filter
    expect(mockSupabaseQuery.lte).not.toHaveBeenCalled()
  })

  /**
   * Test hook with only 'to' date filtering
   */
  it('should fetch analytics data with only to date filtering', async () => {
    const dateRange: DateRangeValue = {
      to: new Date('2024-01-31')
    }

    mockSupabaseQuery.mockResolvedValueOnce({
      data: mockSubmissionsData,
      error: null
    })

    const { result } = renderHook(() => useAnalytics(projectId, dateRange))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should apply lte filter for to date
    expect(mockSupabaseQuery.lte).toHaveBeenCalledWith('submitted_at', dateRange.to!.toISOString())
    // Should NOT apply gte filter
    expect(mockSupabaseQuery.gte).not.toHaveBeenCalled()
  })

  /**
   * Test hook re-fetches when date range changes
   */
  it('should re-fetch data when date range changes', async () => {
    const initialDateRange: DateRangeValue = {
      from: new Date('2024-01-01'),
      to: new Date('2024-01-15')
    }

    mockSupabaseQuery.mockResolvedValue({
      data: mockSubmissionsData,
      error: null
    })

    const { result, rerender } = renderHook(
      ({ dateRange }) => useAnalytics(projectId, dateRange),
      {
        initialProps: { dateRange: initialDateRange }
      }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear previous calls
    vi.clearAllMocks()

    // Change date range
    const newDateRange: DateRangeValue = {
      from: new Date('2024-01-16'),
      to: new Date('2024-01-31')
    }

    rerender({ dateRange: newDateRange })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should have made new API calls with updated date range
    expect(mockSupabaseQuery.gte).toHaveBeenCalledWith('submitted_at', newDateRange.from!.toISOString())
    expect(mockSupabaseQuery.lte).toHaveBeenCalledWith('submitted_at', newDateRange.to!.toISOString())
  })

  /**
   * Test error handling
   */
  it('should handle Supabase errors gracefully', async () => {
    const errorMessage = 'Database connection failed'
    mockSupabaseQuery.mockResolvedValueOnce({
      data: null,
      error: { message: errorMessage }
    })

    const { result } = renderHook(() => useAnalytics(projectId))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.analytics).toBeNull()
  })

  /**
   * Test empty project ID handling
   */
  it('should not fetch data with empty project ID', () => {
    const { result } = renderHook(() => useAnalytics(''))

    expect(result.current.loading).toBe(false)
    expect(result.current.analytics).toBeNull()
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  /**
   * Test analytics data processing
   */
  it('should process submission data correctly', async () => {
    mockSupabaseQuery.mockResolvedValueOnce({
      data: mockSubmissionsData,
      error: null
    })

    const { result } = renderHook(() => useAnalytics(projectId))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const analytics = result.current.analytics
    expect(analytics).not.toBeNull()
    expect(analytics?.totalSubmissions).toBe(2)
    expect(analytics?.averageRating).toBe(4.5) // (5 + 4) / 2
  })
})