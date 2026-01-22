/**
 * Frogger Game Screen
 *
 * Accessible from Skills > Games category or /frogger Easter egg.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Frogger from '@/components/games/Frogger';

export default function FroggerScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Frogger onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
