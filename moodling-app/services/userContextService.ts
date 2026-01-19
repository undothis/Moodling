/**
 * User Context Builder Service
 *
 * Aggregates user data to create personalized context for Claude.
 * Following Moodling Ethics:
 * - Privacy-preserving (derived insights, not raw entries)
 * - User controls what's shared
 * - No diagnostic labels
 *
 * Unit 18B: Rich User Context Builder
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllEntries } from './journalStorage';
import { getTonePreferences, ToneStyle } from './tonePreferencesService';
import { MoodCategory } from './sentimentAnalysis';
import { JournalEntry } from '@/types/JournalEntry';

// Storage keys
const PREFERENCES_KEY = 'moodling_user_preferences';

/**
 * User's communication preferences
 */
export interface UserPreferences {
  temperament?: 'introvert' | 'extrovert' | 'ambivert';
  communicationStyle?: 'direct' | 'gentle' | 'detailed';
  prefersDirectness?: boolean;
  dislikesPlatitudes?: boolean;
  respondsWellToHumor?: boolean;
  needsMoreEncouragement?: boolean;
  currentExposureLevel?: number; // 1-8 scale (Unit 21)
}

/**
 * Mood trend direction
 */
export type MoodTrend = 'improving' | 'declining' | 'stable' | 'variable';

/**
 * Rich user context for Claude prompts
 */
export interface UserContext {
  // Who they are
  temperament?: string;
  communicationStyle?: string;
  toneStyles: ToneStyle[];

  // Current state
  recentMoodTrend?: MoodTrend;
  recentMoodDescription?: string;
  avgMoodScore?: number;
  entriesThisWeek?: number;

  // Journal history
  recentEntrySummaries: string[];
  totalEntries: number;
  avgEntriesPerWeek: number;
  longestStreak: number;
  commonMoods: string[];

  // Patterns discovered
  knownTriggers: string[];
  knownHelpers: string[];

  // Recent theme (summarized)
  recentTheme?: string;

  // Preferences
  prefersDirectness?: boolean;
  dislikesPlatitudes?: boolean;
  respondsWellToHumor?: boolean;

  // Social exposure (Unit 21)
  currentExposureLevel?: number;
}

/**
 * Load user preferences from storage
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const data = await AsyncStorage.getItem(PREFERENCES_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to load user preferences:', error);
    return {};
  }
}

/**
 * Save user preferences
 */
export async function saveUserPreferences(prefs: UserPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
}

/**
 * Update a single preference
 */
export async function updatePreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): Promise<void> {
  const prefs = await getUserPreferences();
  prefs[key] = value;
  await saveUserPreferences(prefs);
}

/**
 * Analyze mood trend from recent entries
 */
function analyzeMoodTrend(entries: JournalEntry[]): { trend: MoodTrend; description: string; avgScore: number } {
  if (entries.length < 2) {
    return { trend: 'stable', description: 'Not enough data', avgScore: 0 };
  }

  const scores = entries
    .filter(e => e.sentiment?.score !== undefined)
    .map(e => e.sentiment!.score);

  if (scores.length < 2) {
    return { trend: 'stable', description: 'Not enough mood data', avgScore: 0 };
  }

  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Split into first half and second half
  const midpoint = Math.floor(scores.length / 2);
  const firstHalf = scores.slice(midpoint);  // Older entries
  const secondHalf = scores.slice(0, midpoint); // Newer entries

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;
  const variance = calculateVariance(scores);

  let trend: MoodTrend;
  let description: string;

  if (variance > 0.3) {
    trend = 'variable';
    description = 'Mood has been fluctuating';
  } else if (diff > 0.15) {
    trend = 'improving';
    description = 'Mood trending upward recently';
  } else if (diff < -0.15) {
    trend = 'declining';
    description = 'Mood trending downward recently';
  } else {
    trend = 'stable';
    description = 'Mood has been relatively stable';
  }

  return { trend, description, avgScore };
}

/**
 * Calculate variance of scores
 */
function calculateVariance(scores: number[]): number {
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const squaredDiffs = scores.map(s => Math.pow(s - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Extract recent theme from latest entries (summarized, not raw)
 */
function extractRecentTheme(entries: JournalEntry[]): string | undefined {
  if (entries.length === 0) return undefined;

  const moods = entries.slice(0, 3).map(e => e.sentiment?.mood).filter(Boolean) as MoodCategory[];

  // Simple theme based on mood
  const moodCounts: Record<string, number> = {};
  for (const mood of moods) {
    const simplified = mood.replace('very_', '').replace('slightly_', '');
    moodCounts[simplified] = (moodCounts[simplified] || 0) + 1;
  }

  const dominantMood = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  if (dominantMood === 'positive') {
    return 'Recently positive entries';
  } else if (dominantMood === 'negative') {
    return 'Processing some difficult feelings';
  } else {
    return 'Reflective state';
  }
}

/**
 * Keywords that suggest significant life events
 * Comprehensive list for detecting important journal content
 */
const SIGNIFICANT_KEYWORDS = [
  // ============================================
  // RELATIONSHIPS - ROMANTIC
  // ============================================
  'girlfriend', 'boyfriend', 'partner', 'wife', 'husband', 'spouse', 'fiancé', 'fiancée',
  'married', 'engaged', 'breakup', 'broke up', 'divorce', 'separated', 'dating', 'single',
  'relationship', 'proposal', 'love', 'anniversary', 'honeymoon', 'first date',
  'ex', 'ex-husband', 'ex-wife', 'ex-boyfriend', 'ex-girlfriend',
  'couples therapy', 'marriage counseling', 'cheating', 'infidelity', 'affair',
  'long distance', 'moved in together', 'living together',

  // ============================================
  // FAMILY - IMMEDIATE
  // ============================================
  'mom', 'dad', 'mother', 'father', 'parent', 'parents',
  'brother', 'sister', 'sibling', 'son', 'daughter', 'child', 'children', 'kids',
  'baby', 'toddler', 'teenager', 'teen',

  // ============================================
  // FAMILY - EXTENDED
  // ============================================
  'grandmother', 'grandfather', 'grandma', 'grandpa', 'nana', 'papa',
  'grandparent', 'grandchild', 'aunt', 'uncle', 'cousin', 'niece', 'nephew',

  // ============================================
  // FAMILY - IN-LAWS & BLENDED
  // ============================================
  'mother-in-law', 'father-in-law', 'in-laws', 'MIL', 'FIL',
  'sister-in-law', 'brother-in-law', 'stepmother', 'stepfather', 'stepmom', 'stepdad',
  'stepbrother', 'stepsister', 'half-brother', 'half-sister',
  'adopted', 'adoption', 'foster', 'birth parent',

  // ============================================
  // FAMILY - DYNAMICS
  // ============================================
  'estranged', 'no contact', 'toxic family', 'family drama', 'dysfunctional',
  'boundaries', 'golden child', 'scapegoat', 'narcissistic parent', 'codependent',
  'family therapy', 'family reunion',

  // ============================================
  // FRIENDSHIPS
  // ============================================
  'best friend', 'BFF', 'close friend', 'friend group', 'childhood friend', 'old friend',
  'friendship', 'falling out', 'reconnected', 'drifted apart', 'betrayed', 'ghosted',
  'toxic friendship', 'friend breakup', 'stopped talking',
  'lonely', 'loneliness', 'isolated', 'no friends', 'social anxiety',

  // ============================================
  // PETS
  // ============================================
  'dog', 'cat', 'pet', 'puppy', 'kitten', 'fur baby',
  'bird', 'fish', 'hamster', 'guinea pig', 'rabbit', 'bunny', 'reptile', 'horse',
  'adopted', 'rescue', 'shelter', 'vet', 'veterinarian',
  'put down', 'euthanized', 'rainbow bridge', 'pet loss',

  // ============================================
  // MENTAL HEALTH - PROVIDERS
  // ============================================
  'therapy', 'therapist', 'counselor', 'counseling', 'psychologist',
  'psychiatrist', 'mental health', 'social worker', 'life coach',
  'support group', 'group therapy',

  // ============================================
  // MENTAL HEALTH - THERAPY TYPES
  // ============================================
  'CBT', 'cognitive behavioral', 'DBT', 'dialectical', 'EMDR', 'trauma therapy',
  'talk therapy', 'exposure therapy',

  // ============================================
  // MENTAL HEALTH - CONDITIONS
  // ============================================
  'depression', 'depressed', 'bipolar', 'manic', 'mania',
  'anxiety', 'anxious', 'panic attack', 'panic disorder', 'agoraphobia', 'social anxiety',
  'PTSD', 'trauma', 'traumatic', 'C-PTSD', 'flashback', 'triggered',
  'OCD', 'obsessive compulsive', 'intrusive thoughts',
  'eating disorder', 'anorexia', 'bulimia', 'binge eating',
  'BPD', 'borderline',

  // ============================================
  // MENTAL HEALTH - SYMPTOMS
  // ============================================
  'can\'t get out of bed', 'no motivation', 'no energy', 'insomnia', 'can\'t sleep',
  'worthless', 'hopeless', 'helpless', 'numb', 'empty',
  'racing thoughts', 'overthinking', 'catastrophizing',
  'breakdown', 'mental breakdown', 'crisis', 'spiraling', 'rock bottom',
  'hospitalized', 'inpatient', 'outpatient',

  // ============================================
  // NEURODIVERGENCE
  // ============================================
  'ADHD', 'autism', 'autistic', 'ASD', 'on the spectrum', 'neurodivergent',
  'dyslexia', 'dyslexic', 'sensory processing', 'executive function',
  'hyperfocus', 'stimming', 'masking', 'burnout', 'meltdown', 'shutdown',

  // ============================================
  // IDENTITY - GENDER & SEXUALITY
  // ============================================
  'coming out', 'came out', 'transition', 'transitioning', 'transitioned',
  'gender identity', 'non-binary', 'transgender', 'LGBTQ',
  'gay', 'lesbian', 'bisexual', 'pansexual', 'asexual', 'queer',
  'closeted', 'pronouns',

  // ============================================
  // MEDICATIONS
  // ============================================
  'medication', 'meds', 'prescribed', 'prescription', 'dosage',
  'side effects', 'started taking', 'stopped taking', 'tapering',
  'antidepressant', 'SSRI', 'SNRI', 'Lexapro', 'Zoloft', 'Prozac', 'Wellbutrin',
  'Xanax', 'Klonopin', 'Ativan', 'benzodiazepine',
  'mood stabilizer', 'Lithium', 'Lamictal',
  'Adderall', 'Vyvanse', 'Ritalin', 'Concerta',

  // ============================================
  // ADDICTION & RECOVERY
  // ============================================
  'addiction', 'addicted', 'substance abuse', 'alcoholic', 'alcoholism',
  'drinking', 'drunk', 'drug', 'drugs', 'using', 'high',
  'sober', 'sobriety', 'clean', 'recovery', 'recovering',
  'relapse', 'relapsed', 'slip', 'detox', 'withdrawal', 'rehab', 'treatment',
  'AA', 'Alcoholics Anonymous', 'NA', 'Narcotics Anonymous', '12 step', 'sponsor',

  // ============================================
  // TRAUMA & ABUSE
  // ============================================
  'trauma', 'traumatic', 'traumatized', 'abuse', 'abused', 'abusive',
  'domestic violence', 'physical abuse', 'emotional abuse', 'verbal abuse', 'sexual abuse',
  'neglect', 'neglected', 'abandonment', 'gaslighting', 'manipulation',
  'survivor', 'escaped', 'restraining order', 'safe now', 'healing',
  'assault', 'sexual assault', 'harassment',

  // ============================================
  // SELF-HARM & CRISIS (handle with care)
  // ============================================
  'self-harm', 'self harm', 'cutting', 'hurting myself',
  'suicidal', 'don\'t want to be here', 'want to die',
  'crisis', 'hotline', '988', 'safety plan',

  // ============================================
  // WORK & CAREER
  // ============================================
  'job', 'work', 'career', 'employer', 'workplace', 'remote', 'work from home',
  'boss', 'manager', 'coworker', 'colleague',
  'promotion', 'promoted', 'raise', 'bonus', 'recognition', 'dream job', 'new job',
  'fired', 'terminated', 'laid off', 'quit', 'resigned', 'unemployed', 'job hunting',
  'burnout', 'burnt out', 'overworked', 'toxic workplace', 'toxic boss',
  'interview', 'performance review', 'PIP',

  // ============================================
  // EDUCATION
  // ============================================
  'school', 'college', 'university', 'grad school', 'degree', 'major',
  'student', 'studying', 'homework', 'class', 'professor', 'teacher',
  'graduating', 'graduation', 'graduated', 'diploma', 'dropped out',
  'scholarship', 'financial aid', 'student loans',
  'exam', 'test', 'finals', 'midterms', 'thesis', 'dissertation',

  // ============================================
  // FINANCES
  // ============================================
  'money', 'financial', 'budget', 'income', 'bills',
  'savings', 'emergency fund', 'investment', 'retirement', '401k',
  'debt', 'credit card debt', 'student loans', 'loan', 'mortgage',
  'bankruptcy', 'foreclosure', 'eviction', 'broke', 'struggling financially',
  'paid off', 'debt free', 'raise', 'bonus',

  // ============================================
  // HOUSING
  // ============================================
  'home', 'house', 'apartment', 'condo', 'rent', 'renting', 'landlord',
  'roommate', 'living alone', 'living with', 'moved in with',
  'moving', 'moved', 'relocating', 'buying a house', 'first home',

  // ============================================
  // PHYSICAL HEALTH
  // ============================================
  'health', 'sick', 'illness', 'condition', 'diagnosis', 'diagnosed', 'symptoms',
  'chronic', 'flare', 'remission', 'doctor', 'physician', 'specialist', 'surgeon',
  'diabetes', 'hypertension', 'heart disease', 'asthma', 'arthritis',
  'fibromyalgia', 'chronic fatigue', 'autoimmune', 'chronic pain', 'migraine',
  'cancer', 'tumor', 'chemotherapy', 'radiation', 'terminal',
  'surgery', 'operation', 'hospital', 'hospitalized', 'ER', 'emergency room',
  'pregnant', 'pregnancy', 'expecting', 'miscarriage', 'stillbirth', 'fertility', 'IVF',
  'disability', 'disabled', 'wheelchair', 'chronic illness',

  // ============================================
  // SLEEP
  // ============================================
  'insomnia', 'can\'t sleep', 'trouble sleeping', 'nightmares', 'night terrors',
  'sleep apnea', 'oversleeping', 'exhausted', 'tired', 'fatigue',

  // ============================================
  // EXERCISE & FITNESS
  // ============================================
  'exercise', 'workout', 'gym', 'fitness', 'running', 'jogging', 'hiking',
  'yoga', 'weightlifting', 'CrossFit', 'marathon', 'personal best',

  // ============================================
  // DIET & BODY IMAGE
  // ============================================
  'diet', 'dieting', 'weight loss', 'weight gain', 'body image',
  'overeating', 'emotional eating', 'food relationship',

  // ============================================
  // DEATH & GRIEF
  // ============================================
  'died', 'death', 'passed away', 'passing', 'lost', 'gone',
  'funeral', 'memorial', 'burial', 'cremation', 'cemetery',
  'grief', 'grieving', 'mourning', 'bereavement', 'loss',
  'anniversary of death', 'first without',

  // ============================================
  // SPIRITUALITY & RELIGION
  // ============================================
  'religious', 'religion', 'faith', 'spiritual', 'spirituality', 'god', 'God',
  'pray', 'prayer', 'worship', 'church', 'temple', 'mosque', 'synagogue',
  'meditation', 'meditate', 'mindfulness',
  'baptism', 'baptized', 'confirmation', 'converted', 'leaving the church',
  'faith crisis', 'lost my faith', 'found faith',

  // ============================================
  // LEGAL
  // ============================================
  'lawyer', 'attorney', 'legal', 'court', 'judge', 'trial',
  'lawsuit', 'sued', 'settlement', 'arrested', 'charged', 'charges',
  'felony', 'misdemeanor', 'probation', 'jail', 'prison',
  'divorce', 'custody', 'child custody', 'child support', 'alimony',
  'restraining order', 'protective order',
  'immigration', 'visa', 'green card', 'citizenship', 'deportation',

  // ============================================
  // MILESTONES & ACHIEVEMENTS
  // ============================================
  'accomplished', 'achieved', 'milestone', 'first time', 'personal best',
  'goal', 'finally', 'breakthrough', 'success', 'dream come true',
  'birthday', 'turning', 'years old',
  'engaged', 'wedding', 'honeymoon', 'anniversary',
  'new baby', 'birth', 'born', 'new parent',
  'bought a house', 'first home', 'moved out',

  // ============================================
  // TRAVEL
  // ============================================
  'travel', 'traveling', 'trip', 'vacation', 'holiday', 'getaway',
  'road trip', 'flight', 'cruise', 'backpacking', 'solo travel',

  // ============================================
  // HOBBIES
  // ============================================
  'art', 'painting', 'drawing', 'photography', 'writing', 'poetry',
  'music', 'guitar', 'piano', 'singing', 'instrument',
  'crafts', 'knitting', 'sewing', 'woodworking',
  'reading', 'book club', 'gaming', 'video games',
  'hiking', 'camping', 'gardening', 'fishing',

  // ============================================
  // COMMUNICATION PREFERENCES
  // ============================================
  'just need to vent', 'need to get this off my chest', 'not looking for advice',
  'need support', 'need advice', 'help me figure out',

  // ============================================
  // PROFESSIONS - HEALTHCARE
  // ============================================
  'nurse', 'nursing', 'RN', 'LPN', 'doctor', 'physician', 'surgeon', 'resident',
  'medical student', 'med school', 'paramedic', 'EMT', 'pharmacist', 'dentist',
  'physical therapist', 'occupational therapist', 'psychologist', 'psychiatrist',
  'social worker', 'healthcare worker', 'hospital', 'clinic',

  // ============================================
  // PROFESSIONS - TECH
  // ============================================
  'software engineer', 'developer', 'programmer', 'coder', 'software developer',
  'web developer', 'frontend', 'backend', 'full stack', 'DevOps', 'SRE',
  'data scientist', 'data analyst', 'machine learning', 'AI', 'product manager',
  'UX designer', 'UI designer', 'tech', 'startup', 'Silicon Valley',

  // ============================================
  // PROFESSIONS - EDUCATION
  // ============================================
  'teacher', 'professor', 'educator', 'teaching', 'instructor',
  'elementary school', 'middle school', 'high school', 'college professor',
  'tutor', 'principal', 'administrator', 'school counselor',

  // ============================================
  // PROFESSIONS - SERVICE & RETAIL
  // ============================================
  'server', 'waiter', 'waitress', 'bartender', 'barista', 'retail',
  'customer service', 'cashier', 'sales', 'salesperson', 'real estate agent',
  'hairstylist', 'barber', 'nail tech', 'esthetician',

  // ============================================
  // PROFESSIONS - TRADES & LABOR
  // ============================================
  'construction', 'carpenter', 'electrician', 'plumber', 'mechanic',
  'HVAC', 'welder', 'factory', 'warehouse', 'truck driver', 'CDL',
  'landscaping', 'cleaning', 'janitor', 'maintenance',

  // ============================================
  // PROFESSIONS - BUSINESS & FINANCE
  // ============================================
  'accountant', 'CPA', 'financial advisor', 'banker', 'investment',
  'consultant', 'analyst', 'marketing', 'HR', 'human resources',
  'recruiter', 'executive', 'CEO', 'manager', 'entrepreneur', 'business owner',

  // ============================================
  // PROFESSIONS - CREATIVE
  // ============================================
  'artist', 'graphic designer', 'photographer', 'videographer', 'filmmaker',
  'writer', 'author', 'journalist', 'editor', 'content creator', 'influencer',
  'musician', 'actor', 'actress', 'dancer', 'choreographer',

  // ============================================
  // PROFESSIONS - LEGAL & GOVERNMENT
  // ============================================
  'lawyer', 'attorney', 'paralegal', 'judge', 'law student', 'law school',
  'police officer', 'cop', 'firefighter', 'military', 'army', 'navy', 'marines',
  'air force', 'veteran', 'government', 'civil servant',

  // ============================================
  // PROFESSIONS - OTHER
  // ============================================
  'flight attendant', 'pilot', 'chef', 'cook', 'baker',
  'stay-at-home', 'SAHM', 'SAHD', 'caregiver', 'nanny', 'au pair',
  'freelance', 'self-employed', 'gig economy', 'Uber', 'Lyft', 'DoorDash',
  'remote work', 'work from home', 'hybrid', 'office job',
];

/**
 * Check if entry contains significant keywords
 */
function hasSignificantContent(text: string): boolean {
  const lower = text.toLowerCase();
  return SIGNIFICANT_KEYWORDS.some(keyword => lower.includes(keyword));
}

/**
 * Score entry significance (higher = more important)
 */
function scoreSignificance(entry: JournalEntry): number {
  let score = 0;

  // Longer entries are often more significant
  if (entry.text.length > 200) score += 2;
  if (entry.text.length > 500) score += 2;

  // Strong emotions suggest importance
  const mood = entry.sentiment?.mood || '';
  if (mood.includes('very_')) score += 3;

  // Contains significant keywords
  if (hasSignificantContent(entry.text)) score += 5;

  return score;
}

/**
 * Get brief summaries of recent journal entries
 * Includes both recent entries AND significant historical ones
 */
function getRecentEntrySummaries(entries: JournalEntry[], recentCount: number = 5): string[] {
  const summaries: string[] = [];

  // Get recent entries (last 5-7)
  const recentEntries = entries.slice(0, recentCount);

  // Find significant older entries (beyond the recent ones)
  const olderEntries = entries.slice(recentCount);
  const significantOlder = olderEntries
    .map(entry => ({ entry, score: scoreSignificance(entry) }))
    .filter(item => item.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.entry);

  // Combine and format
  const allEntries = [...recentEntries, ...significantOlder];

  for (const entry of allEntries) {
    const isSignificant = scoreSignificance(entry) >= 3;
    // Longer preview for significant entries
    const previewLength = isSignificant ? 100 : 60;
    const preview = entry.text.slice(0, previewLength).trim();
    const truncated = entry.text.length > previewLength ? preview + '...' : preview;
    const mood = entry.sentiment?.mood?.replace(/_/g, ' ') || 'reflective';
    const date = new Date(entry.createdAt);
    const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

    let timeDesc: string;
    if (daysAgo === 0) {
      timeDesc = 'today';
    } else if (daysAgo === 1) {
      timeDesc = 'yesterday';
    } else if (daysAgo < 7) {
      timeDesc = `${daysAgo} days ago`;
    } else if (daysAgo < 30) {
      timeDesc = `${Math.floor(daysAgo / 7)} weeks ago`;
    } else {
      timeDesc = `${Math.floor(daysAgo / 30)} months ago`;
    }

    const significantMarker = isSignificant && daysAgo > 7 ? ' [significant]' : '';
    summaries.push(`${timeDesc} (${mood})${significantMarker}: "${truncated}"`);
  }

  return summaries;
}

/**
 * Analyze journaling patterns over time
 */
function analyzeJournalingPatterns(entries: JournalEntry[]): {
  totalEntries: number;
  avgEntriesPerWeek: number;
  longestStreak: number;
  commonMoods: string[];
} {
  const totalEntries = entries.length;

  if (totalEntries === 0) {
    return { totalEntries: 0, avgEntriesPerWeek: 0, longestStreak: 0, commonMoods: [] };
  }

  // Calculate average entries per week
  const oldestEntry = new Date(entries[entries.length - 1].createdAt);
  const newestEntry = new Date(entries[0].createdAt);
  const weeksBetween = Math.max(1, (newestEntry.getTime() - oldestEntry.getTime()) / (1000 * 60 * 60 * 24 * 7));
  const avgEntriesPerWeek = Math.round((totalEntries / weeksBetween) * 10) / 10;

  // Calculate longest streak (consecutive days)
  let longestStreak = 1;
  let currentStreak = 1;
  const dates = entries.map(e => new Date(e.createdAt).toDateString());
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const dayDiff = (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24);
    if (dayDiff <= 1.5) { // Account for same day or next day
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  // Find common moods
  const moodCounts: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.sentiment?.mood) {
      const simplified = entry.sentiment.mood.replace('very_', '').replace('slightly_', '');
      moodCounts[simplified] = (moodCounts[simplified] || 0) + 1;
    }
  }
  const commonMoods = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([mood]) => mood);

  return { totalEntries, avgEntriesPerWeek, longestStreak, commonMoods };
}

/**
 * Build comprehensive user context
 */
export async function buildUserContext(): Promise<UserContext> {
  // Get all data sources
  const [prefs, tonePrefs, entries] = await Promise.all([
    getUserPreferences(),
    getTonePreferences(),
    getAllEntries(),
  ]);

  // Recent entries (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentEntries = entries.filter(e => new Date(e.createdAt) >= weekAgo);

  // Analyze mood trend
  const { trend, description, avgScore } = analyzeMoodTrend(recentEntries);

  // Get journal history insights (5 recent + up to 3 significant older ones)
  const recentEntrySummaries = getRecentEntrySummaries(entries, 5);
  const journalPatterns = analyzeJournalingPatterns(entries);

  // Patterns - will be populated as user tracks more data
  const triggers: string[] = [];
  const helpers: string[] = [];

  // Extract theme
  const recentTheme = extractRecentTheme(entries);

  return {
    // Who they are
    temperament: prefs.temperament,
    communicationStyle: prefs.communicationStyle,
    toneStyles: tonePrefs.selectedStyles,

    // Current state
    recentMoodTrend: trend,
    recentMoodDescription: description,
    avgMoodScore: avgScore,
    entriesThisWeek: recentEntries.length,

    // Journal history
    recentEntrySummaries,
    totalEntries: journalPatterns.totalEntries,
    avgEntriesPerWeek: journalPatterns.avgEntriesPerWeek,
    longestStreak: journalPatterns.longestStreak,
    commonMoods: journalPatterns.commonMoods,

    // Patterns
    knownTriggers: triggers,
    knownHelpers: helpers,

    // Theme
    recentTheme,

    // Preferences
    prefersDirectness: prefs.prefersDirectness,
    dislikesPlatitudes: prefs.dislikesPlatitudes,
    respondsWellToHumor: prefs.respondsWellToHumor,

    // Social exposure
    currentExposureLevel: prefs.currentExposureLevel,
  };
}

/**
 * Format user context for Claude prompt
 */
export function formatContextForPrompt(context: UserContext): string {
  const parts: string[] = [];

  // Who they are
  if (context.temperament) {
    parts.push(`Temperament: ${context.temperament}`);
  }
  if (context.communicationStyle) {
    parts.push(`Communication style: ${context.communicationStyle}`);
  }

  // Journal history overview
  if (context.totalEntries > 0) {
    let historyDesc = `Journal history: ${context.totalEntries} total entries`;
    if (context.avgEntriesPerWeek > 0) {
      historyDesc += `, ~${context.avgEntriesPerWeek} per week`;
    }
    if (context.longestStreak > 1) {
      historyDesc += `, longest streak: ${context.longestStreak} days`;
    }
    parts.push(historyDesc);
  }

  // Common moods
  if (context.commonMoods.length > 0) {
    parts.push(`Most common moods: ${context.commonMoods.join(', ')}`);
  }

  // Current state
  if (context.recentMoodDescription) {
    parts.push(`Recent mood trend: ${context.recentMoodDescription}`);
  }
  if (context.entriesThisWeek !== undefined && context.entriesThisWeek > 0) {
    parts.push(`This week: ${context.entriesThisWeek} entries`);
  }

  // Recent journal summaries (brief previews)
  if (context.recentEntrySummaries.length > 0) {
    parts.push('');
    parts.push('Recent journal entries:');
    for (const summary of context.recentEntrySummaries) {
      parts.push(`  • ${summary}`);
    }
  }

  // Patterns
  if (context.knownTriggers.length > 0) {
    parts.push(`Known triggers: ${context.knownTriggers.join(', ')}`);
  }
  if (context.knownHelpers.length > 0) {
    parts.push(`What has helped: ${context.knownHelpers.join(', ')}`);
  }

  // Theme
  if (context.recentTheme) {
    parts.push(`Recent focus: ${context.recentTheme}`);
  }

  // Preferences
  const prefParts: string[] = [];
  if (context.prefersDirectness) {
    prefParts.push('direct communication');
  }
  if (context.dislikesPlatitudes) {
    prefParts.push('dislikes platitudes');
  }
  if (context.respondsWellToHumor) {
    prefParts.push('responds to humor');
  }
  if (prefParts.length > 0) {
    parts.push(`Communication preferences: ${prefParts.join(', ')}`);
  }

  // Social exposure
  if (context.currentExposureLevel) {
    const level = context.currentExposureLevel;
    const levelDesc = level <= 2 ? 'prefers solitude' :
                      level <= 4 ? 'comfortable with brief interactions' :
                      level <= 6 ? 'comfortable with small groups' :
                      'comfortable in larger social settings';
    parts.push(`Social comfort: ${levelDesc} (level ${level}/8)`);
  }

  return parts.length === 0 ? 'New user - no history yet.' : parts.join('\n');
}

/**
 * Get formatted context for Claude
 */
export async function getContextForClaude(): Promise<string> {
  const context = await buildUserContext();
  return formatContextForPrompt(context);
}
