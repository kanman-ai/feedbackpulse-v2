/**
 * Skeleton loading component for FeedbackPulse v2.
 * Provides placeholder content while data is loading.
 */

import * as React from "react"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Skeleton loading placeholder with animated shimmer effect.
 * Used to indicate loading states while preserving layout.
 */
const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={`
        animate-pulse rounded-md bg-gray-200
        ${className || ''}
      `}
      {...props}
    />
  )
}

export { Skeleton }