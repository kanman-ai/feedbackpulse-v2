/**
 * Authentication callback page for FeedbackPulse v2.
 * Handles Supabase auth redirects after email confirmation or social logins.
 * Exchanges auth code for session and redirects to appropriate destination.
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

/**
 * Auth Callback Page Component.
 * Processes authentication callbacks from Supabase and handles post-auth routing.
 * Shows loading state while processing and error state if callback fails.
 * 
 * @returns JSX element with callback processing UI
 */
export default function AuthCallbackPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  /**
   * Processes the authentication callback from Supabase.
   * Exchanges authorization code for session and handles routing.
   */
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the auth code from URL params
        const code = searchParams.get('code')
        const next = searchParams.get('next') || '/'
        
        if (code) {
          // Exchange code for session using Supabase auth
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('Auth callback error:', error)
            setError(error.message)
            setLoading(false)
            return
          }
          
          if (data.session) {
            // Successfully authenticated - redirect to intended destination
            console.log('Auth callback successful:', data.session.user.email)
            router.push(decodeURIComponent(next))
          } else {
            setError('No session created from auth callback')
            setLoading(false)
          }
        } else {
          // No code present - might be email confirmation link
          const { data, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Session check error:', error)
            setError('Failed to verify authentication status')
            setLoading(false)
            return
          }
          
          if (data.session) {
            // User is already authenticated
            router.push('/')
          } else {
            // No session and no code - redirect to login
            router.push('/auth/login?message=Please sign in to continue')
          }
        }
      } catch (error) {
        console.error('Auth callback processing error:', error)
        setError('An unexpected error occurred during authentication')
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  /**
   * Handles retry when callback processing fails.
   * Redirects user back to login page to attempt authentication again.
   */
  const handleRetry = () => {
    router.push('/auth/login?message=Authentication failed, please try again')
  }

  // Show error state if callback processing failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Authentication Error
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
            <div className="mt-6">
              <button
                onClick={handleRetry}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try Again
              </button>
            </div>
            <div className="mt-4">
              <a
                href="/auth/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Return to Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while processing callback
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Completing Sign In
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we verify your authentication...
          </p>
        </div>
      </div>
    </div>
  )
}