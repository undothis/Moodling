import { StyleSheet, Text, View, useColorScheme, ScrollView } from 'react-native';
import { Colors } from '@/constants/Colors';

/**
 * Settings Tab - Configuration & Privacy
 *
 * Following Moodling Ethics:
 * - All data stored on device (transparency)
 * - No hidden tracking
 * - User controls everything
 *
 * Unit 6 will add: Notification settings
 * Unit 7 will add: Calendar permissions
 * Unit 13 will add: Usage tracking display
 */
export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          Settings
        </Text>
      </View>

      {/* Privacy Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Privacy
          </Text>
        </View>
        <View style={styles.privacyInfo}>
          <Text style={[styles.privacyIcon]}>
            🔒
          </Text>
          <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
            All data stored on your device
          </Text>
        </View>
        <Text style={[styles.privacyDetail, { color: colors.textMuted }]}>
          Nothing is sent to any server unless you explicitly enable cloud features.
        </Text>
      </View>

      {/* Reminders Section - Placeholder */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Reminders
          </Text>
        </View>
        <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
          (Unit 6 will add reminder settings)
        </Text>
        <Text style={[styles.reminderNote, { color: colors.textMuted }]}>
          No streaks. No guilt. Just gentle check-ins.
        </Text>
      </View>

      {/* About Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About Moodling
          </Text>
        </View>
        <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
          Moodling helps you notice patterns in how you feel without diagnosing or judging.
        </Text>
        <Text style={[styles.aboutPhilosophy, { color: colors.textMuted }]}>
          Our highest success is when you need this app less, not more.
        </Text>
      </View>

      <Text style={[styles.version, { color: colors.textMuted }]}>
        Version 1.0.0 (Unit 0)
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  privacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  privacyIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  privacyText: {
    fontSize: 15,
  },
  privacyDetail: {
    fontSize: 13,
    lineHeight: 18,
  },
  placeholderText: {
    fontSize: 14,
    marginBottom: 8,
  },
  reminderNote: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  aboutPhilosophy: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 20,
  },
});
