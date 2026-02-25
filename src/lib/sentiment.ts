/**
 * Simple rule-based sentiment analysis for feedback comments.
 * 
 * This module provides basic sentiment classification using keyword matching
 * and scoring. It's designed for quick feedback categorization without
 * external API dependencies.
 */

/**
 * Sentiment classification result.
 */
export type Sentiment = 'positive' | 'neutral' | 'negative';

/**
 * Detailed sentiment analysis result with confidence score.
 */
export interface SentimentAnalysis {
  /** Overall sentiment classification */
  sentiment: Sentiment;
  /** Confidence score (0-1, where 1 is most confident) */
  confidence: number;
  /** Number of positive keywords found */
  positiveMatches: number;
  /** Number of negative keywords found */
  negativeMatches: number;
}

/**
 * Keywords that typically indicate positive sentiment.
 */
const POSITIVE_KEYWORDS = [
  // Basic positive emotions
  'love', 'like', 'enjoy', 'happy', 'pleased', 'satisfied', 'delighted',
  'amazing', 'awesome', 'excellent', 'outstanding', 'fantastic', 'wonderful',
  'great', 'good', 'nice', 'perfect', 'brilliant', 'superb', 'magnificent',
  
  // Approval and recommendation
  'recommend', 'approve', 'endorse', 'support', 'favor', 'appreciate',
  'thank', 'thanks', 'grateful', 'impressed', 'admire',
  
  // Quality indicators
  'smooth', 'fast', 'efficient', 'reliable', 'stable', 'intuitive',
  'user-friendly', 'helpful', 'useful', 'valuable', 'innovative',
  
  // Success indicators
  'works', 'success', 'solved', 'fixed', 'improved', 'better', 'upgrade'
];

/**
 * Keywords that typically indicate negative sentiment.
 */
const NEGATIVE_KEYWORDS = [
  // Basic negative emotions
  'hate', 'dislike', 'angry', 'frustrated', 'annoyed', 'disappointed',
  'upset', 'mad', 'furious', 'irritated', 'bothered', 'disgusted',
  
  // Quality issues
  'terrible', 'awful', 'horrible', 'bad', 'poor', 'worst', 'useless',
  'broken', 'buggy', 'slow', 'laggy', 'crashed', 'freezes', 'hangs',
  
  // Problems and failures
  'problem', 'issue', 'error', 'bug', 'glitch', 'fail', 'failed', 'failing',
  'doesnt work', 'not working', 'broken', 'unusable', 'confusing',
  
  // Criticism
  'complain', 'complaint', 'criticize', 'disapprove', 'reject', 'refuse',
  'waste', 'regret', 'mistake', 'wrong', 'incorrect', 'missing'
];

/**
 * Analyzes the sentiment of a text comment using rule-based keyword matching.
 * 
 * The algorithm works by:
 * 1. Converting text to lowercase and tokenizing
 * 2. Counting positive and negative keyword matches
 * 3. Calculating a sentiment score based on the balance
 * 4. Determining confidence based on the total number of sentiment indicators
 * 
 * @param comment - The text comment to analyze (can be null/undefined)
 * @returns SentimentAnalysis with sentiment classification and confidence
 */
export function analyzeSentiment(comment: string | null | undefined): SentimentAnalysis {
  // Handle empty or null comments
  if (!comment || typeof comment !== 'string') {
    return {
      sentiment: 'neutral',
      confidence: 0,
      positiveMatches: 0,
      negativeMatches: 0
    };
  }

  // Normalize text: convert to lowercase and split into words
  const words = comment.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(word => word.length > 0);

  // Count keyword matches
  let positiveMatches = 0;
  let negativeMatches = 0;

  // Check each word against positive keywords
  words.forEach(word => {
    if (POSITIVE_KEYWORDS.some(keyword => 
      word.includes(keyword) || keyword.includes(word)
    )) {
      positiveMatches++;
    }
    
    if (NEGATIVE_KEYWORDS.some(keyword => 
      word.includes(keyword) || keyword.includes(word)
    )) {
      negativeMatches++;
    }
  });

  // Check for multi-word phrases (basic implementation)
  const fullText = words.join(' ');
  
  // Additional phrase matching for common expressions
  const positivePhases = ['very good', 'really like', 'works well', 'much better'];
  const negativePhases = ['doesnt work', 'not working', 'very bad', 'really hate'];
  
  positivePhases.forEach(phrase => {
    if (fullText.includes(phrase)) {
      positiveMatches += 2; // Weight phrases higher than individual words
    }
  });
  
  negativePhases.forEach(phrase => {
    if (fullText.includes(phrase)) {
      negativeMatches += 2; // Weight phrases higher than individual words
    }
  });

  // Calculate sentiment score
  const totalMatches = positiveMatches + negativeMatches;
  const sentimentScore = totalMatches > 0 ? 
    (positiveMatches - negativeMatches) / totalMatches : 0;

  // Determine sentiment category with more sensitive thresholds
  let sentiment: Sentiment;
  if (sentimentScore > 0 && positiveMatches > 0) {
    sentiment = 'positive';
  } else if (sentimentScore < 0 && negativeMatches > 0) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }

  // Calculate confidence based on total indicators and score magnitude
  // More matches and stronger score indicate higher confidence
  const confidenceFromMatches = Math.min(totalMatches / 5, 1); // Max confidence from 5+ matches
  const confidenceFromScore = Math.abs(sentimentScore); // Stronger sentiment = higher confidence
  const confidence = Math.min((confidenceFromMatches + confidenceFromScore) / 2, 1);

  return {
    sentiment,
    confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
    positiveMatches,
    negativeMatches
  };
}

/**
 * Simple sentiment classification that returns only the sentiment category.
 * This is a convenience function for when you only need the basic classification.
 * 
 * @param comment - The text comment to analyze
 * @returns The sentiment category ('positive', 'neutral', or 'negative')
 */
export function classifySentiment(comment: string | null | undefined): Sentiment {
  return analyzeSentiment(comment).sentiment;
}