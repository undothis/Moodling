/**
 * Simulator Mode Screen
 *
 * AI Adaptation Verification system for testing whether
 * AI services are functioning correctly, adapting over time,
 * and accurately referencing data.
 *
 * Features:
 * - On/Off toggle with active timer
 * - Global Test button
 * - Per-service tests
 * - Reference Challenge generator (with "well" to copy prompts)
 * - Diagnostic Report generator
 * - Failure logs viewer
 */

import { useState, useCallback, useEffect, useRef } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const SIMULATOR_ACTIVATED_AT_KEY = '@moodling/simulator_activated_at';
const SIMULATOR_CHALLENGE_KEY = '@moodling/simulator_challenge';
const SIMULATOR_AI_RESPONSE_KEY = '@moodling/simulator_ai_response';

// Cross-platform clipboard helper (no external dependency required)
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
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

// Import service functions
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
  getVerificationContext,
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

  // Error state for debugging
  const [lastError, setLastError] = useState<string | null>(null);

  // Active timer state
  const [activatedAt, setActivatedAt] = useState<Date | null>(null);
  const [activeTime, setActiveTime] = useState<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Challenge well state
  const [currentChallenge, setCurrentChallenge] = useState<VerificationPrompt | null>(null);
  const [challengePrompt, setChallengePrompt] = useState('');
  const [expectedData, setExpectedData] = useState('');
  const [showChallengeCategories, setShowChallengeCategories] = useState(false);

  // Response verification state
  const [aiResponse, setAiResponse] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    passed: boolean;
    issues: string[];
    positives: string[];
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Diagnostic report state
  const [diagnosticReport, setDiagnosticReport] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Format active time
  const formatActiveTime = (startDate: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const hours = Math.floor(diffSec / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Start/stop timer
  useEffect(() => {
    if (enabled && activatedAt) {
      // Update immediately
      setActiveTime(formatActiveTime(activatedAt));

      // Start interval
      timerRef.current = setInterval(() => {
        setActiveTime(formatActiveTime(activatedAt));
      }, 1000);
    } else {
      setActiveTime('');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enabled, activatedAt]);

  // Load state when screen is focused
  const loadState = useCallback(async () => {
    try {
      setIsLoading(true);
      setLastError(null);

      // Load enabled state directly from AsyncStorage as backup check
      const storedEnabled = await AsyncStorage.getItem('@moodling/simulator_mode_enabled');
      const isEnabled = storedEnabled === 'true';
      setEnabled(isEnabled);

      // Load activation time
      const storedActivatedAt = await AsyncStorage.getItem(SIMULATOR_ACTIVATED_AT_KEY);
      if (storedActivatedAt && isEnabled) {
        setActivatedAt(new Date(storedActivatedAt));
      } else if (!isEnabled) {
        setActivatedAt(null);
      }

      // Load persisted challenge state
      const storedChallenge = await AsyncStorage.getItem(SIMULATOR_CHALLENGE_KEY);
      if (storedChallenge) {
        try {
          const parsed = JSON.parse(storedChallenge);
          if (parsed.challenge) setCurrentChallenge(parsed.challenge);
          if (parsed.prompt) setChallengePrompt(parsed.prompt);
          if (parsed.expectedData) setExpectedData(parsed.expectedData);
        } catch (e) {
          console.error('[Simulator] Failed to parse challenge state:', e);
        }
      }

      // Load persisted AI response
      const storedResponse = await AsyncStorage.getItem(SIMULATOR_AI_RESPONSE_KEY);
      if (storedResponse) {
        setAiResponse(storedResponse);
      }

      // Load state from service
      const [state, logs, summary] = await Promise.all([
        getSimulatorState().catch(e => {
          console.error('[Simulator] getSimulatorState error:', e);
          return null;
        }),
        getFailureLogs().catch(e => {
          console.error('[Simulator] getFailureLogs error:', e);
          return [];
        }),
        getDataSummary().catch(e => {
          console.error('[Simulator] getDataSummary error:', e);
          return null;
        }),
      ]);

      if (state) {
        setLastGlobalResult(state.lastGlobalResult);
        setServiceResults(state.serviceResults as Record<string, ServiceTestResult>);
      }
      setFailureLogs(logs);
      setDataSummary(summary);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Simulator] Failed to load state:', errorMsg);
      setLastError(`Load error: ${errorMsg}`);
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
    const previousActivatedAt = activatedAt;

    // Optimistic update
    setEnabled(value);
    setLastError(null);

    if (value) {
      const now = new Date();
      setActivatedAt(now);
      try {
        await AsyncStorage.setItem(SIMULATOR_ACTIVATED_AT_KEY, now.toISOString());
      } catch (e) {
        console.error('[Simulator] Failed to save activation time:', e);
      }
    } else {
      setActivatedAt(null);
      try {
        await AsyncStorage.removeItem(SIMULATOR_ACTIVATED_AT_KEY);
      } catch (e) {
        console.error('[Simulator] Failed to remove activation time:', e);
      }
    }

    try {
      await setSimulatorEnabled(value);
      console.log('[Simulator] Mode set to:', value);

      // Verify it was saved
      const verify = await AsyncStorage.getItem('@moodling/simulator_mode_enabled');
      console.log('[Simulator] Verified storage value:', verify);

      if ((verify === 'true') !== value) {
        throw new Error('Storage verification failed');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Simulator] Failed to save enabled state:', errorMsg);
      setLastError(`Toggle error: ${errorMsg}`);

      // Revert on failure
      setEnabled(previousValue);
      setActivatedAt(previousActivatedAt);

      if (Platform.OS === 'web') {
        window.alert(`Failed to save setting: ${errorMsg}`);
      } else {
        Alert.alert('Error', `Failed to save setting: ${errorMsg}`);
      }
    }
  };

  // Run global test
  const handleGlobalTest = async () => {
    setIsTesting(true);
    setLastError(null);
    try {
      console.log('[Simulator] Starting global test...');
      const result = await runGlobalTest();
      console.log('[Simulator] Global test result:', result);

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
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Simulator] Global test failed:', errorMsg);
      setLastError(`Test error: ${errorMsg}`);

      if (Platform.OS === 'web') {
        window.alert(`Test failed: ${errorMsg}`);
      } else {
        Alert.alert('Error', `Test failed: ${errorMsg}`);
      }
    } finally {
      setIsTesting(false);
    }
  };

  // Run single service test
  const handleServiceTest = async (service: AIServiceType) => {
    setIsTesting(true);
    setLastError(null);
    try {
      console.log(`[Simulator] Testing service: ${service}`);
      const result = await runServiceTest(service);
      console.log(`[Simulator] Service test result:`, result);

      setServiceResults(prev => ({ ...prev, [service]: result }));
      setFailureLogs(await getFailureLogs());

      if (Platform.OS === 'web') {
        window.alert(`${service}: ${result.passed ? 'PASS' : 'FAIL'} (${result.overallScore}/100)`);
      } else {
        Alert.alert(
          result.passed ? 'Pass' : 'Fail',
          `${service}: ${result.overallScore}/100`
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Simulator] Test for ${service} failed:`, errorMsg);
      setLastError(`${service} test error: ${errorMsg}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Generate random challenge
  const handleRandomChallenge = async () => {
    setLastError(null);
    handleNewChallenge(); // Clear previous verification state
    try {
      console.log('[Simulator] Generating random challenge...');
      const result = await generateChallengeForChat();
      console.log('[Simulator] Challenge generated:', result);

      setCurrentChallenge(result.challenge);
      setChallengePrompt(result.prefilledPrompt);
      setExpectedData(result.expectedData);
      setShowChallengeCategories(false);

      // Persist challenge state
      await AsyncStorage.setItem(SIMULATOR_CHALLENGE_KEY, JSON.stringify({
        challenge: result.challenge,
        prompt: result.prefilledPrompt,
        expectedData: result.expectedData,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Simulator] Failed to generate challenge:', errorMsg);
      setLastError(`Challenge error: ${errorMsg}`);
    }
  };

  // Generate category-specific challenge
  const handleCategoryChallenge = async (category: string) => {
    setLastError(null);
    handleNewChallenge(); // Clear previous verification state
    try {
      const result = await generateChallengeByCategory(category as VerificationPrompt['category']);
      if (result.challenge) {
        setCurrentChallenge(result.challenge);
        setChallengePrompt(result.prefilledPrompt);
        setExpectedData(result.expectedData);

        // Persist challenge state
        await AsyncStorage.setItem(SIMULATOR_CHALLENGE_KEY, JSON.stringify({
          challenge: result.challenge,
          prompt: result.prefilledPrompt,
          expectedData: result.expectedData,
        }));
      }
      setShowChallengeCategories(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Simulator] Failed to generate category challenge:', errorMsg);
      setLastError(`Category challenge error: ${errorMsg}`);
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

  // Verify AI response against expected data
  const handleVerifyResponse = async () => {
    if (!aiResponse.trim() || !currentChallenge) {
      if (Platform.OS === 'web') {
        window.alert('Please paste the AI response first.');
      } else {
        Alert.alert('Missing Response', 'Please paste the AI response first.');
      }
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const issues: string[] = [];
      const positives: string[] = [];
      const responseLower = aiResponse.toLowerCase();

      // Fetch REAL user data for verification
      const realData = await getVerificationContext();
      console.log('[Simulator] Verification context:', realData);

      // === CHECK 1: Does AI reference ACTUAL journal content? ===
      if (realData.todayJournalPreviews.length > 0) {
        let foundJournalRefs = 0;
        for (const preview of realData.todayJournalPreviews) {
          // Check if any significant words from the journal appear
          const significantWords = preview.toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 4); // Words longer than 4 chars
          for (const word of significantWords) {
            if (responseLower.includes(word)) {
              foundJournalRefs++;
              break; // Count each journal only once
            }
          }
        }
        if (foundJournalRefs > 0) {
          positives.push(`Referenced content from ${foundJournalRefs} of ${realData.todayJournalPreviews.length} today's journals`);
        } else if (currentChallenge.category === 'data_accuracy') {
          issues.push(`AI didn't reference any specific content from today's ${realData.todayJournalCount} journals`);
        }
      }

      // === CHECK 2: Does AI reference ACTUAL life events/people from compression? ===
      if (realData.lifeContextKeywords.length > 0) {
        const referencedKeywords: string[] = [];
        for (const keyword of realData.lifeContextKeywords) {
          if (responseLower.includes(keyword.toLowerCase())) {
            referencedKeywords.push(keyword);
          }
        }
        if (referencedKeywords.length > 0) {
          positives.push(`Referenced life context: ${referencedKeywords.slice(0, 5).join(', ')}`);
        } else if (currentChallenge.category === 'cross_domain' || currentChallenge.category === 'long_term_correlation') {
          issues.push(`AI didn't reference known life context (${realData.lifeContextKeywords.slice(0, 3).join(', ')}...)`);
        }
      }

      // === CHECK 2B: Check full life context for specific references ===
      if (realData.lifeContextFull && realData.lifeContextFull.length > 50) {
        // Extract specific phrases from life context (e.g., "broke up with girlfriend")
        const lifeEvents: string[] = [];
        const eventPatterns = [
          /broke up with (\w+)/gi,
          /started (\w+)/gi,
          /quit (\w+)/gi,
          /got a (\w+)/gi,
          /feeling (\w+)/gi,
        ];
        for (const pattern of eventPatterns) {
          const matches = realData.lifeContextFull.match(pattern);
          if (matches) lifeEvents.push(...matches);
        }

        let foundLifeRef = false;
        for (const event of lifeEvents) {
          const eventWords = event.toLowerCase().split(/\s+/).filter(w => w.length > 3);
          for (const word of eventWords) {
            if (responseLower.includes(word)) {
              foundLifeRef = true;
              break;
            }
          }
          if (foundLifeRef) break;
        }
        if (foundLifeRef) {
          positives.push('Referenced specific life events from compression');
        }
      }

      // === CHECK 2C: Check psych profile references ===
      if (realData.psychProfileFull && realData.psychProfileFull.length > 30) {
        const psychWords = realData.psychProfileFull.toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 5 && !['profile', 'established', 'psychological'].includes(w));

        let foundPsychRef = false;
        for (const word of psychWords) {
          if (responseLower.includes(word)) {
            foundPsychRef = true;
            positives.push(`Referenced psych profile element: "${word}"`);
            break;
          }
        }
      }

      // === CHECK 3: Correct counts? ===
      if (currentChallenge.category === 'data_accuracy') {
        // Check journal count
        if (realData.todayJournalCount > 0) {
          const countStr = realData.todayJournalCount.toString();
          if (responseLower.includes(countStr) || responseLower.includes(numberToWord(realData.todayJournalCount))) {
            positives.push(`Correctly stated journal count: ${realData.todayJournalCount}`);
          } else if (responseLower.match(/\d+.*journal/)) {
            issues.push(`Expected ${realData.todayJournalCount} journals today, AI may have stated different number`);
          }
        }

        // Check twig count
        if (realData.todayTwigCount > 0) {
          const twigCountStr = realData.todayTwigCount.toString();
          if (responseLower.includes(twigCountStr) || responseLower.includes(numberToWord(realData.todayTwigCount))) {
            positives.push(`Correctly stated twig count: ${realData.todayTwigCount}`);
          }
        }
      }

      // === CHECK 4: References recent moods/emotions from journals? ===
      const recentMoods = realData.recentJournals.map(j => j.mood).filter(Boolean);
      const uniqueMoods = [...new Set(recentMoods)];
      const moodKeywords: Record<string, string[]> = {
        'very_negative': ['angry', 'furious', 'devastated', 'hopeless', 'miserable'],
        'negative': ['sad', 'anxious', 'nervous', 'worried', 'upset', 'frustrated'],
        'neutral': ['okay', 'fine', 'neutral', 'meh'],
        'positive': ['good', 'happy', 'content', 'pleased'],
        'very_positive': ['great', 'amazing', 'wonderful', 'excited', 'joyful']
      };

      let foundMoodRef = false;
      for (const mood of uniqueMoods) {
        const keywords = moodKeywords[mood] || [];
        for (const kw of keywords) {
          if (responseLower.includes(kw)) {
            foundMoodRef = true;
            break;
          }
        }
        if (foundMoodRef) break;
      }
      if (foundMoodRef) {
        positives.push('Referenced emotional themes from recent entries');
      }

      // === CHECK 5: Mental health safety - no sad emojis ===
      const sadEmojis = ['😔', '😢', '😭', '💔', '😞', '😿', '😥'];
      const hasSadEmoji = sadEmojis.some(e => aiResponse.includes(e));
      if (hasSadEmoji) {
        issues.push('Contains sad emojis (violates mental health safety)');
      } else if (currentChallenge.category === 'mental_health_framing') {
        positives.push('No sad emojis used');
      }

      // === CHECK 6: Negative framing check ===
      const negativePatterns = [
        'you failed', 'you didn\'t', 'you never', 'you always fail',
        'hopeless', 'worthless', 'you\'re bad at'
      ];
      const hasNegativeFraming = negativePatterns.some(p => responseLower.includes(p));
      if (hasNegativeFraming) {
        issues.push('Contains negative/critical framing language');
      } else if (currentChallenge.category === 'mental_health_framing') {
        positives.push('Uses supportive, non-judgmental language');
      }

      // === CHECK 7: Does it show generic vs specific? ===
      // First, check if we already found actual data references in positives
      const hasActualDataRefs = positives.some(p =>
        p.includes('Referenced content from') ||
        p.includes('Referenced life context') ||
        p.includes('Referenced specific life events') ||
        p.includes('Referenced psych profile') ||
        p.includes('Referenced emotional themes') ||
        p.includes('Correctly stated')
      );

      const genericPhrases = [
        'i see you\'ve been', 'it looks like', 'it seems like',
        'based on what i can see', 'from what you\'ve shared'
      ];
      const specificPhrases = [
        'you wrote', 'you mentioned', 'in your entry', 'you said',
        'your journal from', 'on monday', 'on tuesday', 'yesterday'
      ];
      const hasGeneric = genericPhrases.some(p => responseLower.includes(p));
      const hasSpecific = specificPhrases.some(p => responseLower.includes(p));

      if (hasSpecific) {
        positives.push('Used specific references to user\'s data');
      } else if (hasGeneric && !hasSpecific && !hasActualDataRefs) {
        // Only flag as generic if we haven't found actual data references
        issues.push('Response is generic - lacks specific data references');
      }

      // Default if no checks triggered
      if (positives.length === 0 && issues.length === 0) {
        positives.push('Response received - manual review recommended');
      }

      const passed = issues.length === 0;

      setVerificationResult({ passed, issues, positives });

      // Log the result
      console.log('[Simulator] Verification result:', { passed, issues, positives });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Simulator] Verification error:', errorMsg);
      setLastError(`Verification error: ${errorMsg}`);
    } finally {
      setIsVerifying(false);
    }
  };

  // Helper: Convert number to word for checking
  const numberToWord = (n: number): string => {
    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    return words[n] || n.toString();
  };

  // Clear verification state when challenge changes
  const handleNewChallenge = async () => {
    setAiResponse('');
    setVerificationResult(null);
    // Clear persisted AI response
    await AsyncStorage.removeItem(SIMULATOR_AI_RESPONSE_KEY);
  };

  // Save AI response as it changes
  const handleAiResponseChange = async (text: string) => {
    setAiResponse(text);
    // Persist AI response (debounce could be added here for optimization)
    if (text.trim()) {
      await AsyncStorage.setItem(SIMULATOR_AI_RESPONSE_KEY, text);
    } else {
      await AsyncStorage.removeItem(SIMULATOR_AI_RESPONSE_KEY);
    }
  };

  // Generate diagnostic report
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setLastError(null);
    try {
      console.log('[Simulator] Generating diagnostic report...');
      const report = await generateDiagnosticReport();
      console.log('[Simulator] Report generated, length:', report.length);
      setDiagnosticReport(report);
      setShowReport(true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Simulator] Failed to generate report:', errorMsg);
      setLastError(`Report error: ${errorMsg}`);
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
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          Loading Simulator...
        </Text>
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

      {/* Error Display */}
      {lastError && (
        <View style={[styles.errorBox, { backgroundColor: '#FFEBEE' }]}>
          <Text style={styles.errorText}>{lastError}</Text>
        </View>
      )}

      {/* Enable Toggle with Active Timer */}
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

        {/* Active Timer Visualization */}
        {enabled && (
          <View style={[styles.activeIndicator, { backgroundColor: '#E8F5E9' }]}>
            <View style={styles.activeDot} />
            <View style={styles.activeInfo}>
              <Text style={styles.activeLabel}>ACTIVE</Text>
              <Text style={styles.activeTime}>{activeTime || 'Starting...'}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Data Summary */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Data Available
        </Text>
        {dataSummary ? (
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
        ) : (
          <Text style={[styles.noDataText, { color: colors.textMuted }]}>
            Unable to load data summary
          </Text>
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

            {/* Response Verification Section */}
            <View style={[styles.verifySection, { borderTopColor: colors.border }]}>
              <Text style={[styles.verifyLabel, { color: colors.text }]}>
                Step 2: Paste AI Response
              </Text>
              <Text style={[styles.verifyHint, { color: colors.textMuted }]}>
                After asking the challenge in chat, paste the AI's response here to verify accuracy.
              </Text>

              <TextInput
                style={[styles.responseInput, {
                  color: colors.text,
                  backgroundColor: colors.card,
                  borderColor: colors.border
                }]}
                value={aiResponse}
                onChangeText={handleAiResponseChange}
                placeholder="Paste AI response here..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={6}
              />

              <TouchableOpacity
                style={[styles.verifyButton, {
                  backgroundColor: aiResponse.trim() ? '#2196F3' : colors.border
                }]}
                onPress={handleVerifyResponse}
                disabled={!aiResponse.trim() || isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.verifyButtonText}>Verify Response</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Verification Results */}
              {verificationResult && (
                <View style={[styles.verifyResults, {
                  backgroundColor: verificationResult.passed ? '#E8F5E9' : '#FFEBEE'
                }]}>
                  <View style={styles.verifyResultHeader}>
                    <Ionicons
                      name={verificationResult.passed ? 'checkmark-circle' : 'alert-circle'}
                      size={24}
                      color={verificationResult.passed ? '#4CAF50' : '#F44336'}
                    />
                    <Text style={[styles.verifyResultTitle, {
                      color: verificationResult.passed ? '#2E7D32' : '#C62828'
                    }]}>
                      {verificationResult.passed ? 'VERIFICATION PASSED' : 'ISSUES DETECTED'}
                    </Text>
                  </View>

                  {verificationResult.positives.length > 0 && (
                    <View style={styles.verifyList}>
                      <Text style={[styles.verifyListTitle, { color: '#2E7D32' }]}>
                        Positives:
                      </Text>
                      {verificationResult.positives.map((item, i) => (
                        <Text key={i} style={[styles.verifyListItem, { color: '#1B5E20' }]}>
                          ✓ {item}
                        </Text>
                      ))}
                    </View>
                  )}

                  {verificationResult.issues.length > 0 && (
                    <View style={styles.verifyList}>
                      <Text style={[styles.verifyListTitle, { color: '#C62828' }]}>
                        Issues:
                      </Text>
                      {verificationResult.issues.map((item, i) => (
                        <Text key={i} style={[styles.verifyListItem, { color: '#B71C1C' }]}>
                          ✗ {item}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
  errorBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#C62828',
    fontSize: 13,
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
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
  },
  activeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 10,
  },
  activeInfo: {
    flex: 1,
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: 1,
  },
  activeTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
    marginTop: 2,
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
  noDataText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
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
  // Verification styles
  verifySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  verifyLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  verifyHint: {
    fontSize: 13,
    marginBottom: 12,
  },
  responseInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  verifyResults: {
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
  },
  verifyResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  verifyResultTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  verifyList: {
    marginTop: 8,
  },
  verifyListTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  verifyListItem: {
    fontSize: 13,
    lineHeight: 20,
    marginLeft: 4,
  },
});
