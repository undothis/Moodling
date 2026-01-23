/**
 * Insight Service
 *
 * Discovers patterns and correlations from user data (twigs, conversations, behaviors)
 * and surfaces them as "insights" that help users understand themselves better.
 *
 * This service is designed to work with:
 * 1. Heuristic/statistical analysis (current)
 * 2. Claude API for deeper analysis (optional, with consent)
 * 3. Local Llama model when available (future - ideal for privacy & context)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// INSIGHT TYPES
// ============================================

export type InsightCategory =
  | 'correlation'      // X correlates with Y (junk food → harder periods)
  | 'trigger'          // What triggers certain moods/behaviors
  | 'recovery'         // What helps bounce back from low moods
  | 'cycle'            // Recurring patterns (weekly, monthly, seasonal)
  | 'social'           // How relationships affect mood
  | 'activity'         // Which activities correlate with moods
  | 'sleep'            // Sleep pattern correlations
  | 'time_of_day'      // Morning vs evening patterns
  | 'environment'      // Location/setting correlations
  | 'momentum'         // Streaks and habit chains
  | 'avoidance'        // What you avoid when feeling certain ways
  | 'self_talk'        // Patterns in internal dialogue
  | 'body_mind'        // Physical-emotional connections
  | 'growth'           // Progress and improvement over time
  | 'warning_sign';    // Early warning indicators

export type InsightStrength = 'emerging' | 'developing' | 'established' | 'strong';

export type InsightSentiment = 'positive' | 'neutral' | 'cautionary' | 'growth_opportunity';

export interface Insight {
  id: string;
  category: InsightCategory;
  title: string;                    // Short title: "Sleep affects your focus"
  description: string;              // Full insight text
  evidence: InsightEvidence[];      // Data points supporting this insight
  strength: InsightStrength;        // How confident/established is this
  sentiment: InsightSentiment;      // Positive, cautionary, etc.

  // Metadata
  discoveredAt: string;             // When first noticed
  lastUpdatedAt: string;            // When evidence last added
  timesReinforced: number;          // How many times pattern repeated

  // User interaction
  isNew: boolean;                   // User hasn't seen this yet (for glow)
  isAcknowledged: boolean;          // User has read and acknowledged
  userReaction?: 'helpful' | 'not_helpful' | 'already_knew' | 'surprising';
  userNotes?: string;               // User's own notes about this insight

  // Coach integration
  mentionedInConversation: boolean; // Coach has mentioned this
  lastMentionedAt?: string;

  // Analysis source
  source: 'heuristic' | 'statistical' | 'llm_claude' | 'llm_llama';
  confidence: number;               // 0-1 confidence score

  // Actionable
  suggestedExperiment?: string;     // "Try going to bed earlier for a week"
  relatedTwigIds?: string[];        // Twigs that contributed to this insight
}

export interface InsightEvidence {
  id: string;
  type: 'twig' | 'conversation' | 'pattern' | 'calendar' | 'behavior';
  sourceId: string;                 // ID of the twig/conversation/etc
  description: string;              // What this evidence shows
  timestamp: string;
  weight: number;                   // How strongly this supports the insight
}

// ============================================
// PATTERN DEFINITIONS
// What patterns to look for
// ============================================

export interface PatternDefinition {
  id: string;
  name: string;
  category: InsightCategory;
  description: string;

  // What to look for
  triggers: PatternTrigger[];
  outcomes: PatternOutcome[];

  // Timing
  windowDays: number;               // How many days to look back
  minOccurrences: number;           // Minimum times pattern must occur

  // Template for generating insight text
  insightTemplate: string;          // "When you {trigger}, you tend to {outcome}"
}

export interface PatternTrigger {
  type: 'mood' | 'activity' | 'sleep' | 'social' | 'food' | 'exercise' | 'weather' | 'time' | 'keyword';
  value?: string;                   // Specific value to match
  comparator?: 'equals' | 'contains' | 'above' | 'below' | 'absent';
  threshold?: number;
}

export interface PatternOutcome {
  type: 'mood' | 'energy' | 'focus' | 'sleep_quality' | 'productivity' | 'social' | 'symptom';
  direction: 'increase' | 'decrease' | 'stable';
  magnitude?: 'slight' | 'moderate' | 'significant';
}

// ============================================
// BUILT-IN PATTERN TEMPLATES
// ============================================

export const PATTERN_TEMPLATES: PatternDefinition[] = [
  // Sleep patterns
  {
    id: 'sleep_mood_connection',
    name: 'Sleep-Mood Connection',
    category: 'sleep',
    description: 'How sleep affects next-day mood',
    triggers: [{ type: 'sleep', comparator: 'below', threshold: 6 }],
    outcomes: [{ type: 'mood', direction: 'decrease' }],
    windowDays: 14,
    minOccurrences: 3,
    insightTemplate: "When you sleep less than 6 hours, your mood tends to dip the next day."
  },
  {
    id: 'sleep_focus_connection',
    name: 'Sleep-Focus Connection',
    category: 'sleep',
    description: 'How sleep affects focus',
    triggers: [{ type: 'sleep', comparator: 'above', threshold: 7 }],
    outcomes: [{ type: 'focus', direction: 'increase' }],
    windowDays: 14,
    minOccurrences: 3,
    insightTemplate: "You seem to focus better on days after you've slept 7+ hours."
  },

  // Activity patterns
  {
    id: 'exercise_mood_boost',
    name: 'Exercise Mood Boost',
    category: 'activity',
    description: 'Exercise improves mood',
    triggers: [{ type: 'activity', value: 'exercise', comparator: 'equals' }],
    outcomes: [{ type: 'mood', direction: 'increase' }],
    windowDays: 30,
    minOccurrences: 4,
    insightTemplate: "Exercise seems to lift your mood. On days you work out, you log more positive feelings."
  },
  {
    id: 'outdoor_time_benefit',
    name: 'Outdoor Time Benefit',
    category: 'environment',
    description: 'Going outside improves wellbeing',
    triggers: [{ type: 'activity', value: 'outside', comparator: 'contains' }],
    outcomes: [{ type: 'mood', direction: 'increase' }],
    windowDays: 21,
    minOccurrences: 3,
    insightTemplate: "Time outdoors seems good for you. Your logs are more positive on days you mention being outside."
  },
  {
    id: 'no_outdoor_netflix',
    name: 'Indoor Netflix Pattern',
    category: 'avoidance',
    description: 'Lack of outdoor time correlates with more screen time',
    triggers: [{ type: 'activity', value: 'outside', comparator: 'absent' }],
    outcomes: [{ type: 'productivity', direction: 'decrease' }],
    windowDays: 14,
    minOccurrences: 3,
    insightTemplate: "When you don't go outside, you tend to watch more Netflix. Connection or just coincidence?"
  },

  // Social patterns
  {
    id: 'social_energy_drain',
    name: 'Social Energy Pattern',
    category: 'social',
    description: 'Social interaction effects on energy',
    triggers: [{ type: 'social', value: 'large_group', comparator: 'equals' }],
    outcomes: [{ type: 'energy', direction: 'decrease' }],
    windowDays: 30,
    minOccurrences: 2,
    insightTemplate: "Large social gatherings seem to drain your energy. You might be more introverted than you thought."
  },
  {
    id: 'isolation_mood_drop',
    name: 'Isolation Mood Pattern',
    category: 'social',
    description: 'Lack of social contact affects mood',
    triggers: [{ type: 'social', comparator: 'absent' }],
    outcomes: [{ type: 'mood', direction: 'decrease' }],
    windowDays: 7,
    minOccurrences: 3,
    insightTemplate: "When you go several days without social contact, your mood tends to dip."
  },

  // Momentum patterns
  {
    id: 'meditation_streak_benefit',
    name: 'Meditation Streak',
    category: 'momentum',
    description: 'Consistent meditation builds benefits',
    triggers: [{ type: 'activity', value: 'meditat', comparator: 'contains' }],
    outcomes: [{ type: 'mood', direction: 'increase' }],
    windowDays: 14,
    minOccurrences: 5,
    insightTemplate: "Your meditation practice is working. After consistent sessions, you log calmer, more centered entries."
  },
  {
    id: 'meditation_break_effect',
    name: 'Meditation Break Effect',
    category: 'momentum',
    description: 'Stopping meditation affects mood',
    triggers: [{ type: 'activity', value: 'meditat', comparator: 'absent' }],
    outcomes: [{ type: 'mood', direction: 'decrease' }],
    windowDays: 7,
    minOccurrences: 3,
    insightTemplate: "When you stop meditating, you seem to get off track. The routine might be more helpful than you realize."
  },

  // Time of day patterns
  {
    id: 'morning_person',
    name: 'Morning Person',
    category: 'time_of_day',
    description: 'Better mood/energy in mornings',
    triggers: [{ type: 'time', value: 'morning', comparator: 'equals' }],
    outcomes: [{ type: 'energy', direction: 'increase' }],
    windowDays: 21,
    minOccurrences: 5,
    insightTemplate: "You seem to be a morning person. Your energy and mood are consistently better before noon."
  },
  {
    id: 'evening_creativity',
    name: 'Evening Creativity',
    category: 'time_of_day',
    description: 'Creative energy peaks in evening',
    triggers: [{ type: 'time', value: 'evening', comparator: 'equals' }],
    outcomes: [{ type: 'focus', direction: 'increase' }],
    windowDays: 21,
    minOccurrences: 5,
    insightTemplate: "Your creative energy seems to peak in the evenings. Consider protecting that time for important work."
  },

  // Cycle patterns
  {
    id: 'weekly_pattern',
    name: 'Weekly Rhythm',
    category: 'cycle',
    description: 'Weekly mood/energy patterns',
    triggers: [{ type: 'time', value: 'weekday', comparator: 'equals' }],
    outcomes: [{ type: 'mood', direction: 'stable' }],
    windowDays: 28,
    minOccurrences: 4,
    insightTemplate: "Your mood follows a weekly pattern. {specific_pattern}"
  },
  {
    id: 'monthly_cycle',
    name: 'Monthly Cycle',
    category: 'cycle',
    description: 'Monthly patterns (menstrual, lunar, etc)',
    triggers: [{ type: 'time', value: 'monthly', comparator: 'equals' }],
    outcomes: [{ type: 'mood', direction: 'stable' }],
    windowDays: 60,
    minOccurrences: 2,
    insightTemplate: "I notice a monthly pattern in your entries. Around the same time each month, you tend to {pattern}."
  },

  // Food/body patterns
  {
    id: 'food_mood_connection',
    name: 'Food-Mood Connection',
    category: 'body_mind',
    description: 'Diet affects mood',
    triggers: [{ type: 'food', value: 'junk', comparator: 'contains' }],
    outcomes: [{ type: 'mood', direction: 'decrease' }],
    windowDays: 14,
    minOccurrences: 3,
    insightTemplate: "When you eat more processed food, your mood seems to dip within a day or two."
  },
  {
    id: 'caffeine_anxiety',
    name: 'Caffeine-Anxiety Connection',
    category: 'body_mind',
    description: 'Caffeine intake correlates with anxiety',
    triggers: [{ type: 'food', value: 'coffee', comparator: 'contains' }],
    outcomes: [{ type: 'symptom', direction: 'increase' }],
    windowDays: 14,
    minOccurrences: 3,
    insightTemplate: "There might be a connection between your caffeine intake and anxiety levels."
  },

  // Warning signs
  {
    id: 'downward_spiral_warning',
    name: 'Downward Spiral Warning',
    category: 'warning_sign',
    description: 'Early warning of mood decline',
    triggers: [{ type: 'mood', comparator: 'below', threshold: 3 }],
    outcomes: [{ type: 'mood', direction: 'decrease' }],
    windowDays: 5,
    minOccurrences: 2,
    insightTemplate: "Heads up: Your recent entries suggest your mood might be trending down. What helped last time?"
  },

  // Recovery patterns
  {
    id: 'bounce_back_method',
    name: 'Your Recovery Method',
    category: 'recovery',
    description: 'What helps recover from low moods',
    triggers: [{ type: 'mood', comparator: 'below', threshold: 3 }],
    outcomes: [{ type: 'mood', direction: 'increase' }],
    windowDays: 30,
    minOccurrences: 2,
    insightTemplate: "When you're feeling low, {recovery_activity} seems to help you bounce back."
  },

  // Growth patterns
  {
    id: 'progress_recognition',
    name: 'Progress Recognition',
    category: 'growth',
    description: 'Recognizing improvement over time',
    triggers: [{ type: 'mood', comparator: 'above', threshold: 6 }],
    outcomes: [{ type: 'mood', direction: 'stable' }],
    windowDays: 90,
    minOccurrences: 10,
    insightTemplate: "Looking at the bigger picture: Your average mood has improved over the past 3 months."
  },
];

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  INSIGHTS: 'moodleaf_insights',
  INSIGHT_SETTINGS: 'moodleaf_insight_settings',
  PATTERN_DATA: 'moodleaf_pattern_data',
  LAST_ANALYSIS: 'moodleaf_last_insight_analysis',
  NEW_INSIGHT_COUNT: 'moodleaf_new_insight_count',
};

// ============================================
// INSIGHT SETTINGS
// ============================================

export interface InsightSettings {
  enabled: boolean;
  analysisFrequency: 'daily' | 'weekly' | 'on_demand';
  useLLMAnalysis: boolean;          // Use Claude/Llama for deeper analysis
  llmProvider: 'claude' | 'llama' | 'auto';
  minConfidenceToShow: number;      // 0-1, don't show low-confidence insights
  coachCanMention: boolean;         // Coach can bring up insights in conversation
  notifyOnNewInsight: boolean;      // Glow the button on new insights
}

const DEFAULT_SETTINGS: InsightSettings = {
  enabled: true,
  analysisFrequency: 'daily',
  useLLMAnalysis: false,            // Start with heuristics only
  llmProvider: 'auto',
  minConfidenceToShow: 0.6,
  coachCanMention: true,
  notifyOnNewInsight: true,
};

// ============================================
// MAIN SERVICE FUNCTIONS
// ============================================

/**
 * Get all insights for the user
 */
export async function getInsights(): Promise<Insight[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.INSIGHTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[Insights] Error loading insights:', error);
    return [];
  }
}

/**
 * Get new (unread) insights
 */
export async function getNewInsights(): Promise<Insight[]> {
  const insights = await getInsights();
  return insights.filter(i => i.isNew && !i.isAcknowledged);
}

/**
 * Get count of new insights (for badge/glow)
 */
export async function getNewInsightCount(): Promise<number> {
  const newInsights = await getNewInsights();
  return newInsights.length;
}

/**
 * Mark an insight as seen/acknowledged
 */
export async function acknowledgeInsight(insightId: string): Promise<void> {
  const insights = await getInsights();
  const updated = insights.map(i =>
    i.id === insightId
      ? { ...i, isNew: false, isAcknowledged: true }
      : i
  );
  await AsyncStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(updated));
}

/**
 * Mark all new insights as seen
 */
export async function acknowledgeAllInsights(): Promise<void> {
  const insights = await getInsights();
  const updated = insights.map(i => ({ ...i, isNew: false, isAcknowledged: true }));
  await AsyncStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(updated));
}

/**
 * Record user reaction to an insight
 */
export async function recordInsightReaction(
  insightId: string,
  reaction: Insight['userReaction'],
  notes?: string
): Promise<void> {
  const insights = await getInsights();
  const updated = insights.map(i =>
    i.id === insightId
      ? { ...i, userReaction: reaction, userNotes: notes }
      : i
  );
  await AsyncStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(updated));
}

/**
 * Get insights the coach can mention in conversation
 */
export async function getInsightsForCoach(): Promise<Insight[]> {
  const settings = await getInsightSettings();
  if (!settings.coachCanMention) return [];

  const insights = await getInsights();
  return insights.filter(i =>
    i.strength !== 'emerging' &&         // Only established insights
    i.confidence >= 0.7 &&               // High confidence
    !i.mentionedInConversation           // Not yet mentioned
  );
}

/**
 * Mark that coach mentioned an insight
 */
export async function markInsightMentioned(insightId: string): Promise<void> {
  const insights = await getInsights();
  const updated = insights.map(i =>
    i.id === insightId
      ? { ...i, mentionedInConversation: true, lastMentionedAt: new Date().toISOString() }
      : i
  );
  await AsyncStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(updated));
}

/**
 * Get insight settings
 */
export async function getInsightSettings(): Promise<InsightSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.INSIGHT_SETTINGS);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update insight settings
 */
export async function updateInsightSettings(settings: Partial<InsightSettings>): Promise<void> {
  const current = await getInsightSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(STORAGE_KEYS.INSIGHT_SETTINGS, JSON.stringify(updated));
}

// ============================================
// INSIGHT DISCOVERY
// ============================================

/**
 * Run insight analysis on user data
 * This is the main function that discovers patterns
 */
export async function runInsightAnalysis(
  twigs: any[],
  conversations: any[],
  options?: {
    forceRefresh?: boolean;
    useLLM?: boolean;
    llmApiKey?: string;
  }
): Promise<{ newInsights: Insight[]; updatedInsights: Insight[] }> {
  console.log('[Insights] Starting analysis...');

  const settings = await getInsightSettings();
  if (!settings.enabled) {
    return { newInsights: [], updatedInsights: [] };
  }

  // Check if we should run analysis
  const lastAnalysis = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ANALYSIS);
  if (lastAnalysis && !options?.forceRefresh) {
    const hoursSinceLastAnalysis = (Date.now() - new Date(lastAnalysis).getTime()) / (1000 * 60 * 60);
    if (settings.analysisFrequency === 'daily' && hoursSinceLastAnalysis < 24) {
      console.log('[Insights] Skipping - ran recently');
      return { newInsights: [], updatedInsights: [] };
    }
  }

  const existingInsights = await getInsights();
  const newInsights: Insight[] = [];
  const updatedInsights: Insight[] = [];

  // 1. Run heuristic pattern detection
  const heuristicResults = await runHeuristicAnalysis(twigs, conversations);

  // 2. Optionally run LLM analysis for deeper patterns
  let llmResults: Insight[] = [];
  if ((options?.useLLM || settings.useLLMAnalysis) && options?.llmApiKey) {
    llmResults = await runLLMAnalysis(twigs, conversations, options.llmApiKey, settings.llmProvider);
  }

  // 3. Merge and deduplicate results
  const allResults = [...heuristicResults, ...llmResults];

  for (const result of allResults) {
    const existing = existingInsights.find(e =>
      e.category === result.category &&
      isSimilarInsight(e, result)
    );

    if (existing) {
      // Update existing insight with new evidence
      const updated = {
        ...existing,
        evidence: [...existing.evidence, ...result.evidence].slice(-10), // Keep last 10 evidence points
        timesReinforced: existing.timesReinforced + 1,
        lastUpdatedAt: new Date().toISOString(),
        strength: calculateStrength(existing.timesReinforced + 1),
        confidence: Math.min(existing.confidence + 0.05, 0.95),
      };
      updatedInsights.push(updated);
    } else if (result.confidence >= settings.minConfidenceToShow) {
      // New insight
      newInsights.push({
        ...result,
        isNew: true,
        isAcknowledged: false,
      });
    }
  }

  // 4. Save updated insights
  const finalInsights = [
    ...existingInsights.filter(e => !updatedInsights.some(u => u.id === e.id)),
    ...updatedInsights,
    ...newInsights,
  ];

  await AsyncStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(finalInsights));
  await AsyncStorage.setItem(STORAGE_KEYS.LAST_ANALYSIS, new Date().toISOString());

  console.log(`[Insights] Found ${newInsights.length} new, ${updatedInsights.length} updated`);

  return { newInsights, updatedInsights };
}

/**
 * Run heuristic/statistical pattern detection
 */
async function runHeuristicAnalysis(
  twigs: any[],
  conversations: any[]
): Promise<Insight[]> {
  const insights: Insight[] = [];

  if (twigs.length < 5) {
    console.log('[Insights] Not enough twigs for analysis');
    return insights;
  }

  // Extract data points for analysis
  const dataPoints = extractDataPoints(twigs, conversations);

  // Check each pattern template
  for (const pattern of PATTERN_TEMPLATES) {
    const result = checkPattern(pattern, dataPoints);
    if (result) {
      insights.push(result);
    }
  }

  // Look for custom correlations
  const correlations = findCorrelations(dataPoints);
  insights.push(...correlations);

  return insights;
}

/**
 * Run LLM-based analysis for deeper pattern recognition
 */
async function runLLMAnalysis(
  twigs: any[],
  conversations: any[],
  apiKey: string,
  provider: 'claude' | 'llama' | 'auto'
): Promise<Insight[]> {
  // TODO: Implement when Llama is available
  // For now, this could use Claude API with user consent

  console.log('[Insights] LLM analysis not yet implemented');
  return [];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface DataPoint {
  date: string;
  mood?: number;
  energy?: number;
  sleep?: number;
  activities: string[];
  keywords: string[];
  social: boolean;
  outdoor: boolean;
  exercise: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  content: string;
}

function extractDataPoints(twigs: any[], conversations: any[]): DataPoint[] {
  const points: DataPoint[] = [];

  for (const twig of twigs) {
    const date = new Date(twig.createdAt || twig.timestamp);
    const content = (twig.content || twig.text || '').toLowerCase();

    points.push({
      date: twig.createdAt || twig.timestamp,
      mood: twig.mood || extractMoodFromContent(content),
      energy: twig.energy,
      sleep: twig.sleep,
      activities: extractActivities(content),
      keywords: extractKeywords(content),
      social: /friend|family|people|social|meeting|call|text/i.test(content),
      outdoor: /outside|outdoor|walk|park|nature|sun/i.test(content),
      exercise: /exercise|workout|gym|run|yoga|sport/i.test(content),
      timeOfDay: getTimeOfDay(date),
      dayOfWeek: date.getDay(),
      content,
    });
  }

  return points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function extractMoodFromContent(content: string): number | undefined {
  // Simple sentiment analysis
  const positive = /happy|good|great|amazing|wonderful|joy|excited|peaceful|calm/i;
  const negative = /sad|bad|terrible|awful|anxious|stressed|angry|frustrated|tired/i;

  const posMatches = (content.match(positive) || []).length;
  const negMatches = (content.match(negative) || []).length;

  if (posMatches > negMatches) return 7;
  if (negMatches > posMatches) return 3;
  return 5;
}

function extractActivities(content: string): string[] {
  const activities: string[] = [];

  const activityPatterns = [
    { pattern: /meditat/i, activity: 'meditation' },
    { pattern: /exercis|workout|gym|run|jog/i, activity: 'exercise' },
    { pattern: /read/i, activity: 'reading' },
    { pattern: /cook/i, activity: 'cooking' },
    { pattern: /walk/i, activity: 'walking' },
    { pattern: /work/i, activity: 'work' },
    { pattern: /sleep|slept|bed/i, activity: 'sleep' },
    { pattern: /coffee|caffeine/i, activity: 'caffeine' },
    { pattern: /alcohol|drink|beer|wine/i, activity: 'alcohol' },
    { pattern: /netflix|tv|show|movie/i, activity: 'screen_time' },
    { pattern: /social media|instagram|twitter|tiktok/i, activity: 'social_media' },
    { pattern: /junk food|fast food|pizza|burger/i, activity: 'junk_food' },
  ];

  for (const { pattern, activity } of activityPatterns) {
    if (pattern.test(content)) {
      activities.push(activity);
    }
  }

  return activities;
}

function extractKeywords(content: string): string[] {
  // Extract significant words for pattern matching
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'i', 'my', 'me', 'to', 'and', 'of', 'in', 'it', 'that', 'this', 'for', 'on', 'with', 'as', 'at', 'by', 'be', 'have', 'had', 'do', 'did', 'but', 'or', 'not', 'so', 'just', 'like', 'really', 'very', 'today', 'feeling', 'feel', 'felt']);

  const words = content
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  return [...new Set(words)];
}

function getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = date.getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function checkPattern(pattern: PatternDefinition, dataPoints: DataPoint[]): Insight | null {
  // Simple pattern matching
  // A more sophisticated implementation would use statistical analysis

  const recentPoints = dataPoints.filter(p => {
    const daysDiff = (Date.now() - new Date(p.date).getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= pattern.windowDays;
  });

  if (recentPoints.length < pattern.minOccurrences) {
    return null;
  }

  let matchCount = 0;
  const evidence: InsightEvidence[] = [];

  for (const point of recentPoints) {
    let triggerMatch = false;

    for (const trigger of pattern.triggers) {
      switch (trigger.type) {
        case 'sleep':
          if (point.sleep !== undefined) {
            if (trigger.comparator === 'below' && point.sleep < (trigger.threshold || 6)) triggerMatch = true;
            if (trigger.comparator === 'above' && point.sleep > (trigger.threshold || 7)) triggerMatch = true;
          }
          break;
        case 'activity':
          if (trigger.comparator === 'contains' && point.activities.some(a => a.includes(trigger.value || ''))) triggerMatch = true;
          if (trigger.comparator === 'equals' && point.activities.includes(trigger.value || '')) triggerMatch = true;
          if (trigger.comparator === 'absent' && !point.activities.some(a => a.includes(trigger.value || ''))) triggerMatch = true;
          break;
        case 'mood':
          if (point.mood !== undefined) {
            if (trigger.comparator === 'below' && point.mood < (trigger.threshold || 5)) triggerMatch = true;
            if (trigger.comparator === 'above' && point.mood > (trigger.threshold || 5)) triggerMatch = true;
          }
          break;
        case 'time':
          if (trigger.value === point.timeOfDay) triggerMatch = true;
          break;
        case 'keyword':
          if (point.keywords.some(k => k.includes(trigger.value || ''))) triggerMatch = true;
          break;
      }
    }

    if (triggerMatch) {
      matchCount++;
      evidence.push({
        id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'twig',
        sourceId: point.date,
        description: `Observed on ${new Date(point.date).toLocaleDateString()}`,
        timestamp: point.date,
        weight: 1,
      });
    }
  }

  if (matchCount >= pattern.minOccurrences) {
    const confidence = Math.min(0.5 + (matchCount / (pattern.minOccurrences * 2)) * 0.4, 0.9);

    return {
      id: `insight_${pattern.id}_${Date.now()}`,
      category: pattern.category,
      title: pattern.name,
      description: pattern.insightTemplate,
      evidence: evidence.slice(0, 5),
      strength: calculateStrength(matchCount),
      sentiment: determineSentiment(pattern.category),
      discoveredAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      timesReinforced: matchCount,
      isNew: true,
      isAcknowledged: false,
      mentionedInConversation: false,
      source: 'heuristic',
      confidence,
    };
  }

  return null;
}

function findCorrelations(dataPoints: DataPoint[]): Insight[] {
  // Find correlations not covered by templates
  const insights: Insight[] = [];

  // Example: Look for keyword → mood correlations
  const keywordMoodMap = new Map<string, number[]>();

  for (const point of dataPoints) {
    if (point.mood !== undefined) {
      for (const keyword of point.keywords) {
        if (!keywordMoodMap.has(keyword)) {
          keywordMoodMap.set(keyword, []);
        }
        keywordMoodMap.get(keyword)!.push(point.mood);
      }
    }
  }

  // Find keywords with strong mood correlations
  for (const [keyword, moods] of keywordMoodMap) {
    if (moods.length >= 3) {
      const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
      const overallAvg = dataPoints
        .filter(p => p.mood !== undefined)
        .reduce((sum, p) => sum + p.mood!, 0) / dataPoints.length;

      const diff = avgMood - overallAvg;

      if (Math.abs(diff) > 1.5) {
        insights.push({
          id: `insight_keyword_${keyword}_${Date.now()}`,
          category: 'correlation',
          title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Pattern`,
          description: diff > 0
            ? `When "${keyword}" appears in your entries, your mood tends to be higher.`
            : `When "${keyword}" appears in your entries, your mood tends to be lower.`,
          evidence: [],
          strength: 'developing',
          sentiment: diff > 0 ? 'positive' : 'cautionary',
          discoveredAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
          timesReinforced: moods.length,
          isNew: true,
          isAcknowledged: false,
          mentionedInConversation: false,
          source: 'statistical',
          confidence: Math.min(0.5 + (moods.length / 10) * 0.3, 0.8),
        });
      }
    }
  }

  return insights;
}

function calculateStrength(occurrences: number): InsightStrength {
  if (occurrences < 3) return 'emerging';
  if (occurrences < 5) return 'developing';
  if (occurrences < 10) return 'established';
  return 'strong';
}

function determineSentiment(category: InsightCategory): InsightSentiment {
  switch (category) {
    case 'warning_sign':
      return 'cautionary';
    case 'growth':
    case 'recovery':
      return 'positive';
    case 'avoidance':
      return 'growth_opportunity';
    default:
      return 'neutral';
  }
}

function isSimilarInsight(a: Insight, b: Insight): boolean {
  // Check if two insights are about the same pattern
  return a.category === b.category &&
    (a.title === b.title || a.description === b.description);
}

// ============================================
// COACH INTEGRATION HELPERS
// ============================================

/**
 * Get insight context for coach system prompt
 */
export async function getInsightContextForCoach(): Promise<string> {
  const insights = await getInsightsForCoach();

  if (insights.length === 0) {
    return '';
  }

  const lines = [
    '\n=== USER INSIGHTS (Patterns you\'ve noticed) ===',
    'These are patterns discovered from the user\'s history. You can reference these naturally when relevant:',
    ''
  ];

  for (const insight of insights.slice(0, 5)) { // Top 5 most relevant
    lines.push(`• [${insight.category}] ${insight.description}`);
    if (insight.strength === 'strong' || insight.strength === 'established') {
      lines.push(`  (This is a well-established pattern with ${insight.timesReinforced} observations)`);
    }
  }

  lines.push('');
  lines.push('When mentioning insights, be natural and conversational. Don\'t list them robotically.');
  lines.push('Congratulate the user when they achieve a new insight or reinforce a positive pattern.');

  return lines.join('\n');
}

/**
 * Check if coach should congratulate user on a new insight
 */
export async function shouldCongratulateOnInsight(): Promise<Insight | null> {
  const newInsights = await getNewInsights();

  // Find a positive insight worth celebrating
  const celebratableInsight = newInsights.find(i =>
    (i.sentiment === 'positive' || i.category === 'growth') &&
    i.strength !== 'emerging' &&
    !i.mentionedInConversation
  );

  return celebratableInsight || null;
}

/**
 * Generate congratulations message for coach
 */
export function generateInsightCongratulations(insight: Insight): string {
  const messages = [
    `I've noticed something interesting! ${insight.description}`,
    `You've unlocked a new insight: ${insight.title}. ${insight.description}`,
    `There's a pattern forming that I wanted to share with you. ${insight.description}`,
    `Something worth celebrating: ${insight.description}`,
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  // Core functions
  getInsights,
  getNewInsights,
  getNewInsightCount,
  acknowledgeInsight,
  acknowledgeAllInsights,
  recordInsightReaction,

  // Settings
  getInsightSettings,
  updateInsightSettings,

  // Analysis
  runInsightAnalysis,

  // Coach integration
  getInsightsForCoach,
  markInsightMentioned,
  getInsightContextForCoach,
  shouldCongratulateOnInsight,
  generateInsightCongratulations,

  // Constants
  PATTERN_TEMPLATES,
};
