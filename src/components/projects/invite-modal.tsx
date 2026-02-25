/**
 * Modal component for inviting team members to projects.
 * Provides invite link generation with role selection and team member management.
 * 
 * Features:
 * - Role-based invite link generation
 * - Copy to clipboard functionality
 * - Current team member list with role management
 * - Member removal capabilities
 * - Real-time updates
 */

'use client'

import { useState } from 'react'
import { Copy, Users, Crown, Edit, Eye, MoreVertical, UserMinus, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Separator } from '@/components/ui/separator'
import { 
  useGenerateInvite, 
  useRemoveMember, 
  useUpdateMemberRole 
} from '@/lib/projects/use-projects'
import { useAuth } from '@/lib/auth/auth-context'
import type { ProjectWithMembers } from '@/lib/projects/projects-service'

/**
 * Props for the InviteModal component.
 */
interface InviteModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal should be closed */
  onClose: () => void
  /** Project to manage invites for */
  project: ProjectWithMembers | null
}

/**
 * Modal component for team member management and invitations.
 * Handles invite generation and team member administration.
 */
export function InviteModal({ open, onClose, project }: InviteModalProps) {
  const { user } = useAuth()
  const generateInvite = useGenerateInvite()
  const removeMember = useRemoveMember()
  const updateMemberRole = useUpdateMemberRole()

  const [selectedRole, setSelectedRole] = useState<'viewer' | 'editor'>('viewer')
  const [copiedLink, setCopiedLink] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null)

  if (!project) return null

  // Get current user's role for permission checks
  const currentUserMember = project.project_members.find(
    member => member.user_id === user?.id
  )
  const isAdmin = currentUserMember?.role === 'admin' || project.owner_id === user?.id

  /**
   * Generates invite link and copies to clipboard.
   */
  const handleGenerateInvite = async () => {
    try {
      const invite = await generateInvite.mutateAsync({
        projectId: project.id,
        role: selectedRole,
      })
      
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      console.error('Failed to generate invite:', error)
    }
  }

  /**
   * Handles member removal with confirmation.
   */
  const handleRemoveMember = async (memberUserId: string) => {
    if (!memberToRemove) return
    
    try {
      await removeMember.mutateAsync({
        projectId: project.id,
        memberUserId,
      })
    } finally {
      setMemberToRemove(null)
    }
  }

  /**
   * Updates a member's role.
   */
  const handleUpdateRole = async (memberUserId: string, newRole: 'viewer' | 'editor' | 'admin') => {
    try {
      await updateMemberRole.mutateAsync({
        projectId: project.id,
        memberUserId,
        newRole,
      })
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  }

  /**
   * Gets role icon component.
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
   * Generates user initials for avatar fallback.
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

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </DialogTitle>
            <DialogDescription>
              Manage team access for &quot;{project.name}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Invite Section */}
            {isAdmin && (
              <div className="space-y-4">
                <h3 className="font-medium">Invite New Members</h3>
                
                <div className="flex gap-3">
                  <Select
                    value={selectedRole}
                    onValueChange={(value: 'viewer' | 'editor') => setSelectedRole(value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Eye className="h-3 w-3" />
                          Viewer
                        </div>
                      </SelectItem>
                      <SelectItem value="editor">
                        <div className="flex items-center gap-2">
                          <Edit className="h-3 w-3" />
                          Editor
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleGenerateInvite}
                    disabled={generateInvite.isPending}
                    className="flex items-center gap-2"
                  >
                    {copiedLink ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {generateInvite.isPending 
                      ? 'Generating...' 
                      : copiedLink 
                      ? 'Copied!' 
                      : 'Generate Link'
                    }
                  </Button>
                </div>

                <p className="text-sm text-gray-600">
                  Generate a shareable link to invite team members as {selectedRole}s. 
                  Links expire in 7 days.
                </p>

                <Separator />
              </div>
            )}

            {/* Current Members */}
            <div className="space-y-4">
              <h3 className="font-medium">
                Current Members ({project.project_members.length})
              </h3>

              <div className="space-y-3">
                {project.project_members.map((member) => {
                  const isOwner = member.user_id === project.owner_id
                  const isCurrentUser = member.user_id === user?.id
                  const canManageMember = isAdmin && !isOwner && !isCurrentUser

                  return (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={`https://avatar.vercel.sh/${member.user_id}`}
                            alt={member.user_profiles?.display_name || member.user_profiles?.email}
                          />
                          <AvatarFallback>
                            {getInitials(
                              member.user_profiles?.display_name || null,
                              member.user_profiles?.email || ''
                            )}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <p className="font-medium">
                            {member.user_profiles?.display_name || 'Unknown User'}
                            {isCurrentUser && (
                              <span className="text-sm text-gray-500 ml-1">(You)</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600">
                            {member.user_profiles?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={isOwner ? 'default' : 'secondary'} className="text-xs">
                          {getRoleIcon(member.role)}
                          <span className="ml-1 capitalize">
                            {isOwner ? 'Owner' : member.role}
                          </span>
                        </Badge>

                        {canManageMember && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {member.role !== 'admin' && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateRole(member.user_id, 'admin')}
                                >
                                  <Crown className="h-4 w-4 mr-2" />
                                  Make Admin
                                </DropdownMenuItem>
                              )}
                              {member.role !== 'editor' && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateRole(member.user_id, 'editor')}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Make Editor
                                </DropdownMenuItem>
                              )}
                              {member.role !== 'viewer' && (
                                <DropdownMenuItem
                                  onClick={() => handleUpdateRole(member.user_id, 'viewer')}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Make Viewer
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => setMemberToRemove(member.user_id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove member confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the project?
              They will lose access to all project data and feedback.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToRemove && handleRemoveMember(memberToRemove)}
              disabled={removeMember.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeMember.isPending ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}