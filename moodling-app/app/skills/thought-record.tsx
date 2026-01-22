/**
 * Thought Record Screen
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import ThoughtRecord from '@/components/skills/ThoughtRecord';

export default function ThoughtRecordScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ThoughtRecord onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
