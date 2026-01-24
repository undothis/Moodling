/**
 * Cognitive Profile Onboarding
 *
 * Discovers HOW someone thinks - not IF they're smart.
 * This builds the MoodPrint - the unique fingerprint of how
 * someone processes information, emotions, and communication.
 *
 * Philosophy:
 * - No jargon (no MBTI, no clinical labels)
 * - Questions adapt based on responses
 * - Creates "aha, that's me" moment
 * - Empowers, doesn't label
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  Animated,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import {
  getNextOnboardingQuestion,
  recordOnboardingAnswer,
  completeOnboarding,
  getOnboardingProgressInfo,
  OnboardingQuestion,
} from '@/services/cognitiveProfileService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CognitiveOnboardingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [currentQuestion, setCurrentQuestion] = useState<OnboardingQuestion | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // History for back navigation
  const [questionHistory, setQuestionHistory] = useState<OnboardingQuestion[]>([]);
  const [answerHistory, setAnswerHistory] = useState<{ questionId: string; answer: string }[]>([]);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadNextQuestion();
  }, []);

  const loadNextQuestion = async () => {
    setIsLoading(true);
    try {
      // Update progress info
      const progressInfo = await getOnboardingProgressInfo();
      setProgressPercent(progressInfo.progressPercent);
      setQuestionNumber(progressInfo.answeredCount + 1);
      setTotalQuestions(progressInfo.totalAtCurrentDepth);

      const question = await getNextOnboardingQuestion();
      if (question) {
        setCurrentQuestion(question);
        setSelectedAnswer(null);
      } else {
        // No more questions - complete and go straight to coach chat
        await completeOnboarding();
        router.replace('/coach');
      }
    } catch (error) {
      console.error('Failed to load question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const animateTransition = (direction: 'next' | 'back', callback: () => void) => {
    const toValue = direction === 'next' ? -SCREEN_WIDTH : SCREEN_WIDTH;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(direction === 'next' ? SCREEN_WIDTH : -SCREEN_WIDTH);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsTransitioning(false);
      });
    });
  };

  const handleSelectAnswer = async (answerId: string) => {
    if (!currentQuestion || isTransitioning) return;

    setSelectedAnswer(answerId);
    setIsTransitioning(true);

    // Small delay to show selection
    setTimeout(async () => {
      try {
        // Save to history before moving on
        setQuestionHistory(prev => [...prev, currentQuestion]);
        setAnswerHistory(prev => [...prev, { questionId: currentQuestion.id, answer: answerId }]);

        await recordOnboardingAnswer(currentQuestion.id, answerId);
        animateTransition('next', loadNextQuestion);
      } catch (error) {
        console.error('Failed to record answer:', error);
        setIsTransitioning(false);
      }
    }, 300);
  };

  const handleBack = async () => {
    if (questionHistory.length === 0 || isTransitioning) return;

    setIsTransitioning(true);

    animateTransition('back', async () => {
      // Pop the last question from history
      const newHistory = [...questionHistory];
      const previousQuestion = newHistory.pop();

      // Pop the last answer from history
      const newAnswerHistory = [...answerHistory];
      newAnswerHistory.pop();

      setQuestionHistory(newHistory);
      setAnswerHistory(newAnswerHistory);

      if (previousQuestion) {
        setCurrentQuestion(previousQuestion);
        setSelectedAnswer(null);
        // Update progress (will be slightly lower going back)
        const progressInfo = await getOnboardingProgressInfo();
        setProgressPercent(Math.max(0, progressInfo.progressPercent - 5)); // Approximate back
        setQuestionNumber(prev => Math.max(1, prev - 1));
      }
    });
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/coach');
  };

  if (isLoading && !currentQuestion) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Preparing your questions...
          </Text>
        </View>
      </View>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progressPercent, 100)}%`, backgroundColor: colors.tint },
              ]}
            />
          </View>
        </View>
        <Pressable onPress={handleSkip} hitSlop={20}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Skip
          </Text>
        </Pressable>
      </View>

      {/* Question counter and intro */}
      <View style={styles.introContainer}>
        {totalQuestions > 0 && (
          <Text style={[styles.questionCounter, { color: colors.text }]}>
            Question {questionNumber} of {totalQuestions}
          </Text>
        )}
        <Text style={[styles.introText, { color: colors.textSecondary }]}>
          {progressPercent < 10
            ? "Let's discover how your mind works"
            : 'Take your time with this'}
        </Text>
      </View>

      {/* Question */}
      <Animated.View
        style={[
          styles.questionContainer,
          {
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <Text style={[styles.questionText, { color: colors.text }]}>
          {currentQuestion.text}
        </Text>
        {currentQuestion.subtext && (
          <Text style={[styles.subtextText, { color: colors.textSecondary }]}>
            {currentQuestion.subtext}
          </Text>
        )}

        <ScrollView
          style={styles.optionsScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.optionsContainer}
        >
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option.value;

            return (
              <Pressable
                key={option.value}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isSelected
                      ? colorScheme === 'dark'
                        ? 'rgba(76, 175, 80, 0.2)'
                        : 'rgba(76, 175, 80, 0.1)'
                      : colors.cardBackground,
                    borderColor: isSelected ? colors.tint : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => handleSelectAnswer(option.value)}
                disabled={selectedAnswer !== null}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <View
                      style={[styles.checkmark, { backgroundColor: colors.tint }]}
                    >
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </View>
                {option.description && (
                  <Text
                    style={[styles.optionDescription, { color: colors.textSecondary }]}
                  >
                    {option.description}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Navigation */}
      <View style={[styles.navigation, { paddingBottom: insets.bottom + 10 }]}>
        {questionHistory.length > 0 ? (
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
            disabled={isTransitioning}
          >
            <Text style={[styles.backText, { color: colors.textSecondary }]}>
              ← Back
            </Text>
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
      </View>

      {/* Footer hint */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          There are no wrong answers. This is discovery, not a test.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  progressContainer: {
    flex: 1,
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
  },
  introContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  questionCounter: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  introText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  questionContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 32,
    textAlign: 'center',
  },
  subtextText: {
    fontSize: 15,
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  optionsScroll: {
    flex: 1,
  },
  optionsContainer: {
    paddingBottom: 20,
    gap: 12,
  },
  optionCard: {
    padding: 16,
    borderRadius: 12,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  optionDescription: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backButton: {
    width: 80,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
