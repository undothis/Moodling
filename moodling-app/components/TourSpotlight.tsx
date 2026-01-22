/**
 * Tour Spotlight Component
 *
 * Renders a dark overlay with a "spotlight" cutout highlighting a specific
 * UI element, plus an arrow pointing to it and a tooltip card.
 *
 * Used by the guided tour to draw attention to specific features.
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
 * Call this when measuring an element that should be highlightable
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
 * Clear all targets (useful when navigating away)
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
  arrowPosition = 'auto',
}: TourSpotlightProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for the spotlight ring
  useEffect(() => {
    if (visible && target) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [visible, target]);

  if (!visible) return null;

  // Calculate card position based on target
  const getCardPosition = () => {
    if (!target) {
      // Center the card if no target
      return {
        top: SCREEN_HEIGHT * 0.3,
        left: 20,
        right: 20,
      };
    }

    const targetCenterY = target.y + target.height / 2;
    const spaceAbove = target.y;
    const spaceBelow = SCREEN_HEIGHT - (target.y + target.height);

    // Position card where there's more space
    if (spaceBelow > spaceAbove && spaceBelow > 200) {
      return {
        top: target.y + target.height + 20,
        left: 20,
        right: 20,
      };
    } else {
      return {
        bottom: SCREEN_HEIGHT - target.y + 20,
        left: 20,
        right: 20,
      };
    }
  };

  // Calculate arrow direction
  const getArrowDirection = (): 'up' | 'down' | 'none' => {
    if (!target) return 'none';

    const cardPos = getCardPosition();
    if ('top' in cardPos) {
      return 'up'; // Card is below target, arrow points up
    }
    return 'down'; // Card is above target, arrow points down
  };

  const cardPosition = getCardPosition();
  const arrowDir = getArrowDirection();

  // Calculate arrow position to point at target center
  const getArrowStyle = () => {
    if (!target || arrowDir === 'none') return {};

    const targetCenterX = target.x + target.width / 2;
    const arrowLeft = Math.max(40, Math.min(targetCenterX - 12, SCREEN_WIDTH - 60));

    return {
      left: arrowLeft,
    };
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dark overlay with cutout for target */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* If we have a target, show a spotlight ring */}
        {target && (
          <Animated.View
            style={[
              styles.spotlightRing,
              {
                left: target.x - 8,
                top: target.y - 8,
                width: target.width + 16,
                height: target.height + 16,
                borderColor: colors.tint,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        )}
      </View>

      {/* Arrow pointing to target */}
      {target && arrowDir !== 'none' && (
        <View
          style={[
            styles.arrowContainer,
            arrowDir === 'up' ? { top: target.y + target.height + 4 } : { top: target.y - 28 },
            getArrowStyle(),
          ]}
        >
          <Ionicons
            name={arrowDir === 'up' ? 'caret-up' : 'caret-down'}
            size={24}
            color={colors.tint}
          />
        </View>
      )}

      {/* Content card */}
      <View style={[styles.card, cardPosition, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>

        <View style={styles.progress}>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>
            {stepIndex + 1} of {totalSteps}
          </Text>
          {/* Progress dots */}
          <View style={styles.dots}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === stepIndex ? colors.tint : colors.border,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip Tour</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.tint }]}
            onPress={onNext}
          >
            <Text style={styles.nextText}>
              {stepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  spotlightRing: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  arrowContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  card: {
    position: 'absolute',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  progress: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 12,
    marginBottom: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 14,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 6,
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default TourSpotlight;
