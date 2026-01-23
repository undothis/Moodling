/**
 * Drink Pacing Service
 *
 * Helps users pace their drinking at social events.
 * Features:
 * - Set a drinking interval (e.g., one drink per hour)
 * - Get notified when it's time for the next drink
 * - Track drinks consumed during a session
 * - Works silently via vibration/notification
 *
 * This is a harm reduction tool - not promoting drinking,
 * but helping those who choose to drink do so more mindfully.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Storage keys
const PACING_SESSION_KEY = 'moodleaf_drink_pacing_session';
const PACING_HISTORY_KEY = 'moodleaf_drink_pacing_history';
const PACING_PREFERENCES_KEY = 'moodleaf_drink_pacing_prefs';

// ============================================
// TYPES
// ============================================

/**
 * An active drink pacing session
 */
export interface DrinkPacingSession {
  id: string;
  startTime: string;
  intervalMinutes: number; // How often to buzz (e.g., 60 = once per hour)
  maxDrinks?: number; // Optional max limit
  drinksConsumed: number;
  drinkTimes: string[]; // Timestamps of each drink
  nextDrinkTime?: string; // When the next buzz will happen
  isActive: boolean;
  eventName?: string; // Optional: "Sarah's party", "Work happy hour"
  endTime?: string;
}

/**
 * Session summary for history
 */
export interface DrinkPacingHistoryEntry {
  id: string;
  date: string;
  eventName?: string;
  totalDrinks: number;
  durationMinutes: number;
  intervalMinutes: number;
  stayedOnPace: boolean; // Did they stick to the plan?
}

/**
 * User preferences for drink pacing
 */
export interface DrinkPacingPreferences {
  defaultIntervalMinutes: number; // Default: 60 (one per hour)
  defaultMaxDrinks: number; // Default: 4
  vibrateOnly: boolean; // Silent mode - vibration only, no notification sound
  autoEndAfterHours: number; // Auto-end session after X hours (default: 6)
}

// ============================================
// PREFERENCES
// ============================================

/**
 * Get drink pacing preferences
 */
export async function getDrinkPacingPreferences(): Promise<DrinkPacingPreferences> {
  try {
    const data = await AsyncStorage.getItem(PACING_PREFERENCES_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Default
  }
  return {
    defaultIntervalMinutes: 60,
    defaultMaxDrinks: 4,
    vibrateOnly: true, // Default to silent vibration
    autoEndAfterHours: 6,
  };
}

/**
 * Save drink pacing preferences
 */
export async function setDrinkPacingPreferences(
  prefs: Partial<DrinkPacingPreferences>
): Promise<void> {
  const current = await getDrinkPacingPreferences();
  const updated = { ...current, ...prefs };
  await AsyncStorage.setItem(PACING_PREFERENCES_KEY, JSON.stringify(updated));
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Start a new drink pacing session
 */
export async function startDrinkPacingSession(options?: {
  intervalMinutes?: number;
  maxDrinks?: number;
  eventName?: string;
}): Promise<DrinkPacingSession> {
  const prefs = await getDrinkPacingPreferences();

  const session: DrinkPacingSession = {
    id: `pace_${Date.now()}`,
    startTime: new Date().toISOString(),
    intervalMinutes: options?.intervalMinutes ?? prefs.defaultIntervalMinutes,
    maxDrinks: options?.maxDrinks ?? prefs.defaultMaxDrinks,
    drinksConsumed: 0,
    drinkTimes: [],
    isActive: true,
    eventName: options?.eventName,
  };

  await AsyncStorage.setItem(PACING_SESSION_KEY, JSON.stringify(session));

  // Request notification permissions
  await Notifications.requestPermissionsAsync();

  return session;
}

/**
 * Get current active session
 */
export async function getActiveSession(): Promise<DrinkPacingSession | null> {
  try {
    const data = await AsyncStorage.getItem(PACING_SESSION_KEY);
    if (data) {
      const session: DrinkPacingSession = JSON.parse(data);
      if (session.isActive) {
        return session;
      }
    }
  } catch {
    // No active session
  }
  return null;
}

/**
 * Log a drink and schedule next buzz
 */
export async function logDrink(): Promise<{
  session: DrinkPacingSession;
  atLimit: boolean;
  overLimit: boolean;
  nextBuzzIn: number; // Minutes until next buzz
}> {
  const session = await getActiveSession();
  if (!session) {
    throw new Error('No active drink pacing session');
  }

  const prefs = await getDrinkPacingPreferences();
  const now = new Date();

  // Log the drink
  session.drinksConsumed++;
  session.drinkTimes.push(now.toISOString());

  // Calculate next drink time
  const nextDrink = new Date(now.getTime() + session.intervalMinutes * 60 * 1000);
  session.nextDrinkTime = nextDrink.toISOString();

  await AsyncStorage.setItem(PACING_SESSION_KEY, JSON.stringify(session));

  // Schedule notification for next drink
  await scheduleNextDrinkReminder(session, prefs);

  // Haptic feedback for logging
  if (Platform.OS !== 'web') {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const atLimit = session.maxDrinks ? session.drinksConsumed === session.maxDrinks : false;
  const overLimit = session.maxDrinks ? session.drinksConsumed > session.maxDrinks : false;

  return {
    session,
    atLimit,
    overLimit,
    nextBuzzIn: session.intervalMinutes,
  };
}

/**
 * Schedule the next drink reminder
 */
async function scheduleNextDrinkReminder(
  session: DrinkPacingSession,
  prefs: DrinkPacingPreferences
): Promise<void> {
  // Cancel any existing reminders
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Check if at or over limit
  if (session.maxDrinks && session.drinksConsumed >= session.maxDrinks) {
    // Schedule a "you've reached your limit" reminder instead
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Limit Reached',
        body: `You've had ${session.drinksConsumed} drinks. Consider switching to water.`,
        sound: prefs.vibrateOnly ? false : 'default',
        data: { type: 'drink_pacing_limit' },
      },
      trigger: null, // Immediate
    });
    return;
  }

  // Schedule next drink reminder
  const triggerSeconds = session.intervalMinutes * 60;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Drink Pacing',
      body: session.maxDrinks
        ? `Time for drink ${session.drinksConsumed + 1}/${session.maxDrinks}`
        : `${session.intervalMinutes} minutes - time to pace`,
      sound: prefs.vibrateOnly ? false : 'default',
      data: { type: 'drink_pacing_reminder' },
    },
    trigger: {
      seconds: triggerSeconds,
      channelId: 'drink-pacing',
    },
  });
}

/**
 * End the current session
 */
export async function endDrinkPacingSession(): Promise<DrinkPacingHistoryEntry | null> {
  const session = await getActiveSession();
  if (!session) return null;

  const now = new Date();
  session.isActive = false;
  session.endTime = now.toISOString();

  // Calculate duration
  const startTime = new Date(session.startTime);
  const durationMinutes = Math.round((now.getTime() - startTime.getTime()) / (1000 * 60));

  // Calculate if they stayed on pace
  // (Expected drinks based on duration and interval)
  const expectedDrinks = Math.floor(durationMinutes / session.intervalMinutes) + 1;
  const stayedOnPace = session.drinksConsumed <= expectedDrinks;

  // Create history entry
  const historyEntry: DrinkPacingHistoryEntry = {
    id: session.id,
    date: session.startTime,
    eventName: session.eventName,
    totalDrinks: session.drinksConsumed,
    durationMinutes,
    intervalMinutes: session.intervalMinutes,
    stayedOnPace,
  };

  // Save to history
  const history = await getDrinkPacingHistory();
  history.push(historyEntry);
  // Keep last 30 entries
  const trimmed = history.slice(-30);
  await AsyncStorage.setItem(PACING_HISTORY_KEY, JSON.stringify(trimmed));

  // Clear active session
  await AsyncStorage.removeItem(PACING_SESSION_KEY);

  // Cancel scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  return historyEntry;
}

/**
 * Get drink pacing history
 */
export async function getDrinkPacingHistory(): Promise<DrinkPacingHistoryEntry[]> {
  try {
    const data = await AsyncStorage.getItem(PACING_HISTORY_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // No history
  }
  return [];
}

/**
 * Get session status for display
 */
export async function getSessionStatus(): Promise<{
  isActive: boolean;
  drinksConsumed: number;
  maxDrinks?: number;
  minutesSinceLastDrink: number;
  minutesUntilNextBuzz: number;
  eventName?: string;
} | null> {
  const session = await getActiveSession();
  if (!session) return null;

  const now = new Date();

  // Calculate minutes since last drink
  let minutesSinceLastDrink = 0;
  if (session.drinkTimes.length > 0) {
    const lastDrink = new Date(session.drinkTimes[session.drinkTimes.length - 1]);
    minutesSinceLastDrink = Math.round((now.getTime() - lastDrink.getTime()) / (1000 * 60));
  }

  // Calculate minutes until next buzz
  let minutesUntilNextBuzz = session.intervalMinutes;
  if (session.nextDrinkTime) {
    const nextBuzz = new Date(session.nextDrinkTime);
    minutesUntilNextBuzz = Math.max(0, Math.round((nextBuzz.getTime() - now.getTime()) / (1000 * 60)));
  }

  return {
    isActive: session.isActive,
    drinksConsumed: session.drinksConsumed,
    maxDrinks: session.maxDrinks,
    minutesSinceLastDrink,
    minutesUntilNextBuzz,
    eventName: session.eventName,
  };
}

/**
 * Get context for Coach about drink pacing
 */
export async function getDrinkPacingContextForCoach(): Promise<string> {
  const session = await getActiveSession();
  if (!session) return '';

  const status = await getSessionStatus();
  if (!status) return '';

  const parts: string[] = ['ACTIVE DRINK PACING SESSION:'];

  if (session.eventName) {
    parts.push(`  Event: ${session.eventName}`);
  }

  parts.push(`  Drinks consumed: ${status.drinksConsumed}${status.maxDrinks ? `/${status.maxDrinks}` : ''}`);
  parts.push(`  Pace: one drink every ${session.intervalMinutes} minutes`);

  if (status.minutesSinceLastDrink > 0) {
    parts.push(`  Last drink: ${status.minutesSinceLastDrink} minutes ago`);
  }

  if (status.maxDrinks && status.drinksConsumed >= status.maxDrinks) {
    parts.push(`  STATUS: At limit - consider suggesting water or ending session`);
  }

  return parts.join('\n');
}

// ============================================
// NOTIFICATION CHANNEL SETUP
// ============================================

/**
 * Set up notification channel for drink pacing (Android)
 */
export async function setupDrinkPacingNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('drink-pacing', {
      name: 'Drink Pacing',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250], // Pattern: pause, vibrate, pause, vibrate
      lightColor: '#4A7C59',
      sound: null, // No sound by default
    });
  }
}

/**
 * Initialize drink pacing service
 * Call this when app starts
 */
export async function initDrinkPacingService(): Promise<void> {
  await setupDrinkPacingNotificationChannel();

  // Check for auto-end of stale sessions
  const session = await getActiveSession();
  if (session) {
    const prefs = await getDrinkPacingPreferences();
    const startTime = new Date(session.startTime);
    const hoursElapsed = (Date.now() - startTime.getTime()) / (1000 * 60 * 60);

    if (hoursElapsed >= prefs.autoEndAfterHours) {
      console.log('[DrinkPacing] Auto-ending stale session');
      await endDrinkPacingSession();
    }
  }
}
