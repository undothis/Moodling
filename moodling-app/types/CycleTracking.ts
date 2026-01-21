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
  | 'insomnia';

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
  periodApproaching: boolean; // 1-3 days before predicted period
  pmsStarting: boolean; // Based on user's historical patterns
  logSymptomsReminder: boolean; // Daily during period
  ovulationReminder: boolean; // Fertility window alerts
  alertType: 'push' | 'firefly'; // How to deliver alerts
}

export type GuideAdaptationLevel = 'none' | 'subtle' | 'full';

export interface CycleSettings {
  enabled: boolean; // Master toggle for all cycle features
  showQuickSymptomButton: boolean;
  enableSoothingSparks: boolean;
  enableCycleFireflies: boolean;
  guideAdaptationLevel: GuideAdaptationLevel;
  enabledTwigs: CycleTwigSettings;
  reminders: CycleReminders;
  syncSource: 'manual' | 'healthkit' | 'oura' | 'whoop';
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
  phase: CyclePhase;
  dayOfCycle: number;
  isPMS: boolean;
  recentSymptoms: string[]; // Just symptom names, no details
  // Note: Raw dates and detailed data are NEVER sent to AI
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function createDefaultCycleSettings(): CycleSettings {
  return {
    enabled: false,
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
      pmsStarting: true,
      logSymptomsReminder: false,
      ovulationReminder: false,
      alertType: 'firefly',
    },
    syncSource: 'manual',
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
  const mapping: Record<CycleSymptomType, string> = {
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
  };
  return mapping[type];
}
