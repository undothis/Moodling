/**
 * Fireflies Overlay
 *
 * Time-based and customizable wisdom/inspiration cards.
 *
 * Structure:
 * - Top row: Time-based categories (Morning, Afternoon, Evening, Night)
 *   Auto-highlights current time of day
 * - Below: Customizable categories (Anxiety, Movement, Creativity, etc.)
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
  ScrollView,
} from 'react-native';
import { Colors } from '@/constants/Colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Time of day detection
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

function getCurrentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'night';
}

// Time-based wisdoms - geared to each time of day
const TIME_CATEGORIES: Record<TimeOfDay, { emoji: string; label: string; wisdoms: string[] }> = {
  morning: {
    emoji: '☀️',
    label: 'Morning',
    wisdoms: [
      "What would make today feel complete?",
      "One thing you're looking forward to today?",
      "How did you sleep? That affects everything.",
      "Morning pages: write three pages of anything. Don't think.",
      "What's the one thing that matters most today?",
      "Stretch before you scroll.",
      "Drink water. Your brain is dehydrated from sleep.",
      "What can you let go of from yesterday?",
      "Set one tiny intention. Just one.",
      "The day hasn't decided what it is yet. Neither have you.",
    ],
  },
  afternoon: {
    emoji: '🌤️',
    label: 'Afternoon',
    wisdoms: [
      "Midday slump? Step outside for two minutes.",
      "How's your energy? Might need fuel or rest.",
      "What's working today? Do more of that.",
      "Unclench your jaw. Drop your shoulders.",
      "You're halfway through. How do you want to finish?",
      "Take a break. Your brain solves problems in the background.",
      "Eat something green. Or at least something.",
      "What can you delegate or delay?",
      "Check in: are you doing or avoiding?",
      "Afternoon light is good for your circadian rhythm. Find some.",
    ],
  },
  evening: {
    emoji: '🌅',
    label: 'Evening',
    wisdoms: [
      "What went well today? Name one thing.",
      "Start winding down. Screen brightness down.",
      "Did you move your body today? A short walk counts.",
      "Evening is for letting go, not catching up.",
      "What are you grateful for? Even small things.",
      "Prepare something small for tomorrow-you.",
      "The work will be there tomorrow. You don't have to finish tonight.",
      "How are you really feeling right now?",
      "Did you connect with anyone today?",
      "What would make tonight restful?",
    ],
  },
  night: {
    emoji: '🌙',
    label: 'Night',
    wisdoms: [
      "Can't sleep? Write down what's on your mind. Get it out of your head.",
      "Your worries feel bigger at night. They'll shrink by morning.",
      "Body scan: where are you holding tension?",
      "Tomorrow is a fresh start. This day is done.",
      "You did enough today. You are enough.",
      "Night thoughts lie. Don't trust them completely.",
      "Breathe slowly. Your heart will follow.",
      "What would you tell a friend who can't sleep?",
      "The world keeps spinning while you rest. Let it.",
      "Sleep is productive. Your brain needs it to function.",
    ],
  },
};

// Customizable categories
const CUSTOM_CATEGORIES: Record<string, { emoji: string; label: string; wisdoms: string[] }> = {
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
  movement: {
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
  creativity: {
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
  sleep: {
    emoji: '😴',
    label: 'Sleep',
    wisdoms: [
      "Put the phone down. The blue light is lying to your brain.",
      "Write tomorrow's to-do list. Get it out of your head.",
      "Your bedroom should be cool, dark, and quiet.",
      "No screens an hour before bed. Read something boring.",
      "Counting sheep is silly. Try counting breaths instead.",
      "Your body wants to sleep. Stop fighting it.",
      "Caffeine has a 6-hour half-life. That afternoon coffee is still in you.",
      "Same bedtime every night. Your body loves routine.",
      "If you can't sleep, get up. Don't train your brain that bed = awake.",
      "Progressive muscle relaxation: tense and release, head to toe.",
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
  const [isTimeCategory, setIsTimeCategory] = useState(false);
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay>(getCurrentTimeOfDay);

  // Animation
  const slideAnim = useState(new Animated.Value(SCREEN_HEIGHT))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Update time of day
  useEffect(() => {
    setCurrentTimeOfDay(getCurrentTimeOfDay());
  }, [visible]);

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
      setIsTimeCategory(false);
    }
  }, [visible, slideAnim, fadeAnim]);

  // Select a time-based category
  const selectTimeCategory = (time: TimeOfDay) => {
    const category = TIME_CATEGORIES[time];
    const randomIndex = Math.floor(Math.random() * category.wisdoms.length);
    setSelectedCategory(time);
    setCurrentWisdom(category.wisdoms[randomIndex]);
    setIsTimeCategory(true);
  };

  // Select a custom category
  const selectCustomCategory = (categoryKey: string) => {
    const category = CUSTOM_CATEGORIES[categoryKey];
    const randomIndex = Math.floor(Math.random() * category.wisdoms.length);
    setSelectedCategory(categoryKey);
    setCurrentWisdom(category.wisdoms[randomIndex]);
    setIsTimeCategory(false);
  };

  // Get another wisdom from same category
  const getAnother = () => {
    if (!selectedCategory) return;
    const category = isTimeCategory
      ? TIME_CATEGORIES[selectedCategory as TimeOfDay]
      : CUSTOM_CATEGORIES[selectedCategory];
    let newIndex = Math.floor(Math.random() * category.wisdoms.length);
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
    setIsTimeCategory(false);
  };

  // Get current category data
  const getCurrentCategory = () => {
    if (!selectedCategory) return null;
    return isTimeCategory
      ? TIME_CATEGORIES[selectedCategory as TimeOfDay]
      : CUSTOM_CATEGORIES[selectedCategory];
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
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header with Customize link */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                Catch a firefly ✨
              </Text>
              <TouchableOpacity onPress={() => {
                // TODO: Navigate to customize screen
                onClose();
              }}>
                <Text style={[styles.customizeLink, { color: colors.tint }]}>
                  Customize
                </Text>
              </TouchableOpacity>
            </View>

            {/* Current time button - only shows current time of day */}
            <TouchableOpacity
              style={[
                styles.currentTimeButton,
                {
                  backgroundColor: colors.tint + '15',
                  borderColor: colors.tint,
                },
              ]}
              onPress={() => selectTimeCategory(currentTimeOfDay)}
              activeOpacity={0.7}
            >
              <Text style={styles.currentTimeEmoji}>
                {TIME_CATEGORIES[currentTimeOfDay].emoji}
              </Text>
              <View style={styles.currentTimeText}>
                <Text style={[styles.currentTimeLabel, { color: colors.tint }]}>
                  {TIME_CATEGORIES[currentTimeOfDay].label}
                </Text>
                <Text style={[styles.currentTimeHint, { color: colors.textMuted }]}>
                  Tap for a {currentTimeOfDay} thought
                </Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Custom categories grid */}
            <View style={styles.categoryGrid}>
              {Object.entries(CUSTOM_CATEGORIES).map(([key, category]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.categoryButton, { backgroundColor: colors.card }]}
                  onPress={() => selectCustomCategory(key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={[styles.categoryLabel, { color: colors.text }]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}

            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
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
                {getCurrentCategory()?.emoji}
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
    maxHeight: SCREEN_HEIGHT * 0.8,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  customizeLink: {
    fontSize: 15,
    fontWeight: '500',
  },
  // Current time button
  currentTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 8,
  },
  currentTimeEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  currentTimeText: {
    flex: 1,
  },
  currentTimeLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  currentTimeHint: {
    fontSize: 14,
  },
  // Divider
  divider: {
    height: 1,
    marginVertical: 16,
  },
  // Custom categories grid
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
    fontSize: 28,
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Wisdom display
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
