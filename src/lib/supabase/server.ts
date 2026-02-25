/**
 * Server-side Supabase client configuration for FeedbackPulse v2.
 * Used for API routes and server components that need database access
 * without user authentication context.
 */

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Creates a server-side Supabase client for use in API routes and server components.
 * This client uses the service role key for administrative operations that don't
 * require user authentication.
 * 
 * @returns Configured Supabase client with admin privileges
 */
export function createServerSupabaseClient() {
  return createServerComponentClient<Database>({ 
    cookies 
  })
}

/**
 * Creates an admin Supabase client with elevated privileges for operations
 * that need to bypass RLS (Row Level Security) policies.
 * Use sparingly and only for legitimate admin operations.
 * 
 * @returns Supabase client with service role privileges
 */
export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient<Database>(supabaseUrl, serviceKey)
}