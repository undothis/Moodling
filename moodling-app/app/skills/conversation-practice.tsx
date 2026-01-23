/**
 * Conversation Practice Screen
 *
 * Role-play difficult conversations with AI coaching.
 * Choose a scenario, practice with the coach playing the other person,
 * then get feedback on your communication.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { sendMessage } from '@/services/claudeAPIService';

// Practice scenario definitions
const SCENARIOS = {
  asking_for_raise: {
    id: 'asking_for_raise',
    title: 'Asking for a Raise',
    emoji: '💰',
    description: 'Practice negotiating your salary with confidence',
    roleplayPrompt: `You are playing the role of a BOSS/MANAGER in a salary negotiation roleplay.

The user is practicing asking for a raise. Play the part of a reasonable but cautious manager who:
- Listens to their points
- Asks clarifying questions about their contributions
- Raises some realistic objections (budget constraints, timing, etc.)
- Is open to being convinced with good arguments

Stay in character. Respond as the manager would. Keep responses conversational (2-4 sentences).
After 4-5 exchanges, if they've made good points, express willingness to consider it.`,
    tips: [
      'Document your achievements beforehand',
      'Know your market value',
      'Be specific about what you want',
      'Stay calm and professional',
    ],
  },
  setting_boundaries: {
    id: 'setting_boundaries',
    title: 'Setting Boundaries',
    emoji: '🚧',
    description: 'Practice saying no and establishing healthy limits',
    roleplayPrompt: `You are playing the role of a FRIEND/FAMILY MEMBER who tends to overstep boundaries.

The user is practicing setting boundaries. Play someone who:
- Initially pushes back when they say no
- Uses guilt or "but we always..." arguments
- Eventually respects their boundary when they stay firm
- Is not malicious, just used to getting their way

Stay in character. Keep responses conversational (2-4 sentences).
Make them work for it a bit, but don't be cruel.`,
    tips: [
      '"No" is a complete sentence',
      'You don\'t need to justify your boundaries',
      'Stay calm and repeat if needed',
      'Acknowledge their feelings while holding firm',
    ],
  },
  ending_relationship: {
    id: 'ending_relationship',
    title: 'Ending a Relationship',
    emoji: '💔',
    description: 'Practice having a compassionate breakup conversation',
    roleplayPrompt: `You are playing the role of a PARTNER being broken up with.

The user is practicing ending a relationship kindly. Play someone who:
- Is surprised and hurt
- Asks "why?" and wants to understand
- May try to bargain or suggest fixing things
- Eventually accepts with sadness

Stay in character. Show realistic emotions but don't be dramatic.
Keep responses conversational (2-4 sentences).`,
    tips: [
      'Be clear - don\'t give false hope',
      'Acknowledge shared history and good times',
      'Take responsibility for your decision',
      'Allow them to feel their feelings',
    ],
  },
  confronting_friend: {
    id: 'confronting_friend',
    title: 'Confronting a Friend',
    emoji: '🤝',
    description: 'Practice addressing conflict with someone you care about',
    roleplayPrompt: `You are playing the role of a CLOSE FRIEND who did something hurtful.

The user is practicing confronting you about it. Play someone who:
- Initially gets a bit defensive
- Gradually opens up to hearing their perspective
- May not have realized the impact of their actions
- Values the friendship and wants to work it out

Stay in character. Keep responses conversational (2-4 sentences).`,
    tips: [
      'Use "I feel" statements',
      'Focus on the behavior, not their character',
      'Give them space to explain',
      'Express what you need going forward',
    ],
  },
  telling_parents: {
    id: 'telling_parents',
    title: 'Telling Family News',
    emoji: '👨‍👩‍👧',
    description: 'Practice sharing difficult or big news with family',
    roleplayPrompt: `You are playing the role of a PARENT receiving news from their adult child.

The user is practicing sharing something difficult (coming out, career change, moving away, etc.).
Play a parent who:
- Initially reacts with surprise or concern
- Asks questions to understand
- May express worry but comes from love
- Ultimately wants their child's happiness

Stay in character. Keep responses conversational (2-4 sentences).`,
    tips: [
      'Choose the right time and place',
      'Be direct about what you\'re sharing',
      'Give them time to process',
      'Set boundaries on unsolicited advice',
    ],
  },
  job_interview: {
    id: 'job_interview',
    title: 'Job Interview Prep',
    emoji: '💼',
    description: 'Practice common interview questions and scenarios',
    roleplayPrompt: `You are playing the role of a JOB INTERVIEWER.

The user is practicing for a job interview. Play a professional interviewer who:
- Asks common interview questions
- Follows up on their answers
- Is friendly but evaluative
- Asks about experience, strengths, weaknesses, and scenarios

Stay in character. Ask one question at a time.
After 5-6 questions, wrap up professionally.`,
    tips: [
      'Research the company beforehand',
      'Use the STAR method for behavioral questions',
      'Prepare questions to ask them',
      'Practice your elevator pitch',
    ],
  },
  apologizing: {
    id: 'apologizing',
    title: 'Making an Apology',
    emoji: '🙏',
    description: 'Practice delivering a genuine, accountable apology',
    roleplayPrompt: `You are playing the role of someone who was HURT by the user's actions.

The user is practicing making an apology. Play someone who:
- Is still hurt/upset
- Needs to feel heard and understood
- Tests if the apology is genuine
- Accepts a good apology, stays guarded with a bad one

Stay in character. Keep responses conversational (2-4 sentences).
A good apology takes accountability, acknowledges impact, and offers change.`,
    tips: [
      'Take full responsibility - no "but" or "if"',
      'Acknowledge the specific impact',
      'Don\'t expect immediate forgiveness',
      'Explain how you\'ll do better',
    ],
  },
  asking_for_help: {
    id: 'asking_for_help',
    title: 'Asking for Help',
    emoji: '🆘',
    description: 'Practice reaching out when you need support',
    roleplayPrompt: `You are playing the role of a FRIEND/TRUSTED PERSON the user is asking for help.

The user is practicing being vulnerable and asking for support. Play someone who:
- Is warm and receptive
- Asks clarifying questions
- Offers practical support
- Doesn't judge or minimize

Stay in character. Keep responses conversational (2-4 sentences).
Make them feel safe opening up.`,
    tips: [
      'Be specific about what you need',
      'It\'s okay to be vulnerable',
      'Choose someone you trust',
      'Remember: asking for help is strength',
    ],
  },
  giving_feedback: {
    id: 'giving_feedback',
    title: 'Giving Feedback',
    emoji: '📝',
    description: 'Practice delivering constructive criticism kindly',
    roleplayPrompt: `You are playing the role of a COLLEAGUE/DIRECT REPORT receiving feedback.

The user is practicing giving constructive feedback. Play someone who:
- Initially gets a bit defensive
- Asks questions to understand
- May offer excuses at first
- Opens up to feedback delivered well

Stay in character. Keep responses conversational (2-4 sentences).`,
    tips: [
      'Be specific with examples',
      'Focus on behavior, not personality',
      'Balance critique with recognition',
      'Offer support for improvement',
    ],
  },
  nvc_practice: {
    id: 'nvc_practice',
    title: 'Nonviolent Communication',
    emoji: '🕊️',
    description: 'Practice Marshall Rosenberg\'s NVC framework',
    roleplayPrompt: `You are a PRACTICE PARTNER helping the user learn Nonviolent Communication (NVC).

Guide them through the 4 steps:
1. OBSERVATION - What happened? (facts, not judgments)
2. FEELING - How do they feel about it?
3. NEED - What need is unmet?
4. REQUEST - What specific action would help?

After they share a situation, help them reframe it using NVC.
Give gentle coaching. Keep responses focused (2-4 sentences).`,
    tips: [
      'Observation: "When I saw..." not "You always..."',
      'Feeling: Name the emotion without blame',
      'Need: Universal human needs (safety, respect, connection)',
      'Request: Specific, doable, present-tense',
    ],
  },
  custom: {
    id: 'custom',
    title: 'Custom Scenario',
    emoji: '✨',
    description: 'Describe your own situation to practice',
    roleplayPrompt: `The user will describe a specific conversation they want to practice.
Once they describe it, play the role of the OTHER PERSON in that scenario.
Stay in character based on how they describe the person/situation.
Keep responses conversational (2-4 sentences).`,
    tips: [
      'Describe the relationship (boss, friend, parent)',
      'Share the context',
      'Explain what you want to communicate',
      'Practice until you feel ready',
    ],
  },
};

type ScenarioId = keyof typeof SCENARIOS;

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function ConversationPracticeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);

  // Get scenario from params or default to selection screen
  const initialScenario = params.scenario as ScenarioId | undefined;

  const [selectedScenario, setSelectedScenario] = useState<ScenarioId | null>(
    initialScenario || null
  );
  const [phase, setPhase] = useState<'select' | 'setup' | 'practice' | 'feedback'>(
    initialScenario ? 'setup' : 'select'
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customContext, setCustomContext] = useState('');

  const scenario = selectedScenario ? SCENARIOS[selectedScenario] : null;

  // Start the roleplay
  const startPractice = async () => {
    if (!scenario) return;

    setPhase('practice');
    setIsLoading(true);

    // Build the opening message
    let openingPrompt = scenario.roleplayPrompt;
    if (selectedScenario === 'custom' && customContext) {
      openingPrompt += `\n\nThe user wants to practice this scenario: ${customContext}\n\nStart by acknowledging the scenario and playing your part.`;
    }

    try {
      const response = await sendMessage(
        'Start the roleplay. Say something in character to begin the conversation. Keep it brief (1-2 sentences).',
        [{ role: 'user', content: openingPrompt }],
        {
          overrideSystemPrompt: `You are a roleplay practice partner. ${openingPrompt}\n\nImportant: Stay in character throughout. Do not break character or offer coaching during the roleplay. The user will get feedback afterward.`,
        }
      );

      const assistantMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.content || "Hi, what did you want to talk about?",
      };
      setMessages([assistantMsg]);
    } catch (error) {
      console.error('Error starting practice:', error);
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: "Let's begin. What's on your mind?",
      }]);
    }

    setIsLoading(false);
  };

  // Send a message in the roleplay
  const sendPracticeMessage = async () => {
    if (!inputText.trim() || !scenario || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Build conversation history
      const history = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const response = await sendMessage(
        userMessage.content,
        history,
        {
          overrideSystemPrompt: `You are a roleplay practice partner. ${scenario.roleplayPrompt}\n\nStay in character. Respond as the person would. Keep responses conversational (2-4 sentences). Do not break character.`,
        }
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content || "...",
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Error in practice:', error);
    }

    setIsLoading(false);
  };

  // Get feedback on the conversation
  const getFeedback = async () => {
    if (messages.length < 4) {
      // Need more conversation first
      return;
    }

    setPhase('feedback');
    setIsLoading(true);

    try {
      const conversationText = messages
        .map(m => `${m.role === 'user' ? 'User' : 'Other person'}: ${m.content}`)
        .join('\n\n');

      const response = await sendMessage(
        `Please give me feedback on how I handled this conversation:\n\n${conversationText}`,
        [],
        {
          overrideSystemPrompt: `You are a communication coach reviewing a practice conversation. The user was practicing: ${scenario?.title}.

Provide helpful feedback:
1. What they did well (specific examples)
2. What they could improve (with suggestions)
3. One key takeaway

Be encouraging but honest. Keep it concise (3-4 short paragraphs).
Use their actual words as examples where relevant.`,
        }
      );

      const feedbackMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.content || "Great practice session!",
      };
      setMessages(prev => [...prev, feedbackMsg]);
    } catch (error) {
      console.error('Error getting feedback:', error);
    }

    setIsLoading(false);
  };

  // Reset to try again
  const resetPractice = () => {
    setMessages([]);
    setPhase('setup');
    setInputText('');
    setCustomContext('');
  };

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Render scenario selection
  const renderScenarioSelection = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.selectionContent}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Choose a Conversation to Practice
      </Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
        Role-play with AI coaching and get feedback
      </Text>

      {Object.values(SCENARIOS).map((s) => (
        <TouchableOpacity
          key={s.id}
          style={[styles.scenarioCard, { backgroundColor: colors.card }]}
          onPress={() => {
            setSelectedScenario(s.id as ScenarioId);
            setPhase('setup');
          }}
        >
          <Text style={styles.scenarioEmoji}>{s.emoji}</Text>
          <View style={styles.scenarioInfo}>
            <Text style={[styles.scenarioTitle, { color: colors.text }]}>
              {s.title}
            </Text>
            <Text style={[styles.scenarioDesc, { color: colors.textSecondary }]}>
              {s.description}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Render setup screen
  const renderSetup = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.setupContent}
    >
      <View style={[styles.scenarioHeader, { backgroundColor: colors.card }]}>
        <Text style={styles.headerEmoji}>{scenario?.emoji}</Text>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {scenario?.title}
        </Text>
        <Text style={[styles.headerDesc, { color: colors.textSecondary }]}>
          {scenario?.description}
        </Text>
      </View>

      {selectedScenario === 'custom' && (
        <View style={[styles.customInputSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.customLabel, { color: colors.text }]}>
            Describe your scenario:
          </Text>
          <TextInput
            style={[styles.customInput, {
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border,
            }]}
            placeholder="E.g., I need to tell my roommate they need to clean up more..."
            placeholderTextColor={colors.textMuted}
            value={customContext}
            onChangeText={setCustomContext}
            multiline
            numberOfLines={4}
          />
        </View>
      )}

      <View style={[styles.tipsSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.tipsTitle, { color: colors.text }]}>
          💡 Tips for this conversation
        </Text>
        {scenario?.tips.map((tip, i) => (
          <Text key={i} style={[styles.tipText, { color: colors.textSecondary }]}>
            • {tip}
          </Text>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: colors.tint }]}
        onPress={startPractice}
        disabled={selectedScenario === 'custom' && !customContext.trim()}
      >
        <Text style={styles.startButtonText}>Start Practice</Text>
        <Ionicons name="play" size={20} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backLink}
        onPress={() => {
          setSelectedScenario(null);
          setPhase('select');
        }}
      >
        <Text style={[styles.backLinkText, { color: colors.tint }]}>
          ← Choose different scenario
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Render practice chat
  const renderPractice = () => (
    <KeyboardAvoidingView
      style={styles.practiceContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + 60}
    >
      <View style={[styles.practiceHeader, { backgroundColor: colors.card }]}>
        <Text style={styles.practiceHeaderEmoji}>{scenario?.emoji}</Text>
        <View style={styles.practiceHeaderInfo}>
          <Text style={[styles.practiceHeaderTitle, { color: colors.text }]}>
            {scenario?.title}
          </Text>
          <Text style={[styles.practiceHeaderHint, { color: colors.textSecondary }]}>
            Practice your response
          </Text>
        </View>
        {messages.length >= 4 && (
          <TouchableOpacity
            style={[styles.feedbackButton, { backgroundColor: colors.tint }]}
            onPress={getFeedback}
          >
            <Text style={styles.feedbackButtonText}>Get Feedback</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
              {
                backgroundColor: msg.role === 'user' ? colors.tint : colors.card,
              },
            ]}
          >
            <Text
              style={[
                styles.messageText,
                { color: msg.role === 'user' ? '#fff' : colors.text },
              ]}
            >
              {msg.content}
            </Text>
          </View>
        ))}
        {isLoading && (
          <View style={[styles.loadingBubble, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="small" color={colors.tint} />
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
          placeholder="Type your response..."
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.tint }]}
          onPress={sendPracticeMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  // Render feedback view
  const renderFeedback = () => (
    <ScrollView
      ref={scrollViewRef}
      style={styles.scrollView}
      contentContainerStyle={styles.feedbackContent}
    >
      <View style={[styles.feedbackHeader, { backgroundColor: colors.card }]}>
        <Text style={styles.feedbackEmoji}>📝</Text>
        <Text style={[styles.feedbackTitle, { color: colors.text }]}>
          Practice Feedback
        </Text>
      </View>

      {messages.map((msg) => (
        <View
          key={msg.id}
          style={[
            styles.feedbackMessageBubble,
            msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
            {
              backgroundColor: msg.role === 'user' ? colors.tint : colors.card,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: msg.role === 'user' ? '#fff' : colors.text },
            ]}
          >
            {msg.content}
          </Text>
        </View>
      ))}

      {isLoading && (
        <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Analyzing your conversation...
          </Text>
        </View>
      )}

      {!isLoading && (
        <View style={styles.feedbackActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={resetPractice}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Practice Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={() => {
              setSelectedScenario(null);
              setPhase('select');
              setMessages([]);
            }}
          >
            <Ionicons name="list" size={20} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Try Different Scenario
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            if (phase === 'select') {
              router.back();
            } else if (phase === 'setup') {
              setSelectedScenario(null);
              setPhase('select');
            } else {
              resetPractice();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle2, { color: colors.text }]}>
          {phase === 'select' ? 'Practice Conversations' : scenario?.title || 'Practice'}
        </Text>
        <View style={styles.headerButton} />
      </View>

      {/* Content */}
      {phase === 'select' && renderScenarioSelection()}
      {phase === 'setup' && renderSetup()}
      {phase === 'practice' && renderPractice()}
      {phase === 'feedback' && renderFeedback()}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle2: {
    fontSize: 17,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  selectionContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  scenarioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  scenarioEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  scenarioInfo: {
    flex: 1,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  scenarioDesc: {
    fontSize: 14,
  },
  setupContent: {
    padding: 20,
  },
  scenarioHeader: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerDesc: {
    fontSize: 15,
    textAlign: 'center',
  },
  customInputSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  customLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  tipsSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  backLink: {
    padding: 16,
    alignItems: 'center',
  },
  backLinkText: {
    fontSize: 15,
  },
  practiceContainer: {
    flex: 1,
  },
  practiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  practiceHeaderEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  practiceHeaderInfo: {
    flex: 1,
  },
  practiceHeaderTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  practiceHeaderHint: {
    fontSize: 13,
  },
  feedbackButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  feedbackButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    padding: 16,
    borderRadius: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackContent: {
    padding: 20,
  },
  feedbackHeader: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  feedbackEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  feedbackMessageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 12,
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  feedbackActions: {
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
