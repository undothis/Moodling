import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { JournalEntry } from '@/types/JournalEntry';
import { getAllEntries } from '@/services/journalStorage';

/**
 * History Screen - View All Journal Entries
 *
 * Following Mood Leaf Ethics:
 * - No judgment, just a record
 * - User owns their data
 * - Easy to review past entries
 *
 * Unit 3: Scrollable list, tap to view detail
 */

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      const stored = await getAllEntries();
      setEntries(stored);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadEntries();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
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

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const renderEntry = ({ item }: { item: JournalEntry }) => (
    <TouchableOpacity
      style={[styles.entryCard, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/entry/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.entryHeader}>
        {/* Mood emoji removed - Mental health safe design:
            Showing sad faces next to entries reinforces negative feelings.
            We let the text speak for itself. */}
        <Text style={[styles.entryDate, { color: colors.textMuted }]}>
          {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
        </Text>
      </View>
      <Text style={[styles.entryText, { color: colors.text }]}>
        {truncateText(item.text)}
      </Text>
      <View style={styles.entryMeta}>
        <Text style={[styles.entryChars, { color: colors.textMuted }]}>
          {item.text.length} chars
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
        No entries yet
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
        Your journal entries will appear here
      </Text>
    </View>
  );

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
        <Text style={[styles.title, { color: colors.text }]}>Your Entries</Text>
        <View style={styles.headerRight}>
          <Text style={[styles.entryCount, { color: colors.textMuted }]}>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </Text>
        </View>
      </View>

      {/* Entry List */}
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.textMuted}
          />
        }
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          All entries stored on your device
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  entryCount: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  entryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodEmoji: {
    fontSize: 18,
  },
  entryText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  entryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryDate: {
    fontSize: 13,
  },
  entryChars: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
});
