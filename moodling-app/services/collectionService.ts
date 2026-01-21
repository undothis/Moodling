/**
 * Collection Service
 *
 * Manages artifacts, titles, unlockables, and the reward system.
 * Tracks user activity patterns and grants personalized rewards
 * based on natural usage - not grinding or streaks.
 *
 * Following Mood Leaf Ethics:
 * - Surprises, not obligations
 * - Rewards presence, not performance
 * - No FOMO, no pressure
 * - Celebrates showing up
 *
 * Unit: Collection & Rewards System
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  COLLECTION: 'moodleaf_collection',
  USAGE_STATS: 'moodleaf_usage_stats',
  PENDING_UNLOCKS: 'moodleaf_pending_unlocks',
  LAST_UNLOCK_CHECK: 'moodleaf_last_unlock_check',
};

// ============================================
// TYPES & INTERFACES
// ============================================

export type CollectibleType = 'artifact' | 'title' | 'card_back' | 'skill' | 'coach_perk';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type SkillType = 'calm' | 'ground' | 'focus' | 'challenge' | 'connect' | 'restore';

export interface Collectible {
  id: string;
  type: CollectibleType;
  name: string;
  emoji: string;
  rarity: Rarity;
  description: string;
  lore?: string; // Flavor text / story
  skillType?: SkillType; // For skills and related artifacts
  unlockedAt?: string; // ISO date when unlocked
  isHidden?: boolean; // Secret unlocks
}

export interface UnlockTrigger {
  id: string;
  collectibleId: string;
  type: 'milestone' | 'usage_pattern' | 'exploration' | 'random' | 'time_based';
  condition: TriggerCondition;
  message?: string; // Custom unlock message
}

export interface TriggerCondition {
  // Milestone triggers
  activityType?: string; // 'breathing', 'journaling', 'grounding', etc.
  count?: number; // e.g., 10 breathing sessions

  // Usage pattern triggers
  patternType?: string; // 'favorite_activity', 'consistent_user'
  threshold?: number; // e.g., 60% of sessions are breathing

  // Exploration triggers
  triedActivities?: string[]; // Must have tried all these
  triedPersonas?: number; // Must have tried X personas

  // Random triggers
  chance?: number; // 0-1 probability
  afterActivity?: string; // Random chance after this activity

  // Time-based triggers
  timeOfDay?: 'morning' | 'night' | 'midnight';
  daysUsed?: number; // Total days (not consecutive!)
}

export interface UsageStats {
  // Activity counts
  breathingCount: number;
  groundingCount: number;
  journalCount: number;
  bodyScansCount: number;
  thoughtChallengeCount: number;
  gamesPlayedCount: number;
  lessonsCompletedCount: number;

  // Session tracking
  totalSessions: number;
  uniqueDaysUsed: string[]; // Array of date strings
  lastSessionDate: string;

  // Persona tracking
  personasUsed: string[];
  currentPersona: string;

  // Pattern detection
  favoriteActivity?: string;
  activityDistribution: Record<string, number>;

  // Time patterns
  morningSessionCount: number;
  eveningSessionCount: number;
  nightSessionCount: number;
}

export interface Collection {
  unlocked: Record<string, Collectible>; // id -> collectible
  equipped: {
    title?: string;
    cardBack?: string;
  };
  totalDiscovered: number;
  lastUnlockDate?: string;
}

export interface UnlockResult {
  unlocked: boolean;
  collectible?: Collectible;
  message?: string;
  isNew?: boolean;
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_USAGE_STATS: UsageStats = {
  breathingCount: 0,
  groundingCount: 0,
  journalCount: 0,
  bodyScansCount: 0,
  thoughtChallengeCount: 0,
  gamesPlayedCount: 0,
  lessonsCompletedCount: 0,
  totalSessions: 0,
  uniqueDaysUsed: [],
  lastSessionDate: '',
  personasUsed: [],
  currentPersona: 'clover',
  activityDistribution: {},
  morningSessionCount: 0,
  eveningSessionCount: 0,
  nightSessionCount: 0,
};

const DEFAULT_COLLECTION: Collection = {
  unlocked: {},
  equipped: {},
  totalDiscovered: 0,
};

// ============================================
// COLLECTIBLES DATABASE
// ============================================

export const ARTIFACTS: Collectible[] = [
  // ========== COMMON ARTIFACTS ==========
  {
    id: 'first_leaf',
    type: 'artifact',
    name: 'First Leaf',
    emoji: '🌿',
    rarity: 'common',
    description: 'A small green leaf, symbolizing new beginnings.',
    lore: 'Every journey starts somewhere. This leaf marks yours.',
  },
  {
    id: 'calm_stone',
    type: 'artifact',
    name: 'Calm Stone',
    emoji: '🪨',
    rarity: 'common',
    description: 'A smooth river stone, worn by time.',
    lore: 'Hold it when you need to remember: this too shall pass.',
    skillType: 'calm',
  },
  {
    id: 'grounding_root',
    type: 'artifact',
    name: 'Grounding Root',
    emoji: '🌱',
    rarity: 'common',
    description: 'A small root that reminds you of your connection to earth.',
    lore: 'When the world spins, roots keep us steady.',
    skillType: 'ground',
  },
  {
    id: 'morning_dew',
    type: 'artifact',
    name: 'Morning Dew',
    emoji: '💧',
    rarity: 'common',
    description: 'A droplet that catches the first light.',
    lore: 'Fresh starts happen every morning.',
  },

  // ========== UNCOMMON ARTIFACTS ==========
  {
    id: 'breath_feather',
    type: 'artifact',
    name: 'Breath Feather',
    emoji: '🪶',
    rarity: 'uncommon',
    description: 'Light as air, a reminder that breath is always with you.',
    lore: 'The bird that lost this feather still flew. You have everything you need.',
    skillType: 'calm',
  },
  {
    id: 'clarity_crystal',
    type: 'artifact',
    name: 'Clarity Crystal',
    emoji: '🔮',
    rarity: 'uncommon',
    description: 'See through the fog of anxious thoughts.',
    lore: 'Not a fortune teller, but a fog clearer.',
    skillType: 'focus',
  },
  {
    id: 'worry_beads',
    type: 'artifact',
    name: 'Worry Beads',
    emoji: '📿',
    rarity: 'uncommon',
    description: 'Ancient comfort in your pocket.',
    lore: 'Generations of worried hands have found peace here.',
    skillType: 'ground',
  },
  {
    id: 'journal_quill',
    type: 'artifact',
    name: 'Journal Quill',
    emoji: '🪶',
    rarity: 'uncommon',
    description: 'Words have power. This quill knows it.',
    lore: 'What you write down, you release.',
  },
  {
    id: 'connection_thread',
    type: 'artifact',
    name: 'Connection Thread',
    emoji: '🧵',
    rarity: 'uncommon',
    description: 'A golden thread connecting you to others.',
    lore: 'We are all woven together.',
    skillType: 'connect',
  },

  // ========== RARE ARTIFACTS ==========
  {
    id: 'starlight_vial',
    type: 'artifact',
    name: 'Starlight Vial',
    emoji: '✨',
    rarity: 'rare',
    description: 'Captured starlight for dark moments.',
    lore: 'Even in darkness, you carry light.',
    skillType: 'calm',
  },
  {
    id: 'anchor_charm',
    type: 'artifact',
    name: 'Anchor Charm',
    emoji: '⚓',
    rarity: 'rare',
    description: 'Stay grounded in any storm.',
    lore: 'The sea rages, but the anchor holds.',
    skillType: 'ground',
  },
  {
    id: 'mirror_shard',
    type: 'artifact',
    name: 'Mirror Shard',
    emoji: '🪞',
    rarity: 'rare',
    description: 'See yourself with compassion.',
    lore: 'This mirror only shows the truth: you are enough.',
    skillType: 'challenge',
  },
  {
    id: 'moon_pendant',
    type: 'artifact',
    name: 'Moon Pendant',
    emoji: '🌙',
    rarity: 'rare',
    description: 'For those who find peace in the night.',
    lore: 'The moon understands: sometimes we shine brightest in darkness.',
    skillType: 'restore',
    isHidden: true, // Night owl unlock
  },

  // ========== LEGENDARY ARTIFACTS ==========
  {
    id: 'heart_ember',
    type: 'artifact',
    name: 'Heart Ember',
    emoji: '❤️‍🔥',
    rarity: 'legendary',
    description: 'The warmth that never goes out.',
    lore: 'Through every storm, every doubt, this ember stayed lit. It is yours.',
  },
  {
    id: 'phoenix_ash',
    type: 'artifact',
    name: 'Phoenix Ash',
    emoji: '🔥',
    rarity: 'legendary',
    description: 'From endings come beginnings.',
    lore: 'You have risen before. You will rise again.',
    isHidden: true,
  },
];

export const TITLES: Collectible[] = [
  // Common
  { id: 'title_newcomer', type: 'title', name: 'Newcomer', emoji: '🌱', rarity: 'common', description: 'Just starting the journey' },
  { id: 'title_explorer', type: 'title', name: 'Explorer', emoji: '🧭', rarity: 'common', description: 'Curious about new paths' },

  // Uncommon - Activity based
  { id: 'title_breath_wanderer', type: 'title', name: 'Breath Wanderer', emoji: '💨', rarity: 'uncommon', description: 'Finds peace in breathing', skillType: 'calm' },
  { id: 'title_grounding_guardian', type: 'title', name: 'Grounding Guardian', emoji: '🦶', rarity: 'uncommon', description: 'Always finds their footing', skillType: 'ground' },
  { id: 'title_thought_weaver', type: 'title', name: 'Thought Weaver', emoji: '🧠', rarity: 'uncommon', description: 'Shapes thoughts with intention', skillType: 'challenge' },
  { id: 'title_journal_keeper', type: 'title', name: 'Journal Keeper', emoji: '📖', rarity: 'uncommon', description: 'Words are their companion' },

  // Rare
  { id: 'title_night_owl', type: 'title', name: 'Night Owl', emoji: '🦉', rarity: 'rare', description: 'Finds wisdom in quiet hours', isHidden: true },
  { id: 'title_early_bird', type: 'title', name: 'Early Bird', emoji: '🐦', rarity: 'rare', description: 'Greets each day with intention' },
  { id: 'title_persona_friend', type: 'title', name: 'Persona Friend', emoji: '🎭', rarity: 'rare', description: 'Connected with every coach' },

  // Legendary
  { id: 'title_inner_peace', type: 'title', name: 'Inner Peace Seeker', emoji: '☮️', rarity: 'legendary', description: 'Walking the path with grace' },
  { id: 'title_wellness_warrior', type: 'title', name: 'Wellness Warrior', emoji: '⚔️', rarity: 'legendary', description: 'Brave in the face of challenges' },
];

export const CARD_BACKS: Collectible[] = [
  { id: 'card_forest', type: 'card_back', name: 'Forest', emoji: '🌲', rarity: 'common', description: 'Peaceful woodland theme' },
  { id: 'card_ocean', type: 'card_back', name: 'Ocean', emoji: '🌊', rarity: 'common', description: 'Calm waves theme' },
  { id: 'card_stars', type: 'card_back', name: 'Starfield', emoji: '⭐', rarity: 'uncommon', description: 'Cosmic night theme' },
  { id: 'card_aurora', type: 'card_back', name: 'Aurora', emoji: '🌌', rarity: 'rare', description: 'Northern lights dance' },
  { id: 'card_golden', type: 'card_back', name: 'Golden Hour', emoji: '🌅', rarity: 'legendary', description: 'Eternal sunset glow' },
];

// All collectibles combined
export const ALL_COLLECTIBLES: Collectible[] = [
  ...ARTIFACTS,
  ...TITLES,
  ...CARD_BACKS,
];

// ============================================
// UNLOCK TRIGGERS
// ============================================

export const UNLOCK_TRIGGERS: UnlockTrigger[] = [
  // ========== FIRST USE / WELCOME ==========
  {
    id: 'welcome',
    collectibleId: 'first_leaf',
    type: 'milestone',
    condition: { activityType: 'any', count: 1 },
    message: 'Welcome to your journey. This leaf marks your first step.',
  },
  {
    id: 'first_card',
    collectibleId: 'card_forest',
    type: 'milestone',
    condition: { activityType: 'any', count: 1 },
  },
  {
    id: 'newcomer_title',
    collectibleId: 'title_newcomer',
    type: 'milestone',
    condition: { activityType: 'any', count: 1 },
  },

  // ========== BREATHING MILESTONES ==========
  {
    id: 'breath_5',
    collectibleId: 'calm_stone',
    type: 'milestone',
    condition: { activityType: 'breathing', count: 5 },
    message: 'Your dedication to breathwork revealed this.',
  },
  {
    id: 'breath_10',
    collectibleId: 'breath_feather',
    type: 'milestone',
    condition: { activityType: 'breathing', count: 10 },
    message: 'Light as your breath, this feather found you.',
  },
  {
    id: 'breath_25',
    collectibleId: 'title_breath_wanderer',
    type: 'milestone',
    condition: { activityType: 'breathing', count: 25 },
    message: 'You walk the path of breath. This title is yours.',
  },
  {
    id: 'breath_50',
    collectibleId: 'starlight_vial',
    type: 'milestone',
    condition: { activityType: 'breathing', count: 50 },
    message: 'Fifty breaths of intention. The stars noticed.',
  },

  // ========== GROUNDING MILESTONES ==========
  {
    id: 'ground_5',
    collectibleId: 'grounding_root',
    type: 'milestone',
    condition: { activityType: 'grounding', count: 5 },
    message: 'Your roots grow deeper.',
  },
  {
    id: 'ground_10',
    collectibleId: 'worry_beads',
    type: 'milestone',
    condition: { activityType: 'grounding', count: 10 },
    message: 'Ancient wisdom for modern worries.',
  },
  {
    id: 'ground_25',
    collectibleId: 'title_grounding_guardian',
    type: 'milestone',
    condition: { activityType: 'grounding', count: 25 },
  },
  {
    id: 'ground_50',
    collectibleId: 'anchor_charm',
    type: 'milestone',
    condition: { activityType: 'grounding', count: 50 },
  },

  // ========== JOURNALING MILESTONES ==========
  {
    id: 'journal_5',
    collectibleId: 'journal_quill',
    type: 'milestone',
    condition: { activityType: 'journaling', count: 5 },
    message: 'Your words have power.',
  },
  {
    id: 'journal_20',
    collectibleId: 'title_journal_keeper',
    type: 'milestone',
    condition: { activityType: 'journaling', count: 20 },
  },

  // ========== THOUGHT CHALLENGE MILESTONES ==========
  {
    id: 'thought_10',
    collectibleId: 'clarity_crystal',
    type: 'milestone',
    condition: { activityType: 'thought_challenge', count: 10 },
  },
  {
    id: 'thought_25',
    collectibleId: 'title_thought_weaver',
    type: 'milestone',
    condition: { activityType: 'thought_challenge', count: 25 },
  },
  {
    id: 'thought_50',
    collectibleId: 'mirror_shard',
    type: 'milestone',
    condition: { activityType: 'thought_challenge', count: 50 },
  },

  // ========== EXPLORATION ==========
  {
    id: 'explorer_title',
    collectibleId: 'title_explorer',
    type: 'exploration',
    condition: { triedActivities: ['breathing', 'grounding', 'journaling'] },
    message: 'You explore many paths. Keep wandering.',
  },
  {
    id: 'all_personas',
    collectibleId: 'title_persona_friend',
    type: 'exploration',
    condition: { triedPersonas: 7 },
    message: 'You\'ve connected with every coach. They all see you.',
  },
  {
    id: 'connection_unlock',
    collectibleId: 'connection_thread',
    type: 'exploration',
    condition: { triedPersonas: 4 },
  },

  // ========== TIME-BASED ==========
  {
    id: 'night_owl',
    collectibleId: 'title_night_owl',
    type: 'time_based',
    condition: { timeOfDay: 'midnight' },
    message: 'The quiet hours hold you. 🦉',
  },
  {
    id: 'moon_artifact',
    collectibleId: 'moon_pendant',
    type: 'time_based',
    condition: { timeOfDay: 'night', count: 10 },
  },
  {
    id: 'morning_dew_unlock',
    collectibleId: 'morning_dew',
    type: 'time_based',
    condition: { timeOfDay: 'morning', count: 5 },
  },
  {
    id: 'early_bird',
    collectibleId: 'title_early_bird',
    type: 'time_based',
    condition: { timeOfDay: 'morning', count: 15 },
  },

  // ========== DAYS USED (NOT CONSECUTIVE) ==========
  {
    id: 'days_10',
    collectibleId: 'card_ocean',
    type: 'milestone',
    condition: { daysUsed: 10 },
    message: 'Ten days of showing up. The ocean welcomes you.',
  },
  {
    id: 'days_30',
    collectibleId: 'card_stars',
    type: 'milestone',
    condition: { daysUsed: 30 },
  },
  {
    id: 'days_60',
    collectibleId: 'card_aurora',
    type: 'milestone',
    condition: { daysUsed: 60 },
  },
  {
    id: 'days_100',
    collectibleId: 'card_golden',
    type: 'milestone',
    condition: { daysUsed: 100 },
    message: 'One hundred days of presence. Golden.',
  },

  // ========== RANDOM SURPRISES ==========
  {
    id: 'random_calm',
    collectibleId: 'calm_stone',
    type: 'random',
    condition: { chance: 0.03, afterActivity: 'breathing' },
  },
  {
    id: 'random_root',
    collectibleId: 'grounding_root',
    type: 'random',
    condition: { chance: 0.03, afterActivity: 'grounding' },
  },

  // ========== LEGENDARY (LONG TERM) ==========
  {
    id: 'heart_ember',
    collectibleId: 'heart_ember',
    type: 'milestone',
    condition: { daysUsed: 180 },
    message: 'Six months of caring for yourself. This ember is eternal.',
  },
  {
    id: 'inner_peace',
    collectibleId: 'title_inner_peace',
    type: 'milestone',
    condition: { activityType: 'any', count: 200 },
  },
  {
    id: 'wellness_warrior',
    collectibleId: 'title_wellness_warrior',
    type: 'milestone',
    condition: { daysUsed: 365 },
    message: 'A year of showing up for yourself. Warrior.',
  },
];

// ============================================
// USAGE STATS MANAGEMENT
// ============================================

/**
 * Get usage stats
 */
export async function getUsageStats(): Promise<UsageStats> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USAGE_STATS);
    if (!data) return { ...DEFAULT_USAGE_STATS };
    return { ...DEFAULT_USAGE_STATS, ...JSON.parse(data) };
  } catch (error) {
    console.error('Failed to get usage stats:', error);
    return { ...DEFAULT_USAGE_STATS };
  }
}

/**
 * Save usage stats
 */
async function saveUsageStats(stats: UsageStats): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USAGE_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save usage stats:', error);
  }
}

/**
 * Record an activity and check for unlocks
 */
export async function recordActivity(
  activityType: string,
  metadata?: Record<string, any>
): Promise<UnlockResult[]> {
  const stats = await getUsageStats();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const hour = now.getHours();

  // Update activity counts
  switch (activityType) {
    case 'breathing':
      stats.breathingCount++;
      break;
    case 'grounding':
      stats.groundingCount++;
      break;
    case 'journaling':
      stats.journalCount++;
      break;
    case 'body_scan':
      stats.bodyScansCount++;
      break;
    case 'thought_challenge':
      stats.thoughtChallengeCount++;
      break;
    case 'game':
      stats.gamesPlayedCount++;
      break;
    case 'lesson':
      stats.lessonsCompletedCount++;
      break;
  }

  // Update activity distribution
  stats.activityDistribution[activityType] = (stats.activityDistribution[activityType] || 0) + 1;

  // Calculate favorite activity
  let maxCount = 0;
  let favorite = '';
  Object.entries(stats.activityDistribution).forEach(([activity, count]) => {
    if (count > maxCount) {
      maxCount = count;
      favorite = activity;
    }
  });
  stats.favoriteActivity = favorite;

  // Update session tracking
  stats.totalSessions++;
  stats.lastSessionDate = today;

  // Track unique days
  if (!stats.uniqueDaysUsed.includes(today)) {
    stats.uniqueDaysUsed.push(today);
  }

  // Track time of day
  if (hour >= 5 && hour < 12) {
    stats.morningSessionCount++;
  } else if (hour >= 12 && hour < 21) {
    stats.eveningSessionCount++;
  } else {
    stats.nightSessionCount++;
  }

  // Track persona if provided
  if (metadata?.persona && !stats.personasUsed.includes(metadata.persona)) {
    stats.personasUsed.push(metadata.persona);
  }

  await saveUsageStats(stats);

  // Check for unlocks
  const unlocks = await checkForUnlocks(stats, activityType, hour);

  return unlocks;
}

/**
 * Record persona usage
 */
export async function recordPersonaUsage(persona: string): Promise<UnlockResult[]> {
  const stats = await getUsageStats();

  if (!stats.personasUsed.includes(persona)) {
    stats.personasUsed.push(persona);
  }
  stats.currentPersona = persona;

  await saveUsageStats(stats);

  return checkForUnlocks(stats, 'persona_switch', new Date().getHours());
}

// ============================================
// COLLECTION MANAGEMENT
// ============================================

/**
 * Get collection
 */
export async function getCollection(): Promise<Collection> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.COLLECTION);
    if (!data) return { ...DEFAULT_COLLECTION };
    return { ...DEFAULT_COLLECTION, ...JSON.parse(data) };
  } catch (error) {
    console.error('Failed to get collection:', error);
    return { ...DEFAULT_COLLECTION };
  }
}

/**
 * Save collection
 */
async function saveCollection(collection: Collection): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.COLLECTION, JSON.stringify(collection));
  } catch (error) {
    console.error('Failed to save collection:', error);
  }
}

/**
 * Unlock a collectible
 */
export async function unlockCollectible(
  collectibleId: string,
  customMessage?: string
): Promise<UnlockResult> {
  const collection = await getCollection();

  // Check if already unlocked
  if (collection.unlocked[collectibleId]) {
    return { unlocked: false, isNew: false };
  }

  // Find the collectible
  const collectible = ALL_COLLECTIBLES.find((c) => c.id === collectibleId);
  if (!collectible) {
    return { unlocked: false };
  }

  // Unlock it
  const unlockedCollectible: Collectible = {
    ...collectible,
    unlockedAt: new Date().toISOString(),
  };

  collection.unlocked[collectibleId] = unlockedCollectible;
  collection.totalDiscovered++;
  collection.lastUnlockDate = new Date().toISOString();

  await saveCollection(collection);

  return {
    unlocked: true,
    collectible: unlockedCollectible,
    message: customMessage || getDefaultUnlockMessage(collectible),
    isNew: true,
  };
}

/**
 * Get default unlock message
 */
function getDefaultUnlockMessage(collectible: Collectible): string {
  const typeMessages: Record<CollectibleType, string> = {
    artifact: `You discovered ${collectible.emoji} ${collectible.name}!`,
    title: `You earned the title: ${collectible.emoji} ${collectible.name}!`,
    card_back: `New card back unlocked: ${collectible.emoji} ${collectible.name}!`,
    skill: `New skill unlocked: ${collectible.emoji} ${collectible.name}!`,
    coach_perk: `Coach perk unlocked: ${collectible.emoji} ${collectible.name}!`,
  };
  return typeMessages[collectible.type];
}

/**
 * Equip a title or card back
 */
export async function equipCollectible(
  collectibleId: string,
  type: 'title' | 'cardBack'
): Promise<boolean> {
  const collection = await getCollection();

  // Check if unlocked
  if (!collection.unlocked[collectibleId]) {
    return false;
  }

  if (type === 'title') {
    collection.equipped.title = collectibleId;
  } else {
    collection.equipped.cardBack = collectibleId;
  }

  await saveCollection(collection);
  return true;
}

// ============================================
// UNLOCK ENGINE
// ============================================

/**
 * Check for unlocks based on current stats
 */
async function checkForUnlocks(
  stats: UsageStats,
  lastActivity: string,
  hour: number
): Promise<UnlockResult[]> {
  const collection = await getCollection();
  const unlocks: UnlockResult[] = [];

  for (const trigger of UNLOCK_TRIGGERS) {
    // Skip if already unlocked
    if (collection.unlocked[trigger.collectibleId]) {
      continue;
    }

    const shouldUnlock = evaluateTrigger(trigger, stats, lastActivity, hour);

    if (shouldUnlock) {
      const result = await unlockCollectible(trigger.collectibleId, trigger.message);
      if (result.unlocked && result.isNew) {
        unlocks.push(result);
      }
    }
  }

  return unlocks;
}

/**
 * Evaluate if a trigger condition is met
 */
function evaluateTrigger(
  trigger: UnlockTrigger,
  stats: UsageStats,
  lastActivity: string,
  hour: number
): boolean {
  const { condition, type } = trigger;

  switch (type) {
    case 'milestone':
      return evaluateMilestone(condition, stats);

    case 'exploration':
      return evaluateExploration(condition, stats);

    case 'time_based':
      return evaluateTimeBased(condition, stats, hour);

    case 'random':
      return evaluateRandom(condition, lastActivity);

    default:
      return false;
  }
}

function evaluateMilestone(condition: TriggerCondition, stats: UsageStats): boolean {
  if (condition.daysUsed) {
    return stats.uniqueDaysUsed.length >= condition.daysUsed;
  }

  if (!condition.activityType || !condition.count) return false;

  if (condition.activityType === 'any') {
    return stats.totalSessions >= condition.count;
  }

  const activityCounts: Record<string, number> = {
    breathing: stats.breathingCount,
    grounding: stats.groundingCount,
    journaling: stats.journalCount,
    body_scan: stats.bodyScansCount,
    thought_challenge: stats.thoughtChallengeCount,
    game: stats.gamesPlayedCount,
    lesson: stats.lessonsCompletedCount,
  };

  return (activityCounts[condition.activityType] || 0) >= condition.count;
}

function evaluateExploration(condition: TriggerCondition, stats: UsageStats): boolean {
  if (condition.triedActivities) {
    const tried = Object.keys(stats.activityDistribution);
    return condition.triedActivities.every((a) => tried.includes(a));
  }

  if (condition.triedPersonas) {
    return stats.personasUsed.length >= condition.triedPersonas;
  }

  return false;
}

function evaluateTimeBased(
  condition: TriggerCondition,
  stats: UsageStats,
  hour: number
): boolean {
  const timeOfDay = getTimeOfDay(hour);

  if (condition.timeOfDay && condition.timeOfDay !== timeOfDay) {
    return false;
  }

  if (condition.count) {
    const countByTime: Record<string, number> = {
      morning: stats.morningSessionCount,
      evening: stats.eveningSessionCount,
      night: stats.nightSessionCount,
      midnight: stats.nightSessionCount,
    };
    return (countByTime[condition.timeOfDay || ''] || 0) >= condition.count;
  }

  // Just being active at this time is enough
  return condition.timeOfDay === timeOfDay;
}

function evaluateRandom(condition: TriggerCondition, lastActivity: string): boolean {
  if (condition.afterActivity && condition.afterActivity !== lastActivity) {
    return false;
  }

  if (condition.chance) {
    return Math.random() < condition.chance;
  }

  return false;
}

function getTimeOfDay(hour: number): 'morning' | 'evening' | 'night' | 'midnight' {
  if (hour >= 0 && hour < 5) return 'midnight';
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 21) return 'evening';
  return 'night';
}

// ============================================
// UI HELPERS
// ============================================

/**
 * Get rarity display info
 */
export function getRarityInfo(rarity: Rarity): { symbol: string; color: string; name: string } {
  const info: Record<Rarity, { symbol: string; color: string; name: string }> = {
    common: { symbol: '◆', color: '#888', name: 'Common' },
    uncommon: { symbol: '◆◆', color: '#4ECDC4', name: 'Uncommon' },
    rare: { symbol: '◆◆◆', color: '#9B59B6', name: 'Rare' },
    legendary: { symbol: '★', color: '#F1C40F', name: 'Legendary' },
  };
  return info[rarity];
}

/**
 * Get skill type display info
 */
export function getSkillTypeInfo(skillType: SkillType): { emoji: string; name: string } {
  const info: Record<SkillType, { emoji: string; name: string }> = {
    calm: { emoji: '⚡', name: 'Calm' },
    ground: { emoji: '🦶', name: 'Ground' },
    focus: { emoji: '🎯', name: 'Focus' },
    challenge: { emoji: '🧠', name: 'Challenge' },
    connect: { emoji: '💜', name: 'Connect' },
    restore: { emoji: '🌙', name: 'Restore' },
  };
  return info[skillType];
}

/**
 * Get collection summary for display
 */
export async function getCollectionSummary(): Promise<{
  totalDiscovered: number;
  totalAvailable: number;
  byType: Record<CollectibleType, { discovered: number; total: number }>;
  equippedTitle?: Collectible;
  equippedCardBack?: Collectible;
  recentUnlocks: Collectible[];
}> {
  const collection = await getCollection();

  const byType: Record<CollectibleType, { discovered: number; total: number }> = {
    artifact: { discovered: 0, total: ARTIFACTS.length },
    title: { discovered: 0, total: TITLES.length },
    card_back: { discovered: 0, total: CARD_BACKS.length },
    skill: { discovered: 0, total: 0 },
    coach_perk: { discovered: 0, total: 0 },
  };

  Object.values(collection.unlocked).forEach((c) => {
    if (byType[c.type]) {
      byType[c.type].discovered++;
    }
  });

  const recentUnlocks = Object.values(collection.unlocked)
    .sort((a, b) => {
      const dateA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
      const dateB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  return {
    totalDiscovered: collection.totalDiscovered,
    totalAvailable: ALL_COLLECTIBLES.filter((c) => !c.isHidden).length,
    byType,
    equippedTitle: collection.equipped.title
      ? collection.unlocked[collection.equipped.title]
      : undefined,
    equippedCardBack: collection.equipped.cardBack
      ? collection.unlocked[collection.equipped.cardBack]
      : undefined,
    recentUnlocks,
  };
}

/**
 * Format collection for chat display
 */
export async function formatCollectionForChat(): Promise<string> {
  const summary = await getCollectionSummary();
  const collection = await getCollection();

  let text = `**🎒 YOUR COLLECTION**\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Progress bar
  const pct = Math.round((summary.totalDiscovered / summary.totalAvailable) * 100);
  const filled = Math.round(pct / 10);
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
  text += `${summary.totalDiscovered}/${summary.totalAvailable} discovered\n`;
  text += `[${bar}] ${pct}%\n\n`;

  // By type
  text += `📜 Artifacts: ${summary.byType.artifact.discovered}/${summary.byType.artifact.total}\n`;
  text += `🏷️ Titles: ${summary.byType.title.discovered}/${summary.byType.title.total}\n`;
  text += `🎴 Card Backs: ${summary.byType.card_back.discovered}/${summary.byType.card_back.total}\n\n`;

  // Equipped
  if (summary.equippedTitle) {
    text += `**Equipped Title:** ${summary.equippedTitle.emoji} ${summary.equippedTitle.name}\n`;
  }
  if (summary.equippedCardBack) {
    text += `**Card Back:** ${summary.equippedCardBack.emoji} ${summary.equippedCardBack.name}\n`;
  }

  // Recent unlocks
  if (summary.recentUnlocks.length > 0) {
    text += `\n**Recent Discoveries:**\n`;
    summary.recentUnlocks.forEach((c) => {
      const rarity = getRarityInfo(c.rarity);
      text += `  ${c.emoji} ${c.name} ${rarity.symbol}\n`;
    });
  }

  // Undiscovered hint
  const undiscovered = summary.totalAvailable - summary.totalDiscovered;
  if (undiscovered > 0) {
    text += `\n_${undiscovered} more to discover..._`;
  }

  return text;
}

/**
 * Get pending unlock notification (for app launch)
 */
export async function getPendingUnlock(): Promise<UnlockResult | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_UNLOCKS);
    if (!data) return null;

    const pending: UnlockResult[] = JSON.parse(data);
    if (pending.length === 0) return null;

    // Pop the first pending unlock
    const next = pending.shift();
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_UNLOCKS, JSON.stringify(pending));

    return next || null;
  } catch (error) {
    console.error('Failed to get pending unlock:', error);
    return null;
  }
}

/**
 * Queue an unlock for later display
 */
export async function queueUnlock(unlock: UnlockResult): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_UNLOCKS);
    const pending: UnlockResult[] = data ? JSON.parse(data) : [];
    pending.push(unlock);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_UNLOCKS, JSON.stringify(pending));
  } catch (error) {
    console.error('Failed to queue unlock:', error);
  }
}
