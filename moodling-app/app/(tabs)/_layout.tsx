import { Tabs } from 'expo-router';
import { useColorScheme, Platform, Text, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { VoiceEnabledTabBar } from '@/components/VoiceEnabledTabBar';
import { useEffect, useState, useRef } from 'react';
import { getCoachEmoji, getCoachSettings } from '@/services/coachPersonalityService';
import { getNewInsightCount } from '@/services/insightService';

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
  const [newSeedsCount, setNewSeedsCount] = useState(0);
  const seedGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadCoach = async () => {
      const settings = await getCoachSettings();
      setCoachEmoji(getCoachEmoji(settings));
    };
    loadCoach();
  }, []);

  // Load new seeds count and start glow animation
  useEffect(() => {
    const loadSeedsCount = async () => {
      const count = await getNewInsightCount();
      setNewSeedsCount(count);
    };
    loadSeedsCount();

    // Refresh count periodically
    const interval = setInterval(loadSeedsCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Glow animation for new seeds
  useEffect(() => {
    if (newSeedsCount > 0) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(seedGlowAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: false,
          }),
          Animated.timing(seedGlowAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      seedGlowAnim.setValue(0);
    }
  }, [newSeedsCount, seedGlowAnim]);

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
        name="seeds"
        options={{
          title: 'Seeds',
          tabBarIcon: ({ color, focused }) => {
            // Glowing seed icon when there are new insights
            const glowOpacity = seedGlowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.6],
            });

            return (
              <View style={{ position: 'relative' }}>
                <Text style={{ fontSize: 22 }}>
                  {focused ? '🌱' : '🌰'}
                </Text>
                {newSeedsCount > 0 && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: '#4CAF50',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: glowOpacity.interpolate({
                        inputRange: [0, 0.6],
                        outputRange: [1, 1],
                      }),
                      shadowColor: '#4CAF50',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: glowOpacity,
                      shadowRadius: 6,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                      {newSeedsCount > 9 ? '9+' : newSeedsCount}
                    </Text>
                  </Animated.View>
                )}
              </View>
            );
          },
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
