/**
 * Test suite for the public feedback page.
 * Validates page rendering, project data fetching, and error handling.
 */

import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { notFound } from 'next/navigation'
import FeedbackPage, { generateMetadata } from '../page'
import { createServerClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('next/navigation', () => ({
  notFound: vi.fn()
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn()
}))

vi.mock('@/components/PublicFeedbackForm', () => ({
  default: vi.fn(({ projectId, projectSlug }) => (
    <div data-testid="feedback-form">Feedback Form for {projectSlug} ({projectId})</div>
  ))
}))

const mockCreateServerClient = createServerClient as vi.MockedFunction<typeof createServerClient>
const mockNotFound = notFound as vi.MockedFunction<typeof notFound>

describe('Feedback Page', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateServerClient.mockReturnValue(mockSupabase as any)
  })

  describe('Successful Project Loading', () => {
    const mockProject = {
      id: 'project-123',
      name: 'Test Project',
      slug: 'test-project',
      description: 'A test project for feedback',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    it('should render feedback page with project information', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockProject, error: null })
      
      const params = { projectSlug: 'test-project' }
      const page = await FeedbackPage({ params })
      
      render(page)
      
      // Check page title and project name
      expect(screen.getByText('Share Your Feedback')).toBeInTheDocument()
      expect(screen.getByText('Test Project')).toBeInTheDocument()
      
      // Check project description
      expect(screen.getByText('A test project for feedback')).toBeInTheDocument()
      
      // Check that feedback form is rendered
      expect(screen.getByTestId('feedback-form')).toBeInTheDocument()
      expect(screen.getByText('Feedback Form for test-project (project-123)')).toBeInTheDocument()
      
      // Check branding
      expect(screen.getByText('Powered by')).toBeInTheDocument()
      expect(screen.getByText('FeedbackPulse')).toBeInTheDocument()
    })

    it('should render page without description when project has no description', async () => {
      const projectWithoutDescription = { ...mockProject, description: null }
      mockSupabase.single.mockResolvedValue({ data: projectWithoutDescription, error: null })
      
      const params = { projectSlug: 'test-project' }
      const page = await FeedbackPage({ params })
      
      render(page)
      
      // Should still render project name but not description
      expect(screen.getByText('Test Project')).toBeInTheDocument()
      expect(screen.queryByText('A test project for feedback')).not.toBeInTheDocument()
    })

    it('should query database with correct parameters', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockProject, error: null })
      
      const params = { projectSlug: 'test-project' }
      await FeedbackPage({ params })
      
      // Verify database query
      expect(mockSupabase.from).toHaveBeenCalledWith('projects')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('slug', 'test-project')
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true)
    })
  })

  describe('Error Handling', () => {
    it('should call notFound when project does not exist', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })
      
      const params = { projectSlug: 'non-existent' }
      await FeedbackPage({ params })
      
      expect(mockNotFound).toHaveBeenCalled()
    })

    it('should call notFound when project is inactive', async () => {
      const inactiveProject = {
        id: 'project-123',
        name: 'Inactive Project',
        slug: 'inactive-project',
        description: 'An inactive project',
        is_active: false
      }
      
      // Since we query with is_active: true, this shouldn't return data
      mockSupabase.single.mockResolvedValue({ data: null, error: null })
      
      const params = { projectSlug: 'inactive-project' }
      await FeedbackPage({ params })
      
      expect(mockNotFound).toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database connection failed' } 
      })
      
      const params = { projectSlug: 'test-project' }
      await FeedbackPage({ params })
      
      expect(mockNotFound).toHaveBeenCalled()
    })

    it('should handle unexpected errors during project fetch', async () => {
      mockSupabase.single.mockRejectedValue(new Error('Unexpected error'))
      
      const params = { projectSlug: 'test-project' }
      await FeedbackPage({ params })
      
      expect(mockNotFound).toHaveBeenCalled()
    })
  })

  describe('Metadata Generation', () => {
    const mockProject = {
      id: 'project-123',
      name: 'Test Project',
      slug: 'test-project',
      description: 'A test project for feedback',
      is_active: true
    }

    it('should generate correct metadata for existing project', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockProject, error: null })
      
      const params = { projectSlug: 'test-project' }
      const metadata = await generateMetadata({ params })
      
      expect(metadata.title).toBe('Feedback for Test Project - FeedbackPulse')
      expect(metadata.description).toBe('Submit feedback for Test Project. Your input helps improve this project.')
      expect(metadata.robots).toBe('noindex, nofollow')
    })

    it('should generate not found metadata for non-existent project', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })
      
      const params = { projectSlug: 'non-existent' }
      const metadata = await generateMetadata({ params })
      
      expect(metadata.title).toBe('Feedback - Not Found')
      expect(metadata.description).toBe('The requested project was not found.')
    })

    it('should handle metadata generation errors', async () => {
      mockSupabase.single.mockRejectedValue(new Error('Database error'))
      
      const params = { projectSlug: 'error-project' }
      const metadata = await generateMetadata({ params })
      
      expect(metadata.title).toBe('Feedback - Not Found')
      expect(metadata.description).toBe('The requested project was not found.')
    })
  })

  describe('Page Styling and Layout', () => {
    const mockProject = {
      id: 'project-123',
      name: 'Test Project',
      slug: 'test-project',
      description: 'A test project',
      is_active: true
    }

    it('should apply correct CSS classes for responsive layout', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockProject, error: null })
      
      const params = { projectSlug: 'test-project' }
      const page = await FeedbackPage({ params })
      
      render(page)
      
      // Check for responsive container classes
      const container = screen.getByText('Share Your Feedback').closest('div')
      expect(container?.parentElement?.parentElement).toHaveClass('min-h-screen', 'bg-gray-50')
    })

    it('should structure content in proper hierarchy', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockProject, error: null })
      
      const params = { projectSlug: 'test-project' }
      const page = await FeedbackPage({ params })
      
      render(page)
      
      // Check heading hierarchy
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toHaveTextContent('Share Your Feedback')
    })
  })
})