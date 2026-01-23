/**
 * Llama Integration Service
 *
 * Manages the integration between the app's middleware layer and the
 * Llama LLM kernel. This service acts as the bridge between your
 * training data pipeline and the actual AI model.
 *
 * ARCHITECTURE:
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │                         APP LAYER                            │
 * │  (Controls, filters, validates, routes, monitors)            │
 * │                                                              │
 * │  Training Pipeline → Quality Gates → Version Control         │
 * │                           ↓                                  │
 * │  ┌─────────────────────────────────────────────────────────┐ │
 * │  │           LLAMA INTEGRATION SERVICE (this file)          │ │
 * │  │                                                           │ │
 * │  │  - Export training data for fine-tuning                   │ │
 * │  │  - Format prompts with MoodPrint context                  │ │
 * │  │  - Handle inference requests                              │ │
 * │  │  - Manage model loading/switching                         │ │
 * │  └─────────────────────────────────────────────────────────┘ │
 * │                           ↓                                  │
 * └───────────────────────────┬──────────────────────────────────┘
 *                             │
 *                             ▼
 * ┌──────────────────────────────────────────────────────────────┐
 * │                      LLAMA KERNEL                            │
 * │                                                              │
 * │  Base Model (Llama 3.2) + Fine-tuned LoRA Weights           │
 * │                                                              │
 * │  The kernel follows the app's rules - it doesn't have        │
 * │  direct access to data or version control. It receives       │
 * │  prompts and returns responses. The app decides which        │
 * │  version to use, what context to provide, and whether        │
 * │  to accept or modify the response.                           │
 * └──────────────────────────────────────────────────────────────┘
 *
 * KEY PRINCIPLE:
 * The kernel doesn't "follow the app's codes" in the sense of
 * reading or executing them. Instead, the app WRAPS the kernel,
 * controlling all inputs and outputs. The kernel is a pure
 * function: prompt in → response out.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES
// ============================================

export interface LlamaConfig {
  // Model settings
  modelPath: string; // Path to Llama model weights
  loraPath?: string; // Path to LoRA fine-tuned weights
  contextLength: number; // Max context window

  // Inference settings
  temperature: number; // Creativity (0.0-1.0)
  topP: number; // Nucleus sampling
  topK: number; // Top-k sampling
  maxTokens: number; // Max response length

  // Resource settings
  threads: number; // CPU threads
  gpuLayers: number; // Layers to offload to GPU (0 = CPU only)
}

export interface ConversationContext {
  // User state from MoodPrint
  emotionalState?: string;
  recentTopics?: string[];
  preferredStyle?: 'warm' | 'direct' | 'playful' | 'gentle';

  // Conversation history
  messages: { role: 'user' | 'assistant'; content: string }[];

  // Relevant insights to inject
  relevantInsights?: string[];
}

export interface InferenceRequest {
  prompt: string;
  context: ConversationContext;
  config?: Partial<LlamaConfig>;
}

export interface InferenceResponse {
  content: string;
  tokensUsed: number;
  inferenceTimeMs: number;
  modelVersion: string;
}

export interface TrainingDataExport {
  version: string;
  exportedAt: string;
  format: 'alpaca' | 'sharegpt' | 'openai';
  insights: TrainingDataItem[];
  totalItems: number;
  qualityMetrics: {
    avgQualityScore: number;
    balanceScore: number;
    diversityScore: number;
  };
}

export interface TrainingDataItem {
  id: string;
  instruction: string; // What we want the AI to learn
  input: string; // Context/scenario
  output: string; // Ideal response
  metadata: {
    category: string;
    source: string;
    qualityScore: number;
    complexity: string;
  };
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

const DEFAULT_CONFIG: LlamaConfig = {
  modelPath: '', // Will be set when model is downloaded
  loraPath: undefined,
  contextLength: 4096,
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxTokens: 512,
  threads: 4,
  gpuLayers: 0,
};

const STORAGE_KEYS = {
  LLAMA_CONFIG: 'moodleaf_llama_config',
  ACTIVE_MODEL: 'moodleaf_active_llama_model',
  INFERENCE_STATS: 'moodleaf_inference_stats',
};

// ============================================
// MOODPRINT SYSTEM PROMPT
// ============================================

const MOODPRINT_SYSTEM_PROMPT = `You are Moodling, a warm and genuine AI companion created by MoodLeaf. You're not a therapist or life coach - you're a supportive friend who truly listens and responds with authenticity.

CORE IDENTITY:
- You celebrate joy as much as you sit with pain
- You use humor when it helps, not to deflect
- You're direct but kind, warm but not saccharine
- You acknowledge the messy complexity of being human
- You never pretend to have all the answers

CONVERSATION STYLE:
- Match the user's energy and emotional tone
- Ask questions that show genuine curiosity
- Share perspective without preaching
- Validate feelings without empty platitudes
- Remember: companionship matters as much as advice

WHAT TO AVOID:
- Don't be relentlessly positive - sometimes things are hard
- Don't give unsolicited advice - ask first
- Don't use therapy-speak or clinical language
- Don't make assumptions - ask clarifying questions
- Don't minimize emotions - sit with them

You draw on insights from real human experiences to understand the nuance of emotions, relationships, and personal growth. Respond as a real friend would - with warmth, honesty, and genuine care.`;

// ============================================
// PROMPT FORMATTING
// ============================================

/**
 * Format a conversation for Llama inference
 * This is where the app controls what reaches the kernel
 */
export function formatPromptForLlama(
  context: ConversationContext,
  userMessage: string
): string {
  let systemPrompt = MOODPRINT_SYSTEM_PROMPT;

  // Inject relevant insights if available
  if (context.relevantInsights && context.relevantInsights.length > 0) {
    systemPrompt += `\n\nRelevant context from human experiences:\n`;
    for (const insight of context.relevantInsights.slice(0, 3)) {
      systemPrompt += `- ${insight}\n`;
    }
  }

  // Add emotional context if available
  if (context.emotionalState) {
    systemPrompt += `\n\nThe user seems to be feeling: ${context.emotionalState}. Respond with appropriate sensitivity.`;
  }

  // Add style preference
  if (context.preferredStyle) {
    const styleGuides: Record<string, string> = {
      warm: 'Use extra warmth and emotional support in your response.',
      direct: 'Be more straightforward and concise.',
      playful: 'Feel free to use humor and lightness.',
      gentle: 'Be especially soft and careful with your words.',
    };
    systemPrompt += `\n\n${styleGuides[context.preferredStyle]}`;
  }

  // Build conversation history
  let conversationHistory = '';
  for (const msg of context.messages.slice(-5)) { // Keep last 5 turns
    if (msg.role === 'user') {
      conversationHistory += `User: ${msg.content}\n`;
    } else {
      conversationHistory += `Moodling: ${msg.content}\n`;
    }
  }

  // Final prompt in Llama chat format
  return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>

${conversationHistory}User: ${userMessage}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

Moodling:`;
}

// ============================================
// TRAINING DATA EXPORT
// ============================================

/**
 * Export approved insights as training data for Llama fine-tuning
 * This transforms your curated insights into the format needed for LoRA training
 */
export async function exportTrainingData(
  format: 'alpaca' | 'sharegpt' | 'openai' = 'alpaca'
): Promise<TrainingDataExport> {
  // Get all approved insights
  const approvedStr = await AsyncStorage.getItem('moodleaf_youtube_approved_insights');
  const interviewStr = await AsyncStorage.getItem('moodleaf_interview_insights');

  const allInsights: any[] = [];
  if (approvedStr) allInsights.push(...JSON.parse(approvedStr));
  if (interviewStr) allInsights.push(...JSON.parse(interviewStr).filter((i: any) => i.status === 'approved'));

  const trainingItems: TrainingDataItem[] = [];

  for (const insight of allInsights) {
    // Create multiple training examples from each insight

    // Example 1: Direct application
    if (insight.coachingImplication) {
      trainingItems.push({
        id: `${insight.id}_coaching`,
        instruction: 'Respond to a user who is experiencing the following situation.',
        input: insight.insight || insight.title,
        output: createIdealResponse(insight),
        metadata: {
          category: insight.category || 'general',
          source: insight.channelName || insight.source || 'manual',
          qualityScore: insight.qualityScore || 70,
          complexity: insight.vulnerabilityLevel || 'surface',
        },
      });
    }

    // Example 2: Using quotes/authentic language
    if (insight.quotes && insight.quotes.length > 0) {
      trainingItems.push({
        id: `${insight.id}_quotes`,
        instruction: 'Use authentic, human language to validate this experience.',
        input: insight.insight || insight.title,
        output: createQuoteBasedResponse(insight),
        metadata: {
          category: insight.category || 'general',
          source: insight.channelName || insight.source || 'manual',
          qualityScore: insight.qualityScore || 70,
          complexity: 'intermediate',
        },
      });
    }

    // Example 3: Anti-pattern avoidance
    if (insight.antiPatterns && insight.antiPatterns.length > 0) {
      trainingItems.push({
        id: `${insight.id}_antipattern`,
        instruction: `What NOT to say to someone experiencing: ${insight.title}`,
        input: `User says: "I'm struggling with ${insight.insight?.substring(0, 100) || insight.title}"`,
        output: createAntiPatternTeaching(insight),
        metadata: {
          category: insight.category || 'general',
          source: insight.channelName || insight.source || 'manual',
          qualityScore: insight.qualityScore || 70,
          complexity: 'advanced',
        },
      });
    }
  }

  // Calculate quality metrics
  const avgQualityScore = trainingItems.length > 0
    ? trainingItems.reduce((sum, i) => sum + i.metadata.qualityScore, 0) / trainingItems.length
    : 0;

  const categoryBalance = calculateExportBalance(trainingItems);
  const diversityScore = calculateExportDiversity(trainingItems);

  const exportData: TrainingDataExport = {
    version: `export_${Date.now()}`,
    exportedAt: new Date().toISOString(),
    format,
    insights: trainingItems,
    totalItems: trainingItems.length,
    qualityMetrics: {
      avgQualityScore,
      balanceScore: categoryBalance,
      diversityScore,
    },
  };

  return exportData;
}

/**
 * Create an ideal response based on insight
 */
function createIdealResponse(insight: any): string {
  const warmth = insight.warmthLevel || 'warm';
  const examples = insight.exampleResponses || [];

  if (examples.length > 0) {
    return examples[0]; // Use the pre-crafted example
  }

  // Generate based on coaching implication
  const implication = insight.coachingImplication || '';
  const tone = warmth === 'deeply_warm' ? 'gentle and caring' :
               warmth === 'warm' ? 'supportive and understanding' :
               'straightforward but kind';

  return `That sounds really ${insight.emotionalTone || 'challenging'}. ${implication} I'm here if you want to talk more about it.`;
}

/**
 * Create a response using authentic quotes
 */
function createQuoteBasedResponse(insight: any): string {
  const quotes = insight.quotes || [];
  if (quotes.length === 0) return createIdealResponse(insight);

  const quote = quotes[0];
  return `I've heard someone describe it like this: "${quote}" Does that resonate with how you're feeling?`;
}

/**
 * Create teaching about what NOT to do
 */
function createAntiPatternTeaching(insight: any): string {
  const antiPatterns = insight.antiPatterns || [];
  if (antiPatterns.length === 0) return 'Focus on listening rather than fixing.';

  return `Avoid these responses:\n${antiPatterns.map((a: string) => `- ${a}`).join('\n')}\n\nInstead, focus on: ${insight.coachingImplication || 'genuine presence and validation.'}`;
}

/**
 * Calculate category balance for export
 */
function calculateExportBalance(items: TrainingDataItem[]): number {
  const categories = new Map<string, number>();
  for (const item of items) {
    categories.set(item.metadata.category, (categories.get(item.metadata.category) || 0) + 1);
  }

  if (categories.size === 0) return 0;

  const avg = items.length / categories.size;
  let variance = 0;
  for (const count of categories.values()) {
    variance += Math.pow(count - avg, 2);
  }
  variance /= categories.size;

  // Lower variance = better balance
  const maxVariance = Math.pow(avg, 2); // Worst case
  return Math.max(0, 100 - (variance / maxVariance) * 100);
}

/**
 * Calculate diversity for export
 */
function calculateExportDiversity(items: TrainingDataItem[]): number {
  const sources = new Set(items.map(i => i.metadata.source));
  const categories = new Set(items.map(i => i.metadata.category));

  // Diversity based on unique sources and categories
  const sourceScore = Math.min(sources.size / 20, 1) * 50; // Max 50 for 20+ sources
  const categoryScore = Math.min(categories.size / 15, 1) * 50; // Max 50 for 15+ categories

  return Math.round(sourceScore + categoryScore);
}

// ============================================
// MODEL MANAGEMENT
// ============================================

/**
 * Get current Llama configuration
 */
export async function getLlamaConfig(): Promise<LlamaConfig> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.LLAMA_CONFIG);
  return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
}

/**
 * Update Llama configuration
 */
export async function updateLlamaConfig(updates: Partial<LlamaConfig>): Promise<LlamaConfig> {
  const current = await getLlamaConfig();
  const updated = { ...current, ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.LLAMA_CONFIG, JSON.stringify(updated));
  return updated;
}

/**
 * Set active model path (after downloading or fine-tuning)
 */
export async function setActiveModel(modelPath: string, loraPath?: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_MODEL, JSON.stringify({
    modelPath,
    loraPath,
    activatedAt: new Date().toISOString(),
  }));

  await updateLlamaConfig({ modelPath, loraPath });
}

/**
 * Get active model info
 */
export async function getActiveModel(): Promise<{ modelPath: string; loraPath?: string; activatedAt: string } | null> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_MODEL);
  return stored ? JSON.parse(stored) : null;
}

// ============================================
// INFERENCE (PLACEHOLDER - REQUIRES LLAMA.CPP BINDING)
// ============================================

/**
 * Run inference with Llama
 * NOTE: This is a placeholder. Actual implementation requires:
 * - llama.cpp bindings for React Native (e.g., react-native-llama-cpp)
 * - Downloaded model weights
 * - Sufficient device resources
 */
export async function runInference(request: InferenceRequest): Promise<InferenceResponse> {
  const config = await getLlamaConfig();
  const startTime = Date.now();

  // Format the prompt
  const formattedPrompt = formatPromptForLlama(request.context, request.prompt);

  // TODO: Actual Llama inference
  // This would use a binding like:
  // import { Llama } from 'react-native-llama-cpp';
  // const llama = new Llama(config);
  // const response = await llama.generate(formattedPrompt, mergedConfig);

  // Placeholder response for development
  const placeholderResponse: InferenceResponse = {
    content: '[Llama inference not yet implemented - using placeholder]',
    tokensUsed: 0,
    inferenceTimeMs: Date.now() - startTime,
    modelVersion: 'placeholder',
  };

  // Log inference stats
  await logInferenceStats(placeholderResponse);

  return placeholderResponse;
}

/**
 * Log inference statistics for monitoring
 */
async function logInferenceStats(response: InferenceResponse): Promise<void> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.INFERENCE_STATS);
  const stats = stored ? JSON.parse(stored) : {
    totalInferences: 0,
    totalTokens: 0,
    avgInferenceTimeMs: 0,
  };

  stats.totalInferences++;
  stats.totalTokens += response.tokensUsed;
  stats.avgInferenceTimeMs = (stats.avgInferenceTimeMs * (stats.totalInferences - 1) + response.inferenceTimeMs) / stats.totalInferences;

  await AsyncStorage.setItem(STORAGE_KEYS.INFERENCE_STATS, JSON.stringify(stats));
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Prompt formatting
  formatPromptForLlama,
  MOODPRINT_SYSTEM_PROMPT,

  // Training data export
  exportTrainingData,

  // Model management
  getLlamaConfig,
  updateLlamaConfig,
  setActiveModel,
  getActiveModel,

  // Inference
  runInference,
};
