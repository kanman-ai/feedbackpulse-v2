/**
 * Sign-up page for FeedbackPulse v2 user registration.
 * Provides email/password registration form with validation and confirmation handling.
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isValidEmail, validatePassword } from '@/lib/utils'

interface FormData {
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

/**
 * Sign-up page component that handles new user registration.
 * Redirects authenticated users to dashboard and provides registration form for guests.
 * Includes password strength validation and confirmation matching.
 * 
 * @returns Registration form with email/password fields and validation
 */
export default function SignUpPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  
  const { user, signUp, loading } = useAuth()
  const router = useRouter()

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  /**
   * Validates form data and returns validation errors.
   * Checks email format, password strength, and confirmation match.
   * 
   * @param data - Form data to validate
   * @returns Object with field-specific error messages
   */
  const validateForm = (data: FormData): FormErrors => {
    const newErrors: FormErrors = {}
    
    // Email validation
    if (!data.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!isValidEmail(data.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Password validation
    if (!data.password.trim()) {
      newErrors.password = 'Password is required'
    } else {
      const passwordValidation = validatePassword(data.password)
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0] // Show first error
      }
    }
    
    // Confirm password validation
    if (!data.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    return newErrors
  }

  /**
   * Handles form submission and registration attempt.
   * Validates input, calls Supabase auth, and handles success/error states.
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
      // Attempt sign up with Supabase
      const { error } = await signUp(formData.email, formData.password)
      
      if (error) {
        // Handle registration errors
        if (error.message.includes('User already registered')) {
          setErrors({ 
            email: 'An account with this email already exists. Please sign in instead.' 
          })
        } else if (error.message.includes('Password should be at least')) {
          setErrors({ password: error.message })
        } else {
          setErrors({ general: error.message || 'An unexpected error occurred. Please try again.' })
        }
      } else {
        // Registration successful - show confirmation message
        setRegistrationSuccess(true)
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

  // Show success message after registration
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Account created!</h1>
            <p className="mt-2 text-sm text-gray-600">
              Please check your email and click the confirmation link to activate your account.
            </p>
            <div className="mt-6">
              <Link 
                href="/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Go to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Create your FeedbackPulse account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Get started with your feedback management dashboard
          </p>
        </div>

        {/* Registration Form */}
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
                autoComplete="new-password"
                required
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                error={errors.password}
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
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
            Create account
          </Button>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}