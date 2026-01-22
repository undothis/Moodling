/**
 * Rain on Window Game Screen
 *
 * Accessible from Skills > Games category.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import RainOnWindow from '@/components/games/RainOnWindow';

export default function RainOnWindowScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <RainOnWindow onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
