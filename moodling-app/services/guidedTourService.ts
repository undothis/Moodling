/**
 * Guided Tour Service
 *
 * Provides an automated walkthrough of the app that:
 * 1. Navigates to different screens
 * 2. Uses TTS to narrate each step
 * 3. Highlights key features
 * 4. Auto-advances through the tour
 *
 * This creates an immersive onboarding experience.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import {
  speakText,
  stopAudio,
  isTTSAvailable,
} from './textToSpeechService';

const STORAGE_KEYS = {
  TOUR_COMPLETED: 'moodleaf_guided_tour_completed',
  TOUR_STEP: 'moodleaf_guided_tour_step',
};

// ============================================
// TYPES
// ============================================

export interface TourStep {
  id: string;
  title: string;
  narration: string; // What TTS will say
  displayText: string; // What shows on screen
  route?: string; // Screen to navigate to
  highlight?: string; // Element to highlight (for future tooltip system)
  duration: number; // Milliseconds before auto-advance
  action?: () => Promise<void>; // Custom action to perform
}

export interface TourState {
  isActive: boolean;
  currentStep: number;
  isPaused: boolean;
}

// ============================================
// TOUR STEPS DEFINITION
// ============================================

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    narration: "Welcome to Mood Leaf! Let me show you around. This will only take a minute.",
    displayText: "Welcome to Mood Leaf! 🌿\n\nLet me show you around. This will only take a minute.",
    duration: 4000,
  },
  {
    id: 'tree',
    title: 'Your Tree',
    narration: "This is your tree. It's the heart of the app. As you journal, it grows and changes to reflect your emotional journey.",
    displayText: "🌳 This is your Tree\n\nIt grows as you journal and reflects your emotional journey. Touch it gently - it responds to you.",
    route: '/(tabs)/tree',
    duration: 6000,
  },
  {
    id: 'twigs',
    title: 'Twigs',
    narration: "See the Twigs button? Tap it to quickly log habits, mood, or medications. No need to write a whole entry.",
    displayText: "🪵 Twigs\n\nQuick-log habits, mood, or meds with just a tap. Perfect for when you're busy.",
    route: '/(tabs)/tree',
    highlight: 'twigs-button',
    duration: 5000,
  },
  {
    id: 'fireflies',
    title: 'Fireflies',
    narration: "Fireflies are personal wisdom, just for you. They float around your tree and offer insights based on your patterns.",
    displayText: "✨ Fireflies\n\nPersonal wisdom floating around your tree. Each one is written specifically for you.",
    route: '/(tabs)/tree',
    highlight: 'fireflies-button',
    duration: 5000,
  },
  {
    id: 'sparks',
    title: 'Sparks',
    narration: "Sparks are creative prompts to help you reflect in new ways. They adapt to your mood and style.",
    displayText: "💡 Sparks\n\nCreative prompts to spark reflection. Each one adapts to your unique style.",
    route: '/(tabs)/tree',
    highlight: 'spark-button',
    duration: 5000,
  },
  {
    id: 'journal',
    title: 'Journal',
    narration: "The Journal is where you write entries. Each one becomes a leaf on your tree. You can also voice record if you prefer.",
    displayText: "📝 Journal\n\nWrite entries that become leaves on your tree. Voice recording available too.",
    route: '/(tabs)',
    duration: 5000,
  },
  {
    id: 'skills',
    title: 'Skills',
    narration: "Skills are your growth toolkit. Unlock new capabilities as you use the app.",
    displayText: "🌱 Skills\n\nYour growth toolkit. New skills unlock as you journal and engage with the app.",
    route: '/(tabs)/skills',
    duration: 4000,
  },
  {
    id: 'insights',
    title: 'Insights',
    narration: "Insights show you patterns over time. See how your mood connects to sleep, activity, and other factors.",
    displayText: "📊 Insights\n\nSee your patterns over time. Connect mood to sleep, activity, and life events.",
    route: '/(tabs)/insights',
    duration: 4000,
  },
  {
    id: 'settings',
    title: 'Settings',
    narration: "Settings is where you customize everything. Change your coach's personality, manage privacy, and more.",
    displayText: "⚙️ Settings\n\nCustomize your coach, manage privacy, and configure the app to work for you.",
    route: '/(tabs)/settings',
    duration: 4000,
  },
  {
    id: 'coach',
    title: 'Your Coach',
    narration: "And I'm always here when you need to talk. Just tap the coach button on the tree screen. That's the tour! Everything stays on your device. Enjoy exploring!",
    displayText: "💬 Your Coach (me!)\n\nI'm always here when you need to talk. Just tap the coach on the tree screen.\n\n🔒 Everything stays on your device.\n\nEnjoy exploring!",
    route: '/coach',
    duration: 7000,
  },
];

// ============================================
// TOUR STATE MANAGEMENT
// ============================================

let tourState: TourState = {
  isActive: false,
  currentStep: 0,
  isPaused: false,
};

let tourTimeoutId: NodeJS.Timeout | null = null;
let onStepChangeCallback: ((step: TourStep, index: number) => void) | null = null;
let onTourEndCallback: (() => void) | null = null;

// Event-based listeners for reactive updates (solves polling issues)
type TourStateListener = (state: TourState, step: TourStep | null) => void;
const stateListeners: Set<TourStateListener> = new Set();

/**
 * Subscribe to tour state changes (for reactive UI updates)
 */
export function subscribeTourState(listener: TourStateListener): () => void {
  stateListeners.add(listener);
  // Immediately call with current state
  listener(tourState, tourState.isActive ? TOUR_STEPS[tourState.currentStep] : null);
  // Return unsubscribe function
  return () => stateListeners.delete(listener);
}

/**
 * Notify all listeners of state change
 */
function notifyStateChange(): void {
  const step = tourState.isActive ? TOUR_STEPS[tourState.currentStep] : null;
  stateListeners.forEach(listener => {
    try {
      listener(tourState, step);
    } catch (error) {
      console.error('Tour state listener error:', error);
    }
  });
}

/**
 * Check if tour has been completed before
 */
export async function hasTourBeenCompleted(): Promise<boolean> {
  try {
    const completed = await AsyncStorage.getItem(STORAGE_KEYS.TOUR_COMPLETED);
    return completed === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark tour as completed
 */
export async function markTourCompleted(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.TOUR_COMPLETED, 'true');
}

/**
 * Reset tour (for testing or re-touring)
 */
export async function resetTour(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.TOUR_COMPLETED);
  await AsyncStorage.removeItem(STORAGE_KEYS.TOUR_STEP);
  tourState = {
    isActive: false,
    currentStep: 0,
    isPaused: false,
  };
}

/**
 * Get current tour state
 */
export function getTourState(): TourState {
  return { ...tourState };
}

/**
 * Check if tour is currently active
 */
export function isTourActive(): boolean {
  return tourState.isActive;
}

// ============================================
// TOUR CONTROL
// ============================================

/**
 * Start the guided tour
 */
export async function startTour(
  onStepChange?: (step: TourStep, index: number) => void,
  onEnd?: () => void
): Promise<void> {
  console.log('[GuidedTour] Starting tour...');

  // Store callbacks
  onStepChangeCallback = onStepChange || null;
  onTourEndCallback = onEnd || null;

  // Initialize state
  tourState = {
    isActive: true,
    currentStep: 0,
    isPaused: false,
  };

  // Notify listeners BEFORE executing step (so overlay appears immediately)
  notifyStateChange();

  // Start first step
  await executeStep(0);
}

/**
 * Pause the tour
 */
export function pauseTour(): void {
  if (!tourState.isActive) return;

  tourState.isPaused = true;
  if (tourTimeoutId) {
    clearTimeout(tourTimeoutId);
    tourTimeoutId = null;
  }
  stopAudio();
  notifyStateChange();
}

/**
 * Resume the tour
 */
export async function resumeTour(): Promise<void> {
  if (!tourState.isActive || !tourState.isPaused) return;

  tourState.isPaused = false;
  notifyStateChange();
  await executeStep(tourState.currentStep);
}

/**
 * Skip to next step
 */
export async function nextStep(): Promise<void> {
  console.log('[GuidedTour] Next step requested');
  if (!tourState.isActive) return;

  if (tourTimeoutId) {
    clearTimeout(tourTimeoutId);
    tourTimeoutId = null;
  }
  stopAudio();

  const nextIndex = tourState.currentStep + 1;
  if (nextIndex >= TOUR_STEPS.length) {
    await endTour();
  } else {
    await executeStep(nextIndex);
  }
}

/**
 * Go to previous step
 */
export async function previousStep(): Promise<void> {
  if (!tourState.isActive || tourState.currentStep === 0) return;

  if (tourTimeoutId) {
    clearTimeout(tourTimeoutId);
    tourTimeoutId = null;
  }
  stopAudio();

  await executeStep(tourState.currentStep - 1);
}

/**
 * End the tour
 */
export async function endTour(): Promise<void> {
  console.log('[GuidedTour] Ending tour');

  if (tourTimeoutId) {
    clearTimeout(tourTimeoutId);
    tourTimeoutId = null;
  }
  stopAudio();

  tourState = {
    isActive: false,
    currentStep: 0,
    isPaused: false,
  };

  // Notify listeners that tour has ended
  notifyStateChange();

  await markTourCompleted();

  if (onTourEndCallback) {
    onTourEndCallback();
  }
}

/**
 * Skip tour entirely
 */
export async function skipTour(): Promise<void> {
  console.log('[GuidedTour] Skipping tour');
  await endTour();
}

// ============================================
// STEP EXECUTION
// ============================================

/**
 * Execute a specific tour step
 */
async function executeStep(stepIndex: number): Promise<void> {
  console.log(`[GuidedTour] Executing step ${stepIndex}:`, TOUR_STEPS[stepIndex]?.id);

  if (stepIndex < 0 || stepIndex >= TOUR_STEPS.length) {
    await endTour();
    return;
  }

  const step = TOUR_STEPS[stepIndex];
  tourState.currentStep = stepIndex;

  // Notify listeners immediately so overlay updates
  notifyStateChange();

  // Navigate to route if specified (with small delay to let overlay update first)
  if (step.route) {
    try {
      // Small delay to ensure overlay is visible before navigation
      await new Promise(resolve => setTimeout(resolve, 50));
      router.replace(step.route as any);
      console.log(`[GuidedTour] Navigated to: ${step.route}`);
    } catch (error) {
      console.error('[GuidedTour] Navigation error:', error);
    }
  }

  // Execute custom action if specified
  if (step.action) {
    try {
      await step.action();
    } catch (error) {
      console.error('[GuidedTour] Action error:', error);
    }
  }

  // Notify callback listener (for legacy compatibility)
  if (onStepChangeCallback) {
    onStepChangeCallback(step, stepIndex);
  }

  // Speak narration if TTS available (non-blocking)
  isTTSAvailable().then(available => {
    if (available) {
      speakText(step.narration).catch(() => {
        console.log('[GuidedTour] TTS not available, continuing without voice');
      });
    }
  });

  // Schedule next step (auto-advance)
  if (!tourState.isPaused) {
    tourTimeoutId = setTimeout(async () => {
      if (tourState.isActive && !tourState.isPaused) {
        const nextIndex = stepIndex + 1;
        if (nextIndex >= TOUR_STEPS.length) {
          await endTour();
        } else {
          await executeStep(nextIndex);
        }
      }
    }, step.duration);
  }
}

/**
 * Get current step info
 */
export function getCurrentStep(): TourStep | null {
  if (!tourState.isActive) return null;
  return TOUR_STEPS[tourState.currentStep] || null;
}

/**
 * Get total number of steps
 */
export function getTotalSteps(): number {
  return TOUR_STEPS.length;
}

/**
 * Get progress percentage
 */
export function getTourProgress(): number {
  if (!tourState.isActive) return 0;
  return ((tourState.currentStep + 1) / TOUR_STEPS.length) * 100;
}
