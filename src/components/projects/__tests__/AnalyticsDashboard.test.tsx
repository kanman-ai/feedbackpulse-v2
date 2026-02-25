/**
 * Test suite for AnalyticsDashboard component in FeedbackPulse v2.
 * 
 * Tests the analytics dashboard's ability to:
 * - Render analytics data correctly
 * - Handle date range filtering interactions
 * - Display metrics cards with proper formatting
 * - Render charts with valid data
 * - Handle loading, error, and empty states
 * - Show authentication requirements
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAnalytics } from '@/lib/projects/use-analytics'
import { AnalyticsDashboard } from '../AnalyticsDashboard'

// Mock the useAnalytics hook
vi.mock('@/lib/projects/use-analytics')
const mockUseAnalytics = vi.mocked(useAnalytics)

// Mock recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: ({ dataKey }: any) => <div data-testid={`line-${dataKey}`} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data }: any) => <div data-testid="pie" data-length={data?.length} />,
  Cell: () => <div data-testid="cell" />
}))

// Mock the DateRangePicker component
vi.mock('@/components/ui/date-range-picker', () => ({
  DateRangePicker: ({ value, onChange, className }: any) => (
    <div 
      data-testid="date-range-picker"
      className={className}
      onClick={() => {
        // Simulate date range change
        onChange({
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        })
      }}
    >
      {value.startDate.toLocaleDateString()} - {value.endDate.toLocaleDateString()}
    </div>
  )
}))

describe('AnalyticsDashboard', () => {
  const projectId = 'test-project-123'
  
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
        content: 'Good service, but could be faster',
        rating: 4,
        createdAt: '2024-01-16T15:20:00Z'
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default successful state
    mockUseAnalytics.mockReturnValue({
      data: mockAnalyticsData,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
      isUnauthorized: false
    })
  })

  it('should render analytics dashboard with data', () => {
    render(<AnalyticsDashboard projectId={projectId} />)

    // Check header
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Comprehensive feedback insights and trends')).toBeInTheDocument()

    // Check metrics cards
    expect(screen.getByText('Total Feedback')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    
    expect(screen.getByText('Average Rating')).toBeInTheDocument()
    expect(screen.getByText('4.2')).toBeInTheDocument()
    
    expect(screen.getByText('Positive Sentiment')).toBeInTheDocument()
    expect(screen.getByText('60.0%')).toBeInTheDocument() // 90/150 = 60%

    // Check charts are rendered
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()

    // Check recent feedback section
    expect(screen.getByText('Recent Feedback')).toBeInTheDocument()
    expect(screen.getByText('Great experience!')).toBeInTheDocument()
    expect(screen.getByText('Good service, but could be faster')).toBeInTheDocument()
  })

  it('should handle date range changes', async () => {
    const { rerender } = render(<AnalyticsDashboard projectId={projectId} />)

    // Find and click the date range picker
    const datePicker = screen.getByTestId('date-range-picker')
    fireEvent.click(datePicker)

    // Should trigger useAnalytics with new date range
    await waitFor(() => {
      expect(mockUseAnalytics).toHaveBeenCalledWith(
        projectId,
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date)
        })
      )
    })
  })

  it('should display loading state', () => {
    mockUseAnalytics.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refresh: vi.fn(),
      isUnauthorized: false
    })

    render(<AnalyticsDashboard projectId={projectId} />)

    expect(screen.getByText('Loading analytics data...')).toBeInTheDocument()
    expect(screen.getAllByTestId('loading-skeleton')).toHaveLength(4)
  })

  it('should display error state', () => {
    const mockError = new Error('Failed to load analytics')
    mockUseAnalytics.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
      refresh: vi.fn(),
      isUnauthorized: false
    })

    render(<AnalyticsDashboard projectId={projectId} />)

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Error loading analytics data. Please try again later.')).toBeInTheDocument()
  })

  it('should display unauthorized state', () => {
    mockUseAnalytics.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
      isUnauthorized: true
    })

    render(<AnalyticsDashboard projectId={projectId} />)

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Please sign in to view analytics data.')).toBeInTheDocument()
  })

  it('should handle missing data state', () => {
    mockUseAnalytics.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
      isUnauthorized: false
    })

    render(<AnalyticsDashboard projectId={projectId} />)

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
    expect(screen.getByText('No analytics data available for this project.')).toBeInTheDocument()
  })

  it('should display trend indicators correctly', () => {
    render(<AnalyticsDashboard projectId={projectId} />)

    // Positive feedback growth (15.5%)
    expect(screen.getByText('15.5%')).toBeInTheDocument()
    expect(screen.getByText('vs previous period')).toBeInTheDocument()

    // Negative rating trend (-2.1%)
    expect(screen.getByText('2.1%')).toBeInTheDocument() // Shows absolute value
  })

  it('should format numbers correctly', () => {
    const dataWithLargeNumbers = {
      ...mockAnalyticsData,
      totalFeedback: 1250
    }

    mockUseAnalytics.mockReturnValue({
      data: dataWithLargeNumbers,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
      isUnauthorized: false
    })

    render(<AnalyticsDashboard projectId={projectId} />)

    // Should use toLocaleString for large numbers
    expect(screen.getByText('1,250')).toBeInTheDocument()
  })

  it('should handle empty recent feedback', () => {
    const dataWithNoFeedback = {
      ...mockAnalyticsData,
      recentFeedback: []
    }

    mockUseAnalytics.mockReturnValue({
      data: dataWithNoFeedback,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
      isUnauthorized: false
    })

    render(<AnalyticsDashboard projectId={projectId} />)

    expect(screen.getByText('No feedback available for the selected period.')).toBeInTheDocument()
  })

  it('should display sentiment breakdown in pie chart', () => {
    render(<AnalyticsDashboard projectId={projectId} />)

    const pieChart = screen.getByTestId('pie')
    // Should have 3 segments (positive, neutral, negative)
    expect(pieChart).toHaveAttribute('data-length', '3')
  })

  it('should render star ratings in recent feedback', () => {
    render(<AnalyticsDashboard projectId={projectId} />)

    // Check that star icons are rendered for ratings
    const starElements = screen.getAllByTestId('star-icon')
    expect(starElements.length).toBeGreaterThan(0)
  })

  it('should display user email or anonymous correctly', () => {
    render(<AnalyticsDashboard projectId={projectId} />)

    expect(screen.getByText('user@example.com')).toBeInTheDocument()
    expect(screen.getByText('Anonymous')).toBeInTheDocument() // For feedback without email
  })

  it('should format dates correctly in recent feedback', () => {
    render(<AnalyticsDashboard projectId={projectId} />)

    // Should display formatted date
    expect(screen.getByText('1/17/2024')).toBeInTheDocument() // US format
    expect(screen.getByText('1/16/2024')).toBeInTheDocument()
  })

  it('should call useAnalytics with correct projectId', () => {
    render(<AnalyticsDashboard projectId={projectId} />)

    expect(mockUseAnalytics).toHaveBeenCalledWith(
      projectId,
      expect.objectContaining({
        startDate: expect.any(Date),
        endDate: expect.any(Date)
      })
    )
  })

  it('should initialize with last 30 days date range', () => {
    render(<AnalyticsDashboard projectId={projectId} />)

    expect(mockUseAnalytics).toHaveBeenCalledWith(
      projectId,
      expect.objectContaining({
        startDate: expect.any(Date),
        endDate: expect.any(Date)
      })
    )

    // Verify the date range is approximately 30 days
    const call = mockUseAnalytics.mock.calls[0]
    const dateRange = call[1]
    if (dateRange) {
      const timeDiff = dateRange.endDate.getTime() - dateRange.startDate.getTime()
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24)
      expect(daysDiff).toBeCloseTo(30, 0)
    }
  })
})