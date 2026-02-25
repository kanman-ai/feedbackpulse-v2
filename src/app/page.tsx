/**
 * Home page for FeedbackPulse v2 application.
 * Landing page that provides navigation to authentication or dashboard based on user state.
 */
'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'

/**
 * Home page component that adapts based on user authentication status.
 * Shows welcome message with sign-in/up links for guests, or dashboard link for authenticated users.
 * 
 * @returns Adaptive home page with authentication-aware navigation
 */
export default function HomePage() {
  const { user, loading } = useAuth()

  // Show loading state while determining authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Welcome to{' '}
            <span className="text-blue-600">FeedbackPulse</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Lightweight SaaS platform for collecting, analyzing, and acting on user feedback.
            Build better products with insights from your users.
          </p>
        </div>

        {/* Authentication-aware Content */}
        <div className="mt-10 flex justify-center">
          {user ? (
            // Authenticated user content
            <div className="text-center">
              <p className="text-lg text-gray-700 mb-6">
                Welcome back, <span className="font-semibold">{user.email}</span>!
              </p>
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-3">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          ) : (
            // Guest user content
            <div className="text-center space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-3">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-3">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Why Choose FeedbackPulse?
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to collect and analyze user feedback effectively
            </p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Easy Surveys</h3>
              <p className="mt-2 text-gray-600">
                Create customizable surveys and forms to gather feedback from your users quickly and efficiently.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Smart Analytics</h3>
              <p className="mt-2 text-gray-600">
                Get actionable insights from your feedback data with powerful analytics and reporting tools.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Real-time Updates</h3>
              <p className="mt-2 text-gray-600">
                Monitor feedback as it comes in with real-time notifications and live dashboard updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}