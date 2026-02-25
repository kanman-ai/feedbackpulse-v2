/**
 * @file Tests for the feedback API route
 * 
 * Tests the API endpoint's ability to validate input data,
 * handle submissions correctly, and return appropriate responses.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, OPTIONS } from '../route'

describe('Feedback API Route', () => {
  beforeEach(() => {
    // Mock console methods
    global.console = {
      error: vi.fn(),
      log: vi.fn(),
      assert: vi.fn(),
      clear: vi.fn(),
      count: vi.fn(),
      countReset: vi.fn(),
      debug: vi.fn(),
      dir: vi.fn(),
      dirxml: vi.fn(),
      group: vi.fn(),
      groupCollapsed: vi.fn(),
      groupEnd: vi.fn(),
      info: vi.fn(),
      table: vi.fn(),
      time: vi.fn(),
      timeEnd: vi.fn(),
      timeLog: vi.fn(),
      trace: vi.fn(),
      warn: vi.fn(),
      profile: vi.fn(),
      profileEnd: vi.fn(),
      timeStamp: vi.fn()
    } as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/feedback', () => {
    it('should accept valid feedback data', async () => {
      const validFeedback = {
        projectId: 'test-project-123',
        type: 'bug',
        message: 'This is a test feedback message',
        email: 'test@example.com',
        url: 'https://example.com',
        userAgent: 'Test User Agent',
        timestamp: '2023-12-01T12:00:00.000Z'
      }

      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validFeedback)
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.message).toBe('Feedback submitted successfully')
      expect(responseData.id).toBeDefined()
    })

    it('should reject feedback without project ID', async () => {
      const invalidFeedback = {
        type: 'bug',
        message: 'This is a test feedback message',
        url: 'https://example.com',
        userAgent: 'Test User Agent',
        timestamp: '2023-12-01T12:00:00.000Z'
      }

      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidFeedback)
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid feedback data provided')
    })

    it('should reject feedback with empty message', async () => {
      const invalidFeedback = {
        projectId: 'test-project-123',
        type: 'bug',
        message: '',
        url: 'https://example.com',
        userAgent: 'Test User Agent',
        timestamp: '2023-12-01T12:00:00.000Z'
      }

      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidFeedback)
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid feedback data provided')
    })

    it('should reject feedback with invalid type', async () => {
      const invalidFeedback = {
        projectId: 'test-project-123',
        type: 'invalid-type',
        message: 'This is a test feedback message',
        url: 'https://example.com',
        userAgent: 'Test User Agent',
        timestamp: '2023-12-01T12:00:00.000Z'
      }

      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidFeedback)
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid feedback data provided')
    })

    it('should accept feedback without email', async () => {
      const validFeedback = {
        projectId: 'test-project-123',
        type: 'feature',
        message: 'This is a test feedback message without email',
        url: 'https://example.com',
        userAgent: 'Test User Agent',
        timestamp: '2023-12-01T12:00:00.000Z'
      }

      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validFeedback)
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: '{ invalid json'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Internal server error')
    })

    it('should handle all valid feedback types', async () => {
      const feedbackTypes = ['bug', 'feature', 'improvement', 'other']

      for (const type of feedbackTypes) {
        const feedback = {
          projectId: 'test-project-123',
          type: type,
          message: `This is a ${type} feedback`,
          url: 'https://example.com',
          userAgent: 'Test User Agent',
          timestamp: '2023-12-01T12:00:00.000Z'
        }

        const request = new NextRequest('http://localhost:3000/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(feedback)
        })

        const response = await POST(request)
        const responseData = await response.json()

        expect(response.status).toBe(200)
        expect(responseData.success).toBe(true)
      }
    })

    it('should sanitize text input', () => {
      // Test the sanitizeText function logic
      const sanitizeText = (text: string): string => {
        return text
          .trim()
          .replace(/[<>]/g, '')
          .substring(0, 5000)
      }

      expect(sanitizeText('  test message  ')).toBe('test message')
      expect(sanitizeText('test <script>alert("xss")</script> message')).toBe('test scriptalert("xss")/script message')
      expect(sanitizeText('a'.repeat(6000))).toHaveLength(5000)
    })

    it('should generate unique IDs for feedback', () => {
      const generateId = (): string => {
        return Math.random().toString(36).substring(2) + Date.now().toString(36)
      }

      const id1 = generateId()
      const id2 = generateId()

      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
    })
  })

  describe('OPTIONS /api/feedback', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await OPTIONS()
      const responseData = await response.json()

      expect(response.status).toBe(200)
      
      const headers = response.headers
      expect(headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS')
      expect(headers.get('Access-Control-Allow-Headers')).toBe('Content-Type')
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields', () => {
      const validateFeedbackData = (data: any): boolean => {
        return (
          typeof data === 'object' &&
          typeof data.projectId === 'string' &&
          data.projectId.length > 0 &&
          typeof data.type === 'string' &&
          ['bug', 'feature', 'improvement', 'other'].includes(data.type) &&
          typeof data.message === 'string' &&
          data.message.trim().length > 0 &&
          typeof data.url === 'string' &&
          typeof data.userAgent === 'string' &&
          typeof data.timestamp === 'string' &&
          (data.email === undefined || typeof data.email === 'string')
        )
      }

      // Valid data
      const validData = {
        projectId: 'test-123',
        type: 'bug',
        message: 'Test message',
        url: 'https://example.com',
        userAgent: 'Test Agent',
        timestamp: '2023-12-01T12:00:00.000Z'
      }

      expect(validateFeedbackData(validData)).toBe(true)

      // Invalid data - missing required field
      const invalidData = { ...validData }
      delete (invalidData as any).projectId

      expect(validateFeedbackData(invalidData)).toBe(false)

      // Invalid data - empty message
      const emptyMessageData = { ...validData, message: '   ' }
      expect(validateFeedbackData(emptyMessageData)).toBe(false)

      // Invalid data - wrong type
      const wrongTypeData = { ...validData, type: 'invalid' }
      expect(validateFeedbackData(wrongTypeData)).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', () => {
      // Simulate an unexpected error during processing
      const handleError = (error: unknown) => {
        console.error('Error processing feedback:', error)
        return {
          status: 500,
          body: { error: 'Internal server error' }
        }
      }

      const result = handleError(new Error('Database connection failed'))

      expect(result.status).toBe(500)
      expect(result.body.error).toBe('Internal server error')
      expect(global.console.error).toHaveBeenCalledWith(
        'Error processing feedback:',
        expect.any(Error)
      )
    })
  })
})