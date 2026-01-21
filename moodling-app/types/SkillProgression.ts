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
  | 'mindfulness'
  | 'games';

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

// Available skills - comprehensive wellness toolkit
export const AVAILABLE_SKILLS: Skill[] = [
  // ==================== GROUNDING ====================
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
    description: 'Simple 4-count breathing technique for instant calm',
    category: 'grounding',
    emoji: '📦',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'cold_water',
    name: 'Cold Water Reset',
    description: 'Use cold water to activate your dive reflex and calm down fast',
    category: 'grounding',
    emoji: '🧊',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'grounding_objects',
    name: 'Grounding Objects',
    description: 'Create a kit of tactile items to hold during anxiety',
    category: 'grounding',
    emoji: '🪨',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'resilience',
    requiredLevel: 2,
  },
  {
    id: 'butterfly_hug',
    name: 'Butterfly Hug',
    description: 'Self-soothing bilateral stimulation technique',
    category: 'grounding',
    emoji: '🦋',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'physiological_sigh',
    name: 'Physiological Sigh',
    description: 'Double inhale + long exhale - fastest way to calm your nervous system',
    category: 'grounding',
    emoji: '💨',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'safe_place_visualization',
    name: 'Safe Place',
    description: 'Build a detailed mental sanctuary you can visit anytime',
    category: 'grounding',
    emoji: '🏡',
    isPremium: true,
    isUnlocked: false,
    previewText: 'Guided visualization to create your personal mental retreat',
  },

  // ==================== ANXIETY ====================
  {
    id: 'worry_time',
    name: 'Scheduled Worry Time',
    description: 'Contain worries to a specific 15-minute window',
    category: 'anxiety',
    emoji: '⏰',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'thought_challenging',
    name: 'Thought Challenging',
    description: 'Question and reframe anxious thoughts using CBT',
    category: 'anxiety',
    emoji: '💭',
    isPremium: true,
    isUnlocked: false,
    requiredAttribute: 'clarity',
    requiredLevel: 3,
    previewText: 'Learn to identify and challenge cognitive distortions',
  },
  {
    id: 'worst_case_best_case',
    name: 'Worst/Best/Likely',
    description: 'Balance catastrophizing by exploring all outcomes',
    category: 'anxiety',
    emoji: '⚖️',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'clarity',
    requiredLevel: 2,
  },
  {
    id: 'anxiety_ladder',
    name: 'Anxiety Ladder',
    description: 'Gradual exposure to fears in small steps',
    category: 'anxiety',
    emoji: '🪜',
    isPremium: true,
    isUnlocked: false,
    requiredAttribute: 'resilience',
    requiredLevel: 4,
    previewText: 'Structured approach to facing fears gradually',
  },
  {
    id: 'fact_vs_feeling',
    name: 'Fact vs Feeling',
    description: 'Separate what you feel from what is actually true',
    category: 'anxiety',
    emoji: '🔍',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'containment',
    name: 'Mental Containment',
    description: 'Visualize putting worries in a box to deal with later',
    category: 'anxiety',
    emoji: '📦',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'wisdom',
    requiredLevel: 2,
  },
  {
    id: 'uncertainty_tolerance',
    name: 'Sitting with Uncertainty',
    description: 'Build your capacity to tolerate not knowing',
    category: 'anxiety',
    emoji: '🌫️',
    isPremium: true,
    isUnlocked: false,
    requiredAttribute: 'resilience',
    requiredLevel: 5,
    previewText: 'Advanced technique for accepting uncertainty',
  },

  // ==================== SLEEP ====================
  {
    id: 'wind_down',
    name: 'Wind Down Routine',
    description: 'Guided 30-minute evening relaxation sequence',
    category: 'sleep',
    emoji: '🌙',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'sleep_stories',
    name: 'Sleep Stories',
    description: 'Classic literature from public domain archives to drift off to',
    category: 'sleep',
    emoji: '📖',
    isPremium: false,
    isUnlocked: true,
    previewText: 'Free bedtime stories from Project Gutenberg and Librivox',
  },
  {
    id: 'old_time_radio',
    name: 'Old Time Radio',
    description: 'Classic radio dramas from the golden age - mystery, sci-fi, and more',
    category: 'sleep',
    emoji: '📻',
    isPremium: false,
    isUnlocked: true,
    previewText: 'The Shadow, Suspense, X Minus One, and thousands more',
  },
  {
    id: 'ambient_sounds',
    name: 'Ambient Soundscapes',
    description: 'Rain, ocean waves, forest sounds, and white noise for sleep',
    category: 'sleep',
    emoji: '🌊',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'body_scan_sleep',
    name: 'Sleep Body Scan',
    description: 'Progressive muscle relaxation optimized for sleep',
    category: 'sleep',
    emoji: '🛏️',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'cognitive_shuffle',
    name: 'Cognitive Shuffle',
    description: 'Random word visualization to quiet racing thoughts',
    category: 'sleep',
    emoji: '🔀',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'wisdom',
    requiredLevel: 2,
  },
  {
    id: 'sleep_hygiene',
    name: 'Sleep Hygiene Checklist',
    description: 'Optimize your environment and habits for better sleep',
    category: 'sleep',
    emoji: '✅',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'worry_journal_night',
    name: 'Bedtime Worry Dump',
    description: 'Write out tomorrow\'s concerns before bed',
    category: 'sleep',
    emoji: '📝',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: '478_breathing',
    name: '4-7-8 Sleep Breathing',
    description: 'Dr. Weil\'s relaxing breath technique for sleep',
    category: 'sleep',
    emoji: '😴',
    isPremium: false,
    isUnlocked: true,
  },

  // ==================== FOCUS ====================
  {
    id: 'pomodoro',
    name: 'Focus Timer',
    description: 'Structured work (25 min) and break (5 min) intervals',
    category: 'focus',
    emoji: '🍅',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'brain_dump',
    name: 'Brain Dump',
    description: 'Clear mental clutter by writing everything down',
    category: 'focus',
    emoji: '🧠',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'single_tasking',
    name: 'Single-Tasking',
    description: 'Commit to one thing at a time with intention',
    category: 'focus',
    emoji: '🎯',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'environment_design',
    name: 'Environment Design',
    description: 'Set up your space to reduce distractions',
    category: 'focus',
    emoji: '🏠',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'clarity',
    requiredLevel: 2,
  },
  {
    id: 'energy_mapping',
    name: 'Energy Mapping',
    description: 'Track your energy levels to find your peak hours',
    category: 'focus',
    emoji: '📊',
    isPremium: true,
    isUnlocked: false,
    previewText: 'Discover when you\'re naturally most focused',
  },
  {
    id: 'task_batching',
    name: 'Task Batching',
    description: 'Group similar tasks to reduce context switching',
    category: 'focus',
    emoji: '📦',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'clarity',
    requiredLevel: 3,
  },
  {
    id: 'two_minute_rule',
    name: 'Two-Minute Rule',
    description: 'If it takes less than 2 minutes, do it now',
    category: 'focus',
    emoji: '⚡',
    isPremium: false,
    isUnlocked: true,
  },

  // ==================== SELF-CARE ====================
  {
    id: 'self_compassion_break',
    name: 'Self-Compassion Break',
    description: 'Kristin Neff\'s 3-step kindness practice',
    category: 'self_care',
    emoji: '💝',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'compassion',
    requiredLevel: 2,
  },
  {
    id: 'joy_list',
    name: 'Joy List',
    description: 'Build a personal menu of mood boosters',
    category: 'self_care',
    emoji: '✨',
    isPremium: false,
    isUnlocked: true,
  },

  {
    id: 'gratitude_practice',
    name: 'Gratitude Practice',
    description: 'Daily practice of noticing what\'s good',
    category: 'self_care',
    emoji: '🙏',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'inner_critic_work',
    name: 'Inner Critic Dialogue',
    description: 'Transform your inner critic into an inner ally',
    category: 'self_care',
    emoji: '🗣️',
    isPremium: true,
    isUnlocked: false,
    requiredAttribute: 'compassion',
    requiredLevel: 4,
    previewText: 'Advanced self-compassion work for the harsh inner voice',
  },
  {
    id: 'values_clarification',
    name: 'Values Clarification',
    description: 'Discover what truly matters to you',
    category: 'self_care',
    emoji: '🧭',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'wisdom',
    requiredLevel: 3,
  },
  {
    id: 'needs_inventory',
    name: 'Needs Inventory',
    description: 'Identify your unmet emotional needs',
    category: 'self_care',
    emoji: '📋',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'clarity',
    requiredLevel: 2,
  },
  {
    id: 'pleasure_menu',
    name: 'Pleasure Menu',
    description: 'Build a list of sensory pleasures for hard days',
    category: 'self_care',
    emoji: '🍫',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'energy_budget',
    name: 'Energy Budget',
    description: 'Manage your emotional energy like a resource',
    category: 'self_care',
    emoji: '🔋',
    isPremium: true,
    isUnlocked: false,
    previewText: 'Track and protect your emotional energy',
  },

  // ==================== RELATIONSHIPS ====================
  {
    id: 'boundary_scripts',
    name: 'Boundary Scripts',
    description: 'Ready-to-use phrases for common boundary situations',
    category: 'relationships',
    emoji: '🚧',
    isPremium: true,
    isUnlocked: false,
    requiredAttribute: 'resilience',
    requiredLevel: 4,
    previewText: 'Scripts for saying no, asking for space, and more',
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
  {
    id: 'repair_conversations',
    name: 'Repair Conversations',
    description: 'How to reconnect after a conflict',
    category: 'relationships',
    emoji: '🔧',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'compassion',
    requiredLevel: 3,
  },
  {
    id: 'i_statements',
    name: 'I-Statements',
    description: 'Express feelings without blame or accusation',
    category: 'relationships',
    emoji: '💬',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'active_listening',
    name: 'Active Listening',
    description: 'Techniques to truly hear and understand others',
    category: 'relationships',
    emoji: '👂',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'wisdom',
    requiredLevel: 2,
  },
  {
    id: 'support_network_map',
    name: 'Support Network Map',
    description: 'Visualize and strengthen your support system',
    category: 'relationships',
    emoji: '🗺️',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'difficult_conversations',
    name: 'Difficult Conversations',
    description: 'Framework for having hard but necessary talks',
    category: 'relationships',
    emoji: '🎭',
    isPremium: true,
    isUnlocked: false,
    requiredAttribute: 'resilience',
    requiredLevel: 5,
    previewText: 'Navigate sensitive topics with skill and care',
  },
  {
    id: 'relationship_inventory',
    name: 'Relationship Inventory',
    description: 'Assess which relationships energize or drain you',
    category: 'relationships',
    emoji: '📊',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'clarity',
    requiredLevel: 3,
  },

  // ==================== MINDFULNESS ====================
  {
    id: 'body_scan',
    name: 'Body Scan',
    description: 'Progressive awareness through your body',
    category: 'mindfulness',
    emoji: '🧘',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'loving_kindness',
    name: 'Loving Kindness',
    description: 'Metta meditation for warmth toward self and others',
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
  {
    id: 'noting_practice',
    name: 'Noting Practice',
    description: 'Label thoughts and feelings as they arise',
    category: 'mindfulness',
    emoji: '🏷️',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'clarity',
    requiredLevel: 2,
  },
  {
    id: 'rain_technique',
    name: 'RAIN Technique',
    description: 'Recognize, Allow, Investigate, Nurture difficult emotions',
    category: 'mindfulness',
    emoji: '🌧️',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'compassion',
    requiredLevel: 2,
  },
  {
    id: 'mindful_eating',
    name: 'Mindful Eating',
    description: 'Bring full awareness to the experience of eating',
    category: 'mindfulness',
    emoji: '🥢',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'walking_meditation',
    name: 'Walking Meditation',
    description: 'Turn any walk into a mindfulness practice',
    category: 'mindfulness',
    emoji: '🚶',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'open_awareness',
    name: 'Open Awareness',
    description: 'Rest in spacious awareness without focusing on anything',
    category: 'mindfulness',
    emoji: '☁️',
    isPremium: true,
    isUnlocked: false,
    requiredAttribute: 'wisdom',
    requiredLevel: 5,
    previewText: 'Advanced meditation: awareness without an object',
  },
  {
    id: 'urge_surfing',
    name: 'Urge Surfing',
    description: 'Ride out cravings and impulses without acting on them',
    category: 'mindfulness',
    emoji: '🏄',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'resilience',
    requiredLevel: 3,
  },
  {
    id: 'emotional_labeling',
    name: 'Emotional Labeling',
    description: 'Name emotions precisely to reduce their intensity',
    category: 'mindfulness',
    emoji: '🎨',
    isPremium: false,
    isUnlocked: true,
  },

  // ==================== MINDFUL GAMES ====================
  {
    id: 'asteroids',
    name: 'Mindful Asteroids',
    description: 'Classic space shooter - focus and flow in the void',
    category: 'games',
    emoji: '🚀',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'retro_snake',
    name: 'Retro Snake',
    description: 'Nokia-style Snake with vintage aesthetics',
    category: 'games',
    emoji: '🐍',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'retro_pong',
    name: 'Classic Pong',
    description: 'CRT-style Pong with phosphor green glow',
    category: 'games',
    emoji: '🏓',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'fidget_pad',
    name: 'Fidget Pad',
    description: 'Digital fidget toys - bubbles, sliders, and spinners',
    category: 'games',
    emoji: '🔘',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'bubble_wrap',
    name: 'Bubble Wrap',
    description: 'Endless satisfying pops with haptic feedback',
    category: 'games',
    emoji: '🫧',
    isPremium: false,
    isUnlocked: true,
  },
  {
    id: 'zen_blocks',
    name: 'Zen Blocks',
    description: 'Tetris-like stacking without game over pressure',
    category: 'games',
    emoji: '🧱',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'clarity',
    requiredLevel: 2,
  },
  {
    id: 'color_sort',
    name: 'Color Sort',
    description: 'Satisfying color sorting puzzle',
    category: 'games',
    emoji: '🎨',
    isPremium: false,
    isUnlocked: true,
  },
];

// Coach unlocks - abilities and customizations for your guide
export const COACH_UNLOCKS: CoachUnlock[] = [
  // Personality Traits
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
    id: 'tough_love',
    name: 'Tough Love Mode',
    description: 'Direct, no-nonsense encouragement when you need it',
    emoji: '💪',
    type: 'personality_trait',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'resilience',
    requiredLevel: 3,
  },
  {
    id: 'nurturing_mode',
    name: 'Extra Nurturing',
    description: 'More gentle, parental care in responses',
    emoji: '🌷',
    type: 'personality_trait',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'compassion',
    requiredLevel: 3,
  },

  // Conversation Styles
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
    id: 'socratic_mode',
    name: 'Socratic Dialogue',
    description: 'Coach guides you through questions rather than answers',
    emoji: '🤔',
    type: 'conversation_style',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'wisdom',
    requiredLevel: 4,
  },
  {
    id: 'storytelling_mode',
    name: 'Story & Metaphor',
    description: 'Coach uses stories and analogies to illustrate points',
    emoji: '📚',
    type: 'conversation_style',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'wisdom',
    requiredLevel: 3,
  },
  {
    id: 'action_focused',
    name: 'Action-Focused',
    description: 'More concrete suggestions and next steps',
    emoji: '🎯',
    type: 'conversation_style',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'clarity',
    requiredLevel: 2,
  },

  // Special Abilities
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
    id: 'pattern_insights',
    name: 'Pattern Insights',
    description: 'Coach references your mood patterns in conversations',
    emoji: '📊',
    type: 'special_ability',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'clarity',
    requiredLevel: 4,
  },
  {
    id: 'memory_recall',
    name: 'Enhanced Memory',
    description: 'Coach remembers and references past conversations',
    emoji: '🧠',
    type: 'special_ability',
    isPremium: true,
    isUnlocked: false,
    requiredAttribute: 'wisdom',
    requiredLevel: 5,
  },
  {
    id: 'proactive_checkins',
    name: 'Proactive Check-ins',
    description: 'Coach asks follow-up questions about previous concerns',
    emoji: '👋',
    type: 'special_ability',
    isPremium: false,
    isUnlocked: false,
    requiredAttribute: 'compassion',
    requiredLevel: 4,
  },

  // Voice
  {
    id: 'voice_responses',
    name: 'Voice Responses',
    description: 'Your coach can speak responses aloud',
    emoji: '🔊',
    type: 'voice',
    isPremium: true,
    isUnlocked: false,
  },
  {
    id: 'voice_journaling',
    name: 'Voice Journaling',
    description: 'Speak your journal entries instead of typing',
    emoji: '🎙️',
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
  games: { name: 'Mindful Games', emoji: '🎮', color: '#6366F1' },
};
