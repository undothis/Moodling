/**
 * Tour Spotlight Component
 *
 * Renders a small floating tooltip card fixed at the bottom of the screen
 * with an arrow pointing to the highlighted element.
 * No overlay - users can see and interact with the UI fully.
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

  // Simplify description - just show first line
  const shortDescription = description.split('\n')[0];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Pulsing ring around target element - no overlay */}
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

      {/* Arrow pointing up to target (if target exists) */}
      {target && (
        <View
          style={[
            styles.arrow,
            {
              left: target.x + target.width / 2 - 10,
              bottom: SCREEN_HEIGHT - target.y + 8,
            },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="caret-up" size={20} color={colors.tint} />
        </View>
      )}

      {/* Fixed card at bottom */}
      <View style={[styles.card, { backgroundColor: cardBgColor }]}>
        <View style={styles.row}>
          {/* Step badge */}
          <View style={[styles.badge, { backgroundColor: colors.tint }]}>
            <Text style={styles.badgeText}>{stepIndex + 1}/{totalSteps}</Text>
          </View>

          {/* Title & description */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
              {shortDescription}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.tint }]}
              onPress={onNext}
            >
              <Ionicons
                name={stepIndex === totalSteps - 1 ? 'checkmark' : 'arrow-forward'}
                size={18}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  spotlightRing: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  arrow: {
    position: 'absolute',
  },
  card: {
    position: 'absolute',
    bottom: 100, // Fixed position above tab bar
    left: 12,
    right: 12,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skipBtn: {
    padding: 6,
  },
  nextBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TourSpotlight;
