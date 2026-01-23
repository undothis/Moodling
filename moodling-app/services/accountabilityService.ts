/**
 * Accountability Service
 *
 * Tracks skill practice, suggests skills to the coach, and manages
 * reminders to help users stay accountable with their wellness practices.
 *
 * Features:
 * - Track skill practice history
 * - Suggest relevant skills based on user state
 * - Coach can reference and suggest skills
 * - Notifications for skill practice reminders
 * - Achievement tracking for skill milestones
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AVAILABLE_SKILLS, SkillCategory, SKILL_CATEGORIES } from '@/types/SkillProgression';

// Storage keys
const STORAGE_KEYS = {
  SKILL_PRACTICE_LOG: 'moodleaf_skill_practice_log',
  SKILL_STREAKS: 'moodleaf_skill_streaks',
  SKILL_REMINDERS: 'moodleaf_skill_reminders',
  SKILL_ACHIEVEMENTS: 'moodleaf_skill_achievements',
  PENDING_SKILL_ALERT: 'moodleaf_pending_skill_alert',
};

// Types
export interface SkillPractice {
  skillId: string;
  timestamp: string;
  duration?: number; // in seconds
  completed: boolean;
  mood_before?: number; // 1-10
  mood_after?: number; // 1-10
  notes?: string;
}

export interface SkillStreak {
  skillId: string;
  currentStreak: number;
  longestStreak: number;
  lastPracticed: string;
}

export interface SkillReminder {
  id: string;
  skillId: string;
  enabled: boolean;
  time: string; // HH:MM format
  days: number[]; // 0-6 (Sunday-Saturday)
  message?: string;
}

export interface SkillAchievement {
  id: string;
  skillId: string;
  type: 'first_practice' | 'streak_3' | 'streak_7' | 'streak_30' | 'practice_10' | 'practice_50' | 'mood_improved';
  unlockedAt: string;
  isNew: boolean;
}

export interface PendingSkillAlert {
  skillId: string;
  skillName: string;
  achievementType: string;
  message: string;
  timestamp: string;
}

// Skills the coach can suggest based on different situations
export const COACH_SKILL_SUGGESTIONS: Record<string, {
  skills: string[];
  context: string;
  coachPhrase: string;
}> = {
  // Anxiety situations
  anxiety_high: {
    skills: ['box_breathing', 'physiological_sigh', 'five_senses', 'grounding_ladder'],
    context: 'User is experiencing high anxiety',
    coachPhrase: "It sounds like you're feeling really anxious right now. Would you like to try {skill}? It can help calm your nervous system quickly.",
  },
  panic: {
    skills: ['cold_water', 'tipp_skills', 'physiological_sigh', 'butterfly_hug'],
    context: 'User is having a panic moment',
    coachPhrase: "I hear you - this feels overwhelming. Let's try {skill} together right now. It's designed for exactly these moments.",
  },
  worry_spiral: {
    skills: ['worry_time', 'fact_vs_feeling', 'containment', 'thought_record'],
    context: 'User is stuck in worried thoughts',
    coachPhrase: "Your mind is really busy with worries right now. {skill} might help you get some distance from those thoughts.",
  },

  // Sleep situations
  cant_sleep: {
    skills: ['478_breathing', 'body_scan_sleep', 'cognitive_shuffle', 'sleep_stories'],
    context: 'User cannot fall asleep',
    coachPhrase: "Having trouble sleeping? {skill} is great for quieting the mind at night. Want to try it?",
  },
  racing_thoughts_night: {
    skills: ['worry_journal_night', 'cognitive_shuffle', 'containment'],
    context: 'User has racing thoughts at bedtime',
    coachPhrase: "Racing thoughts keeping you up? {skill} can help you put those thoughts aside for the night.",
  },

  // Stress situations
  overwhelmed: {
    skills: ['brain_dump', 'pomodoro', 'single_tasking', 'wise_mind'],
    context: 'User feels overwhelmed',
    coachPhrase: "Feeling overwhelmed is hard. {skill} might help you feel more in control. Shall we try it?",
  },
  stressed: {
    skills: ['box_breathing', 'shake_it_out', 'walking_meditation', 'vagal_tone'],
    context: 'User is stressed',
    coachPhrase: "Stress can really build up in the body. {skill} is a great way to release some of that tension.",
  },

  // Emotional situations
  sad: {
    skills: ['self_compassion_break', 'loving_kindness', 'behavioral_activation', 'joy_list'],
    context: 'User is feeling sad',
    coachPhrase: "I'm sorry you're feeling down. Would you like to try {skill}? It's a gentle practice for moments like this.",
  },
  angry: {
    skills: ['physiological_sigh', 'conflict_cool_down', 'urge_surfing', 'shake_it_out'],
    context: 'User is feeling angry',
    coachPhrase: "It makes sense that you're angry. Before we talk more, would you like to try {skill} to help process that energy?",
  },
  lonely: {
    skills: ['loving_kindness', 'support_network_map', 'self_compassion_break'],
    context: 'User feels lonely',
    coachPhrase: "Loneliness is really hard. {skill} can help you feel more connected, even in these moments.",
  },

  // Focus situations
  distracted: {
    skills: ['pomodoro', 'single_tasking', 'environment_design', 'mindful_moment'],
    context: 'User is having trouble focusing',
    coachPhrase: "Having trouble focusing? {skill} is designed exactly for this. Want to give it a try?",
  },
  procrastinating: {
    skills: ['two_minute_rule', 'pomodoro', 'brain_dump', 'implementation_intentions'],
    context: 'User is procrastinating',
    coachPhrase: "Procrastination happens to everyone. {skill} can help you get started without feeling overwhelmed.",
  },

  // Crisis situations
  crisis_mild: {
    skills: ['grounding_ladder', 'window_tolerance', 'safety_plan', 'tipp_skills'],
    context: 'User in mild distress',
    coachPhrase: "Let's use some tools to help you feel safer right now. {skill} is a good place to start.",
  },

  // Relationship situations
  conflict: {
    skills: ['conflict_cool_down', 'i_statements', 'wise_mind', 'repair_conversations'],
    context: 'User is dealing with relationship conflict',
    coachPhrase: "Relationship stuff is hard. {skill} might help you navigate this situation more clearly.",
  },

  // General wellness
  daily_practice: {
    skills: ['mindful_moment', 'gratitude_practice', 'body_scan', 'five_senses'],
    context: 'Regular daily practice',
    coachPhrase: "Would you like to do your daily {skill} practice? It only takes a few minutes.",
  },
  morning_routine: {
    skills: ['mindful_moment', 'gratitude_practice', 'body_scan', 'box_breathing'],
    context: 'Morning practice',
    coachPhrase: "Good morning! Starting with {skill} can set a nice tone for your day.",
  },
  wind_down: {
    skills: ['wind_down', 'body_scan_sleep', 'gratitude_practice', '478_breathing'],
    context: 'Evening wind down',
    coachPhrase: "Ready to wind down for the night? {skill} is a great way to transition to rest.",
  },
};

// ============================================
// SKILL PRACTICE TRACKING
// ============================================

/**
 * Log a skill practice session
 */
export async function logSkillPractice(practice: SkillPractice): Promise<void> {
  try {
    const existingLog = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_PRACTICE_LOG);
    const log: SkillPractice[] = existingLog ? JSON.parse(existingLog) : [];

    log.push(practice);

    // Keep last 500 practices
    const trimmedLog = log.slice(-500);
    await AsyncStorage.setItem(STORAGE_KEYS.SKILL_PRACTICE_LOG, JSON.stringify(trimmedLog));

    // Update streaks
    await updateStreak(practice.skillId, practice.completed);

    // Check for achievements
    await checkAchievements(practice.skillId, trimmedLog);

    console.log('[Accountability] Logged practice:', practice.skillId);
  } catch (error) {
    console.error('[Accountability] Failed to log practice:', error);
  }
}

/**
 * Get practice history for a skill
 */
export async function getSkillPracticeHistory(skillId: string, limit: number = 30): Promise<SkillPractice[]> {
  try {
    const existingLog = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_PRACTICE_LOG);
    const log: SkillPractice[] = existingLog ? JSON.parse(existingLog) : [];

    return log
      .filter(p => p.skillId === skillId)
      .slice(-limit)
      .reverse();
  } catch (error) {
    console.error('[Accountability] Failed to get practice history:', error);
    return [];
  }
}

/**
 * Get all recent practices
 */
export async function getRecentPractices(limit: number = 20): Promise<SkillPractice[]> {
  try {
    const existingLog = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_PRACTICE_LOG);
    const log: SkillPractice[] = existingLog ? JSON.parse(existingLog) : [];

    return log.slice(-limit).reverse();
  } catch (error) {
    console.error('[Accountability] Failed to get recent practices:', error);
    return [];
  }
}

// ============================================
// STREAK TRACKING
// ============================================

/**
 * Update streak for a skill
 */
async function updateStreak(skillId: string, completed: boolean): Promise<void> {
  if (!completed) return;

  try {
    const existingStreaks = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_STREAKS);
    const streaks: Record<string, SkillStreak> = existingStreaks ? JSON.parse(existingStreaks) : {};

    const today = new Date().toISOString().split('T')[0];
    const existing = streaks[skillId];

    if (existing) {
      const lastDate = existing.lastPracticed.split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (lastDate === today) {
        // Already practiced today
        return;
      } else if (lastDate === yesterday) {
        // Continuing streak
        existing.currentStreak += 1;
        existing.longestStreak = Math.max(existing.longestStreak, existing.currentStreak);
      } else {
        // Streak broken
        existing.currentStreak = 1;
      }
      existing.lastPracticed = new Date().toISOString();
    } else {
      // First practice
      streaks[skillId] = {
        skillId,
        currentStreak: 1,
        longestStreak: 1,
        lastPracticed: new Date().toISOString(),
      };
    }

    await AsyncStorage.setItem(STORAGE_KEYS.SKILL_STREAKS, JSON.stringify(streaks));
  } catch (error) {
    console.error('[Accountability] Failed to update streak:', error);
  }
}

/**
 * Get streak for a skill
 */
export async function getSkillStreak(skillId: string): Promise<SkillStreak | null> {
  try {
    const existingStreaks = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_STREAKS);
    const streaks: Record<string, SkillStreak> = existingStreaks ? JSON.parse(existingStreaks) : {};
    return streaks[skillId] || null;
  } catch (error) {
    console.error('[Accountability] Failed to get streak:', error);
    return null;
  }
}

/**
 * Get all streaks
 */
export async function getAllStreaks(): Promise<SkillStreak[]> {
  try {
    const existingStreaks = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_STREAKS);
    const streaks: Record<string, SkillStreak> = existingStreaks ? JSON.parse(existingStreaks) : {};
    return Object.values(streaks);
  } catch (error) {
    console.error('[Accountability] Failed to get all streaks:', error);
    return [];
  }
}

// ============================================
// ACHIEVEMENTS
// ============================================

/**
 * Check and unlock achievements
 */
async function checkAchievements(skillId: string, allPractices: SkillPractice[]): Promise<void> {
  try {
    const existingAchievements = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_ACHIEVEMENTS);
    const achievements: SkillAchievement[] = existingAchievements ? JSON.parse(existingAchievements) : [];

    const skillPractices = allPractices.filter(p => p.skillId === skillId && p.completed);
    const streak = await getSkillStreak(skillId);
    const skill = AVAILABLE_SKILLS.find(s => s.id === skillId);

    const newAchievements: SkillAchievement[] = [];

    // First practice
    if (skillPractices.length === 1 && !achievements.some(a => a.skillId === skillId && a.type === 'first_practice')) {
      newAchievements.push({
        id: `${skillId}_first_practice`,
        skillId,
        type: 'first_practice',
        unlockedAt: new Date().toISOString(),
        isNew: true,
      });
    }

    // Practice milestones
    if (skillPractices.length >= 10 && !achievements.some(a => a.skillId === skillId && a.type === 'practice_10')) {
      newAchievements.push({
        id: `${skillId}_practice_10`,
        skillId,
        type: 'practice_10',
        unlockedAt: new Date().toISOString(),
        isNew: true,
      });
    }

    if (skillPractices.length >= 50 && !achievements.some(a => a.skillId === skillId && a.type === 'practice_50')) {
      newAchievements.push({
        id: `${skillId}_practice_50`,
        skillId,
        type: 'practice_50',
        unlockedAt: new Date().toISOString(),
        isNew: true,
      });
    }

    // Streak achievements
    if (streak) {
      if (streak.currentStreak >= 3 && !achievements.some(a => a.skillId === skillId && a.type === 'streak_3')) {
        newAchievements.push({
          id: `${skillId}_streak_3`,
          skillId,
          type: 'streak_3',
          unlockedAt: new Date().toISOString(),
          isNew: true,
        });
      }

      if (streak.currentStreak >= 7 && !achievements.some(a => a.skillId === skillId && a.type === 'streak_7')) {
        newAchievements.push({
          id: `${skillId}_streak_7`,
          skillId,
          type: 'streak_7',
          unlockedAt: new Date().toISOString(),
          isNew: true,
        });
      }

      if (streak.currentStreak >= 30 && !achievements.some(a => a.skillId === skillId && a.type === 'streak_30')) {
        newAchievements.push({
          id: `${skillId}_streak_30`,
          skillId,
          type: 'streak_30',
          unlockedAt: new Date().toISOString(),
          isNew: true,
        });
      }
    }

    // Mood improvement
    const lastPractice = skillPractices[skillPractices.length - 1];
    if (lastPractice?.mood_before && lastPractice?.mood_after) {
      if (lastPractice.mood_after > lastPractice.mood_before && !achievements.some(a => a.skillId === skillId && a.type === 'mood_improved')) {
        newAchievements.push({
          id: `${skillId}_mood_improved`,
          skillId,
          type: 'mood_improved',
          unlockedAt: new Date().toISOString(),
          isNew: true,
        });
      }
    }

    if (newAchievements.length > 0) {
      const updatedAchievements = [...achievements, ...newAchievements];
      await AsyncStorage.setItem(STORAGE_KEYS.SKILL_ACHIEVEMENTS, JSON.stringify(updatedAchievements));

      // Create pending alert for coach/UI to show
      const firstNew = newAchievements[0];
      const alertMessage = getAchievementMessage(firstNew, skill?.name || skillId);
      await setPendingSkillAlert({
        skillId,
        skillName: skill?.name || skillId,
        achievementType: firstNew.type,
        message: alertMessage,
        timestamp: new Date().toISOString(),
      });

      console.log('[Accountability] New achievements:', newAchievements);
    }
  } catch (error) {
    console.error('[Accountability] Failed to check achievements:', error);
  }
}

/**
 * Get achievement message
 */
function getAchievementMessage(achievement: SkillAchievement, skillName: string): string {
  switch (achievement.type) {
    case 'first_practice':
      return `You tried ${skillName} for the first time! How did it feel?`;
    case 'streak_3':
      return `Amazing! You've practiced ${skillName} for 3 days in a row!`;
    case 'streak_7':
      return `Incredible! A full week of ${skillName} practice! You're building a real habit.`;
    case 'streak_30':
      return `WOW! 30 days of ${skillName}! This is now part of who you are.`;
    case 'practice_10':
      return `You've practiced ${skillName} 10 times! It's becoming a go-to tool for you.`;
    case 'practice_50':
      return `50 practices of ${skillName}! You've truly mastered this skill.`;
    case 'mood_improved':
      return `${skillName} improved your mood! Great to see it's working for you.`;
    default:
      return `Achievement unlocked for ${skillName}!`;
  }
}

/**
 * Get new achievements
 */
export async function getNewAchievements(): Promise<SkillAchievement[]> {
  try {
    const existingAchievements = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_ACHIEVEMENTS);
    const achievements: SkillAchievement[] = existingAchievements ? JSON.parse(existingAchievements) : [];
    return achievements.filter(a => a.isNew);
  } catch (error) {
    console.error('[Accountability] Failed to get new achievements:', error);
    return [];
  }
}

/**
 * Mark achievements as seen
 */
export async function markAchievementsSeen(): Promise<void> {
  try {
    const existingAchievements = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_ACHIEVEMENTS);
    const achievements: SkillAchievement[] = existingAchievements ? JSON.parse(existingAchievements) : [];

    const updated = achievements.map(a => ({ ...a, isNew: false }));
    await AsyncStorage.setItem(STORAGE_KEYS.SKILL_ACHIEVEMENTS, JSON.stringify(updated));
  } catch (error) {
    console.error('[Accountability] Failed to mark achievements seen:', error);
  }
}

// ============================================
// PENDING ALERTS (for coach/UI)
// ============================================

/**
 * Set pending skill alert
 */
export async function setPendingSkillAlert(alert: PendingSkillAlert): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SKILL_ALERT, JSON.stringify(alert));
  } catch (error) {
    console.error('[Accountability] Failed to set pending alert:', error);
  }
}

/**
 * Get pending skill alert
 */
export async function getPendingSkillAlert(): Promise<PendingSkillAlert | null> {
  try {
    const alert = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SKILL_ALERT);
    return alert ? JSON.parse(alert) : null;
  } catch (error) {
    console.error('[Accountability] Failed to get pending alert:', error);
    return null;
  }
}

/**
 * Clear pending skill alert
 */
export async function clearPendingSkillAlert(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_SKILL_ALERT);
  } catch (error) {
    console.error('[Accountability] Failed to clear pending alert:', error);
  }
}

// ============================================
// COACH INTEGRATION
// ============================================

/**
 * Get skill suggestions for coach based on user state
 */
export function getSkillSuggestionsForCoach(
  situation: keyof typeof COACH_SKILL_SUGGESTIONS
): { skills: string[]; coachPhrase: string } | null {
  const suggestion = COACH_SKILL_SUGGESTIONS[situation];
  if (!suggestion) return null;

  // Filter to only unlocked skills
  const availableSkills = suggestion.skills.filter(skillId => {
    const skill = AVAILABLE_SKILLS.find(s => s.id === skillId);
    return skill && skill.isUnlocked;
  });

  if (availableSkills.length === 0) return null;

  // Pick a random skill
  const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
  const skill = AVAILABLE_SKILLS.find(s => s.id === randomSkill);

  return {
    skills: availableSkills,
    coachPhrase: suggestion.coachPhrase.replace('{skill}', skill?.name || randomSkill),
  };
}

/**
 * Get context for coach about user's skill practice
 */
export async function getSkillContextForCoach(): Promise<string> {
  try {
    const recentPractices = await getRecentPractices(10);
    const allStreaks = await getAllStreaks();
    const newAchievements = await getNewAchievements();

    const parts: string[] = [];

    // Recent practices
    if (recentPractices.length > 0) {
      const recentSkills = [...new Set(recentPractices.map(p => p.skillId))];
      const skillNames = recentSkills
        .map(id => AVAILABLE_SKILLS.find(s => s.id === id)?.name || id)
        .slice(0, 3);
      parts.push(`Recent skills practiced: ${skillNames.join(', ')}`);
    }

    // Active streaks
    const activeStreaks = allStreaks.filter(s => {
      const lastDate = s.lastPracticed.split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      return lastDate === today || lastDate === yesterday;
    });

    if (activeStreaks.length > 0) {
      const topStreak = activeStreaks.sort((a, b) => b.currentStreak - a.currentStreak)[0];
      const skill = AVAILABLE_SKILLS.find(s => s.id === topStreak.skillId);
      parts.push(`Current streak: ${skill?.name || topStreak.skillId} (${topStreak.currentStreak} days)`);
    }

    // New achievements
    if (newAchievements.length > 0) {
      const achievement = newAchievements[0];
      const skill = AVAILABLE_SKILLS.find(s => s.id === achievement.skillId);
      parts.push(`New achievement: ${getAchievementMessage(achievement, skill?.name || achievement.skillId)}`);
    }

    return parts.length > 0 ? parts.join('. ') : '';
  } catch (error) {
    console.error('[Accountability] Failed to get skill context for coach:', error);
    return '';
  }
}

/**
 * Generate congratulations message for coach
 */
export async function generateSkillCongratulations(): Promise<string | null> {
  const alert = await getPendingSkillAlert();
  if (!alert) return null;

  await clearPendingSkillAlert();
  return alert.message;
}

// ============================================
// REMINDERS
// ============================================

/**
 * Set skill reminder
 */
export async function setSkillReminder(reminder: SkillReminder): Promise<void> {
  try {
    const existingReminders = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_REMINDERS);
    const reminders: SkillReminder[] = existingReminders ? JSON.parse(existingReminders) : [];

    const index = reminders.findIndex(r => r.id === reminder.id);
    if (index >= 0) {
      reminders[index] = reminder;
    } else {
      reminders.push(reminder);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.SKILL_REMINDERS, JSON.stringify(reminders));
  } catch (error) {
    console.error('[Accountability] Failed to set reminder:', error);
  }
}

/**
 * Get all skill reminders
 */
export async function getSkillReminders(): Promise<SkillReminder[]> {
  try {
    const existingReminders = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_REMINDERS);
    return existingReminders ? JSON.parse(existingReminders) : [];
  } catch (error) {
    console.error('[Accountability] Failed to get reminders:', error);
    return [];
  }
}

/**
 * Delete skill reminder
 */
export async function deleteSkillReminder(reminderId: string): Promise<void> {
  try {
    const existingReminders = await AsyncStorage.getItem(STORAGE_KEYS.SKILL_REMINDERS);
    const reminders: SkillReminder[] = existingReminders ? JSON.parse(existingReminders) : [];

    const updated = reminders.filter(r => r.id !== reminderId);
    await AsyncStorage.setItem(STORAGE_KEYS.SKILL_REMINDERS, JSON.stringify(updated));
  } catch (error) {
    console.error('[Accountability] Failed to delete reminder:', error);
  }
}

// ============================================
// TEST HELPERS (for triggering notifications)
// ============================================

/**
 * Trigger a test skill achievement alert
 */
export async function triggerTestSkillAlert(skillId: string = 'box_breathing'): Promise<void> {
  const skill = AVAILABLE_SKILLS.find(s => s.id === skillId);
  const testAlert: PendingSkillAlert = {
    skillId,
    skillName: skill?.name || skillId,
    achievementType: 'streak_3',
    message: `Amazing! You've practiced ${skill?.name || skillId} for 3 days in a row!`,
    timestamp: new Date().toISOString(),
  };
  await setPendingSkillAlert(testAlert);
  console.log('[Accountability] Test alert triggered:', testAlert);
}
