/**
 * Calendar Service
 *
 * Integrates with iOS Calendar (via expo-calendar) for event context.
 * Provides: upcoming events, travel detection, meeting awareness.
 *
 * Following Mood Leaf Ethics:
 * - Data stays on device
 * - User controls permissions
 * - Never judge based on calendar
 * - Context, not surveillance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage keys
const CALENDAR_ENABLED_KEY = 'moodleaf_calendar_enabled';
const CALENDAR_CACHE_KEY = 'moodleaf_calendar_cache';
const CALENDAR_PERMISSIONS_KEY = 'moodleaf_calendar_permissions';

/**
 * A calendar event
 */
export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  location?: string;
  notes?: string;
  isAllDay: boolean;
  calendarName?: string;
}

/**
 * Detected travel event
 */
export interface TravelEvent {
  event: CalendarEvent;
  destination?: string;
  isMultiDay: boolean;
  daysAway: number;
  possibleTimezoneChange: boolean;
}

/**
 * Calendar context for AI
 */
export interface CalendarContext {
  upcomingToday: CalendarEvent[];
  upcomingThisWeek: CalendarEvent[];
  nextEvent?: CalendarEvent;
  travelEvents: TravelEvent[];
  busyLevel: 'light' | 'moderate' | 'busy' | 'packed';
  hasImportantEvent: boolean;
  lastUpdated: string;
}

// Keywords that suggest travel
const TRAVEL_KEYWORDS = [
  'flight', 'fly', 'airport', 'travel', 'trip', 'vacation', 'holiday',
  'hotel', 'airbnb', 'conference', 'visit', 'abroad', 'international'
];

// Keywords that suggest important events
const IMPORTANT_KEYWORDS = [
  'interview', 'meeting', 'presentation', 'deadline', 'doctor', 'therapy',
  'appointment', 'exam', 'test', 'wedding', 'funeral', 'birthday', 'anniversary'
];

/**
 * Check if calendar integration is enabled
 */
export async function isCalendarEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(CALENDAR_ENABLED_KEY);
    return enabled === 'true';
  } catch {
    return false;
  }
}

/**
 * Enable calendar integration
 */
export async function enableCalendar(): Promise<boolean> {
  try {
    // Check if expo-calendar is available
    let Calendar;
    try {
      Calendar = require('expo-calendar');
    } catch {
      console.log('expo-calendar not available');
      return false;
    }

    // Request permissions
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      console.log('Calendar permission denied');
      return false;
    }

    await AsyncStorage.setItem(CALENDAR_ENABLED_KEY, 'true');
    await AsyncStorage.setItem(CALENDAR_PERMISSIONS_KEY, 'granted');
    return true;
  } catch (error) {
    console.error('Failed to enable calendar:', error);
    return false;
  }
}

/**
 * Disable calendar integration
 */
export async function disableCalendar(): Promise<void> {
  try {
    await AsyncStorage.setItem(CALENDAR_ENABLED_KEY, 'false');
    await AsyncStorage.removeItem(CALENDAR_CACHE_KEY);
  } catch (error) {
    console.error('Failed to disable calendar:', error);
  }
}

/**
 * Fetch upcoming events from device calendar
 */
export async function fetchUpcomingEvents(daysAhead: number = 7): Promise<CalendarEvent[]> {
  try {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return [];
    }

    const enabled = await isCalendarEnabled();
    if (!enabled) {
      return [];
    }

    let Calendar;
    try {
      Calendar = require('expo-calendar');
    } catch {
      return [];
    }

    // Get all calendars
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    if (!calendars || calendars.length === 0) {
      return [];
    }

    // Get calendar IDs
    const calendarIds = calendars.map((cal: { id: string }) => cal.id);

    // Get events for the next N days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);

    const events = await Calendar.getEventsAsync(
      calendarIds,
      startDate,
      endDate
    );

    // Transform to our format
    const transformedEvents: CalendarEvent[] = events.map((event: {
      id: string;
      title: string;
      startDate: string;
      endDate: string;
      location?: string;
      notes?: string;
      allDay: boolean;
      calendar?: { title: string };
    }) => ({
      id: event.id,
      title: event.title || 'Untitled Event',
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      notes: event.notes,
      isAllDay: event.allDay,
      calendarName: event.calendar?.title,
    }));

    // Sort by start date
    transformedEvents.sort((a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    return transformedEvents;
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    return [];
  }
}

/**
 * Detect travel events from calendar
 */
function detectTravelEvents(events: CalendarEvent[]): TravelEvent[] {
  const travelEvents: TravelEvent[] = [];

  for (const event of events) {
    const titleLower = event.title.toLowerCase();
    const locationLower = (event.location || '').toLowerCase();
    const notesLower = (event.notes || '').toLowerCase();
    const combined = `${titleLower} ${locationLower} ${notesLower}`;

    const isTravelRelated = TRAVEL_KEYWORDS.some(keyword =>
      combined.includes(keyword)
    );

    if (isTravelRelated || event.isAllDay) {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      const now = new Date();

      const daysUntil = Math.ceil(
        (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const durationDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if location suggests timezone change
      const possibleTimezoneChange =
        locationLower.includes('international') ||
        locationLower.includes('abroad') ||
        /\b[A-Z]{3}\b/.test(event.location || ''); // Airport codes

      if (isTravelRelated) {
        travelEvents.push({
          event,
          destination: event.location,
          isMultiDay: durationDays > 1,
          daysAway: daysUntil,
          possibleTimezoneChange,
        });
      }
    }
  }

  return travelEvents;
}

/**
 * Check if an event seems important
 */
function isImportantEvent(event: CalendarEvent): boolean {
  const titleLower = event.title.toLowerCase();
  return IMPORTANT_KEYWORDS.some(keyword => titleLower.includes(keyword));
}

/**
 * Calculate busy level from events
 */
function calculateBusyLevel(todayEvents: CalendarEvent[], weekEvents: CalendarEvent[]): 'light' | 'moderate' | 'busy' | 'packed' {
  const todayCount = todayEvents.length;
  const weekCount = weekEvents.length;

  if (todayCount >= 5 || weekCount >= 20) return 'packed';
  if (todayCount >= 3 || weekCount >= 12) return 'busy';
  if (todayCount >= 1 || weekCount >= 5) return 'moderate';
  return 'light';
}

/**
 * Get calendar context for AI
 */
export async function getCalendarContext(): Promise<CalendarContext | null> {
  try {
    const enabled = await isCalendarEnabled();
    if (!enabled) {
      return null;
    }

    const events = await fetchUpcomingEvents(7);

    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Filter today's events
    const upcomingToday = events.filter(event => {
      const start = new Date(event.startDate);
      return start >= now && start <= todayEnd;
    });

    // Next event
    const nextEvent = events.find(event => new Date(event.startDate) > now);

    // Travel detection
    const travelEvents = detectTravelEvents(events);

    // Important event check
    const hasImportantEvent = events.some(isImportantEvent);

    // Busy level
    const busyLevel = calculateBusyLevel(upcomingToday, events);

    const context: CalendarContext = {
      upcomingToday,
      upcomingThisWeek: events,
      nextEvent,
      travelEvents,
      busyLevel,
      hasImportantEvent,
      lastUpdated: new Date().toISOString(),
    };

    // Cache the context
    await AsyncStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify(context));

    return context;
  } catch (error) {
    console.error('Failed to get calendar context:', error);
    return null;
  }
}

/**
 * Format calendar context for Claude AI
 */
export async function getCalendarContextForClaude(): Promise<string> {
  try {
    const context = await getCalendarContext();
    if (!context) {
      return '';
    }

    const parts: string[] = ['CALENDAR CONTEXT:'];

    // Today's schedule
    if (context.upcomingToday.length > 0) {
      parts.push(`\nToday's upcoming events (${context.upcomingToday.length}):`);
      for (const event of context.upcomingToday.slice(0, 5)) {
        const time = new Date(event.startDate).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        });
        const location = event.location ? ` at ${event.location}` : '';
        parts.push(`  - ${time}: ${event.title}${location}`);
      }
    } else {
      parts.push('\nNo more events scheduled for today.');
    }

    // Next event
    if (context.nextEvent) {
      const nextStart = new Date(context.nextEvent.startDate);
      const now = new Date();
      const hoursUntil = Math.round(
        (nextStart.getTime() - now.getTime()) / (1000 * 60 * 60)
      );

      if (hoursUntil < 24) {
        parts.push(`\nNext event in ${hoursUntil} hours: ${context.nextEvent.title}`);
      }
    }

    // Busy level
    parts.push(`\nWeek busyness: ${context.busyLevel} (${context.upcomingThisWeek.length} events this week)`);

    // Travel awareness
    if (context.travelEvents.length > 0) {
      parts.push('\nUpcoming travel:');
      for (const travel of context.travelEvents) {
        const daysText = travel.daysAway <= 0 ? 'Today' :
          travel.daysAway === 1 ? 'Tomorrow' :
            `In ${travel.daysAway} days`;
        const dest = travel.destination ? ` to ${travel.destination}` : '';
        const tz = travel.possibleTimezoneChange ? ' (possible timezone change)' : '';
        parts.push(`  - ${daysText}: ${travel.event.title}${dest}${tz}`);
      }
    }

    // Important event flag
    if (context.hasImportantEvent) {
      parts.push('\nNote: User has an important event this week (interview/appointment/deadline).');
    }

    return parts.join('\n');
  } catch (error) {
    console.error('Failed to format calendar context:', error);
    return '';
  }
}

/**
 * Get cached calendar context (for quick access)
 */
export async function getCachedCalendarContext(): Promise<CalendarContext | null> {
  try {
    const cached = await AsyncStorage.getItem(CALENDAR_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if user has travel coming up (for jet lag awareness)
 */
export async function hasUpcomingTravel(): Promise<{
  hasTravelSoon: boolean;
  nextTravel?: TravelEvent;
}> {
  const context = await getCalendarContext();
  if (!context || context.travelEvents.length === 0) {
    return { hasTravelSoon: false };
  }

  const soonTravel = context.travelEvents.find(t => t.daysAway <= 3);
  return {
    hasTravelSoon: !!soonTravel,
    nextTravel: soonTravel || context.travelEvents[0],
  };
}

/**
 * Clear all calendar data
 */
export async function clearCalendarData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      CALENDAR_ENABLED_KEY,
      CALENDAR_CACHE_KEY,
      CALENDAR_PERMISSIONS_KEY,
    ]);
  } catch (error) {
    console.error('Failed to clear calendar data:', error);
  }
}
