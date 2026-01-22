/**
 * Maze Walker Game Screen
 *
 * Accessible from Skills > Games category.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import MazeWalker from '@/components/games/MazeWalker';

export default function MazeWalkerScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <MazeWalker onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FFF0',
  },
});
