/**
 * Test suite for Auth Context Provider.
 * Verifies authentication state management, session handling,
 * and auth method functionality.
 */
import { render, screen, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from './auth-context'
import { supabase } from '@/lib/supabase/client'

/**
 * Test component to access and display auth context state.
 * Used to verify context provider functionality in tests.
 */
function TestComponent() {
  const { user, session, profile, loading, signUp, signIn, signOut } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="user">{user?.email || 'no-user'}</div>
      <div data-testid="session">{session?.access_token ? 'has-session' : 'no-session'}</div>
      <div data-testid="profile">{profile?.display_name || 'no-profile'}</div>
      <button onClick={() => signUp('test@example.com', 'password123')}>signup</button>
      <button onClick={() => signIn('test@example.com', 'password123')}>signin</button>
      <button onClick={signOut}>signout</button>
    </div>
  )
}

/**
 * Helper function to render AuthProvider with test component.
 * Provides consistent setup for auth context tests.
 */
function renderAuthProvider() {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  )
}

describe('Auth Context Provider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('AuthProvider should manage user state correctly', () => {
    it('should initialize with loading state', async () => {
      renderAuthProvider()
      
      expect(screen.getByTestId('loading')).toHaveTextContent('loading')
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
      expect(screen.getByTestId('session')).toHaveTextContent('no-session')
    })

    it('should set loaded state after initialization', async () => {
      renderAuthProvider()
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })
    })

    it('should handle user session when present', async () => {
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'refresh-123',
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-123', email: 'test@example.com' }
      }
      
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user' as const,
        avatar_url: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }

      // Mock Supabase responses
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as any },
        error: null
      })
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
      } as any)

      renderAuthProvider()

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
        expect(screen.getByTestId('session')).toHaveTextContent('has-session')
        expect(screen.getByTestId('profile')).toHaveTextContent('Test User')
      })
    })

    it('should handle signup method correctly', async () => {
      const mockSignUpResult = {
        data: {
          user: { id: 'user-123', email: 'test@example.com' } as any,
          session: {
            access_token: 'token-123',
            refresh_token: 'refresh-123',
            expires_in: 3600,
            token_type: 'bearer',
            user: { id: 'user-123', email: 'test@example.com' }
          } as any
        },
        error: null
      }
      vi.mocked(supabase.auth.signUp).mockResolvedValue(mockSignUpResult)

      renderAuthProvider()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      const signupButton = screen.getByText('signup')
      await act(async () => {
        signupButton.click()
      })

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: undefined,
          emailRedirectTo: expect.stringContaining('/auth/callback')
        }
      })
    })

    it('should handle signin method correctly', async () => {
      const mockSignInResult = {
        data: {
          user: { id: 'user-123', email: 'test@example.com' } as any,
          session: {
            access_token: 'token-123',
            refresh_token: 'refresh-123',
            expires_in: 3600,
            token_type: 'bearer',
            user: { id: 'user-123', email: 'test@example.com' }
          } as any
        },
        error: null
      }
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(mockSignInResult)

      renderAuthProvider()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      const signinButton = screen.getByText('signin')
      await act(async () => {
        signinButton.click()
      })

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle signout method correctly', async () => {
      const mockSignOutResult = { error: null }
      vi.mocked(supabase.auth.signOut).mockResolvedValue(mockSignOutResult)

      renderAuthProvider()

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      const signoutButton = screen.getByText('signout')
      await act(async () => {
        signoutButton.click()
      })

      expect(supabase.auth.signOut).toHaveBeenCalled()
      expect(localStorage.removeItem).toHaveBeenCalledWith('feedbackpulse_session')
      expect(localStorage.removeItem).toHaveBeenCalledWith('feedbackpulse_profile')
    })

    it('should persist session data to localStorage', async () => {
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'refresh-123',
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'user-123', email: 'test@example.com' }
      }
      
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user' as const,
        avatar_url: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as any },
        error: null
      })
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
      } as any)

      renderAuthProvider()

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'feedbackpulse_session',
          JSON.stringify(mockSession)
        )
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'feedbackpulse_profile',
          JSON.stringify(mockProfile)
        )
      })
    })
  })

  it('should throw error when useAuth is used outside provider', () => {
    // Capture console.error to prevent test output pollution
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')
    
    consoleSpy.mockRestore()
  })
})