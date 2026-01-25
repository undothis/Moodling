import { useEffect, useState, useCallback } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useColorScheme,
  View,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { isOnboardingComplete } from '@/services/coachPersonalityService';
import {
  nextStep,
  skipTour,
  getTotalSteps,
  subscribeTourState,
  TourStep,
} from '@/services/guidedTourService';
import {
  TourSpotlight,
  getSpotlightTarget,
  subscribeToTargets,
  SpotlightTarget,
} from '@/components/TourSpotlight';

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
  const [spotlightTarget, setSpotlightTarget] = useState<SpotlightTarget | null>(null);

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

      // Look up spotlight target for this step
      if (step?.highlight) {
        const target = getSpotlightTarget(step.highlight);
        setSpotlightTarget(target || null);
      } else {
        setSpotlightTarget(null);
      }
    });

    return unsubscribe;
  }, []);

  // Subscribe to spotlight target updates (elements may register after navigation)
  useEffect(() => {
    const unsubscribe = subscribeToTargets(() => {
      if (currentTourStep?.highlight) {
        const target = getSpotlightTarget(currentTourStep.highlight);
        setSpotlightTarget(target || null);
      }
    });

    return unsubscribe;
  }, [currentTourStep]);

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
    const inQuickLogs = segments[0] === 'quick-logs';
    const inSettings = segments[0] === 'settings';
    const inAdmin = segments[0] === 'admin';

    // Only redirect TO onboarding if needed and not already in exempt routes
    // Exempt routes: onboarding screens, post-onboarding screens, main app tabs, and utility screens
    const isExempt = inOnboarding || inCognitiveOnboarding || inGuide || inCoach || inTabs || inQuickLogs || inSettings || inAdmin;
    if (needsOnboarding && !isExempt) {
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
        <Stack.Screen
          name="settings/coach-access"
          options={{
            title: 'AI Data Access',
            presentation: 'card',
          }}
        />
      </Stack>

      {/* Guided Tour Spotlight - at root level so it persists across navigation */}
      <TourSpotlight
        visible={tourActive && currentTourStep !== null}
        target={spotlightTarget}
        title={currentTourStep?.title || ''}
        description={currentTourStep?.displayText || ''}
        stepIndex={tourStepIndex}
        totalSteps={getTotalSteps()}
        onNext={handleTourNext}
        onSkip={handleSkipTour}
      />
    </>
  );
}
