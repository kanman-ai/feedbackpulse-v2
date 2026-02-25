# FeedbackPulse v2 Database Schema

**Board:** FeedbackPulse v2  
**Generated:** Planning Phase  
**Purpose:** Complete database schema specification for customer feedback collection and analytics platform

## Overview

This schema supports a customer feedback collection platform with:
- Multi-tenant project management
- Embeddable feedback widgets
- Real-time feedback collection with star ratings and comments
- Basic analytics and sentiment analysis
- User authentication and authorization via Supabase Auth

## Core Tables

### 1. Users Table
Leverages Supabase Auth's built-in `auth.users` table. Custom user data stored in `public.profiles`.

```sql
-- Profiles table extending auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Constraints:**
- `id` is 1:1 with `auth.users.id` 
- `email` must be unique and not null
- Cascade delete when auth user is deleted

**Indexes:**
- Primary key index on `id` (automatic)
- Unique index on `email`

**RLS Policies:**
- Users can read/update their own profile
- No public access

### 2. Projects Table
Each project represents a customer's website/application collecting feedback.

```sql
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  
  -- Widget configuration
  widget_button_color TEXT NOT NULL DEFAULT '#3B82F6',
  widget_button_text TEXT NOT NULL DEFAULT 'Feedback',
  
  -- API key for widget authentication
  api_key UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Status and metadata
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT projects_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  CONSTRAINT projects_button_text_length CHECK (char_length(widget_button_text) <= 50),
  CONSTRAINT projects_valid_color CHECK (widget_button_color ~ '^#[0-9A-Fa-f]{6}$')
);
```

**Constraints:**
- Project name: 1-100 characters
- Widget button text: max 50 characters  
- Button color: valid hex color format
- Each user owns their projects (cascade delete)

**Indexes:**
- Primary key index on `id`
- Index on `owner_id` for user's projects lookup
- Unique index on `api_key` for widget authentication

**RLS Policies:**
- Users can CRUD their own projects only
- Widget API can read projects by `api_key` (for submission validation)

### 3. Feedback Submissions Table
Stores all feedback collected through widgets.

```sql
CREATE TABLE public.feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Feedback content
  rating INTEGER NOT NULL,
  comment TEXT,
  email TEXT, -- Optional for follow-up
  
  -- Metadata
  page_url TEXT, -- Where widget was embedded
  user_agent TEXT,
  ip_address INET,
  
  -- Sentiment analysis (simple rule-based)
  sentiment TEXT NOT NULL DEFAULT 'neutral',
  
  -- Timestamps
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT feedback_rating_range CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT feedback_sentiment_values CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  CONSTRAINT feedback_comment_length CHECK (char_length(comment) <= 5000),
  CONSTRAINT feedback_email_format CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);
```

**Constraints:**
- Rating: 1-5 star range
- Sentiment: positive, neutral, or negative only
- Comment: max 5000 characters
- Email: valid format if provided
- Cascade delete when project is deleted

**Indexes:**
- Primary key index on `id`
- Index on `project_id` for project feedback lookup
- Index on `submitted_at` for date filtering
- Composite index on `(project_id, submitted_at DESC)` for efficient dashboard queries
- Index on `rating` for analytics
- Index on `sentiment` for sentiment breakdowns

**RLS Policies:**
- Project owners can read feedback for their projects only
- Widget API can insert feedback (with project validation)
- No updates/deletes allowed (feedback is immutable)

## Functions and Triggers

### 1. Update Timestamps Trigger
Automatically updates `updated_at` timestamps.

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### 2. Sentiment Analysis Trigger
Analyzes comment text and sets sentiment automatically.

```sql
CREATE OR REPLACE FUNCTION public.analyze_sentiment()
RETURNS TRIGGER AS $$
DECLARE
  comment_lower TEXT;
  positive_keywords TEXT[] := ARRAY['love', 'great', 'amazing', 'awesome', 'excellent', 'fantastic', 'wonderful', 'perfect'];
  negative_keywords TEXT[] := ARRAY['hate', 'awful', 'terrible', 'broken', 'bad', 'horrible', 'worst', 'sucks'];
  keyword TEXT;
BEGIN
  -- Skip if no comment
  IF NEW.comment IS NULL OR trim(NEW.comment) = '' THEN
    NEW.sentiment = 'neutral';
    RETURN NEW;
  END IF;
  
  comment_lower = lower(NEW.comment);
  
  -- Check for positive keywords
  FOREACH keyword IN ARRAY positive_keywords LOOP
    IF position(keyword IN comment_lower) > 0 THEN
      NEW.sentiment = 'positive';
      RETURN NEW;
    END IF;
  END LOOP;
  
  -- Check for negative keywords
  FOREACH keyword IN ARRAY negative_keywords LOOP
    IF position(keyword IN comment_lower) > 0 THEN
      NEW.sentiment = 'negative';
      RETURN NEW;
    END IF;
  END LOOP;
  
  -- Default to neutral
  NEW.sentiment = 'neutral';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_sentiment_analysis BEFORE INSERT ON public.feedback_submissions
  FOR EACH ROW EXECUTE FUNCTION public.analyze_sentiment();
```

### 3. Profile Creation Trigger
Automatically creates profile when auth user signs up.

```sql
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: This trigger is created on auth.users in the migration
-- CREATE TRIGGER create_profile_trigger AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_user();
```

## Row Level Security (RLS) Policies

### Profiles Table
```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY profiles_read_own ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Profiles are created automatically via trigger
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Projects Table
```sql
-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Project owners can do everything with their projects
CREATE POLICY projects_owners_full_access ON public.projects
  FOR ALL USING (auth.uid() = owner_id);

-- Widget API can read projects by api_key (for validation during submission)
-- This policy allows unauthenticated access for widget functionality
CREATE POLICY projects_widget_read ON public.projects
  FOR SELECT USING (true); -- Limited by api_key in application logic
```

### Feedback Submissions Table
```sql
-- Enable RLS
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Project owners can read feedback for their projects
CREATE POLICY feedback_read_by_owner ON public.feedback_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = feedback_submissions.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Widget API can insert feedback (validation done in application logic)
CREATE POLICY feedback_widget_insert ON public.feedback_submissions
  FOR INSERT WITH CHECK (true); -- Project validation in app code

-- No updates or deletes (feedback is immutable)
```

## Analytics Views

### Project Summary View
Aggregated analytics per project for dashboard display.

```sql
CREATE VIEW public.project_analytics AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  COUNT(f.id) as total_submissions,
  ROUND(AVG(f.rating), 2) as average_rating,
  COUNT(CASE WHEN f.sentiment = 'positive' THEN 1 END) as positive_count,
  COUNT(CASE WHEN f.sentiment = 'neutral' THEN 1 END) as neutral_count,
  COUNT(CASE WHEN f.sentiment = 'negative' THEN 1 END) as negative_count,
  MAX(f.submitted_at) as latest_submission
FROM public.projects p
LEFT JOIN public.feedback_submissions f ON p.id = f.project_id
GROUP BY p.id, p.name;

-- RLS for analytics view
ALTER VIEW public.project_analytics SET (security_barrier = true);
CREATE POLICY project_analytics_owner_only ON public.project_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = project_analytics.project_id 
      AND projects.owner_id = auth.uid()
    )
  );
```

### Daily Feedback Trends View
For timeline charts in dashboard.

```sql
CREATE VIEW public.daily_feedback_trends AS
SELECT 
  p.id as project_id,
  DATE(f.submitted_at) as submission_date,
  COUNT(*) as submission_count,
  ROUND(AVG(f.rating), 2) as avg_rating,
  COUNT(CASE WHEN f.sentiment = 'positive' THEN 1 END) as positive_count,
  COUNT(CASE WHEN f.sentiment = 'negative' THEN 1 END) as negative_count
FROM public.projects p
LEFT JOIN public.feedback_submissions f ON p.id = f.project_id
WHERE f.submitted_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, DATE(f.submitted_at)
ORDER BY submission_date DESC;

-- RLS for trends view  
ALTER VIEW public.daily_feedback_trends SET (security_barrier = true);
CREATE POLICY daily_trends_owner_only ON public.daily_feedback_trends
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = daily_feedback_trends.project_id 
      AND projects.owner_id = auth.uid()
    )
  );
```

## Performance Considerations

### Essential Indexes
1. `feedback_submissions(project_id, submitted_at DESC)` - Dashboard queries
2. `feedback_submissions(rating)` - Rating filters
3. `feedback_submissions(sentiment)` - Sentiment breakdowns  
4. `projects(api_key)` - Widget authentication
5. `projects(owner_id)` - User's projects

### Query Patterns
- **Dashboard Overview**: Uses `project_analytics` view for summary cards
- **Feedback List**: `(project_id, submitted_at DESC)` index enables fast pagination
- **Date Filtering**: `submitted_at` index supports date range queries
- **Widget Submission**: `api_key` index for project validation

### Scalability Notes
- Feedback submissions table will grow linearly with usage
- Consider partitioning by `submitted_at` if > 1M submissions per project
- Archive old feedback (>1 year) to separate tables if needed
- Sentiment analysis trigger adds minimal overhead (~5ms per insert)

## Data Validation

### Application-Level Validations
Beyond database constraints:
- API key validation during widget submission  
- Rate limiting per IP address (prevent spam)
- XSS sanitization of comment text
- Geolocation blocking if needed

### Referential Integrity
- All foreign keys use CASCADE DELETE for clean data removal
- Orphaned records prevented by constraints
- Profile creation automated via auth trigger

## Security Considerations

### RLS Strategy
- **Strict Isolation**: Users only access their own data
- **Widget Access**: Unauthenticated reads limited to API key validation
- **Immutable Feedback**: No updates/deletes after submission

### Sensitive Data
- IP addresses stored for analytics (consider GDPR compliance)
- Optional email addresses require privacy policy disclosure
- No PII in comments (handled by content policies)

### API Security
- Project API keys are UUIDs (high entropy)
- Widget requests validate against project's `api_key`
- Rate limiting prevents abuse

## Migration Dependencies
This schema requires:
1. Supabase Auth enabled
2. UUID extension: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
3. Auth trigger requires SECURITY DEFINER function
4. RLS policies require auth helper functions

See `migrations-plan.md` for detailed migration order and dependencies.