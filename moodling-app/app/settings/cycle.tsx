/**
 * Cycle Tracking Settings
 *
 * Comprehensive settings for menstrual cycle tracking.
 * Following Mood Leaf Ethics:
 * - User has full control over every feature
 * - Privacy-first design
 * - Not everyone has the same experience
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import {
  getCycleSettings,
  saveCycleSettings,
  getCycleData,
  getCurrentPhase,
  getPredictedNextPeriod,
  startPeriod,
  endPeriod,
  isOnPeriod,
  clearAllCycleData,
} from '@/services/cycleTrackingService';
import {
  CycleSettings,
  CycleTwigSettings,
  GuideAdaptationLevel,
  LifeStage,
  createDefaultCycleSettings,
  getLifeStageDescription,
  getMenopauseSymptoms,
} from '@/types/CycleTracking';
import { syncCycleWithHealthKit, isHealthKitAvailable } from '@/services/healthKitService';

// Life stage options
const LIFE_STAGE_OPTIONS: { value: LifeStage; label: string; emoji: string; description: string }[] = [
  { value: 'regularCycles', label: 'Regular Cycles', emoji: '🌙', description: 'Normal menstrual cycles' },
  { value: 'perimenopause', label: 'Perimenopause', emoji: '🌅', description: 'Transition phase, irregular cycles' },
  { value: 'menopause', label: 'Menopause', emoji: '🌸', description: 'No period 12+ months' },
  { value: 'postMenopause', label: 'Post-Menopause', emoji: '✨', description: 'Wellness focus' },
  { value: 'pregnant', label: 'Pregnant', emoji: '🤰', description: 'Cycle tracking paused' },
  { value: 'postpartum', label: 'Postpartum', emoji: '👶', description: 'Recovery period' },
];

// Menopause symptom toggles
const MENOPAUSE_SYMPTOM_TOGGLES = [
  { type: 'hotFlash', label: 'Hot Flashes', emoji: '🔥' },
  { type: 'nightSweat', label: 'Night Sweats', emoji: '💦' },
  { type: 'sleepDisturbance', label: 'Sleep Issues', emoji: '😴' },
  { type: 'brainFog', label: 'Brain Fog', emoji: '🌫️' },
  { type: 'moodShift', label: 'Mood Changes', emoji: '😢' },
  { type: 'anxietySpike', label: 'Anxiety', emoji: '😰' },
  { type: 'jointPain', label: 'Joint Pain', emoji: '🦴' },
  { type: 'heartPalpitations', label: 'Heart Palpitations', emoji: '💓' },
  { type: 'libidoChange', label: 'Libido Changes', emoji: '💕' },
];

// Guide adaptation level options
const ADAPTATION_OPTIONS: { value: GuideAdaptationLevel; label: string; description: string }[] = [
  { value: 'none', label: 'None', description: 'Guide doesn\'t adapt to cycle' },
  { value: 'subtle', label: 'Subtle', description: 'Slight tone adjustments' },
  { value: 'full', label: 'Full', description: 'Complete adaptation to phase' },
];

// Sync source options
const SYNC_OPTIONS: { value: CycleSettings['syncSource']; label: string; description: string }[] = [
  { value: 'manual', label: 'Manual', description: 'Log periods yourself' },
  { value: 'healthkit', label: 'Apple Health', description: 'Sync with HealthKit' },
  { value: 'oura', label: 'Oura Ring', description: 'Import from Oura' },
  { value: 'whoop', label: 'Whoop', description: 'Import from Whoop' },
];

// Alert type options
const ALERT_OPTIONS: { value: 'push' | 'firefly'; label: string; description: string }[] = [
  { value: 'push', label: 'Push Notifications', description: 'Standard phone notifications' },
  { value: 'firefly', label: 'Firefly Alerts', description: 'Gentle in-app blinking Firefly' },
];

// Twig toggle configuration
const TWIG_TOGGLES: { key: keyof CycleTwigSettings; label: string; emoji: string }[] = [
  { key: 'periodStartEnd', label: 'Period Start/End', emoji: '📅' },
  { key: 'flowLevel', label: 'Flow Level', emoji: '🩸' },
  { key: 'cramps', label: 'Cramps', emoji: '😣' },
  { key: 'bloating', label: 'Bloating', emoji: '🫃' },
  { key: 'breastTenderness', label: 'Breast Tenderness', emoji: '💔' },
  { key: 'headache', label: 'Headache', emoji: '🤕' },
  { key: 'moodShift', label: 'Mood Shifts', emoji: '😢' },
  { key: 'cravings', label: 'Cravings', emoji: '🍫' },
  { key: 'energyLevel', label: 'Energy Level', emoji: '⚡' },
  { key: 'sleepQuality', label: 'Sleep Quality', emoji: '😴' },
];

export default function CycleSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CycleSettings>(createDefaultCycleSettings());
  const [cycleInfo, setCycleInfo] = useState<{
    currentPhase: string | null;
    dayOfCycle: number | null;
    nextPeriod: Date | null;
    onPeriod: boolean;
    totalPeriods: number;
  }>({
    currentPhase: null,
    dayOfCycle: null,
    nextPeriod: null,
    onPeriod: false,
    totalPeriods: 0,
  });

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const [loadedSettings, data, phaseInfo, nextPeriod, onPeriodNow] = await Promise.all([
        getCycleSettings(),
        getCycleData(),
        getCurrentPhase(),
        getPredictedNextPeriod(),
        isOnPeriod(),
      ]);

      setSettings(loadedSettings);
      setCycleInfo({
        currentPhase: phaseInfo?.phase ?? null,
        dayOfCycle: phaseInfo?.dayOfCycle ?? null,
        nextPeriod,
        onPeriod: onPeriodNow,
        totalPeriods: data.periods.length,
      });
    } catch (error) {
      console.error('Error loading cycle settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Save settings
  const handleSave = async (newSettings: CycleSettings) => {
    try {
      setSaving(true);
      await saveCycleSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving cycle settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Update a specific setting
  const updateSetting = <K extends keyof CycleSettings>(
    key: K,
    value: CycleSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    handleSave(newSettings);
  };

  // Update a twig setting
  const updateTwig = (key: keyof CycleTwigSettings, value: boolean) => {
    const newSettings = {
      ...settings,
      enabledTwigs: { ...settings.enabledTwigs, [key]: value },
    };
    handleSave(newSettings);
  };

  // Enable all twigs
  const enableAllTwigs = () => {
    const allEnabled: CycleTwigSettings = {
      periodStartEnd: true,
      flowLevel: true,
      cramps: true,
      bloating: true,
      breastTenderness: true,
      headache: true,
      moodShift: true,
      cravings: true,
      energyLevel: true,
      sleepQuality: true,
    };
    const newSettings = { ...settings, enabledTwigs: allEnabled };
    handleSave(newSettings);
  };

  // Update reminder setting
  const updateReminder = <K extends keyof CycleSettings['reminders']>(
    key: K,
    value: CycleSettings['reminders'][K]
  ) => {
    const newSettings = {
      ...settings,
      reminders: { ...settings.reminders, [key]: value },
    };
    handleSave(newSettings);
  };

  // Toggle period
  const handlePeriodToggle = async () => {
    try {
      if (cycleInfo.onPeriod) {
        await endPeriod();
      } else {
        await startPeriod();
      }
      loadSettings();
    } catch (error) {
      console.error('Error toggling period:', error);
    }
  };

  // Sync with HealthKit
  const handleHealthKitSync = async () => {
    try {
      const result = await syncCycleWithHealthKit();
      Alert.alert(
        'Sync Complete',
        `Imported ${result.imported} records, exported ${result.exported} symptoms`
      );
      loadSettings();
    } catch (error) {
      Alert.alert('Sync Failed', 'Could not sync with Apple Health');
    }
  };

  // Clear all data
  const handleClearData = () => {
    Alert.alert(
      'Clear All Cycle Data?',
      'This will delete all your period history and symptoms. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllCycleData();
            loadSettings();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.warmNeutral.cream }]}>
        <Stack.Screen options={{ title: 'Cycle Tracking' }} />
        <ActivityIndicator size="large" color={colors.accent.terracotta} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.warmNeutral.cream }]}>
      <Stack.Screen
        options={{
          title: 'Cycle Tracking',
          headerStyle: { backgroundColor: colors.warmNeutral.cream },
          headerTintColor: colors.warmNeutral.charcoal,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Master Toggle */}
        <View style={[styles.section, { backgroundColor: colors.warmNeutral.sand }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.warmNeutral.charcoal }]}>
                🌙 Cycle Tracking
              </Text>
              <Text style={[styles.settingDescription, { color: colors.warmNeutral.stone }]}>
                Enable cycle-aware adaptation across the app
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => updateSetting('enabled', value)}
              trackColor={{ false: colors.warmNeutral.stone, true: colors.accent.terracotta }}
            />
          </View>
        </View>

        {settings.enabled && (
          <>
            {/* Life Stage Selection */}
            <View style={[styles.section, { backgroundColor: colors.warmNeutral.sand }]}>
              <Text style={[styles.sectionTitle, { color: colors.warmNeutral.charcoal }]}>
                Life Stage
              </Text>
              <Text style={[styles.sectionDescription, { color: colors.warmNeutral.stone }]}>
                Select your current stage for personalized tracking
              </Text>
              <View style={styles.lifeStageGrid}>
                {LIFE_STAGE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.lifeStageOption,
                      {
                        backgroundColor:
                          settings.lifeStage === option.value
                            ? colors.accent.terracotta
                            : colors.warmNeutral.cream,
                        borderColor:
                          settings.lifeStage === option.value
                            ? colors.accent.terracotta
                            : colors.warmNeutral.stone + '50',
                      },
                    ]}
                    onPress={() => updateSetting('lifeStage', option.value)}
                  >
                    <Text style={styles.lifeStageEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.lifeStageLabel,
                        {
                          color:
                            settings.lifeStage === option.value
                              ? colors.warmNeutral.cream
                              : colors.warmNeutral.charcoal,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Menopause Symptoms - Show for perimenopause/menopause */}
            {(settings.lifeStage === 'perimenopause' || settings.lifeStage === 'menopause') && (
              <View style={[styles.section, { backgroundColor: colors.accent.lavender + '20' }]}>
                <Text style={[styles.sectionTitle, { color: colors.warmNeutral.charcoal }]}>
                  {settings.lifeStage === 'perimenopause' ? 'Perimenopause' : 'Menopause'} Symptoms
                </Text>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingLabel, { color: colors.warmNeutral.charcoal }]}>
                      Track Symptoms
                    </Text>
                    <Text style={[styles.settingDescription, { color: colors.warmNeutral.stone }]}>
                      Log hot flashes, night sweats, mood changes, etc.
                    </Text>
                  </View>
                  <Switch
                    value={settings.trackMenopauseSymptoms}
                    onValueChange={(value) => updateSetting('trackMenopauseSymptoms', value)}
                    trackColor={{ false: colors.warmNeutral.stone, true: colors.accent.terracotta }}
                  />
                </View>
                {settings.trackMenopauseSymptoms && (
                  <View style={styles.symptomGrid}>
                    {MENOPAUSE_SYMPTOM_TOGGLES.map((symptom) => (
                      <View key={symptom.type} style={styles.symptomChip}>
                        <Text style={styles.symptomEmoji}>{symptom.emoji}</Text>
                        <Text style={[styles.symptomLabel, { color: colors.warmNeutral.charcoal }]}>
                          {symptom.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Pregnancy Mode */}
            {settings.lifeStage === 'pregnant' && (
              <View style={[styles.section, { backgroundColor: colors.accent.sage + '20' }]}>
                <Text style={[styles.sectionTitle, { color: colors.warmNeutral.charcoal }]}>
                  Pregnancy Mode
                </Text>
                <Text style={[styles.sectionDescription, { color: colors.warmNeutral.stone }]}>
                  Period tracking is paused. Your guide adapts to your trimester.
                </Text>
                <View style={styles.pregnancyInfo}>
                  <Text style={[styles.pregnancyText, { color: colors.warmNeutral.charcoal }]}>
                    Set due date in app to track trimesters and get trimester-appropriate support.
                  </Text>
                </View>
              </View>
            )}

            {/* Current Status - Only for regular cycles/perimenopause */}
            {(settings.lifeStage === 'regularCycles' || settings.lifeStage === 'perimenopause') && cycleInfo.currentPhase && (
              <View style={[styles.section, { backgroundColor: colors.accent.lavender + '30' }]}>
                <Text style={[styles.sectionTitle, { color: colors.warmNeutral.charcoal }]}>
                  Current Status
                </Text>
                <View style={styles.statusGrid}>
                  <View style={styles.statusItem}>
                    <Text style={[styles.statusValue, { color: colors.warmNeutral.charcoal }]}>
                      {cycleInfo.currentPhase}
                    </Text>
                    <Text style={[styles.statusLabel, { color: colors.warmNeutral.stone }]}>
                      Phase
                    </Text>
                  </View>
                  <View style={styles.statusItem}>
                    <Text style={[styles.statusValue, { color: colors.warmNeutral.charcoal }]}>
                      Day {cycleInfo.dayOfCycle}
                    </Text>
                    <Text style={[styles.statusLabel, { color: colors.warmNeutral.stone }]}>
                      Of Cycle
                    </Text>
                  </View>
                  {cycleInfo.nextPeriod && (
                    <View style={styles.statusItem}>
                      <Text style={[styles.statusValue, { color: colors.warmNeutral.charcoal }]}>
                        {Math.ceil(
                          (cycleInfo.nextPeriod.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                        )}
                      </Text>
                      <Text style={[styles.statusLabel, { color: colors.warmNeutral.stone }]}>
                        Days Until
                      </Text>
                    </View>
                  )}
                </View>

                {/* Period Toggle Button */}
                <Pressable
                  style={[
                    styles.periodButton,
                    {
                      backgroundColor: cycleInfo.onPeriod
                        ? colors.accent.sage
                        : colors.accent.terracotta,
                    },
                  ]}
                  onPress={handlePeriodToggle}
                >
                  <Text style={[styles.periodButtonText, { color: colors.warmNeutral.cream }]}>
                    {cycleInfo.onPeriod ? '✓ End Period' : 'Start Period'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Features Section */}
            <View style={[styles.section, { backgroundColor: colors.warmNeutral.sand }]}>
              <Text style={[styles.sectionTitle, { color: colors.warmNeutral.charcoal }]}>
                Features
              </Text>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.warmNeutral.charcoal }]}>
                    Quick Symptom Button
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.warmNeutral.stone }]}>
                    Show floating button on home during period
                  </Text>
                </View>
                <Switch
                  value={settings.showQuickSymptomButton}
                  onValueChange={(value) => updateSetting('showQuickSymptomButton', value)}
                  trackColor={{ false: colors.warmNeutral.stone, true: colors.accent.terracotta }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.warmNeutral.charcoal }]}>
                    Soothing Sparks
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.warmNeutral.stone }]}>
                    Gentler prompts during PMS and period
                  </Text>
                </View>
                <Switch
                  value={settings.enableSoothingSparks}
                  onValueChange={(value) => updateSetting('enableSoothingSparks', value)}
                  trackColor={{ false: colors.warmNeutral.stone, true: colors.accent.terracotta }}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.warmNeutral.charcoal }]}>
                    Cycle Fireflies
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.warmNeutral.stone }]}>
                    Personal insights about your patterns
                  </Text>
                </View>
                <Switch
                  value={settings.enableCycleFireflies}
                  onValueChange={(value) => updateSetting('enableCycleFireflies', value)}
                  trackColor={{ false: colors.warmNeutral.stone, true: colors.accent.terracotta }}
                />
              </View>

              {/* Guide Adaptation Level */}
              <Text style={[styles.subsectionTitle, { color: colors.warmNeutral.charcoal }]}>
                Guide Adaptation
              </Text>
              <View style={styles.optionGroup}>
                {ADAPTATION_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor:
                          settings.guideAdaptationLevel === option.value
                            ? colors.accent.terracotta
                            : colors.warmNeutral.cream,
                      },
                    ]}
                    onPress={() => updateSetting('guideAdaptationLevel', option.value)}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        {
                          color:
                            settings.guideAdaptationLevel === option.value
                              ? colors.warmNeutral.cream
                              : colors.warmNeutral.charcoal,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Cycle Twigs Section */}
            <View style={[styles.section, { backgroundColor: colors.warmNeutral.sand }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.warmNeutral.charcoal }]}>
                  Cycle Twigs
                </Text>
                <Pressable
                  style={[styles.addAllButton, { backgroundColor: colors.accent.sage }]}
                  onPress={enableAllTwigs}
                >
                  <Text style={[styles.addAllText, { color: colors.warmNeutral.cream }]}>
                    Add All
                  </Text>
                </Pressable>
              </View>
              <Text style={[styles.sectionDescription, { color: colors.warmNeutral.stone }]}>
                Choose which symptoms to track
              </Text>

              {TWIG_TOGGLES.map((twig) => (
                <View key={twig.key} style={styles.settingRow}>
                  <Text style={[styles.settingLabel, { color: colors.warmNeutral.charcoal }]}>
                    {twig.emoji} {twig.label}
                  </Text>
                  <Switch
                    value={settings.enabledTwigs[twig.key]}
                    onValueChange={(value) => updateTwig(twig.key, value)}
                    trackColor={{ false: colors.warmNeutral.stone, true: colors.accent.terracotta }}
                  />
                </View>
              ))}
            </View>

            {/* Reminders Section */}
            <View style={[styles.section, { backgroundColor: colors.warmNeutral.sand }]}>
              <Text style={[styles.sectionTitle, { color: colors.warmNeutral.charcoal }]}>
                Reminders
              </Text>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.warmNeutral.charcoal }]}>
                    Enable Reminders
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.warmNeutral.stone }]}>
                    Master toggle for all cycle reminders
                  </Text>
                </View>
                <Switch
                  value={settings.reminders.enabled}
                  onValueChange={(value) => updateReminder('enabled', value)}
                  trackColor={{ false: colors.warmNeutral.stone, true: colors.accent.terracotta }}
                />
              </View>

              {settings.reminders.enabled && (
                <>
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <Text style={[styles.settingLabel, { color: colors.warmNeutral.charcoal }]}>
                        🔔 Notifications
                      </Text>
                      <Text style={[styles.settingDescription, { color: colors.warmNeutral.stone }]}>
                        On/off for all period notifications
                      </Text>
                    </View>
                    <Switch
                      value={settings.reminders.notificationsEnabled}
                      onValueChange={(value) => updateReminder('notificationsEnabled', value)}
                      trackColor={{ false: colors.warmNeutral.stone, true: colors.accent.terracotta }}
                    />
                  </View>

                  {settings.reminders.notificationsEnabled && (
                    <>
                      <View style={styles.settingRow}>
                        <Text style={[styles.settingLabel, { color: colors.warmNeutral.charcoal }]}>
                          Period Approaching
                        </Text>
                        <Switch
                          value={settings.reminders.periodApproaching}
                          onValueChange={(value) => updateReminder('periodApproaching', value)}
                          trackColor={{
                            false: colors.warmNeutral.stone,
                            true: colors.accent.terracotta,
                          }}
                        />
                      </View>

                      {settings.reminders.periodApproaching && (
                        <View style={styles.daysPickerRow}>
                          <Text style={[styles.settingLabel, { color: colors.warmNeutral.stone }]}>
                            Alert me
                          </Text>
                          <View style={styles.daysPicker}>
                            {[1, 2, 3, 5, 7].map((days) => (
                              <Pressable
                                key={days}
                                style={[
                                  styles.daysButton,
                                  {
                                    backgroundColor:
                                      settings.reminders.daysBeforePeriodAlert === days
                                        ? colors.accent.terracotta
                                        : colors.warmNeutral.cream,
                                  },
                                ]}
                                onPress={() => updateReminder('daysBeforePeriodAlert', days)}
                              >
                                <Text
                                  style={[
                                    styles.daysButtonText,
                                    {
                                      color:
                                        settings.reminders.daysBeforePeriodAlert === days
                                          ? colors.warmNeutral.cream
                                          : colors.warmNeutral.charcoal,
                                    },
                                  ]}
                                >
                                  {days}d
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                          <Text style={[styles.settingLabel, { color: colors.warmNeutral.stone }]}>
                            before
                          </Text>
                        </View>
                      )}

                      <View style={styles.settingRow}>
                        <Text style={[styles.settingLabel, { color: colors.warmNeutral.charcoal }]}>
                          PMS Starting
                        </Text>
                        <Switch
                          value={settings.reminders.pmsStarting}
                          onValueChange={(value) => updateReminder('pmsStarting', value)}
                          trackColor={{
                            false: colors.warmNeutral.stone,
                            true: colors.accent.terracotta,
                          }}
                        />
                      </View>

                      <View style={styles.settingRow}>
                        <Text style={[styles.settingLabel, { color: colors.warmNeutral.charcoal }]}>
                          Log Symptoms Reminder
                        </Text>
                        <Switch
                          value={settings.reminders.logSymptomsReminder}
                          onValueChange={(value) => updateReminder('logSymptomsReminder', value)}
                          trackColor={{
                            false: colors.warmNeutral.stone,
                            true: colors.accent.terracotta,
                          }}
                        />
                      </View>

                      <View style={styles.settingRow}>
                        <Text style={[styles.settingLabel, { color: colors.warmNeutral.charcoal }]}>
                          Ovulation Reminder
                        </Text>
                        <Switch
                          value={settings.reminders.ovulationReminder}
                          onValueChange={(value) => updateReminder('ovulationReminder', value)}
                          trackColor={{
                            false: colors.warmNeutral.stone,
                            true: colors.accent.terracotta,
                          }}
                        />
                      </View>

                      {/* Alert Type */}
                      <Text style={[styles.subsectionTitle, { color: colors.warmNeutral.charcoal }]}>
                        Alert Type
                      </Text>
                      <View style={styles.optionGroup}>
                        {ALERT_OPTIONS.map((option) => (
                          <Pressable
                            key={option.value}
                            style={[
                              styles.optionButton,
                              {
                                backgroundColor:
                                  settings.reminders.alertType === option.value
                                    ? colors.accent.terracotta
                                    : colors.warmNeutral.cream,
                              },
                            ]}
                            onPress={() => updateReminder('alertType', option.value)}
                          >
                            <Text
                              style={[
                                styles.optionLabel,
                                {
                                  color:
                                    settings.reminders.alertType === option.value
                                      ? colors.warmNeutral.cream
                                      : colors.warmNeutral.charcoal,
                                },
                              ]}
                            >
                              {option.label}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  )}
                </>
              )}
            </View>

            {/* Sync Source Section */}
            <View style={[styles.section, { backgroundColor: colors.warmNeutral.sand }]}>
              <Text style={[styles.sectionTitle, { color: colors.warmNeutral.charcoal }]}>
                Data Source
              </Text>

              <View style={styles.optionGroup}>
                {SYNC_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.syncOption,
                      {
                        backgroundColor:
                          settings.syncSource === option.value
                            ? colors.accent.terracotta
                            : colors.warmNeutral.cream,
                        borderColor:
                          settings.syncSource === option.value
                            ? colors.accent.terracotta
                            : colors.warmNeutral.stone,
                      },
                    ]}
                    onPress={() => updateSetting('syncSource', option.value)}
                  >
                    <Text
                      style={[
                        styles.syncOptionLabel,
                        {
                          color:
                            settings.syncSource === option.value
                              ? colors.warmNeutral.cream
                              : colors.warmNeutral.charcoal,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.syncOptionDescription,
                        {
                          color:
                            settings.syncSource === option.value
                              ? colors.warmNeutral.cream + 'CC'
                              : colors.warmNeutral.stone,
                        },
                      ]}
                    >
                      {option.description}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {settings.syncSource === 'healthkit' && isHealthKitAvailable() && (
                <Pressable
                  style={[styles.syncButton, { backgroundColor: colors.accent.sage }]}
                  onPress={handleHealthKitSync}
                >
                  <Text style={[styles.syncButtonText, { color: colors.warmNeutral.cream }]}>
                    Sync Now with Apple Health
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Data Management */}
            <View style={[styles.section, { backgroundColor: colors.warmNeutral.sand }]}>
              <Text style={[styles.sectionTitle, { color: colors.warmNeutral.charcoal }]}>
                Data
              </Text>

              <Text style={[styles.dataInfo, { color: colors.warmNeutral.stone }]}>
                {cycleInfo.totalPeriods} periods logged
              </Text>

              <Pressable
                style={[styles.dangerButton, { borderColor: colors.accent.terracotta }]}
                onPress={handleClearData}
              >
                <Text style={[styles.dangerButtonText, { color: colors.accent.terracotta }]}>
                  Clear All Cycle Data
                </Text>
              </Pressable>
            </View>

            {/* Developer Testing - Only visible in dev mode */}
            {__DEV__ && (
              <View style={[styles.section, { backgroundColor: colors.accent.lavender + '30', borderWidth: 2, borderColor: colors.accent.lavender, borderStyle: 'dashed' }]}>
                <Text style={[styles.sectionTitle, { color: colors.warmNeutral.charcoal }]}>
                  🧪 Developer Testing
                </Text>
                <Text style={[styles.sectionDescription, { color: colors.warmNeutral.stone }]}>
                  Test period functions without waiting for real cycles
                </Text>

                {/* Simulate Cycle Day */}
                <Text style={[styles.subsectionTitle, { color: colors.warmNeutral.charcoal }]}>
                  Set Cycle Day
                </Text>
                <View style={styles.devButtonRow}>
                  {[1, 5, 10, 14, 21, 28].map((day) => (
                    <Pressable
                      key={day}
                      style={[styles.devButton, { backgroundColor: colors.warmNeutral.cream }]}
                      onPress={async () => {
                        // Simulate setting cycle to specific day by creating fake period
                        const fakeStartDate = new Date();
                        fakeStartDate.setDate(fakeStartDate.getDate() - day + 1);
                        Alert.alert('Dev Mode', `Simulating cycle day ${day}\n(Start: ${fakeStartDate.toLocaleDateString()})`);
                        await startPeriod(fakeStartDate);
                        if (day > 5) {
                          // End period after 5 days for non-menstrual phases
                          const endDate = new Date(fakeStartDate);
                          endDate.setDate(endDate.getDate() + 4);
                          await endPeriod(endDate);
                        }
                        loadSettings();
                      }}
                    >
                      <Text style={[styles.devButtonText, { color: colors.warmNeutral.charcoal }]}>
                        Day {day}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {/* Simulate Phase */}
                <Text style={[styles.subsectionTitle, { color: colors.warmNeutral.charcoal }]}>
                  Quick Phase Simulation
                </Text>
                <View style={styles.devButtonRow}>
                  <Pressable
                    style={[styles.devPhaseButton, { backgroundColor: colors.accent.terracotta + '60' }]}
                    onPress={async () => {
                      await startPeriod();
                      loadSettings();
                      Alert.alert('Dev Mode', 'Menstrual phase started (Day 1)');
                    }}
                  >
                    <Text style={styles.devPhaseEmoji}>🩸</Text>
                    <Text style={[styles.devPhaseText, { color: colors.warmNeutral.charcoal }]}>Menstrual</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.devPhaseButton, { backgroundColor: colors.accent.sage + '60' }]}
                    onPress={async () => {
                      const start = new Date();
                      start.setDate(start.getDate() - 7);
                      await startPeriod(start);
                      const end = new Date(start);
                      end.setDate(end.getDate() + 4);
                      await endPeriod(end);
                      loadSettings();
                      Alert.alert('Dev Mode', 'Follicular phase (Day 8)');
                    }}
                  >
                    <Text style={styles.devPhaseEmoji}>🌱</Text>
                    <Text style={[styles.devPhaseText, { color: colors.warmNeutral.charcoal }]}>Follicular</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.devPhaseButton, { backgroundColor: colors.accent.lavender + '60' }]}
                    onPress={async () => {
                      const start = new Date();
                      start.setDate(start.getDate() - 13);
                      await startPeriod(start);
                      const end = new Date(start);
                      end.setDate(end.getDate() + 4);
                      await endPeriod(end);
                      loadSettings();
                      Alert.alert('Dev Mode', 'Ovulation phase (Day 14)');
                    }}
                  >
                    <Text style={styles.devPhaseEmoji}>✨</Text>
                    <Text style={[styles.devPhaseText, { color: colors.warmNeutral.charcoal }]}>Ovulation</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.devPhaseButton, { backgroundColor: colors.accent.terracotta + '40' }]}
                    onPress={async () => {
                      const start = new Date();
                      start.setDate(start.getDate() - 20);
                      await startPeriod(start);
                      const end = new Date(start);
                      end.setDate(end.getDate() + 4);
                      await endPeriod(end);
                      loadSettings();
                      Alert.alert('Dev Mode', 'Luteal phase (Day 21)');
                    }}
                  >
                    <Text style={styles.devPhaseEmoji}>🌙</Text>
                    <Text style={[styles.devPhaseText, { color: colors.warmNeutral.charcoal }]}>Luteal</Text>
                  </Pressable>
                </View>

                {/* Simulate PMS */}
                <Text style={[styles.subsectionTitle, { color: colors.warmNeutral.charcoal }]}>
                  Test PMS Mode
                </Text>
                <Pressable
                  style={[styles.devActionButton, { backgroundColor: colors.accent.terracotta + '50' }]}
                  onPress={async () => {
                    const start = new Date();
                    start.setDate(start.getDate() - 24); // Day 25 = PMS window
                    await startPeriod(start);
                    const end = new Date(start);
                    end.setDate(end.getDate() + 4);
                    await endPeriod(end);
                    loadSettings();
                    Alert.alert('Dev Mode', 'PMS mode activated (Day 25 of 28-day cycle)\nSoothing Sparks should now be active.');
                  }}
                >
                  <Text style={[styles.devActionText, { color: colors.warmNeutral.charcoal }]}>
                    🌸 Trigger PMS Window (Day 25)
                  </Text>
                </Pressable>

                {/* Test Reminders */}
                <Text style={[styles.subsectionTitle, { color: colors.warmNeutral.charcoal }]}>
                  Test Reminder Alerts
                </Text>
                <View style={styles.devButtonRow}>
                  <Pressable
                    style={[styles.devActionButton, { backgroundColor: colors.warmNeutral.cream, flex: 1 }]}
                    onPress={() => {
                      Alert.alert(
                        'Period Approaching',
                        `Your period is expected in ${settings.reminders.daysBeforePeriodAlert} day(s).`,
                        [{ text: 'OK' }]
                      );
                    }}
                  >
                    <Text style={[styles.devActionText, { color: colors.warmNeutral.charcoal }]}>
                      📅 Period Alert
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.devActionButton, { backgroundColor: colors.warmNeutral.cream, flex: 1 }]}
                    onPress={() => {
                      Alert.alert(
                        'PMS Starting',
                        'Based on your patterns, PMS may be starting. Extra gentleness helps.',
                        [{ text: 'Got it' }]
                      );
                    }}
                  >
                    <Text style={[styles.devActionText, { color: colors.warmNeutral.charcoal }]}>
                      🌙 PMS Alert
                    </Text>
                  </Pressable>
                </View>
                <Pressable
                  style={[styles.devActionButton, { backgroundColor: colors.warmNeutral.cream }]}
                  onPress={() => {
                    Alert.alert(
                      'Ovulation Window',
                      'You may be in your fertile window (days 12-16 of cycle).',
                      [{ text: 'Thanks' }]
                    );
                  }}
                >
                  <Text style={[styles.devActionText, { color: colors.warmNeutral.charcoal }]}>
                    🌸 Ovulation Alert
                  </Text>
                </Pressable>

                {/* Reset to Current Date */}
                <Pressable
                  style={[styles.devResetButton, { borderColor: colors.warmNeutral.stone }]}
                  onPress={async () => {
                    await clearAllCycleData();
                    loadSettings();
                    Alert.alert('Dev Mode', 'All cycle data cleared. Ready for fresh testing.');
                  }}
                >
                  <Text style={[styles.devResetText, { color: colors.warmNeutral.stone }]}>
                    🔄 Reset All Test Data
                  </Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color={colors.accent.terracotta} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  periodButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addAllText: {
    fontSize: 13,
    fontWeight: '500',
  },
  syncOption: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: '48%',
  },
  syncOptionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  syncOptionDescription: {
    fontSize: 11,
    marginTop: 4,
  },
  syncButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dataInfo: {
    fontSize: 14,
  },
  dangerButton: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  savingOverlay: {
    position: 'absolute',
    top: 60,
    right: 16,
  },
  daysPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 16,
  },
  daysPicker: {
    flexDirection: 'row',
    gap: 6,
  },
  daysButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  lifeStageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  lifeStageOption: {
    width: '31%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  lifeStageEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  lifeStageLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
    gap: 4,
  },
  symptomEmoji: {
    fontSize: 14,
  },
  symptomLabel: {
    fontSize: 12,
  },
  pregnancyInfo: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginTop: 8,
  },
  pregnancyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Developer Testing styles
  devButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  devButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  devButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  devPhaseButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  devPhaseEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  devPhaseText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  devActionButton: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  devActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  devResetButton: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 16,
  },
  devResetText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
