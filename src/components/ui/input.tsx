/**
 * Reusable input component for FeedbackPulse v2 forms.
 * Provides consistent styling and accessibility for form inputs.
 */
import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Error message to display below input */
  error?: string
}

/**
 * Input component with error state support.
 * Used in authentication forms and throughout the dashboard.
 * 
 * @param className - Additional CSS classes to apply
 * @param type - HTML input type (email, password, text, etc.)
 * @param error - Error message to show in error state
 * @param props - Additional HTML input props
 * @returns Styled input element with optional error display
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }