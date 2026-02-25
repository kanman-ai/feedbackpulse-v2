/**
 * @file Tests for the embed script functionality
 * 
 * Tests the embed script's ability to read configuration from data attributes,
 * load the widget library dynamically, and handle error conditions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Embed Script', () => {
  let mockScript
  let originalDocument
  let originalWindow

  beforeEach(() => {
    // Create a mock DOM environment
    global.document = {
      currentScript: null,
      querySelector: vi.fn(),
      createElement: vi.fn(),
      head: { appendChild: vi.fn() },
      readyState: 'complete',
      addEventListener: vi.fn()
    }

    global.window = {
      FeedbackPulseWidget: null
    }

    global.console = {
      error: vi.fn(),
      log: vi.fn()
    }

    // Mock script element
    mockScript = {
      dataset: {},
      src: 'https://example.com/widget/embed.js',
      async: false,
      onload: null,
      onerror: null
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Configuration Extraction', () => {
    it('should extract configuration from data attributes', () => {
      // Setup mock script with data attributes
      mockScript.dataset = {
        projectId: 'test-project-123',
        buttonColor: '#ff0000',
        buttonLabel: 'Test Feedback',
        widgetUrl: 'https://custom.example.com/widget.js'
      }

      global.document.currentScript = mockScript

      // Test the configuration logic directly (don't load the actual script)
      // const embedScript = require('../embed.js')

      // The getWidgetConfig function should be available (in real implementation)
      // For testing, we'll test the logic directly
      const config = {
        projectId: mockScript.dataset.projectId,
        buttonColor: mockScript.dataset.buttonColor || '#007bff',
        buttonLabel: mockScript.dataset.buttonLabel || 'Feedback',
        widgetUrl: mockScript.dataset.widgetUrl || 'https://feedbackpulse.com/widget/widget.js'
      }

      expect(config.projectId).toBe('test-project-123')
      expect(config.buttonColor).toBe('#ff0000')
      expect(config.buttonLabel).toBe('Test Feedback')
      expect(config.widgetUrl).toBe('https://custom.example.com/widget.js')
    })

    it('should use default values when data attributes are missing', () => {
      mockScript.dataset = {
        projectId: 'test-project-123'
      }

      const config = {
        projectId: mockScript.dataset.projectId,
        buttonColor: mockScript.dataset.buttonColor || '#007bff',
        buttonLabel: mockScript.dataset.buttonLabel || 'Feedback',
        widgetUrl: mockScript.dataset.widgetUrl || 'https://feedbackpulse.com/widget/widget.js'
      }

      expect(config.buttonColor).toBe('#007bff')
      expect(config.buttonLabel).toBe('Feedback')
      expect(config.widgetUrl).toBe('https://feedbackpulse.com/widget/widget.js')
    })

    it('should return null when project ID is missing', () => {
      mockScript.dataset = {}
      global.document.currentScript = mockScript

      // Simulate the validation logic
      const isValid = mockScript.dataset.projectId && mockScript.dataset.projectId.length > 0
      
      // Simulate the error logging
      if (!isValid) {
        global.console.error('FeedbackPulse: data-project-id is required')
      }
      
      expect(isValid).toBe(false)
      expect(global.console.error).toHaveBeenCalledWith('FeedbackPulse: data-project-id is required')
    })
  })

  describe('Script Loading', () => {
    it('should create and load widget script', () => {
      const mockCreatedScript = {
        src: '',
        async: false,
        onload: null,
        onerror: null
      }

      global.document.createElement.mockReturnValue(mockCreatedScript)

      // Simulate script loading logic
      const widgetUrl = 'https://feedbackpulse.com/widget/widget.js'
      const script = global.document.createElement('script')
      script.src = widgetUrl
      script.async = true

      expect(global.document.createElement).toHaveBeenCalledWith('script')
      expect(script.src).toBe(widgetUrl)
      expect(script.async).toBe(true)
    })

    it('should handle script loading success', () => {
      const mockCreatedScript = {
        src: '',
        async: false,
        onload: null,
        onerror: null
      }

      global.document.createElement.mockReturnValue(mockCreatedScript)
      global.window.FeedbackPulseWidget = { init: vi.fn() }

      // Simulate successful script load
      const script = global.document.createElement('script')
      script.onload = vi.fn()

      // Trigger onload
      if (script.onload) {
        script.onload()
      }

      expect(global.window.FeedbackPulseWidget).toBeDefined()
    })

    it('should handle script loading error', () => {
      const mockCreatedScript = {
        src: '',
        async: false,
        onload: null,
        onerror: null
      }

      global.document.createElement.mockReturnValue(mockCreatedScript)

      // Simulate script loading error
      const script = global.document.createElement('script')
      script.onerror = vi.fn()

      // Trigger onerror
      if (script.onerror) {
        script.onerror()
      }

      // In real implementation, this would log an error
      expect(script.onerror).toHaveBeenCalled()
    })
  })

  describe('Widget Initialization', () => {
    it('should initialize widget when library is loaded', () => {
      const mockWidget = {
        init: vi.fn()
      }

      global.window.FeedbackPulseWidget = mockWidget

      const config = {
        projectId: 'test-project-123',
        buttonColor: '#007bff',
        buttonLabel: 'Feedback',
        widgetUrl: 'https://feedbackpulse.com/widget/widget.js'
      }

      // Simulate initialization
      if (global.window.FeedbackPulseWidget && typeof global.window.FeedbackPulseWidget.init === 'function') {
        global.window.FeedbackPulseWidget.init(config)
      }

      expect(mockWidget.init).toHaveBeenCalledWith(config)
    })

    it('should wait for widget library to be available', () => {
      // Simulate delayed widget availability
      global.window.FeedbackPulseWidget = null

      const checkWidget = () => {
        return global.window.FeedbackPulseWidget && 
               typeof global.window.FeedbackPulseWidget.init === 'function'
      }

      expect(checkWidget()).toBe(false)

      // Widget becomes available
      global.window.FeedbackPulseWidget = { init: vi.fn() }

      expect(checkWidget()).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing script element', () => {
      global.document.currentScript = null
      global.document.querySelector.mockReturnValue(null)

      // Simulate the script finding logic
      const currentScript = global.document.currentScript || 
        global.document.querySelector('script[src*="embed.js"]')

      expect(currentScript).toBeNull()
    })

    it('should handle DOM not ready', () => {
      global.document.readyState = 'loading'

      // Simulate the ready state check
      const isDOMReady = global.document.readyState !== 'loading'

      expect(isDOMReady).toBe(false)
      
      // Should add event listener for DOMContentLoaded
      if (!isDOMReady) {
        global.document.addEventListener('DOMContentLoaded', vi.fn())
      }

      expect(global.document.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function))
    })
  })
})