import { useState, useCallback } from 'react';
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
import { Colors } from '@/constants/Colors';
import { JournalEntry, createJournalEntry } from '@/types/JournalEntry';
import { saveEntry, getAllEntries } from '@/services/journalStorage';
import { analyzeSentiment } from '@/services/sentimentAnalysis';

/**
 * Journal Tab - Primary Entry Point
 *
 * Following Moodling Ethics:
 * - "How are you feeling right now?" (warm, present)
 * - No pressure, no streaks, no guilt
 * - Compassionate, grounded interface
 *
 * Unit 1: Text editor, save button, timestamp, character count
 * Unit 2: Persistent storage (data survives restart)
 * Unit 3: Entry history list, detail view, delete
 * Unit 4: Sentiment analysis with mood emoji
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

      // Update local state
      setEntries((prev) => [newEntry, ...prev]);
      setEntryText('');
      setJustSaved(true);

      // Clear "just saved" feedback after 3 seconds
      setTimeout(() => setJustSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save entry:', error);
      // Could show error toast here
    } finally {
      setIsSaving(false);
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
            value={entryText}
            onChangeText={setEntryText}
            textAlignVertical="top"
            editable={!isSaving}
          />
        </View>

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

        {/* Just saved feedback */}
        {justSaved && (
          <Text style={[styles.savedFeedback, { color: colors.success }]}>
            Entry saved
          </Text>
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
                {latestEntry.sentiment && (
                  <Text style={styles.moodEmoji}>{latestEntry.sentiment.emoji}</Text>
                )}
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
  savedFeedback: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
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
});
