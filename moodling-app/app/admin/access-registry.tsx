/**
 * Coach Access Registry Admin Screen
 *
 * Developer-only screen to view and control what data/actions
 * the AI coach can access. Everything not in this registry is blocked.
 *
 * Unit: AI Access Control Admin
 */

import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  initializeAccessRegistry,
  isAccessAllowed,
  setAccessEnabled,
  resetToDefaults,
  getRegistrySummary,
  getAllEntries,
  getAccessLogs,
  clearAccessLogs,
  COACH_ACCESS_REGISTRY,
  AccessEntry,
  AccessCategory,
  AccessLog,
} from '@/services/coachAccessRegistry';

// Category labels and icons
const CATEGORY_INFO: Record<AccessCategory, { label: string; icon: string; color: string }> = {
  core: { label: 'Core (Required)', icon: 'shield-checkmark', color: '#4CAF50' },
  user_data: { label: 'User Data', icon: 'person', color: '#2196F3' },
  context: { label: 'Context & Memories', icon: 'file-tray-stacked', color: '#9C27B0' },
  tracking: { label: 'Tracking', icon: 'stats-chart', color: '#FF9800' },
  health: { label: 'Health', icon: 'heart', color: '#E91E63' },
  therapeutic: { label: 'Therapeutic', icon: 'medical', color: '#00BCD4' },
  actions: { label: 'Actions', icon: 'flash', color: '#FFC107' },
};

export default function AccessRegistryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [entries, setEntries] = useState<Array<AccessEntry & { currentlyEnabled: boolean }>>([]);
  const [summary, setSummary] = useState<{ total: number; enabled: number; disabled: number; required: number } | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<AccessCategory | null>('core');
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<AccessLog[]>([]);

  // Load data
  const loadData = useCallback(async () => {
    await initializeAccessRegistry();
    setEntries(getAllEntries());
    setSummary(getRegistrySummary());
    setLogs(getAccessLogs(50));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle access for an entry
  const handleToggle = async (id: string, newValue: boolean) => {
    const entry = COACH_ACCESS_REGISTRY[id];
    if (entry?.required) {
      Alert.alert('Required', 'This entry cannot be disabled as it is required for the coach to function.');
      return;
    }

    const success = await setAccessEnabled(id, newValue);
    if (success) {
      loadData();
    }
  };

  // Reset all to defaults
  const handleReset = () => {
    Alert.alert(
      'Reset to Defaults',
      'This will restore all access settings to their default values.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetToDefaults();
            loadData();
          },
        },
      ]
    );
  };

  // Clear logs
  const handleClearLogs = async () => {
    await clearAccessLogs();
    setLogs([]);
  };

  // Group entries by category
  const entriesByCategory = entries.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {} as Record<AccessCategory, Array<AccessEntry & { currentlyEnabled: boolean }>>);

  // Render a single entry
  const renderEntry = (entry: AccessEntry & { currentlyEnabled: boolean }) => {
    const isEnabled = entry.currentlyEnabled;
    const isRequired = entry.required;

    return (
      <View
        key={entry.id}
        style={[
          styles.entryRow,
          {
            backgroundColor: isEnabled ? colors.card : colors.background,
            borderColor: isEnabled ? colors.tint + '40' : colors.border,
          },
        ]}
      >
        <View style={styles.entryInfo}>
          <View style={styles.entryHeader}>
            <Text style={[styles.entryName, { color: colors.text }]}>
              {entry.name}
            </Text>
            {isRequired && (
              <View style={[styles.requiredBadge, { backgroundColor: colors.tint }]}>
                <Text style={styles.requiredText}>Required</Text>
              </View>
            )}
          </View>
          <Text style={[styles.entryDescription, { color: colors.textSecondary }]}>
            {entry.description}
          </Text>
          <Text style={[styles.entryService, { color: colors.textMuted }]}>
            Service: {entry.service}
          </Text>
          {entry.conditional && (
            <Text style={[styles.entryConditional, { color: colors.warning || '#FF9800' }]}>
              {entry.conditional}
            </Text>
          )}
        </View>
        <Switch
          value={isEnabled}
          onValueChange={(value) => handleToggle(entry.id, value)}
          disabled={isRequired}
          trackColor={{ false: colors.border, true: colors.tint + '80' }}
          thumbColor={isEnabled ? colors.tint : colors.textMuted}
        />
      </View>
    );
  };

  // Render category section
  const renderCategory = (category: AccessCategory) => {
    const categoryEntries = entriesByCategory[category] || [];
    if (categoryEntries.length === 0) return null;

    const info = CATEGORY_INFO[category];
    const isExpanded = expandedCategory === category;
    const enabledCount = categoryEntries.filter(e => e.currentlyEnabled).length;

    return (
      <View key={category} style={styles.categorySection}>
        <TouchableOpacity
          style={[styles.categoryHeader, { backgroundColor: colors.card }]}
          onPress={() => setExpandedCategory(isExpanded ? null : category)}
        >
          <View style={styles.categoryLeft}>
            <Ionicons
              name={info.icon as any}
              size={20}
              color={info.color}
            />
            <Text style={[styles.categoryLabel, { color: colors.text }]}>
              {info.label}
            </Text>
          </View>
          <View style={styles.categoryRight}>
            <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
              {enabledCount}/{categoryEntries.length}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textMuted}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.categoryEntries}>
            {categoryEntries.map(renderEntry)}
          </View>
        )}
      </View>
    );
  };

  // Render access logs
  const renderLogs = () => (
    <View style={styles.logsSection}>
      <View style={styles.logsHeader}>
        <Text style={[styles.logsTitle, { color: colors.text }]}>
          Recent Access Logs
        </Text>
        <TouchableOpacity onPress={handleClearLogs}>
          <Text style={[styles.clearLogsText, { color: colors.tint }]}>Clear</Text>
        </TouchableOpacity>
      </View>
      {logs.length === 0 ? (
        <Text style={[styles.noLogs, { color: colors.textMuted }]}>
          No access logs yet
        </Text>
      ) : (
        logs.slice(0, 20).map((log, index) => (
          <View key={index} style={[styles.logRow, { borderBottomColor: colors.border }]}>
            <View style={styles.logLeft}>
              <Ionicons
                name={log.action === 'read' ? 'eye' : log.action === 'write' ? 'pencil' : 'flash'}
                size={14}
                color={colors.textMuted}
              />
              <Text style={[styles.logId, { color: colors.text }]}>{log.id}</Text>
            </View>
            <Text style={[styles.logData, { color: colors.textSecondary }]} numberOfLines={1}>
              {log.data || '-'}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>AI Access Registry</Text>
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <Ionicons name="refresh" size={20} color={colors.tint} />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      {summary && (
        <View style={[styles.summaryBar, { backgroundColor: colors.card }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.tint }]}>{summary.enabled}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Enabled</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.error || '#FF0000' }]}>{summary.disabled}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Blocked</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{summary.total}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total</Text>
          </View>
        </View>
      )}

      {/* Info banner */}
      <View style={[styles.infoBanner, { backgroundColor: colors.tint + '15' }]}>
        <Ionicons name="information-circle" size={18} color={colors.tint} />
        <Text style={[styles.infoText, { color: colors.text }]}>
          If something is not in this registry, the AI cannot access it.
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, !showLogs && { borderBottomColor: colors.tint, borderBottomWidth: 2 }]}
          onPress={() => setShowLogs(false)}
        >
          <Text style={[styles.tabText, { color: showLogs ? colors.textMuted : colors.tint }]}>
            Registry
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, showLogs && { borderBottomColor: colors.tint, borderBottomWidth: 2 }]}
          onPress={() => setShowLogs(true)}
        >
          <Text style={[styles.tabText, { color: showLogs ? colors.tint : colors.textMuted }]}>
            Logs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {showLogs ? (
          renderLogs()
        ) : (
          <>
            {(Object.keys(CATEGORY_INFO) as AccessCategory[]).map(renderCategory)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
  },
  resetButton: {
    padding: 8,
  },
  summaryBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  categorySection: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryCount: {
    fontSize: 14,
  },
  categoryEntries: {
    marginTop: 8,
    gap: 8,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  entryInfo: {
    flex: 1,
    marginRight: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  entryName: {
    fontSize: 15,
    fontWeight: '500',
  },
  requiredBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  entryDescription: {
    fontSize: 13,
    marginBottom: 4,
  },
  entryService: {
    fontSize: 11,
  },
  entryConditional: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  logsSection: {
    marginTop: 8,
  },
  logsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearLogsText: {
    fontSize: 14,
  },
  noLogs: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logId: {
    fontSize: 13,
    fontWeight: '500',
  },
  logData: {
    fontSize: 12,
    maxWidth: 150,
  },
});
