/**
 * Coach Personality Onboarding
 *
 * A multi-step flow to help users customize their AI coach experience.
 * Following Mood Leaf Ethics:
 * - User controls their experience
 * - No pressure, can skip
 * - Warm and inviting
 *
 * Unit 17: AI Coach Personality System
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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import {
  ONBOARDING_QUESTIONS,
  OnboardingQuestion,
  recommendPersonaFromAnswers,
  mapAnswersToSettings,
  generateMoodMappings,
  saveCoachSettings,
  completeOnboarding,
  getSettingsForPersona,
  PERSONAS,
  CoachPersona,
  Chronotype,
  NameStyle,
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

      // Generate personalized mood mappings based on user's preferences
      const personalizedMoodMappings = generateMoodMappings(answers, recommendedPersona);

      // Get chronotype from schedule preference (defaults to 'normal')
      const chronotype = (answers.schedule_preference as Chronotype) || 'normal';

      // Get name style preference (defaults to 'classic')
      const nameStyle = (answers.name_style as NameStyle) || 'classic';

      // Get user's name (optional)
      const userName = (answers.user_name as string)?.trim() || undefined;

      // Save settings
      await saveCoachSettings({
        selectedPersona: recommendedPersona,
        userName, // User's preferred name/nickname
        nameStyle, // User's preferred name style for coaches
        detailedSettings: {
          ...getSettingsForPersona(recommendedPersona),
          ...detailedSettings,
        },
        useDetailedSettings: false,
        chronotype, // User's natural rhythm for time-aware energy modulation
        adaptiveSettings: {
          enabled: true, // Adaptive mode on by default - AI adapts to mood, time, content
          triggers: ['mood_detected', 'time_of_day', 'content_type'],
          basePersona: recommendedPersona,
          moodMappings: personalizedMoodMappings,
        },
        onboardingAnswers: answers,
      });

      await completeOnboarding();

      // Navigate to cognitive onboarding to discover how they think
      router.replace('/cognitive-onboarding');
    } catch (error) {
      console.error('Failed to save onboarding:', error);
      router.replace('/cognitive-onboarding');
    }
  };

  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSingleSelect = (optionId: string) => {
    if (isTransitioning) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));

    // Auto-advance after short delay to show selection
    setIsTransitioning(true);
    setTimeout(async () => {
      if (isLastStep) {
        await finishOnboarding();
      } else {
        animateTransition('next', () => {
          setCurrentStep((prev) => prev + 1);
          setIsTransitioning(false);
        });
      }
    }, 300);
  };

  // For multi-select: track a timeout to auto-advance
  const multiSelectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMultiSelect = (optionId: string) => {
    const current = (answers[currentQuestion.id] as string[]) || [];
    const isSelected = current.includes(optionId);

    const newSelection = isSelected
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: newSelection,
    }));

    // Clear any existing timeout
    if (multiSelectTimeoutRef.current) {
      clearTimeout(multiSelectTimeoutRef.current);
    }

    // Auto-advance after 1.5 seconds of no activity (if at least one selected)
    if (newSelection.length > 0) {
      multiSelectTimeoutRef.current = setTimeout(async () => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        if (isLastStep) {
          await finishOnboarding();
        } else {
          animateTransition('next', () => {
            setCurrentStep((prev) => prev + 1);
            setIsTransitioning(false);
          });
        }
      }, 1500);
    }
  };

  const handleSliderSelect = (value: number) => {
    if (isTransitioning) return;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value.toString(),
    }));

    // Auto-advance after short delay
    setIsTransitioning(true);
    setTimeout(async () => {
      if (isLastStep) {
        await finishOnboarding();
      } else {
        animateTransition('next', () => {
          setCurrentStep((prev) => prev + 1);
          setIsTransitioning(false);
        });
      }
    }, 300);
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
          keyboardShouldPersistTaps="handled"
        >
          {question.type === 'text' && question.textConfig ? (
            <View style={styles.textInputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.cardBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={question.textConfig.placeholder}
                placeholderTextColor={colors.textMuted}
                value={(selectedValue as string) || ''}
                onChangeText={(text) => {
                  setAnswers((prev) => ({
                    ...prev,
                    [question.id]: text,
                  }));
                }}
                maxLength={question.textConfig.maxLength}
                autoFocus={currentStep === 0}
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (selectedValue && (selectedValue as string).trim()) {
                    handleNext();
                  }
                }}
              />
              <Pressable
                style={[
                  styles.textContinueButton,
                  {
                    backgroundColor: selectedValue && (selectedValue as string).trim()
                      ? colors.tint
                      : colors.border,
                  },
                ]}
                onPress={handleNext}
                disabled={!selectedValue || !(selectedValue as string).trim()}
              >
                <Text
                  style={[
                    styles.textContinueText,
                    {
                      color: selectedValue && (selectedValue as string).trim()
                        ? '#fff'
                        : colors.textMuted,
                    },
                  ]}
                >
                  Continue
                </Text>
              </Pressable>
              <Pressable
                style={styles.skipNameButton}
                onPress={() => {
                  setAnswers((prev) => ({
                    ...prev,
                    [question.id]: '',
                  }));
                  handleNext();
                }}
              >
                <Text style={[styles.skipNameText, { color: colors.textMuted }]}>
                  Skip for now
                </Text>
              </Pressable>
            </View>
          ) : question.type === 'slider' && question.sliderConfig ? (
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
                    disabled={isTransitioning}
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
                  disabled={isTransitioning && question.type !== 'multi'}
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

        {question.hint && (
          <View style={[styles.hintContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.hintText, { color: colors.textSecondary }]}>
              {question.hint}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  // Clear multi-select timeout on unmount or step change
  useEffect(() => {
    return () => {
      if (multiSelectTimeoutRef.current) {
        clearTimeout(multiSelectTimeoutRef.current);
      }
    };
  }, [currentStep]);

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

      {/* Navigation - Back button only */}
      <View style={[styles.navigation, { paddingBottom: insets.bottom + 20 }]}>
        {currentStep > 0 ? (
          <Pressable style={styles.backButton} onPress={handleBack} disabled={isTransitioning}>
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
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          {currentQuestion.type === 'multi'
            ? 'Select options, then wait to continue'
            : 'Tap an option to continue'}
        </Text>
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
  hintContainer: {
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
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
  textInputContainer: {
    gap: 16,
  },
  textInput: {
    fontSize: 18,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    textAlign: 'center',
  },
  textContinueButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  textContinueText: {
    fontSize: 17,
    fontWeight: '600',
  },
  skipNameButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipNameText: {
    fontSize: 15,
  },
});
