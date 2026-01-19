import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

/**
 * Journal Tab - Primary Entry Point
 *
 * Following Moodling Ethics:
 * - "How are you feeling right now?" (warm, present)
 * - No pressure, no streaks, no guilt
 * - Compassionate, grounded interface
 *
 * Unit 1 will add: Text editor, save button, timestamp
 * Unit 2 will add: Persistent storage
 * Unit 3 will add: Entry history list
 */
export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.welcomeContainer}>
        <Text style={[styles.greeting, { color: colors.text }]}>
          How are you feeling right now?
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          No rush. Take your time.
        </Text>
      </View>

      <View style={[styles.placeholder, { backgroundColor: colors.card }]}>
        <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
          Journal entry area
        </Text>
        <Text style={[styles.placeholderHint, { color: colors.textMuted }]}>
          (Unit 1 will add the text editor)
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.privacyNote, { color: colors.textMuted }]}>
          Everything stays on your device
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  welcomeContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  placeholder: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    marginBottom: 8,
  },
  placeholderHint: {
    fontSize: 14,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  privacyNote: {
    fontSize: 12,
  },
});
