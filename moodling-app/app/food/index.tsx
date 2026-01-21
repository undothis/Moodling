/**
 * Food Tracker Screen
 *
 * Full-screen food tracking with calorie counting.
 * Routes: /food
 */

import React from 'react';
import { SafeAreaView, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { FoodTracker } from '@/components/food/FoodTracker';

export default function FoodTrackerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FoodTracker
        onClose={() => router.back()}
        onFoodLogged={(entry) => {
          console.log('[FoodTrackerScreen] Food logged:', entry.foodItem.name);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
