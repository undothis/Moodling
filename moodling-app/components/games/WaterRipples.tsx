/**
 * Water Ripples
 *
 * Calming interactive water surface simulation.
 * Touch to create soothing ripple effects.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
  Vibration,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Water color themes
const WATER_THEMES = {
  ocean: { bg: '#0C4A6E', ripple: 'rgba(56, 189, 248, 0.4)', accent: '#38BDF8' },
  pond: { bg: '#14532D', ripple: 'rgba(134, 239, 172, 0.4)', accent: '#86EFAC' },
  sunset: { bg: '#7C2D12', ripple: 'rgba(251, 146, 60, 0.4)', accent: '#FB923C' },
  night: { bg: '#1E1B4B', ripple: 'rgba(167, 139, 250, 0.4)', accent: '#A78BFA' },
};

type WaterTheme = keyof typeof WATER_THEMES;

interface Ripple {
  id: number;
  x: number;
  y: number;
  scale: Animated.Value;
  opacity: Animated.Value;
}

interface WaterRipplesProps {
  onClose?: () => void;
}

export default function WaterRipples({ onClose }: WaterRipplesProps) {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const [theme, setTheme] = useState<WaterTheme>('ocean');
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [rippleCount, setRippleCount] = useState(0);
  const [isRaining, setIsRaining] = useState(false);

  const rippleIdRef = useRef(0);
  const rainIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentTheme = WATER_THEMES[theme];

  // Create ripple at position
  const createRipple = useCallback(
    (x: number, y: number) => {
      const id = rippleIdRef.current++;
      const scale = new Animated.Value(0);
      const opacity = new Animated.Value(0.8);

      const newRipple: Ripple = { id, x, y, scale, opacity };
      setRipples((prev) => [...prev, newRipple]);
      setRippleCount((c) => c + 1);

      // Haptic feedback
      if (Platform.OS !== 'web') {
        Vibration.vibrate(10);
      }

      // Animate ripple
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Remove ripple after animation
        setRipples((prev) => prev.filter((r) => r.id !== id));
      });
    },
    []
  );

  // Handle touch
  const handleTouch = useCallback(
    (event: any) => {
      const { locationX, locationY } = event.nativeEvent;
      createRipple(locationX, locationY);
    },
    [createRipple]
  );

  // Pan responder for continuous touch
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        createRipple(locationX, locationY);
      },
      onPanResponderMove: (evt) => {
        // Create ripples on move (throttled by animation)
        if (Math.random() > 0.7) {
          const { locationX, locationY } = evt.nativeEvent;
          createRipple(locationX, locationY);
        }
      },
    })
  ).current;

  // Rain mode
  const toggleRain = useCallback(() => {
    if (isRaining) {
      if (rainIntervalRef.current) {
        clearInterval(rainIntervalRef.current);
        rainIntervalRef.current = null;
      }
      setIsRaining(false);
    } else {
      setIsRaining(true);
      rainIntervalRef.current = setInterval(() => {
        const x = Math.random() * (screenWidth - 40) + 20;
        const y = Math.random() * (screenHeight - 300) + 100;
        createRipple(x, y);
      }, 300);
    }
  }, [isRaining, screenWidth, screenHeight, createRipple]);

  // Cleanup rain interval
  React.useEffect(() => {
    return () => {
      if (rainIntervalRef.current) {
        clearInterval(rainIntervalRef.current);
      }
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: currentTheme.accent }]}>
            Water Ripples
          </Text>
          <Text style={styles.subtitle}>Touch to create ripples</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={currentTheme.accent} />
          </TouchableOpacity>
        )}
      </View>

      {/* Theme selector */}
      <View style={styles.themeContainer}>
        {(Object.keys(WATER_THEMES) as WaterTheme[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.themeButton,
              { backgroundColor: WATER_THEMES[t].ripple },
              theme === t && styles.themeButtonActive,
            ]}
            onPress={() => setTheme(t)}
          >
            <View
              style={[
                styles.themeColor,
                { backgroundColor: WATER_THEMES[t].accent },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Water surface */}
      <View
        style={styles.waterSurface}
        onTouchStart={handleTouch}
        {...panResponder.panHandlers}
      >
        {/* Ambient waves */}
        <View style={[styles.ambientWave, styles.wave1]} />
        <View style={[styles.ambientWave, styles.wave2]} />
        <View style={[styles.ambientWave, styles.wave3]} />

        {/* Ripples */}
        {ripples.map((ripple) => (
          <Animated.View
            key={ripple.id}
            style={[
              styles.ripple,
              {
                left: ripple.x - 100,
                top: ripple.y - 100,
                borderColor: currentTheme.ripple,
                transform: [
                  {
                    scale: ripple.scale.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 3],
                    }),
                  },
                ],
                opacity: ripple.opacity,
              },
            ]}
          />
        ))}

        {/* Center instruction */}
        {rippleCount === 0 && (
          <View style={styles.instructionContainer}>
            <Ionicons name="water" size={48} color={currentTheme.accent} />
            <Text style={[styles.instruction, { color: currentTheme.accent }]}>
              Touch anywhere
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            isRaining && { backgroundColor: currentTheme.accent },
          ]}
          onPress={toggleRain}
        >
          <Ionicons
            name="rainy"
            size={24}
            color={isRaining ? currentTheme.bg : currentTheme.accent}
          />
          <Text
            style={[
              styles.controlText,
              { color: isRaining ? currentTheme.bg : currentTheme.accent },
            ]}
          >
            {isRaining ? 'Stop Rain' : 'Rain Mode'}
          </Text>
        </TouchableOpacity>

        <View style={styles.counter}>
          <Text style={[styles.counterText, { color: currentTheme.accent }]}>
            {rippleCount} ripples
          </Text>
        </View>
      </View>

      {/* Tips */}
      <View style={[styles.tipsContainer, { backgroundColor: currentTheme.ripple }]}>
        <Text style={[styles.tipText, { color: currentTheme.bg }]}>
          💧 Drag your finger across the water for a trail of ripples
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  themeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeButtonActive: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  themeColor: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  waterSurface: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  ambientWave: {
    position: 'absolute',
    width: '200%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    left: '-50%',
  },
  wave1: {
    top: '30%',
  },
  wave2: {
    top: '50%',
  },
  wave3: {
    top: '70%',
  },
  ripple: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
  },
  instructionContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instruction: {
    fontSize: 18,
    marginTop: 12,
    fontWeight: '500',
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
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  controlText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  counter: {
    alignItems: 'center',
  },
  counterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tipsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: Platform.OS === 'ios' ? 40 : 24,
    borderRadius: 12,
  },
  tipText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});
