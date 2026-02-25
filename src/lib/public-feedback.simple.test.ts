/**
 * Simple tests for public feedback functionality.
 */

import { describe, it, expect } from 'vitest'
import { validatePublicTokenFormat } from './projects/public-tokens'

describe('Public Feedback Token Validation', () => {
  it('should validate token formats correctly', () => {
    // Valid tokens
    expect(validatePublicTokenFormat('abcdefghijklmnopqrstuvwxyzABCDEF123456')).toBe(true)
    expect(validatePublicTokenFormat('a1b2c3d4e5f6_-123456789012345678901234')).toBe(true)
    
    // Invalid tokens
    expect(validatePublicTokenFormat('')).toBe(false)
    expect(validatePublicTokenFormat('short')).toBe(false)
    expect(validatePublicTokenFormat('invalid@token#with$special%chars')).toBe(false)
  })
})