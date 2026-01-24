/**
 * Drink Pacing Screen
 *
 * Helps users pace their drinking at social events.
 * - Set interval (e.g., one drink per hour)
 * - Get vibration reminders when it's time for next drink
 * - Track drinks during the session
 * - Silent mode for discretion
 *
 * This is a harm reduction tool.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  startDrinkPacingSession,
  getActiveSession,
  logDrink,
  endDrinkPacingSession,
  getSessionStatus,
  getDrinkPacingPreferences,
  setDrinkPacingPreferences,
  DrinkPacingSession,
} from '@/services/drinkPacingService';

export default function DrinkPacingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState<DrinkPacingSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Setup form
  const [intervalMinutes, setIntervalMinutes] = useState('60');
  const [maxDrinks, setMaxDrinks] = useState('4');
  const [eventName, setEventName] = useState('');

  // Status
  const [drinksConsumed, setDrinksConsumed] = useState(0);
  const [minutesUntilNext, setMinutesUntilNext] = useState(0);
  const [atLimit, setAtLimit] = useState(false);

  // Load session
  const loadSession = useCallback(async () => {
    setLoading(true);
    const activeSession = await getActiveSession();
    setSession(activeSession);

    if (activeSession) {
      setDrinksConsumed(activeSession.drinksConsumed);
      const status = await getSessionStatus();
      if (status) {
        setMinutesUntilNext(status.minutesUntilNextBuzz);
        setAtLimit(status.maxDrinks ? status.drinksConsumed >= status.maxDrinks : false);
      }
    } else {
      // Load defaults
      const prefs = await getDrinkPacingPreferences();
      setIntervalMinutes(String(prefs.defaultIntervalMinutes));
      setMaxDrinks(String(prefs.defaultMaxDrinks));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Update timer every minute
  useEffect(() => {
    if (!session?.isActive) return;

    const interval = setInterval(async () => {
      const status = await getSessionStatus();
      if (status) {
        setMinutesUntilNext(status.minutesUntilNextBuzz);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [session?.isActive]);

  // Start session
  const handleStart = async () => {
    const interval = parseInt(intervalMinutes) || 60;
    const max = parseInt(maxDrinks) || undefined;

    if (interval < 15) {
      Alert.alert('Too fast', 'Please set an interval of at least 15 minutes for your safety.');
      return;
    }

    // Save as new defaults
    await setDrinkPacingPreferences({
      defaultIntervalMinutes: interval,
      defaultMaxDrinks: max || 4,
    });

    const newSession = await startDrinkPacingSession({
      intervalMinutes: interval,
      maxDrinks: max,
      eventName: eventName.trim() || undefined,
    });

    setSession(newSession);
    setDrinksConsumed(0);
    setMinutesUntilNext(interval);
    setAtLimit(false);
  };

  // Log a drink
  const handleLogDrink = async () => {
    // Double-check we have an active session
    if (!session) {
      Alert.alert('No Session', 'Please start a pacing session first.');
      return;
    }

    try {
      const result = await logDrink();
      setDrinksConsumed(result.session.drinksConsumed);
      setMinutesUntilNext(result.nextBuzzIn);
      setAtLimit(result.atLimit);

      // Update session state to stay in sync
      setSession(result.session);

      if (result.overLimit) {
        Alert.alert(
          'Over Limit',
          "You're over your planned limit. Consider switching to water or ending your session.",
          [{ text: 'Got it' }]
        );
      } else if (result.atLimit) {
        Alert.alert(
          'Limit Reached',
          "You've reached your drink limit for this session. Nice job pacing yourself!",
          [{ text: 'Awesome' }]
        );
      }
    } catch (error) {
      console.error('Failed to log drink:', error);
      // Session might have been lost - try to recover
      const activeSession = await getActiveSession();
      if (!activeSession) {
        Alert.alert(
          'Session Lost',
          'Your pacing session was not found. Would you like to start a new one?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Start New', onPress: () => setSession(null) },
          ]
        );
      } else {
        setSession(activeSession);
        Alert.alert('Error', 'Could not log drink. Please try again.');
      }
    }
  };

  // End session
  const handleEnd = async () => {
    Alert.alert(
      'End Session',
      'End your drink pacing session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          onPress: async () => {
            const summary = await endDrinkPacingSession();
            setSession(null);

            if (summary) {
              Alert.alert(
                'Session Complete',
                `Total drinks: ${summary.totalDrinks}\nDuration: ${summary.durationMinutes} minutes\n${summary.stayedOnPace ? 'You stayed on pace!' : 'Next time try to stick to your plan.'}`,
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Drink Pacing</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {!session ? (
          // Setup view
          <>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Set Your Pace
              </Text>
              <Text style={[styles.cardDescription, { color: colors.textMuted }]}>
                Get discreet vibration reminders to help you pace your drinking at social events.
              </Text>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Drink every (minutes)
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={intervalMinutes}
                  onChangeText={setIntervalMinutes}
                  keyboardType="number-pad"
                  placeholder="60"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  Recommended: 45-60 minutes
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Maximum drinks (optional)
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={maxDrinks}
                  onChangeText={setMaxDrinks}
                  keyboardType="number-pad"
                  placeholder="4"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Event name (optional)
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={eventName}
                  onChangeText={setEventName}
                  placeholder="e.g., Sarah's party"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: colors.tint }]}
              onPress={handleStart}
            >
              <Text style={styles.startButtonText}>Start Pacing</Text>
            </TouchableOpacity>

            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                This tool helps you pace yourself if you choose to drink. It's not promoting alcohol - it's about mindfulness and moderation.
              </Text>
            </View>
          </>
        ) : (
          // Active session view
          <>
            <View style={[styles.sessionCard, { backgroundColor: colors.card }]}>
              {session.eventName && (
                <Text style={[styles.eventName, { color: colors.textMuted }]}>
                  {session.eventName}
                </Text>
              )}

              <Text style={[styles.bigNumber, { color: atLimit ? '#FF9800' : colors.tint }]}>
                {drinksConsumed}
              </Text>
              <Text style={[styles.bigLabel, { color: colors.text }]}>
                drink{drinksConsumed !== 1 ? 's' : ''} logged
                {session.maxDrinks && ` of ${session.maxDrinks}`}
              </Text>

              {!atLimit && (
                <View style={styles.timerContainer}>
                  <Ionicons name="timer-outline" size={20} color={colors.textMuted} />
                  <Text style={[styles.timerText, { color: colors.textMuted }]}>
                    {minutesUntilNext > 0
                      ? `${minutesUntilNext} min until next reminder`
                      : 'Time for your next drink'}
                  </Text>
                </View>
              )}

              {atLimit && (
                <View style={[styles.limitBanner, { backgroundColor: '#FF980020' }]}>
                  <Ionicons name="checkmark-circle" size={20} color="#FF9800" />
                  <Text style={[styles.limitText, { color: '#FF9800' }]}>
                    You've reached your limit for tonight!
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.logButton,
                { backgroundColor: atLimit ? colors.card : colors.tint, borderColor: atLimit ? colors.border : colors.tint },
              ]}
              onPress={handleLogDrink}
            >
              <Ionicons
                name="add-circle"
                size={24}
                color={atLimit ? colors.textMuted : '#FFFFFF'}
              />
              <Text style={[styles.logButtonText, { color: atLimit ? colors.textMuted : '#FFFFFF' }]}>
                Log a Drink
              </Text>
            </TouchableOpacity>

            <View style={styles.sessionActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.card }]}
                onPress={handleEnd}
              >
                <Text style={[styles.actionButtonText, { color: '#F44336' }]}>
                  End Session
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.paceInfo, { backgroundColor: colors.card }]}>
              <Text style={[styles.paceText, { color: colors.textMuted }]}>
                Pace: 1 drink every {session.intervalMinutes} minutes
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    fontSize: 18,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: 'center',
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  startButton: {
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  // Active session styles
  sessionCard: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  eventName: {
    fontSize: 14,
    marginBottom: 8,
  },
  bigNumber: {
    fontSize: 72,
    fontWeight: '700',
    lineHeight: 80,
  },
  bigLabel: {
    fontSize: 18,
    marginBottom: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerText: {
    fontSize: 14,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  limitText: {
    fontSize: 14,
    fontWeight: '500',
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  logButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  sessionActions: {
    marginBottom: 20,
  },
  actionButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  paceInfo: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  paceText: {
    fontSize: 13,
  },
});
