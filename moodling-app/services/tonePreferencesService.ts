/**
 * Tone Preferences Service
 *
 * Allows users to customize the communication style of responses.
 * Following Mood Leaf Ethics:
 * - User controls their experience
 * - Multiple styles can be combined
 * - No judgment about preferences
 *
 * Unit 16: Response Style Customization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'moodling_tone_preferences';

/**
 * Available tone styles
 * Users can select multiple to create their preferred blend
 */
export type ToneStyle =
  | 'balanced'      // Default: warm but grounded
  | 'spiritual'     // Mindfulness, presence, interconnection
  | 'direct'        // Honest, straightforward, no fluff
  | 'scientific'    // Evidence-based, factual, research-oriented
  | 'cbt'           // Cognitive behavioral: thoughts → feelings → actions
  | 'somatic'       // Body-focused, sensation awareness
  | 'compassionate' // Extra gentle, validating, nurturing
  | 'motivational'; // Encouraging, action-oriented, empowering

export interface ToneStyleOption {
  id: ToneStyle;
  label: string;
  description: string;
  examples: string[];
}

/**
 * All available tone style options with descriptions
 */
export const TONE_OPTIONS: ToneStyleOption[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Warm and grounded',
    examples: [
      "It sounds like you're noticing something important.",
      "You know yourself best.",
    ],
  },
  {
    id: 'spiritual',
    label: 'Mindful',
    description: 'Present-moment awareness',
    examples: [
      "This moment is exactly where you need to be.",
      "Notice what arises without judgment.",
    ],
  },
  {
    id: 'direct',
    label: 'Direct',
    description: 'Honest and straightforward',
    examples: [
      "Sounds tough. What's one thing you can control right now?",
      "You're dealing with a lot. That's real.",
    ],
  },
  {
    id: 'scientific',
    label: 'Evidence-Based',
    description: 'Research-informed insights',
    examples: [
      "Research shows naming emotions can reduce their intensity.",
      "Sleep affects mood regulation significantly.",
    ],
  },
  {
    id: 'cbt',
    label: 'CBT-Informed',
    description: 'Thoughts, feelings, actions',
    examples: [
      "What thought is behind this feeling?",
      "How might you test that assumption?",
    ],
  },
  {
    id: 'somatic',
    label: 'Body-Focused',
    description: 'Physical sensation awareness',
    examples: [
      "Where do you notice this feeling in your body?",
      "What does your body need right now?",
    ],
  },
  {
    id: 'compassionate',
    label: 'Gentle',
    description: 'Extra nurturing and validating',
    examples: [
      "You're doing the best you can, and that's enough.",
      "It makes sense that you feel this way.",
    ],
  },
  {
    id: 'motivational',
    label: 'Encouraging',
    description: 'Action-oriented and empowering',
    examples: [
      "You've handled hard things before. You can handle this.",
      "What's one small step forward?",
    ],
  },
];

export interface TonePreferences {
  selectedStyles: ToneStyle[];
  // Future: intensity slider, custom phrases, etc.
}

const DEFAULT_PREFERENCES: TonePreferences = {
  selectedStyles: ['balanced'],
};

/**
 * Load tone preferences from storage
 */
export async function getTonePreferences(): Promise<TonePreferences> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Validate that selectedStyles are valid
      const validStyles = parsed.selectedStyles?.filter((s: string) =>
        TONE_OPTIONS.some(opt => opt.id === s)
      ) ?? [];
      return {
        selectedStyles: validStyles.length > 0 ? validStyles : DEFAULT_PREFERENCES.selectedStyles,
      };
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Failed to load tone preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save tone preferences to storage
 */
export async function saveTonePreferences(preferences: TonePreferences): Promise<void> {
  try {
    // Ensure at least one style is selected
    if (preferences.selectedStyles.length === 0) {
      preferences.selectedStyles = ['balanced'];
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save tone preferences:', error);
    throw error;
  }
}

/**
 * Toggle a style on/off
 */
export async function toggleToneStyle(style: ToneStyle): Promise<TonePreferences> {
  const current = await getTonePreferences();
  const isSelected = current.selectedStyles.includes(style);

  let newStyles: ToneStyle[];
  if (isSelected) {
    // Remove style (but keep at least one)
    newStyles = current.selectedStyles.filter(s => s !== style);
    if (newStyles.length === 0) {
      newStyles = ['balanced'];
    }
  } else {
    // Add style
    newStyles = [...current.selectedStyles, style];
  }

  const newPreferences = { ...current, selectedStyles: newStyles };
  await saveTonePreferences(newPreferences);
  return newPreferences;
}

/**
 * Get tone instruction for AI prompts
 * This will be used when building context for Claude API
 */
export function getToneInstruction(styles: ToneStyle[]): string {
  if (styles.length === 0 || (styles.length === 1 && styles[0] === 'balanced')) {
    return 'Respond in a warm, grounded tone. Be supportive but not saccharine.';
  }

  const instructions: string[] = [];

  if (styles.includes('spiritual')) {
    instructions.push('Include mindfulness and present-moment awareness language.');
  }
  if (styles.includes('direct')) {
    instructions.push('Be straightforward and honest. Skip platitudes.');
  }
  if (styles.includes('scientific')) {
    instructions.push('Reference research and evidence when relevant.');
  }
  if (styles.includes('cbt')) {
    instructions.push('Gently explore the connection between thoughts, feelings, and behaviors.');
  }
  if (styles.includes('somatic')) {
    instructions.push('Include body awareness and physical sensation language.');
  }
  if (styles.includes('compassionate')) {
    instructions.push('Be extra gentle and validating. Emphasize self-compassion.');
  }
  if (styles.includes('motivational')) {
    instructions.push('Be encouraging and action-oriented. Highlight strengths.');
  }

  return instructions.join(' ');
}

/**
 * Get example responses for preview
 */
export function getStyleExamples(styles: ToneStyle[]): string[] {
  const examples: string[] = [];
  for (const style of styles) {
    const option = TONE_OPTIONS.find(o => o.id === style);
    if (option) {
      examples.push(...option.examples);
    }
  }
  return examples;
}
