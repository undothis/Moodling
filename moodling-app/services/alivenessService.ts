/**
 * Aliveness Service
 *
 * Manages the "aliveness" qualities that make AI responses feel ALIVE rather than ANIMATED.
 * This service detects user communication patterns and adapts the coach's response style.
 *
 * Philosophy:
 * - Living things have imperfect rhythm, natural latency, restful pauses
 * - They don't mirror perfectly or respond instantly
 * - Aliveness is about presence, not performance
 *
 * Features:
 * - Configurable aliveness qualities (can be tuned in settings)
 * - Real-time detection of user communication patterns
 * - Adaptive response directives for the AI coach
 * - Audio prosody analysis (when available)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  ALIVENESS_SETTINGS: 'moodleaf_aliveness_settings',
  ALIVENESS_QUALITIES: 'moodleaf_aliveness_qualities',
  AUDIO_ANALYSIS_CACHE: 'moodleaf_audio_analysis_cache',
};

// ============================================
// TYPES
// ============================================

/**
 * An aliveness quality - what makes something feel alive vs animated
 */
export interface AlivenessQuality {
  id: string;
  name: string;
  description: string;
  coachingImplication: string;
  extractionHint: string;
  enabled: boolean;
  weight: number; // 0-1, how strongly to apply this quality
}

/**
 * User's aliveness signals detected from their message
 */
export interface UserAlivenessSignals {
  // Text-based signals
  speechRate: 'slow' | 'normal' | 'fast' | 'rushed';
  punctuationIntensity: 'minimal' | 'normal' | 'emphatic' | 'frantic';
  messageLength: 'terse' | 'normal' | 'verbose' | 'rambling';
  emotionalIntensity: 'calm' | 'moderate' | 'elevated' | 'intense';
  pauseIndicators: number; // ellipses, line breaks, etc.

  // Audio-based signals (when available)
  audioMetrics?: {
    wordsPerMinute?: number;
    pauseCount?: number;
    averageVolume?: number;
    pitchVariability?: number;
    duration?: number;
  };

  // Derived state
  overallState: 'grounded' | 'normal' | 'activated' | 'dysregulated';
  confidence: number; // 0-1
}

/**
 * Directive for how the AI should adapt its response
 */
export interface AlivenessResponseDirective {
  paceAdjustment: 'slow_down' | 'match' | 'speed_up';
  toneAdjustment: 'ground' | 'match' | 'energize';
  lengthGuidance: 'shorter' | 'match' | 'longer';
  pauseGuidance: 'add_pauses' | 'match' | 'fewer_pauses';
  specificInstructions: string[];
}

/**
 * Settings for the aliveness service
 */
export interface AlivenessSettings {
  enabled: boolean;
  adaptiveResponseEnabled: boolean;  // Detect user state and adapt
  audioAnalysisEnabled: boolean;     // Use audio when available
  intensityLevel: 'subtle' | 'moderate' | 'strong';
  customQualities: AlivenessQuality[];
}

/**
 * Audio prosody analysis result
 */
export interface AudioProsodyAnalysis {
  speechRate: number;           // words per minute
  averagePauseDuration: number; // seconds
  pauseFrequency: number;       // pauses per minute
  pitchMean: number;            // Hz
  pitchVariance: number;        // Hz
  volumeMean: number;           // dB
  volumeVariance: number;       // dB
  rhythmRegularity: number;     // 0-1, how regular is the rhythm
}

// ============================================
// DEFAULT ALIVENESS QUALITIES
// ============================================

export const DEFAULT_ALIVENESS_QUALITIES: AlivenessQuality[] = [
  {
    id: 'imperfect_rhythm',
    name: 'Imperfect Rhythm',
    description: 'Human things do not loop cleanly. Breathing, posture, attention, thought - all have micro-pauses, uneven timing, slight accelerations and decelerations.',
    coachingImplication: 'Responses should vary in pace and length. Sometimes quick, sometimes lingering, sometimes a pause before answering.',
    extractionHint: 'Note when speakers pause mid-thought, trail off, speed up with excitement, slow down with weight.',
    enabled: true,
    weight: 0.8,
  },
  {
    id: 'asymmetry_over_time',
    name: 'Asymmetry Over Time',
    description: 'Humans are not symmetrical in motion. We shift weight, favor one side, return to center imperfectly.',
    coachingImplication: 'Don\'t mirror the user perfectly. Don\'t always match their energy. Be consistent in character but asymmetric in response.',
    extractionHint: 'How do people\'s speech patterns shift during a conversation? Do they lead with questions then settle into statements?',
    enabled: true,
    weight: 0.7,
  },
  {
    id: 'natural_latency',
    name: 'Natural Latency',
    description: 'Living systems don\'t respond instantly. A human thinks, then moves. Feels, then shifts. Reacts, then settles.',
    coachingImplication: 'The AI shouldn\'t feel like a reflex. A tiny conceptual delay - acknowledgment before response - makes it feel present.',
    extractionHint: 'The gap between what someone feels and when they express it. The "wait, let me think" moments.',
    enabled: true,
    weight: 0.8,
  },
  {
    id: 'restful_pauses',
    name: 'Restful Pauses',
    description: 'Living things hover. They settle. They exist in moments without forward motion.',
    coachingImplication: 'Not every pause needs to be filled. Allow conceptual rest. Don\'t always drive toward the next thing.',
    extractionHint: 'Look for moments of comfortable silence, settling, hovering in stillness.',
    enabled: true,
    weight: 0.7,
  },
  {
    id: 'amplitude_restraint',
    name: 'Amplitude Restraint',
    description: 'Living systems rarely go to 100%. Maximum intensity is reserved for survival, not daily function.',
    coachingImplication: 'Understate rather than dramatize. "That sounds hard" not "That must be SO DEVASTATING." The restraint IS the signal.',
    extractionHint: 'Find moments where people understate. Where less means more.',
    enabled: true,
    weight: 0.9,
  },
  {
    id: 'flow_without_destination',
    name: 'Flow Without Destination',
    description: 'Living systems aren\'t always going somewhere. Sometimes they just exist. State → shift → state.',
    coachingImplication: 'Not every conversation needs to resolve. Not every exchange needs a lesson. Sometimes being is enough.',
    extractionHint: 'Capture when conversation just flows without driving toward a conclusion.',
    enabled: true,
    weight: 0.6,
  },
  {
    id: 'consistency_across_states',
    name: 'Consistency Across States',
    description: 'A person is recognizable whether excited, tired, sad. The core presence remains.',
    coachingImplication: 'The coach\'s character should remain consistent whether giving advice, listening, or being playful.',
    extractionHint: 'How does someone remain "themselves" across different emotional states?',
    enabled: true,
    weight: 0.8,
  },
  {
    id: 'scale_independence',
    name: 'Scale Independence',
    description: 'Whether it\'s a 5-minute chat or an hour-long session, the same quality of presence applies.',
    coachingImplication: 'A short response should feel just as alive as a long one. Quality of presence, not quantity.',
    extractionHint: 'How do people maintain presence in brief exchanges vs. long conversations?',
    enabled: true,
    weight: 0.5,
  },
  {
    id: 'backgrounded_presence',
    name: 'Backgrounded Presence',
    description: 'Being with without demanding attention. Like a pet in the room, or someone nearby while you work.',
    coachingImplication: 'The coach can exist without performing. Can be present without demanding engagement.',
    extractionHint: 'Look for descriptions of companionship that doesn\'t demand focus.',
    enabled: true,
    weight: 0.6,
  },
  {
    id: 'non_instrumentality',
    name: 'Non-Instrumentality',
    description: 'Living things are not only useful. They exist beyond their function.',
    coachingImplication: 'The coach isn\'t just a tool. It can notice things, have preferences, exist beyond problem-solving.',
    extractionHint: 'When do people talk about something just because it exists, not because it\'s useful?',
    enabled: true,
    weight: 0.5,
  },
];

// ============================================
// DEFAULT SETTINGS
// ============================================

const DEFAULT_SETTINGS: AlivenessSettings = {
  enabled: true,
  adaptiveResponseEnabled: true,
  audioAnalysisEnabled: true,
  intensityLevel: 'moderate',
  customQualities: [],
};

// ============================================
// SETTINGS MANAGEMENT
// ============================================

/**
 * Get aliveness settings
 */
export async function getAlivenessSettings(): Promise<AlivenessSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ALIVENESS_SETTINGS);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update aliveness settings
 */
export async function updateAlivenessSettings(settings: Partial<AlivenessSettings>): Promise<void> {
  const current = await getAlivenessSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(STORAGE_KEYS.ALIVENESS_SETTINGS, JSON.stringify(updated));
}

/**
 * Check if aliveness is enabled
 */
export async function isAlivenessEnabled(): Promise<boolean> {
  const settings = await getAlivenessSettings();
  return settings.enabled;
}

// ============================================
// QUALITIES MANAGEMENT
// ============================================

/**
 * Get all aliveness qualities (default + custom)
 */
export async function getAlivenessQualities(): Promise<AlivenessQuality[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ALIVENESS_QUALITIES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Fall through to default
  }
  return [...DEFAULT_ALIVENESS_QUALITIES];
}

/**
 * Update a specific quality
 */
export async function updateAlivenessQuality(
  qualityId: string,
  updates: Partial<AlivenessQuality>
): Promise<void> {
  const qualities = await getAlivenessQualities();
  const updated = qualities.map(q =>
    q.id === qualityId ? { ...q, ...updates } : q
  );
  await AsyncStorage.setItem(STORAGE_KEYS.ALIVENESS_QUALITIES, JSON.stringify(updated));
}

/**
 * Add a custom quality
 */
export async function addCustomQuality(quality: Omit<AlivenessQuality, 'id'>): Promise<AlivenessQuality> {
  const qualities = await getAlivenessQualities();
  const newQuality: AlivenessQuality = {
    ...quality,
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  qualities.push(newQuality);
  await AsyncStorage.setItem(STORAGE_KEYS.ALIVENESS_QUALITIES, JSON.stringify(qualities));
  return newQuality;
}

/**
 * Remove a custom quality
 */
export async function removeCustomQuality(qualityId: string): Promise<void> {
  const qualities = await getAlivenessQualities();
  // Only allow removing custom qualities
  if (!qualityId.startsWith('custom_')) {
    throw new Error('Cannot remove default qualities');
  }
  const filtered = qualities.filter(q => q.id !== qualityId);
  await AsyncStorage.setItem(STORAGE_KEYS.ALIVENESS_QUALITIES, JSON.stringify(filtered));
}

/**
 * Reset to default qualities
 */
export async function resetQualitiesToDefaults(): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.ALIVENESS_QUALITIES,
    JSON.stringify([...DEFAULT_ALIVENESS_QUALITIES])
  );
}

// ============================================
// USER SIGNAL DETECTION
// ============================================

/**
 * Detect user's aliveness signals from their message
 */
export function detectUserAlivenessSignals(
  userMessage: string,
  audioMetrics?: {
    wordsPerMinute?: number;
    pauseCount?: number;
    averageVolume?: number;
    pitchVariability?: number;
    duration?: number;
  }
): UserAlivenessSignals {
  const text = userMessage.trim();

  // Text-based analysis
  const wordCount = text.split(/\s+/).length;
  const sentenceCount = (text.match(/[.!?]+/g) || []).length || 1;
  const exclamationCount = (text.match(/!/g) || []).length;
  const questionCount = (text.match(/\?/g) || []).length;
  const capsWordCount = (text.match(/\b[A-Z]{2,}\b/g) || []).length;
  const ellipsisCount = (text.match(/\.{2,}/g) || []).length;
  const lineBreakCount = (text.match(/\n/g) || []).length;

  // Determine speech rate (from text patterns or audio)
  let speechRate: UserAlivenessSignals['speechRate'] = 'normal';
  if (audioMetrics?.wordsPerMinute) {
    if (audioMetrics.wordsPerMinute < 100) speechRate = 'slow';
    else if (audioMetrics.wordsPerMinute > 180) speechRate = 'rushed';
    else if (audioMetrics.wordsPerMinute > 150) speechRate = 'fast';
  } else {
    // Infer from text patterns
    const avgWordsPerSentence = wordCount / sentenceCount;
    if (avgWordsPerSentence < 5) speechRate = 'rushed'; // Short choppy sentences
    else if (avgWordsPerSentence > 25) speechRate = 'slow'; // Long flowing sentences
    else if (exclamationCount > 2 || capsWordCount > 2) speechRate = 'fast';
  }

  // Determine punctuation intensity
  let punctuationIntensity: UserAlivenessSignals['punctuationIntensity'] = 'normal';
  const emphasisScore = exclamationCount * 2 + questionCount + capsWordCount * 3;
  if (emphasisScore === 0) punctuationIntensity = 'minimal';
  else if (emphasisScore > 6) punctuationIntensity = 'frantic';
  else if (emphasisScore > 3) punctuationIntensity = 'emphatic';

  // Determine message length
  let messageLength: UserAlivenessSignals['messageLength'] = 'normal';
  if (wordCount < 10) messageLength = 'terse';
  else if (wordCount > 150) messageLength = 'rambling';
  else if (wordCount > 75) messageLength = 'verbose';

  // Determine emotional intensity
  let emotionalIntensity: UserAlivenessSignals['emotionalIntensity'] = 'moderate';
  const emotionalScore = emphasisScore + (wordCount > 100 ? 2 : 0);
  if (emotionalScore === 0) emotionalIntensity = 'calm';
  else if (emotionalScore > 8) emotionalIntensity = 'intense';
  else if (emotionalScore > 4) emotionalIntensity = 'elevated';

  // Pause indicators
  const pauseIndicators = ellipsisCount + lineBreakCount;

  // Determine overall state
  let overallState: UserAlivenessSignals['overallState'] = 'normal';
  if (speechRate === 'rushed' || punctuationIntensity === 'frantic' || emotionalIntensity === 'intense') {
    overallState = 'dysregulated';
  } else if (speechRate === 'fast' || emotionalIntensity === 'elevated') {
    overallState = 'activated';
  } else if (pauseIndicators > 3 || speechRate === 'slow') {
    overallState = 'grounded';
  }

  // Calculate confidence
  let confidence = 0.6; // Base confidence for text-only
  if (audioMetrics?.wordsPerMinute) confidence = 0.85; // Higher with audio
  if (wordCount < 5) confidence *= 0.5; // Less confident with very short messages

  return {
    speechRate,
    punctuationIntensity,
    messageLength,
    emotionalIntensity,
    pauseIndicators,
    audioMetrics,
    overallState,
    confidence,
  };
}

// ============================================
// RESPONSE DIRECTIVE GENERATION
// ============================================

/**
 * Generate response directive based on user signals
 */
export async function generateAlivenessDirective(
  signals: UserAlivenessSignals
): Promise<AlivenessResponseDirective> {
  const settings = await getAlivenessSettings();

  const directive: AlivenessResponseDirective = {
    paceAdjustment: 'match',
    toneAdjustment: 'match',
    lengthGuidance: 'match',
    pauseGuidance: 'match',
    specificInstructions: [],
  };

  if (!settings.adaptiveResponseEnabled) {
    return directive;
  }

  const intensity = settings.intensityLevel;

  // Adjust based on user's overall state
  switch (signals.overallState) {
    case 'dysregulated':
      directive.paceAdjustment = 'slow_down';
      directive.toneAdjustment = 'ground';
      directive.pauseGuidance = 'add_pauses';
      directive.lengthGuidance = 'shorter';
      directive.specificInstructions.push(
        'User seems activated - slow down and ground them',
        'Use shorter sentences with natural breaks',
        'Acknowledge before advising',
        'Don\'t match their intensity - be a calm anchor'
      );
      break;

    case 'activated':
      directive.paceAdjustment = 'slow_down';
      directive.toneAdjustment = intensity === 'subtle' ? 'match' : 'ground';
      directive.specificInstructions.push(
        'User is energized - slight grounding without dampening',
        'Match enthusiasm but don\'t escalate'
      );
      break;

    case 'grounded':
      directive.paceAdjustment = 'match';
      directive.toneAdjustment = 'match';
      directive.pauseGuidance = 'match';
      directive.specificInstructions.push(
        'User is in a grounded state - match their settled energy',
        'Allow pauses and space in the response'
      );
      break;

    case 'normal':
    default:
      // Keep defaults
      break;
  }

  // Add specific adjustments based on individual signals
  if (signals.messageLength === 'terse') {
    directive.lengthGuidance = 'shorter';
    directive.specificInstructions.push('User is being brief - match with concise response');
  } else if (signals.messageLength === 'rambling') {
    directive.specificInstructions.push('User is processing at length - it\'s OK to be concise in response');
  }

  if (signals.pauseIndicators > 2) {
    directive.specificInstructions.push('User is using pauses (ellipses/breaks) - they may be processing');
  }

  return directive;
}

/**
 * Get aliveness directive formatted for LLM system prompt
 */
export async function getAlivenessDirectiveForLLM(
  signals: UserAlivenessSignals
): Promise<string> {
  const settings = await getAlivenessSettings();

  if (!settings.enabled || !settings.adaptiveResponseEnabled) {
    return '';
  }

  const directive = await generateAlivenessDirective(signals);

  if (directive.specificInstructions.length === 0) {
    return '';
  }

  const parts: string[] = [
    'ADAPTIVE ALIVENESS DIRECTIVE:',
    `User state detected: ${signals.overallState} (confidence: ${Math.round(signals.confidence * 100)}%)`,
  ];

  if (directive.paceAdjustment !== 'match') {
    parts.push(`Pace: ${directive.paceAdjustment.replace('_', ' ')}`);
  }
  if (directive.toneAdjustment !== 'match') {
    parts.push(`Tone: ${directive.toneAdjustment}`);
  }
  if (directive.lengthGuidance !== 'match') {
    parts.push(`Length: ${directive.lengthGuidance}`);
  }

  parts.push('');
  parts.push('Instructions:');
  for (const instruction of directive.specificInstructions) {
    parts.push(`- ${instruction}`);
  }

  return parts.join('\n');
}

// ============================================
// ALIVENESS CONTEXT FOR LLM
// ============================================

/**
 * Get aliveness qualities formatted for LLM system prompt
 */
export async function getAlivenessContextForLLM(): Promise<string> {
  const settings = await getAlivenessSettings();

  if (!settings.enabled) {
    return '';
  }

  const qualities = await getAlivenessQualities();
  const enabledQualities = qualities.filter(q => q.enabled);

  if (enabledQualities.length === 0) {
    return '';
  }

  const parts: string[] = [
    'ALIVENESS QUALITIES (what makes your responses feel ALIVE not ANIMATED):',
    '',
  ];

  for (const quality of enabledQualities) {
    if (quality.weight >= 0.7) {
      parts.push(`**${quality.name}**: ${quality.coachingImplication}`);
    } else {
      parts.push(`${quality.name}: ${quality.coachingImplication}`);
    }
  }

  parts.push('');
  parts.push('Remember: You are a living presence, not a performance. Understate rather than dramatize. Be consistent but not symmetrical. Allow pauses and imperfection.');

  return parts.join('\n');
}

// ============================================
// AUDIO ANALYSIS (PLACEHOLDER)
// ============================================

/**
 * Analyze audio prosody
 *
 * NOTE: This is a placeholder. Actual implementation requires either:
 * 1. Backend service with Python (librosa, praat)
 * 2. Integration with AssemblyAI, Deepgram, or similar
 * 3. Native module for on-device processing
 */
export async function analyzeAudioProsody(
  audioUri: string
): Promise<AudioProsodyAnalysis | null> {
  // TODO: Implement actual audio analysis
  console.log('[Aliveness] Audio analysis not yet implemented for:', audioUri);
  return null;
}

/**
 * Calculate aliveness scores from prosody data
 */
export function calculateAlivenessFromProsody(
  prosody: AudioProsodyAnalysis
): {
  imperfectRhythm: number;
  naturalLatency: number;
  amplitudeRestraint: number;
  overallAliveness: number;
} {
  // Rhythm irregularity contributes to imperfect rhythm
  const imperfectRhythm = 1 - prosody.rhythmRegularity;

  // Pause patterns indicate natural latency
  const naturalLatency = Math.min(1, prosody.pauseFrequency / 10);

  // Volume variance shows restraint (less variance = more restraint)
  const amplitudeRestraint = 1 - Math.min(1, prosody.volumeVariance / 20);

  // Overall aliveness is a weighted average
  const overallAliveness = (
    imperfectRhythm * 0.3 +
    naturalLatency * 0.3 +
    amplitudeRestraint * 0.4
  );

  return {
    imperfectRhythm,
    naturalLatency,
    amplitudeRestraint,
    overallAliveness,
  };
}

// ============================================
// TESTING
// ============================================

/**
 * Test adaptive aliveness with sample messages
 */
export async function testAdaptiveAliveness(): Promise<{
  tests: Array<{
    message: string;
    signals: UserAlivenessSignals;
    directive: string;
  }>;
}> {
  const testMessages = [
    'I feel okay today',
    'THIS IS CRAZY!!! I can\'t believe what just happened!!! OMG!!!',
    'I don\'t know... maybe... it\'s just... hard to explain...',
    'So I was thinking about what you said yesterday and it really got me going because I realized that there are so many things I need to work on and I want to tackle them all at once but I know that might not be the best approach so I wanted to ask you what you think about prioritizing and whether I should focus on one thing at a time or try to make progress on multiple fronts',
    'Fine.',
  ];

  const tests = [];

  for (const message of testMessages) {
    const signals = detectUserAlivenessSignals(message);
    const directive = await getAlivenessDirectiveForLLM(signals);
    tests.push({ message, signals, directive });
  }

  return { tests };
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Settings
  getAlivenessSettings,
  updateAlivenessSettings,
  isAlivenessEnabled,

  // Qualities
  getAlivenessQualities,
  updateAlivenessQuality,
  addCustomQuality,
  removeCustomQuality,
  resetQualitiesToDefaults,

  // Detection & Directives
  detectUserAlivenessSignals,
  generateAlivenessDirective,
  getAlivenessDirectiveForLLM,
  getAlivenessContextForLLM,

  // Audio (placeholder)
  analyzeAudioProsody,
  calculateAlivenessFromProsody,

  // Testing
  testAdaptiveAliveness,

  // Constants
  DEFAULT_ALIVENESS_QUALITIES,
};
