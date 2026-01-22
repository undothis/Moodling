/**
 * Maze Walker
 *
 * Relaxing maze exploration game.
 * Navigate through procedurally generated mazes at your own pace.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATS_KEY = 'mood_leaf_maze_stats';

// Maze themes
const MAZE_THEMES = {
  garden: { wall: '#228B22', path: '#90EE90', player: '#FF6B6B', exit: '#FFD700', bg: '#F0FFF0' },
  night: { wall: '#1E1E3F', path: '#3D3D7A', player: '#00FFFF', exit: '#FF00FF', bg: '#0A0A1F' },
  desert: { wall: '#CD853F', path: '#F4A460', player: '#FF4500', exit: '#32CD32', bg: '#FFEFD5' },
  ice: { wall: '#4682B4', path: '#B0E0E6', player: '#FF69B4', exit: '#FFD700', bg: '#E0FFFF' },
};

type MazeTheme = keyof typeof MAZE_THEMES;

// Maze sizes
const MAZE_SIZES = {
  small: { width: 11, height: 11, label: 'Small' },
  medium: { width: 15, height: 15, label: 'Medium' },
  large: { width: 21, height: 21, label: 'Large' },
};

type MazeSize = keyof typeof MAZE_SIZES;

interface MazeWalkerProps {
  onClose?: () => void;
}

export default function MazeWalker({ onClose }: MazeWalkerProps) {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const [theme, setTheme] = useState<MazeTheme>('garden');
  const [size, setSize] = useState<MazeSize>('medium');
  const [maze, setMaze] = useState<number[][]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [exitPos, setExitPos] = useState({ x: 0, y: 0 });
  const [moves, setMoves] = useState(0);
  const [mazesCompleted, setMazesCompleted] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const currentTheme = MAZE_THEMES[theme];
  const currentSize = MAZE_SIZES[size];

  const cellSize = Math.min(
    (screenWidth - 40) / currentSize.width,
    (screenHeight - 350) / currentSize.height,
    30
  );

  // Load stats
  useEffect(() => {
    AsyncStorage.getItem(STATS_KEY).then((stored) => {
      if (stored) {
        const stats = JSON.parse(stored);
        setMazesCompleted(stats.completed || 0);
      }
    });
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && !isComplete) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isComplete]);

  // Generate maze using recursive backtracking
  const generateMaze = useCallback(() => {
    const { width, height } = currentSize;
    const newMaze: number[][] = Array(height)
      .fill(null)
      .map(() => Array(width).fill(1));

    const stack: { x: number; y: number }[] = [];
    const startX = 1;
    const startY = 1;

    newMaze[startY][startX] = 0;
    stack.push({ x: startX, y: startY });

    const directions = [
      { dx: 0, dy: -2 },
      { dx: 2, dy: 0 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 },
    ];

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const unvisited = directions.filter(({ dx, dy }) => {
        const nx = current.x + dx;
        const ny = current.y + dy;
        return nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && newMaze[ny][nx] === 1;
      });

      if (unvisited.length === 0) {
        stack.pop();
      } else {
        const { dx, dy } = unvisited[Math.floor(Math.random() * unvisited.length)];
        const nx = current.x + dx;
        const ny = current.y + dy;
        const wx = current.x + dx / 2;
        const wy = current.y + dy / 2;

        newMaze[wy][wx] = 0;
        newMaze[ny][nx] = 0;
        stack.push({ x: nx, y: ny });
      }
    }

    // Find exit (bottom right area)
    let exitX = width - 2;
    let exitY = height - 2;
    while (newMaze[exitY][exitX] === 1 && exitX > 1) {
      exitX--;
    }
    if (newMaze[exitY][exitX] === 1) {
      exitX = width - 2;
      while (newMaze[exitY][exitX] === 1 && exitY > 1) {
        exitY--;
      }
    }

    setMaze(newMaze);
    setPlayerPos({ x: 1, y: 1 });
    setExitPos({ x: exitX, y: exitY });
    setMoves(0);
    setTimer(0);
    setIsComplete(false);
    setIsActive(true);
  }, [currentSize]);

  // Initialize maze
  useEffect(() => {
    generateMaze();
  }, [size]); // Regenerate when size changes

  // Move player
  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      if (isComplete) return;

      setPlayerPos((prev) => {
        const newX = prev.x + dx;
        const newY = prev.y + dy;

        // Check bounds and walls
        if (
          newX < 0 ||
          newX >= currentSize.width ||
          newY < 0 ||
          newY >= currentSize.height ||
          maze[newY]?.[newX] === 1
        ) {
          return prev;
        }

        setMoves((m) => m + 1);

        if (Platform.OS !== 'web') {
          Vibration.vibrate(10);
        }

        // Check win
        if (newX === exitPos.x && newY === exitPos.y) {
          setIsComplete(true);
          setIsActive(false);
          setMazesCompleted((c) => {
            const newCount = c + 1;
            AsyncStorage.setItem(STATS_KEY, JSON.stringify({ completed: newCount }));
            return newCount;
          });
          if (Platform.OS !== 'web') {
            Vibration.vibrate([0, 50, 100, 50]);
          }
        }

        return { x: newX, y: newY };
      });
    },
    [isComplete, currentSize, maze, exitPos]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: currentTheme.wall }]}>Maze Walker</Text>
          <Text style={styles.subtitle}>{mazesCompleted} mazes completed</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={currentTheme.wall} />
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
          <Ionicons name="footsteps-outline" size={16} color="#64748B" />
          <Text style={styles.statValue}>{moves} moves</Text>
        </View>
      </View>

      {/* Settings row */}
      <View style={styles.settingsRow}>
        {/* Size selector */}
        <View style={styles.sizeContainer}>
          {(Object.keys(MAZE_SIZES) as MazeSize[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sizeButton, size === s && styles.sizeButtonActive]}
              onPress={() => setSize(s)}
            >
              <Text style={[styles.sizeText, size === s && styles.sizeTextActive]}>
                {MAZE_SIZES[s].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Theme selector */}
        <View style={styles.themeContainer}>
          {(Object.keys(MAZE_THEMES) as MazeTheme[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.themeButton,
                { backgroundColor: MAZE_THEMES[t].wall },
                theme === t && styles.themeButtonActive,
              ]}
              onPress={() => setTheme(t)}
            />
          ))}
        </View>
      </View>

      {/* Maze grid */}
      <View style={styles.mazeContainer}>
        <View
          style={[
            styles.maze,
            {
              width: currentSize.width * cellSize,
              height: currentSize.height * cellSize,
            },
          ]}
        >
          {maze.map((row, y) =>
            row.map((cell, x) => (
              <View
                key={`${x}-${y}`}
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    left: x * cellSize,
                    top: y * cellSize,
                    backgroundColor: cell === 1 ? currentTheme.wall : currentTheme.path,
                  },
                ]}
              >
                {/* Exit marker */}
                {x === exitPos.x && y === exitPos.y && (
                  <View
                    style={[
                      styles.exit,
                      { backgroundColor: currentTheme.exit },
                    ]}
                  />
                )}
                {/* Player */}
                {x === playerPos.x && y === playerPos.y && (
                  <View
                    style={[
                      styles.player,
                      { backgroundColor: currentTheme.player },
                    ]}
                  />
                )}
              </View>
            ))
          )}
        </View>

        {/* Completion overlay */}
        {isComplete && (
          <View style={styles.completeOverlay}>
            <Text style={styles.completeEmoji}>🎉</Text>
            <Text style={[styles.completeText, { color: currentTheme.wall }]}>
              Maze Complete!
            </Text>
            <Text style={styles.completeStats}>
              Time: {formatTime(timer)} • Moves: {moves}
            </Text>
            <TouchableOpacity style={styles.newMazeButton} onPress={generateMaze}>
              <Text style={styles.newMazeText}>New Maze</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* D-pad controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.dpad}>
          <TouchableOpacity
            style={[styles.dpadButton, styles.dpadUp]}
            onPress={() => movePlayer(0, -1)}
          >
            <Ionicons name="caret-up" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.dpadRow}>
            <TouchableOpacity
              style={[styles.dpadButton, styles.dpadLeft]}
              onPress={() => movePlayer(-1, 0)}
            >
              <Ionicons name="caret-back" size={28} color="#fff" />
            </TouchableOpacity>
            <View style={styles.dpadCenter} />
            <TouchableOpacity
              style={[styles.dpadButton, styles.dpadRight]}
              onPress={() => movePlayer(1, 0)}
            >
              <Ionicons name="caret-forward" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.dpadButton, styles.dpadDown]}
            onPress={() => movePlayer(0, 1)}
          >
            <Ionicons name="caret-down" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.newGameButton} onPress={generateMaze}>
          <Ionicons name="refresh" size={20} color="#64748B" />
          <Text style={styles.newGameText}>New Maze</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
    justifyContent: 'center',
    paddingVertical: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sizeContainer: {
    flexDirection: 'row',
  },
  sizeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginRight: 4,
  },
  sizeButtonActive: {
    backgroundColor: '#6366F1',
  },
  sizeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  sizeTextActive: {
    color: '#fff',
  },
  themeContainer: {
    flexDirection: 'row',
  },
  themeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeButtonActive: {
    borderColor: '#fff',
  },
  mazeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  maze: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cell: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exit: {
    width: '60%',
    height: '60%',
    borderRadius: 100,
  },
  player: {
    width: '70%',
    height: '70%',
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  completeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  completeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  completeStats: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  newMazeButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newMazeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  dpad: {
    alignItems: 'center',
  },
  dpadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dpadButton: {
    width: 50,
    height: 50,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  dpadUp: {},
  dpadDown: {},
  dpadLeft: {},
  dpadRight: {},
  dpadCenter: {
    width: 50,
    height: 50,
    backgroundColor: '#4F46E5',
    borderRadius: 25,
    margin: 2,
  },
  newGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newGameText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 6,
    fontWeight: '600',
  },
});
