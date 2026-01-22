/**
 * Snake Game Screen
 *
 * Accessible via /snake Easter egg or games menu.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import RetroSnake from '@/components/games/RetroSnake';

export default function SnakeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <RetroSnake onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});
