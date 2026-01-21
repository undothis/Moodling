/**
 * Period Correlation Types
 *
 * Types for tracking lifestyle factors and correlating them
 * with menstrual cycle symptoms and patterns.
 */

// ============================================
// FOOD TAGS (Quick-tap categories)
// ============================================

export type FoodTagCategory = 'negative' | 'positive' | 'neutral' | 'supplement';

export interface FoodTag {
  id: string;
  emoji: string;
  label: string;
  category: FoodTagCategory;
  correlationFactors: string[]; // What symptoms this might affect
}

export const FOOD_TAGS: FoodTag[] = [
  // Negative correlations (may worsen symptoms)
  {
    id: 'fast_food',
    emoji: '🍔',
    label: 'Fast Food',
    category: 'negative',
    correlationFactors: ['cramps', 'bloating', 'flow_heavy'],
  },
  {
    id: 'processed',
    emoji: '🍕',
    label: 'Processed',
    category: 'negative',
    correlationFactors: ['inflammation', 'cramps', 'bloating'],
  },
  {
    id: 'high_sugar',
    emoji: '🍬',
    label: 'High Sugar',
    category: 'negative',
    correlationFactors: ['mood_swings', 'cramps', 'energy_crash'],
  },
  {
    id: 'salty_snacks',
    emoji: '🧂',
    label: 'Salty/Snacks',
    category: 'negative',
    correlationFactors: ['bloating', 'water_retention'],
  },
  {
    id: 'fried_food',
    emoji: '🍟',
    label: 'Fried Food',
    category: 'negative',
    correlationFactors: ['inflammation', 'bloating', 'fatigue'],
  },
  {
    id: 'alcohol',
    emoji: '🍷',
    label: 'Alcohol',
    category: 'negative',
    correlationFactors: ['dehydration', 'mood', 'cramps', 'sleep'],
  },
  {
    id: 'soda',
    emoji: '🥤',
    label: 'Soda',
    category: 'negative',
    correlationFactors: ['bloating', 'sugar_spike', 'cramps'],
  },

  // Neutral (effects vary by person)
  {
    id: 'caffeine',
    emoji: '☕',
    label: 'Caffeine',
    category: 'neutral',
    correlationFactors: ['cramps', 'anxiety', 'sleep', 'headache'],
  },
  {
    id: 'dairy',
    emoji: '🥛',
    label: 'Dairy',
    category: 'neutral',
    correlationFactors: ['bloating', 'cramps'], // Varies by person
  },
  {
    id: 'red_meat',
    emoji: '🥩',
    label: 'Red Meat',
    category: 'neutral',
    correlationFactors: ['iron', 'inflammation'],
  },
  {
    id: 'chocolate',
    emoji: '🍫',
    label: 'Chocolate',
    category: 'neutral',
    correlationFactors: ['mood', 'cravings', 'magnesium'],
  },

  // Positive correlations (may help symptoms)
  {
    id: 'fresh_whole',
    emoji: '🥗',
    label: 'Fresh/Whole',
    category: 'positive',
    correlationFactors: ['reduced_cramps', 'stable_mood', 'energy'],
  },
  {
    id: 'whole_grains',
    emoji: '🌾',
    label: 'Whole Grains',
    category: 'positive',
    correlationFactors: ['stable_energy', 'fiber', 'mood'],
  },
  {
    id: 'fish',
    emoji: '🐟',
    label: 'Fish',
    category: 'positive',
    correlationFactors: ['omega3', 'reduced_inflammation', 'mood'],
  },
  {
    id: 'leafy_greens',
    emoji: '🥬',
    label: 'Leafy Greens',
    category: 'positive',
    correlationFactors: ['iron', 'reduced_cramps', 'energy'],
  },
  {
    id: 'fruits',
    emoji: '🍎',
    label: 'Fruits',
    category: 'positive',
    correlationFactors: ['vitamins', 'hydration', 'fiber'],
  },
  {
    id: 'nuts_seeds',
    emoji: '🥜',
    label: 'Nuts/Seeds',
    category: 'positive',
    correlationFactors: ['magnesium', 'healthy_fats', 'mood'],
  },
  {
    id: 'water',
    emoji: '💧',
    label: 'Good Hydration',
    category: 'positive',
    correlationFactors: ['reduced_bloating', 'headache', 'energy'],
  },

  // Supplements
  {
    id: 'iron_supplement',
    emoji: '💊',
    label: 'Iron',
    category: 'supplement',
    correlationFactors: ['energy', 'flow_recovery'],
  },
  {
    id: 'vitamin_d',
    emoji: '☀️',
    label: 'Vitamin D',
    category: 'supplement',
    correlationFactors: ['mood', 'cramps', 'pms'],
  },
  {
    id: 'calcium',
    emoji: '🦴',
    label: 'Calcium',
    category: 'supplement',
    correlationFactors: ['cramps', 'pms', 'mood'],
  },
  {
    id: 'magnesium',
    emoji: '✨',
    label: 'Magnesium',
    category: 'supplement',
    correlationFactors: ['cramps', 'sleep', 'mood', 'headache'],
  },
  {
    id: 'omega3',
    emoji: '🐠',
    label: 'Omega-3',
    category: 'supplement',
    correlationFactors: ['inflammation', 'mood', 'cramps'],
  },
];

// ============================================
// SLEEP TRACKING
// ============================================

export type SleepQuality = 'poor' | 'okay' | 'good' | 'great';

export interface SleepLog {
  date: string; // YYYY-MM-DD
  hours?: number; // From HealthKit or manual
  quality?: SleepQuality;
  issues?: SleepIssue[];
  source: 'healthkit' | 'manual';
}

export type SleepIssue =
  | 'trouble_falling_asleep'
  | 'woke_multiple_times'
  | 'vivid_dreams'
  | 'restless'
  | 'too_hot'
  | 'too_cold'
  | 'pain';

export const SLEEP_ISSUES: { id: SleepIssue; label: string }[] = [
  { id: 'trouble_falling_asleep', label: 'Trouble falling asleep' },
  { id: 'woke_multiple_times', label: 'Woke up multiple times' },
  { id: 'vivid_dreams', label: 'Vivid dreams' },
  { id: 'restless', label: 'Restless/tossing' },
  { id: 'too_hot', label: 'Too hot' },
  { id: 'too_cold', label: 'Too cold' },
  { id: 'pain', label: 'Pain/discomfort' },
];

// ============================================
// SYMPTOM ENHANCEMENT
// ============================================

export type SymptomIntensity = 0 | 1 | 2 | 3; // 0=none, 1=mild, 2=moderate, 3=severe

export interface EnhancedSymptomLog {
  date: string;
  symptoms: {
    cramps?: SymptomIntensity;
    bloating?: SymptomIntensity;
    headache?: SymptomIntensity;
    moodDip?: SymptomIntensity;
    fatigue?: SymptomIntensity;
    cravings?: SymptomIntensity;
    anxiety?: SymptomIntensity;
    irritability?: SymptomIntensity;
    breastTenderness?: SymptomIntensity;
    backPain?: SymptomIntensity;
    acne?: SymptomIntensity;
    nausea?: SymptomIntensity;
  };
}

export const SYMPTOM_OPTIONS: {
  id: keyof EnhancedSymptomLog['symptoms'];
  emoji: string;
  label: string;
}[] = [
  { id: 'cramps', emoji: '🔥', label: 'Cramps' },
  { id: 'bloating', emoji: '😤', label: 'Bloating' },
  { id: 'headache', emoji: '🤕', label: 'Headache' },
  { id: 'moodDip', emoji: '😢', label: 'Mood Dip' },
  { id: 'fatigue', emoji: '😴', label: 'Fatigue' },
  { id: 'cravings', emoji: '🍫', label: 'Cravings' },
  { id: 'anxiety', emoji: '😰', label: 'Anxiety' },
  { id: 'irritability', emoji: '💢', label: 'Irritable' },
  { id: 'breastTenderness', emoji: '💗', label: 'Breast Pain' },
  { id: 'backPain', emoji: '🔙', label: 'Back Pain' },
  { id: 'acne', emoji: '😣', label: 'Acne' },
  { id: 'nausea', emoji: '🤢', label: 'Nausea' },
];

// ============================================
// DAILY LOG (Combined tracking)
// ============================================

export interface DailyCorrelationLog {
  date: string; // YYYY-MM-DD

  // Cycle context (auto-filled from cycleTrackingService)
  cycleDay?: number;
  phase?: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  flowLevel?: 'none' | 'spotting' | 'light' | 'medium' | 'heavy';

  // Food (quick-tap tags)
  foodTags: string[]; // Array of FoodTag IDs

  // Sleep
  sleep?: SleepLog;

  // Symptoms
  symptoms?: EnhancedSymptomLog['symptoms'];

  // Activity
  exerciseMinutes?: number;
  exerciseType?: 'none' | 'light' | 'moderate' | 'intense';

  // Mood (can link to existing journal mood if available)
  moodScore?: number; // 1-5

  // Stress level
  stressLevel?: 1 | 2 | 3 | 4 | 5;

  // Timestamp
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CORRELATION RESULTS
// ============================================

export interface CorrelationResult {
  factor: string; // 'fast_food', 'poor_sleep', etc.
  symptom: string; // 'cramps', 'heavy_flow', 'mood_dip'
  correlation: number; // -1 to 1 (negative = reduces symptom)
  confidence: number; // 0-1 based on data points
  dataPoints: number; // How many observations
  direction: 'increases' | 'decreases' | 'neutral';
}

export interface PersonalizedInsight {
  id: string;
  type: 'positive' | 'warning' | 'neutral';
  title: string;
  message: string;
  basedOn: string; // What data led to this insight
  confidence: number;
  actionable?: string; // Suggested action
}

// ============================================
// CORRELATION STORE
// ============================================

export interface CorrelationData {
  // All daily logs
  logs: DailyCorrelationLog[];

  // Computed correlations (updated periodically)
  correlations: CorrelationResult[];

  // Generated insights
  insights: PersonalizedInsight[];

  // Metadata
  cyclesTracked: number;
  lastAnalyzed?: string;
  lastUpdated: string;
}

export function createEmptyCorrelationData(): CorrelationData {
  return {
    logs: [],
    correlations: [],
    insights: [],
    cyclesTracked: 0,
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================
// INSIGHT THRESHOLDS
// ============================================

export const INSIGHT_THRESHOLDS = {
  // Minimum cycles needed for each insight type
  MIN_CYCLES_BASIC: 2,
  MIN_CYCLES_FOOD: 3,
  MIN_CYCLES_SLEEP: 3,
  MIN_CYCLES_PERSONALIZED: 4,

  // Confidence thresholds
  MIN_CONFIDENCE_SHOW: 0.6,
  MIN_CONFIDENCE_SUGGEST: 0.75,

  // Correlation strength
  WEAK_CORRELATION: 0.3,
  MODERATE_CORRELATION: 0.5,
  STRONG_CORRELATION: 0.7,
};
