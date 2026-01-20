/**
 * Coach Personality Settings
 *
 * Extensive customization options for the AI coach experience.
 * Following Moodling Ethics:
 * - User has full control
 * - Can go deep or keep it simple
 * - Respects privacy and boundaries
 *
 * Unit 17: AI Coach Personality System
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import {
  CoachSettings,
  CoachPersona,
  PERSONAS,
  PersonaDefinition,
  getCoachSettings,
  saveCoachSettings,
  getSettingsForPersona,
  DetailedSettings,
  EnergyLevel,
  ResponseLength,
  QuestionFrequency,
  EmojiUsage,
  Formality,
  Directness,
  ValidationStyle,
  ActionOrientation,
  AdaptiveTrigger,
  resetOnboarding,
} from '@/services/coachPersonalityService';

// Selector options
const ENERGY_OPTIONS: { value: EnergyLevel; label: string; emoji: string }[] = [
  { value: 'calm', label: 'Calm', emoji: '🌊' },
  { value: 'balanced', label: 'Balanced', emoji: '⚖️' },
  { value: 'energetic', label: 'Energetic', emoji: '⚡' },
];

const LENGTH_OPTIONS: { value: ResponseLength; label: string }[] = [
  { value: 'brief', label: 'Brief' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'detailed', label: 'Detailed' },
];

const QUESTION_OPTIONS: { value: QuestionFrequency; label: string }[] = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'some', label: 'Some' },
  { value: 'lots', label: 'Lots' },
];

const EMOJI_OPTIONS: { value: EmojiUsage; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'occasional', label: 'Some' },
  { value: 'frequent', label: 'Lots' },
];

const FORMALITY_OPTIONS: { value: Formality; label: string }[] = [
  { value: 'casual', label: 'Casual' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'formal', label: 'Formal' },
];

const DIRECTNESS_OPTIONS: { value: Directness; label: string }[] = [
  { value: 'gentle', label: 'Gentle' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'direct', label: 'Direct' },
];

const VALIDATION_OPTIONS: { value: ValidationStyle; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'heavy', label: 'Heavy' },
];

const ACTION_OPTIONS: { value: ActionOrientation; label: string }[] = [
  { value: 'reflective', label: 'Reflective' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'action-focused', label: 'Action' },
];

const TRIGGER_OPTIONS: { value: AdaptiveTrigger; label: string; description: string }[] = [
  { value: 'time_of_day', label: 'Time of Day', description: 'Energetic mornings, calm nights' },
  { value: 'mood_detected', label: 'Detected Mood', description: 'Match support to how you feel' },
  { value: 'content_type', label: 'What You Share', description: 'Goals → Ridge, Anxiety → Luna' },
];

export default function CoachSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState<CoachSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    persona: true,
    communication: false,
    approaches: false,
    adaptive: false,
    context: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loaded = await getCoachSettings();
      setSettings(loaded);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<CoachSettings>) => {
    if (!settings) return;

    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    setSaving(true);
    try {
      await saveCoachSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateDetailedSettings = async (updates: Partial<DetailedSettings>) => {
    if (!settings) return;

    const newSettings = {
      ...settings,
      detailedSettings: { ...settings.detailedSettings, ...updates },
      useDetailedSettings: true, // Enable custom settings when user customizes
    };
    setSettings(newSettings);

    setSaving(true);
    try {
      await saveCoachSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const selectPersona = async (persona: CoachPersona) => {
    if (!settings) return;

    // When selecting a new persona, reset to their default settings
    const personaDefaults = getSettingsForPersona(persona);
    await updateSettings({
      selectedPersona: persona,
      detailedSettings: personaDefaults,
      useDetailedSettings: false, // Use persona defaults
    });
  };

  const resetToPersonaDefaults = async () => {
    if (!settings) return;
    const personaDefaults = getSettingsForPersona(settings.selectedPersona);
    await updateSettings({
      detailedSettings: personaDefaults,
      useDetailedSettings: false,
    });
  };

  const handleResetOnboarding = async () => {
    await resetOnboarding();
    router.replace('/onboarding');
  };

  if (loading || !settings) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  const selectedPersona = PERSONAS[settings.selectedPersona];
  const detailed = settings.useDetailedSettings
    ? settings.detailedSettings
    : getSettingsForPersona(settings.selectedPersona);

  const renderPersonaCard = (persona: PersonaDefinition) => {
    const isSelected = settings.selectedPersona === persona.id;
    return (
      <Pressable
        key={persona.id}
        style={[
          styles.personaCard,
          {
            backgroundColor: isSelected
              ? colorScheme === 'dark'
                ? 'rgba(76, 175, 80, 0.2)'
                : 'rgba(76, 175, 80, 0.1)'
              : colors.cardBackground,
            borderColor: isSelected ? colors.tint : colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => selectPersona(persona.id)}
      >
        <View style={styles.personaHeader}>
          <Text style={styles.personaEmoji}>{persona.emoji}</Text>
          <View style={styles.personaInfo}>
            <Text style={[styles.personaName, { color: colors.text }]}>
              {persona.name}
            </Text>
            <Text style={[styles.personaTagline, { color: colors.textSecondary }]}>
              {persona.tagline}
            </Text>
          </View>
          {isSelected && (
            <View style={[styles.selectedBadge, { backgroundColor: colors.tint }]}>
              <Text style={styles.selectedText}>✓</Text>
            </View>
          )}
        </View>
        {isSelected && (
          <View style={styles.personaDetails}>
            <Text style={[styles.personaDescription, { color: colors.textSecondary }]}>
              {persona.description}
            </Text>
            <View style={styles.traitsRow}>
              {persona.traits.map((trait) => (
                <View
                  key={trait}
                  style={[styles.traitChip, { backgroundColor: colors.border }]}
                >
                  <Text style={[styles.traitText, { color: colors.text }]}>{trait}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  const renderSegmentedControl = <T extends string>(
    options: { value: T; label: string; emoji?: string }[],
    currentValue: T,
    onChange: (value: T) => void
  ) => (
    <View style={[styles.segmentedControl, { backgroundColor: colors.border }]}>
      {options.map((option) => {
        const isSelected = currentValue === option.value;
        return (
          <Pressable
            key={option.value}
            style={[
              styles.segment,
              isSelected && { backgroundColor: colors.tint },
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text
              style={[
                styles.segmentText,
                { color: isSelected ? '#fff' : colors.text },
              ]}
            >
              {option.emoji ? `${option.emoji} ${option.label}` : option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderToggleRow = (
    label: string,
    description: string,
    value: boolean,
    onChange: (value: boolean) => void
  ) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.toggleDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.tint }}
        thumbColor="#fff"
      />
    </View>
  );

  const renderSectionHeader = (
    title: string,
    section: string,
    emoji?: string
  ) => (
    <Pressable
      style={styles.sectionHeader}
      onPress={() => toggleSection(section)}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {emoji && `${emoji} `}{title}
      </Text>
      <Text style={[styles.sectionArrow, { color: colors.textSecondary }]}>
        {expandedSections[section] ? '▼' : '▶'}
      </Text>
    </Pressable>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Coach Settings',
          headerRight: () =>
            saving ? (
              <ActivityIndicator size="small" color={colors.tint} />
            ) : null,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Current Persona Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={styles.summaryEmoji}>{selectedPersona.emoji}</Text>
          <View style={styles.summaryInfo}>
            <Text style={[styles.summaryName, { color: colors.text }]}>
              Currently: {selectedPersona.name}
            </Text>
            <Text style={[styles.summaryTagline, { color: colors.textSecondary }]}>
              {selectedPersona.tagline}
            </Text>
          </View>
          {settings.adaptiveSettings.enabled && (
            <View style={[styles.adaptiveBadge, { backgroundColor: colors.tint }]}>
              <Text style={styles.adaptiveBadgeText}>Adaptive</Text>
            </View>
          )}
        </View>

        {/* Persona Selection */}
        {renderSectionHeader('Choose Your Guide', 'persona', '🌿')}
        {expandedSections.persona && (
          <View style={styles.sectionContent}>
            {Object.values(PERSONAS).map(renderPersonaCard)}
          </View>
        )}

        {/* Communication Style */}
        {renderSectionHeader('Communication Style', 'communication', '💬')}
        {expandedSections.communication && (
          <View style={styles.sectionContent}>
            {settings.useDetailedSettings && (
              <Pressable
                style={[styles.resetButton, { borderColor: colors.border }]}
                onPress={resetToPersonaDefaults}
              >
                <Text style={[styles.resetText, { color: colors.textSecondary }]}>
                  Reset to {selectedPersona.name}'s defaults
                </Text>
              </Pressable>
            )}

            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Energy Level
              </Text>
              {renderSegmentedControl(ENERGY_OPTIONS, detailed.energyLevel, (v) =>
                updateDetailedSettings({ energyLevel: v })
              )}
            </View>

            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Directness
              </Text>
              {renderSegmentedControl(DIRECTNESS_OPTIONS, detailed.directness, (v) =>
                updateDetailedSettings({ directness: v })
              )}
            </View>

            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Validation Level
              </Text>
              {renderSegmentedControl(VALIDATION_OPTIONS, detailed.validationStyle, (v) =>
                updateDetailedSettings({ validationStyle: v })
              )}
            </View>

            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Response Length
              </Text>
              {renderSegmentedControl(LENGTH_OPTIONS, detailed.responseLength, (v) =>
                updateDetailedSettings({ responseLength: v })
              )}
            </View>

            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Questions Asked
              </Text>
              {renderSegmentedControl(QUESTION_OPTIONS, detailed.questionFrequency, (v) =>
                updateDetailedSettings({ questionFrequency: v })
              )}
            </View>

            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Formality
              </Text>
              {renderSegmentedControl(FORMALITY_OPTIONS, detailed.formality, (v) =>
                updateDetailedSettings({ formality: v })
              )}
            </View>

            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Emoji Usage
              </Text>
              {renderSegmentedControl(EMOJI_OPTIONS, detailed.emojiUsage, (v) =>
                updateDetailedSettings({ emojiUsage: v })
              )}
            </View>

            <View style={styles.settingGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Focus
              </Text>
              {renderSegmentedControl(ACTION_OPTIONS, detailed.actionOrientation, (v) =>
                updateDetailedSettings({ actionOrientation: v })
              )}
            </View>
          </View>
        )}

        {/* Therapeutic Approaches */}
        {renderSectionHeader('Therapeutic Approaches', 'approaches', '🧠')}
        {expandedSections.approaches && (
          <View style={styles.sectionContent}>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Enable approaches that resonate with you. Multiple can be active.
            </Text>

            {renderToggleRow(
              'Mindfulness',
              'Present-moment awareness, breathing, grounding',
              detailed.useMindfulness,
              (v) => updateDetailedSettings({ useMindfulness: v })
            )}

            {renderToggleRow(
              'Thought Patterns (CBT)',
              'Explore how thoughts affect feelings and actions',
              detailed.useCBT,
              (v) => updateDetailedSettings({ useCBT: v })
            )}

            {renderToggleRow(
              'Body Awareness',
              'Notice physical sensations and somatic experiences',
              detailed.useSomatic,
              (v) => updateDetailedSettings({ useSomatic: v })
            )}

            {renderToggleRow(
              'Strengths-Based',
              'Focus on your strengths and past successes',
              detailed.useStrengthsBased,
              (v) => updateDetailedSettings({ useStrengthsBased: v })
            )}

            {renderToggleRow(
              'Motivational',
              'Encouraging, builds momentum, celebrates progress',
              detailed.useMotivational,
              (v) => updateDetailedSettings({ useMotivational: v })
            )}
          </View>
        )}

        {/* Adaptive Mode */}
        {renderSectionHeader('Adaptive Mode', 'adaptive', '🔄')}
        {expandedSections.adaptive && (
          <View style={styles.sectionContent}>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Let the coach automatically adjust based on context.
            </Text>

            {renderToggleRow(
              'Enable Adaptive Mode',
              `${selectedPersona.name} will switch styles based on your needs`,
              settings.adaptiveSettings.enabled,
              (v) =>
                updateSettings({
                  adaptiveSettings: { ...settings.adaptiveSettings, enabled: v },
                })
            )}

            {settings.adaptiveSettings.enabled && (
              <>
                <Text
                  style={[
                    styles.subSectionTitle,
                    { color: colors.text, marginTop: 20 },
                  ]}
                >
                  Adapt Based On
                </Text>

                {TRIGGER_OPTIONS.map((trigger) => {
                  const isEnabled = settings.adaptiveSettings.triggers.includes(
                    trigger.value
                  );
                  return (
                    <View key={trigger.value} style={styles.toggleRow}>
                      <View style={styles.toggleInfo}>
                        <Text style={[styles.toggleLabel, { color: colors.text }]}>
                          {trigger.label}
                        </Text>
                        <Text
                          style={[
                            styles.toggleDescription,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {trigger.description}
                        </Text>
                      </View>
                      <Switch
                        value={isEnabled}
                        onValueChange={(v) => {
                          const newTriggers = v
                            ? [...settings.adaptiveSettings.triggers, trigger.value]
                            : settings.adaptiveSettings.triggers.filter(
                                (t) => t !== trigger.value
                              );
                          updateSettings({
                            adaptiveSettings: {
                              ...settings.adaptiveSettings,
                              triggers: newTriggers,
                            },
                          });
                        }}
                        trackColor={{ false: colors.border, true: colors.tint }}
                        thumbColor="#fff"
                      />
                    </View>
                  );
                })}

                <Text
                  style={[
                    styles.subSectionTitle,
                    { color: colors.text, marginTop: 20 },
                  ]}
                >
                  Mood Mappings
                </Text>
                <Text
                  style={[
                    styles.sectionDescription,
                    { color: colors.textSecondary, marginBottom: 12 },
                  ]}
                >
                  Which guide should help with each mood?
                </Text>

                {(
                  [
                    { mood: 'anxious', emoji: '😰', label: 'When anxious' },
                    { mood: 'sad', emoji: '😢', label: 'When sad' },
                    { mood: 'angry', emoji: '😤', label: 'When angry' },
                    { mood: 'happy', emoji: '😊', label: 'When happy' },
                    { mood: 'neutral', emoji: '😐', label: 'When neutral' },
                  ] as const
                ).map(({ mood, emoji, label }) => (
                  <View key={mood} style={styles.moodMappingRow}>
                    <Text style={[styles.moodLabel, { color: colors.text }]}>
                      {emoji} {label}
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.moodPersonaScroll}
                    >
                      {Object.values(PERSONAS).map((persona) => {
                        const isSelected =
                          settings.adaptiveSettings.moodMappings[mood] === persona.id;
                        return (
                          <Pressable
                            key={persona.id}
                            style={[
                              styles.moodPersonaChip,
                              {
                                backgroundColor: isSelected
                                  ? colors.tint
                                  : colors.cardBackground,
                                borderColor: isSelected ? colors.tint : colors.border,
                              },
                            ]}
                            onPress={() =>
                              updateSettings({
                                adaptiveSettings: {
                                  ...settings.adaptiveSettings,
                                  moodMappings: {
                                    ...settings.adaptiveSettings.moodMappings,
                                    [mood]: persona.id,
                                  },
                                },
                              })
                            }
                          >
                            <Text style={styles.moodPersonaEmoji}>
                              {persona.emoji}
                            </Text>
                            <Text
                              style={[
                                styles.moodPersonaName,
                                { color: isSelected ? '#fff' : colors.text },
                              ]}
                            >
                              {persona.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* Context Awareness */}
        {renderSectionHeader('Context Awareness', 'context', '🔮')}
        {expandedSections.context && (
          <View style={styles.sectionContent}>
            {renderToggleRow(
              'Acknowledge Time',
              'Say "Good morning" etc. when appropriate',
              detailed.acknowledgeTime,
              (v) => updateDetailedSettings({ acknowledgeTime: v })
            )}

            {renderToggleRow(
              'Reference Patterns',
              'Notice and mention patterns in your sharing',
              detailed.referencePatterns,
              (v) => updateDetailedSettings({ referencePatterns: v })
            )}

            {renderToggleRow(
              'Track Milestones',
              'Celebrate journaling streaks and progress',
              detailed.trackMilestones,
              (v) => updateDetailedSettings({ trackMilestones: v })
            )}
          </View>
        )}

        {/* Reset Section */}
        <View style={[styles.resetSection, { borderTopColor: colors.border }]}>
          <Pressable
            style={[styles.resetOnboardingButton, { borderColor: colors.border }]}
            onPress={handleResetOnboarding}
          >
            <Text style={[styles.resetOnboardingText, { color: colors.textSecondary }]}>
              Redo Onboarding
            </Text>
          </Pressable>
          <Text style={[styles.resetHint, { color: colors.textSecondary }]}>
            Start fresh with a new personality quiz
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  summaryEmoji: {
    fontSize: 36,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryName: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryTagline: {
    fontSize: 14,
    marginTop: 2,
  },
  adaptiveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adaptiveBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionArrow: {
    fontSize: 12,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  personaCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  personaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  personaEmoji: {
    fontSize: 28,
  },
  personaInfo: {
    flex: 1,
  },
  personaName: {
    fontSize: 17,
    fontWeight: '600',
  },
  personaTagline: {
    fontSize: 13,
    marginTop: 2,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  personaDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  personaDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  traitChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  traitText: {
    fontSize: 12,
    fontWeight: '500',
  },
  settingGroup: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  toggleDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  resetButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '500',
  },
  moodMappingRow: {
    marginBottom: 12,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  moodPersonaScroll: {
    flexDirection: 'row',
  },
  moodPersonaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    gap: 4,
  },
  moodPersonaEmoji: {
    fontSize: 16,
  },
  moodPersonaName: {
    fontSize: 13,
    fontWeight: '500',
  },
  resetSection: {
    marginTop: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  resetOnboardingButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetOnboardingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  resetHint: {
    fontSize: 12,
    marginTop: 8,
  },
});
