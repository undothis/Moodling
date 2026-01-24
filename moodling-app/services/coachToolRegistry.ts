/**
 * Coach Tool Registry Service
 *
 * Centralized registry of all tools/actions the AI coach can access.
 * Provides modular control over AI capabilities for troubleshooting
 * and feature toggling.
 *
 * Features:
 * - Define all available AI tools in one place
 * - Enable/disable specific tools
 * - Log tool usage for debugging
 * - Validate AI outputs against allowed tools
 * - Admin view of what's accessible
 *
 * Unit: Coach Tool Access Control
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  TOOL_SETTINGS: 'moodleaf_coach_tool_settings',
  TOOL_USAGE_LOG: 'moodleaf_coach_tool_usage_log',
};

// ============================================
// TYPES & INTERFACES
// ============================================

export type ToolCategory =
  | 'skill_overlay'    // Opening skill UIs (breathing, grounding)
  | 'conversation'     // Conversation control (modes, personas)
  | 'data_access'      // Accessing user data (journal, health)
  | 'ui_control'       // UI actions (navigation, alerts)
  | 'external'         // External services (TTS, voice)
  | 'therapeutic';     // Therapeutic techniques

export interface CoachTool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  triggerPattern?: RegExp;       // Pattern to detect in AI output
  enabled: boolean;              // Whether tool is currently active
  requiresPermission?: boolean;  // Needs user consent
  debugOnly?: boolean;           // Only available in dev mode
}

export interface ToolUsageLog {
  toolId: string;
  timestamp: Date;
  context?: string;    // What triggered it
  success: boolean;
  error?: string;
}

export interface ToolSettings {
  enabledTools: Record<string, boolean>;
  loggingEnabled: boolean;
  maxLogEntries: number;
}

// ============================================
// TOOL DEFINITIONS
// ============================================

export const COACH_TOOLS: Record<string, CoachTool> = {
  // Skill Overlay Tools
  open_skill: {
    id: 'open_skill',
    name: 'Open Skill Overlay',
    description: 'Opens an interactive skill overlay (breathing, grounding, etc.)',
    category: 'skill_overlay',
    triggerPattern: /\[(?:OPEN_)?SKILL:(\w+)\]/gi,
    enabled: true,
  },
  close_skill: {
    id: 'close_skill',
    name: 'Close Skill Overlay',
    description: 'Closes the currently active skill overlay',
    category: 'skill_overlay',
    triggerPattern: /\[(?:CLOSE|END)_SKILL\]/gi,
    enabled: true,
  },

  // Conversation Control Tools
  switch_persona: {
    id: 'switch_persona',
    name: 'Switch Persona',
    description: 'Changes the coach personality (Flint, Luna, etc.)',
    category: 'conversation',
    enabled: true,
  },
  activate_mode: {
    id: 'activate_mode',
    name: 'Activate Coach Mode',
    description: 'Activates a therapeutic mode (CBT, DBT, mindfulness, etc.)',
    category: 'conversation',
    enabled: true,
  },
  clear_history: {
    id: 'clear_history',
    name: 'Clear Chat History',
    description: 'Clears the conversation history',
    category: 'conversation',
    enabled: true,
  },

  // Data Access Tools
  read_journal: {
    id: 'read_journal',
    name: 'Read Journal Entries',
    description: 'Access recent journal entries for context',
    category: 'data_access',
    enabled: true,
    requiresPermission: true,
  },
  read_mood_history: {
    id: 'read_mood_history',
    name: 'Read Mood History',
    description: 'Access mood tracking data',
    category: 'data_access',
    enabled: true,
    requiresPermission: true,
  },
  read_health_data: {
    id: 'read_health_data',
    name: 'Read Health Data',
    description: 'Access HealthKit data (heart rate, sleep, etc.)',
    category: 'data_access',
    enabled: false, // Disabled by default
    requiresPermission: true,
  },
  read_habits: {
    id: 'read_habits',
    name: 'Read Habit Data',
    description: 'Access habit tracking data',
    category: 'data_access',
    enabled: true,
    requiresPermission: true,
  },
  read_cognitive_profile: {
    id: 'read_cognitive_profile',
    name: 'Read Cognitive Profile',
    description: 'Access user thinking/learning style',
    category: 'data_access',
    enabled: true,
  },
  read_memories: {
    id: 'read_memories',
    name: 'Read Memories',
    description: 'Access stored conversation memories',
    category: 'data_access',
    enabled: true,
  },

  // UI Control Tools
  show_notification: {
    id: 'show_notification',
    name: 'Show Notification',
    description: 'Display an in-app notification',
    category: 'ui_control',
    enabled: true,
  },
  navigate: {
    id: 'navigate',
    name: 'Navigate',
    description: 'Navigate to a different screen',
    category: 'ui_control',
    enabled: false, // Disabled - could be disruptive
  },

  // External Service Tools
  text_to_speech: {
    id: 'text_to_speech',
    name: 'Text to Speech',
    description: 'Speak responses aloud',
    category: 'external',
    enabled: true,
  },
  voice_input: {
    id: 'voice_input',
    name: 'Voice Input',
    description: 'Accept voice input from user',
    category: 'external',
    enabled: true,
  },

  // Therapeutic Tools
  breathing_exercise: {
    id: 'breathing_exercise',
    name: 'Breathing Exercise',
    description: 'Guide through breathing exercises',
    category: 'therapeutic',
    enabled: true,
  },
  grounding_exercise: {
    id: 'grounding_exercise',
    name: 'Grounding Exercise',
    description: 'Guide through grounding (5-4-3-2-1)',
    category: 'therapeutic',
    enabled: true,
  },
  thought_challenging: {
    id: 'thought_challenging',
    name: 'Thought Challenging',
    description: 'CBT thought challenging technique',
    category: 'therapeutic',
    enabled: true,
  },
  crisis_resources: {
    id: 'crisis_resources',
    name: 'Crisis Resources',
    description: 'Provide crisis hotline information',
    category: 'therapeutic',
    enabled: true,
  },
};

// ============================================
// DEFAULT SETTINGS
// ============================================

const DEFAULT_SETTINGS: ToolSettings = {
  enabledTools: Object.fromEntries(
    Object.entries(COACH_TOOLS).map(([id, tool]) => [id, tool.enabled])
  ),
  loggingEnabled: __DEV__ ?? false,
  maxLogEntries: 100,
};

// ============================================
// IN-MEMORY STATE
// ============================================

let currentSettings: ToolSettings = { ...DEFAULT_SETTINGS };
let usageLog: ToolUsageLog[] = [];
let initialized = false;

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the tool registry
 */
export async function initializeToolRegistry(): Promise<void> {
  if (initialized) return;

  try {
    const savedSettings = await AsyncStorage.getItem(STORAGE_KEYS.TOOL_SETTINGS);
    if (savedSettings) {
      currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
    }

    const savedLog = await AsyncStorage.getItem(STORAGE_KEYS.TOOL_USAGE_LOG);
    if (savedLog) {
      usageLog = JSON.parse(savedLog);
    }

    initialized = true;
    console.log('[CoachToolRegistry] Initialized with', Object.keys(COACH_TOOLS).length, 'tools');
  } catch (error) {
    console.error('[CoachToolRegistry] Failed to initialize:', error);
    currentSettings = { ...DEFAULT_SETTINGS };
  }
}

// ============================================
// TOOL ACCESS CONTROL
// ============================================

/**
 * Check if a tool is enabled
 */
export function isToolEnabled(toolId: string): boolean {
  if (!COACH_TOOLS[toolId]) {
    console.warn(`[CoachToolRegistry] Unknown tool: ${toolId}`);
    return false;
  }
  return currentSettings.enabledTools[toolId] ?? COACH_TOOLS[toolId].enabled;
}

/**
 * Enable or disable a tool
 */
export async function setToolEnabled(toolId: string, enabled: boolean): Promise<void> {
  if (!COACH_TOOLS[toolId]) {
    console.warn(`[CoachToolRegistry] Cannot set unknown tool: ${toolId}`);
    return;
  }

  currentSettings.enabledTools[toolId] = enabled;
  await saveSettings();

  logToolUsage(toolId, `Tool ${enabled ? 'enabled' : 'disabled'}`, true);
}

/**
 * Enable or disable an entire category
 */
export async function setCategoryEnabled(category: ToolCategory, enabled: boolean): Promise<void> {
  const toolsInCategory = Object.entries(COACH_TOOLS)
    .filter(([_, tool]) => tool.category === category)
    .map(([id]) => id);

  for (const toolId of toolsInCategory) {
    currentSettings.enabledTools[toolId] = enabled;
  }

  await saveSettings();
  logToolUsage(`category:${category}`, `Category ${enabled ? 'enabled' : 'disabled'}`, true);
}

/**
 * Get all tools in a category
 */
export function getToolsByCategory(category: ToolCategory): CoachTool[] {
  return Object.values(COACH_TOOLS).filter(tool => tool.category === category);
}

/**
 * Get all enabled tools
 */
export function getEnabledTools(): CoachTool[] {
  return Object.values(COACH_TOOLS).filter(tool => isToolEnabled(tool.id));
}

/**
 * Get all disabled tools
 */
export function getDisabledTools(): CoachTool[] {
  return Object.values(COACH_TOOLS).filter(tool => !isToolEnabled(tool.id));
}

// ============================================
// TOOL VALIDATION
// ============================================

/**
 * Validate AI output against enabled tools
 * Returns list of tool triggers found and whether they're allowed
 */
export function validateAIOutput(text: string): {
  triggers: Array<{ toolId: string; match: string; allowed: boolean }>;
  hasBlockedTrigger: boolean;
  cleanText: string;
} {
  const triggers: Array<{ toolId: string; match: string; allowed: boolean }> = [];
  let cleanText = text;
  let hasBlockedTrigger = false;

  for (const [toolId, tool] of Object.entries(COACH_TOOLS)) {
    if (!tool.triggerPattern) continue;

    // Reset regex
    tool.triggerPattern.lastIndex = 0;
    let match;

    while ((match = tool.triggerPattern.exec(text)) !== null) {
      const allowed = isToolEnabled(toolId);
      triggers.push({
        toolId,
        match: match[0],
        allowed,
      });

      if (!allowed) {
        hasBlockedTrigger = true;
        // Remove blocked triggers from output
        cleanText = cleanText.replace(match[0], '');
      }

      // Log the trigger
      logToolUsage(toolId, `Triggered: ${match[0]}`, allowed);
    }
  }

  return {
    triggers,
    hasBlockedTrigger,
    cleanText: cleanText.trim(),
  };
}

// ============================================
// USAGE LOGGING
// ============================================

/**
 * Log tool usage
 */
export function logToolUsage(toolId: string, context: string, success: boolean, error?: string): void {
  if (!currentSettings.loggingEnabled) return;

  const entry: ToolUsageLog = {
    toolId,
    timestamp: new Date(),
    context,
    success,
    error,
  };

  usageLog.unshift(entry);

  // Trim log if too long
  if (usageLog.length > currentSettings.maxLogEntries) {
    usageLog = usageLog.slice(0, currentSettings.maxLogEntries);
  }

  // Save async (don't await)
  AsyncStorage.setItem(STORAGE_KEYS.TOOL_USAGE_LOG, JSON.stringify(usageLog)).catch(console.error);
}

/**
 * Get recent tool usage logs
 */
export function getUsageLogs(limit: number = 50): ToolUsageLog[] {
  return usageLog.slice(0, limit);
}

/**
 * Get logs for a specific tool
 */
export function getToolLogs(toolId: string, limit: number = 20): ToolUsageLog[] {
  return usageLog.filter(log => log.toolId === toolId).slice(0, limit);
}

/**
 * Clear usage logs
 */
export async function clearUsageLogs(): Promise<void> {
  usageLog = [];
  await AsyncStorage.removeItem(STORAGE_KEYS.TOOL_USAGE_LOG);
}

/**
 * Enable or disable logging
 */
export async function setLoggingEnabled(enabled: boolean): Promise<void> {
  currentSettings.loggingEnabled = enabled;
  await saveSettings();
}

// ============================================
// SETTINGS MANAGEMENT
// ============================================

/**
 * Save current settings
 */
async function saveSettings(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TOOL_SETTINGS, JSON.stringify(currentSettings));
  } catch (error) {
    console.error('[CoachToolRegistry] Failed to save settings:', error);
  }
}

/**
 * Get current settings
 */
export function getSettings(): ToolSettings {
  return { ...currentSettings };
}

/**
 * Reset to default settings
 */
export async function resetSettings(): Promise<void> {
  currentSettings = { ...DEFAULT_SETTINGS };
  await saveSettings();
}

// ============================================
// DEBUG & ADMIN HELPERS
// ============================================

/**
 * Get a summary of all tools for admin view
 */
export function getToolSummary(): {
  total: number;
  enabled: number;
  disabled: number;
  byCategory: Record<ToolCategory, { total: number; enabled: number }>;
  tools: Array<CoachTool & { currentlyEnabled: boolean }>;
} {
  const tools = Object.values(COACH_TOOLS);
  const enabledTools = tools.filter(t => isToolEnabled(t.id));

  const byCategory: Record<ToolCategory, { total: number; enabled: number }> = {
    skill_overlay: { total: 0, enabled: 0 },
    conversation: { total: 0, enabled: 0 },
    data_access: { total: 0, enabled: 0 },
    ui_control: { total: 0, enabled: 0 },
    external: { total: 0, enabled: 0 },
    therapeutic: { total: 0, enabled: 0 },
  };

  for (const tool of tools) {
    byCategory[tool.category].total++;
    if (isToolEnabled(tool.id)) {
      byCategory[tool.category].enabled++;
    }
  }

  return {
    total: tools.length,
    enabled: enabledTools.length,
    disabled: tools.length - enabledTools.length,
    byCategory,
    tools: tools.map(t => ({ ...t, currentlyEnabled: isToolEnabled(t.id) })),
  };
}

/**
 * Generate system prompt section describing available tools
 */
export function generateToolSystemPrompt(): string {
  const enabledTools = getEnabledTools();

  if (enabledTools.length === 0) {
    return 'No interactive tools are currently enabled.';
  }

  const lines = ['Available interactive tools:'];

  // Group by category
  const byCategory = new Map<ToolCategory, CoachTool[]>();
  for (const tool of enabledTools) {
    if (!byCategory.has(tool.category)) {
      byCategory.set(tool.category, []);
    }
    byCategory.get(tool.category)!.push(tool);
  }

  const categoryNames: Record<ToolCategory, string> = {
    skill_overlay: 'Skill Overlays',
    conversation: 'Conversation',
    data_access: 'Data Access',
    ui_control: 'UI Control',
    external: 'External Services',
    therapeutic: 'Therapeutic Techniques',
  };

  for (const [category, tools] of byCategory) {
    lines.push(`\n${categoryNames[category]}:`);
    for (const tool of tools) {
      lines.push(`- ${tool.name}: ${tool.description}`);
    }
  }

  return lines.join('\n');
}

/**
 * Print tool registry status to console (dev helper)
 */
export function debugPrintStatus(): void {
  const summary = getToolSummary();
  console.log('\n========== Coach Tool Registry ==========');
  console.log(`Total tools: ${summary.total}`);
  console.log(`Enabled: ${summary.enabled}`);
  console.log(`Disabled: ${summary.disabled}`);
  console.log('\nBy Category:');
  for (const [cat, stats] of Object.entries(summary.byCategory)) {
    console.log(`  ${cat}: ${stats.enabled}/${stats.total} enabled`);
  }
  console.log('\nRecent Usage:');
  for (const log of usageLog.slice(0, 5)) {
    console.log(`  [${log.toolId}] ${log.context} - ${log.success ? 'OK' : 'FAILED'}`);
  }
  console.log('==========================================\n');
}

// ============================================
// EXPORT
// ============================================

export default {
  // Initialization
  initializeToolRegistry,

  // Tool access
  isToolEnabled,
  setToolEnabled,
  setCategoryEnabled,
  getToolsByCategory,
  getEnabledTools,
  getDisabledTools,

  // Validation
  validateAIOutput,

  // Logging
  logToolUsage,
  getUsageLogs,
  getToolLogs,
  clearUsageLogs,
  setLoggingEnabled,

  // Settings
  getSettings,
  resetSettings,

  // Admin/Debug
  getToolSummary,
  generateToolSystemPrompt,
  debugPrintStatus,

  // Constants
  COACH_TOOLS,
};
