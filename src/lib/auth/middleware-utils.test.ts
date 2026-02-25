/**
 * Test suite for middleware utility functions.
 * Tests route parsing and parameter extraction functions.
 */

// Utility functions extracted for testing
function extractProjectId(pathname: string): string | null {
  const projectMatch = pathname.match(/\/projects\/([^\/]+)/)
  return projectMatch ? projectMatch[1] : null
}

function extractRouteParams(
  pathname: string,
  pattern: string
): Record<string, string> | null {
  // Convert Next.js route pattern to regex
  const regexPattern = pattern
    .replace(/\[([^\]]+)\]/g, '([^/]+)')
    .replace(/\/+/g, '\/')
  
  const match = pathname.match(new RegExp(`^${regexPattern}$`))
  if (!match) return null

  // Extract parameter names
  const paramNames = [...pattern.matchAll(/\[([^\]]+)\]/g)].map(m => m[1])
  
  // Build params object
  const params: Record<string, string> = {}
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1]
  })
  
  return params
}

describe('Middleware Utility Functions', () => {
  describe('extractProjectId', () => {
    it('should extract project ID from standard project routes', () => {
      expect(extractProjectId('/projects/abc123')).toBe('abc123')
      expect(extractProjectId('/projects/abc123/')).toBe('abc123')
    })

    it('should extract project ID from nested project routes', () => {
      expect(extractProjectId('/projects/abc123/settings')).toBe('abc123')
      expect(extractProjectId('/projects/abc123/feedback')).toBe('abc123')
      expect(extractProjectId('/projects/abc123/members')).toBe('abc123')
    })

    it('should return null for non-project routes', () => {
      expect(extractProjectId('/auth/login')).toBe(null)
      expect(extractProjectId('/dashboard')).toBe(null)
      expect(extractProjectId('/')).toBe(null)
    })
  })

  describe('extractRouteParams', () => {
    it('should extract single parameter', () => {
      const params = extractRouteParams('/projects/abc123', '/projects/[id]')
      expect(params).toEqual({ id: 'abc123' })
    })

    it('should extract multiple parameters', () => {
      const params = extractRouteParams(
        '/projects/abc123/members/user456', 
        '/projects/[id]/members/[userId]'
      )
      expect(params).toEqual({ id: 'abc123', userId: 'user456' })
    })

    it('should return null for non-matching patterns', () => {
      expect(extractRouteParams('/projects/abc123', '/users/[id]')).toBe(null)
      expect(extractRouteParams('/auth/login', '/projects/[id]')).toBe(null)
    })
  })
})