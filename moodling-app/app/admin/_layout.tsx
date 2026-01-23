/**
 * Admin Layout
 *
 * Simple stack layout for admin pages.
 */

import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="training" />
    </Stack>
  );
}
