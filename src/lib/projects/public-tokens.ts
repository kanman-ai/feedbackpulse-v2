/**
 * Utility functions for managing public tokens for project feedback sharing.
 * Handles token generation, validation, and database operations.
 */

import { createAdminSupabaseClient } from '@/lib/supabase/server'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase/types'
import { randomBytes } from 'crypto'

/**
 * Generates a cryptographically secure random public token.
 * Uses 32 bytes of entropy for high security while maintaining URL-friendliness.
 * 
 * @returns URL-safe random token string
 */
export function generatePublicToken(): string {
  // Generate 32 bytes of random data and encode as URL-safe base64
  return randomBytes(32)
    .toString('base64')
    .replace(/[+]/g, '-')
    .replace(/[/]/g, '_')
    .replace(/[=]/g, '') // Remove padding
}

/**
 * Validates a public token format without checking database existence.
 * Ensures token meets basic security and format requirements.
 * 
 * @param token - Token string to validate
 * @returns True if token format is valid
 */
export function validatePublicTokenFormat(token: string): boolean {
  // Token should be at least 32 characters (base64 encoded 24+ bytes)
  // and contain only URL-safe characters
  const tokenRegex = /^[A-Za-z0-9_-]{32,}$/
  return tokenRegex.test(token)
}

/**
 * Enables public sharing for a project by generating and storing a public token.
 * Only the project owner can enable public sharing.
 * 
 * @param projectId - UUID of the project to enable sharing for
 * @param userId - UUID of the user requesting the action (must be project owner)
 * @returns Object containing success status and the generated token
 */
export async function enablePublicSharing(
  projectId: string,
  userId: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient()
    
    // Verify user owns the project
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, user_id, public_token')
      .eq('id', projectId)
      .single()
    
    if (fetchError || !project) {
      return { success: false, error: 'Project not found' }
    }
    
    if (project.user_id !== userId) {
      return { success: false, error: 'Unauthorized: You must own this project' }
    }
    
    // If already has a token, return existing one
    if (project.public_token) {
      return { success: true, token: project.public_token }
    }
    
    // Generate new token
    const newToken = generatePublicToken()
    
    // Update project with new token
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        public_token: newToken,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
    
    if (updateError) {
      console.error('Error updating project with public token:', updateError)
      return { success: false, error: 'Failed to enable public sharing' }
    }
    
    return { success: true, token: newToken }
    
  } catch (error) {
    console.error('Error enabling public sharing:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Disables public sharing for a project by removing its public token.
 * Only the project owner can disable public sharing.
 * 
 * @param projectId - UUID of the project to disable sharing for
 * @param userId - UUID of the user requesting the action (must be project owner)
 * @returns Object containing success status and any error message
 */
export async function disablePublicSharing(
  projectId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminSupabaseClient()
    
    // Verify user owns the project
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single()
    
    if (fetchError || !project) {
      return { success: false, error: 'Project not found' }
    }
    
    if (project.user_id !== userId) {
      return { success: false, error: 'Unauthorized: You must own this project' }
    }
    
    // Remove public token
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        public_token: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
    
    if (updateError) {
      console.error('Error removing public token:', updateError)
      return { success: false, error: 'Failed to disable public sharing' }
    }
    
    return { success: true }
    
  } catch (error) {
    console.error('Error disabling public sharing:', error)
    return { success: false, error: 'Internal server error' }
  }
}

/**
 * Retrieves the public sharing status and token for a project.
 * Only returns data if the user owns the project.
 * 
 * @param projectId - UUID of the project to check
 * @param userId - UUID of the user requesting the information
 * @returns Object containing sharing status and token (if enabled)
 */
export async function getPublicSharingInfo(
  projectId: string,
  userId: string
): Promise<{ 
  success: boolean
  isEnabled: boolean
  token?: string
  publicUrl?: string
  error?: string
}> {
  try {
    const supabase = createAdminSupabaseClient()
    
    // Verify user owns the project and get token
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, user_id, public_token')
      .eq('id', projectId)
      .single()
    
    if (fetchError || !project) {
      return { success: false, isEnabled: false, error: 'Project not found' }
    }
    
    if (project.user_id !== userId) {
      return { 
        success: false, 
        isEnabled: false, 
        error: 'Unauthorized: You must own this project' 
      }
    }
    
    const isEnabled = !!project.public_token
    const result: any = {
      success: true,
      isEnabled
    }
    
    // Only include token and URL if sharing is enabled
    if (isEnabled && project.public_token) {
      result.token = project.public_token
      result.publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/feedback/${project.public_token}`
    }
    
    return result
    
  } catch (error) {
    console.error('Error getting public sharing info:', error)
    return { success: false, isEnabled: false, error: 'Internal server error' }
  }
}

/**
 * Client-side hook for managing public sharing state.
 * Provides functions to enable/disable sharing and get current status.
 */
export function usePublicSharing() {
  const supabase = createClientComponentClient<Database>()
  
  return {
    /**
     * Client-side wrapper for enabling public sharing
     */
    async enableSharing(projectId: string, userId: string) {
      const response = await fetch('/api/projects/public-sharing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, action: 'enable' })
      })
      
      return await response.json()
    },
    
    /**
     * Client-side wrapper for disabling public sharing
     */
    async disableSharing(projectId: string) {
      const response = await fetch('/api/projects/public-sharing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, action: 'disable' })
      })
      
      return await response.json()
    },
    
    /**
     * Client-side wrapper for getting sharing status
     */
    async getSharingInfo(projectId: string) {
      const response = await fetch(`/api/projects/${projectId}/public-sharing`)
      return await response.json()
    }
  }
}