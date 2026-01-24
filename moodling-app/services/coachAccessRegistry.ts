/**
 * Coach Access Registry
 *
 * Controls what data sources and capabilities the AI coach has access to.
 * Users can toggle each data source on/off from the settings UI.
 *
 * This is the central registry for all AI data access permissions.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// STORAGE KEY
// ============================================

const STORAGE_KEY = 'moodleaf_coach_access_registry';

// ============================================
// TYPES
// ============================================

/**
 * Categories of data access
 */
export type AccessCategory =
  | 'core_user_data'
  | 'context_memories'
  | 'tracking'
  | 'health'
  | 'calendar'
  | 'social'
  | 'location'
  | 'therapeutic'
  | 'communication_style'
  | 'diagnostics';

/**
 * A single data source the AI can access
 */
export interface DataSource {
  id: string;
  name: string;
  description: string;
  category: AccessCategory;
  enabled: boolean;
  requiresPermission?: boolean;  // Needs OS-level permission (HealthKit, Calendar, etc.)
  permissionGranted?: boolean;   // Whether OS permission is granted
  serviceName?: string;          // The service file that provides this data
  contextFunction?: string;      // The function that generates context for LLM
}

/**
 * The full registry state
 */
export interface CoachAccessRegistry {
  version: number;
  lastUpdated: string;
  globalEnabled: boolean;  // Master toggle for all AI access
  sources: DataSource[];
}

// ============================================
// DEFAULT DATA SOURCES
// ============================================

export const DEFAULT_DATA_SOURCES: DataSource[] = [
  // === CORE USER DATA ===
  {
    id: 'user_context',
    name: 'User Context',
    description: 'Basic user info, preferences, and settings',
    category: 'core_user_data',
    enabled: true,
    serviceName: 'userContextService',
    contextFunction: 'getContextForClaude',
  },
  {
    id: 'coach_personality',
    name: 'Coach Personality',
    description: 'Coach name, persona, and communication style',
    category: 'core_user_data',
    enabled: true,
    serviceName: 'coachPersonalityService',
    contextFunction: 'generatePersonalityPrompt',
  },
  {
    id: 'tone_preferences',
    name: 'Tone Preferences',
    description: 'User\'s preferred communication tone and style',
    category: 'core_user_data',
    enabled: true,
    serviceName: 'tonePreferencesService',
    contextFunction: 'getToneInstruction',
  },
  {
    id: 'cognitive_profile',
    name: 'Cognitive Profile',
    description: 'Neurological accommodations and thinking style',
    category: 'core_user_data',
    enabled: true,
    serviceName: 'cognitiveProfileService',
    contextFunction: 'getCognitiveProfileContextForLLM',
  },

  // === INPUT CHANNELS ===
  {
    id: 'chat_conversations',
    name: 'Chat Conversations',
    description: 'Current and recent chat messages you send',
    category: 'core_user_data',
    enabled: true,
    serviceName: 'chatService',
    contextFunction: 'getConversationContext',
  },
  {
    id: 'voice_input',
    name: 'Voice Input',
    description: 'Speech-to-text from voice messages and dictation',
    category: 'core_user_data',
    enabled: true,
    requiresPermission: true,
    serviceName: 'speechInputService',
    contextFunction: 'getVoiceTranscripts',
  },
  {
    id: 'camera_input',
    name: 'Camera Input',
    description: 'Images you share or capture for analysis',
    category: 'core_user_data',
    enabled: false,
    requiresPermission: true,
    serviceName: 'cameraInputService',
    contextFunction: 'getImageAnalysis',
  },
  {
    id: 'prosody_analysis',
    name: 'Voice Tone Analysis',
    description: 'Emotional patterns detected from how you speak (not what you say)',
    category: 'communication_style',
    enabled: true,
    requiresPermission: true,
    serviceName: 'prosodyExtractionService',
    contextFunction: 'getProsodicFeaturesForLLM',
  },

  // === CONTEXT & MEMORIES ===
  {
    id: 'memory_tiers',
    name: 'Memory System',
    description: 'Short-term and long-term conversation memories',
    category: 'context_memories',
    enabled: true,
    serviceName: 'memoryTierService',
    contextFunction: 'getMemoryContextForLLM',
  },
  {
    id: 'life_context',
    name: 'Life Context',
    description: 'Major life events and circumstances',
    category: 'context_memories',
    enabled: true,
    serviceName: 'lifeContextService',
    contextFunction: 'getLifeContextForClaude',
  },
  {
    id: 'psych_analysis',
    name: 'Psychological Profile',
    description: 'Personality patterns and psychological insights',
    category: 'context_memories',
    enabled: true,
    serviceName: 'psychAnalysisService',
    contextFunction: 'getCompressedContext',
  },

  // === TRACKING ===
  {
    id: 'quick_logs',
    name: 'Quick Logs (Twigs)',
    description: 'Daily habit and mood tracking entries',
    category: 'tracking',
    enabled: true,
    serviceName: 'quickLogsService',
    contextFunction: 'getDetailedLogsContextForClaude',
  },
  {
    id: 'journal_entries',
    name: 'Journal Entries',
    description: 'Recent journal and reflection entries',
    category: 'tracking',
    enabled: true,
    serviceName: 'journalStorage',
    contextFunction: 'getRecentJournalContextForClaude',
  },
  {
    id: 'lifestyle_patterns',
    name: 'Lifestyle Patterns',
    description: 'Detected patterns in daily habits',
    category: 'tracking',
    enabled: true,
    serviceName: 'patternService',
    contextFunction: 'getLifestyleFactorsContextForClaude',
  },
  {
    id: 'accountability',
    name: 'Accountability Goals',
    description: 'Limits, goals, and accountability tracking',
    category: 'tracking',
    enabled: true,
    serviceName: 'aiAccountabilityService',
    contextFunction: 'getAccountabilityContextForCoach',
  },
  {
    id: 'games_progress',
    name: 'Games Progress',
    description: 'Therapeutic games played and progress',
    category: 'tracking',
    enabled: true,
    serviceName: 'gamesService',
    contextFunction: 'getGameStatsForLLM',
  },

  // === HEALTH ===
  {
    id: 'health_kit',
    name: 'Health Data (HealthKit)',
    description: 'Steps, sleep, heart rate from Apple Health',
    category: 'health',
    enabled: false,
    requiresPermission: true,
    serviceName: 'healthKitService',
    contextFunction: 'getHealthContextForClaude',
  },
  {
    id: 'health_correlations',
    name: 'Health Correlations',
    description: 'Patterns between health data and mood',
    category: 'health',
    enabled: false,
    serviceName: 'healthInsightService',
    contextFunction: 'getCorrelationSummaryForClaude',
  },
  {
    id: 'chronotype',
    name: 'Chronotype',
    description: 'Sleep/wake preferences and energy patterns',
    category: 'health',
    enabled: true,
    serviceName: 'coachPersonalityService',
    contextFunction: 'getChronotypeContextForClaude',
  },

  // === CALENDAR ===
  {
    id: 'calendar_events',
    name: 'Calendar Events',
    description: 'Upcoming events and schedule context',
    category: 'calendar',
    enabled: false,
    requiresPermission: true,
    serviceName: 'calendarService',
    contextFunction: 'getCalendarContextForClaude',
  },

  // === LOCATION ===
  {
    id: 'location_context',
    name: 'Location Context',
    description: 'General location (home, work, traveling) for context',
    category: 'location',
    enabled: false,
    requiresPermission: true,
    serviceName: 'locationContextService',
    contextFunction: 'getLocationContextForLLM',
  },
  {
    id: 'time_zone',
    name: 'Time Zone',
    description: 'Your local time for scheduling and context',
    category: 'location',
    enabled: true,
    serviceName: 'timeContextService',
    contextFunction: 'getTimeContextForLLM',
  },
  {
    id: 'weather_mood',
    name: 'Weather Context',
    description: 'Local weather that might affect mood',
    category: 'location',
    enabled: false,
    requiresPermission: true,
    serviceName: 'weatherService',
    contextFunction: 'getWeatherContextForLLM',
  },

  // === SOCIAL ===
  {
    id: 'social_connection',
    name: 'Social Connection Health',
    description: 'Social interaction patterns and relationships',
    category: 'social',
    enabled: true,
    serviceName: 'socialConnectionHealthService',
    contextFunction: 'getConnectionContextForLLM',
  },

  // === THERAPEUTIC ===
  {
    id: 'exposure_ladder',
    name: 'Exposure Therapy Progress',
    description: 'Anxiety exposure exercises and progress',
    category: 'therapeutic',
    enabled: true,
    serviceName: 'exposureLadderService',
    contextFunction: 'getExposureContextForClaude',
  },
  {
    id: 'coach_mode',
    name: 'Active Skill Mode',
    description: 'Currently active coaching skill or exercise',
    category: 'therapeutic',
    enabled: true,
    serviceName: 'coachModeService',
    contextFunction: 'getCoachModeSystemPrompt',
  },
  {
    id: 'achievements',
    name: 'Achievements & Celebrations',
    description: 'User achievements and pending celebrations',
    category: 'therapeutic',
    enabled: true,
    serviceName: 'achievementNotificationService',
    contextFunction: 'getNextCelebration',
  },

  // === COMMUNICATION STYLE ===
  {
    id: 'aliveness',
    name: 'Aliveness (Adaptive Style)',
    description: 'Detect user communication patterns and adapt responses',
    category: 'communication_style',
    enabled: true,
    serviceName: 'alivenessService',
    contextFunction: 'getAlivenessContextForLLM',
  },
  {
    id: 'core_principles',
    name: 'Core Principle Kernel',
    description: 'Safety rules and ethical guidelines',
    category: 'communication_style',
    enabled: true,  // Cannot be disabled
    serviceName: 'corePrincipleKernel',
    contextFunction: 'getPrincipleContextForLLM',
  },
  {
    id: 'safeguards',
    name: 'Crisis Safeguards',
    description: 'Crisis detection and safety responses',
    category: 'communication_style',
    enabled: true,  // Cannot be disabled
    serviceName: 'safeguardService',
    contextFunction: 'checkSafeguards',
  },

  // === DIAGNOSTICS ===
  {
    id: 'app_usage',
    name: 'App Usage Patterns',
    description: 'When and how often you use the app',
    category: 'diagnostics',
    enabled: true,
    serviceName: 'appUsageService',
    contextFunction: 'getUsagePatternForLLM',
  },
  {
    id: 'notification_response',
    name: 'Notification Response',
    description: 'How you respond to reminders and check-ins',
    category: 'diagnostics',
    enabled: true,
    serviceName: 'notificationTrackingService',
    contextFunction: 'getNotificationPatternForLLM',
  },
  {
    id: 'session_context',
    name: 'Session Context',
    description: 'Current app session state and navigation',
    category: 'diagnostics',
    enabled: true,
    serviceName: 'sessionContextService',
    contextFunction: 'getSessionContextForLLM',
  },
];

// ============================================
// CATEGORY LABELS
// ============================================

export const CATEGORY_LABELS: Record<AccessCategory, string> = {
  core_user_data: 'Core User Data',
  context_memories: 'Context & Memories',
  tracking: 'Tracking & Logging',
  health: 'Health Data',
  calendar: 'Calendar',
  social: 'Social',
  location: 'Location & Environment',
  therapeutic: 'Therapeutic Tools',
  communication_style: 'Communication Style',
  diagnostics: 'Diagnostics',
};

// ============================================
// DEFAULT REGISTRY
// ============================================

const DEFAULT_REGISTRY: CoachAccessRegistry = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  globalEnabled: true,
  sources: DEFAULT_DATA_SOURCES,
};

// ============================================
// REGISTRY FUNCTIONS
// ============================================

/**
 * Get the full access registry
 */
export async function getAccessRegistry(): Promise<CoachAccessRegistry> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to pick up any new sources
      const mergedSources = DEFAULT_DATA_SOURCES.map(defaultSource => {
        const storedSource = parsed.sources?.find((s: DataSource) => s.id === defaultSource.id);
        return storedSource ? { ...defaultSource, ...storedSource } : defaultSource;
      });
      return {
        ...DEFAULT_REGISTRY,
        ...parsed,
        sources: mergedSources,
      };
    }
  } catch (error) {
    console.error('[AccessRegistry] Error loading registry:', error);
  }
  return { ...DEFAULT_REGISTRY };
}

/**
 * Save the access registry
 */
export async function saveAccessRegistry(registry: CoachAccessRegistry): Promise<void> {
  registry.lastUpdated = new Date().toISOString();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
}

/**
 * Check if a specific data source is enabled
 */
export async function isSourceEnabled(sourceId: string): Promise<boolean> {
  const registry = await getAccessRegistry();
  if (!registry.globalEnabled) return false;
  const source = registry.sources.find(s => s.id === sourceId);
  return source?.enabled ?? false;
}

/**
 * Toggle a specific data source
 */
export async function toggleSource(sourceId: string, enabled: boolean): Promise<void> {
  const registry = await getAccessRegistry();
  const source = registry.sources.find(s => s.id === sourceId);

  if (source) {
    // Don't allow disabling critical safety services
    if (['core_principles', 'safeguards'].includes(sourceId) && !enabled) {
      console.warn('[AccessRegistry] Cannot disable safety services');
      return;
    }
    source.enabled = enabled;
    await saveAccessRegistry(registry);
  }
}

/**
 * Toggle the global AI access
 */
export async function toggleGlobalAccess(enabled: boolean): Promise<void> {
  const registry = await getAccessRegistry();
  registry.globalEnabled = enabled;
  await saveAccessRegistry(registry);
}

/**
 * Get all enabled sources
 */
export async function getEnabledSources(): Promise<DataSource[]> {
  const registry = await getAccessRegistry();
  if (!registry.globalEnabled) return [];
  return registry.sources.filter(s => s.enabled);
}

/**
 * Get sources grouped by category
 */
export async function getSourcesByCategory(): Promise<Record<AccessCategory, DataSource[]>> {
  const registry = await getAccessRegistry();
  const grouped: Record<AccessCategory, DataSource[]> = {
    core_user_data: [],
    context_memories: [],
    tracking: [],
    health: [],
    calendar: [],
    social: [],
    location: [],
    therapeutic: [],
    communication_style: [],
    diagnostics: [],
  };

  for (const source of registry.sources) {
    grouped[source.category].push(source);
  }

  return grouped;
}

/**
 * Update permission status for a source
 */
export async function updatePermissionStatus(
  sourceId: string,
  granted: boolean
): Promise<void> {
  const registry = await getAccessRegistry();
  const source = registry.sources.find(s => s.id === sourceId);
  if (source) {
    source.permissionGranted = granted;
    await saveAccessRegistry(registry);
  }
}

/**
 * Get a summary of enabled data sources for display
 */
export async function getAccessSummary(): Promise<{
  totalSources: number;
  enabledCount: number;
  categories: Array<{ name: string; enabled: number; total: number }>;
}> {
  const registry = await getAccessRegistry();
  const byCategory = await getSourcesByCategory();

  const categories = Object.entries(byCategory).map(([key, sources]) => ({
    name: CATEGORY_LABELS[key as AccessCategory],
    enabled: sources.filter(s => s.enabled).length,
    total: sources.length,
  }));

  return {
    totalSources: registry.sources.length,
    enabledCount: registry.sources.filter(s => s.enabled).length,
    categories,
  };
}

/**
 * Reset registry to defaults
 */
export async function resetToDefaults(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// ============================================
// CONTEXT GENERATION HELPERS
// ============================================

/**
 * Check if the AI should use a specific context source
 * Call this before generating context for the LLM
 */
export async function shouldUseSource(sourceId: string): Promise<boolean> {
  return isSourceEnabled(sourceId);
}

/**
 * Get list of enabled source IDs (for quick checks)
 */
export async function getEnabledSourceIds(): Promise<string[]> {
  const enabled = await getEnabledSources();
  return enabled.map(s => s.id);
}

// ============================================
// EXPORTS
// ============================================

export default {
  getAccessRegistry,
  saveAccessRegistry,
  isSourceEnabled,
  toggleSource,
  toggleGlobalAccess,
  getEnabledSources,
  getSourcesByCategory,
  updatePermissionStatus,
  getAccessSummary,
  resetToDefaults,
  shouldUseSource,
  getEnabledSourceIds,
  CATEGORY_LABELS,
  DEFAULT_DATA_SOURCES,
};
