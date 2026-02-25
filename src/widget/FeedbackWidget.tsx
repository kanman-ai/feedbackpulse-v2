/**
 * FeedbackPulse v2 - Feedback Widget Component
 * 
 * A React component that displays a floating feedback button and modal.
 * When clicked, shows a form with rating stars, message textarea, optional email field,
 * and submit functionality that sends data to the feedback API endpoint.
 * 
 * Features:
 * - 1-5 star rating system
 * - Message textarea with character limit
 * - Optional email field for follow-up
 * - Form validation
 * - Success/error messaging
 * - Form clearing after successful submission
 * - WCAG 2.1 accessibility compliance
 */

import React, { useState, useEffect } from 'react';
import './widget.css';

/**
 * Props for the FeedbackWidget component
 */
export interface FeedbackWidgetProps {
  /** Project ID to associate the feedback with */
  projectId: string;
  /** API endpoint URL for submitting feedback */
  apiUrl: string;
  /** Optional custom theme colors */
  theme?: {
    primary?: string;
    secondary?: string;
    text?: string;
    background?: string;
  };
  /** Position of the floating button */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * Feedback form data structure
 */
interface FeedbackData {
  rating: number;
  comment: string;
  email: string;
}

/**
 * Validation errors structure
 */
interface ValidationErrors {
  rating?: string;
  comment?: string;
  email?: string;
}

/**
 * Star rating component with interactive hover and selection states
 * 
 * @param rating - Current selected rating (1-5)
 * @param onRatingChange - Callback when rating is selected
 * @param disabled - Whether the rating is disabled during submission
 */
const StarRating: React.FC<{
  rating: number;
  onRatingChange: (rating: number) => void;
  disabled: boolean;
}> = ({ rating, onRatingChange, disabled }) => {
  const [hoverRating, setHoverRating] = useState(0);

  /**
   * Handles star hover for visual feedback
   * @param starIndex - Index of the hovered star (1-based)
   */
  const handleStarHover = (starIndex: number) => {
    if (!disabled) {
      setHoverRating(starIndex);
    }
  };

  /**
   * Handles star click to set rating
   * @param starIndex - Index of the clicked star (1-based)
   */
  const handleStarClick = (starIndex: number) => {
    if (!disabled) {
      onRatingChange(starIndex);
    }
  };

  return (
    <div 
      className="star-rating" 
      onMouseLeave={() => setHoverRating(0)}
      role="radiogroup"
      aria-label="Rate your experience"
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isFilled = starIndex <= (hoverRating || rating);
        return (
          <button
            key={starIndex}
            type="button"
            className={`star ${isFilled ? 'filled' : 'empty'} ${disabled ? 'disabled' : ''}`}
            onClick={() => handleStarClick(starIndex)}
            onMouseEnter={() => handleStarHover(starIndex)}
            disabled={disabled}
            role="radio"
            aria-checked={starIndex === rating}
            aria-label={`${starIndex} stars`}
          >
            ⭐
          </button>
        );
      })}
    </div>
  );
};

/**
 * Main FeedbackWidget component that renders the floating button and modal
 */
export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  projectId,
  apiUrl,
  theme = {},
  position = 'bottom-right'
}) => {
  // Component state management
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FeedbackData>({
    rating: 0,
    comment: '',
    email: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  /**
   * Validates the feedback form data and returns any validation errors
   * 
   * @param data - The form data to validate
   * @returns Object containing validation errors, if any
   */
  const validateForm = (data: FeedbackData): ValidationErrors => {
    const validationErrors: ValidationErrors = {};

    // Rating validation
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      validationErrors.rating = 'Rating is required';
    }

    // Comment validation
    if (!data.comment.trim()) {
      validationErrors.comment = 'Comment is required';
    } else if (data.comment.length > 500) {
      validationErrors.comment = 'Comment must be 500 characters or less';
    }

    // Email validation (optional field)
    if (data.email && !isValidEmail(data.email)) {
      validationErrors.email = 'Please enter a valid email address';
    }

    return validationErrors;
  };

  /**
   * Validates email format using a regex pattern
   * 
   * @param email - Email string to validate
   * @returns True if email format is valid, false otherwise
   */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Handles form submission - validates data and sends to API
   * 
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate form data
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit feedback to API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          rating: formData.rating,
          comment: formData.comment.trim(),
          email: formData.email.trim() || undefined,
          source: 'widget'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }

      // Success! Show success message and reset form
      setShowSuccess(true);
      setFormData({ rating: 0, comment: '', email: '' });
      setErrors({});

      // Auto-close success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setIsOpen(false);
      }, 3000);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles input changes in the form fields
   * 
   * @param field - Field name to update
   * @param value - New value for the field
   */
  const handleInputChange = (field: keyof FeedbackData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Closes the modal and resets any temporary state
   */
  const handleClose = () => {
    setIsOpen(false);
    setShowSuccess(false);
    setSubmitError(null);
    setErrors({});
  };

  /**
   * Handles escape key to close modal
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <div className="feedback-widget">
      {/* Floating feedback button */}
      <button
        className={`feedback-button ${position}`}
        onClick={() => setIsOpen(true)}
        style={{
          backgroundColor: theme.primary || '#007bff',
          color: theme.text || '#ffffff'
        }}
        aria-label="Open feedback form"
        type="button"
      >
        💬 Feedback
      </button>

      {/* Modal overlay and content */}
      {isOpen && (
        <div 
          className="feedback-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <div 
            className="feedback-modal" 
            role="dialog" 
            aria-labelledby="feedback-title"
            aria-modal="true"
            style={{
              backgroundColor: theme.background || '#ffffff',
              color: theme.text || '#333333'
            }}
          >
            {/* Modal header */}
            <div className="feedback-modal-header">
              <h2 id="feedback-title">Share Your Feedback</h2>
              <button 
                className="close-button" 
                onClick={handleClose}
                aria-label="Close feedback form"
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Success message */}
            {showSuccess && (
              <div className="success-message" role="alert">
                ✅ Thank you for your feedback! We appreciate your input.
              </div>
            )}

            {/* Error message */}
            {submitError && (
              <div className="error-message" role="alert">
                ❌ {submitError}
              </div>
            )}

            {/* Feedback form */}
            {!showSuccess && (
              <form onSubmit={handleSubmit} className="feedback-form">
                {/* Rating section */}
                <div className="form-group">
                  <label className="form-label">Rate your experience</label>
                  <StarRating 
                    rating={formData.rating}
                    onRatingChange={(rating) => handleInputChange('rating', rating)}
                    disabled={isSubmitting}
                  />
                  {errors.rating && (
                    <span className="error-text" role="alert">{errors.rating}</span>
                  )}
                </div>

                {/* Message section */}
                <div className="form-group">
                  <label htmlFor="feedback-message" className="form-label">Message</label>
                  <textarea
                    id="feedback-message"
                    className={`form-input ${errors.comment ? 'error' : ''}`}
                    value={formData.comment}
                    onChange={(e) => handleInputChange('comment', e.target.value)}
                    placeholder="Tell us about your experience..."
                    maxLength={500}
                    rows={4}
                    disabled={isSubmitting}
                    aria-describedby="message-error message-counter"
                  />
                  <div className="form-meta">
                    <span id="message-counter" className="character-count">
                      {formData.comment.length}/500
                    </span>
                  </div>
                  {errors.comment && (
                    <span id="message-error" className="error-text" role="alert">
                      {errors.comment}
                    </span>
                  )}
                </div>

                {/* Email section */}
                <div className="form-group">
                  <label htmlFor="feedback-email" className="form-label">Email (optional)</label>
                  <input
                    type="email"
                    id="feedback-email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                    disabled={isSubmitting}
                    aria-describedby="email-error email-help"
                  />
                  <span id="email-help" className="help-text">
                    Optional: For follow-up questions only
                  </span>
                  {errors.email && (
                    <span id="email-error" className="error-text" role="alert">
                      {errors.email}
                    </span>
                  )}
                </div>

                {/* Submit button */}
                <div className="form-actions">
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: theme.primary || '#007bff',
                      color: theme.text || '#ffffff'
                    }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackWidget;
