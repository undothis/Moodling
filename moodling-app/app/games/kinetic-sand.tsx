/**
 * Kinetic Sand Game Screen
 *
 * Accessible from Skills > Games category.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import KineticSand from '@/components/games/KineticSand';

export default function KineticSandScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <KineticSand onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
});
