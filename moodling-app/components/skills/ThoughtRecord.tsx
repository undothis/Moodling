/**
 * Thought Record
 *
 * CBT tool for examining and reframing thoughts.
 * Helps users notice thinking patterns without judgment.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THOUGHT_RECORDS_KEY = 'mood_leaf_thought_records';

interface ThoughtRecordEntry {
  id: string;
  timestamp: string;
  situation: string;
  automaticThought: string;
  emotions: string;
  emotionIntensity: number;
  evidenceFor: string;
  evidenceAgainst: string;
  balancedThought: string;
  newEmotionIntensity: number;
}

interface ThoughtRecordProps {
  onClose?: () => void;
}

export default function ThoughtRecord({ onClose }: ThoughtRecordProps) {
  const [step, setStep] = useState(0);
  const [record, setRecord] = useState<Partial<ThoughtRecordEntry>>({
    emotionIntensity: 50,
    newEmotionIntensity: 50,
  });
  const [savedRecords, setSavedRecords] = useState<ThoughtRecordEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const steps = [
    {
      title: 'What happened?',
      emoji: '📍',
      field: 'situation' as const,
      placeholder: 'Describe the situation briefly. What were you doing? Who was there?',
      hint: 'Focus on facts, not interpretations.',
    },
    {
      title: 'What went through your mind?',
      emoji: '💭',
      field: 'automaticThought' as const,
      placeholder: 'What thoughts popped up? What were you telling yourself?',
      hint: 'Try to capture the exact words, even if they seem irrational.',
    },
    {
      title: 'How did you feel?',
      emoji: '💗',
      field: 'emotions' as const,
      placeholder: 'Name the emotions (e.g., anxious, sad, angry, ashamed)',
      hint: 'There might be more than one feeling.',
      hasIntensity: true,
      intensityField: 'emotionIntensity' as const,
    },
    {
      title: 'Evidence that supports this thought?',
      emoji: '✓',
      field: 'evidenceFor' as const,
      placeholder: 'What facts support this thought being true?',
      hint: 'Stick to objective facts, not feelings or assumptions.',
    },
    {
      title: 'Evidence against this thought?',
      emoji: '✗',
      field: 'evidenceAgainst' as const,
      placeholder: 'What facts suggest this thought might not be 100% true?',
      hint: 'What would you tell a friend who had this thought?',
    },
    {
      title: 'A more balanced thought?',
      emoji: '⚖️',
      field: 'balancedThought' as const,
      placeholder: 'Considering all evidence, what\'s a more balanced way to see this?',
      hint: 'This doesn\'t have to be positive - just more realistic.',
      hasIntensity: true,
      intensityField: 'newEmotionIntensity' as const,
      intensityLabel: 'How intense are those feelings now?',
    },
  ];

  // Load saved records
  useEffect(() => {
    AsyncStorage.getItem(THOUGHT_RECORDS_KEY).then((stored) => {
      if (stored) {
        setSavedRecords(JSON.parse(stored));
      }
    });
  }, []);

  // Save record
  const saveRecord = async () => {
    const newRecord: ThoughtRecordEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      situation: record.situation || '',
      automaticThought: record.automaticThought || '',
      emotions: record.emotions || '',
      emotionIntensity: record.emotionIntensity || 50,
      evidenceFor: record.evidenceFor || '',
      evidenceAgainst: record.evidenceAgainst || '',
      balancedThought: record.balancedThought || '',
      newEmotionIntensity: record.newEmotionIntensity || 50,
    };

    const updated = [newRecord, ...savedRecords].slice(0, 50); // Keep last 50
    await AsyncStorage.setItem(THOUGHT_RECORDS_KEY, JSON.stringify(updated));
    setSavedRecords(updated);

    // Reset
    setRecord({ emotionIntensity: 50, newEmotionIntensity: 50 });
    setStep(0);
  };

  const currentStep = steps[step];

  if (showHistory) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Past Records</Text>
            <Text style={styles.subtitle}>{savedRecords.length} entries</Text>
          </View>
        </View>

        <ScrollView style={styles.historyList}>
          {savedRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyText}>No records yet</Text>
              <Text style={styles.emptySubtext}>
                Complete a thought record to see it here
              </Text>
            </View>
          ) : (
            savedRecords.map((entry) => (
              <View key={entry.id} style={styles.historyCard}>
                <Text style={styles.historyDate}>
                  {new Date(entry.timestamp).toLocaleDateString()}
                </Text>
                <Text style={styles.historyThought} numberOfLines={2}>
                  "{entry.automaticThought}"
                </Text>
                <Text style={styles.historyBalanced} numberOfLines={2}>
                  → {entry.balancedThought}
                </Text>
                <View style={styles.historyIntensity}>
                  <Text style={styles.intensityLabel}>
                    Intensity: {entry.emotionIntensity}% → {entry.newEmotionIntensity}%
                  </Text>
                  {entry.newEmotionIntensity < entry.emotionIntensity && (
                    <Ionicons name="trending-down" size={14} color="#10B981" />
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Thought Record</Text>
          <Text style={styles.subtitle}>Examine your thoughts</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setShowHistory(true)} style={styles.historyButton}>
            <Ionicons name="time-outline" size={22} color="#64748B" />
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index <= step && styles.progressDotActive,
              index < step && styles.progressDotComplete,
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepEmoji}>{currentStep.emoji}</Text>
            <Text style={styles.stepTitle}>{currentStep.title}</Text>
          </View>

          <TextInput
            style={styles.textInput}
            multiline
            placeholder={currentStep.placeholder}
            placeholderTextColor="#94A3B8"
            value={record[currentStep.field] as string || ''}
            onChangeText={(text) => setRecord({ ...record, [currentStep.field]: text })}
            textAlignVertical="top"
          />

          <View style={styles.hintBox}>
            <Ionicons name="bulb-outline" size={14} color="#F59E0B" />
            <Text style={styles.hintText}>{currentStep.hint}</Text>
          </View>

          {/* Intensity slider for emotions */}
          {currentStep.hasIntensity && (
            <View style={styles.intensitySection}>
              <Text style={styles.intensityLabel}>
                {currentStep.intensityLabel || 'How intense are these feelings? (0-100)'}
              </Text>
              <View style={styles.intensityRow}>
                <TouchableOpacity
                  style={styles.intensityButton}
                  onPress={() => {
                    const field = currentStep.intensityField!;
                    const current = (record[field] as number) || 50;
                    setRecord({ ...record, [field]: Math.max(0, current - 10) });
                  }}
                >
                  <Ionicons name="remove" size={20} color="#64748B" />
                </TouchableOpacity>
                <View style={styles.intensityDisplay}>
                  <Text style={styles.intensityValue}>
                    {record[currentStep.intensityField!] || 50}%
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.intensityButton}
                  onPress={() => {
                    const field = currentStep.intensityField!;
                    const current = (record[field] as number) || 50;
                    setRecord({ ...record, [field]: Math.min(100, current + 10) });
                  }}
                >
                  <Ionicons name="add" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Completion summary */}
        {step === steps.length - 1 && record.balancedThought && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Notice any shift?</Text>
            <View style={styles.summaryComparison}>
              <View style={styles.summaryColumn}>
                <Text style={styles.summaryLabel}>Before</Text>
                <Text style={styles.summaryIntensity}>
                  {record.emotionIntensity || 50}%
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#94A3B8" />
              <View style={styles.summaryColumn}>
                <Text style={styles.summaryLabel}>After</Text>
                <Text style={[
                  styles.summaryIntensity,
                  (record.newEmotionIntensity || 50) < (record.emotionIntensity || 50) && styles.summaryImproved,
                ]}>
                  {record.newEmotionIntensity || 50}%
                </Text>
              </View>
            </View>
            <Text style={styles.summaryNote}>
              Whatever you notice is okay. Sometimes just examining thoughts helps,
              even if the intensity doesn't change much right away.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, step === 0 && styles.navButtonDisabled]}
          onPress={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <Ionicons name="chevron-back" size={20} color={step === 0 ? '#CBD5E1' : '#6366F1'} />
          <Text style={[styles.navText, step === 0 && styles.navTextDisabled]}>Back</Text>
        </TouchableOpacity>

        {step < steps.length - 1 ? (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setStep((s) => s + 1)}
          >
            <Text style={styles.navText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="#6366F1" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveRecord}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.saveText}>Save Record</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyButton: {
    padding: 8,
    marginRight: 4,
  },
  closeButton: {
    padding: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#6366F1',
  },
  progressDotComplete: {
    backgroundColor: '#10B981',
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
    alignItems: 'center',
    marginBottom: 16,
  },
  stepEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#334155',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    lineHeight: 16,
  },
  intensitySection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  intensityLabel: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    textAlign: 'center',
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityDisplay: {
    paddingHorizontal: 24,
  },
  intensityValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  summaryCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4338CA',
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  summaryColumn: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6366F1',
    marginBottom: 4,
  },
  summaryIntensity: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  summaryImproved: {
    color: '#10B981',
  },
  summaryNote: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  historyList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
  },
  historyThought: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  historyBalanced: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 8,
  },
  historyIntensity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
