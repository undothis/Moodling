/**
 * Health Insight Service
 *
 * Generates smart insights and suggestions by correlating:
 * - Journal entries and mood data
 * - Health metrics (HealthKit)
 * - Patterns over time
 *
 * Goal: Help users see correlations so they can understand themselves
 * better and eventually not need the app (anti-dependency principle).
 *
 * Following Mood Leaf Ethics:
 * - Descriptive, never diagnostic
 * - Empower self-awareness
 * - Encourage real-world solutions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { HealthSnapshot, fetchHealthSnapshot, isHealthKitEnabled } from './healthKitService';
import { JournalEntry } from '@/types/JournalEntry';
import { getAllEntries } from './journalStorage';

// Storage keys
const INSIGHTS_KEY = 'moodling_health_insights';
const SHOWN_INSIGHTS_KEY = 'moodling_shown_insights';
const CORRELATION_DATA_KEY = 'moodling_correlations';

/**
 * Types of insights we can generate
 */
export type InsightType =
  | 'sleep_mood_correlation'
  | 'activity_mood_correlation'
  | 'heart_rate_anxiety'
  | 'low_activity_suggestion'
  | 'poor_sleep_check_in'
  | 'positive_pattern'
  | 'stress_indicator'
  | 'habit_reminder'
  | 'self_awareness';

/**
 * A generated insight/suggestion
 */
export interface HealthInsight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  actionLabel?: string; // e.g., "Journal about this", "Take a walk"
  actionType?: 'journal' | 'activity' | 'breathe' | 'reflect' | 'chat';
  priority: 'low' | 'medium' | 'high';
  expiresAt: string; // ISO date - insight becomes stale
  createdAt: string;
  correlationData?: {
    metric1: string;
    metric2: string;
    correlation: string; // e.g., "positive", "negative"
  };
}

/**
 * Correlation record for tracking patterns
 */
export interface CorrelationRecord {
  date: string;
  mood: string;
  moodScore: number; // 1-5
  sleepHours?: number;
  steps?: number;
  heartRateAvg?: number;
  exerciseMinutes?: number;
  journalLength?: number;
  entryCount?: number;
}

/**
 * Generate unique ID
 */
function generateInsightId(): string {
  return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert mood to numeric score for correlation analysis
 */
function moodToScore(mood: string): number {
  const moodScores: Record<string, number> = {
    'very_positive': 5,
    'positive': 4,
    'neutral': 3,
    'negative': 2,
    'very_negative': 1,
  };
  return moodScores[mood] ?? 3;
}

/**
 * Save correlation data point (called daily)
 */
export async function recordCorrelationData(
  mood: string,
  health: HealthSnapshot,
  entries: JournalEntry[]
): Promise<void> {
  try {
    const existingData = await AsyncStorage.getItem(CORRELATION_DATA_KEY);
    const correlations: CorrelationRecord[] = existingData ? JSON.parse(existingData) : [];

    const todayEntries = entries.filter(e => {
      const entryDate = new Date(e.createdAt).toDateString();
      return entryDate === new Date().toDateString();
    });

    // Use local date to avoid UTC timezone issues
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const record: CorrelationRecord = {
      date: localDate,
      mood,
      moodScore: moodToScore(mood),
      sleepHours: health.lastNightSleep?.totalSleepHours,
      steps: health.todayActivity?.steps,
      heartRateAvg: health.currentHeartRate,
      exerciseMinutes: health.todayActivity?.exerciseMinutes,
      journalLength: todayEntries.reduce((sum, e) => sum + e.text.length, 0),
      entryCount: todayEntries.length,
    };

    // Keep last 90 days
    correlations.push(record);
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    const filtered = correlations.filter(
      r => new Date(r.date).getTime() > ninetyDaysAgo
    );

    await AsyncStorage.setItem(CORRELATION_DATA_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to record correlation data:', error);
  }
}

/**
 * Get correlation history
 */
export async function getCorrelationHistory(): Promise<CorrelationRecord[]> {
  try {
    const data = await AsyncStorage.getItem(CORRELATION_DATA_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Analyze sleep-mood correlation
 */
function analyzeSleepMoodCorrelation(history: CorrelationRecord[]): string | null {
  const withSleep = history.filter(r => r.sleepHours !== undefined);
  if (withSleep.length < 7) return null; // Need at least a week of data

  // Compare mood on good sleep days vs poor sleep days
  const goodSleep = withSleep.filter(r => (r.sleepHours ?? 0) >= 7);
  const poorSleep = withSleep.filter(r => (r.sleepHours ?? 0) < 6);

  if (goodSleep.length < 3 || poorSleep.length < 3) return null;

  const avgMoodGoodSleep = goodSleep.reduce((sum, r) => sum + r.moodScore, 0) / goodSleep.length;
  const avgMoodPoorSleep = poorSleep.reduce((sum, r) => sum + r.moodScore, 0) / poorSleep.length;

  const difference = avgMoodGoodSleep - avgMoodPoorSleep;

  if (difference > 0.5) {
    return 'positive'; // Better mood with better sleep
  } else if (difference < -0.3) {
    return 'inverse'; // Unusual - worth noting
  }
  return null;
}

/**
 * Analyze activity-mood correlation
 */
function analyzeActivityMoodCorrelation(history: CorrelationRecord[]): string | null {
  const withSteps = history.filter(r => r.steps !== undefined);
  if (withSteps.length < 7) return null;

  // Calculate median steps
  const sortedSteps = withSteps.map(r => r.steps ?? 0).sort((a, b) => a - b);
  const medianSteps = sortedSteps[Math.floor(sortedSteps.length / 2)];

  // Compare mood on active vs inactive days
  const activeDays = withSteps.filter(r => (r.steps ?? 0) > medianSteps);
  const inactiveDays = withSteps.filter(r => (r.steps ?? 0) <= medianSteps * 0.5);

  if (activeDays.length < 3 || inactiveDays.length < 3) return null;

  const avgMoodActive = activeDays.reduce((sum, r) => sum + r.moodScore, 0) / activeDays.length;
  const avgMoodInactive = inactiveDays.reduce((sum, r) => sum + r.moodScore, 0) / inactiveDays.length;

  if (avgMoodActive - avgMoodInactive > 0.5) {
    return 'positive'; // Movement helps mood
  }
  return null;
}

/**
 * Check if insight was recently shown
 */
async function wasRecentlyShown(insightType: InsightType, hours: number = 24): Promise<boolean> {
  try {
    const shown = await AsyncStorage.getItem(SHOWN_INSIGHTS_KEY);
    if (!shown) return false;

    const shownMap: Record<string, string> = JSON.parse(shown);
    const lastShown = shownMap[insightType];
    if (!lastShown) return false;

    const hoursSince = (Date.now() - new Date(lastShown).getTime()) / (1000 * 60 * 60);
    return hoursSince < hours;
  } catch {
    return false;
  }
}

/**
 * Mark insight as shown
 */
async function markInsightShown(insightType: InsightType): Promise<void> {
  try {
    const shown = await AsyncStorage.getItem(SHOWN_INSIGHTS_KEY);
    const shownMap: Record<string, string> = shown ? JSON.parse(shown) : {};
    shownMap[insightType] = new Date().toISOString();
    await AsyncStorage.setItem(SHOWN_INSIGHTS_KEY, JSON.stringify(shownMap));
  } catch (error) {
    console.error('Failed to mark insight shown:', error);
  }
}

/**
 * Generate insights based on current health data and history
 */
export async function generateHealthInsights(): Promise<HealthInsight[]> {
  const insights: HealthInsight[] = [];

  // Check if HealthKit is enabled
  const healthEnabled = await isHealthKitEnabled();
  if (!healthEnabled) return [];

  const health = await fetchHealthSnapshot();
  const history = await getCorrelationHistory();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hour expiry

  // 1. Heart rate spike check-in
  if (health.isHeartRateSpiking && !await wasRecentlyShown('heart_rate_anxiety', 2)) {
    insights.push({
      id: generateInsightId(),
      type: 'heart_rate_anxiety',
      title: "Your heart rate is elevated",
      message: "Hey, I noticed your heart rate is up. Sometimes our body feels things before we're fully aware. Want to check in about what might be going on?",
      actionLabel: "Tell me what's happening",
      actionType: 'journal',
      priority: 'high',
      expiresAt,
      createdAt: now.toISOString(),
    });
  }

  // 2. Poor sleep check-in
  if (health.lastNightSleep && health.lastNightSleep.totalSleepHours < 5 && !await wasRecentlyShown('poor_sleep_check_in', 12)) {
    insights.push({
      id: generateInsightId(),
      type: 'poor_sleep_check_in',
      title: "Rough night?",
      message: `Looks like you only got ${health.lastNightSleep.totalSleepHours.toFixed(1)} hours of sleep. That can affect how everything feels today. Be gentle with yourself.`,
      actionLabel: "How am I feeling?",
      actionType: 'reflect',
      priority: 'medium',
      expiresAt,
      createdAt: now.toISOString(),
    });
  }

  // 3. Low activity gentle suggestion
  if (health.todayActivity && health.weeklyAverageSteps) {
    const percentOfAverage = (health.todayActivity.steps / health.weeklyAverageSteps) * 100;
    if (percentOfAverage < 30 && !await wasRecentlyShown('low_activity_suggestion', 8)) {
      insights.push({
        id: generateInsightId(),
        type: 'low_activity_suggestion',
        title: "Moving a little?",
        message: "You've been pretty still today. No judgment - sometimes that's what we need. But if you're feeling stuck, even a short walk can shift things.",
        actionLabel: "Take a 5-min walk",
        actionType: 'activity',
        priority: 'low',
        expiresAt,
        createdAt: now.toISOString(),
      });
    }
  }

  // 4. Sleep-mood correlation insight
  const sleepCorrelation = analyzeSleepMoodCorrelation(history);
  if (sleepCorrelation === 'positive' && !await wasRecentlyShown('sleep_mood_correlation', 72)) {
    insights.push({
      id: generateInsightId(),
      type: 'sleep_mood_correlation',
      title: "Pattern noticed: Sleep & Mood",
      message: "Looking at your data, you tend to feel better on days after good sleep. Your body and mind are connected. This is useful self-knowledge!",
      actionLabel: "Reflect on this",
      actionType: 'reflect',
      priority: 'low',
      expiresAt,
      createdAt: now.toISOString(),
      correlationData: {
        metric1: 'sleep',
        metric2: 'mood',
        correlation: 'positive',
      },
    });
  }

  // 5. Activity-mood correlation insight
  const activityCorrelation = analyzeActivityMoodCorrelation(history);
  if (activityCorrelation === 'positive' && !await wasRecentlyShown('activity_mood_correlation', 72)) {
    insights.push({
      id: generateInsightId(),
      type: 'activity_mood_correlation',
      title: "Pattern noticed: Movement & Mood",
      message: "Your data shows you tend to feel better on days you're more active. Your body might be onto something. Keep noticing this for yourself.",
      actionLabel: "Remember this",
      actionType: 'reflect',
      priority: 'low',
      expiresAt,
      createdAt: now.toISOString(),
      correlationData: {
        metric1: 'activity',
        metric2: 'mood',
        correlation: 'positive',
      },
    });
  }

  // 6. Stress indicators
  if (health.potentialStressIndicators.length >= 2 && !await wasRecentlyShown('stress_indicator', 4)) {
    const indicators = health.potentialStressIndicators.slice(0, 2).join(' and ');
    insights.push({
      id: generateInsightId(),
      type: 'stress_indicator',
      title: "Your body might be signaling something",
      message: `I'm noticing ${indicators}. Your body often knows before your mind catches up. Worth checking in with yourself?`,
      actionLabel: "Check in",
      actionType: 'journal',
      priority: 'medium',
      expiresAt,
      createdAt: now.toISOString(),
    });
  }

  // 7. Positive reinforcement when doing well
  if (health.lastNightSleep && health.lastNightSleep.sleepQuality === 'excellent' &&
      health.todayActivity && health.todayActivity.exerciseMinutes > 20 &&
      !await wasRecentlyShown('positive_pattern', 24)) {
    insights.push({
      id: generateInsightId(),
      type: 'positive_pattern',
      title: "Nice rhythm today",
      message: "Good sleep, some movement - you're taking care of yourself. Notice how that feels. This is you building your own toolkit.",
      actionLabel: "Celebrate this",
      actionType: 'reflect',
      priority: 'low',
      expiresAt,
      createdAt: now.toISOString(),
    });
  }

  return insights;
}

/**
 * Get the most relevant insight to show right now
 */
export async function getTopInsight(): Promise<HealthInsight | null> {
  const insights = await generateHealthInsights();
  if (insights.length === 0) return null;

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const topInsight = insights[0];

  // Mark as shown
  await markInsightShown(topInsight.type);

  return topInsight;
}

/**
 * Save an insight (for persistence)
 */
export async function saveInsight(insight: HealthInsight): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(INSIGHTS_KEY);
    const insights: HealthInsight[] = existing ? JSON.parse(existing) : [];

    // Don't duplicate
    if (insights.some(i => i.id === insight.id)) return;

    insights.push(insight);

    // Keep only last 50
    const recent = insights.slice(-50);
    await AsyncStorage.setItem(INSIGHTS_KEY, JSON.stringify(recent));
  } catch (error) {
    console.error('Failed to save insight:', error);
  }
}

/**
 * Get saved insights
 */
export async function getSavedInsights(): Promise<HealthInsight[]> {
  try {
    const data = await AsyncStorage.getItem(INSIGHTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Generate a quick breathing exercise suggestion
 * Returns a message when heart rate is elevated
 */
export function getBreathingExerciseSuggestion(heartRate: number, baseline: number): string | null {
  if (heartRate <= baseline * 1.2) return null;

  const exercises = [
    "Try this: Breathe in for 4 counts, hold for 4, out for 6. Your heart rate is up - this can help settle it.",
    "Quick reset: 5 deep breaths, slower exhale than inhale. Your body is activated - let's bring it down together.",
    "Box breathing might help right now: In 4, hold 4, out 4, hold 4. Repeat 4 times. I'll wait.",
  ];

  return exercises[Math.floor(Math.random() * exercises.length)];
}

/**
 * Format correlation summary for Claude
 * Helps Claude reference patterns when chatting
 */
export async function getCorrelationSummaryForClaude(): Promise<string> {
  const history = await getCorrelationHistory();
  if (history.length < 14) return ''; // Need 2 weeks minimum

  const parts: string[] = [];
  parts.push('PATTERN CORRELATIONS (from user data):');

  const sleepCorrelation = analyzeSleepMoodCorrelation(history);
  if (sleepCorrelation === 'positive') {
    parts.push('- User tends to feel better after good sleep (data-backed)');
  }

  const activityCorrelation = analyzeActivityMoodCorrelation(history);
  if (activityCorrelation === 'positive') {
    parts.push('- User tends to feel better on more active days (data-backed)');
  }

  // Calculate average mood trend
  const recentWeek = history.slice(-7);
  const previousWeek = history.slice(-14, -7);
  if (recentWeek.length >= 5 && previousWeek.length >= 5) {
    const recentAvg = recentWeek.reduce((sum, r) => sum + r.moodScore, 0) / recentWeek.length;
    const previousAvg = previousWeek.reduce((sum, r) => sum + r.moodScore, 0) / previousWeek.length;
    if (recentAvg - previousAvg > 0.5) {
      parts.push('- Mood trending upward this week compared to last');
    } else if (previousAvg - recentAvg > 0.5) {
      parts.push('- Mood trending downward this week compared to last');
    }
  }

  return parts.length > 1 ? parts.join('\n') : '';
}
