/**
 * Untangle Game Screen
 *
 * Accessible from Skills > Games category.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Untangle from '@/components/games/Untangle';

export default function UntangleScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Untangle onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
