/**
 * Notification Service
 *
 * Handles scheduling daily journal reminders.
 * Following Moodling Ethics:
 * - Compassionate, not pushy
 * - No streaks, no guilt
 * - User controls everything
 *
 * Unit 6: Basic Notifications
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getUsageStats } from './usageTrackingService';

// Storage keys
const STORAGE_KEYS = {
  REMINDER_ENABLED: 'moodling_reminder_enabled',
  REMINDER_TIME: 'moodling_reminder_time',
  REMINDER_FREQUENCY: 'moodling_reminder_frequency',
  LAST_ADAPTIVE_CHECK: 'moodling_last_adaptive_check',
};

// Compassionate notification messages (randomized)
const NOTIFICATION_MESSAGES = [
  { title: 'Check in when you\'re ready', body: 'No rush. Take your time. 🌿' },
  { title: 'How are you feeling?', body: 'A moment to notice how you are.' },
  { title: 'A gentle reminder', body: 'Your journal is here when you need it.' },
  { title: 'Whenever you\'re ready', body: 'No pressure, just an invitation. 🌱' },
  { title: 'Time for yourself', body: 'A few words can go a long way.' },
];

export type ReminderFrequency = 'daily' | 'every_other_day' | 'twice_weekly' | 'weekly';

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  frequency: ReminderFrequency;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  hour: 20, // 8 PM default
  minute: 0,
  frequency: 'daily',
};

// Frequency labels for UI
export const FREQUENCY_OPTIONS: { value: ReminderFrequency; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: 'Every day' },
  { value: 'every_other_day', label: 'Every other day', description: 'More breathing room' },
  { value: 'twice_weekly', label: 'Twice weekly', description: 'Light touch' },
  { value: 'weekly', label: 'Weekly', description: 'Gentle check-in' },
];

// Track scheduled timer for web
let scheduledTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Get a random compassionate notification message
 */
function getRandomMessage() {
  const index = Math.floor(Math.random() * NOTIFICATION_MESSAGES.length);
  return NOTIFICATION_MESSAGES[index];
}

/**
 * Load reminder settings from storage
 */
export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const [enabledStr, timeStr, frequencyStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.REMINDER_ENABLED),
      AsyncStorage.getItem(STORAGE_KEYS.REMINDER_TIME),
      AsyncStorage.getItem(STORAGE_KEYS.REMINDER_FREQUENCY),
    ]);

    const enabled = enabledStr === 'true';
    let hour = DEFAULT_SETTINGS.hour;
    let minute = DEFAULT_SETTINGS.minute;
    let frequency: ReminderFrequency = DEFAULT_SETTINGS.frequency;

    if (timeStr) {
      const parsed = JSON.parse(timeStr);
      hour = parsed.hour ?? DEFAULT_SETTINGS.hour;
      minute = parsed.minute ?? DEFAULT_SETTINGS.minute;
    }

    if (frequencyStr && ['daily', 'every_other_day', 'twice_weekly', 'weekly'].includes(frequencyStr)) {
      frequency = frequencyStr as ReminderFrequency;
    }

    return { enabled, hour, minute, frequency };
  } catch (error) {
    console.error('Failed to load reminder settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save reminder settings to storage
 */
export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.REMINDER_ENABLED, String(settings.enabled)),
      AsyncStorage.setItem(STORAGE_KEYS.REMINDER_TIME, JSON.stringify({
        hour: settings.hour,
        minute: settings.minute,
      })),
      AsyncStorage.setItem(STORAGE_KEYS.REMINDER_FREQUENCY, settings.frequency),
    ]);
  } catch (error) {
    console.error('Failed to save reminder settings:', error);
    throw error;
  }
}

/**
 * Request notification permissions
 * Returns true if granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  // Web notifications
  if (Platform.OS === 'web') {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // For native, we'll use expo-notifications when available
  // For now, return true as placeholder
  return true;
}

/**
 * Calculate milliseconds until the next occurrence of the specified time
 */
function getMillisecondsUntil(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

/**
 * Show a notification with a random compassionate message
 */
function showScheduledNotification(): void {
  const message = getRandomMessage();

  if (Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(message.title, {
      body: message.body,
      icon: '/favicon.ico',
      tag: 'moodling-reminder',
    });
  }
}

/**
 * Schedule a daily notification
 * On web: Uses setTimeout (works while browser is open)
 * On native: Would use expo-notifications for background delivery
 */
export async function scheduleDailyReminder(settings: ReminderSettings): Promise<void> {
  // Clear any existing timer
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }

  if (!settings.enabled) {
    console.log('Reminders disabled');
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.log('Notification permission not granted');
    return;
  }

  if (Platform.OS === 'web') {
    const msUntilReminder = getMillisecondsUntil(settings.hour, settings.minute);
    const minutesUntil = Math.round(msUntilReminder / 60000);

    console.log(`Reminder scheduled for ${formatTime(settings.hour, settings.minute)} (in ${minutesUntil} minutes)`);

    // Schedule the notification
    scheduledTimer = setTimeout(() => {
      showScheduledNotification();

      // Reschedule for tomorrow (if still enabled)
      getReminderSettings().then((currentSettings) => {
        if (currentSettings.enabled) {
          scheduleDailyReminder(currentSettings);
        }
      });
    }, msUntilReminder);
  }
}

/**
 * Cancel all scheduled reminders
 */
export async function cancelAllReminders(): Promise<void> {
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
  console.log('Reminders cancelled');
  // Native: would call Notifications.cancelAllScheduledNotificationsAsync()
}

/**
 * Show a test notification immediately
 */
export async function showTestNotification(): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.log('Notification permission not granted');
    return;
  }

  const message = getRandomMessage();

  if (Platform.OS === 'web' && 'Notification' in window) {
    new Notification(message.title, {
      body: message.body,
      icon: '/favicon.ico',
      tag: 'moodling-test',
    });
  }
}

/**
 * Format time for display
 */
export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

/**
 * Unit 14: Adaptive Reminders
 *
 * Check if user has formed a consistent journaling habit
 * and suggest reducing reminder frequency
 */

export interface AdaptiveSuggestion {
  shouldSuggest: boolean;
  currentFrequency: ReminderFrequency;
  suggestedFrequency: ReminderFrequency;
  message: string;
}

/**
 * Get days since last adaptive check
 */
async function getDaysSinceAdaptiveCheck(): Promise<number> {
  try {
    const lastCheck = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ADAPTIVE_CHECK);
    if (!lastCheck) return 999; // Never checked

    const lastDate = new Date(lastCheck);
    const today = new Date();
    return Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}

/**
 * Mark adaptive check as done
 */
async function markAdaptiveCheckDone(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_ADAPTIVE_CHECK, new Date().toISOString().split('T')[0]);
  } catch (error) {
    console.error('Failed to mark adaptive check:', error);
  }
}

/**
 * Check if user should be suggested to reduce reminder frequency
 * Based on consistent journaling habits
 */
export async function checkAdaptiveReminder(): Promise<AdaptiveSuggestion> {
  const settings = await getReminderSettings();
  const stats = await getUsageStats();

  // Default: no suggestion
  const noSuggestion: AdaptiveSuggestion = {
    shouldSuggest: false,
    currentFrequency: settings.frequency,
    suggestedFrequency: settings.frequency,
    message: '',
  };

  // Only check once per week
  const daysSinceCheck = await getDaysSinceAdaptiveCheck();
  if (daysSinceCheck < 7) {
    return noSuggestion;
  }

  // Need at least 2 weeks of data
  if (stats.totalDaysUsed < 14) {
    return noSuggestion;
  }

  // Calculate consistency (entries on most days)
  const isConsistent = stats.averageEntriesPerDay >= 0.8; // Journaling ~6 days/week

  if (!isConsistent) {
    return noSuggestion;
  }

  // Suggest reducing frequency based on current setting
  let suggestedFrequency: ReminderFrequency = settings.frequency;
  let message = '';

  switch (settings.frequency) {
    case 'daily':
      suggestedFrequency = 'every_other_day';
      message = "You've been journaling consistently! Would you like to try reminders every other day? You're building a great habit.";
      break;
    case 'every_other_day':
      suggestedFrequency = 'twice_weekly';
      message = "Your journaling practice is strong. Want to try twice-weekly reminders? You're doing great on your own.";
      break;
    case 'twice_weekly':
      suggestedFrequency = 'weekly';
      message = "You're a natural! How about weekly check-ins? You clearly don't need much prompting.";
      break;
    case 'weekly':
      // Already at minimum, suggest turning off
      message = "You've built a solid habit. Consider turning off reminders—you've got this!";
      break;
  }

  if (suggestedFrequency === settings.frequency && settings.frequency !== 'weekly') {
    return noSuggestion;
  }

  // Mark that we checked
  await markAdaptiveCheckDone();

  return {
    shouldSuggest: true,
    currentFrequency: settings.frequency,
    suggestedFrequency,
    message,
  };
}

/**
 * Check if today is a reminder day based on frequency
 */
export function shouldShowReminderToday(frequency: ReminderFrequency): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  const dayOfMonth = today.getDate();

  switch (frequency) {
    case 'daily':
      return true;
    case 'every_other_day':
      // Show on odd days of month
      return dayOfMonth % 2 === 1;
    case 'twice_weekly':
      // Monday and Thursday
      return dayOfWeek === 1 || dayOfWeek === 4;
    case 'weekly':
      // Sunday only
      return dayOfWeek === 0;
    default:
      return true;
  }
}
