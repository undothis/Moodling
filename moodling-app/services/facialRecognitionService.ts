/**
 * Facial Recognition Service
 *
 * Analyzes facial data for:
 * 1. Face identity verification (is this the registered user?)
 * 2. Expression/emotion detection
 * 3. Baseline learning (what's "normal" for this person)
 * 4. Anomaly detection (signs of distress, fatigue, etc.)
 *
 * Privacy:
 * - Face prints stored on-device only
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
  FACE_PRINT: 'moodleaf_face_print',
  FACE_BASELINE: 'moodleaf_face_baseline',
  FACE_HISTORY: 'moodleaf_face_history',
  FACE_SETTINGS: 'moodleaf_face_settings',
};

// ============================================
// TYPES
// ============================================

/**
 * Face print - unique identifier for the user's face
 * Stored on-device only
 */
export interface FacePrint {
  id: string;
  createdAt: string;
  updatedAt: string;
  // Feature vectors (simplified - real implementation would use ML embeddings)
  faceEmbedding: number[];
  landmarkPositions: number[];
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'oblong';
  enrollmentImages: number; // How many images used to create this print
}

/**
 * Face baseline - what's "normal" for this user
 */
export interface FaceBaseline {
  userId: string;
  updatedAt: string;
  // Normal appearance
  skinToneRange: { min: number; max: number };
  eyeOpenness: { left: number; right: number };
  defaultExpression: 'neutral' | 'slightly_positive' | 'slightly_negative';
  // Facial characteristics
  wearGlasses: boolean;
  hasBeard: boolean;
  hasMakeup: boolean;
  // Physical markers (not for judgment, for detecting change)
  darkCirclesNormal: 'none' | 'mild' | 'moderate';
  skinComplexionNormal: 'clear' | 'some_blemishes' | 'frequent_blemishes';
  // Confidence in baseline
  confidence: number;
  sampleCount: number;
}

/**
 * Detected emotion from face
 */
export interface DetectedEmotion {
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'fearful' | 'disgusted';
  confidence: number;
  intensity: number; // 0-1, how strong the emotion appears
}

/**
 * Face analysis result for a single capture
 */
export interface FaceAnalysisResult {
  timestamp: string;
  // Identity verification
  identityMatch: {
    isMatch: boolean;
    confidence: number; // 0-1
    reason?: string; // "face_mismatch", "no_face_detected", etc.
  };
  // Facial analysis
  analysis: {
    // Detected faces
    facesDetected: number;
    primaryFace: boolean; // Is the main face detected
    // Emotion
    emotions: DetectedEmotion[];
    dominantEmotion: DetectedEmotion;
    // Physical indicators
    eyeContact: boolean;
    eyeOpenness: { left: number; right: number }; // 0-1
    blinking: {
      rate: number; // blinks per minute
      isNormal: boolean;
    };
    // Health indicators (non-diagnostic)
    indicators: {
      fatigue: {
        detected: boolean;
        level: 'none' | 'mild' | 'moderate' | 'severe';
        signs: string[]; // ["droopy_eyelids", "dark_circles"]
      };
      stress: {
        detected: boolean;
        level: 'none' | 'mild' | 'moderate' | 'severe';
        signs: string[]; // ["tense_jaw", "furrowed_brow"]
      };
      pallor: {
        detected: boolean;
        deviation: number; // How much paler than baseline
      };
      asymmetry: {
        detected: boolean;
        type?: string; // "drooping_left", "drooping_right"
        urgency: 'none' | 'monitor' | 'urgent'; // Urgent could indicate stroke
      };
    };
  };
  // Overall assessment
  assessment: {
    status: 'normal' | 'minor_change' | 'notable_change' | 'concerning';
    anomalyScore: number; // 0-1
    possibleCauses: string[];
    requiresAttention: boolean;
    urgentAttention: boolean; // For things like facial asymmetry
  };
  // Metadata
  metadata: {
    imageQuality: number; // 0-1
    lightingCondition: 'good' | 'low' | 'harsh';
    faceAngle: { pitch: number; yaw: number; roll: number };
  };
}

/**
 * Face settings - user preferences
 */
export interface FaceSettings {
  enabled: boolean;
  // What to monitor
  monitorIdentity: boolean; // Verify it's the right person
  monitorEmotions: boolean; // Detect emotions
  monitorHealth: boolean; // Detect fatigue, stress signs
  // When to monitor
  monitorOnAppOpen: boolean;
  continuousMonitoring: boolean; // Background monitoring
  monitorFrequency: number; // Minutes between checks if continuous
  // Alert settings
  alertOnIdentityMismatch: boolean;
  alertOnEmotionalDistress: boolean;
  alertOnHealthConcern: boolean;
  alertOnUrgent: boolean; // Always alert on urgent (like asymmetry)
  healthThreshold: 'low' | 'medium' | 'high'; // Sensitivity
  // Privacy
  allowAnonymousDataCollection: boolean;
  // Emergency contact
  notifyEmergencyContact: boolean;
  emergencyContactDelay: number; // Minutes before notifying
  urgentBypassDelay: boolean; // For urgent issues, notify immediately
}

/**
 * Anonymous data package for server (no PII)
 */
export interface AnonymousFaceData {
  sessionId: string;
  timestamp: string;
  // Aggregated metrics only - NO face data
  metrics: {
    dominantEmotionCategory: string;
    fatigueLevel: string;
    stressLevel: string;
    lightingCondition: string;
  };
  deviceType: string;
  osVersion: string;
  appVersion: string;
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_SETTINGS: FaceSettings = {
  enabled: false, // Opt-in by default
  monitorIdentity: true,
  monitorEmotions: true,
  monitorHealth: true,
  monitorOnAppOpen: true,
  continuousMonitoring: false,
  monitorFrequency: 30, // Every 30 minutes
  alertOnIdentityMismatch: true,
  alertOnEmotionalDistress: true,
  alertOnHealthConcern: true,
  alertOnUrgent: true,
  healthThreshold: 'medium',
  allowAnonymousDataCollection: false,
  notifyEmergencyContact: false,
  emergencyContactDelay: 30,
  urgentBypassDelay: true, // Notify immediately for urgent
};

// ============================================
// SETTINGS MANAGEMENT
// ============================================

/**
 * Get face recognition settings
 */
export async function getFaceSettings(): Promise<FaceSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.FACE_SETTINGS);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load face settings:', error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Update face recognition settings
 */
export async function updateFaceSettings(
  updates: Partial<FaceSettings>
): Promise<FaceSettings> {
  const current = await getFaceSettings();
  const updated = { ...current, ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.FACE_SETTINGS, JSON.stringify(updated));
  return updated;
}

/**
 * Check if face recognition is enabled
 */
export async function isFaceRecognitionEnabled(): Promise<boolean> {
  const settings = await getFaceSettings();
  return settings.enabled;
}

// ============================================
// FACE PRINT MANAGEMENT
// ============================================

/**
 * Check if user has enrolled their face
 */
export async function hasFacePrint(): Promise<boolean> {
  try {
    const print = await AsyncStorage.getItem(STORAGE_KEYS.FACE_PRINT);
    return print !== null;
  } catch {
    return false;
  }
}

/**
 * Get the stored face print
 */
export async function getFacePrint(): Promise<FacePrint | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.FACE_PRINT);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load face print:', error);
  }
  return null;
}

/**
 * Enroll face print from images
 * In production, this would use ML to extract face embeddings
 */
export async function enrollFacePrint(images: ArrayBuffer[]): Promise<FacePrint> {
  // TODO: Implement actual face print extraction using ML
  // This is a placeholder that simulates the process

  const facePrint: FacePrint = {
    id: `fp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Placeholder feature vectors
    faceEmbedding: generatePlaceholderFeatures(128),
    landmarkPositions: generatePlaceholderFeatures(68 * 2), // 68 landmarks, x and y
    faceShape: 'oval',
    enrollmentImages: images.length,
  };

  await AsyncStorage.setItem(STORAGE_KEYS.FACE_PRINT, JSON.stringify(facePrint));

  // Initialize baseline
  await initializeFaceBaseline();

  return facePrint;
}

/**
 * Delete face print
 */
export async function deleteFacePrint(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.FACE_PRINT);
  await AsyncStorage.removeItem(STORAGE_KEYS.FACE_BASELINE);
  await AsyncStorage.removeItem(STORAGE_KEYS.FACE_HISTORY);
}

// ============================================
// FACE BASELINE
// ============================================

/**
 * Initialize face baseline with default values
 */
async function initializeFaceBaseline(): Promise<FaceBaseline> {
  const baseline: FaceBaseline = {
    userId: 'local',
    updatedAt: new Date().toISOString(),
    skinToneRange: { min: 0.4, max: 0.6 },
    eyeOpenness: { left: 0.8, right: 0.8 },
    defaultExpression: 'neutral',
    wearGlasses: false,
    hasBeard: false,
    hasMakeup: false,
    darkCirclesNormal: 'none',
    skinComplexionNormal: 'clear',
    confidence: 0.1,
    sampleCount: 0,
  };

  await AsyncStorage.setItem(STORAGE_KEYS.FACE_BASELINE, JSON.stringify(baseline));
  return baseline;
}

/**
 * Get face baseline
 */
export async function getFaceBaseline(): Promise<FaceBaseline | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.FACE_BASELINE);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load face baseline:', error);
  }
  return null;
}

/**
 * Update baseline with new face sample
 */
export async function updateFaceBaseline(
  analysisResult: FaceAnalysisResult
): Promise<FaceBaseline> {
  let baseline = await getFaceBaseline();

  if (!baseline) {
    baseline = await initializeFaceBaseline();
  }

  // Only update baseline with "normal" samples
  if (analysisResult.assessment.status === 'normal') {
    const alpha = 0.1; // Learning rate

    baseline.eyeOpenness.left = exponentialAverage(
      baseline.eyeOpenness.left,
      analysisResult.analysis.eyeOpenness.left,
      alpha
    );
    baseline.eyeOpenness.right = exponentialAverage(
      baseline.eyeOpenness.right,
      analysisResult.analysis.eyeOpenness.right,
      alpha
    );

    baseline.sampleCount++;
    baseline.confidence = Math.min(1, baseline.sampleCount / 30); // Full confidence after 30 samples
    baseline.updatedAt = new Date().toISOString();

    await AsyncStorage.setItem(STORAGE_KEYS.FACE_BASELINE, JSON.stringify(baseline));
  }

  return baseline;
}

// ============================================
// FACE ANALYSIS
// ============================================

/**
 * Analyze face from image buffer
 * This is the main entry point for face analysis
 */
export async function analyzeFace(
  imageBuffer: ArrayBuffer,
  options?: { skipIdentityCheck?: boolean }
): Promise<FaceAnalysisResult> {
  const settings = await getFaceSettings();

  if (!settings.enabled) {
    throw new Error('Face recognition is disabled');
  }

  // Get baseline for comparison
  const baseline = await getFaceBaseline();
  const facePrint = await getFacePrint();

  // TODO: Implement actual face analysis using ML
  // This is a placeholder that simulates the analysis

  const result = await simulateFaceAnalysis(imageBuffer, baseline, facePrint, options);

  // Update baseline if this is a normal sample
  if (result.assessment.status === 'normal') {
    await updateFaceBaseline(result);
  }

  // Store in history
  await addToFaceHistory(result);

  // Check if we need to send anonymous data
  if (settings.allowAnonymousDataCollection) {
    await sendAnonymousData(result);
  }

  return result;
}

/**
 * Verify face identity from image
 */
export async function verifyFaceIdentity(imageBuffer: ArrayBuffer): Promise<{
  isMatch: boolean;
  confidence: number;
  reason?: string;
}> {
  const facePrint = await getFacePrint();

  if (!facePrint) {
    return {
      isMatch: false,
      confidence: 0,
      reason: 'no_face_print_enrolled',
    };
  }

  // TODO: Implement actual face matching using ML
  // This is a placeholder

  // Simulate face matching
  const confidence = 0.85 + Math.random() * 0.15; // 85-100%

  return {
    isMatch: confidence > 0.7,
    confidence,
  };
}

/**
 * Quick emotion detection (lighter weight than full analysis)
 */
export async function detectEmotion(imageBuffer: ArrayBuffer): Promise<DetectedEmotion[]> {
  // TODO: Implement actual emotion detection
  // This is a placeholder

  const emotions: DetectedEmotion[] = [
    { emotion: 'neutral', confidence: 0.7, intensity: 0.5 },
    { emotion: 'happy', confidence: 0.2, intensity: 0.3 },
    { emotion: 'sad', confidence: 0.1, intensity: 0.2 },
  ];

  return emotions.sort((a, b) => b.confidence - a.confidence);
}

// ============================================
// FACE HISTORY
// ============================================

/**
 * Add analysis result to history
 */
async function addToFaceHistory(result: FaceAnalysisResult): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.FACE_HISTORY);
    let history: FaceAnalysisResult[] = stored ? JSON.parse(stored) : [];

    // Keep last 100 entries
    history.push(result);
    if (history.length > 100) {
      history = history.slice(-100);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.FACE_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save face history:', error);
  }
}

/**
 * Get face analysis history
 */
export async function getFaceHistory(limit = 20): Promise<FaceAnalysisResult[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.FACE_HISTORY);
    if (stored) {
      const history: FaceAnalysisResult[] = JSON.parse(stored);
      return history.slice(-limit);
    }
  } catch (error) {
    console.error('Failed to load face history:', error);
  }
  return [];
}

/**
 * Get face analysis trends
 */
export async function getFaceTrends(): Promise<{
  dominantMood: string;
  fatigueFrequency: number; // How often fatigue detected in last 10 analyses
  stressFrequency: number;
  emotionalVariability: 'stable' | 'moderate' | 'variable';
  concernLevel: 'none' | 'low' | 'medium' | 'high';
}> {
  const history = await getFaceHistory(50);

  if (history.length < 5) {
    return {
      dominantMood: 'unknown',
      fatigueFrequency: 0,
      stressFrequency: 0,
      emotionalVariability: 'stable',
      concernLevel: 'none',
    };
  }

  const recent = history.slice(-10);

  // Count dominant emotions
  const emotionCounts: Record<string, number> = {};
  recent.forEach(r => {
    const emotion = r.analysis.dominantEmotion.emotion;
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
  });

  const dominantMood = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

  // Count fatigue and stress
  const fatigueCount = recent.filter(r => r.analysis.indicators.fatigue.detected).length;
  const stressCount = recent.filter(r => r.analysis.indicators.stress.detected).length;

  // Calculate emotional variability
  const uniqueEmotions = new Set(recent.map(r => r.analysis.dominantEmotion.emotion)).size;
  let emotionalVariability: 'stable' | 'moderate' | 'variable' = 'stable';
  if (uniqueEmotions >= 3) emotionalVariability = 'moderate';
  if (uniqueEmotions >= 5) emotionalVariability = 'variable';

  // Determine concern level
  const concerningResults = recent.filter(
    r => r.assessment.status === 'notable_change' || r.assessment.status === 'concerning'
  ).length;

  let concernLevel: 'none' | 'low' | 'medium' | 'high' = 'none';
  if (concerningResults >= 1 || fatigueCount >= 3) concernLevel = 'low';
  if (concerningResults >= 3 || stressCount >= 5) concernLevel = 'medium';
  if (concerningResults >= 5 || recent.some(r => r.assessment.urgentAttention)) concernLevel = 'high';

  return {
    dominantMood,
    fatigueFrequency: fatigueCount / recent.length,
    stressFrequency: stressCount / recent.length,
    emotionalVariability,
    concernLevel,
  };
}

// ============================================
// ANONYMOUS DATA COLLECTION
// ============================================

/**
 * Send anonymous data to server for model training
 * No PII or face data is included
 */
async function sendAnonymousData(result: FaceAnalysisResult): Promise<void> {
  const data: AnonymousFaceData = {
    sessionId: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    metrics: {
      dominantEmotionCategory: result.analysis.dominantEmotion.emotion,
      fatigueLevel: result.analysis.indicators.fatigue.level,
      stressLevel: result.analysis.indicators.stress.level,
      lightingCondition: result.metadata.lightingCondition,
    },
    deviceType: 'mobile',
    osVersion: 'unknown',
    appVersion: '1.0.0',
  };

  // TODO: Send to server
  // await fetch('https://api.moodleaf.app/v1/anonymous/face', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data),
  // });

  console.log('Anonymous face data (would be sent):', data);
}

// ============================================
// CONTEXT FOR LLM
// ============================================

/**
 * Get face context for the AI coach
 */
export async function getFaceContextForLLM(): Promise<string> {
  const settings = await getFaceSettings();

  if (!settings.enabled) {
    return '';
  }

  const history = await getFaceHistory(5);
  const trends = await getFaceTrends();

  if (history.length === 0) {
    return '';
  }

  const latest = history[history.length - 1];
  const parts: string[] = ['FACIAL OBSERVATIONS:'];

  // Current emotion
  if (settings.monitorEmotions) {
    const emotion = latest.analysis.dominantEmotion;
    if (emotion.emotion !== 'neutral' && emotion.confidence > 0.5) {
      parts.push(`- Currently appears ${emotion.emotion} (${Math.round(emotion.confidence * 100)}% confidence)`);
    }
  }

  // Health indicators
  if (settings.monitorHealth) {
    if (latest.analysis.indicators.fatigue.detected) {
      parts.push(`- Signs of fatigue detected (${latest.analysis.indicators.fatigue.level})`);
    }
    if (latest.analysis.indicators.stress.detected) {
      parts.push(`- Signs of stress detected (${latest.analysis.indicators.stress.level})`);
    }
  }

  // Trends
  if (trends.concernLevel !== 'none') {
    parts.push(`- Recent concern level: ${trends.concernLevel}`);
  }
  if (trends.fatigueFrequency > 0.3) {
    parts.push(`- Fatigue detected frequently (${Math.round(trends.fatigueFrequency * 100)}% of recent analyses)`);
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
 * Simulate face analysis (placeholder for real ML implementation)
 */
async function simulateFaceAnalysis(
  imageBuffer: ArrayBuffer,
  baseline: FaceBaseline | null,
  facePrint: FacePrint | null,
  options?: { skipIdentityCheck?: boolean }
): Promise<FaceAnalysisResult> {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 150));

  // Generate simulated results
  const eyeLeft = baseline ? baseline.eyeOpenness.left + (Math.random() - 0.5) * 0.2 : 0.8;
  const eyeRight = baseline ? baseline.eyeOpenness.right + (Math.random() - 0.5) * 0.2 : 0.8;

  // Random emotions
  const emotions: DetectedEmotion[] = [
    { emotion: 'neutral', confidence: 0.5 + Math.random() * 0.3, intensity: 0.5 },
    { emotion: 'happy', confidence: Math.random() * 0.3, intensity: Math.random() * 0.5 },
    { emotion: 'sad', confidence: Math.random() * 0.2, intensity: Math.random() * 0.3 },
  ];

  // Normalize confidences
  const totalConfidence = emotions.reduce((sum, e) => sum + e.confidence, 0);
  emotions.forEach(e => { e.confidence = e.confidence / totalConfidence; });
  emotions.sort((a, b) => b.confidence - a.confidence);

  // Random chance of detecting issues
  const hasFatigue = Math.random() < 0.1;
  const hasStress = Math.random() < 0.08;
  const hasAsymmetry = Math.random() < 0.005; // Very rare

  const anomalyScore = (hasFatigue ? 0.2 : 0) + (hasStress ? 0.2 : 0) + (hasAsymmetry ? 0.5 : 0);

  let status: FaceAnalysisResult['assessment']['status'] = 'normal';
  if (anomalyScore > 0.1) status = 'minor_change';
  if (anomalyScore > 0.3) status = 'notable_change';
  if (anomalyScore > 0.5) status = 'concerning';

  const possibleCauses: string[] = [];
  if (hasFatigue) possibleCauses.push('lack_of_sleep', 'long_screen_time');
  if (hasStress) possibleCauses.push('stress', 'anxiety');

  return {
    timestamp: new Date().toISOString(),
    identityMatch: options?.skipIdentityCheck || !facePrint
      ? { isMatch: true, confidence: 1 }
      : { isMatch: true, confidence: 0.9 + Math.random() * 0.1 },
    analysis: {
      facesDetected: 1,
      primaryFace: true,
      emotions,
      dominantEmotion: emotions[0],
      eyeContact: Math.random() > 0.2,
      eyeOpenness: { left: eyeLeft, right: eyeRight },
      blinking: {
        rate: 15 + Math.random() * 10,
        isNormal: true,
      },
      indicators: {
        fatigue: {
          detected: hasFatigue,
          level: hasFatigue ? 'mild' : 'none',
          signs: hasFatigue ? ['droopy_eyelids'] : [],
        },
        stress: {
          detected: hasStress,
          level: hasStress ? 'mild' : 'none',
          signs: hasStress ? ['tense_jaw'] : [],
        },
        pallor: {
          detected: false,
          deviation: 0,
        },
        asymmetry: {
          detected: hasAsymmetry,
          type: hasAsymmetry ? 'slight_asymmetry' : undefined,
          urgency: hasAsymmetry ? 'monitor' : 'none',
        },
      },
    },
    assessment: {
      status,
      anomalyScore,
      possibleCauses,
      requiresAttention: status === 'concerning',
      urgentAttention: hasAsymmetry && Math.random() < 0.1, // Rarely urgent
    },
    metadata: {
      imageQuality: 0.7 + Math.random() * 0.3,
      lightingCondition: Math.random() > 0.3 ? 'good' : 'low',
      faceAngle: {
        pitch: (Math.random() - 0.5) * 20,
        yaw: (Math.random() - 0.5) * 30,
        roll: (Math.random() - 0.5) * 10,
      },
    },
  };
}
