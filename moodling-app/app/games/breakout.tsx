/**
 * Breakout Game Screen
 *
 * Accessible from Skills > Games category or /breakout Easter egg.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import RetroBreakout from '@/components/games/RetroBreakout';

export default function BreakoutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <RetroBreakout onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
