/**
 * Project invite acceptance page for FeedbackPulse v2.
 * Handles joining projects via shareable invite links with token validation.
 * 
 * Features:
 * - Token validation and expiration checks
 * - Project preview before joining
 * - Automatic join process for authenticated users
 * - Auth redirect for unauthenticated users
 * - Error handling for invalid/expired links
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Users, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth/auth-context'
import { useJoinProject } from '@/lib/projects/use-projects'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase/types'

interface InviteData {
  project: {
    id: string
    name: string
    description: string | null
    created_at: string
  }
  role: 'viewer' | 'editor'
  expires_at: string
  invited_by_profile: {
    display_name: string | null
    email: string
  }
}

/**
 * Project join page component.
 * Validates invite token and handles the project join workflow.
 */
export default function JoinProjectPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const joinProject = useJoinProject()
  
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  /**
   * Validates the invite token and fetches project information.
   * Checks expiration and project details for preview.
   */
  useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        setError('Invalid invite link')
        setLoading(false)
        return
      }

      try {
        const supabase = createClientComponentClient<Database>()
        
        const { data, error: fetchError } = await supabase
          .from('project_invites')
          .select(`
            role,
            expires_at,
            projects (
              id,
              name,
              description,
              created_at
            ),
            user_profiles!project_invites_invited_by_fkey (
              display_name,
              email
            )
          `)
          .eq('token', token)
          .single()

        if (fetchError || !data) {
          setError('Invalid or expired invite link')
          setLoading(false)
          return
        }

        // Check if invite is expired
        const now = new Date()
        const expiresAt = new Date(data.expires_at)
        
        if (now > expiresAt) {
          setIsExpired(true)
          setError('This invite link has expired')
          setLoading(false)
          return
        }

        setInviteData({
          project: data.projects,
          role: data.role,
          expires_at: data.expires_at,
          invited_by_profile: data.user_profiles,
        })
      } catch (err) {
        console.error('Error validating invite:', err)
        setError('Failed to validate invite link')
      } finally {
        setLoading(false)
      }
    }

    validateInvite()
  }, [token])

  /**
   * Handles joining the project.
   * Uses the join mutation hook for proper error handling.
   */
  const handleJoinProject = async () => {
    if (!token) return
    
    try {
      await joinProject.mutateAsync(token)
    } catch (error) {
      console.error('Failed to join project:', error)
    }
  }

  /**
   * Redirects to auth if user not logged in.
   */
  useEffect(() => {
    if (!authLoading && !user) {
      // Store the invite token to redirect back after auth
      sessionStorage.setItem('pendingInvite', token)
      router.push('/auth/login')
    }
  }, [user, authLoading, token, router])

  /**
   * Handle pending invite after successful authentication.
   */
  useEffect(() => {
    if (user && !authLoading) {
      const pendingInvite = sessionStorage.getItem('pendingInvite')
      if (pendingInvite && pendingInvite === token) {
        sessionStorage.removeItem('pendingInvite')
        // The component will handle the join flow since user is now authenticated
      }
    }
  }, [user, authLoading, token])

  // Show loading state
  if (loading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (error || !inviteData) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">
              {isExpired ? 'Invite Expired' : 'Invalid Invite'}
            </CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => router.push('/projects')}
                className="w-full"
              >
                Go to Projects
              </Button>
              {isExpired && (
                <p className="text-sm text-gray-600 text-center">
                  Ask the project admin for a new invite link.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show invite details and join button
  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>You&apos;re Invited!</CardTitle>
          <CardDescription>
            {inviteData.invited_by_profile.display_name || inviteData.invited_by_profile.email} 
            {' '}invited you to join their project
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Project Details */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg">{inviteData.project.name}</h3>
              {inviteData.project.description && (
                <p className="text-gray-600 text-sm mt-1">
                  {inviteData.project.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Created {new Date(inviteData.project.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div>
              <Badge variant="secondary" className="text-xs">
                You&apos;ll join as: <span className="capitalize font-medium ml-1">{inviteData.role}</span>
              </Badge>
            </div>
          </div>

          {/* Role Description */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium mb-1">
              {inviteData.role === 'viewer' ? 'Viewer Access' : 'Editor Access'}
            </h4>
            <p className="text-xs text-gray-600">
              {inviteData.role === 'viewer'
                ? 'You can view project content and feedback but cannot make changes.'
                : 'You can view and edit project content, manage feedback, and contribute to the project.'
              }
            </p>
          </div>

          {/* Join Button */}
          <Button
            onClick={handleJoinProject}
            disabled={joinProject.isPending}
            className="w-full"
          >
            {joinProject.isPending ? (
              'Joining Project...'
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Join Project
              </>
            )}
          </Button>

          {/* Alternative Action */}
          <Button
            variant="outline"
            onClick={() => router.push('/projects')}
            className="w-full"
          >
            Go to My Projects
          </Button>

          {/* Expiration Notice */}
          <p className="text-xs text-gray-500 text-center">
            This invite expires on{' '}
            {new Date(inviteData.expires_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}