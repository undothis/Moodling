/**
 * App Guide / FAQ Walkthrough
 *
 * Walks new users through how to use Mood Leaf,
 * focusing on the tree metaphor and core features.
 *
 * Following Mood Leaf Ethics:
 * - Warm, inviting introduction
 * - No pressure, can skip anytime
 * - Empowers user understanding
 *
 * Unit 17: Onboarding Flow
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GuideStep {
  emoji: string;
  title: string;
  description: string;
  tip?: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    emoji: '🌳',
    title: 'Welcome to Your Tree',
    description:
      "Your tree is the heart of Mood Leaf. It grows with you as you journal, reflecting your emotional journey through its branches and leaves.",
    tip: "The tree screen is your home base - you can always come back here.",
  },
  {
    emoji: '🍃',
    title: 'Leaves Are Your Entries',
    description:
      "Each journal entry becomes a leaf on your tree. Tap on leaves to revisit past entries and see how you've grown over time.",
    tip: "Different moods create different colored leaves.",
  },
  {
    emoji: '🌿',
    title: 'Branches Show Patterns',
    description:
      "As you journal more, branches form to show patterns in your moods and thoughts. These help you understand yourself better.",
    tip: "No judgment here - all patterns are just information.",
  },
  {
    emoji: '✨',
    title: 'Fireflies Bring Wisdom',
    description:
      "Tap the fireflies floating around your tree for personalized bits of wisdom and gentle reminders based on your journey.",
    tip: "You can customize what kind of wisdom appears in Settings.",
  },
  {
    emoji: '🌱',
    title: 'Twigs for Quick Logs',
    description:
      "Don't have time for a full entry? Use Twigs to quickly log your mood, sleep, or energy with just a tap.",
    tip: "Find Twigs in the bottom navigation.",
  },
  {
    emoji: '💬',
    title: 'Meet Your Guide',
    description:
      "Your AI guide has 7 nature-themed personalities: Clover (warm), Spark (energetic), Willow (wise), Luna (mindful), Ridge (focused), Flint (direct), and Fern (nurturing).",
    tip: "You can change your guide anytime in Coach Settings.",
  },
  {
    emoji: '🎭',
    title: 'Your Guide Adapts',
    description:
      "With Adaptive Mode on, your guide shifts to support you better. Feeling anxious? It becomes more calming. Sad? More nurturing. It matches what you need in the moment.",
    tip: "These shifts are personalized based on your onboarding answers.",
  },
  {
    emoji: '🌙',
    title: 'Day & Night Rhythm',
    description:
      "Your guide adjusts energy throughout the day - more awakening in the morning, calmer at night. It also respects whether you're an early bird or night owl.",
    tip: "Set your chronotype during onboarding or in Coach Settings.",
  },
  {
    emoji: '🔒',
    title: 'Your Privacy Matters',
    description:
      "Everything stays on your device. Your journal, your patterns, your growth - it's all yours and yours alone.",
    tip: "We believe in building toward our own obsolescence.",
  },
];

export default function GuideScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const step = GUIDE_STEPS[currentStep];
  const isLastStep = currentStep === GUIDE_STEPS.length - 1;
  const progress = (currentStep + 1) / GUIDE_STEPS.length;

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (isLastStep) {
      router.replace('/(tabs)/tree');
    } else {
      animateTransition(() => setCurrentStep((prev) => prev + 1));
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      animateTransition(() => setCurrentStep((prev) => prev - 1));
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/tree');
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

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.emoji}>{step.emoji}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{step.title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {step.description}
        </Text>
        {step.tip && (
          <View style={[styles.tipContainer, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.tipLabel, { color: colors.tint }]}>Tip</Text>
            <Text style={[styles.tipText, { color: colors.text }]}>
              {step.tip}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Step indicators */}
      <View style={styles.indicators}>
        {GUIDE_STEPS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              {
                backgroundColor:
                  index === currentStep ? colors.tint : colors.border,
                width: index === currentStep ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

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
          style={[styles.nextButton, { backgroundColor: colors.tint }]}
          onPress={handleNext}
        >
          <Text style={styles.nextText}>
            {isLastStep ? "Let's Grow" : 'Next'}
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
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 24,
  },
  tipContainer: {
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 15,
    lineHeight: 22,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
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
