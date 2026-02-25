# FeedbackPulse v2 - Supabase Database Setup

This directory contains the database schema and configuration for FeedbackPulse v2.

## Database Schema Overview

### Tables

1. **profiles** - User profiles linked to auth.users
2. **projects** - User-created feedback projects  
3. **feedback** - Submitted feedback entries
4. **feedback_analytics** - Daily aggregated analytics

### Key Features

- Row Level Security (RLS) for data isolation
- Automatic sentiment analysis on feedback
- Real-time analytics aggregation
- Support for multiple feedback sources (widget, email, manual, API)

## Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Save your project URL and anon key

### 2. Run Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 3. Configure Environment
Copy `.env.example` to `.env.local` and update with your Supabase credentials.

## Migration Files

- `20241201000001_initial_schema.sql` - Core tables and indexes
- `20241201000002_rls_policies.sql` - Row Level Security policies
- `20241201000003_functions_and_views.sql` - Analytics functions and views
- `20241201000004_triggers.sql` - Automatic data processing triggers

## Security

All tables use RLS to ensure users can only access their own data. Anonymous users can submit feedback but cannot read it.

## Analytics

Daily analytics are automatically calculated and cached in the `feedback_analytics` table for optimal performance.