/**
 * Habit Timer Service
 *
 * General-purpose pacing/accountability timer for any habit.
 * Users can create custom habits with intervals and limits.
 *
 * Examples:
 * - Coffee: max 3 per day, minimum 2 hours apart
 * - Medication: every 4 hours
 * - Snacks: minimum 3 hours apart
 * - Screen breaks: every 30 minutes
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Optional dependencies
let Notifications: typeof import('expo-notifications') | null = null;
let Haptics: typeof import('expo-haptics') | null = null;

try {
  Notifications = require('expo-notifications');
} catch {
  console.log('[HabitTimer] expo-notifications not available');
}

try {
  Haptics = require('expo-haptics');
} catch {
  console.log('[HabitTimer] expo-haptics not available');
}

// Storage keys
const HABITS_KEY = 'moodleaf_custom_habits';
const HABIT_SESSIONS_KEY = 'moodleaf_habit_sessions';
const HABIT_HISTORY_KEY = 'moodleaf_habit_history';

// ============================================
// TYPES
// ============================================

/**
 * A custom habit definition
 */
export interface CustomHabit {
  id: string;
  name: string;
  emoji: string;
  intervalMinutes: number; // Minimum time between occurrences
  dailyLimit?: number; // Optional max per day
  description?: string;
  color?: string;
  createdAt: string;
  isActive: boolean; // Whether tracking is enabled
}

/**
 * An active habit tracking session for today
 */
export interface HabitSession {
  habitId: string;
  date: string; // YYYY-MM-DD
  occurrences: string[]; // Timestamps of each occurrence
  lastOccurrence?: string;
  nextAllowedTime?: string;
}

/**
 * History entry for a habit
 */
export interface HabitHistoryEntry {
  habitId: string;
  date: string;
  totalOccurrences: number;
  stayedWithinLimit: boolean;
  averageInterval: number; // Average minutes between occurrences
}

// ============================================
// DEFAULT HABIT TEMPLATES
// ============================================

export const HABIT_TEMPLATES: Omit<CustomHabit, 'id' | 'createdAt' | 'isActive'>[] = [
  {
    name: 'Coffee',
    emoji: '☕',
    intervalMinutes: 120,
    dailyLimit: 4,
    description: 'Track your caffeine intake',
    color: '#8B4513',
  },
  {
    name: 'Medication',
    emoji: '💊',
    intervalMinutes: 240,
    description: 'Reminder for timed medications',
    color: '#4A90A4',
  },
  {
    name: 'Snacks',
    emoji: '🍪',
    intervalMinutes: 180,
    dailyLimit: 3,
    description: 'Mindful snacking timer',
    color: '#D2691E',
  },
  {
    name: 'Screen Break',
    emoji: '👀',
    intervalMinutes: 30,
    description: 'Take regular breaks from screens',
    color: '#6B5B95',
  },
  {
    name: 'Water',
    emoji: '💧',
    intervalMinutes: 60,
    dailyLimit: 8,
    description: 'Stay hydrated throughout the day',
    color: '#4A90A4',
  },
  {
    name: 'Stretching',
    emoji: '🧘',
    intervalMinutes: 60,
    description: 'Regular stretching reminders',
    color: '#88B04B',
  },
  {
    name: 'Social Media',
    emoji: '📱',
    intervalMinutes: 120,
    dailyLimit: 5,
    description: 'Mindful social media check-ins',
    color: '#FF6B6B',
  },
];

// ============================================
// HABIT MANAGEMENT
// ============================================

/**
 * Get all custom habits
 */
export async function getCustomHabits(): Promise<CustomHabit[]> {
  try {
    const data = await AsyncStorage.getItem(HABITS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // No habits
  }
  return [];
}

/**
 * Create a new custom habit
 */
export async function createCustomHabit(
  habit: Omit<CustomHabit, 'id' | 'createdAt' | 'isActive'>
): Promise<CustomHabit> {
  const habits = await getCustomHabits();

  const newHabit: CustomHabit = {
    ...habit,
    id: `habit_${Date.now()}`,
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  habits.push(newHabit);
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));

  return newHabit;
}

/**
 * Create habit from template
 */
export async function createHabitFromTemplate(
  template: Omit<CustomHabit, 'id' | 'createdAt' | 'isActive'>
): Promise<CustomHabit> {
  return createCustomHabit(template);
}

/**
 * Update a habit
 */
export async function updateCustomHabit(
  habitId: string,
  updates: Partial<CustomHabit>
): Promise<CustomHabit | null> {
  const habits = await getCustomHabits();
  const index = habits.findIndex(h => h.id === habitId);

  if (index === -1) return null;

  habits[index] = { ...habits[index], ...updates };
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));

  return habits[index];
}

/**
 * Delete a habit
 */
export async function deleteCustomHabit(habitId: string): Promise<void> {
  const habits = await getCustomHabits();
  const filtered = habits.filter(h => h.id !== habitId);
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(filtered));

  // Also clear any sessions for this habit
  const sessions = await getAllSessions();
  const filteredSessions = sessions.filter(s => s.habitId !== habitId);
  await AsyncStorage.setItem(HABIT_SESSIONS_KEY, JSON.stringify(filteredSessions));
}

/**
 * Toggle habit active state
 */
export async function toggleHabitActive(habitId: string): Promise<boolean> {
  const habits = await getCustomHabits();
  const habit = habits.find(h => h.id === habitId);

  if (!habit) return false;

  habit.isActive = !habit.isActive;
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));

  return habit.isActive;
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Get today's date as YYYY-MM-DD
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get all sessions
 */
async function getAllSessions(): Promise<HabitSession[]> {
  try {
    const data = await AsyncStorage.getItem(HABIT_SESSIONS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // No sessions
  }
  return [];
}

/**
 * Get or create today's session for a habit
 */
export async function getHabitSession(habitId: string): Promise<HabitSession> {
  const today = getTodayDate();
  const sessions = await getAllSessions();

  let session = sessions.find(s => s.habitId === habitId && s.date === today);

  if (!session) {
    session = {
      habitId,
      date: today,
      occurrences: [],
    };
    sessions.push(session);
    await AsyncStorage.setItem(HABIT_SESSIONS_KEY, JSON.stringify(sessions));
  }

  return session;
}

/**
 * Log an occurrence of a habit
 */
export async function logHabitOccurrence(habitId: string): Promise<{
  session: HabitSession;
  habit: CustomHabit;
  atLimit: boolean;
  tooSoon: boolean;
  minutesUntilAllowed: number;
}> {
  const habits = await getCustomHabits();
  const habit = habits.find(h => h.id === habitId);

  if (!habit) {
    throw new Error('Habit not found');
  }

  const sessions = await getAllSessions();
  const today = getTodayDate();
  let session = sessions.find(s => s.habitId === habitId && s.date === today);

  if (!session) {
    session = { habitId, date: today, occurrences: [] };
    sessions.push(session);
  }

  const now = new Date();

  // Check if too soon since last occurrence
  let tooSoon = false;
  let minutesUntilAllowed = 0;

  if (session.lastOccurrence) {
    const lastTime = new Date(session.lastOccurrence);
    const minutesSinceLast = (now.getTime() - lastTime.getTime()) / (1000 * 60);

    if (minutesSinceLast < habit.intervalMinutes) {
      tooSoon = true;
      minutesUntilAllowed = Math.ceil(habit.intervalMinutes - minutesSinceLast);
    }
  }

  // Log the occurrence (even if too soon - it's tracking, not blocking)
  session.occurrences.push(now.toISOString());
  session.lastOccurrence = now.toISOString();
  session.nextAllowedTime = new Date(
    now.getTime() + habit.intervalMinutes * 60 * 1000
  ).toISOString();

  await AsyncStorage.setItem(HABIT_SESSIONS_KEY, JSON.stringify(sessions));

  // Check if at daily limit
  const atLimit = habit.dailyLimit ? session.occurrences.length >= habit.dailyLimit : false;

  // Haptic feedback
  if (Platform.OS !== 'web' && Haptics) {
    if (atLimit) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (tooSoon) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  // Schedule next reminder if not at limit
  if (!atLimit && habit.isActive) {
    await scheduleHabitReminder(habit, session);
  }

  return {
    session,
    habit,
    atLimit,
    tooSoon,
    minutesUntilAllowed,
  };
}

/**
 * Get habit status for display
 */
export async function getHabitStatus(habitId: string): Promise<{
  habit: CustomHabit;
  todayCount: number;
  dailyLimit?: number;
  minutesSinceLast: number;
  minutesUntilAllowed: number;
  canLogNow: boolean;
  atLimit: boolean;
} | null> {
  const habits = await getCustomHabits();
  const habit = habits.find(h => h.id === habitId);

  if (!habit) return null;

  const session = await getHabitSession(habitId);
  const now = new Date();

  let minutesSinceLast = 0;
  let minutesUntilAllowed = 0;
  let canLogNow = true;

  if (session.lastOccurrence) {
    const lastTime = new Date(session.lastOccurrence);
    minutesSinceLast = Math.floor((now.getTime() - lastTime.getTime()) / (1000 * 60));

    if (minutesSinceLast < habit.intervalMinutes) {
      minutesUntilAllowed = habit.intervalMinutes - minutesSinceLast;
      canLogNow = false;
    }
  }

  const atLimit = habit.dailyLimit ? session.occurrences.length >= habit.dailyLimit : false;

  return {
    habit,
    todayCount: session.occurrences.length,
    dailyLimit: habit.dailyLimit,
    minutesSinceLast,
    minutesUntilAllowed,
    canLogNow: canLogNow && !atLimit,
    atLimit,
  };
}

/**
 * Get all habit statuses for dashboard
 */
export async function getAllHabitStatuses(): Promise<Array<{
  habit: CustomHabit;
  todayCount: number;
  dailyLimit?: number;
  canLogNow: boolean;
  atLimit: boolean;
}>> {
  const habits = await getCustomHabits();
  const activeHabits = habits.filter(h => h.isActive);

  const statuses = await Promise.all(
    activeHabits.map(async habit => {
      const status = await getHabitStatus(habit.id);
      return status!;
    })
  );

  return statuses.filter(Boolean);
}

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Schedule a reminder for a habit
 */
async function scheduleHabitReminder(
  habit: CustomHabit,
  session: HabitSession
): Promise<void> {
  if (!Notifications) return;

  // Cancel existing notifications for this habit
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduledNotifications) {
    if (notif.content.data?.habitId === habit.id) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  // Don't schedule if at limit
  if (habit.dailyLimit && session.occurrences.length >= habit.dailyLimit) {
    return;
  }

  // Schedule next reminder
  const triggerSeconds = habit.intervalMinutes * 60;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${habit.emoji} ${habit.name} Timer`,
      body: habit.dailyLimit
        ? `Time for ${habit.name} (${session.occurrences.length + 1}/${habit.dailyLimit})`
        : `${habit.intervalMinutes} minutes - ${habit.name} allowed`,
      data: { type: 'habit_timer', habitId: habit.id },
    },
    trigger: {
      seconds: triggerSeconds,
      channelId: 'habit-timer',
    },
  });
}

/**
 * Set up notification channel
 */
export async function setupHabitTimerNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android' && Notifications) {
    await Notifications.setNotificationChannelAsync('habit-timer', {
      name: 'Habit Timer',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4A7C59',
    });
  }
}

// ============================================
// HISTORY
// ============================================

/**
 * Save end-of-day history and clean up old sessions
 */
export async function processEndOfDayHistory(): Promise<void> {
  const today = getTodayDate();
  const sessions = await getAllSessions();
  const habits = await getCustomHabits();

  // Get sessions from before today
  const oldSessions = sessions.filter(s => s.date < today);

  if (oldSessions.length === 0) return;

  // Convert to history entries
  const historyData = await AsyncStorage.getItem(HABIT_HISTORY_KEY);
  const history: HabitHistoryEntry[] = historyData ? JSON.parse(historyData) : [];

  for (const session of oldSessions) {
    const habit = habits.find(h => h.id === session.habitId);
    if (!habit) continue;

    // Calculate average interval
    let avgInterval = 0;
    if (session.occurrences.length > 1) {
      let totalMinutes = 0;
      for (let i = 1; i < session.occurrences.length; i++) {
        const prev = new Date(session.occurrences[i - 1]);
        const curr = new Date(session.occurrences[i]);
        totalMinutes += (curr.getTime() - prev.getTime()) / (1000 * 60);
      }
      avgInterval = Math.round(totalMinutes / (session.occurrences.length - 1));
    }

    const entry: HabitHistoryEntry = {
      habitId: session.habitId,
      date: session.date,
      totalOccurrences: session.occurrences.length,
      stayedWithinLimit: habit.dailyLimit ? session.occurrences.length <= habit.dailyLimit : true,
      averageInterval: avgInterval,
    };

    history.push(entry);
  }

  // Keep last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const cutoffDate = ninetyDaysAgo.toISOString().split('T')[0];
  const trimmedHistory = history.filter(h => h.date >= cutoffDate);

  await AsyncStorage.setItem(HABIT_HISTORY_KEY, JSON.stringify(trimmedHistory));

  // Remove old sessions, keep today's
  const currentSessions = sessions.filter(s => s.date === today);
  await AsyncStorage.setItem(HABIT_SESSIONS_KEY, JSON.stringify(currentSessions));
}

/**
 * Get habit history
 */
export async function getHabitHistory(
  habitId?: string,
  days: number = 30
): Promise<HabitHistoryEntry[]> {
  try {
    const data = await AsyncStorage.getItem(HABIT_HISTORY_KEY);
    if (!data) return [];

    let history: HabitHistoryEntry[] = JSON.parse(data);

    // Filter by habit if specified
    if (habitId) {
      history = history.filter(h => h.habitId === habitId);
    }

    // Filter by days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoff = cutoffDate.toISOString().split('T')[0];

    return history.filter(h => h.date >= cutoff);
  } catch {
    return [];
  }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize habit timer service
 */
export async function initHabitTimerService(): Promise<void> {
  await setupHabitTimerNotificationChannel();
  await processEndOfDayHistory();
}

/**
 * Get habit context for Coach
 */
export async function getHabitContextForCoach(): Promise<string> {
  const statuses = await getAllHabitStatuses();

  if (statuses.length === 0) return '';

  const parts: string[] = ['HABIT TRACKING TODAY:'];

  for (const status of statuses) {
    const limitText = status.dailyLimit ? `/${status.dailyLimit}` : '';
    const statusText = status.atLimit
      ? ' (at limit)'
      : status.canLogNow
      ? ''
      : ' (pacing)';
    parts.push(`  ${status.habit.emoji} ${status.habit.name}: ${status.todayCount}${limitText}${statusText}`);
  }

  return parts.join('\n');
}
