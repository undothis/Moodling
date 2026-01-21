/**
 * Quick Logs Service
 *
 * Customizable tracking buttons for habits, goals, meds, moods, or anything.
 * Users create their own buttons and tap to log throughout the day.
 *
 * Use cases:
 * - Habit tracking ("Took meds", "Walked", "Meditated")
 * - Habit breaking ("Didn't smoke", "No alcohol", "Stayed off social media")
 * - Goal tracking ("Called mom", "Applied for job", "Worked on project")
 * - Mood/symptom logging ("Anxious", "Headache", "Good energy")
 * - Anything custom ("Fed cat", "Watered plants", "Drank water")
 *
 * Integrates with:
 * - Notifications (adaptive reminders)
 * - Correlations (mood + quick logs)
 * - The Sprout (context for conversations)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const QUICK_LOGS_KEY = 'moodleaf_quick_logs';
const LOG_ENTRIES_KEY = 'moodleaf_log_entries';
const LOG_STREAKS_KEY = 'moodleaf_log_streaks';

/**
 * Types of quick logs
 */
export type QuickLogType =
  | 'habit_build'    // Building a habit (want MORE of this)
  | 'habit_break'    // Breaking a habit (want LESS of this)
  | 'goal'           // One-time or milestone goal
  | 'symptom'        // Tracking a symptom or feeling
  | 'medication'     // Med tracking
  | 'custom';        // Anything else

/**
 * Frequency for habit tracking
 */
export type LogFrequency =
  | 'daily'          // Once per day
  | 'multiple_daily' // Multiple times per day
  | 'weekly'         // X times per week
  | 'as_needed';     // No schedule, just track when it happens

/**
 * A user-defined quick log button
 */
export interface QuickLog {
  id: string;
  name: string;                    // "Took meds", "Walked", etc.
  emoji: string;                   // Visual icon
  type: QuickLogType;
  frequency: LogFrequency;
  targetPerDay?: number;           // For multiple_daily
  targetPerWeek?: number;          // For weekly
  color?: string;                  // Custom color
  reminderEnabled: boolean;
  reminderTimes?: string[];        // ["09:00", "21:00"]
  createdAt: string;
  isActive: boolean;
  position: number;                // Order in the UI
  // For habit breaking
  invertedTracking?: boolean;      // true = success is NOT doing it
  // For goals
  targetDate?: string;             // Deadline
  completed?: boolean;
}

/**
 * A single log entry (when user taps the button)
 */
export interface LogEntry {
  id: string;
  logId: string;                   // Which QuickLog this belongs to
  timestamp: string;               // When they tapped
  note?: string;                   // Optional note
  value?: number;                  // Optional value (e.g., "3 glasses of water")
  mood?: string;                   // Mood at time of logging
  location?: {                     // Optional location context
    lat: number;
    lng: number;
  };
}

/**
 * Streak tracking for a log
 */
export interface LogStreak {
  logId: string;
  currentStreak: number;           // Current consecutive days
  longestStreak: number;           // Best ever
  lastLogDate: string;             // Last date logged
  totalLogs: number;               // All-time count
  weeklyAverage: number;           // Rolling 4-week average
}

/**
 * Daily summary for a log
 */
export interface DailySummary {
  date: string;
  logId: string;
  count: number;
  notes: string[];
  values: number[];
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get today's date as YYYY-MM-DD in LOCAL timezone
 * Note: Using local components instead of toISOString() to avoid timezone bugs
 * where late evening users would see "tomorrow" due to UTC conversion.
 */
function getToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date N days ago as YYYY-MM-DD in LOCAL timezone
 */
function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================
// QUICK LOG MANAGEMENT
// ============================================

/**
 * Get all quick logs
 */
export async function getQuickLogs(): Promise<QuickLog[]> {
  try {
    const data = await AsyncStorage.getItem(QUICK_LOGS_KEY);
    const logs: QuickLog[] = data ? JSON.parse(data) : [];
    return logs.filter(l => l.isActive).sort((a, b) => a.position - b.position);
  } catch (error) {
    console.error('Failed to get quick logs:', error);
    return [];
  }
}

/**
 * Get all quick logs including inactive
 */
export async function getAllQuickLogs(): Promise<QuickLog[]> {
  try {
    const data = await AsyncStorage.getItem(QUICK_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get all quick logs:', error);
    return [];
  }
}

/**
 * Create a new quick log
 */
export async function createQuickLog(
  name: string,
  emoji: string,
  type: QuickLogType,
  options?: Partial<QuickLog>
): Promise<QuickLog> {
  const logs = await getAllQuickLogs();

  const newLog: QuickLog = {
    id: generateId(),
    name,
    emoji,
    type,
    frequency: options?.frequency ?? 'daily',
    targetPerDay: options?.targetPerDay,
    targetPerWeek: options?.targetPerWeek,
    color: options?.color,
    reminderEnabled: options?.reminderEnabled ?? false,
    reminderTimes: options?.reminderTimes,
    createdAt: new Date().toISOString(),
    isActive: true,
    position: logs.length,
    invertedTracking: options?.invertedTracking,
    targetDate: options?.targetDate,
    completed: false,
  };

  logs.push(newLog);
  await AsyncStorage.setItem(QUICK_LOGS_KEY, JSON.stringify(logs));

  // Initialize streak
  await initializeStreak(newLog.id);

  return newLog;
}

/**
 * Update a quick log
 */
export async function updateQuickLog(id: string, updates: Partial<QuickLog>): Promise<QuickLog | null> {
  const logs = await getAllQuickLogs();
  const index = logs.findIndex(l => l.id === id);

  if (index === -1) return null;

  logs[index] = { ...logs[index], ...updates };
  await AsyncStorage.setItem(QUICK_LOGS_KEY, JSON.stringify(logs));

  return logs[index];
}

/**
 * Delete a quick log (soft delete - marks inactive)
 */
export async function deleteQuickLog(id: string): Promise<void> {
  await updateQuickLog(id, { isActive: false });
}

/**
 * Permanently delete a quick log and all its entries
 */
export async function permanentlyDeleteQuickLog(id: string): Promise<void> {
  const logs = await getAllQuickLogs();
  const filtered = logs.filter(l => l.id !== id);
  await AsyncStorage.setItem(QUICK_LOGS_KEY, JSON.stringify(filtered));

  // Also delete entries
  const entries = await getAllLogEntries();
  const filteredEntries = entries.filter(e => e.logId !== id);
  await AsyncStorage.setItem(LOG_ENTRIES_KEY, JSON.stringify(filteredEntries));

  // Delete streak
  const streaks = await getAllStreaks();
  const filteredStreaks = streaks.filter(s => s.logId !== id);
  await AsyncStorage.setItem(LOG_STREAKS_KEY, JSON.stringify(filteredStreaks));
}

/**
 * Reorder quick logs
 */
export async function reorderQuickLogs(orderedIds: string[]): Promise<void> {
  const logs = await getAllQuickLogs();

  for (let i = 0; i < orderedIds.length; i++) {
    const log = logs.find(l => l.id === orderedIds[i]);
    if (log) {
      log.position = i;
    }
  }

  await AsyncStorage.setItem(QUICK_LOGS_KEY, JSON.stringify(logs));
}

// ============================================
// LOG ENTRIES
// ============================================

/**
 * Get all log entries
 */
async function getAllLogEntries(): Promise<LogEntry[]> {
  try {
    const data = await AsyncStorage.getItem(LOG_ENTRIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get log entries:', error);
    return [];
  }
}

/**
 * Log an entry (user tapped the button)
 */
export async function logEntry(
  logId: string,
  options?: { note?: string; value?: number; mood?: string }
): Promise<LogEntry> {
  const entries = await getAllLogEntries();

  const entry: LogEntry = {
    id: generateId(),
    logId,
    timestamp: new Date().toISOString(),
    note: options?.note,
    value: options?.value,
    mood: options?.mood,
  };

  entries.push(entry);

  // Keep last 365 days of entries
  const oneYearAgo = getDaysAgo(365);
  const filtered = entries.filter(e => e.timestamp.split('T')[0] >= oneYearAgo);

  await AsyncStorage.setItem(LOG_ENTRIES_KEY, JSON.stringify(filtered));

  // Update streak
  await updateStreak(logId);

  return entry;
}

/**
 * Remove the last entry for a log (undo)
 */
export async function undoLastEntry(logId: string): Promise<boolean> {
  const entries = await getAllLogEntries();

  // Find the most recent entry for this log
  const logEntries = entries.filter(e => e.logId === logId);
  if (logEntries.length === 0) return false;

  const lastEntry = logEntries.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];

  // Remove it
  const filtered = entries.filter(e => e.id !== lastEntry.id);
  await AsyncStorage.setItem(LOG_ENTRIES_KEY, JSON.stringify(filtered));

  // Recalculate streak
  await recalculateStreak(logId);

  return true;
}

/**
 * Get entries for a specific log
 */
export async function getEntriesForLog(logId: string, days?: number): Promise<LogEntry[]> {
  const entries = await getAllLogEntries();
  let filtered = entries.filter(e => e.logId === logId);

  if (days) {
    const cutoff = getDaysAgo(days);
    filtered = filtered.filter(e => e.timestamp.split('T')[0] >= cutoff);
  }

  return filtered.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Get today's entries for a log
 */
export async function getTodayEntries(logId: string): Promise<LogEntry[]> {
  const entries = await getAllLogEntries();
  const today = getToday();
  return entries.filter(e => e.logId === logId && e.timestamp.startsWith(today));
}

/**
 * Get today's count for a log
 */
export async function getTodayCount(logId: string): Promise<number> {
  const entries = await getTodayEntries(logId);
  return entries.length;
}

/**
 * Check if log was completed today (based on frequency settings)
 */
export async function isCompletedToday(logId: string): Promise<boolean> {
  const logs = await getAllQuickLogs();
  const log = logs.find(l => l.id === logId);
  if (!log) return false;

  const todayCount = await getTodayCount(logId);

  switch (log.frequency) {
    case 'daily':
      return todayCount >= 1;
    case 'multiple_daily':
      return todayCount >= (log.targetPerDay ?? 1);
    case 'as_needed':
      return todayCount >= 1; // Just needs one
    case 'weekly':
      // Check if weekly target is met
      const weekEntries = await getEntriesForLog(logId, 7);
      return weekEntries.length >= (log.targetPerWeek ?? 1);
    default:
      return todayCount >= 1;
  }
}

// ============================================
// STREAKS
// ============================================

/**
 * Get all streaks
 */
async function getAllStreaks(): Promise<LogStreak[]> {
  try {
    const data = await AsyncStorage.getItem(LOG_STREAKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Initialize streak for a new log
 */
async function initializeStreak(logId: string): Promise<void> {
  const streaks = await getAllStreaks();

  if (streaks.some(s => s.logId === logId)) return;

  streaks.push({
    logId,
    currentStreak: 0,
    longestStreak: 0,
    lastLogDate: '',
    totalLogs: 0,
    weeklyAverage: 0,
  });

  await AsyncStorage.setItem(LOG_STREAKS_KEY, JSON.stringify(streaks));
}

/**
 * Update streak after logging
 */
async function updateStreak(logId: string): Promise<void> {
  const streaks = await getAllStreaks();
  const streak = streaks.find(s => s.logId === logId);

  if (!streak) {
    await initializeStreak(logId);
    return updateStreak(logId);
  }

  const today = getToday();
  const yesterday = getDaysAgo(1);

  streak.totalLogs++;

  if (streak.lastLogDate === today) {
    // Already logged today, just increment total
    // Streak stays same
  } else if (streak.lastLogDate === yesterday || streak.lastLogDate === '') {
    // Continuing streak
    streak.currentStreak++;
    streak.lastLogDate = today;
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }
  } else {
    // Streak broken, start new one
    streak.currentStreak = 1;
    streak.lastLogDate = today;
  }

  // Calculate weekly average
  const entries = await getEntriesForLog(logId, 28);
  streak.weeklyAverage = Math.round((entries.length / 4) * 10) / 10;

  await AsyncStorage.setItem(LOG_STREAKS_KEY, JSON.stringify(streaks));
}

/**
 * Recalculate streak from scratch
 */
async function recalculateStreak(logId: string): Promise<void> {
  const entries = await getEntriesForLog(logId);
  const streaks = await getAllStreaks();
  let streak = streaks.find(s => s.logId === logId);

  if (!streak) {
    await initializeStreak(logId);
    const newStreaks = await getAllStreaks();
    streak = newStreaks.find(s => s.logId === logId)!;
  }

  // Get unique dates
  const dates = [...new Set(entries.map(e => e.timestamp.split('T')[0]))].sort().reverse();

  streak.totalLogs = entries.length;
  streak.lastLogDate = dates[0] || '';

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = getToday();

  for (let i = 0; i < 365; i++) {
    if (dates.includes(checkDate)) {
      currentStreak++;
      checkDate = getDaysAgo(i + 1);
    } else if (i === 0) {
      // Didn't log today, check yesterday
      checkDate = getDaysAgo(1);
    } else {
      break;
    }
  }

  streak.currentStreak = currentStreak;

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate = '';

  // Helper to get local date as YYYY-MM-DD
  const getLocalDateStr = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  for (const date of dates.sort()) {
    if (lastDate === '') {
      tempStreak = 1;
    } else {
      const expected = new Date(lastDate);
      expected.setDate(expected.getDate() + 1);
      if (date === getLocalDateStr(expected)) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    lastDate = date;
  }

  streak.longestStreak = Math.max(longestStreak, streak.longestStreak);

  // Weekly average
  const recentEntries = await getEntriesForLog(logId, 28);
  streak.weeklyAverage = Math.round((recentEntries.length / 4) * 10) / 10;

  await AsyncStorage.setItem(LOG_STREAKS_KEY, JSON.stringify(streaks));
}

/**
 * Get streak for a log
 */
export async function getStreak(logId: string): Promise<LogStreak | null> {
  const streaks = await getAllStreaks();
  return streaks.find(s => s.logId === logId) || null;
}

// ============================================
// SUMMARIES & ANALYTICS
// ============================================

/**
 * Get daily summary for a log
 */
export async function getDailySummary(logId: string, date: string): Promise<DailySummary> {
  const entries = await getAllLogEntries();
  const dayEntries = entries.filter(e =>
    e.logId === logId && e.timestamp.startsWith(date)
  );

  return {
    date,
    logId,
    count: dayEntries.length,
    notes: dayEntries.map(e => e.note).filter(Boolean) as string[],
    values: dayEntries.map(e => e.value).filter(v => v !== undefined) as number[],
  };
}

/**
 * Get weekly summary for all logs
 */
export async function getWeeklySummary(): Promise<Record<string, number[]>> {
  const logs = await getQuickLogs();
  const entries = await getAllLogEntries();
  const result: Record<string, number[]> = {};

  for (const log of logs) {
    result[log.id] = [];
    for (let i = 6; i >= 0; i--) {
      const date = getDaysAgo(i);
      const count = entries.filter(e =>
        e.logId === log.id && e.timestamp.startsWith(date)
      ).length;
      result[log.id].push(count);
    }
  }

  return result;
}

/**
 * Get all logs with today's status
 */
export async function getLogsWithStatus(): Promise<Array<QuickLog & {
  todayCount: number;
  isCompleted: boolean;
  streak: LogStreak | null;
}>> {
  const logs = await getQuickLogs();
  const result = [];

  for (const log of logs) {
    const todayCount = await getTodayCount(log.id);
    const isCompleted = await isCompletedToday(log.id);
    const streak = await getStreak(log.id);

    result.push({
      ...log,
      todayCount,
      isCompleted,
      streak,
    });
  }

  return result;
}

// ============================================
// CORRELATION DATA
// ============================================

/**
 * Get log data for correlation with mood
 * Used by healthInsightService
 */
export async function getLogsForCorrelation(date: string): Promise<Record<string, number>> {
  const logs = await getQuickLogs();
  const entries = await getAllLogEntries();
  const result: Record<string, number> = {};

  for (const log of logs) {
    const dayEntries = entries.filter(e =>
      e.logId === log.id && e.timestamp.startsWith(date)
    );
    result[log.name] = dayEntries.length;
  }

  return result;
}

/**
 * Format logs for Claude context
 */
export async function getLogsContextForClaude(): Promise<string> {
  const logs = await getQuickLogs();
  if (logs.length === 0) return '';

  const parts: string[] = ['QUICK LOGS (user-defined tracking):'];

  for (const log of logs.slice(0, 10)) { // Top 10
    const streak = await getStreak(log.id);
    const todayCount = await getTodayCount(log.id);

    let status = '';
    if (log.type === 'habit_build') {
      status = streak && streak.currentStreak > 0
        ? `${streak.currentStreak} day streak`
        : 'building habit';
    } else if (log.type === 'habit_break') {
      status = streak && streak.currentStreak > 0
        ? `${streak.currentStreak} days strong`
        : 'working on it';
    } else if (log.type === 'medication') {
      status = todayCount > 0 ? 'taken today' : 'not yet today';
    } else {
      status = `${streak?.totalLogs || 0} total`;
    }

    parts.push(`  ${log.emoji} ${log.name}: ${status}`);
  }

  return parts.join('\n');
}

/**
 * Get detailed logs data for Claude - includes full counts and history
 * This enables Claude to answer questions like "how many times did I exercise?"
 */
export async function getDetailedLogsContextForClaude(): Promise<string> {
  const logs = await getQuickLogs();
  if (logs.length === 0) return '';

  const parts: string[] = ['DETAILED TRACKING DATA (Twigs - raw atomic facts):'];

  for (const log of logs) {
    const streak = await getStreak(log.id);
    const todayCount = await getTodayCount(log.id);
    const weekEntries = await getEntriesForLog(log.id, 7);
    const monthEntries = await getEntriesForLog(log.id, 30);
    const allEntries = await getEntriesForLog(log.id);

    // Get daily breakdown for the week
    const dailyBreakdown: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = getDaysAgo(i);
      const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : date;
      const dayEntries = weekEntries.filter(e => e.timestamp.startsWith(date));
      if (dayEntries.length > 0) {
        dailyBreakdown.push(`${dayLabel}: ${dayEntries.length}`);
      }
    }

    // Build comprehensive status
    parts.push(`\n  ${log.emoji} ${log.name} (${log.type}):`);
    parts.push(`    - Today: ${todayCount} time${todayCount !== 1 ? 's' : ''}`);
    parts.push(`    - This week: ${weekEntries.length} time${weekEntries.length !== 1 ? 's' : ''}`);
    parts.push(`    - This month (30 days): ${monthEntries.length} time${monthEntries.length !== 1 ? 's' : ''}`);
    parts.push(`    - All time total: ${allEntries.length} time${allEntries.length !== 1 ? 's' : ''}`);

    if (streak) {
      parts.push(`    - Current streak: ${streak.currentStreak} day${streak.currentStreak !== 1 ? 's' : ''}`);
      parts.push(`    - Longest streak: ${streak.longestStreak} day${streak.longestStreak !== 1 ? 's' : ''}`);
      parts.push(`    - Weekly average: ${streak.weeklyAverage} per week`);
    }

    if (dailyBreakdown.length > 0) {
      parts.push(`    - Recent breakdown: ${dailyBreakdown.join(', ')}`);
    }

    // Include recent notes if any
    const recentWithNotes = weekEntries.filter(e => e.note).slice(0, 3);
    if (recentWithNotes.length > 0) {
      parts.push(`    - Recent notes: ${recentWithNotes.map(e => `"${e.note}"`).join(', ')}`);
    }

    // First and last logged date
    if (allEntries.length > 0) {
      const firstEntry = allEntries[allEntries.length - 1];
      const lastEntry = allEntries[0];
      parts.push(`    - First logged: ${firstEntry.timestamp.split('T')[0]}`);
      parts.push(`    - Last logged: ${lastEntry.timestamp.split('T')[0]}`);
    }
  }

  return parts.join('\n');
}

// ============================================
// PRESET TEMPLATES
// ============================================

/**
 * Preset log templates for quick setup
 */
export const LOG_PRESETS: Array<{
  name: string;
  emoji: string;
  type: QuickLogType;
  frequency: LogFrequency;
  category: string;
}> = [
  // Medications
  { name: 'Morning meds', emoji: '💊', type: 'medication', frequency: 'daily', category: 'Health' },
  { name: 'Evening meds', emoji: '💊', type: 'medication', frequency: 'daily', category: 'Health' },

  // Habits to build
  { name: 'Meditated', emoji: '🧘', type: 'habit_build', frequency: 'daily', category: 'Wellness' },
  { name: 'Exercised', emoji: '🏃', type: 'habit_build', frequency: 'daily', category: 'Wellness' },
  { name: 'Walked', emoji: '🚶', type: 'habit_build', frequency: 'daily', category: 'Wellness' },
  { name: 'Drank water', emoji: '💧', type: 'habit_build', frequency: 'multiple_daily', category: 'Health' },
  { name: 'Read', emoji: '📚', type: 'habit_build', frequency: 'daily', category: 'Growth' },
  { name: 'Journaled', emoji: '📝', type: 'habit_build', frequency: 'daily', category: 'Wellness' },
  { name: 'Stretched', emoji: '🙆', type: 'habit_build', frequency: 'daily', category: 'Wellness' },
  { name: 'Got outside', emoji: '🌳', type: 'habit_build', frequency: 'daily', category: 'Wellness' },
  { name: 'Ate breakfast', emoji: '🍳', type: 'habit_build', frequency: 'daily', category: 'Health' },
  { name: 'Called someone', emoji: '📞', type: 'habit_build', frequency: 'weekly', category: 'Connection' },

  // Habits to break
  { name: 'No smoking', emoji: '🚭', type: 'habit_break', frequency: 'daily', category: 'Health' },
  { name: 'No alcohol', emoji: '🚫', type: 'habit_break', frequency: 'daily', category: 'Health' },
  { name: 'No social media', emoji: '📵', type: 'habit_break', frequency: 'daily', category: 'Focus' },
  { name: 'No junk food', emoji: '🥗', type: 'habit_break', frequency: 'daily', category: 'Health' },
  { name: 'No caffeine', emoji: '☕', type: 'habit_break', frequency: 'daily', category: 'Health' },

  // Symptoms/Feelings - Mental health safe: no sad face emojis
  // Using neutral symbols that don't reinforce negative feelings
  { name: 'Anxious moment', emoji: '🌊', type: 'symptom', frequency: 'as_needed', category: 'Tracking' },
  { name: 'Heavy day', emoji: '☁️', type: 'symptom', frequency: 'as_needed', category: 'Tracking' },
  { name: 'Good energy', emoji: '⚡', type: 'symptom', frequency: 'as_needed', category: 'Tracking' },
  { name: 'Headache', emoji: '🌡️', type: 'symptom', frequency: 'as_needed', category: 'Health' },
  { name: 'Slept well', emoji: '😴', type: 'symptom', frequency: 'daily', category: 'Health' },
  { name: 'Panic moment', emoji: '🌊', type: 'symptom', frequency: 'as_needed', category: 'Tracking' },

  // Self-care
  { name: 'Showered', emoji: '🚿', type: 'habit_build', frequency: 'daily', category: 'Self-care' },
  { name: 'Brushed teeth', emoji: '🪥', type: 'habit_build', frequency: 'multiple_daily', category: 'Self-care' },
  { name: 'Changed clothes', emoji: '👕', type: 'habit_build', frequency: 'daily', category: 'Self-care' },
  { name: 'Made bed', emoji: '🛏️', type: 'habit_build', frequency: 'daily', category: 'Self-care' },

  // Pets
  { name: 'Fed pet', emoji: '🐕', type: 'habit_build', frequency: 'multiple_daily', category: 'Care' },
  { name: 'Walked dog', emoji: '🦮', type: 'habit_build', frequency: 'daily', category: 'Care' },

  // Work/Productivity
  { name: 'Applied for job', emoji: '💼', type: 'goal', frequency: 'as_needed', category: 'Work' },
  { name: 'Worked on project', emoji: '🎯', type: 'goal', frequency: 'daily', category: 'Work' },
  { name: 'No procrastinating', emoji: '⏰', type: 'habit_break', frequency: 'daily', category: 'Focus' },
];

/**
 * Get presets by category
 */
export function getPresetsByCategory(): Record<string, typeof LOG_PRESETS> {
  const result: Record<string, typeof LOG_PRESETS> = {};

  for (const preset of LOG_PRESETS) {
    if (!result[preset.category]) {
      result[preset.category] = [];
    }
    result[preset.category].push(preset);
  }

  return result;
}

/**
 * Create a quick log from a preset
 */
export async function createFromPreset(
  presetName: string,
  options?: Partial<QuickLog>
): Promise<QuickLog | null> {
  const preset = LOG_PRESETS.find(p => p.name === presetName);
  if (!preset) return null;

  return createQuickLog(preset.name, preset.emoji, preset.type, {
    frequency: preset.frequency,
    ...options,
  });
}

// ============================================
// NOTIFICATIONS INTEGRATION
// ============================================

/**
 * Get logs that need reminders right now
 */
export async function getLogsNeedingReminder(): Promise<QuickLog[]> {
  const logs = await getQuickLogs();
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return logs.filter(log => {
    if (!log.reminderEnabled || !log.reminderTimes) return false;

    // Check if current time matches any reminder time (within 5 min window)
    return log.reminderTimes.some(time => {
      const [hour, minute] = time.split(':').map(Number);
      const reminderMinutes = hour * 60 + minute;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      return Math.abs(reminderMinutes - currentMinutes) <= 5;
    });
  });
}

/**
 * Get incomplete logs for end-of-day reminder
 */
export async function getIncompleteLogs(): Promise<QuickLog[]> {
  const logs = await getQuickLogs();
  const incomplete: QuickLog[] = [];

  for (const log of logs) {
    if (log.frequency === 'daily' || log.frequency === 'multiple_daily') {
      const isComplete = await isCompletedToday(log.id);
      if (!isComplete) {
        incomplete.push(log);
      }
    }
  }

  return incomplete;
}

// ============================================
// DATA CLEANUP
// ============================================

/**
 * Clear all quick log data (for secure delete)
 */
export async function clearAllQuickLogData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      QUICK_LOGS_KEY,
      LOG_ENTRIES_KEY,
      LOG_STREAKS_KEY,
    ]);
  } catch (error) {
    console.error('Failed to clear quick log data:', error);
  }
}
