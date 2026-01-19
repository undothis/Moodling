/**
 * Sentiment Analysis Service
 *
 * Analyzes journal entry text to determine emotional tone.
 * All processing happens on-device (Moodling Ethics).
 *
 * Uses AFINN-based sentiment analysis:
 * - Words are scored from -5 (very negative) to +5 (very positive)
 * - Overall score is normalized to a -1 to +1 scale
 *
 * Following Moodling Ethics:
 * - Descriptive, NOT diagnostic
 * - "You might notice..." not "You are..."
 * - User knows themselves best
 */

import Sentiment from 'sentiment';

const analyzer = new Sentiment();

export interface SentimentResult {
  /** Raw score (can be any number) */
  score: number;

  /** Normalized score from -1 (very negative) to +1 (very positive) */
  normalizedScore: number;

  /** Comparative score (score per word) */
  comparative: number;

  /** Mood category */
  mood: MoodCategory;

  /** Emoji representation */
  emoji: string;

  /** Human-readable description (tentative language) */
  description: string;

  /** Positive words found */
  positiveWords: string[];

  /** Negative words found */
  negativeWords: string[];
}

export type MoodCategory =
  | 'very_positive'
  | 'positive'
  | 'slightly_positive'
  | 'neutral'
  | 'slightly_negative'
  | 'negative'
  | 'very_negative';

/**
 * Mood emoji mapping
 * Using subtle emojis that don't feel clinical or judgmental
 */
const MOOD_EMOJIS: Record<MoodCategory, string> = {
  very_positive: '😊',
  positive: '🙂',
  slightly_positive: '🌤️',
  neutral: '😐',
  slightly_negative: '🌧️',
  negative: '😔',
  very_negative: '😢', // Clearly expresses sadness without being clinical
};

/**
 * Mood descriptions using tentative, non-diagnostic language
 * Following Moodling Ethics: "you might notice" not "you are"
 */
const MOOD_DESCRIPTIONS: Record<MoodCategory, string> = {
  very_positive: 'This entry seems to reflect a bright moment',
  positive: 'There seems to be some warmth here',
  slightly_positive: 'A hint of lightness in this entry',
  neutral: 'A grounded, observational entry',
  slightly_negative: 'Some heaviness might be present',
  negative: 'This seems like it was a harder moment',
  very_negative: 'This entry reflects a difficult time',
};

/**
 * Analyze the sentiment of journal entry text
 */
export function analyzeSentiment(text: string): SentimentResult {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      normalizedScore: 0,
      comparative: 0,
      mood: 'neutral',
      emoji: MOOD_EMOJIS.neutral,
      description: MOOD_DESCRIPTIONS.neutral,
      positiveWords: [],
      negativeWords: [],
    };
  }

  const result = analyzer.analyze(text);

  // Normalize score to -1 to +1 range
  // Using comparative score (per-word average) for more consistent results
  // Multiplier of 0.8 provides better calibration:
  // - "tired and stressed" → slightly_negative or negative
  // - "I feel horrible" → negative or very_negative
  const normalizedScore = Math.max(-1, Math.min(1, result.comparative * 0.8));

  // Determine mood category based on normalized score
  const mood = getMoodCategory(normalizedScore);

  return {
    score: result.score,
    normalizedScore,
    comparative: result.comparative,
    mood,
    emoji: MOOD_EMOJIS[mood],
    description: MOOD_DESCRIPTIONS[mood],
    positiveWords: result.positive,
    negativeWords: result.negative,
  };
}

/**
 * Get mood category from normalized score
 *
 * Thresholds calibrated for typical journal entries:
 * - Short phrases with one or two negative words → slightly_negative or negative
 * - Very strong language or multiple intense words → very_negative
 */
function getMoodCategory(normalizedScore: number): MoodCategory {
  if (normalizedScore >= 0.4) return 'very_positive';
  if (normalizedScore >= 0.2) return 'positive';
  if (normalizedScore >= 0.05) return 'slightly_positive';
  if (normalizedScore >= -0.05) return 'neutral';
  if (normalizedScore >= -0.25) return 'slightly_negative';
  if (normalizedScore >= -0.6) return 'negative';
  return 'very_negative';
}

/**
 * Get just the emoji for a piece of text (convenience function)
 */
export function getEmoji(text: string): string {
  return analyzeSentiment(text).emoji;
}

/**
 * Get mood category for a piece of text (convenience function)
 */
export function getMood(text: string): MoodCategory {
  return analyzeSentiment(text).mood;
}
