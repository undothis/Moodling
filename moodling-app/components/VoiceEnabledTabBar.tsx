/**
 * Voice-Enabled Tab Bar
 *
 * Custom tab bar that supports press-and-hold voice input on specific tabs.
 *
 * Behavior:
 * - TAP: Navigate to that tab (normal behavior)
 * - LONG PRESS + HOLD: Start recording voice
 * - RELEASE: Navigate to tab with voice transcription
 *
 * This enables:
 * - Hold Coach tab → Speak → Release → Go to coach with your message
 * - Hold Journal tab → Speak → Release → Go to journal with transcribed text
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Vibration,
  Animated,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors } from '@/constants/Colors';
import {
  voiceRecording,
  isVoiceRecordingSupported,
  VoiceRecordingState,
} from '@/services/voiceRecording';
import { getCoachEmoji, getCoachSettings } from '@/services/coachPersonalityService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for pending voice messages
const PENDING_COACH_MESSAGE_KEY = 'moodleaf_pending_coach_voice';
const PENDING_JOURNAL_MESSAGE_KEY = 'moodleaf_pending_journal_voice';

// Tabs that support voice input
const VOICE_ENABLED_TABS = ['coach', 'index']; // index is journal

interface VoiceOverlayState {
  visible: boolean;
  targetTab: string | null;
  transcript: string;
}

export function VoiceEnabledTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [overlay, setOverlay] = useState<VoiceOverlayState>({
    visible: false,
    targetTab: null,
    transcript: '',
  });
  const [coachEmoji, setCoachEmoji] = useState('🌿');

  // Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingTimeout = useRef<NodeJS.Timeout | null>(null);
  const longPressActive = useRef(false);
  const activeTabRef = useRef<string | null>(null);

  // Check voice support and load coach emoji
  useEffect(() => {
    setVoiceSupported(isVoiceRecordingSupported());
    const loadCoach = async () => {
      const settings = await getCoachSettings();
      setCoachEmoji(getCoachEmoji(settings));
    };
    loadCoach();
  }, []);

  // Pulse animation when recording
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  // Handle press in (potential long press start)
  const handlePressIn = useCallback(
    (routeName: string) => {
      if (!voiceSupported || !VOICE_ENABLED_TABS.includes(routeName)) {
        return;
      }

      activeTabRef.current = routeName;

      // Start timer for long press detection
      recordingTimeout.current = setTimeout(async () => {
        longPressActive.current = true;
        setIsRecording(true);
        setOverlay({
          visible: true,
          targetTab: routeName,
          transcript: '',
        });

        // Haptic feedback
        if (Platform.OS !== 'web') {
          Vibration.vibrate(50);
        }

        try {
          await voiceRecording.startRecording({
            onInterimResult: (text: string) => {
              setOverlay((prev) => ({ ...prev, transcript: text }));
            },
            onFinalResult: (text: string) => {
              setOverlay((prev) => ({ ...prev, transcript: text }));
            },
            onStateChange: (voiceState: VoiceRecordingState) => {
              if (voiceState === 'error') {
                setIsRecording(false);
                setOverlay({ visible: false, targetTab: null, transcript: '' });
              }
            },
          });
        } catch (error) {
          console.error('Failed to start voice recording:', error);
          setIsRecording(false);
          setOverlay({ visible: false, targetTab: null, transcript: '' });
        }
      }, 400); // 400ms to trigger long press
    },
    [voiceSupported]
  );

  // Handle press out (end of press)
  const handlePressOut = useCallback(
    async (routeName: string) => {
      // Clear timeout if quick tap
      if (recordingTimeout.current) {
        clearTimeout(recordingTimeout.current);
        recordingTimeout.current = null;
      }

      if (longPressActive.current && isRecording) {
        // Was a long press with recording
        longPressActive.current = false;
        setIsRecording(false);

        try {
          const result = await voiceRecording.stopRecording();
          const finalTranscript = result?.transcript || overlay.transcript;
          console.log('[VoiceTabBar] Recording stopped, transcript:', finalTranscript);

          // Store pending message for the target screen
          if (finalTranscript.trim()) {
            const storageKey =
              routeName === 'coach'
                ? PENDING_COACH_MESSAGE_KEY
                : PENDING_JOURNAL_MESSAGE_KEY;
            console.log('[VoiceTabBar] Saving to AsyncStorage:', storageKey);
            await AsyncStorage.setItem(storageKey, finalTranscript);

            // Haptic success feedback
            if (Platform.OS !== 'web') {
              Vibration.vibrate([0, 30, 50, 30]);
            }
          }

          // Navigate to target
          const tabIndex = state.routes.findIndex((r) => r.name === routeName);
          if (tabIndex !== -1) {
            navigation.navigate(routeName);
          }
        } catch (error) {
          console.error('Failed to stop recording:', error);
        }

        setOverlay({ visible: false, targetTab: null, transcript: '' });
      }

      activeTabRef.current = null;
    },
    [isRecording, overlay.transcript, state.routes, navigation]
  );

  // Handle quick tap
  const handleQuickTap = useCallback(
    (routeName: string, isFocused: boolean) => {
      if (longPressActive.current) return;

      if (!isFocused) {
        navigation.navigate(routeName);
      }
    },
    [navigation]
  );

  // Get icon for tab
  const getTabIcon = (routeName: string, focused: boolean, color: string) => {
    const iconMap: Record<string, { active: string; inactive: string }> = {
      tree: { active: 'leaf', inactive: 'leaf-outline' },
      index: { active: 'book', inactive: 'book-outline' },
      coach: { active: 'chatbubble', inactive: 'chatbubble-outline' },
      skills: { active: 'sparkles', inactive: 'sparkles-outline' },
      insights: { active: 'stats-chart', inactive: 'stats-chart-outline' },
      settings: { active: 'settings', inactive: 'settings-outline' },
    };

    const icons = iconMap[routeName] || { active: 'help', inactive: 'help-outline' };
    const iconName = focused ? icons.active : icons.inactive;

    // Special case: Coach tab shows emoji
    if (routeName === 'coach') {
      return (
        <Text style={{ fontSize: 22 }}>{coachEmoji}</Text>
      );
    }

    return <Ionicons name={iconName as any} size={24} color={color} />;
  };

  // Check if tab is voice-enabled
  const isVoiceEnabled = (routeName: string) =>
    voiceSupported && VOICE_ENABLED_TABS.includes(routeName);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      {/* Voice recording overlay */}
      {overlay.visible && (
        <View style={[styles.voiceOverlay, { backgroundColor: colors.background }]}>
          <Animated.View style={[styles.micContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="mic" size={40} color={colors.error || '#ff4444'} />
          </Animated.View>
          <Text style={[styles.overlayTitle, { color: colors.text }]}>
            {overlay.targetTab === 'coach' ? 'Speaking to Coach...' : 'Voice Journal...'}
          </Text>
          <Text style={[styles.overlayTranscript, { color: colors.text }]}>
            {overlay.transcript || 'Listening...'}
          </Text>
          <Text style={[styles.overlayHint, { color: colors.secondaryText }]}>
            Release to {overlay.targetTab === 'coach' ? 'send message' : 'add to journal'}
          </Text>
        </View>
      )}

      {/* Tab buttons */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        const isFocused = state.index === index;

        const tintColor = isFocused ? colors.tint : colors.tabIconDefault;
        const voiceEnabled = isVoiceEnabled(route.name);

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPressIn={() => voiceEnabled && handlePressIn(route.name)}
            onPressOut={() => voiceEnabled && handlePressOut(route.name)}
            onPress={() => handleQuickTap(route.name, isFocused)}
            style={[
              styles.tabButton,
              isRecording && activeTabRef.current === route.name && styles.tabButtonActive,
            ]}
          >
            <View style={styles.tabContent}>
              {getTabIcon(route.name, isFocused, tintColor)}
              <Text
                style={[
                  styles.tabLabel,
                  { color: tintColor },
                ]}
              >
                {label}
              </Text>
              {voiceEnabled && (
                <View style={styles.voiceIndicator}>
                  <Ionicons name="mic-outline" size={10} color={colors.secondaryText} />
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 4,
    height: Platform.OS === 'ios' ? 88 : 60,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonActive: {
    opacity: 0.7,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  voiceIndicator: {
    position: 'absolute',
    top: -4,
    right: -8,
    opacity: 0.5,
  },
  voiceOverlay: {
    position: 'absolute',
    bottom: '100%',
    left: 16,
    right: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  micContainer: {
    marginBottom: 12,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  overlayTranscript: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 40,
  },
  overlayHint: {
    fontSize: 12,
  },
});

export default VoiceEnabledTabBar;
