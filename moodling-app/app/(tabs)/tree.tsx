import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import TreeView from '@/components/TreeView';
import { getAllEntries } from '@/services/journalStorage';
import { quickLogsService } from '@/services/quickLogsService';

/**
 * Tree Tab - Mood Leaf Visual Home
 *
 * The tree metaphor made interactive:
 * - Tap Leaves → Journal (write entries)
 * - Tap Sprout → Chat with AI
 * - Tap Branches → Quick Logs / Habits
 * - Tap Weather → Health Insights
 *
 * Following Mood Leaf Philosophy:
 * - Organic, natural interface
 * - No pressure, no gamification
 * - The tree grows with you
 */
export default function TreeScreen() {
  const router = useRouter();

  // Track recent entries for leaf density
  const [recentLeafCount, setRecentLeafCount] = useState(3);

  // Track branch strength from quick logs consistency
  const [branchStrength, setBranchStrength] = useState(0.5);

  // Weather based on recent mood patterns (simplified for now)
  const [weather, setWeather] = useState<'sunny' | 'cloudy' | 'rainy' | 'neutral'>('neutral');

  // Trigger falling leaf animation after saving
  const [showFallingLeaf, setShowFallingLeaf] = useState(false);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      loadTreeData();
    }, [])
  );

  const loadTreeData = async () => {
    try {
      // Get recent entries for leaf count
      const entries = await getAllEntries();
      const recentCount = entries.filter(e => {
        const entryDate = new Date(e.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return entryDate > weekAgo;
      }).length;
      setRecentLeafCount(Math.max(1, Math.min(recentCount, 5)));

      // Calculate weather from recent moods
      if (entries.length > 0) {
        const recentEntries = entries.slice(0, 5);
        const avgScore = recentEntries.reduce((sum, e) => {
          return sum + (e.sentiment?.score ?? 0.5);
        }, 0) / recentEntries.length;

        if (avgScore > 0.65) setWeather('sunny');
        else if (avgScore > 0.45) setWeather('neutral');
        else if (avgScore > 0.3) setWeather('cloudy');
        else setWeather('rainy');
      }

      // Get branch strength from quick logs
      try {
        const logs = await quickLogsService.getAllQuickLogs();
        if (logs.length > 0) {
          // Calculate average streak consistency
          const avgStreak = logs.reduce((sum, log) => {
            const streak = log.stats?.currentStreak ?? 0;
            const maxStreak = log.stats?.longestStreak ?? 1;
            return sum + (maxStreak > 0 ? streak / maxStreak : 0);
          }, 0) / logs.length;
          setBranchStrength(Math.min(avgStreak, 1));
        }
      } catch {
        // Quick logs might not be set up yet
        setBranchStrength(0.3);
      }
    } catch (error) {
      console.error('Failed to load tree data:', error);
    }
  };

  // Navigation handlers - connect to existing screens
  const handleLeafPress = () => {
    router.push('/(tabs)');  // Go to journal tab
  };

  const handleSproutPress = () => {
    router.push('/coach');  // Go to AI chat
  };

  const handleBranchPress = () => {
    // For now, go to settings which has quick logs config
    // TODO: Create dedicated branches/quick logs screen
    router.push('/(tabs)/settings');
  };

  const handleWeatherPress = () => {
    router.push('/(tabs)/insights');  // Go to insights/health data
  };

  return (
    <View style={styles.container}>
      <TreeView
        onLeafPress={handleLeafPress}
        onSproutPress={handleSproutPress}
        onBranchPress={handleBranchPress}
        onWeatherPress={handleWeatherPress}
        weather={weather}
        branchStrength={branchStrength}
        recentLeafCount={recentLeafCount}
        showFallingLeaf={showFallingLeaf}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
