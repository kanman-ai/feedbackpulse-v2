/**
 * Tests for Widget Settings API Route
 * 
 * Tests the GET and POST endpoints for managing widget configuration.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

describe('/api/projects/[id]/widget-settings', () => {
  const mockProjectId = 'test-project-123'
  const mockBaseUrl = 'https://test.example.com'

  /**
   * Creates a mock NextRequest object
   */
  function createMockRequest(method: string, body?: any): NextRequest {
    const url = `${mockBaseUrl}/api/projects/${mockProjectId}/widget-settings`
    const init = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    } as const

    return new NextRequest(url, init)
  }

  /**
   * Creates mock route context with project ID
   */
  function createMockContext() {
    return {
      params: { id: mockProjectId }
    }
  }

  beforeEach(() => {
    // Clear any stored settings between tests
    // Note: In production this would clear database state
  })

  describe('GET /api/projects/[id]/widget-settings', () => {
    /**
     * Test successful retrieval of default settings
     */
    it('returns default settings for new project', async () => {
      const request = createMockRequest('GET')
      const context = createMockContext()

      const response = await GET(request, context)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toEqual({
        buttonText: 'Feedback',
        themeColor: '#3b82f6',
        questionText: 'How can we improve your experience?',
        projectId: mockProjectId
      })
    })

    /**
     * Test error handling for invalid project ID
     */
    it('returns 400 for missing project ID', async () => {
      const request = createMockRequest('GET')
      const context = { params: { id: '' } }

      const response = await GET(request, context)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Invalid project ID')
    })
  })

  describe('POST /api/projects/[id]/widget-settings', () => {
    /**
     * Test successful settings save
     */
    it('saves valid widget settings', async () => {
      const settingsData = {
        buttonText: 'Get Help',
        themeColor: '#ff6b35',
        questionText: 'How can we assist you today?'
      }

      const request = createMockRequest('POST', settingsData)
      const context = createMockContext()

      const response = await POST(request, context)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.message).toBe('Widget settings saved successfully')
      expect(data.settings).toEqual({
        ...settingsData,
        projectId: mockProjectId
      })
    })

    /**
     * Test validation of required fields
     */
    it('returns 400 for missing required fields', async () => {
      const invalidData = {
        buttonText: 'Feedback',
        // Missing themeColor and questionText
      }

      const request = createMockRequest('POST', invalidData)
      const context = createMockContext()

      const response = await POST(request, context)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Missing required fields: buttonText, themeColor, questionText')
    })

    /**
     * Test button text length validation
     */
    it('validates button text length', async () => {
      const invalidData = {
        buttonText: 'a'.repeat(51), // Exceeds 50 character limit
        themeColor: '#3b82f6',
        questionText: 'Test question'
      }

      const request = createMockRequest('POST', invalidData)
      const context = createMockContext()

      const response = await POST(request, context)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Button text must be a string with maximum 50 characters')
    })

    /**
     * Test theme color format validation
     */
    it('validates theme color format', async () => {
      const invalidData = {
        buttonText: 'Feedback',
        themeColor: 'invalid-color',
        questionText: 'Test question'
      }

      const request = createMockRequest('POST', invalidData)
      const context = createMockContext()

      const response = await POST(request, context)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Theme color must be a valid hex color code (e.g., #3b82f6)')
    })

    /**
     * Test question text length validation
     */
    it('validates question text length', async () => {
      const invalidData = {
        buttonText: 'Feedback',
        themeColor: '#3b82f6',
        questionText: 'a'.repeat(201) // Exceeds 200 character limit
      }

      const request = createMockRequest('POST', invalidData)
      const context = createMockContext()

      const response = await POST(request, context)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Question text must be a string with maximum 200 characters')
    })

    /**
     * Test valid hex color acceptance
     */
    it('accepts valid hex color codes', async () => {
      const testCases = [
        '#000000',
        '#ffffff',
        '#3b82f6',
        '#FF5733',
        '#a1b2c3'
      ]

      for (const color of testCases) {
        const settingsData = {
          buttonText: 'Feedback',
          themeColor: color,
          questionText: 'Test question'
        }

        const request = createMockRequest('POST', settingsData)
        const context = createMockContext()

        const response = await POST(request, context)
        expect(response.status).toBe(200)

        const data = await response.json()
        expect(data.settings.themeColor).toBe(color.toLowerCase())
      }
    })

    /**
     * Test text trimming
     */
    it('trims whitespace from text fields', async () => {
      const settingsData = {
        buttonText: '  Feedback  ',
        themeColor: '#3b82f6',
        questionText: '  How can we improve?  '
      }

      const request = createMockRequest('POST', settingsData)
      const context = createMockContext()

      const response = await POST(request, context)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.settings.buttonText).toBe('Feedback')
      expect(data.settings.questionText).toBe('How can we improve?')
    })

    /**
     * Test persistence by saving and retrieving
     */
    it('persists settings between save and retrieve', async () => {
      const settingsData = {
        buttonText: 'Contact Us',
        themeColor: '#00ff00',
        questionText: 'What would you like to know?'
      }

      // Save settings
      const saveRequest = createMockRequest('POST', settingsData)
      const context = createMockContext()

      const saveResponse = await POST(saveRequest, context)
      expect(saveResponse.status).toBe(200)

      // Retrieve settings
      const getRequest = createMockRequest('GET')
      const getResponse = await GET(getRequest, context)
      expect(getResponse.status).toBe(200)

      const retrievedData = await getResponse.json()
      expect(retrievedData).toEqual({
        ...settingsData,
        projectId: mockProjectId
      })
    })

    /**
     * Test error handling for invalid project ID
     */
    it('returns 400 for invalid project ID in POST', async () => {
      const settingsData = {
        buttonText: 'Feedback',
        themeColor: '#3b82f6',
        questionText: 'Test question'
      }

      const request = createMockRequest('POST', settingsData)
      const context = { params: { id: '' } }

      const response = await POST(request, context)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Invalid project ID')
    })
  })
})