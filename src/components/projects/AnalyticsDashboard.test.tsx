/**
 * Integration test suite for AnalyticsDashboard component
 * Tests the integration between date picker and analytics data filtering
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { AnalyticsDashboard } from './AnalyticsDashboard'

// Mock the analytics hook
const mockAnalyticsData = {
  totalSubmissions: 150,
  averageRating: 4.2,
  responseRate: 85.5,
  sentimentDistribution: {
    positive: 60,
    neutral: 25,
    negative: 15
  },
  ratingsDistribution: [
    { rating: 1, count: 5 },
    { rating: 2, count: 10 },
    { rating: 3, count: 20 },
    { rating: 4, count: 45 },
    { rating: 5, count: 70 }
  ],
  trendsOverTime: [
    { date: '2024-01-01', submissions: 10, averageRating: 4.1 },
    { date: '2024-01-02', submissions: 15, averageRating: 4.3 },
    { date: '2024-01-03', submissions: 12, averageRating: 4.0 }
  ]
}

const mockUseAnalytics = vi.fn()

vi.mock('@/lib/projects/use-analytics', () => ({
  useAnalytics: mockUseAnalytics,
  DateRangeValue: {}
}))

// Mock Recharts components to avoid canvas rendering issues in tests
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  )
}))

describe('AnalyticsDashboard Component', () => {
  const mockProjectId = 'test-project-123'

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAnalytics.mockReturnValue({
      analytics: mockAnalyticsData,
      loading: false,
      error: null
    })
  })

  /**
   * Test basic dashboard rendering with date picker
   */
  it('should render analytics dashboard with date picker', async () => {
    render(<AnalyticsDashboard projectId={mockProjectId} />)

    // Check for main dashboard elements
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Insights and metrics for your feedback data')).toBeInTheDocument()
    
    // Check for date picker
    expect(screen.getByRole('button')).toBeInTheDocument()
    
    // Check for key metrics cards
    expect(screen.getByText('Total Submissions')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('Average Rating')).toBeInTheDocument()
    expect(screen.getByText('4.2')).toBeInTheDocument()
    expect(screen.getByText('Response Rate')).toBeInTheDocument()
    expect(screen.getByText('85.5%')).toBeInTheDocument()
  })

  /**
   * Test loading state
   */
  it('should show loading spinner when analytics are loading', () => {
    mockUseAnalytics.mockReturnValue({
      analytics: null,
      loading: true,
      error: null
    })

    render(<AnalyticsDashboard projectId={mockProjectId} />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.queryByText('Analytics Dashboard')).not.toBeInTheDocument()
  })

  /**
   * Test error state
   */
  it('should show error message when analytics fail to load', () => {
    const errorMessage = 'Failed to load analytics data'
    mockUseAnalytics.mockReturnValue({
      analytics: null,
      loading: false,
      error: errorMessage
    })

    render(<AnalyticsDashboard projectId={mockProjectId} />)

    expect(screen.getByText('Error loading analytics')).toBeInTheDocument()
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  /**
   * Test date picker interaction triggers analytics re-fetch
   */
  it('should pass date range to useAnalytics hook when date picker changes', async () => {
    const user = userEvent.setup()
    render(<AnalyticsDashboard projectId={mockProjectId} />)

    // Open date picker
    const datePickerButton = screen.getByRole('button')
    await user.click(datePickerButton)

    // Find and click "Last 7 days" preset
    const last7DaysButton = await screen.findByText('Last 7 days')
    await user.click(last7DaysButton)

    // Wait for the hook to be called with new date range
    await waitFor(() => {
      const lastCall = mockUseAnalytics.mock.calls[mockUseAnalytics.mock.calls.length - 1]
      expect(lastCall[0]).toBe(mockProjectId)
      expect(lastCall[1]).toBeDefined() // Should have a date range
      expect(lastCall[1]?.from).toBeInstanceOf(Date)
      expect(lastCall[1]?.to).toBeInstanceOf(Date)
    })
  })

  /**
   * Test default date range (last 30 days) is applied on mount
   */
  it('should initialize with Last 30 Days preset by default', () => {
    render(<AnalyticsDashboard projectId={mockProjectId} />)

    // Check that useAnalytics was called with a date range (last 30 days)
    expect(mockUseAnalytics).toHaveBeenCalledWith(
      mockProjectId,
      expect.objectContaining({
        from: expect.any(Date),
        to: expect.any(Date)
      })
    )

    // Verify the date range is approximately 30 days
    const call = mockUseAnalytics.mock.calls[0]
    const dateRange = call[1]
    const daysDifference = Math.round((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24))
    expect(daysDifference).toBe(29) // 30 days inclusive
  })

  /**
   * Test chart rendering with filtered data
   */
  it('should render charts with analytics data', () => {
    render(<AnalyticsDashboard projectId={mockProjectId} />)

    // Check that chart components are rendered
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()

    // Check for chart sections
    expect(screen.getByText('Ratings Distribution')).toBeInTheDocument()
    expect(screen.getByText('Sentiment Analysis')).toBeInTheDocument()
  })

  /**
   * Test sentiment distribution display
   */
  it('should display sentiment distribution correctly', () => {
    render(<AnalyticsDashboard projectId={mockProjectId} />)

    expect(screen.getByText('60% Positive')).toBeInTheDocument()
    expect(screen.getByText('25% Neutral')).toBeInTheDocument()
    expect(screen.getByText('15% Negative')).toBeInTheDocument()
  })

  /**
   * Test empty data state
   */
  it('should handle empty analytics data gracefully', () => {
    mockUseAnalytics.mockReturnValue({
      analytics: {
        totalSubmissions: 0,
        averageRating: 0,
        responseRate: 0,
        sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
        ratingsDistribution: [],
        trendsOverTime: []
      },
      loading: false,
      error: null
    })

    render(<AnalyticsDashboard projectId={mockProjectId} />)

    expect(screen.getByText('0')).toBeInTheDocument() // Total submissions
    expect(screen.getByText('0%')).toBeInTheDocument() // Response rate
    expect(screen.getByText('No data available')).toBeInTheDocument() // Empty state message
  })

  /**
   * Test multiple date range changes
   */
  it('should update analytics when switching between different date presets', async () => {
    const user = userEvent.setup()
    render(<AnalyticsDashboard projectId={mockProjectId} />)

    const datePickerButton = screen.getByRole('button')

    // First change - Last 7 days
    await user.click(datePickerButton)
    const last7DaysButton = await screen.findByText('Last 7 days')
    await user.click(last7DaysButton)

    // Second change - Last 90 days
    await user.click(datePickerButton)
    const last90DaysButton = await screen.findByText('Last 90 days')
    await user.click(last90DaysButton)

    // Verify useAnalytics was called multiple times with different date ranges
    const calls = mockUseAnalytics.mock.calls
    expect(calls.length).toBeGreaterThanOrEqual(3) // Initial + 2 changes

    // Check the last call has a 90-day range
    const lastCall = calls[calls.length - 1]
    const dateRange = lastCall[1]
    const daysDifference = Math.round((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24))
    expect(daysDifference).toBe(89) // 90 days inclusive
  })

  /**
   * Test date picker clear functionality
   */
  it('should handle date range clearing', async () => {
    const user = userEvent.setup()
    render(<AnalyticsDashboard projectId={mockProjectId} />)

    const datePickerButton = screen.getByRole('button')
    await user.click(datePickerButton)

    const clearButton = await screen.findByText('Clear')
    await user.click(clearButton)

    // Should call useAnalytics with undefined date range
    await waitFor(() => {
      const lastCall = mockUseAnalytics.mock.calls[mockUseAnalytics.mock.calls.length - 1]
      expect(lastCall[1]).toBeUndefined()
    })
  })
})