/**
 * Service layer for project management operations in FeedbackPulse v2.
 * Handles CRUD operations, team management, and invite functionality.
 * 
 * This module provides type-safe functions for interacting with the projects
 * and project_members tables, including role-based access control.
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase/types'
import type { User } from '@supabase/auth-helpers-nextjs'

type ProjectRow = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']
type ProjectMemberRow = Database['public']['Tables']['project_members']['Row']
type ProjectMemberInsert = Database['public']['Tables']['project_members']['Insert']

export interface ProjectWithMembers extends ProjectRow {
  project_members: (ProjectMemberRow & {
    user_profiles: {
      id: string
      email: string
      display_name: string | null
    } | null
  })[]
}

export interface ProjectInviteLink {
  token: string
  expires_at: string
  role: 'viewer' | 'editor' | 'admin'
}

/**
 * Fetches all projects where the user is a member or owner.
 * Returns projects with member information for team display.
 * 
 * @param userId - The authenticated user's ID
 * @returns Array of projects with member details
 * @throws Error if database query fails
 */
export async function getUserProjects(userId: string): Promise<ProjectWithMembers[]> {
  const supabase = createClientComponentClient<Database>()

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_members!inner (
        *,
        user_profiles (
          id,
          email,
          display_name
        )
      )
    `)
    .eq('project_members.user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch user projects: ${error.message}`)
  }

  return data || []
}

/**
 * Creates a new project with the current user as admin.
 * Automatically adds the creator as an admin member.
 * 
 * @param projectData - Project creation data (name, description)
 * @param userId - The authenticated user's ID
 * @returns The created project with initial membership
 * @throws Error if creation fails or user lacks permissions
 */
export async function createProject(
  projectData: Pick<ProjectInsert, 'name' | 'description'>,
  userId: string
): Promise<ProjectWithMembers> {
  const supabase = createClientComponentClient<Database>()

  // Create project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      ...projectData,
      owner_id: userId,
    })
    .select()
    .single()

  if (projectError) {
    throw new Error(`Failed to create project: ${projectError.message}`)
  }

  // Add creator as admin member
  const { error: memberError } = await supabase
    .from('project_members')
    .insert({
      project_id: project.id,
      user_id: userId,
      role: 'admin',
    })

  if (memberError) {
    throw new Error(`Failed to add project creator as member: ${memberError.message}`)
  }

  // Fetch the complete project with members
  const { data: completeProject, error: fetchError } = await supabase
    .from('projects')
    .select(`
      *,
      project_members (
        *,
        user_profiles (
          id,
          email,
          display_name
        )
      )
    `)
    .eq('id', project.id)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch created project: ${fetchError.message}`)
  }

  return completeProject
}

/**
 * Updates an existing project's metadata.
 * Only admins and editors can update project details.
 * 
 * @param projectId - UUID of the project to update
 * @param updates - Partial project data to update
 * @param userId - The authenticated user's ID
 * @returns The updated project
 * @throws Error if update fails or user lacks permissions
 */
export async function updateProject(
  projectId: string,
  updates: ProjectUpdate,
  userId: string
): Promise<ProjectRow> {
  const supabase = createClientComponentClient<Database>()

  // Check user permissions
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single()

  if (!membership || !['admin', 'editor'].includes(membership.role)) {
    throw new Error('Insufficient permissions to update project')
  }

  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`)
  }

  return data
}

/**
 * Deletes a project and all associated data.
 * Only project owners can delete projects.
 * 
 * @param projectId - UUID of the project to delete
 * @param userId - The authenticated user's ID
 * @throws Error if deletion fails or user lacks permissions
 */
export async function deleteProject(projectId: string, userId: string): Promise<void> {
  const supabase = createClientComponentClient<Database>()

  // Check if user is owner
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .single()

  if (!project || project.owner_id !== userId) {
    throw new Error('Only project owners can delete projects')
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`)
  }
}

/**
 * Generates a shareable invite link for a project.
 * Links expire after 7 days and include role information.
 * 
 * @param projectId - UUID of the project to invite users to
 * @param role - Role to assign to invited users
 * @param userId - The authenticated user's ID (must be admin)
 * @returns Invite link object with token and expiration
 * @throws Error if generation fails or user lacks permissions
 */
export async function generateInviteLink(
  projectId: string,
  role: 'viewer' | 'editor',
  userId: string
): Promise<ProjectInviteLink> {
  const supabase = createClientComponentClient<Database>()

  // Check user permissions
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single()

  if (!membership || membership.role !== 'admin') {
    throw new Error('Only admins can generate invite links')
  }

  // Generate secure token and expiration
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const { error } = await supabase
    .from('project_invites')
    .insert({
      project_id: projectId,
      token,
      role,
      expires_at: expiresAt.toISOString(),
      invited_by: userId,
    })

  if (error) {
    throw new Error(`Failed to create invite link: ${error.message}`)
  }

  return {
    token,
    expires_at: expiresAt.toISOString(),
    role,
  }
}

/**
 * Joins a project using an invite link token.
 * Validates token expiration and adds user as member.
 * 
 * @param token - Invite link token
 * @param userId - The authenticated user's ID
 * @returns The project the user joined
 * @throws Error if token is invalid, expired, or join fails
 */
export async function joinProjectByInvite(token: string, userId: string): Promise<ProjectRow> {
  const supabase = createClientComponentClient<Database>()

  // Validate invite token
  const { data: invite, error: inviteError } = await supabase
    .from('project_invites')
    .select(`
      *,
      projects (*)
    `)
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (inviteError || !invite) {
    throw new Error('Invalid or expired invite link')
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', invite.project_id)
    .eq('user_id', userId)
    .single()

  if (existingMember) {
    throw new Error('User is already a member of this project')
  }

  // Add user as member
  const { error: memberError } = await supabase
    .from('project_members')
    .insert({
      project_id: invite.project_id,
      user_id: userId,
      role: invite.role,
    })

  if (memberError) {
    throw new Error(`Failed to join project: ${memberError.message}`)
  }

  // Clean up used invite token
  await supabase
    .from('project_invites')
    .delete()
    .eq('token', token)

  return invite.projects
}

/**
 * Removes a member from a project.
 * Only admins can remove members, and owners cannot be removed.
 * 
 * @param projectId - UUID of the project
 * @param memberUserId - ID of the user to remove
 * @param currentUserId - The authenticated user's ID
 * @throws Error if removal fails or user lacks permissions
 */
export async function removeMember(
  projectId: string,
  memberUserId: string,
  currentUserId: string
): Promise<void> {
  const supabase = createClientComponentClient<Database>()

  // Check current user permissions
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', currentUserId)
    .single()

  if (!membership || membership.role !== 'admin') {
    throw new Error('Only admins can remove members')
  }

  // Check if trying to remove project owner
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .single()

  if (project?.owner_id === memberUserId) {
    throw new Error('Cannot remove project owner')
  }

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', memberUserId)

  if (error) {
    throw new Error(`Failed to remove member: ${error.message}`)
  }
}

/**
 * Updates a member's role in a project.
 * Only admins can change roles, and owner role cannot be changed.
 * 
 * @param projectId - UUID of the project
 * @param memberUserId - ID of the user whose role to update
 * @param newRole - New role to assign
 * @param currentUserId - The authenticated user's ID
 * @throws Error if update fails or user lacks permissions
 */
export async function updateMemberRole(
  projectId: string,
  memberUserId: string,
  newRole: 'viewer' | 'editor' | 'admin',
  currentUserId: string
): Promise<void> {
  const supabase = createClientComponentClient<Database>()

  // Check current user permissions
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', currentUserId)
    .single()

  if (!membership || membership.role !== 'admin') {
    throw new Error('Only admins can update member roles')
  }

  // Check if trying to change project owner's role
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id')
    .eq('id', projectId)
    .single()

  if (project?.owner_id === memberUserId) {
    throw new Error('Cannot change project owner role')
  }

  const { error } = await supabase
    .from('project_members')
    .update({ role: newRole })
    .eq('project_id', projectId)
    .eq('user_id', memberUserId)

  if (error) {
    throw new Error(`Failed to update member role: ${error.message}`)
  }
}