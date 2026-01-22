/**
 * Biometric Monitoring Service
 *
 * Orchestrates speech and facial recognition services for:
 * 1. Continuous monitoring (if enabled)
 * 2. Triage-based alert system
 * 3. Emergency contact notification
 * 4. Combined biometric assessment
 *
 * Triage Approach:
 * 1. First: Alert the user ("You seem different today - everything okay?")
 * 2. After configured delay: Notify emergency contact
 * 3. Urgent issues (like facial asymmetry) can bypass delay
 *
 * Privacy:
 * - All biometric data stored on-device
 * - Anonymous aggregated data optionally sent for training
 * - User has full control in settings
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  analyzeSpeech,
  getSpeechSettings,
  getSpeechContextForLLM,
  isSpeechAnalysisEnabled,
  SpeechAnalysisResult,
  SpeechSettings,
} from './speechAnalysisService';
import {
  analyzeFace,
  getFaceSettings,
  getFaceContextForLLM,
  isFaceRecognitionEnabled,
  FaceAnalysisResult,
  FaceSettings,
} from './facialRecognitionService';

// Storage keys
const STORAGE_KEYS = {
  BIOMETRIC_SETTINGS: 'moodleaf_biometric_settings',
  EMERGENCY_CONTACT: 'moodleaf_emergency_contact',
  ALERT_HISTORY: 'moodleaf_biometric_alert_history',
  PENDING_ALERTS: 'moodleaf_pending_alerts',
  LAST_MONITORING: 'moodleaf_last_monitoring',
};

// ============================================
// TYPES
// ============================================

/**
 * Emergency contact information
 */
export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  preferredMethod: 'phone' | 'email' | 'both';
  enabled: boolean;
}

/**
 * Combined biometric settings
 */
export interface BiometricSettings {
  enabled: boolean;
  // Which systems to use
  useSpeechAnalysis: boolean;
  useFaceRecognition: boolean;
  // Monitoring schedule
  continuousMonitoring: boolean;
  monitoringInterval: number; // Minutes between checks
  monitorOnAppOpen: boolean;
  // Triage settings
  alertUserFirst: boolean; // Always alert user before contact
  userResponseWindow: number; // Minutes to wait for user response
  notifyEmergencyContact: boolean;
  emergencyContactDelay: number; // Minutes after user alert
  bypassDelayForUrgent: boolean; // Skip delay for urgent issues
  // Privacy
  allowAnonymousData: boolean;
}

/**
 * Biometric alert
 */
export interface BiometricAlert {
  id: string;
  timestamp: string;
  type: 'identity' | 'speech' | 'face' | 'combined';
  severity: 'info' | 'warning' | 'concern' | 'urgent';
  title: string;
  message: string;
  // Source data
  speechResult?: Partial<SpeechAnalysisResult>;
  faceResult?: Partial<FaceAnalysisResult>;
  // Status
  userNotified: boolean;
  userNotifiedAt?: string;
  userResponded: boolean;
  userResponse?: 'dismiss' | 'acknowledge' | 'need_help';
  contactNotified: boolean;
  contactNotifiedAt?: string;
  // For triage
  requiresFollowUp: boolean;
  followUpAt?: string;
}

/**
 * UI-friendly emergency contact (simpler interface for settings)
 */
export interface EmergencyContactUI {
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  notificationPreference: 'sms' | 'call' | 'email' | 'all';
}

/**
 * UI-friendly biometric settings (simpler interface for settings screen)
 */
export interface BiometricSettingsUI {
  speechAnalysisEnabled: boolean;
  facialAnalysisEnabled: boolean;
  continuousMonitoring: boolean;
  alertUserFirst: boolean;
  notifyEmergencyContact: boolean;
  emergencyContactDelay: number;
  bypassDelayForUrgent: boolean;
  emergencyContact: EmergencyContactUI | null;
  shareAnonymousDataForTraining: boolean;
}

/**
 * Combined biometric assessment
 */
export interface BiometricAssessment {
  timestamp: string;
  // Individual results
  speech?: SpeechAnalysisResult;
  face?: FaceAnalysisResult;
  // Combined analysis
  overallStatus: 'normal' | 'minor_change' | 'notable_change' | 'concerning' | 'urgent';
  identityVerified: boolean;
  identityConfidence: number;
  // Health indicators
  indicators: {
    fatigue: boolean;
    stress: boolean;
    speechChanges: boolean;
    emotionalDistress: boolean;
    physicalConcern: boolean;
  };
  // Recommendations
  shouldAlert: boolean;
  alertType?: BiometricAlert['severity'];
  suggestedAction?: string;
}

// ============================================
// DEFAULT VALUES
// ============================================

const DEFAULT_BIOMETRIC_SETTINGS: BiometricSettings = {
  enabled: false, // Opt-in
  useSpeechAnalysis: true,
  useFaceRecognition: true,
  continuousMonitoring: false,
  monitoringInterval: 30, // Every 30 minutes
  monitorOnAppOpen: true,
  alertUserFirst: true,
  userResponseWindow: 15, // 15 minutes
  notifyEmergencyContact: false,
  emergencyContactDelay: 30, // 30 minutes
  bypassDelayForUrgent: true,
  allowAnonymousData: false,
};

/**
 * Get default biometric settings (for UI initialization)
 */
export function getDefaultBiometricSettings(): BiometricSettingsUI {
  return {
    speechAnalysisEnabled: false,
    facialAnalysisEnabled: false,
    continuousMonitoring: false,
    alertUserFirst: true,
    notifyEmergencyContact: false,
    emergencyContactDelay: 5,
    bypassDelayForUrgent: true,
    emergencyContact: null,
    shareAnonymousDataForTraining: false,
  };
}

/**
 * Save biometric settings (UI version)
 */
export async function saveBiometricSettings(settings: BiometricSettingsUI): Promise<void> {
  // Map UI settings to internal settings
  const internalSettings: Partial<BiometricSettings> = {
    enabled: settings.speechAnalysisEnabled || settings.facialAnalysisEnabled,
    useSpeechAnalysis: settings.speechAnalysisEnabled,
    useFaceRecognition: settings.facialAnalysisEnabled,
    continuousMonitoring: settings.continuousMonitoring,
    alertUserFirst: settings.alertUserFirst,
    notifyEmergencyContact: settings.notifyEmergencyContact,
    emergencyContactDelay: settings.emergencyContactDelay,
    bypassDelayForUrgent: settings.bypassDelayForUrgent,
    allowAnonymousData: settings.shareAnonymousDataForTraining,
  };

  await updateBiometricSettings(internalSettings);

  // Handle emergency contact separately
  if (settings.emergencyContact) {
    const contact: EmergencyContact = {
      id: 'primary',
      name: settings.emergencyContact.name,
      relationship: settings.emergencyContact.relationship,
      phone: settings.emergencyContact.phone,
      email: settings.emergencyContact.email,
      preferredMethod: settings.emergencyContact.notificationPreference === 'all' ? 'both' :
                       settings.emergencyContact.notificationPreference === 'call' ? 'phone' :
                       settings.emergencyContact.notificationPreference === 'email' ? 'email' : 'phone',
      enabled: true,
    };
    await setEmergencyContact(contact);
  } else {
    await removeEmergencyContact();
  }
}

// ============================================
// SETTINGS MANAGEMENT
// ============================================

/**
 * Get biometric monitoring settings (internal)
 */
export async function getBiometricSettingsInternal(): Promise<BiometricSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_SETTINGS);
    if (stored) {
      return { ...DEFAULT_BIOMETRIC_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load biometric settings:', error);
  }
  return DEFAULT_BIOMETRIC_SETTINGS;
}

/**
 * Get biometric monitoring settings (UI-friendly version)
 */
export async function getBiometricSettings(): Promise<BiometricSettingsUI> {
  const internal = await getBiometricSettingsInternal();
  const contact = await getEmergencyContact();

  return {
    speechAnalysisEnabled: internal.useSpeechAnalysis && internal.enabled,
    facialAnalysisEnabled: internal.useFaceRecognition && internal.enabled,
    continuousMonitoring: internal.continuousMonitoring,
    alertUserFirst: internal.alertUserFirst,
    notifyEmergencyContact: internal.notifyEmergencyContact,
    emergencyContactDelay: internal.emergencyContactDelay,
    bypassDelayForUrgent: internal.bypassDelayForUrgent,
    emergencyContact: contact ? {
      name: contact.name,
      phone: contact.phone || '',
      email: contact.email,
      relationship: contact.relationship,
      notificationPreference: contact.preferredMethod === 'both' ? 'all' :
                              contact.preferredMethod === 'phone' ? 'call' :
                              contact.preferredMethod === 'email' ? 'email' : 'sms',
    } : null,
    shareAnonymousDataForTraining: internal.allowAnonymousData,
  };
}

/**
 * Update biometric monitoring settings
 */
export async function updateBiometricSettings(
  updates: Partial<BiometricSettings>
): Promise<BiometricSettings> {
  const current = await getBiometricSettings();
  const updated = { ...current, ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_SETTINGS, JSON.stringify(updated));
  return updated;
}

/**
 * Check if biometric monitoring is enabled
 */
export async function isBiometricMonitoringEnabled(): Promise<boolean> {
  const settings = await getBiometricSettings();
  return settings.enabled && (settings.useSpeechAnalysis || settings.useFaceRecognition);
}

// ============================================
// EMERGENCY CONTACT MANAGEMENT
// ============================================

/**
 * Get emergency contact
 */
export async function getEmergencyContact(): Promise<EmergencyContact | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.EMERGENCY_CONTACT);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load emergency contact:', error);
  }
  return null;
}

/**
 * Set emergency contact
 */
export async function setEmergencyContact(contact: EmergencyContact): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.EMERGENCY_CONTACT, JSON.stringify(contact));
}

/**
 * Remove emergency contact
 */
export async function removeEmergencyContact(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.EMERGENCY_CONTACT);
}

/**
 * Check if emergency contact is configured
 */
export async function hasEmergencyContact(): Promise<boolean> {
  const contact = await getEmergencyContact();
  return contact !== null && contact.enabled;
}

// ============================================
// MONITORING
// ============================================

/**
 * Perform combined biometric monitoring
 * This is the main entry point for monitoring
 */
export async function performMonitoring(
  audioBuffer?: ArrayBuffer,
  imageBuffer?: ArrayBuffer
): Promise<BiometricAssessment> {
  const settings = await getBiometricSettings();

  if (!settings.enabled) {
    throw new Error('Biometric monitoring is disabled');
  }

  let speechResult: SpeechAnalysisResult | undefined;
  let faceResult: FaceAnalysisResult | undefined;

  // Analyze speech if available and enabled
  if (audioBuffer && settings.useSpeechAnalysis && await isSpeechAnalysisEnabled()) {
    try {
      speechResult = await analyzeSpeech(audioBuffer);
    } catch (error) {
      console.error('Speech analysis failed:', error);
    }
  }

  // Analyze face if available and enabled
  if (imageBuffer && settings.useFaceRecognition && await isFaceRecognitionEnabled()) {
    try {
      faceResult = await analyzeFace(imageBuffer);
    } catch (error) {
      console.error('Face analysis failed:', error);
    }
  }

  // Combine results into assessment
  const assessment = combineAssessment(speechResult, faceResult);

  // Store last monitoring time
  await AsyncStorage.setItem(STORAGE_KEYS.LAST_MONITORING, new Date().toISOString());

  // Check if we need to alert
  if (assessment.shouldAlert) {
    await handleAlert(assessment, settings);
  }

  return assessment;
}

/**
 * Combine speech and face results into a single assessment
 */
function combineAssessment(
  speech?: SpeechAnalysisResult,
  face?: FaceAnalysisResult
): BiometricAssessment {
  const now = new Date().toISOString();

  // Determine identity verification
  let identityVerified = true;
  let identityConfidence = 1;

  if (speech?.identityMatch) {
    identityVerified = identityVerified && speech.identityMatch.isMatch;
    identityConfidence = Math.min(identityConfidence, speech.identityMatch.confidence);
  }
  if (face?.identityMatch) {
    identityVerified = identityVerified && face.identityMatch.isMatch;
    identityConfidence = Math.min(identityConfidence, face.identityMatch.confidence);
  }

  // Combine indicators
  const indicators = {
    fatigue: face?.analysis.indicators.fatigue.detected || false,
    stress: face?.analysis.indicators.stress.detected || false,
    speechChanges: speech?.assessment.status !== 'normal' || false,
    emotionalDistress: face?.analysis.dominantEmotion.emotion === 'sad' ||
                       face?.analysis.dominantEmotion.emotion === 'fearful' ||
                       false,
    physicalConcern: speech?.patterns.slurring.detected ||
                     face?.analysis.indicators.asymmetry.detected ||
                     false,
  };

  // Determine overall status
  let overallStatus: BiometricAssessment['overallStatus'] = 'normal';
  let urgentIssue = false;

  // Check for urgent issues first
  if (face?.analysis.indicators.asymmetry.urgency === 'urgent') {
    overallStatus = 'urgent';
    urgentIssue = true;
  } else if (speech?.assessment.requiresAttention || face?.assessment.requiresAttention) {
    overallStatus = 'concerning';
  } else if (speech?.assessment.status === 'notable_change' || face?.assessment.status === 'notable_change') {
    overallStatus = 'notable_change';
  } else if (speech?.assessment.status === 'minor_change' || face?.assessment.status === 'minor_change') {
    overallStatus = 'minor_change';
  }

  // Determine if we should alert
  let shouldAlert = false;
  let alertType: BiometricAlert['severity'] | undefined;
  let suggestedAction: string | undefined;

  if (!identityVerified && identityConfidence < 0.5) {
    shouldAlert = true;
    alertType = 'warning';
    suggestedAction = 'Identity verification failed. Please verify this is you.';
  } else if (urgentIssue) {
    shouldAlert = true;
    alertType = 'urgent';
    suggestedAction = 'We detected something that may need immediate attention. Please check in.';
  } else if (overallStatus === 'concerning') {
    shouldAlert = true;
    alertType = 'concern';
    suggestedAction = 'We noticed some changes. How are you feeling?';
  } else if (indicators.physicalConcern) {
    shouldAlert = true;
    alertType = 'concern';
    suggestedAction = 'We noticed some physical changes. Everything okay?';
  }

  return {
    timestamp: now,
    speech,
    face,
    overallStatus,
    identityVerified,
    identityConfidence,
    indicators,
    shouldAlert,
    alertType,
    suggestedAction,
  };
}

// ============================================
// ALERT MANAGEMENT
// ============================================

/**
 * Handle a biometric alert according to triage rules
 */
async function handleAlert(
  assessment: BiometricAssessment,
  settings: BiometricSettings
): Promise<BiometricAlert> {
  const alert: BiometricAlert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: assessment.timestamp,
    type: assessment.speech && assessment.face ? 'combined' :
          assessment.speech ? 'speech' : 'face',
    severity: assessment.alertType || 'info',
    title: getAlertTitle(assessment),
    message: assessment.suggestedAction || 'We noticed something different.',
    speechResult: assessment.speech ? {
      assessment: assessment.speech.assessment,
      patterns: assessment.speech.patterns,
    } : undefined,
    faceResult: assessment.face ? {
      assessment: assessment.face.assessment,
      analysis: {
        dominantEmotion: assessment.face.analysis.dominantEmotion,
        indicators: assessment.face.analysis.indicators,
      },
    } as Partial<FaceAnalysisResult> : undefined,
    userNotified: false,
    userResponded: false,
    contactNotified: false,
    requiresFollowUp: assessment.alertType === 'concern' || assessment.alertType === 'urgent',
  };

  // Save alert
  await saveAlert(alert);

  // Step 1: Alert the user first (if enabled)
  if (settings.alertUserFirst) {
    await notifyUser(alert);
    alert.userNotified = true;
    alert.userNotifiedAt = new Date().toISOString();

    // Schedule follow-up for emergency contact
    if (settings.notifyEmergencyContact) {
      const delay = (assessment.alertType === 'urgent' && settings.bypassDelayForUrgent)
        ? 0
        : settings.emergencyContactDelay;

      if (delay === 0) {
        // Immediate notification for urgent
        await notifyEmergencyContact(alert);
        alert.contactNotified = true;
        alert.contactNotifiedAt = new Date().toISOString();
      } else {
        // Schedule for later
        alert.followUpAt = new Date(Date.now() + delay * 60 * 1000).toISOString();
        await schedulePendingAlert(alert);
      }
    }
  }

  // Update saved alert
  await saveAlert(alert);

  return alert;
}

function getAlertTitle(assessment: BiometricAssessment): string {
  if (!assessment.identityVerified) {
    return 'Identity Verification';
  }
  if (assessment.alertType === 'urgent') {
    return 'Important Check-in';
  }
  if (assessment.indicators.physicalConcern) {
    return 'Health Check-in';
  }
  if (assessment.indicators.stress || assessment.indicators.emotionalDistress) {
    return 'Wellness Check-in';
  }
  return 'Quick Check-in';
}

/**
 * Notify the user about an alert
 */
async function notifyUser(alert: BiometricAlert): Promise<void> {
  // TODO: Implement actual notification
  // This would use push notifications or in-app alerts

  console.log('User notification:', {
    title: alert.title,
    message: alert.message,
    severity: alert.severity,
  });

  // In production, this would:
  // 1. Show in-app alert/modal
  // 2. Send push notification if app is backgrounded
  // 3. Play sound/vibration based on severity
}

/**
 * Notify emergency contact
 */
async function notifyEmergencyContact(alert: BiometricAlert): Promise<void> {
  const contact = await getEmergencyContact();

  if (!contact || !contact.enabled) {
    console.log('No emergency contact configured or enabled');
    return;
  }

  // TODO: Implement actual contact notification
  // This would send SMS/email/call

  console.log('Emergency contact notification:', {
    contact: contact.name,
    method: contact.preferredMethod,
    alert: {
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
    },
  });

  // In production, this would:
  // 1. Send SMS via Twilio or similar
  // 2. Send email
  // 3. Possibly initiate a call
  // Message would be something like:
  // "[App Name] Alert: [User Name] may need your attention.
  //  They haven't responded to a wellness check.
  //  Please reach out to them."
}

/**
 * User responds to an alert
 */
export async function respondToAlert(
  alertId: string,
  response: 'dismiss' | 'acknowledge' | 'need_help'
): Promise<void> {
  const alerts = await getAlertHistory();
  const alert = alerts.find(a => a.id === alertId);

  if (!alert) {
    console.error('Alert not found:', alertId);
    return;
  }

  alert.userResponded = true;
  alert.userResponse = response;

  // If user needs help, notify contact immediately
  if (response === 'need_help') {
    const settings = await getBiometricSettings();
    if (settings.notifyEmergencyContact) {
      await notifyEmergencyContact(alert);
      alert.contactNotified = true;
      alert.contactNotifiedAt = new Date().toISOString();
    }
  }

  // If user responded, cancel pending contact notification
  if (response === 'dismiss' || response === 'acknowledge') {
    await cancelPendingAlert(alertId);
  }

  // Update alert
  await saveAlert(alert);
}

// ============================================
// ALERT STORAGE
// ============================================

/**
 * Save an alert to history
 */
async function saveAlert(alert: BiometricAlert): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ALERT_HISTORY);
    let history: BiometricAlert[] = stored ? JSON.parse(stored) : [];

    // Update existing or add new
    const index = history.findIndex(a => a.id === alert.id);
    if (index >= 0) {
      history[index] = alert;
    } else {
      history.push(alert);
    }

    // Keep last 50 alerts
    if (history.length > 50) {
      history = history.slice(-50);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.ALERT_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save alert:', error);
  }
}

/**
 * Get alert history
 */
export async function getAlertHistory(limit = 20): Promise<BiometricAlert[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ALERT_HISTORY);
    if (stored) {
      const history: BiometricAlert[] = JSON.parse(stored);
      return history.slice(-limit);
    }
  } catch (error) {
    console.error('Failed to load alert history:', error);
  }
  return [];
}

/**
 * Schedule a pending alert for later notification
 */
async function schedulePendingAlert(alert: BiometricAlert): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ALERTS);
    const pending: BiometricAlert[] = stored ? JSON.parse(stored) : [];
    pending.push(alert);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ALERTS, JSON.stringify(pending));
  } catch (error) {
    console.error('Failed to schedule pending alert:', error);
  }
}

/**
 * Cancel a pending alert
 */
async function cancelPendingAlert(alertId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ALERTS);
    if (stored) {
      let pending: BiometricAlert[] = JSON.parse(stored);
      pending = pending.filter(a => a.id !== alertId);
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ALERTS, JSON.stringify(pending));
    }
  } catch (error) {
    console.error('Failed to cancel pending alert:', error);
  }
}

/**
 * Process pending alerts (called periodically)
 */
export async function processPendingAlerts(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ALERTS);
    if (!stored) return;

    const pending: BiometricAlert[] = JSON.parse(stored);
    const now = Date.now();
    const remaining: BiometricAlert[] = [];

    for (const alert of pending) {
      if (!alert.followUpAt) continue;

      const followUpTime = new Date(alert.followUpAt).getTime();

      // Check if user hasn't responded and follow-up time has passed
      if (!alert.userResponded && now >= followUpTime) {
        // Notify emergency contact
        await notifyEmergencyContact(alert);
        alert.contactNotified = true;
        alert.contactNotifiedAt = new Date().toISOString();
        await saveAlert(alert);
      } else if (!alert.userResponded) {
        // Keep in pending
        remaining.push(alert);
      }
    }

    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ALERTS, JSON.stringify(remaining));
  } catch (error) {
    console.error('Failed to process pending alerts:', error);
  }
}

// ============================================
// CONTEXT FOR LLM
// ============================================

/**
 * Get combined biometric context for the AI coach
 */
export async function getBiometricContextForLLM(): Promise<string> {
  const settings = await getBiometricSettings();

  if (!settings.enabled) {
    return '';
  }

  const parts: string[] = [];

  // Get speech context
  if (settings.useSpeechAnalysis) {
    const speechContext = await getSpeechContextForLLM();
    if (speechContext) {
      parts.push(speechContext);
    }
  }

  // Get face context
  if (settings.useFaceRecognition) {
    const faceContext = await getFaceContextForLLM();
    if (faceContext) {
      parts.push(faceContext);
    }
  }

  // Get recent alerts
  const alerts = await getAlertHistory(3);
  const recentAlerts = alerts.filter(a => {
    const age = Date.now() - new Date(a.timestamp).getTime();
    return age < 24 * 60 * 60 * 1000; // Last 24 hours
  });

  if (recentAlerts.length > 0) {
    parts.push('RECENT WELLNESS ALERTS:');
    recentAlerts.forEach(alert => {
      const responded = alert.userResponded ? ` (User responded: ${alert.userResponse})` : ' (Pending response)';
      parts.push(`- ${alert.title}: ${alert.message}${responded}`);
    });
  }

  return parts.join('\n\n');
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize biometric monitoring
 * Call this when the app starts
 */
export async function initializeBiometricMonitoring(): Promise<void> {
  // Process any pending alerts
  await processPendingAlerts();

  // Check if continuous monitoring is enabled
  const settings = await getBiometricSettings();

  if (settings.enabled && settings.continuousMonitoring) {
    // Start monitoring interval
    startMonitoringInterval(settings.monitoringInterval);
  }
}

let monitoringIntervalId: NodeJS.Timeout | null = null;

/**
 * Start continuous monitoring interval
 */
function startMonitoringInterval(intervalMinutes: number): void {
  if (monitoringIntervalId) {
    clearInterval(monitoringIntervalId);
  }

  monitoringIntervalId = setInterval(async () => {
    // In production, this would capture audio/image and analyze
    // For now, just process pending alerts
    await processPendingAlerts();
  }, intervalMinutes * 60 * 1000);
}

/**
 * Stop continuous monitoring
 */
export function stopMonitoringInterval(): void {
  if (monitoringIntervalId) {
    clearInterval(monitoringIntervalId);
    monitoringIntervalId = null;
  }
}

/**
 * Check if monitoring is currently active
 */
export function isMonitoringActive(): boolean {
  return monitoringIntervalId !== null;
}
