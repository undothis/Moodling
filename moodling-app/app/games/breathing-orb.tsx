/**
 * Breathing Orb Game Screen
 *
 * Accessible from Skills > Games category.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import BreathingOrb from '@/components/games/BreathingOrb';

export default function BreathingOrbScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <BreathingOrb onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
