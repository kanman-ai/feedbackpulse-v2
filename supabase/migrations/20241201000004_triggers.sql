-- Database Triggers for FeedbackPulse v2
-- Automatic profile creation and sentiment analysis

-- Trigger to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger to automatically calculate sentiment for new feedback
CREATE OR REPLACE FUNCTION auto_calculate_sentiment()
RETURNS TRIGGER AS $$
BEGIN
    -- Only calculate sentiment if comment exists and sentiment is not already set
    IF NEW.comment IS NOT NULL AND NEW.sentiment IS NULL THEN
        NEW.sentiment := calculate_sentiment(NEW.comment);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_sentiment_trigger
    BEFORE INSERT ON feedback
    FOR EACH ROW EXECUTE FUNCTION auto_calculate_sentiment();

-- Trigger to update analytics when feedback is added/updated
CREATE OR REPLACE FUNCTION update_analytics_on_feedback_change()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT or UPDATE, refresh analytics for the current date
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM aggregate_daily_analytics(NEW.project_id, DATE(NEW.created_at));
        RETURN NEW;
    END IF;
    
    -- For DELETE, refresh analytics for the deleted feedback date
    IF TG_OP = 'DELETE' THEN
        PERFORM aggregate_daily_analytics(OLD.project_id, DATE(OLD.created_at));
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_analytics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_analytics_on_feedback_change();