/**
 * User Context Builder Service
 *
 * Aggregates user data to create personalized context for Claude.
 * Following Moodling Ethics:
 * - Privacy-preserving (derived insights, not raw entries)
 * - User controls what's shared
 * - No diagnostic labels
 *
 * Unit 18B: Rich User Context Builder
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllEntries } from './journalStorage';
import { getTonePreferences, ToneStyle } from './tonePreferencesService';
import { MoodCategory } from './sentimentAnalysis';
import { JournalEntry } from '@/types/JournalEntry';

// Storage keys
const PREFERENCES_KEY = 'moodling_user_preferences';

/**
 * User's communication preferences
 */
export interface UserPreferences {
  temperament?: 'introvert' | 'extrovert' | 'ambivert';
  communicationStyle?: 'direct' | 'gentle' | 'detailed';
  prefersDirectness?: boolean;
  dislikesPlatitudes?: boolean;
  respondsWellToHumor?: boolean;
  needsMoreEncouragement?: boolean;
  currentExposureLevel?: number; // 1-8 scale (Unit 21)
}

/**
 * Mood trend direction
 */
export type MoodTrend = 'improving' | 'declining' | 'stable' | 'variable';

/**
 * Rich user context for Claude prompts
 */
export interface UserContext {
  // Who they are
  temperament?: string;
  communicationStyle?: string;
  toneStyles: ToneStyle[];

  // Current state
  recentMoodTrend?: MoodTrend;
  recentMoodDescription?: string;
  avgMoodScore?: number;
  entriesThisWeek?: number;

  // Patterns discovered
  knownTriggers: string[];
  knownHelpers: string[];

  // Recent theme (summarized)
  recentTheme?: string;

  // Preferences
  prefersDirectness?: boolean;
  dislikesPlatitudes?: boolean;
  respondsWellToHumor?: boolean;

  // Social exposure (Unit 21)
  currentExposureLevel?: number;
}

/**
 * Load user preferences from storage
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const data = await AsyncStorage.getItem(PREFERENCES_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to load user preferences:', error);
    return {};
  }
}

/**
 * Save user preferences
 */
export async function saveUserPreferences(prefs: UserPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
}

/**
 * Update a single preference
 */
export async function updatePreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): Promise<void> {
  const prefs = await getUserPreferences();
  prefs[key] = value;
  await saveUserPreferences(prefs);
}

/**
 * Analyze mood trend from recent entries
 */
function analyzeMoodTrend(entries: JournalEntry[]): { trend: MoodTrend; description: string; avgScore: number } {
  if (entries.length < 2) {
    return { trend: 'stable', description: 'Not enough data', avgScore: 0 };
  }

  const scores = entries
    .filter(e => e.sentiment?.score !== undefined)
    .map(e => e.sentiment!.score);

  if (scores.length < 2) {
    return { trend: 'stable', description: 'Not enough mood data', avgScore: 0 };
  }

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Split into first half and second half
  const midpoint = Math.floor(scores.length / 2);
  const firstHalf = scores.slice(midpoint);  // Older entries
  const secondHalf = scores.slice(0, midpoint); // Newer entries

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;
  const variance = calculateVariance(scores);

  let trend: MoodTrend;
  let description: string;

  if (variance > 0.3) {
    trend = 'variable';
    description = 'Mood has been fluctuating';
  } else if (diff > 0.15) {
    trend = 'improving';
    description = 'Mood trending upward recently';
  } else if (diff < -0.15) {
    trend = 'declining';
    description = 'Mood trending downward recently';
  } else {
    trend = 'stable';
    description = 'Mood has been relatively stable';
  }

  return { trend, description, avgScore };
}

/**
 * Calculate variance of scores
 */
function calculateVariance(scores: number[]): number {
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const squaredDiffs = scores.map(s => Math.pow(s - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Extract recent theme from latest entries (summarized, not raw)
 */
function extractRecentTheme(entries: JournalEntry[]): string | undefined {
  if (entries.length === 0) return undefined;

  const recentEntry = entries[0];
  const moods = entries.slice(0, 3).map(e => e.sentiment?.mood).filter(Boolean) as MoodCategory[];

  // Simple theme based on mood
  const moodCounts: Record<string, number> = {};
  for (const mood of moods) {
    const simplified = mood.replace('very_', '').replace('slightly_', '');
    moodCounts[simplified] = (moodCounts[simplified] || 0) + 1;
  }

  const dominantMood = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  if (dominantMood === 'positive') {
    return 'Recently positive entries';
  } else if (dominantMood === 'negative') {
    return 'Processing some difficult feelings';
  } else {
    return 'Reflective state';
  }
}

/**
 * Build comprehensive user context
 */
export async function buildUserContext(): Promise<UserContext> {
  // Get all data sources
  const [prefs, tonePrefs, entries] = await Promise.all([
    getUserPreferences(),
    getTonePreferences(),
    getAllEntries(),
  ]);

  // Recent entries (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentEntries = entries.filter(e => new Date(e.createdAt) >= weekAgo);

  // Analyze mood trend
  const { trend, description, avgScore } = analyzeMoodTrend(recentEntries);

  // Patterns - will be populated as user tracks more data
  const triggers: string[] = [];
  const helpers: string[] = [];

  // Extract theme
  const recentTheme = extractRecentTheme(entries);

  return {
    // Who they are
    temperament: prefs.temperament,
    communicationStyle: prefs.communicationStyle,
    toneStyles: tonePrefs.selectedStyles,

    // Current state
    recentMoodTrend: trend,
    recentMoodDescription: description,
    avgMoodScore: avgScore,
    entriesThisWeek: recentEntries.length,

    // Patterns
    knownTriggers: triggers,
    knownHelpers: helpers,

    // Theme
    recentTheme,

    // Preferences
    prefersDirectness: prefs.prefersDirectness,
    dislikesPlatitudes: prefs.dislikesPlatitudes,
    respondsWellToHumor: prefs.respondsWellToHumor,

    // Social exposure
    currentExposureLevel: prefs.currentExposureLevel,
  };
}

/**
 * Format user context for Claude prompt
 */
export function formatContextForPrompt(context: UserContext): string {
  const parts: string[] = [];

  // Who they are
  if (context.temperament) {
    parts.push(`Temperament: ${context.temperament}`);
  }
  if (context.communicationStyle) {
    parts.push(`Communication style: ${context.communicationStyle}`);
  }

  // Current state
  if (context.recentMoodDescription) {
    parts.push(`Recent mood: ${context.recentMoodDescription}`);
  }
  if (context.entriesThisWeek !== undefined) {
    parts.push(`Journaling frequency: ${context.entriesThisWeek} entries this week`);
  }

  // Patterns
  if (context.knownTriggers.length > 0) {
    parts.push(`Known triggers: ${context.knownTriggers.join(', ')}`);
  }
  if (context.knownHelpers.length > 0) {
    parts.push(`What has helped: ${context.knownHelpers.join(', ')}`);
  }

  // Theme
  if (context.recentTheme) {
    parts.push(`Recent focus: ${context.recentTheme}`);
  }

  // Preferences
  if (context.prefersDirectness) {
    parts.push('Prefers direct communication');
  }
  if (context.dislikesPlatitudes) {
    parts.push('Dislikes generic platitudes');
  }
  if (context.respondsWellToHumor) {
    parts.push('Responds well to light humor');
  }

  // Social exposure
  if (context.currentExposureLevel) {
    const level = context.currentExposureLevel;
    const levelDesc = level <= 2 ? 'prefers solitude' :
                      level <= 4 ? 'comfortable with brief interactions' :
                      level <= 6 ? 'comfortable with small groups' :
                      'comfortable in larger social settings';
    parts.push(`Social comfort: ${levelDesc} (level ${level}/8)`);
  }

  return parts.length === 0 ? 'No additional context available.' : parts.join('\n');
}

/**
 * Get formatted context for Claude
 */
export async function getContextForClaude(): Promise<string> {
  const context = await buildUserContext();
  return formatContextForPrompt(context);
}
