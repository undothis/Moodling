/**
 * Pattern Service
 *
 * Aggregates journal entries and lifestyle factors to detect patterns.
 * All data stays on device.
 *
 * Following Mood Leaf Ethics:
 * - Descriptive, not diagnostic
 * - User controls what they track
 * - Patterns are suggestions, not conclusions
 *
 * Unit 10: Pattern Data Model
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { JournalEntry } from '@/types/JournalEntry';
import {
  DailySummary,
  WeeklySummary,
  LifestyleFactors,
  createEmptyDailySummary,
  formatDateString,
  parseDateString,
  getMoodFromSentiment,
} from '@/types/DailySummary';
import { getAllEntries } from './journalStorage';

// Storage keys
const STORAGE_KEYS = {
  DAILY_FACTORS: 'moodling_daily_factors', // Stores factors by date
};

/**
 * Save lifestyle factors for a specific date
 */
export async function saveFactors(date: string, factors: LifestyleFactors): Promise<void> {
  try {
    const allFactors = await loadAllFactors();
    allFactors[date] = factors;
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_FACTORS, JSON.stringify(allFactors));
  } catch (error) {
    console.error('Failed to save factors:', error);
    throw error;
  }
}

/**
 * Load factors for a specific date
 */
export async function getFactors(date: string): Promise<LifestyleFactors> {
  try {
    const allFactors = await loadAllFactors();
    return allFactors[date] || {};
  } catch (error) {
    console.error('Failed to load factors:', error);
    return {};
  }
}

/**
 * Load all stored factors
 */
async function loadAllFactors(): Promise<Record<string, LifestyleFactors>> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_FACTORS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to load all factors:', error);
    return {};
  }
}

/**
 * Get daily summary for a specific date
 */
export async function getDailySummary(date: string): Promise<DailySummary> {
  const entries = await getAllEntries();
  const factors = await getFactors(date);

  // Filter entries for this date
  const dayEntries = entries.filter((entry) => {
    const entryDate = formatDateString(new Date(entry.createdAt));
    return entryDate === date;
  });

  // Calculate average sentiment
  let averageSentiment: number | null = null;
  if (dayEntries.length > 0) {
    const sentiments = dayEntries
      .filter((e) => e.sentiment?.score !== undefined)
      .map((e) => e.sentiment!.score);

    if (sentiments.length > 0) {
      averageSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    }
  }

  return {
    date,
    entryCount: dayEntries.length,
    averageSentiment,
    moodCategory: getMoodFromSentiment(averageSentiment),
    factors,
    entryIds: dayEntries.map((e) => e.id),
  };
}

/**
 * Get summaries for a range of dates
 */
export async function getDailySummaries(startDate: string, endDate: string): Promise<DailySummary[]> {
  const summaries: DailySummary[] = [];
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);

  const current = new Date(start);
  while (current <= end) {
    const dateString = formatDateString(current);
    const summary = await getDailySummary(dateString);
    summaries.push(summary);
    current.setDate(current.getDate() + 1);
  }

  return summaries;
}

/**
 * Get weekly summary
 */
export async function getWeeklySummary(weekStartDate: string): Promise<WeeklySummary> {
  const start = parseDateString(weekStartDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const days = await getDailySummaries(weekStartDate, formatDateString(end));

  // Calculate averages
  const sentiments = days
    .filter((d) => d.averageSentiment !== null)
    .map((d) => d.averageSentiment!);

  const averageSentiment =
    sentiments.length > 0 ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : null;

  const totalEntries = days.reduce((sum, d) => sum + d.entryCount, 0);

  // Aggregate factors
  const factorSums = {
    caffeine: [] as number[],
    alcohol: [] as number[],
    exercise: [] as number[],
    outdoor: [] as number[],
    social: [] as number[],
    sleep: [] as number[],
  };

  for (const day of days) {
    if (day.factors.caffeineCount !== undefined) factorSums.caffeine.push(day.factors.caffeineCount);
    if (day.factors.alcoholCount !== undefined) factorSums.alcohol.push(day.factors.alcoholCount);
    if (day.factors.exerciseMinutes !== undefined) factorSums.exercise.push(day.factors.exerciseMinutes);
    if (day.factors.outdoorMinutes !== undefined) factorSums.outdoor.push(day.factors.outdoorMinutes);
    if (day.factors.socialMinutes !== undefined) factorSums.social.push(day.factors.socialMinutes);
    if (day.factors.sleepHours !== undefined) factorSums.sleep.push(day.factors.sleepHours);
  }

  const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

  return {
    weekStart: weekStartDate,
    weekEnd: formatDateString(end),
    days,
    averageSentiment,
    totalEntries,
    averageFactors: {
      caffeine: avg(factorSums.caffeine),
      alcohol: avg(factorSums.alcohol),
      exercise: avg(factorSums.exercise),
      outdoor: avg(factorSums.outdoor),
      social: avg(factorSums.social),
      sleep: avg(factorSums.sleep),
    },
  };
}

/**
 * Get the last N days of summaries
 */
export async function getRecentSummaries(days: number): Promise<DailySummary[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days + 1);

  return getDailySummaries(formatDateString(start), formatDateString(end));
}

/**
 * Update a single factor for today
 */
export async function updateTodayFactor(
  key: keyof LifestyleFactors,
  value: number
): Promise<void> {
  const today = formatDateString(new Date());
  const factors = await getFactors(today);
  factors[key] = value;
  await saveFactors(today, factors);
}

/**
 * Increment/decrement a factor for today
 */
export async function adjustTodayFactor(
  key: keyof LifestyleFactors,
  delta: number
): Promise<number> {
  const today = formatDateString(new Date());
  const factors = await getFactors(today);
  const current = (factors[key] as number) || 0;
  const newValue = Math.max(0, current + delta);
  factors[key] = newValue;
  await saveFactors(today, factors);
  return newValue;
}
