import { useState, useRef, useEffect, useMemo } from 'react';
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
  text: "Hi! I'm here to chat whenever you need. What's on your mind?",
  source: 'fallback',
  timestamp: new Date(),
};

const MAX_TURNS_BEFORE_NUDGE = 10;

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

  // Voice chat state
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [silenceProgress, setSilenceProgress] = useState(0);
  const [autoSendEnabled, setAutoSendEnabled] = useState(true); // Toggle for auto-send on pause
  const voiceControllerRef = useRef<VoiceChatController | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Ref to hold latest send handler (avoids stale closure in voice callback)
  const sendHandlerRef = useRef<(text: string) => Promise<void>>();

  // TTS state
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Load coach settings and API key on mount
  useEffect(() => {
    const checkSetup = async () => {
      const keyExists = await hasAPIKey();
      setHasKey(keyExists);

      // Initialize TTS
      await initializeTTS();
      const ttsSettings = await getTTSSettings();
      setTtsEnabled(ttsSettings.enabled && ttsSettings.autoPlay);

      const prefs = await getTonePreferences();
      setToneStyles(prefs.selectedStyles);

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
      // Update mode based on autoSendEnabled
      await voiceControllerRef.current.updateSettings({
        mode: autoSendEnabled ? 'auto_detect' : 'push_to_talk',
        confirmBeforeSend: !autoSendEnabled,
      });
      await voiceControllerRef.current.startListening();
    } else if (voiceState === 'listening') {
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

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

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

      // Remove typing indicator and add response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== typingId);
        return [
          ...filtered,
          {
            id: `ai-${Date.now()}`,
            text: response.text,
            source: response.source,
            timestamp: new Date(),
          },
        ];
      });

      // Speak the response if TTS is enabled
      if (ttsEnabled && coachSettings?.selectedPersona) {
        setIsSpeaking(true);
        speakCoachResponse(response.text, coachSettings.selectedPersona)
          .finally(() => setIsSpeaking(false));
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{coachEmoji}</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {coachName}
          </Text>
        </View>
        <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
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

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
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
});
