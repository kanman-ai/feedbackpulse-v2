/**
 * FeedbackPulse Widget Embed Script
 * 
 * This script provides the embeddable widget functionality for FeedbackPulse.
 * It reads data attributes from the script tag, loads the widget library dynamically,
 * and initializes the widget with the provided configuration.
 * 
 * Usage:
 * <script src="https://feedbackpulse.com/widget/embed.js" 
 *         data-project-id="your-project-id"
 *         data-button-color="#007bff"
 *         data-button-label="Feedback"></script>
 */

(function() {
  'use strict';

  /**
   * Configuration object for the FeedbackPulse widget
   * @typedef {Object} WidgetConfig
   * @property {string} projectId - The project ID for this widget instance
   * @property {string} buttonColor - The color of the feedback button
   * @property {string} buttonLabel - The text label for the feedback button
   * @property {string} position - Position of the widget on page (bottom-right, bottom-left, etc.)
   * @property {string} theme - Widget theme (light, dark)
   * @property {string} widgetUrl - The URL to load the widget library from
   */

  /**
   * Extracts configuration from the script tag's data attributes
   * @returns {WidgetConfig} The widget configuration object
   */
  function getWidgetConfig() {
    // Find the current script tag
    const currentScript = document.currentScript || 
      document.querySelector('script[src*="embed.js"]');
    
    if (!currentScript) {
      console.error('FeedbackPulse: Could not find embed script tag');
      return false;
    }

    // Extract data attributes
    const dataset = currentScript.dataset;
    
    // Validate required attributes
    if (!dataset.projectId) {
      console.error('FeedbackPulse: data-project-id is required');
      return false;
    }

    return {
      projectId: dataset.projectId,
      buttonColor: dataset.buttonColor || '#007bff',
      buttonLabel: dataset.buttonLabel || 'Feedback',
      position: dataset.position || 'bottom-right',
      theme: dataset.theme || 'light',
      widgetUrl: dataset.widgetUrl || '/widget/widget.js'
    };
  }

  /**
   * Loads the widget library script dynamically
   * @param {string} widgetUrl - URL of the widget library
   * @returns {Promise<void>} Promise that resolves when the script is loaded
   */
  function loadWidgetScript(widgetUrl) {
    return new Promise((resolve, reject) => {
      // Check if widget is already loaded
      if (window.FeedbackPulseWidget) {
        resolve();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = widgetUrl;
      script.async = true;
      
      // Handle load success
      script.onload = function() {
        resolve();
      };
      
      // Handle load error
      script.onerror = function() {
        reject(new Error(`Failed to load widget library from ${widgetUrl}`));
      };

      // Append to head
      document.head.appendChild(script);
    });
  }

  /**
   * Initializes the FeedbackPulse widget with the provided configuration
   * @param {WidgetConfig} config - The widget configuration
   */
  function initializeWidget(config) {
    // Store config globally for the widget to access
    window.feedbackPulseConfig = config;
    
    // Wait for the widget library to be available
    const maxAttempts = 50; // 5 seconds timeout
    let attempts = 0;

    function tryInitialize() {
      attempts++;
      
      if (window.FeedbackPulseWidget && typeof window.FeedbackPulseWidget.init === 'function') {
        try {
          window.FeedbackPulseWidget.init(config);
          console.log('FeedbackPulse widget initialized successfully');
        } catch (error) {
          console.error('FeedbackPulse: Widget initialization failed', error);
        }
      } else if (attempts < maxAttempts) {
        // Widget not ready yet, try again in 100ms
        setTimeout(tryInitialize, 100);
      } else {
        console.error('FeedbackPulse: Widget library failed to load within timeout');
      }
    }

    tryInitialize();
  }

  /**
   * Main initialization function that orchestrates the widget loading process
   */
  function initEmbed() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initEmbed);
      return;
    }

    try {
      // Get widget configuration from script tag
      const config = getWidgetConfig();
      if (!config) {
        return; // Error already logged in getWidgetConfig
      }

      // Load widget library
      loadWidgetScript(config.widgetUrl)
        .then(() => {
          // Initialize widget once library is loaded
          initializeWidget(config);
        })
        .catch((error) => {
          console.error('FeedbackPulse: Failed to load widget', error);
        });

    } catch (error) {
      console.error('FeedbackPulse: Embed initialization failed', error);
    }
  }

  // Start the initialization process
  initEmbed();

})();