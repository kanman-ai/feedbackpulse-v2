/**
 * API routes for individual project member management.
 * Handles updating and removing specific members.
 */

import { NextRequest } from 'next/server'
import { 
  withApiAuth, 
  createSuccessResponse, 
  createErrorResponse,
  type ApiAuthContext
} from '@/lib/auth/api-middleware'
import { createClient } from '@supabase/supabase-js'
import { type ProjectRole, isValidRole } from '@/lib/auth/rbac'

/**
 * Creates a Supabase admin client for privileged operations.
 */
function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * Request body for updating member role.
 */
interface UpdateMemberRequest {
  role: ProjectRole
}

/**
 * PATCH /api/projects/[id]/members/[userId]
 * Updates a member's role.
 * Requires: Project ownership
 */
export const PATCH = withApiAuth(
  async (
    request: NextRequest, 
    context: ApiAuthContext, 
    { params }: { params: { id: string; userId: string } }
  ) => {
    const projectId = params.id
    const targetUserId = params.userId
    
    try {
      const body: UpdateMemberRequest = await request.json()
      const { role } = body

      // Validate role
      if (!isValidRole(role)) {
        return createErrorResponse(
          'Invalid role',
          'INVALID_ROLE',
          400,
          { role }
        )
      }

      // Prevent self-role changes for owners (to avoid lockout)
      if (context.user.id === targetUserId && context.projectMembership?.role === 'owner') {
        return createErrorResponse(
          'Owners cannot change their own role',
          'SELF_ROLE_CHANGE_FORBIDDEN',
          403
        )
      }

      const supabase = createAdminSupabaseClient()

      // Update member role
      const { data: updatedMember, error: updateError } = await supabase
        .from('project_members')
        .update({ role })
        .eq('project_id', projectId)
        .eq('user_id', targetUserId)
        .select(`
          user_id,
          role,
          users!inner (
            id,
            email,
            display_name
          )
        `)
        .single()

      if (updateError) {
        return createErrorResponse(
          'Failed to update member role',
          'DATABASE_ERROR',
          500,
          updateError
        )
      }

      return createSuccessResponse({
        member: {
          userId: (updatedMember as any).user_id,
          email: (updatedMember as any).users.email,
          displayName: (updatedMember as any).users.display_name,
          role: (updatedMember as any).role,
        },
      })
    } catch (error) {
      return createErrorResponse(
        'Internal server error',
        'INTERNAL_ERROR',
        500,
        error
      )
    }
  },
  {
    requireAuth: true,
    requireProjectMembership: true,
    minimumRole: 'owner',
    requiredPermissions: ['project:manage_members'],
  }
)

/**
 * DELETE /api/projects/[id]/members/[userId]
 * Removes a member from the project.
 * Requires: Project ownership
 */
export const DELETE = withApiAuth(
  async (
    request: NextRequest, 
    context: ApiAuthContext, 
    { params }: { params: { id: string; userId: string } }
  ) => {
    const projectId = params.id
    const targetUserId = params.userId
    
    try {
      // Prevent self-removal for owners (to avoid lockout)
      if (context.user.id === targetUserId && context.projectMembership?.role === 'owner') {
        return createErrorResponse(
          'Owners cannot remove themselves',
          'SELF_REMOVAL_FORBIDDEN',
          403
        )
      }

      const supabase = createAdminSupabaseClient()

      // Remove member from project
      const { error: deleteError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', targetUserId)

      if (deleteError) {
        return createErrorResponse(
          'Failed to remove member',
          'DATABASE_ERROR',
          500,
          deleteError
        )
      }

      return createSuccessResponse({ success: true })
    } catch (error) {
      return createErrorResponse(
        'Internal server error',
        'INTERNAL_ERROR',
        500,
        error
      )
    }
  },
  {
    requireAuth: true,
    requireProjectMembership: true,
    minimumRole: 'owner',
    requiredPermissions: ['project:manage_members'],
  }
)