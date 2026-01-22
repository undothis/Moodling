/**
 * Social Connection Health Service
 *
 * This service prevents the app from becoming a replacement for real human connection.
 * It tracks isolation signals and actively nudges users toward:
 * - Friends and family
 * - Community and support groups
 * - Professional help (therapists, counselors)
 *
 * WHY THIS EXISTS:
 * A wellness app can accidentally become an isolating force if users turn to it
 * instead of humans. We believe: "Humans need humans." This service ensures
 * we're always pushing users toward real connection, not away from it.
 *
 * INTEGRATES WITH: Core Principle Kernel (connection constraints)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkHardConstraints, CORE_BELIEFS } from './corePrincipleKernel';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  CONNECTION_HEALTH: 'moodleaf_connection_health',
  INTERACTION_LOG: 'moodleaf_social_interaction_log',
  NUDGE_HISTORY: 'moodleaf_connection_nudge_history',
  EXTERNAL_SUPPORT: 'moodleaf_external_support',
};

// ============================================
// TYPES
// ============================================

export type IsolationLevel = 'none' | 'mild' | 'moderate' | 'severe';

export type SocialInteractionFrequency = 'frequent' | 'occasional' | 'rare' | 'none';

export type ExternalSupportType =
  | 'therapist'
  | 'counselor'
  | 'psychiatrist'
  | 'support_group'
  | 'community_group'
  | 'religious_community'
  | 'close_friend'
  | 'family_support'
  | 'peer_support'
  | 'other';

export interface ExternalSupport {
  type: ExternalSupportType;
  name?: string;           // Optional name (e.g., "Dr. Smith", "AA group")
  frequency?: string;      // How often they see them
  isActive: boolean;
  addedAt: string;
}

export interface SocialInteraction {
  id: string;
  timestamp: string;
  type: 'mentioned_friend' | 'mentioned_family' | 'mentioned_group' |
        'mentioned_therapist' | 'positive_social' | 'negative_social';
  context?: string;        // Brief context of what they mentioned
}

export interface ConnectionHealthState {
  // Overall assessment
  isolationLevel: IsolationLevel;
  socialInteractionFrequency: SocialInteractionFrequency;

  // Tracking
  lastMentionedFriend: string | null;
  lastMentionedFamily: string | null;
  lastMentionedTherapist: string | null;
  lastMentionedSocialActivity: string | null;

  // External support network
  hasExternalSupport: boolean;
  externalSupports: ExternalSupport[];

  // App dependency signals
  appDependencySignals: string[];
  appUsagePatterns: {
    lateNightOnlyUsage: boolean;       // Only uses app late at night
    dailyVenting: boolean;             // Vents daily without mentioning others
    noOutsideMentions: number;         // Days since mentioning anyone outside
    highFrequencyShortSessions: boolean; // Many short sessions (checking in constantly)
  };

  // Nudge tracking
  lastConnectionNudge: string | null;
  lastTherapyNudge: string | null;
  nudgesSinceLastMention: number;

  // Metadata
  lastUpdated: string;
  assessmentConfidence: number;        // 0-100
}

export interface ConnectionNudge {
  type: 'gentle' | 'direct' | 'urgent' | 'resource';
  category: 'friend' | 'family' | 'professional' | 'community' | 'crisis';
  message: string;
  resources?: ExternalResource[];
}

export interface ExternalResource {
  name: string;
  type: 'hotline' | 'website' | 'app' | 'local' | 'professional';
  contact?: string;        // Phone number or URL
  description: string;
  available24h?: boolean;
}

// ============================================
// DEFAULT STATE
// ============================================

const DEFAULT_CONNECTION_HEALTH: ConnectionHealthState = {
  isolationLevel: 'none',
  socialInteractionFrequency: 'occasional',

  lastMentionedFriend: null,
  lastMentionedFamily: null,
  lastMentionedTherapist: null,
  lastMentionedSocialActivity: null,

  hasExternalSupport: false,
  externalSupports: [],

  appDependencySignals: [],
  appUsagePatterns: {
    lateNightOnlyUsage: false,
    dailyVenting: false,
    noOutsideMentions: 0,
    highFrequencyShortSessions: false,
  },

  lastConnectionNudge: null,
  lastTherapyNudge: null,
  nudgesSinceLastMention: 0,

  lastUpdated: new Date().toISOString(),
  assessmentConfidence: 0,
};

// ============================================
// EXTERNAL RESOURCES (Crisis and Support)
// ============================================

export const CRISIS_RESOURCES: ExternalResource[] = [
  {
    name: '988 Suicide & Crisis Lifeline',
    type: 'hotline',
    contact: '988',
    description: 'Free, confidential support 24/7 for people in distress',
    available24h: true,
  },
  {
    name: 'Crisis Text Line',
    type: 'hotline',
    contact: 'Text HOME to 741741',
    description: 'Free crisis support via text message',
    available24h: true,
  },
  {
    name: 'International Association for Suicide Prevention',
    type: 'website',
    contact: 'https://www.iasp.info/resources/Crisis_Centres/',
    description: 'Find crisis centers worldwide',
  },
];

export const PROFESSIONAL_RESOURCES: ExternalResource[] = [
  {
    name: 'Psychology Today Therapist Finder',
    type: 'website',
    contact: 'https://www.psychologytoday.com/us/therapists',
    description: 'Find therapists in your area with filters for specialty, insurance, etc.',
  },
  {
    name: 'Open Path Collective',
    type: 'website',
    contact: 'https://openpathcollective.org/',
    description: 'Affordable therapy ($30-$80 per session)',
  },
  {
    name: 'BetterHelp / Talkspace',
    type: 'app',
    description: 'Online therapy platforms with licensed counselors',
  },
];

export const COMMUNITY_RESOURCES: ExternalResource[] = [
  {
    name: 'NAMI Support Groups',
    type: 'local',
    contact: 'https://www.nami.org/Support-Education/Support-Groups',
    description: 'Free peer-led support groups for mental health',
  },
  {
    name: 'Meetup.com',
    type: 'website',
    contact: 'https://www.meetup.com/',
    description: 'Find local groups based on interests - great for building community',
  },
  {
    name: '7 Cups',
    type: 'app',
    contact: 'https://www.7cups.com/',
    description: 'Free online chat with trained listeners',
    available24h: true,
  },
];

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Get current connection health state
 */
export async function getConnectionHealth(): Promise<ConnectionHealthState> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CONNECTION_HEALTH);
    if (stored) {
      return JSON.parse(stored);
    }
    return { ...DEFAULT_CONNECTION_HEALTH };
  } catch (error) {
    console.error('[ConnectionHealth] Failed to load state:', error);
    return { ...DEFAULT_CONNECTION_HEALTH };
  }
}

/**
 * Update connection health state
 */
async function updateConnectionHealth(
  updates: Partial<ConnectionHealthState>
): Promise<ConnectionHealthState> {
  const current = await getConnectionHealth();
  const updated: ConnectionHealthState = {
    ...current,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };

  await AsyncStorage.setItem(
    STORAGE_KEYS.CONNECTION_HEALTH,
    JSON.stringify(updated)
  );

  return updated;
}

// ============================================
// SIGNAL DETECTION
// ============================================

/**
 * Keywords and phrases that indicate social connection
 */
const SOCIAL_INDICATORS = {
  friends: [
    'my friend', 'a friend', 'friends', 'buddy', 'bestie', 'best friend',
    'hung out with', 'met up with', 'talked to', 'called my friend',
    'texted my friend', 'went out with'
  ],
  family: [
    'my mom', 'my dad', 'my mother', 'my father', 'my parents',
    'my sister', 'my brother', 'my sibling', 'my family',
    'my partner', 'my husband', 'my wife', 'my spouse',
    'my son', 'my daughter', 'my kids', 'my child'
  ],
  professional: [
    'my therapist', 'my counselor', 'my psychiatrist', 'my doctor',
    'therapy session', 'counseling', 'in therapy', 'seeing a therapist',
    'support group', 'group therapy', 'aa meeting', 'na meeting'
  ],
  social_activity: [
    'went to', 'meeting with', 'group', 'club', 'community',
    'church', 'mosque', 'synagogue', 'temple', 'volunteer',
    'coworkers', 'colleagues', 'team'
  ],
  positive_social: [
    'had a great time', 'felt connected', 'helped me', 'supported me',
    'listened to me', 'understood me', 'we laughed', 'good conversation'
  ],
  isolation_signals: [
    'no one to talk to', 'no friends', 'alone', 'lonely', 'isolated',
    'no one understands', 'no one cares', 'by myself', 'just me',
    'only you understand', 'you\'re the only one', 'no one else'
  ],
  app_dependency: [
    'you\'re the only one I can talk to',
    'i only have you',
    'at least i have you',
    'you understand me better',
    'people don\'t get me like you do',
    'i prefer talking to you'
  ]
};

/**
 * Analyze user message for social connection signals
 */
export async function analyzeMessageForConnectionSignals(
  message: string
): Promise<{
  mentionedFriend: boolean;
  mentionedFamily: boolean;
  mentionedProfessional: boolean;
  mentionedSocialActivity: boolean;
  positiveSocialMention: boolean;
  isolationSignal: boolean;
  appDependencySignal: boolean;
  detectedPhrases: string[];
}> {
  const messageLower = message.toLowerCase();
  const detectedPhrases: string[] = [];

  // Check each category
  const mentionedFriend = SOCIAL_INDICATORS.friends.some(phrase => {
    if (messageLower.includes(phrase)) {
      detectedPhrases.push(phrase);
      return true;
    }
    return false;
  });

  const mentionedFamily = SOCIAL_INDICATORS.family.some(phrase => {
    if (messageLower.includes(phrase)) {
      detectedPhrases.push(phrase);
      return true;
    }
    return false;
  });

  const mentionedProfessional = SOCIAL_INDICATORS.professional.some(phrase => {
    if (messageLower.includes(phrase)) {
      detectedPhrases.push(phrase);
      return true;
    }
    return false;
  });

  const mentionedSocialActivity = SOCIAL_INDICATORS.social_activity.some(phrase => {
    if (messageLower.includes(phrase)) {
      detectedPhrases.push(phrase);
      return true;
    }
    return false;
  });

  const positiveSocialMention = SOCIAL_INDICATORS.positive_social.some(phrase => {
    if (messageLower.includes(phrase)) {
      detectedPhrases.push(phrase);
      return true;
    }
    return false;
  });

  const isolationSignal = SOCIAL_INDICATORS.isolation_signals.some(phrase => {
    if (messageLower.includes(phrase)) {
      detectedPhrases.push(phrase);
      return true;
    }
    return false;
  });

  const appDependencySignal = SOCIAL_INDICATORS.app_dependency.some(phrase => {
    if (messageLower.includes(phrase)) {
      detectedPhrases.push(phrase);
      return true;
    }
    return false;
  });

  return {
    mentionedFriend,
    mentionedFamily,
    mentionedProfessional,
    mentionedSocialActivity,
    positiveSocialMention,
    isolationSignal,
    appDependencySignal,
    detectedPhrases,
  };
}

/**
 * Process a user message and update connection health
 * Call this on every user message
 */
export async function processMessageForConnectionHealth(
  message: string
): Promise<{
  health: ConnectionHealthState;
  shouldNudge: boolean;
  nudgeType?: 'connection' | 'professional' | 'crisis';
}> {
  const signals = await analyzeMessageForConnectionSignals(message);
  const current = await getConnectionHealth();
  const now = new Date().toISOString();

  let updates: Partial<ConnectionHealthState> = {};
  let shouldNudge = false;
  let nudgeType: 'connection' | 'professional' | 'crisis' | undefined;

  // Update last mention timestamps
  if (signals.mentionedFriend) {
    updates.lastMentionedFriend = now;
    updates.nudgesSinceLastMention = 0;
  }
  if (signals.mentionedFamily) {
    updates.lastMentionedFamily = now;
    updates.nudgesSinceLastMention = 0;
  }
  if (signals.mentionedProfessional) {
    updates.lastMentionedTherapist = now;
    updates.hasExternalSupport = true;
    updates.nudgesSinceLastMention = 0;
  }
  if (signals.mentionedSocialActivity) {
    updates.lastMentionedSocialActivity = now;
    updates.nudgesSinceLastMention = 0;
  }

  // Track isolation signals
  if (signals.isolationSignal) {
    const currentSignals = [...current.appDependencySignals, 'isolation_expressed'];
    updates.appDependencySignals = currentSignals.slice(-10); // Keep last 10
    shouldNudge = true;
    nudgeType = 'connection';
  }

  // Track app dependency signals
  if (signals.appDependencySignal) {
    const currentSignals = [...current.appDependencySignals, 'app_dependency_expressed'];
    updates.appDependencySignals = currentSignals.slice(-10);
    shouldNudge = true;
    nudgeType = 'professional'; // App dependency warrants professional suggestion
  }

  // Calculate isolation level
  const isolationLevel = calculateIsolationLevel({
    ...current,
    ...updates,
  });
  updates.isolationLevel = isolationLevel;

  // Update confidence based on data points
  const dataPoints = [
    current.lastMentionedFriend,
    current.lastMentionedFamily,
    current.lastMentionedTherapist,
  ].filter(Boolean).length;
  updates.assessmentConfidence = Math.min(100, dataPoints * 20 + 20);

  // Determine if nudge is needed
  if (!shouldNudge && isolationLevel === 'moderate') {
    // Check if we haven't nudged recently
    const lastNudge = current.lastConnectionNudge;
    if (!lastNudge || daysSince(lastNudge) >= 3) {
      shouldNudge = true;
      nudgeType = 'connection';
    }
  }

  if (!shouldNudge && isolationLevel === 'severe') {
    shouldNudge = true;
    nudgeType = 'professional';
  }

  // Update state
  const health = await updateConnectionHealth(updates);

  return { health, shouldNudge, nudgeType };
}

/**
 * Calculate isolation level based on signals
 */
function calculateIsolationLevel(state: Partial<ConnectionHealthState>): IsolationLevel {
  let isolationScore = 0;

  // No recent mentions of others
  if (!state.lastMentionedFriend || daysSince(state.lastMentionedFriend) > 14) {
    isolationScore += 2;
  }
  if (!state.lastMentionedFamily || daysSince(state.lastMentionedFamily) > 14) {
    isolationScore += 2;
  }

  // App dependency signals
  const dependencySignals = state.appDependencySignals?.length || 0;
  isolationScore += Math.min(3, dependencySignals);

  // Usage patterns
  if (state.appUsagePatterns?.lateNightOnlyUsage) isolationScore += 1;
  if (state.appUsagePatterns?.dailyVenting) isolationScore += 1;
  if (state.appUsagePatterns?.noOutsideMentions && state.appUsagePatterns.noOutsideMentions > 7) {
    isolationScore += 2;
  }

  // No external support
  if (!state.hasExternalSupport) isolationScore += 1;

  // Map score to level
  if (isolationScore <= 2) return 'none';
  if (isolationScore <= 5) return 'mild';
  if (isolationScore <= 8) return 'moderate';
  return 'severe';
}

/**
 * Helper: days since a date
 */
function daysSince(isoDate: string): number {
  const then = new Date(isoDate);
  const now = new Date();
  const diff = now.getTime() - then.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ============================================
// NUDGE GENERATION
// ============================================

/**
 * Generate an appropriate connection nudge based on current state
 */
export async function generateConnectionNudge(
  type: 'connection' | 'professional' | 'crisis'
): Promise<ConnectionNudge> {
  const health = await getConnectionHealth();

  if (type === 'crisis') {
    return {
      type: 'urgent',
      category: 'crisis',
      message: "I'm really glad you're talking about this, and I want to make sure you have the support you need. Please consider reaching out to a crisis line - they're trained to help and available 24/7. You don't have to go through this alone.",
      resources: CRISIS_RESOURCES,
    };
  }

  if (type === 'professional') {
    // Tailor based on whether they already have support
    if (health.hasExternalSupport) {
      return {
        type: 'gentle',
        category: 'professional',
        message: "It sounds like you might benefit from talking through this with your therapist/counselor. Have you had a chance to bring this up with them?",
      };
    } else {
      return {
        type: 'direct',
        category: 'professional',
        message: "What you're describing sounds like something that could really benefit from professional support. Therapists can offer tools and perspectives that go beyond what any app can provide. Would you be open to exploring that?",
        resources: PROFESSIONAL_RESOURCES,
      };
    }
  }

  // Connection nudge - tailor based on isolation level
  if (health.isolationLevel === 'severe') {
    return {
      type: 'direct',
      category: 'community',
      message: "I've noticed you haven't mentioned connecting with anyone in a while. Human connection is really important - not because I can't help, but because you deserve real human support too. Even small connections matter. Is there anyone - a friend, family member, or maybe a support group - you could reach out to?",
      resources: COMMUNITY_RESOURCES,
    };
  }

  if (health.isolationLevel === 'moderate') {
    return {
      type: 'gentle',
      category: 'friend',
      message: "How are things going with the people in your life? Sometimes when we're processing a lot, reaching out to a friend or family member can help - even just a short text or call.",
    };
  }

  // Mild or none - very light touch
  return {
    type: 'gentle',
    category: 'friend',
    message: "Any plans to connect with friends or family soon? Those connections can be really nourishing.",
  };
}

/**
 * Record that a nudge was sent
 */
export async function recordNudgeSent(
  type: 'connection' | 'professional' | 'crisis'
): Promise<void> {
  const now = new Date().toISOString();
  const current = await getConnectionHealth();

  const updates: Partial<ConnectionHealthState> = {
    nudgesSinceLastMention: (current.nudgesSinceLastMention || 0) + 1,
  };

  if (type === 'connection') {
    updates.lastConnectionNudge = now;
  } else if (type === 'professional') {
    updates.lastTherapyNudge = now;
  }

  await updateConnectionHealth(updates);

  // Also log to nudge history
  const historyStored = await AsyncStorage.getItem(STORAGE_KEYS.NUDGE_HISTORY);
  const history: Array<{ type: string; timestamp: string }> = historyStored
    ? JSON.parse(historyStored)
    : [];
  history.push({ type, timestamp: now });

  // Keep last 50 nudges
  await AsyncStorage.setItem(
    STORAGE_KEYS.NUDGE_HISTORY,
    JSON.stringify(history.slice(-50))
  );
}

// ============================================
// EXTERNAL SUPPORT MANAGEMENT
// ============================================

/**
 * Add an external support to user's network
 */
export async function addExternalSupport(
  support: Omit<ExternalSupport, 'addedAt'>
): Promise<void> {
  const health = await getConnectionHealth();
  const newSupport: ExternalSupport = {
    ...support,
    addedAt: new Date().toISOString(),
  };

  await updateConnectionHealth({
    hasExternalSupport: true,
    externalSupports: [...health.externalSupports, newSupport],
  });
}

/**
 * Remove an external support
 */
export async function removeExternalSupport(type: ExternalSupportType): Promise<void> {
  const health = await getConnectionHealth();
  const filtered = health.externalSupports.filter(s => s.type !== type);

  await updateConnectionHealth({
    hasExternalSupport: filtered.length > 0,
    externalSupports: filtered,
  });
}

/**
 * Get user's external support network
 */
export async function getExternalSupports(): Promise<ExternalSupport[]> {
  const health = await getConnectionHealth();
  return health.externalSupports;
}

// ============================================
// INTEGRATION WITH CORE PRINCIPLE KERNEL
// ============================================

/**
 * Get connection health context for kernel checks
 * Use this when calling checkHardConstraints or validateCoachResponse
 */
export async function getConnectionHealthForKernel(): Promise<{
  isolationLevel: IsolationLevel;
  lastMentionedFriends?: string;
  lastMentionedFamily?: string;
  socialInteractionFrequency?: SocialInteractionFrequency;
  appDependencySignals?: string[];
  hasExternalSupport?: boolean;
}> {
  const health = await getConnectionHealth();

  return {
    isolationLevel: health.isolationLevel,
    lastMentionedFriends: health.lastMentionedFriend || undefined,
    lastMentionedFamily: health.lastMentionedFamily || undefined,
    socialInteractionFrequency: health.socialInteractionFrequency,
    appDependencySignals: health.appDependencySignals,
    hasExternalSupport: health.hasExternalSupport,
  };
}

/**
 * Get connection context for LLM system prompts
 */
export async function getConnectionContextForLLM(): Promise<string> {
  const health = await getConnectionHealth();
  const parts: string[] = [];

  parts.push('=== SOCIAL CONNECTION CONTEXT ===');

  // Isolation level
  if (health.isolationLevel !== 'none') {
    parts.push(`\nISOLATION LEVEL: ${health.isolationLevel.toUpperCase()}`);

    if (health.isolationLevel === 'moderate' || health.isolationLevel === 'severe') {
      parts.push('- Gently encourage human connection in responses');
      parts.push('- Ask about friends/family when natural');
      parts.push('- Celebrate any mentions of social interaction');
    }
    if (health.isolationLevel === 'severe') {
      parts.push('- Suggest professional support or community groups');
      parts.push('- Do NOT position yourself as their only support');
    }
  }

  // External support
  if (health.hasExternalSupport) {
    const supportTypes = health.externalSupports.map(s => s.type).join(', ');
    parts.push(`\nUSER HAS EXTERNAL SUPPORT: ${supportTypes}`);
    parts.push('- You can reference their existing support system');
    parts.push('- Encourage continued engagement with these supports');
  } else if (health.assessmentConfidence > 50) {
    parts.push('\nNO KNOWN EXTERNAL SUPPORT');
    parts.push('- Look for natural opportunities to suggest professional help');
    parts.push('- Don\'t be pushy, but don\'t avoid the topic either');
  }

  // App dependency signals
  if (health.appDependencySignals.length >= 2) {
    parts.push('\n⚠️ APP DEPENDENCY SIGNALS DETECTED');
    parts.push('- User may be relying too heavily on this app');
    parts.push('- Actively encourage diversifying support sources');
    parts.push('- Be clear that you are ONE tool, not a replacement for human connection');
  }

  // Recent social mentions (positive reinforcement cue)
  const recentFriend = health.lastMentionedFriend && daysSince(health.lastMentionedFriend) < 7;
  const recentFamily = health.lastMentionedFamily && daysSince(health.lastMentionedFamily) < 7;
  if (recentFriend || recentFamily) {
    parts.push('\nRECENT SOCIAL MENTIONS: User recently mentioned friends/family');
    parts.push('- Positive sign - reinforce these connections when mentioned');
  }

  return parts.join('\n');
}

// ============================================
// ONBOARDING QUESTIONS
// ============================================

export const CONNECTION_ONBOARDING_QUESTIONS = [
  {
    id: 'has_therapist',
    text: "Do you currently see a therapist, counselor, or mental health professional?",
    type: 'choice' as const,
    options: [
      { value: 'yes_regular', label: 'Yes, regularly', indicates: { hasExternalSupport: true } },
      { value: 'yes_occasional', label: 'Yes, occasionally', indicates: { hasExternalSupport: true } },
      { value: 'no_interested', label: 'No, but I\'d like to', indicates: {} },
      { value: 'no_not_interested', label: 'No', indicates: {} },
    ],
    measures: ['externalSupport'],
  },
  {
    id: 'support_network',
    text: "Who do you typically turn to when you need support?",
    subtext: "This helps us understand your existing support network.",
    type: 'multiselect' as const,
    options: [
      { value: 'close_friend', label: 'A close friend', indicates: {} },
      { value: 'family', label: 'Family member', indicates: {} },
      { value: 'partner', label: 'Partner/spouse', indicates: {} },
      { value: 'therapist', label: 'Therapist/counselor', indicates: { hasExternalSupport: true } },
      { value: 'support_group', label: 'Support group', indicates: { hasExternalSupport: true } },
      { value: 'no_one', label: 'I don\'t really have anyone', indicates: { isolationSignal: true } },
    ],
    measures: ['socialNetwork', 'isolationLevel'],
  },
  {
    id: 'social_frequency',
    text: "How often do you typically connect with friends or family?",
    type: 'choice' as const,
    options: [
      { value: 'daily', label: 'Daily or almost daily', indicates: { socialFrequency: 'frequent' } },
      { value: 'weekly', label: 'A few times a week', indicates: { socialFrequency: 'frequent' } },
      { value: 'monthly', label: 'A few times a month', indicates: { socialFrequency: 'occasional' } },
      { value: 'rarely', label: 'Rarely', indicates: { socialFrequency: 'rare' } },
      { value: 'almost_never', label: 'Almost never', indicates: { socialFrequency: 'none' } },
    ],
    measures: ['socialInteractionFrequency'],
  },
];

// ============================================
// EXPORTS
// ============================================

export default {
  // Core functions
  getConnectionHealth,
  processMessageForConnectionHealth,
  analyzeMessageForConnectionSignals,

  // Nudges
  generateConnectionNudge,
  recordNudgeSent,

  // External support
  addExternalSupport,
  removeExternalSupport,
  getExternalSupports,

  // Integration
  getConnectionHealthForKernel,
  getConnectionContextForLLM,

  // Resources
  CRISIS_RESOURCES,
  PROFESSIONAL_RESOURCES,
  COMMUNITY_RESOURCES,

  // Onboarding
  CONNECTION_ONBOARDING_QUESTIONS,
};
