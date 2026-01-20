import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  useColorScheme,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mood Leaf color palette from philosophy doc
const TREE_COLORS = {
  sage: '#8fbc8f',
  forest: '#228b22',
  sprout: '#90ee90',
  autumn: '#d2691e',
  gold: '#f4d03f',
  softGray: '#a9a9a9',
  bark: '#8B4513',
  darkBark: '#5D3A1A',
};

interface TreeViewProps {
  onLeafPress: () => void;       // Navigate to journal
  onSproutPress: () => void;     // Navigate to chat
  onBranchPress: () => void;     // Navigate to quick logs / branches
  onWeatherPress?: () => void;   // Navigate to health insights
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'neutral';
  branchStrength?: number;       // 0-1, how thick branches appear
  recentLeafCount?: number;      // Number of recent entries (affects leaf density)
  showFallingLeaf?: boolean;     // Trigger falling animation
}

// Individual falling leaf component
const FallingLeaf = ({
  delay = 0,
  startX = SCREEN_WIDTH / 2,
  onComplete,
}: {
  delay?: number;
  startX?: number;
  onComplete?: () => void;
}) => {
  const progress = useSharedValue(0);
  const swayOffset = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Falling animation
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: 4000 + Math.random() * 2000,
        easing: Easing.out(Easing.quad),
      }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      })
    );

    // Swaying side to side
    swayOffset.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(30, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
          withTiming(-30, { duration: 1000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    // Rotation
    rotation.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(45, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
          withTiming(-45, { duration: 1500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [0, SCREEN_HEIGHT * 0.6]
    );
    const opacity = interpolate(
      progress.value,
      [0, 0.1, 0.9, 1],
      [0, 1, 1, 0]
    );

    return {
      transform: [
        { translateX: swayOffset.value },
        { translateY },
        { rotate: `${rotation.value}deg` },
      ],
      opacity,
    };
  });

  const leafColors = [TREE_COLORS.sage, TREE_COLORS.autumn, TREE_COLORS.gold, TREE_COLORS.sprout];
  const leafColor = leafColors[Math.floor(Math.random() * leafColors.length)];

  return (
    <Animated.View
      style={[
        styles.fallingLeaf,
        { left: startX },
        animatedStyle,
      ]}
    >
      <Text style={[styles.leafEmoji, { color: leafColor }]}>🍃</Text>
    </Animated.View>
  );
};

// Sprout component with idle animation
const Sprout = ({ onPress }: { onPress: () => void }) => {
  const bounce = useSharedValue(0);
  const sway = useSharedValue(0);

  useEffect(() => {
    // Gentle breathing/bounce animation
    bounce.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Subtle swaying
    sway.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-3, { duration: 3000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounce.value },
      { rotate: `${sway.value}deg` },
    ],
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[styles.sproutContainer, animatedStyle]}>
        <Text style={styles.sproutEmoji}>🌱</Text>
        <Text style={styles.sproutLabel}>Talk to Sprout</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Weather overlay component
const WeatherOverlay = ({
  weather,
  onPress
}: {
  weather: 'sunny' | 'cloudy' | 'rainy' | 'neutral';
  onPress?: () => void;
}) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 1000 });
  }, [weather]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const weatherEmoji = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    neutral: '🌤️',
  }[weather];

  const weatherLabel = {
    sunny: 'Good energy today',
    cloudy: 'Taking it easy',
    rainy: 'Rough weather',
    neutral: 'Weather',
  }[weather];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <Animated.View style={[styles.weatherContainer, animatedStyle]}>
        <Text style={styles.weatherEmoji}>{weatherEmoji}</Text>
        <Text style={styles.weatherLabel}>{weatherLabel}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Branch component for habits/quick logs
const Branch = ({
  strength = 0.5,
  onPress,
  position = 'left',
}: {
  strength?: number;
  onPress: () => void;
  position?: 'left' | 'right';
}) => {
  const grow = useSharedValue(0);

  useEffect(() => {
    grow.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(grow.value, [0, 1], [0.3, 1]);
    return {
      transform: [
        { scale },
        { rotate: position === 'left' ? '-30deg' : '30deg' },
      ],
      opacity: grow.value,
    };
  });

  // Branch thickness based on strength (consistency)
  const thickness = 4 + strength * 8;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.branchContainer,
          position === 'left' ? styles.branchLeft : styles.branchRight,
          animatedStyle,
        ]}
      >
        <View
          style={[
            styles.branch,
            {
              height: thickness,
              backgroundColor: strength > 0.7 ? TREE_COLORS.forest : TREE_COLORS.sage,
            },
          ]}
        />
        <Text style={styles.branchEmoji}>🌿</Text>
        <Text style={styles.branchLabel}>Branches</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Leaf cluster for journal entries
const LeafCluster = ({
  count = 3,
  onPress
}: {
  count?: number;
  onPress: () => void;
}) => {
  const rustle = useSharedValue(0);

  useEffect(() => {
    // Gentle rustling animation
    rustle.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        withTiming(-5, { duration: 2500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rustle.value}deg` }],
  }));

  // More leaves based on recent entry count
  const leafCount = Math.min(Math.max(count, 1), 5);
  const leaves = Array(leafCount).fill('🍃');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[styles.leafCluster, animatedStyle]}>
        <View style={styles.leavesRow}>
          {leaves.map((leaf, i) => (
            <Text
              key={i}
              style={[
                styles.clusterLeaf,
                {
                  transform: [
                    { rotate: `${(i - Math.floor(leafCount / 2)) * 15}deg` },
                    { translateY: Math.abs(i - Math.floor(leafCount / 2)) * -5 },
                  ],
                },
              ]}
            >
              {leaf}
            </Text>
          ))}
        </View>
        <Text style={styles.leafLabel}>Leave a leaf</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Tree trunk
const TreeTrunk = () => {
  const grow = useSharedValue(0);

  useEffect(() => {
    grow.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const scaleY = interpolate(grow.value, [0, 1], [0, 1]);
    return {
      transform: [{ scaleY }],
    };
  });

  return (
    <Animated.View style={[styles.trunk, animatedStyle]}>
      <View style={styles.trunkInner} />
    </Animated.View>
  );
};

// Main TreeView component
export default function TreeView({
  onLeafPress,
  onSproutPress,
  onBranchPress,
  onWeatherPress,
  weather = 'neutral',
  branchStrength = 0.5,
  recentLeafCount = 3,
  showFallingLeaf = false,
}: TreeViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [fallingLeaves, setFallingLeaves] = useState<number[]>([]);

  // Trigger falling leaf animation
  useEffect(() => {
    if (showFallingLeaf) {
      const newLeafId = Date.now();
      setFallingLeaves(prev => [...prev, newLeafId]);
    }
  }, [showFallingLeaf]);

  const handleLeafComplete = useCallback((leafId: number) => {
    setFallingLeaves(prev => prev.filter(id => id !== leafId));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Weather overlay - top */}
      <View style={styles.weatherSection}>
        <WeatherOverlay weather={weather} onPress={onWeatherPress} />
      </View>

      {/* Falling leaves animation layer */}
      <View style={styles.fallingLeavesLayer} pointerEvents="none">
        {fallingLeaves.map((leafId, index) => (
          <FallingLeaf
            key={leafId}
            delay={index * 200}
            startX={SCREEN_WIDTH * 0.3 + Math.random() * SCREEN_WIDTH * 0.4}
            onComplete={() => handleLeafComplete(leafId)}
          />
        ))}
      </View>

      {/* Tree structure */}
      <View style={styles.treeSection}>
        {/* Leaf cluster - top of tree */}
        <View style={styles.canopySection}>
          <LeafCluster count={recentLeafCount} onPress={onLeafPress} />
        </View>

        {/* Branches - sides */}
        <View style={styles.branchesSection}>
          <Branch
            strength={branchStrength}
            onPress={onBranchPress}
            position="left"
          />
          <Branch
            strength={branchStrength}
            onPress={onBranchPress}
            position="right"
          />
        </View>

        {/* Tree trunk */}
        <TreeTrunk />

        {/* Sprout - at base of tree */}
        <View style={styles.sproutSection}>
          <Sprout onPress={onSproutPress} />
        </View>
      </View>

      {/* Instructions hint */}
      <View style={styles.hintSection}>
        <Text style={[styles.hintText, { color: colors.textMuted }]}>
          Tap any part of the tree to explore
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherSection: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  weatherContainer: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherEmoji: {
    fontSize: 32,
  },
  weatherLabel: {
    fontSize: 11,
    color: TREE_COLORS.softGray,
    marginTop: 4,
  },
  fallingLeavesLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  fallingLeaf: {
    position: 'absolute',
    top: 150,
  },
  leafEmoji: {
    fontSize: 28,
  },
  treeSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  canopySection: {
    zIndex: 3,
  },
  leafCluster: {
    alignItems: 'center',
    padding: 20,
  },
  leavesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterLeaf: {
    fontSize: 40,
    marginHorizontal: -8,
  },
  leafLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: TREE_COLORS.forest,
  },
  branchesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: SCREEN_WIDTH * 0.8,
    marginTop: -20,
    zIndex: 2,
  },
  branchContainer: {
    alignItems: 'center',
    padding: 16,
  },
  branchLeft: {
    marginRight: 40,
  },
  branchRight: {
    marginLeft: 40,
  },
  branch: {
    width: 60,
    borderRadius: 4,
  },
  branchEmoji: {
    fontSize: 28,
    marginTop: 4,
  },
  branchLabel: {
    fontSize: 12,
    color: TREE_COLORS.sage,
    marginTop: 4,
  },
  trunk: {
    width: 40,
    height: 120,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -30,
    zIndex: 1,
  },
  trunkInner: {
    width: 30,
    height: '100%',
    backgroundColor: TREE_COLORS.bark,
    borderRadius: 8,
    shadowColor: TREE_COLORS.darkBark,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  sproutSection: {
    marginTop: -10,
    zIndex: 4,
  },
  sproutContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(144, 238, 144, 0.2)',
    borderRadius: 20,
  },
  sproutEmoji: {
    fontSize: 48,
  },
  sproutLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: TREE_COLORS.forest,
  },
  hintSection: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
