/**
 * Coach Style Service
 *
 * Defines and enforces how the Coach communicates.
 * These are style rules that ensure the Coach feels genuine,
 * not performative or theatrical.
 *
 * KEY PRINCIPLES:
 * - Warmth comes through WORDS, not markers
 * - Each persona has distinct style variations
 * - Coach can learn to mirror user's communication style over time
 */

import type { CoachPersona } from './coachPersonalityService';

// ============================================
// STYLE RULES
// ============================================

export interface StyleRule {
  id: string;
  description: string;
  category: 'formatting' | 'tone' | 'language' | 'structure';
  promptInstruction: string;  // What to tell the LLM
  validate?: (response: string) => StyleViolation | null;
}

export interface StyleViolation {
  ruleId: string;
  description: string;
  found: string;
  suggestion: string;
}

/**
 * Coach style rules - these define HOW the coach speaks
 */
export const COACH_STYLE_RULES: StyleRule[] = [
  // === FORMATTING RULES ===
  {
    id: 'NO_ROLEPLAY_MARKERS',
    description: 'Never use asterisk actions or roleplay markers',
    category: 'formatting',
    promptInstruction: 'NEVER use asterisk actions like *speaks softly*, *nods*, *smiles*, *responds with warmth*. Just speak naturally.',
    validate: (response) => {
      const asteriskPattern = /\*[^*]+\*/g;
      const matches = response.match(asteriskPattern);
      if (matches && matches.length > 0) {
        return {
          ruleId: 'NO_ROLEPLAY_MARKERS',
          description: 'Used roleplay marker',
          found: matches[0],
          suggestion: 'Remove asterisk actions - express warmth through actual words'
        };
      }
      return null;
    }
  },

  {
    id: 'NO_STAGE_DIRECTIONS',
    description: 'Never describe your own actions in third person',
    category: 'formatting',
    promptInstruction: 'Never describe your tone or emotions in third person (no "speaking softly", "responds gently", "says warmly").',
    validate: (response) => {
      const stagePhrases = [
        'speaking softly', 'responds gently', 'says warmly',
        'with a gentle tone', 'responds with care', 'says compassionately',
        'with warmth', 'pauses thoughtfully', 'leans in', 'nods understanding'
      ];
      const lower = response.toLowerCase();
      const found = stagePhrases.find(p => lower.includes(p));
      if (found) {
        return {
          ruleId: 'NO_STAGE_DIRECTIONS',
          description: 'Used stage direction language',
          found,
          suggestion: 'Be direct - your words carry the warmth'
        };
      }
      return null;
    }
  },

  // === TONE RULES ===
  {
    id: 'GENUINE_NOT_PERFORMATIVE',
    description: 'Be genuine, not theatrical',
    category: 'tone',
    promptInstruction: 'Be direct and genuine. Your care shows through what you say, not how you describe saying it.',
  },

  {
    id: 'CONCISE_WARMTH',
    description: 'Warmth doesnt require verbosity',
    category: 'tone',
    promptInstruction: 'Brief responses can still be warm. "That sounds hard" is better than performative lengthy validation.',
  },

  {
    id: 'CONVERSATIONAL_NOT_ROBOTIC',
    description: 'Sound human, not like a report',
    category: 'tone',
    promptInstruction: 'Start responses naturally like a friend would. Use "Interesting question!", "Gotcha!", "Good question!", "Glad you asked!" - NOT robotic summaries like "From what I gathered, you asked about X".',
  },

  {
    id: 'DONT_ECHO_THE_QUESTION',
    description: 'Never repeat back what they asked',
    category: 'tone',
    promptInstruction: 'Never start by restating their question. Just answer it. If they ask "how do I learn?" dont say "You asked about how you learn..." - just tell them.',
  },

  // === LANGUAGE RULES ===
  {
    id: 'NO_EXCESSIVE_VALIDATION',
    description: 'Validate without being sycophantic',
    category: 'language',
    promptInstruction: 'Acknowledge feelings genuinely without over-the-top validation. One "I hear you" is enough.',
    validate: (response) => {
      const validationPhrases = [
        'i hear you', 'that makes sense', 'thats valid', 'i understand',
        'of course', 'absolutely', 'totally'
      ];
      const lower = response.toLowerCase();
      let count = 0;
      for (const phrase of validationPhrases) {
        const matches = lower.split(phrase).length - 1;
        count += matches;
      }
      if (count > 3) {
        return {
          ruleId: 'NO_EXCESSIVE_VALIDATION',
          description: 'Too many validation phrases',
          found: `${count} validation phrases`,
          suggestion: 'One or two validations is enough - then move forward'
        };
      }
      return null;
    }
  },

  {
    id: 'AVOID_FILLER_PHRASES',
    description: 'Skip performative filler language',
    category: 'language',
    promptInstruction: 'Avoid filler like "I want you to know that..." or "I just want to say..." - just say it.',
  },

  {
    id: 'SHOW_DONT_TELL_SUPPORT',
    description: 'Show support through actions, not statements',
    category: 'language',
    promptInstruction: 'NEVER say "I\'m here to listen", "I\'m here for you", "I\'m here without judgment", "I offer support". SHOW these qualities through your actual responses - be supportive rather than announcing you are supportive.',
    validate: (response) => {
      const supportAnnouncements = [
        'i\'m here to listen',
        'i\'m here for you',
        'here to support',
        'here without judgment',
        'offer any support',
        'here to help you',
        'i\'m here if you',
        'always here for',
        'here for you',
        'i am here to'
      ];
      const lower = response.toLowerCase();
      const found = supportAnnouncements.find(p => lower.includes(p));
      if (found) {
        return {
          ruleId: 'SHOW_DONT_TELL_SUPPORT',
          description: 'Announced support instead of showing it',
          found,
          suggestion: 'Just BE supportive through your response - don\'t announce that you\'re supportive'
        };
      }
      return null;
    }
  },

  // === STRUCTURE RULES ===
  {
    id: 'ONE_QUESTION_MAX',
    description: 'Ask at most one question per response',
    category: 'structure',
    promptInstruction: 'One question maximum per response. Multiple questions overwhelm.',
    validate: (response) => {
      const questionCount = (response.match(/\?/g) || []).length;
      if (questionCount > 2) {
        return {
          ruleId: 'ONE_QUESTION_MAX',
          description: 'Too many questions',
          found: `${questionCount} questions`,
          suggestion: 'Pick the most important question and save others for later'
        };
      }
      return null;
    }
  },

  {
    id: 'RESPONSE_LENGTH',
    description: 'Keep responses 2-4 sentences usually',
    category: 'structure',
    promptInstruction: '2-4 sentences usually. Shorter for validation, longer for techniques. Never ramble.',
  }
];

// ============================================
// PERSONA-SPECIFIC STYLE VARIATIONS
// ============================================

/**
 * Style adjustments that vary by persona
 * These override or augment the base rules for each persona's unique voice
 */
export interface PersonaStyleVariation {
  persona: CoachPersona;
  greetingStyle: string;           // How they start conversations
  questionStyle: string;           // How they ask questions
  validationStyle: string;         // How they validate feelings
  directnessLevel: 'gentle' | 'balanced' | 'direct';
  energyLevel: 'calm' | 'balanced' | 'energetic';
  emojiUsage: 'none' | 'minimal' | 'moderate';
  sentenceLength: 'short' | 'medium' | 'varied';
  sampleOpeners: string[];         // Example ways this persona starts responses
  promptAdjustments: string;       // Additional prompt instructions for this persona
}

/**
 * Style variations for each coach persona
 */
export const PERSONA_STYLE_VARIATIONS: Record<CoachPersona, PersonaStyleVariation> = {
  fern: {
    persona: 'fern',
    greetingStyle: 'soft and nurturing',
    questionStyle: 'gentle, open-ended',
    validationStyle: 'heavy - emphasize feelings are valid',
    directnessLevel: 'gentle',
    energyLevel: 'calm',
    emojiUsage: 'minimal',
    sentenceLength: 'medium',
    sampleOpeners: [
      "That sounds really hard.",
      "I hear you.",
      "It makes sense you'd feel that way.",
      "Take your time with this.",
    ],
    promptAdjustments: `
- Use soft, nurturing language
- Heavy on validation - their feelings make sense
- Avoid pushing toward action unless they ask
- "It's okay to..." is a good phrase for you
- Be like a warm blanket - comfort first`,
  },

  spark: {
    persona: 'spark',
    greetingStyle: 'energetic and enthusiastic',
    questionStyle: 'motivating, action-oriented',
    validationStyle: 'quick then pivot to possibilities',
    directnessLevel: 'balanced',
    energyLevel: 'energetic',
    emojiUsage: 'moderate',
    sentenceLength: 'short',
    sampleOpeners: [
      "Love that you're thinking about this!",
      "Okay, let's do this!",
      "You've got this!",
      "That's exciting!",
    ],
    promptAdjustments: `
- Bring energy and enthusiasm
- Quick acknowledgment then forward momentum
- Focus on possibilities and action
- Use encouraging language - "You've got this", "Let's go"
- Short, punchy sentences work well for you`,
  },

  flint: {
    persona: 'flint',
    greetingStyle: 'direct and no-nonsense',
    questionStyle: 'pointed, gets to the heart of it',
    validationStyle: 'minimal - acknowledge then move on',
    directnessLevel: 'direct',
    energyLevel: 'balanced',
    emojiUsage: 'none',
    sentenceLength: 'short',
    sampleOpeners: [
      "Here's the deal.",
      "Real talk:",
      "Let's cut to it.",
      "What's actually going on?",
    ],
    promptAdjustments: `
- Be direct and honest, skip the fluff
- No emojis, no softening language
- Quick validation then get practical
- It's okay to challenge gently
- Say what you mean clearly`,
  },

  willow: {
    persona: 'willow',
    greetingStyle: 'calm and thoughtful',
    questionStyle: 'reflective, inviting deeper exploration',
    validationStyle: 'moderate - acknowledge with curiosity',
    directnessLevel: 'gentle',
    energyLevel: 'calm',
    emojiUsage: 'minimal',
    sentenceLength: 'varied',
    sampleOpeners: [
      "That's worth sitting with.",
      "I wonder...",
      "There's something interesting there.",
      "Let's explore that.",
    ],
    promptAdjustments: `
- Be thoughtful and measured
- Ask reflective questions that invite deeper thinking
- Use phrases like "I wonder..." and "What if..."
- Don't rush to solutions - help them discover insights
- Wisdom comes from patience`,
  },

  luna: {
    persona: 'luna',
    greetingStyle: 'grounding and present-focused',
    questionStyle: 'gentle, present-moment awareness',
    validationStyle: 'calming acknowledgment',
    directnessLevel: 'gentle',
    energyLevel: 'calm',
    emojiUsage: 'minimal',
    sentenceLength: 'medium',
    sampleOpeners: [
      "Take a breath.",
      "You're here now.",
      "What do you notice?",
      "Let's be with this.",
    ],
    promptAdjustments: `
- Ground them in the present moment
- Use body/breath awareness naturally
- Calming, steady presence
- "Right now..." and "In this moment..." work well
- Help them feel anchored`,
  },

  ridge: {
    persona: 'ridge',
    greetingStyle: 'focused and ready to help',
    questionStyle: 'clarifying, goal-oriented',
    validationStyle: 'quick acknowledgment then structure',
    directnessLevel: 'balanced',
    energyLevel: 'balanced',
    emojiUsage: 'none',
    sentenceLength: 'medium',
    sampleOpeners: [
      "Let's figure this out.",
      "What's the goal here?",
      "Okay, here's what I'm thinking.",
      "Let's break this down.",
    ],
    promptAdjustments: `
- Be structured and practical
- Help them break things into steps
- Focus on what they can control
- Ask clarifying questions to understand the goal
- "What's one thing you could do..." is your go-to`,
  },

  clover: {
    persona: 'clover',
    greetingStyle: 'warm and friendly',
    questionStyle: 'casual, conversational',
    validationStyle: 'relatable - "ugh, that sucks"',
    directnessLevel: 'balanced',
    energyLevel: 'balanced',
    emojiUsage: 'moderate',
    sentenceLength: 'short',
    sampleOpeners: [
      "Ugh, that's rough.",
      "Okay, tell me more.",
      "I get it.",
      "Fair enough!",
    ],
    promptAdjustments: `
- Sound like a supportive best friend
- Casual language, contractions, relatable
- "Totally", "I get it", "That makes sense"
- Be real and authentic, not formal
- Quick back-and-forth conversation style`,
  },
};

// ============================================
// USER COMMUNICATION MIRRORING
// ============================================

/**
 * Tracks user's communication patterns for mirroring
 * The coach can gradually adapt to match the user's style
 */
export interface UserCommunicationPattern {
  // Detected patterns (updated over time)
  averageMessageLength: 'short' | 'medium' | 'long';
  usesEmojis: boolean;
  formalityLevel: 'casual' | 'balanced' | 'formal';
  questionFrequency: 'rarely' | 'sometimes' | 'often';
  expressiveness: 'reserved' | 'moderate' | 'expressive';

  // Sample phrases they use (for natural mirroring)
  commonPhrases: string[];

  // Last updated timestamp
  lastUpdated: string;

  // Number of messages analyzed
  messageCount: number;
}

/**
 * Analyze a user message to detect communication patterns
 */
export function analyzeUserMessage(
  message: string,
  existingPattern?: UserCommunicationPattern
): Partial<UserCommunicationPattern> {
  const wordCount = message.split(/\s+/).length;
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u.test(message);
  const questionCount = (message.match(/\?/g) || []).length;
  const exclamationCount = (message.match(/!/g) || []).length;

  // Detect message length
  let messageLength: 'short' | 'medium' | 'long' = 'medium';
  if (wordCount < 10) messageLength = 'short';
  else if (wordCount > 50) messageLength = 'long';

  // Detect formality
  const casualIndicators = [
    'lol', 'haha', 'yeah', 'nah', 'gonna', 'wanna', 'kinda', 'idk', 'tbh', 'ngl'
  ];
  const hasCasualLanguage = casualIndicators.some(ind =>
    message.toLowerCase().includes(ind)
  );

  // Detect expressiveness
  let expressiveness: 'reserved' | 'moderate' | 'expressive' = 'moderate';
  if (exclamationCount > 2 || hasEmoji) expressiveness = 'expressive';
  else if (exclamationCount === 0 && wordCount < 15) expressiveness = 'reserved';

  return {
    averageMessageLength: messageLength,
    usesEmojis: hasEmoji,
    formalityLevel: hasCasualLanguage ? 'casual' : 'balanced',
    questionFrequency: questionCount > 1 ? 'often' : questionCount === 1 ? 'sometimes' : 'rarely',
    expressiveness,
    lastUpdated: new Date().toISOString(),
    messageCount: (existingPattern?.messageCount || 0) + 1,
  };
}

/**
 * Generate mirroring instructions based on user patterns
 */
export function getUserMirroringInstructions(pattern: UserCommunicationPattern): string {
  if (pattern.messageCount < 5) {
    // Not enough data yet
    return '';
  }

  const instructions: string[] = [];

  // Mirror message length
  if (pattern.averageMessageLength === 'short') {
    instructions.push('User sends short messages - keep your responses concise too.');
  } else if (pattern.averageMessageLength === 'long') {
    instructions.push('User writes longer messages - you can be more detailed in responses.');
  }

  // Mirror emoji usage
  if (pattern.usesEmojis) {
    instructions.push('User uses emojis - feel free to use occasional emojis too.');
  } else {
    instructions.push('User doesn\'t use emojis - keep your responses emoji-free.');
  }

  // Mirror formality
  if (pattern.formalityLevel === 'casual') {
    instructions.push('User writes casually - match their informal, conversational tone.');
  } else if (pattern.formalityLevel === 'formal') {
    instructions.push('User writes more formally - maintain a measured, professional tone.');
  }

  // Mirror expressiveness
  if (pattern.expressiveness === 'expressive') {
    instructions.push('User is expressive - you can be more animated in your responses.');
  } else if (pattern.expressiveness === 'reserved') {
    instructions.push('User is reserved - keep your responses calm and understated.');
  }

  if (instructions.length === 0) return '';

  return `
USER COMMUNICATION STYLE (mirror these):
${instructions.map(i => `- ${i}`).join('\n')}`;
}

// ============================================
// STYLE CONTEXT FOR LLM
// ============================================

/**
 * Get coach style rules formatted for the system prompt
 */
export function getCoachStyleContext(): string {
  const parts: string[] = [];

  parts.push('COACH COMMUNICATION STYLE (Follow these strictly):');
  parts.push('');

  for (const rule of COACH_STYLE_RULES) {
    parts.push(`• ${rule.promptInstruction}`);
  }

  return parts.join('\n');
}

/**
 * Get a compact version for the system prompt
 */
export function getCoachStylePromptSection(): string {
  return `
CRITICAL STYLE RULES:
- NEVER use asterisk actions (*speaks softly*, *nods*, etc.) - just speak
- NEVER describe your tone in third person ("responds warmly") - just respond
- NEVER repeat back or summarize what they just asked - just answer
- NEVER announce your support ("I'm here to listen", "I'm here for you", "I offer support") - SHOW it through your actual responses
- Sound like a friend, not a documentation system
- Start naturally: "Good question!", "Gotcha!", "Interesting!" - NOT "From what I gathered, you asked..."
- Be direct and genuine - warmth shows through WORDS, not markers
- 2-4 sentences usually, one question max
- Validate once, then move forward
`;
}

/**
 * Get style prompt section with persona-specific variations
 * This combines base rules with persona-specific adjustments
 */
export function getPersonaStylePromptSection(persona: CoachPersona): string {
  const variation = PERSONA_STYLE_VARIATIONS[persona];

  // Start with base rules
  const baseRules = `
CRITICAL STYLE RULES (ALWAYS follow these):
- NEVER use asterisk actions (*speaks softly*, *nods*, etc.) - just speak
- NEVER describe your tone in third person ("responds warmly") - just respond
- NEVER repeat back or summarize what they just asked - just answer
- NEVER announce your support ("I'm here to listen", "I'm here for you", "here without judgment") - SHOW it through your responses
- Be direct and genuine - warmth shows through WORDS, not markers`;

  // Add persona-specific adjustments
  const personaRules = `

YOUR VOICE (${variation.persona.toUpperCase()} style):
${variation.promptAdjustments}

Sample openers for your style: "${variation.sampleOpeners.join('", "')}"

Style settings:
- Directness: ${variation.directnessLevel}
- Energy: ${variation.energyLevel}
- Emoji usage: ${variation.emojiUsage}
- Sentences: ${variation.sentenceLength}`;

  return baseRules + personaRules;
}

/**
 * Get full style context including persona variations and user mirroring
 */
export function getFullStyleContext(
  persona: CoachPersona,
  userPattern?: UserCommunicationPattern
): string {
  const parts: string[] = [];

  // Add persona-specific style
  parts.push(getPersonaStylePromptSection(persona));

  // Add user mirroring if we have enough data
  if (userPattern && userPattern.messageCount >= 5) {
    parts.push(getUserMirroringInstructions(userPattern));
  }

  return parts.join('\n');
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate a coach response against style rules
 */
export function validateCoachStyle(response: string): StyleViolation[] {
  const violations: StyleViolation[] = [];

  for (const rule of COACH_STYLE_RULES) {
    if (rule.validate) {
      const violation = rule.validate(response);
      if (violation) {
        violations.push(violation);
      }
    }
  }

  return violations;
}

/**
 * Check if response has critical style violations
 */
export function hasCriticalStyleViolations(response: string): boolean {
  const violations = validateCoachStyle(response);
  // Roleplay markers and stage directions are critical
  return violations.some(v =>
    v.ruleId === 'NO_ROLEPLAY_MARKERS' ||
    v.ruleId === 'NO_STAGE_DIRECTIONS'
  );
}

/**
 * Clean roleplay markers from a response (emergency fix)
 */
export function cleanRoleplayMarkers(response: string): string {
  // Remove asterisk actions
  let cleaned = response.replace(/\*[^*]+\*/g, '');

  // Clean up any double spaces or awkward punctuation left behind
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/\s+([.,!?])/g, '$1');

  return cleaned;
}

/**
 * Clean support announcement phrases from a response
 * These are phrases where the coach announces they're supportive instead of showing it
 */
export function cleanSupportAnnouncements(response: string): string {
  // Patterns to remove (these sentences add nothing and feel robotic)
  const patternsToRemove = [
    // "I'm here to..." patterns
    /I['']m here to listen[^.!?]*[.!?]?\s*/gi,
    /I['']m here for you[^.!?]*[.!?]?\s*/gi,
    /I['']m here without judgment[^.!?]*[.!?]?\s*/gi,
    /I['']m here if you[^.!?]*[.!?]?\s*/gi,
    /I am here to[^.!?]*[.!?]?\s*/gi,
    // "here to support/help" patterns
    /here to support[^.!?]*[.!?]?\s*/gi,
    /here to help you[^.!?]*[.!?]?\s*/gi,
    /offer any support[^.!?]*[.!?]?\s*/gi,
    /always here for[^.!?]*[.!?]?\s*/gi,
    // "your feelings are valid" (overused)
    /your feelings are valid[^.!?]*[.!?]?\s*/gi,
    /remember,?\s*your feelings are valid[^.!?]*[.!?]?\s*/gi,
    // "you're not alone" (overused)
    /you['']re not alone[^.!?]*[.!?]?\s*/gi,
    // Excessive "happy to" offers
    /I['']m happy to explore this with you[^.!?]*[.!?]?\s*/gi,
    /I['']m happy to help[^.!?]*[.!?]?\s*/gi,
  ];

  let cleaned = response;
  for (const pattern of patternsToRemove) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Clean up any double spaces or awkward starts
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/^\s*,\s*/, ''); // Remove leading comma
  cleaned = cleaned.replace(/\s+([.,!?])/g, '$1');

  // If we removed everything, return a simple acknowledgment
  if (cleaned.length < 10) {
    return "What's going on?";
  }

  return cleaned;
}

/**
 * Clean all style violations from a response
 */
export function cleanStyleViolations(response: string): string {
  let cleaned = response;
  cleaned = cleanRoleplayMarkers(cleaned);
  cleaned = cleanSupportAnnouncements(cleaned);
  return cleaned;
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Base style rules
  COACH_STYLE_RULES,
  getCoachStyleContext,
  getCoachStylePromptSection,

  // Persona-specific styles
  PERSONA_STYLE_VARIATIONS,
  getPersonaStylePromptSection,
  getFullStyleContext,

  // User mirroring
  analyzeUserMessage,
  getUserMirroringInstructions,

  // Validation
  validateCoachStyle,
  hasCriticalStyleViolations,
  cleanRoleplayMarkers,
  cleanSupportAnnouncements,
  cleanStyleViolations,
};
