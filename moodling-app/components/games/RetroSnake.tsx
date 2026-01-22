/**
 * Retro Snake Game
 *
 * Classic Nokia-style Snake game with vintage aesthetics.
 * Access via /snake Easter egg command.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORE_KEY = 'mood_leaf_snake_high_score';

// Nokia-style colors
const COLORS = {
  screenBg: '#9BBC0F', // Classic Nokia green
  screenDark: '#0F380F', // Dark green
  screenMid: '#306230', // Medium green
  screenLight: '#8BAC0F', // Light green
  casing: '#2C2C2C', // Phone casing
  casingHighlight: '#3D3D3D',
  text: '#0F380F',
};

// Game constants
const CELL_SIZE = 12;
const GAME_SPEED = 150; // ms between moves

interface Position {
  x: number;
  y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface RetroSnakeProps {
  onClose?: () => void;
}

export default function RetroSnake({ onClose }: RetroSnakeProps) {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Game screen dimensions (Nokia-style aspect ratio)
  const gameWidth = Math.min(screenWidth - 48, 280);
  const gameHeight = Math.min(screenHeight - 300, 280);
  const gridWidth = Math.floor(gameWidth / CELL_SIZE);
  const gridHeight = Math.floor(gameHeight / CELL_SIZE);

  // Game state
  const [snake, setSnake] = useState<Position[]>([
    { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2) },
  ]);
  const [food, setFood] = useState<Position>({ x: 0, y: 0 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const directionRef = useRef(direction);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Load high score on mount
  useEffect(() => {
    AsyncStorage.getItem(HIGH_SCORE_KEY).then((stored) => {
      if (stored) setHighScore(parseInt(stored, 10));
    });
  }, []);

  // Generate random food position
  const generateFood = useCallback(
    (currentSnake: Position[]): Position => {
      let newFood: Position;
      do {
        newFood = {
          x: Math.floor(Math.random() * gridWidth),
          y: Math.floor(Math.random() * gridHeight),
        };
      } while (
        currentSnake.some(
          (segment) => segment.x === newFood.x && segment.y === newFood.y
        )
      );
      return newFood;
    },
    [gridWidth, gridHeight]
  );

  // Initialize game
  const initGame = useCallback(() => {
    const initialSnake = [
      { x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2) },
    ];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  }, [gridWidth, gridHeight, generateFood]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameOver) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      return;
    }

    gameLoopRef.current = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        const currentDirection = directionRef.current;

        // Move head
        switch (currentDirection) {
          case 'UP':
            head.y -= 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
          case 'RIGHT':
            head.x += 1;
            break;
        }

        // Check wall collision
        if (
          head.x < 0 ||
          head.x >= gridWidth ||
          head.y < 0 ||
          head.y >= gridHeight
        ) {
          setGameOver(true);
          setIsPlaying(false);
          if (Platform.OS !== 'web') {
            Vibration.vibrate(200);
          }
          return prevSnake;
        }

        // Check self collision
        if (
          prevSnake.some(
            (segment) => segment.x === head.x && segment.y === head.y
          )
        ) {
          setGameOver(true);
          setIsPlaying(false);
          if (Platform.OS !== 'web') {
            Vibration.vibrate(200);
          }
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          // Eat food - don't remove tail
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
          setFood(generateFood(newSnake));
          if (Platform.OS !== 'web') {
            Vibration.vibrate(50);
          }
        } else {
          // Remove tail
          newSnake.pop();
        }

        return newSnake;
      });
    }, GAME_SPEED);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPlaying, gameOver, food, gridWidth, gridHeight, generateFood]);

  // Handle direction change
  const changeDirection = (newDirection: Direction) => {
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };

    if (opposites[directionRef.current] !== newDirection) {
      directionRef.current = newDirection;
      setDirection(newDirection);
    }
  };

  // Render game grid
  const renderGrid = () => {
    const cells = [];

    // Render snake
    snake.forEach((segment, index) => {
      cells.push(
        <View
          key={`snake-${index}`}
          style={[
            styles.cell,
            {
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
              backgroundColor: COLORS.screenDark,
              borderRadius: index === 0 ? 2 : 1,
            },
          ]}
        />
      );
    });

    // Render food
    cells.push(
      <View
        key="food"
        style={[
          styles.cell,
          styles.food,
          {
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
          },
        ]}
      />
    );

    return cells;
  };

  return (
    <View style={styles.container}>
      {/* Phone casing top */}
      <View style={styles.phoneCasing}>
        {/* Title */}
        <View style={styles.titleBar}>
          <Text style={styles.title}>SNAKE</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={COLORS.screenBg} />
            </TouchableOpacity>
          )}
        </View>

        {/* LCD Screen */}
        <View style={styles.screenBezel}>
          <View
            style={[
              styles.screen,
              { width: gameWidth, height: gameHeight + 40 },
            ]}
          >
            {/* Score display */}
            <View style={styles.scoreBar}>
              <Text style={styles.scoreText}>SCORE: {score}</Text>
              <Text style={styles.scoreText}>HI: {highScore}</Text>
            </View>

            {/* Game area */}
            <View
              style={[
                styles.gameArea,
                { width: gridWidth * CELL_SIZE, height: gridHeight * CELL_SIZE },
              ]}
            >
              {renderGrid()}

              {/* Game over overlay */}
              {gameOver && (
                <View style={styles.overlay}>
                  <Text style={styles.overlayText}>GAME OVER</Text>
                  <Text style={styles.overlayScore}>SCORE: {score}</Text>
                </View>
              )}

              {/* Start screen */}
              {!isPlaying && !gameOver && (
                <View style={styles.overlay}>
                  <Text style={styles.overlayText}>SNAKE</Text>
                  <Text style={styles.overlayHint}>Press START</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* D-Pad */}
        <View style={styles.controlsContainer}>
          <View style={styles.dpad}>
            {/* Up */}
            <TouchableOpacity
              style={[styles.dpadButton, styles.dpadUp]}
              onPress={() => changeDirection('UP')}
              activeOpacity={0.7}
            >
              <Ionicons name="caret-up" size={20} color={COLORS.casing} />
            </TouchableOpacity>

            {/* Left */}
            <TouchableOpacity
              style={[styles.dpadButton, styles.dpadLeft]}
              onPress={() => changeDirection('LEFT')}
              activeOpacity={0.7}
            >
              <Ionicons name="caret-back" size={20} color={COLORS.casing} />
            </TouchableOpacity>

            {/* Center */}
            <View style={styles.dpadCenter} />

            {/* Right */}
            <TouchableOpacity
              style={[styles.dpadButton, styles.dpadRight]}
              onPress={() => changeDirection('RIGHT')}
              activeOpacity={0.7}
            >
              <Ionicons name="caret-forward" size={20} color={COLORS.casing} />
            </TouchableOpacity>

            {/* Down */}
            <TouchableOpacity
              style={[styles.dpadButton, styles.dpadDown]}
              onPress={() => changeDirection('DOWN')}
              activeOpacity={0.7}
            >
              <Ionicons name="caret-down" size={20} color={COLORS.casing} />
            </TouchableOpacity>
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={initGame}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>
                {gameOver ? 'RETRY' : 'START'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nokia-style speaker holes */}
        <View style={styles.speakerHoles}>
          {[...Array(6)].map((_, i) => (
            <View key={i} style={[styles.speakerHole, i > 0 && styles.speakerHoleMargin]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneCasing: {
    backgroundColor: COLORS.casing,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.screenBg,
    letterSpacing: 2,
  },
  closeButton: {
    padding: 4,
  },
  screenBezel: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 8,
    borderWidth: 2,
    borderColor: COLORS.casingHighlight,
  },
  screen: {
    backgroundColor: COLORS.screenBg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.screenLight,
  },
  scoreText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  gameArea: {
    position: 'relative',
    backgroundColor: COLORS.screenBg,
    margin: 4,
  },
  cell: {
    position: 'absolute',
    width: CELL_SIZE - 1,
    height: CELL_SIZE - 1,
  },
  food: {
    backgroundColor: COLORS.screenDark,
    borderRadius: CELL_SIZE / 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(155, 188, 15, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 2,
  },
  overlayScore: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
  },
  overlayHint: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: COLORS.screenMid,
    marginTop: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  dpad: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  dpadButton: {
    position: 'absolute',
    width: 32,
    height: 32,
    backgroundColor: COLORS.casingHighlight,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dpadUp: {
    top: 0,
    left: 34,
  },
  dpadDown: {
    bottom: 0,
    left: 34,
  },
  dpadLeft: {
    left: 0,
    top: 34,
  },
  dpadRight: {
    right: 0,
    top: 34,
  },
  dpadCenter: {
    position: 'absolute',
    width: 32,
    height: 32,
    backgroundColor: COLORS.casingHighlight,
    borderRadius: 16,
    left: 34,
    top: 34,
  },
  actionButtons: {
    // Actions stacked vertically
  },
  actionButton: {
    backgroundColor: COLORS.screenMid,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  actionButtonText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  speakerHoles: {
    flexDirection: 'row',
    marginTop: 20,
  },
  speakerHoleMargin: {
    marginLeft: 6,
  },
  speakerHole: {
    width: 6,
    height: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 3,
  },
});
