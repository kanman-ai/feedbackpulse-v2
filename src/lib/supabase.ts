/**
 * Supabase client configuration for FeedbackPulse v2 authentication.
 * Provides client-side Supabase instance with proper auth handling.
 */
import { createClient } from '@supabase/supabase-js'

/**
 * Environment variables for Supabase configuration.
 * These must be set in the deployment environment or .env.local file.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

/**
 * Creates a Supabase client for client-side operations.
 * Used in React components and client-side authentication flows.
 * 
 * @returns Configured Supabase client instance for browser usage
 */
export const createClientSupabase = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
}