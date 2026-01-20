/**
 * Mood Leaf Tree - Animation Hooks
 *
 * The tree is never fully still.
 * Multiple slow oscillators with phase offsets create emergent, living motion.
 *
 * If it looks like an animation → wrong
 * If it feels like a living presence → correct
 */

import { useEffect, useMemo } from 'react';
import {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  useAnimatedStyle,
  interpolate,
  useDerivedValue,
  withSpring,
  cancelAnimation,
  SharedValue,
} from 'react-native-reanimated';
import { MOTION_CONSTANTS, type EnvironmentState, type GrowthState } from './types';

/**
 * Creates a continuous oscillation that never looks like a loop.
 * Uses prime-number-based timing to avoid obvious repetition.
 */
export function useBreathing(
  environmentScale: number = 1,
  phaseOffset: number = 0
) {
  const breath = useSharedValue(0);

  useEffect(() => {
    // Use slightly irregular timing to feel organic
    const duration = MOTION_CONSTANTS.BREATH_BASE_DURATION * (0.9 + Math.random() * 0.2);

    breath.value = withDelay(
      phaseOffset,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: duration * 0.55,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: duration * 0.45,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    );

    return () => cancelAnimation(breath);
  }, [environmentScale]);

  return breath;
}

/**
 * Gentle swaying motion for branches and leaves.
 * Multiple overlapping frequencies create natural movement.
 */
export function useSway(
  amplitude: number = MOTION_CONSTANTS.SWAY_AMPLITUDE,
  phaseOffset: number = 0
) {
  const primarySway = useSharedValue(0);
  const secondarySway = useSharedValue(0);

  useEffect(() => {
    // Primary sway - slower, larger
    primarySway.value = withDelay(
      phaseOffset,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: MOTION_CONSTANTS.SWAY_BASE_DURATION,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-1, {
            duration: MOTION_CONSTANTS.SWAY_BASE_DURATION * 1.1, // slightly asymmetric
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    );

    // Secondary sway - faster, smaller, different phase
    secondarySway.value = withDelay(
      phaseOffset + 1500,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: MOTION_CONSTANTS.SWAY_BASE_DURATION * 0.7,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-1, {
            duration: MOTION_CONSTANTS.SWAY_BASE_DURATION * 0.65,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    );

    return () => {
      cancelAnimation(primarySway);
      cancelAnimation(secondarySway);
    };
  }, []);

  // Combine sways additively
  const combinedSway = useDerivedValue(() => {
    return (primarySway.value * 0.7 + secondarySway.value * 0.3) * amplitude;
  });

  return combinedSway;
}

/**
 * Micro-movements for leaves - almost imperceptible flutter.
 */
export function useMicroMovement(phaseOffset: number = 0) {
  const micro = useSharedValue(0);

  useEffect(() => {
    const randomDuration = MOTION_CONSTANTS.MICRO_DURATION * (0.8 + Math.random() * 0.4);

    micro.value = withDelay(
      phaseOffset,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: randomDuration,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-1, {
            duration: randomDuration * 0.9,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    );

    return () => cancelAnimation(micro);
  }, []);

  return micro;
}

/**
 * Touch disturbance that propagates through the tree.
 * Touch does not trigger immediate feedback.
 * Touch introduces a disturbance that travels through the system over time.
 */
export function useTouchDisturbance() {
  const disturbance = useSharedValue(0);
  const touchOrigin = useSharedValue<'trunk' | 'leaf' | 'pot' | 'branch' | null>(null);

  const triggerDisturbance = (
    target: 'trunk' | 'leaf' | 'pot' | 'branch',
    intensity: number = 1
  ) => {
    touchOrigin.value = target;

    // Different responses based on touch target
    const delays = {
      trunk: MOTION_CONSTANTS.TOUCH_DELAY_TRUNK,
      leaf: MOTION_CONSTANTS.TOUCH_DELAY_TRUNK * 1.5,
      pot: MOTION_CONSTANTS.TOUCH_DELAY_TRUNK * 0.5,
      branch: MOTION_CONSTANTS.TOUCH_DELAY_TRUNK * 1.2,
    };

    // Delayed response - touch is felt, not answered
    disturbance.value = withDelay(
      delays[target],
      withSequence(
        withTiming(intensity, {
          duration: 800,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(0, {
          duration: MOTION_CONSTANTS.TOUCH_DECAY,
          easing: Easing.out(Easing.cubic),
        })
      )
    );
  };

  return { disturbance, touchOrigin, triggerDisturbance };
}

/**
 * Creates delayed response for different tree parts.
 * Trunk responds first, then roots, then leaves.
 */
export function usePropagatedResponse(
  sourceDisturbance: SharedValue<number>,
  delay: number,
  dampening: number = 1
) {
  const response = useSharedValue(0);

  useDerivedValue(() => {
    // This creates a lagged, dampened copy of the source disturbance
    response.value = withDelay(
      delay,
      withSpring(sourceDisturbance.value * dampening, {
        damping: 15,
        stiffness: 40,
      })
    );
  });

  return response;
}

/**
 * Slow root movement - almost imperceptible.
 */
export function useRootMovement(rootLength: number) {
  const rootSway = useSharedValue(0);

  useEffect(() => {
    if (rootLength > 0) {
      rootSway.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: MOTION_CONSTANTS.ROOT_DURATION,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-1, {
            duration: MOTION_CONSTANTS.ROOT_DURATION * 1.1,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      );
    }

    return () => cancelAnimation(rootSway);
  }, [rootLength > 0]);

  return rootSway;
}

/**
 * Time-of-day interpolation.
 * Transitions take minutes, not seconds.
 */
export function useTimeOfDayTransition(targetState: EnvironmentState) {
  const hueShift = useSharedValue(targetState.hueShift);
  const saturation = useSharedValue(targetState.saturation);
  const brightness = useSharedValue(targetState.brightness);
  const motionScale = useSharedValue(targetState.motionScale);

  useEffect(() => {
    // Very slow transitions - environmental, not UI
    hueShift.value = withTiming(targetState.hueShift, {
      duration: MOTION_CONSTANTS.TIME_TRANSITION_DURATION,
      easing: Easing.inOut(Easing.sin),
    });
    saturation.value = withTiming(targetState.saturation, {
      duration: MOTION_CONSTANTS.TIME_TRANSITION_DURATION,
      easing: Easing.inOut(Easing.sin),
    });
    brightness.value = withTiming(targetState.brightness, {
      duration: MOTION_CONSTANTS.TIME_TRANSITION_DURATION,
      easing: Easing.inOut(Easing.sin),
    });
    motionScale.value = withTiming(targetState.motionScale, {
      duration: MOTION_CONSTANTS.TIME_TRANSITION_DURATION,
      easing: Easing.inOut(Easing.sin),
    });
  }, [targetState]);

  return { hueShift, saturation, brightness, motionScale };
}

/**
 * Growth state transition.
 * Changes are smoothed over time, never jump discretely.
 */
export function useGrowthTransition(growthState: GrowthState) {
  const trunkThickness = useSharedValue(growthState.trunkThickness);
  const leafDensity = useSharedValue(growthState.leafDensity);
  const rootLength = useSharedValue(growthState.rootLength);
  const potProminence = useSharedValue(growthState.potProminence);

  useEffect(() => {
    // Growth changes smoothly - never feels like "leveling up"
    trunkThickness.value = withTiming(growthState.trunkThickness, {
      duration: 3000,
      easing: Easing.inOut(Easing.cubic),
    });
    leafDensity.value = withTiming(growthState.leafDensity, {
      duration: 3000,
      easing: Easing.inOut(Easing.cubic),
    });
    rootLength.value = withTiming(growthState.rootLength, {
      duration: 5000, // roots grow slower
      easing: Easing.inOut(Easing.cubic),
    });
    potProminence.value = withTiming(growthState.potProminence, {
      duration: 5000,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [growthState]);

  return { trunkThickness, leafDensity, rootLength, potProminence };
}
