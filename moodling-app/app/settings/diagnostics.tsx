/**
 * Diagnostics Self-Test Screen
 *
 * Tests all coach access data sources and displays pass/fail status.
 * Shows green/red circles for each source indicating validity.
 * Produces detailed logs for debugging.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  runFullDiagnostic,
  DiagnosticReport,
  TestResult,
  TestStatus,
  getStatusColor,
  getStatusEmoji,
} from '@/services/diagnosticTestService';
import { getLogStats, getLogs, LogEntry, clearLogs, exportLogs } from '@/services/loggingService';
import * as Clipboard from 'expo-clipboard';

export default function DiagnosticsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [logStats, setLogStats] = useState<ReturnType<typeof getLogStats> | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load log stats
  const loadLogStats = useCallback(() => {
    setLogStats(getLogStats());
    setRecentLogs(getLogs({ category: 'diagnostic' }).slice(0, 50));
  }, []);

  useEffect(() => {
    loadLogStats();
  }, [loadLogStats]);

  // Run diagnostic tests
  const runTests = async () => {
    setIsRunning(true);
    setReport(null);

    try {
      const result = await runFullDiagnostic();
      setReport(result);
      loadLogStats(); // Refresh logs after test
    } catch (error) {
      console.error('Diagnostic test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Copy logs to clipboard
  const copyLogs = async () => {
    const logsJson = exportLogs({ category: 'diagnostic' });
    await Clipboard.setStringAsync(logsJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clear diagnostic logs
  const handleClearLogs = async () => {
    await clearLogs();
    loadLogStats();
  };

  // Render status indicator
  const renderStatusIndicator = (status: TestStatus) => {
    const color = getStatusColor(status);
    return (
      <View style={[styles.statusIndicator, { backgroundColor: color }]} />
    );
  };

  // Render a test result row
  const renderTestResult = (result: TestResult) => {
    const statusColor = getStatusColor(result.status);

    return (
      <View
        key={result.sourceId}
        style={[styles.resultRow, { borderBottomColor: colors.border }]}
      >
        {renderStatusIndicator(result.status)}
        <View style={styles.resultInfo}>
          <View style={styles.resultHeader}>
            <Text style={[styles.sourceName, { color: colors.text }]}>
              {result.sourceName}
            </Text>
            {!result.enabled && (
              <Text style={[styles.disabledBadge, { color: colors.textMuted }]}>
                (disabled)
              </Text>
            )}
          </View>
          <Text style={[styles.resultDetails, { color: colors.textSecondary }]}>
            {result.details || result.error || `Status: ${result.status}`}
          </Text>
          {result.responseTime !== undefined && (
            <Text style={[styles.responseTime, { color: colors.textMuted }]}>
              {result.responseTime}ms
            </Text>
          )}
        </View>
        <Text style={[styles.statusEmoji]}>{getStatusEmoji(result.status)}</Text>
      </View>
    );
  };

  // Render log entry
  const renderLogEntry = (entry: LogEntry) => {
    const levelColors: Record<string, string> = {
      debug: colors.textMuted,
      info: colors.tint,
      warn: colors.warning,
      error: colors.error,
      fatal: colors.error,
    };

    return (
      <View
        key={entry.id}
        style={[styles.logEntry, { borderBottomColor: colors.border }]}
      >
        <View style={styles.logHeader}>
          <Text style={[styles.logLevel, { color: levelColors[entry.level] }]}>
            [{entry.level.toUpperCase()}]
          </Text>
          <Text style={[styles.logTime, { color: colors.textMuted }]}>
            {new Date(entry.timestamp).toLocaleTimeString()}
          </Text>
        </View>
        <Text style={[styles.logMessage, { color: colors.text }]}>
          {entry.message}
        </Text>
        {entry.data && (
          <Text style={[styles.logData, { color: colors.textSecondary }]}>
            {JSON.stringify(entry.data, null, 2)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Diagnostics',
          headerBackTitle: 'Settings',
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRunning}
            onRefresh={runTests}
            tintColor={colors.tint}
          />
        }
      >
        {/* Header Card */}
        <View style={[styles.headerCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Data Source Diagnostics
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Test all coach data sources to verify they're working correctly.
            Each source shows a colored indicator:
          </Text>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Passed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Failed</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Warning</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#9E9E9E' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>Skipped</Text>
            </View>
          </View>
        </View>

        {/* Run Test Button */}
        <TouchableOpacity
          style={[
            styles.runButton,
            { backgroundColor: colors.tint },
            isRunning && styles.runButtonDisabled,
          ]}
          onPress={runTests}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.runButtonText}>Running Tests...</Text>
            </>
          ) : (
            <>
              <Ionicons name="play-circle" size={24} color="#fff" />
              <Text style={styles.runButtonText}>Run All Tests</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Test Results */}
        {report && (
          <View style={[styles.resultsCard, { backgroundColor: colors.card }]}>
            {/* Summary */}
            <View style={[styles.summaryBar, { borderBottomColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                Results
              </Text>
              <View style={styles.summaryStats}>
                <Text style={[styles.statPassed]}>
                  {report.passed} passed
                </Text>
                {report.failed > 0 && (
                  <Text style={[styles.statFailed]}>
                    {report.failed} failed
                  </Text>
                )}
                {report.warnings > 0 && (
                  <Text style={[styles.statWarning]}>
                    {report.warnings} warnings
                  </Text>
                )}
              </View>
            </View>

            {/* Summary Text */}
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
              {report.summary}
            </Text>

            {/* Individual Results */}
            <View style={styles.resultsList}>
              {report.results.map(renderTestResult)}
            </View>
          </View>
        )}

        {/* Logs Section */}
        <View style={[styles.logsCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.logsHeader}
            onPress={() => setShowLogs(!showLogs)}
          >
            <View style={styles.logsHeaderLeft}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.logsTitle, { color: colors.text }]}>
                Diagnostic Logs
              </Text>
            </View>
            <Ionicons
              name={showLogs ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          {showLogs && (
            <>
              {/* Log Stats */}
              {logStats && (
                <View style={[styles.logStatsRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.logStatText, { color: colors.textSecondary }]}>
                    Total: {logStats.totalLogs} logs
                  </Text>
                  <Text style={[styles.logStatText, { color: colors.error }]}>
                    Errors: {logStats.byLevel.error + logStats.byLevel.fatal}
                  </Text>
                  <Text style={[styles.logStatText, { color: colors.warning }]}>
                    Warnings: {logStats.byLevel.warn}
                  </Text>
                </View>
              )}

              {/* Log Actions */}
              <View style={styles.logActions}>
                <TouchableOpacity
                  style={[styles.logActionButton, { backgroundColor: colors.border }]}
                  onPress={copyLogs}
                >
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={16}
                    color={colors.text}
                  />
                  <Text style={[styles.logActionText, { color: colors.text }]}>
                    {copied ? 'Copied!' : 'Copy Logs'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.logActionButton, { backgroundColor: colors.border }]}
                  onPress={handleClearLogs}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                  <Text style={[styles.logActionText, { color: colors.error }]}>
                    Clear Logs
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Recent Logs */}
              <View style={styles.logsList}>
                {recentLogs.length === 0 ? (
                  <Text style={[styles.noLogs, { color: colors.textMuted }]}>
                    No diagnostic logs yet. Run a test to generate logs.
                  </Text>
                ) : (
                  recentLogs.map(renderLogEntry)
                )}
              </View>
            </>
          )}
        </View>

        {/* Info Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            All tests run locally on your device. No data is sent externally.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  runButtonDisabled: {
    opacity: 0.7,
  },
  runButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statPassed: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '500',
  },
  statFailed: {
    color: '#F44336',
    fontSize: 13,
    fontWeight: '500',
  },
  statWarning: {
    color: '#FF9800',
    fontSize: 13,
    fontWeight: '500',
  },
  summaryText: {
    padding: 14,
    paddingTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  resultsList: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  statusIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  resultInfo: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceName: {
    fontSize: 14,
    fontWeight: '500',
  },
  disabledBadge: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  resultDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  responseTime: {
    fontSize: 11,
    marginTop: 2,
  },
  statusEmoji: {
    fontSize: 16,
  },
  logsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  logsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  logStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    borderTopWidth: 1,
  },
  logStatText: {
    fontSize: 12,
  },
  logActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    paddingTop: 0,
  },
  logActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logActionText: {
    fontSize: 13,
  },
  logsList: {
    maxHeight: 400,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  noLogs: {
    padding: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  logEntry: {
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  logLevel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  logTime: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  logMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  logData: {
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 6,
    borderRadius: 4,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
