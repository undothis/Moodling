/**
 * Speech Analysis Service
 *
 * Analyzes voice patterns for:
 * 1. Voice identity verification (is this the registered user?)
 * 2. Speech pattern detection (slurring, stuttering, pace changes)
 * 3. Baseline learning (what's "normal" for this person)
 * 4. Anomaly detection (something seems different today)
 *
 * Privacy:
 * - Voice prints stored on-device only
 * - Anonymous aggregated data sent to server for model training
 * - User can disable entirely in settings
 *
 * Following Mood Leaf Ethics:
 * - User controls all biometric data
 * - Transparent about what's collected
 * - Triage approach for alerts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  VOICE_PRINT: 'moodleaf_voice_print',
  SPEECH_BASELINE: 'moodleaf_speech_baseline',
  SPEECH_HISTORY: 'moodleaf_speech_history',
  SPEECH_SETTINGS: 'moodleaf_speech_settings',
};

// ============================================
// TYPES
// ============================================

/**
 * Voice print - unique identifier for the user's voice
 * Stored on-device only
 */
export interface VoicePrint {
  id: string;
  createdAt: string;
  updatedAt: string;
  // Feature vectors (simplified - real implementation would use ML embeddings)
  pitchProfile: number[];
  toneProfile: number[];
  rhythmProfile: number[];
  enrollmentSamples: number; // How many samples used to create this print
}

/**
 * Speech baseline - what's "normal" for this user
 */
export interface SpeechBaseline {
  userId: string;
  updatedAt: string;
  // Normal ranges for this person
  averagePace: number; // words per minute
  paceVariance: number;
  averagePitch: number;
  pitchVariance: number;
  pausePatterns: {
    averagePauseDuration: number;
    pauseFrequency: number; // pauses per sentence
  };
  // Speech characteristics
  hasNaturalStutter: boolean;
  naturalStutterFrequency: number;
  hasAccent: boolean;
  accentType?: string;
  // Confidence in baseline (0-1)
  confidence: number;
  sampleCount: number;
}

/**
 * Speech analysis result for a single recording
 */
export interface SpeechAnalysisResult {
  timestamp: string;
  // Identity verification
  identityMatch: {
    isMatch: boolean;
    confidence: number; // 0-1
    reason?: string; // "voice_mismatch", "insufficient_audio", etc.
  };
  // Speech patterns
  patterns: {
    pace: number; // words per minute
    paceDeviation: number; // deviation from baseline
    pitch: number;
    pitchDeviation: number;
    clarity: number; // 0-1, how clear the speech is
    // Detected anomalies
    slurring: {
      detected: boolean;
      severity: 'none' | 'mild' | 'moderate' | 'severe';
      confidence: number;
    };
    stuttering: {
      detected: boolean;
      frequency: number; // stutters per minute
      isAboveBaseline: boolean;
    };
    tremor: {
      detected: boolean;
      severity: 'none' | 'mild' | 'moderate' | 'severe';
    };
    breathlessness: {
      detected: boolean;
      severity: 'none' | 'mild' | 'moderate' | 'severe';
    };
  };
  // Overall assessment
  assessment: {
    status: 'normal' | 'minor_change' | 'notable_change' | 'concerning';
    anomalyScore: number; // 0-1, how different from baseline
    possibleCauses: string[]; // ["fatigue", "stress", "medication", "illness"]
    requiresAttention: boolean;
  };
  // Raw audio metadata (for debugging, not stored long-term)
  metadata: {
    durationSeconds: number;
    sampleRate: number;
    wordCount: number;
  };
}

/**
 * Speech settings - user preferences
 */
export interface SpeechSettings {
  enabled: boolean;
  // What to monitor
  monitorIdentity: boolean; // Verify it's the right person
  monitorPatterns: boolean; // Detect speech anomalies
  // When to monitor
  monitorDuringVoiceChat: boolean;
  continuousMonitoring: boolean; // Background monitoring
  // Alert settings
  alertOnIdentityMismatch: boolean;
  alertOnSpeechAnomaly: boolean;
  anomalyThreshold: 'low' | 'medium' | 'high'; // Sensitivity
  // Privacy
  allowAnonymousDataCollection: boolean; // Send anonymous data for training
  // Emergency contact
  notifyEmergencyContact: boolean;
  emergencyContactDelay: number; // Minutes before notifying contact
}

/**
 * Anonymous data package for server (no PII)
 */
export interface AnonymousSpeechData {
  sessionId: string; // Random, not linked to user
  timestamp: string;
  // Aggregated metrics only
  patterns: {
    paceCategory: 'slow' | 'normal' | 'fast';
    clarityCategory: 'low' | 'medium' | 'high';
    anomalyType?: string;
    anomalySeverity?: string;
  };
  // Device info for model training
  deviceType: string;
  osVersion: string;
  appVersion: string;
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_SETTINGS: SpeechSettings = {
  enabled: false, // Opt-in by default
  monitorIdentity: true,
  monitorPatterns: true,
  monitorDuringVoiceChat: true,
  continuousMonitoring: false,
  alertOnIdentityMismatch: true,
  alertOnSpeechAnomaly: true,
  anomalyThreshold: 'medium',
  allowAnonymousDataCollection: false,
  notifyEmergencyContact: false,
  emergencyContactDelay: 30, // 30 minutes
};

// ============================================
// SETTINGS MANAGEMENT
// ============================================

/**
 * Get speech analysis settings
 */
export async function getSpeechSettings(): Promise<SpeechSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SPEECH_SETTINGS);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load speech settings:', error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Update speech analysis settings
 */
export async function updateSpeechSettings(
  updates: Partial<SpeechSettings>
): Promise<SpeechSettings> {
  const current = await getSpeechSettings();
  const updated = { ...current, ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.SPEECH_SETTINGS, JSON.stringify(updated));
  return updated;
}

/**
 * Check if speech analysis is enabled
 */
export async function isSpeechAnalysisEnabled(): Promise<boolean> {
  const settings = await getSpeechSettings();
  return settings.enabled;
}

// ============================================
// VOICE PRINT MANAGEMENT
// ============================================

/**
 * Check if user has enrolled their voice
 */
export async function hasVoicePrint(): Promise<boolean> {
  try {
    const print = await AsyncStorage.getItem(STORAGE_KEYS.VOICE_PRINT);
    return print !== null;
  } catch {
    return false;
  }
}

/**
 * Get the stored voice print
 */
export async function getVoicePrint(): Promise<VoicePrint | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.VOICE_PRINT);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load voice print:', error);
  }
  return null;
}

/**
 * Enroll voice print from audio samples
 * In production, this would use ML to extract voice embeddings
 */
export async function enrollVoicePrint(audioSamples: ArrayBuffer[]): Promise<VoicePrint> {
  // TODO: Implement actual voice print extraction using ML
  // This is a placeholder that simulates the process

  const voicePrint: VoicePrint = {
    id: `vp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Placeholder feature vectors
    pitchProfile: generatePlaceholderFeatures(32),
    toneProfile: generatePlaceholderFeatures(32),
    rhythmProfile: generatePlaceholderFeatures(16),
    enrollmentSamples: audioSamples.length,
  };

  await AsyncStorage.setItem(STORAGE_KEYS.VOICE_PRINT, JSON.stringify(voicePrint));

  // Initialize baseline
  await initializeSpeechBaseline();

  return voicePrint;
}

/**
 * Delete voice print (user wants to re-enroll or disable)
 */
export async function deleteVoicePrint(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.VOICE_PRINT);
  await AsyncStorage.removeItem(STORAGE_KEYS.SPEECH_BASELINE);
  await AsyncStorage.removeItem(STORAGE_KEYS.SPEECH_HISTORY);
}

// ============================================
// SPEECH BASELINE
// ============================================

/**
 * Initialize speech baseline with default values
 */
async function initializeSpeechBaseline(): Promise<SpeechBaseline> {
  const baseline: SpeechBaseline = {
    userId: 'local',
    updatedAt: new Date().toISOString(),
    averagePace: 150, // Average speaking pace
    paceVariance: 20,
    averagePitch: 200,
    pitchVariance: 30,
    pausePatterns: {
      averagePauseDuration: 0.5,
      pauseFrequency: 2,
    },
    hasNaturalStutter: false,
    naturalStutterFrequency: 0,
    hasAccent: false,
    confidence: 0.1, // Low confidence until we gather more data
    sampleCount: 0,
  };

  await AsyncStorage.setItem(STORAGE_KEYS.SPEECH_BASELINE, JSON.stringify(baseline));
  return baseline;
}

/**
 * Get speech baseline
 */
export async function getSpeechBaseline(): Promise<SpeechBaseline | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SPEECH_BASELINE);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load speech baseline:', error);
  }
  return null;
}

/**
 * Update baseline with new speech sample
 * Uses exponential moving average to adapt over time
 */
export async function updateSpeechBaseline(
  analysisResult: SpeechAnalysisResult
): Promise<SpeechBaseline> {
  let baseline = await getSpeechBaseline();

  if (!baseline) {
    baseline = await initializeSpeechBaseline();
  }

  // Only update baseline with "normal" samples
  if (analysisResult.assessment.status === 'normal') {
    const alpha = 0.1; // Learning rate

    baseline.averagePace = exponentialAverage(
      baseline.averagePace,
      analysisResult.patterns.pace,
      alpha
    );
    baseline.averagePitch = exponentialAverage(
      baseline.averagePitch,
      analysisResult.patterns.pitch,
      alpha
    );
    baseline.sampleCount++;
    baseline.confidence = Math.min(1, baseline.sampleCount / 50); // Full confidence after 50 samples
    baseline.updatedAt = new Date().toISOString();

    await AsyncStorage.setItem(STORAGE_KEYS.SPEECH_BASELINE, JSON.stringify(baseline));
  }

  return baseline;
}

// ============================================
// SPEECH ANALYSIS
// ============================================

/**
 * Analyze speech from audio buffer
 * This is the main entry point for speech analysis
 */
export async function analyzeSpeech(
  audioBuffer: ArrayBuffer,
  options?: { skipIdentityCheck?: boolean }
): Promise<SpeechAnalysisResult> {
  const settings = await getSpeechSettings();

  if (!settings.enabled) {
    throw new Error('Speech analysis is disabled');
  }

  // Get baseline for comparison
  const baseline = await getSpeechBaseline();
  const voicePrint = await getVoicePrint();

  // TODO: Implement actual audio analysis using ML
  // This is a placeholder that simulates the analysis

  const result = await simulateSpeechAnalysis(audioBuffer, baseline, voicePrint, options);

  // Update baseline if this is a normal sample
  if (result.assessment.status === 'normal') {
    await updateSpeechBaseline(result);
  }

  // Store in history
  await addToSpeechHistory(result);

  // Check if we need to send anonymous data
  if (settings.allowAnonymousDataCollection) {
    await sendAnonymousData(result);
  }

  return result;
}

/**
 * Verify speaker identity from audio
 */
export async function verifyIdentity(audioBuffer: ArrayBuffer): Promise<{
  isMatch: boolean;
  confidence: number;
  reason?: string;
}> {
  const voicePrint = await getVoicePrint();

  if (!voicePrint) {
    return {
      isMatch: false,
      confidence: 0,
      reason: 'no_voice_print_enrolled',
    };
  }

  // TODO: Implement actual voice matching using ML
  // This is a placeholder

  // Simulate voice matching
  const confidence = 0.85 + Math.random() * 0.15; // 85-100%

  return {
    isMatch: confidence > 0.7,
    confidence,
  };
}

// ============================================
// SPEECH HISTORY
// ============================================

/**
 * Add analysis result to history
 */
async function addToSpeechHistory(result: SpeechAnalysisResult): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SPEECH_HISTORY);
    let history: SpeechAnalysisResult[] = stored ? JSON.parse(stored) : [];

    // Keep last 100 entries
    history.push(result);
    if (history.length > 100) {
      history = history.slice(-100);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.SPEECH_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save speech history:', error);
  }
}

/**
 * Get speech analysis history
 */
export async function getSpeechHistory(limit = 20): Promise<SpeechAnalysisResult[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SPEECH_HISTORY);
    if (stored) {
      const history: SpeechAnalysisResult[] = JSON.parse(stored);
      return history.slice(-limit);
    }
  } catch (error) {
    console.error('Failed to load speech history:', error);
  }
  return [];
}

/**
 * Get speech trends over time
 */
export async function getSpeechTrends(): Promise<{
  recentAnomalies: number;
  averageClarity: number;
  paceChange: 'increasing' | 'stable' | 'decreasing';
  concernLevel: 'none' | 'low' | 'medium' | 'high';
}> {
  const history = await getSpeechHistory(50);

  if (history.length < 5) {
    return {
      recentAnomalies: 0,
      averageClarity: 1,
      paceChange: 'stable',
      concernLevel: 'none',
    };
  }

  const recent = history.slice(-10);
  const older = history.slice(-50, -10);

  const recentAnomalies = recent.filter(
    r => r.assessment.status === 'notable_change' || r.assessment.status === 'concerning'
  ).length;

  const avgClarity = recent.reduce((sum, r) => sum + r.patterns.clarity, 0) / recent.length;

  const recentPace = recent.reduce((sum, r) => sum + r.patterns.pace, 0) / recent.length;
  const olderPace = older.length > 0
    ? older.reduce((sum, r) => sum + r.patterns.pace, 0) / older.length
    : recentPace;

  let paceChange: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (recentPace > olderPace * 1.1) paceChange = 'increasing';
  if (recentPace < olderPace * 0.9) paceChange = 'decreasing';

  let concernLevel: 'none' | 'low' | 'medium' | 'high' = 'none';
  if (recentAnomalies >= 1) concernLevel = 'low';
  if (recentAnomalies >= 3) concernLevel = 'medium';
  if (recentAnomalies >= 5) concernLevel = 'high';

  return {
    recentAnomalies,
    averageClarity: avgClarity,
    paceChange,
    concernLevel,
  };
}

// ============================================
// ANONYMOUS DATA COLLECTION
// ============================================

/**
 * Send anonymous data to server for model training
 * No PII is included - only aggregated metrics
 */
async function sendAnonymousData(result: SpeechAnalysisResult): Promise<void> {
  const data: AnonymousSpeechData = {
    sessionId: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    patterns: {
      paceCategory: result.patterns.pace < 120 ? 'slow' : result.patterns.pace > 180 ? 'fast' : 'normal',
      clarityCategory: result.patterns.clarity < 0.5 ? 'low' : result.patterns.clarity > 0.8 ? 'high' : 'medium',
      anomalyType: result.assessment.status !== 'normal' ? determineAnomalyType(result) : undefined,
      anomalySeverity: result.assessment.status !== 'normal' ? result.assessment.status : undefined,
    },
    deviceType: 'mobile', // Would get from device info
    osVersion: 'unknown', // Would get from device info
    appVersion: '1.0.0', // Would get from app config
  };

  // TODO: Send to server
  // await fetch('https://api.moodleaf.app/v1/anonymous/speech', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data),
  // });

  console.log('Anonymous speech data (would be sent):', data);
}

function determineAnomalyType(result: SpeechAnalysisResult): string {
  if (result.patterns.slurring.detected) return 'slurring';
  if (result.patterns.stuttering.isAboveBaseline) return 'stuttering';
  if (result.patterns.tremor.detected) return 'tremor';
  if (result.patterns.breathlessness.detected) return 'breathlessness';
  return 'general';
}

// ============================================
// CONTEXT FOR LLM
// ============================================

/**
 * Get speech context for the AI coach
 */
export async function getSpeechContextForLLM(): Promise<string> {
  const settings = await getSpeechSettings();

  if (!settings.enabled || !settings.monitorPatterns) {
    return '';
  }

  const history = await getSpeechHistory(5);
  const trends = await getSpeechTrends();

  if (history.length === 0) {
    return '';
  }

  const latest = history[history.length - 1];
  const parts: string[] = ['SPEECH PATTERNS:'];

  // Recent status
  if (latest.assessment.status !== 'normal') {
    parts.push(`- Recent speech shows ${latest.assessment.status.replace('_', ' ')}`);
    if (latest.assessment.possibleCauses.length > 0) {
      parts.push(`- Possible causes: ${latest.assessment.possibleCauses.join(', ')}`);
    }
  }

  // Trends
  if (trends.concernLevel !== 'none') {
    parts.push(`- Recent concern level: ${trends.concernLevel}`);
  }
  if (trends.paceChange !== 'stable') {
    parts.push(`- Speaking pace is ${trends.paceChange}`);
  }

  // Only return if we have something meaningful
  if (parts.length === 1) {
    return '';
  }

  return parts.join('\n');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generatePlaceholderFeatures(length: number): number[] {
  return Array.from({ length }, () => Math.random());
}

function exponentialAverage(current: number, newValue: number, alpha: number): number {
  return alpha * newValue + (1 - alpha) * current;
}

/**
 * Simulate speech analysis (placeholder for real ML implementation)
 */
async function simulateSpeechAnalysis(
  audioBuffer: ArrayBuffer,
  baseline: SpeechBaseline | null,
  voicePrint: VoicePrint | null,
  options?: { skipIdentityCheck?: boolean }
): Promise<SpeechAnalysisResult> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 100));

  // Generate simulated results
  const pace = baseline ? baseline.averagePace + (Math.random() - 0.5) * 20 : 150;
  const pitch = baseline ? baseline.averagePitch + (Math.random() - 0.5) * 30 : 200;
  const clarity = 0.7 + Math.random() * 0.3;

  // Random chance of detecting issues (very low in simulation)
  const hasSlurring = Math.random() < 0.02;
  const hasStuttering = Math.random() < 0.03;
  const hasTremor = Math.random() < 0.01;
  const hasBreathlessness = Math.random() < 0.02;

  const anomalyScore = (hasSlurring ? 0.3 : 0) + (hasStuttering ? 0.2 : 0) +
    (hasTremor ? 0.3 : 0) + (hasBreathlessness ? 0.2 : 0);

  let status: SpeechAnalysisResult['assessment']['status'] = 'normal';
  if (anomalyScore > 0.1) status = 'minor_change';
  if (anomalyScore > 0.3) status = 'notable_change';
  if (anomalyScore > 0.5) status = 'concerning';

  const possibleCauses: string[] = [];
  if (hasSlurring) possibleCauses.push('fatigue', 'medication');
  if (hasStuttering) possibleCauses.push('stress', 'anxiety');
  if (hasTremor) possibleCauses.push('nervousness', 'cold');
  if (hasBreathlessness) possibleCauses.push('exercise', 'anxiety');

  return {
    timestamp: new Date().toISOString(),
    identityMatch: options?.skipIdentityCheck || !voicePrint
      ? { isMatch: true, confidence: 1 }
      : { isMatch: true, confidence: 0.9 + Math.random() * 0.1 },
    patterns: {
      pace,
      paceDeviation: baseline ? Math.abs(pace - baseline.averagePace) / baseline.averagePace : 0,
      pitch,
      pitchDeviation: baseline ? Math.abs(pitch - baseline.averagePitch) / baseline.averagePitch : 0,
      clarity,
      slurring: {
        detected: hasSlurring,
        severity: hasSlurring ? 'mild' : 'none',
        confidence: 0.8,
      },
      stuttering: {
        detected: hasStuttering,
        frequency: hasStuttering ? 2 : 0,
        isAboveBaseline: hasStuttering,
      },
      tremor: {
        detected: hasTremor,
        severity: hasTremor ? 'mild' : 'none',
      },
      breathlessness: {
        detected: hasBreathlessness,
        severity: hasBreathlessness ? 'mild' : 'none',
      },
    },
    assessment: {
      status,
      anomalyScore,
      possibleCauses,
      requiresAttention: status === 'concerning',
    },
    metadata: {
      durationSeconds: audioBuffer.byteLength / 32000, // Approximate
      sampleRate: 16000,
      wordCount: Math.floor(pace * (audioBuffer.byteLength / 32000) / 60),
    },
  };
}
