/**
 * Period Correlation Service
 *
 * Tracks lifestyle factors (food, sleep, activity) and correlates them
 * with menstrual cycle symptoms to provide personalized insights.
 *
 * Research-backed correlations from:
 * - Cambridge Nutrition Review (food/symptoms)
 * - Nature Scientific Reports (sleep/PMS)
 * - PMC Systematic Reviews (lifestyle/cycle)
 *
 * Privacy: All data stored locally. Only insights (not raw data) used in MoodPrint.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DailyCorrelationLog,
  CorrelationData,
  CorrelationResult,
  PersonalizedInsight,
  SleepLog,
  SleepQuality,
  SleepIssue,
  SymptomIntensity,
  EnhancedSymptomLog,
  FOOD_TAGS,
  INSIGHT_THRESHOLDS,
  createEmptyCorrelationData,
} from '../types/PeriodCorrelation';

// ============================================
// STORAGE
// ============================================

const STORAGE_KEY = 'moodleaf_period_correlations';

export async function getCorrelationData(): Promise<CorrelationData> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return createEmptyCorrelationData();
  } catch (error) {
    console.error('[PeriodCorrelation] Error loading data:', error);
    return createEmptyCorrelationData();
  }
}

export async function saveCorrelationData(data: CorrelationData): Promise<void> {
  try {
    data.lastUpdated = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[PeriodCorrelation] Error saving data:', error);
    throw error;
  }
}

// ============================================
// DAILY LOGGING
// ============================================

/**
 * Log or update today's correlation data
 */
export async function logToday(
  updates: Partial<Omit<DailyCorrelationLog, 'date' | 'createdAt' | 'updatedAt'>>
): Promise<DailyCorrelationLog> {
  const data = await getCorrelationData();
  const today = new Date().toISOString().split('T')[0];

  // Find or create today's log
  let todayLog = data.logs.find((l) => l.date === today);

  if (todayLog) {
    // Update existing log
    todayLog = {
      ...todayLog,
      ...updates,
      // Merge food tags instead of replacing
      foodTags: updates.foodTags
        ? [...new Set([...todayLog.foodTags, ...updates.foodTags])]
        : todayLog.foodTags,
      // Merge symptoms instead of replacing
      symptoms: updates.symptoms
        ? { ...todayLog.symptoms, ...updates.symptoms }
        : todayLog.symptoms,
      updatedAt: new Date().toISOString(),
    };
    const index = data.logs.findIndex((l) => l.date === today);
    data.logs[index] = todayLog;
  } else {
    // Create new log
    todayLog = {
      date: today,
      foodTags: [],
      ...updates,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.logs.push(todayLog);
  }

  await saveCorrelationData(data);
  return todayLog;
}

/**
 * Quick-log food tags (tap to add)
 */
export async function logFoodTags(tagIds: string[]): Promise<void> {
  await logToday({ foodTags: tagIds });
}

/**
 * Remove a food tag from today's log
 */
export async function removeFoodTag(tagId: string): Promise<void> {
  const data = await getCorrelationData();
  const today = new Date().toISOString().split('T')[0];

  const todayLog = data.logs.find((l) => l.date === today);
  if (todayLog) {
    todayLog.foodTags = todayLog.foodTags.filter((t) => t !== tagId);
    todayLog.updatedAt = new Date().toISOString();
    await saveCorrelationData(data);
  }
}

/**
 * Log sleep data
 */
export async function logSleep(sleep: Omit<SleepLog, 'date'>): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  await logToday({
    sleep: {
      ...sleep,
      date: today,
    },
  });
}

/**
 * Log symptoms with intensity
 */
export async function logSymptoms(
  symptoms: EnhancedSymptomLog['symptoms']
): Promise<void> {
  await logToday({ symptoms });
}

/**
 * Log flow level
 */
export async function logFlowLevel(
  flowLevel: DailyCorrelationLog['flowLevel']
): Promise<void> {
  await logToday({ flowLevel });
}

/**
 * Log exercise
 */
export async function logExercise(
  minutes: number,
  type: DailyCorrelationLog['exerciseType']
): Promise<void> {
  await logToday({
    exerciseMinutes: minutes,
    exerciseType: type,
  });
}

/**
 * Log mood score
 */
export async function logMood(score: number): Promise<void> {
  await logToday({ moodScore: score });
}

/**
 * Log stress level
 */
export async function logStress(level: 1 | 2 | 3 | 4 | 5): Promise<void> {
  await logToday({ stressLevel: level });
}

/**
 * Get today's log
 */
export async function getTodayLog(): Promise<DailyCorrelationLog | null> {
  const data = await getCorrelationData();
  const today = new Date().toISOString().split('T')[0];
  return data.logs.find((l) => l.date === today) || null;
}

/**
 * Get logs for a date range
 */
export async function getLogsForRange(
  startDate: string,
  endDate: string
): Promise<DailyCorrelationLog[]> {
  const data = await getCorrelationData();
  return data.logs.filter((l) => l.date >= startDate && l.date <= endDate);
}

// ============================================
// CORRELATION ANALYSIS
// ============================================

/**
 * Analyze correlations between lifestyle factors and symptoms
 * Should be called periodically (e.g., end of each cycle)
 */
export async function analyzeCorrelations(): Promise<CorrelationResult[]> {
  const data = await getCorrelationData();

  // Need at least 2 cycles of data
  const cycleCount = countCompleteCycles(data.logs);
  if (cycleCount < INSIGHT_THRESHOLDS.MIN_CYCLES_BASIC) {
    return [];
  }

  const correlations: CorrelationResult[] = [];

  // Analyze food → symptom correlations
  correlations.push(...analyzeFoodCorrelations(data.logs));

  // Analyze sleep → symptom correlations
  correlations.push(...analyzeSleepCorrelations(data.logs));

  // Analyze exercise → symptom correlations
  correlations.push(...analyzeExerciseCorrelations(data.logs));

  // Save correlations
  data.correlations = correlations;
  data.cyclesTracked = cycleCount;
  data.lastAnalyzed = new Date().toISOString();
  await saveCorrelationData(data);

  return correlations;
}

/**
 * Count complete menstrual cycles in the data
 */
function countCompleteCycles(logs: DailyCorrelationLog[]): number {
  // Count transitions from menstrual phase to next menstrual phase
  let cycles = 0;
  let inMenstrual = false;

  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  for (const log of sortedLogs) {
    if (log.phase === 'menstrual' && !inMenstrual) {
      inMenstrual = true;
    } else if (log.phase !== 'menstrual' && inMenstrual) {
      inMenstrual = false;
      cycles++;
    }
  }

  return cycles;
}

/**
 * Analyze food tag correlations with symptoms
 */
function analyzeFoodCorrelations(logs: DailyCorrelationLog[]): CorrelationResult[] {
  const results: CorrelationResult[] = [];

  // Get all unique food tags that appear in logs
  const allFoodTags = new Set<string>();
  logs.forEach((l) => l.foodTags.forEach((t) => allFoodTags.add(t)));

  // Get all symptom types that appear in logs
  const symptomTypes = [
    'cramps',
    'bloating',
    'headache',
    'moodDip',
    'fatigue',
    'anxiety',
  ] as const;

  for (const tagId of allFoodTags) {
    for (const symptom of symptomTypes) {
      const correlation = calculateCorrelation(logs, tagId, symptom);
      if (correlation && correlation.dataPoints >= 5) {
        results.push(correlation);
      }
    }
  }

  return results;
}

/**
 * Calculate correlation between a factor and a symptom
 */
function calculateCorrelation(
  logs: DailyCorrelationLog[],
  factorId: string,
  symptomKey: keyof EnhancedSymptomLog['symptoms']
): CorrelationResult | null {
  // Get logs where the factor was present
  const withFactor = logs.filter((l) => l.foodTags.includes(factorId));
  // Get logs where the factor was absent
  const withoutFactor = logs.filter((l) => !l.foodTags.includes(factorId));

  if (withFactor.length < 3 || withoutFactor.length < 3) {
    return null; // Not enough data
  }

  // Calculate average symptom intensity with and without factor
  const avgWithFactor = calculateAvgSymptom(withFactor, symptomKey);
  const avgWithoutFactor = calculateAvgSymptom(withoutFactor, symptomKey);

  if (avgWithFactor === null || avgWithoutFactor === null) {
    return null;
  }

  // Calculate correlation strength (-1 to 1)
  // Positive = factor increases symptom
  // Negative = factor decreases symptom
  const diff = avgWithFactor - avgWithoutFactor;
  const maxPossibleDiff = 3; // Max symptom intensity
  const correlation = Math.max(-1, Math.min(1, diff / maxPossibleDiff));

  // Calculate confidence based on sample size
  const totalPoints = withFactor.length + withoutFactor.length;
  const confidence = Math.min(1, totalPoints / 30); // Max confidence at 30+ data points

  return {
    factor: factorId,
    symptom: symptomKey,
    correlation,
    confidence,
    dataPoints: totalPoints,
    direction:
      Math.abs(correlation) < INSIGHT_THRESHOLDS.WEAK_CORRELATION
        ? 'neutral'
        : correlation > 0
        ? 'increases'
        : 'decreases',
  };
}

/**
 * Calculate average symptom intensity from logs
 */
function calculateAvgSymptom(
  logs: DailyCorrelationLog[],
  symptomKey: keyof EnhancedSymptomLog['symptoms']
): number | null {
  const values = logs
    .map((l) => l.symptoms?.[symptomKey])
    .filter((v): v is SymptomIntensity => v !== undefined && v !== null);

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Analyze sleep correlations with symptoms
 */
function analyzeSleepCorrelations(logs: DailyCorrelationLog[]): CorrelationResult[] {
  const results: CorrelationResult[] = [];

  // Poor sleep (< 6 hours) correlation with symptoms
  const poorSleepLogs = logs.filter((l) => l.sleep && l.sleep.hours && l.sleep.hours < 6);
  const goodSleepLogs = logs.filter((l) => l.sleep && l.sleep.hours && l.sleep.hours >= 7);

  const symptomTypes = ['cramps', 'moodDip', 'fatigue', 'anxiety', 'headache'] as const;

  for (const symptom of symptomTypes) {
    if (poorSleepLogs.length >= 3 && goodSleepLogs.length >= 3) {
      const avgPoor = calculateAvgSymptom(poorSleepLogs, symptom);
      const avgGood = calculateAvgSymptom(goodSleepLogs, symptom);

      if (avgPoor !== null && avgGood !== null) {
        const diff = avgPoor - avgGood;
        const correlation = Math.max(-1, Math.min(1, diff / 3));
        const totalPoints = poorSleepLogs.length + goodSleepLogs.length;

        results.push({
          factor: 'poor_sleep',
          symptom,
          correlation,
          confidence: Math.min(1, totalPoints / 30),
          dataPoints: totalPoints,
          direction:
            Math.abs(correlation) < INSIGHT_THRESHOLDS.WEAK_CORRELATION
              ? 'neutral'
              : correlation > 0
              ? 'increases'
              : 'decreases',
        });
      }
    }
  }

  return results;
}

/**
 * Analyze exercise correlations with symptoms
 */
function analyzeExerciseCorrelations(logs: DailyCorrelationLog[]): CorrelationResult[] {
  const results: CorrelationResult[] = [];

  // Active vs sedentary days
  const activeLogs = logs.filter(
    (l) => l.exerciseMinutes && l.exerciseMinutes >= 20
  );
  const sedentaryLogs = logs.filter(
    (l) => !l.exerciseMinutes || l.exerciseMinutes < 10
  );

  const symptomTypes = ['cramps', 'moodDip', 'fatigue', 'bloating'] as const;

  for (const symptom of symptomTypes) {
    if (activeLogs.length >= 3 && sedentaryLogs.length >= 3) {
      const avgActive = calculateAvgSymptom(activeLogs, symptom);
      const avgSedentary = calculateAvgSymptom(sedentaryLogs, symptom);

      if (avgActive !== null && avgSedentary !== null) {
        // Negative correlation means exercise reduces symptom
        const diff = avgActive - avgSedentary;
        const correlation = Math.max(-1, Math.min(1, diff / 3));
        const totalPoints = activeLogs.length + sedentaryLogs.length;

        results.push({
          factor: 'exercise',
          symptom,
          correlation,
          confidence: Math.min(1, totalPoints / 30),
          dataPoints: totalPoints,
          direction:
            Math.abs(correlation) < INSIGHT_THRESHOLDS.WEAK_CORRELATION
              ? 'neutral'
              : correlation > 0
              ? 'increases'
              : 'decreases',
        });
      }
    }
  }

  return results;
}

// ============================================
// INSIGHT GENERATION
// ============================================

/**
 * Generate personalized insights from correlations
 */
export async function generateInsights(): Promise<PersonalizedInsight[]> {
  const data = await getCorrelationData();
  const insights: PersonalizedInsight[] = [];

  // Filter to significant correlations
  const significant = data.correlations.filter(
    (c) =>
      c.confidence >= INSIGHT_THRESHOLDS.MIN_CONFIDENCE_SHOW &&
      Math.abs(c.correlation) >= INSIGHT_THRESHOLDS.MODERATE_CORRELATION
  );

  for (const corr of significant) {
    const insight = correlationToInsight(corr);
    if (insight) {
      insights.push(insight);
    }
  }

  // Save insights
  data.insights = insights;
  await saveCorrelationData(data);

  return insights;
}

/**
 * Convert a correlation to a user-friendly insight
 */
function correlationToInsight(corr: CorrelationResult): PersonalizedInsight | null {
  const factorLabel = getFriendlyFactorName(corr.factor);
  const symptomLabel = getFriendlySymptomName(corr.symptom);

  if (!factorLabel || !symptomLabel) {
    return null;
  }

  const id = `${corr.factor}_${corr.symptom}`;
  const strength = Math.abs(corr.correlation) >= INSIGHT_THRESHOLDS.STRONG_CORRELATION
    ? 'significantly'
    : 'noticeably';

  if (corr.direction === 'increases') {
    // Factor makes symptom worse
    return {
      id,
      type: 'warning',
      title: `${factorLabel} & ${symptomLabel}`,
      message: `When you have ${factorLabel.toLowerCase()}, your ${symptomLabel.toLowerCase()} tends to be ${strength} worse.`,
      basedOn: `${corr.dataPoints} days of data across ${Math.floor(corr.dataPoints / 28)} cycles`,
      confidence: corr.confidence,
      actionable: `Consider reducing ${factorLabel.toLowerCase()} before and during your period.`,
    };
  } else if (corr.direction === 'decreases') {
    // Factor helps with symptom
    return {
      id,
      type: 'positive',
      title: `${factorLabel} helps with ${symptomLabel}`,
      message: `When you have ${factorLabel.toLowerCase()}, your ${symptomLabel.toLowerCase()} tends to be ${strength} better.`,
      basedOn: `${corr.dataPoints} days of data across ${Math.floor(corr.dataPoints / 28)} cycles`,
      confidence: corr.confidence,
      actionable: `Keep up the ${factorLabel.toLowerCase()}, especially around your period!`,
    };
  }

  return null;
}

/**
 * Get user-friendly name for a factor
 */
function getFriendlyFactorName(factor: string): string | null {
  // Check food tags
  const foodTag = FOOD_TAGS.find((t) => t.id === factor);
  if (foodTag) {
    return `${foodTag.emoji} ${foodTag.label}`;
  }

  // Built-in factors
  const builtIn: Record<string, string> = {
    poor_sleep: '😴 Poor sleep',
    good_sleep: '😴 Good sleep',
    exercise: '🏃 Exercise',
    no_exercise: '🛋️ No exercise',
  };

  return builtIn[factor] || null;
}

/**
 * Get user-friendly name for a symptom
 */
function getFriendlySymptomName(symptom: string): string | null {
  const names: Record<string, string> = {
    cramps: 'cramps',
    bloating: 'bloating',
    headache: 'headaches',
    moodDip: 'mood dips',
    fatigue: 'fatigue',
    cravings: 'cravings',
    anxiety: 'anxiety',
    irritability: 'irritability',
    breastTenderness: 'breast tenderness',
    backPain: 'back pain',
    acne: 'breakouts',
    nausea: 'nausea',
  };

  return names[symptom] || null;
}

// ============================================
// GET INSIGHTS FOR DISPLAY
// ============================================

/**
 * Get current insights for the user
 */
export async function getCurrentInsights(): Promise<{
  insights: PersonalizedInsight[];
  cyclesTracked: number;
  canShowInsights: boolean;
  nextMilestone: string | null;
}> {
  const data = await getCorrelationData();
  const cyclesTracked = data.cyclesTracked;

  // Check if we have enough data
  if (cyclesTracked < INSIGHT_THRESHOLDS.MIN_CYCLES_BASIC) {
    return {
      insights: [],
      cyclesTracked,
      canShowInsights: false,
      nextMilestone: `Track ${INSIGHT_THRESHOLDS.MIN_CYCLES_BASIC - cyclesTracked} more cycle(s) to see basic patterns`,
    };
  }

  // Run analysis if needed
  if (!data.lastAnalyzed || daysSince(data.lastAnalyzed) > 7) {
    await analyzeCorrelations();
    await generateInsights();
  }

  const freshData = await getCorrelationData();

  let nextMilestone: string | null = null;
  if (cyclesTracked < INSIGHT_THRESHOLDS.MIN_CYCLES_PERSONALIZED) {
    nextMilestone = `${INSIGHT_THRESHOLDS.MIN_CYCLES_PERSONALIZED - cyclesTracked} more cycle(s) for personalized suggestions`;
  }

  return {
    insights: freshData.insights,
    cyclesTracked,
    canShowInsights: true,
    nextMilestone,
  };
}

/**
 * Helper: days since a date string
 */
function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================
// CYCLE SUGGESTIONS
// ============================================

/**
 * Get suggestions based on where user is in their cycle
 */
export async function getCycleSuggestions(
  daysUntilPeriod: number | null,
  currentPhase: string | null
): Promise<string[]> {
  const data = await getCorrelationData();
  const suggestions: string[] = [];

  if (daysUntilPeriod !== null && daysUntilPeriod <= 7 && daysUntilPeriod > 0) {
    // Pre-period window - give actionable suggestions
    const negativeCorrelations = data.correlations.filter(
      (c) =>
        c.direction === 'increases' &&
        c.confidence >= INSIGHT_THRESHOLDS.MIN_CONFIDENCE_SUGGEST
    );

    for (const corr of negativeCorrelations.slice(0, 2)) {
      const factorLabel = getFriendlyFactorName(corr.factor);
      if (factorLabel) {
        suggestions.push(
          `Based on your patterns, reducing ${factorLabel.toLowerCase()} this week might help.`
        );
      }
    }

    const positiveCorrelations = data.correlations.filter(
      (c) =>
        c.direction === 'decreases' &&
        c.confidence >= INSIGHT_THRESHOLDS.MIN_CONFIDENCE_SUGGEST
    );

    for (const corr of positiveCorrelations.slice(0, 2)) {
      const factorLabel = getFriendlyFactorName(corr.factor);
      if (factorLabel) {
        suggestions.push(
          `Your data shows ${factorLabel.toLowerCase()} often helps - good time to prioritize it!`
        );
      }
    }
  }

  // Sleep suggestion during luteal/PMS
  if (currentPhase === 'luteal') {
    const sleepCorr = data.correlations.find(
      (c) => c.factor === 'poor_sleep' && c.direction === 'increases'
    );
    if (sleepCorr && sleepCorr.confidence >= INSIGHT_THRESHOLDS.MIN_CONFIDENCE_SUGGEST) {
      suggestions.push('Sleep quality matters extra this week - try to get 7+ hours.');
    }
  }

  return suggestions;
}

// ============================================
// DATA EXPORT / CLEAR
// ============================================

/**
 * Export correlation data for backup
 */
export async function exportCorrelationData(): Promise<string> {
  const data = await getCorrelationData();
  return JSON.stringify(data, null, 2);
}

/**
 * Clear all correlation data
 */
export async function clearCorrelationData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/**
 * Get summary stats for display
 */
export async function getCorrelationStats(): Promise<{
  totalLogs: number;
  cyclesTracked: number;
  correlationsFound: number;
  insightsGenerated: number;
  topPositive: PersonalizedInsight | null;
  topWarning: PersonalizedInsight | null;
}> {
  const data = await getCorrelationData();

  const positiveInsights = data.insights.filter((i) => i.type === 'positive');
  const warningInsights = data.insights.filter((i) => i.type === 'warning');

  return {
    totalLogs: data.logs.length,
    cyclesTracked: data.cyclesTracked,
    correlationsFound: data.correlations.length,
    insightsGenerated: data.insights.length,
    topPositive: positiveInsights.sort((a, b) => b.confidence - a.confidence)[0] || null,
    topWarning: warningInsights.sort((a, b) => b.confidence - a.confidence)[0] || null,
  };
}
