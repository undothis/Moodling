/**
 * Coach Personality Onboarding
 *
 * A multi-step flow to help users customize their AI coach experience.
 * Following Moodling Ethics:
 * - User controls their experience
 * - No pressure, can skip
 * - Warm and inviting
 *
 * Unit 17: AI Coach Personality System
 */

import React, { useState, useRef } from 'react';
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
  ONBOARDING_QUESTIONS,
  OnboardingQuestion,
  recommendPersonaFromAnswers,
  mapAnswersToSettings,
  saveCoachSettings,
  completeOnboarding,
  getSettingsForPersona,
  PERSONAS,
  CoachPersona,
} from '@/services/coachPersonalityService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentQuestion = ONBOARDING_QUESTIONS[currentStep];
  const isLastStep = currentStep === ONBOARDING_QUESTIONS.length - 1;
  const progress = (currentStep + 1) / ONBOARDING_QUESTIONS.length;

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
      ]).start();
    });
  };

  const handleNext = async () => {
    if (isLastStep) {
      await finishOnboarding();
    } else {
      animateTransition('next', () => setCurrentStep((prev) => prev + 1));
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      animateTransition('back', () => setCurrentStep((prev) => prev - 1));
    }
  };

  const handleSkip = async () => {
    await finishOnboarding();
  };

  const finishOnboarding = async () => {
    try {
      // Determine persona based on answers
      const recommendedPersona = recommendPersonaFromAnswers(answers);
      const detailedSettings = mapAnswersToSettings(answers);

      // Save settings
      await saveCoachSettings({
        selectedPersona: recommendedPersona,
        detailedSettings: {
          ...getSettingsForPersona(recommendedPersona),
          ...detailedSettings,
        },
        useDetailedSettings: false,
        adaptiveSettings: {
          enabled: false,
          triggers: ['mood_detected', 'time_of_day'],
          basePersona: recommendedPersona,
          moodMappings: {
            anxious: 'luna',
            sad: 'fern',
            angry: 'flint',
            happy: 'spark',
            neutral: 'clover',
          },
        },
        onboardingAnswers: answers,
      });

      await completeOnboarding();

      // Navigate to tree (main hub)
      router.replace('/(tabs)/tree');
    } catch (error) {
      console.error('Failed to save onboarding:', error);
      router.replace('/(tabs)/tree');
    }
  };

  const handleSingleSelect = (optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleMultiSelect = (optionId: string) => {
    const current = (answers[currentQuestion.id] as string[]) || [];
    const isSelected = current.includes(optionId);

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: isSelected
        ? current.filter((id) => id !== optionId)
        : [...current, optionId],
    }));
  };

  const handleSliderSelect = (value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value.toString(),
    }));
  };

  const renderQuestion = (question: OnboardingQuestion) => {
    const selectedValue = answers[question.id];

    return (
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
          {question.question}
        </Text>
        {question.subtitle && (
          <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>
            {question.subtitle}
          </Text>
        )}

        <ScrollView
          style={styles.optionsScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.optionsContainer}
        >
          {question.type === 'slider' && question.sliderConfig ? (
            <View style={styles.sliderContainer}>
              {question.sliderConfig.labels.map((label, index) => {
                const isSelected = selectedValue === index.toString();
                return (
                  <Pressable
                    key={index}
                    style={[
                      styles.sliderOption,
                      {
                        backgroundColor: isSelected
                          ? colors.tint
                          : colors.cardBackground,
                        borderColor: isSelected ? colors.tint : colors.border,
                      },
                    ]}
                    onPress={() => handleSliderSelect(index)}
                  >
                    <Text
                      style={[
                        styles.sliderLabel,
                        { color: isSelected ? '#fff' : colors.text },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            question.options?.map((option) => {
              const isSelected =
                question.type === 'multi'
                  ? ((selectedValue as string[]) || []).includes(option.id)
                  : selectedValue === option.id;

              return (
                <Pressable
                  key={option.id}
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
                  onPress={() =>
                    question.type === 'multi'
                      ? handleMultiSelect(option.id)
                      : handleSingleSelect(option.id)
                  }
                >
                  <View style={styles.optionHeader}>
                    {option.emoji && (
                      <Text style={styles.optionEmoji}>{option.emoji}</Text>
                    )}
                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <View
                        style={[
                          styles.checkmark,
                          { backgroundColor: colors.tint },
                        ]}
                      >
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </View>
                  {option.description && (
                    <Text
                      style={[
                        styles.optionDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {option.description}
                    </Text>
                  )}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </Animated.View>
    );
  };

  const canProceed = () => {
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === 'multi') {
      return true; // Multi-select is optional
    }
    return answer !== undefined;
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: colors.tint },
            ]}
          />
        </View>
        <Pressable onPress={handleSkip} hitSlop={20}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Skip
          </Text>
        </Pressable>
      </View>

      {/* Question content */}
      {renderQuestion(currentQuestion)}

      {/* Navigation */}
      <View style={[styles.navigation, { paddingBottom: insets.bottom + 20 }]}>
        {currentStep > 0 ? (
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={[styles.backText, { color: colors.textSecondary }]}>
              ← Back
            </Text>
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}

        <Pressable
          style={[
            styles.nextButton,
            {
              backgroundColor: canProceed() ? colors.tint : colors.border,
              opacity: canProceed() ? 1 : 0.5,
            },
          ]}
          onPress={handleNext}
          disabled={!canProceed()}
        >
          <Text style={styles.nextText}>
            {isLastStep ? "Let's Go" : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  progressBg: {
    flex: 1,
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
  questionContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitleText: {
    fontSize: 16,
    marginBottom: 24,
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
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  optionDescription: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 36,
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
  sliderContainer: {
    gap: 12,
  },
  sliderOption: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  nextButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  nextText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
