import { Tabs } from 'expo-router';
import { useColorScheme, Platform, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { VoiceEnabledTabBar } from '@/components/VoiceEnabledTabBar';
import { useEffect, useState } from 'react';
import { getCoachEmoji, getCoachSettings } from '@/services/coachPersonalityService';

/**
 * Mood Leaf Tab Navigation
 *
 * Six tabs with voice-enabled quick access:
 * 1. Tree - Visual home with interactive tree (primary)
 * 2. Journal - Write entries (VOICE ENABLED: hold to speak)
 * 3. Coach - AI companion chat (VOICE ENABLED: hold to speak)
 * 4. Skills - Growth toolkit and progression
 * 5. Insights - See patterns (weather/health)
 * 6. Settings - Configure app (garden settings)
 *
 * Voice-Enabled Tabs:
 * - Hold Journal tab → Speak → Release → Go to journal with transcription
 * - Hold Coach tab → Speak → Release → Go to coach with your message
 *
 * No badges, no notification dots, no engagement tricks.
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [coachEmoji, setCoachEmoji] = useState('🌿');

  useEffect(() => {
    const loadCoach = async () => {
      const settings = await getCoachSettings();
      setCoachEmoji(getCoachEmoji(settings));
    };
    loadCoach();
  }, []);

  return (
    <Tabs
      tabBar={(props) => <VoiceEnabledTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="tree"
        options={{
          title: 'Tree',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'leaf' : 'leaf-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'book' : 'book-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>{coachEmoji}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          title: 'Skills',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'sparkles' : 'sparkles-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
