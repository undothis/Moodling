/**
 * Training Status Indicator
 *
 * A persistent, unobtrusive indicator showing the AI training system status.
 * Displays in the corner of the app to show data collection is running.
 *
 * Visual states:
 * - Green pulsing dot: Active and healthy
 * - Yellow dot: Warnings need attention
 * - Red dot: Errors detected
 * - Gray dot: Inactive
 *
 * Tap to expand for more details.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  useColorScheme,
  Modal,
  ScrollView,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import {
  subscribeToStatus,
  refreshStatus,
  getActivityLog,
  formatTimeAgo,
  getStatusColor,
  getStatusText,
  TrainingStatus,
  ActivityLogEntry,
} from '@/services/trainingStatusService';

interface Props {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showLabel?: boolean;
  compact?: boolean;
}

export default function TrainingStatusIndicator({
  position = 'bottom-right',
  showLabel = true,
  compact = false,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [status, setStatus] = useState<TrainingStatus | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);

  // Pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Subscribe to status updates
    const unsubscribe = subscribeToStatus(setStatus);

    // Initial fetch
    refreshStatus();

    return () => {
      unsubscribe();
    };
  }, []);

  // Pulse animation for healthy status
  useEffect(() => {
    if (status?.health === 'healthy') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status?.health]);

  // Load activity log when expanded
  useEffect(() => {
    if (expanded) {
      getActivityLog(20).then(setActivityLog);
    }
  }, [expanded]);

  if (!status) {
    return null;
  }

  const statusColor = getStatusColor(status.health);
  const statusText = getStatusText(status);

  // Position styles
  const positionStyle = {
    'top-left': { top: 50, left: 16 },
    'top-right': { top: 50, right: 16 },
    'bottom-left': { bottom: 100, left: 16 },
    'bottom-right': { bottom: 100, right: 16 },
  }[position];

  if (compact) {
    return (
      <Pressable
        style={[styles.compactContainer, positionStyle]}
        onPress={() => setExpanded(true)}
      >
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: statusColor, transform: [{ scale: pulseAnim }] },
          ]}
        />
      </Pressable>
    );
  }

  return (
    <>
      {/* Floating indicator */}
      <Pressable
        style={[
          styles.container,
          positionStyle,
          { backgroundColor: colors.cardBackground },
        ]}
        onPress={() => setExpanded(true)}
      >
        <Animated.View
          style={[
            styles.dot,
            { backgroundColor: statusColor, transform: [{ scale: pulseAnim }] },
          ]}
        />
        {showLabel && (
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
              {statusText}
            </Text>
            <Text style={[styles.sublabel, { color: colors.textSecondary }]}>
              {status.stats.approvedInsights} insights
            </Text>
          </View>
        )}
      </Pressable>

      {/* Expanded modal */}
      <Modal visible={expanded} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setExpanded(false)}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.dotLarge, { backgroundColor: statusColor }]} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Training System
                </Text>
              </View>
              <Text style={[styles.modalStatus, { color: statusColor }]}>
                {status.health.toUpperCase()}
              </Text>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Stats */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.statNumber, { color: colors.tint }]}>
                    {status.stats.approvedInsights}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Approved
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.statNumber, { color: '#FF9800' }]}>
                    {status.stats.pendingInsights}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Pending
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>
                    {status.stats.conversationsScored}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Scored
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>
                    {status.stats.videosProcessed}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Videos
                  </Text>
                </View>
              </View>

              {/* Session info */}
              <View style={[styles.infoCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>This Session</Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Started: {formatTimeAgo(status.session.startedAt)}
                </Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Actions: {status.session.actionsThisSession}
                </Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  New insights: {status.session.insightsThisSession}
                </Text>
              </View>

              {/* Backup status */}
              <View style={[styles.infoCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>Data Protection</Text>
                <View style={styles.infoRow}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: status.backupStatus.isAutoBackupActive ? '#4CAF50' : '#9E9E9E' }
                  ]} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Auto-backup: {status.backupStatus.isAutoBackupActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Last backup: {formatTimeAgo(status.backupStatus.lastBackup)}
                </Text>
              </View>

              {/* Alerts */}
              {status.alerts.length > 0 && (
                <View style={[styles.alertsSection, { backgroundColor: colors.background }]}>
                  <Text style={[styles.infoTitle, { color: colors.text }]}>Alerts</Text>
                  {status.alerts.filter(a => !a.dismissed).map(alert => (
                    <View
                      key={alert.id}
                      style={[
                        styles.alertItem,
                        { backgroundColor: alert.type === 'error' ? '#F4433615' : '#FF980015' }
                      ]}
                    >
                      <Text style={{
                        color: alert.type === 'error' ? '#F44336' : '#FF9800',
                        fontSize: 13,
                      }}>
                        {alert.message}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Recent activity */}
              <View style={styles.activitySection}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>Recent Activity</Text>
                {activityLog.length === 0 ? (
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    No recent activity
                  </Text>
                ) : (
                  activityLog.slice(0, 10).map(entry => (
                    <View key={entry.id} style={styles.activityItem}>
                      <View style={[
                        styles.activityDot,
                        { backgroundColor: getActivityColor(entry.type) }
                      ]} />
                      <View style={styles.activityContent}>
                        <Text style={[styles.activityText, { color: colors.text }]} numberOfLines={1}>
                          {entry.message}
                        </Text>
                        <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                          {formatTimeAgo(entry.timestamp)}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>

            <Pressable
              style={[styles.closeButton, { backgroundColor: colors.tint }]}
              onPress={() => setExpanded(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function getActivityColor(type: ActivityLogEntry['type']): string {
  switch (type) {
    case 'insight_added':
    case 'insight_approved':
      return '#4CAF50';
    case 'insight_rejected':
      return '#F44336';
    case 'conversation_scored':
      return '#2196F3';
    case 'video_processed':
      return '#9C27B0';
    case 'model_trained':
    case 'model_deployed':
      return '#FF9800';
    case 'backup_completed':
      return '#00BCD4';
    case 'error':
      return '#F44336';
    default:
      return '#9E9E9E';
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  compactContainer: {
    position: 'absolute',
    padding: 8,
    zIndex: 1000,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotLarge: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  labelContainer: {
    marginLeft: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  sublabel: {
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalBody: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  infoCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertsSection: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  alertItem: {
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  activitySection: {
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 13,
  },
  activityTime: {
    fontSize: 11,
    marginTop: 2,
  },
  closeButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
