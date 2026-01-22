/**
 * Memory Tier Service
 *
 * Three-tier memory system for the hybrid AI architecture.
 * Memory is owned LOCALLY - this is what makes Claude disappear-able.
 *
 * Tiers:
 * 1. SHORT-TERM: Current session (verbatim, recent)
 * 2. MID-TERM: Recent weeks (compressed summaries)
 * 3. LONG-TERM: Core identity (facts, events, patterns)
 *
 * Compression happens via Claude NOW, but the compressed data
 * is stored locally. When we switch to local LLM, it just reads
 * the same compressed memory.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES
// ============================================

/**
 * Short-term memory: Current session
 */
export interface ShortTermMemory {
  sessionId: string;
  startTime: string;
  messages: SessionMessage[];
  currentMood: string;
  currentEnergy: string;
  topicsDiscussed: string[];
  emotionalArc: string; // e.g., "started anxious → calming"
}

export interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mood?: string;
  energy?: string;
}

/**
 * Mid-term memory: Weekly summaries
 */
export interface MidTermMemory {
  weekId: string; // e.g., "2024-W15"
  startDate: string;
  endDate: string;
  sessionCount: number;
  summary: string; // Claude-generated summary
  themes: string[]; // Recurring topics
  emotionalPattern: string; // e.g., "anxious mornings, calmer evenings"
  notableMoments: string[]; // Breakthroughs, insights
  flags: string[]; // Things to monitor
}

/**
 * Long-term memory: Core identity and life context
 */
export interface LongTermMemory {
  // Core identity
  preferredName?: string;
  pronouns?: string;
  timezone?: string;

  // Communication preferences (learned over time)
  communicationStyle: {
    prefersDirectness: boolean;
    respondsToHumor: boolean;
    needsValidationFirst: boolean;
    prefersBriefResponses: boolean;
  };

  // Life context (user-provided or inferred)
  lifeContext: {
    relationships: RelationshipEntry[];
    workSituation?: string;
    livingArrangement?: string;
    majorLifeEvents: LifeEvent[];
  };

  // Patterns (learned from conversations)
  patterns: {
    triggers: string[]; // Things that upset them
    calmingFactors: string[]; // Things that help
    peakAnxietyTimes: string[]; // e.g., "Sunday evenings"
    growthAreas: string[]; // What they're working on
  };

  // Long-term emotional arc
  emotionalJourney: {
    startDate: string;
    overallTrend: 'improving' | 'stable' | 'struggling';
    milestones: string[];
  };

  // Topics to handle carefully
  sensitivities: string[];

  // Last updated
  lastUpdated: string;
}

export interface RelationshipEntry {
  name: string;
  relationship: string; // "partner", "friend", "parent", etc.
  sentiment: 'supportive' | 'complicated' | 'strained' | 'neutral';
  notes?: string;
}

export interface LifeEvent {
  date: string;
  description: string;
  emotionalImpact: 'positive' | 'negative' | 'mixed' | 'neutral';
  stillProcessing: boolean;
}

/**
 * Complete memory state
 */
export interface MemoryState {
  shortTerm: ShortTermMemory | null;
  midTerm: MidTermMemory[];
  longTerm: LongTermMemory;
}

// ============================================
// STORAGE
// ============================================

const STORAGE_KEYS = {
  SHORT_TERM: 'moodleaf_memory_short',
  MID_TERM: 'moodleaf_memory_mid',
  LONG_TERM: 'moodleaf_memory_long',
  PENDING_COMPRESSION: 'moodleaf_memory_pending',
};

const MAX_SHORT_TERM_MESSAGES = 20;
const MAX_MID_TERM_WEEKS = 12; // 3 months of weekly summaries

// ============================================
// SHORT-TERM MEMORY (Current Session)
// ============================================

/**
 * Start a new session
 */
export async function startSession(): Promise<ShortTermMemory> {
  const session: ShortTermMemory = {
    sessionId: `session_${Date.now()}`,
    startTime: new Date().toISOString(),
    messages: [],
    currentMood: 'neutral',
    currentEnergy: 'medium',
    topicsDiscussed: [],
    emotionalArc: '',
  };

  await AsyncStorage.setItem(STORAGE_KEYS.SHORT_TERM, JSON.stringify(session));
  return session;
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<ShortTermMemory | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SHORT_TERM);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('[Memory] Failed to get session:', error);
    return null;
  }
}

/**
 * Add message to current session
 */
export async function addMessageToSession(
  role: 'user' | 'assistant',
  content: string,
  mood?: string,
  energy?: string
): Promise<void> {
  try {
    let session = await getCurrentSession();
    if (!session) {
      session = await startSession();
    }

    const message: SessionMessage = {
      role,
      content,
      timestamp: new Date().toISOString(),
      mood,
      energy,
    };

    session.messages.push(message);

    // Keep only recent messages
    if (session.messages.length > MAX_SHORT_TERM_MESSAGES) {
      session.messages = session.messages.slice(-MAX_SHORT_TERM_MESSAGES);
    }

    // Update current mood/energy from latest user message
    if (role === 'user') {
      if (mood) session.currentMood = mood;
      if (energy) session.currentEnergy = energy;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.SHORT_TERM, JSON.stringify(session));
  } catch (error) {
    console.error('[Memory] Failed to add message:', error);
  }
}

/**
 * Update session topics
 */
export async function updateSessionTopics(topics: string[]): Promise<void> {
  try {
    const session = await getCurrentSession();
    if (!session) return;

    for (const topic of topics) {
      if (!session.topicsDiscussed.includes(topic)) {
        session.topicsDiscussed.push(topic);
      }
    }

    await AsyncStorage.setItem(STORAGE_KEYS.SHORT_TERM, JSON.stringify(session));
  } catch (error) {
    console.error('[Memory] Failed to update topics:', error);
  }
}

/**
 * End session and queue for compression
 */
export async function endSession(): Promise<void> {
  try {
    const session = await getCurrentSession();
    if (!session || session.messages.length === 0) return;

    // Calculate emotional arc
    const userMessages = session.messages.filter(m => m.role === 'user');
    if (userMessages.length >= 2) {
      const firstMood = userMessages[0].mood || 'unknown';
      const lastMood = userMessages[userMessages.length - 1].mood || 'unknown';
      session.emotionalArc = `${firstMood} → ${lastMood}`;
    }

    // Queue for mid-term compression
    await queueForCompression(session);

    // Clear short-term
    await AsyncStorage.removeItem(STORAGE_KEYS.SHORT_TERM);
  } catch (error) {
    console.error('[Memory] Failed to end session:', error);
  }
}

// ============================================
// MID-TERM MEMORY (Weekly Summaries)
// ============================================

/**
 * Queue session for weekly compression
 */
async function queueForCompression(session: ShortTermMemory): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_COMPRESSION);
    const pending: ShortTermMemory[] = stored ? JSON.parse(stored) : [];
    pending.push(session);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_COMPRESSION, JSON.stringify(pending));
  } catch (error) {
    console.error('[Memory] Failed to queue for compression:', error);
  }
}

/**
 * Get pending sessions for compression
 */
export async function getPendingForCompression(): Promise<ShortTermMemory[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_COMPRESSION);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[Memory] Failed to get pending:', error);
    return [];
  }
}

/**
 * Clear pending after compression
 */
export async function clearPendingCompression(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_COMPRESSION);
}

/**
 * Get all mid-term memories
 */
export async function getMidTermMemories(): Promise<MidTermMemory[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.MID_TERM);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[Memory] Failed to get mid-term:', error);
    return [];
  }
}

/**
 * Save mid-term memory (weekly summary)
 */
export async function saveMidTermMemory(memory: MidTermMemory): Promise<void> {
  try {
    const memories = await getMidTermMemories();

    // Check if we already have this week
    const existingIndex = memories.findIndex(m => m.weekId === memory.weekId);
    if (existingIndex >= 0) {
      memories[existingIndex] = memory; // Update
    } else {
      memories.push(memory); // Add new
    }

    // Keep only recent weeks
    const sorted = memories.sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    const trimmed = sorted.slice(0, MAX_MID_TERM_WEEKS);

    await AsyncStorage.setItem(STORAGE_KEYS.MID_TERM, JSON.stringify(trimmed));
  } catch (error) {
    console.error('[Memory] Failed to save mid-term:', error);
  }
}

/**
 * Get current week ID
 */
function getCurrentWeekId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

// ============================================
// LONG-TERM MEMORY (Core Identity)
// ============================================

const DEFAULT_LONG_TERM: LongTermMemory = {
  communicationStyle: {
    prefersDirectness: false,
    respondsToHumor: true,
    needsValidationFirst: true,
    prefersBriefResponses: false,
  },
  lifeContext: {
    relationships: [],
    majorLifeEvents: [],
  },
  patterns: {
    triggers: [],
    calmingFactors: [],
    peakAnxietyTimes: [],
    growthAreas: [],
  },
  emotionalJourney: {
    startDate: new Date().toISOString(),
    overallTrend: 'stable',
    milestones: [],
  },
  sensitivities: [],
  lastUpdated: new Date().toISOString(),
};

/**
 * Get long-term memory
 */
export async function getLongTermMemory(): Promise<LongTermMemory> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.LONG_TERM);
    return stored ? { ...DEFAULT_LONG_TERM, ...JSON.parse(stored) } : DEFAULT_LONG_TERM;
  } catch (error) {
    console.error('[Memory] Failed to get long-term:', error);
    return DEFAULT_LONG_TERM;
  }
}

/**
 * Update long-term memory
 */
export async function updateLongTermMemory(
  updates: Partial<LongTermMemory>
): Promise<void> {
  try {
    const current = await getLongTermMemory();
    const updated = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.LONG_TERM, JSON.stringify(updated));
  } catch (error) {
    console.error('[Memory] Failed to update long-term:', error);
  }
}

/**
 * Add a relationship to long-term memory
 */
export async function addRelationship(entry: RelationshipEntry): Promise<void> {
  const memory = await getLongTermMemory();
  const existing = memory.lifeContext.relationships.findIndex(
    r => r.name.toLowerCase() === entry.name.toLowerCase()
  );

  if (existing >= 0) {
    memory.lifeContext.relationships[existing] = entry;
  } else {
    memory.lifeContext.relationships.push(entry);
  }

  await updateLongTermMemory({ lifeContext: memory.lifeContext });
}

/**
 * Add a life event to long-term memory
 */
export async function addLifeEvent(event: LifeEvent): Promise<void> {
  const memory = await getLongTermMemory();
  memory.lifeContext.majorLifeEvents.push(event);

  // Keep only last 50 events
  if (memory.lifeContext.majorLifeEvents.length > 50) {
    memory.lifeContext.majorLifeEvents = memory.lifeContext.majorLifeEvents.slice(-50);
  }

  await updateLongTermMemory({ lifeContext: memory.lifeContext });
}

/**
 * Add a pattern trigger
 */
export async function addTrigger(trigger: string): Promise<void> {
  const memory = await getLongTermMemory();
  if (!memory.patterns.triggers.includes(trigger)) {
    memory.patterns.triggers.push(trigger);
    await updateLongTermMemory({ patterns: memory.patterns });
  }
}

/**
 * Add a calming factor
 */
export async function addCalmingFactor(factor: string): Promise<void> {
  const memory = await getLongTermMemory();
  if (!memory.patterns.calmingFactors.includes(factor)) {
    memory.patterns.calmingFactors.push(factor);
    await updateLongTermMemory({ patterns: memory.patterns });
  }
}

/**
 * Add a sensitivity topic
 */
export async function addSensitivity(topic: string): Promise<void> {
  const memory = await getLongTermMemory();
  if (!memory.sensitivities.includes(topic)) {
    memory.sensitivities.push(topic);
    await updateLongTermMemory({ sensitivities: memory.sensitivities });
  }
}

// ============================================
// COMPRESSION (Claude → Compressed Local)
// ============================================

const COMPRESSION_PROMPT = `You are compressing conversation data into structured memory.

Given these session transcripts from this week, create a weekly summary.

SESSIONS:
{sessions}

Create a JSON summary with:
1. summary: 2-3 sentence overview of the week
2. themes: Array of recurring topics (max 5)
3. emotionalPattern: One sentence about emotional trends
4. notableMoments: Array of breakthroughs or insights (max 3)
5. flags: Array of things to monitor (concerning patterns, max 3)

Also extract any NEW information about:
6. relationships: New people mentioned [{name, relationship, sentiment}]
7. lifeEvents: Significant events [{date, description, emotionalImpact}]
8. triggers: Things that upset them
9. calmingFactors: Things that help

Be concise. Focus on patterns, not individual messages.

RESPOND WITH JSON ONLY:
{
  "weekly": {
    "summary": "...",
    "themes": [...],
    "emotionalPattern": "...",
    "notableMoments": [...],
    "flags": [...]
  },
  "longTerm": {
    "relationships": [...],
    "lifeEvents": [...],
    "triggers": [...],
    "calmingFactors": [...]
  }
}`;

export interface CompressionResult {
  weekly: {
    summary: string;
    themes: string[];
    emotionalPattern: string;
    notableMoments: string[];
    flags: string[];
  };
  longTerm: {
    relationships: RelationshipEntry[];
    lifeEvents: LifeEvent[];
    triggers: string[];
    calmingFactors: string[];
  };
}

/**
 * Compress pending sessions into mid-term memory
 * Uses Claude for compression, stores result locally
 */
export async function compressToMidTerm(apiKey: string): Promise<boolean> {
  try {
    const pending = await getPendingForCompression();
    if (pending.length === 0) return false;

    // Format sessions for Claude
    const sessionsText = pending.map((s, i) => {
      const messages = s.messages.map(m =>
        `[${m.role}${m.mood ? ` (${m.mood})` : ''}]: ${m.content}`
      ).join('\n');
      return `SESSION ${i + 1} (${s.startTime}):\nTopics: ${s.topicsDiscussed.join(', ')}\nArc: ${s.emotionalArc}\n${messages}`;
    }).join('\n\n---\n\n');

    const prompt = COMPRESSION_PROMPT.replace('{sessions}', sessionsText);

    // Call Claude for compression
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Cheapest model for compression
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error('[Memory] Compression API error:', response.status);
      return false;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;

    if (!text) {
      console.error('[Memory] No compression response');
      return false;
    }

    // Parse result
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Memory] Could not parse compression result');
      return false;
    }

    const result: CompressionResult = JSON.parse(jsonMatch[0]);

    // Save weekly summary to mid-term
    const weekId = getCurrentWeekId();
    const firstSession = pending[0];
    const lastSession = pending[pending.length - 1];

    const midTermMemory: MidTermMemory = {
      weekId,
      startDate: firstSession.startTime,
      endDate: lastSession.startTime,
      sessionCount: pending.length,
      summary: result.weekly.summary,
      themes: result.weekly.themes,
      emotionalPattern: result.weekly.emotionalPattern,
      notableMoments: result.weekly.notableMoments,
      flags: result.weekly.flags,
    };

    await saveMidTermMemory(midTermMemory);

    // Update long-term memory with extracted info
    for (const rel of result.longTerm.relationships) {
      await addRelationship(rel);
    }
    for (const event of result.longTerm.lifeEvents) {
      await addLifeEvent(event);
    }
    for (const trigger of result.longTerm.triggers) {
      await addTrigger(trigger);
    }
    for (const factor of result.longTerm.calmingFactors) {
      await addCalmingFactor(factor);
    }

    // Clear pending
    await clearPendingCompression();

    console.log('[Memory] Compression complete:', weekId);
    return true;
  } catch (error) {
    console.error('[Memory] Compression failed:', error);
    return false;
  }
}

// ============================================
// CONTEXT GENERATION (For LLM prompts)
// ============================================

/**
 * Generate memory context for LLM prompt
 * This is what gets injected into Claude/local LLM
 */
export async function getMemoryContextForLLM(): Promise<string> {
  const parts: string[] = [];

  // Long-term context (most important)
  const longTerm = await getLongTermMemory();

  if (longTerm.preferredName) {
    parts.push(`User's name: ${longTerm.preferredName}`);
  }

  if (longTerm.communicationStyle) {
    const style = longTerm.communicationStyle;
    const prefs: string[] = [];
    if (style.prefersDirectness) prefs.push('prefers direct communication');
    if (style.prefersBriefResponses) prefs.push('prefers brief responses');
    if (style.needsValidationFirst) prefs.push('needs validation before advice');
    if (style.respondsToHumor) prefs.push('responds well to appropriate humor');
    if (prefs.length > 0) {
      parts.push(`Communication style: ${prefs.join(', ')}`);
    }
  }

  if (longTerm.lifeContext.relationships.length > 0) {
    const rels = longTerm.lifeContext.relationships
      .slice(0, 5) // Top 5
      .map(r => `${r.name} (${r.relationship}, ${r.sentiment})`)
      .join(', ');
    parts.push(`Key relationships: ${rels}`);
  }

  if (longTerm.patterns.triggers.length > 0) {
    parts.push(`Known triggers: ${longTerm.patterns.triggers.slice(0, 5).join(', ')}`);
  }

  if (longTerm.patterns.calmingFactors.length > 0) {
    parts.push(`What helps: ${longTerm.patterns.calmingFactors.slice(0, 5).join(', ')}`);
  }

  if (longTerm.sensitivities.length > 0) {
    parts.push(`Handle carefully: ${longTerm.sensitivities.slice(0, 3).join(', ')}`);
  }

  // Recent mid-term context (last 2 weeks)
  const midTerm = await getMidTermMemories();
  const recentWeeks = midTerm.slice(0, 2);

  if (recentWeeks.length > 0) {
    const weekSummaries = recentWeeks.map(w =>
      `${w.weekId}: ${w.summary} (Themes: ${w.themes.join(', ')})`
    ).join('\n');
    parts.push(`\nRecent weeks:\n${weekSummaries}`);
  }

  // Flags from recent weeks
  const allFlags = recentWeeks.flatMap(w => w.flags).filter(Boolean);
  if (allFlags.length > 0) {
    parts.push(`\nTo monitor: ${[...new Set(allFlags)].join(', ')}`);
  }

  // Current session context
  const session = await getCurrentSession();
  if (session && session.messages.length > 0) {
    parts.push(`\nThis session: ${session.topicsDiscussed.join(', ') || 'just started'}`);
    if (session.emotionalArc) {
      parts.push(`Emotional arc: ${session.emotionalArc}`);
    }
  }

  if (parts.length === 0) {
    return ''; // No memory yet
  }

  return `MEMORY CONTEXT (what you know about this person):\n${parts.join('\n')}`;
}

/**
 * Get full memory state (for export/debug)
 */
export async function getFullMemoryState(): Promise<MemoryState> {
  return {
    shortTerm: await getCurrentSession(),
    midTerm: await getMidTermMemories(),
    longTerm: await getLongTermMemory(),
  };
}

/**
 * Export all memory as JSON (for backup)
 */
export async function exportMemory(): Promise<string> {
  const state = await getFullMemoryState();
  return JSON.stringify({
    exportDate: new Date().toISOString(),
    ...state,
  }, null, 2);
}

/**
 * Import memory from JSON (for restore)
 */
export async function importMemory(json: string): Promise<boolean> {
  try {
    const data = JSON.parse(json);

    if (data.shortTerm) {
      await AsyncStorage.setItem(STORAGE_KEYS.SHORT_TERM, JSON.stringify(data.shortTerm));
    }
    if (data.midTerm) {
      await AsyncStorage.setItem(STORAGE_KEYS.MID_TERM, JSON.stringify(data.midTerm));
    }
    if (data.longTerm) {
      await AsyncStorage.setItem(STORAGE_KEYS.LONG_TERM, JSON.stringify(data.longTerm));
    }

    return true;
  } catch (error) {
    console.error('[Memory] Import failed:', error);
    return false;
  }
}

/**
 * Clear all memory (factory reset)
 */
export async function clearAllMemory(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.SHORT_TERM,
    STORAGE_KEYS.MID_TERM,
    STORAGE_KEYS.LONG_TERM,
    STORAGE_KEYS.PENDING_COMPRESSION,
  ]);
}
