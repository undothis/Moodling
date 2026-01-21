/**
 * Games Index Screen
 *
 * Lists all available mindful games.
 *
 * Unit: Games System
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface GameItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  route: string;
  available: boolean;
}

const GAMES: GameItem[] = [
  {
    id: 'fidget_pad',
    name: 'Fidget Pad',
    emoji: '🔘',
    description: 'Digital fidget toys: bubble wrap, sliders, spinners',
    route: '/games/fidget',
    available: true,
  },
  {
    id: 'bubble_wrap',
    name: 'Bubble Wrap',
    emoji: '🔵',
    description: 'Endless bubble wrap to pop with haptic feedback',
    route: '/games/fidget',
    available: true,
  },
  {
    id: 'breathing_bubble',
    name: 'Breathing Bubble',
    emoji: '🫧',
    description: 'Pop bubbles by breathing at the right rhythm',
    route: '',
    available: false,
  },
  {
    id: 'color_sort',
    name: 'Color Sort',
    emoji: '🎨',
    description: 'Sort colored objects into matching buckets',
    route: '',
    available: false,
  },
  {
    id: 'zen_garden',
    name: 'Zen Garden',
    emoji: '🪨',
    description: 'Rake sand patterns, place stones, create calm',
    route: '',
    available: false,
  },
];

export default function GamesIndexScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleGamePress = (game: GameItem) => {
    if (game.available && game.route) {
      router.push(game.route as any);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>🎮</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Mindful Games
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Game List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Games designed to calm, ground, and build skills — not to addict.
        </Text>

        {GAMES.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={[
              styles.gameCard,
              { backgroundColor: colors.card },
              !game.available && styles.gameCardDisabled,
            ]}
            onPress={() => handleGamePress(game)}
            disabled={!game.available}
          >
            <Text style={styles.gameEmoji}>{game.emoji}</Text>
            <View style={styles.gameInfo}>
              <Text style={[styles.gameName, { color: colors.text }]}>
                {game.name}
              </Text>
              <Text style={[styles.gameDescription, { color: colors.textSecondary }]}>
                {game.description}
              </Text>
            </View>
            {game.available ? (
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            ) : (
              <Text style={[styles.comingSoon, { color: colors.textMuted }]}>
                Soon
              </Text>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            More games coming soon!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headerEmoji: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  gameCardDisabled: {
    opacity: 0.6,
  },
  gameEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  gameDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  comingSoon: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 13,
  },
});
