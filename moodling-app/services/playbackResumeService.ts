/**
 * Playback Resume Service
 *
 * Tracks playback position for audio content (Sleep Stories, Old Time Radio)
 * so users can resume where they left off.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mood_leaf_playback_positions';
const HISTORY_KEY = 'mood_leaf_playback_history';

/**
 * Types of audio content
 */
export type ContentType = 'sleep_story' | 'old_time_radio';

/**
 * Playback position for a single item
 */
export interface PlaybackPosition {
  contentId: string;
  contentType: ContentType;
  title: string;
  author?: string; // For books
  show?: string; // For radio shows
  episodeTitle?: string; // For radio episodes
  positionSeconds: number;
  durationSeconds: number;
  lastPlayedAt: string; // ISO date
  completedAt?: string; // ISO date if finished
  sourceUrl?: string;
}

/**
 * Playback history entry
 */
export interface PlaybackHistoryEntry {
  contentId: string;
  contentType: ContentType;
  title: string;
  playedAt: string;
  durationPlayed: number; // seconds
}

/**
 * Resume info returned when starting playback
 */
export interface ResumeInfo {
  hasPosition: boolean;
  positionSeconds: number;
  percentComplete: number;
  lastPlayedAt: string | null;
}

// In-memory cache
let positionsCache: Record<string, PlaybackPosition> | null = null;

/**
 * Load all positions from storage
 */
async function loadPositions(): Promise<Record<string, PlaybackPosition>> {
  if (positionsCache) {
    return positionsCache;
  }

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    positionsCache = stored ? JSON.parse(stored) : {};
    return positionsCache;
  } catch (error) {
    console.error('[PlaybackResume] Failed to load positions:', error);
    positionsCache = {};
    return positionsCache;
  }
}

/**
 * Save positions to storage
 */
async function savePositions(positions: Record<string, PlaybackPosition>): Promise<void> {
  try {
    positionsCache = positions;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch (error) {
    console.error('[PlaybackResume] Failed to save positions:', error);
  }
}

/**
 * Generate a unique content ID
 */
function generateContentId(type: ContentType, title: string, episode?: string): string {
  const base = `${type}:${title.toLowerCase().replace(/\s+/g, '_')}`;
  if (episode) {
    return `${base}:${episode.toLowerCase().replace(/\s+/g, '_')}`;
  }
  return base;
}

/**
 * Save playback position
 */
export async function savePlaybackPosition(
  contentType: ContentType,
  title: string,
  positionSeconds: number,
  durationSeconds: number,
  options?: {
    author?: string;
    show?: string;
    episodeTitle?: string;
    sourceUrl?: string;
  }
): Promise<void> {
  const positions = await loadPositions();
  const contentId = generateContentId(
    contentType,
    title,
    options?.episodeTitle || options?.show
  );

  const existing = positions[contentId];
  const isCompleted = positionSeconds >= durationSeconds - 30; // Consider complete if within 30s of end

  positions[contentId] = {
    contentId,
    contentType,
    title,
    author: options?.author,
    show: options?.show,
    episodeTitle: options?.episodeTitle,
    positionSeconds: isCompleted ? 0 : positionSeconds, // Reset if completed
    durationSeconds,
    lastPlayedAt: new Date().toISOString(),
    completedAt: isCompleted ? new Date().toISOString() : existing?.completedAt,
    sourceUrl: options?.sourceUrl,
  };

  await savePositions(positions);

  // Also add to history
  await addToHistory(contentId, contentType, title, positionSeconds);
}

/**
 * Get playback position for content
 */
export async function getPlaybackPosition(
  contentType: ContentType,
  title: string,
  episodeOrShow?: string
): Promise<ResumeInfo> {
  const positions = await loadPositions();
  const contentId = generateContentId(contentType, title, episodeOrShow);
  const position = positions[contentId];

  if (!position || position.positionSeconds === 0) {
    return {
      hasPosition: false,
      positionSeconds: 0,
      percentComplete: 0,
      lastPlayedAt: null,
    };
  }

  return {
    hasPosition: true,
    positionSeconds: position.positionSeconds,
    percentComplete: Math.round((position.positionSeconds / position.durationSeconds) * 100),
    lastPlayedAt: position.lastPlayedAt,
  };
}

/**
 * Clear playback position for content (start fresh)
 */
export async function clearPlaybackPosition(
  contentType: ContentType,
  title: string,
  episodeOrShow?: string
): Promise<void> {
  const positions = await loadPositions();
  const contentId = generateContentId(contentType, title, episodeOrShow);

  if (positions[contentId]) {
    positions[contentId].positionSeconds = 0;
    await savePositions(positions);
  }
}

/**
 * Get all in-progress content (not completed)
 */
export async function getInProgressContent(
  contentType?: ContentType
): Promise<PlaybackPosition[]> {
  const positions = await loadPositions();

  return Object.values(positions)
    .filter(p => {
      const hasProgress = p.positionSeconds > 30; // At least 30s played
      const notComplete = !p.completedAt || p.positionSeconds > 0;
      const matchesType = !contentType || p.contentType === contentType;
      return hasProgress && notComplete && matchesType;
    })
    .sort((a, b) => new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime());
}

/**
 * Get recently completed content
 */
export async function getCompletedContent(
  contentType?: ContentType,
  limit: number = 10
): Promise<PlaybackPosition[]> {
  const positions = await loadPositions();

  return Object.values(positions)
    .filter(p => {
      const isCompleted = p.completedAt !== undefined;
      const matchesType = !contentType || p.contentType === contentType;
      return isCompleted && matchesType;
    })
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, limit);
}

/**
 * Get continue watching/listening list
 */
export async function getContinueListening(): Promise<{
  stories: PlaybackPosition[];
  radio: PlaybackPosition[];
}> {
  const inProgress = await getInProgressContent();

  return {
    stories: inProgress.filter(p => p.contentType === 'sleep_story').slice(0, 5),
    radio: inProgress.filter(p => p.contentType === 'old_time_radio').slice(0, 5),
  };
}

/**
 * Add entry to playback history
 */
async function addToHistory(
  contentId: string,
  contentType: ContentType,
  title: string,
  durationPlayed: number
): Promise<void> {
  try {
    const storedHistory = await AsyncStorage.getItem(HISTORY_KEY);
    const history: PlaybackHistoryEntry[] = storedHistory ? JSON.parse(storedHistory) : [];

    // Add new entry
    history.unshift({
      contentId,
      contentType,
      title,
      playedAt: new Date().toISOString(),
      durationPlayed,
    });

    // Keep last 100 entries
    const trimmedHistory = history.slice(0, 100);

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('[PlaybackResume] Failed to add to history:', error);
  }
}

/**
 * Get playback history
 */
export async function getPlaybackHistory(
  limit: number = 20
): Promise<PlaybackHistoryEntry[]> {
  try {
    const storedHistory = await AsyncStorage.getItem(HISTORY_KEY);
    const history: PlaybackHistoryEntry[] = storedHistory ? JSON.parse(storedHistory) : [];
    return history.slice(0, limit);
  } catch (error) {
    console.error('[PlaybackResume] Failed to get history:', error);
    return [];
  }
}

/**
 * Get total listening time in seconds
 */
export async function getTotalListeningTime(): Promise<number> {
  try {
    const history = await getPlaybackHistory(100);
    return history.reduce((total, entry) => total + entry.durationPlayed, 0);
  } catch (error) {
    console.error('[PlaybackResume] Failed to calculate total time:', error);
    return 0;
  }
}

/**
 * Format time for display (e.g., "1h 23m" or "45:30")
 */
export function formatPlaybackTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format resume message for display
 */
export function formatResumeMessage(info: ResumeInfo): string | null {
  if (!info.hasPosition) {
    return null;
  }

  const timeStr = formatPlaybackTime(info.positionSeconds);

  if (info.lastPlayedAt) {
    const lastPlayed = new Date(info.lastPlayedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Resume from ${timeStr} (${info.percentComplete}%)`;
    } else if (diffDays === 1) {
      return `Continue from yesterday at ${timeStr}`;
    } else {
      return `Pick up where you left off at ${timeStr}`;
    }
  }

  return `Resume from ${timeStr}`;
}

/**
 * Clear all playback data (for testing/reset)
 */
export async function clearAllPlaybackData(): Promise<void> {
  try {
    positionsCache = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('[PlaybackResume] Failed to clear data:', error);
  }
}

/**
 * Sample content for Sleep Stories
 */
export const SAMPLE_SLEEP_STORIES = [
  {
    id: 'alice_wonderland',
    title: 'Alice in Wonderland',
    author: 'Lewis Carroll',
    source: 'Project Gutenberg / Librivox',
    description: 'Follow Alice down the rabbit hole into a world of wonder.',
    durationMinutes: 180,
    chapters: 12,
  },
  {
    id: 'sherlock_study_scarlet',
    title: 'A Study in Scarlet',
    author: 'Arthur Conan Doyle',
    source: 'Project Gutenberg / Librivox',
    description: 'The first Sherlock Holmes story.',
    durationMinutes: 240,
    chapters: 14,
  },
  {
    id: 'pride_prejudice',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    source: 'Project Gutenberg / Librivox',
    description: 'The classic tale of Elizabeth Bennet and Mr. Darcy.',
    durationMinutes: 720,
    chapters: 61,
  },
  {
    id: 'time_machine',
    title: 'The Time Machine',
    author: 'H.G. Wells',
    source: 'Project Gutenberg / Librivox',
    description: 'Journey to the far future with the Time Traveller.',
    durationMinutes: 180,
    chapters: 12,
  },
  {
    id: 'wind_willows',
    title: 'The Wind in the Willows',
    author: 'Kenneth Grahame',
    source: 'Project Gutenberg / Librivox',
    description: 'Gentle tales of Mole, Rat, Toad, and Badger.',
    durationMinutes: 300,
    chapters: 12,
  },
];

/**
 * Sample content for Old Time Radio
 */
export const SAMPLE_OLD_TIME_RADIO = [
  {
    id: 'the_shadow',
    title: 'The Shadow',
    description: 'Who knows what evil lurks in the hearts of men?',
    source: 'Internet Archive',
    yearsActive: '1937-1954',
    episodes: [
      { title: 'The Death House Rescue', duration: 30 },
      { title: 'The Phantom Voice', duration: 30 },
      { title: 'Murder in E Flat', duration: 30 },
    ],
  },
  {
    id: 'suspense',
    title: 'Suspense',
    description: 'Tales calculated to keep you in... suspense.',
    source: 'Internet Archive',
    yearsActive: '1942-1962',
    episodes: [
      { title: 'Sorry, Wrong Number', duration: 30 },
      { title: 'Three Skeleton Key', duration: 30 },
      { title: 'The House in Cypress Canyon', duration: 30 },
    ],
  },
  {
    id: 'x_minus_one',
    title: 'X Minus One',
    description: 'Science fiction anthology from the golden age.',
    source: 'Internet Archive',
    yearsActive: '1955-1958',
    episodes: [
      { title: 'Nightfall', duration: 30 },
      { title: 'The Cold Equations', duration: 30 },
      { title: 'Mars Is Heaven', duration: 30 },
    ],
  },
  {
    id: 'dimension_x',
    title: 'Dimension X',
    description: 'Adventures in time and space, told in future tense.',
    source: 'Internet Archive',
    yearsActive: '1950-1951',
    episodes: [
      { title: 'The Martian Chronicles', duration: 30 },
      { title: 'Requiem', duration: 30 },
      { title: 'The Green Hills of Earth', duration: 30 },
    ],
  },
  {
    id: 'inner_sanctum',
    title: 'Inner Sanctum Mysteries',
    description: 'The creaking door opens to reveal tales of terror.',
    source: 'Internet Archive',
    yearsActive: '1941-1952',
    episodes: [
      { title: 'The Wailing Wall', duration: 30 },
      { title: 'Dead Man\'s Holiday', duration: 30 },
      { title: 'Voice on the Wire', duration: 30 },
    ],
  },
];
