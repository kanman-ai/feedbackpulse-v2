/**
 * Project card component for displaying project information in the dashboard.
 * Shows project details, team members, and provides quick action buttons
 * for team management and project navigation.
 * 
 * Features:
 * - Project metadata display
 * - Team member avatars and count
 * - Role-based action buttons
 * - Responsive layout
 * - Navigation to project details
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MoreVertical, Users, Share2, Settings, Trash2, Crown, Eye, Edit } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteProject } from '@/lib/projects/use-projects'
import type { ProjectWithMembers } from '@/lib/projects/projects-service'

/**
 * Props for the ProjectCard component.
 */
interface ProjectCardProps {
  /** Project data with member information */
  project: ProjectWithMembers
  /** Current authenticated user ID for permission checks */
  currentUserId?: string
  /** Callback when invite button is clicked */
  onInviteClick: () => void
}

/**
 * Individual project card component.
 * Displays project information and provides quick access to common actions.
 */
export function ProjectCard({ project, currentUserId, onInviteClick }: ProjectCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const deleteProject = useDeleteProject()

  // Get current user's role in this project
  const currentUserMember = project.project_members.find(
    member => member.user_id === currentUserId
  )
  const userRole = currentUserMember?.role
  const isOwner = project.owner_id === currentUserId
  const canManage = isOwner || userRole === 'admin'
  const canEdit = canManage || userRole === 'editor'

  /**
   * Handles project deletion with confirmation.
   * Only project owners can delete projects.
   */
  const handleDelete = async () => {
    if (!isOwner) return
    
    try {
      await deleteProject.mutateAsync(project.id)
    } finally {
      setShowDeleteDialog(false)
    }
  }

  /**
   * Generates initials for user avatar fallback.
   * Uses display name or email as source.
   */
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  /**
   * Gets the appropriate role icon for display.
   */
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3" />
      case 'editor':
        return <Edit className="h-3 w-3" />
      case 'viewer':
        return <Eye className="h-3 w-3" />
      default:
        return null
    }
  }

  /**
   * Gets role badge variant for styling.
   */
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default'
      case 'editor':
        return 'secondary'
      case 'viewer':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <Link href={`/projects/${project.id}`}>
                <CardTitle className="text-lg hover:text-blue-600 transition-colors truncate">
                  {project.name}
                </CardTitle>
              </Link>
              {project.description && (
                <CardDescription className="line-clamp-2 mt-1">
                  {project.description}
                </CardDescription>
              )}
            </div>

            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/projects/${project.id}/settings`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onInviteClick}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Invite Members
                  </DropdownMenuItem>
                  {isOwner && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Current user's role badge */}
          {userRole && (
            <div className="mb-3">
              <Badge variant={getRoleBadgeVariant(userRole)} className="text-xs">
                {getRoleIcon(userRole)}
                <span className="ml-1 capitalize">{userRole}</span>
              </Badge>
            </div>
          )}

          {/* Team members section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{project.project_members.length} member{project.project_members.length !== 1 ? 's' : ''}</span>
              </div>
              
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onInviteClick}
                  className="text-xs"
                >
                  <Share2 className="h-3 w-3 mr-1" />
                  Invite
                </Button>
              )}
            </div>

            {/* Member avatars */}
            <div className="flex -space-x-2">
              {project.project_members.slice(0, 5).map((member) => (
                <Avatar
                  key={member.user_id}
                  className="h-8 w-8 border-2 border-background ring-1 ring-gray-200"
                >
                  <AvatarImage 
                    src={`https://avatar.vercel.sh/${member.user_id}`} 
                    alt={member.user_profiles?.display_name || member.user_profiles?.email}
                  />
                  <AvatarFallback className="text-xs">
                    {getInitials(
                      member.user_profiles?.display_name || null,
                      member.user_profiles?.email || ''
                    )}
                  </AvatarFallback>
                </Avatar>
              ))}
              
              {project.project_members.length > 5 && (
                <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-background ring-1 ring-gray-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    +{project.project_members.length - 5}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Project metadata */}
          <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
            Updated {formatDistanceToNow(new Date(project.updated_at))} ago
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{project.name}&quot;? This action cannot be undone.
              All project data, feedback, and team memberships will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteProject.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteProject.isPending ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}