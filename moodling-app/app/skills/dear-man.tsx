/**
 * DEAR MAN Script Builder Screen
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import DEARMANScript from '@/components/skills/DEARMANScript';

export default function DEARMANScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <DEARMANScript onClose={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
