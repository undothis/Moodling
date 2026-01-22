/**
 * Memory Match
 *
 * Classic card matching memory game with calming themes.
 * Features nature and mindfulness themed cards.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Vibration,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BEST_TIME_KEY = 'mood_leaf_memory_best_time';
const GAMES_PLAYED_KEY = 'mood_leaf_memory_games';

// Card themes with calming imagery
const CARD_SETS = {
  nature: ['🌸', '🌿', '🌊', '🌙', '🌻', '🍃', '🦋', '🌈'],
  mindful: ['🧘', '💆', '🌺', '☮️', '💫', '🕯️', '🎐', '💜'],
  cozy: ['☕', '📚', '🧸', '🎵', '🌻', '🏠', '🛋️', '🧶'],
};

type CardTheme = keyof typeof CARD_SETS;

interface Card {
  id: number;
  emoji: string;
  matched: boolean;
  flipped: boolean;
}

interface MemoryMatchProps {
  onClose?: () => void;
}

export default function MemoryMatch({ onClose }: MemoryMatchProps) {
  const screenWidth = Dimensions.get('window').width;

  // Grid settings
  const gridSize = 4; // 4x4 grid
  const cardSize = Math.min((screenWidth - 60) / gridSize, 80);
  const totalPairs = (gridSize * gridSize) / 2;

  // State
  const [theme, setTheme] = useState<CardTheme>('nature');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [timer, setTimer] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  // Load stats
  useEffect(() => {
    AsyncStorage.getItem(BEST_TIME_KEY).then((stored) => {
      if (stored) setBestTime(parseInt(stored, 10));
    });
    AsyncStorage.getItem(GAMES_PLAYED_KEY).then((stored) => {
      if (stored) setGamesPlayed(parseInt(stored, 10));
    });
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    const emojis = CARD_SETS[theme].slice(0, totalPairs);
    const cardPairs = [...emojis, ...emojis];

    // Shuffle cards
    for (let i = cardPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }

    setCards(
      cardPairs.map((emoji, index) => ({
        id: index,
        emoji,
        matched: false,
        flipped: false,
      }))
    );

    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
    setTimer(0);
    setGameStarted(false);
    setGameComplete(false);
    setIsChecking(false);
  }, [theme, totalPairs]);

  // Initialize on mount and theme change
  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameStarted && !gameComplete) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameComplete]);

  // Check for match
  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsChecking(true);
      const [first, second] = flippedCards;
      const firstCard = cards[first];
      const secondCard = cards[second];

      if (firstCard.emoji === secondCard.emoji) {
        // Match found
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === first || card.id === second
                ? { ...card, matched: true, flipped: true }
                : card
            )
          );
          setMatchedPairs((m) => m + 1);
          setFlippedCards([]);
          setIsChecking(false);

          if (Platform.OS !== 'web') {
            Vibration.vibrate(50);
          }
        }, 300);
      } else {
        // No match - flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === first || card.id === second
                ? { ...card, flipped: false }
                : card
            )
          );
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  }, [flippedCards, cards]);

  // Check for game completion
  useEffect(() => {
    if (matchedPairs === totalPairs && matchedPairs > 0) {
      setGameComplete(true);

      // Update stats
      const newGamesPlayed = gamesPlayed + 1;
      setGamesPlayed(newGamesPlayed);
      AsyncStorage.setItem(GAMES_PLAYED_KEY, newGamesPlayed.toString());

      if (bestTime === null || timer < bestTime) {
        setBestTime(timer);
        AsyncStorage.setItem(BEST_TIME_KEY, timer.toString());
      }

      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 50, 100, 50, 100, 50]);
      }
    }
  }, [matchedPairs, totalPairs, timer, bestTime, gamesPlayed]);

  // Handle card flip
  const flipCard = useCallback(
    (index: number) => {
      if (isChecking) return;
      if (flippedCards.length >= 2) return;
      if (cards[index].flipped || cards[index].matched) return;

      if (!gameStarted) {
        setGameStarted(true);
      }

      setCards((prev) =>
        prev.map((card, i) => (i === index ? { ...card, flipped: true } : card))
      );
      setFlippedCards((prev) => [...prev, index]);
      setMoves((m) => m + 1);

      if (Platform.OS !== 'web') {
        Vibration.vibrate(10);
      }
    },
    [isChecking, flippedCards, cards, gameStarted]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Memory Match</Text>
          <Text style={styles.subtitle}>Find all pairs</Text>
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
          <Ionicons name="time-outline" size={16} color="#64748B" />
          <Text style={styles.statValue}>{formatTime(timer)}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="swap-horizontal" size={16} color="#64748B" />
          <Text style={styles.statValue}>{moves}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#64748B" />
          <Text style={styles.statValue}>
            {matchedPairs}/{totalPairs}
          </Text>
        </View>
      </View>

      {/* Theme selector */}
      <View style={styles.themeContainer}>
        {(Object.keys(CARD_SETS) as CardTheme[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.themeButton, theme === t && styles.themeButtonActive]}
            onPress={() => setTheme(t)}
            disabled={gameStarted && !gameComplete}
          >
            <Text style={[styles.themeText, theme === t && styles.themeTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Game board */}
      <View style={styles.boardContainer}>
        <View
          style={[
            styles.board,
            { width: gridSize * (cardSize + 8) + 16 },
          ]}
        >
          {cards.map((card, index) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                { width: cardSize, height: cardSize },
                card.flipped && styles.cardFlipped,
                card.matched && styles.cardMatched,
              ]}
              onPress={() => flipCard(index)}
              activeOpacity={0.7}
              disabled={card.flipped || card.matched || isChecking}
            >
              {card.flipped || card.matched ? (
                <Text style={styles.cardEmoji}>{card.emoji}</Text>
              ) : (
                <View style={styles.cardBack}>
                  <Ionicons name="help" size={24} color="#94A3B8" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Best time */}
      <View style={styles.bestContainer}>
        {bestTime !== null && (
          <Text style={styles.bestText}>
            Best Time: {formatTime(bestTime)} • Games Played: {gamesPlayed}
          </Text>
        )}
      </View>

      {/* New game button */}
      <TouchableOpacity style={styles.newGameButton} onPress={initGame}>
        <Ionicons name="refresh" size={20} color="#fff" />
        <Text style={styles.newGameText}>New Game</Text>
      </TouchableOpacity>

      {/* Completion overlay */}
      {gameComplete && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <Text style={styles.overlayEmoji}>🎉</Text>
            <Text style={styles.overlayTitle}>Congratulations!</Text>
            <Text style={styles.overlayStats}>
              Time: {formatTime(timer)} • Moves: {moves}
            </Text>
            {bestTime === timer && (
              <Text style={styles.newRecord}>🏆 New Best Time!</Text>
            )}
            <TouchableOpacity style={styles.overlayButton} onPress={initGame}>
              <Text style={styles.overlayButtonText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
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
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 6,
  },
  themeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  themeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 4,
  },
  themeButtonActive: {
    backgroundColor: '#6366F1',
  },
  themeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  themeTextActive: {
    color: '#fff',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
  },
  card: {
    margin: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardFlipped: {
    backgroundColor: '#EEF2FF',
  },
  cardMatched: {
    backgroundColor: '#DCFCE7',
    opacity: 0.8,
  },
  cardBack: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  cardEmoji: {
    fontSize: 32,
  },
  bestContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  bestText: {
    fontSize: 12,
    color: '#64748B',
  },
  newGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    marginHorizontal: 40,
    marginBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  newGameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 32,
  },
  overlayEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  overlayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  overlayStats: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 8,
  },
  newRecord: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 16,
  },
  overlayButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  overlayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
