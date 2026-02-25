/**
 * FeedbackPulse Widget Bundle
 * 
 * Standalone widget bundle containing React and the widget component.
 * This file is loaded by the bootstrap script and provides the mount function.
 */

// Simple React-like implementation for the widget (to avoid bundling complexity)
(function() {
  'use strict';

  /**
   * Simple state management hook implementation
   */
  function useState(initialValue) {
    let value = initialValue;
    const setState = (newValue) => {
      value = typeof newValue === 'function' ? newValue(value) : newValue;
      // Trigger re-render would happen here in a full React implementation
    };
    return [value, setState];
  }

  /**
   * Creates a feedback widget component without React dependency
   */
  function createFeedbackWidget(container, config) {
    let isExpanded = false;
    let isSubmitting = false;
    let isSubmitted = false;
    let feedbackData = {
      rating: 0,
      comment: '',
      email: ''
    };

    /**
     * Renders the complete widget HTML
     */
    function render() {
      const triggerButton = isExpanded ? '×' : '?';
      const triggerLabel = isExpanded ? 'Close feedback form' : 'Open feedback form';
      
      let panelContent = '';
      if (isExpanded) {
        if (isSubmitted) {
          panelContent = renderSuccessPanel();
        } else {
          panelContent = renderFeedbackPanel();
        }
      }

      container.innerHTML = `
        <style>
          ${getWidgetStyles(config.theme)}
        </style>
        <div class="fp-widget">
          <button 
            class="fp-trigger ${isExpanded ? 'expanded' : ''}" 
            onclick="window.fpToggle()"
            aria-label="${triggerLabel}"
            style="background-color: ${config.theme}"
          >
            ${triggerButton}
          </button>
          ${panelContent}
        </div>
      `;
    }

    /**
     * Renders the feedback form panel
     */
    function renderFeedbackPanel() {
      const stars = [1, 2, 3, 4, 5].map(star => 
        `<button type="button" class="fp-star ${star <= feedbackData.rating ? 'active' : ''}" 
                 onclick="window.fpSetRating(${star})" aria-label="Rate ${star} star${star !== 1 ? 's' : ''}">★</button>`
      ).join('');

      const isSubmitDisabled = !feedbackData.rating || !feedbackData.comment.trim() || isSubmitting;

      return `
        <div class="fp-panel">
          <div class="fp-header">
            <h3 class="fp-title">Feedback</h3>
            <button class="fp-close" onclick="window.fpToggle()" aria-label="Close feedback form">×</button>
          </div>
          <div class="fp-content">
            <div class="fp-rating-selector">
              <label class="fp-label">How would you rate your experience?</label>
              <div class="fp-stars">${stars}</div>
            </div>
            <div class="fp-form">
              <textarea 
                class="fp-textarea" 
                placeholder="${config.question}"
                onchange="window.fpSetComment(this.value)"
                rows="3" 
                maxlength="500"
              >${feedbackData.comment}</textarea>
              <input 
                type="email" 
                class="fp-input"
                placeholder="Your email (optional)"
                onchange="window.fpSetEmail(this.value)"
                value="${feedbackData.email}"
              />
              <div class="fp-actions">
                <button type="button" class="fp-button fp-button-secondary" onclick="window.fpToggle()" ${isSubmitting ? 'disabled' : ''}>
                  Cancel
                </button>
                <button type="button" class="fp-button fp-button-primary" onclick="window.fpSubmit()" ${isSubmitDisabled ? 'disabled' : ''}>
                  ${isSubmitting ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    /**
     * Renders the success message panel
     */
    function renderSuccessPanel() {
      return `
        <div class="fp-panel">
          <div class="fp-header">
            <h3 class="fp-title">Feedback</h3>
            <button class="fp-close" onclick="window.fpToggle()" aria-label="Close feedback form">×</button>
          </div>
          <div class="fp-content">
            <div class="fp-success">
              <div class="fp-success-icon">✓</div>
              <h3 class="fp-success-title">Thank you!</h3>
              <p class="fp-success-message">Your feedback has been submitted successfully.</p>
            </div>
          </div>
        </div>
      `;
    }

    /**
     * Gets the complete widget CSS styles
     */
    function getWidgetStyles(themeColor) {
      return `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .fp-widget {
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.4;
          color: #333;
          z-index: 2147483647;
        }
        .fp-trigger {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          background: ${themeColor};
          color: white;
          font-size: 24px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fp-trigger:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3); }
        .fp-trigger:active { transform: scale(0.95); }
        .fp-trigger.expanded { background: #64748b; }
        .fp-panel {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 320px;
          max-width: 90vw;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
          border: 1px solid #e2e8f0;
          animation: fp-slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes fp-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .fp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .fp-title { font-size: 16px; font-weight: 600; color: #1e293b; margin: 0; }
        .fp-close {
          background: none;
          border: none;
          font-size: 20px;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s;
        }
        .fp-close:hover { color: #334155; background: #e2e8f0; }
        .fp-content { padding: 20px; }
        .fp-rating-selector { margin-bottom: 16px; }
        .fp-label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .fp-stars { display: flex; gap: 4px; }
        .fp-star {
          background: none;
          border: none;
          font-size: 24px;
          color: #d1d5db;
          cursor: pointer;
          transition: color 0.2s;
          padding: 2px;
        }
        .fp-star:hover, .fp-star.active { color: #fbbf24; }
        .fp-form { display: flex; flex-direction: column; gap: 12px; }
        .fp-textarea, .fp-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .fp-textarea { min-height: 80px; resize: vertical; }
        .fp-textarea:focus, .fp-input:focus {
          outline: none;
          border-color: ${themeColor};
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .fp-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .fp-button {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 80px;
        }
        .fp-button:disabled { opacity: 0.6; cursor: not-allowed; }
        .fp-button-secondary {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }
        .fp-button-secondary:hover:not(:disabled) { background: #f1f5f9; color: #475569; }
        .fp-button-primary { background: ${themeColor}; color: white; }
        .fp-button-primary:hover:not(:disabled) { opacity: 0.9; }
        .fp-success { text-align: center; padding: 20px 0; }
        .fp-success-icon {
          width: 48px;
          height: 48px;
          background: #10b981;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin: 0 auto 16px;
        }
        .fp-success-title { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
        .fp-success-message { color: #64748b; font-size: 14px; }
        @media (max-width: 480px) {
          .fp-panel { width: 280px; bottom: 70px; right: -10px; }
          .fp-trigger { width: 50px; height: 50px; font-size: 20px; }
        }
      `;
    }

    // Global functions for event handling
    window.fpToggle = function() {
      isExpanded = !isExpanded;
      render();
    };

    window.fpSetRating = function(rating) {
      feedbackData.rating = rating;
      render();
    };

    window.fpSetComment = function(comment) {
      feedbackData.comment = comment;
    };

    window.fpSetEmail = function(email) {
      feedbackData.email = email;
    };

    window.fpSubmit = async function() {
      if (feedbackData.rating === 0 || !feedbackData.comment.trim()) {
        return;
      }

      isSubmitting = true;
      render();

      try {
        const response = await fetch(`${config.baseUrl}/api/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project_id: config.projectId,
            rating: feedbackData.rating,
            comment: feedbackData.comment,
            email: feedbackData.email,
            source: 'widget'
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        isSubmitted = true;
        render();

        // Auto-close after 3 seconds
        setTimeout(() => {
          isExpanded = false;
          render();
        }, 3000);

      } catch (error) {
        console.error('Failed to submit feedback:', error);
        alert('Failed to submit feedback. Please try again.');
      } finally {
        isSubmitting = false;
        render();
      }
    };

    // Initial render
    render();
  }

  /**
   * Mount function called by the bootstrap script
   */
  window.FeedbackPulseWidgetMount = function(shadowRoot, config) {
    try {
      const container = document.createElement('div');
      container.id = 'feedbackpulse-widget-root';
      shadowRoot.appendChild(container);

      createFeedbackWidget(container, config);
      console.log('FeedbackPulse widget mounted successfully');

    } catch (error) {
      console.error('Failed to mount FeedbackPulse widget:', error);
      
      shadowRoot.innerHTML = `
        <style>
          .fp-error-fallback {
            padding: 20px;
            background: #fee;
            border: 1px solid #fcc;
            border-radius: 8px;
            color: #900;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            max-width: 300px;
          }
        </style>
        <div class="fp-error-fallback">
          Failed to load feedback widget. Please try refreshing the page.
        </div>
      `;
    }
  };

})();