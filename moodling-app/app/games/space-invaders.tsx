/**
 * Space Invaders Game Screen
 *
 * Accessible from Skills > Games category or /invaders Easter egg.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import SpaceInvaders from '@/components/games/SpaceInvaders';

export default function SpaceInvadersScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SpaceInvaders onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
