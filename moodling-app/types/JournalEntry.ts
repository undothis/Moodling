/**
 * JournalEntry Type
 *
 * Core data model for journal entries.
 * All data stays on device (Moodling Ethics).
 *
 * Unit 2: Basic entry with text and timestamp
 * Unit 4: Sentiment analysis (score, mood, emoji)
 * Unit 5 will add: voiceTranscription, audioDuration
 */

import { MoodCategory } from '@/services/sentimentAnalysis';

export interface JournalEntry {
  /** Unique identifier (timestamp-based) */
  id: string;

  /** The journal entry text */
  text: string;

  /** When the entry was created (ISO string for storage) */
  createdAt: string;

  /** When the entry was last modified (ISO string) */
  updatedAt: string;

  /** Sentiment analysis results (Unit 4) */
  sentiment?: {
    /** Normalized score from -1 to +1 */
    score: number;
    /** Mood category */
    mood: MoodCategory;
    /** Emoji representation */
    emoji: string;
  };
}

/**
 * Create a new JournalEntry with defaults
 */
export function createJournalEntry(
  text: string,
  sentiment?: JournalEntry['sentiment']
): JournalEntry {
  const now = new Date().toISOString();
  return {
    id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text: text.trim(),
    createdAt: now,
    updatedAt: now,
    sentiment,
  };
}

/**
 * Parse a stored entry (handles date conversion and missing fields)
 */
export function parseJournalEntry(stored: JournalEntry): JournalEntry {
  return {
    ...stored,
    // Ensure dates are valid ISO strings
    createdAt: stored.createdAt || new Date().toISOString(),
    updatedAt: stored.updatedAt || stored.createdAt || new Date().toISOString(),
    // Keep sentiment if present
    sentiment: stored.sentiment,
  };
}
