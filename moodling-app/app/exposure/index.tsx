import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  EXPOSURE_LEVELS,
  ExposureLevel,
  ExposureChallenge,
  ExposureAttempt,
  getCurrentLevel,
  setCurrentLevel,
  suggestChallenge,
  celebrateAttempt,
  logAttempt,
  getRecentAttempts,
  getProgressStats,
  getMotivationalMessage,
  getLevelInfo,
} from '@/services/exposureLadderService';

/**
 * Social Exposure Ladder Screen
 *
 * Following Moodling Ethics:
 * - User sets their own pace
 * - Celebrates attempts, not just success
 * - Never pushes too hard
 * - Normalizes anxiety
 *
 * Unit 21: Social Exposure Ladder
 */

export default function ExposureLadderScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [currentLevel, setCurrentLevelState] = useState<ExposureLevel>(1);
  const [challenge, setChallenge] = useState<ExposureChallenge | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<ExposureAttempt[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getProgressStats>> | null>(null);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // Log attempt form state
  const [logDescription, setLogDescription] = useState('');
  const [logAnxietyBefore, setLogAnxietyBefore] = useState(5);
  const [logAnxietyAfter, setLogAnxietyAfter] = useState<number | null>(null);
  const [logCompleted, setLogCompleted] = useState(true);
  const [logLevel, setLogLevel] = useState<ExposureLevel>(1);
  const [celebration, setCelebration] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const level = await getCurrentLevel();
    setCurrentLevelState(level);
    setLogLevel(level);

    const attempts = await getRecentAttempts(30);
    setRecentAttempts(attempts);

    const progressStats = await getProgressStats();
    setStats(progressStats);

    // Generate initial challenge
    const hasRecentSuccess = attempts.length > 0 && attempts[0].completed;
    setChallenge(suggestChallenge(level, hasRecentSuccess));
  };

  const handleLevelChange = async (level: ExposureLevel) => {
    await setCurrentLevel(level);
    setCurrentLevelState(level);
    setLogLevel(level);
    setShowLevelPicker(false);

    const hasRecentSuccess = recentAttempts.length > 0 && recentAttempts[0].completed;
    setChallenge(suggestChallenge(level, hasRecentSuccess));
  };

  const handleNewChallenge = () => {
    const hasRecentSuccess = recentAttempts.length > 0 && recentAttempts[0].completed;
    setChallenge(suggestChallenge(currentLevel, hasRecentSuccess));
  };

  const handleLogAttempt = async () => {
    const attempt = await logAttempt({
      level: logLevel,
      description: logDescription || challenge?.suggestion || 'Social exposure',
      completed: logCompleted,
      anxietyBefore: logAnxietyBefore,
      anxietyAfter: logAnxietyAfter ?? undefined,
    });

    // Show celebration
    const message = celebrateAttempt(
      logCompleted,
      logAnxietyBefore,
      logAnxietyAfter ?? undefined
    );
    setCelebration(message);

    // Reset form
    setShowLogModal(false);
    setLogDescription('');
    setLogAnxietyBefore(5);
    setLogAnxietyAfter(null);
    setLogCompleted(true);

    // Reload data
    loadData();

    // Clear celebration after delay
    setTimeout(() => setCelebration(null), 8000);
  };

  const renderAnxietySelector = (
    value: number,
    onChange: (val: number) => void,
    label: string
  ) => (
    <View style={styles.anxietySelector}>
      <Text style={[styles.anxietyLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.anxietyButtons}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <TouchableOpacity
            key={num}
            style={[
              styles.anxietyButton,
              {
                backgroundColor: value === num ? colors.tint : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => onChange(num)}
          >
            <Text
              style={[
                styles.anxietyButtonText,
                { color: value === num ? '#FFFFFF' : colors.text },
              ]}
            >
              {num}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Social Exposure Ladder
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Celebration Message */}
        {celebration && (
          <View style={[styles.celebrationCard, { backgroundColor: colors.moodPositive + '20' }]}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={[styles.celebrationText, { color: colors.text }]}>
              {celebration}
            </Text>
          </View>
        )}

        {/* Current Level */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Current Comfort Level
          </Text>
          <TouchableOpacity
            style={[styles.levelButton, { backgroundColor: colors.background }]}
            onPress={() => setShowLevelPicker(true)}
          >
            <View style={styles.levelInfo}>
              <Text style={[styles.levelNumber, { color: colors.tint }]}>
                Level {currentLevel}
              </Text>
              <Text style={[styles.levelName, { color: colors.text }]}>
                {getLevelInfo(currentLevel).name}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.levelHint, { color: colors.textMuted }]}>
            This is where you feel mostly comfortable. We'll suggest challenges at or just above this level.
          </Text>
        </View>

        {/* Challenge Card */}
        {challenge && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.challengeHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Challenge
              </Text>
              <TouchableOpacity onPress={handleNewChallenge}>
                <Text style={[styles.refreshLink, { color: colors.tint }]}>
                  Different idea
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.challengeCard, { backgroundColor: colors.background }]}>
              <Text style={[styles.challengeLevel, { color: colors.textMuted }]}>
                Level {challenge.level}: {challenge.levelInfo.name}
              </Text>
              <Text style={[styles.challengeSuggestion, { color: colors.text }]}>
                {challenge.suggestion}
              </Text>
              <Text style={[styles.challengeEncouragement, { color: colors.textSecondary }]}>
                {challenge.encouragement}
              </Text>
            </View>

            <Text style={[styles.normalizer, { color: colors.textMuted }]}>
              {challenge.normalizer}
            </Text>

            <TouchableOpacity
              style={[styles.logButton, { backgroundColor: colors.tint }]}
              onPress={() => {
                setLogDescription(challenge.suggestion);
                setLogLevel(challenge.level);
                setShowLogModal(true);
              }}
            >
              <Text style={styles.logButtonText}>Log an attempt</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Progress Stats */}
        {stats && stats.totalAttempts > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your Progress
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.tint }]}>
                  {stats.totalAttempts}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  attempts
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.tint }]}>
                  {stats.completedAttempts}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  completed
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.tint }]}>
                  Level {stats.highestLevelAttempted}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  highest
                </Text>
              </View>
            </View>

            <Text style={[styles.motivationalMessage, { color: colors.textSecondary }]}>
              {getMotivationalMessage(stats)}
            </Text>
          </View>
        )}

        {/* Recent Attempts */}
        {recentAttempts.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Attempts
            </Text>
            {recentAttempts.slice(0, 5).map((attempt) => (
              <View
                key={attempt.id}
                style={[styles.attemptItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.attemptMain}>
                  <Text style={[styles.attemptDescription, { color: colors.text }]}>
                    {attempt.description}
                  </Text>
                  <Text style={[styles.attemptMeta, { color: colors.textMuted }]}>
                    Level {attempt.level} • {new Date(attempt.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.attemptStatus}>
                  {attempt.completed ? '✓' : '○'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Explanation */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            How This Works
          </Text>
          <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
            Social exposure is a proven technique for building confidence. The idea is simple:
            gradually face situations that make you anxious, starting with easier ones and slowly
            working up.
          </Text>
          <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
            The key insight: anxiety naturally decreases when you stay in a situation long enough.
            Each exposure teaches your brain that the situation is safe.
          </Text>
          <Text style={[styles.explanationText, { color: colors.textMuted }]}>
            We never push more than one level at a time. You set the pace.
          </Text>
        </View>
      </ScrollView>

      {/* Level Picker Modal */}
      <Modal visible={showLevelPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Set Your Comfort Level
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              Where do you feel mostly comfortable right now?
            </Text>

            <ScrollView style={styles.levelList}>
              {EXPOSURE_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.level}
                  style={[
                    styles.levelOption,
                    {
                      backgroundColor:
                        currentLevel === level.level ? colors.tint : colors.card,
                    },
                  ]}
                  onPress={() => handleLevelChange(level.level)}
                >
                  <Text
                    style={[
                      styles.levelOptionNumber,
                      {
                        color: currentLevel === level.level ? '#FFFFFF' : colors.tint,
                      },
                    ]}
                  >
                    {level.level}
                  </Text>
                  <View style={styles.levelOptionText}>
                    <Text
                      style={[
                        styles.levelOptionName,
                        {
                          color: currentLevel === level.level ? '#FFFFFF' : colors.text,
                        },
                      ]}
                    >
                      {level.name}
                    </Text>
                    <Text
                      style={[
                        styles.levelOptionDesc,
                        {
                          color:
                            currentLevel === level.level
                              ? 'rgba(255,255,255,0.8)'
                              : colors.textMuted,
                        },
                      ]}
                    >
                      {level.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowLevelPicker(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.textMuted }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Log Attempt Modal */}
      <Modal visible={showLogModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Log Your Attempt
            </Text>

            <ScrollView style={styles.logForm}>
              {/* Description */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                What did you do?
              </Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="Describe your attempt..."
                placeholderTextColor={colors.textMuted}
                value={logDescription}
                onChangeText={setLogDescription}
                multiline
              />

              {/* Completed toggle */}
              <View style={styles.completedRow}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Did you complete it?
                </Text>
                <View style={styles.completedButtons}>
                  <TouchableOpacity
                    style={[
                      styles.completedButton,
                      {
                        backgroundColor: logCompleted ? colors.tint : colors.card,
                      },
                    ]}
                    onPress={() => setLogCompleted(true)}
                  >
                    <Text
                      style={{
                        color: logCompleted ? '#FFFFFF' : colors.text,
                      }}
                    >
                      Yes
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.completedButton,
                      {
                        backgroundColor: !logCompleted ? colors.tint : colors.card,
                      },
                    ]}
                    onPress={() => setLogCompleted(false)}
                  >
                    <Text
                      style={{
                        color: !logCompleted ? '#FFFFFF' : colors.text,
                      }}
                    >
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.completedHint, { color: colors.textMuted }]}>
                Both count as progress. Trying is what matters.
              </Text>

              {/* Anxiety before */}
              {renderAnxietySelector(logAnxietyBefore, setLogAnxietyBefore, 'Anxiety before (1-10)')}

              {/* Anxiety after */}
              {logCompleted && (
                <>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Anxiety after (optional)
                  </Text>
                  <View style={styles.anxietyButtons}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <TouchableOpacity
                        key={num}
                        style={[
                          styles.anxietyButton,
                          {
                            backgroundColor:
                              logAnxietyAfter === num ? colors.tint : colors.card,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() =>
                          setLogAnxietyAfter(logAnxietyAfter === num ? null : num)
                        }
                      >
                        <Text
                          style={[
                            styles.anxietyButtonText,
                            { color: logAnxietyAfter === num ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {num}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.tint }]}
                onPress={handleLogAttempt}
              >
                <Text style={styles.saveButtonText}>Save Attempt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowLogModal(false)}
              >
                <Text style={[styles.modalCloseText, { color: colors.textMuted }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  levelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
  },
  levelInfo: {
    flex: 1,
  },
  levelNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  levelName: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  levelHint: {
    fontSize: 13,
    marginTop: 12,
    lineHeight: 18,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  challengeCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  challengeLevel: {
    fontSize: 12,
    marginBottom: 6,
  },
  challengeSuggestion: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  challengeEncouragement: {
    fontSize: 14,
    lineHeight: 20,
  },
  normalizer: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  logButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  motivationalMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  attemptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  attemptMain: {
    flex: 1,
  },
  attemptDescription: {
    fontSize: 15,
    marginBottom: 2,
  },
  attemptMeta: {
    fontSize: 12,
  },
  attemptStatus: {
    fontSize: 18,
    marginLeft: 12,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  celebrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    gap: 12,
  },
  celebrationEmoji: {
    fontSize: 28,
  },
  celebrationText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  levelList: {
    maxHeight: 400,
  },
  levelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  levelOptionNumber: {
    fontSize: 20,
    fontWeight: '700',
    width: 32,
  },
  levelOptionText: {
    flex: 1,
    marginLeft: 12,
  },
  levelOptionName: {
    fontSize: 15,
    fontWeight: '600',
  },
  levelOptionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  modalClose: {
    padding: 16,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
  },
  modalButtons: {
    marginTop: 16,
  },
  // Log form styles
  logForm: {
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 60,
  },
  completedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  completedButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  completedButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completedHint: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  anxietySelector: {
    marginTop: 8,
  },
  anxietyLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  anxietyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  anxietyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  anxietyButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  saveButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
