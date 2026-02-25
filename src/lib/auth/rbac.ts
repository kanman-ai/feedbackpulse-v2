/**
 * Role-Based Access Control (RBAC) system for FeedbackPulse v2.
 * Defines project-level roles and their permissions, and provides
 * utilities for permission checking and middleware integration.
 * 
 * Roles:
 * - owner: Full control over project, including deletion and member management
 * - editor: Can manage feedback, widget settings, and view analytics
 * - viewer: Read-only access to project content and analytics
 */

/**
 * Available project roles in order of increasing permissions.
 */
export type ProjectRole = 'viewer' | 'editor' | 'owner'

/**
 * Specific permissions that can be granted to roles.
 */
export type Permission = 
  // Project management
  | 'project:read'
  | 'project:update'
  | 'project:delete'
  | 'project:manage_members'
  | 'project:manage_invites'
  
  // Feedback management
  | 'feedback:read'
  | 'feedback:create'
  | 'feedback:update'
  | 'feedback:delete'
  | 'feedback:moderate'
  
  // Widget management
  | 'widget:read'
  | 'widget:update'
  | 'widget:configure'
  
  // Analytics
  | 'analytics:read'
  | 'analytics:export'

/**
 * Permission matrix defining what each role can do.
 * Higher roles inherit all permissions from lower roles.
 */
export const ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
  viewer: [
    'project:read',
    'feedback:read',
    'widget:read',
    'analytics:read',
  ],
  editor: [
    'project:read',
    'project:update',
    'feedback:read',
    'feedback:create',
    'feedback:update',
    'feedback:delete',
    'feedback:moderate',
    'widget:read',
    'widget:update',
    'widget:configure',
    'analytics:read',
    'analytics:export',
  ],
  owner: [
    'project:read',
    'project:update',
    'project:delete',
    'project:manage_members',
    'project:manage_invites',
    'feedback:read',
    'feedback:create',
    'feedback:update',
    'feedback:delete',
    'feedback:moderate',
    'widget:read',
    'widget:update',
    'widget:configure',
    'analytics:read',
    'analytics:export',
  ],
}

/**
 * Role hierarchy for comparison operations.
 * Higher index = higher permissions.
 */
const ROLE_HIERARCHY: ProjectRole[] = ['viewer', 'editor', 'owner']

/**
 * Checks if a role has a specific permission.
 * 
 * @param role - The role to check
 * @param permission - The permission to verify
 * @returns True if the role has the permission
 */
export function hasPermission(role: ProjectRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

/**
 * Checks if a role has at least the specified minimum role level.
 * 
 * @param userRole - The user's current role
 * @param requiredRole - The minimum role required
 * @returns True if user role meets or exceeds the required role
 */
export function hasMinimumRole(userRole: ProjectRole, requiredRole: ProjectRole): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole)
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole)
  return userIndex >= requiredIndex
}

/**
 * Gets all permissions for a specific role.
 * 
 * @param role - The role to get permissions for
 * @returns Array of permissions granted to the role
 */
export function getRolePermissions(role: ProjectRole): Permission[] {
  return ROLE_PERMISSIONS[role]
}

/**
 * Checks if a role can perform any of the specified permissions.
 * 
 * @param role - The role to check
 * @param permissions - Array of permissions to check
 * @returns True if the role has at least one of the permissions
 */
export function hasAnyPermission(role: ProjectRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission))
}

/**
 * Checks if a role can perform all of the specified permissions.
 * 
 * @param role - The role to check
 * @param permissions - Array of permissions to check
 * @returns True if the role has all of the permissions
 */
export function hasAllPermissions(role: ProjectRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission))
}

/**
 * Gets the role hierarchy level for ordering purposes.
 * 
 * @param role - The role to get the level for
 * @returns Numeric level (0 = lowest, higher = more permissions)
 */
export function getRoleLevel(role: ProjectRole): number {
  return ROLE_HIERARCHY.indexOf(role)
}

/**
 * Type guard to check if a string is a valid ProjectRole.
 * 
 * @param value - String value to check
 * @returns True if value is a valid ProjectRole
 */
export function isValidRole(value: string): value is ProjectRole {
  return ROLE_HIERARCHY.includes(value as ProjectRole)
}

/**
 * Project member with role information.
 */
export interface ProjectMember {
  userId: string
  projectId: string
  role: ProjectRole
  joinedAt: Date
}

/**
 * Context object containing user's project permissions.
 */
export interface ProjectPermissionContext {
  userId: string
  projectId: string
  role: ProjectRole
  permissions: Permission[]
  isOwner: boolean
}