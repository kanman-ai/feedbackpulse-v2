/**
 * Password Change Component Tests
 * 
 * Unit tests for the PasswordChange component including password validation,
 * form submission, and security requirements.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Supabase auth
const mockUpdateUser = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      updateUser: mockUpdateUser
    }
  }
}));

vi.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size, variant }: { size?: string; variant?: string }) => (
    <div data-testid="loading-spinner" data-size={size} data-variant={variant}>
      Loading...
    </div>
  )
}));

// Import the component after mocks
const { PasswordChange } = await import('../../app/profile/components/PasswordChange');

describe('PasswordChange Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render password change form', () => {
    render(<PasswordChange />);
    
    expect(screen.getByText('Change Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByText('Show passwords')).toBeInTheDocument();
  });

  it('should show password requirements', () => {
    render(<PasswordChange />);
    
    expect(screen.getByText('Password Requirements:')).toBeInTheDocument();
    expect(screen.getByText('• At least 8 characters long')).toBeInTheDocument();
    expect(screen.getByText('• Contains uppercase and lowercase letters')).toBeInTheDocument();
    expect(screen.getByText('• Contains at least one number')).toBeInTheDocument();
    expect(screen.getByText('• Contains at least one special character')).toBeInTheDocument();
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(<PasswordChange />);
    
    const currentPasswordInput = screen.getByLabelText('Current Password');
    const showPasswordsCheckbox = screen.getByLabelText('Show passwords');
    
    // Initially passwords should be hidden
    expect(currentPasswordInput).toHaveAttribute('type', 'password');
    
    // Toggle to show passwords
    await user.click(showPasswordsCheckbox);
    expect(currentPasswordInput).toHaveAttribute('type', 'text');
    
    // Toggle back to hide passwords
    await user.click(showPasswordsCheckbox);
    expect(currentPasswordInput).toHaveAttribute('type', 'password');
  });

  it('should validate password requirements', async () => {
    const user = userEvent.setup();
    render(<PasswordChange />);
    
    const newPasswordInput = screen.getByLabelText('New Password');
    
    // Test too short password
    await user.type(newPasswordInput, 'abc123');
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    
    await user.clear(newPasswordInput);
    
    // Test password without uppercase
    await user.type(newPasswordInput, 'abc123!@');
    expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument();
  });

  it('should validate password confirmation', async () => {
    const user = userEvent.setup();
    render(<PasswordChange />);
    
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    
    await user.type(newPasswordInput, 'ValidPass123!');
    await user.type(confirmPasswordInput, 'DifferentPass123!');
    
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('should validate password requirements and update password', async () => {
    const user = userEvent.setup();
    mockUpdateUser.mockResolvedValueOnce({ error: null });
    
    render(<PasswordChange />);
    
    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    
    // Fill form with valid data
    await user.type(currentPasswordInput, 'OldPassword123!');
    await user.type(newPasswordInput, 'NewPassword123!');
    await user.type(confirmPasswordInput, 'NewPassword123!');
    
    // Submit form
    const form = currentPasswordInput.closest('form')!;
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: 'NewPassword123!'
      });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Password updated successfully!')).toBeInTheDocument();
    });
  });

  it('should disable submit button when form is invalid', () => {
    render(<PasswordChange />);
    
    const updateButton = screen.getByRole('button', { name: 'Update Password' });
    expect(updateButton).toBeDisabled();
  });
});