# Component Architecture - FeedbackPulse v2

## Overview

This document defines the complete component architecture for FeedbackPulse v2, including both the dashboard application and the embeddable widget. The architecture follows a modular, reusable design pattern with clear separation of concerns.

## Tech Stack Integration

- **Next.js 14** with App Router and TypeScript
- **Supabase** for authentication and database
- **Tailwind CSS** for styling
- **Zustand** for client-side state management
- **Recharts** for data visualization
- **React Hook Form** for form handling

## Component Tree Structure

### Dashboard Application (`/src/app/`)

```
app/
├── layout.tsx                    # Root layout with auth provider
├── page.tsx                      # Landing/marketing page
├── (auth)/                       # Auth route group
│   ├── login/page.tsx           # Login page
│   ├── signup/page.tsx          # Signup page
│   └── layout.tsx               # Auth layout
├── dashboard/                    # Protected dashboard routes
│   ├── layout.tsx               # Dashboard layout with nav
│   ├── page.tsx                 # Dashboard home/overview
│   ├── projects/
│   │   ├── page.tsx             # Projects list
│   │   ├── [id]/
│   │   │   ├── page.tsx         # Project detail view
│   │   │   ├── feedback/page.tsx # Feedback list for project
│   │   │   ├── analytics/page.tsx # Analytics for project
│   │   │   └── settings/page.tsx # Project settings
│   │   └── new/page.tsx         # Create new project
│   ├── account/
│   │   ├── page.tsx             # Account settings
│   │   └── billing/page.tsx     # Billing management
│   └── widget/
│       └── preview/page.tsx     # Widget preview/testing
└── api/                         # API routes
    ├── feedback/route.ts        # POST /api/feedback
    ├── projects/
    │   ├── route.ts            # GET/POST /api/projects
    │   └── [id]/
    │       ├── route.ts        # GET/PUT/DELETE /api/projects/[id]
    │       ├── feedback/route.ts # GET /api/projects/[id]/feedback
    │       └── analytics/route.ts # GET /api/projects/[id]/analytics
    └── auth/
        └── callback/route.ts    # Supabase auth callback
```

### Component Library (`/src/components/`)

#### Core UI Components (`/src/components/ui/`)
```
ui/
├── Button.tsx                   # Reusable button component
├── Input.tsx                    # Form input component
├── Card.tsx                     # Card container component
├── Modal.tsx                    # Modal/dialog component
├── Toast.tsx                    # Notification component
├── Badge.tsx                    # Status badge component
├── Avatar.tsx                   # User avatar component
├── Spinner.tsx                  # Loading spinner
├── Tabs.tsx                     # Tab navigation
└── DataTable.tsx               # Sortable data table
```

#### Layout Components (`/src/components/layout/`)
```
layout/
├── Header.tsx                   # Dashboard header with nav
├── Sidebar.tsx                  # Dashboard sidebar navigation
├── Footer.tsx                   # Application footer
├── DashboardLayout.tsx          # Dashboard wrapper layout
└── AuthLayout.tsx              # Authentication page layout
```

#### Feature Components (`/src/components/features/`)
```
features/
├── auth/
│   ├── LoginForm.tsx           # Login form with validation
│   ├── SignupForm.tsx          # Registration form
│   ├── AuthProvider.tsx        # Supabase auth context
│   └── ProtectedRoute.tsx      # Route protection wrapper
├── projects/
│   ├── ProjectCard.tsx         # Project summary card
│   ├── ProjectList.tsx         # Grid of project cards
│   ├── CreateProjectForm.tsx   # New project form
│   ├── ProjectSettings.tsx     # Project configuration
│   └── WidgetCodeGenerator.tsx # Embed code generator
├── feedback/
│   ├── FeedbackTable.tsx       # Paginated feedback list
│   ├── FeedbackCard.tsx        # Individual feedback item
│   ├── FeedbackFilters.tsx     # Date/rating/source filters
│   └── FeedbackStats.tsx       # Quick stats summary
└── analytics/
    ├── RatingChart.tsx         # Rating distribution chart
    ├── TimelineChart.tsx       # Feedback over time
    ├── SentimentChart.tsx      # Sentiment breakdown
    ├── SourcesTable.tsx        # Traffic sources table
    └── AnalyticsDashboard.tsx   # Analytics overview
```

### Embeddable Widget (`/src/widget/`)
```
widget/
├── index.ts                     # Widget entry point and API
├── components/
│   ├── FloatingButton.tsx       # Main feedback button
│   ├── FeedbackForm.tsx         # Feedback submission form
│   ├── ThankYou.tsx            # Post-submission message
│   └── WidgetContainer.tsx      # Root widget container
├── hooks/
│   ├── useWidget.ts            # Widget state management
│   └── useSubmitFeedback.ts    # Form submission logic
├── styles/
│   └── widget.css              # Isolated widget styles
└── types/
    └── widget.ts               # Widget-specific types
```

## Component Specifications

### Core Component Props & State

#### `FloatingButton.tsx` (Widget)
```typescript
interface FloatingButtonProps {
  label?: string                 // Custom button text
  color?: string                // Button background color
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  onClick: () => void           // Open form handler
  isOpen: boolean               // Form visibility state
}

interface FloatingButtonState {
  isHovered: boolean            // Hover animation state
  isVisible: boolean            // Button visibility (can be hidden)
}
```

#### `FeedbackForm.tsx` (Widget)
```typescript
interface FeedbackFormProps {
  projectId: string             // Target project ID
  isOpen: boolean               // Form visibility
  onClose: () => void           // Close form handler
  onSubmit: (data: FeedbackData) => Promise<void>
  customization: WidgetCustomization
}

interface FeedbackFormState {
  rating: number                // 1-5 star rating
  comment: string               // Free text feedback
  email?: string                // Optional contact email
  isSubmitting: boolean         // Submission loading state
  errors: FormErrors           // Field validation errors
}
```

#### `ProjectList.tsx` (Dashboard)
```typescript
interface ProjectListProps {
  projects: Project[]           // Array of user projects
  onCreateProject: () => void   // Navigate to create form
  onSelectProject: (id: string) => void
}

interface ProjectListState {
  searchQuery: string           // Project search filter
  sortBy: 'name' | 'created' | 'feedbackCount'
  isLoading: boolean           // Loading state
}
```

#### `FeedbackTable.tsx` (Dashboard)
```typescript
interface FeedbackTableProps {
  projectId: string             // Filter to specific project
  filters: FeedbackFilters      // Applied filters
  onFilterChange: (filters: FeedbackFilters) => void
}

interface FeedbackTableState {
  feedback: Feedback[]          // Current page of feedback
  pagination: PaginationState   // Page info and controls
  selectedItems: string[]       // Selected feedback IDs
  isLoading: boolean           // Loading state
}
```

## State Management Architecture

### Zustand Stores

#### Authentication Store (`/src/stores/authStore.ts`)
```typescript
interface AuthState {
  user: User | null             // Current authenticated user
  session: Session | null       // Supabase session
  isLoading: boolean           // Auth loading state
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}
```

#### Projects Store (`/src/stores/projectsStore.ts`)
```typescript
interface ProjectsState {
  projects: Project[]           // User's projects
  currentProject: Project | null // Selected project
  isLoading: boolean           // Loading state
  
  // Actions
  fetchProjects: () => Promise<void>
  createProject: (data: CreateProjectData) => Promise<Project>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  setCurrentProject: (project: Project) => void
}
```

#### Feedback Store (`/src/stores/feedbackStore.ts`)
```typescript
interface FeedbackState {
  feedback: Feedback[]          // Current feedback items
  filters: FeedbackFilters      // Active filters
  pagination: PaginationState   // Pagination info
  isLoading: boolean           // Loading state
  
  // Actions
  fetchFeedback: (projectId: string, filters?: FeedbackFilters) => Promise<void>
  addFeedback: (feedback: Feedback) => void
  updateFilters: (filters: Partial<FeedbackFilters>) => void
  clearFeedback: () => void
}
```

#### Widget Store (`/src/stores/widgetStore.ts`)
```typescript
interface WidgetState {
  isOpen: boolean               // Form open state
  isSubmitting: boolean         // Submission state
  customization: WidgetCustomization // Widget appearance
  
  // Actions
  openWidget: () => void
  closeWidget: () => void
  setCustomization: (config: WidgetCustomization) => void
  submitFeedback: (data: FeedbackData) => Promise<void>
}
```

## Custom Hooks

### Data Fetching Hooks (`/src/hooks/`)

#### `useProjects.ts`
```typescript
export function useProjects() {
  const { projects, isLoading, fetchProjects } = useProjectsStore()
  
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])
  
  return { projects, isLoading, refetch: fetchProjects }
}
```

#### `useFeedback.ts`
```typescript
export function useFeedback(projectId: string, filters?: FeedbackFilters) {
  const { feedback, isLoading, fetchFeedback } = useFeedbackStore()
  
  const fetch = useCallback(() => {
    if (projectId) {
      fetchFeedback(projectId, filters)
    }
  }, [projectId, filters, fetchFeedback])
  
  useEffect(() => {
    fetch()
  }, [fetch])
  
  return { feedback, isLoading, refetch: fetch }
}
```

#### `useAnalytics.ts`
```typescript
export function useAnalytics(projectId: string, dateRange: DateRange) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetch(`/api/projects/${projectId}/analytics?${createQueryString(dateRange)}`)
      setAnalytics(await data.json())
    } catch (error) {
      console.error('Analytics fetch failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, dateRange])
  
  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])
  
  return { analytics, isLoading, refetch: fetchAnalytics }
}
```

## Data Flow Architecture

### Widget Data Flow
1. **Initialization**: Widget loads with project ID and customization config
2. **User Interaction**: User clicks floating button → opens form
3. **Form Submission**: User fills form → validates → submits to API
4. **API Processing**: API validates, stores feedback, returns success/error
5. **UI Update**: Widget shows success message or error state

### Dashboard Data Flow
1. **Authentication**: User logs in → Supabase auth → set user state
2. **Project Loading**: Dashboard loads → fetch user projects → update store
3. **Project Selection**: User selects project → set current project → fetch project data
4. **Feedback Display**: Project view loads → fetch feedback with filters → display table
5. **Analytics**: Analytics view loads → fetch aggregated data → render charts

### Real-time Updates (Future Enhancement)
- Supabase real-time subscriptions for live feedback updates
- WebSocket connection for instant dashboard updates
- Optimistic UI updates for better UX

## Error Handling Strategy

### Component Error Boundaries
```typescript
// Error boundary for each major feature section
<ErrorBoundary fallback={<ErrorFallback />}>
  <FeedbackTable />
</ErrorBoundary>
```

### API Error Handling
```typescript
// Consistent error response format
interface ApiError {
  message: string
  code: string
  details?: Record<string, any>
}

// Error states in components
interface ComponentState {
  error: ApiError | null
  isLoading: boolean
  // ... other state
}
```

### Form Validation
```typescript
// Consistent validation schema using Zod
const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(1000),
  email: z.string().email().optional()
})
```

## Performance Considerations

### Code Splitting
- Lazy load dashboard routes
- Separate widget bundle from main app
- Dynamic imports for heavy components (charts)

### Caching Strategy
- SWR/React Query for API data caching
- Local storage for widget preferences
- Supabase real-time for live updates

### Bundle Optimization
- Widget as standalone lightweight bundle
- Tree-shaking for unused components
- Minimal dependencies in widget bundle

## Accessibility Standards

### WCAG 2.1 AA Compliance
- Keyboard navigation for all interactive elements
- Screen reader support with proper ARIA labels
- Color contrast ratios meet accessibility standards
- Focus management for modals and forms

### Widget Accessibility
- Floating button accessible via keyboard
- Form fields have proper labels and descriptions
- Error messages announced to screen readers
- High contrast mode support