/**
 * Badge component for FeedbackPulse v2.
 * Small status indicators with multiple variants for different contexts.
 */

import * as React from "react"

/**
 * Badge variant styles.
 */
const badgeVariants = {
  default: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  outline: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50",
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants
}

/**
 * Small badge component for status indicators and labels.
 * Supports multiple variants for different semantic meanings.
 */
const Badge: React.FC<BadgeProps> = ({ 
  className, 
  variant = "default", 
  ...props 
}) => {
  return (
    <div
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${badgeVariants[variant]}
        ${className || ''}
      `}
      {...props}
    />
  )
}

export { Badge }