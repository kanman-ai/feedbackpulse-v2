/**
 * Analytics dashboard page for FeedbackPulse v2 projects.
 * 
 * Displays comprehensive feedback analytics including:
 * - Key metrics (total responses, average rating, response rate)
 * - Visual rating distribution chart using Recharts
 * - Recent feedback list for quick insights
 * 
 * Route: /projects/[id]/analytics
 * Access: Project members only (viewer, editor, admin roles)
 */

'use client'

import { useEffect, useState  from 'react'
import { useParams, useRouter } from 'next/navigation'

import { AnalyticsDashboard } from '@/components/projects/AnalyticsDashboard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/lib/auth/auth-context'
import { supabase } from '@/lib/supabase/client'

interface Project {
  id: string
  name: string
  description: string
}

/**
 * Analytics page component for displaying project feedback metrics and insights.
 * Uses client-side authentication and project access verification.
 */
export default function AnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const projectId = params.id as string

  /**
   * Verifies that the current user has access to the specified project.
   * Fetches project data if user has access.
   */
  useEffect(() => {
    async function verifyProjectAccess() {
      if (authLoading) return
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      try {
        // Verify user has access to this project
        const { data: projectData, error } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            description,
            project_members!inner(user_id, role)
          `)
          .eq('id', projectId)
          .eq('project_members.user_id', user.id)
          .single()

        if (error || !projectData) {
          setError('Project not found or you do not have access to it.')
          setLoading(false)
          return
        }

        setProject({
          id: projectData.id,
          name: projectData.name,
          description: projectData.description
        })
        setLoading(false)
      } catch (err) {
        console.error('Error verifying project access:', err)
        setError('Failed to load project. Please try again.')
        setLoading(false)
      }
    }

    verifyProjectAccess()
  }, [user, authLoading, projectId, router])

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground">The requested project could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Feedback insights and metrics for {project.name}
        </p>
      </div>

      <AnalyticsDashboard projectId={projectId} />
    </div>
  )
}