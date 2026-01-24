/**
 * 5-4-3-2-1 Quest Game
 *
 * Gamified sensory grounding exercise with RPG quest interface.
 * Find 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste.
 *
 * Mental benefit: Present-moment awareness, anxiety reduction
 * Category: Grounding
 * Difficulty: Gentle
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  SafeAreaView,
  ScrollView,
  Vibration,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { recordGameSession } from '@/services/gamesService';

type SenseType = 'see' | 'hear' | 'feel' | 'smell' | 'taste';

interface SenseQuest {
  sense: SenseType;
  count: number;
  emoji: string;
  prompt: string;
  color: string;
  items: string[];
}

const QUESTS: SenseQuest[] = [
  {
    sense: 'see',
    count: 5,
    emoji: '👁️',
    prompt: 'Look around. What 5 things can you see?',
    color: '#4CAF50',
    items: [],
  },
  {
    sense: 'hear',
    count: 4,
    emoji: '👂',
    prompt: 'Listen carefully. What 4 sounds can you hear?',
    color: '#2196F3',
    items: [],
  },
  {
    sense: 'feel',
    count: 3,
    emoji: '🖐️',
    prompt: 'Notice your body. What 3 things can you feel?',
    color: '#9C27B0',
    items: [],
  },
  {
    sense: 'smell',
    count: 2,
    emoji: '👃',
    prompt: 'Breathe in. What 2 things can you smell?',
    color: '#FF9800',
    items: [],
  },
  {
    sense: 'taste',
    count: 1,
    emoji: '👅',
    prompt: 'Notice your mouth. What 1 thing can you taste?',
    color: '#E91E63',
    items: [],
  },
];

type GameState = 'intro' | 'playing' | 'complete';

export default function FiveFourThreeTwoOneQuest() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>('intro');
  const [currentQuestIndex, setCurrentQuestIndex] = useState(0);
  const [quests, setQuests] = useState<SenseQuest[]>(
    QUESTS.map(q => ({ ...q, items: [] }))
  );
  const [inputValue, setInputValue] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);

  const currentQuest = quests[currentQuestIndex];
  const totalItems = quests.reduce((sum, q) => sum + q.items.length, 0);
  const totalNeeded = QUESTS.reduce((sum, q) => sum + q.count, 0);

  // Start the quest
  const startQuest = useCallback(() => {
    setGameState('playing');
    setCurrentQuestIndex(0);
    setQuests(QUESTS.map(q => ({ ...q, items: [] })));
    setStartTime(new Date());
  }, []);

  // Add an item to current quest
  const addItem = useCallback(() => {
    if (!inputValue.trim()) return;

    Vibration.vibrate(20);

    const newQuests = [...quests];
    newQuests[currentQuestIndex].items.push(inputValue.trim());
    setQuests(newQuests);
    setInputValue('');

    // Check if current quest is complete
    if (newQuests[currentQuestIndex].items.length >= currentQuest.count) {
      // Move to next quest or complete
      if (currentQuestIndex < quests.length - 1) {
        setTimeout(() => {
          setCurrentQuestIndex(prev => prev + 1);
        }, 500);
      } else {
        // All quests complete!
        setGameState('complete');
        Vibration.vibrate([0, 50, 100, 50, 100, 50]);

        // Record session
        if (startTime) {
          const endTime = new Date();
          recordGameSession({
            gameId: '54321_quest',
            startedAt: startTime.toISOString(),
            endedAt: endTime.toISOString(),
            completedSuccessfully: true,
            duration: Math.floor((endTime.getTime() - startTime.getTime()) / 1000),
            score: totalNeeded,
          });
        }
      }
    }
  }, [inputValue, quests, currentQuestIndex, currentQuest, startTime, totalNeeded]);

  // Render intro screen
  const renderIntro = () => (
    <View style={styles.introContainer}>
      <Text style={styles.questIcon}>🗺️</Text>
      <Text style={[styles.introTitle, { color: colors.text }]}>
        5-4-3-2-1 Quest
      </Text>
      <Text style={[styles.introDescription, { color: colors.textSecondary }]}>
        Embark on a sensory adventure to ground yourself in the present moment.
        {'\n\n'}
        You'll notice:{'\n'}
        👁️ 5 things you see{'\n'}
        👂 4 things you hear{'\n'}
        🖐️ 3 things you feel{'\n'}
        👃 2 things you smell{'\n'}
        👅 1 thing you taste
      </Text>

      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: colors.tint }]}
        onPress={startQuest}
      >
        <Text style={styles.startButtonText}>Begin Quest</Text>
      </TouchableOpacity>
    </View>
  );

  // Render playing screen
  const renderPlaying = () => (
    <KeyboardAvoidingView
      style={styles.playContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: currentQuest.color,
                width: `${(totalItems / totalNeeded) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {totalItems}/{totalNeeded} items found
        </Text>
      </View>

      {/* Quest steps indicator */}
      <View style={styles.stepsIndicator}>
        {quests.map((quest, index) => (
          <View
            key={quest.sense}
            style={[
              styles.stepDot,
              {
                backgroundColor:
                  index < currentQuestIndex
                    ? quest.color
                    : index === currentQuestIndex
                    ? quest.color + '80'
                    : colors.border,
              },
            ]}
          >
            <Text style={styles.stepEmoji}>{quest.emoji}</Text>
          </View>
        ))}
      </View>

      {/* Current quest card */}
      <View style={[styles.questCard, { backgroundColor: colors.card }]}>
        <Text style={styles.questEmoji}>{currentQuest.emoji}</Text>
        <Text style={[styles.questCount, { color: currentQuest.color }]}>
          Find {currentQuest.count - currentQuest.items.length} more
        </Text>
        <Text style={[styles.questPrompt, { color: colors.text }]}>
          {currentQuest.prompt}
        </Text>

        {/* Items found */}
        {currentQuest.items.length > 0 && (
          <View style={styles.itemsContainer}>
            {currentQuest.items.map((item, index) => (
              <View
                key={index}
                style={[styles.itemChip, { backgroundColor: currentQuest.color + '20' }]}
              >
                <Text style={[styles.itemText, { color: currentQuest.color }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder={`I notice...`}
            placeholderTextColor={colors.textMuted}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={addItem}
            returnKeyType="done"
            autoFocus
          />
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: inputValue.trim() ? currentQuest.color : colors.border,
              },
            ]}
            onPress={addItem}
            disabled={!inputValue.trim()}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={[styles.tipText, { color: colors.textMuted }]}>
          Take your time. There's no rush. Just notice what's around you.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );

  // Render complete screen
  const renderComplete = () => (
    <ScrollView contentContainerStyle={styles.completeContainer}>
      <Text style={styles.completeIcon}>✨</Text>
      <Text style={[styles.completeTitle, { color: colors.text }]}>
        Quest Complete!
      </Text>
      <Text style={[styles.completeDescription, { color: colors.textSecondary }]}>
        You've grounded yourself in the present moment.
        {'\n'}Here's what you noticed:
      </Text>

      {/* Summary of all items */}
      {quests.map((quest) => (
        <View key={quest.sense} style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryEmoji}>{quest.emoji}</Text>
            <Text style={[styles.summaryTitle, { color: quest.color }]}>
              {quest.sense.charAt(0).toUpperCase() + quest.sense.slice(1)}
            </Text>
          </View>
          <View style={styles.summaryItems}>
            {quest.items.map((item, index) => (
              <Text key={index} style={[styles.summaryItem, { color: colors.textSecondary }]}>
                • {item}
              </Text>
            ))}
          </View>
        </View>
      ))}

      <Text style={[styles.completeMessage, { color: colors.textSecondary }]}>
        Remember: You can use this technique anytime you feel anxious or disconnected.
      </Text>

      <TouchableOpacity
        style={[styles.doneButton, { backgroundColor: colors.tint }]}
        onPress={() => router.back()}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.againButton, { borderColor: colors.border }]}
        onPress={startQuest}
      >
        <Text style={[styles.againButtonText, { color: colors.text }]}>
          Try Again
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>5-4-3-2-1 Quest</Text>
        <View style={styles.backButton} />
      </View>

      {gameState === 'intro' && renderIntro()}
      {gameState === 'playing' && renderPlaying()}
      {gameState === 'complete' && renderComplete()}
    </SafeAreaView>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },

  // Intro
  introContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  questIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  introDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 32,
  },
  startButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  // Playing
  playContainer: {
    flex: 1,
    padding: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  stepDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepEmoji: {
    fontSize: 20,
  },
  questCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
  },
  questEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  questCount: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  questPrompt: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  itemChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 'auto',
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsContainer: {
    padding: 16,
  },
  tipText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Complete
  completeContainer: {
    padding: 24,
    alignItems: 'center',
  },
  completeIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  completeDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryEmoji: {
    fontSize: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryItems: {
    paddingLeft: 28,
  },
  summaryItem: {
    fontSize: 14,
    lineHeight: 22,
  },
  completeMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  doneButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  againButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  againButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
