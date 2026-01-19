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
  ReminderFrequency,
  FREQUENCY_OPTIONS,
  checkAdaptiveReminder,
  AdaptiveSuggestion,
} from '@/services/notificationService';
import {
  getTonePreferences,
  toggleToneStyle,
  ToneStyle,
  TonePreferences,
  TONE_OPTIONS,
  getStyleExamples,
} from '@/services/tonePreferencesService';

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
  const [reminderFrequency, setReminderFrequency] = useState<ReminderFrequency>('daily');
  const [isLoading, setIsLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

  // Adaptive reminder state (Unit 14)
  const [adaptiveSuggestion, setAdaptiveSuggestion] = useState<AdaptiveSuggestion | null>(null);

  // Tone preferences state (Unit 16)
  const [tonePreferences, setTonePreferences] = useState<TonePreferences>({ selectedStyles: ['balanced'] });
  const [showToneOptions, setShowToneOptions] = useState(false);

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
      setReminderFrequency(settings.frequency);

      // Check for adaptive reminder suggestion (Unit 14)
      if (settings.enabled) {
        const suggestion = await checkAdaptiveReminder();
        if (suggestion.shouldSuggest) {
          setAdaptiveSuggestion(suggestion);
        }
      }

      // Load tone preferences (Unit 16)
      const tonePrefs = await getTonePreferences();
      setTonePreferences(tonePrefs);
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
      frequency: reminderFrequency,
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
      frequency: reminderFrequency,
    };

    await saveReminderSettings(settings);
    if (reminderEnabled) {
      await scheduleDailyReminder(settings);
    }
  };

  // Handle frequency change (Unit 14)
  const handleFrequencyChange = async (frequency: ReminderFrequency) => {
    setReminderFrequency(frequency);
    setShowFrequencyPicker(false);

    const settings: ReminderSettings = {
      enabled: reminderEnabled,
      hour: reminderHour,
      minute: reminderMinute,
      frequency,
    };

    await saveReminderSettings(settings);
    if (reminderEnabled) {
      await scheduleDailyReminder(settings);
    }

    // Dismiss adaptive suggestion if user changed frequency
    setAdaptiveSuggestion(null);
  };

  // Accept adaptive suggestion (Unit 14)
  const handleAcceptAdaptive = async () => {
    if (!adaptiveSuggestion) return;
    await handleFrequencyChange(adaptiveSuggestion.suggestedFrequency);
  };

  // Get label for current frequency
  const getCurrentFrequencyLabel = () => {
    const option = FREQUENCY_OPTIONS.find(o => o.value === reminderFrequency);
    return option?.label ?? 'Daily';
  };

  const handleTestNotification = async () => {
    await showTestNotification();
    if (Platform.OS === 'web') {
      // Web notification sent
    }
  };

  // Handle tone style toggle (Unit 16)
  const handleToneToggle = async (style: ToneStyle) => {
    const newPrefs = await toggleToneStyle(style);
    setTonePreferences(newPrefs);
  };

  // Get selected style labels for display
  const getSelectedStylesLabel = () => {
    if (tonePreferences.selectedStyles.length === 0) return 'Balanced';
    if (tonePreferences.selectedStyles.length === 1) {
      return TONE_OPTIONS.find(o => o.id === tonePreferences.selectedStyles[0])?.label ?? 'Balanced';
    }
    return `${tonePreferences.selectedStyles.length} styles`;
  };

  // Generate time options including "soon" times for testing
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Build dynamic time options: next few minutes + standard times
  const generateTimeOptions = () => {
    const options = [];

    // Add "in 1 minute" option for testing
    let testMinute = (currentMinute + 1) % 60;
    let testHour = currentHour + (currentMinute + 1 >= 60 ? 1 : 0);
    if (testHour >= 24) testHour = 0;
    options.push({
      hour: testHour,
      minute: testMinute,
      label: `In 1 min (${formatTime(testHour, testMinute)})`,
    });

    // Add "in 5 minutes" option
    testMinute = (currentMinute + 5) % 60;
    testHour = currentHour + (currentMinute + 5 >= 60 ? 1 : 0);
    if (testHour >= 24) testHour = 0;
    options.push({
      hour: testHour,
      minute: testMinute,
      label: `In 5 min (${formatTime(testHour, testMinute)})`,
    });

    // Add standard daily times
    const standardTimes = [
      { hour: 7, minute: 0 },
      { hour: 9, minute: 0 },
      { hour: 12, minute: 0 },
      { hour: 18, minute: 0 },
      { hour: 20, minute: 0 },
      { hour: 21, minute: 0 },
    ];

    for (const time of standardTimes) {
      options.push({
        hour: time.hour,
        minute: time.minute,
        label: formatTime(time.hour, time.minute),
      });
    }

    return options;
  };

  const timeOptions = generateTimeOptions();

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

        {/* Adaptive Suggestion (Unit 14) */}
        {adaptiveSuggestion && adaptiveSuggestion.shouldSuggest && (
          <View style={[styles.adaptiveCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.adaptiveText, { color: colors.textSecondary }]}>
              {adaptiveSuggestion.message}
            </Text>
            <View style={styles.adaptiveButtons}>
              <TouchableOpacity
                style={[styles.adaptiveAccept, { backgroundColor: colors.tint }]}
                onPress={handleAcceptAdaptive}
              >
                <Text style={styles.adaptiveAcceptText}>
                  Try {FREQUENCY_OPTIONS.find(o => o.value === adaptiveSuggestion.suggestedFrequency)?.label.toLowerCase()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.adaptiveDismiss}
                onPress={() => setAdaptiveSuggestion(null)}
              >
                <Text style={[styles.adaptiveDismissText, { color: colors.textMuted }]}>
                  Keep current
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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

        {/* Frequency Selector (Unit 14) */}
        {reminderEnabled && (
          <View style={styles.timeSection}>
            <TouchableOpacity
              style={[styles.timeButton, { backgroundColor: colors.background }]}
              onPress={() => setShowFrequencyPicker(!showFrequencyPicker)}
            >
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                Frequency
              </Text>
              <Text style={[styles.timeValue, { color: colors.text }]}>
                {getCurrentFrequencyLabel()}
              </Text>
            </TouchableOpacity>

            {/* Frequency Options */}
            {showFrequencyPicker && (
              <View style={styles.frequencyOptions}>
                {FREQUENCY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.frequencyOption,
                      {
                        backgroundColor:
                          option.value === reminderFrequency
                            ? colors.tint
                            : colors.background,
                      },
                    ]}
                    onPress={() => handleFrequencyChange(option.value)}
                  >
                    <Text
                      style={[
                        styles.frequencyLabel,
                        {
                          color:
                            option.value === reminderFrequency ? '#FFFFFF' : colors.text,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.frequencyDesc,
                        {
                          color:
                            option.value === reminderFrequency ? '#FFFFFF' : colors.textMuted,
                        },
                      ]}
                    >
                      {option.description}
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

      {/* Response Style Section (Unit 16) */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Response Style
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.timeButton, { backgroundColor: colors.background }]}
          onPress={() => setShowToneOptions(!showToneOptions)}
        >
          <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
            Your preferred tone
          </Text>
          <Text style={[styles.timeValue, { color: colors.text }]}>
            {getSelectedStylesLabel()}
          </Text>
        </TouchableOpacity>

        {showToneOptions && (
          <View style={styles.toneOptionsContainer}>
            <Text style={[styles.toneHint, { color: colors.textMuted }]}>
              Select one or more styles to customize how Moodling responds to you:
            </Text>
            {TONE_OPTIONS.map((option) => {
              const isSelected = tonePreferences.selectedStyles.includes(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.toneOption,
                    {
                      backgroundColor: isSelected ? colors.tint : colors.background,
                      borderColor: isSelected ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => handleToneToggle(option.id)}
                >
                  <View style={styles.toneOptionHeader}>
                    <View style={styles.toneCheckbox}>
                      {isSelected && <Text style={styles.toneCheckmark}>✓</Text>}
                    </View>
                    <View style={styles.toneOptionText}>
                      <Text
                        style={[
                          styles.toneLabel,
                          { color: isSelected ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.toneDescription,
                          { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textMuted },
                        ]}
                      >
                        {option.description}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Preview examples */}
            {tonePreferences.selectedStyles.length > 0 && (
              <View style={[styles.tonePreview, { backgroundColor: colors.background }]}>
                <Text style={[styles.tonePreviewTitle, { color: colors.textSecondary }]}>
                  Example responses:
                </Text>
                {getStyleExamples(tonePreferences.selectedStyles).slice(0, 3).map((example, i) => (
                  <Text key={i} style={[styles.tonePreviewText, { color: colors.textMuted }]}>
                    "{example}"
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        <Text style={[styles.toneNote, { color: colors.textMuted }]}>
          These preferences shape how reflections and coaching feel. Mix and match to find your fit.
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
        Version 1.0.0 (Unit 16)
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
  // Unit 14: Adaptive reminder styles
  adaptiveCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  adaptiveText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  adaptiveButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  adaptiveAccept: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adaptiveAcceptText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  adaptiveDismiss: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  adaptiveDismissText: {
    fontSize: 14,
  },
  frequencyOptions: {
    marginTop: 12,
    gap: 8,
  },
  frequencyOption: {
    padding: 12,
    borderRadius: 10,
  },
  frequencyLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  frequencyDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  // Unit 16: Tone preferences styles
  toneOptionsContainer: {
    marginTop: 12,
  },
  toneHint: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  toneOption: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  toneOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toneCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toneCheckmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  toneOptionText: {
    flex: 1,
  },
  toneLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  toneDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  tonePreview: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  tonePreviewTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  tonePreviewText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 4,
    lineHeight: 18,
  },
  toneNote: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 12,
  },
});
