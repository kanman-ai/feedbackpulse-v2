-- Row Level Security Policies for FeedbackPulse v2
-- Ensures data isolation between users and proper access control

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_analytics ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects"
    ON projects FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (auth.uid() = owner_id);

-- Feedback policies (read-only for project owners)
CREATE POLICY "Project owners can view feedback"
    ON feedback FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = feedback.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

-- Anonymous users can submit feedback (widget submissions)
CREATE POLICY "Anonymous users can submit feedback"
    ON feedback FOR INSERT
    WITH CHECK (true);

-- Feedback analytics policies
CREATE POLICY "Project owners can view analytics"
    ON feedback_analytics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = feedback_analytics.project_id 
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "System can manage analytics"
    ON feedback_analytics FOR ALL
    USING (auth.role() = 'service_role');