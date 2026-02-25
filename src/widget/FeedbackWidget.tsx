/**
 * FeedbackPulse Widget Component
 * 
 * Main React component for the FeedbackPulse widget. This component renders
 * the feedback form that appears when users interact with the widget on
 * third-party websites.
 */

import React, { useState, useEffect } from 'react';
import './widget.css';

/**
 * Configuration passed to the widget from the bootstrap script
 */
export interface WidgetConfig {
  projectId: string;
  theme: string;
  question: string;
  position: string;
  baseUrl: string;
}

/**
 * Alternative configuration for direct usage (e.g., in settings preview)
 */
export interface DirectWidgetProps {
  projectId: string;
  buttonText?: string;
  themeColor?: string;
  questionText?: string;
  isPreview?: boolean;
}

/**
 * Props for the FeedbackWidget component
 */
interface FeedbackWidgetProps {
  config?: WidgetConfig;
  onClose?: () => void;
  // Direct props for settings panel usage
  projectId?: string;
  buttonText?: string;
  themeColor?: string;
  questionText?: string;
  isPreview?: boolean;
}

/**
 * Feedback form data structure
 */
interface FeedbackData {
  rating: number;
  comment: string;
  email?: string;
}

/**
 * Main FeedbackPulse widget component.
 * Renders a floating feedback button that expands into a feedback form when clicked.
 * 
 * @param props - Component props containing configuration and callbacks
 */
export function FeedbackWidget({ 
  config, 
  onClose, 
  projectId, 
  buttonText, 
  themeColor, 
  questionText, 
  isPreview 
}: FeedbackWidgetProps) {
  // Determine configuration source - either from config prop or direct props
  const widgetConfig = config || {
    projectId: projectId || '',
    theme: themeColor || '#3b82f6',
    question: questionText || 'How can we improve your experience?',
    position: 'bottom-right',
    baseUrl: typeof window !== 'undefined' ? window.location.origin : ''
  };
  
  const displayButtonText = buttonText || 'Feedback';
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({
    rating: 0,
    comment: '',
    email: ''
  });
  const [error, setError] = useState<string>('');

  /**
   * Handles toggling the widget expansion state.
   * Opens or closes the feedback form.
   */
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    setError(''); // Clear any previous errors
  };

  /**
   * Handles rating selection by the user.
   * 
   * @param rating - Selected rating value (1-5)
   */
  const handleRatingSelect = (rating: number) => {
    setFeedbackData(prev => ({ ...prev, rating }));
  };

  /**
   * Handles text input changes for comment and email fields.
   * 
   * @param field - The field being updated ('comment' or 'email')
   * @param value - The new value for the field
   */
  const handleInputChange = (field: keyof FeedbackData, value: string) => {
    setFeedbackData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Submits the feedback to the FeedbackPulse API.
   * Handles validation, submission, and success/error states.
   * In preview mode, simulates submission without making API calls.
   */
  const handleSubmit = async () => {
    // Validate required fields
    if (feedbackData.rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!feedbackData.comment.trim()) {
      setError('Please provide a comment');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // In preview mode, simulate successful submission
      if (isPreview) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        setIsSubmitted(true);
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          setIsExpanded(false);
          onClose?.();
        }, 3000);
        return;
      }

      // Submit feedback to API
      const response = await fetch(`${widgetConfig.baseUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: widgetConfig.projectId,
          rating: feedbackData.rating,
          comment: feedbackData.comment,
          email: feedbackData.email,
          source: 'widget'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Success - show thank you message
      setIsSubmitted(true);
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        setIsExpanded(false);
        onClose?.();
      }, 3000);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Renders the rating selector component.
   * Shows 5 star icons that users can click to select a rating.
   */
  const renderRatingSelector = () => {
    return (
      <div className="fp-rating-selector">
        <label className="fp-label">How would you rate your experience?</label>
        <div className="fp-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`fp-star ${star <= feedbackData.rating ? 'active' : ''}`}
              onClick={() => handleRatingSelect(star)}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Renders the feedback form with comment and email fields.
   */
  const renderFeedbackForm = () => {
    return (
      <div className="fp-form">
        <textarea
          className="fp-textarea"
          placeholder={widgetConfig.question}
          value={feedbackData.comment}
          onChange={(e) => handleInputChange('comment', e.target.value)}
          rows={3}
          maxLength={500}
        />
        
        <input
          type="email"
          className="fp-input"
          placeholder="Your email (optional)"
          value={feedbackData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
        />

        {error && (
          <div className="fp-error" role="alert">
            {error}
          </div>
        )}

        <div className="fp-actions">
          <button
            type="button"
            className="fp-button fp-button-secondary"
            onClick={handleToggle}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="fp-button fp-button-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !feedbackData.rating || !feedbackData.comment.trim()}
          >
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </button>
        </div>
      </div>
    );
  };

  /**
   * Renders the success message after feedback submission.
   */
  const renderSuccessMessage = () => {
    return (
      <div className="fp-success">
        <div className="fp-success-icon">✓</div>
        <h3 className="fp-success-title">Thank you!</h3>
        <p className="fp-success-message">
          Your feedback has been submitted successfully.
        </p>
      </div>
    );
  };

  return (
    <div 
      className="fp-widget"
      style={{ '--theme-color': widgetConfig.theme } as React.CSSProperties}
    >
      {/* Widget trigger button */}
      <button
        className={`fp-trigger ${isExpanded ? 'expanded' : ''}`}
        onClick={handleToggle}
        aria-label={isExpanded ? 'Close feedback form' : 'Open feedback form'}
        style={{ backgroundColor: widgetConfig.theme }}
      >
        {isExpanded ? '×' : displayButtonText}
      </button>

      {/* Widget popup/panel */}
      {isExpanded && (
        <div className="fp-panel">
          <div className="fp-header">
            <h3 className="fp-title">{displayButtonText}</h3>
            <button
              className="fp-close"
              onClick={handleToggle}
              aria-label="Close feedback form"
            >
              ×
            </button>
          </div>

          <div className="fp-content">
            {isSubmitted ? (
              renderSuccessMessage()
            ) : (
              <>
                {renderRatingSelector()}
                {renderFeedbackForm()}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedbackWidget;