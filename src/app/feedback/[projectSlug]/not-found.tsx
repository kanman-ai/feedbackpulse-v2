/**
 * Not found page for project feedback URLs.
 * Displayed when a project slug doesn't exist or the project is inactive.
 * Provides user-friendly messaging and navigation options.
 */

import Link from 'next/link'

/**
 * Custom 404 page for feedback project routes.
 * Shown when users visit a feedback URL for a non-existent or inactive project.
 * Provides clear messaging and suggests next steps for the user.
 * 
 * @returns JSX element for the not found page
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg 
              className="w-12 h-12 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m-3 12V6.75a.75.75 0 01.75-.75h6.5a.75.75 0 01.75.75V12" 
              />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Project Not Found
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            We couldn't find the feedback page you're looking for.
          </p>
          
          <div className="text-sm text-gray-500 space-y-2">
            <p>This could happen if:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>The project link has expired</li>
              <li>The project has been deactivated</li>
              <li>The URL was typed incorrectly</li>
            </ul>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 border">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            What can you do?
          </h2>
          
          <div className="space-y-3 text-sm">
            <p className="text-gray-600">
              If you received this link from someone, please contact them for an updated link.
            </p>
            
            <p className="text-gray-600">
              If you're the project owner, check your project settings to ensure the feedback page is active.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            ← Go to Home
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Powered by <span className="font-semibold">FeedbackPulse</span>
          </p>
        </div>
      </div>
    </div>
  )
}