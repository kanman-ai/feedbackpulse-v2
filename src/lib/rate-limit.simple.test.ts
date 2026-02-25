/**
 * Simple test for rate limiting functionality.
 */

import { describe, it, expect } from 'vitest'
import { PUBLIC_FEEDBACK_RATE_LIMIT } from './rate-limit'

describe('Rate Limiting Configuration', () => {
  it('should have correct PUBLIC_FEEDBACK_RATE_LIMIT configuration', () => {
    expect(PUBLIC_FEEDBACK_RATE_LIMIT.limit).toBe(30)
    expect(PUBLIC_FEEDBACK_RATE_LIMIT.window).toBe(60 * 1000) // 1 minute
  })
})