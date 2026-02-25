/**
 * Vitest configuration for FeedbackPulse v2 test suite.
 * Configures testing environment, path resolution, and coverage settings.
 */
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    /**
     * Use jsdom environment for React component testing.
     * Provides DOM APIs and browser-like environment for tests.
     */
    environment: 'jsdom',
    
    /**
     * Enable global test functions (describe, it, expect).
     * Allows writing tests without explicit imports.
     */
    globals: true,
    
    /**
     * Setup files to run before each test suite.
     * Configures testing library and mocks.
     */
    setupFiles: ['./src/test/setup.ts'],
    
    /**
     * Coverage configuration using v8 provider.
     * Tracks code coverage for all source files.
     */
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
      ],
    },
  },
  
  /**
   * Path resolution configuration.
   * Matches TypeScript paths for consistent imports.
   */
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})