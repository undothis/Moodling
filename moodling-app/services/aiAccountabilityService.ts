/**
 * AI Accountability Service
 *
 * Enables the AI to automatically create:
 * - Twigs (Quick Logs) for habit tracking
 * - Calendar events for reminders and appointments
 * - Address book contacts
 * - Limit-based alerts (e.g., "max 4 coffees/day")
 *
 * The AI can detect accountability requests from conversation and offer
 * to create appropriate tracking/reminders without user navigating to settings.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Calendar from 'expo-calendar';
import * as Contacts from 'expo-contacts';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  createQuickLog,
  QuickLog,
  QuickLogType,
  LogFrequency,
  getTodayCount,
  logEntry,
} from './quickLogsService';

// Storage keys
const ACCOUNTABILITY_GOALS_KEY = 'moodleaf_accountability_goals';
const LIMIT_ALERTS_KEY = 'moodleaf_limit_alerts';
const AI_CREATED_ITEMS_KEY = 'moodleaf_ai_created_items';

// ============================================
// TYPES
// ============================================

/**
 * A goal detected from user conversation
 */
export interface AccountabilityGoal {
  id: string;
  type: 'limit' | 'build' | 'break' | 'reminder' | 'contact';
  description: string;
  detectedFrom: string; // The user message that triggered this
  createdAt: string;

  // For limit-based goals
  maxPerDay?: number;
  maxPerWeek?: number;

  // For habit goals
  targetPerDay?: number;
  targetPerWeek?: number;

  // For reminders
  reminderTime?: string;
  reminderDays?: string[]; // ['monday', 'tuesday', etc.]

  // Linked items
  linkedTwigId?: string;
  linkedCalendarEventId?: string;
  linkedContactId?: string;

  isActive: boolean;
}

/**
 * A limit alert configuration
 */
export interface LimitAlert {
  id: string;
  twigId: string;
  twigName: string;
  maxLimit: number;
  alertType: 'approaching' | 'reached' | 'exceeded';
  thresholdPercent: number; // e.g., 75 = alert at 75% of limit
  isActive: boolean;
  lastTriggered?: string;
}

/**
 * Intent detected from user message
 */
export interface DetectedIntent {
  type: 'create_twig' | 'create_reminder' | 'create_contact' | 'set_limit' | 'track_habit' | 'none';
  confidence: number; // 0-1
  details: {
    name?: string;
    emoji?: string;
    limit?: number;
    frequency?: 'daily' | 'weekly';
    time?: string;
    days?: string[];
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    habitType?: 'build' | 'break';
  };
  suggestedResponse?: string;
}

/**
 * Result of AI creating something
 */
export interface AICreationResult {
  success: boolean;
  type: 'twig' | 'calendar_event' | 'contact' | 'limit_alert';
  itemId?: string;
  itemName?: string;
  error?: string;
  permissionNeeded?: 'calendar' | 'contacts' | 'notifications';
}

/**
 * Items created by AI for tracking
 */
export interface AICreatedItem {
  id: string;
  type: 'twig' | 'calendar_event' | 'contact' | 'limit_alert';
  itemId: string;
  itemName: string;
  createdAt: string;
  fromMessage: string;
}

// ============================================
// INTENT DETECTION
// ============================================

/**
 * Patterns for detecting user intent from messages
 */
const INTENT_PATTERNS = {
  limit: [
    /(?:want|trying|need)\s+(?:to\s+)?(?:limit|reduce|cut\s+(?:back|down)|have\s+(?:less|fewer))\s+(?:my\s+)?(.+?)(?:\s+to\s+)?(\d+)?/i,
    /(?:only|max|maximum|no\s+more\s+than)\s+(\d+)\s+(.+?)(?:\s+(?:per|a|each)\s+day)?/i,
    /(?:max|limit)\s+(.+?)\s+(?:to\s+)?(\d+)/i,
    /(\d+)\s+(.+?)\s+(?:max|limit|maximum)/i,
  ],
  build: [
    /(?:want|trying|need|help\s+me)\s+(?:to\s+)?(?:start|build|develop|do\s+more)\s+(.+)/i,
    /(?:remind|help)\s+(?:me\s+)?(?:to\s+)?(.+?)\s+(?:more\s+)?(?:often|regularly|daily|every\s+day)/i,
    /(?:want|need)\s+(?:to\s+)?(.+?)\s+(?:more|regularly|daily)/i,
  ],
  break: [
    /(?:want|trying|need|help\s+me)\s+(?:to\s+)?(?:stop|quit|break|reduce|cut\s+(?:out|down))\s+(.+)/i,
    /(?:less|fewer|no\s+more)\s+(.+)/i,
    /(?:don't\s+want\s+to|shouldn't|stop)\s+(.+)/i,
  ],
  reminder: [
    /(?:remind|alert|notify)\s+(?:me\s+)?(?:to\s+)?(.+?)\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    /(?:set\s+(?:a\s+)?reminder|remind\s+me)\s+(?:to\s+)?(.+)/i,
    /(?:remind|alert)\s+(?:me\s+)?(?:every|on)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  ],
  contact: [
    /(?:add|save|create)\s+(?:a\s+)?contact\s+(?:for\s+)?(.+)/i,
    /(?:save|add)\s+(.+?)(?:'s)?\s+(?:number|phone|email)/i,
    /(?:remember|save)\s+(.+?)(?:'s)?\s+(?:contact\s+)?(?:info|information|details)/i,
  ],
};

/**
 * Emoji suggestions based on keywords
 */
const EMOJI_SUGGESTIONS: Record<string, string> = {
  coffee: '☕',
  caffeine: '☕',
  water: '💧',
  exercise: '🏃',
  workout: '💪',
  gym: '🏋️',
  walk: '🚶',
  run: '🏃',
  meditate: '🧘',
  meditation: '🧘',
  sleep: '😴',
  read: '📚',
  book: '📚',
  phone: '📱',
  screen: '📱',
  social: '📵',
  alcohol: '🍷',
  drink: '🍺',
  smoke: '🚭',
  cigarette: '🚭',
  food: '🍽️',
  eat: '🍽️',
  snack: '🍪',
  sugar: '🍬',
  outside: '🌳',
  nature: '🌲',
  journal: '📝',
  write: '✍️',
  call: '📞',
  friend: '👥',
  family: '👨‍👩‍👧',
  stretch: '🙆',
  yoga: '🧘',
  shower: '🚿',
  teeth: '🪥',
  medicine: '💊',
  meds: '💊',
  vitamin: '💊',
  pill: '💊',
  study: '📖',
  work: '💼',
  break: '⏸️',
  rest: '🛋️',
  nap: '😴',
  breathing: '🌬️',
  anxiety: '🌊',
  stress: '😤',
  happy: '😊',
  gratitude: '🙏',
  money: '💰',
  spending: '💸',
  shopping: '🛍️',
  computer: '💻',
  tv: '📺',
  gaming: '🎮',
};

/**
 * Detect intent from a user message
 */
export function detectIntent(message: string): DetectedIntent {
  const lowerMessage = message.toLowerCase();

  // Check for limit patterns
  for (const pattern of INTENT_PATTERNS.limit) {
    const match = message.match(pattern);
    if (match) {
      const hasNumber = match.some(m => /^\d+$/.test(m));
      const numberMatch = match.find(m => /^\d+$/.test(m));
      const nameMatch = match.find(m => m && !/^\d+$/.test(m) && m !== match[0]);

      return {
        type: 'set_limit',
        confidence: hasNumber ? 0.9 : 0.7,
        details: {
          name: nameMatch?.trim(),
          limit: numberMatch ? parseInt(numberMatch) : undefined,
          emoji: findEmoji(lowerMessage),
          frequency: lowerMessage.includes('week') ? 'weekly' : 'daily',
        },
        suggestedResponse: `I can help you track that! Would you like me to create a "${nameMatch?.trim() || 'this'}" tracker${numberMatch ? ` with a limit of ${numberMatch} per day` : ''}?`,
      };
    }
  }

  // Check for habit building patterns
  for (const pattern of INTENT_PATTERNS.build) {
    const match = message.match(pattern);
    if (match) {
      const habitName = match[1]?.trim();
      return {
        type: 'track_habit',
        confidence: 0.8,
        details: {
          name: habitName,
          emoji: findEmoji(lowerMessage),
          habitType: 'build',
          frequency: 'daily',
        },
        suggestedResponse: `I can help you build that habit! Want me to create a "${habitName}" Twig so you can track your progress?`,
      };
    }
  }

  // Check for habit breaking patterns
  for (const pattern of INTENT_PATTERNS.break) {
    const match = message.match(pattern);
    if (match) {
      const habitName = match[1]?.trim();
      return {
        type: 'track_habit',
        confidence: 0.8,
        details: {
          name: habitName,
          emoji: findEmoji(lowerMessage),
          habitType: 'break',
          frequency: 'daily',
        },
        suggestedResponse: `I can help you work on that! Want me to create a tracker for "${habitName}" so we can celebrate your progress?`,
      };
    }
  }

  // Check for reminder patterns
  for (const pattern of INTENT_PATTERNS.reminder) {
    const match = message.match(pattern);
    if (match) {
      return {
        type: 'create_reminder',
        confidence: 0.85,
        details: {
          name: match[1]?.trim(),
          time: match[2]?.trim(),
        },
        suggestedResponse: `I can set that reminder for you! Should I add it to your calendar?`,
      };
    }
  }

  // Check for contact patterns
  for (const pattern of INTENT_PATTERNS.contact) {
    const match = message.match(pattern);
    if (match) {
      return {
        type: 'create_contact',
        confidence: 0.75,
        details: {
          contactName: match[1]?.trim(),
        },
        suggestedResponse: `I can save that contact for you. What's their phone number or email?`,
      };
    }
  }

  return {
    type: 'none',
    confidence: 0,
    details: {},
  };
}

/**
 * Find appropriate emoji for a habit/item
 */
function findEmoji(text: string): string {
  for (const [keyword, emoji] of Object.entries(EMOJI_SUGGESTIONS)) {
    if (text.includes(keyword)) {
      return emoji;
    }
  }
  return '📊'; // Default tracking emoji
}

// ============================================
// TWIG (QUICK LOG) CREATION
// ============================================

/**
 * AI creates a Twig from detected intent
 */
export async function aiCreateTwig(
  intent: DetectedIntent,
  userMessage: string
): Promise<AICreationResult> {
  try {
    const name = intent.details.name || 'Tracked item';
    const emoji = intent.details.emoji || '📊';

    let type: QuickLogType = 'custom';
    let options: Partial<QuickLog> = {};

    if (intent.type === 'set_limit') {
      type = 'habit_break';
      options = {
        frequency: intent.details.frequency === 'weekly' ? 'weekly' : 'multiple_daily',
        invertedTracking: true, // Success = NOT doing it
      };
    } else if (intent.details.habitType === 'build') {
      type = 'habit_build';
      options = {
        frequency: intent.details.frequency === 'weekly' ? 'weekly' : 'daily',
      };
    } else if (intent.details.habitType === 'break') {
      type = 'habit_break';
      options = {
        frequency: 'daily',
        invertedTracking: true,
      };
    }

    const twig = await createQuickLog(name, emoji, type, options);

    // If there's a limit, create a limit alert
    if (intent.details.limit) {
      await createLimitAlert(twig.id, name, intent.details.limit);
    }

    // Track AI-created item
    await trackAICreatedItem('twig', twig.id, name, userMessage);

    return {
      success: true,
      type: 'twig',
      itemId: twig.id,
      itemName: name,
    };
  } catch (error) {
    return {
      success: false,
      type: 'twig',
      error: error instanceof Error ? error.message : 'Failed to create Twig',
    };
  }
}

/**
 * AI creates a Twig with specific parameters (called when user confirms)
 */
export async function aiCreateTwigWithParams(params: {
  name: string;
  emoji?: string;
  type: QuickLogType;
  frequency?: LogFrequency;
  maxLimit?: number;
  targetPerDay?: number;
  reminderEnabled?: boolean;
  reminderTimes?: string[];
  userMessage: string;
}): Promise<AICreationResult> {
  try {
    const twig = await createQuickLog(
      params.name,
      params.emoji || findEmoji(params.name.toLowerCase()),
      params.type,
      {
        frequency: params.frequency || 'daily',
        targetPerDay: params.targetPerDay,
        reminderEnabled: params.reminderEnabled,
        reminderTimes: params.reminderTimes,
        invertedTracking: params.type === 'habit_break',
      }
    );

    // Create limit alert if specified
    if (params.maxLimit) {
      await createLimitAlert(twig.id, params.name, params.maxLimit);
    }

    // Track AI-created item
    await trackAICreatedItem('twig', twig.id, params.name, params.userMessage);

    return {
      success: true,
      type: 'twig',
      itemId: twig.id,
      itemName: params.name,
    };
  } catch (error) {
    return {
      success: false,
      type: 'twig',
      error: error instanceof Error ? error.message : 'Failed to create Twig',
    };
  }
}

// ============================================
// LIMIT ALERTS
// ============================================

/**
 * Create a limit alert for a Twig
 */
export async function createLimitAlert(
  twigId: string,
  twigName: string,
  maxLimit: number,
  thresholdPercent: number = 75
): Promise<LimitAlert> {
  const alerts = await getLimitAlerts();

  const alert: LimitAlert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    twigId,
    twigName,
    maxLimit,
    alertType: 'approaching',
    thresholdPercent,
    isActive: true,
  };

  alerts.push(alert);
  await AsyncStorage.setItem(LIMIT_ALERTS_KEY, JSON.stringify(alerts));

  return alert;
}

/**
 * Get all limit alerts
 */
export async function getLimitAlerts(): Promise<LimitAlert[]> {
  try {
    const data = await AsyncStorage.getItem(LIMIT_ALERTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Check if any limits are approaching or exceeded
 * Returns alerts that should be shown to user
 */
export async function checkLimitAlerts(): Promise<Array<{
  alert: LimitAlert;
  currentCount: number;
  status: 'approaching' | 'reached' | 'exceeded';
  message: string;
}>> {
  const alerts = await getLimitAlerts();
  const triggeredAlerts: Array<{
    alert: LimitAlert;
    currentCount: number;
    status: 'approaching' | 'reached' | 'exceeded';
    message: string;
  }> = [];

  for (const alert of alerts) {
    if (!alert.isActive) continue;

    const currentCount = await getTodayCount(alert.twigId);
    const threshold = Math.floor(alert.maxLimit * (alert.thresholdPercent / 100));

    let status: 'approaching' | 'reached' | 'exceeded' | null = null;
    let message = '';

    if (currentCount > alert.maxLimit) {
      status = 'exceeded';
      message = `You've had ${currentCount} ${alert.twigName} today - that's ${currentCount - alert.maxLimit} over your limit of ${alert.maxLimit}. No judgment, just data. Tomorrow is a fresh start.`;
    } else if (currentCount === alert.maxLimit) {
      status = 'reached';
      message = `You've reached your limit of ${alert.maxLimit} ${alert.twigName} for today. You've got this!`;
    } else if (currentCount >= threshold) {
      status = 'approaching';
      message = `Heads up: You've had ${currentCount}/${alert.maxLimit} ${alert.twigName} today. ${alert.maxLimit - currentCount} left if you want to stay within your goal.`;
    }

    if (status) {
      triggeredAlerts.push({
        alert,
        currentCount,
        status,
        message,
      });
    }
  }

  return triggeredAlerts;
}

/**
 * Called when user logs a Twig entry - checks limits and returns alert if needed
 */
export async function onTwigLogged(twigId: string): Promise<{
  shouldAlert: boolean;
  alertMessage?: string;
  status?: 'approaching' | 'reached' | 'exceeded';
} | null> {
  const alerts = await getLimitAlerts();
  const alert = alerts.find(a => a.twigId === twigId && a.isActive);

  if (!alert) return null;

  const currentCount = await getTodayCount(twigId);
  const threshold = Math.floor(alert.maxLimit * (alert.thresholdPercent / 100));

  if (currentCount > alert.maxLimit) {
    return {
      shouldAlert: true,
      alertMessage: `That's ${currentCount} ${alert.twigName} today - ${currentCount - alert.maxLimit} over your goal of ${alert.maxLimit}. Remember: this is information, not judgment.`,
      status: 'exceeded',
    };
  } else if (currentCount === alert.maxLimit) {
    return {
      shouldAlert: true,
      alertMessage: `You've reached your ${alert.twigName} limit for today (${alert.maxLimit}). Nice work staying aware!`,
      status: 'reached',
    };
  } else if (currentCount >= threshold) {
    return {
      shouldAlert: true,
      alertMessage: `${currentCount}/${alert.maxLimit} ${alert.twigName} today. ${alert.maxLimit - currentCount} more to stay on track.`,
      status: 'approaching',
    };
  }

  return { shouldAlert: false };
}

/**
 * Update a limit alert
 */
export async function updateLimitAlert(
  alertId: string,
  updates: Partial<LimitAlert>
): Promise<void> {
  const alerts = await getLimitAlerts();
  const index = alerts.findIndex(a => a.id === alertId);

  if (index !== -1) {
    alerts[index] = { ...alerts[index], ...updates };
    await AsyncStorage.setItem(LIMIT_ALERTS_KEY, JSON.stringify(alerts));
  }
}

/**
 * Delete a limit alert
 */
export async function deleteLimitAlert(alertId: string): Promise<void> {
  const alerts = await getLimitAlerts();
  const filtered = alerts.filter(a => a.id !== alertId);
  await AsyncStorage.setItem(LIMIT_ALERTS_KEY, JSON.stringify(filtered));
}

// ============================================
// CALENDAR INTEGRATION
// ============================================

/**
 * Request calendar permissions
 */
export async function requestCalendarPermission(): Promise<boolean> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Get or create MoodLeaf calendar
 */
async function getMoodLeafCalendar(): Promise<string | null> {
  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

    // Look for existing MoodLeaf calendar
    const moodLeafCal = calendars.find(c => c.title === 'MoodLeaf');
    if (moodLeafCal) return moodLeafCal.id;

    // Create new calendar
    const defaultCalendarSource = Platform.OS === 'ios'
      ? calendars.find(c => c.source?.name === 'iCloud')?.source ||
        calendars.find(c => c.source?.name === 'Default')?.source
      : { isLocalAccount: true, name: 'MoodLeaf', type: Calendar.SourceType.LOCAL };

    if (!defaultCalendarSource) return null;

    const newCalendarId = await Calendar.createCalendarAsync({
      title: 'MoodLeaf',
      color: '#4A7C59', // MoodLeaf green
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: defaultCalendarSource.id,
      source: defaultCalendarSource as Calendar.Source,
      name: 'MoodLeaf',
      ownerAccount: 'MoodLeaf',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });

    return newCalendarId;
  } catch (error) {
    console.error('Failed to get/create calendar:', error);
    return null;
  }
}

/**
 * AI creates a calendar event
 */
export async function aiCreateCalendarEvent(params: {
  title: string;
  notes?: string;
  startDate: Date;
  endDate?: Date;
  allDay?: boolean;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval?: number;
    endDate?: Date;
  };
  reminders?: number[]; // Minutes before event
  userMessage: string;
}): Promise<AICreationResult> {
  try {
    // Check permission
    const hasPermission = await requestCalendarPermission();
    if (!hasPermission) {
      return {
        success: false,
        type: 'calendar_event',
        error: 'Calendar permission needed',
        permissionNeeded: 'calendar',
      };
    }

    const calendarId = await getMoodLeafCalendar();
    if (!calendarId) {
      return {
        success: false,
        type: 'calendar_event',
        error: 'Could not access calendar',
      };
    }

    const endDate = params.endDate || new Date(params.startDate.getTime() + 30 * 60000); // 30 min default

    const eventDetails: Calendar.Event = {
      title: params.title,
      notes: params.notes || 'Created by MoodLeaf AI',
      startDate: params.startDate,
      endDate: endDate,
      allDay: params.allDay || false,
      calendarId,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      alarms: params.reminders?.map(minutes => ({ relativeOffset: -minutes })) || [{ relativeOffset: -15 }],
    };

    // Add recurrence if specified
    if (params.recurrence) {
      eventDetails.recurrenceRule = {
        frequency: params.recurrence.frequency === 'daily'
          ? Calendar.Frequency.DAILY
          : params.recurrence.frequency === 'weekly'
            ? Calendar.Frequency.WEEKLY
            : Calendar.Frequency.MONTHLY,
        interval: params.recurrence.interval || 1,
        endDate: params.recurrence.endDate,
      };
    }

    const eventId = await Calendar.createEventAsync(calendarId, eventDetails);

    // Track AI-created item
    await trackAICreatedItem('calendar_event', eventId, params.title, params.userMessage);

    return {
      success: true,
      type: 'calendar_event',
      itemId: eventId,
      itemName: params.title,
    };
  } catch (error) {
    return {
      success: false,
      type: 'calendar_event',
      error: error instanceof Error ? error.message : 'Failed to create calendar event',
    };
  }
}

/**
 * AI creates a recurring reminder
 */
export async function aiCreateRecurringReminder(params: {
  title: string;
  time: string; // "09:00" format
  days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  notes?: string;
  userMessage: string;
}): Promise<AICreationResult> {
  try {
    const hasPermission = await requestCalendarPermission();
    if (!hasPermission) {
      return {
        success: false,
        type: 'calendar_event',
        error: 'Calendar permission needed',
        permissionNeeded: 'calendar',
      };
    }

    const calendarId = await getMoodLeafCalendar();
    if (!calendarId) {
      return {
        success: false,
        type: 'calendar_event',
        error: 'Could not access calendar',
      };
    }

    // Parse time
    const [hours, minutes] = params.time.split(':').map(Number);

    // Create start date for next occurrence
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    if (startDate < new Date()) {
      startDate.setDate(startDate.getDate() + 1);
    }

    const eventId = await Calendar.createEventAsync(calendarId, {
      title: params.title,
      notes: params.notes || 'MoodLeaf reminder',
      startDate,
      endDate: new Date(startDate.getTime() + 15 * 60000), // 15 min
      calendarId,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      alarms: [{ relativeOffset: 0 }], // Alert at event time
      recurrenceRule: {
        frequency: Calendar.Frequency.WEEKLY,
        interval: 1,
        // Note: Day of week handling would need more logic for specific days
      },
    });

    await trackAICreatedItem('calendar_event', eventId, params.title, params.userMessage);

    return {
      success: true,
      type: 'calendar_event',
      itemId: eventId,
      itemName: params.title,
    };
  } catch (error) {
    return {
      success: false,
      type: 'calendar_event',
      error: error instanceof Error ? error.message : 'Failed to create reminder',
    };
  }
}

// ============================================
// CONTACTS INTEGRATION
// ============================================

/**
 * Request contacts permissions
 */
export async function requestContactsPermission(): Promise<boolean> {
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * AI creates a contact
 */
export async function aiCreateContact(params: {
  firstName: string;
  lastName?: string;
  phoneNumbers?: Array<{ number: string; label?: string }>;
  emails?: Array<{ email: string; label?: string }>;
  notes?: string;
  userMessage: string;
}): Promise<AICreationResult> {
  try {
    const hasPermission = await requestContactsPermission();
    if (!hasPermission) {
      return {
        success: false,
        type: 'contact',
        error: 'Contacts permission needed',
        permissionNeeded: 'contacts',
      };
    }

    const contact: Contacts.Contact = {
      contactType: Contacts.ContactTypes.Person,
      firstName: params.firstName,
      lastName: params.lastName,
      note: params.notes || 'Added via MoodLeaf',
    };

    if (params.phoneNumbers) {
      contact.phoneNumbers = params.phoneNumbers.map(p => ({
        number: p.number,
        label: p.label || 'mobile',
      }));
    }

    if (params.emails) {
      contact.emails = params.emails.map(e => ({
        email: e.email,
        label: e.label || 'home',
      }));
    }

    const contactId = await Contacts.addContactAsync(contact);

    const fullName = params.lastName
      ? `${params.firstName} ${params.lastName}`
      : params.firstName;

    await trackAICreatedItem('contact', contactId, fullName, params.userMessage);

    return {
      success: true,
      type: 'contact',
      itemId: contactId,
      itemName: fullName,
    };
  } catch (error) {
    return {
      success: false,
      type: 'contact',
      error: error instanceof Error ? error.message : 'Failed to create contact',
    };
  }
}

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Send a limit alert notification
 */
export async function sendLimitAlertNotification(
  twigName: string,
  currentCount: number,
  maxLimit: number,
  status: 'approaching' | 'reached' | 'exceeded'
): Promise<void> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  let title = '';
  let body = '';

  switch (status) {
    case 'approaching':
      title = `${twigName} Heads Up`;
      body = `You're at ${currentCount}/${maxLimit}. ${maxLimit - currentCount} left for today.`;
      break;
    case 'reached':
      title = `${twigName} Limit Reached`;
      body = `You've hit your goal of ${maxLimit} for today. Nice awareness!`;
      break;
    case 'exceeded':
      title = `${twigName} Over Limit`;
      body = `${currentCount}/${maxLimit} today. Tomorrow's a fresh start.`;
      break;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'limit_alert', twigName },
    },
    trigger: null, // Immediate
  });
}

// ============================================
// TRACKING AI-CREATED ITEMS
// ============================================

/**
 * Track an item created by AI
 */
async function trackAICreatedItem(
  type: 'twig' | 'calendar_event' | 'contact' | 'limit_alert',
  itemId: string,
  itemName: string,
  fromMessage: string
): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(AI_CREATED_ITEMS_KEY);
    const items: AICreatedItem[] = data ? JSON.parse(data) : [];

    items.push({
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      itemId,
      itemName,
      createdAt: new Date().toISOString(),
      fromMessage,
    });

    // Keep last 100 items
    const trimmed = items.slice(-100);
    await AsyncStorage.setItem(AI_CREATED_ITEMS_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to track AI-created item:', error);
  }
}

/**
 * Get all AI-created items
 */
export async function getAICreatedItems(): Promise<AICreatedItem[]> {
  try {
    const data = await AsyncStorage.getItem(AI_CREATED_ITEMS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ============================================
// CONTEXT FOR AI COACH
// ============================================

/**
 * Get accountability context for the AI coach
 */
export async function getAccountabilityContextForCoach(): Promise<string> {
  const alerts = await getLimitAlerts();
  const triggeredAlerts = await checkLimitAlerts();
  const aiItems = await getAICreatedItems();

  const parts: string[] = [];

  // Active limits
  if (alerts.length > 0) {
    parts.push('ACTIVE LIMITS (user wants to track):');
    for (const alert of alerts.filter(a => a.isActive)) {
      const current = await getTodayCount(alert.twigId);
      parts.push(`  - ${alert.twigName}: ${current}/${alert.maxLimit} today`);
    }
  }

  // Triggered alerts
  if (triggeredAlerts.length > 0) {
    parts.push('\nLIMIT STATUS TODAY:');
    for (const { alert, currentCount, status } of triggeredAlerts) {
      parts.push(`  - ${alert.twigName}: ${status.toUpperCase()} (${currentCount}/${alert.maxLimit})`);
    }
  }

  // Recent AI creations
  const recentItems = aiItems.slice(-5);
  if (recentItems.length > 0) {
    parts.push('\nRECENTLY CREATED BY AI:');
    for (const item of recentItems) {
      parts.push(`  - ${item.type}: "${item.itemName}"`);
    }
  }

  return parts.join('\n');
}

/**
 * Check if AI should proactively mention limit status
 * Respects user preferences for accountability intensity and paused status
 */
export async function shouldMentionLimits(): Promise<{
  shouldMention: boolean;
  context?: string;
}> {
  // Check if accountability is paused
  if (await isAccountabilityPaused()) {
    return { shouldMention: false };
  }

  // Check intensity preference
  const prefs = await getAccountabilityPreferences();
  if (prefs.intensity === 'off') {
    return { shouldMention: false };
  }

  const triggered = await checkLimitAlerts();

  if (triggered.length === 0) {
    return { shouldMention: false };
  }

  const exceeded = triggered.filter(t => t.status === 'exceeded');
  const reached = triggered.filter(t => t.status === 'reached');
  const approaching = triggered.filter(t => t.status === 'approaching');

  // For gentle intensity, only mention if significantly exceeded
  if (prefs.intensity === 'gentle') {
    if (exceeded.length > 0) {
      return {
        shouldMention: true,
        context: `User has exceeded their limit on: ${exceeded.map(t => t.alert.twigName).join(', ')}. User prefers GENTLE accountability - be very soft and supportive, don't dwell on it.`,
      };
    }
    return { shouldMention: false };
  }

  // For moderate intensity, mention exceeded and reached
  if (prefs.intensity === 'moderate') {
    if (exceeded.length > 0) {
      return {
        shouldMention: true,
        context: `User has exceeded their limit on: ${exceeded.map(t => t.alert.twigName).join(', ')}. Be supportive, not judgmental.`,
      };
    }

    if (reached.length > 0) {
      return {
        shouldMention: true,
        context: `User has reached their limit on: ${reached.map(t => t.alert.twigName).join(', ')}. Acknowledge their awareness.`,
      };
    }
    return { shouldMention: false };
  }

  // For proactive intensity, mention all including approaching
  if (prefs.intensity === 'proactive') {
    if (exceeded.length > 0) {
      return {
        shouldMention: true,
        context: `User has exceeded their limit on: ${exceeded.map(t => t.alert.twigName).join(', ')}. User wants proactive accountability - you can check in on how they're feeling about this.`,
      };
    }

    if (reached.length > 0) {
      return {
        shouldMention: true,
        context: `User has reached their limit on: ${reached.map(t => t.alert.twigName).join(', ')}. Acknowledge and encourage.`,
      };
    }

    if (approaching.length > 0) {
      return {
        shouldMention: true,
        context: `User is approaching their limit on: ${approaching.map(t => `${t.alert.twigName} (${t.currentCount}/${t.alert.maxLimit})`).join(', ')}. Gentle heads up is appropriate.`,
      };
    }
  }

  return { shouldMention: false };
}

// ============================================
// HELPER: PARSE TIME FROM TEXT
// ============================================

/**
 * Parse time from natural language
 */
export function parseTimeFromText(text: string): string | null {
  // Match patterns like "9am", "9:30 pm", "14:00"
  const patterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)?/i,
    /(\d{1,2})\s*(am|pm)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2] && !isNaN(parseInt(match[2])) ? parseInt(match[2]) : 0;
      const ampm = match[3]?.toLowerCase() || match[2]?.toLowerCase();

      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Parse days of week from text
 */
export function parseDaysFromText(text: string): string[] {
  const days: string[] = [];
  const dayMap: Record<string, string> = {
    'monday': 'monday', 'mon': 'monday',
    'tuesday': 'tuesday', 'tue': 'tuesday', 'tues': 'tuesday',
    'wednesday': 'wednesday', 'wed': 'wednesday',
    'thursday': 'thursday', 'thu': 'thursday', 'thur': 'thursday', 'thurs': 'thursday',
    'friday': 'friday', 'fri': 'friday',
    'saturday': 'saturday', 'sat': 'saturday',
    'sunday': 'sunday', 'sun': 'sunday',
    'weekday': 'weekdays',
    'weekend': 'weekends',
    'everyday': 'all',
    'every day': 'all',
    'daily': 'all',
  };

  const lower = text.toLowerCase();

  for (const [key, value] of Object.entries(dayMap)) {
    if (lower.includes(key)) {
      if (value === 'weekdays') {
        days.push('monday', 'tuesday', 'wednesday', 'thursday', 'friday');
      } else if (value === 'weekends') {
        days.push('saturday', 'sunday');
      } else if (value === 'all') {
        return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      } else {
        days.push(value);
      }
    }
  }

  return [...new Set(days)]; // Remove duplicates
}

// ============================================
// ACCOUNTABILITY PREFERENCES
// ============================================

const ACCOUNTABILITY_PREFS_KEY = 'moodleaf_accountability_prefs';

/**
 * Accountability intensity level
 */
export type AccountabilityIntensity = 'off' | 'gentle' | 'moderate' | 'proactive';

/**
 * User preferences for accountability
 */
export interface AccountabilityPreferences {
  intensity: AccountabilityIntensity;
  pausedUntil?: string; // ISO date - pause until this date
  pausedItems?: string[]; // Specific twig IDs paused for today
  lastAskedAboutComfort?: string; // When we last asked if we're being too pushy
  userFeedback?: string; // User's last feedback about accountability style
}

/**
 * Get accountability preferences
 */
export async function getAccountabilityPreferences(): Promise<AccountabilityPreferences> {
  try {
    const data = await AsyncStorage.getItem(ACCOUNTABILITY_PREFS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Default
  }
  return {
    intensity: 'moderate', // Default to moderate
  };
}

/**
 * Save accountability preferences
 */
export async function setAccountabilityPreferences(
  prefs: Partial<AccountabilityPreferences>
): Promise<void> {
  const current = await getAccountabilityPreferences();
  const updated = { ...current, ...prefs };
  await AsyncStorage.setItem(ACCOUNTABILITY_PREFS_KEY, JSON.stringify(updated));
}

/**
 * Pause accountability for today
 */
export async function pauseAccountabilityForToday(twigIds?: string[]): Promise<void> {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  await setAccountabilityPreferences({
    pausedUntil: today.toISOString(),
    pausedItems: twigIds,
  });
}

/**
 * Resume accountability
 */
export async function resumeAccountability(): Promise<void> {
  await setAccountabilityPreferences({
    pausedUntil: undefined,
    pausedItems: undefined,
  });
}

/**
 * Check if accountability is currently paused
 */
export async function isAccountabilityPaused(twigId?: string): Promise<boolean> {
  const prefs = await getAccountabilityPreferences();

  if (prefs.pausedUntil) {
    const pauseEnd = new Date(prefs.pausedUntil);
    if (new Date() < pauseEnd) {
      // If specific twig, check if it's in the paused list
      if (twigId && prefs.pausedItems && prefs.pausedItems.length > 0) {
        return prefs.pausedItems.includes(twigId);
      }
      // All paused if no specific items
      return !prefs.pausedItems || prefs.pausedItems.length === 0;
    }
  }
  return false;
}

/**
 * Set accountability intensity
 */
export async function setAccountabilityIntensity(
  intensity: AccountabilityIntensity
): Promise<void> {
  await setAccountabilityPreferences({ intensity });
}

/**
 * Record user feedback about accountability
 */
export async function recordAccountabilityFeedback(feedback: string): Promise<void> {
  await setAccountabilityPreferences({
    userFeedback: feedback,
    lastAskedAboutComfort: new Date().toISOString(),
  });
}

/**
 * Check if we should ask about accountability comfort level
 * (Don't ask more than once every 7 days)
 */
export async function shouldAskAboutAccountabilityComfort(): Promise<boolean> {
  const prefs = await getAccountabilityPreferences();

  if (!prefs.lastAskedAboutComfort) {
    return true;
  }

  const lastAsked = new Date(prefs.lastAskedAboutComfort);
  const daysSince = (Date.now() - lastAsked.getTime()) / (1000 * 60 * 60 * 24);

  return daysSince >= 7;
}

/**
 * Get accountability preferences context for the coach
 */
export async function getAccountabilityPreferencesContext(): Promise<string> {
  const prefs = await getAccountabilityPreferences();
  const parts: string[] = ['ACCOUNTABILITY PREFERENCES:'];

  parts.push(`  - Intensity: ${prefs.intensity}`);

  if (prefs.intensity === 'off') {
    parts.push('  - NOTE: User has turned off accountability. Do NOT mention limits or tracked items unless they ask.');
  } else if (prefs.intensity === 'gentle') {
    parts.push('  - NOTE: User prefers gentle accountability. Only mention limits if they exceed them significantly. Be very soft in your approach.');
  } else if (prefs.intensity === 'proactive') {
    parts.push('  - NOTE: User wants proactive accountability. Feel free to check in on their limits and offer encouragement.');
  }

  if (await isAccountabilityPaused()) {
    parts.push('  - STATUS: Accountability is PAUSED for today. Do NOT mention any limits or tracking.');
  }

  if (prefs.userFeedback) {
    parts.push(`  - User feedback: "${prefs.userFeedback}"`);
  }

  const shouldAsk = await shouldAskAboutAccountabilityComfort();
  if (shouldAsk && prefs.intensity !== 'off') {
    parts.push('  - OPTIONAL: Consider asking if the accountability level feels right (but only if natural in conversation)');
  }

  return parts.join('\n');
}
