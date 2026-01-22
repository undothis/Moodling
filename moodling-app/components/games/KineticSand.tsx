/**
 * Kinetic Sand
 *
 * Satisfying digital kinetic sand simulation.
 * Drag, poke, and play with responsive virtual sand.
 */

import React, { useState, useRef, useCallback } from 'react';
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
const SAND_COLORS = {
  natural: ['#E6C9A8', '#D4B896', '#C2A782', '#B0966E', '#9E855A'],
  pink: ['#FFB6C1', '#FFA0B0', '#FF8A9F', '#FF748E', '#FF5E7D'],
  purple: ['#DDA0DD', '#D18AD1', '#C574C5', '#B95EB9', '#AD48AD'],
  blue: ['#87CEEB', '#71C4E8', '#5BBAE5', '#45B0E2', '#2FA6DF'],
  teal: ['#40E0D0', '#2DD4C4', '#1AC8B8', '#07BCAC', '#00B0A0'],
};

type SandColor = keyof typeof SAND_COLORS;

interface SandParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

interface KineticSandProps {
  onClose?: () => void;
}

const PARTICLE_COUNT = 800;
const GRAVITY = 0.15;
const DAMPING = 0.95;
const INTERACTION_RADIUS = 60;
const PUSH_FORCE = 3;

export default function KineticSand({ onClose }: KineticSandProps) {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const sandWidth = screenWidth - 32;
  const sandHeight = screenHeight - 280;

  const [sandColor, setSandColor] = useState<SandColor>('natural');
  const [particles, setParticles] = useState<SandParticle[]>(() => initParticles());
  const [interactionCount, setInteractionCount] = useState(0);

  const animationRef = useRef<number | null>(null);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const particlesRef = useRef(particles);
  particlesRef.current = particles;

  const currentColors = SAND_COLORS[sandColor];

  // Initialize particles
  function initParticles(): SandParticle[] {
    const newParticles: SandParticle[] = [];
    const cols = Math.ceil(Math.sqrt(PARTICLE_COUNT * (sandWidth / sandHeight)));
    const rows = Math.ceil(PARTICLE_COUNT / cols);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const colors = SAND_COLORS.natural;

      newParticles.push({
        id: i,
        x: (col / cols) * sandWidth + Math.random() * 10,
        y: sandHeight - (row / rows) * (sandHeight * 0.4) - 20 + Math.random() * 10,
        vx: 0,
        vy: 0,
        size: 6 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return newParticles;
  }

  // Reset sand with new color
  const resetSand = useCallback((color: SandColor) => {
    const colors = SAND_COLORS[color];
    setParticles((prev) =>
      prev.map((p) => ({
        ...p,
        color: colors[Math.floor(Math.random() * colors.length)],
        x: (p.id % 30) / 30 * sandWidth + Math.random() * 10,
        y: sandHeight - Math.random() * (sandHeight * 0.4) - 20,
        vx: 0,
        vy: 0,
      }))
    );
  }, [sandWidth, sandHeight]);

  // Physics update
  const updatePhysics = useCallback(() => {
    setParticles((prev) => {
      const touch = touchRef.current;

      return prev.map((p) => {
        let { x, y, vx, vy } = p;

        // Apply gravity
        vy += GRAVITY;

        // Touch interaction
        if (touch) {
          const dx = x - touch.x;
          const dy = y - touch.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < INTERACTION_RADIUS && dist > 0) {
            const force = (1 - dist / INTERACTION_RADIUS) * PUSH_FORCE;
            vx += (dx / dist) * force;
            vy += (dy / dist) * force;
          }
        }

        // Apply damping
        vx *= DAMPING;
        vy *= DAMPING;

        // Update position
        x += vx;
        y += vy;

        // Wall collisions
        if (x < p.size / 2) {
          x = p.size / 2;
          vx = -vx * 0.3;
        }
        if (x > sandWidth - p.size / 2) {
          x = sandWidth - p.size / 2;
          vx = -vx * 0.3;
        }

        // Floor collision
        if (y > sandHeight - p.size / 2) {
          y = sandHeight - p.size / 2;
          vy = -vy * 0.1;
          vx *= 0.8;
        }

        // Ceiling
        if (y < p.size / 2) {
          y = p.size / 2;
          vy = -vy * 0.3;
        }

        return { ...p, x, y, vx, vy };
      });
    });

    animationRef.current = requestAnimationFrame(updatePhysics);
  }, [sandWidth, sandHeight]);

  // Start physics loop
  React.useEffect(() => {
    animationRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updatePhysics]);

  // Pan responder for touch
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        touchRef.current = { x: locationX, y: locationY };
        setInteractionCount((c) => c + 1);
        if (Platform.OS !== 'web') {
          Vibration.vibrate(10);
        }
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        touchRef.current = { x: locationX, y: locationY };
      },
      onPanResponderRelease: () => {
        touchRef.current = null;
      },
    })
  ).current;

  // Shake/scatter sand
  const shakeSand = useCallback(() => {
    setParticles((prev) =>
      prev.map((p) => ({
        ...p,
        vx: (Math.random() - 0.5) * 15,
        vy: -Math.random() * 10 - 5,
      }))
    );
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 30, 50, 30]);
    }
  }, []);

  // Smooth/level sand
  const smoothSand = useCallback(() => {
    setParticles((prev) =>
      prev.map((p, i) => ({
        ...p,
        vy: 5,
        vx: ((i % 30) / 30 - 0.5) * 0.5,
      }))
    );
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Kinetic Sand</Text>
          <Text style={styles.subtitle}>Touch to play</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Color selector */}
      <View style={styles.colorContainer}>
        {(Object.keys(SAND_COLORS) as SandColor[]).map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorButton,
              sandColor === color && styles.colorButtonActive,
            ]}
            onPress={() => {
              setSandColor(color);
              resetSand(color);
            }}
          >
            <View style={styles.colorPreview}>
              {SAND_COLORS[color].slice(0, 3).map((c, i) => (
                <View
                  key={i}
                  style={[styles.colorDot, { backgroundColor: c }]}
                />
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sand area */}
      <View
        style={[styles.sandArea, { width: sandWidth, height: sandHeight }]}
        {...panResponder.panHandlers}
      >
        {/* Sand particles */}
        {particles.map((p) => (
          <View
            key={p.id}
            style={[
              styles.particle,
              {
                left: p.x - p.size / 2,
                top: p.y - p.size / 2,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: p.size / 2,
              },
            ]}
          />
        ))}

        {/* Touch indicator */}
        {touchRef.current && (
          <View
            style={[
              styles.touchIndicator,
              {
                left: touchRef.current.x - INTERACTION_RADIUS,
                top: touchRef.current.y - INTERACTION_RADIUS,
                width: INTERACTION_RADIUS * 2,
                height: INTERACTION_RADIUS * 2,
              },
            ]}
          />
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={shakeSand}>
          <Ionicons name="shuffle" size={20} color="#64748B" />
          <Text style={styles.controlText}>Shake</Text>
        </TouchableOpacity>

        <View style={styles.interactionCounter}>
          <Text style={styles.counterText}>{interactionCount} touches</Text>
        </View>

        <TouchableOpacity style={styles.controlButton} onPress={smoothSand}>
          <Ionicons name="water" size={20} color="#64748B" />
          <Text style={styles.controlText}>Smooth</Text>
        </TouchableOpacity>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipText}>
          ✨ Drag through the sand to push it around
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
  colorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  colorButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#334155',
  },
  colorButtonActive: {
    backgroundColor: '#475569',
    borderWidth: 2,
    borderColor: '#fff',
  },
  colorPreview: {
    flexDirection: 'row',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 1,
  },
  sandArea: {
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 3,
    borderColor: '#334155',
  },
  particle: {
    position: 'absolute',
  },
  touchIndicator: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#334155',
  },
  controlText: {
    fontSize: 14,
    color: '#94A3B8',
    marginLeft: 6,
    fontWeight: '600',
  },
  interactionCounter: {
    alignItems: 'center',
  },
  counterText: {
    fontSize: 14,
    color: '#64748B',
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
