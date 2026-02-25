/**
 * Public feedback form component for anonymous feedback submission.
 * This component provides a user-friendly interface for submitting feedback
 * on public project pages. It includes rating selection, comment input,
 * and optional email collection.
 */

'use client'

import { useState } from 'react'
import { FeedbackSubmission, validateFeedbackSubmission } from '@/lib/validation'

/**
 * Props for the PublicFeedbackForm component
 */
interface PublicFeedbackFormProps {
  /** The ID of the project to submit feedback for */
  projectId: string
  /** The slug of the project (used in success messages) */
  projectSlug: string
}

/**
 * Form submission states for tracking progress and providing user feedback
 */
type SubmissionState = 'idle' | 'submitting' | 'success' | 'error'

/**
 * Star rating component for feedback submission.
 * Displays 5 clickable stars with hover effects and proper accessibility.
 * 
 * @param rating - Current selected rating (1-5)
 * @param onRatingChange - Callback fired when rating changes
 * @returns JSX element with interactive star rating
 */
function StarRating({ rating, onRatingChange }: { 
  rating: number
  onRatingChange: (rating: number) => void 
}) {
  const [hoverRating, setHoverRating] = useState(0)

  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-2xl transition-colors duration-150 ${
            star <= (hoverRating || rating)
              ? 'text-yellow-400 hover:text-yellow-500'
              : 'text-gray-300 hover:text-gray-400'
          }`}
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

/**
 * Public feedback form for project feedback collection.
 * Allows users to submit ratings, comments, and optional contact information
 * without requiring authentication. Validates input and handles submission errors.
 * 
 * @param projectId - ID of the project to submit feedback for
 * @param projectSlug - Slug of the project for display purposes
 * @returns JSX element with the feedback form
 */
export default function PublicFeedbackForm({ projectId, projectSlug }: PublicFeedbackFormProps) {
  const [rating, setRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [email, setEmail] = useState('')
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  /**
   * Handles form submission by validating input and sending to the API.
   * Provides user feedback through loading states and success/error messages.
   * 
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset error state
    setErrorMessage('')
    
    // Validate required fields
    if (rating === 0) {
      setErrorMessage('Please select a rating')
      return
    }
    
    if (!comment.trim()) {
      setErrorMessage('Please provide a comment')
      return
    }

    // Prepare submission data
    const submissionData: FeedbackSubmission = {
      projectId,
      rating,
      comment: comment.trim(),
      email: email.trim() || undefined,
      source: 'app' as const, // Public feedback page submissions
    }

    // Validate submission data using shared validation
    const validation = validateFeedbackSubmission(submissionData)
    if (!validation.success) {
      setErrorMessage(validation.error)
      return
    }

    setSubmissionState('submitting')

    try {
      // Submit feedback to API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validation.data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to submit feedback')
      }

      // Success: reset form and show success state
      setSubmissionState('success')
      setRating(0)
      setComment('')
      setEmail('')
      
      // Auto-reset success state after 5 seconds
      setTimeout(() => {
        setSubmissionState('idle')
      }, 5000)
      
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setSubmissionState('error')
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : 'Something went wrong. Please try again.'
      )
    }
  }

  // Show success message after successful submission
  if (submissionState === 'success') {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-8 h-8 text-green-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Thank You!
          </h3>
          <p className="text-gray-600">
            Your feedback has been submitted successfully.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How would you rate your experience?
        </label>
        <StarRating rating={rating} onRatingChange={setRating} />
        {rating > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            {rating === 1 && "We're sorry to hear that. Please let us know how we can improve."}
            {rating === 2 && "We appreciate your feedback. How can we do better?"}
            {rating === 3 && "Thank you for your feedback. What could we improve?"}
            {rating === 4 && "Great! We'd love to hear what we did well and how we can improve."}
            {rating === 5 && "Wonderful! We'd love to hear what made your experience great."}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Your feedback *
        </label>
        <textarea
          id="comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Please share your thoughts, suggestions, or any issues you encountered..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          disabled={submissionState === 'submitting'}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email (optional)
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={submissionState === 'submitting'}
        />
        <p className="text-xs text-gray-500 mt-1">
          Provide your email if you'd like us to follow up with you
        </p>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg 
                className="h-5 w-5 text-red-400" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submissionState === 'submitting'}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submissionState === 'submitting' ? 'Submitting...' : 'Submit Feedback'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your feedback is anonymous unless you provide an email address
      </p>
    </form>
  )
}