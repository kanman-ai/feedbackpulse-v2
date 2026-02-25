/**
 * Dropdown menu component for FeedbackPulse v2.
 * Context menu with trigger and content positioning.
 */

import * as React from "react"

/**
 * Dropdown menu context for state management.
 */
interface DropdownContextType {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement>
}

const DropdownContext = React.createContext<DropdownContextType | null>(null)

/**
 * Root dropdown menu provider.
 */
interface DropdownMenuProps {
  children: React.ReactNode
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement>(null)

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative">{children}</div>
    </DropdownContext.Provider>
  )
}

/**
 * Dropdown trigger button.
 */
interface DropdownMenuTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({ 
  asChild, 
  children 
}) => {
  const context = React.useContext(DropdownContext)
  
  if (!context) {
    throw new Error('DropdownMenuTrigger must be used within DropdownMenu')
  }

  const handleClick = () => {
    context.setOpen(!context.open)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      ref: context.triggerRef,
      onClick: handleClick,
    })
  }

  return (
    <button
      ref={context.triggerRef as React.RefObject<HTMLButtonElement>}
      onClick={handleClick}
      className="inline-flex items-center justify-center"
    >
      {children}
    </button>
  )
}

/**
 * Dropdown menu content container.
 */
interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end'
  children: React.ReactNode
}

const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ 
  align = 'center',
  className,
  children,
  ...props 
}) => {
  const context = React.useContext(DropdownContext)
  
  if (!context?.open) return null

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  }

  return (
    <div
      className={`
        absolute top-full mt-2 z-50 min-w-[8rem] overflow-hidden rounded-md border 
        bg-white shadow-md animate-in fade-in-0 zoom-in-95 duration-200
        ${alignmentClasses[align]}
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Individual dropdown menu item.
 */
interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean
  children: React.ReactNode
}

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ 
  disabled,
  className,
  onClick,
  children,
  ...props 
}) => {
  const context = React.useContext(DropdownContext)

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    
    onClick?.(event)
    context?.setOpen(false)
  }

  return (
    <div
      className={`
        relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm
        outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100
        ${disabled ? 'pointer-events-none opacity-50' : ''}
        ${className || ''}
      `}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Dropdown menu separator.
 */
const DropdownMenuSeparator: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  ...props 
}) => (
  <div
    className={`-mx-1 my-1 h-px bg-gray-200 ${className || ''}`}
    {...props}
  />
)

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
}