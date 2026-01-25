/**
 * Skills Service
 *
 * Manages the skills system for Mood Leaf including:
 * - Skill definitions and categories
 * - Progress tracking and leveling
 * - Premium skill gating
 * - Exercise configurations
 *
 * Following Mood Leaf Ethics:
 * - Skills build real-world capabilities
 * - No punishment for gaps (anti-streak)
 * - Celebrates attempts, not just completion
 * - Designed to help users NOT need the app
 *
 * Unit: Skills System
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  SKILL_PROGRESS: 'moodleaf_skill_progress',
  SKILL_USAGE_LOG: 'moodleaf_skill_usage_log',
  UNLOCKED_SKILLS: 'moodleaf_unlocked_skills',
  ENABLED_SKILLS: 'moodleaf_enabled_skills', // Which skills user has enabled
};

// ============================================
// SKILL TYPES & INTERFACES
// ============================================

export type SkillCategory =
  | 'mindfulness'
  | 'coping'
  | 'growth'
  | 'social'
  | 'advanced'
  | 'games';

export type SkillTier = 'free' | 'premium';

// D&D-style skill types for gamification
export type SkillType = 'calm' | 'ground' | 'focus' | 'challenge' | 'connect' | 'restore';

// Rarity for collectible feel
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface Skill {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: SkillCategory;
  tier: SkillTier;
  exercises: Exercise[];
  maxLevel: number;
  xpPerUse: number;
  xpPerLevel: number;
  // D&D-style attributes
  skillType: SkillType;
  rarity: Rarity;
  lore?: string; // Flavor text for collection feel
}

export interface Exercise {
  id: string;
  name: string;
  emoji: string;
  description: string;
  duration: number; // in seconds
  tier: SkillTier;
  type: ExerciseType;
  steps: ExerciseStep[];
  tags: string[];
  // D&D-style attributes
  skillType: SkillType;
  rarity: Rarity;
  lore?: string; // Flavor text
}

export type ExerciseType =
  | 'breathing'
  | 'grounding'
  | 'body_scan'
  | 'thought_challenge'
  | 'visualization'
  | 'journaling'
  | 'movement'
  | 'social_prep'
  | 'game'
  | 'fidget';

export interface ExerciseStep {
  instruction: string;
  duration?: number; // in seconds (null = wait for tap)
  visualType: 'circle_expand' | 'circle_shrink' | 'text' | 'progress' | 'timer';
  audioHint?: string; // e.g., "inhale", "exhale", "hold"
}

export interface SkillProgress {
  skillId: string;
  level: number;
  currentXP: number;
  totalXP: number;
  timesUsed: number;
  lastUsed?: string; // ISO date
  firstUsed?: string; // ISO date
  longestStreak?: number;
  currentStreak?: number;
}

export interface SkillUsageLog {
  skillId: string;
  exerciseId: string;
  timestamp: string;
  completed: boolean;
  duration: number; // actual seconds used
  rating?: number; // 1-5 user rating
}

export interface SkillCategoryInfo {
  id: SkillCategory;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

// ============================================
// SKILL CATEGORIES
// ============================================

export const SKILL_CATEGORIES: Record<SkillCategory, SkillCategoryInfo> = {
  mindfulness: {
    id: 'mindfulness',
    name: 'Mindfulness',
    emoji: '🧘',
    description: 'Present-moment awareness and grounding',
    color: '#7C3AED', // Purple
  },
  coping: {
    id: 'coping',
    name: 'Coping',
    emoji: '💪',
    description: 'Managing difficult emotions and thoughts',
    color: '#2563EB', // Blue
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    emoji: '🌱',
    description: 'Building habits and personal development',
    color: '#059669', // Green
  },
  social: {
    id: 'social',
    name: 'Social',
    emoji: '🎭',
    description: 'Connection, conversation, and boundaries',
    color: '#DC2626', // Red
  },
  advanced: {
    id: 'advanced',
    name: 'Advanced',
    emoji: '🔮',
    description: 'Deeper psychological exploration',
    color: '#7C3AED', // Purple
  },
  games: {
    id: 'games',
    name: 'Therapeutic Games',
    emoji: '🎮',
    description: 'Calming games that build skills',
    color: '#14B8A6', // Teal
  },
};

// ============================================
// EXERCISES LIBRARY
// ============================================

export const EXERCISES: Exercise[] = [
  // ========== BREATHING EXERCISES ==========
  {
    id: 'box_breathing',
    name: 'Box Breathing',
    emoji: '📦',
    description: '4-4-4-4 pattern to calm the nervous system',
    duration: 60,
    tier: 'free',
    type: 'breathing',
    tags: ['calm', 'anxiety', 'quick'],
    skillType: 'calm',
    rarity: 'common',
    lore: 'Used by Navy SEALs to stay calm under pressure. Now it\'s yours.',
    steps: [
      { instruction: 'Breathe IN...', duration: 4, visualType: 'circle_expand', audioHint: 'inhale' },
      { instruction: 'HOLD...', duration: 4, visualType: 'circle_expand', audioHint: 'hold' },
      { instruction: 'Breathe OUT...', duration: 4, visualType: 'circle_shrink', audioHint: 'exhale' },
      { instruction: 'HOLD...', duration: 4, visualType: 'circle_shrink', audioHint: 'hold' },
    ],
  },
  {
    id: '478_breathing',
    name: '4-7-8 Breathing',
    emoji: '🌙',
    description: 'Relaxation breath for sleep and deep calm',
    duration: 90,
    tier: 'free',
    type: 'breathing',
    tags: ['sleep', 'deep-calm', 'evening'],
    skillType: 'restore',
    rarity: 'common',
    lore: 'The moon\'s favorite breathing pattern. Best used when stars appear.',
    steps: [
      { instruction: 'Breathe IN...', duration: 4, visualType: 'circle_expand', audioHint: 'inhale' },
      { instruction: 'HOLD...', duration: 7, visualType: 'circle_expand', audioHint: 'hold' },
      { instruction: 'Breathe OUT slowly...', duration: 8, visualType: 'circle_shrink', audioHint: 'exhale' },
    ],
  },
  {
    id: 'coherent_breathing',
    name: 'Coherent Breathing',
    emoji: '💗',
    description: '5-5 rhythm that syncs with heart rate variability',
    duration: 120,
    tier: 'premium',
    type: 'breathing',
    tags: ['hrv', 'regulation', 'heart'],
    skillType: 'calm',
    rarity: 'uncommon',
    lore: 'Your heart has a rhythm. This breath matches it perfectly.',
    steps: [
      { instruction: 'Breathe IN...', duration: 5, visualType: 'circle_expand', audioHint: 'inhale' },
      { instruction: 'Breathe OUT...', duration: 5, visualType: 'circle_shrink', audioHint: 'exhale' },
    ],
  },
  {
    id: 'physiological_sigh',
    name: 'Physiological Sigh',
    emoji: '😮‍💨',
    description: 'Double inhale + long exhale for instant calm',
    duration: 30,
    tier: 'free',
    type: 'breathing',
    tags: ['quick', 'instant', 'stress'],
    skillType: 'calm',
    rarity: 'common',
    lore: 'The fastest reset button for your nervous system.',
    steps: [
      { instruction: 'Inhale through nose...', duration: 2, visualType: 'circle_expand', audioHint: 'inhale' },
      { instruction: 'Inhale again (top up)...', duration: 1, visualType: 'circle_expand', audioHint: 'inhale' },
      { instruction: 'Long exhale through mouth...', duration: 6, visualType: 'circle_shrink', audioHint: 'exhale' },
    ],
  },

  // ========== GROUNDING EXERCISES ==========
  {
    id: '54321_grounding',
    name: '5-4-3-2-1 Grounding',
    emoji: '🦶',
    description: 'Use your senses to anchor to the present',
    duration: 120,
    tier: 'free',
    type: 'grounding',
    tags: ['anxiety', 'dissociation', 'present'],
    skillType: 'ground',
    rarity: 'common',
    lore: 'Five senses, five anchors. The world is real. So are you.',
    steps: [
      { instruction: 'Name **5 things** you can SEE', visualType: 'text' },
      { instruction: 'Name **4 things** you can TOUCH', visualType: 'text' },
      { instruction: 'Name **3 things** you can HEAR', visualType: 'text' },
      { instruction: 'Name **2 things** you can SMELL', visualType: 'text' },
      { instruction: 'Name **1 thing** you can TASTE', visualType: 'text' },
    ],
  },
  {
    id: 'feet_on_floor',
    name: 'Feet on Floor',
    emoji: '👣',
    description: 'Simple anchoring through physical sensation',
    duration: 60,
    tier: 'free',
    type: 'grounding',
    tags: ['quick', 'subtle', 'anywhere'],
    skillType: 'ground',
    rarity: 'common',
    lore: 'Roots don\'t need to be visible to be strong.',
    steps: [
      { instruction: 'Press your feet firmly into the floor', duration: 5, visualType: 'text' },
      { instruction: 'Notice the pressure, temperature, texture', duration: 10, visualType: 'text' },
      { instruction: 'Wiggle your toes slowly', duration: 5, visualType: 'text' },
      { instruction: 'Feel the ground supporting you', duration: 10, visualType: 'text' },
      { instruction: 'You are here. You are safe.', duration: 5, visualType: 'text' },
    ],
  },
  {
    id: 'ice_cube',
    name: 'Ice Cube Grounding',
    emoji: '🧊',
    description: 'Intense sensation to interrupt overwhelming emotions',
    duration: 60,
    tier: 'premium',
    type: 'grounding',
    tags: ['intense', 'tipp', 'distress'],
    skillType: 'ground',
    rarity: 'uncommon',
    lore: 'Sometimes we need to feel something strong to remember we can feel.',
    steps: [
      { instruction: 'Hold an ice cube in your hand', visualType: 'text' },
      { instruction: 'Notice the cold intensely', duration: 10, visualType: 'timer' },
      { instruction: 'Focus only on the sensation', duration: 15, visualType: 'timer' },
      { instruction: 'Let the physical feeling anchor you', duration: 15, visualType: 'timer' },
      { instruction: 'The intensity is temporary. So is this feeling.', visualType: 'text' },
    ],
  },

  // ========== BODY SCAN EXERCISES ==========
  {
    id: 'quick_body_scan',
    name: 'Quick Body Scan',
    emoji: '🔍',
    description: '2-minute check-in with your body',
    duration: 120,
    tier: 'free',
    type: 'body_scan',
    tags: ['awareness', 'quick', 'check-in'],
    skillType: 'focus',
    rarity: 'common',
    lore: 'Your body holds wisdom. This is how you listen.',
    steps: [
      { instruction: 'Close your eyes if comfortable', duration: 5, visualType: 'text' },
      { instruction: 'Notice your HEAD - any tension?', duration: 15, visualType: 'text' },
      { instruction: 'Notice your SHOULDERS - holding anything?', duration: 15, visualType: 'text' },
      { instruction: 'Notice your CHEST - how is your breath?', duration: 15, visualType: 'text' },
      { instruction: 'Notice your STOMACH - any sensations?', duration: 15, visualType: 'text' },
      { instruction: 'Notice your LEGS and FEET', duration: 15, visualType: 'text' },
      { instruction: 'Take one deep breath. Open your eyes.', duration: 10, visualType: 'text' },
    ],
  },
  {
    id: 'progressive_relaxation',
    name: 'Progressive Muscle Relaxation',
    emoji: '💆',
    description: 'Tense and release each muscle group',
    duration: 300,
    tier: 'premium',
    type: 'body_scan',
    tags: ['tension', 'sleep', 'full'],
    skillType: 'restore',
    rarity: 'rare',
    lore: 'A technique from 1929 that still works. Some things are timeless.',
    steps: [
      { instruction: 'Start with your feet - TENSE for 5 seconds', duration: 5, visualType: 'timer' },
      { instruction: 'RELEASE. Notice the difference.', duration: 10, visualType: 'text' },
      { instruction: 'Move to your calves - TENSE', duration: 5, visualType: 'timer' },
      { instruction: 'RELEASE completely.', duration: 10, visualType: 'text' },
      { instruction: 'Thighs - TENSE', duration: 5, visualType: 'timer' },
      { instruction: 'RELEASE. Let them go heavy.', duration: 10, visualType: 'text' },
      { instruction: 'Stomach - TENSE', duration: 5, visualType: 'timer' },
      { instruction: 'RELEASE. Breathe into the softness.', duration: 10, visualType: 'text' },
      { instruction: 'Hands and arms - TENSE', duration: 5, visualType: 'timer' },
      { instruction: 'RELEASE. Feel them grow heavy.', duration: 10, visualType: 'text' },
      { instruction: 'Shoulders - TENSE up to your ears', duration: 5, visualType: 'timer' },
      { instruction: 'RELEASE. Let them drop.', duration: 10, visualType: 'text' },
      { instruction: 'Face - scrunch it tight', duration: 5, visualType: 'timer' },
      { instruction: 'RELEASE. Smooth and soft.', duration: 10, visualType: 'text' },
      { instruction: 'Your whole body is relaxed now.', duration: 15, visualType: 'text' },
    ],
  },

  // ========== THOUGHT CHALLENGE EXERCISES ==========
  {
    id: 'thought_record',
    name: 'Basic Thought Record',
    emoji: '🧠',
    description: 'Examine and reframe a difficult thought',
    duration: 180,
    tier: 'free',
    type: 'thought_challenge',
    tags: ['cbt', 'reframe', 'cognitive'],
    skillType: 'challenge',
    rarity: 'common',
    lore: 'Thoughts are not facts. This tool helps you see the difference.',
    steps: [
      { instruction: 'What situation triggered this thought?', visualType: 'text' },
      { instruction: 'What is the thought exactly?', visualType: 'text' },
      { instruction: 'What emotion does it cause? (0-100%)', visualType: 'text' },
      { instruction: 'What evidence SUPPORTS this thought?', visualType: 'text' },
      { instruction: 'What evidence CONTRADICTS it?', visualType: 'text' },
      { instruction: 'What would you tell a friend thinking this?', visualType: 'text' },
      { instruction: 'Can you create a more balanced thought?', visualType: 'text' },
      { instruction: 'How intense is the emotion now? (0-100%)', visualType: 'text' },
    ],
  },
  {
    id: 'cognitive_defusion',
    name: 'Thought Defusion',
    emoji: '🎈',
    description: 'Create distance from unhelpful thoughts',
    duration: 120,
    tier: 'premium',
    type: 'thought_challenge',
    tags: ['act', 'defusion', 'distance'],
    skillType: 'challenge',
    rarity: 'rare',
    lore: 'You are the sky. Thoughts are just weather passing through.',
    steps: [
      { instruction: 'Notice the thought you\'re having', duration: 10, visualType: 'text' },
      { instruction: 'Say: "I notice I\'m having the thought that..."', duration: 15, visualType: 'text' },
      { instruction: 'Imagine the thought as words on a screen', duration: 15, visualType: 'text' },
      { instruction: 'Watch the words float away like clouds', duration: 20, visualType: 'text' },
      { instruction: 'The thought is not you. It\'s just a thought.', duration: 15, visualType: 'text' },
    ],
  },

  // ========== SOCIAL PREP EXERCISES ==========
  {
    id: 'event_prep',
    name: 'Event Preparation',
    emoji: '🎉',
    description: 'Mentally prepare for a social event',
    duration: 180,
    tier: 'free',
    type: 'social_prep',
    tags: ['social', 'anxiety', 'preparation'],
    skillType: 'connect',
    rarity: 'common',
    lore: 'Heroes prepare before battle. You\'re preparing for connection.',
    steps: [
      { instruction: 'Picture yourself arriving at the event', duration: 20, visualType: 'text' },
      { instruction: 'Where will you go first?', visualType: 'text' },
      { instruction: 'Who might you talk to?', visualType: 'text' },
      { instruction: 'What\'s ONE topic you could bring up?', visualType: 'text' },
      { instruction: 'What\'s your exit plan if you need one?', visualType: 'text' },
      { instruction: 'Remember: You can leave whenever you need to.', duration: 15, visualType: 'text' },
    ],
  },
  {
    id: 'conversation_starters',
    name: 'Conversation Starters',
    emoji: '💬',
    description: 'Practice openers for social situations',
    duration: 120,
    tier: 'premium',
    type: 'social_prep',
    tags: ['social', 'practice', 'conversation'],
    skillType: 'connect',
    rarity: 'uncommon',
    lore: 'Every conversation starts with one word. Here are a few good ones.',
    steps: [
      { instruction: 'Universal opener: "How do you know [host]?"', duration: 15, visualType: 'text' },
      { instruction: 'Observation: "This [food/music/venue] is great!"', duration: 15, visualType: 'text' },
      { instruction: 'Question: "What are you working on lately?"', duration: 15, visualType: 'text' },
      { instruction: 'Shared experience: "Can you believe this weather?"', duration: 15, visualType: 'text' },
      { instruction: 'Pick ONE to try tonight.', duration: 20, visualType: 'text' },
    ],
  },

  // ========== THERAPEUTIC GAMES ==========
  {
    id: 'fidget_pad',
    name: 'Fidget Pad',
    emoji: '🔘',
    description: 'Sliders, switches, buttons with satisfying haptics',
    duration: 0, // No set duration - use as needed
    tier: 'free',
    type: 'fidget',
    tags: ['calm', 'fidget', 'tactile', 'sensory'],
    skillType: 'calm',
    rarity: 'common',
    lore: 'Sometimes your hands just need something to do.',
    steps: [
      { instruction: 'Open the Fidget Pad and explore', visualType: 'text' },
    ],
  },
  {
    id: 'bubble_wrap',
    name: 'Bubble Wrap',
    emoji: '🫧',
    description: 'Endless bubble popping with vibration feedback',
    duration: 0,
    tier: 'free',
    type: 'fidget',
    tags: ['calm', 'satisfying', 'sensory'],
    skillType: 'calm',
    rarity: 'common',
    lore: 'Pop. Pop. Pop. Instant satisfaction.',
    steps: [
      { instruction: 'Pop bubbles to your heart\'s content', visualType: 'text' },
    ],
  },
  {
    id: 'kinetic_sand',
    name: 'Kinetic Sand',
    emoji: '🏖️',
    description: 'Satisfying digital sand simulation',
    duration: 0,
    tier: 'free',
    type: 'fidget',
    tags: ['calm', 'sensory', 'satisfying'],
    skillType: 'calm',
    rarity: 'common',
    lore: 'Watch it flow, watch it settle. Like thoughts.',
    steps: [
      { instruction: 'Touch and play with the sand', visualType: 'text' },
    ],
  },
  {
    id: 'retro_snake',
    name: 'Mindful Snake',
    emoji: '🐍',
    description: 'Slow-paced snake with calming music',
    duration: 0,
    tier: 'free',
    type: 'game',
    tags: ['focus', 'classic', 'retro'],
    skillType: 'focus',
    rarity: 'common',
    lore: 'A classic reimagined for calm, not competition.',
    steps: [
      { instruction: 'Guide the snake at your own pace', visualType: 'text' },
    ],
  },
  {
    id: 'retro_pong',
    name: 'Gentle Pong',
    emoji: '🏓',
    description: 'Classic pong in slow motion',
    duration: 0,
    tier: 'free',
    type: 'game',
    tags: ['focus', 'classic', 'retro'],
    skillType: 'focus',
    rarity: 'common',
    lore: 'The game that started it all. Now slower, gentler.',
    steps: [
      { instruction: 'Bounce the ball back and forth', visualType: 'text' },
    ],
  },
  {
    id: 'rain_on_window',
    name: 'Rain Window',
    emoji: '🌧️',
    description: 'Watch rain on a pixel window, ambient calm',
    duration: 0,
    tier: 'free',
    type: 'game',
    tags: ['relax', 'ambient', 'sensory'],
    skillType: 'restore',
    rarity: 'uncommon',
    lore: 'Rain falls. Time slows. Everything is temporary.',
    steps: [
      { instruction: 'Watch the rain, tap to interact', visualType: 'text' },
    ],
  },
  {
    id: 'maze_walker',
    name: 'Maze Walker',
    emoji: '🌀',
    description: 'Navigate peaceful pixel mazes',
    duration: 0,
    tier: 'free',
    type: 'game',
    tags: ['focus', 'puzzle', 'calm'],
    skillType: 'focus',
    rarity: 'common',
    lore: 'There is always a way through.',
    steps: [
      { instruction: 'Find your path through the maze', visualType: 'text' },
    ],
  },
  {
    id: 'memory_match',
    name: 'Memory Match',
    emoji: '🎴',
    description: 'Classic card matching game',
    duration: 0,
    tier: 'free',
    type: 'game',
    tags: ['focus', 'memory', 'classic'],
    skillType: 'focus',
    rarity: 'common',
    lore: 'Find the pairs. Train your memory. No pressure.',
    steps: [
      { instruction: 'Flip cards to find matching pairs', visualType: 'text' },
    ],
  },
  {
    id: 'kaleidoscope',
    name: 'Kaleidoscope',
    emoji: '✨',
    description: 'Mesmerizing, ever-changing patterns',
    duration: 0,
    tier: 'free',
    type: 'game',
    tags: ['relax', 'visual', 'hypnotic'],
    skillType: 'restore',
    rarity: 'uncommon',
    lore: 'Let the patterns pull you in. Let your thoughts drift.',
    steps: [
      { instruction: 'Watch and interact with the patterns', visualType: 'text' },
    ],
  },
  {
    id: 'untangle',
    name: 'Untangle',
    emoji: '🧵',
    description: 'Untangle the lines, satisfying puzzle',
    duration: 0,
    tier: 'free',
    type: 'game',
    tags: ['focus', 'puzzle', 'satisfying'],
    skillType: 'focus',
    rarity: 'common',
    lore: 'Start with chaos. End with clarity.',
    steps: [
      { instruction: 'Move nodes until no lines cross', visualType: 'text' },
    ],
  },
];

// ============================================
// SKILLS LIBRARY
// ============================================

export const SKILLS: Skill[] = [
  // ========== MINDFULNESS SKILLS ==========
  {
    id: 'breathing',
    name: 'Breathing',
    emoji: '🌬️',
    description: 'Master various breathing techniques for calm',
    category: 'mindfulness',
    tier: 'free',
    maxLevel: 5,
    xpPerUse: 10,
    xpPerLevel: 50,
    skillType: 'calm',
    rarity: 'common',
    lore: 'The most portable tool you own. It goes everywhere with you.',
    exercises: EXERCISES.filter((e) => e.type === 'breathing'),
  },
  {
    id: 'grounding',
    name: 'Grounding',
    emoji: '🦶',
    description: 'Anchor yourself to the present moment',
    category: 'mindfulness',
    tier: 'free',
    maxLevel: 5,
    xpPerUse: 10,
    xpPerLevel: 50,
    skillType: 'ground',
    rarity: 'common',
    lore: 'When the world spins, these techniques keep your feet on the earth.',
    exercises: EXERCISES.filter((e) => e.type === 'grounding'),
  },
  {
    id: 'body_awareness',
    name: 'Body Awareness',
    emoji: '🔍',
    description: 'Develop connection with physical sensations',
    category: 'mindfulness',
    tier: 'free',
    maxLevel: 5,
    xpPerUse: 15,
    xpPerLevel: 75,
    skillType: 'focus',
    rarity: 'uncommon',
    lore: 'Your body knows things your mind hasn\'t figured out yet.',
    exercises: EXERCISES.filter((e) => e.type === 'body_scan'),
  },

  // ========== COPING SKILLS ==========
  {
    id: 'thought_challenging',
    name: 'Thought Challenging',
    emoji: '🧠',
    description: 'Examine and reframe unhelpful thoughts',
    category: 'coping',
    tier: 'free',
    maxLevel: 5,
    xpPerUse: 20,
    xpPerLevel: 100,
    skillType: 'challenge',
    rarity: 'uncommon',
    lore: 'The mind is a powerful storyteller. These tools help you edit the script.',
    exercises: EXERCISES.filter((e) => e.type === 'thought_challenge'),
  },

  // ========== SOCIAL SKILLS ==========
  {
    id: 'social_prep',
    name: 'Social Preparation',
    emoji: '🎭',
    description: 'Prepare mentally for social situations',
    category: 'social',
    tier: 'free',
    maxLevel: 5,
    xpPerUse: 15,
    xpPerLevel: 75,
    skillType: 'connect',
    rarity: 'uncommon',
    lore: 'Connection is a skill, not a talent. And skills can be learned.',
    exercises: EXERCISES.filter((e) => e.type === 'social_prep'),
  },

  // ========== THERAPEUTIC GAMES ==========
  {
    id: 'fidget_tools',
    name: 'Fidget & Sensory',
    emoji: '🔘',
    description: 'Tactile tools for restless moments',
    category: 'games',
    tier: 'free',
    maxLevel: 5,
    xpPerUse: 5,
    xpPerLevel: 25,
    skillType: 'calm',
    rarity: 'common',
    lore: 'Your hands have wisdom too. Give them something to do.',
    exercises: EXERCISES.filter((e) => e.type === 'fidget'),
  },
  {
    id: 'therapeutic_games',
    name: 'Therapeutic Games',
    emoji: '🎮',
    description: 'Retro games designed for wellness, not addiction',
    category: 'games',
    tier: 'free',
    maxLevel: 5,
    xpPerUse: 10,
    xpPerLevel: 50,
    skillType: 'focus',
    rarity: 'common',
    lore: 'Play is healing. These games won\'t try to keep you forever.',
    exercises: EXERCISES.filter((e) => e.type === 'game'),
  },
];

// ============================================
// PROGRESS TRACKING
// ============================================

/**
 * Get all skill progress
 */
export async function getAllSkillProgress(): Promise<Record<string, SkillProgress>> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_PROGRESS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to get skill progress:', error);
    return {};
  }
}

/**
 * Get progress for a specific skill
 */
export async function getSkillProgress(skillId: string): Promise<SkillProgress> {
  const allProgress = await getAllSkillProgress();
  return (
    allProgress[skillId] || {
      skillId,
      level: 1,
      currentXP: 0,
      totalXP: 0,
      timesUsed: 0,
    }
  );
}

/**
 * Record skill usage and award XP
 */
export async function recordSkillUsage(
  skillId: string,
  exerciseId: string,
  completed: boolean,
  duration: number,
  rating?: number
): Promise<SkillProgress> {
  const skill = SKILLS.find((s) => s.id === skillId);
  if (!skill) throw new Error(`Unknown skill: ${skillId}`);

  // Get current progress
  const allProgress = await getAllSkillProgress();
  const progress = allProgress[skillId] || {
    skillId,
    level: 1,
    currentXP: 0,
    totalXP: 0,
    timesUsed: 0,
  };

  // Award XP (partial for incomplete)
  const xpEarned = completed ? skill.xpPerUse : Math.floor(skill.xpPerUse * 0.5);
  progress.currentXP += xpEarned;
  progress.totalXP += xpEarned;
  progress.timesUsed += 1;
  progress.lastUsed = new Date().toISOString();

  if (!progress.firstUsed) {
    progress.firstUsed = new Date().toISOString();
  }

  // Check for level up
  while (progress.currentXP >= skill.xpPerLevel && progress.level < skill.maxLevel) {
    progress.currentXP -= skill.xpPerLevel;
    progress.level += 1;
  }

  // Cap XP at max level
  if (progress.level >= skill.maxLevel) {
    progress.currentXP = skill.xpPerLevel;
  }

  // Save progress
  allProgress[skillId] = progress;
  await AsyncStorage.setItem(STORAGE_KEYS.SKILL_PROGRESS, JSON.stringify(allProgress));

  // Log usage
  await logSkillUsage(skillId, exerciseId, completed, duration, rating);

  return progress;
}

/**
 * Log detailed skill usage
 */
async function logSkillUsage(
  skillId: string,
  exerciseId: string,
  completed: boolean,
  duration: number,
  rating?: number
): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_USAGE_LOG);
    const logs: SkillUsageLog[] = data ? JSON.parse(data) : [];

    logs.unshift({
      skillId,
      exerciseId,
      timestamp: new Date().toISOString(),
      completed,
      duration,
      rating,
    });

    // Keep last 200 entries
    const trimmedLogs = logs.slice(0, 200);

    await AsyncStorage.setItem(STORAGE_KEYS.SKILL_USAGE_LOG, JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error('Failed to log skill usage:', error);
  }
}

/**
 * Get skill usage history
 */
export async function getSkillUsageHistory(
  skillId?: string,
  limit: number = 50
): Promise<SkillUsageLog[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_USAGE_LOG);
    const logs: SkillUsageLog[] = data ? JSON.parse(data) : [];

    let filtered = logs;
    if (skillId) {
      filtered = logs.filter((log) => log.skillId === skillId);
    }

    return filtered.slice(0, limit);
  } catch (error) {
    console.error('Failed to get skill usage history:', error);
    return [];
  }
}

// ============================================
// SKILL HELPERS
// ============================================

/**
 * Get all skills by category
 */
export function getSkillsByCategory(category: SkillCategory): Skill[] {
  return SKILLS.filter((s) => s.category === category);
}

/**
 * Get free exercises for a skill
 */
export function getFreeExercises(skillId: string): Exercise[] {
  const skill = SKILLS.find((s) => s.id === skillId);
  if (!skill) return [];
  return skill.exercises.filter((e) => e.tier === 'free');
}

/**
 * Get premium exercises for a skill
 */
export function getPremiumExercises(skillId: string): Exercise[] {
  const skill = SKILLS.find((s) => s.id === skillId);
  if (!skill) return [];
  return skill.exercises.filter((e) => e.tier === 'premium');
}

/**
 * Get an exercise by ID
 */
export function getExerciseById(exerciseId: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === exerciseId);
}

/**
 * Get skill by ID
 */
export function getSkillById(skillId: string): Skill | undefined {
  return SKILLS.find((s) => s.id === skillId);
}

/**
 * Check if user has access to an exercise
 */
export function canAccessExercise(exercise: Exercise, isPremium: boolean): boolean {
  return exercise.tier === 'free' || isPremium;
}

/**
 * Get celebration message for level up
 */
export function getLevelUpMessage(skill: Skill, newLevel: number): string {
  const messages: Record<number, string> = {
    2: `You're building a real ${skill.name} practice. Level 2! 🌱`,
    3: `Level 3 ${skill.name}! This is becoming natural for you.`,
    4: `Level 4! Your ${skill.name} skills are strong. 💪`,
    5: `Mastery achieved! ${skill.name} Level 5. You've got this. ✨`,
  };
  return messages[newLevel] || `${skill.name} Level ${newLevel}!`;
}

/**
 * Get encouragement message (not streak-based)
 */
export function getEncouragementMessage(progress: SkillProgress): string {
  const messages = [
    'Every practice counts.',
    'You showed up. That matters.',
    'Building skills takes time. You\'re doing it.',
    'This is real progress.',
    'You\'re developing something that lasts.',
  ];

  // Milestone-based encouragement (not streak)
  if (progress.timesUsed === 1) {
    return 'First time! You took the first step.';
  }
  if (progress.timesUsed === 10) {
    return 'You\'ve practiced 10 times. That\'s dedication.';
  }
  if (progress.timesUsed === 25) {
    return '25 practices! This skill is becoming part of you.';
  }
  if (progress.timesUsed === 50) {
    return '50 times. You\'ve built something real.';
  }

  return messages[Math.floor(Math.random() * messages.length)];
}

// ============================================
// SKILL ENABLE/DISABLE MANAGEMENT
// ============================================

/**
 * Get all enabled skills (by default all free skills are enabled)
 */
export async function getEnabledSkills(): Promise<Record<string, boolean>> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ENABLED_SKILLS);
    if (data) {
      return JSON.parse(data);
    }
    // Default: all free skills enabled
    const defaults: Record<string, boolean> = {};
    SKILLS.forEach((skill) => {
      defaults[skill.id] = skill.tier === 'free';
    });
    return defaults;
  } catch (error) {
    console.error('Failed to get enabled skills:', error);
    const defaults: Record<string, boolean> = {};
    SKILLS.forEach((skill) => {
      defaults[skill.id] = skill.tier === 'free';
    });
    return defaults;
  }
}

/**
 * Check if a specific skill is enabled
 */
export async function isSkillEnabled(skillId: string): Promise<boolean> {
  const enabled = await getEnabledSkills();
  return enabled[skillId] ?? false;
}

/**
 * Enable or disable a skill
 */
export async function setSkillEnabled(skillId: string, enabled: boolean): Promise<void> {
  try {
    const current = await getEnabledSkills();
    current[skillId] = enabled;
    await AsyncStorage.setItem(STORAGE_KEYS.ENABLED_SKILLS, JSON.stringify(current));
  } catch (error) {
    console.error('Failed to set skill enabled:', error);
    throw error;
  }
}

/**
 * Toggle a skill's enabled state
 */
export async function toggleSkillEnabled(skillId: string): Promise<boolean> {
  const current = await isSkillEnabled(skillId);
  await setSkillEnabled(skillId, !current);
  return !current;
}

/**
 * Get all skills with their enabled state
 */
export async function getSkillsWithEnabledState(isPremium: boolean): Promise<Array<{
  skill: Skill;
  progress: SkillProgress;
  enabled: boolean;
  isLocked: boolean;
}>> {
  const allProgress = await getAllSkillProgress();
  const enabledSkills = await getEnabledSkills();

  return SKILLS.map((skill) => {
    const progress = allProgress[skill.id] || {
      skillId: skill.id,
      level: 1,
      currentXP: 0,
      totalXP: 0,
      timesUsed: 0,
    };

    return {
      skill,
      progress,
      enabled: enabledSkills[skill.id] ?? false,
      isLocked: skill.tier === 'premium' && !isPremium,
    };
  });
}

// ============================================
// MENU DATA FOR UI
// ============================================

export interface SkillMenuItem {
  skill: Skill;
  progress: SkillProgress;
  freeExerciseCount: number;
  premiumExerciseCount: number;
  isLocked: boolean;
}

export interface ExerciseMenuItem {
  exercise: Exercise;
  isLocked: boolean;
  skill: Skill;
}

/**
 * Get skills menu data for UI
 */
export async function getSkillsMenuData(isPremium: boolean): Promise<{
  categories: SkillCategoryInfo[];
  skillsByCategory: Record<SkillCategory, SkillMenuItem[]>;
}> {
  const allProgress = await getAllSkillProgress();

  const skillsByCategory: Record<SkillCategory, SkillMenuItem[]> = {
    mindfulness: [],
    coping: [],
    growth: [],
    social: [],
    advanced: [],
    games: [],
  };

  for (const skill of SKILLS) {
    const progress = allProgress[skill.id] || {
      skillId: skill.id,
      level: 1,
      currentXP: 0,
      totalXP: 0,
      timesUsed: 0,
    };

    const freeExercises = skill.exercises.filter((e) => e.tier === 'free');
    const premiumExercises = skill.exercises.filter((e) => e.tier === 'premium');

    skillsByCategory[skill.category].push({
      skill,
      progress,
      freeExerciseCount: freeExercises.length,
      premiumExerciseCount: premiumExercises.length,
      isLocked: skill.tier === 'premium' && !isPremium,
    });
  }

  return {
    categories: Object.values(SKILL_CATEGORIES),
    skillsByCategory,
  };
}

/**
 * Get quick exercises (for quick actions)
 */
export function getQuickExercises(isPremium: boolean): ExerciseMenuItem[] {
  const quickTags = ['quick', 'instant'];

  return EXERCISES.filter((e) => e.tags.some((t) => quickTags.includes(t)))
    .map((exercise) => {
      const skill = SKILLS.find((s) => s.exercises.some((ex) => ex.id === exercise.id));
      return {
        exercise,
        isLocked: exercise.tier === 'premium' && !isPremium,
        skill: skill!,
      };
    });
}
