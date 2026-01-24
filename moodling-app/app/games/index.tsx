/**
 * Games Index Screen
 *
 * Comprehensive therapeutic games organized by category.
 * Categories: Focus, Grounding, Relaxation, Knowledge, Wisdom, Logic
 *
 * All games have retro pixel aesthetic and are designed for wellness,
 * not addiction or competition.
 *
 * Unit: Games System
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  GameCategory,
  GameDefinition,
  GameProgress,
  GameStats,
  CATEGORY_INFO,
  ALL_GAMES,
  FOCUS_GAMES,
  GROUNDING_GAMES,
  RELAXATION_GAMES,
  KNOWLEDGE_GAMES,
  WISDOM_GAMES,
  LOGIC_THERAPEUTIC_GAMES,
  LOGIC_CLASSIC_GAMES,
  getGameProgress,
  getGameStats,
  formatDuration,
} from '@/services/gamesService';

// Map of game IDs to their routes (existing games)
const EXISTING_GAME_ROUTES: Record<string, string> = {
  'fidget': '/games/fidget',
  'bubble_wrap': '/games/bubble-wrap',
  'breathing_orb': '/games/breathing-orb',
  'memory_match': '/games/memory-match',
  'rain_window': '/games/rain-on-window',
  'kinetic_sand': '/games/kinetic-sand',
  'water_ripples': '/games/water-ripples',
  'kaleidoscope': '/games/kaleidoscope',
  'sand_flow': '/games/sand-flow',
  'untangle': '/games/untangle',
  'maze_walker': '/games/maze-walker',
  'snake': '/games/snake',
  'pong': '/games/pong',
  '2048': '/games/2048',
  'frogger': '/games/frogger',
  'breakout': '/games/breakout',
  'space_invaders': '/games/space-invaders',
  'asteroids': '/games/asteroids',
};

// Check if a game is implemented
function isGameImplemented(gameId: string): boolean {
  // These new therapeutic games will be implemented
  const implementedNewGames = [
    'pixel_hunt', 'pattern_lock', 'word_stream', 'color_sort',
    '54321_quest', 'body_map', 'earth_touch', 'anchor_drop',
    'breath_waves', 'cloud_garden', 'rain_window', 'star_connect',
    'emotion_explorer', 'coping_cards', 'thought_bubbles', 'body_signals',
    'perspective_shift', 'future_self', 'values_quest', 'the_pause',
    'thought_maze', 'chain_reaction', 'odd_one_out', 'logic_gates',
    'sequence_builder', 'balance_scale', 'path_finder', 'pattern_breaker',
    'reframe_puzzle', 'what_comes_next',
    'pixel_sudoku', 'nonogram', 'minesweeper_zen', 'tower_of_hanoi',
  ];
  return EXISTING_GAME_ROUTES[gameId] !== undefined || implementedNewGames.includes(gameId);
}

// Get route for a game
function getGameRoute(gameId: string): string {
  if (EXISTING_GAME_ROUTES[gameId]) {
    return EXISTING_GAME_ROUTES[gameId];
  }
  // New games use consistent routing
  return `/games/${gameId.replace(/_/g, '-')}`;
}

export default function GamesIndexScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    focus: true,
    grounding: false,
    relaxation: false,
    knowledge: false,
    wisdom: false,
    logic_therapeutic: false,
    logic_classic: false,
  });

  const [progress, setProgress] = useState<Record<string, GameProgress>>({});
  const [stats, setStats] = useState<GameStats | null>(null);

  // Load progress and stats
  const loadData = useCallback(async () => {
    try {
      const [loadedProgress, loadedStats] = await Promise.all([
        getGameProgress(),
        getGameStats(),
      ]);
      setProgress(loadedProgress);
      setStats(loadedStats);
    } catch (error) {
      console.error('Error loading game data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Handle game press
  const handleGamePress = (game: GameDefinition) => {
    const route = getGameRoute(game.id);
    router.push(route as any);
  };

  // Render a game card
  const renderGameCard = (game: GameDefinition) => {
    const gameProgress = progress[game.id];
    const implemented = isGameImplemented(game.id);

    return (
      <TouchableOpacity
        key={game.id}
        style={[
          styles.gameCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          !implemented && styles.gameCardDisabled,
        ]}
        onPress={() => handleGamePress(game)}
        disabled={!implemented}
      >
        <View style={styles.gameContent}>
          <Text style={[styles.gameName, { color: colors.text }]}>
            {game.name}
          </Text>
          <Text style={[styles.gameDescription, { color: colors.textSecondary }]}>
            {game.description}
          </Text>
          <View style={styles.gameMeta}>
            <View style={[styles.metaBadge, { backgroundColor: colors.border }]}>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                ~{game.estimatedMinutes}min
              </Text>
            </View>
            <View style={[styles.metaBadge, { backgroundColor: colors.border }]}>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {game.difficulty}
              </Text>
            </View>
            {gameProgress?.timesPlayed > 0 && (
              <View style={[styles.metaBadge, { backgroundColor: colors.tint + '30' }]}>
                <Text style={[styles.metaText, { color: colors.tint }]}>
                  {gameProgress.timesPlayed}x played
                </Text>
              </View>
            )}
          </View>
        </View>
        {implemented ? (
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        ) : (
          <Text style={[styles.comingSoon, { color: colors.textMuted }]}>Soon</Text>
        )}
      </TouchableOpacity>
    );
  };

  // Render a category section
  const renderCategory = (
    category: GameCategory,
    games: GameDefinition[]
  ) => {
    const info = CATEGORY_INFO[category];
    const isExpanded = expandedCategories[category];
    const playedCount = games.filter(g => progress[g.id]?.timesPlayed > 0).length;

    return (
      <View key={category} style={[styles.categorySection, { backgroundColor: colors.card }]}>
        <Pressable
          style={styles.categoryHeader}
          onPress={() => toggleCategory(category)}
        >
          <Text style={styles.categoryEmoji}>{info.emoji}</Text>
          <View style={styles.categoryInfo}>
            <Text style={[styles.categoryTitle, { color: colors.text }]}>
              {info.label}
            </Text>
            <Text style={[styles.categorySubtitle, { color: colors.textSecondary }]}>
              {info.description} ({playedCount}/{games.length} played)
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={20}
            color={colors.textMuted}
          />
        </Pressable>

        {isExpanded && (
          <View style={[styles.gamesContainer, { borderTopColor: colors.border }]}>
            {games.map(renderGameCard)}
          </View>
        )}
      </View>
    );
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
            Therapeutic Games
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Stats Banner */}
        {stats && stats.totalGamesPlayed > 0 && (
          <View style={[styles.statsBanner, { backgroundColor: colors.card }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.tint }]}>
                {stats.totalGamesPlayed}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                games played
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.tint }]}>
                {formatDuration(stats.totalTimeSpent)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                total time
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.tint }]}>
                {stats.currentStreak}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                day streak
              </Text>
            </View>
          </View>
        )}

        {/* Intro */}
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Games designed to calm, ground, and build skills — not to addict. All games have retro pixel aesthetics and are paced for wellness.
        </Text>

        {/* Categories */}
        {renderCategory('focus', FOCUS_GAMES)}
        {renderCategory('grounding', GROUNDING_GAMES)}
        {renderCategory('relaxation', RELAXATION_GAMES)}
        {renderCategory('knowledge', KNOWLEDGE_GAMES)}
        {renderCategory('wisdom', WISDOM_GAMES)}
        {renderCategory('logic_therapeutic', LOGIC_THERAPEUTIC_GAMES)}
        {renderCategory('logic_classic', LOGIC_CLASSIC_GAMES)}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerTitle, { color: colors.text }]}>
            Why Therapeutic Games?
          </Text>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Unlike commercial games designed to maximize engagement, these games are designed for genuine wellness benefits. They help you practice grounding, build emotional intelligence, and develop cognitive skills — all at your own pace, with no pressure.
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
    paddingBottom: 40,
  },
  statsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  categorySection: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  categorySubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  gamesContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
  },
  gameCardDisabled: {
    opacity: 0.5,
  },
  gameContent: {
    flex: 1,
  },
  gameName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  gameMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  metaText: {
    fontSize: 11,
  },
  comingSoon: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 20,
    padding: 16,
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
