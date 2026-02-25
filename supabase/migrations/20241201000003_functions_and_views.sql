-- Database Functions and Views for FeedbackPulse v2
-- Analytics functions and project statistics view

-- Function to calculate sentiment from feedback text
CREATE OR REPLACE FUNCTION calculate_sentiment(feedback_text TEXT)
RETURNS sentiment_type AS $$
DECLARE
    positive_words TEXT[] := ARRAY['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'awesome', 'fantastic', 'wonderful', 'outstanding'];
    negative_words TEXT[] := ARRAY['bad', 'terrible', 'awful', 'hate', 'horrible', 'worst', 'sucks', 'disappointing', 'frustrating', 'useless'];
    positive_count INTEGER := 0;
    negative_count INTEGER := 0;
    word TEXT;
BEGIN
    IF feedback_text IS NULL OR LENGTH(TRIM(feedback_text)) = 0 THEN
        RETURN 'neutral'::sentiment_type;
    END IF;

    feedback_text := LOWER(feedback_text);

    -- Count positive words
    FOREACH word IN ARRAY positive_words LOOP
        IF feedback_text LIKE '%' || word || '%' THEN
            positive_count := positive_count + 1;
        END IF;
    END LOOP;

    -- Count negative words
    FOREACH word IN ARRAY negative_words LOOP
        IF feedback_text LIKE '%' || word || '%' THEN
            negative_count := negative_count + 1;
        END IF;
    END LOOP;

    -- Determine sentiment
    IF positive_count > negative_count THEN
        RETURN 'positive'::sentiment_type;
    ELSIF negative_count > positive_count THEN
        RETURN 'negative'::sentiment_type;
    ELSE
        RETURN 'neutral'::sentiment_type;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to aggregate daily analytics
CREATE OR REPLACE FUNCTION aggregate_daily_analytics(
    target_project_id UUID,
    target_date DATE
)
RETURNS VOID AS $$
DECLARE
    analytics_data RECORD;
BEGIN
    -- Calculate analytics for the given day
    SELECT 
        COUNT(*) as total_submissions,
        ROUND(AVG(rating), 2) as avg_rating,
        jsonb_build_object(
            '1', COUNT(*) FILTER (WHERE rating = 1),
            '2', COUNT(*) FILTER (WHERE rating = 2),
            '3', COUNT(*) FILTER (WHERE rating = 3),
            '4', COUNT(*) FILTER (WHERE rating = 4),
            '5', COUNT(*) FILTER (WHERE rating = 5)
        ) as rating_distribution,
        jsonb_build_object(
            'positive', COUNT(*) FILTER (WHERE sentiment = 'positive'),
            'neutral', COUNT(*) FILTER (WHERE sentiment = 'neutral'),
            'negative', COUNT(*) FILTER (WHERE sentiment = 'negative')
        ) as sentiment_distribution,
        jsonb_build_object(
            'widget', COUNT(*) FILTER (WHERE source_type = 'widget'),
            'email', COUNT(*) FILTER (WHERE source_type = 'email'),
            'manual', COUNT(*) FILTER (WHERE source_type = 'manual'),
            'api', COUNT(*) FILTER (WHERE source_type = 'api')
        ) as source_breakdown
    INTO analytics_data
    FROM feedback 
    WHERE project_id = target_project_id 
      AND DATE(created_at) = target_date;

    -- Insert or update the analytics record
    INSERT INTO feedback_analytics (
        project_id, 
        date, 
        total_submissions, 
        avg_rating, 
        rating_distribution, 
        sentiment_distribution, 
        source_breakdown
    ) 
    VALUES (
        target_project_id,
        target_date,
        analytics_data.total_submissions,
        analytics_data.avg_rating,
        analytics_data.rating_distribution,
        analytics_data.sentiment_distribution,
        analytics_data.source_breakdown
    )
    ON CONFLICT (project_id, date) 
    DO UPDATE SET
        total_submissions = EXCLUDED.total_submissions,
        avg_rating = EXCLUDED.avg_rating,
        rating_distribution = EXCLUDED.rating_distribution,
        sentiment_distribution = EXCLUDED.sentiment_distribution,
        source_breakdown = EXCLUDED.source_breakdown;
END;
$$ LANGUAGE plpgsql;

-- Project statistics view
CREATE VIEW project_stats AS
SELECT 
    p.id as project_id,
    COUNT(f.id) as total_feedback,
    ROUND(AVG(f.rating), 2) as avg_rating,
    MAX(f.created_at) as latest_feedback,
    jsonb_build_object(
        'positive', COUNT(*) FILTER (WHERE f.sentiment = 'positive'),
        'neutral', COUNT(*) FILTER (WHERE f.sentiment = 'neutral'),
        'negative', COUNT(*) FILTER (WHERE f.sentiment = 'negative')
    ) as sentiment_breakdown
FROM projects p
LEFT JOIN feedback f ON p.id = f.project_id
GROUP BY p.id;

-- Function to get project analytics for date range
CREATE OR REPLACE FUNCTION get_project_analytics(
    project_id UUID,
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    date DATE,
    total_submissions INTEGER,
    avg_rating DECIMAL,
    rating_distribution JSONB,
    sentiment_distribution JSONB,
    source_breakdown JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fa.date,
        fa.total_submissions,
        fa.avg_rating,
        fa.rating_distribution,
        fa.sentiment_distribution,
        fa.source_breakdown
    FROM feedback_analytics fa
    WHERE fa.project_id = get_project_analytics.project_id
      AND fa.date BETWEEN start_date AND end_date
    ORDER BY fa.date;
END;
$$ LANGUAGE plpgsql;