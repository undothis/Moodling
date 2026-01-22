/**
 * DEAR MAN Script Builder
 *
 * DBT interpersonal effectiveness skill for asking for what you need
 * or saying no while maintaining relationships.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DEARMANStep {
  letter: string;
  name: string;
  description: string;
  prompt: string;
  example: string;
  tip: string;
}

const DEARMAN_STEPS: DEARMANStep[] = [
  {
    letter: 'D',
    name: 'Describe',
    description: 'State the facts of the situation objectively',
    prompt: 'What happened? (Just the facts, no judgments)',
    example: '"When I came home yesterday, the dishes were still in the sink..."',
    tip: 'Stick to observable facts. Avoid words like "always" or "never".',
  },
  {
    letter: 'E',
    name: 'Express',
    description: 'Share how you feel about the situation',
    prompt: 'How do you feel about this? (Use "I feel..." statements)',
    example: '"I feel frustrated and overwhelmed when I see the dishes piled up..."',
    tip: 'Own your feelings. "I feel..." not "You make me feel..."',
  },
  {
    letter: 'A',
    name: 'Assert',
    description: 'Ask for what you want or say no clearly',
    prompt: 'What specifically do you want or need?',
    example: '"I would like us to agree on a system where we each do dishes on certain days..."',
    tip: 'Be specific. Don\'t expect them to read your mind.',
  },
  {
    letter: 'R',
    name: 'Reinforce',
    description: 'Explain the positive effects of getting what you want',
    prompt: 'How will this benefit them or the relationship?',
    example: '"This would help me feel more relaxed at home, and we\'d have fewer arguments..."',
    tip: 'Focus on mutual benefits when possible.',
  },
  {
    letter: 'M',
    name: '(stay) Mindful',
    description: 'Keep focus on your goal, don\'t get distracted',
    prompt: 'What might derail this conversation? How will you stay focused?',
    example: '"If they bring up something I did wrong, I\'ll acknowledge it briefly and return to the dishes topic..."',
    tip: '"Broken record" - keep gently returning to your main point.',
  },
  {
    letter: 'A',
    name: 'Appear confident',
    description: 'Use confident body language and tone',
    prompt: 'How will you present yourself? (posture, eye contact, voice)',
    example: '"I\'ll stand/sit up straight, make eye contact, speak in a steady voice..."',
    tip: 'Even if you don\'t feel confident, acting confident can help.',
  },
  {
    letter: 'N',
    name: 'Negotiate',
    description: 'Be willing to give to get',
    prompt: 'What are you willing to compromise on?',
    example: '"I\'m flexible on which days each of us does dishes..."',
    tip: 'Focus on what would solve the problem, not winning.',
  },
];

interface DEARMANScriptProps {
  onClose?: () => void;
}

export default function DEARMANScript({ onClose }: DEARMANScriptProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [showFullScript, setShowFullScript] = useState(false);

  const step = DEARMAN_STEPS[currentStep];

  const updateResponse = (letter: string, text: string) => {
    setResponses((prev) => ({ ...prev, [letter]: text }));
  };

  const generateScript = () => {
    return DEARMAN_STEPS.map((s) => {
      const response = responses[s.letter] || '';
      return `${s.letter} - ${s.name}:\n${response || '(not filled in)'}`;
    }).join('\n\n');
  };

  const shareScript = async () => {
    try {
      await Share.share({
        message: `My DEAR MAN Script:\n\n${generateScript()}`,
      });
    } catch (error) {
      // User cancelled
    }
  };

  const isComplete = DEARMAN_STEPS.every((s) => responses[s.letter]?.trim());

  if (showFullScript) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowFullScript(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Your Script</Text>
          </View>
          <TouchableOpacity onPress={shareScript} style={styles.shareButton}>
            <Ionicons name="share-outline" size={22} color="#6366F1" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scriptView} contentContainerStyle={styles.scriptContent}>
          {DEARMAN_STEPS.map((s, index) => (
            <View key={s.letter} style={styles.scriptSection}>
              <View style={styles.scriptHeader}>
                <View style={styles.scriptBadge}>
                  <Text style={styles.scriptLetter}>{s.letter}</Text>
                </View>
                <Text style={styles.scriptName}>{s.name}</Text>
              </View>
              <Text style={styles.scriptText}>
                {responses[s.letter] || '(Not filled in)'}
              </Text>
            </View>
          ))}

          <View style={styles.practiceBox}>
            <Ionicons name="bulb" size={18} color="#F59E0B" />
            <Text style={styles.practiceText}>
              Practice reading this out loud a few times before the actual conversation.
              The words might change in the moment, and that's okay - you have the framework.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>DEAR MAN</Text>
          <Text style={styles.subtitle}>Build your conversation script</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Letter tabs */}
      <View style={styles.tabsContainer}>
        {DEARMAN_STEPS.map((s, index) => (
          <TouchableOpacity
            key={s.letter + index}
            style={[
              styles.tab,
              currentStep === index && styles.tabActive,
              responses[s.letter]?.trim() && styles.tabComplete,
            ]}
            onPress={() => setCurrentStep(index)}
          >
            <Text style={[
              styles.tabLetter,
              currentStep === index && styles.tabLetterActive,
            ]}>
              {s.letter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepLetter}>{step.letter}</Text>
            </View>
            <View style={styles.stepHeaderText}>
              <Text style={styles.stepName}>{step.name}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          </View>

          <Text style={styles.prompt}>{step.prompt}</Text>

          <TextInput
            style={styles.input}
            multiline
            placeholder="Write your response here..."
            placeholderTextColor="#94A3B8"
            value={responses[step.letter] || ''}
            onChangeText={(text) => updateResponse(step.letter, text)}
            textAlignVertical="top"
          />

          <View style={styles.exampleBox}>
            <Text style={styles.exampleLabel}>Example:</Text>
            <Text style={styles.exampleText}>{step.example}</Text>
          </View>

          <View style={styles.tipBox}>
            <Ionicons name="information-circle" size={16} color="#6366F1" />
            <Text style={styles.tipText}>{step.tip}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
          onPress={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
        >
          <Ionicons name="chevron-back" size={20} color={currentStep === 0 ? '#CBD5E1' : '#6366F1'} />
          <Text style={[styles.navText, currentStep === 0 && styles.navTextDisabled]}>Back</Text>
        </TouchableOpacity>

        {currentStep < DEARMAN_STEPS.length - 1 ? (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setCurrentStep((s) => s + 1)}
          >
            <Text style={styles.navText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="#6366F1" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.viewButton, !isComplete && styles.viewButtonDisabled]}
            onPress={() => setShowFullScript(true)}
          >
            <Text style={styles.viewText}>View Full Script</Text>
            <Ionicons name="document-text" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: '#6366F1',
  },
  tabComplete: {
    backgroundColor: '#10B981',
  },
  tabLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  tabLetterActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepLetter: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepHeaderText: {
    flex: 1,
  },
  stepName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  stepDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  prompt: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 12,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#334155',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  exampleBox: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  exampleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 13,
    color: '#166534',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#4338CA',
    marginLeft: 8,
    lineHeight: 18,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  navTextDisabled: {
    color: '#CBD5E1',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  viewButtonDisabled: {
    opacity: 0.6,
  },
  viewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  scriptView: {
    flex: 1,
  },
  scriptContent: {
    padding: 16,
  },
  scriptSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  scriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  scriptBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  scriptName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  scriptText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  practiceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  practiceText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    marginLeft: 10,
    lineHeight: 18,
  },
});
