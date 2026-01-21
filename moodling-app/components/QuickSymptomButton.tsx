/**
 * Quick Symptom Button
 *
 * Floating action button that appears on the home screen during period.
 * Provides quick access to symptom logging without navigating through menus.
 *
 * Shows only when:
 * - Cycle tracking is enabled
 * - User is in menstrual phase
 * - Quick Symptom Button is enabled in settings
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  useColorScheme,
  Animated,
  ScrollView,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import {
  getCycleSettings,
  getCurrentPhase,
  logSymptom,
  logFlowLevel,
  isOnPeriod,
} from '@/services/cycleTrackingService';
import { CycleSymptomType } from '@/types/CycleTracking';

interface QuickSymptomButtonProps {
  onSymptomLogged?: () => void;
}

interface SymptomOption {
  type: CycleSymptomType;
  label: string;
  emoji: string;
}

const SYMPTOM_OPTIONS: SymptomOption[] = [
  { type: 'cramps', label: 'Cramps', emoji: '😣' },
  { type: 'bloating', label: 'Bloating', emoji: '🫃' },
  { type: 'headache', label: 'Headache', emoji: '🤕' },
  { type: 'fatigue', label: 'Fatigue', emoji: '😴' },
  { type: 'moodShift', label: 'Mood', emoji: '😢' },
  { type: 'backPain', label: 'Back Pain', emoji: '🔙' },
  { type: 'cravings', label: 'Cravings', emoji: '🍫' },
  { type: 'breastTenderness', label: 'Tenderness', emoji: '💔' },
];

const FLOW_OPTIONS = [
  { level: 'spotting' as const, label: 'Spotting', emoji: '💧' },
  { level: 'light' as const, label: 'Light', emoji: '🩸' },
  { level: 'medium' as const, label: 'Medium', emoji: '🩸🩸' },
  { level: 'heavy' as const, label: 'Heavy', emoji: '🩸🩸🩸' },
];

const SEVERITY_OPTIONS = [
  { value: 1 as const, label: 'Mild' },
  { value: 2 as const, label: 'Moderate' },
  { value: 3 as const, label: 'Severe' },
];

export function QuickSymptomButton({ onSymptomLogged }: QuickSymptomButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomOption | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [loggedToday, setLoggedToday] = useState<Set<string>>(new Set());

  // Check if button should be visible
  const checkVisibility = useCallback(async () => {
    try {
      const settings = await getCycleSettings();
      if (!settings.enabled || !settings.showQuickSymptomButton) {
        setVisible(false);
        return;
      }

      const onPeriodNow = await isOnPeriod();
      const phaseInfo = await getCurrentPhase();

      // Show during menstrual phase or if period is marked as ongoing
      const shouldShow = onPeriodNow || phaseInfo?.phase === 'menstrual';
      setVisible(shouldShow);
    } catch (error) {
      console.error('Error checking symptom button visibility:', error);
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    checkVisibility();
  }, [checkVisibility]);

  // Gentle pulse animation
  useEffect(() => {
    if (visible) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [visible, pulseAnim]);

  const handleSymptomSelect = (symptom: SymptomOption) => {
    setSelectedSymptom(symptom);
  };

  const handleSeveritySelect = async (severity: 1 | 2 | 3) => {
    if (!selectedSymptom) return;

    try {
      await logSymptom(selectedSymptom.type, severity);
      setLoggedToday((prev) => new Set([...prev, selectedSymptom.type]));
      setSelectedSymptom(null);
      onSymptomLogged?.();
    } catch (error) {
      console.error('Error logging symptom:', error);
    }
  };

  const handleFlowSelect = async (level: 'spotting' | 'light' | 'medium' | 'heavy') => {
    try {
      await logFlowLevel(level);
      setLoggedToday((prev) => new Set([...prev, 'flow']));
      onSymptomLogged?.();
    } catch (error) {
      console.error('Error logging flow:', error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSymptom(null);
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fabContainer,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.accent.terracotta }]}
          onPress={() => setShowModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabEmoji}>🌙</Text>
          <Text style={[styles.fabLabel, { color: colors.warmNeutral.cream }]}>
            Log
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Symptom Logging Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.warmNeutral.cream },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.warmNeutral.charcoal }]}>
                {selectedSymptom ? `How severe? ${selectedSymptom.emoji}` : 'Quick Symptom Log'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Text style={[styles.closeButton, { color: colors.warmNeutral.stone }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {selectedSymptom ? (
              // Severity selection
              <View style={styles.severityContainer}>
                {SEVERITY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.severityButton,
                      {
                        backgroundColor:
                          option.value === 1
                            ? colors.accent.sage + '40'
                            : option.value === 2
                            ? colors.accent.lavender + '60'
                            : colors.accent.terracotta + '60',
                      },
                    ]}
                    onPress={() => handleSeveritySelect(option.value)}
                  >
                    <Text
                      style={[
                        styles.severityLabel,
                        { color: colors.warmNeutral.charcoal },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setSelectedSymptom(null)}
                >
                  <Text style={{ color: colors.warmNeutral.stone }}>← Back</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Symptom and flow grid
              <ScrollView style={styles.scrollContent}>
                {/* Flow Level */}
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.warmNeutral.stone },
                  ]}
                >
                  Flow Level
                </Text>
                <View style={styles.optionsGrid}>
                  {FLOW_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.level}
                      style={[
                        styles.optionButton,
                        {
                          backgroundColor: loggedToday.has('flow')
                            ? colors.accent.sage + '40'
                            : colors.warmNeutral.sand,
                        },
                      ]}
                      onPress={() => handleFlowSelect(option.level)}
                    >
                      <Text style={styles.optionEmoji}>{option.emoji}</Text>
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: colors.warmNeutral.charcoal },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Symptoms */}
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.warmNeutral.stone },
                  ]}
                >
                  Symptoms
                </Text>
                <View style={styles.optionsGrid}>
                  {SYMPTOM_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.type}
                      style={[
                        styles.optionButton,
                        {
                          backgroundColor: loggedToday.has(option.type)
                            ? colors.accent.sage + '40'
                            : colors.warmNeutral.sand,
                        },
                      ]}
                      onPress={() => handleSymptomSelect(option)}
                    >
                      <Text style={styles.optionEmoji}>{option.emoji}</Text>
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: colors.warmNeutral.charcoal },
                        ]}
                      >
                        {option.label}
                      </Text>
                      {loggedToday.has(option.type) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 100,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabEmoji: {
    fontSize: 20,
  },
  fabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 24,
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    marginTop: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  optionButton: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  optionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 12,
    color: '#4CAF50',
  },
  severityContainer: {
    padding: 20,
    gap: 12,
  },
  severityButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  severityLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    alignItems: 'center',
    padding: 12,
    marginTop: 8,
  },
});
