/**
 * Protected route component for client-side route protection.
 * Provides role-based access control for pages and components.
 * 
 * Features:
 * - Authentication verification
 * - Project membership validation
 * - Role and permission checking
 * - Loading states and error handling
 * - Fallback components for unauthorized access
 */

'use client'

// Simple user hook placeholder - this would normally come from auth context
const useUser = () => {
  // This would be implemented with proper auth context in a real app
  return null
}
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useProjectRole, type ProjectMembership } from '@/hooks/use-project-role'
import { 
  type ProjectRole, 
  type Permission,
  hasPermission, 
  hasMinimumRole 
} from '@/lib/auth/rbac'
import { Loader2, ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Configuration for route protection.
 */
export interface ProtectionConfig {
  /** Whether authentication is required */
  requireAuth?: boolean
  /** Project ID for project-specific protection */
  projectId?: string
  /** Whether project membership is required */
  requireProjectMembership?: boolean
  /** Minimum role required for access */
  minimumRole?: ProjectRole
  /** Specific permissions required */
  requiredPermissions?: Permission[]
  /** Custom redirect URL for unauthorized users */
  unauthorizedRedirect?: string
  /** Custom redirect URL for unauthenticated users */
  unauthenticatedRedirect?: string
}

/**
 * Props for protected route components.
 */
export interface ProtectedRouteProps {
  /** Child components to render when access is granted */
  children: ReactNode
  /** Protection configuration */
  config: ProtectionConfig
  /** Custom loading component */
  loadingComponent?: ReactNode
  /** Custom unauthorized component */
  unauthorizedComponent?: ReactNode
  /** Custom unauthenticated component */
  unauthenticatedComponent?: ReactNode
  /** Whether to automatically redirect on access denial */
  autoRedirect?: boolean
}

/**
 * Default loading component.
 */
function DefaultLoadingComponent() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Verifying access...</p>
      </div>
    </div>
  )
}

/**
 * Default unauthorized component.
 */
function DefaultUnauthorizedComponent({ 
  config, 
  onRedirect 
}: { 
  config: ProtectionConfig
  onRedirect?: () => void 
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <ShieldX className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            {config.requireProjectMembership
              ? 'You need to be a project member to access this page.'
              : config.minimumRole
              ? `You need at least ${config.minimumRole} role to access this page.`
              : 'You do not have permission to access this page.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {config.requiredPermissions && config.requiredPermissions.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Required permissions:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {config.requiredPermissions.map(permission => (
                  <li key={permission} className="flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 bg-current rounded-full" />
                    {permission.replace(':', ': ').replace('_', ' ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="space-x-2">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
            {onRedirect && (
              <Button onClick={onRedirect}>
                Go to Projects
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Default unauthenticated component.
 */
function DefaultUnauthenticatedComponent({ onRedirect }: { onRedirect?: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            Please sign in to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={onRedirect}>
            Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Protected route component that handles authentication and authorization.
 * 
 * @param props - Component props
 * @returns Protected content or fallback component
 */
export function ProtectedRoute({
  children,
  config,
  loadingComponent,
  unauthorizedComponent,
  unauthenticatedComponent,
  autoRedirect = false,
}: ProtectedRouteProps) {
  const user = useUser()
  const router = useRouter()
  const [roleState] = useProjectRole(config.projectId || null)

  /**
   * Handles redirects for unauthorized access.
   */
  const handleRedirect = (url: string) => {
    if (autoRedirect) {
      router.push(url)
    }
  }

  // Check if still loading
  if ((config.requireAuth !== false && !user) || 
      (config.projectId && roleState.loading)) {
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }
    return <DefaultLoadingComponent />
  }

  // Check authentication requirement
  if (config.requireAuth !== false && !user) {
    const redirectUrl = config.unauthenticatedRedirect || '/auth/login'
    handleRedirect(redirectUrl)
    
    if (unauthenticatedComponent) {
      return <>{unauthenticatedComponent}</>
    }
    return (
      <DefaultUnauthenticatedComponent 
        onRedirect={() => router.push(redirectUrl)}
      />
    )
  }

  // Check project membership requirement
  if (config.requireProjectMembership && config.projectId) {
    if (roleState.error) {
      console.error('Error checking project membership:', roleState.error)
    }
    
    if (!roleState.isMember) {
      const redirectUrl = config.unauthorizedRedirect || '/projects'
      handleRedirect(redirectUrl)
      
      if (unauthorizedComponent) {
        return <>{unauthorizedComponent}</>
      }
      return (
        <DefaultUnauthorizedComponent 
          config={config}
          onRedirect={() => router.push(redirectUrl)}
        />
      )
    }

    const { membership } = roleState
    if (membership) {
      // Check minimum role requirement
      if (config.minimumRole && !hasMinimumRole(membership.role, config.minimumRole)) {
        const redirectUrl = config.unauthorizedRedirect || '/projects'
        handleRedirect(redirectUrl)
        
        if (unauthorizedComponent) {
          return <>{unauthorizedComponent}</>
        }
        return (
          <DefaultUnauthorizedComponent 
            config={config}
            onRedirect={() => router.push(redirectUrl)}
          />
        )
      }

      // Check specific permissions
      if (config.requiredPermissions) {
        const hasAllPermissions = config.requiredPermissions.every(
          permission => hasPermission(membership.role, permission)
        )
        
        if (!hasAllPermissions) {
          const redirectUrl = config.unauthorizedRedirect || '/projects'
          handleRedirect(redirectUrl)
          
          if (unauthorizedComponent) {
            return <>{unauthorizedComponent}</>
          }
          return (
            <DefaultUnauthorizedComponent 
              config={config}
              onRedirect={() => router.push(redirectUrl)}
            />
          )
        }
      }
    }
  }

  // All checks passed, render protected content
  return <>{children}</>
}

/**
 * Higher-order component for wrapping pages with protection.
 * 
 * @param config - Protection configuration
 * @returns HOC function
 */
export function withProtection(config: ProtectionConfig) {
  return function <T extends {}>(Component: React.ComponentType<T>) {
    return function ProtectedComponent(props: T) {
      return (
        <ProtectedRoute config={config}>
          <Component {...props} />
        </ProtectedRoute>
      )
    }
  }
}

/**
 * Hook for checking if current user has access to perform an action.
 * Useful for conditional rendering of UI elements.
 * 
 * @param config - Protection configuration
 * @returns Object with access state and helpers
 */
export function useAccess(config: ProtectionConfig) {
  const user = useUser()
  const [roleState] = useProjectRole(config.projectId || null)
  
  const hasAccess = (() => {
    // Check authentication
    if (config.requireAuth !== false && !user) {
      return false
    }
    
    // Check project membership
    if (config.requireProjectMembership && config.projectId) {
      if (!roleState.isMember || !roleState.membership) {
        return false
      }
      
      const { membership } = roleState
      
      // Check minimum role
      if (config.minimumRole && !hasMinimumRole(membership.role, config.minimumRole)) {
        return false
      }
      
      // Check permissions
      if (config.requiredPermissions) {
        return config.requiredPermissions.every(
          permission => hasPermission(membership.role, permission)
        )
      }
    }
    
    return true
  })()
  
  return {
    hasAccess,
    loading: (config.requireAuth !== false && !user) || 
             (config.projectId && roleState.loading),
    user,
    membership: roleState.membership,
    error: roleState.error,
  }
}