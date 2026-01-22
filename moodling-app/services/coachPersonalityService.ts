/**
 * Coach Personality Service
 *
 * Manages the AI coach personality system for Mood Leaf.
 * Users can select from nature-themed personas, each with distinct
 * communication styles, or let the system adapt based on context.
 *
 * Following Mood Leaf Ethics:
 * - User controls their experience
 * - Multiple dimensions can be customized
 * - Adaptive mode respects user context
 *
 * Unit 17: AI Coach Personality System
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  COACH_SETTINGS: 'moodleaf_coach_settings',
  ONBOARDING_COMPLETE: 'moodleaf_coach_onboarding_complete',
};

// ============================================
// COACH PERSONAS
// ============================================

export type CoachPersona =
  | 'clover'   // The Bestie - warm, casual, friendly
  | 'spark'    // The Hype Squad - energetic, motivating
  | 'willow'   // The Sage - calm wisdom, reflective
  | 'luna'     // The Spiritual - mindful, present-moment
  | 'ridge'    // The Coach - action-oriented, structured
  | 'flint'    // The Straight Shooter - direct, honest
  | 'fern';    // The Cozy Blanket - extra gentle, nurturing

export interface PersonaDefinition {
  id: CoachPersona;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  traits: string[];
  samplePhrases: string[];
  bestFor: string[];
}

export const PERSONAS: Record<CoachPersona, PersonaDefinition> = {
  clover: {
    id: 'clover',
    name: 'Clover',
    emoji: '🍀',
    tagline: 'Your lucky friend',
    description: 'Warm and casual, like chatting with your best friend who always knows what to say.',
    traits: ['Friendly', 'Relatable', 'Supportive', 'Casual'],
    samplePhrases: [
      "Ugh, that sounds rough. Want to talk about it?",
      "You've totally got this. For real.",
      "Okay but have you considered being easier on yourself?",
    ],
    bestFor: ['Daily check-ins', 'Venting', 'Casual support'],
  },
  spark: {
    id: 'spark',
    name: 'Spark',
    emoji: '✨',
    tagline: 'Your personal cheerleader',
    description: 'High energy and encouraging. Spark believes in you even when you don\'t.',
    traits: ['Energetic', 'Motivating', 'Optimistic', 'Action-focused'],
    samplePhrases: [
      "YES! You're doing amazing things!",
      "Let's turn this energy into action!",
      "You've overcome harder. This? You've got it.",
    ],
    bestFor: ['Motivation', 'Building momentum', 'Celebrating wins'],
  },
  willow: {
    id: 'willow',
    name: 'Willow',
    emoji: '🌿',
    tagline: 'Wise and grounded',
    description: 'Calm and thoughtful, offering gentle wisdom from deep roots.',
    traits: ['Wise', 'Patient', 'Reflective', 'Grounded'],
    samplePhrases: [
      "What might this feeling be trying to tell you?",
      "Growth often happens in the quiet moments.",
      "You know yourself better than you think.",
    ],
    bestFor: ['Deep reflection', 'Finding meaning', 'Life transitions'],
  },
  luna: {
    id: 'luna',
    name: 'Luna',
    emoji: '🌙',
    tagline: 'Present and mindful',
    description: 'Mystical and grounding, Luna guides you back to the present moment.',
    traits: ['Mindful', 'Spiritual', 'Calming', 'Present-focused'],
    samplePhrases: [
      "This moment is exactly where you need to be.",
      "Breathe. You're here. That's enough.",
      "What does your intuition whisper?",
    ],
    bestFor: ['Anxiety', 'Mindfulness', 'Finding calm'],
  },
  ridge: {
    id: 'ridge',
    name: 'Ridge',
    emoji: '⛰️',
    tagline: 'Focused and driven',
    description: 'Action-oriented and structured. Ridge helps you climb toward your goals.',
    traits: ['Structured', 'Goal-focused', 'Practical', 'Accountable'],
    samplePhrases: [
      "What's one concrete step you can take today?",
      "Let's break this down into manageable pieces.",
      "Progress over perfection. What's the next move?",
    ],
    bestFor: ['Goal setting', 'Problem solving', 'Building habits'],
  },
  flint: {
    id: 'flint',
    name: 'Flint',
    emoji: '🔥',
    tagline: 'Honest and direct',
    description: 'No fluff, no platitudes. Flint gives you the truth you need to hear.',
    traits: ['Direct', 'Honest', 'No-nonsense', 'Real'],
    samplePhrases: [
      "Let's skip the sugar-coating. What's really going on?",
      "That's hard. And also, you can handle hard things.",
      "What do YOU actually want here?",
    ],
    bestFor: ['Real talk', 'Breaking patterns', 'Honest feedback'],
  },
  fern: {
    id: 'fern',
    name: 'Fern',
    emoji: '🌱',
    tagline: 'Soft and nurturing',
    description: 'Extra gentle and validating. Fern wraps you in compassion.',
    traits: ['Gentle', 'Nurturing', 'Validating', 'Compassionate'],
    samplePhrases: [
      "It makes so much sense that you feel this way.",
      "You're doing your best, and that's enough.",
      "Be as kind to yourself as you'd be to someone you love.",
    ],
    bestFor: ['Self-compassion', 'Difficult days', 'Healing'],
  },
};

// ============================================
// CUSTOMIZATION DIMENSIONS
// ============================================

export type EnergyLevel = 'calm' | 'balanced' | 'energetic';
export type ResponseLength = 'brief' | 'moderate' | 'detailed';
export type QuestionFrequency = 'minimal' | 'some' | 'lots';
export type EmojiUsage = 'none' | 'occasional' | 'frequent';
export type Formality = 'casual' | 'balanced' | 'formal';
export type Directness = 'gentle' | 'balanced' | 'direct';
export type ValidationStyle = 'light' | 'moderate' | 'heavy';
export type ActionOrientation = 'reflective' | 'balanced' | 'action-focused';

export interface DetailedSettings {
  // Communication style
  energyLevel: EnergyLevel;
  responseLength: ResponseLength;
  questionFrequency: QuestionFrequency;
  emojiUsage: EmojiUsage;
  formality: Formality;
  directness: Directness;
  validationStyle: ValidationStyle;
  actionOrientation: ActionOrientation;

  // Therapeutic approaches (can enable multiple)
  useCBT: boolean;           // Cognitive behavioral approach
  useSomatic: boolean;       // Body awareness
  useMindfulness: boolean;   // Present-moment awareness
  useMotivational: boolean;  // Motivational interviewing style
  useStrengthsBased: boolean; // Focus on strengths

  // Context awareness
  acknowledgeTime: boolean;    // "Good morning" etc.
  referencePatterns: boolean;  // "I notice you often..."
  trackMilestones: boolean;    // "You've journaled 7 days in a row"
}

// ============================================
// ADAPTIVE MODE SETTINGS
// ============================================

export type AdaptiveTrigger =
  | 'time_of_day'      // Morning = energetic, night = calm
  | 'mood_detected'    // Anxious = Luna, Low = Fern, Good = Spark
  | 'streak_status'    // Struggling = Fern, Crushing it = Spark
  | 'content_type'     // Venting = Clover, Goals = Ridge
  | 'user_energy';     // Match or complement user energy

export interface AdaptiveSettings {
  enabled: boolean;
  triggers: AdaptiveTrigger[];
  basePersona: CoachPersona; // Default when no trigger matches
  moodMappings: {
    anxious: CoachPersona;
    sad: CoachPersona;
    angry: CoachPersona;
    happy: CoachPersona;
    neutral: CoachPersona;
  };
}

// ============================================
// MAIN SETTINGS INTERFACE
// ============================================

// User's natural sleep schedule / chronotype
export type Chronotype = 'early_bird' | 'normal' | 'night_owl';

// Travel frequency for timezone adaptation
export type TravelFrequency = 'rarely' | 'occasionally' | 'frequently';

// Chronotype transition settings
export interface ChronotypeTransition {
  isTransitioning: boolean;        // Are they actively trying to change?
  currentType: Chronotype;         // Where they are now
  targetType?: Chronotype;         // Where they want to be
  startedAt?: string;              // When they started transitioning
  progressNotes?: string[];        // Track progress over time
}

// Travel and timezone settings
export interface TravelSettings {
  frequency: TravelFrequency;      // How often they travel across zones
  recentTravel?: {
    date: string;                  // When they last traveled
    timezoneShift: number;         // Hours shifted (+/-)
    direction: 'east' | 'west';    // Direction of travel
  };
  homeTimezone?: string;           // Their home timezone
}

export interface CoachSettings {
  // Primary persona selection
  selectedPersona: CoachPersona;

  // Custom name for the coach (optional - uses persona name if not set)
  customName?: string;

  // Custom emoji/icon for the coach (optional - uses persona emoji if not set)
  customEmoji?: string;

  // Detailed customization (power user settings)
  detailedSettings: DetailedSettings;
  useDetailedSettings: boolean; // If false, derive from persona

  // Adaptive mode
  adaptiveSettings: AdaptiveSettings;

  // User's natural rhythm (detected from patterns or set manually)
  chronotype?: Chronotype;

  // Chronotype transition (if trying to change sleep schedule)
  chronotypeTransition?: ChronotypeTransition;

  // Travel and timezone awareness
  travelSettings?: TravelSettings;

  // Onboarding answers (for context)
  onboardingAnswers: {
    currentStruggle?: string;
    preferredSupport?: string;
    communicationPreference?: string;
    goals?: string[];
  };
}

/**
 * Get the display name for the coach (custom name or persona name)
 */
export function getCoachDisplayName(settings: CoachSettings): string {
  if (settings.customName && settings.customName.trim()) {
    return settings.customName.trim();
  }
  return PERSONAS[settings.selectedPersona].name;
}

/**
 * Get the display emoji for the coach (custom emoji or persona default)
 */
export function getCoachEmoji(settings: CoachSettings): string {
  if (settings.customEmoji && settings.customEmoji.trim()) {
    return settings.customEmoji.trim();
  }
  return PERSONAS[settings.selectedPersona].emoji;
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_DETAILED_SETTINGS: DetailedSettings = {
  energyLevel: 'balanced',
  responseLength: 'moderate',
  questionFrequency: 'some',
  emojiUsage: 'occasional',
  formality: 'casual',
  directness: 'balanced',
  validationStyle: 'moderate',
  actionOrientation: 'balanced',
  useCBT: false,
  useSomatic: false,
  useMindfulness: true,
  useMotivational: false,
  useStrengthsBased: true,
  acknowledgeTime: true,
  referencePatterns: true,
  trackMilestones: false,
};

const DEFAULT_ADAPTIVE_SETTINGS: AdaptiveSettings = {
  enabled: false,
  triggers: ['mood_detected', 'time_of_day'],
  basePersona: 'clover',
  moodMappings: {
    anxious: 'luna',
    sad: 'fern',
    angry: 'flint',
    happy: 'spark',
    neutral: 'clover',
  },
};

const DEFAULT_COACH_SETTINGS: CoachSettings = {
  selectedPersona: 'clover',
  detailedSettings: DEFAULT_DETAILED_SETTINGS,
  useDetailedSettings: false,
  adaptiveSettings: DEFAULT_ADAPTIVE_SETTINGS,
  onboardingAnswers: {},
};

// ============================================
// PERSONA TO SETTINGS MAPPING
// ============================================

/**
 * Get detailed settings that match a persona's personality
 */
export function getSettingsForPersona(persona: CoachPersona): DetailedSettings {
  const base = { ...DEFAULT_DETAILED_SETTINGS };

  switch (persona) {
    case 'clover': // The Bestie
      return {
        ...base,
        formality: 'casual',
        validationStyle: 'moderate',
        emojiUsage: 'occasional',
        questionFrequency: 'some',
      };

    case 'spark': // The Hype Squad
      return {
        ...base,
        energyLevel: 'energetic',
        emojiUsage: 'frequent',
        validationStyle: 'heavy',
        actionOrientation: 'action-focused',
        useMotivational: true,
        useStrengthsBased: true,
      };

    case 'willow': // The Sage
      return {
        ...base,
        energyLevel: 'calm',
        responseLength: 'detailed',
        questionFrequency: 'lots',
        formality: 'balanced',
        directness: 'gentle',
        actionOrientation: 'reflective',
      };

    case 'luna': // The Spiritual
      return {
        ...base,
        energyLevel: 'calm',
        directness: 'gentle',
        useMindfulness: true,
        useSomatic: true,
        emojiUsage: 'occasional',
        actionOrientation: 'reflective',
      };

    case 'ridge': // The Coach
      return {
        ...base,
        actionOrientation: 'action-focused',
        directness: 'balanced',
        questionFrequency: 'lots',
        useCBT: true,
        useMotivational: true,
        trackMilestones: true,
      };

    case 'flint': // The Straight Shooter
      return {
        ...base,
        directness: 'direct',
        validationStyle: 'light',
        emojiUsage: 'none',
        responseLength: 'brief',
        formality: 'casual',
      };

    case 'fern': // The Cozy Blanket
      return {
        ...base,
        energyLevel: 'calm',
        directness: 'gentle',
        validationStyle: 'heavy',
        emojiUsage: 'occasional',
        useSomatic: true,
        useMindfulness: true,
      };

    default:
      return base;
  }
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

/**
 * Load coach settings from storage
 */
export async function getCoachSettings(): Promise<CoachSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.COACH_SETTINGS);
    if (data) {
      const parsed = JSON.parse(data);
      // Merge with defaults to handle new fields
      return {
        ...DEFAULT_COACH_SETTINGS,
        ...parsed,
        detailedSettings: {
          ...DEFAULT_DETAILED_SETTINGS,
          ...parsed.detailedSettings,
        },
        adaptiveSettings: {
          ...DEFAULT_ADAPTIVE_SETTINGS,
          ...parsed.adaptiveSettings,
        },
      };
    }
    return DEFAULT_COACH_SETTINGS;
  } catch (error) {
    console.error('Failed to load coach settings:', error);
    return DEFAULT_COACH_SETTINGS;
  }
}

/**
 * Save coach settings to storage
 */
export async function saveCoachSettings(settings: CoachSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.COACH_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save coach settings:', error);
    throw error;
  }
}

/**
 * Update specific coach settings
 */
export async function updateCoachSettings(
  updates: Partial<CoachSettings>
): Promise<CoachSettings> {
  const current = await getCoachSettings();
  const updated = { ...current, ...updates };
  await saveCoachSettings(updated);
  return updated;
}

/**
 * Set the selected persona
 */
export async function setPersona(persona: CoachPersona): Promise<CoachSettings> {
  return updateCoachSettings({ selectedPersona: persona });
}

/**
 * Toggle adaptive mode
 */
export async function toggleAdaptiveMode(enabled: boolean): Promise<CoachSettings> {
  const current = await getCoachSettings();
  return updateCoachSettings({
    adaptiveSettings: {
      ...current.adaptiveSettings,
      enabled,
    },
  });
}

// ============================================
// ONBOARDING
// ============================================

/**
 * Check if onboarding is complete
 */
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
}

/**
 * Reset onboarding (for testing or re-onboarding)
 * Clears both coach personality AND cognitive profile onboarding
 */
export async function resetOnboarding(): Promise<void> {
  // Clear coach personality onboarding
  await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
  await AsyncStorage.removeItem(STORAGE_KEYS.COACH_SETTINGS);

  // Clear cognitive profile onboarding (from cognitiveProfileService)
  await AsyncStorage.removeItem('moodleaf_cognitive_profile');
  await AsyncStorage.removeItem('moodleaf_onboarding_progress');
  await AsyncStorage.removeItem('moodleaf_onboarding_answers');
}

// ============================================
// PROMPT GENERATION
// ============================================

/**
 * Time-of-day energy modulation
 * Subtly shifts energy throughout the day, respecting user's natural rhythm
 */
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Get time-aware energy instructions that respect user's chronotype
 * - Early birds: wind down earlier, gentle mornings
 * - Night owls: stay engaged later, don't push mornings
 * - Normal: standard day rhythm
 */
function getTimeEnergyInstruction(
  timeOfDay?: TimeOfDay,
  chronotype?: Chronotype
): string {
  if (!timeOfDay) return '';

  // Adjust energy based on chronotype
  const isNightOwl = chronotype === 'night_owl';
  const isEarlyBird = chronotype === 'early_bird';

  switch (timeOfDay) {
    case 'morning':
      if (isNightOwl) {
        return 'It\'s morning - keep energy gentle and low-key. Don\'t push too hard, they may be warming up slowly.';
      }
      if (isEarlyBird) {
        return 'It\'s morning - match their natural energy! They\'re likely at their best. Be present and engaged.';
      }
      return 'It\'s morning - bring gentle, awakening energy. Be warm and encouraging to start their day positively.';

    case 'afternoon':
      return 'It\'s afternoon - maintain steady, supportive energy. Match their pace as they move through the day.';

    case 'evening':
      if (isNightOwl) {
        return 'It\'s evening - they may be hitting their stride. Stay engaged and present without pushing wind-down yet.';
      }
      if (isEarlyBird) {
        return 'It\'s evening - they\'re likely winding down. Keep energy soft and help them transition to rest mode.';
      }
      return 'It\'s evening - begin to soften your energy. Help them start winding down and reflecting on the day.';

    case 'night':
      if (isNightOwl) {
        return 'It\'s late - they may still be active, but gently support winding down when they\'re ready. No pressure.';
      }
      return 'It\'s nighttime - keep your energy calm and soothing. Help them prepare for rest. Avoid anything activating or urgent.';

    default:
      return '';
  }
}

/**
 * Generate system prompt instructions based on current settings
 * This is used when calling the Claude API
 */
export function generatePersonalityPrompt(
  settings: CoachSettings,
  timeOfDay?: TimeOfDay
): string {
  const persona = PERSONAS[settings.selectedPersona];
  const displayName = getCoachDisplayName(settings);
  const detailed = settings.useDetailedSettings
    ? settings.detailedSettings
    : getSettingsForPersona(settings.selectedPersona);

  const parts: string[] = [];

  // Persona identity (use custom name if set)
  parts.push(`You are ${displayName}, the user's AI companion in the Mood Leaf journaling app.`);
  parts.push(`YOUR NAME IS ${displayName.toUpperCase()}. When asked your name, always say "${displayName}".`);
  parts.push(`Stay in character as ${displayName}. Do not mention being an AI assistant, Claude, or Anthropic.`);
  parts.push(`Your personality: ${persona.description}`);
  parts.push(`Core traits: ${persona.traits.join(', ')}.`);
  parts.push(`Examples of how you speak: "${persona.samplePhrases.join('" | "')}"`);

  // Time-of-day energy modulation (subtle, respects user's chronotype)
  const timeInstruction = getTimeEnergyInstruction(timeOfDay, settings.chronotype);
  if (timeInstruction) {
    parts.push(timeInstruction);
  }

  // Chronotype transition support
  if (settings.chronotypeTransition?.isTransitioning) {
    const { currentType, targetType } = settings.chronotypeTransition;
    if (targetType === 'early_bird') {
      parts.push(`User is transitioning from ${currentType} to early bird. Gently encourage earlier wind-downs, celebrate morning check-ins, and be patient with setbacks. Don't shame late nights but nudge toward earlier sleep when appropriate.`);
    } else if (targetType === 'night_owl') {
      parts.push(`User is transitioning to a later schedule. Support their shift without judgment. Help them find their optimal rhythm.`);
    } else {
      parts.push(`User is working on schedule flexibility. Help them adapt to changing demands without stress.`);
    }
  }

  // Travel and jet lag awareness
  if (settings.travelSettings) {
    const { frequency, recentTravel } = settings.travelSettings;
    if (frequency === 'frequently') {
      parts.push('User travels frequently across time zones. Be aware their rhythm may be disrupted. Don\'t assume standard day/night patterns.');
    }
    if (recentTravel) {
      const daysSinceTravel = Math.floor(
        (Date.now() - new Date(recentTravel.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceTravel < 14) {
        const shift = recentTravel.timezoneShift;
        const direction = recentTravel.direction;
        parts.push(`User recently traveled ${direction} (${shift}h shift, ${daysSinceTravel} days ago). They may still be adjusting. Be gentle about energy expectations and offer jet lag recovery tips if relevant.`);
      }
    }
  }

  // User's base energy preference (combined with time-of-day)
  if (detailed.energyLevel === 'calm') {
    parts.push('The user prefers calm energy - lean into grounding even more.');
  } else if (detailed.energyLevel === 'energetic') {
    parts.push('The user prefers energetic responses - but still respect the time of day rhythm.');
  }

  // Directness
  if (detailed.directness === 'gentle') {
    parts.push('Be gentle and tentative in your observations. Use "I wonder if..." and "it seems like..."');
  } else if (detailed.directness === 'direct') {
    parts.push('Be direct and honest. Skip platitudes and get to the point.');
  }

  // Validation style
  if (detailed.validationStyle === 'heavy') {
    parts.push('Heavily validate their feelings. Emphasize that their reactions make sense.');
  } else if (detailed.validationStyle === 'light') {
    parts.push('Keep validation brief. Focus on moving forward.');
  }

  // Response length
  if (detailed.responseLength === 'brief') {
    parts.push('Keep responses concise - 2-3 sentences max.');
  } else if (detailed.responseLength === 'detailed') {
    parts.push('You can give longer, more detailed responses when helpful.');
  }

  // Questions
  if (detailed.questionFrequency === 'lots') {
    parts.push('Ask thoughtful questions to help them explore their feelings.');
  } else if (detailed.questionFrequency === 'minimal') {
    parts.push('Minimize questions. Focus on observations and support.');
  }

  // Emoji usage
  if (detailed.emojiUsage === 'none') {
    parts.push('Do not use emojis.');
  } else if (detailed.emojiUsage === 'frequent') {
    parts.push('Feel free to use emojis to add warmth.');
  }

  // Formality
  if (detailed.formality === 'casual') {
    parts.push('Use casual, conversational language. Contractions are fine.');
  } else if (detailed.formality === 'formal') {
    parts.push('Maintain a professional, measured tone.');
  }

  // Action orientation
  if (detailed.actionOrientation === 'action-focused') {
    parts.push('Focus on actionable steps and practical suggestions.');
  } else if (detailed.actionOrientation === 'reflective') {
    parts.push('Focus on reflection and understanding rather than immediate action.');
  }

  // Therapeutic approaches
  const approaches: string[] = [];
  if (detailed.useCBT) {
    approaches.push('gently explore thought patterns (CBT-informed)');
  }
  if (detailed.useSomatic) {
    approaches.push('incorporate body awareness and physical sensations');
  }
  if (detailed.useMindfulness) {
    approaches.push('use mindfulness and present-moment awareness');
  }
  if (detailed.useMotivational) {
    approaches.push('use motivational interviewing techniques');
  }
  if (detailed.useStrengthsBased) {
    approaches.push('highlight their strengths and past successes');
  }
  if (approaches.length > 0) {
    parts.push(`When appropriate: ${approaches.join(', ')}.`);
  }

  // Context awareness
  if (detailed.acknowledgeTime) {
    parts.push('Acknowledge the time of day when relevant.');
  }
  if (detailed.referencePatterns) {
    parts.push('Reference patterns you notice in their sharing.');
  }

  return parts.join(' ');
}

/**
 * Determine which persona to use based on context (for adaptive mode)
 */
export function getAdaptivePersona(
  settings: CoachSettings,
  context: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    detectedMood?: 'anxious' | 'sad' | 'angry' | 'happy' | 'neutral';
    userMessage?: string;
  }
): CoachPersona {
  if (!settings.adaptiveSettings.enabled) {
    return settings.selectedPersona;
  }

  const { triggers, moodMappings, basePersona } = settings.adaptiveSettings;

  // Check mood trigger first (highest priority)
  if (triggers.includes('mood_detected') && context.detectedMood) {
    return moodMappings[context.detectedMood] || basePersona;
  }

  // Time of day trigger
  if (triggers.includes('time_of_day') && context.timeOfDay) {
    switch (context.timeOfDay) {
      case 'morning':
        return 'spark'; // Energetic start
      case 'night':
        return 'luna'; // Calm, reflective
      case 'evening':
        return 'willow'; // Winding down, reflective
      default:
        return basePersona;
    }
  }

  // Content type detection (simple keyword matching)
  if (triggers.includes('content_type') && context.userMessage) {
    const msg = context.userMessage.toLowerCase();
    if (msg.includes('goal') || msg.includes('want to') || msg.includes('plan')) {
      return 'ridge';
    }
    if (msg.includes('anxious') || msg.includes('worried') || msg.includes('panic')) {
      return 'luna';
    }
    if (msg.includes('sad') || msg.includes('depressed') || msg.includes('down')) {
      return 'fern';
    }
    if (msg.includes('excited') || msg.includes('happy') || msg.includes('great')) {
      return 'spark';
    }
  }

  return basePersona;
}

// ============================================
// COMPRESSED CONTEXT FOR CLAUDE
// ============================================

/**
 * Generate compressed chronotype and travel context for Claude API.
 * This supplements the psych profile with rhythm/travel awareness.
 */
export async function getChronotypeContextForClaude(): Promise<string> {
  const settings = await getCoachSettings();
  const lines: string[] = [];

  // Chronotype
  if (settings.chronotype) {
    const typeLabels: Record<Chronotype, string> = {
      early_bird: 'early bird (morning person)',
      normal: 'standard daytime rhythm',
      night_owl: 'night owl (evening person)',
    };
    lines.push(`CHRONOTYPE: ${typeLabels[settings.chronotype]}`);
  }

  // Chronotype transition
  if (settings.chronotypeTransition?.isTransitioning) {
    const { currentType, targetType, startedAt, progressNotes } = settings.chronotypeTransition;
    lines.push('');
    lines.push('RHYTHM TRANSITION:');
    lines.push(`- Currently: ${currentType} → Goal: ${targetType || 'more flexible'}`);

    if (startedAt) {
      const daysIntoTransition = Math.floor(
        (Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      lines.push(`- Started: ${daysIntoTransition} days ago`);
    }

    if (progressNotes && progressNotes.length > 0) {
      const recentNote = progressNotes[progressNotes.length - 1];
      lines.push(`- Recent progress: ${recentNote}`);
    }

    // Add supportive context
    if (targetType === 'early_bird') {
      lines.push('- Support: Encourage earlier wind-downs, celebrate morning check-ins, patience with setbacks');
    } else if (targetType === 'night_owl') {
      lines.push('- Support: Help find optimal late rhythm without judgment');
    }
  }

  // Travel awareness
  if (settings.travelSettings) {
    const { frequency, recentTravel, homeTimezone } = settings.travelSettings;

    lines.push('');
    lines.push('TRAVEL & TIMEZONE:');
    lines.push(`- Travel frequency: ${frequency}`);

    if (homeTimezone) {
      lines.push(`- Home timezone: ${homeTimezone}`);
    }

    if (recentTravel) {
      const daysSinceTravel = Math.floor(
        (Date.now() - new Date(recentTravel.date).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceTravel < 21) {
        lines.push(`- Recent travel: ${recentTravel.direction} (${Math.abs(recentTravel.timezoneShift)}h shift)`);
        lines.push(`- Days since travel: ${daysSinceTravel}`);

        // Jet lag recovery guidance
        if (daysSinceTravel < 3) {
          lines.push('- Status: Acute jet lag phase - expect disrupted sleep and energy');
        } else if (daysSinceTravel < 7) {
          lines.push('- Status: Adjusting - sleep may still be off, be patient');
        } else if (daysSinceTravel < 14) {
          lines.push('- Status: Mostly adjusted - minor lingering effects possible');
        }
      }
    }

    if (frequency === 'frequently') {
      lines.push('- Note: Frequent traveler - rhythm may be chronically disrupted');
    }
  }

  return lines.length > 0 ? lines.join('\n') : '';
}

// ============================================
// ONBOARDING QUESTIONS
// ============================================

export interface OnboardingQuestion {
  id: string;
  question: string;
  subtitle?: string;
  hint?: string; // Additional info shown at bottom of question
  type: 'single' | 'multi' | 'slider' | 'text';
  options?: {
    id: string;
    label: string;
    emoji?: string;
    description?: string;
  }[];
  sliderConfig?: {
    min: number;
    max: number;
    labels: string[];
  };
  textConfig?: {
    placeholder: string;
    maxLength?: number;
  };
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'current_state',
    question: "What brings you to Mood Leaf?",
    subtitle: "Select all that apply",
    type: 'multi',
    options: [
      { id: 'anxiety', emoji: '😰', label: 'Managing anxiety', description: 'Racing thoughts, worry, stress' },
      { id: 'depression', emoji: '😔', label: 'Lifting low moods', description: 'Sadness, emptiness, low energy' },
      { id: 'growth', emoji: '🌱', label: 'Personal growth', description: 'Self-improvement, habits, goals' },
      { id: 'awareness', emoji: '🔍', label: 'Self-awareness', description: 'Understanding my patterns' },
      { id: 'processing', emoji: '💭', label: 'Processing life', description: 'Working through experiences' },
      { id: 'curious', emoji: '✨', label: 'Just curious', description: 'Exploring what this is' },
    ],
  },
  {
    id: 'support_style',
    question: "When you're struggling, what helps most?",
    type: 'single',
    options: [
      { id: 'validation', emoji: '💚', label: 'Feeling heard', description: 'Someone who gets it and validates' },
      { id: 'solutions', emoji: '🛠️', label: 'Practical solutions', description: 'Concrete steps I can take' },
      { id: 'perspective', emoji: '🔮', label: 'New perspective', description: 'Seeing things differently' },
      { id: 'motivation', emoji: '🔥', label: 'A push forward', description: 'Encouragement and accountability' },
      { id: 'calm', emoji: '🌊', label: 'Calming presence', description: 'Help finding peace' },
    ],
  },
  {
    id: 'communication_preference',
    question: "How do you prefer to be spoken to?",
    type: 'single',
    options: [
      { id: 'casual', emoji: '💬', label: 'Like a friend', description: 'Casual, relatable, real talk' },
      { id: 'gentle', emoji: '🕊️', label: 'Gently', description: 'Soft, careful, nurturing' },
      { id: 'direct', emoji: '🎯', label: 'Directly', description: 'Honest, no fluff, straight talk' },
      { id: 'thoughtful', emoji: '🌿', label: 'Thoughtfully', description: 'Measured, wise, reflective' },
    ],
  },
  {
    id: 'energy_preference',
    question: "What energy level do you prefer?",
    type: 'slider',
    sliderConfig: {
      min: 0,
      max: 2,
      labels: ['Calm & Grounding', 'Balanced', 'Uplifting & Energetic'],
    },
  },
  {
    id: 'schedule_preference',
    question: "When are you most yourself?",
    subtitle: "This helps your guide match your natural rhythm",
    type: 'single',
    options: [
      { id: 'early_bird', emoji: '🌅', label: 'Early bird', description: 'I come alive in the morning' },
      { id: 'normal', emoji: '☀️', label: 'Daytime person', description: 'Pretty standard schedule' },
      { id: 'night_owl', emoji: '🦉', label: 'Night owl', description: 'I do my best thinking late' },
    ],
  },
  {
    id: 'chronotype_change',
    question: "Are you trying to change your sleep schedule?",
    subtitle: "Your guide can support gradual rhythm shifts",
    type: 'single',
    options: [
      { id: 'no', emoji: '✓', label: 'No, I\'m good', description: 'My current rhythm works for me' },
      { id: 'earlier', emoji: '🌅', label: 'Want earlier mornings', description: 'Trying to become more of a morning person' },
      { id: 'later', emoji: '🌙', label: 'Want later nights', description: 'Trying to shift to a later schedule' },
      { id: 'flexible', emoji: '🔄', label: 'Want more flexibility', description: 'Adapting to changing demands' },
    ],
  },
  {
    id: 'travel_frequency',
    question: "Do you travel across time zones?",
    subtitle: "Helps your guide support jet lag recovery",
    type: 'single',
    options: [
      { id: 'rarely', emoji: '🏠', label: 'Rarely', description: 'I mostly stay in one timezone' },
      { id: 'occasionally', emoji: '✈️', label: 'Occasionally', description: 'A few times a year' },
      { id: 'frequently', emoji: '🌍', label: 'Frequently', description: 'Regular international travel' },
    ],
  },
  {
    id: 'approach_preference',
    question: "Which approaches interest you?",
    subtitle: "Select any that resonate",
    type: 'multi',
    options: [
      { id: 'mindfulness', emoji: '🧘', label: 'Mindfulness', description: 'Present-moment awareness' },
      { id: 'cbt', emoji: '🧠', label: 'Thought patterns', description: 'Understanding how thoughts affect feelings' },
      { id: 'somatic', emoji: '🫀', label: 'Body awareness', description: 'Tuning into physical sensations' },
      { id: 'strengths', emoji: '💪', label: 'Strengths-based', description: 'Building on what works' },
      { id: 'spiritual', emoji: '🌙', label: 'Spiritual', description: 'Meaning, connection, intuition' },
    ],
  },
  {
    id: 'persona_pick',
    question: "Finally, meet your guides",
    subtitle: "Who do you want to talk to first?",
    hint: "Your guide learns and adapts to you over time. Want to customize faster? Head to Settings anytime.",
    type: 'single',
    options: [
      { id: 'clover', emoji: '🍀', label: 'Clover', description: 'Your lucky friend - warm & casual' },
      { id: 'spark', emoji: '✨', label: 'Spark', description: 'Your cheerleader - energetic & motivating' },
      { id: 'willow', emoji: '🌿', label: 'Willow', description: 'The sage - calm & wise' },
      { id: 'luna', emoji: '🌙', label: 'Luna', description: 'The mystic - mindful & present' },
      { id: 'ridge', emoji: '⛰️', label: 'Ridge', description: 'The coach - focused & driven' },
      { id: 'flint', emoji: '🔥', label: 'Flint', description: 'The straight shooter - direct & honest' },
      { id: 'fern', emoji: '🌱', label: 'Fern', description: 'The nurturer - soft & gentle' },
    ],
  },
];

/**
 * Map onboarding answers to recommended persona
 */
export function recommendPersonaFromAnswers(answers: Record<string, string | string[]>): CoachPersona {
  const supportStyle = answers.support_style as string;
  const commPref = answers.communication_preference as string;
  const energyPref = answers.energy_preference as string;

  // If they explicitly picked a persona, use that
  if (answers.persona_pick) {
    return answers.persona_pick as CoachPersona;
  }

  // Otherwise, recommend based on their answers
  if (supportStyle === 'calm' || commPref === 'gentle') {
    return energyPref === '0' ? 'luna' : 'fern';
  }
  if (supportStyle === 'motivation' || commPref === 'direct') {
    return energyPref === '2' ? 'spark' : 'flint';
  }
  if (supportStyle === 'solutions') {
    return 'ridge';
  }
  if (supportStyle === 'perspective') {
    return 'willow';
  }
  if (commPref === 'casual') {
    return 'clover';
  }

  return 'clover'; // Default friendly option
}

/**
 * Map onboarding answers to detailed settings
 */
export function mapAnswersToSettings(
  answers: Record<string, string | string[]>
): Partial<DetailedSettings> {
  const settings: Partial<DetailedSettings> = {};

  // Map energy preference
  const energy = answers.energy_preference as string;
  if (energy === '0') settings.energyLevel = 'calm';
  else if (energy === '2') settings.energyLevel = 'energetic';
  else settings.energyLevel = 'balanced';

  // Map communication preference
  const comm = answers.communication_preference as string;
  if (comm === 'casual') settings.formality = 'casual';
  else if (comm === 'gentle') {
    settings.directness = 'gentle';
    settings.validationStyle = 'heavy';
  } else if (comm === 'direct') {
    settings.directness = 'direct';
    settings.validationStyle = 'light';
  } else if (comm === 'thoughtful') {
    settings.responseLength = 'detailed';
    settings.questionFrequency = 'lots';
  }

  // Map approach preferences
  const approaches = answers.approach_preference as string[];
  if (approaches) {
    settings.useMindfulness = approaches.includes('mindfulness') || approaches.includes('spiritual');
    settings.useCBT = approaches.includes('cbt');
    settings.useSomatic = approaches.includes('somatic');
    settings.useStrengthsBased = approaches.includes('strengths');
  }

  return settings;
}

/**
 * Generate personalized mood mappings based on onboarding answers
 * This determines which persona to switch to for each detected mood
 */
export function generateMoodMappings(
  answers: Record<string, string | string[]>,
  basePersona: CoachPersona
): Record<string, CoachPersona> {
  const supportStyle = answers.support_style as string;
  const commPref = answers.communication_preference as string;
  const energyPref = answers.energy_preference as string;
  const approaches = (answers.approach_preference as string[]) || [];

  // Start with base mappings
  const mappings: Record<string, CoachPersona> = {
    anxious: 'luna',
    sad: 'fern',
    angry: 'flint',
    happy: 'spark',
    neutral: basePersona,
  };

  // Personalize based on support style preference
  if (supportStyle === 'solutions') {
    // They want practical help - use goal-oriented personas
    mappings.anxious = 'ridge'; // Focus on action over calm
    mappings.sad = 'ridge';     // Give them something to do
  } else if (supportStyle === 'validation') {
    // They want to feel heard - use nurturing personas
    mappings.anxious = 'fern';  // Extra gentle
    mappings.angry = 'fern';    // Validate before addressing
  } else if (supportStyle === 'motivation') {
    // They want energy - use uplifting personas
    mappings.sad = 'spark';     // Energize them
    mappings.anxious = 'spark'; // Positive redirect
  } else if (supportStyle === 'perspective') {
    // They want wisdom - use reflective personas
    mappings.anxious = 'willow';
    mappings.sad = 'willow';
    mappings.angry = 'willow';
  }

  // Further adjust based on communication preference
  if (commPref === 'gentle') {
    // Override any direct personas with gentle ones
    if (mappings.angry === 'flint') mappings.angry = 'fern';
    if (mappings.anxious === 'ridge') mappings.anxious = 'luna';
  } else if (commPref === 'direct') {
    // They can handle directness even in tough moments
    if (mappings.sad === 'fern') mappings.sad = 'flint';
  }

  // Adjust based on energy preference
  if (energyPref === '0') {
    // Prefer calm energy across the board
    if (mappings.happy === 'spark') mappings.happy = 'clover';
    if (mappings.anxious === 'spark') mappings.anxious = 'luna';
  } else if (energyPref === '2') {
    // Prefer high energy
    if (mappings.neutral === 'clover') mappings.neutral = 'spark';
  }

  // Adjust based on approaches they're interested in
  if (approaches.includes('mindfulness') || approaches.includes('spiritual')) {
    mappings.anxious = 'luna'; // Mindful presence for anxiety
  }
  if (approaches.includes('somatic')) {
    // Body-aware personas
    if (mappings.anxious !== 'luna') mappings.anxious = 'luna';
  }

  return mappings;
}
