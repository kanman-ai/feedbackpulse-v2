/**
 * Vitest setup file for FeedbackPulse v2.
 * 
 * Configures the testing environment, mocks, and global utilities
 * that should be available across all test files.
 */

import { beforeAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Automatically cleanup React components after each test
afterEach(() => {
  cleanup();
});

// Global test utilities and mocks can be added here
beforeAll(() => {
  // Mock environment variables for testing
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
});

// Mock Next.js router if needed for component tests
vi.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: vi.fn(),
    pop: vi.fn(),
    reload: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn()
    }
  })
}));

// Suppress console warnings in tests unless explicitly testing them
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args) => {
    // Only show warnings that aren't React testing noise
    if (!args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')) {
      originalWarn(...args);
    }
  };
  
  console.error = (...args) => {
    // Only show errors that aren't React testing noise  
    if (!args[0]?.includes?.('Warning:')) {
      originalError(...args);
    }
  };
});