/**
 * Training Data Impact Service
 *
 * Tracks which training data (insights, videos, sources) contributed
 * to each model version, so you can identify what made it better or worse.
 *
 * Features:
 * - Links insights to model versions
 * - Tracks source impact (which channels help vs hurt)
 * - Identifies problematic data when quality drops
 * - Suggests data to remove for improvement
 * - Quality correlation analysis
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  DATA_LINEAGE: 'moodleaf_data_lineage',
  SOURCE_IMPACT: 'moodleaf_source_impact',
  INSIGHT_SCORES: 'moodleaf_insight_scores',
  PROBLEM_DATA: 'moodleaf_problem_data',
};

// ============================================
// TYPES
// ============================================

export interface DataLineageEntry {
  modelVersionId: string;
  modelVersion: string;
  trainedAt: string;

  // What data was used
  insightIds: string[];
  newInsightIds: string[];  // Insights added since last version
  removedInsightIds: string[]; // Insights removed since last version

  // Source breakdown
  sourceBreakdown: {
    source: string;  // Channel name or source
    insightCount: number;
    insightIds: string[];
  }[];

  // Quality at this version
  qualityScore: number;
  qualityDelta: number;  // Change from previous version

  // Correlation data
  correlations: {
    source: string;
    correlation: number;  // -1 to 1, positive = helps quality
    sampleSize: number;
  }[];
}

export interface SourceImpact {
  source: string;
  sourceType: 'youtube_channel' | 'manual' | 'research' | 'other';
  channelId?: string;

  // Stats
  totalInsights: number;
  approvedInsights: number;
  rejectedInsights: number;

  // Quality impact
  avgQualityWhenIncluded: number;
  avgQualityWhenExcluded: number;
  impactScore: number;  // Positive = helps, negative = hurts

  // Trend
  recentTrend: 'improving' | 'stable' | 'degrading';
  versionsIncluded: string[];

  // Flags
  flagged: boolean;
  flagReason?: string;
}

export interface InsightImpactScore {
  insightId: string;
  insightTitle: string;
  source: string;
  videoId?: string;
  videoTitle?: string;

  // Impact tracking
  versionsIncludedIn: string[];
  avgQualityInVersions: number;

  // Calculated impact
  impactScore: number;  // -100 to +100
  confidence: number;   // 0-1

  // Flags
  flaggedAsProblematic: boolean;
  flagReason?: string;

  // Metadata
  category: string;
  addedAt: string;
}

export interface ProblemDataReport {
  generatedAt: string;
  modelVersionId: string;
  qualityDrop: number;

  // What changed
  newDataSinceGoodVersion: {
    insightIds: string[];
    sources: string[];
    categories: string[];
  };

  // Suspects
  suspectedProblematicData: {
    insightId: string;
    insightTitle: string;
    source: string;
    reason: string;
    confidenceLevel: 'high' | 'medium' | 'low';
  }[];

  // Recommendations
  recommendations: {
    action: 'remove' | 'review' | 'flag_source' | 'retrain_without';
    targetIds: string[];
    description: string;
    expectedImpact: string;
  }[];
}

export interface DataDiffReport {
  fromVersion: string;
  toVersion: string;
  qualityChange: number;

  added: {
    insightId: string;
    title: string;
    source: string;
    category: string;
  }[];

  removed: {
    insightId: string;
    title: string;
    source: string;
    category: string;
  }[];

  sourceChanges: {
    source: string;
    addedCount: number;
    removedCount: number;
    netChange: number;
  }[];
}

// ============================================
// DATA LINEAGE TRACKING
// ============================================

/**
 * Record data lineage for a new model version
 */
export async function recordDataLineage(
  modelVersionId: string,
  modelVersion: string,
  insightIds: string[],
  qualityScore: number,
  previousVersionId?: string
): Promise<DataLineageEntry> {
  const lineages = await getAllLineages();

  // Get previous version's data for comparison
  let previousInsightIds: string[] = [];
  let qualityDelta = 0;

  if (previousVersionId) {
    const previousLineage = lineages.find(l => l.modelVersionId === previousVersionId);
    if (previousLineage) {
      previousInsightIds = previousLineage.insightIds;
      qualityDelta = qualityScore - previousLineage.qualityScore;
    }
  }

  // Calculate what's new and removed
  const newInsightIds = insightIds.filter(id => !previousInsightIds.includes(id));
  const removedInsightIds = previousInsightIds.filter(id => !insightIds.includes(id));

  // Get source breakdown
  const sourceBreakdown = await calculateSourceBreakdown(insightIds);

  // Calculate correlations if we have enough data
  const correlations = await calculateSourceCorrelations(lineages, insightIds);

  const entry: DataLineageEntry = {
    modelVersionId,
    modelVersion,
    trainedAt: new Date().toISOString(),
    insightIds,
    newInsightIds,
    removedInsightIds,
    sourceBreakdown,
    qualityScore,
    qualityDelta,
    correlations,
  };

  lineages.push(entry);
  await AsyncStorage.setItem(STORAGE_KEYS.DATA_LINEAGE, JSON.stringify(lineages));

  // Update source impact scores
  await updateSourceImpact(entry);

  // Update insight impact scores
  await updateInsightScores(entry);

  return entry;
}

/**
 * Get all lineage entries
 */
export async function getAllLineages(): Promise<DataLineageEntry[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.DATA_LINEAGE);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get lineage for a specific version
 */
export async function getVersionLineage(modelVersionId: string): Promise<DataLineageEntry | null> {
  const lineages = await getAllLineages();
  return lineages.find(l => l.modelVersionId === modelVersionId) || null;
}

/**
 * Calculate source breakdown for a set of insights
 */
async function calculateSourceBreakdown(
  insightIds: string[]
): Promise<DataLineageEntry['sourceBreakdown']> {
  // Get all insights
  const insightsStr = await AsyncStorage.getItem('moodleaf_interview_insights');
  const ytApprovedStr = await AsyncStorage.getItem('moodleaf_youtube_approved_insights');

  const insights: any[] = [];
  if (insightsStr) insights.push(...JSON.parse(insightsStr));
  if (ytApprovedStr) insights.push(...JSON.parse(ytApprovedStr));

  // Group by source
  const sourceMap = new Map<string, string[]>();

  for (const id of insightIds) {
    const insight = insights.find(i => i.id === id);
    if (insight) {
      const source = insight.channelName || insight.source || 'Unknown';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, []);
      }
      sourceMap.get(source)!.push(id);
    }
  }

  return Array.from(sourceMap.entries()).map(([source, ids]) => ({
    source,
    insightCount: ids.length,
    insightIds: ids,
  }));
}

/**
 * Calculate correlations between sources and quality
 */
async function calculateSourceCorrelations(
  lineages: DataLineageEntry[],
  currentInsightIds: string[]
): Promise<DataLineageEntry['correlations']> {
  if (lineages.length < 3) {
    return []; // Not enough data for meaningful correlations
  }

  const sourceBreakdown = await calculateSourceBreakdown(currentInsightIds);
  const correlations: DataLineageEntry['correlations'] = [];

  for (const { source } of sourceBreakdown) {
    // Find versions that included this source vs those that didn't
    const withSource: number[] = [];
    const withoutSource: number[] = [];

    for (const lineage of lineages) {
      const hasSource = lineage.sourceBreakdown.some(s => s.source === source);
      if (hasSource) {
        withSource.push(lineage.qualityScore);
      } else {
        withoutSource.push(lineage.qualityScore);
      }
    }

    if (withSource.length > 0 && withoutSource.length > 0) {
      const avgWith = withSource.reduce((a, b) => a + b, 0) / withSource.length;
      const avgWithout = withoutSource.reduce((a, b) => a + b, 0) / withoutSource.length;

      // Simple correlation: difference normalized
      const correlation = (avgWith - avgWithout) / 100;

      correlations.push({
        source,
        correlation: Math.max(-1, Math.min(1, correlation)),
        sampleSize: withSource.length + withoutSource.length,
      });
    }
  }

  return correlations.sort((a, b) => b.correlation - a.correlation);
}

// ============================================
// SOURCE IMPACT TRACKING
// ============================================

/**
 * Update source impact scores after a new version
 */
async function updateSourceImpact(lineage: DataLineageEntry): Promise<void> {
  const impacts = await getAllSourceImpacts();
  const lineages = await getAllLineages();

  for (const sourceEntry of lineage.sourceBreakdown) {
    let impact = impacts.find(i => i.source === sourceEntry.source);

    if (!impact) {
      impact = {
        source: sourceEntry.source,
        sourceType: 'youtube_channel', // Default, should be determined properly
        totalInsights: 0,
        approvedInsights: 0,
        rejectedInsights: 0,
        avgQualityWhenIncluded: 0,
        avgQualityWhenExcluded: 0,
        impactScore: 0,
        recentTrend: 'stable',
        versionsIncluded: [],
        flagged: false,
      };
      impacts.push(impact);
    }

    // Update stats
    impact.totalInsights = sourceEntry.insightCount;
    impact.versionsIncluded.push(lineage.modelVersion);

    // Calculate quality averages
    const versionsWithSource = lineages.filter(l =>
      l.sourceBreakdown.some(s => s.source === sourceEntry.source)
    );
    const versionsWithoutSource = lineages.filter(l =>
      !l.sourceBreakdown.some(s => s.source === sourceEntry.source)
    );

    if (versionsWithSource.length > 0) {
      impact.avgQualityWhenIncluded =
        versionsWithSource.reduce((sum, l) => sum + l.qualityScore, 0) / versionsWithSource.length;
    }

    if (versionsWithoutSource.length > 0) {
      impact.avgQualityWhenExcluded =
        versionsWithoutSource.reduce((sum, l) => sum + l.qualityScore, 0) / versionsWithoutSource.length;
    }

    // Calculate impact score
    impact.impactScore = impact.avgQualityWhenIncluded - impact.avgQualityWhenExcluded;

    // Determine trend from last 3 versions
    const recentVersions = versionsWithSource.slice(-3);
    if (recentVersions.length >= 2) {
      const qualityTrend = recentVersions[recentVersions.length - 1].qualityScore -
                          recentVersions[0].qualityScore;
      impact.recentTrend = qualityTrend > 5 ? 'improving' : qualityTrend < -5 ? 'degrading' : 'stable';
    }

    // Flag if consistently negative impact
    if (impact.impactScore < -10 && versionsWithSource.length >= 2) {
      impact.flagged = true;
      impact.flagReason = `Consistently negative impact on quality (${impact.impactScore.toFixed(1)} points)`;
    }
  }

  await AsyncStorage.setItem(STORAGE_KEYS.SOURCE_IMPACT, JSON.stringify(impacts));
}

/**
 * Get all source impact scores
 */
export async function getAllSourceImpacts(): Promise<SourceImpact[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.SOURCE_IMPACT);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get impact for a specific source
 */
export async function getSourceImpact(source: string): Promise<SourceImpact | null> {
  const impacts = await getAllSourceImpacts();
  return impacts.find(i => i.source === source) || null;
}

/**
 * Get sources sorted by impact
 */
export async function getSourcesByImpact(): Promise<SourceImpact[]> {
  const impacts = await getAllSourceImpacts();
  return impacts.sort((a, b) => b.impactScore - a.impactScore);
}

/**
 * Get flagged (problematic) sources
 */
export async function getFlaggedSources(): Promise<SourceImpact[]> {
  const impacts = await getAllSourceImpacts();
  return impacts.filter(i => i.flagged);
}

// ============================================
// INSIGHT IMPACT SCORING
// ============================================

/**
 * Update insight impact scores after a new version
 */
async function updateInsightScores(lineage: DataLineageEntry): Promise<void> {
  const scores = await getAllInsightScores();
  const lineages = await getAllLineages();

  // Get insight details
  const insightsStr = await AsyncStorage.getItem('moodleaf_interview_insights');
  const ytApprovedStr = await AsyncStorage.getItem('moodleaf_youtube_approved_insights');
  const allInsights: any[] = [];
  if (insightsStr) allInsights.push(...JSON.parse(insightsStr));
  if (ytApprovedStr) allInsights.push(...JSON.parse(ytApprovedStr));

  for (const insightId of lineage.insightIds) {
    let score = scores.find(s => s.insightId === insightId);
    const insight = allInsights.find(i => i.id === insightId);

    if (!score && insight) {
      score = {
        insightId,
        insightTitle: insight.title || 'Untitled',
        source: insight.channelName || insight.source || 'Unknown',
        videoId: insight.videoId,
        videoTitle: insight.videoTitle,
        versionsIncludedIn: [],
        avgQualityInVersions: 0,
        impactScore: 0,
        confidence: 0,
        flaggedAsProblematic: false,
        category: insight.category || 'unknown',
        addedAt: insight.approvedAt || insight.createdAt || new Date().toISOString(),
      };
      scores.push(score);
    }

    if (score) {
      score.versionsIncludedIn.push(lineage.modelVersion);

      // Calculate average quality in versions that include this insight
      const versionsWithInsight = lineages.filter(l => l.insightIds.includes(insightId));
      if (versionsWithInsight.length > 0) {
        score.avgQualityInVersions =
          versionsWithInsight.reduce((sum, l) => sum + l.qualityScore, 0) / versionsWithInsight.length;
      }

      // Calculate impact score
      const versionsWithoutInsight = lineages.filter(l => !l.insightIds.includes(insightId));
      if (versionsWithoutInsight.length > 0) {
        const avgWithout = versionsWithoutInsight.reduce((sum, l) => sum + l.qualityScore, 0) / versionsWithoutInsight.length;
        score.impactScore = score.avgQualityInVersions - avgWithout;
      }

      // Confidence based on sample size
      score.confidence = Math.min(score.versionsIncludedIn.length / 5, 1);

      // Flag if consistently negative
      if (score.impactScore < -5 && score.confidence >= 0.6) {
        score.flaggedAsProblematic = true;
        score.flagReason = `Negative impact on quality (${score.impactScore.toFixed(1)} points)`;
      }
    }
  }

  await AsyncStorage.setItem(STORAGE_KEYS.INSIGHT_SCORES, JSON.stringify(scores));
}

/**
 * Get all insight impact scores
 */
export async function getAllInsightScores(): Promise<InsightImpactScore[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.INSIGHT_SCORES);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get insights sorted by impact
 */
export async function getInsightsByImpact(): Promise<InsightImpactScore[]> {
  const scores = await getAllInsightScores();
  return scores.sort((a, b) => b.impactScore - a.impactScore);
}

/**
 * Get problematic insights
 */
export async function getProblematicInsights(): Promise<InsightImpactScore[]> {
  const scores = await getAllInsightScores();
  return scores.filter(s => s.flaggedAsProblematic).sort((a, b) => a.impactScore - b.impactScore);
}

// ============================================
// PROBLEM DATA ANALYSIS
// ============================================

/**
 * Analyze what caused a quality drop
 */
export async function analyzeQualityDrop(
  badVersionId: string,
  goodVersionId: string
): Promise<ProblemDataReport> {
  const lineages = await getAllLineages();
  const badLineage = lineages.find(l => l.modelVersionId === badVersionId);
  const goodLineage = lineages.find(l => l.modelVersionId === goodVersionId);

  if (!badLineage || !goodLineage) {
    throw new Error('Version lineage not found');
  }

  const qualityDrop = goodLineage.qualityScore - badLineage.qualityScore;

  // Find new data since good version
  const newInsightIds = badLineage.insightIds.filter(id => !goodLineage.insightIds.includes(id));

  // Get insight details
  const insightsStr = await AsyncStorage.getItem('moodleaf_interview_insights');
  const ytApprovedStr = await AsyncStorage.getItem('moodleaf_youtube_approved_insights');
  const allInsights: any[] = [];
  if (insightsStr) allInsights.push(...JSON.parse(insightsStr));
  if (ytApprovedStr) allInsights.push(...JSON.parse(ytApprovedStr));

  const newInsights = newInsightIds.map(id => allInsights.find(i => i.id === id)).filter(Boolean);
  const newSources = [...new Set(newInsights.map(i => i.channelName || i.source))];
  const newCategories = [...new Set(newInsights.map(i => i.category))];

  // Get insight scores to find suspects
  const insightScores = await getAllInsightScores();
  const suspectedProblematicData: ProblemDataReport['suspectedProblematicData'] = [];

  for (const insightId of newInsightIds) {
    const score = insightScores.find(s => s.insightId === insightId);
    const insight = allInsights.find(i => i.id === insightId);

    if (score && score.impactScore < 0) {
      suspectedProblematicData.push({
        insightId,
        insightTitle: score.insightTitle,
        source: score.source,
        reason: `Negative impact score: ${score.impactScore.toFixed(1)}`,
        confidenceLevel: score.confidence >= 0.8 ? 'high' : score.confidence >= 0.5 ? 'medium' : 'low',
      });
    } else if (insight) {
      // Check if source is flagged
      const sourceImpact = await getSourceImpact(insight.channelName || insight.source);
      if (sourceImpact?.flagged) {
        suspectedProblematicData.push({
          insightId,
          insightTitle: insight.title,
          source: insight.channelName || insight.source,
          reason: `From flagged source: ${sourceImpact.flagReason}`,
          confidenceLevel: 'medium',
        });
      }
    }
  }

  // Sort by confidence
  suspectedProblematicData.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.confidenceLevel] - order[b.confidenceLevel];
  });

  // Generate recommendations
  const recommendations: ProblemDataReport['recommendations'] = [];

  // If we have high-confidence suspects, recommend removal
  const highConfidenceSuspects = suspectedProblematicData.filter(s => s.confidenceLevel === 'high');
  if (highConfidenceSuspects.length > 0) {
    recommendations.push({
      action: 'remove',
      targetIds: highConfidenceSuspects.map(s => s.insightId),
      description: `Remove ${highConfidenceSuspects.length} high-confidence problematic insights`,
      expectedImpact: `Could improve quality by ~${Math.abs(qualityDrop * 0.5).toFixed(0)}%`,
    });
  }

  // If a source is flagged, recommend reviewing all from that source
  const flaggedSources = await getFlaggedSources();
  const relevantFlaggedSources = flaggedSources.filter(s =>
    newSources.includes(s.source)
  );

  for (const source of relevantFlaggedSources) {
    const sourceInsightIds = newInsightIds.filter(id => {
      const insight = allInsights.find(i => i.id === id);
      return insight && (insight.channelName === source.source || insight.source === source.source);
    });

    recommendations.push({
      action: 'flag_source',
      targetIds: sourceInsightIds,
      description: `Review all ${sourceInsightIds.length} insights from "${source.source}"`,
      expectedImpact: `Source has negative impact score of ${source.impactScore.toFixed(1)}`,
    });
  }

  // Recommend retraining without new data
  if (newInsightIds.length > 0) {
    recommendations.push({
      action: 'retrain_without',
      targetIds: newInsightIds,
      description: `Retrain without the ${newInsightIds.length} new insights to restore quality`,
      expectedImpact: `Should restore quality to ~${goodLineage.qualityScore}%`,
    });
  }

  const report: ProblemDataReport = {
    generatedAt: new Date().toISOString(),
    modelVersionId: badVersionId,
    qualityDrop,
    newDataSinceGoodVersion: {
      insightIds: newInsightIds,
      sources: newSources,
      categories: newCategories,
    },
    suspectedProblematicData,
    recommendations,
  };

  // Store report
  const reports = await getStoredProblemReports();
  reports.unshift(report);
  await AsyncStorage.setItem(STORAGE_KEYS.PROBLEM_DATA, JSON.stringify(reports.slice(0, 20)));

  return report;
}

/**
 * Get stored problem data reports
 */
async function getStoredProblemReports(): Promise<ProblemDataReport[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROBLEM_DATA);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get data diff between two versions
 */
export async function getDataDiff(
  fromVersionId: string,
  toVersionId: string
): Promise<DataDiffReport> {
  const lineages = await getAllLineages();
  const fromLineage = lineages.find(l => l.modelVersionId === fromVersionId);
  const toLineage = lineages.find(l => l.modelVersionId === toVersionId);

  if (!fromLineage || !toLineage) {
    throw new Error('Version lineage not found');
  }

  // Get insight details
  const insightsStr = await AsyncStorage.getItem('moodleaf_interview_insights');
  const ytApprovedStr = await AsyncStorage.getItem('moodleaf_youtube_approved_insights');
  const allInsights: any[] = [];
  if (insightsStr) allInsights.push(...JSON.parse(insightsStr));
  if (ytApprovedStr) allInsights.push(...JSON.parse(ytApprovedStr));

  // Find added and removed
  const addedIds = toLineage.insightIds.filter(id => !fromLineage.insightIds.includes(id));
  const removedIds = fromLineage.insightIds.filter(id => !toLineage.insightIds.includes(id));

  const added = addedIds.map(id => {
    const insight = allInsights.find(i => i.id === id);
    return {
      insightId: id,
      title: insight?.title || 'Unknown',
      source: insight?.channelName || insight?.source || 'Unknown',
      category: insight?.category || 'unknown',
    };
  });

  const removed = removedIds.map(id => {
    const insight = allInsights.find(i => i.id === id);
    return {
      insightId: id,
      title: insight?.title || 'Unknown',
      source: insight?.channelName || insight?.source || 'Unknown',
      category: insight?.category || 'unknown',
    };
  });

  // Calculate source changes
  const sourceMap = new Map<string, { added: number; removed: number }>();

  for (const item of added) {
    const current = sourceMap.get(item.source) || { added: 0, removed: 0 };
    current.added++;
    sourceMap.set(item.source, current);
  }

  for (const item of removed) {
    const current = sourceMap.get(item.source) || { added: 0, removed: 0 };
    current.removed++;
    sourceMap.set(item.source, current);
  }

  const sourceChanges = Array.from(sourceMap.entries()).map(([source, changes]) => ({
    source,
    addedCount: changes.added,
    removedCount: changes.removed,
    netChange: changes.added - changes.removed,
  })).sort((a, b) => Math.abs(b.netChange) - Math.abs(a.netChange));

  return {
    fromVersion: fromLineage.modelVersion,
    toVersion: toLineage.modelVersion,
    qualityChange: toLineage.qualityScore - fromLineage.qualityScore,
    added,
    removed,
    sourceChanges,
  };
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Data lineage
  recordDataLineage,
  getAllLineages,
  getVersionLineage,

  // Source impact
  getAllSourceImpacts,
  getSourceImpact,
  getSourcesByImpact,
  getFlaggedSources,

  // Insight impact
  getAllInsightScores,
  getInsightsByImpact,
  getProblematicInsights,

  // Problem analysis
  analyzeQualityDrop,
  getDataDiff,
};
