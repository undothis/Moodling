import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import AstrologyBasics from '../../components/skills/AstrologyBasics';

export default function AstrologyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Astrology Basics',
          headerStyle: { backgroundColor: '#0D0D0D' },
          headerTintColor: '#FFFFFF',
        }}
      />
      <AstrologyBasics />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
});
