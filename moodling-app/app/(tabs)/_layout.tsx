import { Tabs } from 'expo-router';
import { useColorScheme, Platform, Text, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { VoiceEnabledTabBar } from '@/components/VoiceEnabledTabBar';
import { useEffect, useState, useRef } from 'react';
import { getCoachEmoji, getCoachSettings } from '@/services/coachPersonalityService';
import { getNewInsightCount } from '@/services/insightService';
import { shouldCoachGlow, getNewAchievementCount, shouldSkillsGlow, getSkillAchievementCount } from '@/services/achievementNotificationService';

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
  const [coachShouldGlow, setCoachShouldGlow] = useState(false);
  const [skillsShouldGlow, setSkillsShouldGlow] = useState(false);
  const [insightsShouldGlow, setInsightsShouldGlow] = useState(false);
  const [achievementCount, setAchievementCount] = useState(0);
  const [skillAchievementCount, setSkillAchievementCount] = useState(0);
  const seedGlowAnim = useRef(new Animated.Value(0)).current;
  const coachGlowAnim = useRef(new Animated.Value(0)).current;
  const skillsGlowAnim = useRef(new Animated.Value(0)).current;
  const insightsGlowAnim = useRef(new Animated.Value(0)).current;

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
      // Insights tab also glows when there are new insights
      setInsightsShouldGlow(count > 0);
    };
    loadSeedsCount();

    // Refresh count periodically
    const interval = setInterval(loadSeedsCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check for coach achievements (glow when there's something to celebrate)
  useEffect(() => {
    const checkCoachGlow = async () => {
      const shouldGlow = await shouldCoachGlow();
      const count = await getNewAchievementCount();
      setCoachShouldGlow(shouldGlow);
      setAchievementCount(count);
    };
    checkCoachGlow();

    // Refresh periodically
    const interval = setInterval(checkCoachGlow, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check for skills achievements (glow when there are skill completions)
  useEffect(() => {
    const checkSkillsGlow = async () => {
      const shouldGlow = await shouldSkillsGlow();
      const count = await getSkillAchievementCount();
      setSkillsShouldGlow(shouldGlow);
      setSkillAchievementCount(count);
    };
    checkSkillsGlow();

    // Refresh periodically
    const interval = setInterval(checkSkillsGlow, 30000);
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

  // Glow animation for coach achievements
  useEffect(() => {
    if (coachShouldGlow) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(coachGlowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(coachGlowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      coachGlowAnim.setValue(0);
    }
  }, [coachShouldGlow, coachGlowAnim]);

  // Glow animation for skills achievements
  useEffect(() => {
    if (skillsShouldGlow) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(skillsGlowAnim, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: false,
          }),
          Animated.timing(skillsGlowAnim, {
            toValue: 0,
            duration: 1400,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      skillsGlowAnim.setValue(0);
    }
  }, [skillsShouldGlow, skillsGlowAnim]);

  // Glow animation for insights
  useEffect(() => {
    if (insightsShouldGlow) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(insightsGlowAnim, {
            toValue: 1,
            duration: 1300,
            useNativeDriver: false,
          }),
          Animated.timing(insightsGlowAnim, {
            toValue: 0,
            duration: 1300,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      insightsGlowAnim.setValue(0);
    }
  }, [insightsShouldGlow, insightsGlowAnim]);

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
          tabBarIcon: ({ focused }) => {
            // Glowing coach icon when there are achievements to celebrate
            const glowOpacity = coachGlowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.7],
            });

            return (
              <View style={{ position: 'relative' }}>
                <Text style={{ fontSize: 22 }}>{coachEmoji}</Text>
                {coachShouldGlow && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -6,
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: '#FFD700',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#FFD700',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: glowOpacity,
                      shadowRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#000', fontSize: 10, fontWeight: '700' }}>
                      ✨
                    </Text>
                  </Animated.View>
                )}
              </View>
            );
          },
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          title: 'Skills',
          tabBarIcon: ({ color, focused }) => {
            // Glowing skills icon when there are skill achievements
            const glowOpacity = skillsGlowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.7],
            });

            return (
              <View style={{ position: 'relative' }}>
                <Ionicons
                  name={focused ? 'sparkles' : 'sparkles-outline'}
                  size={24}
                  color={color}
                />
                {skillsShouldGlow && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -6,
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: '#9C27B0',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#9C27B0',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: glowOpacity,
                      shadowRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                      {skillAchievementCount > 9 ? '9+' : skillAchievementCount}
                    </Text>
                  </Animated.View>
                )}
              </View>
            );
          },
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
          tabBarIcon: ({ color, focused }) => {
            // Glowing insights icon when there are new pattern insights
            const glowOpacity = insightsGlowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.7],
            });

            return (
              <View style={{ position: 'relative' }}>
                <Ionicons
                  name={focused ? 'stats-chart' : 'stats-chart-outline'}
                  size={24}
                  color={color}
                />
                {insightsShouldGlow && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -6,
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: '#2196F3',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#2196F3',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: glowOpacity,
                      shadowRadius: 8,
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
