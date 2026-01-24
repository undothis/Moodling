/**
 * Thought Maze Game
 *
 * Navigate a maze by answering "is this thought helpful?"
 * Cognitive restructuring through dungeon crawler aesthetic.
 *
 * Mental benefit: Cognitive restructuring, identifying helpful vs unhelpful thoughts
 * Category: Logic (Therapeutic)
 * Difficulty: Moderate
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  SafeAreaView,
  Dimensions,
  Vibration,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { recordGameSession } from '@/services/gamesService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ThoughtChallenge {
  thought: string;
  isHelpful: boolean;
  explanation: string;
  category: 'catastrophizing' | 'black_white' | 'mind_reading' | 'fortune_telling' | 'helpful';
}

const THOUGHT_CHALLENGES: ThoughtChallenge[] = [
  // Unhelpful thoughts (cognitive distortions)
  {
    thought: "I failed once, so I'll always fail.",
    isHelpful: false,
    explanation: "This is black-and-white thinking. One failure doesn't predict all future outcomes.",
    category: 'black_white',
  },
  {
    thought: "If I make a mistake, everyone will think I'm incompetent.",
    isHelpful: false,
    explanation: "This is mind reading. You can't know what everyone thinks, and most people understand mistakes happen.",
    category: 'mind_reading',
  },
  {
    thought: "This is the worst thing that could ever happen.",
    isHelpful: false,
    explanation: "This is catastrophizing. While difficult, there are likely worse scenarios, and you can cope with this.",
    category: 'catastrophizing',
  },
  {
    thought: "I know this meeting will go terribly.",
    isHelpful: false,
    explanation: "This is fortune telling. You can't predict the future, and anxiety often makes us expect the worst.",
    category: 'fortune_telling',
  },
  {
    thought: "Nobody likes me.",
    isHelpful: false,
    explanation: "This is black-and-white thinking. It's unlikely that literally nobody likes you.",
    category: 'black_white',
  },
  {
    thought: "They're probably talking about me behind my back.",
    isHelpful: false,
    explanation: "This is mind reading. Without evidence, assuming negative things about others' thoughts increases anxiety.",
    category: 'mind_reading',
  },
  {
    thought: "If I don't do this perfectly, it's not worth doing.",
    isHelpful: false,
    explanation: "This is black-and-white thinking. Progress and 'good enough' have value too.",
    category: 'black_white',
  },
  {
    thought: "I'll never get over this.",
    isHelpful: false,
    explanation: "This is fortune telling. Feelings change over time, and you've gotten through hard things before.",
    category: 'fortune_telling',
  },

  // Helpful thoughts
  {
    thought: "This is hard, but I can take it one step at a time.",
    isHelpful: true,
    explanation: "This acknowledges difficulty while maintaining a sense of capability.",
    category: 'helpful',
  },
  {
    thought: "Making mistakes is part of learning.",
    isHelpful: true,
    explanation: "This reframes mistakes as opportunities rather than failures.",
    category: 'helpful',
  },
  {
    thought: "I don't know how this will turn out, but I can handle uncertainty.",
    isHelpful: true,
    explanation: "This accepts uncertainty without catastrophizing.",
    category: 'helpful',
  },
  {
    thought: "I'm doing the best I can with what I have right now.",
    isHelpful: true,
    explanation: "This is self-compassionate and realistic.",
    category: 'helpful',
  },
  {
    thought: "Some people might not like me, and that's okay.",
    isHelpful: true,
    explanation: "This accepts that we can't please everyone, reducing anxiety about approval.",
    category: 'helpful',
  },
  {
    thought: "I've felt this way before and it passed.",
    isHelpful: true,
    explanation: "This reminds you that difficult feelings are temporary.",
    category: 'helpful',
  },
  {
    thought: "I can ask for help if I need it.",
    isHelpful: true,
    explanation: "This recognizes that seeking support is a strength, not a weakness.",
    category: 'helpful',
  },
  {
    thought: "This situation is difficult, but it's not defining my whole life.",
    isHelpful: true,
    explanation: "This maintains perspective during challenges.",
    category: 'helpful',
  },
];

type GameState = 'intro' | 'playing' | 'feedback' | 'complete';

export default function ThoughtMazeGame() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledThoughts, setShuffledThoughts] = useState<ThoughtChallenge[]>([]);
  const [score, setScore] = useState(0);
  const [lastAnswer, setLastAnswer] = useState<{ correct: boolean; challenge: ThoughtChallenge } | null>(null);
  const [mazePosition, setMazePosition] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const TOTAL_CHALLENGES = 8;
  const progress = currentIndex / TOTAL_CHALLENGES;

  // Shuffle and start game
  const startGame = useCallback(() => {
    const shuffled = [...THOUGHT_CHALLENGES]
      .sort(() => Math.random() - 0.5)
      .slice(0, TOTAL_CHALLENGES);
    setShuffledThoughts(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setMazePosition(0);
    setStartTime(new Date());
    setGameState('playing');
  }, []);

  // Handle answer
  const handleAnswer = useCallback((answeredHelpful: boolean) => {
    const challenge = shuffledThoughts[currentIndex];
    const correct = challenge.isHelpful === answeredHelpful;

    Vibration.vibrate(correct ? 30 : [0, 50, 50, 50]);

    if (correct) {
      setScore(prev => prev + 1);
      setMazePosition(prev => prev + 1);
    }

    setLastAnswer({ correct, challenge });
    setGameState('feedback');
  }, [currentIndex, shuffledThoughts]);

  // Continue to next
  const continueGame = useCallback(() => {
    if (currentIndex + 1 >= TOTAL_CHALLENGES) {
      setGameState('complete');

      // Record session
      if (startTime) {
        const endTime = new Date();
        recordGameSession({
          gameId: 'thought_maze',
          startedAt: startTime.toISOString(),
          endedAt: endTime.toISOString(),
          completedSuccessfully: true,
          duration: Math.floor((endTime.getTime() - startTime.getTime()) / 1000),
          score: score + (lastAnswer?.correct ? 1 : 0),
        });
      }
    } else {
      setCurrentIndex(prev => prev + 1);
      setGameState('playing');
    }
  }, [currentIndex, startTime, score, lastAnswer]);

  // Render maze visualization
  const renderMaze = () => (
    <View style={styles.mazeContainer}>
      {/* Maze path */}
      <View style={styles.mazePath}>
        {Array.from({ length: TOTAL_CHALLENGES + 1 }).map((_, i) => (
          <View key={i} style={styles.mazeNode}>
            {/* Node */}
            <View
              style={[
                styles.mazeNodeDot,
                {
                  backgroundColor:
                    i < mazePosition
                      ? '#4CAF50'
                      : i === mazePosition
                      ? colors.tint
                      : colors.border,
                },
              ]}
            >
              {i === mazePosition && <Text style={styles.playerIcon}>🧙</Text>}
              {i === TOTAL_CHALLENGES && <Text style={styles.exitIcon}>🚪</Text>}
            </View>
            {/* Connector */}
            {i < TOTAL_CHALLENGES && (
              <View
                style={[
                  styles.mazeConnector,
                  { backgroundColor: i < mazePosition ? '#4CAF50' : colors.border },
                ]}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  // Render intro
  const renderIntro = () => (
    <View style={styles.centeredContainer}>
      <Text style={styles.introIcon}>🧠</Text>
      <Text style={[styles.introTitle, { color: colors.text }]}>Thought Maze</Text>
      <Text style={[styles.introDescription, { color: colors.textSecondary }]}>
        Navigate the maze by identifying helpful vs. unhelpful thoughts.
        {'\n\n'}
        Answer correctly to move forward.
        {'\n'}
        Wrong answers keep you in place.
        {'\n\n'}
        Can you escape the maze?
      </Text>
      <TouchableOpacity
        style={[styles.startButton, { backgroundColor: colors.tint }]}
        onPress={startGame}
      >
        <Text style={styles.startButtonText}>Enter the Maze</Text>
      </TouchableOpacity>
    </View>
  );

  // Render playing
  const renderPlaying = () => {
    const challenge = shuffledThoughts[currentIndex];
    if (!challenge) return null;

    return (
      <View style={styles.playContainer}>
        {renderMaze()}

        {/* Thought card */}
        <View style={[styles.thoughtCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.thoughtLabel, { color: colors.textSecondary }]}>
            Is this thought helpful?
          </Text>
          <Text style={[styles.thoughtText, { color: colors.text }]}>
            "{challenge.thought}"
          </Text>
        </View>

        {/* Answer buttons */}
        <View style={styles.answerButtons}>
          <TouchableOpacity
            style={[styles.answerButton, styles.helpfulButton]}
            onPress={() => handleAnswer(true)}
          >
            <Ionicons name="checkmark-circle" size={28} color="#fff" />
            <Text style={styles.answerButtonText}>Helpful</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.answerButton, styles.unhelpfulButton]}
            onPress={() => handleAnswer(false)}
          >
            <Ionicons name="close-circle" size={28} color="#fff" />
            <Text style={styles.answerButtonText}>Unhelpful</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.progressText, { color: colors.textMuted }]}>
          {currentIndex + 1} of {TOTAL_CHALLENGES}
        </Text>
      </View>
    );
  };

  // Render feedback
  const renderFeedback = () => {
    if (!lastAnswer) return null;

    return (
      <View style={styles.feedbackContainer}>
        {renderMaze()}

        <View
          style={[
            styles.feedbackCard,
            {
              backgroundColor: colors.card,
              borderColor: lastAnswer.correct ? '#4CAF50' : colors.error,
            },
          ]}
        >
          <Text style={styles.feedbackIcon}>
            {lastAnswer.correct ? '✓' : '✗'}
          </Text>
          <Text
            style={[
              styles.feedbackTitle,
              { color: lastAnswer.correct ? '#4CAF50' : colors.error },
            ]}
          >
            {lastAnswer.correct ? 'Correct!' : 'Not quite'}
          </Text>

          <Text style={[styles.thoughtQuote, { color: colors.textSecondary }]}>
            "{lastAnswer.challenge.thought}"
          </Text>

          <Text
            style={[
              styles.wasText,
              { color: lastAnswer.challenge.isHelpful ? '#4CAF50' : colors.error },
            ]}
          >
            This thought is {lastAnswer.challenge.isHelpful ? 'HELPFUL' : 'UNHELPFUL'}
          </Text>

          {!lastAnswer.challenge.isHelpful && (
            <View style={styles.categoryBadge}>
              <Text style={[styles.categoryText, { color: colors.textMuted }]}>
                {lastAnswer.challenge.category === 'catastrophizing' && '⚡ Catastrophizing'}
                {lastAnswer.challenge.category === 'black_white' && '◐ Black & White Thinking'}
                {lastAnswer.challenge.category === 'mind_reading' && '🔮 Mind Reading'}
                {lastAnswer.challenge.category === 'fortune_telling' && '🔮 Fortune Telling'}
              </Text>
            </View>
          )}

          <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
            {lastAnswer.challenge.explanation}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.tint }]}
          onPress={continueGame}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render complete
  const renderComplete = () => (
    <View style={styles.centeredContainer}>
      <Text style={styles.completeIcon}>🏆</Text>
      <Text style={[styles.completeTitle, { color: colors.text }]}>
        Maze Complete!
      </Text>
      <Text style={[styles.scoreText, { color: colors.tint }]}>
        {score} / {TOTAL_CHALLENGES} correct
      </Text>
      <Text style={[styles.completeDescription, { color: colors.textSecondary }]}>
        {score === TOTAL_CHALLENGES
          ? "Perfect! You're great at identifying unhelpful thoughts!"
          : score >= TOTAL_CHALLENGES * 0.7
          ? 'Well done! You can spot most cognitive distortions.'
          : 'Keep practicing! Recognizing unhelpful thoughts gets easier with time.'}
      </Text>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Remember</Text>
        <Text style={[styles.tipText, { color: colors.textSecondary }]}>
          Unhelpful thoughts often include:{'\n'}
          • Absolute words (always, never, everyone){'\n'}
          • Predicting the future{'\n'}
          • Assuming what others think{'\n'}
          • Catastrophizing small setbacks
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.playAgainButton, { backgroundColor: colors.tint }]}
        onPress={startGame}
      >
        <Text style={styles.playAgainButtonText}>Play Again</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.exitButton, { borderColor: colors.border }]}
        onPress={() => router.back()}
      >
        <Text style={[styles.exitButtonText, { color: colors.text }]}>Exit</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Thought Maze</Text>
        <View style={styles.backButton}>
          {gameState !== 'intro' && (
            <Text style={[styles.scoreDisplay, { color: colors.tint }]}>{score}</Text>
          )}
        </View>
      </View>

      {gameState === 'intro' && renderIntro()}
      {gameState === 'playing' && renderPlaying()}
      {gameState === 'feedback' && renderFeedback()}
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
  scoreDisplay: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Maze
  mazeContainer: {
    padding: 16,
  },
  mazePath: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mazeNode: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mazeNodeDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mazeConnector: {
    width: 16,
    height: 3,
  },
  playerIcon: {
    fontSize: 16,
  },
  exitIcon: {
    fontSize: 14,
  },

  // Centered container
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  introIcon: {
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
    lineHeight: 26,
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
  thoughtCard: {
    padding: 24,
    borderRadius: 16,
    marginVertical: 24,
  },
  thoughtLabel: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  thoughtText: {
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 30,
    fontStyle: 'italic',
  },
  answerButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 'auto',
  },
  answerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  helpfulButton: {
    backgroundColor: '#4CAF50',
  },
  unhelpfulButton: {
    backgroundColor: '#E53935',
  },
  answerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },

  // Feedback
  feedbackContainer: {
    flex: 1,
    padding: 16,
  },
  feedbackCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    marginVertical: 16,
  },
  feedbackIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  feedbackTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  thoughtQuote: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  wasText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  categoryBadge: {
    marginVertical: 8,
  },
  categoryText: {
    fontSize: 13,
  },
  explanationText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
  },
  continueButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Complete
  completeIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  completeDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  tipCard: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FF9800',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
  },
  playAgainButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  playAgainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exitButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  exitButtonText: {
    fontSize: 16,
  },
});
