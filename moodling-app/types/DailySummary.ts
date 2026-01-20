/**
 * Daily Summary Type
 *
 * Aggregates journal entries and lifestyle factors for a single day.
 * Used for pattern detection and visualization.
 *
 * Following Mood Leaf Ethics:
 * - All tracking is optional
 * - User controls what they track
 * - Data stays on device
 *
 * Unit 10: Pattern Data Model
 */

import { MoodCategory } from '@/services/sentimentAnalysis';

/**
 * Lifestyle factors that users can optionally track
 */
export interface LifestyleFactors {
  caffeineCount?: number;    // Number of caffeinated drinks
  alcoholCount?: number;     // Number of alcoholic drinks
  exerciseMinutes?: number;  // Minutes of exercise
  outdoorMinutes?: number;   // Minutes spent outside
  socialMinutes?: number;    // Minutes spent with people
  sleepHours?: number;       // Hours of sleep (previous night)
}

/**
 * Summary of a single day's data
 */
export interface DailySummary {
  /** Date string in YYYY-MM-DD format */
  date: string;

  /** Number of journal entries */
  entryCount: number;

  /** Average sentiment score (-1 to 1) */
  averageSentiment: number | null;

  /** Dominant mood category for the day */
  moodCategory: MoodCategory | 'unknown';

  /** Optional lifestyle factors */
  factors: LifestyleFactors;

  /** IDs of journal entries for this day */
  entryIds: string[];
}

/**
 * Weekly aggregation of daily summaries
 */
export interface WeeklySummary {
  /** Start date of the week (YYYY-MM-DD) */
  weekStart: string;

  /** End date of the week (YYYY-MM-DD) */
  weekEnd: string;

  /** Daily summaries for the week */
  days: DailySummary[];

  /** Average sentiment for the week */
  averageSentiment: number | null;

  /** Total entries for the week */
  totalEntries: number;

  /** Aggregated factors for the week */
  averageFactors: {
    caffeine: number | null;
    alcohol: number | null;
    exercise: number | null;
    outdoor: number | null;
    social: number | null;
    sleep: number | null;
  };
}

/**
 * Factor metadata for UI display
 */
export interface FactorConfig {
  key: keyof LifestyleFactors;
  label: string;
  emoji: string;
  unit: string;
  step: number;
  max: number;
}

/**
 * Available factors to track
 */
export const TRACKABLE_FACTORS: FactorConfig[] = [
  { key: 'caffeineCount', label: 'Caffeine', emoji: '☕️', unit: '', step: 1, max: 10 },
  { key: 'alcoholCount', label: 'Alcohol', emoji: '🍺', unit: '', step: 1, max: 10 },
  { key: 'exerciseMinutes', label: 'Exercise', emoji: '🏃', unit: 'm', step: 15, max: 180 },
  { key: 'outdoorMinutes', label: 'Outside', emoji: '🌳', unit: 'm', step: 15, max: 480 },
  { key: 'socialMinutes', label: 'Social', emoji: '👥', unit: 'm', step: 15, max: 480 },
  { key: 'sleepHours', label: 'Sleep', emoji: '😴', unit: 'h', step: 0.5, max: 12 },
];

/**
 * Create an empty daily summary for a given date
 */
export function createEmptyDailySummary(date: string): DailySummary {
  return {
    date,
    entryCount: 0,
    averageSentiment: null,
    moodCategory: 'unknown',
    factors: {},
    entryIds: [],
  };
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const today = new Date();
  return formatDateString(today);
}

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to Date object
 */
export function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get mood category from average sentiment
 */
export function getMoodFromSentiment(sentiment: number | null): MoodCategory | 'unknown' {
  if (sentiment === null) return 'unknown';
  if (sentiment >= 0.2) return 'positive';
  if (sentiment >= 0.05) return 'slightly_positive';
  if (sentiment >= -0.05) return 'neutral';
  if (sentiment >= -0.2) return 'slightly_negative';
  if (sentiment >= -0.5) return 'negative';
  return 'very_negative';
}
