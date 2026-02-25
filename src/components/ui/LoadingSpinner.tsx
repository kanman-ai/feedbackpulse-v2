/**
 * Loading Spinner Component
 * 
 * A reusable loading spinner with configurable sizes and colors.
 */

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Custom CSS class names */
  className?: string;
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'white';
}

/**
 * A configurable loading spinner component for indicating loading states.
 * 
 * @param size - The size of the spinner (sm, md, lg)
 * @param className - Additional CSS classes to apply
 * @param variant - Color variant of the spinner
 * @returns JSX element containing an animated spinner
 */
export function LoadingSpinner({ 
  size = 'md', 
  className,
  variant = 'primary'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  const variantClasses = {
    primary: 'border-blue-600',
    secondary: 'border-gray-600',
    white: 'border-white'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-200',
        sizeClasses[size],
        variantClasses[variant],
        'border-t-transparent',
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}