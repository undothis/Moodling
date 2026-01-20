// memory-extraction-patterns.ts
// Comprehensive keyword detection for personal context extraction
// For use with Moodling (Mood Leaf) and similar therapeutic AI applications
// Version 2.0 - Complete consolidated edition
//
// ============================================
// IMPLEMENTATION STATUS
// ============================================
//
// IMPLEMENTED IN CODE (lifeContextService.ts & userContextService.ts):
// ✅ Identity - core, gender/sexuality, neurodivergence (ADHD, autism, etc.)
// ✅ Relationships - romantic people, events, dynamics
// ✅ Family - immediate, extended, in-laws, blended, dynamics
// ✅ Friendships - people, dynamics, loneliness
// ✅ Pets - types, events, loss
// ✅ Mental Health - providers, therapy types, conditions, symptoms
// ✅ Medications - general, antidepressants, anxiety meds, mood stabilizers, ADHD meds
// ✅ Addiction & Recovery - substances, behavioral, recovery programs
// ✅ Trauma & Abuse - all types, dynamics, recovery
// ✅ Self-harm & Crisis - keywords with care, hotline references
// ✅ Work & Career - general, positive, negative, events, burnout
// ✅ Education - general, levels, events
// ✅ Finances - general, positive, negative, events
// ✅ Housing - general, living situations, events
// ✅ Physical Health - general, chronic, serious, reproductive, events, disability
// ✅ Sleep - problems, patterns
// ✅ Exercise & Fitness - general, types, events
// ✅ Diet & Body Image - general, types, issues
// ✅ Death & Grief - events, causes, process, stages
// ✅ Milestones - positive, age, relationship, family, home, career
// ✅ Spirituality & Religion - general, practices, traditions, events
// ✅ Legal - general, civil, criminal, family, immigration
// ✅ Travel - general, types, events
// ✅ Hobbies - creative, entertainment, outdoor, collecting, learning
// ✅ Communication Preferences - validation, solutions, style
// ✅ Professions - healthcare, tech, education, service, trades, business, creative, legal, government
//
// ALSO IMPLEMENTED IN CODE (added in lifeContextService.ts):
// ✅ Temporal patterns (Sunday scaries, seasonal, recurring events)
// ✅ Coping mechanisms (healthy vs unhealthy tracking)
// ✅ Severity markers (crisis/high/moderate/low/positive distress)
// ✅ Entity extraction patterns (named_person, age, location, medication_dosage, sobriety_duration)
//
// ALSO IMPLEMENTED:
// ✅ HealthKit integration (healthKitService.ts)
//    - Heart rate monitoring with spike detection
//    - Sleep tracking (duration, quality, awakenings)
//    - Activity tracking (steps, exercise, calories)
//    - Smart notifications for elevated heart rate
// ✅ Health Insights & Correlations (healthInsightService.ts)
//    - Sleep-mood correlation analysis
//    - Activity-mood correlation analysis
//    - 90-day correlation data tracking
//    - Smart popup suggestions based on patterns
// ✅ Mega prompt with health data awareness (claudeAPIService.ts)
// ✅ Oblique Strategies (obliqueStrategiesService.ts)
//    - 210+ strategy cards across 7 categories
//    - Depression, anxiety, walking, artists, musicians, funny, strange
//    - Favorites and history tracking
//    - Mood-based strategy selection
// ✅ Secure Delete (secureDeleteService.ts)
//    - 3-pass overwrite before deletion
//    - Verification of complete removal
//    - Category-specific deletion
//    - Storage statistics and export before delete
// ✅ Comprehensive Documentation
//    - USER_FAQ.md - Searchable FAQ with code of conduct, data storage, learning explanation
//    - USER_MANUAL.md - Complete user manual
//    - DEVELOPER_GUIDE.md - Full technical documentation
// ✅ Quick Logs / Branches (quickLogsService.ts)
//    - Customizable tracking buttons for habits, goals, meds, anything
//    - Types: habit_build, habit_break, goal, symptom, medication, custom
//    - Streak tracking with current/longest/weekly average
//    - 30+ preset templates across 8 categories
//    - Reminder integration
//    - Context for Claude conversations
// ✅ Mood Leaf Product Philosophy (MOOD_LEAF_PHILOSOPHY.md)
//    - Tree metaphor: Leaves (journal), Sprout (AI), Branches (habits), Weather (health)
//    - Anti-dependency design principles
//    - Visual language and naming conventions
//    - Rebrand mapping from Moodling to Mood Leaf
//
// NOT YET IMPLEMENTED (future enhancements):
// ⬜ Compression templates (relationship, condition, event, pattern, preference, goal)
// ⬜ Watch app integration
// ⬜ Export reports for therapy
// ⬜ Android support
//
// ============================================

export const MEMORY_EXTRACTION_PATTERNS = {

  // ============================================
  // SECTION 1: IDENTITY & DEMOGRAPHICS
  // ============================================
  
  identity_core: [
    'my name is', 'i am', 'i\'m a', 'years old', 'i live in',
    'i\'m from', 'moved to', 'born in', 'grew up in', 'raised in',
    'nationality', 'ethnicity', 'background', 'originally from'
  ],
  
  identity_gender_sexuality: [
    'coming out', 'came out', 'transition', 'transitioning', 'transitioned',
    'gender identity', 'non-binary', 'transgender', 'cisgender',
    'gay', 'lesbian', 'bisexual', 'pansexual', 'asexual', 'queer',
    'sexuality', 'orientation', 'LGBTQ', 'closeted', 'out to',
    'deadname', 'pronouns', 'they/them', 'he/him', 'she/her',
    'questioning', 'fluid', 'demisexual', 'aromantic'
  ],
  
  identity_neurodivergence: [
    'ADHD', 'autism', 'autistic', 'ASD', 'on the spectrum',
    'neurodivergent', 'neurotypical', 'dyslexia', 'dyslexic',
    'dyscalculia', 'dyspraxia', 'sensory processing',
    'executive function', 'hyperfocus', 'stimming', 'masking',
    'special interest', 'infodump', 'burnout', 'meltdown', 'shutdown',
    'twice exceptional', '2e', 'gifted', 'learning disability'
  ],

  identity_cultural: [
    'cultural expectations', 'family expectations', 'traditional',
    'first generation', 'immigrant', 'between two cultures',
    'code switching', 'not [culture] enough', 'too [culture]',
    'arranged', 'bring shame', 'honor', 'filial piety',
    'model minority', 'stereotypes', 'microaggressions',
    'discrimination', 'racism', 'prejudice', 'bias',
    'heritage', 'ancestry', 'roots', 'homeland', 'diaspora'
  ],

  // ============================================
  // SECTION 2: RELATIONSHIPS - ROMANTIC
  // ============================================
  
  relationship_romantic_people: [
    'partner', 'husband', 'wife', 'spouse', 'boyfriend', 'girlfriend',
    'fiancé', 'fiancée', 'significant other', 'SO', 'lover',
    'ex', 'ex-husband', 'ex-wife', 'ex-boyfriend', 'ex-girlfriend',
    'the one', 'soulmate', 'person i\'m seeing', 'situationship',
    'fwb', 'friends with benefits', 'talking to', 'seeing someone'
  ],
  
  relationship_romantic_status: [
    'married', 'engaged', 'dating', 'single', 'divorced', 'separated',
    'widowed', 'in a relationship', 'it\'s complicated', 'open relationship',
    'polyamorous', 'monogamous', 'long distance', 'living together',
    'moved in', 'cohabiting', 'taking a break', 'on a break'
  ],
  
  relationship_romantic_events: [
    'anniversary', 'wedding', 'proposal', 'engaged', 'breakup',
    'broke up', 'getting divorced', 'separation', 'reconciled',
    'got back together', 'met on', 'first date', 'honeymoon',
    'eloped', 'vow renewal', 'moving in together'
  ],
  
  relationship_romantic_dynamics: [
    'fighting', 'argument', 'disagreement', 'not speaking',
    'couples therapy', 'marriage counseling', 'trust issues',
    'cheating', 'infidelity', 'affair', 'betrayal', 'forgiveness',
    'growing apart', 'falling out of love', 'rekindled',
    'communication issues', 'intimacy', 'love language',
    'emotionally unavailable', 'avoidant partner', 'anxious partner'
  ],

  // ============================================
  // SECTION 3: RELATIONSHIPS - FAMILY
  // ============================================
  
  family_immediate: [
    'mom', 'mother', 'dad', 'father', 'parent', 'parents',
    'brother', 'sister', 'sibling', 'son', 'daughter', 'child',
    'children', 'kids', 'baby', 'toddler', 'teenager', 'teen'
  ],
  
  family_extended: [
    'grandmother', 'grandfather', 'grandma', 'grandpa', 'nana', 'papa',
    'grandparent', 'grandchild', 'aunt', 'uncle', 'cousin',
    'niece', 'nephew', 'great-grandmother', 'great-grandfather'
  ],
  
  family_in_laws: [
    'mother-in-law', 'father-in-law', 'in-laws', 'MIL', 'FIL',
    'sister-in-law', 'brother-in-law', 'SIL', 'BIL',
    'son-in-law', 'daughter-in-law'
  ],
  
  family_blended: [
    'stepmother', 'stepfather', 'stepmom', 'stepdad', 'stepparent',
    'stepbrother', 'stepsister', 'stepsibling', 'stepson', 'stepdaughter',
    'half-brother', 'half-sister', 'half-sibling',
    'adoptive', 'adopted', 'birth parent', 'biological', 'foster',
    'bio mom', 'bio dad', 'birth mother', 'birth father'
  ],
  
  family_dynamics: [
    'estranged', 'no contact', 'low contact', 'NC', 'LC',
    'toxic family', 'family drama', 'dysfunctional', 'enmeshed',
    'boundaries', 'golden child', 'scapegoat', 'favoritism',
    'narcissistic parent', 'helicopter parent', 'neglectful',
    'codependent', 'enabling', 'family therapy', 'family secret',
    'black sheep', 'parentified', 'emotional incest', 'covert incest'
  ],
  
  family_events: [
    'family reunion', 'thanksgiving', 'christmas', 'holidays with family',
    'family dinner', 'family vacation', 'visiting family',
    'moved back home', 'empty nest', 'sandwich generation'
  ],

  // ============================================
  // SECTION 4: RELATIONSHIPS - FRIENDSHIPS & SOCIAL
  // ============================================
  
  friendships_people: [
    'best friend', 'BFF', 'close friend', 'friend group', 'squad',
    'childhood friend', 'old friend', 'new friend', 'work friend',
    'acquaintance', 'frenemy', 'mutual friend', 'circle'
  ],
  
  friendships_dynamics: [
    'friendship', 'falling out', 'reconnected', 'drifted apart',
    'grew apart', 'betrayed', 'ghosted', 'toxic friendship',
    'one-sided', 'supportive', 'judgmental', 'jealous',
    'competitive', 'ride or die', 'always there for me'
  ],
  
  friendships_events: [
    'friend breakup', 'stopped talking', 'made up', 'apologized',
    'confronted', 'set boundaries', 'cut off', 'blocked'
  ],
  
  social_general: [
    'lonely', 'loneliness', 'isolated', 'no friends', 'hard to make friends',
    'social anxiety', 'introverted', 'extroverted', 'antisocial',
    'people pleaser', 'social battery', 'need alone time',
    'awkward', 'don\'t fit in', 'outsider', 'loner'
  ],

  support_system: [
    'no one to talk to', 'no one understands', 'alone in this',
    'feel alone', 'isolated', 'no friends', 'no support',
    'who do I call', 'burden', 'don\'t want to burden',
    'can\'t talk to anyone', 'no one I trust', 'keep to myself'
  ],

  community: [
    'community', 'belonging', 'don\'t belong', 'outsider',
    'don\'t fit in', 'finding my people', 'tribe', 'found my people',
    'support group', 'online community', 'church community'
  ],

  social_comparison: [
    'comparing', 'comparison', 'everyone else', 'behind in life',
    'falling behind', 'peers', 'friends are all', 'should be further',
    'jealous', 'envious', 'envy', 'FOMO', 'missing out',
    'left out', 'left behind', 'not invited', 'successful friends',
    'highlight reel', 'instagram', 'social media makes me'
  ],

  // ============================================
  // SECTION 5: PETS & ANIMALS
  // ============================================
  
  pets_types: [
    'dog', 'cat', 'puppy', 'kitten', 'pet', 'fur baby', 'furbaby',
    'bird', 'fish', 'hamster', 'guinea pig', 'rabbit', 'bunny',
    'reptile', 'snake', 'lizard', 'turtle', 'horse', 'ferret'
  ],
  
  pets_events: [
    'adopted', 'rescue', 'shelter', 'breeder', 'got a puppy',
    'vet', 'veterinarian', 'vet appointment', 'neutered', 'spayed',
    'put down', 'euthanized', 'passed away', 'rainbow bridge',
    'pet loss', 'grieving my', 'missing my'
  ],
  
  pets_care: [
    'walking', 'training', 'housebroken', 'potty trained',
    'separation anxiety', 'barking', 'scratching', 'shedding',
    'grooming', 'pet sitter', 'boarding', 'doggy daycare'
  ],

  // ============================================
  // SECTION 6: MENTAL HEALTH - PROVIDERS & TREATMENT
  // ============================================
  
  mental_health_providers: [
    'therapy', 'therapist', 'counselor', 'counseling', 'psychologist',
    'psychiatrist', 'mental health', 'psych', 'shrink',
    'social worker', 'LCSW', 'LPC', 'LMFT', 'psychotherapist',
    'life coach', 'support group', 'group therapy',
    'psychiatric nurse', 'PMHNP', 'mental health professional'
  ],

  // ============================================
  // SECTION 7: THERAPY TYPES & MODALITIES
  // ============================================

  therapy_talk_traditional: [
    'talk therapy', 'psychotherapy', 'psychoanalysis', 'psychoanalytic',
    'psychodynamic', 'insight-oriented', 'depth therapy',
    'Freudian', 'Jungian', 'Adlerian', 'object relations',
    'transference', 'countertransference', 'free association',
    'dream analysis', 'interpretation', 'unconscious'
  ],

  therapy_cbt_family: [
    'CBT', 'cognitive behavioral', 'cognitive therapy',
    'behavioral therapy', 'behavior modification',
    'thought records', 'cognitive restructuring', 'challenging thoughts',
    'automatic thoughts', 'core beliefs', 'intermediate beliefs',
    'behavioral experiments', 'behavioral activation',
    'exposure', 'exposure therapy', 'exposure and response prevention', 'ERP',
    'systematic desensitization', 'flooding', 'habituation'
  ],

  therapy_dbt: [
    'DBT', 'dialectical', 'dialectical behavior therapy',
    'distress tolerance', 'emotion regulation', 'interpersonal effectiveness',
    'mindfulness skills', 'TIPP', 'radical acceptance',
    'wise mind', 'emotional mind', 'rational mind',
    'opposite action', 'PLEASE skills', 'DEAR MAN', 'GIVE', 'FAST',
    'chain analysis', 'diary card', 'DBT skills group'
  ],

  therapy_act: [
    'ACT', 'acceptance and commitment', 'acceptance and commitment therapy',
    'psychological flexibility', 'cognitive defusion', 'defusion',
    'values clarification', 'committed action', 'self as context',
    'present moment', 'acceptance', 'willingness',
    'the choice point', 'away moves', 'toward moves',
    'hooks', 'getting hooked', 'unhooking'
  ],

  therapy_trauma_focused: [
    'EMDR', 'eye movement', 'bilateral stimulation', 'reprocessing',
    'trauma therapy', 'trauma-focused', 'trauma-informed',
    'CPT', 'cognitive processing therapy', 'PE', 'prolonged exposure',
    'trauma narrative', 'imaginal exposure', 'in vivo exposure',
    'somatic experiencing', 'SE', 'Peter Levine',
    'sensorimotor', 'sensorimotor psychotherapy',
    'brainspotting', 'neurofeedback', 'NARM',
    'internal family systems', 'IFS', 'parts work', 'protectors',
    'exiles', 'managers', 'firefighters', 'Self energy',
    'somatic', 'body-based', 'bottom-up', 'polyvagal',
    'window of tolerance', 'titration', 'pendulation'
  ],

  therapy_humanistic: [
    'humanistic', 'person-centered', 'client-centered', 'Rogerian',
    'unconditional positive regard', 'empathy', 'congruence', 'genuineness',
    'existential', 'existential therapy', 'Yalom', 'meaning-centered',
    'logotherapy', 'Frankl', 'search for meaning',
    'gestalt', 'gestalt therapy', 'Fritz Perls', 'empty chair',
    'here and now', 'awareness', 'unfinished business',
    'experiential', 'emotion-focused', 'EFT', 'focusing',
    'felt sense', 'Gendlin'
  ],

  therapy_relational: [
    'relational', 'relational therapy', 'interpersonal',
    'interpersonal therapy', 'IPT', 'attachment-based',
    'attachment therapy', 'attachment-focused',
    'mentalization', 'MBT', 'mentalization-based',
    'transactional analysis', 'TA', 'ego states',
    'parent ego state', 'adult ego state', 'child ego state',
    'imago', 'imago therapy', 'EFT for couples',
    'emotionally focused therapy', 'Sue Johnson', 'attachment injuries',
    'Gottman', 'Gottman method', 'four horsemen', 'repair attempts'
  ],

  therapy_family_systems: [
    'family therapy', 'family systems', 'systems theory',
    'structural family therapy', 'strategic family therapy',
    'Bowenian', 'Bowen', 'differentiation', 'triangulation',
    'genogram', 'multigenerational', 'family of origin',
    'narrative therapy', 'narrative', 'externalization',
    'solution-focused', 'SFBT', 'miracle question', 'scaling questions',
    'exceptions', 'strengths-based', 'brief therapy'
  ],

  therapy_mindfulness_based: [
    'MBSR', 'mindfulness-based stress reduction', 'Kabat-Zinn',
    'MBCT', 'mindfulness-based cognitive therapy',
    'mindfulness', 'meditation', 'mindful', 'present moment',
    'body scan', 'breath awareness', 'loving-kindness', 'metta',
    'compassion-focused', 'CFT', 'compassionate mind training',
    'self-compassion', 'Kristin Neff', 'MSC',
    'mindful self-compassion'
  ],

  therapy_creative_expressive: [
    'art therapy', 'music therapy', 'drama therapy', 'dance therapy',
    'movement therapy', 'dance/movement therapy', 'DMT',
    'play therapy', 'sand tray', 'sandplay',
    'expressive arts', 'creative arts therapy',
    'bibliotherapy', 'poetry therapy', 'journal therapy',
    'psychodrama', 'Moreno', 'role play'
  ],

  therapy_body_based: [
    'somatic', 'body-based', 'body psychotherapy', 'body-oriented',
    'somatic experiencing', 'SE', 'sensorimotor',
    'Hakomi', 'bioenergetics', 'Reichian',
    'craniosacral', 'myofascial release', 'trauma release exercises', 'TRE',
    'yoga therapy', 'trauma-sensitive yoga', 'breathwork',
    'holotropic', 'rebirthing'
  ],

  therapy_specialized: [
    'schema therapy', 'schema', 'early maladaptive schemas',
    'limited reparenting', 'mode work',
    'CBASP', 'cognitive behavioral analysis system',
    'MCT', 'metacognitive therapy', 'metacognition',
    'RO-DBT', 'radically open DBT', 'overcontrol',
    'STEPPS', 'emotion regulation', 'STAIR',
    'seeking safety', 'DBT-PE'
  ],

  therapy_child_adolescent: [
    'play therapy', 'child therapy', 'adolescent therapy',
    'parent-child interaction therapy', 'PCIT',
    'child-parent psychotherapy', 'CPP',
    'TF-CBT', 'trauma-focused CBT',
    'filial therapy', 'Theraplay',
    'teen therapy', 'family therapy'
  ],

  therapy_group: [
    'group therapy', 'process group', 'support group',
    'psychoeducation group', 'skills group', 'DBT group',
    'therapy group', 'group work', 'group dynamics',
    'interpersonal group', 'Yalom', 'here-and-now'
  ],

  therapy_other_modalities: [
    'hypnotherapy', 'hypnosis', 'clinical hypnosis',
    'AEDP', 'accelerated experiential dynamic psychotherapy',
    'coherence therapy', 'memory reconsolidation',
    'ego state therapy', 'energy psychology', 'EFT tapping',
    'Havening', 'NLP', 'neuro-linguistic programming',
    'reality therapy', 'choice theory', 'Glasser',
    'motivational interviewing', 'MI', 'stages of change',
    'harm reduction', 'motivational enhancement'
  ],

  therapy_assessment: [
    'intake', 'assessment', 'evaluation', 'diagnosis',
    'psychological testing', 'neuropsych', 'neuropsychological',
    'personality assessment', 'MMPI', 'Rorschach',
    'IQ testing', 'cognitive testing', 'symptom measures'
  ],

  therapy_concepts: [
    'therapeutic alliance', 'rapport', 'working alliance',
    'termination', 'ending therapy', 'discharge',
    'treatment plan', 'treatment goals', 'progress',
    'homework', 'between-session', 'practice',
    'session', 'appointment', 'weekly', 'biweekly',
    'sliding scale', 'out of pocket', 'insurance',
    'telehealth', 'teletherapy', 'online therapy', 'virtual',
    'in-person', 'hybrid'
  ],

  therapy_progress: [
    'breakthrough', 'progress', 'making progress', 'getting better',
    'turning point', 'lightbulb moment', 'aha moment',
    'setback', 'plateau', 'stuck in therapy', 'not working',
    'changing therapists', 'new therapist', 'fit', 'good fit',
    'therapy isn\'t helping', 'therapy is helping'
  ],

  // ============================================
  // SECTION 8: MENTAL HEALTH - CONDITIONS
  // ============================================
  
  mental_health_general_states: [
    'struggling', 'overwhelmed', 'burnt out', 'burnout',
    'stressed', 'anxious', 'depressed', 'numb', 'empty',
    'hopeless', 'helpless', 'stuck', 'lost', 'confused',
    'frustrated', 'angry', 'resentful', 'bitter', 'exhausted',
    'drained', 'depleted', 'running on empty'
  ],

  conditions_mood: [
    'depression', 'depressed', 'major depressive', 'MDD',
    'bipolar', 'bipolar disorder', 'manic', 'mania', 'hypomania',
    'mood disorder', 'dysthymia', 'persistent depressive',
    'seasonal depression', 'SAD', 'postpartum depression', 'PPD',
    'premenstrual dysphoric', 'PMDD', 'mood swings', 'cycling'
  ],
  
  conditions_anxiety: [
    'anxiety', 'anxious', 'generalized anxiety', 'GAD',
    'panic attack', 'panic disorder', 'agoraphobia',
    'social anxiety', 'phobia', 'health anxiety', 'hypochondria',
    'separation anxiety', 'performance anxiety', 'test anxiety',
    'anticipatory anxiety', 'free-floating anxiety'
  ],
  
  conditions_trauma: [
    'PTSD', 'post-traumatic', 'trauma', 'traumatic', 'C-PTSD',
    'complex trauma', 'developmental trauma', 'triggered',
    'flashback', 'hypervigilance', 'dissociation', 'dissociating',
    'nightmare', 'night terror', 'startle response', 'hyperarousal'
  ],
  
  conditions_ocd_related: [
    'OCD', 'obsessive compulsive', 'intrusive thoughts',
    'compulsions', 'rituals', 'contamination', 'checking',
    'pure O', 'harm OCD', 'relationship OCD', 'ROCD',
    'symmetry', 'just right', 'scrupulosity', 'hoarding'
  ],
  
  conditions_eating: [
    'eating disorder', 'ED', 'anorexia', 'bulimia', 'binge eating',
    'BED', 'ARFID', 'orthorexia', 'restricting', 'purging',
    'body dysmorphia', 'BDD', 'disordered eating',
    'recovery', 'in recovery', 'ED recovery', 'relapse'
  ],
  
  conditions_personality: [
    'BPD', 'borderline', 'NPD', 'narcissistic', 'ASPD',
    'personality disorder', 'avoidant personality', 'dependent',
    'splitting', 'favorite person', 'FP', 'abandonment',
    'identity disturbance', 'emptiness', 'unstable relationships'
  ],
  
  conditions_other: [
    'psychosis', 'schizophrenia', 'schizoaffective', 'delusions',
    'hallucinations', 'hearing voices', 'paranoia', 'paranoid',
    'derealization', 'depersonalization', 'DPDR'
  ],

  // ============================================
  // SECTION 9: MENTAL HEALTH - SYMPTOMS
  // ============================================
  
  symptoms_depression: [
    'can\'t get out of bed', 'no motivation', 'no energy',
    'sleeping all day', 'can\'t sleep', 'insomnia', 'hypersomnia',
    'lost interest', 'anhedonia', 'nothing feels good',
    'worthless', 'guilty', 'self-loathing', 'hate myself',
    'can\'t concentrate', 'brain fog', 'forgetful',
    'appetite changes', 'weight changes', 'crying spells'
  ],
  
  symptoms_anxiety: [
    'racing thoughts', 'can\'t stop thinking', 'overthinking',
    'catastrophizing', 'worst case scenario', 'what if',
    'heart racing', 'chest tight', 'can\'t breathe',
    'shaking', 'sweating', 'dizzy', 'nauseous',
    'on edge', 'restless', 'can\'t relax', 'keyed up',
    'muscle tension', 'headaches', 'stomach issues'
  ],
  
  symptoms_crisis: [
    'breakdown', 'mental breakdown', 'crisis', 'spiraling',
    'rock bottom', 'falling apart', 'can\'t cope', 'can\'t function',
    'called in sick', 'couldn\'t go to work', 'hospitalized',
    'inpatient', 'outpatient', 'PHP', 'IOP', 'intensive outpatient',
    'partial hospitalization', 'residential', 'crisis stabilization'
  ],

  // ============================================
  // SECTION 10: MEDICATIONS
  // ============================================
  
  medications_general: [
    'medication', 'meds', 'prescribed', 'prescription',
    'dosage', 'dose', 'increased dose', 'decreased dose',
    'tapering', 'weaning off', 'withdrawal', 'side effects',
    'not working', 'started taking', 'stopped taking',
    'med check', 'medication management', 'refill'
  ],
  
  medications_antidepressants: [
    'antidepressant', 'SSRI', 'SNRI', 'MAOI', 'tricyclic', 'TCA',
    'Lexapro', 'escitalopram', 'Zoloft', 'sertraline',
    'Prozac', 'fluoxetine', 'Paxil', 'paroxetine',
    'Celexa', 'citalopram', 'Effexor', 'venlafaxine',
    'Cymbalta', 'duloxetine', 'Wellbutrin', 'bupropion',
    'Trintellix', 'Viibryd', 'Remeron', 'mirtazapine',
    'Pristiq', 'desvenlafaxine', 'Fetzima', 'Spravato', 'ketamine'
  ],
  
  medications_anxiety: [
    'Xanax', 'alprazolam', 'Klonopin', 'clonazepam',
    'Ativan', 'lorazepam', 'Valium', 'diazepam',
    'benzodiazepine', 'benzo', 'Buspar', 'buspirone',
    'hydroxyzine', 'Vistaril', 'propranolol', 'beta blocker',
    'gabapentin', 'Neurontin', 'pregabalin', 'Lyrica'
  ],
  
  medications_mood_stabilizers: [
    'mood stabilizer', 'Lithium', 'Lamictal', 'lamotrigine',
    'Depakote', 'valproic acid', 'Tegretol', 'carbamazepine',
    'Trileptal', 'oxcarbazepine', 'lithium level', 'blood work'
  ],
  
  medications_antipsychotics: [
    'antipsychotic', 'Abilify', 'aripiprazole', 'Seroquel', 'quetiapine',
    'Risperdal', 'risperidone', 'Zyprexa', 'olanzapine',
    'Latuda', 'lurasidone', 'Vraylar', 'cariprazine',
    'Geodon', 'ziprasidone', 'Invega', 'paliperidone',
    'Rexulti', 'brexpiprazole', 'Caplyta', 'atypical'
  ],
  
  medications_adhd: [
    'Adderall', 'amphetamine', 'Vyvanse', 'lisdexamfetamine',
    'Ritalin', 'methylphenidate', 'Concerta', 'Focalin',
    'Strattera', 'atomoxetine', 'stimulant', 'non-stimulant',
    'Qelbree', 'Mydayis', 'Dexedrine', 'Azstarys'
  ],
  
  medications_sleep: [
    'sleep aid', 'Ambien', 'zolpidem', 'Lunesta', 'eszopiclone',
    'trazodone', 'melatonin', 'Benadryl', 'diphenhydramine',
    'Sonata', 'zaleplon', 'Rozerem', 'Silenor', 'doxepin'
  ],

  // ============================================
  // SECTION 11: SELF-HARM & SUICIDE (HANDLE WITH CARE)
  // ============================================
  
  self_harm: [
    'self-harm', 'self harm', 'cutting', 'cut myself',
    'hurting myself', 'hurt myself', 'burning', 'scratching',
    'hitting myself', 'punching walls', 'head banging',
    'scars', 'urges', 'clean', 'relapsed', 'NSSI',
    'self-injury', 'self-injurious'
  ],
  
  suicidal: [
    'suicidal', 'suicide', 'kill myself', 'end my life',
    'don\'t want to be here', 'want to die', 'wish I was dead',
    'not worth living', 'no point', 'better off without me',
    'suicidal ideation', 'SI', 'passive suicidal', 'active suicidal',
    'plan', 'attempt', 'survived', 'hospitalized for',
    'overdose', 'OD', 'means restriction'
  ],
  
  crisis_resources: [
    'hotline', 'crisis line', '988', 'crisis text line',
    'emergency', 'ER', 'psych ward', 'psychiatric hospital',
    'safety plan', 'wellness check', 'crisis intervention',
    'mobile crisis', 'crisis team', 'voluntary', 'involuntary'
  ],

  // ============================================
  // SECTION 12: ADDICTION & RECOVERY
  // ============================================
  
  addiction_substances: [
    'addiction', 'addicted', 'addict', 'substance abuse', 'SUD',
    'alcoholic', 'alcoholism', 'drinking', 'drunk', 'alcohol use disorder',
    'drug', 'drugs', 'using', 'high', 'wasted',
    'opioid', 'heroin', 'fentanyl', 'pills', 'painkillers',
    'cocaine', 'meth', 'weed', 'marijuana', 'cannabis',
    'prescription drug', 'benzodiazepine', 'stimulant abuse'
  ],
  
  addiction_behavioral: [
    'gambling', 'gambling addiction', 'porn addiction',
    'sex addiction', 'shopping addiction', 'gaming addiction',
    'internet addiction', 'social media addiction',
    'compulsive', 'can\'t stop', 'process addiction',
    'work addiction', 'workaholism', 'exercise addiction'
  ],
  
  recovery_general: [
    'sober', 'sobriety', 'clean', 'recovery', 'recovering',
    'in recovery', 'days sober', 'months sober', 'years sober',
    'sobriety date', 'clean date', 'anniversary', 'sober curious'
  ],
  
  recovery_programs: [
    'AA', 'Alcoholics Anonymous', 'NA', 'Narcotics Anonymous',
    'Al-Anon', 'SMART Recovery', '12 step', 'twelve step',
    'sponsor', 'sponsee', 'meeting', 'meetings', 'home group',
    'chips', 'coins', 'medallion', 'step work', 'big book',
    'Celebrate Recovery', 'Refuge Recovery', 'LifeRing',
    'MAT', 'medication-assisted treatment', 'Suboxone', 'methadone',
    'vivitrol', 'naltrexone'
  ],
  
  recovery_events: [
    'relapse', 'relapsed', 'slip', 'slipped', 'fell off the wagon',
    'detox', 'withdrawal', 'withdrawing', 'rehab', 'treatment',
    'inpatient treatment', 'outpatient treatment', 'sober house',
    'halfway house', 'intervention', 'rock bottom'
  ],

  // ============================================
  // SECTION 13: TRAUMA & ABUSE
  // ============================================
  
  trauma_types: [
    'trauma', 'traumatic', 'traumatized', 'PTSD', 'C-PTSD',
    'childhood trauma', 'developmental trauma', 'complex trauma',
    'intergenerational trauma', 'generational trauma',
    'medical trauma', 'birth trauma', 'war trauma',
    'attachment trauma', 'relational trauma', 'betrayal trauma',
    'ACEs', 'adverse childhood experiences', 'big T trauma', 'little t trauma'
  ],
  
  abuse_types: [
    'abuse', 'abused', 'abusive', 'domestic violence', 'DV',
    'physical abuse', 'emotional abuse', 'psychological abuse',
    'verbal abuse', 'sexual abuse', 'financial abuse',
    'neglect', 'neglected', 'abandonment', 'abandoned',
    'spiritual abuse', 'religious abuse', 'institutional abuse'
  ],
  
  abuse_relationships: [
    'abusive relationship', 'abusive partner', 'narcissistic abuse',
    'gaslighting', 'gaslit', 'manipulation', 'manipulated',
    'controlling', 'coercive control', 'love bombing',
    'isolation', 'isolated me', 'threatened', 'intimidation',
    'cycle of abuse', 'trauma bond', 'Stockholm syndrome'
  ],
  
  abuse_recovery: [
    'survivor', 'victim', 'escaped', 'left', 'got out',
    'restraining order', 'protective order', 'shelter',
    'safe house', 'safe now', 'healing', 'recovering',
    'domestic violence advocate', 'DV shelter'
  ],
  
  sexual_trauma: [
    'assault', 'sexual assault', 'SA', 'rape', 'raped',
    'molested', 'molestation', 'harassment', 'harassed',
    'consent', 'non-consensual', 'coerced', 'pressured',
    '#MeToo', 'speaking out', 'came forward', 'grooming', 'groomed'
  ],

  // ============================================
  // SECTION 14: COGNITIVE & EMOTIONAL PATTERNS
  // ============================================

  attachment_styles: [
    'anxious attachment', 'avoidant', 'avoidant attachment',
    'disorganized', 'disorganized attachment', 'secure attachment',
    'codependent', 'codependency', 'enmeshed', 'fear of abandonment',
    'fear of intimacy', 'push-pull', 'hot and cold', 'clingy',
    'distant', 'emotionally unavailable', 'commitment issues',
    'attachment wound', 'attachment trauma', 'attachment style'
  ],

  boundaries: [
    'boundary', 'boundaries', 'setting boundaries', 'can\'t say no',
    'people pleaser', 'people pleasing', 'doormat', 'pushover',
    'taken advantage of', 'overcommitted', 'overextended',
    'boundary violation', 'crossed a line', 'disrespected',
    'need space', 'need distance', 'cutting off', 'going no contact',
    'porous boundaries', 'rigid boundaries', 'healthy boundaries'
  ],

  inner_critic: [
    'inner critic', 'negative self-talk', 'voice in my head',
    'beating myself up', 'too hard on myself', 'self-critical',
    'never good enough', 'imposter', 'imposter syndrome', 'fraud',
    'don\'t deserve', 'not worthy', 'self-sabotage', 'self-sabotaging',
    'my own worst enemy', 'hate myself', 'disgusted with myself'
  ],

  self_compassion: [
    'self-compassion', 'kind to myself', 'inner child',
    'inner child work', 'reparenting', 'self-love', 'self-acceptance',
    'learning to love myself', 'forgiving myself', 'grace',
    'gentle with myself', 'self-care', 'self-worth'
  ],

  perfectionism: [
    'perfectionist', 'perfectionism', 'never good enough',
    'high standards', 'impossible standards', 'all or nothing',
    'black and white thinking', 'paralyzed', 'can\'t start',
    'fear of failure', 'fear of making mistakes', 'procrastinating',
    'avoiding', 'analysis paralysis', 'maladaptive perfectionism'
  ],

  shame_guilt: [
    'shame', 'ashamed', 'shameful', 'guilt', 'guilty', 'feel bad about',
    'embarrassed', 'humiliated', 'mortified', 'regret', 'remorse',
    'can\'t forgive myself', 'live with myself', 'what I did',
    'haunted by', 'secret', 'hiding', 'no one knows',
    'toxic shame', 'core shame'
  ],

  anger: [
    'angry', 'anger', 'furious', 'rage', 'enraged', 'livid',
    'pissed', 'irritated', 'annoyed', 'frustrated', 'resentful',
    'resentment', 'bitter', 'bitterness', 'grudge', 'holding onto',
    'can\'t let go', 'unforgivable', 'betrayed'
  ],

  anger_expression: [
    'blow up', 'explode', 'lost my temper', 'snapped',
    'said things I regret', 'passive aggressive', 'silent treatment',
    'shut down', 'suppress', 'bottle up', 'stuff it down',
    'anger issues', 'rage quit', 'punched', 'threw'
  ],

  control_issues: [
    'control', 'controlling', 'need to control', 'out of control',
    'spiraling', 'helpless', 'powerless', 'no control over',
    'micromanage', 'type A', 'rigid', 'inflexible',
    'can\'t handle uncertainty', 'need to know', 'worst case'
  ],

  uncertainty_change: [
    'uncertainty', 'unknown', 'unpredictable', 'change',
    'transition', 'limbo', 'in between', 'waiting',
    'don\'t know what\'s next', 'crossroads', 'fork in the road',
    'major decision', 'life-changing', 'point of no return'
  ],

  cognitive_distortions: [
    'catastrophizing', 'worst case scenario', 'what if',
    'all or nothing', 'black and white', 'always', 'never',
    'mind reading', 'assuming', 'jumping to conclusions',
    'fortune telling', 'should', 'must', 'have to',
    'labeling', 'overgeneralizing', 'filtering', 'discounting',
    'personalizing', 'blaming', 'emotional reasoning',
    'magnifying', 'minimizing'
  ],

  rumination: [
    'ruminating', 'rumination', 'can\'t stop thinking',
    'replay', 'replaying', 'over and over', 'stuck in my head',
    'overthinking', 'overanalyzing', 'obsessing', 'fixated',
    'dwelling', 'can\'t let go', 'what if I had', 'should have',
    'why did I', 'keep going back to'
  ],

  // ============================================
  // SECTION 15: WORK & CAREER
  // ============================================
  
  work_general: [
    'job', 'work', 'career', 'profession', 'occupation',
    'employer', 'company', 'office', 'workplace', 'remote',
    'work from home', 'WFH', 'hybrid', 'in-office',
    'full-time', 'part-time', 'freelance', 'self-employed',
    'entrepreneur', 'business owner', 'startup', 'gig work'
  ],
  
  work_people: [
    'boss', 'manager', 'supervisor', 'coworker', 'colleague',
    'team', 'direct report', 'employee', 'intern',
    'mentor', 'mentee', 'client', 'customer', 'stakeholder'
  ],
  
  work_positive: [
    'promotion', 'promoted', 'raise', 'bonus', 'recognition',
    'praise', 'achievement', 'accomplished', 'successful',
    'dream job', 'love my job', 'great opportunity',
    'new job', 'job offer', 'accepted offer', 'starting new role'
  ],
  
  work_negative: [
    'fired', 'terminated', 'laid off', 'layoff', 'downsized',
    'quit', 'resigned', 'gave notice', 'two weeks notice',
    'unemployed', 'job hunting', 'job search', 'rejected',
    'passed over', 'didn\'t get the job', 'furloughed'
  ],
  
  work_stress: [
    'burnout', 'burnt out', 'overworked', 'overwhelmed',
    'toxic workplace', 'toxic boss', 'micromanaged',
    'undervalued', 'underpaid', 'exploited', 'taken advantage of',
    'work-life balance', 'no boundaries', 'always on',
    'Sunday scaries', 'dreading Monday', 'hate my job',
    'quiet quitting', 'bare minimum'
  ],
  
  work_events: [
    'interview', 'interviewing', 'performance review',
    'PIP', 'performance improvement', 'written up',
    'meeting', 'presentation', 'deadline', 'project',
    'conference', 'business trip', 'training'
  ],

  imposter_professional: [
    'imposter syndrome', 'don\'t belong here', 'found out',
    'fraud', 'fake it', 'luck', 'fluke', 'not qualified',
    'over my head', 'out of my league', 'token'
  ],

  // ============================================
  // SECTION 16: EDUCATION
  // ============================================
  
  education_general: [
    'school', 'college', 'university', 'grad school',
    'degree', 'major', 'minor', 'GPA', 'credits',
    'student', 'studying', 'coursework', 'homework',
    'class', 'classes', 'lecture', 'seminar'
  ],
  
  education_levels: [
    'high school', 'undergraduate', 'bachelor\'s', 'master\'s',
    'PhD', 'doctorate', 'postdoc', 'MBA', 'law school',
    'med school', 'nursing school', 'trade school',
    'community college', 'online degree', 'certification'
  ],
  
  education_events: [
    'graduating', 'graduation', 'graduated', 'diploma',
    'enrolled', 'dropped out', 'taking a break', 'gap year',
    'applying', 'application', 'accepted', 'rejected',
    'scholarship', 'financial aid', 'student loans',
    'exam', 'test', 'finals', 'midterms', 'thesis', 'dissertation'
  ],
  
  education_people: [
    'professor', 'teacher', 'instructor', 'advisor',
    'classmate', 'roommate', 'study group', 'tutor'
  ],

  // ============================================
  // SECTION 17: FINANCES
  // ============================================
  
  finances_general: [
    'money', 'financial', 'finances', 'budget', 'budgeting',
    'income', 'expenses', 'bills', 'payments'
  ],
  
  finances_positive: [
    'savings', 'saved', 'saving', 'emergency fund',
    'investment', 'investing', 'portfolio', 'retirement',
    '401k', 'IRA', 'stocks', 'bonds', 'real estate',
    'raise', 'bonus', 'windfall', 'inheritance',
    'paid off', 'debt free', 'financial freedom'
  ],
  
  finances_negative: [
    'debt', 'in debt', 'credit card debt', 'student loans',
    'loan', 'mortgage', 'behind on payments', 'collections',
    'bankruptcy', 'foreclosure', 'eviction', 'evicted',
    'broke', 'struggling financially', 'paycheck to paycheck',
    'can\'t afford', 'overdraft', 'bounced check'
  ],
  
  finances_events: [
    'bought a house', 'bought a car', 'major purchase',
    'tax refund', 'tax season', 'owe taxes',
    'got a loan', 'refinanced', 'consolidated debt'
  ],

  // ============================================
  // SECTION 18: HOUSING & LIVING
  // ============================================
  
  housing_general: [
    'home', 'house', 'apartment', 'condo', 'townhouse',
    'rent', 'renting', 'lease', 'landlord', 'tenant',
    'own', 'homeowner', 'mortgage', 'property'
  ],
  
  housing_living: [
    'live alone', 'living alone', 'roommate', 'roommates',
    'living with', 'moved in with', 'living at home',
    'with my parents', 'couch surfing', 'homeless',
    'housing insecurity', 'shelter', 'unhoused'
  ],
  
  housing_events: [
    'moving', 'moved', 'relocating', 'relocation',
    'buying a house', 'house hunting', 'closing',
    'renovating', 'renovation', 'remodeling',
    'downsizing', 'upsizing', 'first home'
  ],

  // ============================================
  // SECTION 19: PHYSICAL HEALTH
  // ============================================
  
  health_general: [
    'health', 'healthy', 'unhealthy', 'sick', 'illness',
    'condition', 'diagnosis', 'diagnosed', 'symptoms',
    'chronic', 'acute', 'flare', 'flare-up', 'remission'
  ],
  
  health_providers: [
    'doctor', 'physician', 'specialist', 'surgeon',
    'nurse', 'nurse practitioner', 'PA', 'physician assistant',
    'physical therapist', 'PT', 'occupational therapist', 'OT',
    'chiropractor', 'acupuncturist', 'naturopath'
  ],
  
  health_conditions_chronic: [
    'diabetes', 'diabetic', 'hypertension', 'high blood pressure',
    'heart disease', 'heart condition', 'asthma', 'COPD',
    'arthritis', 'lupus', 'MS', 'multiple sclerosis',
    'fibromyalgia', 'chronic fatigue', 'CFS', 'ME/CFS',
    'Crohn\'s', 'colitis', 'IBS', 'IBD', 'celiac',
    'thyroid', 'hypothyroid', 'hyperthyroid', 'Hashimoto\'s',
    'autoimmune', 'chronic pain', 'migraine', 'migraines',
    'Lyme', 'EDS', 'POTS', 'dysautonomia'
  ],
  
  health_conditions_serious: [
    'cancer', 'tumor', 'oncologist', 'chemotherapy', 'chemo',
    'radiation', 'remission', 'stage', 'metastatic', 'terminal',
    'stroke', 'heart attack', 'aneurysm', 'seizure', 'epilepsy'
  ],
  
  health_reproductive: [
    'pregnant', 'pregnancy', 'expecting', 'due date',
    'trimester', 'prenatal', 'OB', 'obstetrician', 'midwife',
    'miscarriage', 'stillbirth', 'loss', 'fertility',
    'infertility', 'IVF', 'IUI', 'trying to conceive', 'TTC',
    'PCOS', 'endometriosis', 'endo', 'period', 'menstrual',
    'menopause', 'perimenopause', 'hysterectomy'
  ],
  
  health_events: [
    'surgery', 'operation', 'procedure', 'hospital',
    'hospitalized', 'ER', 'emergency room', 'urgent care',
    'appointment', 'checkup', 'test results', 'biopsy',
    'MRI', 'CT scan', 'X-ray', 'ultrasound', 'blood work'
  ],
  
  health_pain: [
    'pain', 'hurts', 'ache', 'sore', 'stiff', 'tender',
    'sharp pain', 'dull ache', 'throbbing', 'shooting pain',
    'back pain', 'neck pain', 'headache', 'joint pain'
  ],
  
  health_disability: [
    'disability', 'disabled', 'handicapped', 'accessible',
    'wheelchair', 'mobility', 'chronic illness', 'spoonie',
    'invisible illness', 'accommodations', 'ADA',
    'mobility aid', 'service animal', 'adaptive'
  ],

  // ============================================
  // SECTION 20: SLEEP
  // ============================================
  
  sleep_problems: [
    'insomnia', 'can\'t sleep', 'trouble sleeping', 'sleepless',
    'waking up', 'can\'t stay asleep', 'restless',
    'nightmares', 'night terrors', 'sleep paralysis',
    'sleep apnea', 'snoring', 'CPAP',
    'oversleeping', 'hypersomnia', 'sleeping too much',
    'exhausted', 'tired', 'fatigue', 'fatigued'
  ],
  
  sleep_patterns: [
    'sleep schedule', 'circadian rhythm', 'night owl',
    'early bird', 'morning person', 'nap', 'napping',
    'sleep hygiene', 'bedtime routine', 'sleep debt'
  ],

  // ============================================
  // SECTION 21: FITNESS & BODY
  // ============================================
  
  fitness_general: [
    'exercise', 'workout', 'working out', 'gym', 'fitness',
    'active', 'sedentary', 'couch potato', 'getting in shape'
  ],
  
  fitness_types: [
    'running', 'jogging', 'walking', 'hiking', 'cycling',
    'swimming', 'yoga', 'pilates', 'weightlifting', 'weights',
    'CrossFit', 'HIIT', 'cardio', 'strength training',
    'martial arts', 'dance', 'sports', 'team sports'
  ],
  
  fitness_events: [
    'marathon', 'half marathon', '5K', '10K', 'race',
    'competition', 'personal best', 'PR', 'goal',
    'starting to exercise', 'getting back into', 'injury'
  ],

  diet_general: [
    'diet', 'dieting', 'eating', 'food', 'nutrition',
    'meal', 'meals', 'cooking', 'meal prep'
  ],
  
  diet_types: [
    'vegan', 'vegetarian', 'pescatarian', 'keto', 'paleo',
    'gluten-free', 'dairy-free', 'low carb', 'intermittent fasting',
    'calorie counting', 'macros', 'clean eating', 'whole30'
  ],
  
  diet_issues: [
    'overeating', 'undereating', 'binge', 'bingeing',
    'emotional eating', 'stress eating', 'comfort food',
    'food relationship', 'intuitive eating', 'mindful eating',
    'food guilt', 'food anxiety', 'fear foods'
  ],
  
  body_image: [
    'weight', 'weight loss', 'weight gain', 'losing weight',
    'gaining weight', 'body image', 'body positive',
    'self-conscious', 'insecure', 'confident', 'body neutrality'
  ],

  // ============================================
  // SECTION 22: INTIMACY & SEXUALITY
  // ============================================

  intimacy: [
    'intimacy', 'intimate', 'closeness', 'emotional intimacy',
    'physical intimacy', 'affection', 'touch', 'connection',
    'disconnected', 'roommates', 'no spark', 'passion',
    'vulnerability', 'walls up', 'let people in', 'trust issues'
  ],

  sexual_health: [
    'libido', 'sex drive', 'no desire', 'sexual dysfunction',
    'ED', 'erectile', 'performance anxiety', 'painful sex',
    'vaginismus', 'desire discrepancy', 'mismatched',
    'asexual', 'exploring', 'kink', 'shame around sex'
  ],

  // ============================================
  // SECTION 23: SPIRITUALITY & RELIGION
  // ============================================
  
  religion_general: [
    'religious', 'religion', 'faith', 'belief', 'believe',
    'spiritual', 'spirituality', 'soul', 'higher power',
    'god', 'God', 'atheist', 'agnostic', 'secular'
  ],
  
  religion_practices: [
    'pray', 'prayer', 'praying', 'worship', 'service',
    'church', 'temple', 'mosque', 'synagogue', 'congregation',
    'meditation', 'meditate', 'mindfulness', 'contemplation',
    'scripture', 'bible', 'quran', 'torah', 'study'
  ],
  
  religion_traditions: [
    'Christian', 'Catholic', 'Protestant', 'Baptist', 'Methodist',
    'Jewish', 'Muslim', 'Islamic', 'Hindu', 'Buddhist',
    'Sikh', 'Mormon', 'LDS', 'Jehovah\'s Witness',
    'evangelical', 'orthodox', 'reformed'
  ],
  
  religion_events: [
    'baptism', 'baptized', 'confirmation', 'bar mitzvah', 'bat mitzvah',
    'converted', 'conversion', 'leaving the church', 'deconstructing',
    'faith crisis', 'lost my faith', 'found faith', 'born again',
    'religious trauma', 'church hurt', 'spiritual abuse'
  ],
  
  spirituality_practices: [
    'yoga', 'chakra', 'energy', 'manifestation', 'manifesting',
    'crystals', 'tarot', 'astrology', 'horoscope',
    'reiki', 'healing', 'psychic', 'intuition',
    'universe', 'gratitude', 'journaling', 'spiritual bypassing'
  ],

  // ============================================
  // SECTION 24: LEGAL
  // ============================================
  
  legal_general: [
    'lawyer', 'attorney', 'legal', 'law', 'court',
    'judge', 'jury', 'trial', 'hearing', 'case'
  ],
  
  legal_civil: [
    'lawsuit', 'suing', 'sued', 'settlement', 'damages',
    'liability', 'negligence', 'malpractice', 'dispute',
    'mediation', 'arbitration', 'civil court'
  ],
  
  legal_criminal: [
    'arrested', 'arrest', 'charged', 'charges', 'crime',
    'criminal', 'felony', 'misdemeanor', 'conviction',
    'sentence', 'probation', 'parole', 'jail', 'prison',
    'bail', 'plea', 'plea deal', 'innocent', 'guilty'
  ],
  
  legal_family: [
    'divorce', 'custody', 'child custody', 'visitation',
    'child support', 'alimony', 'spousal support',
    'prenup', 'prenuptial', 'adoption', 'guardianship',
    'restraining order', 'protective order', 'DV court'
  ],
  
  legal_immigration: [
    'immigration', 'visa', 'green card', 'citizenship',
    'naturalization', 'asylum', 'deportation', 'USCIS',
    'immigration lawyer', 'status', 'undocumented'
  ],

  // ============================================
  // SECTION 25: DEATH & GRIEF
  // ============================================
  
  death_events: [
    'died', 'death', 'passed away', 'passing', 'lost',
    'gone', 'no longer with us', 'in heaven',
    'funeral', 'memorial', 'celebration of life',
    'burial', 'cremation', 'ashes', 'cemetery', 'grave'
  ],
  
  death_causes: [
    'cancer', 'heart attack', 'stroke', 'accident',
    'overdose', 'suicide', 'illness', 'old age',
    'suddenly', 'unexpected', 'after a long battle',
    'complications', 'COVID'
  ],
  
  grief_process: [
    'grief', 'grieving', 'mourning', 'bereavement',
    'loss', 'missing', 'anniversary of death',
    'first without', 'holidays without', 'birthday without',
    'still processing', 'waves of grief', 'grief counseling',
    'complicated grief', 'prolonged grief', 'anticipatory grief'
  ],
  
  grief_stages: [
    'denial', 'anger', 'bargaining', 'depression', 'acceptance',
    'shock', 'numb', 'disbelief', 'devastated', 'heartbroken'
  ],

  // ============================================
  // SECTION 26: PARENTING
  // ============================================

  parenting_challenges: [
    'postpartum', 'PPD', 'PPA', 'postpartum anxiety',
    'baby blues', 'bonding', 'not bonding', 'breastfeeding',
    'sleep deprivation', 'colicky', 'tantrums', 'terrible twos',
    'defiant', 'behavioral issues', 'special needs', 'autism parent',
    'ADHD child', 'IEP', '504', 'school issues', 'bullied',
    'sensory issues', 'developmental delay', 'speech delay'
  ],

  parenting_dynamics: [
    'single parent', 'single mom', 'single dad', 'co-parenting',
    'custody battle', 'ex won\'t', 'parenting styles',
    'discipline', 'screen time', 'helicopter', 'permissive',
    'authoritarian', 'gentle parenting', 'mom guilt', 'dad guilt',
    'work-life balance', 'missing milestones', 'quality time',
    'blended family', 'step-parenting'
  ],

  // ============================================
  // SECTION 27: CAREGIVING
  // ============================================

  caregiving: [
    'caregiver', 'caregiving', 'caring for', 'taking care of',
    'aging parent', 'elderly', 'dementia', 'Alzheimer\'s',
    'nursing home', 'assisted living', 'home care', 'hospice',
    'sandwich generation', 'caregiver burnout', 'caregiver fatigue',
    'can\'t do it all', 'no time for myself', 'resentful',
    'feel guilty', 'duty', 'obligation', 'responsibility',
    'respite', 'respite care'
  ],

  // ============================================
  // SECTION 28: EXISTENTIAL & MEANING
  // ============================================

  existential: [
    'meaning', 'meaningless', 'purpose', 'purposeless',
    'what\'s the point', 'why bother', 'existential',
    'crisis of meaning', 'quarter-life crisis', 'midlife crisis',
    'who am I', 'don\'t know who I am', 'lost myself',
    'identity crisis', 'not who I used to be', 'reinventing',
    'existential dread', 'mortality', 'death anxiety'
  ],

  values: [
    'values', 'what matters', 'priorities', 'authentic',
    'true to myself', 'living a lie', 'not aligned',
    'compromising', 'selling out', 'integrity', 'moral',
    'ethical dilemma', 'right thing to do'
  ],

  future_orientation: [
    'dream', 'dreams', 'aspiration', 'goal', 'goals',
    'where I see myself', 'five year plan', 'someday',
    'bucket list', 'one day', 'hope to', 'want to be',
    'vision', 'future', 'what I want', 'if only'
  ],

  stuck_hopeless: [
    'stuck', 'trapped', 'no way out', 'dead end',
    'going nowhere', 'spinning wheels', 'same place',
    'nothing changes', 'hopeless', 'what\'s the point',
    'given up', 'stopped trying', 'why bother'
  ],

  // ============================================
  // SECTION 29: MILESTONES & LIFE EVENTS
  // ============================================
  
  milestones_positive: [
    'accomplished', 'achieved', 'milestone', 'first time',
    'personal best', 'goal', 'finally', 'proud of',
    'breakthrough', 'success', 'successful', 'made it',
    'dream come true', 'bucket list', 'celebration'
  ],
  
  milestones_age: [
    'birthday', 'turning', 'years old', 'age',
    '18', '21', '30', '40', '50', '60',
    'midlife', 'quarter-life', 'getting older', 'aging'
  ],
  
  milestones_relationship: [
    'engaged', 'engagement', 'wedding', 'married',
    'anniversary', 'honeymoon', 'first date',
    'met my partner', 'said yes', 'proposed'
  ],
  
  milestones_family: [
    'pregnant', 'expecting', 'having a baby', 'new baby',
    'birth', 'born', 'delivery', 'new parent',
    'first word', 'first steps', 'started school',
    'graduated', 'left for college', 'empty nest'
  ],
  
  milestones_home: [
    'bought a house', 'first home', 'homeowner',
    'moved to', 'relocated', 'new city', 'new apartment',
    'moved out', 'living on my own', 'independence'
  ],
  
  milestones_career: [
    'new job', 'first job', 'dream job', 'promotion',
    'started business', 'launched', 'published',
    'retired', 'retirement', 'last day'
  ],

  // ============================================
  // SECTION 30: HOBBIES & INTERESTS
  // ============================================
  
  hobbies_creative: [
    'art', 'painting', 'drawing', 'sculpting', 'photography',
    'writing', 'poetry', 'journaling', 'blogging',
    'music', 'playing', 'instrument', 'guitar', 'piano', 'singing',
    'crafts', 'knitting', 'crochet', 'sewing', 'woodworking',
    'DIY', 'making', 'creating', 'creative'
  ],
  
  hobbies_entertainment: [
    'reading', 'books', 'book club', 'movie', 'movies', 'film',
    'TV', 'show', 'series', 'binge watching', 'streaming',
    'gaming', 'video games', 'board games', 'puzzles',
    'podcast', 'podcasts', 'music', 'concert'
  ],
  
  hobbies_outdoor: [
    'hiking', 'camping', 'backpacking', 'nature', 'outdoors',
    'fishing', 'hunting', 'gardening', 'garden',
    'bird watching', 'photography', 'kayaking', 'skiing'
  ],
  
  hobbies_collecting: [
    'collecting', 'collection', 'collector', 'vintage',
    'antiques', 'memorabilia', 'hobby'
  ],
  
  hobbies_learning: [
    'learning', 'studying', 'course', 'class', 'lessons',
    'skill', 'started learning', 'teaching myself',
    'language', 'new language', 'online course'
  ],

  // ============================================
  // SECTION 31: TRAVEL
  // ============================================
  
  travel_general: [
    'travel', 'traveling', 'trip', 'vacation', 'holiday',
    'getaway', 'adventure', 'exploring', 'visited'
  ],
  
  travel_types: [
    'road trip', 'flight', 'cruise', 'backpacking',
    'solo travel', 'family vacation', 'honeymoon',
    'business trip', 'conference', 'staycation'
  ],
  
  travel_events: [
    'planning a trip', 'booked', 'booking', 'itinerary',
    'just got back', 'leaving for', 'first time in',
    'dream destination', 'bucket list trip'
  ],

  // ============================================
  // SECTION 32: DIGITAL & TECHNOLOGY
  // ============================================

  digital_wellness: [
    'screen time', 'phone addiction', 'doom scrolling',
    'social media', 'instagram', 'tiktok', 'twitter', 'reddit',
    'online', 'digital detox', 'unplugging', 'always connected',
    'notification anxiety', 'FOMO', 'comparison trap',
    'cyberbullying', 'online harassment', 'trolls', 'doxxed'
  ],

  // ============================================
  // SECTION 33: CHILDHOOD & FORMATIVE
  // ============================================

  childhood_formative: [
    'growing up', 'childhood', 'when I was young', 'as a kid',
    'my parents', 'how I was raised', 'upbringing', 'household',
    'family dynamic', 'only child', 'middle child', 'youngest',
    'oldest', 'sibling rivalry', 'favoritism', 'compared to',
    'never allowed', 'strict', 'permissive', 'absent',
    'emotionally unavailable parent', 'parentified', 'grew up fast',
    'latchkey kid', 'sheltered', 'overprotected'
  ],

  // ============================================
  // SECTION 34: SENSORY & ENVIRONMENTAL
  // ============================================

  sensory_needs: [
    'sensitive', 'overstimulated', 'overwhelmed by noise',
    'need quiet', 'can\'t focus', 'sensory overload',
    'HSP', 'highly sensitive', 'crowds', 'loud',
    'need alone time', 'recharge', 'introvert needs'
  ],

  environment_mood: [
    'clutter', 'messy', 'clean space', 'organized',
    'nature', 'outdoors', 'fresh air', 'sunshine',
    'seasonal', 'winter blues', 'weather affects',
    'need to get outside', 'cooped up', 'cabin fever'
  ],

  // ============================================
  // SECTION 35: COMMUNICATION PREFERENCES
  // ============================================
  
  preference_validation: [
    'just need to vent', 'need to get this off my chest',
    'not looking for advice', 'just want to be heard',
    'need support', 'need encouragement', 'validate me'
  ],
  
  preference_solutions: [
    'what should I do', 'need advice', 'help me figure out',
    'what would you do', 'give me your opinion',
    'need a solution', 'problem-solving', 'practical help'
  ],
  
  preference_style: [
    'be direct', 'don\'t sugarcoat', 'be honest',
    'be gentle', 'be kind', 'take it easy on me',
    'tough love', 'straight talk', 'real talk'
  ],
  
  preference_avoid: [
    'don\'t tell me to', 'please don\'t say', 'hate when people',
    'tired of hearing', 'don\'t want to hear',
    'not helpful when', 'annoying when'
  ],

  // ============================================
  // SECTION 36: TEMPORAL PATTERNS
  // ============================================
  
  temporal_recurring: [
    'every time', 'always', 'never', 'usually', 'typically',
    'every day', 'daily', 'weekly', 'monthly', 'yearly',
    'every morning', 'every night', 'weekends', 'weekdays',
    'around this time', 'this time of year', 'seasonal'
  ],
  
  temporal_specific: [
    'anniversary', 'birthday', 'holiday', 'Christmas',
    'Thanksgiving', 'New Year', 'Valentine\'s', 'Mother\'s Day',
    'Father\'s Day', 'summer', 'winter', 'spring', 'fall'
  ],
  
  temporal_patterns: [
    'Sunday scaries', 'Monday blues', 'midweek slump',
    'end of month', 'end of year', 'back to school',
    'new year', 'fresh start', 'new chapter'
  ],

  // ============================================
  // SECTION 37: COPING & SELF-CARE
  // ============================================
  
  coping_healthy: [
    'coping', 'self-care', 'taking care of myself',
    'therapy', 'journaling', 'meditation', 'exercise',
    'talking to', 'support system', 'boundaries',
    'saying no', 'rest', 'break', 'time off'
  ],
  
  coping_unhealthy: [
    'avoiding', 'numbing', 'escaping', 'isolating',
    'binge', 'retail therapy', 'doom scrolling',
    'not sleeping', 'not eating', 'overeating',
    'drinking more', 'smoking more', 'zoning out'
  ],
  
  coping_seeking: [
    'need help', 'looking for support', 'trying to find',
    'reaching out', 'asking for help', 'admitting I need'
  ]
};

// ============================================
// SEVERITY & VALENCE MARKERS
// ============================================

export const SEVERITY_MARKERS = {
  high_distress: [
    'crisis', 'emergency', 'can\'t cope', 'falling apart',
    'rock bottom', 'worst', 'desperate', 'hopeless',
    'unbearable', 'can\'t take it', 'breaking point',
    'can\'t go on', 'end it', 'give up'
  ],
  
  moderate_distress: [
    'struggling', 'hard time', 'difficult', 'challenging',
    'overwhelmed', 'stressed', 'anxious', 'worried',
    'frustrated', 'upset', 'bothered', 'troubled'
  ],
  
  low_distress: [
    'bit stressed', 'little worried', 'somewhat',
    'kind of', 'a bit', 'slightly', 'minor', 'manageable'
  ],
  
  positive: [
    'happy', 'excited', 'proud', 'grateful', 'thankful',
    'hopeful', 'optimistic', 'relieved', 'peaceful',
    'content', 'joyful', 'thrilled', 'amazing', 'wonderful',
    'better', 'improving', 'progress'
  ],
  
  neutral: [
    'okay', 'fine', 'alright', 'so-so', 'meh',
    'not bad', 'getting by', 'managing', 'surviving'
  ]
};

// ============================================
// HIGH-SIGNAL THERAPEUTIC PHRASES
// ============================================

export const HIGH_SIGNAL_PHRASES = {
  breakthroughs: [
    'just realized', 'finally understand', 'clicked', 'aha moment',
    'pattern', 'keep doing', 'always end up', 'cycle', 'repeat',
    'connection', 'makes sense now', 'see it clearly'
  ],
  
  readiness_for_change: [
    'ready to', 'done with', 'can\'t keep', 'something has to change',
    'turning point', 'wake up call', 'last straw', 'enough is enough',
    'time to', 'need to change', 'want to change'
  ],
  
  core_wounds: [
    'not enough', 'too much', 'unlovable', 'broken', 'damaged',
    'fundamentally flawed', 'something wrong with me',
    'defective', 'worthless', 'invisible', 'burden'
  ],
  
  relationship_to_self: [
    'relationship with myself', 'how I treat myself', 'inner voice',
    'self-worth', 'self-esteem', 'confidence', 'believe in myself',
    'trust myself', 'know myself', 'accept myself'
  ],
  
  agency: [
    'my fault', 'I caused', 'I deserve', 'victim', 'survivor',
    'choice', 'chose', 'let', 'allowed', 'stood up', 'spoke up',
    'took control', 'set a boundary', 'advocated for myself'
  ],

  turning_points: [
    'before and after', 'everything changed', 'never the same',
    'defining moment', 'watershed', 'pivotal', 'life-altering',
    'changed everything', 'can\'t go back'
  ]
};

// ============================================
// EXTRACTION PRIORITY LEVELS
// ============================================

export const PRIORITY_CATEGORIES = {
  critical: [
    'suicidal', 'self_harm', 'abuse_types', 'abuse_relationships',
    'crisis_resources', 'symptoms_crisis', 'addiction_substances',
    'sexual_trauma'
  ],
  
  high: [
    'mental_health_providers', 'conditions_mood', 'conditions_anxiety',
    'conditions_trauma', 'recovery_general', 'trauma_types',
    'death_events', 'grief_process', 'therapy_trauma_focused',
    'attachment_styles', 'boundaries', 'inner_critic'
  ],
  
  medium: [
    'relationship_romantic_people', 'family_immediate', 'work_general',
    'health_conditions_chronic', 'finances_negative', 'legal_family',
    'medications_general', 'parenting_challenges', 'caregiving',
    'therapy_cbt_family', 'therapy_dbt'
  ],
  
  standard: [
    'identity_core', 'friendships_people', 'pets_types',
    'hobbies_creative', 'milestones_positive', 'preference_validation',
    'travel_general', 'education_general'
  ]
};

// ============================================
// COMPRESSION TEMPLATES
// ============================================

export const COMPRESSION_TEMPLATES = {
  relationship: "{name}:{role}:{dynamic}:{status}",
  // e.g., "Sarah:partner:supportive:married 5y"
  
  condition: "{condition}:{severity}:{since}:{treatment}",
  // e.g., "anxiety:moderate:2020:therapy+lexapro"
  
  event: "{date}:{event}:{valence}:{impact}",
  // e.g., "2024-03:job loss:negative:high stress"
  
  pattern: "{trigger}→{response}:{frequency}",
  // e.g., "Sunday evenings→anxiety:weekly"
  
  preference: "{context}:{prefer}:{avoid}",
  // e.g., "advice:direct honest:toxic positivity"
  
  goal: "{goal}:{blocker}:{progress}",
  // e.g., "promotion:fear visibility:building confidence"
  
  therapy: "{type}:{provider}:{frequency}:{since}",
  // e.g., "CBT:Dr.Smith:weekly:2023-06"
  
  medication: "{name}:{dose}:{purpose}:{started}",
  // e.g., "Lexapro:10mg:anxiety:2024-01"
  
  trauma: "{type}:{age/date}:{processed}:{impact}",
  // e.g., "childhood neglect:0-12:in therapy:attachment issues"
};

// ============================================
// ENTITY EXTRACTION PATTERNS (REGEX)
// ============================================

export const ENTITY_PATTERNS = {
  // Names (captures "my [relation] [Name]" patterns)
  named_person: /my\s+(mom|dad|mother|father|partner|husband|wife|brother|sister|friend|boss|therapist|doctor|psychiatrist)\s+([A-Z][a-z]+)/gi,
  
  // Dates (various formats)
  date_mention: /(?:since|in|around|back in|last|started|began)\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|\d{4}|\d{1,2}\/\d{1,2})/gi,
  
  // Durations
  duration: /(?:for|been|over)\s+(\d+)\s+(days?|weeks?|months?|years?)/gi,
  
  // Medications with dosage
  medication_dosage: /(\d+)\s*(?:mg|milligrams?)\s+(?:of\s+)?([A-Za-z]+)/gi,
  
  // Locations
  location: /(?:live in|moved to|from|in|living in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // Ages
  age: /(?:i'm|i am|turned|turning)\s+(\d{1,2})/gi,
  
  // Therapy frequency
  therapy_frequency: /(?:therapy|sessions?|see my therapist)\s+(?:every|once a|twice a)\s+(week|month|other week)/gi,
  
  // Sobriety duration
  sobriety: /(\d+)\s+(days?|weeks?|months?|years?)\s+(?:sober|clean|in recovery)/gi,
};

// ============================================
// CATEGORY GROUPINGS (for UI/organization)
// ============================================

export const CATEGORY_GROUPS = {
  identity: [
    'identity_core', 'identity_gender_sexuality', 'identity_neurodivergence',
    'identity_cultural'
  ],
  
  relationships: [
    'relationship_romantic_people', 'relationship_romantic_status',
    'relationship_romantic_events', 'relationship_romantic_dynamics',
    'family_immediate', 'family_extended', 'family_in_laws',
    'family_blended', 'family_dynamics', 'family_events',
    'friendships_people', 'friendships_dynamics', 'friendships_events',
    'social_general', 'support_system', 'community', 'social_comparison',
    'attachment_styles', 'boundaries', 'intimacy', 'sexual_health'
  ],
  
  mental_health: [
    'mental_health_providers', 'mental_health_general_states',
    'conditions_mood', 'conditions_anxiety', 'conditions_trauma',
    'conditions_ocd_related', 'conditions_eating', 'conditions_personality',
    'conditions_other', 'symptoms_depression', 'symptoms_anxiety',
    'symptoms_crisis', 'self_harm', 'suicidal', 'crisis_resources'
  ],
  
  therapy: [
    'therapy_talk_traditional', 'therapy_cbt_family', 'therapy_dbt',
    'therapy_act', 'therapy_trauma_focused', 'therapy_humanistic',
    'therapy_relational', 'therapy_family_systems', 'therapy_mindfulness_based',
    'therapy_creative_expressive', 'therapy_body_based', 'therapy_specialized',
    'therapy_child_adolescent', 'therapy_group', 'therapy_other_modalities',
    'therapy_assessment', 'therapy_concepts', 'therapy_progress'
  ],
  
  medications: [
    'medications_general', 'medications_antidepressants', 'medications_anxiety',
    'medications_mood_stabilizers', 'medications_antipsychotics',
    'medications_adhd', 'medications_sleep'
  ],
  
  addiction_recovery: [
    'addiction_substances', 'addiction_behavioral', 'recovery_general',
    'recovery_programs', 'recovery_events'
  ],
  
  trauma_abuse: [
    'trauma_types', 'abuse_types', 'abuse_relationships',
    'abuse_recovery', 'sexual_trauma'
  ],
  
  cognitive_emotional: [
    'inner_critic', 'self_compassion', 'perfectionism', 'shame_guilt',
    'anger', 'anger_expression', 'control_issues', 'uncertainty_change',
    'cognitive_distortions', 'rumination'
  ],
  
  life_domains: [
    'work_general', 'work_people', 'work_positive', 'work_negative',
    'work_stress', 'work_events', 'imposter_professional',
    'education_general', 'education_levels', 'education_events', 'education_people',
    'finances_general', 'finances_positive', 'finances_negative', 'finances_events',
    'housing_general', 'housing_living', 'housing_events'
  ],
  
  physical_health: [
    'health_general', 'health_providers', 'health_conditions_chronic',
    'health_conditions_serious', 'health_reproductive', 'health_events',
    'health_pain', 'health_disability', 'sleep_problems', 'sleep_patterns',
    'fitness_general', 'fitness_types', 'fitness_events',
    'diet_general', 'diet_types', 'diet_issues', 'body_image'
  ],
  
  life_stages: [
    'parenting_challenges', 'parenting_dynamics', 'caregiving',
    'childhood_formative', 'milestones_positive', 'milestones_age',
    'milestones_relationship', 'milestones_family', 'milestones_home',
    'milestones_career', 'existential', 'values', 'future_orientation',
    'stuck_hopeless'
  ],
  
  death_grief: [
    'death_events', 'death_causes', 'grief_process', 'grief_stages'
  ],
  
  spirituality: [
    'religion_general', 'religion_practices', 'religion_traditions',
    'religion_events', 'spirituality_practices'
  ],
  
  legal: [
    'legal_general', 'legal_civil', 'legal_criminal',
    'legal_family', 'legal_immigration'
  ],
  
  lifestyle: [
    'pets_types', 'pets_events', 'pets_care',
    'hobbies_creative', 'hobbies_entertainment', 'hobbies_outdoor',
    'hobbies_collecting', 'hobbies_learning',
    'travel_general', 'travel_types', 'travel_events',
    'digital_wellness', 'sensory_needs', 'environment_mood'
  ],
  
  preferences: [
    'preference_validation', 'preference_solutions',
    'preference_style', 'preference_avoid',
    'coping_healthy', 'coping_unhealthy', 'coping_seeking'
  ],
  
  temporal: [
    'temporal_recurring', 'temporal_specific', 'temporal_patterns'
  ]
};

// ============================================
// EXPORT STATISTICS
// ============================================

export const getPatternStats = () => {
  let totalKeywords = 0;
  let categoryCount = 0;
  
  for (const keywords of Object.values(MEMORY_EXTRACTION_PATTERNS)) {
    totalKeywords += keywords.length;
    categoryCount++;
  }
  
  return {
    totalKeywords,
    categoryCount,
    severityMarkers: Object.values(SEVERITY_MARKERS).flat().length,
    highSignalPhrases: Object.values(HIGH_SIGNAL_PHRASES).flat().length,
    priorityCategories: {
      critical: PRIORITY_CATEGORIES.critical.length,
      high: PRIORITY_CATEGORIES.high.length,
      medium: PRIORITY_CATEGORIES.medium.length,
      standard: PRIORITY_CATEGORIES.standard.length
    }
  };
};
add more ----Some are duplicates 

// memory-extraction-patterns-v3.ts
// Comprehensive keyword detection for personal context extraction
// For use with Moodling and similar therapeutic/personalization AI applications
// Version 3.0 - Ultimate expanded edition
// 
// STATS: ~200+ subcategories, ~7000+ keywords

export const MEMORY_EXTRACTION_PATTERNS = {

  // ============================================
  // SECTION 1: IDENTITY & DEMOGRAPHICS
  // ============================================
  
  identity_core: [
    'my name is', 'i am', 'i\'m a', 'years old', 'i live in',
    'i\'m from', 'moved to', 'born in', 'grew up in', 'raised in',
    'nationality', 'ethnicity', 'background', 'originally from',
    'hometown', 'home state', 'home country'
  ],
  
  identity_gender_sexuality: [
    'coming out', 'came out', 'transition', 'transitioning', 'transitioned',
    'gender identity', 'non-binary', 'transgender', 'cisgender',
    'gay', 'lesbian', 'bisexual', 'pansexual', 'asexual', 'queer',
    'sexuality', 'orientation', 'LGBTQ', 'closeted', 'out to',
    'deadname', 'pronouns', 'they/them', 'he/him', 'she/her',
    'questioning', 'fluid', 'demisexual', 'aromantic', 'ace',
    'sapphic', 'enby', 'genderqueer', 'genderfluid', 'agender',
    'heteroflexible', 'homoflexible', 'bicurious', 'sexually fluid',
    'born this way', 'always knew', 'discovered later', 'late bloomer'
  ],
  
  identity_neurodivergence: [
    'ADHD', 'autism', 'autistic', 'ASD', 'on the spectrum',
    'neurodivergent', 'neurotypical', 'dyslexia', 'dyslexic',
    'dyscalculia', 'dyspraxia', 'sensory processing',
    'executive function', 'hyperfocus', 'stimming', 'masking',
    'special interest', 'infodump', 'burnout', 'meltdown', 'shutdown',
    'twice exceptional', '2e', 'gifted', 'learning disability',
    'auditory processing', 'visual processing'
  ],

  identity_cultural: [
    'cultural expectations', 'family expectations', 'traditional',
    'first generation', 'immigrant', 'between two cultures',
    'code switching', 'not [culture] enough', 'too [culture]',
    'arranged', 'bring shame', 'honor', 'filial piety',
    'model minority', 'stereotypes', 'microaggressions',
    'discrimination', 'racism', 'prejudice', 'bias',
    'heritage', 'ancestry', 'roots', 'homeland', 'diaspora',
    'second generation', 'third culture kid', 'TCK', 'expat'
  ],

  identity_social_labels: [
    'nerd', 'geek', 'dork', 'outcast', 'loner', 'introvert',
    'extrovert', 'ambivert', 'social butterfly', 'wallflower',
    'popular', 'unpopular', 'weird', 'different', 'unique',
    'black sheep', 'oddball', 'misfit', 'outsider', 'freak',
    'normie', 'basic', 'hipster', 'alternative', 'mainstream',
    'old soul', 'young at heart', 'free spirit', 'rebel',
    'people person', 'antisocial', 'homebody', 'adventurer',
    'bookworm', 'jock', 'preppy', 'artsy', 'creative type',
    'class clown', 'teacher\'s pet', 'troublemaker', 'goody two shoes'
  ],

  // ============================================
  // SECTION 2: PERSONALITY ARCHETYPES & TYPES
  // ============================================

  personality_archetypes: [
    'alpha', 'beta', 'sigma', 'omega', 'gamma', 'delta',
    'alpha male', 'alpha female', 'beta male', 'sigma male',
    'leader', 'follower', 'lone wolf', 'pack animal',
    'dominant personality', 'submissive personality', 'assertive',
    'CEO type', 'executive', 'boss', 'worker bee', 'team player',
    'visionary', 'implementer', 'dreamer', 'doer',
    'type A', 'type B', 'type C', 'type D',
    'overachiever', 'underachiever', 'high achiever', 'slacker',
    'go-getter', 'laid back', 'chill', 'intense', 'driven',
    'workaholic', 'work to live', 'live to work', 'hustler', 'grinder'
  ],

  personality_traits: [
    'introvert', 'extrovert', 'ambivert', 'shy', 'outgoing',
    'confident', 'insecure', 'ambitious', 'laid back', 'type A',
    'perfectionist', 'procrastinator', 'organized', 'messy',
    'creative', 'analytical', 'logical', 'emotional', 'sensitive',
    'empathetic', 'stoic', 'expressive', 'reserved', 'loud',
    'funny', 'serious', 'sarcastic', 'dry humor', 'goofy',
    'independent', 'dependent', 'leader', 'follower', 'loner',
    'social', 'adventurous', 'cautious', 'spontaneous', 'planner',
    'optimist', 'pessimist', 'realist', 'idealist', 'cynic'
  ],

  personality_types_systems: [
    'MBTI', 'Myers-Briggs', 'INTJ', 'INFP', 'ENFJ', 'ENTP',
    'ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INTP',
    'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENTJ',
    'enneagram', 'type 1', 'type 2', 'type 3', 'type 4',
    'type 5', 'type 6', 'type 7', 'type 8', 'type 9',
    'wing', '1w2', '4w5', '9w1', 'tritype',
    'attachment style', 'love language', 'zodiac', 'astrology',
    'sun sign', 'moon sign', 'rising sign', 'birth chart',
    'human design', 'projector', 'generator', 'manifestor', 'reflector',
    'disc profile', 'strengths finder', 'big five', 'OCEAN'
  ],

  // ============================================
  // SECTION 3: THINKING & LEARNING STYLES
  // ============================================

  thinking_style: [
    'abstract thinker', 'concrete thinker', 'conceptual',
    'literal', 'metaphorical', 'big picture', 'detail-oriented',
    'systems thinker', 'linear thinker', 'non-linear',
    'analytical', 'intuitive', 'logical', 'creative',
    'divergent thinking', 'convergent thinking', 'lateral thinking',
    'black and white', 'shades of gray', 'nuanced', 'binary',
    'philosophical', 'practical', 'theoretical', 'applied',
    'overthinking', 'underthinking', 'ruminating', 'quick decisions',
    'head vs heart', 'think with my heart', 'think with my head',
    'gut feeling', 'instinct', 'intuition', 'logic over emotion'
  ],

  learning_style: [
    'visual learner', 'auditory learner', 'kinesthetic learner',
    'read/write learner', 'hands-on', 'learn by doing',
    'learn by watching', 'learn by reading', 'learn by listening',
    'need to see it', 'need to hear it', 'need to try it',
    'fast learner', 'slow learner', 'quick study', 'takes time',
    'self-taught', 'need instruction', 'need structure',
    'learn from mistakes', 'learn from others', 'trial and error',
    'book smart', 'street smart', 'common sense',
    'academic', 'practical intelligence', 'emotional intelligence',
    'visual diagrams', 'step by step', 'big picture first',
    'memorizer', 'understander', 'pattern recognition'
  ],

  // ============================================
  // SECTION 4: EMOTIONAL EXPRESSION & LOVE LANGUAGES
  // ============================================

  emotional_expression: [
    'express through words', 'express through actions',
    'verbal', 'non-verbal', 'articulate feelings', 'struggle to express',
    'wear heart on sleeve', 'keep feelings inside', 'bottle up',
    'emotionally open', 'emotionally guarded', 'emotionally available',
    'show don\'t tell', 'tell don\'t show', 'actions speak louder',
    'crying', 'never cry', 'cry easily', 'emotional', 'stoic',
    'expressive', 'reserved', 'dramatic', 'understated',
    'process internally', 'process externally', 'talk it out',
    'need space', 'need connection', 'need time alone'
  ],

  love_languages: [
    'love language', 'words of affirmation', 'quality time',
    'receiving gifts', 'acts of service', 'physical touch',
    'need to hear I love you', 'need quality time', 'need gifts',
    'need help with tasks', 'need hugs', 'need cuddles',
    'compliments', 'praise', 'encouragement', 'verbal appreciation',
    'undivided attention', 'presence', 'being there',
    'thoughtful gifts', 'surprises', 'remembering',
    'doing things for me', 'helping out', 'taking care of',
    'holding hands', 'hugging', 'kissing', 'cuddling', 'intimacy',
    'feel loved when', 'show love by', 'need affection',
    'affectionate', 'not affectionate', 'touchy', 'hands off'
  ],

  gift_preferences: [
    'love gifts', 'hate gifts', 'thoughtful gifts', 'practical gifts',
    'experiences over things', 'things over experiences',
    'handmade', 'expensive', 'meaningful', 'useful',
    'surprise me', 'tell me what you want', 'wish list',
    'gift giver', 'bad at gifts', 'love giving', 'love receiving',
    'sentimental', 'materialistic', 'minimalist', 'collector',
    'drawn to', 'always wanted', 'dream gift', 'perfect present'
  ],

  // ============================================
  // SECTION 5: RELATIONSHIPS - ROMANTIC
  // ============================================
  
  relationship_romantic_people: [
    'partner', 'husband', 'wife', 'spouse', 'boyfriend', 'girlfriend',
    'fiancé', 'fiancée', 'significant other', 'SO', 'lover',
    'ex', 'ex-husband', 'ex-wife', 'ex-boyfriend', 'ex-girlfriend',
    'the one', 'soulmate', 'person i\'m seeing', 'situationship',
    'fwb', 'friends with benefits', 'talking to', 'seeing someone',
    'crush', 'unrequited', 'long-term partner', 'life partner'
  ],
  
  relationship_romantic_status: [
    'married', 'engaged', 'dating', 'single', 'divorced', 'separated',
    'widowed', 'in a relationship', 'it\'s complicated', 'open relationship',
    'polyamorous', 'monogamous', 'long distance', 'living together',
    'moved in', 'cohabiting', 'taking a break', 'on a break',
    'newly single', 'recently divorced', 'happily married', 'unhappily married'
  ],

  relationship_style_preference: [
    'casual', 'serious', 'committed', 'non-committal',
    'monogamous', 'polyamorous', 'open', 'closed',
    'traditional', 'non-traditional', 'conventional', 'alternative',
    'just sex', 'emotional connection', 'deep connection', 'spiritual connection',
    'intellectual connection', 'physical connection', 'mental stimulation',
    'passionate', 'stable', 'volatile', 'calm', 'drama',
    'hot and cold', 'consistent', 'unpredictable', 'steady',
    'independent together', 'codependent', 'interdependent',
    'need space', 'together all the time', 'clingy', 'distant'
  ],

  relationship_dynamics_power: [
    'equal partnership', 'power imbalance', 'dominant', 'submissive',
    'passive', 'assertive', 'subservient', 'controlling',
    'wears the pants', 'head of household', 'equal say',
    'decision maker', 'go with the flow', 'compromise',
    'my way', 'their way', 'our way', 'give and take',
    'provider', 'caretaker', 'breadwinner', 'homemaker'
  ],
  
  relationship_romantic_dynamics: [
    'fighting', 'argument', 'disagreement', 'not speaking',
    'couples therapy', 'marriage counseling', 'trust issues',
    'cheating', 'infidelity', 'affair', 'betrayal', 'forgiveness',
    'growing apart', 'falling out of love', 'rekindled',
    'communication issues', 'intimacy', 'love language',
    'emotionally unavailable', 'avoidant partner', 'anxious partner'
  ],

  // ============================================
  // SECTION 6: RELATIONSHIPS - FAMILY
  // ============================================
  
  family_immediate: [
    'mom', 'mother', 'dad', 'father', 'parent', 'parents',
    'brother', 'sister', 'sibling', 'son', 'daughter', 'child',
    'children', 'kids', 'baby', 'toddler', 'teenager', 'teen',
    'twins', 'triplets', 'only child', 'firstborn', 'youngest',
    'middle child', 'oldest', 'baby of the family'
  ],
  
  family_extended: [
    'grandmother', 'grandfather', 'grandma', 'grandpa', 'nana', 'papa',
    'grandparent', 'grandchild', 'aunt', 'uncle', 'cousin',
    'niece', 'nephew', 'great-grandmother', 'great-grandfather',
    'great aunt', 'great uncle', 'second cousin'
  ],
  
  family_in_laws: [
    'mother-in-law', 'father-in-law', 'in-laws', 'MIL', 'FIL',
    'sister-in-law', 'brother-in-law', 'SIL', 'BIL',
    'son-in-law', 'daughter-in-law'
  ],
  
  family_blended: [
    'stepmother', 'stepfather', 'stepmom', 'stepdad', 'stepparent',
    'stepbrother', 'stepsister', 'stepsibling', 'stepson', 'stepdaughter',
    'half-brother', 'half-sister', 'half-sibling',
    'adoptive', 'adopted', 'birth parent', 'biological', 'foster',
    'bio mom', 'bio dad', 'birth mother', 'birth father',
    'blended family', 'chosen family', 'found family'
  ],

  // ============================================
  // SECTION 7: PARENTING STYLES - RECEIVED
  // ============================================

  parenting_style_received: [
    'authoritarian parents', 'strict parents', 'controlling parents',
    'permissive parents', 'lenient parents', 'no rules',
    'authoritative parents', 'balanced parents', 'firm but fair',
    'neglectful parents', 'absent parents', 'checked out',
    'helicopter parents', 'overprotective', 'smothering',
    'free range', 'independent', 'hands off',
    'tiger mom', 'tiger parents', 'high expectations',
    'supportive parents', 'encouraging', 'believed in me',
    'critical parents', 'never good enough', 'high standards',
    'emotionally available', 'emotionally unavailable', 'distant',
    'loving', 'cold', 'warm', 'affectionate', 'withholding'
  ],

  childhood_household: [
    'stable household', 'unstable household', 'chaotic',
    'hectic', 'calm', 'peaceful', 'stressful', 'tense',
    'loving home', 'cold home', 'warm home', 'dysfunctional',
    'functional', 'happy childhood', 'unhappy childhood', 'traumatic',
    'abandoned', 'neglected', 'cared for', 'provided for',
    'poor', 'wealthy', 'middle class', 'struggling', 'comfortable',
    'single parent household', 'two parent household', 'grandparents raised',
    'foster care', 'group home', 'boarding school', 'latchkey kid',
    'divorce', 'parents divorced', 'parents together', 'remarried',
    'fighting', 'parents fighting', 'screaming', 'violence', 'abuse',
    'alcoholic parent', 'addict parent', 'mentally ill parent',
    'parentified', 'grew up fast', 'had to be adult', 'lost childhood'
  ],

  childhood_correlations: [
    'childhood trauma', 'ACEs', 'adverse childhood experiences',
    'attachment issues', 'trust issues', 'abandonment issues',
    'need for stimulation', 'chaos feels normal', 'addicted to drama',
    'fear of abandonment', 'fear of intimacy', 'avoidant',
    'anxious attachment', 'disorganized attachment', 'insecure attachment',
    'people pleasing', 'codependency', 'boundary issues',
    'hypervigilance', 'always on guard', 'waiting for shoe to drop',
    'need for control', 'fear of chaos', 'crave stability',
    'self-sabotage', 'don\'t deserve good things', 'imposter'
  ],

  // ============================================
  // SECTION 8: PARENTING STYLES - GIVING
  // ============================================

  parenting_style_giving: [
    'authoritarian parent', 'strict', 'rules', 'discipline',
    'permissive parent', 'lenient', 'friend not parent', 'no rules',
    'authoritative', 'balanced', 'firm but loving', 'boundaries with warmth',
    'gentle parenting', 'respectful parenting', 'conscious parenting',
    'attachment parenting', 'co-sleeping', 'baby wearing', 'responsive',
    'helicopter parent', 'overprotective', 'can\'t let go',
    'free range parent', 'independent', 'let them figure it out',
    'tiger parent', 'high expectations', 'push hard', 'achievement focused',
    'supportive', 'encouraging', 'their biggest fan',
    'trying not to repeat', 'breaking the cycle', 'different than my parents',
    'same as my parents', 'learned from my parents', 'do what they did'
  ],

  parenting_challenges: [
    'postpartum', 'PPD', 'PPA', 'postpartum anxiety',
    'baby blues', 'bonding', 'not bonding', 'breastfeeding',
    'sleep deprivation', 'colicky', 'tantrums', 'terrible twos',
    'defiant', 'behavioral issues', 'special needs', 'autism parent',
    'ADHD child', 'IEP', '504', 'school issues', 'bullied',
    'sensory issues', 'developmental delay', 'speech delay'
  ],

  parenting_dynamics: [
    'single parent', 'single mom', 'single dad', 'co-parenting',
    'custody battle', 'ex won\'t', 'parenting styles',
    'discipline', 'screen time', 'helicopter', 'permissive',
    'authoritarian', 'gentle parenting', 'mom guilt', 'dad guilt',
    'work-life balance', 'missing milestones', 'quality time',
    'blended family', 'step-parenting', 'attachment parenting'
  ],

  // ============================================
  // SECTION 9: FAMILY DYNAMICS
  // ============================================

  family_dynamics: [
    'estranged', 'no contact', 'low contact', 'NC', 'LC',
    'toxic family', 'family drama', 'dysfunctional', 'enmeshed',
    'boundaries', 'golden child', 'scapegoat', 'favoritism',
    'narcissistic parent', 'helicopter parent', 'neglectful',
    'codependent', 'enabling', 'family therapy', 'family secret',
    'black sheep', 'parentified', 'emotional incest', 'covert incest',
    'generational patterns', 'family curse', 'breaking the cycle'
  ],

  family_children_dynamics: [
    'sibling rivalry', 'sibling bond', 'close with siblings',
    'don\'t talk to siblings', 'competitive siblings', 'protective of',
    'older sibling', 'younger sibling', 'sibling favoritism',
    'compared to sibling', 'living in shadow of', 'twin bond',
    'irish twins', 'age gap', 'raised like only child',
    'took care of siblings', 'siblings took care of me',
    'fighting with siblings', 'best friends with siblings'
  ],

  // ============================================
  // SECTION 10: FRIENDSHIPS & SOCIAL
  // ============================================
  
  friendships_people: [
    'best friend', 'BFF', 'close friend', 'friend group', 'squad',
    'childhood friend', 'old friend', 'new friend', 'work friend',
    'acquaintance', 'frenemy', 'mutual friend', 'circle',
    'bestie', 'ride or die', 'day one', 'homie', 'buddy', 'pal'
  ],
  
  friendships_quantity: [
    'no friends', 'few friends', 'lots of friends', 'many friends',
    'one close friend', 'handful of friends', 'big friend group',
    'small circle', 'large circle', 'only friend', 'tons of friends',
    'quality over quantity', 'know everyone', 'know nobody',
    'acquaintances but no real friends', 'surface level friendships',
    'hard to make friends', 'easy to make friends', 'keep friends',
    'lose touch', 'maintain friendships', 'effort to stay connected'
  ],

  friendships_dynamics: [
    'friendship', 'falling out', 'reconnected', 'drifted apart',
    'grew apart', 'betrayed', 'ghosted', 'toxic friendship',
    'one-sided', 'supportive', 'judgmental', 'jealous',
    'competitive', 'ride or die', 'always there for me',
    'fair weather friend', 'through thick and thin', 'loyalty'
  ],

  social_behavior: [
    'social butterfly', 'wallflower', 'life of the party',
    'class clown', 'center of attention', 'blend in',
    'small talk', 'hate small talk', 'deep conversations',
    'awkward', 'charming', 'charismatic', 'magnetic',
    'approachable', 'intimidating', 'warm', 'cold',
    'makes friends easily', 'hard to get to know', 'opens up slowly'
  ],

  party_social_events: [
    'love parties', 'hate parties', 'anxious at parties',
    'life of the party', 'wallflower at parties', 'need to leave early',
    'social anxiety at events', 'dread social events', 'love socializing',
    'need liquid courage', 'drink to socialize', 'sober socializing',
    'networking', 'hate networking', 'good at networking',
    'large gatherings', 'small gatherings', 'intimate groups',
    'overwhelmed by crowds', 'energized by crowds', 'need to recharge after',
    'FOMO', 'JOMO', 'rather stay home', 'always want to go out'
  ],

  // ============================================
  // SECTION 11: PETS & ANIMALS
  // ============================================
  
  pets_types: [
    'dog', 'cat', 'puppy', 'kitten', 'pet', 'fur baby', 'furbaby',
    'bird', 'parrot', 'parakeet', 'fish', 'aquarium', 'tank',
    'hamster', 'guinea pig', 'rabbit', 'bunny', 'chinchilla',
    'reptile', 'snake', 'lizard', 'gecko', 'turtle', 'tortoise',
    'horse', 'ferret', 'rat', 'mouse', 'hedgehog', 'sugar glider',
    'tarantula', 'hermit crab', 'chickens', 'goats', 'pig'
  ],
  
  pets_relationship: [
    'my baby', 'like my child', 'emotional support animal', 'ESA',
    'service dog', 'therapy animal', 'constant companion',
    'best friend', 'unconditional love', 'always there for me',
    'gets me through', 'reason to get up', 'dog person', 'cat person',
    'animal lover', 'love animals', 'prefer animals to people'
  ],

  // ============================================
  // SECTION 12: MENTAL HEALTH - CONDITIONS
  // ============================================
  
  mental_health_providers: [
    'therapy', 'therapist', 'counselor', 'counseling', 'psychologist',
    'psychiatrist', 'mental health', 'psych', 'shrink',
    'social worker', 'LCSW', 'LPC', 'LMFT', 'psychotherapist',
    'life coach', 'support group', 'group therapy',
    'psychiatric nurse', 'PMHNP', 'mental health professional'
  ],

  mental_health_general_states: [
    'struggling', 'overwhelmed', 'burnt out', 'burnout',
    'stressed', 'anxious', 'depressed', 'numb', 'empty',
    'hopeless', 'helpless', 'stuck', 'lost', 'confused',
    'frustrated', 'angry', 'resentful', 'bitter', 'exhausted',
    'drained', 'depleted', 'running on empty'
  ],

  conditions_mood: [
    'depression', 'depressed', 'major depressive', 'MDD',
    'bipolar', 'bipolar disorder', 'manic', 'mania', 'hypomania',
    'mood disorder', 'dysthymia', 'persistent depressive',
    'seasonal depression', 'SAD', 'postpartum depression', 'PPD',
    'premenstrual dysphoric', 'PMDD', 'mood swings', 'cycling',
    'bipolar 1', 'bipolar 2', 'cyclothymia', 'rapid cycling'
  ],
  
  conditions_anxiety: [
    'anxiety', 'anxious', 'generalized anxiety', 'GAD',
    'panic attack', 'panic disorder', 'agoraphobia',
    'social anxiety', 'phobia', 'health anxiety', 'hypochondria',
    'separation anxiety', 'performance anxiety', 'test anxiety',
    'anticipatory anxiety', 'free-floating anxiety'
  ],
  
  conditions_trauma: [
    'PTSD', 'post-traumatic', 'trauma', 'traumatic', 'C-PTSD',
    'complex trauma', 'developmental trauma', 'triggered',
    'flashback', 'hypervigilance', 'dissociation', 'dissociating',
    'nightmare', 'night terror', 'startle response', 'hyperarousal'
  ],
  
  conditions_ocd_related: [
    'OCD', 'obsessive compulsive', 'intrusive thoughts',
    'compulsions', 'rituals', 'contamination', 'checking',
    'pure O', 'harm OCD', 'relationship OCD', 'ROCD',
    'symmetry', 'just right', 'scrupulosity', 'hoarding',
    'body-focused repetitive', 'BFRB', 'trichotillomania', 'dermatillomania'
  ],
  
  conditions_eating: [
    'eating disorder', 'ED', 'anorexia', 'bulimia', 'binge eating',
    'BED', 'ARFID', 'orthorexia', 'restricting', 'purging',
    'body dysmorphia', 'BDD', 'disordered eating',
    'recovery', 'in recovery', 'ED recovery', 'relapse'
  ],
  
  conditions_personality: [
    'BPD', 'borderline', 'NPD', 'narcissistic', 'ASPD',
    'personality disorder', 'avoidant personality', 'dependent',
    'splitting', 'favorite person', 'FP', 'abandonment',
    'identity disturbance', 'emptiness', 'unstable relationships',
    'histrionic', 'schizoid', 'schizotypal', 'paranoid personality'
  ],

  // ============================================
  // SECTION 13: THERAPY TYPES & MODALITIES
  // ============================================

  therapy_types: [
    'talk therapy', 'psychotherapy', 'CBT', 'cognitive behavioral',
    'DBT', 'dialectical', 'EMDR', 'trauma therapy',
    'psychoanalysis', 'psychodynamic', 'humanistic', 'existential',
    'gestalt', 'ACT', 'acceptance and commitment',
    'IFS', 'internal family systems', 'parts work',
    'somatic', 'body-based', 'brainspotting',
    'couples therapy', 'family therapy', 'group therapy',
    'art therapy', 'music therapy', 'play therapy',
    'ketamine therapy', 'psychedelic therapy', 'psilocybin therapy'
  ],

  // ============================================
  // SECTION 14: MEDICATIONS
  // ============================================
  
  medications_general: [
    'medication', 'meds', 'prescribed', 'prescription',
    'dosage', 'dose', 'increased dose', 'decreased dose',
    'tapering', 'weaning off', 'withdrawal', 'side effects',
    'not working', 'started taking', 'stopped taking',
    'med check', 'medication management', 'refill'
  ],
  
  medications_psych: [
    'antidepressant', 'SSRI', 'SNRI', 'Lexapro', 'Zoloft', 'Prozac',
    'Wellbutrin', 'Effexor', 'Cymbalta', 'mood stabilizer',
    'Lithium', 'Lamictal', 'antipsychotic', 'Abilify', 'Seroquel',
    'Xanax', 'Klonopin', 'Ativan', 'benzodiazepine', 'benzo',
    'Adderall', 'Vyvanse', 'Ritalin', 'stimulant',
    'sleep aid', 'Ambien', 'trazodone', 'melatonin'
  ],

  // ============================================
  // SECTION 15: SUBSTANCES - COMPREHENSIVE
  // ============================================
  
  substances_alcohol: [
    'alcohol', 'drinking', 'drunk', 'wasted', 'hammered', 'tipsy',
    'beer', 'wine', 'liquor', 'whiskey', 'vodka', 'tequila',
    'cocktails', 'shots', 'bar', 'club', 'pub', 'brewery',
    'hangover', 'blackout', 'blacked out', 'binge drinking',
    'alcoholic', 'alcoholism', 'alcohol use disorder', 'AUD',
    'social drinking', 'moderate drinking', 'heavy drinking',
    'sober curious', 'dry January', 'mocktails'
  ],
  
  substances_cannabis: [
    'weed', 'marijuana', 'cannabis', 'pot', 'ganja', 'herb',
    'smoking', 'joint', 'blunt', 'bong', 'bowl', 'pipe',
    'edibles', 'gummies', 'THC', 'CBD', 'dispensary',
    'indica', 'sativa', 'hybrid', 'strain', 'dab', 'concentrate',
    'high', 'stoned', 'baked', 'blazed', 'medicated',
    'medical marijuana', 'recreational'
  ],
  
  substances_psychedelics: [
    'psychedelics', 'psychedelic', 'tripping', 'trip', 'tripped',
    'mushrooms', 'shrooms', 'psilocybin', 'magic mushrooms',
    'LSD', 'acid', 'tabs', 'blotter', 'microdosing', 'microdose',
    'DMT', 'ayahuasca', 'aya', 'ceremony', 'plant medicine',
    'mescaline', 'peyote', 'san pedro', '2C-B', 'ketamine',
    'ego death', 'ego dissolution', 'mystical experience',
    'bad trip', 'challenging trip', 'integration', 'set and setting',
    'MDMA', 'molly', 'ecstasy', 'rolling', 'empathogen'
  ],

  psychedelic_use_context: [
    'therapeutic use', 'therapy', 'healing', 'trauma processing',
    'spiritual use', 'ceremonial', 'shamanic', 'religious',
    'recreational', 'party', 'festival', 'rave',
    'self-exploration', 'personal growth', 'consciousness expansion',
    'microdosing for depression', 'microdosing for anxiety',
    'microdosing for creativity', 'microdosing for focus',
    'guided session', 'trip sitter', 'integration therapy',
    'abuse', 'addiction', 'too much', 'out of control',
    'life changing', 'transformative', 'opened my eyes',
    'bad experience', 'traumatic trip', 'HPPD'
  ],
  
  substances_stimulants: [
    'cocaine', 'coke', 'blow', 'snow', 'powder', 'lines',
    'crack', 'meth', 'methamphetamine', 'crystal', 'speed',
    'amphetamines', 'uppers', 'stimulants', 'stims',
    'adderall abuse', 'study drugs', 'performance enhancers',
    'tweaking', 'wired', 'geeked', 'jittery', 'comedown', 'crash'
  ],
  
  substances_opioids: [
    'opioids', 'opiates', 'heroin', 'fentanyl', 'oxy', 'oxycodone',
    'percocet', 'vicodin', 'hydrocodone', 'morphine', 'codeine',
    'painkillers', 'pills', 'nodding', 'dope sick',
    'withdrawal', 'detox', 'MAT', 'Suboxone', 'methadone',
    'Narcan', 'naloxone', 'overdose', 'OD'
  ],

  substances_other: [
    'benzos', 'xanax', 'bars', 'klonopin', 'valium',
    'inhalants', 'whippets', 'nitrous', 'poppers',
    'GHB', 'roofies', 'date rape drug',
    'steroids', 'PEDs', 'performance enhancing',
    'nicotine', 'vaping', 'vape', 'juul', 'cigarettes', 'smoking',
    'kratom', 'kava', 'nootropics', 'supplements'
  ],
  
  addiction_behavioral: [
    'gambling', 'gambling addiction', 'casino', 'sports betting',
    'porn addiction', 'pornography', 'compulsive porn use',
    'sex addiction', 'hypersexuality', 'compulsive sexual behavior',
    'shopping addiction', 'compulsive shopping', 'retail therapy',
    'gaming addiction', 'video game addiction', 'internet addiction',
    'social media addiction', 'phone addiction', 'doom scrolling',
    'work addiction', 'workaholism', 'exercise addiction',
    'food addiction', 'sugar addiction'
  ],

  recovery_general: [
    'sober', 'sobriety', 'clean', 'recovery', 'recovering',
    'in recovery', 'days sober', 'months sober', 'years sober',
    'sobriety date', 'clean date', 'anniversary', 'sober curious',
    'California sober', 'harm reduction', 'moderation',
    'AA', 'NA', '12 step', 'sponsor', 'meeting', 'chips'
  ],

  // ============================================
  // SECTION 16: INTIMACY & SEXUALITY
  // ============================================

  intimacy_general: [
    'intimacy', 'intimate', 'closeness', 'emotional intimacy',
    'physical intimacy', 'affection', 'touch', 'connection',
    'disconnected', 'roommates', 'no spark', 'passion',
    'vulnerability', 'walls up', 'let people in', 'trust issues'
  ],

  sexual_health: [
    'libido', 'sex drive', 'no desire', 'sexual dysfunction',
    'ED', 'erectile', 'performance anxiety', 'painful sex',
    'vaginismus', 'desire discrepancy', 'mismatched',
    'asexual', 'exploring', 'kink', 'shame around sex',
    'orgasm', 'arousal', 'lubrication', 'premature ejaculation'
  ],

  sexual_preferences_kink: [
    'vanilla', 'kinky', 'kink', 'BDSM', 'dominant', 'submissive',
    'dom', 'sub', 'switch', 'top', 'bottom', 'vers', 'versatile',
    'master', 'slave', 'daddy', 'mommy', 'little', 'age play',
    'bondage', 'rope', 'restraints', 'handcuffs', 'blindfold',
    'discipline', 'punishment', 'spanking', 'impact play',
    'sadism', 'masochism', 'S&M', 'pain play',
    'fetish', 'foot fetish', 'leather', 'latex', 'rubber',
    'roleplay', 'fantasy', 'costumes', 'uniforms',
    'exhibitionist', 'voyeur', 'public', 'risky',
    'threesome', 'group', 'orgy', 'swinging', 'gangbang',
    'toys', 'vibrator', 'dildo', 'plug', 'strap-on',
    'pegging', 'anal', 'oral', 'giving', 'receiving',
    'degradation', 'humiliation', 'praise kink', 'worship',
    'choking', 'breath play', 'edge play', 'risk aware',
    'safe word', 'consent', 'negotiation', 'aftercare',
    'power exchange', 'TPE', '24/7', 'lifestyle', 'bedroom only'
  ],

  sexual_relationship_style: [
    'monogamy', 'monogamous', 'exclusive', 'faithful',
    'polyamory', 'polyamorous', 'poly', 'ethical non-monogamy', 'ENM',
    'open relationship', 'open marriage', 'swinging', 'swingers',
    'relationship anarchy', 'solo poly', 'hierarchical poly',
    'primary partner', 'secondary', 'metamour', 'compersion',
    'casual', 'hookup', 'one night stand', 'fwb', 'friends with benefits',
    'no strings attached', 'NSA', 'situationship',
    'demisexual', 'need connection first', 'only with love'
  ],

  // ============================================
  // SECTION 17: CAUSES & BELIEFS
  // ============================================

  causes_environmental: [
    'environmentalism', 'environmental', 'climate change', 'climate crisis',
    'global warming', 'sustainability', 'sustainable', 'eco-friendly',
    'green', 'carbon footprint', 'renewable energy', 'solar', 'wind',
    'recycling', 'reduce reuse recycle', 'zero waste', 'plastic free',
    'composting', 'conservation', 'wildlife', 'endangered species',
    'deforestation', 'rainforest', 'ocean', 'pollution',
    'vegan for environment', 'plant-based', 'ethical consumption',
    'climate activist', 'environmental justice', 'eco-anxiety',
    'Greta Thunberg', 'extinction rebellion', 'sunrise movement'
  ],

  causes_social_justice: [
    'social justice', 'activist', 'activism', 'advocate',
    'civil rights', 'human rights', 'equality', 'equity',
    'racial justice', 'BLM', 'Black Lives Matter', 'anti-racism',
    'feminism', 'feminist', 'women\'s rights', 'reproductive rights',
    'LGBTQ rights', 'gay rights', 'trans rights', 'pride',
    'disability rights', 'accessibility', 'ableism',
    'immigration rights', 'refugee', 'asylum', 'undocumented',
    'workers rights', 'labor', 'union', 'living wage',
    'housing justice', 'homelessness', 'affordable housing',
    'criminal justice reform', 'prison abolition', 'police reform',
    'intersectionality', 'systemic', 'institutional', 'structural'
  ],

  causes_charity: [
    'charity', 'donate', 'donation', 'philanthropy', 'giving',
    'volunteer', 'volunteering', 'nonprofit', 'NGO',
    'fundraising', 'fundraiser', 'GoFundMe', 'crowdfunding',
    'giving back', 'community service', 'helping others',
    'food bank', 'soup kitchen', 'shelter', 'homeless',
    'mentor', 'mentoring', 'big brother', 'big sister',
    'animal rescue', 'animal shelter', 'foster',
    'habitat for humanity', 'red cross', 'doctors without borders',
    'tithing', 'offering', 'zakat', 'tzedakah'
  ],

  political_beliefs: [
    'liberal', 'conservative', 'progressive', 'libertarian',
    'democrat', 'republican', 'independent', 'moderate',
    'left', 'right', 'center', 'centrist', 'apolitical',
    'socialist', 'capitalist', 'communist', 'anarchist',
    'pro-life', 'pro-choice', 'gun rights', 'gun control',
    'politically active', 'not political', 'avoid politics',
    'voting', 'vote', 'elections', 'civic engagement'
  ],

  // ============================================
  // SECTION 18: WEATHER & GEOGRAPHY
  // ============================================

  weather_preferences: [
    'love the heat', 'hate the heat', 'heat intolerant',
    'love the cold', 'hate the cold', 'cold intolerant',
    'summer person', 'winter person', 'fall person', 'spring person',
    'love the sun', 'need sunshine', 'vitamin D', 'SAD',
    'love the rain', 'hate the rain', 'rainy days', 'cozy rain',
    'love snow', 'hate snow', 'snow person', 'ski weather',
    'humidity', 'dry heat', 'muggy', 'sticky', 'prefer dry',
    'perfect weather', 'ideal temperature', 'climate preference',
    'seasonal depression', 'winter blues', 'summer SAD',
    'need seasons', 'hate seasons', 'consistent weather'
  ],

  geographic_preferences: [
    'city person', 'urban', 'big city', 'metropolitan',
    'small town', 'rural', 'country', 'countryside',
    'suburbs', 'suburban', 'between city and country',
    'beach', 'coast', 'coastal', 'ocean', 'seaside',
    'mountains', 'mountain town', 'alpine', 'highlands',
    'desert', 'southwest', 'dry climate',
    'forest', 'woods', 'trees', 'green', 'nature',
    'lake', 'lakeside', 'waterfront',
    'tropical', 'island', 'caribbean', 'hawaii',
    'midwest', 'south', 'northeast', 'west coast', 'east coast',
    'europe', 'asia', 'australia', 'abroad', 'overseas',
    'want to move', 'never leaving', 'dream location',
    'stuck here', 'love where I live', 'hate where I live'
  ],

  // ============================================
  // SECTION 19: TRAVEL & VACATION
  // ============================================
  
  travel_frequency: [
    'travel often', 'travel rarely', 'never travel',
    'frequent traveler', 'once a year', 'multiple times a year',
    'haven\'t traveled in years', 'just started traveling',
    'travel for work', 'travel for pleasure', 'both',
    'staycation', 'day trips', 'weekend trips', 'long trips',
    'want to travel more', 'can\'t afford to travel',
    'afraid to fly', 'love flying', 'road trips only'
  ],

  travel_style: [
    'luxury travel', 'budget travel', 'backpacking', 'hostel',
    'all-inclusive', 'resort', 'hotel', 'airbnb', 'camping',
    'glamping', 'van life', 'RV', 'cruise',
    'solo travel', 'couple travel', 'family vacation', 'group trip',
    'adventure travel', 'relaxation', 'beach vacation', 'city break',
    'cultural immersion', 'tourist', 'off the beaten path',
    'planned itinerary', 'spontaneous', 'go with the flow',
    'touristy', 'authentic', 'local experience', 'hidden gems'
  ],

  travel_destinations_preference: [
    'domestic', 'international', 'exotic', 'tropical',
    'europe', 'asia', 'south america', 'africa', 'australia',
    'beach destinations', 'mountain destinations', 'city destinations',
    'historical sites', 'natural wonders', 'national parks',
    'foodie destinations', 'nightlife', 'cultural',
    'bucket list', 'dream destination', 'must see',
    'revisit favorites', 'new places only', 'annual trip'
  ],

  vacation_activities: [
    'relaxation', 'lay by pool', 'beach bum', 'do nothing',
    'sightseeing', 'tours', 'museums', 'landmarks',
    'adventure activities', 'hiking', 'scuba', 'snorkeling',
    'water sports', 'skiing', 'snowboarding',
    'food and drink', 'wine tasting', 'culinary', 'restaurants',
    'nightlife', 'clubs', 'bars', 'party vacation',
    'shopping', 'retail', 'markets', 'souvenirs',
    'photography', 'capturing memories', 'instagram',
    'wellness', 'spa', 'retreat', 'yoga retreat',
    'volunteering', 'voluntourism', 'giving back while traveling'
  ],

  // ============================================
  // SECTION 20: WORK & CAREER
  // ============================================
  
  work_general: [
    'job', 'work', 'career', 'profession', 'occupation',
    'employer', 'company', 'office', 'workplace', 'remote',
    'work from home', 'WFH', 'hybrid', 'in-office',
    'full-time', 'part-time', 'freelance', 'self-employed',
    'entrepreneur', 'business owner', 'startup', 'gig work',
    'side hustle', 'multiple jobs', 'consultant', 'contractor'
  ],
  
  work_attitude: [
    'love my job', 'hate my job', 'it\'s just a job', 'career focused',
    'work to live', 'live to work', 'workaholic', 'work-life balance',
    'ambitious', 'not ambitious', 'climbing the ladder', 'content where I am',
    'overachiever', 'underachiever', 'meets expectations', 'exceeds expectations',
    'passionate about work', 'paycheck', 'calling', 'vocation',
    'burned out', 'engaged', 'checked out', 'quiet quitting'
  ],

  work_goals: [
    'promotion', 'raise', 'corner office', 'C-suite', 'CEO',
    'start my own business', 'be my own boss', 'entrepreneurship',
    'retire early', 'FIRE', 'financial independence',
    'switch careers', 'career change', 'pivot',
    'go back to school', 'get degree', 'certifications',
    'make a difference', 'help people', 'meaningful work',
    'creative work', 'passion project', 'dream job'
  ],

  // ============================================
  // SECTION 21: EDUCATION
  // ============================================
  
  education_level: [
    'high school', 'GED', 'didn\'t finish high school', 'dropout',
    'some college', 'associate\'s', 'bachelor\'s', 'master\'s',
    'PhD', 'doctorate', 'postdoc', 'professional degree',
    'JD', 'MD', 'MBA', 'law school', 'med school',
    'trade school', 'vocational', 'apprenticeship',
    'self-taught', 'no formal education', 'school of hard knocks'
  ],

  education_type: [
    'public school', 'private school', 'charter school',
    'catholic school', 'religious school', 'parochial',
    'homeschool', 'homeschooled', 'unschooling',
    'boarding school', 'prep school', 'magnet school',
    'Montessori', 'Waldorf', 'alternative school',
    'community college', 'state school', 'private university',
    'Ivy League', 'elite', 'prestigious', 'online degree'
  ],

  education_experience: [
    'good student', 'bad student', 'struggled in school',
    'straight A\'s', 'honor roll', 'dean\'s list', 'valedictorian',
    'barely passed', 'failed classes', 'held back',
    'loved school', 'hated school', 'bullied at school',
    'popular at school', 'outcast at school', 'invisible',
    'class clown', 'teacher\'s pet', 'troublemaker',
    'extracurriculars', 'sports', 'clubs', 'band', 'theater'
  ],

  // ============================================
  // SECTION 22: FINANCES
  // ============================================
  
  finances_status: [
    'wealthy', 'rich', 'comfortable', 'middle class',
    'working class', 'poor', 'broke', 'struggling',
    'paycheck to paycheck', 'debt', 'in debt', 'debt free',
    'good with money', 'bad with money', 'saver', 'spender',
    'financially stable', 'financially unstable', 'insecure',
    'inherited wealth', 'self-made', 'new money', 'old money'
  ],

  finances_goals: [
    'save money', 'pay off debt', 'build wealth', 'invest',
    'retirement', 'FIRE', 'financial independence',
    'buy a house', 'buy a car', 'big purchase',
    'emergency fund', 'rainy day', 'nest egg',
    'generational wealth', 'leave inheritance', 'provide for family'
  ],

  // ============================================
  // SECTION 23: HEALTH & WELLNESS
  // ============================================
  
  health_concerns: [
    'health conscious', 'not health conscious', 'worried about health',
    'hypochondriac', 'health anxiety', 'ignore health',
    'regular checkups', 'avoid doctors', 'doctor phobia',
    'preventive care', 'reactive', 'proactive',
    'chronic illness', 'managing condition', 'disability',
    'healthy', 'unhealthy', 'trying to be healthier'
  ],

  health_conditions_chronic: [
    'diabetes', 'heart disease', 'high blood pressure', 'cholesterol',
    'asthma', 'COPD', 'autoimmune', 'arthritis', 'fibromyalgia',
    'chronic pain', 'chronic fatigue', 'migraines', 'IBS',
    'thyroid', 'cancer', 'in remission', 'survivor'
  ],

  sleep_patterns: [
    'night owl', 'early bird', 'morning person', 'not a morning person',
    'insomnia', 'sleep problems', 'sleep well', 'heavy sleeper',
    'light sleeper', 'need 8 hours', 'function on little sleep',
    'nap', 'power nap', 'siesta', 'can\'t nap',
    'sleep schedule', 'irregular sleep', 'shift work'
  ],

  // ============================================
  // SECTION 24: FOOD & DIET
  // ============================================

  food_identity: [
    'foodie', 'food lover', 'food enthusiast', 'epicurean',
    'picky eater', 'adventurous eater', 'try anything',
    'comfort food', 'junk food', 'health food', 'clean eating',
    'home cook', 'chef', 'baker', 'grill master', 'BBQ',
    'hate cooking', 'love cooking', 'can\'t cook', 'great cook'
  ],

  diet_type: [
    'vegan', 'vegetarian', 'pescatarian', 'flexitarian',
    'keto', 'paleo', 'whole30', 'Mediterranean',
    'gluten-free', 'dairy-free', 'nut-free', 'allergy',
    'low carb', 'low fat', 'calorie counting', 'intuitive eating',
    'intermittent fasting', 'OMAD', 'no diet', 'eat everything',
    'carnivore', 'raw', 'organic', 'non-GMO', 'whole foods'
  ],

  food_preferences: [
    'sweet tooth', 'savory', 'salty', 'spicy', 'mild',
    'meat lover', 'hate meat', 'seafood', 'hate seafood',
    'vegetables', 'hate vegetables', 'fruit', 'salad',
    'carbs', 'bread', 'pasta', 'rice', 'potatoes',
    'fast food', 'fine dining', 'casual dining', 'takeout',
    'ethnic food', 'American food', 'comfort classics'
  ],

  eating_habits: [
    'emotional eating', 'stress eating', 'bored eating',
    'mindful eating', 'fast eater', 'slow eater',
    'eat alone', 'eat with others', 'social eating',
    'meal prep', 'plan meals', 'spontaneous eating',
    'regular meals', 'skip meals', 'graze', 'snacker'
  ],

  // ============================================
  // SECTION 25: FITNESS & BODY
  // ============================================
  
  fitness_level: [
    'athlete', 'athletic', 'fit', 'in shape', 'out of shape',
    'active', 'sedentary', 'couch potato', 'gym rat',
    'exercise regularly', 'sometimes exercise', 'never exercise',
    'trying to get fit', 'maintaining', 'letting go'
  ],

  fitness_activities: [
    'gym', 'weights', 'cardio', 'running', 'jogging',
    'yoga', 'pilates', 'CrossFit', 'HIIT', 'spin',
    'swimming', 'cycling', 'hiking', 'walking',
    'team sports', 'individual sports', 'martial arts',
    'dance', 'Zumba', 'aerobics', 'home workouts'
  ],

  body_image: [
    'love my body', 'hate my body', 'body positive',
    'body neutral', 'body dysmorphia', 'insecure',
    'confident', 'self-conscious', 'comfortable',
    'want to lose weight', 'want to gain weight', 'want to tone',
    'happy with my body', 'working on it', 'accepting'
  ],

  // ============================================
  // SECTION 26: HOBBIES - MUSIC
  // ============================================
  
  music_instruments: [
    'guitar', 'acoustic guitar', 'electric guitar', 'classical guitar',
    'bass', 'bass guitar', 'upright bass', 'double bass',
    'piano', 'keyboard', 'keys', 'organ', 'synthesizer',
    'drums', 'percussion', 'drummer', 'drum kit',
    'violin', 'viola', 'cello', 'bass', 'strings',
    'saxophone', 'sax', 'alto sax', 'tenor sax',
    'trumpet', 'trombone', 'french horn', 'tuba', 'brass',
    'clarinet', 'flute', 'oboe', 'bassoon', 'woodwinds',
    'ukulele', 'banjo', 'mandolin', 'harmonica', 'accordion',
    'harp', 'bagpipes', 'recorder', 'ocarina',
    'DJ', 'turntables', 'production', 'beat making',
    'singing', 'vocals', 'voice', 'choir', 'a cappella'
  ],

  music_skill_level: [
    'beginner', 'intermediate', 'advanced', 'professional',
    'self-taught', 'classically trained', 'lessons',
    'can\'t read music', 'read music', 'play by ear',
    'just started', 'played for years', 'rusty', 'picking it back up'
  ],
  
  music_genres: [
    'rock', 'classic rock', 'alternative', 'indie', 'indie rock',
    'punk', 'punk rock', 'pop punk', 'hardcore', 'post-hardcore',
    'metal', 'heavy metal', 'death metal', 'black metal', 'metalcore',
    'thrash', 'doom', 'stoner metal', 'progressive metal',
    'pop', 'pop music', 'top 40', 'mainstream', 'dance pop',
    'hip hop', 'rap', 'trap', 'old school hip hop', 'conscious rap',
    'R&B', 'soul', 'funk', 'neo-soul', 'motown',
    'electronic', 'EDM', 'house', 'techno', 'trance', 'dubstep',
    'drum and bass', 'jungle', 'ambient', 'IDM', 'synthwave',
    'country', 'bluegrass', 'folk', 'Americana', 'outlaw country',
    'jazz', 'blues', 'swing', 'bebop', 'smooth jazz',
    'classical', 'orchestra', 'opera', 'chamber music',
    'reggae', 'ska', 'dub', 'dancehall',
    'world music', 'Latin', 'salsa', 'reggaeton', 'K-pop', 'J-pop',
    'lo-fi', 'shoegaze', 'dream pop', 'post-rock', 'prog rock',
    'grunge', 'emo', 'screamo', 'math rock', 'noise'
  ],

  music_listening: [
    'music lover', 'audiophile', 'vinyl', 'records', 'CDs',
    'streaming', 'Spotify', 'Apple Music', 'playlist',
    'concerts', 'live music', 'shows', 'festivals', 'tours',
    'always have music on', 'silence', 'background music',
    'lyrics person', 'melody person', 'beat person',
    'discover new music', 'same music forever', 'nostalgic'
  ],

  // ============================================
  // SECTION 27: HOBBIES - SPORTS & OUTDOOR
  // ============================================

  sports_watching: [
    'sports fan', 'not into sports', 'casual fan', 'die hard',
    'football', 'NFL', 'college football', 'fantasy football',
    'basketball', 'NBA', 'college basketball', 'March Madness',
    'baseball', 'MLB', 'soccer', 'MLS', 'Premier League', 'World Cup',
    'hockey', 'NHL', 'tennis', 'golf', 'NASCAR', 'F1',
    'UFC', 'MMA', 'boxing', 'wrestling', 'WWE',
    'Olympics', 'World Series', 'Super Bowl', 'playoffs',
    'my team', 'favorite team', 'season tickets', 'tailgate'
  ],

  sports_playing: [
    'play sports', 'used to play', 'never played sports',
    'recreational', 'competitive', 'intramural', 'adult league',
    'golf', 'tennis', 'pickleball', 'basketball', 'soccer',
    'softball', 'volleyball', 'flag football', 'ultimate frisbee',
    'bowling', 'darts', 'pool', 'billiards'
  ],

  extreme_sports: [
    'rock climbing', 'climbing', 'bouldering', 'lead climbing',
    'mountaineering', 'ice climbing', 'alpine',
    'skateboarding', 'BMX', 'mountain biking', 'motocross',
    'surfing', 'wakeboarding', 'kiteboarding', 'windsurfing',
    'skydiving', 'base jumping', 'bungee', 'paragliding',
    'parkour', 'freerunning', 'snowboarding', 'skiing',
    'adrenaline junkie', 'thrill seeker', 'extreme sports'
  ],

  outdoor_activities: [
    'hiking', 'backpacking', 'camping', 'glamping',
    'fishing', 'hunting', 'foraging', 'mushroom hunting',
    'bird watching', 'wildlife', 'nature photography',
    'kayaking', 'canoeing', 'paddleboarding', 'rafting',
    'sailing', 'boating', 'jet ski', 'water sports',
    'gardening', 'landscaping', 'farming', 'homesteading'
  ],

  outdoor_frequency: [
    'always outside', 'rarely outside', 'indoor person',
    'outdoor person', 'nature lover', 'prefer indoors',
    'need fresh air', 'need sunshine', 'vitamin D',
    'weekend warrior', 'every day outside', 'weather dependent',
    'seasonal', 'year round', 'fair weather only'
  ],

  // ============================================
  // SECTION 28: HOBBIES - CREATIVE & ARTS
  // ============================================

  visual_arts: [
    'art', 'artist', 'painting', 'drawing', 'sketching',
    'illustration', 'digital art', 'graphic design',
    'photography', 'photographer', 'videography',
    'sculpting', 'ceramics', 'pottery', 'clay',
    'printmaking', 'calligraphy', 'watercolor', 'oil painting'
  ],

  crafts: [
    'crafts', 'crafting', 'DIY', 'handmade', 'maker',
    'knitting', 'crocheting', 'sewing', 'quilting', 'embroidery',
    'woodworking', 'carpentry', 'furniture', 'carving',
    'jewelry making', 'candle making', 'soap making', 'resin',
    'leather working', 'metalworking', 'welding'
  ],

  writing_creative: [
    'writing', 'writer', 'author', 'novelist',
    'poetry', 'poet', 'short stories', 'fiction',
    'journaling', 'blogging', 'blog', 'creative writing',
    'screenwriting', 'playwriting', 'songwriting'
  ],

  performing_arts: [
    'theater', 'acting', 'actor', 'actress', 'performer',
    'improv', 'comedy', 'stand-up', 'comedian',
    'dance', 'dancer', 'ballet', 'contemporary', 'hip hop dance',
    'singing', 'singer', 'vocalist', 'musical theater'
  ],

  // ============================================
  // SECTION 29: HOBBIES - ENTERTAINMENT
  // ============================================

  reading: [
    'reading', 'books', 'reader', 'bookworm', 'bibliophile',
    'fiction', 'non-fiction', 'fantasy', 'sci-fi', 'mystery',
    'thriller', 'romance', 'horror', 'literary fiction',
    'self-help', 'biography', 'memoir', 'history', 'true crime',
    'audiobooks', 'Kindle', 'ebook', 'physical books', 'library',
    'book club', 'Goodreads', 'TBR', 'DNF'
  ],

  movies_preferences: [
    'movie buff', 'cinephile', 'film lover', 'casual viewer',
    'action', 'comedy', 'drama', 'horror', 'thriller',
    'romance', 'rom-com', 'sci-fi', 'fantasy', 'animation',
    'documentary', 'indie', 'foreign films', 'classic films',
    'Marvel', 'DC', 'superhero', 'franchise', 'sequels',
    'theater', 'streaming', 'home theater', 'movie night'
  ],

  tv_preferences: [
    'TV shows', 'series', 'binge watching', 'streaming',
    'drama', 'comedy', 'sitcom', 'reality TV', 'documentary',
    'crime', 'procedural', 'sci-fi', 'fantasy', 'animated',
    'limited series', 'miniseries', 'long-running',
    'Netflix', 'HBO', 'Hulu', 'Disney+', 'Prime', 'Apple TV'
  ],

  gaming: [
    'gamer', 'gaming', 'video games', 'PC gaming', 'console',
    'PlayStation', 'Xbox', 'Nintendo', 'Switch', 'Steam',
    'RPG', 'FPS', 'shooter', 'strategy', 'puzzle', 'platformer',
    'MMORPG', 'multiplayer', 'single player', 'co-op',
    'competitive', 'esports', 'casual', 'mobile gaming',
    'board games', 'tabletop', 'D&D', 'card games', 'chess'
  ],

  // ============================================
  // SECTION 30: HOBBIES - VEHICLES & TECH
  // ============================================

  cars_vehicles: [
    'car enthusiast', 'gearhead', 'petrolhead', 'motorhead',
    'classic cars', 'vintage', 'muscle cars', 'sports cars',
    'luxury cars', 'exotic', 'supercars', 'hypercars',
    'trucks', 'SUVs', 'off-roading', '4x4', 'Jeep',
    'motorcycles', 'bikes', 'riding', 'Harley', 'sportbike',
    'Tesla', 'EV', 'electric', 'hybrid', 'eco-friendly',
    'racing', 'track days', 'autocross', 'drag racing',
    'car shows', 'car meets', 'restoration', 'project car',
    'modifications', 'tuning', 'performance', 'customization'
  ],

  technology_relationship: [
    'tech savvy', 'not tech savvy', 'technophobe', 'early adopter',
    'love technology', 'hate technology', 'necessary evil',
    'always on phone', 'digital detox', 'screen time',
    'iPhone', 'Android', 'Apple', 'Windows', 'Mac', 'Linux',
    'social media addict', 'no social media', 'minimal social media',
    'gaming PC', 'smart home', 'gadgets', 'latest tech'
  ],

  social_media_usage: [
    'always online', 'rarely online', 'no social media',
    'Instagram', 'TikTok', 'Twitter', 'Facebook', 'LinkedIn',
    'Reddit', 'YouTube', 'Twitch', 'Discord', 'Snapchat',
    'lurker', 'poster', 'content creator', 'influencer',
    'doom scrolling', 'screen time', 'digital wellbeing',
    'hours a day', 'check constantly', 'put phone down',
    'FOMO', 'comparison', 'curated life', 'authentic'
  ],

  // ============================================
  // SECTION 31: HOBBIES - COLLECTING & SPECIALTY
  // ============================================

  collecting: [
    'collector', 'collecting', 'collection', 'hobby',
    'vintage', 'antiques', 'thrifting', 'estate sales',
    'vinyl', 'records', 'comics', 'trading cards',
    'coins', 'stamps', 'memorabilia', 'autographs',
    'action figures', 'Funko', 'LEGO', 'figurines',
    'sneakers', 'watches', 'jewelry', 'art', 'rare books'
  ],

  // ============================================
  // SECTION 32: LIFE GOALS & AMBITIONS
  // ============================================

  life_goals_general: [
    'goals', 'dreams', 'aspirations', 'bucket list',
    'five year plan', 'ten year plan', 'life plan',
    'vision', 'purpose', 'mission', 'calling',
    'what I want', 'where I see myself', 'ideal life'
  ],

  life_goals_specific: [
    'get married', 'have kids', 'buy a house', 'travel the world',
    'start a business', 'write a book', 'learn an instrument',
    'get in shape', 'run a marathon', 'climb a mountain',
    'learn a language', 'go back to school', 'change careers',
    'retire early', 'financial freedom', 'passive income',
    'make a difference', 'leave a legacy', 'be remembered',
    'find love', 'find happiness', 'find peace', 'find myself'
  ],

  achievement_orientation: [
    'overachiever', 'high achiever', 'ambitious', 'driven',
    'underachiever', 'low achiever', 'unmotivated', 'lazy',
    'perfectionist', 'good enough', 'mediocre', 'excellence',
    'goal-oriented', 'process-oriented', 'journey vs destination',
    'competitive', 'non-competitive', 'compete with self',
    'success-driven', 'contentment', 'satisfaction', 'enough'
  ],

  relaxation_vs_achievement: [
    'relaxation', 'rest', 'chill', 'take it easy',
    'hustle', 'grind', 'no days off', 'rise and grind',
    'work hard play hard', 'balance', 'burned out',
    'slow living', 'simple life', 'minimalism',
    'ambitious', 'content', 'striving', 'accepting',
    'need to relax', 'can\'t relax', 'guilt when resting',
    'productive', 'unproductive', 'lazy', 'busy'
  ],

  // ============================================
  // SECTION 33: CHANGE & ADAPTABILITY
  // ============================================

  openness_to_change: [
    'open to change', 'resistant to change', 'fear of change',
    'adaptable', 'flexible', 'rigid', 'stuck in ways',
    'spontaneous', 'planned', 'routine', 'variety',
    'try new things', 'prefer familiar', 'comfort zone',
    'adventurous', 'cautious', 'risk taker', 'risk averse',
    'embrace change', 'hate change', 'change is hard',
    'growth mindset', 'fixed mindset', 'learning', 'evolving'
  ],

  // ============================================
  // SECTION 34: SPIRITUALITY & MINDFULNESS
  // ============================================
  
  meditation_practice: [
    'meditate', 'meditation', 'mindfulness', 'mindful',
    'daily meditation', 'sometimes meditate', 'tried meditation',
    'can\'t meditate', 'mind won\'t stop', 'racing thoughts',
    'guided meditation', 'silent meditation', 'app', 'Headspace', 'Calm',
    'breath work', 'breathing exercises', 'pranayama',
    'visualization', 'body scan', 'progressive relaxation',
    'transcendental', 'TM', 'mantra', 'zazen', 'vipassana',
    'retreats', 'silent retreat', 'meditation teacher'
  ],

  spirituality: [
    'spiritual', 'spirituality', 'soul', 'higher power',
    'religious', 'not religious', 'spiritual but not religious',
    'agnostic', 'atheist', 'believer', 'faith',
    'Christian', 'Catholic', 'Jewish', 'Muslim', 'Hindu', 'Buddhist',
    'new age', 'crystals', 'tarot', 'astrology', 'manifestation',
    'energy', 'chakras', 'reiki', 'healing', 'psychic',
    'church', 'temple', 'mosque', 'synagogue', 'sangha',
    'prayer', 'worship', 'scripture', 'sacred', 'divine'
  ],

  // ============================================
  // SECTION 35: PROMISES & COMMITMENTS
  // ============================================

  promises_to_self: [
    'promised myself', 'promise to myself', 'committed to',
    'swore I would', 'swore I wouldn\'t', 'vowed', 'vow',
    'resolution', 'New Year\'s resolution', 'this time I will',
    'never again', 'done with', 'I\'m going to', 'I will',
    'starting tomorrow', 'starting Monday', 'this is the last time'
  ],

  promises_patterns: [
    'keep promises', 'break promises', 'follow through',
    'reliable', 'unreliable', 'dependable', 'flaky',
    'commitment issues', 'afraid to commit', 'all in',
    'start but don\'t finish', 'finish what I start',
    'self-sabotage', 'get in my own way', 'trust myself'
  ],

  // ============================================
  // SECTION 36: COGNITIVE & EMOTIONAL PATTERNS
  // ============================================

  attachment_styles: [
    'anxious attachment', 'avoidant attachment', 'disorganized',
    'secure attachment', 'insecure attachment', 'fearful avoidant',
    'dismissive avoidant', 'anxious-preoccupied',
    'codependent', 'enmeshed', 'fear of abandonment',
    'fear of intimacy', 'push-pull', 'hot and cold', 'clingy'
  ],

  boundaries: [
    'boundary', 'boundaries', 'setting boundaries', 'can\'t say no',
    'people pleaser', 'people pleasing', 'doormat', 'pushover',
    'porous boundaries', 'rigid boundaries', 'healthy boundaries',
    'violated', 'crossed a line', 'disrespected', 'taken advantage of'
  ],

  inner_critic: [
    'inner critic', 'negative self-talk', 'voice in my head',
    'beating myself up', 'too hard on myself', 'self-critical',
    'never good enough', 'imposter syndrome', 'fraud',
    'don\'t deserve', 'not worthy', 'self-sabotage'
  ],

  perfectionism: [
    'perfectionist', 'perfectionism', 'never good enough',
    'high standards', 'impossible standards', 'all or nothing',
    'fear of failure', 'fear of making mistakes', 'paralyzed',
    'procrastinating', 'avoiding', 'analysis paralysis'
  ],

  cognitive_distortions: [
    'catastrophizing', 'black and white thinking', 'all or nothing',
    'mind reading', 'fortune telling', 'jumping to conclusions',
    'should statements', 'labeling', 'overgeneralizing',
    'filtering', 'discounting positives', 'personalizing',
    'emotional reasoning', 'magnifying', 'minimizing'
  ],

  // ============================================
  // SECTION 37: TRAUMA & ABUSE
  // ============================================
  
  trauma_types: [
    'trauma', 'traumatic', 'PTSD', 'C-PTSD', 'complex trauma',
    'childhood trauma', 'developmental trauma', 'attachment trauma',
    'intergenerational trauma', 'generational trauma',
    'medical trauma', 'birth trauma', 'betrayal trauma',
    'ACEs', 'adverse childhood experiences'
  ],
  
  abuse_types: [
    'abuse', 'abused', 'abusive', 'domestic violence',
    'physical abuse', 'emotional abuse', 'psychological abuse',
    'verbal abuse', 'sexual abuse', 'financial abuse',
    'neglect', 'abandonment', 'spiritual abuse'
  ],

  // ============================================
  // SECTION 38: DEATH & GRIEF
  // ============================================
  
  grief_process: [
    'grief', 'grieving', 'mourning', 'bereavement', 'loss',
    'died', 'death', 'passed away', 'lost',
    'funeral', 'memorial', 'anniversary of death',
    'complicated grief', 'anticipatory grief', 'disenfranchised grief'
  ],

  // ============================================
  // SECTION 39: TEMPORAL PATTERNS
  // ============================================
  
  temporal_recurring: [
    'every time', 'always', 'never', 'usually', 'typically',
    'every day', 'daily', 'weekly', 'monthly', 'yearly',
    'around this time', 'this time of year', 'seasonal',
    'Sunday scaries', 'Monday blues', 'midweek slump'
  ],

  // ============================================
  // SECTION 40: COMMUNICATION PREFERENCES
  // ============================================
  
  communication_style: [
    'direct', 'indirect', 'blunt', 'tactful', 'diplomatic',
    'verbose', 'concise', 'detail-oriented', 'big picture',
    'logical', 'emotional', 'facts', 'feelings',
    'listener', 'talker', 'quiet', 'chatty',
    'text', 'call', 'in person', 'video chat',
    'email', 'instant message', 'hate phone calls', 'prefer calls'
  ],

  preference_validation_vs_solutions: [
    'just need to vent', 'not looking for advice', 'just want to be heard',
    'need advice', 'help me figure out', 'what should I do',
    'need support', 'need encouragement', 'validate me',
    'problem-solving', 'practical help', 'fix it'
  ],

  // ============================================
  // SECTION 41: COPING & SELF-CARE
  // ============================================
  
  coping_healthy: [
    'coping', 'self-care', 'therapy', 'journaling', 'meditation',
    'exercise', 'talking to', 'support system', 'boundaries',
    'rest', 'break', 'time off', 'bubble bath', 'spa day'
  ],
  
  coping_unhealthy: [
    'avoiding', 'numbing', 'escaping', 'isolating',
    'binge', 'retail therapy', 'doom scrolling',
    'not sleeping', 'not eating', 'overeating',
    'drinking more', 'smoking more', 'zoning out'
  ]
};

// ============================================
// HIGH-SIGNAL THERAPEUTIC PHRASES
// ============================================

export const HIGH_SIGNAL_PHRASES = {
  breakthroughs: [
    'just realized', 'finally understand', 'clicked', 'aha moment',
    'pattern', 'keep doing', 'always end up', 'cycle', 'repeat',
    'connection', 'makes sense now', 'see it clearly'
  ],
  
  readiness_for_change: [
    'ready to', 'done with', 'can\'t keep', 'something has to change',
    'turning point', 'wake up call', 'last straw', 'enough is enough',
    'time to', 'need to change', 'want to change'
  ],
  
  core_wounds: [
    'not enough', 'too much', 'unlovable', 'broken', 'damaged',
    'fundamentally flawed', 'something wrong with me',
    'defective', 'worthless', 'invisible', 'burden'
  ],
  
  relationship_to_self: [
    'relationship with myself', 'how I treat myself', 'inner voice',
    'self-worth', 'self-esteem', 'confidence', 'believe in myself',
    'trust myself', 'know myself', 'accept myself'
  ],

  childhood_links: [
    'growing up', 'when I was a kid', 'my parents always',
    'never allowed to', 'had to be', 'learned early',
    'same pattern', 'just like my mother', 'just like my father',
    'breaking the cycle', 'don\'t want to be like'
  ]
};

// ============================================
// SEVERITY MARKERS
// ============================================

export const SEVERITY_MARKERS = {
  high_distress: [
    'crisis', 'emergency', 'can\'t cope', 'falling apart',
    'rock bottom', 'worst', 'desperate', 'hopeless',
    'unbearable', 'can\'t take it', 'breaking point'
  ],
  
  moderate_distress: [
    'struggling', 'hard time', 'difficult', 'challenging',
    'overwhelmed', 'stressed', 'anxious', 'worried',
    'frustrated', 'upset', 'bothered', 'troubled'
  ],
  
  positive: [
    'happy', 'excited', 'proud', 'grateful', 'thankful',
    'hopeful', 'optimistic', 'relieved', 'peaceful',
    'better', 'improving', 'progress'
  ],
  
  neutral: [
    'okay', 'fine', 'alright', 'so-so', 'meh',
    'not bad', 'getting by', 'managing', 'surviving'
  ]
};

// ============================================
// COMPRESSION TEMPLATES
// ============================================

export const COMPRESSION_TEMPLATES = {
  identity: "{trait}:{strength}:{context}",
  // e.g., "introvert:strong:social situations"

  relationship: "{name}:{role}:{dynamic}:{status}",
  // e.g., "Sarah:partner:supportive:married 5y"
  
  parenting_received: "{style}:{warmth}:{impact}",
  // e.g., "authoritarian:low warmth:perfectionism"

  parenting_giving: "{style}:{approach}:{challenge}",
  // e.g., "gentle:responsive:consistency"

  childhood: "{household}:{stability}:{correlation}",
  // e.g., "chaotic:unstable:anxiety"

  condition: "{condition}:{severity}:{since}:{treatment}",
  // e.g., "anxiety:moderate:2020:therapy+lexapro"
  
  pattern: "{trigger}→{response}:{frequency}",
  // e.g., "criticism→shutdown:always"

  preference: "{domain}:{like}:{dislike}",
  // e.g., "weather:cold+rain:humidity"

  hobby: "{activity}:{skill}:{frequency}:{social}",
  // e.g., "guitar:intermediate:daily:solo"

  substance: "{substance}:{pattern}:{context}:{concern}",
  // e.g., "psychedelics:occasional:therapeutic:low"

  love_language: "{give}:{receive}:{mismatch}",
  // e.g., "acts of service:words of affirmation:partner mismatch"

  learning: "{style}:{strength}:{weakness}",
  // e.g., "visual:diagrams:lectures"

  goal: "{goal}:{timeline}:{blocker}",
  // e.g., "start business:2 years:fear of failure"
};

// ============================================
// ENTITY EXTRACTION PATTERNS (REGEX)
// ============================================

export const ENTITY_PATTERNS = {
  named_person: /my\s+(mom|dad|mother|father|partner|husband|wife|brother|sister|friend|boss|therapist|doctor|psychiatrist|best friend)\s+([A-Z][a-z]+)/gi,
  
  date_mention: /(?:since|in|around|back in|last|started|began)\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|\d{4}|\d{1,2}\/\d{1,2})/gi,
  
  duration: /(?:for|been|over)\s+(\d+)\s+(days?|weeks?|months?|years?)/gi,
  
  age: /(?:i'm|i am|turned|turning)\s+(\d{1,2})/gi,

  friend_count: /(?:have|got|only have)\s+(\d+|a few|no|many|lots of)\s+(?:close\s+)?friends?/gi,

  screen_time: /(\d+)\s+hours?\s+(?:a day|daily|of screen time|on (?:my )?phone)/gi,
};

// ============================================
// CATEGORY GROUPINGS
// ============================================

export const CATEGORY_GROUPS = {
  identity: [
    'identity_core', 'identity_gender_sexuality', 'identity_neurodivergence',
    'identity_cultural', 'identity_social_labels',
    'personality_archetypes', 'personality_traits', 'personality_types_systems'
  ],

  thinking_learning: [
    'thinking_style', 'learning_style'
  ],

  emotional_expression: [
    'emotional_expression', 'love_languages', 'gift_preferences'
  ],
  
  relationships: [
    'relationship_romantic_people', 'relationship_romantic_status',
    'relationship_style_preference', 'relationship_dynamics_power',
    'relationship_romantic_dynamics'
  ],

  family: [
    'family_immediate', 'family_extended', 'family_in_laws', 'family_blended',
    'family_dynamics', 'family_children_dynamics'
  ],

  parenting: [
    'parenting_style_received', 'childhood_household', 'childhood_correlations',
    'parenting_style_giving', 'parenting_challenges', 'parenting_dynamics'
  ],
  
  social: [
    'friendships_people', 'friendships_quantity', 'friendships_dynamics',
    'social_behavior', 'party_social_events'
  ],

  causes_beliefs: [
    'causes_environmental', 'causes_social_justice', 'causes_charity',
    'political_beliefs'
  ],

  geography_weather: [
    'weather_preferences', 'geographic_preferences'
  ],

  travel: [
    'travel_frequency', 'travel_style', 'travel_destinations_preference',
    'vacation_activities'
  ],

  substances: [
    'substances_alcohol', 'substances_cannabis', 'substances_psychedelics',
    'psychedelic_use_context', 'substances_stimulants', 'substances_opioids',
    'substances_other', 'addiction_behavioral', 'recovery_general'
  ],

  sexuality: [
    'intimacy_general', 'sexual_health', 'sexual_preferences_kink',
    'sexual_relationship_style'
  ],

  mental_health: [
    'mental_health_providers', 'mental_health_general_states',
    'conditions_mood', 'conditions_anxiety', 'conditions_trauma',
    'conditions_ocd_related', 'conditions_eating', 'conditions_personality',
    'therapy_types', 'medications_general', 'medications_psych'
  ],

  health_wellness: [
    'health_concerns', 'health_conditions_chronic', 'sleep_patterns'
  ],

  food_fitness: [
    'food_identity', 'diet_type', 'food_preferences', 'eating_habits',
    'fitness_level', 'fitness_activities', 'body_image'
  ],

  hobbies_music: [
    'music_instruments', 'music_skill_level', 'music_genres', 'music_listening'
  ],

  hobbies_sports: [
    'sports_watching', 'sports_playing', 'extreme_sports',
    'outdoor_activities', 'outdoor_frequency'
  ],

  hobbies_creative: [
    'visual_arts', 'crafts', 'writing_creative', 'performing_arts'
  ],

  hobbies_entertainment: [
    'reading', 'movies_preferences', 'tv_preferences', 'gaming'
  ],

  hobbies_tech: [
    'cars_vehicles', 'technology_relationship', 'social_media_usage', 'collecting'
  ],

  life_goals: [
    'life_goals_general', 'life_goals_specific', 'achievement_orientation',
    'relaxation_vs_achievement', 'openness_to_change'
  ],

  spirituality: [
    'meditation_practice', 'spirituality'
  ],

  cognitive_patterns: [
    'attachment_styles', 'boundaries', 'inner_critic',
    'perfectionism', 'cognitive_distortions'
  ],

  communication: [
    'communication_style', 'preference_validation_vs_solutions'
  ],

  coping: [
    'coping_healthy', 'coping_unhealthy'
  ]
};

// ============================================
// EXPORT STATISTICS
// ============================================

export const getPatternStats = () => {
  let totalKeywords = 0;
  let categoryCount = 0;
  
  for (const keywords of Object.values(MEMORY_EXTRACTION_PATTERNS)) {
    totalKeywords += keywords.length;
    categoryCount++;
  }
  
  return {
    totalKeywords,
    categoryCount,
    severityMarkers: Object.values(SEVERITY_MARKERS).flat().length,
    highSignalPhrases: Object.values(HIGH_SIGNAL_PHRASES).flat().length
  };
};
