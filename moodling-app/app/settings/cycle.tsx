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
  createDefaultCycleSettings,
} from '@/types/CycleTracking';
import { syncCycleWithHealthKit, isHealthKitAvailable } from '@/services/healthKitService';

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
            {/* Current Status */}
            {cycleInfo.currentPhase && (
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
});
