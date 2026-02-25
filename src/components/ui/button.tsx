/**
 * Reusable button component for FeedbackPulse v2 authentication forms.
 * Provides consistent styling and interaction states across the application.
 */
import React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: 'default' | 'outline' | 'ghost'
  /** Size variant of the button */
  size?: 'default' | 'sm' | 'lg'
  /** Whether button shows loading state */
  loading?: boolean
}

/**
 * Button component with variant styles and loading state support.
 * Used in authentication forms and throughout the dashboard interface.
 * 
 * @param className - Additional CSS classes to apply
 * @param variant - Visual style variant (default, outline, ghost)
 * @param size - Size variant (default, sm, lg)
 * @param loading - Whether to show loading spinner
 * @param disabled - Whether button is disabled (auto-enabled during loading)
 * @param children - Button content (text, icons, etc.)
 * @param props - Additional HTML button props
 * @returns Styled button element
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, disabled, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
    
    const variantClasses = {
      default: 'bg-blue-600 text-white hover:bg-blue-700',
      outline: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
      ghost: 'text-gray-900 hover:bg-gray-100'
    }
    
    const sizeClasses = {
      default: 'h-10 py-2 px-4',
      sm: 'h-9 px-3 text-sm',
      lg: 'h-11 px-8'
    }

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }