/**
 * Avatar component for FeedbackPulse v2.
 * User profile images with fallback support and consistent sizing.
 */

import * as React from "react"

/**
 * Avatar root container.
 */
interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const Avatar: React.FC<AvatarProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={`
        relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Avatar image component with proper object fit.
 */
interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

const AvatarImage: React.FC<AvatarImageProps> = ({ className, ...props }) => {
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)

  if (imageError) return null

  return (
    <img
      className={`aspect-square h-full w-full object-cover ${className || ''}`}
      onLoad={() => setImageLoaded(true)}
      onError={() => setImageError(true)}
      {...props}
    />
  )
}

/**
 * Avatar fallback content when image fails to load.
 */
interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const AvatarFallback: React.FC<AvatarFallbackProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <div
      className={`
        flex h-full w-full items-center justify-center rounded-full bg-gray-100
        text-gray-600 font-medium text-sm
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback }