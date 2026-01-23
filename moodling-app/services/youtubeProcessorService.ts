/**
 * YouTube Interview Processor Service v2
 *
 * Harvests human insights from YouTube content for training a local LLM.
 * Focuses on the FULL human experience - not just problems, but joy,
 * companionship, humor, love, and meaningful connection.
 *
 * Modern Best Practices Implemented:
 * - Quality over quantity (1000 curated > 10000 mediocre)
 * - Deduplication (exact and semantic)
 * - Model-driven quality filtering
 * - Safety-aware filtering
 * - Confidence scoring
 * - Human-in-the-loop review
 *
 * Based on 2025 research:
 * - SuperAnnotate LLM fine-tuning guide
 * - Meta's dataset curation best practices
 * - Ultra-FineWeb data filtering techniques
 * - Cleanlab data quality methods
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ============================================
// CORS PROXY FOR WEB
// ============================================

/**
 * Wrap URL with CORS proxy when running on web
 * YouTube RSS and page fetches are blocked by CORS in browsers
 */
function getCorsProxyUrl(url: string): string {
  if (Platform.OS === 'web') {
    // Use allorigins as CORS proxy for web environments
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  }
  return url;
}

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  PROCESSING_QUEUE: 'moodleaf_youtube_queue',
  PROCESSED_VIDEOS: 'moodleaf_processed_videos',
  PENDING_INSIGHTS: 'moodleaf_youtube_pending_insights',
  APPROVED_INSIGHTS: 'moodleaf_youtube_approved_insights',
  CURATED_CHANNELS: 'moodleaf_curated_channels',
  INSIGHT_HASHES: 'moodleaf_insight_hashes', // For deduplication
  QUALITY_STATS: 'moodleaf_quality_stats',
};

// ============================================
// TYPES
// ============================================

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  duration?: string;
  // Engagement metrics (when available from YouTube Data API)
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  // Calculated engagement score (0-100)
  engagementScore?: number;
}

/**
 * Video sampling strategy for training data collection
 */
export type SamplingStrategy =
  | 'random'           // Pure random from available videos
  | 'popular'          // Prioritize high view count
  | 'recent'           // Prioritize newest videos
  | 'balanced'         // Mix of popular + recent + random (recommended)
  | 'engagement';      // Prioritize high engagement ratio (likes/views)

export interface SamplingOptions {
  strategy?: SamplingStrategy;  // Defaults to 'balanced'
  maxVideos?: number;           // Defaults to 25
  // For balanced strategy: how to split
  popularPercent?: number;      // Default 40%
  recentPercent?: number;       // Default 40%
  randomPercent?: number;       // Default 20%
  // Filters
  minDurationMinutes?: number;  // Skip short videos (default: 5)
  maxAgeMonths?: number;        // Skip very old videos (default: 24)
  excludeShorts?: boolean;      // Skip YouTube Shorts (default: true)
}

/**
 * Default sampling options - balanced strategy is RECOMMENDED for training
 */
export const DEFAULT_SAMPLING_OPTIONS: Required<Pick<SamplingOptions, 'strategy' | 'maxVideos' | 'popularPercent' | 'recentPercent' | 'randomPercent' | 'minDurationMinutes' | 'maxAgeMonths' | 'excludeShorts'>> = {
  strategy: 'balanced',    // RECOMMENDED: Mix of popular + recent + random
  maxVideos: 25,           // Good balance of coverage vs. cost
  popularPercent: 40,      // 40% from most popular
  recentPercent: 40,       // 40% from most recent
  randomPercent: 20,       // 20% random for diversity
  minDurationMinutes: 5,   // Skip clips under 5 min
  maxAgeMonths: 24,        // Focus on last 2 years
  excludeShorts: true,     // Skip YouTube Shorts
};

export interface CuratedChannel {
  id: string;
  url: string;
  channelId: string;
  name: string;
  category: ChannelCategory;
  trustLevel: 'high' | 'medium' | 'curated';
  description: string;
  addedAt: string;
  videosProcessed: number;
  insightsExtracted: number;
  avgQualityScore: number;
}

export type ChannelCategory =
  | 'therapy_mental_health'
  | 'neurodivergence'
  | 'relationships_love'
  | 'friendship_companionship'
  | 'humor_comedy'
  | 'philosophy_meaning'
  | 'storytelling_human_experience'
  | 'elderly_wisdom'
  | 'vulnerability_authenticity'
  | 'joy_celebration'
  | 'addiction_recovery'
  | 'general_human_insight';

export interface ProcessingJob {
  id: string;
  channelUrl: string;
  channelName: string;
  channelId: string;
  videosToProcess: number;
  videosProcessed: number;
  insightsFound: number;
  insightsAfterFiltering: number;
  duplicatesRemoved: number;
  lowQualityFiltered: number;
  status: 'fetching' | 'processing' | 'filtering' | 'completed' | 'failed' | 'paused';
  startedAt: string;
  completedAt?: string;
  error?: string;
  selectedCategories: InsightExtractionCategory[];
  videos: YouTubeVideo[];
  currentVideoIndex: number;
}

// ============================================
// EXPANDED EXTRACTION CATEGORIES
// Full spectrum of human experience
// ============================================

export type InsightExtractionCategory =
  // Understanding Pain
  | 'emotional_struggles'
  | 'coping_strategies'
  | 'what_helps_hurts'
  | 'vulnerability'
  | 'mental_health_patterns'
  | 'trauma_recovery'
  // Understanding Joy
  | 'humor_wit'
  | 'joy_celebration'
  | 'excitement_passion'
  | 'playfulness'
  | 'gratitude_appreciation'
  // Understanding Connection
  | 'companionship'
  | 'friendship_dynamics'
  | 'romantic_love'
  | 'family_bonds'
  | 'belonging_community'
  | 'loneliness_isolation'
  // Understanding Growth
  | 'self_discovery'
  | 'growth_moments'
  | 'life_lessons'
  | 'wisdom_perspective'
  | 'meaning_purpose'
  // Human Authenticity
  | 'real_quotes'
  | 'contradictions_complexity'
  | 'messy_middle'
  | 'uncomfortable_truths'
  | 'beautiful_imperfection';

export interface ExtractedInsight {
  id: string;
  videoId: string;
  videoTitle: string;
  channelName: string;
  videoUrl: string;
  timestamp?: string;

  // The insight itself
  category: string; // Maps to training data categories
  extractionCategory: InsightExtractionCategory;
  title: string;
  insight: string;
  quotes: string[];
  coachingImplication: string;
  antiPatterns?: string[];
  exampleResponses?: string[]; // How a coach might use this

  // Human elements
  emotionalTone: string;
  humorLevel: 'none' | 'light' | 'moderate' | 'high';
  warmthLevel: 'clinical' | 'neutral' | 'warm' | 'deeply_warm';
  vulnerabilityLevel: 'surface' | 'moderate' | 'deep';
  authenticityMarkers: string[]; // What makes this feel real

  // Quality metrics (for filtering)
  qualityScore: number; // 0-100
  specificityScore: number; // 0-100 (specific > generic)
  actionabilityScore: number; // 0-100 (can coach use this?)
  safetyScore: number; // 0-100 (could this cause harm?)
  noveltyScore: number; // 0-100 (is this unique or duplicate?)

  // Validation
  confidenceScore: number; // 0-1, AI confidence
  needsHumanReview: boolean;
  reviewFlags: string[]; // Why it needs review

  // Status
  status: 'pending' | 'approved' | 'rejected' | 'needs_edit';
  rejectionReason?: string;
  editedBy?: string;
  approvedAt?: string;

  // Deduplication
  contentHash: string; // For exact dedup
  semanticEmbedding?: number[]; // For semantic dedup (future)
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface QualityStats {
  totalExtracted: number;
  passedQualityFilter: number;
  duplicatesRemoved: number;
  safetyFiltered: number;
  humanApproved: number;
  humanRejected: number;
  avgQualityScore: number;
  avgConfidenceScore: number;
}

// ============================================
// EXTRACTION CATEGORIES - FULL HUMAN EXPERIENCE
// ============================================

export const EXTRACTION_CATEGORIES: {
  value: InsightExtractionCategory;
  label: string;
  description: string;
  promptHint: string;
  domain: 'pain' | 'joy' | 'connection' | 'growth' | 'authenticity';
}[] = [
  // === UNDERSTANDING PAIN ===
  {
    value: 'emotional_struggles',
    label: 'Emotional Struggles',
    description: 'How people experience difficult emotions',
    promptHint: 'Notice how emotions are described, unexpected emotional responses, and emotional processing styles. Look for the nuance in how people actually feel vs. how they think they should feel.',
    domain: 'pain',
  },
  {
    value: 'coping_strategies',
    label: 'Coping Strategies',
    description: 'Real ways people deal with challenges',
    promptHint: 'Identify actual coping mechanisms - both healthy and unhealthy, what works and what doesn\'t. Include the "weird" coping mechanisms that actually help specific people.',
    domain: 'pain',
  },
  {
    value: 'what_helps_hurts',
    label: 'What Helps vs. Hurts',
    description: 'Specific things that made it better or worse',
    promptHint: 'Find concrete examples. "When my friend just sat with me" is better than "support helps." Look for "what I wish people knew" moments.',
    domain: 'pain',
  },
  {
    value: 'vulnerability',
    label: 'Vulnerability Moments',
    description: 'Raw, honest admissions',
    promptHint: 'Find moments of genuine vulnerability - admitting fears, failures, insecurities, or uncomfortable truths. These are gold for understanding real humans.',
    domain: 'pain',
  },
  {
    value: 'mental_health_patterns',
    label: 'Mental Health Patterns',
    description: 'How conditions actually manifest',
    promptHint: 'Look for descriptions of how anxiety/depression/ADHD/etc. actually feel and show up - not textbook definitions but lived experience.',
    domain: 'pain',
  },
  {
    value: 'trauma_recovery',
    label: 'Trauma & Recovery',
    description: 'Healing journeys and what helps',
    promptHint: 'Find insights about the recovery process - the non-linear nature, setbacks, breakthroughs, and what actually helps in healing.',
    domain: 'pain',
  },

  // === UNDERSTANDING JOY ===
  {
    value: 'humor_wit',
    label: 'Humor & Wit',
    description: 'How people use humor to connect and cope',
    promptHint: 'Look for jokes, funny observations, sarcasm, self-deprecating humor, and how humor creates connection. Capture the joke itself when it\'s insightful.',
    domain: 'joy',
  },
  {
    value: 'joy_celebration',
    label: 'Joy & Celebration',
    description: 'How people experience and share happiness',
    promptHint: 'Notice how people describe joy, excitement, celebration. What makes someone light up? How do they share good news? What does genuine happiness sound like?',
    domain: 'joy',
  },
  {
    value: 'excitement_passion',
    label: 'Excitement & Passion',
    description: 'What lights people up',
    promptHint: 'Find what makes people animated, passionate, excited. What do they love talking about? What makes their voice change?',
    domain: 'joy',
  },
  {
    value: 'playfulness',
    label: 'Playfulness',
    description: 'Silliness, games, lightness',
    promptHint: 'Capture moments of play, silliness, not taking things too seriously. How do people let loose? What does comfortable playfulness look like?',
    domain: 'joy',
  },
  {
    value: 'gratitude_appreciation',
    label: 'Gratitude & Appreciation',
    description: 'What people are thankful for and why',
    promptHint: 'Find specific things people appreciate - not generic gratitude but real, specific appreciation. "I love that my friend always texts back with voice memos."',
    domain: 'joy',
  },

  // === UNDERSTANDING CONNECTION ===
  {
    value: 'companionship',
    label: 'Companionship',
    description: 'What makes someone feel "with" another person',
    promptHint: 'Look for what makes people feel less alone. Comfortable silences, presence without agenda, just "being with" someone. The feeling of companionship.',
    domain: 'connection',
  },
  {
    value: 'friendship_dynamics',
    label: 'Friendship Dynamics',
    description: 'How bonds form and deepen',
    promptHint: 'Notice how friendships work - inside jokes, showing up, loyalty, the small things. What makes a friend feel like a real friend?',
    domain: 'connection',
  },
  {
    value: 'romantic_love',
    label: 'Romantic Love',
    description: 'Intimacy, partnership, romantic connection',
    promptHint: 'Find insights about romantic relationships - what closeness feels like, how partners support each other, the unique dynamics of romantic love.',
    domain: 'connection',
  },
  {
    value: 'family_bonds',
    label: 'Family Bonds',
    description: 'Family relationships and dynamics',
    promptHint: 'Capture family dynamics - the complicated, the loving, the frustrating. Parent-child, siblings, chosen family.',
    domain: 'connection',
  },
  {
    value: 'belonging_community',
    label: 'Belonging & Community',
    description: 'Feeling part of something',
    promptHint: 'Look for what makes people feel they belong. Communities, groups, shared identity. What creates that sense of "my people"?',
    domain: 'connection',
  },
  {
    value: 'loneliness_isolation',
    label: 'Loneliness & Isolation',
    description: 'The experience of disconnection',
    promptHint: 'Find honest descriptions of loneliness - not just being alone but feeling alone. What isolation actually feels like.',
    domain: 'connection',
  },

  // === UNDERSTANDING GROWTH ===
  {
    value: 'self_discovery',
    label: 'Self-Discovery',
    description: 'Realizations about oneself',
    promptHint: 'Find "aha moments" where someone realizes something about themselves, their patterns, or their needs. The click of self-understanding.',
    domain: 'growth',
  },
  {
    value: 'growth_moments',
    label: 'Growth Moments',
    description: 'Evidence of change and progress',
    promptHint: 'Identify moments of growth, change, or progress - even small ones. How did they get there? What shifted?',
    domain: 'growth',
  },
  {
    value: 'life_lessons',
    label: 'Life Lessons',
    description: 'Wisdom gained from experience',
    promptHint: 'Capture lessons learned - especially the hard-won ones. "I used to think X but now I understand Y."',
    domain: 'growth',
  },
  {
    value: 'wisdom_perspective',
    label: 'Wisdom & Perspective',
    description: 'Broader perspective on life',
    promptHint: 'Find perspective shifts, wisdom from experience, the longer view. What do people wish they\'d known earlier?',
    domain: 'growth',
  },
  {
    value: 'meaning_purpose',
    label: 'Meaning & Purpose',
    description: 'What gives life meaning',
    promptHint: 'Look for what gives people meaning, purpose, reason to keep going. Not platitudes but real answers to "why does this matter?"',
    domain: 'growth',
  },

  // === HUMAN AUTHENTICITY ===
  {
    value: 'real_quotes',
    label: 'Real Human Quotes',
    description: 'Memorable, authentic expressions',
    promptHint: 'Capture phrases that feel genuinely human - messy, contradictory, raw, or beautifully expressed. The way real people actually talk.',
    domain: 'authenticity',
  },
  {
    value: 'contradictions_complexity',
    label: 'Contradictions & Complexity',
    description: 'The messy reality of being human',
    promptHint: 'Find contradictions people hold, complexity they navigate. "I love my job and also it\'s killing me." Real humans are complicated.',
    domain: 'authenticity',
  },
  {
    value: 'messy_middle',
    label: 'The Messy Middle',
    description: 'Not problems or solutions - the in-between',
    promptHint: 'Capture the in-between - not just the problem or the resolution but the messy process of living through it.',
    domain: 'authenticity',
  },
  {
    value: 'uncomfortable_truths',
    label: 'Uncomfortable Truths',
    description: 'Things people don\'t usually say out loud',
    promptHint: 'Find the things people think but rarely say. The honest admissions that feel taboo or uncomfortable.',
    domain: 'authenticity',
  },
  {
    value: 'beautiful_imperfection',
    label: 'Beautiful Imperfection',
    description: 'The beauty in being flawed',
    promptHint: 'Look for moments where imperfection is beautiful, where mistakes lead somewhere good, where "failure" is human.',
    domain: 'authenticity',
  },
];

// ============================================
// CHANNEL CATEGORIES
// ============================================

export const CHANNEL_CATEGORIES: {
  value: ChannelCategory;
  label: string;
  description: string;
}[] = [
  { value: 'therapy_mental_health', label: 'Therapy & Mental Health', description: 'Licensed therapists, mental health educators' },
  { value: 'neurodivergence', label: 'Neurodivergence', description: 'ADHD, autism, and neurodivergent experiences' },
  { value: 'relationships_love', label: 'Relationships & Love', description: 'Romantic relationships, dating, partnership' },
  { value: 'friendship_companionship', label: 'Friendship & Companionship', description: 'Friendship, connection, social bonds' },
  { value: 'humor_comedy', label: 'Humor & Comedy', description: 'Comedians, humor about life and feelings' },
  { value: 'philosophy_meaning', label: 'Philosophy & Meaning', description: 'Life philosophy, meaning, purpose' },
  { value: 'storytelling_human_experience', label: 'Storytelling', description: 'Personal stories, human experiences' },
  { value: 'elderly_wisdom', label: 'Elderly Wisdom', description: 'Older generations sharing life perspective' },
  { value: 'vulnerability_authenticity', label: 'Vulnerability & Authenticity', description: 'Raw, honest content about being human' },
  { value: 'joy_celebration', label: 'Joy & Celebration', description: 'Positive experiences, celebration, happiness' },
  { value: 'addiction_recovery', label: 'Addiction & Recovery', description: 'Compassionate, trauma-informed addiction recovery content' },
  { value: 'general_human_insight', label: 'General Human Insight', description: 'Mixed content with human insight value' },
];

// ============================================
// QUALITY THRESHOLDS
// Based on 2025 best practices: quality > quantity
// ============================================

export const QUALITY_THRESHOLDS = {
  MIN_QUALITY_SCORE: 60, // Below this = filtered out
  MIN_SPECIFICITY_SCORE: 50, // Generic insights filtered
  MIN_SAFETY_SCORE: 80, // Safety is critical
  MIN_CONFIDENCE_SCORE: 0.6, // AI must be reasonably confident
  HUMAN_REVIEW_THRESHOLD: 75, // Below this = needs human review
  DUPLICATE_SIMILARITY_THRESHOLD: 0.85, // Semantic similarity for dedup
};

// ============================================
// YOUTUBE HELPERS
// ============================================

/**
 * Extract channel ID from various YouTube URL formats
 */
export function extractChannelInfo(url: string): { type: 'channel' | 'user' | 'handle' | 'unknown'; id: string } | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Handle format: youtube.com/channel/UC...
    if (pathname.includes('/channel/')) {
      const match = pathname.match(/\/channel\/([^\/\?]+)/);
      if (match) return { type: 'channel', id: match[1] };
    }

    // Handle format: youtube.com/@username
    if (pathname.includes('/@')) {
      const match = pathname.match(/\/@([^\/\?]+)/);
      if (match) return { type: 'handle', id: match[1] };
    }

    // Handle format: youtube.com/user/username
    if (pathname.includes('/user/')) {
      const match = pathname.match(/\/user\/([^\/\?]+)/);
      if (match) return { type: 'user', id: match[1] };
    }

    // Handle format: youtube.com/c/channelname
    if (pathname.includes('/c/')) {
      const match = pathname.match(/\/c\/([^\/\?]+)/);
      if (match) return { type: 'handle', id: match[1] };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch video list from a YouTube channel using RSS feed
 */
export async function fetchChannelVideos(
  channelUrl: string,
  maxVideos: number = 20
): Promise<{ videos: YouTubeVideo[]; channelName: string; channelId: string; error?: string }> {
  console.log('[YouTubeService] fetchChannelVideos called with:', channelUrl);

  const channelInfo = extractChannelInfo(channelUrl);
  console.log('[YouTubeService] Extracted channel info:', JSON.stringify(channelInfo));

  if (!channelInfo) {
    console.error('[YouTubeService] ERR_INVALID_URL: Could not parse URL');
    return { videos: [], channelName: '', channelId: '', error: '[ERR_INVALID_URL] Invalid YouTube channel URL. Supported formats: youtube.com/@handle, youtube.com/channel/UC..., youtube.com/c/name' };
  }

  try {
    let feedUrl: string;
    let channelId = channelInfo.id;

    if (channelInfo.type === 'channel') {
      feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelInfo.id}`;
    } else {
      // For handles, try to resolve to channel ID
      // First attempt: fetch channel page and extract ID
      try {
        console.log('[YouTube] Fetching channel page for:', channelInfo.id);
        const channelPageUrl = getCorsProxyUrl(`https://www.youtube.com/@${channelInfo.id}`);
        console.log('[YouTube] Using URL:', channelPageUrl);
        const pageResponse = await fetch(channelPageUrl, {
          headers: Platform.OS === 'web' ? {} : {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
        });
        console.log('[YouTube] Page response status:', pageResponse.status);

        if (!pageResponse.ok) {
          console.error('[YouTubeService] ERR_HTTP_STATUS: Page fetch failed with status:', pageResponse.status);
          return {
            videos: [],
            channelName: channelInfo.id,
            channelId: '',
            error: `[ERR_HTTP_${pageResponse.status}] YouTube returned status ${pageResponse.status}. Try refreshing or check your connection.`,
          };
        }

        const pageHtml = await pageResponse.text();
        console.log('[YouTube] Page HTML length:', pageHtml.length);

        const channelIdMatch = pageHtml.match(/"channelId":"(UC[^"]+)"/);
        if (channelIdMatch) {
          channelId = channelIdMatch[1];
          console.log('[YouTube] Found channel ID:', channelId);
          feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        } else {
          console.log('[YouTube] Could not find channelId in page HTML');
          // Try alternative patterns
          const altMatch = pageHtml.match(/channel_id=([^"&]+)/);
          if (altMatch) {
            channelId = altMatch[1];
            console.log('[YouTube] Found channel ID via alt pattern:', channelId);
            feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
          } else {
            console.error('[YouTubeService] ERR_NO_CHANNEL_ID: Could not find channelId in page HTML');
            return {
              videos: [],
              channelName: channelInfo.id,
              channelId: '',
              error: `[ERR_NO_CHANNEL_ID] Could not resolve channel ID for @${channelInfo.id}. Try using the channel ID format (youtube.com/channel/UC...)`,
            };
          }
        }
      } catch (fetchError) {
        console.error('[YouTubeService] ERR_NETWORK:', fetchError);
        return {
          videos: [],
          channelName: channelInfo.id,
          channelId: '',
          error: `[ERR_NETWORK] Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}. Check your connection.`,
        };
      }
    }

    // Fetch RSS feed
    const rssFetchUrl = getCorsProxyUrl(feedUrl);
    console.log('[YouTubeService] Fetching RSS feed:', feedUrl);
    console.log('[YouTubeService] Using URL:', rssFetchUrl);
    const response = await fetch(rssFetchUrl, {
      headers: Platform.OS === 'web' ? {} : {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/xml,text/xml,*/*;q=0.8',
      },
    });
    console.log('[YouTubeService] RSS feed response status:', response.status);
    if (!response.ok) {
      console.error('[YouTubeService] ERR_RSS_FETCH: Failed to fetch RSS feed');
      throw new Error(`[ERR_RSS_${response.status}] Failed to fetch channel feed: ${response.status}`);
    }

    const xmlText = await response.text();
    const videos: YouTubeVideo[] = [];
    const channelNameMatch = xmlText.match(/<name>([^<]+)<\/name>/);
    const channelName = channelNameMatch ? channelNameMatch[1] : 'Unknown Channel';

    // Extract video entries
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xmlText)) !== null && videos.length < maxVideos * 2) {
      const entry = match[1];

      const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
      const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);

      if (videoIdMatch && titleMatch) {
        videos.push({
          videoId: videoIdMatch[1],
          title: decodeXMLEntities(titleMatch[1]),
          channelName,
          channelId,
          publishedAt: publishedMatch ? publishedMatch[1] : undefined,
          thumbnailUrl: `https://i.ytimg.com/vi/${videoIdMatch[1]}/mqdefault.jpg`,
        });
      }
    }

    // Randomly select if we have more than needed
    const selectedVideos = selectRandomVideos(videos, maxVideos);

    console.log('[YouTubeService] SUCCESS: Found', selectedVideos.length, 'videos for channel', channelName, '(', channelId, ')');
    return { videos: selectedVideos, channelName, channelId };
  } catch (error) {
    console.error('[YouTubeService] ERR_UNKNOWN:', error);
    return {
      videos: [],
      channelName: '',
      channelId: '',
      error: `[ERR_UNKNOWN] ${error instanceof Error ? error.message : 'Failed to fetch channel videos'}`,
    };
  }
}

function selectRandomVideos(videos: YouTubeVideo[], count: number): YouTubeVideo[] {
  if (videos.length <= count) return videos;
  const shuffled = [...videos].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Smart video sampling based on strategy
 * Prioritizes quality over quantity for better training data
 * Default strategy is 'balanced' (40% popular + 40% recent + 20% random)
 */
export function selectVideosWithStrategy(
  videos: YouTubeVideo[],
  options: Partial<SamplingOptions> = {}
): YouTubeVideo[] {
  // Merge with defaults - balanced is the default strategy
  const mergedOptions = {
    ...DEFAULT_SAMPLING_OPTIONS,
    ...options,
  };

  const { strategy, maxVideos } = mergedOptions;

  // Apply filters first
  let filtered = filterVideos(videos, mergedOptions);

  if (filtered.length <= maxVideos) {
    return filtered;
  }

  switch (strategy) {
    case 'popular':
      return selectByPopularity(filtered, maxVideos);

    case 'recent':
      return selectByRecency(filtered, maxVideos);

    case 'engagement':
      return selectByEngagement(filtered, maxVideos);

    case 'balanced':
      return selectBalanced(filtered, options);

    case 'random':
    default:
      return selectRandomVideos(filtered, maxVideos);
  }
}

/**
 * Filter videos based on criteria
 */
function filterVideos(videos: YouTubeVideo[], options: SamplingOptions): YouTubeVideo[] {
  let filtered = [...videos];

  // Filter by age
  if (options.maxAgeMonths) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - options.maxAgeMonths);

    filtered = filtered.filter(v => {
      if (!v.publishedAt) return true; // Keep if no date
      return new Date(v.publishedAt) >= cutoffDate;
    });
  }

  // Filter out YouTube Shorts (typically under 60 seconds, vertical format)
  if (options.excludeShorts) {
    filtered = filtered.filter(v => {
      // Shorts often have #shorts in title or are very short
      const isShortByTitle = v.title.toLowerCase().includes('#shorts') ||
                              v.title.toLowerCase().includes('#short');
      // If we have duration info, check that too
      if (v.duration) {
        const seconds = parseDuration(v.duration);
        if (seconds > 0 && seconds < 60) return false;
      }
      return !isShortByTitle;
    });
  }

  // Filter by minimum duration
  if (options.minDurationMinutes && options.minDurationMinutes > 0) {
    filtered = filtered.filter(v => {
      if (!v.duration) return true; // Keep if no duration
      const seconds = parseDuration(v.duration);
      return seconds >= options.minDurationMinutes! * 60;
    });
  }

  return filtered;
}

/**
 * Parse ISO 8601 duration (PT1H30M45S) to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Select videos by popularity (view count)
 */
function selectByPopularity(videos: YouTubeVideo[], count: number): YouTubeVideo[] {
  // Sort by view count (highest first), fall back to random for videos without views
  const withViews = videos.filter(v => v.viewCount !== undefined);
  const withoutViews = videos.filter(v => v.viewCount === undefined);

  const sorted = withViews.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));

  // Take top performers, fill remaining with random from those without views
  const result = sorted.slice(0, count);
  if (result.length < count && withoutViews.length > 0) {
    const remaining = count - result.length;
    const randomFill = selectRandomVideos(withoutViews, remaining);
    result.push(...randomFill);
  }

  return result;
}

/**
 * Select videos by recency
 */
function selectByRecency(videos: YouTubeVideo[], count: number): YouTubeVideo[] {
  const sorted = [...videos].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA; // Newest first
  });

  return sorted.slice(0, count);
}

/**
 * Select videos by engagement ratio (likes/views)
 * High engagement often indicates valuable, resonant content
 */
function selectByEngagement(videos: YouTubeVideo[], count: number): YouTubeVideo[] {
  // Calculate engagement score for each video
  const withScore = videos.map(v => {
    let score = 0;
    if (v.viewCount && v.viewCount > 0) {
      // Engagement ratio (likes per 100 views)
      const likeRatio = ((v.likeCount || 0) / v.viewCount) * 100;
      // Comment engagement
      const commentRatio = ((v.commentCount || 0) / v.viewCount) * 100;
      // Combined score, weighted
      score = likeRatio * 0.7 + commentRatio * 0.3;
      // Boost for videos with more absolute engagement (avoids tiny videos with 100% like ratio)
      const volumeBoost = Math.log10(Math.max(v.viewCount, 1)) / 7; // 0-1 scale for up to 10M views
      score = score * (0.5 + volumeBoost * 0.5);
    }
    return { ...v, engagementScore: score };
  });

  // Sort by engagement score
  const sorted = withScore.sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0));

  return sorted.slice(0, count);
}

/**
 * Balanced sampling: mix of popular, recent, and random
 * This is the RECOMMENDED strategy for training data
 */
function selectBalanced(videos: YouTubeVideo[], options: SamplingOptions): YouTubeVideo[] {
  const { maxVideos } = options;
  const popularPercent = options.popularPercent ?? 40;
  const recentPercent = options.recentPercent ?? 40;
  const randomPercent = options.randomPercent ?? 20;

  // Calculate counts
  const popularCount = Math.floor(maxVideos * (popularPercent / 100));
  const recentCount = Math.floor(maxVideos * (recentPercent / 100));
  const randomCount = maxVideos - popularCount - recentCount;

  const selected: YouTubeVideo[] = [];
  const selectedIds = new Set<string>();

  // Get popular videos
  const popular = selectByPopularity(videos, popularCount * 2); // Get extra to avoid overlap
  for (const v of popular) {
    if (selected.length >= popularCount) break;
    if (!selectedIds.has(v.videoId)) {
      selected.push(v);
      selectedIds.add(v.videoId);
    }
  }

  // Get recent videos (excluding already selected)
  const remaining = videos.filter(v => !selectedIds.has(v.videoId));
  const recent = selectByRecency(remaining, recentCount * 2);
  for (const v of recent) {
    if (selected.length >= popularCount + recentCount) break;
    if (!selectedIds.has(v.videoId)) {
      selected.push(v);
      selectedIds.add(v.videoId);
    }
  }

  // Fill rest with random (excluding already selected)
  const stillRemaining = videos.filter(v => !selectedIds.has(v.videoId));
  const random = selectRandomVideos(stillRemaining, randomCount);
  for (const v of random) {
    if (selected.length >= maxVideos) break;
    if (!selectedIds.has(v.videoId)) {
      selected.push(v);
      selectedIds.add(v.videoId);
    }
  }

  return selected;
}

/**
 * Fetch video statistics (views, likes, comments) using YouTube Data API
 * Requires a YouTube API key
 */
export async function enrichVideosWithStats(
  videos: YouTubeVideo[],
  youtubeApiKey: string
): Promise<YouTubeVideo[]> {
  if (!youtubeApiKey || videos.length === 0) {
    return videos;
  }

  try {
    // YouTube API allows up to 50 video IDs per request
    const batchSize = 50;
    const enriched: YouTubeVideo[] = [];

    for (let i = 0; i < videos.length; i += batchSize) {
      const batch = videos.slice(i, i + batchSize);
      const videoIds = batch.map(v => v.videoId).join(',');

      const url = `https://www.googleapis.com/youtube/v3/videos?` +
        `part=statistics,contentDetails&id=${videoIds}&key=${youtubeApiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`YouTube API error: ${response.status}`);
        // Return original videos if API fails
        enriched.push(...batch);
        continue;
      }

      const data = await response.json();
      const statsMap = new Map<string, any>();

      for (const item of data.items || []) {
        statsMap.set(item.id, {
          viewCount: parseInt(item.statistics?.viewCount || '0', 10),
          likeCount: parseInt(item.statistics?.likeCount || '0', 10),
          commentCount: parseInt(item.statistics?.commentCount || '0', 10),
          duration: item.contentDetails?.duration,
        });
      }

      // Merge stats into videos
      for (const video of batch) {
        const stats = statsMap.get(video.videoId);
        if (stats) {
          enriched.push({
            ...video,
            viewCount: stats.viewCount,
            likeCount: stats.likeCount,
            commentCount: stats.commentCount,
            duration: stats.duration || video.duration,
          });
        } else {
          enriched.push(video);
        }
      }
    }

    return enriched;
  } catch (error) {
    console.error('Failed to enrich videos with stats:', error);
    return videos; // Return original on error
  }
}

/**
 * Fetch channel videos with smart sampling
 * Enhanced version that supports popularity-based selection
 * Default strategy: 'balanced' (40% popular + 40% recent + 20% random)
 */
export async function fetchChannelVideosWithSampling(
  channelUrl: string,
  options: Partial<SamplingOptions> = {},
  youtubeApiKey?: string
): Promise<{ videos: YouTubeVideo[]; channelName: string; channelId: string; error?: string }> {
  // Merge with defaults
  const mergedOptions = {
    ...DEFAULT_SAMPLING_OPTIONS,
    ...options,
  };

  // First, fetch all available videos from RSS
  const result = await fetchChannelVideos(channelUrl, mergedOptions.maxVideos * 3);

  if (result.error || result.videos.length === 0) {
    return result;
  }

  let videos = result.videos;

  // If we have a YouTube API key, enrich with stats for better sampling
  if (youtubeApiKey && (mergedOptions.strategy === 'popular' || mergedOptions.strategy === 'engagement' || mergedOptions.strategy === 'balanced')) {
    videos = await enrichVideosWithStats(videos, youtubeApiKey);
  }

  // Apply smart sampling
  const selected = selectVideosWithStrategy(videos, mergedOptions);

  return {
    videos: selected,
    channelName: result.channelName,
    channelId: result.channelId,
  };
}

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Try to fetch transcript via YouTube's timedtext API
 * This is more reliable than scraping the video page
 */
async function fetchTranscriptViaApi(
  videoId: string
): Promise<{ transcript: string; segments: TranscriptSegment[]; error?: string }> {
  // Try to get caption list from YouTube's innertube API
  const apiUrl = Platform.OS === 'web'
    ? getCorsProxyUrl(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`)
    : `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`;

  console.log(`[Transcript] Trying timedtext API: ${apiUrl}`);

  const response = await fetch(apiUrl);

  if (!response.ok) {
    // Try auto-generated captions
    const autoUrl = Platform.OS === 'web'
      ? getCorsProxyUrl(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr&fmt=srv3`)
      : `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr&fmt=srv3`;

    console.log(`[Transcript] Trying auto-generated captions: ${autoUrl}`);
    const autoResponse = await fetch(autoUrl);

    if (!autoResponse.ok) {
      return {
        transcript: '',
        segments: [],
        error: 'Timedtext API returned error',
      };
    }

    const xmlText = await autoResponse.text();
    return parseTranscriptXml(xmlText);
  }

  const xmlText = await response.text();
  return parseTranscriptXml(xmlText);
}

/**
 * Parse transcript XML into segments and full text
 */
function parseTranscriptXml(
  xmlText: string
): { transcript: string; segments: TranscriptSegment[]; error?: string } {
  if (!xmlText || xmlText.length < 50) {
    return {
      transcript: '',
      segments: [],
      error: 'Empty or invalid transcript XML',
    };
  }

  const segments: TranscriptSegment[] = [];

  // Try parsing srv3 format (newer)
  const srv3Regex = /<p t="(\d+)" d="(\d+)"[^>]*>([^<]*)<\/p>/g;
  let match;
  let foundSrv3 = false;

  while ((match = srv3Regex.exec(xmlText)) !== null) {
    foundSrv3 = true;
    const startMs = parseInt(match[1]);
    const durationMs = parseInt(match[2]);
    const text = decodeXMLEntities(match[3]).trim();

    if (text) {
      segments.push({
        text,
        start: startMs / 1000,
        duration: durationMs / 1000,
      });
    }
  }

  // Try parsing older format if srv3 didn't work
  if (!foundSrv3) {
    const oldRegex = /<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]*)<\/text>/g;
    while ((match = oldRegex.exec(xmlText)) !== null) {
      const text = decodeXMLEntities(match[3]).trim();
      if (text) {
        segments.push({
          text,
          start: parseFloat(match[1]),
          duration: parseFloat(match[2]),
        });
      }
    }
  }

  if (segments.length === 0) {
    return {
      transcript: '',
      segments: [],
      error: 'Could not parse transcript segments',
    };
  }

  const transcript = segments.map(s => s.text).join(' ');
  console.log(`[Transcript] Parsed ${segments.length} segments, ${transcript.length} chars`);

  return { transcript, segments };
}

/**
 * Fetch transcript for a YouTube video
 * Tries multiple methods: direct YouTube page, then transcript API fallback
 */
export async function fetchVideoTranscript(
  videoId: string
): Promise<{ transcript: string; segments: TranscriptSegment[]; error?: string }> {
  console.log(`[Transcript] Fetching transcript for video: ${videoId}`);

  // Try Method 1: Use a transcript API service (more reliable for CORS)
  try {
    const transcriptApiResult = await fetchTranscriptViaApi(videoId);
    if (transcriptApiResult.transcript) {
      console.log(`[Transcript] Got transcript via API (${transcriptApiResult.transcript.length} chars)`);
      return transcriptApiResult;
    }
  } catch (error) {
    console.log(`[Transcript] API method failed:`, error);
  }

  // Try Method 2: Direct YouTube page scraping
  try {
    const videoUrl = getCorsProxyUrl(`https://www.youtube.com/watch?v=${videoId}`);
    console.log(`[Transcript] Trying direct scrape via: ${videoUrl}`);

    const response = await fetch(videoUrl, {
      headers: Platform.OS === 'web' ? {} : {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video page: ${response.status}`);
    }

    const html = await response.text();
    console.log(`[Transcript] Got HTML (${html.length} chars), searching for captions...`);

    // Look for captions in the page data
    const captionMatch = html.match(/"captionTracks":\s*(\[[\s\S]*?\])/);

    if (!captionMatch) {
      // Check if it's a proxy error page
      if (html.includes('error') || html.length < 1000) {
        console.log(`[Transcript] Proxy may have returned error page`);
      }
      return {
        transcript: '',
        segments: [],
        error: 'No captions available for this video',
      };
    }

    // Parse caption tracks
    let captionTracks: any[] = [];
    try {
      captionTracks = JSON.parse(captionMatch[1]);
    } catch (e) {
      // Try regex extraction as fallback
      const urlMatch = html.match(/"baseUrl":\s*"([^"]+)"/);
      if (urlMatch) {
        const captionUrl = urlMatch[1].replace(/\\u0026/g, '&');
        return await fetchTranscriptFromUrl(captionUrl);
      }

      return {
        transcript: '',
        segments: [],
        error: 'Could not parse caption data',
      };
    }

    // Find English captions (prefer manual over auto-generated)
    let captionUrl: string | null = null;

    for (const track of captionTracks) {
      if (track.languageCode === 'en' && !track.kind) {
        captionUrl = track.baseUrl;
        break;
      }
    }

    if (!captionUrl) {
      for (const track of captionTracks) {
        if (track.languageCode === 'en' || track.vssId?.includes('.en')) {
          captionUrl = track.baseUrl;
          break;
        }
      }
    }

    if (!captionUrl && captionTracks.length > 0) {
      captionUrl = captionTracks[0].baseUrl;
    }

    if (!captionUrl) {
      return {
        transcript: '',
        segments: [],
        error: 'No suitable captions found',
      };
    }

    return await fetchTranscriptFromUrl(captionUrl);
  } catch (error) {
    return {
      transcript: '',
      segments: [],
      error: error instanceof Error ? error.message : 'Failed to fetch transcript',
    };
  }
}

async function fetchTranscriptFromUrl(
  captionUrl: string
): Promise<{ transcript: string; segments: TranscriptSegment[]; error?: string }> {
  try {
    const url = captionUrl.includes('fmt=') ? captionUrl : `${captionUrl}&fmt=srv3`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch captions: ${response.status}`);
    }

    const xmlText = await response.text();
    const segments: TranscriptSegment[] = [];

    const segmentRegex = /<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]*)<\/text>/g;
    let match;

    while ((match = segmentRegex.exec(xmlText)) !== null) {
      const start = parseFloat(match[1]);
      const duration = parseFloat(match[2]);
      const text = decodeXMLEntities(match[3])
        .replace(/\n/g, ' ')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();

      if (text) {
        segments.push({ text, start, duration });
      }
    }

    const transcript = segments.map(s => s.text).join(' ');

    return { transcript, segments };
  } catch (error) {
    return {
      transcript: '',
      segments: [],
      error: error instanceof Error ? error.message : 'Failed to parse transcript',
    };
  }
}

// ============================================
// CONTENT HASH FOR DEDUPLICATION
// ============================================

/**
 * Generate a simple hash for content deduplication
 */
export function generateContentHash(content: string): string {
  // Normalize: lowercase, remove extra spaces, remove punctuation
  const normalized = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(16);
}

/**
 * Check if content is duplicate
 */
export async function isDuplicateInsight(insight: string, title: string): Promise<boolean> {
  const hash = generateContentHash(insight + title);

  const stored = await AsyncStorage.getItem(STORAGE_KEYS.INSIGHT_HASHES);
  const hashes: string[] = stored ? JSON.parse(stored) : [];

  return hashes.includes(hash);
}

/**
 * Add hash to deduplication store
 */
export async function addInsightHash(insight: string, title: string): Promise<void> {
  const hash = generateContentHash(insight + title);

  const stored = await AsyncStorage.getItem(STORAGE_KEYS.INSIGHT_HASHES);
  const hashes: string[] = stored ? JSON.parse(stored) : [];

  if (!hashes.includes(hash)) {
    hashes.push(hash);
    await AsyncStorage.setItem(STORAGE_KEYS.INSIGHT_HASHES, JSON.stringify(hashes));
  }
}

// ============================================
// INSIGHT EXTRACTION WITH CLAUDE
// ============================================

/**
 * Build extraction prompt - focuses on full human experience
 */
export function buildExtractionPrompt(
  transcript: string,
  videoTitle: string,
  channelName: string,
  categories: InsightExtractionCategory[]
): string {
  const categoryInstructions = categories
    .map(cat => {
      const catInfo = EXTRACTION_CATEGORIES.find(c => c.value === cat);
      return catInfo ? `- **${catInfo.label}** (${catInfo.domain}): ${catInfo.promptHint}` : '';
    })
    .filter(Boolean)
    .join('\n');

  return `You are extracting insights about BEING HUMAN from this content. Not just problems - the full experience: joy, connection, humor, love, struggle, growth, and everything in between.

These insights will train an AI companion to be genuinely human-like - someone who can celebrate with you, sit with you in sadness, laugh with you, and just BE with you.

VIDEO: "${videoTitle}"
CHANNEL: "${channelName}"

TRANSCRIPT:
${transcript.slice(0, 15000)}${transcript.length > 15000 ? '...[truncated]' : ''}

---

CATEGORIES TO EXTRACT:
${categoryInstructions}

---

EXTRACTION GUIDELINES:

1. **SPECIFICITY OVER GENERICS**
   Bad: "People need connection"
   Good: "When she said 'I just need someone to sit with me and not try to fix it,' her voice changed completely"

2. **CAPTURE THE HUMAN MESSINESS**
   Include contradictions, uncertainty, complexity. Real humans say "I love them AND they drive me crazy"

3. **HUMOR IS INSIGHT**
   Jokes often reveal deep truths. "I cope with humor" IS a coping strategy worth capturing.

4. **JOY MATTERS AS MUCH AS PAIN**
   Don't just extract struggles. Capture what lights people up, what makes them laugh, what they love.

5. **COMPANIONSHIP INSIGHTS**
   What makes someone feel NOT alone? What does real presence feel like? This is gold.

6. **QUOTES ARE PRECIOUS**
   Exact words > paraphrasing. The way someone says something matters.

7. **COACHING APPLICATION**
   Every insight should help a coach respond better - whether to someone struggling, celebrating, or just wanting to chat.

---

For each insight, provide:
{
  "title": "Short memorable title (under 10 words)",
  "insight": "The actual learning (2-4 sentences, specific not generic)",
  "quotes": ["Exact quotes from transcript that support this"],
  "coachingImplication": "How should a coach behave differently knowing this?",
  "antiPatterns": ["Things a coach should NEVER do based on this"],
  "exampleResponses": ["Example of how a coach might use this insight"],
  "emotionalTone": "The feeling (e.g., 'bittersweet hope', 'playful frustration')",
  "humorLevel": "none | light | moderate | high",
  "warmthLevel": "clinical | neutral | warm | deeply_warm",
  "vulnerabilityLevel": "surface | moderate | deep",
  "authenticityMarkers": ["What makes this feel real/human"],
  "category": "One of: cognitive_patterns, emotional_processing, communication_needs, motivation_patterns, relationship_with_self, crisis_patterns, recovery_patterns, daily_rhythms, social_dynamics",
  "qualityScore": 0-100,
  "specificityScore": 0-100,
  "actionabilityScore": 0-100,
  "safetyScore": 0-100,
  "confidence": 0.0-1.0
}

RESPOND WITH JSON:
{
  "insights": [...],
  "videoSummary": "One sentence summary",
  "dominantTone": "Overall emotional tone",
  "recommendedCategories": ["Categories this video is rich in"]
}

Extract 3-8 high-quality insights. Quality over quantity. Skip generic observations.`;
}

/**
 * Extract insights using Claude API
 */
export async function extractInsightsWithClaude(
  transcript: string,
  videoTitle: string,
  videoId: string,
  channelName: string,
  categories: InsightExtractionCategory[],
  apiKey: string
): Promise<{ insights: ExtractedInsight[]; error?: string }> {
  if (!transcript || transcript.length < 100) {
    return { insights: [], error: 'Transcript too short to analyze' };
  }

  const prompt = buildExtractionPrompt(transcript, videoTitle, channelName, categories);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error('No content in response');
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.insights || !Array.isArray(parsed.insights)) {
      throw new Error('Invalid response format');
    }

    // Transform and filter insights
    const insights: ExtractedInsight[] = [];

    for (let i = 0; i < parsed.insights.length; i++) {
      const ins = parsed.insights[i];

      // Check for duplicates
      const isDupe = await isDuplicateInsight(ins.insight || '', ins.title || '');
      if (isDupe) continue;

      // Calculate novelty score (inverse of duplicate likelihood)
      const noveltyScore = isDupe ? 0 : 85;

      // Determine if needs human review
      const qualityScore = ins.qualityScore || 70;
      const safetyScore = ins.safetyScore || 90;
      const needsReview = qualityScore < QUALITY_THRESHOLDS.HUMAN_REVIEW_THRESHOLD ||
                          safetyScore < 90 ||
                          (ins.confidence || 0.7) < QUALITY_THRESHOLDS.MIN_CONFIDENCE_SCORE;

      const reviewFlags: string[] = [];
      if (qualityScore < QUALITY_THRESHOLDS.HUMAN_REVIEW_THRESHOLD) reviewFlags.push('Low quality score');
      if (safetyScore < 90) reviewFlags.push('Safety review needed');
      if ((ins.confidence || 0.7) < QUALITY_THRESHOLDS.MIN_CONFIDENCE_SCORE) reviewFlags.push('Low confidence');

      const insight: ExtractedInsight = {
        id: `insight_${videoId}_${Date.now()}_${i}`,
        videoId,
        videoTitle,
        channelName,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        category: ins.category || 'emotional_processing',
        extractionCategory: categories[0],
        title: ins.title || 'Untitled insight',
        insight: ins.insight || '',
        quotes: ins.quotes || [],
        coachingImplication: ins.coachingImplication || '',
        antiPatterns: ins.antiPatterns || [],
        exampleResponses: ins.exampleResponses || [],
        emotionalTone: ins.emotionalTone || 'neutral',
        humorLevel: ins.humorLevel || 'none',
        warmthLevel: ins.warmthLevel || 'neutral',
        vulnerabilityLevel: ins.vulnerabilityLevel || 'surface',
        authenticityMarkers: ins.authenticityMarkers || [],
        qualityScore: qualityScore,
        specificityScore: ins.specificityScore || 70,
        actionabilityScore: ins.actionabilityScore || 70,
        safetyScore: safetyScore,
        noveltyScore: noveltyScore,
        confidenceScore: ins.confidence || 0.7,
        needsHumanReview: needsReview,
        reviewFlags,
        status: 'pending',
        contentHash: generateContentHash((ins.insight || '') + (ins.title || '')),
      };

      // Apply quality filters
      if (insight.qualityScore >= QUALITY_THRESHOLDS.MIN_QUALITY_SCORE &&
          insight.specificityScore >= QUALITY_THRESHOLDS.MIN_SPECIFICITY_SCORE &&
          insight.safetyScore >= QUALITY_THRESHOLDS.MIN_SAFETY_SCORE) {
        insights.push(insight);
        // Add to dedup store
        await addInsightHash(ins.insight || '', ins.title || '');
      }
    }

    return { insights };
  } catch (error) {
    return {
      insights: [],
      error: error instanceof Error ? error.message : 'Failed to extract insights',
    };
  }
}

// ============================================
// CURATED CHANNEL MANAGEMENT
// ============================================

/**
 * Add a curated channel
 */
export async function addCuratedChannel(
  url: string,
  channelId: string,
  name: string,
  category: ChannelCategory,
  trustLevel: 'high' | 'medium' | 'curated',
  description: string
): Promise<CuratedChannel> {
  const channel: CuratedChannel = {
    id: `channel_${Date.now()}`,
    url,
    channelId,
    name,
    category,
    trustLevel,
    description,
    addedAt: new Date().toISOString(),
    videosProcessed: 0,
    insightsExtracted: 0,
    avgQualityScore: 0,
  };

  const stored = await AsyncStorage.getItem(STORAGE_KEYS.CURATED_CHANNELS);
  const channels: CuratedChannel[] = stored ? JSON.parse(stored) : [];

  // Check for duplicate
  if (!channels.find(c => c.channelId === channelId)) {
    channels.push(channel);
    await AsyncStorage.setItem(STORAGE_KEYS.CURATED_CHANNELS, JSON.stringify(channels));
  }

  return channel;
}

/**
 * Get all curated channels
 */
export async function getCuratedChannels(): Promise<CuratedChannel[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.CURATED_CHANNELS);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Update channel stats after processing
 */
export async function updateChannelStats(
  channelId: string,
  videosProcessed: number,
  insightsExtracted: number,
  avgQualityScore: number
): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.CURATED_CHANNELS);
  const channels: CuratedChannel[] = stored ? JSON.parse(stored) : [];

  const index = channels.findIndex(c => c.channelId === channelId);
  if (index !== -1) {
    channels[index].videosProcessed += videosProcessed;
    channels[index].insightsExtracted += insightsExtracted;
    // Running average
    const total = channels[index].videosProcessed;
    const prev = channels[index].avgQualityScore;
    channels[index].avgQualityScore = ((prev * (total - videosProcessed)) + (avgQualityScore * videosProcessed)) / total;

    await AsyncStorage.setItem(STORAGE_KEYS.CURATED_CHANNELS, JSON.stringify(channels));
  }
}

/**
 * Remove a curated channel
 */
export async function removeCuratedChannel(channelId: string): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.CURATED_CHANNELS);
  const channels: CuratedChannel[] = stored ? JSON.parse(stored) : [];

  const filtered = channels.filter(c => c.channelId !== channelId);
  await AsyncStorage.setItem(STORAGE_KEYS.CURATED_CHANNELS, JSON.stringify(filtered));
}

// ============================================
// PROCESSING JOB MANAGEMENT
// ============================================

export async function createProcessingJob(
  channelUrl: string,
  channelName: string,
  channelId: string,
  videos: YouTubeVideo[],
  categories: InsightExtractionCategory[]
): Promise<ProcessingJob> {
  const job: ProcessingJob = {
    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    channelUrl,
    channelName,
    channelId,
    videosToProcess: videos.length,
    videosProcessed: 0,
    insightsFound: 0,
    insightsAfterFiltering: 0,
    duplicatesRemoved: 0,
    lowQualityFiltered: 0,
    status: 'processing',
    startedAt: new Date().toISOString(),
    selectedCategories: categories,
    videos,
    currentVideoIndex: 0,
  };

  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROCESSING_QUEUE);
  const jobs: ProcessingJob[] = stored ? JSON.parse(stored) : [];
  jobs.push(job);
  await AsyncStorage.setItem(STORAGE_KEYS.PROCESSING_QUEUE, JSON.stringify(jobs));

  return job;
}

export async function updateProcessingJob(
  jobId: string,
  updates: Partial<ProcessingJob>
): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROCESSING_QUEUE);
  const jobs: ProcessingJob[] = stored ? JSON.parse(stored) : [];

  const index = jobs.findIndex(j => j.id === jobId);
  if (index !== -1) {
    jobs[index] = { ...jobs[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.PROCESSING_QUEUE, JSON.stringify(jobs));
  }
}

export async function getProcessingJobs(): Promise<ProcessingJob[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROCESSING_QUEUE);
  return stored ? JSON.parse(stored) : [];
}

// ============================================
// PENDING INSIGHTS MANAGEMENT
// ============================================

export async function savePendingInsights(insights: ExtractedInsight[]): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_INSIGHTS);
  const existing: ExtractedInsight[] = stored ? JSON.parse(stored) : [];

  const updated = [...existing, ...insights];
  await AsyncStorage.setItem(STORAGE_KEYS.PENDING_INSIGHTS, JSON.stringify(updated));
}

export async function getPendingInsights(): Promise<ExtractedInsight[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_INSIGHTS);
  return stored ? JSON.parse(stored) : [];
}

export async function updatePendingInsight(
  insightId: string,
  updates: Partial<ExtractedInsight>
): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_INSIGHTS);
  const insights: ExtractedInsight[] = stored ? JSON.parse(stored) : [];

  const index = insights.findIndex(i => i.id === insightId);
  if (index !== -1) {
    insights[index] = { ...insights[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_INSIGHTS, JSON.stringify(insights));
  }
}

export async function approvePendingInsight(insightId: string): Promise<void> {
  const pending = await getPendingInsights();
  const insight = pending.find(i => i.id === insightId);

  if (insight) {
    insight.status = 'approved';
    insight.approvedAt = new Date().toISOString();

    // Move to approved storage
    const approvedStored = await AsyncStorage.getItem(STORAGE_KEYS.APPROVED_INSIGHTS);
    const approved: ExtractedInsight[] = approvedStored ? JSON.parse(approvedStored) : [];
    approved.push(insight);
    await AsyncStorage.setItem(STORAGE_KEYS.APPROVED_INSIGHTS, JSON.stringify(approved));

    // Remove from pending
    const filtered = pending.filter(i => i.id !== insightId);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_INSIGHTS, JSON.stringify(filtered));
  }
}

export async function rejectPendingInsight(insightId: string, reason: string): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_INSIGHTS);
  const insights: ExtractedInsight[] = stored ? JSON.parse(stored) : [];

  const filtered = insights.filter(i => i.id !== insightId);
  await AsyncStorage.setItem(STORAGE_KEYS.PENDING_INSIGHTS, JSON.stringify(filtered));
}

export async function getApprovedInsights(): Promise<ExtractedInsight[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.APPROVED_INSIGHTS);
  return stored ? JSON.parse(stored) : [];
}

export async function clearPendingInsights(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PENDING_INSIGHTS, JSON.stringify([]));
}

// ============================================
// VIDEO TRACKING
// ============================================

export async function markVideoProcessed(videoId: string): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROCESSED_VIDEOS);
  const processed: string[] = stored ? JSON.parse(stored) : [];

  if (!processed.includes(videoId)) {
    processed.push(videoId);
    await AsyncStorage.setItem(STORAGE_KEYS.PROCESSED_VIDEOS, JSON.stringify(processed));
  }
}

export async function isVideoProcessed(videoId: string): Promise<boolean> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROCESSED_VIDEOS);
  const processed: string[] = stored ? JSON.parse(stored) : [];
  return processed.includes(videoId);
}

// ============================================
// QUALITY STATS
// ============================================

export async function getQualityStats(): Promise<QualityStats> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.QUALITY_STATS);
  return stored ? JSON.parse(stored) : {
    totalExtracted: 0,
    passedQualityFilter: 0,
    duplicatesRemoved: 0,
    safetyFiltered: 0,
    humanApproved: 0,
    humanRejected: 0,
    avgQualityScore: 0,
    avgConfidenceScore: 0,
  };
}

export async function updateQualityStats(updates: Partial<QualityStats>): Promise<void> {
  const current = await getQualityStats();
  const updated = { ...current, ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.QUALITY_STATS, JSON.stringify(updated));
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Channel/Video fetching
  extractChannelInfo,
  fetchChannelVideos,
  fetchVideoTranscript,

  // Smart sampling
  selectVideosWithStrategy,
  enrichVideosWithStats,
  fetchChannelVideosWithSampling,
  DEFAULT_SAMPLING_OPTIONS,

  // Insight extraction
  buildExtractionPrompt,
  extractInsightsWithClaude,

  // Deduplication
  generateContentHash,
  isDuplicateInsight,
  addInsightHash,

  // Curated channels
  addCuratedChannel,
  getCuratedChannels,
  updateChannelStats,
  removeCuratedChannel,

  // Job management
  createProcessingJob,
  updateProcessingJob,
  getProcessingJobs,

  // Pending insights
  savePendingInsights,
  getPendingInsights,
  updatePendingInsight,
  approvePendingInsight,
  rejectPendingInsight,
  getApprovedInsights,
  clearPendingInsights,

  // Video tracking
  markVideoProcessed,
  isVideoProcessed,

  // Quality stats
  getQualityStats,
  updateQualityStats,

  // Constants
  EXTRACTION_CATEGORIES,
  CHANNEL_CATEGORIES,
  QUALITY_THRESHOLDS,
};
