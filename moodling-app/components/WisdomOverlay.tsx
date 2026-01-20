/**
 * Wisdom Overlay
 *
 * Oblique Strategies-inspired wisdom cards.
 * User picks a category, gets a random inspirational thought.
 *
 * Categories:
 * - Anxiety / Worry
 * - Walking / Movement
 * - Music / Sound
 * - Art / Creativity
 * - Nature
 * - Breath / Body
 * - Connection
 * - Perspective
 */

import { useState, useEffect } from 'react';
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
} from 'react-native';
import { Colors } from '@/constants/Colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Wisdom categories with prompts/quotes
const WISDOM_CATEGORIES: Record<string, { emoji: string; label: string; wisdoms: string[] }> = {
  anxiety: {
    emoji: '🌊',
    label: 'Anxiety',
    wisdoms: [
      "Anxiety is just excitement without breath. Try breathing into it.",
      "What if this feeling is trying to protect you? What's it protecting you from?",
      "Name five things you can see right now. You're here.",
      "Your thoughts are clouds. You are the sky.",
      "This will pass. Everything passes.",
      "What would you tell a friend feeling this way?",
      "Can you feel your feet on the ground? Start there.",
      "Anxiety lies about the future. What's true right now?",
      "You've survived every anxious moment so far. You'll survive this one too.",
      "Sometimes the bravest thing is to just keep breathing.",
    ],
  },
  walking: {
    emoji: '🚶',
    label: 'Movement',
    wisdoms: [
      "Walk without destination. Let your feet choose.",
      "Feel the ground meeting your feet. It's always there.",
      "Moving your body moves your mood. Start small.",
      "What if every step was a fresh start?",
      "Your body knows things your mind has forgotten.",
      "Ten minutes outside changes brain chemistry. Science says so.",
      "Walk like you have nowhere to be. Because you don't.",
      "The body holds wisdom. What is it telling you?",
      "Shake it off. Literally. Animals do this to release trauma.",
      "Dance in your kitchen. No one's watching.",
    ],
  },
  music: {
    emoji: '🎵',
    label: 'Music',
    wisdoms: [
      "What song holds this feeling? Play it.",
      "Sometimes we need sad songs to feel less alone.",
      "Hum a note. Feel it vibrate in your chest.",
      "Music existed before language. It speaks directly to the soul.",
      "What would the soundtrack of this moment be?",
      "Let the rhythm reset your heartbeat.",
      "Sing badly and loudly. It's medicine.",
      "Listen to something from a happier time. Your brain remembers.",
      "Silence is also music. The pause between notes.",
      "Make a playlist called 'For When I Feel This Way'.",
    ],
  },
  art: {
    emoji: '🎨',
    label: 'Creativity',
    wisdoms: [
      "Scribble without purpose. Let the pen wander.",
      "What color is this feeling? Put it on paper.",
      "Bad art is still art. Make something ugly on purpose.",
      "Creativity isn't about the result. It's about the process.",
      "Take a photo of something beautiful nearby. It exists.",
      "Write the worst poem ever. Free yourself from good.",
      "Doodle while you think. Your hands know things.",
      "What would you make if no one would ever see it?",
      "Rearrange something. Move furniture. Change perspective.",
      "Creation is the opposite of destruction. Create anything.",
    ],
  },
  nature: {
    emoji: '🌳',
    label: 'Nature',
    wisdoms: [
      "Find the nearest plant and really look at it.",
      "Trees don't hurry. They still grow.",
      "You are nature too. Don't forget.",
      "Watch clouds for five minutes. They're always changing.",
      "Put your hands in soil. It's grounding, literally.",
      "The sun rose today. It will rise tomorrow.",
      "Water follows the path of least resistance. You can too.",
      "Seasons change. So do moods. Nothing is permanent.",
      "Find something growing through concrete. Life persists.",
      "The moon is there even when you can't see it.",
    ],
  },
  breath: {
    emoji: '🌬️',
    label: 'Breath',
    wisdoms: [
      "Breathe in for 4, hold for 4, out for 4. Repeat.",
      "Your breath is the only thing that's always in the present moment.",
      "Exhale longer than you inhale. It calms the nervous system.",
      "Where are you holding tension? Breathe into that spot.",
      "Sigh heavily. On purpose. It releases.",
      "Your body breathes without you asking. Trust it.",
      "Place a hand on your chest. Feel it rise and fall.",
      "Breathe like you're smelling a flower, blow like you're cooling soup.",
      "Three conscious breaths can change everything.",
      "You've been breathing your whole life. You're good at this.",
    ],
  },
  connection: {
    emoji: '🤝',
    label: 'Connection',
    wisdoms: [
      "Text someone 'thinking of you'. Just that.",
      "Who would be happy to hear from you right now?",
      "You are loved by people who haven't met you yet.",
      "Connection doesn't require words. Presence is enough.",
      "Someone out there is feeling exactly what you're feeling.",
      "Call someone just to hear their voice.",
      "Ask for help. It's a gift to the giver too.",
      "Write a letter you'll never send. Get it out.",
      "You belong here. Even when it doesn't feel like it.",
      "Pets count as connection. Hug one if you can.",
    ],
  },
  perspective: {
    emoji: '🔮',
    label: 'Perspective',
    wisdoms: [
      "In five years, will this matter?",
      "What advice would 80-year-old you give?",
      "You are not your thoughts. You are the one noticing them.",
      "This is a chapter, not the whole story.",
      "What if this is happening FOR you, not TO you?",
      "Zoom out. Way out. You're on a rock floating in space.",
      "Compare yourself to who you were yesterday, not to someone else today.",
      "What's the most generous interpretation of this situation?",
      "Your brain is trying to keep you safe. Sometimes it overreacts.",
      "Done is better than perfect. Good enough is good enough.",
    ],
  },
};

interface WisdomOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export function WisdomOverlay({ visible, onClose }: WisdomOverlayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentWisdom, setCurrentWisdom] = useState<string>('');

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
      setCurrentWisdom('');
    }
  }, [visible, slideAnim, fadeAnim]);

  // Pick a random wisdom from category
  const selectCategory = (categoryKey: string) => {
    const category = WISDOM_CATEGORIES[categoryKey];
    const randomIndex = Math.floor(Math.random() * category.wisdoms.length);
    setSelectedCategory(categoryKey);
    setCurrentWisdom(category.wisdoms[randomIndex]);
  };

  // Get another wisdom from same category
  const getAnother = () => {
    if (!selectedCategory) return;
    const category = WISDOM_CATEGORIES[selectedCategory];
    let newIndex = Math.floor(Math.random() * category.wisdoms.length);
    // Avoid same wisdom if possible
    const currentIndex = category.wisdoms.indexOf(currentWisdom);
    if (category.wisdoms.length > 1 && newIndex === currentIndex) {
      newIndex = (newIndex + 1) % category.wisdoms.length;
    }
    setCurrentWisdom(category.wisdoms[newIndex]);
  };

  // Go back to categories
  const goBack = () => {
    setSelectedCategory(null);
    setCurrentWisdom('');
  };

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
          <>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                What do you need?
              </Text>
            </View>

            <View style={styles.categoryGrid}>
              {Object.entries(WISDOM_CATEGORIES).map(([key, category]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.categoryButton, { backgroundColor: colors.card }]}
                  onPress={() => selectCategory(key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={[styles.categoryLabel, { color: colors.text }]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          // Wisdom display
          <>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Text style={[styles.backText, { color: colors.tint }]}>
                ← Back
              </Text>
            </TouchableOpacity>

            <View style={styles.wisdomContainer}>
              <Text style={styles.wisdomEmoji}>
                {WISDOM_CATEGORIES[selectedCategory].emoji}
              </Text>
              <Text style={[styles.wisdomText, { color: colors.text }]}>
                {currentWisdom}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.anotherButton, { backgroundColor: colors.card }]}
              onPress={getAnother}
            >
              <Text style={[styles.anotherText, { color: colors.tint }]}>
                Show me another
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.bottomPadding} />
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
    minHeight: 350,
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
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  categoryButton: {
    width: '28%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
  },
  wisdomContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  wisdomEmoji: {
    fontSize: 48,
    marginBottom: 20,
  },
  wisdomText: {
    fontSize: 20,
    lineHeight: 30,
    textAlign: 'center',
    fontStyle: 'italic',
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
