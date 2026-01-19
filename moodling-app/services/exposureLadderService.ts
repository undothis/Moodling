/**
 * Social Exposure Ladder Service
 *
 * Graduated support for building social confidence.
 * Following Moodling Ethics:
 * - Never pushes more than one level
 * - Celebrates attempts, not just success
 * - Normalizes anxiety
 * - User controls their pace
 *
 * Unit 21: Social Exposure Ladder
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { updatePreference, getUserPreferences } from './userContextService';

// Storage keys
const EXPOSURE_HISTORY_KEY = 'moodling_exposure_history';

/**
 * Social exposure levels (1-8 scale)
 */
export type ExposureLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Exposure level metadata
 */
export interface ExposureLevelInfo {
  level: ExposureLevel;
  name: string;
  description: string;
  examples: string[];
  encouragement: string;
}

/**
 * All exposure levels with details
 */
export const EXPOSURE_LEVELS: ExposureLevelInfo[] = [
  {
    level: 1,
    name: 'Leave the house',
    description: 'Simply being outside your comfort zone',
    examples: [
      'Walk around the block',
      'Sit on your porch or balcony',
      'Go to your mailbox',
      'Take out the trash',
    ],
    encouragement: "Just being outside is a win. No interaction required.",
  },
  {
    level: 2,
    name: 'Be around people',
    description: 'Present in public spaces without interacting',
    examples: [
      'Sit in a cafe with headphones',
      'Walk through a park',
      'Browse a bookstore or library',
      'Sit on a bench in a public space',
    ],
    encouragement: "You don't have to talk to anyone. Just being present counts.",
  },
  {
    level: 3,
    name: 'Brief interaction',
    description: 'Short, transactional exchanges',
    examples: [
      'Order a coffee',
      'Ask for directions',
      'Return something at a store',
      'Say hello to a neighbor',
    ],
    encouragement: "These interactions have a natural end. You've got this.",
  },
  {
    level: 4,
    name: 'Short conversation',
    description: 'Brief but real exchanges',
    examples: [
      'Chat with a cashier',
      'Small talk with a neighbor',
      'Ask a store employee for help',
      'Comment on something to a stranger',
    ],
    encouragement: "A few sentences is a real conversation. That's connection.",
  },
  {
    level: 5,
    name: 'One-on-one hangout',
    description: 'Extended time with one person',
    examples: [
      'Coffee with a friend',
      'Walk with a colleague',
      'Video call with someone',
      'Lunch with a family member',
    ],
    encouragement: "One-on-one is often easier than groups. This is meaningful connection.",
  },
  {
    level: 6,
    name: 'Small group',
    description: 'Social time with 3-5 people',
    examples: [
      'Dinner with a few friends',
      'Small work meeting',
      'Game night',
      'Join a small class or workshop',
    ],
    encouragement: "Small groups let you be part of something without all the attention.",
  },
  {
    level: 7,
    name: 'Larger gathering',
    description: 'Events with many people',
    examples: [
      'House party',
      'Work event or happy hour',
      'Community gathering',
      'Concert or show',
    ],
    encouragement: "You can leave whenever you need to. There's no minimum time requirement.",
  },
  {
    level: 8,
    name: 'Speaking to a group',
    description: 'Being the center of attention',
    examples: [
      'Give a presentation',
      'Toast at a dinner',
      'Lead a meeting',
      'Speak up in a large group',
    ],
    encouragement: "This is the top of the ladder. Most people find this hard. You're doing something brave.",
  },
];

/**
 * An exposure challenge suggestion
 */
export interface ExposureChallenge {
  level: ExposureLevel;
  levelInfo: ExposureLevelInfo;
  suggestion: string;
  encouragement: string;
  normalizer: string;
}

/**
 * A logged exposure attempt
 */
export interface ExposureAttempt {
  id: string;
  date: string;
  level: ExposureLevel;
  description: string;
  completed: boolean;
  anxietyBefore: number; // 1-10
  anxietyAfter?: number; // 1-10
  notes?: string;
}

/**
 * Get exposure level info
 */
export function getLevelInfo(level: ExposureLevel): ExposureLevelInfo {
  return EXPOSURE_LEVELS[level - 1];
}

/**
 * Get user's current exposure level
 */
export async function getCurrentLevel(): Promise<ExposureLevel> {
  const prefs = await getUserPreferences();
  return (prefs.currentExposureLevel as ExposureLevel) ?? 1;
}

/**
 * Set user's current comfort level
 */
export async function setCurrentLevel(level: ExposureLevel): Promise<void> {
  await updatePreference('currentExposureLevel', level);
}

/**
 * Suggest a challenge based on current level and recent success
 */
export function suggestChallenge(
  currentLevel: ExposureLevel,
  recentSuccess: boolean = false
): ExposureChallenge {
  // Never push more than one level
  const targetLevel = recentSuccess
    ? Math.min(currentLevel + 1, 8) as ExposureLevel
    : currentLevel;

  const levelInfo = getLevelInfo(targetLevel);
  const suggestion = levelInfo.examples[Math.floor(Math.random() * levelInfo.examples.length)];

  return {
    level: targetLevel,
    levelInfo,
    suggestion,
    encouragement: levelInfo.encouragement,
    normalizer: "Feeling nervous is normal and expected. It doesn't mean you can't do this.",
  };
}

/**
 * Generate celebration message based on attempt outcome
 */
export function celebrateAttempt(
  completed: boolean,
  anxietyBefore: number,
  anxietyAfter?: number
): string {
  if (completed) {
    if (anxietyAfter !== undefined && anxietyAfter < anxietyBefore) {
      return "You did it, and your anxiety went down! That's how exposure works. Your brain is learning that this is safe.";
    } else if (anxietyAfter !== undefined && anxietyAfter === anxietyBefore) {
      return "You showed up and followed through. That's courage in action. The more you practice, the easier it becomes.";
    } else {
      return "You completed it even though it was hard. That takes real strength. Every time you do this, you're building capacity.";
    }
  } else {
    return "You tried, and that matters more than you might think. Every attempt—whether completed or not—builds your capacity for the next one.";
  }
}

/**
 * Get all logged attempts
 */
export async function getExposureHistory(): Promise<ExposureAttempt[]> {
  try {
    const data = await AsyncStorage.getItem(EXPOSURE_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load exposure history:', error);
    return [];
  }
}

/**
 * Log an exposure attempt
 */
export async function logAttempt(attempt: Omit<ExposureAttempt, 'id' | 'date'>): Promise<ExposureAttempt> {
  const newAttempt: ExposureAttempt = {
    ...attempt,
    id: `exp-${Date.now()}`,
    date: new Date().toISOString(),
  };

  try {
    const history = await getExposureHistory();
    history.unshift(newAttempt);
    await AsyncStorage.setItem(EXPOSURE_HISTORY_KEY, JSON.stringify(history));
    return newAttempt;
  } catch (error) {
    console.error('Failed to log exposure attempt:', error);
    throw error;
  }
}

/**
 * Get recent attempts for statistics
 */
export async function getRecentAttempts(days: number = 30): Promise<ExposureAttempt[]> {
  const history = await getExposureHistory();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return history.filter(a => new Date(a.date) >= cutoff);
}

/**
 * Calculate progress statistics
 */
export async function getProgressStats(): Promise<{
  totalAttempts: number;
  completedAttempts: number;
  avgAnxietyReduction: number;
  highestLevelAttempted: ExposureLevel;
  streakDays: number;
}> {
  const history = await getExposureHistory();

  if (history.length === 0) {
    return {
      totalAttempts: 0,
      completedAttempts: 0,
      avgAnxietyReduction: 0,
      highestLevelAttempted: 1,
      streakDays: 0,
    };
  }

  const completed = history.filter(a => a.completed);
  const withAnxiety = history.filter(a => a.anxietyBefore && a.anxietyAfter);

  const avgReduction = withAnxiety.length > 0
    ? withAnxiety.reduce((sum, a) => sum + (a.anxietyBefore - (a.anxietyAfter ?? a.anxietyBefore)), 0) / withAnxiety.length
    : 0;

  const levels = history.map(a => a.level);
  const highestLevel = Math.max(...levels) as ExposureLevel;

  // Calculate streak
  let streakDays = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    const hasAttempt = history.some(a => a.date.split('T')[0] === dateStr);
    if (hasAttempt) {
      streakDays++;
    } else if (i > 0) {
      break; // Streak broken
    }
  }

  return {
    totalAttempts: history.length,
    completedAttempts: completed.length,
    avgAnxietyReduction: Math.round(avgReduction * 10) / 10,
    highestLevelAttempted: highestLevel,
    streakDays,
  };
}

/**
 * Get motivational message based on progress
 */
export function getMotivationalMessage(stats: Awaited<ReturnType<typeof getProgressStats>>): string {
  if (stats.totalAttempts === 0) {
    return "Every journey starts with a single step. When you're ready, pick a level that feels manageable.";
  }

  if (stats.streakDays >= 7) {
    return `${stats.streakDays} days of practice! You're building real momentum. Your brain is rewiring with each attempt.`;
  }

  if (stats.avgAnxietyReduction > 1) {
    return `On average, your anxiety drops by ${stats.avgAnxietyReduction} points after exposure. Your body is learning that social situations are safe.`;
  }

  if (stats.completedAttempts > 0) {
    return `You've completed ${stats.completedAttempts} exposure${stats.completedAttempts > 1 ? 's' : ''}. Each one is proof that you can handle more than you think.`;
  }

  return "You've started this journey. That's the hardest part. Keep going at your own pace.";
}
