/**
 * Food Tracking Settings Screen
 *
 * Configure food tracking preferences:
 * - Enable/disable food tracking
 * - AI auto-detection toggle
 * - Calorie goal customization
 * - Clear food data
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  SafeAreaView,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  getFoodSettings,
  updateFoodSettings,
  getFoodStats,
  clearFoodTrackingData,
} from '@/services/foodTrackingService';
import { FoodTrackingSettings } from '@/types/FoodTracking';

export default function FoodSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [settings, setSettings] = useState<FoodTrackingSettings | null>(null);
  const [stats, setStats] = useState<{
    totalEntries: number;
    daysTracked: number;
    avgDailyCalories: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [calorieGoalInput, setCalorieGoalInput] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [foodSettings, foodStats] = await Promise.all([
        getFoodSettings(),
        getFoodStats(),
      ]);
      setSettings(foodSettings);
      setStats(foodStats);
      setCalorieGoalInput(String(foodSettings.calorieGoal || 2000));
    } catch (error) {
      console.error('Failed to load food settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async () => {
    if (!settings) return;
    const updated = await updateFoodSettings({ enabled: !settings.enabled });
    setSettings(updated);
  };

  const handleToggleAIDetection = async () => {
    if (!settings) return;
    const updated = await updateFoodSettings({
      aiDetectionEnabled: !settings.aiDetectionEnabled,
    });
    setSettings(updated);
  };

  const handleToggleShowCalories = async () => {
    if (!settings) return;
    const updated = await updateFoodSettings({
      showCalories: !settings.showCalories,
    });
    setSettings(updated);
  };

  const handleSaveCalorieGoal = async () => {
    const goal = parseInt(calorieGoalInput, 10);
    if (isNaN(goal) || goal < 500 || goal > 10000) {
      Alert.alert('Invalid Goal', 'Please enter a calorie goal between 500 and 10,000');
      return;
    }

    const updated = await updateFoodSettings({ calorieGoal: goal });
    setSettings(updated);
    setEditingGoal(false);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Food Data',
      'This will permanently delete all your food tracking data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await clearFoodTrackingData();
            await loadData();
            Alert.alert('Done', 'All food tracking data has been cleared');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Food Tracking
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Enable Food Tracking */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Enable Food Tracking
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Log meals and track nutrition
              </Text>
            </View>
            <Switch
              value={settings?.enabled ?? false}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: colors.border, true: colors.tint }}
            />
          </View>
        </View>

        {settings?.enabled && (
          <>
            {/* AI Detection */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    AI Food Detection
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Auto-detect food mentions in your journal entries
                  </Text>
                </View>
                <Switch
                  value={settings?.aiDetectionEnabled ?? true}
                  onValueChange={handleToggleAIDetection}
                  trackColor={{ false: colors.border, true: colors.tint }}
                />
              </View>

              <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Show Calories
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Display calorie counts in the tracker
                  </Text>
                </View>
                <Switch
                  value={settings?.showCalories ?? true}
                  onValueChange={handleToggleShowCalories}
                  trackColor={{ false: colors.border, true: colors.tint }}
                />
              </View>
            </View>

            {/* Calorie Goal */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Daily Calorie Goal
              </Text>

              {editingGoal ? (
                <View style={styles.goalInput}>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                    value={calorieGoalInput}
                    onChangeText={setCalorieGoalInput}
                    keyboardType="number-pad"
                    placeholder="2000"
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.tint }]}
                    onPress={handleSaveCalorieGoal}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setEditingGoal(false);
                      setCalorieGoalInput(String(settings?.calorieGoal || 2000));
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.goalDisplay}
                  onPress={() => setEditingGoal(true)}
                >
                  <Text style={[styles.goalValue, { color: colors.text }]}>
                    {settings?.calorieGoal || 2000} calories/day
                  </Text>
                  <Ionicons name="pencil" size={18} color={colors.tint} />
                </TouchableOpacity>
              )}

              <Text style={[styles.helpText, { color: colors.textMuted }]}>
                Common goals: 1500 (weight loss), 2000 (maintenance), 2500+ (active/building)
              </Text>
            </View>

            {/* Stats */}
            {stats && stats.totalEntries > 0 && (
              <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Your Stats
                </Text>

                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.tint }]}>
                      {stats.totalEntries}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                      Foods Logged
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.tint }]}>
                      {stats.daysTracked}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                      Days Tracked
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.tint }]}>
                      {stats.avgDailyCalories}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                      Avg Calories
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Clear Data */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleClearData}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text style={styles.dangerButtonText}>Clear All Food Data</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Food tracking helps you understand how nutrition affects your mood and energy.
            {settings?.enabled && settings?.aiDetectionEnabled
              ? ' When you journal about food, it will be automatically detected and logged.'
              : ''}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  goalInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cancelButtonText: {
    fontSize: 15,
  },
  goalDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  goalValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  dangerButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '500',
  },
  infoSection: {
    paddingHorizontal: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
