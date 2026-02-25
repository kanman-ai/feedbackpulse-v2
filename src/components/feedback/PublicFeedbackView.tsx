/**
 * Public feedback view component for displaying project feedback without authentication.
 * Fetches and renders project feedback data using the public token.
 */

'use client'

import { useState, useEffect } from 'react'
import { Star, MessageCircle, TrendingUp, Clock } from 'lucide-react'

/**
 * Structure of feedback data returned by the API
 */
interface PublicFeedbackData {
  project_name: string
  total_responses: number
  average_rating: number
  recent_feedback: Array<{
    id: string
    rating: number
    feedback_text: string | null
    helpful_votes: number
    created_at: string
  }>
}

/**
 * Props for the PublicFeedbackView component
 */
interface PublicFeedbackViewProps {
  /** Public token for accessing the feedback data */
  publicToken: string
}

/**
 * Component for displaying star ratings with visual representation
 */
interface StarRatingProps {
  rating: number
  className?: string
}

function StarRating({ rating, className = '' }: StarRatingProps) {
  return (
    <div className={`flex items-center ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'text-yellow-400 fill-current'
              : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-600">({rating})</span>
    </div>
  )
}

/**
 * Individual feedback item component
 */
interface FeedbackItemProps {
  feedback: PublicFeedbackData['recent_feedback'][0]
}

function FeedbackItem({ feedback }: FeedbackItemProps) {
  const createdDate = new Date(feedback.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <StarRating rating={feedback.rating} />
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          {createdDate}
        </div>
      </div>
      
      {feedback.feedback_text && (
        <p className="text-gray-700 mb-3 leading-relaxed">
          {feedback.feedback_text}
        </p>
      )}
      
      {feedback.helpful_votes > 0 && (
        <div className="flex items-center text-sm text-green-600">
          <TrendingUp className="w-3 h-3 mr-1" />
          {feedback.helpful_votes} people found this helpful
        </div>
      )}
    </div>
  )
}

/**
 * Main public feedback view component.
 * Handles data fetching, loading states, and error handling for public feedback display.
 */
export function PublicFeedbackView({ publicToken }: PublicFeedbackViewProps) {
  const [feedbackData, setFeedbackData] = useState<PublicFeedbackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    /**
     * Fetches feedback data from the API using the public token.
     * Handles rate limiting and error responses appropriately.
     */
    async function fetchFeedbackData() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/feedback/${publicToken}`)
        
        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Too many requests. Please try again in a few minutes.')
          } else if (response.status === 404) {
            throw new Error('Project not found or public sharing is not enabled.')
          } else {
            throw new Error('Failed to load feedback data.')
          }
        }
        
        const data: PublicFeedbackData = await response.json()
        setFeedbackData(data)
        
      } catch (err) {
        console.error('Error fetching feedback data:', err)
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }
    
    fetchFeedbackData()
  }, [publicToken])
  
  // Loading state
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading feedback data...</p>
      </div>
    )
  }
  
  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Unable to Load Feedback</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }
  
  // No data state (shouldn't happen if API is working correctly)
  if (!feedbackData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No feedback data available.</p>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Feedback for {feedbackData.project_name}
        </h1>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <MessageCircle className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Total Responses</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              {feedbackData.total_responses}
            </p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Star className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-sm font-medium text-yellow-800">Average Rating</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900 mt-1">
              {feedbackData.average_rating.toFixed(1)}/5
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">Recent Activity</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {feedbackData.recent_feedback.length} shown
            </p>
          </div>
        </div>
      </div>
      
      {/* Recent Feedback Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Feedback
          <span className="text-sm font-normal text-gray-600 ml-2">
            (Top 20 most helpful and recent)
          </span>
        </h2>
        
        {feedbackData.recent_feedback.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No feedback available yet.</p>
            <p className="text-sm text-gray-500 mt-1">
              Be the first to share your experience!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbackData.recent_feedback.map((feedback) => (
              <FeedbackItem key={feedback.id} feedback={feedback} />
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>Powered by FeedbackPulse</p>
      </div>
    </div>
  )
}