# FeedbackPulse v2 - Integration Plan

## Service Boundaries

### Frontend Services
**Next.js 14 Application** (`/src/app/`)
- User authentication and session management
- Project management dashboard
- Analytics dashboard with Recharts
- Widget configuration interface
- Runs on: Vercel Edge Runtime / Node.js

**Embeddable Widget** (`/src/widget/`)
- Standalone JavaScript module
- Cross-origin iframe or script tag embed
- Minimal dependencies for performance
- Runs on: Customer websites (any domain)

### Backend Services
**API Routes** (`/src/app/api/`)
- Authentication endpoints (login, register, session)
- Project CRUD operations
- Feedback submission endpoint with rate limiting
- Analytics data aggregation
- Runs on: Vercel Edge Functions / Serverless

**Edge Function** (`/supabase/functions/`)
- Real-time feedback processing
- Email notifications
- Data validation and transformation
- Runs on: Supabase Edge Runtime (Deno)

### Data Layer
**Supabase Database** (PostgreSQL)
- User accounts and authentication
- Project configurations
- Feedback entries with metadata
- Analytics aggregation tables
- Real-time subscriptions via WebSockets

**Supabase Storage**
- User avatar uploads
- Project branding assets
- Widget customization assets

## Data Synchronization Strategy

### Real-time Components
1. **Dashboard Analytics**: Supabase real-time subscriptions
   - Subscribe to `feedback_entries` table changes
   - Auto-refresh analytics when new feedback arrives
   - Graceful fallback to polling on connection loss

2. **Widget Submissions**: HTTP POST with confirmation
   - Widget → API endpoint (one-shot request)
   - API → Supabase insert
   - Real-time notification → Dashboard
   - No persistent connection from widget

### Polling Components
1. **Project Configuration**: On-demand fetch
   - Widget fetches config on initialization
   - Dashboard fetches project list on navigation
   - Cache with 5-minute TTL

2. **Rate Limit Status**: In-memory tracking
   - Rate limits tracked in Vercel KV or memory
   - No persistent storage needed
   - Reset on deployment

## Shared Types & Cross-Service Communication

### Core Domain Types
```typescript
// Shared across all services
interface User {
  id: string
  email: string
  name?: string
  created_at: string
}

interface Project {
  id: string
  name: string
  user_id: string
  widget_config: WidgetConfig
  created_at: string
}

interface WidgetConfig {
  theme_color: string
  question_text: string
  position: 'bottom-right' // Fixed for MVP
}

interface FeedbackEntry {
  id: string
  project_id: string
  rating: number // 1-5
  comment?: string
  user_agent: string
  ip_address: string
  created_at: string
}
```

### API Response Types
```typescript
// Used by frontend and widget
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  rate_limit?: {
    remaining: number
    reset_at: string
  }
}

interface AnalyticsData {
  total_responses: number
  average_rating: number
  recent_feedback: FeedbackEntry[]
}
```

### Widget Embed Interface
```typescript
// Global window interface for widget
interface Window {
  FeedbackPulse: {
    init: (config: { projectId: string; apiUrl?: string }) => void
    destroy: () => void
  }
}
```

## External Dependencies

### Required Services
1. **Supabase**
   - Database: PostgreSQL with Row Level Security
   - Auth: Built-in authentication system
   - Real-time: WebSocket subscriptions
   - Storage: File uploads for branding

2. **Vercel**
   - Hosting: Next.js application deployment
   - Edge Functions: API rate limiting and processing
   - KV Storage: Rate limit tracking

### Optional Services (Future)
1. **Email Provider** (SendGrid/Resend)
   - Feedback notifications
   - Weekly analytics reports

2. **Analytics Provider** (PostHog/Mixpanel)
   - Widget usage tracking
   - Dashboard interaction analytics

## Performance Considerations

### Widget Performance
- **Bundle Size**: <20KB gzipped (critical for embed)
- **Load Time**: <500ms to render on target page
- **API Latency**: <200ms for feedback submission
- **Resource Isolation**: No conflicts with host page CSS/JS

### Dashboard Performance
- **Initial Load**: <2s to first meaningful paint
- **Real-time Updates**: <100ms latency for new feedback
- **Data Loading**: Pagination for >100 feedback entries
- **Caching**: Aggressive caching of project configurations

### API Performance
- **Rate Limiting**: 100 requests/minute per IP
- **Response Time**: <500ms for all endpoints
- **Database Queries**: Indexed lookups, no table scans
- **Connection Pooling**: Supabase connection limits

## Optimization Approach

### Frontend Optimizations
1. **Code Splitting**: Lazy load analytics components
2. **Image Optimization**: Next.js automatic optimization
3. **Caching**: SWR for API data with stale-while-revalidate
4. **Bundle Analysis**: Regular webpack-bundle-analyzer runs

### Database Optimizations
1. **Indexing Strategy**:
   - `feedback_entries.project_id` (foreign key)
   - `feedback_entries.created_at` (analytics queries)
   - `projects.user_id` (user project list)

2. **Query Optimization**:
   - Pre-calculated aggregations for analytics
   - Materialized views for complex reports
   - Connection pooling via Supabase

### API Optimizations
1. **Rate Limiting**: Redis/KV-based sliding window
2. **Response Caching**: CDN cache for static config
3. **Request Validation**: Early validation to reduce processing
4. **Error Handling**: Graceful degradation patterns

## Security Boundaries

### Widget Security
- **CORS Policy**: Strict origin validation for API calls
- **Input Validation**: Server-side validation of all feedback
- **XSS Prevention**: Content Security Policy headers
- **Rate Limiting**: Per-IP and per-project limits

### API Security
- **Authentication**: Supabase JWT validation
- **Authorization**: Row Level Security policies
- **Input Sanitization**: SQL injection prevention
- **HTTPS Only**: All traffic encrypted in transit

### Database Security
- **Row Level Security**: User can only access own projects
- **Connection Security**: SSL-only database connections
- **Data Encryption**: Encrypted at rest (Supabase default)
- **Backup Security**: Automated encrypted backups

## Integration Points

### Widget → API Integration
```typescript
// Widget submits feedback via fetch API
POST /api/feedback/submit
{
  project_id: string,
  rating: number,
  comment?: string
}
```

### API → Database Integration
```sql
-- Feedback insertion with validation
INSERT INTO feedback_entries (project_id, rating, comment, user_agent, ip_address)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, created_at;
```

### Database → Dashboard Integration
```typescript
// Real-time subscription for new feedback
const subscription = supabase
  .channel('feedback_updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'feedback_entries'
  }, handleNewFeedback)
  .subscribe()
```

## Deployment Strategy

### Environment Separation
1. **Development**: Local Next.js + Supabase local
2. **Staging**: Vercel Preview + Supabase staging
3. **Production**: Vercel Production + Supabase production

### Database Migrations
- Supabase migration files in `/supabase/migrations/`
- Automated deployment via GitHub Actions
- Rollback strategy for failed migrations

### Feature Flags
- Widget feature toggles via project configuration
- Gradual rollout for new analytics features
- A/B testing framework for UI improvements

## Monitoring & Observability

### Application Monitoring
- **Error Tracking**: Sentry integration for frontend and API
- **Performance**: Core Web Vitals monitoring
- **Uptime**: Synthetic monitoring of critical endpoints
- **Real User Monitoring**: Widget performance on customer sites

### Infrastructure Monitoring
- **Database**: Supabase built-in metrics and alerting
- **API**: Vercel Analytics and function monitoring
- **CDN**: Performance and cache hit rates
- **Rate Limiting**: Monitor threshold breaches and patterns

This integration plan provides the foundation for implementing all four vertical features while maintaining clean service boundaries and optimal performance.