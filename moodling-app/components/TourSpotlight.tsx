/**
 * Tour Spotlight Component
 *
 * Renders a large floating card at the top center of the screen
 * with an arrow pointing down to the highlighted element.
 * No overlay - users can see the UI fully.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const isDark = colorScheme === 'dark';
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for the spotlight ring
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

  const cardBgColor = isDark ? 'rgba(44, 40, 37, 0.98)' : 'rgba(255, 255, 255, 0.98)';

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

      {/* Large card at top center */}
      <View style={[styles.card, { backgroundColor: cardBgColor }]}>
        {/* Header with step and title */}
        <View style={styles.header}>
          <View style={[styles.stepBadge, { backgroundColor: colors.tint }]}>
            <Text style={styles.stepText}>{stepIndex + 1} of {totalSteps}</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>

        {/* Arrow pointing down to target */}
        {target && (
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-down" size={24} color={colors.tint} />
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip Tour</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.tint }]}
            onPress={onNext}
          >
            <Text style={styles.nextText}>
              {stepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
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
    top: 60, // Below status bar
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  arrowContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 15,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 8,
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TourSpotlight;
