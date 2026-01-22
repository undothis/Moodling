/**
 * Frogger
 *
 * Classic arcade road-crossing game.
 * Help the frog safely cross busy roads and rivers!
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const HIGH_SCORE_KEY = 'mood_leaf_frogger_high_score';

// Game colors
const COLORS = {
  bg: '#1a1a2e',
  grass: '#2D5A27',
  road: '#333333',
  water: '#1E3A5F',
  frog: '#32CD32',
  car1: '#FF4444',
  car2: '#4444FF',
  car3: '#FFFF44',
  log: '#8B4513',
  lily: '#228B22',
  text: '#fff',
};

// Game constants
const GRID_COLS = 9;
const GRID_ROWS = 13;

interface Vehicle {
  id: number;
  row: number;
  x: number;
  width: number;
  speed: number;
  color: string;
}

interface LogPlatform {
  id: number;
  row: number;
  x: number;
  width: number;
  speed: number;
}

interface FroggerProps {
  onClose?: () => void;
}

export default function Frogger({ onClose }: FroggerProps) {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const gameWidth = Math.min(screenWidth - 32, 360);
  const cellSize = gameWidth / GRID_COLS;
  const gameHeight = cellSize * GRID_ROWS;

  // Game state
  const [frogPos, setFrogPos] = useState({ x: Math.floor(GRID_COLS / 2), y: GRID_ROWS - 1 });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [logs, setLogs] = useState<LogPlatform[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [frogOnLog, setFrogOnLog] = useState<LogPlatform | null>(null);
  const [homesFilled, setHomesFilled] = useState<boolean[]>([false, false, false, false, false]);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const vehicleIdRef = useRef(0);
  const logIdRef = useRef(0);

  // Load high score
  useEffect(() => {
    AsyncStorage.getItem(HIGH_SCORE_KEY).then((stored) => {
      if (stored) setHighScore(parseInt(stored, 10));
    });
  }, []);

  // Initialize level
  const initLevel = useCallback((lvl: number) => {
    // Create vehicles for road rows (rows 8-11)
    const newVehicles: Vehicle[] = [];
    const roadRows = [8, 9, 10, 11];
    const carColors = [COLORS.car1, COLORS.car2, COLORS.car3];

    roadRows.forEach((row, idx) => {
      const speed = (idx % 2 === 0 ? 1 : -1) * (1 + lvl * 0.2);
      const carCount = 2 + Math.floor(lvl / 2);

      for (let i = 0; i < carCount; i++) {
        newVehicles.push({
          id: vehicleIdRef.current++,
          row,
          x: i * (gameWidth / carCount) + Math.random() * 30,
          width: cellSize * (1 + Math.random()),
          speed: speed * (0.8 + Math.random() * 0.4),
          color: carColors[idx % carColors.length],
        });
      }
    });

    // Create logs for water rows (rows 2-6)
    const newLogs: LogPlatform[] = [];
    const waterRows = [2, 3, 4, 5, 6];

    waterRows.forEach((row, idx) => {
      const speed = (idx % 2 === 0 ? 1 : -1) * (0.8 + lvl * 0.15);
      const logCount = 2 + (idx % 2);

      for (let i = 0; i < logCount; i++) {
        newLogs.push({
          id: logIdRef.current++,
          row,
          x: i * (gameWidth / logCount) + Math.random() * 50,
          width: cellSize * (2 + Math.random()),
          speed: speed * (0.8 + Math.random() * 0.4),
        });
      }
    });

    setVehicles(newVehicles);
    setLogs(newLogs);
  }, [gameWidth, cellSize]);

  // Initialize game
  const initGame = useCallback(() => {
    setFrogPos({ x: Math.floor(GRID_COLS / 2), y: GRID_ROWS - 1 });
    setScore(0);
    setLives(3);
    setLevel(1);
    setHomesFilled([false, false, false, false, false]);
    setGameOver(false);
    setIsPlaying(true);
    setFrogOnLog(null);
    initLevel(1);
  }, [initLevel]);

  // Reset frog position
  const resetFrog = useCallback(() => {
    setFrogPos({ x: Math.floor(GRID_COLS / 2), y: GRID_ROWS - 1 });
    setFrogOnLog(null);
  }, []);

  // Move frog
  const moveFrog = useCallback(
    (dx: number, dy: number) => {
      if (!isPlaying || gameOver) return;

      setFrogPos((prev) => {
        const newX = Math.max(0, Math.min(GRID_COLS - 1, prev.x + dx));
        const newY = Math.max(0, Math.min(GRID_ROWS - 1, prev.y + dy));

        // Score for moving forward
        if (dy < 0 && newY < prev.y) {
          setScore((s) => {
            const newScore = s + 10;
            setHighScore((hs) => {
              const newHigh = Math.max(hs, newScore);
              if (newHigh > hs) {
                AsyncStorage.setItem(HIGH_SCORE_KEY, newHigh.toString());
              }
              return newHigh;
            });
            return newScore;
          });
        }

        if (Platform.OS !== 'web') {
          Vibration.vibrate(10);
        }

        return { x: newX, y: newY };
      });
    },
    [isPlaying, gameOver]
  );

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameOver) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      return;
    }

    gameLoopRef.current = setInterval(() => {
      // Update vehicles
      setVehicles((prev) =>
        prev.map((v) => {
          let newX = v.x + v.speed * 2;
          if (newX > gameWidth + v.width) newX = -v.width;
          if (newX < -v.width) newX = gameWidth + v.width;
          return { ...v, x: newX };
        })
      );

      // Update logs
      setLogs((prev) =>
        prev.map((l) => {
          let newX = l.x + l.speed * 2;
          if (newX > gameWidth + l.width) newX = -l.width;
          if (newX < -l.width) newX = gameWidth + l.width;
          return { ...l, x: newX };
        })
      );
    }, 50);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, gameOver, gameWidth]);

  // Collision detection
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const frogPixelX = frogPos.x * cellSize;
    const frogPixelY = frogPos.y * cellSize;
    const frogWidth = cellSize * 0.8;
    const frogHeight = cellSize * 0.8;

    // Check vehicle collision (road rows)
    if (frogPos.y >= 8 && frogPos.y <= 11) {
      const rowVehicles = vehicles.filter((v) => v.row === frogPos.y);
      for (const v of rowVehicles) {
        if (
          frogPixelX < v.x + v.width &&
          frogPixelX + frogWidth > v.x &&
          frogPixelY < frogPos.y * cellSize + cellSize &&
          frogPixelY + frogHeight > frogPos.y * cellSize
        ) {
          // Hit by car
          setLives((l) => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setGameOver(true);
              setIsPlaying(false);
              if (Platform.OS !== 'web') Vibration.vibrate(300);
            } else {
              resetFrog();
              if (Platform.OS !== 'web') Vibration.vibrate(100);
            }
            return newLives;
          });
          return;
        }
      }
    }

    // Check water/log collision (water rows)
    if (frogPos.y >= 2 && frogPos.y <= 6) {
      const rowLogs = logs.filter((l) => l.row === frogPos.y);
      let onLog = false;

      for (const l of rowLogs) {
        if (
          frogPixelX < l.x + l.width - 10 &&
          frogPixelX + frogWidth > l.x + 10
        ) {
          onLog = true;
          setFrogOnLog(l);
          // Move frog with log
          setFrogPos((prev) => ({
            ...prev,
            x: Math.max(0, Math.min(GRID_COLS - 1, prev.x + l.speed * 0.03)),
          }));
          break;
        }
      }

      if (!onLog) {
        // Fell in water
        setFrogOnLog(null);
        setLives((l) => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setGameOver(true);
            setIsPlaying(false);
            if (Platform.OS !== 'web') Vibration.vibrate(300);
          } else {
            resetFrog();
            if (Platform.OS !== 'web') Vibration.vibrate(100);
          }
          return newLives;
        });
      }
    } else {
      setFrogOnLog(null);
    }

    // Check if reached home (row 1)
    if (frogPos.y === 1) {
      const homeIndex = Math.floor(frogPos.x / 2);
      if (homeIndex >= 0 && homeIndex < 5 && !homesFilled[homeIndex]) {
        setHomesFilled((prev) => {
          const newHomes = [...prev];
          newHomes[homeIndex] = true;
          return newHomes;
        });
        setScore((s) => s + 100);
        resetFrog();

        if (Platform.OS !== 'web') Vibration.vibrate(50);

        // Check if all homes filled
        const filledCount = homesFilled.filter((h) => h).length + 1;
        if (filledCount >= 5) {
          setLevel((l) => l + 1);
          setHomesFilled([false, false, false, false, false]);
          initLevel(level + 1);
          setScore((s) => s + 500);
        }
      }
    }
  }, [frogPos, vehicles, logs, isPlaying, gameOver, cellSize, homesFilled, resetFrog, level, initLevel]);

  const getRowType = (row: number): 'grass' | 'road' | 'water' | 'home' => {
    if (row === 0 || row === 1) return 'home';
    if (row >= 2 && row <= 6) return 'water';
    if (row === 7 || row === GRID_ROWS - 1) return 'grass';
    return 'road';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={styles.levelContainer}>
          <Text style={styles.levelText}>LEVEL {level}</Text>
          <View style={styles.livesContainer}>
            {[...Array(lives)].map((_, i) => (
              <Text key={i} style={[styles.frogLife, i > 0 && styles.frogLifeMargin]}>
                🐸
              </Text>
            ))}
          </View>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>HIGH</Text>
          <Text style={styles.scoreValue}>{highScore}</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Game area */}
      <View style={[styles.gameArea, { width: gameWidth, height: gameHeight }]}>
        {/* Rows */}
        {[...Array(GRID_ROWS)].map((_, row) => {
          const rowType = getRowType(row);
          return (
            <View
              key={row}
              style={[
                styles.row,
                { height: cellSize },
                rowType === 'grass' && { backgroundColor: COLORS.grass },
                rowType === 'road' && { backgroundColor: COLORS.road },
                rowType === 'water' && { backgroundColor: COLORS.water },
                rowType === 'home' && { backgroundColor: COLORS.grass },
              ]}
            >
              {/* Home spots */}
              {row === 1 &&
                [0, 1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.homeSpot,
                      {
                        left: i * 2 * cellSize + cellSize * 0.3,
                        width: cellSize * 1.4,
                        height: cellSize * 0.9,
                      },
                      homesFilled[i] && styles.homeSpotFilled,
                    ]}
                  >
                    {homesFilled[i] && <Text style={styles.homeFrog}>🐸</Text>}
                  </View>
                ))}

              {/* Road markings */}
              {rowType === 'road' && (
                <View style={styles.roadMarkings}>
                  {[...Array(5)].map((_, i) => (
                    <View key={i} style={styles.roadLine} />
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Logs */}
        {logs.map((log) => (
          <View
            key={log.id}
            style={[
              styles.log,
              {
                left: log.x,
                top: log.row * cellSize + 4,
                width: log.width,
                height: cellSize - 8,
              },
            ]}
          />
        ))}

        {/* Vehicles */}
        {vehicles.map((v) => (
          <View
            key={v.id}
            style={[
              styles.vehicle,
              {
                left: v.x,
                top: v.row * cellSize + 6,
                width: v.width,
                height: cellSize - 12,
                backgroundColor: v.color,
              },
            ]}
          />
        ))}

        {/* Frog */}
        <View
          style={[
            styles.frog,
            {
              left: frogPos.x * cellSize + cellSize * 0.1,
              top: frogPos.y * cellSize + cellSize * 0.1,
              width: cellSize * 0.8,
              height: cellSize * 0.8,
            },
          ]}
        >
          <Text style={styles.frogEmoji}>🐸</Text>
        </View>

        {/* Game over overlay */}
        {gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>GAME OVER</Text>
            <Text style={styles.overlayScore}>Score: {score}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={initGame}>
              <Text style={styles.retryText}>PLAY AGAIN</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Start screen */}
        {!isPlaying && !gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>🐸 FROGGER</Text>
            <Text style={styles.overlayHint}>Help the frog cross!</Text>
            <TouchableOpacity style={styles.retryButton} onPress={initGame}>
              <Text style={styles.retryText}>START</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* D-pad controls */}
      {isPlaying && (
        <View style={styles.controlsContainer}>
          <View style={styles.dpad}>
            <TouchableOpacity
              style={[styles.dpadButton, styles.dpadUp]}
              onPress={() => moveFrog(0, -1)}
            >
              <Ionicons name="caret-up" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.dpadRow}>
              <TouchableOpacity
                style={[styles.dpadButton, styles.dpadLeft]}
                onPress={() => moveFrog(-1, 0)}
              >
                <Ionicons name="caret-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.dpadCenter} />
              <TouchableOpacity
                style={[styles.dpadButton, styles.dpadRight]}
                onPress={() => moveFrog(1, 0)}
              >
                <Ionicons name="caret-forward" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.dpadButton, styles.dpadDown]}
              onPress={() => moveFrog(0, 1)}
            >
              <Ionicons name="caret-down" size={24} color="#fff" />
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
    backgroundColor: COLORS.bg,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    color: COLORS.text,
    opacity: 0.7,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  levelContainer: {
    alignItems: 'center',
  },
  levelText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  livesContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  frogLife: {
    fontSize: 16,
  },
  frogLifeMargin: {
    marginLeft: 4,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 60 : 40,
    padding: 8,
  },
  gameArea: {
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#444',
  },
  row: {
    width: '100%',
    position: 'relative',
  },
  roadMarkings: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  roadLine: {
    width: 20,
    height: 3,
    backgroundColor: '#fff',
  },
  homeSpot: {
    position: 'absolute',
    top: 2,
    backgroundColor: COLORS.water,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeSpotFilled: {
    backgroundColor: COLORS.lily,
  },
  homeFrog: {
    fontSize: 20,
  },
  log: {
    position: 'absolute',
    backgroundColor: COLORS.log,
    borderRadius: 6,
  },
  vehicle: {
    position: 'absolute',
    borderRadius: 4,
  },
  frog: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  frogEmoji: {
    fontSize: 28,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  overlayScore: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 24,
  },
  overlayHint: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.frog,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  controlsContainer: {
    marginTop: 20,
    alignItems: 'center',
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
    backgroundColor: '#333',
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
    backgroundColor: '#222',
    borderRadius: 25,
    margin: 2,
  },
});
