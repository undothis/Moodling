/**
 * Compassionate Reflections Service
 *
 * Generates sentiment-aware, non-diagnostic reflections.
 * Following Moodling Ethics:
 * - Descriptive, never diagnostic
 * - Tentative language ("might", "seems", "sounds like")
 * - Affirms user's self-knowledge
 * - Never tells user how they should feel
 *
 * Unit 15: Compassionate Reflections
 */

import { MoodCategory } from './sentimentAnalysis';
import { ToneStyle, getTonePreferences } from './tonePreferencesService';

export interface Reflection {
  opening: string;      // Acknowledges the entry
  insight: string;      // Optional gentle observation
  closing: string;      // Affirms user's self-knowledge
}

// Templates organized by sentiment category
// Each category has multiple options to avoid repetition

const OPENINGS: Record<MoodCategory, string[]> = {
  very_positive: [
    "It sounds like things are going well.",
    "There seems to be some brightness here.",
    "This feels like a good moment you're capturing.",
  ],
  positive: [
    "It sounds like there's something positive here.",
    "There seems to be some warmth in this.",
    "You're noticing something good.",
  ],
  slightly_positive: [
    "There might be a small light here.",
    "It sounds like things are okay.",
    "You're picking up on something.",
  ],
  neutral: [
    "Thank you for checking in.",
    "You're taking a moment to notice.",
    "Sometimes things just are what they are.",
  ],
  slightly_negative: [
    "It sounds like things might be a bit heavy.",
    "There seems to be some weight here.",
    "You're noticing something that's there.",
  ],
  negative: [
    "It sounds like things are hard right now.",
    "This seems like a difficult moment.",
    "You're carrying something heavy.",
  ],
  very_negative: [
    "It sounds like you're going through a lot.",
    "This seems like a really tough time.",
    "You're facing something difficult.",
  ],
};

const INSIGHTS: Record<MoodCategory, string[]> = {
  very_positive: [
    "Capturing good moments can help you remember what matters.",
    "Noticing when things feel right is a skill.",
    "Good feelings are worth acknowledging.",
  ],
  positive: [
    "Small positives add up over time.",
    "Noticing the good, even when mixed with other things, takes awareness.",
    "It's okay to feel multiple things at once.",
  ],
  slightly_positive: [
    "Even small shifts are worth noticing.",
    "Sometimes 'okay' is enough.",
    "You know your own normal.",
  ],
  neutral: [
    "Not every moment needs to be big.",
    "Sometimes checking in is the whole practice.",
    "Awareness itself is the point.",
  ],
  slightly_negative: [
    "Difficult feelings are information, not instructions.",
    "Noticing heaviness is different from being defined by it.",
    "This is just one moment in a longer story.",
  ],
  negative: [
    "Hard times don't last forever, even when they feel permanent.",
    "Reaching out—even to an app—shows self-awareness.",
    "You don't have to figure everything out right now.",
  ],
  very_negative: [
    "It takes courage to acknowledge when things are really hard.",
    "You're allowed to not be okay.",
    "This feeling is real, and it's also temporary.",
  ],
};

const CLOSINGS: Record<MoodCategory, string[]> = {
  very_positive: [
    "You know what lifts you up.",
    "Trust what you're feeling.",
    "You're the expert on your own joy.",
  ],
  positive: [
    "You know yourself well.",
    "Your perspective matters most.",
    "Only you know the full picture.",
  ],
  slightly_positive: [
    "You're the one who knows.",
    "Trust your own read on things.",
    "You know best.",
  ],
  neutral: [
    "You know yourself better than any app.",
    "Only you know what you need.",
    "Trust yourself.",
  ],
  slightly_negative: [
    "You know what you need.",
    "Trust your instincts.",
    "You're the expert here.",
  ],
  negative: [
    "You know what helps you.",
    "Be gentle with yourself.",
    "You've gotten through hard things before.",
  ],
  very_negative: [
    "You don't have to carry this alone.",
    "Reaching out to someone you trust might help.",
    "You matter, and so does what you're feeling.",
  ],
};

// Additional affirmations for any sentiment
const UNIVERSAL_AFFIRMATIONS = [
  "Moodling is here when you need it, and not when you don't.",
  "The goal is to need this app less, not more.",
  "You're the expert on your own experience.",
  "This is your space. Use it however feels right.",
];

/**
 * Tone-specific templates (Unit 16)
 * These are combined with mood to create personalized reflections
 */
type MoodGroup = 'positive' | 'neutral' | 'negative';

function getMoodGroup(mood: MoodCategory): MoodGroup {
  if (['very_positive', 'positive', 'slightly_positive'].includes(mood)) return 'positive';
  if (['neutral'].includes(mood)) return 'neutral';
  return 'negative';
}

const STYLED_TEMPLATES: Record<ToneStyle, Record<MoodGroup, string[]>> = {
  balanced: {
    positive: [
      "It sounds like a good moment. You know what brings you joy.",
      "There's warmth here. Trust what you're feeling.",
      "You're noticing the good. That's awareness in action.",
    ],
    neutral: [
      "You're here, noticing. That's the practice.",
      "Checking in is its own kind of care.",
      "Sometimes things just are. That's okay.",
    ],
    negative: [
      "Things are hard. Be gentle with yourself.",
      "You're going through something. That's real.",
      "This feeling is valid, and it won't last forever.",
    ],
  },
  spiritual: {
    positive: [
      "This moment of joy is exactly where you need to be.",
      "Notice this lightness without grasping at it.",
      "Presence with good feelings deepens them.",
    ],
    neutral: [
      "In this moment, you are enough.",
      "Simply being aware is a form of meditation.",
      "You are exactly where you need to be right now.",
    ],
    negative: [
      "This too shall pass. You are more than this moment.",
      "Even in difficulty, your awareness is a gift.",
      "The observer in you remains steady, even now.",
    ],
  },
  direct: {
    positive: [
      "Good. Note what's working.",
      "Something clicked. Remember what it is.",
      "Positive mood. What contributed to it?",
    ],
    neutral: [
      "You checked in. That's the whole point.",
      "Nothing dramatic happening. That's fine.",
      "Baseline day. Good data.",
    ],
    negative: [
      "Rough patch. What's one thing you can control?",
      "Hard day. You've survived these before.",
      "This sucks. And you're still showing up.",
    ],
  },
  scientific: {
    positive: [
      "Positive emotions broaden attention and build psychological resources.",
      "Noting what works helps your brain learn to find it again.",
      "Savoring positive experiences strengthens neural pathways for wellbeing.",
    ],
    neutral: [
      "Emotional neutrality often indicates good regulation.",
      "Baseline moods are valuable data points.",
      "Tracking even 'nothing special' days improves self-awareness.",
    ],
    negative: [
      "Negative emotions signal unmet needs—useful information.",
      "Naming emotions reduces amygdala activation.",
      "This state is temporary; neuroplasticity means change is always possible.",
    ],
  },
  cbt: {
    positive: [
      "What thought or action contributed to this good feeling?",
      "Notice the link between what you did and how you feel.",
      "Positive feelings often follow helpful thoughts or behaviors.",
    ],
    neutral: [
      "What were you thinking when you wrote this?",
      "Thoughts, feelings, and situations connect. What's the pattern?",
      "Awareness of your mental state is the first step.",
    ],
    negative: [
      "What thought is behind this feeling?",
      "Is there another way to look at this situation?",
      "What would you tell a friend feeling this way?",
    ],
  },
  somatic: {
    positive: [
      "Where do you feel this good feeling in your body?",
      "Notice any warmth, lightness, or openness.",
      "Let your body remember this sensation.",
    ],
    neutral: [
      "Take a breath. Notice how your body feels right now.",
      "Where is your body holding or releasing?",
      "Your body has information. What is it saying?",
    ],
    negative: [
      "Where do you feel this in your body?",
      "What does your body need right now?",
      "Notice without trying to change anything.",
    ],
  },
  compassionate: {
    positive: [
      "You deserve this moment of happiness.",
      "It's wonderful that you're noticing the good.",
      "May you hold this feeling gently.",
    ],
    neutral: [
      "You're doing exactly enough right now.",
      "There's no wrong way to feel. You're okay.",
      "Thank you for taking this moment for yourself.",
    ],
    negative: [
      "You're doing your best, and that's enough.",
      "It makes so much sense that you feel this way.",
      "You are worthy of gentleness right now.",
    ],
  },
  motivational: {
    positive: [
      "You're building momentum. Keep going.",
      "This positive energy is yours to use.",
      "You created this feeling. Remember that.",
    ],
    neutral: [
      "Every check-in is a small win.",
      "Consistency beats intensity. You showed up.",
      "Progress isn't always visible. Trust the process.",
    ],
    negative: [
      "You've handled hard things before. You'll handle this.",
      "What's one small step you can take right now?",
      "This challenge is building strength you'll use later.",
    ],
  },
};

/**
 * Get a random item from an array
 */
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a compassionate reflection based on mood
 * @param mood - The sentiment category of the entry
 * @param includeInsight - Whether to include the middle insight (default: true)
 */
export function generateReflection(
  mood: MoodCategory,
  includeInsight: boolean = true
): Reflection {
  const opening = randomChoice(OPENINGS[mood]);
  const insight = includeInsight ? randomChoice(INSIGHTS[mood]) : '';
  const closing = randomChoice(CLOSINGS[mood]);

  return { opening, insight, closing };
}

/**
 * Generate a simple one-line reflection (legacy, no style awareness)
 * For when a shorter response is needed
 */
export function generateSimpleReflection(mood: MoodCategory): string {
  // Combine opening and closing for a simpler message
  const templates: Record<MoodCategory, string[]> = {
    very_positive: [
      "It sounds like a good moment. You know what brings you joy.",
      "There's brightness here. Trust that.",
      "You're noticing the good. That's a skill.",
    ],
    positive: [
      "Something positive here. You're paying attention.",
      "A little warmth goes a long way. You know that.",
      "You're noticing what matters.",
    ],
    slightly_positive: [
      "Things seem okay. You know your own normal.",
      "Small positives count. You're aware of that.",
      "You're checking in. That's enough.",
    ],
    neutral: [
      "You're here, noticing. That's the practice.",
      "Not every moment needs to be big. You know that.",
      "Checking in is its own kind of care.",
    ],
    slightly_negative: [
      "Things might be a bit heavy. You know what you need.",
      "You're noticing something. Trust that awareness.",
      "This is one moment. You've seen others.",
    ],
    negative: [
      "Things are hard. Be gentle with yourself.",
      "You're going through something. That's real.",
      "Hard feelings are temporary, even when they don't feel like it.",
    ],
    very_negative: [
      "You're facing something difficult. You don't have to do this alone.",
      "This is really hard. It's okay to not be okay.",
      "You're struggling, and that matters. Consider reaching out to someone you trust.",
    ],
  };

  return randomChoice(templates[mood]);
}

/**
 * Generate a styled reflection based on mood and user preferences (Unit 16)
 * Uses the user's selected tone styles to personalize the response
 */
export async function generateStyledReflection(mood: MoodCategory): Promise<string> {
  const preferences = await getTonePreferences();
  const styles = preferences.selectedStyles;
  const moodGroup = getMoodGroup(mood);

  // Collect all applicable templates
  const allTemplates: string[] = [];

  for (const style of styles) {
    const templates = STYLED_TEMPLATES[style]?.[moodGroup];
    if (templates) {
      allTemplates.push(...templates);
    }
  }

  // Fallback to balanced if nothing found
  if (allTemplates.length === 0) {
    allTemplates.push(...STYLED_TEMPLATES.balanced[moodGroup]);
  }

  return randomChoice(allTemplates);
}

/**
 * Synchronous styled reflection with provided styles
 * Use when you already have the styles loaded
 */
export function generateStyledReflectionSync(mood: MoodCategory, styles: ToneStyle[]): string {
  const moodGroup = getMoodGroup(mood);

  // Collect all applicable templates
  const allTemplates: string[] = [];

  for (const style of styles) {
    const templates = STYLED_TEMPLATES[style]?.[moodGroup];
    if (templates) {
      allTemplates.push(...templates);
    }
  }

  // Fallback to balanced if nothing found
  if (allTemplates.length === 0) {
    allTemplates.push(...STYLED_TEMPLATES.balanced[moodGroup]);
  }

  return randomChoice(allTemplates);
}

/**
 * Get a random universal affirmation
 * For footer messages, etc.
 */
export function getAffirmation(): string {
  return randomChoice(UNIVERSAL_AFFIRMATIONS);
}

/**
 * Check if the mood suggests professional support might help
 * Returns true for very_negative - we mention reaching out, not diagnose
 */
export function shouldSuggestSupport(mood: MoodCategory): boolean {
  return mood === 'very_negative';
}

/**
 * Get a support suggestion message
 * Gentle, non-prescriptive, no diagnosis
 */
export function getSupportSuggestion(): string {
  const suggestions = [
    "If these feelings persist, talking to someone you trust—a friend, family member, or professional—might help.",
    "You don't have to figure this out alone. Reaching out to someone can make a difference.",
    "If you're struggling, consider connecting with someone who can help.",
  ];
  return randomChoice(suggestions);
}
