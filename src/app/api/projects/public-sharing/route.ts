/**
 * API route for managing project public sharing settings.
 * Allows project owners to enable/disable public feedback sharing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { enablePublicSharing, disablePublicSharing } from '@/lib/projects/public-tokens'

/**
 * Request body structure for public sharing operations
 */
interface PublicSharingRequest {
  projectId: string
  action: 'enable' | 'disable'
}

/**
 * POST /api/projects/public-sharing
 * 
 * Enables or disables public sharing for a project.
 * Requires user authentication and project ownership.
 * 
 * @param request - Next.js request object with JSON body
 * @returns JSON response with operation result
 */
export async function POST(request: NextRequest) {
  try {
    const body: PublicSharingRequest = await request.json()
    const { projectId, action } = body
    
    if (!projectId || !action) {
      return NextResponse.json(
        { error: 'Project ID and action are required' },
        { status: 400 }
      )
    }
    
    if (!['enable', 'disable'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "enable" or "disable"' },
        { status: 400 }
      )
    }
    
    // Get authenticated user
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    let result
    
    if (action === 'enable') {
      result = await enablePublicSharing(projectId, user.id)
    } else {
      result = await disablePublicSharing(projectId, user.id)
    }
    
    if (!result.success) {
      const statusCode = result.error?.includes('Unauthorized') ? 403 : 500
      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      )
    }
    
    // For enable action, include the token and public URL
    const responseData: any = { success: true, message: `Public sharing ${action}d successfully` }
    
    if (action === 'enable' && result.token) {
      responseData.token = result.token
      responseData.publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/feedback/${result.token}`
    }
    
    return NextResponse.json(responseData)
    
  } catch (error) {
    console.error('Error in public sharing API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}