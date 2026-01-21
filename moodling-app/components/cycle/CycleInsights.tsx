/**
 * Cycle Insights Component
 *
 * Displays personalized insights from correlation analysis:
 * - What helps reduce symptoms
 * - What tends to worsen symptoms
 * - Cycle-specific suggestions
 *
 * Only shows insights once user has tracked 2+ complete cycles.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { PersonalizedInsight } from '../../types/PeriodCorrelation';
import {
  getCurrentInsights,
  getCycleSuggestions,
  getCorrelationStats,
} from '../../services/periodCorrelationService';

// ============================================
// TYPES
// ============================================

interface CycleInsightsProps {
  daysUntilPeriod?: number | null;
  currentPhase?: string | null;
  onLogPress?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function CycleInsights({
  daysUntilPeriod,
  currentPhase,
  onLogPress,
}: CycleInsightsProps) {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<PersonalizedInsight[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [cyclesTracked, setCyclesTracked] = useState(0);
  const [canShowInsights, setCanShowInsights] = useState(false);
  const [nextMilestone, setNextMilestone] = useState<string | null>(null);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, [daysUntilPeriod, currentPhase]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const result = await getCurrentInsights();
      setInsights(result.insights);
      setCyclesTracked(result.cyclesTracked);
      setCanShowInsights(result.canShowInsights);
      setNextMilestone(result.nextMilestone);

      if (result.canShowInsights && daysUntilPeriod !== undefined) {
        const cycleSuggestions = await getCycleSuggestions(
          daysUntilPeriod,
          currentPhase || null
        );
        setSuggestions(cycleSuggestions);
      }
    } catch (error) {
      console.error('[CycleInsights] Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER: Loading State
  // ============================================

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#8b7cf7" />
          <Text style={styles.loadingText}>Analyzing patterns...</Text>
        </View>
      </View>
    );
  }

  // ============================================
  // RENDER: Not Enough Data
  // ============================================

  if (!canShowInsights) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Cycle Insights</Text>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>Building Your Patterns</Text>
          <Text style={styles.emptyText}>
            Keep logging food, sleep, and symptoms to discover what affects your cycle.
          </Text>
          {nextMilestone && (
            <Text style={styles.milestoneText}>{nextMilestone}</Text>
          )}

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, (cyclesTracked / 4) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {cyclesTracked} / 4 cycles tracked
            </Text>
          </View>

          {onLogPress && (
            <TouchableOpacity style={styles.logButton} onPress={onLogPress}>
              <Text style={styles.logButtonText}>Log Today</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ============================================
  // RENDER: Insights Available
  // ============================================

  const positiveInsights = insights.filter((i) => i.type === 'positive');
  const warningInsights = insights.filter((i) => i.type === 'warning');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Cycle Insights</Text>
        <Text style={styles.subtitle}>
          Based on {cyclesTracked} cycles of data
        </Text>
      </View>

      {/* Current Cycle Suggestions */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsCard}>
          <Text style={styles.suggestionsTitle}>
            🎯 This Cycle Suggestions
          </Text>
          {suggestions.map((suggestion, index) => (
            <Text key={index} style={styles.suggestionText}>
              {suggestion}
            </Text>
          ))}
        </View>
      )}

      {/* What Helps */}
      {positiveInsights.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💚 What Helps You</Text>
          {positiveInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              isExpanded={expandedInsight === insight.id}
              onPress={() =>
                setExpandedInsight(
                  expandedInsight === insight.id ? null : insight.id
                )
              }
            />
          ))}
        </View>
      )}

      {/* What to Watch */}
      {warningInsights.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ What to Watch</Text>
          {warningInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              isExpanded={expandedInsight === insight.id}
              onPress={() =>
                setExpandedInsight(
                  expandedInsight === insight.id ? null : insight.id
                )
              }
            />
          ))}
        </View>
      )}

      {/* No Insights Yet */}
      {insights.length === 0 && (
        <View style={styles.noInsightsCard}>
          <Text style={styles.noInsightsText}>
            Keep logging to discover more patterns! Try tracking food, sleep, and symptoms consistently.
          </Text>
        </View>
      )}

      {/* Next Milestone */}
      {nextMilestone && (
        <View style={styles.milestoneCard}>
          <Text style={styles.milestoneIcon}>🏆</Text>
          <Text style={styles.milestoneCardText}>{nextMilestone}</Text>
        </View>
      )}

      {/* Log Button */}
      {onLogPress && (
        <TouchableOpacity style={styles.logButton} onPress={onLogPress}>
          <Text style={styles.logButtonText}>Log Today</Text>
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          All insights are personal to YOU, based on YOUR data 🔒
        </Text>
      </View>
    </ScrollView>
  );
}

// ============================================
// INSIGHT CARD COMPONENT
// ============================================

function InsightCard({
  insight,
  isExpanded,
  onPress,
}: {
  insight: PersonalizedInsight;
  isExpanded: boolean;
  onPress: () => void;
}) {
  const confidencePercent = Math.round(insight.confidence * 100);

  return (
    <TouchableOpacity
      style={[
        styles.insightCard,
        insight.type === 'positive' && styles.insightCardPositive,
        insight.type === 'warning' && styles.insightCardWarning,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.insightHeader}>
        <Text style={styles.insightTitle}>{insight.title}</Text>
        <Text style={styles.insightConfidence}>{confidencePercent}%</Text>
      </View>

      <Text style={styles.insightMessage}>{insight.message}</Text>

      {isExpanded && (
        <View style={styles.insightDetails}>
          {insight.actionable && (
            <View style={styles.actionableContainer}>
              <Text style={styles.actionableLabel}>Suggestion:</Text>
              <Text style={styles.actionableText}>{insight.actionable}</Text>
            </View>
          )}

          <Text style={styles.basedOnText}>Based on: {insight.basedOn}</Text>
        </View>
      )}

      <Text style={styles.expandHint}>
        {isExpanded ? 'Tap to collapse' : 'Tap for details'}
      </Text>
    </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  milestoneText: {
    fontSize: 14,
    color: '#8b7cf7',
    marginTop: 16,
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    marginTop: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2a2a4a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b7cf7',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  suggestionsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#2a3a5a',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8b7cf7',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 8,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  insightCard: {
    backgroundColor: '#2a2a4a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#666',
  },
  insightCardPositive: {
    borderLeftColor: '#4ade80',
    backgroundColor: '#1a2a2a',
  },
  insightCardWarning: {
    borderLeftColor: '#fbbf24',
    backgroundColor: '#2a2a1a',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  insightConfidence: {
    fontSize: 12,
    color: '#8b7cf7',
    fontWeight: '500',
    backgroundColor: '#3a3a5a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  insightMessage: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  insightDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3a3a5a',
  },
  actionableContainer: {
    marginBottom: 8,
  },
  actionableLabel: {
    fontSize: 12,
    color: '#8b7cf7',
    fontWeight: '500',
    marginBottom: 4,
  },
  actionableText: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  basedOnText: {
    fontSize: 12,
    color: '#666',
  },
  expandHint: {
    fontSize: 11,
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
  },
  noInsightsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#2a2a4a',
    borderRadius: 12,
  },
  noInsightsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    backgroundColor: '#2a2a4a',
    borderRadius: 12,
  },
  milestoneIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  milestoneCardText: {
    fontSize: 14,
    color: '#aaa',
    flex: 1,
  },
  logButton: {
    backgroundColor: '#8b7cf7',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default CycleInsights;
