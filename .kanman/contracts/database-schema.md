# FeedbackPulse v2 Database Schema

## Overview

This schema supports a B2B2C SaaS platform for feedback collection with the following features:
- User authentication with team/organization support
- Project-based feedback collection
- Embeddable widgets with basic customization
- Simple analytics (response count, average rating, recent feedback)
- Rate limiting for API protection

## Tables

### 1. auth.users (Supabase Auth)
Built-in Supabase authentication table. Extended with our custom fields via triggers.

### 2. public.profiles
User profile information extending Supabase auth.users.

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Indexes:**
- PRIMARY KEY on id
- UNIQUE INDEX on email

**RLS Policies:**
- Users can read/update their own profile
- Public read access for team members within same organization

### 3. public.organizations
Teams/companies using the platform.

```sql
CREATE TABLE public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Indexes:**
- PRIMARY KEY on id
- UNIQUE INDEX on slug
- INDEX on owner_id

**RLS Policies:**
- Organization members can read organization details
- Only owners can update organization settings

### 4. public.organization_members
Team membership management.

```sql
CREATE TABLE public.organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID REFERENCES public.profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  joined_at TIMESTAMPTZ,
  UNIQUE(organization_id, user_id)
);
```

**Indexes:**
- PRIMARY KEY on id
- UNIQUE INDEX on (organization_id, user_id)
- INDEX on user_id
- INDEX on organization_id

**RLS Policies:**
- Organization members can read membership data
- Admins/owners can manage memberships

### 5. public.projects
Feedback collection projects.

```sql
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, slug)
);
```

**Indexes:**
- PRIMARY KEY on id
- UNIQUE INDEX on (organization_id, slug)
- INDEX on organization_id
- INDEX on created_by

**RLS Policies:**
- Organization members can read projects
- Members can create projects
- Project creators and admins can update projects

### 6. public.widgets
Embeddable feedback widgets with customization.

```sql
CREATE TABLE public.widgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Feedback Widget',
  theme_color TEXT DEFAULT '#3b82f6' NOT NULL,
  question_text TEXT DEFAULT 'How would you rate your experience?' NOT NULL,
  thank_you_text TEXT DEFAULT 'Thank you for your feedback!' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Indexes:**
- PRIMARY KEY on id
- INDEX on project_id

**RLS Policies:**
- Organization members can read widgets for their projects
- Members can create/update widgets for their projects

### 7. public.feedback_submissions
Individual feedback responses.

```sql
CREATE TABLE public.feedback_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  widget_id UUID REFERENCES public.widgets(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  user_email TEXT,
  user_name TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  metadata JSONB DEFAULT '{}' NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Indexes:**
- PRIMARY KEY on id
- INDEX on widget_id
- INDEX on submitted_at (for time-based queries)
- INDEX on ip_address (for rate limiting)

**RLS Policies:**
- Organization members can read feedback for their widgets
- Public insert access (for widget submissions)
- No update/delete access to preserve data integrity

### 8. public.rate_limits
API rate limiting tracking.

```sql
CREATE TABLE public.rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP address or API key
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1 NOT NULL,
  window_start TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(identifier, endpoint, window_start)
);
```

**Indexes:**
- PRIMARY KEY on id
- UNIQUE INDEX on (identifier, endpoint, window_start)
- INDEX on expires_at (for cleanup)

**RLS Policies:**
- No RLS (system table, managed by API only)

## Relationships

```
organizations (1) ----< organization_members (n)
organization_members (n) >---- profiles (1)
organizations (1) ----< projects (n)
projects (1) ----< widgets (n)
widgets (1) ----< feedback_submissions (n)
```

## Row Level Security (RLS) Policies

### profiles
```sql
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can view profiles of organization members
CREATE POLICY "Users can view organization member profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om1
      JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid() AND om2.user_id = profiles.id
    )
  );
```

### organizations
```sql
-- Organization members can view organization
CREATE POLICY "Organization members can view organization" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organizations.id AND user_id = auth.uid()
    )
  );

-- Only owners can update organization
CREATE POLICY "Only owners can update organization" ON public.organizations
  FOR UPDATE USING (owner_id = auth.uid());
```

### organization_members
```sql
-- Organization members can view membership data
CREATE POLICY "Members can view organization memberships" ON public.organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organization_members.organization_id AND user_id = auth.uid()
    )
  );

-- Admins and owners can manage memberships
CREATE POLICY "Admins can manage memberships" ON public.organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organization_members.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
```

### projects
```sql
-- Organization members can view projects
CREATE POLICY "Organization members can view projects" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = projects.organization_id AND user_id = auth.uid()
    )
  );

-- Members can create projects
CREATE POLICY "Members can create projects" ON public.projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = projects.organization_id AND user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Project creators and admins can update
CREATE POLICY "Project creators and admins can update projects" ON public.projects
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = projects.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
```

### widgets
```sql
-- Organization members can view widgets
CREATE POLICY "Organization members can view widgets" ON public.widgets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = widgets.project_id AND om.user_id = auth.uid()
    )
  );

-- Members can create/update widgets
CREATE POLICY "Members can manage widgets" ON public.widgets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.organization_members om ON p.organization_id = om.organization_id
      WHERE p.id = widgets.project_id AND om.user_id = auth.uid()
    )
  );
```

### feedback_submissions
```sql
-- Public can insert (for widget submissions)
CREATE POLICY "Public can submit feedback" ON public.feedback_submissions
  FOR INSERT WITH CHECK (true);

-- Organization members can view feedback
CREATE POLICY "Organization members can view feedback" ON public.feedback_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.widgets w
      JOIN public.projects p ON w.project_id = p.id
      JOIN public.organization_members om ON p.organization_id = om.organization_id
      WHERE w.id = feedback_submissions.widget_id AND om.user_id = auth.uid()
    )
  );
```

## Database Functions

### 1. Update updated_at timestamp
```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Create user profile on signup
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Cleanup expired rate limits
```sql
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

## Database Triggers

### 1. Updated timestamp triggers
```sql
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_widgets_updated_at
  BEFORE UPDATE ON public.widgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### 2. User profile creation trigger
```sql
CREATE TRIGGER trigger_create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Performance Optimizations

### 1. Indexes for common queries
- Feedback submissions by widget and time range
- Projects by organization
- Rate limits by identifier and endpoint

### 2. Scheduled cleanup
```sql
-- Schedule rate limit cleanup to run every hour
SELECT cron.schedule('cleanup-rate-limits', '0 * * * *', 'SELECT public.cleanup_expired_rate_limits();');
```

### 3. Partitioning considerations
For high-volume deployments, consider partitioning:
- `feedback_submissions` by month
- `rate_limits` by day

## Security Considerations

1. **RLS Enabled**: All tables have Row Level Security enabled
2. **API Keys**: Consider adding API key authentication for widget endpoints
3. **Rate Limiting**: Implemented at database level for core protection
4. **Data Integrity**: Foreign key constraints prevent orphaned records
5. **Audit Trail**: Timestamps on all mutable records
6. **PII Handling**: User emails are optional, IP addresses hashed for privacy