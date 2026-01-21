import { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { JournalEntry, createJournalEntry } from '@/types/JournalEntry';
import { saveEntry, getAllEntries } from '@/services/journalStorage';
import { analyzeSentiment } from '@/services/sentimentAnalysis';
import { voiceRecording, isVoiceRecordingSupported, VoiceRecordingState } from '@/services/voiceRecording';
import {
  recordEntry,
  getAntiDependencyMessage,
  getAffirmationMessage,
  AntiDependencyMessage,
} from '@/services/usageTrackingService';
import { generateStyledReflection } from '@/services/reflectionService';
import { MoodCategory } from '@/services/sentimentAnalysis';
import {
  getCoachSettings,
  getCoachDisplayName,
  getCoachEmoji,
} from '@/services/coachPersonalityService';
import { autoLogFromJournal } from '@/services/foodTrackingService';

/**
 * Journal Tab - Primary Entry Point
 *
 * Following Mood Leaf Ethics:
 * - "How are you feeling right now?" (warm, present)
 * - No pressure, no streaks, no guilt
 * - Compassionate, grounded interface
 *
 * Unit 1: Text editor, save button, timestamp, character count
 * Unit 2: Persistent storage (data survives restart)
 * Unit 3: Entry history list, detail view, delete
 * Unit 4: Sentiment analysis with mood emoji
 * Unit 5: Voice journaling with speech-to-text
 */

export default function JournalScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Entry text state
  const [entryText, setEntryText] = useState('');

  // Saved entries from storage
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Track if we just saved (for feedback)
  const [justSaved, setJustSaved] = useState(false);

  // Voice recording state (Unit 5)
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Anti-dependency state (Unit 13)
  const [antiDepMessage, setAntiDepMessage] = useState<AntiDependencyMessage | null>(null);
  const [showAffirmation, setShowAffirmation] = useState(false);
  const [affirmationText, setAffirmationText] = useState('');

  // Compassionate reflection state (Unit 15)
  const [savedReflection, setSavedReflection] = useState<string>('');

  // Coach persona state
  const [coachName, setCoachName] = useState('Your Guide');
  const [coachEmoji, setCoachEmoji] = useState('🌿');

  // Food detection feedback state
  const [detectedFood, setDetectedFood] = useState<string | null>(null);

  // Load coach persona on mount
  useEffect(() => {
    const loadCoach = async () => {
      const settings = await getCoachSettings();
      setCoachName(getCoachDisplayName(settings));
      setCoachEmoji(getCoachEmoji(settings));
    };
    loadCoach();
  }, []);

  // Check voice support on mount
  useEffect(() => {
    setVoiceSupported(isVoiceRecordingSupported());
  }, []);

  // Load anti-dependency message on mount (Unit 13)
  useEffect(() => {
    const loadMessage = async () => {
      const message = await getAntiDependencyMessage();
      if (message.show) {
        setAntiDepMessage(message);
      }
    };
    loadMessage();
  }, []);

  const characterCount = entryText.length;
  const canSave = entryText.trim().length > 0 && !isSaving;

  // Define loadEntries first
  const loadEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = await getAllEntries();
      setEntries(stored);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load entries on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const handleSave = async () => {
    if (!canSave) return;

    try {
      setIsSaving(true);

      // Analyze sentiment (on-device, instant)
      const sentimentResult = analyzeSentiment(entryText);

      const newEntry = createJournalEntry(entryText, {
        score: sentimentResult.normalizedScore,
        mood: sentimentResult.mood,
        emoji: sentimentResult.emoji,
      });
      await saveEntry(newEntry);

      // Record entry for usage tracking (Unit 13)
      await recordEntry();

      // AI Food Detection - auto-log food from journal text
      try {
        const foodResult = await autoLogFromJournal(entryText);
        if (foodResult && foodResult.logged.length > 0) {
          const foodNames = foodResult.logged.map(e => e.foodItem.name).join(', ');
          setDetectedFood(`Logged: ${foodNames} (${foodResult.totalCalories} cal)`);
          setTimeout(() => setDetectedFood(null), 5000);
        }
      } catch (foodError) {
        console.log('Food detection skipped:', foodError);
      }

      // Update local state
      setEntries((prev) => [newEntry, ...prev]);
      setEntryText('');
      setJustSaved(true);

      // Generate compassionate reflection (Unit 15, Unit 16: tone-aware)
      const reflection = await generateStyledReflection(sentimentResult.mood as MoodCategory);
      setSavedReflection(reflection);

      // Occasionally show affirmation after saving (Unit 13)
      // Check updated anti-dependency status
      const updatedMessage = await getAntiDependencyMessage();
      if (updatedMessage.type === 'gentle_nudge' && updatedMessage.show) {
        setAffirmationText(getAffirmationMessage());
        setShowAffirmation(true);
        setTimeout(() => setShowAffirmation(false), 5000);
      }

      // Clear "just saved" feedback after 5 seconds (longer to read reflection)
      setTimeout(() => {
        setJustSaved(false);
        setSavedReflection('');
      }, 5000);
    } catch (error) {
      console.error('Failed to save entry:', error);
      // Could show error toast here
    } finally {
      setIsSaving(false);
    }
  };

  // Voice recording handlers (Unit 5)
  const handleVoiceToggle = () => {
    if (isRecording) {
      // Stop recording
      voiceRecording.stop();
      setIsRecording(false);
      setInterimTranscript('');
    } else {
      // Start recording
      setVoiceError(null);
      voiceRecording.start((state: Partial<VoiceRecordingState>) => {
        if (state.isRecording !== undefined) {
          setIsRecording(state.isRecording);
        }
        if (state.transcript !== undefined) {
          // Append transcribed text to entry
          setEntryText((prev) => {
            const separator = prev.trim() ? ' ' : '';
            return prev.trim() + separator + state.transcript;
          });
        }
        if (state.interimTranscript !== undefined) {
          setInterimTranscript(state.interimTranscript);
        }
        if (state.error) {
          setVoiceError(state.error);
          setIsRecording(false);
        }
      });
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const currentTime = formatTimestamp(new Date().toISOString());
  const latestEntry = entries[0];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Anti-Dependency Message (Unit 13) */}
        {antiDepMessage && antiDepMessage.show && (
          <View style={[styles.antiDepCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.antiDepTitle, { color: colors.text }]}>
              {antiDepMessage.title}
            </Text>
            <Text style={[styles.antiDepBody, { color: colors.textSecondary }]}>
              {antiDepMessage.body}
            </Text>
            <TouchableOpacity
              style={styles.antiDepDismiss}
              onPress={() => setAntiDepMessage(null)}
            >
              <Text style={[styles.antiDepDismissText, { color: colors.textMuted }]}>
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Header */}
        <View style={styles.welcomeContainer}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            How are you feeling right now?
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            No rush. Take your time.
          </Text>
        </View>

        {/* Text Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="Write whatever comes to mind..."
            placeholderTextColor={colors.textMuted}
            multiline
            value={entryText + (interimTranscript ? ` ${interimTranscript}` : '')}
            onChangeText={(text) => {
              // Only update if not showing interim transcript
              if (!interimTranscript) {
                setEntryText(text);
              }
            }}
            textAlignVertical="top"
            editable={!isSaving && !isRecording}
          />
        </View>

        {/* Voice Recording Button (Unit 5) */}
        {voiceSupported && (
          <View style={styles.voiceContainer}>
            <TouchableOpacity
              style={[
                styles.voiceButton,
                {
                  backgroundColor: isRecording ? '#FF3B30' : colors.card,
                  borderColor: isRecording ? '#FF3B30' : colors.border,
                },
              ]}
              onPress={handleVoiceToggle}
              activeOpacity={0.7}
            >
              <Text style={styles.voiceIcon}>{isRecording ? '🔴' : '🎤'}</Text>
              <Text
                style={[
                  styles.voiceButtonText,
                  { color: isRecording ? '#FFFFFF' : colors.text },
                ]}
              >
                {isRecording ? 'Recording...' : 'Tap to speak'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.voicePrivacy, { color: colors.textMuted }]}>
              🔒 Voice processed on your device
            </Text>
          </View>
        )}

        {/* Voice Error */}
        {voiceError && (
          <Text style={[styles.voiceError, { color: '#FF3B30' }]}>
            {voiceError}
          </Text>
        )}

        {/* Character count and timestamp */}
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {characterCount} {characterCount === 1 ? 'character' : 'characters'}
          </Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {currentTime}
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: canSave ? colors.buttonPrimary : colors.buttonSecondary,
              opacity: canSave ? 1 : 0.5,
            },
          ]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                { color: canSave ? '#FFFFFF' : colors.textMuted },
              ]}
            >
              Save Entry
            </Text>
          )}
        </TouchableOpacity>

        {/* Just saved feedback with reflection (Unit 15) */}
        {justSaved && (
          <View style={styles.savedFeedbackContainer}>
            <Text style={[styles.savedFeedback, { color: colors.success }]}>
              Entry saved
            </Text>
            {savedReflection && (
              <Text style={[styles.savedReflection, { color: colors.textSecondary }]}>
                {savedReflection}
              </Text>
            )}
          </View>
        )}

        {/* Affirmation message after saving (Unit 13) */}
        {showAffirmation && (
          <View style={[styles.affirmationCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.affirmationText, { color: colors.textSecondary }]}>
              {affirmationText}
            </Text>
          </View>
        )}

        {/* Food detection feedback */}
        {detectedFood && (
          <View style={[styles.foodDetectedCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.foodDetectedText, { color: colors.tint }]}>
              🍽️ {detectedFood}
            </Text>
          </View>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.textMuted} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Loading your entries...
            </Text>
          </View>
        )}

        {/* Latest Entry Preview */}
        {!isLoading && latestEntry && (
          <View style={styles.savedEntrySection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                Your last entry
              </Text>
              {entries.length > 0 && (
                <TouchableOpacity onPress={() => router.push('/history')}>
                  <Text style={[styles.viewAllLink, { color: colors.tint }]}>
                    View all →
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.savedEntryCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/entry/${latestEntry.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.entryHeader}>
                {/* Mood emoji removed - Mental health safe design:
                    No sad faces - text speaks for itself */}
                <Text style={[styles.savedEntryTime, { color: colors.textMuted }]}>
                  {formatTimestamp(latestEntry.createdAt)}
                </Text>
              </View>
              <Text
                style={[styles.savedEntryText, { color: colors.text }]}
                numberOfLines={4}
              >
                {latestEntry.text}
              </Text>
            </TouchableOpacity>
            {entries.length > 1 && (
              <TouchableOpacity onPress={() => router.push('/history')}>
                <Text style={[styles.entryCount, { color: colors.textMuted }]}>
                  + {entries.length - 1} more {entries.length - 1 === 1 ? 'entry' : 'entries'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Empty state */}
        {!isLoading && entries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
              Your journal entries will appear here
            </Text>
          </View>
        )}

        {/* Talk to Coach Button (Unit 19) */}
        <TouchableOpacity
          style={[styles.coachButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/coach')}
          activeOpacity={0.7}
        >
          <Text style={styles.coachButtonEmoji}>{coachEmoji}</Text>
          <View style={styles.coachButtonText}>
            <Text style={[styles.coachButtonTitle, { color: colors.text }]}>
              Talk with {coachName}
            </Text>
            <Text style={[styles.coachButtonSubtitle, { color: colors.textMuted }]}>
              Get support preparing for challenges
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Food Tracker Button */}
        <TouchableOpacity
          style={[styles.coachButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/food')}
          activeOpacity={0.7}
        >
          <Text style={styles.coachButtonEmoji}>🍽️</Text>
          <View style={styles.coachButtonText}>
            <Text style={[styles.coachButtonTitle, { color: colors.text }]}>
              Food Tracker
            </Text>
            <Text style={[styles.coachButtonSubtitle, { color: colors.textMuted }]}>
              Log meals and track calories
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.privacyNote, { color: colors.textMuted }]}>
            Everything stays on your device
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  inputContainer: {
    borderRadius: 16,
    padding: 16,
    minHeight: 180,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 150,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  metaText: {
    fontSize: 13,
  },
  saveButton: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  savedFeedbackContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  savedFeedback: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  savedReflection: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  savedEntrySection: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  savedEntryCard: {
    borderRadius: 12,
    padding: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodEmoji: {
    fontSize: 20,
  },
  savedEntryText: {
    fontSize: 15,
    lineHeight: 22,
  },
  savedEntryTime: {
    fontSize: 12,
  },
  entryCount: {
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyState: {
    marginTop: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  privacyNote: {
    fontSize: 12,
  },
  // Voice recording styles (Unit 5)
  voiceContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
  },
  voiceIcon: {
    fontSize: 20,
  },
  voiceButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  voicePrivacy: {
    marginTop: 8,
    fontSize: 12,
  },
  voiceError: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
  },
  // Anti-dependency styles (Unit 13)
  antiDepCard: {
    marginTop: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  antiDepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  antiDepBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  antiDepDismiss: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  antiDepDismissText: {
    fontSize: 13,
    fontWeight: '500',
  },
  affirmationCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  affirmationText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Food detection feedback styles
  foodDetectedCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#8b7cf7',
  },
  foodDetectedText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Unit 19: Coach button styles
  coachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  coachButtonEmoji: {
    fontSize: 26,
  },
  coachButtonText: {
    flex: 1,
  },
  coachButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  coachButtonSubtitle: {
    fontSize: 13,
  },
});
