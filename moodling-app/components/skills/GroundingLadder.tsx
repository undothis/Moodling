/**
 * Grounding Ladder
 *
 * Tiered escalation of grounding techniques by intensity.
 * When one level isn't working, move to the next level.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Technique {
  name: string;
  description: string;
  duration: string;
  instructions: string[];
}

interface LadderLevel {
  level: number;
  name: string;
  emoji: string;
  color: string;
  description: string;
  techniques: Technique[];
}

const GROUNDING_LADDER: LadderLevel[] = [
  {
    level: 1,
    name: 'Gentle',
    emoji: '🌸',
    color: '#10B981',
    description: 'Start here for mild anxiety or early warning signs',
    techniques: [
      {
        name: 'Deep Breaths',
        description: 'Simple conscious breathing',
        duration: '1-2 min',
        instructions: [
          'Breathe in slowly for 4 counts',
          'Hold for 2 counts',
          'Exhale slowly for 6 counts',
          'Repeat 5-10 times',
        ],
      },
      {
        name: 'Feet on Floor',
        description: 'Feel your connection to the ground',
        duration: '30 sec',
        instructions: [
          'Press your feet firmly into the floor',
          'Notice the pressure and texture',
          'Wiggle your toes',
          'Feel the stability beneath you',
        ],
      },
      {
        name: 'Name 5 Things',
        description: 'Quick sensory scan',
        duration: '1 min',
        instructions: [
          'Name 5 things you can see',
          'Focus on details and colors',
          'Say them out loud if possible',
          'Move your eyes around the room',
        ],
      },
    ],
  },
  {
    level: 2,
    name: 'Moderate',
    emoji: '🌊',
    color: '#3B82F6',
    description: 'When Level 1 isn\'t enough',
    techniques: [
      {
        name: '5-4-3-2-1 Full',
        description: 'Complete sensory grounding',
        duration: '3-5 min',
        instructions: [
          '5 things you can SEE (describe details)',
          '4 things you can TOUCH (feel textures)',
          '3 things you can HEAR (even quiet sounds)',
          '2 things you can SMELL',
          '1 thing you can TASTE',
        ],
      },
      {
        name: 'Body Scan',
        description: 'Progressive awareness',
        duration: '5 min',
        instructions: [
          'Start at the top of your head',
          'Slowly move attention down your body',
          'Notice any tension without judging',
          'Continue to your toes',
          'Take a full breath when complete',
        ],
      },
      {
        name: 'Butterfly Hug',
        description: 'Bilateral stimulation',
        duration: '2-3 min',
        instructions: [
          'Cross arms over chest, hands on shoulders',
          'Alternate tapping left and right',
          'Keep a slow, steady rhythm',
          'Breathe deeply while tapping',
        ],
      },
    ],
  },
  {
    level: 3,
    name: 'Strong',
    emoji: '⚡',
    color: '#F59E0B',
    description: 'For intense distress or panic',
    techniques: [
      {
        name: 'Cold Water',
        description: 'Activate dive reflex',
        duration: '30-60 sec',
        instructions: [
          'Get very cold water or ice',
          'Hold ice cubes or splash face',
          'Focus on the intense cold sensation',
          'This triggers your dive reflex, slowing heart rate',
        ],
      },
      {
        name: 'Intense Exercise',
        description: 'Move the stress out',
        duration: '5-10 min',
        instructions: [
          'Do jumping jacks, run in place, or push-ups',
          'Go as hard as you can for 2 minutes',
          'Rest and repeat',
          'Physical exertion metabolizes stress hormones',
        ],
      },
      {
        name: 'Physiological Sigh',
        description: 'Fastest nervous system reset',
        duration: '1 min',
        instructions: [
          'Take a deep breath in',
          'At the top, take another small sip of air',
          'Let it ALL out with a long exhale',
          'Repeat 3-5 times',
          'This activates your parasympathetic system',
        ],
      },
    ],
  },
  {
    level: 4,
    name: 'Emergency',
    emoji: '🆘',
    color: '#EF4444',
    description: 'When nothing else is working',
    techniques: [
      {
        name: 'TIPP - All Four',
        description: 'DBT crisis protocol',
        duration: '10-15 min',
        instructions: [
          'T - Temperature: Ice on face/neck',
          'I - Intense exercise: Sprint, jump',
          'P - Paced breathing: Long exhales',
          'P - Paired muscle relaxation: Tense & release',
          'Do all four in sequence',
        ],
      },
      {
        name: 'Call Someone',
        description: 'You don\'t have to do this alone',
        duration: 'As needed',
        instructions: [
          'Call a friend, family member, or crisis line',
          '988 - Suicide & Crisis Lifeline (24/7)',
          'Text HOME to 741741 (Crisis Text Line)',
          'Go to your local emergency room if needed',
        ],
      },
      {
        name: 'Change Environment',
        description: 'Physical reset',
        duration: '5+ min',
        instructions: [
          'Leave the room or building if safe',
          'Go somewhere with different stimuli',
          'Change temperature (go outside)',
          'Be around other people if possible',
        ],
      },
    ],
  },
];

interface GroundingLadderProps {
  onClose?: () => void;
}

export default function GroundingLadder({ onClose }: GroundingLadderProps) {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(null);

  const currentLevel = GROUNDING_LADDER.find((l) => l.level === selectedLevel)!;

  const handleLevelSelect = (level: number) => {
    setSelectedLevel(level);
    setExpandedTechnique(null);
    if (Platform.OS !== 'web') {
      Vibration.vibrate(20);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Grounding Ladder</Text>
          <Text style={styles.subtitle}>Escalate when needed</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Ladder visualization */}
      <View style={styles.ladderContainer}>
        {GROUNDING_LADDER.map((level) => (
          <TouchableOpacity
            key={level.level}
            style={[
              styles.ladderRung,
              { borderColor: level.color },
              selectedLevel === level.level && { backgroundColor: level.color + '20' },
            ]}
            onPress={() => handleLevelSelect(level.level)}
          >
            <View style={[styles.levelBadge, { backgroundColor: level.color }]}>
              <Text style={styles.levelNumber}>{level.level}</Text>
            </View>
            <Text style={styles.levelEmoji}>{level.emoji}</Text>
            <Text style={[styles.levelName, { color: level.color }]}>{level.name}</Text>
            {selectedLevel === level.level && (
              <Ionicons name="chevron-forward" size={18} color={level.color} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Current level techniques */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.levelHeader, { borderLeftColor: currentLevel.color }]}>
          <Text style={styles.levelHeaderEmoji}>{currentLevel.emoji}</Text>
          <View style={styles.levelHeaderText}>
            <Text style={[styles.levelHeaderTitle, { color: currentLevel.color }]}>
              Level {currentLevel.level}: {currentLevel.name}
            </Text>
            <Text style={styles.levelHeaderDescription}>{currentLevel.description}</Text>
          </View>
        </View>

        {currentLevel.techniques.map((technique, index) => (
          <TouchableOpacity
            key={index}
            style={styles.techniqueCard}
            onPress={() => setExpandedTechnique(
              expandedTechnique === technique.name ? null : technique.name
            )}
            activeOpacity={0.7}
          >
            <View style={styles.techniqueHeader}>
              <View style={styles.techniqueInfo}>
                <Text style={styles.techniqueName}>{technique.name}</Text>
                <Text style={styles.techniqueDescription}>{technique.description}</Text>
              </View>
              <View style={styles.techniqueMeta}>
                <Text style={styles.techniqueDuration}>{technique.duration}</Text>
                <Ionicons
                  name={expandedTechnique === technique.name ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#94A3B8"
                />
              </View>
            </View>

            {expandedTechnique === technique.name && (
              <View style={styles.techniqueInstructions}>
                {technique.instructions.map((instruction, idx) => (
                  <View key={idx} style={styles.instructionRow}>
                    <View style={[styles.instructionDot, { backgroundColor: currentLevel.color }]} />
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Escalation hint */}
        <View style={styles.hintBox}>
          <Ionicons name="arrow-up" size={16} color="#6366F1" />
          <Text style={styles.hintText}>
            If the current level isn't helping after 5-10 minutes, move up to the next level.
            It's okay to skip levels if you need stronger techniques right away.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  ladderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  ladderRung: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  levelBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  levelEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  levelName: {
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  levelHeaderEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  levelHeaderText: {
    flex: 1,
  },
  levelHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  levelHeaderDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  techniqueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  techniqueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  techniqueInfo: {
    flex: 1,
  },
  techniqueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  techniqueDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  techniqueMeta: {
    alignItems: 'flex-end',
  },
  techniqueDuration: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  techniqueInstructions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  instructionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#4338CA',
    marginLeft: 8,
    lineHeight: 18,
  },
});
