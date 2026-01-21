/**
 * Skills Progression Service
 *
 * Manages user's attribute points, skill unlocks, and coach customizations.
 * Points are earned naturally through app usage - no grinding required.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AttributeType,
  Attribute,
  ProgressionState,
  Skill,
  CoachUnlock,
  ATTRIBUTES,
  POINT_SOURCES,
  AVAILABLE_SKILLS,
  COACH_UNLOCKS,
  calculateLevel,
  getLevelProgress,
} from '@/types/SkillProgression';

const STORAGE_KEY = 'mood_leaf_progression';

// Default state for new users
function createDefaultState(): ProgressionState {
  const attributes: Record<AttributeType, Attribute> = {
    wisdom: { ...ATTRIBUTES.wisdom, points: 0, level: 1 },
    resilience: { ...ATTRIBUTES.resilience, points: 0, level: 1 },
    clarity: { ...ATTRIBUTES.clarity, points: 0, level: 1 },
    compassion: { ...ATTRIBUTES.compassion, points: 0, level: 1 },
  };

  return {
    attributes,
    unlockedSkills: AVAILABLE_SKILLS.filter(s => s.isUnlocked && !s.isPremium).map(s => s.id),
    unlockedCoachFeatures: [],
    totalPointsEarned: 0,
    journeyStartDate: new Date().toISOString(),
    lastActivityDate: new Date().toISOString(),
  };
}

/**
 * Get the user's current progression state
 */
export async function getProgressionState(): Promise<ProgressionState> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const state = JSON.parse(stored) as ProgressionState;
      // Ensure all attributes exist (in case we add new ones)
      for (const attrType of Object.keys(ATTRIBUTES) as AttributeType[]) {
        if (!state.attributes[attrType]) {
          state.attributes[attrType] = { ...ATTRIBUTES[attrType], points: 0, level: 1 };
        }
      }
      return state;
    }
    return createDefaultState();
  } catch (error) {
    console.error('[SkillProgression] Failed to load state:', error);
    return createDefaultState();
  }
}

/**
 * Save progression state
 */
async function saveState(state: ProgressionState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[SkillProgression] Failed to save state:', error);
  }
}

/**
 * Award points for an action
 */
export async function awardPoints(
  action: string
): Promise<{ attribute: AttributeType; points: number; newLevel?: number } | null> {
  const source = POINT_SOURCES.find(s => s.action === action);
  if (!source) {
    console.log(`[SkillProgression] Unknown action: ${action}`);
    return null;
  }

  const state = await getProgressionState();
  const attr = state.attributes[source.attribute];
  const oldLevel = attr.level;

  // Add points
  attr.points += source.points;
  attr.level = calculateLevel(attr.points);
  state.totalPointsEarned += source.points;
  state.lastActivityDate = new Date().toISOString();

  // Check for new unlocks
  await checkAndUnlock(state);

  await saveState(state);

  return {
    attribute: source.attribute,
    points: source.points,
    newLevel: attr.level > oldLevel ? attr.level : undefined,
  };
}

/**
 * Check and unlock skills/coach features based on current levels
 */
async function checkAndUnlock(state: ProgressionState): Promise<string[]> {
  const newUnlocks: string[] = [];

  // Check skills
  for (const skill of AVAILABLE_SKILLS) {
    if (skill.isPremium) continue; // Premium requires purchase
    if (state.unlockedSkills.includes(skill.id)) continue;

    if (skill.requiredAttribute && skill.requiredLevel) {
      const attr = state.attributes[skill.requiredAttribute];
      if (attr.level >= skill.requiredLevel) {
        state.unlockedSkills.push(skill.id);
        newUnlocks.push(skill.name);
      }
    }
  }

  // Check coach unlocks
  for (const unlock of COACH_UNLOCKS) {
    if (unlock.isPremium) continue;
    if (state.unlockedCoachFeatures.includes(unlock.id)) continue;

    if (unlock.requiredAttribute && unlock.requiredLevel) {
      const attr = state.attributes[unlock.requiredAttribute];
      if (attr.level >= unlock.requiredLevel) {
        state.unlockedCoachFeatures.push(unlock.id);
        newUnlocks.push(unlock.name);
      }
    }
  }

  return newUnlocks;
}

/**
 * Get all skills with their current unlock status
 */
export async function getSkillsWithStatus(): Promise<Skill[]> {
  const state = await getProgressionState();

  return AVAILABLE_SKILLS.map(skill => ({
    ...skill,
    isUnlocked: state.unlockedSkills.includes(skill.id) || (skill.isUnlocked && !skill.isPremium),
  }));
}

/**
 * Get all coach unlocks with their current status
 */
export async function getCoachUnlocksWithStatus(): Promise<CoachUnlock[]> {
  const state = await getProgressionState();

  return COACH_UNLOCKS.map(unlock => ({
    ...unlock,
    isUnlocked: state.unlockedCoachFeatures.includes(unlock.id),
  }));
}

/**
 * Get attributes with calculated levels and progress
 */
export async function getAttributesWithProgress(): Promise<
  Array<Attribute & { progress: number; pointsToNext: number }>
> {
  const state = await getProgressionState();

  return (Object.values(state.attributes) as Attribute[]).map(attr => {
    const progress = getLevelProgress(attr.points);
    const nextThreshold = getNextLevelThreshold(attr.points);
    return {
      ...attr,
      progress,
      pointsToNext: nextThreshold - attr.points,
    };
  });
}

/**
 * Get points needed for next level
 */
function getNextLevelThreshold(points: number): number {
  const level = calculateLevel(points);
  const thresholds = [0, 25, 75, 150, 300, 500, 750, 1000, 1500, 2000];
  if (level >= thresholds.length) return points; // Max level
  return thresholds[level];
}

/**
 * Get summary stats for display
 */
export async function getProgressionSummary(): Promise<{
  totalPoints: number;
  highestAttribute: { name: string; level: number; emoji: string };
  skillsUnlocked: number;
  totalSkills: number;
  daysOnJourney: number;
}> {
  const state = await getProgressionState();

  // Find highest attribute
  let highest: Attribute = state.attributes.wisdom;
  for (const attr of Object.values(state.attributes) as Attribute[]) {
    if (attr.points > highest.points) {
      highest = attr;
    }
  }

  // Calculate days
  const startDate = new Date(state.journeyStartDate);
  const now = new Date();
  const daysOnJourney = Math.max(1, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    totalPoints: state.totalPointsEarned,
    highestAttribute: {
      name: highest.name,
      level: highest.level,
      emoji: highest.emoji,
    },
    skillsUnlocked: state.unlockedSkills.length,
    totalSkills: AVAILABLE_SKILLS.length,
    daysOnJourney,
  };
}

/**
 * Unlock a premium feature (after purchase)
 */
export async function unlockPremiumFeature(featureId: string, type: 'skill' | 'coach'): Promise<boolean> {
  const state = await getProgressionState();

  if (type === 'skill') {
    if (!state.unlockedSkills.includes(featureId)) {
      state.unlockedSkills.push(featureId);
      await saveState(state);
      return true;
    }
  } else {
    if (!state.unlockedCoachFeatures.includes(featureId)) {
      state.unlockedCoachFeatures.push(featureId);
      await saveState(state);
      return true;
    }
  }

  return false;
}

/**
 * Check if a specific skill is unlocked
 */
export async function isSkillUnlocked(skillId: string): Promise<boolean> {
  const state = await getProgressionState();
  const skill = AVAILABLE_SKILLS.find(s => s.id === skillId);

  if (!skill) return false;
  if (skill.isUnlocked && !skill.isPremium) return true;
  return state.unlockedSkills.includes(skillId);
}

/**
 * Check if a coach feature is unlocked
 */
export async function isCoachFeatureUnlocked(featureId: string): Promise<boolean> {
  const state = await getProgressionState();
  return state.unlockedCoachFeatures.includes(featureId);
}

/**
 * Get what the user needs to unlock a specific skill
 */
export function getUnlockRequirements(skill: Skill): string | null {
  if (skill.isPremium) {
    return 'Premium feature';
  }
  if (skill.requiredAttribute && skill.requiredLevel) {
    return `Requires ${ATTRIBUTES[skill.requiredAttribute].name} Level ${skill.requiredLevel}`;
  }
  return null;
}

/**
 * Reset progression (for testing/debug)
 */
export async function resetProgression(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/**
 * Easter egg: Check for secret slash commands
 */
export function checkEasterEgg(command: string): { found: boolean; message?: string; action?: string } {
  const easterEggs: Record<string, { message: string; action?: string }> = {
    '/party': { message: '🎉🎊🥳 Party mode activated! 🥳🎊🎉', action: 'confetti' },
    '/debug': { message: 'Debug mode toggled', action: 'toggle_debug' },
    '/credits': { message: 'Made with 💚 by the Mood Leaf team', action: 'show_credits' },
    '/tree': { message: '🌳 Your tree appreciates you! 🌳' },
    '/coffee': { message: '☕ Here\'s a virtual coffee for your journey!' },
    '/hug': { message: '🤗 Sending you a warm virtual hug!' },
    '/wisdom': { message: '🦉 "The only true wisdom is knowing you know nothing." - Socrates' },
    '/42': { message: '🌌 The answer to life, the universe, and everything!' },
    '/snake': { message: '🐍 Loading retro Snake...', action: 'game_snake' },
    '/pong': { message: '🏓 Loading classic Pong...', action: 'game_pong' },
  };

  const lower = command.toLowerCase().trim();
  const egg = easterEggs[lower];

  if (egg) {
    return { found: true, message: egg.message, action: egg.action };
  }

  return { found: false };
}
