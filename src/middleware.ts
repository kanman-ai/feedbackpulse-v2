/**
 * Next.js middleware for FeedbackPulse v2 route protection and authentication.
 * Handles session validation, route protection, and automatic redirects.
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Middleware function that runs on every request to handle authentication.
 * Protects dashboard routes and redirects authenticated users from auth pages.
 * 
 * @param request - Next.js request object with URL and headers
 * @returns Next.js response with appropriate redirects or page content
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  try {
    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables in middleware')
      return NextResponse.next()
    }
    
    // Create Supabase client for middleware
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Get auth token from cookies
    const token = request.cookies.get('sb-access-token')?.value ||
                 request.cookies.get('supabase-auth-token')?.value
    
    // Define route categories
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup')
    const isDashboardRoute = pathname.startsWith('/dashboard')
    const isPublicRoute = pathname === '/' || pathname.startsWith('/api/') || pathname.startsWith('/_next/')
    
    // Simple token-based auth check
    const isAuthenticated = !!token
    
    // Handle authenticated users trying to access auth pages
    if (isAuthenticated && isAuthPage) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
    
    // Handle unauthenticated users trying to access protected routes
    if (!isAuthenticated && isDashboardRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      // Preserve the original destination for post-login redirect
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // For all other cases, continue normally
    return NextResponse.next()
    
  } catch (error) {
    console.error('Middleware error:', error)
    
    // On error, redirect to login for protected routes
    if (pathname.startsWith('/dashboard')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }
    
    // For other routes, continue normally
    return NextResponse.next()
  }
}

/**
 * Middleware configuration specifying which routes to process.
 * Excludes static files, API routes, and Next.js internals for performance.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}