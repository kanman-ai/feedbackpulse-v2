/**
 * Authentication Context Provider for FeedbackPulse v2.
 * Manages user session state, login/logout functionality, and provides
 * auth state throughout the application using React Context.
 */
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../supabase/client'
import { Profile } from '../supabase/types'

/**
 * Authentication context value interface.
 * Provides user session state and authentication methods to consuming components.
 */
interface AuthContextType {
  /** Current authenticated user from Supabase auth */
  user: User | null
  /** Current user session with JWT tokens */
  session: Session | null
  /** User profile data from profiles table */
  profile: Profile | null
  /** Whether auth state is still loading */
  loading: boolean
  /** Sign up a new user with email and password */
  signUp: (email: string, password: string, metadata?: { full_name?: string }) => Promise<{ error: AuthError | null }>
  /** Sign in existing user with email and password */
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  /** Sign out current user and clear session */
  signOut: () => Promise<{ error: AuthError | null }>
}

/**
 * React context for authentication state management.
 * Provides auth state and methods to all child components.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Props for the AuthProvider component.
 */
interface AuthProviderProps {
  /** Child components that will have access to auth context */
  children: ReactNode
}

/**
 * Authentication Provider Component.
 * Wraps the application to provide auth state and methods via React Context.
 * Handles session persistence using localStorage and Supabase session management.
 * 
 * @param props - Component props containing child elements
 * @returns JSX element providing auth context to children
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * Fetches user profile data from the profiles table.
   * Called after successful authentication to get additional user metadata.
   * 
   * @param userId - UUID of the authenticated user
   * @returns Promise that resolves when profile is fetched and state is updated
   */
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return
      }

      setProfile(data)
      
      // Store profile in localStorage for persistence across sessions
      if (data) {
        localStorage.setItem('feedbackpulse_profile', JSON.stringify(data))
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error)
    }
  }

  /**
   * Handles auth state changes from Supabase.
   * Updates user, session, and profile state when auth state changes.
   * Manages localStorage persistence for offline access.
   * 
   * @param session - New session state from Supabase auth
   */
  const handleAuthStateChange = async (session: Session | null) => {
    setSession(session)
    setUser(session?.user ?? null)

    if (session?.user) {
      // User is signed in, fetch their profile
      await fetchUserProfile(session.user.id)
      
      // Store session in localStorage for persistence
      localStorage.setItem('feedbackpulse_session', JSON.stringify(session))
    } else {
      // User is signed out, clear all state
      setProfile(null)
      
      // Clear localStorage
      localStorage.removeItem('feedbackpulse_session')
      localStorage.removeItem('feedbackpulse_profile')
    }

    setLoading(false)
  }

  /**
   * Signs up a new user with email and password.
   * Creates user in Supabase auth and triggers profile creation via database trigger.
   * 
   * @param email - User's email address
   * @param password - User's password (min 6 characters)
   * @param metadata - Optional user metadata like full_name
   * @returns Promise with auth result containing error if signup failed
   */
  const signUp = async (email: string, password: string, metadata?: { full_name?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    return { error }
  }

  /**
   * Signs in an existing user with email and password.
   * Establishes authenticated session and fetches user profile.
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with auth result containing error if signin failed
   */
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    return { error }
  }

  /**
   * Signs out the current user.
   * Clears session, profile state, and localStorage data.
   * 
   * @returns Promise with result containing error if signout failed
   */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    
    // Clear state regardless of error to handle edge cases
    setUser(null)
    setSession(null)
    setProfile(null)
    localStorage.removeItem('feedbackpulse_session')
    localStorage.removeItem('feedbackpulse_profile')

    return { error }
  }

  // Initialize auth state and set up auth listener
  useEffect(() => {
    // Get initial session from Supabase
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        // If no session from Supabase, try localStorage as fallback
        if (!session) {
          const storedSession = localStorage.getItem('feedbackpulse_session')
          const storedProfile = localStorage.getItem('feedbackpulse_profile')
          
          if (storedProfile) {
            setProfile(JSON.parse(storedProfile))
          }
        }

        await handleAuthStateChange(session)
      } catch (error) {
        console.error('Error initializing auth:', error)
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        await handleAuthStateChange(session)
      }
    )

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const contextValue: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access authentication context.
 * Must be used within an AuthProvider component tree.
 * 
 * @returns Authentication context value with user state and auth methods
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}