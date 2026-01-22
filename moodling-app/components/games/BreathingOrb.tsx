/**
 * Breathing Orb
 *
 * Guided breathing visualization for mindfulness and relaxation.
 * Features expanding/contracting orb synchronized with breath patterns.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSIONS_KEY = 'mood_leaf_breathing_sessions';

// Breathing patterns (in seconds)
const BREATHING_PATTERNS = {
  relaxed: { name: 'Relaxed', inhale: 4, hold: 0, exhale: 4, holdAfter: 0, color: '#4ECDC4' },
  box: { name: 'Box Breathing', inhale: 4, hold: 4, exhale: 4, holdAfter: 4, color: '#6366F1' },
  calm: { name: '4-7-8 Calm', inhale: 4, hold: 7, exhale: 8, holdAfter: 0, color: '#8B5CF6' },
  energize: { name: 'Energize', inhale: 2, hold: 0, exhale: 2, holdAfter: 0, color: '#F59E0B' },
};

type PatternKey = keyof typeof BREATHING_PATTERNS;

interface BreathingOrbProps {
  onClose?: () => void;
}

export default function BreathingOrb({ onClose }: BreathingOrbProps) {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const [pattern, setPattern] = useState<PatternKey>('relaxed');
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'holdAfter'>('inhale');
  const [countdown, setCountdown] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentPattern = BREATHING_PATTERNS[pattern];
  const orbSize = Math.min(screenWidth, screenHeight) * 0.5;

  // Load session count
  useEffect(() => {
    AsyncStorage.getItem(SESSIONS_KEY).then((stored) => {
      if (stored) setTotalSessions(parseInt(stored, 10));
    });
  }, []);

  // Save session on completion
  const saveSession = useCallback(async () => {
    const newTotal = totalSessions + 1;
    setTotalSessions(newTotal);
    await AsyncStorage.setItem(SESSIONS_KEY, newTotal.toString());
  }, [totalSessions]);

  // Run breathing animation
  const runBreathingCycle = useCallback(() => {
    const { inhale, hold, exhale, holdAfter } = currentPattern;

    // Clear any existing animation
    if (animationRef.current) {
      animationRef.current.stop();
    }

    const phases: Array<{
      phase: 'inhale' | 'hold' | 'exhale' | 'holdAfter';
      duration: number;
      toScale: number;
      toGlow: number;
    }> = [];

    if (inhale > 0) {
      phases.push({ phase: 'inhale', duration: inhale * 1000, toScale: 1, toGlow: 1 });
    }
    if (hold > 0) {
      phases.push({ phase: 'hold', duration: hold * 1000, toScale: 1, toGlow: 0.8 });
    }
    if (exhale > 0) {
      phases.push({ phase: 'exhale', duration: exhale * 1000, toScale: 0.5, toGlow: 0.3 });
    }
    if (holdAfter > 0) {
      phases.push({ phase: 'holdAfter', duration: holdAfter * 1000, toScale: 0.5, toGlow: 0.2 });
    }

    let currentPhaseIndex = 0;

    const runPhase = () => {
      if (currentPhaseIndex >= phases.length) {
        // Cycle complete
        setCycleCount((c) => c + 1);
        currentPhaseIndex = 0;
      }

      const phaseConfig = phases[currentPhaseIndex];
      setPhase(phaseConfig.phase);
      setCountdown(Math.ceil(phaseConfig.duration / 1000));

      // Haptic at phase start
      if (Platform.OS !== 'web') {
        Vibration.vibrate(30);
      }

      // Countdown timer
      let remaining = phaseConfig.duration / 1000;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining >= 0) {
          setCountdown(Math.ceil(remaining));
        }
      }, 1000);

      // Animate orb
      animationRef.current = Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: phaseConfig.toScale,
          duration: phaseConfig.duration,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: phaseConfig.toGlow,
          duration: phaseConfig.duration,
          useNativeDriver: true,
        }),
      ]);

      animationRef.current.start(({ finished }) => {
        if (finished) {
          currentPhaseIndex++;
          runPhase();
        }
      });
    };

    runPhase();
  }, [currentPattern, scaleAnim, glowAnim]);

  // Start/stop breathing
  useEffect(() => {
    if (isActive) {
      runBreathingCycle();
    } else {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Reset to starting position
      scaleAnim.setValue(0.5);
      glowAnim.setValue(0.3);
      setPhase('inhale');
      setCountdown(0);
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, runBreathingCycle, scaleAnim, glowAnim]);

  // Save session when stopping after cycles
  useEffect(() => {
    if (!isActive && cycleCount > 0) {
      saveSession();
      setCycleCount(0);
    }
  }, [isActive, cycleCount, saveSession]);

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe In';
      case 'hold':
        return 'Hold';
      case 'exhale':
        return 'Breathe Out';
      case 'holdAfter':
        return 'Hold';
    }
  };

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'inhale':
        return 'Fill your lungs slowly';
      case 'hold':
        return 'Keep the air in';
      case 'exhale':
        return 'Release slowly';
      case 'holdAfter':
        return 'Stay empty';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0a0a0a' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Breathing Orb</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Pattern selector */}
      <View style={styles.patternContainer}>
        {(Object.keys(BREATHING_PATTERNS) as PatternKey[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.patternButton,
              pattern === key && { backgroundColor: BREATHING_PATTERNS[key].color },
            ]}
            onPress={() => {
              if (!isActive) setPattern(key);
            }}
            disabled={isActive}
          >
            <Text
              style={[
                styles.patternText,
                pattern === key && styles.patternTextActive,
              ]}
            >
              {BREATHING_PATTERNS[key].name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Breathing orb */}
      <View style={styles.orbContainer}>
        {/* Glow layers */}
        <Animated.View
          style={[
            styles.glowOuter,
            {
              width: orbSize * 1.5,
              height: orbSize * 1.5,
              borderRadius: orbSize * 0.75,
              backgroundColor: currentPattern.color,
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.15],
              }),
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.glowMiddle,
            {
              width: orbSize * 1.25,
              height: orbSize * 1.25,
              borderRadius: orbSize * 0.625,
              backgroundColor: currentPattern.color,
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 0.3],
              }),
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />

        {/* Main orb */}
        <Animated.View
          style={[
            styles.orb,
            {
              width: orbSize,
              height: orbSize,
              borderRadius: orbSize / 2,
              backgroundColor: currentPattern.color,
              transform: [{ scale: scaleAnim }],
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.6, 1],
              }),
            },
          ]}
        >
          {/* Inner highlight */}
          <View
            style={[
              styles.orbHighlight,
              {
                width: orbSize * 0.3,
                height: orbSize * 0.3,
                borderRadius: orbSize * 0.15,
              },
            ]}
          />
        </Animated.View>

        {/* Phase text overlay */}
        {isActive && (
          <View style={styles.phaseOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
            <Text style={styles.phaseText}>{getPhaseText()}</Text>
            <Text style={styles.instructionText}>{getPhaseInstruction()}</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        {isActive ? (
          <Text style={styles.statsText}>Cycles: {cycleCount}</Text>
        ) : (
          <Text style={styles.statsText}>Total sessions: {totalSessions}</Text>
        )}
      </View>

      {/* Control button */}
      <TouchableOpacity
        style={[styles.controlButton, { backgroundColor: currentPattern.color }]}
        onPress={() => setIsActive(!isActive)}
      >
        <Ionicons
          name={isActive ? 'pause' : 'play'}
          size={32}
          color="#fff"
        />
        <Text style={styles.controlText}>{isActive ? 'Pause' : 'Start'}</Text>
      </TouchableOpacity>

      {/* Instructions */}
      {!isActive && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to use:</Text>
          <Text style={styles.instructions}>
            1. Select a breathing pattern{'\n'}
            2. Press Start and follow the orb{'\n'}
            3. Breathe in as it expands{'\n'}
            4. Breathe out as it contracts
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  patternContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  patternButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1f1f1f',
    margin: 4,
  },
  patternText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  patternTextActive: {
    color: '#fff',
  },
  orbContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowOuter: {
    position: 'absolute',
  },
  glowMiddle: {
    position: 'absolute',
  },
  orb: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 20,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  orbHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  phaseOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  phaseText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  instructionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statsContainer: {
    paddingVertical: 16,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 20,
  },
  controlText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  instructionsContainer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  instructions: {
    fontSize: 12,
    color: '#555',
    lineHeight: 20,
  },
});
