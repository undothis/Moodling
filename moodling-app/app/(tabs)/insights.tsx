import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';

/**
 * Insights Tab - Pattern Visualization
 *
 * Following Moodling Ethics:
 * - Descriptive patterns, NOT diagnostic
 * - "You might notice..." language
 * - User knows themselves best
 *
 * Unit 10 will add: Pattern data model
 * Unit 11 will add: Pattern visualization
 * Unit 12 will add: Correlation engine
 */
export default function InsightsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          Insights
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Patterns you might notice
        </Text>
      </View>

      <View style={[styles.placeholder, { backgroundColor: colors.card }]}>
        <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
          Your patterns will appear here
        </Text>
        <Text style={[styles.placeholderHint, { color: colors.textMuted }]}>
          (Units 10-12 will add pattern tracking)
        </Text>
      </View>

      <View style={styles.disclaimer}>
        <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
          These are observations, not diagnoses.{'\n'}
          You know yourself best.
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
  headerContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
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
    textAlign: 'center',
  },
  placeholderHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  disclaimer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
