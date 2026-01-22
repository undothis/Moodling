/**
 * Window of Tolerance Screen
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import WindowOfTolerance from '@/components/skills/WindowOfTolerance';

export default function WindowOfToleranceScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <WindowOfTolerance onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
