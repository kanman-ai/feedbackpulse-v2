/**
 * Edit Display Name Component Tests
 * 
 * Unit tests for the EditDisplayName component functionality including form validation,
 * submission handling, and user interactions.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock modules
const mockUseAuth = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn().mockReturnValue({ data: null, error: null });
const mockFrom = vi.fn().mockReturnValue({
  update: mockUpdate.mockReturnValue({ eq: mockEq })
});

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => mockUseAuth()
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: mockFrom
  }
}));

vi.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size, variant }: { size?: string; variant?: string }) => (
    <div data-testid="loading-spinner" data-size={size} data-variant={variant}>
      Loading...
    </div>
  )
}));

// Import the component after mocks are set up
const { EditDisplayName } = await import('../../app/profile/components/EditDisplayName');

describe('EditDisplayName Component', () => {
  const mockOnUpdate = vi.fn();
  
  const defaultProps = {
    currentDisplayName: 'John Doe',
    onUpdate: mockOnUpdate
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false
    });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ data: null, error: null });
  });

  it('should render with current display name', () => {
    render(<EditDisplayName {...defaultProps} />);
    
    expect(screen.getByText('Edit Display Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByText('This is how your name will appear to other users.')).toBeInTheDocument();
  });

  it('should show update button as disabled when no changes', () => {
    render(<EditDisplayName {...defaultProps} />);
    
    const updateButton = screen.getByRole('button', { name: 'Update Name' });
    expect(updateButton).toBeDisabled();
  });

  it('should enable update button when changes are made', async () => {
    const user = userEvent.setup();
    render(<EditDisplayName {...defaultProps} />);
    
    const input = screen.getByDisplayValue('John Doe');
    await user.clear(input);
    await user.type(input, 'Jane Doe');
    
    const updateButton = screen.getByRole('button', { name: 'Update Name' });
    expect(updateButton).toBeEnabled();
  });

  it('should show reset button when changes are made', async () => {
    const user = userEvent.setup();
    render(<EditDisplayName {...defaultProps} />);
    
    const input = screen.getByDisplayValue('John Doe');
    await user.clear(input);
    await user.type(input, 'Jane Doe');
    
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('should validate empty display name', async () => {
    const user = userEvent.setup();
    render(<EditDisplayName {...defaultProps} />);
    
    const input = screen.getByDisplayValue('John Doe');
    await user.clear(input);
    
    const form = input.closest('form')!;
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText('Display name cannot be empty')).toBeInTheDocument();
    });
  });

  it('should update display name when form is submitted', async () => {
    const user = userEvent.setup();
    mockEq.mockResolvedValueOnce({ error: null });
    
    render(<EditDisplayName {...defaultProps} />);
    
    const input = screen.getByDisplayValue('John Doe');
    await user.clear(input);
    await user.type(input, 'Jane Smith');
    
    const form = input.closest('form')!;
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('profiles');
    });
    
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        display_name: 'Jane Smith',
        updated_at: expect.any(String)
      });
    });
    
    await waitFor(() => {
      expect(mockEq).toHaveBeenCalledWith('id', 'test-user-id');
    });
    
    await waitFor(() => {
      expect(screen.getByText('Display name updated successfully!')).toBeInTheDocument();
    });
    
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it('should reset form when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<EditDisplayName {...defaultProps} />);
    
    const input = screen.getByDisplayValue('John Doe');
    await user.clear(input);
    await user.type(input, 'Jane Smith');
    
    const resetButton = screen.getByText('Reset');
    await user.click(resetButton);
    
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Reset')).not.toBeInTheDocument();
  });
});