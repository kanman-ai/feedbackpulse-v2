# FeedbackPulse v2 Migration Plan

**Board:** FeedbackPulse v2  
**Purpose:** Ordered migration sequence for database schema implementation

## Prerequisites

Before running any migrations:
1. Supabase project must be created and configured
2. Database connection established
3. Required extensions installed

## Migration Sequence

### Migration 001: Extensions and Functions
**File:** `001_extensions_and_functions.sql`

```sql
-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Utility function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Dependencies:** None  
**Required for:** All subsequent migrations

### Migration 002: Profiles Table
**File:** `002_profiles_table.sql`

```sql
-- User profiles extending auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX profiles_email_idx ON public.profiles(email);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_read_own ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger for updated_at
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

**Dependencies:** Migration 001  
**Required for:** Projects table

### Migration 003: Auto Profile Creation
**File:** `003_auto_profile_creation.sql`

```sql
-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (requires superuser privileges)
CREATE TRIGGER create_profile_trigger 
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_user();
```

**Dependencies:** Migration 002  
**Special Notes:** Requires SECURITY DEFINER for cross-schema access

### Migration 004: Projects Table
**File:** `004_projects_table.sql`

```sql
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  widget_button_color TEXT NOT NULL DEFAULT '#3B82F6',
  widget_button_text TEXT NOT NULL DEFAULT 'Feedback',
  api_key UUID NOT NULL DEFAULT gen_random_uuid(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT projects_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  CONSTRAINT projects_button_text_length CHECK (char_length(widget_button_text) <= 50),
  CONSTRAINT projects_valid_color CHECK (widget_button_color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Indexes
CREATE INDEX projects_owner_id_idx ON public.projects(owner_id);
CREATE UNIQUE INDEX projects_api_key_idx ON public.projects(api_key);

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_owners_full_access ON public.projects
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY projects_widget_read ON public.projects
  FOR SELECT USING (true);

-- Updated_at trigger
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

**Dependencies:** Migration 002  
**Required for:** Feedback submissions

### Migration 005: Sentiment Analysis Function
**File:** `005_sentiment_analysis.sql`

```sql
CREATE OR REPLACE FUNCTION public.analyze_sentiment()
RETURNS TRIGGER AS $$
DECLARE
  comment_lower TEXT;
  positive_keywords TEXT[] := ARRAY['love', 'great', 'amazing', 'awesome', 'excellent', 'fantastic', 'wonderful', 'perfect'];
  negative_keywords TEXT[] := ARRAY['hate', 'awful', 'terrible', 'broken', 'bad', 'horrible', 'worst', 'sucks'];
  keyword TEXT;
BEGIN
  IF NEW.comment IS NULL OR trim(NEW.comment) = '' THEN
    NEW.sentiment = 'neutral';
    RETURN NEW;
  END IF;
  
  comment_lower = lower(NEW.comment);
  
  -- Check positive keywords
  FOREACH keyword IN ARRAY positive_keywords LOOP
    IF position(keyword IN comment_lower) > 0 THEN
      NEW.sentiment = 'positive';
      RETURN NEW;
    END IF;
  END LOOP;
  
  -- Check negative keywords
  FOREACH keyword IN ARRAY negative_keywords LOOP
    IF position(keyword IN comment_lower) > 0 THEN
      NEW.sentiment = 'negative';
      RETURN NEW;
    END IF;
  END LOOP;
  
  NEW.sentiment = 'neutral';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Dependencies:** Migration 001  
**Required for:** Feedback submissions table

### Migration 006: Feedback Submissions Table
**File:** `006_feedback_submissions.sql`

```sql
CREATE TABLE public.feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment TEXT,
  email TEXT,
  page_url TEXT,
  user_agent TEXT,
  ip_address INET,
  sentiment TEXT NOT NULL DEFAULT 'neutral',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT feedback_rating_range CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT feedback_sentiment_values CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  CONSTRAINT feedback_comment_length CHECK (char_length(comment) <= 5000),
  CONSTRAINT feedback_email_format CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Performance indexes
CREATE INDEX feedback_project_id_idx ON public.feedback_submissions(project_id);
CREATE INDEX feedback_submitted_at_idx ON public.feedback_submissions(submitted_at);
CREATE INDEX feedback_project_date_idx ON public.feedback_submissions(project_id, submitted_at DESC);
CREATE INDEX feedback_rating_idx ON public.feedback_submissions(rating);
CREATE INDEX feedback_sentiment_idx ON public.feedback_submissions(sentiment);

-- RLS
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY feedback_read_by_owner ON public.feedback_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = feedback_submissions.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY feedback_widget_insert ON public.feedback_submissions
  FOR INSERT WITH CHECK (true);

-- Sentiment analysis trigger
CREATE TRIGGER feedback_sentiment_analysis BEFORE INSERT ON public.feedback_submissions
  FOR EACH ROW EXECUTE FUNCTION public.analyze_sentiment();
```

**Dependencies:** Migrations 004, 005  
**Required for:** Analytics views

### Migration 007: Analytics Views
**File:** `007_analytics_views.sql`

```sql
-- Project summary analytics
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

-- Daily trends for charts
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
```

**Dependencies:** Migration 006  
**Special Notes:** Views automatically inherit RLS from underlying tables

## Execution Order

1. **001_extensions_and_functions.sql** - Foundation
2. **002_profiles_table.sql** - User management  
3. **003_auto_profile_creation.sql** - Auth integration
4. **004_projects_table.sql** - Core entity
5. **005_sentiment_analysis.sql** - Business logic
6. **006_feedback_submissions.sql** - Main data table
7. **007_analytics_views.sql** - Reporting layer

## Rollback Strategy

Each migration should include corresponding DOWN migration:
- Drop views before tables
- Drop triggers before functions
- Drop tables in reverse dependency order
- Remove policies before disabling RLS
- Drop functions last

## Testing Checklist

After each migration:
- [ ] Tables created with correct schema
- [ ] Indexes exist and are being used
- [ ] RLS policies enforce correct access
- [ ] Triggers fire correctly
- [ ] Foreign key constraints work
- [ ] Check constraints prevent invalid data

## Production Deployment

1. Run migrations during low-traffic window
2. Test with read-only queries first
3. Verify RLS policies in production context
4. Monitor query performance after indexes
5. Check auth trigger creates profiles correctly

## Seed Data Requirements

After schema creation:
- No required seed data (empty database is valid)
- Optional: Create demo project for testing widget
- Supabase Auth handles user creation automatically