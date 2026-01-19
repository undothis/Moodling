/**
 * Usage Tracking Service
 *
 * Tracks app usage patterns to support anti-dependency features.
 * Following Moodling Ethics:
 * - Design toward app obsolescence
 * - Celebrate breaks, not streaks
 * - Encourage self-sufficiency
 * - No guilt, no FOMO
 *
 * Unit 13: Anti-Dependency System
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  USAGE_LOG: 'moodling_usage_log',
  LAST_VISIT: 'moodling_last_visit',
};

export interface UsageStats {
  todayEntries: number;
  weekEntries: number;
  daysSinceLastVisit: number;
  totalDaysUsed: number;
  averageEntriesPerDay: number;
}

interface UsageLogEntry {
  date: string; // YYYY-MM-DD
  entryCount: number;
}

/**
 * Get today's date as YYYY-MM-DD string
 */
function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get date from N days ago
 */
function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Load usage log from storage
 */
async function getUsageLog(): Promise<UsageLogEntry[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USAGE_LOG);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load usage log:', error);
    return [];
  }
}

/**
 * Save usage log to storage
 */
async function saveUsageLog(log: UsageLogEntry[]): Promise<void> {
  try {
    // Keep only last 90 days of data
    const cutoff = getDateString(getDaysAgo(90));
    const trimmedLog = log.filter(entry => entry.date >= cutoff);
    await AsyncStorage.setItem(STORAGE_KEYS.USAGE_LOG, JSON.stringify(trimmedLog));
  } catch (error) {
    console.error('Failed to save usage log:', error);
  }
}

/**
 * Record that a journal entry was created
 */
export async function recordEntry(): Promise<void> {
  const today = getDateString();
  const log = await getUsageLog();

  const todayIndex = log.findIndex(entry => entry.date === today);
  if (todayIndex >= 0) {
    log[todayIndex].entryCount++;
  } else {
    log.push({ date: today, entryCount: 1 });
  }

  await saveUsageLog(log);
}

/**
 * Record a visit to the app (call on app open)
 */
export async function recordVisit(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_VISIT, getDateString());
  } catch (error) {
    console.error('Failed to record visit:', error);
  }
}

/**
 * Get the last visit date
 */
async function getLastVisit(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_VISIT);
  } catch (error) {
    console.error('Failed to get last visit:', error);
    return null;
  }
}

/**
 * Calculate usage statistics
 */
export async function getUsageStats(): Promise<UsageStats> {
  const log = await getUsageLog();
  const lastVisit = await getLastVisit();
  const today = getDateString();
  const weekAgo = getDateString(getDaysAgo(7));

  // Today's entries
  const todayEntry = log.find(entry => entry.date === today);
  const todayEntries = todayEntry?.entryCount ?? 0;

  // Week's entries
  const weekEntries = log
    .filter(entry => entry.date >= weekAgo)
    .reduce((sum, entry) => sum + entry.entryCount, 0);

  // Days since last visit
  let daysSinceLastVisit = 0;
  if (lastVisit && lastVisit !== today) {
    const lastDate = new Date(lastVisit);
    const todayDate = new Date(today);
    daysSinceLastVisit = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Total days used
  const uniqueDays = new Set(log.map(entry => entry.date));
  const totalDaysUsed = uniqueDays.size;

  // Average entries per day (on days used)
  const totalEntries = log.reduce((sum, entry) => sum + entry.entryCount, 0);
  const averageEntriesPerDay = totalDaysUsed > 0 ? totalEntries / totalDaysUsed : 0;

  // Record today's visit
  await recordVisit();

  return {
    todayEntries,
    weekEntries,
    daysSinceLastVisit,
    totalDaysUsed,
    averageEntriesPerDay,
  };
}

/**
 * Anti-dependency message types
 */
export type MessageType =
  | 'welcome_back'      // User took a healthy break
  | 'gentle_nudge'      // High usage today, gentle reminder
  | 'celebrate_break'   // Acknowledge time away positively
  | 'self_sufficient'   // User is developing good habits
  | 'none';             // No special message needed

export interface AntiDependencyMessage {
  type: MessageType;
  title: string;
  body: string;
  show: boolean;
}

/**
 * Get an anti-dependency message based on usage patterns
 * Returns encouraging messages that promote self-sufficiency
 */
export async function getAntiDependencyMessage(): Promise<AntiDependencyMessage> {
  const stats = await getUsageStats();

  // Welcome back after 3+ days away (celebrate the break!)
  if (stats.daysSinceLastVisit >= 3) {
    return {
      type: 'welcome_back',
      title: 'Welcome back! 🌱',
      body: `You took ${stats.daysSinceLastVisit} days for yourself. That's healthy! You don't need an app to know how you feel.`,
      show: true,
    };
  }

  // Welcome back after 1-2 days (gentle acknowledgment)
  if (stats.daysSinceLastVisit >= 1) {
    return {
      type: 'celebrate_break',
      title: 'Good to see you',
      body: 'Taking breaks is part of the practice. How are you today?',
      show: true,
    };
  }

  // High usage today (5+ entries) - gentle nudge toward self-trust
  if (stats.todayEntries >= 5) {
    return {
      type: 'gentle_nudge',
      title: 'You\'re doing great',
      body: 'You\'ve checked in several times today. Remember: you already know how you feel. Trust yourself.',
      show: true,
    };
  }

  // Consistent user developing good habits
  if (stats.totalDaysUsed >= 14 && stats.averageEntriesPerDay <= 2) {
    return {
      type: 'self_sufficient',
      title: 'Building awareness',
      body: 'You\'re developing a healthy practice. The goal is to need this less over time.',
      show: Math.random() < 0.2, // Only show occasionally (20% chance)
    };
  }

  // No special message needed
  return {
    type: 'none',
    title: '',
    body: '',
    show: false,
  };
}

/**
 * Check if user should be encouraged to take a break
 * Returns true if usage seems high
 */
export function shouldSuggestBreak(stats: UsageStats): boolean {
  // Suggest break if:
  // - 5+ entries today, OR
  // - 20+ entries this week, OR
  // - Using multiple times daily for extended period
  return (
    stats.todayEntries >= 5 ||
    stats.weekEntries >= 20 ||
    (stats.totalDaysUsed >= 7 && stats.averageEntriesPerDay > 3)
  );
}

/**
 * Get a "you don't need me" message
 * These affirm user's self-knowledge and discourage over-reliance
 */
export function getAffirmationMessage(): string {
  const messages = [
    'You know yourself better than any app.',
    'Your feelings are valid, with or without recording them.',
    'Taking a break from journaling is healthy too.',
    'Trust your instincts. You\'ve got this.',
    'The goal is to need this app less, not more.',
    'You\'re the expert on your own experience.',
    'Some feelings don\'t need to be analyzed.',
    'It\'s okay to just feel without documenting.',
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}
