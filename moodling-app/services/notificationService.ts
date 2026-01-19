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

// Storage keys
const STORAGE_KEYS = {
  REMINDER_ENABLED: 'moodling_reminder_enabled',
  REMINDER_TIME: 'moodling_reminder_time',
};

// Compassionate notification messages (randomized)
const NOTIFICATION_MESSAGES = [
  { title: 'Check in when you\'re ready', body: 'No rush. Take your time. 🌿' },
  { title: 'How are you feeling?', body: 'A moment to notice how you are.' },
  { title: 'A gentle reminder', body: 'Your journal is here when you need it.' },
  { title: 'Whenever you\'re ready', body: 'No pressure, just an invitation. 🌱' },
  { title: 'Time for yourself', body: 'A few words can go a long way.' },
];

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  hour: 20, // 8 PM default
  minute: 0,
};

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
    const [enabledStr, timeStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.REMINDER_ENABLED),
      AsyncStorage.getItem(STORAGE_KEYS.REMINDER_TIME),
    ]);

    const enabled = enabledStr === 'true';
    let hour = DEFAULT_SETTINGS.hour;
    let minute = DEFAULT_SETTINGS.minute;

    if (timeStr) {
      const parsed = JSON.parse(timeStr);
      hour = parsed.hour ?? DEFAULT_SETTINGS.hour;
      minute = parsed.minute ?? DEFAULT_SETTINGS.minute;
    }

    return { enabled, hour, minute };
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
