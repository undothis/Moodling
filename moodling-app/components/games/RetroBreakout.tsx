/**
 * Retro Breakout
 *
 * Classic brick-breaking arcade game with vintage CRT aesthetics.
 * Features colorful bricks, paddle control, and increasing difficulty.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORE_KEY = 'mood_leaf_breakout_high_score';

// CRT-style colors
const COLORS = {
  background: '#0a0a0a',
  screen: '#111',
  paddle: '#4ECDC4',
  ball: '#fff',
  text: '#4ECDC4',
  brickColors: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#95E1D3', '#A8E6CF', '#DDA0DD'],
};

// Game constants
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_SIZE = 10;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 4;
const GAME_SPEED = 16; // ~60fps

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  active: boolean;
  points: number;
}

interface RetroBreakoutProps {
  onClose?: () => void;
}

export default function RetroBreakout({ onClose }: RetroBreakoutProps) {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Game area dimensions
  const gameWidth = Math.min(screenWidth - 32, 360);
  const gameHeight = Math.min(screenHeight - 200, 500);
  const brickWidth = (gameWidth - BRICK_GAP * (BRICK_COLS + 1)) / BRICK_COLS;

  // Game state
  const [paddleX, setPaddleX] = useState(gameWidth / 2 - PADDLE_WIDTH / 2);
  const [ballPos, setBallPos] = useState({ x: gameWidth / 2, y: gameHeight - 80 });
  const [ballVel, setBallVel] = useState({ x: 3, y: -3 });
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const ballPosRef = useRef(ballPos);
  const ballVelRef = useRef(ballVel);
  const paddleXRef = useRef(paddleX);
  const bricksRef = useRef(bricks);

  // Keep refs in sync
  ballPosRef.current = ballPos;
  ballVelRef.current = ballVel;
  paddleXRef.current = paddleX;
  bricksRef.current = bricks;

  // Load high score
  useEffect(() => {
    AsyncStorage.getItem(HIGH_SCORE_KEY).then((stored) => {
      if (stored) setHighScore(parseInt(stored, 10));
    });
  }, []);

  // Initialize bricks
  const initBricks = useCallback(() => {
    const newBricks: Brick[] = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          x: BRICK_GAP + col * (brickWidth + BRICK_GAP),
          y: 60 + row * (BRICK_HEIGHT + BRICK_GAP),
          width: brickWidth,
          height: BRICK_HEIGHT,
          color: COLORS.brickColors[row % COLORS.brickColors.length],
          active: true,
          points: (BRICK_ROWS - row) * 10, // Higher rows worth more
        });
      }
    }
    return newBricks;
  }, [brickWidth]);

  // Initialize game
  const initGame = useCallback(() => {
    setPaddleX(gameWidth / 2 - PADDLE_WIDTH / 2);
    setBallPos({ x: gameWidth / 2, y: gameHeight - 80 });

    // Random initial direction
    const angle = (Math.random() * 60 + 60) * (Math.PI / 180); // 60-120 degrees
    const speed = 4 + level * 0.5;
    setBallVel({
      x: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      y: -Math.abs(Math.sin(angle) * speed),
    });

    setBricks(initBricks());
    setScore(0);
    setLives(3);
    setGameOver(false);
    setLevel(1);
    setIsPlaying(true);
  }, [gameWidth, gameHeight, initBricks, level]);

  // Next level
  const nextLevel = useCallback(() => {
    setLevel((l) => l + 1);
    setBallPos({ x: gameWidth / 2, y: gameHeight - 80 });

    const speed = 4 + (level + 1) * 0.5;
    const angle = (Math.random() * 60 + 60) * (Math.PI / 180);
    setBallVel({
      x: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
      y: -Math.abs(Math.sin(angle) * speed),
    });

    setBricks(initBricks());
  }, [gameWidth, gameHeight, initBricks, level]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameOver) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      return;
    }

    gameLoopRef.current = setInterval(() => {
      const currentBall = ballPosRef.current;
      const currentVel = ballVelRef.current;
      const currentPaddle = paddleXRef.current;
      const currentBricks = bricksRef.current;

      let newX = currentBall.x + currentVel.x;
      let newY = currentBall.y + currentVel.y;
      let newVelX = currentVel.x;
      let newVelY = currentVel.y;

      // Wall collisions
      if (newX <= 0 || newX >= gameWidth - BALL_SIZE) {
        newVelX = -newVelX;
        newX = Math.max(0, Math.min(gameWidth - BALL_SIZE, newX));
      }
      if (newY <= 0) {
        newVelY = -newVelY;
        newY = 0;
      }

      // Paddle collision
      const paddleTop = gameHeight - 40;
      if (
        newY >= paddleTop - BALL_SIZE &&
        newY <= paddleTop &&
        newX >= currentPaddle - BALL_SIZE / 2 &&
        newX <= currentPaddle + PADDLE_WIDTH + BALL_SIZE / 2
      ) {
        // Calculate hit position for angle
        const hitPos = (newX - currentPaddle) / PADDLE_WIDTH;
        const angle = (hitPos - 0.5) * 120 * (Math.PI / 180); // -60 to 60 degrees
        const speed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);

        newVelX = Math.sin(angle) * speed;
        newVelY = -Math.abs(Math.cos(angle) * speed);
        newY = paddleTop - BALL_SIZE;

        if (Platform.OS !== 'web') {
          Vibration.vibrate(20);
        }
      }

      // Brick collisions
      let hitBrick = false;
      const updatedBricks = currentBricks.map((brick) => {
        if (!brick.active) return brick;

        if (
          newX + BALL_SIZE > brick.x &&
          newX < brick.x + brick.width &&
          newY + BALL_SIZE > brick.y &&
          newY < brick.y + brick.height
        ) {
          hitBrick = true;

          // Determine collision side
          const overlapLeft = newX + BALL_SIZE - brick.x;
          const overlapRight = brick.x + brick.width - newX;
          const overlapTop = newY + BALL_SIZE - brick.y;
          const overlapBottom = brick.y + brick.height - newY;

          const minOverlapX = Math.min(overlapLeft, overlapRight);
          const minOverlapY = Math.min(overlapTop, overlapBottom);

          if (minOverlapX < minOverlapY) {
            newVelX = -newVelX;
          } else {
            newVelY = -newVelY;
          }

          setScore((s) => {
            const newScore = s + brick.points;
            setHighScore((hs) => {
              const newHigh = Math.max(hs, newScore);
              if (newHigh > hs) {
                AsyncStorage.setItem(HIGH_SCORE_KEY, newHigh.toString());
              }
              return newHigh;
            });
            return newScore;
          });

          if (Platform.OS !== 'web') {
            Vibration.vibrate(30);
          }

          return { ...brick, active: false };
        }
        return brick;
      });

      if (hitBrick) {
        setBricks(updatedBricks);

        // Check if level complete
        if (updatedBricks.every((b) => !b.active)) {
          nextLevel();
          return;
        }
      }

      // Ball lost
      if (newY > gameHeight) {
        setLives((l) => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setGameOver(true);
            setIsPlaying(false);
            if (Platform.OS !== 'web') {
              Vibration.vibrate(200);
            }
          } else {
            // Reset ball
            setBallPos({ x: gameWidth / 2, y: gameHeight - 80 });
            const speed = 4 + level * 0.5;
            const angle = (Math.random() * 60 + 60) * (Math.PI / 180);
            setBallVel({
              x: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
              y: -Math.abs(Math.sin(angle) * speed),
            });
          }
          return newLives;
        });
        return;
      }

      setBallPos({ x: newX, y: newY });
      setBallVel({ x: newVelX, y: newVelY });
    }, GAME_SPEED);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPlaying, gameOver, gameWidth, gameHeight, level, nextLevel]);

  // Paddle control
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      const newX = Math.max(
        0,
        Math.min(gameWidth - PADDLE_WIDTH, paddleXRef.current + gesture.dx * 0.5)
      );
      setPaddleX(newX);
    },
  });

  // Touch to move paddle
  const handleTouch = (evt: any) => {
    if (!isPlaying) return;
    const touchX = evt.nativeEvent.locationX;
    const newX = Math.max(0, Math.min(gameWidth - PADDLE_WIDTH, touchX - PADDLE_WIDTH / 2));
    setPaddleX(newX);
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
              <View key={i} style={[styles.life, i > 0 && styles.lifeMargin]} />
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
      <View
        style={[styles.gameArea, { width: gameWidth, height: gameHeight }]}
        onTouchMove={handleTouch}
        onTouchStart={handleTouch}
        {...panResponder.panHandlers}
      >
        {/* Scanline effect */}
        <View style={styles.scanlines} pointerEvents="none" />

        {/* Bricks */}
        {bricks.map((brick, index) =>
          brick.active ? (
            <View
              key={index}
              style={[
                styles.brick,
                {
                  left: brick.x,
                  top: brick.y,
                  width: brick.width,
                  height: brick.height,
                  backgroundColor: brick.color,
                },
              ]}
            />
          ) : null
        )}

        {/* Ball */}
        <View
          style={[
            styles.ball,
            {
              left: ballPos.x,
              top: ballPos.y,
            },
          ]}
        />

        {/* Paddle */}
        <View
          style={[
            styles.paddle,
            {
              left: paddleX,
              top: gameHeight - 40,
            },
          ]}
        />

        {/* Game over overlay */}
        {gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>GAME OVER</Text>
            <Text style={styles.overlayScore}>Score: {score}</Text>
            <Text style={styles.overlayLevel}>Level: {level}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={initGame}>
              <Text style={styles.retryText}>PLAY AGAIN</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Start screen */}
        {!isPlaying && !gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>BREAKOUT</Text>
            <Text style={styles.overlayHint}>Touch to move paddle</Text>
            <TouchableOpacity style={styles.retryButton} onPress={initGame}>
              <Text style={styles.retryText}>START</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
  life: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
  },
  lifeMargin: {
    marginLeft: 4,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 60 : 40,
    padding: 8,
  },
  gameArea: {
    backgroundColor: COLORS.screen,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#222',
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.1,
  },
  brick: {
    position: 'absolute',
    borderRadius: 2,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  ball: {
    position: 'absolute',
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: COLORS.ball,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  paddle: {
    position: 'absolute',
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    borderRadius: 4,
    backgroundColor: COLORS.paddle,
    shadowColor: COLORS.paddle,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
  },
  overlayScore: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 8,
  },
  overlayLevel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  overlayHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.paddle,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});
