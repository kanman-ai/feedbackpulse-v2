# FeedbackPulse v2 Migration Plan

## Migration Order

### 1. Initial Setup (001_initial_setup.sql)
- Enable Row Level Security
- Create database functions
- Set up Supabase auth hooks

### 2. User Profiles (002_profiles.sql)
- Create profiles table
- Add RLS policies
- Create profile creation trigger

### 3. Organizations (003_organizations.sql)
- Create organizations table
- Add indexes and RLS policies

### 4. Organization Members (004_organization_members.sql)
- Create organization_members table
- Add membership RLS policies
- Add indexes for performance

### 5. Projects (005_projects.sql)
- Create projects table
- Add project RLS policies
- Add indexes

### 6. Widgets (006_widgets.sql)
- Create widgets table
- Add widget customization fields
- Add RLS policies

### 7. Feedback Submissions (007_feedback_submissions.sql)
- Create feedback_submissions table
- Add public insert policy
- Add performance indexes

### 8. Rate Limiting (008_rate_limits.sql)
- Create rate_limits table
- Add cleanup function
- Schedule cleanup job

### 9. Seed Data (009_seed_data.sql)
- Default organization for solo users
- Sample widget configurations

## Dependencies

- Migration 002 depends on 001 (functions)
- Migration 004 depends on 002, 003 (profiles, organizations)
- Migration 005 depends on 003, 004 (organizations, members)
- Migration 006 depends on 005 (projects)
- Migration 007 depends on 006 (widgets)
- Migration 008 is independent
- Migration 009 depends on all previous migrations

## Rollback Strategy

Each migration includes corresponding DOWN migration for rollback:
- Drop tables in reverse order
- Disable RLS policies
- Remove triggers and functions

## Testing Requirements

- Test RLS policies with different user roles
- Verify foreign key constraints
- Test rate limiting functionality
- Validate widget embedding works
- Check organization member permissions