/**
 * Insight Feedback Service
 *
 * Collects user feedback on insights for AI training improvement.
 * When users disagree with an insight, that feedback can be used
 * (anonymously and with consent) to improve future insight generation.
 *
 * Privacy First:
 * - No personal data in feedback
 * - Only insight text and reason
 * - Requires explicit user consent
 * - Local storage by default, optional anonymous upload
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  FEEDBACK_LOG: 'moodleaf_insight_feedback',
  UPLOAD_CONSENT: 'moodleaf_feedback_upload_consent',
  PENDING_UPLOADS: 'moodleaf_pending_feedback_uploads',
};

// ============================================
// TYPES
// ============================================

export type FeedbackType =
  | 'disagree_completely'    // "This doesn't apply to me at all"
  | 'disagree_nuance'        // "It's more complex than this"
  | 'disagree_timing'        // "This was true before, not now"
  | 'disagree_harmful'       // "This made me feel worse"
  | 'agree_but_obvious'      // "I already knew this"
  | 'agree_helpful'          // "This was genuinely helpful"
  | 'agree_life_changing';   // "This changed how I see things"

export interface InsightFeedback {
  id: string;
  timestamp: string;

  // The insight that received feedback (text only, no IDs)
  insightText: string;
  insightCategory?: string;

  // User's feedback
  feedbackType: FeedbackType;
  feedbackReason?: string; // Optional free-text explanation

  // Context (anonymized)
  userMoodAtTime?: string; // 'positive' | 'neutral' | 'negative'
  daysSinceInsightGenerated?: number;

  // Upload status
  uploadedAt?: string;
  uploadConsent: boolean;
}

export interface FeedbackSettings {
  allowAnonymousUpload: boolean;
  autoUploadPositive: boolean; // Auto-upload positive feedback
  autoUploadNegative: boolean; // Auto-upload negative feedback
  showFeedbackPrompts: boolean; // Show feedback prompts in UI
}

const DEFAULT_SETTINGS: FeedbackSettings = {
  allowAnonymousUpload: false,
  autoUploadPositive: false,
  autoUploadNegative: false,
  showFeedbackPrompts: true,
};

// ============================================
// FEEDBACK COLLECTION
// ============================================

/**
 * Record user feedback on an insight
 */
export async function recordInsightFeedback(
  insightText: string,
  feedbackType: FeedbackType,
  options?: {
    feedbackReason?: string;
    insightCategory?: string;
    userMood?: string;
    daysSinceGenerated?: number;
  }
): Promise<InsightFeedback> {
  const settings = await getFeedbackSettings();

  const feedback: InsightFeedback = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    insightText,
    insightCategory: options?.insightCategory,
    feedbackType,
    feedbackReason: options?.feedbackReason,
    userMoodAtTime: options?.userMood,
    daysSinceInsightGenerated: options?.daysSinceGenerated,
    uploadConsent: settings.allowAnonymousUpload,
  };

  // Store locally
  const existing = await getAllFeedback();
  existing.push(feedback);

  // Keep last 500 feedback entries
  const trimmed = existing.slice(-500);
  await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK_LOG, JSON.stringify(trimmed));

  // Check if we should auto-upload
  const isPositive = feedbackType.startsWith('agree');
  const shouldAutoUpload = settings.allowAnonymousUpload && (
    (isPositive && settings.autoUploadPositive) ||
    (!isPositive && settings.autoUploadNegative)
  );

  if (shouldAutoUpload) {
    await addToPendingUploads(feedback);
  }

  console.log('[InsightFeedback] Recorded:', feedbackType, 'for insight:', insightText.substring(0, 50));
  return feedback;
}

/**
 * Get all recorded feedback
 */
export async function getAllFeedback(): Promise<InsightFeedback[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FEEDBACK_LOG);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[InsightFeedback] Error loading feedback:', error);
    return [];
  }
}

/**
 * Get feedback statistics
 */
export async function getFeedbackStats(): Promise<{
  total: number;
  byType: Record<FeedbackType, number>;
  positiveRate: number;
  uploaded: number;
}> {
  const feedback = await getAllFeedback();

  const byType = feedback.reduce((acc, f) => {
    acc[f.feedbackType] = (acc[f.feedbackType] || 0) + 1;
    return acc;
  }, {} as Record<FeedbackType, number>);

  const positive = feedback.filter(f => f.feedbackType.startsWith('agree')).length;
  const uploaded = feedback.filter(f => f.uploadedAt).length;

  return {
    total: feedback.length,
    byType,
    positiveRate: feedback.length > 0 ? positive / feedback.length : 0,
    uploaded,
  };
}

// ============================================
// UPLOAD MANAGEMENT
// ============================================

/**
 * Add feedback to pending uploads queue
 */
async function addToPendingUploads(feedback: InsightFeedback): Promise<void> {
  const pending = await getPendingUploads();
  pending.push(feedback);
  await AsyncStorage.setItem(STORAGE_KEYS.PENDING_UPLOADS, JSON.stringify(pending));
}

/**
 * Get pending uploads
 */
export async function getPendingUploads(): Promise<InsightFeedback[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_UPLOADS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Prepare anonymous training data for upload
 * Strips any potentially identifying information
 */
export function prepareForAnonymousUpload(feedback: InsightFeedback[]): object[] {
  return feedback.map(f => ({
    // Only include training-relevant data
    insight_text: f.insightText,
    insight_category: f.insightCategory || 'general',
    feedback_type: f.feedbackType,
    feedback_reason: f.feedbackReason || null,
    user_mood: f.userMoodAtTime || null,
    days_since_generated: f.daysSinceInsightGenerated || null,
    // No timestamps, IDs, or anything that could identify user
  }));
}

/**
 * Upload pending feedback (placeholder for actual implementation)
 * In production, this would send to a privacy-preserving backend
 */
export async function uploadPendingFeedback(): Promise<{
  success: boolean;
  uploaded: number;
  error?: string;
}> {
  const pending = await getPendingUploads();
  if (pending.length === 0) {
    return { success: true, uploaded: 0 };
  }

  const settings = await getFeedbackSettings();
  if (!settings.allowAnonymousUpload) {
    return { success: false, uploaded: 0, error: 'Upload not enabled' };
  }

  try {
    const anonymizedData = prepareForAnonymousUpload(pending);

    // TODO: Implement actual upload to privacy-preserving backend
    // For now, just log and clear the queue
    console.log('[InsightFeedback] Would upload:', anonymizedData.length, 'items');
    console.log('[InsightFeedback] Sample:', JSON.stringify(anonymizedData[0], null, 2));

    // Mark as uploaded
    const allFeedback = await getAllFeedback();
    const uploadedAt = new Date().toISOString();
    const updatedFeedback = allFeedback.map(f => {
      const wasPending = pending.some(p => p.id === f.id);
      return wasPending ? { ...f, uploadedAt } : f;
    });
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK_LOG, JSON.stringify(updatedFeedback));

    // Clear pending queue
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_UPLOADS);

    return { success: true, uploaded: pending.length };
  } catch (error) {
    console.error('[InsightFeedback] Upload error:', error);
    return { success: false, uploaded: 0, error: String(error) };
  }
}

// ============================================
// SETTINGS
// ============================================

/**
 * Get feedback settings
 */
export async function getFeedbackSettings(): Promise<FeedbackSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.UPLOAD_CONSENT);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update feedback settings
 */
export async function updateFeedbackSettings(
  settings: Partial<FeedbackSettings>
): Promise<void> {
  const current = await getFeedbackSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(STORAGE_KEYS.UPLOAD_CONSENT, JSON.stringify(updated));
}

/**
 * Set consent for anonymous upload
 */
export async function setUploadConsent(consent: boolean): Promise<void> {
  await updateFeedbackSettings({ allowAnonymousUpload: consent });
}

// ============================================
// TRAINING DATA EXPORT
// ============================================

/**
 * Export feedback as training data (for local training)
 */
export async function exportFeedbackAsTrainingData(): Promise<{
  positive_examples: object[];
  negative_examples: object[];
  disagreements: object[];
}> {
  const feedback = await getAllFeedback();

  const positive = feedback.filter(f =>
    f.feedbackType === 'agree_helpful' || f.feedbackType === 'agree_life_changing'
  );

  const negative = feedback.filter(f =>
    f.feedbackType === 'disagree_completely' || f.feedbackType === 'disagree_harmful'
  );

  const nuanced = feedback.filter(f =>
    f.feedbackType === 'disagree_nuance' || f.feedbackType === 'disagree_timing'
  );

  return {
    positive_examples: positive.map(f => ({
      insight: f.insightText,
      category: f.insightCategory,
      why_good: f.feedbackReason,
    })),
    negative_examples: negative.map(f => ({
      insight: f.insightText,
      category: f.insightCategory,
      why_bad: f.feedbackReason,
    })),
    disagreements: nuanced.map(f => ({
      insight: f.insightText,
      category: f.insightCategory,
      nuance: f.feedbackReason,
      type: f.feedbackType,
    })),
  };
}

// ============================================
// UI HELPERS
// ============================================

/**
 * Get human-readable label for feedback type
 */
export function getFeedbackLabel(type: FeedbackType): string {
  const labels: Record<FeedbackType, string> = {
    disagree_completely: "Doesn't apply to me",
    disagree_nuance: "It's more complex",
    disagree_timing: "Not true anymore",
    disagree_harmful: "This made me feel worse",
    agree_but_obvious: "I already knew this",
    agree_helpful: "This was helpful",
    agree_life_changing: "This was eye-opening",
  };
  return labels[type] || type;
}

/**
 * Get emoji for feedback type
 */
export function getFeedbackEmoji(type: FeedbackType): string {
  const emojis: Record<FeedbackType, string> = {
    disagree_completely: '❌',
    disagree_nuance: '🤔',
    disagree_timing: '⏰',
    disagree_harmful: '💔',
    agree_but_obvious: '🤷',
    agree_helpful: '💚',
    agree_life_changing: '✨',
  };
  return emojis[type] || '📝';
}

/**
 * Get all feedback options for UI
 */
export function getAllFeedbackOptions(): { type: FeedbackType; label: string; emoji: string }[] {
  const types: FeedbackType[] = [
    'agree_life_changing',
    'agree_helpful',
    'agree_but_obvious',
    'disagree_nuance',
    'disagree_timing',
    'disagree_completely',
    'disagree_harmful',
  ];

  return types.map(type => ({
    type,
    label: getFeedbackLabel(type),
    emoji: getFeedbackEmoji(type),
  }));
}

// ============================================
// CLEAR/RESET
// ============================================

/**
 * Clear all feedback (for testing)
 */
export async function clearAllFeedback(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.FEEDBACK_LOG);
  await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_UPLOADS);
}

export default {
  recordInsightFeedback,
  getAllFeedback,
  getFeedbackStats,
  getPendingUploads,
  prepareForAnonymousUpload,
  uploadPendingFeedback,
  getFeedbackSettings,
  updateFeedbackSettings,
  setUploadConsent,
  exportFeedbackAsTrainingData,
  getFeedbackLabel,
  getFeedbackEmoji,
  getAllFeedbackOptions,
  clearAllFeedback,
};
