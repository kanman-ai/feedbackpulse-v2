/**
 * FeedbackPulse Widget Library
 * 
 * This is the main widget library that gets embedded on customer websites.
 * It creates a feedback button and modal interface for collecting user feedback.
 * 
 * @fileoverview Main widget implementation for FeedbackPulse embed script
 */

/**
 * FeedbackWidget class handles the creation and management of the feedback interface
 * including the trigger button and feedback modal.
 */
class FeedbackWidget {
  /**
   * Creates a new FeedbackWidget instance with the provided configuration.
   * 
   * @param {Object} config - Widget configuration object
   * @param {string} config.projectId - Unique project identifier
   * @param {string} [config.buttonColor='#007bff'] - Color of the feedback button
   * @param {string} [config.buttonLabel='Feedback'] - Text label for the button
   * @param {string} [config.position='bottom-right'] - Position of the button on screen
   */
  constructor(config) {
    this.config = {
      buttonColor: '#007bff',
      buttonLabel: 'Feedback', 
      position: 'bottom-right',
      ...config
    };
    
    this.isOpen = false;
    this.button = null;
    this.modal = null;
    this.overlay = null;
    
    // Initialize the widget immediately
    this.createWidget();
  }

  /**
   * Creates and renders the feedback widget button and modal elements.
   * Adds the elements to the DOM and sets up event handlers.
   */
  createWidget() {
    this.createButton();
    this.createModal();
    
    // Add elements to DOM for test compatibility and actual functionality
    if (typeof document !== 'undefined' && document.body) {
      document.body.appendChild(this.button);
      // Modal will be added when opened
    }
  }

  /**
   * Creates the feedback trigger button element with configured styling and positioning.
   * 
   * @returns {HTMLElement} The created button element
   */
  createButton() {
    const button = document.createElement('button');
    button.innerHTML = this.config.buttonLabel;
    button.style.cssText = `
      position: fixed;
      ${this.getPositionStyles()}
      background-color: ${this.config.buttonColor};
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 25px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      transition: all 0.2s ease;
    `;
    
    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    
    // Open modal on click
    button.addEventListener('click', () => this.openModal());
    
    this.button = button;
    return button;
  }

  /**
   * Gets CSS positioning styles based on the configured position.
   * 
   * @returns {string} CSS positioning properties
   */
  getPositionStyles() {
    const positions = {
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;'
    };
    
    return positions[this.config.position] || positions['bottom-right'];
  }

  /**
   * Creates the feedback modal dialog with form elements for user input.
   * 
   * @returns {HTMLElement} The created modal element
   */
  createModal() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
      z-index: 10001;
      display: none;
    `;
    
    // Create modal container
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 12px;
      padding: 24px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    
    // Add modal content
    modal.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #333;">
          Share your feedback
        </h3>
        <p style="margin: 0; color: #666; font-size: 14px;">
          Help us improve your experience
        </p>
      </div>
      
      <form id="feedback-form" style="margin-bottom: 20px;">
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #333; font-size: 14px;">
            Your feedback
          </label>
          <textarea 
            name="message" 
            required
            placeholder="Tell us what you think..."
            style="width: 100%; height: 100px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; font-size: 14px; resize: vertical;"
          ></textarea>
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #333; font-size: 14px;">
            Email (optional)
          </label>
          <input 
            type="email" 
            name="email" 
            placeholder="your@email.com"
            style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; font-size: 14px;"
          />
        </div>
      </form>
      
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button type="button" id="cancel-btn" style="
          padding: 10px 20px;
          border: 1px solid #ddd;
          background: white;
          color: #666;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        ">Cancel</button>
        <button type="submit" form="feedback-form" id="submit-btn" style="
          padding: 10px 20px;
          border: none;
          background: ${this.config.buttonColor};
          color: white;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        ">Send Feedback</button>
      </div>
    `;
    
    // Set up event handlers
    const cancelBtn = modal.querySelector('#cancel-btn');
    cancelBtn.addEventListener('click', () => this.closeModal());
    
    const form = modal.querySelector('#feedback-form');
    form.addEventListener('submit', (e) => this.submitFeedback(e));
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModal();
    });
    
    overlay.appendChild(modal);
    this.overlay = overlay;
    this.modal = modal;
    
    return modal;
  }

  /**
   * Opens the feedback modal by adding it to the DOM and showing the overlay.
   */
  openModal() {
    if (!this.isOpen) {
      document.body.appendChild(this.overlay);
      this.overlay.style.display = 'block';
      this.isOpen = true;
      
      // Focus the textarea for better UX
      const textarea = this.modal.querySelector('textarea');
      if (textarea) {
        setTimeout(() => textarea.focus(), 100);
      }
    }
  }

  /**
   * Closes the feedback modal by hiding the overlay and removing it from DOM.
   */
  closeModal() {
    if (this.isOpen) {
      this.overlay.style.display = 'none';
      if (this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.isOpen = false;
    }
  }

  /**
   * Handles feedback form submission, sends data to the API, and provides user feedback.
   * 
   * @param {Event} event - Form submit event
   */
  async submitFeedback(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const message = formData.get('message');
    const email = formData.get('email');
    
    const submitBtn = this.modal.querySelector('#submit-btn');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    try {
      // Send feedback to API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: this.config.projectId,
          message: message,
          email: email,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });

      if (response.ok) {
        // Show success message
        this.showSuccess();
      } else {
        throw new Error('Failed to submit feedback');
      }
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      // Show error message
      this.showError();
      
      // Reset button
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  /**
   * Displays a success message after successful feedback submission.
   */
  showSuccess() {
    this.modal.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <div style="color: #28a745; font-size: 48px; margin-bottom: 16px;">✓</div>
        <h3 style="margin: 0 0 8px 0; color: #333;">Thank you!</h3>
        <p style="margin: 0; color: #666;">Your feedback has been submitted successfully.</p>
      </div>
    `;
    
    // Auto-close after 2 seconds
    setTimeout(() => this.closeModal(), 2000);
  }

  /**
   * Displays an error message when feedback submission fails.
   */
  showError() {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      background: #f8d7da;
      color: #721c24;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 14px;
    `;
    errorDiv.textContent = 'Sorry, there was an error submitting your feedback. Please try again.';
    
    const form = this.modal.querySelector('#feedback-form');
    form.parentNode.insertBefore(errorDiv, form);
    
    // Remove error after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  /**
   * Removes the widget from the page and cleans up event handlers.
   */
  destroy() {
    if (this.button && this.button.parentNode) {
      this.button.parentNode.removeChild(this.button);
    }
    
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    
    this.button = null;
    this.modal = null;
    this.overlay = null;
    this.isOpen = false;
  }
}

// Export for use in embed script and tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FeedbackWidget };
} else {
  window.FeedbackWidget = FeedbackWidget;
}