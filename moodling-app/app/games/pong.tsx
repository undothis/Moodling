/**
 * Pong Game Screen
 *
 * Accessible via /pong Easter egg or games menu.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import RetroPong from '@/components/games/RetroPong';

export default function PongScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <RetroPong onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
});
