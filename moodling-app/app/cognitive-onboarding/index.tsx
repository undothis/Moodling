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
  OnboardingQuestion,
} from '@/services/cognitiveProfileService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CognitiveOnboardingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [currentQuestion, setCurrentQuestion] = useState<OnboardingQuestion | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [totalEstimate, setTotalEstimate] = useState(8);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadNextQuestion();
  }, []);

  const loadNextQuestion = async () => {
    setIsLoading(true);
    try {
      const question = await getNextOnboardingQuestion();
      if (question) {
        setCurrentQuestion(question);
        setSelectedAnswer(null);
        setQuestionCount(prev => prev + 1);
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

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -SCREEN_WIDTH,
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
      slideAnim.setValue(SCREEN_WIDTH);
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
      ]).start();
    });
  };

  const handleSelectAnswer = async (answerId: string) => {
    if (!currentQuestion) return;

    setSelectedAnswer(answerId);

    // Small delay to show selection
    setTimeout(async () => {
      try {
        await recordOnboardingAnswer(currentQuestion.id, answerId);
        animateTransition(loadNextQuestion);
      } catch (error) {
        console.error('Failed to record answer:', error);
      }
    }, 300);
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/coach');
  };

  const progress = questionCount / totalEstimate;

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
                { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: colors.tint },
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

      {/* Intro text */}
      <View style={styles.introContainer}>
        <Text style={[styles.introEmoji]}>
          {questionCount === 1 ? '🌱' : '💭'}
        </Text>
        <Text style={[styles.introText, { color: colors.textSecondary }]}>
          {questionCount === 1
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

      {/* Footer hint */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
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
  introEmoji: {
    fontSize: 32,
    marginBottom: 8,
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
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
