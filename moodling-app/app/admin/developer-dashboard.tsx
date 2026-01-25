/**
 * Developer Dashboard
 *
 * Comprehensive monitoring and diagnostics for developers.
 * Includes:
 * - Error rate trends
 * - Performance metrics
 * - Category distribution
 * - Coach data access patterns
 * - Real-time log feed
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import {
  getLogs,
  getLogStats,
  getCoachAccessSummary,
  subscribeToLogs,
  getCoachEfficiencySummary,
  getHumanScoreTrend,
  clearLogs,
  LogEntry,
  LogLevel,
  LogCategory,
} from '@/services/loggingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

// Level colors
const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '#9E9E9E',
  info: '#2196F3',
  warn: '#FF9800',
  error: '#F44336',
  fatal: '#B71C1C',
};

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  system: '#607D8B',
  coach: '#4CAF50',
  coach_access: '#8BC34A',
  services: '#2196F3',
  games: '#9C27B0',
  health: '#E91E63',
  storage: '#795548',
  network: '#00BCD4',
  ui: '#FF5722',
  navigation: '#3F51B5',
  diagnostic: '#FFC107',
  privacy: '#F44336',
  cadence: '#673AB7',
  cadence_facial: '#9575CD',
  cadence_voice: '#7E57C2',
  cadence_eye: '#5E35B1',
  cadence_session: '#512DA8',
  performance: '#FF9800',
};

interface TimeSeriesPoint {
  timestamp: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  totalCount: number;
}

interface PerformanceMetric {
  operation: string;
  avgDuration: number;
  maxDuration: number;
  count: number;
}

export default function DeveloperDashboard() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState(getLogStats());
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | 'all'>('1h');
  const [activeTab, setActiveTab] = useState<'errors' | 'performance' | 'categories' | 'coach' | 'quality'>('errors');

  // Load data
  const loadData = useCallback(async () => {
    const allLogs = getLogs();
    setLogs(allLogs);
    setStats(getLogStats());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToLogs(() => {
      // Debounce updates
      setTimeout(loadData, 500);
    });
    return unsubscribe;
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter logs by time range
  const getTimeFilteredLogs = useCallback(() => {
    const now = Date.now();
    const ranges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      'all': Infinity,
    };
    const cutoff = now - ranges[timeRange];
    return logs.filter(l => new Date(l.timestamp).getTime() > cutoff);
  }, [logs, timeRange]);

  const filteredLogs = useMemo(() => getTimeFilteredLogs(), [getTimeFilteredLogs]);

  // Calculate error rate time series (bucket by 5-minute intervals)
  const errorTimeSeries = useMemo((): TimeSeriesPoint[] => {
    if (filteredLogs.length === 0) return [];

    const bucketSize = 5 * 60 * 1000; // 5 minutes
    const buckets = new Map<number, TimeSeriesPoint>();

    for (const log of filteredLogs) {
      const ts = new Date(log.timestamp).getTime();
      const bucket = Math.floor(ts / bucketSize) * bucketSize;

      if (!buckets.has(bucket)) {
        buckets.set(bucket, {
          timestamp: bucket,
          errorCount: 0,
          warnCount: 0,
          infoCount: 0,
          totalCount: 0,
        });
      }

      const point = buckets.get(bucket)!;
      point.totalCount++;
      if (log.level === 'error' || log.level === 'fatal') point.errorCount++;
      else if (log.level === 'warn') point.warnCount++;
      else if (log.level === 'info') point.infoCount++;
    }

    return Array.from(buckets.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredLogs]);

  // Calculate performance metrics
  const performanceMetrics = useMemo((): PerformanceMetric[] => {
    const perfLogs = filteredLogs.filter(l => l.category === 'performance' && l.data?.durationMs);
    const byOperation = new Map<string, number[]>();

    for (const log of perfLogs) {
      const op = log.data?.operation || log.message;
      if (!byOperation.has(op)) byOperation.set(op, []);
      byOperation.get(op)!.push(log.data.durationMs);
    }

    return Array.from(byOperation.entries())
      .map(([operation, durations]) => ({
        operation,
        avgDuration: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        maxDuration: Math.max(...durations),
        count: durations.length,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);
  }, [filteredLogs]);

  // Calculate category distribution
  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of filteredLogs) {
      counts[log.category] = (counts[log.category] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [filteredLogs]);

  // Coach access summary
  const coachAccessData = useMemo(() => {
    const coachLogs = filteredLogs.filter(l => l.category === 'coach_access');
    const bySource: Record<string, { count: number; retrieved: number }> = {};

    for (const log of coachLogs) {
      const sourceId = log.data?.sourceId || 'unknown';
      if (!bySource[sourceId]) bySource[sourceId] = { count: 0, retrieved: 0 };
      bySource[sourceId].count++;
      if (log.data?.dataRetrieved) bySource[sourceId].retrieved++;
    }

    return Object.entries(bySource)
      .sort((a, b) => b[1].count - a[1].count);
  }, [filteredLogs]);

  // Coach efficiency metrics
  const coachEfficiency = useMemo(() => getCoachEfficiencySummary(), [filteredLogs]);

  // Human score trend
  const humanScoreTrend = useMemo(() => getHumanScoreTrend(), [filteredLogs]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const errors = filteredLogs.filter(l => l.level === 'error' || l.level === 'fatal').length;
    const warnings = filteredLogs.filter(l => l.level === 'warn').length;
    const total = filteredLogs.length;
    const errorRate = total > 0 ? ((errors / total) * 100).toFixed(1) : '0';

    return { errors, warnings, total, errorRate };
  }, [filteredLogs]);

  // Render mini bar chart
  const renderMiniBarChart = (value: number, max: number, color: string) => {
    const width = max > 0 ? (value / max) * 100 : 0;
    return (
      <View style={styles.miniBarContainer}>
        <View style={[styles.miniBar, { width: `${width}%`, backgroundColor: color }]} />
      </View>
    );
  };

  // Render time series sparkline
  const renderSparkline = (data: TimeSeriesPoint[], key: keyof TimeSeriesPoint, color: string) => {
    if (data.length < 2) return null;

    const values = data.map(d => d[key] as number);
    const max = Math.max(...values, 1);
    const height = 40;

    return (
      <View style={styles.sparklineContainer}>
        <View style={styles.sparkline}>
          {values.map((v, i) => {
            const barHeight = (v / max) * height;
            return (
              <View
                key={i}
                style={[
                  styles.sparklineBar,
                  {
                    height: Math.max(barHeight, 2),
                    backgroundColor: color,
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={styles.sparklineLabels}>
          <Text style={[styles.sparklineLabel, { color: colors.textSecondary }]}>
            {data.length > 0 ? new Date(data[0].timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
          <Text style={[styles.sparklineLabel, { color: colors.textSecondary }]}>
            {data.length > 0 ? new Date(data[data.length - 1].timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Developer Dashboard',
          headerShown: true,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Time Range Selector */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.timeRangeRow}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Time Range</Text>
            <View style={styles.timeButtons}>
              {(['1h', '6h', '24h', 'all'] as const).map((range) => (
                <TouchableOpacity
                  key={range}
                  style={[
                    styles.timeButton,
                    { backgroundColor: timeRange === range ? colors.tint : colors.border },
                  ]}
                  onPress={() => setTimeRange(range)}
                >
                  <Text style={[
                    styles.timeButtonText,
                    { color: timeRange === range ? '#fff' : colors.textSecondary },
                  ]}>
                    {range}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Quick Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: LEVEL_COLORS.error }]}>
                {summaryStats.errors}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Errors</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: LEVEL_COLORS.warn }]}>
                {summaryStats.warnings}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Warnings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {summaryStats.total}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Logs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.tint }]}>
                {summaryStats.errorRate}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Error Rate</Text>
            </View>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabRow}>
          {[
            { id: 'errors', label: 'Errors' },
            { id: 'performance', label: 'Perf' },
            { id: 'categories', label: 'Logs' },
            { id: 'coach', label: 'Access' },
            { id: 'quality', label: 'Quality' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === tab.id ? colors.tint : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setActiveTab(tab.id as typeof activeTab)}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === tab.id ? '#fff' : colors.textSecondary },
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Error Trends Tab */}
        {activeTab === 'errors' && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Error Rate Over Time</Text>
            {errorTimeSeries.length < 2 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Not enough data points. Collect more logs to see trends.
              </Text>
            ) : (
              <>
                {renderSparkline(errorTimeSeries, 'errorCount', LEVEL_COLORS.error)}
                <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>
                  Errors per 5-minute interval
                </Text>

                <View style={styles.divider} />

                {renderSparkline(errorTimeSeries, 'warnCount', LEVEL_COLORS.warn)}
                <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>
                  Warnings per 5-minute interval
                </Text>
              </>
            )}

            {/* Recent Errors List */}
            <Text style={[styles.subTitle, { color: colors.text, marginTop: 16 }]}>
              Recent Errors
            </Text>
            {filteredLogs
              .filter(l => l.level === 'error' || l.level === 'fatal')
              .slice(0, 5)
              .map((log) => (
                <View key={log.id} style={[styles.errorItem, { borderLeftColor: LEVEL_COLORS[log.level] }]}>
                  <Text style={[styles.errorTime, { color: colors.textSecondary }]}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </Text>
                  <Text style={[styles.errorMessage, { color: colors.text }]} numberOfLines={2}>
                    {log.message}
                  </Text>
                  <Text style={[styles.errorCategory, { color: colors.textSecondary }]}>
                    {log.category}
                  </Text>
                </View>
              ))}
          </View>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Slow Operations</Text>
            {performanceMetrics.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No performance data yet. Use measureAsync() or startTimer/endTimer to log timing.
              </Text>
            ) : (
              <View style={styles.perfList}>
                {performanceMetrics.map((metric, i) => (
                  <View key={i} style={styles.perfItem}>
                    <View style={styles.perfHeader}>
                      <Text style={[styles.perfOperation, { color: colors.text }]} numberOfLines={1}>
                        {metric.operation}
                      </Text>
                      <Text style={[styles.perfCount, { color: colors.textSecondary }]}>
                        {metric.count}x
                      </Text>
                    </View>
                    <View style={styles.perfMetrics}>
                      <View style={styles.perfMetric}>
                        <Text style={[styles.perfValue, { color: LEVEL_COLORS.info }]}>
                          {metric.avgDuration}ms
                        </Text>
                        <Text style={[styles.perfLabel, { color: colors.textSecondary }]}>avg</Text>
                      </View>
                      <View style={styles.perfMetric}>
                        <Text style={[styles.perfValue, { color: metric.maxDuration > 1000 ? LEVEL_COLORS.error : colors.text }]}>
                          {metric.maxDuration}ms
                        </Text>
                        <Text style={[styles.perfLabel, { color: colors.textSecondary }]}>max</Text>
                      </View>
                    </View>
                    {renderMiniBarChart(metric.avgDuration, Math.max(...performanceMetrics.map(m => m.avgDuration)), LEVEL_COLORS.info)}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Log Distribution by Category</Text>
            {categoryDistribution.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No logs in selected time range.
              </Text>
            ) : (
              <View style={styles.catList}>
                {categoryDistribution.map(([category, count]) => {
                  const max = categoryDistribution[0][1];
                  const color = CATEGORY_COLORS[category] || '#757575';
                  return (
                    <View key={category} style={styles.catItem}>
                      <View style={styles.catHeader}>
                        <View style={[styles.catDot, { backgroundColor: color }]} />
                        <Text style={[styles.catName, { color: colors.text }]}>
                          {category.replace(/_/g, ' ')}
                        </Text>
                        <Text style={[styles.catCount, { color: colors.textSecondary }]}>
                          {count}
                        </Text>
                      </View>
                      {renderMiniBarChart(count, max, color)}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Coach Access Tab */}
        {activeTab === 'coach' && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Coach Data Access Patterns</Text>
            {coachAccessData.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No coach access data. Start a conversation with your coach.
              </Text>
            ) : (
              <View style={styles.coachList}>
                {coachAccessData.map(([source, data]) => {
                  const max = coachAccessData[0][1].count;
                  const successRate = data.count > 0 ? Math.round((data.retrieved / data.count) * 100) : 0;
                  return (
                    <View key={source} style={styles.coachItem}>
                      <View style={styles.coachHeader}>
                        <Text style={[styles.coachSource, { color: colors.text }]}>
                          {source.replace(/_/g, ' ')}
                        </Text>
                        <Text style={[styles.coachStats, { color: colors.textSecondary }]}>
                          {data.count} requests • {successRate}% success
                        </Text>
                      </View>
                      {renderMiniBarChart(data.count, max, '#4CAF50')}
                    </View>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={[styles.linkButton, { backgroundColor: colors.tint }]}
              onPress={() => router.push('/admin/coach-activity')}
            >
              <Text style={styles.linkButtonText}>Open Live Activity Monitor</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quality Tab - Coach Efficiency & Humanness */}
        {activeTab === 'quality' && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Coach Quality Metrics</Text>

            {/* Efficiency Stats */}
            <View style={styles.qualitySection}>
              <Text style={[styles.subTitle, { color: colors.text }]}>Efficiency</Text>
              <View style={styles.qualityGrid}>
                <View style={styles.qualityItem}>
                  <Text style={[styles.qualityValue, { color: colors.tint }]}>
                    {coachEfficiency.avgResponseTime}ms
                  </Text>
                  <Text style={[styles.qualityLabel, { color: colors.textSecondary }]}>
                    Avg Response
                  </Text>
                </View>
                <View style={styles.qualityItem}>
                  <Text style={[styles.qualityValue, { color: colors.text }]}>
                    {coachEfficiency.avgTokens}
                  </Text>
                  <Text style={[styles.qualityLabel, { color: colors.textSecondary }]}>
                    Avg Tokens
                  </Text>
                </View>
                <View style={styles.qualityItem}>
                  <Text style={[
                    styles.qualityValue,
                    { color: coachEfficiency.successRate >= 95 ? '#4CAF50' : coachEfficiency.successRate >= 80 ? '#FF9800' : '#F44336' }
                  ]}>
                    {coachEfficiency.successRate}%
                  </Text>
                  <Text style={[styles.qualityLabel, { color: colors.textSecondary }]}>
                    Success Rate
                  </Text>
                </View>
                <View style={styles.qualityItem}>
                  <Text style={[styles.qualityValue, { color: colors.text }]}>
                    {coachEfficiency.avgDataUtilization}%
                  </Text>
                  <Text style={[styles.qualityLabel, { color: colors.textSecondary }]}>
                    Data Usage
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Human Score */}
            <View style={styles.qualitySection}>
              <View style={styles.humanScoreHeader}>
                <Text style={[styles.subTitle, { color: colors.text }]}>Human-ness Score</Text>
                <View style={[
                  styles.trendBadge,
                  {
                    backgroundColor: humanScoreTrend.trend === 'improving' ? '#4CAF5020' :
                                    humanScoreTrend.trend === 'declining' ? '#F4433620' : '#9E9E9E20',
                  }
                ]}>
                  <Text style={[
                    styles.trendText,
                    {
                      color: humanScoreTrend.trend === 'improving' ? '#4CAF50' :
                             humanScoreTrend.trend === 'declining' ? '#F44336' : '#9E9E9E',
                    }
                  ]}>
                    {humanScoreTrend.trend === 'improving' ? '↑ Improving' :
                     humanScoreTrend.trend === 'declining' ? '↓ Declining' : '→ Stable'}
                  </Text>
                </View>
              </View>

              {/* Big Score Display */}
              <View style={styles.bigScoreContainer}>
                <Text style={[
                  styles.bigScore,
                  {
                    color: humanScoreTrend.current >= 70 ? '#4CAF50' :
                           humanScoreTrend.current >= 50 ? '#FF9800' : '#F44336',
                  }
                ]}>
                  {humanScoreTrend.current || '—'}
                </Text>
                <Text style={[styles.bigScoreLabel, { color: colors.textSecondary }]}>
                  /100
                </Text>
              </View>

              {/* Factor Breakdown */}
              <Text style={[styles.factorTitle, { color: colors.text }]}>Factor Breakdown</Text>
              {[
                { key: 'empathy', label: 'Empathy', desc: 'Emotional acknowledgment' },
                { key: 'naturalFlow', label: 'Natural Flow', desc: 'Conversational style' },
                { key: 'variety', label: 'Variety', desc: 'Response diversity' },
                { key: 'personalization', label: 'Personal', desc: 'Uses user context' },
                { key: 'warmth', label: 'Warmth', desc: 'Warm vs clinical' },
              ].map((factor) => {
                const value = humanScoreTrend.factorAverages[factor.key as keyof typeof humanScoreTrend.factorAverages] || 0;
                return (
                  <View key={factor.key} style={styles.factorRow}>
                    <View style={styles.factorInfo}>
                      <Text style={[styles.factorLabel, { color: colors.text }]}>{factor.label}</Text>
                      <Text style={[styles.factorDesc, { color: colors.textSecondary }]}>{factor.desc}</Text>
                    </View>
                    <View style={styles.factorScoreContainer}>
                      <View style={styles.factorBarBg}>
                        <View
                          style={[
                            styles.factorBar,
                            {
                              width: `${value}%`,
                              backgroundColor: value >= 70 ? '#4CAF50' : value >= 50 ? '#FF9800' : '#F44336',
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.factorValue, { color: colors.text }]}>{value}</Text>
                    </View>
                  </View>
                );
              })}

              {/* Score History Sparkline */}
              {humanScoreTrend.history.length > 1 && (
                <View style={styles.historySection}>
                  <Text style={[styles.factorTitle, { color: colors.text, marginTop: 16 }]}>
                    Score History
                  </Text>
                  <View style={styles.historyChart}>
                    {humanScoreTrend.history.slice(-30).map((point, i) => {
                      const height = (point.score / 100) * 50;
                      return (
                        <View
                          key={i}
                          style={[
                            styles.historyBar,
                            {
                              height: Math.max(height, 2),
                              backgroundColor: point.score >= 70 ? '#4CAF50' :
                                              point.score >= 50 ? '#FF9800' : '#F44336',
                            },
                          ]}
                        />
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {coachEfficiency.totalResponses === 0 && (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No coach response data yet. Use logCoachResponse() to log metrics.
              </Text>
            )}
          </View>
        )}

        {/* Log Management */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Log Management</Text>
          <Text style={[styles.logManageText, { color: colors.textSecondary }]}>
            Total stored: {stats.totalLogs} logs
          </Text>
          <View style={styles.logManageButtons}>
            <TouchableOpacity
              style={[styles.logManageButton, { backgroundColor: '#FF9800' }]}
              onPress={async () => {
                // Prune logs older than 24 hours
                const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                const currentLogs = getLogs();
                const prunedLogs = currentLogs.filter(l => l.timestamp > cutoff);
                await AsyncStorage.setItem('moodleaf_logs', JSON.stringify(prunedLogs));
                loadData();
              }}
            >
              <Text style={styles.logManageButtonText}>Prune &gt;24h</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.logManageButton, { backgroundColor: '#F44336' }]}
              onPress={async () => {
                await clearLogs();
                loadData();
              }}
            >
              <Text style={styles.logManageButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Developer Note */}
        <View style={[styles.noteCard, { backgroundColor: colors.card }]}>
          <Text style={styles.noteIcon}>🔧</Text>
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            This dashboard shows app health metrics for developers. Use loggingService
            functions like measureAsync(), startTimer(), logCoachAccess(), and logCoachResponse() to collect data.
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
  card: {
    margin: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  timeRangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  timeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  sparklineContainer: {
    marginVertical: 8,
  },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    gap: 2,
  },
  sparklineBar: {
    flex: 1,
    minWidth: 3,
    borderRadius: 1,
  },
  sparklineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sparklineLabel: {
    fontSize: 10,
  },
  chartLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 12,
  },
  errorItem: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  errorTime: {
    fontSize: 10,
  },
  errorMessage: {
    fontSize: 13,
    marginTop: 2,
  },
  errorCategory: {
    fontSize: 10,
    marginTop: 2,
  },
  perfList: {
    gap: 12,
  },
  perfItem: {
    gap: 4,
  },
  perfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  perfOperation: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  perfCount: {
    fontSize: 11,
  },
  perfMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  perfMetric: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  perfValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  perfLabel: {
    fontSize: 10,
  },
  miniBarContainer: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniBar: {
    height: '100%',
    borderRadius: 2,
  },
  catList: {
    gap: 10,
  },
  catItem: {
    gap: 4,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catName: {
    flex: 1,
    fontSize: 13,
    textTransform: 'capitalize',
  },
  catCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  coachList: {
    gap: 12,
  },
  coachItem: {
    gap: 4,
  },
  coachHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coachSource: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  coachStats: {
    fontSize: 11,
  },
  linkButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noteCard: {
    margin: 16,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
  },
  noteIcon: {
    fontSize: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  // Quality tab styles
  qualitySection: {
    marginBottom: 8,
  },
  qualityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  qualityItem: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  qualityValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  qualityLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  humanScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bigScoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: 16,
  },
  bigScore: {
    fontSize: 56,
    fontWeight: '700',
  },
  bigScoreLabel: {
    fontSize: 18,
    marginLeft: 4,
  },
  factorTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  factorInfo: {
    width: 80,
  },
  factorLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  factorDesc: {
    fontSize: 9,
  },
  factorScoreContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factorBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  factorBar: {
    height: '100%',
    borderRadius: 4,
  },
  factorValue: {
    width: 28,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  historySection: {
    marginTop: 8,
  },
  historyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 50,
    gap: 2,
  },
  historyBar: {
    flex: 1,
    minWidth: 4,
    borderRadius: 2,
  },
  // Log management styles
  logManageText: {
    fontSize: 13,
    marginBottom: 12,
  },
  logManageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  logManageButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  logManageButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
