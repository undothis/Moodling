/**
 * Mood Leaf Tree - Main Scene Component
 *
 * The tree is the emotional center of the app.
 * A living, stateful, animated system that:
 * - Is always subtly moving and breathing
 * - Responds to touch slowly and indirectly
 * - Grows gradually as the user uses the app
 * - Adapts to time of day
 * - Adapts to emotional context
 * - Visually tells a story of containment → grounding → freedom
 */

import React, { useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Text,
  useColorScheme,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
import {
  TREE_PALETTE,
  MOTION_CONSTANTS,
  type GrowthState,
  type EnvironmentState,
  type TimeOfDay,
  type MoodSignal,
  type TreeSceneProps,
} from './types';
import {
  useTouchDisturbance,
  useGrowthTransition,
  useTimeOfDayTransition,
} from './useTreeAnimations';
import {
  ClayPot,
  Trunk,
  Branch,
  LeafCanopy,
  RootSystem,
} from './TreeLayers';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Determines time of day from current hour
 */
function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 17) return 'midday';
  if (hour >= 17 && hour < 20) return 'sunset';
  return 'night';
}

/**
 * Creates environment state from time and mood
 */
function createEnvironmentState(time: TimeOfDay, mood: MoodSignal): EnvironmentState {
  const timeParams = {
    morning: { hueShift: 10, saturation: 0.95, brightness: 1.0, motionScale: 1.1 },
    midday: { hueShift: 0, saturation: 1.0, brightness: 1.0, motionScale: 1.0 },
    sunset: { hueShift: 15, saturation: 0.9, brightness: 0.95, motionScale: 0.9 },
    night: { hueShift: -15, saturation: 0.8, brightness: 0.85, motionScale: 0.7 },
  }[time];

  const moodAdjustments = {
    calm: { hueShift: 0, saturation: 0, motionScale: -0.1 },
    anxious: { hueShift: -5, saturation: 0.05, motionScale: 0.15 },
    heavy: { hueShift: -10, saturation: -0.1, motionScale: -0.2 },
    light: { hueShift: 5, saturation: 0.05, motionScale: 0.1 },
    neutral: { hueShift: 0, saturation: 0, motionScale: 0 },
  }[mood];

  return {
    timeOfDay: time,
    mood,
    hueShift: timeParams.hueShift + moodAdjustments.hueShift,
    saturation: Math.max(0.7, Math.min(1, timeParams.saturation + moodAdjustments.saturation)),
    brightness: timeParams.brightness,
    motionScale: Math.max(0.6, Math.min(1.2, timeParams.motionScale + moodAdjustments.motionScale)),
  };
}

/**
 * Default growth state for new users
 */
const DEFAULT_GROWTH_STATE: GrowthState = {
  stage: 'sapling',
  daysUsed: 1,
  totalEntries: 0,
  lastUsed: new Date().toISOString(),
  trunkThickness: 0.35,
  branchCount: 1,
  leafDensity: 1,
  rootLength: 0,
  potProminence: 1,
};

/**
 * Main TreeScene component
 */
export const TreeScene: React.FC<TreeSceneProps> = ({
  onLeafPress,
  onSproutPress,
  onBranchPress,
  mood = 'neutral',
}) => {
  const colorScheme = useColorScheme();

  // Growth state (would be loaded from storage in real app)
  const [growthState, setGrowthState] = React.useState<GrowthState>(DEFAULT_GROWTH_STATE);

  // Time of day tracking
  const [timeOfDay, setTimeOfDay] = React.useState<TimeOfDay>(getTimeOfDay);

  // Environment derived from time and mood
  const environmentState = useMemo(
    () => createEnvironmentState(timeOfDay, mood),
    [timeOfDay, mood]
  );

  // Update time of day periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Animation hooks
  const { disturbance, triggerDisturbance } = useTouchDisturbance();
  const growthTransition = useGrowthTransition(growthState);
  const envTransition = useTimeOfDayTransition(environmentState);

  // Touch handlers - touch is felt, not answered
  const handleTrunkPress = useCallback(() => {
    triggerDisturbance('trunk', 1);
    // Navigate after delay
    setTimeout(() => {
      onSproutPress?.();
    }, MOTION_CONSTANTS.TOUCH_DELAY_TRUNK + 300);
  }, [onSproutPress, triggerDisturbance]);

  const handleLeafPress = useCallback(() => {
    triggerDisturbance('leaf', 0.8);
    setTimeout(() => {
      onLeafPress?.();
    }, MOTION_CONSTANTS.TOUCH_DELAY_LEAVES + 300);
  }, [onLeafPress, triggerDisturbance]);

  const handleBranchPress = useCallback(() => {
    triggerDisturbance('branch', 0.9);
    setTimeout(() => {
      onBranchPress?.();
    }, MOTION_CONSTANTS.TOUCH_DELAY_TRUNK + 200);
  }, [onBranchPress, triggerDisturbance]);

  const handlePotPress = useCallback(() => {
    triggerDisturbance('pot', 0.6);
  }, [triggerDisturbance]);

  const handleBackgroundPress = useCallback(() => {
    // Light disturbance on background touch
    triggerDisturbance('trunk', 0.3);
  }, [triggerDisturbance]);

  // Background color based on time of day
  const backgroundStyle = useAnimatedStyle(() => {
    const baseColors = {
      morning: '#f5f8f0',
      midday: '#faf8f5',
      sunset: '#faf5f0',
      night: '#e8ede8',
    };

    return {
      backgroundColor: baseColors[timeOfDay],
    };
  });

  // Leaf count based on growth
  const leafCount = Math.max(1, Math.min(8, Math.round(growthState.leafDensity)));

  return (
    <Animated.View style={[styles.container, backgroundStyle]}>
      {/* Background touch area */}
      <Pressable style={styles.backgroundTouch} onPress={handleBackgroundPress}>
        {/* Environment indicators - subtle, fading text */}
        <View style={styles.environmentHints}>
          <Text style={[styles.hintText, styles.hintFaded]}>
            {timeOfDay === 'morning' && '· morning ·'}
            {timeOfDay === 'midday' && ''}
            {timeOfDay === 'sunset' && '· evening ·'}
            {timeOfDay === 'night' && '· night ·'}
          </Text>
        </View>

        {/* Tree assembly */}
        <View style={styles.treeContainer}>
          {/* Root system - beneath pot */}
          <View style={styles.rootLayer}>
            <RootSystem
              rootLength={growthTransition.rootLength}
              disturbance={disturbance}
              rootCount={5}
            />
          </View>

          {/* Pot layer */}
          <View style={styles.potLayer}>
            <ClayPot
              prominence={growthTransition.potProminence}
              disturbance={disturbance}
              onPress={handlePotPress}
            />
          </View>

          {/* Trunk layer */}
          <View style={styles.trunkLayer}>
            <Trunk
              thickness={growthTransition.trunkThickness}
              environmentBrightness={envTransition.brightness}
              disturbance={disturbance}
              onPress={handleTrunkPress}
            />

            {/* Branches - attached to trunk */}
            {growthState.branchCount >= 1 && (
              <Branch
                thickness={growthTransition.trunkThickness}
                side="left"
                angle={35}
                disturbance={disturbance}
                onPress={handleBranchPress}
              />
            )}
            {growthState.branchCount >= 2 && (
              <Branch
                thickness={growthTransition.trunkThickness}
                side="right"
                angle={40}
                disturbance={disturbance}
                onPress={handleBranchPress}
              />
            )}
          </View>

          {/* Leaf canopy - top layer */}
          <View style={styles.canopyLayer}>
            <LeafCanopy
              leafCount={leafCount}
              disturbance={disturbance}
              onLeafPress={handleLeafPress}
            />
          </View>
        </View>

        {/* Subtle action labels - fade in slowly, drift with environment */}
        <View style={styles.labelContainer}>
          <Pressable onPress={handleLeafPress} style={styles.labelTouch}>
            <Text style={styles.labelText}>Leave a leaf</Text>
          </Pressable>

          <Pressable onPress={handleTrunkPress} style={styles.labelTouch}>
            <Text style={styles.labelText}>Talk to Sprout</Text>
          </Pressable>

          <Pressable onPress={handleBranchPress} style={styles.labelTouch}>
            <Text style={styles.labelText}>Branches</Text>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundTouch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  environmentHints: {
    position: 'absolute',
    top: 80,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 13,
    color: TREE_PALETTE.softGray,
    fontStyle: 'italic',
    letterSpacing: 2,
  },
  hintFaded: {
    opacity: 0.5,
  },
  treeContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: SCREEN_HEIGHT * 0.5,
    marginTop: 40,
  },
  rootLayer: {
    position: 'absolute',
    bottom: 20,
    zIndex: 1,
  },
  potLayer: {
    position: 'absolute',
    bottom: 0,
    zIndex: 2,
  },
  trunkLayer: {
    position: 'absolute',
    bottom: 55,
    alignItems: 'center',
    zIndex: 3,
  },
  canopyLayer: {
    position: 'absolute',
    bottom: 140,
    alignItems: 'center',
    zIndex: 4,
  },
  labelContainer: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 30,
  },
  labelTouch: {
    padding: 12,
  },
  labelText: {
    fontSize: 14,
    color: TREE_PALETTE.forest,
    opacity: 0.6,
    fontWeight: '500',
  },
});

export default TreeScene;
