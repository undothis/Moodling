/**
 * Achievement Notification Service
 *
 * Tracks and notifies users about achievements like new insights,
 * skill completions, and patterns discovered.
 *
 * Features:
 * - Coach glow when there's a new achievement to celebrate
 * - Seeds glow when there are new insights
 * - Integration with notification system
 * - Test trigger for developers
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNewInsights, shouldCongratulateOnInsight, Insight } from './insightService';

// Storage keys
const STORAGE_KEYS = {
  PENDING_ACHIEVEMENTS: 'moodleaf_pending_achievements',
  LAST_COACH_ACHIEVEMENT_CHECK: 'moodleaf_last_coach_achievement',
  ACHIEVEMENT_SETTINGS: 'moodleaf_achievement_settings',
};

// ============================================
// TYPES
// ============================================

export type AchievementType =
  | 'new_insight'          // Discovered a new pattern
  | 'insight_strengthened' // Existing insight got stronger
  | 'skill_unlocked'       // New skill became available
  | 'skill_completed'      // Completed a skill session
  | 'streak_milestone'     // Journaling consistency (not pushy)
  | 'growth_recognized'    // Coach noticed growth
  | 'accountability_met';  // Met an accountability goal

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  timestamp: string;
  relatedInsightId?: string;
  relatedSkillId?: string;
  isNew: boolean;
  celebratedByCoach: boolean;
}

export interface AchievementSettings {
  enabled: boolean;
  coachGlowEnabled: boolean;
  seedsGlowEnabled: boolean;
  notifyOnNewInsight: boolean;
  notifyOnSkillComplete: boolean;
}

const DEFAULT_SETTINGS: AchievementSettings = {
  enabled: true,
  coachGlowEnabled: true,
  seedsGlowEnabled: true,
  notifyOnNewInsight: true,
  notifyOnSkillComplete: true,
};

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Get all pending achievements
 */
export async function getPendingAchievements(): Promise<Achievement[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ACHIEVEMENTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[Achievement] Error loading achievements:', error);
    return [];
  }
}

/**
 * Get count of new achievements (for glow badge)
 */
export async function getNewAchievementCount(): Promise<number> {
  const achievements = await getPendingAchievements();
  return achievements.filter(a => a.isNew && !a.celebratedByCoach).length;
}

/**
 * Check if coach should glow (has uncelebrated achievements)
 */
export async function shouldCoachGlow(): Promise<boolean> {
  const settings = await getAchievementSettings();
  if (!settings.coachGlowEnabled) return false;

  // Check for uncelebrated achievements
  const achievements = await getPendingAchievements();
  const uncelebrated = achievements.filter(a => a.isNew && !a.celebratedByCoach);
  if (uncelebrated.length > 0) return true;

  // Also check insight service directly
  const insightToCelebrate = await shouldCongratulateOnInsight();
  return insightToCelebrate !== null;
}

/**
 * Check if skills tab should glow (has uncelebrated skill achievements)
 */
export async function shouldSkillsGlow(): Promise<boolean> {
  const achievements = await getPendingAchievements();
  const skillAchievements = achievements.filter(
    a => a.isNew && !a.celebratedByCoach &&
    (a.type === 'skill_completed' || a.type === 'skill_unlocked')
  );
  return skillAchievements.length > 0;
}

/**
 * Get count of uncelebrated skill achievements
 */
export async function getSkillAchievementCount(): Promise<number> {
  const achievements = await getPendingAchievements();
  return achievements.filter(
    a => a.isNew && !a.celebratedByCoach &&
    (a.type === 'skill_completed' || a.type === 'skill_unlocked')
  ).length;
}

/**
 * Get the next achievement for coach to celebrate
 */
export async function getNextCelebration(): Promise<Achievement | null> {
  const achievements = await getPendingAchievements();
  return achievements.find(a => a.isNew && !a.celebratedByCoach) || null;
}

/**
 * Mark an achievement as celebrated by coach
 */
export async function markAsCelebrated(achievementId: string): Promise<void> {
  const achievements = await getPendingAchievements();
  const updated = achievements.map(a =>
    a.id === achievementId
      ? { ...a, celebratedByCoach: true, isNew: false }
      : a
  );
  await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACHIEVEMENTS, JSON.stringify(updated));
}

/**
 * Add a new achievement
 */
export async function addAchievement(
  type: AchievementType,
  title: string,
  description: string,
  options?: {
    relatedInsightId?: string;
    relatedSkillId?: string;
  }
): Promise<Achievement> {
  const achievement: Achievement = {
    id: `ach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    description,
    timestamp: new Date().toISOString(),
    relatedInsightId: options?.relatedInsightId,
    relatedSkillId: options?.relatedSkillId,
    isNew: true,
    celebratedByCoach: false,
  };

  const achievements = await getPendingAchievements();
  achievements.push(achievement);

  // Keep last 50 achievements
  const trimmed = achievements.slice(-50);
  await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACHIEVEMENTS, JSON.stringify(trimmed));

  console.log('[Achievement] Added:', type, title);
  return achievement;
}

/**
 * Create achievement from insight
 */
export async function createInsightAchievement(insight: Insight): Promise<Achievement> {
  const isStrengthened = insight.timesReinforced > 1;

  return addAchievement(
    isStrengthened ? 'insight_strengthened' : 'new_insight',
    isStrengthened ? 'Pattern Confirmed' : 'New Discovery',
    insight.description,
    { relatedInsightId: insight.id }
  );
}

/**
 * Create skill completion achievement
 */
export async function createSkillAchievement(
  skillId: string,
  skillName: string
): Promise<Achievement> {
  return addAchievement(
    'skill_completed',
    'Skill Complete',
    `You completed a ${skillName} session. Well done!`,
    { relatedSkillId: skillId }
  );
}

/**
 * Create accountability achievement
 */
export async function createAccountabilityAchievement(
  twigName: string,
  daysStreak: number
): Promise<Achievement> {
  return addAchievement(
    'accountability_met',
    'Accountability Win',
    `You've stayed within your ${twigName} limit for ${daysStreak} days!`
  );
}

// ============================================
// SETTINGS
// ============================================

/**
 * Get achievement notification settings
 */
export async function getAchievementSettings(): Promise<AchievementSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENT_SETTINGS);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update achievement settings
 */
export async function updateAchievementSettings(
  settings: Partial<AchievementSettings>
): Promise<void> {
  const current = await getAchievementSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENT_SETTINGS, JSON.stringify(updated));
}

// ============================================
// TEST & DEBUG
// ============================================

/**
 * Create a test achievement for development/testing
 */
export async function createTestAchievement(): Promise<Achievement> {
  const testAchievements = [
    {
      type: 'new_insight' as AchievementType,
      title: 'Pattern Discovered',
      description: 'You seem to sleep better when you exercise earlier in the day.',
    },
    {
      type: 'growth_recognized' as AchievementType,
      title: 'Growth Noticed',
      description: 'Your journaling has become more reflective over the past month.',
    },
    {
      type: 'skill_completed' as AchievementType,
      title: 'Skill Complete',
      description: 'You completed a grounding exercise. Great job taking time for yourself!',
    },
    {
      type: 'accountability_met' as AchievementType,
      title: 'Accountability Win',
      description: "You've stayed within your coffee limit for 3 days!",
    },
  ];

  const random = testAchievements[Math.floor(Math.random() * testAchievements.length)];
  return addAchievement(random.type, random.title, random.description);
}

/**
 * Clear all achievements (for testing)
 */
export async function clearAllAchievements(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_ACHIEVEMENTS);
}

/**
 * Get achievement stats
 */
export async function getAchievementStats(): Promise<{
  total: number;
  uncelebrated: number;
  byType: Record<AchievementType, number>;
}> {
  const achievements = await getPendingAchievements();

  const byType = achievements.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {} as Record<AchievementType, number>);

  return {
    total: achievements.length,
    uncelebrated: achievements.filter(a => !a.celebratedByCoach).length,
    byType,
  };
}

// ============================================
// COACH INTEGRATION
// ============================================

/**
 * Generate a celebration message for coach to say
 */
export function generateCelebrationMessage(achievement: Achievement): string {
  const messages: Record<AchievementType, string[]> = {
    new_insight: [
      `I've noticed something interesting! ${achievement.description}`,
      `There's a pattern forming that I wanted to share with you. ${achievement.description}`,
      `I discovered something about you: ${achievement.description}`,
    ],
    insight_strengthened: [
      `That pattern I mentioned before? It's getting stronger. ${achievement.description}`,
      `More evidence for something we noticed: ${achievement.description}`,
    ],
    skill_unlocked: [
      `You've unlocked a new skill! ${achievement.description}`,
      `Something new is available for you: ${achievement.description}`,
    ],
    skill_completed: [
      `Well done on completing that! ${achievement.description}`,
      `Great job! ${achievement.description}`,
    ],
    streak_milestone: [
      `I noticed you've been consistent. ${achievement.description}`,
      `Worth celebrating: ${achievement.description}`,
    ],
    growth_recognized: [
      `I wanted to acknowledge something: ${achievement.description}`,
      `I've noticed some growth: ${achievement.description}`,
    ],
    accountability_met: [
      `Nice work on your accountability goal! ${achievement.description}`,
      `You're doing great with your limits. ${achievement.description}`,
    ],
  };

  const typeMessages = messages[achievement.type] || [`Great news! ${achievement.description}`];
  return typeMessages[Math.floor(Math.random() * typeMessages.length)];
}

/**
 * Check and sync with insight service
 * Call this periodically to pick up new insights
 */
export async function syncWithInsights(): Promise<void> {
  try {
    const newInsights = await getNewInsights();

    for (const insight of newInsights) {
      // Check if we already have an achievement for this insight
      const achievements = await getPendingAchievements();
      const exists = achievements.some(a => a.relatedInsightId === insight.id);

      if (!exists && insight.isNew) {
        await createInsightAchievement(insight);
      }
    }
  } catch (error) {
    console.error('[Achievement] Error syncing with insights:', error);
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  getPendingAchievements,
  getNewAchievementCount,
  shouldCoachGlow,
  getNextCelebration,
  markAsCelebrated,
  addAchievement,
  createInsightAchievement,
  createSkillAchievement,
  createAccountabilityAchievement,
  getAchievementSettings,
  updateAchievementSettings,
  createTestAchievement,
  clearAllAchievements,
  getAchievementStats,
  generateCelebrationMessage,
  syncWithInsights,
};
