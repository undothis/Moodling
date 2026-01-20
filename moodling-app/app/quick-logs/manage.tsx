/**
 * Quick Logs Manager
 *
 * Screen for creating, editing, and deleting quick log buttons.
 * Users can:
 * - Create custom buttons with emoji + name
 * - Choose type (habit build, habit break, medication, etc.)
 * - Set frequency (daily, multiple daily, weekly, as needed)
 * - Reorder buttons
 * - Delete buttons
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  useColorScheme,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  QuickLog,
  QuickLogType,
  LogFrequency,
  getQuickLogs,
  getAllQuickLogs,
  createQuickLog,
  updateQuickLog,
  deleteQuickLog,
  permanentlyDeleteQuickLog,
  LOG_PRESETS,
  getPresetsByCategory,
} from '@/services/quickLogsService';

// Common emojis for quick selection
const COMMON_EMOJIS = [
  '💊', '🧘', '🏃', '💧', '📚', '📝', '🚶', '😴',
  '🥗', '🚭', '📵', '☕', '🎯', '💼', '📞', '🌳',
  '🚿', '🪥', '🛏️', '🐕', '⚡', '😰', '🤕', '💔',
  '✅', '⭐', '🎉', '💪', '🧠', '❤️', '🌟', '🔥',
];

// Type options with descriptions
const TYPE_OPTIONS: { value: QuickLogType; label: string; description: string }[] = [
  { value: 'habit_build', label: 'Build a habit', description: 'Something you want to do MORE of' },
  { value: 'habit_break', label: 'Break a habit', description: 'Something you want to do LESS of' },
  { value: 'medication', label: 'Medication', description: 'Track when you take meds' },
  { value: 'symptom', label: 'Symptom/Feeling', description: 'Track how you feel' },
  { value: 'goal', label: 'Goal', description: 'One-time or milestone goals' },
  { value: 'custom', label: 'Custom', description: 'Anything else you want to track' },
];

// Frequency options
const FREQUENCY_OPTIONS: { value: LogFrequency; label: string; description: string }[] = [
  { value: 'daily', label: 'Once daily', description: 'Complete once per day' },
  { value: 'multiple_daily', label: 'Multiple daily', description: 'Do multiple times per day' },
  { value: 'weekly', label: 'Weekly', description: 'X times per week' },
  { value: 'as_needed', label: 'As needed', description: 'No schedule, just track when it happens' },
];

export default function QuickLogsManagerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [logs, setLogs] = useState<QuickLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingLog, setEditingLog] = useState<QuickLog | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✅');
  const [type, setType] = useState<QuickLogType>('habit_build');
  const [frequency, setFrequency] = useState<LogFrequency>('daily');

  // Preset picker state
  const [showPresets, setShowPresets] = useState(false);

  // Load logs
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const quickLogs = await getQuickLogs();
      setLogs(quickLogs);
    } catch (error) {
      console.error('Failed to load quick logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Open create modal
  const handleCreate = () => {
    setEditingLog(null);
    setName('');
    setEmoji('✅');
    setType('habit_build');
    setFrequency('daily');
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (log: QuickLog) => {
    setEditingLog(log);
    setName(log.name);
    setEmoji(log.emoji);
    setType(log.type);
    setFrequency(log.frequency);
    setShowModal(true);
  };

  // Save log (create or update)
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name for your quick log');
      return;
    }

    try {
      if (editingLog) {
        // Update existing
        await updateQuickLog(editingLog.id, {
          name: name.trim(),
          emoji,
          type,
          frequency,
        });
      } else {
        // Create new
        await createQuickLog(name.trim(), emoji, type, { frequency });
      }

      setShowModal(false);
      loadLogs();
    } catch (error) {
      console.error('Failed to save quick log:', error);
      Alert.alert('Error', 'Failed to save quick log');
    }
  };

  // Delete log
  const handleDelete = (log: QuickLog) => {
    Alert.alert(
      'Delete Quick Log',
      `Are you sure you want to delete "${log.name}"? This will also delete all logged entries.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await permanentlyDeleteQuickLog(log.id);
              loadLogs();
            } catch (error) {
              console.error('Failed to delete quick log:', error);
            }
          },
        },
      ]
    );
  };

  // Add from preset
  const handlePresetSelect = async (preset: typeof LOG_PRESETS[0]) => {
    try {
      await createQuickLog(preset.name, preset.emoji, preset.type, {
        frequency: preset.frequency,
      });
      setShowPresets(false);
      loadLogs();
    } catch (error) {
      console.error('Failed to create from preset:', error);
    }
  };

  const presetsByCategory = getPresetsByCategory();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Customize Quick Logs
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Existing logs */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Quick Logs
          </Text>

          {logs.length === 0 && !loading ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No quick logs yet. Add your first one below!
              </Text>
            </View>
          ) : (
            logs.map((log) => (
              <View
                key={log.id}
                style={[styles.logCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.logInfo}>
                  <Text style={styles.logEmoji}>{log.emoji}</Text>
                  <View style={styles.logDetails}>
                    <Text style={[styles.logName, { color: colors.text }]}>
                      {log.name}
                    </Text>
                    <Text style={[styles.logMeta, { color: colors.textMuted }]}>
                      {TYPE_OPTIONS.find((t) => t.value === log.type)?.label} •{' '}
                      {FREQUENCY_OPTIONS.find((f) => f.value === log.frequency)?.label}
                    </Text>
                  </View>
                </View>
                <View style={styles.logActions}>
                  <TouchableOpacity
                    onPress={() => handleEdit(log)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="pencil" size={18} color={colors.tint} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(log)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Add buttons */}
        <View style={styles.addButtons}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.tint }]}
            onPress={handleCreate}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Create Custom</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => setShowPresets(true)}
          >
            <Ionicons name="list" size={20} color={colors.text} />
            <Text style={[styles.addButtonText, { color: colors.text }]}>
              Choose from Presets
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.tint }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingLog ? 'Edit Quick Log' : 'New Quick Log'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.modalSave, { color: colors.tint }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Name input */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Name</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Took meds, Walked, Meditated..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Emoji picker */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Emoji</Text>
              <View style={styles.emojiGrid}>
                {COMMON_EMOJIS.map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[
                      styles.emojiButton,
                      {
                        backgroundColor: emoji === e ? colors.tint + '30' : colors.card,
                        borderColor: emoji === e ? colors.tint : colors.border,
                      },
                    ]}
                    onPress={() => setEmoji(e)}
                  >
                    <Text style={styles.emojiText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Type selector */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Type</Text>
              {TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: type === option.value ? colors.tint + '20' : colors.card,
                      borderColor: type === option.value ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => setType(option.value)}
                >
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                      {option.description}
                    </Text>
                  </View>
                  {type === option.value && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.tint} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Frequency selector */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Frequency</Text>
              {FREQUENCY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: frequency === option.value ? colors.tint + '20' : colors.card,
                      borderColor: frequency === option.value ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => setFrequency(option.value)}
                >
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.optionDescription, { color: colors.textMuted }]}>
                      {option.description}
                    </Text>
                  </View>
                  {frequency === option.value && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.tint} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Presets Modal */}
      <Modal visible={showPresets} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowPresets(false)}>
              <Text style={[styles.modalCancel, { color: colors.tint }]}>Close</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Presets</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {Object.entries(presetsByCategory).map(([category, presets]) => (
              <View key={category} style={styles.presetCategory}>
                <Text style={[styles.presetCategoryTitle, { color: colors.text }]}>
                  {category}
                </Text>
                <View style={styles.presetGrid}>
                  {presets.map((preset) => (
                    <TouchableOpacity
                      key={preset.name}
                      style={[styles.presetButton, { backgroundColor: colors.card }]}
                      onPress={() => handlePresetSelect(preset)}
                    >
                      <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                      <Text
                        style={[styles.presetName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {preset.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
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
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  logInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  logDetails: {
    flex: 1,
  },
  logName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  logMeta: {
    fontSize: 13,
  },
  logActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  addButtons: {
    gap: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 22,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
  },
  // Preset styles
  presetCategory: {
    marginBottom: 24,
  },
  presetCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetButton: {
    width: '30%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  presetEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  presetName: {
    fontSize: 12,
    textAlign: 'center',
  },
});
