// memory-extraction-patterns.ts
// Comprehensive keyword detection for personal context extraction
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
  // IDENTITY & DEMOGRAPHICS
  // ============================================
  
  identity_core: [
    'my name is', 'i am', 'i\'m a', 'years old', 'i live in',
    'i\'m from', 'moved to', 'born in', 'grew up in', 'raised in',
    'nationality', 'ethnicity', 'background'
  ],
  
  identity_gender_sexuality: [
    'coming out', 'came out', 'transition', 'transitioning', 'transitioned',
    'gender identity', 'non-binary', 'transgender', 'cisgender',
    'gay', 'lesbian', 'bisexual', 'pansexual', 'asexual', 'queer',
    'sexuality', 'orientation', 'LGBTQ', 'closeted', 'out to',
    'deadname', 'pronouns', 'they/them', 'he/him', 'she/her'
  ],
  
  identity_neurodivergence: [
    'ADHD', 'autism', 'autistic', 'ASD', 'on the spectrum',
    'neurodivergent', 'neurotypical', 'dyslexia', 'dyslexic',
    'dyscalculia', 'dyspraxia', 'sensory processing',
    'executive function', 'hyperfocus', 'stimming', 'masking',
    'special interest', 'infodump', 'burnout', 'meltdown', 'shutdown'
  ],

  // ============================================
  // RELATIONSHIPS - ROMANTIC
  // ============================================
  
  relationship_romantic_people: [
    'partner', 'husband', 'wife', 'spouse', 'boyfriend', 'girlfriend',
    'fiancé', 'fiancée', 'significant other', 'SO', 'lover',
    'ex', 'ex-husband', 'ex-wife', 'ex-boyfriend', 'ex-girlfriend',
    'the one', 'soulmate', 'person i\'m seeing', 'situationship'
  ],
  
  relationship_romantic_status: [
    'married', 'engaged', 'dating', 'single', 'divorced', 'separated',
    'widowed', 'in a relationship', 'it\'s complicated', 'open relationship',
    'polyamorous', 'monogamous', 'long distance', 'living together',
    'moved in', 'cohabiting'
  ],
  
  relationship_romantic_events: [
    'anniversary', 'wedding', 'proposal', 'engaged', 'breakup',
    'broke up', 'getting divorced', 'separation', 'reconciled',
    'got back together', 'met on', 'first date', 'honeymoon',
    'eloped', 'vow renewal'
  ],
  
  relationship_romantic_dynamics: [
    'fighting', 'argument', 'disagreement', 'not speaking',
    'couples therapy', 'marriage counseling', 'trust issues',
    'cheating', 'infidelity', 'affair', 'betrayal', 'forgiveness',
    'growing apart', 'falling out of love', 'rekindled',
    'communication issues', 'intimacy', 'love language'
  ],

  // ============================================
  // RELATIONSHIPS - FAMILY
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
    'adoptive', 'adopted', 'birth parent', 'biological', 'foster'
  ],
  
  family_dynamics: [
    'estranged', 'no contact', 'low contact', 'NC', 'LC',
    'toxic family', 'family drama', 'dysfunctional', 'enmeshed',
    'boundaries', 'golden child', 'scapegoat', 'favoritism',
    'narcissistic parent', 'helicopter parent', 'neglectful',
    'codependent', 'enabling', 'family therapy'
  ],
  
  family_events: [
    'family reunion', 'thanksgiving', 'christmas', 'holidays with family',
    'family dinner', 'family vacation', 'visiting family',
    'moved back home', 'empty nest', 'sandwich generation'
  ],

  // ============================================
  // RELATIONSHIPS - FRIENDSHIPS
  // ============================================
  
  friendships_people: [
    'best friend', 'BFF', 'close friend', 'friend group', 'squad',
    'childhood friend', 'old friend', 'new friend', 'work friend',
    'acquaintance', 'frenemy', 'mutual friend'
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
    'people pleaser', 'social battery', 'need alone time'
  ],

  // ============================================
  // PETS & ANIMALS
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
  // MENTAL HEALTH - GENERAL
  // ============================================
  
  mental_health_providers: [
    'therapy', 'therapist', 'counselor', 'counseling', 'psychologist',
    'psychiatrist', 'mental health', 'psych', 'shrink',
    'social worker', 'LCSW', 'LPC', 'psychotherapist',
    'life coach', 'support group', 'group therapy'
  ],
  
  mental_health_therapy_types: [
    'CBT', 'cognitive behavioral', 'DBT', 'dialectical',
    'EMDR', 'trauma therapy', 'talk therapy', 'psychoanalysis',
    'somatic', 'IFS', 'internal family systems', 'ACT',
    'exposure therapy', 'mindfulness-based'
  ],
  
  mental_health_general_states: [
    'struggling', 'overwhelmed', 'burnt out', 'burnout',
    'stressed', 'anxious', 'depressed', 'numb', 'empty',
    'hopeless', 'helpless', 'stuck', 'lost', 'confused',
    'frustrated', 'angry', 'resentful', 'bitter', 'exhausted',
    'drained', 'depleted', 'running on empty'
  ],

  // ============================================
  // MENTAL HEALTH - CONDITIONS
  // ============================================
  
  conditions_mood: [
    'depression', 'depressed', 'major depressive', 'MDD',
    'bipolar', 'bipolar disorder', 'manic', 'mania', 'hypomania',
    'mood disorder', 'dysthymia', 'persistent depressive',
    'seasonal depression', 'SAD', 'postpartum depression', 'PPD'
  ],
  
  conditions_anxiety: [
    'anxiety', 'anxious', 'generalized anxiety', 'GAD',
    'panic attack', 'panic disorder', 'agoraphobia',
    'social anxiety', 'phobia', 'health anxiety', 'hypochondria',
    'separation anxiety', 'performance anxiety'
  ],
  
  conditions_trauma: [
    'PTSD', 'post-traumatic', 'trauma', 'traumatic', 'C-PTSD',
    'complex trauma', 'developmental trauma', 'triggered',
    'flashback', 'hypervigilance', 'dissociation', 'dissociating',
    'nightmare', 'night terror'
  ],
  
  conditions_ocd_related: [
    'OCD', 'obsessive compulsive', 'intrusive thoughts',
    'compulsions', 'rituals', 'contamination', 'checking',
    'pure O', 'harm OCD', 'relationship OCD', 'ROCD'
  ],
  
  conditions_eating: [
    'eating disorder', 'ED', 'anorexia', 'bulimia', 'binge eating',
    'BED', 'ARFID', 'orthorexia', 'restricting', 'purging',
    'body dysmorphia', 'BDD', 'disordered eating'
  ],
  
  conditions_personality: [
    'BPD', 'borderline', 'NPD', 'narcissistic', 'ASPD',
    'personality disorder', 'avoidant', 'dependent',
    'splitting', 'favorite person', 'FP'
  ],
  
  conditions_other: [
    'psychosis', 'schizophrenia', 'schizoaffective', 'delusions',
    'hallucinations', 'hearing voices', 'paranoia', 'paranoid',
    'derealization', 'depersonalization'
  ],

  // ============================================
  // MENTAL HEALTH - SYMPTOMS & EXPERIENCES
  // ============================================
  
  symptoms_depression: [
    'can\'t get out of bed', 'no motivation', 'no energy',
    'sleeping all day', 'can\'t sleep', 'insomnia', 'hypersomnia',
    'lost interest', 'anhedonia', 'nothing feels good',
    'worthless', 'guilty', 'self-loathing', 'hate myself',
    'can\'t concentrate', 'brain fog', 'forgetful'
  ],
  
  symptoms_anxiety: [
    'racing thoughts', 'can\'t stop thinking', 'overthinking',
    'catastrophizing', 'worst case scenario', 'what if',
    'heart racing', 'chest tight', 'can\'t breathe',
    'shaking', 'sweating', 'dizzy', 'nauseous',
    'on edge', 'restless', 'can\'t relax', 'keyed up'
  ],
  
  symptoms_crisis: [
    'breakdown', 'mental breakdown', 'crisis', 'spiraling',
    'rock bottom', 'falling apart', 'can\'t cope', 'can\'t function',
    'called in sick', 'couldn\'t go to work', 'hospitalized',
    'inpatient', 'outpatient', 'PHP', 'IOP', 'intensive outpatient'
  ],

  // ============================================
  // MENTAL HEALTH - MEDICATIONS
  // ============================================
  
  medications_general: [
    'medication', 'meds', 'prescribed', 'prescription',
    'dosage', 'dose', 'increased dose', 'decreased dose',
    'tapering', 'weaning off', 'withdrawal', 'side effects',
    'not working', 'started taking', 'stopped taking'
  ],
  
  medications_antidepressants: [
    'antidepressant', 'SSRI', 'SNRI', 'MAOI', 'tricyclic',
    'Lexapro', 'escitalopram', 'Zoloft', 'sertraline',
    'Prozac', 'fluoxetine', 'Paxil', 'paroxetine',
    'Celexa', 'citalopram', 'Effexor', 'venlafaxine',
    'Cymbalta', 'duloxetine', 'Wellbutrin', 'bupropion',
    'Trintellix', 'Viibryd', 'Remeron', 'mirtazapine'
  ],
  
  medications_anxiety: [
    'Xanax', 'alprazolam', 'Klonopin', 'clonazepam',
    'Ativan', 'lorazepam', 'Valium', 'diazepam',
    'benzodiazepine', 'benzo', 'Buspar', 'buspirone',
    'hydroxyzine', 'Vistaril', 'propranolol', 'beta blocker'
  ],
  
  medications_mood_stabilizers: [
    'mood stabilizer', 'Lithium', 'Lamictal', 'lamotrigine',
    'Depakote', 'valproic acid', 'Tegretol', 'carbamazepine',
    'Trileptal', 'oxcarbazepine'
  ],
  
  medications_antipsychotics: [
    'antipsychotic', 'Abilify', 'aripiprazole', 'Seroquel', 'quetiapine',
    'Risperdal', 'risperidone', 'Zyprexa', 'olanzapine',
    'Latuda', 'lurasidone', 'Vraylar', 'cariprazine'
  ],
  
  medications_adhd: [
    'Adderall', 'amphetamine', 'Vyvanse', 'lisdexamfetamine',
    'Ritalin', 'methylphenidate', 'Concerta', 'Focalin',
    'Strattera', 'atomoxetine', 'stimulant', 'non-stimulant'
  ],
  
  medications_sleep: [
    'sleep aid', 'Ambien', 'zolpidem', 'Lunesta', 'eszopiclone',
    'trazodone', 'melatonin', 'Benadryl', 'diphenhydramine'
  ],

  // ============================================
  // SELF-HARM & SUICIDE (HANDLE WITH CARE)
  // ============================================
  
  self_harm: [
    'self-harm', 'self harm', 'cutting', 'cut myself',
    'hurting myself', 'hurt myself', 'burning', 'scratching',
    'hitting myself', 'punching walls', 'head banging',
    'scars', 'urges', 'clean', 'relapsed'
  ],
  
  suicidal: [
    'suicidal', 'suicide', 'kill myself', 'end my life',
    'don\'t want to be here', 'want to die', 'wish I was dead',
    'not worth living', 'no point', 'better off without me',
    'suicidal ideation', 'SI', 'passive suicidal', 'active suicidal',
    'plan', 'attempt', 'survived', 'hospitalized for'
  ],
  
  crisis_resources: [
    'hotline', 'crisis line', '988', 'crisis text line',
    'emergency', 'ER', 'psych ward', 'psychiatric hospital',
    'safety plan', 'wellness check'
  ],

  // ============================================
  // ADDICTION & RECOVERY
  // ============================================
  
  addiction_substances: [
    'addiction', 'addicted', 'addict', 'substance abuse',
    'alcoholic', 'alcoholism', 'drinking', 'drunk',
    'drug', 'drugs', 'using', 'high', 'wasted',
    'opioid', 'heroin', 'fentanyl', 'pills', 'painkillers',
    'cocaine', 'meth', 'weed', 'marijuana', 'cannabis'
  ],
  
  addiction_behavioral: [
    'gambling', 'gambling addiction', 'porn addiction',
    'sex addiction', 'shopping addiction', 'gaming addiction',
    'internet addiction', 'social media addiction',
    'compulsive', 'can\'t stop'
  ],
  
  recovery_general: [
    'sober', 'sobriety', 'clean', 'recovery', 'recovering',
    'in recovery', 'days sober', 'months sober', 'years sober',
    'sobriety date', 'clean date', 'anniversary'
  ],
  
  recovery_programs: [
    'AA', 'Alcoholics Anonymous', 'NA', 'Narcotics Anonymous',
    'Al-Anon', 'SMART Recovery', '12 step', 'twelve step',
    'sponsor', 'sponsee', 'meeting', 'meetings', 'home group',
    'chips', 'coins', 'medallion', 'step work', 'big book'
  ],
  
  recovery_events: [
    'relapse', 'relapsed', 'slip', 'slipped', 'fell off the wagon',
    'detox', 'withdrawal', 'withdrawing', 'rehab', 'treatment',
    'inpatient treatment', 'outpatient treatment', 'sober house',
    'halfway house', 'intervention'
  ],

  // ============================================
  // TRAUMA & ABUSE
  // ============================================
  
  trauma_types: [
    'trauma', 'traumatic', 'traumatized', 'PTSD', 'C-PTSD',
    'childhood trauma', 'developmental trauma', 'complex trauma',
    'intergenerational trauma', 'generational trauma',
    'medical trauma', 'birth trauma', 'war trauma'
  ],
  
  abuse_types: [
    'abuse', 'abused', 'abusive', 'domestic violence', 'DV',
    'physical abuse', 'emotional abuse', 'psychological abuse',
    'verbal abuse', 'sexual abuse', 'financial abuse',
    'neglect', 'neglected', 'abandonment', 'abandoned'
  ],
  
  abuse_relationships: [
    'abusive relationship', 'abusive partner', 'narcissistic abuse',
    'gaslighting', 'gaslit', 'manipulation', 'manipulated',
    'controlling', 'coercive control', 'love bombing',
    'isolation', 'isolated me', 'threatened'
  ],
  
  abuse_recovery: [
    'survivor', 'victim', 'escaped', 'left', 'got out',
    'restraining order', 'protective order', 'shelter',
    'safe house', 'safe now', 'healing', 'recovering'
  ],
  
  sexual_trauma: [
    'assault', 'sexual assault', 'SA', 'rape', 'raped',
    'molested', 'molestation', 'harassment', 'harassed',
    'consent', 'non-consensual', 'coerced', 'pressured',
    '#MeToo', 'speaking out', 'came forward'
  ],

  // ============================================
  // WORK & CAREER
  // ============================================
  
  work_general: [
    'job', 'work', 'career', 'profession', 'occupation',
    'employer', 'company', 'office', 'workplace', 'remote',
    'work from home', 'WFH', 'hybrid', 'in-office',
    'full-time', 'part-time', 'freelance', 'self-employed',
    'entrepreneur', 'business owner', 'startup'
  ],
  
  work_people: [
    'boss', 'manager', 'supervisor', 'coworker', 'colleague',
    'team', 'direct report', 'employee', 'intern',
    'mentor', 'mentee', 'client', 'customer'
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
    'passed over', 'didn\'t get the job'
  ],
  
  work_stress: [
    'burnout', 'burnt out', 'overworked', 'overwhelmed',
    'toxic workplace', 'toxic boss', 'micromanaged',
    'undervalued', 'underpaid', 'exploited', 'taken advantage of',
    'work-life balance', 'no boundaries', 'always on',
    'Sunday scaries', 'dreading Monday', 'hate my job'
  ],
  
  work_events: [
    'interview', 'interviewing', 'performance review',
    'PIP', 'performance improvement', 'written up',
    'meeting', 'presentation', 'deadline', 'project',
    'conference', 'business trip', 'training'
  ],

  // ============================================
  // EDUCATION
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
    'community college', 'online degree'
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
  // FINANCES
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
  // HOUSING & LIVING SITUATION
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
    'housing insecurity', 'shelter'
  ],
  
  housing_events: [
    'moving', 'moved', 'relocating', 'relocation',
    'buying a house', 'house hunting', 'closing',
    'renovating', 'renovation', 'remodeling',
    'downsizing', 'upsizing', 'first home'
  ],

  // ============================================
  // PHYSICAL HEALTH
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
    'autoimmune', 'chronic pain', 'migraine', 'migraines'
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
    'invisible illness', 'accommodations', 'ADA'
  ],

  // ============================================
  // SLEEP
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
    'sleep hygiene', 'bedtime routine'
  ],

  // ============================================
  // EXERCISE & FITNESS
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

  // ============================================
  // DIET & EATING
  // ============================================
  
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
    'self-conscious', 'insecure', 'confident'
  ],

  // ============================================
  // SPIRITUALITY & RELIGION
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
    'faith crisis', 'lost my faith', 'found faith', 'born again'
  ],
  
  spirituality_practices: [
    'yoga', 'chakra', 'energy', 'manifestation', 'manifesting',
    'crystals', 'tarot', 'astrology', 'horoscope',
    'reiki', 'healing', 'psychic', 'intuition',
    'universe', 'gratitude', 'journaling'
  ],

  // ============================================
  // LEGAL
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
  // DEATH & GRIEF
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
    'suddenly', 'unexpected', 'after a long battle'
  ],
  
  grief_process: [
    'grief', 'grieving', 'mourning', 'bereavement',
    'loss', 'missing', 'anniversary of death',
    'first without', 'holidays without', 'birthday without',
    'still processing', 'waves of grief', 'grief counseling'
  ],
  
  grief_stages: [
    'denial', 'anger', 'bargaining', 'depression', 'acceptance',
    'shock', 'numb', 'disbelief', 'devastated', 'heartbroken'
  ],

  // ============================================
  // MILESTONES & LIFE EVENTS
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
  // HOBBIES & INTERESTS
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
  // TRAVEL
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
  // COMMUNICATION PREFERENCES
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
  // TEMPORAL PATTERNS
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
  // COPING & SELF-CARE
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
    'drinking more', 'smoking more'
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
    'unbearable', 'can\'t take it', 'breaking point'
  ],
  
  moderate_distress: [
    'struggling', 'hard time', 'difficult', 'challenging',
    'overwhelmed', 'stressed', 'anxious', 'worried',
    'frustrated', 'upset', 'bothered'
  ],
  
  low_distress: [
    'bit stressed', 'little worried', 'somewhat',
    'kind of', 'a bit', 'slightly', 'minor'
  ],
  
  positive: [
    'happy', 'excited', 'proud', 'grateful', 'thankful',
    'hopeful', 'optimistic', 'relieved', 'peaceful',
    'content', 'joyful', 'thrilled', 'amazing', 'wonderful'
  ],
  
  neutral: [
    'okay', 'fine', 'alright', 'so-so', 'meh',
    'not bad', 'getting by', 'managing', 'surviving'
  ]
};

// ============================================
// EXTRACTION PRIORITY LEVELS
// ============================================

export const PRIORITY_CATEGORIES = {
  critical: [
    'suicidal', 'self_harm', 'abuse_types', 'abuse_relationships',
    'crisis_resources', 'symptoms_crisis', 'addiction_substances'
  ],
  
  high: [
    'mental_health_providers', 'conditions_mood', 'conditions_anxiety',
    'conditions_trauma', 'recovery_general', 'trauma_types',
    'death_events', 'grief_process'
  ],
  
  medium: [
    'relationship_romantic_people', 'family_immediate', 'work_general',
    'health_conditions_chronic', 'finances_negative', 'legal_family',
    'medications_general'
  ],
  
  standard: [
    'identity_core', 'friendships_people', 'pets_types',
    'hobbies_creative', 'milestones_positive', 'preference_validation'
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
};

// ============================================
// ENTITY EXTRACTION PATTERNS
// ============================================

export const ENTITY_PATTERNS = {
  // Names (captures "my [relation] [Name]" patterns)
  named_person: /my\s+(mom|dad|partner|husband|wife|brother|sister|friend|boss|therapist)\s+([A-Z][a-z]+)/gi,
  
  // Dates (various formats)
  date_mention: /(?:since|in|around|back in|last)\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|\d{4}|\d{1,2}\/\d{1,2})/gi,
  
  // Durations
  duration: /(?:for|been)\s+(\d+)\s+(days?|weeks?|months?|years?)/gi,
  
  // Medications with dosage
  medication_dosage: /(\d+)\s*(?:mg|milligrams?)\s+(?:of\s+)?([A-Za-z]+)/gi,
  
  // Locations
  location: /(?:live in|moved to|from|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // Ages
  age: /(?:i'm|i am|turned|turning)\s+(\d{1,2})/gi,
};
