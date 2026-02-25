/**
 * Label component for FeedbackPulse v2.
 * Provides consistent form label styling with proper accessibility.
 */

import * as React from "react"

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

/**
 * Form label component with consistent typography and spacing.
 * Associates with form controls for proper accessibility.
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`
          text-sm font-medium leading-none text-gray-900
          peer-disabled:cursor-not-allowed peer-disabled:opacity-70
          ${className || ''}
        `}
        {...props}
      />
    )
  }
)
Label.displayName = "Label"

export { Label }