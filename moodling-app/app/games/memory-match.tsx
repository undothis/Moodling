/**
 * Memory Match Game Screen
 *
 * Accessible from Skills > Games category.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import MemoryMatch from '@/components/games/MemoryMatch';

export default function MemoryMatchScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <MemoryMatch onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
