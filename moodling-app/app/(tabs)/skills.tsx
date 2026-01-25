/**
 * Skills Tab - Your Growth Journey
 *
 * D&D-inspired progression system with:
 * - Attributes that grow from app usage
 * - Skills/tools you can unlock
 * - Coach customizations
 * - Free vs Premium indicators
 *
 * No competitive elements - purely personal growth.
 */

import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import {
  Attribute,
  Skill,
  CoachUnlock,
  SkillCategory,
  SKILL_CATEGORIES,
} from '@/types/SkillProgression';
import {
  getAttributesWithProgress,
  getSkillsWithStatus,
  getCoachUnlocksWithStatus,
  getProgressionSummary,
  getUnlockRequirements,
} from '@/services/skillProgressionService';

const DEV_UNLOCK_KEY = 'moodleaf_dev_unlock_all';

// Skills with dedicated route files (custom components)
const DEDICATED_ROUTES: Record<string, string> = {
  // Games -> /games/
  asteroids: '/games/asteroids',
  retro_snake: '/games/snake',
  retro_pong: '/games/pong',
  fidget_pad: '/games/fidget',
  bubble_wrap: '/games/bubble-wrap',
  breathing_orb: '/games/breathing-orb',
  breakout: '/games/breakout',
  game_2048: '/games/2048',
  memory_match: '/games/memory-match',
  water_ripples: '/games/water-ripples',
  sand_flow: '/games/sand-flow',
  space_invaders: '/games/space-invaders',
  frogger: '/games/frogger',
  kinetic_sand: '/games/kinetic-sand',
  rain_on_window: '/games/rain-on-window',
  kaleidoscope: '/games/kaleidoscope',
  maze_walker: '/games/maze-walker',
  untangle: '/games/untangle',
  // New Therapeutic Games
  pixel_hunt: '/games/pixel-hunt',
  pattern_lock: '/games/pattern-lock',
  word_stream: '/games/word-stream',
  '54321_quest': '/games/54321-quest',
  body_map: '/games/body-map',
  earth_touch: '/games/earth-touch',
  anchor_drop: '/games/anchor-drop',
  breath_waves: '/games/breath-waves',
  cloud_garden: '/games/cloud-garden',
  star_connect: '/games/star-connect',
  emotion_explorer: '/games/emotion-explorer',
  coping_cards: '/games/coping-cards',
  thought_bubbles: '/games/thought-bubbles',
  body_signals: '/games/body-signals',
  perspective_shift: '/games/perspective-shift',
  future_self: '/games/future-self',
  values_quest: '/games/values-quest',
  the_pause: '/games/the-pause',
  thought_maze: '/games/thought-maze',
  chain_reaction: '/games/chain-reaction',
  odd_one_out: '/games/odd-one-out',
  logic_gates: '/games/logic-gates',
  sequence_builder: '/games/sequence-builder',
  balance_scale: '/games/balance-scale',
  path_finder: '/games/path-finder',
  pattern_breaker: '/games/pattern-breaker',
  reframe_puzzle: '/games/reframe-puzzle',
  what_comes_next: '/games/what-comes-next',
  pixel_sudoku: '/games/pixel-sudoku',
  nonogram: '/games/nonogram',
  minesweeper_zen: '/games/minesweeper-zen',
  tower_of_hanoi: '/games/tower-of-hanoi',
  // Dedicated clinical skill components
  safety_plan: '/skills/safety-plan',
  grounding_ladder: '/skills/grounding-ladder',
  tipp_skills: '/skills/tipp',
  window_tolerance: '/skills/window-of-tolerance',
  vagal_tone: '/skills/vagal-tone',
  thought_record: '/skills/thought-record',
  dear_man: '/skills/dear-man',
  opposite_action: '/skills/opposite-action',
  radical_acceptance: '/skills/radical-acceptance',
  human_design: '/skills/human-design',
  astrology_basics: '/skills/astrology',
  // Breathing skills -> Launch breathing orb directly
  box_breathing: '/games/breathing-orb',
  physiological_sigh: '/games/breathing-orb',
  '478_breathing': '/games/breathing-orb',
  // Audio skills -> Audio player
  sleep_stories: '/skills/sleep-stories',
  old_time_radio: '/skills/old-time-radio',
  // Accountability skills
  drink_pacing: '/skills/drink-pacing',
  habit_timer: '/skills/habit-timer',
  // Conversation practice skills
  conversation_practice: '/skills/conversation-practice',
  asking_for_raise: '/skills/conversation-practice?scenario=asking_for_raise',
  setting_boundaries: '/skills/conversation-practice?scenario=setting_boundaries',
  ending_relationship: '/skills/conversation-practice?scenario=ending_relationship',
  confronting_friend: '/skills/conversation-practice?scenario=confronting_friend',
  telling_parents: '/skills/conversation-practice?scenario=telling_parents',
  job_interview: '/skills/conversation-practice?scenario=job_interview',
  apologizing: '/skills/conversation-practice?scenario=apologizing',
  asking_for_help: '/skills/conversation-practice?scenario=asking_for_help',
  giving_feedback: '/skills/conversation-practice?scenario=giving_feedback',
  nvc_practice: '/skills/conversation-practice?scenario=nvc_practice',
};

// Get route for any skill - dedicated or dynamic
function getSkillRoute(skillId: string): string {
  if (DEDICATED_ROUTES[skillId]) {
    return DEDICATED_ROUTES[skillId];
  }
  // Use dynamic route for all other skills
  return `/skills/${skillId}`;
}

export default function SkillsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [attributes, setAttributes] = useState<Array<Attribute & { progress: number; pointsToNext: number }>>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [coachUnlocks, setCoachUnlocks] = useState<CoachUnlock[]>([]);
  const [summary, setSummary] = useState<{
    totalPoints: number;
    highestAttribute: { name: string; level: number; emoji: string };
    skillsUnlocked: number;
    totalSkills: number;
    daysOnJourney: number;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [devMode, setDevMode] = useState(false);
  const [titleTapCount, setTitleTapCount] = useState(0);

  const loadData = useCallback(async () => {
    // Check if dev mode is enabled
    const devUnlock = await AsyncStorage.getItem(DEV_UNLOCK_KEY);
    const isDevMode = devUnlock === 'true';
    setDevMode(isDevMode);

    const [attrs, skillsData, unlocks, summaryData] = await Promise.all([
      getAttributesWithProgress(),
      getSkillsWithStatus(),
      getCoachUnlocksWithStatus(),
      getProgressionSummary(),
    ]);

    // If dev mode, unlock all skills
    if (isDevMode) {
      const unlockedSkills = skillsData.map(s => ({ ...s, isUnlocked: true }));
      setSkills(unlockedSkills);
    } else {
      setSkills(skillsData);
    }

    setAttributes(attrs);
    setCoachUnlocks(unlocks);
    setSummary(summaryData);
  }, []);

  // Secret dev mode toggle - tap title 7 times
  const handleTitleTap = useCallback(() => {
    const newCount = titleTapCount + 1;
    setTitleTapCount(newCount);

    if (newCount >= 7) {
      setTitleTapCount(0);
      Alert.alert(
        devMode ? 'Disable Dev Mode?' : 'Enable Dev Mode?',
        devMode
          ? 'This will re-lock skills based on normal progression.'
          : 'This will unlock ALL skills for testing.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: devMode ? 'Disable' : 'Enable',
            onPress: async () => {
              await AsyncStorage.setItem(DEV_UNLOCK_KEY, devMode ? 'false' : 'true');
              setDevMode(!devMode);
              loadData();
            },
          },
        ]
      );
    }

    // Reset tap count after 2 seconds
    setTimeout(() => setTitleTapCount(0), 2000);
  }, [titleTapCount, devMode, loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter skills by category and search
  const filteredSkills = skills.filter(s => {
    // Category filter
    if (selectedCategory !== 'all' && s.category !== selectedCategory) {
      return false;
    }
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        SKILL_CATEGORIES[s.category].name.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Filter coach unlocks by search
  const filteredCoachUnlocks = searchQuery.trim()
    ? coachUnlocks.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : coachUnlocks;

  const unlockedCount = skills.filter(s => s.isUnlocked).length;
  const premiumCount = skills.filter(s => s.isPremium && !s.isUnlocked).length;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
      }
    >
      {/* Header - tap title 7 times for dev mode */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleTitleTap} activeOpacity={0.8}>
          <Text style={[styles.title, { color: colors.text }]}>
            Skills {devMode && '🔓'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {devMode ? 'DEV MODE: All skills unlocked' : 'Your personal growth toolkit'}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search skills, techniques..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Journey Summary - hide when searching */}
      {!isSearching && summary && (
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.tint }]}>
                {summary.daysOnJourney}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                Days
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.tint }]}>
                {summary.totalPoints}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                Points
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.tint }]}>
                {unlockedCount}/{skills.length}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                Skills
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Attributes Section - hide when searching */}
      {!isSearching && (
        <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Your Attributes
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Grow naturally as you use the app
        </Text>

        <View style={styles.attributesGrid}>
          {attributes.map((attr) => (
            <View
              key={attr.id}
              style={[styles.attributeCard, { backgroundColor: colors.card }]}
            >
              <Text style={styles.attributeEmoji}>{attr.emoji}</Text>
              <Text style={[styles.attributeName, { color: colors.text }]}>
                {attr.name}
              </Text>
              <Text style={[styles.attributeLevel, { color: colors.tint }]}>
                Level {attr.level}
              </Text>

              {/* Progress bar */}
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.tint, width: `${attr.progress}%` },
                  ]}
                />
              </View>

              <Text style={[styles.attributePoints, { color: colors.textMuted }]}>
                {attr.pointsToNext > 0 ? `${attr.pointsToNext} to next` : 'Max level!'}
              </Text>
            </View>
          ))}
        </View>
      </View>
      )}

      {/* Quick Access: Games Hub */}
      {!isSearching && (
        <TouchableOpacity
          style={[styles.gamesQuickAccess, { backgroundColor: colors.card }]}
          onPress={() => router.push('/games' as any)}
        >
          <View style={styles.gamesQuickAccessContent}>
            <Text style={styles.gamesQuickAccessEmoji}>🎮</Text>
            <View style={styles.gamesQuickAccessText}>
              <Text style={[styles.gamesQuickAccessTitle, { color: colors.text }]}>
                Mindful Games
              </Text>
              <Text style={[styles.gamesQuickAccessSubtitle, { color: colors.textMuted }]}>
                Relaxing retro games for focus and calm
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </TouchableOpacity>
      )}

      {/* Skills Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Techniques & Tools
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          {premiumCount > 0 ? `${premiumCount} premium skills available` : 'Your wellness toolkit'}
        </Text>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === 'all' ? colors.tint : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text
              style={[
                styles.categoryChipText,
                { color: selectedCategory === 'all' ? '#FFFFFF' : colors.text },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {(Object.keys(SKILL_CATEGORIES) as SkillCategory[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === cat ? colors.tint : colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={styles.categoryChipEmoji}>
                {SKILL_CATEGORIES[cat].emoji}
              </Text>
              <Text
                style={[
                  styles.categoryChipText,
                  { color: selectedCategory === cat ? '#FFFFFF' : colors.text },
                ]}
              >
                {SKILL_CATEGORIES[cat].name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Skills List */}
        <View style={styles.skillsList}>
          {filteredSkills.map((skill) => (
            <TouchableOpacity
              key={skill.id}
              style={[
                styles.skillCard,
                {
                  backgroundColor: colors.card,
                  opacity: skill.isUnlocked ? 1 : 0.7,
                },
              ]}
              onPress={() => {
                if (skill.isUnlocked) {
                  router.push(getSkillRoute(skill.id) as any);
                }
              }}
              disabled={!skill.isUnlocked}
            >
              <View style={styles.skillHeader}>
                <Text style={styles.skillEmoji}>{skill.emoji}</Text>
                <View style={styles.skillInfo}>
                  <Text style={[styles.skillName, { color: colors.text }]}>
                    {skill.name}
                  </Text>
                  <Text style={[styles.skillDescription, { color: colors.textSecondary }]}>
                    {skill.isUnlocked ? skill.description : (skill.previewText || skill.description)}
                  </Text>
                </View>

                {/* Status indicator */}
                {skill.isUnlocked ? (
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                ) : skill.isPremium ? (
                  <View style={[styles.premiumBadge, { backgroundColor: '#FFD700' }]}>
                    <Ionicons name="star" size={14} color="#000" />
                  </View>
                ) : (
                  <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
                )}
              </View>

              {/* Unlock requirements */}
              {!skill.isUnlocked && (
                <Text style={[styles.unlockReq, { color: colors.textMuted }]}>
                  {getUnlockRequirements(skill)}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Coach Customization Section */}
      {filteredCoachUnlocks.length > 0 && (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Coach Abilities
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Unlock new ways your coach can support you
        </Text>

        <View style={styles.coachUnlocksList}>
          {filteredCoachUnlocks.map((unlock) => (
            <View
              key={unlock.id}
              style={[
                styles.coachUnlockCard,
                {
                  backgroundColor: colors.card,
                  opacity: unlock.isUnlocked ? 1 : 0.7,
                },
              ]}
            >
              <Text style={styles.coachUnlockEmoji}>{unlock.emoji}</Text>
              <View style={styles.coachUnlockInfo}>
                <Text style={[styles.coachUnlockName, { color: colors.text }]}>
                  {unlock.name}
                </Text>
                <Text style={[styles.coachUnlockDescription, { color: colors.textSecondary }]}>
                  {unlock.description}
                </Text>
              </View>

              {unlock.isUnlocked ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              ) : unlock.isPremium ? (
                <View style={[styles.premiumBadge, { backgroundColor: '#FFD700' }]}>
                  <Ionicons name="star" size={12} color="#000" />
                </View>
              ) : (
                <Ionicons name="lock-closed" size={18} color={colors.textMuted} />
              )}
            </View>
          ))}
        </View>
      </View>
      )}

      {/* Search Results Info */}
      {isSearching && (
        <View style={styles.searchResultsInfo}>
          <Text style={[styles.searchResultsText, { color: colors.textMuted }]}>
            Found {filteredSkills.length} skill{filteredSkills.length !== 1 ? 's' : ''}
            {filteredCoachUnlocks.length > 0 ? ` and ${filteredCoachUnlocks.length} coach abilit${filteredCoachUnlocks.length !== 1 ? 'ies' : 'y'}` : ''}
          </Text>
        </View>
      )}

      {/* No Results */}
      {isSearching && filteredSkills.length === 0 && filteredCoachUnlocks.length === 0 && (
        <View style={[styles.noResults, { backgroundColor: colors.card }]}>
          <Ionicons name="search-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.noResultsText, { color: colors.textMuted }]}>
            No skills found for "{searchQuery}"
          </Text>
          <Text style={[styles.noResultsHint, { color: colors.textMuted }]}>
            Try searching for categories like "sleep" or "anxiety"
          </Text>
        </View>
      )}

      {/* Premium CTA - hide when searching */}
      {!isSearching && premiumCount > 0 && (
        <TouchableOpacity
          style={[styles.premiumCTA, { backgroundColor: colors.card, borderColor: '#FFD700' }]}
          onPress={() => {
            // TODO: Navigate to premium/store page
          }}
        >
          <Ionicons name="star" size={24} color="#FFD700" />
          <View style={styles.premiumCTAText}>
            <Text style={[styles.premiumCTATitle, { color: colors.text }]}>
              Unlock Premium
            </Text>
            <Text style={[styles.premiumCTASubtitle, { color: colors.textSecondary }]}>
              Get {premiumCount} additional skills and coach abilities
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* How Points Work - hide when searching */}
      {!isSearching && (
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>
          How do I earn points?
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Points grow naturally as you use Mood Leaf. Journal entries build Wisdom.
          Using grounding techniques builds Resilience. Checking insights builds Clarity.
          Self-kindness practices build Compassion. No pressure, no streaks — just grow at your own pace.
        </Text>
      </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  searchResultsInfo: {
    marginBottom: 16,
    alignItems: 'center',
  },
  searchResultsText: {
    fontSize: 14,
  },
  noResults: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    marginBottom: 24,
  },
  noResultsText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  noResultsHint: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  attributeCard: {
    width: '47%',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  attributeEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  attributeName: {
    fontSize: 14,
    fontWeight: '600',
  },
  attributeLevel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  attributePoints: {
    fontSize: 11,
    marginTop: 6,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryContainer: {
    gap: 8,
    paddingRight: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  categoryChipEmoji: {
    fontSize: 14,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  skillsList: {
    gap: 10,
  },
  skillCard: {
    borderRadius: 12,
    padding: 14,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 15,
    fontWeight: '600',
  },
  skillDescription: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  unlockReq: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 40,
    fontStyle: 'italic',
  },
  premiumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachUnlocksList: {
    gap: 10,
  },
  coachUnlockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
  },
  coachUnlockEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  coachUnlockInfo: {
    flex: 1,
  },
  coachUnlockName: {
    fontSize: 14,
    fontWeight: '600',
  },
  coachUnlockDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  premiumCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    gap: 12,
  },
  premiumCTAText: {
    flex: 1,
  },
  premiumCTATitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  premiumCTASubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  infoCard: {
    borderRadius: 14,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 20,
  },
  gamesQuickAccess: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  gamesQuickAccessContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gamesQuickAccessEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  gamesQuickAccessText: {
    flex: 1,
  },
  gamesQuickAccessTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  gamesQuickAccessSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
