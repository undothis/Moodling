/**
 * HealthKit Service
 *
 * Integrates with Apple HealthKit for health data context.
 * Provides: heart rate, sleep, steps, activity data.
 * Includes smart notifications when heart rate spikes.
 *
 * Following Mood Leaf Ethics:
 * - Data stays on device
 * - User controls permissions
 * - Never diagnose from health data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage keys
const HEALTHKIT_ENABLED_KEY = 'moodling_healthkit_enabled';
const HEALTHKIT_DATA_KEY = 'moodling_healthkit_data';
const HR_BASELINE_KEY = 'moodling_hr_baseline';
const HR_SPIKE_THRESHOLD_KEY = 'moodling_hr_spike_threshold';
const LAST_HR_NOTIFICATION_KEY = 'moodling_last_hr_notification';

/**
 * Health data types we track
 */
export type HealthDataType = 'heartRate' | 'sleep' | 'steps' | 'activeEnergy' | 'restingHeartRate' | 'heartRateVariability';

/**
 * Heart rate reading
 */
export interface HeartRateReading {
  value: number; // BPM
  timestamp: string;
  source?: string; // Apple Watch, etc.
}

/**
 * Sleep data
 */
export interface SleepData {
  date: string;
  totalSleepHours: number;
  deepSleepHours?: number;
  remSleepHours?: number;
  awakenings?: number;
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
}

/**
 * Activity data
 */
export interface ActivityData {
  date: string;
  steps: number;
  activeCalories: number;
  exerciseMinutes: number;
  standHours?: number;
}

/**
 * Complete health snapshot
 */
export interface HealthSnapshot {
  // Heart rate
  currentHeartRate?: number;
  restingHeartRate?: number;
  heartRateVariability?: number; // HRV in ms
  recentHeartRates: HeartRateReading[]; // Last 24 hours
  heartRateBaseline: number; // User's normal resting HR

  // Sleep
  lastNightSleep?: SleepData;
  weeklyAverageSleep?: number;
  sleepTrend?: 'improving' | 'declining' | 'stable';

  // Activity
  todayActivity?: ActivityData;
  weeklyAverageSteps?: number;
  activityTrend?: 'more_active' | 'less_active' | 'stable';

  // Derived insights
  isHeartRateElevated: boolean;
  isHeartRateSpiking: boolean;
  potentialStressIndicators: string[];

  lastUpdated: string;
}

/**
 * Heart rate spike event for notifications
 */
export interface HeartRateSpikeEvent {
  timestamp: string;
  heartRate: number;
  baseline: number;
  percentAboveBaseline: number;
  context?: string; // "while resting", "after activity", etc.
  userExplanation?: string; // If they respond to the notification
}

// Default baseline (will be personalized over time)
const DEFAULT_HR_BASELINE = 70;
const DEFAULT_SPIKE_THRESHOLD = 30; // % above baseline

/**
 * Check if HealthKit is available (iOS only)
 */
export function isHealthKitAvailable(): boolean {
  return Platform.OS === 'ios';
}

/**
 * Check if HealthKit is enabled by user
 */
export async function isHealthKitEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(HEALTHKIT_ENABLED_KEY);
    return enabled === 'true';
  } catch {
    return false;
  }
}

/**
 * Enable/disable HealthKit integration
 * Note: Actual HealthKit permission request would happen here
 */
export async function setHealthKitEnabled(enabled: boolean): Promise<boolean> {
  try {
    // In production, this would call:
    // import AppleHealthKit from 'react-native-health';
    // AppleHealthKit.initHealthKit(permissions, callback)

    await AsyncStorage.setItem(HEALTHKIT_ENABLED_KEY, enabled ? 'true' : 'false');
    return true;
  } catch (error) {
    console.error('Failed to set HealthKit enabled:', error);
    return false;
  }
}

/**
 * Get user's heart rate baseline (personalized over time)
 */
export async function getHeartRateBaseline(): Promise<number> {
  try {
    const baseline = await AsyncStorage.getItem(HR_BASELINE_KEY);
    return baseline ? parseInt(baseline, 10) : DEFAULT_HR_BASELINE;
  } catch {
    return DEFAULT_HR_BASELINE;
  }
}

/**
 * Update heart rate baseline (called periodically with resting HR data)
 */
export async function updateHeartRateBaseline(restingHR: number): Promise<void> {
  try {
    const currentBaseline = await getHeartRateBaseline();
    // Smooth update: 80% old, 20% new
    const newBaseline = Math.round(currentBaseline * 0.8 + restingHR * 0.2);
    await AsyncStorage.setItem(HR_BASELINE_KEY, newBaseline.toString());
  } catch (error) {
    console.error('Failed to update HR baseline:', error);
  }
}

/**
 * Get spike threshold percentage
 */
export async function getSpikeThreshold(): Promise<number> {
  try {
    const threshold = await AsyncStorage.getItem(HR_SPIKE_THRESHOLD_KEY);
    return threshold ? parseInt(threshold, 10) : DEFAULT_SPIKE_THRESHOLD;
  } catch {
    return DEFAULT_SPIKE_THRESHOLD;
  }
}

/**
 * Set custom spike threshold
 */
export async function setSpikeThreshold(threshold: number): Promise<void> {
  try {
    await AsyncStorage.setItem(HR_SPIKE_THRESHOLD_KEY, threshold.toString());
  } catch (error) {
    console.error('Failed to set spike threshold:', error);
  }
}

/**
 * Detect if heart rate is spiking
 */
export async function detectHeartRateSpike(currentHR: number): Promise<{
  isSpiking: boolean;
  percentAboveBaseline: number;
  baseline: number;
}> {
  const baseline = await getHeartRateBaseline();
  const threshold = await getSpikeThreshold();

  const percentAbove = ((currentHR - baseline) / baseline) * 100;
  const isSpiking = percentAbove >= threshold;

  return {
    isSpiking,
    percentAboveBaseline: Math.round(percentAbove),
    baseline,
  };
}

/**
 * Check if we should send a notification (rate limiting)
 * Don't spam - max 1 notification per 30 minutes
 */
async function shouldSendSpikeNotification(): Promise<boolean> {
  try {
    const lastNotification = await AsyncStorage.getItem(LAST_HR_NOTIFICATION_KEY);
    if (!lastNotification) return true;

    const lastTime = new Date(lastNotification).getTime();
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;

    return (now - lastTime) > thirtyMinutes;
  } catch {
    return true;
  }
}

/**
 * Record that we sent a spike notification
 */
async function recordSpikeNotification(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_HR_NOTIFICATION_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Failed to record notification:', error);
  }
}

/**
 * Handle heart rate spike - trigger notification
 * Returns notification content if should notify, null otherwise
 */
export async function handleHeartRateSpike(currentHR: number): Promise<{
  shouldNotify: boolean;
  title?: string;
  body?: string;
  spikeEvent?: HeartRateSpikeEvent;
} | null> {
  const { isSpiking, percentAboveBaseline, baseline } = await detectHeartRateSpike(currentHR);

  if (!isSpiking) return null;

  const shouldNotify = await shouldSendSpikeNotification();
  if (!shouldNotify) return null;

  await recordSpikeNotification();

  const spikeEvent: HeartRateSpikeEvent = {
    timestamp: new Date().toISOString(),
    heartRate: currentHR,
    baseline,
    percentAboveBaseline,
  };

  // Different messages based on severity
  let title: string;
  let body: string;

  if (percentAboveBaseline >= 50) {
    // Significant spike
    title = "Your heart rate is quite elevated";
    body = "Would you like to share what's going on? Sometimes naming it helps.";
  } else {
    // Moderate spike
    title = "Noticing your heart rate is up";
    body = "Hey, your body might be telling you something. Want to check in?";
  }

  return {
    shouldNotify: true,
    title,
    body,
    spikeEvent,
  };
}

/**
 * Fetch health data (mock implementation - real would use react-native-health)
 * In production, this would actually call HealthKit APIs
 */
export async function fetchHealthSnapshot(): Promise<HealthSnapshot> {
  // Check if enabled
  const enabled = await isHealthKitEnabled();
  if (!enabled || !isHealthKitAvailable()) {
    return createEmptySnapshot();
  }

  // In production, this would call:
  // import AppleHealthKit from 'react-native-health';
  // const heartRate = await AppleHealthKit.getHeartRateSamples(options);
  // const sleep = await AppleHealthKit.getSleepSamples(options);
  // etc.

  // For now, return stored/mock data
  try {
    const storedData = await AsyncStorage.getItem(HEALTHKIT_DATA_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (error) {
    console.error('Failed to fetch health snapshot:', error);
  }

  return createEmptySnapshot();
}

/**
 * Create empty snapshot when HealthKit not available/enabled
 */
function createEmptySnapshot(): HealthSnapshot {
  return {
    recentHeartRates: [],
    heartRateBaseline: DEFAULT_HR_BASELINE,
    isHeartRateElevated: false,
    isHeartRateSpiking: false,
    potentialStressIndicators: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Analyze health data for stress indicators
 * This is descriptive, not diagnostic!
 */
export function analyzeStressIndicators(snapshot: HealthSnapshot): string[] {
  const indicators: string[] = [];

  // Elevated heart rate while resting
  if (snapshot.currentHeartRate && snapshot.restingHeartRate) {
    if (snapshot.currentHeartRate > snapshot.restingHeartRate * 1.3) {
      indicators.push('elevated heart rate');
    }
  }

  // Low HRV (stress indicator)
  if (snapshot.heartRateVariability !== undefined && snapshot.heartRateVariability < 20) {
    indicators.push('low heart rate variability');
  }

  // Poor sleep
  if (snapshot.lastNightSleep) {
    if (snapshot.lastNightSleep.totalSleepHours < 5) {
      indicators.push('very limited sleep last night');
    } else if (snapshot.lastNightSleep.totalSleepHours < 6) {
      indicators.push('limited sleep last night');
    }
    if (snapshot.lastNightSleep.awakenings && snapshot.lastNightSleep.awakenings > 4) {
      indicators.push('disrupted sleep');
    }
  }

  // Declining sleep trend
  if (snapshot.sleepTrend === 'declining') {
    indicators.push('sleep quality declining this week');
  }

  // Low activity (can indicate low mood)
  if (snapshot.todayActivity && snapshot.weeklyAverageSteps) {
    if (snapshot.todayActivity.steps < snapshot.weeklyAverageSteps * 0.3) {
      indicators.push('much less active than usual today');
    }
  }

  return indicators;
}

/**
 * Format health data for Claude prompt
 * Descriptive language only - no diagnoses!
 */
export function formatHealthForPrompt(snapshot: HealthSnapshot): string {
  if (!snapshot || snapshot.recentHeartRates.length === 0 && !snapshot.lastNightSleep && !snapshot.todayActivity) {
    return '';
  }

  const parts: string[] = [];
  parts.push('HEALTH CONTEXT (from HealthKit):');

  // Heart rate
  if (snapshot.currentHeartRate) {
    const hrStatus = snapshot.isHeartRateElevated ? ' (elevated)' : '';
    parts.push(`Current heart rate: ${snapshot.currentHeartRate} BPM${hrStatus}`);
  }
  if (snapshot.restingHeartRate) {
    parts.push(`Resting heart rate: ${snapshot.restingHeartRate} BPM`);
  }
  if (snapshot.heartRateVariability !== undefined) {
    const hrvDesc = snapshot.heartRateVariability < 20 ? ' (low - may indicate stress)' :
                   snapshot.heartRateVariability > 50 ? ' (good)' : '';
    parts.push(`Heart rate variability: ${snapshot.heartRateVariability}ms${hrvDesc}`);
  }

  // Sleep
  if (snapshot.lastNightSleep) {
    const sleep = snapshot.lastNightSleep;
    let sleepDesc = `Last night's sleep: ${sleep.totalSleepHours.toFixed(1)} hours`;
    if (sleep.sleepQuality) {
      sleepDesc += ` (${sleep.sleepQuality})`;
    }
    parts.push(sleepDesc);

    if (sleep.awakenings && sleep.awakenings > 2) {
      parts.push(`  Woke up ${sleep.awakenings} times`);
    }
  }
  if (snapshot.weeklyAverageSleep !== undefined) {
    parts.push(`Weekly average sleep: ${snapshot.weeklyAverageSleep.toFixed(1)} hours`);
  }
  if (snapshot.sleepTrend && snapshot.sleepTrend !== 'stable') {
    parts.push(`Sleep trend: ${snapshot.sleepTrend}`);
  }

  // Activity
  if (snapshot.todayActivity) {
    const activity = snapshot.todayActivity;
    parts.push(`Today's steps: ${activity.steps.toLocaleString()}`);
    if (activity.exerciseMinutes > 0) {
      parts.push(`Exercise: ${activity.exerciseMinutes} minutes`);
    }
  }
  if (snapshot.activityTrend && snapshot.activityTrend !== 'stable') {
    parts.push(`Activity trend: ${snapshot.activityTrend === 'more_active' ? 'more active than usual' : 'less active than usual'}`);
  }

  // Stress indicators (descriptive only)
  if (snapshot.potentialStressIndicators.length > 0) {
    parts.push(`Body signals: ${snapshot.potentialStressIndicators.join(', ')}`);
  }

  // Heart rate spike context
  if (snapshot.isHeartRateSpiking) {
    parts.push('NOTE: Heart rate recently spiked - user may be experiencing stress or anxiety');
  }

  return parts.join('\n');
}

/**
 * Save health snapshot (for persistence between fetches)
 */
export async function saveHealthSnapshot(snapshot: HealthSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(HEALTHKIT_DATA_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.error('Failed to save health snapshot:', error);
  }
}

/**
 * Process incoming heart rate sample (called by HealthKit observer)
 * This would be triggered by background health data updates
 */
export async function processHeartRateSample(heartRate: number, timestamp: string): Promise<HeartRateSpikeEvent | null> {
  // Get current snapshot
  const snapshot = await fetchHealthSnapshot();

  // Add to recent readings
  snapshot.recentHeartRates.push({
    value: heartRate,
    timestamp,
  });

  // Keep only last 24 hours
  const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
  snapshot.recentHeartRates = snapshot.recentHeartRates.filter(
    r => new Date(r.timestamp).getTime() > twentyFourHoursAgo
  );

  // Update current HR
  snapshot.currentHeartRate = heartRate;

  // Check for spike
  const spikeResult = await handleHeartRateSpike(heartRate);

  // Update spike status
  snapshot.isHeartRateSpiking = spikeResult?.shouldNotify ?? false;
  snapshot.isHeartRateElevated = heartRate > snapshot.heartRateBaseline * 1.2;

  // Update stress indicators
  snapshot.potentialStressIndicators = analyzeStressIndicators(snapshot);

  // Save updated snapshot
  snapshot.lastUpdated = new Date().toISOString();
  await saveHealthSnapshot(snapshot);

  // Return spike event if notification should be sent
  return spikeResult?.spikeEvent ?? null;
}

/**
 * Process sleep data (called after user wakes up)
 */
export async function processSleepData(sleepData: SleepData): Promise<void> {
  const snapshot = await fetchHealthSnapshot();

  // Calculate sleep quality
  if (sleepData.totalSleepHours >= 7 && (!sleepData.awakenings || sleepData.awakenings <= 2)) {
    sleepData.sleepQuality = 'excellent';
  } else if (sleepData.totalSleepHours >= 6) {
    sleepData.sleepQuality = 'good';
  } else if (sleepData.totalSleepHours >= 5) {
    sleepData.sleepQuality = 'fair';
  } else {
    sleepData.sleepQuality = 'poor';
  }

  snapshot.lastNightSleep = sleepData;
  snapshot.lastUpdated = new Date().toISOString();

  await saveHealthSnapshot(snapshot);
}

/**
 * Process activity data
 */
export async function processActivityData(activityData: ActivityData): Promise<void> {
  const snapshot = await fetchHealthSnapshot();

  snapshot.todayActivity = activityData;
  snapshot.lastUpdated = new Date().toISOString();

  await saveHealthSnapshot(snapshot);
}

/**
 * Get health context for Claude (simplified export)
 */
export async function getHealthContextForClaude(): Promise<string> {
  const snapshot = await fetchHealthSnapshot();
  return formatHealthForPrompt(snapshot);
}

// ============================================
// CYCLE TRACKING HEALTHKIT INTEGRATION
// ============================================

const CYCLE_DATA_KEY = 'moodling_healthkit_cycle_data';

/**
 * HealthKit category types for cycle tracking
 * These map to HKCategoryTypeIdentifier values
 */
export const CYCLE_HEALTHKIT_TYPES = {
  read: [
    'HKCategoryTypeIdentifierMenstrualFlow',
    'HKCategoryTypeIdentifierIntermenstrualBleeding',
    'HKCategoryTypeIdentifierOvulationTestResult',
    'HKCategoryTypeIdentifierCervicalMucusQuality',
    'HKCategoryTypeIdentifierSexualActivity',
    'HKQuantityTypeIdentifierBasalBodyTemperature',
  ],
  write: [
    'HKCategoryTypeIdentifierMenstrualFlow',
    'HKCategoryTypeIdentifierAbdominalCramps',
    'HKCategoryTypeIdentifierBloating',
    'HKCategoryTypeIdentifierBreastPain',
    'HKCategoryTypeIdentifierHeadache',
    'HKCategoryTypeIdentifierMoodChanges',
    'HKCategoryTypeIdentifierFatigue',
    'HKCategoryTypeIdentifierLowerBackPain',
    'HKCategoryTypeIdentifierAcne',
    'HKCategoryTypeIdentifierSleepChanges',
    'HKCategoryTypeIdentifierAppetiteChanges',
  ],
};

/**
 * Menstrual flow data from HealthKit
 */
export interface HealthKitMenstrualFlow {
  startDate: string;
  endDate: string;
  value: 'unspecified' | 'light' | 'medium' | 'heavy' | 'none';
  source?: string;
}

/**
 * Cycle symptom record for HealthKit
 */
export interface HealthKitCycleSymptom {
  type: string; // HKCategoryTypeIdentifier
  startDate: string;
  value: number; // 0=notPresent, 1=mild, 2=moderate, 3=severe
  source?: string;
}

/**
 * Request cycle tracking permissions from HealthKit
 * In production, this would call the actual HealthKit API
 */
export async function requestCyclePermissions(): Promise<boolean> {
  if (!isHealthKitAvailable()) {
    return false;
  }

  // In production:
  // import AppleHealthKit from 'react-native-health';
  // const permissions = {
  //   permissions: {
  //     read: CYCLE_HEALTHKIT_TYPES.read,
  //     write: CYCLE_HEALTHKIT_TYPES.write,
  //   },
  // };
  // return new Promise((resolve) => {
  //   AppleHealthKit.initHealthKit(permissions, (error) => {
  //     resolve(!error);
  //   });
  // });

  // Mock implementation - always succeeds in development
  console.log('Requesting cycle HealthKit permissions (mock)');
  return true;
}

/**
 * Import menstrual flow data from HealthKit
 * Returns period records from the last 6 months
 */
export async function importCycleDataFromHealthKit(): Promise<HealthKitMenstrualFlow[]> {
  const enabled = await isHealthKitEnabled();
  if (!enabled || !isHealthKitAvailable()) {
    return [];
  }

  // In production:
  // import AppleHealthKit from 'react-native-health';
  // const options = {
  //   startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months
  // };
  // return new Promise((resolve) => {
  //   AppleHealthKit.getMenstrualFlow(options, (error, results) => {
  //     if (error) {
  //       console.error('Error fetching menstrual flow:', error);
  //       resolve([]);
  //       return;
  //     }
  //     resolve(results.map(r => ({
  //       startDate: r.startDate,
  //       endDate: r.endDate,
  //       value: mapHealthKitFlowValue(r.value),
  //       source: r.sourceName,
  //     })));
  //   });
  // });

  // Mock implementation - return stored data
  try {
    const stored = await AsyncStorage.getItem(CYCLE_DATA_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading cycle data from storage:', error);
  }
  return [];
}

/**
 * Write menstrual flow to HealthKit
 */
export async function writeMenstrualFlowToHealthKit(
  startDate: Date,
  endDate: Date,
  flowLevel: 'light' | 'medium' | 'heavy'
): Promise<boolean> {
  const enabled = await isHealthKitEnabled();
  if (!enabled || !isHealthKitAvailable()) {
    return false;
  }

  // In production:
  // import AppleHealthKit from 'react-native-health';
  // const options = {
  //   startDate: startDate.toISOString(),
  //   endDate: endDate.toISOString(),
  //   value: mapFlowLevelToHealthKit(flowLevel),
  // };
  // return new Promise((resolve) => {
  //   AppleHealthKit.saveMenstrualFlow(options, (error) => {
  //     resolve(!error);
  //   });
  // });

  // Mock implementation
  console.log('Writing menstrual flow to HealthKit (mock):', { startDate, endDate, flowLevel });
  return true;
}

/**
 * Write cycle symptom to HealthKit
 */
export async function writeCycleSymptomToHealthKit(
  symptomType: string,
  severity: 1 | 2 | 3,
  date: Date
): Promise<boolean> {
  const enabled = await isHealthKitEnabled();
  if (!enabled || !isHealthKitAvailable()) {
    return false;
  }

  // Map symptom type to HealthKit identifier
  const healthKitType = mapSymptomToHealthKitType(symptomType);
  if (!healthKitType) {
    console.warn('Unknown symptom type for HealthKit:', symptomType);
    return false;
  }

  // In production:
  // import AppleHealthKit from 'react-native-health';
  // const options = {
  //   type: healthKitType,
  //   startDate: date.toISOString(),
  //   value: severity, // 1=mild, 2=moderate, 3=severe
  // };
  // return new Promise((resolve) => {
  //   AppleHealthKit.saveCategorySample(options, (error) => {
  //     resolve(!error);
  //   });
  // });

  // Mock implementation
  console.log('Writing symptom to HealthKit (mock):', { symptomType, healthKitType, severity, date });
  return true;
}

/**
 * Sync cycle data bidirectionally with HealthKit
 * Imports new data from HealthKit and exports pending symptoms
 */
export async function syncCycleWithHealthKit(): Promise<{
  imported: number;
  exported: number;
}> {
  const enabled = await isHealthKitEnabled();
  if (!enabled || !isHealthKitAvailable()) {
    return { imported: 0, exported: 0 };
  }

  // Import from HealthKit
  const importedRecords = await importCycleDataFromHealthKit();

  // In a full implementation, we would:
  // 1. Merge imported records with local data
  // 2. Export any local-only symptoms to HealthKit
  // 3. Mark exported symptoms as synced

  return {
    imported: importedRecords.length,
    exported: 0, // Would count exported symptoms
  };
}

/**
 * Map symptom type to HealthKit category identifier
 */
function mapSymptomToHealthKitType(symptomType: string): string | null {
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
  };
  return mapping[symptomType] || null;
}

/**
 * Format cycle HealthKit data for AI context
 * Privacy-focused: only returns phase info, not raw dates
 */
export function formatCycleHealthDataForPrompt(
  menstrualRecords: HealthKitMenstrualFlow[]
): string {
  if (menstrualRecords.length === 0) {
    return '';
  }

  // Only mention that cycle data is synced with Apple Health
  // Don't include specific dates in AI context
  return 'Cycle data synced with Apple Health.';
}
