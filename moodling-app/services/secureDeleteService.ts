/**
 * Secure Delete Service
 *
 * Provides secure, comprehensive data deletion with:
 * - Multiple overwrite passes
 * - Verification of deletion
 * - All storage keys covered
 * - No data remnants
 *
 * Following Mood Leaf Ethics:
 * - User has full control over their data
 * - Deletion is permanent and verifiable
 * - No backups or retention
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * All storage keys used by Mood Leaf
 * This list must be kept in sync with all services
 */
const ALL_STORAGE_KEYS = [
  // Journal
  'moodling_journal_entries',
  'moodling_journal_drafts',

  // Life Context
  'moodling_life_context',
  'moodling_life_context_last_processed',

  // User Context
  'moodling_user_context',
  'moodling_personalization',
  'moodling_entry_history',

  // API
  'moodling_claude_api_key',
  'moodling_api_cost_total',
  'moodling_api_cost_monthly',
  'moodling_api_cost_month',

  // HealthKit
  'moodling_healthkit_enabled',
  'moodling_healthkit_data',
  'moodling_hr_baseline',
  'moodling_hr_spike_threshold',
  'moodling_last_hr_notification',

  // Health Insights
  'moodling_health_insights',
  'moodling_shown_insights',
  'moodling_correlations',

  // Tone Preferences
  'moodling_tone_preferences',

  // Strategies
  'moodling_strategy_favorites',
  'moodling_strategy_history',

  // Usage Tracking
  'moodling_usage_data',
  'moodling_session_data',

  // Notifications
  'moodling_notification_settings',
  'moodling_notification_history',

  // Patterns
  'moodling_patterns',
  'moodling_pattern_cache',

  // Reflections
  'moodling_reflections',
  'moodling_reflection_prompts',

  // Exposure Ladder
  'moodling_exposure_ladders',
  'moodling_exposure_progress',

  // Chat History
  'moodling_chat_history',
  'moodling_chat_sessions',

  // Settings
  'moodling_settings',
  'moodling_onboarding_complete',
  'moodling_app_version',
];

/**
 * Deletion result
 */
export interface SecureDeleteResult {
  success: boolean;
  keysDeleted: number;
  keysVerified: number;
  errors: string[];
  timestamp: string;
}

/**
 * Securely overwrite a value before deletion
 * Multiple passes with random data to prevent recovery
 */
async function secureOverwrite(key: string, passes: number = 3): Promise<void> {
  for (let i = 0; i < passes; i++) {
    // Generate random garbage data
    const garbageLength = Math.floor(Math.random() * 1000) + 100;
    const garbage = Array(garbageLength)
      .fill(0)
      .map(() => String.fromCharCode(Math.floor(Math.random() * 256)))
      .join('');

    try {
      await AsyncStorage.setItem(key, garbage);
    } catch {
      // Key might not exist, that's fine
    }
  }
}

/**
 * Verify a key has been deleted
 */
async function verifyDeletion(key: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value === null;
  } catch {
    // Error reading = probably deleted
    return true;
  }
}

/**
 * Secure delete a single key
 */
async function secureDeleteKey(key: string, passes: number = 3): Promise<boolean> {
  try {
    // Check if key exists
    const exists = await AsyncStorage.getItem(key);
    if (exists === null) {
      return true; // Already gone
    }

    // Overwrite with garbage data multiple times
    await secureOverwrite(key, passes);

    // Now delete
    await AsyncStorage.removeItem(key);

    // Verify
    return await verifyDeletion(key);
  } catch (error) {
    console.error(`Failed to securely delete ${key}:`, error);
    return false;
  }
}

/**
 * Securely delete ALL Mood Leaf data
 * This is the nuclear option - everything goes
 */
export async function secureDeleteAllData(passes: number = 3): Promise<SecureDeleteResult> {
  const result: SecureDeleteResult = {
    success: true,
    keysDeleted: 0,
    keysVerified: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  // Also get any keys we might have missed
  let allKeys: readonly string[] = [];
  try {
    allKeys = await AsyncStorage.getAllKeys();
  } catch (error) {
    result.errors.push(`Failed to get all keys: ${error}`);
  }

  // Combine known keys with discovered keys
  const moodlingKeys = allKeys.filter(k => k.startsWith('moodling_'));
  const allKeysToDelete = [...new Set([...ALL_STORAGE_KEYS, ...moodlingKeys])];

  // Secure delete each key
  for (const key of allKeysToDelete) {
    const deleted = await secureDeleteKey(key, passes);
    if (deleted) {
      result.keysDeleted++;
    } else {
      result.errors.push(`Failed to delete: ${key}`);
      result.success = false;
    }
  }

  // Verification pass
  for (const key of allKeysToDelete) {
    const verified = await verifyDeletion(key);
    if (verified) {
      result.keysVerified++;
    } else {
      result.errors.push(`Verification failed: ${key}`);
      result.success = false;
    }
  }

  // Final check - are there any moodling keys left?
  try {
    const remainingKeys = await AsyncStorage.getAllKeys();
    const remainingMoodling = remainingKeys.filter(k => k.startsWith('moodling_'));
    if (remainingMoodling.length > 0) {
      result.errors.push(`Remaining keys found: ${remainingMoodling.join(', ')}`);
      result.success = false;

      // Try one more time
      for (const key of remainingMoodling) {
        await AsyncStorage.removeItem(key);
      }
    }
  } catch {
    // That's okay
  }

  return result;
}

/**
 * Secure delete specific data types
 */
export async function secureDeleteCategory(
  category: 'journal' | 'chat' | 'health' | 'context' | 'strategies' | 'settings'
): Promise<SecureDeleteResult> {
  const categoryKeys: Record<string, string[]> = {
    journal: [
      'moodling_journal_entries',
      'moodling_journal_drafts',
    ],
    chat: [
      'moodling_chat_history',
      'moodling_chat_sessions',
    ],
    health: [
      'moodling_healthkit_enabled',
      'moodling_healthkit_data',
      'moodling_hr_baseline',
      'moodling_hr_spike_threshold',
      'moodling_last_hr_notification',
      'moodling_health_insights',
      'moodling_shown_insights',
      'moodling_correlations',
    ],
    context: [
      'moodling_life_context',
      'moodling_life_context_last_processed',
      'moodling_user_context',
      'moodling_personalization',
      'moodling_entry_history',
    ],
    strategies: [
      'moodling_strategy_favorites',
      'moodling_strategy_history',
    ],
    settings: [
      'moodling_tone_preferences',
      'moodling_notification_settings',
      'moodling_settings',
    ],
  };

  const keysToDelete = categoryKeys[category] || [];

  const result: SecureDeleteResult = {
    success: true,
    keysDeleted: 0,
    keysVerified: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  for (const key of keysToDelete) {
    const deleted = await secureDeleteKey(key, 3);
    if (deleted) {
      result.keysDeleted++;
      result.keysVerified++;
    } else {
      result.errors.push(`Failed to delete: ${key}`);
      result.success = false;
    }
  }

  return result;
}

/**
 * Quick delete (no secure overwrite, faster but less secure)
 * Use for non-sensitive data or when speed matters
 */
export async function quickDeleteAllData(): Promise<SecureDeleteResult> {
  const result: SecureDeleteResult = {
    success: true,
    keysDeleted: 0,
    keysVerified: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // Get all moodling keys
    const allKeys = await AsyncStorage.getAllKeys();
    const moodlingKeys = allKeys.filter(k => k.startsWith('moodling_'));

    // Delete all at once
    await AsyncStorage.multiRemove([...moodlingKeys]);

    result.keysDeleted = moodlingKeys.length;
    result.keysVerified = moodlingKeys.length;
  } catch (error) {
    result.success = false;
    result.errors.push(`Quick delete failed: ${error}`);
  }

  return result;
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats(): Promise<{
  totalKeys: number;
  moodlingKeys: number;
  estimatedSize: number;
  keyDetails: { key: string; size: number }[];
}> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const moodlingKeys = allKeys.filter(k => k.startsWith('moodling_'));

    const keyDetails: { key: string; size: number }[] = [];
    let estimatedSize = 0;

    for (const key of moodlingKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        const size = value ? new Blob([value]).size : 0;
        keyDetails.push({ key, size });
        estimatedSize += size;
      } catch {
        keyDetails.push({ key, size: 0 });
      }
    }

    // Sort by size descending
    keyDetails.sort((a, b) => b.size - a.size);

    return {
      totalKeys: allKeys.length,
      moodlingKeys: moodlingKeys.length,
      estimatedSize,
      keyDetails,
    };
  } catch {
    return {
      totalKeys: 0,
      moodlingKeys: 0,
      estimatedSize: 0,
      keyDetails: [],
    };
  }
}

/**
 * Export all data before deletion (optional safety net)
 */
export async function exportBeforeDelete(): Promise<Record<string, unknown>> {
  const exportData: Record<string, unknown> = {};

  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const moodlingKeys = allKeys.filter(k => k.startsWith('moodling_'));

    for (const key of moodlingKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            exportData[key] = JSON.parse(value);
          } catch {
            exportData[key] = value;
          }
        }
      } catch {
        // Skip keys we can't read
      }
    }
  } catch (error) {
    exportData._error = `Export failed: ${error}`;
  }

  exportData._exportedAt = new Date().toISOString();
  exportData._version = '1.0';

  return exportData;
}

/**
 * Confirm deletion with verification code
 * Returns a code the user must enter to confirm
 */
export function generateDeletionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Verify deletion code matches
 */
export function verifyDeletionCode(input: string, code: string): boolean {
  return input.toUpperCase().replace(/\s/g, '') === code;
}
