/**
 * Logging Service
 *
 * Comprehensive logging system for Mood Leaf.
 * - Captures errors, warnings, info, debug logs
 * - Stores logs locally with rotation
 * - Supports export for debugging
 * - Respects privacy - no PII in logs
 *
 * Following Mood Leaf principles:
 * - All logs stay on device
 * - User can view and delete logs
 * - No automatic reporting
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// TYPES
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type LogCategory =
  | 'system'
  | 'coach'
  | 'coach_access'      // NEW: Coach data source access auditing
  | 'services'
  | 'games'
  | 'health'
  | 'storage'
  | 'network'
  | 'ui'
  | 'navigation'
  | 'diagnostic'
  | 'privacy'
  | 'cadence'           // NEW: General Cadence/behavioral analytics
  | 'cadence_facial'    // NEW: Facial expression analysis
  | 'cadence_voice'     // NEW: Voice/speech pattern analysis
  | 'cadence_eye'       // NEW: Eye movement tracking
  | 'cadence_session'   // NEW: Behavioral session recordings
  | 'performance';      // NEW: Performance metrics

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: Record<string, any>;
  source?: string;    // File/component name
  stack?: string;     // Stack trace for errors
  sessionId?: string; // NEW: Group logs by session
  duration?: number;  // NEW: Duration in ms for performance logs
}

export interface LogFilter {
  level?: LogLevel;
  category?: LogCategory;
  categories?: LogCategory[]; // NEW: Filter by multiple categories
  startDate?: string;
  endDate?: string;
  searchText?: string;
  sessionId?: string;         // NEW: Filter by session
  hasErrors?: boolean;        // NEW: Only show entries with errors
}

export interface LogStats {
  totalLogs: number;
  byLevel: Record<LogLevel, number>;
  byCategory: Record<LogCategory, number>;
  oldestLog?: string;
  newestLog?: string;
  sessionsCount?: number;        // NEW
  averageSessionDuration?: number; // NEW
}

// NEW: Performance timing tracker
export interface PerformanceTimer {
  id: string;
  operation: string;
  category: LogCategory;
  startTime: number;
  metadata?: Record<string, any>;
}

// NEW: Coach data access audit entry
export interface CoachAccessAudit {
  sourceId: string;
  sourceName: string;
  dataRetrieved: boolean;
  dataSize?: number;
  usedInResponse: boolean;
  timestamp: string;
  sessionId?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const STORAGE_KEY = 'moodleaf_logs';
const MAX_LOGS = 1000;
const MAX_LOG_AGE_DAYS = 7;
const LOG_ROTATION_CHECK_INTERVAL = 3600000; // 1 hour

// Log level priorities (higher = more severe)
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// Minimum level to store (can be changed)
let minLogLevel: LogLevel = 'info';

// ============================================================================
// STATE
// ============================================================================

let logsCache: LogEntry[] = [];
let isInitialized = false;
let lastRotationCheck = 0;

// Subscribers for real-time log updates
const subscribers: Set<(entry: LogEntry) => void> = new Set();

// NEW: Session tracking
let currentSessionId: string | null = null;
let sessionStartTime: number | null = null;

// NEW: Active performance timers
const activeTimers: Map<string, PerformanceTimer> = new Map();

// NEW: Coach access audit trail
let coachAccessAudits: CoachAccessAudit[] = [];

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the logging service
 */
export async function initializeLogging(): Promise<void> {
  if (isInitialized) return;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      logsCache = JSON.parse(stored);
    }
    isInitialized = true;

    // Run initial rotation
    await rotateLogsIfNeeded();

    log('info', 'system', 'Logging service initialized', {
      logCount: logsCache.length,
      minLevel: minLogLevel,
    });
  } catch (error) {
    console.error('Failed to initialize logging:', error);
    logsCache = [];
    isInitialized = true;
  }
}

// ============================================================================
// CORE LOGGING
// ============================================================================

/**
 * Generate a unique log ID
 */
function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create and store a log entry
 */
export async function log(
  level: LogLevel,
  category: LogCategory,
  message: string,
  data?: Record<string, any>,
  source?: string
): Promise<LogEntry | null> {
  // Check if this level should be logged
  if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[minLogLevel]) {
    return null;
  }

  // Initialize if needed
  if (!isInitialized) {
    await initializeLogging();
  }

  // Create entry
  const entry: LogEntry = {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data: sanitizeData(data),
    source,
  };

  // Add stack trace for errors
  if (level === 'error' || level === 'fatal') {
    entry.stack = new Error().stack;
  }

  // Add to cache
  logsCache.push(entry);

  // Console output for development
  const consoleFn = level === 'error' || level === 'fatal' ? console.error
    : level === 'warn' ? console.warn
    : level === 'debug' ? console.debug
    : console.log;

  consoleFn(`[${level.toUpperCase()}] [${category}] ${message}`, data || '');

  // Notify subscribers
  subscribers.forEach(callback => callback(entry));

  // Persist asynchronously
  persistLogs();

  // Check rotation
  rotateLogsIfNeeded();

  return entry;
}

/**
 * Convenience methods for each log level
 */
export const debug = (category: LogCategory, message: string, data?: Record<string, any>, source?: string) =>
  log('debug', category, message, data, source);

export const info = (category: LogCategory, message: string, data?: Record<string, any>, source?: string) =>
  log('info', category, message, data, source);

export const warn = (category: LogCategory, message: string, data?: Record<string, any>, source?: string) =>
  log('warn', category, message, data, source);

export const error = (category: LogCategory, message: string, data?: Record<string, any>, source?: string) =>
  log('error', category, message, data, source);

export const fatal = (category: LogCategory, message: string, data?: Record<string, any>, source?: string) =>
  log('fatal', category, message, data, source);

// ============================================================================
// DATA SANITIZATION
// ============================================================================

/**
 * Remove sensitive data from log entries
 */
function sanitizeData(data?: Record<string, any>): Record<string, any> | undefined {
  if (!data) return undefined;

  const sensitiveKeys = [
    'password', 'token', 'apiKey', 'secret', 'auth',
    'email', 'phone', 'ssn', 'creditCard', 'address',
    'birthDate', 'name', 'firstName', 'lastName',
  ];

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Check if key contains sensitive info
    if (sensitiveKeys.some(s => lowerKey.includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// ============================================================================
// LOG MANAGEMENT
// ============================================================================

/**
 * Persist logs to storage (debounced)
 */
let persistTimeout: NodeJS.Timeout | null = null;
function persistLogs(): void {
  if (persistTimeout) return;

  persistTimeout = setTimeout(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logsCache));
    } catch (error) {
      console.error('Failed to persist logs:', error);
    }
    persistTimeout = null;
  }, 1000);
}

/**
 * Rotate logs if needed (remove old/excess)
 */
async function rotateLogsIfNeeded(): Promise<void> {
  const now = Date.now();
  if (now - lastRotationCheck < LOG_ROTATION_CHECK_INTERVAL) return;
  lastRotationCheck = now;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_LOG_AGE_DAYS);
  const cutoffTimestamp = cutoffDate.toISOString();

  // Remove old logs
  logsCache = logsCache.filter(entry => entry.timestamp > cutoffTimestamp);

  // Remove excess logs (keep most recent)
  if (logsCache.length > MAX_LOGS) {
    logsCache = logsCache.slice(-MAX_LOGS);
  }

  // Persist
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logsCache));
  } catch (error) {
    console.error('Failed to rotate logs:', error);
  }
}

/**
 * Get all logs, optionally filtered
 */
export function getLogs(filter?: LogFilter): LogEntry[] {
  let filtered = [...logsCache];

  if (filter?.level) {
    const minPriority = LOG_LEVEL_PRIORITY[filter.level];
    filtered = filtered.filter(e => LOG_LEVEL_PRIORITY[e.level] >= minPriority);
  }

  if (filter?.category) {
    filtered = filtered.filter(e => e.category === filter.category);
  }

  // NEW: Filter by multiple categories
  if (filter?.categories && filter.categories.length > 0) {
    filtered = filtered.filter(e => filter.categories!.includes(e.category));
  }

  if (filter?.startDate) {
    filtered = filtered.filter(e => e.timestamp >= filter.startDate!);
  }

  if (filter?.endDate) {
    filtered = filtered.filter(e => e.timestamp <= filter.endDate!);
  }

  if (filter?.searchText) {
    const search = filter.searchText.toLowerCase();
    filtered = filtered.filter(e =>
      e.message.toLowerCase().includes(search) ||
      JSON.stringify(e.data).toLowerCase().includes(search)
    );
  }

  // NEW: Filter by session
  if (filter?.sessionId) {
    filtered = filtered.filter(e => e.sessionId === filter.sessionId);
  }

  // NEW: Filter for errors only
  if (filter?.hasErrors) {
    filtered = filtered.filter(e => e.level === 'error' || e.level === 'fatal');
  }

  // Return newest first
  return filtered.reverse();
}

/**
 * Get recent logs
 */
export function getRecentLogs(count: number = 50, category?: LogCategory): LogEntry[] {
  const filter: LogFilter = {};
  if (category) filter.category = category;

  return getLogs(filter).slice(0, count);
}

/**
 * Get log statistics
 */
export function getLogStats(): LogStats {
  const byLevel: Record<LogLevel, number> = {
    debug: 0, info: 0, warn: 0, error: 0, fatal: 0,
  };

  const byCategory: Record<LogCategory, number> = {
    system: 0, coach: 0, coach_access: 0, services: 0, games: 0, health: 0,
    storage: 0, network: 0, ui: 0, navigation: 0, diagnostic: 0, privacy: 0,
    cadence: 0, cadence_facial: 0, cadence_voice: 0, cadence_eye: 0,
    cadence_session: 0, performance: 0,
  };

  const uniqueSessions = new Set<string>();
  for (const entry of logsCache) {
    byLevel[entry.level]++;
    if (byCategory[entry.category] !== undefined) {
      byCategory[entry.category]++;
    }
    if (entry.sessionId) {
      uniqueSessions.add(entry.sessionId);
    }
  }

  return {
    totalLogs: logsCache.length,
    byLevel,
    byCategory,
    oldestLog: logsCache[0]?.timestamp,
    newestLog: logsCache[logsCache.length - 1]?.timestamp,
    sessionsCount: uniqueSessions.size,
  };
}

/**
 * Clear all logs
 */
export async function clearLogs(): Promise<void> {
  logsCache = [];
  await AsyncStorage.removeItem(STORAGE_KEY);
  await log('info', 'system', 'Logs cleared by user');
}

/**
 * Export logs as JSON string
 */
export function exportLogs(filter?: LogFilter): string {
  const logs = getLogs(filter);
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    totalLogs: logs.length,
    logs,
  }, null, 2);
}

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to real-time log updates
 */
export function subscribeToLogs(callback: (entry: LogEntry) => void): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

// ============================================================================
// SESSION TRACKING
// ============================================================================

/**
 * Start a new logging session (groups related logs together)
 */
export function startSession(sessionType: string = 'general'): string {
  const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  currentSessionId = id;
  sessionStartTime = Date.now();

  log('info', 'system', `Session started: ${sessionType}`, {
    sessionId: id,
    sessionType,
  });

  return id;
}

/**
 * End the current session
 */
export function endSession(): void {
  if (!currentSessionId) return;

  const duration = sessionStartTime ? Date.now() - sessionStartTime : 0;
  log('info', 'system', 'Session ended', {
    sessionId: currentSessionId,
    durationMs: duration,
  });

  currentSessionId = null;
  sessionStartTime = null;
}

/**
 * Get current session ID
 */
export function getCurrentSessionId(): string | null {
  return currentSessionId;
}

/**
 * Get logs for a specific session
 */
export function getSessionLogs(sessionId: string): LogEntry[] {
  return getLogs({ sessionId });
}

// ============================================================================
// PERFORMANCE TIMING
// ============================================================================

/**
 * Start a performance timer
 */
export function startTimer(
  operation: string,
  category: LogCategory = 'performance',
  metadata?: Record<string, any>
): string {
  const id = `timer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  activeTimers.set(id, {
    id,
    operation,
    category,
    startTime: Date.now(),
    metadata,
  });

  return id;
}

/**
 * End a performance timer and log the result
 */
export async function endTimer(timerId: string, additionalData?: Record<string, any>): Promise<number | null> {
  const timer = activeTimers.get(timerId);
  if (!timer) {
    warn('performance', `Timer ${timerId} not found`);
    return null;
  }

  const duration = Date.now() - timer.startTime;
  activeTimers.delete(timerId);

  await log('info', timer.category, `${timer.operation} completed`, {
    ...timer.metadata,
    ...additionalData,
    durationMs: duration,
    sessionId: currentSessionId,
  });

  return duration;
}

/**
 * Measure async operation duration
 */
export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  category: LogCategory = 'performance'
): Promise<T> {
  const timerId = startTimer(operation, category);
  try {
    const result = await fn();
    await endTimer(timerId, { success: true });
    return result;
  } catch (err: any) {
    await endTimer(timerId, { success: false, error: err.message });
    throw err;
  }
}

// ============================================================================
// COACH DATA ACCESS AUDITING
// ============================================================================

/**
 * Log when the AI coach accesses a data source
 */
export async function logCoachAccess(
  sourceId: string,
  sourceName: string,
  dataRetrieved: boolean,
  dataSize?: number,
  usedInResponse: boolean = false
): Promise<void> {
  const audit: CoachAccessAudit = {
    sourceId,
    sourceName,
    dataRetrieved,
    dataSize,
    usedInResponse,
    timestamp: new Date().toISOString(),
    sessionId: currentSessionId || undefined,
  };

  coachAccessAudits.push(audit);

  // Keep only last 500 audits
  if (coachAccessAudits.length > 500) {
    coachAccessAudits = coachAccessAudits.slice(-500);
  }

  await log('info', 'coach_access', `Coach accessed: ${sourceName}`, {
    sourceId,
    dataRetrieved,
    dataSize,
    usedInResponse,
  });
}

/**
 * Get coach access audit trail
 */
export function getCoachAccessAudits(limit: number = 50): CoachAccessAudit[] {
  return coachAccessAudits.slice(-limit).reverse();
}

/**
 * Get coach access summary (what data is being used most)
 */
export function getCoachAccessSummary(): Record<string, { count: number; lastAccess: string }> {
  const summary: Record<string, { count: number; lastAccess: string }> = {};

  for (const audit of coachAccessAudits) {
    if (!summary[audit.sourceId]) {
      summary[audit.sourceId] = { count: 0, lastAccess: audit.timestamp };
    }
    summary[audit.sourceId].count++;
    if (audit.timestamp > summary[audit.sourceId].lastAccess) {
      summary[audit.sourceId].lastAccess = audit.timestamp;
    }
  }

  return summary;
}

// ============================================================================
// COACH EFFICIENCY & HUMANNESS METRICS
// ============================================================================

export interface CoachResponseMetrics {
  id: string;
  timestamp: string;
  sessionId?: string;
  // Efficiency metrics
  responseTimeMs: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  dataSourcesAvailable: number;
  dataSourcesUsed: number;
  // Humanness scoring (0-100)
  humanScore?: number;
  humanFactors?: {
    empathy: number;      // Emotional acknowledgment (0-100)
    naturalFlow: number;  // Conversational flow (0-100)
    variety: number;      // Response diversity (0-100)
    personalization: number; // Use of user context (0-100)
    warmth: number;       // Warm vs clinical tone (0-100)
  };
  // Success
  success: boolean;
  errorType?: string;
}

let coachMetrics: CoachResponseMetrics[] = [];

/**
 * Log coach response metrics for efficiency tracking
 */
export async function logCoachResponse(metrics: Omit<CoachResponseMetrics, 'id' | 'timestamp' | 'sessionId'>): Promise<void> {
  const entry: CoachResponseMetrics = {
    id: `coach_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    sessionId: currentSessionId || undefined,
    ...metrics,
  };

  coachMetrics.push(entry);

  // Keep last 500 metrics
  if (coachMetrics.length > 500) {
    coachMetrics = coachMetrics.slice(-500);
  }

  // Calculate overall human score if factors provided
  if (metrics.humanFactors) {
    const factors = metrics.humanFactors;
    entry.humanScore = Math.round(
      (factors.empathy + factors.naturalFlow + factors.variety + factors.personalization + factors.warmth) / 5
    );
  }

  await log('info', 'coach', 'Coach response logged', {
    responseTimeMs: metrics.responseTimeMs,
    tokensUsed: metrics.totalTokens,
    humanScore: entry.humanScore,
    success: metrics.success,
  });
}

/**
 * Get coach efficiency metrics summary
 */
export function getCoachEfficiencySummary(): {
  avgResponseTime: number;
  avgTokens: number;
  successRate: number;
  avgDataUtilization: number;
  totalResponses: number;
} {
  if (coachMetrics.length === 0) {
    return {
      avgResponseTime: 0,
      avgTokens: 0,
      successRate: 100,
      avgDataUtilization: 0,
      totalResponses: 0,
    };
  }

  const successful = coachMetrics.filter(m => m.success);
  const withTokens = coachMetrics.filter(m => m.totalTokens);
  const withSources = coachMetrics.filter(m => m.dataSourcesAvailable > 0);

  return {
    avgResponseTime: Math.round(
      coachMetrics.reduce((sum, m) => sum + m.responseTimeMs, 0) / coachMetrics.length
    ),
    avgTokens: withTokens.length > 0
      ? Math.round(withTokens.reduce((sum, m) => sum + (m.totalTokens || 0), 0) / withTokens.length)
      : 0,
    successRate: Math.round((successful.length / coachMetrics.length) * 100),
    avgDataUtilization: withSources.length > 0
      ? Math.round(
          (withSources.reduce((sum, m) => sum + (m.dataSourcesUsed / m.dataSourcesAvailable), 0) / withSources.length) * 100
        )
      : 0,
    totalResponses: coachMetrics.length,
  };
}

/**
 * Get human-ness score trends over time
 */
export function getHumanScoreTrend(): {
  current: number;
  trend: 'improving' | 'declining' | 'stable';
  history: { timestamp: string; score: number }[];
  factorAverages: {
    empathy: number;
    naturalFlow: number;
    variety: number;
    personalization: number;
    warmth: number;
  };
} {
  const withScores = coachMetrics.filter(m => m.humanScore !== undefined);

  if (withScores.length === 0) {
    return {
      current: 0,
      trend: 'stable',
      history: [],
      factorAverages: { empathy: 0, naturalFlow: 0, variety: 0, personalization: 0, warmth: 0 },
    };
  }

  // Calculate current (average of last 10)
  const recent = withScores.slice(-10);
  const current = Math.round(recent.reduce((sum, m) => sum + (m.humanScore || 0), 0) / recent.length);

  // Calculate trend (compare first half vs second half)
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (withScores.length >= 10) {
    const midpoint = Math.floor(withScores.length / 2);
    const firstHalf = withScores.slice(0, midpoint);
    const secondHalf = withScores.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, m) => sum + (m.humanScore || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + (m.humanScore || 0), 0) / secondHalf.length;

    if (secondAvg > firstAvg + 3) trend = 'improving';
    else if (secondAvg < firstAvg - 3) trend = 'declining';
  }

  // Factor averages
  const withFactors = withScores.filter(m => m.humanFactors);
  const factorAverages = {
    empathy: 0,
    naturalFlow: 0,
    variety: 0,
    personalization: 0,
    warmth: 0,
  };

  if (withFactors.length > 0) {
    for (const m of withFactors) {
      if (m.humanFactors) {
        factorAverages.empathy += m.humanFactors.empathy;
        factorAverages.naturalFlow += m.humanFactors.naturalFlow;
        factorAverages.variety += m.humanFactors.variety;
        factorAverages.personalization += m.humanFactors.personalization;
        factorAverages.warmth += m.humanFactors.warmth;
      }
    }
    factorAverages.empathy = Math.round(factorAverages.empathy / withFactors.length);
    factorAverages.naturalFlow = Math.round(factorAverages.naturalFlow / withFactors.length);
    factorAverages.variety = Math.round(factorAverages.variety / withFactors.length);
    factorAverages.personalization = Math.round(factorAverages.personalization / withFactors.length);
    factorAverages.warmth = Math.round(factorAverages.warmth / withFactors.length);
  }

  return {
    current,
    trend,
    history: withScores.slice(-50).map(m => ({
      timestamp: m.timestamp,
      score: m.humanScore || 0,
    })),
    factorAverages,
  };
}

/**
 * Get all coach metrics for detailed analysis
 */
export function getCoachMetrics(limit: number = 50): CoachResponseMetrics[] {
  return coachMetrics.slice(-limit).reverse();
}

// ============================================================================
// CADENCE (BEHAVIORAL ANALYTICS) LOGGING HELPERS
// ============================================================================

/**
 * Log facial analysis event
 */
export const logFacialAnalysis = (
  event: string,
  data?: Record<string, any>
) => log('info', 'cadence_facial', event, data);

/**
 * Log voice analysis event
 */
export const logVoiceAnalysis = (
  event: string,
  data?: Record<string, any>
) => log('info', 'cadence_voice', event, data);

/**
 * Log eye tracking event
 */
export const logEyeTracking = (
  event: string,
  data?: Record<string, any>
) => log('info', 'cadence_eye', event, data);

/**
 * Log behavioral session event
 */
export const logCadenceSession = (
  event: string,
  data?: Record<string, any>
) => log('info', 'cadence_session', event, data);

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Set minimum log level
 */
export function setMinLogLevel(level: LogLevel): void {
  minLogLevel = level;
  log('info', 'system', `Minimum log level changed to ${level}`);
}

/**
 * Get current minimum log level
 */
export function getMinLogLevel(): LogLevel {
  return minLogLevel;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Core logging
  initializeLogging,
  log,
  debug,
  info,
  warn,
  error,
  fatal,
  getLogs,
  getRecentLogs,
  getLogStats,
  clearLogs,
  exportLogs,
  subscribeToLogs,
  setMinLogLevel,
  getMinLogLevel,
  // Session tracking
  startSession,
  endSession,
  getCurrentSessionId,
  getSessionLogs,
  // Performance timing
  startTimer,
  endTimer,
  measureAsync,
  // Coach access auditing
  logCoachAccess,
  getCoachAccessAudits,
  getCoachAccessSummary,
  // Coach efficiency & humanness
  logCoachResponse,
  getCoachEfficiencySummary,
  getHumanScoreTrend,
  getCoachMetrics,
  // Cadence logging helpers
  logFacialAnalysis,
  logVoiceAnalysis,
  logEyeTracking,
  logCadenceSession,
};
