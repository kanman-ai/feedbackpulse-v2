/**
 * Test suite for AnalyticsDashboard component.
 * 
 * Tests the analytics dashboard's ability to display:
 * - Loading states while fetching data
 * - Error states when data fetch fails
 * - Metrics cards with calculated values
 * - Recharts bar chart with rating distribution
 * - Recent feedback list with proper formatting
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { AnalyticsDashboard } from '../AnalyticsDashboard'

// Mock the analytics hook
const mockAnalytics = {
  totalResponses: 150,
  averageRating: 4.2,
  responseRate: 85.5,
  ratingDistribution: [
    { rating: 1, count: 5 },
    { rating: 2, count: 8 },
    { rating: 3, count: 15 },
    { rating: 4, count: 45 },
    { rating: 5, count: 77 }
  ],
  recentFeedback: [
    {
      id: '1',
      rating: 5,
      comment: 'Excellent service, very satisfied!',
      submitted_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      rating: 4,
      comment: 'Good experience overall, minor improvements needed.',
      submitted_at: '2024-01-15T09:15:00Z'
    },
    {
      id: '3',
      rating: 3,
      comment: null,
      submitted_at: '2024-01-14T16:45:00Z'
    }
  ]
}

// Mock the useAnalytics hook
vi.mock('@/lib/projects/use-analytics', () => ({
  useAnalytics: vi.fn()
}))

// Mock Recharts components to avoid rendering issues in tests
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  )
}))

const { useAnalytics } = await import('@/lib/projects/use-analytics')

describe('AnalyticsDashboard', () => {
  const defaultProps = {
    projectId: 'test-project-id'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should display loading spinner while fetching analytics', () => {
      useAnalytics.mockReturnValue({
        analytics: null,
        loading: true,
        error: null
      })

      render(<AnalyticsDashboard {...defaultProps} />)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.queryByText('Total Responses')).not.toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error message when data fetch fails', () => {
      const mockError = new Error('Failed to load analytics data')
      useAnalytics.mockReturnValue({
        analytics: null,
        loading: false,
        error: mockError
      })

      render(<AnalyticsDashboard {...defaultProps} />)

      expect(screen.getByText('Error Loading Analytics')).toBeInTheDocument()
      expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument()
    })

    it('should display generic error message when error has no message', () => {
      useAnalytics.mockReturnValue({
        analytics: null,
        loading: false,
        error: {}
      })

      render(<AnalyticsDashboard {...defaultProps} />)

      expect(screen.getByText('Error Loading Analytics')).toBeInTheDocument()
      expect(screen.getByText('Failed to load analytics data. Please try again.')).toBeInTheDocument()
    })
  })

  describe('No Data State', () => {
    it('should display no data message when analytics is null', () => {
      useAnalytics.mockReturnValue({
        analytics: null,
        loading: false,
        error: null
      })

      render(<AnalyticsDashboard {...defaultProps} />)

      expect(screen.getByText('No Analytics Data')).toBeInTheDocument()
      expect(screen.getByText('No feedback submissions found for this project yet.')).toBeInTheDocument()
    })
  })

  describe('Analytics Display', () => {
    beforeEach(() => {
      useAnalytics.mockReturnValue({
        analytics: mockAnalytics,
        loading: false,
        error: null
      })
    })

    it('should render analytics dashboard with metrics', () => {
      render(<AnalyticsDashboard {...defaultProps} />)

      // Check metric cards
      expect(screen.getByText('Total Responses')).toBeInTheDocument()
      expect(screen.getByText('150')).toBeInTheDocument()

      expect(screen.getByText('Average Rating')).toBeInTheDocument()
      expect(screen.getByText('4.2')).toBeInTheDocument()
      expect(screen.getByText('/ 5.0')).toBeInTheDocument()

      expect(screen.getByText('Response Rate')).toBeInTheDocument()
      expect(screen.getByText('85.5')).toBeInTheDocument()
      expect(screen.getByText('%')).toBeInTheDocument()
    })

    it('should render rating distribution chart', () => {
      render(<AnalyticsDashboard {...defaultProps} />)

      expect(screen.getByText('Rating Distribution')).toBeInTheDocument()
      expect(screen.getByText('Breakdown of feedback ratings from 1 to 5 stars')).toBeInTheDocument()
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })

    it('should render recent feedback list', () => {
      render(<AnalyticsDashboard {...defaultProps} />)

      expect(screen.getByText('Recent Feedback')).toBeInTheDocument()
      expect(screen.getByText('Latest 10 feedback submissions with ratings and comments')).toBeInTheDocument()

      // Check feedback items are displayed
      expect(screen.getByText('Excellent service, very satisfied!')).toBeInTheDocument()
      expect(screen.getByText('Good experience overall, minor improvements needed.')).toBeInTheDocument()
      expect(screen.getByText('No comment provided')).toBeInTheDocument()

      // Check star ratings are displayed
      const starRatings = screen.getAllByText('★')
      expect(starRatings.length).toBeGreaterThan(0)
    })

    it('should display empty state when no recent feedback exists', () => {
      useAnalytics.mockReturnValue({
        analytics: {
          ...mockAnalytics,
          recentFeedback: []
        },
        loading: false,
        error: null
      })

      render(<AnalyticsDashboard {...defaultProps} />)

      expect(screen.getByText('No feedback submissions yet.')).toBeInTheDocument()
    })

    it('should truncate long comments with ellipsis', () => {
      const longComment = 'This is a very long comment that should be truncated because it exceeds the maximum character limit set for comment previews in the analytics dashboard.'
      
      useAnalytics.mockReturnValue({
        analytics: {
          ...mockAnalytics,
          recentFeedback: [
            {
              id: '1',
              rating: 5,
              comment: longComment,
              submitted_at: '2024-01-15T10:30:00Z'
            }
          ]
        },
        loading: false,
        error: null
      })

      render(<AnalyticsDashboard {...defaultProps} />)

      const truncatedText = screen.getByText(/This is a very long comment that should be truncated.*\.\.\./)
      expect(truncatedText).toBeInTheDocument()
      expect(truncatedText.textContent?.length).toBeLessThan(longComment.length)
    })

    it('should format star ratings correctly', () => {
      render(<AnalyticsDashboard {...defaultProps} />)

      // Find rating displays (should show "5/5", "4/5", "3/5")
      expect(screen.getByText('5/5')).toBeInTheDocument()
      expect(screen.getByText('4/5')).toBeInTheDocument() 
      expect(screen.getByText('3/5')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      useAnalytics.mockReturnValue({
        analytics: mockAnalytics,
        loading: false,
        error: null
      })
    })

    it('should have proper heading structure', () => {
      render(<AnalyticsDashboard {...defaultProps} />)

      expect(screen.getByRole('heading', { name: 'Total Responses' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Average Rating' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Response Rate' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Rating Distribution' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Recent Feedback' })).toBeInTheDocument()
    })

    it('should have descriptive text for each metric', () => {
      render(<AnalyticsDashboard {...defaultProps} />)

      expect(screen.getByText('Total feedback submissions received')).toBeInTheDocument()
      expect(screen.getByText('Average rating across all feedback')).toBeInTheDocument()
      expect(screen.getByText('Percentage of sessions with feedback')).toBeInTheDocument()
    })
  })
})