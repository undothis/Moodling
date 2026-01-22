/**
 * Cognitive Profile Reveal
 *
 * The "aha, that's me" moment.
 * Shows users what we learned about how they think.
 *
 * Goals:
 * - Create recognition and validation
 * - Help them understand their own mind
 * - Set expectations for how the coach will adapt
 * - Empower, not label
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import {
  generateProfileReveal,
  getCoachAdaptations,
  CoachAdaptations,
} from '@/services/cognitiveProfileService';
import { getMoodPrintSummary, MoodPrintSummary } from '@/services/moodPrintService';

export default function ProfileRevealScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [reveal, setReveal] = useState<string | null>(null);
  const [summary, setSummary] = useState<MoodPrintSummary | null>(null);
  const [adaptations, setAdaptations] = useState<CoachAdaptations | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [revealText, moodPrintSummary, coachAdaptations] = await Promise.all([
        generateProfileReveal(),
        getMoodPrintSummary(),
        getCoachAdaptations(),
      ]);

      setReveal(revealText);
      setSummary(moodPrintSummary);
      setAdaptations(coachAdaptations);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Set default reveal
      setReveal(
        "I'm still learning about you. As we chat more, I'll understand " +
        "how you think and adapt my responses to fit your style."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    // Navigate to main app
    router.replace('/(tabs)');
  };

  const getAdaptationLabel = (key: string): string => {
    const labels: Record<string, string> = {
      useMetaphors: 'Using metaphors and analogies',
      useExamples: 'Providing concrete examples',
      useStepByStep: 'Step-by-step explanations',
      showBigPicture: 'Connecting to the bigger picture',
      validateFirst: 'Validating your feelings first',
      allowWandering: 'Letting conversation explore',
      provideStructure: 'Providing structure and organization',
      giveTimeToThink: 'Giving you time to reflect',
    };
    return labels[key] || key;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingEmoji}>✨</Text>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Creating your MoodPrint...
          </Text>
          <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
            The unique fingerprint of how you think
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>🌿</Text>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Your MoodPrint
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              The unique fingerprint of how you think and feel
            </Text>
          </View>

          {/* Main Reveal */}
          <View style={[styles.revealCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.revealText, { color: colors.text }]}>
              {reveal}
            </Text>
          </View>

          {/* Key Traits */}
          {summary && summary.keyTraits.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                What makes you, you
              </Text>
              <View style={styles.traitsContainer}>
                {summary.keyTraits.map((trait, index) => (
                  <View
                    key={index}
                    style={[styles.traitBadge, { backgroundColor: colors.tint + '20' }]}
                  >
                    <Text style={[styles.traitText, { color: colors.tint }]}>
                      {trait}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* How I'll Adapt */}
          {adaptations && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                How I'll talk with you
              </Text>
              <View style={[styles.adaptationsCard, { backgroundColor: colors.cardBackground }]}>
                {Object.entries(adaptations)
                  .filter(([_, value]) => value === true)
                  .slice(0, 5)
                  .map(([key], index) => (
                    <View key={key} style={styles.adaptationRow}>
                      <Text style={[styles.adaptationIcon, { color: colors.tint }]}>
                        ✓
                      </Text>
                      <Text style={[styles.adaptationText, { color: colors.text }]}>
                        {getAdaptationLabel(key)}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>
          )}

          {/* Note */}
          <View style={styles.noteContainer}>
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              This is just a starting point. I'll learn more about you as we talk.
              If something doesn't feel right, just tell me.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Continue Button */}
      <View
        style={[
          styles.buttonContainer,
          {
            paddingBottom: insets.bottom + 20,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Pressable
          style={[styles.continueButton, { backgroundColor: colors.tint }]}
          onPress={handleContinue}
        >
          <Text style={styles.continueText}>Start Chatting</Text>
        </Pressable>
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
    padding: 40,
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  content: {
    gap: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  revealCard: {
    padding: 20,
    borderRadius: 16,
  },
  revealText: {
    fontSize: 17,
    lineHeight: 26,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  traitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  adaptationsCard: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  adaptationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adaptationIcon: {
    fontSize: 16,
    fontWeight: '700',
  },
  adaptationText: {
    fontSize: 15,
    flex: 1,
  },
  noteContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noteText: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 12,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  continueText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
