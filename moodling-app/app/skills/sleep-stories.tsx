/**
 * Sleep Stories Screen
 *
 * Listen to calming public domain audiobooks to help you drift off.
 * Content from Project Gutenberg / LibriVox.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getResumeInfo,
  savePlaybackPosition,
  getRecentlyPlayed,
  PlaybackPosition,
} from '@/services/playbackResumeService';

// Curated sleep stories from LibriVox (public domain audiobooks)
// These are read slowly and calmly - perfect for sleep
const SLEEP_STORIES = [
  {
    id: 'alice_wonderland',
    title: "Alice's Adventures in Wonderland",
    author: 'Lewis Carroll',
    description: 'Follow Alice down the rabbit hole. Familiar and dreamlike.',
    duration: '3h 30m',
    librivoxUrl: 'https://librivox.org/alices-adventures-in-wonderland-by-lewis-carroll-2/',
  },
  {
    id: 'sherlock_scandal',
    title: 'A Scandal in Bohemia',
    author: 'Arthur Conan Doyle',
    description: 'A short Sherlock Holmes mystery. Engaging but not too stimulating.',
    duration: '50m',
    librivoxUrl: 'https://librivox.org/short-story-collection-vol-058-by-various/',
  },
  {
    id: 'peter_rabbit',
    title: 'The Tale of Peter Rabbit',
    author: 'Beatrix Potter',
    description: 'A gentle, familiar children\'s story. Perfect for drifting off.',
    duration: '15m',
    librivoxUrl: 'https://librivox.org/the-tale-of-peter-rabbit-by-beatrix-potter/',
  },
  {
    id: 'aesop_fables',
    title: "Aesop's Fables",
    author: 'Aesop',
    description: 'Short, simple tales with timeless morals. Easy to sleep to.',
    duration: '2h',
    librivoxUrl: 'https://librivox.org/aesops-fables-volume-1-fables-1-25/',
  },
  {
    id: 'grimm_tales',
    title: 'Grimm\'s Fairy Tales',
    author: 'Brothers Grimm',
    description: 'Classic fairy tales. Familiar stories from childhood.',
    duration: '4h',
    librivoxUrl: 'https://librivox.org/grimms-fairy-tales-by-jacob-wilhelm-grimm/',
  },
  {
    id: 'wind_willows',
    title: 'The Wind in the Willows',
    author: 'Kenneth Grahame',
    description: 'Gentle adventures of Mole, Rat, Badger, and Toad. Cozy and calming.',
    duration: '5h',
    librivoxUrl: 'https://librivox.org/the-wind-in-the-willows-by-kenneth-grahame/',
  },
  {
    id: 'walden',
    title: 'Walden',
    author: 'Henry David Thoreau',
    description: 'Reflections on simple living in nature. Peaceful and meditative.',
    duration: '10h',
    librivoxUrl: 'https://librivox.org/walden-by-henry-david-thoreau/',
  },
  {
    id: 'wizard_oz',
    title: 'The Wonderful Wizard of Oz',
    author: 'L. Frank Baum',
    description: 'Dorothy\'s magical journey. Familiar and comforting.',
    duration: '4h',
    librivoxUrl: 'https://librivox.org/the-wonderful-wizard-of-oz-by-l-frank-baum/',
  },
];

export default function SleepStoriesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [recentlyPlayed, setRecentlyPlayed] = useState<PlaybackPosition[]>([]);

  // Load recently played
  useEffect(() => {
    loadRecent();
  }, []);

  const loadRecent = async () => {
    const recent = await getRecentlyPlayed('sleep_story', 3);
    setRecentlyPlayed(recent);
  };

  const handlePlayStory = (story: typeof SLEEP_STORIES[0]) => {
    // Open LibriVox page where they can listen
    Alert.alert(
      `Play "${story.title}"`,
      'This will open LibriVox where you can listen for free. Set a sleep timer on your phone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open LibriVox',
          onPress: () => {
            Linking.openURL(story.librivoxUrl);
            // Save to history
            savePlaybackPosition({
              contentId: story.id,
              contentType: 'sleep_story',
              title: story.title,
              author: story.author,
              positionSeconds: 0,
              durationSeconds: 0,
            });
            loadRecent();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Sleep Stories</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Intro */}
        <View style={[styles.introCard, { backgroundColor: colors.card }]}>
          <Ionicons name="moon-outline" size={32} color={colors.tint} />
          <Text style={[styles.introText, { color: colors.text }]}>
            Listen to calming audiobooks from the public domain. Set a sleep timer on your phone and drift off.
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsRow}>
          <View style={[styles.tipBadge, { backgroundColor: colors.card }]}>
            <Text style={[styles.tipText, { color: colors.textMuted }]}>💤 Set a sleep timer</Text>
          </View>
          <View style={[styles.tipBadge, { backgroundColor: colors.card }]}>
            <Text style={[styles.tipText, { color: colors.textMuted }]}>🔉 Keep volume low</Text>
          </View>
        </View>

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Continue Listening
            </Text>
            {recentlyPlayed.map((item) => {
              const story = SLEEP_STORIES.find(s => s.id === item.contentId);
              if (!story) return null;
              return (
                <TouchableOpacity
                  key={item.contentId}
                  style={[styles.storyCard, { backgroundColor: colors.card }]}
                  onPress={() => handlePlayStory(story)}
                >
                  <View style={styles.storyContent}>
                    <Text style={[styles.storyTitle, { color: colors.text }]}>
                      {story.title}
                    </Text>
                    <Text style={[styles.storyAuthor, { color: colors.textMuted }]}>
                      {story.author}
                    </Text>
                  </View>
                  <Ionicons name="play-circle" size={32} color={colors.tint} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* All Stories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            All Stories
          </Text>
          {SLEEP_STORIES.map((story) => (
            <TouchableOpacity
              key={story.id}
              style={[styles.storyCard, { backgroundColor: colors.card }]}
              onPress={() => handlePlayStory(story)}
            >
              <View style={styles.storyContent}>
                <Text style={[styles.storyTitle, { color: colors.text }]}>
                  {story.title}
                </Text>
                <Text style={[styles.storyAuthor, { color: colors.textMuted }]}>
                  {story.author} • {story.duration}
                </Text>
                <Text style={[styles.storyDescription, { color: colors.textMuted }]} numberOfLines={2}>
                  {story.description}
                </Text>
              </View>
              <Ionicons name="play-circle" size={32} color={colors.tint} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Attribution */}
        <View style={[styles.attribution, { backgroundColor: colors.card }]}>
          <Ionicons name="heart-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.attributionText, { color: colors.textMuted }]}>
            Free audiobooks from LibriVox volunteers. Thank you!
          </Text>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  tipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  tipBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tipText: {
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  storyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  storyContent: {
    flex: 1,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  storyAuthor: {
    fontSize: 13,
    marginBottom: 4,
  },
  storyDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  attribution: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 10,
  },
  attributionText: {
    flex: 1,
    fontSize: 12,
  },
});
