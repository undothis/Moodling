/**
 * Rain on Window
 *
 * Relaxing rain simulation on a window pane.
 * Watch raindrops fall and create soothing streaks.
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

// Rain intensity settings
const RAIN_SETTINGS = {
  light: { dropRate: 3, speed: 2, label: 'Light' },
  medium: { dropRate: 6, speed: 3, label: 'Medium' },
  heavy: { dropRate: 12, speed: 4, label: 'Heavy' },
  storm: { dropRate: 20, speed: 5, label: 'Storm' },
};

type RainIntensity = keyof typeof RAIN_SETTINGS;

interface RainDrop {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  streakLength: number;
}

interface Streak {
  id: number;
  x: number;
  startY: number;
  endY: number;
  width: number;
  opacity: number;
}

interface RainOnWindowProps {
  onClose?: () => void;
}

export default function RainOnWindow({ onClose }: RainOnWindowProps) {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const windowWidth = screenWidth;
  const windowHeight = screenHeight - 180;

  const [intensity, setIntensity] = useState<RainIntensity>('medium');
  const [drops, setDrops] = useState<RainDrop[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [dropCount, setDropCount] = useState(0);

  const dropIdRef = useRef(0);
  const streakIdRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  const settings = RAIN_SETTINGS[intensity];

  // Create new raindrop
  const createDrop = useCallback((): RainDrop => {
    return {
      id: dropIdRef.current++,
      x: Math.random() * windowWidth,
      y: -20,
      size: 2 + Math.random() * 3,
      speed: settings.speed * (0.8 + Math.random() * 0.4),
      opacity: 0.4 + Math.random() * 0.4,
      streakLength: 10 + Math.random() * 20,
    };
  }, [windowWidth, settings.speed]);

  // Create streak when drop hits
  const createStreak = useCallback((x: number, y: number): Streak => {
    return {
      id: streakIdRef.current++,
      x: x + (Math.random() - 0.5) * 10,
      startY: y,
      endY: y + 30 + Math.random() * 50,
      width: 1 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.2,
    };
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    if (isPaused) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    // Add new drops based on intensity
    setDrops((prev) => {
      let newDrops = [...prev];

      // Add new drops
      for (let i = 0; i < settings.dropRate; i++) {
        if (Math.random() < 0.3) {
          newDrops.push(createDrop());
        }
      }

      // Update drop positions
      newDrops = newDrops.map((drop) => ({
        ...drop,
        y: drop.y + drop.speed * 3,
      }));

      // Check for drops that hit bottom
      const hitDrops = newDrops.filter((d) => d.y >= windowHeight);
      if (hitDrops.length > 0) {
        setDropCount((c) => c + hitDrops.length);
        setStreaks((prevStreaks) => [
          ...prevStreaks,
          ...hitDrops.map((d) => createStreak(d.x, windowHeight - 30)),
        ]);
      }

      // Remove drops that are off screen
      return newDrops.filter((d) => d.y < windowHeight);
    });

    // Update streaks (fade out)
    setStreaks((prev) =>
      prev
        .map((s) => ({ ...s, opacity: s.opacity - 0.003 }))
        .filter((s) => s.opacity > 0)
    );

    animationRef.current = requestAnimationFrame(animate);
  }, [isPaused, settings.dropRate, windowHeight, createDrop, createStreak]);

  // Start animation
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  // Handle tap to create splash
  const handleTap = useCallback(
    (event: any) => {
      const { locationX, locationY } = event.nativeEvent;

      // Create splash effect
      for (let i = 0; i < 5; i++) {
        setStreaks((prev) => [
          ...prev,
          createStreak(locationX, locationY),
        ]);
      }

      if (Platform.OS !== 'web') {
        Vibration.vibrate(10);
      }
    },
    [createStreak]
  );

  return (
    <View style={styles.container}>
      {/* Window frame header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Rain on Window</Text>
          <Text style={styles.subtitle}>{dropCount} drops fallen</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Intensity selector */}
      <View style={styles.intensityContainer}>
        {(Object.keys(RAIN_SETTINGS) as RainIntensity[]).map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.intensityButton,
              intensity === level && styles.intensityButtonActive,
            ]}
            onPress={() => setIntensity(level)}
          >
            <Text
              style={[
                styles.intensityText,
                intensity === level && styles.intensityTextActive,
              ]}
            >
              {RAIN_SETTINGS[level].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Window pane */}
      <View
        style={[styles.windowPane, { width: windowWidth, height: windowHeight }]}
        onTouchEnd={handleTap}
      >
        {/* Background gradient (blurry outside view) */}
        <View style={styles.outsideView}>
          <View style={styles.blurredTree1} />
          <View style={styles.blurredTree2} />
          <View style={styles.blurredLight1} />
          <View style={styles.blurredLight2} />
        </View>

        {/* Rain drops */}
        {drops.map((drop) => (
          <View
            key={drop.id}
            style={[
              styles.rainDrop,
              {
                left: drop.x,
                top: drop.y,
                width: drop.size,
                height: drop.streakLength,
                opacity: drop.opacity,
              },
            ]}
          />
        ))}

        {/* Streaks on glass */}
        {streaks.map((streak) => (
          <View
            key={streak.id}
            style={[
              styles.streak,
              {
                left: streak.x,
                top: streak.startY,
                width: streak.width,
                height: streak.endY - streak.startY,
                opacity: streak.opacity,
              },
            ]}
          />
        ))}

        {/* Condensation effect on edges */}
        <View style={styles.condensationTop} />
        <View style={styles.condensationBottom} />

        {/* Window frame */}
        <View style={styles.windowFrameVertical} />
        <View style={styles.windowFrameHorizontal} />
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, isPaused && styles.controlButtonActive]}
          onPress={() => setIsPaused(!isPaused)}
        >
          <Ionicons
            name={isPaused ? 'play' : 'pause'}
            size={20}
            color={isPaused ? '#fff' : '#64748B'}
          />
          <Text
            style={[
              styles.controlText,
              isPaused && styles.controlTextActive,
            ]}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Text>
        </TouchableOpacity>

        <View style={styles.rainInfo}>
          <Ionicons name="rainy" size={16} color="#64748B" />
          <Text style={styles.rainInfoText}>{drops.length} drops</Text>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipText}>
          🌧️ Tap the window to create water splashes
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
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
    color: '#E2E8F0',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  intensityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  intensityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#334155',
    marginHorizontal: 4,
  },
  intensityButtonActive: {
    backgroundColor: '#3B82F6',
  },
  intensityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  intensityTextActive: {
    color: '#fff',
  },
  windowPane: {
    alignSelf: 'center',
    backgroundColor: '#0c1929',
    overflow: 'hidden',
    position: 'relative',
  },
  outsideView: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0c1929',
  },
  blurredTree1: {
    position: 'absolute',
    width: 60,
    height: 100,
    backgroundColor: '#1a3a2a',
    borderRadius: 30,
    left: '20%',
    bottom: '20%',
    opacity: 0.5,
  },
  blurredTree2: {
    position: 'absolute',
    width: 80,
    height: 120,
    backgroundColor: '#1a3a2a',
    borderRadius: 40,
    right: '15%',
    bottom: '25%',
    opacity: 0.4,
  },
  blurredLight1: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    left: '30%',
    top: '40%',
    opacity: 0.3,
  },
  blurredLight2: {
    position: 'absolute',
    width: 15,
    height: 15,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    right: '25%',
    top: '35%',
    opacity: 0.25,
  },
  rainDrop: {
    position: 'absolute',
    backgroundColor: 'rgba(150, 200, 255, 0.6)',
    borderRadius: 2,
  },
  streak: {
    position: 'absolute',
    backgroundColor: 'rgba(150, 200, 255, 0.4)',
    borderRadius: 1,
  },
  condensationTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(100, 150, 200, 0.1)',
  },
  condensationBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(100, 150, 200, 0.15)',
  },
  windowFrameVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 8,
    marginLeft: -4,
    backgroundColor: '#4B5563',
  },
  windowFrameHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 8,
    marginTop: -4,
    backgroundColor: '#4B5563',
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#334155',
  },
  controlButtonActive: {
    backgroundColor: '#3B82F6',
  },
  controlText: {
    fontSize: 14,
    color: '#94A3B8',
    marginLeft: 6,
    fontWeight: '600',
  },
  controlTextActive: {
    color: '#fff',
  },
  rainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rainInfoText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 6,
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
