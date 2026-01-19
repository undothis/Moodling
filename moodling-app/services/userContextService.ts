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

  // Journal history
  recentEntrySummaries: string[];
  totalEntries: number;
  avgEntriesPerWeek: number;
  longestStreak: number;
  commonMoods: string[];

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
 * Keywords that suggest significant life events
 */
const SIGNIFICANT_KEYWORDS = [
  // Relationships
  'girlfriend', 'boyfriend', 'partner', 'wife', 'husband', 'married', 'engaged', 'breakup', 'divorce',
  'dating', 'relationship', 'proposal', 'love',
  // Family
  'mom', 'dad', 'mother', 'father', 'brother', 'sister', 'grandma', 'grandpa', 'family',
  'son', 'daughter', 'kids', 'children', 'parents', 'aunt', 'uncle', 'cousin',
  // Life events - loss/grief
  'died', 'death', 'funeral', 'passed away', 'lost', 'grief', 'grieving', 'mourning', 'goodbye',
  // Health/Medical
  'cancer', 'hospital', 'accident', 'surgery', 'doctor', 'diagnosed', 'sick', 'illness',
  'pregnant', 'baby', 'born', 'miscarriage', 'emergency', 'ER', 'ambulance', 'chronic',
  // Work/School/Career
  'fired', 'quit', 'job', 'promotion', 'interview', 'graduated', 'college', 'school',
  'degree', 'thesis', 'exam', 'finals', 'scholarship', 'raise', 'salary', 'unemployed', 'hired',
  // Major events
  'moved', 'moving', 'new house', 'apartment', 'car accident', 'wedding', 'birthday', 'anniversary',
  // Mental health journey
  'therapy', 'therapist', 'counselor', 'psychiatrist', 'medication', 'antidepressant',
  'anxiety', 'depression', 'panic attack', 'breakdown', 'mental health',
  // Pets
  'dog', 'cat', 'pet', 'puppy', 'kitten', 'adopted', 'rescue', 'vet',
  // Finances
  'debt', 'loan', 'mortgage', 'bankruptcy', 'savings', 'investment',
  // Friendships
  'best friend', 'friendship', 'falling out', 'reconnected', 'betrayed', 'ghosted',
  // Personal growth/Achievements
  'accomplished', 'achieved', 'milestone', 'first time', 'personal best', 'goal', 'finally',
  // Spiritual/Religious
  'church', 'temple', 'meditation', 'spiritual', 'faith', 'prayer', 'baptism',
  // Legal
  'lawyer', 'court', 'custody', 'lawsuit', 'arrested',
  // Addiction/Recovery
  'sober', 'sobriety', 'relapse', 'clean', 'addiction', 'AA', 'rehab', 'recovery',
  // Identity
  'coming out', 'transition', 'identity',
  // Trauma (handle sensitively)
  'assault', 'abuse', 'trauma',
  // Travel/Living
  'vacation', 'trip', 'travel', 'new city', 'hometown',
  // Celebrations
  'celebration', 'reunion', 'party', 'holiday',
];

/**
 * Check if entry contains significant keywords
 */
function hasSignificantContent(text: string): boolean {
  const lower = text.toLowerCase();
  return SIGNIFICANT_KEYWORDS.some(keyword => lower.includes(keyword));
}

/**
 * Score entry significance (higher = more important)
 */
function scoreSignificance(entry: JournalEntry): number {
  let score = 0;

  // Longer entries are often more significant
  if (entry.text.length > 200) score += 2;
  if (entry.text.length > 500) score += 2;

  // Strong emotions suggest importance
  const mood = entry.sentiment?.mood || '';
  if (mood.includes('very_')) score += 3;

  // Contains significant keywords
  if (hasSignificantContent(entry.text)) score += 5;

  return score;
}

/**
 * Get brief summaries of recent journal entries
 * Includes both recent entries AND significant historical ones
 */
function getRecentEntrySummaries(entries: JournalEntry[], recentCount: number = 5): string[] {
  const summaries: string[] = [];

  // Get recent entries (last 5-7)
  const recentEntries = entries.slice(0, recentCount);

  // Find significant older entries (beyond the recent ones)
  const olderEntries = entries.slice(recentCount);
  const significantOlder = olderEntries
    .map(entry => ({ entry, score: scoreSignificance(entry) }))
    .filter(item => item.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.entry);

  // Combine and format
  const allEntries = [...recentEntries, ...significantOlder];

  for (const entry of allEntries) {
    const isSignificant = scoreSignificance(entry) >= 3;
    // Longer preview for significant entries
    const previewLength = isSignificant ? 100 : 60;
    const preview = entry.text.slice(0, previewLength).trim();
    const truncated = entry.text.length > previewLength ? preview + '...' : preview;
    const mood = entry.sentiment?.mood?.replace(/_/g, ' ') || 'reflective';
    const date = new Date(entry.createdAt);
    const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

    let timeDesc: string;
    if (daysAgo === 0) {
      timeDesc = 'today';
    } else if (daysAgo === 1) {
      timeDesc = 'yesterday';
    } else if (daysAgo < 7) {
      timeDesc = `${daysAgo} days ago`;
    } else if (daysAgo < 30) {
      timeDesc = `${Math.floor(daysAgo / 7)} weeks ago`;
    } else {
      timeDesc = `${Math.floor(daysAgo / 30)} months ago`;
    }

    const significantMarker = isSignificant && daysAgo > 7 ? ' [significant]' : '';
    summaries.push(`${timeDesc} (${mood})${significantMarker}: "${truncated}"`);
  }

  return summaries;
}

/**
 * Analyze journaling patterns over time
 */
function analyzeJournalingPatterns(entries: JournalEntry[]): {
  totalEntries: number;
  avgEntriesPerWeek: number;
  longestStreak: number;
  commonMoods: string[];
} {
  const totalEntries = entries.length;

  if (totalEntries === 0) {
    return { totalEntries: 0, avgEntriesPerWeek: 0, longestStreak: 0, commonMoods: [] };
  }

  // Calculate average entries per week
  const oldestEntry = new Date(entries[entries.length - 1].createdAt);
  const newestEntry = new Date(entries[0].createdAt);
  const weeksBetween = Math.max(1, (newestEntry.getTime() - oldestEntry.getTime()) / (1000 * 60 * 60 * 24 * 7));
  const avgEntriesPerWeek = Math.round((totalEntries / weeksBetween) * 10) / 10;

  // Calculate longest streak (consecutive days)
  let longestStreak = 1;
  let currentStreak = 1;
  const dates = entries.map(e => new Date(e.createdAt).toDateString());
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const dayDiff = (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24);
    if (dayDiff <= 1.5) { // Account for same day or next day
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  // Find common moods
  const moodCounts: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.sentiment?.mood) {
      const simplified = entry.sentiment.mood.replace('very_', '').replace('slightly_', '');
      moodCounts[simplified] = (moodCounts[simplified] || 0) + 1;
    }
  }
  const commonMoods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([mood]) => mood);

  return { totalEntries, avgEntriesPerWeek, longestStreak, commonMoods };
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

  // Get journal history insights (5 recent + up to 3 significant older ones)
  const recentEntrySummaries = getRecentEntrySummaries(entries, 5);
  const journalPatterns = analyzeJournalingPatterns(entries);

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

    // Journal history
    recentEntrySummaries,
    totalEntries: journalPatterns.totalEntries,
    avgEntriesPerWeek: journalPatterns.avgEntriesPerWeek,
    longestStreak: journalPatterns.longestStreak,
    commonMoods: journalPatterns.commonMoods,

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

  // Journal history overview
  if (context.totalEntries > 0) {
    let historyDesc = `Journal history: ${context.totalEntries} total entries`;
    if (context.avgEntriesPerWeek > 0) {
      historyDesc += `, ~${context.avgEntriesPerWeek} per week`;
    }
    if (context.longestStreak > 1) {
      historyDesc += `, longest streak: ${context.longestStreak} days`;
    }
    parts.push(historyDesc);
  }

  // Common moods
  if (context.commonMoods.length > 0) {
    parts.push(`Most common moods: ${context.commonMoods.join(', ')}`);
  }

  // Current state
  if (context.recentMoodDescription) {
    parts.push(`Recent mood trend: ${context.recentMoodDescription}`);
  }
  if (context.entriesThisWeek !== undefined && context.entriesThisWeek > 0) {
    parts.push(`This week: ${context.entriesThisWeek} entries`);
  }

  // Recent journal summaries (brief previews)
  if (context.recentEntrySummaries.length > 0) {
    parts.push('');
    parts.push('Recent journal entries:');
    for (const summary of context.recentEntrySummaries) {
      parts.push(`  • ${summary}`);
    }
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
  const prefParts: string[] = [];
  if (context.prefersDirectness) {
    prefParts.push('direct communication');
  }
  if (context.dislikesPlatitudes) {
    prefParts.push('dislikes platitudes');
  }
  if (context.respondsWellToHumor) {
    prefParts.push('responds to humor');
  }
  if (prefParts.length > 0) {
    parts.push(`Communication preferences: ${prefParts.join(', ')}`);
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

  return parts.length === 0 ? 'New user - no history yet.' : parts.join('\n');
}

/**
 * Get formatted context for Claude
 */
export async function getContextForClaude(): Promise<string> {
  const context = await buildUserContext();
  return formatContextForPrompt(context);
}
