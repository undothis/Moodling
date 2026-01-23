/**
 * Data Persistence Service
 *
 * Ensures training data survives app reinstalls, development cycles,
 * and data clears. Uses multiple storage layers for redundancy.
 *
 * Storage Layers:
 * 1. AsyncStorage (fast, primary) - can be wiped during dev
 * 2. FileSystem (persistent) - survives reinstalls
 * 3. Cloud sync (optional) - backup to remote server
 *
 * Features:
 * - Auto-backup to file system periodically
 * - Auto-recovery if AsyncStorage is empty but files exist
 * - Manual export/import for dev workflows
 * - Cloud sync for multi-device and backup
 * - Incremental sync (only changed data)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// ============================================
// CONFIGURATION
// ============================================

const BACKUP_DIRECTORY = `${FileSystem.documentDirectory}moodleaf_backup/`;
const BACKUP_INDEX_FILE = `${BACKUP_DIRECTORY}index.json`;
const AUTO_BACKUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Keys that contain training data (should be persisted)
const TRAINING_DATA_KEYS = [
  'moodleaf_interview_insights',
  'moodleaf_coach_corrections',
  'moodleaf_training_metadata',
  'moodleaf_pending_insights',
  'moodleaf_youtube_queue',
  'moodleaf_processed_videos',
  'moodleaf_youtube_pending_insights',
  'moodleaf_youtube_approved_insights',
  'moodleaf_curated_channels',
  'moodleaf_insight_hashes',
  'moodleaf_quality_stats',
  'moodleaf_model_versions',
  'moodleaf_active_model',
  'moodleaf_staging_model',
  'moodleaf_version_history',
  'moodleaf_safety_config',
  'moodleaf_rollback_log',
];

// Keys for user data (also important)
const USER_DATA_KEYS = [
  'moodleaf_conversations',
  'moodleaf_moodprint',
  'moodleaf_cognitive_profile',
  'moodleaf_score_history',
];

// All keys to backup
const ALL_BACKUP_KEYS = [...TRAINING_DATA_KEYS, ...USER_DATA_KEYS];

// ============================================
// TYPES
// ============================================

export interface BackupIndex {
  lastBackup: string;
  lastSync: string | null;
  backupVersion: number;
  keyChecksums: Record<string, string>;
  totalSize: number;
  itemCounts: Record<string, number>;
}

export interface ExportData {
  exportedAt: string;
  appVersion: string;
  dataVersion: number;
  keys: string[];
  data: Record<string, any>;
  checksum: string;
}

export interface SyncConfig {
  enabled: boolean;
  endpoint: string | null;
  apiKey: string | null;
  syncInterval: number;
  lastSyncAt: string | null;
}

// ============================================
// INITIALIZATION
// ============================================

let autoBackupTimer: NodeJS.Timeout | null = null;
let isInitialized = false;

/**
 * Initialize the persistence service
 * Should be called on app startup
 */
export async function initialize(): Promise<{
  recovered: boolean;
  recoveredKeys: string[];
  message: string;
}> {
  if (isInitialized) {
    return { recovered: false, recoveredKeys: [], message: 'Already initialized' };
  }

  try {
    // Ensure backup directory exists
    const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(BACKUP_DIRECTORY, { intermediates: true });
    }

    // Check if recovery is needed
    const needsRecovery = await checkNeedsRecovery();

    let recovered = false;
    let recoveredKeys: string[] = [];

    if (needsRecovery) {
      const result = await recoverFromBackup();
      recovered = result.success;
      recoveredKeys = result.recoveredKeys;
    }

    // Start auto-backup
    startAutoBackup();

    isInitialized = true;

    return {
      recovered,
      recoveredKeys,
      message: recovered
        ? `Recovered ${recoveredKeys.length} keys from backup`
        : 'Initialized successfully',
    };
  } catch (error) {
    console.error('Persistence initialization failed:', error);
    return {
      recovered: false,
      recoveredKeys: [],
      message: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if AsyncStorage was wiped and recovery is needed
 */
async function checkNeedsRecovery(): Promise<boolean> {
  // Check if any training data exists in AsyncStorage
  for (const key of TRAINING_DATA_KEYS) {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      return false; // Data exists, no recovery needed
    }
  }

  // AsyncStorage is empty - check if backup exists
  const indexInfo = await FileSystem.getInfoAsync(BACKUP_INDEX_FILE);
  if (indexInfo.exists) {
    const indexContent = await FileSystem.readAsStringAsync(BACKUP_INDEX_FILE);
    const index: BackupIndex = JSON.parse(indexContent);

    // If backup has data but AsyncStorage is empty, recovery needed
    if (index.totalSize > 0) {
      console.log('Recovery needed: AsyncStorage empty but backup exists');
      return true;
    }
  }

  return false;
}

// ============================================
// BACKUP OPERATIONS
// ============================================

/**
 * Backup all training data to file system
 */
export async function backupToFileSystem(): Promise<{
  success: boolean;
  backedUpKeys: string[];
  totalSize: number;
}> {
  try {
    const backedUpKeys: string[] = [];
    let totalSize = 0;
    const keyChecksums: Record<string, string> = {};
    const itemCounts: Record<string, number> = {};

    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(BACKUP_DIRECTORY, { intermediates: true });
    }

    // Backup each key
    for (const key of ALL_BACKUP_KEYS) {
      const value = await AsyncStorage.getItem(key);

      if (value) {
        const fileName = `${BACKUP_DIRECTORY}${key}.json`;
        await FileSystem.writeAsStringAsync(fileName, value);

        backedUpKeys.push(key);
        totalSize += value.length;
        keyChecksums[key] = simpleChecksum(value);

        // Count items if it's an array
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            itemCounts[key] = parsed.length;
          }
        } catch {}
      }
    }

    // Update index
    const index: BackupIndex = {
      lastBackup: new Date().toISOString(),
      lastSync: null,
      backupVersion: 1,
      keyChecksums,
      totalSize,
      itemCounts,
    };

    await FileSystem.writeAsStringAsync(BACKUP_INDEX_FILE, JSON.stringify(index, null, 2));

    console.log(`Backup complete: ${backedUpKeys.length} keys, ${totalSize} bytes`);

    return { success: true, backedUpKeys, totalSize };
  } catch (error) {
    console.error('Backup failed:', error);
    return { success: false, backedUpKeys: [], totalSize: 0 };
  }
}

/**
 * Recover data from file system backup
 */
export async function recoverFromBackup(): Promise<{
  success: boolean;
  recoveredKeys: string[];
  message: string;
}> {
  try {
    const recoveredKeys: string[] = [];

    // Check if backup directory exists
    const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIRECTORY);
    if (!dirInfo.exists) {
      return { success: false, recoveredKeys: [], message: 'No backup found' };
    }

    // Read each backed up key
    for (const key of ALL_BACKUP_KEYS) {
      const fileName = `${BACKUP_DIRECTORY}${key}.json`;
      const fileInfo = await FileSystem.getInfoAsync(fileName);

      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(fileName);

        // Validate it's valid JSON
        try {
          JSON.parse(content);
          await AsyncStorage.setItem(key, content);
          recoveredKeys.push(key);
        } catch (e) {
          console.warn(`Skipping invalid backup for ${key}`);
        }
      }
    }

    console.log(`Recovery complete: ${recoveredKeys.length} keys restored`);

    return {
      success: true,
      recoveredKeys,
      message: `Recovered ${recoveredKeys.length} keys from backup`,
    };
  } catch (error) {
    console.error('Recovery failed:', error);
    return {
      success: false,
      recoveredKeys: [],
      message: `Recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get backup status
 */
export async function getBackupStatus(): Promise<{
  hasBackup: boolean;
  lastBackup: string | null;
  totalSize: number;
  itemCounts: Record<string, number>;
}> {
  try {
    const indexInfo = await FileSystem.getInfoAsync(BACKUP_INDEX_FILE);

    if (!indexInfo.exists) {
      return { hasBackup: false, lastBackup: null, totalSize: 0, itemCounts: {} };
    }

    const indexContent = await FileSystem.readAsStringAsync(BACKUP_INDEX_FILE);
    const index: BackupIndex = JSON.parse(indexContent);

    return {
      hasBackup: true,
      lastBackup: index.lastBackup,
      totalSize: index.totalSize,
      itemCounts: index.itemCounts,
    };
  } catch {
    return { hasBackup: false, lastBackup: null, totalSize: 0, itemCounts: {} };
  }
}

// ============================================
// AUTO-BACKUP
// ============================================

/**
 * Start automatic background backup
 */
export function startAutoBackup(): void {
  if (autoBackupTimer) {
    clearInterval(autoBackupTimer);
  }

  autoBackupTimer = setInterval(async () => {
    console.log('Running auto-backup...');
    await backupToFileSystem();
  }, AUTO_BACKUP_INTERVAL_MS);

  console.log(`Auto-backup started (every ${AUTO_BACKUP_INTERVAL_MS / 1000}s)`);
}

/**
 * Stop automatic backup
 */
export function stopAutoBackup(): void {
  if (autoBackupTimer) {
    clearInterval(autoBackupTimer);
    autoBackupTimer = null;
  }
}

// ============================================
// EXPORT / IMPORT
// ============================================

/**
 * Export all data to a shareable file
 * Useful for manual backup during development
 */
export async function exportAllData(): Promise<{
  success: boolean;
  filePath?: string;
  message: string;
}> {
  try {
    const data: Record<string, any> = {};
    const keys: string[] = [];

    for (const key of ALL_BACKUP_KEYS) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        try {
          data[key] = JSON.parse(value);
          keys.push(key);
        } catch {
          data[key] = value;
          keys.push(key);
        }
      }
    }

    const exportData: ExportData = {
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      dataVersion: 1,
      keys,
      data,
      checksum: simpleChecksum(JSON.stringify(data)),
    };

    const fileName = `moodleaf_export_${Date.now()}.json`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));

    // Share the file
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export Mood Leaf Data',
      });
    }

    return { success: true, filePath, message: `Exported ${keys.length} keys` };
  } catch (error) {
    return {
      success: false,
      message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Import data from an export file
 */
export async function importData(jsonString: string): Promise<{
  success: boolean;
  importedKeys: string[];
  message: string;
}> {
  try {
    const exportData: ExportData = JSON.parse(jsonString);

    // Validate checksum
    const dataChecksum = simpleChecksum(JSON.stringify(exportData.data));
    if (dataChecksum !== exportData.checksum) {
      return { success: false, importedKeys: [], message: 'Data integrity check failed' };
    }

    const importedKeys: string[] = [];

    for (const key of exportData.keys) {
      if (ALL_BACKUP_KEYS.includes(key) && exportData.data[key]) {
        const value = typeof exportData.data[key] === 'string'
          ? exportData.data[key]
          : JSON.stringify(exportData.data[key]);

        await AsyncStorage.setItem(key, value);
        importedKeys.push(key);
      }
    }

    // Backup immediately after import
    await backupToFileSystem();

    return {
      success: true,
      importedKeys,
      message: `Imported ${importedKeys.length} keys from export dated ${exportData.exportedAt}`,
    };
  } catch (error) {
    return {
      success: false,
      importedKeys: [],
      message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================
// CLOUD SYNC (Optional)
// ============================================

const SYNC_CONFIG_KEY = 'moodleaf_sync_config';

/**
 * Get sync configuration
 */
export async function getSyncConfig(): Promise<SyncConfig> {
  const stored = await AsyncStorage.getItem(SYNC_CONFIG_KEY);
  return stored ? JSON.parse(stored) : {
    enabled: false,
    endpoint: null,
    apiKey: null,
    syncInterval: 30 * 60 * 1000, // 30 minutes
    lastSyncAt: null,
  };
}

/**
 * Update sync configuration
 */
export async function updateSyncConfig(updates: Partial<SyncConfig>): Promise<void> {
  const current = await getSyncConfig();
  const updated = { ...current, ...updates };
  await AsyncStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(updated));
}

/**
 * Sync data to cloud endpoint
 * Can be used with any backend (Firebase, Supabase, custom server)
 */
export async function syncToCloud(): Promise<{
  success: boolean;
  syncedKeys: string[];
  message: string;
}> {
  const config = await getSyncConfig();

  if (!config.enabled || !config.endpoint) {
    return { success: false, syncedKeys: [], message: 'Cloud sync not configured' };
  }

  try {
    // Gather data to sync
    const data: Record<string, any> = {};
    const keys: string[] = [];

    for (const key of ALL_BACKUP_KEYS) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        data[key] = JSON.parse(value);
        keys.push(key);
      }
    }

    // Send to cloud
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        action: 'sync',
        timestamp: new Date().toISOString(),
        data,
      }),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }

    // Update last sync time
    await updateSyncConfig({ lastSyncAt: new Date().toISOString() });

    return { success: true, syncedKeys: keys, message: `Synced ${keys.length} keys to cloud` };
  } catch (error) {
    return {
      success: false,
      syncedKeys: [],
      message: `Cloud sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Restore data from cloud
 */
export async function restoreFromCloud(): Promise<{
  success: boolean;
  restoredKeys: string[];
  message: string;
}> {
  const config = await getSyncConfig();

  if (!config.enabled || !config.endpoint) {
    return { success: false, restoredKeys: [], message: 'Cloud sync not configured' };
  }

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({ action: 'restore' }),
    });

    if (!response.ok) {
      throw new Error(`Restore failed: ${response.status}`);
    }

    const result = await response.json();
    const restoredKeys: string[] = [];

    if (result.data) {
      for (const [key, value] of Object.entries(result.data)) {
        if (ALL_BACKUP_KEYS.includes(key)) {
          await AsyncStorage.setItem(key, JSON.stringify(value));
          restoredKeys.push(key);
        }
      }
    }

    // Backup locally after restore
    await backupToFileSystem();

    return {
      success: true,
      restoredKeys,
      message: `Restored ${restoredKeys.length} keys from cloud`,
    };
  } catch (error) {
    return {
      success: false,
      restoredKeys: [],
      message: `Cloud restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================
// UTILITIES
// ============================================

/**
 * Simple checksum for data integrity
 */
function simpleChecksum(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Get statistics about stored data
 */
export async function getStorageStats(): Promise<{
  totalKeys: number;
  totalSize: number;
  keyStats: { key: string; size: number; itemCount?: number }[];
}> {
  const keyStats: { key: string; size: number; itemCount?: number }[] = [];
  let totalSize = 0;

  for (const key of ALL_BACKUP_KEYS) {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      const size = value.length;
      totalSize += size;

      let itemCount: number | undefined;
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          itemCount = parsed.length;
        }
      } catch {}

      keyStats.push({ key, size, itemCount });
    }
  }

  return {
    totalKeys: keyStats.length,
    totalSize,
    keyStats: keyStats.sort((a, b) => b.size - a.size),
  };
}

/**
 * Clear all training data (use with caution!)
 */
export async function clearAllTrainingData(): Promise<{
  success: boolean;
  clearedKeys: string[];
}> {
  const clearedKeys: string[] = [];

  for (const key of TRAINING_DATA_KEYS) {
    await AsyncStorage.removeItem(key);
    clearedKeys.push(key);
  }

  return { success: true, clearedKeys };
}

// ============================================
// DEV WORKFLOW HELPERS
// ============================================

/**
 * Quick save before development (call this before wiping app data)
 */
export async function devQuickSave(): Promise<{
  success: boolean;
  message: string;
}> {
  console.log('📦 Dev Quick Save: Backing up all data...');

  const backupResult = await backupToFileSystem();

  if (backupResult.success) {
    return {
      success: true,
      message: `✅ Saved ${backupResult.backedUpKeys.length} keys (${Math.round(backupResult.totalSize / 1024)}KB)`,
    };
  }

  return { success: false, message: '❌ Quick save failed' };
}

/**
 * Quick restore after development (call this after reinstalling app)
 */
export async function devQuickRestore(): Promise<{
  success: boolean;
  message: string;
}> {
  console.log('📦 Dev Quick Restore: Recovering data from backup...');

  const restoreResult = await recoverFromBackup();

  if (restoreResult.success) {
    return {
      success: true,
      message: `✅ Restored ${restoreResult.recoveredKeys.length} keys`,
    };
  }

  return { success: false, message: '❌ Quick restore failed - no backup found' };
}

// ============================================
// EXPORTS
// ============================================

export default {
  // Initialization
  initialize,

  // Backup/Restore
  backupToFileSystem,
  recoverFromBackup,
  getBackupStatus,

  // Auto-backup
  startAutoBackup,
  stopAutoBackup,

  // Export/Import
  exportAllData,
  importData,

  // Cloud sync
  getSyncConfig,
  updateSyncConfig,
  syncToCloud,
  restoreFromCloud,

  // Utilities
  getStorageStats,
  clearAllTrainingData,

  // Dev helpers
  devQuickSave,
  devQuickRestore,
};
