/**
 * Exercise Player Component
 *
 * Guides users through exercises like breathing, grounding, and body scans.
 * Features animated visuals, step-by-step instructions, and progress tracking.
 *
 * Following Mood Leaf Ethics:
 * - User controls the pace
 * - Can exit anytime without penalty
 * - Celebrates completion without pressure
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  Exercise,
  ExerciseStep,
  recordSkillUsage,
  getEncouragementMessage,
  getSkillProgress,
} from '@/services/skillsService';

// ============================================
// PROPS
// ============================================

interface ExercisePlayerProps {
  exercise: Exercise;
  visible: boolean;
  onClose: () => void;
  onComplete: (rating?: number) => void;
}

type PlayerState = 'intro' | 'playing' | 'paused' | 'step_complete' | 'finished';

// ============================================
// COMPONENT
// ============================================

export default function ExercisePlayer({
  exercise,
  visible,
  onClose,
  onComplete,
}: ExercisePlayerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // State
  const [playerState, setPlayerState] = useState<PlayerState>('intro');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState(0);
  const [completionMessage, setCompletionMessage] = useState('');
  const [selectedRating, setSelectedRating] = useState<number | undefined>();

  // Animation
  const circleScale = useRef(new Animated.Value(1)).current;
  const circleOpacity = useRef(new Animated.Value(0.8)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentStep = exercise.steps[currentStepIndex];
  const isLastStep = currentStepIndex >= exercise.steps.length - 1;

  // Reset on exercise change
  useEffect(() => {
    if (visible) {
      resetPlayer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, exercise.id]);

  // Timer logic
  useEffect(() => {
    if (playerState === 'playing' && currentStep?.duration) {
      setSecondsRemaining(currentStep.duration);

      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Step complete
            if (timerRef.current) clearInterval(timerRef.current);
            handleStepComplete();
            return 0;
          }
          return prev - 1;
        });

        setTotalSecondsElapsed((prev) => prev + 1);
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [playerState, currentStepIndex]);

  // Breathing animation
  useEffect(() => {
    if (playerState === 'playing' && currentStep) {
      runStepAnimation(currentStep);
    }
  }, [playerState, currentStepIndex]);

  // ============================================
  // HELPERS
  // ============================================

  const resetPlayer = () => {
    setPlayerState('intro');
    setCurrentStepIndex(0);
    setSecondsRemaining(0);
    setTotalSecondsElapsed(0);
    setSelectedRating(undefined);
    circleScale.setValue(1);
    circleOpacity.setValue(0.8);
  };

  const runStepAnimation = (step: ExerciseStep) => {
    circleScale.stopAnimation();
    circleOpacity.stopAnimation();

    const duration = (step.duration || 4) * 1000;

    if (step.visualType === 'circle_expand') {
      // Expand animation
      Animated.parallel([
        Animated.timing(circleScale, {
          toValue: 1.5,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(circleOpacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (step.visualType === 'circle_shrink') {
      // Shrink animation
      Animated.parallel([
        Animated.timing(circleScale, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(circleOpacity, {
          toValue: 0.6,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleStepComplete = () => {
    if (isLastStep) {
      // Repeat the cycle or finish based on total time
      if (totalSecondsElapsed < (exercise.duration || 60)) {
        // Cycle back to first step
        setCurrentStepIndex(0);
      } else {
        handleFinish();
      }
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleTapToContinue = () => {
    if (playerState === 'intro') {
      setPlayerState('playing');
    } else if (playerState === 'playing' && !currentStep?.duration) {
      // Step that requires tap to continue
      if (isLastStep) {
        handleFinish();
      } else {
        setCurrentStepIndex((prev) => prev + 1);
      }
    }
  };

  const handleFinish = async () => {
    setPlayerState('finished');

    // Record usage
    const skillId = getSkillIdForExercise(exercise.type);
    if (skillId) {
      await recordSkillUsage(
        skillId,
        exercise.id,
        true, // completed
        totalSecondsElapsed,
        selectedRating
      );

      // Get encouragement message
      const progress = await getSkillProgress(skillId);
      setCompletionMessage(getEncouragementMessage(progress));
    }
  };

  const handleClose = () => {
    // If they're partway through, record partial completion
    if (playerState === 'playing' && totalSecondsElapsed > 10) {
      const skillId = getSkillIdForExercise(exercise.type);
      if (skillId) {
        recordSkillUsage(
          skillId,
          exercise.id,
          false, // not completed
          totalSecondsElapsed
        );
      }
    }

    resetPlayer();
    onClose();
  };

  const handleRatingAndClose = () => {
    onComplete(selectedRating);
    resetPlayer();
    onClose();
  };

  const getSkillIdForExercise = (type: string): string | null => {
    const mapping: Record<string, string> = {
      breathing: 'breathing',
      grounding: 'grounding',
      body_scan: 'body_awareness',
      thought_challenge: 'thought_challenging',
      social_prep: 'social_prep',
    };
    return mapping[type] || null;
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderIntro = () => (
    <View style={styles.introContainer}>
      <Text style={styles.exerciseEmoji}>{exercise.emoji}</Text>
      <Text style={[styles.exerciseName, { color: colors.text }]}>
        {exercise.name}
      </Text>
      <Text style={[styles.exerciseDescription, { color: colors.textSecondary }]}>
        {exercise.description}
      </Text>
      <Text style={[styles.exerciseDuration, { color: colors.textMuted }]}>
        ~{Math.round(exercise.duration / 60)} minute{exercise.duration > 60 ? 's' : ''}
      </Text>

      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: colors.tint }]}
        onPress={handleTapToContinue}
      >
        <Text style={styles.startButtonText}>Begin</Text>
      </TouchableOpacity>

      <Text style={[styles.tapHint, { color: colors.textMuted }]}>
        You can exit anytime — no pressure.
      </Text>
    </View>
  );

  const renderBreathingCircle = () => (
    <View style={styles.circleContainer}>
      <Animated.View
        style={[
          styles.breathingCircle,
          {
            backgroundColor: colors.tint,
            opacity: circleOpacity,
            transform: [{ scale: circleScale }],
          },
        ]}
      />
      <View style={styles.circleContent}>
        <Text style={[styles.stepInstruction, { color: colors.text }]}>
          {currentStep?.instruction}
        </Text>
        {currentStep?.duration && (
          <Text style={[styles.stepTimer, { color: colors.textMuted }]}>
            {secondsRemaining}
          </Text>
        )}
      </View>
    </View>
  );

  const renderTextStep = () => (
    <TouchableOpacity
      style={styles.textStepContainer}
      onPress={handleTapToContinue}
      activeOpacity={0.9}
    >
      <Text style={[styles.stepInstruction, { color: colors.text }]}>
        {currentStep?.instruction}
      </Text>
      {currentStep?.duration ? (
        <Text style={[styles.stepTimer, { color: colors.textMuted }]}>
          {secondsRemaining}s
        </Text>
      ) : (
        <Text style={[styles.tapToContinue, { color: colors.tint }]}>
          Tap to continue
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderProgressBar = () => {
    const progress =
      exercise.duration > 0 ? totalSecondsElapsed / exercise.duration : 0;

    return (
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: colors.tint,
                width: `${Math.min(progress * 100, 100)}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textMuted }]}>
          {Math.floor(totalSecondsElapsed / 60)}:
          {(totalSecondsElapsed % 60).toString().padStart(2, '0')}
        </Text>
      </View>
    );
  };

  const renderPlaying = () => {
    const isBreathing =
      currentStep?.visualType === 'circle_expand' ||
      currentStep?.visualType === 'circle_shrink';

    return (
      <View style={styles.playingContainer}>
        {isBreathing ? renderBreathingCircle() : renderTextStep()}
        {renderProgressBar()}
      </View>
    );
  };

  const renderFinished = () => (
    <View style={styles.finishedContainer}>
      <Text style={styles.finishedEmoji}>✨</Text>
      <Text style={[styles.finishedTitle, { color: colors.text }]}>
        Well done
      </Text>
      <Text style={[styles.finishedMessage, { color: colors.textSecondary }]}>
        {completionMessage || 'You completed the exercise.'}
      </Text>

      {/* Rating */}
      <Text style={[styles.ratingLabel, { color: colors.text }]}>
        How was that?
      </Text>
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.ratingButton,
              {
                backgroundColor:
                  selectedRating === rating ? colors.tint : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setSelectedRating(rating)}
          >
            <Text style={styles.ratingEmoji}>
              {rating === 1 ? '😔' : rating === 2 ? '😕' : rating === 3 ? '😐' : rating === 4 ? '🙂' : '😊'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: colors.tint }]}
        onPress={handleRatingAndClose}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          {playerState === 'playing' && (
            <TouchableOpacity
              style={[styles.pauseButton, { backgroundColor: colors.card }]}
              onPress={() =>
                setPlayerState(playerState === 'playing' ? 'paused' : 'playing')
              }
            >
              <Ionicons
                name={playerState === 'playing' ? 'pause' : 'play'}
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {playerState === 'intro' && renderIntro()}
          {(playerState === 'playing' || playerState === 'paused') &&
            renderPlaying()}
          {playerState === 'finished' && renderFinished()}
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  pauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  // Intro
  introContainer: {
    alignItems: 'center',
    width: '100%',
  },
  exerciseEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  exerciseDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  exerciseDuration: {
    fontSize: 14,
    marginBottom: 32,
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    marginBottom: 16,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  tapHint: {
    fontSize: 13,
  },

  // Playing
  playingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  // Breathing Circle
  circleContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  breathingCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  circleContent: {
    alignItems: 'center',
  },
  stepInstruction: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepTimer: {
    fontSize: 48,
    fontWeight: '300',
  },

  // Text Step
  textStepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 100,
  },
  tapToContinue: {
    fontSize: 15,
    marginTop: 24,
    fontWeight: '500',
  },

  // Progress Bar
  progressBarContainer: {
    position: 'absolute',
    bottom: 100,
    left: 32,
    right: 32,
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    marginTop: 8,
    fontSize: 13,
  },

  // Finished
  finishedContainer: {
    alignItems: 'center',
    width: '100%',
  },
  finishedEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  finishedTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  finishedMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  ratingLabel: {
    fontSize: 15,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  ratingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  ratingEmoji: {
    fontSize: 24,
  },
  doneButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
