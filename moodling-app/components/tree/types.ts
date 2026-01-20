/**
 * Mood Leaf Tree - Type Definitions
 *
 * The tree is a living, stateful, animated system.
 * These types define the shape of that system.
 */

// Growth stages - earned through use, never celebrated
export type GrowthStage = 'sapling' | 'rooting' | 'grounded' | 'flourishing';

// Time of day affects environment
export type TimeOfDay = 'morning' | 'midday' | 'sunset' | 'night';

// Mood signal subtly influences the tree
export type MoodSignal = 'calm' | 'anxious' | 'heavy' | 'light' | 'neutral';

// Growth state persisted across sessions
export interface GrowthState {
  stage: GrowthStage;
  daysUsed: number;
  totalEntries: number;
  lastUsed: string; // ISO date

  // Visual parameters derived from usage
  trunkThickness: number;      // 0.3 - 1.0
  branchCount: number;         // 1 - 5
  leafDensity: number;         // 1 - 8
  rootLength: number;          // 0 - 1 (0 = hidden, 1 = fully extended)
  potProminence: number;       // 1 - 0 (1 = prominent, 0 = faded)
}

// Animation parameters for living motion
export interface MotionParams {
  // Base breathing
  breathAmplitude: number;
  breathSpeed: number;

  // Sway
  swayAmplitude: number;
  swaySpeed: number;

  // Wind noise
  windStrength: number;

  // Touch disturbance (temporary)
  touchIntensity: number;
  touchDecay: number;
}

// Environment state derived from time and mood
export interface EnvironmentState {
  timeOfDay: TimeOfDay;
  mood: MoodSignal;

  // Derived visual properties
  hueShift: number;           // -20 to +20
  saturation: number;         // 0.7 to 1.0
  brightness: number;         // 0.8 to 1.0
  motionScale: number;        // 0.6 to 1.2
}

// Touch event for propagation
export interface TouchEvent {
  target: 'trunk' | 'leaf' | 'pot' | 'branch' | 'root' | 'background';
  timestamp: number;
  intensity: number;
  x: number;
  y: number;
}

// Props for the main TreeScene
export interface TreeSceneProps {
  onLeafPress?: () => void;
  onSproutPress?: () => void;
  onBranchPress?: () => void;
  mood?: MoodSignal;
}

// Color palette from philosophy
export const TREE_PALETTE = {
  // Greens
  sage: '#8fbc8f',
  forest: '#228b22',
  sprout: '#90ee90',
  deepGreen: '#2d5a2d',

  // Earth tones
  bark: '#8B5A2B',
  darkBark: '#5D3A1A',
  clay: '#C67B5C',
  clayDark: '#A65D3F',
  earth: '#4a3728',

  // Accents
  gold: '#f4d03f',
  warmGold: '#e6c35c',
  autumn: '#d2691e',

  // Neutrals
  softGray: '#a9a9a9',
  cream: '#faf8f5',

  // Night
  moonlight: '#e8f0e8',
  nightGreen: '#4a6b4a',
} as const;

// Motion constants - carefully tuned
export const MOTION_CONSTANTS = {
  // Breathing (trunk flexing)
  BREATH_BASE_DURATION: 4000,      // ms for one breath cycle
  BREATH_AMPLITUDE: 0.008,          // subtle flex

  // Sway (branches/leaves)
  SWAY_BASE_DURATION: 6000,
  SWAY_AMPLITUDE: 0.015,

  // Micro movement (leaves)
  MICRO_DURATION: 2500,
  MICRO_AMPLITUDE: 0.005,

  // Root movement
  ROOT_DURATION: 12000,             // very slow
  ROOT_AMPLITUDE: 0.003,            // almost imperceptible

  // Touch propagation
  TOUCH_DELAY_TRUNK: 400,           // ms before trunk responds
  TOUCH_DELAY_ROOTS: 600,           // roots respond after trunk
  TOUCH_DELAY_LEAVES: 800,          // leaves last
  TOUCH_DECAY: 3000,                // ms to return to normal

  // Environment transitions
  TIME_TRANSITION_DURATION: 60000,  // 1 minute for time changes
  MOOD_TRANSITION_DURATION: 5000,   // 5 seconds for mood changes
} as const;
