/**
 * Sand Flow
 *
 * Relaxing falling sand simulation.
 * Watch particles flow and accumulate in a meditative display.
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

// Sand color palettes
const SAND_PALETTES = {
  desert: ['#F4A460', '#DEB887', '#D2B48C', '#CD853F', '#BC8F8F'],
  ocean: ['#40E0D0', '#48D1CC', '#00CED1', '#20B2AA', '#5F9EA0'],
  sunset: ['#FF6B6B', '#FFA07A', '#FFD700', '#FF8C00', '#FF4500'],
  forest: ['#228B22', '#32CD32', '#90EE90', '#98FB98', '#00FA9A'],
  galaxy: ['#9370DB', '#8A2BE2', '#9400D3', '#BA55D3', '#DDA0DD'],
};

type SandPalette = keyof typeof SAND_PALETTES;

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  settled: boolean;
}

interface SandFlowProps {
  onClose?: () => void;
}

const GRAVITY = 0.3;
const FRICTION = 0.98;
const MAX_PARTICLES = 500;
const PARTICLE_SIZE = 4;

export default function SandFlow({ onClose }: SandFlowProps) {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const gameWidth = screenWidth - 32;
  const gameHeight = screenHeight - 280;

  const [palette, setPalette] = useState<SandPalette>('desert');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isPouring, setIsPouring] = useState(false);
  const [pourPosition, setPourPosition] = useState({ x: gameWidth / 2, y: 0 });
  const [particleCount, setParticleCount] = useState(0);

  const particleIdRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isPouringRef = useRef(false);
  const pourPositionRef = useRef(pourPosition);

  particlesRef.current = particles;
  isPouringRef.current = isPouring;
  pourPositionRef.current = pourPosition;

  const currentColors = SAND_PALETTES[palette];

  // Create new particle
  const createParticle = useCallback((x: number, y: number) => {
    const id = particleIdRef.current++;
    const color = currentColors[Math.floor(Math.random() * currentColors.length)];
    const spread = (Math.random() - 0.5) * 20;

    return {
      id,
      x: x + spread,
      y,
      vx: spread * 0.1,
      vy: Math.random() * 2,
      color,
      size: PARTICLE_SIZE + Math.random() * 2,
      settled: false,
    };
  }, [currentColors]);

  // Physics simulation
  const updatePhysics = useCallback(() => {
    setParticles((prevParticles) => {
      let newParticles = [...prevParticles];

      // Add new particles if pouring
      if (isPouringRef.current && newParticles.length < MAX_PARTICLES) {
        for (let i = 0; i < 3; i++) {
          newParticles.push(
            createParticle(pourPositionRef.current.x, pourPositionRef.current.y)
          );
        }
      }

      // Update particle positions
      newParticles = newParticles.map((p) => {
        if (p.settled) return p;

        let { x, y, vx, vy } = p;

        // Apply gravity
        vy += GRAVITY;

        // Apply friction
        vx *= FRICTION;

        // Update position
        x += vx;
        y += vy;

        // Wall collisions
        if (x < 0) {
          x = 0;
          vx = -vx * 0.5;
        }
        if (x > gameWidth - p.size) {
          x = gameWidth - p.size;
          vx = -vx * 0.5;
        }

        // Floor collision
        if (y >= gameHeight - p.size) {
          y = gameHeight - p.size;
          vy = 0;
          vx = 0;

          // Check if particle is settled
          const nearbySettled = newParticles.filter(
            (other) =>
              other.settled &&
              Math.abs(other.x - x) < p.size * 2 &&
              Math.abs(other.y - y) < p.size * 2
          );

          if (nearbySettled.length > 0) {
            // Stack on top of other particles
            const topY = Math.min(...nearbySettled.map((o) => o.y));
            if (y >= topY - p.size) {
              y = topY - p.size;
            }
          }

          return { ...p, x, y, vx, vy, settled: true };
        }

        // Particle-particle collision (simplified)
        for (const other of newParticles) {
          if (other.id === p.id || !other.settled) continue;

          const dx = x - other.x;
          const dy = y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < p.size + other.size) {
            // Push apart
            const overlap = (p.size + other.size - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;

            x += nx * overlap;
            y += ny * overlap;
            vx += nx * 0.5;
            vy = Math.min(vy, 0);
          }
        }

        return { ...p, x, y, vx, vy };
      });

      // Remove particles that are too far
      newParticles = newParticles.filter(
        (p) => p.y < gameHeight + 100 && p.x > -100 && p.x < gameWidth + 100
      );

      setParticleCount(newParticles.length);
      return newParticles;
    });

    animationRef.current = requestAnimationFrame(updatePhysics);
  }, [gameWidth, gameHeight, createParticle]);

  // Start physics loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updatePhysics]);

  // Pan responder for pouring
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setPourPosition({ x: locationX, y: Math.min(locationY, 50) });
        setIsPouring(true);
        if (Platform.OS !== 'web') {
          Vibration.vibrate(20);
        }
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setPourPosition({ x: locationX, y: Math.min(locationY, 50) });
      },
      onPanResponderRelease: () => {
        setIsPouring(false);
      },
    })
  ).current;

  // Clear all particles
  const clearParticles = useCallback(() => {
    setParticles([]);
    setParticleCount(0);
    if (Platform.OS !== 'web') {
      Vibration.vibrate(50);
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Sand Flow</Text>
          <Text style={styles.subtitle}>Touch to pour sand</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Palette selector */}
      <View style={styles.paletteContainer}>
        {(Object.keys(SAND_PALETTES) as SandPalette[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.paletteButton,
              palette === p && styles.paletteButtonActive,
            ]}
            onPress={() => setPalette(p)}
          >
            <View style={styles.paletteColors}>
              {SAND_PALETTES[p].slice(0, 3).map((color, i) => (
                <View
                  key={i}
                  style={[styles.paletteColor, { backgroundColor: color }]}
                />
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sand container */}
      <View
        style={[styles.sandContainer, { width: gameWidth, height: gameHeight }]}
        {...panResponder.panHandlers}
      >
        {/* Pour indicator */}
        {isPouring && (
          <View
            style={[
              styles.pourIndicator,
              { left: pourPosition.x - 10, top: pourPosition.y },
            ]}
          >
            <View style={[styles.pourStream, { backgroundColor: currentColors[0] }]} />
          </View>
        )}

        {/* Particles */}
        {particles.map((particle) => (
          <View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                borderRadius: particle.size / 2,
              },
            ]}
          />
        ))}

        {/* Empty state */}
        {particleCount === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="finger-print" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>Touch and hold to pour sand</Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.counter}>
          <Ionicons name="ellipse" size={12} color={currentColors[0]} />
          <Text style={styles.counterText}>{particleCount} particles</Text>
        </View>

        <TouchableOpacity style={styles.clearButton} onPress={clearParticles}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipText}>
          🏖️ Move your finger to control where the sand falls
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  paletteContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  paletteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#334155',
  },
  paletteButtonActive: {
    backgroundColor: '#475569',
    borderWidth: 2,
    borderColor: '#fff',
  },
  paletteColors: {
    flexDirection: 'row',
  },
  paletteColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 1,
  },
  sandContainer: {
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#334155',
  },
  pourIndicator: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  pourStream: {
    width: 4,
    height: 30,
    borderRadius: 2,
  },
  particle: {
    position: 'absolute',
  },
  emptyState: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 14,
    color: '#94A3B8',
    marginLeft: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  clearText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 6,
    fontWeight: '600',
  },
  tipsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: '#334155',
    borderRadius: 12,
  },
  tipText: {
    fontSize: 12,
    color: '#CBD5E1',
    textAlign: 'center',
  },
});
