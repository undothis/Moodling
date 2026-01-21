/**
 * Skills Bubble Menu Component
 *
 * Interactive bubble-style menu for browsing and accessing skills.
 * Displays skill categories, progress, and quick exercises.
 *
 * Following Mood Leaf Ethics:
 * - Clear about what's free vs premium
 * - No manipulative dark patterns
 * - Celebrates progress without streaks
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  Skill,
  SkillCategory,
  SKILL_CATEGORIES,
  SkillMenuItem,
  getSkillsMenuData,
  getQuickExercises,
  ExerciseMenuItem,
} from '@/services/skillsService';
import {
  SubscriptionPlan,
  SUBSCRIPTION_PLANS,
  isPremium as checkIsPremium,
  initiatePurchase,
} from '@/services/subscriptionService';

// ============================================
// PROPS
// ============================================

interface SkillsBubbleMenuProps {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseId: string) => void;
  onSelectSkill: (skillId: string) => void;
}

// ============================================
// COMPONENT
// ============================================

export default function SkillsBubbleMenu({
  visible,
  onClose,
  onSelectExercise,
  onSelectSkill,
}: SkillsBubbleMenuProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [loading, setLoading] = useState(true);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [skillsByCategory, setSkillsByCategory] = useState<
    Record<SkillCategory, SkillMenuItem[]>
  >({
    mindfulness: [],
    coping: [],
    growth: [],
    social: [],
    advanced: [],
  });
  const [quickExercises, setQuickExercises] = useState<ExerciseMenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Load data
  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    try {
      const premium = await checkIsPremium();
      setIsPremiumUser(premium);

      const menuData = await getSkillsMenuData(premium);
      setSkillsByCategory(menuData.skillsByCategory);

      const quickEx = getQuickExercises(premium);
      setQuickExercises(quickEx);
    } catch (error) {
      console.error('Failed to load skills data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillTap = (item: SkillMenuItem) => {
    if (item.isLocked) {
      setShowUpgrade(true);
    } else {
      onSelectSkill(item.skill.id);
    }
  };

  const handleExerciseTap = (item: ExerciseMenuItem) => {
    if (item.isLocked) {
      setShowUpgrade(true);
    } else {
      onSelectExercise(item.exercise.id);
      onClose();
    }
  };

  const handleUpgrade = async (planId: string) => {
    const result = await initiatePurchase(planId);
    if (result.success) {
      setShowUpgrade(false);
      loadData(); // Refresh
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderProgressDots = (level: number, maxLevel: number) => {
    return (
      <View style={styles.progressDots}>
        {Array.from({ length: maxLevel }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              {
                backgroundColor: i < level ? colors.tint : colors.border,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderCategoryBubble = (category: SkillCategory) => {
    const info = SKILL_CATEGORIES[category];
    const skills = skillsByCategory[category];
    const isSelected = selectedCategory === category;

    if (skills.length === 0) return null;

    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryBubble,
          {
            backgroundColor: isSelected ? colors.tint : colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setSelectedCategory(isSelected ? null : category)}
      >
        <Text style={styles.categoryEmoji}>{info.emoji}</Text>
        <Text
          style={[
            styles.categoryName,
            { color: isSelected ? '#FFFFFF' : colors.text },
          ]}
        >
          {info.name}
        </Text>
        <Text
          style={[
            styles.categoryCount,
            { color: isSelected ? 'rgba(255,255,255,0.7)' : colors.textMuted },
          ]}
        >
          {skills.length} skills
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSkillCard = (item: SkillMenuItem) => {
    return (
      <TouchableOpacity
        key={item.skill.id}
        style={[
          styles.skillCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: item.isLocked ? 0.7 : 1,
          },
        ]}
        onPress={() => handleSkillTap(item)}
      >
        <View style={styles.skillHeader}>
          <Text style={styles.skillEmoji}>{item.skill.emoji}</Text>
          <View style={styles.skillInfo}>
            <View style={styles.skillNameRow}>
              <Text style={[styles.skillName, { color: colors.text }]}>
                {item.skill.name}
              </Text>
              {item.isLocked && (
                <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
              )}
            </View>
            {renderProgressDots(item.progress.level, item.skill.maxLevel)}
          </View>
        </View>
        <Text style={[styles.skillDescription, { color: colors.textSecondary }]}>
          {item.skill.description}
        </Text>
        <View style={styles.skillFooter}>
          <Text style={[styles.exerciseCount, { color: colors.textMuted }]}>
            {item.freeExerciseCount} free
            {item.premiumExerciseCount > 0 && ` + ${item.premiumExerciseCount} premium`}
          </Text>
          {item.progress.timesUsed > 0 && (
            <Text style={[styles.usageCount, { color: colors.tint }]}>
              Used {item.progress.timesUsed}x
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderQuickExercise = (item: ExerciseMenuItem) => {
    return (
      <TouchableOpacity
        key={item.exercise.id}
        style={[
          styles.quickExerciseBubble,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: item.isLocked ? 0.6 : 1,
          },
        ]}
        onPress={() => handleExerciseTap(item)}
      >
        <Text style={styles.quickExerciseEmoji}>{item.exercise.emoji}</Text>
        <Text style={[styles.quickExerciseName, { color: colors.text }]}>
          {item.exercise.name}
        </Text>
        {item.isLocked && (
          <Ionicons name="lock-closed" size={12} color={colors.textMuted} />
        )}
      </TouchableOpacity>
    );
  };

  const renderUpgradeModal = () => {
    const recommendedPlan = SUBSCRIPTION_PLANS.find((p) => p.highlighted);

    return (
      <Modal
        visible={showUpgrade}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUpgrade(false)}
      >
        <View style={styles.upgradeOverlay}>
          <View style={[styles.upgradeModal, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={styles.upgradeCloseButton}
              onPress={() => setShowUpgrade(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <Text style={styles.upgradeEmoji}>⭐</Text>
            <Text style={[styles.upgradeTitle, { color: colors.text }]}>
              Unlock All Skills
            </Text>
            <Text style={[styles.upgradeSubtitle, { color: colors.textSecondary }]}>
              Get access to all exercises, advanced techniques, and skill tracking.
            </Text>

            {recommendedPlan && (
              <TouchableOpacity
                style={[styles.upgradePlanCard, { backgroundColor: colors.tint }]}
                onPress={() => handleUpgrade(recommendedPlan.id)}
              >
                <View style={styles.upgradePlanHeader}>
                  <Text style={styles.upgradePlanEmoji}>{recommendedPlan.emoji}</Text>
                  <Text style={styles.upgradePlanName}>{recommendedPlan.name}</Text>
                  <Text style={styles.upgradePlanPrice}>{recommendedPlan.price}/mo</Text>
                </View>
                <View style={styles.upgradePlanFeatures}>
                  {recommendedPlan.features.slice(0, 3).map((feature, i) => (
                    <Text key={i} style={styles.upgradePlanFeature}>
                      ✓ {feature}
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.upgradeSecondaryButton, { borderColor: colors.border }]}
              onPress={() => setShowUpgrade(false)}
            >
              <Text style={[styles.upgradeSecondaryText, { color: colors.text }]}>
                Maybe Later
              </Text>
            </TouchableOpacity>

            <Text style={[styles.upgradeNote, { color: colors.textMuted }]}>
              Core features are always free. Upgrade when you're ready.
            </Text>
          </View>
        </View>
      </Modal>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.menuContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              ✨ Skills & Exercises
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : (
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* Quick Exercises */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Quick Exercises
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickExercisesRow}
                >
                  {quickExercises.map(renderQuickExercise)}
                </ScrollView>
              </View>

              {/* Categories */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Skill Categories
                </Text>
                <View style={styles.categoriesGrid}>
                  {(Object.keys(SKILL_CATEGORIES) as SkillCategory[]).map(
                    renderCategoryBubble
                  )}
                </View>
              </View>

              {/* Selected Category Skills */}
              {selectedCategory && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {SKILL_CATEGORIES[selectedCategory].emoji}{' '}
                    {SKILL_CATEGORIES[selectedCategory].name} Skills
                  </Text>
                  <View style={styles.skillsGrid}>
                    {skillsByCategory[selectedCategory].map(renderSkillCard)}
                  </View>
                </View>
              )}

              {/* Upgrade Banner (if not premium) */}
              {!isPremiumUser && (
                <TouchableOpacity
                  style={[styles.upgradeBanner, { backgroundColor: colors.card }]}
                  onPress={() => setShowUpgrade(true)}
                >
                  <Text style={styles.upgradeBannerEmoji}>⭐</Text>
                  <View style={styles.upgradeBannerText}>
                    <Text style={[styles.upgradeBannerTitle, { color: colors.text }]}>
                      Unlock All Skills
                    </Text>
                    <Text
                      style={[styles.upgradeBannerSubtitle, { color: colors.textMuted }]}
                    >
                      15+ exercises, advanced techniques
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}

              {/* Bottom padding */}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </View>

      {renderUpgradeModal()}
    </Modal>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuContainer: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },

  // Quick Exercises
  quickExercisesRow: {
    gap: 10,
    paddingRight: 20,
  },
  quickExerciseBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  quickExerciseEmoji: {
    fontSize: 16,
  },
  quickExerciseName: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryCount: {
    fontSize: 12,
    marginTop: 2,
  },

  // Skills
  skillsGrid: {
    gap: 12,
  },
  skillCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  skillEmoji: {
    fontSize: 28,
  },
  skillInfo: {
    flex: 1,
  },
  skillNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  skillDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  skillFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exerciseCount: {
    fontSize: 12,
  },
  usageCount: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Upgrade Banner
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  upgradeBannerEmoji: {
    fontSize: 28,
  },
  upgradeBannerText: {
    flex: 1,
  },
  upgradeBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  upgradeBannerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  // Upgrade Modal
  upgradeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  upgradeModal: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  upgradeCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  upgradeEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  upgradeSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  upgradePlanCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  upgradePlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradePlanEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  upgradePlanName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  upgradePlanPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  upgradePlanFeatures: {
    gap: 6,
  },
  upgradePlanFeature: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  upgradeSecondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  upgradeSecondaryText: {
    fontSize: 15,
    fontWeight: '500',
  },
  upgradeNote: {
    fontSize: 12,
    textAlign: 'center',
  },
});
