/**
 * Dashboard page for FeedbackPulse v2 authenticated users.
 * Displays user information and provides access to feedback management features.
 * Protected route that requires authentication.
 */
'use client'

import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

/**
 * Main dashboard component for authenticated users.
 * Shows user profile information and provides logout functionality.
 * Serves as the landing page after successful authentication.
 * 
 * @returns Dashboard interface with user info and navigation
 */
export default function DashboardPage() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()

  /**
   * Handles user logout and redirects to login page.
   * Shows loading state during sign-out process.
   */
  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        console.error('Sign out error:', error.message)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // This should not happen due to middleware protection, but handle gracefully
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access denied</h1>
          <p className="mt-2 text-gray-600">Please sign in to access the dashboard.</p>
          <Button 
            className="mt-4"
            onClick={() => router.push('/login')}
          >
            Go to sign in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                FeedbackPulse Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {user.email}!
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Account Information
            </h2>
            
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">User ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{user.id}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Sign In</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.last_sign_in_at 
                    ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Never'
                  }
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Feature Placeholder */}
        <div className="mt-8 bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Feedback Management
            </h2>
            <p className="text-gray-600 mb-4">
              This is where your feedback management features will be implemented.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Surveys</h3>
                <p className="text-sm text-gray-600">Create and manage feedback surveys</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Responses</h3>
                <p className="text-sm text-gray-600">View and analyze survey responses</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600">Get insights from your feedback data</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}