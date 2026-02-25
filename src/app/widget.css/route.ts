/**
 * Widget CSS Styles Route
 * 
 * Serves the CSS styles for the feedback widget that gets embedded in third-party websites.
 * Returns the compiled widget styles with proper headers for cross-origin usage.
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * GET handler - Serves the widget CSS styles
 * 
 * @param request - The incoming request object
 * @returns CSS file response with appropriate headers
 */
export async function GET(request: NextRequest) {
  try {
    // Widget CSS styles - extracted from widget.css and enhanced
    const widgetCSS = `
/**
 * FeedbackPulse Widget Styles
 * Scoped styles for the feedback widget to avoid conflicts with host sites
 */

.fp-widget {
  --theme-color: #3b82f6;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  position: relative;
  z-index: 999999;
}

.fp-widget * {
  box-sizing: border-box;
}

.fp-trigger {
  background-color: var(--theme-color);
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  position: relative;
  overflow: hidden;
}

.fp-trigger:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.fp-trigger:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.fp-trigger:active {
  transform: scale(0.98);
}

.fp-trigger.expanded {
  background-color: #ef4444;
  font-size: 20px;
}

.fp-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 320px;
  min-height: 200px;
  max-height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transform: translateY(10px) scale(0.95);
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  transform-origin: bottom right;
}

.fp-panel.visible {
  transform: translateY(0) scale(1);
  opacity: 1;
  pointer-events: auto;
}

.fp-header {
  background: linear-gradient(135deg, var(--theme-color), color-mix(in srgb, var(--theme-color) 90%, #000 10%));
  color: white;
  padding: 16px 20px;
  font-weight: 600;
  font-size: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.fp-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.fp-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  outline: none;
}

.fp-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.fp-content {
  padding: 20px;
  overflow-y: auto;
  max-height: 380px;
}

.fp-rating-selector {
  margin-bottom: 20px;
}

.fp-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #374151;
}

.fp-stars {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.fp-star {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #d1d5db;
  transition: all 0.2s ease;
  padding: 4px;
  border-radius: 4px;
  outline: none;
  position: relative;
}

.fp-star:hover {
  color: #fbbf24;
  transform: scale(1.1);
}

.fp-star:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.fp-star.active {
  color: #f59e0b;
}

.fp-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fp-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  background: #fafafa;
  transition: all 0.2s ease;
  outline: none;
  line-height: 1.5;
}

.fp-textarea:focus {
  border-color: var(--theme-color);
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.fp-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: #fafafa;
  transition: all 0.2s ease;
  outline: none;
}

.fp-input:focus {
  border-color: var(--theme-color);
  background: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.fp-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  margin: 8px 0;
}

.fp-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.fp-button {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  border: 2px solid transparent;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fp-button-secondary {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #374151;
}

.fp-button-secondary:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.fp-button-secondary:focus {
  box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.3);
}

.fp-button-primary {
  background: var(--theme-color);
  border-color: var(--theme-color);
  color: white;
}

.fp-button-primary:hover {
  background: color-mix(in srgb, var(--theme-color) 90%, #000 10%);
  border-color: color-mix(in srgb, var(--theme-color) 90%, #000 10%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.fp-button-primary:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.fp-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.fp-success {
  text-align: center;
  padding: 20px;
}

.fp-success-icon {
  font-size: 48px;
  color: #10b981;
  margin-bottom: 16px;
}

.fp-success-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.fp-success-message {
  color: #6b7280;
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

/* Responsive design for smaller screens */
@media (max-width: 400px) {
  .fp-panel {
    width: calc(100vw - 40px);
    right: 20px;
    left: 20px;
  }
  
  .fp-trigger {
    width: 50px;
    height: 50px;
    font-size: 14px;
  }
  
  .fp-panel {
    bottom: 60px;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .fp-trigger {
    border: 2px solid white;
  }
  
  .fp-panel {
    border: 2px solid #000;
  }
  
  .fp-star {
    border: 1px solid #000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .fp-trigger,
  .fp-panel,
  .fp-star,
  .fp-button {
    transition: none;
  }
  
  .fp-trigger:hover {
    transform: none;
  }
}

/* Dark mode support for host sites */
@media (prefers-color-scheme: dark) {
  .fp-panel {
    background: #1f2937;
    border-color: #374151;
  }
  
  .fp-content {
    color: #e5e7eb;
  }
  
  .fp-label {
    color: #d1d5db;
  }
  
  .fp-textarea,
  .fp-input {
    background: #374151;
    border-color: #4b5563;
    color: #e5e7eb;
  }
  
  .fp-textarea:focus,
  .fp-input:focus {
    background: #4b5563;
  }
  
  .fp-button-secondary {
    background: #374151;
    border-color: #4b5563;
    color: #d1d5db;
  }
  
  .fp-button-secondary:hover {
    background: #4b5563;
  }
}
`;

    return new NextResponse(widgetCSS, {
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Error serving widget CSS:', error)
    return new NextResponse('/* Error loading widget styles */', {
      status: 500,
      headers: {
        'Content-Type': 'text/css',
      },
    })
  }
}