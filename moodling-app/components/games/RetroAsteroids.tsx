/**
 * Retro Asteroids Game
 *
 * Classic Asteroids with vintage vector graphics aesthetic.
 * Available as a skill in the Games category.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const HIGH_SCORE_KEY = 'mood_leaf_asteroids_high_score';

// Vector graphics colors (Asteroids arcade style)
const COLORS = {
  background: '#000000',
  vector: '#FFFFFF',
  vectorDim: 'rgba(255, 255, 255, 0.3)',
  glow: 'rgba(255, 255, 255, 0.5)',
  highlight: '#00FF00',
};

// Game constants
const SHIP_SIZE = 20;
const ASTEROID_SIZES = [40, 25, 15]; // Large, medium, small
const BULLET_SPEED = 8;
const SHIP_ROTATION_SPEED = 0.1;
const SHIP_THRUST = 0.15;
const MAX_SPEED = 5;
const FRICTION = 0.99;

interface Vector {
  x: number;
  y: number;
}

interface Ship {
  pos: Vector;
  vel: Vector;
  rotation: number;
}

interface Asteroid {
  id: number;
  pos: Vector;
  vel: Vector;
  size: number; // 0 = large, 1 = medium, 2 = small
  vertices: Vector[];
}

interface Bullet {
  id: number;
  pos: Vector;
  vel: Vector;
  life: number;
}

interface RetroAsteroidsProps {
  onClose?: () => void;
}

// Generate random asteroid shape (irregular polygon)
function generateAsteroidVertices(size: number): Vector[] {
  const vertices: Vector[] = [];
  const numVertices = 8 + Math.floor(Math.random() * 4);
  const radius = ASTEROID_SIZES[size];

  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * Math.PI * 2;
    const r = radius * (0.7 + Math.random() * 0.3);
    vertices.push({
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    });
  }
  return vertices;
}

export default function RetroAsteroids({ onClose }: RetroAsteroidsProps) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Game area dimensions
  const gameWidth = Math.min(screenWidth - 32, 360);
  const gameHeight = Math.min(screenHeight - 200, 500);

  // Game state
  const [ship, setShip] = useState<Ship>({
    pos: { x: gameWidth / 2, y: gameHeight / 2 },
    vel: { x: 0, y: 0 },
    rotation: -Math.PI / 2, // Pointing up
  });
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [isInvincible, setIsInvincible] = useState(false);
  const [isThrusting, setIsThrusting] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const asteroidIdRef = useRef(0);
  const bulletIdRef = useRef(0);
  const rotatingRef = useRef<'left' | 'right' | null>(null);
  const thrustingRef = useRef(false);

  // Load high score on mount
  useEffect(() => {
    AsyncStorage.getItem(HIGH_SCORE_KEY).then((stored) => {
      if (stored) setHighScore(parseInt(stored, 10));
    });
  }, []);

  // Save high score when it changes
  useEffect(() => {
    if (highScore > 0) {
      AsyncStorage.setItem(HIGH_SCORE_KEY, highScore.toString());
    }
  }, [highScore]);

  // Create initial asteroids
  const createAsteroids = useCallback(
    (count: number): Asteroid[] => {
      const newAsteroids: Asteroid[] = [];
      for (let i = 0; i < count; i++) {
        // Spawn away from center
        let x, y;
        do {
          x = Math.random() * gameWidth;
          y = Math.random() * gameHeight;
        } while (
          Math.hypot(x - gameWidth / 2, y - gameHeight / 2) < 100
        );

        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;

        newAsteroids.push({
          id: asteroidIdRef.current++,
          pos: { x, y },
          vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
          size: 0, // Start large
          vertices: generateAsteroidVertices(0),
        });
      }
      return newAsteroids;
    },
    [gameWidth, gameHeight]
  );

  // Start/restart game
  const startGame = useCallback(() => {
    setShip({
      pos: { x: gameWidth / 2, y: gameHeight / 2 },
      vel: { x: 0, y: 0 },
      rotation: -Math.PI / 2,
    });
    setAsteroids(createAsteroids(4));
    setBullets([]);
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setIsPlaying(true);
    setIsInvincible(true);
    setTimeout(() => setIsInvincible(false), 2000);
  }, [gameWidth, gameHeight, createAsteroids]);

  // Fire bullet
  const fireBullet = useCallback(() => {
    if (!isPlaying || gameOver) return;

    const bulletVel = {
      x: Math.cos(ship.rotation) * BULLET_SPEED + ship.vel.x,
      y: Math.sin(ship.rotation) * BULLET_SPEED + ship.vel.y,
    };

    setBullets((prev) => [
      ...prev,
      {
        id: bulletIdRef.current++,
        pos: {
          x: ship.pos.x + Math.cos(ship.rotation) * SHIP_SIZE,
          y: ship.pos.y + Math.sin(ship.rotation) * SHIP_SIZE,
        },
        vel: bulletVel,
        life: 60,
      },
    ]);
  }, [isPlaying, gameOver, ship]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameOver) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      return;
    }

    gameLoopRef.current = setInterval(() => {
      // Update ship
      setShip((prev) => {
        let newRotation = prev.rotation;
        let newVel = { ...prev.vel };

        // Rotation
        if (rotatingRef.current === 'left') {
          newRotation -= SHIP_ROTATION_SPEED;
        } else if (rotatingRef.current === 'right') {
          newRotation += SHIP_ROTATION_SPEED;
        }

        // Thrust
        if (thrustingRef.current) {
          newVel.x += Math.cos(prev.rotation) * SHIP_THRUST;
          newVel.y += Math.sin(prev.rotation) * SHIP_THRUST;

          // Limit speed
          const speed = Math.hypot(newVel.x, newVel.y);
          if (speed > MAX_SPEED) {
            newVel.x = (newVel.x / speed) * MAX_SPEED;
            newVel.y = (newVel.y / speed) * MAX_SPEED;
          }
        }

        // Apply friction
        newVel.x *= FRICTION;
        newVel.y *= FRICTION;

        // Update position with wrapping
        let newX = prev.pos.x + newVel.x;
        let newY = prev.pos.y + newVel.y;

        if (newX < 0) newX = gameWidth;
        if (newX > gameWidth) newX = 0;
        if (newY < 0) newY = gameHeight;
        if (newY > gameHeight) newY = 0;

        return {
          pos: { x: newX, y: newY },
          vel: newVel,
          rotation: newRotation,
        };
      });

      // Update bullets
      setBullets((prev) =>
        prev
          .map((b) => {
            let newX = b.pos.x + b.vel.x;
            let newY = b.pos.y + b.vel.y;

            // Wrap around
            if (newX < 0) newX = gameWidth;
            if (newX > gameWidth) newX = 0;
            if (newY < 0) newY = gameHeight;
            if (newY > gameHeight) newY = 0;

            return {
              ...b,
              pos: { x: newX, y: newY },
              life: b.life - 1,
            };
          })
          .filter((b) => b.life > 0)
      );

      // Update asteroids
      setAsteroids((prev) =>
        prev.map((a) => {
          let newX = a.pos.x + a.vel.x;
          let newY = a.pos.y + a.vel.y;

          // Wrap around
          if (newX < -50) newX = gameWidth + 50;
          if (newX > gameWidth + 50) newX = -50;
          if (newY < -50) newY = gameHeight + 50;
          if (newY > gameHeight + 50) newY = -50;

          return { ...a, pos: { x: newX, y: newY } };
        })
      );
    }, 16);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPlaying, gameOver, gameWidth, gameHeight]);

  // Collision detection
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    // Bullet-asteroid collisions
    bullets.forEach((bullet) => {
      asteroids.forEach((asteroid) => {
        const dist = Math.hypot(
          bullet.pos.x - asteroid.pos.x,
          bullet.pos.y - asteroid.pos.y
        );
        const asteroidRadius = ASTEROID_SIZES[asteroid.size];

        if (dist < asteroidRadius) {
          // Remove bullet
          setBullets((prev) => prev.filter((b) => b.id !== bullet.id));

          // Score
          const points = [20, 50, 100][asteroid.size];
          setScore((s) => {
            const newScore = s + points;
            setHighScore((hs) => Math.max(hs, newScore));
            return newScore;
          });

          // Split or remove asteroid
          if (asteroid.size < 2) {
            // Split into smaller asteroids
            const newSize = asteroid.size + 1;
            const newAsteroids: Asteroid[] = [];

            for (let i = 0; i < 2; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 1 + Math.random() * 2;
              newAsteroids.push({
                id: asteroidIdRef.current++,
                pos: { ...asteroid.pos },
                vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                size: newSize,
                vertices: generateAsteroidVertices(newSize),
              });
            }

            setAsteroids((prev) => [
              ...prev.filter((a) => a.id !== asteroid.id),
              ...newAsteroids,
            ]);
          } else {
            // Remove small asteroid
            setAsteroids((prev) => prev.filter((a) => a.id !== asteroid.id));
          }

          if (Platform.OS !== 'web') {
            Vibration.vibrate(30);
          }
        }
      });
    });

    // Ship-asteroid collision
    if (!isInvincible) {
      asteroids.forEach((asteroid) => {
        const dist = Math.hypot(
          ship.pos.x - asteroid.pos.x,
          ship.pos.y - asteroid.pos.y
        );
        const asteroidRadius = ASTEROID_SIZES[asteroid.size];

        if (dist < asteroidRadius + SHIP_SIZE / 2) {
          // Lose a life
          setLives((l) => {
            const newLives = l - 1;
            if (newLives <= 0) {
              setGameOver(true);
              setIsPlaying(false);
              if (Platform.OS !== 'web') {
                Vibration.vibrate([100, 50, 100, 50, 200]);
              }
            }
            return newLives;
          });

          // Reset ship position
          setShip({
            pos: { x: gameWidth / 2, y: gameHeight / 2 },
            vel: { x: 0, y: 0 },
            rotation: -Math.PI / 2,
          });

          setIsInvincible(true);
          setTimeout(() => setIsInvincible(false), 2000);

          if (Platform.OS !== 'web') {
            Vibration.vibrate(100);
          }
        }
      });
    }

    // Check level complete
    if (asteroids.length === 0 && isPlaying) {
      setLevel((l) => l + 1);
      setAsteroids(createAsteroids(4 + level));
    }
  }, [
    bullets,
    asteroids,
    ship,
    isPlaying,
    gameOver,
    isInvincible,
    gameWidth,
    gameHeight,
    level,
    createAsteroids,
  ]);

  // Render ship as triangle
  const renderShip = () => {
    return (
      <View
        key="ship"
        style={[
          styles.svgContainer,
          { opacity: isInvincible ? 0.5 : 1 },
        ]}
      >
        <View
          style={[
            styles.ship,
            {
              left: ship.pos.x - SHIP_SIZE,
              top: ship.pos.y - SHIP_SIZE,
              transform: [{ rotate: `${ship.rotation}rad` }],
            },
          ]}
        >
          <View style={styles.shipNose} />
          <View style={styles.shipBody} />
          {isThrusting && (
            <View style={styles.thrustFlame} />
          )}
        </View>
      </View>
    );
  };

  // Render asteroids
  const renderAsteroids = () => {
    return asteroids.map((asteroid) => {
      const radius = ASTEROID_SIZES[asteroid.size];
      return (
        <View
          key={asteroid.id}
          style={[
            styles.asteroid,
            {
              left: asteroid.pos.x - radius,
              top: asteroid.pos.y - radius,
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius * 0.8,
            },
          ]}
        />
      );
    });
  };

  // Render bullets
  const renderBullets = () => {
    return bullets.map((bullet) => (
      <View
        key={bullet.id}
        style={[
          styles.bullet,
          {
            left: bullet.pos.x - 2,
            top: bullet.pos.y - 2,
          },
        ]}
      />
    ));
  };

  return (
    <View style={styles.container}>
      {/* Arcade cabinet frame */}
      <View style={styles.cabinetFrame}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>ASTEROIDS</Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.vector} />
            </TouchableOpacity>
          )}
        </View>

        {/* Score & Lives */}
        <View style={styles.hud}>
          <View>
            <Text style={styles.hudText}>{score.toString().padStart(6, '0')}</Text>
            <Text style={styles.hudTextSmall}>HI: {highScore}</Text>
          </View>
          <View style={styles.livesContainer}>
            {[...Array(lives)].map((_, i) => (
              <View key={i} style={[styles.lifeIcon, i > 0 && styles.lifeIconMargin]} />
            ))}
          </View>
          <Text style={styles.hudText}>LVL {level}</Text>
        </View>

        {/* Game screen */}
        <View style={styles.screenBezel}>
          <View
            style={[
              styles.screen,
              { width: gameWidth, height: gameHeight },
            ]}
          >
            {/* Render game objects */}
            {isPlaying && (
              <>
                {renderAsteroids()}
                {renderBullets()}
                {renderShip()}
              </>
            )}

            {/* Start screen */}
            {!isPlaying && !gameOver && (
              <View style={styles.overlay}>
                <Text style={styles.overlayTitle}>ASTEROIDS</Text>
                <Text style={styles.overlayHint}>INSERT COIN</Text>
                <TouchableOpacity style={styles.startButton} onPress={startGame}>
                  <Text style={styles.startButtonText}>START</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Game over */}
            {gameOver && (
              <View style={styles.overlay}>
                <Text style={styles.overlayTitle}>GAME OVER</Text>
                <Text style={styles.finalScore}>SCORE: {score}</Text>
                <TouchableOpacity style={styles.startButton} onPress={startGame}>
                  <Text style={styles.startButtonText}>PLAY AGAIN</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.rotateControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPressIn={() => (rotatingRef.current = 'left')}
              onPressOut={() => (rotatingRef.current = null)}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-undo" size={24} color={COLORS.vector} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.rotateButtonMargin]}
              onPressIn={() => (rotatingRef.current = 'right')}
              onPressOut={() => (rotatingRef.current = null)}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-redo" size={24} color={COLORS.vector} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.controlButton, styles.thrustButton]}
            onPressIn={() => {
              thrustingRef.current = true;
              setIsThrusting(true);
            }}
            onPressOut={() => {
              thrustingRef.current = false;
              setIsThrusting(false);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="caret-up" size={28} color={COLORS.vector} />
            <Text style={styles.buttonLabel}>THRUST</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.fireButton]}
            onPress={fireBullet}
            activeOpacity={0.7}
          >
            <View style={styles.fireButtonInner} />
            <Text style={styles.buttonLabel}>FIRE</Text>
          </TouchableOpacity>
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
  cabinetFrame: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.vector,
    letterSpacing: 4,
  },
  closeButton: {
    padding: 4,
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  hudText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.vector,
    letterSpacing: 2,
  },
  hudTextSmall: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: COLORS.vectorDim,
  },
  livesContainer: {
    flexDirection: 'row',
  },
  lifeIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.vector,
    transform: [{ rotate: '-90deg' }],
  },
  lifeIconMargin: {
    marginLeft: 8,
  },
  screenBezel: {
    backgroundColor: '#000',
    borderRadius: 4,
    padding: 2,
  },
  screen: {
    backgroundColor: COLORS.background,
    overflow: 'hidden',
    position: 'relative',
  },
  svgContainer: {
    position: 'absolute',
  },
  ship: {
    position: 'absolute',
    width: SHIP_SIZE * 2,
    height: SHIP_SIZE * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shipNose: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.vector,
    transform: [{ rotate: '-90deg' }],
    position: 'absolute',
  },
  shipBody: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.background,
    position: 'absolute',
    marginLeft: -6,
  },
  thrustFlame: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.highlight,
    position: 'absolute',
    left: -14,
    transform: [{ rotate: '90deg' }],
  },
  asteroid: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.vector,
    backgroundColor: 'transparent',
  },
  bullet: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.vector,
    shadowColor: COLORS.vector,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.vector,
    letterSpacing: 4,
  },
  overlayHint: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: COLORS.vectorDim,
    marginTop: 12,
  },
  finalScore: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 20,
    color: COLORS.vector,
    marginTop: 12,
  },
  startButton: {
    marginTop: 24,
    backgroundColor: COLORS.vector,
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
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  rotateControls: {
    flexDirection: 'row',
  },
  rotateButtonMargin: {
    marginLeft: 8,
  },
  controlButton: {
    width: 50,
    height: 50,
    backgroundColor: '#333',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.vectorDim,
  },
  thrustButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  fireButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#440000',
    borderColor: '#880000',
  },
  fireButtonInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff0000',
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  buttonLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 8,
    color: COLORS.vectorDim,
    position: 'absolute',
    bottom: 4,
  },
});
