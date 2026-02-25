/**
 * React hooks for project management in FeedbackPulse v2.
 * Provides state management, caching, and optimistic updates for project operations.
 * 
 * These hooks integrate with React Query for efficient data fetching and caching,
 * and provide a clean API for components to interact with project data.
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth/auth-context'
import {
  getUserProjects,
  createProject,
  updateProject,
  deleteProject,
  generateInviteLink,
  joinProjectByInvite,
  removeMember,
  updateMemberRole,
  type ProjectWithMembers,
  type ProjectInviteLink,
} from './projects-service'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

/**
 * Hook for fetching user's projects with real-time updates.
 * Automatically refetches when user changes or data becomes stale.
 * 
 * @returns Query result with projects data, loading state, and error handling
 */
export function useProjects() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['projects', user?.id],
    queryFn: () => getUserProjects(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for creating new projects with optimistic updates.
 * Automatically updates the projects list and shows success/error toasts.
 * 
 * @returns Mutation object with create function and loading state
 */
export function useCreateProject() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (projectData: { name: string; description?: string }) =>
      createProject(projectData, user!.id),
    onMutate: async (newProject) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['projects', user!.id] })

      // Snapshot previous value for rollback
      const previousProjects = queryClient.getQueryData(['projects', user!.id])

      // Optimistically update with temporary project
      const optimisticProject: ProjectWithMembers = {
        id: `temp-${Date.now()}`,
        name: newProject.name,
        description: newProject.description || null,
        owner_id: user!.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        project_members: [{
          id: `temp-member-${Date.now()}`,
          project_id: `temp-${Date.now()}`,
          user_id: user!.id,
          role: 'admin' as const,
          created_at: new Date().toISOString(),
          user_profiles: {
            id: user!.id,
            email: user!.email || '',
            display_name: user!.user_metadata?.display_name || null,
          }
        }]
      }

      queryClient.setQueryData(
        ['projects', user!.id],
        (old: ProjectWithMembers[] = []) => [optimisticProject, ...old]
      )

      return { previousProjects }
    },
    onError: (err, newProject, context) => {
      // Rollback on error
      queryClient.setQueryData(['projects', user!.id], context?.previousProjects)
      toast.error('Failed to create project', {
        description: err instanceof Error ? err.message : 'Unknown error occurred',
      })
    },
    onSuccess: (project) => {
      // Replace optimistic update with real data
      queryClient.invalidateQueries({ queryKey: ['projects', user!.id] })
      toast.success('Project created successfully', {
        description: `${project.name} is ready for your team`,
      })
      router.push(`/projects/${project.id}`)
    },
  })
}

/**
 * Hook for updating project metadata with optimistic updates.
 * Updates cached data immediately and rolls back on error.
 * 
 * @returns Mutation object with update function and loading state
 */
export function useUpdateProject() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      projectId, 
      updates 
    }: { 
      projectId: string; 
      updates: { name?: string; description?: string } 
    }) =>
      updateProject(projectId, updates, user!.id),
    onMutate: async ({ projectId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['projects', user!.id] })
      
      const previousProjects = queryClient.getQueryData(['projects', user!.id])
      
      // Optimistically update project in cache
      queryClient.setQueryData(
        ['projects', user!.id],
        (old: ProjectWithMembers[] = []) =>
          old.map(project =>
            project.id === projectId
              ? { ...project, ...updates, updated_at: new Date().toISOString() }
              : project
          )
      )

      return { previousProjects }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['projects', user!.id], context?.previousProjects)
      toast.error('Failed to update project', {
        description: err instanceof Error ? err.message : 'Unknown error occurred',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user!.id] })
      toast.success('Project updated successfully')
    },
  })
}

/**
 * Hook for deleting projects with confirmation flow.
 * Removes project from cache optimistically and handles rollback.
 * 
 * @returns Mutation object with delete function and loading state
 */
export function useDeleteProject() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId, user!.id),
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: ['projects', user!.id] })
      
      const previousProjects = queryClient.getQueryData(['projects', user!.id])
      
      // Optimistically remove project from cache
      queryClient.setQueryData(
        ['projects', user!.id],
        (old: ProjectWithMembers[] = []) =>
          old.filter(project => project.id !== projectId)
      )

      return { previousProjects }
    },
    onError: (err, projectId, context) => {
      queryClient.setQueryData(['projects', user!.id], context?.previousProjects)
      toast.error('Failed to delete project', {
        description: err instanceof Error ? err.message : 'Unknown error occurred',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user!.id] })
      toast.success('Project deleted successfully')
      router.push('/projects')
    },
  })
}

/**
 * Hook for generating project invite links.
 * Creates shareable links with role-based access control.
 * 
 * @returns Mutation object with generate function and loading state
 */
export function useGenerateInvite() {
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ 
      projectId, 
      role 
    }: { 
      projectId: string; 
      role: 'viewer' | 'editor' 
    }) =>
      generateInviteLink(projectId, role, user!.id),
    onSuccess: (inviteLink) => {
      // Copy link to clipboard
      const inviteUrl = `${window.location.origin}/projects/join/${inviteLink.token}`
      navigator.clipboard.writeText(inviteUrl)
      
      toast.success('Invite link generated and copied', {
        description: 'Share this link with team members to invite them',
      })
    },
    onError: (err) => {
      toast.error('Failed to generate invite link', {
        description: err instanceof Error ? err.message : 'Unknown error occurred',
      })
    },
  })
}

/**
 * Hook for joining projects via invite links.
 * Handles token validation and adds user to project team.
 * 
 * @returns Mutation object with join function and loading state
 */
export function useJoinProject() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (token: string) => joinProjectByInvite(token, user!.id),
    onSuccess: (project) => {
      // Invalidate projects cache to include new project
      queryClient.invalidateQueries({ queryKey: ['projects', user!.id] })
      
      toast.success('Successfully joined project', {
        description: `Welcome to ${project.name}!`,
      })
      
      router.push(`/projects/${project.id}`)
    },
    onError: (err) => {
      toast.error('Failed to join project', {
        description: err instanceof Error ? err.message : 'Invalid or expired invite link',
      })
    },
  })
}

/**
 * Hook for removing team members from projects.
 * Only admins can remove members, with proper permission checks.
 * 
 * @returns Mutation object with remove function and loading state
 */
export function useRemoveMember() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      projectId, 
      memberUserId 
    }: { 
      projectId: string; 
      memberUserId: string 
    }) =>
      removeMember(projectId, memberUserId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user!.id] })
      toast.success('Member removed from project')
    },
    onError: (err) => {
      toast.error('Failed to remove member', {
        description: err instanceof Error ? err.message : 'Unknown error occurred',
      })
    },
  })
}

/**
 * Hook for updating team member roles.
 * Handles role changes with proper permission validation.
 * 
 * @returns Mutation object with update function and loading state
 */
export function useUpdateMemberRole() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      projectId, 
      memberUserId, 
      newRole 
    }: { 
      projectId: string; 
      memberUserId: string; 
      newRole: 'viewer' | 'editor' | 'admin' 
    }) =>
      updateMemberRole(projectId, memberUserId, newRole, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', user!.id] })
      toast.success('Member role updated successfully')
    },
    onError: (err) => {
      toast.error('Failed to update member role', {
        description: err instanceof Error ? err.message : 'Unknown error occurred',
      })
    },
  })
}