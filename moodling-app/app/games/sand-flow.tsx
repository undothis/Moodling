/**
 * Sand Flow Game Screen
 *
 * Accessible from Skills > Games category.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import SandFlow from '@/components/games/SandFlow';

export default function SandFlowScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SandFlow onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
});
