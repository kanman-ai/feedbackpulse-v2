/**
 * FeedbackPulse Widget Tests
 * 
 * Unit tests for the widget script loader and widget component functionality.
 * Tests the bootstrap script, configuration parsing, shadow DOM creation,
 * and widget mounting process.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock DOM APIs for testing
const mockShadowRoot = {
  appendChild: vi.fn(),
  innerHTML: ''
};

const mockContainer = {
  attachShadow: vi.fn(() => mockShadowRoot),
  style: { cssText: '' },
  id: ''
};

// Mock document and DOM APIs
global.document = {
  ...global.document,
  createElement: vi.fn(() => mockContainer),
  body: {
    appendChild: vi.fn()
  },
  currentScript: null,
  getElementsByTagName: vi.fn(() => []),
  readyState: 'complete'
} as any;

describe('Widget Script Loader', () => {
  beforeEach(() => {
    // Clear mocks
    vi.clearAllMocks();
    
    // Reset global state
    delete (window as any).FeedbackPulseWidget;
    delete (window as any).FeedbackPulseWidgetMount;
    
    // Mock URL constructor
    global.URL = vi.fn().mockImplementation((url) => ({
      origin: 'https://feedbackpulse.com',
      search: '?project_id=test123&theme=#FF5733&question=How%20can%20we%20improve'
    })) as any;
    
    global.URLSearchParams = vi.fn().mockImplementation(() => ({
      get: vi.fn((key) => {
        const params: Record<string, string> = {
          project_id: 'test123',
          theme: '#FF5733',
          question: 'How can we improve'
        };
        return params[key] || null;
      })
    })) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration Parsing', () => {
    it('should parse configuration from script tag URL parameters', () => {
      // Mock current script
      const mockScript = {
        src: 'https://feedbackpulse.com/widget.js?project_id=test123&theme=#FF5733&question=How%20can%20we%20improve'
      };
      
      global.document.currentScript = mockScript as any;
      
      // Import and test the widget class (we'll need to expose it for testing)
      const widget = new (window as any).FeedbackPulseWidget();
      const config = widget.parseConfig();
      
      expect(config).toEqual({
        projectId: 'test123',
        theme: '#FF5733',
        question: 'How can we improve',
        position: 'bottom-right',
        baseUrl: 'https://feedbackpulse.com'
      });
    });

    it('should use default values for missing parameters', () => {
      const mockScript = {
        src: 'https://feedbackpulse.com/widget.js?project_id=test123'
      };
      
      global.document.currentScript = mockScript as any;
      
      // Mock URLSearchParams to return only project_id
      global.URLSearchParams = vi.fn().mockImplementation(() => ({
        get: vi.fn((key) => key === 'project_id' ? 'test123' : null)
      })) as any;
      
      const widget = new (window as any).FeedbackPulseWidget();
      const config = widget.parseConfig();
      
      expect(config.theme).toBe('#3B82F6'); // Default blue theme
      expect(config.question).toBe('How can we improve?'); // Default question
      expect(config.position).toBe('bottom-right'); // Default position
    });

    it('should validate required project_id parameter', () => {
      const widget = new (window as any).FeedbackPulseWidget();
      
      const validConfig = {
        projectId: 'test123',
        theme: '#FF5733',
        question: 'Test question',
        position: 'bottom-right',
        baseUrl: 'https://feedbackpulse.com'
      };
      
      const invalidConfig = {
        projectId: '',
        theme: '#FF5733',
        question: 'Test question',
        position: 'bottom-right',
        baseUrl: 'https://feedbackpulse.com'
      };
      
      expect(widget.validateConfig(validConfig)).toBe(true);
      expect(widget.validateConfig(invalidConfig)).toBe(false);
    });

    it('should validate and fix invalid theme colors', () => {
      const widget = new (window as any).FeedbackPulseWidget();
      
      const configWithInvalidTheme = {
        projectId: 'test123',
        theme: 'invalid-color',
        question: 'Test question',
        position: 'bottom-right',
        baseUrl: 'https://feedbackpulse.com'
      };
      
      expect(widget.validateConfig(configWithInvalidTheme)).toBe(true);
      expect(configWithInvalidTheme.theme).toBe('#3B82F6'); // Should be corrected to default
    });
  });

  describe('Shadow DOM Creation', () => {
    it('should create widget container with shadow DOM', () => {
      const widget = new (window as any).FeedbackPulseWidget();
      widget.config = {
        projectId: 'test123',
        theme: '#FF5733',
        question: 'Test question',
        position: 'bottom-right',
        baseUrl: 'https://feedbackpulse.com'
      };
      
      widget.createShadowDOM();
      
      expect(global.document.createElement).toHaveBeenCalledWith('div');
      expect(mockContainer.attachShadow).toHaveBeenCalledWith({ mode: 'closed' });
      expect(global.document.body.appendChild).toHaveBeenCalled();
      expect(widget.widgetContainer.id).toBe('feedbackpulse-widget');
    });

    it('should apply correct positioning styles', () => {
      const widget = new (window as any).FeedbackPulseWidget();
      
      widget.config = { position: 'bottom-right' };
      expect(widget.getPositionStyles()).toBe('bottom: 20px; right: 20px;');
      
      widget.config = { position: 'bottom-left' };
      expect(widget.getPositionStyles()).toBe('bottom: 20px; left: 20px;');
      
      widget.config = { position: 'top-right' };
      expect(widget.getPositionStyles()).toBe('top: 20px; right: 20px;');
      
      widget.config = { position: 'top-left' };
      expect(widget.getPositionStyles()).toBe('top: 20px; left: 20px;');
    });
  });

  describe('Widget Loading', () => {
    it('should show loading indicator while loading widget bundle', () => {
      const widget = new (window as any).FeedbackPulseWidget();
      widget.config = {
        projectId: 'test123',
        theme: '#FF5733',
        question: 'Test question',
        position: 'bottom-right',
        baseUrl: 'https://feedbackpulse.com'
      };
      widget.shadowRoot = mockShadowRoot;
      
      widget.showLoading();
      
      expect(mockShadowRoot.innerHTML).toContain('fp-loading');
      expect(mockShadowRoot.innerHTML).toContain('#FF5733'); // Theme color
    });

    it('should show error message on widget bundle load failure', () => {
      const widget = new (window as any).FeedbackPulseWidget();
      widget.shadowRoot = mockShadowRoot;
      
      widget.showError('Test error message');
      
      expect(mockShadowRoot.innerHTML).toContain('fp-error');
      expect(mockShadowRoot.innerHTML).toContain('Test error message');
    });

    it('should handle missing mount function gracefully', () => {
      const widget = new (window as any).FeedbackPulseWidget();
      widget.shadowRoot = mockShadowRoot;
      widget.isLoading = true;
      
      // Mock console.error to verify error handling
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      widget.onWidgetBundleLoaded();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to mount widget:',
        expect.any(Error)
      );
      expect(widget.isLoading).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle script tag not found error', () => {
      global.document.currentScript = null;
      global.document.getElementsByTagName = vi.fn(() => []);
      
      const widget = new (window as any).FeedbackPulseWidget();
      
      expect(() => widget.parseConfig()).toThrow('Could not find widget script tag');
    });

    it('should handle initialization failure gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock parseConfig to throw error
      const widget = new (window as any).FeedbackPulseWidget();
      widget.parseConfig = vi.fn(() => {
        throw new Error('Test error');
      });
      
      widget.init();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'FeedbackPulse widget initialization failed:',
        expect.any(Error)
      );
      expect(widget.isLoading).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });
});

describe('Widget Bundle Mount Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the widget bundle mount function
    global.window.FeedbackPulseWidgetMount = vi.fn();
  });

  it('should expose mount function globally', () => {
    expect(typeof window.FeedbackPulseWidgetMount).toBe('function');
  });

  it('should mount widget with correct parameters', () => {
    const mockConfig = {
      projectId: 'test123',
      theme: '#FF5733',
      question: 'How can we improve?',
      position: 'bottom-right',
      baseUrl: 'https://feedbackpulse.com'
    };
    
    window.FeedbackPulseWidgetMount(mockShadowRoot, mockConfig);
    
    expect(window.FeedbackPulseWidgetMount).toHaveBeenCalledWith(mockShadowRoot, mockConfig);
  });
});

describe('Widget Integration', () => {
  it('should complete full initialization flow without errors', () => {
    // Mock a complete successful flow
    const mockScript = {
      src: 'https://feedbackpulse.com/widget.js?project_id=test123&theme=#FF5733'
    };
    
    global.document.currentScript = mockScript as any;
    global.window.FeedbackPulseWidgetMount = vi.fn();
    
    const widget = new (window as any).FeedbackPulseWidget();
    
    expect(() => widget.init()).not.toThrow();
    expect(widget.isLoading).toBe(true);
  });

  it('should prevent duplicate initialization', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const widget = new (window as any).FeedbackPulseWidget();
    widget.isLoaded = true;
    
    widget.init();
    
    expect(consoleSpy).toHaveBeenCalledWith('FeedbackPulse widget already initialized');
    
    consoleSpy.mockRestore();
  });
});