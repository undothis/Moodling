/**
 * Asteroids Game Screen
 *
 * Accessible from Skills > Games category.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import RetroAsteroids from '@/components/games/RetroAsteroids';

export default function AsteroidsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <RetroAsteroids onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
});
