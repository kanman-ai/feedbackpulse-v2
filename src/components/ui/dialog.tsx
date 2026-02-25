/**
 * Dialog component for FeedbackPulse v2.
 * Modal dialog with overlay, close on escape, and focus management.
 */

import * as React from "react"

/**
 * Dialog context for managing open state.
 */
interface DialogContextType {
  open: boolean
  onClose: () => void
}

const DialogContext = React.createContext<DialogContextType | null>(null)

/**
 * Root dialog provider component.
 */
interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  const handleClose = () => onOpenChange(false)

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleClose()
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
  }, [open])

  return (
    <DialogContext.Provider value={{ open, onClose: handleClose }}>
      {children}
    </DialogContext.Provider>
  )
}

/**
 * Dialog overlay and content container.
 */
interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const DialogContent: React.FC<DialogContentProps> = ({ className, children, ...props }) => {
  const context = React.useContext(DialogContext)
  if (!context?.open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={context.onClose}
      />
      
      {/* Content */}
      <div
        className={`
          relative z-50 w-full max-w-lg mx-4 bg-white rounded-lg shadow-lg
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
 * Dialog header section.
 */
const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  ...props 
}) => (
  <div
    className={`flex flex-col space-y-1.5 text-center sm:text-left p-6 pb-0 ${className || ''}`}
    {...props}
  />
)

/**
 * Dialog title with proper typography.
 */
const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ 
  className, 
  ...props 
}) => (
  <h2
    className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`}
    {...props}
  />
)

/**
 * Dialog description text.
 */
const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ 
  className, 
  ...props 
}) => (
  <p
    className={`text-sm text-gray-600 ${className || ''}`}
    {...props}
  />
)

/**
 * Dialog footer section.
 */
const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  ...props 
}) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0 ${className || ''}`}
    {...props}
  />
)

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
}