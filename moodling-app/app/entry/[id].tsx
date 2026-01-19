import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { JournalEntry } from '@/types/JournalEntry';
import { getEntryById, deleteEntry } from '@/services/journalStorage';
import {
  generateStyledReflection,
  shouldSuggestSupport,
  getSupportSuggestion,
} from '@/services/reflectionService';
import { MoodCategory } from '@/services/sentimentAnalysis';

/**
 * Entry Detail Screen - View Single Journal Entry
 *
 * Following Moodling Ethics:
 * - User owns their data (can delete)
 * - No judgment, just reflection
 * - Respectful of their words
 *
 * Unit 3: Detail view with delete functionality
 */

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Compassionate reflection (Unit 15)
  const [reflection, setReflection] = useState<string>('');
  const [supportSuggestion, setSupportSuggestion] = useState<string | null>(null);

  useEffect(() => {
    loadEntry();
  }, [id]);

  const loadEntry = async () => {
    if (!id) return;
    try {
      const found = await getEntryById(id);
      setEntry(found);

      // Generate compassionate reflection (Unit 15, Unit 16: tone-aware)
      if (found?.sentiment?.mood) {
        const mood = found.sentiment.mood as MoodCategory;
        setReflection(await generateStyledReflection(mood));

        // Check if we should gently suggest support
        if (shouldSuggestSupport(mood)) {
          setSupportSuggestion(getSupportSuggestion());
        }
      }
    } catch (error) {
      console.error('Failed to load entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleDelete = () => {
    // Platform-specific confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Are you sure you want to delete this entry? This cannot be undone.'
      );
      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Entry',
        'Are you sure you want to delete this entry? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  const performDelete = async () => {
    if (!id) return;
    try {
      setIsDeleting(true);
      await deleteEntry(id);
      router.back();
    } catch (error) {
      console.error('Failed to delete entry:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to delete entry. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to delete entry. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          Loading...
        </Text>
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textMuted }]}>
          Entry not found
        </Text>
        <TouchableOpacity
          style={[styles.backLink, { borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backLinkText, { color: colors.tint }]}>
            Go back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          style={[styles.deleteButton, { opacity: isDeleting ? 0.5 : 1 }]}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Date and time */}
        <View style={styles.dateContainer}>
          <View style={styles.dateRow}>
            {entry.sentiment && (
              <Text style={styles.moodEmoji}>{entry.sentiment.emoji}</Text>
            )}
            <View>
              <Text style={[styles.date, { color: colors.textSecondary }]}>
                {formatFullDate(entry.createdAt)}
              </Text>
              <Text style={[styles.time, { color: colors.textMuted }]}>
                at {formatTime(entry.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Entry text */}
        <View style={[styles.entryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.entryText, { color: colors.text }]}>
            {entry.text}
          </Text>
        </View>

        {/* Compassionate Reflection (Unit 15) */}
        {reflection && (
          <View style={[styles.reflectionCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.reflectionText, { color: colors.textSecondary }]}>
              {reflection}
            </Text>
            {supportSuggestion && (
              <Text style={[styles.supportText, { color: colors.textMuted }]}>
                {supportSuggestion}
              </Text>
            )}
          </View>
        )}

        {/* Meta info */}
        <View style={styles.metaContainer}>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {entry.text.length} characters
          </Text>
          {entry.updatedAt !== entry.createdAt && (
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              Edited {formatFullDate(entry.updatedAt)}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Your words, your device
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerSpacer: {
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    marginRight: -8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  dateContainer: {
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  date: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
  },
  entryCard: {
    borderRadius: 16,
    padding: 20,
  },
  entryText: {
    fontSize: 17,
    lineHeight: 26,
  },
  metaContainer: {
    marginTop: 20,
    paddingHorizontal: 4,
  },
  metaText: {
    fontSize: 13,
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  backLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
  // Unit 15: Compassionate reflection styles
  reflectionCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#9E9E9E',
  },
  reflectionText: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  supportText: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 18,
  },
});
