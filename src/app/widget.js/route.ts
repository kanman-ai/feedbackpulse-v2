/**
 * Widget JavaScript Route
 * 
 * Serves the compiled FeedbackWidget JavaScript bundle that can be embedded
 * on any website. The widget automatically initializes based on script tag
 * data attributes and provides a floating feedback button with modal.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET handler that serves the widget JavaScript bundle
 * 
 * @param request - Next.js request object
 * @returns JavaScript response with proper headers
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const widgetScript = `
/**
 * FeedbackPulse Widget v2.0
 * Embeddable feedback widget for collecting user feedback
 */
(function() {
  'use strict';
  
  if (window.FeedbackWidgetLoaded) {
    console.warn('FeedbackWidget: Already loaded');
    return;
  }
  window.FeedbackWidgetLoaded = true;
  
  function createWidget(config) {
    const container = document.createElement('div');
    container.style.cssText = \`
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    \`;
    
    const button = document.createElement('button');
    button.textContent = '💬 Feedback';
    button.style.cssText = \`
      padding: 12px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 25px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
      transition: all 0.3s ease;
    \`;
    
    button.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 6px 20px rgba(0, 123, 255, 0.4)';
    });
    
    button.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
    });
    
    button.addEventListener('click', function() {
      openFeedbackModal(config);
    });
    
    container.appendChild(button);
    document.body.appendChild(container);
    
    return container;
  }
  
  function openFeedbackModal(config) {
    const overlay = document.createElement('div');
    overlay.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
    \`;
    
    const modal = document.createElement('div');
    modal.style.cssText = \`
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    \`;
    
    modal.innerHTML = \`
      <div style="padding: 24px; border-bottom: 1px solid #e1e5e9; display: flex; justify-content: space-between; align-items: center;">
        <h2 style="margin: 0; font-size: 20px; color: #2c3e50;">Share Your Feedback</h2>
        <button onclick="this.closest('.feedback-overlay').remove()" style="background: none; border: none; font-size: 20px; cursor: pointer; padding: 4px;">✕</button>
      </div>
      <form style="padding: 24px;" onsubmit="submitFeedback(event, '\${config.projectId}', '\${config.apiUrl || '/api/feedback'}')">
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Rate your experience</label>
          <div class="star-rating" style="display: flex; gap: 4px; margin-bottom: 4px;">
            <span onclick="setRating(1)" style="font-size: 24px; cursor: pointer; filter: grayscale(100%) brightness(0.7);">⭐</span>
            <span onclick="setRating(2)" style="font-size: 24px; cursor: pointer; filter: grayscale(100%) brightness(0.7);">⭐</span>
            <span onclick="setRating(3)" style="font-size: 24px; cursor: pointer; filter: grayscale(100%) brightness(0.7);">⭐</span>
            <span onclick="setRating(4)" style="font-size: 24px; cursor: pointer; filter: grayscale(100%) brightness(0.7);">⭐</span>
            <span onclick="setRating(5)" style="font-size: 24px; cursor: pointer; filter: grayscale(100%) brightness(0.7);">⭐</span>
          </div>
          <input type="hidden" name="rating" required>
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Message</label>
          <textarea name="comment" required placeholder="Tell us about your experience..." 
                    style="width: 100%; padding: 12px; border: 2px solid #e1e5e9; border-radius: 6px; resize: vertical; min-height: 100px;"></textarea>
        </div>
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">Email (optional)</label>
          <input type="email" name="email" placeholder="your@email.com" 
                 style="width: 100%; padding: 12px; border: 2px solid #e1e5e9; border-radius: 6px;">
        </div>
        <button type="submit" style="width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">
          Submit Feedback
        </button>
      </form>
    \`;
    
    overlay.className = 'feedback-overlay';
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
    
    window.setRating = function(rating) {
      const stars = modal.querySelectorAll('.star-rating span');
      const ratingInput = modal.querySelector('input[name="rating"]');
      
      stars.forEach((star, index) => {
        star.style.filter = index < rating ? 'none' : 'grayscale(100%) brightness(0.7)';
      });
      
      ratingInput.value = rating;
    };
    
    window.submitFeedback = async function(event, projectId, apiUrl) {
      event.preventDefault();
      const form = event.target;
      const formData = new FormData(form);
      const submitButton = form.querySelector('button[type="submit"]');
      
      submitButton.textContent = 'Submitting...';
      submitButton.disabled = true;
      
      const data = {
        project_id: projectId,
        rating: parseInt(formData.get('rating')),
        comment: formData.get('comment'),
        email: formData.get('email') || undefined,
        source: 'widget'
      };
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          modal.innerHTML = \`
            <div style="padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
              <h3 style="margin: 0 0 8px; color: #28a745;">Thank you!</h3>
              <p style="margin: 0; color: #6c757d;">Your feedback has been submitted successfully.</p>
            </div>
          \`;
          setTimeout(() => overlay.remove(), 2000);
        } else {
          throw new Error('Failed to submit');
        }
      } catch (error) {
        submitButton.textContent = 'Submit Feedback';
        submitButton.disabled = false;
        alert('Failed to submit feedback. Please try again.');
      }
    };
  }
  
  function autoInit() {
    const scripts = document.querySelectorAll('script[data-project-id]');
    scripts.forEach(script => {
      const config = {
        projectId: script.dataset.projectId,
        apiUrl: script.dataset.apiUrl || '/api/feedback',
        position: script.dataset.position || 'bottom-right'
      };
      
      if (config.projectId) {
        createWidget(config);
      }
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
  
  window.FeedbackWidget = {
    create: createWidget,
    open: openFeedbackModal
  };
  
})();
    `;

    return new NextResponse(widgetScript, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Widget JS route error:', error);
    return new NextResponse('console.error("Failed to load FeedbackWidget");', {
      status: 500,
      headers: {
        'Content-Type': 'application/javascript',
      },
    });
  }
}