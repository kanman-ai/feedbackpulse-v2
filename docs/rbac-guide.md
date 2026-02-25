# Role-Based Access Control (RBAC) Guide

This guide explains how to use the RBAC system in FeedbackPulse v2 for managing user permissions and protecting routes.

## Overview

FeedbackPulse v2 implements a project-level role-based access control system with three roles:

- **Viewer**: Read-only access to project content and analytics
- **Editor**: Can manage feedback, widget settings, and view analytics  
- **Owner**: Full control over project including deletion and member management

## Roles and Permissions

### Viewer Role
- `project:read` - View project details
- `feedback:read` - View feedback submissions
- `widget:read` - View widget configuration
- `analytics:read` - View analytics data

### Editor Role
Inherits all viewer permissions plus:
- `project:update` - Update project settings
- `feedback:create` - Create new feedback
- `feedback:update` - Edit existing feedback
- `feedback:delete` - Delete feedback
- `feedback:moderate` - Moderate feedback submissions
- `widget:update` - Update widget settings
- `widget:configure` - Configure widget appearance
- `analytics:export` - Export analytics data

### Owner Role
Inherits all editor permissions plus:
- `project:delete` - Delete the project
- `project:manage_members` - Add, remove, and update member roles
- `project:manage_invites` - Send and manage project invites

## Using the RBAC System

### Checking Permissions in Components

```tsx
import { useProjectRole } from '@/hooks/use-project-role'
import { hasPermission } from '@/lib/auth/rbac'

function FeedbackForm({ projectId }: { projectId: string }) {
  const [roleState] = useProjectRole(projectId)
  
  const canCreateFeedback = roleState.membership && 
    hasPermission(roleState.membership.role, 'feedback:create')
  
  if (!canCreateFeedback) {
    return <div>You don't have permission to create feedback</div>
  }
  
  return <form>{/* Feedback form */}</form>
}
```

### Using the useAccess Hook

```tsx
import { useAccess } from '@/components/auth/protected-route'

function ProjectSettings({ projectId }: { projectId: string }) {
  const { hasAccess, loading } = useAccess({
    requireProjectMembership: true,
    projectId,
    minimumRole: 'editor',
    requiredPermissions: ['project:update']
  })
  
  if (loading) return <LoadingSpinner />
  if (!hasAccess) return <AccessDenied />
  
  return <div>{/* Settings form */}</div>
}
```

### Protecting Entire Pages

```tsx
import { ProtectedRoute } from '@/components/auth/protected-route'

function ProjectMembersPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute
      config={{
        requireAuth: true,
        requireProjectMembership: true,
        projectId: params.id,
        minimumRole: 'owner',
        requiredPermissions: ['project:manage_members']
      }}
    >
      <MembersManagement projectId={params.id} />
    </ProtectedRoute>
  )
}
```

### Using HOC for Page Protection

```tsx
import { withProtection } from '@/components/auth/protected-route'

const ProtectedSettingsPage = withProtection({
  requireProjectMembership: true,
  minimumRole: 'editor'
})(ProjectSettingsPage)

export default ProtectedSettingsPage
```

## API Route Protection

### Basic API Route Protection

```typescript
import { withApiAuth } from '@/lib/auth/api-middleware'

export const GET = withApiAuth(
  async (request, context, { params }) => {
    // Your API logic here
    // context.user and context.projectMembership available
    return Response.json({ data: 'success' })
  },
  {
    requireAuth: true,
    requireProjectMembership: true,
    minimumRole: 'viewer'
  }
)
```

### Advanced API Route Protection

```typescript
export const DELETE = withApiAuth(
  async (request, context, { params }) => {
    const projectId = params.id
    
    // Additional business logic checks
    if (context.projectMembership?.role !== 'owner') {
      return createErrorResponse(
        'Only owners can delete projects',
        'INSUFFICIENT_PERMISSIONS',
        403
      )
    }
    
    // Delete logic here
    return createSuccessResponse({ deleted: true })
  },
  {
    requireAuth: true,
    requireProjectMembership: true,
    minimumRole: 'owner',
    requiredPermissions: ['project:delete']
  }
)
```

## Middleware Configuration

The Next.js middleware automatically protects routes based on patterns defined in `src/middleware.ts`:

- `/projects/[id]/members` - Requires owner role
- `/projects/[id]/settings` - Requires editor role  
- `/projects/[id]/*` - Requires project membership
- `/projects` - Requires authentication

## Role Management

### Displaying Roles

```tsx
import { RoleBadge } from '@/components/auth/role-badge'

function MemberRow({ member }: { member: ProjectMember }) {
  return (
    <div className="flex items-center justify-between">
      <div>{member.email}</div>
      <RoleBadge 
        role={member.role} 
        showTooltip 
        showIcon 
      />
    </div>
  )
}
```

### Role Selection

```tsx
import { RoleSelect } from '@/components/auth/role-badge'

function InviteForm() {
  const [selectedRole, setSelectedRole] = useState<ProjectRole>('viewer')
  
  return (
    <form>
      <input type="email" placeholder="Email" />
      <RoleSelect
        value={selectedRole}
        onChange={setSelectedRole}
        excludeRoles={['owner']} // Don't allow owner invites
      />
      <button type="submit">Send Invite</button>
    </form>
  )
}
```

## Best Practices

### 1. Always Check Permissions Client-Side
Even though middleware protects routes, always verify permissions in components for better UX:

```tsx
// Good
function DeleteButton({ projectId }: { projectId: string }) {
  const [roleState] = useProjectRole(projectId)
  
  if (!roleState.membership || !hasPermission(roleState.membership.role, 'project:delete')) {
    return null // Hide button instead of showing disabled state
  }
  
  return <Button variant="destructive">Delete Project</Button>
}
```

### 2. Use Minimum Required Permissions
Only require the minimum permissions necessary for the action:

```tsx
// Good - only requires read permission
const { hasAccess } = useAccess({
  projectId,
  requiredPermissions: ['analytics:read']
})

// Avoid - unnecessarily requires owner role
const { hasAccess } = useAccess({
  projectId,
  minimumRole: 'owner'
})
```

### 3. Handle Loading States
Always handle loading states when checking permissions:

```tsx
function ProjectDashboard({ projectId }: { projectId: string }) {
  const { hasAccess, loading } = useAccess({
    projectId,
    requireProjectMembership: true
  })
  
  if (loading) return <LoadingSpinner />
  if (!hasAccess) return <AccessDenied />
  
  return <Dashboard />
}
```

### 4. Graceful Error Handling
Provide helpful error messages for access denied scenarios:

```tsx
<ProtectedRoute
  config={{ projectId, minimumRole: 'editor' }}
  unauthorizedComponent={
    <AccessDenied 
      title="Editor Access Required"
      message="You need editor permissions to access project settings."
      action={<Button>Request Access</Button>}
    />
  }
>
  <ProjectSettings />
</ProtectedRoute>
```

## Testing

Test permission logic thoroughly:

```typescript
describe('ProjectSettings', () => {
  it('should show settings for editors', () => {
    const membership: ProjectMembership = {
      projectId: 'proj1',
      role: 'editor',
      isOwner: false,
      joinedAt: new Date()
    }
    
    render(<ProjectSettings projectId="proj1" />, {
      membership
    })
    
    expect(screen.getByRole('button', { name: 'Save Settings' })).toBeInTheDocument()
  })
  
  it('should hide settings for viewers', () => {
    const membership: ProjectMembership = {
      projectId: 'proj1',
      role: 'viewer',
      isOwner: false,
      joinedAt: new Date()
    }
    
    render(<ProjectSettings projectId="proj1" />, {
      membership
    })
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })
})
```