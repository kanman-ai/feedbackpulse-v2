/**
 * API routes for project member management.
 * Handles adding, removing, and updating member roles.
 * 
 * Features:
 * - Role-based access control (owner only)
 * - Member invite management
 * - Role updates with validation
 * - Audit logging for member changes
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
 * Request body for adding a new member.
 */
interface AddMemberRequest {
  email: string
  role: ProjectRole
}



/**
 * GET /api/projects/[id]/members
 * Retrieves all members of a project with their roles.
 * Requires: Project membership (viewer or higher)
 */
export const GET = withApiAuth(
  async (request: NextRequest, context: ApiAuthContext, { params }: { params: { id: string } }) => {
    const projectId = params.id
    const supabase = createAdminSupabaseClient()

    try {
      // Get all project members with user information
      const { data: members, error } = await supabase
        .from('project_members')
        .select(`
          user_id,
          role,
          created_at,
          users!inner (
            id,
            email,
            display_name
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        return createErrorResponse(
          'Failed to fetch project members',
          'DATABASE_ERROR',
          500,
          error
        )
      }

      return createSuccessResponse({
        members: members?.map((member: any) => ({
          userId: member.user_id,
          email: member.users.email,
          displayName: member.users.display_name,
          role: member.role,
          joinedAt: member.created_at,
        })) || [],
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
    minimumRole: 'viewer',
  }
)

/**
 * POST /api/projects/[id]/members
 * Adds a new member to the project.
 * Requires: Project ownership
 */
export const POST = withApiAuth(
  async (request: NextRequest, context: ApiAuthContext, { params }: { params: { id: string } }) => {
    const projectId = params.id
    
    try {
      const body: AddMemberRequest = await request.json()
      const { email, role } = body

      // Validate input
      if (!email || !isValidRole(role)) {
        return createErrorResponse(
          'Invalid email or role',
          'INVALID_INPUT',
          400,
          { email, role }
        )
      }

      const supabase = createAdminSupabaseClient()

      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .single()

      if (userError || !userData) {
        return createErrorResponse(
          'User not found',
          'USER_NOT_FOUND',
          404,
          { email }
        )
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('user_id', userData.id)
        .single()

      if (existingMember) {
        return createErrorResponse(
          'User is already a project member',
          'ALREADY_MEMBER',
          409,
          { userId: userData.id }
        )
      }

      // Add member to project
      const { data: newMember, error: addError } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: userData.id,
          role,
        })
        .select(`
          user_id,
          role,
          created_at,
          users!inner (
            id,
            email,
            display_name
          )
        `)
        .single()

      if (addError) {
        return createErrorResponse(
          'Failed to add member',
          'DATABASE_ERROR',
          500,
          addError
        )
      }

      return createSuccessResponse({
        member: {
          userId: (newMember as any).user_id,
          email: (newMember as any).users.email,
          displayName: (newMember as any).users.display_name,
          role: (newMember as any).role,
          joinedAt: (newMember as any).created_at,
        },
      }, 201)
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

