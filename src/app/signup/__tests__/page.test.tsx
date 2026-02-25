/**
 * Tests for SignUpPage component in FeedbackPulse v2.
 * Validates form behavior, password validation, and registration flow.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import SignUpPage from '../page'
import { useAuth } from '@/contexts/auth-context'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

// Mock auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn()
}))

const mockPush = vi.fn()
const mockSignUp = vi.fn()

/**
 * Default auth context mock for unauthenticated state.
 */
const defaultAuthContext = {
  user: null,
  session: null,
  loading: false,
  signIn: vi.fn(),
  signUp: mockSignUp,
  signOut: vi.fn()
}

describe('SignUpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({
      push: mockPush
    })
    ;(useAuth as jest.Mock).mockReturnValue(defaultAuthContext)
  })

  it('should render sign up form', () => {
    render(<SignUpPage />)
    
    expect(screen.getByText('Create your FeedbackPulse account')).toBeInTheDocument()
    expect(screen.getByText('Get started with your feedback management dashboard')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
    expect(screen.getByText('Sign in here')).toBeInTheDocument()
  })

  it('should redirect authenticated user to dashboard', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      ...defaultAuthContext,
      user: { email: 'test@example.com' },
      loading: false
    })

    render(<SignUpPage />)

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should show loading state while auth is being determined', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      ...defaultAuthContext,
      loading: true
    })

    render(<SignUpPage />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Create your FeedbackPulse account')).not.toBeInTheDocument()
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)

    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm password')
    const submitButton = screen.getByRole('button', { name: 'Create account' })

    await user.type(emailInput, 'invalid-email')
    await user.type(passwordInput, 'Password123!')
    await user.type(confirmPasswordInput, 'Password123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('should validate password strength', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)

    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm password')
    const submitButton = screen.getByRole('button', { name: 'Create account' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'weak')
    await user.type(confirmPasswordInput, 'weak')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long')).toBeInTheDocument()
    })
  })

  it('should validate password confirmation match', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)

    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm password')
    const submitButton = screen.getByRole('button', { name: 'Create account' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123!')
    await user.type(confirmPasswordInput, 'Different123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)

    const submitButton = screen.getByRole('button', { name: 'Create account' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument()
    })
  })

  it('should handle successful registration', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    render(<SignUpPage />)

    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm password')
    const submitButton = screen.getByRole('button', { name: 'Create account' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123!')
    await user.type(confirmPasswordInput, 'Password123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'Password123!')
      expect(screen.getByText('Account created!')).toBeInTheDocument()
      expect(screen.getByText('Please check your email and click the confirmation link to activate your account.')).toBeInTheDocument()
    })
  })

  it('should handle user already exists error', async () => {
    mockSignUp.mockResolvedValue({ 
      error: { message: 'User already registered' } 
    })
    const user = userEvent.setup()
    render(<SignUpPage />)

    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm password')
    const submitButton = screen.getByRole('button', { name: 'Create account' })

    await user.type(emailInput, 'existing@example.com')
    await user.type(passwordInput, 'Password123!')
    await user.type(confirmPasswordInput, 'Password123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('An account with this email already exists. Please sign in instead.')).toBeInTheDocument()
    })
  })

  it('should show loading state during registration', async () => {
    mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    const user = userEvent.setup()
    render(<SignUpPage />)

    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm password')
    const submitButton = screen.getByRole('button', { name: 'Create account' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123!')
    await user.type(confirmPasswordInput, 'Password123!')
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should clear field errors when user starts typing', async () => {
    const user = userEvent.setup()
    render(<SignUpPage />)

    const emailInput = screen.getByLabelText('Email address')
    const submitButton = screen.getByRole('button', { name: 'Create account' })

    // Trigger validation error
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })

    // Start typing - error should clear
    await user.type(emailInput, 'test')
    
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument()
  })

  it('should show success message with sign in link', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    render(<SignUpPage />)

    const emailInput = screen.getByLabelText('Email address')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm password')
    const submitButton = screen.getByRole('button', { name: 'Create account' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123!')
    await user.type(confirmPasswordInput, 'Password123!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Account created!')).toBeInTheDocument()
    })

    const signInLink = screen.getByText('Go to sign in')
    expect(signInLink).toBeInTheDocument()
    expect(signInLink.closest('a')).toHaveAttribute('href', '/login')
  })
})