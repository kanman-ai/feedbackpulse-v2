/**
 * Authentication context for FeedbackPulse v2 user session management.
 * Provides React context for auth state, login/logout functions, and session handling.
 */
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { createClientSupabase } from '@/lib/supabase'

interface AuthContextType {
  /** Current authenticated user, null if not logged in */
  user: User | null
  /** Current session object with tokens and metadata */
  session: Session | null
  /** True while auth state is being determined on initial load */
  loading: boolean
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  /** Sign up with email and password */
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  /** Sign out current user */
  signOut: () => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Custom hook to access authentication context.
 * Must be used within an AuthProvider component.
 * 
 * @returns Auth context with user session and authentication functions
 * @throws Error if used outside of AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * Authentication provider component that manages user session state.
 * Wraps the app to provide auth context to all child components.
 * Handles session persistence, auto-refresh, and auth state changes.
 * 
 * @param props - Provider props with children to wrap
 * @returns JSX provider element with auth context
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClientSupabase()

  useEffect(() => {
    // Get initial session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Optionally handle specific auth events
        if (event === 'SIGNED_OUT') {
          // Clear any client-side cache or state
          setUser(null)
          setSession(null)
        }
      }
    )

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  /**
   * Authenticate user with email and password.
   * 
   * @param email - User email address
   * @param password - User password
   * @returns Promise with auth error if sign-in fails
   */
  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    setLoading(false)
    return { error }
  }

  /**
   * Register new user with email and password.
   * 
   * @param email - New user email address
   * @param password - New user password
   * @returns Promise with auth error if sign-up fails
   */
  const signUp = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password
    })
    setLoading(false)
    return { error }
  }

  /**
   * Sign out current authenticated user.
   * Clears session and redirects to public pages.
   * 
   * @returns Promise with auth error if sign-out fails
   */
  const signOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    setLoading(false)
    return { error }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}