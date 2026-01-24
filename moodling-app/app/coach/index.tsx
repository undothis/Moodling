import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  VoiceChatController,
  VoiceState,
  getVoiceStateIcon,
  getVoiceStateLabel,
  isVoiceChatSupported,
  getVoiceSettings,
} from '@/services/voiceChatService';
import {
  sendMessage,
  hasAPIKey,
  ChatMessage,
  ConversationContext,
  AIResponse,
  getFallbackResponse,
} from '@/services/claudeAPIService';
import { getTonePreferences, ToneStyle } from '@/services/tonePreferencesService';
import {
  getCoachSettings,
  getCoachDisplayName,
  getCoachEmoji,
  CoachSettings,
  CoachPersona,
  PERSONAS,
} from '@/services/coachPersonalityService';
import {
  isSlashCommand,
  executeCommand,
  CommandContext,
  CommandResult,
  initializeSlashCommands,
} from '@/services/slashCommandService';
import {
  getTTSSettings,
  speakCoachResponse,
  stopAudio,
  initializeTTS,
} from '@/services/textToSpeechService';
import {
  COACH_MODE_SKILLS,
  CoachModeConfig,
  getActiveCoachModes,
  activateSessionMode,
  deactivateSessionMode,
  isModeActive,
  isPersistentMode,
  togglePersistentMode,
} from '@/services/coachModeService';
import { BreathingBall, BreathingPattern } from '@/components/BreathingBall';
import { SkillOverlay, parseSkillTrigger, isOverlaySkill } from '@/components/SkillOverlay';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateProfileReveal } from '@/services/cognitiveProfileService';
import { startTour, isTourActive, subscribeTourState, resetTour } from '@/services/guidedTourService';

// Initialize slash commands on module load
initializeSlashCommands();

/**
 * Coaching Conversation Screen
 *
 * Following Mood Leaf Ethics:
 * - Transparent about AI source
 * - Anti-dependency nudges
 * - Never diagnostic
 * - Encourage real-world connection
 *
 * Unit 19: Coaching Conversation UI
 */

type MessageSource = 'user' | 'claudeAPI' | 'fallback' | 'crisis' | 'system' | 'command';

interface DisplayMessage {
  id: string;
  text: string;
  source: MessageSource;
  timestamp: Date;
  isTyping?: boolean;
}

const WELCOME_MESSAGE: DisplayMessage = {
  id: 'welcome',
  text: "Hi! I'm here to chat whenever you need. What's on your mind?\n\n💡 If you ever need help with the app or want a walkthrough, just ask!",
  source: 'fallback',
  timestamp: new Date(),
};

const FIRST_TIME_WELCOME: DisplayMessage = {
  id: 'first-time-welcome',
  text: "Welcome! 🌿 You've completed your profile - I'm excited to get to know you better.\n\nWould you like a quick walkthrough of how everything works, or should I tell you about your unique MoodPrint first?",
  source: 'system',
  timestamp: new Date(),
};

const MAX_TURNS_BEFORE_NUDGE = 10;
const FIRST_TIME_COACH_KEY = 'moodleaf_first_time_coach_complete';

export default function CoachScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { context: entryContext } = useLocalSearchParams<{ context?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  // Custom welcome message if coming from an entry
  const getWelcomeMessage = (): DisplayMessage => {
    if (entryContext) {
      return {
        id: 'welcome',
        text: "I see you wanted to talk about something you journaled. I'm here to listen — what's on your mind about it?",
        source: 'fallback',
        timestamp: new Date(),
      };
    }
    return WELCOME_MESSAGE;
  };

  const [messages, setMessages] = useState<DisplayMessage[]>([getWelcomeMessage()]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [toneStyles, setToneStyles] = useState<ToneStyle[]>(['balanced']);
  const [turnCount, setTurnCount] = useState(0);
  const [additionalContext, setAdditionalContext] = useState<string | undefined>(entryContext);

  // Coach persona info
  const [coachName, setCoachName] = useState('Your Guide');
  const [coachEmoji, setCoachEmoji] = useState('🌿');
  const [coachSettings, setCoachSettings] = useState<CoachSettings | null>(null);

  // First-time onboarding flow state
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Voice chat state
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [silenceProgress, setSilenceProgress] = useState(0);
  const [autoSendEnabled, setAutoSendEnabled] = useState(true); // Toggle for auto-send on pause
  const [continuousVoiceMode, setContinuousVoiceMode] = useState(false); // Continuous conversation mode
  const voiceControllerRef = useRef<VoiceChatController | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Ref to hold latest send handler (avoids stale closure in voice callback)
  const sendHandlerRef = useRef<(text: string) => Promise<void>>();

  // TTS state
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Coach modes state
  const [showModesSheet, setShowModesSheet] = useState(false);
  const [activeModes, setActiveModes] = useState<string[]>([]);
  const [modesPersistent, setModesPersistent] = useState<Record<string, boolean>>({});

  // Breathing ball state
  const [showBreathingBall, setShowBreathingBall] = useState(false);
  const [breathingPattern, setBreathingPattern] = useState<BreathingPattern>('box');

  // Skill overlay state (for AI-triggered skills)
  const [showSkillOverlay, setShowSkillOverlay] = useState(false);
  const [activeSkillId, setActiveSkillId] = useState<string>('');
  const [skillCoachMessage, setSkillCoachMessage] = useState<string>('');

  // Guided tour state - just track if active for hiding prompt
  const [tourActive, setTourActive] = useState(false);

  // Subscribe to tour state changes (for hiding prompt during tour)
  useEffect(() => {
    const unsubscribe = subscribeTourState((state) => {
      setTourActive(state.isActive);
    });
    return unsubscribe;
  }, []);

  // Map mode IDs to breathing patterns
  const getBreathingPatternForMode = (modeId: string): BreathingPattern | null => {
    switch (modeId) {
      case 'box_breathing':
        return 'box';
      case '478_breathing':
        return '478';
      case 'physiological_sigh':
        return 'sigh';
      default:
        return null;
    }
  };

  // Load active coach modes
  const loadActiveModes = useCallback(async () => {
    const modes = await getActiveCoachModes();
    setActiveModes(modes);

    // Load persistent status for each mode
    const persistentStatus: Record<string, boolean> = {};
    for (const modeId of modes) {
      persistentStatus[modeId] = await isPersistentMode(modeId);
    }
    setModesPersistent(persistentStatus);

    // Check if any active mode uses breathing ball
    const breathingMode = modes.find(modeId => {
      const config = COACH_MODE_SKILLS[modeId];
      return config?.usesBreathingBall;
    });

    if (breathingMode) {
      const pattern = getBreathingPatternForMode(breathingMode);
      if (pattern) {
        setBreathingPattern(pattern);
        setShowBreathingBall(true);
      }
    } else {
      setShowBreathingBall(false);
    }
  }, []);

  // Load coach settings and API key on mount
  useEffect(() => {
    const checkSetup = async () => {
      const keyExists = await hasAPIKey();
      setHasKey(keyExists);

      // Check if this is the first time after completing onboarding
      const firstTimeComplete = await AsyncStorage.getItem(FIRST_TIME_COACH_KEY);
      if (!firstTimeComplete && !entryContext) {
        // First time in coach after onboarding - show welcome + profile automatically
        setIsFirstTime(true);
        await showFirstTimeContent();
      }

      // Initialize TTS
      await initializeTTS();
      const ttsSettings = await getTTSSettings();
      setTtsEnabled(ttsSettings.enabled && ttsSettings.autoPlay);

      const prefs = await getTonePreferences();
      setToneStyles(prefs.selectedStyles);

      // Load active coach modes
      await loadActiveModes();

      // Load coach persona
      const settings = await getCoachSettings();
      setCoachSettings(settings);
      setCoachName(getCoachDisplayName(settings));
      setCoachEmoji(getCoachEmoji(settings));

      // Initialize voice chat
      const supported = isVoiceChatSupported();
      setVoiceSupported(supported);

      if (supported) {
        const voiceSettings = await getVoiceSettings();
        setAutoSendEnabled(!voiceSettings.confirmBeforeSend);

        // Create voice controller with callbacks
        voiceControllerRef.current = new VoiceChatController({
          onTranscriptUpdate: (transcript, isFinal) => {
            setVoiceTranscript(transcript);
          },
          onMessageReady: (message) => {
            // Auto-send when pause detected (uses ref to avoid stale closure)
            if (message.trim() && sendHandlerRef.current) {
              // Fire and handle errors gracefully
              sendHandlerRef.current(message).catch((err) => {
                console.error('Voice send error:', err);
              });
            }
            setVoiceTranscript('');
          },
          onStateChange: (state) => {
            setVoiceState(state);
          },
          onError: (error) => {
            console.error('Voice error:', error);
            setVoiceState('idle');
          },
        });

        await voiceControllerRef.current.initialize();
      }
    };
    checkSetup();

    return () => {
      // Cleanup voice controller and TTS
      voiceControllerRef.current?.destroy();
      stopAudio();
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Pulse animation for voice button when listening
  useEffect(() => {
    if (voiceState === 'listening') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [voiceState, pulseAnim]);

  // Handle voice button press
  const handleVoicePress = async () => {
    if (!voiceControllerRef.current) return;

    if (voiceState === 'idle') {
      // Always enable continuous voice mode when starting voice
      setContinuousVoiceMode(true);
      // Update mode based on autoSendEnabled
      await voiceControllerRef.current.updateSettings({
        mode: autoSendEnabled ? 'auto_detect' : 'push_to_talk',
        confirmBeforeSend: !autoSendEnabled,
      });
      await voiceControllerRef.current.startListening();
    } else if (voiceState === 'listening') {
      // Tapping while listening stops continuous mode
      setContinuousVoiceMode(false);
      const transcript = await voiceControllerRef.current.stopListening();
      if (transcript.trim() && !autoSendEnabled) {
        // Manual mode: put transcript in input box for review
        setInputText(transcript);
      }
      setVoiceTranscript('');
    }
  };

  // Toggle auto-send mode
  const toggleAutoSend = async () => {
    const newValue = !autoSendEnabled;
    setAutoSendEnabled(newValue);
    if (voiceControllerRef.current) {
      await voiceControllerRef.current.updateSettings({
        mode: newValue ? 'auto_detect' : 'push_to_talk',
        confirmBeforeSend: !newValue,
      });
    }
  };

  const getSourceIcon = (source: MessageSource): string => {
    switch (source) {
      case 'claudeAPI':
        return '☁️';
      case 'fallback':
        return '💭';
      case 'crisis':
        return '💙';
      case 'system':
        return '🌿';
      case 'command':
        return '⚡';
      default:
        return '';
    }
  };

  const getSourceTooltip = (source: MessageSource): string => {
    switch (source) {
      case 'claudeAPI':
        return 'Uses coaching service';
      case 'fallback':
        return 'Pre-written response';
      case 'crisis':
        return 'Crisis resources';
      case 'system':
        return 'App message';
      case 'command':
        return 'Command response';
      default:
        return '';
    }
  };

  // Handle slash command results
  const handleCommandResult = async (result: CommandResult) => {
    switch (result.type) {
      case 'persona_switch':
        // Update coach display if persona changed
        if (result.newPersona) {
          const newPersonaDef = PERSONAS[result.newPersona];
          setCoachEmoji(newPersonaDef.emoji);
          setCoachName(newPersonaDef.name);
          // Reload settings
          const updatedSettings = await getCoachSettings();
          setCoachSettings(updatedSettings);
        }
        // Add response message
        setMessages((prev) => [
          ...prev,
          {
            id: `command-${Date.now()}`,
            text: result.message || 'Persona switched!',
            source: 'command',
            timestamp: new Date(),
          },
        ]);
        break;

      case 'message':
        setMessages((prev) => [
          ...prev,
          {
            id: `command-${Date.now()}`,
            text: result.message || '',
            source: 'command',
            timestamp: new Date(),
          },
        ]);
        break;

      case 'error':
        setMessages((prev) => [
          ...prev,
          {
            id: `command-error-${Date.now()}`,
            text: result.message || 'Something went wrong.',
            source: 'system',
            timestamp: new Date(),
          },
        ]);
        break;

      case 'navigation':
        if (result.navigateTo) {
          router.push(result.navigateTo as any);
        }
        break;

      case 'action':
        if (result.data?.action === 'clear_conversation') {
          setMessages([getWelcomeMessage()]);
          setTurnCount(0);
        }
        if (result.data?.action === 'show_modes_picker') {
          setShowModesSheet(true);
        }
        if (result.data?.action === 'start_tour') {
          // Start the guided tour via slash command
          handleStartTour();
        }
        if (result.data?.action === 'reset_tour') {
          // Reset tour so it can be taken again
          resetTour();
        }
        if (result.message) {
          setMessages((prev) => [
            ...prev,
            {
              id: `command-${Date.now()}`,
              text: result.message,
              source: 'command',
              timestamp: new Date(),
            },
          ]);
        }
        break;

      case 'menu':
        // For now, just show a message - we'll add bubble menu in Unit 5
        setMessages((prev) => [
          ...prev,
          {
            id: `command-${Date.now()}`,
            text: result.message || 'Menu opened',
            source: 'command',
            timestamp: new Date(),
          },
        ]);
        // TODO: Trigger skills bubble menu display
        break;

      case 'exercise':
        // For now, just show message - we'll add exercise player in Unit 6
        setMessages((prev) => [
          ...prev,
          {
            id: `command-${Date.now()}`,
            text: result.message || 'Starting exercise...',
            source: 'command',
            timestamp: new Date(),
          },
        ]);
        // TODO: Trigger exercise player
        break;
    }
  };

  // End phrases that stop continuous voice mode
  const END_PHRASES = ['bye', 'goodbye', 'good bye', 'see ya', 'see you', 'later', 'talk later', 'gotta go', 'i\'m done', 'that\'s all', 'thanks bye', 'thank you bye'];

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    // Check for end phrases to stop continuous voice mode
    const lowerMessage = messageText.toLowerCase().trim();
    const isEndPhrase = END_PHRASES.some(phrase =>
      lowerMessage === phrase ||
      lowerMessage.startsWith(phrase + ' ') ||
      lowerMessage.endsWith(' ' + phrase)
    );

    if (isEndPhrase && continuousVoiceMode) {
      setContinuousVoiceMode(false);
      // Stop any ongoing listening
      if (voiceControllerRef.current && voiceState === 'listening') {
        voiceControllerRef.current.stopListening();
      }
    }

    // Check if this is a slash command
    if (isSlashCommand(messageText)) {
      // Add user message showing the command
      const userMessage: DisplayMessage = {
        id: `user-${Date.now()}`,
        text: messageText,
        source: 'user',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputText('');

      // Build command context
      const commandContext: CommandContext = {
        currentPersona: coachSettings?.selectedPersona || 'clover',
        isPremium: false, // TODO: Get from subscription service
      };

      // Execute the command
      const result = await executeCommand(messageText, commandContext);

      // Handle the result
      await handleCommandResult(result);
      return;
    }

    // Regular message flow
    // Add user message
    const userMessage: DisplayMessage = {
      id: `user-${Date.now()}`,
      text: messageText,
      source: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Add typing indicator
    const typingId = `typing-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: typingId,
        text: '',
        source: 'claudeAPI',
        timestamp: new Date(),
        isTyping: true,
      },
    ]);

    try {
      // Build conversation context
      const recentMessages: ChatMessage[] = messages
        .filter((m) => !m.isTyping)
        .slice(-6)
        .map((m) => ({
          role: m.source === 'user' ? 'user' : 'assistant',
          content: m.text,
          timestamp: m.timestamp.toISOString(),
        }));

      const context: ConversationContext = {
        recentMessages,
        toneStyles,
      };

      // Include entry context in first message if available
      let fullMessage = messageText;
      if (additionalContext && turnCount === 0) {
        fullMessage = `[Context: ${additionalContext}]\n\nUser says: ${messageText}`;
        setAdditionalContext(undefined); // Clear after first use
      }

      // Send to Claude API
      const response = await sendMessage(fullMessage, context);

      // Parse response for skill triggers (e.g., [OPEN_SKILL:breathing_orb])
      const { skillId, cleanText } = parseSkillTrigger(response.text);
      const displayText = cleanText || response.text;

      // Remove typing indicator and add response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== typingId);
        return [
          ...filtered,
          {
            id: `ai-${Date.now()}`,
            text: displayText,
            source: response.source,
            timestamp: new Date(),
          },
        ];
      });

      // If AI triggered a skill, show the overlay
      if (skillId && isOverlaySkill(skillId)) {
        // Small delay to let the message appear first
        setTimeout(() => {
          handleSkillTrigger(skillId, displayText);
        }, 500);
      }

      // Speak the response if TTS is enabled
      if (ttsEnabled && coachSettings?.selectedPersona) {
        setIsSpeaking(true);
        speakCoachResponse(displayText, coachSettings.selectedPersona)
          .finally(() => {
            setIsSpeaking(false);
            // In continuous voice mode, auto-restart listening after AI finishes speaking
            if (continuousVoiceMode && voiceControllerRef.current && voiceSupported) {
              setTimeout(async () => {
                await voiceControllerRef.current?.startListening();
              }, 500);
            }
          });
      } else if (continuousVoiceMode && voiceControllerRef.current && voiceSupported) {
        // No TTS - still restart listening after a short delay for reading
        setTimeout(async () => {
          await voiceControllerRef.current?.startListening();
        }, 1500); // Give user time to read the response
      }

      // Track turns for anti-dependency
      const newTurnCount = turnCount + 1;
      setTurnCount(newTurnCount);

      // Anti-dependency nudge after extended conversation
      if (newTurnCount >= MAX_TURNS_BEFORE_NUDGE && newTurnCount % 5 === 0) {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `system-${Date.now()}`,
              text: "We've been talking a while. Would it feel good to take a break and come back later? There's no pressure to keep going.",
              source: 'system',
              timestamp: new Date(),
            },
          ]);
        }, 2000);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Remove typing indicator and add fallback
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== typingId);
        return [
          ...filtered,
          {
            id: `fallback-${Date.now()}`,
            text: getFallbackResponse(),
            source: 'fallback',
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Keep sendHandlerRef updated with latest handleSend (for voice callback)
  useEffect(() => {
    sendHandlerRef.current = handleSend;
  });

  // Toggle a coach mode on/off
  const handleToggleMode = async (modeId: string) => {
    const isActive = activeModes.includes(modeId);
    if (isActive) {
      await deactivateSessionMode(modeId);
      // Also remove from persistent if it was persistent
      if (modesPersistent[modeId]) {
        await togglePersistentMode(modeId, false);
      }
    } else {
      await activateSessionMode(modeId);
    }
    await loadActiveModes();
  };

  // Toggle persistent mode
  const handleTogglePersistent = async (modeId: string) => {
    const isPersistent = modesPersistent[modeId];
    await togglePersistentMode(modeId, !isPersistent);
    setModesPersistent(prev => ({ ...prev, [modeId]: !isPersistent }));
  };

  // Strip markdown formatting for display (React Native doesn't render markdown)
  const stripMarkdown = (text: string): string => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // **bold** -> bold
      .replace(/\*([^*]+)\*/g, '$1')     // *italic* -> italic
      .replace(/---/g, '—');              // --- -> em dash
  };

  // Handle AI-triggered skill overlay
  // AI can include [OPEN_SKILL:skill_id] in response to trigger a skill
  const handleSkillTrigger = (skillId: string, coachMessage?: string) => {
    if (isOverlaySkill(skillId)) {
      setActiveSkillId(skillId);
      setSkillCoachMessage(coachMessage || '');
      setShowSkillOverlay(true);
    }
  };

  // Show first-time content automatically with tour option
  const showFirstTimeContent = async () => {
    // Mark as complete immediately
    await AsyncStorage.setItem(FIRST_TIME_COACH_KEY, 'true');

    // Get their profile
    let profileText = "I'm still learning about you! As we chat more, I'll understand how you think and adapt my responses.";
    try {
      const profileReveal = await generateProfileReveal();
      profileText = stripMarkdown(profileReveal);
    } catch (error) {
      console.log('Could not generate profile:', error);
    }

    // Show welcome message with tour option
    setMessages([
      {
        id: 'welcome-first',
        text: `Welcome! 🌿\n\n${profileText}\n\n—\n\nWould you like a guided tour of the app? I can walk you through everything, or you can explore on your own.`,
        source: 'system' as MessageSource,
        timestamp: new Date(),
      },
    ]);

    setIsFirstTime(false);
  };

  // Start the interactive guided tour
  const handleStartTour = async () => {
    await startTour(
      // On step change callback - not needed, root layout polls
      undefined,
      // On tour end callback
      () => {
        // Tour ended - the root layout handles the UI,
        // we just need to update our messages when user returns
        setMessages(prev => {
          // Only add completion message if not already there
          if (prev.some(m => m.id.startsWith('tour-complete'))) return prev;
          return [
            ...prev,
            {
              id: `tour-complete-${Date.now()}`,
              text: "Tour complete! 🎉 You're all set. Feel free to chat with me anytime or explore the app on your own.",
              source: 'system' as MessageSource,
              timestamp: new Date(),
            },
          ];
        });
      }
    );
  };

  // Group modes by category for display
  const modesByCategory = useMemo(() => {
    const categories: Record<string, CoachModeConfig[]> = {};
    Object.values(COACH_MODE_SKILLS).forEach(mode => {
      if (!categories[mode.category]) {
        categories[mode.category] = [];
      }
      categories[mode.category].push(mode);
    });
    return categories;
  }, []);

  const categoryLabels: Record<string, { label: string; emoji: string }> = {
    breathing: { label: 'Breathing', emoji: '🌬️' },
    grounding: { label: 'Grounding', emoji: '🌳' },
    cbt: { label: 'CBT', emoji: '💭' },
    dbt: { label: 'DBT', emoji: '⚖️' },
    mindfulness: { label: 'Mindfulness', emoji: '🧘' },
    somatic: { label: 'Somatic', emoji: '🫀' },
    communication: { label: 'Communication', emoji: '💬' },
    spiritual: { label: 'Self-Discovery', emoji: '✨' },
    sleep: { label: 'Sleep', emoji: '😴' },
    focus: { label: 'Focus', emoji: '🎯' },
    self_care: { label: 'Self-Care', emoji: '💝' },
    story: { label: 'Stories', emoji: '📖' },
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)/tree')}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{coachEmoji}</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {coachName}
          </Text>
        </View>
        <TouchableOpacity style={styles.doneButton} onPress={() => router.replace('/(tabs)/tree')}>
          <Text style={[styles.doneButtonText, { color: colors.tint }]}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* No API Key Warning */}
      {!hasKey && (
        <View style={[styles.warningBanner, { backgroundColor: colors.card }]}>
          <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
          <Text style={[styles.warningText, { color: colors.textSecondary }]}>
            Add a Claude API key in Settings to enable AI coaching.
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Breathing Ball - shown when breathing modes are active */}
          {showBreathingBall && (
            <View style={[styles.breathingBallContainer, { backgroundColor: colors.card }]}>
              <BreathingBall
                pattern={breathingPattern}
                size={100}
                autoStart={true}
                onClose={() => setShowBreathingBall(false)}
              />
            </View>
          )}

          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.source === 'user' ? styles.userBubble : styles.aiBubble,
                {
                  backgroundColor:
                    message.source === 'user' ? colors.tint : colors.card,
                },
              ]}
            >
              {message.isTyping ? (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color={colors.textMuted} />
                  <Text style={[styles.typingText, { color: colors.textMuted }]}>
                    thinking...
                  </Text>
                </View>
              ) : (
                <>
                  {message.source !== 'user' && (
                    <View style={styles.sourceIndicator}>
                      <Text style={styles.sourceIcon}>
                        {getSourceIcon(message.source)}
                      </Text>
                      <Text style={[styles.sourceText, { color: colors.textMuted }]}>
                        {getSourceTooltip(message.source)}
                      </Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      {
                        color: message.source === 'user' ? '#FFFFFF' : colors.text,
                      },
                    ]}
                  >
                    {message.text}
                  </Text>
                </>
              )}
            </View>
          ))}

        </ScrollView>

        {/* Continuous Voice Mode Indicator */}
        {continuousVoiceMode && (
          <View style={[styles.continuousModeBar, { backgroundColor: colors.tint + '20' }]}>
            <Ionicons name="chatbubbles" size={16} color={colors.tint} />
            <Text style={[styles.continuousModeText, { color: colors.tint }]}>
              Voice conversation active
            </Text>
            <TouchableOpacity onPress={() => setContinuousVoiceMode(false)}>
              <Text style={[styles.continuousModeEnd, { color: colors.textMuted }]}>
                Tap mic or say "bye" to end
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Voice Transcript Display */}
        {voiceState === 'listening' && voiceTranscript && (
          <View style={[styles.transcriptBar, { backgroundColor: colors.card }]}>
            <Ionicons name="mic" size={16} color={colors.error} />
            <Text style={[styles.transcriptText, { color: colors.text }]} numberOfLines={2}>
              {voiceTranscript}
            </Text>
            {autoSendEnabled && (
              <Text style={[styles.autoSendHint, { color: colors.textMuted }]}>
                Pause to send...
              </Text>
            )}
          </View>
        )}

        {/* Active Modes Indicator */}
        {activeModes.length > 0 && (
          <TouchableOpacity
            style={[styles.activeModesBar, { backgroundColor: colors.card }]}
            onPress={() => setShowModesSheet(true)}
          >
            <View style={styles.activeModesContent}>
              <Text style={styles.activeModesEmojis}>
                {activeModes.slice(0, 3).map(id => COACH_MODE_SKILLS[id]?.emoji || '✨').join(' ')}
              </Text>
              <Text style={[styles.activeModesText, { color: colors.text }]}>
                {activeModes.length === 1
                  ? COACH_MODE_SKILLS[activeModes[0]]?.name || 'Mode active'
                  : `${activeModes.length} modes active`}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          {/* Modes Button */}
          <TouchableOpacity
            style={[
              styles.modesButton,
              {
                backgroundColor: activeModes.length > 0 ? colors.tint + '20' : colors.border,
              },
            ]}
            onPress={() => setShowModesSheet(true)}
          >
            <Ionicons
              name="sparkles"
              size={18}
              color={activeModes.length > 0 ? colors.tint : colors.text}
            />
          </TouchableOpacity>

          {/* Voice Button */}
          {voiceSupported && (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.voiceButton,
                  {
                    backgroundColor: voiceState === 'listening' ? colors.error : colors.border,
                  },
                ]}
                onPress={handleVoicePress}
                disabled={isLoading}
              >
                <Ionicons
                  name={voiceState === 'listening' ? 'stop' : 'mic'}
                  size={18}
                  color={voiceState === 'listening' ? '#FFFFFF' : colors.text}
                />
              </TouchableOpacity>
            </Animated.View>
          )}

          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={voiceState === 'listening' ? 'Listening...' : 'Type a message...'}
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!isLoading && voiceState !== 'listening'}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim() && !isLoading ? colors.tint : colors.border,
              },
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim() && !isLoading ? '#FFFFFF' : colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Auto-Send Toggle (only when voice is supported) */}
        {voiceSupported && (
          <TouchableOpacity
            style={styles.autoSendToggle}
            onPress={toggleAutoSend}
          >
            <Ionicons
              name={autoSendEnabled ? 'radio-button-on' : 'radio-button-off'}
              size={16}
              color={autoSendEnabled ? colors.tint : colors.textMuted}
            />
            <Text style={[styles.autoSendText, { color: colors.textMuted }]}>
              {autoSendEnabled ? 'Auto-send on pause' : 'Manual send (hold to talk)'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Privacy Footer */}
        <View style={styles.privacyFooter}>
          <Text style={[styles.privacyText, { color: colors.textMuted }]}>
            🔒 Journal entries stay on-device
            {hasKey && ' • All AI data is anonymized'}
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* Coach Modes Bottom Sheet */}
      <Modal
        visible={showModesSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModesSheet(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowModesSheet(false)}
          />
          <View style={[styles.modesSheet, { backgroundColor: colors.background }]}>
            {/* Sheet Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.sheetHandle} />
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                Coach Modes
              </Text>
              <Text style={[styles.sheetSubtitle, { color: colors.textMuted }]}>
                Enhance how the coach helps you
              </Text>
            </View>

            {/* Modes List */}
            <ScrollView style={styles.modesList} showsVerticalScrollIndicator={false}>
              {Object.entries(modesByCategory).map(([category, modes]) => (
                <View key={category} style={styles.categorySection}>
                  <Text style={[styles.categoryHeader, { color: colors.textMuted }]}>
                    {categoryLabels[category]?.emoji} {categoryLabels[category]?.label || category}
                  </Text>
                  {modes.map(mode => {
                    const isActive = activeModes.includes(mode.id);
                    const isPersistent = modesPersistent[mode.id];
                    return (
                      <View key={mode.id}>
                        <TouchableOpacity
                          style={[
                            styles.modeItem,
                            {
                              backgroundColor: isActive ? colors.tint + '15' : colors.card,
                              borderColor: isActive ? colors.tint : colors.border,
                            },
                          ]}
                          onPress={() => handleToggleMode(mode.id)}
                        >
                          <Text style={styles.modeEmoji}>{mode.emoji}</Text>
                          <View style={styles.modeInfo}>
                            <Text style={[styles.modeName, { color: colors.text }]}>
                              {mode.name}
                            </Text>
                            {mode.approach && (
                              <Text style={[styles.modeApproach, { color: colors.textMuted }]}>
                                {mode.approach}
                              </Text>
                            )}
                          </View>
                          <Ionicons
                            name={isActive ? 'checkmark-circle' : 'add-circle-outline'}
                            size={24}
                            color={isActive ? colors.tint : colors.textMuted}
                          />
                        </TouchableOpacity>
                        {/* Persistent toggle shown when mode is active */}
                        {isActive && (
                          <TouchableOpacity
                            style={[styles.persistentToggle, { backgroundColor: colors.card }]}
                            onPress={() => handleTogglePersistent(mode.id)}
                          >
                            <Ionicons
                              name={isPersistent ? 'checkbox' : 'square-outline'}
                              size={18}
                              color={isPersistent ? colors.tint : colors.textMuted}
                            />
                            <Text style={[styles.persistentText, { color: colors.textMuted }]}>
                              Keep on across sessions
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
              {/* Bottom padding */}
              <View style={{ height: 40 }} />
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity
              style={[styles.closeSheetButton, { backgroundColor: colors.tint }]}
              onPress={() => setShowModesSheet(false)}
            >
              <Text style={styles.closeSheetButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Tour Start Prompt - shown after first-time welcome, hidden during tour */}
      {messages.length === 1 && messages[0].id === 'welcome-first' && !tourActive && (
        <View style={[styles.tourPrompt, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.tourStartButton, { backgroundColor: colors.tint }]}
            onPress={handleStartTour}
          >
            <Ionicons name="compass" size={20} color="#FFFFFF" />
            <Text style={styles.tourStartText}>Take the Guided Tour</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tourDeclineButton}
            onPress={() => {
              setMessages([
                {
                  id: 'welcome',
                  text: "No problem! Feel free to explore on your own. I'm here whenever you need me. 🌿\n\n💡 Tip: You can always ask for a tour later by saying \"show me around\" or \"walkthrough\".",
                  source: 'system' as MessageSource,
                  timestamp: new Date(),
                },
              ]);
            }}
          >
            <Text style={[styles.tourDeclineText, { color: colors.textMuted }]}>
              I'll explore on my own
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Skill Overlay - AI-triggered skill display */}
      <SkillOverlay
        visible={showSkillOverlay}
        skillId={activeSkillId}
        onClose={() => setShowSkillOverlay(false)}
        coachMessage={skillCoachMessage}
      />
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
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headerEmoji: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  doneButton: {
    padding: 4,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
  },
  keyboardAvoid: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  breathingBallContainer: {
    marginBottom: 16,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  sourceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  sourceIcon: {
    fontSize: 12,
  },
  sourceText: {
    fontSize: 11,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcriptBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  transcriptText: {
    flex: 1,
    fontSize: 14,
  },
  autoSendHint: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  continuousModeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  continuousModeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  continuousModeEnd: {
    fontSize: 11,
  },
  autoSendToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 6,
  },
  autoSendText: {
    fontSize: 11,
  },
  privacyFooter: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  privacyText: {
    fontSize: 11,
    textAlign: 'center',
  },
  // Active modes indicator bar
  activeModesBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  activeModesContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeModesEmojis: {
    fontSize: 14,
  },
  activeModesText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Modes button
  modesButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modesSheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D0D0',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sheetSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  modesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categorySection: {
    marginTop: 20,
  },
  categoryHeader: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  modeEmoji: {
    fontSize: 24,
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    fontSize: 15,
    fontWeight: '500',
  },
  modeApproach: {
    fontSize: 12,
    marginTop: 2,
  },
  persistentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 48,
    marginTop: -4,
    marginBottom: 8,
    borderRadius: 8,
    gap: 8,
  },
  persistentText: {
    fontSize: 12,
  },
  closeSheetButton: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeSheetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Walkthrough styles
  walkthroughChoiceContainer: {
    marginTop: 16,
    gap: 12,
    paddingHorizontal: 8,
  },
  walkthroughButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  walkthroughButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  walkthroughButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 14,
  },
  walkthroughNextContainer: {
    marginTop: 16,
    alignItems: 'center',
    gap: 8,
  },
  walkthroughNextButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  walkthroughNextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  skipWalkthroughButton: {
    paddingVertical: 8,
  },
  // Tour start prompt styles (overlay is in _layout.tsx)
  tourPrompt: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  tourStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  tourStartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tourDeclineButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  tourDeclineText: {
    fontSize: 14,
  },
});
