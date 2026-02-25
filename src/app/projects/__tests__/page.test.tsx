/**
 * Integration tests for the projects page component.
 * Tests rendering, user interactions, and project management flows.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProjectsPage from '../page'
import { useAuth } from '@/lib/auth/auth-context'
import { useProjects } from '@/lib/projects/use-projects'

// Mock the auth context
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: vi.fn(),
}))

// Mock the projects hooks
vi.mock('@/lib/projects/use-projects', () => ({
  useProjects: vi.fn(),
  useCreateProject: vi.fn(),
  useDeleteProject: vi.fn(),
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  MoreVertical: () => <div data-testid="more-icon">More</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Share2: () => <div data-testid="share-icon">Share</div>,
  Trash2: () => <div data-testid="trash-icon">Trash</div>,
  Crown: () => <div data-testid="crown-icon">Crown</div>,
  Edit: () => <div data-testid="edit-icon">Edit</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 days'),
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('Projects Page', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    user_metadata: { display_name: 'Test User' },
  }

  const mockProjects = [
    {
      id: 'project-1',
      name: 'Test Project 1',
      description: 'First test project',
      owner_id: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      project_members: [
        {
          id: 'member-1',
          project_id: 'project-1',
          user_id: 'user-1',
          role: 'admin' as const,
          created_at: '2024-01-01T00:00:00Z',
          user_profiles: {
            id: 'user-1',
            email: 'test@example.com',
            display_name: 'Test User',
          },
        },
      ],
    },
    {
      id: 'project-2',
      name: 'Test Project 2',
      description: 'Second test project',
      owner_id: 'user-2',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      project_members: [
        {
          id: 'member-2',
          project_id: 'project-2',
          user_id: 'user-1',
          role: 'editor' as const,
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

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as any).mockReturnValue({
      user: mockUser,
      loading: false,
    })
  })

  it('renders projects page with header and create button', () => {
    ;(useProjects as any).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
    })

    renderWithProviders(<ProjectsPage />)

    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Manage your feedback projects and team collaboration')).toBeInTheDocument()
    expect(screen.getByText('Create Project')).toBeInTheDocument()
  })

  it('displays loading skeletons when data is loading', () => {
    ;(useProjects as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    renderWithProviders(<ProjectsPage />)

    // Should show skeleton loading cards
    const skeletons = screen.getAllByTestId(/skeleton/i)
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('displays error message when projects fail to load', () => {
    const error = new Error('Failed to fetch projects')
    ;(useProjects as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
    })

    renderWithProviders(<ProjectsPage />)

    expect(screen.getByText('Failed to load projects')).toBeInTheDocument()
    expect(screen.getByText('Failed to fetch projects')).toBeInTheDocument()
  })

  it('displays empty state when user has no projects', () => {
    ;(useProjects as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })

    renderWithProviders(<ProjectsPage />)

    expect(screen.getByText('No projects yet')).toBeInTheDocument()
    expect(screen.getByText('Create Your First Project')).toBeInTheDocument()
  })

  it('displays project cards when projects are loaded', () => {
    ;(useProjects as any).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
    })

    renderWithProviders(<ProjectsPage />)

    expect(screen.getByText('Test Project 1')).toBeInTheDocument()
    expect(screen.getByText('Test Project 2')).toBeInTheDocument()
    expect(screen.getByText('First test project')).toBeInTheDocument()
    expect(screen.getByText('Second test project')).toBeInTheDocument()
  })

  it('filters projects based on search input', async () => {
    ;(useProjects as any).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
    })

    const user = userEvent.setup()
    renderWithProviders(<ProjectsPage />)

    const searchInput = screen.getByPlaceholderText('Search projects...')
    
    // Initially both projects should be visible
    expect(screen.getByText('Test Project 1')).toBeInTheDocument()
    expect(screen.getByText('Test Project 2')).toBeInTheDocument()

    // Search for "First"
    await user.type(searchInput, 'First')

    // Should show only first project
    expect(screen.getByText('Test Project 1')).toBeInTheDocument()
    expect(screen.queryByText('Test Project 2')).not.toBeInTheDocument()
  })

  it('shows appropriate role badges for user permissions', () => {
    ;(useProjects as any).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
    })

    renderWithProviders(<ProjectsPage />)

    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Editor')).toBeInTheDocument()
  })

  it('displays team member count for each project', () => {
    ;(useProjects as any).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
    })

    renderWithProviders(<ProjectsPage />)

    const memberCounts = screen.getAllByText('1 member')
    expect(memberCounts).toHaveLength(2)
  })

  it('opens create project modal when create button is clicked', async () => {
    ;(useProjects as any).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
    })

    const user = userEvent.setup()
    renderWithProviders(<ProjectsPage />)

    const createButton = screen.getByText('Create Project')
    await user.click(createButton)

    // Modal should open - this would need more specific modal testing
    // depending on the modal implementation
  })

  it('shows filtered empty state when search has no results', async () => {
    ;(useProjects as any).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
    })

    const user = userEvent.setup()
    renderWithProviders(<ProjectsPage />)

    const searchInput = screen.getByPlaceholderText('Search projects...')
    await user.type(searchInput, 'Nonexistent Project')

    expect(screen.getByText('No projects found')).toBeInTheDocument()
    expect(screen.getByText('Clear Search')).toBeInTheDocument()
  })

  it('displays last updated information for projects', () => {
    ;(useProjects as any).mockReturnValue({
      data: mockProjects,
      isLoading: false,
      error: null,
    })

    renderWithProviders(<ProjectsPage />)

    const updatedTexts = screen.getAllByText(/Updated .* ago/)
    expect(updatedTexts).toHaveLength(2)
  })
})