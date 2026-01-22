/**
 * Training Admin Interface
 *
 * Admin page for managing training data:
 * - Import interview insights
 * - Browse and manage insights
 * - View training readiness
 * - Export training data
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  useColorScheme,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import {
  importInterviewInsight,
  approveInsight,
  rejectInsight,
  deleteInsight,
  getAllInsights,
  getInsightsByStatus,
  getTrainingReadiness,
  exportAsJSON,
  batchImportInsights,
  importFromInterviewLinks,
  parseBatchImportJSON,
  InterviewInsight,
  TrainingReadiness,
  InsightCategory,
  SourceType,
  ConfidenceLevel,
  BatchImportResult,
  INSIGHT_CATEGORIES,
  SOURCE_TYPES,
  CONFIDENCE_LEVELS,
} from '@/services/trainingDataService';

type Tab = 'dashboard' | 'import' | 'insights' | 'export';

export default function TrainingAdminScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);

  // Dashboard state
  const [readiness, setReadiness] = useState<TrainingReadiness | null>(null);

  // Import state
  const [importMode, setImportMode] = useState<'single' | 'batch'>('single');
  const [importForm, setImportForm] = useState({
    title: '',
    insight: '',
    coachingImplication: '',
    quotes: '',
    antiPatterns: '',
    category: 'cognitive_patterns' as InsightCategory,
    sourceType: 'user_interview' as SourceType,
    source: '',
    confidenceLevel: 'observed' as ConfidenceLevel,
    relatedProfiles: '',
  });

  // Batch import state
  const [batchJSON, setBatchJSON] = useState('');
  const [batchImporting, setBatchImporting] = useState(false);
  const [lastBatchResult, setLastBatchResult] = useState<BatchImportResult | null>(null);

  // Insights state
  const [insights, setInsights] = useState<InterviewInsight[]>([]);
  const [insightFilter, setInsightFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [readinessData, insightsData] = await Promise.all([
        getTrainingReadiness(),
        getAllInsights(),
      ]);
      setReadiness(readinessData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter insights
  const filteredInsights = insights.filter(i => {
    if (insightFilter === 'all') return true;
    return i.status === insightFilter;
  });

  // Handle import
  const handleImport = async () => {
    if (!importForm.title || !importForm.insight || !importForm.coachingImplication) {
      Alert.alert('Missing Fields', 'Please fill in title, insight, and coaching implication.');
      return;
    }

    try {
      await importInterviewInsight({
        title: importForm.title,
        insight: importForm.insight,
        coachingImplication: importForm.coachingImplication,
        quotes: importForm.quotes ? importForm.quotes.split('\n').filter(q => q.trim()) : undefined,
        antiPatterns: importForm.antiPatterns ? importForm.antiPatterns.split('\n').filter(a => a.trim()) : undefined,
        category: importForm.category,
        sourceType: importForm.sourceType,
        source: importForm.source || 'Manual import',
        confidenceLevel: importForm.confidenceLevel,
        relatedProfiles: importForm.relatedProfiles ? importForm.relatedProfiles.split(',').map(p => p.trim()) : undefined,
        dateCollected: new Date().toISOString(),
      });

      Alert.alert('Success', 'Insight imported successfully!');

      // Reset form
      setImportForm({
        title: '',
        insight: '',
        coachingImplication: '',
        quotes: '',
        antiPatterns: '',
        category: 'cognitive_patterns',
        sourceType: 'user_interview',
        source: '',
        confidenceLevel: 'observed',
        relatedProfiles: '',
      });

      // Refresh data
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to import insight.');
    }
  };

  // Handle approve/reject
  const handleApprove = async (id: string) => {
    await approveInsight(id, 'admin');
    loadData();
  };

  const handleReject = async (id: string) => {
    await rejectInsight(id);
    loadData();
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Insight', 'Are you sure you want to delete this insight?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteInsight(id);
          loadData();
        },
      },
    ]);
  };

  // Handle batch import
  const handleBatchImport = async () => {
    if (!batchJSON.trim()) {
      Alert.alert('Empty JSON', 'Please paste or enter JSON data to import.');
      return;
    }

    // Parse and validate
    const parseResult = parseBatchImportJSON(batchJSON);
    if (!parseResult.valid || !parseResult.payload) {
      Alert.alert('Invalid JSON', parseResult.error || 'Could not parse JSON');
      return;
    }

    setBatchImporting(true);
    setLastBatchResult(null);

    try {
      let result: BatchImportResult;

      if (parseResult.type === 'interviewLinks') {
        result = await importFromInterviewLinks(parseResult.payload as any);
      } else {
        result = await batchImportInsights(parseResult.payload as any);
      }

      setLastBatchResult(result);

      if (result.success) {
        Alert.alert(
          'Import Complete',
          `Successfully imported ${result.imported} insight(s).`
        );
        setBatchJSON('');
      } else {
        Alert.alert(
          'Partial Import',
          `Imported ${result.imported}, failed ${result.failed}.\n\nErrors:\n${result.errors.slice(0, 3).join('\n')}`
        );
      }

      loadData();
    } catch (error) {
      Alert.alert('Import Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBatchImporting(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const json = await exportAsJSON();
      await Share.share({
        message: json,
        title: 'Mood Leaf Training Data',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export training data.');
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'import':
        return renderImport();
      case 'insights':
        return renderInsights();
      case 'export':
        return renderExport();
    }
  };

  // Dashboard tab
  const renderDashboard = () => {
    if (!readiness) return null;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Phase indicator */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Current Phase: {readiness.phase}
          </Text>
          <Text style={[styles.phaseName, { color: colors.tint }]}>
            {readiness.phaseName}
          </Text>
          <Text style={[styles.phaseDesc, { color: colors.textSecondary }]}>
            {readiness.phaseDescription}
          </Text>
        </View>

        {/* Stats */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Training Data</Text>
          <View style={styles.statsGrid}>
            <StatItem
              label="Claude Scored"
              value={readiness.claudeScoredExamples}
              colors={colors}
            />
            <StatItem
              label="Local Scored"
              value={readiness.localScoredExamples}
              colors={colors}
            />
            <StatItem
              label="Insights"
              value={readiness.approvedInsights}
              colors={colors}
            />
            <StatItem
              label="Corrections"
              value={readiness.corrections}
              colors={colors}
            />
          </View>
        </View>

        {/* Requirements */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Requirements for Next Phase
          </Text>
          {readiness.requirements.map((req, index) => (
            <View key={index} style={styles.requirement}>
              <View style={styles.reqHeader}>
                <Text style={[styles.reqName, { color: colors.text }]}>{req.name}</Text>
                <Text style={[
                  styles.reqStatus,
                  { color: req.met ? '#4CAF50' : colors.textSecondary }
                ]}>
                  {req.met ? '✓' : `${req.current}/${req.needed}`}
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((req.current / req.needed) * 100, 100)}%`,
                      backgroundColor: req.met ? '#4CAF50' : colors.tint,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Next milestone */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Next Milestone</Text>
          <Text style={[styles.milestone, { color: colors.textSecondary }]}>
            {readiness.nextMilestone}
          </Text>
        </View>
      </ScrollView>
    );
  };

  // Import tab
  const renderImport = () => {
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Import Mode Toggle */}
        <View style={styles.importModeToggle}>
          <Pressable
            style={[
              styles.modeButton,
              importMode === 'single' && { backgroundColor: colors.tint },
            ]}
            onPress={() => setImportMode('single')}
          >
            <Text style={[
              styles.modeButtonText,
              { color: importMode === 'single' ? '#fff' : colors.text }
            ]}>
              Single Import
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.modeButton,
              importMode === 'batch' && { backgroundColor: colors.tint },
            ]}
            onPress={() => setImportMode('batch')}
          >
            <Text style={[
              styles.modeButtonText,
              { color: importMode === 'batch' ? '#fff' : colors.text }
            ]}>
              Batch Import
            </Text>
          </Pressable>
        </View>

        {importMode === 'batch' ? (
          /* Batch Import UI */
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Batch Import from JSON
            </Text>

            <Text style={[styles.batchDesc, { color: colors.textSecondary }]}>
              Paste JSON to import multiple insights at once. Supports both standard batch format and interview links format.
            </Text>

            <TextInput
              style={[styles.jsonInput, { color: colors.text, borderColor: colors.border }]}
              placeholder='{"source": "...", "insights": [...]}'
              placeholderTextColor={colors.textSecondary}
              value={batchJSON}
              onChangeText={setBatchJSON}
              multiline
              numberOfLines={12}
            />

            {lastBatchResult && (
              <View style={[
                styles.batchResultCard,
                { backgroundColor: lastBatchResult.success ? '#4CAF5010' : '#FF980010' }
              ]}>
                <Text style={[styles.batchResultTitle, { color: colors.text }]}>
                  Last Import Result
                </Text>
                <Text style={{ color: '#4CAF50' }}>
                  Imported: {lastBatchResult.imported}
                </Text>
                {lastBatchResult.failed > 0 && (
                  <>
                    <Text style={{ color: '#F44336' }}>
                      Failed: {lastBatchResult.failed}
                    </Text>
                    {lastBatchResult.errors.slice(0, 3).map((err, i) => (
                      <Text key={i} style={[styles.errorText, { color: colors.textSecondary }]}>
                        • {err}
                      </Text>
                    ))}
                  </>
                )}
              </View>
            )}

            <Pressable
              style={[
                styles.primaryButton,
                { backgroundColor: colors.tint, opacity: batchImporting ? 0.6 : 1 }
              ]}
              onPress={handleBatchImport}
              disabled={batchImporting}
            >
              {batchImporting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Import from JSON</Text>
              )}
            </Pressable>

            {/* Format guide */}
            <View style={[styles.formatGuide, { borderColor: colors.border }]}>
              <Text style={[styles.formatGuideTitle, { color: colors.text }]}>
                JSON Formats
              </Text>
              <Text style={[styles.formatGuideText, { color: colors.textSecondary }]}>
                Standard batch:{'\n'}
                {`{
  "source": "Q1 Research",
  "insights": [
    {
      "category": "cognitive_patterns",
      "title": "...",
      "insight": "...",
      "coachingImplication": "...",
      "confidenceLevel": "observed"
    }
  ]
}`}
              </Text>
              <Text style={[styles.formatGuideText, { color: colors.textSecondary, marginTop: 12 }]}>
                Interview links:{'\n'}
                {`{
  "source": "Interview Sessions",
  "interviewLinks": [
    {
      "interviewId": "INT-001",
      "date": "2025-01-15",
      "link": "https://...",
      "insights": [...]
    }
  ]
}`}
              </Text>
            </View>
          </View>
        ) : (
          /* Single Import UI */
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Import Interview Insight
            </Text>

            {/* Title */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Title *
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Short summary of the insight"
            placeholderTextColor={colors.textSecondary}
            value={importForm.title}
            onChangeText={(text) => setImportForm({ ...importForm, title: text })}
          />

          {/* Category */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {INSIGHT_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: importForm.category === cat.value ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => setImportForm({ ...importForm, category: cat.value })}
              >
                <Text style={[
                  styles.chipText,
                  { color: importForm.category === cat.value ? '#fff' : colors.text }
                ]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Insight */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Insight *
          </Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
            placeholder="What did you learn about how humans work?"
            placeholderTextColor={colors.textSecondary}
            value={importForm.insight}
            onChangeText={(text) => setImportForm({ ...importForm, insight: text })}
            multiline
            numberOfLines={4}
          />

          {/* Coaching Implication */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Coaching Implication *
          </Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
            placeholder="How should the coach behave differently based on this?"
            placeholderTextColor={colors.textSecondary}
            value={importForm.coachingImplication}
            onChangeText={(text) => setImportForm({ ...importForm, coachingImplication: text })}
            multiline
            numberOfLines={3}
          />

          {/* Quotes */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Quotes (one per line)
          </Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
            placeholder="Direct quotes from interviews..."
            placeholderTextColor={colors.textSecondary}
            value={importForm.quotes}
            onChangeText={(text) => setImportForm({ ...importForm, quotes: text })}
            multiline
            numberOfLines={3}
          />

          {/* Anti-patterns */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Anti-patterns (one per line)
          </Text>
          <TextInput
            style={[styles.textArea, { color: colors.text, borderColor: colors.border }]}
            placeholder="Things the coach should NOT do..."
            placeholderTextColor={colors.textSecondary}
            value={importForm.antiPatterns}
            onChangeText={(text) => setImportForm({ ...importForm, antiPatterns: text })}
            multiline
            numberOfLines={3}
          />

          {/* Source */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Source
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Interview #23, Research paper, etc."
            placeholderTextColor={colors.textSecondary}
            value={importForm.source}
            onChangeText={(text) => setImportForm({ ...importForm, source: text })}
          />

          {/* Confidence */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Confidence Level
          </Text>
          <View style={styles.chipRow}>
            {CONFIDENCE_LEVELS.map((level) => (
              <Pressable
                key={level.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: importForm.confidenceLevel === level.value ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => setImportForm({ ...importForm, confidenceLevel: level.value })}
              >
                <Text style={[
                  styles.chipText,
                  { color: importForm.confidenceLevel === level.value ? '#fff' : colors.text }
                ]}>
                  {level.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Import button */}
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.tint }]}
            onPress={handleImport}
          >
            <Text style={styles.primaryButtonText}>Import Insight</Text>
          </Pressable>
          </View>
        )}
      </ScrollView>
    );
  };

  // Insights tab
  const renderInsights = () => {
    return (
      <View style={styles.tabContent}>
        {/* Filter */}
        <View style={styles.filterRow}>
          {(['all', 'pending', 'approved'] as const).map((filter) => (
            <Pressable
              key={filter}
              style={[
                styles.filterChip,
                {
                  backgroundColor: insightFilter === filter ? colors.tint : colors.border,
                },
              ]}
              onPress={() => setInsightFilter(filter)}
            >
              <Text style={[
                styles.filterChipText,
                { color: insightFilter === filter ? '#fff' : colors.text }
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Insights list */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredInsights.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No insights found
            </Text>
          ) : (
            filteredInsights.map((insight) => (
              <View
                key={insight.id}
                style={[styles.insightCard, { backgroundColor: colors.cardBackground }]}
              >
                <View style={styles.insightHeader}>
                  <View style={[
                    styles.statusBadge,
                    {
                      backgroundColor: insight.status === 'approved' ? '#4CAF5030' :
                        insight.status === 'pending' ? '#FF980030' : '#F4433630'
                    }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      {
                        color: insight.status === 'approved' ? '#4CAF50' :
                          insight.status === 'pending' ? '#FF9800' : '#F44336'
                      }
                    ]}>
                      {insight.status}
                    </Text>
                  </View>
                  <Text style={[styles.categoryTag, { color: colors.textSecondary }]}>
                    {insight.category.replace('_', ' ')}
                  </Text>
                </View>

                <Text style={[styles.insightTitle, { color: colors.text }]}>
                  {insight.title}
                </Text>

                <Text style={[styles.insightText, { color: colors.textSecondary }]} numberOfLines={3}>
                  {insight.insight}
                </Text>

                {insight.quotes && insight.quotes.length > 0 && (
                  <Text style={[styles.quotePreview, { color: colors.textSecondary }]}>
                    "{insight.quotes[0]}"
                  </Text>
                )}

                {/* Actions */}
                <View style={styles.insightActions}>
                  {insight.status === 'pending' && (
                    <>
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: '#4CAF5020' }]}
                        onPress={() => handleApprove(insight.id)}
                      >
                        <Text style={{ color: '#4CAF50' }}>Approve</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: '#F4433620' }]}
                        onPress={() => handleReject(insight.id)}
                      >
                        <Text style={{ color: '#F44336' }}>Reject</Text>
                      </Pressable>
                    </>
                  )}
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: colors.border }]}
                    onPress={() => handleDelete(insight.id)}
                  >
                    <Text style={{ color: colors.textSecondary }}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  // Export tab
  const renderExport = () => {
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Export Training Data
          </Text>
          <Text style={[styles.exportDesc, { color: colors.textSecondary }]}>
            Export all training data (conversations, insights, corrections) as JSON for model training.
          </Text>

          {readiness && (
            <View style={styles.exportStats}>
              <Text style={[styles.exportStatText, { color: colors.text }]}>
                Conversations: {readiness.claudeScoredExamples + readiness.localScoredExamples}
              </Text>
              <Text style={[styles.exportStatText, { color: colors.text }]}>
                Insights: {readiness.approvedInsights}
              </Text>
              <Text style={[styles.exportStatText, { color: colors.text }]}>
                Corrections: {readiness.corrections}
              </Text>
            </View>
          )}

          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.tint }]}
            onPress={handleExport}
          >
            <Text style={styles.primaryButtonText}>Export as JSON</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Training Guide
          </Text>
          <Text style={[styles.guideText, { color: colors.textSecondary }]}>
            1. Export data when you have 500+ Claude-scored examples{'\n'}
            2. Use exported JSON to train local scorer{'\n'}
            3. At 2000+ examples + 50 insights, train local LLM{'\n'}
            4. See TRAINING_MODULE.md for full guide
          </Text>
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={20}>
          <Text style={[styles.backButton, { color: colors.tint }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Training Admin
        </Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['dashboard', 'import', 'insights', 'export'] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: colors.tint, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? colors.tint : colors.textSecondary },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {renderTabContent()}
    </View>
  );
}

// Stat item component
function StatItem({ label, value, colors }: { label: string; value: number; colors: any }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
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
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  phaseName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  phaseDesc: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statItem: {
    width: '50%',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  requirement: {
    marginBottom: 12,
  },
  reqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reqName: {
    fontSize: 14,
  },
  reqStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  milestone: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipScroll: {
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  primaryButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  insightCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryTag: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
  quotePreview: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
  },
  insightActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  exportStats: {
    gap: 4,
    marginBottom: 16,
  },
  exportStatText: {
    fontSize: 14,
  },
  guideText: {
    fontSize: 14,
    lineHeight: 22,
  },
  importModeToggle: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  batchDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  jsonInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    fontFamily: 'monospace',
    minHeight: 200,
    textAlignVertical: 'top',
  },
  batchResultCard: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  batchResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  formatGuide: {
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  formatGuideTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formatGuideText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});
