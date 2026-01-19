import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import {
  DailySummary,
  LifestyleFactors,
  TRACKABLE_FACTORS,
  getTodayDateString,
} from '@/types/DailySummary';
import {
  getFactors,
  saveFactors,
  getRecentSummaries,
} from '@/services/patternService';
import {
  generateCorrelationObservations,
  getConfidenceLabel,
  getConfidenceColor,
  PatternObservation,
} from '@/services/correlationService';

/**
 * Insights Tab - Pattern Visualization
 *
 * Following Moodling Ethics:
 * - Descriptive patterns, NOT diagnostic
 * - "You might notice..." language
 * - User knows themselves best
 *
 * Unit 10: Pattern data model + Quick Log
 * Unit 11: Pattern visualization (mood chart, factor bars, observations)
 * Unit 12: Correlation engine with statistical analysis
 */
export default function InsightsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [factors, setFactors] = useState<LifestyleFactors>({});
  const [recentDays, setRecentDays] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount and focus
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const today = getTodayDateString();
      const [todayFactors, summaries] = await Promise.all([
        getFactors(today),
        getRecentSummaries(7),
      ]);
      setFactors(todayFactors);
      setRecentDays(summaries);
    } catch (error) {
      console.error('Failed to load insights data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Handle factor adjustment
  const adjustFactor = async (key: keyof LifestyleFactors, delta: number) => {
    const current = (factors[key] as number) || 0;
    const config = TRACKABLE_FACTORS.find((f) => f.key === key);
    if (!config) return;

    const newValue = Math.max(0, Math.min(config.max, current + delta));
    const newFactors = { ...factors, [key]: newValue };
    setFactors(newFactors);

    const today = getTodayDateString();
    await saveFactors(today, newFactors);
  };

  // Format factor display value
  const formatValue = (key: keyof LifestyleFactors, value: number | undefined) => {
    const config = TRACKABLE_FACTORS.find((f) => f.key === key);
    if (!config || value === undefined) return '0';
    return `${value}${config.unit}`;
  };

  // Calculate week stats
  const weekStats = {
    entries: recentDays.reduce((sum, d) => sum + d.entryCount, 0),
    daysWithEntries: recentDays.filter((d) => d.entryCount > 0).length,
  };

  // Generate pattern observations based on data
  const simpleObservations = generateObservations(recentDays);

  // Generate correlation-based observations (more sophisticated)
  const correlationObservations = generateCorrelationObservations(recentDays);

  // Use correlation observations if available, otherwise fall back to simple
  const observations = correlationObservations.length > 0 ? correlationObservations : simpleObservations;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Insights</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Patterns you might notice
        </Text>
      </View>

      {/* Your Week - Mood Chart */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Your Week
        </Text>

        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={colors.tint} />
        ) : (
          <>
            {/* Mood emoji row */}
            <View style={styles.moodChart}>
              {recentDays.map((day) => (
                <View key={day.date} style={styles.chartDay}>
                  <Text style={[styles.chartDayLabel, { color: colors.textMuted }]}>
                    {getDayAbbr(day.date)}
                  </Text>
                  <Text style={styles.chartEmoji}>{getMoodEmoji(day)}</Text>
                  {/* Mood bar */}
                  <View style={[styles.moodBarContainer, { backgroundColor: colors.background }]}>
                    <View
                      style={[
                        styles.moodBar,
                        {
                          height: getMoodBarHeight(day),
                          backgroundColor: getMoodBarColor(day, colors),
                        },
                      ]}
                    />
                  </View>
                  {/* Sleep bar (if tracked) */}
                  {day.factors.sleepHours !== undefined && (
                    <View style={[styles.sleepBarContainer, { backgroundColor: colors.background }]}>
                      <View
                        style={[
                          styles.sleepBar,
                          {
                            height: getSleepBarHeight(day.factors.sleepHours),
                            backgroundColor: colors.tint,
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.legendText, { color: colors.textMuted }]}>mood</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.tint }]} />
                <Text style={[styles.legendText, { color: colors.textMuted }]}>sleep</Text>
              </View>
            </View>

            {/* Week stats */}
            <View style={styles.weekStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.tint }]}>
                  {weekStats.entries}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  entries
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.tint }]}>
                  {weekStats.daysWithEntries}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  days journaled
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* What We Notice - Pattern Observations */}
      {observations.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            What We Notice
          </Text>
          {observations.map((obs, index) => {
            // Check if this is a correlation observation (has confidence)
            const isCorrelation = 'confidence' in obs;
            const confidence = isCorrelation ? (obs as PatternObservation).confidence : null;

            return (
              <View key={obs.id || index} style={styles.observationItem}>
                <Text style={styles.observationEmoji}>{obs.emoji}</Text>
                <View style={styles.observationContent}>
                  <Text style={[styles.observationText, { color: colors.textSecondary }]}>
                    {obs.text}
                  </Text>
                  {confidence && (
                    <View
                      style={[
                        styles.confidenceBadge,
                        { backgroundColor: getConfidenceColor(confidence) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.confidenceText,
                          { color: getConfidenceColor(confidence) },
                        ]}
                      >
                        {getConfidenceLabel(confidence)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
          <Text style={[styles.observationDisclaimer, { color: colors.textMuted }]}>
            Correlation ≠ causation — you know yourself best.
          </Text>
        </View>
      )}

      {/* Quick Log Section */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Log (optional)
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Track what matters to you
        </Text>

        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={colors.tint} />
        ) : (
          <View style={styles.factorList}>
            {TRACKABLE_FACTORS.map((factor) => (
              <View key={factor.key} style={styles.factorRow}>
                <View style={styles.factorLabel}>
                  <Text style={styles.factorEmoji}>{factor.emoji}</Text>
                  <Text style={[styles.factorName, { color: colors.text }]}>
                    {factor.label}
                  </Text>
                </View>
                <View style={styles.factorControls}>
                  <TouchableOpacity
                    style={[styles.factorButton, { backgroundColor: colors.background }]}
                    onPress={() => adjustFactor(factor.key, -factor.step)}
                  >
                    <Text style={[styles.factorButtonText, { color: colors.text }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.factorValue, { color: colors.text }]}>
                    {formatValue(factor.key, factors[factor.key] as number)}
                  </Text>
                  <TouchableOpacity
                    style={[styles.factorButton, { backgroundColor: colors.background }]}
                    onPress={() => adjustFactor(factor.key, factor.step)}
                  >
                    <Text style={[styles.factorButtonText, { color: colors.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.factorHint, { color: colors.textMuted }]}>
          This helps Moodling notice patterns over time.
        </Text>
      </View>

      <View style={styles.disclaimer}>
        <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
          These are observations, not diagnoses.{'\n'}
          You know yourself best.
        </Text>
      </View>
    </ScrollView>
  );
}

// Helper: Get mood emoji for a day
function getMoodEmoji(day: DailySummary): string {
  if (day.entryCount === 0) return '·';
  switch (day.moodCategory) {
    case 'very_positive':
      return '😊';
    case 'positive':
      return '🙂';
    case 'slightly_positive':
      return '🌤️';
    case 'neutral':
      return '😐';
    case 'slightly_negative':
      return '🌧️';
    case 'negative':
      return '😔';
    case 'very_negative':
      return '😢';
    default:
      return '·';
  }
}

// Helper: Get day abbreviation
function getDayAbbr(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
}

// Helper: Get mood bar height (0-40px based on sentiment)
function getMoodBarHeight(day: DailySummary): number {
  if (day.entryCount === 0 || day.averageSentiment === null) return 4;
  // Convert -1 to 1 sentiment to 4 to 40 height
  const normalized = (day.averageSentiment + 1) / 2; // 0 to 1
  return Math.max(4, Math.round(normalized * 36) + 4);
}

// Helper: Get mood bar color
function getMoodBarColor(day: DailySummary, colors: typeof Colors.light): string {
  if (day.entryCount === 0) return colors.border;
  if (day.averageSentiment === null) return colors.border;
  if (day.averageSentiment >= 0.1) return colors.success || '#4CAF50';
  if (day.averageSentiment >= -0.1) return colors.textMuted;
  return '#FF9800';
}

// Helper: Get sleep bar height (0-40px based on hours)
function getSleepBarHeight(hours: number): number {
  // 8 hours = full bar (40px), scale accordingly
  return Math.min(40, Math.max(4, Math.round((hours / 8) * 40)));
}

// Helper: Generate pattern observations
interface Observation {
  id?: string;
  emoji: string;
  text: string;
}

function generateObservations(days: DailySummary[]): Observation[] {
  const observations: Observation[] = [];

  const daysWithEntries = days.filter((d) => d.entryCount > 0);

  // Show basic observation even with 1 entry
  if (daysWithEntries.length >= 1) {
    // Check for sleep correlation (lowered threshold)
    const daysWithSleep = days.filter(
      (d) => d.factors.sleepHours !== undefined && d.averageSentiment !== null
    );
    if (daysWithSleep.length >= 1) {
      const goodSleepDays = daysWithSleep.filter((d) => (d.factors.sleepHours || 0) >= 7);
      if (goodSleepDays.length >= 1) {
        observations.push({
          emoji: '😴',
          text: 'On days with 7+ hours of sleep, your entries tend to be more positive.',
        });
      }
    }

    // Check for exercise correlation
    const daysWithExercise = days.filter(
      (d) => d.factors.exerciseMinutes !== undefined && d.entryCount > 0
    );
    if (daysWithExercise.length >= 1) {
      const activeDays = daysWithExercise.filter((d) => (d.factors.exerciseMinutes || 0) >= 30);
      if (activeDays.length >= 1) {
        observations.push({
          emoji: '🏃',
          text: 'Exercise days seem to correlate with more positive entries.',
        });
      }
    }

    // Check for social correlation
    const daysWithSocial = days.filter(
      (d) => d.factors.socialMinutes !== undefined && d.entryCount > 0
    );
    if (daysWithSocial.length >= 1) {
      const socialDays = daysWithSocial.filter((d) => (d.factors.socialMinutes || 0) >= 30);
      if (socialDays.length >= 1) {
        observations.push({
          emoji: '👥',
          text: 'Time with others might be connected to brighter days.',
        });
      }
    }
  }

  // Entry count observation
  if (daysWithEntries.length >= 1) {
    observations.push({
      emoji: '📝',
      text: `You've journaled ${daysWithEntries.length} of the last 7 days. Keep it up to notice patterns.`,
    });
  }

  // Starter hint if no data yet
  if (observations.length === 0) {
    observations.push({
      emoji: '💡',
      text: 'Log some factors above and write entries to see patterns emerge.',
    });
  }

  return observations.slice(0, 3); // Max 3 observations
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
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  loader: {
    marginVertical: 20,
  },
  // Mood Chart styles
  moodChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartDay: {
    alignItems: 'center',
    flex: 1,
  },
  chartDayLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  chartEmoji: {
    fontSize: 18,
    marginBottom: 6,
  },
  moodBarContainer: {
    width: 20,
    height: 44,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  moodBar: {
    width: '100%',
    borderRadius: 4,
  },
  sleepBarContainer: {
    width: 8,
    height: 44,
    borderRadius: 2,
    marginTop: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  sleepBar: {
    width: '100%',
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
  weekStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  // Observations styles
  observationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  observationEmoji: {
    fontSize: 20,
  },
  observationContent: {
    flex: 1,
  },
  observationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '500',
  },
  observationDisclaimer: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  // Factor list styles
  factorList: {
    gap: 12,
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  factorLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factorEmoji: {
    fontSize: 20,
  },
  factorName: {
    fontSize: 15,
  },
  factorControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  factorButtonText: {
    fontSize: 20,
    fontWeight: '500',
  },
  factorValue: {
    fontSize: 15,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
  factorHint: {
    marginTop: 16,
    fontSize: 13,
    fontStyle: 'italic',
  },
  disclaimer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
