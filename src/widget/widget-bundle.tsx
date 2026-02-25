/**
 * FeedbackPulse Widget Bundle Entry Point
 * 
 * This file serves as the entry point for the widget bundle that gets loaded
 * by the bootstrap script. It handles mounting the React widget component
 * into the shadow DOM with all necessary dependencies.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import FeedbackWidget, { WidgetConfig } from './FeedbackWidget';

/**
 * Mounts the FeedbackPulse widget into the provided shadow DOM container.
 * This function is exposed globally and called by the bootstrap script.
 * 
 * @param shadowRoot - The shadow DOM root element to mount the widget into
 * @param config - Widget configuration parsed from the script tag parameters
 */
function mountWidget(shadowRoot: ShadowRoot, config: WidgetConfig): void {
  try {
    // Create a container div for the React app
    const container = document.createElement('div');
    container.id = 'feedbackpulse-widget-root';
    
    // Add the container to the shadow root
    shadowRoot.appendChild(container);
    
    // Create React root and render the widget
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <FeedbackWidget 
          config={config}
          onClose={() => {
            // Optional: Handle widget close events
            console.log('FeedbackPulse widget closed');
          }}
        />
      </React.StrictMode>
    );
    
    console.log('FeedbackPulse widget mounted successfully');
    
  } catch (error) {
    console.error('Failed to mount FeedbackPulse widget:', error);
    
    // Fallback: Show basic HTML error message
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
}

// Expose the mount function globally for the bootstrap script to call
declare global {
  interface Window {
    FeedbackPulseWidgetMount: typeof mountWidget;
  }
}

window.FeedbackPulseWidgetMount = mountWidget;

// Also expose it as a named export for testing purposes
export { mountWidget };