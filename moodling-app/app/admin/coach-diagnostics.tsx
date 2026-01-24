/**
 * Coach Diagnostics Page
 *
 * Tests all services and contexts that the Coach uses to ensure
 * everything is working correctly.
 */

import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import all services to test
import { hasAPIKey, getAPIKey, CLAUDE_CONFIG } from '@/services/claudeAPIService';
import { getTonePreferences, getToneInstruction } from '@/services/tonePreferencesService';
import { getCoachSettings, generatePersonalityPrompt } from '@/services/coachPersonalityService';
import { getContextForClaude } from '@/services/userContextService';
import { getLifeContextForClaude } from '@/services/lifeContextService';
import { getHealthContextForClaude, isHealthKitEnabled } from '@/services/healthKitService';
import { getCorrelationSummaryForClaude } from '@/services/healthInsightService';
import { psychAnalysisService } from '@/services/psychAnalysisService';
import { getChronotypeContextForClaude } from '@/services/coachPersonalityService';
import { getDetailedLogsContextForClaude } from '@/services/quickLogsService';
import { getLifestyleFactorsContextForClaude } from '@/services/patternService';
import { getExposureContextForClaude } from '@/services/exposureLadderService';
import { getRecentJournalContextForClaude } from '@/services/journalStorage';
import { getCalendarContextForClaude, isCalendarEnabled } from '@/services/calendarService';
import { getMemoryContextForLLM } from '@/services/memoryTierService';
import { getCognitiveProfileContextForLLM } from '@/services/cognitiveProfileService';
import { getConnectionContextForLLM } from '@/services/socialConnectionHealthService';
import { getPrincipleContextForLLM } from '@/services/corePrincipleKernel';
import { shouldCoachGlow, getNextCelebration } from '@/services/achievementNotificationService';
import { getAccountabilityContextForCoach } from '@/services/aiAccountabilityService';
import { getCoachModeSystemPrompt } from '@/services/coachModeService';
import { checkSafeguards } from '@/services/safeguardService';
import {
  getAlivenessSettings,
  getAlivenessQualities,
  getAlivenessContextForLLM,
  detectUserAlivenessSignals,
  getAlivenessDirectiveForLLM,
} from '@/services/alivenessService';
import {
  getAccessRegistry,
  getEnabledSources,
  getSourcesByCategory,
  isSourceEnabled,
  DataSource,
} from '@/services/coachAccessRegistry';

interface DiagnosticResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  duration?: number;
}

export default function CoachDiagnosticsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [summary, setSummary] = useState<string>('');

  // Helper to run a single diagnostic
  const runDiagnostic = async (
    name: string,
    testFn: () => Promise<{ success: boolean; message: string; details?: string }>
  ): Promise<DiagnosticResult> => {
    const startTime = Date.now();
    try {
      const result = await testFn();
      return {
        name,
        status: result.success ? 'success' : 'warning',
        message: result.message,
        details: result.details,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        name,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  };

  // Run all diagnostics
  const runAllDiagnostics = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    setSummary('');

    const diagnostics: DiagnosticResult[] = [];

    // 0. AI Data Access (Coach Access Registry)
    diagnostics.push(await runDiagnostic('AI Data Access Registry', async () => {
      const registry = await getAccessRegistry();
      const enabledSources = await getEnabledSources();
      const sourcesByCategory = await getSourcesByCategory();
      const categories = Object.keys(sourcesByCategory);
      const totalSources = registry.sources.length;
      const enabledCount = enabledSources.length;
      const disabledCount = totalSources - enabledCount;

      // Build category breakdown
      const categoryBreakdown = categories.map(cat => {
        const sources = sourcesByCategory[cat as keyof typeof sourcesByCategory] || [];
        const catEnabled = sources.filter(s => s.enabled).length;
        return `${cat}: ${catEnabled}/${sources.length}`;
      }).join(', ');

      // Build blocked/allowed list
      const blockedSources = registry.sources.filter(s => !s.enabled).map(s => s.name);
      const blockedList = blockedSources.length > 0
        ? `BLOCKED: ${blockedSources.slice(0, 5).join(', ')}${blockedSources.length > 5 ? ` +${blockedSources.length - 5} more` : ''}`
        : 'All sources allowed';

      return {
        success: registry.globalEnabled,
        message: registry.globalEnabled
          ? `Global ON - ${enabledCount}/${totalSources} sources enabled (${disabledCount} blocked)`
          : `Global OFF - ALL AI access blocked`,
        details: registry.globalEnabled
          ? `${blockedList}\nCategories: ${categoryBreakdown}`
          : 'Enable global access in Settings > AI Data Access'
      };
    }));
    setResults([...diagnostics]);

    // 0.5 Test individual blocked sources
    diagnostics.push(await runDiagnostic('Data Flow Verification', async () => {
      const registry = await getAccessRegistry();
      if (!registry.globalEnabled) {
        return {
          success: true,
          message: 'Global access OFF - all data blocked',
          details: 'No data flows to AI when global toggle is off'
        };
      }

      // Test a few key sources
      const testSources = ['user_context', 'life_context', 'health_kit', 'calendar_events', 'quick_logs'];
      const results: string[] = [];

      for (const sourceId of testSources) {
        const isEnabled = await isSourceEnabled(sourceId);
        const source = registry.sources.find(s => s.id === sourceId);
        const name = source?.name || sourceId;
        results.push(`${isEnabled ? '✅' : '🚫'} ${name}: ${isEnabled ? 'flows to AI' : 'BLOCKED'}`);
      }

      const blockedCount = testSources.filter(async id => !(await isSourceEnabled(id))).length;

      return {
        success: true,
        message: `Verified ${testSources.length} key data sources`,
        details: results.join('\n')
      };
    }));
    setResults([...diagnostics]);

    // 1. API Key Check
    diagnostics.push(await runDiagnostic('Claude API Key', async () => {
      const hasKey = await hasAPIKey();
      if (!hasKey) {
        return { success: false, message: 'No API key configured', details: 'Add your Claude API key in Settings' };
      }
      const key = await getAPIKey();
      return {
        success: true,
        message: `API key configured (${key?.length} chars)`,
        details: `Model: ${CLAUDE_CONFIG.model}`
      };
    }));
    setResults([...diagnostics]);

    // 2. Safeguard Service
    diagnostics.push(await runDiagnostic('Safeguard Service', async () => {
      const result = checkSafeguards('Hello, how are you?');
      return {
        success: true,
        message: result.triggered ? 'Triggered (crisis mode)' : 'Normal mode',
        details: 'Safety checks operational'
      };
    }));
    setResults([...diagnostics]);

    // 3. Tone Preferences
    diagnostics.push(await runDiagnostic('Tone Preferences', async () => {
      const prefs = await getTonePreferences();
      const instruction = getToneInstruction(prefs.selectedStyles || ['balanced']);
      return {
        success: true,
        message: `Styles: ${prefs.selectedStyles?.join(', ') || 'balanced'}`,
        details: instruction.slice(0, 100) + '...'
      };
    }));
    setResults([...diagnostics]);

    // 4. Coach Personality
    diagnostics.push(await runDiagnostic('Coach Personality', async () => {
      const settings = await getCoachSettings();
      const prompt = generatePersonalityPrompt(settings);
      return {
        success: true,
        message: `Persona: ${settings.selectedPersona || 'default'}`,
        details: `User: ${settings.userName || 'not set'}, Prompt: ${prompt?.length || 0} chars`
      };
    }));
    setResults([...diagnostics]);

    // 5. User Context
    diagnostics.push(await runDiagnostic('User Context Service', async () => {
      const context = await getContextForClaude();
      return {
        success: context.length > 0,
        message: `${context.length} chars of context`,
        details: context.slice(0, 150) + '...'
      };
    }));
    setResults([...diagnostics]);

    // 6. Life Context
    diagnostics.push(await runDiagnostic('Life Context Service', async () => {
      const context = await getLifeContextForClaude();
      return {
        success: true,
        message: context ? `${context.length} chars` : 'No life context yet',
        details: context ? context.slice(0, 150) + '...' : 'Add life events to populate'
      };
    }));
    setResults([...diagnostics]);

    // 7. HealthKit
    diagnostics.push(await runDiagnostic('HealthKit Integration', async () => {
      const enabled = await isHealthKitEnabled();
      if (!enabled) {
        return { success: true, message: 'Not enabled', details: 'Enable in Settings to use health data' };
      }
      const context = await getHealthContextForClaude();
      return {
        success: true,
        message: `Enabled - ${context.length} chars`,
        details: context.slice(0, 150) + '...'
      };
    }));
    setResults([...diagnostics]);

    // 8. Health Correlations
    diagnostics.push(await runDiagnostic('Health Correlations', async () => {
      const context = await getCorrelationSummaryForClaude();
      return {
        success: true,
        message: context ? `${context.length} chars` : 'No correlations yet',
        details: context ? context.slice(0, 150) + '...' : 'Use the app more to build correlations'
      };
    }));
    setResults([...diagnostics]);

    // 9. Psych Analysis
    diagnostics.push(await runDiagnostic('Psychological Profile', async () => {
      const context = await psychAnalysisService.getCompressedContext();
      return {
        success: true,
        message: context ? `${context.length} chars` : 'No profile yet',
        details: context ? context.slice(0, 150) + '...' : 'Profile builds over time'
      };
    }));
    setResults([...diagnostics]);

    // 10. Chronotype
    diagnostics.push(await runDiagnostic('Chronotype Context', async () => {
      const context = await getChronotypeContextForClaude();
      return {
        success: true,
        message: context ? `${context.length} chars` : 'Default chronotype',
        details: context ? context.slice(0, 150) + '...' : 'Set in Coach Settings'
      };
    }));
    setResults([...diagnostics]);

    // 11. Quick Logs
    diagnostics.push(await runDiagnostic('Quick Logs (Twigs)', async () => {
      const context = await getDetailedLogsContextForClaude();
      return {
        success: true,
        message: context ? `${context.length} chars` : 'No logs yet',
        details: context ? context.slice(0, 150) + '...' : 'Log twigs to populate'
      };
    }));
    setResults([...diagnostics]);

    // 12. Lifestyle Factors
    diagnostics.push(await runDiagnostic('Lifestyle Factors', async () => {
      const context = await getLifestyleFactorsContextForClaude();
      return {
        success: true,
        message: context ? `${context.length} chars` : 'No patterns yet',
        details: context ? context.slice(0, 150) + '...' : 'Patterns emerge over time'
      };
    }));
    setResults([...diagnostics]);

    // 13. Exposure Ladder
    diagnostics.push(await runDiagnostic('Exposure Ladder', async () => {
      const context = await getExposureContextForClaude();
      return {
        success: true,
        message: context ? `${context.length} chars` : 'Not started',
        details: context ? context.slice(0, 150) + '...' : 'Start exposure exercises to track'
      };
    }));
    setResults([...diagnostics]);

    // 14. Journal Context
    diagnostics.push(await runDiagnostic('Recent Journals', async () => {
      const context = await getRecentJournalContextForClaude();
      return {
        success: true,
        message: context ? `${context.length} chars` : 'No entries yet',
        details: context ? context.slice(0, 150) + '...' : 'Write journal entries to populate'
      };
    }));
    setResults([...diagnostics]);

    // 15. Calendar
    diagnostics.push(await runDiagnostic('Calendar Integration', async () => {
      const enabled = await isCalendarEnabled();
      if (!enabled) {
        return { success: true, message: 'Not enabled', details: 'Enable in Settings for calendar awareness' };
      }
      const context = await getCalendarContextForClaude();
      return {
        success: true,
        message: `Enabled - ${context?.length || 0} chars`,
        details: context ? context.slice(0, 150) + '...' : 'No upcoming events'
      };
    }));
    setResults([...diagnostics]);

    // 16. Memory Tiers
    diagnostics.push(await runDiagnostic('Memory System', async () => {
      const context = await getMemoryContextForLLM();
      return {
        success: true,
        message: context ? `${context.length} chars` : 'No memories yet',
        details: context ? context.slice(0, 150) + '...' : 'Memories build through conversations'
      };
    }));
    setResults([...diagnostics]);

    // 17. Cognitive Profile
    diagnostics.push(await runDiagnostic('Cognitive Profile', async () => {
      const context = await getCognitiveProfileContextForLLM();
      return {
        success: true,
        message: context ? `${context.length} chars` : 'Not set up',
        details: context ? context.slice(0, 150) + '...' : 'Complete onboarding to set up'
      };
    }));
    setResults([...diagnostics]);

    // 18. Social Connection
    diagnostics.push(await runDiagnostic('Social Connection Health', async () => {
      const context = await getConnectionContextForLLM();
      return {
        success: true,
        message: context ? `${context.length} chars` : 'No data yet',
        details: context ? context.slice(0, 150) + '...' : 'Track social interactions to populate'
      };
    }));
    setResults([...diagnostics]);

    // 19. Core Principle Kernel
    diagnostics.push(await runDiagnostic('Core Principle Kernel', async () => {
      const context = getPrincipleContextForLLM();
      return {
        success: context.length > 0,
        message: `${context.length} chars - ACTIVE`,
        details: 'Safety principles enforced in all responses'
      };
    }));
    setResults([...diagnostics]);

    // 20. Achievement System
    diagnostics.push(await runDiagnostic('Achievement System', async () => {
      const shouldGlow = await shouldCoachGlow();
      const celebration = shouldGlow ? await getNextCelebration() : null;
      return {
        success: true,
        message: shouldGlow ? `Pending celebration: ${celebration?.title}` : 'No pending celebrations',
        details: 'Achievement tracking operational'
      };
    }));
    setResults([...diagnostics]);

    // 21. Accountability System
    diagnostics.push(await runDiagnostic('Accountability System', async () => {
      const context = await getAccountabilityContextForCoach();
      return {
        success: true,
        message: context ? `${context.length} chars` : 'No limits set',
        details: context ? context.slice(0, 150) + '...' : 'Set twig limits to enable accountability'
      };
    }));
    setResults([...diagnostics]);

    // 22. Coach Mode
    diagnostics.push(await runDiagnostic('Coach Mode (Skills)', async () => {
      const prompt = await getCoachModeSystemPrompt();
      return {
        success: true,
        message: prompt ? `${prompt.length} chars` : 'No active skill mode',
        details: prompt ? prompt.slice(0, 150) + '...' : 'Activate skills to add coaching modes'
      };
    }));
    setResults([...diagnostics]);

    // 23. Aliveness Service
    diagnostics.push(await runDiagnostic('Aliveness Service', async () => {
      const settings = await getAlivenessSettings();
      const qualities = await getAlivenessQualities();
      const enabledCount = qualities.filter(q => q.enabled).length;
      const context = await getAlivenessContextForLLM();

      // Test adaptive detection
      const testSignals = detectUserAlivenessSignals('This is a test message!');
      const testDirective = await getAlivenessDirectiveForLLM(testSignals);

      return {
        success: settings.enabled,
        message: settings.enabled
          ? `Enabled - ${enabledCount}/${qualities.length} qualities active`
          : 'Disabled',
        details: settings.adaptiveResponseEnabled
          ? `Adaptive: ON | Audio: ${settings.audioAnalysisEnabled ? 'ON' : 'OFF'} | Intensity: ${settings.intensityLevel} | Context: ${context.length} chars`
          : 'Adaptive response disabled'
      };
    }));
    setResults([...diagnostics]);

    // Generate summary
    const successCount = diagnostics.filter(d => d.status === 'success').length;
    const warningCount = diagnostics.filter(d => d.status === 'warning').length;
    const errorCount = diagnostics.filter(d => d.status === 'error').length;
    const totalTime = diagnostics.reduce((sum, d) => sum + (d.duration || 0), 0);

    setSummary(`✅ ${successCount} passed, ⚠️ ${warningCount} warnings, ❌ ${errorCount} errors | ${totalTime}ms total`);
    setIsRunning(false);
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'running': return '⏳';
      default: return '⏸️';
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      default: return colors.textMuted;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Coach Diagnostics
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Run Button */}
        <TouchableOpacity
          style={[styles.runButton, { backgroundColor: colors.tint }]}
          onPress={runAllDiagnostics}
          disabled={isRunning}
        >
          {isRunning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.runButtonText}>Run All Diagnostics</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Summary */}
        {summary && (
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.summaryText, { color: colors.text }]}>{summary}</Text>
          </View>
        )}

        {/* Results */}
        {results.map((result, index) => (
          <View key={index} style={[styles.resultCard, { backgroundColor: colors.card }]}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultIcon}>{getStatusIcon(result.status)}</Text>
              <Text style={[styles.resultName, { color: colors.text }]}>{result.name}</Text>
              {result.duration && (
                <Text style={[styles.resultDuration, { color: colors.textMuted }]}>
                  {result.duration}ms
                </Text>
              )}
            </View>
            <Text style={[styles.resultMessage, { color: getStatusColor(result.status) }]}>
              {result.message}
            </Text>
            {result.details && (
              <Text style={[styles.resultDetails, { color: colors.textSecondary }]}>
                {result.details}
              </Text>
            )}
          </View>
        ))}

        {/* Instructions */}
        {results.length === 0 && (
          <View style={[styles.instructionsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.instructionsTitle, { color: colors.text }]}>
              What This Tests
            </Text>
            <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
              This diagnostic tool checks all 24 services that the Coach uses to provide personalized responses:
              {'\n\n'}
              • AI Data Access Registry (what data Coach can see){'\n'}
              • API connectivity & authentication{'\n'}
              • Safety & safeguard systems{'\n'}
              • Personality & tone configuration{'\n'}
              • User context & life events{'\n'}
              • Health & calendar integrations{'\n'}
              • Memory & cognitive profile{'\n'}
              • Achievement & accountability systems{'\n'}
              • Aliveness (adaptive communication style){'\n'}
              • Core Principle Kernel (safety rules)
              {'\n\n'}
              If any test fails, the Coach may not respond correctly.
            </Text>
          </View>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  runButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  resultCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  resultDuration: {
    fontSize: 12,
  },
  resultMessage: {
    fontSize: 13,
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    lineHeight: 16,
  },
  instructionsCard: {
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
