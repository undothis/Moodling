/**
 * Coach Tab
 *
 * Wraps the main Coach screen within the tab navigation.
 * Supports voice-enabled quick access:
 * - Hold the Coach tab → Speak → Release → Your message appears in chat
 *
 * The pending voice message is loaded from AsyncStorage when the screen mounts.
 */

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
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateProfileReveal } from '@/services/cognitiveProfileService';
import { startTour, isTourActive, subscribeTourState, resetTour } from '@/services/guidedTourService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Storage key for pending voice message from tab bar
const PENDING_COACH_MESSAGE_KEY = 'moodleaf_pending_coach_voice';

// Initialize slash commands on module load
initializeSlashCommands();

/**
 * Coach Tab Screen
 *
 * Following Mood Leaf Ethics:
 * - Transparent about AI source
 * - Anti-dependency nudges
 * - Never diagnostic
 * - Encourage real-world connection
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
  text: "Hi! I'm here to chat whenever you need. What's on your mind?",
  source: 'fallback',
  timestamp: new Date(),
};

const MAX_TURNS_BEFORE_NUDGE = 10;

export default function CoachTabScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { context: entryContext } = useLocalSearchParams<{ context?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [toneStyles, setToneStyles] = useState<ToneStyle[]>(['balanced']);
  const [turnCount, setTurnCount] = useState(0);

  // Coach persona info
  const [coachName, setCoachName] = useState('Your Guide');
  const [coachEmoji, setCoachEmoji] = useState('🌿');
  const [coachSettings, setCoachSettings] = useState<CoachSettings | null>(null);

  // Voice state
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');

  // Typing animation
  const typingAnim = useRef(new Animated.Value(0)).current;

  // Use ref to get latest handleSend for voice callback
  const handleSendRef = useRef(handleSend);
  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  // Load pending voice message on focus
  useFocusEffect(
    useCallback(() => {
      const loadPendingVoice = async () => {
        try {
          const pending = await AsyncStorage.getItem(PENDING_COACH_MESSAGE_KEY);
          console.log('[Coach] Checking for pending voice message:', pending ? 'found' : 'none');
          if (pending) {
            // Clear the pending message
            await AsyncStorage.removeItem(PENDING_COACH_MESSAGE_KEY);
            // Set it in the input and auto-send
            setInputText(pending);
            console.log('[Coach] Set pending voice message in input, auto-sending...');
            // Auto-send after a short delay so user sees it
            setTimeout(() => {
              handleSendRef.current(pending);
            }, 300);
          }
        } catch (error) {
          console.error('Failed to load pending voice message:', error);
        }
      };
      loadPendingVoice();
    }, [])
  );

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const key = await hasAPIKey();
      setHasKey(key);

      const tones = await getTonePreferences();
      setToneStyles(tones);

      const settings = await getCoachSettings();
      setCoachSettings(settings);
      setCoachName(getCoachDisplayName(settings));
      setCoachEmoji(getCoachEmoji(settings));

      setVoiceSupported(await isVoiceChatSupported());
    };
    loadSettings();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Typing animation
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(typingAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingAnim.setValue(0);
    }
  }, [isLoading, typingAnim]);

  const handleSend = async (overrideText?: string) => {
    const messageText = overrideText || inputText.trim();
    if (!messageText || isLoading) return;

    // Add user message
    const userMessage: DisplayMessage = {
      id: `user_${Date.now()}`,
      text: messageText,
      source: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setTurnCount((prev) => prev + 1);

    try {
      // Check for slash commands
      if (isSlashCommand(messageText)) {
        const context: CommandContext = {
          message: messageText,
          coachSettings: coachSettings || undefined,
          router,
        };
        const result = await executeCommand(messageText, context);

        const commandMessage: DisplayMessage = {
          id: `cmd_${Date.now()}`,
          text: result.message,
          source: 'command',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, commandMessage]);
        setIsLoading(false);
        return;
      }

      // Build conversation history
      const history: ChatMessage[] = messages
        .filter((m) => m.source === 'user' || m.source === 'claudeAPI')
        .slice(-10)
        .map((m) => ({
          role: m.source === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

      // Send to Claude
      const response: AIResponse = await sendMessage(messageText, {
        recentMessages: history,
        toneStyles,
      });

      const aiMessage: DisplayMessage = {
        id: `ai_${Date.now()}`,
        text: response.text,
        source: response.source === 'crisis' ? 'crisis' : 'claudeAPI',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // TTS if enabled
      const ttsSettings = await getTTSSettings();
      if (ttsSettings.enabled) {
        speakCoachResponse(response.text);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const fallbackText = getFallbackResponse();
      const fallbackMessage: DisplayMessage = {
        id: `fallback_${Date.now()}`,
        text: fallbackText,
        source: 'fallback',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: DisplayMessage) => {
    const isUser = message.source === 'user';
    const isCommand = message.source === 'command';
    const isCrisis = message.source === 'crisis';

    return (
      <View
        key={message.id}
        style={[
          styles.messageBubble,
          isUser
            ? [styles.userBubble, { backgroundColor: colors.tint }]
            : [styles.aiBubble, { backgroundColor: colors.card }],
          isCrisis && { borderColor: colors.error, borderWidth: 2 },
          isCommand && { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
        ]}
      >
        {!isUser && (
          <Text style={styles.coachEmoji}>{coachEmoji}</Text>
        )}
        <Text
          style={[
            styles.messageText,
            { color: isUser ? '#fff' : colors.text },
          ]}
        >
          {message.text}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {coachEmoji} {coachName}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/coach/settings')}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map(renderMessage)}
        {isLoading && (
          <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: colors.card }]}>
            <Text style={styles.coachEmoji}>{coachEmoji}</Text>
            <Animated.Text
              style={[
                styles.typingIndicator,
                { color: colors.secondaryText, opacity: typingAnim },
              ]}
            >
              ...
            </Animated.Text>
          </View>
        )}
      </ScrollView>

      {/* Input area */}
      <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={colors.secondaryText}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.tint }]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  settingsButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  coachEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  typingIndicator: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
