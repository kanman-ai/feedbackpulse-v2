/**
 * @file Vitest configuration for FeedbackPulse widget testing
 * Sets up DOM environment and test globals for proper widget testing
 */
import { defineConfig } from 'vitest/config'
export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: [],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.test.{js,ts}']
    }
  }
})