import { useEffect, useState, useCallback } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useColorScheme,
  View,
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { isOnboardingComplete } from '@/services/coachPersonalityService';
import {
  isTourActive,
  getCurrentStep,
  nextStep,
  skipTour,
  getTotalSteps,
  getTourState,
  subscribeTourState,
  TourStep,
} from '@/services/guidedTourService';

/**
 * Mood Leaf Root Layout
 *
 * Following Mood Leaf Ethics:
 * - Warm, grounded, humble interface
 * - No engagement tricks or streak pressure
 * - Design toward the app's own obsolescence
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const segments = useSegments();
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Tour state - polled from tour service
  const [tourActive, setTourActive] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState<TourStep | null>(null);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  useEffect(() => {
    checkOnboarding();
  }, []);

  // Subscribe to tour state changes (event-based, not polling)
  useEffect(() => {
    const unsubscribe = subscribeTourState((state, step) => {
      console.log('[Layout] Tour state changed:', state.isActive, step?.id);
      setTourActive(state.isActive);
      setCurrentTourStep(step);
      setTourStepIndex(state.currentStep);
    });

    return unsubscribe;
  }, []);

  const handleTourNext = useCallback(async () => {
    await nextStep();
  }, []);

  const handleSkipTour = useCallback(async () => {
    await skipTour();
    setTourActive(false);
    setCurrentTourStep(null);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inCognitiveOnboarding = segments[0] === 'cognitive-onboarding';
    const inGuide = segments[0] === 'guide';
    const inCoach = segments[0] === 'coach';
    const inTabs = segments[0] === '(tabs)';

    // Only redirect TO onboarding if needed and not already in:
    // - Onboarding screens (onboarding, cognitive-onboarding)
    // - Post-onboarding screens (guide, coach)
    // - Main app tabs (once user reaches tabs, never redirect back)
    if (needsOnboarding && !inOnboarding && !inCognitiveOnboarding && !inGuide && !inCoach && !inTabs) {
      router.replace('/onboarding');
    }
  }, [isLoading, needsOnboarding, segments]);

  const checkOnboarding = async () => {
    try {
      const complete = await isOnboardingComplete();
      setNeedsOnboarding(!complete);
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      setNeedsOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding/index"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="coach/settings"
          options={{
            title: 'Coach Settings',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="guide/index"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="cognitive-onboarding/index"
          options={{
            headerShown: false,
            gestureEnabled: false,
            title: 'Discover Your Mind',
          }}
        />
        <Stack.Screen
          name="cognitive-onboarding/reveal"
          options={{
            headerShown: false,
            gestureEnabled: false,
            title: 'Your MoodPrint',
          }}
        />
        <Stack.Screen
          name="food/index"
          options={{
            title: 'Food Tracker',
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="settings/food"
          options={{
            title: 'Food Settings',
            headerShown: false,
            presentation: 'card',
          }}
        />
      </Stack>

      {/* Guided Tour Overlay - at root level so it persists across navigation */}
      {tourActive && currentTourStep && (
        <Modal
          visible={tourActive}
          animationType="fade"
          transparent={true}
          onRequestClose={handleSkipTour}
        >
          <View style={styles.tourOverlay}>
            <View style={[styles.tourCard, { backgroundColor: colors.background }]}>
              <Text style={[styles.tourTitle, { color: colors.text }]}>
                {currentTourStep.title}
              </Text>
              <Text style={[styles.tourText, { color: colors.textSecondary }]}>
                {currentTourStep.displayText}
              </Text>
              <View style={styles.tourProgress}>
                <Text style={[styles.tourProgressText, { color: colors.textMuted }]}>
                  {tourStepIndex + 1} of {getTotalSteps()}
                </Text>
              </View>
              <View style={styles.tourButtons}>
                <TouchableOpacity
                  style={styles.tourSkipButton}
                  onPress={handleSkipTour}
                >
                  <Text style={[styles.tourSkipText, { color: colors.textMuted }]}>
                    Skip Tour
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tourNextButton, { backgroundColor: colors.tint }]}
                  onPress={handleTourNext}
                >
                  <Text style={styles.tourNextText}>
                    {tourStepIndex === getTotalSteps() - 1 ? 'Finish' : 'Next'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  tourOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tourCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    maxWidth: 360,
  },
  tourTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  tourText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  tourProgress: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tourProgressText: {
    fontSize: 13,
  },
  tourButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  tourSkipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tourSkipText: {
    fontSize: 15,
  },
  tourNextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 8,
  },
  tourNextText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
