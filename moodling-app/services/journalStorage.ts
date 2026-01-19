/**
 * Journal Storage Service
 *
 * Handles persistent storage of journal entries.
 * All data stays on device (Moodling Ethics).
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
