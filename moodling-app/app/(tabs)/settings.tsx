import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import {
  getReminderSettings,
  saveReminderSettings,
  scheduleDailyReminder,
  showTestNotification,
  formatTime,
  ReminderSettings,
} from '@/services/notificationService';

/**
 * Settings Tab - Configuration & Privacy
 *
 * Following Moodling Ethics:
 * - All data stored on device (transparency)
 * - No hidden tracking
 * - User controls everything
 *
 * Unit 6: Notification settings with daily reminders
 */
export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Reminder settings state
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getReminderSettings();
      setReminderEnabled(settings.enabled);
      setReminderHour(settings.hour);
      setReminderMinute(settings.minute);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReminderToggle = async (value: boolean) => {
    setReminderEnabled(value);

    const settings: ReminderSettings = {
      enabled: value,
      hour: reminderHour,
      minute: reminderMinute,
    };

    await saveReminderSettings(settings);
    await scheduleDailyReminder(settings);
  };

  const handleTimeChange = async (hour: number, minute: number) => {
    setReminderHour(hour);
    setReminderMinute(minute);
    setShowTimePicker(false);

    const settings: ReminderSettings = {
      enabled: reminderEnabled,
      hour,
      minute,
    };

    await saveReminderSettings(settings);
    if (reminderEnabled) {
      await scheduleDailyReminder(settings);
    }
  };

  const handleTestNotification = async () => {
    await showTestNotification();
    if (Platform.OS === 'web') {
      // Web notification sent
    }
  };

  // Simple time picker options
  const timeOptions = [
    { hour: 7, minute: 0, label: '7:00 AM' },
    { hour: 8, minute: 0, label: '8:00 AM' },
    { hour: 9, minute: 0, label: '9:00 AM' },
    { hour: 12, minute: 0, label: '12:00 PM' },
    { hour: 17, minute: 0, label: '5:00 PM' },
    { hour: 18, minute: 0, label: '6:00 PM' },
    { hour: 19, minute: 0, label: '7:00 PM' },
    { hour: 20, minute: 0, label: '8:00 PM' },
    { hour: 21, minute: 0, label: '9:00 PM' },
    { hour: 22, minute: 0, label: '10:00 PM' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      {/* Reminders Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Reminders
          </Text>
        </View>

        {/* Toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Daily check-in
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
              A gentle reminder to journal
            </Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={handleReminderToggle}
            trackColor={{ false: colors.border, true: colors.tint }}
            thumbColor="#FFFFFF"
            disabled={isLoading}
          />
        </View>

        {/* Time Selector */}
        {reminderEnabled && (
          <View style={styles.timeSection}>
            <TouchableOpacity
              style={[styles.timeButton, { backgroundColor: colors.background }]}
              onPress={() => setShowTimePicker(!showTimePicker)}
            >
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                Time
              </Text>
              <Text style={[styles.timeValue, { color: colors.text }]}>
                {formatTime(reminderHour, reminderMinute)}
              </Text>
            </TouchableOpacity>

            {/* Time Options */}
            {showTimePicker && (
              <View style={styles.timeOptions}>
                {timeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.timeOption,
                      {
                        backgroundColor:
                          option.hour === reminderHour && option.minute === reminderMinute
                            ? colors.tint
                            : colors.background,
                      },
                    ]}
                    onPress={() => handleTimeChange(option.hour, option.minute)}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        {
                          color:
                            option.hour === reminderHour && option.minute === reminderMinute
                              ? '#FFFFFF'
                              : colors.text,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Test Notification */}
        {reminderEnabled && (
          <TouchableOpacity
            style={[styles.testButton, { borderColor: colors.border }]}
            onPress={handleTestNotification}
          >
            <Text style={[styles.testButtonText, { color: colors.tint }]}>
              Send test notification
            </Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.reminderNote, { color: colors.textMuted }]}>
          Moodling will gently remind you to check in. You can always ignore it — no pressure, no streaks.
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
          <Text style={[styles.privacyIcon]}>🔒</Text>
          <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
            All data stored on your device
          </Text>
        </View>
        <Text style={[styles.privacyDetail, { color: colors.textMuted }]}>
          Nothing is sent to any server unless you explicitly enable cloud features.
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
        Version 1.0.0 (Unit 6)
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
  timeSection: {
    marginBottom: 16,
  },
  timeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },
  timeLabel: {
    fontSize: 15,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  timeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeOptionText: {
    fontSize: 14,
  },
  testButton: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  reminderNote: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
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
