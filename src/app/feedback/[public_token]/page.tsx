/**
 * Public feedback view page for FeedbackPulse v2.
 * Displays project feedback data without requiring authentication.
 * Accessible via /feedback/:public_token URL pattern.
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PublicFeedbackView } from '@/components/feedback/PublicFeedbackView'

/**
 * Route parameters for the public feedback page
 */
interface PublicFeedbackPageProps {
  params: {
    public_token: string
  }
}

/**
 * Generates metadata for the public feedback page.
 * Includes basic SEO optimization while preserving privacy.
 * 
 * @param props - Page props containing the public token
 * @returns Metadata object for the page
 */
export async function generateMetadata(
  { params }: PublicFeedbackPageProps
): Promise<Metadata> {
  // Don't reveal project details in metadata for privacy
  return {
    title: 'Project Feedback - FeedbackPulse',
    description: 'View public feedback and ratings for this project',
    robots: {
      index: false, // Don't index public feedback pages
      follow: false
    }
  }
}

/**
 * Public feedback page component.
 * Renders a read-only view of project feedback data using the public token.
 * 
 * @param props - Page props containing the public token
 * @returns JSX element or notFound() if invalid token
 */
export default async function PublicFeedbackPage(
  { params }: PublicFeedbackPageProps
) {
  const { public_token } = params
  
  // Validate public token format (basic validation)
  if (!public_token || public_token.length < 10) {
    notFound()
  }
  
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <PublicFeedbackView publicToken={public_token} />
      </div>
    </main>
  )
}