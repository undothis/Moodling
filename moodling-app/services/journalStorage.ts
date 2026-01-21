/**
 * Journal Storage Service
 *
 * Handles persistent storage of journal entries.
 * All data stays on device (Mood Leaf Ethics).
 *
 * Uses AsyncStorage for cross-platform compatibility:
 * - Works on iOS, Android, and Web
 * - Simple key-value storage
 * - Data persists across app restarts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalEntry, parseJournalEntry } from '@/types/JournalEntry';

const STORAGE_KEY = '@moodling/journal_entries';

/**
 * Save a new entry to storage
 */
export async function saveEntry(entry: JournalEntry): Promise<void> {
  try {
    const entries = await getAllEntries();
    const updatedEntries = [entry, ...entries]; // Newest first
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
  } catch (error) {
    // Errors are sacred - log and rethrow
    console.error('[journalStorage] Failed to save entry:', error);
    throw new Error('Failed to save journal entry');
  }
}

/**
 * Get all entries from storage
 */
export async function getAllEntries(): Promise<JournalEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored) as JournalEntry[];
    return parsed.map(parseJournalEntry);
  } catch (error) {
    // Errors are sacred - log and return empty (don't crash)
    console.error('[journalStorage] Failed to load entries:', error);
    return [];
  }
}

/**
 * Get a single entry by ID
 */
export async function getEntryById(id: string): Promise<JournalEntry | null> {
  try {
    const entries = await getAllEntries();
    return entries.find((e) => e.id === id) || null;
  } catch (error) {
    console.error('[journalStorage] Failed to get entry:', error);
    return null;
  }
}

/**
 * Update an existing entry
 */
export async function updateEntry(
  id: string,
  updates: Partial<Pick<JournalEntry, 'text'>>
): Promise<void> {
  try {
    const entries = await getAllEntries();
    const index = entries.findIndex((e) => e.id === id);

    if (index === -1) {
      throw new Error('Entry not found');
    }

    entries[index] = {
      ...entries[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('[journalStorage] Failed to update entry:', error);
    throw new Error('Failed to update journal entry');
  }
}

/**
 * Delete an entry by ID
 */
export async function deleteEntry(id: string): Promise<void> {
  try {
    const entries = await getAllEntries();
    const filtered = entries.filter((e) => e.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[journalStorage] Failed to delete entry:', error);
    throw new Error('Failed to delete journal entry');
  }
}

/**
 * Get entry count (useful for insights)
 */
export async function getEntryCount(): Promise<number> {
  const entries = await getAllEntries();
  return entries.length;
}

/**
 * Clear all entries (for testing/debug only)
 */
export async function clearAllEntries(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[journalStorage] Failed to clear entries:', error);
    throw new Error('Failed to clear journal entries');
  }
}

/**
 * Get recent journal entries for Claude context
 * This allows Claude to reference what the user actually wrote (with limits for privacy)
 */
export async function getRecentJournalContextForClaude(): Promise<string> {
  try {
    const entries = await getAllEntries();
    if (entries.length === 0) return '';

    const parts: string[] = ['RECENT JOURNAL ENTRIES (what user actually wrote):'];

    // Get entries from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEntries = entries.filter(
      e => new Date(e.createdAt) >= sevenDaysAgo
    );

    if (recentEntries.length === 0) {
      // Show last 3 entries if none in past week
      const lastEntries = entries.slice(0, 3);
      parts.push('\n  (No entries in past week. Showing most recent:)');

      for (const entry of lastEntries) {
        const date = new Date(entry.createdAt);
        const dateStr = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
        const mood = entry.sentiment?.mood || 'unknown';
        // Truncate long entries
        const text = entry.text.length > 300
          ? entry.text.substring(0, 300) + '...'
          : entry.text;
        parts.push(`\n  [${dateStr}] (${mood}):`);
        parts.push(`    "${text}"`);
      }
    } else {
      // Show recent entries (limit to 10 for context size)
      for (const entry of recentEntries.slice(0, 10)) {
        const date = new Date(entry.createdAt);
        const dateStr = date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        const timeStr = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        });
        const mood = entry.sentiment?.mood || 'unknown';
        // Truncate long entries
        const text = entry.text.length > 300
          ? entry.text.substring(0, 300) + '...'
          : entry.text;
        parts.push(`\n  [${dateStr} ${timeStr}] (${mood}):`);
        parts.push(`    "${text}"`);
      }

      // Add summary stats
      const moodCounts: Record<string, number> = {};
      for (const entry of recentEntries) {
        const mood = entry.sentiment?.mood || 'unknown';
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      }
      const moodSummary = Object.entries(moodCounts)
        .map(([mood, count]) => `${mood}: ${count}`)
        .join(', ');

      parts.push(`\n  Week summary: ${recentEntries.length} entries (${moodSummary})`);
    }

    // Add total count
    parts.push(`  Total journal entries all time: ${entries.length}`);

    // Add journaling streak info
    // Helper to get local date as YYYY-MM-DD (avoids UTC timezone issues)
    const getLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const now = new Date();
    const today = getLocalDate(now);
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = getLocalDate(yesterdayDate);
    const hasToday = entries.some(e => e.createdAt.startsWith(today));
    const hasYesterday = entries.some(e => e.createdAt.startsWith(yesterday));

    let streak = 0;
    const checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = getLocalDate(checkDate);
      const hasEntry = entries.some(e => e.createdAt.startsWith(dateStr));
      if (hasEntry) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // Skip today if no entry yet
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    if (streak > 0) {
      parts.push(`  Current journaling streak: ${streak} day${streak !== 1 ? 's' : ''}`);
    }

    return parts.join('\n');
  } catch (error) {
    console.error('[journalStorage] Failed to build Claude context:', error);
    return '';
  }
}
