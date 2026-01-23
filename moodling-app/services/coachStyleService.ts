/**
 * Coach Style Service
 *
 * Defines and enforces how the Coach communicates.
 * These are style rules that ensure the Coach feels genuine,
 * not performative or theatrical.
 *
 * KEY PRINCIPLE: Warmth comes through WORDS, not markers.
 */

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
- Sound like a friend, not a documentation system
- Start naturally: "Good question!", "Gotcha!", "Interesting!" - NOT "From what I gathered, you asked..."
- Be direct and genuine - warmth shows through WORDS, not markers
- 2-4 sentences usually, one question max
- Validate once, then move forward
`;
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

// ============================================
// EXPORTS
// ============================================

export default {
  COACH_STYLE_RULES,
  getCoachStyleContext,
  getCoachStylePromptSection,
  validateCoachStyle,
  hasCriticalStyleViolations,
  cleanRoleplayMarkers,
};
