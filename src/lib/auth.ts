/**
 * Authentication utilities for FeedbackPulse v2.
 * 
 * Provides helper functions for user authentication, session management,
 * and auth state handling using Supabase Auth.
 * 
 * @module AuthUtils
 */

import { supabase } from './supabase'
import type { User, AuthError } from '@supabase/supabase-js'

/**
 * Sign up a new user with email and password.
 * 
 * Creates a new user account and automatically triggers profile creation
 * via database trigger. The user will need to confirm their email before
 * the account is fully activated.
 * 
 * @param email - User's email address
 * @param password - User's password (minimum 6 characters)
 * @param fullName - User's full name (optional)
 * @returns Promise resolving to user data or error
 */
export async function signUp(email: string, password: string, fullName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  })

  return { data, error }
}

/**
 * Sign in an existing user with email and password.
 * 
 * Authenticates the user and establishes a session. The session will
 * be automatically persisted and restored on subsequent visits.
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise resolving to user data or error
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  return { data, error }
}

/**
 * Sign out the current user.
 * 
 * Terminates the current session and clears stored auth tokens.
 * Redirects user to login state.
 * 
 * @returns Promise resolving to success or error
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

/**
 * Get the currently authenticated user.
 * 
 * Returns the user object if authenticated, null otherwise.
 * This function reads from the current session without making
 * a network request.
 * 
 * @returns Current user or null
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Get the current user session.
 * 
 * Returns the full session object including user data and tokens.
 * Use this when you need access to the session metadata.
 * 
 * @returns Promise resolving to session data
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

/**
 * Subscribe to authentication state changes.
 * 
 * Listens for login, logout, and session refresh events.
 * Useful for updating UI when auth state changes.
 * 
 * @param callback - Function called when auth state changes
 * @returns Subscription object with unsubscribe method
 * 
 * @example
 * ```typescript
 * const { unsubscribe } = onAuthStateChange((event, session) => {
 *   if (event === 'SIGNED_IN') {
 *     console.log('User signed in:', session?.user.email)
 *   } else if (event === 'SIGNED_OUT') {
 *     console.log('User signed out')
 *   }
 * })
 * 
 * // Clean up subscription
 * unsubscribe()
 * ```
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  return supabase.auth.onAuthStateChange(callback)
}

/**
 * Reset password for a user by email.
 * 
 * Sends a password reset email to the user. The email will contain
 * a secure link to reset their password.
 * 
 * @param email - User's email address
 * @returns Promise resolving to success or error
 */
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  })

  return { data, error }
}

/**
 * Update the current user's password.
 * 
 * Updates the password for the currently authenticated user.
 * User must be signed in to use this function.
 * 
 * @param newPassword - New password (minimum 6 characters)
 * @returns Promise resolving to user data or error
 */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })

  return { data, error }
}

/**
 * Update the current user's profile information.
 * 
 * Updates user metadata such as full name. This will also
 * trigger an update to the profiles table via database trigger.
 * 
 * @param updates - Object containing fields to update
 * @returns Promise resolving to user data or error
 */
export async function updateProfile(updates: { fullName?: string }) {
  const { data, error } = await supabase.auth.updateUser({
    data: {
      full_name: updates.fullName
    }
  })

  return { data, error }
}