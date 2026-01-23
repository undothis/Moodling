/**
 * Training Quality Service
 *
 * Advanced quality controls for training data that go beyond basic filtering.
 * Implements 2025 best practices for LLM training data quality.
 *
 * Features:
 * - Semantic deduplication (catches similar but not identical insights)
 * - Cross-source validation (triangulation)
 * - Category balance enforcement
 * - Temporal freshness scoring
 * - Active learning feedback loop
 * - Curriculum learning ordering
 * - Diversity scoring
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ExtractedInsight,
  InsightExtractionCategory,
  EXTRACTION_CATEGORIES,
} from './youtubeProcessorService';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  SEMANTIC_INDEX: 'moodleaf_semantic_index',
  CATEGORY_BALANCE: 'moodleaf_category_balance',
  USER_FEEDBACK: 'moodleaf_user_feedback',
  QUALITY_METRICS: 'moodleaf_quality_metrics',
  CURRICULUM_ORDER: 'moodleaf_curriculum_order',
};

// ============================================
// TYPES
// ============================================

export interface SemanticCluster {
  clusterId: string;
  centroid: string; // Representative insight
  members: string[]; // Insight IDs
  theme: string;
  avgQuality: number;
}

export interface CategoryBalance {
  category: InsightExtractionCategory;
  domain: 'pain' | 'joy' | 'connection' | 'growth' | 'authenticity';
  count: number;
  targetCount: number;
  percentOfTarget: number;
  status: 'under' | 'balanced' | 'over';
}

export interface UserFeedback {
  id: string;
  conversationId: string;
  insightId?: string; // If we can trace which insight influenced the response
  rating: 'helpful' | 'neutral' | 'unhelpful' | 'harmful';
  category: string;
  timestamp: string;
  userComment?: string;
}

export interface QualityMetrics {
  overallQuality: number;
  diversityScore: number;
  balanceScore: number;
  freshnessScore: number;
  crossSourceScore: number;
  userSatisfactionScore: number;
  lastCalculated: string;
}

export interface CurriculumLevel {
  level: number;
  name: string;
  description: string;
  insightIds: string[];
  complexity: 'basic' | 'intermediate' | 'advanced' | 'nuanced';
}

export interface DiversityReport {
  totalInsights: number;
  uniqueTopics: number;
  topicCoverage: { topic: string; count: number }[];
  gapsIdentified: string[];
  overrepresentedAreas: string[];
  recommendations: string[];
}

// ============================================
// SEMANTIC DEDUPLICATION
// Using TF-IDF-like approach without external dependencies
// ============================================

/**
 * Extract key terms from an insight for semantic comparison
 */
function extractKeyTerms(text: string): Map<string, number> {
  // Normalize and tokenize
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);

  // Count term frequency
  const termFreq = new Map<string, number>();
  for (const word of words) {
    termFreq.set(word, (termFreq.get(word) || 0) + 1);
  }

  // Normalize by document length
  const docLength = words.length || 1;
  for (const [term, freq] of termFreq) {
    termFreq.set(term, freq / docLength);
  }

  return termFreq;
}

/**
 * Calculate semantic similarity between two insights
 * Returns a score from 0 (completely different) to 1 (identical)
 */
export function calculateSemanticSimilarity(text1: string, text2: string): number {
  const terms1 = extractKeyTerms(text1);
  const terms2 = extractKeyTerms(text2);

  // Cosine similarity
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  const allTerms = new Set([...terms1.keys(), ...terms2.keys()]);

  for (const term of allTerms) {
    const v1 = terms1.get(term) || 0;
    const v2 = terms2.get(term) || 0;
    dotProduct += v1 * v2;
    magnitude1 += v1 * v1;
    magnitude2 += v2 * v2;
  }

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
}

/**
 * Find semantically similar insights to a new one
 */
export async function findSimilarInsights(
  newInsight: ExtractedInsight,
  similarityThreshold: number = 0.7
): Promise<{ insightId: string; similarity: number }[]> {
  // Get all approved insights
  const approvedStr = await AsyncStorage.getItem('moodleaf_youtube_approved_insights');
  const interviewStr = await AsyncStorage.getItem('moodleaf_interview_insights');

  const allInsights: any[] = [];
  if (approvedStr) allInsights.push(...JSON.parse(approvedStr));
  if (interviewStr) allInsights.push(...JSON.parse(interviewStr).filter((i: any) => i.status === 'approved'));

  const similar: { insightId: string; similarity: number }[] = [];
  const newText = `${newInsight.title} ${newInsight.insight} ${newInsight.coachingImplication}`;

  for (const existing of allInsights) {
    if (existing.id === newInsight.id) continue;

    const existingText = `${existing.title || ''} ${existing.insight || ''} ${existing.coachingImplication || ''}`;
    const similarity = calculateSemanticSimilarity(newText, existingText);

    if (similarity >= similarityThreshold) {
      similar.push({ insightId: existing.id, similarity });
    }
  }

  return similar.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Check if insight is semantically duplicate
 */
export async function isSemanticDuplicate(
  insight: ExtractedInsight,
  threshold: number = 0.8
): Promise<{ isDuplicate: boolean; mostSimilar?: { insightId: string; similarity: number } }> {
  const similar = await findSimilarInsights(insight, threshold);

  if (similar.length > 0) {
    return { isDuplicate: true, mostSimilar: similar[0] };
  }

  return { isDuplicate: false };
}

// ============================================
// CROSS-SOURCE VALIDATION
// ============================================

/**
 * Find insights that are validated across multiple sources
 */
export async function findCrossValidatedInsights(
  minSources: number = 2
): Promise<{ insightId: string; supportingSources: string[]; confidence: number }[]> {
  const approvedStr = await AsyncStorage.getItem('moodleaf_youtube_approved_insights');
  const interviewStr = await AsyncStorage.getItem('moodleaf_interview_insights');

  const allInsights: any[] = [];
  if (approvedStr) allInsights.push(...JSON.parse(approvedStr));
  if (interviewStr) allInsights.push(...JSON.parse(interviewStr).filter((i: any) => i.status === 'approved'));

  const crossValidated: { insightId: string; supportingSources: string[]; confidence: number }[] = [];

  for (let i = 0; i < allInsights.length; i++) {
    const insight = allInsights[i];
    const insightText = `${insight.title || ''} ${insight.insight || ''}`;
    const sources = new Set<string>([insight.channelName || insight.source || 'Unknown']);

    for (let j = 0; j < allInsights.length; j++) {
      if (i === j) continue;

      const other = allInsights[j];
      const otherText = `${other.title || ''} ${other.insight || ''}`;
      const similarity = calculateSemanticSimilarity(insightText, otherText);

      // If similar enough, it's a supporting source
      if (similarity >= 0.6) {
        sources.add(other.channelName || other.source || 'Unknown');
      }
    }

    if (sources.size >= minSources) {
      crossValidated.push({
        insightId: insight.id,
        supportingSources: Array.from(sources),
        confidence: Math.min(sources.size / 5, 1), // Max confidence at 5+ sources
      });
    }
  }

  return crossValidated.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Calculate cross-source validation score for all insights
 */
export async function getCrossSourceScore(): Promise<number> {
  const validated = await findCrossValidatedInsights(2);
  const totalInsights = await getTotalInsightCount();

  if (totalInsights === 0) return 0;

  // Score based on what percentage of insights have cross-source validation
  return (validated.length / totalInsights) * 100;
}

// ============================================
// CATEGORY BALANCE
// ============================================

/**
 * Calculate current category balance
 */
export async function calculateCategoryBalance(): Promise<CategoryBalance[]> {
  const approvedStr = await AsyncStorage.getItem('moodleaf_youtube_approved_insights');
  const interviewStr = await AsyncStorage.getItem('moodleaf_interview_insights');

  const allInsights: any[] = [];
  if (approvedStr) allInsights.push(...JSON.parse(approvedStr));
  if (interviewStr) allInsights.push(...JSON.parse(interviewStr).filter((i: any) => i.status === 'approved'));

  // Count by category
  const categoryCounts = new Map<string, number>();
  for (const insight of allInsights) {
    const category = insight.extractionCategory || insight.category || 'unknown';
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  }

  const totalInsights = allInsights.length;

  // Target: equal distribution across all domains
  // 27 categories, so ~3.7% each, but we'll use domain-based targets
  const domainTargets: Record<string, number> = {
    pain: 0.20, // 20% pain-related
    joy: 0.20, // 20% joy-related
    connection: 0.25, // 25% connection-related
    growth: 0.20, // 20% growth-related
    authenticity: 0.15, // 15% authenticity-related
  };

  const domainCategories = EXTRACTION_CATEGORIES.reduce((acc, cat) => {
    if (!acc[cat.domain]) acc[cat.domain] = [];
    acc[cat.domain].push(cat.value);
    return acc;
  }, {} as Record<string, InsightExtractionCategory[]>);

  const balance: CategoryBalance[] = [];

  for (const cat of EXTRACTION_CATEGORIES) {
    const count = categoryCounts.get(cat.value) || 0;
    const domainCats = domainCategories[cat.domain].length;
    const targetPercent = domainTargets[cat.domain] / domainCats;
    const targetCount = Math.ceil(totalInsights * targetPercent);

    const percentOfTarget = targetCount > 0 ? (count / targetCount) * 100 : 0;

    let status: 'under' | 'balanced' | 'over' = 'balanced';
    if (percentOfTarget < 50) status = 'under';
    else if (percentOfTarget > 150) status = 'over';

    balance.push({
      category: cat.value,
      domain: cat.domain,
      count,
      targetCount,
      percentOfTarget,
      status,
    });
  }

  // Store for reference
  await AsyncStorage.setItem(STORAGE_KEYS.CATEGORY_BALANCE, JSON.stringify(balance));

  return balance;
}

/**
 * Get underrepresented categories that need more data
 */
export async function getUnderrepresentedCategories(): Promise<CategoryBalance[]> {
  const balance = await calculateCategoryBalance();
  return balance.filter(b => b.status === 'under').sort((a, b) => a.percentOfTarget - b.percentOfTarget);
}

/**
 * Get overrepresented categories (consider limiting new data)
 */
export async function getOverrepresentedCategories(): Promise<CategoryBalance[]> {
  const balance = await calculateCategoryBalance();
  return balance.filter(b => b.status === 'over').sort((a, b) => b.percentOfTarget - a.percentOfTarget);
}

/**
 * Calculate overall balance score
 */
export async function getBalanceScore(): Promise<number> {
  const balance = await calculateCategoryBalance();
  const balancedCount = balance.filter(b => b.status === 'balanced').length;
  return (balancedCount / balance.length) * 100;
}

// ============================================
// TEMPORAL FRESHNESS
// ============================================

/**
 * Calculate freshness score for an insight
 * Newer insights get higher scores, with decay over time
 */
export function calculateFreshnessScore(addedAt: string): number {
  const now = Date.now();
  const addedTime = new Date(addedAt).getTime();
  const ageInDays = (now - addedTime) / (1000 * 60 * 60 * 24);

  // Exponential decay: half-life of 180 days
  const halfLife = 180;
  const freshness = Math.pow(0.5, ageInDays / halfLife) * 100;

  return Math.max(10, Math.round(freshness)); // Minimum 10% freshness
}

/**
 * Get overall freshness score of training data
 */
export async function getOverallFreshnessScore(): Promise<number> {
  const approvedStr = await AsyncStorage.getItem('moodleaf_youtube_approved_insights');
  const interviewStr = await AsyncStorage.getItem('moodleaf_interview_insights');

  const allInsights: any[] = [];
  if (approvedStr) allInsights.push(...JSON.parse(approvedStr));
  if (interviewStr) allInsights.push(...JSON.parse(interviewStr).filter((i: any) => i.status === 'approved'));

  if (allInsights.length === 0) return 100; // No data = perfectly fresh (nothing stale)

  const totalFreshness = allInsights.reduce((sum, insight) => {
    const addedAt = insight.approvedAt || insight.addedAt || insight.createdAt || new Date().toISOString();
    return sum + calculateFreshnessScore(addedAt);
  }, 0);

  return Math.round(totalFreshness / allInsights.length);
}

/**
 * Get stale insights that may need refreshing
 */
export async function getStaleInsights(freshnessThreshold: number = 30): Promise<string[]> {
  const approvedStr = await AsyncStorage.getItem('moodleaf_youtube_approved_insights');
  const interviewStr = await AsyncStorage.getItem('moodleaf_interview_insights');

  const allInsights: any[] = [];
  if (approvedStr) allInsights.push(...JSON.parse(approvedStr));
  if (interviewStr) allInsights.push(...JSON.parse(interviewStr).filter((i: any) => i.status === 'approved'));

  return allInsights
    .filter(insight => {
      const addedAt = insight.approvedAt || insight.addedAt || insight.createdAt;
      return calculateFreshnessScore(addedAt) < freshnessThreshold;
    })
    .map(insight => insight.id);
}

// ============================================
// USER FEEDBACK (ACTIVE LEARNING)
// ============================================

/**
 * Record user feedback on AI response
 */
export async function recordUserFeedback(feedback: Omit<UserFeedback, 'id' | 'timestamp'>): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_FEEDBACK);
  const feedbackList: UserFeedback[] = stored ? JSON.parse(stored) : [];

  feedbackList.push({
    ...feedback,
    id: `feedback_${Date.now()}`,
    timestamp: new Date().toISOString(),
  });

  // Keep last 500 feedback entries
  await AsyncStorage.setItem(STORAGE_KEYS.USER_FEEDBACK, JSON.stringify(feedbackList.slice(-500)));
}

/**
 * Get user feedback by category
 */
export async function getFeedbackByCategory(): Promise<Record<string, { helpful: number; neutral: number; unhelpful: number; harmful: number }>> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_FEEDBACK);
  const feedbackList: UserFeedback[] = stored ? JSON.parse(stored) : [];

  const byCategory: Record<string, { helpful: number; neutral: number; unhelpful: number; harmful: number }> = {};

  for (const feedback of feedbackList) {
    if (!byCategory[feedback.category]) {
      byCategory[feedback.category] = { helpful: 0, neutral: 0, unhelpful: 0, harmful: 0 };
    }
    byCategory[feedback.category][feedback.rating]++;
  }

  return byCategory;
}

/**
 * Calculate user satisfaction score
 */
export async function getUserSatisfactionScore(): Promise<number> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_FEEDBACK);
  const feedbackList: UserFeedback[] = stored ? JSON.parse(stored) : [];

  if (feedbackList.length === 0) return 50; // Neutral if no feedback

  const scores = {
    helpful: 100,
    neutral: 50,
    unhelpful: 25,
    harmful: 0,
  };

  const totalScore = feedbackList.reduce((sum, f) => sum + scores[f.rating], 0);
  return Math.round(totalScore / feedbackList.length);
}

/**
 * Get insights associated with negative feedback
 */
export async function getProblematicInsightsFromFeedback(): Promise<string[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_FEEDBACK);
  const feedbackList: UserFeedback[] = stored ? JSON.parse(stored) : [];

  const problematic = feedbackList
    .filter(f => f.insightId && (f.rating === 'unhelpful' || f.rating === 'harmful'))
    .map(f => f.insightId!)
    .filter((id, index, arr) => arr.indexOf(id) === index); // Unique

  return problematic;
}

// ============================================
// CURRICULUM LEARNING
// ============================================

/**
 * Classify insight complexity
 */
export function classifyComplexity(insight: ExtractedInsight): 'basic' | 'intermediate' | 'advanced' | 'nuanced' {
  const text = `${insight.insight} ${insight.coachingImplication}`;
  const wordCount = text.split(/\s+/).length;

  // Check for complexity markers
  const hasContradiction = insight.extractionCategory === 'contradictions_complexity' ||
                           text.includes('however') || text.includes('but also');
  const isDeepVulnerability = insight.vulnerabilityLevel === 'deep';
  const hasManyAntiPatterns = (insight.antiPatterns?.length || 0) >= 3;
  const isMessyMiddle = insight.extractionCategory === 'messy_middle';

  if (isMessyMiddle || (hasContradiction && isDeepVulnerability)) {
    return 'nuanced';
  }

  if (hasContradiction || hasManyAntiPatterns || isDeepVulnerability) {
    return 'advanced';
  }

  if (wordCount > 100 || (insight.exampleResponses?.length || 0) >= 2) {
    return 'intermediate';
  }

  return 'basic';
}

/**
 * Build curriculum ordering for training
 */
export async function buildCurriculumOrder(): Promise<CurriculumLevel[]> {
  const approvedStr = await AsyncStorage.getItem('moodleaf_youtube_approved_insights');
  const interviewStr = await AsyncStorage.getItem('moodleaf_interview_insights');

  const allInsights: any[] = [];
  if (approvedStr) allInsights.push(...JSON.parse(approvedStr));
  if (interviewStr) allInsights.push(...JSON.parse(interviewStr).filter((i: any) => i.status === 'approved'));

  const levels: CurriculumLevel[] = [
    { level: 1, name: 'Foundation', description: 'Basic empathy and support', insightIds: [], complexity: 'basic' },
    { level: 2, name: 'Building', description: 'Intermediate responses', insightIds: [], complexity: 'intermediate' },
    { level: 3, name: 'Advanced', description: 'Complex emotional situations', insightIds: [], complexity: 'advanced' },
    { level: 4, name: 'Mastery', description: 'Nuanced human complexity', insightIds: [], complexity: 'nuanced' },
  ];

  for (const insight of allInsights) {
    const complexity = classifyComplexity(insight);
    const level = levels.find(l => l.complexity === complexity);
    if (level) {
      level.insightIds.push(insight.id);
    }
  }

  await AsyncStorage.setItem(STORAGE_KEYS.CURRICULUM_ORDER, JSON.stringify(levels));

  return levels;
}

/**
 * Get insights in curriculum order (for training)
 */
export async function getInsightsInCurriculumOrder(): Promise<string[]> {
  const levels = await buildCurriculumOrder();

  // Flatten: all basic first, then intermediate, etc.
  return levels.flatMap(level => level.insightIds);
}

// ============================================
// DIVERSITY SCORING
// ============================================

/**
 * Analyze topic diversity
 */
export async function analyzeDiversity(): Promise<DiversityReport> {
  const approvedStr = await AsyncStorage.getItem('moodleaf_youtube_approved_insights');
  const interviewStr = await AsyncStorage.getItem('moodleaf_interview_insights');

  const allInsights: any[] = [];
  if (approvedStr) allInsights.push(...JSON.parse(approvedStr));
  if (interviewStr) allInsights.push(...JSON.parse(interviewStr).filter((i: any) => i.status === 'approved'));

  // Extract topics from all insights
  const topicCounts = new Map<string, number>();
  const allText: string[] = [];

  for (const insight of allInsights) {
    const text = `${insight.title || ''} ${insight.insight || ''}`;
    allText.push(text.toLowerCase());

    // Extract key topics (simplified topic modeling)
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 5);
    for (const word of words) {
      topicCounts.set(word, (topicCounts.get(word) || 0) + 1);
    }
  }

  // Get top topics
  const sortedTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  // Identify gaps based on expected domains
  const expectedDomains = [
    'joy', 'happiness', 'humor', 'laughter', 'celebration',
    'sadness', 'grief', 'loss', 'pain', 'struggle',
    'anxiety', 'worry', 'fear', 'panic',
    'love', 'relationship', 'friendship', 'connection', 'loneliness',
    'growth', 'change', 'learning', 'wisdom',
    'anger', 'frustration', 'conflict',
    'hope', 'resilience', 'recovery',
  ];

  const presentDomains = new Set(sortedTopics.map(t => t[0]));
  const gaps = expectedDomains.filter(d => !presentDomains.has(d));

  // Identify overrepresented (>10% of all insights mention it)
  const threshold = allInsights.length * 0.1;
  const overrepresented = sortedTopics
    .filter(t => t[1] > threshold)
    .map(t => t[0]);

  // Generate recommendations
  const recommendations: string[] = [];

  if (gaps.length > 5) {
    recommendations.push(`Consider adding content about: ${gaps.slice(0, 5).join(', ')}`);
  }

  if (overrepresented.length > 0) {
    recommendations.push(`Consider diversifying beyond: ${overrepresented.join(', ')}`);
  }

  const uniqueTopics = new Set(sortedTopics.map(t => t[0])).size;
  if (uniqueTopics < 20) {
    recommendations.push('Topic diversity is low. Add content from more varied sources.');
  }

  return {
    totalInsights: allInsights.length,
    uniqueTopics,
    topicCoverage: sortedTopics.map(([topic, count]) => ({ topic, count })),
    gapsIdentified: gaps,
    overrepresentedAreas: overrepresented,
    recommendations,
  };
}

/**
 * Calculate overall diversity score
 */
export async function getDiversityScore(): Promise<number> {
  const diversity = await analyzeDiversity();

  // Score based on:
  // - Number of unique topics (more = better)
  // - Gaps (fewer = better)
  // - Overrepresentation (less = better)

  const topicScore = Math.min((diversity.uniqueTopics / 50) * 100, 100);
  const gapPenalty = diversity.gapsIdentified.length * 3;
  const overrepPenalty = diversity.overrepresentedAreas.length * 5;

  return Math.max(0, Math.round(topicScore - gapPenalty - overrepPenalty));
}

// ============================================
// COMPREHENSIVE QUALITY METRICS
// ============================================

/**
 * Calculate all quality metrics
 */
export async function calculateAllQualityMetrics(): Promise<QualityMetrics> {
  const [
    diversityScore,
    balanceScore,
    freshnessScore,
    crossSourceScore,
    userSatisfactionScore,
  ] = await Promise.all([
    getDiversityScore(),
    getBalanceScore(),
    getOverallFreshnessScore(),
    getCrossSourceScore(),
    getUserSatisfactionScore(),
  ]);

  // Overall quality is weighted average
  const overallQuality = Math.round(
    diversityScore * 0.15 +
    balanceScore * 0.20 +
    freshnessScore * 0.15 +
    crossSourceScore * 0.20 +
    userSatisfactionScore * 0.30
  );

  const metrics: QualityMetrics = {
    overallQuality,
    diversityScore,
    balanceScore,
    freshnessScore,
    crossSourceScore,
    userSatisfactionScore,
    lastCalculated: new Date().toISOString(),
  };

  await AsyncStorage.setItem(STORAGE_KEYS.QUALITY_METRICS, JSON.stringify(metrics));

  return metrics;
}

/**
 * Get last calculated quality metrics
 */
export async function getQualityMetrics(): Promise<QualityMetrics | null> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.QUALITY_METRICS);
  return stored ? JSON.parse(stored) : null;
}

// ============================================
// QUALITY IMPROVEMENT RECOMMENDATIONS
// ============================================

/**
 * Generate quality improvement recommendations
 */
export async function getQualityRecommendations(): Promise<{
  priority: 'high' | 'medium' | 'low';
  area: string;
  recommendation: string;
  expectedImpact: string;
}[]> {
  const metrics = await calculateAllQualityMetrics();
  const recommendations: {
    priority: 'high' | 'medium' | 'low';
    area: string;
    recommendation: string;
    expectedImpact: string;
  }[] = [];

  // Low user satisfaction is highest priority
  if (metrics.userSatisfactionScore < 60) {
    recommendations.push({
      priority: 'high',
      area: 'User Satisfaction',
      recommendation: 'Review insights associated with negative feedback and consider removing or revising them',
      expectedImpact: 'Could improve overall quality by 10-20 points',
    });
  }

  // Low balance means some categories are underserved
  if (metrics.balanceScore < 50) {
    const underrep = await getUnderrepresentedCategories();
    recommendations.push({
      priority: 'high',
      area: 'Category Balance',
      recommendation: `Add more content for: ${underrep.slice(0, 3).map(c => c.category).join(', ')}`,
      expectedImpact: 'Will make AI more versatile across emotional domains',
    });
  }

  // Low cross-source validation
  if (metrics.crossSourceScore < 30) {
    recommendations.push({
      priority: 'medium',
      area: 'Cross-Source Validation',
      recommendation: 'Add content from more diverse sources to validate existing insights',
      expectedImpact: 'Higher confidence in training data accuracy',
    });
  }

  // Low freshness
  if (metrics.freshnessScore < 50) {
    recommendations.push({
      priority: 'medium',
      area: 'Data Freshness',
      recommendation: 'Add newer content; consider archiving insights older than 1 year',
      expectedImpact: 'More relevant and timely AI responses',
    });
  }

  // Low diversity
  if (metrics.diversityScore < 50) {
    const diversity = await analyzeDiversity();
    recommendations.push({
      priority: 'low',
      area: 'Topic Diversity',
      recommendation: `Cover more topics: ${diversity.gapsIdentified.slice(0, 3).join(', ')}`,
      expectedImpact: 'Broader AI knowledge base',
    });
  }

  return recommendations.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}

// ============================================
// HELPERS
// ============================================

async function getTotalInsightCount(): Promise<number> {
  const approvedStr = await AsyncStorage.getItem('moodleaf_youtube_approved_insights');
  const interviewStr = await AsyncStorage.getItem('moodleaf_interview_insights');

  let count = 0;
  if (approvedStr) count += JSON.parse(approvedStr).length;
  if (interviewStr) count += JSON.parse(interviewStr).filter((i: any) => i.status === 'approved').length;

  return count;
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Semantic deduplication
  calculateSemanticSimilarity,
  findSimilarInsights,
  isSemanticDuplicate,

  // Cross-source validation
  findCrossValidatedInsights,
  getCrossSourceScore,

  // Category balance
  calculateCategoryBalance,
  getUnderrepresentedCategories,
  getOverrepresentedCategories,
  getBalanceScore,

  // Freshness
  calculateFreshnessScore,
  getOverallFreshnessScore,
  getStaleInsights,

  // User feedback
  recordUserFeedback,
  getFeedbackByCategory,
  getUserSatisfactionScore,
  getProblematicInsightsFromFeedback,

  // Curriculum learning
  classifyComplexity,
  buildCurriculumOrder,
  getInsightsInCurriculumOrder,

  // Diversity
  analyzeDiversity,
  getDiversityScore,

  // Overall quality
  calculateAllQualityMetrics,
  getQualityMetrics,
  getQualityRecommendations,
};
