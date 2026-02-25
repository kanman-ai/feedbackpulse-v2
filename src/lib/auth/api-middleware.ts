/**
 * API middleware for FeedbackPulse v2 route protection.
 * Provides authentication and authorization utilities for API routes.
 * 
 * Features:
 * - JWT validation
 * - Project membership verification
 * - Role-based access control
 * - Permission checking
 * - Standardized error responses
 */

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { type ProjectRole, type Permission, hasPermission, hasMinimumRole } from './rbac'

/**
 * Standardized API error response structure.
 */
export interface ApiError {
  error: string
  code: string
  details?: any
}

/**
 * Authentication context for API routes.
 */
export interface ApiAuthContext {
  user: {
    id: string
    email?: string
  }
  projectMembership?: {
    projectId: string
    role: ProjectRole
    isOwner: boolean
  }
}

/**
 * Configuration for API route protection.
 */
export interface ApiProtectionConfig {
  /** Whether authentication is required */
  requireAuth?: boolean
  /** Whether project membership is required */
  requireProjectMembership?: boolean
  /** Minimum role required for access */
  minimumRole?: ProjectRole
  /** Specific permissions required */
  requiredPermissions?: Permission[]
  /** Custom project ID extractor */
  projectIdExtractor?: (request: NextRequest, url: URL) => string | null
}

/**
 * Creates a Supabase client for API route operations.
 * 
 * @param request - The incoming API request
 * @returns Configured Supabase client
 */
function createApiSupabaseClient(request: NextRequest) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Extracts project ID from API route URL.
 * Supports patterns like /api/projects/[id] and /api/projects/[id]/feedback.
 * 
 * @param request - The incoming request
 * @param url - Parsed URL object
 * @returns Project ID if found in the path
 */
function defaultProjectIdExtractor(request: NextRequest, url: URL): string | null {
  const pathSegments = url.pathname.split('/')
  const projectsIndex = pathSegments.findIndex(segment => segment === 'projects')
  
  if (projectsIndex !== -1 && pathSegments[projectsIndex + 1]) {
    return pathSegments[projectsIndex + 1]
  }
  
  return null
}

/**
 * Gets authentication context for API routes.
 * 
 * @param request - The incoming API request
 * @param projectId - Optional project ID to check membership
 * @returns Authentication context with user and project info
 */
export async function getApiAuthContext(
  request: NextRequest,
  projectId?: string
): Promise<ApiAuthContext | null> {
  const supabase = createApiSupabaseClient(request)
  
  try {
    // Get current user from request
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return null
    }

    const authContext: ApiAuthContext = {
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
    console.error('Error getting API auth context:', error)
    return null
  }
}

/**
 * Creates standardized error responses for API routes.
 * 
 * @param message - Error message
 * @param code - Error code
 * @param status - HTTP status code
 * @param details - Additional error details
 * @returns Response object with error
 */
export function createErrorResponse(
  message: string,
  code: string,
  status: number,
  details?: any
): Response {
  const errorBody: ApiError = {
    error: message,
    code,
    ...(details && { details })
  }
  
  return new Response(JSON.stringify(errorBody), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Validates API request authentication and authorization.
 * 
 * @param request - The incoming API request
 * @param config - Protection configuration
 * @returns Auth context if valid, or error response if unauthorized
 */
export async function validateApiAccess(
  request: NextRequest,
  config: ApiProtectionConfig = {}
): Promise<{ context: ApiAuthContext } | { error: Response }> {
  const url = new URL(request.url)
  
  // Extract project ID using custom extractor or default
  const projectId = config.projectIdExtractor
    ? config.projectIdExtractor(request, url)
    : config.requireProjectMembership
    ? defaultProjectIdExtractor(request, url)
    : undefined
  
  // Get authentication context
  const authContext = await getApiAuthContext(request, projectId)
  
  // Check authentication requirement
  if (config.requireAuth !== false && !authContext) {
    return {
      error: createErrorResponse(
        'Authentication required',
        'UNAUTHORIZED',
        401
      )
    }
  }

  if (!authContext) {
    // If auth is not required and user is not authenticated, 
    // create minimal context
    return {
      context: {
        user: { id: '', email: undefined }
      }
    }
  }

  // Check project membership requirement
  if (config.requireProjectMembership && projectId) {
    if (!authContext.projectMembership) {
      return {
        error: createErrorResponse(
          'Project access required',
          'FORBIDDEN',
          403,
          { projectId }
        )
      }
    }

    const { role } = authContext.projectMembership

    // Check minimum role requirement
    if (config.minimumRole && !hasMinimumRole(role, config.minimumRole)) {
      return {
        error: createErrorResponse(
          `Minimum role '${config.minimumRole}' required`,
          'INSUFFICIENT_PERMISSIONS',
          403,
          { userRole: role, requiredRole: config.minimumRole }
        )
      }
    }

    // Check specific permissions
    if (config.requiredPermissions) {
      const missingPermissions = config.requiredPermissions.filter(
        permission => !hasPermission(role, permission)
      )
      
      if (missingPermissions.length > 0) {
        return {
          error: createErrorResponse(
            'Insufficient permissions',
            'MISSING_PERMISSIONS',
            403,
            { 
              userRole: role, 
              missingPermissions,
              requiredPermissions: config.requiredPermissions
            }
          )
        }
      }
    }
  }

  return { context: authContext }
}

/**
 * Higher-order function to wrap API route handlers with authentication/authorization.
 * 
 * @param handler - The original API route handler
 * @param config - Protection configuration
 * @returns Protected API route handler
 */
export function withApiAuth<T extends any[]>(
  handler: (request: NextRequest, context: ApiAuthContext, ...args: T) => Promise<Response>,
  config: ApiProtectionConfig = {}
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const validation = await validateApiAccess(request, config)
    
    if ('error' in validation) {
      return validation.error
    }
    
    return handler(request, validation.context, ...args)
  }
}

/**
 * Helper function to check if user can perform action in API routes.
 * 
 * @param context - API authentication context
 * @param requiredPermissions - Required permissions for the action
 * @returns True if user has all required permissions
 */
export function canUserPerformApiAction(
  context: ApiAuthContext,
  requiredPermissions: Permission[]
): boolean {
  if (!context.projectMembership) {
    return false
  }
  
  return requiredPermissions.every(
    permission => hasPermission(context.projectMembership!.role, permission)
  )
}

/**
 * Creates a success response for API routes.
 * 
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns Response object with data
 */
export function createSuccessResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}