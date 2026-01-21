import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import {
  getCoachSettings,
  getCoachDisplayName,
  PERSONAS,
  CoachPersona,
  CoachSettings,
  resetOnboarding,
} from '@/services/coachPersonalityService';
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
import {
  hasAPIKey,
  setAPIKey,
  removeAPIKey,
  getCostData,
  CLAUDE_CONFIG,
} from '@/services/claudeAPIService';
import {
  getUserPreferences,
  saveUserPreferences,
  UserPreferences,
} from '@/services/userContextService';

/**
 * Settings Tab - Configuration & Privacy
 *
 * Following Mood Leaf Ethics:
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

  // Claude API state (Unit 18)
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [monthlyCost, setMonthlyCost] = useState('$0.00');
  const [totalCost, setTotalCost] = useState('$0.00');

  // Personalization state
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({});
  const [showPersonalization, setShowPersonalization] = useState(false);

  // Coach personality state (Unit 17)
  const [coachSettings, setCoachSettings] = useState<CoachSettings | null>(null);

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

      // Load Claude API status (Unit 18)
      const hasKey = await hasAPIKey();
      setApiKeyConfigured(hasKey);
      if (hasKey) {
        const costData = await getCostData();
        setMonthlyCost(costData.formattedMonthly);
        setTotalCost(costData.formattedTotal);
      }

      // Load personalization preferences
      const prefs = await getUserPreferences();
      setUserPrefs(prefs);

      // Load coach personality (Unit 17)
      const loadedCoachSettings = await getCoachSettings();
      setCoachSettings(loadedCoachSettings);
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

  // Handle personalization updates
  const updatePersonalization = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const newPrefs = { ...userPrefs, [key]: value };
    setUserPrefs(newPrefs);
    await saveUserPreferences(newPrefs);
  };

  // Handle API key save (Unit 18)
  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;

    try {
      await setAPIKey(apiKeyInput.trim());
      setApiKeyConfigured(true);
      setShowApiKeyInput(false);
      setApiKeyInput('');

      // Reload cost data
      const costData = await getCostData();
      setMonthlyCost(costData.formattedMonthly);
      setTotalCost(costData.formattedTotal);
    } catch (error) {
      console.error('Failed to save API key:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to save API key');
      } else {
        Alert.alert('Error', 'Failed to save API key');
      }
    }
  };

  // Handle API key removal (Unit 18)
  const handleRemoveApiKey = async () => {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Remove your Claude API key? You can add it again later.')
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Remove API Key',
            'Remove your Claude API key? You can add it again later.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Remove', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (confirm) {
      await removeAPIKey();
      setApiKeyConfigured(false);
    }
  };

  // Handle redo onboarding
  const handleRedoOnboarding = async () => {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Start fresh with onboarding? Your journal entries will be kept.')
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Redo Onboarding',
            'Start fresh with onboarding? Your journal entries will be kept.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Start Fresh', onPress: () => resolve(true) },
            ]
          );
        });

    if (confirm) {
      await resetOnboarding();
      router.replace('/onboarding');
    }
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

      {/* FAQ & Help Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Help & FAQ
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.faqItem, { backgroundColor: colors.background }]}
          onPress={() => router.push('/guide')}
        >
          <Text style={styles.faqEmoji}>🌳</Text>
          <View style={styles.faqContent}>
            <Text style={[styles.faqTitle, { color: colors.text }]}>
              App Guide
            </Text>
            <Text style={[styles.faqSubtitle, { color: colors.textSecondary }]}>
              Learn how to use Mood Leaf
            </Text>
          </View>
          <Text style={[styles.faqArrow, { color: colors.textMuted }]}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.faqItem, { backgroundColor: colors.background }]}
          onPress={handleRedoOnboarding}
        >
          <Text style={styles.faqEmoji}>🔄</Text>
          <View style={styles.faqContent}>
            <Text style={[styles.faqTitle, { color: colors.text }]}>
              Redo Onboarding
            </Text>
            <Text style={[styles.faqSubtitle, { color: colors.textSecondary }]}>
              Start fresh with a new setup
            </Text>
          </View>
          <Text style={[styles.faqArrow, { color: colors.textMuted }]}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.faqItem, { backgroundColor: colors.background }]}
          onPress={() => router.push('/user-manual')}
        >
          <Text style={styles.faqEmoji}>📖</Text>
          <View style={styles.faqContent}>
            <Text style={[styles.faqTitle, { color: colors.text }]}>
              Full User Manual
            </Text>
            <Text style={[styles.faqSubtitle, { color: colors.textSecondary }]}>
              Complete guide to all features
            </Text>
          </View>
          <Text style={[styles.faqArrow, { color: colors.textMuted }]}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.faqItem, { backgroundColor: colors.background }]}
          onPress={() => router.push('/faq')}
        >
          <Text style={styles.faqEmoji}>❓</Text>
          <View style={styles.faqContent}>
            <Text style={[styles.faqTitle, { color: colors.text }]}>
              Full FAQ
            </Text>
            <Text style={[styles.faqSubtitle, { color: colors.textSecondary }]}>
              All questions answered
            </Text>
          </View>
          <Text style={[styles.faqArrow, { color: colors.textMuted }]}>→</Text>
        </TouchableOpacity>

        <View style={styles.faqDivider} />

        <Text style={[styles.faqSectionLabel, { color: colors.textSecondary }]}>
          Common Questions
        </Text>

        <View style={styles.faqList}>
          <View style={styles.faqQuestion}>
            <Text style={[styles.faqQ, { color: colors.text }]}>
              What is the tree?
            </Text>
            <Text style={[styles.faqA, { color: colors.textSecondary }]}>
              Your tree is a visual representation of your emotional journey. Each journal entry becomes a leaf, and patterns form branches over time.
            </Text>
          </View>

          <View style={styles.faqQuestion}>
            <Text style={[styles.faqQ, { color: colors.text }]}>
              What are Fireflies?
            </Text>
            <Text style={[styles.faqA, { color: colors.textSecondary }]}>
              Fireflies are gentle bits of wisdom that float around your tree. Tap them for personalized insights based on your journey.
            </Text>
          </View>

          <View style={styles.faqQuestion}>
            <Text style={[styles.faqQ, { color: colors.text }]}>
              What are Twigs?
            </Text>
            <Text style={[styles.faqA, { color: colors.textSecondary }]}>
              Twigs are quick logs for when you don't have time for a full entry. Track mood, sleep, or energy with just a tap.
            </Text>
          </View>

          <View style={styles.faqQuestion}>
            <Text style={[styles.faqQ, { color: colors.text }]}>
              What are Personas?
            </Text>
            <Text style={[styles.faqA, { color: colors.textSecondary }]}>
              Your guide has 7 nature-themed personalities: Clover (warm & casual), Spark (energetic), Willow (wise), Luna (mindful), Ridge (goal-focused), Flint (direct), and Fern (nurturing). Pick one during onboarding or change anytime in Coach Settings.
            </Text>
          </View>

          <View style={styles.faqQuestion}>
            <Text style={[styles.faqQ, { color: colors.text }]}>
              How does my guide adapt?
            </Text>
            <Text style={[styles.faqA, { color: colors.textSecondary }]}>
              With Adaptive Mode on, your guide can shift personalities based on your mood (anxious → calming Luna, sad → nurturing Fern). It also adjusts energy throughout the day—more energizing in the morning, calmer at night.
            </Text>
          </View>

          <View style={styles.faqQuestion}>
            <Text style={[styles.faqQ, { color: colors.text }]}>
              What is Chronotype?
            </Text>
            <Text style={[styles.faqA, { color: colors.textSecondary }]}>
              Your natural rhythm—early bird, normal, or night owl. Your guide respects this: night owls won't get "wind down" pressure at 10pm if that's their productive time. Set this during onboarding or in Coach Settings.
            </Text>
          </View>

          <View style={styles.faqQuestion}>
            <Text style={[styles.faqQ, { color: colors.text }]}>
              Is my data private?
            </Text>
            <Text style={[styles.faqA, { color: colors.textSecondary }]}>
              Yes! All journal entries and patterns stay on your device. Only coaching messages are sent to Claude's API (if enabled), and they're not stored.
            </Text>
          </View>
        </View>
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
          Mood Leaf will gently remind you to check in. You can always ignore it — no pressure, no streaks.
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
              Select one or more styles to customize how Mood Leaf responds to you:
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

      {/* Coach Personality Section (Unit 17) */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Guide
          </Text>
        </View>

        {coachSettings && (
          <TouchableOpacity
            style={[styles.coachCard, { backgroundColor: colors.background }]}
            onPress={() => router.push('/coach/settings')}
          >
            <Text style={styles.coachEmoji}>{PERSONAS[coachSettings.selectedPersona].emoji}</Text>
            <View style={styles.coachInfo}>
              <Text style={[styles.coachName, { color: colors.text }]}>
                {getCoachDisplayName(coachSettings)}
              </Text>
              <Text style={[styles.coachTagline, { color: colors.textSecondary }]}>
                {PERSONAS[coachSettings.selectedPersona].tagline}
              </Text>
            </View>
            <Text style={[styles.coachArrow, { color: colors.textMuted }]}>→</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.coachNote, { color: colors.textMuted }]}>
          Customize your guide's personality, communication style, and adaptive behaviors.
        </Text>
      </View>

      {/* Cycle Tracking Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Cycle Tracking
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.faqItem, { backgroundColor: colors.background }]}
          onPress={() => router.push('/settings/cycle')}
        >
          <Text style={styles.faqEmoji}>🌙</Text>
          <View style={styles.faqContent}>
            <Text style={[styles.faqTitle, { color: colors.text }]}>
              Cycle Settings
            </Text>
            <Text style={[styles.faqSubtitle, { color: colors.textSecondary }]}>
              Period tracking, life stages, reminders
            </Text>
          </View>
          <Text style={[styles.faqArrow, { color: colors.textMuted }]}>→</Text>
        </TouchableOpacity>

        <Text style={[styles.coachNote, { color: colors.textMuted }]}>
          Optional cycle-aware features. Track periods, symptoms, and get phase-adapted support.
        </Text>
      </View>

      {/* Food Tracking Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Food Tracking
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.faqItem, { backgroundColor: colors.background }]}
          onPress={() => router.push('/settings/food')}
        >
          <Text style={styles.faqEmoji}>🍽️</Text>
          <View style={styles.faqContent}>
            <Text style={[styles.faqTitle, { color: colors.text }]}>
              Food Settings
            </Text>
            <Text style={[styles.faqSubtitle, { color: colors.textSecondary }]}>
              Calorie goals, AI detection, tracking
            </Text>
          </View>
          <Text style={[styles.faqArrow, { color: colors.textMuted }]}>→</Text>
        </TouchableOpacity>

        <Text style={[styles.coachNote, { color: colors.textMuted }]}>
          Track meals and calories. AI auto-detects food from journal entries.
        </Text>
      </View>

      {/* Personalization Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Personalization
          </Text>
        </View>

        <Text style={[styles.personalizationDesc, { color: colors.textSecondary }]}>
          Help Mood Leaf understand how you like to communicate. This shapes coaching conversations.
        </Text>

        <TouchableOpacity
          style={[styles.timeButton, { backgroundColor: colors.background }]}
          onPress={() => setShowPersonalization(!showPersonalization)}
        >
          <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
            Your preferences
          </Text>
          <Text style={[styles.timeValue, { color: colors.text }]}>
            {userPrefs.temperament || userPrefs.communicationStyle ? 'Configured' : 'Not set'}
          </Text>
        </TouchableOpacity>

        {showPersonalization && (
          <View style={styles.personalizationOptions}>
            {/* Temperament */}
            <Text style={[styles.personalizationLabel, { color: colors.text }]}>
              How would you describe yourself?
            </Text>
            <View style={styles.personalizationRow}>
              {(['introvert', 'ambivert', 'extrovert'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.personalizationChip,
                    {
                      backgroundColor: userPrefs.temperament === type ? colors.tint : colors.background,
                      borderColor: userPrefs.temperament === type ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => updatePersonalization('temperament', type)}
                >
                  <Text
                    style={[
                      styles.personalizationChipText,
                      { color: userPrefs.temperament === type ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Communication Style */}
            <Text style={[styles.personalizationLabel, { color: colors.text, marginTop: 16 }]}>
              How do you like to be talked to?
            </Text>
            <View style={styles.personalizationRow}>
              {([
                { value: 'direct', label: 'Direct' },
                { value: 'gentle', label: 'Gentle' },
                { value: 'detailed', label: 'Detailed' },
              ] as const).map((style) => (
                <TouchableOpacity
                  key={style.value}
                  style={[
                    styles.personalizationChip,
                    {
                      backgroundColor: userPrefs.communicationStyle === style.value ? colors.tint : colors.background,
                      borderColor: userPrefs.communicationStyle === style.value ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => updatePersonalization('communicationStyle', style.value)}
                >
                  <Text
                    style={[
                      styles.personalizationChipText,
                      { color: userPrefs.communicationStyle === style.value ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {style.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Preference toggles */}
            <Text style={[styles.personalizationLabel, { color: colors.text, marginTop: 16 }]}>
              Communication preferences
            </Text>

            <TouchableOpacity
              style={[
                styles.prefToggle,
                {
                  backgroundColor: userPrefs.prefersDirectness ? colors.tint : colors.background,
                  borderColor: userPrefs.prefersDirectness ? colors.tint : colors.border,
                },
              ]}
              onPress={() => updatePersonalization('prefersDirectness', !userPrefs.prefersDirectness)}
            >
              <Text style={[styles.prefToggleText, { color: userPrefs.prefersDirectness ? '#FFFFFF' : colors.text }]}>
                I prefer direct feedback
              </Text>
              {userPrefs.prefersDirectness && <Text style={styles.prefToggleCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.prefToggle,
                {
                  backgroundColor: userPrefs.dislikesPlatitudes ? colors.tint : colors.background,
                  borderColor: userPrefs.dislikesPlatitudes ? colors.tint : colors.border,
                },
              ]}
              onPress={() => updatePersonalization('dislikesPlatitudes', !userPrefs.dislikesPlatitudes)}
            >
              <Text style={[styles.prefToggleText, { color: userPrefs.dislikesPlatitudes ? '#FFFFFF' : colors.text }]}>
                Skip generic phrases like "everything happens for a reason"
              </Text>
              {userPrefs.dislikesPlatitudes && <Text style={styles.prefToggleCheck}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.prefToggle,
                {
                  backgroundColor: userPrefs.respondsWellToHumor ? colors.tint : colors.background,
                  borderColor: userPrefs.respondsWellToHumor ? colors.tint : colors.border,
                },
              ]}
              onPress={() => updatePersonalization('respondsWellToHumor', !userPrefs.respondsWellToHumor)}
            >
              <Text style={[styles.prefToggleText, { color: userPrefs.respondsWellToHumor ? '#FFFFFF' : colors.text }]}>
                Light humor is welcome
              </Text>
              {userPrefs.respondsWellToHumor && <Text style={styles.prefToggleCheck}>✓</Text>}
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.personalizationNote, { color: colors.textMuted }]}>
          These help Mood Leaf adapt to your style. You can change them anytime.
        </Text>
      </View>

      {/* Claude AI Section (Unit 18) */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            AI Coaching
          </Text>
        </View>

        <Text style={[styles.apiDescription, { color: colors.textSecondary }]}>
          Enable AI-powered coaching conversations with Claude. Your data stays on-device; only
          conversation messages are sent to Claude's API when you chat.
        </Text>

        {apiKeyConfigured ? (
          <View style={styles.apiConfigured}>
            <View style={styles.apiStatusRow}>
              <Text style={[styles.apiStatusIcon]}>✓</Text>
              <Text style={[styles.apiStatusText, { color: colors.text }]}>
                API key configured
              </Text>
            </View>

            {/* Cost tracking */}
            <View style={[styles.costCard, { backgroundColor: colors.background }]}>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: colors.textSecondary }]}>
                  This month
                </Text>
                <Text style={[styles.costValue, { color: colors.text }]}>
                  {monthlyCost}
                </Text>
              </View>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: colors.textSecondary }]}>
                  All time
                </Text>
                <Text style={[styles.costValue, { color: colors.text }]}>
                  {totalCost}
                </Text>
              </View>
              <Text style={[styles.costNote, { color: colors.textMuted }]}>
                Using {CLAUDE_CONFIG.model.includes('haiku') ? 'Claude 3 Haiku' : 'Claude 3.5 Sonnet'} (~$0.001/conversation)
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.removeApiButton, { borderColor: colors.error }]}
              onPress={handleRemoveApiKey}
            >
              <Text style={[styles.removeApiButtonText, { color: colors.error }]}>
                Remove API key
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.apiNotConfigured}>
            {!showApiKeyInput ? (
              <TouchableOpacity
                style={[styles.addApiButton, { backgroundColor: colors.tint }]}
                onPress={() => setShowApiKeyInput(true)}
              >
                <Text style={styles.addApiButtonText}>
                  Add Claude API Key
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.apiInputContainer}>
                <TextInput
                  style={[styles.apiInput, {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  }]}
                  placeholder="sk-ant-api03-..."
                  placeholderTextColor={colors.textMuted}
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                />
                <View style={styles.apiInputButtons}>
                  <TouchableOpacity
                    style={[styles.apiSaveButton, { backgroundColor: colors.tint }]}
                    onPress={handleSaveApiKey}
                    disabled={!apiKeyInput.trim()}
                  >
                    <Text style={styles.apiSaveButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.apiCancelButton}
                    onPress={() => {
                      setShowApiKeyInput(false);
                      setApiKeyInput('');
                    }}
                  >
                    <Text style={[styles.apiCancelButtonText, { color: colors.textMuted }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={[styles.apiHint, { color: colors.textMuted }]}>
              Get your API key from{' '}
              <Text style={{ color: colors.tint }}>console.anthropic.com</Text>
            </Text>
          </View>
        )}
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
          Journal entries and patterns stay on-device. Only coaching chat messages are sent to Claude's API (if enabled), and they are not stored by Anthropic.
        </Text>
      </View>

      {/* Developer Tools Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Developer Tools
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.faqItem, { backgroundColor: colors.background }]}
          onPress={() => router.push('/simulator')}
        >
          <Text style={styles.faqEmoji}>🔬</Text>
          <View style={styles.faqContent}>
            <Text style={[styles.faqTitle, { color: colors.text }]}>
              Simulator Mode
            </Text>
            <Text style={[styles.faqSubtitle, { color: colors.textSecondary }]}>
              AI adaptation verification & testing
            </Text>
          </View>
          <Text style={[styles.faqArrow, { color: colors.textMuted }]}>→</Text>
        </TouchableOpacity>

        <Text style={[styles.devNote, { color: colors.textMuted }]}>
          Test AI referencing accuracy and troubleshoot issues.
        </Text>
      </View>

      {/* About Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About Mood Leaf
          </Text>
        </View>
        <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
          Mood Leaf helps you notice patterns in how you feel without diagnosing or judging.
        </Text>
        <Text style={[styles.aboutPhilosophy, { color: colors.textMuted }]}>
          Our highest success is when you need this app less, not more.
        </Text>
      </View>

      <Text style={[styles.version, { color: colors.textMuted }]}>
        Version 1.0.0 (Unit 18)
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
  // Unit 18: Claude API styles
  apiDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  apiConfigured: {
    marginTop: 8,
  },
  apiStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  apiStatusIcon: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 8,
  },
  apiStatusText: {
    fontSize: 15,
    fontWeight: '500',
  },
  costCard: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  costLabel: {
    fontSize: 14,
  },
  costValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  costNote: {
    fontSize: 12,
    marginTop: 8,
  },
  removeApiButton: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  removeApiButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  apiNotConfigured: {
    marginTop: 8,
  },
  addApiButton: {
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  addApiButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  apiInputContainer: {
    marginBottom: 12,
  },
  apiInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  apiInputButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  apiSaveButton: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  apiSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  apiCancelButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  apiCancelButtonText: {
    fontSize: 15,
  },
  apiHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Personalization styles
  personalizationDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  personalizationOptions: {
    marginTop: 12,
  },
  personalizationLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  personalizationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  personalizationChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  personalizationChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  prefToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  prefToggleText: {
    fontSize: 14,
    flex: 1,
  },
  prefToggleCheck: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  personalizationNote: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 12,
  },
  // Unit 17: Coach personality styles
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  coachEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 17,
    fontWeight: '600',
  },
  coachTagline: {
    fontSize: 14,
    marginTop: 2,
  },
  coachArrow: {
    fontSize: 18,
    marginLeft: 8,
  },
  coachNote: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  // FAQ styles
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  faqEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  faqContent: {
    flex: 1,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  faqSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  faqArrow: {
    fontSize: 18,
    marginLeft: 8,
  },
  faqDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 12,
  },
  faqSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  faqList: {
    gap: 16,
  },
  faqQuestion: {
    gap: 4,
  },
  faqQ: {
    fontSize: 15,
    fontWeight: '600',
  },
  faqA: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Developer tools styles
  devNote: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 4,
  },
});
