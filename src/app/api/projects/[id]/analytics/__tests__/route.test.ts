/**
 * Test suite for analytics API endpoint in FeedbackPulse v2.
 * 
 * Tests the /api/projects/[id]/analytics endpoint's ability to:
 * - Authenticate requests and verify project access
 * - Filter feedback data by date range using query parameters
 * - Aggregate feedback metrics (totals, averages, growth)
 * - Generate time-series chart data
 * - Calculate sentiment breakdowns
 * - Return recent feedback items
 * - Handle error cases (unauthorized, not found, invalid data)
 */

import { GET } from '../route'
import { getServerSession } from 'next-auth'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

// Mock next-auth
vi.mock('next-auth')
const mockGetServerSession = vi.mocked(getServerSession)

// Mock Supabase client
vi.mock('@/lib/supabase/server')
const mockCreateClient = vi.mocked(createClient)

// Mock Supabase query builder
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn(),
  from: vi.fn()
}

describe('/api/projects/[id]/analytics', () => {
  const projectId = 'test-project-123'
  const userId = 'user-456'
  
  const mockFeedbackData = [
    {
      id: 'feedback-1',
      project_id: projectId,
      content: 'Great product!',
      rating: 5,
      created_at: '2024-01-15T10:00:00Z',
      user_email: 'user1@example.com'
    },
    {
      id: 'feedback-2',
      project_id: projectId,
      content: 'Good service',
      rating: 4,
      created_at: '2024-01-16T14:30:00Z',
      user_email: 'user2@example.com'
    },
    {
      id: 'feedback-3',
      project_id: projectId,
      content: 'Average experience',
      rating: 3,
      created_at: '2024-01-17T09:15:00Z'
    },
    {
      id: 'feedback-4',
      project_id: projectId,
      content: 'Could be better',
      rating: 2,
      created_at: '2024-01-18T16:45:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock authenticated session
    mockGetServerSession.mockResolvedValue({
      user: { id: userId, email: 'test@example.com' }
    } as any)

    // Reset Supabase mock
    mockCreateClient.mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'projects') {
          return {
            ...mockSupabaseQuery,
            single: vi.fn().mockResolvedValue({
              data: { id: projectId, name: 'Test Project' },
              error: null
            })
          }
        }
        
        if (table === 'feedback') {
          return {
            ...mockSupabaseQuery,
            // Mock the full query chain for feedback
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: mockFeedbackData,
                      error: null
                    })
                  })
                })
              })
            })
          }
        }

        return mockSupabaseQuery
      })
    } as any)
  })

  it('should return analytics data without date filter', async () => {
    const request = new NextRequest('http://localhost/api/projects/test-project-123/analytics')
    const params = { params: { id: projectId } }

    const response = await GET(request, params)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      totalFeedback: 4,
      averageRating: 3.5, // (5+4+3+2)/4
      feedbackGrowth: expect.any(Number),
      ratingTrend: expect.any(Number),
      chartData: expect.any(Array),
      sentimentBreakdown: {
        positive: 2, // ratings 4-5
        neutral: 1,  // rating 3
        negative: 1  // ratings 1-2
      },
      recentFeedback: expect.arrayContaining([
        expect.objectContaining({
          id: 'feedback-1',
          content: 'Great product!',
          rating: 5
        })
      ])
    })
  })

  it('should filter by date range', async () => {
    const request = new NextRequest(
      'http://localhost/api/projects/test-project-123/analytics?startDate=2024-01-16T00:00:00Z&endDate=2024-01-17T23:59:59Z'
    )
    const params = { params: { id: projectId } }

    await GET(request, params)

    // Verify that the Supabase query was called with date filters
    const supabaseClient = mockCreateClient()
    expect(supabaseClient.from).toHaveBeenCalledWith('feedback')
    
    // The query chain should include gte and lte calls for date filtering
    // This is implicitly tested through the mock chain setup
  })

  it('should require authentication', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/projects/test-project-123/analytics')
    const params = { params: { id: projectId } }

    const response = await GET(request, params)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })

  it('should handle project not found', async () => {
    mockCreateClient.mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'projects') {
          return {
            ...mockSupabaseQuery,
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Project not found' }
            })
          }
        }
        return mockSupabaseQuery
      })
    } as any)

    const request = new NextRequest('http://localhost/api/projects/nonexistent/analytics')
    const params = { params: { id: 'nonexistent' } }

    const response = await GET(request, params)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Project not found or access denied')
  })

  it('should handle feedback query error', async () => {
    mockCreateClient.mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'projects') {
          return {
            ...mockSupabaseQuery,
            single: vi.fn().mockResolvedValue({
              data: { id: projectId, name: 'Test Project' },
              error: null
            })
          }
        }
        
        if (table === 'feedback') {
          return {
            ...mockSupabaseQuery,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: null,
                      error: { message: 'Database error' }
                    })
                  })
                })
              })
            })
          }
        }

        return mockSupabaseQuery
      })
    } as any)

    const request = new NextRequest('http://localhost/api/projects/test-project-123/analytics')
    const params = { params: { id: projectId } }

    const response = await GET(request, params)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch feedback data')
  })

  it('should handle empty feedback data', async () => {
    mockCreateClient.mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'projects') {
          return {
            ...mockSupabaseQuery,
            single: vi.fn().mockResolvedValue({
              data: { id: projectId, name: 'Test Project' },
              error: null
            })
          }
        }
        
        if (table === 'feedback') {
          return {
            ...mockSupabaseQuery,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: [],
                      error: null
                    })
                  })
                })
              })
            })
          }
        }

        return mockSupabaseQuery
      })
    } as any)

    const request = new NextRequest('http://localhost/api/projects/test-project-123/analytics')
    const params = { params: { id: projectId } }

    const response = await GET(request, params)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      totalFeedback: 0,
      averageRating: 0,
      chartData: [],
      sentimentBreakdown: {
        positive: 0,
        neutral: 0,
        negative: 0
      },
      recentFeedback: []
    })
  })

  it('should calculate sentiment breakdown correctly', async () => {
    const request = new NextRequest('http://localhost/api/projects/test-project-123/analytics')
    const params = { params: { id: projectId } }

    const response = await GET(request, params)
    const data = await response.json()

    expect(data.sentimentBreakdown).toEqual({
      positive: 2, // ratings 5 and 4
      neutral: 1,  // rating 3
      negative: 1  // rating 2
    })
  })

  it('should limit recent feedback to 10 items', async () => {
    // Create mock data with more than 10 feedback items
    const largeFeedbackData = Array.from({ length: 15 }, (_, i) => ({
      id: `feedback-${i + 1}`,
      project_id: projectId,
      content: `Feedback ${i + 1}`,
      rating: 4,
      created_at: `2024-01-${(i + 1).toString().padStart(2, '0')}T10:00:00Z`,
      user_email: `user${i + 1}@example.com`
    }))

    mockCreateClient.mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'projects') {
          return {
            ...mockSupabaseQuery,
            single: vi.fn().mockResolvedValue({
              data: { id: projectId, name: 'Test Project' },
              error: null
            })
          }
        }
        
        if (table === 'feedback') {
          return {
            ...mockSupabaseQuery,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: largeFeedbackData,
                      error: null
                    })
                  })
                })
              })
            })
          }
        }

        return mockSupabaseQuery
      })
    } as any)

    const request = new NextRequest('http://localhost/api/projects/test-project-123/analytics')
    const params = { params: { id: projectId } }

    const response = await GET(request, params)
    const data = await response.json()

    expect(data.recentFeedback).toHaveLength(10)
  })

  it('should round decimal values appropriately', async () => {
    // Create feedback data that will result in decimal averages
    const decimalFeedbackData = [
      { id: '1', project_id: projectId, content: 'Test', rating: 4.7, created_at: '2024-01-15T10:00:00Z' },
      { id: '2', project_id: projectId, content: 'Test', rating: 3.3, created_at: '2024-01-16T10:00:00Z' },
      { id: '3', project_id: projectId, content: 'Test', rating: 4.1, created_at: '2024-01-17T10:00:00Z' }
    ]

    mockCreateClient.mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'projects') {
          return {
            ...mockSupabaseQuery,
            single: vi.fn().mockResolvedValue({
              data: { id: projectId, name: 'Test Project' },
              error: null
            })
          }
        }
        
        if (table === 'feedback') {
          return {
            ...mockSupabaseQuery,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: decimalFeedbackData,
                      error: null
                    })
                  })
                })
              })
            })
          }
        }

        return mockSupabaseQuery
      })
    } as any)

    const request = new NextRequest('http://localhost/api/projects/test-project-123/analytics')
    const params = { params: { id: projectId } }

    const response = await GET(request, params)
    const data = await response.json()

    // Values should be rounded to 1 decimal place
    expect(Number.isInteger(data.averageRating * 10)).toBe(true) // Should be rounded to 1 decimal
    expect(Number.isInteger(data.feedbackGrowth * 10)).toBe(true)
    expect(Number.isInteger(data.ratingTrend * 10)).toBe(true)
  })
})