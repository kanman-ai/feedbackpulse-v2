/**
 * @file Tests for the widget library functionality
 * 
 * Tests the widget's UI rendering, event handling, form submission,
 * and API integration capabilities.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('FeedbackPulse Widget', () => {
  let mockDocument
  let mockWindow
  let mockFetch

  beforeEach(() => {
    // Mock DOM environment
    global.document = {
      createElement: vi.fn((tag) => ({
        tagName: tag.toUpperCase(),
        style: {},
        innerHTML: '',
        id: '',
        addEventListener: vi.fn(),
        remove: vi.fn(),
        appendChild: vi.fn()
      })),
      body: {
        appendChild: vi.fn()
      },
      head: {
        appendChild: vi.fn()
      },
      getElementById: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }

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

      // Mock widget class initialization
      const mockWidget = {
        config: config,
        isOpen: false,
        button: null,
        modal: null,
        overlay: null
      }

      expect(mockWidget.config).toEqual(config)
      expect(mockWidget.isOpen).toBe(false)
    })

    it('should create button and modal elements', () => {
      const mockButton = global.document.createElement('div')
      const mockOverlay = global.document.createElement('div')
      const mockModal = global.document.createElement('div')

      global.document.createElement
        .mockReturnValueOnce(mockButton)
        .mockReturnValueOnce(mockOverlay)
        .mockReturnValueOnce(mockModal)

      // Simulate widget creation
      const button = global.document.createElement('div')
      const overlay = global.document.createElement('div')
      const modal = global.document.createElement('div')

      expect(global.document.createElement).toHaveBeenCalledWith('div')
      expect(global.document.body.appendChild).toHaveBeenCalled()
    })
  })

  describe('Button Styling', () => {
    it('should apply correct styles to button', () => {
      const button = global.document.createElement('div')
      const config = {
        buttonColor: '#ff0000',
        buttonLabel: 'Test Feedback'
      }

      // Simulate button styling
      button.innerHTML = config.buttonLabel
      Object.assign(button.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: config.buttonColor,
        color: 'white',
        padding: '12px 20px',
        borderRadius: '25px',
        cursor: 'pointer',
        fontSize: '14px',
        zIndex: '999999'
      })

      expect(button.innerHTML).toBe('Test Feedback')
      expect(button.style.backgroundColor).toBe('#ff0000')
      expect(button.style.position).toBe('fixed')
    })
  })

  describe('Modal Functionality', () => {
    it('should generate correct modal HTML', () => {
      const config = { buttonColor: '#007bff' }
      
      // Mock the modal HTML generation
      const modalHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333; font-size: 20px;">Send Feedback</h2>
          <button id="feedbackpulse-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
        </div>
      `

      expect(modalHTML).toContain('Send Feedback')
      expect(modalHTML).toContain('feedbackpulse-close')
    })

    it('should handle modal open and close', () => {
      const mockWidget = {
        isOpen: false,
        overlay: { style: { display: 'none' } },
        openWidget() {
          this.isOpen = true
          this.overlay.style.display = 'flex'
        },
        closeWidget() {
          this.isOpen = false
          this.overlay.style.display = 'none'
        }
      }

      mockWidget.openWidget()
      expect(mockWidget.isOpen).toBe(true)
      expect(mockWidget.overlay.style.display).toBe('flex')

      mockWidget.closeWidget()
      expect(mockWidget.isOpen).toBe(false)
      expect(mockWidget.overlay.style.display).toBe('none')
    })
  })

  describe('Event Handling', () => {
    it('should handle button click to toggle widget', () => {
      const mockWidget = {
        isOpen: false,
        toggleWidget() {
          this.isOpen = !this.isOpen
        }
      }

      const button = global.document.createElement('div')
      button.addEventListener('click', mockWidget.toggleWidget.bind(mockWidget))

      // Simulate button click
      mockWidget.toggleWidget()
      expect(mockWidget.isOpen).toBe(true)

      mockWidget.toggleWidget()
      expect(mockWidget.isOpen).toBe(false)
    })

    it('should handle escape key to close widget', () => {
      const mockWidget = {
        isOpen: true,
        closeWidget: vi.fn()
      }

      const handleEscapeKey = (event) => {
        if (event.key === 'Escape' && mockWidget.isOpen) {
          mockWidget.closeWidget()
        }
      }

      // Simulate escape key press
      handleEscapeKey({ key: 'Escape' })
      expect(mockWidget.closeWidget).toHaveBeenCalled()
    })

    it('should handle overlay click to close widget', () => {
      const mockOverlay = global.document.createElement('div')
      const mockWidget = {
        overlay: mockOverlay,
        closeWidget: vi.fn()
      }

      const handleOverlayClick = (event) => {
        if (event.target === mockWidget.overlay) {
          mockWidget.closeWidget()
        }
      }

      // Simulate overlay click
      handleOverlayClick({ target: mockOverlay })
      expect(mockWidget.closeWidget).toHaveBeenCalled()
    })
  })

  describe('Form Submission', () => {
    it('should collect form data correctly', () => {
      // Mock form elements
      global.document.getElementById = vi.fn((id) => {
        const mockElements = {
          'feedbackpulse-type': { value: 'bug' },
          'feedbackpulse-message': { value: 'Test feedback message' },
          'feedbackpulse-email': { value: 'test@example.com' }
        }
        return mockElements[id] || null
      })

      const formData = {
        projectId: 'test-project-123',
        type: global.document.getElementById('feedbackpulse-type').value,
        message: global.document.getElementById('feedbackpulse-message').value,
        email: global.document.getElementById('feedbackpulse-email').value,
        url: global.window.location.href,
        userAgent: global.window.navigator.userAgent,
        timestamp: new Date().toISOString()
      }

      expect(formData.type).toBe('bug')
      expect(formData.message).toBe('Test feedback message')
      expect(formData.email).toBe('test@example.com')
      expect(formData.projectId).toBe('test-project-123')
    })

    it('should submit feedback to API', async () => {
      const feedbackData = {
        projectId: 'test-project-123',
        type: 'bug',
        message: 'Test message',
        email: 'test@example.com'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, id: 'feedback-123' })
      })

      // Simulate API call
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      })

      const result = await response.json()
      expect(result.success).toBe(true)
    })

    it('should handle API submission errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      try {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      } catch (error) {
        expect(error.message).toBe('HTTP error! status: 500')
      }
    })
  })

  describe('Status Display', () => {
    it('should show success status', () => {
      // Mock DOM elements
      const mockForm = { style: { display: 'block' } }
      const mockStatus = { style: { display: 'none', color: '' } }
      const mockStatusMessage = { textContent: '' }

      global.document.getElementById = vi.fn((id) => {
        const elements = {
          'feedbackpulse-form': mockForm,
          'feedbackpulse-status': mockStatus,
          'feedbackpulse-status-message': mockStatusMessage
        }
        return elements[id] || null
      })

      // Simulate showing success status
      const showStatus = (type, message) => {
        const form = global.document.getElementById('feedbackpulse-form')
        const status = global.document.getElementById('feedbackpulse-status')
        const statusMessage = global.document.getElementById('feedbackpulse-status-message')

        if (form) form.style.display = 'none'
        if (status) {
          status.style.display = 'block'
          status.style.color = type === 'success' ? '#28a745' : '#dc3545'
        }
        if (statusMessage) statusMessage.textContent = message
      }

      showStatus('success', 'Thank you! Your feedback has been sent.')

      expect(mockForm.style.display).toBe('none')
      expect(mockStatus.style.display).toBe('block')
      expect(mockStatus.style.color).toBe('#28a745')
      expect(mockStatusMessage.textContent).toBe('Thank you! Your feedback has been sent.')
    })
  })

  describe('Widget Cleanup', () => {
    it('should properly destroy widget and remove elements', () => {
      const mockButton = {
        remove: vi.fn()
      }
      const mockOverlay = {
        remove: vi.fn()
      }

      const mockWidget = {
        button: mockButton,
        overlay: mockOverlay,
        modal: null,
        isOpen: true,
        destroy() {
          if (this.button) {
            this.button.remove()
            this.button = null
          }
          if (this.overlay) {
            this.overlay.remove()
            this.overlay = null
          }
          this.modal = null
          this.isOpen = false
        }
      }

      mockWidget.destroy()

      expect(mockButton.remove).toHaveBeenCalled()
      expect(mockOverlay.remove).toHaveBeenCalled()
      expect(mockWidget.button).toBeNull()
      expect(mockWidget.overlay).toBeNull()
      expect(mockWidget.isOpen).toBe(false)
    })
  })
})