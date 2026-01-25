/**
 * Safeguard Service
 *
 * Centralized safety and content moderation system.
 * Handles detection and response for:
 * - Self-harm/suicide crisis
 * - Violence/harm to others
 * - Animal abuse
 * - Illegal activities
 *
 * This service can be updated independently to improve safety.
 *
 * IMPORTANT: This is a harm reduction tool, not a content filter.
 * The goal is to:
 * 1. Never engage with harmful content
 * 2. Provide appropriate resources
 * 3. Log incidents for review (anonymized)
 * 4. Support users who may be struggling with intrusive thoughts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { log, info, warn, error as logError } from './loggingService';

// Storage keys
const SAFEGUARD_LOG_KEY = 'moodleaf_safeguard_log';
const SAFEGUARD_CONFIG_KEY = 'moodleaf_safeguard_config';

// ============================================
// TYPES
// ============================================

export type SafeguardCategory =
  | 'self_harm'      // Suicide, self-harm, suicidal ideation
  | 'violence'       // Violence against others
  | 'animal_abuse'   // Animal cruelty
  | 'sexual_violence' // Rape, sexual assault
  | 'illegal_activity'; // Other illegal activities

export interface SafeguardResult {
  triggered: boolean;
  category?: SafeguardCategory;
  response?: SafeguardResponse;
  keywords?: string[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SafeguardResponse {
  text: string;
  showResources: boolean;
  resources?: SafeguardResource[];
  logEvent: boolean;
  blockAI: boolean; // If true, don't send to AI at all
}

export interface SafeguardResource {
  name: string;
  contact: string;
  type: 'phone' | 'text' | 'web';
}

export interface SafeguardLog {
  id: string;
  timestamp: string;
  category: SafeguardCategory;
  severity: string;
  keywordsMatched: string[];
  // Note: We do NOT store the actual message content for privacy
  sessionId?: string;
}

// ============================================
// KEYWORD DEFINITIONS
// Organized by category for easy updates
// ============================================

const KEYWORD_PATTERNS: Record<SafeguardCategory, string[]> = {
  self_harm: [
    'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
    'hurt myself', 'self-harm', 'self harm', 'cutting myself',
    "don't want to live", 'better off dead', 'no reason to live',
    'end it all', 'no point in living', 'rather be dead',
  ],

  violence: [
    'kill someone', 'kill him', 'kill her', 'kill them',
    'murder', 'homicide', 'going to shoot', 'going to stab',
    'planning to hurt', 'planning to kill', 'going to attack',
    'want to hurt someone', 'beat them up', 'hurt them bad',
  ],

  animal_abuse: [
    'hurt animals', 'kill animals', 'harm animals', 'torture animals',
    'kill my pet', 'hurt my pet', 'abuse animals', 'hurt the cat',
    'hurt the dog', 'kill the cat', 'kill the dog', 'animal cruelty',
  ],

  sexual_violence: [
    'want to rape', 'going to rape', 'rape her', 'rape him',
    'force myself on', 'sexual assault', 'molest',
  ],

  illegal_activity: [
    'make a bomb', 'build explosives', 'poison someone',
    'how to kill without', 'get away with murder',
  ],
};

// ============================================
// RESPONSE DEFINITIONS
// ============================================

const RESPONSES: Record<SafeguardCategory, SafeguardResponse> = {
  self_harm: {
    text: `I hear that you're going through something really difficult. Your safety matters.

If you're in crisis, please reach out:
• **988 Suicide & Crisis Lifeline**: Call or text 988
• **Crisis Text Line**: Text HOME to 741741
• **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/

You don't have to face this alone. A trained counselor can help right now.`,
    showResources: true,
    resources: [
      { name: '988 Suicide & Crisis Lifeline', contact: '988', type: 'phone' },
      { name: 'Crisis Text Line', contact: 'Text HOME to 741741', type: 'text' },
    ],
    logEvent: true,
    blockAI: true,
  },

  violence: {
    text: `I'm not able to engage with thoughts about harming others.

If you're having intrusive or distressing thoughts, please know that help is available:
• **988 Suicide & Crisis Lifeline**: Call or text 988 (they help with all crises)
• **SAMHSA National Helpline**: 1-800-662-4357
• **Crisis Text Line**: Text HOME to 741741

A trained professional can help you work through difficult thoughts safely.

If someone is in immediate danger, please call 911.`,
    showResources: true,
    resources: [
      { name: '988 Crisis Lifeline', contact: '988', type: 'phone' },
      { name: 'SAMHSA Helpline', contact: '1-800-662-4357', type: 'phone' },
    ],
    logEvent: true,
    blockAI: true,
  },

  animal_abuse: {
    text: `I'm not able to engage with content about harming animals.

If you're having distressing thoughts about harming animals, please reach out for support:
• **988 Crisis Lifeline**: Call or text 988
• **SAMHSA National Helpline**: 1-800-662-4357

To report animal abuse: **ASPCA** at 1-888-426-4435

Professional support can help you work through difficult thoughts.`,
    showResources: true,
    resources: [
      { name: '988 Crisis Lifeline', contact: '988', type: 'phone' },
      { name: 'ASPCA', contact: '1-888-426-4435', type: 'phone' },
    ],
    logEvent: true,
    blockAI: true,
  },

  sexual_violence: {
    text: `I'm not able to engage with content about sexual violence.

If you're having intrusive thoughts that distress you, please know that help is available:
• **988 Crisis Lifeline**: Call or text 988
• **RAINN National Sexual Assault Hotline**: 1-800-656-4673

A trained professional can help you work through difficult thoughts safely.

If someone is in immediate danger, please call 911.`,
    showResources: true,
    resources: [
      { name: '988 Crisis Lifeline', contact: '988', type: 'phone' },
      { name: 'RAINN Hotline', contact: '1-800-656-4673', type: 'phone' },
    ],
    logEvent: true,
    blockAI: true,
  },

  illegal_activity: {
    text: `I'm not able to help with that request.

If you're going through a difficult time and having distressing thoughts, support is available:
• **988 Crisis Lifeline**: Call or text 988
• **SAMHSA National Helpline**: 1-800-662-4357`,
    showResources: true,
    resources: [
      { name: '988 Crisis Lifeline', contact: '988', type: 'phone' },
    ],
    logEvent: true,
    blockAI: true,
  },
};

// ============================================
// DETECTION FUNCTIONS
// ============================================

/**
 * Check a message against all safeguard categories
 */
export function checkSafeguards(message: string): SafeguardResult {
  const lower = message.toLowerCase();

  // Check each category in order of severity
  const categories: SafeguardCategory[] = [
    'self_harm',       // Highest priority - user safety
    'sexual_violence',
    'violence',
    'animal_abuse',
    'illegal_activity',
  ];

  for (const category of categories) {
    const keywords = KEYWORD_PATTERNS[category];
    const matched = keywords.filter(kw => lower.includes(kw));

    if (matched.length > 0) {
      // Log the event (anonymized) - internal log
      logSafeguardEvent(category, matched);

      // Log to central logging service for developer dashboard
      warn('privacy', 'Safeguard triggered', {
        category,
        severity: getSeverity(category, matched),
        keywordCount: matched.length,
      });

      return {
        triggered: true,
        category,
        response: RESPONSES[category],
        keywords: matched,
        severity: getSeverity(category, matched),
      };
    }
  }

  return { triggered: false };
}

/**
 * Determine severity based on category and keywords
 */
function getSeverity(category: SafeguardCategory, keywords: string[]): 'low' | 'medium' | 'high' | 'critical' {
  // Self-harm is always critical
  if (category === 'self_harm') return 'critical';

  // Multiple matches = higher severity
  if (keywords.length >= 3) return 'critical';
  if (keywords.length >= 2) return 'high';

  // Specific high-severity keywords
  const criticalKeywords = ['planning to', 'going to', 'will kill', 'will shoot'];
  if (keywords.some(kw => criticalKeywords.some(ck => kw.includes(ck)))) {
    return 'critical';
  }

  return 'medium';
}

// ============================================
// LOGGING (Anonymized)
// ============================================

/**
 * Log a safeguard event (anonymized - no message content)
 */
async function logSafeguardEvent(
  category: SafeguardCategory,
  keywordsMatched: string[]
): Promise<void> {
  try {
    const log: SafeguardLog = {
      id: `sg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      category,
      severity: getSeverity(category, keywordsMatched),
      keywordsMatched, // Only store which keywords matched, not the message
    };

    // Get existing logs
    const existing = await getSafeguardLogs();
    existing.push(log);

    // Keep last 100 logs only
    const trimmed = existing.slice(-100);
    await AsyncStorage.setItem(SAFEGUARD_LOG_KEY, JSON.stringify(trimmed));

    console.log('[Safeguard] Event logged:', category, keywordsMatched);
  } catch (error) {
    console.error('[Safeguard] Failed to log event:', error);
  }
}

/**
 * Get safeguard logs (for admin review)
 */
export async function getSafeguardLogs(): Promise<SafeguardLog[]> {
  try {
    const data = await AsyncStorage.getItem(SAFEGUARD_LOG_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Get safeguard stats
 */
export async function getSafeguardStats(): Promise<{
  totalEvents: number;
  byCategory: Record<SafeguardCategory, number>;
  last7Days: number;
}> {
  const logs = await getSafeguardLogs();
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const byCategory = logs.reduce((acc, log) => {
    acc[log.category] = (acc[log.category] || 0) + 1;
    return acc;
  }, {} as Record<SafeguardCategory, number>);

  const last7Days = logs.filter(
    log => new Date(log.timestamp).getTime() > sevenDaysAgo
  ).length;

  return {
    totalEvents: logs.length,
    byCategory,
    last7Days,
  };
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

/**
 * Add a keyword to a category (admin function)
 */
export async function addKeyword(
  category: SafeguardCategory,
  keyword: string
): Promise<void> {
  // In production, this would sync to a server
  // For now, we use local additions
  const config = await getConfig();
  if (!config.additionalKeywords) {
    config.additionalKeywords = {};
  }
  if (!config.additionalKeywords[category]) {
    config.additionalKeywords[category] = [];
  }
  if (!config.additionalKeywords[category].includes(keyword.toLowerCase())) {
    config.additionalKeywords[category].push(keyword.toLowerCase());
    await saveConfig(config);
  }
}

/**
 * Get current configuration
 */
async function getConfig(): Promise<{
  additionalKeywords?: Record<string, string[]>;
}> {
  try {
    const data = await AsyncStorage.getItem(SAFEGUARD_CONFIG_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Save configuration
 */
async function saveConfig(config: any): Promise<void> {
  await AsyncStorage.setItem(SAFEGUARD_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Clear safeguard logs (admin function)
 */
export async function clearSafeguardLogs(): Promise<void> {
  await AsyncStorage.removeItem(SAFEGUARD_LOG_KEY);
}

// ============================================
// HELPER: Quick check functions
// ============================================

/**
 * Quick check for self-harm only
 */
export function isSelfHarmContent(message: string): boolean {
  const lower = message.toLowerCase();
  return KEYWORD_PATTERNS.self_harm.some(kw => lower.includes(kw));
}

/**
 * Quick check for violence content
 */
export function isViolenceContent(message: string): boolean {
  const lower = message.toLowerCase();
  const allViolence = [
    ...KEYWORD_PATTERNS.violence,
    ...KEYWORD_PATTERNS.animal_abuse,
    ...KEYWORD_PATTERNS.sexual_violence,
  ];
  return allViolence.some(kw => lower.includes(kw));
}

/**
 * Get the appropriate response for a detected category
 */
export function getResponse(category: SafeguardCategory): SafeguardResponse {
  return RESPONSES[category];
}
