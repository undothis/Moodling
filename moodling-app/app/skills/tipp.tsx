/**
 * TIPP Skills Screen
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import TIPPSkills from '@/components/skills/TIPPSkills';

export default function TIPPScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TIPPSkills onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
