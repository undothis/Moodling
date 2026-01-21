/**
 * Cycle Tracking Types
 *
 * Types and interfaces for menstrual cycle tracking in Mood Leaf.
 * Designed with privacy-first approach - all data stays on device,
 * only phase summaries shared with AI guide.
 */

// ============================================
// CYCLE PHASES
// ============================================

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface PhaseInfo {
  phase: CyclePhase;
  dayOfCycle: number;
  daysUntilNextPhase: number;
  isPMS: boolean; // Last 5-7 days of luteal phase
}

// ============================================
// PERIOD TRACKING
// ============================================

export interface PeriodEntry {
  id: string;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string, undefined if ongoing
  cycleLength?: number; // Days from this period start to next
}

export interface FlowLevel {
  date: string; // ISO date string
  level: 'spotting' | 'light' | 'medium' | 'heavy';
}

// ============================================
// SYMPTOMS
// ============================================

export type CycleSymptomType =
  | 'cramps'
  | 'bloating'
  | 'breastTenderness'
  | 'headache'
  | 'moodShift'
  | 'cravings'
  | 'fatigue'
  | 'backPain'
  | 'acne'
  | 'insomnia'
  // Perimenopause/Menopause symptoms
  | 'hotFlash'
  | 'nightSweat'
  | 'sleepDisturbance'
  | 'brainFog'
  | 'vaginalDryness'
  | 'jointPain'
  | 'heartPalpitations'
  | 'anxietySpike'
  | 'libidoChange';

// ============================================
// LIFE STAGES
// ============================================

export type LifeStage =
  | 'regularCycles'    // Normal menstrual cycles
  | 'perimenopause'    // Transition phase, irregular cycles
  | 'menopause'        // No period for 12+ months
  | 'postMenopause'    // Post-menopause wellness
  | 'pregnant'         // Pregnancy mode
  | 'postpartum';      // Post-birth recovery

export interface LifeStageInfo {
  stage: LifeStage;
  startDate?: string; // When user entered this stage
  expectedDueDate?: string; // For pregnancy
  trimester?: 1 | 2 | 3; // For pregnancy
  weeksPostpartum?: number; // For postpartum
}

// ============================================
// PREGNANCY TRACKING
// ============================================

export interface PregnancyData {
  dueDate: string; // ISO date string
  conceptionDate?: string;
  currentWeek: number;
  trimester: 1 | 2 | 3;
  notes: string[];
}

// ============================================
// CONTRACEPTION
// ============================================

export type ContraceptionType =
  | 'pill'
  | 'iud'
  | 'implant'
  | 'ring'
  | 'patch'
  | 'injection'
  | 'none';

export interface ContraceptionReminder {
  type: ContraceptionType;
  enabled: boolean;
  reminderTime?: string; // HH:MM format for daily pill
  nextCheckDate?: string; // For IUD check, implant renewal
  notes?: string;
}

export interface CycleSymptom {
  id: string;
  date: string; // ISO date string
  type: CycleSymptomType;
  severity: 1 | 2 | 3; // 1=mild, 2=moderate, 3=severe
  notes?: string;
  syncedToHealthKit?: boolean;
}

// ============================================
// CYCLE DATA
// ============================================

export interface CycleData {
  periods: PeriodEntry[];
  symptoms: CycleSymptom[];
  flowLevels: FlowLevel[];
  averageCycleLength: number; // Calculated from history
  averagePeriodLength: number; // Calculated from history
  lastUpdated: string; // ISO date string
}

// ============================================
// USER SETTINGS
// ============================================

export interface CycleTwigSettings {
  periodStartEnd: boolean;
  flowLevel: boolean;
  cramps: boolean;
  bloating: boolean;
  breastTenderness: boolean;
  headache: boolean;
  moodShift: boolean;
  cravings: boolean;
  energyLevel: boolean;
  sleepQuality: boolean;
}

export interface CycleReminders {
  enabled: boolean;
  notificationsEnabled: boolean; // Master on/off for all notifications
  periodApproaching: boolean; // Alert before predicted period
  daysBeforePeriodAlert: number; // How many days before (1-7)
  pmsStarting: boolean; // Based on user's historical patterns
  logSymptomsReminder: boolean; // Daily during period
  ovulationReminder: boolean; // Fertility window alerts
  alertType: 'push' | 'firefly'; // How to deliver alerts
}

export type GuideAdaptationLevel = 'none' | 'subtle' | 'full';

export interface CycleSettings {
  enabled: boolean; // Master toggle for all cycle features
  lifeStage: LifeStage; // Current life stage
  showQuickSymptomButton: boolean;
  enableSoothingSparks: boolean;
  enableCycleFireflies: boolean;
  guideAdaptationLevel: GuideAdaptationLevel;
  enabledTwigs: CycleTwigSettings;
  reminders: CycleReminders;
  syncSource: 'manual' | 'healthkit' | 'oura' | 'whoop';
  // Fertility & Contraception
  trackFertilityWindow: boolean;
  contraception: ContraceptionReminder;
  // Pregnancy (when lifeStage === 'pregnant')
  pregnancy?: PregnancyData;
  // Perimenopause/Menopause specific
  trackMenopauseSymptoms: boolean;
}

// ============================================
// HEALTHKIT INTEGRATION
// ============================================

export interface HealthKitCycleData {
  menstrualFlowRecords: Array<{
    startDate: Date;
    endDate: Date;
    value: number; // 1=unspecified, 2=light, 3=medium, 4=heavy
  }>;
  symptomRecords: Array<{
    type: string;
    startDate: Date;
    value: number;
  }>;
}

// ============================================
// AI CONTEXT (What's shared with guide)
// ============================================

export interface CycleContextForAI {
  lifeStage: LifeStage;
  phase?: CyclePhase; // Not applicable for menopause/pregnancy
  dayOfCycle?: number;
  isPMS?: boolean;
  trimester?: 1 | 2 | 3; // For pregnancy
  weeksPregnant?: number;
  recentSymptoms: string[]; // Just symptom names, no details
  // Note: Raw dates and detailed data are NEVER sent to AI
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function createDefaultCycleSettings(): CycleSettings {
  return {
    enabled: false,
    lifeStage: 'regularCycles',
    showQuickSymptomButton: true,
    enableSoothingSparks: true,
    enableCycleFireflies: true,
    guideAdaptationLevel: 'full',
    enabledTwigs: {
      periodStartEnd: true,
      flowLevel: true,
      cramps: true,
      bloating: true,
      breastTenderness: true,
      headache: true,
      moodShift: true,
      cravings: true,
      energyLevel: true,
      sleepQuality: true,
    },
    reminders: {
      enabled: true,
      notificationsEnabled: true,
      periodApproaching: true,
      daysBeforePeriodAlert: 3,
      pmsStarting: true,
      logSymptomsReminder: false,
      ovulationReminder: false,
      alertType: 'firefly',
    },
    syncSource: 'manual',
    trackFertilityWindow: false,
    contraception: {
      type: 'none',
      enabled: false,
    },
    trackMenopauseSymptoms: false,
  };
}

export function createEmptyCycleData(): CycleData {
  return {
    periods: [],
    symptoms: [],
    flowLevels: [],
    averageCycleLength: 28, // Default assumption
    averagePeriodLength: 5, // Default assumption
    lastUpdated: new Date().toISOString(),
  };
}

export function getPhaseDescription(phase: CyclePhase): string {
  const descriptions: Record<CyclePhase, string> = {
    menstrual: 'Menstrual phase - energy may be lower, extra gentleness helps',
    follicular: 'Follicular phase - energy typically rising, open to new challenges',
    ovulation: 'Ovulation phase - often peak energy and sociability',
    luteal: 'Luteal phase - winding down, self-care becomes important',
  };
  return descriptions[phase];
}

export function symptomTypeToHealthKit(type: CycleSymptomType): string {
  const mapping: Record<string, string> = {
    cramps: 'HKCategoryTypeIdentifierAbdominalCramps',
    bloating: 'HKCategoryTypeIdentifierBloating',
    breastTenderness: 'HKCategoryTypeIdentifierBreastPain',
    headache: 'HKCategoryTypeIdentifierHeadache',
    moodShift: 'HKCategoryTypeIdentifierMoodChanges',
    cravings: 'HKCategoryTypeIdentifierAppetiteChanges',
    fatigue: 'HKCategoryTypeIdentifierFatigue',
    backPain: 'HKCategoryTypeIdentifierLowerBackPain',
    acne: 'HKCategoryTypeIdentifierAcne',
    insomnia: 'HKCategoryTypeIdentifierSleepChanges',
    hotFlash: 'HKCategoryTypeIdentifierHotFlashes',
    nightSweat: 'HKCategoryTypeIdentifierNightSweats',
    vaginalDryness: 'HKCategoryTypeIdentifierVaginalDryness',
  };
  return mapping[type] || '';
}

export function getLifeStageDescription(stage: LifeStage): string {
  const descriptions: Record<LifeStage, string> = {
    regularCycles: 'Regular menstrual cycles',
    perimenopause: 'Perimenopause - cycles may be irregular, symptoms emerging',
    menopause: 'Menopause - no period for 12+ months, symptom management focus',
    postMenopause: 'Post-menopause - wellness maintenance',
    pregnant: 'Pregnancy - cycle tracking paused, trimester focus',
    postpartum: 'Postpartum - recovery and adjustment period',
  };
  return descriptions[stage];
}

export function getLifeStageGuideAdaptation(stage: LifeStage): string {
  const adaptations: Record<LifeStage, string> = {
    regularCycles: 'Adapts to cycle phases, gentler during PMS/period',
    perimenopause: 'Validates unpredictability, normalizes symptoms, extra patience',
    menopause: 'No period expectations, focuses on symptom support and wellness',
    postMenopause: 'Wellness-focused, supports healthy aging',
    pregnant: 'Trimester-aware, validates physical changes, gentle encouragement',
    postpartum: 'Acknowledges exhaustion, validates adjustment, no pressure',
  };
  return adaptations[stage];
}

export function getMenopauseSymptoms(): CycleSymptomType[] {
  return [
    'hotFlash',
    'nightSweat',
    'sleepDisturbance',
    'brainFog',
    'vaginalDryness',
    'jointPain',
    'heartPalpitations',
    'anxietySpike',
    'moodShift',
    'fatigue',
    'libidoChange',
  ];
}
