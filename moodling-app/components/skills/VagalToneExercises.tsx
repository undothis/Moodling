/**
 * Vagal Tone Exercises
 *
 * Exercises that stimulate the vagus nerve to activate
 * the parasympathetic (calm-down) nervous system.
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

interface Exercise {
  id: string;
  name: string;
  emoji: string;
  duration: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  description: string;
  steps: string[];
  why: string;
}

const EXERCISES: Exercise[] = [
  {
    id: 'cold_face',
    name: 'Cold Water on Face',
    emoji: '💧',
    duration: '30-60 sec',
    difficulty: 'easy',
    description: 'Triggers the dive reflex, instantly calming your heart rate',
    steps: [
      'Get very cold water (add ice if available)',
      'Hold your breath',
      'Splash or submerge your face, especially forehead and cheeks',
      'Hold for 30 seconds if you can',
      'Breathe normally after',
    ],
    why: 'Cold water on the face triggers the mammalian dive reflex, which slows heart rate and redirects blood to vital organs. This is one of the fastest ways to activate the vagus nerve.',
  },
  {
    id: 'humming',
    name: 'Humming / Chanting',
    emoji: '🎵',
    duration: '2-5 min',
    difficulty: 'easy',
    description: 'Vibrations from your voice stimulate the vagus nerve',
    steps: [
      'Take a deep breath in',
      'As you exhale, hum steadily (or chant "Om")',
      'Feel the vibration in your throat and chest',
      'Extend the hum as long as comfortable',
      'Repeat 5-10 times',
    ],
    why: 'The vagus nerve passes through the throat. The vibrations from humming, singing, or chanting directly stimulate it. This is why chanting is used in many meditation traditions.',
  },
  {
    id: 'gargling',
    name: 'Gargling',
    emoji: '🚰',
    duration: '1-2 min',
    difficulty: 'easy',
    description: 'Activates muscles connected to the vagus nerve',
    steps: [
      'Get a glass of water',
      'Take a sip and tilt your head back',
      'Gargle vigorously until you need to breathe',
      'Spit and repeat',
      'Do this 3-5 times',
    ],
    why: 'Gargling activates the muscles at the back of the throat, which are connected to the vagus nerve. This sends calming signals to your brain.',
  },
  {
    id: 'physiological_sigh',
    name: 'Physiological Sigh',
    emoji: '😮‍💨',
    duration: '1 min',
    difficulty: 'easy',
    description: 'The fastest known breathing technique to calm down',
    steps: [
      'Take a deep breath in through your nose',
      'At the top, take another small "sip" of air',
      'Hold for a moment',
      'Let it all out slowly through your mouth',
      'Repeat 3-5 times',
    ],
    why: 'Research by Dr. Andrew Huberman shows this is the fastest way to reduce stress in real-time. The double inhale fully inflates the alveoli in your lungs, and the long exhale activates the parasympathetic system.',
  },
  {
    id: 'ear_massage',
    name: 'Ear Massage',
    emoji: '👂',
    duration: '2-3 min',
    difficulty: 'easy',
    description: 'Stimulates vagus nerve branches in the ear',
    steps: [
      'Gently rub the outer rim of your ears',
      'Pay special attention to the inner curves',
      'Use your thumb behind the ear, fingers in front',
      'Massage in small circles',
      'Work from top to bottom and back',
    ],
    why: 'The auricular branch of the vagus nerve runs through the ear. Massage here can stimulate the vagus and promote relaxation.',
  },
  {
    id: 'slow_exhale',
    name: 'Extended Exhale Breathing',
    emoji: '🌬️',
    duration: '3-5 min',
    difficulty: 'easy',
    description: 'Exhaling longer than inhaling activates calm',
    steps: [
      'Breathe in for 4 counts',
      'Breathe out for 8 counts (or as long as comfortable)',
      'The exhale should be at least twice as long as inhale',
      'Keep your breathing smooth and gentle',
      'Continue for 10+ breaths',
    ],
    why: 'Exhaling activates the parasympathetic nervous system via the vagus nerve. The longer the exhale relative to inhale, the stronger the calming effect.',
  },
  {
    id: 'voo_breath',
    name: '"Voo" Breath',
    emoji: '🔊',
    duration: '2-3 min',
    difficulty: 'medium',
    description: 'Deep sound vibration for trauma release',
    steps: [
      'Take a deep belly breath',
      'On the exhale, make a low "voooo" sound',
      'Feel the vibration in your belly and chest',
      'Let the sound continue until you run out of breath',
      'Rest and repeat 5-10 times',
    ],
    why: 'Developed by trauma therapist Peter Levine, the "voo" sound creates deep vibrations that help release tension held in the body and stimulate the vagus nerve.',
  },
  {
    id: 'eye_movements',
    name: 'Basic Eye Exercise',
    emoji: '👀',
    duration: '1-2 min',
    difficulty: 'medium',
    description: 'Eye movements can influence vagal tone',
    steps: [
      'Interlace your fingers behind your head',
      'Keep your head still, looking forward',
      'Move your eyes to look right (don\'t turn head)',
      'Hold for 30-60 seconds until you sigh or yawn',
      'Return to center, then look left and repeat',
    ],
    why: 'This position and eye movement pattern can activate the parasympathetic nervous system and release neck tension.',
  },
];

interface VagalToneExercisesProps {
  onClose?: () => void;
}

export default function VagalToneExercises({ onClose }: VagalToneExercisesProps) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'advanced'>('all');

  const filtered = filter === 'all'
    ? EXERCISES
    : EXERCISES.filter((e) => e.difficulty === filter);

  if (selectedExercise) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedExercise(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{selectedExercise.name}</Text>
            <Text style={styles.subtitle}>{selectedExercise.duration}</Text>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.exerciseDetail}>
            <Text style={styles.exerciseEmoji}>{selectedExercise.emoji}</Text>
            <Text style={styles.exerciseDescription}>{selectedExercise.description}</Text>

            <View style={styles.stepsSection}>
              <Text style={styles.sectionTitle}>How to do it:</Text>
              {selectedExercise.steps.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            <View style={styles.whySection}>
              <Text style={styles.sectionTitle}>Why this works:</Text>
              <Text style={styles.whyText}>{selectedExercise.why}</Text>
            </View>

            <TouchableOpacity
              style={styles.tryButton}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Vibration.vibrate(30);
                }
              }}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.tryButtonText}>Start Exercise</Text>
            </TouchableOpacity>
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
          <Text style={styles.title}>Vagal Tone</Text>
          <Text style={styles.subtitle}>Activate your calm-down system</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Intro */}
      <View style={styles.introBox}>
        <Ionicons name="heart-outline" size={20} color="#6366F1" />
        <Text style={styles.introText}>
          The vagus nerve is your body's main "calm down" signal. These exercises
          stimulate it to help you relax, reduce heart rate, and feel safer.
        </Text>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        {(['all', 'easy', 'medium'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Exercise list */}
      <ScrollView style={styles.content} contentContainerStyle={styles.listContainer}>
        {filtered.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={styles.exerciseCard}
            onPress={() => setSelectedExercise(exercise)}
          >
            <Text style={styles.cardEmoji}>{exercise.emoji}</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{exercise.name}</Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {exercise.description}
              </Text>
              <View style={styles.cardMeta}>
                <View style={styles.durationBadge}>
                  <Ionicons name="time-outline" size={12} color="#64748B" />
                  <Text style={styles.durationText}>{exercise.duration}</Text>
                </View>
                <View style={[
                  styles.difficultyBadge,
                  exercise.difficulty === 'easy' && styles.difficultyEasy,
                  exercise.difficulty === 'medium' && styles.difficultyMedium,
                ]}>
                  <Text style={styles.difficultyText}>{exercise.difficulty}</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        ))}
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
  introBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    padding: 14,
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  introText: {
    flex: 1,
    fontSize: 13,
    color: '#4338CA',
    marginLeft: 10,
    lineHeight: 18,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#6366F1',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  contentContainer: {
    padding: 16,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  cardEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  durationText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  difficultyEasy: {
    backgroundColor: '#DCFCE7',
  },
  difficultyMedium: {
    backgroundColor: '#FEF3C7',
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'capitalize',
  },
  exerciseDetail: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  exerciseEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  exerciseDescription: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  stepsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  whySection: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  whyText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  tryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 12,
  },
  tryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});
