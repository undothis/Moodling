/**
 * TIPP Skills
 *
 * DBT distress tolerance technique: Temperature, Intense Exercise,
 * Paced Breathing, Paired Muscle Relaxation.
 *
 * Presented as options to explore, not prescriptions.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TIPPStep {
  letter: string;
  name: string;
  emoji: string;
  color: string;
  what: string;
  why: string;
  options: string[];
  note?: string;
}

const TIPP_STEPS: TIPPStep[] = [
  {
    letter: 'T',
    name: 'Temperature',
    emoji: '🧊',
    color: '#0EA5E9',
    what: 'Changing your body temperature quickly',
    why: 'Cold activates your dive reflex, which naturally slows your heart rate and calms your nervous system.',
    options: [
      'Hold ice cubes in your hands',
      'Splash cold water on your face',
      'Put a cold pack on the back of your neck',
      'Step outside if it\'s cold',
      'Take a cold shower',
    ],
    note: 'Some people find even 30 seconds of cold can shift how they feel.',
  },
  {
    letter: 'I',
    name: 'Intense Exercise',
    emoji: '🏃',
    color: '#EF4444',
    what: 'Short bursts of physical activity',
    why: 'Exercise metabolizes stress hormones (cortisol, adrenaline) that are flooding your system during distress.',
    options: [
      'Jumping jacks for 2 minutes',
      'Run up and down stairs',
      'Do push-ups or squats',
      'Dance vigorously to music',
      'Sprint in place',
    ],
    note: 'The goal is intensity, not duration. Even 2-5 minutes can make a difference.',
  },
  {
    letter: 'P',
    name: 'Paced Breathing',
    emoji: '🌬️',
    color: '#10B981',
    what: 'Slowing down your exhale',
    why: 'Long exhales activate your parasympathetic nervous system (rest-and-digest), counteracting fight-or-flight.',
    options: [
      'Breathe in for 4, out for 8',
      'Physiological sigh: double inhale, long exhale',
      'Box breathing: 4-4-4-4',
      'Breathe out like blowing through a straw',
      'Hum or sing on the exhale (activates vagus nerve)',
    ],
    note: 'The exhale is more important than the inhale for calming.',
  },
  {
    letter: 'P',
    name: 'Paired Muscle Relaxation',
    emoji: '💪',
    color: '#8B5CF6',
    what: 'Tensing and releasing muscle groups',
    why: 'Physical tension often accompanies emotional distress. Releasing it can help release the emotion too.',
    options: [
      'Clench fists tightly for 5 seconds, then release',
      'Scrunch your face, hold, then relax',
      'Push your palms together hard, then let go',
      'Curl your toes, hold, release',
      'Tense your whole body at once, then melt',
    ],
    note: 'Pair the muscle release with a long exhale for combined effect.',
  },
];

interface TIPPSkillsProps {
  onClose?: () => void;
}

export default function TIPPSkills({ onClose }: TIPPSkillsProps) {
  const [selectedStep, setSelectedStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const markComplete = (index: number) => {
    setCompletedSteps((prev) => {
      const updated = new Set(prev);
      if (updated.has(index)) {
        updated.delete(index);
      } else {
        updated.add(index);
        if (Platform.OS !== 'web') {
          Vibration.vibrate(30);
        }
      }
      return updated;
    });
  };

  const currentStep = TIPP_STEPS[selectedStep];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>TIPP Skills</Text>
          <Text style={styles.subtitle}>DBT distress tolerance toolkit</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* TIPP letters */}
      <View style={styles.lettersContainer}>
        {TIPP_STEPS.map((step, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.letterButton,
              { borderColor: step.color },
              selectedStep === index && { backgroundColor: step.color + '15' },
              completedSteps.has(index) && styles.letterCompleted,
            ]}
            onPress={() => setSelectedStep(index)}
          >
            <Text style={[styles.letter, { color: step.color }]}>{step.letter}</Text>
            <Text style={styles.letterEmoji}>{step.emoji}</Text>
            <Text style={[styles.letterName, { color: step.color }]}>{step.name}</Text>
            {completedSteps.has(index) && (
              <View style={[styles.checkBadge, { backgroundColor: step.color }]}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Current step card */}
        <View style={[styles.stepCard, { borderTopColor: currentStep.color }]}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepEmoji}>{currentStep.emoji}</Text>
            <View style={styles.stepHeaderText}>
              <Text style={[styles.stepTitle, { color: currentStep.color }]}>
                {currentStep.letter} - {currentStep.name}
              </Text>
              <Text style={styles.stepWhat}>{currentStep.what}</Text>
            </View>
          </View>

          {/* Why section */}
          <View style={styles.whySection}>
            <Text style={styles.whyLabel}>How it works:</Text>
            <Text style={styles.whyText}>{currentStep.why}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsSection}>
            <Text style={styles.optionsLabel}>Some options to explore:</Text>
            {currentStep.options.map((option, index) => (
              <View key={index} style={styles.optionRow}>
                <View style={[styles.optionDot, { backgroundColor: currentStep.color }]} />
                <Text style={styles.optionText}>{option}</Text>
              </View>
            ))}
          </View>

          {/* Note */}
          {currentStep.note && (
            <View style={styles.noteSection}>
              <Ionicons name="information-circle" size={16} color="#64748B" />
              <Text style={styles.noteText}>{currentStep.note}</Text>
            </View>
          )}

          {/* Mark complete */}
          <TouchableOpacity
            style={[
              styles.completeButton,
              { backgroundColor: completedSteps.has(selectedStep) ? currentStep.color : '#F1F5F9' },
            ]}
            onPress={() => markComplete(selectedStep)}
          >
            {completedSteps.has(selectedStep) ? (
              <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={[styles.completeText, { color: '#fff' }]}>Tried this</Text>
              </>
            ) : (
              <>
                <Ionicons name="add" size={18} color="#64748B" />
                <Text style={styles.completeText}>Mark as tried</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Philosophy note */}
        <View style={styles.philosophyBox}>
          <Text style={styles.philosophyText}>
            These are tools, not rules. You know your body best. Some techniques
            might resonate more than others - that's completely normal. Feel free
            to adapt or skip any that don't feel right for you.
          </Text>
        </View>

        {/* Progress */}
        <View style={styles.progressBox}>
          <Text style={styles.progressLabel}>
            {completedSteps.size === 0
              ? 'Explore at your own pace'
              : `Explored ${completedSteps.size} of ${TIPP_STEPS.length}`}
          </Text>
          <View style={styles.progressBar}>
            {TIPP_STEPS.map((step, index) => (
              <View
                key={index}
                style={[
                  styles.progressSegment,
                  { backgroundColor: completedSteps.has(index) ? step.color : '#E2E8F0' },
                ]}
              />
            ))}
          </View>
        </View>
      </ScrollView>
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
  lettersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  letterButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    position: 'relative',
  },
  letterCompleted: {
    opacity: 0.9,
  },
  letter: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  letterEmoji: {
    fontSize: 18,
    marginTop: 4,
  },
  letterName: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  checkBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderTopWidth: 4,
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
  stepEmoji: {
    fontSize: 36,
    marginRight: 12,
  },
  stepHeaderText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  stepWhat: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  whySection: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  whyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  whyText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  optionsSection: {
    marginBottom: 16,
  },
  optionsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  optionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  noteSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  completeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 6,
  },
  philosophyBox: {
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  philosophyText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
    textAlign: 'center',
  },
  progressBox: {
    marginTop: 16,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  progressBar: {
    flexDirection: 'row',
    width: '100%',
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
});
