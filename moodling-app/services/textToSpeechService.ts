/**
 * Text-to-Speech Service
 *
 * Provides natural-sounding voice output for coach responses using Google Cloud TTS.
 * Each coach has a unique voice that matches their personality.
 *
 * Following Mood Leaf Ethics:
 * - Voice is optional, not forced
 * - User controls their experience
 * - Privacy-respecting (text sent to API, not stored)
 *
 * Unit: Voice Output System
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CoachPersona } from './coachPersonalityService';

// Lazy imports for expo-av and expo-file-system to handle missing dependencies
let Audio: any = null;
let FileSystem: any = null;

const loadAudioModule = async () => {
  if (!Audio) {
    try {
      const module = await import('expo-av');
      Audio = module.Audio;
    } catch {
      console.warn('expo-av not available - TTS audio playback disabled');
    }
  }
  return Audio;
};

const loadFileSystemModule = async () => {
  if (!FileSystem) {
    try {
      FileSystem = await import('expo-file-system');
    } catch {
      console.warn('expo-file-system not available - TTS disabled');
    }
  }
  return FileSystem;
};

const STORAGE_KEYS = {
  TTS_SETTINGS: 'moodleaf_tts_settings',
  TTS_API_KEY: 'moodleaf_google_tts_api_key',
};

// ============================================
// TYPES
// ============================================

export type VoiceGender = 'male' | 'female';

export interface VoiceProfile {
  voiceId: string;           // Google TTS voice name
  languageCode: string;      // e.g., 'en-US'
  speakingRate: number;      // 0.25 to 4.0 (1.0 is normal)
  pitch: number;             // -20.0 to 20.0 (0 is normal)
  volumeGainDb: number;      // -96.0 to 16.0 (0 is normal)
}

export interface CoachVoiceConfig {
  male: VoiceProfile;
  female: VoiceProfile;
}

export interface TTSSettings {
  enabled: boolean;
  voiceGender: VoiceGender;
  autoPlay: boolean;           // Auto-play voice when coach responds
  speakingRateMultiplier: number;  // User adjustment (0.5 to 1.5)
  volume: number;              // 0 to 1
}

export type TTSState = 'idle' | 'loading' | 'playing' | 'error';

// ============================================
// VOICE MAPPINGS
// Each coach has male/female Neural2 voices
// ============================================

/**
 * Google Cloud TTS Neural2 voice mappings for each coach.
 * Voices chosen to match personality traits.
 */
export const COACH_VOICES: Record<CoachPersona, CoachVoiceConfig> = {
  // Clover - The Bestie: Warm, casual, friendly
  clover: {
    female: {
      voiceId: 'en-US-Neural2-C',  // Warm, friendly female
      languageCode: 'en-US',
      speakingRate: 1.05,          // Slightly faster (casual chat)
      pitch: 1.0,
      volumeGainDb: 0,
    },
    male: {
      voiceId: 'en-US-Neural2-D',  // Friendly male
      languageCode: 'en-US',
      speakingRate: 1.05,
      pitch: 0,
      volumeGainDb: 0,
    },
  },

  // Spark - The Hype Squad: Energetic, motivating
  spark: {
    female: {
      voiceId: 'en-US-Neural2-F',  // Bright, energetic female
      languageCode: 'en-US',
      speakingRate: 1.15,          // Faster (energetic)
      pitch: 2.0,                  // Slightly higher (upbeat)
      volumeGainDb: 1.0,
    },
    male: {
      voiceId: 'en-US-Neural2-A',  // Energetic male
      languageCode: 'en-US',
      speakingRate: 1.15,
      pitch: 1.0,
      volumeGainDb: 1.0,
    },
  },

  // Willow - The Sage: Calm wisdom, reflective
  willow: {
    female: {
      voiceId: 'en-US-Neural2-G',  // Mature, thoughtful female
      languageCode: 'en-US',
      speakingRate: 0.92,          // Slower (wise, measured)
      pitch: -1.0,                 // Slightly lower (grounded)
      volumeGainDb: 0,
    },
    male: {
      voiceId: 'en-US-Neural2-J',  // Mature, wise male
      languageCode: 'en-US',
      speakingRate: 0.92,
      pitch: -2.0,
      volumeGainDb: 0,
    },
  },

  // Luna - The Spiritual: Mindful, present-moment
  luna: {
    female: {
      voiceId: 'en-US-Neural2-E',  // Soft, calming female
      languageCode: 'en-US',
      speakingRate: 0.88,          // Slower (calming)
      pitch: 0,
      volumeGainDb: -1.0,          // Slightly softer
    },
    male: {
      voiceId: 'en-US-Neural2-I',  // Gentle male
      languageCode: 'en-US',
      speakingRate: 0.88,
      pitch: -1.0,
      volumeGainDb: -1.0,
    },
  },

  // Ridge - The Coach: Action-oriented, structured
  ridge: {
    female: {
      voiceId: 'en-US-Neural2-H',  // Confident, clear female
      languageCode: 'en-US',
      speakingRate: 1.0,
      pitch: 0,
      volumeGainDb: 0.5,
    },
    male: {
      voiceId: 'en-US-Neural2-D',  // Strong, confident male
      languageCode: 'en-US',
      speakingRate: 1.0,
      pitch: -1.5,
      volumeGainDb: 0.5,
    },
  },

  // Flint - The Straight Shooter: Direct, honest
  flint: {
    female: {
      voiceId: 'en-US-Neural2-F',  // Direct female
      languageCode: 'en-US',
      speakingRate: 1.08,          // Brisk pace (no-nonsense)
      pitch: -0.5,
      volumeGainDb: 0,
    },
    male: {
      voiceId: 'en-US-Neural2-A',  // Direct male
      languageCode: 'en-US',
      speakingRate: 1.08,
      pitch: -2.0,                 // Lower (gravitas)
      volumeGainDb: 0,
    },
  },

  // Fern - The Cozy Blanket: Extra gentle, nurturing
  fern: {
    female: {
      voiceId: 'en-US-Neural2-E',  // Soft, nurturing female
      languageCode: 'en-US',
      speakingRate: 0.9,           // Slow, gentle pace
      pitch: 1.5,                  // Slightly higher (soft)
      volumeGainDb: -0.5,          // Gentle volume
    },
    male: {
      voiceId: 'en-US-Neural2-I',  // Gentle, warm male
      languageCode: 'en-US',
      speakingRate: 0.9,
      pitch: 0,
      volumeGainDb: -0.5,
    },
  },
};

// ============================================
// DEFAULT SETTINGS
// ============================================

const DEFAULT_TTS_SETTINGS: TTSSettings = {
  enabled: false,              // Off by default, user opts in
  voiceGender: 'female',       // Default to female voices
  autoPlay: true,              // Auto-play when enabled
  speakingRateMultiplier: 1.0,
  volume: 0.8,
};

// ============================================
// SETTINGS MANAGEMENT
// ============================================

/**
 * Get current TTS settings
 */
export async function getTTSSettings(): Promise<TTSSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TTS_SETTINGS);
    if (data) {
      return { ...DEFAULT_TTS_SETTINGS, ...JSON.parse(data) };
    }
    return DEFAULT_TTS_SETTINGS;
  } catch (error) {
    console.error('Failed to load TTS settings:', error);
    return DEFAULT_TTS_SETTINGS;
  }
}

/**
 * Save TTS settings
 */
export async function saveTTSSettings(settings: TTSSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TTS_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save TTS settings:', error);
  }
}

/**
 * Update specific TTS settings
 */
export async function updateTTSSettings(
  updates: Partial<TTSSettings>
): Promise<TTSSettings> {
  const current = await getTTSSettings();
  const updated = { ...current, ...updates };
  await saveTTSSettings(updated);
  return updated;
}

/**
 * Toggle TTS on/off
 */
export async function toggleTTS(enabled?: boolean): Promise<boolean> {
  const current = await getTTSSettings();
  const newEnabled = enabled !== undefined ? enabled : !current.enabled;
  await updateTTSSettings({ enabled: newEnabled });
  return newEnabled;
}

/**
 * Set voice gender preference
 */
export async function setVoiceGender(gender: VoiceGender): Promise<void> {
  await updateTTSSettings({ voiceGender: gender });
}

// ============================================
// API KEY MANAGEMENT
// ============================================

/**
 * Check if TTS API key is configured
 */
export async function hasTTSAPIKey(): Promise<boolean> {
  try {
    const key = await AsyncStorage.getItem(STORAGE_KEYS.TTS_API_KEY);
    return !!key && key.length > 0;
  } catch {
    return false;
  }
}

/**
 * Set TTS API key
 */
export async function setTTSAPIKey(apiKey: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.TTS_API_KEY, apiKey);
}

/**
 * Get TTS API key
 */
export async function getTTSAPIKey(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.TTS_API_KEY);
}

/**
 * Clear TTS API key
 */
export async function clearTTSAPIKey(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.TTS_API_KEY);
}

// ============================================
// TTS ENGINE
// ============================================

let currentSound: any = null;

/**
 * Get voice profile for a specific coach and gender
 */
export function getVoiceForCoach(
  persona: CoachPersona,
  gender: VoiceGender
): VoiceProfile {
  const config = COACH_VOICES[persona] || COACH_VOICES.clover;
  return config[gender];
}

export interface SynthesisResult {
  audioUri?: string;
  error?: string;
}

/**
 * Synthesize speech using Google Cloud TTS
 */
export async function synthesizeSpeech(
  text: string,
  persona: CoachPersona,
  options?: Partial<TTSSettings>
): Promise<SynthesisResult> {
  const apiKey = await getTTSAPIKey();
  if (!apiKey) {
    console.warn('[TTS] No API key configured');
    return { error: 'No API key configured. Add your Google TTS API key in Settings.' };
  }

  const settings = await getTTSSettings();
  const gender = options?.voiceGender ?? settings.voiceGender;
  const rateMultiplier = options?.speakingRateMultiplier ?? settings.speakingRateMultiplier;

  const voice = getVoiceForCoach(persona, gender);

  // Prepare request body
  const requestBody = {
    input: {
      text: cleanTextForSpeech(text),
    },
    voice: {
      languageCode: voice.languageCode,
      name: voice.voiceId,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: voice.speakingRate * rateMultiplier,
      pitch: voice.pitch,
      volumeGainDb: voice.volumeGainDb,
    },
  };

  try {
    // Add timeout to prevent hanging if API is slow
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TTS] API error:', response.status, errorText);

      // Parse Google API error for user-friendly message
      try {
        const errorData = JSON.parse(errorText);
        const message = errorData?.error?.message || errorText;
        const status = errorData?.error?.status || response.status;

        if (status === 403 || message.includes('API key')) {
          return { error: `API key error: ${message}. Check that your key is valid and Text-to-Speech API is enabled.` };
        }
        if (status === 401) {
          return { error: 'Invalid API key. Please check your Google TTS API key.' };
        }
        if (message.includes('billing')) {
          return { error: 'Billing not enabled. Enable billing in Google Cloud Console.' };
        }
        if (message.includes('quota')) {
          return { error: 'API quota exceeded. Wait or increase your quota.' };
        }
        return { error: `Google API error: ${message}` };
      } catch {
        return { error: `API error (${response.status}): ${errorText.substring(0, 100)}` };
      }
    }

    const data = await response.json();

    if (!data.audioContent) {
      console.error('[TTS] No audio content in response');
      return { error: 'No audio returned from Google. Try again.' };
    }

    // Save audio to temp file
    const fs = await loadFileSystemModule();
    if (!fs) {
      console.warn('[TTS] FileSystem not available');
      return { error: 'File system not available. Cannot save audio.' };
    }
    const audioUri = `${fs.cacheDirectory}tts_${Date.now()}.mp3`;
    await fs.writeAsStringAsync(audioUri, data.audioContent, {
      encoding: fs.EncodingType.Base64,
    });

    return { audioUri };
  } catch (error) {
    console.error('[TTS] Synthesis failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('aborted')) {
      return { error: 'Request timed out. Check your internet connection.' };
    }
    return { error: `Synthesis failed: ${message}` };
  }
}

/**
 * Clean text for speech synthesis
 * Removes markdown, emojis, and other non-speakable content
 */
function cleanTextForSpeech(text: string): string {
  let cleaned = text;

  // Remove markdown formatting
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1'); // Bold
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');     // Italic
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');       // Underscore italic
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');       // Code
  cleaned = cleaned.replace(/~~([^~]+)~~/g, '$1');     // Strikethrough
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Links

  // Remove emojis (most common ranges)
  cleaned = cleaned.replace(
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu,
    ''
  );

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Limit length (Google TTS has limits)
  if (cleaned.length > 5000) {
    cleaned = cleaned.substring(0, 5000);
    // Try to end at a sentence
    const lastPeriod = cleaned.lastIndexOf('.');
    if (lastPeriod > 4000) {
      cleaned = cleaned.substring(0, lastPeriod + 1);
    }
  }

  return cleaned;
}

/**
 * Play synthesized audio
 */
export async function playAudio(audioUri: string, volume?: number): Promise<void> {
  // Stop any currently playing audio
  await stopAudio();

  const AudioModule = await loadAudioModule();
  if (!AudioModule) {
    console.warn('[TTS] Audio module not available');
    return;
  }

  try {
    const settings = await getTTSSettings();
    const { sound } = await AudioModule.Sound.createAsync(
      { uri: audioUri },
      { volume: volume ?? settings.volume }
    );

    currentSound = sound;

    // Clean up when finished
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        cleanupSound(sound, audioUri);
      }
    });

    await sound.playAsync();
  } catch (error) {
    console.error('[TTS] Playback failed:', error);
    throw error;
  }
}

/**
 * Stop currently playing audio
 */
export async function stopAudio(): Promise<void> {
  if (currentSound) {
    const sound = currentSound;
    currentSound = null; // Clear immediately to prevent race conditions

    // Handle errors independently - don't let stopAsync failure prevent unloadAsync
    try {
      await sound.stopAsync();
    } catch (error) {
      // Ignore - may already be stopped
    }

    try {
      await sound.unloadAsync();
    } catch (error) {
      console.error('[TTS] Unload failed:', error);
    }
  }
}

/**
 * Cleanup sound and temp file
 */
async function cleanupSound(sound: any, audioUri: string): Promise<void> {
  try {
    await sound.unloadAsync();
    const fs = await loadFileSystemModule();
    if (fs) {
      await fs.deleteAsync(audioUri, { idempotent: true });
    }
  } catch (error) {
    console.error('[TTS] Cleanup failed:', error);
  }

  if (currentSound === sound) {
    currentSound = null;
  }
}

/**
 * Check if audio is currently playing
 */
export async function isPlaying(): Promise<boolean> {
  if (!currentSound) return false;

  try {
    const status = await currentSound.getStatusAsync();
    return status.isLoaded && status.isPlaying;
  } catch {
    return false;
  }
}

// ============================================
// HIGH-LEVEL API
// ============================================

/**
 * Speak a coach response
 * Main entry point for TTS functionality
 */
export async function speakCoachResponse(
  text: string,
  persona: CoachPersona
): Promise<{ success: boolean; error?: string }> {
  const settings = await getTTSSettings();

  if (!settings.enabled) {
    return { success: false, error: 'TTS is disabled' };
  }

  const hasKey = await hasTTSAPIKey();
  if (!hasKey) {
    return { success: false, error: 'No API key configured' };
  }

  try {
    const result = await synthesizeSpeech(text, persona);

    if (result.error || !result.audioUri) {
      return { success: false, error: result.error || 'Failed to synthesize speech' };
    }

    await playAudio(result.audioUri);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

/**
 * Test TTS with a sample message
 */
export async function testTTS(
  persona: CoachPersona,
  gender: VoiceGender
): Promise<{ success: boolean; error?: string }> {
  const testMessages: Record<CoachPersona, string> = {
    clover: "Hey there! I'm Clover, your friendly companion. How are you feeling today?",
    spark: "Yes! I'm Spark, and I'm so excited to be here with you! Let's make today amazing!",
    willow: "Welcome. I'm Willow. Take a moment to breathe. What brings you here today?",
    luna: "Breathe. Be present. I'm Luna, and this moment is exactly where you need to be.",
    ridge: "I'm Ridge. Let's focus on what matters. What's one thing you want to accomplish?",
    flint: "I'm Flint. No sugar-coating here. What's really going on?",
    fern: "Hi there, sweet soul. I'm Fern. You're safe here. Take all the time you need.",
  };

  const text = testMessages[persona];

  try {
    const result = await synthesizeSpeech(text, persona, { voiceGender: gender });

    if (result.error || !result.audioUri) {
      return { success: false, error: result.error || 'Failed to synthesize speech' };
    }

    await playAudio(result.audioUri);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// ============================================
// SIMPLE TEXT SPEECH
// ============================================

/**
 * Check if TTS is available and configured
 */
export async function isTTSAvailable(): Promise<boolean> {
  const settings = await getTTSSettings();
  if (!settings.enabled) return false;
  const hasKey = await hasTTSAPIKey();
  return hasKey;
}

/**
 * Simple text-to-speech function
 * Uses neutral voice for general narration
 */
export async function speakText(text: string): Promise<void> {
  const available = await isTTSAvailable();
  if (!available) {
    console.log('[TTS] Not available for speakText');
    return;
  }

  try {
    const audioUri = await synthesizeSpeech(text, {
      voice: 'nova', // Neutral voice for narration
      speed: 1.0,
    });

    if (audioUri) {
      await playAudio(audioUri);
    }
  } catch (error) {
    console.error('[TTS] speakText error:', error);
  }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize audio system for TTS
 */
export async function initializeTTS(): Promise<void> {
  try {
    const AudioModule = await loadAudioModule();
    if (!AudioModule) {
      console.warn('[TTS] Audio module not available - TTS disabled');
      return;
    }
    await AudioModule.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    console.log('[TTS] Audio system initialized');
  } catch (error) {
    console.error('[TTS] Failed to initialize audio:', error);
  }
}
