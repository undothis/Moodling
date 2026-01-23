/**
 * Seeds Tab - Your Growing Insights
 *
 * Nature symbolism: Seeds represent insights that grow from patterns
 * noticed in your journey. They start small (emerging) and grow
 * stronger as more evidence accumulates.
 *
 * Seeds glow when new insights are discovered, inviting you to
 * explore what the patterns in your life are revealing.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  Insight,
  InsightCategory,
  InsightStrength,
  getInsights,
  getNewInsightCount,
  acknowledgeInsight,
  acknowledgeAllInsights,
  recordInsightReaction,
  runInsightAnalysis,
  getInsightSettings,
} from '@/services/insightService';
import {
  recordInsightFeedback,
  getAllFeedbackOptions,
  FeedbackType,
} from '@/services/insightFeedbackService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Nature-based category icons and colors
const CATEGORY_NATURE: Record<InsightCategory, { emoji: string; name: string; color: string }> = {
  correlation: { emoji: '🌿', name: 'Connections', color: '#4CAF50' },
  trigger: { emoji: '⚡', name: 'Triggers', color: '#FF9800' },
  recovery: { emoji: '🌸', name: 'Recovery', color: '#E91E63' },
  cycle: { emoji: '🌙', name: 'Cycles', color: '#9C27B0' },
  social: { emoji: '🌻', name: 'Social', color: '#FFEB3B' },
  activity: { emoji: '🌲', name: 'Activities', color: '#2196F3' },
  sleep: { emoji: '💤', name: 'Sleep', color: '#3F51B5' },
  time_of_day: { emoji: '🌅', name: 'Time Patterns', color: '#FF5722' },
  environment: { emoji: '🏔️', name: 'Environment', color: '#795548' },
  momentum: { emoji: '🌊', name: 'Momentum', color: '#00BCD4' },
  avoidance: { emoji: '🍂', name: 'Avoidance', color: '#FF5722' },
  self_talk: { emoji: '🦋', name: 'Self-Talk', color: '#673AB7' },
  body_mind: { emoji: '🌱', name: 'Body-Mind', color: '#8BC34A' },
  growth: { emoji: '🌳', name: 'Growth', color: '#4CAF50' },
  warning_sign: { emoji: '🍁', name: 'Early Signs', color: '#F44336' },
};

// Seed growth stages (visual representation of strength)
const STRENGTH_VISUALS: Record<InsightStrength, { emoji: string; label: string; size: number }> = {
  emerging: { emoji: '🌰', label: 'Sprouting', size: 28 },
  developing: { emoji: '🌱', label: 'Growing', size: 32 },
  established: { emoji: '🌿', label: 'Flourishing', size: 36 },
  strong: { emoji: '🌳', label: 'Rooted', size: 42 },
};

export default function SeedsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [insights, setInsights] = useState<Insight[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<InsightCategory | 'all'>('all');
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Animation for new seeds glow
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Start glow animation when there are new insights
  useEffect(() => {
    if (newCount > 0) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [newCount, glowAnim]);

  const loadData = useCallback(async () => {
    const [allInsights, count] = await Promise.all([
      getInsights(),
      getNewInsightCount(),
    ]);
    setInsights(allInsights);
    setNewCount(count);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAcknowledge = async (insight: Insight) => {
    await acknowledgeInsight(insight.id);
    await loadData();
  };

  const handleAcknowledgeAll = async () => {
    await acknowledgeAllInsights();
    await loadData();
  };

  const handleReaction = async (insightId: string, reaction: Insight['userReaction']) => {
    await recordInsightReaction(insightId, reaction);
    await loadData();
    setExpandedInsight(null);
  };

  const handleFeedback = async (insight: Insight, feedbackType: FeedbackType) => {
    await recordInsightFeedback(insight.description, feedbackType, {
      insightCategory: insight.category,
      daysSinceGenerated: Math.floor(
        (Date.now() - new Date(insight.firstDetected).getTime()) / (1000 * 60 * 60 * 24)
      ),
    });
    console.log('[Seeds] Recorded feedback:', feedbackType, 'for insight:', insight.title);
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await runInsightAnalysis();
      await loadData();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filter insights by category
  const filteredInsights = selectedCategory === 'all'
    ? insights
    : insights.filter(i => i.category === selectedCategory);

  // Separate new and acknowledged insights
  const newInsights = filteredInsights.filter(i => i.isNew);
  const acknowledgedInsights = filteredInsights.filter(i => !i.isNew);

  // Get unique categories from insights
  const activeCategories = [...new Set(insights.map(i => i.category))];

  // Glow color interpolation
  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(76, 175, 80, 0)', 'rgba(76, 175, 80, 0.3)'],
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
      }
    >
      {/* Header with nature theme */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>Seeds</Text>
          {newCount > 0 && (
            <Animated.View style={[styles.newBadge, { backgroundColor: glowColor }]}>
              <Text style={styles.newBadgeText}>{newCount} new</Text>
            </Animated.View>
          )}
        </View>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Patterns growing from your journey
        </Text>
      </View>

      {/* Garden Overview */}
      <View style={[styles.gardenCard, { backgroundColor: colors.card }]}>
        <View style={styles.gardenHeader}>
          <Text style={[styles.gardenTitle, { color: colors.text }]}>Your Insight Garden</Text>
          {newCount > 0 && (
            <TouchableOpacity
              style={[styles.acknowledgeAllButton, { backgroundColor: colors.tint + '20' }]}
              onPress={handleAcknowledgeAll}
            >
              <Text style={[styles.acknowledgeAllText, { color: colors.tint }]}>Mark all seen</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.gardenStats}>
          <View style={styles.gardenStat}>
            <Text style={styles.gardenStatEmoji}>🌳</Text>
            <Text style={[styles.gardenStatValue, { color: colors.tint }]}>
              {insights.filter(i => i.strength === 'strong').length}
            </Text>
            <Text style={[styles.gardenStatLabel, { color: colors.textMuted }]}>Rooted</Text>
          </View>
          <View style={styles.gardenStat}>
            <Text style={styles.gardenStatEmoji}>🌿</Text>
            <Text style={[styles.gardenStatValue, { color: colors.tint }]}>
              {insights.filter(i => i.strength === 'established').length}
            </Text>
            <Text style={[styles.gardenStatLabel, { color: colors.textMuted }]}>Growing</Text>
          </View>
          <View style={styles.gardenStat}>
            <Text style={styles.gardenStatEmoji}>🌱</Text>
            <Text style={[styles.gardenStatValue, { color: colors.tint }]}>
              {insights.filter(i => i.strength === 'developing' || i.strength === 'emerging').length}
            </Text>
            <Text style={[styles.gardenStatLabel, { color: colors.textMuted }]}>Sprouting</Text>
          </View>
        </View>

        <Text style={[styles.gardenDescription, { color: colors.textSecondary }]}>
          Seeds grow stronger as patterns repeat. The more you journal and track, the more insights bloom.
        </Text>
      </View>

      {/* Category Filter */}
      {activeCategories.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === 'all' ? colors.tint : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={styles.categoryEmoji}>🌍</Text>
            <Text style={[
              styles.categoryText,
              { color: selectedCategory === 'all' ? '#fff' : colors.text },
            ]}>
              All
            </Text>
          </TouchableOpacity>

          {activeCategories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === cat ? CATEGORY_NATURE[cat].color : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={styles.categoryEmoji}>{CATEGORY_NATURE[cat].emoji}</Text>
              <Text style={[
                styles.categoryText,
                { color: selectedCategory === cat ? '#fff' : colors.text },
              ]}>
                {CATEGORY_NATURE[cat].name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* New Seeds Section */}
      {newInsights.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              New Seeds
            </Text>
            <View style={[styles.newIndicator, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.newIndicatorText}>{newInsights.length}</Text>
            </View>
          </View>

          {newInsights.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              colors={colors}
              isNew={true}
              isExpanded={expandedInsight === insight.id}
              onPress={() => setExpandedInsight(
                expandedInsight === insight.id ? null : insight.id
              )}
              onAcknowledge={() => handleAcknowledge(insight)}
              onReaction={(reaction) => handleReaction(insight.id, reaction)}
              onFeedback={handleFeedback}
              glowAnim={glowAnim}
            />
          ))}
        </View>
      )}

      {/* Growing Seeds Section */}
      {acknowledgedInsights.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Growing Insights
          </Text>

          {acknowledgedInsights.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              colors={colors}
              isNew={false}
              isExpanded={expandedInsight === insight.id}
              onPress={() => setExpandedInsight(
                expandedInsight === insight.id ? null : insight.id
              )}
              onAcknowledge={() => {}}
              onReaction={(reaction) => handleReaction(insight.id, reaction)}
              onFeedback={handleFeedback}
            />
          ))}
        </View>
      )}

      {/* Empty State */}
      {insights.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Your Garden Awaits
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            Seeds of insight will grow here as you continue your journey.
            Keep journaling, tracking twigs, and chatting with your coach.
          </Text>

          <TouchableOpacity
            style={[styles.analyzeButton, { backgroundColor: colors.tint }]}
            onPress={handleRunAnalysis}
            disabled={isAnalyzing}
          >
            <Ionicons
              name={isAnalyzing ? "hourglass-outline" : "sparkles"}
              size={20}
              color="#fff"
            />
            <Text style={styles.analyzeButtonText}>
              {isAnalyzing ? 'Planting Seeds...' : 'Look for Patterns'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Manual Analysis Trigger (when has some insights) */}
      {insights.length > 0 && (
        <TouchableOpacity
          style={[styles.analyzeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleRunAnalysis}
          disabled={isAnalyzing}
        >
          <View style={styles.analyzeContent}>
            <Text style={styles.analyzeEmoji}>🔍</Text>
            <View>
              <Text style={[styles.analyzeTitle, { color: colors.text }]}>
                {isAnalyzing ? 'Analyzing patterns...' : 'Check for new patterns'}
              </Text>
              <Text style={[styles.analyzeSubtitle, { color: colors.textSecondary }]}>
                Scan recent activity for new insights
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* Nature-themed footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Like seeds in nature, insights take time to grow.{'\n'}
          Trust the process.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// Insight Card Component
interface InsightCardProps {
  insight: Insight;
  colors: typeof Colors.light;
  isNew: boolean;
  isExpanded: boolean;
  onPress: () => void;
  onAcknowledge: () => void;
  onReaction: (reaction: Insight['userReaction']) => void;
  onFeedback: (insight: Insight, feedbackType: FeedbackType) => void;
  glowAnim?: Animated.Value;
}

function InsightCard({
  insight,
  colors,
  isNew,
  isExpanded,
  onPress,
  onAcknowledge,
  onReaction,
  onFeedback,
  glowAnim,
}: InsightCardProps) {
  const [showFeedbackOptions, setShowFeedbackOptions] = useState(false);
  const categoryInfo = CATEGORY_NATURE[insight.category];
  const strengthInfo = STRENGTH_VISUALS[insight.strength];

  // Animated border for new insights
  const borderStyle = isNew && glowAnim ? {
    borderWidth: 2,
    borderColor: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(76, 175, 80, 0.3)', 'rgba(76, 175, 80, 0.8)'],
    }),
  } : {};

  const Container = isNew ? Animated.View : View;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Container
        style={[
          styles.insightCard,
          { backgroundColor: colors.card },
          borderStyle,
        ]}
      >
        {/* Header Row */}
        <View style={styles.insightHeader}>
          <View style={styles.insightIconContainer}>
            <Text style={[styles.insightIcon, { fontSize: strengthInfo.size }]}>
              {strengthInfo.emoji}
            </Text>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: categoryInfo.color + '30' },
              ]}
            >
              <Text style={styles.categoryBadgeEmoji}>{categoryInfo.emoji}</Text>
            </View>
          </View>

          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: colors.text }]}>
              {insight.title}
            </Text>
            <Text style={[styles.insightStrength, { color: categoryInfo.color }]}>
              {strengthInfo.label} • {insight.timesReinforced}x observed
            </Text>
          </View>

          {isNew && (
            <View style={[styles.newDot, { backgroundColor: '#4CAF50' }]} />
          )}
        </View>

        {/* Description */}
        <Text
          style={[styles.insightDescription, { color: colors.textSecondary }]}
          numberOfLines={isExpanded ? undefined : 2}
        >
          {insight.description}
        </Text>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Suggested Experiment */}
            {insight.suggestedExperiment && (
              <View style={[styles.experimentBox, { backgroundColor: colors.background }]}>
                <Text style={styles.experimentEmoji}>🧪</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.experimentLabel, { color: colors.textMuted }]}>
                    Try this experiment:
                  </Text>
                  <Text style={[styles.experimentText, { color: colors.text }]}>
                    {insight.suggestedExperiment}
                  </Text>
                </View>
              </View>
            )}

            {/* Confidence & Source */}
            <View style={styles.metaRow}>
              <View style={[styles.metaBadge, { backgroundColor: colors.background }]}>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {Math.round(insight.confidence * 100)}% confidence
                </Text>
              </View>
              <View style={[styles.metaBadge, { backgroundColor: colors.background }]}>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {insight.source === 'heuristic' ? 'Pattern match' : insight.source}
                </Text>
              </View>
            </View>

            {/* Reaction Buttons */}
            {!insight.userReaction && !showFeedbackOptions && (
              <View style={styles.reactionContainer}>
                <Text style={[styles.reactionPrompt, { color: colors.textMuted }]}>
                  Was this insight helpful?
                </Text>
                <View style={styles.reactionButtons}>
                  <TouchableOpacity
                    style={[styles.reactionButton, { backgroundColor: '#4CAF5020' }]}
                    onPress={() => onReaction('helpful')}
                  >
                    <Text style={{ color: '#4CAF50' }}>Helpful</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reactionButton, { backgroundColor: '#9C27B020' }]}
                    onPress={() => onReaction('surprising')}
                  >
                    <Text style={{ color: '#9C27B0' }}>Surprising</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reactionButton, { backgroundColor: '#60606020' }]}
                    onPress={() => onReaction('already_knew')}
                  >
                    <Text style={{ color: '#606060' }}>Already knew</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reactionButton, { backgroundColor: '#F4433620' }]}
                    onPress={() => setShowFeedbackOptions(true)}
                  >
                    <Text style={{ color: '#F44336' }}>Doesn't fit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Detailed Feedback Options */}
            {showFeedbackOptions && (
              <View style={styles.feedbackContainer}>
                <Text style={[styles.feedbackPrompt, { color: colors.text }]}>
                  Help us improve - what's off?
                </Text>
                <Text style={[styles.feedbackSubtext, { color: colors.textMuted }]}>
                  Your feedback improves future insights (anonymous)
                </Text>
                <View style={styles.feedbackOptions}>
                  {getAllFeedbackOptions().filter(opt => opt.type.startsWith('disagree')).map(option => (
                    <TouchableOpacity
                      key={option.type}
                      style={[styles.feedbackOption, { backgroundColor: colors.background }]}
                      onPress={() => {
                        onFeedback(insight, option.type);
                        setShowFeedbackOptions(false);
                        onReaction('not_applicable');
                      }}
                    >
                      <Text style={styles.feedbackOptionEmoji}>{option.emoji}</Text>
                      <Text style={[styles.feedbackOptionText, { color: colors.text }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[styles.feedbackCancel, { backgroundColor: colors.border }]}
                  onPress={() => setShowFeedbackOptions(false)}
                >
                  <Text style={[styles.feedbackCancelText, { color: colors.textMuted }]}>
                    Never mind
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {insight.userReaction && (
              <View style={[styles.reactionShown, { backgroundColor: colors.background }]}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={[styles.reactionShownText, { color: colors.textSecondary }]}>
                  You marked this as "{insight.userReaction.replace('_', ' ')}"
                </Text>
              </View>
            )}

            {/* Acknowledge button for new insights */}
            {isNew && (
              <TouchableOpacity
                style={[styles.acknowledgeButton, { backgroundColor: colors.tint }]}
                onPress={onAcknowledge}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.acknowledgeText}>Got it</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Expand indicator */}
        <View style={styles.expandIndicator}>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.textMuted}
          />
        </View>
      </Container>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  newBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },

  // Garden Overview
  gardenCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  gardenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  gardenTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  acknowledgeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  acknowledgeAllText: {
    fontSize: 13,
    fontWeight: '500',
  },
  gardenStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  gardenStat: {
    alignItems: 'center',
  },
  gardenStatEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  gardenStatValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  gardenStatLabel: {
    fontSize: 12,
  },
  gardenDescription: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Category Filter
  categoryScroll: {
    marginBottom: 20,
  },
  categoryContainer: {
    gap: 8,
    paddingRight: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  newIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Insight Card
  insightCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  insightIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  insightIcon: {
    fontSize: 32,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: -4,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadgeEmoji: {
    fontSize: 10,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  insightStrength: {
    fontSize: 12,
    fontWeight: '500',
  },
  newDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Expanded Content
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.15)',
  },
  experimentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 10,
  },
  experimentEmoji: {
    fontSize: 20,
  },
  experimentLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  experimentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 11,
  },

  // Reactions
  reactionContainer: {
    marginBottom: 12,
  },
  reactionPrompt: {
    fontSize: 12,
    marginBottom: 8,
  },
  reactionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  reactionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reactionShown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  reactionShownText: {
    fontSize: 12,
  },

  // Feedback
  feedbackContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
  },
  feedbackPrompt: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  feedbackSubtext: {
    fontSize: 12,
    marginBottom: 12,
  },
  feedbackOptions: {
    gap: 8,
    marginBottom: 12,
  },
  feedbackOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
  },
  feedbackOptionEmoji: {
    fontSize: 18,
  },
  feedbackOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  feedbackCancel: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  feedbackCancelText: {
    fontSize: 13,
  },

  // Acknowledge
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 10,
  },
  acknowledgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  expandIndicator: {
    alignItems: 'center',
    marginTop: 8,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Analyze Card
  analyzeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  analyzeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  analyzeEmoji: {
    fontSize: 24,
  },
  analyzeTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  analyzeSubtitle: {
    fontSize: 12,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
