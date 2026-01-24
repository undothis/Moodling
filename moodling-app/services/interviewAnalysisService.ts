/**
 * Interview Analysis Service
 *
 * Comprehensive analysis of interview recordings for training pipeline.
 * Analyzes both interviewer and interviewee with detailed prosodic features.
 *
 * Prosodic Analysis includes:
 * - Rhythm: Overall pace, tempo, and stress patterns
 * - Meter: Measured structure of beats (iambic, trochaic, etc.)
 * - Foot: Single units of meter (stressed/unstressed combinations)
 * - Scansion: Analysis of meter in speech
 * - Cadence: Modulation and inflection, rise and fall
 * - Tempo: Speed of speech
 *
 * This service integrates with:
 * - prosodyExtractionService for voice features
 * - Whisper for transcription
 * - Custom analysis for insights
 */

// ============================================================================
// TYPES: PROSODIC ANALYSIS (DETAILED)
// ============================================================================

/**
 * Metrical foot types in speech
 */
export type MetricalFoot =
  | 'iamb'      // da-DUM (unstressed-stressed)
  | 'trochee'   // DUM-da (stressed-unstressed)
  | 'anapest'   // da-da-DUM (unstressed-unstressed-stressed)
  | 'dactyl'    // DUM-da-da (stressed-unstressed-unstressed)
  | 'spondee'   // DUM-DUM (stressed-stressed)
  | 'pyrrhic'   // da-da (unstressed-unstressed)
  | 'amphibrach' // da-DUM-da (unstressed-stressed-unstressed)
  | 'amphimacer' // DUM-da-DUM (stressed-unstressed-stressed)
  | 'tribrach'  // da-da-da (all unstressed)
  | 'molossus'; // DUM-DUM-DUM (all stressed)

/**
 * Detailed scansion analysis
 */
export interface ScansionAnalysis {
  dominantFoot: MetricalFoot;
  footDistribution: Record<MetricalFoot, number>; // Percentage of each foot type
  metricalRegularity: number; // 0-1: How consistent the meter is
  stressPattern: string; // e.g., "x/x/x/" where x=unstressed, /=stressed
  syllablesPerPhrase: number; // Average syllables per phrase
  beatsPerMinute: number; // Speech rhythm in BPM
  syncopation: number; // 0-1: Deviation from expected beats
}

/**
 * Rhythm analysis
 */
export interface RhythmAnalysis {
  overallTempo: TempoCategory;
  wordsPerMinute: number;
  syllablesPerSecond: number;
  tempoVariability: number; // 0-1: How much tempo changes
  tempoTrajectory: TempoTrajectory;
  pauseFrequency: number; // Pauses per minute
  pauseDuration: PauseDuration;
  rhythmicConsistency: number; // 0-1: How steady the rhythm is
  rushingTendency: number; // 0-1: Tendency to speed up
  draggingTendency: number; // 0-1: Tendency to slow down
}

export type TempoCategory =
  | 'very_slow'    // < 100 wpm
  | 'slow'         // 100-130 wpm
  | 'moderate'     // 130-160 wpm
  | 'fast'         // 160-190 wpm
  | 'very_fast';   // > 190 wpm

export type TempoTrajectory =
  | 'stable'
  | 'accelerating'   // Getting faster
  | 'decelerating'   // Getting slower
  | 'oscillating'    // Speeding up and slowing down
  | 'erratic';       // Unpredictable changes

export type PauseDuration =
  | 'micro'      // < 0.2s
  | 'brief'      // 0.2-0.5s
  | 'moderate'   // 0.5-1s
  | 'extended'   // 1-2s
  | 'long';      // > 2s

/**
 * Cadence analysis (rise and fall of speech)
 */
export interface CadenceAnalysis {
  overallPattern: CadencePattern;
  sentenceEndingStyle: SentenceEnding;
  questionIntonation: QuestionIntonation;
  emphasisPlacement: EmphasisPlacement;
  pitchRange: PitchRange;
  pitchVariability: number; // 0-1: How much pitch varies
  melodicContour: MelodicContour[];
  naturalness: number; // 0-1: How natural vs monotone
}

export type CadencePattern =
  | 'declarative'   // Falling at end of statements
  | 'interrogative' // Rising at end of questions
  | 'exclamatory'   // Sharp rises and falls
  | 'flat'          // Little variation
  | 'sing_song'     // Excessive variation
  | 'uptalk';       // Rising at end of statements (questioning tone)

export type SentenceEnding =
  | 'falling'       // Normal declarative
  | 'rising'        // Questions or uncertainty
  | 'sustained'     // Holding pitch (continuation)
  | 'falling_rising'; // Complex emotions

export type QuestionIntonation =
  | 'standard_rise' // Normal question rise
  | 'wh_fall'       // Falling in wh-questions
  | 'tag_rise'      // Rising in tag questions
  | 'flat';         // No clear question intonation

export type EmphasisPlacement =
  | 'natural'       // On content words
  | 'excessive'     // Too much emphasis
  | 'insufficient'  // Too little emphasis
  | 'misplaced';    // Emphasis on wrong words

export type PitchRange =
  | 'narrow'        // Small pitch variation
  | 'moderate'      // Normal variation
  | 'wide'          // Large pitch variation
  | 'extreme';      // Very dramatic variation

export interface MelodicContour {
  phrase: string;
  pattern: 'rising' | 'falling' | 'rise_fall' | 'fall_rise' | 'flat';
  peakPosition: number; // 0-1: Where the peak occurs in the phrase
}

// ============================================================================
// TYPES: SPEAKER ANALYSIS
// ============================================================================

export type SpeakerRole = 'interviewer' | 'interviewee';

export interface SpeakerProfile {
  role: SpeakerRole;
  speakingTime: number; // Total seconds
  speakingPercentage: number; // Percentage of total interview
  turnCount: number; // Number of speaking turns
  averageTurnLength: number; // Seconds
  longestTurn: number; // Seconds
  shortestTurn: number; // Seconds

  // Communication style
  communicationStyle: CommunicationStyle;

  // Prosodic features
  rhythm: RhythmAnalysis;
  cadence: CadenceAnalysis;
  scansion: ScansionAnalysis;

  // Voice quality
  voiceQuality: VoiceQualityProfile;

  // Emotional expression
  emotionalExpression: EmotionalExpressionProfile;

  // Linguistic features
  linguistics: LinguisticProfile;
}

export interface CommunicationStyle {
  overall: StyleCategory;
  warmth: number; // 0-1
  directness: number; // 0-1
  formality: number; // 0-1
  energy: number; // 0-1
  patience: number; // 0-1
  empathy: number; // 0-1
  dominance: number; // 0-1
  adaptability: number; // 0-1

  // Detailed style markers
  styleMarkers: StyleMarker[];
}

export type StyleCategory =
  | 'warm_supportive'
  | 'professional_neutral'
  | 'direct_challenging'
  | 'soft_nurturing'
  | 'energetic_enthusiastic'
  | 'calm_measured'
  | 'curious_exploratory'
  | 'authoritative_guiding';

export interface StyleMarker {
  marker: string;
  frequency: number; // Times per minute
  examples: string[];
}

export interface VoiceQualityProfile {
  breathiness: number; // 0-1
  creakiness: number; // 0-1 (vocal fry)
  nasality: number; // 0-1
  resonance: ResonanceType;
  volume: VolumeProfile;
  clarity: number; // 0-1
  stability: number; // 0-1
}

export type ResonanceType =
  | 'head_voice'
  | 'chest_voice'
  | 'mixed'
  | 'nasal'
  | 'throaty';

export interface VolumeProfile {
  average: VolumeLevel;
  range: number; // Decibel range
  trajectory: VolumeTrajectory;
  evenness: number; // 0-1
}

export type VolumeLevel = 'whisper' | 'soft' | 'moderate' | 'loud' | 'very_loud';
export type VolumeTrajectory = 'stable' | 'sagging_down' | 'building_up' | 'oscillating' | 'erratic';

export interface EmotionalExpressionProfile {
  primaryEmotion: EmotionCategory;
  emotionalRange: number; // 0-1: Variety of emotions
  emotionalIntensity: number; // 0-1
  emotionalStability: number; // 0-1
  emotionTimeline: EmotionTimepoint[];

  // Distress indicators
  distressMarkers: DistressMarkerProfile;
}

export type EmotionCategory =
  | 'neutral'
  | 'positive_engaged'
  | 'anxious_uncertain'
  | 'sad_subdued'
  | 'frustrated_tense'
  | 'curious_interested'
  | 'warm_caring'
  | 'guarded_defensive';

export interface EmotionTimepoint {
  timestamp: number;
  emotion: EmotionCategory;
  intensity: number;
  trigger?: string; // What seemed to trigger the emotion
}

export interface DistressMarkerProfile {
  crying: CryingProfile;
  choking: ChokingProfile;
  tremor: TremorProfile;
  breathing: BreathingProfile;
  overallDistressLevel: number; // 0-1
  distressTimeline: DistressTimepoint[];
}

export interface CryingProfile {
  detected: boolean;
  type?: 'tearful' | 'sniffling' | 'sobbing' | 'suppressed' | 'breakthrough';
  occurrences: number;
  totalDuration: number;
}

export interface ChokingProfile {
  detected: boolean;
  type?: 'mild_catch' | 'gulping' | 'gasping' | 'full_choke';
  occurrences: number;
}

export interface TremorProfile {
  detected: boolean;
  severity: number; // 0-1
  pattern: 'intermittent' | 'increasing' | 'decreasing' | 'constant';
}

export interface BreathingProfile {
  pattern: 'regular' | 'shallow' | 'deep' | 'irregular' | 'rapid' | 'sighing';
  audibleBreaths: number; // Count of audible breaths
  breathHolds: number; // Times they held breath
}

export interface DistressTimepoint {
  timestamp: number;
  markerType: 'crying' | 'choking' | 'tremor' | 'breath_irregularity';
  intensity: number;
  context?: string;
}

export interface LinguisticProfile {
  vocabularyLevel: VocabularyLevel;
  sentenceComplexity: number; // 0-1
  fillerWordFrequency: number; // Per minute
  fillerWords: Record<string, number>; // Which fillers and how often
  hedgingFrequency: number; // "maybe", "I think", "sort of"
  assertionFrequency: number; // Strong statements
  questionFrequency: number; // Per minute
  selfReferenceFrequency: number; // "I" statements per minute
  otherReferenceFrequency: number; // "you" statements per minute
  negationFrequency: number; // Negative words per minute
  intensifierFrequency: number; // "very", "really", "so"
}

export type VocabularyLevel = 'simple' | 'moderate' | 'sophisticated' | 'technical';

// ============================================================================
// TYPES: INTERVIEW DYNAMICS
// ============================================================================

export interface InterviewDynamics {
  rapport: RapportAnalysis;
  turnTaking: TurnTakingAnalysis;
  responsiveness: ResponsivenessAnalysis;
  powerDynamics: PowerDynamicsAnalysis;
  emotionalJourney: EmotionalJourneyAnalysis;
}

export interface RapportAnalysis {
  overallRapport: number; // 0-1
  rapportTrajectory: 'building' | 'stable' | 'declining' | 'fluctuating';

  // Rapport indicators
  mirroringScore: number; // How much they mirror each other's speech
  backchannelFrequency: number; // "mhm", "yeah", etc.
  laughter: LaughterAnalysis;
  warmthExchange: number; // 0-1
  tensionMoments: TensionMoment[];
  connectionMoments: ConnectionMoment[];
}

export interface LaughterAnalysis {
  totalOccurrences: number;
  sharedLaughter: number; // Both laughing together
  nervoursLaughter: number;
  genuineLaughter: number;
}

export interface TensionMoment {
  timestamp: number;
  duration: number;
  cause?: string;
  resolution?: string;
}

export interface ConnectionMoment {
  timestamp: number;
  type: 'breakthrough' | 'shared_emotion' | 'deep_understanding' | 'vulnerability';
  description?: string;
}

export interface TurnTakingAnalysis {
  smoothness: number; // 0-1: How smooth transitions are
  interruptionsByInterviewer: number;
  interruptionsByInterviewee: number;
  overlappingSpeech: number; // Seconds of overlap
  averageGapBetweenTurns: number; // Seconds
  longestMonologue: { speaker: SpeakerRole; duration: number };
  balanceRatio: number; // Interviewer/Interviewee speaking ratio
}

export interface ResponsivenessAnalysis {
  interviewerResponsiveness: number; // 0-1
  intervieweeResponsiveness: number; // 0-1
  averageResponseLatency: number; // Seconds to respond
  questionAnswerAlignment: number; // 0-1: Do answers match questions
  followUpQuality: number; // 0-1: How well interviewer follows up
  reflectionQuality: number; // 0-1: How well interviewer reflects
}

export interface PowerDynamicsAnalysis {
  balance: number; // -1 to 1: -1 = interviewee dominant, 1 = interviewer dominant
  shift: PowerShift[];
  interviewerControl: number; // 0-1
  intervieweeAgency: number; // 0-1
}

export interface PowerShift {
  timestamp: number;
  from: SpeakerRole;
  to: SpeakerRole;
  trigger?: string;
}

export interface EmotionalJourneyAnalysis {
  overallArc: EmotionalArc;
  peaks: EmotionalPeak[];
  valleys: EmotionalValley[];
  resolution: EmotionalResolution;
  transformationScore: number; // 0-1: How much emotional shift occurred
}

export type EmotionalArc =
  | 'stable'           // Little change
  | 'ascending'        // Getting better
  | 'descending'       // Getting worse
  | 'u_shaped'         // Down then up
  | 'inverted_u'       // Up then down
  | 'rollercoaster';   // Multiple ups and downs

export interface EmotionalPeak {
  timestamp: number;
  emotion: EmotionCategory;
  intensity: number;
  context?: string;
}

export interface EmotionalValley {
  timestamp: number;
  emotion: EmotionCategory;
  intensity: number;
  context?: string;
}

export type EmotionalResolution =
  | 'positive'         // Ended on high note
  | 'neutral'          // No strong ending
  | 'negative'         // Ended on low note
  | 'unresolved'       // Issues left open
  | 'hopeful';         // Cautiously optimistic

// ============================================================================
// TYPES: INTERVIEW CLASSIFICATION
// ============================================================================

export interface InterviewClassification {
  primaryType: InterviewType;
  secondaryTypes: InterviewType[];
  therapeuticApproaches: TherapeuticApproach[];
  topics: TopicAnalysis[];
  qualityScore: QualityScore;
  trainingValue: TrainingValue;
}

export type InterviewType =
  | 'therapeutic_session'
  | 'coaching_conversation'
  | 'crisis_support'
  | 'intake_assessment'
  | 'follow_up_check_in'
  | 'deep_exploration'
  | 'skill_teaching'
  | 'motivational'
  | 'casual_check_in'
  | 'trauma_processing'
  | 'grief_support'
  | 'relationship_focused'
  | 'career_focused'
  | 'health_focused';

export type TherapeuticApproach =
  | 'cbt'
  | 'dbt'
  | 'psychodynamic'
  | 'humanistic'
  | 'solution_focused'
  | 'narrative'
  | 'mindfulness_based'
  | 'motivational_interviewing'
  | 'trauma_informed'
  | 'somatic'
  | 'ifs'
  | 'act';

export interface TopicAnalysis {
  topic: string;
  duration: number; // Seconds spent on topic
  depth: number; // 0-1: How deeply explored
  emotionalIntensity: number; // 0-1
  resolution: number; // 0-1: How resolved
}

export interface QualityScore {
  overall: number; // 0-100

  // Interviewer qualities
  activeListening: number; // 0-100
  questionQuality: number; // 0-100
  empathyDemonstrated: number; // 0-100
  pacing: number; // 0-100
  boundarySetting: number; // 0-100
  crisisHandling?: number; // 0-100, if applicable

  // Session qualities
  structure: number; // 0-100
  depth: number; // 0-100
  safetyMaintained: number; // 0-100
  closureQuality: number; // 0-100
}

export interface TrainingValue {
  overall: number; // 0-1

  // What can be learned from this interview
  demonstratesSkills: string[];
  learningOpportunities: string[];
  cautionaryElements: string[];

  // Specific training applications
  goodForTeaching: string[];
  notRecommendedFor: string[];
}

// ============================================================================
// TYPES: FULL INTERVIEW ANALYSIS REPORT
// ============================================================================

export interface InterviewAnalysisReport {
  // Metadata
  id: string;
  analyzedAt: string;
  duration: number; // Total duration in seconds
  sourceFile?: string;

  // Transcription
  transcript: TranscriptSegment[];

  // Speaker profiles
  interviewer: SpeakerProfile;
  interviewee: SpeakerProfile;

  // Dynamics
  dynamics: InterviewDynamics;

  // Classification
  classification: InterviewClassification;

  // Key moments
  keyMoments: KeyMoment[];

  // Summary insights
  insights: InterviewInsights;

  // Raw data for further analysis
  rawMetrics: RawMetrics;
}

export interface TranscriptSegment {
  speaker: SpeakerRole;
  startTime: number;
  endTime: number;
  text: string;

  // Per-segment prosody
  tempo: number;
  volume: number;
  pitch: number;
  emotion?: EmotionCategory;
}

export interface KeyMoment {
  timestamp: number;
  type: KeyMomentType;
  description: string;
  significance: number; // 0-1
  speakers: SpeakerRole[];
}

export type KeyMomentType =
  | 'breakthrough'
  | 'emotional_peak'
  | 'tension'
  | 'insight'
  | 'connection'
  | 'resistance'
  | 'vulnerability'
  | 'humor'
  | 'technique_demonstration'
  | 'topic_shift';

export interface InterviewInsights {
  // Summary
  summary: string;

  // Interviewer feedback
  interviewerStrengths: string[];
  interviewerGrowthAreas: string[];

  // Interviewee observations
  intervieweeState: string;
  intervieweeNeeds: string[];

  // Relationship
  relationshipQuality: string;

  // Recommendations
  recommendations: string[];

  // Quotable moments
  quotableMoments: QuotableMoment[];
}

export interface QuotableMoment {
  timestamp: number;
  speaker: SpeakerRole;
  quote: string;
  significance: string;
}

export interface RawMetrics {
  // Audio features over time
  pitchContour: number[];
  volumeContour: number[];
  tempoContour: number[];

  // Timestamps for features
  timestamps: number[];

  // Word-level data
  wordTimings: WordTiming[];
}

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  speaker: SpeakerRole;
  stress: boolean;
  pitchAtWord: number;
  volumeAtWord: number;
}

// ============================================================================
// ANALYSIS STATISTICS
// ============================================================================

export interface InterviewStatistics {
  totalInterviewsAnalyzed: number;
  totalDuration: number; // Hours

  // Type distribution
  typeDistribution: Record<InterviewType, number>;

  // Quality metrics
  averageQualityScore: number;
  qualityDistribution: { range: string; count: number }[];

  // Approach usage
  approachFrequency: Record<TherapeuticApproach, number>;

  // Emotional patterns
  commonEmotionalArcs: Record<EmotionalArc, number>;

  // Duration patterns
  averageDuration: number;
  durationDistribution: { range: string; count: number }[];

  // Rhythm patterns
  dominantFootTypes: Record<MetricalFoot, number>;
  averageTempo: number;

  // Best practices identified
  effectiveTechniques: EffectiveTechnique[];

  // Training insights
  trainingGaps: string[];
  strengthAreas: string[];
}

export interface EffectiveTechnique {
  technique: string;
  frequency: number;
  effectivenessScore: number;
  bestUsedFor: string[];
  examples: { interviewId: string; timestamp: number }[];
}

// ============================================================================
// SERVICE FUNCTIONS (STUBS - TO BE IMPLEMENTED)
// ============================================================================

/**
 * Analyze a single interview
 */
export async function analyzeInterview(
  audioPath: string,
  options?: { transcriptPath?: string }
): Promise<InterviewAnalysisReport> {
  // This would:
  // 1. Load/transcribe audio
  // 2. Diarize speakers (who is speaking when)
  // 3. Extract prosodic features per segment
  // 4. Analyze each speaker's profile
  // 5. Analyze dynamics between speakers
  // 6. Classify the interview
  // 7. Identify key moments
  // 8. Generate insights

  throw new Error('Not implemented - requires audio processing backend');
}

/**
 * Batch analyze multiple interviews
 */
export async function analyzeInterviewBatch(
  audioPaths: string[]
): Promise<InterviewAnalysisReport[]> {
  throw new Error('Not implemented - requires audio processing backend');
}

/**
 * Get aggregate statistics across analyzed interviews
 */
export async function getInterviewStatistics(): Promise<InterviewStatistics> {
  throw new Error('Not implemented - requires stored analysis data');
}

/**
 * Compare two speakers' styles
 */
export function compareSpeakerStyles(
  speaker1: SpeakerProfile,
  speaker2: SpeakerProfile
): StyleComparison {
  return {
    rhythmSimilarity: calculateSimilarity(speaker1.rhythm, speaker2.rhythm),
    cadenceSimilarity: calculateSimilarity(speaker1.cadence, speaker2.cadence),
    styleSimilarity: calculateSimilarity(speaker1.communicationStyle, speaker2.communicationStyle),
    mirroring: detectMirroring(speaker1, speaker2),
    divergence: detectDivergence(speaker1, speaker2),
  };
}

interface StyleComparison {
  rhythmSimilarity: number;
  cadenceSimilarity: number;
  styleSimilarity: number;
  mirroring: string[];
  divergence: string[];
}

function calculateSimilarity(a: any, b: any): number {
  // Placeholder - would calculate actual similarity
  return 0.5;
}

function detectMirroring(a: SpeakerProfile, b: SpeakerProfile): string[] {
  // Placeholder - would detect where speakers mirror each other
  return [];
}

function detectDivergence(a: SpeakerProfile, b: SpeakerProfile): string[] {
  // Placeholder - would detect where speakers diverge
  return [];
}

/**
 * Extract scansion from text with timing
 */
export function analyzeScansion(
  words: WordTiming[]
): ScansionAnalysis {
  // This would analyze stress patterns to determine metrical feet

  const footCounts: Record<MetricalFoot, number> = {
    iamb: 0,
    trochee: 0,
    anapest: 0,
    dactyl: 0,
    spondee: 0,
    pyrrhic: 0,
    amphibrach: 0,
    amphimacer: 0,
    tribrach: 0,
    molossus: 0,
  };

  // Analyze consecutive stress patterns
  let stressPattern = '';
  for (const word of words) {
    stressPattern += word.stress ? '/' : 'x';
  }

  // Count foot types (simplified)
  for (let i = 0; i < stressPattern.length - 1; i++) {
    const pair = stressPattern.slice(i, i + 2);
    if (pair === 'x/') footCounts.iamb++;
    if (pair === '/x') footCounts.trochee++;
    if (pair === '//') footCounts.spondee++;
    if (pair === 'xx') footCounts.pyrrhic++;
  }

  // Find dominant foot
  const dominant = Object.entries(footCounts)
    .sort(([, a], [, b]) => b - a)[0][0] as MetricalFoot;

  const total = Object.values(footCounts).reduce((a, b) => a + b, 0) || 1;
  const distribution: Record<MetricalFoot, number> = {} as any;
  for (const [foot, count] of Object.entries(footCounts)) {
    distribution[foot as MetricalFoot] = count / total;
  }

  return {
    dominantFoot: dominant,
    footDistribution: distribution,
    metricalRegularity: calculateRegularity(stressPattern),
    stressPattern,
    syllablesPerPhrase: words.length / 10, // Placeholder
    beatsPerMinute: 60, // Placeholder
    syncopation: 0.2, // Placeholder
  };
}

function calculateRegularity(pattern: string): number {
  // Calculate how regular the pattern is
  // A perfectly alternating pattern would score 1.0
  let alternations = 0;
  for (let i = 1; i < pattern.length; i++) {
    if (pattern[i] !== pattern[i - 1]) alternations++;
  }
  return alternations / (pattern.length - 1 || 1);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  analyzeInterview,
  analyzeInterviewBatch,
  getInterviewStatistics,
  compareSpeakerStyles,
  analyzeScansion,
};
