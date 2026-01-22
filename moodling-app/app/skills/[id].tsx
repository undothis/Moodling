/**
 * Dynamic Skill Detail Screen
 *
 * Handles all skills that don't have dedicated route files.
 * Shows skill info and placeholder content.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { AVAILABLE_SKILLS, SKILL_CATEGORIES, Skill } from '@/types/SkillProgression';
import {
  isCoachModeSkill,
  getCoachModeConfig,
  isModeActive,
  isPersistentMode,
  activateSessionMode,
  deactivateSessionMode,
  togglePersistentMode,
} from '@/services/coachModeService';

// Skill-specific content and instructions
const SKILL_CONTENT: Record<string, {
  steps?: string[];
  tips?: string[];
  duration?: string;
  instructions?: string;
}> = {
  // Grounding
  five_senses: {
    steps: [
      '5 things you can SEE - Look around and name them',
      '4 things you can TOUCH - Feel textures around you',
      '3 things you can HEAR - Listen for sounds near and far',
      '2 things you can SMELL - Notice any scents',
      '1 thing you can TASTE - What do you taste right now?',
    ],
    duration: '3-5 minutes',
    tips: ['Take your time with each sense', 'Describe things in detail', 'This works anywhere - bus, meeting, bed'],
  },
  box_breathing: {
    steps: [
      'Breathe IN for 4 seconds',
      'HOLD for 4 seconds',
      'Breathe OUT for 4 seconds',
      'HOLD for 4 seconds',
      'Repeat 4-6 times',
    ],
    duration: '2-3 minutes',
    tips: ['Used by Navy SEALs for stress', 'Great before presentations', 'Can do eyes open or closed'],
  },
  cold_water: {
    steps: [
      'Get cold water (ice water is best)',
      'Splash on face or hold ice cubes',
      'Focus on the intense sensation',
      'Notice your heart rate slow',
    ],
    duration: '30-60 seconds',
    tips: ['Activates dive reflex', 'Slows heart rate quickly', 'Good for panic moments'],
  },
  grounding_objects: {
    instructions: 'Create a kit of tactile items to hold during anxiety. Ideas: smooth stone, stress ball, textured fabric, essential oil, ice pack.',
    tips: ['Keep one in your bag', 'Keep one at work', 'Engage multiple senses'],
  },
  butterfly_hug: {
    steps: [
      'Cross arms over chest, hands on shoulders',
      'Tap alternating shoulders slowly',
      'Focus on the rhythm',
      'Continue for 1-2 minutes',
    ],
    duration: '1-2 minutes',
    tips: ['Bilateral stimulation calms nervous system', 'Used in EMDR therapy', 'Can do discreetly'],
  },
  physiological_sigh: {
    steps: [
      'Take a deep breath IN through nose',
      'Take a second small breath IN (double inhale)',
      'Long slow breath OUT through mouth',
      'Repeat 2-3 times',
    ],
    duration: '30 seconds',
    tips: ['Fastest way to calm down', 'Discovered by Stanford researchers', 'Works in seconds'],
  },
  safe_place_visualization: {
    steps: [
      'Close your eyes and relax',
      'Imagine a place where you feel completely safe',
      'Notice the details - colors, sounds, smells, temperature',
      'Let yourself feel the safety and peace',
      'Stay here as long as needed',
    ],
    duration: '5-10 minutes',
    tips: ['Can be real or imaginary', 'Add more detail each time', 'Use when overwhelmed'],
  },

  // Anxiety
  worry_time: {
    steps: [
      'Set a specific 15-minute window for worrying',
      'When worries come up outside this time, write them down',
      'Tell yourself "I\'ll worry about this during worry time"',
      'During worry time, go through your list',
      'When time is up, stop and move on',
    ],
    duration: '15 minutes daily',
    tips: ['Same time each day works best', 'Not right before bed', 'Worries often seem smaller when contained'],
  },
  thought_challenging: {
    steps: [
      'Identify the anxious thought',
      'What evidence supports this thought?',
      'What evidence contradicts it?',
      'What would you tell a friend thinking this?',
      'Create a more balanced thought',
    ],
    tips: ['Write it out for better results', 'Look for cognitive distortions', 'Practice makes it automatic'],
  },
  worst_case_best_case: {
    steps: [
      'What is the WORST case scenario?',
      'What is the BEST case scenario?',
      'What is the MOST LIKELY scenario?',
      'How would you cope if the worst happened?',
      'Focus on what you can control',
    ],
    tips: ['Most likely is usually in the middle', 'You\'ve survived 100% of bad days', 'Reduces catastrophizing'],
  },
  fact_vs_feeling: {
    steps: [
      'Write down what you\'re feeling',
      'Write down the facts of the situation',
      'Are your feelings based on facts or assumptions?',
      'What facts might you be missing?',
      'Separate "I feel X" from "X is true"',
    ],
    tips: ['Feelings are valid but not always accurate', 'Facts are verifiable', 'This is not about dismissing feelings'],
  },
  containment: {
    steps: [
      'Imagine a strong container (box, vault, chest)',
      'Visualize putting your worries inside',
      'Close and lock the container',
      'Know you can open it during worry time',
      'Walk away and focus on now',
    ],
    duration: '2-3 minutes',
    tips: ['Make the container unbreakable', 'You control when it opens', 'Good for bedtime worries'],
  },

  // Sleep
  wind_down: {
    steps: [
      '30 min before bed: dim lights, no screens',
      '20 min: gentle stretching or reading',
      '10 min: prepare for bed (teeth, pajamas)',
      '5 min: breathing exercises in bed',
      'Lights out at consistent time',
    ],
    duration: '30 minutes',
    tips: ['Consistency is key', 'Same routine signals sleep', 'Avoid stimulating content'],
  },
  sleep_stories: {
    instructions: 'Listen to calming narrated stories from public domain classics. Alice in Wonderland, Sherlock Holmes, fairy tales - read slowly to help you drift off.',
    tips: ['Set a sleep timer', 'Keep volume low', 'Choose familiar stories'],
  },
  old_time_radio: {
    instructions: 'Classic radio dramas from the 1940s-50s. The Shadow, Suspense, X Minus One. Engaging enough to distract from thoughts, calming enough to sleep.',
    tips: ['Start with mystery or drama', 'Episodes are 20-30 min', 'Low stakes entertainment'],
  },
  ambient_sounds: {
    instructions: 'Nature sounds and white noise for sleep. Rain, ocean waves, forest, thunderstorms, fans, static.',
    tips: ['Mask disruptive sounds', 'Find your preferred sound', 'Consistent sound helps brain relax'],
  },
  body_scan_sleep: {
    steps: [
      'Lie down comfortably',
      'Start at your toes - notice sensations',
      'Slowly move attention up through body',
      'Spend 10-20 seconds on each area',
      'If mind wanders, gently return to body',
    ],
    duration: '10-15 minutes',
    tips: ['Don\'t try to change anything', 'Just notice and move on', 'Often fall asleep before finishing'],
  },
  cognitive_shuffle: {
    steps: [
      'Pick a random letter',
      'Think of words starting with that letter',
      'Visualize each word as an image',
      'When stuck, pick new letter',
      'Let images become dreamlike',
    ],
    duration: 'Until asleep',
    tips: ['Random = good, no categories', 'Don\'t try to remember words', 'Confuses the planning mind'],
  },
  sleep_hygiene: {
    steps: [
      'Cool room (65-68°F / 18-20°C)',
      'Complete darkness (or eye mask)',
      'No screens 1 hour before bed',
      'No caffeine after 2pm',
      'Consistent wake time (even weekends)',
    ],
    tips: ['Environment matters more than you think', 'One change at a time', 'Wake time is most important'],
  },
  worry_journal_night: {
    steps: [
      'Before bed, write tomorrow\'s worries',
      'List 3-5 things on your mind',
      'For each: one small action you could take',
      'Close the journal and set it aside',
      'Tell yourself: "It\'s handled for tonight"',
    ],
    duration: '5-10 minutes',
    tips: ['Gets worries out of head', 'Having a plan reduces anxiety', 'Don\'t solve - just acknowledge'],
  },
  '478_breathing': {
    steps: [
      'Breathe IN through nose for 4 seconds',
      'HOLD breath for 7 seconds',
      'Breathe OUT through mouth for 8 seconds',
      'Repeat 4 cycles',
    ],
    duration: '2 minutes',
    tips: ['Dr. Andrew Weil\'s technique', 'Natural tranquilizer', 'Gets stronger with practice'],
  },

  // Focus
  pomodoro: {
    steps: [
      'Choose one task to focus on',
      'Set timer for 25 minutes',
      'Work only on that task',
      'When timer rings, take 5 min break',
      'After 4 pomodoros, take 15-30 min break',
    ],
    duration: '25 min work + 5 min break',
    tips: ['One task per pomodoro', 'Breaks are mandatory', 'Track how many you complete'],
  },
  brain_dump: {
    steps: [
      'Get paper or open notes app',
      'Set timer for 10 minutes',
      'Write EVERYTHING on your mind',
      'Don\'t organize, just dump',
      'Review and categorize after',
    ],
    duration: '10-15 minutes',
    tips: ['No filtering or judging', 'Include random thoughts', 'Frees up mental RAM'],
  },
  single_tasking: {
    steps: [
      'Choose ONE task',
      'Close all unrelated tabs/apps',
      'Put phone in another room',
      'Work until task is done or time is up',
      'Resist urge to "quickly check" anything',
    ],
    tips: ['Multitasking is a myth', 'Context switching costs 23 min', 'Depth over breadth'],
  },
  environment_design: {
    steps: [
      'Remove distractions from workspace',
      'Put phone out of sight',
      'Have everything you need within reach',
      'Good lighting and comfortable temperature',
      'Consider background noise/music',
    ],
    tips: ['Environment shapes behavior', 'Make good choices easy', 'Make distractions hard'],
  },
  task_batching: {
    steps: [
      'Group similar tasks together',
      'Do all emails at once, not throughout day',
      'Make all calls in one block',
      'Creative work in dedicated blocks',
      'Admin tasks in their own time',
    ],
    tips: ['Reduces context switching', 'Builds momentum', 'Protects deep work time'],
  },
  two_minute_rule: {
    steps: [
      'If a task takes less than 2 minutes...',
      'Do it RIGHT NOW',
      'Don\'t add it to a list',
      'Don\'t schedule it for later',
      'Just do it and move on',
    ],
    tips: ['From Getting Things Done', 'Prevents small task buildup', 'Quick wins build momentum'],
  },

  // Self-Care
  self_compassion_break: {
    steps: [
      'MINDFULNESS: "This is a moment of suffering"',
      'COMMON HUMANITY: "Suffering is part of being human"',
      'SELF-KINDNESS: "May I be kind to myself"',
      'Place hand on heart if helpful',
      'Speak to yourself like a good friend',
    ],
    duration: '2-3 minutes',
    tips: ['Kristin Neff\'s technique', 'Use when self-critical', 'Customize the phrases'],
  },
  joy_list: {
    instructions: 'Create a list of things that bring you joy - big and small. Sunshine, favorite song, hot shower, petting a dog. When struggling, pick one from the list.',
    tips: ['Include free things', 'Include quick things', 'Review when you need a boost'],
  },
  gratitude_practice: {
    steps: [
      'Think of 3 things you\'re grateful for',
      'Be specific (not "family" but "mom\'s laugh today")',
      'Feel the gratitude in your body',
      'Optional: write them down',
    ],
    duration: '3-5 minutes',
    tips: ['Best done morning or night', 'Specific > generic', 'Rewires brain over time'],
  },
  values_clarification: {
    steps: [
      'What matters most to you in life?',
      'What do you want to be remembered for?',
      'When do you feel most alive?',
      'What would you do if money wasn\'t an issue?',
      'Identify your top 5 values',
    ],
    tips: ['Values guide decisions', 'They can change over time', 'Live by your values, not others\''],
  },
  needs_inventory: {
    steps: [
      'Physical needs: sleep, food, movement, touch',
      'Emotional needs: connection, validation, joy',
      'Mental needs: stimulation, rest, meaning',
      'Which needs are met? Which aren\'t?',
      'One small step for each unmet need',
    ],
    tips: ['Unmet needs cause suffering', 'It\'s okay to have needs', 'Ask for help meeting them'],
  },
  pleasure_menu: {
    instructions: 'Create categories of pleasures: Quick (under 5 min), Medium (30 min), Indulgent (longer). Have options ready for hard days when you can\'t think of what to do.',
    tips: ['Include all senses', 'Include free options', 'Don\'t wait to feel like it'],
  },

  // Relationships
  boundary_scripts: {
    instructions: 'Ready-to-use phrases:\n\n"I\'m not able to do that."\n"That doesn\'t work for me."\n"I need some time to think about that."\n"I appreciate you thinking of me, but no."\n"I\'m not comfortable with that."',
    tips: ['No is a complete sentence', 'You don\'t owe explanations', 'Practice makes it easier'],
  },
  conflict_cool_down: {
    steps: [
      'Notice you\'re escalating (heart rate, tension)',
      'Say "I need a break to cool down"',
      'Leave the situation for 20+ minutes',
      'Do something physical or calming',
      'Return when you can think clearly',
    ],
    duration: '20+ minutes',
    tips: ['Not avoiding - taking care', 'Set a time to return', 'Cool down before resolving'],
  },
  repair_conversations: {
    steps: [
      'Wait until both are calm',
      '"I want to repair what happened"',
      'Each person shares their experience',
      'Acknowledge their perspective',
      '"What do we each need going forward?"',
    ],
    tips: ['Repair > being right', 'Focus on reconnection', 'Both perspectives are valid'],
  },
  i_statements: {
    steps: [
      '"I feel [emotion]..."',
      '"When [specific behavior]..."',
      '"Because [impact on you]..."',
      '"I need/would like [request]..."',
    ],
    tips: ['Avoids blame and defensiveness', 'Focus on your experience', 'Be specific about behavior'],
  },
  active_listening: {
    steps: [
      'Give full attention (put phone away)',
      'Don\'t plan your response while they talk',
      'Reflect back: "It sounds like..."',
      'Ask clarifying questions',
      'Validate before problem-solving',
    ],
    tips: ['Most people want to be heard', 'Resist urge to fix', 'Listening is active, not passive'],
  },
  support_network_map: {
    steps: [
      'List people in your life',
      'What support does each provide?',
      'Who do you go to for what?',
      'Where are gaps in your network?',
      'How can you strengthen connections?',
    ],
    tips: ['Quality over quantity', 'Different people for different needs', 'Nurture key relationships'],
  },

  // Mindfulness
  body_scan: {
    steps: [
      'Sit or lie comfortably',
      'Close eyes, take 3 deep breaths',
      'Notice sensations in feet',
      'Slowly move attention up through body',
      'End at top of head',
    ],
    duration: '10-20 minutes',
    tips: ['Not about relaxing (though it often does)', 'Just noticing what\'s there', 'Mind wandering is normal'],
  },
  loving_kindness: {
    steps: [
      'Start with yourself: "May I be happy, healthy, safe"',
      'Extend to loved one: "May you be happy..."',
      'Extend to neutral person',
      'Extend to difficult person',
      'Extend to all beings everywhere',
    ],
    duration: '10-15 minutes',
    tips: ['Metta meditation', 'Start with easiest (often pets)', 'Difficult person can be brief'],
  },
  mindful_moment: {
    steps: [
      'Pause whatever you\'re doing',
      'Take one conscious breath',
      'Notice 3 things you can sense right now',
      'Continue with your day',
    ],
    duration: '1 minute',
    tips: ['Can do anytime, anywhere', 'Set random reminders', 'Builds present-moment awareness'],
  },
  noting_practice: {
    steps: [
      'Sit quietly and close eyes',
      'When a thought arises, label it: "thinking"',
      'When emotion arises: "feeling"',
      'When sensation: "sensing"',
      'Return attention to breath',
    ],
    duration: '5-10 minutes',
    tips: ['Labels create distance', 'Don\'t judge the content', 'Just note and return'],
  },
  rain_technique: {
    steps: [
      'R - RECOGNIZE what\'s happening',
      'A - ALLOW it to be there',
      'I - INVESTIGATE with curiosity',
      'N - NURTURE with self-compassion',
    ],
    duration: '5-15 minutes',
    tips: ['Tara Brach\'s technique', 'Great for difficult emotions', 'Investigation is gentle'],
  },
  mindful_eating: {
    steps: [
      'Look at your food - colors, shapes',
      'Smell it before eating',
      'Take a small bite, don\'t chew yet',
      'Notice textures and flavors',
      'Chew slowly, 20-30 times',
    ],
    tips: ['Try with one meal or snack', 'Put utensils down between bites', 'Notice hunger and fullness'],
  },
  walking_meditation: {
    steps: [
      'Walk slowly and deliberately',
      'Feel each part of the step: lift, move, place',
      'Notice sensations in feet and legs',
      'When mind wanders, return to feet',
      'Can coordinate with breath',
    ],
    duration: '10-20 minutes',
    tips: ['Indoors or outdoors', 'Slower than normal walking', 'Great when sitting is hard'],
  },
  urge_surfing: {
    steps: [
      'Notice the urge/craving arise',
      'Don\'t act on it or push it away',
      'Observe it like a wave - it rises, peaks, falls',
      'Stay curious: where do you feel it?',
      'It will pass - they always do',
    ],
    duration: 'Until urge passes (usually 15-30 min)',
    tips: ['Works for any urge', 'Urges are not commands', 'Gets easier with practice'],
  },
  emotional_labeling: {
    steps: [
      'Notice you\'re having an emotional reaction',
      'Try to name the specific emotion',
      'Get granular: not "bad" but "disappointed"',
      'Say "I notice I\'m feeling [emotion]"',
      'This creates space between you and feeling',
    ],
    tips: ['Naming tames', 'Use emotion wheels for vocabulary', 'Multiple emotions are normal'],
  },

  // Crisis - additional ones not in dedicated files
  distress_tolerance_kit: {
    instructions: 'Build a physical kit:\n\n- Ice pack or cold items\n- Sour candy\n- Strong scent (peppermint, lavender)\n- Stress ball or fidget\n- Photos that make you smile\n- List of coping skills\n- Crisis line numbers',
    tips: ['Keep it accessible', 'Replenish items', 'Know what works for you'],
  },
  wise_mind: {
    steps: [
      'Emotion Mind: "I feel..." (hot, reactive)',
      'Reason Mind: "The facts are..." (cold, logical)',
      'Wise Mind: "Considering both, I..."',
      'Where do emotion and reason overlap?',
      'What does your inner wisdom say?',
    ],
    tips: ['DBT concept', 'Neither extreme is best', 'Wise mind respects both'],
  },

  // Body-Based additional
  somatic_tracking: {
    steps: [
      'Sit quietly and close eyes',
      'Scan your body for sensations',
      'Pick one sensation to focus on',
      'Describe it: size, shape, color, texture',
      'Watch it with curiosity as it changes',
    ],
    duration: '5-10 minutes',
    tips: ['From Pain Reprocessing Therapy', 'Sensations are safe', 'Curiosity over fear'],
  },
  shake_it_out: {
    steps: [
      'Stand with feet shoulder-width apart',
      'Begin shaking hands loosely',
      'Let shaking spread to arms, shoulders',
      'Shake whole body - bounce, wiggle',
      'Continue 2-5 minutes, then be still',
    ],
    duration: '2-5 minutes',
    tips: ['Animals do this after stress', 'Releases stored tension', 'Can be playful'],
  },

  // CBT additional
  cognitive_distortions: {
    instructions: 'Common thinking traps:\n\n• All-or-nothing: "I\'m a total failure"\n• Catastrophizing: "This will be a disaster"\n• Mind reading: "They think I\'m stupid"\n• Fortune telling: "It won\'t work out"\n• Should statements: "I should be better"\n• Personalization: "It\'s all my fault"',
    tips: ['We all do these', 'Noticing is the first step', 'Ask: "Is this a thinking trap?"'],
  },
  behavioral_activation: {
    steps: [
      'List activities that bring meaning or pleasure',
      'Rate current mood 1-10',
      'Schedule one small activity',
      'Do it even if you don\'t feel like it',
      'Rate mood after - usually improves',
    ],
    tips: ['Action before motivation', 'Start very small', 'Momentum builds'],
  },

  // Relationships additional
  validation_levels: {
    instructions: '6 Levels of Validation:\n\n1. Pay attention\n2. Reflect back what you heard\n3. "Mind read" their feelings\n4. Understand based on their history\n5. Normalize based on current situation\n6. Radical genuineness - treat as equal',
    tips: ['Higher levels = deeper validation', 'Start with 1-3', 'Validation ≠ agreement'],
  },

  // Focus additional
  habit_stacking: {
    steps: [
      'Identify an existing habit (morning coffee)',
      'Attach new habit to it (journal while drinking coffee)',
      'Use formula: "After I [current habit], I will [new habit]"',
      'Start with 2-minute version',
      'Build chain over time',
    ],
    tips: ['From Atomic Habits', 'Piggyback on existing routines', 'One stack at a time'],
  },
  implementation_intentions: {
    steps: [
      'Decide what you want to do',
      'Identify when and where',
      'Write: "When [situation], I will [behavior]"',
      'Be specific: "When I sit at my desk at 9am, I will write for 30 minutes"',
      'Visualize doing it',
    ],
    tips: ['Doubles follow-through rates', 'Removes decision-making', 'Automates the start'],
  },
};

export default function SkillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Coach mode state
  const [isCoachMode, setIsCoachMode] = useState(false);
  const [modeActive, setModeActive] = useState(false);
  const [isPersistent, setIsPersistent] = useState(false);
  const coachModeConfig = id ? getCoachModeConfig(id) : null;

  const skill = AVAILABLE_SKILLS.find(s => s.id === id);
  const content = id ? SKILL_CONTENT[id] : null;
  const category = skill?.category ? SKILL_CATEGORIES[skill.category] : null;

  // Load coach mode state
  useFocusEffect(
    useCallback(() => {
      const loadCoachModeState = async () => {
        if (id && isCoachModeSkill(id)) {
          setIsCoachMode(true);
          const [active, persistent] = await Promise.all([
            isModeActive(id),
            isPersistentMode(id),
          ]);
          setModeActive(active);
          setIsPersistent(persistent);
        } else {
          setIsCoachMode(false);
        }
      };
      loadCoachModeState();
    }, [id])
  );

  // Toggle coach mode activation
  const handleToggleCoachMode = async (value: boolean) => {
    if (!id) return;

    setModeActive(value);
    if (value) {
      await activateSessionMode(id);
      Alert.alert(
        'Coach Mode Activated',
        `${skill?.name} is now active. Your coach will use this approach in conversations.`,
        [{ text: 'Got it' }]
      );
    } else {
      await deactivateSessionMode(id);
      // Also turn off persistent if deactivating
      if (isPersistent) {
        setIsPersistent(false);
        await togglePersistentMode(id, false);
      }
    }
  };

  // Toggle persistent mode
  const handleTogglePersistent = async (value: boolean) => {
    if (!id) return;

    setIsPersistent(value);
    await togglePersistentMode(id, value);

    // If enabling persistent, make sure mode is active
    if (value && !modeActive) {
      setModeActive(true);
      await activateSessionMode(id);
    }
  };

  if (!skill) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Skill Not Found' }} />
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Skill not found
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: skill.name,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={styles.emoji}>{skill.emoji}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{skill.name}</Text>
          {category && (
            <View style={[styles.categoryBadge, { backgroundColor: category.color + '30' }]}>
              <Text style={[styles.categoryText, { color: category.color }]}>
                {category.emoji} {category.name}
              </Text>
            </View>
          )}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {skill.description}
          </Text>
          {content?.duration && (
            <Text style={[styles.duration, { color: colors.tint }]}>
              ⏱️ {content.duration}
            </Text>
          )}
        </View>

        {/* Coach Mode Toggle */}
        {isCoachMode && coachModeConfig && (
          <View style={[styles.coachModeSection, { backgroundColor: colors.card }]}>
            <View style={styles.coachModeHeader}>
              <Text style={[styles.coachModeTitle, { color: colors.text }]}>
                🎯 Coach Mode
              </Text>
              <Switch
                value={modeActive}
                onValueChange={handleToggleCoachMode}
                trackColor={{ false: '#767577', true: colors.tint + '80' }}
                thumbColor={modeActive ? colors.tint : '#f4f3f4'}
              />
            </View>
            <Text style={[styles.coachModeDescription, { color: colors.textSecondary }]}>
              When active, your coach will use this approach in conversations.
            </Text>

            {modeActive && (
              <View style={styles.persistentToggle}>
                <View style={styles.persistentInfo}>
                  <Ionicons name="bookmark" size={18} color={colors.tint} />
                  <Text style={[styles.persistentLabel, { color: colors.text }]}>
                    Keep on across sessions
                  </Text>
                </View>
                <Switch
                  value={isPersistent}
                  onValueChange={handleTogglePersistent}
                  trackColor={{ false: '#767577', true: colors.tint + '80' }}
                  thumbColor={isPersistent ? colors.tint : '#f4f3f4'}
                />
              </View>
            )}

            {modeActive && coachModeConfig.usesBreathingBall && (
              <View style={[styles.breathingBallNote, { backgroundColor: colors.tint + '20' }]}>
                <Ionicons name="ellipse" size={16} color={colors.tint} />
                <Text style={[styles.breathingBallText, { color: colors.tint }]}>
                  Breathing ball visual will appear in chat
                </Text>
              </View>
            )}

            {coachModeConfig.suggestedQuestions && coachModeConfig.suggestedQuestions.length > 0 && (
              <View style={styles.suggestedQuestions}>
                <Text style={[styles.suggestedLabel, { color: colors.textMuted }]}>
                  Your coach might ask:
                </Text>
                {coachModeConfig.suggestedQuestions.map((q, i) => (
                  <Text key={i} style={[styles.suggestedQuestion, { color: colors.textSecondary }]}>
                    "{q}"
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Instructions */}
        {content?.instructions && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📋 Instructions
            </Text>
            <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>
              {content.instructions}
            </Text>
          </View>
        )}

        {/* Steps */}
        {content?.steps && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📝 Steps
            </Text>
            {content.steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: colors.tint }]}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Tips */}
        {content?.tips && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              💡 Tips
            </Text>
            {content.tips.map((tip, index) => (
              <View key={index} style={styles.tipRow}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* No content yet */}
        {!content && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.comingSoon, { color: colors.textMuted }]}>
              Detailed guide coming soon!
            </Text>
            <Text style={[styles.comingSoonSub, { color: colors.textMuted }]}>
              For now, explore this skill and see what works for you.
            </Text>
          </View>
        )}

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: colors.tint }]}
          onPress={() => {
            Alert.alert(
              'Practice Started',
              `You're practicing ${skill.name}. Take your time and follow the steps above.`,
              [{ text: 'Got it' }]
            );
          }}
        >
          <Ionicons name="play" size={20} color="#FFFFFF" />
          <Text style={styles.startButtonText}>Start Practice</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  instructionsText: {
    fontSize: 15,
    lineHeight: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    paddingTop: 3,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 16,
    marginRight: 8,
    color: '#888',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  comingSoon: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  comingSoonSub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Coach Mode Styles
  coachModeSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  coachModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  coachModeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  coachModeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  persistentToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  persistentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  persistentLabel: {
    fontSize: 14,
  },
  breathingBallNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  breathingBallText: {
    fontSize: 13,
    fontWeight: '500',
  },
  suggestedQuestions: {
    marginTop: 16,
  },
  suggestedLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  suggestedQuestion: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 4,
  },
});
