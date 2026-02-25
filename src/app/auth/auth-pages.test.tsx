/**
 * Integration test suite for authentication pages.
 * Tests form rendering, user interactions, and auth flow integration.
 * Verifies signup, login, and callback page functionality.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SignupPage from './signup/page'
import LoginPage from './login/page'
import CallbackPage from './callback/page'
import { AuthProvider } from '@/lib/auth/auth-context'
import { supabase } from '@/lib/supabase/client'

/**
 * Helper function to render auth pages with AuthProvider context.
 * Ensures pages have access to authentication state and methods.
 */
function renderWithAuthProvider(component: React.ReactElement) {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  )
}

describe('Auth Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('auth pages should render and handle form submissions', () => {
    describe('Signup Page', () => {
      it('should render signup form with all required fields', () => {
        renderWithAuthProvider(<SignupPage />)
        
        expect(screen.getByText('Create your account')).toBeInTheDocument()
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
        expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
      })

      it('should handle form submission with valid data', async () => {
        const user = userEvent.setup()
        const mockSignUpResult = { error: null }
        vi.mocked(supabase.auth.signUp).mockResolvedValue(mockSignUpResult)
        
        renderWithAuthProvider(<SignupPage />)
        
        // Fill out form
        await user.type(screen.getByLabelText(/full name/i), 'Test User')
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
        await user.type(screen.getByLabelText(/password/i), 'password123')
        
        // Submit form
        await user.click(screen.getByRole('button', { name: /create account/i }))
        
        await waitFor(() => {
          expect(supabase.auth.signUp).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
            options: {
              data: { full_name: 'Test User' },
              emailRedirectTo: expect.stringContaining('/auth/callback')
            }
          })
        })
      })

      it('should display validation errors for invalid input', async () => {
        const user = userEvent.setup()
        renderWithAuthProvider(<SignupPage />)
        
        // Submit form without required fields
        await user.click(screen.getByRole('button', { name: /create account/i }))
        
        await waitFor(() => {
          expect(screen.getByText('Email and password are required')).toBeInTheDocument()
        })
      })

      it('should display auth errors from Supabase', async () => {
        const user = userEvent.setup()
        const mockError = { message: 'User already registered' }
        vi.mocked(supabase.auth.signUp).mockResolvedValue({ error: mockError })
        
        renderWithAuthProvider(<SignupPage />)
        
        await user.type(screen.getByLabelText(/email address/i), 'existing@example.com')
        await user.type(screen.getByLabelText(/password/i), 'password123')
        await user.click(screen.getByRole('button', { name: /create account/i }))
        
        await waitFor(() => {
          expect(screen.getByText(/account with this email already exists/i)).toBeInTheDocument()
        })
      })

      it('should show success state after successful signup', async () => {
        const user = userEvent.setup()
        const mockSignUpResult = { error: null }
        vi.mocked(supabase.auth.signUp).mockResolvedValue(mockSignUpResult)
        
        renderWithAuthProvider(<SignupPage />)
        
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
        await user.type(screen.getByLabelText(/password/i), 'password123')
        await user.click(screen.getByRole('button', { name: /create account/i }))
        
        await waitFor(() => {
          expect(screen.getByText('Check your email')).toBeInTheDocument()
          expect(screen.getByText('test@example.com')).toBeInTheDocument()
        })
      })
    })

    describe('Login Page', () => {
      it('should render login form with required fields', () => {
        renderWithAuthProvider(<LoginPage />)
        
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
        expect(screen.getByText(/don't have an account/i)).toBeInTheDocument()
      })

      it('should handle form submission with valid credentials', async () => {
        const user = userEvent.setup()
        const mockSignInResult = { error: null }
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(mockSignInResult)
        
        renderWithAuthProvider(<LoginPage />)
        
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
        await user.type(screen.getByLabelText(/password/i), 'password123')
        await user.click(screen.getByRole('button', { name: /sign in/i }))
        
        await waitFor(() => {
          expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      })

      it('should display validation errors for missing fields', async () => {
        const user = userEvent.setup()
        renderWithAuthProvider(<LoginPage />)
        
        await user.click(screen.getByRole('button', { name: /sign in/i }))
        
        await waitFor(() => {
          expect(screen.getByText('Email and password are required')).toBeInTheDocument()
        })
      })

      it('should display auth errors from Supabase', async () => {
        const user = userEvent.setup()
        const mockError = { message: 'Invalid login credentials' }
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ error: mockError })
        
        renderWithAuthProvider(<LoginPage />)
        
        await user.type(screen.getByLabelText(/email address/i), 'wrong@example.com')
        await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
        await user.click(screen.getByRole('button', { name: /sign in/i }))
        
        await waitFor(() => {
          expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
        })
      })

      it('should show loading state during authentication', async () => {
        const user = userEvent.setup()
        // Create a promise that doesn't resolve immediately
        let resolveSignIn: (value: any) => void
        const signInPromise = new Promise(resolve => { resolveSignIn = resolve })
        vi.mocked(supabase.auth.signInWithPassword).mockReturnValue(signInPromise)
        
        renderWithAuthProvider(<LoginPage />)
        
        await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
        await user.type(screen.getByLabelText(/password/i), 'password123')
        await user.click(screen.getByRole('button', { name: /sign in/i }))
        
        // Check loading state
        expect(screen.getByText('Signing In...')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
        
        // Resolve the promise
        resolveSignIn!({ error: null })
      })
    })

    describe('Callback Page', () => {
      it('should render loading state initially', () => {
        renderWithAuthProvider(<CallbackPage />)
        
        expect(screen.getByText('Completing Sign In')).toBeInTheDocument()
        expect(screen.getByText(/please wait while we verify/i)).toBeInTheDocument()
      })

      it('should handle successful auth callback with code', async () => {
        const mockSession = { 
          access_token: 'mock-token',
          user: { id: 'user-123', email: 'test@example.com' }
        }
        vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
          data: { session: mockSession },
          error: null
        })
        
        // Mock URL search params
        const mockSearchParams = new URLSearchParams('code=auth-code&next=%2Fdashboard')
        vi.mocked(require('next/navigation').useSearchParams).mockReturnValue(mockSearchParams)
        
        renderWithAuthProvider(<CallbackPage />)
        
        await waitFor(() => {
          expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('auth-code')
        })
      })

      it('should handle auth callback errors', async () => {
        const mockError = { message: 'Invalid auth code' }
        vi.mocked(supabase.auth.exchangeCodeForSession).mockResolvedValue({
          data: { session: null },
          error: mockError
        })
        
        const mockSearchParams = new URLSearchParams('code=invalid-code')
        vi.mocked(require('next/navigation').useSearchParams).mockReturnValue(mockSearchParams)
        
        renderWithAuthProvider(<CallbackPage />)
        
        await waitFor(() => {
          expect(screen.getByText('Authentication Error')).toBeInTheDocument()
          expect(screen.getByText('Invalid auth code')).toBeInTheDocument()
        })
      })

      it('should handle callback without auth code', async () => {
        vi.mocked(supabase.auth.getSession).mockResolvedValue({
          data: { session: null },
          error: null
        })
        
        const mockSearchParams = new URLSearchParams('')
        vi.mocked(require('next/navigation').useSearchParams).mockReturnValue(mockSearchParams)
        
        renderWithAuthProvider(<CallbackPage />)
        
        await waitFor(() => {
          expect(supabase.auth.getSession).toHaveBeenCalled()
        })
      })
    })
  })
})