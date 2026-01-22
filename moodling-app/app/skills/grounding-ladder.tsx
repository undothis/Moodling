/**
 * Grounding Ladder Screen
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import GroundingLadder from '@/components/skills/GroundingLadder';

export default function GroundingLadderScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <GroundingLadder onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
