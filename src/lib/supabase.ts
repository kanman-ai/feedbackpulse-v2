/**
 * Supabase client configuration for FeedbackPulse v2.
 * 
 * This module initializes and exports the Supabase client instance with
 * proper environment configuration. Used throughout the app for database
 * operations and authentication.
 * 
 * @module SupabaseClient
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

/**
 * Main Supabase client instance for the application.
 * 
 * Pre-configured with TypeScript types and environment variables.
 * Automatically handles auth state, RLS policies, and real-time subscriptions.
 * 
 * @example
 * ```typescript
 * import { supabase } from '@/lib/supabase'
 * 
 * const { data: projects } = await supabase
 *   .from('projects')
 *   .select('*')
 *   .eq('owner_id', userId)
 * ```
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Automatically refresh tokens before they expire
    autoRefreshToken: true,
    // Persist auth state in localStorage
    persistSession: true,
    // Detect auth changes (login/logout)
    detectSessionInUrl: true
  }
})

/**
 * Server-side Supabase client for API routes and server components.
 * 
 * Uses the service role key for admin operations that bypass RLS.
 * Should only be used in server-side contexts where RLS bypass is needed.
 * 
 * @example
 * ```typescript
 * import { supabaseAdmin } from '@/lib/supabase'
 * 
 * // Only use in API routes for admin operations
 * const { data } = await supabaseAdmin
 *   .from('profiles')
 *   .insert(newProfile)
 * ```
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)