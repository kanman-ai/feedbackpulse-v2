/**
 * Tests for LoginPage component in FeedbackPulse v2.
 * Validates form behavior, validation, and authentication flow.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import LoginPage from '../page'
import { useAuth } from '@/contexts/auth-context'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: () => ({
    get: jest.fn(() => null)
  })
}))

// Mock auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn()
}))

const mockPush = jest.fn()
const mockSignIn = jest.fn()

/**
 * Default auth context mock for unauthenticated state.
 */
const defaultAuthContext = {
  user: null,
  session: null,
  loading: false,
  signIn: mockSignIn,
  signUp: jest.fn(),
  signOut: jest.fn()
}

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    })
    ;(useAuth as jest.Mock).mockReturnValue(defaultAuthContext)
  })

  it('should render login form', () => {
    render(<LoginPage />)
    
    expect(screen.getByText('Sign in to FeedbackPulse')).toBeInTheDocument()
    expect(screen.getByText('Welcome back! Please enter your credentials')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByText('Sign up here')).toBeInTheDocument()
  })

  it('should redirect authenticated user to dashboard', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      ...defaultAuthContext,
      user: { email: 'test@example.com' },
      loading: false
    })

    render(<LoginPage />)

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should show loading state while auth is being determined', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      ...defaultAuthContext,
      loading: true
    })

    render(<LoginPage />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Sign in to FeedbackPulse')).not.toBeInTheDocument()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    await user.type(emailInput, 'invalid-email')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: 'Sign in' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })
  })

  it('should handle successful sign in', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should handle invalid credentials error', async () => {
    mockSignIn.mockResolvedValue({ 
      error: { message: 'Invalid login credentials' } 
    })
    const user = userEvent.setup()
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password. Please try again.')).toBeInTheDocument()
    })
  })

  it('should handle email not confirmed error', async () => {
    mockSignIn.mockResolvedValue({ 
      error: { message: 'Email not confirmed' } 
    })
    const user = userEvent.setup()
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please check your email and click the confirmation link before signing in.')).toBeInTheDocument()
    })
  })

  it('should show loading state during sign in', async () => {
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    const user = userEvent.setup()
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should clear field errors when user starts typing', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email address')
    const submitButton = screen.getByRole('button', { name: 'Sign in' })

    // Trigger validation error
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })

    // Start typing - error should clear
    await user.type(emailInput, 'test')
    
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument()
  })
})