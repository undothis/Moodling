/**
 * Mood Leaf Tree - Individual Layer Components
 *
 * The tree is composed of multiple independently animated layers:
 * - Clay pot
 * - Trunk
 * - Primary branch
 * - Leaves (primary + secondary)
 * - Root system
 *
 * Each layer has its own animation behavior and responds to touch differently.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  SharedValue,
  useDerivedValue,
} from 'react-native-reanimated';
import { TREE_PALETTE, MOTION_CONSTANTS } from './types';
import {
  useBreathing,
  useSway,
  useMicroMovement,
  useRootMovement,
} from './useTreeAnimations';

interface LayerProps {
  disturbance: SharedValue<number>;
  onPress?: () => void;
}

interface TrunkProps extends LayerProps {
  thickness: SharedValue<number>;
  environmentBrightness: SharedValue<number>;
}

interface LeafProps extends LayerProps {
  index: number;
  totalLeaves: number;
  size?: 'small' | 'medium' | 'large';
}

interface BranchProps extends LayerProps {
  thickness: SharedValue<number>;
  side: 'left' | 'right';
  angle?: number;
}

interface RootProps extends LayerProps {
  length: SharedValue<number>;
  index: number;
  totalRoots: number;
}

interface PotProps extends LayerProps {
  prominence: SharedValue<number>;
}

/**
 * Clay Pot - Safety, early structure, temporary containment
 */
export const ClayPot: React.FC<PotProps> = ({ prominence, disturbance, onPress }) => {
  const breath = useBreathing(1, 200);

  const animatedStyle = useAnimatedStyle(() => {
    // Pot "settles" when touched
    const settleScale = interpolate(disturbance.value, [0, 1], [1, 0.98]);
    // Very subtle breathing
    const breathScale = 1 + breath.value * 0.003;
    // Fade as tree outgrows it
    const opacity = prominence.value;

    return {
      opacity,
      transform: [
        { scale: settleScale * breathScale },
        { translateY: interpolate(disturbance.value, [0, 1], [0, 2]) },
      ],
    };
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.potContainer, animatedStyle]}>
        {/* Pot rim */}
        <View style={styles.potRim} />
        {/* Pot body */}
        <View style={styles.potBody}>
          {/* Inner shadow for depth */}
          <View style={styles.potInnerShadow} />
        </View>
        {/* Pot base */}
        <View style={styles.potBase} />
      </Animated.View>
    </Pressable>
  );
};

/**
 * Trunk - The core, responds to breathing, flexes subtly
 */
export const Trunk: React.FC<TrunkProps> = ({
  thickness,
  environmentBrightness,
  disturbance,
  onPress,
}) => {
  const breath = useBreathing(1, 0);
  const sway = useSway(MOTION_CONSTANTS.SWAY_AMPLITUDE * 0.3, 0);

  const animatedStyle = useAnimatedStyle(() => {
    // Breathing deepens when touched (after delay)
    const breathIntensity = interpolate(disturbance.value, [0, 1], [1, 1.5]);
    const breathOffset = breath.value * MOTION_CONSTANTS.BREATH_AMPLITUDE * breathIntensity;

    // Subtle sway
    const swayRotation = sway.value * 0.5;

    // Thickness based on growth
    const width = interpolate(thickness.value, [0.3, 1], [12, 24]);

    return {
      width,
      transform: [
        { scaleX: 1 + breathOffset },
        { rotate: `${swayRotation}deg` },
        { translateX: sway.value * 2 },
      ],
    };
  });

  // Bark texture stripes
  const barkLines = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => (
      <View
        key={i}
        style={[
          styles.barkLine,
          {
            top: `${15 + i * 18}%`,
            opacity: 0.15 + Math.random() * 0.1,
          },
        ]}
      />
    ));
  }, []);

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.trunk, animatedStyle]}>
        {barkLines}
      </Animated.View>
    </Pressable>
  );
};

/**
 * Branch - Extends from trunk, sways more than trunk
 */
export const Branch: React.FC<BranchProps> = ({
  thickness,
  side,
  angle = 35,
  disturbance,
  onPress,
}) => {
  const phaseOffset = side === 'left' ? 0 : 1000;
  const sway = useSway(MOTION_CONSTANTS.SWAY_AMPLITUDE, phaseOffset);
  const breath = useBreathing(1, phaseOffset + 500);

  const direction = side === 'left' ? -1 : 1;
  const baseAngle = angle * direction;

  const animatedStyle = useAnimatedStyle(() => {
    // Branch sways more than trunk
    const swayAngle = sway.value * 3 * direction;
    // Touch causes branch to shift
    const touchShift = interpolate(disturbance.value, [0, 1], [0, 5 * direction]);

    const branchThickness = interpolate(thickness.value, [0.3, 1], [4, 10]);

    return {
      height: branchThickness,
      transform: [
        { rotate: `${baseAngle + swayAngle}deg` },
        { translateX: touchShift },
        { scaleY: 1 + breath.value * 0.02 },
      ],
    };
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.branch,
          side === 'left' ? styles.branchLeft : styles.branchRight,
          animatedStyle,
        ]}
      />
    </Pressable>
  );
};

/**
 * Leaf - The most expressive element, micro-movements + sway
 */
export const Leaf: React.FC<LeafProps> = ({
  index,
  totalLeaves,
  size = 'medium',
  disturbance,
  onPress,
}) => {
  // Each leaf has unique phase offset for organic feel
  const phaseOffset = index * 400 + Math.random() * 200;
  const sway = useSway(MOTION_CONSTANTS.SWAY_AMPLITUDE * 1.2, phaseOffset);
  const micro = useMicroMovement(phaseOffset + 200);
  const breath = useBreathing(1, phaseOffset + 100);

  // Leaf positioning around the tree
  const angle = useMemo(() => {
    if (totalLeaves === 1) return 0;
    const spread = 140; // degrees of spread
    const startAngle = -spread / 2;
    return startAngle + (spread / (totalLeaves - 1)) * index;
  }, [index, totalLeaves]);

  const sizeScale = {
    small: 0.6,
    medium: 1,
    large: 1.4,
  }[size];

  const animatedStyle = useAnimatedStyle(() => {
    // Leaves respond last to touch
    const touchResponse = interpolate(disturbance.value, [0, 1], [1, 1.1]);

    // Combined motion: sway + micro + breathing
    const swayRotation = sway.value * 8;
    const microRotation = micro.value * 3;
    const breathScale = 1 + breath.value * 0.02;

    return {
      transform: [
        { rotate: `${angle + swayRotation + microRotation}deg` },
        { scale: breathScale * touchResponse * sizeScale },
        { translateY: micro.value * 2 },
      ],
    };
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.leafContainer, animatedStyle]}>
        {/* Leaf shape - teardrop/oval */}
        <View style={styles.leaf}>
          {/* Leaf vein */}
          <View style={styles.leafVein} />
        </View>
        {/* Leaf stem */}
        <View style={styles.leafStem} />
      </Animated.View>
    </Pressable>
  );
};

/**
 * Root - Emerges slowly over time, almost imperceptible movement
 */
export const Root: React.FC<RootProps> = ({
  length,
  index,
  totalRoots,
  disturbance,
}) => {
  const rootSway = useRootMovement(1);
  const phaseOffset = index * 800;

  // Root angle - spread beneath pot
  const angle = useMemo(() => {
    const spread = 100;
    const startAngle = -spread / 2 + 180; // pointing down
    return startAngle + (spread / (totalRoots - 1 || 1)) * index;
  }, [index, totalRoots]);

  const animatedStyle = useAnimatedStyle(() => {
    // Roots only visible when length > 0
    const opacity = interpolate(length.value, [0, 0.1, 1], [0, 0.3, 1]);
    const scale = interpolate(length.value, [0, 1], [0.3, 1]);

    // Very subtle sway
    const swayRotation = rootSway.value * MOTION_CONSTANTS.ROOT_AMPLITUDE * 100;

    // Roots tighten then relax when tree is touched
    const touchResponse = interpolate(disturbance.value, [0, 0.5, 1], [1, 0.95, 1]);

    return {
      opacity,
      transform: [
        { rotate: `${angle + swayRotation}deg` },
        { scaleY: scale * touchResponse },
        { scaleX: touchResponse },
      ],
    };
  });

  return (
    <Animated.View style={[styles.root, animatedStyle]}>
      {/* Root tendril */}
      <View style={styles.rootTendril} />
    </Animated.View>
  );
};

/**
 * Root System - Container for all roots
 */
export const RootSystem: React.FC<{
  rootLength: SharedValue<number>;
  disturbance: SharedValue<number>;
  rootCount?: number;
}> = ({ rootLength, disturbance, rootCount = 5 }) => {
  const roots = useMemo(() => {
    return Array.from({ length: rootCount }, (_, i) => (
      <Root
        key={i}
        index={i}
        totalRoots={rootCount}
        length={rootLength}
        disturbance={disturbance}
      />
    ));
  }, [rootCount]);

  return <View style={styles.rootSystem}>{roots}</View>;
};

/**
 * Leaf Canopy - Container for all leaves
 */
export const LeafCanopy: React.FC<{
  leafCount: number;
  disturbance: SharedValue<number>;
  onLeafPress?: () => void;
}> = ({ leafCount, disturbance, onLeafPress }) => {
  const leaves = useMemo(() => {
    // First leaf is always large (the expressive one)
    const leafSizes: ('small' | 'medium' | 'large')[] = ['large'];

    // Additional leaves vary in size
    for (let i = 1; i < leafCount; i++) {
      leafSizes.push(i % 3 === 0 ? 'small' : 'medium');
    }

    return leafSizes.map((size, i) => (
      <Leaf
        key={i}
        index={i}
        totalLeaves={leafCount}
        size={size}
        disturbance={disturbance}
        onPress={onLeafPress}
      />
    ));
  }, [leafCount, onLeafPress]);

  return <View style={styles.leafCanopy}>{leaves}</View>;
};

const styles = StyleSheet.create({
  // Pot styles
  potContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  potRim: {
    width: 70,
    height: 8,
    backgroundColor: TREE_PALETTE.clay,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  potBody: {
    width: 60,
    height: 50,
    backgroundColor: TREE_PALETTE.clay,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  potInnerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 15,
    backgroundColor: TREE_PALETTE.clayDark,
    opacity: 0.3,
  },
  potBase: {
    width: 45,
    height: 6,
    backgroundColor: TREE_PALETTE.clayDark,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },

  // Trunk styles
  trunk: {
    height: 100,
    backgroundColor: TREE_PALETTE.bark,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barkLine: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: TREE_PALETTE.darkBark,
    borderRadius: 1,
  },

  // Branch styles
  branch: {
    width: 50,
    backgroundColor: TREE_PALETTE.bark,
    borderRadius: 3,
    position: 'absolute',
  },
  branchLeft: {
    left: -45,
    transformOrigin: 'right center',
  },
  branchRight: {
    right: -45,
    transformOrigin: 'left center',
  },

  // Leaf styles
  leafCanopy: {
    position: 'absolute',
    top: -60,
    alignItems: 'center',
    justifyContent: 'center',
    width: 150,
    height: 100,
  },
  leafContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  leaf: {
    width: 35,
    height: 50,
    backgroundColor: TREE_PALETTE.sage,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    overflow: 'hidden',
  },
  leafVein: {
    position: 'absolute',
    top: '20%',
    left: '45%',
    width: 2,
    height: '60%',
    backgroundColor: TREE_PALETTE.forest,
    opacity: 0.3,
    borderRadius: 1,
  },
  leafStem: {
    width: 3,
    height: 15,
    backgroundColor: TREE_PALETTE.forest,
    opacity: 0.6,
    borderRadius: 1.5,
  },

  // Root styles
  rootSystem: {
    position: 'absolute',
    bottom: -30,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 100,
    height: 60,
  },
  root: {
    position: 'absolute',
    top: 0,
  },
  rootTendril: {
    width: 4,
    height: 40,
    backgroundColor: TREE_PALETTE.bark,
    borderRadius: 2,
    opacity: 0.8,
  },
});
