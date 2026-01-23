/**
 * Quick Access Floating Action Button
 *
 * Provides instant access to Coach and Journal from anywhere in the app.
 *
 * Interaction patterns:
 * - TAP: Quick menu appears with Coach and Journal options
 * - LONG PRESS: Activates voice input, speaks to coach
 * - RELEASE after voice: Navigates to coach with transcribed message
 *
 * This follows the user's request:
 * "The coach should be in the front of the app and if you depress the button
 *  you can talk into it and you're conversing, you let go and you're in
 *  the coach section"
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Text,
  useColorScheme,
  Platform,
  Pressable,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { Colors } from '@/constants/Colors';
import {
  voiceRecording,
  isVoiceRecordingSupported,
  VoiceRecordingState,
} from '@/services/voiceRecording';
import { getCoachEmoji, getCoachDisplayName, getCoachSettings } from '@/services/coachPersonalityService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Don't show FAB on these screens (already at destination)
const HIDDEN_PATHS = ['/coach', '/coach/settings'];

// Storage key for pending voice message
const PENDING_VOICE_MESSAGE_KEY = 'moodleaf_pending_voice_message';

interface QuickAccessFABProps {
  visible?: boolean;
}

export function QuickAccessFAB({ visible = true }: QuickAccessFABProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const pathname = usePathname();

  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [coachEmoji, setCoachEmoji] = useState('🌿');
  const [pulseAnim] = useState(new Animated.Value(1));

  // Refs
  const expandAnim = useRef(new Animated.Value(0)).current;
  const recordingTimeout = useRef<NodeJS.Timeout | null>(null);
  const longPressActive = useRef(false);

  // Check if we should hide the FAB on current screen
  const shouldHide = HIDDEN_PATHS.some(path => pathname.startsWith(path));

  // Load coach emoji
  useEffect(() => {
    const loadCoach = async () => {
      const settings = await getCoachSettings();
      setCoachEmoji(getCoachEmoji(settings));
    };
    loadCoach();
    setVoiceSupported(isVoiceRecordingSupported());
  }, []);

  // Pulse animation when recording
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
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

  // Expand/collapse animation
  const toggleExpand = useCallback(() => {
    const toValue = isExpanded ? 0 : 1;
    Animated.spring(expandAnim, {
      toValue,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setIsExpanded(!isExpanded);
  }, [isExpanded, expandAnim]);

  // Handle long press start (begin recording)
  const handlePressIn = useCallback(async () => {
    if (!voiceSupported) {
      // Just navigate to coach if voice not supported
      return;
    }

    // Start a timer - if held for 300ms, it's a long press
    recordingTimeout.current = setTimeout(async () => {
      longPressActive.current = true;
      setIsRecording(true);
      setTranscript('');

      // Haptic feedback
      if (Platform.OS !== 'web') {
        Vibration.vibrate(50);
      }

      try {
        await voiceRecording.startRecording({
          onInterimResult: (text: string) => {
            setTranscript(text);
          },
          onFinalResult: (text: string) => {
            setTranscript(text);
          },
          onStateChange: (state: VoiceRecordingState) => {
            if (state === 'error') {
              setIsRecording(false);
            }
          },
        });
      } catch (error) {
        console.error('Failed to start recording:', error);
        setIsRecording(false);
      }
    }, 300);
  }, [voiceSupported]);

  // Handle press release
  const handlePressOut = useCallback(async () => {
    // Clear the long press timer
    if (recordingTimeout.current) {
      clearTimeout(recordingTimeout.current);
      recordingTimeout.current = null;
    }

    if (longPressActive.current && isRecording) {
      // Was recording - stop and navigate with transcript
      longPressActive.current = false;
      setIsRecording(false);

      try {
        const result = await voiceRecording.stopRecording();
        const finalTranscript = result?.transcript || transcript;

        if (finalTranscript.trim()) {
          // Store the pending message
          await AsyncStorage.setItem(PENDING_VOICE_MESSAGE_KEY, finalTranscript);

          // Haptic feedback
          if (Platform.OS !== 'web') {
            Vibration.vibrate([0, 30, 50, 30]);
          }

          // Navigate to coach with the message
          router.push({
            pathname: '/coach',
            params: { voiceMessage: finalTranscript },
          });
        } else {
          // No transcript, just go to coach
          router.push('/coach');
        }
      } catch (error) {
        console.error('Failed to stop recording:', error);
        router.push('/coach');
      }

      setTranscript('');
    }
  }, [isRecording, transcript, router]);

  // Handle quick tap (not long press)
  const handleQuickTap = useCallback(() => {
    if (!longPressActive.current && !isRecording) {
      toggleExpand();
    }
  }, [isRecording, toggleExpand]);

  // Navigate to coach
  const goToCoach = useCallback(() => {
    setIsExpanded(false);
    expandAnim.setValue(0);
    router.push('/coach');
  }, [router, expandAnim]);

  // Navigate to journal
  const goToJournal = useCallback(() => {
    setIsExpanded(false);
    expandAnim.setValue(0);
    router.push('/(tabs)');
  }, [router, expandAnim]);

  // Close menu when tapping outside
  const handleBackdropPress = useCallback(() => {
    if (isExpanded) {
      toggleExpand();
    }
  }, [isExpanded, toggleExpand]);

  // Don't render if not visible or on hidden paths
  if (!visible || shouldHide) {
    return null;
  }

  // Calculate animated positions for menu items
  const coachButtonY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -70],
  });

  const journalButtonY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -140],
  });

  const menuOpacity = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  const mainButtonRotation = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      {/* Backdrop for closing menu */}
      {isExpanded && (
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.container} pointerEvents="box-none">
        {/* Recording feedback overlay */}
        {isRecording && (
          <View style={[styles.recordingOverlay, { backgroundColor: colors.background }]}>
            <Animated.View style={[styles.recordingPulse, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name="mic" size={48} color={colors.error || '#ff4444'} />
            </Animated.View>
            <Text style={[styles.recordingText, { color: colors.text }]}>
              {transcript || 'Listening...'}
            </Text>
            <Text style={[styles.recordingHint, { color: colors.secondaryText }]}>
              Release to send to coach
            </Text>
          </View>
        )}

        {/* Coach button */}
        <Animated.View
          style={[
            styles.menuButton,
            {
              transform: [{ translateY: coachButtonY }],
              opacity: menuOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.tint }]}
            onPress={goToCoach}
            disabled={!isExpanded}
          >
            <Text style={styles.buttonEmoji}>{coachEmoji}</Text>
          </TouchableOpacity>
          <Animated.Text
            style={[
              styles.buttonLabel,
              { color: colors.text, opacity: menuOpacity },
            ]}
          >
            Coach
          </Animated.Text>
        </Animated.View>

        {/* Journal button */}
        <Animated.View
          style={[
            styles.menuButton,
            {
              transform: [{ translateY: journalButtonY }],
              opacity: menuOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.tint }]}
            onPress={goToJournal}
            disabled={!isExpanded}
          >
            <Ionicons name="book" size={24} color="#fff" />
          </TouchableOpacity>
          <Animated.Text
            style={[
              styles.buttonLabel,
              { color: colors.text, opacity: menuOpacity },
            ]}
          >
            Journal
          </Animated.Text>
        </Animated.View>

        {/* Main FAB */}
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleQuickTap}
          style={({ pressed }) => [
            styles.mainButton,
            {
              backgroundColor: isRecording ? (colors.error || '#ff4444') : colors.tint,
              transform: [{ scale: pressed && !isRecording ? 0.95 : 1 }],
            },
          ]}
        >
          {isRecording ? (
            <Ionicons name="mic" size={28} color="#fff" />
          ) : (
            <Animated.View style={{ transform: [{ rotate: mainButtonRotation }] }}>
              <Ionicons name="add" size={28} color="#fff" />
            </Animated.View>
          )}
        </Pressable>

        {/* Voice hint on first load */}
        {voiceSupported && !isExpanded && !isRecording && (
          <View style={styles.voiceHint}>
            <Text style={[styles.voiceHintText, { color: colors.secondaryText }]}>
              Hold to speak
            </Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 999,
  },
  mainButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuButton: {
    position: 'absolute',
    alignItems: 'center',
    bottom: 0,
  },
  secondaryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonEmoji: {
    fontSize: 24,
  },
  buttonLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  recordingOverlay: {
    position: 'absolute',
    bottom: 80,
    right: -10,
    width: 200,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  recordingPulse: {
    marginBottom: 12,
  },
  recordingText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  recordingHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  voiceHint: {
    position: 'absolute',
    bottom: -20,
    alignItems: 'center',
  },
  voiceHintText: {
    fontSize: 10,
    fontWeight: '500',
  },
});

export default QuickAccessFAB;
