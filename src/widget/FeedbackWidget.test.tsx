/**
 * FeedbackPulse v2 - FeedbackWidget Component Tests
 * 
 * Integration tests for the FeedbackWidget React component.
 * Tests modal rendering, user interactions, form validation, and API submission.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { FeedbackWidget } from './FeedbackWidget';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('FeedbackWidget Component', () => {
  const defaultProps = {
    projectId: 'test-project-123',
    apiUrl: 'https://test.example.com/api/feedback'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        message: 'Feedback submitted successfully',
        feedback_id: 'feedback-123'
      })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render feedback modal', () => {
    render(<FeedbackWidget {...defaultProps} />);
    
    // Check that the floating button is rendered
    const floatingButton = screen.getByRole('button', { name: /feedback/i });
    expect(floatingButton).toBeInTheDocument();
  });

  it('should open modal when floating button is clicked', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget {...defaultProps} />);
    
    // Click the floating button
    const floatingButton = screen.getByRole('button', { name: /feedback/i });
    await user.click(floatingButton);
    
    // Check that modal elements are visible
    expect(screen.getByText(/rate your experience/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /message/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('should render star rating component', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget {...defaultProps} />);
    
    // Open modal
    const floatingButton = screen.getByRole('button', { name: /feedback/i });
    await user.click(floatingButton);
    
    // Check for star rating elements
    const stars = screen.getAllByRole('button', { name: /star/i });
    expect(stars).toHaveLength(5);
  });

  it('should update rating when star is clicked', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget {...defaultProps} />);
    
    // Open modal
    const floatingButton = screen.getByRole('button', { name: /feedback/i });
    await user.click(floatingButton);
    
    // Click the 4th star
    const fourthStar = screen.getByRole('button', { name: /4 stars/i });
    await user.click(fourthStar);
    
    // Verify the rating is selected (implementation may vary based on actual component)
    expect(fourthStar).toHaveAttribute('aria-pressed', 'true');
  });

  it('should validate required fields before submission', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget {...defaultProps} />);
    
    // Open modal
    const floatingButton = screen.getByRole('button', { name: /feedback/i });
    await user.click(floatingButton);
    
    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);
    
    // Check for validation messages
    expect(screen.getByText(/rating is required/i)).toBeInTheDocument();
    expect(screen.getByText(/comment is required/i)).toBeInTheDocument();
  });

  it('should submit feedback with valid data', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget {...defaultProps} />);
    
    // Open modal
    const floatingButton = screen.getByRole('button', { name: /feedback/i });
    await user.click(floatingButton);
    
    // Fill out the form
    const fourthStar = screen.getByRole('button', { name: /4 stars/i });
    await user.click(fourthStar);
    
    const messageInput = screen.getByRole('textbox', { name: /message/i });
    await user.type(messageInput, 'Great product, very helpful!');
    
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    await user.type(emailInput, 'user@example.com');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);
    
    // Verify API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        defaultProps.apiUrl,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            project_id: defaultProps.projectId,
            rating: 4,
            comment: 'Great product, very helpful!',
            email: 'user@example.com',
            source: 'widget'
          })
        })
      );
    });
  });

  it('should show success message after submission', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget {...defaultProps} />);
    
    // Open modal and fill form
    const floatingButton = screen.getByRole('button', { name: /feedback/i });
    await user.click(floatingButton);
    
    const fourthStar = screen.getByRole('button', { name: /4 stars/i });
    await user.click(fourthStar);
    
    const messageInput = screen.getByRole('textbox', { name: /message/i });
    await user.type(messageInput, 'Great product!');
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/thank you for your feedback/i)).toBeInTheDocument();
    });
  });

  it('should clear form after successful submission', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget {...defaultProps} />);
    
    // Open modal and fill form
    const floatingButton = screen.getByRole('button', { name: /feedback/i });
    await user.click(floatingButton);
    
    const fourthStar = screen.getByRole('button', { name: /4 stars/i });
    await user.click(fourthStar);
    
    const messageInput = screen.getByRole('textbox', { name: /message/i });
    await user.type(messageInput, 'Great product!');
    
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    await user.type(emailInput, 'user@example.com');
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);
    
    // Wait for form to clear (after success)
    await waitFor(() => {
      expect(messageInput).toHaveValue('');
      expect(emailInput).toHaveValue('');
    });
  });

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        error: 'Server error occurred'
      })
    });
    
    render(<FeedbackWidget {...defaultProps} />);
    
    // Open modal and fill form
    const floatingButton = screen.getByRole('button', { name: /feedback/i });
    await user.click(floatingButton);
    
    const fourthStar = screen.getByRole('button', { name: /4 stars/i });
    await user.click(fourthStar);
    
    const messageInput = screen.getByRole('textbox', { name: /message/i });
    await user.type(messageInput, 'Great product!');
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('should close modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget {...defaultProps} />);
    
    // Open modal
    const floatingButton = screen.getByRole('button', { name: /feedback/i });
    await user.click(floatingButton);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Close modal
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<FeedbackWidget {...defaultProps} />);
    
    // Open modal
    const floatingButton = screen.getByRole('button', { name: /feedback/i });
    await user.click(floatingButton);
    
    // Fill form with invalid email
    const fourthStar = screen.getByRole('button', { name: /4 stars/i });
    await user.click(fourthStar);
    
    const messageInput = screen.getByRole('textbox', { name: /message/i });
    await user.type(messageInput, 'Great product!');
    
    const emailInput = screen.getByRole('textbox', { name: /email/i });
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);
    
    // Check for email validation error
    expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
  });
});
