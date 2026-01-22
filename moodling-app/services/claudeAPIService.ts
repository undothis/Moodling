/**
 * Claude API Service
 *
 * Handles therapeutic conversations via Claude API.
 * Following Mood Leaf Ethics:
 * - Never diagnose, always descriptive
 * - Tentative language
 * - Encourage real-world connection
 * - Crisis resources when needed
 *
 * Unit 18: Claude API Integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToneInstruction, getTonePreferences, ToneStyle } from './tonePreferencesService';
import { getContextForClaude } from './userContextService';
import { getLifeContextForClaude } from './lifeContextService';
import { getHealthContextForClaude, isHealthKitEnabled } from './healthKitService';
import { getCorrelationSummaryForClaude } from './healthInsightService';
import { getLogsContextForClaude, getDetailedLogsContextForClaude } from './quickLogsService';
import { psychAnalysisService } from './psychAnalysisService';
import {
  getCoachSettings,
  generatePersonalityPrompt,
  getAdaptivePersona,
  getChronotypeContextForClaude,
  PERSONAS,
} from './coachPersonalityService';
import { getCoachModeSystemPrompt } from './coachModeService';
import { getLifestyleFactorsContextForClaude } from './patternService';
import { getExposureContextForClaude } from './exposureLadderService';
import { getCalendarContextForClaude, isCalendarEnabled } from './calendarService';
import { getRecentJournalContextForClaude } from './journalStorage';
import {
  buildConversationContext as buildControllerContext,
  generateResponseDirectives,
  buildPromptModifiers,
  detectUserEnergy,
  detectUserMood,
  extractTopics,
  ResponseDirectives,
} from './conversationController';
import { scoreExchange } from './humanScoreService';
import {
  getMemoryContextForLLM,
  addMessageToSession,
  updateSessionTopics,
} from './memoryTierService';

// Storage keys
const API_KEY_STORAGE = 'moodling_claude_api_key';
const COST_TOTAL_KEY = 'moodling_api_cost_total';
const COST_MONTHLY_KEY = 'moodling_api_cost_monthly';
const COST_RESET_DATE_KEY = 'moodling_api_cost_reset_date';

/**
 * Claude API Configuration
 */
export const CLAUDE_CONFIG = {
  baseURL: 'https://api.anthropic.com/v1/messages',
  // Use Haiku for development (cheapest, fast)
  developmentModel: 'claude-3-haiku-20240307',
  // Use Sonnet for production (higher quality)
  productionModel: 'claude-sonnet-4-20250514',
  // Default to Haiku
  model: 'claude-3-haiku-20240307',
  maxTokens: 300, // Keep responses concise
  apiVersion: '2023-06-01',
};

/**
 * Pricing per 1K tokens (as of 2024)
 */
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
};

/**
 * Chat message in conversation
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * Context for building personalized responses
 */
export interface ConversationContext {
  recentMood?: { emoji: string; description: string };
  upcomingEvent?: { title: string; time: Date };
  relevantPatterns?: { shortDescription: string }[];
  lastNightSleep?: number;
  recentMessages: ChatMessage[];
  toneStyles?: ToneStyle[];
}

/**
 * AI Response from Claude or fallback
 */
export interface AIResponse {
  text: string;
  source: 'claudeAPI' | 'fallback' | 'crisis';
  cost: number;
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * Claude API Request format
 */
interface ClaudeRequest {
  model: string;
  max_tokens: number;
  system: string;
  messages: { role: string; content: string }[];
}

/**
 * Claude API Response format
 */
interface ClaudeAPIResponse {
  content: { type: string; text: string }[];
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Crisis detection keywords
 * If detected, skip Claude and provide crisis resources
 */
const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
  'hurt myself', 'self-harm', 'self harm', 'cutting myself',
  'don\'t want to live', 'better off dead', 'no reason to live',
];

/**
 * Crisis response - always provide resources
 */
const CRISIS_RESPONSE: AIResponse = {
  text: `I hear that you're going through something really difficult. Your safety matters.

If you're in crisis, please reach out:
• **988 Suicide & Crisis Lifeline**: Call or text 988
• **Crisis Text Line**: Text HOME to 741741
• **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/

You don't have to face this alone. A trained counselor can help right now.`,
  source: 'crisis',
  cost: 0,
};

/**
 * Build the Mood Leaf system prompt
 */
function buildSystemPrompt(
  userContext: string,
  toneInstruction: string,
  personalityPrompt?: string
): string {
  // Use coach personality if available, otherwise default Mood Leaf identity
  const identity = personalityPrompt
    ? personalityPrompt
    : 'You are Mood Leaf, a warm and compassionate companion in a journaling app.';

  return `${identity}

YOUR ROLE:
- Listen with empathy and without judgment
- Help users process emotions and prepare for challenges
- Encourage real-world connection and self-compassion
- Support users in building skills and habits

YOU NEVER:
- Diagnose mental health conditions
- Suggest medication changes
- Claim to be a therapist or replacement for professional help
- Use clinical labels like "you have anxiety disorder"
- Encourage dependence on you

YOUR TONE:
- ${toneInstruction}
- Tentative ("it seems", "you might notice", "I wonder if")
- Grounded and honest
- Encouraging of autonomy

CONVERSATION APPROACH:
1. VALIDATE first - acknowledge what they're feeling before anything else
2. EXPLORE gently - ask one clarifying question if needed
3. SUPPORT - offer perspective or technique only after validating
4. EMPOWER - end with something that builds their confidence or autonomy

HANDLING DIFFERENT NEEDS:
- "Just venting": Focus on validation. Don't problem-solve. "That sounds really frustrating" is often enough.
- "Preparing for an event": Help them visualize success, identify worries, make a small plan
- "Feeling stuck": Explore what "stuck" means to them before suggesting anything
- "Not sure how I feel": Help them name it without labeling. "It sounds like there might be some heaviness there?"

WHEN THEY MENTION A JOURNAL ENTRY:
If the message includes "[Context: ...]" about a journal entry, acknowledge you understand they want to explore that, but don't quote their journal back at them. Let them lead.

ANTI-DEPENDENCY:
- You're a companion, not a solution
- Celebrate when they mention real-world support (friends, family, professionals)
- If they've been chatting a while, gently note they have wisdom too
- "What does your gut say?" is often the best question

YOUR BOUNDARIES:
- For crisis/self-harm: The app handles this - you won't see such messages
- You can acknowledge being an AI if asked directly
- Encourage professional help for persistent struggles
- Sometimes suggest stepping away: "This might be a good place to pause and let things settle"

ADDRESSING THE USER:
- NEVER use placeholder names like [Name], [H], [User], or similar
- If no user name is provided, simply address them naturally without a name ("Hey there", "I hear you")
- Do not make up or guess their name
- Do not use any bracket notation [X] in your responses

HEALTH DATA AWARENESS:
- If health data is provided, use it to notice patterns (e.g., "I notice you mentioned feeling anxious, and your heart rate has been elevated - your body might be responding to something")
- Never diagnose from health data - be descriptive only
- Help users see correlations between their feelings, behaviors, and body signals
- Use health insights to empower self-awareness, not create dependency
- If sleep was poor, gently acknowledge it might affect how they're feeling
- If activity is low, you might gently suggest movement as self-care (not prescription)

CORRELATION INSIGHTS:
- Help users connect the dots: journal entries + mood + health metrics
- Point out patterns: "You've mentioned feeling better on days you walk - your body might be telling you something"
- Build their self-knowledge so they eventually don't need you
- Celebrate when they notice their own patterns

CRITICAL - ALWAYS REFERENCE SPECIFIC DATA:
This is essential for making the user feel truly heard and understood.

1. ALWAYS reference specific things from the user context below:
   - Name specific journal entries or what they wrote about ("In your entry yesterday, you mentioned feeling anxious about...")
   - Reference their logged twigs/habits ("I see you've been tracking exercise - you logged a walk 2 days ago")
   - Mention life events from their history ("Since the breakup with your girlfriend last week...")
   - Reference people they've mentioned ("You mentioned your mom earlier...")

2. NEVER give generic responses. Every response must show you remember THEIR specific situation.
   BAD: "It sounds like you're going through a tough time"
   GOOD: "That breakup is still weighing on you - I remember you wrote about feeling angry yesterday"

3. Make connections between their data:
   - "You wrote about feeling nervous today, and I notice that's the third entry this week mentioning anxiety"
   - "Last time you mentioned your girlfriend, you seemed sad - how are things now?"
   - "You haven't logged any exercise in a few days - sometimes movement helps when we're feeling down"

4. Reference timing and patterns:
   - "Over the past week, your journals have had a lot of heavy emotions"
   - "You mentioned feeling better after school yesterday - what was different?"
   - "Three days ago you wrote about being angry, and today it sounds similar"

5. If data is available, USE IT. Never say "I don't have information about..." when the context includes relevant data.

6. Show you're paying attention to the WHOLE picture - journals, twigs, life events, health data - not just their current message.

CONTEXT ABOUT THIS USER:
${userContext}

RESPONSE GUIDELINES:
- 2-4 sentences usually (shorter for validation, longer for techniques)
- One question at most per response
- Focus on their immediate experience, not hypotheticals
- Avoid advice that starts with "You should" - prefer "Some people find it helps to..." or "What if you tried..."
- If they share something positive, celebrate it genuinely without overdoing it`;
}

/**
 * Build conversation context string from ConversationContext
 * This captures immediate conversation state (mood, events)
 * CRITICAL: Always includes current date/time so Claude can reference data correctly
 */
function buildConversationContext(context: ConversationContext): string {
  const parts: string[] = [];

  // ALWAYS include current date and time - critical for data referencing
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  parts.push(`CURRENT DATE AND TIME: ${dateStr}, ${timeStr} (${timezone})`);
  parts.push(`ISO: ${now.toISOString()}`);

  if (context.recentMood) {
    parts.push(`Recent mood: ${context.recentMood.emoji} ${context.recentMood.description}`);
  }
  if (context.upcomingEvent) {
    const eventTimeStr = context.upcomingEvent.time.toLocaleString();
    parts.push(`Upcoming event: ${context.upcomingEvent.title} at ${eventTimeStr}`);
  }
  if (context.relevantPatterns && context.relevantPatterns.length > 0) {
    const patternStr = context.relevantPatterns.map(p => p.shortDescription).join(', ');
    parts.push(`Notable patterns: ${patternStr}`);
  }
  if (context.lastNightSleep !== undefined) {
    parts.push(`Last night's sleep: ${context.lastNightSleep} hours`);
  }

  return parts.length === 0 ? 'No additional context available.' : parts.join('\n');
}

/**
 * Build messages array for Claude API
 */
function buildMessages(
  currentMessage: string,
  history: ChatMessage[]
): { role: string; content: string }[] {
  const messages: { role: string; content: string }[] = [];

  // Include last 6 messages for context (3 turns)
  for (const msg of history.slice(-6)) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Add current message
  messages.push({
    role: 'user',
    content: currentMessage,
  });

  return messages;
}

/**
 * Check if message contains crisis keywords
 */
function detectCrisis(message: string): boolean {
  const lower = message.toLowerCase();
  return CRISIS_KEYWORDS.some(keyword => lower.includes(keyword));
}

/**
 * Calculate cost from token usage
 */
function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  const price = PRICING[model] ?? PRICING['claude-3-haiku-20240307'];
  return (inputTokens / 1000) * price.input + (outputTokens / 1000) * price.output;
}

// ============ API Key Management ============

/**
 * Store API key securely
 * Note: For production iOS, use Keychain. For web/dev, AsyncStorage with warning.
 */
export async function setAPIKey(key: string): Promise<void> {
  try {
    await AsyncStorage.setItem(API_KEY_STORAGE, key);
  } catch (error) {
    console.error('Failed to store API key:', error);
    throw error;
  }
}

/**
 * Get stored API key
 */
export async function getAPIKey(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(API_KEY_STORAGE);
  } catch (error) {
    console.error('Failed to get API key:', error);
    return null;
  }
}

/**
 * Check if API key is configured
 */
export async function hasAPIKey(): Promise<boolean> {
  const key = await getAPIKey();
  return key !== null && key.length > 0;
}

/**
 * Remove API key
 */
export async function removeAPIKey(): Promise<void> {
  try {
    await AsyncStorage.removeItem(API_KEY_STORAGE);
  } catch (error) {
    console.error('Failed to remove API key:', error);
  }
}

// ============ Cost Tracking ============

/**
 * Record API usage cost
 */
async function recordUsage(
  inputTokens: number,
  outputTokens: number,
  model: string
): Promise<void> {
  const cost = calculateCost(inputTokens, outputTokens, model);

  try {
    // Check monthly reset
    const resetDateStr = await AsyncStorage.getItem(COST_RESET_DATE_KEY);
    const now = new Date();
    let shouldReset = false;

    if (resetDateStr) {
      const resetDate = new Date(resetDateStr);
      // Reset if different month
      if (resetDate.getMonth() !== now.getMonth() || resetDate.getFullYear() !== now.getFullYear()) {
        shouldReset = true;
      }
    } else {
      shouldReset = true;
    }

    if (shouldReset) {
      await AsyncStorage.setItem(COST_MONTHLY_KEY, '0');
      await AsyncStorage.setItem(COST_RESET_DATE_KEY, now.toISOString());
    }

    // Update totals
    const totalStr = await AsyncStorage.getItem(COST_TOTAL_KEY);
    const monthlyStr = await AsyncStorage.getItem(COST_MONTHLY_KEY);

    const total = parseFloat(totalStr ?? '0') + cost;
    const monthly = parseFloat(monthlyStr ?? '0') + cost;

    await AsyncStorage.setItem(COST_TOTAL_KEY, total.toString());
    await AsyncStorage.setItem(COST_MONTHLY_KEY, monthly.toString());
  } catch (error) {
    console.error('Failed to record usage:', error);
  }
}

/**
 * Get cost tracking data
 */
export async function getCostData(): Promise<{
  totalCost: number;
  monthlyCost: number;
  formattedTotal: string;
  formattedMonthly: string;
}> {
  try {
    const totalStr = await AsyncStorage.getItem(COST_TOTAL_KEY);
    const monthlyStr = await AsyncStorage.getItem(COST_MONTHLY_KEY);

    const total = parseFloat(totalStr ?? '0');
    const monthly = parseFloat(monthlyStr ?? '0');

    return {
      totalCost: total,
      monthlyCost: monthly,
      formattedTotal: `$${total.toFixed(4)}`,
      formattedMonthly: `$${monthly.toFixed(4)}`,
    };
  } catch (error) {
    console.error('Failed to get cost data:', error);
    return {
      totalCost: 0,
      monthlyCost: 0,
      formattedTotal: '$0.00',
      formattedMonthly: '$0.00',
    };
  }
}

// ============ Adaptive Mode Helpers ============

/**
 * Get current time of day for adaptive persona selection
 */
function getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Detect mood from message content for adaptive persona selection
 * More comprehensive keyword matching for better adaptation
 */
function detectMoodFromMessage(
  message: string
): 'anxious' | 'sad' | 'angry' | 'happy' | 'neutral' | undefined {
  const lower = message.toLowerCase();

  // Anxious keywords - anxiety, worry, fear, overwhelm + somatic compression
  if (
    lower.includes('anxious') ||
    lower.includes('worried') ||
    lower.includes('nervous') ||
    lower.includes('panic') ||
    lower.includes('stress') ||
    lower.includes('overwhelm') ||
    lower.includes('scared') ||
    lower.includes('afraid') ||
    lower.includes('fear') ||
    lower.includes('dread') ||
    lower.includes('on edge') ||
    lower.includes('can\'t stop thinking') ||
    lower.includes('racing thoughts') ||
    lower.includes('freaking out') ||
    // Somatic compression keywords
    lower.includes('chest tight') ||
    lower.includes('can\'t breathe') ||
    lower.includes('heart racing') ||
    lower.includes('stomach knots') ||
    lower.includes('shaking') ||
    lower.includes('tension')
  ) {
    return 'anxious';
  }

  // Sad keywords - depression, grief, loss, loneliness + somatic compression
  if (
    lower.includes('sad') ||
    lower.includes('depressed') ||
    lower.includes('down') ||
    lower.includes('hopeless') ||
    lower.includes('lonely') ||
    lower.includes('empty') ||
    lower.includes('grief') ||
    lower.includes('lost someone') ||
    lower.includes('miss them') ||
    lower.includes('crying') ||
    lower.includes('tears') ||
    lower.includes('heartbroken') ||
    lower.includes('numb') ||
    lower.includes('worthless') ||
    lower.includes('give up') ||
    // Somatic compression keywords
    lower.includes('heavy') ||
    lower.includes('weight on') ||
    lower.includes('exhausted') ||
    lower.includes('drained') ||
    lower.includes('no energy') ||
    lower.includes('can\'t get up')
  ) {
    return 'sad';
  }

  // Angry keywords - frustration, irritation, rage + somatic compression
  if (
    lower.includes('angry') ||
    lower.includes('frustrated') ||
    lower.includes('annoyed') ||
    lower.includes('furious') ||
    lower.includes('pissed') ||
    lower.includes('mad at') ||
    lower.includes('rage') ||
    lower.includes('irritated') ||
    lower.includes('fed up') ||
    lower.includes('sick of') ||
    lower.includes('hate') ||
    // Somatic compression keywords
    lower.includes('clenched') ||
    lower.includes('tight jaw') ||
    lower.includes('boiling') ||
    lower.includes('blood pressure') ||
    lower.includes('want to scream')
  ) {
    return 'angry';
  }

  // Happy keywords - joy, excitement, gratitude, accomplishment + somatic release
  if (
    lower.includes('happy') ||
    lower.includes('excited') ||
    lower.includes('great') ||
    lower.includes('amazing') ||
    lower.includes('wonderful') ||
    lower.includes('good news') ||
    lower.includes('grateful') ||
    lower.includes('thankful') ||
    lower.includes('proud') ||
    lower.includes('accomplished') ||
    lower.includes('did it') ||
    lower.includes('finally') ||
    lower.includes('celebration') ||
    lower.includes('best day') ||
    lower.includes('so good') ||
    // Somatic release keywords
    lower.includes('feel light') ||
    lower.includes('weight lifted') ||
    lower.includes('relief') ||
    lower.includes('relaxed') ||
    lower.includes('at peace') ||
    lower.includes('smile')
  ) {
    return 'happy';
  }

  return undefined; // No clear mood detected - use base persona
}

// ============ Main API Function ============

/**
 * Send message to Claude and get response
 */
export async function sendMessage(
  message: string,
  context: ConversationContext
): Promise<AIResponse> {
  // Check for crisis first
  if (detectCrisis(message)) {
    return CRISIS_RESPONSE;
  }

  // Get API key
  const apiKey = await getAPIKey();
  if (!apiKey) {
    return {
      text: "I'd like to chat with you, but I need an API key to be set up first. You can add one in Settings.",
      source: 'fallback',
      cost: 0,
    };
  }

  // Get tone preferences
  const tonePrefs = context.toneStyles ?? (await getTonePreferences()).selectedStyles;
  const toneInstruction = getToneInstruction(tonePrefs);

  // Get coach personality settings
  let personalityPrompt: string | undefined;
  try {
    const coachSettings = await getCoachSettings();

    // Determine active persona (with adaptive mode)
    const timeOfDay = getCurrentTimeOfDay();
    const detectedMood = detectMoodFromMessage(message);

    const activePersona = getAdaptivePersona(coachSettings, {
      timeOfDay,
      detectedMood,
      userMessage: message,
    });

    // Generate personality prompt for the active persona with time awareness
    const activeSettings = {
      ...coachSettings,
      selectedPersona: activePersona,
    };
    personalityPrompt = generatePersonalityPrompt(activeSettings, timeOfDay);
  } catch (error) {
    console.log('Could not load coach personality:', error);
  }

  // Build context and prompt
  // Combine: rich user context (Unit 18B) + lifetime context + health context + conversation context
  const conversationContext = buildConversationContext(context);
  const richContext = await getContextForClaude();
  const lifeContext = await getLifeContextForClaude();

  // Get health context if HealthKit is enabled
  let healthContext = '';
  let correlationContext = '';
  try {
    if (await isHealthKitEnabled()) {
      healthContext = await getHealthContextForClaude();
      correlationContext = await getCorrelationSummaryForClaude();
    }
  } catch (error) {
    console.log('HealthKit not available:', error);
  }

  // Get psychological profile context (cognitive patterns, attachment style, etc.)
  let psychContext = '';
  try {
    psychContext = await psychAnalysisService.getCompressedContext();
  } catch (error) {
    console.log('Could not load psych context:', error);
  }

  // Get chronotype and travel context (rhythm awareness, jet lag, transitions)
  let chronotypeContext = '';
  try {
    chronotypeContext = await getChronotypeContextForClaude();
  } catch (error) {
    console.log('Could not load chronotype context:', error);
  }

  // Get quick logs context - use DETAILED version for comprehensive data access
  let logsContext = '';
  try {
    logsContext = await getDetailedLogsContextForClaude();
  } catch (error) {
    console.log('Could not load quick logs context:', error);
  }

  // Get lifestyle factors context (caffeine, alcohol, exercise, outdoor, social, sleep)
  let lifestyleContext = '';
  try {
    lifestyleContext = await getLifestyleFactorsContextForClaude();
  } catch (error) {
    console.log('Could not load lifestyle factors context:', error);
  }

  // Get exposure ladder context (social anxiety progress)
  let exposureContext = '';
  try {
    exposureContext = await getExposureContextForClaude();
  } catch (error) {
    console.log('Could not load exposure context:', error);
  }

  // Get recent journal entries context (what user actually wrote)
  let journalContext = '';
  try {
    journalContext = await getRecentJournalContextForClaude();
  } catch (error) {
    console.log('Could not load journal context:', error);
  }

  // Get calendar context if enabled (upcoming events, travel, meetings)
  let calendarContext = '';
  try {
    if (await isCalendarEnabled()) {
      calendarContext = await getCalendarContextForClaude();
    }
  } catch (error) {
    console.log('Could not load calendar context:', error);
  }

  // Get tiered memory context (short/mid/long term)
  let memoryContext = '';
  try {
    memoryContext = await getMemoryContextForLLM();
  } catch (error) {
    console.log('Could not load memory context:', error);
  }

  // Track this user message in session memory
  const userMood = detectUserMood(message);
  const userEnergy = detectUserEnergy(message);
  try {
    await addMessageToSession('user', message, userMood, userEnergy);
    const topics = extractTopics(message);
    if (topics.length > 0) {
      await updateSessionTopics(topics);
    }
  } catch (error) {
    console.log('Could not update session memory:', error);
  }

  // Assemble full context with ALL data sources:
  // Order: memory context (most important), lifetime overview, psych profile, chronotype/travel,
  // calendar, health + correlations, detailed tracking logs, lifestyle factors,
  // exposure progress, recent journals, user preferences, then current conversation
  const contextParts = [
    memoryContext,       // Tiered memory (what we know about this person)
    lifeContext,         // Lifetime overview (people, events, themes)
    psychContext,        // Psychological profile (cognitive patterns, attachment, values)
    chronotypeContext,   // Chronotype and travel awareness
    calendarContext,     // Calendar events (upcoming meetings, travel, deadlines)
    healthContext,       // HealthKit data (heart rate, sleep, activity)
    correlationContext,  // Health-mood correlations
    logsContext,         // DETAILED tracking data (exact counts for exercises, habits, meds)
    lifestyleContext,    // Lifestyle factors (caffeine, alcohol, outdoor, social time)
    exposureContext,     // Social exposure ladder progress
    journalContext,      // Recent journal entries (what user actually wrote)
    richContext,         // User preferences and mood trends
    conversationContext  // Current conversation context
  ].filter(Boolean);
  const fullContext = contextParts.join('\n\n');

  // Get active coach mode additions (skill-based coach modifications)
  let coachModeAdditions = '';
  try {
    coachModeAdditions = await getCoachModeSystemPrompt();
  } catch (error) {
    console.log('Could not load coach mode additions:', error);
  }

  // Build conversation controller context and get human-ness directives
  let controllerDirectives: ResponseDirectives | null = null;
  let controllerModifiers = '';
  try {
    const messagesForController = context.recentMessages.map(m => ({
      text: m.content,
      source: m.role === 'user' ? 'user' : 'ai',
    }));
    const controllerCtx = await buildControllerContext(
      `session_${Date.now()}`,
      messagesForController,
      message
    );
    controllerDirectives = generateResponseDirectives(controllerCtx);
    controllerModifiers = buildPromptModifiers(controllerDirectives);
  } catch (error) {
    console.log('Could not build controller context:', error);
  }

  // Build system prompt with coach personality, skill modes, and controller directives
  const baseSystemPrompt = buildSystemPrompt(fullContext, toneInstruction, personalityPrompt);
  let systemPrompt = baseSystemPrompt;

  // Add coach mode additions
  if (coachModeAdditions) {
    systemPrompt = `${systemPrompt}${coachModeAdditions}`;
  }

  // Add conversation controller directives (human-ness rules)
  if (controllerModifiers) {
    systemPrompt = `${systemPrompt}

CONVERSATION STYLE DIRECTIVES (for this specific response):
${controllerModifiers}`;
  }

  const messages = buildMessages(message, context.recentMessages);

  const request: ClaudeRequest = {
    model: CLAUDE_CONFIG.model,
    max_tokens: CLAUDE_CONFIG.maxTokens,
    system: systemPrompt,
    messages,
  };

  try {
    const response = await fetch(CLAUDE_CONFIG.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': CLAUDE_CONFIG.apiVersion,
        'anthropic-dangerous-direct-browser-access': 'true', // For web testing
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data: ClaudeAPIResponse = await response.json();

    // Track cost
    await recordUsage(
      data.usage.input_tokens,
      data.usage.output_tokens,
      CLAUDE_CONFIG.model
    );

    const cost = calculateCost(
      data.usage.input_tokens,
      data.usage.output_tokens,
      CLAUDE_CONFIG.model
    );

    const responseText = data.content[0]?.text ?? '';

    // Score the exchange in background (for human-ness training data)
    // This runs async - doesn't block the response
    try {
      scoreExchange(
        message,
        responseText,
        {
          userEnergy: detectUserEnergy(message),
          userMood: detectUserMood(message),
          messageCount: context.recentMessages.length + 1,
          hourOfDay: new Date().getHours(),
        },
        { apiKey, skipClaude: false } // Claude scores in background too
      ).catch(err => console.log('Scoring error (non-blocking):', err));
    } catch (err) {
      console.log('Scoring setup error (non-blocking):', err);
    }

    // Track assistant response in session memory
    try {
      await addMessageToSession('assistant', responseText);
    } catch (err) {
      console.log('Memory tracking error (non-blocking):', err);
    }

    return {
      text: responseText,
      source: 'claudeAPI',
      cost,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
    };
  } catch (error) {
    console.error('Claude API request failed:', error);

    // Fallback response
    return {
      text: "I'm having trouble connecting right now. How about we try again in a moment?",
      source: 'fallback',
      cost: 0,
    };
  }
}

/**
 * Get a simple fallback response (for when API is unavailable)
 */
export function getFallbackResponse(): string {
  const responses = [
    "I hear you. Take a moment and breathe.",
    "Thank you for sharing. You're doing the work.",
    "That sounds like a lot to hold. Be gentle with yourself.",
    "You're here, and that matters.",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
