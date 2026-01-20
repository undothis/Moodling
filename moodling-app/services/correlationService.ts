/**
 * Correlation Service
 *
 * Calculates statistical correlations between lifestyle factors and mood.
 * Used to generate data-driven pattern observations.
 *
 * Following Mood Leaf Ethics:
 * - Observations are tentative ("might", "seems")
 * - Correlation ≠ causation (we're clear about this)
 * - User knows themselves best
 *
 * Unit 12: Correlation Engine
 */

import { DailySummary } from '@/types/DailySummary';

/**
 * Confidence level for pattern observations
 */
export type ConfidenceLevel = 'low' | 'moderate' | 'high';

/**
 * Factor types that can be correlated
 */
export type FactorType = 'sleep' | 'exercise' | 'social' | 'caffeine' | 'alcohol' | 'outdoor' | 'mood';

/**
 * Pattern observation with confidence
 */
export interface PatternObservation {
  id: string;
  emoji: string;
  text: string;
  confidence: ConfidenceLevel;
  factors: FactorType[];
  correlation: number; // -1 to +1
}

/**
 * Calculate Pearson correlation coefficient
 * Returns value between -1 (negative correlation) and +1 (positive correlation)
 * Returns 0 if not enough data or invalid
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 3) {
    return 0;
  }

  const n = x.length;

  // Calculate means
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  // Calculate standard deviations and covariance
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    sumXY += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }

  // Avoid division by zero
  if (sumX2 === 0 || sumY2 === 0) {
    return 0;
  }

  const correlation = sumXY / Math.sqrt(sumX2 * sumY2);

  // Clamp to valid range
  return Math.max(-1, Math.min(1, correlation));
}

/**
 * Get confidence level based on correlation strength and sample size
 */
function getConfidence(correlation: number, sampleSize: number): ConfidenceLevel {
  const absCorr = Math.abs(correlation);

  if (sampleSize < 5) return 'low';
  if (sampleSize < 7 && absCorr < 0.5) return 'low';

  if (absCorr >= 0.6 && sampleSize >= 7) return 'high';
  if (absCorr >= 0.4 && sampleSize >= 5) return 'moderate';

  return 'low';
}

/**
 * Generate pattern observations from daily summaries using correlation analysis
 */
export function generateCorrelationObservations(days: DailySummary[]): PatternObservation[] {
  const observations: PatternObservation[] = [];

  // Extract mood data (sentiment scores)
  const daysWithMood = days.filter((d) => d.averageSentiment !== null);
  if (daysWithMood.length < 3) {
    return observations;
  }

  const moods = daysWithMood.map((d) => d.averageSentiment!);

  // Sleep correlation
  const daysWithSleep = daysWithMood.filter((d) => d.factors.sleepHours !== undefined);
  if (daysWithSleep.length >= 3) {
    const sleeps = daysWithSleep.map((d) => d.factors.sleepHours!);
    const sleepMoods = daysWithSleep.map((d) => d.averageSentiment!);
    const sleepCorr = calculateCorrelation(sleeps, sleepMoods);

    if (Math.abs(sleepCorr) >= 0.3) {
      const confidence = getConfidence(sleepCorr, daysWithSleep.length);
      observations.push({
        id: 'sleep-mood',
        emoji: '😴',
        text:
          sleepCorr > 0
            ? 'More sleep seems connected to more positive entries.'
            : 'Interestingly, less sleep might correlate with your mood.',
        confidence,
        factors: ['sleep', 'mood'],
        correlation: sleepCorr,
      });
    }
  }

  // Exercise correlation
  const daysWithExercise = daysWithMood.filter((d) => d.factors.exerciseMinutes !== undefined);
  if (daysWithExercise.length >= 3) {
    const exercises = daysWithExercise.map((d) => d.factors.exerciseMinutes!);
    const exerciseMoods = daysWithExercise.map((d) => d.averageSentiment!);
    const exerciseCorr = calculateCorrelation(exercises, exerciseMoods);

    if (Math.abs(exerciseCorr) >= 0.3) {
      const confidence = getConfidence(exerciseCorr, daysWithExercise.length);
      observations.push({
        id: 'exercise-mood',
        emoji: '🏃',
        text:
          exerciseCorr > 0
            ? 'Exercise days tend to come with brighter entries.'
            : 'You might notice different moods on active days.',
        confidence,
        factors: ['exercise', 'mood'],
        correlation: exerciseCorr,
      });
    }
  }

  // Social correlation
  const daysWithSocial = daysWithMood.filter((d) => d.factors.socialMinutes !== undefined);
  if (daysWithSocial.length >= 3) {
    const socials = daysWithSocial.map((d) => d.factors.socialMinutes!);
    const socialMoods = daysWithSocial.map((d) => d.averageSentiment!);
    const socialCorr = calculateCorrelation(socials, socialMoods);

    if (Math.abs(socialCorr) >= 0.3) {
      const confidence = getConfidence(socialCorr, daysWithSocial.length);
      observations.push({
        id: 'social-mood',
        emoji: '👥',
        text:
          socialCorr > 0
            ? 'Time with others might be connected to how you feel.'
            : 'Social time shows an interesting pattern with your mood.',
        confidence,
        factors: ['social', 'mood'],
        correlation: socialCorr,
      });
    }
  }

  // Outdoor correlation
  const daysWithOutdoor = daysWithMood.filter((d) => d.factors.outdoorMinutes !== undefined);
  if (daysWithOutdoor.length >= 3) {
    const outdoors = daysWithOutdoor.map((d) => d.factors.outdoorMinutes!);
    const outdoorMoods = daysWithOutdoor.map((d) => d.averageSentiment!);
    const outdoorCorr = calculateCorrelation(outdoors, outdoorMoods);

    if (Math.abs(outdoorCorr) >= 0.3) {
      const confidence = getConfidence(outdoorCorr, daysWithOutdoor.length);
      observations.push({
        id: 'outdoor-mood',
        emoji: '🌳',
        text:
          outdoorCorr > 0
            ? 'Time outside seems to correlate with brighter days.'
            : 'Outdoor time shows a pattern worth noticing.',
        confidence,
        factors: ['outdoor', 'mood'],
        correlation: outdoorCorr,
      });
    }
  }

  // Caffeine correlation
  const daysWithCaffeine = daysWithMood.filter((d) => d.factors.caffeineCount !== undefined);
  if (daysWithCaffeine.length >= 3) {
    const caffeines = daysWithCaffeine.map((d) => d.factors.caffeineCount!);
    const caffeineMoods = daysWithCaffeine.map((d) => d.averageSentiment!);
    const caffeineCorr = calculateCorrelation(caffeines, caffeineMoods);

    if (Math.abs(caffeineCorr) >= 0.3) {
      const confidence = getConfidence(caffeineCorr, daysWithCaffeine.length);
      observations.push({
        id: 'caffeine-mood',
        emoji: '☕',
        text:
          caffeineCorr > 0
            ? 'Caffeine intake shows a positive pattern with your mood.'
            : 'You might notice a pattern between caffeine and how you feel.',
        confidence,
        factors: ['caffeine', 'mood'],
        correlation: caffeineCorr,
      });
    }
  }

  // Alcohol correlation
  const daysWithAlcohol = daysWithMood.filter((d) => d.factors.alcoholCount !== undefined);
  if (daysWithAlcohol.length >= 3) {
    const alcohols = daysWithAlcohol.map((d) => d.factors.alcoholCount!);
    const alcoholMoods = daysWithAlcohol.map((d) => d.averageSentiment!);
    const alcoholCorr = calculateCorrelation(alcohols, alcoholMoods);

    if (Math.abs(alcoholCorr) >= 0.3) {
      const confidence = getConfidence(alcoholCorr, daysWithAlcohol.length);
      observations.push({
        id: 'alcohol-mood',
        emoji: '🍺',
        text:
          alcoholCorr > 0
            ? 'Alcohol shows a pattern worth exploring with your mood.'
            : 'You might notice how alcohol connects to your entries.',
        confidence,
        factors: ['alcohol', 'mood'],
        correlation: alcoholCorr,
      });
    }
  }

  // Sort by correlation strength (most significant first)
  observations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  return observations.slice(0, 3); // Max 3 observations
}

/**
 * Get confidence label for display
 */
export function getConfidenceLabel(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return 'Strong pattern';
    case 'moderate':
      return 'Emerging pattern';
    case 'low':
      return 'Early observation';
  }
}

/**
 * Get confidence color for display
 */
export function getConfidenceColor(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'high':
      return '#4CAF50';
    case 'moderate':
      return '#FF9800';
    case 'low':
      return '#9E9E9E';
  }
}
