/**
 * Coach Activity Monitor (Developer Tool)
 *
 * Real-time visualization of what data the AI coach is accessing.
 * Shows a live feed and simple visualization of coach data access patterns.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import {
  subscribeToLogs,
  getCoachAccessAudits,
  getCoachAccessSummary,
  LogEntry,
  CoachAccessAudit,
} from '@/services/loggingService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Color mapping for different data sources
const SOURCE_COLORS: Record<string, string> = {
  profile: '#4CAF50',
  mood_patterns: '#2196F3',
  journal_entries: '#9C27B0',
  memory_tiers: '#FF9800',
  health_metrics: '#E91E63',
  calendar: '#00BCD4',
  cbt_progress: '#8BC34A',
  safeguards: '#F44336',
  core_principles: '#607D8B',
  default: '#757575',
};

interface ActivityEvent {
  id: string;
  sourceId: string;
  sourceName: string;
  timestamp: Date;
  dataRetrieved: boolean;
}

export default function CoachActivityMonitor() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [isLive, setIsLive] = useState(true);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [summary, setSummary] = useState<Record<string, { count: number; lastAccess: string }>>({});
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1m' | '5m' | '15m' | 'all'>('5m');

  // Load initial data
  useEffect(() => {
    const audits = getCoachAccessAudits(100);
    const initialEvents: ActivityEvent[] = audits.map((audit, i) => ({
      id: `initial_${i}`,
      sourceId: audit.sourceId,
      sourceName: audit.sourceName,
      timestamp: new Date(audit.timestamp),
      dataRetrieved: audit.dataRetrieved,
    }));
    setEvents(initialEvents);
    setSummary(getCoachAccessSummary());
  }, []);

  // Subscribe to real-time coach access logs
  useEffect(() => {
    if (!isLive) return;

    const unsubscribe = subscribeToLogs((entry: LogEntry) => {
      // Only process coach_access category logs
      if (entry.category !== 'coach_access') return;

      const newEvent: ActivityEvent = {
        id: entry.id,
        sourceId: entry.data?.sourceId || 'unknown',
        sourceName: entry.data?.sourceName || entry.message,
        timestamp: new Date(entry.timestamp),
        dataRetrieved: entry.data?.dataRetrieved ?? true,
      };

      setEvents(prev => {
        const updated = [...prev, newEvent];
        // Keep last 200 events
        return updated.slice(-200);
      });

      // Update summary
      setSummary(getCoachAccessSummary());
    });

    return unsubscribe;
  }, [isLive]);

  // Auto-scroll when new events arrive
  useEffect(() => {
    if (isLive && scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [events.length, isLive]);

  // Filter events by time range
  const getFilteredEvents = useCallback(() => {
    const now = Date.now();
    const ranges: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      'all': Infinity,
    };
    const cutoff = now - ranges[selectedTimeRange];

    return events.filter(e => e.timestamp.getTime() > cutoff);
  }, [events, selectedTimeRange]);

  const filteredEvents = getFilteredEvents();

  // Calculate bar chart data for summary
  const summaryEntries = Object.entries(summary)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8);
  const maxCount = Math.max(...summaryEntries.map(([_, v]) => v.count), 1);

  const getSourceColor = (sourceId: string) => {
    return SOURCE_COLORS[sourceId] || SOURCE_COLORS.default;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Coach Activity',
          headerShown: true,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Header Controls */}
        <View style={[styles.controlsCard, { backgroundColor: colors.card }]}>
          <View style={styles.liveToggle}>
            <TouchableOpacity
              style={[
                styles.liveButton,
                {
                  backgroundColor: isLive ? '#4CAF50' : colors.border,
                },
              ]}
              onPress={() => setIsLive(!isLive)}
            >
              <View style={[styles.liveDot, { backgroundColor: isLive ? '#fff' : colors.textSecondary }]} />
              <Text style={[styles.liveText, { color: isLive ? '#fff' : colors.textSecondary }]}>
                {isLive ? 'LIVE' : 'PAUSED'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeRangeButtons}>
            {(['1m', '5m', '15m', 'all'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.timeButton,
                  {
                    backgroundColor: selectedTimeRange === range ? colors.tint : colors.border,
                  },
                ]}
                onPress={() => setSelectedTimeRange(range)}
              >
                <Text style={[
                  styles.timeButtonText,
                  { color: selectedTimeRange === range ? '#fff' : colors.textSecondary },
                ]}>
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Bar Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Data Source Access Frequency
          </Text>

          {summaryEntries.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No coach activity recorded yet. Start a conversation with your coach.
            </Text>
          ) : (
            <View style={styles.barChart}>
              {summaryEntries.map(([sourceId, data]) => {
                const barWidth = (data.count / maxCount) * (SCREEN_WIDTH - 120);
                const color = getSourceColor(sourceId);

                return (
                  <View key={sourceId} style={styles.barRow}>
                    <Text
                      style={[styles.barLabel, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {sourceId.replace(/_/g, ' ')}
                    </Text>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          { width: Math.max(barWidth, 4), backgroundColor: color },
                        ]}
                      />
                      <Text style={[styles.barCount, { color: colors.text }]}>
                        {data.count}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Timeline Visualization */}
        <View style={[styles.timelineCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Access Timeline ({filteredEvents.length} events)
          </Text>

          {/* Simple timeline dots */}
          <View style={styles.timeline}>
            {filteredEvents.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No events in selected time range
              </Text>
            ) : (
              <View style={styles.timelineDots}>
                {filteredEvents.slice(-50).map((event, index) => (
                  <View
                    key={event.id}
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: getSourceColor(event.sourceId),
                        opacity: event.dataRetrieved ? 1 : 0.4,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {Object.entries(SOURCE_COLORS)
              .filter(([id]) => id !== 'default')
              .slice(0, 6)
              .map(([id, color]) => (
                <View key={id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                    {id.replace(/_/g, ' ')}
                  </Text>
                </View>
              ))}
          </View>
        </View>

        {/* Live Event Feed */}
        <View style={[styles.feedCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Live Feed
          </Text>

          <ScrollView
            ref={scrollViewRef}
            style={styles.feedScroll}
            nestedScrollEnabled
          >
            {filteredEvents.slice(-20).reverse().map((event) => (
              <View
                key={event.id}
                style={[
                  styles.feedItem,
                  { borderLeftColor: getSourceColor(event.sourceId) },
                ]}
              >
                <Text style={[styles.feedTime, { color: colors.textSecondary }]}>
                  {formatTime(event.timestamp)}
                </Text>
                <Text style={[styles.feedSource, { color: colors.text }]}>
                  {event.sourceName}
                </Text>
                <Text style={[
                  styles.feedStatus,
                  { color: event.dataRetrieved ? '#4CAF50' : '#F44336' },
                ]}>
                  {event.dataRetrieved ? '✓ Retrieved' : '✗ No data'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Developer Note */}
        <View style={[styles.noteCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.noteIcon]}>🔧</Text>
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            Developer Tool: This monitors what data sources your AI coach accesses
            during conversations. Use this to debug data access issues and verify
            that your privacy settings are working correctly.
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
  controlsCard: {
    margin: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeRangeButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  timeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartCard: {
    margin: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  barChart: {
    gap: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    width: 70,
    fontSize: 10,
    textTransform: 'capitalize',
  },
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    height: 16,
    borderRadius: 3,
    minWidth: 4,
  },
  barCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  timelineCard: {
    margin: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
  },
  timeline: {
    marginVertical: 12,
  },
  timelineDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  feedCard: {
    margin: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
  },
  feedScroll: {
    maxHeight: 200,
  },
  feedItem: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  feedTime: {
    fontSize: 10,
    fontWeight: '500',
  },
  feedSource: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  feedStatus: {
    fontSize: 11,
    marginTop: 2,
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
});
