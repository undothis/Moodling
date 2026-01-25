/**
 * Coach Access Registry Settings
 *
 * Control what data sources the AI coach can access.
 * Following Mood Leaf Ethics:
 * - User has full control over AI data access
 * - Transparency about what data is used
 * - Easy to toggle sources on/off
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import {
  getAccessRegistry,
  toggleSource,
  toggleGlobalAccess,
  getSourcesByCategory,
  CoachAccessRegistry,
  DataSource,
  AccessCategory,
  CATEGORY_LABELS,
} from '@/services/coachAccessRegistry';
import {
  runFullDiagnostic,
  testSourceById,
  TestResult,
  DiagnosticReport,
  getStatusEmoji,
} from '@/services/diagnosticTestService';

// Category emojis for visual clarity
const CATEGORY_EMOJIS: Record<AccessCategory, string> = {
  core_user_data: '👤',
  context_memories: '🧠',
  tracking: '📊',
  health: '💚',
  calendar: '📅',
  social: '👥',
  location: '📍',
  therapeutic: '🌱',
  communication_style: '💬',
  diagnostics: '🔧',
};

export default function CoachAccessSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [registry, setRegistry] = useState<CoachAccessRegistry | null>(null);
  const [sourcesByCategory, setSourcesByCategory] = useState<Record<AccessCategory, DataSource[]> | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testSummary, setTestSummary] = useState<string | null>(null);

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const [loadedRegistry, loadedSources] = await Promise.all([
        getAccessRegistry(),
        getSourcesByCategory(),
      ]);

      setRegistry(loadedRegistry);
      setSourcesByCategory(loadedSources);

      // Expand categories that have disabled sources (so user can see what's off)
      const expanded: Record<string, boolean> = {};
      for (const [category, sources] of Object.entries(loadedSources)) {
        const hasDisabled = sources.some(s => !s.enabled);
        expanded[category] = hasDisabled;
      }
      setExpandedCategories(expanded);
    } catch (error) {
      console.error('Error loading coach access settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Handle global toggle
  const handleGlobalToggle = async (enabled: boolean) => {
    if (!registry) return;
    await toggleGlobalAccess(enabled);
    setRegistry({ ...registry, globalEnabled: enabled });
  };

  // Handle source toggle
  const handleSourceToggle = async (sourceId: string, enabled: boolean) => {
    if (!registry || !sourcesByCategory) return;

    // Don't allow disabling safety services
    if (['core_principles', 'safeguards'].includes(sourceId) && !enabled) {
      return;
    }

    await toggleSource(sourceId, enabled);

    // Update local state
    const updatedSources = registry.sources.map(s =>
      s.id === sourceId ? { ...s, enabled } : s
    );
    setRegistry({ ...registry, sources: updatedSources });

    // Update category sources
    const updatedByCategory = { ...sourcesByCategory };
    for (const category of Object.keys(updatedByCategory) as AccessCategory[]) {
      updatedByCategory[category] = updatedByCategory[category].map(s =>
        s.id === sourceId ? { ...s, enabled } : s
      );
    }
    setSourcesByCategory(updatedByCategory);
  };

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Count enabled sources in a category
  const getCategoryStats = (sources: DataSource[]) => {
    const enabled = sources.filter(s => s.enabled).length;
    return { enabled, total: sources.length };
  };

  // Run tests on all data sources
  const runTests = useCallback(async () => {
    setIsTesting(true);
    setTestResults({});
    setTestSummary(null);

    try {
      const report = await runFullDiagnostic();

      // Convert results array to lookup by sourceId
      const resultsMap: Record<string, TestResult> = {};
      for (const result of report.results) {
        resultsMap[result.sourceId] = result;
      }
      setTestResults(resultsMap);
      setTestSummary(report.summary);
    } catch (error) {
      console.error('Test failed:', error);
      setTestSummary('Test failed - see console for details');
    } finally {
      setIsTesting(false);
    }
  }, []);

  // Get test status indicator for a source
  const getSourceTestStatus = (sourceId: string) => {
    const result = testResults[sourceId];
    if (!result) return null;

    // Check if source is blocked (toggle OFF)
    const source = registry?.sources.find(s => s.id === sourceId);
    const isBlocked = source && !source.enabled;
    const globalBlocked = registry && !registry.globalEnabled;

    if (globalBlocked || isBlocked) {
      return {
        emoji: '🚫',
        color: '#9E9E9E',
        status: 'BLOCKED',
        details: globalBlocked ? 'Global access OFF' : 'Toggle is OFF - data not sent to AI',
      };
    }

    return {
      emoji: getStatusEmoji(result.status),
      color: result.status === 'passed' ? '#4CAF50' :
             result.status === 'failed' ? '#F44336' :
             result.status === 'warning' ? '#FF9800' : '#9E9E9E',
      status: result.status === 'passed' ? 'WORKING' :
              result.status === 'failed' ? 'FAILED' :
              result.status === 'warning' ? 'NEEDS PERMISSION' : 'SKIPPED',
      details: result.details || result.error || '',
    };
  };

  if (loading || !registry || !sourcesByCategory) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading access settings...
        </Text>
      </View>
    );
  }

  const enabledCount = registry.sources.filter(s => s.enabled).length;
  const totalCount = registry.sources.length;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'AI Data Access',
          headerBackTitle: 'Settings',
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Master Toggle */}
        <View style={[styles.masterCard, { backgroundColor: colors.card }]}>
          <View style={styles.masterHeader}>
            <View style={styles.masterInfo}>
              <Text style={[styles.masterTitle, { color: colors.text }]}>
                AI Coach Access
              </Text>
              <Text style={[styles.masterSubtitle, { color: colors.textSecondary }]}>
                {registry.globalEnabled
                  ? `${enabledCount} of ${totalCount} data sources active`
                  : 'All AI data access is disabled'}
              </Text>
            </View>
            <Switch
              value={registry.globalEnabled}
              onValueChange={handleGlobalToggle}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor="#fff"
            />
          </View>

          {!registry.globalEnabled && (
            <View style={[styles.warningBanner, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.warningText, { color: colors.error }]}>
                Your AI coach has no access to your data. Conversations will be generic without personalization.
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Control exactly what information your AI coach can use. Toggle individual data sources on or off. Your preferences are saved automatically.
        </Text>

        {/* Testing Section */}
        <View style={[styles.testingCard, { backgroundColor: colors.card }]}>
          <View style={styles.testingHeader}>
            <Text style={[styles.testingTitle, { color: colors.text }]}>
              Test Data Access
            </Text>
            <TouchableOpacity
              style={[
                styles.testButton,
                { backgroundColor: isTesting ? colors.border : colors.tint }
              ]}
              onPress={runTests}
              disabled={isTesting}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.testButtonText}>Run Tests</Text>
              )}
            </TouchableOpacity>
          </View>

          {testSummary && (
            <View style={[styles.testSummary, { backgroundColor: colors.background }]}>
              <Text style={[styles.testSummaryText, { color: colors.text }]}>
                {testSummary}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.fullDiagnosticsLink}
            onPress={() => router.push('/admin/coach-diagnostics')}
          >
            <Text style={[styles.fullDiagnosticsText, { color: colors.tint }]}>
              Open Full Diagnostics
            </Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        {(Object.entries(sourcesByCategory) as [AccessCategory, DataSource[]][])
          .filter(([_, sources]) => sources.length > 0)
          .map(([category, sources]) => {
            const stats = getCategoryStats(sources);
            const isExpanded = expandedCategories[category];
            const emoji = CATEGORY_EMOJIS[category];
            const label = CATEGORY_LABELS[category];

            return (
              <View
                key={category}
                style={[styles.categoryCard, { backgroundColor: colors.card }]}
              >
                {/* Category Header */}
                <Pressable
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category)}
                >
                  <Text style={styles.categoryEmoji}>{emoji}</Text>
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryTitle, { color: colors.text }]}>
                      {label}
                    </Text>
                    <Text style={[styles.categoryStats, { color: colors.textSecondary }]}>
                      {stats.enabled} of {stats.total} enabled
                    </Text>
                  </View>
                  <Text style={[styles.categoryArrow, { color: colors.textSecondary }]}>
                    {isExpanded ? '▼' : '▶'}
                  </Text>
                </Pressable>

                {/* Expanded Sources */}
                {isExpanded && (
                  <View style={styles.sourcesList}>
                    {sources.map((source) => {
                      const isSafetySource = ['core_principles', 'safeguards'].includes(source.id);
                      const testStatus = getSourceTestStatus(source.id);

                      return (
                        <View
                          key={source.id}
                          style={[
                            styles.sourceRow,
                            { borderTopColor: colors.border },
                          ]}
                        >
                          {/* Test Status Indicator */}
                          {testStatus && (
                            <View style={[
                              styles.testStatusIndicator,
                              {
                                borderColor: testStatus.color,
                                backgroundColor: testStatus.color + '15',
                              }
                            ]}>
                              <Text style={styles.testStatusEmoji}>{testStatus.emoji}</Text>
                              <Text style={[styles.testStatusLabel, { color: testStatus.color }]}>
                                {testStatus.status}
                              </Text>
                            </View>
                          )}
                          <View style={[styles.sourceInfo, testStatus && styles.sourceInfoWithTest]}>
                            <Text style={[styles.sourceName, { color: colors.text }]}>
                              {source.name}
                              {isSafetySource && (
                                <Text style={[styles.requiredBadge, { color: colors.tint }]}>
                                  {' '}(Required)
                                </Text>
                              )}
                            </Text>
                            <Text style={[styles.sourceDescription, { color: colors.textSecondary }]}>
                              {source.description}
                            </Text>
                            {source.requiresPermission && !source.permissionGranted && (
                              <Text style={[styles.permissionNote, { color: colors.warning }]}>
                                Requires device permission
                              </Text>
                            )}
                            {/* Show test details if failed or warning */}
                            {testStatus && (testStatus.emoji === '❌' || testStatus.emoji === '⚠️') && testStatus.details && (
                              <Text style={[styles.testDetailsText, { color: testStatus.color }]}>
                                {testStatus.details}
                              </Text>
                            )}
                          </View>
                          <Switch
                            value={source.enabled}
                            onValueChange={(value) => handleSourceToggle(source.id, value)}
                            trackColor={{ false: colors.border, true: colors.tint }}
                            thumbColor="#fff"
                            disabled={!registry.globalEnabled || isSafetySource}
                          />
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

        {/* Privacy Note */}
        <View style={[styles.privacyCard, { backgroundColor: colors.card }]}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <View style={styles.privacyInfo}>
            <Text style={[styles.privacyTitle, { color: colors.text }]}>
              Privacy First
            </Text>
            <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
              All your data stays on your device. When you chat with the coach, only conversation context is sent to Claude's API — and it's never stored. Toggling sources off here means that data won't be included in coach conversations.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  masterCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
  },
  masterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  masterInfo: {
    flex: 1,
    marginRight: 16,
  },
  masterTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  masterSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  warningBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  description: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  categoryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryStats: {
    fontSize: 13,
    marginTop: 2,
  },
  categoryArrow: {
    fontSize: 12,
    marginLeft: 8,
  },
  sourcesList: {
    paddingBottom: 8,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sourceInfo: {
    flex: 1,
    marginRight: 12,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '500',
  },
  requiredBadge: {
    fontSize: 12,
    fontWeight: '400',
  },
  sourceDescription: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  permissionNote: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  privacyCard: {
    flexDirection: 'row',
    margin: 16,
    padding: 14,
    borderRadius: 12,
  },
  privacyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  privacyInfo: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  privacyText: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Testing styles
  testingCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
  },
  testingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  testSummary: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  testSummaryText: {
    fontSize: 13,
    textAlign: 'center',
  },
  fullDiagnosticsLink: {
    marginTop: 10,
    alignItems: 'center',
  },
  fullDiagnosticsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  testStatusIndicator: {
    marginRight: 10,
    minWidth: 70,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  testStatusEmoji: {
    fontSize: 14,
  },
  testStatusLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  sourceInfoWithTest: {
    flex: 1,
  },
  testDetailsText: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
