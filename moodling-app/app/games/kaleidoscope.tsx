/**
 * Kaleidoscope Game Screen
 *
 * Accessible from Skills > Games category.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Kaleidoscope from '@/components/games/Kaleidoscope';

export default function KaleidoscopeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Kaleidoscope onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
