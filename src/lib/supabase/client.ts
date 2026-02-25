/**
 * Supabase client configuration for FeedbackPulse v2.
 * Provides browser-side client for auth operations and API calls.
 * Uses environment variables for configuration.
 */
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from './types'

/**
 * Creates and returns a Supabase client instance for browser-side operations.
 * Automatically handles session management and cookie-based authentication.
 * 
 * @returns Configured Supabase client with TypeScript database types
 * @throws Error if environment variables are missing or invalid
 */
export function createClient() {
  return createClientComponentClient<Database>()
}

/**
 * Browser-side Supabase client instance.
 * Used for authentication, real-time subscriptions, and client-side queries.
 * Session state is automatically synchronized with cookies.
 */
export const supabase = createClient()