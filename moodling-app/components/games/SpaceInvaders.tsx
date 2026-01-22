/**
 * Space Invaders
 *
 * Classic retro arcade shooter with pixel art aesthetics.
 * Defend Earth from waves of alien invaders!
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
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_SCORE_KEY = 'mood_leaf_invaders_high_score';

// Retro colors
const COLORS = {
  bg: '#000',
  ship: '#00FF00',
  invader1: '#FF0000',
  invader2: '#FFFF00',
  invader3: '#00FFFF',
  bullet: '#FFFFFF',
  text: '#00FF00',
};

// Game constants
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 20;
const INVADER_WIDTH = 30;
const INVADER_HEIGHT = 20;
const BULLET_SIZE = 4;
const INVADER_ROWS = 4;
const INVADER_COLS = 8;

interface Invader {
  id: number;
  x: number;
  y: number;
  row: number;
  alive: boolean;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  isPlayer: boolean;
}

interface SpaceInvadersProps {
  onClose?: () => void;
}

export default function SpaceInvaders({ onClose }: SpaceInvadersProps) {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const gameWidth = Math.min(screenWidth - 32, 360);
  const gameHeight = Math.min(screenHeight - 200, 480);

  // Game state
  const [playerX, setPlayerX] = useState(gameWidth / 2 - PLAYER_WIDTH / 2);
  const [invaders, setInvaders] = useState<Invader[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [invaderDirection, setInvaderDirection] = useState(1);
  const [invaderSpeed, setInvaderSpeed] = useState(1);

  const bulletIdRef = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const invaderMoveRef = useRef<NodeJS.Timeout | null>(null);
  const playerXRef = useRef(playerX);
  const lastShotRef = useRef(0);

  playerXRef.current = playerX;

  // Load high score
  useEffect(() => {
    AsyncStorage.getItem(HIGH_SCORE_KEY).then((stored) => {
      if (stored) setHighScore(parseInt(stored, 10));
    });
  }, []);

  // Initialize invaders
  const initInvaders = useCallback((waveNum: number) => {
    const newInvaders: Invader[] = [];
    const startX = (gameWidth - INVADER_COLS * (INVADER_WIDTH + 10)) / 2;
    const startY = 60;

    for (let row = 0; row < INVADER_ROWS; row++) {
      for (let col = 0; col < INVADER_COLS; col++) {
        newInvaders.push({
          id: row * INVADER_COLS + col,
          x: startX + col * (INVADER_WIDTH + 10),
          y: startY + row * (INVADER_HEIGHT + 15),
          row,
          alive: true,
        });
      }
    }

    setInvaderSpeed(1 + (waveNum - 1) * 0.2);
    return newInvaders;
  }, [gameWidth]);

  // Initialize game
  const initGame = useCallback(() => {
    setPlayerX(gameWidth / 2 - PLAYER_WIDTH / 2);
    setInvaders(initInvaders(1));
    setBullets([]);
    setScore(0);
    setLives(3);
    setWave(1);
    setInvaderDirection(1);
    setGameOver(false);
    setIsPlaying(true);
  }, [gameWidth, initInvaders]);

  // Next wave
  const nextWave = useCallback(() => {
    setWave((w) => {
      const newWave = w + 1;
      setInvaders(initInvaders(newWave));
      setBullets([]);
      setInvaderDirection(1);
      return newWave;
    });
  }, [initInvaders]);

  // Shoot bullet
  const shoot = useCallback(() => {
    const now = Date.now();
    if (now - lastShotRef.current < 300) return; // Rate limit
    lastShotRef.current = now;

    const id = bulletIdRef.current++;
    setBullets((prev) => [
      ...prev,
      {
        id,
        x: playerXRef.current + PLAYER_WIDTH / 2 - BULLET_SIZE / 2,
        y: gameHeight - 60,
        isPlayer: true,
      },
    ]);

    if (Platform.OS !== 'web') {
      Vibration.vibrate(10);
    }
  }, [gameHeight]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameOver) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (invaderMoveRef.current) clearInterval(invaderMoveRef.current);
      return;
    }

    // Bullet movement
    gameLoopRef.current = setInterval(() => {
      setBullets((prev) => {
        let updated = prev.map((b) => ({
          ...b,
          y: b.isPlayer ? b.y - 8 : b.y + 4,
        }));

        // Remove off-screen bullets
        updated = updated.filter((b) => b.y > 0 && b.y < gameHeight);

        // Check player bullet collisions with invaders
        setInvaders((invaders) => {
          let hitAny = false;
          const newInvaders = invaders.map((inv) => {
            if (!inv.alive) return inv;

            const hit = updated.find(
              (b) =>
                b.isPlayer &&
                b.x >= inv.x &&
                b.x <= inv.x + INVADER_WIDTH &&
                b.y >= inv.y &&
                b.y <= inv.y + INVADER_HEIGHT
            );

            if (hit) {
              hitAny = true;
              updated = updated.filter((b) => b.id !== hit.id);
              setScore((s) => {
                const newScore = s + (INVADER_ROWS - inv.row) * 10;
                setHighScore((hs) => {
                  const newHigh = Math.max(hs, newScore);
                  if (newHigh > hs) {
                    AsyncStorage.setItem(HIGH_SCORE_KEY, newHigh.toString());
                  }
                  return newHigh;
                });
                return newScore;
              });
              return { ...inv, alive: false };
            }
            return inv;
          });

          if (hitAny && Platform.OS !== 'web') {
            Vibration.vibrate(30);
          }

          // Check if all invaders destroyed
          if (newInvaders.every((inv) => !inv.alive)) {
            nextWave();
          }

          return newInvaders;
        });

        // Check enemy bullet collision with player
        const playerHit = updated.find(
          (b) =>
            !b.isPlayer &&
            b.x >= playerXRef.current &&
            b.x <= playerXRef.current + PLAYER_WIDTH &&
            b.y >= gameHeight - 50
        );

        if (playerHit) {
          updated = updated.filter((b) => b.id !== playerHit.id);
          setLives((l) => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setGameOver(true);
              setIsPlaying(false);
              if (Platform.OS !== 'web') {
                Vibration.vibrate(300);
              }
            } else if (Platform.OS !== 'web') {
              Vibration.vibrate(100);
            }
            return newLives;
          });
        }

        return updated;
      });
    }, 30);

    // Invader movement
    invaderMoveRef.current = setInterval(() => {
      setInvaders((prev) => {
        const aliveInvaders = prev.filter((inv) => inv.alive);
        if (aliveInvaders.length === 0) return prev;

        const leftMost = Math.min(...aliveInvaders.map((inv) => inv.x));
        const rightMost = Math.max(...aliveInvaders.map((inv) => inv.x + INVADER_WIDTH));

        let newDirection = invaderDirection;
        let dropDown = false;

        if (rightMost >= gameWidth - 10 && invaderDirection > 0) {
          newDirection = -1;
          dropDown = true;
        } else if (leftMost <= 10 && invaderDirection < 0) {
          newDirection = 1;
          dropDown = true;
        }

        if (newDirection !== invaderDirection) {
          setInvaderDirection(newDirection);
        }

        // Check if invaders reached player
        const lowestY = Math.max(...aliveInvaders.map((inv) => inv.y + INVADER_HEIGHT));
        if (lowestY >= gameHeight - 70) {
          setGameOver(true);
          setIsPlaying(false);
          if (Platform.OS !== 'web') {
            Vibration.vibrate(300);
          }
          return prev;
        }

        // Random enemy shooting
        if (Math.random() < 0.02 * invaderSpeed) {
          const shooters = aliveInvaders.filter((inv) => inv.alive);
          if (shooters.length > 0) {
            const shooter = shooters[Math.floor(Math.random() * shooters.length)];
            const id = bulletIdRef.current++;
            setBullets((b) => [
              ...b,
              {
                id,
                x: shooter.x + INVADER_WIDTH / 2,
                y: shooter.y + INVADER_HEIGHT,
                isPlayer: false,
              },
            ]);
          }
        }

        return prev.map((inv) => ({
          ...inv,
          x: inv.x + newDirection * 5 * invaderSpeed,
          y: dropDown ? inv.y + 15 : inv.y,
        }));
      });
    }, 500 / invaderSpeed);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (invaderMoveRef.current) clearInterval(invaderMoveRef.current);
    };
  }, [isPlaying, gameOver, gameHeight, gameWidth, invaderDirection, invaderSpeed, nextWave]);

  // Touch controls
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        setPlayerX((prev) => {
          const newX = prev + gesture.dx * 0.3;
          return Math.max(0, Math.min(gameWidth - PLAYER_WIDTH, newX));
        });
      },
      onPanResponderRelease: () => {
        shoot();
      },
    })
  ).current;

  const getInvaderColor = (row: number) => {
    if (row === 0) return COLORS.invader1;
    if (row === 1) return COLORS.invader2;
    return COLORS.invader3;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={styles.waveContainer}>
          <Text style={styles.waveText}>WAVE {wave}</Text>
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
        {...panResponder.panHandlers}
      >
        {/* Stars background */}
        {[...Array(30)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: Math.random() * gameWidth,
                top: Math.random() * gameHeight,
                opacity: Math.random() * 0.5 + 0.2,
              },
            ]}
          />
        ))}

        {/* Invaders */}
        {invaders.map((invader) =>
          invader.alive ? (
            <View
              key={invader.id}
              style={[
                styles.invader,
                {
                  left: invader.x,
                  top: invader.y,
                  backgroundColor: getInvaderColor(invader.row),
                },
              ]}
            >
              <View style={styles.invaderEye} />
              <View style={[styles.invaderEye, styles.invaderEyeRight]} />
            </View>
          ) : null
        )}

        {/* Bullets */}
        {bullets.map((bullet) => (
          <View
            key={bullet.id}
            style={[
              styles.bullet,
              {
                left: bullet.x,
                top: bullet.y,
                backgroundColor: bullet.isPlayer ? COLORS.bullet : COLORS.invader1,
              },
            ]}
          />
        ))}

        {/* Player ship */}
        <View style={[styles.player, { left: playerX, top: gameHeight - 50 }]}>
          <View style={styles.playerCannon} />
        </View>

        {/* Game over overlay */}
        {gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>GAME OVER</Text>
            <Text style={styles.overlayScore}>Score: {score}</Text>
            <Text style={styles.overlayWave}>Wave: {wave}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={initGame}>
              <Text style={styles.retryText}>PLAY AGAIN</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Start screen */}
        {!isPlaying && !gameOver && (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>SPACE INVADERS</Text>
            <Text style={styles.overlayHint}>Drag to move, release to shoot</Text>
            <TouchableOpacity style={styles.retryButton} onPress={initGame}>
              <Text style={styles.retryText}>START</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Fire button */}
      {isPlaying && (
        <TouchableOpacity style={styles.fireButton} onPress={shoot}>
          <Text style={styles.fireText}>FIRE</Text>
        </TouchableOpacity>
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
    paddingBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    color: COLORS.text,
    opacity: 0.7,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  waveContainer: {
    alignItems: 'center',
  },
  waveText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  livesContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  life: {
    width: 20,
    height: 10,
    backgroundColor: COLORS.ship,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
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
    backgroundColor: '#000',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: COLORS.text,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  invader: {
    position: 'absolute',
    width: INVADER_WIDTH,
    height: INVADER_HEIGHT,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  invaderEye: {
    width: 4,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
    marginRight: 6,
  },
  invaderEyeRight: {
    marginRight: 0,
    marginLeft: 6,
  },
  bullet: {
    position: 'absolute',
    width: BULLET_SIZE,
    height: BULLET_SIZE * 3,
    borderRadius: 2,
  },
  player: {
    position: 'absolute',
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    backgroundColor: COLORS.ship,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    alignItems: 'center',
  },
  playerCannon: {
    width: 4,
    height: 10,
    backgroundColor: COLORS.ship,
    position: 'absolute',
    top: -8,
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
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
  },
  overlayScore: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 8,
  },
  overlayWave: {
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
    backgroundColor: COLORS.ship,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 4,
  },
  retryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  fireButton: {
    marginTop: 20,
    backgroundColor: COLORS.ship,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 8,
  },
  fireText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
