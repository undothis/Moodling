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
};

// ============================================
// SKILL TYPES & INTERFACES
// ============================================

export type SkillCategory =
  | 'mindfulness'
  | 'coping'
  | 'growth'
  | 'social'
  | 'advanced';

export type SkillTier = 'free' | 'premium';

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
}

export type ExerciseType =
  | 'breathing'
  | 'grounding'
  | 'body_scan'
  | 'thought_challenge'
  | 'visualization'
  | 'journaling'
  | 'movement'
  | 'social_prep';

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
    steps: [
      { instruction: 'Universal opener: "How do you know [host]?"', duration: 15, visualType: 'text' },
      { instruction: 'Observation: "This [food/music/venue] is great!"', duration: 15, visualType: 'text' },
      { instruction: 'Question: "What are you working on lately?"', duration: 15, visualType: 'text' },
      { instruction: 'Shared experience: "Can you believe this weather?"', duration: 15, visualType: 'text' },
      { instruction: 'Pick ONE to try tonight.', duration: 20, visualType: 'text' },
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
    exercises: EXERCISES.filter((e) => e.type === 'social_prep'),
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
