/**
 * Projects dashboard page for FeedbackPulse v2.
 * Displays all projects the user owns or is invited to, with CRUD operations
 * and team management functionality including invite flows.
 * 
 * Features:
 * - Project listing with search and filtering
 * - Create new project modal
 * - Team member management
 * - Role-based invite system
 * - Responsive grid layout
 */

'use client'

import { useState } from 'react'
import { Plus, Search, Users, Settings, Trash2, Share2 } from 'lucide-react'
import { useProjects, useCreateProject, useDeleteProject } from '@/lib/projects/use-projects'
import { ProjectCard } from '@/components/projects/project-card'
import { CreateProjectModal } from '@/components/projects/create-project-modal'
import { InviteModal } from '@/components/projects/invite-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth/auth-context'
import { formatDistanceToNow } from 'date-fns'
import type { ProjectWithMembers } from '@/lib/projects/projects-service'

/**
 * Main projects dashboard component.
 * Handles project listing, creation, and team management workflows.
 */
export default function ProjectsPage() {
  const { user } = useAuth()
  const { data: projects, isLoading, error } = useProjects()
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectWithMembers | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)

  // Filter projects based on search term
  const filteredProjects = projects?.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Failed to load projects</h1>
          <p className="text-gray-600">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage your feedback projects and team collaboration
          </p>
        </div>
        
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Project
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState 
          hasProjects={!!projects?.length}
          searchTerm={searchTerm}
          onCreateProject={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              currentUserId={user?.id}
              onInviteClick={() => {
                setSelectedProject(project)
                setShowInviteModal(true)
              }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <InviteModal
        open={showInviteModal}
        onClose={() => {
          setShowInviteModal(false)
          setSelectedProject(null)
        }}
        project={selectedProject}
      />
    </div>
  )
}

/**
 * Empty state component for when no projects exist or match search.
 * Provides appropriate messaging and call-to-action based on context.
 * 
 * @param hasProjects - Whether user has any projects at all
 * @param searchTerm - Current search filter
 * @param onCreateProject - Callback to open create project modal
 */
interface EmptyStateProps {
  hasProjects: boolean
  searchTerm: string
  onCreateProject: () => void
}

function EmptyState({ hasProjects, searchTerm, onCreateProject }: EmptyStateProps) {
  if (!hasProjects) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Users className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Get started by creating your first project. Invite your team and start collecting feedback together.
        </p>
        <Button onClick={onCreateProject} className="flex items-center gap-2 mx-auto">
          <Plus className="h-4 w-4" />
          Create Your First Project
        </Button>
      </div>
    )
  }

  return (
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Search className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
      <p className="text-gray-600 mb-6">
        No projects match &quot;{searchTerm}&quot;. Try adjusting your search or create a new project.
      </p>
      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={() => setSearchTerm('')}>
          Clear Search
        </Button>
        <Button onClick={onCreateProject} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Project
        </Button>
      </div>
    </div>
  )
}