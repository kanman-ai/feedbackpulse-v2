/**
 * Test suite for sentiment analysis utilities.
 * 
 * Tests the rule-based sentiment classifier to ensure accurate
 * categorization of feedback comments as positive, negative, or neutral.
 */

import { describe, it, expect } from 'vitest';
import { analyzeSentiment, classifySentiment, type Sentiment } from '../sentiment';

describe('sentiment analysis', () => {
  describe('analyzeSentiment', () => {
    it('should return neutral sentiment for null/undefined input', () => {
      expect(analyzeSentiment(null)).toEqual({
        sentiment: 'neutral',
        confidence: 0,
        positiveMatches: 0,
        negativeMatches: 0
      });
      
      expect(analyzeSentiment(undefined)).toEqual({
        sentiment: 'neutral',
        confidence: 0,
        positiveMatches: 0,
        negativeMatches: 0
      });
    });

    it('should return neutral sentiment for empty strings', () => {
      expect(analyzeSentiment('')).toEqual({
        sentiment: 'neutral',
        confidence: 0,
        positiveMatches: 0,
        negativeMatches: 0
      });
      
      expect(analyzeSentiment('   ')).toEqual({
        sentiment: 'neutral',
        confidence: 0,
        positiveMatches: 0,
        negativeMatches: 0
      });
    });

    it('should return neutral sentiment for non-string input', () => {
      expect(analyzeSentiment(123 as any)).toEqual({
        sentiment: 'neutral',
        confidence: 0,
        positiveMatches: 0,
        negativeMatches: 0
      });
    });

    it('should detect positive sentiment correctly', () => {
      const positiveComments = [
        'This is amazing!',
        'I love this product',
        'Great work, very satisfied',
        'Excellent service, highly recommend',
        'Perfect solution, works great'
      ];
      
      positiveComments.forEach(comment => {
        const result = analyzeSentiment(comment);
        expect(result.sentiment).toBe('positive');
        expect(result.positiveMatches).toBeGreaterThan(0);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('should detect negative sentiment correctly', () => {
      const negativeComments = [
        'This is terrible!',
        'I hate this product',
        'Awful experience, very disappointed',
        'Broken and useless, total failure',
        'Worst service ever, not working at all'
      ];
      
      negativeComments.forEach(comment => {
        const result = analyzeSentiment(comment);
        expect(result.sentiment).toBe('negative');
        expect(result.negativeMatches).toBeGreaterThan(0);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    it('should detect neutral sentiment for mixed or neutral comments', () => {
      const neutralComments = [
        'This is a product',
        'It has features and functions',
        'The interface is blue and white',
        'Some things good, some things bad',
        'It works fine I guess'
      ];
      
      neutralComments.forEach(comment => {
        const result = analyzeSentiment(comment);
        expect(result.sentiment).toBe('neutral');
      });
    });

    it('should handle mixed sentiment with positive dominance', () => {
      const comment = 'Great product but had some issues';
      const result = analyzeSentiment(comment);
      
      expect(result.positiveMatches).toBeGreaterThan(0);
      expect(result.negativeMatches).toBeGreaterThan(0);
      // Should lean positive due to stronger positive words
      expect(result.sentiment).toBe('positive');
    });

    it('should be case insensitive', () => {
      const upperCase = 'THIS IS AMAZING AND EXCELLENT';
      const lowerCase = 'this is amazing and excellent';
      const mixedCase = 'This Is Amazing And Excellent';
      
      const results = [upperCase, lowerCase, mixedCase].map(analyzeSentiment);
      
      // All should have same sentiment and similar match counts
      results.forEach(result => {
        expect(result.sentiment).toBe('positive');
        expect(result.positiveMatches).toBeGreaterThan(0);
      });
    });

    it('should handle punctuation correctly', () => {
      const withPunctuation = 'Great!!! Excellent... Amazing???';
      const withoutPunctuation = 'Great Excellent Amazing';
      
      const result1 = analyzeSentiment(withPunctuation);
      const result2 = analyzeSentiment(withoutPunctuation);
      
      expect(result1.sentiment).toBe('positive');
      expect(result2.sentiment).toBe('positive');
      expect(result1.positiveMatches).toBe(result2.positiveMatches);
    });

    it('should detect common positive phrases', () => {
      const phrasesComments = [
        'very good experience',
        'really like this feature',
        'works well for me',
        'much better than before'
      ];
      
      phrasesComments.forEach(comment => {
        const result = analyzeSentiment(comment);
        expect(result.sentiment).toBe('positive');
        expect(result.positiveMatches).toBeGreaterThan(1); // Should get bonus for phrases
      });
    });

    it('should detect common negative phrases', () => {
      const phrasesComments = [
        'doesnt work at all',
        'not working properly',
        'very bad experience',
        'really hate this bug'
      ];
      
      phrasesComments.forEach(comment => {
        const result = analyzeSentiment(comment);
        expect(result.sentiment).toBe('negative');
        expect(result.negativeMatches).toBeGreaterThan(1); // Should get bonus for phrases
      });
    });

    it('should calculate confidence based on match count and score strength', () => {
      const weakPositive = 'good';
      const strongPositive = 'amazing excellent fantastic wonderful perfect';
      
      const weakResult = analyzeSentiment(weakPositive);
      const strongResult = analyzeSentiment(strongPositive);
      
      expect(strongResult.confidence).toBeGreaterThan(weakResult.confidence);
      expect(strongResult.positiveMatches).toBeGreaterThan(weakResult.positiveMatches);
    });

    it('should return confidence as a number between 0 and 1', () => {
      const testComments = [
        'This is amazing',
        'This is terrible',
        'This is okay',
        'Excellent fantastic wonderful amazing outstanding brilliant',
        'Terrible awful horrible disgusting worst failure'
      ];
      
      testComments.forEach(comment => {
        const result = analyzeSentiment(comment);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
        expect(Number.isFinite(result.confidence)).toBe(true);
      });
    });

    it('should handle very long comments', () => {
      const longComment = 'great '.repeat(100) + 'terrible '.repeat(50);
      const result = analyzeSentiment(longComment);
      
      expect(result.positiveMatches).toBeGreaterThan(result.negativeMatches);
      expect(result.sentiment).toBe('positive');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('classifySentiment', () => {
    it('should return only the sentiment classification', () => {
      const testCases: Array<[string, Sentiment]> = [
        ['This is amazing!', 'positive'],
        ['This is terrible!', 'negative'],
        ['This is a thing.', 'neutral'],
        ['', 'neutral']
      ];
      
      testCases.forEach(([comment, expectedSentiment]) => {
        const result = classifySentiment(comment);
        expect(result).toBe(expectedSentiment);
        expect(typeof result).toBe('string');
      });
    });

    it('should handle null and undefined inputs', () => {
      expect(classifySentiment(null)).toBe('neutral');
      expect(classifySentiment(undefined)).toBe('neutral');
    });
  });

  describe('real-world feedback examples', () => {
    it('should correctly classify typical positive feedback', () => {
      const positiveFeedback = [
        'Love the new design! Much cleaner and easier to use.',
        'Great improvement over the previous version. Keep it up!',
        'This feature saved me so much time. Thank you!',
        'Excellent customer service, very responsive and helpful.',
        'The app works perfectly on my device. Highly recommend!',
        'Simple, fast, and reliable. Exactly what I needed.'
      ];
      
      positiveFeedback.forEach(feedback => {
        expect(classifySentiment(feedback)).toBe('positive');
      });
    });

    it('should correctly classify typical negative feedback', () => {
      const negativeFeedback = [
        'The app crashes every time I try to save my work.',
        'Terrible user experience. Very confusing and slow.',
        'This update broke everything. Nothing works anymore.',
        'Waste of money. The features dont work as advertised.',
        'Poor customer support. No response to my complaints.',
        'Buggy and unreliable. I regret downloading this.'
      ];
      
      negativeFeedback.forEach(feedback => {
        expect(classifySentiment(feedback)).toBe('negative');
      });
    });

    it('should correctly classify neutral feedback', () => {
      const neutralFeedback = [
        'The app has a login screen and a dashboard.',
        'I used this to complete my task.',
        'The interface is blue and has several buttons.',
        'It connects to my account.',
        'There are three main sections in the app.',
        'The installation process took 5 minutes.'
      ];
      
      neutralFeedback.forEach(feedback => {
        expect(classifySentiment(feedback)).toBe('neutral');
      });
    });

    it('should handle constructive feedback appropriately', () => {
      const constructiveFeedback = [
        'Good concept but needs better error handling.',
        'I like the idea, however the execution could be improved.',
        'The feature works but could be faster.',
        'Nice design but some bugs need fixing.',
        'Useful tool with room for improvement.'
      ];
      
      // Constructive feedback might be neutral or slightly positive
      constructiveFeedback.forEach(feedback => {
        const sentiment = classifySentiment(feedback);
        expect(['neutral', 'positive']).toContain(sentiment);
      });
    });
  });
});