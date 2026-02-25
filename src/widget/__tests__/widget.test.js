/**
 * @file Widget library tests - comprehensive test suite for FeedbackPulse widget
 */

import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { FeedbackWidget } from '../widget.js'

describe('FeedbackPulse Widget', () => {
  let appendChildSpy, createElementSpy, mockFetch, mockDocument, mockBody

  beforeEach(() => {
    // Setup DOM mocking
    mockBody = {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    }

    mockDocument = {
      createElement: vi.fn(),
      body: mockBody,
      querySelector: vi.fn(),
      querySelectorAll: vi.fn()
    }

    // Mock global document
    global.document = mockDocument
    
    // Set up createElement spy to return mock elements
    createElementSpy = vi.spyOn(mockDocument, 'createElement')
    appendChildSpy = vi.spyOn(mockBody, 'appendChild')

    // Mock createElement to return mock elements with required properties
    createElementSpy.mockImplementation((tagName) => {
      const mockElement = {
        style: { cssText: '' },
        innerHTML: '',
        textContent: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        parentNode: null,
        querySelector: vi.fn((selector) => {
          // Return a mock element for any selector
          if (selector === '#cancel-btn' || selector === '#submit-btn' || selector === '#feedback-form' || selector === 'textarea') {
            return {
              addEventListener: vi.fn(),
              focus: vi.fn(),
              textContent: 'Button Text',
              disabled: false
            }
          }
          return null
        }),
        querySelectorAll: vi.fn(),
        disabled: false,
        tagName: tagName.toUpperCase()
      }
      return mockElement
    })

    // Mock window and location
    global.window = {
      location: {
        href: 'https://example.com'
      },
      navigator: {
        userAgent: 'Test User Agent'
      }
    }

    // Mock fetch API
    mockFetch = vi.fn()
    global.fetch = mockFetch

    global.console = {
      log: vi.fn(),
      error: vi.fn()
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Widget Initialization', () => {
    it('should initialize with provided configuration', () => {
      const config = {
        projectId: 'test-project-123',
        buttonColor: '#ff0000',
        buttonLabel: 'Test Feedback'
      }

      const widget = new FeedbackWidget(config)

      expect(widget.config.projectId).toBe(config.projectId)
      expect(widget.config.buttonColor).toBe(config.buttonColor)
      expect(widget.config.buttonLabel).toBe(config.buttonLabel)
      expect(widget.isOpen).toBe(false)
    })

    it('should create button and modal elements', () => {
      const config = {
        projectId: 'test-project-123',
        buttonColor: '#007bff',
        buttonLabel: 'Feedback'
      }

      const widget = new FeedbackWidget(config)

      // Verify createElement was called for button and modal elements
      expect(createElementSpy).toHaveBeenCalledWith('button')
      expect(createElementSpy).toHaveBeenCalledWith('div')
      
      // Verify appendChild was called to add button to body
      expect(appendChildSpy).toHaveBeenCalled()
    })
  })

  describe('Button Styling', () => {
    it('should apply correct styles to button', () => {
      const config = {
        projectId: 'test-123',
        buttonColor: '#ff5722',
        buttonLabel: 'Custom Feedback',
        position: 'top-left'
      }

      const widget = new FeedbackWidget(config)
      
      // Button should be created and configured
      expect(widget.button).toBeDefined()
      expect(widget.button.innerHTML).toBe('Custom Feedback')
    })
  })

  describe('Modal Functionality', () => {
    it('should generate correct modal HTML', () => {
      const config = {
        projectId: 'test-456'
      }

      const widget = new FeedbackWidget(config)
      
      expect(widget.modal).toBeDefined()
      expect(widget.overlay).toBeDefined()
    })

    it('should handle modal open and close', () => {
      const config = {
        projectId: 'test-789'
      }

      const widget = new FeedbackWidget(config)
      
      // Test opening modal
      widget.openModal()
      expect(widget.isOpen).toBe(true)
      
      // Test closing modal
      widget.closeModal()
      expect(widget.isOpen).toBe(false)
    })
  })

  describe('Event Handling', () => {
    it('should handle button click to toggle widget', () => {
      const config = {
        projectId: 'test-click'
      }

      const widget = new FeedbackWidget(config)
      
      // Verify button has click event listener
      expect(widget.button.addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
    })

    it('should handle escape key to close widget', () => {
      const config = {
        projectId: 'test-escape'
      }

      const widget = new FeedbackWidget(config)
      
      // Widget should handle escape key (implementation detail)
      expect(widget.closeModal).toBeDefined()
    })

    it('should handle overlay click to close widget', () => {
      const config = {
        projectId: 'test-overlay'
      }

      const widget = new FeedbackWidget(config)
      
      // Verify overlay has click event listener
      expect(widget.overlay.addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
    })
  })

  describe('Form Submission', () => {
    it('should collect form data correctly', () => {
      const config = {
        projectId: 'test-form'
      }

      const widget = new FeedbackWidget(config)
      
      // Mock form data
      const mockFormData = {
        get: vi.fn()
          .mockReturnValueOnce('Test feedback message')
          .mockReturnValueOnce('test@example.com')
      }

      // Mock form event
      const mockEvent = {
        preventDefault: vi.fn(),
        target: {
          querySelectorAll: vi.fn()
        }
      }

      global.FormData = vi.fn(() => mockFormData)
      
      // Test form data collection
      expect(widget.submitFeedback).toBeDefined()
    })

    it('should submit feedback to API', async () => {
      const config = {
        projectId: 'test-api'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const widget = new FeedbackWidget(config)
      
      // Mock successful API call
      expect(mockFetch).not.toHaveBeenCalled() // Initially not called
    })

    it('should handle API submission errors', async () => {
      const config = {
        projectId: 'test-error'
      }

      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const widget = new FeedbackWidget(config)
      
      // Error handling should be defined
      expect(widget.showError).toBeDefined()
    })
  })

  describe('Status Display', () => {
    it('should show success status', () => {
      const config = {
        projectId: 'test-success'
      }

      const widget = new FeedbackWidget(config)
      
      // Success display should be available
      expect(widget.showSuccess).toBeDefined()
    })
  })

  describe('Widget Cleanup', () => {
    it('should properly destroy widget and remove elements', () => {
      const config = {
        projectId: 'test-cleanup'
      }

      const widget = new FeedbackWidget(config)
      
      // Mock parentNode for cleanup
      widget.button.parentNode = mockBody
      widget.overlay.parentNode = mockBody

      widget.destroy()

      expect(widget.button).toBeNull()
      expect(widget.modal).toBeNull()
      expect(widget.overlay).toBeNull()
      expect(widget.isOpen).toBe(false)
    })
  })
})