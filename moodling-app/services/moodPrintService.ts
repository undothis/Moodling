/**
 * MoodPrint Service
 *
 * MoodPrint is the synthesis of everything we know about a person.
 * It combines:
 * - Cognitive Profile: HOW they think
 * - Memory Tiers: WHAT they've shared
 * - Conversation Patterns: HOW to talk to them
 * - Human Scores: HOW WELL we're doing
 *
 * Think of it as a person's unique fingerprint - not who they are,
 * but how they experience and process the world.
 */

import {
  getCognitiveProfile,
  getCoachAdaptations,
  getCognitiveProfileContextForLLM,
  CognitiveProfile,
  CoachAdaptations,
} from './cognitiveProfileService';

import {
  getLongTermMemory,
  getMidTermMemories,
  getCurrentSession,
  getMemoryContextForLLM,
  LongTermMemory,
  MidTermMemory,
  ShortTermMemory,
} from './memoryTierService';

import {
  getScoreStats,
  ScoreStats,
} from './humanScoreService';

import {
  buildConversationContext,
  generateResponseDirectives,
  ResponseDirectives,
  ConversationContext,
} from './conversationController';

// ============================================================================
// Types
// ============================================================================

export interface MoodPrint {
  // Identity
  id: string;
  createdAt: string;
  lastUpdated: string;

  // Core components
  cognitiveProfile: CognitiveProfile;
  coachAdaptations: CoachAdaptations;
  longTermMemory: LongTermMemory;

  // Patterns learned over time
  patterns: MoodPrintPatterns;

  // Current state
  currentState: MoodPrintCurrentState;

  // Quality metrics
  qualityMetrics: MoodPrintQualityMetrics;
}

export interface MoodPrintPatterns {
  // Communication patterns
  preferredResponseLength: 'brief' | 'moderate' | 'detailed';
  preferredTone: 'gentle' | 'warm' | 'energetic' | 'direct' | 'playful';

  // Emotional patterns
  typicalMoodRange: string[];
  emotionalTriggers: string[];
  calmingFactors: string[];

  // Engagement patterns
  peakEngagementTimes: string[];  // e.g., ["morning", "late_night"]
  averageSessionLength: number;   // minutes
  topicsOfInterest: string[];

  // Response patterns
  respondsWellTo: string[];       // e.g., ["metaphors", "validation", "humor"]
  doesNotRespondWellTo: string[]; // e.g., ["direct advice", "too many questions"]
}

export interface MoodPrintCurrentState {
  // Session info
  isInSession: boolean;
  currentSessionId?: string;
  sessionStartTime?: string;

  // Current emotional state
  currentMood?: string;
  currentEnergy?: 'low' | 'medium' | 'high';

  // Recent context
  recentTopics: string[];
  recentMoods: string[];
  messageCountToday: number;
}

export interface MoodPrintQualityMetrics {
  // Scoring stats
  averageHumannessScore: number;
  totalExchangesScored: number;
  commonIssues: string[];

  // Profile completeness
  profileCompleteness: number;  // 0-100
  onboardingComplete: boolean;

  // Memory depth
  shortTermMessages: number;
  midTermSummaries: number;
  longTermEntries: number;
}

export interface MoodPrintSummary {
  // One-liner description
  summary: string;

  // Key traits (3-5)
  keyTraits: string[];

  // How to communicate
  communicationGuide: string;

  // Current adaptations active
  activeAdaptations: string[];
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Generate the complete MoodPrint for the current user
 * This is the synthesis of all systems
 */
export async function getMoodPrint(): Promise<MoodPrint> {
  // Load all components in parallel
  const [
    cognitiveProfile,
    coachAdaptations,
    longTermMemory,
    midTermMemories,
    currentSession,
    scoreStats,
  ] = await Promise.all([
    getCognitiveProfile(),
    getCoachAdaptations(),
    getLongTermMemory(),
    getMidTermMemories(),
    getCurrentSession(),
    getScoreStats(),
  ]);

  // Build patterns from memory and profile
  const patterns = buildPatterns(cognitiveProfile, longTermMemory, midTermMemories);

  // Build current state
  const currentState = buildCurrentState(currentSession);

  // Build quality metrics
  const qualityMetrics = buildQualityMetrics(
    cognitiveProfile,
    longTermMemory,
    midTermMemories,
    currentSession,
    scoreStats
  );

  return {
    id: `moodprint_${Date.now()}`,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    cognitiveProfile,
    coachAdaptations,
    longTermMemory,
    patterns,
    currentState,
    qualityMetrics,
  };
}

/**
 * Get a concise summary of the MoodPrint
 * Useful for quick context or display
 */
export async function getMoodPrintSummary(): Promise<MoodPrintSummary> {
  const moodPrint = await getMoodPrint();

  // Build summary based on profile
  const summary = buildSummaryText(moodPrint);

  // Extract key traits
  const keyTraits = extractKeyTraits(moodPrint);

  // Build communication guide
  const communicationGuide = buildCommunicationGuide(moodPrint);

  // List active adaptations
  const activeAdaptations = getActiveAdaptations(moodPrint);

  return {
    summary,
    keyTraits,
    communicationGuide,
    activeAdaptations,
  };
}

/**
 * Get MoodPrint context formatted for LLM injection
 * This is what gets sent to Claude in the system prompt
 */
export async function getMoodPrintContextForLLM(): Promise<string> {
  const [cognitiveContext, memoryContext] = await Promise.all([
    getCognitiveProfileContextForLLM(),
    getMemoryContextForLLM(),
  ]);

  const summary = await getMoodPrintSummary();

  const sections: string[] = [];

  sections.push('=== MOODPRINT (User Understanding) ===');
  sections.push('');
  sections.push(`Summary: ${summary.summary}`);
  sections.push('');
  sections.push('Key traits:');
  summary.keyTraits.forEach(trait => {
    sections.push(`- ${trait}`);
  });
  sections.push('');
  sections.push(`Communication: ${summary.communicationGuide}`);
  sections.push('');

  if (cognitiveContext) {
    sections.push(cognitiveContext);
    sections.push('');
  }

  if (memoryContext) {
    sections.push(memoryContext);
  }

  return sections.join('\n');
}

/**
 * Generate response directives using the full MoodPrint
 * This combines conversation context with cognitive adaptations
 */
export async function generateMoodPrintDirectives(
  sessionId: string,
  messages: Array<{ role: string; content: string }>,
  lastMessage: string
): Promise<ResponseDirectives> {
  const ctx = await buildConversationContext(sessionId, messages, lastMessage);
  return generateResponseDirectives(ctx);
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildPatterns(
  profile: CognitiveProfile,
  longTerm: LongTermMemory,
  midTerm: MidTermMemory[]
): MoodPrintPatterns {
  // Determine preferred response length from profile
  let preferredLength: 'brief' | 'moderate' | 'detailed' = 'moderate';
  if (longTerm.communicationStyle.prefersBriefResponses) {
    preferredLength = 'brief';
  } else if (profile.communicationStyle === 'exploratory') {
    preferredLength = 'detailed';
  }

  // Determine preferred tone
  let preferredTone: 'gentle' | 'warm' | 'energetic' | 'direct' | 'playful' = 'warm';
  if (profile.communicationStyle === 'direct') {
    preferredTone = 'direct';
  } else if (profile.emotionalProcessing === 'feeler_first') {
    preferredTone = 'gentle';
  }

  // Extract topics from mid-term memories
  const topicsOfInterest: string[] = [];
  midTerm.forEach(memory => {
    topicsOfInterest.push(...memory.themes);
  });

  // Build responds well to list
  const respondsWellTo: string[] = [];
  if (profile.communicationStyle === 'metaphorical') {
    respondsWellTo.push('metaphors');
  }
  if (profile.emotionalProcessing === 'feeler_first') {
    respondsWellTo.push('validation');
  }
  if (longTerm.communicationStyle.respondsToHumor) {
    respondsWellTo.push('humor');
  }
  if (profile.learningStyles.includes('visual')) {
    respondsWellTo.push('visual descriptions');
  }

  // Build does not respond well to list
  const doesNotRespondWellTo: string[] = [];
  if (profile.emotionalProcessing === 'feeler_first') {
    doesNotRespondWellTo.push('immediate solutions');
  }
  if (profile.structurePreference === 'needs_flexibility') {
    doesNotRespondWellTo.push('rigid structure');
  }
  if (longTerm.communicationStyle.prefersBriefResponses) {
    doesNotRespondWellTo.push('long explanations');
  }

  return {
    preferredResponseLength: preferredLength,
    preferredTone: preferredTone,
    typicalMoodRange: [],  // Would be built from session history
    emotionalTriggers: longTerm.patterns.triggers,
    calmingFactors: longTerm.patterns.calmingFactors,
    peakEngagementTimes: [],
    averageSessionLength: 0,
    topicsOfInterest: [...new Set(topicsOfInterest)],
    respondsWellTo,
    doesNotRespondWellTo,
  };
}

function buildCurrentState(session: ShortTermMemory | null): MoodPrintCurrentState {
  if (!session) {
    return {
      isInSession: false,
      recentTopics: [],
      recentMoods: [],
      messageCountToday: 0,
    };
  }

  return {
    isInSession: true,
    currentSessionId: session.sessionId,
    sessionStartTime: session.startTime,
    currentMood: session.currentMood,
    currentEnergy: session.currentEnergy,
    recentTopics: session.topicsDiscussed,
    recentMoods: session.emotionalArc,
    messageCountToday: session.messages.length,
  };
}

function buildQualityMetrics(
  profile: CognitiveProfile,
  longTerm: LongTermMemory,
  midTerm: MidTermMemory[],
  session: ShortTermMemory | null,
  scoreStats: ScoreStats
): MoodPrintQualityMetrics {
  // Calculate profile completeness
  let completeness = 0;
  if (profile.primaryProcessing !== 'patterns') completeness += 15; // Has been set
  if (profile.learningStyles.length > 0) completeness += 15;
  if (profile.socialOrientation !== 'situational') completeness += 15;
  if (profile.emotionalProcessing !== 'integrated') completeness += 15;
  if (profile.communicationStyle !== 'collaborative') completeness += 15;
  if (profile.structurePreference !== 'emergent') completeness += 15;
  if (profile.onboardingComplete) completeness = 100;

  // Count long-term entries
  const longTermEntries =
    longTerm.lifeContext.relationships.length +
    longTerm.lifeContext.majorLifeEvents.length +
    longTerm.patterns.triggers.length +
    longTerm.patterns.calmingFactors.length;

  return {
    averageHumannessScore: scoreStats.averageScore,
    totalExchangesScored: scoreStats.totalExchanges,
    commonIssues: scoreStats.commonIssues,
    profileCompleteness: completeness,
    onboardingComplete: profile.onboardingComplete,
    shortTermMessages: session?.messages.length || 0,
    midTermSummaries: midTerm.length,
    longTermEntries,
  };
}

function buildSummaryText(moodPrint: MoodPrint): string {
  const profile = moodPrint.cognitiveProfile;

  const processingDescriptions: Record<string, string> = {
    patterns: 'sees connections and systems',
    details: 'notices specifics and steps',
    stories: 'understands through narrative',
    feelings: 'processes through emotions first',
    actions: 'learns by doing',
    synthesis: 'pulls from multiple sources',
  };

  const emotionalDescriptions: Record<string, string> = {
    feeler_first: 'emotions come first',
    thinker_first: 'logic leads',
    integrated: 'emotions and logic intertwined',
    action_oriented: 'processes through doing',
    delayed: 'emotions surface later',
  };

  const processing = processingDescriptions[profile.primaryProcessing] || 'thinks uniquely';
  const emotional = emotionalDescriptions[profile.emotionalProcessing] || 'processes emotions';

  return `Someone who ${processing}, where ${emotional}.`;
}

function extractKeyTraits(moodPrint: MoodPrint): string[] {
  const traits: string[] = [];
  const profile = moodPrint.cognitiveProfile;
  const adaptations = moodPrint.coachAdaptations;

  // Processing style trait
  const processingTraits: Record<string, string> = {
    patterns: 'Systems thinker',
    details: 'Detail-oriented',
    stories: 'Narrative learner',
    feelings: 'Emotionally intuitive',
    actions: 'Hands-on learner',
    synthesis: 'Integrative thinker',
  };
  if (processingTraits[profile.primaryProcessing]) {
    traits.push(processingTraits[profile.primaryProcessing]);
  }

  // Communication trait
  const commTraits: Record<string, string> = {
    direct: 'Prefers directness',
    exploratory: 'Thinks out loud',
    reflective: 'Needs processing time',
    collaborative: 'Builds understanding together',
    metaphorical: 'Learns through metaphors',
  };
  if (commTraits[profile.communicationStyle]) {
    traits.push(commTraits[profile.communicationStyle]);
  }

  // Emotional trait
  if (profile.emotionalProcessing === 'feeler_first') {
    traits.push('Needs validation first');
  } else if (profile.emotionalProcessing === 'thinker_first') {
    traits.push('Prefers solutions');
  }

  // Social trait
  const socialTraits: Record<string, string> = {
    energized_by_people: 'Extroverted',
    drained_by_people: 'Introverted',
    selective: 'Selective socializer',
    situational: 'Context-dependent social needs',
  };
  if (socialTraits[profile.socialOrientation]) {
    traits.push(socialTraits[profile.socialOrientation]);
  }

  // Structure trait
  if (profile.structurePreference === 'loves_structure') {
    traits.push('Loves structure');
  } else if (profile.structurePreference === 'needs_flexibility') {
    traits.push('Needs flexibility');
  }

  return traits.slice(0, 5);  // Max 5 traits
}

function buildCommunicationGuide(moodPrint: MoodPrint): string {
  const adaptations = moodPrint.coachAdaptations;
  const parts: string[] = [];

  if (adaptations.validateFirst) {
    parts.push('validate emotions first');
  }
  if (adaptations.useMetaphors) {
    parts.push('use metaphors');
  }
  if (adaptations.showBigPicture) {
    parts.push('connect to bigger picture');
  }
  if (adaptations.allowWandering) {
    parts.push('let conversation explore');
  }
  if (adaptations.giveTimeToThink) {
    parts.push("don't rush");
  }
  if (!adaptations.provideStructure) {
    parts.push("don't over-organize");
  }

  if (parts.length === 0) {
    return 'Be warm and responsive.';
  }

  return parts.join(', ') + '.';
}

function getActiveAdaptations(moodPrint: MoodPrint): string[] {
  const adaptations = moodPrint.coachAdaptations;
  const active: string[] = [];

  if (adaptations.useMetaphors) active.push('Using metaphors');
  if (adaptations.useExamples) active.push('Providing examples');
  if (adaptations.useStepByStep) active.push('Step-by-step explanations');
  if (adaptations.showBigPicture) active.push('Big picture context');
  if (adaptations.validateFirst) active.push('Validation before solutions');
  if (adaptations.allowWandering) active.push('Exploratory conversation');
  if (adaptations.provideStructure) active.push('Structured responses');
  if (adaptations.giveTimeToThink) active.push('Pacing for reflection');

  return active;
}

// ============================================================================
// Export/Debug
// ============================================================================

/**
 * Export the full MoodPrint as JSON
 * Useful for backup or debugging
 */
export async function exportMoodPrint(): Promise<string> {
  const moodPrint = await getMoodPrint();
  return JSON.stringify(moodPrint, null, 2);
}

/**
 * Get a debug view of what's in the MoodPrint
 */
export async function debugMoodPrint(): Promise<void> {
  const moodPrint = await getMoodPrint();
  const summary = await getMoodPrintSummary();

  console.log('=== MOODPRINT DEBUG ===');
  console.log('');
  console.log('Summary:', summary.summary);
  console.log('');
  console.log('Key Traits:', summary.keyTraits.join(', '));
  console.log('');
  console.log('Communication Guide:', summary.communicationGuide);
  console.log('');
  console.log('Active Adaptations:', summary.activeAdaptations.join(', '));
  console.log('');
  console.log('Quality Metrics:');
  console.log('  - Average Score:', moodPrint.qualityMetrics.averageHumannessScore);
  console.log('  - Exchanges Scored:', moodPrint.qualityMetrics.totalExchangesScored);
  console.log('  - Profile Completeness:', moodPrint.qualityMetrics.profileCompleteness + '%');
  console.log('  - Onboarding Complete:', moodPrint.qualityMetrics.onboardingComplete);
  console.log('');
  console.log('Patterns:');
  console.log('  - Responds well to:', moodPrint.patterns.respondsWellTo.join(', '));
  console.log('  - Does not respond well to:', moodPrint.patterns.doesNotRespondWellTo.join(', '));
}
