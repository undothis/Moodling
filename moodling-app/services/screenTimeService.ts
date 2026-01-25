/**
 * Screen Time Service
 *
 * Tracks app usage patterns, session durations, and screen time analytics.
 * Used by AI coach to understand usage patterns and provide better insights.
 *
 * Privacy-first approach:
 * - All data stays on device
 * - User controls what AI can access
 * - No external tracking
 *
 * Unit: Screen Time Analytics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ScreenTimeSession {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number; // seconds
  screenPath?: string; // Which screen/feature was used
  interactions?: number; // Tap/scroll count
}

export interface DailyScreenTime {
  date: string; // YYYY-MM-DD
  totalSeconds: number;
  sessionCount: number;
  longestSession: number;
  shortestSession: number;
  averageSession: number;
  peakUsageHour?: number; // 0-23
  screens: Record<string, number>; // screen path -> seconds
  firstOpenTime?: string;
  lastCloseTime?: string;
}

export interface WeeklyScreenTime {
  weekStart: string; // Monday date
  totalSeconds: number;
  dailyAverage: number;
  mostActiveDay: string;
  leastActiveDay: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  days: DailyScreenTime[];
}

export interface ScreenTimeSettings {
  trackingEnabled: boolean;
  dailyGoalMinutes?: number;
  reminderAfterMinutes?: number;
  breakReminderEnabled: boolean;
  breakIntervalMinutes?: number;
  nightModeEnabled: boolean;
  nightModeStart?: string; // HH:MM
  nightModeEnd?: string; // HH:MM
}

export interface ScreenTimeInsights {
  todayMinutes: number;
  weeklyAverageMinutes: number;
  mostUsedScreen: string;
  peakUsageTime: string;
  consistencyScore: number; // 0-100, how consistent is usage
  healthScore: number; // 0-100, balance score
  suggestions: string[];
}

export interface ScreenTimeContextForClaude {
  todayUsage: {
    totalMinutes: number;
    sessionCount: number;
    currentSessionMinutes: number;
    isOverDailyGoal: boolean;
    mostUsedFeature: string;
  };
  weeklyPattern: {
    averageMinutesPerDay: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    mostActiveDay: string;
    peakUsageHour: number;
  };
  healthIndicators: {
    takesBreaks: boolean;
    usesNightMode: boolean;
    hasHealthyBoundaries: boolean;
    consistencyScore: number;
  };
  insights: string[];
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  CURRENT_SESSION: '@screen_time_current_session',
  DAILY_DATA: '@screen_time_daily_',
  SETTINGS: '@screen_time_settings',
  WEEKLY_CACHE: '@screen_time_weekly_cache',
};

// ============================================================================
// SESSION TRACKING
// ============================================================================

let currentSession: ScreenTimeSession | null = null;
let sessionStartTime: Date | null = null;
let appStateSubscription: any = null;

/**
 * Initialize screen time tracking
 */
export async function initializeScreenTimeTracking(): Promise<void> {
  const settings = await getScreenTimeSettings();
  if (!settings.trackingEnabled) return;

  // Start listening to app state changes
  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

  // Start a new session
  await startSession();
}

/**
 * Handle app state changes (background/foreground)
 */
async function handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
  if (nextAppState === 'active') {
    // App came to foreground
    await startSession();
  } else if (nextAppState === 'background' || nextAppState === 'inactive') {
    // App went to background
    await endSession();
  }
}

/**
 * Start a new session
 */
export async function startSession(screenPath?: string): Promise<void> {
  sessionStartTime = new Date();
  currentSession = {
    id: `session_${Date.now()}`,
    startTime: sessionStartTime.toISOString(),
    duration: 0,
    screenPath,
    interactions: 0,
  };

  await AsyncStorage.setItem(
    STORAGE_KEYS.CURRENT_SESSION,
    JSON.stringify(currentSession)
  );
}

/**
 * End current session and save data
 */
export async function endSession(): Promise<void> {
  if (!currentSession || !sessionStartTime) return;

  const endTime = new Date();
  const duration = Math.round((endTime.getTime() - sessionStartTime.getTime()) / 1000);

  currentSession.endTime = endTime.toISOString();
  currentSession.duration = duration;

  // Save to daily data
  await saveDailySessionData(currentSession);

  // Clear current session
  currentSession = null;
  sessionStartTime = null;
  await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
}

/**
 * Track screen navigation
 */
export async function trackScreenView(screenPath: string): Promise<void> {
  if (currentSession) {
    currentSession.screenPath = screenPath;
  }
}

/**
 * Track user interaction
 */
export function trackInteraction(): void {
  if (currentSession) {
    currentSession.interactions = (currentSession.interactions || 0) + 1;
  }
}

/**
 * Get current session duration in seconds
 */
export function getCurrentSessionDuration(): number {
  if (!sessionStartTime) return 0;
  return Math.round((Date.now() - sessionStartTime.getTime()) / 1000);
}

// ============================================================================
// DAILY DATA MANAGEMENT
// ============================================================================

/**
 * Save session data to daily aggregate
 */
async function saveDailySessionData(session: ScreenTimeSession): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const key = `${STORAGE_KEYS.DAILY_DATA}${today}`;

  let dailyData = await getDailyScreenTime(today);

  if (!dailyData) {
    dailyData = {
      date: today,
      totalSeconds: 0,
      sessionCount: 0,
      longestSession: 0,
      shortestSession: Infinity,
      averageSession: 0,
      screens: {},
    };
  }

  // Update daily data
  dailyData.totalSeconds += session.duration;
  dailyData.sessionCount += 1;
  dailyData.longestSession = Math.max(dailyData.longestSession, session.duration);
  dailyData.shortestSession = Math.min(dailyData.shortestSession, session.duration);
  dailyData.averageSession = Math.round(dailyData.totalSeconds / dailyData.sessionCount);

  // Track screen usage
  if (session.screenPath) {
    dailyData.screens[session.screenPath] =
      (dailyData.screens[session.screenPath] || 0) + session.duration;
  }

  // Track first open / last close
  if (!dailyData.firstOpenTime) {
    dailyData.firstOpenTime = session.startTime;
  }
  dailyData.lastCloseTime = session.endTime;

  // Calculate peak usage hour
  const sessionHour = new Date(session.startTime).getHours();
  dailyData.peakUsageHour = sessionHour; // Simplified - could be more sophisticated

  await AsyncStorage.setItem(key, JSON.stringify(dailyData));
}

/**
 * Get daily screen time data
 */
export async function getDailyScreenTime(date?: string): Promise<DailyScreenTime | null> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const key = `${STORAGE_KEYS.DAILY_DATA}${targetDate}`;

  try {
    const data = await AsyncStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      // Fix Infinity issue from JSON
      if (parsed.shortestSession === null) parsed.shortestSession = 0;
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get today's screen time in minutes
 */
export async function getTodayScreenTimeMinutes(): Promise<number> {
  const daily = await getDailyScreenTime();
  const currentDuration = getCurrentSessionDuration();
  const totalSeconds = (daily?.totalSeconds || 0) + currentDuration;
  return Math.round(totalSeconds / 60);
}

// ============================================================================
// WEEKLY DATA
// ============================================================================

/**
 * Get weekly screen time data
 */
export async function getWeeklyScreenTime(): Promise<WeeklyScreenTime> {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  const days: DailyScreenTime[] = [];
  let totalSeconds = 0;
  let mostActiveDay = '';
  let mostActiveSeconds = 0;
  let leastActiveDay = '';
  let leastActiveSeconds = Infinity;

  // Gather data for each day of the week
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const dayData = await getDailyScreenTime(dateStr);
    if (dayData) {
      days.push(dayData);
      totalSeconds += dayData.totalSeconds;

      if (dayData.totalSeconds > mostActiveSeconds) {
        mostActiveSeconds = dayData.totalSeconds;
        mostActiveDay = dateStr;
      }
      if (dayData.totalSeconds < leastActiveSeconds && dayData.totalSeconds > 0) {
        leastActiveSeconds = dayData.totalSeconds;
        leastActiveDay = dateStr;
      }
    }
  }

  // Calculate trend by comparing first half to second half
  const firstHalf = days.slice(0, 3).reduce((sum, d) => sum + d.totalSeconds, 0);
  const secondHalf = days.slice(4).reduce((sum, d) => sum + d.totalSeconds, 0);
  const trend: 'increasing' | 'stable' | 'decreasing' =
    secondHalf > firstHalf * 1.2 ? 'increasing' :
    secondHalf < firstHalf * 0.8 ? 'decreasing' : 'stable';

  return {
    weekStart: monday.toISOString().split('T')[0],
    totalSeconds,
    dailyAverage: days.length > 0 ? Math.round(totalSeconds / days.length) : 0,
    mostActiveDay,
    leastActiveDay: leastActiveSeconds === Infinity ? '' : leastActiveDay,
    trend,
    days,
  };
}

// ============================================================================
// SETTINGS
// ============================================================================

/**
 * Get screen time settings
 */
export async function getScreenTimeSettings(): Promise<ScreenTimeSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      return JSON.parse(data);
    }
  } catch {}

  // Default settings
  return {
    trackingEnabled: true,
    dailyGoalMinutes: 60, // 1 hour default goal
    breakReminderEnabled: true,
    breakIntervalMinutes: 30,
    nightModeEnabled: false,
    nightModeStart: '22:00',
    nightModeEnd: '07:00',
  };
}

/**
 * Update screen time settings
 */
export async function updateScreenTimeSettings(
  updates: Partial<ScreenTimeSettings>
): Promise<void> {
  const current = await getScreenTimeSettings();
  const updated = { ...current, ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));

  // Re-initialize if tracking was toggled
  if (updates.trackingEnabled !== undefined) {
    if (updates.trackingEnabled) {
      await initializeScreenTimeTracking();
    } else {
      await stopScreenTimeTracking();
    }
  }
}

/**
 * Stop screen time tracking
 */
export async function stopScreenTimeTracking(): Promise<void> {
  await endSession();
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
}

// ============================================================================
// INSIGHTS & ANALYTICS
// ============================================================================

/**
 * Get screen time insights
 */
export async function getScreenTimeInsights(): Promise<ScreenTimeInsights> {
  const todayMinutes = await getTodayScreenTimeMinutes();
  const weekly = await getWeeklyScreenTime();
  const settings = await getScreenTimeSettings();

  const weeklyAverageMinutes = Math.round(weekly.dailyAverage / 60);

  // Find most used screen
  const today = await getDailyScreenTime();
  let mostUsedScreen = 'coach';
  if (today?.screens) {
    const screens = Object.entries(today.screens);
    if (screens.length > 0) {
      screens.sort((a, b) => b[1] - a[1]);
      mostUsedScreen = screens[0][0];
    }
  }

  // Calculate peak usage time
  const peakHour = today?.peakUsageHour ?? 10;
  const peakUsageTime = peakHour < 12 ? `${peakHour}am` :
                        peakHour === 12 ? '12pm' :
                        `${peakHour - 12}pm`;

  // Calculate consistency score (how regular is usage)
  const dailyUsages = weekly.days.map(d => d.totalSeconds);
  const avgUsage = weekly.dailyAverage;
  const variance = dailyUsages.reduce((sum, u) => sum + Math.pow(u - avgUsage, 2), 0) / Math.max(dailyUsages.length, 1);
  const stdDev = Math.sqrt(variance);
  const consistencyScore = Math.max(0, Math.min(100, 100 - (stdDev / Math.max(avgUsage, 1)) * 100));

  // Calculate health score
  let healthScore = 70; // Base score
  if (settings.breakReminderEnabled) healthScore += 10;
  if (settings.nightModeEnabled) healthScore += 10;
  if (todayMinutes <= (settings.dailyGoalMinutes || 60)) healthScore += 10;
  healthScore = Math.min(100, healthScore);

  // Generate suggestions
  const suggestions: string[] = [];
  if (todayMinutes > (settings.dailyGoalMinutes || 60)) {
    suggestions.push("You've exceeded your daily goal. Consider taking a break.");
  }
  if (!settings.breakReminderEnabled) {
    suggestions.push("Enable break reminders to maintain healthy usage.");
  }
  if (weekly.trend === 'increasing') {
    suggestions.push("Your usage has been increasing. Is everything okay?");
  }

  return {
    todayMinutes,
    weeklyAverageMinutes,
    mostUsedScreen,
    peakUsageTime,
    consistencyScore: Math.round(consistencyScore),
    healthScore,
    suggestions,
  };
}

/**
 * Get context for Claude AI coach
 */
export async function getScreenTimeContextForClaude(): Promise<ScreenTimeContextForClaude> {
  const todayMinutes = await getTodayScreenTimeMinutes();
  const currentSessionMinutes = Math.round(getCurrentSessionDuration() / 60);
  const today = await getDailyScreenTime();
  const weekly = await getWeeklyScreenTime();
  const settings = await getScreenTimeSettings();
  const insights = await getScreenTimeInsights();

  // Find most used feature today
  let mostUsedFeature = 'coach';
  if (today?.screens) {
    const screens = Object.entries(today.screens);
    if (screens.length > 0) {
      screens.sort((a, b) => b[1] - a[1]);
      mostUsedFeature = screens[0][0].replace(/\//g, ' ').trim() || 'coach';
    }
  }

  return {
    todayUsage: {
      totalMinutes: todayMinutes,
      sessionCount: today?.sessionCount || 1,
      currentSessionMinutes,
      isOverDailyGoal: todayMinutes > (settings.dailyGoalMinutes || 60),
      mostUsedFeature,
    },
    weeklyPattern: {
      averageMinutesPerDay: Math.round(weekly.dailyAverage / 60),
      trend: weekly.trend,
      mostActiveDay: weekly.mostActiveDay,
      peakUsageHour: today?.peakUsageHour || 10,
    },
    healthIndicators: {
      takesBreaks: settings.breakReminderEnabled,
      usesNightMode: settings.nightModeEnabled,
      hasHealthyBoundaries: todayMinutes <= (settings.dailyGoalMinutes || 60),
      consistencyScore: insights.consistencyScore,
    },
    insights: insights.suggestions,
  };
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clear all screen time data (for privacy/reset)
 */
export async function clearAllScreenTimeData(): Promise<void> {
  await endSession();

  // Get all keys and remove screen time related ones
  const allKeys = await AsyncStorage.getAllKeys();
  const screenTimeKeys = allKeys.filter(k =>
    k.startsWith('@screen_time_')
  );

  await AsyncStorage.multiRemove(screenTimeKeys);
}

/**
 * Cleanup old data (older than 30 days)
 */
export async function cleanupOldScreenTimeData(): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const allKeys = await AsyncStorage.getAllKeys();
  const dailyKeys = allKeys.filter(k => k.startsWith(STORAGE_KEYS.DAILY_DATA));

  for (const key of dailyKeys) {
    const dateStr = key.replace(STORAGE_KEYS.DAILY_DATA, '');
    const keyDate = new Date(dateStr);
    if (keyDate < thirtyDaysAgo) {
      await AsyncStorage.removeItem(key);
    }
  }
}
