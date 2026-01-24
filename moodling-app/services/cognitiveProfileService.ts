/**
 * Cognitive Profile Service
 *
 * Discovers HOW someone thinks, not IF they're smart.
 * Traditional IQ fails most people. This captures:
 * - How you process information (patterns vs details vs stories)
 * - How you learn best (doing, watching, reading, discussing)
 * - How you relate to others (social energy, communication style)
 * - How you handle emotions (sensitive, analytical, action-oriented)
 *
 * NO JARGON. No "INFP". No "high IQ". Just human understanding.
 *
 * The onboarding ADAPTS - asks different questions based on responses.
 * Someone who thinks in systems gets systems questions.
 * Someone who thinks in feelings gets feeling questions.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES - How People Actually Think
// ============================================

/**
 * Cognitive Modes - Primary operating modes of the mind
 * NOT personality types or intelligence levels
 * Most people have 1-2 dominant modes
 *
 * These are based on a practical taxonomy of how minds actually work,
 * not clinical categories or pop psychology.
 */
export type CognitiveMode =
  | 'procedural_sequential'    // "Show me the steps" - linear, rule-based, process-oriented
  | 'analytical_symbolic'      // "Let me analyze the variables" - logical, symbolic, precise
  | 'conceptual_systems'       // "I see how this all fits together" - systems, patterns, frameworks
  | 'narrative_meaning'        // "What's the story here?" - story-driven, identity-aware, meaning-seeking
  | 'embodied_somatic'         // "I know it in my body" - sensation, movement, learning by doing
  | 'associative_divergent'    // "Everything connects to everything" - rapid connections, nonlinear
  | 'emotional_relational'     // "How does this affect people?" - attuned to others, interpersonal
  | 'visual_spatial'           // "I see it" - thinks in images, spatial models, design-oriented
  | 'temporal_foresight'       // "Where does this lead?" - timelines, consequences, long arcs
  | 'integrative_meta';        // "How do these thinking styles interact?" - meta-cognition, holds contradictions

/**
 * Legacy ProcessingStyle - maps to cognitive modes for backward compatibility
 */
export type ProcessingStyle =
  | 'patterns'      // → conceptual_systems
  | 'details'       // → procedural_sequential
  | 'stories'       // → narrative_meaning
  | 'feelings'      // → emotional_relational
  | 'actions'       // → embodied_somatic
  | 'synthesis';    // → integrative_meta

/**
 * How someone best receives new information
 */
export type LearningStyle =
  | 'visual'        // Needs to see it (diagrams, images, written)
  | 'auditory'      // Needs to hear it (conversation, explanation)
  | 'kinesthetic'   // Needs to do it (practice, movement, hands-on)
  | 'reading'       // Needs to read/write it (text, notes)
  | 'social'        // Needs to discuss it (dialogue, debate)
  | 'solitary';     // Needs alone time to process

/**
 * Social energy and comfort
 */
export type SocialOrientation =
  | 'energized_by_people'    // Gains energy from interaction
  | 'drained_by_people'      // Needs recovery after socializing
  | 'selective'              // Deep connections > many connections
  | 'situational';           // Depends on context and people

/**
 * How someone handles emotions
 */
export type EmotionalProcessing =
  | 'feeler_first'     // Emotions come first, then logic
  | 'thinker_first'    // Logic first, emotions processed after
  | 'integrated'       // Emotions and logic intertwined
  | 'action_oriented'  // Processes emotions through doing
  | 'delayed';         // Emotions surface later, not in moment

/**
 * Communication preference
 */
export type CommunicationStyle =
  | 'direct'           // Get to the point, clear and concise
  | 'exploratory'      // Think out loud, wander to the answer
  | 'reflective'       // Need time to respond, prefer writing
  | 'collaborative'    // Build understanding together
  | 'metaphorical';    // Understand through analogies and images

/**
 * How someone prefers structure
 */
export type StructurePreference =
  | 'loves_structure'      // Plans, lists, clear steps
  | 'needs_flexibility'    // Goes with flow, adapts
  | 'structured_start'     // Needs structure to begin, then flows
  | 'emergent';            // Structure emerges from doing

/**
 * Sensitivity level (emotional/sensory)
 */
export type SensitivityLevel = 'highly_sensitive' | 'moderate' | 'low_sensitivity';

/**
 * Mental imagery ability (visualization)
 * Aphantasia spectrum - crucial for coaching techniques
 */
export type MentalImageryAbility =
  | 'aphantasia'           // Cannot visualize at all - "mind's eye is blind"
  | 'hypophantasia'        // Weak/dim mental images
  | 'typical'              // Average visualization ability
  | 'hyperphantasia';      // Extremely vivid, almost real imagery

/**
 * Internal monologue presence
 * Some people have constant inner speech, others think in abstract concepts
 */
export type InternalMonologue =
  | 'constant'             // Always talking to themselves internally
  | 'frequent'             // Often have inner speech
  | 'situational'          // Only in certain contexts
  | 'rare'                 // Rarely have verbal thoughts
  | 'none';                // Think in concepts/feelings, not words

/**
 * Auditory imagination (can you "hear" music/voices in your head?)
 */
export type AuditoryImagination =
  | 'vivid'                // Can clearly "hear" music, voices, sounds
  | 'moderate'             // Some auditory imagination
  | 'weak'                 // Faint or unclear
  | 'none';                // Cannot imagine sounds

/**
 * Prospective imagination (can you imagine future scenarios?)
 */
export type ProspectiveImagination =
  | 'vivid'                // Can vividly imagine future scenarios
  | 'conceptual'           // Understand future but can't "see" it
  | 'limited';             // Difficulty imagining future scenarios

// ============================================
// COGNITIVE RHYTHMS (How the mind cycles)
// ============================================

/**
 * Cognitive Rhythm - How clarity and energy fluctuate over time
 *
 * This is CRITICAL for understanding someone's experience.
 * Cyclical minds often feel broken when they're just in a low phase.
 * "Low phases are not failure — they are integration and recovery."
 */
export type CognitiveRhythm =
  | 'steady_state'         // Fairly consistent clarity and energy
  | 'cyclical_mild'        // Some fluctuation, manageable waves
  | 'cyclical_pronounced'  // Clear high/low phases, significant swings
  | 'burst_recovery';      // Intense productive bursts followed by crashes

/**
 * Cycle characteristics for cyclical minds
 */
export interface CyclicalPattern {
  // Typical cycle length
  typicalCycleLength: 'days' | 'weeks' | 'months' | 'irregular';

  // High phase characteristics
  highPhase: {
    description: string;        // What they're like at peak
    typicalDuration: string;    // "2-3 days", "a week", etc.
    energyLevel: 'moderate' | 'high' | 'very_high' | 'manic';
    insights: boolean;          // Do insights come during high phases?
  };

  // Low phase characteristics
  lowPhase: {
    description: string;
    typicalDuration: string;
    energyLevel: 'depleted' | 'low' | 'functional_low';
    needsDuring: string[];      // What helps during low phases
  };

  // Triggers
  knownTriggers: {
    highPhaseTriggers: string[];  // What tends to start a high phase
    lowPhaseTriggers: string[];   // What tends to start a low phase
  };

  // Recovery
  recoveryNeeds: string[];  // What they need after a cycle
}

/**
 * Energy pattern throughout the day
 */
export type DailyEnergyPattern =
  | 'morning_person'       // Peak energy in morning, fades by evening
  | 'night_owl'            // Slow start, peak energy late
  | 'afternoon_peak'       // Midday is best
  | 'consistent'           // Relatively even throughout day
  | 'unpredictable';       // No clear pattern

/**
 * Sleep onset - how easily someone falls asleep
 */
export type SleepOnset =
  | 'falls_asleep_easily'    // Out within minutes
  | 'takes_a_while'          // 15-30 minutes typical
  | 'often_struggles'        // Mind races, takes 30+ minutes
  | 'highly_variable';       // Depends on the day

/**
 * Sleep maintenance - staying asleep through the night
 */
export type SleepMaintenance =
  | 'sleeps_through'         // Rarely wakes
  | 'wakes_but_returns'      // Wakes but falls back asleep easily
  | 'wakes_and_struggles'    // Wakes and mind races
  | 'wakes_too_early'        // Wakes before alarm, can't return
  | 'fragmented';            // Multiple wake-ups, never deep

/**
 * What happens when trying to sleep
 */
export type SleepBlocker =
  | 'racing_thoughts'        // Mind won't quiet
  | 'body_tension'           // Physical restlessness
  | 'worry_anxiety'          // Anxious about tomorrow or life
  | 'replaying_day'          // Can't stop reviewing what happened
  | 'creative_surge'         // Ideas come flooding at bedtime
  | 'environment'            // Noise, light, temperature
  | 'none_identified';       // No clear pattern

/**
 * Sleep quality perception
 */
export type SleepQuality =
  | 'refreshed'              // Usually wake feeling rested
  | 'functional'             // Good enough to function
  | 'tired_but_okay'         // Often tired but manage
  | 'chronically_tired'      // Rarely feel rested
  | 'variable';              // Unpredictable

/**
 * How someone experiences their productivity
 */
export type ProductivityStyle =
  | 'steady_consistent'    // Same output day to day
  | 'burst_focused'        // Intense focused sprints
  | 'slow_build'           // Needs warm-up time, builds momentum
  | 'deadline_driven'      // Works best under pressure
  | 'energy_dependent';    // Completely depends on current energy

/**
 * The complete cognitive profile
 */
export interface CognitiveProfile {
  // Core cognitive mode (primary way the mind works)
  primaryCognitiveMode: CognitiveMode;
  secondaryCognitiveMode: CognitiveMode | null;

  // Legacy: Core processing (for backward compatibility)
  primaryProcessing: ProcessingStyle;
  secondaryProcessing: ProcessingStyle | null;

  // === NEUROLOGICAL DIFFERENCES (Critical for technique selection) ===
  mentalImagery: MentalImageryAbility;
  internalMonologue: InternalMonologue;
  auditoryImagination: AuditoryImagination;
  prospectiveImagination: ProspectiveImagination;

  // Learning
  learningStyles: LearningStyle[]; // Can have multiple
  bestLearningContext: string; // Free text, learned over time

  // Social
  socialOrientation: SocialOrientation;
  socialComfortLevel: number; // 1-10
  preferredGroupSize: 'one_on_one' | 'small_group' | 'large_group' | 'alone';

  // Emotional
  emotionalProcessing: EmotionalProcessing;
  sensitivityLevel: SensitivityLevel;
  emotionalIntelligence: 'high' | 'moderate' | 'developing';

  // Communication
  communicationStyle: CommunicationStyle;
  prefersWrittenOrSpoken: 'written' | 'spoken' | 'either';
  needsTimeToRespond: boolean;

  // Structure
  structurePreference: StructurePreference;
  comfortWithAmbiguity: 'high' | 'moderate' | 'low';

  // Self-awareness
  selfAwarenessLevel: 'high' | 'moderate' | 'developing';

  // Strengths discovered (updated over time)
  discoveredStrengths: string[];

  // How traditional education/testing worked for them
  traditionalLearningFit: 'worked_well' | 'struggled' | 'mixed';

  // === COGNITIVE RHYTHMS (How clarity/energy fluctuate) ===
  cognitiveRhythm: CognitiveRhythm;
  cyclicalPattern: CyclicalPattern | null;  // Only populated if rhythm is cyclical
  dailyEnergyPattern: DailyEnergyPattern;
  productivityStyle: ProductivityStyle;

  // === SLEEP PATTERNS ===
  sleepOnset: SleepOnset;
  sleepMaintenance: SleepMaintenance;
  primarySleepBlocker: SleepBlocker | null;
  sleepQuality: SleepQuality;
  idealSleepHours: number | null;  // What they feel they need
  usesScreensBeforeBed: boolean;
  hasTriedSleepTechniques: boolean;

  // Metadata
  completedOnboarding: boolean;
  onboardingDepth: 'quick' | 'standard' | 'deep';
  lastUpdated: string;
  confidenceLevel: number; // 0-100, how sure we are about this profile
}

// ============================================
// ONBOARDING QUESTIONS
// ============================================

export interface OnboardingQuestion {
  id: string;
  text: string;
  subtext?: string; // Clarifying text
  type: 'choice' | 'scale' | 'multiselect' | 'open';
  options?: OnboardingOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
  measures: string[]; // What dimensions this question informs
  followUpCondition?: (answer: any) => boolean; // Should we ask follow-up?
  followUpQuestions?: string[]; // IDs of follow-up questions
  adaptiveDepth: 'basic' | 'standard' | 'deep'; // When to show this question
  requiresPrevious?: string[]; // Question IDs that must be answered first
}

export interface OnboardingOption {
  value: string;
  label: string;
  description?: string;
  indicates: Partial<CognitiveProfile>; // What this answer suggests
}

/**
 * Core onboarding questions - adaptive and human
 *
 * "There are no right answers. This helps your coach understand how your mind works."
 *
 * Based on practical cognitive modes research, not clinical categories.
 */
export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  // ========== OPENING ==========
  {
    id: 'welcome_comfort',
    text: "Before we start, how are you feeling about answering some questions about yourself?",
    subtext: "There are no wrong answers. This helps me understand how to talk with you.",
    type: 'choice',
    options: [
      {
        value: 'excited',
        label: "I like thinking about this stuff",
        indicates: { selfAwarenessLevel: 'high' }
      },
      {
        value: 'neutral',
        label: "I'm open to it",
        indicates: { selfAwarenessLevel: 'moderate' }
      },
      {
        value: 'unsure',
        label: "I'm not sure I know myself that well",
        indicates: { selfAwarenessLevel: 'developing' }
      },
      {
        value: 'anxious',
        label: "Questions about myself make me a bit anxious",
        indicates: { sensitivityLevel: 'highly_sensitive' }
      }
    ],
    measures: ['selfAwarenessLevel', 'sensitivityLevel'],
    adaptiveDepth: 'basic'
  },

  // ========== CORE DIAGNOSTIC: LEARNING ==========
  {
    id: 'learning_natural',
    text: "When learning something new, what feels most natural?",
    type: 'choice',
    options: [
      {
        value: 'big_picture',
        label: "Seeing the big picture first",
        description: "I need to understand how it all fits together",
        indicates: { primaryCognitiveMode: 'conceptual_systems', primaryProcessing: 'patterns' }
      },
      {
        value: 'clear_steps',
        label: "Being shown clear steps",
        description: "I like logical, sequential instruction",
        indicates: { primaryCognitiveMode: 'procedural_sequential', primaryProcessing: 'details' }
      },
      {
        value: 'story_example',
        label: "Hearing a story or example",
        description: "I understand through narrative",
        indicates: { primaryCognitiveMode: 'narrative_meaning', primaryProcessing: 'stories' }
      },
      {
        value: 'try_it',
        label: "Just trying it out",
        description: "I learn by doing, not listening",
        indicates: { primaryCognitiveMode: 'embodied_somatic', primaryProcessing: 'actions' }
      },
      {
        value: 'connections',
        label: "Letting ideas connect freely",
        description: "My mind makes leaps",
        indicates: { primaryCognitiveMode: 'associative_divergent', primaryProcessing: 'synthesis' }
      }
    ],
    measures: ['primaryCognitiveMode', 'primaryProcessing'],
    adaptiveDepth: 'basic'
  },

  // ========== CORE DIAGNOSTIC: FRUSTRATION ==========
  {
    id: 'frustration_source',
    text: "When someone explains something, what frustrates you most?",
    type: 'choice',
    options: [
      {
        value: 'too_many_steps',
        label: "Too many steps",
        description: "I need the concept, not the procedure",
        indicates: { primaryCognitiveMode: 'conceptual_systems' }
      },
      {
        value: 'too_abstract',
        label: "Too much abstraction",
        description: "Give me something concrete",
        indicates: { primaryCognitiveMode: 'embodied_somatic' }
      },
      {
        value: 'no_context',
        label: "No emotional context",
        description: "I need to know why it matters",
        indicates: { primaryCognitiveMode: 'narrative_meaning', emotionalProcessing: 'feeler_first' }
      },
      {
        value: 'not_enough_structure',
        label: "Not enough structure",
        description: "I need clear organization",
        indicates: { primaryCognitiveMode: 'procedural_sequential', structurePreference: 'loves_structure' }
      },
      {
        value: 'being_rushed',
        label: "Being rushed",
        description: "I need time to process",
        indicates: { needsTimeToRespond: true, communicationStyle: 'reflective' }
      }
    ],
    measures: ['primaryCognitiveMode', 'emotionalProcessing', 'structurePreference'],
    adaptiveDepth: 'basic'
  },

  // ========== CORE DIAGNOSTIC: INSIGHTS ==========
  {
    id: 'insight_arrival',
    text: "How do insights usually arrive for you?",
    type: 'choice',
    options: [
      {
        value: 'suddenly',
        label: "Suddenly, fully formed",
        description: "I just... know things",
        indicates: { primaryCognitiveMode: 'conceptual_systems', discoveredStrengths: ['intuitive insight'] }
      },
      {
        value: 'gradually',
        label: "Gradually, step by step",
        description: "I build understanding piece by piece",
        indicates: { primaryCognitiveMode: 'procedural_sequential' }
      },
      {
        value: 'emotional',
        label: "Through emotional moments",
        description: "Feelings lead me to understanding",
        indicates: { primaryCognitiveMode: 'emotional_relational', emotionalProcessing: 'feeler_first' }
      },
      {
        value: 'while_doing',
        label: "While moving or doing something else",
        description: "My body helps me think",
        indicates: { primaryCognitiveMode: 'embodied_somatic' }
      },
      {
        value: 'bursts',
        label: "In bursts of connections",
        description: "Everything suddenly links together",
        indicates: { primaryCognitiveMode: 'associative_divergent', discoveredStrengths: ['rapid connections'] }
      }
    ],
    measures: ['primaryCognitiveMode', 'emotionalProcessing', 'discoveredStrengths'],
    adaptiveDepth: 'basic'
  },

  // ========== CORE DIAGNOSTIC: MISUNDERSTOOD ==========
  {
    id: 'feel_misunderstood',
    text: "What makes you feel most misunderstood?",
    type: 'choice',
    options: [
      {
        value: 'show_work',
        label: 'Being told to "show your work"',
        description: "I know the answer but can't explain how",
        indicates: { primaryCognitiveMode: 'conceptual_systems', traditionalLearningFit: 'struggled' }
      },
      {
        value: 'rushed_explain',
        label: "Being rushed to explain",
        description: "I need time to articulate",
        indicates: { communicationStyle: 'reflective', needsTimeToRespond: true }
      },
      {
        value: 'labeled_unfocused',
        label: "Being labeled unfocused",
        description: "My mind works differently, not worse",
        indicates: { primaryCognitiveMode: 'associative_divergent', traditionalLearningFit: 'struggled' }
      },
      {
        value: 'too_sensitive',
        label: "Being told I'm too sensitive",
        description: "Sensitivity is how I understand",
        indicates: { sensitivityLevel: 'highly_sensitive', primaryCognitiveMode: 'emotional_relational' }
      },
      {
        value: 'single_answer',
        label: "Being asked for a single answer",
        description: "I see multiple possibilities",
        indicates: { primaryCognitiveMode: 'integrative_meta', comfortWithAmbiguity: 'high' }
      }
    ],
    measures: ['primaryCognitiveMode', 'traditionalLearningFit', 'sensitivityLevel'],
    adaptiveDepth: 'basic'
  },

  // ========== CORE DIAGNOSTIC: REFLECTION ==========
  {
    id: 'reflection_helps',
    text: "When reflecting, what helps most?",
    type: 'choice',
    options: [
      {
        value: 'metaphors',
        label: "Metaphors and analogies",
        description: "Images and comparisons click for me",
        indicates: { communicationStyle: 'metaphorical', primaryCognitiveMode: 'visual_spatial' }
      },
      {
        value: 'direct_questions',
        label: "Direct questions",
        description: "Clear, specific prompts",
        indicates: { communicationStyle: 'direct', structurePreference: 'loves_structure' }
      },
      {
        value: 'emotional_validation',
        label: "Emotional validation",
        description: "Being heard before being helped",
        indicates: { emotionalProcessing: 'feeler_first', primaryCognitiveMode: 'emotional_relational' }
      },
      {
        value: 'visual_framing',
        label: "Visual or spatial framing",
        description: "I think in pictures and models",
        indicates: { primaryCognitiveMode: 'visual_spatial', learningStyles: ['visual'] }
      },
      {
        value: 'future_prompts',
        label: "Future-oriented prompts",
        description: "Where this leads, what it means long-term",
        indicates: { primaryCognitiveMode: 'temporal_foresight' }
      }
    ],
    measures: ['communicationStyle', 'primaryCognitiveMode', 'emotionalProcessing'],
    adaptiveDepth: 'basic'
  },

  // ========== CORE DIAGNOSTIC: TRUEST STATEMENT ==========
  {
    id: 'truest_statement',
    text: "Which feels truest?",
    type: 'choice',
    options: [
      {
        value: 'know_more_than_explain',
        label: "I know more than I can explain",
        description: "The understanding is there, words are hard",
        indicates: { primaryCognitiveMode: 'conceptual_systems', discoveredStrengths: ['deep intuition'] }
      },
      {
        value: 'explain_better_than_feel',
        label: "I explain better than I feel",
        description: "Logic is easier than emotions",
        indicates: { primaryCognitiveMode: 'analytical_symbolic', emotionalProcessing: 'thinker_first' }
      },
      {
        value: 'feel_before_think',
        label: "I feel things before I think them",
        description: "Emotions are my first language",
        indicates: { primaryCognitiveMode: 'emotional_relational', emotionalProcessing: 'feeler_first' }
      },
      {
        value: 'need_structure',
        label: "I need structure to feel safe",
        description: "Plans and organization ground me",
        indicates: { primaryCognitiveMode: 'procedural_sequential', structurePreference: 'loves_structure' }
      },
      {
        value: 'see_patterns',
        label: "I see patterns others miss",
        description: "Connections are obvious to me",
        indicates: { primaryCognitiveMode: 'conceptual_systems', discoveredStrengths: ['pattern recognition'] }
      }
    ],
    measures: ['primaryCognitiveMode', 'emotionalProcessing', 'structurePreference', 'discoveredStrengths'],
    adaptiveDepth: 'basic'
  },

  // ========== NEUROLOGICAL DIFFERENCES (Critical for technique selection) ==========
  // These questions detect aphantasia, internal monologue differences, etc.
  // Essential because many coaching techniques assume abilities not everyone has

  {
    id: 'mental_imagery',
    text: "When someone says 'picture a beach', what happens in your mind?",
    subtext: "This isn't about imagination skill - brains genuinely work differently here.",
    type: 'choice',
    options: [
      {
        value: 'vivid',
        label: "I see it clearly, almost like a photo or movie",
        description: "Colors, details, movement - it's all there",
        indicates: { mentalImagery: 'hyperphantasia' }
      },
      {
        value: 'moderate',
        label: "I see something, but it's fuzzy or fleeting",
        description: "I can imagine it, but it's not vivid",
        indicates: { mentalImagery: 'typical' }
      },
      {
        value: 'weak',
        label: "I get a vague sense, but not really a picture",
        description: "More like knowing what a beach is than seeing one",
        indicates: { mentalImagery: 'hypophantasia' }
      },
      {
        value: 'nothing',
        label: "Nothing visual happens - I just think the concept 'beach'",
        description: "My mind's eye is basically blind",
        indicates: { mentalImagery: 'aphantasia', discoveredStrengths: ['conceptual thinker'] }
      }
    ],
    measures: ['mentalImagery', 'discoveredStrengths'],
    adaptiveDepth: 'basic'
  },

  {
    id: 'internal_voice',
    text: "Do you have an internal voice - like talking to yourself in your head?",
    subtext: "Some people think in words, others in concepts, images, or feelings.",
    type: 'choice',
    options: [
      {
        value: 'constant',
        label: "Yes, constantly - there's always a voice narrating",
        indicates: { internalMonologue: 'constant' }
      },
      {
        value: 'frequent',
        label: "Often, especially when thinking through things",
        indicates: { internalMonologue: 'frequent' }
      },
      {
        value: 'sometimes',
        label: "Sometimes, but I also think in other ways",
        indicates: { internalMonologue: 'situational' }
      },
      {
        value: 'rarely',
        label: "Rarely - my thoughts aren't usually in words",
        indicates: { internalMonologue: 'rare' }
      },
      {
        value: 'never',
        label: "I don't really have verbal thoughts",
        description: "I think in feelings, concepts, or abstract ways",
        indicates: { internalMonologue: 'none', discoveredStrengths: ['non-verbal thinker'] }
      }
    ],
    measures: ['internalMonologue', 'discoveredStrengths'],
    adaptiveDepth: 'basic'
  },

  {
    id: 'auditory_imagination',
    text: "Can you 'hear' music in your head - like actually hear it, not just remember it exists?",
    type: 'choice',
    options: [
      {
        value: 'vivid',
        label: "Yes, I can hear songs clearly in my mind",
        description: "I can replay music almost like it's playing",
        indicates: { auditoryImagination: 'vivid' }
      },
      {
        value: 'moderate',
        label: "Sort of - I can recall melodies but it's not vivid",
        indicates: { auditoryImagination: 'moderate' }
      },
      {
        value: 'weak',
        label: "Barely - I know the song but can't really 'hear' it",
        indicates: { auditoryImagination: 'weak' }
      },
      {
        value: 'none',
        label: "No - I can't imagine sounds at all",
        indicates: { auditoryImagination: 'none' }
      }
    ],
    measures: ['auditoryImagination'],
    adaptiveDepth: 'standard'
  },

  {
    id: 'future_visualization',
    text: "When you think about a future event, can you 'see' yourself there?",
    subtext: "Like imagining yourself at a party next week, or in a new job.",
    type: 'choice',
    options: [
      {
        value: 'vivid',
        label: "Yes, I can visualize future scenarios clearly",
        indicates: { prospectiveImagination: 'vivid' }
      },
      {
        value: 'conceptual',
        label: "I can think about it, but not visually 'see' it",
        description: "I understand the future conceptually",
        indicates: { prospectiveImagination: 'conceptual' }
      },
      {
        value: 'limited',
        label: "It's hard for me to imagine future scenarios",
        indicates: { prospectiveImagination: 'limited' }
      }
    ],
    measures: ['prospectiveImagination'],
    adaptiveDepth: 'standard'
  },

  // ========== OPTIONAL: IDENTITY EXPERIENCES ==========
  {
    id: 'identity_experiences',
    text: "Do you relate to any of these experiences?",
    subtext: "Select any that resonate (or none).",
    type: 'multiselect',
    options: [
      {
        value: 'struggled_school',
        label: "Struggling with school but thriving later",
        indicates: { traditionalLearningFit: 'struggled', discoveredStrengths: ['late bloomer'] }
      },
      {
        value: 'smart_cant_prove',
        label: "Feeling smart but unable to prove it",
        indicates: { traditionalLearningFit: 'struggled', discoveredStrengths: ['hidden intelligence'] }
      },
      {
        value: 'think_differently',
        label: "Thinking differently than people expect",
        indicates: { discoveredStrengths: ['unique perspective'] }
      },
      {
        value: 'out_of_sync',
        label: "Feeling out of sync with systems",
        indicates: { traditionalLearningFit: 'struggled' }
      },
      {
        value: 'labeled_too_much',
        label: 'Being labeled "too much" or "not enough"',
        indicates: { sensitivityLevel: 'highly_sensitive' }
      }
    ],
    measures: ['traditionalLearningFit', 'sensitivityLevel', 'discoveredStrengths'],
    adaptiveDepth: 'standard'
  },

  // ========== SOCIAL ORIENTATION ==========
  {
    id: 'social_energy',
    text: "After spending time with people, how do you usually feel?",
    type: 'choice',
    options: [
      {
        value: 'energized',
        label: "Energized - I love connecting",
        indicates: { socialOrientation: 'energized_by_people' }
      },
      {
        value: 'drained',
        label: "I need alone time to recharge",
        indicates: { socialOrientation: 'drained_by_people' }
      },
      {
        value: 'depends_people',
        label: "Depends on who I'm with",
        indicates: { socialOrientation: 'selective' }
      },
      {
        value: 'depends_context',
        label: "Depends on the situation",
        indicates: { socialOrientation: 'situational' }
      }
    ],
    measures: ['socialOrientation'],
    adaptiveDepth: 'basic'
  },

  {
    id: 'group_preference',
    text: "Where do you feel most yourself?",
    type: 'choice',
    options: [
      { value: 'one_on_one', label: "One-on-one conversations", indicates: { preferredGroupSize: 'one_on_one' } },
      { value: 'small_group', label: "Small groups of close people", indicates: { preferredGroupSize: 'small_group' } },
      { value: 'large_group', label: "Bigger gatherings and parties", indicates: { preferredGroupSize: 'large_group' } },
      { value: 'alone', label: "Honestly, when I'm alone", indicates: { preferredGroupSize: 'alone' } }
    ],
    measures: ['preferredGroupSize'],
    adaptiveDepth: 'standard'
  },

  // ========== EMOTIONAL PROCESSING ==========
  {
    id: 'emotion_first',
    text: "When something difficult happens, what comes first for you?",
    type: 'choice',
    options: [
      {
        value: 'feel_first',
        label: "The feelings hit me first, then I think about it",
        indicates: { emotionalProcessing: 'feeler_first' }
      },
      {
        value: 'think_first',
        label: "I analyze it first, feelings come later",
        indicates: { emotionalProcessing: 'thinker_first' }
      },
      {
        value: 'both',
        label: "Feelings and thoughts come together",
        indicates: { emotionalProcessing: 'integrated' }
      },
      {
        value: 'do_something',
        label: "I need to do something - action helps me process",
        indicates: { emotionalProcessing: 'action_oriented' }
      },
      {
        value: 'delayed',
        label: "I often don't feel it until much later",
        indicates: { emotionalProcessing: 'delayed' }
      }
    ],
    measures: ['emotionalProcessing'],
    adaptiveDepth: 'basic'
  },

  {
    id: 'sensitivity',
    text: "How would you describe your sensitivity?",
    subtext: "Sensitivity is a strength, not a weakness.",
    type: 'choice',
    options: [
      {
        value: 'highly',
        label: "I feel things deeply - environments, emotions, subtleties",
        indicates: { sensitivityLevel: 'highly_sensitive', emotionalIntelligence: 'high' }
      },
      {
        value: 'moderate',
        label: "I'm aware of feelings but don't get overwhelmed",
        indicates: { sensitivityLevel: 'moderate' }
      },
      {
        value: 'thick_skin',
        label: "I'm pretty thick-skinned - things roll off me",
        indicates: { sensitivityLevel: 'low_sensitivity' }
      }
    ],
    measures: ['sensitivityLevel', 'emotionalIntelligence'],
    adaptiveDepth: 'basic'
  },

  // ========== STRUCTURE PREFERENCE ==========
  {
    id: 'structure',
    text: "How do you feel about plans and structure?",
    type: 'choice',
    options: [
      {
        value: 'love_it',
        label: "I love having a plan - it calms me",
        indicates: { structurePreference: 'loves_structure', comfortWithAmbiguity: 'low' }
      },
      {
        value: 'need_flex',
        label: "I need flexibility - too much structure feels suffocating",
        indicates: { structurePreference: 'needs_flexibility', comfortWithAmbiguity: 'high' }
      },
      {
        value: 'start_structured',
        label: "I need structure to start, then I can improvise",
        indicates: { structurePreference: 'structured_start', comfortWithAmbiguity: 'moderate' }
      },
      {
        value: 'emerges',
        label: "Structure emerges as I go - I find my way",
        indicates: { structurePreference: 'emergent', comfortWithAmbiguity: 'high' }
      }
    ],
    measures: ['structurePreference', 'comfortWithAmbiguity'],
    adaptiveDepth: 'basic'
  },

  // ========== DEEP QUESTIONS ==========
  {
    id: 'systems_thinking_deep',
    text: "Do you often see how different parts of life connect to each other?",
    subtext: "Like noticing that sleep affects mood affects relationships affects work...",
    type: 'choice',
    options: [
      {
        value: 'constantly',
        label: "Yes, constantly - everything is connected",
        indicates: { primaryCognitiveMode: 'conceptual_systems', discoveredStrengths: ['systems thinking'] }
      },
      {
        value: 'sometimes',
        label: "Sometimes, when I step back",
        indicates: { secondaryCognitiveMode: 'conceptual_systems' }
      },
      {
        value: 'not_really',
        label: "I tend to focus on one thing at a time",
        indicates: { primaryCognitiveMode: 'procedural_sequential' }
      }
    ],
    measures: ['primaryCognitiveMode', 'secondaryCognitiveMode', 'discoveredStrengths'],
    adaptiveDepth: 'deep',
    requiresPrevious: ['learning_natural']
  },

  {
    id: 'future_thinking',
    text: "Do you often think about where things lead - consequences, timelines, long arcs?",
    type: 'choice',
    options: [
      {
        value: 'always',
        label: "Yes - I see too much sometimes",
        description: "The future is always present",
        indicates: { secondaryCognitiveMode: 'temporal_foresight', discoveredStrengths: ['foresight'] }
      },
      {
        value: 'sometimes',
        label: "When making big decisions",
        indicates: {}
      },
      {
        value: 'present_focused',
        label: "I'm more present-focused",
        indicates: { primaryCognitiveMode: 'embodied_somatic' }
      }
    ],
    measures: ['secondaryCognitiveMode', 'discoveredStrengths'],
    adaptiveDepth: 'deep'
  },

  {
    id: 'meta_thinking',
    text: "Do you think about thinking itself?",
    subtext: "Notice how your mind works, hold contradictions, question frameworks...",
    type: 'choice',
    options: [
      {
        value: 'often',
        label: "Often - I'm fascinated by how minds work",
        indicates: { secondaryCognitiveMode: 'integrative_meta', discoveredStrengths: ['meta-cognition'] }
      },
      {
        value: 'sometimes',
        label: "Sometimes, when something confuses me",
        indicates: {}
      },
      {
        value: 'rarely',
        label: "Not really - I just think",
        indicates: {}
      }
    ],
    measures: ['secondaryCognitiveMode', 'discoveredStrengths'],
    adaptiveDepth: 'deep'
  },

  // ========== COGNITIVE RHYTHMS (How clarity/energy fluctuate) ==========
  // Critical for understanding someone's experience over time
  // Many cyclical minds feel "broken" when they're just in a low phase

  {
    id: 'energy_consistency',
    text: "How consistent is your mental energy and clarity over days or weeks?",
    subtext: "Not talking about tiredness from lack of sleep - more about natural fluctuations in how your mind feels.",
    type: 'choice',
    options: [
      {
        value: 'very_steady',
        label: "Pretty consistent - I'm mostly the same",
        description: "Day to day, week to week, I feel relatively stable",
        indicates: { cognitiveRhythm: 'steady_state' }
      },
      {
        value: 'mild_waves',
        label: "Some waves, but manageable",
        description: "I notice ups and downs but nothing dramatic",
        indicates: { cognitiveRhythm: 'cyclical_mild' }
      },
      {
        value: 'significant_swings',
        label: "Clear highs and lows",
        description: "I have distinctly good periods and harder periods",
        indicates: { cognitiveRhythm: 'cyclical_pronounced' }
      },
      {
        value: 'burst_crash',
        label: "Intense bursts then crashes",
        description: "I have productive surges followed by needing to recover",
        indicates: { cognitiveRhythm: 'burst_recovery', discoveredStrengths: ['burst productivity'] }
      }
    ],
    measures: ['cognitiveRhythm', 'discoveredStrengths'],
    adaptiveDepth: 'basic'
  },

  {
    id: 'cyclical_high_phase',
    text: "What are you like in your 'up' or energized phases?",
    subtext: "If you experience waves of energy/clarity, what happens during the peaks?",
    type: 'choice',
    options: [
      {
        value: 'super_productive',
        label: "Highly productive - I can do so much",
        description: "Ideas flow, work gets done, everything clicks",
        indicates: { discoveredStrengths: ['high phase productivity'] }
      },
      {
        value: 'creative_insights',
        label: "Creative and insightful",
        description: "Best ideas come during these times",
        indicates: { discoveredStrengths: ['cyclical insights'] }
      },
      {
        value: 'social_engaged',
        label: "More social and engaged",
        description: "I reach out to people, make plans, feel connected",
        indicates: {}
      },
      {
        value: 'not_applicable',
        label: "I don't really have distinct 'up' phases",
        indicates: { cognitiveRhythm: 'steady_state' }
      }
    ],
    measures: ['discoveredStrengths'],
    adaptiveDepth: 'standard',
    requiresPrevious: ['energy_consistency']
  },

  {
    id: 'cyclical_low_phase',
    text: "During your harder or lower-energy periods, what do you most need?",
    subtext: "Low phases are not failure — they are integration and recovery.",
    type: 'multiselect',
    options: [
      {
        value: 'quiet_time',
        label: "Quiet time alone",
        description: "Space to recover without demands",
        indicates: {}
      },
      {
        value: 'simple_tasks',
        label: "Simple, manageable tasks only",
        description: "Nothing complex or demanding",
        indicates: {}
      },
      {
        value: 'understanding',
        label: "Understanding that this will pass",
        description: "Reminder that it's temporary",
        indicates: {}
      },
      {
        value: 'not_applicable',
        label: "I don't have significant low phases",
        indicates: { cognitiveRhythm: 'steady_state' }
      }
    ],
    measures: ['cognitiveRhythm'],
    adaptiveDepth: 'standard',
    requiresPrevious: ['energy_consistency']
  },

  {
    id: 'daily_energy_pattern',
    text: "When during the day is your mind sharpest?",
    type: 'choice',
    options: [
      {
        value: 'morning',
        label: "Morning - I'm a morning person",
        description: "Peak energy early, fades by evening",
        indicates: { dailyEnergyPattern: 'morning_person' }
      },
      {
        value: 'night',
        label: "Night - I'm a night owl",
        description: "Slow start, but I come alive late",
        indicates: { dailyEnergyPattern: 'night_owl' }
      },
      {
        value: 'afternoon',
        label: "Midday or afternoon",
        description: "I peak in the middle of the day",
        indicates: { dailyEnergyPattern: 'afternoon_peak' }
      },
      {
        value: 'consistent',
        label: "Fairly consistent throughout",
        description: "No strong pattern",
        indicates: { dailyEnergyPattern: 'consistent' }
      },
      {
        value: 'unpredictable',
        label: "Honestly, it's unpredictable",
        description: "My energy doesn't follow a daily pattern",
        indicates: { dailyEnergyPattern: 'unpredictable' }
      }
    ],
    measures: ['dailyEnergyPattern'],
    adaptiveDepth: 'standard'
  },

  {
    id: 'productivity_style',
    text: "How does your productivity typically work?",
    type: 'choice',
    options: [
      {
        value: 'steady',
        label: "Steady and consistent",
        description: "I produce similar amounts day to day",
        indicates: { productivityStyle: 'steady_consistent' }
      },
      {
        value: 'burst',
        label: "Intense focused bursts",
        description: "Deep work sprints, then rest",
        indicates: { productivityStyle: 'burst_focused', discoveredStrengths: ['deep work'] }
      },
      {
        value: 'slow_build',
        label: "Slow build-up",
        description: "I need warm-up time, then build momentum",
        indicates: { productivityStyle: 'slow_build' }
      },
      {
        value: 'deadline',
        label: "Deadline-driven",
        description: "I work best under pressure",
        indicates: { productivityStyle: 'deadline_driven' }
      },
      {
        value: 'energy_dependent',
        label: "Completely depends on my energy",
        description: "When I have it, I use it; when I don't, I can't force it",
        indicates: { productivityStyle: 'energy_dependent' }
      }
    ],
    measures: ['productivityStyle', 'discoveredStrengths'],
    adaptiveDepth: 'standard'
  },

  {
    id: 'cycle_triggers',
    text: "Do you know what tends to trigger your energy shifts?",
    subtext: "Understanding triggers helps predict and work with your rhythms.",
    type: 'multiselect',
    options: [
      {
        value: 'sleep',
        label: "Sleep quality",
        indicates: {}
      },
      {
        value: 'social',
        label: "Social interaction (draining or energizing)",
        indicates: {}
      },
      {
        value: 'seasons',
        label: "Seasons or weather",
        indicates: {}
      },
      {
        value: 'stress',
        label: "Stress levels",
        indicates: {}
      },
      {
        value: 'unknown',
        label: "I don't know - they seem random",
        indicates: {}
      }
    ],
    measures: [],
    adaptiveDepth: 'deep',
    requiresPrevious: ['energy_consistency']
  },

  // ========== SLEEP PATTERNS ==========
  {
    id: 'sleep_falling_asleep',
    text: "When you get into bed, how easily do you fall asleep?",
    subtext: "Sleep is foundational to everything else. Let's understand your patterns.",
    type: 'choice',
    options: [
      {
        value: 'easy',
        label: "Pretty easily - I'm usually out within 10 minutes",
        indicates: { sleepOnset: 'falls_asleep_easily' }
      },
      {
        value: 'takes_time',
        label: "It takes a while - maybe 15-30 minutes",
        indicates: { sleepOnset: 'takes_a_while' }
      },
      {
        value: 'struggle',
        label: "I often struggle - my mind won't quiet down",
        indicates: { sleepOnset: 'often_struggles' }
      },
      {
        value: 'variable',
        label: "It really depends on the day",
        indicates: { sleepOnset: 'highly_variable' }
      }
    ],
    measures: ['sleepOnset'],
    adaptiveDepth: 'standard'
  },

  {
    id: 'sleep_staying_asleep',
    text: "Once you're asleep, how's your night?",
    type: 'choice',
    options: [
      {
        value: 'solid',
        label: "I usually sleep through the night",
        indicates: { sleepMaintenance: 'sleeps_through' }
      },
      {
        value: 'wake_return',
        label: "I wake up sometimes but fall back asleep easily",
        indicates: { sleepMaintenance: 'wakes_but_returns' }
      },
      {
        value: 'wake_struggle',
        label: "I wake up and then my mind starts racing",
        indicates: { sleepMaintenance: 'wakes_and_struggles' }
      },
      {
        value: 'early',
        label: "I wake up too early and can't get back to sleep",
        indicates: { sleepMaintenance: 'wakes_too_early' }
      },
      {
        value: 'fragmented',
        label: "My sleep is fragmented - I never feel like I get deep rest",
        indicates: { sleepMaintenance: 'fragmented' }
      }
    ],
    measures: ['sleepMaintenance'],
    adaptiveDepth: 'standard'
  },

  {
    id: 'sleep_blocker',
    text: "When you can't sleep, what's usually going on?",
    subtext: "This helps me suggest the right techniques for you.",
    type: 'choice',
    options: [
      {
        value: 'racing_thoughts',
        label: "Racing thoughts - my mind won't stop",
        description: "Thoughts jumping from one thing to another",
        indicates: { primarySleepBlocker: 'racing_thoughts' }
      },
      {
        value: 'worry',
        label: "Worry or anxiety about tomorrow",
        description: "Thinking about what I need to do or what might go wrong",
        indicates: { primarySleepBlocker: 'worry_anxiety' }
      },
      {
        value: 'replay',
        label: "Replaying the day",
        description: "Going over conversations or events that already happened",
        indicates: { primarySleepBlocker: 'replaying_day' }
      },
      {
        value: 'body',
        label: "Physical restlessness",
        description: "Body tension, can't get comfortable",
        indicates: { primarySleepBlocker: 'body_tension' }
      },
      {
        value: 'creative',
        label: "Creative surge",
        description: "Ideas and inspiration flood in at bedtime",
        indicates: { primarySleepBlocker: 'creative_surge' }
      },
      {
        value: 'environment',
        label: "Environment issues",
        description: "Noise, light, temperature, partner",
        indicates: { primarySleepBlocker: 'environment' }
      },
      {
        value: 'none',
        label: "Sleep isn't usually a problem for me",
        indicates: { primarySleepBlocker: 'none_identified' }
      }
    ],
    measures: ['primarySleepBlocker'],
    adaptiveDepth: 'standard',
    requiresPrevious: ['sleep_falling_asleep']
  },

  {
    id: 'sleep_quality',
    text: "How do you usually feel when you wake up?",
    type: 'choice',
    options: [
      {
        value: 'refreshed',
        label: "Usually refreshed and ready to go",
        indicates: { sleepQuality: 'refreshed' }
      },
      {
        value: 'functional',
        label: "Good enough to function",
        indicates: { sleepQuality: 'functional' }
      },
      {
        value: 'tired_okay',
        label: "Often tired but I manage",
        indicates: { sleepQuality: 'tired_but_okay' }
      },
      {
        value: 'chronically_tired',
        label: "Rarely feel rested, even after a full night",
        indicates: { sleepQuality: 'chronically_tired' }
      },
      {
        value: 'variable',
        label: "It's really unpredictable",
        indicates: { sleepQuality: 'variable' }
      }
    ],
    measures: ['sleepQuality'],
    adaptiveDepth: 'standard'
  },

  {
    id: 'sleep_screens',
    text: "Do you typically use screens (phone, TV, computer) in the hour before bed?",
    type: 'choice',
    options: [
      {
        value: 'yes_phone',
        label: "Yes, usually my phone",
        indicates: { usesScreensBeforeBed: true }
      },
      {
        value: 'yes_tv',
        label: "Yes, usually TV or streaming",
        indicates: { usesScreensBeforeBed: true }
      },
      {
        value: 'yes_both',
        label: "Yes, multiple screens",
        indicates: { usesScreensBeforeBed: true }
      },
      {
        value: 'sometimes',
        label: "Sometimes, not always",
        indicates: { usesScreensBeforeBed: true }
      },
      {
        value: 'no',
        label: "No, I avoid screens before bed",
        indicates: { usesScreensBeforeBed: false }
      }
    ],
    measures: ['usesScreensBeforeBed'],
    adaptiveDepth: 'deep'
  },

  {
    id: 'sleep_techniques',
    text: "Have you tried any sleep techniques or routines?",
    subtext: "No judgment either way - just helps me know where to start.",
    type: 'choice',
    options: [
      {
        value: 'yes_work',
        label: "Yes, and some have worked",
        indicates: { hasTriedSleepTechniques: true }
      },
      {
        value: 'yes_not_work',
        label: "Yes, but nothing really sticks",
        indicates: { hasTriedSleepTechniques: true }
      },
      {
        value: 'a_few',
        label: "A few things here and there",
        indicates: { hasTriedSleepTechniques: true }
      },
      {
        value: 'no',
        label: "Not really - open to suggestions",
        indicates: { hasTriedSleepTechniques: false }
      },
      {
        value: 'no_need',
        label: "No need - sleep isn't an issue for me",
        indicates: { hasTriedSleepTechniques: false }
      }
    ],
    measures: ['hasTriedSleepTechniques'],
    adaptiveDepth: 'deep',
    requiresPrevious: ['sleep_blocker']
  }
];

// ============================================
// DEFAULT PROFILE
// ============================================

const DEFAULT_PROFILE: CognitiveProfile = {
  // New cognitive mode system
  primaryCognitiveMode: 'narrative_meaning',
  secondaryCognitiveMode: null,
  // Legacy processing (backward compatible)
  primaryProcessing: 'stories',
  secondaryProcessing: null,
  // Neurological differences (default to typical, detect via onboarding)
  mentalImagery: 'typical',
  internalMonologue: 'frequent',
  auditoryImagination: 'moderate',
  prospectiveImagination: 'vivid',
  // Learning
  learningStyles: ['visual', 'auditory'],
  bestLearningContext: '',
  socialOrientation: 'selective',
  socialComfortLevel: 5,
  preferredGroupSize: 'small_group',
  emotionalProcessing: 'integrated',
  sensitivityLevel: 'moderate',
  emotionalIntelligence: 'moderate',
  communicationStyle: 'collaborative',
  prefersWrittenOrSpoken: 'either',
  needsTimeToRespond: false,
  structurePreference: 'structured_start',
  comfortWithAmbiguity: 'moderate',
  selfAwarenessLevel: 'moderate',
  discoveredStrengths: [],
  traditionalLearningFit: 'mixed',
  // Cognitive rhythms (default to steady, detect via onboarding)
  cognitiveRhythm: 'steady_state',
  cyclicalPattern: null,
  dailyEnergyPattern: 'consistent',
  productivityStyle: 'steady_consistent',
  // Sleep (default to functional, detect via onboarding)
  sleepOnset: 'takes_a_while',
  sleepMaintenance: 'wakes_but_returns',
  primarySleepBlocker: null,
  sleepQuality: 'functional',
  idealSleepHours: null,
  usesScreensBeforeBed: true,
  hasTriedSleepTechniques: false,
  completedOnboarding: false,
  onboardingDepth: 'standard',
  lastUpdated: new Date().toISOString(),
  confidenceLevel: 0
};

// ============================================
// STORAGE
// ============================================

const STORAGE_KEYS = {
  PROFILE: 'moodleaf_cognitive_profile',
  ONBOARDING_PROGRESS: 'moodleaf_onboarding_progress',
  ONBOARDING_ANSWERS: 'moodleaf_onboarding_answers',
};

/**
 * Get current cognitive profile
 */
export async function getCognitiveProfile(): Promise<CognitiveProfile> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
    return stored ? { ...DEFAULT_PROFILE, ...JSON.parse(stored) } : DEFAULT_PROFILE;
  } catch (error) {
    console.error('[CognitiveProfile] Failed to get profile:', error);
    return DEFAULT_PROFILE;
  }
}

/**
 * Save cognitive profile
 */
export async function saveCognitiveProfile(profile: Partial<CognitiveProfile>): Promise<void> {
  try {
    const current = await getCognitiveProfile();
    const updated = {
      ...current,
      ...profile,
      lastUpdated: new Date().toISOString()
    };
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
  } catch (error) {
    console.error('[CognitiveProfile] Failed to save profile:', error);
  }
}

// ============================================
// ONBOARDING FLOW
// ============================================

export interface OnboardingProgress {
  currentQuestionIndex: number;
  answeredQuestions: string[];
  adaptiveDepth: 'basic' | 'standard' | 'deep';
  estimatedSelfAwareness: 'high' | 'moderate' | 'developing';
}

/**
 * Get onboarding progress
 */
export async function getOnboardingProgress(): Promise<OnboardingProgress> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
    return stored ? JSON.parse(stored) : {
      currentQuestionIndex: 0,
      answeredQuestions: [],
      adaptiveDepth: 'basic',
      estimatedSelfAwareness: 'moderate'
    };
  } catch (error) {
    return {
      currentQuestionIndex: 0,
      answeredQuestions: [],
      adaptiveDepth: 'basic',
      estimatedSelfAwareness: 'moderate'
    };
  }
}

/**
 * Save onboarding progress
 */
export async function saveOnboardingProgress(progress: OnboardingProgress): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_PROGRESS, JSON.stringify(progress));
}

/**
 * Get next question based on progress and answers
 * This is where adaptation happens
 */
export async function getNextOnboardingQuestion(): Promise<OnboardingQuestion | null> {
  const progress = await getOnboardingProgress();
  const profile = await getCognitiveProfile();

  // Filter questions by adaptive depth and requirements
  const availableQuestions = ONBOARDING_QUESTIONS.filter(q => {
    // Already answered?
    if (progress.answeredQuestions.includes(q.id)) return false;

    // Meets depth requirement?
    const depthOrder = { basic: 0, standard: 1, deep: 2 };
    if (depthOrder[q.adaptiveDepth] > depthOrder[progress.adaptiveDepth]) return false;

    // Has required previous answers?
    if (q.requiresPrevious) {
      const hasRequired = q.requiresPrevious.every(id =>
        progress.answeredQuestions.includes(id)
      );
      if (!hasRequired) return false;
    }

    return true;
  });

  if (availableQuestions.length === 0) return null;

  // Prioritize basic questions first, then standard, then deep
  const sorted = availableQuestions.sort((a, b) => {
    const depthOrder = { basic: 0, standard: 1, deep: 2 };
    return depthOrder[a.adaptiveDepth] - depthOrder[b.adaptiveDepth];
  });

  return sorted[0];
}

/**
 * Get onboarding progress info for UI display
 * Returns answered count, available count at current depth, and progress percentage
 */
export async function getOnboardingProgressInfo(): Promise<{
  answeredCount: number;
  remainingCount: number;
  totalAtCurrentDepth: number;
  progressPercent: number;
}> {
  const progress = await getOnboardingProgress();

  // Count questions available at current depth
  const depthOrder = { basic: 0, standard: 1, deep: 2 };
  const questionsAtCurrentDepth = ONBOARDING_QUESTIONS.filter(q => {
    // Include if depth is at or below current level
    return depthOrder[q.adaptiveDepth] <= depthOrder[progress.adaptiveDepth];
  });

  // Count remaining questions that can be answered (meets requirements)
  const remainingQuestions = questionsAtCurrentDepth.filter(q => {
    if (progress.answeredQuestions.includes(q.id)) return false;
    if (q.requiresPrevious) {
      const hasRequired = q.requiresPrevious.every(id =>
        progress.answeredQuestions.includes(id)
      );
      if (!hasRequired) return false;
    }
    return true;
  });

  const answeredCount = progress.answeredQuestions.length;
  const totalAtCurrentDepth = questionsAtCurrentDepth.length;
  const remainingCount = remainingQuestions.length;

  // Calculate progress as percentage of answered vs total at current depth
  // Use a minimum total to avoid division issues
  const effectiveTotal = Math.max(totalAtCurrentDepth, answeredCount + remainingCount);
  const progressPercent = effectiveTotal > 0 ? (answeredCount / effectiveTotal) * 100 : 0;

  return {
    answeredCount,
    remainingCount,
    totalAtCurrentDepth,
    progressPercent: Math.min(progressPercent, 100), // Cap at 100
  };
}

/**
 * Record an answer and update profile
 */
export async function recordOnboardingAnswer(
  questionId: string,
  answer: any
): Promise<void> {
  const progress = await getOnboardingProgress();
  const profile = await getCognitiveProfile();

  // Find the question
  const question = ONBOARDING_QUESTIONS.find(q => q.id === questionId);
  if (!question) return;

  // Mark as answered
  progress.answeredQuestions.push(questionId);

  // Apply profile updates based on answer
  if (question.type === 'choice' || question.type === 'multiselect') {
    const answers = Array.isArray(answer) ? answer : [answer];

    for (const ans of answers) {
      const option = question.options?.find(o => o.value === ans);
      if (option?.indicates) {
        // Merge indicated profile values
        for (const [key, value] of Object.entries(option.indicates)) {
          if (key === 'discoveredStrengths' && Array.isArray(value)) {
            // Append to strengths
            profile.discoveredStrengths = [
              ...new Set([...profile.discoveredStrengths, ...value])
            ];
          } else if (key === 'learningStyles' && Array.isArray(value)) {
            // Append to learning styles
            profile.learningStyles = [
              ...new Set([...profile.learningStyles, ...value])
            ];
          } else {
            (profile as any)[key] = value;
          }
        }
      }
    }
  } else if (question.type === 'scale') {
    // Handle scale answers
    if (questionId === 'social_comfort') {
      profile.socialComfortLevel = answer;
    }
  }

  // Adapt depth based on self-awareness signals
  if (questionId === 'welcome_comfort') {
    if (answer === 'excited') {
      progress.adaptiveDepth = 'deep';
      progress.estimatedSelfAwareness = 'high';
    } else if (answer === 'unsure') {
      progress.adaptiveDepth = 'basic';
      progress.estimatedSelfAwareness = 'developing';
    }
  }

  // Update confidence based on answers
  profile.confidenceLevel = Math.min(100, profile.confidenceLevel + 8);

  // Save both
  await saveOnboardingProgress(progress);
  await saveCognitiveProfile(profile);

  // Store raw answer for potential re-analysis
  const answers = await getOnboardingAnswers();
  answers[questionId] = { answer, timestamp: new Date().toISOString() };
  await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_ANSWERS, JSON.stringify(answers));
}

/**
 * Get all onboarding answers
 */
async function getOnboardingAnswers(): Promise<Record<string, any>> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_ANSWERS);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Complete onboarding
 */
export async function completeOnboarding(): Promise<void> {
  const profile = await getCognitiveProfile();
  const progress = await getOnboardingProgress();

  profile.completedOnboarding = true;
  profile.onboardingDepth = progress.adaptiveDepth;

  await saveCognitiveProfile(profile);
}

// ============================================
// PROFILE REVEAL (Coach explains user to themselves)
// ============================================

/**
 * Generate the profile reveal - how the coach explains the user to themselves
 * This is the "aha" moment
 */
export async function generateProfileReveal(): Promise<string> {
  const profile = await getCognitiveProfile();

  const parts: string[] = [];

  // Opening based on self-awareness
  if (profile.selfAwarenessLevel === 'high') {
    parts.push("Based on what you've shared, I'm seeing some patterns that might resonate with you.");
  } else if (profile.selfAwarenessLevel === 'developing') {
    parts.push("I've noticed some things about how your mind works that might be helpful to know.");
  } else {
    parts.push("Here's what I'm picking up about how you process the world.");
  }

  parts.push('');

  // Cognitive Mode (primary)
  const cognitiveModeDescriptions: Record<CognitiveMode, string> = {
    procedural_sequential: "You're a **Procedural-Sequential Thinker**. You think linearly, you're strong with rules and processes, and you like clear steps. This makes you thorough, reliable, and great at following through.",
    analytical_symbolic: "You're an **Analytical-Symbolic Thinker**. You're comfortable with logic, abstraction, and formal systems. You enjoy precision and clear reasoning chains.",
    conceptual_systems: "You're a **Conceptual Systems Thinker**. You think in wholes, not parts. You see connections others miss and understand things by grasping how they fit into bigger patterns. You don't think from rules to meaning - you think from meaning to rules. This is a real strength, even if traditional education didn't always reward it.",
    narrative_meaning: "You're a **Narrative-Meaning Thinker**. You understand life through stories. Meaning, identity, and emotional context are how you make sense of things. This gives you strong empathy and makes you relatable.",
    embodied_somatic: "You're an **Embodied/Somatic Thinker**. You know things in your body before your mind catches up. You learn by doing, not explaining. This hands-on intelligence is often undervalued, but it's how you truly understand.",
    associative_divergent: "You're an **Associative-Divergent Thinker**. Your mind makes rapid connections, jumping from idea to idea. This nonlinear thinking might feel scattered sometimes, but it's actually creative power.",
    emotional_relational: "You're an **Emotional-Relational Thinker**. You're highly attuned to people - you read tone, mood, and subtext naturally. Your emotional intelligence is genuine intelligence, even if systems don't always recognize it.",
    visual_spatial: "You're a **Visual-Spatial Thinker**. You think in images and spatial models. Diagrams and visual metaphors help you understand. This is architect-brain, designer-brain.",
    temporal_foresight: "You're a **Temporal/Foresight Thinker**. You think in timelines - you see long arcs and consequences. This can sometimes make you anxious (because you see too much), but it's rare and extremely valuable.",
    integrative_meta: "You're an **Integrative/Meta Thinker**. You think about thinking. You're comfortable with ambiguity and can hold contradictions. This philosophical mind might feel isolating, but it's a gift."
  };

  parts.push(`**How you think:** ${cognitiveModeDescriptions[profile.primaryCognitiveMode]}`);

  if (profile.secondaryCognitiveMode && profile.secondaryCognitiveMode !== profile.primaryCognitiveMode) {
    const secondaryLabels: Record<CognitiveMode, string> = {
      procedural_sequential: 'step-by-step thinking',
      analytical_symbolic: 'analytical precision',
      conceptual_systems: 'systems thinking',
      narrative_meaning: 'story-based understanding',
      embodied_somatic: 'body-based knowing',
      associative_divergent: 'creative connections',
      emotional_relational: 'emotional attunement',
      visual_spatial: 'visual thinking',
      temporal_foresight: 'future-oriented thinking',
      integrative_meta: 'meta-cognition'
    };
    parts.push(`You also draw on ${secondaryLabels[profile.secondaryCognitiveMode]} when needed.`);
  }

  parts.push('');

  // Emotional processing
  const emotionalDescriptions: Record<EmotionalProcessing, string> = {
    feeler_first: "Emotions come first for you - they're not separate from your thinking, they're part of how you understand things.",
    thinker_first: "You tend to analyze first and feel later. This isn't cold - it's just how your mind processes.",
    integrated: "Your feelings and thoughts work together. You don't separate logic from emotion.",
    action_oriented: "You process emotions through action. Sitting with feelings is hard - doing something helps.",
    delayed: "Your emotions often surface later, not in the moment. This can be confusing, but it's just your processing style."
  };

  parts.push(`**How you feel:** ${emotionalDescriptions[profile.emotionalProcessing]}`);

  // Sensitivity
  if (profile.sensitivityLevel === 'highly_sensitive') {
    parts.push("You're highly sensitive - you pick up on subtleties others miss. This is a gift, even when it feels overwhelming.");
  }

  // Emotional intelligence
  if (profile.emotionalIntelligence === 'high') {
    parts.push("Your emotional intelligence is strong. You read people well and understand what's beneath the surface.");
  }

  parts.push('');

  // Social
  const socialDescriptions: Record<SocialOrientation, string> = {
    energized_by_people: "People energize you. Connection isn't draining - it's fuel.",
    drained_by_people: "Social time costs energy for you. This isn't antisocial - you just need to recharge alone.",
    selective: "You're selective about connection. A few deep relationships mean more than many shallow ones.",
    situational: "Your social energy depends on context. Some situations feed you, others drain you."
  };

  parts.push(`**How you relate:** ${socialDescriptions[profile.socialOrientation]}`);

  parts.push('');

  // Communication & what the coach will do
  parts.push("**How I'll adapt to you:**");

  const adaptations: string[] = [];

  // Based on cognitive mode
  if (profile.primaryCognitiveMode === 'conceptual_systems') {
    adaptations.push('Start with framing, not steps');
    adaptations.push('Use metaphors');
    adaptations.push('Allow partial articulation');
  } else if (profile.primaryCognitiveMode === 'procedural_sequential') {
    adaptations.push('Give clear steps');
    adaptations.push('Provide predictable structure');
    adaptations.push('Minimize abstraction');
  } else if (profile.primaryCognitiveMode === 'narrative_meaning') {
    adaptations.push('Use story-based reflection');
    adaptations.push('Include emotional context');
    adaptations.push('Connect to identity and meaning');
  } else if (profile.primaryCognitiveMode === 'embodied_somatic') {
    adaptations.push('Use grounded prompts');
    adaptations.push('Include sensory language');
    adaptations.push('Suggest body-based awareness');
  } else if (profile.primaryCognitiveMode === 'associative_divergent') {
    adaptations.push('Allow wandering, then help you return');
    adaptations.push('Help cluster your ideas');
    adaptations.push('Provide gentle focus');
  } else if (profile.primaryCognitiveMode === 'emotional_relational') {
    adaptations.push('Validate your feelings first');
    adaptations.push('Mirror your emotional state');
    adaptations.push('Guide gently, not correct');
  } else if (profile.primaryCognitiveMode === 'visual_spatial') {
    adaptations.push('Use spatial metaphors');
    adaptations.push('Describe diagrams in words');
    adaptations.push('Chunk information visually');
  } else if (profile.primaryCognitiveMode === 'temporal_foresight') {
    adaptations.push('Explore future scenarios');
    adaptations.push('Ground you in the present when needed');
    adaptations.push('Honor your long-term perspective');
  } else if (profile.primaryCognitiveMode === 'integrative_meta') {
    adaptations.push('Allow meta-reflection');
    adaptations.push('Offer philosophical framing');
    adaptations.push('Not force resolution');
  }

  // Based on emotional processing
  if (profile.emotionalProcessing === 'feeler_first') {
    adaptations.push('Always validate emotions before suggesting solutions');
  }

  // Based on communication style
  if (profile.needsTimeToRespond) {
    adaptations.push("Give you space to think - no rushed responses");
  }

  parts.push(adaptations.map(a => `- ${a}`).join('\n'));

  // Strengths
  if (profile.discoveredStrengths.length > 0) {
    parts.push('');
    parts.push(`**Your strengths:** ${profile.discoveredStrengths.join(', ')}`);
  }

  // === NEUROLOGICAL DIFFERENCES ===
  // This validates their experience and sets expectations

  const hasNeurologicalDifferences =
    profile.mentalImagery === 'aphantasia' ||
    profile.mentalImagery === 'hypophantasia' ||
    profile.internalMonologue === 'none' ||
    profile.internalMonologue === 'rare' ||
    profile.auditoryImagination === 'none';

  if (hasNeurologicalDifferences) {
    parts.push('');
    parts.push("**About your mind's unique wiring:**");

    if (profile.mentalImagery === 'aphantasia') {
      parts.push("You have aphantasia - your mind's eye doesn't create visual images. This isn't a deficiency; it's a different way of thinking. You likely excel at conceptual and abstract thinking. I will NEVER ask you to 'visualize' or 'picture' anything - that simply doesn't work for you, and that's completely fine.");
    } else if (profile.mentalImagery === 'hypophantasia') {
      parts.push("Your mental imagery is on the subtler side. Visualization exercises might feel forced or frustrating. I'll use more sensory or conceptual approaches instead.");
    }

    if (profile.internalMonologue === 'none') {
      parts.push("You think without an internal voice - your thoughts aren't in words. This is more common than people realize. I won't ask 'what is your inner voice saying' because that's not how your mind works. Instead, we'll explore your thoughts through feelings, concepts, or body sensations.");
    } else if (profile.internalMonologue === 'rare') {
      parts.push("Your internal monologue is quieter than most. I'll focus more on feelings and sensations than verbal self-talk.");
    }

    if (profile.auditoryImagination === 'none') {
      parts.push("You can't imagine sounds in your head - no 'hearing' music mentally. Audio-based techniques aren't for you.");
    }
  }

  // Hyperphantasia note (opposite of aphantasia)
  if (profile.mentalImagery === 'hyperphantasia') {
    parts.push('');
    parts.push("**About your vivid inner world:** You have hyperphantasia - extremely vivid mental imagery. This is a gift for creativity and memory, though it might sometimes feel overwhelming. Visual metaphors and imagery-based reflection will work really well for you.");
  }

  // === COGNITIVE RHYTHMS ===
  // How clarity and energy fluctuate over time
  if (profile.cognitiveRhythm !== 'steady_state') {
    parts.push('');
    parts.push('**About your rhythm:**');

    if (profile.cognitiveRhythm === 'cyclical_mild') {
      parts.push("You experience some waves in your energy and clarity - not dramatic, but real. This is completely normal. I'll adapt to wherever you are in your cycle.");
    } else if (profile.cognitiveRhythm === 'cyclical_pronounced') {
      parts.push("You have clear high and low phases. This is important to understand: **low phases are not failure — they are integration and recovery.** Your brain is processing, consolidating, resting. During high phases, you shine. During low phases, you're rebuilding. Both are necessary.");
      parts.push('');
      parts.push("I'll check in on where you are in your cycle and adjust my approach. During low phases, I'll be gentler, suggest simpler tasks, and remind you this will pass. During high phases, I'll help you make the most of your clarity.");
    } else if (profile.cognitiveRhythm === 'burst_recovery') {
      parts.push("You work in intense productive bursts followed by crashes. This isn't a flaw - it's how your mind operates. The key is working *with* this pattern, not fighting it. I'll help you capitalize on bursts when they come and honor your recovery needs when they're done.");
    }
  }

  // Daily energy pattern (for steady-state folks too)
  if (profile.dailyEnergyPattern !== 'consistent') {
    if (profile.cognitiveRhythm === 'steady_state') {
      parts.push('');
    }
    const dailyPatterns: Record<DailyEnergyPattern, string> = {
      morning_person: "You're sharpest in the morning - that's when to tackle your hardest thinking.",
      night_owl: "You come alive at night - your best thinking happens late.",
      afternoon_peak: "Midday is your peak - morning is warm-up, evening is wind-down.",
      consistent: "",
      unpredictable: "Your energy doesn't follow a daily pattern - and that's okay. We'll work with wherever you are."
    };
    if (dailyPatterns[profile.dailyEnergyPattern]) {
      parts.push(dailyPatterns[profile.dailyEnergyPattern]);
    }
  }

  // Productivity style insight
  const productivityInsights: Record<ProductivityStyle, string> = {
    steady_consistent: "",  // Default, no special mention needed
    burst_focused: "You work in deep, focused bursts. I'll respect that - when you're in flow, I won't interrupt with check-ins.",
    slow_build: "You need warm-up time before hitting your stride. I won't expect you to dive straight into the deep end.",
    deadline_driven: "Pressure helps you perform. That's not procrastination - it's how your mind works best.",
    energy_dependent: "Your output depends entirely on your energy. When you have it, you use it. When you don't, forcing it doesn't help. I'll meet you where you are."
  };

  if (productivityInsights[profile.productivityStyle]) {
    if (profile.cognitiveRhythm === 'steady_state' && profile.dailyEnergyPattern === 'consistent') {
      parts.push('');
    }
    parts.push(productivityInsights[profile.productivityStyle]);
  }

  // Traditional learning note
  if (profile.traditionalLearningFit === 'struggled') {
    parts.push('');
    parts.push("One more thing: If traditional school didn't work for you, that says nothing about your intelligence. The system rewards one type of mind. Your mind works differently - and that's actually valuable.");
  }

  // Closing
  parts.push('');
  parts.push("This is just a starting point. I'll learn more about you as we talk. And if something doesn't feel right, just tell me - I can adapt.");

  return parts.join('\n');
}

// ============================================
// COACH ADAPTATION RULES
// ============================================

export interface CoachAdaptations {
  // Response style
  useMetaphors: boolean;
  useExamples: boolean;
  useStepByStep: boolean;
  showBigPicture: boolean;

  // Pacing
  allowSilence: boolean;
  quickResponses: boolean;
  giveTimeToThink: boolean;

  // Questions
  questionFrequency: 'low' | 'medium' | 'high';
  questionType: 'open' | 'specific' | 'reflective';

  // Emotional
  validateFirst: boolean;
  mirrorEmotions: boolean;
  actionOriented: boolean;

  // Structure
  provideStructure: boolean;
  allowWandering: boolean;

  // Length
  preferBrief: boolean;

  // === NEUROLOGICAL ADAPTATIONS (Critical) ===
  // These MUST be respected - using wrong techniques is harmful

  // Visualization
  canUseVisualization: boolean;       // false = NEVER say "picture this" or "visualize"
  visualizationAlternative: 'conceptual' | 'sensory' | 'verbal' | 'none';

  // Internal dialogue techniques
  canUseInnerVoice: boolean;          // false = don't ask "what is your inner voice saying"
  innerVoiceAlternative: 'feelings' | 'body' | 'concepts' | 'none';

  // Audio-based techniques
  canUseAudioImagination: boolean;    // false = don't say "imagine hearing"

  // Future visualization
  canUseFutureVisualization: boolean; // false = don't say "picture yourself in 5 years"

  // === COGNITIVE RHYTHM ADAPTATIONS ===
  // How to adapt based on their energy/clarity patterns

  // Rhythm type
  isCyclical: boolean;                // true = has distinct high/low phases
  rhythmType: CognitiveRhythm;

  // Low phase handling
  needsLowPhaseSupport: boolean;      // true = may need gentler approach during low phases
  lowPhaseApproach: 'gentler' | 'maintain_routine' | 'action_oriented' | 'standard';

  // Productivity adaptations
  productivityStyle: ProductivityStyle;
  respectBurstPatterns: boolean;      // true = don't interrupt flow states
  needsWarmUpTime: boolean;           // true = don't expect immediate deep work
  worksWithDeadlines: boolean;        // true = can use time pressure positively

  // Daily timing
  peakEnergyTime: DailyEnergyPattern;
  suggestTimingForHardTasks: boolean; // true = mention optimal timing for difficult work
}

/**
 * Generate coach adaptations based on profile
 * This uses the new cognitive modes system
 */
export async function getCoachAdaptations(): Promise<CoachAdaptations> {
  const profile = await getCognitiveProfile();
  const mode = profile.primaryCognitiveMode;

  return {
    // Response style based on cognitive mode
    useMetaphors:
      profile.communicationStyle === 'metaphorical' ||
      mode === 'conceptual_systems' ||
      mode === 'visual_spatial' ||
      mode === 'narrative_meaning',

    useExamples:
      mode === 'narrative_meaning' ||
      mode === 'embodied_somatic' ||
      profile.primaryProcessing === 'stories',

    useStepByStep:
      mode === 'procedural_sequential' ||
      mode === 'analytical_symbolic',

    showBigPicture:
      mode === 'conceptual_systems' ||
      mode === 'temporal_foresight' ||
      mode === 'integrative_meta',

    // Pacing based on communication + social
    allowSilence:
      profile.socialOrientation === 'drained_by_people' ||
      profile.needsTimeToRespond,

    quickResponses:
      profile.socialOrientation === 'energized_by_people' &&
      profile.communicationStyle === 'direct',

    giveTimeToThink:
      profile.needsTimeToRespond ||
      profile.communicationStyle === 'reflective' ||
      mode === 'integrative_meta',

    // Questions based on cognitive mode + emotional processing
    questionFrequency:
      profile.emotionalProcessing === 'feeler_first' ? 'low' :
      mode === 'associative_divergent' ? 'low' : // Don't overwhelm with questions
      'medium',

    questionType:
      profile.communicationStyle === 'reflective' ? 'reflective' :
      mode === 'procedural_sequential' ? 'specific' :
      mode === 'emotional_relational' ? 'reflective' :
      'open',

    // Emotional based on mode + sensitivity
    validateFirst:
      profile.sensitivityLevel === 'highly_sensitive' ||
      profile.emotionalProcessing === 'feeler_first' ||
      mode === 'emotional_relational' ||
      mode === 'narrative_meaning',

    mirrorEmotions:
      profile.emotionalIntelligence === 'high' ||
      mode === 'emotional_relational',

    actionOriented:
      profile.emotionalProcessing === 'action_oriented' ||
      mode === 'embodied_somatic',

    // Structure based on mode + preference
    provideStructure:
      profile.structurePreference === 'loves_structure' ||
      profile.structurePreference === 'structured_start' ||
      mode === 'procedural_sequential',

    allowWandering:
      profile.structurePreference === 'needs_flexibility' ||
      profile.structurePreference === 'emergent' ||
      mode === 'associative_divergent' ||
      mode === 'conceptual_systems',

    // Length based on communication
    preferBrief:
      profile.communicationStyle === 'direct' ||
      profile.prefersWrittenOrSpoken === 'spoken',

    // === NEUROLOGICAL ADAPTATIONS ===
    // These are critical - using wrong techniques can be harmful/frustrating

    // Visualization ability
    canUseVisualization:
      profile.mentalImagery === 'typical' ||
      profile.mentalImagery === 'hyperphantasia',

    visualizationAlternative:
      profile.mentalImagery === 'aphantasia' ? 'conceptual' :
      profile.mentalImagery === 'hypophantasia' ? 'sensory' : 'none',

    // Internal monologue
    canUseInnerVoice:
      profile.internalMonologue === 'constant' ||
      profile.internalMonologue === 'frequent',

    innerVoiceAlternative:
      profile.internalMonologue === 'none' ? 'feelings' :
      profile.internalMonologue === 'rare' ? 'body' : 'none',

    // Audio imagination
    canUseAudioImagination:
      profile.auditoryImagination === 'vivid' ||
      profile.auditoryImagination === 'moderate',

    // Future visualization
    canUseFutureVisualization:
      profile.prospectiveImagination === 'vivid' &&
      (profile.mentalImagery === 'typical' || profile.mentalImagery === 'hyperphantasia'),

    // === COGNITIVE RHYTHM ADAPTATIONS ===

    // Rhythm type
    isCyclical:
      profile.cognitiveRhythm === 'cyclical_mild' ||
      profile.cognitiveRhythm === 'cyclical_pronounced' ||
      profile.cognitiveRhythm === 'burst_recovery',

    rhythmType: profile.cognitiveRhythm,

    // Low phase handling
    needsLowPhaseSupport:
      profile.cognitiveRhythm === 'cyclical_pronounced' ||
      profile.cognitiveRhythm === 'burst_recovery',

    lowPhaseApproach:
      profile.cognitiveRhythm === 'cyclical_pronounced' ? 'gentler' :
      profile.cognitiveRhythm === 'burst_recovery' ? 'gentler' :
      profile.emotionalProcessing === 'action_oriented' ? 'action_oriented' :
      profile.structurePreference === 'loves_structure' ? 'maintain_routine' :
      'standard',

    // Productivity adaptations
    productivityStyle: profile.productivityStyle,

    respectBurstPatterns:
      profile.productivityStyle === 'burst_focused' ||
      profile.cognitiveRhythm === 'burst_recovery',

    needsWarmUpTime:
      profile.productivityStyle === 'slow_build',

    worksWithDeadlines:
      profile.productivityStyle === 'deadline_driven',

    // Daily timing
    peakEnergyTime: profile.dailyEnergyPattern,

    suggestTimingForHardTasks:
      profile.dailyEnergyPattern !== 'consistent' &&
      profile.dailyEnergyPattern !== 'unpredictable'
  };
}

/**
 * Get context for LLM prompts based on cognitive profile
 */
export async function getCognitiveProfileContextForLLM(): Promise<string> {
  const profile = await getCognitiveProfile();
  const adaptations = await getCoachAdaptations();

  if (!profile.completedOnboarding) {
    return ''; // No profile yet
  }

  // Map cognitive modes to human-readable descriptions
  const cognitiveModeLabelsFull: Record<CognitiveMode, string> = {
    procedural_sequential: 'Procedural-Sequential (linear, step-by-step)',
    analytical_symbolic: 'Analytical-Symbolic (logical, precise)',
    conceptual_systems: 'Conceptual Systems (patterns, frameworks, big picture)',
    narrative_meaning: 'Narrative-Meaning (stories, identity, emotional context)',
    embodied_somatic: 'Embodied/Somatic (body-based, learns by doing)',
    associative_divergent: 'Associative-Divergent (rapid connections, nonlinear)',
    emotional_relational: 'Emotional-Relational (attuned to people, interpersonal)',
    visual_spatial: 'Visual-Spatial (images, spatial models)',
    temporal_foresight: 'Temporal/Foresight (timelines, consequences)',
    integrative_meta: 'Integrative/Meta (meta-cognition, holds contradictions)'
  };

  const parts: string[] = ['USER\'S COGNITIVE PROFILE (adapt your responses accordingly):'];

  // Cognitive mode (primary)
  parts.push(`- Primary cognitive mode: ${cognitiveModeLabelsFull[profile.primaryCognitiveMode]}`);
  if (profile.secondaryCognitiveMode) {
    parts.push(`- Secondary mode: ${cognitiveModeLabelsFull[profile.secondaryCognitiveMode]}`);
  }

  // Communication
  parts.push(`- Communication style: ${profile.communicationStyle}`);
  if (profile.needsTimeToRespond) {
    parts.push('- Needs time to respond - don\'t rush');
  }

  // Emotional
  parts.push(`- Emotional processing: ${profile.emotionalProcessing}`);
  if (profile.sensitivityLevel === 'highly_sensitive') {
    parts.push('- Highly sensitive - be gentle');
  }
  if (profile.emotionalIntelligence === 'high') {
    parts.push('- High emotional intelligence - can handle nuance');
  }

  // Social
  parts.push(`- Social orientation: ${profile.socialOrientation}`);

  // Structure
  parts.push(`- Structure preference: ${profile.structurePreference}`);

  // Learning styles
  if (profile.learningStyles && profile.learningStyles.length > 0) {
    parts.push(`- Learning styles: ${profile.learningStyles.join(', ')}`);
  }

  // Mode-specific adaptations
  parts.push('\nADAPT YOUR RESPONSES:');

  // Based on cognitive mode
  const mode = profile.primaryCognitiveMode;
  if (mode === 'conceptual_systems') {
    parts.push('- Start with framing and context, not steps');
    parts.push('- Use metaphors - they understand through analogy');
    parts.push('- Allow partial articulation - they know more than they can explain');
    parts.push('- Connect ideas to bigger patterns');
  } else if (mode === 'procedural_sequential') {
    parts.push('- Give clear, logical steps');
    parts.push('- Provide predictable structure');
    parts.push('- Minimize unnecessary abstraction');
  } else if (mode === 'narrative_meaning') {
    parts.push('- Use story-based reflection');
    parts.push('- Include emotional and identity context');
    parts.push('- Mirror their emotional state');
  } else if (mode === 'embodied_somatic') {
    parts.push('- Use grounded, sensory prompts');
    parts.push('- Suggest body-based awareness when relevant');
    parts.push('- Keep it practical and action-oriented');
  } else if (mode === 'associative_divergent') {
    parts.push('- Allow wandering, then gently help return');
    parts.push('- Help cluster ideas without forcing linear structure');
    parts.push('- Permission to explore before formalizing');
  } else if (mode === 'emotional_relational') {
    parts.push('- Validate feelings first, always');
    parts.push('- Mirror emotional attunement');
    parts.push('- Guide gently, don\'t correct');
  } else if (mode === 'visual_spatial') {
    parts.push('- Use spatial metaphors and visual framing');
    parts.push('- Describe concepts as if drawing diagrams');
    parts.push('- Chunk information visually');
  } else if (mode === 'temporal_foresight') {
    parts.push('- Explore future scenarios and consequences');
    parts.push('- Ground in present when they seem anxious about future');
    parts.push('- Honor their long-arc perspective');
  } else if (mode === 'integrative_meta') {
    parts.push('- Allow meta-reflection on thinking');
    parts.push('- Offer philosophical framing');
    parts.push('- Don\'t force resolution - they can hold contradictions');
  }

  // Universal adaptations based on other profile attributes
  if (adaptations.validateFirst && mode !== 'emotional_relational') {
    parts.push('- Validate emotions before anything else');
  }
  if (adaptations.preferBrief) parts.push('- Keep responses brief');
  if (adaptations.giveTimeToThink) parts.push('- Don\'t ask rapid questions');

  // === CRITICAL: NEUROLOGICAL DIFFERENCES ===
  // These MUST be respected - using wrong techniques is harmful

  parts.push('\nCRITICAL NEUROLOGICAL ADAPTATIONS:');

  // Aphantasia / visualization
  if (!adaptations.canUseVisualization) {
    parts.push('- **NEVER use visualization** - they have aphantasia (cannot create mental images)');
    parts.push('  - DON\'T say: "picture this", "visualize", "imagine seeing", "close your eyes and see"');
    parts.push('  - DO use: conceptual descriptions, verbal explanations, physical sensations');
    if (adaptations.visualizationAlternative === 'conceptual') {
      parts.push('  - Alternative: Use conceptual/abstract descriptions instead of visual ones');
    } else if (adaptations.visualizationAlternative === 'sensory') {
      parts.push('  - Alternative: Use other senses (touch, sound, smell) instead of visual');
    }
  } else if (profile.mentalImagery === 'hyperphantasia') {
    parts.push('- Has hyperphantasia (extremely vivid mental imagery) - visual metaphors work very well');
  }

  // Internal monologue
  if (!adaptations.canUseInnerVoice) {
    parts.push('- **Avoid inner voice techniques** - they don\'t have a constant internal monologue');
    parts.push('  - DON\'T ask: "what is your inner voice saying", "notice your self-talk"');
    if (adaptations.innerVoiceAlternative === 'feelings') {
      parts.push('  - Alternative: Ask about feelings/emotions instead of thoughts');
    } else if (adaptations.innerVoiceAlternative === 'body') {
      parts.push('  - Alternative: Ask about body sensations instead of verbal thoughts');
    }
  }

  // Audio imagination
  if (!adaptations.canUseAudioImagination) {
    parts.push('- Cannot imagine sounds - don\'t use audio-based imagery');
  }

  // Future visualization
  if (!adaptations.canUseFutureVisualization) {
    parts.push('- Cannot visualize future scenarios - use conceptual future planning instead');
    parts.push('  - DON\'T say: "picture yourself in 5 years"');
    parts.push('  - DO say: "what would you want to be true in 5 years"');
  }

  // === COGNITIVE RHYTHM ADAPTATIONS ===
  // How to adapt based on their energy/clarity patterns

  if (adaptations.isCyclical) {
    parts.push('\nCOGNITIVE RHYTHM AWARENESS:');
    parts.push(`- This person has ${adaptations.rhythmType.replace('_', ' ')} cognitive rhythms`);

    if (adaptations.rhythmType === 'cyclical_pronounced') {
      parts.push('- Has clear HIGH and LOW phases - this is NOT a disorder, it\'s their pattern');
      parts.push('- During LOW phases: Be gentler, suggest simpler tasks, remind them it will pass');
      parts.push('- During HIGH phases: Help them capitalize on clarity, support their productivity');
      parts.push('- KEY REFRAME: "Low phases are not failure — they are integration and recovery"');
    } else if (adaptations.rhythmType === 'burst_recovery') {
      parts.push('- Works in intense productive BURSTS followed by CRASHES');
      parts.push('- Don\'t interrupt flow states when they\'re in a burst');
      parts.push('- After crashes, don\'t push - they need genuine recovery time');
      parts.push('- Help them work WITH this pattern, not fight against it');
    } else if (adaptations.rhythmType === 'cyclical_mild') {
      parts.push('- Has some energy waves but nothing dramatic');
      parts.push('- Adapt intensity based on where they seem to be');
    }

    if (adaptations.needsLowPhaseSupport) {
      parts.push('- May need check-ins about current energy level before suggesting demanding tasks');
    }
  }

  // Productivity style
  if (adaptations.respectBurstPatterns) {
    parts.push('- Respect burst work patterns - don\'t interrupt deep focus with check-ins');
  }
  if (adaptations.needsWarmUpTime) {
    parts.push('- Needs warm-up time - don\'t expect immediate deep work');
  }
  if (adaptations.worksWithDeadlines) {
    parts.push('- Works well with deadlines - time pressure can be motivating, not stressful');
  }

  // Daily energy
  if (adaptations.suggestTimingForHardTasks) {
    const timingAdvice: Record<DailyEnergyPattern, string> = {
      morning_person: 'morning',
      night_owl: 'evening/night',
      afternoon_peak: 'midday',
      consistent: '',
      unpredictable: ''
    };
    if (timingAdvice[adaptations.peakEnergyTime]) {
      parts.push(`- Peak mental energy: ${timingAdvice[adaptations.peakEnergyTime]} - suggest hard tasks for this time`);
    }
  }

  // Strengths
  if (profile.discoveredStrengths.length > 0) {
    parts.push(`\nKNOWN STRENGTHS: ${profile.discoveredStrengths.join(', ')}`);
  }

  // Traditional learning note
  if (profile.traditionalLearningFit === 'struggled') {
    parts.push('\nNOTE: Traditional education didn\'t fit their mind - don\'t use school-style instruction');
  }

  return parts.join('\n');
}
