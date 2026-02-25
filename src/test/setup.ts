/**
 * Test setup file for FeedbackPulse v2.
 * Configures global test utilities and mocks for the testing environment.
 */

import '@testing-library/jest-dom'

// Mock Next.js router globally
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
  },
  writable: true,
})

// Mock window.navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
  writable: true,
})

// Mock window.crypto for invite token generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
    getRandomValues: vi.fn(),
  },
})

// Mock console methods to reduce noise in tests
const originalWarn = console.warn
const originalError = console.error

beforeAll(() => {
  console.warn = vi.fn()
  console.error = vi.fn()
})

afterAll(() => {
  console.warn = originalWarn
  console.error = originalError
})