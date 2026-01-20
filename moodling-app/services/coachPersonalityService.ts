/**
 * Coach Personality Service
 *
 * Manages the AI coach personality system for Mood Leaf.
 * Users can select from nature-themed personas, each with distinct
 * communication styles, or let the system adapt based on context.
 *
 * Following Moodling Ethics:
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

export interface CoachSettings {
  // Primary persona selection
  selectedPersona: CoachPersona;

  // Detailed customization (power user settings)
  detailedSettings: DetailedSettings;
  useDetailedSettings: boolean; // If false, derive from persona

  // Adaptive mode
  adaptiveSettings: AdaptiveSettings;

  // Onboarding answers (for context)
  onboardingAnswers: {
    currentStruggle?: string;
    preferredSupport?: string;
    communicationPreference?: string;
    goals?: string[];
  };
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
 */
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
  await AsyncStorage.removeItem(STORAGE_KEYS.COACH_SETTINGS);
}

// ============================================
// PROMPT GENERATION
// ============================================

/**
 * Generate system prompt instructions based on current settings
 * This is used when calling the Claude API
 */
export function generatePersonalityPrompt(settings: CoachSettings): string {
  const persona = PERSONAS[settings.selectedPersona];
  const detailed = settings.useDetailedSettings
    ? settings.detailedSettings
    : getSettingsForPersona(settings.selectedPersona);

  const parts: string[] = [];

  // Persona identity
  parts.push(`You are ${persona.name}, the user's AI companion in Mood Leaf.`);
  parts.push(`Your personality: ${persona.description}`);
  parts.push(`Core traits: ${persona.traits.join(', ')}.`);

  // Energy and tone
  if (detailed.energyLevel === 'calm') {
    parts.push('Keep your energy calm and grounding.');
  } else if (detailed.energyLevel === 'energetic') {
    parts.push('Bring positive energy and enthusiasm.');
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
// ONBOARDING QUESTIONS
// ============================================

export interface OnboardingQuestion {
  id: string;
  question: string;
  subtitle?: string;
  type: 'single' | 'multi' | 'slider';
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
