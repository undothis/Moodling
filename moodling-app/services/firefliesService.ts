/**
 * Fireflies Service
 *
 * Manages custom wisdom categories for the Fireflies feature.
 * - Preset categories can be enabled/disabled
 * - Custom categories can be created with AI-generated wisdoms
 * - AI generation uses full user context (journal, moods, psych profile)
 *
 * Storage:
 * - User's enabled presets
 * - User's custom categories with their wisdoms
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAPIKey, CLAUDE_CONFIG } from './claudeAPIService';
import { getContextForClaude } from './userContextService';
import { getLifeContextForClaude } from './lifeContextService';
import { psychAnalysisService } from './psychAnalysisService';

const STORAGE_KEYS = {
  ENABLED_PRESETS: 'fireflies_enabled_presets',
  CUSTOM_CATEGORIES: 'fireflies_custom_categories',
};

// Preset category keys (match CUSTOM_CATEGORIES in WisdomOverlay)
export const PRESET_CATEGORIES = [
  { key: 'anxiety', emoji: '🌊', label: 'Anxiety' },
  { key: 'movement', emoji: '🚶', label: 'Movement' },
  { key: 'creativity', emoji: '🎨', label: 'Creativity' },
  { key: 'music', emoji: '🎵', label: 'Music' },
  { key: 'breath', emoji: '🌬️', label: 'Breath' },
  { key: 'connection', emoji: '🤝', label: 'Connection' },
  { key: 'perspective', emoji: '🔮', label: 'Perspective' },
  { key: 'sleep', emoji: '😴', label: 'Sleep' },
];

// Default enabled presets (all enabled by default)
const DEFAULT_ENABLED_PRESETS = PRESET_CATEGORIES.map((c) => c.key);

export interface CustomCategory {
  id: string;
  emoji: string;
  label: string;
  wisdoms: string[];
  createdAt: string;
}

/**
 * Get enabled preset category keys
 */
export async function getEnabledPresets(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ENABLED_PRESETS);
    if (data) {
      return JSON.parse(data);
    }
    return DEFAULT_ENABLED_PRESETS;
  } catch (error) {
    console.error('Failed to load enabled presets:', error);
    return DEFAULT_ENABLED_PRESETS;
  }
}

/**
 * Save enabled preset category keys
 */
export async function saveEnabledPresets(presets: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ENABLED_PRESETS, JSON.stringify(presets));
  } catch (error) {
    console.error('Failed to save enabled presets:', error);
    throw error;
  }
}

/**
 * Toggle a preset category on/off
 */
export async function togglePreset(key: string): Promise<string[]> {
  const current = await getEnabledPresets();
  const isEnabled = current.includes(key);

  let newPresets: string[];
  if (isEnabled) {
    newPresets = current.filter((k) => k !== key);
  } else {
    newPresets = [...current, key];
  }

  await saveEnabledPresets(newPresets);
  return newPresets;
}

/**
 * Get all custom categories
 */
export async function getCustomCategories(): Promise<CustomCategory[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Failed to load custom categories:', error);
    return [];
  }
}

/**
 * Save custom categories
 */
async function saveCustomCategories(categories: CustomCategory[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(categories));
  } catch (error) {
    console.error('Failed to save custom categories:', error);
    throw error;
  }
}

/**
 * Build personalized context for wisdom generation
 */
async function buildWisdomContext(): Promise<string> {
  const parts: string[] = [];

  // Get user context (journal patterns, mood trends)
  try {
    const userContext = await getContextForClaude();
    if (userContext && userContext !== 'New user - no history yet.') {
      parts.push('USER CONTEXT:\n' + userContext);
    }
  } catch (e) {
    console.log('Could not load user context:', e);
  }

  // Get life context (relationships, work, etc.)
  try {
    const lifeContext = await getLifeContextForClaude();
    if (lifeContext) {
      parts.push('LIFE CONTEXT:\n' + lifeContext);
    }
  } catch (e) {
    console.log('Could not load life context:', e);
  }

  // Get psychological profile
  try {
    const psychContext = await psychAnalysisService.getCompressedContext();
    if (psychContext && psychContext !== 'No psychological profile established yet.') {
      parts.push('PSYCHOLOGICAL PROFILE:\n' + psychContext);
    }
  } catch (e) {
    console.log('Could not load psych context:', e);
  }

  return parts.join('\n\n');
}

/**
 * Get current time of day for context
 */
function getCurrentTimeContext(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Fallback wisdoms when API is unavailable
 */
function getFallbackWisdoms(categoryName: string): string[] {
  return [
    `When ${categoryName.toLowerCase()} feels overwhelming, take a breath.`,
    `What would help with ${categoryName.toLowerCase()} right now?`,
    `${categoryName} is part of your journey. Be gentle with yourself.`,
    `One small step with ${categoryName.toLowerCase()}. What could that be?`,
    `You've handled ${categoryName.toLowerCase()} before. You can handle it again.`,
    `What does ${categoryName.toLowerCase()} need from you right now?`,
    `It's okay to struggle with ${categoryName.toLowerCase()}. Everyone does sometimes.`,
    `What would you tell a friend dealing with ${categoryName.toLowerCase()}?`,
    `${categoryName} doesn't define you. It's just something you're experiencing.`,
    `Tomorrow is another chance to work on ${categoryName.toLowerCase()}.`,
  ];
}

/**
 * Generate wisdoms for a custom category using AI
 * Uses full user context for personalization
 * Returns array of 10 wisdoms
 */
export async function generateWisdomsForCategory(
  categoryName: string,
  description?: string
): Promise<string[]> {
  // Check if API key is available
  const apiKey = await getAPIKey();
  if (!apiKey) {
    console.log('No API key, using fallback wisdoms');
    return getFallbackWisdoms(categoryName);
  }

  // Build personalized context
  const userContext = await buildWisdomContext();
  const timeOfDay = getCurrentTimeContext();

  // Build the prompt
  const systemPrompt = `You are generating personalized wisdom prompts for a mental wellness journaling app called Mood Leaf.

YOUR TASK:
Generate exactly 10 short, meaningful wisdom prompts for the category "${categoryName}".
${description ? `Category description: ${description}` : ''}

PERSONALIZATION CONTEXT:
${userContext || 'No user context available yet.'}

CURRENT TIME: ${timeOfDay}

GUIDELINES:
- Each wisdom should be 1-2 sentences max
- Be direct and grounded, not flowery or new-age
- Speak as a thoughtful friend, not a therapist
- Mix questions with observations
- Consider the user's patterns and what might resonate with them
- Make some specific to their context if available
- Include practical nudges where helpful
- Time-appropriate (e.g., morning = energy/intentions, night = reflection/rest)

OUTPUT FORMAT:
Return ONLY a JSON array of 10 strings, nothing else.
Example: ["First wisdom here.", "Second wisdom here.", ...]`;

  try {
    const response = await fetch(CLAUDE_CONFIG.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': CLAUDE_CONFIG.apiVersion,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: CLAUDE_CONFIG.model,
        max_tokens: 800,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Generate 10 personalized wisdoms for the "${categoryName}" category. Return only a JSON array.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return getFallbackWisdoms(categoryName);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    // Parse the JSON array from response
    try {
      // Try to extract JSON array from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const wisdoms = JSON.parse(jsonMatch[0]);
        if (Array.isArray(wisdoms) && wisdoms.length > 0) {
          return wisdoms.slice(0, 10);
        }
      }
    } catch (parseError) {
      console.error('Failed to parse wisdoms JSON:', parseError);
    }

    return getFallbackWisdoms(categoryName);
  } catch (error) {
    console.error('Failed to generate wisdoms:', error);
    return getFallbackWisdoms(categoryName);
  }
}

/**
 * Create a new custom category
 */
export async function createCustomCategory(
  label: string,
  emoji: string,
  description?: string
): Promise<CustomCategory> {
  const categories = await getCustomCategories();

  // Generate wisdoms using AI
  const wisdoms = await generateWisdomsForCategory(label, description);

  const newCategory: CustomCategory = {
    id: `custom_${Date.now()}`,
    emoji,
    label,
    wisdoms,
    createdAt: new Date().toISOString(),
  };

  categories.push(newCategory);
  await saveCustomCategories(categories);

  return newCategory;
}

/**
 * Update a custom category
 */
export async function updateCustomCategory(
  id: string,
  updates: Partial<Pick<CustomCategory, 'label' | 'emoji'>>
): Promise<CustomCategory | null> {
  const categories = await getCustomCategories();
  const index = categories.findIndex((c) => c.id === id);

  if (index === -1) return null;

  categories[index] = { ...categories[index], ...updates };
  await saveCustomCategories(categories);

  return categories[index];
}

/**
 * Delete a custom category
 */
export async function deleteCustomCategory(id: string): Promise<void> {
  const categories = await getCustomCategories();
  const filtered = categories.filter((c) => c.id !== id);
  await saveCustomCategories(filtered);
}

/**
 * Regenerate wisdoms for a custom category
 */
export async function regenerateWisdoms(id: string): Promise<CustomCategory | null> {
  const categories = await getCustomCategories();
  const index = categories.findIndex((c) => c.id === id);

  if (index === -1) return null;

  const category = categories[index];
  const newWisdoms = await generateWisdomsForCategory(category.label);
  categories[index] = { ...category, wisdoms: newWisdoms };

  await saveCustomCategories(categories);
  return categories[index];
}
