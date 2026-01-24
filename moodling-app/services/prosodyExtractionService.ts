/**
 * Prosody Extraction Service
 *
 * Comprehensive vocal feature extraction for training the aliveness system.
 * Extracts prosodic, emotional, and speech quality features from audio.
 *
 * Used for:
 * 1. Training data annotation from interviews
 * 2. Real-time user speech analysis
 * 3. Interview classification and rating
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// STORAGE
// ============================================

const STORAGE_KEYS = {
  EXTRACTION_RESULTS: 'moodleaf_prosody_extractions',
  INTERVIEW_RATINGS: 'moodleaf_interview_ratings',
};

// ============================================
// PROSODIC FEATURE TYPES
// ============================================

/**
 * Core prosodic elements (the "music" of speech)
 */
export interface ProsodicFeatures {
  // Rhythm & Timing
  meter: MeterAnalysis;
  rhythm: RhythmAnalysis;
  cadence: CadenceAnalysis;
  tempo: TempoAnalysis;

  // Pitch & Intonation
  intonation: IntonationAnalysis;
  pitchRange: PitchRangeAnalysis;

  // Stress & Emphasis
  stress: StressAnalysis;
  emphasis: EmphasisAnalysis;
}

/**
 * Meter - systematic patterns of stressed/unstressed syllables
 */
export interface MeterAnalysis {
  regularity: number; // 0-1: how regular the metrical pattern is
  dominantFoot: MetricalFoot;
  beatsPerPhrase: number;
  scansionPattern: string; // e.g., "/ u / u /" (stressed/unstressed)
}

export type MetricalFoot =
  | 'iamb'      // u / (unstressed-stressed) - natural speech
  | 'trochee'   // / u (stressed-unstressed) - commanding
  | 'dactyl'    // / u u (stressed-unstressed-unstressed) - flowing
  | 'anapest'   // u u / (unstressed-unstressed-stressed) - building
  | 'spondee'   // / / (stressed-stressed) - emphatic
  | 'irregular'; // No clear pattern

/**
 * Rhythm - overall flow of sound (may be irregular)
 */
export interface RhythmAnalysis {
  flowType: RhythmFlowType;
  consistency: number; // 0-1: how consistent the rhythm is
  breathingPattern: BreathingPattern;
  phraseLength: 'short' | 'medium' | 'long' | 'variable';
}

export type RhythmFlowType =
  | 'steady_stream'    // Continuous, even flow
  | 'staccato'         // Short, punctuated bursts
  | 'legato'           // Smooth, connected phrases
  | 'syncopated'       // Off-beat emphasis
  | 'fragmented'       // Broken, interrupted
  | 'building'         // Momentum increasing
  | 'winding_down';    // Momentum decreasing

export type BreathingPattern =
  | 'deep_relaxed'     // Full breaths, calm
  | 'shallow_rapid'    // Quick breaths, anxious
  | 'held'             // Breath holding, tense
  | 'gasping'          // Catching breath, distressed
  | 'sighing'          // Release breaths, resignation
  | 'irregular';       // No clear pattern

/**
 * Cadence - natural modulation, rise/fall indicating pauses
 */
export interface CadenceAnalysis {
  terminalPattern: TerminalPattern;
  phraseEndings: PhraseEndingType;
  naturalness: number; // 0-1: how natural/conversational
  lilt: number; // 0-1: musical quality of the voice
}

export type TerminalPattern =
  | 'falling'          // Declarative, conclusive
  | 'rising'           // Questions, uncertainty
  | 'level'            // Continuation, monotone
  | 'fall_rise'        // Implication, more to come
  | 'rise_fall';       // Emphasis, conviction

export type PhraseEndingType =
  | 'complete'         // Full stop feeling
  | 'trailing_off'     // Voice fading
  | 'hanging'          // Incomplete, waiting
  | 'abrupt'           // Sudden stop
  | 'sustained';       // Held note

/**
 * Tempo - speed and pacing
 */
export interface TempoAnalysis {
  overallRate: SpeechRate;
  syllablesPerSecond: number;
  wordsPerMinute: number;
  variability: number; // 0-1: how much tempo varies
  acceleration: TempoChange;
}

export type SpeechRate =
  | 'very_slow'    // < 100 WPM
  | 'slow'         // 100-130 WPM
  | 'moderate'     // 130-160 WPM
  | 'fast'         // 160-200 WPM
  | 'very_fast';   // > 200 WPM

export type TempoChange =
  | 'stable'           // Consistent pace
  | 'accelerating'     // Getting faster
  | 'decelerating'     // Slowing down
  | 'erratic';         // Unpredictable changes

/**
 * Intonation - pitch rises and falls
 */
export interface IntonationAnalysis {
  contourType: IntonationContour;
  pitchVariance: number; // Hz standard deviation
  expressiveness: number; // 0-1: dynamic range
  flatness: number; // 0-1: how monotone (inverse of expressiveness)
}

export type IntonationContour =
  | 'animated'         // Lots of pitch movement
  | 'moderate'         // Normal conversation
  | 'flat'             // Minimal pitch change
  | 'erratic'          // Unpredictable jumps
  | 'sagging'          // Pitch dropping over time
  | 'rising_tendency'; // Pitch climbing over time

/**
 * Pitch Range
 */
export interface PitchRangeAnalysis {
  fundamentalFrequency: number; // Average F0 in Hz
  minPitch: number;
  maxPitch: number;
  range: number; // maxPitch - minPitch
  register: VoiceRegister;
}

export type VoiceRegister =
  | 'very_low'     // Deep, bass
  | 'low'          // Below average
  | 'medium'       // Normal range
  | 'high'         // Above average
  | 'very_high';   // Elevated, squeaky

/**
 * Stress patterns
 */
export interface StressAnalysis {
  emphasisStyle: EmphasisStyle;
  stressFrequency: number; // Stressed syllables per phrase
  intensity: number; // 0-1: force of emphasis
}

export type EmphasisStyle =
  | 'natural'          // Normal word stress
  | 'emphatic'         // Strong emphasis
  | 'understated'      // Minimal emphasis
  | 'dramatic'         // Theatrical emphasis
  | 'uniform';         // No emphasis variation

/**
 * Emphasis patterns
 */
export interface EmphasisAnalysis {
  keywordHighlighting: number; // 0-1: how much key words stand out
  contrastLevel: number; // 0-1: difference between stressed/unstressed
  emotionalWeight: number; // 0-1: emotional loading of emphasis
}

// ============================================
// VOICE QUALITY FEATURES
// ============================================

/**
 * Physical voice quality characteristics
 */
export interface VoiceQualityFeatures {
  // Volume & Intensity
  volume: VolumeAnalysis;
  dynamicRange: DynamicRangeAnalysis;

  // Voice texture
  texture: VoiceTextureAnalysis;

  // Stability
  stability: VoiceStabilityAnalysis;

  // Resonance
  resonance: ResonanceAnalysis;
}

/**
 * Volume analysis - intensity levels
 */
export interface VolumeAnalysis {
  overallLevel: VolumeLevel;
  averageDecibels: number;
  peakDecibels: number;
  evenness: number; // 0-1: how consistent volume is
  trajectory: VolumeTrajectory;
}

export type VolumeLevel =
  | 'whisper'      // Very quiet
  | 'soft'         // Quiet, gentle
  | 'moderate'     // Normal conversation
  | 'loud'         // Raised voice
  | 'shouting';    // Very loud

export type VolumeTrajectory =
  | 'stable'           // Consistent volume
  | 'sagging_down'     // Volume dropping over time
  | 'building_up'      // Volume increasing
  | 'oscillating'      // Up and down waves
  | 'erratic';         // Unpredictable jumps

/**
 * Dynamic range - contrast between loud and soft
 */
export interface DynamicRangeAnalysis {
  range: number; // dB difference between loudest and softest
  compressionLevel: number; // 0-1: how compressed/uniform
  expressiveContrast: number; // 0-1: intentional volume variation
}

/**
 * Voice texture - quality of the sound
 */
export interface VoiceTextureAnalysis {
  clarity: number; // 0-1: how clear vs. muffled
  breathiness: number; // 0-1: air in voice
  raspiness: number; // 0-1: rough quality
  nasality: number; // 0-1: nasal resonance
  tightness: number; // 0-1: constricted throat
  warmth: number; // 0-1: rich, full quality
}

/**
 * Voice stability - steadiness
 */
export interface VoiceStabilityAnalysis {
  jitter: number; // Pitch variation (cycle-to-cycle)
  shimmer: number; // Amplitude variation
  tremor: TremorAnalysis;
  breaks: VoiceBreakAnalysis;
}

export interface TremorAnalysis {
  present: boolean;
  frequency: number; // Hz of tremor
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  type: TremorType;
}

export type TremorType =
  | 'none'
  | 'nervousness'      // Slight shake from anxiety
  | 'emotional'        // Crying/upset tremor
  | 'fatigue'          // Tired voice shake
  | 'medical';         // Pathological tremor

export interface VoiceBreakAnalysis {
  frequency: number; // Breaks per minute
  type: VoiceBreakType[];
  recoverySpeed: 'quick' | 'slow' | 'incomplete';
}

export type VoiceBreakType =
  | 'pitch_break'      // Voice cracks
  | 'glottal_stop'     // Catching/choking
  | 'sob_break'        // Crying interruption
  | 'gasp'             // Breath catch
  | 'squeak'           // High pitch escape
  | 'choke';           // Throat closing

/**
 * Resonance characteristics
 */
export interface ResonanceAnalysis {
  placement: ResonancePlacement;
  fullness: number; // 0-1: rich vs. thin
  harmonicRichness: number; // 0-1: overtone content
}

export type ResonancePlacement =
  | 'chest'            // Deep, grounded
  | 'throat'           // Tight, constricted
  | 'head'             // Light, airy
  | 'nasal'            // Forward, nasal
  | 'balanced';        // Mixed resonance

// ============================================
// EMOTIONAL STATE FEATURES
// ============================================

/**
 * Emotional markers detected from voice
 */
export interface EmotionalFeatures {
  primaryEmotion: EmotionalState;
  secondaryEmotion: EmotionalState | null;
  intensity: number; // 0-1
  valence: number; // -1 to 1 (negative to positive)
  arousal: number; // 0-1 (calm to activated)
  confidence: number; // 0-1: confidence in detection

  // Specific markers
  distressMarkers: DistressMarkers;
  engagementMarkers: EngagementMarkers;
}

export type EmotionalState =
  // Negative high arousal
  | 'anger'
  | 'fear'
  | 'anxiety'
  | 'frustration'
  | 'panic'
  | 'distress'
  // Negative low arousal
  | 'sadness'
  | 'grief'
  | 'depression'
  | 'exhaustion'
  | 'hopelessness'
  | 'resignation'
  // Positive high arousal
  | 'joy'
  | 'excitement'
  | 'enthusiasm'
  | 'passion'
  | 'triumph'
  // Positive low arousal
  | 'calm'
  | 'contentment'
  | 'peace'
  | 'relief'
  | 'tenderness'
  // Neutral/Mixed
  | 'neutral'
  | 'contemplative'
  | 'curious'
  | 'uncertain'
  | 'vulnerable';

/**
 * Distress-specific markers
 */
export interface DistressMarkers {
  crying: CryingIndicators;
  choking: ChokingIndicators;
  hyperventilation: boolean;
  voiceBreaking: boolean;
  squealing: boolean;
  suppressedSobs: boolean;
  forcedComposure: number; // 0-1: trying to hide distress
}

export interface CryingIndicators {
  present: boolean;
  type: CryingType;
  intensity: number; // 0-1
}

export type CryingType =
  | 'none'
  | 'tears_in_voice'   // Watery quality
  | 'sniffling'        // Audible sniffs
  | 'soft_crying'      // Quiet tears
  | 'sobbing'          // Full crying
  | 'wailing';         // Intense grief

export interface ChokingIndicators {
  present: boolean;
  frequency: number; // Per minute
  type: ChokingType;
  recovery: 'quick' | 'slow' | 'prolonged';
}

export type ChokingType =
  | 'none'
  | 'mild_catch'       // Slight throat catch
  | 'gulping'          // Swallowing emotion
  | 'gasping'          // Can't get air
  | 'full_choke';      // Voice completely stops

/**
 * Engagement markers
 */
export interface EngagementMarkers {
  attentiveness: number; // 0-1
  enthusiasm: number; // 0-1
  authenticity: number; // 0-1: genuine vs. performative
  connectionSeeking: number; // 0-1: reaching out quality
  withdrawal: number; // 0-1: pulling back
}

// ============================================
// PAUSE & SILENCE ANALYSIS
// ============================================

/**
 * Pause patterns
 */
export interface PauseAnalysis {
  frequency: number; // Pauses per minute
  averageDuration: number; // Milliseconds
  longestPause: number;
  pauseTypes: PauseTypeDistribution;
  silenceRatio: number; // 0-1: proportion of time silent
}

export interface PauseTypeDistribution {
  breathing: number; // Natural breath pauses
  thinking: number; // Processing pauses
  emotional: number; // Overwhelmed pauses
  dramatic: number; // Intentional effect
  hesitation: number; // Uncertainty pauses
  trailing: number; // End-of-thought fading
}

// ============================================
// INTERVIEW CLASSIFICATION
// ============================================

/**
 * Interview type classification
 */
export interface InterviewClassification {
  primaryType: InterviewType;
  secondaryType: InterviewType | null;
  formality: FormalityLevel;
  depth: ConversationDepth;
  rapport: RapportLevel;
}

export type InterviewType =
  | 'therapeutic'       // Counseling, processing emotions
  | 'coaching'          // Goal-oriented, motivational
  | 'educational'       // Teaching, explaining
  | 'journalistic'      // Information gathering
  | 'casual_chat'       // Friendly conversation
  | 'intimate_share'    // Vulnerable disclosure
  | 'expert_discussion' // Technical, knowledge-based
  | 'storytelling'      // Narrative, recounting
  | 'conflict_resolution' // Working through disagreement
  | 'celebration'       // Positive sharing
  | 'crisis_support';   // Acute distress support

export type FormalityLevel =
  | 'very_informal'
  | 'casual'
  | 'conversational'
  | 'professional'
  | 'formal';

export type ConversationDepth =
  | 'surface'           // Small talk
  | 'moderate'          // Normal sharing
  | 'deep'              // Personal topics
  | 'profound';         // Existential, transformative

export type RapportLevel =
  | 'cold'              // No connection
  | 'professional'      // Appropriate distance
  | 'warm'              // Friendly connection
  | 'intimate';         // Deep trust

// ============================================
// FULL EXTRACTION RESULT
// ============================================

/**
 * Complete prosody extraction for a segment
 */
export interface ProsodyExtraction {
  id: string;
  timestamp: string;
  duration: number; // Seconds

  // Source info
  source: ExtractionSource;

  // All feature categories
  prosodic: ProsodicFeatures;
  voiceQuality: VoiceQualityFeatures;
  emotional: EmotionalFeatures;
  pauses: PauseAnalysis;

  // Classification
  classification: InterviewClassification;

  // Quality scores
  quality: ExtractionQuality;
}

export interface ExtractionSource {
  type: 'interview' | 'user_speech' | 'training_sample';
  sourceId: string;
  speakerId?: string;
  segmentIndex?: number;
}

export interface ExtractionQuality {
  audioQuality: number; // 0-1
  confidenceScore: number; // 0-1: overall extraction confidence
  noiseLevel: number; // 0-1
  completeness: number; // 0-1: how much data was extractable
}

// ============================================
// INTERVIEW STATISTICS
// ============================================

/**
 * Aggregated statistics for an interview
 */
export interface InterviewStatistics {
  interviewId: string;
  title: string;
  duration: number;
  extractionTimestamp: string;

  // Speaker breakdown (if multiple speakers)
  speakers: SpeakerStatistics[];

  // Overall statistics
  overall: AggregatedStatistics;

  // Rating
  rating: InterviewRating;

  // Classification
  classification: InterviewClassification;
}

export interface SpeakerStatistics {
  speakerId: string;
  speakerRole: 'interviewer' | 'guest' | 'host' | 'participant';
  speakingTime: number; // Seconds
  speakingPercentage: number;
  averages: AggregatedStatistics;
}

export interface AggregatedStatistics {
  // Prosodic averages
  averageTempo: number;
  tempoVariability: number;
  averagePitch: number;
  pitchVariability: number;
  rhythmConsistency: number;

  // Voice quality averages
  averageVolume: number;
  volumeEvenness: number;
  voiceClarity: number;
  emotionalExpressiveness: number;

  // Emotional distribution
  emotionDistribution: Record<EmotionalState, number>;
  averageValence: number;
  averageArousal: number;

  // Engagement
  averageEngagement: number;
  authenticityScore: number;

  // Distress markers (for training)
  distressOccurrences: number;
  chokingOccurrences: number;
  cryingOccurrences: number;
}

export interface InterviewRating {
  overall: number; // 1-5
  prosodyRichness: number; // 1-5: variety of prosodic features
  emotionalRange: number; // 1-5: breadth of emotions
  authenticity: number; // 1-5: genuine vs. performative
  trainingValue: number; // 1-5: usefulness for training
  notes: string;
}

// ============================================
// EXTRACTION FUNCTIONS (PLACEHOLDERS)
// ============================================

/**
 * Extract prosodic features from audio
 * NOTE: Actual extraction requires backend audio processing (librosa, praat, etc.)
 * This provides the interface; implementation connects to backend service
 */
export async function extractProsodyFromAudio(
  audioUri: string,
  options?: {
    segmentDuration?: number;
    speakerDiarization?: boolean;
  }
): Promise<ProsodyExtraction[]> {
  // Placeholder - would call backend service
  console.log('[ProsodyExtraction] Would extract from:', audioUri);

  // Return mock extraction for development
  return [{
    id: `extraction_${Date.now()}`,
    timestamp: new Date().toISOString(),
    duration: 0,
    source: {
      type: 'training_sample',
      sourceId: audioUri,
    },
    prosodic: getDefaultProsodicFeatures(),
    voiceQuality: getDefaultVoiceQuality(),
    emotional: getDefaultEmotionalFeatures(),
    pauses: getDefaultPauseAnalysis(),
    classification: getDefaultClassification(),
    quality: {
      audioQuality: 0,
      confidenceScore: 0,
      noiseLevel: 0,
      completeness: 0,
    },
  }];
}

/**
 * Extract prosody from text transcript with timestamps
 * Uses transcript analysis for rhythm/pacing when audio unavailable
 */
export function extractProsodyFromTranscript(
  transcript: string,
  timestamps?: { start: number; end: number; text: string }[]
): Partial<ProsodyExtraction> {
  // Text-based analysis for rhythm patterns
  const words = transcript.split(/\s+/);
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

  // Estimate rhythm from punctuation
  const sentences = transcript.split(/[.!?]+/);
  const avgSentenceLength = words.length / sentences.length;

  // Detect emotional markers in text
  const exclamations = (transcript.match(/!/g) || []).length;
  const questions = (transcript.match(/\?/g) || []).length;
  const ellipses = (transcript.match(/\.{3}/g) || []).length;
  const caps = (transcript.match(/[A-Z]{2,}/g) || []).length;

  return {
    id: `text_extraction_${Date.now()}`,
    timestamp: new Date().toISOString(),
    duration: 0,
    source: {
      type: 'training_sample',
      sourceId: 'transcript',
    },
    prosodic: {
      ...getDefaultProsodicFeatures(),
      rhythm: {
        ...getDefaultProsodicFeatures().rhythm,
        phraseLength: avgSentenceLength < 10 ? 'short' : avgSentenceLength < 20 ? 'medium' : 'long',
      },
    },
    emotional: {
      ...getDefaultEmotionalFeatures(),
      intensity: Math.min(1, (exclamations * 0.2 + caps * 0.3)),
      arousal: Math.min(1, (exclamations * 0.2 + questions * 0.1)),
    },
    quality: {
      audioQuality: 0,
      confidenceScore: 0.3, // Low confidence without audio
      noiseLevel: 0,
      completeness: 0.4,
    },
  };
}

/**
 * Classify an interview based on extracted features
 */
export function classifyInterview(
  extractions: ProsodyExtraction[]
): InterviewClassification {
  if (extractions.length === 0) {
    return getDefaultClassification();
  }

  // Aggregate emotional states
  const emotionCounts: Record<string, number> = {};
  let totalArousal = 0;
  let totalValence = 0;
  let distressCount = 0;

  for (const extraction of extractions) {
    const emotion = extraction.emotional.primaryEmotion;
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    totalArousal += extraction.emotional.arousal;
    totalValence += extraction.emotional.valence;

    if (extraction.emotional.distressMarkers.crying.present ||
        extraction.emotional.distressMarkers.choking.present) {
      distressCount++;
    }
  }

  const avgArousal = totalArousal / extractions.length;
  const avgValence = totalValence / extractions.length;
  const distressRatio = distressCount / extractions.length;

  // Determine interview type
  let primaryType: InterviewType = 'casual_chat';

  if (distressRatio > 0.3) {
    primaryType = avgValence < -0.3 ? 'crisis_support' : 'therapeutic';
  } else if (avgArousal > 0.7 && avgValence > 0.3) {
    primaryType = 'celebration';
  } else if (avgArousal < 0.3 && avgValence < 0) {
    primaryType = 'therapeutic';
  } else if (avgArousal > 0.5 && avgValence > 0) {
    primaryType = 'coaching';
  }

  return {
    primaryType,
    secondaryType: null,
    formality: 'conversational',
    depth: distressRatio > 0.2 ? 'deep' : 'moderate',
    rapport: 'warm',
  };
}

/**
 * Calculate interview statistics
 */
export function calculateInterviewStatistics(
  interviewId: string,
  title: string,
  extractions: ProsodyExtraction[]
): InterviewStatistics {
  const duration = extractions.reduce((sum, e) => sum + e.duration, 0);

  // Calculate aggregated statistics
  const overall = calculateAggregatedStats(extractions);

  // Calculate training value
  const prosodyRichness = calculateProsodyRichness(extractions);
  const emotionalRange = calculateEmotionalRange(extractions);
  const trainingValue = (prosodyRichness + emotionalRange) / 2;

  return {
    interviewId,
    title,
    duration,
    extractionTimestamp: new Date().toISOString(),
    speakers: [], // Would be filled with speaker diarization
    overall,
    rating: {
      overall: Math.round(trainingValue * 5) / 5,
      prosodyRichness: Math.round(prosodyRichness * 5),
      emotionalRange: Math.round(emotionalRange * 5),
      authenticity: 3, // Default, would need manual review
      trainingValue: Math.round(trainingValue * 5),
      notes: '',
    },
    classification: classifyInterview(extractions),
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateAggregatedStats(extractions: ProsodyExtraction[]): AggregatedStatistics {
  if (extractions.length === 0) {
    return getDefaultAggregatedStats();
  }

  const emotionDist: Record<EmotionalState, number> = {} as Record<EmotionalState, number>;
  let totalTempo = 0;
  let totalPitch = 0;
  let totalVolume = 0;
  let totalValence = 0;
  let totalArousal = 0;
  let distressCount = 0;
  let chokingCount = 0;
  let cryingCount = 0;

  for (const e of extractions) {
    totalTempo += e.prosodic.tempo.wordsPerMinute;
    totalPitch += e.prosodic.pitchRange.fundamentalFrequency;
    totalVolume += e.voiceQuality.volume.averageDecibels;
    totalValence += e.emotional.valence;
    totalArousal += e.emotional.arousal;

    const emotion = e.emotional.primaryEmotion;
    emotionDist[emotion] = (emotionDist[emotion] || 0) + 1;

    if (e.emotional.distressMarkers.crying.present) cryingCount++;
    if (e.emotional.distressMarkers.choking.present) chokingCount++;
    if (e.emotional.primaryEmotion === 'distress') distressCount++;
  }

  const n = extractions.length;

  return {
    averageTempo: totalTempo / n,
    tempoVariability: 0, // Would calculate std dev
    averagePitch: totalPitch / n,
    pitchVariability: 0,
    rhythmConsistency: 0.5,
    averageVolume: totalVolume / n,
    volumeEvenness: 0.5,
    voiceClarity: 0.5,
    emotionalExpressiveness: 0.5,
    emotionDistribution: emotionDist,
    averageValence: totalValence / n,
    averageArousal: totalArousal / n,
    averageEngagement: 0.5,
    authenticityScore: 0.5,
    distressOccurrences: distressCount,
    chokingOccurrences: chokingCount,
    cryingOccurrences: cryingCount,
  };
}

function calculateProsodyRichness(extractions: ProsodyExtraction[]): number {
  // Measure variety in prosodic features
  const tempos = new Set(extractions.map(e => e.prosodic.tempo.overallRate));
  const rhythms = new Set(extractions.map(e => e.prosodic.rhythm.flowType));
  const cadences = new Set(extractions.map(e => e.prosodic.cadence.terminalPattern));

  const variety = (tempos.size + rhythms.size + cadences.size) / 15; // Max possible
  return Math.min(1, variety);
}

function calculateEmotionalRange(extractions: ProsodyExtraction[]): number {
  const emotions = new Set(extractions.map(e => e.emotional.primaryEmotion));
  return Math.min(1, emotions.size / 10); // Normalize to 0-1
}

// ============================================
// DEFAULT VALUES
// ============================================

function getDefaultProsodicFeatures(): ProsodicFeatures {
  return {
    meter: {
      regularity: 0.5,
      dominantFoot: 'iamb',
      beatsPerPhrase: 4,
      scansionPattern: '',
    },
    rhythm: {
      flowType: 'steady_stream',
      consistency: 0.5,
      breathingPattern: 'deep_relaxed',
      phraseLength: 'medium',
    },
    cadence: {
      terminalPattern: 'falling',
      phraseEndings: 'complete',
      naturalness: 0.5,
      lilt: 0.5,
    },
    tempo: {
      overallRate: 'moderate',
      syllablesPerSecond: 4,
      wordsPerMinute: 150,
      variability: 0.3,
      acceleration: 'stable',
    },
    intonation: {
      contourType: 'moderate',
      pitchVariance: 20,
      expressiveness: 0.5,
      flatness: 0.5,
    },
    pitchRange: {
      fundamentalFrequency: 150,
      minPitch: 80,
      maxPitch: 300,
      range: 220,
      register: 'medium',
    },
    stress: {
      emphasisStyle: 'natural',
      stressFrequency: 2,
      intensity: 0.5,
    },
    emphasis: {
      keywordHighlighting: 0.5,
      contrastLevel: 0.5,
      emotionalWeight: 0.5,
    },
  };
}

function getDefaultVoiceQuality(): VoiceQualityFeatures {
  return {
    volume: {
      overallLevel: 'moderate',
      averageDecibels: 60,
      peakDecibels: 75,
      evenness: 0.7,
      trajectory: 'stable',
    },
    dynamicRange: {
      range: 15,
      compressionLevel: 0.3,
      expressiveContrast: 0.5,
    },
    texture: {
      clarity: 0.7,
      breathiness: 0.2,
      raspiness: 0.1,
      nasality: 0.2,
      tightness: 0.2,
      warmth: 0.5,
    },
    stability: {
      jitter: 0.5,
      shimmer: 0.5,
      tremor: {
        present: false,
        frequency: 0,
        severity: 'none',
        type: 'none',
      },
      breaks: {
        frequency: 0,
        type: [],
        recoverySpeed: 'quick',
      },
    },
    resonance: {
      placement: 'balanced',
      fullness: 0.5,
      harmonicRichness: 0.5,
    },
  };
}

function getDefaultEmotionalFeatures(): EmotionalFeatures {
  return {
    primaryEmotion: 'neutral',
    secondaryEmotion: null,
    intensity: 0.3,
    valence: 0,
    arousal: 0.3,
    confidence: 0,
    distressMarkers: {
      crying: { present: false, type: 'none', intensity: 0 },
      choking: { present: false, frequency: 0, type: 'none', recovery: 'quick' },
      hyperventilation: false,
      voiceBreaking: false,
      squealing: false,
      suppressedSobs: false,
      forcedComposure: 0,
    },
    engagementMarkers: {
      attentiveness: 0.5,
      enthusiasm: 0.5,
      authenticity: 0.5,
      connectionSeeking: 0.5,
      withdrawal: 0,
    },
  };
}

function getDefaultPauseAnalysis(): PauseAnalysis {
  return {
    frequency: 10,
    averageDuration: 500,
    longestPause: 2000,
    pauseTypes: {
      breathing: 0.4,
      thinking: 0.3,
      emotional: 0.1,
      dramatic: 0.05,
      hesitation: 0.1,
      trailing: 0.05,
    },
    silenceRatio: 0.2,
  };
}

function getDefaultClassification(): InterviewClassification {
  return {
    primaryType: 'casual_chat',
    secondaryType: null,
    formality: 'conversational',
    depth: 'moderate',
    rapport: 'warm',
  };
}

function getDefaultAggregatedStats(): AggregatedStatistics {
  return {
    averageTempo: 150,
    tempoVariability: 0,
    averagePitch: 150,
    pitchVariability: 0,
    rhythmConsistency: 0.5,
    averageVolume: 60,
    volumeEvenness: 0.5,
    voiceClarity: 0.5,
    emotionalExpressiveness: 0.5,
    emotionDistribution: {} as Record<EmotionalState, number>,
    averageValence: 0,
    averageArousal: 0.3,
    averageEngagement: 0.5,
    authenticityScore: 0.5,
    distressOccurrences: 0,
    chokingOccurrences: 0,
    cryingOccurrences: 0,
  };
}

// ============================================
// STORAGE
// ============================================

export async function saveExtraction(extraction: ProsodyExtraction): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.EXTRACTION_RESULTS);
    const extractions: ProsodyExtraction[] = stored ? JSON.parse(stored) : [];
    extractions.push(extraction);
    await AsyncStorage.setItem(STORAGE_KEYS.EXTRACTION_RESULTS, JSON.stringify(extractions));
  } catch (error) {
    console.error('[ProsodyExtraction] Failed to save:', error);
  }
}

export async function getExtractions(sourceId?: string): Promise<ProsodyExtraction[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.EXTRACTION_RESULTS);
    const extractions: ProsodyExtraction[] = stored ? JSON.parse(stored) : [];
    if (sourceId) {
      return extractions.filter(e => e.source.sourceId === sourceId);
    }
    return extractions;
  } catch (error) {
    console.error('[ProsodyExtraction] Failed to get:', error);
    return [];
  }
}

export async function saveInterviewRating(
  interviewId: string,
  rating: InterviewRating
): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.INTERVIEW_RATINGS);
    const ratings: Record<string, InterviewRating> = stored ? JSON.parse(stored) : {};
    ratings[interviewId] = rating;
    await AsyncStorage.setItem(STORAGE_KEYS.INTERVIEW_RATINGS, JSON.stringify(ratings));
  } catch (error) {
    console.error('[ProsodyExtraction] Failed to save rating:', error);
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  extractProsodyFromAudio,
  extractProsodyFromTranscript,
  classifyInterview,
  calculateInterviewStatistics,
  saveExtraction,
  getExtractions,
  saveInterviewRating,
};
