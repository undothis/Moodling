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
 * Generate a simple one-line reflection
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
