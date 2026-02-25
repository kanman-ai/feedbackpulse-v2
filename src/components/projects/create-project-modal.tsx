/**
 * Modal component for creating new projects in FeedbackPulse v2.
 * Provides a form interface for entering project details with validation
 * and handles project creation with optimistic updates.
 * 
 * Features:
 * - Form validation with error handling
 * - Real-time character counting
 * - Automatic modal closure on success
 * - Loading states during creation
 * - Keyboard navigation support
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useCreateProject } from '@/lib/projects/use-projects'

/**
 * Validation schema for project creation form.
 * Ensures required fields and reasonable length limits.
 */
const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be 100 characters or less')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .trim()
    .optional(),
})

type CreateProjectFormData = z.infer<typeof createProjectSchema>

/**
 * Props for the CreateProjectModal component.
 */
interface CreateProjectModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal should be closed */
  onClose: () => void
}

/**
 * Modal component for creating new projects.
 * Handles form state, validation, and project creation workflow.
 */
export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const createProject = useCreateProject()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  // Watch form values for character counting
  const watchedName = watch('name')
  const watchedDescription = watch('description')

  /**
   * Handles form submission.
   * Creates the project and closes modal on success.
   */
  const onSubmit = async (data: CreateProjectFormData) => {
    try {
      await createProject.mutateAsync({
        name: data.name,
        description: data.description || undefined,
      })
      
      // Reset form and close modal on success
      reset()
      onClose()
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Project creation failed:', error)
    }
  }

  /**
   * Handles modal close.
   * Resets form state when closing.
   */
  const handleClose = () => {
    if (!createProject.isPending) {
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new feedback project to start collaborating with your team.
            You&apos;ll be added as the project admin automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project-name">
              Project Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="project-name"
              placeholder="Enter project name..."
              {...register('name')}
              disabled={createProject.isPending}
              className={errors.name ? 'border-red-500' : ''}
            />
            <div className="flex justify-between items-center">
              {errors.name ? (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              ) : (
                <div />
              )}
              <p className="text-xs text-gray-500">
                {watchedName?.length || 0}/100
              </p>
            </div>
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <Label htmlFor="project-description">
              Description <span className="text-gray-400">(Optional)</span>
            </Label>
            <Textarea
              id="project-description"
              placeholder="Describe your project's purpose and goals..."
              rows={3}
              {...register('description')}
              disabled={createProject.isPending}
              className={errors.description ? 'border-red-500' : ''}
            />
            <div className="flex justify-between items-center">
              {errors.description ? (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              ) : (
                <p className="text-sm text-gray-600">
                  Help your team understand what this project is about
                </p>
              )}
              <p className="text-xs text-gray-500">
                {watchedDescription?.length || 0}/500
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createProject.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProject.isPending}
              className="min-w-[100px]"
            >
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}