import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import HumanDesign from '../../components/skills/HumanDesign';

export default function HumanDesignScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Human Design',
          headerStyle: { backgroundColor: '#0D0D0D' },
          headerTintColor: '#FFFFFF',
        }}
      />
      <HumanDesign />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
});
