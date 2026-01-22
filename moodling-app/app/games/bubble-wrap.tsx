/**
 * Bubble Wrap Game Screen
 *
 * Accessible from Skills > Games category.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import BubbleWrap from '@/components/games/BubbleWrap';

export default function BubbleWrapScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <BubbleWrap onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
});
