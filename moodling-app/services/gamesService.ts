/**
 * Games Service
 *
 * Therapeutic mini-games for mental wellness with retro pixel aesthetic.
 * Categories:
 * - FOCUS: Attention and concentration training
 * - GROUNDING: Present-moment awareness
 * - RELAXATION: Calm and stress relief
 * - KNOWLEDGE: Emotional intelligence learning
 * - WISDOM: Perspective and values exploration
 * - LOGIC: Cognitive restructuring and brain training
 *
 * Following Mood Leaf principles:
 * - Never gamifying distress
 * - Gentle, non-competitive
 * - Progress tracked privately
 * - Can be paused/stopped anytime
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type GameCategory =
  | 'focus'
  | 'grounding'
  | 'relaxation'
  | 'knowledge'
  | 'wisdom'
  | 'logic_therapeutic'
  | 'logic_classic';

export type GameDifficulty = 'gentle' | 'moderate' | 'challenging';

export type RetroStyle =
  | '8bit_sidescroll'
  | 'pixel_cards'
  | 'dungeon_crawler'
  | 'rpg_quest'
  | 'farming_sim'
  | 'lofi_aesthetic'
  | 'circuit_board'
  | 'night_sky'
  | 'word_tiles'
  | 'grid_puzzle'
  | 'classic_windows';

export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  category: GameCategory;
  mentalBenefit: string;
  retroStyle: RetroStyle;
  estimatedMinutes: number;
  difficulty: GameDifficulty;
  requiresSound?: boolean;
  requiresHaptics?: boolean;
  unlockAfterPlays?: number; // Some games unlock after playing others
}

export interface GameSession {
  gameId: string;
  startedAt: string;
  endedAt?: string;
  completedSuccessfully: boolean;
  duration: number; // seconds
  score?: number;
  insights?: string[]; // For therapeutic games
  moodBefore?: number;
  moodAfter?: number;
}

export interface GameProgress {
  gameId: string;
  timesPlayed: number;
  totalTimeSpent: number; // seconds
  bestScore?: number;
  lastPlayedAt?: string;
  unlocked: boolean;
  favorited: boolean;
}

export interface GameStats {
  totalGamesPlayed: number;
  totalTimeSpent: number;
  favoriteCategory?: GameCategory;
  currentStreak: number; // Days in a row
  longestStreak: number;
  lastPlayedAt?: string;
  categoryStats: Record<GameCategory, {
    timesPlayed: number;
    totalTime: number;
  }>;
}

// ============================================================================
// GAME DEFINITIONS
// ============================================================================

export const FOCUS_GAMES: GameDefinition[] = [
  {
    id: 'pixel_hunt',
    name: 'Pixel Hunt',
    description: 'Find subtle differences in two retro pixel scenes. Train your eye for detail.',
    category: 'focus',
    mentalBenefit: 'Attention to detail, visual processing',
    retroStyle: '8bit_sidescroll',
    estimatedMinutes: 5,
    difficulty: 'moderate',
  },
  {
    id: 'pattern_lock',
    name: 'Pattern Lock',
    description: 'Remember and repeat growing sequences. Build working memory.',
    category: 'focus',
    mentalBenefit: 'Working memory, sequential processing',
    retroStyle: 'pixel_cards',
    estimatedMinutes: 3,
    difficulty: 'gentle',
  },
  {
    id: 'word_stream',
    name: 'Word Stream',
    description: 'Tap target words as they scroll, ignore distractors. Practice selective attention.',
    category: 'focus',
    mentalBenefit: 'Selective attention, impulse control',
    retroStyle: '8bit_sidescroll',
    estimatedMinutes: 4,
    difficulty: 'moderate',
  },
  {
    id: 'color_sort',
    name: 'Color Sort',
    description: 'Quick categorize falling items by color and shape. Gentle pace, no stress.',
    category: 'focus',
    mentalBenefit: 'Processing speed, categorization',
    retroStyle: 'pixel_cards',
    estimatedMinutes: 5,
    difficulty: 'gentle',
  },
];

export const GROUNDING_GAMES: GameDefinition[] = [
  {
    id: '54321_quest',
    name: '5-4-3-2-1 Quest',
    description: 'Gamified sensory grounding - find 5 things you see, 4 you hear, 3 you feel...',
    category: 'grounding',
    mentalBenefit: 'Present-moment awareness, anxiety reduction',
    retroStyle: 'rpg_quest',
    estimatedMinutes: 5,
    difficulty: 'gentle',
  },
  {
    id: 'body_map',
    name: 'Body Map',
    description: 'Tap where you feel tension, watch it dissolve into pixels. Body awareness practice.',
    category: 'grounding',
    mentalBenefit: 'Interoception, tension release',
    retroStyle: 'pixel_cards',
    estimatedMinutes: 4,
    difficulty: 'gentle',
    requiresHaptics: true,
  },
  {
    id: 'earth_touch',
    name: 'Earth Touch',
    description: 'Haptic feedback rhythm game - feel the beat, sync with the earth.',
    category: 'grounding',
    mentalBenefit: 'Embodiment, rhythm regulation',
    retroStyle: 'lofi_aesthetic',
    estimatedMinutes: 3,
    difficulty: 'gentle',
    requiresHaptics: true,
    requiresSound: true,
  },
  {
    id: 'anchor_drop',
    name: 'Anchor Drop',
    description: 'Visualization game - dropping anchor to the present moment. Guide the anchor down.',
    category: 'grounding',
    mentalBenefit: 'Visualization, present-moment anchoring',
    retroStyle: '8bit_sidescroll',
    estimatedMinutes: 3,
    difficulty: 'gentle',
  },
];

export const RELAXATION_GAMES: GameDefinition[] = [
  {
    id: 'breath_waves',
    name: 'Breath Waves',
    description: 'Guide a pixel boat with your breath across calm ocean waves.',
    category: 'relaxation',
    mentalBenefit: 'Breath regulation, calm induction',
    retroStyle: '8bit_sidescroll',
    estimatedMinutes: 5,
    difficulty: 'gentle',
  },
  {
    id: 'cloud_garden',
    name: 'Cloud Garden',
    description: 'Slow-paced planting, watching things grow. No rush, just gentle tending.',
    category: 'relaxation',
    mentalBenefit: 'Patience, nurturing mindset',
    retroStyle: 'farming_sim',
    estimatedMinutes: 10,
    difficulty: 'gentle',
  },
  {
    id: 'rain_window',
    name: 'Rain Window',
    description: 'Watch and interact with rain on a pixel window. Lo-fi peaceful aesthetic.',
    category: 'relaxation',
    mentalBenefit: 'Ambient calm, sensory comfort',
    retroStyle: 'lofi_aesthetic',
    estimatedMinutes: 5,
    difficulty: 'gentle',
    requiresSound: true,
  },
  {
    id: 'star_connect',
    name: 'Star Connect',
    description: 'Slowly connect stars to make constellations. No time pressure.',
    category: 'relaxation',
    mentalBenefit: 'Meditative focus, completion satisfaction',
    retroStyle: 'night_sky',
    estimatedMinutes: 7,
    difficulty: 'gentle',
  },
];

export const KNOWLEDGE_GAMES: GameDefinition[] = [
  {
    id: 'emotion_explorer',
    name: 'Emotion Explorer',
    description: 'Learn to identify emotions from scenarios. Choose-your-adventure style.',
    category: 'knowledge',
    mentalBenefit: 'Emotional literacy, empathy building',
    retroStyle: 'rpg_quest',
    estimatedMinutes: 8,
    difficulty: 'moderate',
  },
  {
    id: 'coping_cards',
    name: 'Coping Cards',
    description: 'Match situations to healthy coping strategies. Memory match game.',
    category: 'knowledge',
    mentalBenefit: 'Coping skill knowledge, strategy recall',
    retroStyle: 'pixel_cards',
    estimatedMinutes: 5,
    difficulty: 'gentle',
  },
  {
    id: 'thought_bubbles',
    name: 'Thought Bubbles',
    description: 'Identify cognitive distortions in thought bubbles. Pop the unhelpful ones.',
    category: 'knowledge',
    mentalBenefit: 'Cognitive distortion recognition',
    retroStyle: 'pixel_cards',
    estimatedMinutes: 6,
    difficulty: 'moderate',
  },
  {
    id: 'body_signals',
    name: 'Body Signals',
    description: 'Learn what physical sensations mean emotionally. Body-mind connection.',
    category: 'knowledge',
    mentalBenefit: 'Interoceptive awareness, somatic education',
    retroStyle: 'pixel_cards',
    estimatedMinutes: 5,
    difficulty: 'gentle',
  },
];

export const WISDOM_GAMES: GameDefinition[] = [
  {
    id: 'perspective_shift',
    name: 'Perspective Shift',
    description: 'See same scenario from different viewpoints. Split-screen RPG style.',
    category: 'wisdom',
    mentalBenefit: 'Cognitive flexibility, empathy',
    retroStyle: 'rpg_quest',
    estimatedMinutes: 8,
    difficulty: 'moderate',
  },
  {
    id: 'future_self',
    name: 'Future Self',
    description: 'Make choices, see long-term pixel consequences. Time-travel adventure.',
    category: 'wisdom',
    mentalBenefit: 'Consequence awareness, future thinking',
    retroStyle: 'rpg_quest',
    estimatedMinutes: 10,
    difficulty: 'moderate',
  },
  {
    id: 'values_quest',
    name: 'Values Quest',
    description: 'Prioritize values in different scenarios. Resource management style.',
    category: 'wisdom',
    mentalBenefit: 'Values clarification, priority setting',
    retroStyle: 'rpg_quest',
    estimatedMinutes: 8,
    difficulty: 'moderate',
  },
  {
    id: 'the_pause',
    name: 'The Pause',
    description: 'Practice STOP technique gamified. Freeze-frame puzzle.',
    category: 'wisdom',
    mentalBenefit: 'Impulse control, mindful pause',
    retroStyle: 'pixel_cards',
    estimatedMinutes: 4,
    difficulty: 'gentle',
  },
];

export const LOGIC_THERAPEUTIC_GAMES: GameDefinition[] = [
  {
    id: 'thought_maze',
    name: 'Thought Maze',
    description: 'Navigate maze by answering "is this thought helpful?" Cognitive restructuring.',
    category: 'logic_therapeutic',
    mentalBenefit: 'Cognitive restructuring',
    retroStyle: 'dungeon_crawler',
    estimatedMinutes: 6,
    difficulty: 'moderate',
  },
  {
    id: 'chain_reaction',
    name: 'Chain Reaction',
    description: 'Connect cause to effect to feeling to behavior chains. See patterns.',
    category: 'logic_therapeutic',
    mentalBenefit: 'Understanding emotional patterns',
    retroStyle: 'circuit_board',
    estimatedMinutes: 5,
    difficulty: 'moderate',
  },
  {
    id: 'odd_one_out',
    name: 'Odd One Out',
    description: 'Find the unhelpful thought among helpful ones. Spot distortions.',
    category: 'logic_therapeutic',
    mentalBenefit: 'Cognitive distortion spotting',
    retroStyle: 'pixel_cards',
    estimatedMinutes: 4,
    difficulty: 'gentle',
  },
  {
    id: 'logic_gates',
    name: 'Logic Gates',
    description: 'If/then puzzles about emotions and responses. Build logical thinking.',
    category: 'logic_therapeutic',
    mentalBenefit: 'Conditional thinking',
    retroStyle: 'circuit_board',
    estimatedMinutes: 5,
    difficulty: 'moderate',
  },
  {
    id: 'sequence_builder',
    name: 'Sequence Builder',
    description: 'Put coping steps in the right order. Problem-solving practice.',
    category: 'logic_therapeutic',
    mentalBenefit: 'Problem-solving skills',
    retroStyle: 'pixel_cards',
    estimatedMinutes: 4,
    difficulty: 'gentle',
  },
  {
    id: 'balance_scale',
    name: 'Balance Scale',
    description: 'Weigh evidence for and against a worry. CBT evidence gathering.',
    category: 'logic_therapeutic',
    mentalBenefit: 'CBT evidence gathering',
    retroStyle: 'pixel_cards',
    estimatedMinutes: 5,
    difficulty: 'moderate',
  },
  {
    id: 'path_finder',
    name: 'Path Finder',
    description: 'Choose paths based on values, see outcomes. Decision making practice.',
    category: 'logic_therapeutic',
    mentalBenefit: 'Decision making',
    retroStyle: 'rpg_quest',
    estimatedMinutes: 7,
    difficulty: 'moderate',
  },
  {
    id: 'pattern_breaker',
    name: 'Pattern Breaker',
    description: 'Identify repeating unhelpful patterns, break the loop. Build awareness.',
    category: 'logic_therapeutic',
    mentalBenefit: 'Habit awareness',
    retroStyle: 'circuit_board',
    estimatedMinutes: 5,
    difficulty: 'moderate',
  },
  {
    id: 'reframe_puzzle',
    name: 'Reframe Puzzle',
    description: 'Rearrange word tiles to turn negative thoughts into neutral/positive ones.',
    category: 'logic_therapeutic',
    mentalBenefit: 'Cognitive reframing',
    retroStyle: 'word_tiles',
    estimatedMinutes: 5,
    difficulty: 'moderate',
  },
  {
    id: 'what_comes_next',
    name: 'What Comes Next?',
    description: 'Predict logical next step in emotional sequences. Build EQ.',
    category: 'logic_therapeutic',
    mentalBenefit: 'Emotional intelligence',
    retroStyle: 'pixel_cards',
    estimatedMinutes: 4,
    difficulty: 'moderate',
  },
];

export const LOGIC_CLASSIC_GAMES: GameDefinition[] = [
  {
    id: 'pixel_sudoku',
    name: 'Pixel Sudoku',
    description: 'Classic sudoku with calming pace. No timer, no pressure.',
    category: 'logic_classic',
    mentalBenefit: 'Logical reasoning, pattern recognition',
    retroStyle: 'grid_puzzle',
    estimatedMinutes: 15,
    difficulty: 'moderate',
  },
  {
    id: 'nonogram',
    name: 'Nonogram',
    description: 'Picture logic puzzles - reveal pixel art by solving the grid.',
    category: 'logic_classic',
    mentalBenefit: 'Deductive reasoning, patience',
    retroStyle: 'grid_puzzle',
    estimatedMinutes: 10,
    difficulty: 'moderate',
  },
  {
    id: 'minesweeper_zen',
    name: 'Minesweeper Zen',
    description: 'Slow-paced minesweeper with no timer. Safe, relaxing version.',
    category: 'logic_classic',
    mentalBenefit: 'Risk assessment, logical deduction',
    retroStyle: 'classic_windows',
    estimatedMinutes: 10,
    difficulty: 'gentle',
  },
  {
    id: 'tower_of_hanoi',
    name: 'Tower of Hanoi',
    description: 'Move discs between towers. Builds patience and planning.',
    category: 'logic_classic',
    mentalBenefit: 'Planning, patience, recursive thinking',
    retroStyle: 'pixel_cards',
    estimatedMinutes: 5,
    difficulty: 'moderate',
  },
];

// All games combined
export const ALL_GAMES: GameDefinition[] = [
  ...FOCUS_GAMES,
  ...GROUNDING_GAMES,
  ...RELAXATION_GAMES,
  ...KNOWLEDGE_GAMES,
  ...WISDOM_GAMES,
  ...LOGIC_THERAPEUTIC_GAMES,
  ...LOGIC_CLASSIC_GAMES,
];

// Category metadata
export const CATEGORY_INFO: Record<GameCategory, {
  label: string;
  emoji: string;
  description: string;
  color: string;
}> = {
  focus: {
    label: 'Focus',
    emoji: '🎯',
    description: 'Sharpen attention and concentration',
    color: '#8FAE8B', // sage
  },
  grounding: {
    label: 'Grounding',
    emoji: '🌍',
    description: 'Connect with the present moment',
    color: '#C4846C', // terracotta
  },
  relaxation: {
    label: 'Relaxation',
    emoji: '🌊',
    description: 'Calm your mind and body',
    color: '#A89BC4', // lavender
  },
  knowledge: {
    label: 'Knowledge',
    emoji: '📚',
    description: 'Learn about emotions and coping',
    color: '#9B8F82', // stone
  },
  wisdom: {
    label: 'Wisdom',
    emoji: '🦉',
    description: 'Gain perspective and insight',
    color: '#6B5D4D', // earth
  },
  logic_therapeutic: {
    label: 'Logic (Therapeutic)',
    emoji: '🧩',
    description: 'Restructure thoughts through puzzles',
    color: '#8FAE8B', // sage
  },
  logic_classic: {
    label: 'Logic (Classic)',
    emoji: '🎮',
    description: 'Brain training classics, calming pace',
    color: '#9B8F82', // stone
  },
};

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  GAME_PROGRESS: 'mood_leaf_game_progress',
  GAME_SESSIONS: 'mood_leaf_game_sessions',
  GAME_STATS: 'mood_leaf_game_stats',
};

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Get a game by ID
 */
export function getGameById(gameId: string): GameDefinition | undefined {
  return ALL_GAMES.find(g => g.id === gameId);
}

/**
 * Get games by category
 */
export function getGamesByCategory(category: GameCategory): GameDefinition[] {
  return ALL_GAMES.filter(g => g.category === category);
}

/**
 * Get all game progress
 */
export async function getGameProgress(): Promise<Record<string, GameProgress>> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.GAME_PROGRESS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading game progress:', error);
  }

  // Initialize progress for all games
  const initialProgress: Record<string, GameProgress> = {};
  for (const game of ALL_GAMES) {
    initialProgress[game.id] = {
      gameId: game.id,
      timesPlayed: 0,
      totalTimeSpent: 0,
      unlocked: game.unlockAfterPlays === undefined, // Unlocked if no requirement
      favorited: false,
    };
  }
  return initialProgress;
}

/**
 * Get progress for a single game
 */
export async function getProgressForGame(gameId: string): Promise<GameProgress | null> {
  const allProgress = await getGameProgress();
  return allProgress[gameId] || null;
}

/**
 * Record a game session
 */
export async function recordGameSession(session: GameSession): Promise<void> {
  try {
    // Update sessions list
    const sessionsStr = await AsyncStorage.getItem(STORAGE_KEYS.GAME_SESSIONS);
    const sessions: GameSession[] = sessionsStr ? JSON.parse(sessionsStr) : [];
    sessions.push(session);

    // Keep only last 100 sessions
    const trimmedSessions = sessions.slice(-100);
    await AsyncStorage.setItem(STORAGE_KEYS.GAME_SESSIONS, JSON.stringify(trimmedSessions));

    // Update progress
    const progress = await getGameProgress();
    const gameProgress = progress[session.gameId];
    if (gameProgress) {
      gameProgress.timesPlayed += 1;
      gameProgress.totalTimeSpent += session.duration;
      gameProgress.lastPlayedAt = session.endedAt || session.startedAt;
      if (session.score !== undefined) {
        gameProgress.bestScore = Math.max(gameProgress.bestScore || 0, session.score);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.GAME_PROGRESS, JSON.stringify(progress));
    }

    // Update stats
    await updateStats(session);
  } catch (error) {
    console.error('Error recording game session:', error);
  }
}

/**
 * Update overall game stats
 */
async function updateStats(session: GameSession): Promise<void> {
  try {
    const stats = await getGameStats();
    const game = getGameById(session.gameId);

    stats.totalGamesPlayed += 1;
    stats.totalTimeSpent += session.duration;
    stats.lastPlayedAt = session.endedAt || session.startedAt;

    if (game) {
      const categoryStats = stats.categoryStats[game.category];
      categoryStats.timesPlayed += 1;
      categoryStats.totalTime += session.duration;
    }

    // Update streak
    const today = new Date().toDateString();
    const lastPlayed = stats.lastPlayedAt ? new Date(stats.lastPlayedAt).toDateString() : null;

    if (lastPlayed === today) {
      // Already played today, streak unchanged
    } else if (lastPlayed) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastPlayed === yesterday.toDateString()) {
        stats.currentStreak += 1;
        stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
      } else {
        stats.currentStreak = 1;
      }
    } else {
      stats.currentStreak = 1;
    }

    // Find favorite category
    let maxPlays = 0;
    for (const [category, catStats] of Object.entries(stats.categoryStats)) {
      if (catStats.timesPlayed > maxPlays) {
        maxPlays = catStats.timesPlayed;
        stats.favoriteCategory = category as GameCategory;
      }
    }

    await AsyncStorage.setItem(STORAGE_KEYS.GAME_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Error updating game stats:', error);
  }
}

/**
 * Get overall game stats
 */
export async function getGameStats(): Promise<GameStats> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.GAME_STATS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading game stats:', error);
  }

  // Initialize stats
  const initialStats: GameStats = {
    totalGamesPlayed: 0,
    totalTimeSpent: 0,
    currentStreak: 0,
    longestStreak: 0,
    categoryStats: {
      focus: { timesPlayed: 0, totalTime: 0 },
      grounding: { timesPlayed: 0, totalTime: 0 },
      relaxation: { timesPlayed: 0, totalTime: 0 },
      knowledge: { timesPlayed: 0, totalTime: 0 },
      wisdom: { timesPlayed: 0, totalTime: 0 },
      logic_therapeutic: { timesPlayed: 0, totalTime: 0 },
      logic_classic: { timesPlayed: 0, totalTime: 0 },
    },
  };
  return initialStats;
}

/**
 * Toggle game favorite
 */
export async function toggleFavorite(gameId: string): Promise<boolean> {
  const progress = await getGameProgress();
  if (progress[gameId]) {
    progress[gameId].favorited = !progress[gameId].favorited;
    await AsyncStorage.setItem(STORAGE_KEYS.GAME_PROGRESS, JSON.stringify(progress));
    return progress[gameId].favorited;
  }
  return false;
}

/**
 * Get recent sessions
 */
export async function getRecentSessions(limit: number = 10): Promise<GameSession[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.GAME_SESSIONS);
    if (stored) {
      const sessions: GameSession[] = JSON.parse(stored);
      return sessions.slice(-limit).reverse();
    }
  } catch (error) {
    console.error('Error loading recent sessions:', error);
  }
  return [];
}

/**
 * Get favorited games
 */
export async function getFavoritedGames(): Promise<GameDefinition[]> {
  const progress = await getGameProgress();
  const favoritedIds = Object.values(progress)
    .filter(p => p.favorited)
    .map(p => p.gameId);

  return ALL_GAMES.filter(g => favoritedIds.includes(g.id));
}

/**
 * Get recommended games based on mood
 */
export function getRecommendedGames(
  moodLevel: number, // 1-10, 1 = very low, 10 = great
  needsFocus: boolean = false,
): GameDefinition[] {
  const recommendations: GameDefinition[] = [];

  if (moodLevel <= 3) {
    // Low mood: prioritize grounding and relaxation
    recommendations.push(...GROUNDING_GAMES.slice(0, 2));
    recommendations.push(...RELAXATION_GAMES.slice(0, 2));
  } else if (moodLevel <= 5) {
    // Neutral mood: mix of everything gentle
    recommendations.push(GROUNDING_GAMES[0]);
    recommendations.push(RELAXATION_GAMES[0]);
    recommendations.push(KNOWLEDGE_GAMES[0]);
    recommendations.push(LOGIC_CLASSIC_GAMES[2]); // Minesweeper Zen
  } else if (moodLevel <= 7) {
    // Good mood: can handle more cognitive load
    recommendations.push(KNOWLEDGE_GAMES[0]);
    recommendations.push(WISDOM_GAMES[0]);
    recommendations.push(LOGIC_THERAPEUTIC_GAMES[0]);
    recommendations.push(FOCUS_GAMES[0]);
  } else {
    // Great mood: full range available
    recommendations.push(WISDOM_GAMES[1]); // Future Self
    recommendations.push(LOGIC_THERAPEUTIC_GAMES[0]); // Thought Maze
    recommendations.push(FOCUS_GAMES[0]);
    recommendations.push(LOGIC_CLASSIC_GAMES[0]); // Sudoku
  }

  if (needsFocus) {
    // Add focus games to the front
    recommendations.unshift(...FOCUS_GAMES.slice(0, 2));
  }

  // Remove duplicates
  return [...new Map(recommendations.map(g => [g.id, g])).values()];
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
