/**
 * FeedbackPulse v2 - Widget Bundle
 * 
 * This file provides the complete widget system that can be embedded on any website.
 * It includes the React component, styles, and initialization script that automatically
 * loads and renders the feedback widget based on configuration.
 * 
 * Usage:
 * <script src="https://your-domain.com/widget.js" data-project-id="your-project-id"></script>
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { FeedbackWidget } from './FeedbackWidget';
import './widget.css';

/**
 * Configuration interface for the widget
 */
interface WidgetConfig {
  projectId: string;
  apiUrl?: string;
  theme?: {
    primary?: string;
    secondary?: string;
    text?: string;
    background?: string;
  };
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoLoad?: boolean;
}

/**
 * Default configuration values
 */
const defaultConfig: Partial<WidgetConfig> = {
  apiUrl: '/api/feedback',
  position: 'bottom-right',
  autoLoad: true,
  theme: {
    primary: '#007bff',
    secondary: '#6c757d',
    text: '#ffffff',
    background: '#ffffff'
  }
};

/**
 * Widget manager class that handles initialization, configuration, and lifecycle
 */
class FeedbackWidgetManager {
  private config: WidgetConfig;
  private container: HTMLElement | null = null;
  private root: any = null;

  constructor(config: WidgetConfig) {
    this.config = { ...defaultConfig, ...config } as WidgetConfig;
  }

  /**
   * Initializes the widget by creating a container and rendering the React component
   * 
   * @returns Promise that resolves when the widget is fully initialized
   */
  async init(): Promise<void> {
    try {
      // Check if widget is already initialized
      if (this.container) {
        console.warn('FeedbackWidget: Already initialized');
        return;
      }

      // Validate required configuration
      if (!this.config.projectId) {
        throw new Error('FeedbackWidget: projectId is required');
      }

      // Create container element
      this.container = document.createElement('div');
      this.container.id = 'feedback-widget-container';
      this.container.style.cssText = `
        position: fixed;
        z-index: 9999;
        pointer-events: none;
      `;

      // Append to body
      document.body.appendChild(this.container);

      // Enable pointer events for the widget content
      this.container.style.pointerEvents = 'auto';

      // Create React root and render component
      this.root = createRoot(this.container);
      this.root.render(
        <FeedbackWidget
          projectId={this.config.projectId}
          apiUrl={this.config.apiUrl!}
          theme={this.config.theme}
          position={this.config.position}
        />
      );

      console.log('FeedbackWidget: Initialized successfully');
    } catch (error) {
      console.error('FeedbackWidget: Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Destroys the widget by unmounting the React component and removing the container
   */
  destroy(): void {
    try {
      if (this.root) {
        this.root.unmount();
        this.root = null;
      }

      if (this.container) {
        document.body.removeChild(this.container);
        this.container = null;
      }

      console.log('FeedbackWidget: Destroyed successfully');
    } catch (error) {
      console.error('FeedbackWidget: Failed to destroy:', error);
    }
  }

  /**
   * Updates the widget configuration and re-renders if necessary
   * 
   * @param newConfig - Partial configuration to merge with existing config
   */
  updateConfig(newConfig: Partial<WidgetConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.root) {
      this.root.render(
        <FeedbackWidget
          projectId={this.config.projectId}
          apiUrl={this.config.apiUrl!}
          theme={this.config.theme}
          position={this.config.position}
        />
      );
    }
  }

  /**
   * Gets the current widget configuration
   * 
   * @returns Current configuration object
   */
  getConfig(): WidgetConfig {
    return { ...this.config };
  }
}

/**
 * Parses configuration from script tag data attributes
 * 
 * @param scriptElement - The script element containing data attributes
 * @returns Parsed configuration object
 */
function parseConfigFromScript(scriptElement: HTMLScriptElement): WidgetConfig {
  const config: Partial<WidgetConfig> = {};

  // Extract data attributes
  const projectId = scriptElement.dataset.projectId;
  if (!projectId) {
    throw new Error('FeedbackWidget: data-project-id attribute is required');
  }
  config.projectId = projectId;

  // Optional configuration
  if (scriptElement.dataset.apiUrl) {
    config.apiUrl = scriptElement.dataset.apiUrl;
  }

  if (scriptElement.dataset.position) {
    config.position = scriptElement.dataset.position as any;
  }

  if (scriptElement.dataset.autoLoad === 'false') {
    config.autoLoad = false;
  }

  // Theme configuration
  if (scriptElement.dataset.theme) {
    try {
      config.theme = JSON.parse(scriptElement.dataset.theme);
    } catch (error) {
      console.warn('FeedbackWidget: Invalid theme JSON, using defaults');
    }
  }

  return config as WidgetConfig;
}

/**
 * Auto-initialization function that runs when the script loads
 * Looks for script tags with the widget configuration and initializes automatically
 */
function autoInit(): void {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
    return;
  }

  try {
    // Find the script tag that loaded this widget
    const scripts = document.querySelectorAll('script[data-project-id]');
    
    scripts.forEach((script) => {
      const scriptElement = script as HTMLScriptElement;
      
      try {
        const config = parseConfigFromScript(scriptElement);
        
        if (config.autoLoad !== false) {
          const widget = new FeedbackWidgetManager(config);
          widget.init();
          
          // Store widget instance globally for access
          (window as any).feedbackWidget = widget;
        }
      } catch (error) {
        console.error('FeedbackWidget: Failed to auto-initialize:', error);
      }
    });
  } catch (error) {
    console.error('FeedbackWidget: Auto-initialization error:', error);
  }
}

// Global API for manual widget management
(window as any).FeedbackWidget = {
  /**
   * Creates and initializes a new widget instance with the provided configuration
   * 
   * @param config - Widget configuration
   * @returns Promise resolving to the widget manager instance
   */
  init: async (config: WidgetConfig): Promise<FeedbackWidgetManager> => {
    const widget = new FeedbackWidgetManager(config);
    await widget.init();
    return widget;
  },
  
  /**
   * Widget manager class for advanced usage
   */
  Manager: FeedbackWidgetManager
};

// Auto-initialize when script loads
autoInit();

// Export for module usage
export { FeedbackWidget, FeedbackWidgetManager, type WidgetConfig };
export default FeedbackWidget;
