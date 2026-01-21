/**
 * Quick Log Panel
 *
 * A quick-tap interface for logging lifestyle factors:
 * - Food tags (fast food, caffeine, healthy foods, etc.)
 * - Sleep quality
 * - Symptoms with intensity
 * - Flow level
 *
 * Designed for minimal friction daily logging during menstrual cycle.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  FOOD_TAGS,
  FoodTag,
  SYMPTOM_OPTIONS,
  SLEEP_ISSUES,
  SleepQuality,
  SleepIssue,
  SymptomIntensity,
  EnhancedSymptomLog,
  DailyCorrelationLog,
} from '../../types/PeriodCorrelation';
import {
  logFoodTags,
  removeFoodTag,
  logSleep,
  logSymptoms,
  logFlowLevel,
  getTodayLog,
} from '../../services/periodCorrelationService';

// ============================================
// TYPES
// ============================================

interface QuickLogPanelProps {
  onClose?: () => void;
  onSaved?: () => void;
  initialTab?: 'food' | 'symptoms' | 'sleep' | 'flow';
}

type TabType = 'food' | 'symptoms' | 'sleep' | 'flow';

// ============================================
// COMPONENT
// ============================================

export function QuickLogPanel({
  onClose,
  onSaved,
  initialTab = 'food',
}: QuickLogPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [todayLog, setTodayLog] = useState<DailyCorrelationLog | null>(null);
  const [selectedFoodTags, setSelectedFoodTags] = useState<Set<string>>(new Set());
  const [symptoms, setSymptoms] = useState<EnhancedSymptomLog['symptoms']>({});
  const [sleepHours, setSleepHours] = useState<number | undefined>();
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | undefined>();
  const [sleepIssues, setSleepIssues] = useState<Set<SleepIssue>>(new Set());
  const [flowLevel, setFlowLevel] = useState<DailyCorrelationLog['flowLevel']>();
  const [saving, setSaving] = useState(false);

  // Load today's existing log
  useEffect(() => {
    loadTodayLog();
  }, []);

  const loadTodayLog = async () => {
    const log = await getTodayLog();
    if (log) {
      setTodayLog(log);
      setSelectedFoodTags(new Set(log.foodTags));
      setSymptoms(log.symptoms || {});
      setFlowLevel(log.flowLevel);
      if (log.sleep) {
        setSleepHours(log.sleep.hours);
        setSleepQuality(log.sleep.quality);
        setSleepIssues(new Set(log.sleep.issues || []));
      }
    }
  };

  // ============================================
  // FOOD TAG HANDLERS
  // ============================================

  const toggleFoodTag = useCallback(
    async (tagId: string) => {
      const newSelected = new Set(selectedFoodTags);
      if (newSelected.has(tagId)) {
        newSelected.delete(tagId);
        await removeFoodTag(tagId);
      } else {
        newSelected.add(tagId);
        await logFoodTags([tagId]);
      }
      setSelectedFoodTags(newSelected);
    },
    [selectedFoodTags]
  );

  // ============================================
  // SYMPTOM HANDLERS
  // ============================================

  const setSymptomIntensity = useCallback(
    (symptomId: keyof EnhancedSymptomLog['symptoms'], intensity: SymptomIntensity) => {
      setSymptoms((prev) => ({
        ...prev,
        [symptomId]: intensity,
      }));
    },
    []
  );

  const saveSymptoms = useCallback(async () => {
    setSaving(true);
    try {
      await logSymptoms(symptoms);
      onSaved?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to save symptoms');
    } finally {
      setSaving(false);
    }
  }, [symptoms, onSaved]);

  // ============================================
  // SLEEP HANDLERS
  // ============================================

  const toggleSleepIssue = useCallback(
    (issue: SleepIssue) => {
      const newIssues = new Set(sleepIssues);
      if (newIssues.has(issue)) {
        newIssues.delete(issue);
      } else {
        newIssues.add(issue);
      }
      setSleepIssues(newIssues);
    },
    [sleepIssues]
  );

  const saveSleep = useCallback(async () => {
    setSaving(true);
    try {
      await logSleep({
        hours: sleepHours,
        quality: sleepQuality,
        issues: Array.from(sleepIssues),
        source: 'manual',
      });
      onSaved?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to save sleep data');
    } finally {
      setSaving(false);
    }
  }, [sleepHours, sleepQuality, sleepIssues, onSaved]);

  // ============================================
  // FLOW HANDLERS
  // ============================================

  const saveFlowLevel = useCallback(
    async (level: DailyCorrelationLog['flowLevel']) => {
      setFlowLevel(level);
      setSaving(true);
      try {
        await logFlowLevel(level);
        onSaved?.();
      } catch (error) {
        Alert.alert('Error', 'Failed to save flow level');
      } finally {
        setSaving(false);
      }
    },
    [onSaved]
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Quick Log</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['food', 'symptoms', 'sleep', 'flow'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'food' && '🍽️'}
              {tab === 'symptoms' && '😣'}
              {tab === 'sleep' && '😴'}
              {tab === 'flow' && '🩸'}
            </Text>
            <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'food' && (
          <FoodTagSection
            selectedTags={selectedFoodTags}
            onToggle={toggleFoodTag}
          />
        )}
        {activeTab === 'symptoms' && (
          <SymptomSection
            symptoms={symptoms}
            onSetIntensity={setSymptomIntensity}
            onSave={saveSymptoms}
            saving={saving}
          />
        )}
        {activeTab === 'sleep' && (
          <SleepSection
            hours={sleepHours}
            quality={sleepQuality}
            issues={sleepIssues}
            onSetHours={setSleepHours}
            onSetQuality={setSleepQuality}
            onToggleIssue={toggleSleepIssue}
            onSave={saveSleep}
            saving={saving}
          />
        )}
        {activeTab === 'flow' && (
          <FlowSection
            currentLevel={flowLevel}
            onSelect={saveFlowLevel}
            saving={saving}
          />
        )}
      </ScrollView>
    </View>
  );
}

// ============================================
// FOOD TAG SECTION
// ============================================

function FoodTagSection({
  selectedTags,
  onToggle,
}: {
  selectedTags: Set<string>;
  onToggle: (tagId: string) => void;
}) {
  const renderCategory = (
    title: string,
    tags: FoodTag[],
    subtitle?: string
  ) => (
    <View style={styles.categorySection}>
      <Text style={styles.categoryTitle}>{title}</Text>
      {subtitle && <Text style={styles.categorySubtitle}>{subtitle}</Text>}
      <View style={styles.tagGrid}>
        {tags.map((tag) => (
          <TouchableOpacity
            key={tag.id}
            style={[
              styles.tag,
              selectedTags.has(tag.id) && styles.tagSelected,
              tag.category === 'negative' && selectedTags.has(tag.id) && styles.tagNegative,
              tag.category === 'positive' && selectedTags.has(tag.id) && styles.tagPositive,
            ]}
            onPress={() => onToggle(tag.id)}
          >
            <Text style={styles.tagEmoji}>{tag.emoji}</Text>
            <Text
              style={[
                styles.tagLabel,
                selectedTags.has(tag.id) && styles.tagLabelSelected,
              ]}
            >
              {tag.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const negativeTags = FOOD_TAGS.filter((t) => t.category === 'negative');
  const neutralTags = FOOD_TAGS.filter((t) => t.category === 'neutral');
  const positiveTags = FOOD_TAGS.filter((t) => t.category === 'positive');
  const supplements = FOOD_TAGS.filter((t) => t.category === 'supplement');

  return (
    <View>
      <Text style={styles.sectionHeader}>What did you eat today?</Text>
      <Text style={styles.sectionSubheader}>Tap all that apply</Text>

      {renderCategory('May worsen symptoms', negativeTags)}
      {renderCategory('Varies by person', neutralTags)}
      {renderCategory('May help symptoms', positiveTags)}
      {renderCategory('Supplements', supplements)}

      <Text style={styles.autoSaveNote}>
        Changes save automatically
      </Text>
    </View>
  );
}

// ============================================
// SYMPTOM SECTION
// ============================================

function SymptomSection({
  symptoms,
  onSetIntensity,
  onSave,
  saving,
}: {
  symptoms: EnhancedSymptomLog['symptoms'];
  onSetIntensity: (
    id: keyof EnhancedSymptomLog['symptoms'],
    intensity: SymptomIntensity
  ) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const intensityLabels: Record<SymptomIntensity, string> = {
    0: 'None',
    1: 'Mild',
    2: 'Moderate',
    3: 'Severe',
  };

  return (
    <View>
      <Text style={styles.sectionHeader}>How are you feeling?</Text>
      <Text style={styles.sectionSubheader}>Rate each symptom</Text>

      {SYMPTOM_OPTIONS.map((symptom) => (
        <View key={symptom.id} style={styles.symptomRow}>
          <View style={styles.symptomLabel}>
            <Text style={styles.symptomEmoji}>{symptom.emoji}</Text>
            <Text style={styles.symptomName}>{symptom.label}</Text>
          </View>
          <View style={styles.intensityButtons}>
            {([0, 1, 2, 3] as SymptomIntensity[]).map((intensity) => (
              <TouchableOpacity
                key={intensity}
                style={[
                  styles.intensityButton,
                  symptoms[symptom.id] === intensity && styles.intensitySelected,
                  intensity === 3 &&
                    symptoms[symptom.id] === intensity &&
                    styles.intensitySevere,
                ]}
                onPress={() => onSetIntensity(symptom.id, intensity)}
              >
                <Text
                  style={[
                    styles.intensityText,
                    symptoms[symptom.id] === intensity && styles.intensityTextSelected,
                  ]}
                >
                  {intensity}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.intensityLegend}>
        {([0, 1, 2, 3] as SymptomIntensity[]).map((i) => (
          <Text key={i} style={styles.legendText}>
            {i} = {intensityLabels[i]}
          </Text>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={onSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : 'Save Symptoms'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// SLEEP SECTION
// ============================================

function SleepSection({
  hours,
  quality,
  issues,
  onSetHours,
  onSetQuality,
  onToggleIssue,
  onSave,
  saving,
}: {
  hours?: number;
  quality?: SleepQuality;
  issues: Set<SleepIssue>;
  onSetHours: (h: number) => void;
  onSetQuality: (q: SleepQuality) => void;
  onToggleIssue: (i: SleepIssue) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const hourOptions = [4, 5, 6, 7, 8, 9, 10];
  const qualityOptions: { value: SleepQuality; emoji: string; label: string }[] = [
    { value: 'poor', emoji: '😫', label: 'Poor' },
    { value: 'okay', emoji: '😐', label: 'Okay' },
    { value: 'good', emoji: '😊', label: 'Good' },
    { value: 'great', emoji: '😴', label: 'Great' },
  ];

  return (
    <View>
      <Text style={styles.sectionHeader}>Last night's sleep</Text>

      {/* Hours */}
      <Text style={styles.subsectionTitle}>Hours slept</Text>
      <View style={styles.hourButtons}>
        {hourOptions.map((h) => (
          <TouchableOpacity
            key={h}
            style={[styles.hourButton, hours === h && styles.hourSelected]}
            onPress={() => onSetHours(h)}
          >
            <Text
              style={[styles.hourText, hours === h && styles.hourTextSelected]}
            >
              {h}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quality */}
      <Text style={styles.subsectionTitle}>Sleep quality</Text>
      <View style={styles.qualityButtons}>
        {qualityOptions.map((q) => (
          <TouchableOpacity
            key={q.value}
            style={[
              styles.qualityButton,
              quality === q.value && styles.qualitySelected,
            ]}
            onPress={() => onSetQuality(q.value)}
          >
            <Text style={styles.qualityEmoji}>{q.emoji}</Text>
            <Text
              style={[
                styles.qualityLabel,
                quality === q.value && styles.qualityLabelSelected,
              ]}
            >
              {q.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Issues */}
      <Text style={styles.subsectionTitle}>Any issues?</Text>
      <View style={styles.issueGrid}>
        {SLEEP_ISSUES.map((issue) => (
          <TouchableOpacity
            key={issue.id}
            style={[
              styles.issueTag,
              issues.has(issue.id) && styles.issueSelected,
            ]}
            onPress={() => onToggleIssue(issue.id)}
          >
            <Text
              style={[
                styles.issueText,
                issues.has(issue.id) && styles.issueTextSelected,
              ]}
            >
              {issue.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={onSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : 'Save Sleep'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// FLOW SECTION
// ============================================

function FlowSection({
  currentLevel,
  onSelect,
  saving,
}: {
  currentLevel?: DailyCorrelationLog['flowLevel'];
  onSelect: (level: DailyCorrelationLog['flowLevel']) => void;
  saving: boolean;
}) {
  const flowOptions: {
    value: DailyCorrelationLog['flowLevel'];
    emoji: string;
    label: string;
  }[] = [
    { value: 'none', emoji: '⚪', label: 'None' },
    { value: 'spotting', emoji: '🔴', label: 'Spotting' },
    { value: 'light', emoji: '💧', label: 'Light' },
    { value: 'medium', emoji: '💧💧', label: 'Medium' },
    { value: 'heavy', emoji: '💧💧💧', label: 'Heavy' },
  ];

  return (
    <View>
      <Text style={styles.sectionHeader}>Today's flow</Text>
      <Text style={styles.sectionSubheader}>Tap to select</Text>

      <View style={styles.flowOptions}>
        {flowOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.flowOption,
              currentLevel === option.value && styles.flowSelected,
              saving && styles.flowDisabled,
            ]}
            onPress={() => onSelect(option.value)}
            disabled={saving}
          >
            <Text style={styles.flowEmoji}>{option.emoji}</Text>
            <Text
              style={[
                styles.flowLabel,
                currentLevel === option.value && styles.flowLabelSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.autoSaveNote}>Saves automatically when you tap</Text>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: '#8b7cf7',
    fontSize: 16,
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#2a2a4a',
  },
  tabText: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  sectionSubheader: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#aaa',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a4a',
    borderWidth: 1,
    borderColor: '#3a3a5a',
  },
  tagSelected: {
    borderColor: '#8b7cf7',
    backgroundColor: '#3a3a6a',
  },
  tagNegative: {
    borderColor: '#f77',
    backgroundColor: '#4a2a3a',
  },
  tagPositive: {
    borderColor: '#7f7',
    backgroundColor: '#2a4a3a',
  },
  tagEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  tagLabel: {
    fontSize: 14,
    color: '#ccc',
  },
  tagLabelSelected: {
    color: '#fff',
  },
  autoSaveNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  symptomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  symptomLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symptomEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  symptomName: {
    fontSize: 16,
    color: '#fff',
  },
  intensityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  intensityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a4a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a5a',
  },
  intensitySelected: {
    backgroundColor: '#8b7cf7',
    borderColor: '#8b7cf7',
  },
  intensitySevere: {
    backgroundColor: '#d55',
    borderColor: '#d55',
  },
  intensityText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  intensityTextSelected: {
    color: '#fff',
  },
  intensityLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingVertical: 8,
    backgroundColor: '#2a2a4a',
    borderRadius: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#888',
  },
  saveButton: {
    backgroundColor: '#8b7cf7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#aaa',
    marginTop: 16,
    marginBottom: 8,
  },
  hourButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hourButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a4a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a5a',
  },
  hourSelected: {
    backgroundColor: '#8b7cf7',
    borderColor: '#8b7cf7',
  },
  hourText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  hourTextSelected: {
    color: '#fff',
  },
  qualityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qualityButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#2a2a4a',
    borderWidth: 1,
    borderColor: '#3a3a5a',
  },
  qualitySelected: {
    backgroundColor: '#8b7cf7',
    borderColor: '#8b7cf7',
  },
  qualityEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  qualityLabel: {
    fontSize: 12,
    color: '#888',
  },
  qualityLabelSelected: {
    color: '#fff',
  },
  issueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  issueTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#2a2a4a',
    borderWidth: 1,
    borderColor: '#3a3a5a',
  },
  issueSelected: {
    backgroundColor: '#4a3a6a',
    borderColor: '#8b7cf7',
  },
  issueText: {
    fontSize: 13,
    color: '#888',
  },
  issueTextSelected: {
    color: '#fff',
  },
  flowOptions: {
    gap: 12,
  },
  flowOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#2a2a4a',
    borderWidth: 1,
    borderColor: '#3a3a5a',
  },
  flowSelected: {
    backgroundColor: '#3a3a6a',
    borderColor: '#8b7cf7',
  },
  flowDisabled: {
    opacity: 0.5,
  },
  flowEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  flowLabel: {
    fontSize: 16,
    color: '#ccc',
  },
  flowLabelSelected: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default QuickLogPanel;
