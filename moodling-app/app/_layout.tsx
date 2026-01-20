import { useEffect, useState } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import { isOnboardingComplete } from '@/services/coachPersonalityService';

/**
 * Moodling Root Layout
 *
 * Following Moodling Ethics:
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

  useEffect(() => {
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (needsOnboarding && !inOnboarding) {
      // Redirect to onboarding
      router.replace('/onboarding');
    } else if (!needsOnboarding && inOnboarding) {
      // Redirect to tree (main hub)
      router.replace('/(tabs)/tree');
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
      </Stack>
    </>
  );
}
