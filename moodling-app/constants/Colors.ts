/**
 * Mood Leaf Color Palette
 *
 * Warm, grounded, calming colors following Mood Leaf's tone:
 * - Not clinical or sterile
 * - Not overly bright or stimulating
 * - Gentle, inviting, human
 */

const warmNeutral = {
  cream: '#F5F0EB',
  sand: '#E8E0D5',
  stone: '#9B8F82',
  earth: '#6B5D4D',
  charcoal: '#2C2825',
};

const accent = {
  sage: '#8FAE8B',      // Calm, growth
  terracotta: '#C4846C', // Warm, grounding
  lavender: '#A89BC4',   // Gentle, reflective
};

export const Colors = {
  light: {
    // Backgrounds
    background: warmNeutral.cream,
    card: '#FFFFFF',
    border: warmNeutral.sand,

    // Text
    text: warmNeutral.charcoal,
    textSecondary: warmNeutral.earth,
    textMuted: warmNeutral.stone,

    // Navigation
    tint: accent.sage,
    tabIconDefault: warmNeutral.stone,
    tabIconSelected: accent.sage,

    // Mood indicators
    moodPositive: accent.sage,
    moodNeutral: warmNeutral.stone,
    moodNegative: accent.terracotta,

    // Interactive
    buttonPrimary: accent.sage,
    buttonSecondary: warmNeutral.sand,
    link: accent.lavender,

    // System
    error: '#C75D5D',
    warning: accent.terracotta,
    success: accent.sage,
  },
  dark: {
    // Backgrounds
    background: '#1C1A18',
    card: '#2C2825',
    border: '#3D3835',

    // Text
    text: warmNeutral.cream,
    textSecondary: warmNeutral.sand,
    textMuted: warmNeutral.stone,

    // Navigation
    tint: accent.sage,
    tabIconDefault: warmNeutral.stone,
    tabIconSelected: accent.sage,

    // Mood indicators
    moodPositive: accent.sage,
    moodNeutral: warmNeutral.stone,
    moodNegative: accent.terracotta,

    // Interactive
    buttonPrimary: accent.sage,
    buttonSecondary: '#3D3835',
    link: accent.lavender,

    // System
    error: '#E07070',
    warning: accent.terracotta,
    success: accent.sage,
  },
};

export type ColorScheme = keyof typeof Colors;
export type ThemeColors = typeof Colors.light;
