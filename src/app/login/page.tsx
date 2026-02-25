/**
 * Login page for FeedbackPulse v2 authentication.
 * Provides email/password sign-in form with validation and error handling.
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isValidEmail } from '@/lib/utils'

interface FormData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

/**
 * Login page component that handles user authentication.
 * Redirects authenticated users to dashboard and provides sign-in form for guests.
 * Supports redirect parameter for post-login navigation.
 * 
 * @returns Login form with email/password fields and error handling
 */
export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { user, signIn, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get redirect URL from query params (for post-login navigation)
  const redirectUrl = searchParams.get('redirect') || '/dashboard'

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push(redirectUrl)
    }
  }, [user, loading, router, redirectUrl])

  /**
   * Validates form data and returns validation errors.
   * Checks email format and password presence.
   * 
   * @param data - Form data to validate
   * @returns Object with field-specific error messages
   */
  const validateForm = (data: FormData): FormErrors => {
    const newErrors: FormErrors = {}
    
    if (!data.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!isValidEmail(data.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!data.password.trim()) {
      newErrors.password = 'Password is required'
    }
    
    return newErrors
  }

  /**
   * Handles form submission and authentication attempt.
   * Validates input, calls Supabase auth, and handles errors.
   * 
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})
    
    // Validate form data
    const validationErrors = validateForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setIsSubmitting(false)
      return
    }
    
    try {
      // Attempt sign in with Supabase
      const { error } = await signIn(formData.email, formData.password)
      
      if (error) {
        // Handle authentication errors
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ general: 'Invalid email or password. Please try again.' })
        } else if (error.message.includes('Email not confirmed')) {
          setErrors({ general: 'Please check your email and click the confirmation link before signing in.' })
        } else {
          setErrors({ general: error.message || 'An unexpected error occurred. Please try again.' })
        }
      } else {
        // Success - redirect happens automatically via useEffect
        router.push(redirectUrl)
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please check your connection and try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Updates form field values and clears related errors.
   * 
   * @param field - Form field name to update
   * @param value - New field value
   */
  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field-specific errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Sign in to FeedbackPulse
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Please enter your credentials
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {errors.general}
            </div>
          )}

          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                error={errors.email}
                disabled={isSubmitting}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                error={errors.password}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Sign in
          </Button>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}