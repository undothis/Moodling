/**
 * Cycle Tracking Service
 *
 * Core service for menstrual cycle tracking in Mood Leaf.
 * Handles period logging, phase calculation, symptom tracking,
 * and integration with other app features (Sparks, Fireflies, Guide).
 *
 * Privacy: All data stored locally via AsyncStorage.
 * Only phase summaries shared with AI guide.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CycleData,
  CycleSettings,
  CyclePhase,
  PhaseInfo,
  PeriodEntry,
  CycleSymptom,
  CycleSymptomType,
  FlowLevel,
  CycleContextForAI,
  createDefaultCycleSettings,
  createEmptyCycleData,
} from '../types/CycleTracking';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  CYCLE_DATA: 'moodleaf_cycle_data',
  CYCLE_SETTINGS: 'moodleaf_cycle_settings',
};

// ============================================
// PHASE CALCULATION CONSTANTS
// ============================================

const DEFAULT_CYCLE_LENGTH = 28;
const PHASE_RANGES = {
  menstrual: { start: 1, end: 5 },
  follicular: { start: 6, end: 13 },
  ovulation: { start: 14, end: 16 },
  luteal: { start: 17, end: 28 },
};
const PMS_DAYS_BEFORE_PERIOD = 7;

// ============================================
// DATA PERSISTENCE
// ============================================

export async function getCycleData(): Promise<CycleData> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CYCLE_DATA);
    if (stored) {
      return JSON.parse(stored);
    }
    return createEmptyCycleData();
  } catch (error) {
    console.error('Error loading cycle data:', error);
    return createEmptyCycleData();
  }
}

export async function saveCycleData(data: CycleData): Promise<void> {
  try {
    data.lastUpdated = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.CYCLE_DATA, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving cycle data:', error);
    throw error;
  }
}

export async function getCycleSettings(): Promise<CycleSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CYCLE_SETTINGS);
    if (stored) {
      // Merge with defaults to handle new settings added in updates
      return { ...createDefaultCycleSettings(), ...JSON.parse(stored) };
    }
    return createDefaultCycleSettings();
  } catch (error) {
    console.error('Error loading cycle settings:', error);
    return createDefaultCycleSettings();
  }
}

export async function saveCycleSettings(settings: CycleSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CYCLE_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving cycle settings:', error);
    throw error;
  }
}

// ============================================
// PERIOD TRACKING
// ============================================

export async function startPeriod(date?: Date): Promise<PeriodEntry> {
  const data = await getCycleData();
  const startDate = (date || new Date()).toISOString().split('T')[0];

  // Check if there's an ongoing period that needs to be closed
  const ongoingPeriod = data.periods.find((p) => !p.endDate);
  if (ongoingPeriod) {
    // Auto-end the previous period
    ongoingPeriod.endDate = startDate;
  }

  const newPeriod: PeriodEntry = {
    id: `period_${Date.now()}`,
    startDate,
  };

  // Calculate cycle length from previous period
  if (data.periods.length > 0) {
    const lastPeriod = data.periods[data.periods.length - 1];
    const lastStart = new Date(lastPeriod.startDate);
    const thisStart = new Date(startDate);
    const daysDiff = Math.round(
      (thisStart.getTime() - lastStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff > 0 && daysDiff < 60) {
      // Reasonable cycle length
      newPeriod.cycleLength = daysDiff;
    }
  }

  data.periods.push(newPeriod);
  await updateAverages(data);
  await saveCycleData(data);

  return newPeriod;
}

export async function endPeriod(date?: Date): Promise<void> {
  const data = await getCycleData();
  const endDate = (date || new Date()).toISOString().split('T')[0];

  const ongoingPeriod = data.periods.find((p) => !p.endDate);
  if (ongoingPeriod) {
    ongoingPeriod.endDate = endDate;
    await updateAverages(data);
    await saveCycleData(data);
  }
}

export async function isOnPeriod(): Promise<boolean> {
  const data = await getCycleData();
  return data.periods.some((p) => !p.endDate);
}

// ============================================
// PHASE CALCULATION
// ============================================

export async function getCurrentPhase(): Promise<PhaseInfo | null> {
  const data = await getCycleData();
  const settings = await getCycleSettings();

  if (!settings.enabled || data.periods.length === 0) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the most recent period start
  const sortedPeriods = [...data.periods].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
  const lastPeriod = sortedPeriods[0];
  const lastPeriodStart = new Date(lastPeriod.startDate);
  lastPeriodStart.setHours(0, 0, 0, 0);

  // Calculate day of cycle
  const daysSinceLastPeriod = Math.floor(
    (today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const cycleLength = data.averageCycleLength || DEFAULT_CYCLE_LENGTH;
  const dayOfCycle = (daysSinceLastPeriod % cycleLength) + 1;

  // Determine phase
  const phase = calculatePhase(dayOfCycle, cycleLength);

  // Calculate days until next phase
  const daysUntilNextPhase = calculateDaysUntilNextPhase(dayOfCycle, cycleLength);

  // Determine if in PMS window (last 7 days of luteal)
  const daysUntilPeriod = cycleLength - dayOfCycle;
  const isPMS = daysUntilPeriod <= PMS_DAYS_BEFORE_PERIOD && daysUntilPeriod > 0;

  return {
    phase,
    dayOfCycle,
    daysUntilNextPhase,
    isPMS,
  };
}

function calculatePhase(dayOfCycle: number, cycleLength: number): CyclePhase {
  // Adjust phase ranges based on cycle length
  const scaleFactor = cycleLength / DEFAULT_CYCLE_LENGTH;

  const menstrualEnd = Math.round(PHASE_RANGES.menstrual.end * scaleFactor);
  const follicularEnd = Math.round(PHASE_RANGES.follicular.end * scaleFactor);
  const ovulationEnd = Math.round(PHASE_RANGES.ovulation.end * scaleFactor);

  if (dayOfCycle <= menstrualEnd) {
    return 'menstrual';
  } else if (dayOfCycle <= follicularEnd) {
    return 'follicular';
  } else if (dayOfCycle <= ovulationEnd) {
    return 'ovulation';
  } else {
    return 'luteal';
  }
}

function calculateDaysUntilNextPhase(dayOfCycle: number, cycleLength: number): number {
  const scaleFactor = cycleLength / DEFAULT_CYCLE_LENGTH;

  const menstrualEnd = Math.round(PHASE_RANGES.menstrual.end * scaleFactor);
  const follicularEnd = Math.round(PHASE_RANGES.follicular.end * scaleFactor);
  const ovulationEnd = Math.round(PHASE_RANGES.ovulation.end * scaleFactor);

  if (dayOfCycle <= menstrualEnd) {
    return menstrualEnd - dayOfCycle + 1;
  } else if (dayOfCycle <= follicularEnd) {
    return follicularEnd - dayOfCycle + 1;
  } else if (dayOfCycle <= ovulationEnd) {
    return ovulationEnd - dayOfCycle + 1;
  } else {
    return cycleLength - dayOfCycle + 1;
  }
}

// ============================================
// PREDICTIONS
// ============================================

export async function getPredictedNextPeriod(): Promise<Date | null> {
  const data = await getCycleData();

  if (data.periods.length === 0) {
    return null;
  }

  const sortedPeriods = [...data.periods].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
  const lastPeriod = sortedPeriods[0];
  const lastPeriodStart = new Date(lastPeriod.startDate);

  const predictedNext = new Date(lastPeriodStart);
  predictedNext.setDate(predictedNext.getDate() + (data.averageCycleLength || DEFAULT_CYCLE_LENGTH));

  return predictedNext;
}

export async function getDaysUntilPeriod(): Promise<number | null> {
  const predicted = await getPredictedNextPeriod();
  if (!predicted) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  predicted.setHours(0, 0, 0, 0);

  const days = Math.ceil((predicted.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return days;
}

// ============================================
// SYMPTOM TRACKING
// ============================================

export async function logSymptom(
  type: CycleSymptomType,
  severity: 1 | 2 | 3,
  notes?: string,
  date?: Date
): Promise<CycleSymptom> {
  const data = await getCycleData();
  const symptomDate = (date || new Date()).toISOString().split('T')[0];

  const symptom: CycleSymptom = {
    id: `symptom_${Date.now()}`,
    date: symptomDate,
    type,
    severity,
    notes,
    syncedToHealthKit: false,
  };

  data.symptoms.push(symptom);
  await saveCycleData(data);

  return symptom;
}

export async function logFlowLevel(
  level: FlowLevel['level'],
  date?: Date
): Promise<void> {
  const data = await getCycleData();
  const flowDate = (date || new Date()).toISOString().split('T')[0];

  // Update or add flow level for this date
  const existingIndex = data.flowLevels.findIndex((f) => f.date === flowDate);
  if (existingIndex >= 0) {
    data.flowLevels[existingIndex].level = level;
  } else {
    data.flowLevels.push({ date: flowDate, level });
  }

  await saveCycleData(data);
}

export async function getSymptomsForDate(date: Date): Promise<CycleSymptom[]> {
  const data = await getCycleData();
  const dateStr = date.toISOString().split('T')[0];
  return data.symptoms.filter((s) => s.date === dateStr);
}

export async function getRecentSymptoms(days: number = 7): Promise<CycleSymptom[]> {
  const data = await getCycleData();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  return data.symptoms.filter((s) => s.date >= cutoffStr);
}

// ============================================
// PATTERN DETECTION
// ============================================

export async function getSymptomPatterns(): Promise<Map<CycleSymptomType, number[]>> {
  const data = await getCycleData();
  const patterns = new Map<CycleSymptomType, number[]>();

  // Group symptoms by type and calculate average day of cycle they occur
  for (const symptom of data.symptoms) {
    const symptomDate = new Date(symptom.date);

    // Find which period this symptom belongs to
    const relevantPeriod = data.periods.find((p) => {
      const periodStart = new Date(p.startDate);
      const periodEnd = p.endDate ? new Date(p.endDate) : new Date();
      return symptomDate >= periodStart && symptomDate <= periodEnd;
    });

    if (relevantPeriod) {
      const periodStart = new Date(relevantPeriod.startDate);
      const dayOfCycle = Math.floor(
        (symptomDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      if (!patterns.has(symptom.type)) {
        patterns.set(symptom.type, []);
      }
      patterns.get(symptom.type)!.push(dayOfCycle);
    }
  }

  return patterns;
}

// ============================================
// AI CONTEXT GENERATION
// ============================================

export async function getCycleContextForAI(): Promise<CycleContextForAI | null> {
  const settings = await getCycleSettings();
  if (!settings.enabled) {
    return null;
  }

  const phaseInfo = await getCurrentPhase();
  if (!phaseInfo) {
    return null;
  }

  const recentSymptoms = await getRecentSymptoms(3);
  const symptomNames = [...new Set(recentSymptoms.map((s) => s.type))];

  return {
    phase: phaseInfo.phase,
    dayOfCycle: phaseInfo.dayOfCycle,
    isPMS: phaseInfo.isPMS,
    recentSymptoms: symptomNames,
  };
}

export function formatCycleContextForPrompt(context: CycleContextForAI): string {
  const phaseDescriptions: Record<CyclePhase, string> = {
    menstrual: 'menstrual phase (energy may be lower)',
    follicular: 'follicular phase (energy typically rising)',
    ovulation: 'ovulation phase (often peak energy)',
    luteal: 'luteal phase (winding down)',
  };

  let prompt = `Cycle: ${phaseDescriptions[context.phase]}, day ${context.dayOfCycle}`;

  if (context.isPMS) {
    prompt += ', PMS window';
  }

  if (context.recentSymptoms.length > 0) {
    prompt += `. Recent: ${context.recentSymptoms.join(', ')}`;
  }

  return prompt;
}

// ============================================
// GUIDE ADAPTATION
// ============================================

export async function getGuideAdaptation(): Promise<{
  toneAdjustment: string;
  suggestedApproach: string;
} | null> {
  const settings = await getCycleSettings();
  if (!settings.enabled || settings.guideAdaptationLevel === 'none') {
    return null;
  }

  const phaseInfo = await getCurrentPhase();
  if (!phaseInfo) {
    return null;
  }

  const adaptations: Record<CyclePhase, { toneAdjustment: string; suggestedApproach: string }> = {
    menstrual: {
      toneAdjustment: 'extra gentle, acknowledging physical discomfort',
      suggestedApproach: 'Validate energy dips, avoid pushing productivity, focus on comfort',
    },
    follicular: {
      toneAdjustment: 'encouraging, open to new ideas',
      suggestedApproach: 'Good time for planning, trying new things, normal engagement',
    },
    ovulation: {
      toneAdjustment: 'energetic, action-oriented',
      suggestedApproach: 'Peak energy window, can handle challenges, social engagement',
    },
    luteal: {
      toneAdjustment: phaseInfo.isPMS ? 'very gentle, validating' : 'calm, supportive',
      suggestedApproach: phaseInfo.isPMS
        ? 'Extra compassion, validate physical/emotional symptoms, no pressure'
        : 'Winding down energy, self-care focus, gentler pace',
    },
  };

  // Apply subtle vs full adaptation
  if (settings.guideAdaptationLevel === 'subtle') {
    return {
      toneAdjustment: adaptations[phaseInfo.phase].toneAdjustment,
      suggestedApproach: 'Slight adjustment only',
    };
  }

  return adaptations[phaseInfo.phase];
}

// ============================================
// SOOTHING SPARKS
// ============================================

export async function getSoothingSparks(): Promise<string[]> {
  const settings = await getCycleSettings();
  if (!settings.enabled || !settings.enableSoothingSparks) {
    return [];
  }

  const phaseInfo = await getCurrentPhase();
  if (!phaseInfo || (!phaseInfo.isPMS && phaseInfo.phase !== 'menstrual')) {
    return [];
  }

  const soothingSparks = [
    'What would feel genuinely comforting right now?',
    'Your body is doing a lot. What does it need?',
    'What small act of self-care could you offer yourself?',
    'It\'s okay to need extra rest. How are you honoring that?',
    'What would you tell a friend feeling this way?',
    'What sounds soothing right now - warmth, quiet, movement, or stillness?',
    'Your feelings are valid, even the uncomfortable ones.',
    'What\'s one thing you can let go of today?',
    'Is there something you\'re being too hard on yourself about?',
    'What would make the next hour a little easier?',
  ];

  // Return a few random ones
  const shuffled = soothingSparks.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

// ============================================
// CYCLE FIREFLIES
// ============================================

export async function generateCycleFirefly(): Promise<string | null> {
  const settings = await getCycleSettings();
  if (!settings.enabled || !settings.enableCycleFireflies) {
    return null;
  }

  const phaseInfo = await getCurrentPhase();
  const data = await getCycleData();
  const patterns = await getSymptomPatterns();

  if (!phaseInfo) {
    return null;
  }

  const fireflies: string[] = [];

  // Phase-based insights
  if (phaseInfo.isPMS) {
    const daysUntil = await getDaysUntilPeriod();
    if (daysUntil !== null && daysUntil > 0) {
      fireflies.push(`Your period is predicted in ${daysUntil} day${daysUntil === 1 ? '' : 's'}.`);
    }
    fireflies.push('PMS window - your feelings are valid, even the intense ones.');
  }

  if (phaseInfo.phase === 'menstrual') {
    fireflies.push('Menstrual phase - extra gentleness is medicine right now.');
  }

  if (phaseInfo.phase === 'ovulation') {
    fireflies.push('Ovulation phase - energy tends to peak around now.');
  }

  // Pattern-based insights
  if (patterns.has('cramps') && patterns.get('cramps')!.length >= 3) {
    const avgDay = Math.round(
      patterns.get('cramps')!.reduce((a, b) => a + b, 0) / patterns.get('cramps')!.length
    );
    fireflies.push(`You tend to experience cramps around day ${avgDay} of your cycle.`);
  }

  if (patterns.has('moodShift') && patterns.get('moodShift')!.length >= 3) {
    fireflies.push('Your mood shifts follow a pattern. This awareness is powerful.');
  }

  // Return one random firefly
  if (fireflies.length === 0) {
    return null;
  }

  return fireflies[Math.floor(Math.random() * fireflies.length)];
}

// ============================================
// REMINDERS
// ============================================

export async function checkReminders(): Promise<{
  type: 'periodApproaching' | 'pmsStarting' | 'logSymptoms' | 'ovulation';
  message: string;
} | null> {
  const settings = await getCycleSettings();
  if (!settings.enabled || !settings.reminders.enabled || !settings.reminders.notificationsEnabled) {
    return null;
  }

  const daysUntilPeriod = await getDaysUntilPeriod();
  const phaseInfo = await getCurrentPhase();

  // Period approaching (configurable days before)
  const alertDays = settings.reminders.daysBeforePeriodAlert || 3;
  if (
    settings.reminders.periodApproaching &&
    daysUntilPeriod !== null &&
    daysUntilPeriod > 0 &&
    daysUntilPeriod <= alertDays
  ) {
    return {
      type: 'periodApproaching',
      message: `Your period is predicted in ${daysUntilPeriod} day${daysUntilPeriod === 1 ? '' : 's'}. Prep time?`,
    };
  }

  // PMS starting
  if (
    settings.reminders.pmsStarting &&
    phaseInfo?.isPMS &&
    daysUntilPeriod !== null &&
    daysUntilPeriod === PMS_DAYS_BEFORE_PERIOD
  ) {
    return {
      type: 'pmsStarting',
      message: 'PMS typically starts around now for you. Extra self-compassion helps.',
    };
  }

  // Ovulation reminder
  if (settings.reminders.ovulationReminder && phaseInfo?.phase === 'ovulation') {
    return {
      type: 'ovulation',
      message: 'Ovulation phase - fertility window if that matters to you.',
    };
  }

  // Log symptoms reminder (during period)
  if (settings.reminders.logSymptomsReminder && phaseInfo?.phase === 'menstrual') {
    const todaySymptoms = await getSymptomsForDate(new Date());
    if (todaySymptoms.length === 0) {
      return {
        type: 'logSymptoms',
        message: 'How are you feeling today? Quick symptom log helps track patterns.',
      };
    }
  }

  return null;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

async function updateAverages(data: CycleData): Promise<void> {
  // Calculate average cycle length
  const cycleLengths = data.periods
    .filter((p) => p.cycleLength && p.cycleLength > 0 && p.cycleLength < 60)
    .map((p) => p.cycleLength!);

  if (cycleLengths.length >= 2) {
    data.averageCycleLength = Math.round(
      cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length
    );
  }

  // Calculate average period length
  const periodLengths = data.periods
    .filter((p) => p.endDate)
    .map((p) => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate!);
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    })
    .filter((len) => len > 0 && len < 14);

  if (periodLengths.length >= 2) {
    data.averagePeriodLength = Math.round(
      periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length
    );
  }
}

export async function clearAllCycleData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.CYCLE_DATA);
  await AsyncStorage.removeItem(STORAGE_KEYS.CYCLE_SETTINGS);
}

export async function exportCycleData(): Promise<string> {
  const data = await getCycleData();
  const settings = await getCycleSettings();
  return JSON.stringify({ data, settings }, null, 2);
}
