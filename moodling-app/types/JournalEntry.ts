/**
 * JournalEntry Type
 *
 * Core data model for journal entries.
 * All data stays on device (Moodling Ethics).
 *
 * Unit 2: Basic entry with text and timestamp
 * Unit 4 will add: sentimentScore, moodEmoji
 * Unit 5 will add: voiceTranscription, audioDuration
 */

export interface JournalEntry {
  /** Unique identifier (timestamp-based) */
  id: string;

  /** The journal entry text */
  text: string;

  /** When the entry was created (ISO string for storage) */
  createdAt: string;

  /** When the entry was last modified (ISO string) */
  updatedAt: string;
}

/**
 * Create a new JournalEntry with defaults
 */
export function createJournalEntry(text: string): JournalEntry {
  const now = new Date().toISOString();
  return {
    id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text: text.trim(),
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Parse a stored entry (handles date conversion)
 */
export function parseJournalEntry(stored: JournalEntry): JournalEntry {
  return {
    ...stored,
    // Ensure dates are valid ISO strings
    createdAt: stored.createdAt || new Date().toISOString(),
    updatedAt: stored.updatedAt || stored.createdAt || new Date().toISOString(),
  };
}
