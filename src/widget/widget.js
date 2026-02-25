/**
 * FeedbackPulse Widget Library
 * 
 * This is the main widget library that gets dynamically loaded by the embed script.
 * It provides the actual feedback widget functionality including UI rendering,
 * event handling, and communication with the FeedbackPulse API.
 */

(function(window) {
  'use strict';

  /**
   * Main FeedbackPulse Widget class
   */
  class FeedbackPulseWidget {
    /**
     * Creates a new widget instance
     * @param {Object} config - Widget configuration
     * @param {string} config.projectId - Project ID
     * @param {string} config.buttonColor - Button color
     * @param {string} config.buttonLabel - Button label text
     */
    constructor(config) {
      this.config = config;
      this.isOpen = false;
      this.button = null;
      this.modal = null;
      this.overlay = null;
      
      this.bindMethods();
      this.createWidget();
    }

    /**
     * Binds method contexts to ensure proper 'this' binding
     */
    bindMethods() {
      this.toggleWidget = this.toggleWidget.bind(this);
      this.closeWidget = this.closeWidget.bind(this);
      this.handleOverlayClick = this.handleOverlayClick.bind(this);
      this.handleEscapeKey = this.handleEscapeKey.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
    }

    /**
     * Creates and inserts the widget button and modal into the DOM
     */
    createWidget() {
      this.createButton();
      this.createModal();
      this.attachEventListeners();
    }

    /**
     * Creates the feedback button element
     */
    createButton() {
      this.button = document.createElement('div');
      this.button.id = 'feedbackpulse-button';
      this.button.innerHTML = this.config.buttonLabel;
      
      // Apply styles
      Object.assign(this.button.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: this.config.buttonColor,
        color: 'white',
        padding: '12px 20px',
        borderRadius: '25px',
        cursor: 'pointer',
        fontSize: '14px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        zIndex: '999999',
        transition: 'all 0.3s ease',
        userSelect: 'none'
      });

      // Add hover effects
      this.button.addEventListener('mouseenter', () => {
        this.button.style.transform = 'scale(1.05)';
        this.button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
      });

      this.button.addEventListener('mouseleave', () => {
        this.button.style.transform = 'scale(1)';
        this.button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
      });

      document.body.appendChild(this.button);
    }

    /**
     * Creates the feedback modal element
     */
    createModal() {
      // Create overlay
      this.overlay = document.createElement('div');
      this.overlay.id = 'feedbackpulse-overlay';
      Object.assign(this.overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: '1000000',
        display: 'none',
        justifyContent: 'center',
        alignItems: 'center'
      });

      // Create modal
      this.modal = document.createElement('div');
      this.modal.id = 'feedbackpulse-modal';
      this.modal.innerHTML = this.getModalHTML();
      
      Object.assign(this.modal.style, {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80%',
        overflow: 'auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      });

      this.overlay.appendChild(this.modal);
      document.body.appendChild(this.overlay);
    }

    /**
     * Returns the HTML content for the feedback modal
     * @returns {string} Modal HTML
     */
    getModalHTML() {
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333; font-size: 20px;">Send Feedback</h2>
          <button id="feedbackpulse-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
        </div>
        
        <form id="feedbackpulse-form">
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">
              Feedback Type
            </label>
            <select id="feedbackpulse-type" style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="improvement">Improvement</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">
              Your Feedback *
            </label>
            <textarea 
              id="feedbackpulse-message" 
              placeholder="Tell us what's on your mind..."
              required
              style="width: 100%; height: 120px; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; font-family: inherit; resize: vertical;"
            ></textarea>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #333;">
              Email (optional)
            </label>
            <input 
              type="email" 
              id="feedbackpulse-email" 
              placeholder="your@email.com"
              style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;"
            />
          </div>
          
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button 
              type="button" 
              id="feedbackpulse-cancel"
              style="padding: 10px 20px; border: 1px solid #ddd; background: white; color: #666; border-radius: 6px; cursor: pointer; font-size: 14px;"
            >
              Cancel
            </button>
            <button 
              type="submit"
              style="padding: 10px 20px; border: none; background: ${this.config.buttonColor}; color: white; border-radius: 6px; cursor: pointer; font-size: 14px;"
            >
              Send Feedback
            </button>
          </div>
        </form>
        
        <div id="feedbackpulse-status" style="display: none; text-align: center; padding: 20px;">
          <div id="feedbackpulse-status-message"></div>
        </div>
      `;
    }

    /**
     * Attaches event listeners to widget elements
     */
    attachEventListeners() {
      // Button click
      this.button.addEventListener('click', this.toggleWidget);
      
      // Modal interactions (will be attached when modal is created)
      document.addEventListener('keydown', this.handleEscapeKey);
    }

    /**
     * Attaches event listeners to modal elements (called when modal is opened)
     */
    attachModalEventListeners() {
      const closeBtn = document.getElementById('feedbackpulse-close');
      const cancelBtn = document.getElementById('feedbackpulse-cancel');
      const form = document.getElementById('feedbackpulse-form');
      
      if (closeBtn) closeBtn.addEventListener('click', this.closeWidget);
      if (cancelBtn) cancelBtn.addEventListener('click', this.closeWidget);
      if (form) form.addEventListener('submit', this.handleSubmit);
      if (this.overlay) this.overlay.addEventListener('click', this.handleOverlayClick);
    }

    /**
     * Toggles the widget modal open/closed
     */
    toggleWidget() {
      if (this.isOpen) {
        this.closeWidget();
      } else {
        this.openWidget();
      }
    }

    /**
     * Opens the feedback modal
     */
    openWidget() {
      this.isOpen = true;
      this.overlay.style.display = 'flex';
      this.attachModalEventListeners();
      
      // Focus on the message textarea
      setTimeout(() => {
        const messageField = document.getElementById('feedbackpulse-message');
        if (messageField) messageField.focus();
      }, 100);
    }

    /**
     * Closes the feedback modal
     */
    closeWidget() {
      this.isOpen = false;
      this.overlay.style.display = 'none';
      this.resetForm();
    }

    /**
     * Handles clicks on the overlay (outside the modal)
     * @param {Event} event - Click event
     */
    handleOverlayClick(event) {
      if (event.target === this.overlay) {
        this.closeWidget();
      }
    }

    /**
     * Handles escape key press to close the modal
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleEscapeKey(event) {
      if (event.key === 'Escape' && this.isOpen) {
        this.closeWidget();
      }
    }

    /**
     * Handles form submission
     * @param {Event} event - Submit event
     */
    async handleSubmit(event) {
      event.preventDefault();
      
      const form = event.target;
      const formData = new FormData(form);
      
      const feedbackData = {
        projectId: this.config.projectId,
        type: document.getElementById('feedbackpulse-type').value,
        message: document.getElementById('feedbackpulse-message').value,
        email: document.getElementById('feedbackpulse-email').value,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      try {
        await this.submitFeedback(feedbackData);
        this.showStatus('success', 'Thank you! Your feedback has been sent.');
        setTimeout(() => this.closeWidget(), 2000);
      } catch (error) {
        console.error('Failed to submit feedback:', error);
        this.showStatus('error', 'Sorry, there was an error sending your feedback. Please try again.');
      }
    }

    /**
     * Submits feedback to the FeedbackPulse API
     * @param {Object} feedbackData - The feedback data to submit
     * @returns {Promise<void>}
     */
    async submitFeedback(feedbackData) {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    }

    /**
     * Shows a status message in the modal
     * @param {string} type - 'success' or 'error'
     * @param {string} message - The message to display
     */
    showStatus(type, message) {
      const form = document.getElementById('feedbackpulse-form');
      const status = document.getElementById('feedbackpulse-status');
      const statusMessage = document.getElementById('feedbackpulse-status-message');
      
      if (form) form.style.display = 'none';
      if (status) {
        status.style.display = 'block';
        status.style.color = type === 'success' ? '#28a745' : '#dc3545';
      }
      if (statusMessage) statusMessage.textContent = message;
    }

    /**
     * Resets the form and status display
     */
    resetForm() {
      const form = document.getElementById('feedbackpulse-form');
      const status = document.getElementById('feedbackpulse-status');
      
      if (form) {
        form.style.display = 'block';
        form.reset();
      }
      if (status) status.style.display = 'none';
    }

    /**
     * Destroys the widget and removes it from the DOM
     */
    destroy() {
      if (this.button) {
        this.button.remove();
        this.button = null;
      }
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
      }
      this.modal = null;
      this.isOpen = false;
      
      document.removeEventListener('keydown', this.handleEscapeKey);
    }
  }

  /**
   * Global widget namespace
   */
  window.FeedbackPulseWidget = {
    instance: null,

    /**
     * Initializes the widget with the provided configuration
     * @param {Object} config - Widget configuration
     */
    init: function(config) {
      // Destroy existing instance if any
      if (this.instance) {
        this.instance.destroy();
      }

      // Create new instance
      this.instance = new FeedbackPulseWidget(config);
    },

    /**
     * Destroys the current widget instance
     */
    destroy: function() {
      if (this.instance) {
        this.instance.destroy();
        this.instance = null;
      }
    }
  };

})(window);