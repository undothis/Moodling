/**
 * 2048 Puzzle
 *
 * Classic sliding number puzzle game.
 * Swipe to combine tiles and reach 2048.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Platform,
  Vibration,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORE_KEY = 'mood_leaf_2048_high_score';
const BEST_TILE_KEY = 'mood_leaf_2048_best_tile';

// Tile colors based on value
const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: '#CDC1B4', text: 'transparent' },
  2: { bg: '#EEE4DA', text: '#776E65' },
  4: { bg: '#EDE0C8', text: '#776E65' },
  8: { bg: '#F2B179', text: '#F9F6F2' },
  16: { bg: '#F59563', text: '#F9F6F2' },
  32: { bg: '#F67C5F', text: '#F9F6F2' },
  64: { bg: '#F65E3B', text: '#F9F6F2' },
  128: { bg: '#EDCF72', text: '#F9F6F2' },
  256: { bg: '#EDCC61', text: '#F9F6F2' },
  512: { bg: '#EDC850', text: '#F9F6F2' },
  1024: { bg: '#EDC53F', text: '#F9F6F2' },
  2048: { bg: '#EDC22E', text: '#F9F6F2' },
  4096: { bg: '#3C3A32', text: '#F9F6F2' },
  8192: { bg: '#3C3A32', text: '#F9F6F2' },
};

type Direction = 'up' | 'down' | 'left' | 'right';

interface Game2048Props {
  onClose?: () => void;
}

export default function Game2048({ onClose }: Game2048Props) {
  const screenWidth = Dimensions.get('window').width;
  const boardSize = Math.min(screenWidth - 40, 340);
  const tileSize = (boardSize - 40) / 4;

  // Game state
  const [board, setBoard] = useState<number[][]>(() => initBoard());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [bestTile, setBestTile] = useState(2);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);

  const scoreRef = useRef(score);
  scoreRef.current = score;

  // Load high scores
  React.useEffect(() => {
    AsyncStorage.getItem(HIGH_SCORE_KEY).then((stored) => {
      if (stored) setHighScore(parseInt(stored, 10));
    });
    AsyncStorage.getItem(BEST_TILE_KEY).then((stored) => {
      if (stored) setBestTile(parseInt(stored, 10));
    });
  }, []);

  // Initialize empty board with two random tiles
  function initBoard(): number[][] {
    const newBoard = Array(4).fill(null).map(() => Array(4).fill(0));
    addRandomTile(newBoard);
    addRandomTile(newBoard);
    return newBoard;
  }

  // Add random tile (90% chance of 2, 10% chance of 4)
  function addRandomTile(board: number[][]): boolean {
    const emptyCells: [number, number][] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] === 0) {
          emptyCells.push([i, j]);
        }
      }
    }
    if (emptyCells.length === 0) return false;

    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board[row][col] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }

  // Check if moves are possible
  function canMove(board: number[][]): boolean {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] === 0) return true;
        if (j < 3 && board[i][j] === board[i][j + 1]) return true;
        if (i < 3 && board[i][j] === board[i + 1][j]) return true;
      }
    }
    return false;
  }

  // Move tiles in a direction
  const move = useCallback(
    (direction: Direction) => {
      if (gameOver && !keepPlaying) return;

      let newBoard = board.map((row) => [...row]);
      let moved = false;
      let scoreGain = 0;
      let maxTile = 0;

      const slide = (row: number[]): number[] => {
        // Remove zeros
        let filtered = row.filter((x) => x !== 0);
        // Merge adjacent equal values
        for (let i = 0; i < filtered.length - 1; i++) {
          if (filtered[i] === filtered[i + 1]) {
            filtered[i] *= 2;
            scoreGain += filtered[i];
            maxTile = Math.max(maxTile, filtered[i]);
            filtered[i + 1] = 0;
          }
        }
        // Remove zeros again and pad
        filtered = filtered.filter((x) => x !== 0);
        while (filtered.length < 4) {
          filtered.push(0);
        }
        return filtered;
      };

      // Apply movement based on direction
      switch (direction) {
        case 'left':
          for (let i = 0; i < 4; i++) {
            const newRow = slide(newBoard[i]);
            if (newRow.some((v, j) => v !== newBoard[i][j])) moved = true;
            newBoard[i] = newRow;
          }
          break;
        case 'right':
          for (let i = 0; i < 4; i++) {
            const newRow = slide([...newBoard[i]].reverse()).reverse();
            if (newRow.some((v, j) => v !== newBoard[i][j])) moved = true;
            newBoard[i] = newRow;
          }
          break;
        case 'up':
          for (let j = 0; j < 4; j++) {
            const col = [newBoard[0][j], newBoard[1][j], newBoard[2][j], newBoard[3][j]];
            const newCol = slide(col);
            if (newCol.some((v, i) => v !== newBoard[i][j])) moved = true;
            for (let i = 0; i < 4; i++) newBoard[i][j] = newCol[i];
          }
          break;
        case 'down':
          for (let j = 0; j < 4; j++) {
            const col = [newBoard[3][j], newBoard[2][j], newBoard[1][j], newBoard[0][j]];
            const newCol = slide(col);
            if (newCol.some((v, i) => v !== newBoard[3 - i][j])) moved = true;
            for (let i = 0; i < 4; i++) newBoard[3 - i][j] = newCol[i];
          }
          break;
      }

      if (moved) {
        addRandomTile(newBoard);
        setBoard(newBoard);

        // Update score
        if (scoreGain > 0) {
          const newScore = scoreRef.current + scoreGain;
          setScore(newScore);
          setHighScore((hs) => {
            const newHigh = Math.max(hs, newScore);
            if (newHigh > hs) {
              AsyncStorage.setItem(HIGH_SCORE_KEY, newHigh.toString());
            }
            return newHigh;
          });

          if (Platform.OS !== 'web') {
            Vibration.vibrate(20);
          }
        }

        // Check for 2048 win
        if (maxTile >= 2048 && !won && !keepPlaying) {
          setWon(true);
        }

        // Update best tile
        const boardMax = Math.max(...newBoard.flat());
        if (boardMax > bestTile) {
          setBestTile(boardMax);
          AsyncStorage.setItem(BEST_TILE_KEY, boardMax.toString());
        }

        // Check game over
        if (!canMove(newBoard)) {
          setGameOver(true);
          if (Platform.OS !== 'web') {
            Vibration.vibrate(200);
          }
        }
      }
    },
    [board, gameOver, keepPlaying, won, bestTile]
  );

  // Reset game
  const resetGame = useCallback(() => {
    setBoard(initBoard());
    setScore(0);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
  }, []);

  // Pan responder for swipe detection
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gesture) => {
        const { dx, dy } = gesture;
        const minSwipe = 30;

        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > minSwipe) move('right');
          else if (dx < -minSwipe) move('left');
        } else {
          if (dy > minSwipe) move('down');
          else if (dy < -minSwipe) move('up');
        }
      },
    })
  ).current;

  const getTileStyle = (value: number) => {
    const colors = TILE_COLORS[value] || TILE_COLORS[4096];
    return {
      backgroundColor: colors.bg,
      color: colors.text,
    };
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>2048</Text>
          <Text style={styles.subtitle}>Join the tiles!</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#776E65" />
          </TouchableOpacity>
        )}
      </View>

      {/* Score display */}
      <View style={styles.scoreContainer}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>BEST</Text>
          <Text style={styles.scoreValue}>{highScore}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>BEST TILE</Text>
          <Text style={styles.scoreValue}>{bestTile}</Text>
        </View>
      </View>

      {/* Game board */}
      <View
        style={[styles.boardContainer, { width: boardSize, height: boardSize }]}
        {...panResponder.panHandlers}
      >
        {/* Background grid */}
        <View style={styles.backgroundGrid}>
          {Array(16)
            .fill(null)
            .map((_, i) => (
              <View
                key={i}
                style={[
                  styles.emptyCell,
                  { width: tileSize - 8, height: tileSize - 8 },
                ]}
              />
            ))}
        </View>

        {/* Tiles */}
        {board.map((row, i) =>
          row.map((value, j) =>
            value !== 0 ? (
              <View
                key={`${i}-${j}`}
                style={[
                  styles.tile,
                  {
                    width: tileSize - 8,
                    height: tileSize - 8,
                    left: j * tileSize + 12,
                    top: i * tileSize + 12,
                    backgroundColor: getTileStyle(value).backgroundColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tileText,
                    { color: getTileStyle(value).color },
                    value >= 1000 && styles.tileTextSmall,
                  ]}
                >
                  {value}
                </Text>
              </View>
            ) : null
          )
        )}

        {/* Win overlay */}
        {won && !keepPlaying && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>You Win!</Text>
            <Text style={styles.overlayScore}>Score: {score}</Text>
            <View style={styles.overlayButtons}>
              <TouchableOpacity
                style={styles.overlayButton}
                onPress={() => setKeepPlaying(true)}
              >
                <Text style={styles.overlayButtonText}>Keep Going</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.overlayButton} onPress={resetGame}>
                <Text style={styles.overlayButtonText}>New Game</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Game over overlay */}
        {gameOver && !won && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Game Over!</Text>
            <Text style={styles.overlayScore}>Score: {score}</Text>
            <TouchableOpacity style={styles.overlayButton} onPress={resetGame}>
              <Text style={styles.overlayButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.newGameButton} onPress={resetGame}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.newGameText}>New Game</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructions}>
          Swipe to move tiles. When two tiles with the same number touch, they
          merge into one!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8EF',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#776E65',
  },
  subtitle: {
    fontSize: 14,
    color: '#776E65',
    opacity: 0.7,
  },
  closeButton: {
    padding: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreBox: {
    backgroundColor: '#BBADA0',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    minWidth: 80,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#EEE4DA',
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  boardContainer: {
    backgroundColor: '#BBADA0',
    borderRadius: 8,
    padding: 8,
    position: 'relative',
  },
  backgroundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignContent: 'space-around',
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
  },
  emptyCell: {
    backgroundColor: 'rgba(238, 228, 218, 0.35)',
    borderRadius: 4,
    margin: 4,
  },
  tile: {
    position: 'absolute',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  tileTextSmall: {
    fontSize: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(238, 228, 218, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  overlayTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#776E65',
    marginBottom: 8,
  },
  overlayScore: {
    fontSize: 18,
    color: '#776E65',
    marginBottom: 16,
  },
  overlayButtons: {
    flexDirection: 'row',
  },
  overlayButton: {
    backgroundColor: '#8F7A66',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  overlayButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F9F6F2',
  },
  controlsContainer: {
    marginTop: 20,
  },
  newGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8F7A66',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  newGameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F9F6F2',
    marginLeft: 8,
  },
  instructionsContainer: {
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  instructions: {
    fontSize: 14,
    color: '#776E65',
    textAlign: 'center',
    lineHeight: 20,
  },
});
