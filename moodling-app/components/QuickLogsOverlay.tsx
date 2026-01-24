/**
 * Quick Logs Overlay
 *
 * Semi-transparent overlay that shows quick log buttons.
 * Tap a button to log, tap outside to dismiss.
 *
 * Design:
 * - Opens from bottom or center
 * - Blurred/dimmed background
 * - Quick log buttons in a grid
 * - Tap anywhere outside to close
 * - Visual feedback on tap (count badge, checkmark)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  useColorScheme,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import {
  QuickLog,
  LogStreak,
  getQuickLogs,
  getStreak,
  getTodayCount,
  logEntry,
  isCompletedToday,
} from '@/services/quickLogsService';
import {
  onTwigLogged,
  getLimitAlerts,
  LimitAlert,
  sendLimitAlertNotification,
} from '@/services/aiAccountabilityService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuickLogsOverlayProps {
  visible: boolean;
  onClose: () => void;
}

interface QuickLogWithStatus extends QuickLog {
  todayCount: number;
  isCompleted: boolean;
  streak: LogStreak | null;
  limitAlert?: LimitAlert; // If this twig has a limit configured
}

export function QuickLogsOverlay({ visible, onClose }: QuickLogsOverlayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [logs, setLogs] = useState<QuickLogWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [tappedId, setTappedId] = useState<string | null>(null);

  // Animation for slide up
  const slideAnim = useState(new Animated.Value(SCREEN_HEIGHT))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Load quick logs with status
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const quickLogs = await getQuickLogs();
      const limitAlerts = await getLimitAlerts();
      const logsWithStatus: QuickLogWithStatus[] = [];

      for (const log of quickLogs) {
        const todayCount = await getTodayCount(log.id);
        const isCompleted = await isCompletedToday(log.id);
        const streak = await getStreak(log.id);
        const limitAlert = limitAlerts.find(a => a.twigId === log.id && a.isActive);
        logsWithStatus.push({ ...log, todayCount, isCompleted, streak, limitAlert });
      }

      setLogs(logsWithStatus);
    } catch (error) {
      console.error('Failed to load quick logs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount and when visible
  useEffect(() => {
    if (visible) {
      loadLogs();
    }
  }, [visible, loadLogs]);

  // Animate in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  // Handle quick log tap
  const handleLogTap = async (log: QuickLogWithStatus) => {
    try {
      setTappedId(log.id);

      // Log the entry
      await logEntry(log.id);

      const newCount = log.todayCount + 1;

      // Update local state
      setLogs((prev) =>
        prev.map((l) =>
          l.id === log.id
            ? {
                ...l,
                todayCount: newCount,
                isCompleted: true,
              }
            : l
        )
      );

      // Check if this twig has a limit and show alert if needed
      if (log.limitAlert) {
        const result = await onTwigLogged(log.id);
        if (result?.shouldAlert && result.alertMessage) {
          // Determine alert style based on status
          const alertTitle = result.status === 'exceeded'
            ? `${log.emoji} Over Limit`
            : result.status === 'reached'
              ? `${log.emoji} Limit Reached`
              : `${log.emoji} Heads Up`;

          // Show in-app alert
          Alert.alert(alertTitle, result.alertMessage, [{ text: 'Got it' }]);

          // Also send notification for when app is backgrounded
          await sendLimitAlertNotification(
            log.name,
            newCount,
            log.limitAlert.maxLimit,
            result.status!
          );
        }
      }

      // Brief visual feedback
      setTimeout(() => setTappedId(null), 300);
    } catch (error) {
      console.error('Failed to log entry:', error);
      setTappedId(null);
    }
  };

  // Navigate to manage quick logs
  const handleManage = () => {
    onClose();
    router.push('/quick-logs/manage');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop - tap to close */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Content panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            backgroundColor: colors.background,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle bar */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Quick Log</Text>
          <TouchableOpacity onPress={handleManage}>
            <Text style={[styles.manageLink, { color: colors.tint }]}>
              Customize
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick log buttons grid */}
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Loading...
            </Text>
          </View>
        ) : logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No quick logs yet
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.tint }]}
              onPress={handleManage}
            >
              <Text style={styles.addButtonText}>Add your first</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {logs.map((log) => {
              // Determine badge color based on limit status
              const hasLimit = !!log.limitAlert;
              const limitReached = hasLimit && log.todayCount >= log.limitAlert!.maxLimit;
              const limitApproaching = hasLimit && log.todayCount >= Math.floor(log.limitAlert!.maxLimit * 0.75);
              const limitExceeded = hasLimit && log.todayCount > log.limitAlert!.maxLimit;

              const badgeColor = limitExceeded
                ? '#F44336' // Red for exceeded
                : limitReached
                  ? '#FF9800' // Orange for reached
                  : limitApproaching
                    ? '#FFC107' // Yellow for approaching
                    : colors.success; // Green for normal

              return (
                <TouchableOpacity
                  key={log.id}
                  style={[
                    styles.logButton,
                    {
                      backgroundColor: limitExceeded
                        ? '#F4433615'
                        : limitReached
                          ? '#FF980015'
                          : log.isCompleted
                            ? colors.success + '20'
                            : colors.card,
                      borderColor: limitExceeded
                        ? '#F44336'
                        : limitReached
                          ? '#FF9800'
                          : log.isCompleted
                            ? colors.success
                            : colors.border,
                    },
                    tappedId === log.id && styles.logButtonTapped,
                  ]}
                  onPress={() => handleLogTap(log)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.logEmoji}>{log.emoji}</Text>
                  <Text
                    style={[styles.logName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {log.name}
                  </Text>

                  {/* Show limit progress or simple count */}
                  {hasLimit ? (
                    <View
                      style={[
                        styles.limitBadge,
                        { backgroundColor: badgeColor },
                      ]}
                    >
                      <Text style={styles.limitText}>
                        {log.todayCount}/{log.limitAlert!.maxLimit}
                      </Text>
                    </View>
                  ) : log.todayCount > 0 ? (
                    <View
                      style={[
                        styles.countBadge,
                        { backgroundColor: colors.success },
                      ]}
                    >
                      <Text style={styles.countText}>
                        {log.todayCount}
                      </Text>
                    </View>
                  ) : null}

                  {log.streak && log.streak.currentStreak > 1 && (
                    <Text style={[styles.streakText, { color: colors.textMuted }]}>
                      {log.streak.currentStreak} day streak
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Bottom padding for safe area */}
        <View style={styles.bottomPadding} />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 300,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingHorizontal: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  manageLink: {
    fontSize: 15,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  logButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonTapped: {
    transform: [{ scale: 0.95 }],
  },
  logEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  logName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  countBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  limitBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 28,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  limitText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  streakText: {
    fontSize: 9,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    marginBottom: 16,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});
