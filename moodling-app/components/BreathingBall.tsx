/**
 * Breathing Ball Component
 *
 * An animated visual guide for breathing exercises.
 * Expands on inhale, holds, contracts on exhale.
 *
 * Supports multiple breathing patterns:
 * - Box breathing (4-4-4-4)
 * - 4-7-8 breathing
 * - Physiological sigh (double inhale + long exhale)
 * - Simple calm breathing
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Colors } from '@/constants/Colors';

export type BreathingPattern =
  | 'box'           // 4-4-4-4
  | '478'           // 4-7-8
  | 'sigh'          // Double inhale + long exhale
  | 'calm'          // Simple 4-6
  | 'coherent';     // 5-5 (HRV optimal)

interface BreathingPhase {
  name: 'inhale' | 'hold' | 'exhale' | 'hold_empty' | 'inhale_top';
  duration: number; // in seconds
  label: string;
}

const PATTERNS: Record<BreathingPattern, BreathingPhase[]> = {
  box: [
    { name: 'inhale', duration: 4, label: 'Breathe in' },
    { name: 'hold', duration: 4, label: 'Hold' },
    { name: 'exhale', duration: 4, label: 'Breathe out' },
    { name: 'hold_empty', duration: 4, label: 'Hold' },
  ],
  '478': [
    { name: 'inhale', duration: 4, label: 'Breathe in' },
    { name: 'hold', duration: 7, label: 'Hold' },
    { name: 'exhale', duration: 8, label: 'Breathe out' },
  ],
  sigh: [
    { name: 'inhale', duration: 3, label: 'Breathe in' },
    { name: 'inhale_top', duration: 1, label: 'Top off' },
    { name: 'exhale', duration: 6, label: 'Slow exhale' },
  ],
  calm: [
    { name: 'inhale', duration: 4, label: 'Breathe in' },
    { name: 'exhale', duration: 6, label: 'Breathe out' },
  ],
  coherent: [
    { name: 'inhale', duration: 5, label: 'Breathe in' },
    { name: 'exhale', duration: 5, label: 'Breathe out' },
  ],
};

interface BreathingBallProps {
  pattern?: BreathingPattern;
  size?: number;
  onClose?: () => void;
  autoStart?: boolean;
  cycles?: number; // 0 = infinite
}

export function BreathingBall({
  pattern = 'box',
  size = 120,
  onClose,
  autoStart = true,
  cycles = 0,
}: BreathingBallProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  const [isRunning, setIsRunning] = useState(autoStart);
  const [currentPhase, setCurrentPhase] = useState<BreathingPhase | null>(null);
  const [cycleCount, setCycleCount] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const phases = PATTERNS[pattern];
  const phaseIndexRef = useRef(0);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Get target scale for each phase
  const getTargetScale = (phase: BreathingPhase): number => {
    switch (phase.name) {
      case 'inhale':
      case 'inhale_top':
        return 1;
      case 'hold':
        return 1;
      case 'exhale':
        return 0.5;
      case 'hold_empty':
        return 0.5;
      default:
        return 0.5;
    }
  };

  // Get target opacity for each phase
  const getTargetOpacity = (phase: BreathingPhase): number => {
    switch (phase.name) {
      case 'inhale':
      case 'inhale_top':
        return 1;
      case 'hold':
        return 0.9;
      case 'exhale':
        return 0.6;
      case 'hold_empty':
        return 0.5;
      default:
        return 0.6;
    }
  };

  // Run a single phase animation
  const runPhase = (phaseIndex: number) => {
    if (!isRunning) return;

    const phase = phases[phaseIndex];
    setCurrentPhase(phase);
    setCountdown(phase.duration);

    // Start countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    let remaining = phase.duration;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining >= 0) {
        setCountdown(remaining);
      }
    }, 1000);

    // Animate scale and opacity
    const targetScale = getTargetScale(phase);
    const targetOpacity = getTargetOpacity(phase);

    animationRef.current = Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: targetScale,
        duration: phase.duration * 1000,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: targetOpacity,
        duration: phase.duration * 1000,
        useNativeDriver: true,
      }),
    ]);

    animationRef.current.start(({ finished }) => {
      if (finished && isRunning) {
        // Move to next phase
        const nextIndex = (phaseIndex + 1) % phases.length;

        // Check if we completed a cycle
        if (nextIndex === 0) {
          const newCycleCount = cycleCount + 1;
          setCycleCount(newCycleCount);

          // Check if we should stop
          if (cycles > 0 && newCycleCount >= cycles) {
            setIsRunning(false);
            return;
          }
        }

        phaseIndexRef.current = nextIndex;
        runPhase(nextIndex);
      }
    });
  };

  // Start/stop animation
  useEffect(() => {
    if (isRunning) {
      runPhase(phaseIndexRef.current);
    } else {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isRunning]);

  const handleToggle = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      // Reset to start
      phaseIndexRef.current = 0;
      setCycleCount(0);
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0.6);
      setIsRunning(true);
    }
  };

  const patternLabels: Record<BreathingPattern, string> = {
    box: 'Box Breathing',
    '478': '4-7-8 Breathing',
    sigh: 'Physiological Sigh',
    calm: 'Calm Breathing',
    coherent: 'Coherent Breathing',
  };

  return (
    <View style={styles.container}>
      {/* Pattern label */}
      <Text style={[styles.patternLabel, { color: colors.textMuted }]}>
        {patternLabels[pattern]}
      </Text>

      {/* The breathing ball */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleToggle}
        style={styles.ballContainer}
      >
        <Animated.View
          style={[
            styles.ball,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.tint,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        />
        {/* Inner glow */}
        <Animated.View
          style={[
            styles.innerGlow,
            {
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: size * 0.3,
              backgroundColor: '#FFFFFF',
              transform: [{ scale: scaleAnim }],
              opacity: Animated.multiply(opacityAnim, 0.3),
            },
          ]}
        />
      </TouchableOpacity>

      {/* Phase instruction */}
      {currentPhase && isRunning && (
        <View style={styles.phaseInfo}>
          <Text style={[styles.phaseLabel, { color: colors.text }]}>
            {currentPhase.label}
          </Text>
          <Text style={[styles.countdown, { color: colors.tint }]}>
            {countdown}
          </Text>
        </View>
      )}

      {/* Start/pause instruction */}
      {!isRunning && (
        <Text style={[styles.tapHint, { color: colors.textMuted }]}>
          Tap to {cycleCount > 0 ? 'restart' : 'start'}
        </Text>
      )}

      {/* Close button */}
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={[styles.closeText, { color: colors.textMuted }]}>
            Done
          </Text>
        </TouchableOpacity>
      )}

      {/* Cycle counter */}
      {cycleCount > 0 && (
        <Text style={[styles.cycleCount, { color: colors.textMuted }]}>
          {cycleCount} {cycleCount === 1 ? 'cycle' : 'cycles'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  patternLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  ballContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 150,
    height: 150,
  },
  ball: {
    position: 'absolute',
  },
  innerGlow: {
    position: 'absolute',
  },
  phaseInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  phaseLabel: {
    fontSize: 18,
    fontWeight: '500',
  },
  countdown: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  tapHint: {
    fontSize: 14,
    marginTop: 20,
  },
  closeButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  closeText: {
    fontSize: 14,
  },
  cycleCount: {
    fontSize: 12,
    marginTop: 8,
  },
});

export default BreathingBall;
