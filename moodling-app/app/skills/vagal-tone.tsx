/**
 * Vagal Tone Exercises Screen
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import VagalToneExercises from '@/components/skills/VagalToneExercises';

export default function VagalToneScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <VagalToneExercises onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
