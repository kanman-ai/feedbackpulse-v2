/**
 * Widget JavaScript Bundle Route
 * 
 * Serves the compiled widget JavaScript bundle that can be embedded in third-party websites.
 * This route returns the widget script with proper headers for cross-origin usage.
 */

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * GET handler - Serves the widget JavaScript bundle
 * 
 * @param request - The incoming request object
 * @returns JavaScript file response with appropriate headers
 */
export async function GET(request: NextRequest) {
  try {
    // In production, this would serve a pre-built widget bundle
    // For development, we'll serve a simple bootstrap script
    const widgetScript = `
/**
 * FeedbackPulse Widget Bootstrap Script
 * This script initializes the feedback widget on third-party websites
 */

(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.FeedbackPulseWidget) {
    return;
  }

  // Extract configuration from script tag data attributes
  const scripts = document.querySelectorAll('script[data-project-id]');
  const currentScript = scripts[scripts.length - 1];
  
  if (!currentScript) {
    console.error('FeedbackPulse: Could not find widget script tag');
    return;
  }

  const config = {
    projectId: currentScript.getAttribute('data-project-id'),
    buttonText: currentScript.getAttribute('data-button-text') || 'Feedback',
    themeColor: currentScript.getAttribute('data-theme-color') || '#3b82f6',
    questionText: decodeURIComponent(currentScript.getAttribute('data-question-text') || 'How can we improve your experience?'),
    baseUrl: currentScript.src.split('/widget.js')[0]
  };

  if (!config.projectId) {
    console.error('FeedbackPulse: data-project-id attribute is required');
    return;
  }

  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'feedbackpulse-widget-container';
  widgetContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 999999;';
  document.body.appendChild(widgetContainer);

  // Load and inject widget CSS
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = config.baseUrl + '/widget.css';
  document.head.appendChild(cssLink);

  // Simple widget implementation for demonstration
  // In production, this would load the React component
  function createWidget() {
    const widget = document.createElement('div');
    widget.className = 'fp-widget';
    widget.innerHTML = \`
      <style>
        .fp-widget {
          --theme-color: \${config.themeColor};
        }
        .fp-trigger {
          background-color: var(--theme-color);
          color: white;
          border: none;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fp-trigger:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }
        .fp-panel {
          position: absolute;
          bottom: 70px;
          right: 0;
          width: 320px;
          max-height: 400px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          border: 1px solid #e5e7eb;
          overflow: hidden;
          transform: translateY(10px);
          opacity: 0;
          transition: all 0.3s ease;
          pointer-events: none;
        }
        .fp-panel.visible {
          transform: translateY(0);
          opacity: 1;
          pointer-events: auto;
        }
        .fp-header {
          background: var(--theme-color);
          color: white;
          padding: 16px;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .fp-close {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fp-content {
          padding: 20px;
        }
        .fp-rating-selector {
          margin-bottom: 16px;
        }
        .fp-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #374151;
        }
        .fp-stars {
          display: flex;
          gap: 4px;
        }
        .fp-star {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #d1d5db;
          transition: color 0.2s ease;
        }
        .fp-star:hover,
        .fp-star.active {
          color: #fbbf24;
        }
        .fp-textarea {
          width: 100%;
          min-height: 80px;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          margin-bottom: 12px;
        }
        .fp-textarea:focus {
          outline: none;
          border-color: var(--theme-color);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .fp-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        .fp-button {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .fp-button-secondary {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
        }
        .fp-button-secondary:hover {
          background: #e5e7eb;
        }
        .fp-button-primary {
          background: var(--theme-color);
          border: 1px solid var(--theme-color);
          color: white;
        }
        .fp-button-primary:hover {
          opacity: 0.9;
        }
        .fp-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      </style>
      <button class="fp-trigger" onclick="toggleWidget()">\${config.buttonText}</button>
      <div class="fp-panel" id="fp-panel">
        <div class="fp-header">
          <span>\${config.buttonText}</span>
          <button class="fp-close" onclick="toggleWidget()">×</button>
        </div>
        <div class="fp-content">
          <div class="fp-rating-selector">
            <label class="fp-label">How would you rate your experience?</label>
            <div class="fp-stars">
              <button class="fp-star" onclick="selectRating(1)">★</button>
              <button class="fp-star" onclick="selectRating(2)">★</button>
              <button class="fp-star" onclick="selectRating(3)">★</button>
              <button class="fp-star" onclick="selectRating(4)">★</button>
              <button class="fp-star" onclick="selectRating(5)">★</button>
            </div>
          </div>
          <textarea class="fp-textarea" placeholder="\${config.questionText}" id="fp-comment"></textarea>
          <div class="fp-actions">
            <button class="fp-button fp-button-secondary" onclick="toggleWidget()">Cancel</button>
            <button class="fp-button fp-button-primary" onclick="submitFeedback()">Send Feedback</button>
          </div>
        </div>
      </div>
    \`;

    widgetContainer.appendChild(widget);

    // Widget functionality
    let isExpanded = false;
    let selectedRating = 0;

    window.toggleWidget = function() {
      isExpanded = !isExpanded;
      const panel = document.getElementById('fp-panel');
      if (isExpanded) {
        panel.classList.add('visible');
      } else {
        panel.classList.remove('visible');
      }
    };

    window.selectRating = function(rating) {
      selectedRating = rating;
      const stars = document.querySelectorAll('.fp-star');
      stars.forEach((star, index) => {
        if (index < rating) {
          star.classList.add('active');
        } else {
          star.classList.remove('active');
        }
      });
    };

    window.submitFeedback = function() {
      const comment = document.getElementById('fp-comment').value;
      if (!selectedRating) {
        alert('Please select a rating');
        return;
      }
      if (!comment.trim()) {
        alert('Please provide a comment');
        return;
      }

      // Submit to API (simplified for demo)
      fetch(config.baseUrl + '/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: config.projectId,
          rating: selectedRating,
          comment: comment,
          source: 'widget'
        })
      }).then(() => {
        alert('Thank you for your feedback!');
        toggleWidget();
      }).catch(() => {
        alert('Failed to submit feedback. Please try again.');
      });
    };
  }

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

  // Mark as initialized
  window.FeedbackPulseWidget = { version: '1.0.0', config };
})();
    `;

    return new NextResponse(widgetScript, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Error serving widget script:', error)
    return new NextResponse('// Error loading widget', {
      status: 500,
      headers: {
        'Content-Type': 'application/javascript',
      },
    })
  }
}