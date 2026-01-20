/**
 * Spark Overlay
 *
 * Creative prompts and inspiration - the playful side of Mood Leaf.
 * Unlike Fireflies (wisdom/support), Sparks are for creativity/play.
 *
 * Features:
 * - Adapts to current coach persona (tone/style matches your guide)
 * - Categories: artists, musicians, walking, funny, strange, etc.
 * - Persona-specific introductions and encouragements
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  useColorScheme,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import {
  SparkCategory,
  getRandomSpark,
  Spark,
  getCategoryMetadata,
} from '@/services/sparkService';
import {
  getCoachSettings,
  PERSONAS,
  CoachPersona,
} from '@/services/coachPersonalityService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Persona-specific intros and encouragements for Sparks
 * Each persona has their own way of presenting creative prompts
 */
const PERSONA_SPARK_STYLE: Record<CoachPersona, {
  intro: string;
  encouragement: string;
  anotherText: string;
  emoji: string;
}> = {
  clover: {
    intro: "Let's shake things up!",
    encouragement: "Ooh, this one's good. Give it a try?",
    anotherText: "Show me another",
    emoji: '🍀',
  },
  spark: {
    intro: "Time to CREATE! ✨",
    encouragement: "YES! This is gonna be amazing!",
    anotherText: "More inspiration!",
    emoji: '✨',
  },
  willow: {
    intro: "A seed for contemplation...",
    encouragement: "Let this settle where it needs to.",
    anotherText: "Another thought",
    emoji: '🌿',
  },
  luna: {
    intro: "What emerges from the stillness...",
    encouragement: "Trust what arises.",
    anotherText: "Draw another",
    emoji: '🌙',
  },
  ridge: {
    intro: "Creative challenge incoming:",
    encouragement: "Now turn this into action.",
    anotherText: "Next challenge",
    emoji: '⛰️',
  },
  flint: {
    intro: "Here's a prompt. No overthinking.",
    encouragement: "Just do it. See what happens.",
    anotherText: "Another one",
    emoji: '🔥',
  },
  fern: {
    intro: "A gentle creative nudge...",
    encouragement: "There's no wrong way to respond to this.",
    anotherText: "Something else",
    emoji: '🌱',
  },
};

/**
 * Categories to show based on persona preferences
 * Some personas highlight certain creative categories
 */
const PERSONA_PREFERRED_CATEGORIES: Record<CoachPersona, SparkCategory[]> = {
  clover: ['funny', 'walking', 'strange', 'artists', 'musicians'],
  spark: ['artists', 'musicians', 'funny', 'walking', 'strange'],
  willow: ['walking', 'strange', 'artists', 'musicians', 'funny'],
  luna: ['walking', 'strange', 'artists', 'musicians', 'funny'],
  ridge: ['artists', 'musicians', 'walking', 'funny', 'strange'],
  flint: ['artists', 'musicians', 'strange', 'funny', 'walking'],
  fern: ['walking', 'artists', 'musicians', 'funny', 'strange'],
};

/**
 * Categories specifically for creative sparks (excluding depression/anxiety which belong in Fireflies)
 */
const CREATIVE_CATEGORIES: SparkCategory[] = ['artists', 'musicians', 'walking', 'funny', 'strange', 'random'];

interface SparkOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export function SparkOverlay({ visible, onClose }: SparkOverlayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [selectedCategory, setSelectedCategory] = useState<SparkCategory | null>(null);
  const [currentSpark, setCurrentSpark] = useState<Spark | null>(null);
  const [currentPersona, setCurrentPersona] = useState<CoachPersona>('clover');
  const [coachName, setCoachName] = useState<string>('');

  // Load coach persona on mount and when visible
  const loadPersona = useCallback(async () => {
    try {
      const settings = await getCoachSettings();
      setCurrentPersona(settings.selectedPersona);
      setCoachName(settings.customName || PERSONAS[settings.selectedPersona].name);
    } catch (error) {
      console.error('Failed to load coach settings:', error);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadPersona();
    }
  }, [visible, loadPersona]);

  // Animation
  const slideAnim = useState(new Animated.Value(SCREEN_HEIGHT))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Animate in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      // Reset state when closing
      setSelectedCategory(null);
      setCurrentSpark(null);
    }
  }, [visible, slideAnim, fadeAnim]);

  // Get persona-specific style
  const personaStyle = PERSONA_SPARK_STYLE[currentPersona];
  const categoryMeta = getCategoryMetadata();

  // Select a category and get a spark
  const selectCategory = (category: SparkCategory) => {
    const spark = getRandomSpark(category);
    setSelectedCategory(category);
    setCurrentSpark(spark);
  };

  // Get another spark from the same category
  const getAnother = () => {
    if (selectedCategory) {
      const spark = getRandomSpark(selectedCategory);
      setCurrentSpark(spark);
    }
  };

  // Go back to category selection
  const goBack = () => {
    setSelectedCategory(null);
    setCurrentSpark(null);
  };

  // Order categories by persona preference
  const orderedCategories = PERSONA_PREFERRED_CATEGORIES[currentPersona]
    .filter(cat => CREATIVE_CATEGORIES.includes(cat));
  // Add random at the end
  if (!orderedCategories.includes('random')) {
    orderedCategories.push('random');
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Content */}
      <Animated.View
        style={[
          styles.panel,
          {
            backgroundColor: colors.background,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle bar */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        {!selectedCategory ? (
          // Category picker
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header with persona touch */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                {personaStyle.intro} {personaStyle.emoji}
              </Text>
            </View>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Pick a creative direction
            </Text>

            {/* Category grid */}
            <View style={styles.categoryGrid}>
              {orderedCategories.map((category) => {
                const meta = categoryMeta[category];
                return (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryButton, { backgroundColor: colors.card }]}
                    onPress={() => selectCategory(category)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.categoryEmoji}>{meta.emoji}</Text>
                    <Text style={[styles.categoryLabel, { color: colors.text }]}>
                      {meta.name}
                    </Text>
                    <Text
                      style={[styles.categoryDesc, { color: colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {meta.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        ) : (
          // Spark display
          <>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Text style={[styles.backText, { color: colors.tint }]}>
                ← Back
              </Text>
            </TouchableOpacity>

            <View style={styles.sparkContainer}>
              <Text style={styles.sparkEmoji}>
                {categoryMeta[currentSpark?.category || 'random'].emoji}
              </Text>
              <Text style={[styles.sparkText, { color: colors.text }]}>
                {currentSpark?.text}
              </Text>
              <Text style={[styles.encouragement, { color: colors.textSecondary }]}>
                — {coachName}: "{personaStyle.encouragement}"
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.anotherButton, { backgroundColor: colors.card }]}
              onPress={getAnother}
            >
              <Text style={[styles.anotherText, { color: colors.tint }]}>
                {personaStyle.anotherText}
              </Text>
            </TouchableOpacity>

            <View style={styles.bottomPadding} />
          </>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 400,
    maxHeight: SCREEN_HEIGHT * 0.75,
    paddingHorizontal: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 20,
  },
  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  // Spark display
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
  },
  sparkContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  sparkEmoji: {
    fontSize: 48,
    marginBottom: 20,
  },
  sparkText: {
    fontSize: 20,
    lineHeight: 30,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  encouragement: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  anotherButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: 'center',
  },
  anotherText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 40,
  },
});
