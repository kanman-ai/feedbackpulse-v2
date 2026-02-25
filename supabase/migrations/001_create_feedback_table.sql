-- FeedbackPulse v2 - Create feedback table
-- Migration for storing user feedback submissions from widgets

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL CHECK (char_length(comment) <= 500),
  email VARCHAR(255) NULL,
  source VARCHAR(100) NOT NULL DEFAULT 'widget',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_agent TEXT NULL,
  ip_address INET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_feedback_project_id ON public.feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON public.feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_submitted_at ON public.feedback(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_source ON public.feedback(source);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for feedback table
-- Allow insert from anyone (for widget submissions)
CREATE POLICY "Allow widget feedback submission" 
  ON public.feedback 
  FOR INSERT 
  WITH CHECK (true);

-- Allow project owners and members to read their project's feedback
CREATE POLICY "Project members can view feedback" 
  ON public.feedback 
  FOR SELECT 
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p 
      LEFT JOIN public.project_members pm ON p.id = pm.project_id 
      WHERE p.owner_id = auth.uid() 
         OR pm.user_id = auth.uid()
    )
  );

-- Allow project owners to update/delete feedback
CREATE POLICY "Project owners can manage feedback" 
  ON public.feedback 
  FOR ALL 
  USING (
    project_id IN (
      SELECT id FROM public.projects 
      WHERE owner_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.feedback IS 'User feedback submissions from FeedbackPulse widgets';
COMMENT ON COLUMN public.feedback.rating IS 'User rating from 1 to 5 stars';
COMMENT ON COLUMN public.feedback.comment IS 'User feedback message, max 500 characters';
COMMENT ON COLUMN public.feedback.email IS 'Optional user email for follow-up';
COMMENT ON COLUMN public.feedback.source IS 'Source of feedback (widget, dashboard, etc.)';
COMMENT ON COLUMN public.feedback.submitted_at IS 'When the feedback was originally submitted';
COMMENT ON COLUMN public.feedback.user_agent IS 'Browser user agent for analytics';
COMMENT ON COLUMN public.feedback.ip_address IS 'User IP address for spam prevention';
