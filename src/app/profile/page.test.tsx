/**
 * Profile Page Component Tests
 * 
 * Integration tests for the profile page functionality including rendering,
 * user authentication checks, and component interactions.
 */

import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock modules
const mockUseAuth = vi.fn();

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => mockUseAuth()
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'test-user-id', display_name: 'Test User' },
            error: null
          }))
        }))
      }))
    }))
  }
}));

vi.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  )
}));

// Import after mocks
const ProfilePage = (await import('./page')).default;

describe('Profile Page', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    email_confirmed_at: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render profile page with user information', async () => {
    // Mock authenticated user
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false
    });

    render(<ProfilePage />);

    // Check for page title
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    
    // Check for page description
    expect(screen.getByText(/Manage your account information/)).toBeInTheDocument();
    
    // Check for loading spinner initially (due to Suspense)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should show loading spinner while data is being fetched', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: true
    });

    render(<ProfilePage />);
    
    // Should show loading spinner
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should handle unauthenticated state', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false
    });

    render(<ProfilePage />);
    
    // Page should still render but content will handle auth check
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
  });

  it('should render with proper container styling', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false
    });

    const { container } = render(<ProfilePage />);
    
    // Check for proper container classes
    const mainContainer = container.querySelector('.container.mx-auto.py-6.px-4.max-w-4xl');
    expect(mainContainer).toBeInTheDocument();
  });

  it('should have proper page structure', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false
    });

    render(<ProfilePage />);
    
    // Check for proper heading hierarchy
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Profile Settings');
    
    // Check for description paragraph
    expect(screen.getByText(/Manage your account information, security settings/)).toBeInTheDocument();
  });
});