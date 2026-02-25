/**
 * Role badge component for displaying user roles in projects.
 * Shows role name with appropriate styling and optional tooltip
 * with role permissions.
 * 
 * Features:
 * - Color-coded role badges
 * - Permission tooltips on hover
 * - Accessible role indicators
 * - Customizable styling
 */

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { type ProjectRole, ROLE_PERMISSIONS } from '@/lib/auth/rbac'
import { Crown, Edit, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Props for the RoleBadge component.
 */
interface RoleBadgeProps {
  /** The role to display */
  role: ProjectRole
  /** Whether to show a tooltip with permissions */
  showTooltip?: boolean
  /** Whether to show an icon alongside the role name */
  showIcon?: boolean
  /** Additional CSS classes */
  className?: string
  /** Size variant of the badge */
  size?: 'sm' | 'default' | 'lg'
}

/**
 * Role configuration including display properties.
 */
const ROLE_CONFIG: Record<ProjectRole, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  description: string
  colorClass: string
}> = {
  viewer: {
    label: 'Viewer',
    icon: Eye,
    variant: 'outline',
    description: 'Can view project content and analytics',
    colorClass: 'text-gray-600 bg-gray-50 border-gray-200',
  },
  editor: {
    label: 'Editor',
    icon: Edit,
    variant: 'secondary',
    description: 'Can manage feedback, widgets, and view analytics',
    colorClass: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  owner: {
    label: 'Owner',
    icon: Crown,
    variant: 'default',
    description: 'Full control over project including member management',
    colorClass: 'text-purple-600 bg-purple-50 border-purple-200',
  },
}

/**
 * Formats permission names for display.
 * 
 * @param permission - The permission string to format
 * @returns Human-readable permission name
 */
function formatPermission(permission: string): string {
  return permission
    .split(':')
    .map(part => part.split('_').map(
      word => word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '))
    .join(': ')
}

/**
 * Creates tooltip content showing role permissions.
 * 
 * @param role - The role to show permissions for
 * @returns Formatted tooltip content
 */
function createTooltipContent(role: ProjectRole) {
  const config = ROLE_CONFIG[role]
  const permissions = ROLE_PERMISSIONS[role]

  return (
    <div className="max-w-xs">
      <div className="font-semibold mb-2 flex items-center gap-1.5">
        <config.icon className="h-4 w-4" />
        {config.label}
      </div>
      <div className="text-sm text-muted-foreground mb-3">
        {config.description}
      </div>
      <div>
        <div className="font-medium mb-1 text-sm">Permissions:</div>
        <ul className="space-y-1">
          {permissions.map(permission => (
            <li key={permission} className="text-xs flex items-start">
              <span className="w-1 h-1 bg-current rounded-full mt-2 mr-2 flex-shrink-0" />
              {formatPermission(permission)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/**
 * Role badge component for displaying user roles with optional tooltips.
 * 
 * @param props - Component props
 * @returns Role badge element
 */
export function RoleBadge({ 
  role, 
  showTooltip = false, 
  showIcon = false, 
  className,
  size = 'default'
}: RoleBadgeProps) {
  const config = ROLE_CONFIG[role]
  const Icon = config.icon
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1 h-5',
    default: 'text-sm px-2.5 py-1.5 h-6',
    lg: 'text-base px-3 py-2 h-8'
  }
  
  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4', 
    lg: 'h-5 w-5'
  }

  const badge = (
    <Badge 
      variant={config.variant}
      className={cn(
        config.colorClass,
        sizeClasses[size],
        'font-medium inline-flex items-center gap-1.5 border',
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center">
          {createTooltipContent(role)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Simple role text component without badge styling.
 * Useful for inline text or when badge styling is not needed.
 */
interface RoleTextProps {
  role: ProjectRole
  className?: string
}

export function RoleText({ role, className }: RoleTextProps) {
  const config = ROLE_CONFIG[role]
  
  return (
    <span className={cn('font-medium', config.colorClass.split(' ')[0], className)}>
      {config.label}
    </span>
  )
}

/**
 * Role selection dropdown component for forms.
 */
interface RoleSelectProps {
  value: ProjectRole
  onChange: (role: ProjectRole) => void
  disabled?: boolean
  excludeRoles?: ProjectRole[]
  className?: string
}

export function RoleSelect({ 
  value, 
  onChange, 
  disabled = false, 
  excludeRoles = [],
  className 
}: RoleSelectProps) {
  const availableRoles = (['viewer', 'editor', 'owner'] as ProjectRole[])
    .filter(role => !excludeRoles.includes(role))

  return (
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value as ProjectRole)}
      disabled={disabled}
      className={cn(
        'border border-input bg-background px-3 py-2 text-sm rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {availableRoles.map(role => {
        const config = ROLE_CONFIG[role]
        return (
          <option key={role} value={role}>
            {config.label}
          </option>
        )
      })}
    </select>
  )
}