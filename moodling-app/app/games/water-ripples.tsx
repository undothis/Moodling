/**
 * Water Ripples Game Screen
 *
 * Accessible from Skills > Games category.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import WaterRipples from '@/components/games/WaterRipples';

export default function WaterRipplesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <WaterRipples onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C4A6E',
  },
});
