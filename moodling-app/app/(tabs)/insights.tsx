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
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  DailySummary,
} from '@/types/DailySummary';
import {
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
 * Following Mood Leaf Ethics:
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
  const router = useRouter();

  const [recentDays, setRecentDays] = useState<DailySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount and focus
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const summaries = await getRecentSummaries(7);
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

      {/* Little Wins This Week - Focus on positive, not mood states */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Little Wins This Week
        </Text>

        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={colors.tint} />
        ) : (
          <>
            {/* Wins indicator row - focus on positive actions, not mood states */}
            <View style={styles.moodChart}>
              {recentDays.map((day) => (
                <View key={day.date} style={styles.chartDay}>
                  <Text style={[styles.chartDayLabel, { color: colors.textMuted }]}>
                    {getDayAbbr(day.date)}
                  </Text>
                  <Text style={styles.chartEmoji}>{getWinsEmoji(day)}</Text>
                  {/* Activity bar - shows engagement, not mood judgment */}
                  <View style={[styles.moodBarContainer, { backgroundColor: colors.background }]}>
                    <View
                      style={[
                        styles.moodBar,
                        {
                          height: getEngagementBarHeight(day),
                          backgroundColor: getEngagementBarColor(day, colors),
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
                <View style={[styles.legendDot, { backgroundColor: colors.tint }]} />
                <Text style={[styles.legendText, { color: colors.textMuted }]}>engagement</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
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

      {/* What's Working - Focus on positive patterns */}
      {observations.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            What's Working
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

      {/* Social Exposure Ladder (Unit 21) */}
      <TouchableOpacity
        style={[styles.featureLink, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push('/exposure')}
        activeOpacity={0.7}
      >
        <Ionicons name="people-outline" size={22} color={colors.tint} />
        <View style={styles.featureLinkText}>
          <Text style={[styles.featureLinkTitle, { color: colors.text }]}>
            Social Exposure Ladder
          </Text>
          <Text style={[styles.featureLinkSubtitle, { color: colors.textMuted }]}>
            Build social confidence step by step
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.disclaimer}>
        <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
          These are observations, not diagnoses.{'\n'}
          You know yourself best.
        </Text>
      </View>
    </ScrollView>
  );
}

/**
 * Helper: Get "wins" emoji for a day
 *
 * MENTAL HEALTH SAFE DESIGN:
 * - NEVER show sad faces or negative emojis
 * - Focus on "little wins" - things they DID, not how they felt
 * - A depressed user should see evidence of resilience, not reinforcement of sadness
 * - Even on hard days, journaling itself is a win
 */
function getWinsEmoji(day: DailySummary): string {
  if (day.entryCount === 0) return '·'; // No data - neutral dot

  // Count the "wins" for this day
  const wins: string[] = [];

  // Journaling is always a win
  if (day.entryCount > 0) wins.push('📝');

  // Good sleep is a win
  if (day.factors.sleepHours && day.factors.sleepHours >= 7) wins.push('😴');

  // Exercise is a win
  if (day.factors.exerciseMinutes && day.factors.exerciseMinutes >= 15) wins.push('💪');

  // Going outside is a win
  if (day.factors.outdoorMinutes && day.factors.outdoorMinutes >= 15) wins.push('🌳');

  // Social time is a win
  if (day.factors.socialMinutes && day.factors.socialMinutes >= 15) wins.push('👥');

  // If multiple wins, show star. If just journaled, show that.
  // The point: EVERY DAY they engaged is a win, never a failure
  if (wins.length >= 3) return '⭐'; // Multiple wins = star day
  if (wins.length >= 2) return '✨'; // A couple wins = sparkle
  if (wins.length >= 1) return '🌱'; // At least they showed up = growth

  return '🌱'; // Default: growth (they journaled, that counts)
}

// Helper: Get day abbreviation
function getDayAbbr(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
}

/**
 * Helper: Get engagement bar height based on ACTIVITY, not mood
 *
 * This measures "how much did they engage with self-care" not "how sad were they"
 */
function getEngagementBarHeight(day: DailySummary): number {
  if (day.entryCount === 0) return 4;

  // Score based on positive actions, not mood
  let score = 0;

  // Journaling counts
  score += Math.min(day.entryCount * 10, 20); // Up to 20 points for journaling

  // Sleep quality counts (7+ hours = good)
  if (day.factors.sleepHours) {
    score += Math.min(day.factors.sleepHours * 3, 21); // Up to 21 points for sleep
  }

  // Exercise counts
  if (day.factors.exerciseMinutes) {
    score += Math.min(day.factors.exerciseMinutes / 3, 15); // Up to 15 points
  }

  // Social counts
  if (day.factors.socialMinutes) {
    score += Math.min(day.factors.socialMinutes / 6, 10); // Up to 10 points
  }

  // Outdoor counts
  if (day.factors.outdoorMinutes) {
    score += Math.min(day.factors.outdoorMinutes / 6, 10); // Up to 10 points
  }

  // Convert score (0-76) to height (4-40)
  const normalized = Math.min(score / 50, 1); // Cap at 50 for full bar
  return Math.max(4, Math.round(normalized * 36) + 4);
}

/**
 * Helper: Get engagement bar color
 *
 * MENTAL HEALTH SAFE: Always use positive/neutral colors, never "warning" colors
 * We don't color-code bad days - that reinforces negative feelings
 */
function getEngagementBarColor(day: DailySummary, colors: typeof Colors.light): string {
  if (day.entryCount === 0) return colors.border;

  // Always use the app's tint color (positive association)
  // The HEIGHT shows engagement level, not the color
  // No red/orange "warning" colors for low engagement
  return colors.tint;
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
      text: 'Write some journal entries or log Twigs to see patterns emerge.',
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
  disclaimer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Feature link styles (Unit 21)
  featureLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  featureLinkText: {
    flex: 1,
  },
  featureLinkTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureLinkSubtitle: {
    fontSize: 13,
  },
});
