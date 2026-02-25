/**
 * Test suite for PublicFeedbackForm component.
 * Validates form rendering, user interactions, and submission logic.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import PublicFeedbackForm from '../PublicFeedbackForm'

// Mock fetch globally
global.fetch = vi.fn()

const mockFetch = fetch as vi.MockedFunction<typeof fetch>

describe('PublicFeedbackForm', () => {
  const mockProps = {
    projectId: 'test-project-id',
    projectSlug: 'test-project'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the feedback form with all required elements', () => {
      render(<PublicFeedbackForm {...mockProps} />)
      
      // Check for rating section
      expect(screen.getByText('How would you rate your experience?')).toBeInTheDocument()
      
      // Check for star rating buttons
      const stars = screen.getAllByRole('button', { name: /Rate \d star/ })
      expect(stars).toHaveLength(5)
      
      // Check for comment field
      expect(screen.getByLabelText('Your feedback *')).toBeInTheDocument()
      
      // Check for email field
      expect(screen.getByLabelText('Email (optional)')).toBeInTheDocument()
      
      // Check for submit button
      expect(screen.getByRole('button', { name: 'Submit Feedback' })).toBeInTheDocument()
    })

    it('should show rating-specific help text when a rating is selected', () => {
      render(<PublicFeedbackForm {...mockProps} />)
      
      // Click on 5-star rating
      const fiveStarButton = screen.getByRole('button', { name: 'Rate 5 stars' })
      fireEvent.click(fiveStarButton)
      
      // Check for 5-star help text
      expect(screen.getByText(/Wonderful! We'd love to hear what made your experience great/)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show error when submitting without rating', async () => {
      render(<PublicFeedbackForm {...mockProps} />)
      
      // Fill comment but not rating
      const commentField = screen.getByLabelText('Your feedback *')
      fireEvent.change(commentField, { target: { value: 'Great product!' } })
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Submit Feedback' })
      fireEvent.click(submitButton)
      
      // Check for error message
      await waitFor(() => {
        expect(screen.getByText('Please select a rating')).toBeInTheDocument()
      })
    })

    it('should show error when submitting without comment', async () => {
      render(<PublicFeedbackForm {...mockProps} />)
      
      // Select rating but no comment
      const fiveStarButton = screen.getByRole('button', { name: 'Rate 5 stars' })
      fireEvent.click(fiveStarButton)
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Submit Feedback' })
      fireEvent.click(submitButton)
      
      // Check for error message
      await waitFor(() => {
        expect(screen.getByText('Please provide a comment')).toBeInTheDocument()
      })
    })

    it('should validate email format if provided', async () => {
      render(<PublicFeedbackForm {...mockProps} />)
      
      // Fill form with invalid email
      const ratingButton = screen.getByRole('button', { name: 'Rate 4 stars' })
      fireEvent.click(ratingButton)
      
      const commentField = screen.getByLabelText('Your feedback *')
      fireEvent.change(commentField, { target: { value: 'Good service' } })
      
      const emailField = screen.getByLabelText('Email (optional)')
      fireEvent.change(emailField, { target: { value: 'invalid-email' } })
      
      // Mock validation failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Email must be a valid email address' })
      } as Response)
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Submit Feedback' })
      fireEvent.click(submitButton)
      
      // Check for error message
      await waitFor(() => {
        expect(screen.getByText('Email must be a valid email address')).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should submit valid feedback successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      } as Response)
      
      render(<PublicFeedbackForm {...mockProps} />)
      
      // Fill out the form
      const ratingButton = screen.getByRole('button', { name: 'Rate 5 stars' })
      fireEvent.click(ratingButton)
      
      const commentField = screen.getByLabelText('Your feedback *')
      fireEvent.change(commentField, { target: { value: 'Excellent service!' } })
      
      const emailField = screen.getByLabelText('Email (optional)')
      fireEvent.change(emailField, { target: { value: 'user@example.com' } })
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Submit Feedback' })
      fireEvent.click(submitButton)
      
      // Check that fetch was called with correct data
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"rating":5')
        })
      })
      
      // Check for success message
      await waitFor(() => {
        expect(screen.getByText('Thank You!')).toBeInTheDocument()
        expect(screen.getByText('Your feedback has been submitted successfully.')).toBeInTheDocument()
      })
    })

    it('should handle submission errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Server error occurred' })
      } as Response)
      
      render(<PublicFeedbackForm {...mockProps} />)
      
      // Fill and submit form
      const ratingButton = screen.getByRole('button', { name: 'Rate 3 stars' })
      fireEvent.click(ratingButton)
      
      const commentField = screen.getByLabelText('Your feedback *')
      fireEvent.change(commentField, { target: { value: 'Average experience' } })
      
      const submitButton = screen.getByRole('button', { name: 'Submit Feedback' })
      fireEvent.click(submitButton)
      
      // Check for error message
      await waitFor(() => {
        expect(screen.getByText('Server error occurred')).toBeInTheDocument()
      })
    })

    it('should disable form during submission', async () => {
      // Mock a slow response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ success: true })
          } as Response), 100)
        )
      )
      
      render(<PublicFeedbackForm {...mockProps} />)
      
      // Fill and submit form
      const ratingButton = screen.getByRole('button', { name: 'Rate 4 stars' })
      fireEvent.click(ratingButton)
      
      const commentField = screen.getByLabelText('Your feedback *')
      fireEvent.change(commentField, { target: { value: 'Good product' } })
      
      const submitButton = screen.getByRole('button', { name: 'Submit Feedback' })
      fireEvent.click(submitButton)
      
      // Check that button shows loading state
      expect(screen.getByRole('button', { name: 'Submitting...' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Submitting...' })).toBeDisabled()
      
      // Check that form fields are disabled
      expect(commentField).toBeDisabled()
      
      // Wait for submission to complete
      await waitFor(() => {
        expect(screen.getByText('Thank You!')).toBeInTheDocument()
      })
    })
  })

  describe('Star Rating Component', () => {
    it('should highlight stars on hover', () => {
      render(<PublicFeedbackForm {...mockProps} />)
      
      const thirdStar = screen.getByRole('button', { name: 'Rate 3 stars' })
      
      // Hover over third star
      fireEvent.mouseEnter(thirdStar)
      
      // First three stars should be highlighted (yellow)
      const stars = screen.getAllByRole('button', { name: /Rate \d star/ })
      expect(stars[0]).toHaveClass('text-yellow-400')
      expect(stars[1]).toHaveClass('text-yellow-400')
      expect(stars[2]).toHaveClass('text-yellow-400')
      expect(stars[3]).toHaveClass('text-gray-300')
      expect(stars[4]).toHaveClass('text-gray-300')
    })

    it('should maintain selected rating after mouse leave', () => {
      render(<PublicFeedbackForm {...mockProps} />)
      
      const fourthStar = screen.getByRole('button', { name: 'Rate 4 stars' })
      
      // Click fourth star
      fireEvent.click(fourthStar)
      
      // Hover and then leave
      fireEvent.mouseEnter(fourthStar)
      fireEvent.mouseLeave(fourthStar)
      
      // First four stars should remain selected
      const stars = screen.getAllByRole('button', { name: /Rate \d star/ })
      expect(stars[0]).toHaveClass('text-yellow-400')
      expect(stars[1]).toHaveClass('text-yellow-400')
      expect(stars[2]).toHaveClass('text-yellow-400')
      expect(stars[3]).toHaveClass('text-yellow-400')
      expect(stars[4]).toHaveClass('text-gray-300')
    })
  })
})