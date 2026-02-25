/**
 * Test environment setup for FeedbackPulse v2 authentication tests.
 * Configures jsdom and testing utilities for React components.
 */
import '@testing-library/jest-dom'
import React from 'react'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend vitest expect with jest-dom matchers
expect.extend(matchers)

// Make React globally available for JSX
;(globalThis as any).React = React

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'