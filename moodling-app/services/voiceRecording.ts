/**
 * Voice Recording Service
 *
 * Provides speech-to-text functionality for voice journaling.
 * Uses platform-native speech recognition (on-device where available).
 *
 * Following Mood Leaf Ethics:
 * - All processing happens on-device when possible
 * - Clear privacy indicators shown to user
 * - User controls when recording happens
 */

import { Platform } from 'react-native';

export interface VoiceRecordingState {
  isRecording: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
}

export type VoiceRecordingCallback = (state: Partial<VoiceRecordingState>) => void;

// Web Speech API types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

class VoiceRecordingService {
  private recognition: SpeechRecognition | null = null;
  private callback: VoiceRecordingCallback | null = null;
  private finalTranscript: string = '';

  /**
   * Check if voice recording is supported on this platform
   */
  isSupported(): boolean {
    if (Platform.OS === 'web') {
      return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
    // For native platforms, we'll add support later
    // iOS and Android have built-in speech recognition
    return false;
  }

  /**
   * Initialize the speech recognition
   */
  private initRecognition(): boolean {
    if (Platform.OS !== 'web') {
      return false;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      return false;
    }

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.callback?.({ isRecording: true, error: null });
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = this.finalTranscript;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
          this.finalTranscript = finalTranscript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      this.callback?.({
        transcript: finalTranscript.trim(),
        interimTranscript: interimTranscript,
      });
    };

    this.recognition.onerror = (event: { error: string }) => {
      let errorMessage = 'Voice recording error';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred.';
          break;
        default:
          errorMessage = `Error: ${event.error}`;
      }

      this.callback?.({ error: errorMessage, isRecording: false });
    };

    this.recognition.onend = () => {
      this.callback?.({ isRecording: false });
    };

    return true;
  }

  /**
   * Start recording
   */
  start(callback: VoiceRecordingCallback): boolean {
    this.callback = callback;
    this.finalTranscript = '';

    if (!this.isSupported()) {
      callback({
        isSupported: false,
        error: 'Voice recording is not supported on this device.'
      });
      return false;
    }

    if (!this.initRecognition()) {
      callback({ error: 'Failed to initialize voice recording.' });
      return false;
    }

    try {
      this.recognition?.start();
      return true;
    } catch (error) {
      callback({ error: 'Failed to start recording.' });
      return false;
    }
  }

  /**
   * Stop recording
   */
  stop(): void {
    try {
      this.recognition?.stop();
    } catch (error) {
      // Ignore errors when stopping
    }
  }

  /**
   * Get the final transcript
   */
  getTranscript(): string {
    return this.finalTranscript.trim();
  }

  /**
   * Reset the transcript
   */
  reset(): void {
    this.finalTranscript = '';
    this.callback?.({ transcript: '', interimTranscript: '' });
  }
}

// Export singleton instance
export const voiceRecording = new VoiceRecordingService();

/**
 * Check if voice recording is available
 */
export function isVoiceRecordingSupported(): boolean {
  return voiceRecording.isSupported();
}
