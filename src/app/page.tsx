/**
 * Home page for FeedbackPulse v2.
 * Shows welcome content for authenticated users and auth status.
 * Provides navigation to auth pages for unauthenticated users.
 */
'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth/auth-context'

/**
 * Home Page Component.
 * Displays different content based on user authentication status.
 * Shows user profile and logout option for authenticated users.
 * 
 * @returns JSX element with homepage content
 */
export default function Home() {
  const { user, profile, loading, signOut } = useAuth()

  /**
   * Handles user logout and redirects to login page.
   * Clears auth state and shows confirmation message.
   */
  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-6">FeedbackPulse v2</h1>
      <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl">
        Modern feedback collection and analysis platform
      </p>
      
      {user ? (
        // Authenticated user view
        <div className="text-center space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-800 mb-2">
              Welcome back!
            </h2>
            <p className="text-green-600">
              Signed in as: <span className="font-medium">{user.email}</span>
            </p>
            {profile?.full_name && (
              <p className="text-green-600">
                Name: <span className="font-medium">{profile.full_name}</span>
              </p>
            )}
          </div>
          
          <button
            onClick={handleSignOut}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Sign Out
          </button>
        </div>
      ) : (
        // Unauthenticated user view
        <div className="text-center space-y-6">
          <p className="text-gray-500 mb-6">
            Please sign in or create an account to get started
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign In
            </Link>
            
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center px-6 py-3 border border-indigo-600 text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}
