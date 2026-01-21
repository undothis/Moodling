/**
 * Skills Progression System Types
 *
 * D&D-inspired growth system with non-competitive attributes.
 * Users accumulate points naturally through app usage.
 */

// Core attributes that grow over time
export type AttributeType = 'wisdom' | 'resilience' | 'clarity' | 'compassion';

export interface Attribute {
  id: AttributeType;
  name: string;
  description: string;
  emoji: string;
  points: number;
  level: number; // Derived from points
}

// How attributes are earned
export interface AttributeSource {
  action: string;
  attribute: AttributeType;
  points: number;
  description: string;
}

// Skill/Tool that can be unlocked
export type SkillCategory =
  | 'grounding'
  | 'anxiety'
  | 'sleep'
  | 'focus'
  | 'self_care'
  | 'relationships'
  | 'mindfulness';

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  emoji: string;
  isPremium: boolean;
  isUnlocked: boolean;
  requiredAttribute?: AttributeType;
  requiredLevel?: number;
  // For premium skills
  previewText?: string;
}

// Coach customization unlocks
export interface CoachUnlock {
  id: string;
  name: string;
  description: string;
  emoji: string;
  type: 'voice' | 'personality_trait' | 'conversation_style' | 'special_ability';
  isPremium: boolean;
  isUnlocked: boolean;
  requiredAttribute?: AttributeType;
  requiredLevel?: number;
}

// User's progression state
export interface ProgressionState {
  attributes: Record<AttributeType, Attribute>;
  unlockedSkills: string[];
  unlockedCoachFeatures: string[];
  totalPointsEarned: number;
  journeyStartDate: string;
  lastActivityDate: string;
}

// Attribute definitions
export const ATTRIBUTES: Record<AttributeType, Omit<Attribute, 'points' | 'level'>> = {
  wisdom: {
    id: 'wisdom',
    name: 'Wisdom',
    description: 'Grows from reflection and consistent journaling',
    emoji: '🦉',
  },
  resilience: {
    id: 'resilience',
    name: 'Resilience',
    description: 'Built through using techniques during tough moments',
    emoji: '🏔️',
  },
  clarity: {
    id: 'clarity',
    name: 'Clarity',
    description: 'Earned by identifying patterns and triggers',
    emoji: '💎',
  },
  compassion: {
    id: 'compassion',
    name: 'Compassion',
    description: 'Developed through self-kindness practices',
    emoji: '💚',
  },
};

// How points are earned
export const POINT_SOURCES: AttributeSource[] = [
  // Wisdom sources
  { action: 'journal_entry', attribute: 'wisdom', points: 5, description: 'Writing a journal entry' },
  { action: 'journal_reflection', attribute: 'wisdom', points: 3, description: 'Reading past entries' },
  { action: 'weekly_review', attribute: 'wisdom', points: 10, description: 'Reviewing your week' },

  // Resilience sources
  { action: 'grounding_exercise', attribute: 'resilience', points: 8, description: 'Completing a grounding exercise' },
  { action: 'difficult_moment_log', attribute: 'resilience', points: 10, description: 'Journaling during a hard time' },
  { action: 'coping_skill_used', attribute: 'resilience', points: 5, description: 'Using a coping technique' },

  // Clarity sources
  { action: 'pattern_identified', attribute: 'clarity', points: 15, description: 'Recognizing a mood pattern' },
  { action: 'trigger_logged', attribute: 'clarity', points: 8, description: 'Identifying a trigger' },
  { action: 'insights_viewed', attribute: 'clarity', points: 3, description: 'Checking your insights' },

  // Compassion sources
  { action: 'self_kindness_practice', attribute: 'compassion', points: 10, description: 'Practicing self-compassion' },
  { action: 'positive_affirmation', attribute: 'compassion', points: 5, description: 'Reading an affirmation' },
  { action: 'gentle_reminder_accepted', attribute: 'compassion', points: 3, description: 'Accepting a gentle nudge' },
];

// Level thresholds (points needed for each level)
export const LEVEL_THRESHOLDS = [0, 25, 75, 150, 300, 500, 750, 1000, 1500, 2000];

// Calculate level from points
export function calculateLevel(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

// Get progress to next level (0-100)
export function getLevelProgress(points: number): number {
  const level = calculateLevel(points);
  if (level >= LEVEL_THRESHOLDS.length) return 100;

  const currentThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_THRESHOLDS[level];
  const progress = ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(100, Math.max(0, progress));
}

// Available skills
export const AVAILABLE_SKILLS: Skill[] = [
  // Grounding (free)
  {
    id: 'five_senses',
    name: '5-4-3-2-1 Grounding',
    description: 'Use your senses to anchor to the present moment',
    category: 'grounding',
    emoji: '🖐️',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'box_breathing',
    name: 'Box Breathing',
    description: 'Simple 4-count breathing technique',
    category: 'grounding',
    emoji: '📦',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'body_scan',
    name: 'Body Scan',
    description: 'Progressive relaxation through body awareness',
    category: 'mindfulness',
    emoji: '🧘',
    isPremium: false,
    isUnlocked: true,
  },

  // Anxiety tools
  {
    id: 'worry_time',
    name: 'Scheduled Worry Time',
    description: 'Contain worries to a specific time',
    category: 'anxiety',
    emoji: '⏰',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'thought_challenging',
    name: 'Thought Challenging',
    description: 'Question and reframe anxious thoughts',
    category: 'anxiety',
    emoji: '💭',
    isPremium: true,
    isUnlocked: false,
    requiredAttribute: 'clarity',
    requiredLevel: 3,
    previewText: 'Learn to identify and challenge cognitive distortions',
  },

  // Sleep tools
  {
    id: 'wind_down',
    name: 'Wind Down Routine',
    description: 'Guided evening relaxation',
    category: 'sleep',
    emoji: '🌙',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'sleep_stories',
    name: 'Sleep Stories',
    description: 'Calming narratives to drift off to',
    category: 'sleep',
    emoji: '📖',
    isPremium: true,
    isUnlocked: false,
    previewText: 'Soothing stories designed to help you fall asleep',
  },

  // Focus tools
  {
    id: 'pomodoro',
    name: 'Focus Timer',
    description: 'Structured work and break intervals',
    category: 'focus',
    emoji: '🍅',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'brain_dump',
    name: 'Brain Dump',
    description: 'Clear mental clutter onto paper',
    category: 'focus',
    emoji: '🧠',
    isPremium: false,
    isUnlocked: true,
  },

  // Self-care
  {
    id: 'self_compassion_break',
    name: 'Self-Compassion Break',
    description: 'A moment of kindness for yourself',
    category: 'self_care',
    emoji: '💝',
    isPremium: false,
    isUnlocked: true,
    requiredAttribute: 'compassion',
    requiredLevel: 2,
  },
  {
    id: 'joy_list',
    name: 'Joy List',
    description: 'Build a personal list of mood boosters',
    category: 'self_care',
    emoji: '✨',
    isPremium: false,
    isUnlocked: true,
  },

  // Relationships
  {
    id: 'boundary_scripts',
    name: 'Boundary Scripts',
    description: 'Templates for setting healthy boundaries',
    category: 'relationships',
    emoji: '🚧',
    isPremium: true,
    isUnlocked: false,
    requiredAttribute: 'resilience',
    requiredLevel: 4,
    previewText: 'Ready-to-use phrases for common boundary situations',
  },
  {
    id: 'conflict_cool_down',
    name: 'Conflict Cool Down',
    description: 'Steps to de-escalate before responding',
    category: 'relationships',
    emoji: '❄️',
    isPremium: false,
    isUnlocked: true,
  },

  // Mindfulness
  {
    id: 'loving_kindness',
    name: 'Loving Kindness',
    description: 'Meditation for warmth toward self and others',
    category: 'mindfulness',
    emoji: '💗',
    isPremium: true,
    isUnlocked: false,
    requiredAttribute: 'compassion',
    requiredLevel: 3,
    previewText: 'Cultivate feelings of love and goodwill',
  },
  {
    id: 'mindful_moment',
    name: 'Mindful Moment',
    description: 'Quick 1-minute presence practice',
    category: 'mindfulness',
    emoji: '🌸',
    isPremium: false,
    isUnlocked: true,
  },
];

// Coach unlocks
export const COACH_UNLOCKS: CoachUnlock[] = [
  {
    id: 'humor_mode',
    name: 'Light Humor',
    description: 'Your coach can use gentle humor when appropriate',
    emoji: '😊',
    type: 'personality_trait',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'wisdom',
    requiredLevel: 2,
  },
  {
    id: 'deep_questions',
    name: 'Deep Questions',
    description: 'Unlock thought-provoking reflection prompts',
    emoji: '🔮',
    type: 'conversation_style',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'clarity',
    requiredLevel: 3,
  },
  {
    id: 'celebration_mode',
    name: 'Celebration Mode',
    description: 'Your coach celebrates wins with more enthusiasm',
    emoji: '🎉',
    type: 'personality_trait',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'compassion',
    requiredLevel: 2,
  },
  {
    id: 'crisis_support',
    name: 'Enhanced Crisis Support',
    description: 'More detailed guidance during difficult moments',
    emoji: '🛡️',
    type: 'special_ability',
    isPremium: true,
    isUnlocked: false,
    requiredAttribute: 'resilience',
    requiredLevel: 5,
  },
  {
    id: 'voice_responses',
    name: 'Voice Responses',
    description: 'Your coach can speak responses aloud',
    emoji: '🔊',
    type: 'voice',
    isPremium: true,
    isUnlocked: false,
  },
];

// Category display info
export const SKILL_CATEGORIES: Record<SkillCategory, { name: string; emoji: string; color: string }> = {
  grounding: { name: 'Grounding', emoji: '🌍', color: '#8B4513' },
  anxiety: { name: 'Anxiety Relief', emoji: '🌊', color: '#4A90A4' },
  sleep: { name: 'Sleep', emoji: '🌙', color: '#6B5B95' },
  focus: { name: 'Focus', emoji: '🎯', color: '#FF6B6B' },
  self_care: { name: 'Self Care', emoji: '💚', color: '#88B04B' },
  relationships: { name: 'Relationships', emoji: '🤝', color: '#F7CAC9' },
  mindfulness: { name: 'Mindfulness', emoji: '🧘', color: '#92A8D1' },
};
