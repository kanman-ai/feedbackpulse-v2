/**
 * Authentication and authorization middleware for FeedbackPulse v2.
 * Provides route protection based on project roles and permissions.
 * 
 * Features:
 * - Authentication verification
 * - Project membership validation
 * - Role-based access control
 * - Permission checking
 * - Redirect handling for unauthorized access
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { type ProjectRole, type Permission, hasPermission, hasMinimumRole } from './rbac'

/**
 * Configuration for route protection middleware.
 */
export interface RouteProtectionConfig {
  /** Whether the route requires authentication */
  requireAuth?: boolean
  /** Whether the route requires project membership */
  requireProjectMembership?: boolean
  /** Minimum role required for access */
  minimumRole?: ProjectRole
  /** Specific permissions required */
  requiredPermissions?: Permission[]
  /** Redirect URL for unauthorized users */
  unauthorizedRedirect?: string
  /** Redirect URL for unauthenticated users */
  unauthenticatedRedirect?: string
}

/**
 * Default protection config for authenticated routes.
 */
export const DEFAULT_AUTH_CONFIG: RouteProtectionConfig = {
  requireAuth: true,
  unauthenticatedRedirect: '/auth/login',
  unauthorizedRedirect: '/projects',
}

/**
 * Protection config for project routes that require membership.
 */
export const PROJECT_MEMBER_CONFIG: RouteProtectionConfig = {
  ...DEFAULT_AUTH_CONFIG,
  requireProjectMembership: true,
  minimumRole: 'viewer',
}

/**
 * Protection config for project admin routes.
 */
export const PROJECT_ADMIN_CONFIG: RouteProtectionConfig = {
  ...PROJECT_MEMBER_CONFIG,
  minimumRole: 'owner',
  requiredPermissions: ['project:manage_members'],
}

/**
 * Protection config for editor-level routes.
 */
export const PROJECT_EDITOR_CONFIG: RouteProtectionConfig = {
  ...PROJECT_MEMBER_CONFIG,
  minimumRole: 'editor',
}

/**
 * Context object containing user and project information.
 */
export interface AuthContext {
  user: {
    id: string
    email?: string
  } | null
  projectMembership?: {
    projectId: string
    role: ProjectRole
    isOwner: boolean
  }
}

/**
 * Extracts project ID from URL pathname.
 * Supports patterns like /projects/[id] and /projects/[id]/settings.
 * 
 * @param pathname - The URL pathname
 * @returns Project ID if found in the path
 */
export function extractProjectId(pathname: string): string | null {
  const projectMatch = pathname.match(/\/projects\/([^\/]+)/)
  return projectMatch ? projectMatch[1] : null
}

/**
 * Creates a Supabase client for server-side operations.
 * 
 * @param request - The incoming request
 * @returns Configured Supabase client
 */
function createServerSupabaseClient(request: NextRequest) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Gets authentication context for the current request.
 * 
 * @param request - The incoming request
 * @param projectId - Optional project ID to check membership
 * @returns Authentication context with user and project info
 */
export async function getAuthContext(
  request: NextRequest,
  projectId?: string
): Promise<AuthContext> {
  const supabase = createServerSupabaseClient(request)
  
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { user: null }
    }

    const authContext: AuthContext = {
      user: {
        id: user.id,
        email: user.email,
      }
    }

    // If project ID provided, check membership
    if (projectId) {
      const { data: membership } = await supabase
        .from('project_members')
        .select(`
          role,
          projects!inner(
            id,
            owner_id
          )
        `)
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

      if (membership && (membership as any).projects) {
        authContext.projectMembership = {
          projectId,
          role: (membership as any).role as ProjectRole,
          isOwner: (membership as any).projects.owner_id === user.id,
        }
      }
    }

    return authContext
  } catch (error) {
    console.error('Error getting auth context:', error)
    return { user: null }
  }
}

/**
 * Middleware function to protect routes with authentication and authorization.
 * 
 * @param request - The incoming request
 * @param config - Protection configuration
 * @returns NextResponse or redirect response
 */
export async function protectRoute(
  request: NextRequest,
  config: RouteProtectionConfig = DEFAULT_AUTH_CONFIG
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl
  
  // Extract project ID if this is a project route
  const projectId = config.requireProjectMembership ? extractProjectId(pathname) : undefined
  
  // Get authentication context
  const authContext = await getAuthContext(request, projectId)
  
  // Check authentication requirement
  if (config.requireAuth && !authContext.user) {
    const redirectUrl = new URL(config.unauthenticatedRedirect || '/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check project membership requirement
  if (config.requireProjectMembership && projectId) {
    if (!authContext.projectMembership) {
      const redirectUrl = new URL(config.unauthorizedRedirect || '/projects', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    const { role } = authContext.projectMembership

    // Check minimum role requirement
    if (config.minimumRole && !hasMinimumRole(role, config.minimumRole)) {
      const redirectUrl = new URL(config.unauthorizedRedirect || '/projects', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Check specific permissions
    if (config.requiredPermissions) {
      const hasRequiredPermissions = config.requiredPermissions.every(
        permission => hasPermission(role, permission)
      )
      
      if (!hasRequiredPermissions) {
        const redirectUrl = new URL(config.unauthorizedRedirect || '/projects', request.url)
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // Access granted, continue to route
  return null
}

/**
 * Helper to create a middleware function for specific route protection.
 * 
 * @param config - Protection configuration
 * @returns Middleware function
 */
export function createRouteMiddleware(config: RouteProtectionConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    return protectRoute(request, config)
  }
}

/**
 * Checks if current user has access to a specific project action.
 * Useful for conditional rendering in components.
 * 
 * @param userRole - Current user's role in the project
 * @param requiredPermissions - Permissions required for the action
 * @returns True if user has access
 */
export function canPerformAction(
  userRole: ProjectRole,
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every(permission => hasPermission(userRole, requiredPermissions))
}

/**
 * Extracts and validates route parameters for type safety.
 * 
 * @param pathname - URL pathname
 * @param pattern - Route pattern with parameter names
 * @returns Extracted parameters or null if pattern doesn't match
 */
export function extractRouteParams(
  pathname: string,
  pattern: string
): Record<string, string> | null {
  // Convert Next.js route pattern to regex
  const regexPattern = pattern
    .replace(/\[([^\]]+)\]/g, '([^/]+)')
    .replace(/\/+/g, '\/')
  
  const match = pathname.match(new RegExp(`^${regexPattern}$`))
  if (!match) return null

  // Extract parameter names
  const paramNames = [...pattern.matchAll(/\[([^\]]+)\]/g)].map(m => m[1])
  
  // Build params object
  const params: Record<string, string> = {}
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1]
  })
  
  return params
}