/**
 * Simulator Mode Screen
 *
 * AI Adaptation Verification system for testing whether
 * AI services are functioning correctly, adapting over time,
 * and accurately referencing data.
 *
 * Features:
 * - On/Off toggle
 * - Global Test button
 * - Per-service tests
 * - Reference Challenge generator (with "well" to copy prompts)
 * - Diagnostic Report generator
 * - Failure logs viewer
 */

import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

// Cross-platform clipboard helper (no external dependency required)
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      // Web: use navigator.clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } else {
      // React Native: use the Clipboard from react-native (deprecated but still works)
      const { Clipboard } = require('react-native');
      if (Clipboard && Clipboard.setString) {
        Clipboard.setString(text);
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
import {
  isSimulatorEnabled,
  setSimulatorEnabled,
  getSimulatorState,
  runGlobalTest,
  runServiceTest,
  generateChallengeForChat,
  generateChallengeByCategory,
  generateDiagnosticReport,
  getFailureLogs,
  clearFailureLogs,
  clearSimulatorData,
  getDataSummary,
  getChallengeCategories,
  AIServiceType,
  ServiceTestResult,
  FailureLog,
  VerificationPrompt,
} from '@/services/simulatorModeService';

export default function SimulatorScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // State
  const [enabled, setEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [lastGlobalResult, setLastGlobalResult] = useState<'pass' | 'fail' | 'never_run'>('never_run');
  const [serviceResults, setServiceResults] = useState<Record<string, ServiceTestResult>>({});
  const [failureLogs, setFailureLogs] = useState<FailureLog[]>([]);
  const [dataSummary, setDataSummary] = useState<{
    twigCount: number;
    journalCount: number;
    hasLifeContext: boolean;
    hasPsychProfile: boolean;
  } | null>(null);

  // Challenge well state
  const [currentChallenge, setCurrentChallenge] = useState<VerificationPrompt | null>(null);
  const [challengePrompt, setChallengePrompt] = useState('');
  const [expectedData, setExpectedData] = useState('');
  const [showChallengeCategories, setShowChallengeCategories] = useState(false);

  // Diagnostic report state
  const [diagnosticReport, setDiagnosticReport] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Load state when screen is focused (including when navigating back)
  const loadState = useCallback(async () => {
    try {
      setIsLoading(true);
      const [state, logs, summary] = await Promise.all([
        getSimulatorState(),
        getFailureLogs(),
        getDataSummary(),
      ]);

      setEnabled(state.enabled);
      setLastGlobalResult(state.lastGlobalResult);
      setServiceResults(state.serviceResults as Record<string, ServiceTestResult>);
      setFailureLogs(logs);
      setDataSummary(summary);
    } catch (error) {
      console.error('Failed to load simulator state:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload state every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      loadState();
    }, [loadState])
  );

  // Toggle enabled state with error handling
  const handleToggle = async (value: boolean) => {
    const previousValue = enabled;
    setEnabled(value); // Optimistic update

    try {
      await setSimulatorEnabled(value);
      console.log('[Simulator] Mode set to:', value);
    } catch (error) {
      console.error('[Simulator] Failed to save enabled state:', error);
      setEnabled(previousValue); // Revert on failure

      if (Platform.OS === 'web') {
        window.alert('Failed to save setting. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to save setting. Please try again.');
      }
    }
  };

  // Run global test
  const handleGlobalTest = async () => {
    setIsTesting(true);
    try {
      const result = await runGlobalTest();
      setLastGlobalResult(result.passed ? 'pass' : 'fail');
      setServiceResults(
        result.results.reduce((acc, r) => {
          acc[r.service] = r;
          return acc;
        }, {} as Record<string, ServiceTestResult>)
      );
      setFailureLogs(await getFailureLogs());

      const message = result.passed
        ? 'All services passed verification!'
        : `${result.results.filter(r => !r.passed).length} service(s) failed. Check details below.`;

      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert(result.passed ? 'Success' : 'Issues Found', message);
      }
    } catch (error) {
      console.error('Global test failed:', error);
    } finally {
      setIsTesting(false);
    }
  };

  // Run single service test
  const handleServiceTest = async (service: AIServiceType) => {
    setIsTesting(true);
    try {
      const result = await runServiceTest(service);
      setServiceResults(prev => ({ ...prev, [service]: result }));
      setFailureLogs(await getFailureLogs());
    } catch (error) {
      console.error(`Test for ${service} failed:`, error);
    } finally {
      setIsTesting(false);
    }
  };

  // Generate random challenge
  const handleRandomChallenge = async () => {
    try {
      const result = await generateChallengeForChat();
      setCurrentChallenge(result.challenge);
      setChallengePrompt(result.prefilledPrompt);
      setExpectedData(result.expectedData);
      setShowChallengeCategories(false);
    } catch (error) {
      console.error('Failed to generate challenge:', error);
    }
  };

  // Generate category-specific challenge
  const handleCategoryChallenge = async (category: string) => {
    try {
      const result = await generateChallengeByCategory(category as VerificationPrompt['category']);
      if (result.challenge) {
        setCurrentChallenge(result.challenge);
        setChallengePrompt(result.prefilledPrompt);
        setExpectedData(result.expectedData);
      }
      setShowChallengeCategories(false);
    } catch (error) {
      console.error('Failed to generate category challenge:', error);
    }
  };

  // Copy challenge to clipboard
  const handleCopyChallenge = async () => {
    if (!challengePrompt) return;
    const success = await copyToClipboard(challengePrompt);

    if (success) {
      if (Platform.OS === 'web') {
        window.alert('Challenge copied to clipboard! Paste it in the chat.');
      } else {
        Alert.alert('Copied', 'Challenge copied to clipboard! Paste it in the chat.');
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert('Failed to copy. Please select and copy the text manually.');
      } else {
        Alert.alert('Error', 'Failed to copy. Please select and copy the text manually.');
      }
    }
  };

  // Generate diagnostic report
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const report = await generateDiagnosticReport();
      setDiagnosticReport(report);
      setShowReport(true);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Copy report to clipboard
  const handleCopyReport = async () => {
    const success = await copyToClipboard(diagnosticReport);

    if (success) {
      if (Platform.OS === 'web') {
        window.alert('Report copied! Paste it to Claude for troubleshooting.');
      } else {
        Alert.alert('Copied', 'Report copied! Paste it to Claude for troubleshooting.');
      }
    } else {
      if (Platform.OS === 'web') {
        window.alert('Failed to copy. Please select and copy the text manually.');
      } else {
        Alert.alert('Error', 'Failed to copy. Please select and copy the text manually.');
      }
    }
  };

  // Clear all data
  const handleClearData = async () => {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Clear all simulator data and logs? This cannot be undone.')
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Clear Data',
            'Clear all simulator data and logs? This cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Clear', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (confirm) {
      await clearSimulatorData();
      await clearFailureLogs();
      await loadState();
    }
  };

  const services: { id: AIServiceType; name: string; emoji: string }[] = [
    { id: 'twigs', name: 'Twigs', emoji: '🌿' },
    { id: 'journaling', name: 'Journaling', emoji: '📝' },
    { id: 'compression', name: 'Life Context', emoji: '🧠' },
    { id: 'psych_series', name: 'Psych Series', emoji: '🔮' },
    { id: 'insights', name: 'Insights', emoji: '📊' },
    { id: 'coaching', name: 'Coaching', emoji: '💬' },
    { id: 'exposure', name: 'Exposure Ladder', emoji: '🪜' },
  ];

  const challengeCategories = getChallengeCategories();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.tint} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>Simulator Mode</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            AI Adaptation Verification
          </Text>
        </View>
      </View>

      {/* Enable Toggle */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={[styles.toggleLabel, { color: colors.text }]}>
              Enable Simulator Mode
            </Text>
            <Text style={[styles.toggleDescription, { color: colors.textMuted }]}>
              Run continuous verification in background
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: colors.border, true: colors.tint }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Data Summary */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Data Available
        </Text>
        {dataSummary && (
          <View style={styles.dataSummary}>
            <View style={styles.dataRow}>
              <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Twigs</Text>
              <Text style={[styles.dataValue, { color: colors.text }]}>{dataSummary.twigCount}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Journals</Text>
              <Text style={[styles.dataValue, { color: colors.text }]}>{dataSummary.journalCount}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Life Context</Text>
              <Text style={[styles.dataValue, { color: dataSummary.hasLifeContext ? '#4CAF50' : colors.textMuted }]}>
                {dataSummary.hasLifeContext ? 'Active' : 'Not set'}
              </Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>Psych Profile</Text>
              <Text style={[styles.dataValue, { color: dataSummary.hasPsychProfile ? '#4CAF50' : colors.textMuted }]}>
                {dataSummary.hasPsychProfile ? 'Active' : 'Not set'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Global Test */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Global Verification Test
        </Text>

        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: colors.tint }]}
          onPress={handleGlobalTest}
          disabled={isTesting}
        >
          {isTesting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.testButtonText}>Run All Tests</Text>
          )}
        </TouchableOpacity>

        {lastGlobalResult !== 'never_run' && (
          <View style={[
            styles.resultBadge,
            { backgroundColor: lastGlobalResult === 'pass' ? '#4CAF50' : '#F44336' }
          ]}>
            <Text style={styles.resultBadgeText}>
              {lastGlobalResult === 'pass' ? 'PASS' : 'FAIL'}
            </Text>
          </View>
        )}

        <Text style={[styles.testHint, { color: colors.textMuted }]}>
          Tests all services on Input Integrity, Compression Accuracy, Adaptation, and Mental Health Safety.
        </Text>
      </View>

      {/* Per-Service Tests */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Per-Service Tests
        </Text>

        <View style={styles.serviceGrid}>
          {services.map(service => {
            const result = serviceResults[service.id];
            return (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceCard,
                  { backgroundColor: colors.background },
                  result && !result.passed && { borderColor: '#F44336', borderWidth: 2 },
                  result?.passed && { borderColor: '#4CAF50', borderWidth: 2 },
                ]}
                onPress={() => handleServiceTest(service.id)}
                disabled={isTesting}
              >
                <Text style={styles.serviceEmoji}>{service.emoji}</Text>
                <Text style={[styles.serviceName, { color: colors.text }]}>{service.name}</Text>
                {result && (
                  <Text style={[
                    styles.serviceScore,
                    { color: result.passed ? '#4CAF50' : '#F44336' }
                  ]}>
                    {result.overallScore}/100
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Reference Challenge Well */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Reference Challenge
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Generate a prompt to test AI referencing. Copy it to the chat.
        </Text>

        {/* Challenge buttons */}
        <View style={styles.challengeButtons}>
          <TouchableOpacity
            style={[styles.challengeButton, { backgroundColor: colors.tint }]}
            onPress={handleRandomChallenge}
          >
            <Text style={styles.challengeButtonText}>Random Challenge</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.challengeButton, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => setShowChallengeCategories(!showChallengeCategories)}
          >
            <Text style={[styles.challengeButtonText, { color: colors.text }]}>By Category</Text>
          </TouchableOpacity>
        </View>

        {/* Category selector */}
        {showChallengeCategories && (
          <View style={styles.categoryGrid}>
            {challengeCategories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, { backgroundColor: colors.background }]}
                onPress={() => handleCategoryChallenge(cat.id)}
              >
                <Text style={[styles.categoryName, { color: colors.text }]}>{cat.name}</Text>
                <Text style={[styles.categoryDesc, { color: colors.textMuted }]}>{cat.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Challenge well (text area) */}
        {challengePrompt && (
          <View style={[styles.challengeWell, { backgroundColor: colors.background }]}>
            <View style={styles.challengeHeader}>
              <Text style={[styles.challengeCategory, { color: colors.tint }]}>
                {currentChallenge?.category.replace(/_/g, ' ').toUpperCase()}
              </Text>
              <TouchableOpacity onPress={handleCopyChallenge}>
                <Ionicons name="copy-outline" size={20} color={colors.tint} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.challengeText, { color: colors.text }]}
              value={challengePrompt}
              onChangeText={setChallengePrompt}
              multiline
              editable
            />

            <View style={styles.expectedSection}>
              <Text style={[styles.expectedLabel, { color: colors.textSecondary }]}>
                Expected Data:
              </Text>
              <Text style={[styles.expectedText, { color: colors.textMuted }]}>
                {expectedData}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: colors.tint }]}
              onPress={handleCopyChallenge}
            >
              <Ionicons name="copy" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.copyButtonText}>Copy to Clipboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Diagnostic Report */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Diagnostic Report
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Generate a detailed report for Claude troubleshooting
        </Text>

        <TouchableOpacity
          style={[styles.reportButton, { backgroundColor: colors.tint }]}
          onPress={handleGenerateReport}
          disabled={isGeneratingReport}
        >
          {isGeneratingReport ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="document-text" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.reportButtonText}>Generate Report</Text>
            </>
          )}
        </TouchableOpacity>

        {showReport && diagnosticReport && (
          <View style={[styles.reportContainer, { backgroundColor: colors.background }]}>
            <ScrollView style={styles.reportScroll} nestedScrollEnabled>
              <Text style={[styles.reportText, { color: colors.text }]}>
                {diagnosticReport.substring(0, 2000)}
                {diagnosticReport.length > 2000 && '\n\n... (truncated for display)'}
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: colors.tint, marginTop: 12 }]}
              onPress={handleCopyReport}
            >
              <Ionicons name="copy" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.copyButtonText}>Copy Full Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Failure Logs */}
      {failureLogs.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Failure Logs ({failureLogs.length})
            </Text>
            <TouchableOpacity onPress={handleClearData}>
              <Text style={[styles.clearButton, { color: colors.error }]}>Clear</Text>
            </TouchableOpacity>
          </View>

          {failureLogs.slice(0, 5).map(log => (
            <View
              key={log.id}
              style={[styles.logCard, { backgroundColor: colors.background }]}
            >
              <View style={styles.logHeader}>
                <Text style={[styles.logService, { color: colors.text }]}>
                  {log.service.toUpperCase()}
                </Text>
                <Text style={[styles.logAxis, { color: colors.textMuted }]}>
                  {log.axis.replace(/_/g, ' ')}
                </Text>
              </View>
              <Text style={[styles.logIssue, { color: colors.error }]}>
                {log.issue}
              </Text>
              <Text style={[styles.logEvidence, { color: colors.textMuted }]}>
                {log.evidence}
              </Text>
              <Text style={[styles.logTime, { color: colors.textMuted }]}>
                {new Date(log.timestamp).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.dangerButton, { borderColor: colors.error }]}
          onPress={handleClearData}
        >
          <Text style={[styles.dangerButtonText, { color: colors.error }]}>
            Clear All Simulator Data
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  dataSummary: {
    marginTop: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dataLabel: {
    fontSize: 14,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  testButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultBadge: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  resultBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  testHint: {
    fontSize: 13,
    textAlign: 'center',
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  serviceCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  serviceScore: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  challengeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  challengeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  challengeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryGrid: {
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    padding: 12,
    borderRadius: 10,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  challengeWell: {
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  challengeCategory: {
    fontSize: 12,
    fontWeight: '600',
  },
  challengeText: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 60,
  },
  expectedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  expectedLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  expectedText: {
    fontSize: 13,
    lineHeight: 18,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reportContainer: {
    borderRadius: 12,
    padding: 14,
  },
  reportScroll: {
    maxHeight: 300,
  },
  reportText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
  logCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  logService: {
    fontSize: 13,
    fontWeight: '700',
  },
  logAxis: {
    fontSize: 12,
  },
  logIssue: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  logEvidence: {
    fontSize: 12,
    marginBottom: 6,
  },
  logTime: {
    fontSize: 11,
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  dangerButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  spacer: {
    height: 40,
  },
});
