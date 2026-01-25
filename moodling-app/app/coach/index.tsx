/**
 * Coach Route Redirect
 *
 * This file exists to handle direct navigation to /coach
 * (e.g., from onboarding). It redirects to the main coach tab.
 */

import { Redirect } from 'expo-router';

export default function CoachRedirect() {
  return <Redirect href="/(tabs)/coach" />;
}
