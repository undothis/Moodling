/**
 * 2048 Game Screen
 *
 * Accessible from Skills > Games category.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Game2048 from '@/components/games/Game2048';

export default function Game2048Screen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Game2048 onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8EF',
  },
});
