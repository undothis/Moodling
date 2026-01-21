/**
 * Retro Pong Game
 *
 * Classic Pong with vintage CRT aesthetics.
 * Full-screen paddles that span across the play area.
 * Access via /pong Easter egg command.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Classic arcade colors
const COLORS = {
  background: '#000000',
  foreground: '#33FF33', // Phosphor green
  dimGreen: '#1a661a',
  scanline: 'rgba(0, 0, 0, 0.15)',
  glow: 'rgba(51, 255, 51, 0.3)',
};

// Game constants
const BALL_SIZE = 12;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const BALL_SPEED = 4;
const PADDLE_SPEED = 8;
const WIN_SCORE = 5;

interface RetroPongProps {
  onClose?: () => void;
}

export default function RetroPong({ onClose }: RetroPongProps) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Game area dimensions
  const gameWidth = Math.min(screenWidth - 32, 360);
  const gameHeight = Math.min(screenHeight - 200, 480);

  // State
  const [playerY, setPlayerY] = useState(gameHeight / 2 - PADDLE_HEIGHT / 2);
  const [aiY, setAiY] = useState(gameHeight / 2 - PADDLE_HEIGHT / 2);
  const [ballX, setBallX] = useState(gameWidth / 2 - BALL_SIZE / 2);
  const [ballY, setBallY] = useState(gameHeight / 2 - BALL_SIZE / 2);
  const [ballVelX, setBallVelX] = useState(BALL_SPEED);
  const [ballVelY, setBallVelY] = useState(BALL_SPEED * 0.5);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [showServe, setShowServe] = useState(true);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const aiMoveRef = useRef<NodeJS.Timeout | null>(null);

  // Touch handling for player paddle
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (!isPlaying) return;

        setPlayerY((prev) => {
          const newY = prev + gestureState.dy * 0.1;
          return Math.max(0, Math.min(gameHeight - PADDLE_HEIGHT, newY));
        });
      },
    })
  ).current;

  // Reset ball to center
  const resetBall = useCallback(
    (direction: 1 | -1) => {
      setBallX(gameWidth / 2 - BALL_SIZE / 2);
      setBallY(gameHeight / 2 - BALL_SIZE / 2);
      setBallVelX(BALL_SPEED * direction);
      setBallVelY((Math.random() - 0.5) * BALL_SPEED);
      setShowServe(true);
    },
    [gameWidth, gameHeight]
  );

  // Start game
  const startGame = useCallback(() => {
    setPlayerScore(0);
    setAiScore(0);
    setPlayerY(gameHeight / 2 - PADDLE_HEIGHT / 2);
    setAiY(gameHeight / 2 - PADDLE_HEIGHT / 2);
    resetBall(1);
    setGameOver(false);
    setWinner(null);
    setIsPlaying(true);
    setShowServe(false);
  }, [gameHeight, resetBall]);

  // Serve ball
  const serveBall = useCallback(() => {
    setShowServe(false);
  }, []);

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameOver || showServe) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      return;
    }

    gameLoopRef.current = setInterval(() => {
      setBallX((prevX) => {
        const newX = prevX + ballVelX;

        // Check paddle collisions
        // Player paddle (left side)
        if (
          newX <= PADDLE_WIDTH + 20 &&
          ballY + BALL_SIZE >= playerY &&
          ballY <= playerY + PADDLE_HEIGHT
        ) {
          // Calculate angle based on where ball hit paddle
          const hitPoint = (ballY + BALL_SIZE / 2 - playerY) / PADDLE_HEIGHT;
          const angle = (hitPoint - 0.5) * 1.5;
          setBallVelX(Math.abs(ballVelX) * 1.02); // Speed up slightly
          setBallVelY(angle * BALL_SPEED * 1.5);
          if (Platform.OS !== 'web') {
            Vibration.vibrate(30);
          }
          return PADDLE_WIDTH + 21;
        }

        // AI paddle (right side)
        if (
          newX + BALL_SIZE >= gameWidth - PADDLE_WIDTH - 20 &&
          ballY + BALL_SIZE >= aiY &&
          ballY <= aiY + PADDLE_HEIGHT
        ) {
          const hitPoint = (ballY + BALL_SIZE / 2 - aiY) / PADDLE_HEIGHT;
          const angle = (hitPoint - 0.5) * 1.5;
          setBallVelX(-Math.abs(ballVelX) * 1.02);
          setBallVelY(angle * BALL_SPEED * 1.5);
          if (Platform.OS !== 'web') {
            Vibration.vibrate(30);
          }
          return gameWidth - PADDLE_WIDTH - 21 - BALL_SIZE;
        }

        // Score detection
        if (newX < 0) {
          // AI scores
          setAiScore((s) => {
            const newScore = s + 1;
            if (newScore >= WIN_SCORE) {
              setGameOver(true);
              setIsPlaying(false);
              setWinner('ai');
            }
            return newScore;
          });
          resetBall(1);
          return gameWidth / 2 - BALL_SIZE / 2;
        }

        if (newX + BALL_SIZE > gameWidth) {
          // Player scores
          setPlayerScore((s) => {
            const newScore = s + 1;
            if (newScore >= WIN_SCORE) {
              setGameOver(true);
              setIsPlaying(false);
              setWinner('player');
              if (Platform.OS !== 'web') {
                Vibration.vibrate([100, 50, 100, 50, 100]);
              }
            }
            return newScore;
          });
          resetBall(-1);
          return gameWidth / 2 - BALL_SIZE / 2;
        }

        return newX;
      });

      setBallY((prevY) => {
        let newY = prevY + ballVelY;

        // Top/bottom wall collision
        if (newY <= 0) {
          newY = 0;
          setBallVelY((v) => Math.abs(v));
        }
        if (newY + BALL_SIZE >= gameHeight) {
          newY = gameHeight - BALL_SIZE;
          setBallVelY((v) => -Math.abs(v));
        }

        return newY;
      });
    }, 16);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [
    isPlaying,
    gameOver,
    showServe,
    ballVelX,
    ballVelY,
    playerY,
    aiY,
    ballY,
    gameWidth,
    gameHeight,
    resetBall,
  ]);

  // AI movement
  useEffect(() => {
    if (!isPlaying || gameOver || showServe) {
      if (aiMoveRef.current) {
        clearInterval(aiMoveRef.current);
      }
      return;
    }

    aiMoveRef.current = setInterval(() => {
      setAiY((prevY) => {
        const paddleCenter = prevY + PADDLE_HEIGHT / 2;
        const ballCenter = ballY + BALL_SIZE / 2;
        const diff = ballCenter - paddleCenter;

        // Add some imperfection to make AI beatable
        const reaction = PADDLE_SPEED * 0.7;
        const randomness = (Math.random() - 0.5) * 2;

        if (Math.abs(diff) > 10) {
          const move = Math.sign(diff) * Math.min(reaction, Math.abs(diff)) + randomness;
          const newY = prevY + move;
          return Math.max(0, Math.min(gameHeight - PADDLE_HEIGHT, newY));
        }
        return prevY;
      });
    }, 50);

    return () => {
      if (aiMoveRef.current) {
        clearInterval(aiMoveRef.current);
      }
    };
  }, [isPlaying, gameOver, showServe, ballY, gameHeight]);

  // Player paddle control buttons
  const movePlayer = (direction: 'up' | 'down') => {
    if (!isPlaying) return;
    setPlayerY((prev) => {
      const newY = prev + (direction === 'up' ? -PADDLE_SPEED * 2 : PADDLE_SPEED * 2);
      return Math.max(0, Math.min(gameHeight - PADDLE_HEIGHT, newY));
    });
  };

  // Render scanlines for CRT effect
  const renderScanlines = () => {
    const lines = [];
    for (let i = 0; i < gameHeight; i += 3) {
      lines.push(
        <View
          key={i}
          style={[
            styles.scanline,
            { top: i, width: gameWidth },
          ]}
        />
      );
    }
    return lines;
  };

  return (
    <View style={styles.container}>
      {/* CRT Monitor Frame */}
      <View style={styles.monitorFrame}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>PONG</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
          )}
        </View>

        {/* CRT Screen */}
        <View style={styles.screenBezel}>
          <View
            style={[
              styles.screen,
              { width: gameWidth, height: gameHeight },
            ]}
            {...panResponder.panHandlers}
          >
            {/* Scanlines */}
            {renderScanlines()}

            {/* Center line */}
            <View style={[styles.centerLine, { height: gameHeight }]} />

            {/* Score */}
            <View style={styles.scoreContainer}>
              <Text style={styles.score}>{playerScore}</Text>
              <Text style={styles.score}>{aiScore}</Text>
            </View>

            {/* Player paddle (left) */}
            <View
              style={[
                styles.paddle,
                {
                  left: 20,
                  top: playerY,
                  height: PADDLE_HEIGHT,
                  width: PADDLE_WIDTH,
                },
              ]}
            />

            {/* AI paddle (right) */}
            <View
              style={[
                styles.paddle,
                {
                  right: 20,
                  top: aiY,
                  height: PADDLE_HEIGHT,
                  width: PADDLE_WIDTH,
                },
              ]}
            />

            {/* Ball */}
            <View
              style={[
                styles.ball,
                {
                  left: ballX,
                  top: ballY,
                  width: BALL_SIZE,
                  height: BALL_SIZE,
                },
              ]}
            />

            {/* Start screen */}
            {!isPlaying && !gameOver && (
              <View style={styles.overlay}>
                <Text style={styles.overlayTitle}>PONG</Text>
                <Text style={styles.overlaySubtitle}>First to {WIN_SCORE} wins</Text>
                <TouchableOpacity style={styles.startButton} onPress={startGame}>
                  <Text style={styles.startButtonText}>START</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Serve prompt */}
            {isPlaying && showServe && (
              <View style={styles.overlay}>
                <TouchableOpacity onPress={serveBall}>
                  <Text style={styles.serveText}>TAP TO SERVE</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Game over */}
            {gameOver && (
              <View style={styles.overlay}>
                <Text style={styles.overlayTitle}>
                  {winner === 'player' ? 'YOU WIN!' : 'GAME OVER'}
                </Text>
                <Text style={styles.finalScore}>
                  {playerScore} - {aiScore}
                </Text>
                <TouchableOpacity style={styles.startButton} onPress={startGame}>
                  <Text style={styles.startButtonText}>PLAY AGAIN</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPressIn={() => movePlayer('up')}
            activeOpacity={0.7}
          >
            <Ionicons name="caret-up" size={32} color={COLORS.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPressIn={() => movePlayer('down')}
            activeOpacity={0.7}
          >
            <Ionicons name="caret-down" size={32} color={COLORS.foreground} />
          </TouchableOpacity>
          <Text style={styles.controlHint}>or drag screen</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monitorFrame: {
    backgroundColor: '#222',
    borderRadius: 20,
    padding: 16,
    borderWidth: 3,
    borderColor: '#333',
    shadowColor: COLORS.foreground,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.foreground,
    letterSpacing: 4,
    textShadowColor: COLORS.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  closeButton: {
    padding: 4,
  },
  screenBezel: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 4,
    borderWidth: 2,
    borderColor: '#111',
  },
  screen: {
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  scanline: {
    position: 'absolute',
    height: 1,
    backgroundColor: COLORS.scanline,
    zIndex: 10,
  },
  centerLine: {
    position: 'absolute',
    left: '50%',
    width: 2,
    backgroundColor: COLORS.dimGreen,
    opacity: 0.5,
  },
  scoreContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 5,
  },
  score: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.foreground,
    opacity: 0.3,
    textShadowColor: COLORS.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  paddle: {
    position: 'absolute',
    backgroundColor: COLORS.foreground,
    shadowColor: COLORS.foreground,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  ball: {
    position: 'absolute',
    backgroundColor: COLORS.foreground,
    borderRadius: BALL_SIZE / 2,
    shadowColor: COLORS.foreground,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  overlayTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.foreground,
    letterSpacing: 4,
    textShadowColor: COLORS.glow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  overlaySubtitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: COLORS.dimGreen,
    marginTop: 8,
  },
  finalScore: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 24,
    color: COLORS.foreground,
    marginTop: 12,
  },
  serveText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 18,
    color: COLORS.foreground,
    letterSpacing: 2,
    opacity: 0.8,
  },
  startButton: {
    marginTop: 24,
    backgroundColor: COLORS.foreground,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
  },
  startButtonText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
    letterSpacing: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    backgroundColor: '#333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.dimGreen,
  },
  controlHint: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: COLORS.dimGreen,
    marginLeft: 12,
  },
});
