/**
 * Test suite for DateRangePicker component
 * Tests preset selection, custom date ranges, and interaction behavior
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateRangePicker, DATE_RANGE_PRESETS } from './date-range-picker'
import { subDays, startOfDay, endOfDay } from 'date-fns'

describe('DateRangePicker Component', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  /**
   * Test basic rendering and initial state
   */
  it('should render with default placeholder text', () => {
    render(<DateRangePicker onChange={mockOnChange} />)
    
    expect(screen.getByRole('button')).toHaveTextContent('Pick a date range')
  })

  /**
   * Test custom placeholder text
   */
  it('should render with custom placeholder', () => {
    render(
      <DateRangePicker 
        onChange={mockOnChange} 
        placeholder="Select a custom range" 
      />
    )
    
    expect(screen.getByRole('button')).toHaveTextContent('Select a custom range')
  })

  /**
   * Test disabled state
   */
  it('should be disabled when disabled prop is true', () => {
    render(<DateRangePicker onChange={mockOnChange} disabled />)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  /**
   * Test preset button rendering when popover is opened
   */
  it('should show preset buttons when opened', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker onChange={mockOnChange} />)
    
    const trigger = screen.getByRole('button')
    await user.click(trigger)
    
    // Wait for popover to open and check for preset buttons
    await waitFor(() => {
      expect(screen.getByText('Last 7 days')).toBeInTheDocument()
      expect(screen.getByText('Last 30 days')).toBeInTheDocument()
      expect(screen.getByText('Last 90 days')).toBeInTheDocument()
      expect(screen.getByText('Custom range')).toBeInTheDocument()
    })
  })

  /**
   * Test Last 7 Days preset selection
   */
  it('should call onChange with correct date range for Last 7 Days preset', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker onChange={mockOnChange} />)
    
    const trigger = screen.getByRole('button')
    await user.click(trigger)
    
    const last7DaysButton = await screen.findByText('Last 7 days')
    await user.click(last7DaysButton)
    
    expect(mockOnChange).toHaveBeenCalledWith({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date())
    })
  })

  /**
   * Test Last 30 Days preset selection
   */
  it('should call onChange with correct date range for Last 30 Days preset', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker onChange={mockOnChange} />)
    
    const trigger = screen.getByRole('button')
    await user.click(trigger)
    
    const last30DaysButton = await screen.findByText('Last 30 days')
    await user.click(last30DaysButton)
    
    expect(mockOnChange).toHaveBeenCalledWith({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date())
    })
  })

  /**
   * Test Last 90 Days preset selection
   */
  it('should call onChange with correct date range for Last 90 Days preset', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker onChange={mockOnChange} />)
    
    const trigger = screen.getByRole('button')
    await user.click(trigger)
    
    const last90DaysButton = await screen.findByText('Last 90 days')
    await user.click(last90DaysButton)
    
    expect(mockOnChange).toHaveBeenCalledWith({
      from: startOfDay(subDays(new Date(), 89)),
      to: endOfDay(new Date())
    })
  })

  /**
   * Test clear functionality
   */
  it('should clear selection when Clear button is clicked', async () => {
    const user = userEvent.setup()
    const initialValue = DATE_RANGE_PRESETS.LAST_7_DAYS.getRange()
    
    render(
      <DateRangePicker 
        onChange={mockOnChange} 
        value={initialValue}
      />
    )
    
    const trigger = screen.getByRole('button')
    await user.click(trigger)
    
    const clearButton = await screen.findByText('Clear')
    await user.click(clearButton)
    
    expect(mockOnChange).toHaveBeenCalledWith(undefined)
  })

  /**
   * Test date range display formatting
   */
  it('should display formatted date range when value is provided', () => {
    const testRange = {
      from: new Date('2024-01-01'),
      to: new Date('2024-01-31')
    }
    
    render(<DateRangePicker onChange={mockOnChange} value={testRange} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Jan 01, 2024 - Jan 31, 2024')
  })

  /**
   * Test single date display formatting
   */
  it('should display single date when from and to are the same', () => {
    const testRange = {
      from: new Date('2024-01-01'),
      to: new Date('2024-01-01')
    }
    
    render(<DateRangePicker onChange={mockOnChange} value={testRange} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Jan 01, 2024')
  })

  /**
   * Test partial date range display (only from date)
   */
  it('should display only from date when to date is not provided', () => {
    const testRange = {
      from: new Date('2024-01-01')
    }
    
    render(<DateRangePicker onChange={mockOnChange} value={testRange} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Jan 01, 2024')
  })

  /**
   * Test preset constants are correctly defined
   */
  it('should have all required preset constants', () => {
    expect(DATE_RANGE_PRESETS.LAST_7_DAYS).toBeDefined()
    expect(DATE_RANGE_PRESETS.LAST_30_DAYS).toBeDefined()
    expect(DATE_RANGE_PRESETS.LAST_90_DAYS).toBeDefined()
    expect(DATE_RANGE_PRESETS.CUSTOM).toBeDefined()

    // Test that preset functions return valid date ranges
    const last7Days = DATE_RANGE_PRESETS.LAST_7_DAYS.getRange()
    expect(last7Days.from).toBeInstanceOf(Date)
    expect(last7Days.to).toBeInstanceOf(Date)
    expect(last7Days.from!.getTime()).toBeLessThan(last7Days.to!.getTime())
  })

  /**
   * Test keyboard navigation and accessibility
   */
  it('should be accessible via keyboard navigation', async () => {
    render(<DateRangePicker onChange={mockOnChange} />)
    
    const trigger = screen.getByRole('button')
    
    // Should be focusable
    trigger.focus()
    expect(trigger).toHaveFocus()
    
    // Should open on Enter key
    fireEvent.keyDown(trigger, { key: 'Enter' })
    
    await waitFor(() => {
      expect(screen.getByText('Quick select')).toBeInTheDocument()
    })
  })
})