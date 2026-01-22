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
 * The complete cognitive profile
 */
export interface CognitiveProfile {
  // Core cognitive mode (primary way the mind works)
  primaryCognitiveMode: CognitiveMode;
  secondaryCognitiveMode: CognitiveMode | null;

  // Legacy: Core processing (for backward compatibility)
  primaryProcessing: ProcessingStyle;
  secondaryProcessing: ProcessingStyle | null;

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
      profile.prefersWrittenOrSpoken === 'spoken'
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
