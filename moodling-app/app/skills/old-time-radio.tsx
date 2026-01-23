/**
 * Old Time Radio Screen
 *
 * Classic radio dramas from the golden age of radio (1940s-50s).
 * Perfect for falling asleep - engaging but familiar.
 * Content from Internet Archive.
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

// Classic radio shows from Internet Archive (public domain)
const RADIO_SHOWS = [
  {
    id: 'the_shadow',
    name: 'The Shadow',
    tagline: '"Who knows what evil lurks in the hearts of men?"',
    description: 'Crime drama featuring the mysterious vigilante Lamont Cranston.',
    era: '1937-1954',
    archiveUrl: 'https://archive.org/details/OTRR_The_Shadow_Singles',
    episodeCount: '150+',
  },
  {
    id: 'suspense',
    name: 'Suspense',
    tagline: '"Tales well calculated to keep you in... suspense!"',
    description: 'Thriller anthology with twist endings. Perfect bedtime tension.',
    era: '1942-1962',
    archiveUrl: 'https://archive.org/details/OTRR_Suspense_Singles',
    episodeCount: '900+',
  },
  {
    id: 'x_minus_one',
    name: 'X Minus One',
    tagline: '"Countdown for blast off... X minus five... four..."',
    description: 'Intelligent science fiction adaptations of short stories.',
    era: '1955-1958',
    archiveUrl: 'https://archive.org/details/OTRR_X_Minus_One_Singles',
    episodeCount: '125',
  },
  {
    id: 'dimension_x',
    name: 'Dimension X',
    tagline: '"Adventures in time and space..."',
    description: 'More sci-fi classics. Asimov, Bradbury, Heinlein adaptations.',
    era: '1950-1951',
    archiveUrl: 'https://archive.org/details/OTRR_Dimension_X_Singles',
    episodeCount: '50',
  },
  {
    id: 'inner_sanctum',
    name: 'Inner Sanctum Mysteries',
    tagline: '"Good evening friends of the inner sanctum..."',
    description: 'Creepy horror tales with macabre humor. Not too scary for sleep.',
    era: '1941-1952',
    archiveUrl: 'https://archive.org/details/InnerSanctumMysteryOtr',
    episodeCount: '100+',
  },
  {
    id: 'gunsmoke',
    name: 'Gunsmoke',
    tagline: '"Around Dodge City and in the territory out west..."',
    description: 'Western drama featuring Marshal Matt Dillon. Steady and familiar.',
    era: '1952-1961',
    archiveUrl: 'https://archive.org/details/OTRR_Gunsmoke_Singles',
    episodeCount: '400+',
  },
  {
    id: 'dragnet',
    name: 'Dragnet',
    tagline: '"The story you are about to hear is true..."',
    description: 'Police procedural. Methodical, calm, matter-of-fact narration.',
    era: '1949-1957',
    archiveUrl: 'https://archive.org/details/Dragnet_OTR',
    episodeCount: '300+',
  },
  {
    id: 'jack_benny',
    name: 'The Jack Benny Program',
    tagline: '"Jell-O again, this is Jack Benny saying..."',
    description: 'Classic comedy. Gentle humor with recurring bits.',
    era: '1932-1955',
    archiveUrl: 'https://archive.org/details/OTRR_Jack_Benny_Singles',
    episodeCount: '400+',
  },
];

export default function OldTimeRadioScreen() {
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
    const recent = await getRecentlyPlayed('old_time_radio', 3);
    setRecentlyPlayed(recent);
  };

  const handlePlayShow = (show: typeof RADIO_SHOWS[0]) => {
    // Open Internet Archive page where they can listen
    Alert.alert(
      `Listen to "${show.name}"`,
      `${show.episodeCount} episodes available on Internet Archive. Set a sleep timer and enjoy!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Archive',
          onPress: () => {
            Linking.openURL(show.archiveUrl);
            // Save to history
            savePlaybackPosition({
              contentId: show.id,
              contentType: 'old_time_radio',
              title: show.name,
              show: show.name,
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Old Time Radio</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Intro */}
        <View style={[styles.introCard, { backgroundColor: colors.card }]}>
          <Ionicons name="radio-outline" size={32} color={colors.tint} />
          <Text style={[styles.introText, { color: colors.text }]}>
            Classic radio dramas from the 1940s-50s. Engaging enough to distract, calming enough to sleep.
          </Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsRow}>
          <View style={[styles.tipBadge, { backgroundColor: colors.card }]}>
            <Text style={[styles.tipText, { color: colors.textMuted }]}>⏱️ Episodes: 20-30 min</Text>
          </View>
          <View style={[styles.tipBadge, { backgroundColor: colors.card }]}>
            <Text style={[styles.tipText, { color: colors.textMuted }]}>🎧 Low stakes listening</Text>
          </View>
        </View>

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Shows
            </Text>
            {recentlyPlayed.map((item) => {
              const show = RADIO_SHOWS.find(s => s.id === item.contentId);
              if (!show) return null;
              return (
                <TouchableOpacity
                  key={item.contentId}
                  style={[styles.showCard, { backgroundColor: colors.card }]}
                  onPress={() => handlePlayShow(show)}
                >
                  <View style={styles.showContent}>
                    <Text style={[styles.showName, { color: colors.text }]}>
                      {show.name}
                    </Text>
                    <Text style={[styles.showEra, { color: colors.textMuted }]}>
                      {show.era}
                    </Text>
                  </View>
                  <Ionicons name="play-circle" size={32} color={colors.tint} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* All Shows */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            All Shows
          </Text>
          {RADIO_SHOWS.map((show) => (
            <TouchableOpacity
              key={show.id}
              style={[styles.showCard, { backgroundColor: colors.card }]}
              onPress={() => handlePlayShow(show)}
            >
              <View style={styles.showContent}>
                <Text style={[styles.showName, { color: colors.text }]}>
                  {show.name}
                </Text>
                <Text style={[styles.showTagline, { color: colors.tint }]} numberOfLines={1}>
                  {show.tagline}
                </Text>
                <Text style={[styles.showMeta, { color: colors.textMuted }]}>
                  {show.era} • {show.episodeCount} episodes
                </Text>
                <Text style={[styles.showDescription, { color: colors.textMuted }]} numberOfLines={2}>
                  {show.description}
                </Text>
              </View>
              <Ionicons name="play-circle" size={32} color={colors.tint} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Attribution */}
        <View style={[styles.attribution, { backgroundColor: colors.card }]}>
          <Ionicons name="library-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.attributionText, { color: colors.textMuted }]}>
            Preserved by the Internet Archive. Public domain recordings.
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
  showCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  showContent: {
    flex: 1,
  },
  showName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  showTagline: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  showEra: {
    fontSize: 13,
    marginBottom: 4,
  },
  showMeta: {
    fontSize: 12,
    marginBottom: 4,
  },
  showDescription: {
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
