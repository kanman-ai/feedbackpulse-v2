/**
 * Separator component for FeedbackPulse v2.
 * Visual divider for content sections with proper spacing.
 */

import * as React from "react"

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

/**
 * Visual separator component for dividing content sections.
 * Supports both horizontal and vertical orientations.
 */
const Separator: React.FC<SeparatorProps> = ({ 
  className, 
  orientation = 'horizontal',
  ...props 
}) => {
  return (
    <div
      className={`
        shrink-0 bg-gray-200
        ${orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]'}
        ${className || ''}
      `}
      {...props}
    />
  )
}

export { Separator }