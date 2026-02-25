/**
 * Server-side Supabase client for Next.js App Router.
 * 
 * This module provides server-side Supabase client creation that properly
 * handles cookies and authentication state for server components and API routes.
 * Follows the official Supabase Next.js integration patterns.
 * 
 * @module SupabaseServer
 */

import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

/**
 * Creates a Supabase client for server-side operations.
 * 
 * This function creates a server-side Supabase client that properly handles
 * cookies for authentication state management. It uses the cookies() function
 * from Next.js to read and write authentication cookies.
 * 
 * @returns Configured Supabase client for server-side use
 * @throws Error if required environment variables are missing
 * 
 * @example
 * ```typescript
 * import { createServerClient } from '@/lib/supabase/server'
 * 
 * export default async function ServerComponent() {
 *   const supabase = createServerClient()
 *   const { data: projects } = await supabase.from('projects').select('*')
 *   return <div>{projects?.length} projects</div>
 * }
 * ```
 */
export function createServerClient() {
  const cookieStore = cookies()

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  }

  return createSupabaseServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        /**
         * Reads a cookie value by name.
         * Used by Supabase to retrieve authentication tokens.
         * 
         * @param name - Cookie name to retrieve
         * @returns Cookie value or undefined if not found
         */
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        
        /**
         * Sets a cookie with the provided options.
         * Used by Supabase to store authentication tokens.
         * 
         * @param name - Cookie name to set
         * @param value - Cookie value to store
         * @param options - Cookie options (expiry, security, etc.)
         */
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // This can happen during SSG or when cookies can't be set
            // We'll handle this gracefully by not setting the cookie
            console.warn(`Could not set cookie ${name}:`, error)
          }
        },
        
        /**
         * Removes a cookie by name.
         * Used by Supabase during logout operations.
         * 
         * @param name - Cookie name to remove
         * @param options - Cookie options for removal
         */
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // This can happen during SSG or when cookies can't be removed
            // We'll handle this gracefully by not removing the cookie
            console.warn(`Could not remove cookie ${name}:`, error)
          }
        },
      },
    }
  )
}