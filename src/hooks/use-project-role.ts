/**
 * React hook for managing project role-based access control.
 * Provides current user's role and permission checking utilities
 * for a specific project.
 * 
 * Features:
 * - Real-time role updates via Supabase subscriptions
 * - Permission checking helpers
 * - Loading and error states
 * - Automatic cleanup on unmount
 */

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Create a client for the hook
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Simple user hook placeholder - this would normally come from auth context
const useUser = () => {
  // This would be implemented with proper auth context in a real app
  return null
}

const useSupabaseClient = () => supabase
import { 
  type ProjectRole, 
  type Permission,
  hasPermission, 
  hasMinimumRole,
  hasAnyPermission,
  hasAllPermissions
} from '@/lib/auth/rbac'

/**
 * Project membership information.
 */
export interface ProjectMembership {
  projectId: string
  role: ProjectRole
  isOwner: boolean
  joinedAt: Date
}

/**
 * Hook state for project role management.
 */
export interface UseProjectRoleState {
  /** Current user's membership in the project */
  membership: ProjectMembership | null
  /** Whether the role data is being loaded */
  loading: boolean
  /** Error message if role fetch failed */
  error: string | null
  /** Whether user is a project member */
  isMember: boolean
  /** Whether user is project owner */
  isOwner: boolean
}

/**
 * Permission checking utilities.
 */
export interface ProjectPermissions {
  /** Check if user has a specific permission */
  hasPermission: (permission: Permission) => boolean
  /** Check if user has minimum role level */
  hasMinimumRole: (requiredRole: ProjectRole) => boolean
  /** Check if user has any of the specified permissions */
  hasAnyPermission: (permissions: Permission[]) => boolean
  /** Check if user has all of the specified permissions */
  hasAllPermissions: (permissions: Permission[]) => boolean
  /** Check if user can perform a specific action */
  canPerformAction: (requiredPermissions: Permission[]) => boolean
}

/**
 * Hook for managing project role-based access control.
 * 
 * @param projectId - ID of the project to check membership for
 * @returns Role state and permission checking utilities
 */
export function useProjectRole(projectId: string | null): [
  UseProjectRoleState,
  ProjectPermissions
] {
  const [membership, setMembership] = useState<ProjectMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = useSupabaseClient()
  const user = useUser()

  /**
   * Fetches user's project membership and role.
   */
  const fetchMembership = async () => {
    if (!projectId || !user) {
      setMembership(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Get project membership with role information
      const { data: membershipData, error: membershipError } = await supabase
        .from('project_members')
        .select(`
          role,
          created_at,
          projects!inner(
            id,
            owner_id
          )
        `)
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

      if (membershipError) {
        if (membershipError.code === 'PGRST116') {
          // No membership found - user is not a member
          setMembership(null)
        } else {
          throw membershipError
        }
      } else if (membershipData && (membershipData as any).projects) {
        setMembership({
          projectId,
          role: (membershipData as any).role as ProjectRole,
          isOwner: (membershipData as any).projects.owner_id === user.id,
          joinedAt: new Date((membershipData as any).created_at),
        })
      } else {
        setMembership(null)
      }
    } catch (err) {
      console.error('Error fetching project membership:', err)
      setError(err instanceof Error ? err.message : 'Failed to load project role')
      setMembership(null)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Sets up real-time subscription for membership changes.
   */
  useEffect(() => {
    if (!projectId || !user) {
      setMembership(null)
      setLoading(false)
      return
    }

    // Initial fetch
    fetchMembership()

    // Subscribe to membership changes
    const subscription = supabase
      .channel(`project_membership:${projectId}:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_members',
          filter: `project_id=eq.${projectId},user_id=eq.${user.id}`,
        },
        () => {
          // Refetch membership when changes occur
          fetchMembership()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [projectId, user?.id, supabase])

  // Build state object
  const state: UseProjectRoleState = {
    membership,
    loading,
    error,
    isMember: membership !== null,
    isOwner: membership?.isOwner ?? false,
  }

  // Build permission checking utilities
  const permissions: ProjectPermissions = {
    hasPermission: (permission: Permission) => {
      return membership ? hasPermission(membership.role, permission) : false
    },
    
    hasMinimumRole: (requiredRole: ProjectRole) => {
      return membership ? hasMinimumRole(membership.role, requiredRole) : false
    },
    
    hasAnyPermission: (permissions: Permission[]) => {
      return membership ? hasAnyPermission(membership.role, permissions) : false
    },
    
    hasAllPermissions: (permissions: Permission[]) => {
      return membership ? hasAllPermissions(membership.role, permissions) : false
    },
    
    canPerformAction: (requiredPermissions: Permission[]) => {
      return membership ? hasAllPermissions(membership.role, requiredPermissions) : false
    },
  }

  return [state, permissions]
}

/**
 * Simplified hook that only returns permission checking for the current role.
 * Useful when you just need to check permissions without state management.
 * 
 * @param role - The role to check permissions for
 * @returns Permission checking utilities
 */
export function useRolePermissions(role: ProjectRole | null): ProjectPermissions {
  const permissions: ProjectPermissions = {
    hasPermission: (permission: Permission) => {
      return role ? hasPermission(role, permission) : false
    },
    
    hasMinimumRole: (requiredRole: ProjectRole) => {
      return role ? hasMinimumRole(role, requiredRole) : false
    },
    
    hasAnyPermission: (permissions: Permission[]) => {
      return role ? hasAnyPermission(role, permissions) : false
    },
    
    hasAllPermissions: (permissions: Permission[]) => {
      return role ? hasAllPermissions(role, permissions) : false
    },
    
    canPerformAction: (requiredPermissions: Permission[]) => {
      return role ? hasAllPermissions(role, requiredPermissions) : false
    },
  }

  return permissions
}