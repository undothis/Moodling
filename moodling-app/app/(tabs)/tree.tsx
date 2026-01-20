import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { TreeScene } from '@/components/tree';

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
 */
export default function TreeScreen() {
  const router = useRouter();

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
