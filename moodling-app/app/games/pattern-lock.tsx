/**
 * Pattern Lock Game
 *
 * Simon-style memory game with pixel aesthetics.
 * Remember and repeat growing sequences.
 *
 * Mental benefit: Working memory, sequential processing
 * Category: Focus
 * Difficulty: Gentle
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  SafeAreaView,
  Animated,
  Vibration,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { recordGameSession } from '@/services/gamesService';

type GameState = 'waiting' | 'showing' | 'input' | 'correct' | 'wrong' | 'complete';

const COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63'];
const GRID_SIZE = 4;
const INITIAL_DELAY = 600;
const FLASH_DURATION = 400;
const SEQUENCES_TO_WIN = 10;

export default function PatternLockGame() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>('waiting');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const scaleAnims = useRef<Animated.Value[]>(
    Array.from({ length: GRID_SIZE }, () => new Animated.Value(1))
  ).current;

  // Flash a button
  const flashButton = useCallback((index: number): Promise<void> => {
    return new Promise((resolve) => {
      setActiveButton(index);

      Animated.sequence([
        Animated.timing(scaleAnims[index], {
          toValue: 1.1,
          duration: FLASH_DURATION / 2,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnims[index], {
          toValue: 1,
          duration: FLASH_DURATION / 2,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setActiveButton(null);
        resolve();
      });
    });
  }, [scaleAnims]);

  // Show the sequence
  const showSequence = useCallback(async (seq: number[]) => {
    setGameState('showing');
    setUserInput([]);

    // Wait a moment before starting
    await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY));

    for (const index of seq) {
      await flashButton(index);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setGameState('input');
  }, [flashButton]);

  // Start a new round
  const startNewRound = useCallback(() => {
    const newIndex = Math.floor(Math.random() * GRID_SIZE);
    const newSequence = [...sequence, newIndex];
    setSequence(newSequence);
    setRound(prev => prev + 1);
    showSequence(newSequence);
  }, [sequence, showSequence]);

  // Start new game
  const startGame = useCallback(() => {
    setSequence([]);
    setUserInput([]);
    setRound(0);
    setStartTime(new Date());

    // Generate first item
    const firstIndex = Math.floor(Math.random() * GRID_SIZE);
    setSequence([firstIndex]);
    setRound(1);
    showSequence([firstIndex]);
  }, [showSequence]);

  // Handle button press
  const handlePress = useCallback((index: number) => {
    if (gameState !== 'input') return;

    Vibration.vibrate(10);
    flashButton(index);

    const newInput = [...userInput, index];
    setUserInput(newInput);

    // Check if correct so far
    const expectedIndex = sequence[newInput.length - 1];
    if (index !== expectedIndex) {
      // Wrong!
      setGameState('wrong');
      Vibration.vibrate([0, 100, 100, 100]);

      // Update high score
      if (round > highScore) {
        setHighScore(round);
      }

      // Record session
      if (startTime) {
        const endTime = new Date();
        recordGameSession({
          gameId: 'pattern_lock',
          startedAt: startTime.toISOString(),
          endedAt: endTime.toISOString(),
          completedSuccessfully: false,
          duration: Math.floor((endTime.getTime() - startTime.getTime()) / 1000),
          score: round - 1,
        });
      }
      return;
    }

    // Check if sequence complete
    if (newInput.length === sequence.length) {
      if (round >= SEQUENCES_TO_WIN) {
        // Won the game!
        setGameState('complete');
        Vibration.vibrate([0, 50, 100, 50, 100, 50]);

        if (round > highScore) {
          setHighScore(round);
        }

        // Record session
        if (startTime) {
          const endTime = new Date();
          recordGameSession({
            gameId: 'pattern_lock',
            startedAt: startTime.toISOString(),
            endedAt: endTime.toISOString(),
            completedSuccessfully: true,
            duration: Math.floor((endTime.getTime() - startTime.getTime()) / 1000),
            score: round,
          });
        }
      } else {
        // Correct! Show next round
        setGameState('correct');
        Vibration.vibrate(50);
        setTimeout(() => {
          startNewRound();
        }, 800);
      }
    }
  }, [gameState, userInput, sequence, round, highScore, startTime, startNewRound, flashButton]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Pattern Lock</Text>
        <View style={styles.backButton} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Round</Text>
          <Text style={[styles.statValue, { color: colors.tint }]}>{round}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Best</Text>
          <Text style={[styles.statValue, { color: colors.tint }]}>{highScore}</Text>
        </View>
      </View>

      {/* Game Status */}
      <View style={styles.statusContainer}>
        {gameState === 'waiting' && (
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            Tap Start to begin
          </Text>
        )}
        {gameState === 'showing' && (
          <Text style={[styles.statusText, { color: colors.tint }]}>
            Watch the pattern...
          </Text>
        )}
        {gameState === 'input' && (
          <Text style={[styles.statusText, { color: colors.text }]}>
            Your turn! ({userInput.length}/{sequence.length})
          </Text>
        )}
        {gameState === 'correct' && (
          <Text style={[styles.statusText, { color: colors.success }]}>
            Correct!
          </Text>
        )}
        {gameState === 'wrong' && (
          <Text style={[styles.statusText, { color: colors.error }]}>
            Not quite! You reached round {round - 1}
          </Text>
        )}
        {gameState === 'complete' && (
          <Text style={[styles.statusText, { color: colors.success }]}>
            Amazing! You completed all {SEQUENCES_TO_WIN} rounds!
          </Text>
        )}
      </View>

      {/* Game Grid */}
      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {Array.from({ length: GRID_SIZE }).map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.buttonWrapper,
                { transform: [{ scale: scaleAnims[index] }] },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.gameButton,
                  {
                    backgroundColor: COLORS[index],
                    opacity: activeButton === index ? 1 : 0.6,
                  },
                ]}
                onPress={() => handlePress(index)}
                disabled={gameState !== 'input'}
                activeOpacity={0.8}
              >
                {/* Pixel texture overlay */}
                <View style={styles.pixelOverlay} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {(gameState === 'waiting' || gameState === 'wrong' || gameState === 'complete') && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={startGame}
          >
            <Text style={styles.actionButtonText}>
              {gameState === 'waiting' ? 'Start' : 'Play Again'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={[styles.instructionText, { color: colors.textMuted }]}>
          Watch the colors flash, then repeat the pattern.
          {'\n'}Each round adds one more to remember.
        </Text>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    justifyContent: 'center',
    gap: 16,
  },
  buttonWrapper: {
    width: 120,
    height: 120,
  },
  gameButton: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  pixelOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Pixel grid pattern
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  actionContainer: {
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  instructions: {
    paddingHorizontal: 40,
    paddingBottom: 20,
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
