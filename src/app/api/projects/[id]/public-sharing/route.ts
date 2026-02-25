/**
 * API route for getting project public sharing status.
 * Returns current public sharing configuration for project owners.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getPublicSharingInfo } from '@/lib/projects/public-tokens'

/**
 * GET /api/projects/[id]/public-sharing
 * 
 * Retrieves the current public sharing status for a project.
 * Requires user authentication and project ownership.
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing project ID
 * @returns JSON response with sharing status and token (if enabled)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
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
    
    // Get public sharing information
    const result = await getPublicSharingInfo(projectId, user.id)
    
    if (!result.success) {
      const statusCode = result.error?.includes('Unauthorized') ? 403 : 404
      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      )
    }
    
    return NextResponse.json({
      isEnabled: result.isEnabled,
      token: result.token,
      publicUrl: result.publicUrl
    })
    
  } catch (error) {
    console.error('Error getting public sharing status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}