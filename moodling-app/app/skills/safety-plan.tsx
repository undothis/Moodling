/**
 * Safety Plan Screen
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import SafetyPlanBuilder from '@/components/skills/SafetyPlanBuilder';

export default function SafetyPlanScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafetyPlanBuilder onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
