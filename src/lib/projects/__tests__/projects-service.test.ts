/**
 * Unit tests for projects service functions.
 * Tests CRUD operations, invite functionality, and error handling.
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  getUserProjects,
  createProject,
  updateProject,
  deleteProject,
  generateInviteLink,
  joinProjectByInvite,
  removeMember,
  updateMemberRole,
} from '../projects-service'

// Mock Supabase client
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: vi.fn(),
}))

// Mock crypto.randomUUID for invite generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
})

describe('Projects Service', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  const mockSelect = {
    select: vi.fn(),
    eq: vi.fn(),
    gt: vi.fn(),
    single: vi.fn(),
    order: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createClientComponentClient as Mock).mockReturnValue(mockSupabase)
    
    // Set up chainable mock methods
    mockSupabase.from.mockReturnValue(mockSelect)
    mockSelect.select.mockReturnValue(mockSelect)
    mockSelect.eq.mockReturnValue(mockSelect)
    mockSelect.gt.mockReturnValue(mockSelect)
    mockSelect.single.mockReturnValue(mockSelect)
    mockSelect.order.mockReturnValue(mockSelect)
    mockSelect.insert.mockReturnValue(mockSelect)
    mockSelect.update.mockReturnValue(mockSelect)
    mockSelect.delete.mockReturnValue(mockSelect)
  })

  describe('getUserProjects', () => {
    it('should fetch user projects successfully', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Test Project',
          description: 'Test Description',
          owner_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          project_members: [
            {
              id: 'member-1',
              project_id: 'project-1',
              user_id: 'user-1',
              role: 'admin',
              created_at: '2024-01-01T00:00:00Z',
              user_profiles: {
                id: 'user-1',
                email: 'test@example.com',
                display_name: 'Test User',
              },
            },
          ],
        },
      ]

      mockSelect.order.mockResolvedValue({
        data: mockProjects,
        error: null,
      })

      const result = await getUserProjects('user-1')

      expect(result).toEqual(mockProjects)
      expect(mockSupabase.from).toHaveBeenCalledWith('projects')
      expect(mockSelect.eq).toHaveBeenCalledWith('project_members.user_id', 'user-1')
    })

    it('should throw error on database failure', async () => {
      mockSelect.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(getUserProjects('user-1')).rejects.toThrow(
        'Failed to fetch user projects: Database error'
      )
    })
  })

  describe('createProject', () => {
    it('should create project and add admin member', async () => {
      const projectData = {
        name: 'New Project',
        description: 'New Description',
      }

      const mockProject = {
        id: 'project-1',
        name: 'New Project',
        description: 'New Description',
        owner_id: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const mockCompleteProject = {
        ...mockProject,
        project_members: [
          {
            id: 'member-1',
            project_id: 'project-1',
            user_id: 'user-1',
            role: 'admin',
            created_at: '2024-01-01T00:00:00Z',
            user_profiles: {
              id: 'user-1',
              email: 'test@example.com',
              display_name: 'Test User',
            },
          },
        ],
      }

      // Mock project creation
      mockSelect.single
        .mockResolvedValueOnce({
          data: mockProject,
          error: null,
        })
        // Mock member addition
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })
        // Mock complete project fetch
        .mockResolvedValueOnce({
          data: mockCompleteProject,
          error: null,
        })

      const result = await createProject(projectData, 'user-1')

      expect(result).toEqual(mockCompleteProject)
      expect(mockSelect.insert).toHaveBeenCalledWith({
        ...projectData,
        owner_id: 'user-1',
      })
    })

    it('should throw error if project creation fails', async () => {
      mockSelect.single.mockResolvedValue({
        data: null,
        error: { message: 'Creation failed' },
      })

      await expect(
        createProject({ name: 'Test', description: 'Test' }, 'user-1')
      ).rejects.toThrow('Failed to create project: Creation failed')
    })
  })

  describe('generateInviteLink', () => {
    it('should generate invite link for admin users', async () => {
      // Mock admin membership check
      mockSelect.single
        .mockResolvedValueOnce({
          data: { role: 'admin' },
          error: null,
        })
        // Mock invite creation
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })

      const result = await generateInviteLink('project-1', 'editor', 'user-1')

      expect(result).toEqual({
        token: 'test-uuid-123',
        expires_at: expect.any(String),
        role: 'editor',
      })

      expect(mockSelect.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: 'project-1',
          token: 'test-uuid-123',
          role: 'editor',
          invited_by: 'user-1',
        })
      )
    })

    it('should throw error for non-admin users', async () => {
      mockSelect.single.mockResolvedValue({
        data: { role: 'editor' },
        error: null,
      })

      await expect(
        generateInviteLink('project-1', 'viewer', 'user-1')
      ).rejects.toThrow('Only admins can generate invite links')
    })
  })

  describe('joinProjectByInvite', () => {
    it('should join project with valid token', async () => {
      const mockInvite = {
        project_id: 'project-1',
        role: 'editor',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        projects: {
          id: 'project-1',
          name: 'Test Project',
          description: 'Test Description',
          owner_id: 'owner-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      }

      // Mock invite validation
      mockSelect.single
        .mockResolvedValueOnce({
          data: mockInvite,
          error: null,
        })
        // Mock existing member check
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })
        // Mock member addition
        .mockResolvedValueOnce({
          data: null,
          error: null,
        })

      // Mock invite cleanup
      mockSelect.delete.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await joinProjectByInvite('valid-token', 'user-1')

      expect(result).toEqual(mockInvite.projects)
      expect(mockSelect.insert).toHaveBeenCalledWith({
        project_id: 'project-1',
        user_id: 'user-1',
        role: 'editor',
      })
    })

    it('should throw error for expired token', async () => {
      const expiredInvite = {
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      }

      mockSelect.single.mockResolvedValue({
        data: null,
        error: { message: 'No rows returned' },
      })

      await expect(joinProjectByInvite('expired-token', 'user-1')).rejects.toThrow(
        'Invalid or expired invite link'
      )
    })
  })

  describe('removeMember', () => {
    it('should remove member for admin users', async () => {
      // Mock admin check
      mockSelect.single
        .mockResolvedValueOnce({
          data: { role: 'admin' },
          error: null,
        })
        // Mock owner check
        .mockResolvedValueOnce({
          data: { owner_id: 'different-user' },
          error: null,
        })

      mockSelect.delete.mockResolvedValue({
        data: null,
        error: null,
      })

      await removeMember('project-1', 'member-1', 'admin-1')

      expect(mockSelect.delete).toHaveBeenCalled()
      expect(mockSelect.eq).toHaveBeenCalledWith('project_id', 'project-1')
      expect(mockSelect.eq).toHaveBeenCalledWith('user_id', 'member-1')
    })

    it('should throw error when trying to remove owner', async () => {
      // Mock admin check
      mockSelect.single
        .mockResolvedValueOnce({
          data: { role: 'admin' },
          error: null,
        })
        // Mock owner check - member is owner
        .mockResolvedValueOnce({
          data: { owner_id: 'member-1' },
          error: null,
        })

      await expect(removeMember('project-1', 'member-1', 'admin-1')).rejects.toThrow(
        'Cannot remove project owner'
      )
    })
  })

  describe('updateMemberRole', () => {
    it('should update member role for admin users', async () => {
      // Mock admin check
      mockSelect.single
        .mockResolvedValueOnce({
          data: { role: 'admin' },
          error: null,
        })
        // Mock owner check
        .mockResolvedValueOnce({
          data: { owner_id: 'different-user' },
          error: null,
        })

      mockSelect.update.mockResolvedValue({
        data: null,
        error: null,
      })

      await updateMemberRole('project-1', 'member-1', 'editor', 'admin-1')

      expect(mockSelect.update).toHaveBeenCalledWith({ role: 'editor' })
      expect(mockSelect.eq).toHaveBeenCalledWith('project_id', 'project-1')
      expect(mockSelect.eq).toHaveBeenCalledWith('user_id', 'member-1')
    })

    it('should throw error for non-admin users', async () => {
      mockSelect.single.mockResolvedValue({
        data: { role: 'editor' },
        error: null,
      })

      await expect(
        updateMemberRole('project-1', 'member-1', 'admin', 'user-1')
      ).rejects.toThrow('Only admins can update member roles')
    })
  })
})