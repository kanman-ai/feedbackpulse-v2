/**
 * Test suite for the Role-Based Access Control (RBAC) system.
 * Tests role permissions, hierarchy, and validation functions.
 */

import {
  type ProjectRole,
  type Permission,
  hasPermission,
  hasMinimumRole,
  getRolePermissions,
  hasAnyPermission,
  hasAllPermissions,
  getRoleLevel,
  isValidRole,
  ROLE_PERMISSIONS,
} from './rbac'

describe('RBAC System', () => {
  describe('hasPermission', () => {
    it('should grant viewer permissions to viewer role', () => {
      expect(hasPermission('viewer', 'project:read')).toBe(true)
      expect(hasPermission('viewer', 'feedback:read')).toBe(true)
      expect(hasPermission('viewer', 'widget:read')).toBe(true)
      expect(hasPermission('viewer', 'analytics:read')).toBe(true)
    })

    it('should deny higher permissions to viewer role', () => {
      expect(hasPermission('viewer', 'project:update')).toBe(false)
      expect(hasPermission('viewer', 'feedback:create')).toBe(false)
      expect(hasPermission('viewer', 'widget:update')).toBe(false)
      expect(hasPermission('viewer', 'project:manage_members')).toBe(false)
    })

    it('should grant editor permissions to editor role', () => {
      expect(hasPermission('editor', 'project:read')).toBe(true)
      expect(hasPermission('editor', 'project:update')).toBe(true)
      expect(hasPermission('editor', 'feedback:create')).toBe(true)
      expect(hasPermission('editor', 'feedback:moderate')).toBe(true)
      expect(hasPermission('editor', 'widget:configure')).toBe(true)
      expect(hasPermission('editor', 'analytics:export')).toBe(true)
    })

    it('should deny owner-only permissions to editor role', () => {
      expect(hasPermission('editor', 'project:delete')).toBe(false)
      expect(hasPermission('editor', 'project:manage_members')).toBe(false)
    })

    it('should grant all permissions to owner role', () => {
      expect(hasPermission('owner', 'project:read')).toBe(true)
      expect(hasPermission('owner', 'project:delete')).toBe(true)
      expect(hasPermission('owner', 'project:manage_members')).toBe(true)
      expect(hasPermission('owner', 'feedback:moderate')).toBe(true)
      expect(hasPermission('owner', 'widget:configure')).toBe(true)
      expect(hasPermission('owner', 'analytics:export')).toBe(true)
    })
  })

  describe('hasMinimumRole', () => {
    it('should validate role hierarchy correctly', () => {
      // Viewer level
      expect(hasMinimumRole('viewer', 'viewer')).toBe(true)
      expect(hasMinimumRole('editor', 'viewer')).toBe(true)
      expect(hasMinimumRole('owner', 'viewer')).toBe(true)

      // Editor level
      expect(hasMinimumRole('viewer', 'editor')).toBe(false)
      expect(hasMinimumRole('editor', 'editor')).toBe(true)
      expect(hasMinimumRole('owner', 'editor')).toBe(true)

      // Owner level
      expect(hasMinimumRole('viewer', 'owner')).toBe(false)
      expect(hasMinimumRole('editor', 'owner')).toBe(false)
      expect(hasMinimumRole('owner', 'owner')).toBe(true)
    })
  })

  describe('getRolePermissions', () => {
    it('should return correct permissions for each role', () => {
      const viewerPerms = getRolePermissions('viewer')
      expect(viewerPerms).toContain('project:read')
      expect(viewerPerms).toContain('feedback:read')
      expect(viewerPerms).not.toContain('project:update')

      const editorPerms = getRolePermissions('editor')
      expect(editorPerms).toContain('project:update')
      expect(editorPerms).toContain('feedback:create')
      expect(editorPerms).not.toContain('project:delete')

      const ownerPerms = getRolePermissions('owner')
      expect(ownerPerms).toContain('project:delete')
      expect(ownerPerms).toContain('project:manage_members')
    })

    it('should have increasing permission sets', () => {
      const viewerPerms = getRolePermissions('viewer')
      const editorPerms = getRolePermissions('editor')
      const ownerPerms = getRolePermissions('owner')

      expect(editorPerms.length).toBeGreaterThan(viewerPerms.length)
      expect(ownerPerms.length).toBeGreaterThan(editorPerms.length)
    })
  })

  describe('hasAnyPermission', () => {
    it('should return true if role has at least one permission', () => {
      expect(hasAnyPermission('viewer', ['project:read', 'project:delete'])).toBe(true)
      expect(hasAnyPermission('editor', ['project:delete', 'feedback:create'])).toBe(true)
      expect(hasAnyPermission('viewer', ['project:delete', 'project:manage_members'])).toBe(false)
    })

    it('should handle empty permission arrays', () => {
      expect(hasAnyPermission('viewer', [])).toBe(false)
      expect(hasAnyPermission('owner', [])).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('should return true only if role has all permissions', () => {
      expect(hasAllPermissions('viewer', ['project:read', 'feedback:read'])).toBe(true)
      expect(hasAllPermissions('viewer', ['project:read', 'project:update'])).toBe(false)
      expect(hasAllPermissions('owner', ['project:delete', 'project:manage_members'])).toBe(true)
    })

    it('should handle empty permission arrays', () => {
      expect(hasAllPermissions('viewer', [])).toBe(true)
      expect(hasAllPermissions('owner', [])).toBe(true)
    })
  })

  describe('getRoleLevel', () => {
    it('should return correct hierarchy levels', () => {
      expect(getRoleLevel('viewer')).toBe(0)
      expect(getRoleLevel('editor')).toBe(1)
      expect(getRoleLevel('owner')).toBe(2)
    })

    it('should maintain relative ordering', () => {
      expect(getRoleLevel('viewer')).toBeLessThan(getRoleLevel('editor'))
      expect(getRoleLevel('editor')).toBeLessThan(getRoleLevel('owner'))
    })
  })

  describe('isValidRole', () => {
    it('should validate correct role strings', () => {
      expect(isValidRole('viewer')).toBe(true)
      expect(isValidRole('editor')).toBe(true)
      expect(isValidRole('owner')).toBe(true)
    })

    it('should reject invalid role strings', () => {
      expect(isValidRole('admin')).toBe(false)
      expect(isValidRole('member')).toBe(false)
      expect(isValidRole('user')).toBe(false)
      expect(isValidRole('invalid')).toBe(false)
      expect(isValidRole('')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(isValidRole('VIEWER')).toBe(false) // Case sensitive
      expect(isValidRole(' viewer ')).toBe(false) // Whitespace
    })
  })

  describe('ROLE_PERMISSIONS consistency', () => {
    it('should have all roles defined', () => {
      expect(ROLE_PERMISSIONS).toHaveProperty('viewer')
      expect(ROLE_PERMISSIONS).toHaveProperty('editor')
      expect(ROLE_PERMISSIONS).toHaveProperty('owner')
    })

    it('should have non-empty permission arrays', () => {
      Object.values(ROLE_PERMISSIONS).forEach(permissions => {
        expect(permissions.length).toBeGreaterThan(0)
      })
    })

    it('should have unique permissions per role', () => {
      Object.values(ROLE_PERMISSIONS).forEach(permissions => {
        const uniquePermissions = new Set(permissions)
        expect(uniquePermissions.size).toBe(permissions.length)
      })
    })

    it('should follow permission hierarchy', () => {
      const viewerPerms = new Set(ROLE_PERMISSIONS.viewer)
      const editorPerms = new Set(ROLE_PERMISSIONS.editor)
      const ownerPerms = new Set(ROLE_PERMISSIONS.owner)

      // Editor should have all viewer permissions
      viewerPerms.forEach(perm => {
        expect(editorPerms.has(perm)).toBe(true)
      })

      // Owner should have all editor permissions
      editorPerms.forEach(perm => {
        expect(ownerPerms.has(perm)).toBe(true)
      })
    })
  })

  describe('Permission categories', () => {
    it('should have project management permissions', () => {
      const projectPerms = ['project:read', 'project:update', 'project:delete', 'project:manage_members']
      
      projectPerms.forEach(perm => {
        expect(hasPermission('owner', perm as Permission)).toBe(true)
      })
    })

    it('should have feedback management permissions', () => {
      const feedbackPerms = ['feedback:read', 'feedback:create', 'feedback:update', 'feedback:delete', 'feedback:moderate']
      
      feedbackPerms.forEach(perm => {
        expect(hasPermission('owner', perm as Permission)).toBe(true)
      })
    })

    it('should have widget management permissions', () => {
      const widgetPerms = ['widget:read', 'widget:update', 'widget:configure']
      
      widgetPerms.forEach(perm => {
        expect(hasPermission('owner', perm as Permission)).toBe(true)
      })
    })

    it('should have analytics permissions', () => {
      const analyticsPerms = ['analytics:read', 'analytics:export']
      
      analyticsPerms.forEach(perm => {
        expect(hasPermission('owner', perm as Permission)).toBe(true)
      })
    })
  })
})