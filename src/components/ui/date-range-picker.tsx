/**
 * Date range picker component for filtering time-series data in FeedbackPulse.
 * Provides preset options (7d, 30d, 90d) and custom date range selection.
 * Built with Radix UI Popover and react-day-picker for accessibility and UX.
 */

'use client'

import * as React from 'react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange, DayPicker } from 'react-day-picker'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

/**
 * Preset date range options for quick selection
 */
export const DATE_RANGE_PRESETS = {
  LAST_7_DAYS: {
    label: 'Last 7 days',
    value: 'last_7_days',
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date())
    })
  },
  LAST_30_DAYS: {
    label: 'Last 30 days', 
    value: 'last_30_days',
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date())
    })
  },
  LAST_90_DAYS: {
    label: 'Last 90 days',
    value: 'last_90_days', 
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 89)),
      to: endOfDay(new Date())
    })
  },
  CUSTOM: {
    label: 'Custom range',
    value: 'custom',
    getRange: () => ({ from: undefined, to: undefined })
  }
} as const

export type DateRangePreset = keyof typeof DATE_RANGE_PRESETS

export interface DateRangeValue {
  from?: Date
  to?: Date
}

export interface DateRangePickerProps {
  /**
   * The selected date range
   */
  value?: DateRangeValue
  /**
   * Callback when date range changes
   * @param range - The new date range or undefined if cleared
   */
  onChange: (range?: DateRangeValue) => void
  /**
   * Placeholder text when no range is selected
   */
  placeholder?: string
  /**
   * Additional CSS classes for the trigger button
   */
  className?: string
  /**
   * Whether the picker is disabled
   */
  disabled?: boolean
}

/**
 * Popover trigger component for date range picker
 */
const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <PopoverPrimitive.Trigger
    ref={ref}
    className={className}
    {...props}
  >
    {children}
  </PopoverPrimitive.Trigger>
))
PopoverTrigger.displayName = PopoverPrimitive.Trigger.displayName

/**
 * Popover content component for date range picker
 */
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'start', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      'z-50 w-auto rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

/**
 * Formats a date range for display in the picker trigger
 * @param dateRange - The date range to format
 * @returns Formatted string representation of the date range
 */
function formatDateRange(dateRange?: DateRangeValue): string {
  if (!dateRange?.from) {
    return 'Pick a date range'
  }
  
  if (!dateRange.to) {
    return format(dateRange.from, 'LLL dd, y')
  }
  
  if (dateRange.from.getTime() === dateRange.to.getTime()) {
    return format(dateRange.from, 'LLL dd, y')
  }
  
  return `${format(dateRange.from, 'LLL dd, y')} - ${format(dateRange.to, 'LLL dd, y')}`
}

/**
 * Checks if a date range matches a preset
 * @param dateRange - The date range to check
 * @param preset - The preset to compare against
 * @returns Whether the range matches the preset
 */
function isPresetSelected(dateRange?: DateRangeValue, preset?: DateRangePreset): boolean {
  if (!dateRange?.from || !preset || preset === 'CUSTOM') {
    return false
  }
  
  const presetRange = DATE_RANGE_PRESETS[preset].getRange()
  
  // Compare dates by time to handle timezone issues
  const rangeFromTime = dateRange.from.getTime()
  const rangeToTime = dateRange.to?.getTime()
  const presetFromTime = presetRange.from?.getTime()
  const presetToTime = presetRange.to?.getTime()
  
  return rangeFromTime === presetFromTime && rangeToTime === presetToTime
}

/**
 * Date range picker component with preset options and custom range selection.
 * Supports quick selection of common time periods and custom date ranges.
 */
export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Pick a date range',
  className,
  disabled = false
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedPreset, setSelectedPreset] = React.useState<DateRangePreset | undefined>(
    () => {
      // Determine initial preset based on current value
      for (const [key, preset] of Object.entries(DATE_RANGE_PRESETS)) {
        if (isPresetSelected(value, key as DateRangePreset)) {
          return key as DateRangePreset
        }
      }
      return value?.from ? 'CUSTOM' : undefined
    }
  )

  /**
   * Handles preset selection and applies the corresponding date range
   */
  const handlePresetSelect = React.useCallback((preset: DateRangePreset) => {
    setSelectedPreset(preset)
    
    if (preset === 'CUSTOM') {
      // For custom, don't change the current range
      return
    }
    
    const range = DATE_RANGE_PRESETS[preset].getRange()
    onChange(range)
  }, [onChange])

  /**
   * Handles custom date range selection from the calendar
   */
  const handleDateSelect = React.useCallback((range?: DateRange) => {
    if (range?.from || range?.to) {
      setSelectedPreset('CUSTOM')
    }
    
    onChange(range ? {
      from: range.from,
      to: range.to
    } : undefined)
  }, [onChange])

  /**
   * Clears the current date selection
   */
  const handleClear = React.useCallback(() => {
    setSelectedPreset(undefined)
    onChange(undefined)
  }, [onChange])

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-[300px] justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDateRange(value) : placeholder}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Preset buttons sidebar */}
          <div className="flex flex-col border-r p-3 gap-2">
            <div className="text-sm font-medium mb-2">Quick select</div>
            
            {(Object.entries(DATE_RANGE_PRESETS) as [DateRangePreset, typeof DATE_RANGE_PRESETS[DateRangePreset]][]).map(([key, preset]) => (
              <Button
                key={key}
                variant={selectedPreset === key ? 'default' : 'ghost'}
                className="w-32 justify-start text-sm h-8"
                onClick={() => handlePresetSelect(key)}
              >
                {preset.label}
              </Button>
            ))}
            
            <div className="border-t pt-2 mt-2">
              <Button
                variant="ghost"
                className="w-32 justify-start text-sm h-8"
                onClick={handleClear}
              >
                Clear
              </Button>
            </div>
          </div>
          
          {/* Calendar */}
          <div className="p-3">
            <DayPicker
              mode="range"
              defaultMonth={value?.from}
              selected={value ? { from: value.from, to: value.to } : undefined}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              disabled={(date) => date > new Date()}
              className="rdp"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
                day_range_start: "day-range-start",
                day_range_end: "day-range-end", 
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </PopoverPrimitive.Root>
  )
}