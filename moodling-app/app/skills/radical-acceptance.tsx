/**
 * Radical Acceptance Screen
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import RadicalAcceptance from '@/components/skills/RadicalAcceptance';

export default function RadicalAcceptanceScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <RadicalAcceptance onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
