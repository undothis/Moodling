/**
 * Mood Leaf - Psychological Analysis Types
 *
 * 30 psychological assessment categories with 450+ detection phrases
 * Based on validated clinical and research frameworks:
 * - CBT (cognitive distortions)
 * - DBT (emotion regulation)
 * - ACT (values, acceptance)
 * - Attachment theory
 * - Polyvagal theory
 * - Positive psychology (PERMA, VIA strengths)
 * - Gottman (relationship patterns)
 * - And more...
 *
 * This enables the app to understand not just WHAT happened,
 * but WHY patterns emerge and HOW to help.
 */

// ============================================
// COGNITIVE DISTORTION PATTERNS (CBT)
// ============================================

export type CognitiveDistortion =
  | 'all_or_nothing'
  | 'catastrophizing'
  | 'mind_reading'
  | 'fortune_telling'
  | 'should_statements'
  | 'emotional_reasoning'
  | 'labeling'
  | 'personalization'
  | 'magnification'
  | 'minimization'
  | 'filtering'
  | 'disqualifying_positive';

export const COGNITIVE_DISTORTION_PATTERNS: Record<CognitiveDistortion, {
  keywords: string[];
  examples: string[];
  reframe_prompt: string;
}> = {
  all_or_nothing: {
    keywords: [
      'always', 'never', 'completely', 'totally', 'entirely',
      'absolutely', 'every time', 'nothing ever', 'everything is',
      'perfect', 'ruined', '100%', 'zero', 'all or nothing'
    ],
    examples: [
      'I always fail at everything',
      'Nothing ever works out for me',
      'I\'m completely worthless'
    ],
    reframe_prompt: 'I notice some black-and-white thinking. What would a middle ground look like?'
  },
  catastrophizing: {
    keywords: [
      'worst', 'disaster', 'catastrophe', 'can\'t handle', 'ruined',
      'end of the world', 'terrible', 'horrible', 'unbearable',
      'destroyed', 'devastating', 'nightmare', 'what if'
    ],
    examples: [
      'This will destroy everything',
      'I can\'t handle this',
      'What if the worst happens'
    ],
    reframe_prompt: 'That sounds overwhelming. What\'s the most likely outcome, not the worst?'
  },
  mind_reading: {
    keywords: [
      'they think', 'probably thinks', 'must think', 'everyone thinks',
      'they\'re judging', 'knows I\'m', 'can tell that I', 'sees me as',
      'assumes', 'believes I\'m'
    ],
    examples: [
      'She thinks I\'m incompetent',
      'Everyone can tell I\'m anxious',
      'He probably thinks I\'m stupid'
    ],
    reframe_prompt: 'What evidence do you have for what they\'re thinking? Could there be other explanations?'
  },
  fortune_telling: {
    keywords: [
      'will be', 'going to fail', 'bound to', 'definitely going to',
      'I know it will', 'won\'t work', 'no point trying', 'doomed',
      'inevitable', 'certain to'
    ],
    examples: [
      'It\'s definitely going to fail',
      'There\'s no point, I know how it ends',
      'I\'m bound to mess it up'
    ],
    reframe_prompt: 'How certain can we really be about the future? What if it goes differently?'
  },
  should_statements: {
    keywords: [
      'should', 'shouldn\'t', 'must', 'have to', 'ought to',
      'supposed to', 'need to be', 'expected to', 'required to'
    ],
    examples: [
      'I should be perfect at this',
      'I shouldn\'t feel this way',
      'I must always be productive'
    ],
    reframe_prompt: 'Where does this "should" come from? What if you gave yourself permission to be human?'
  },
  emotional_reasoning: {
    keywords: [
      'I feel, therefore', 'because I feel', 'feel like a',
      'I feel stupid so', 'feel guilty so I must be', 'feels true'
    ],
    examples: [
      'I feel stupid, so I must be',
      'I feel guilty, so I must have done something wrong',
      'It feels hopeless, so it is'
    ],
    reframe_prompt: 'Feelings are real, but they\'re not always facts. What would a neutral observer see?'
  },
  labeling: {
    keywords: [
      'I am a', 'I\'m such a', 'I\'m a failure', 'I\'m a loser',
      'I\'m worthless', 'I\'m stupid', 'I\'m pathetic', 'I\'m broken',
      'they\'re a', 'he\'s a jerk', 'she\'s crazy'
    ],
    examples: [
      'I\'m such a failure',
      'I\'m a terrible person',
      'He\'s a complete jerk'
    ],
    reframe_prompt: 'That\'s a strong label. What specific behavior are you reacting to?'
  },
  personalization: {
    keywords: [
      'my fault', 'because of me', 'I caused', 'I made them',
      'blame myself', 'if only I had', 'I should have prevented',
      'it\'s all on me', 'I\'m responsible for everything'
    ],
    examples: [
      'It\'s all my fault they\'re upset',
      'If I had been better, this wouldn\'t have happened',
      'I made them feel that way'
    ],
    reframe_prompt: 'How much of this is really within your control? What other factors might be involved?'
  },
  magnification: {
    keywords: [
      'huge deal', 'massive', 'enormous', 'can\'t believe how bad',
      'way worse', 'so much more', 'incredibly'
    ],
    examples: [
      'This is a huge deal',
      'It\'s way worse than you think'
    ],
    reframe_prompt: 'How would this look if you zoomed out a bit? What\'s the bigger picture?'
  },
  minimization: {
    keywords: [
      'no big deal', 'doesn\'t matter', 'whatever', 'not important',
      'anyone could have', 'just luck', 'nothing special'
    ],
    examples: [
      'It\'s no big deal, anyone could do it',
      'My accomplishments don\'t really matter'
    ],
    reframe_prompt: 'You\'re downplaying something. What if you gave yourself credit?'
  },
  filtering: {
    keywords: [
      'but', 'except for', 'only thing I noticed', 'focused on',
      'all I could see', 'the one bad part'
    ],
    examples: [
      'The presentation went well but I stumbled once',
      'The only thing I noticed was the criticism'
    ],
    reframe_prompt: 'What else happened that you might be filtering out?'
  },
  disqualifying_positive: {
    keywords: [
      'doesn\'t count', 'they were just being nice', 'luck',
      'anyone would', 'they have to say that', 'just a fluke'
    ],
    examples: [
      'They were just being nice',
      'It doesn\'t count because...',
      'That was just luck'
    ],
    reframe_prompt: 'Why does this positive thing not count? What if it\'s actually true?'
  }
};

// ============================================
// DEFENSE MECHANISMS (Vaillant's Hierarchy)
// ============================================

export type DefenseMechanism =
  // Mature (adaptive)
  | 'humor'
  | 'sublimation'
  | 'anticipation'
  | 'self_observation'
  // Neurotic (middle)
  | 'intellectualization'
  | 'displacement'
  | 'isolation_of_affect'
  | 'rationalization'
  // Immature (maladaptive)
  | 'projection'
  | 'denial'
  | 'splitting'
  | 'passive_aggression'
  | 'acting_out';

export type DefenseLevel = 'mature' | 'neurotic' | 'immature';

export const DEFENSE_MECHANISM_PATTERNS: Record<DefenseMechanism, {
  level: DefenseLevel;
  keywords: string[];
  examples: string[];
}> = {
  // Mature defenses
  humor: {
    level: 'mature',
    keywords: [
      'laughed about it', 'found the funny side', 'joke helped',
      'had to laugh', 'humor in the situation', 'at least I can laugh'
    ],
    examples: ['I laughed about it later', 'Had to find the humor in it']
  },
  sublimation: {
    level: 'mature',
    keywords: [
      'channeled into', 'used that energy', 'turned it into',
      'poured it into my work', 'exercised it out', 'created from'
    ],
    examples: ['I channeled my anger into the gym', 'Turned it into art']
  },
  anticipation: {
    level: 'mature',
    keywords: [
      'prepared myself', 'expected it might', 'planned ahead',
      'braced for', 'anticipated', 'saw it coming'
    ],
    examples: ['I prepared myself for the possibility', 'Planned ahead for that']
  },
  self_observation: {
    level: 'mature',
    keywords: [
      'I noticed that I', 'I recognize in myself', 'observed my pattern',
      'aware of my tendency', 'I can see that I', 'realize I do this'
    ],
    examples: ['I notice I do this when stressed', 'I recognize my pattern']
  },

  // Neurotic defenses
  intellectualization: {
    level: 'neurotic',
    keywords: [
      'logically speaking', 'rationally', 'objectively', 'technically',
      'if you think about it', 'the facts are', 'statistically'
    ],
    examples: ['Logically speaking, it makes sense', 'Objectively, I understand']
  },
  displacement: {
    level: 'neurotic',
    keywords: [
      'snapped at', 'took it out on', 'kicked the dog',
      'yelled at someone else', 'misdirected', 'wrong person'
    ],
    examples: ['I snapped at my partner but I was really mad at work']
  },
  isolation_of_affect: {
    level: 'neurotic',
    keywords: [
      'didn\'t bother me', 'felt nothing', 'no emotion',
      'detached from it', 'numb to', 'disconnected'
    ],
    examples: ['It didn\'t really bother me', 'I felt nothing about it']
  },
  rationalization: {
    level: 'neurotic',
    keywords: [
      'it\'s actually better', 'blessing in disguise', 'meant to be',
      'for the best', 'good reason', 'makes sense because'
    ],
    examples: ['It\'s actually better this way', 'There was a good reason']
  },

  // Immature defenses
  projection: {
    level: 'immature',
    keywords: [
      'they are the one', 'they\'re being', 'they think I\'m',
      'they\'re so', 'everyone else is', 'it\'s them not me'
    ],
    examples: ['They\'re the angry one, not me', 'She\'s being defensive']
  },
  denial: {
    level: 'immature',
    keywords: [
      'not a problem', 'I\'m fine', 'nothing\'s wrong',
      'didn\'t happen', 'it\'s not that bad', 'no issue'
    ],
    examples: ['It\'s not a problem', 'I\'m totally fine', 'That didn\'t happen']
  },
  splitting: {
    level: 'immature',
    keywords: [
      'perfect', 'evil', 'best ever', 'worst ever',
      'angel', 'devil', 'all good', 'all bad', 'love them/hate them'
    ],
    examples: ['He\'s perfect', 'She\'s pure evil', 'They\'re the worst']
  },
  passive_aggression: {
    level: 'immature',
    keywords: [
      'forgot to', 'didn\'t get around to', 'fine, whatever',
      'if you say so', 'I guess', 'sure, I\'ll do it'
    ],
    examples: ['I "forgot" to do it', 'Fine, whatever you want', 'I guess']
  },
  acting_out: {
    level: 'immature',
    keywords: [
      'just did it', 'couldn\'t stop myself', 'impulse',
      'acted without thinking', 'regret', 'blew up'
    ],
    examples: ['I just blew up', 'Couldn\'t stop myself', 'Acted on impulse']
  }
};

// ============================================
// ATTACHMENT STYLES
// ============================================

export type AttachmentStyle = 'secure' | 'anxious' | 'avoidant' | 'disorganized';

export const ATTACHMENT_PATTERNS: Record<AttachmentStyle, {
  keywords: string[];
  behaviors: string[];
  relationship_patterns: string[];
}> = {
  secure: {
    keywords: [
      'comfortable with closeness', 'trust', 'secure', 'balanced',
      'can depend on', 'open communication', 'feel safe'
    ],
    behaviors: [
      'communicate needs clearly', 'handle conflict well',
      'comfortable with intimacy', 'maintain independence'
    ],
    relationship_patterns: [
      'I feel comfortable being close and also being independent',
      'I trust my partner and feel trusted'
    ]
  },
  anxious: {
    keywords: [
      'worry they\'ll leave', 'need reassurance', 'clingy',
      'fear of abandonment', 'overthink', 'constantly checking',
      'what if they don\'t love me', 'needy', 'desperate'
    ],
    behaviors: [
      'seek constant reassurance', 'fear rejection',
      'become preoccupied with relationship', 'jealousy'
    ],
    relationship_patterns: [
      'I often worry my partner doesn\'t really love me',
      'I need a lot of reassurance',
      'I get anxious when they don\'t respond quickly'
    ]
  },
  avoidant: {
    keywords: [
      'need space', 'too close', 'suffocating', 'independent',
      'don\'t need anyone', 'walls up', 'keep distance',
      'commitment issues', 'emotionally unavailable'
    ],
    behaviors: [
      'pull away when close', 'difficulty with emotional intimacy',
      'prioritize independence', 'minimize attachment needs'
    ],
    relationship_patterns: [
      'I feel uncomfortable when people get too close',
      'I prefer not to depend on others',
      'I need a lot of space in relationships'
    ]
  },
  disorganized: {
    keywords: [
      'want closeness but push away', 'confused', 'hot and cold',
      'love and fear', 'chaotic', 'unpredictable', 'mixed signals'
    ],
    behaviors: [
      'conflicting desires for closeness and distance',
      'difficulty regulating emotions in relationships',
      'unpredictable responses'
    ],
    relationship_patterns: [
      'I want to be close but I also push people away',
      'My relationships feel chaotic',
      'I send mixed signals'
    ]
  }
};

// ============================================
// LOCUS OF CONTROL
// ============================================

export type LocusOfControl = 'internal' | 'external';

export const LOCUS_OF_CONTROL_PATTERNS: Record<LocusOfControl, {
  keywords: string[];
  attributions: string[];
}> = {
  internal: {
    keywords: [
      'I can', 'I made it happen', 'my effort', 'my choice',
      'because I worked', 'I\'m responsible', 'it\'s up to me',
      'I control', 'I decided', 'I\'m capable', 'I can handle'
    ],
    attributions: [
      'I succeeded because I worked hard',
      'I can change this situation',
      'It\'s my responsibility'
    ]
  },
  external: {
    keywords: [
      'luck', 'fate', 'chance', 'destiny', 'coincidence',
      'they made me', 'it happened to me', 'nothing I can do',
      'out of my control', 'what\'s the point', 'why bother',
      'I had no choice', 'forced to'
    ],
    attributions: [
      'I just got lucky',
      'It\'s fate',
      'There\'s nothing I can do about it'
    ]
  }
};

// ============================================
// EMOTION REGULATION (Gross Process Model)
// ============================================

export type EmotionRegulationStrategy =
  // Antecedent-focused (before emotion peaks)
  | 'situation_selection'
  | 'situation_modification'
  | 'attentional_deployment'
  | 'cognitive_reappraisal'
  // Response-focused (after emotion arises)
  | 'suppression'
  | 'rumination'
  | 'experiential_avoidance';

export type RegulationTiming = 'antecedent' | 'response';

export const EMOTION_REGULATION_PATTERNS: Record<EmotionRegulationStrategy, {
  timing: RegulationTiming;
  adaptive: boolean;
  keywords: string[];
}> = {
  situation_selection: {
    timing: 'antecedent',
    adaptive: true,
    keywords: [
      'I avoid', 'chose not to go', 'stayed away', 'decided to skip',
      'removed myself', 'didn\'t put myself in that situation'
    ]
  },
  situation_modification: {
    timing: 'antecedent',
    adaptive: true,
    keywords: [
      'changed the situation', 'asked for help', 'adjusted',
      'modified', 'set boundaries', 'spoke up'
    ]
  },
  attentional_deployment: {
    timing: 'antecedent',
    adaptive: true,
    keywords: [
      'distracted myself', 'focused on something else', 'redirected attention',
      'looked away', 'thought about something else'
    ]
  },
  cognitive_reappraisal: {
    timing: 'antecedent',
    adaptive: true,
    keywords: [
      'reframed', 'thought about it differently', 'changed perspective',
      'looked at it another way', 'silver lining', 'new angle'
    ]
  },
  suppression: {
    timing: 'response',
    adaptive: false,
    keywords: [
      'pushed down', 'didn\'t show', 'bottled up', 'held it in',
      'swallowed my feelings', 'kept it inside', 'hid how I felt'
    ]
  },
  rumination: {
    timing: 'response',
    adaptive: false,
    keywords: [
      'can\'t stop thinking', 'keep going over', 'dwelling on',
      'obsessing', 'replaying it', 'stuck in my head', 'round and round'
    ]
  },
  experiential_avoidance: {
    timing: 'response',
    adaptive: false,
    keywords: [
      'can\'t handle feeling this', 'need to get rid of',
      'anything to not feel', 'trying not to think about',
      'escape', 'numb it', 'drink to forget'
    ]
  }
};

// ============================================
// POLYVAGAL STATES
// ============================================

export type PolyvagalState = 'ventral_vagal' | 'sympathetic' | 'dorsal_vagal';

export const POLYVAGAL_PATTERNS: Record<PolyvagalState, {
  state_name: string;
  keywords: string[];
  body_sensations: string[];
  behaviors: string[];
}> = {
  ventral_vagal: {
    state_name: 'Safe & Social',
    keywords: [
      'grounded', 'calm', 'present', 'open', 'connected',
      'at ease', 'relaxed', 'feel safe', 'can think clearly'
    ],
    body_sensations: ['relaxed muscles', 'steady breathing', 'warm'],
    behaviors: ['eye contact', 'social engagement', 'clear thinking']
  },
  sympathetic: {
    state_name: 'Fight/Flight',
    keywords: [
      'anxious', 'on edge', 'racing', 'wired', 'can\'t sit still',
      'everything feels urgent', 'heart pounding', 'restless',
      'keyed up', 'panic', 'need to escape'
    ],
    body_sensations: ['racing heart', 'shallow breathing', 'muscle tension', 'sweating'],
    behaviors: ['restlessness', 'hypervigilance', 'snapping at people']
  },
  dorsal_vagal: {
    state_name: 'Shutdown/Freeze',
    keywords: [
      'numb', 'frozen', 'disconnected', 'foggy', 'can\'t move',
      'feel nothing', 'going through motions', 'empty', 'shutdown',
      'collapsed', 'hopeless', 'dissociated'
    ],
    body_sensations: ['heaviness', 'fatigue', 'no energy', 'foggy head'],
    behaviors: ['withdrawal', 'isolation', 'difficulty moving or acting']
  }
};

// ============================================
// MINDSET (Dweck)
// ============================================

export type Mindset = 'fixed' | 'growth';

export const MINDSET_PATTERNS: Record<Mindset, {
  keywords: string[];
  beliefs: string[];
  response_to_failure: string[];
}> = {
  fixed: {
    keywords: [
      'I\'m just not', 'you either have it or', 'that\'s just how I am',
      'born with', 'natural talent', 'can\'t change', 'not smart enough'
    ],
    beliefs: [
      'If I have to work hard, it means I\'m not good at it',
      'My abilities are fixed',
      'I\'m just not a math person'
    ],
    response_to_failure: [
      'See, I knew I couldn\'t',
      'I\'m not cut out for this',
      'I give up'
    ]
  },
  growth: {
    keywords: [
      'I can learn', 'with practice', 'not yet', 'getting better',
      'effort', 'improve', 'develop', 'work on', 'grow'
    ],
    beliefs: [
      'I can learn to do this',
      'With practice, I\'ll get better',
      'I\'m not there yet'
    ],
    response_to_failure: [
      'Let me try a different approach',
      'What can I learn from this',
      'This is challenging but I can figure it out'
    ]
  }
};

// ============================================
// VALUES (Schwartz's 10 Basic Values)
// ============================================

export type SchwartzValue =
  | 'power'
  | 'achievement'
  | 'hedonism'
  | 'stimulation'
  | 'self_direction'
  | 'universalism'
  | 'benevolence'
  | 'tradition'
  | 'conformity'
  | 'security';

export const VALUES_PATTERNS: Record<SchwartzValue, {
  motivation: string;
  keywords: string[];
}> = {
  power: {
    motivation: 'Social status, control over resources and people',
    keywords: ['authority', 'influence', 'dominance', 'prestige', 'power', 'control', 'status']
  },
  achievement: {
    motivation: 'Personal success through demonstrated competence',
    keywords: ['ambitious', 'goals', 'accomplishments', 'excellence', 'success', 'capable', 'achieve']
  },
  hedonism: {
    motivation: 'Pleasure and sensuous gratification',
    keywords: ['fun', 'indulgent', 'treat myself', 'pleasure', 'enjoy', 'gratification']
  },
  stimulation: {
    motivation: 'Excitement, novelty, challenge',
    keywords: ['adventure', 'variety', 'daring', 'new experiences', 'excitement', 'thrill']
  },
  self_direction: {
    motivation: 'Independent thought and action',
    keywords: ['freedom', 'my own path', 'autonomous', 'curious', 'independent', 'creativity']
  },
  universalism: {
    motivation: 'Understanding, tolerance, protection for all',
    keywords: ['equality', 'justice', 'environment', 'tolerance', 'world peace', 'fairness']
  },
  benevolence: {
    motivation: 'Preservation and enhancement of close others',
    keywords: ['helpful', 'loyal', 'caring', 'family', 'friends', 'supportive', 'kind']
  },
  tradition: {
    motivation: 'Respect and commitment to cultural customs',
    keywords: ['heritage', 'elders', 'customs', 'tradition', 'roots', 'culture']
  },
  conformity: {
    motivation: 'Restraint of actions that violate norms',
    keywords: ['obedient', 'polite', 'rules', 'proper', 'expectations', 'appropriate']
  },
  security: {
    motivation: 'Safety, harmony, stability',
    keywords: ['safety', 'order', 'predictability', 'stable', 'secure', 'protected']
  }
};

// ============================================
// PERMA MODEL (Seligman's Well-being)
// ============================================

export type PermaElement = 'positive_emotion' | 'engagement' | 'relationships' | 'meaning' | 'accomplishment';

export const PERMA_PATTERNS: Record<PermaElement, {
  keywords: string[];
  examples: string[];
}> = {
  positive_emotion: {
    keywords: ['hope', 'joy', 'gratitude', 'contentment', 'happy', 'peaceful', 'excited', 'love'],
    examples: ['That made me feel so grateful', 'I felt real joy']
  },
  engagement: {
    keywords: ['flow', 'absorbed', 'in the zone', 'lost track of time', 'immersed', 'focused'],
    examples: ['I completely lost myself in it', 'Time flew by']
  },
  relationships: {
    keywords: ['connected', 'supported', 'belonging', 'loved', 'understood', 'close to'],
    examples: ['They really understand me', 'I feel so connected']
  },
  meaning: {
    keywords: ['purpose', 'significance', 'contribution', 'legacy', 'matters', 'calling'],
    examples: ['This feels like my purpose', 'What I do matters']
  },
  accomplishment: {
    keywords: ['achieved', 'mastered', 'growth', 'progress', 'proud', 'accomplished', 'succeeded'],
    examples: ['I\'m proud of what I\'ve achieved', 'I finally mastered it']
  }
};

// ============================================
// GRIEF STYLES
// ============================================

export type GriefStyle = 'intuitive' | 'instrumental' | 'dissonant';

export const GRIEF_STYLE_PATTERNS: Record<GriefStyle, {
  description: string;
  keywords: string[];
  coping_approach: string[];
}> = {
  intuitive: {
    description: 'Emotional expression and processing',
    keywords: [
      'so sad', 'I cried', 'need to talk about it', 'waves of grief',
      'miss them so much', 'heartbroken', 'emotionally devastated'
    ],
    coping_approach: ['expressing feelings', 'talking about loss', 'crying', 'support groups']
  },
  instrumental: {
    description: 'Cognitive/physical focus, action-oriented',
    keywords: [
      'set up memorial', 'made a list', 'keeping busy', 'handling arrangements',
      'need to do something', 'organized their things', 'practical tasks'
    ],
    coping_approach: ['taking action', 'problem-solving', 'physical activity', 'creating memorials']
  },
  dissonant: {
    description: 'Style doesn\'t match expression (internal conflict)',
    keywords: [
      'should be more sad', 'feel guilty for not crying', 'people expect me to',
      'wrong way to grieve', 'judged for how I\'m handling'
    ],
    coping_approach: ['internal conflict', 'social pressure mismatch']
  }
};

// ============================================
// MONEY SCRIPTS (Klontz)
// ============================================

export type MoneyScript = 'money_avoidance' | 'money_worship' | 'money_status' | 'money_vigilance';

export const MONEY_SCRIPT_PATTERNS: Record<MoneyScript, {
  core_belief: string;
  keywords: string[];
}> = {
  money_avoidance: {
    core_belief: 'Money is bad or corrupting',
    keywords: [
      'rich people are greedy', 'don\'t deserve money', 'guilty when I have',
      'money is evil', 'don\'t need much', 'money doesn\'t matter'
    ]
  },
  money_worship: {
    core_belief: 'More money = more happiness/security',
    keywords: [
      'if I just had more money', 'never enough', 'money would fix everything',
      'need to make more', 'financial freedom', 'always chasing'
    ]
  },
  money_status: {
    core_belief: 'Self-worth = net worth',
    keywords: [
      'keeping up appearances', 'success equals money', 'embarrassed about finances',
      'what will people think', 'image', 'status symbols'
    ]
  },
  money_vigilance: {
    core_belief: 'Be secretive and frugal',
    keywords: [
      'don\'t talk about money', 'save for rainy day', 'anxious if not saving',
      'never spend on myself', 'always worried', 'financial anxiety'
    ]
  }
};

// ============================================
// GOTTMAN FOUR HORSEMEN
// ============================================

export type GottmanHorseman = 'criticism' | 'contempt' | 'defensiveness' | 'stonewalling';

export const GOTTMAN_PATTERNS: Record<GottmanHorseman, {
  description: string;
  keywords: string[];
  antidote: string;
}> = {
  criticism: {
    description: 'Attacking character rather than behavior',
    keywords: [
      'you always', 'you never', 'what\'s wrong with you',
      'why can\'t you ever', 'you\'re so', 'you don\'t care'
    ],
    antidote: 'Use "I" statements and express needs gently'
  },
  contempt: {
    description: 'Disrespect, mockery, superiority',
    keywords: [
      'disgusting', 'pathetic', 'rolling my eyes', 'mocking',
      'sarcasm', 'name calling', 'superior to them'
    ],
    antidote: 'Build culture of appreciation and respect'
  },
  defensiveness: {
    description: 'Self-protection, counter-attack',
    keywords: [
      'not my fault', 'you\'re the one who', 'I didn\'t',
      'but you', 'what about when you', 'excuse'
    ],
    antidote: 'Take responsibility, even for part of it'
  },
  stonewalling: {
    description: 'Withdrawing, shutting down',
    keywords: [
      'can\'t talk about this', 'I\'m done', 'whatever',
      'not doing this', 'silent treatment', 'walking away'
    ],
    antidote: 'Self-soothe, then return to conversation'
  }
};

// ============================================
// PSYCHOLOGICAL PROFILE TYPE
// ============================================

export interface PsychologicalProfile {
  // Timestamps
  lastUpdated: string;
  entryCount: number;

  // Cognitive patterns
  cognitiveDistortions: {
    pattern: CognitiveDistortion;
    frequency: number;
    lastSeen: string;
    examples: string[];
  }[];

  // Defense mechanisms
  defenseMechanisms: {
    mechanism: DefenseMechanism;
    frequency: number;
    lastSeen: string;
  }[];
  defenseLevel: DefenseLevel;

  // Attachment
  attachmentStyle: AttachmentStyle;
  attachmentConfidence: number; // 0-1

  // Locus of control
  locusOfControl: {
    internal: number; // 0-1
    external: number; // 0-1
  };

  // Emotion regulation
  regulationStrategies: {
    strategy: EmotionRegulationStrategy;
    frequency: number;
  }[];
  adaptiveRatio: number; // ratio of adaptive to maladaptive strategies

  // Nervous system
  predominantState: PolyvagalState;
  stateHistory: {
    state: PolyvagalState;
    timestamp: string;
  }[];

  // Mindset
  mindset: {
    fixed: number;
    growth: number;
  };

  // Values
  topValues: SchwartzValue[];
  valuesConflicts: { value1: SchwartzValue; value2: SchwartzValue }[];

  // Well-being (PERMA)
  permaScores: Record<PermaElement, number>;

  // Grief (if applicable)
  griefStyle?: GriefStyle;

  // Money
  moneyScript?: MoneyScript;

  // Relationship patterns (if applicable)
  gottmanPatterns: {
    horseman: GottmanHorseman;
    frequency: number;
  }[];

  // Insights and connections
  insights: {
    type: 'pattern' | 'connection' | 'growth' | 'concern';
    message: string;
    timestamp: string;
    relatedPatterns: string[];
  }[];
}

// Default empty profile
export const DEFAULT_PSYCHOLOGICAL_PROFILE: PsychologicalProfile = {
  lastUpdated: new Date().toISOString(),
  entryCount: 0,
  cognitiveDistortions: [],
  defenseMechanisms: [],
  defenseLevel: 'neurotic',
  attachmentStyle: 'secure',
  attachmentConfidence: 0,
  locusOfControl: { internal: 0.5, external: 0.5 },
  regulationStrategies: [],
  adaptiveRatio: 0.5,
  predominantState: 'ventral_vagal',
  stateHistory: [],
  mindset: { fixed: 0.5, growth: 0.5 },
  topValues: [],
  valuesConflicts: [],
  permaScores: {
    positive_emotion: 0.5,
    engagement: 0.5,
    relationships: 0.5,
    meaning: 0.5,
    accomplishment: 0.5
  },
  gottmanPatterns: [],
  insights: []
};
