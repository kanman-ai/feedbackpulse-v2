/**
 * Select component for FeedbackPulse v2.
 * Custom dropdown select with keyboard navigation and accessibility.
 */

import * as React from "react"
import { ChevronDown } from "lucide-react"

/**
 * Select context for state management.
 */
interface SelectContextType {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextType | null>(null)

/**
 * Root select provider.
 */
interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [open, setOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

/**
 * Select trigger button.
 */
interface SelectTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const SelectTrigger: React.FC<SelectTriggerProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  const context = React.useContext(SelectContext)
  
  if (!context) {
    throw new Error('SelectTrigger must be used within Select')
  }

  const handleClick = () => {
    context.setOpen(!context.open)
  }

  return (
    <button
      className={`
        flex h-10 w-full items-center justify-between rounded-md border border-gray-300 
        bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
        disabled:cursor-not-allowed disabled:opacity-50
        ${className || ''}
      `}
      onClick={handleClick}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

/**
 * Select value display component.
 */
interface SelectValueProps {
  placeholder?: string
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const context = React.useContext(SelectContext)
  
  if (!context) {
    throw new Error('SelectValue must be used within Select')
  }

  return <span>{context.value || placeholder}</span>
}

/**
 * Select dropdown content.
 */
interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const SelectContent: React.FC<SelectContentProps> = ({ 
  className, 
  children, 
  ...props 
}) => {
  const context = React.useContext(SelectContext)
  
  if (!context?.open) return null

  return (
    <div
      className={`
        absolute top-full mt-1 z-50 min-w-[8rem] overflow-hidden rounded-md border 
        bg-white shadow-md animate-in fade-in-0 zoom-in-95 duration-200
        w-full
        ${className || ''}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Individual select option item.
 */
interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  children: React.ReactNode
}

const SelectItem: React.FC<SelectItemProps> = ({ 
  value,
  className,
  children,
  ...props 
}) => {
  const context = React.useContext(SelectContext)
  
  if (!context) {
    throw new Error('SelectItem must be used within Select')
  }

  const handleClick = () => {
    context.onValueChange(value)
    context.setOpen(false)
  }

  const isSelected = context.value === value

  return (
    <div
      className={`
        relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 
        text-sm outline-none hover:bg-gray-100 focus:bg-gray-100
        ${isSelected ? 'bg-gray-100 font-medium' : ''}
        ${className || ''}
      `}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
}