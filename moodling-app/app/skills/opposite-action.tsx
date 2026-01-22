/**
 * Opposite Action Screen
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import OppositeAction from '@/components/skills/OppositeAction';

export default function OppositeActionScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <OppositeAction onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
