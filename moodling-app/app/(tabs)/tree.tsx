import { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { TreeScene } from '@/components/tree';
import { QuickLogsOverlay } from '@/components/QuickLogsOverlay';
import { WisdomOverlay } from '@/components/WisdomOverlay';
import { Colors } from '@/constants/Colors';

/**
 * Tree Tab - Mood Leaf Visual Home
 *
 * The tree is the emotional center of the app.
 * A living presence that:
 * - Is always subtly moving and breathing
 * - Responds to touch slowly and indirectly
 * - Grows gradually as the user uses the app
 * - Adapts to time of day and mood
 *
 * Touch is felt, not answered.
 * Silence is success.
 *
 * Features:
 * - Quick Log button (bottom left) - opens overlay for quick habit/med tracking
 * - Wisdom button (bottom right) - opens oblique strategies / inspirational quotes
 */
export default function TreeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Overlay states
  const [showQuickLogs, setShowQuickLogs] = useState(false);
  const [showWisdom, setShowWisdom] = useState(false);

  // Navigation handlers - delayed response happens in TreeScene
  const handleLeafPress = useCallback(() => {
    router.push('/(tabs)'); // Journal
  }, [router]);

  const handleSproutPress = useCallback(() => {
    router.push('/coach'); // AI chat
  }, [router]);

  const handleBranchPress = useCallback(() => {
    router.push('/(tabs)/settings'); // Quick logs / branches
  }, [router]);

  return (
    <View style={styles.container}>
      <TreeScene
        onLeafPress={handleLeafPress}
        onSproutPress={handleSproutPress}
        onBranchPress={handleBranchPress}
        mood="neutral"
      />

      {/* Floating action buttons - positioned above tree labels */}
      <View style={styles.floatingButtons} pointerEvents="box-none">
        {/* Fireflies Button - Bottom Left */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.card }]}
          onPress={() => setShowWisdom(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabEmoji}>✨</Text>
          <Text style={[styles.fabLabel, { color: colors.text }]}>Fireflies</Text>
        </TouchableOpacity>

        {/* Twigs Button - Bottom Right */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.card }]}
          onPress={() => setShowQuickLogs(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabEmoji}>🪵</Text>
          <Text style={[styles.fabLabel, { color: colors.text }]}>Twigs</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Logs Overlay */}
      <QuickLogsOverlay
        visible={showQuickLogs}
        onClose={() => setShowQuickLogs(false)}
      />

      {/* Wisdom Overlay */}
      <WisdomOverlay
        visible={showWisdom}
        onClose={() => setShowWisdom(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingButtons: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    gap: 6,
  },
  fabEmoji: {
    fontSize: 18,
  },
  fabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
