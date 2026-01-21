/**
 * Subscription Service
 *
 * Manages premium subscriptions and payment flows for Mood Leaf.
 * Handles platform-specific payment routing (iOS App Store,
 * Google Play, Web/Stripe).
 *
 * Following Mood Leaf Ethics:
 * - Fair value exchange
 * - No manipulative upsells
 * - Core app works without premium
 * - Clear about what premium unlocks
 *
 * Unit: Subscription System
 */

import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  SUBSCRIPTION_STATE: 'moodleaf_subscription_state',
  PURCHASE_HISTORY: 'moodleaf_purchase_history',
};

// ============================================
// TYPES & INTERFACES
// ============================================

export type SubscriptionTier = 'free' | 'skills_plus' | 'pro' | 'lifetime';
export type PaymentPlatform = 'ios' | 'android' | 'web';

export interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt?: string; // ISO date string
  platform?: PaymentPlatform;
  purchaseDate?: string;
  isActive: boolean;

  // Feature access
  unlockedFeatures: string[];
}

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  emoji: string;
  price: string;
  period: 'monthly' | 'yearly' | 'lifetime';
  description: string;
  features: string[];
  savings?: string; // e.g., "Save 40%"
  highlighted?: boolean;
}

export interface PurchaseResult {
  success: boolean;
  tier?: SubscriptionTier;
  error?: string;
  receipt?: string;
}

// ============================================
// SUBSCRIPTION PLANS
// ============================================

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    tier: 'free',
    name: 'Free',
    emoji: '🌱',
    price: '$0',
    period: 'monthly',
    description: 'Everything you need to get started',
    features: [
      '7 AI coach personas',
      'Unlimited journaling',
      'Basic breathing & grounding exercises',
      'Mood tracking & patterns',
      'All data stays on device',
    ],
  },
  {
    id: 'skills_plus_monthly',
    tier: 'skills_plus',
    name: 'Skills+',
    emoji: '⭐',
    price: '$4.99',
    period: 'monthly',
    description: 'Unlock your full potential',
    features: [
      'Everything in Free',
      'All 15+ guided exercises',
      'Advanced breathing techniques',
      'Thought challenging tools',
      'Social preparation exercises',
      'Skill progress tracking',
    ],
    highlighted: true,
  },
  {
    id: 'skills_plus_yearly',
    tier: 'skills_plus',
    name: 'Skills+ (Annual)',
    emoji: '⭐',
    price: '$35.99',
    period: 'yearly',
    description: 'Best value for committed growth',
    features: [
      'Everything in Skills+',
      '12 months access',
      'Priority support',
    ],
    savings: 'Save 40%',
  },
  {
    id: 'pro_monthly',
    tier: 'pro',
    name: 'Pro',
    emoji: '💎',
    price: '$9.99',
    period: 'monthly',
    description: 'For deep psychological work',
    features: [
      'Everything in Skills+',
      'Advanced skills (IFS, Shadow Work)',
      'Custom Firefly categories',
      'Detailed analytics',
      'Priority API processing',
    ],
  },
  {
    id: 'lifetime',
    tier: 'lifetime',
    name: 'Lifetime',
    emoji: '🌳',
    price: '$79.99',
    period: 'lifetime',
    description: 'One-time purchase, forever access',
    features: [
      'Everything in Pro',
      'All future features included',
      'Never pay again',
      'Support indie development',
    ],
    savings: 'Best Deal',
  },
];

// ============================================
// FEATURE FLAGS BY TIER
// ============================================

const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  free: [
    'basic_breathing',
    'basic_grounding',
    'journaling',
    'all_personas',
    'mood_tracking',
    'basic_patterns',
  ],
  skills_plus: [
    'all_breathing',
    'all_grounding',
    'body_scan',
    'thought_challenge',
    'social_prep',
    'skill_progress',
    'unlimited_fireflies',
  ],
  pro: [
    'advanced_skills',
    'ifs_parts_work',
    'shadow_work',
    'custom_fireflies',
    'detailed_analytics',
    'priority_api',
  ],
  lifetime: [
    'all_features',
    'future_features',
  ],
};

// ============================================
// SUBSCRIPTION STATE MANAGEMENT
// ============================================

const DEFAULT_STATE: SubscriptionState = {
  tier: 'free',
  isActive: true,
  unlockedFeatures: TIER_FEATURES.free,
};

/**
 * Get current subscription state
 */
export async function getSubscriptionState(): Promise<SubscriptionState> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_STATE);
    if (!data) return DEFAULT_STATE;

    const state: SubscriptionState = JSON.parse(data);

    // Check if subscription has expired
    if (state.expiresAt) {
      const expiry = new Date(state.expiresAt);
      if (expiry < new Date()) {
        // Subscription expired, revert to free
        const expiredState: SubscriptionState = {
          ...DEFAULT_STATE,
          tier: 'free',
          isActive: true,
        };
        await saveSubscriptionState(expiredState);
        return expiredState;
      }
    }

    return state;
  } catch (error) {
    console.error('Failed to get subscription state:', error);
    return DEFAULT_STATE;
  }
}

/**
 * Save subscription state
 */
async function saveSubscriptionState(state: SubscriptionState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_STATE, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save subscription state:', error);
  }
}

/**
 * Check if user has premium access
 */
export async function isPremium(): Promise<boolean> {
  const state = await getSubscriptionState();
  return state.tier !== 'free' && state.isActive;
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(feature: string): Promise<boolean> {
  const state = await getSubscriptionState();

  // Get all features for current tier
  const tierFeatures = TIER_FEATURES[state.tier] || [];

  // Check inheritance (higher tiers include lower tier features)
  const allFeatures = new Set<string>();

  if (state.tier === 'lifetime' || state.tier === 'pro') {
    Object.values(TIER_FEATURES).flat().forEach((f) => allFeatures.add(f));
  } else if (state.tier === 'skills_plus') {
    TIER_FEATURES.free.forEach((f) => allFeatures.add(f));
    TIER_FEATURES.skills_plus.forEach((f) => allFeatures.add(f));
  } else {
    TIER_FEATURES.free.forEach((f) => allFeatures.add(f));
  }

  return allFeatures.has(feature) || allFeatures.has('all_features');
}

// ============================================
// PAYMENT PLATFORM DETECTION
// ============================================

/**
 * Detect current payment platform
 */
export function getPaymentPlatform(): PaymentPlatform {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

/**
 * Get platform-specific store name
 */
export function getStoreName(): string {
  const platform = getPaymentPlatform();
  switch (platform) {
    case 'ios':
      return 'App Store';
    case 'android':
      return 'Google Play';
    case 'web':
      return 'our website';
    default:
      return 'the store';
  }
}

// ============================================
// PAYMENT ROUTING
// ============================================

// Product IDs for each platform
const PRODUCT_IDS = {
  ios: {
    skills_plus_monthly: 'com.moodleaf.skillsplus.monthly',
    skills_plus_yearly: 'com.moodleaf.skillsplus.yearly',
    pro_monthly: 'com.moodleaf.pro.monthly',
    lifetime: 'com.moodleaf.lifetime',
  },
  android: {
    skills_plus_monthly: 'skills_plus_monthly',
    skills_plus_yearly: 'skills_plus_yearly',
    pro_monthly: 'pro_monthly',
    lifetime: 'lifetime',
  },
  web: {
    skills_plus_monthly: 'price_skillsplus_monthly',
    skills_plus_yearly: 'price_skillsplus_yearly',
    pro_monthly: 'price_pro_monthly',
    lifetime: 'price_lifetime',
  },
};

// URLs for payment
const PAYMENT_URLS = {
  web: 'https://moodleaf.app/upgrade',
  stripe_checkout: 'https://checkout.stripe.com/c/pay/',
};

/**
 * Initiate purchase flow
 */
export async function initiatePurchase(planId: string): Promise<PurchaseResult> {
  const platform = getPaymentPlatform();

  try {
    switch (platform) {
      case 'ios':
        return await initiateIOSPurchase(planId);
      case 'android':
        return await initiateAndroidPurchase(planId);
      case 'web':
        return await initiateWebPurchase(planId);
      default:
        return { success: false, error: 'Unknown platform' };
    }
  } catch (error) {
    console.error('Purchase error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * iOS App Store purchase
 */
async function initiateIOSPurchase(planId: string): Promise<PurchaseResult> {
  // In a real app, this would use react-native-iap or expo-in-app-purchases
  // For now, we'll use a placeholder that opens the App Store

  const productId = PRODUCT_IDS.ios[planId as keyof typeof PRODUCT_IDS.ios];
  if (!productId) {
    return { success: false, error: 'Invalid plan ID' };
  }

  // TODO: Implement actual IAP with react-native-iap
  // For now, return a message
  return {
    success: false,
    error: 'iOS In-App Purchase integration coming soon. Visit moodleaf.app/upgrade for web purchase.',
  };
}

/**
 * Android Google Play purchase
 */
async function initiateAndroidPurchase(planId: string): Promise<PurchaseResult> {
  // In a real app, this would use react-native-iap
  const productId = PRODUCT_IDS.android[planId as keyof typeof PRODUCT_IDS.android];
  if (!productId) {
    return { success: false, error: 'Invalid plan ID' };
  }

  // TODO: Implement actual IAP with react-native-iap
  return {
    success: false,
    error: 'Google Play purchase integration coming soon. Visit moodleaf.app/upgrade for web purchase.',
  };
}

/**
 * Web Stripe purchase
 */
async function initiateWebPurchase(planId: string): Promise<PurchaseResult> {
  const priceId = PRODUCT_IDS.web[planId as keyof typeof PRODUCT_IDS.web];
  if (!priceId) {
    return { success: false, error: 'Invalid plan ID' };
  }

  // Open Stripe checkout in browser
  const checkoutUrl = `${PAYMENT_URLS.web}?plan=${planId}`;

  try {
    const canOpen = await Linking.canOpenURL(checkoutUrl);
    if (canOpen) {
      await Linking.openURL(checkoutUrl);
      return { success: true }; // User will complete in browser
    } else {
      return { success: false, error: 'Could not open checkout page' };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Restore purchases (iOS/Android)
 */
export async function restorePurchases(): Promise<PurchaseResult> {
  const platform = getPaymentPlatform();

  // TODO: Implement actual restore with react-native-iap
  // For now, return placeholder
  return {
    success: false,
    error: `Restore purchases for ${platform} coming soon.`,
  };
}

// ============================================
// MANUAL SUBSCRIPTION (for testing/promo codes)
// ============================================

/**
 * Manually activate a subscription (for testing/promo codes)
 */
export async function activateSubscription(
  tier: SubscriptionTier,
  durationDays?: number
): Promise<SubscriptionState> {
  const now = new Date();
  let expiresAt: string | undefined;

  if (tier !== 'lifetime' && durationDays) {
    const expiry = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    expiresAt = expiry.toISOString();
  }

  // Build feature list
  const unlockedFeatures: string[] = [];
  if (tier === 'lifetime' || tier === 'pro') {
    Object.values(TIER_FEATURES).flat().forEach((f) => {
      if (!unlockedFeatures.includes(f)) unlockedFeatures.push(f);
    });
  } else if (tier === 'skills_plus') {
    [...TIER_FEATURES.free, ...TIER_FEATURES.skills_plus].forEach((f) => {
      if (!unlockedFeatures.includes(f)) unlockedFeatures.push(f);
    });
  } else {
    unlockedFeatures.push(...TIER_FEATURES.free);
  }

  const state: SubscriptionState = {
    tier,
    expiresAt,
    platform: getPaymentPlatform(),
    purchaseDate: now.toISOString(),
    isActive: true,
    unlockedFeatures,
  };

  await saveSubscriptionState(state);
  return state;
}

/**
 * Deactivate subscription (revert to free)
 */
export async function deactivateSubscription(): Promise<SubscriptionState> {
  const state: SubscriptionState = {
    ...DEFAULT_STATE,
    tier: 'free',
    isActive: true,
  };

  await saveSubscriptionState(state);
  return state;
}

// ============================================
// PROMO CODES
// ============================================

const PROMO_CODES: Record<string, { tier: SubscriptionTier; days: number }> = {
  'MOODLEAF2024': { tier: 'skills_plus', days: 30 },
  'TESTPRO': { tier: 'pro', days: 7 },
  'LIFETIME': { tier: 'lifetime', days: 0 },
};

/**
 * Redeem a promo code
 */
export async function redeemPromoCode(code: string): Promise<{
  success: boolean;
  message: string;
  state?: SubscriptionState;
}> {
  const upperCode = code.toUpperCase().trim();
  const promo = PROMO_CODES[upperCode];

  if (!promo) {
    return {
      success: false,
      message: 'Invalid promo code. Please check and try again.',
    };
  }

  const state = await activateSubscription(promo.tier, promo.days || undefined);

  const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === promo.tier);
  const durationText = promo.days > 0 ? ` for ${promo.days} days` : '';

  return {
    success: true,
    message: `${plan?.emoji || '🎉'} Promo code applied! You now have ${plan?.name || promo.tier}${durationText}.`,
    state,
  };
}

// ============================================
// UI HELPERS
// ============================================

/**
 * Get upgrade prompt text
 */
export function getUpgradePrompt(feature: string): string {
  const prompts: Record<string, string> = {
    all_breathing: 'Unlock all breathing exercises with Skills+',
    advanced_skills: 'Access advanced psychological tools with Pro',
    custom_fireflies: 'Create custom Firefly categories with Pro',
    default: 'Upgrade to access this feature',
  };

  return prompts[feature] || prompts.default;
}

/**
 * Get subscription status display text
 */
export async function getSubscriptionStatusText(): Promise<string> {
  const state = await getSubscriptionState();

  if (state.tier === 'free') {
    return 'Free Plan';
  }

  const plan = SUBSCRIPTION_PLANS.find((p) => p.tier === state.tier);
  const name = plan?.name || state.tier;

  if (state.tier === 'lifetime') {
    return `${plan?.emoji || '🌳'} Lifetime Member`;
  }

  if (state.expiresAt) {
    const expiry = new Date(state.expiresAt);
    const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 7) {
      return `${plan?.emoji || '⭐'} ${name} (${daysLeft} days left)`;
    }
  }

  return `${plan?.emoji || '⭐'} ${name}`;
}
