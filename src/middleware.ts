/**
 * Next.js middleware for FeedbackPulse v2 route protection.
 * Handles authentication and authorization for protected routes.
 * 
 * Features:
 * - Authentication verification for protected routes
 * - Project membership validation
 * - Role-based access control
 * - Automatic redirects for unauthorized access
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  protectRoute,
  PROJECT_MEMBER_CONFIG,
  PROJECT_EDITOR_CONFIG,
  PROJECT_ADMIN_CONFIG,
  DEFAULT_AUTH_CONFIG
} from '@/lib/auth/middleware'

/**
 * Route patterns that require different levels of protection.
 */
const PROTECTED_ROUTES = {
  // Routes that require authentication only
  auth: ['/projects', '/settings', '/api/user'],
  
  // Routes that require project membership
  projectMember: [
    '/projects/[id]',
    '/projects/[id]/feedback',
    '/projects/[id]/analytics',
    '/api/projects/[id]/feedback',
    '/api/projects/[id]/analytics',
  ],
  
  // Routes that require editor permissions
  projectEditor: [
    '/projects/[id]/settings',
    '/projects/[id]/widget',
    '/api/projects/[id]/widget',
    '/api/projects/[id]/settings',
  ],
  
  // Routes that require owner permissions
  projectOwner: [
    '/projects/[id]/members',
    '/projects/[id]/danger',
    '/api/projects/[id]/members',
    '/api/projects/[id]/invites',
    '/api/projects/[id]/delete',
  ],
}

/**
 * Checks if a pathname matches any of the given route patterns.
 * 
 * @param pathname - The URL pathname to check
 * @param patterns - Array of route patterns to match against
 * @returns True if pathname matches any pattern
 */
function matchesAnyRoute(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Convert Next.js route pattern to regex
    const regexPattern = pattern
      .replace(/\[([^\]]+)\]/g, '[^/]+') // Replace [param] with [^/]+
      .replace(/\//g, '\/') // Escape forward slashes
    
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(pathname)
  })
}

/**
 * Main middleware function for route protection.
 * 
 * @param request - The incoming request
 * @returns NextResponse or redirect response
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') || // Supabase auth endpoints
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // Static files like .png, .css, etc.
  ) {
    return NextResponse.next()
  }

  // Apply protection based on route requirements
  try {
    // Check for owner-level routes first (most restrictive)
    if (matchesAnyRoute(pathname, PROTECTED_ROUTES.projectOwner)) {
      const result = await protectRoute(request, PROJECT_ADMIN_CONFIG)
      return result || NextResponse.next()
    }
    
    // Check for editor-level routes
    if (matchesAnyRoute(pathname, PROTECTED_ROUTES.projectEditor)) {
      const result = await protectRoute(request, PROJECT_EDITOR_CONFIG)
      return result || NextResponse.next()
    }
    
    // Check for project member routes
    if (matchesAnyRoute(pathname, PROTECTED_ROUTES.projectMember)) {
      const result = await protectRoute(request, PROJECT_MEMBER_CONFIG)
      return result || NextResponse.next()
    }
    
    // Check for general authenticated routes
    if (matchesAnyRoute(pathname, PROTECTED_ROUTES.auth)) {
      const result = await protectRoute(request, DEFAULT_AUTH_CONFIG)
      return result || NextResponse.next()
    }
    
    // Public route, no protection needed
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    
    // On error, redirect to login for safety
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('error', 'middleware_error')
    return NextResponse.redirect(redirectUrl)
  }
}

/**
 * Configuration for which routes the middleware should run on.
 * Excludes static files and Next.js internals for performance.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (Supabase auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}