/**
 * Training Data Service
 *
 * Manages interview insights, training data collection, and export
 * for eventually training a local LLM that understands humans.
 *
 * This service:
 * - Stores interview insights from user research
 * - Tracks coach corrections (good/bad response pairs)
 * - Exports data in formats suitable for model training
 * - Tracks readiness for each training phase
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getScoredExchanges, getScoreStats, ScoredExchange } from './humanScoreService';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  INSIGHTS: 'moodleaf_interview_insights',
  CORRECTIONS: 'moodleaf_coach_corrections',
  TRAINING_META: 'moodleaf_training_metadata',
  PENDING_INSIGHTS: 'moodleaf_pending_insights',
};

// ============================================
// TYPES
// ============================================

export type InsightCategory =
  | 'cognitive_patterns'       // How people think
  | 'emotional_processing'     // How people feel
  | 'neurological_differences' // Aphantasia, ADHD, etc.
  | 'communication_needs'      // How people want to be talked to
  | 'motivation_patterns'      // What drives/blocks action
  | 'relationship_with_self'   // Self-talk, self-perception
  | 'crisis_patterns'          // What crisis looks like
  | 'recovery_patterns'        // What healing looks like
  | 'daily_rhythms'            // Energy patterns, timing
  | 'social_dynamics';         // How connection affects them

export type SourceType =
  | 'user_interview'
  | 'research_paper'
  | 'expert_input'
  | 'pattern_observation'
  | 'user_feedback';

export type ConfidenceLevel = 'hypothesis' | 'observed' | 'validated';

export interface InterviewInsight {
  id: string;
  sourceType: SourceType;
  source: string;              // "Interview #23", "ADHD study 2024", etc.
  dateCollected: string;

  // The insight itself
  category: InsightCategory;
  title: string;               // Short summary
  insight: string;             // The actual learning
  quotes?: string[];           // Direct quotes if available

  // How to use it
  coachingImplication: string; // How this should change coach behavior
  techniqueSuggestions?: string[];
  antiPatterns?: string[];     // Things NOT to do based on this

  // Validation
  confidenceLevel: ConfidenceLevel;
  relatedProfiles?: string[];  // Cognitive profiles this applies to

  // Status
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  approvedBy?: string;

  // Training
  usedInTraining: boolean;
  trainingExamplesGenerated?: number;
}

export interface CoachCorrection {
  id: string;
  timestamp: string;

  // Context
  userMessage: string;
  conversationContext?: {
    energy?: string;
    mood?: string;
    messageNumber?: number;
    profile?: any;
  };

  // The correction
  originalResponse: string;
  issue: string;               // What was wrong
  betterResponse?: string;     // What should have been said
  correctionType: 'explicit' | 'implicit' | 'generated';

  // Source
  sourceType: 'user_feedback' | 'admin_review' | 'auto_detected';

  // Training
  usedInTraining: boolean;
}

export interface TrainingReadiness {
  phase: 1 | 2 | 3 | 4 | 5;
  phaseName: string;
  phaseDescription: string;

  // Data counts
  claudeScoredExamples: number;
  localScoredExamples: number;
  approvedInsights: number;
  corrections: number;
  uniqueProfiles: number;

  // Requirements for next phase
  requirements: {
    name: string;
    current: number;
    needed: number;
    met: boolean;
  }[];

  // Overall
  readyForNextPhase: boolean;
  nextMilestone: string;
}

export interface TrainingExport {
  exportDate: string;
  version: string;
  stats: {
    totalConversations: number;
    totalInsights: number;
    totalCorrections: number;
    uniqueProfiles: number;
  };
  conversations: any[];
  insights: InterviewInsight[];
  corrections: CoachCorrection[];
}

// ============================================
// INSIGHT MANAGEMENT
// ============================================

/**
 * Import a new interview insight
 */
export async function importInterviewInsight(
  insight: Omit<InterviewInsight, 'id' | 'status' | 'usedInTraining'>
): Promise<InterviewInsight> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.INSIGHTS);
  const insights: InterviewInsight[] = stored ? JSON.parse(stored) : [];

  const newInsight: InterviewInsight = {
    ...insight,
    id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    usedInTraining: false,
  };

  insights.push(newInsight);
  await AsyncStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(insights));

  return newInsight;
}

/**
 * Approve a pending insight
 */
export async function approveInsight(id: string, approvedBy?: string): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.INSIGHTS);
  const insights: InterviewInsight[] = stored ? JSON.parse(stored) : [];

  const index = insights.findIndex(i => i.id === id);
  if (index !== -1) {
    insights[index].status = 'approved';
    insights[index].approvedAt = new Date().toISOString();
    insights[index].approvedBy = approvedBy;
    await AsyncStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(insights));
  }
}

/**
 * Reject a pending insight
 */
export async function rejectInsight(id: string): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.INSIGHTS);
  const insights: InterviewInsight[] = stored ? JSON.parse(stored) : [];

  const index = insights.findIndex(i => i.id === id);
  if (index !== -1) {
    insights[index].status = 'rejected';
    await AsyncStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(insights));
  }
}

/**
 * Update an existing insight
 */
export async function updateInsight(
  id: string,
  updates: Partial<InterviewInsight>
): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.INSIGHTS);
  const insights: InterviewInsight[] = stored ? JSON.parse(stored) : [];

  const index = insights.findIndex(i => i.id === id);
  if (index !== -1) {
    insights[index] = { ...insights[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(insights));
  }
}

/**
 * Delete an insight
 */
export async function deleteInsight(id: string): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.INSIGHTS);
  const insights: InterviewInsight[] = stored ? JSON.parse(stored) : [];

  const filtered = insights.filter(i => i.id !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.INSIGHTS, JSON.stringify(filtered));
}

/**
 * Get all insights
 */
export async function getAllInsights(): Promise<InterviewInsight[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.INSIGHTS);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get insights by status
 */
export async function getInsightsByStatus(
  status: 'pending' | 'approved' | 'rejected'
): Promise<InterviewInsight[]> {
  const all = await getAllInsights();
  return all.filter(i => i.status === status);
}

/**
 * Get insights by category
 */
export async function getInsightsByCategory(
  category: InsightCategory
): Promise<InterviewInsight[]> {
  const all = await getAllInsights();
  return all.filter(i => i.category === category && i.status === 'approved');
}

/**
 * Search insights
 */
export async function searchInsights(query: string): Promise<InterviewInsight[]> {
  const all = await getAllInsights();
  const queryLower = query.toLowerCase();

  return all.filter(i =>
    i.title.toLowerCase().includes(queryLower) ||
    i.insight.toLowerCase().includes(queryLower) ||
    i.coachingImplication.toLowerCase().includes(queryLower) ||
    i.quotes?.some(q => q.toLowerCase().includes(queryLower))
  );
}

// ============================================
// CORRECTION MANAGEMENT
// ============================================

/**
 * Record a coach correction
 */
export async function recordCorrection(
  correction: Omit<CoachCorrection, 'id' | 'timestamp' | 'usedInTraining'>
): Promise<CoachCorrection> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.CORRECTIONS);
  const corrections: CoachCorrection[] = stored ? JSON.parse(stored) : [];

  const newCorrection: CoachCorrection = {
    ...correction,
    id: `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    usedInTraining: false,
  };

  corrections.push(newCorrection);
  await AsyncStorage.setItem(STORAGE_KEYS.CORRECTIONS, JSON.stringify(corrections));

  return newCorrection;
}

/**
 * Get all corrections
 */
export async function getAllCorrections(): Promise<CoachCorrection[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.CORRECTIONS);
  return stored ? JSON.parse(stored) : [];
}

// ============================================
// TRAINING READINESS
// ============================================

/**
 * Get current training readiness status
 */
export async function getTrainingReadiness(): Promise<TrainingReadiness> {
  const scoreStats = await getScoreStats();
  const insights = await getInsightsByStatus('approved');
  const corrections = await getAllCorrections();

  // Calculate unique profiles from scored exchanges
  const exchanges = await getScoredExchanges();
  const uniqueProfiles = new Set(
    exchanges.map(e => JSON.stringify(e.context))
  ).size;

  // Determine current phase and requirements
  const claudeExamples = scoreStats.claudeScoreCount;
  const localExamples = scoreStats.localScoreCount;
  const insightCount = insights.length;
  const correctionCount = corrections.length;

  // Phase determination
  let phase: 1 | 2 | 3 | 4 | 5 = 1;
  let phaseName = 'Data Collection';
  let phaseDescription = 'Collecting scored conversations and insights';

  const requirements: TrainingReadiness['requirements'] = [];

  if (claudeExamples >= 500) {
    phase = 2;
    phaseName = 'Local Scorer Training';
    phaseDescription = 'Training a local model to score response quality';
  }

  if (claudeExamples >= 1000) {
    phase = 3;
    phaseName = 'Response Ranking';
    phaseDescription = 'Using local scorer to rank and select responses';
  }

  if (claudeExamples >= 2000 && insightCount >= 50 && correctionCount >= 100) {
    phase = 4;
    phaseName = 'Local LLM Fine-tuning';
    phaseDescription = 'Fine-tuning a local LLM on our data';
  }

  // Requirements for next phase
  if (phase === 1) {
    requirements.push(
      { name: 'Claude-scored examples', current: claudeExamples, needed: 500, met: claudeExamples >= 500 },
      { name: 'Interview insights', current: insightCount, needed: 20, met: insightCount >= 20 }
    );
  } else if (phase === 2) {
    requirements.push(
      { name: 'Local scorer accuracy', current: 0, needed: 85, met: false },
      { name: 'Claude-scored examples', current: claudeExamples, needed: 1000, met: claudeExamples >= 1000 }
    );
  } else if (phase === 3) {
    requirements.push(
      { name: 'Claude-scored examples', current: claudeExamples, needed: 2000, met: claudeExamples >= 2000 },
      { name: 'Interview insights', current: insightCount, needed: 50, met: insightCount >= 50 },
      { name: 'Corrections', current: correctionCount, needed: 100, met: correctionCount >= 100 }
    );
  }

  const readyForNextPhase = requirements.every(r => r.met);
  const nextMilestone = requirements.find(r => !r.met)?.name || 'Ready for next phase';

  return {
    phase,
    phaseName,
    phaseDescription,
    claudeScoredExamples: claudeExamples,
    localScoredExamples: localExamples,
    approvedInsights: insightCount,
    corrections: correctionCount,
    uniqueProfiles,
    requirements,
    readyForNextPhase,
    nextMilestone: readyForNextPhase ? 'Begin next phase' : `Need more: ${nextMilestone}`,
  };
}

// ============================================
// EXPORT FOR TRAINING
// ============================================

/**
 * Export all training data in a format suitable for model training
 */
export async function exportForTraining(): Promise<TrainingExport> {
  const exchanges = await getScoredExchanges();
  const insights = await getInsightsByStatus('approved');
  const corrections = await getAllCorrections();

  // Get unique profiles
  const uniqueProfiles = new Set(
    exchanges.map(e => JSON.stringify(e.context))
  ).size;

  // Transform exchanges for training format
  const trainingConversations = exchanges.map(e => ({
    id: e.id,
    userMessage: e.userMessage,
    coachResponse: e.aiResponse,
    context: e.context,
    scores: e.score,
    scoredBy: e.scoredBy,
  }));

  return {
    exportDate: new Date().toISOString(),
    version: '1.0',
    stats: {
      totalConversations: exchanges.length,
      totalInsights: insights.length,
      totalCorrections: corrections.length,
      uniqueProfiles,
    },
    conversations: trainingConversations,
    insights,
    corrections,
  };
}

/**
 * Export as downloadable JSON string
 */
export async function exportAsJSON(): Promise<string> {
  const data = await exportForTraining();
  return JSON.stringify(data, null, 2);
}

// ============================================
// BATCH IMPORT
// ============================================

export interface BatchInsightInput {
  category: InsightCategory;
  title: string;
  insight: string;
  quotes?: string[];
  coachingImplication: string;
  techniqueSuggestions?: string[];
  antiPatterns?: string[];
  confidenceLevel: ConfidenceLevel;
  relatedProfiles?: string[];
}

export interface BatchImportPayload {
  source: string;
  sourceType?: SourceType;
  insights: BatchInsightInput[];
}

export interface InterviewLinkPayload {
  source: string;
  interviewLinks: {
    interviewId: string;
    participantId?: string;
    date: string;
    link: string;
    notes?: string;
    insights: BatchInsightInput[];
  }[];
}

export interface BatchImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  insightIds: string[];
}

/**
 * Batch import multiple insights at once
 */
export async function batchImportInsights(
  payload: BatchImportPayload
): Promise<BatchImportResult> {
  const result: BatchImportResult = {
    success: true,
    imported: 0,
    failed: 0,
    errors: [],
    insightIds: [],
  };

  for (let i = 0; i < payload.insights.length; i++) {
    const insightInput = payload.insights[i];

    try {
      // Validate required fields
      if (!insightInput.category || !insightInput.title || !insightInput.insight) {
        throw new Error(`Insight ${i + 1}: Missing required fields (category, title, or insight)`);
      }

      // Validate category
      const validCategories = INSIGHT_CATEGORIES.map(c => c.value);
      if (!validCategories.includes(insightInput.category)) {
        throw new Error(`Insight ${i + 1}: Invalid category "${insightInput.category}"`);
      }

      // Validate confidence level
      const validConfidence = CONFIDENCE_LEVELS.map(c => c.value);
      if (!validConfidence.includes(insightInput.confidenceLevel)) {
        throw new Error(`Insight ${i + 1}: Invalid confidence level "${insightInput.confidenceLevel}"`);
      }

      const imported = await importInterviewInsight({
        sourceType: payload.sourceType || 'user_interview',
        source: payload.source,
        dateCollected: new Date().toISOString(),
        category: insightInput.category,
        title: insightInput.title,
        insight: insightInput.insight,
        quotes: insightInput.quotes,
        coachingImplication: insightInput.coachingImplication,
        techniqueSuggestions: insightInput.techniqueSuggestions,
        antiPatterns: insightInput.antiPatterns,
        confidenceLevel: insightInput.confidenceLevel,
        relatedProfiles: insightInput.relatedProfiles,
      });

      result.imported++;
      result.insightIds.push(imported.id);
    } catch (error) {
      result.failed++;
      result.errors.push(error instanceof Error ? error.message : `Insight ${i + 1}: Unknown error`);
    }
  }

  result.success = result.failed === 0;
  return result;
}

/**
 * Import insights from interview links (with metadata)
 */
export async function importFromInterviewLinks(
  payload: InterviewLinkPayload
): Promise<BatchImportResult> {
  const result: BatchImportResult = {
    success: true,
    imported: 0,
    failed: 0,
    errors: [],
    insightIds: [],
  };

  for (const interview of payload.interviewLinks) {
    for (let i = 0; i < interview.insights.length; i++) {
      const insightInput = interview.insights[i];

      try {
        // Build source string with interview metadata
        const sourceInfo = [
          `Interview: ${interview.interviewId}`,
          interview.participantId ? `Participant: ${interview.participantId}` : null,
          `Date: ${interview.date}`,
          interview.link ? `Link: ${interview.link}` : null,
        ].filter(Boolean).join(' | ');

        const imported = await importInterviewInsight({
          sourceType: 'user_interview',
          source: `${payload.source} - ${sourceInfo}`,
          dateCollected: interview.date || new Date().toISOString(),
          category: insightInput.category,
          title: insightInput.title,
          insight: insightInput.insight,
          quotes: insightInput.quotes,
          coachingImplication: insightInput.coachingImplication,
          techniqueSuggestions: insightInput.techniqueSuggestions,
          antiPatterns: insightInput.antiPatterns,
          confidenceLevel: insightInput.confidenceLevel,
          relatedProfiles: insightInput.relatedProfiles,
        });

        result.imported++;
        result.insightIds.push(imported.id);
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Interview ${interview.interviewId}, Insight ${i + 1}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  }

  result.success = result.failed === 0;
  return result;
}

/**
 * Parse and validate batch import JSON
 */
export function parseBatchImportJSON(jsonString: string): {
  valid: boolean;
  payload?: BatchImportPayload | InterviewLinkPayload;
  error?: string;
  type?: 'batch' | 'interviewLinks';
} {
  try {
    const parsed = JSON.parse(jsonString);

    // Determine type
    if (parsed.interviewLinks && Array.isArray(parsed.interviewLinks)) {
      // Interview links format
      if (!parsed.source) {
        return { valid: false, error: 'Missing "source" field' };
      }
      return {
        valid: true,
        payload: parsed as InterviewLinkPayload,
        type: 'interviewLinks',
      };
    } else if (parsed.insights && Array.isArray(parsed.insights)) {
      // Standard batch format
      if (!parsed.source) {
        return { valid: false, error: 'Missing "source" field' };
      }
      return {
        valid: true,
        payload: parsed as BatchImportPayload,
        type: 'batch',
      };
    } else {
      return {
        valid: false,
        error: 'JSON must contain either "insights" array or "interviewLinks" array',
      };
    }
  } catch (e) {
    return {
      valid: false,
      error: `Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`,
    };
  }
}

// ============================================
// INSIGHT CATEGORIES
// ============================================

export const INSIGHT_CATEGORIES: { value: InsightCategory; label: string; description: string }[] = [
  { value: 'cognitive_patterns', label: 'Cognitive Patterns', description: 'How people think and process information' },
  { value: 'emotional_processing', label: 'Emotional Processing', description: 'How people experience and handle emotions' },
  { value: 'neurological_differences', label: 'Neurological Differences', description: 'Aphantasia, ADHD, inner monologue, etc.' },
  { value: 'communication_needs', label: 'Communication Needs', description: 'How people prefer to be talked to' },
  { value: 'motivation_patterns', label: 'Motivation Patterns', description: 'What drives or blocks action' },
  { value: 'relationship_with_self', label: 'Relationship with Self', description: 'Self-talk, self-perception, identity' },
  { value: 'crisis_patterns', label: 'Crisis Patterns', description: 'What crisis looks and feels like' },
  { value: 'recovery_patterns', label: 'Recovery Patterns', description: 'What healing and growth look like' },
  { value: 'daily_rhythms', label: 'Daily Rhythms', description: 'Energy patterns, timing, cycles' },
  { value: 'social_dynamics', label: 'Social Dynamics', description: 'How connection affects wellbeing' },
];

export const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: 'user_interview', label: 'User Interview' },
  { value: 'research_paper', label: 'Research Paper' },
  { value: 'expert_input', label: 'Expert Input' },
  { value: 'pattern_observation', label: 'Pattern Observation' },
  { value: 'user_feedback', label: 'User Feedback' },
];

export const CONFIDENCE_LEVELS: { value: ConfidenceLevel; label: string; description: string }[] = [
  { value: 'hypothesis', label: 'Hypothesis', description: 'Needs validation' },
  { value: 'observed', label: 'Observed', description: 'Seen in multiple cases' },
  { value: 'validated', label: 'Validated', description: 'Confirmed and tested' },
];

// ============================================
// EXPORTS
// ============================================

export default {
  // Insights
  importInterviewInsight,
  approveInsight,
  rejectInsight,
  updateInsight,
  deleteInsight,
  getAllInsights,
  getInsightsByStatus,
  getInsightsByCategory,
  searchInsights,

  // Batch Import
  batchImportInsights,
  importFromInterviewLinks,
  parseBatchImportJSON,

  // Corrections
  recordCorrection,
  getAllCorrections,

  // Training
  getTrainingReadiness,
  exportForTraining,
  exportAsJSON,

  // Constants
  INSIGHT_CATEGORIES,
  SOURCE_TYPES,
  CONFIDENCE_LEVELS,
};
