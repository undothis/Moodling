/**
 * Bubble Wrap
 *
 * Satisfying virtual bubble wrap popping experience.
 * Features haptic feedback and soothing pop sounds.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Vibration,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATS_KEY = 'mood_leaf_bubble_stats';

// Bubble colors
const BUBBLE_COLORS = {
  unpopped: ['#E8F4F8', '#D4E8F0', '#C0DCE8', '#ACd0E0'],
  popped: '#94A3B8',
  highlight: 'rgba(255, 255, 255, 0.6)',
};

interface Bubble {
  id: number;
  popped: boolean;
  color: string;
}

interface BubbleWrapProps {
  onClose?: () => void;
}

export default function BubbleWrap({ onClose }: BubbleWrapProps) {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Calculate grid
  const bubbleSize = 44;
  const gap = 4;
  const cols = Math.floor((screenWidth - 32) / (bubbleSize + gap));
  const rows = Math.floor((screenHeight - 200) / (bubbleSize + gap));
  const totalBubbles = cols * rows;

  // State
  const [bubbles, setBubbles] = useState<Bubble[]>(() =>
    Array.from({ length: totalBubbles }, (_, i) => ({
      id: i,
      popped: false,
      color: BUBBLE_COLORS.unpopped[Math.floor(Math.random() * BUBBLE_COLORS.unpopped.length)],
    }))
  );
  const [poppedCount, setPoppedCount] = useState(0);
  const [totalPopped, setTotalPopped] = useState(0);

  // Load stats on mount
  React.useEffect(() => {
    AsyncStorage.getItem(STATS_KEY).then((stored) => {
      if (stored) {
        const stats = JSON.parse(stored);
        setTotalPopped(stats.totalPopped || 0);
      }
    });
  }, []);

  // Save stats
  const saveStats = useCallback(async (newTotal: number) => {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify({ totalPopped: newTotal }));
  }, []);

  // Pop a bubble
  const popBubble = useCallback(
    (id: number) => {
      setBubbles((prev) => {
        const bubble = prev.find((b) => b.id === id);
        if (!bubble || bubble.popped) return prev;

        // Haptic feedback
        if (Platform.OS !== 'web') {
          Vibration.vibrate(15);
        }

        setPoppedCount((c) => c + 1);
        setTotalPopped((t) => {
          const newTotal = t + 1;
          saveStats(newTotal);
          return newTotal;
        });

        return prev.map((b) => (b.id === id ? { ...b, popped: true } : b));
      });
    },
    [saveStats]
  );

  // Reset bubbles
  const resetBubbles = useCallback(() => {
    setBubbles(
      Array.from({ length: totalBubbles }, (_, i) => ({
        id: i,
        popped: false,
        color: BUBBLE_COLORS.unpopped[Math.floor(Math.random() * BUBBLE_COLORS.unpopped.length)],
      }))
    );
    setPoppedCount(0);
  }, [totalBubbles]);

  // Pop all remaining
  const popAll = useCallback(() => {
    const unpopped = bubbles.filter((b) => !b.popped);
    if (unpopped.length === 0) return;

    // Rapid haptic
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 20, 30, 20, 30, 20, 30, 20]);
    }

    setBubbles((prev) => prev.map((b) => ({ ...b, popped: true })));
    setTotalPopped((t) => {
      const newTotal = t + unpopped.length;
      saveStats(newTotal);
      return newTotal;
    });
    setPoppedCount(totalBubbles);
  }, [bubbles, totalBubbles, saveStats]);

  const progress = (poppedCount / totalBubbles) * 100;
  const allPopped = poppedCount === totalBubbles;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Bubble Wrap</Text>
          <Text style={styles.subtitle}>Pop to relax</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{poppedCount}</Text>
          <Text style={styles.statLabel}>Popped</Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalPopped}</Text>
          <Text style={styles.statLabel}>All Time</Text>
        </View>
      </View>

      {/* Bubble grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.bubbleContainer}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.bubbleGrid,
            { width: cols * (bubbleSize + gap), maxWidth: screenWidth - 32 },
          ]}
        >
          {bubbles.map((bubble) => (
            <TouchableOpacity
              key={bubble.id}
              style={[
                styles.bubble,
                {
                  width: bubbleSize,
                  height: bubbleSize,
                  backgroundColor: bubble.popped ? BUBBLE_COLORS.popped : bubble.color,
                },
                bubble.popped && styles.bubblePopped,
              ]}
              onPress={() => popBubble(bubble.id)}
              activeOpacity={0.7}
              disabled={bubble.popped}
            >
              {!bubble.popped && (
                <>
                  <View style={styles.bubbleHighlight} />
                  <View style={styles.bubbleShine} />
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.resetButton]}
          onPress={resetBubbles}
        >
          <Ionicons name="refresh" size={20} color="#64748B" />
          <Text style={styles.resetText}>New Sheet</Text>
        </TouchableOpacity>

        {!allPopped && (
          <TouchableOpacity
            style={[styles.actionButton, styles.popAllButton]}
            onPress={popAll}
          >
            <Text style={styles.popAllText}>Pop All!</Text>
          </TouchableOpacity>
        )}

        {allPopped && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.completedText}>All Done!</Text>
          </View>
        )}
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipText}>
          💡 Tip: Focus on one bubble at a time for a meditative experience
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  bubbleContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  bubbleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  bubble: {
    margin: 2,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  bubblePopped: {
    transform: [{ scale: 0.85 }],
    shadowOpacity: 0,
    elevation: 0,
  },
  bubbleHighlight: {
    position: 'absolute',
    width: '40%',
    height: '40%',
    top: '15%',
    left: '20%',
    backgroundColor: BUBBLE_COLORS.highlight,
    borderRadius: 100,
  },
  bubbleShine: {
    position: 'absolute',
    width: '15%',
    height: '15%',
    top: '25%',
    left: '55%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 100,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 8,
  },
  resetButton: {
    backgroundColor: '#F1F5F9',
  },
  resetText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 6,
    fontWeight: '600',
  },
  popAllButton: {
    backgroundColor: '#3B82F6',
  },
  popAllText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  completedText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 8,
  },
  tipsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FEF9C3',
  },
  tipText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
});
