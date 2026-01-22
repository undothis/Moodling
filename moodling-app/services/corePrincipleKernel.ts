/**
 * Core Principle Kernel
 *
 * The "constitution" of Mood Leaf. Every service, every feature, every response
 * must align with these principles. This is the conscience of the app.
 *
 * WHY THIS EXISTS:
 * As the app grows, different features could drift from core values.
 * This kernel ensures alignment. Before any action, services can check:
 * "Does this violate a core principle?"
 *
 * ARCHITECTURE:
 * - Core Beliefs: What we believe about minds, people, growth
 * - Hard Constraints: Things we NEVER do (violations are blocked)
 * - Soft Principles: Things we strongly prefer (violations are warned)
 * - Alignment Checks: Functions other services call to validate actions
 */

// ============================================
// CORE BELIEFS
// These shape everything. They're not rules - they're truths we hold.
// ============================================

export const CORE_BELIEFS = {
  // About Minds
  MINDS_DIFFER: "Every mind works differently. There is no 'normal' - only different.",
  INTELLIGENCE_IS_MULTIPLE: "Traditional metrics (IQ, grades, tests) miss most forms of intelligence.",
  NEURODIVERSITY_IS_VALID: "Neurological differences (aphantasia, no inner monologue, etc.) are differences, not deficits.",
  CYCLES_ARE_NATURAL: "Low phases are integration and recovery, not failure.",
  FEELINGS_ARE_DATA: "Emotions are information, not problems to fix.",

  // About Growth
  GROWTH_IS_NONLINEAR: "Progress isn't a straight line. Spirals, plateaus, and retreats are all part of growth.",
  SELF_KNOWLEDGE_FIRST: "Understanding yourself comes before changing yourself.",
  NO_QUICK_FIXES: "Real change takes time. We don't promise instant transformation.",
  AUTONOMY_MATTERS: "The user is the expert on their own life. We guide, we don't prescribe.",

  // About This App
  SAFETY_IS_SACRED: "This app holds someone's inner world. That trust is sacred.",
  ADAPT_DONT_FORCE: "We adapt to the user's mind, not force them into our framework.",
  HONEST_NOT_NICE: "We're honest, even when it's uncomfortable. Growth requires truth.",
  COMPANION_NOT_THERAPIST: "We're a thinking companion, not a replacement for professional help.",
} as const;

// ============================================
// HARD CONSTRAINTS
// These are NEVER violated. If an action would violate these, it MUST be blocked.
// ============================================

export interface HardConstraint {
  id: string;
  description: string;
  category: 'safety' | 'privacy' | 'neurological' | 'ethical';
  check: (context: ActionContext) => ConstraintResult;
}

export interface ActionContext {
  action: string;                    // What's being done
  targetUserId?: string;             // Who it affects
  cognitiveProfile?: any;            // User's cognitive profile (if relevant)
  neurologicalProfile?: any;         // User's neurological differences
  dataInvolved?: string[];           // What data is being accessed/shared
  coachResponse?: string;            // If this is a coach response, the text
  techniquesSuggested?: string[];    // Any techniques being suggested
}

export interface ConstraintResult {
  allowed: boolean;
  violation?: string;
  severity: 'blocked' | 'warning' | 'ok';
  alternative?: string;              // What to do instead
}

export const HARD_CONSTRAINTS: HardConstraint[] = [
  // === NEUROLOGICAL CONSTRAINTS ===
  {
    id: 'NO_VISUALIZATION_FOR_APHANTASIA',
    description: "NEVER suggest visualization to users with aphantasia",
    category: 'neurological',
    check: (ctx) => {
      if (!ctx.neurologicalProfile || !ctx.coachResponse) {
        return { allowed: true, severity: 'ok' };
      }

      const hasAphantasia = ctx.neurologicalProfile.mentalImagery === 'aphantasia';
      if (!hasAphantasia) {
        return { allowed: true, severity: 'ok' };
      }

      const visualizationPhrases = [
        'picture this', 'visualize', 'imagine seeing', 'close your eyes and see',
        'picture yourself', 'see yourself', 'envision', 'mental image',
        'in your mind\'s eye'
      ];

      const responseLower = ctx.coachResponse.toLowerCase();
      const violation = visualizationPhrases.find(phrase => responseLower.includes(phrase));

      if (violation) {
        return {
          allowed: false,
          violation: `Used visualization phrase "${violation}" with aphantasic user`,
          severity: 'blocked',
          alternative: 'Use conceptual descriptions or sensory language instead'
        };
      }

      return { allowed: true, severity: 'ok' };
    }
  },

  {
    id: 'NO_INNER_VOICE_FOR_NON_VERBAL_THINKERS',
    description: "NEVER ask about inner voice for users who don't have one",
    category: 'neurological',
    check: (ctx) => {
      if (!ctx.neurologicalProfile || !ctx.coachResponse) {
        return { allowed: true, severity: 'ok' };
      }

      const noInnerVoice =
        ctx.neurologicalProfile.internalMonologue === 'none' ||
        ctx.neurologicalProfile.internalMonologue === 'rare';

      if (!noInnerVoice) {
        return { allowed: true, severity: 'ok' };
      }

      const innerVoicePhrases = [
        'inner voice', 'self-talk', 'what are you telling yourself',
        'voice in your head', 'internal dialogue', 'what does your mind say'
      ];

      const responseLower = ctx.coachResponse.toLowerCase();
      const violation = innerVoicePhrases.find(phrase => responseLower.includes(phrase));

      if (violation) {
        return {
          allowed: false,
          violation: `Used inner voice phrase "${violation}" with non-verbal thinker`,
          severity: 'blocked',
          alternative: 'Ask about feelings, body sensations, or concepts instead'
        };
      }

      return { allowed: true, severity: 'ok' };
    }
  },

  // === PRIVACY CONSTRAINTS ===
  {
    id: 'NO_DATA_WITHOUT_CONSENT',
    description: "NEVER share, export, or transmit user data without explicit consent",
    category: 'privacy',
    check: (ctx) => {
      const dataActions = ['share', 'export', 'transmit', 'send', 'upload'];
      const isDataAction = dataActions.some(a => ctx.action.toLowerCase().includes(a));

      if (isDataAction && ctx.dataInvolved && ctx.dataInvolved.length > 0) {
        // This would check against a consent registry in real implementation
        return {
          allowed: false,
          violation: 'Data action without verified consent',
          severity: 'blocked',
          alternative: 'Request explicit user consent first'
        };
      }

      return { allowed: true, severity: 'ok' };
    }
  },

  {
    id: 'NO_JOURNAL_ACCESS_WITHOUT_AUTH',
    description: "NEVER allow journal access without proper authentication",
    category: 'privacy',
    check: (ctx) => {
      if (ctx.action === 'access_journal' && !ctx.targetUserId) {
        return {
          allowed: false,
          violation: 'Journal access attempted without authentication',
          severity: 'blocked',
          alternative: 'Require biometric or voice authentication first'
        };
      }
      return { allowed: true, severity: 'ok' };
    }
  },

  // === SAFETY CONSTRAINTS ===
  {
    id: 'NO_CRISIS_DISMISSAL',
    description: "NEVER dismiss or minimize crisis signals",
    category: 'safety',
    check: (ctx) => {
      // In real implementation, this would be more sophisticated
      // For now, just ensure we never suggest "just think positive" during crisis
      if (ctx.coachResponse) {
        const dismissivePhrases = [
          'just think positive', 'it\'s not that bad', 'others have it worse',
          'snap out of it', 'just be happy', 'stop being negative'
        ];

        const responseLower = ctx.coachResponse.toLowerCase();
        const violation = dismissivePhrases.find(phrase => responseLower.includes(phrase));

        if (violation) {
          return {
            allowed: false,
            violation: `Used dismissive phrase "${violation}"`,
            severity: 'blocked',
            alternative: 'Validate feelings first, then offer support'
          };
        }
      }
      return { allowed: true, severity: 'ok' };
    }
  },

  {
    id: 'NO_MEDICAL_DIAGNOSIS',
    description: "NEVER diagnose medical or mental health conditions",
    category: 'safety',
    check: (ctx) => {
      if (ctx.coachResponse) {
        const diagnosisPhrases = [
          'you have depression', 'you have anxiety', 'you\'re bipolar',
          'you have adhd', 'you have ocd', 'you\'re autistic',
          'i diagnose', 'my diagnosis is'
        ];

        const responseLower = ctx.coachResponse.toLowerCase();
        const violation = diagnosisPhrases.find(phrase => responseLower.includes(phrase));

        if (violation) {
          return {
            allowed: false,
            violation: `Attempted diagnosis with phrase "${violation}"`,
            severity: 'blocked',
            alternative: 'Suggest professional consultation if appropriate'
          };
        }
      }
      return { allowed: true, severity: 'ok' };
    }
  },

  // === ETHICAL CONSTRAINTS ===
  {
    id: 'NO_PATHOLOGIZING_CYCLES',
    description: "NEVER frame natural cognitive rhythms as disorders",
    category: 'ethical',
    check: (ctx) => {
      if (ctx.coachResponse && ctx.cognitiveProfile?.cognitiveRhythm) {
        const isCyclical = ['cyclical_mild', 'cyclical_pronounced', 'burst_recovery']
          .includes(ctx.cognitiveProfile.cognitiveRhythm);

        if (isCyclical) {
          const pathologizingPhrases = [
            'you should be more consistent', 'your mood swings are a problem',
            'this instability', 'you need to be more stable',
            'these ups and downs are concerning'
          ];

          const responseLower = ctx.coachResponse.toLowerCase();
          const violation = pathologizingPhrases.find(phrase => responseLower.includes(phrase));

          if (violation) {
            return {
              allowed: false,
              violation: `Pathologized natural rhythm with "${violation}"`,
              severity: 'blocked',
              alternative: 'Frame cycles as natural patterns to work with, not problems to fix'
            };
          }
        }
      }
      return { allowed: true, severity: 'ok' };
    }
  },

  {
    id: 'NO_FORCING_COGNITIVE_MODE',
    description: "NEVER force user into a cognitive mode that isn't theirs",
    category: 'ethical',
    check: (ctx) => {
      if (ctx.coachResponse && ctx.cognitiveProfile?.primaryCognitiveMode) {
        // Don't tell a systems thinker to "focus on the details"
        // Don't tell an embodied thinker to "think it through logically"
        // This is a simplified check - real implementation would be more nuanced

        const mode = ctx.cognitiveProfile.primaryCognitiveMode;
        const responseLower = ctx.coachResponse.toLowerCase();

        const modeConflicts: Record<string, string[]> = {
          conceptual_systems: ['focus on the details', 'take it step by step', 'don\'t overthink'],
          embodied_somatic: ['think it through', 'analyze this logically', 'reason through'],
          emotional_relational: ['set emotions aside', 'think rationally', 'don\'t be emotional'],
          procedural_sequential: ['see the big picture', 'don\'t get stuck on steps', 'be flexible'],
        };

        const conflicts = modeConflicts[mode] || [];
        const violation = conflicts.find(phrase => responseLower.includes(phrase));

        if (violation) {
          return {
            allowed: false,
            violation: `Forced incompatible cognitive approach with "${violation}"`,
            severity: 'blocked',
            alternative: `Adapt to their ${mode} thinking style`
          };
        }
      }
      return { allowed: true, severity: 'ok' };
    }
  }
];

// ============================================
// SOFT PRINCIPLES
// These are strongly preferred. Violations generate warnings, not blocks.
// ============================================

export interface SoftPrinciple {
  id: string;
  description: string;
  category: 'coaching' | 'ux' | 'communication';
  check: (context: ActionContext) => PrincipleResult;
}

export interface PrincipleResult {
  aligned: boolean;
  concern?: string;
  suggestion?: string;
}

export const SOFT_PRINCIPLES: SoftPrinciple[] = [
  {
    id: 'VALIDATE_BEFORE_ADVISE',
    description: "Validate emotions before offering advice",
    category: 'coaching',
    check: (ctx) => {
      // Check if response jumps straight to advice without validation
      // This is a heuristic - real implementation would be more sophisticated
      if (ctx.coachResponse) {
        const adviceStarters = ['you should', 'try to', 'what you need to do', 'the solution is'];
        const validationPhrases = ['i hear', 'that sounds', 'it makes sense', 'i understand', 'that\'s'];

        const responseLower = ctx.coachResponse.toLowerCase();
        const hasAdvice = adviceStarters.some(s => responseLower.includes(s));
        const hasValidation = validationPhrases.some(v => responseLower.includes(v));

        if (hasAdvice && !hasValidation) {
          return {
            aligned: false,
            concern: 'Response may jump to advice without validating feelings',
            suggestion: 'Start with emotional validation before offering solutions'
          };
        }
      }
      return { aligned: true };
    }
  },

  {
    id: 'QUESTIONS_OVER_STATEMENTS',
    description: "Prefer questions that invite reflection over statements that prescribe",
    category: 'coaching',
    check: (ctx) => {
      if (ctx.coachResponse) {
        const hasQuestion = ctx.coachResponse.includes('?');
        const length = ctx.coachResponse.length;

        // If it's a long response with no questions, suggest adding some
        if (length > 300 && !hasQuestion) {
          return {
            aligned: false,
            concern: 'Long response without reflective questions',
            suggestion: 'Consider ending with a question that invites the user to reflect'
          };
        }
      }
      return { aligned: true };
    }
  },

  {
    id: 'BREVITY_RESPECTED',
    description: "Match response length to user's communication preference",
    category: 'communication',
    check: (ctx) => {
      if (ctx.coachResponse && ctx.cognitiveProfile) {
        const prefersBrief =
          ctx.cognitiveProfile.communicationStyle === 'direct' ||
          ctx.cognitiveProfile.prefersWrittenOrSpoken === 'spoken';

        if (prefersBrief && ctx.coachResponse.length > 500) {
          return {
            aligned: false,
            concern: 'Response may be too long for user who prefers brevity',
            suggestion: 'Consider shortening - this user prefers direct, concise communication'
          };
        }
      }
      return { aligned: true };
    }
  },

  {
    id: 'HONOR_PROCESSING_TIME',
    description: "Don't rapid-fire questions at users who need time to think",
    category: 'communication',
    check: (ctx) => {
      if (ctx.coachResponse && ctx.cognitiveProfile?.needsTimeToRespond) {
        const questionCount = (ctx.coachResponse.match(/\?/g) || []).length;

        if (questionCount > 2) {
          return {
            aligned: false,
            concern: 'Multiple questions for user who needs processing time',
            suggestion: 'Limit to one question at a time for this user'
          };
        }
      }
      return { aligned: true };
    }
  },

  {
    id: 'LOW_PHASE_GENTLENESS',
    description: "Be gentler during user's low energy phases",
    category: 'coaching',
    check: (ctx) => {
      // This would require knowing current phase - placeholder for now
      // Real implementation would check against cycle tracking
      return { aligned: true };
    }
  }
];

// ============================================
// ALIGNMENT CHECKING API
// Functions other services call to validate their actions
// ============================================

/**
 * Check if an action violates any hard constraints
 * Call this BEFORE executing any significant action
 */
export function checkHardConstraints(context: ActionContext): {
  allowed: boolean;
  violations: ConstraintResult[];
} {
  const violations: ConstraintResult[] = [];

  for (const constraint of HARD_CONSTRAINTS) {
    const result = constraint.check(context);
    if (!result.allowed) {
      violations.push(result);
    }
  }

  return {
    allowed: violations.length === 0,
    violations
  };
}

/**
 * Check alignment with soft principles
 * Call this to get suggestions for improvement
 */
export function checkSoftPrinciples(context: ActionContext): {
  fullyAligned: boolean;
  concerns: PrincipleResult[];
} {
  const concerns: PrincipleResult[] = [];

  for (const principle of SOFT_PRINCIPLES) {
    const result = principle.check(context);
    if (!result.aligned) {
      concerns.push(result);
    }
  }

  return {
    fullyAligned: concerns.length === 0,
    concerns
  };
}

/**
 * Full alignment check - both hard and soft
 * Returns a complete alignment report
 */
export interface AlignmentReport {
  timestamp: string;
  action: string;

  // Hard constraints
  hardConstraintsPassed: boolean;
  blockedBy: ConstraintResult[];

  // Soft principles
  softPrinciplesAligned: boolean;
  suggestions: PrincipleResult[];

  // Overall
  canProceed: boolean;
  overallScore: number;  // 0-100
}

export function checkAlignment(context: ActionContext): AlignmentReport {
  const hardCheck = checkHardConstraints(context);
  const softCheck = checkSoftPrinciples(context);

  // Calculate overall score
  const hardPenalty = hardCheck.violations.length * 50;  // Major penalty for hard violations
  const softPenalty = softCheck.concerns.length * 10;    // Minor penalty for soft concerns
  const overallScore = Math.max(0, 100 - hardPenalty - softPenalty);

  return {
    timestamp: new Date().toISOString(),
    action: context.action,

    hardConstraintsPassed: hardCheck.allowed,
    blockedBy: hardCheck.violations,

    softPrinciplesAligned: softCheck.fullyAligned,
    suggestions: softCheck.concerns,

    canProceed: hardCheck.allowed,  // Only hard constraints actually block
    overallScore
  };
}

/**
 * Quick check for a specific constraint by ID
 */
export function checkSpecificConstraint(
  constraintId: string,
  context: ActionContext
): ConstraintResult | null {
  const constraint = HARD_CONSTRAINTS.find(c => c.id === constraintId);
  if (!constraint) return null;
  return constraint.check(context);
}

/**
 * Get all core beliefs as formatted text (for LLM context)
 */
export function getCoreBeliefContext(): string {
  const parts = ['CORE BELIEFS (These guide all interactions):'];

  for (const [key, belief] of Object.entries(CORE_BELIEFS)) {
    parts.push(`- ${belief}`);
  }

  return parts.join('\n');
}

/**
 * Get critical constraints as formatted text (for LLM context)
 */
export function getCriticalConstraintsContext(): string {
  const parts = ['CRITICAL CONSTRAINTS (Never violate these):'];

  for (const constraint of HARD_CONSTRAINTS) {
    parts.push(`- ${constraint.description}`);
  }

  return parts.join('\n');
}

/**
 * Validate a coach response before sending
 * This is the main function the conversation controller should call
 */
export async function validateCoachResponse(
  response: string,
  cognitiveProfile: any,
  neurologicalProfile: any
): Promise<{
  isValid: boolean;
  canSend: boolean;
  modifications?: string;
  report: AlignmentReport;
}> {
  const context: ActionContext = {
    action: 'coach_response',
    cognitiveProfile,
    neurologicalProfile,
    coachResponse: response
  };

  const report = checkAlignment(context);

  return {
    isValid: report.hardConstraintsPassed && report.softPrinciplesAligned,
    canSend: report.canProceed,  // Blocked only by hard constraints
    modifications: report.blockedBy.length > 0
      ? report.blockedBy.map(v => v.alternative).join('; ')
      : undefined,
    report
  };
}

// ============================================
// PRINCIPLE INJECTION FOR LLM
// Add this to system prompts to ensure AI alignment
// ============================================

/**
 * Get the full principle context for LLM system prompts
 * This should be included in every conversation with the AI
 */
export function getPrincipleContextForLLM(): string {
  const parts: string[] = [];

  // Core beliefs
  parts.push('=== CORE PRINCIPLES (Your Guiding Philosophy) ===\n');
  for (const [key, belief] of Object.entries(CORE_BELIEFS)) {
    parts.push(`${belief}`);
  }

  // Hard constraints
  parts.push('\n\n=== ABSOLUTE CONSTRAINTS (Never Violate) ===\n');
  const criticalConstraints = HARD_CONSTRAINTS.filter(c =>
    c.category === 'neurological' || c.category === 'safety'
  );
  for (const constraint of criticalConstraints) {
    parts.push(`- ${constraint.description}`);
  }

  // Reminders
  parts.push('\n\n=== REMEMBER ===');
  parts.push('- You are a companion, not a therapist');
  parts.push('- Adapt to how THEY think, don\'t make them adapt to you');
  parts.push('- Low phases are integration, not failure');
  parts.push('- Validate before advising');
  parts.push('- When in doubt, ask - don\'t assume');

  return parts.join('\n');
}

// ============================================
// EXPORTS FOR SERVICE INTEGRATION
// ============================================

export default {
  CORE_BELIEFS,
  HARD_CONSTRAINTS,
  SOFT_PRINCIPLES,
  checkHardConstraints,
  checkSoftPrinciples,
  checkAlignment,
  checkSpecificConstraint,
  validateCoachResponse,
  getCoreBeliefContext,
  getCriticalConstraintsContext,
  getPrincipleContextForLLM
};
