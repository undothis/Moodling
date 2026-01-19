import { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  sendMessage,
  hasAPIKey,
  ChatMessage,
  ConversationContext,
  AIResponse,
  getFallbackResponse,
} from '@/services/claudeAPIService';
import { getTonePreferences, ToneStyle } from '@/services/tonePreferencesService';

/**
 * Coaching Conversation Screen
 *
 * Following Moodling Ethics:
 * - Transparent about AI source
 * - Anti-dependency nudges
 * - Never diagnostic
 * - Encourage real-world connection
 *
 * Unit 19: Coaching Conversation UI
 */

type MessageSource = 'user' | 'claudeAPI' | 'fallback' | 'crisis' | 'system';

interface DisplayMessage {
  id: string;
  text: string;
  source: MessageSource;
  timestamp: Date;
  isTyping?: boolean;
}

const QUICK_ACTIONS = [
  {
    label: 'Prepare for event',
    prompt: "I have an event coming up and I'd like help preparing mentally.",
    icon: 'calendar-outline',
  },
  {
    label: 'Breathing',
    prompt: 'Guide me through a quick breathing exercise.',
    icon: 'leaf-outline',
  },
  {
    label: 'Just vent',
    prompt: 'I need to get something off my chest.',
    icon: 'chatbubble-outline',
  },
  {
    label: 'Check in',
    prompt: "I'm not sure how I'm feeling right now.",
    icon: 'heart-outline',
  },
];

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
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [toneStyles, setToneStyles] = useState<ToneStyle[]>(['balanced']);
  const [turnCount, setTurnCount] = useState(0);

  // Check API key on mount
  useEffect(() => {
    const checkSetup = async () => {
      const keyExists = await hasAPIKey();
      setHasKey(keyExists);

      const prefs = await getTonePreferences();
      setToneStyles(prefs.selectedStyles);
    };
    checkSetup();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

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
      default:
        return '';
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

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

      // Send to Claude API
      const response = await sendMessage(messageText, context);

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

  const handleQuickAction = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Talk with Moodling
        </Text>
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

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContent}
          >
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={[styles.quickAction, { backgroundColor: colors.card }]}
                onPress={() => handleQuickAction(action.prompt)}
                disabled={isLoading}
              >
                <Ionicons
                  name={action.icon as any}
                  size={16}
                  color={colors.tint}
                />
                <Text style={[styles.quickActionText, { color: colors.text }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!isLoading}
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

        {/* Privacy Footer */}
        <View style={styles.privacyFooter}>
          <Text style={[styles.privacyText, { color: colors.textMuted }]}>
            🔒 Journal entries stay on-device
            {hasKey && ' • ☁️ Chat uses Claude API'}
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
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
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
  quickActionsContainer: {
    paddingVertical: 8,
    borderTopWidth: 0,
  },
  quickActionsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
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
