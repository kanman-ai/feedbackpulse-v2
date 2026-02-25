/**
 * FeedbackPulse Widget Script Loader
 * 
 * This is the main script that users embed in their websites to load the 
 * FeedbackPulse feedback widget. It handles initialization, shadow DOM creation,
 * query parameter parsing, and dynamic loading of the React widget bundle.
 * 
 * Usage:
 * <script src='https://feedbackpulse.com/widget.js?project_id=XXX&theme=#FF5733&question=How%20can%20we%20improve'></script>
 */

(function() {
  'use strict';

  /**
   * Configuration object containing widget settings parsed from script tag
   * @typedef {Object} WidgetConfig
   * @property {string} projectId - The project ID for this widget instance
   * @property {string} theme - Theme color (hex color code)
   * @property {string} question - The question to display in the widget
   * @property {string} position - Widget position (bottom-right, bottom-left, etc.)
   * @property {string} baseUrl - Base URL for API calls and bundle loading
   */

  /**
   * Main FeedbackPulse widget loader class.
   * Handles initialization, configuration parsing, and widget mounting.
   */
  class FeedbackPulseWidget {
    constructor() {
      this.config = null;
      this.shadowRoot = null;
      this.widgetContainer = null;
      this.isLoaded = false;
      this.isLoading = false;
    }

    /**
     * Initializes the widget by parsing configuration and creating the shadow DOM.
     * This is the main entry point called when the script loads.
     */
    init() {
      try {
        // Avoid duplicate initialization
        if (this.isLoaded || this.isLoading) {
          console.warn('FeedbackPulse widget already initialized');
          return;
        }

        this.isLoading = true;
        
        // Parse configuration from script tag
        this.config = this.parseConfig();
        
        // Validate required configuration
        if (!this.validateConfig(this.config)) {
          throw new Error('Invalid widget configuration');
        }

        // Create shadow DOM container
        this.createShadowDOM();
        
        // Load and mount the React widget
        this.loadWidget();
        
      } catch (error) {
        console.error('FeedbackPulse widget initialization failed:', error);
        this.showError('Failed to load feedback widget');
        this.isLoading = false;
      }
    }

    /**
     * Parses configuration from the script tag's query parameters.
     * Looks for the current script tag and extracts parameters from its src URL.
     * 
     * @returns {WidgetConfig} Configuration object with parsed parameters
     */
    parseConfig() {
      // Find the current script tag
      const currentScript = document.currentScript || this.getCurrentScript();
      
      if (!currentScript || !currentScript.src) {
        throw new Error('Could not find widget script tag');
      }

      const url = new URL(currentScript.src);
      const params = new URLSearchParams(url.search);

      // Extract configuration from URL parameters
      const config = {
        projectId: params.get('project_id'),
        theme: params.get('theme') || '#3B82F6', // Default blue theme
        question: params.get('question') || 'How can we improve?',
        position: params.get('position') || 'bottom-right',
        baseUrl: url.origin
      };

      return config;
    }

    /**
     * Fallback method to find the current script when document.currentScript is not available.
     * This handles cases in older browsers or async script loading.
     * 
     * @returns {HTMLScriptElement|null} The current script element or null
     */
    getCurrentScript() {
      const scripts = document.getElementsByTagName('script');
      for (let i = scripts.length - 1; i >= 0; i--) {
        if (scripts[i].src && scripts[i].src.includes('widget.js')) {
          return scripts[i];
        }
      }
      return null;
    }

    /**
     * Validates the parsed configuration to ensure all required parameters are present.
     * 
     * @param {WidgetConfig} config - The configuration object to validate
     * @returns {boolean} True if configuration is valid, false otherwise
     */
    validateConfig(config) {
      if (!config.projectId) {
        console.error('FeedbackPulse widget: project_id parameter is required');
        return false;
      }

      // Validate theme color format (hex color)
      if (config.theme && !/^#[0-9A-F]{6}$/i.test(config.theme)) {
        console.warn('FeedbackPulse widget: Invalid theme color format, using default');
        config.theme = '#3B82F6';
      }

      return true;
    }

    /**
     * Creates the shadow DOM container for the widget.
     * Shadow DOM ensures the widget styles don't conflict with the host page.
     */
    createShadowDOM() {
      // Create container element
      this.widgetContainer = document.createElement('div');
      this.widgetContainer.id = 'feedbackpulse-widget';
      this.widgetContainer.style.cssText = `
        position: fixed;
        z-index: 2147483647;
        ${this.getPositionStyles()}
      `;

      // Create shadow root for style isolation
      this.shadowRoot = this.widgetContainer.attachShadow({ mode: 'closed' });
      
      // Add container to page
      document.body.appendChild(this.widgetContainer);
    }

    /**
     * Gets the CSS styles for widget positioning based on configuration.
     * 
     * @returns {string} CSS styles for positioning
     */
    getPositionStyles() {
      const position = this.config.position;
      const offset = '20px';

      switch (position) {
        case 'bottom-left':
          return `bottom: ${offset}; left: ${offset};`;
        case 'top-right':
          return `top: ${offset}; right: ${offset};`;
        case 'top-left':
          return `top: ${offset}; left: ${offset};`;
        case 'bottom-right':
        default:
          return `bottom: ${offset}; right: ${offset};`;
      }
    }

    /**
     * Loads the React widget bundle and mounts the widget component.
     * Uses dynamic import to load the bundled widget code.
     */
    loadWidget() {
      // Create loading indicator
      this.showLoading();

      // Load widget bundle (this would be the built React component)
      const widgetBundleUrl = `${this.config.baseUrl}/widget-bundle.js`;
      
      // Create script element to load the widget bundle
      const script = document.createElement('script');
      script.src = widgetBundleUrl;
      script.onload = () => this.onWidgetBundleLoaded();
      script.onerror = () => this.onWidgetBundleError();
      
      // Add script to shadow root
      this.shadowRoot.appendChild(script);
    }

    /**
     * Called when the widget bundle loads successfully.
     * Mounts the React widget component in the shadow DOM.
     */
    onWidgetBundleLoaded() {
      try {
        // The widget bundle should expose a global function to mount the widget
        if (typeof window.FeedbackPulseWidgetMount === 'function') {
          window.FeedbackPulseWidgetMount(this.shadowRoot, this.config);
          this.isLoaded = true;
          this.isLoading = false;
        } else {
          throw new Error('Widget bundle did not expose mount function');
        }
      } catch (error) {
        console.error('Failed to mount widget:', error);
        this.showError('Failed to load feedback widget');
        this.isLoading = false;
      }
    }

    /**
     * Called when the widget bundle fails to load.
     * Shows an error message to the user.
     */
    onWidgetBundleError() {
      console.error('Failed to load widget bundle');
      this.showError('Failed to load feedback widget');
      this.isLoading = false;
    }

    /**
     * Shows a loading indicator in the widget container.
     */
    showLoading() {
      const loadingHTML = `
        <style>
          .fp-loading {
            width: 60px;
            height: 60px;
            background: ${this.config.theme};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: fp-pulse 2s infinite;
          }
          
          @keyframes fp-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        </style>
        <div class="fp-loading">...</div>
      `;
      
      this.shadowRoot.innerHTML = loadingHTML;
    }

    /**
     * Shows an error message in the widget container.
     * 
     * @param {string} message - Error message to display
     */
    showError(message) {
      const errorHTML = `
        <style>
          .fp-error {
            padding: 10px;
            background: #fee;
            border: 1px solid #fcc;
            border-radius: 4px;
            color: #900;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            max-width: 200px;
          }
        </style>
        <div class="fp-error">${message}</div>
      `;
      
      this.shadowRoot.innerHTML = errorHTML;
    }
  }

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      const widget = new FeedbackPulseWidget();
      widget.init();
    });
  } else {
    // DOM is already ready
    const widget = new FeedbackPulseWidget();
    widget.init();
  }

  // Expose widget class globally for debugging
  window.FeedbackPulseWidget = FeedbackPulseWidget;

})();