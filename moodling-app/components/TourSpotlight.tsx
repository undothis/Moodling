/**
 * Tour Spotlight Component
 *
 * Renders a floating tooltip card with an arrow pointing to a specific
 * UI element. Minimal overlay to let users see the UI behind it.
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
}: TourSpotlightProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));

  // Fade in animation
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  // Pulse animation for the spotlight ring
  useEffect(() => {
    if (visible && target) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
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
      // Center the card if no target - position at bottom
      return {
        bottom: 120,
        left: 16,
        right: 16,
      };
    }

    const spaceAbove = target.y;
    const spaceBelow = SCREEN_HEIGHT - (target.y + target.height);

    // Position card where there's more space
    if (spaceBelow > spaceAbove && spaceBelow > 180) {
      return {
        top: target.y + target.height + 16,
        left: 16,
        right: 16,
      };
    } else {
      return {
        bottom: SCREEN_HEIGHT - target.y + 16,
        left: 16,
        right: 16,
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
    const arrowLeft = Math.max(30, Math.min(targetCenterX - 10, SCREEN_WIDTH - 50));

    return {
      left: arrowLeft,
    };
  };

  const cardBgColor = isDark ? 'rgba(44, 40, 37, 0.95)' : 'rgba(255, 255, 255, 0.95)';

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}
      pointerEvents="box-none"
    >
      {/* Subtle dimmed overlay - very transparent */}
      <View style={styles.subtleOverlay} pointerEvents="none" />

      {/* Spotlight ring around target */}
      {target && (
        <Animated.View
          style={[
            styles.spotlightRing,
            {
              left: target.x - 6,
              top: target.y - 6,
              width: target.width + 12,
              height: target.height + 12,
              borderColor: colors.tint,
              transform: [{ scale: pulseAnim }],
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Arrow pointing to target */}
      {target && arrowDir !== 'none' && (
        <View
          style={[
            styles.arrowContainer,
            arrowDir === 'up'
              ? { top: target.y + target.height + 2 }
              : { top: target.y - 24 },
            getArrowStyle(),
          ]}
          pointerEvents="none"
        >
          <Ionicons
            name={arrowDir === 'up' ? 'caret-up' : 'caret-down'}
            size={20}
            color={colors.tint}
          />
        </View>
      )}

      {/* Floating content card */}
      <View
        style={[
          styles.card,
          cardPosition,
          { backgroundColor: cardBgColor }
        ]}
      >
        {/* Title row with step indicator */}
        <View style={styles.titleRow}>
          <Text style={[styles.stepBadge, { backgroundColor: colors.tint }]}>
            {stepIndex + 1}/{totalSteps}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>

        {/* Compact button row */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.tint }]}
            onPress={onNext}
          >
            <Text style={styles.nextText}>
              {stepIndex === totalSteps - 1 ? 'Done' : 'Next'}
            </Text>
            <Ionicons
              name={stepIndex === totalSteps - 1 ? 'checkmark' : 'arrow-forward'}
              size={16}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  subtleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  spotlightRing: {
    position: 'absolute',
    borderWidth: 3,
    borderRadius: 12,
    backgroundColor: 'transparent',
    shadowColor: '#8FAE8B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  arrowContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  card: {
    position: 'absolute',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  stepBadge: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    gap: 6,
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TourSpotlight;
