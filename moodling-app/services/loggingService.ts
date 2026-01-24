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
  | 'services'
  | 'games'
  | 'health'
  | 'storage'
  | 'network'
  | 'ui'
  | 'navigation'
  | 'diagnostic'
  | 'privacy';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: Record<string, any>;
  source?: string; // File/component name
  stack?: string;  // Stack trace for errors
}

export interface LogFilter {
  level?: LogLevel;
  category?: LogCategory;
  startDate?: string;
  endDate?: string;
  searchText?: string;
}

export interface LogStats {
  totalLogs: number;
  byLevel: Record<LogLevel, number>;
  byCategory: Record<LogCategory, number>;
  oldestLog?: string;
  newestLog?: string;
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
    system: 0, coach: 0, services: 0, games: 0, health: 0,
    storage: 0, network: 0, ui: 0, navigation: 0, diagnostic: 0, privacy: 0,
  };

  for (const entry of logsCache) {
    byLevel[entry.level]++;
    byCategory[entry.category]++;
  }

  return {
    totalLogs: logsCache.length,
    byLevel,
    byCategory,
    oldestLog: logsCache[0]?.timestamp,
    newestLog: logsCache[logsCache.length - 1]?.timestamp,
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
};
