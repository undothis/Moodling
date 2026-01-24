/**
 * LLM Provider Service
 *
 * Abstraction layer for multiple LLM backends.
 * Supports:
 * - Claude API (current default)
 * - Llama (local or server-based)
 * - Apple on-device LLMs (Core ML / Apple Intelligence)
 * - Android on-device LLMs (ML Kit / Gemini Nano)
 * - Desktop LLMs (Ollama, llama.cpp, etc.)
 *
 * Each service that needs LLM context exports in a standardized format
 * that this provider translates for the active backend.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const LLM_PROVIDER_KEY = 'moodleaf_llm_provider';
const LLM_CONFIG_KEY = 'moodleaf_llm_config';

// ============================================
// TYPES
// ============================================

/**
 * Supported LLM providers
 */
export type LLMProvider =
  | 'claude'           // Claude API (Anthropic) - current default
  | 'llama_local'      // Local Llama via llama.cpp/MLX
  | 'llama_server'     // Remote Llama server
  | 'apple_coreml'     // Apple Core ML models
  | 'apple_intelligence' // Apple Intelligence (iOS 18+)
  | 'android_mlkit'    // Android ML Kit
  | 'android_gemini'   // Gemini Nano (on-device)
  | 'ollama'           // Ollama (desktop - Mac/Linux/Windows)
  | 'llamacpp'         // llama.cpp (direct - Mac/Linux/Windows)
  | 'windows_copilot'  // Windows Copilot+ PC (NPU)
  | 'openai';          // OpenAI API (fallback)

/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
  maxContextLength: number;
  supportsStreaming: boolean;
  supportsImages: boolean;
  supportsTools: boolean; // Function calling
  isOnDevice: boolean;
  requiresAPIKey: boolean;
  platforms: ('ios' | 'android' | 'web' | 'macos' | 'windows' | 'linux')[];
}

/**
 * Standardized context that services export
 * Any LLM backend can consume this format
 */
export interface StandardizedContext {
  // User profile (from MoodPrint)
  userProfile?: {
    emotionalState?: string;
    preferredStyle?: string;
    cognitivePatterns?: string[];
    recentThemes?: string[];
  };

  // Life context (from lifeContextService)
  lifeContext?: {
    keyPeople?: string[];
    activeTopics?: string[];
    recentEvents?: string[];
  };

  // Health context (from healthKitService)
  healthContext?: {
    sleepQuality?: string;
    activityLevel?: string;
    heartRateStatus?: string;
  };

  // Accountability context (from aiAccountabilityService)
  accountabilityContext?: {
    activeLimits?: { name: string; current: number; max: number }[];
    intensity?: string;
    isPaused?: boolean;
  };

  // Skills context (from accountabilityService)
  skillsContext?: {
    recentPractice?: { skillId: string; lastPracticed: string }[];
    streaks?: { skillId: string; days: number }[];
    suggestedSkills?: string[];
  };

  // Drink pacing context (from drinkPacingService)
  drinkPacingContext?: {
    isActive: boolean;
    drinksConsumed?: number;
    maxDrinks?: number;
    eventName?: string;
  };

  // Insight context (from insightService)
  insightContext?: {
    recentInsights?: { title: string; strength: string }[];
    pendingCongratulations?: string;
  };

  // Current conversation
  conversationHistory?: {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }[];
}

/**
 * Training data export format (for fine-tuning)
 */
export interface TrainingExample {
  id: string;
  instruction: string;     // What we want the model to learn
  input: string;           // User message/scenario
  output: string;          // Ideal response
  context?: StandardizedContext; // Context that was available
  metadata: {
    source: string;        // Which service generated this
    category: string;      // Topic category
    qualityScore: number;  // 0-1 quality rating
    timestamp: string;
  };
}

// ============================================
// PROVIDER CAPABILITIES
// ============================================

const PROVIDER_CAPABILITIES: Record<LLMProvider, ProviderCapabilities> = {
  claude: {
    maxContextLength: 200000,
    supportsStreaming: true,
    supportsImages: true,
    supportsTools: true,
    isOnDevice: false,
    requiresAPIKey: true,
    platforms: ['ios', 'android', 'web', 'macos', 'windows', 'linux'],
  },
  llama_local: {
    maxContextLength: 8192,
    supportsStreaming: true,
    supportsImages: false, // Depends on model
    supportsTools: false,
    isOnDevice: true,
    requiresAPIKey: false,
    platforms: ['ios', 'macos'], // iOS/macOS via MLX
  },
  llama_server: {
    maxContextLength: 8192,
    supportsStreaming: true,
    supportsImages: false,
    supportsTools: false,
    isOnDevice: false,
    requiresAPIKey: false, // Self-hosted
    platforms: ['ios', 'android', 'web', 'macos', 'windows', 'linux'],
  },
  apple_coreml: {
    maxContextLength: 4096,
    supportsStreaming: false,
    supportsImages: true,
    supportsTools: false,
    isOnDevice: true,
    requiresAPIKey: false,
    platforms: ['ios', 'macos'],
  },
  apple_intelligence: {
    maxContextLength: 8192, // Estimated
    supportsStreaming: true,
    supportsImages: true,
    supportsTools: true,
    isOnDevice: true,
    requiresAPIKey: false,
    platforms: ['ios', 'macos'], // iOS 18+, macOS Sequoia+
  },
  android_mlkit: {
    maxContextLength: 4096,
    supportsStreaming: false,
    supportsImages: true,
    supportsTools: false,
    isOnDevice: true,
    requiresAPIKey: false,
    platforms: ['android'],
  },
  android_gemini: {
    maxContextLength: 8192,
    supportsStreaming: true,
    supportsImages: true,
    supportsTools: true,
    isOnDevice: true,
    requiresAPIKey: false, // On-device Gemini Nano
    platforms: ['android'],
  },
  ollama: {
    maxContextLength: 8192,
    supportsStreaming: true,
    supportsImages: true, // Depends on model
    supportsTools: true,
    isOnDevice: true, // Runs locally
    requiresAPIKey: false,
    platforms: ['macos', 'windows', 'linux'],
  },
  llamacpp: {
    maxContextLength: 8192,
    supportsStreaming: true,
    supportsImages: false, // Depends on model
    supportsTools: false,
    isOnDevice: true,
    requiresAPIKey: false,
    platforms: ['macos', 'windows', 'linux'],
  },
  windows_copilot: {
    maxContextLength: 8192, // Estimated for Copilot+ PC NPU
    supportsStreaming: true,
    supportsImages: true,
    supportsTools: true,
    isOnDevice: true, // NPU acceleration
    requiresAPIKey: false,
    platforms: ['windows'],
  },
  openai: {
    maxContextLength: 128000,
    supportsStreaming: true,
    supportsImages: true,
    supportsTools: true,
    isOnDevice: false,
    requiresAPIKey: true,
    platforms: ['ios', 'android', 'web', 'macos', 'windows', 'linux'],
  },
};

// ============================================
// PROVIDER MANAGEMENT
// ============================================

/**
 * Get the currently active LLM provider
 */
export async function getActiveProvider(): Promise<LLMProvider> {
  try {
    const provider = await AsyncStorage.getItem(LLM_PROVIDER_KEY);
    if (provider && Object.keys(PROVIDER_CAPABILITIES).includes(provider)) {
      return provider as LLMProvider;
    }
  } catch {
    // Default
  }
  return 'claude'; // Default to Claude
}

/**
 * Set the active LLM provider
 */
export async function setActiveProvider(provider: LLMProvider): Promise<void> {
  await AsyncStorage.setItem(LLM_PROVIDER_KEY, provider);
}

/**
 * Get capabilities of a provider
 */
export function getProviderCapabilities(provider: LLMProvider): ProviderCapabilities {
  return PROVIDER_CAPABILITIES[provider];
}

/**
 * Detect current platform
 */
function getCurrentPlatform(): 'ios' | 'android' | 'web' | 'macos' | 'windows' | 'linux' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';

  // For web/desktop, try to detect the actual OS
  if (Platform.OS === 'web' || Platform.OS === 'windows' || Platform.OS === 'macos') {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('win')) return 'windows';
      if (ua.includes('mac')) return 'macos';
      if (ua.includes('linux')) return 'linux';
    }
    return 'web';
  }

  return 'web';
}

/**
 * Get providers available on current platform
 */
export function getAvailableProviders(): LLMProvider[] {
  const currentPlatform = getCurrentPlatform();

  return (Object.keys(PROVIDER_CAPABILITIES) as LLMProvider[]).filter(
    provider => PROVIDER_CAPABILITIES[provider].platforms.includes(currentPlatform)
  );
}

/**
 * Get on-device providers for current platform
 */
export function getOnDeviceProviders(): LLMProvider[] {
  return getAvailableProviders().filter(
    provider => PROVIDER_CAPABILITIES[provider].isOnDevice
  );
}

// ============================================
// CONTEXT FORMATTING
// ============================================

/**
 * Format standardized context for a specific provider
 */
export function formatContextForProvider(
  context: StandardizedContext,
  provider: LLMProvider
): string {
  const capabilities = PROVIDER_CAPABILITIES[provider];

  // Build context string with appropriate detail level
  const parts: string[] = [];

  // User profile
  if (context.userProfile) {
    parts.push('USER PROFILE:');
    if (context.userProfile.emotionalState) {
      parts.push(`  Current state: ${context.userProfile.emotionalState}`);
    }
    if (context.userProfile.preferredStyle) {
      parts.push(`  Preferred style: ${context.userProfile.preferredStyle}`);
    }
  }

  // Life context (truncate for smaller context windows)
  if (context.lifeContext && capabilities.maxContextLength > 4096) {
    parts.push('\nLIFE CONTEXT:');
    if (context.lifeContext.keyPeople?.length) {
      parts.push(`  Key people: ${context.lifeContext.keyPeople.slice(0, 5).join(', ')}`);
    }
    if (context.lifeContext.activeTopics?.length) {
      parts.push(`  Active topics: ${context.lifeContext.activeTopics.slice(0, 5).join(', ')}`);
    }
  }

  // Health context
  if (context.healthContext) {
    parts.push('\nHEALTH:');
    if (context.healthContext.sleepQuality) {
      parts.push(`  Sleep: ${context.healthContext.sleepQuality}`);
    }
    if (context.healthContext.activityLevel) {
      parts.push(`  Activity: ${context.healthContext.activityLevel}`);
    }
  }

  // Accountability context
  if (context.accountabilityContext) {
    const acc = context.accountabilityContext;
    if (!acc.isPaused && acc.activeLimits?.length) {
      parts.push('\nACCOUNTABILITY:');
      parts.push(`  Intensity: ${acc.intensity || 'moderate'}`);
      for (const limit of acc.activeLimits.slice(0, 3)) {
        parts.push(`  ${limit.name}: ${limit.current}/${limit.max}`);
      }
    }
  }

  // Drink pacing (if active)
  if (context.drinkPacingContext?.isActive) {
    const dp = context.drinkPacingContext;
    parts.push('\nDRINK PACING (ACTIVE):');
    if (dp.eventName) parts.push(`  Event: ${dp.eventName}`);
    parts.push(`  Drinks: ${dp.drinksConsumed || 0}${dp.maxDrinks ? `/${dp.maxDrinks}` : ''}`);
  }

  // Skills context
  if (context.skillsContext?.suggestedSkills?.length) {
    parts.push('\nSUGGESTED SKILLS:');
    parts.push(`  ${context.skillsContext.suggestedSkills.slice(0, 3).join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Truncate context to fit provider's context window
 */
export function truncateContextForProvider(
  context: string,
  provider: LLMProvider,
  reservedTokens: number = 1024 // Reserve for response
): string {
  const maxTokens = PROVIDER_CAPABILITIES[provider].maxContextLength - reservedTokens;
  const currentTokens = estimateTokens(context);

  if (currentTokens <= maxTokens) {
    return context;
  }

  // Truncate from the middle (keep start and end)
  const targetChars = maxTokens * 4;
  const startChars = Math.floor(targetChars * 0.6);
  const endChars = Math.floor(targetChars * 0.3);

  return context.slice(0, startChars) + '\n...[truncated]...\n' + context.slice(-endChars);
}

// ============================================
// TRAINING DATA HOOKS
// ============================================

/**
 * Service registration for training data contribution
 */
interface TrainingDataSource {
  name: string;
  getTrainingExamples: () => Promise<TrainingExample[]>;
}

const registeredSources: TrainingDataSource[] = [];

/**
 * Register a service as a training data source
 */
export function registerTrainingDataSource(source: TrainingDataSource): void {
  if (!registeredSources.find(s => s.name === source.name)) {
    registeredSources.push(source);
    console.log(`[LLMProvider] Registered training source: ${source.name}`);
  }
}

/**
 * Get all training examples from registered sources
 */
export async function getAllTrainingExamples(): Promise<TrainingExample[]> {
  const allExamples: TrainingExample[] = [];

  for (const source of registeredSources) {
    try {
      const examples = await source.getTrainingExamples();
      allExamples.push(...examples);
    } catch (error) {
      console.error(`[LLMProvider] Failed to get examples from ${source.name}:`, error);
    }
  }

  return allExamples;
}

/**
 * Export training data in format suitable for fine-tuning
 */
export async function exportTrainingDataForProvider(
  provider: LLMProvider,
  format: 'alpaca' | 'sharegpt' | 'openai' = 'alpaca'
): Promise<object[]> {
  const examples = await getAllTrainingExamples();

  switch (format) {
    case 'alpaca':
      return examples.map(ex => ({
        instruction: ex.instruction,
        input: ex.input,
        output: ex.output,
      }));

    case 'sharegpt':
      return examples.map(ex => ({
        conversations: [
          { from: 'human', value: ex.input },
          { from: 'gpt', value: ex.output },
        ],
      }));

    case 'openai':
      return examples.map(ex => ({
        messages: [
          { role: 'system', content: ex.instruction },
          { role: 'user', content: ex.input },
          { role: 'assistant', content: ex.output },
        ],
      }));

    default:
      return examples;
  }
}

// ============================================
// PROVIDER-SPECIFIC INITIALIZATION
// ============================================

/**
 * Check if a provider is available and ready
 */
export async function isProviderReady(provider: LLMProvider): Promise<boolean> {
  const capabilities = PROVIDER_CAPABILITIES[provider];

  // Check platform compatibility
  const currentPlatform = getCurrentPlatform();
  if (!capabilities.platforms.includes(currentPlatform)) {
    return false;
  }

  // Provider-specific checks
  switch (provider) {
    case 'claude':
      // Check if API key is set
      const claudeKey = await AsyncStorage.getItem('anthropic_api_key');
      return !!claudeKey;

    case 'openai':
      const openaiKey = await AsyncStorage.getItem('openai_api_key');
      return !!openaiKey;

    case 'apple_intelligence':
      // Would check for iOS 18+ / macOS Sequoia+ and Apple Intelligence availability
      // For now, return false as it's not implemented
      return false;

    case 'apple_coreml':
      // Would check for Core ML model availability
      return false;

    case 'android_gemini':
      // Would check for Gemini Nano availability on device
      return false;

    case 'android_mlkit':
      // Would check for ML Kit availability
      return false;

    case 'ollama':
      // Would check if Ollama server is running at localhost:11434
      // In production: try { await fetch('http://localhost:11434/api/version'); return true; } catch { return false; }
      return false;

    case 'llamacpp':
      // Would check if llama.cpp binary is available
      return false;

    case 'windows_copilot':
      // Would check for Windows Copilot+ PC NPU availability
      // This requires specific Windows API calls
      return false;

    case 'llama_local':
      // Would check for MLX model availability (Apple Silicon)
      return false;

    case 'llama_server':
      // Would check for remote Llama server availability
      const llamaServerUrl = await AsyncStorage.getItem('llama_server_url');
      return !!llamaServerUrl;

    default:
      return false;
  }
}

/**
 * Get recommended provider for current platform
 */
export async function getRecommendedProvider(): Promise<LLMProvider> {
  const available = getAvailableProviders();
  const currentPlatform = getCurrentPlatform();

  // Platform-specific priority lists
  let priorityList: LLMProvider[];

  switch (currentPlatform) {
    case 'ios':
    case 'macos':
      // Apple: Prefer Apple Intelligence > Core ML > Local Llama > Claude
      priorityList = ['apple_intelligence', 'apple_coreml', 'llama_local', 'ollama', 'claude', 'openai'];
      break;

    case 'android':
      // Android: Prefer Gemini Nano > ML Kit > Claude
      priorityList = ['android_gemini', 'android_mlkit', 'llama_server', 'claude', 'openai'];
      break;

    case 'windows':
      // Windows: Prefer Copilot+ NPU > Ollama > llama.cpp > Claude
      priorityList = ['windows_copilot', 'ollama', 'llamacpp', 'llama_server', 'claude', 'openai'];
      break;

    case 'linux':
      // Linux: Prefer Ollama > llama.cpp > Claude
      priorityList = ['ollama', 'llamacpp', 'llama_server', 'claude', 'openai'];
      break;

    default:
      // Web/other: Claude is usually the best option
      priorityList = ['claude', 'llama_server', 'openai'];
  }

  // Find first available and ready provider
  for (const provider of priorityList) {
    if (available.includes(provider) && await isProviderReady(provider)) {
      return provider;
    }
  }

  return 'claude'; // Fallback
}
