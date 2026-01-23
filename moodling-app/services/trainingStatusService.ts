/**
 * Training Status Service
 *
 * Provides real-time status of the AI training system.
 * Powers the persistent status indicator in the app.
 *
 * Shows:
 * - Whether data collection is active
 * - Last activity timestamp
 * - Current stats (insights collected, conversations scored, etc.)
 * - Model version status
 * - Any issues or alerts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

// ============================================
// TYPES
// ============================================

export type SystemHealthStatus = 'healthy' | 'warning' | 'error' | 'inactive';

export interface TrainingStatus {
  // Overall status
  isActive: boolean;
  health: SystemHealthStatus;
  lastActivity: string | null;
  lastActivityType: string | null;

  // Data collection stats
  stats: {
    totalInsights: number;
    approvedInsights: number;
    pendingInsights: number;
    conversationsScored: number;
    videosProcessed: number;
  };

  // Current session
  session: {
    startedAt: string;
    insightsThisSession: number;
    scoresThisSession: number;
    actionsThisSession: number;
  };

  // Model info
  model: {
    activeVersion: string | null;
    stagedVersion: string | null;
    lastTrainedAt: string | null;
  };

  // Alerts
  alerts: TrainingAlert[];

  // Persistence
  backupStatus: {
    lastBackup: string | null;
    isAutoBackupActive: boolean;
  };
}

export interface TrainingAlert {
  id: string;
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  dismissed: boolean;
}

export interface ActivityLogEntry {
  id: string;
  type: 'insight_added' | 'insight_approved' | 'insight_rejected' | 'conversation_scored' |
        'video_processed' | 'model_trained' | 'model_deployed' | 'backup_completed' |
        'error' | 'system';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  TRAINING_STATUS: 'moodleaf_training_status',
  ACTIVITY_LOG: 'moodleaf_activity_log',
  SESSION_START: 'moodleaf_session_start',
  SESSION_STATS: 'moodleaf_session_stats',
};

// ============================================
// STATUS TRACKING
// ============================================

let statusListeners: ((status: TrainingStatus) => void)[] = [];
let activityCheckInterval: NodeJS.Timeout | null = null;
let currentStatus: TrainingStatus | null = null;

/**
 * Initialize the status service
 */
export async function initialize(): Promise<void> {
  // Start a new session
  await AsyncStorage.setItem(STORAGE_KEYS.SESSION_START, new Date().toISOString());
  await AsyncStorage.setItem(STORAGE_KEYS.SESSION_STATS, JSON.stringify({
    insightsThisSession: 0,
    scoresThisSession: 0,
    actionsThisSession: 0,
  }));

  // Log system start
  await logActivity('system', 'Training system initialized');

  // Start periodic status checks
  startStatusMonitoring();

  // Listen for app state changes
  AppState.addEventListener('change', handleAppStateChange);

  // Initial status update
  await refreshStatus();
}

/**
 * Handle app state changes
 */
function handleAppStateChange(nextAppState: AppStateStatus): void {
  if (nextAppState === 'active') {
    logActivity('system', 'App became active');
    refreshStatus();
  } else if (nextAppState === 'background') {
    logActivity('system', 'App went to background');
  }
}

/**
 * Start periodic status monitoring
 */
function startStatusMonitoring(): void {
  if (activityCheckInterval) {
    clearInterval(activityCheckInterval);
  }

  // Check status every 30 seconds
  activityCheckInterval = setInterval(async () => {
    await refreshStatus();
  }, 30 * 1000);
}

/**
 * Stop status monitoring
 */
export function stopStatusMonitoring(): void {
  if (activityCheckInterval) {
    clearInterval(activityCheckInterval);
    activityCheckInterval = null;
  }
}

/**
 * Refresh and broadcast current status
 */
export async function refreshStatus(): Promise<TrainingStatus> {
  const status = await calculateStatus();
  currentStatus = status;

  // Notify all listeners
  statusListeners.forEach(listener => listener(status));

  return status;
}

/**
 * Calculate current training status from all data sources
 */
async function calculateStatus(): Promise<TrainingStatus> {
  const now = new Date().toISOString();

  // Get activity log for last activity
  const activityLog = await getActivityLog(1);
  const lastActivity = activityLog[0];

  // Get session stats
  const sessionStartStr = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_START);
  const sessionStatsStr = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_STATS);
  const sessionStats = sessionStatsStr ? JSON.parse(sessionStatsStr) : {
    insightsThisSession: 0,
    scoresThisSession: 0,
    actionsThisSession: 0,
  };

  // Get data counts
  const stats = await getDataCounts();

  // Get model info
  const activeModelId = await AsyncStorage.getItem('moodleaf_active_model');
  const stagedModelId = await AsyncStorage.getItem('moodleaf_staging_model');

  // Get backup status
  const backupIndexStr = await AsyncStorage.getItem('moodleaf_backup_index');
  let lastBackup: string | null = null;
  if (backupIndexStr) {
    try {
      const backupIndex = JSON.parse(backupIndexStr);
      lastBackup = backupIndex.lastBackup;
    } catch {}
  }

  // Get alerts
  const alerts = await getActiveAlerts();

  // Determine health status
  let health: SystemHealthStatus = 'healthy';
  const errorAlerts = alerts.filter(a => a.type === 'error' && !a.dismissed);
  const warningAlerts = alerts.filter(a => a.type === 'warning' && !a.dismissed);

  if (errorAlerts.length > 0) {
    health = 'error';
  } else if (warningAlerts.length > 0) {
    health = 'warning';
  } else if (!lastActivity || timeSince(lastActivity.timestamp) > 24 * 60 * 60 * 1000) {
    health = 'inactive';
  }

  return {
    isActive: true,
    health,
    lastActivity: lastActivity?.timestamp || null,
    lastActivityType: lastActivity?.type || null,

    stats,

    session: {
      startedAt: sessionStartStr || now,
      insightsThisSession: sessionStats.insightsThisSession,
      scoresThisSession: sessionStats.scoresThisSession,
      actionsThisSession: sessionStats.actionsThisSession,
    },

    model: {
      activeVersion: activeModelId,
      stagedVersion: stagedModelId,
      lastTrainedAt: null, // TODO: Get from model version
    },

    alerts,

    backupStatus: {
      lastBackup,
      isAutoBackupActive: true, // Assuming auto-backup is running
    },
  };
}

/**
 * Get data counts from various sources
 */
async function getDataCounts(): Promise<TrainingStatus['stats']> {
  let totalInsights = 0;
  let approvedInsights = 0;
  let pendingInsights = 0;
  let conversationsScored = 0;
  let videosProcessed = 0;

  // Count insights
  const insightsStr = await AsyncStorage.getItem('moodleaf_interview_insights');
  if (insightsStr) {
    const insights = JSON.parse(insightsStr);
    totalInsights = insights.length;
    approvedInsights = insights.filter((i: any) => i.status === 'approved').length;
    pendingInsights = insights.filter((i: any) => i.status === 'pending').length;
  }

  // Count YouTube insights
  const ytPendingStr = await AsyncStorage.getItem('moodleaf_youtube_pending_insights');
  const ytApprovedStr = await AsyncStorage.getItem('moodleaf_youtube_approved_insights');
  if (ytPendingStr) {
    pendingInsights += JSON.parse(ytPendingStr).length;
  }
  if (ytApprovedStr) {
    const ytApproved = JSON.parse(ytApprovedStr);
    totalInsights += ytApproved.length;
    approvedInsights += ytApproved.length;
  }

  // Count scored conversations
  const scoresStr = await AsyncStorage.getItem('moodleaf_score_history');
  if (scoresStr) {
    conversationsScored = JSON.parse(scoresStr).length;
  }

  // Count processed videos
  const processedStr = await AsyncStorage.getItem('moodleaf_processed_videos');
  if (processedStr) {
    videosProcessed = JSON.parse(processedStr).length;
  }

  return {
    totalInsights,
    approvedInsights,
    pendingInsights,
    conversationsScored,
    videosProcessed,
  };
}

// ============================================
// ACTIVITY LOGGING
// ============================================

/**
 * Log an activity
 */
export async function logActivity(
  type: ActivityLogEntry['type'],
  message: string,
  metadata?: Record<string, any>
): Promise<void> {
  const entry: ActivityLogEntry = {
    id: `activity_${Date.now()}`,
    type,
    message,
    timestamp: new Date().toISOString(),
    metadata,
  };

  // Get existing log
  const logStr = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
  const log: ActivityLogEntry[] = logStr ? JSON.parse(logStr) : [];

  // Add entry
  log.unshift(entry);

  // Keep last 500 entries
  const trimmed = log.slice(0, 500);

  await AsyncStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(trimmed));

  // Update session stats
  await updateSessionStats(type);

  // Refresh status
  await refreshStatus();
}

/**
 * Update session stats based on activity type
 */
async function updateSessionStats(type: ActivityLogEntry['type']): Promise<void> {
  const sessionStatsStr = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_STATS);
  const stats = sessionStatsStr ? JSON.parse(sessionStatsStr) : {
    insightsThisSession: 0,
    scoresThisSession: 0,
    actionsThisSession: 0,
  };

  stats.actionsThisSession++;

  if (type === 'insight_added' || type === 'insight_approved') {
    stats.insightsThisSession++;
  } else if (type === 'conversation_scored') {
    stats.scoresThisSession++;
  }

  await AsyncStorage.setItem(STORAGE_KEYS.SESSION_STATS, JSON.stringify(stats));
}

/**
 * Get activity log
 */
export async function getActivityLog(limit: number = 50): Promise<ActivityLogEntry[]> {
  const logStr = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
  const log: ActivityLogEntry[] = logStr ? JSON.parse(logStr) : [];
  return log.slice(0, limit);
}

// ============================================
// ALERTS
// ============================================

/**
 * Add an alert
 */
export async function addAlert(
  type: TrainingAlert['type'],
  message: string
): Promise<void> {
  const status = await getStoredStatus();

  const alert: TrainingAlert = {
    id: `alert_${Date.now()}`,
    type,
    message,
    timestamp: new Date().toISOString(),
    dismissed: false,
  };

  status.alerts.push(alert);

  // Keep last 20 alerts
  status.alerts = status.alerts.slice(-20);

  await saveStatus(status);
  await refreshStatus();
}

/**
 * Dismiss an alert
 */
export async function dismissAlert(alertId: string): Promise<void> {
  const status = await getStoredStatus();

  const alert = status.alerts.find(a => a.id === alertId);
  if (alert) {
    alert.dismissed = true;
    await saveStatus(status);
    await refreshStatus();
  }
}

/**
 * Get active (non-dismissed) alerts
 */
async function getActiveAlerts(): Promise<TrainingAlert[]> {
  const status = await getStoredStatus();
  return status.alerts.filter(a => !a.dismissed);
}

// ============================================
// STATUS STORAGE
// ============================================

async function getStoredStatus(): Promise<TrainingStatus> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.TRAINING_STATUS);
  return stored ? JSON.parse(stored) : createDefaultStatus();
}

async function saveStatus(status: TrainingStatus): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.TRAINING_STATUS, JSON.stringify(status));
}

function createDefaultStatus(): TrainingStatus {
  return {
    isActive: true,
    health: 'healthy',
    lastActivity: null,
    lastActivityType: null,
    stats: {
      totalInsights: 0,
      approvedInsights: 0,
      pendingInsights: 0,
      conversationsScored: 0,
      videosProcessed: 0,
    },
    session: {
      startedAt: new Date().toISOString(),
      insightsThisSession: 0,
      scoresThisSession: 0,
      actionsThisSession: 0,
    },
    model: {
      activeVersion: null,
      stagedVersion: null,
      lastTrainedAt: null,
    },
    alerts: [],
    backupStatus: {
      lastBackup: null,
      isAutoBackupActive: false,
    },
  };
}

// ============================================
// LISTENERS
// ============================================

/**
 * Subscribe to status changes
 */
export function subscribeToStatus(listener: (status: TrainingStatus) => void): () => void {
  statusListeners.push(listener);

  // Immediately call with current status
  if (currentStatus) {
    listener(currentStatus);
  }

  // Return unsubscribe function
  return () => {
    statusListeners = statusListeners.filter(l => l !== listener);
  };
}

/**
 * Get current status synchronously
 */
export function getCurrentStatus(): TrainingStatus | null {
  return currentStatus;
}

// ============================================
// UTILITIES
// ============================================

/**
 * Calculate time since a timestamp
 */
function timeSince(timestamp: string): number {
  return Date.now() - new Date(timestamp).getTime();
}

/**
 * Format time ago string
 */
export function formatTimeAgo(timestamp: string | null): string {
  if (!timestamp) return 'Never';

  const ms = timeSince(timestamp);
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Get status indicator color
 */
export function getStatusColor(health: SystemHealthStatus): string {
  switch (health) {
    case 'healthy': return '#4CAF50';
    case 'warning': return '#FF9800';
    case 'error': return '#F44336';
    case 'inactive': return '#9E9E9E';
  }
}

/**
 * Get human-readable status text
 */
export function getStatusText(status: TrainingStatus): string {
  if (status.health === 'error') {
    return 'Issues detected';
  }
  if (status.health === 'warning') {
    return 'Needs attention';
  }
  if (status.health === 'inactive') {
    return 'Inactive';
  }

  // Show recent activity
  if (status.session.actionsThisSession > 0) {
    return `Active • ${status.session.actionsThisSession} actions`;
  }

  return 'Training active';
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Initialization
  initialize,
  stopStatusMonitoring,

  // Status
  refreshStatus,
  subscribeToStatus,
  getCurrentStatus,

  // Activity logging
  logActivity,
  getActivityLog,

  // Alerts
  addAlert,
  dismissAlert,

  // Utilities
  formatTimeAgo,
  getStatusColor,
  getStatusText,
};
