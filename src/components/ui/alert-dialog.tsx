/**
 * Alert dialog component for FeedbackPulse v2.
 * Modal confirmation dialogs for destructive actions.
 */

import * as React from "react"

/**
 * Alert dialog context for state management.
 */
interface AlertDialogContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AlertDialogContext = React.createContext<AlertDialogContextType | null>(null)

/**
 * Root alert dialog provider.
 */
interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const AlertDialog: React.FC<AlertDialogProps> = ({ 
  open, 
  onOpenChange, 
  children 
}) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onOpenChange])

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  )
}

/**
 * Alert dialog content container.
 */
interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const AlertDialogContent: React.FC<AlertDialogContentProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  const context = React.useContext(AlertDialogContext)
  if (!context?.open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => context.onOpenChange(false)}
      />
      
      {/* Content */}
      <div
        className={`
          relative z-50 w-full max-w-md mx-4 bg-white rounded-lg shadow-lg p-6
          animate-in fade-in-0 zoom-in-95 duration-200
          ${className || ''}
        `}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Alert dialog header section.
 */
const AlertDialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  ...props 
}) => (
  <div
    className={`flex flex-col space-y-2 text-center sm:text-left mb-4 ${className || ''}`}
    {...props}
  />
)

/**
 * Alert dialog title.
 */
const AlertDialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ 
  className, 
  ...props 
}) => (
  <h2
    className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`}
    {...props}
  />
)

/**
 * Alert dialog description.
 */
const AlertDialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ 
  className, 
  ...props 
}) => (
  <p
    className={`text-sm text-gray-600 ${className || ''}`}
    {...props}
  />
)

/**
 * Alert dialog footer with action buttons.
 */
const AlertDialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  ...props 
}) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 ${className || ''}`}
    {...props}
  />
)

/**
 * Alert dialog action button (confirm).
 */
interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const AlertDialogAction: React.FC<AlertDialogActionProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  const context = React.useContext(AlertDialogContext)

  return (
    <button
      className={`
        inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 py-2 
        text-sm font-medium text-white ring-offset-white transition-colors 
        hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-red-500 focus-visible:ring-offset-2 
        disabled:pointer-events-none disabled:opacity-50
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Alert dialog cancel button.
 */
interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const AlertDialogCancel: React.FC<AlertDialogCancelProps> = ({ 
  className, 
  children, 
  onClick,
  ...props 
}) => {
  const context = React.useContext(AlertDialogContext)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    context?.onOpenChange(false)
  }

  return (
    <button
      className={`
        inline-flex h-10 items-center justify-center rounded-md border border-gray-300 
        bg-white px-4 py-2 text-sm font-medium text-gray-900 ring-offset-white 
        transition-colors hover:bg-gray-50 focus-visible:outline-none 
        focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 
        disabled:pointer-events-none disabled:opacity-50 mt-2 sm:mt-0
        ${className || ''}
      `}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
}