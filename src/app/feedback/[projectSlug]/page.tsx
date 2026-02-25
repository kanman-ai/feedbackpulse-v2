/**
 * Public feedback page for project-specific feedback collection.
 * This page allows anyone to submit feedback for a specific project using a shareable URL.
 * The page is public and does not require authentication.
 */

import { createServerClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PublicFeedbackForm from '@/components/PublicFeedbackForm'

/**
 * Route parameters for the dynamic feedback page
 */
interface FeedbackPageProps {
  params: {
    projectSlug: string
  }
}

/**
 * Type definition for project data fetched from the database
 */
type ProjectData = Database['public']['Tables']['projects']['Row']

/**
 * Fetches project data by slug for the public feedback page.
 * This function runs on the server and retrieves project information
 * needed to display the feedback form with proper branding.
 * 
 * @param slug - The project slug from the URL parameter
 * @returns Project data if found, null if not found or on error
 */
async function getProjectBySlug(slug: string): Promise<ProjectData | null> {
  try {
    const supabase = createServerClient()
    
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching project:', error)
      return null
    }

    return project
  } catch (error) {
    console.error('Unexpected error fetching project:', error)
    return null
  }
}

/**
 * Generates metadata for the feedback page based on the project information.
 * This ensures proper SEO and social sharing for the feedback page.
 * 
 * @param params - Route parameters containing the project slug
 * @returns Metadata object for the page
 */
export async function generateMetadata({ params }: FeedbackPageProps): Promise<Metadata> {
  const project = await getProjectBySlug(params.projectSlug)
  
  if (!project) {
    return {
      title: 'Feedback - Not Found',
      description: 'The requested project was not found.',
    }
  }

  return {
    title: `Feedback for ${project.name} - FeedbackPulse`,
    description: `Submit feedback for ${project.name}. Your input helps improve this project.`,
    robots: 'noindex, nofollow', // Prevent indexing of feedback pages
  }
}

/**
 * Public feedback page component.
 * Displays a feedback form for the specified project, allowing anonymous users
 * to submit ratings and comments. Shows proper project branding and information.
 * 
 * @param params - Route parameters containing the project slug
 * @returns JSX element for the feedback page or 404 if project not found
 */
export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const project = await getProjectBySlug(params.projectSlug)

  // Return 404 if project doesn't exist or is inactive
  if (!project) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Share Your Feedback
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            for <span className="font-semibold text-gray-900">{project.name}</span>
          </p>
          {project.description && (
            <p className="text-sm text-gray-500">
              {project.description}
            </p>
          )}
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <PublicFeedbackForm projectId={project.id} projectSlug={project.slug} />
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Powered by <span className="font-semibold">FeedbackPulse</span>
          </p>
        </div>
      </div>
    </div>
  )
}