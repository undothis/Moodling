/**
 * Habit Timer Screen
 *
 * Customizable pacing/accountability timer for any habit.
 * - Create custom habits with intervals and limits
 * - Log occurrences and get reminders
 * - Track progress throughout the day
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CustomHabit,
  getCustomHabits,
  createHabitFromTemplate,
  createCustomHabit,
  deleteCustomHabit,
  toggleHabitActive,
  getHabitStatus,
  logHabitOccurrence,
  getAllHabitStatuses,
  HABIT_TEMPLATES,
} from '@/services/habitTimerService';

export default function HabitTimerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [habits, setHabits] = useState<CustomHabit[]>([]);
  const [statuses, setStatuses] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitEmoji, setNewHabitEmoji] = useState('📊');
  const [newHabitInterval, setNewHabitInterval] = useState('60');
  const [newHabitLimit, setNewHabitLimit] = useState('');

  // Template modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    const habitsList = await getCustomHabits();
    setHabits(habitsList);

    // Load statuses for active habits
    const statusMap = new Map();
    for (const habit of habitsList.filter(h => h.isActive)) {
      const status = await getHabitStatus(habit.id);
      if (status) {
        statusMap.set(habit.id, status);
      }
    }
    setStatuses(statusMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    // Refresh every minute
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Create from template
  const handleCreateFromTemplate = async (template: typeof HABIT_TEMPLATES[0]) => {
    await createHabitFromTemplate(template);
    setShowTemplateModal(false);
    loadData();
  };

  // Create custom habit
  const handleCreateCustom = async () => {
    if (!newHabitName.trim()) {
      Alert.alert('Name required', 'Please enter a name for your habit');
      return;
    }

    await createCustomHabit({
      name: newHabitName.trim(),
      emoji: newHabitEmoji || '📊',
      intervalMinutes: parseInt(newHabitInterval) || 60,
      dailyLimit: newHabitLimit ? parseInt(newHabitLimit) : undefined,
    });

    setShowCreateModal(false);
    setNewHabitName('');
    setNewHabitEmoji('📊');
    setNewHabitInterval('60');
    setNewHabitLimit('');
    loadData();
  };

  // Log occurrence
  const handleLogOccurrence = async (habitId: string) => {
    try {
      const result = await logHabitOccurrence(habitId);

      if (result.atLimit) {
        Alert.alert(
          `${result.habit.emoji} Limit Reached`,
          `You've reached your daily limit of ${result.habit.dailyLimit} for ${result.habit.name}.`
        );
      } else if (result.tooSoon) {
        Alert.alert(
          `${result.habit.emoji} Pacing`,
          `Logged! Note: Only ${result.minutesUntilAllowed} more minutes until your next ${result.habit.name} is on-pace.`,
          [{ text: 'Got it', style: 'default' }]
        );
      }

      loadData();
    } catch (error) {
      console.error('Failed to log occurrence:', error);
    }
  };

  // Delete habit
  const handleDeleteHabit = (habit: CustomHabit) => {
    Alert.alert(
      'Delete Habit?',
      `Remove "${habit.name}" from your habit list? History will be preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCustomHabit(habit.id);
            loadData();
          },
        },
      ]
    );
  };

  // Toggle active
  const handleToggleActive = async (habitId: string) => {
    await toggleHabitActive(habitId);
    loadData();
  };

  // Format time
  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Render habit card
  const renderHabitCard = (habit: CustomHabit) => {
    const status = statuses.get(habit.id);
    const isActive = habit.isActive;

    return (
      <View
        key={habit.id}
        style={[
          styles.habitCard,
          { backgroundColor: colors.card, opacity: isActive ? 1 : 0.6 },
        ]}
      >
        <View style={styles.habitHeader}>
          <Text style={styles.habitEmoji}>{habit.emoji}</Text>
          <View style={styles.habitInfo}>
            <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
            <Text style={[styles.habitMeta, { color: colors.textSecondary }]}>
              Every {formatMinutes(habit.intervalMinutes)}
              {habit.dailyLimit ? ` • Max ${habit.dailyLimit}/day` : ''}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => handleToggleActive(habit.id)}
            style={styles.toggleButton}
          >
            <Ionicons
              name={isActive ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={isActive ? colors.tint : colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {isActive && status && (
          <>
            {/* Progress bar */}
            <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: status.atLimit ? colors.error : colors.tint,
                    width: `${Math.min(100, (status.todayCount / (status.dailyLimit || 10)) * 100)}%`,
                  },
                ]}
              />
            </View>

            {/* Status row */}
            <View style={styles.statusRow}>
              <Text style={[styles.statusText, { color: colors.text }]}>
                {status.todayCount}{status.dailyLimit ? `/${status.dailyLimit}` : ''} today
              </Text>

              {status.atLimit ? (
                <Text style={[styles.statusText, { color: colors.error }]}>
                  At limit
                </Text>
              ) : status.canLogNow ? (
                <Text style={[styles.statusText, { color: colors.success || colors.tint }]}>
                  Ready to log
                </Text>
              ) : (
                <Text style={[styles.statusText, { color: colors.warning || '#FFA500' }]}>
                  Wait {formatMinutes(status.minutesUntilAllowed)}
                </Text>
              )}
            </View>

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.logButton,
                  {
                    backgroundColor: status.atLimit
                      ? colors.border
                      : status.canLogNow
                      ? colors.tint
                      : colors.card,
                    borderColor: colors.tint,
                    borderWidth: status.canLogNow ? 0 : 1,
                  },
                ]}
                onPress={() => handleLogOccurrence(habit.id)}
                disabled={status.atLimit}
              >
                <Text
                  style={[
                    styles.logButtonText,
                    {
                      color: status.canLogNow ? '#fff' : colors.tint,
                    },
                  ]}
                >
                  {status.atLimit ? 'Limit Reached' : `Log ${habit.emoji}`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.card }]}
                onPress={() => handleDeleteHabit(habit)}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Habit Timer</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Track and pace any habit with custom intervals and limits.
          Get reminders when it's time for your next occurrence.
        </Text>

        {/* Add buttons */}
        <View style={styles.addButtonsRow}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.tint }]}
            onPress={() => setShowTemplateModal(true)}
          >
            <Ionicons name="apps" size={20} color="#fff" />
            <Text style={styles.addButtonText}>From Template</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.card, borderColor: colors.tint, borderWidth: 1 }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color={colors.tint} />
            <Text style={[styles.addButtonText, { color: colors.tint }]}>Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Habits list */}
        {habits.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyEmoji]}>⏱️</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No habits yet</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Add a habit from templates or create your own custom timer.
            </Text>
          </View>
        ) : (
          <View style={styles.habitsList}>
            {habits.map(renderHabitCard)}
          </View>
        )}

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.tipsTitle, { color: colors.text }]}>Tips</Text>
          <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
            • Tap "Log" to record each occurrence{'\n'}
            • You can log even during pacing - it's tracking, not blocking{'\n'}
            • The timer helps you be mindful, not restrict{'\n'}
            • Toggle habits off when not needed
          </Text>
        </View>
      </ScrollView>

      {/* Template Modal */}
      <Modal
        visible={showTemplateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Template</Text>
              <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={HABIT_TEMPLATES}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.templateItem, { backgroundColor: colors.card }]}
                  onPress={() => handleCreateFromTemplate(item)}
                >
                  <Text style={styles.templateEmoji}>{item.emoji}</Text>
                  <View style={styles.templateInfo}>
                    <Text style={[styles.templateName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.templateDesc, { color: colors.textSecondary }]}>
                      {item.description}
                    </Text>
                    <Text style={[styles.templateMeta, { color: colors.textMuted }]}>
                      Every {formatMinutes(item.intervalMinutes)}
                      {item.dailyLimit ? ` • Max ${item.dailyLimit}/day` : ''}
                    </Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={colors.tint} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Create Custom Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create Custom Habit</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.formRow}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Name</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, color: colors.text }]}
                  value={newHabitName}
                  onChangeText={setNewHabitName}
                  placeholder="e.g., Coffee, Snacks"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formRow}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Emoji</Text>
                <TextInput
                  style={[styles.formInput, styles.emojiInput, { backgroundColor: colors.card, color: colors.text }]}
                  value={newHabitEmoji}
                  onChangeText={setNewHabitEmoji}
                  placeholder="📊"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formRow}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Minimum interval (minutes)</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, color: colors.text }]}
                  value={newHabitInterval}
                  onChangeText={setNewHabitInterval}
                  placeholder="60"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.formRow}>
                <Text style={[styles.formLabel, { color: colors.text }]}>Daily limit (optional)</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: colors.card, color: colors.text }]}
                  value={newHabitLimit}
                  onChangeText={setNewHabitLimit}
                  placeholder="Leave empty for no limit"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>

              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.tint }]}
                onPress={handleCreateCustom}
              >
                <Text style={styles.createButtonText}>Create Habit</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  addButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  habitsList: {
    gap: 12,
  },
  habitCard: {
    borderRadius: 16,
    padding: 16,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
  },
  habitMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  toggleButton: {
    padding: 4,
  },
  progressContainer: {
    height: 6,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statusText: {
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  logButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  logButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    marginBottom: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  tipsCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  templateEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 15,
    fontWeight: '600',
  },
  templateDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  templateMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  formContainer: {
    padding: 16,
  },
  formRow: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  emojiInput: {
    width: 80,
    textAlign: 'center',
    fontSize: 24,
  },
  createButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
