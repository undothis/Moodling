/**
 * Tour Spotlight Component
 *
 * Renders a large floating card at the top center of the screen.
 * Manual advance only - user must tap Continue to proceed.
 * Pulsing ring around target element, flat card without oval border.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export interface SpotlightTarget {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TourSpotlightProps {
  visible: boolean;
  target?: SpotlightTarget | null;
  title: string;
  description: string;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  arrowPosition?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

// Global registry for spotlight targets
const spotlightTargets: Map<string, SpotlightTarget> = new Map();
const targetListeners: Set<() => void> = new Set();

/**
 * Register a spotlight target element
 */
export function registerSpotlightTarget(id: string, target: SpotlightTarget): void {
  spotlightTargets.set(id, target);
  targetListeners.forEach(listener => listener());
}

/**
 * Unregister a spotlight target
 */
export function unregisterSpotlightTarget(id: string): void {
  spotlightTargets.delete(id);
  targetListeners.forEach(listener => listener());
}

/**
 * Get a registered spotlight target by ID
 */
export function getSpotlightTarget(id: string): SpotlightTarget | undefined {
  return spotlightTargets.get(id);
}

/**
 * Subscribe to target changes
 */
export function subscribeToTargets(listener: () => void): () => void {
  targetListeners.add(listener);
  return () => targetListeners.delete(listener);
}

/**
 * Clear all targets
 */
export function clearSpotlightTargets(): void {
  spotlightTargets.clear();
  targetListeners.forEach(listener => listener());
}

export function TourSpotlight({
  visible,
  target,
  title,
  description,
  stepIndex,
  totalSteps,
  onNext,
  onSkip,
}: TourSpotlightProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for the spotlight ring around target
  useEffect(() => {
    if (visible && target) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [visible, target]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Pulsing ring around target element */}
      {target && (
        <Animated.View
          style={[
            styles.spotlightRing,
            {
              left: target.x - 4,
              top: target.y - 4,
              width: target.width + 8,
              height: target.height + 8,
              borderColor: colors.tint,
              transform: [{ scale: pulseAnim }],
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Flat card at top center - no border/oval */}
      <View style={styles.card}>
        {/* Step badge centered */}
        <View style={[styles.stepBadge, { backgroundColor: colors.tint }]}>
          <Text style={styles.stepText}>{stepIndex + 1} of {totalSteps}</Text>
        </View>

        {/* Title centered */}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

        {/* Description centered */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip Tour</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: colors.tint }]}
            onPress={onNext}
          >
            <Text style={styles.continueText}>
              {stepIndex === totalSteps - 1 ? 'Finish' : 'Continue'}
            </Text>
            <Ionicons
              name={stepIndex === totalSteps - 1 ? 'checkmark' : 'arrow-forward'}
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  spotlightRing: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  card: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    padding: 20,
    alignItems: 'center',
    // No background, border, or shadow - flat and transparent
  },
  stepBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 12,
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 15,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 8,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TourSpotlight;
