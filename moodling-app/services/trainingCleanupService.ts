/**
 * Training Cleanup Service
 *
 * One-stop tool for finding and removing bad training data.
 * Supports both automatic cleanup and manual review.
 *
 * Usage:
 *   Auto mode: await runTrainingCleanup({ autoRemove: true })
 *   Manual mode: await runTrainingCleanup({ autoRemove: false })
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getPendingInsights,
  getApprovedInsights,
  rejectPendingInsight,
  ExtractedInsight,
} from './youtubeProcessorService';

// Storage keys
const CLEANUP_REPORTS_KEY = 'moodleaf_cleanup_reports';
const FLAGGED_INSIGHTS_KEY = 'moodleaf_flagged_for_removal';

// ============================================
// TYPES
// ============================================

export interface CleanupOptions {
  /** Automatically remove high-confidence bad data */
  autoRemove?: boolean;

  /** Confidence threshold for auto-removal (0-1, default 0.8) */
  confidenceThreshold?: number;

  /** Run bias detection */
  checkBias?: boolean;

  /** Run contradiction detection */
  checkContradictions?: boolean;

  /** Check for harmful content patterns */
  checkHarmful?: boolean;

  /** Check for low-quality content */
  checkQuality?: boolean;

  /** Check source impact scores */
  checkSourceImpact?: boolean;

  /** Generate detailed report */
  generateReport?: boolean;
}

export interface FlaggedInsight {
  id: string;
  insightId: string;
  title: string;
  preview: string;
  reason: string;
  category: 'bias' | 'contradiction' | 'harmful' | 'low_quality' | 'bad_source' | 'duplicate';
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: string;
  flaggedAt: string;
  autoRemoved?: boolean;
  manuallyReviewed?: boolean;
  decision?: 'keep' | 'remove' | 'edit';
}

export interface CleanupReport {
  id: string;
  runAt: string;
  options: CleanupOptions;

  summary: {
    totalInsightsScanned: number;
    problemsFound: number;
    autoRemoved: number;
    needsReview: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  };

  flaggedInsights: FlaggedInsight[];

  recommendations: string[];

  overallHealthScore: number; // 0-100

  nextSteps: string[];
}

// ============================================
// HARMFUL CONTENT PATTERNS
// ============================================

const HARMFUL_PATTERNS = [
  // Dangerous advice
  { pattern: /stop\s+(?:taking\s+)?(?:your\s+)?(?:meds?|medication)/i, reason: 'Suggests stopping medication', severity: 'critical' as const },
  { pattern: /don't\s+(?:need|go\s+to)\s+therap/i, reason: 'Discourages therapy', severity: 'high' as const },
  { pattern: /suicide\s+(?:is|can\s+be)\s+(?:a\s+)?(?:solution|answer|way\s+out)/i, reason: 'Normalizes suicide', severity: 'critical' as const },
  { pattern: /self[- ]?harm\s+(?:helps?|works?|is\s+ok)/i, reason: 'Normalizes self-harm', severity: 'critical' as const },

  // Toxic positivity
  { pattern: /just\s+(?:be\s+)?(?:happy|positive|grateful)/i, reason: 'Toxic positivity', severity: 'medium' as const },
  { pattern: /(?:good\s+)?vibes\s+only/i, reason: 'Toxic positivity', severity: 'medium' as const },
  { pattern: /you\s+(?:should(?:n't)?|don't)\s+feel\s+(?:that\s+way|like\s+that)/i, reason: 'Invalidating feelings', severity: 'high' as const },

  // Prescriptive/judgmental
  { pattern: /you\s+(?:need|have|must)\s+to\s+(?:just\s+)?(?:get\s+over|move\s+on|let\s+go)/i, reason: 'Prescriptive advice', severity: 'medium' as const },
  { pattern: /man\s+up/i, reason: 'Gender bias', severity: 'high' as const },
  { pattern: /boys\s+don't\s+cry/i, reason: 'Gender bias', severity: 'high' as const },
  { pattern: /(?:real|normal)\s+(?:men?|women?)\s+(?:don't|should)/i, reason: 'Gender stereotyping', severity: 'high' as const },

  // Ableist language
  { pattern: /\b(?:crazy|insane|psycho|mental|nuts)\b/i, reason: 'Ableist language', severity: 'medium' as const },
  { pattern: /\b(?:retarded?|spastic|lame)\b/i, reason: 'Ableist slur', severity: 'critical' as const },

  // Privilege assumptions
  { pattern: /just\s+(?:go\s+)?travel/i, reason: 'Assumes financial privilege', severity: 'low' as const },
  { pattern: /everyone\s+can\s+afford/i, reason: 'Assumes financial privilege', severity: 'low' as const },
  { pattern: /just\s+(?:see|go\s+to)\s+a\s+therapist/i, reason: 'Assumes therapy access', severity: 'low' as const },
];

// ============================================
// BIAS PATTERNS
// ============================================

const BIAS_PATTERNS = [
  // Gender bias
  { pattern: /women\s+are\s+(?:too\s+)?emotional/i, type: 'gender', severity: 'high' as const },
  { pattern: /men\s+(?:don't|can't|shouldn't)\s+(?:cry|show\s+emotion)/i, type: 'gender', severity: 'high' as const },

  // Cultural bias
  { pattern: /(?:normal|regular|typical)\s+famil/i, type: 'cultural', severity: 'medium' as const },
  { pattern: /(?:weird|strange)\s+(?:custom|tradition|culture)/i, type: 'cultural', severity: 'medium' as const },

  // Age bias
  { pattern: /(?:old\s+people|elderly)\s+(?:can't|don't|won't)/i, type: 'age', severity: 'medium' as const },
  { pattern: /kids\s+these\s+days/i, type: 'age', severity: 'low' as const },
  { pattern: /(?:too\s+)?(?:young|old)\s+to\s+understand/i, type: 'age', severity: 'medium' as const },

  // Socioeconomic bias
  { pattern: /(?:poor\s+people|low\s+income)\s+(?:are|can't|don't)/i, type: 'socioeconomic', severity: 'medium' as const },
  { pattern: /if\s+you\s+(?:really\s+)?wanted\s+(?:it|to)/i, type: 'socioeconomic', severity: 'low' as const },
];

// ============================================
// LOW QUALITY PATTERNS
// ============================================

const LOW_QUALITY_INDICATORS = [
  { check: (text: string) => text.length < 50, reason: 'Too short', severity: 'low' as const },
  { check: (text: string) => text.split(' ').length < 10, reason: 'Not enough substance', severity: 'low' as const },
  { check: (text: string) => /^(?:just|simply|always|never)\b/i.test(text), reason: 'Overly simplistic', severity: 'medium' as const },
  { check: (text: string) => (text.match(/!/g) || []).length > 3, reason: 'Too many exclamation marks', severity: 'low' as const },
  { check: (text: string) => /\b(?:everyone|nobody|always|never)\b/i.test(text), reason: 'Absolute language', severity: 'medium' as const },
];

// ============================================
// MAIN CLEANUP FUNCTION
// ============================================

/**
 * Run training data cleanup
 */
export async function runTrainingCleanup(
  options: CleanupOptions = {}
): Promise<CleanupReport> {
  const {
    autoRemove = false,
    confidenceThreshold = 0.8,
    checkBias = true,
    checkContradictions = true,
    checkHarmful = true,
    checkQuality = true,
    checkSourceImpact = true,
    generateReport = true,
  } = options;

  const flaggedInsights: FlaggedInsight[] = [];
  const [pendingInsights, approvedInsights] = await Promise.all([
    getPendingInsights(),
    getApprovedInsights(),
  ]);

  const allInsights = [...pendingInsights, ...approvedInsights];

  // Run checks
  if (checkHarmful) {
    const harmful = await findHarmfulContent(allInsights);
    flaggedInsights.push(...harmful);
  }

  if (checkBias) {
    const biased = await findBiasedContent(allInsights);
    flaggedInsights.push(...biased);
  }

  if (checkQuality) {
    const lowQuality = await findLowQualityContent(allInsights);
    flaggedInsights.push(...lowQuality);
  }

  if (checkContradictions) {
    const contradictions = await findContradictions(allInsights);
    flaggedInsights.push(...contradictions);
  }

  // Find duplicates
  const duplicates = await findDuplicates(allInsights);
  flaggedInsights.push(...duplicates);

  // Auto-remove high-confidence items if enabled
  let autoRemovedCount = 0;
  if (autoRemove) {
    for (const flagged of flaggedInsights) {
      if (flagged.confidence >= confidenceThreshold && flagged.severity !== 'low') {
        try {
          await removeInsight(flagged.insightId);
          flagged.autoRemoved = true;
          autoRemovedCount++;
        } catch (error) {
          console.error(`Failed to auto-remove ${flagged.insightId}:`, error);
        }
      }
    }
  }

  // Calculate summary
  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const f of flaggedInsights) {
    byCategory[f.category] = (byCategory[f.category] || 0) + 1;
    bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
  }

  // Calculate health score
  const criticalCount = bySeverity['critical'] || 0;
  const highCount = bySeverity['high'] || 0;
  const mediumCount = bySeverity['medium'] || 0;
  const lowCount = bySeverity['low'] || 0;

  let healthScore = 100;
  healthScore -= criticalCount * 20;
  healthScore -= highCount * 10;
  healthScore -= mediumCount * 5;
  healthScore -= lowCount * 2;
  healthScore = Math.max(0, Math.min(100, healthScore));

  // Generate recommendations
  const recommendations = generateRecommendations(flaggedInsights, byCategory, bySeverity);

  // Generate next steps
  const nextSteps = generateNextSteps(flaggedInsights, autoRemove, autoRemovedCount);

  const report: CleanupReport = {
    id: `cleanup_${Date.now()}`,
    runAt: new Date().toISOString(),
    options,
    summary: {
      totalInsightsScanned: allInsights.length,
      problemsFound: flaggedInsights.length,
      autoRemoved: autoRemovedCount,
      needsReview: flaggedInsights.filter(f => !f.autoRemoved).length,
      byCategory,
      bySeverity,
    },
    flaggedInsights,
    recommendations,
    overallHealthScore: healthScore,
    nextSteps,
  };

  // Save report
  if (generateReport) {
    await saveReport(report);
  }

  // Save flagged insights for manual review
  await saveFlaggedInsights(flaggedInsights.filter(f => !f.autoRemoved));

  return report;
}

// ============================================
// DETECTION FUNCTIONS
// ============================================

/**
 * Find harmful content
 */
async function findHarmfulContent(insights: ExtractedInsight[]): Promise<FlaggedInsight[]> {
  const flagged: FlaggedInsight[] = [];

  for (const insight of insights) {
    const textToCheck = `${insight.title} ${insight.insight} ${insight.coachingImplication}`;

    for (const pattern of HARMFUL_PATTERNS) {
      if (pattern.pattern.test(textToCheck)) {
        flagged.push({
          id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          insightId: insight.id,
          title: insight.title,
          preview: insight.insight.substring(0, 100) + '...',
          reason: pattern.reason,
          category: 'harmful',
          confidence: 0.9,
          severity: pattern.severity,
          details: `Matched pattern: "${pattern.pattern.source}"`,
          flaggedAt: new Date().toISOString(),
        });
        break; // One flag per insight for harmful
      }
    }
  }

  return flagged;
}

/**
 * Find biased content
 */
async function findBiasedContent(insights: ExtractedInsight[]): Promise<FlaggedInsight[]> {
  const flagged: FlaggedInsight[] = [];

  for (const insight of insights) {
    const textToCheck = `${insight.title} ${insight.insight} ${insight.coachingImplication}`;

    for (const pattern of BIAS_PATTERNS) {
      if (pattern.pattern.test(textToCheck)) {
        flagged.push({
          id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          insightId: insight.id,
          title: insight.title,
          preview: insight.insight.substring(0, 100) + '...',
          reason: `${pattern.type} bias: ${pattern.pattern.source}`,
          category: 'bias',
          confidence: 0.85,
          severity: pattern.severity,
          details: `Detected ${pattern.type} bias pattern`,
          flaggedAt: new Date().toISOString(),
        });
      }
    }
  }

  return flagged;
}

/**
 * Find low quality content
 */
async function findLowQualityContent(insights: ExtractedInsight[]): Promise<FlaggedInsight[]> {
  const flagged: FlaggedInsight[] = [];

  for (const insight of insights) {
    const textToCheck = insight.insight;

    for (const indicator of LOW_QUALITY_INDICATORS) {
      if (indicator.check(textToCheck)) {
        flagged.push({
          id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          insightId: insight.id,
          title: insight.title,
          preview: insight.insight.substring(0, 100) + '...',
          reason: indicator.reason,
          category: 'low_quality',
          confidence: 0.7,
          severity: indicator.severity,
          details: `Quality check failed: ${indicator.reason}`,
          flaggedAt: new Date().toISOString(),
        });
      }
    }
  }

  return flagged;
}

/**
 * Find contradictions between insights
 */
async function findContradictions(insights: ExtractedInsight[]): Promise<FlaggedInsight[]> {
  const flagged: FlaggedInsight[] = [];

  // Contradiction pairs to check
  const contradictionPairs = [
    { a: /express\s+(?:your\s+)?anger/i, b: /suppress\s+(?:your\s+)?anger/i },
    { a: /share\s+(?:your\s+)?feelings/i, b: /keep\s+(?:feelings?\s+)?to\s+yourself/i },
    { a: /be\s+alone/i, b: /(?:don't|never)\s+be\s+alone/i },
    { a: /trust\s+(?:your\s+)?(?:gut|instincts?)/i, b: /(?:don't|never)\s+trust\s+(?:your\s+)?(?:gut|instincts?)/i },
    { a: /forgive/i, b: /(?:don't|never)\s+(?:have\s+to\s+)?forgive/i },
  ];

  for (let i = 0; i < insights.length; i++) {
    const textA = `${insights[i].insight} ${insights[i].coachingImplication}`;

    for (let j = i + 1; j < insights.length; j++) {
      const textB = `${insights[j].insight} ${insights[j].coachingImplication}`;

      for (const pair of contradictionPairs) {
        if ((pair.a.test(textA) && pair.b.test(textB)) || (pair.b.test(textA) && pair.a.test(textB))) {
          flagged.push({
            id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            insightId: insights[i].id,
            title: insights[i].title,
            preview: insights[i].insight.substring(0, 100) + '...',
            reason: `Contradicts insight: "${insights[j].title}"`,
            category: 'contradiction',
            confidence: 0.75,
            severity: 'medium',
            details: `This insight may contradict: ${insights[j].id}`,
            flaggedAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  return flagged;
}

/**
 * Find duplicate or near-duplicate insights
 */
async function findDuplicates(insights: ExtractedInsight[]): Promise<FlaggedInsight[]> {
  const flagged: FlaggedInsight[] = [];
  const seen = new Map<string, string>(); // normalized text -> insight ID

  for (const insight of insights) {
    // Normalize text for comparison
    const normalized = insight.insight
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Check for exact duplicates
    if (seen.has(normalized)) {
      flagged.push({
        id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        insightId: insight.id,
        title: insight.title,
        preview: insight.insight.substring(0, 100) + '...',
        reason: 'Duplicate content',
        category: 'duplicate',
        confidence: 1.0,
        severity: 'low',
        details: `Duplicate of insight: ${seen.get(normalized)}`,
        flaggedAt: new Date().toISOString(),
      });
    } else {
      seen.set(normalized, insight.id);
    }

    // Check for near-duplicates (simple word overlap)
    for (const [existingNormalized, existingId] of seen.entries()) {
      if (existingId === insight.id) continue;

      const wordsA = new Set(normalized.split(' '));
      const wordsB = new Set(existingNormalized.split(' '));
      const intersection = [...wordsA].filter(w => wordsB.has(w));
      const overlap = intersection.length / Math.max(wordsA.size, wordsB.size);

      if (overlap > 0.8 && overlap < 1) {
        flagged.push({
          id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          insightId: insight.id,
          title: insight.title,
          preview: insight.insight.substring(0, 100) + '...',
          reason: 'Near-duplicate content',
          category: 'duplicate',
          confidence: overlap,
          severity: 'low',
          details: `${Math.round(overlap * 100)}% similar to: ${existingId}`,
          flaggedAt: new Date().toISOString(),
        });
      }
    }
  }

  return flagged;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Remove an insight from training data
 */
async function removeInsight(insightId: string): Promise<void> {
  // Try to reject from pending first
  const rejected = await rejectPendingInsight(insightId);
  if (rejected) return;

  // If not in pending, remove from approved
  const approvedKey = 'moodleaf_youtube_approved_insights';
  const data = await AsyncStorage.getItem(approvedKey);
  if (data) {
    const insights: ExtractedInsight[] = JSON.parse(data);
    const filtered = insights.filter(i => i.id !== insightId);
    await AsyncStorage.setItem(approvedKey, JSON.stringify(filtered));
  }
}

/**
 * Generate recommendations based on findings
 */
function generateRecommendations(
  flagged: FlaggedInsight[],
  byCategory: Record<string, number>,
  bySeverity: Record<string, number>
): string[] {
  const recommendations: string[] = [];

  if ((bySeverity['critical'] || 0) > 0) {
    recommendations.push(`⚠️ CRITICAL: ${bySeverity['critical']} items need immediate removal (dangerous content)`);
  }

  if ((byCategory['harmful'] || 0) > 3) {
    recommendations.push(`Review your source channels - multiple harmful insights detected`);
  }

  if ((byCategory['bias'] || 0) > 5) {
    recommendations.push(`Training data has bias issues - consider adding more diverse sources`);
  }

  if ((byCategory['contradiction'] || 0) > 2) {
    recommendations.push(`Found contradicting advice - review and resolve to avoid confusing users`);
  }

  if ((byCategory['low_quality'] || 0) > 10) {
    recommendations.push(`Many low-quality insights - tighten your approval criteria`);
  }

  if ((byCategory['duplicate'] || 0) > 5) {
    recommendations.push(`Remove duplicates to reduce training noise`);
  }

  if (recommendations.length === 0) {
    recommendations.push(`✅ Training data looks healthy!`);
  }

  return recommendations;
}

/**
 * Generate next steps
 */
function generateNextSteps(
  flagged: FlaggedInsight[],
  autoRemove: boolean,
  autoRemovedCount: number
): string[] {
  const steps: string[] = [];

  if (autoRemove && autoRemovedCount > 0) {
    steps.push(`✓ Auto-removed ${autoRemovedCount} high-confidence problems`);
  }

  const needsReview = flagged.filter(f => !f.autoRemoved);
  if (needsReview.length > 0) {
    steps.push(`📋 Review ${needsReview.length} flagged items manually`);
    steps.push(`Use reviewFlaggedInsight() to approve/reject each`);
  }

  const criticalItems = flagged.filter(f => f.severity === 'critical' && !f.autoRemoved);
  if (criticalItems.length > 0) {
    steps.push(`🚨 Address ${criticalItems.length} critical items FIRST`);
  }

  if (needsReview.length === 0 && autoRemovedCount > 0) {
    steps.push(`Consider retraining with cleaned data`);
  }

  return steps;
}

/**
 * Save cleanup report
 */
async function saveReport(report: CleanupReport): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(CLEANUP_REPORTS_KEY);
    const reports: CleanupReport[] = data ? JSON.parse(data) : [];
    reports.push(report);
    // Keep last 20 reports
    const trimmed = reports.slice(-20);
    await AsyncStorage.setItem(CLEANUP_REPORTS_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save cleanup report:', error);
  }
}

/**
 * Save flagged insights for manual review
 */
async function saveFlaggedInsights(flagged: FlaggedInsight[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FLAGGED_INSIGHTS_KEY, JSON.stringify(flagged));
  } catch (error) {
    console.error('Failed to save flagged insights:', error);
  }
}

// ============================================
// MANUAL REVIEW FUNCTIONS
// ============================================

/**
 * Get all flagged insights awaiting review
 */
export async function getFlaggedInsights(): Promise<FlaggedInsight[]> {
  try {
    const data = await AsyncStorage.getItem(FLAGGED_INSIGHTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Review a flagged insight - decide to keep, remove, or edit
 */
export async function reviewFlaggedInsight(
  flagId: string,
  decision: 'keep' | 'remove' | 'edit'
): Promise<boolean> {
  try {
    const flagged = await getFlaggedInsights();
    const index = flagged.findIndex(f => f.id === flagId);

    if (index === -1) return false;

    const item = flagged[index];
    item.manuallyReviewed = true;
    item.decision = decision;

    if (decision === 'remove') {
      await removeInsight(item.insightId);
      // Remove from flagged list
      flagged.splice(index, 1);
    }

    await AsyncStorage.setItem(FLAGGED_INSIGHTS_KEY, JSON.stringify(flagged));
    return true;
  } catch (error) {
    console.error('Failed to review flagged insight:', error);
    return false;
  }
}

/**
 * Bulk remove multiple flagged insights
 */
export async function bulkRemoveFlagged(flagIds: string[]): Promise<number> {
  let removed = 0;

  for (const flagId of flagIds) {
    const success = await reviewFlaggedInsight(flagId, 'remove');
    if (success) removed++;
  }

  return removed;
}

/**
 * Remove all flagged insights of a specific category
 */
export async function removeAllByCategory(
  category: 'bias' | 'contradiction' | 'harmful' | 'low_quality' | 'bad_source' | 'duplicate'
): Promise<number> {
  const flagged = await getFlaggedInsights();
  const toRemove = flagged.filter(f => f.category === category);

  let removed = 0;
  for (const item of toRemove) {
    const success = await reviewFlaggedInsight(item.id, 'remove');
    if (success) removed++;
  }

  return removed;
}

/**
 * Remove all flagged insights above a severity threshold
 */
export async function removeAllBySeverity(
  minSeverity: 'critical' | 'high' | 'medium' | 'low'
): Promise<number> {
  const severityOrder = ['low', 'medium', 'high', 'critical'];
  const minIndex = severityOrder.indexOf(minSeverity);

  const flagged = await getFlaggedInsights();
  const toRemove = flagged.filter(f => severityOrder.indexOf(f.severity) >= minIndex);

  let removed = 0;
  for (const item of toRemove) {
    const success = await reviewFlaggedInsight(item.id, 'remove');
    if (success) removed++;
  }

  return removed;
}

/**
 * Clear all flagged insights (mark as reviewed, keep all)
 */
export async function clearAllFlagged(): Promise<void> {
  await AsyncStorage.setItem(FLAGGED_INSIGHTS_KEY, JSON.stringify([]));
}

// ============================================
// REPORTS
// ============================================

/**
 * Get all cleanup reports
 */
export async function getCleanupReports(): Promise<CleanupReport[]> {
  try {
    const data = await AsyncStorage.getItem(CLEANUP_REPORTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Get the most recent cleanup report
 */
export async function getLatestReport(): Promise<CleanupReport | null> {
  const reports = await getCleanupReports();
  return reports.length > 0 ? reports[reports.length - 1] : null;
}

// ============================================
// QUICK ACTIONS
// ============================================

/**
 * Quick cleanup - auto mode with sensible defaults
 */
export async function quickCleanup(): Promise<CleanupReport> {
  return runTrainingCleanup({
    autoRemove: true,
    confidenceThreshold: 0.85,
    checkBias: true,
    checkContradictions: true,
    checkHarmful: true,
    checkQuality: true,
    generateReport: true,
  });
}

/**
 * Full scan - manual review mode (no auto-removal)
 */
export async function fullScan(): Promise<CleanupReport> {
  return runTrainingCleanup({
    autoRemove: false,
    checkBias: true,
    checkContradictions: true,
    checkHarmful: true,
    checkQuality: true,
    generateReport: true,
  });
}

/**
 * Print a human-readable summary of the latest report
 */
export async function printCleanupSummary(): Promise<string> {
  const report = await getLatestReport();

  if (!report) {
    return 'No cleanup reports found. Run quickCleanup() or fullScan() first.';
  }

  const lines: string[] = [
    '═══════════════════════════════════════════════════════',
    '           TRAINING DATA CLEANUP REPORT',
    '═══════════════════════════════════════════════════════',
    '',
    `📊 Health Score: ${report.overallHealthScore}/100`,
    `📅 Run at: ${new Date(report.runAt).toLocaleString()}`,
    '',
    '📈 SUMMARY',
    `   Total scanned: ${report.summary.totalInsightsScanned}`,
    `   Problems found: ${report.summary.problemsFound}`,
    `   Auto-removed: ${report.summary.autoRemoved}`,
    `   Needs review: ${report.summary.needsReview}`,
    '',
    '📂 BY CATEGORY',
  ];

  for (const [cat, count] of Object.entries(report.summary.byCategory)) {
    lines.push(`   ${cat}: ${count}`);
  }

  lines.push('');
  lines.push('⚠️ BY SEVERITY');

  for (const [sev, count] of Object.entries(report.summary.bySeverity)) {
    const icon = sev === 'critical' ? '🔴' : sev === 'high' ? '🟠' : sev === 'medium' ? '🟡' : '🟢';
    lines.push(`   ${icon} ${sev}: ${count}`);
  }

  lines.push('');
  lines.push('💡 RECOMMENDATIONS');
  for (const rec of report.recommendations) {
    lines.push(`   • ${rec}`);
  }

  lines.push('');
  lines.push('👉 NEXT STEPS');
  for (const step of report.nextSteps) {
    lines.push(`   • ${step}`);
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════');

  return lines.join('\n');
}
