/**
 * Opposite Action
 *
 * DBT skill for changing emotions by acting opposite to the urge.
 * Helps when emotions aren't fitting the facts or aren't helpful.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmotionData {
  id: string;
  name: string;
  emoji: string;
  color: string;
  urges: string[];
  oppositeActions: string[];
  whenToUse: string;
}

const EMOTIONS: EmotionData[] = [
  {
    id: 'fear',
    name: 'Fear / Anxiety',
    emoji: '😰',
    color: '#8B5CF6',
    urges: [
      'Avoid the situation',
      'Run away',
      'Hide',
      'Seek constant reassurance',
      'Over-prepare',
    ],
    oppositeActions: [
      'Approach what you\'re avoiding (gradually)',
      'Stay in the situation',
      'Drop safety behaviors',
      'Act confident (even if you don\'t feel it)',
      'Do it anyway, without over-preparing',
    ],
    whenToUse: 'When the fear isn\'t fitting the facts - the situation isn\'t actually dangerous, or the fear is way bigger than the actual risk.',
  },
  {
    id: 'sadness',
    name: 'Sadness / Depression',
    emoji: '😢',
    color: '#3B82F6',
    urges: [
      'Withdraw and isolate',
      'Stay in bed',
      'Avoid activities',
      'Ruminate on sad thoughts',
      'Act passive',
    ],
    oppositeActions: [
      'Be around others, even briefly',
      'Get up and move',
      'Do something active or engaging',
      'Focus on present moment, not sad past',
      'Act energetic (fake it till you make it)',
    ],
    whenToUse: 'When the sadness is prolonged, not fitting current facts, or keeping you stuck. (Note: Grief has its own timeline - this isn\'t about rushing through loss.)',
  },
  {
    id: 'anger',
    name: 'Anger',
    emoji: '😠',
    color: '#EF4444',
    urges: [
      'Attack (verbal or physical)',
      'Criticize or blame',
      'Yell or raise voice',
      'Seek revenge',
      'Tense up, clench fists',
    ],
    oppositeActions: [
      'Gently avoid the person (take a break)',
      'Speak softly and slowly',
      'Find something to empathize with',
      'Do something kind for the person',
      'Relax your face and hands',
    ],
    whenToUse: 'When your anger is bigger than the situation warrants, or when acting on it would make things worse.',
  },
  {
    id: 'shame',
    name: 'Shame / Guilt',
    emoji: '😳',
    color: '#F59E0B',
    urges: [
      'Hide, withdraw',
      'Avoid eye contact',
      'Apologize repeatedly',
      'Attack yourself',
      'Make yourself small',
    ],
    oppositeActions: [
      'Share what happened with someone safe',
      'Make eye contact',
      'Stop over-apologizing',
      'Talk to yourself kindly',
      'Stand tall, take up space',
    ],
    whenToUse: 'When the shame isn\'t justified - you didn\'t actually do anything wrong, or it\'s way out of proportion to what happened.',
  },
  {
    id: 'disgust',
    name: 'Disgust (at self)',
    emoji: '🤢',
    color: '#10B981',
    urges: [
      'Push away, reject yourself',
      'Punish yourself',
      'Avoid looking in mirror',
      'Isolate',
      'Engage in self-destructive behavior',
    ],
    oppositeActions: [
      'Move toward self-acceptance',
      'Treat yourself kindly',
      'Look at yourself with neutral eyes',
      'Connect with others',
      'Do something caring for your body',
    ],
    whenToUse: 'When the self-disgust isn\'t fitting facts - you\'re judging yourself too harshly based on unrealistic standards.',
  },
];

interface OppositeActionProps {
  onClose?: () => void;
}

export default function OppositeAction({ onClose }: OppositeActionProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionData | null>(null);

  if (selectedEmotion) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedEmotion(null)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#64748B" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{selectedEmotion.emoji} {selectedEmotion.name}</Text>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* When to use */}
          <View style={[styles.infoCard, { borderLeftColor: selectedEmotion.color }]}>
            <Text style={styles.infoTitle}>When to use opposite action:</Text>
            <Text style={styles.infoText}>{selectedEmotion.whenToUse}</Text>
          </View>

          {/* Urges */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>The urges you might feel:</Text>
            {selectedEmotion.urges.map((urge, index) => (
              <View key={index} style={styles.urgeRow}>
                <Ionicons name="arrow-forward" size={14} color="#94A3B8" />
                <Text style={styles.urgeText}>{urge}</Text>
              </View>
            ))}
          </View>

          {/* Opposite actions */}
          <View style={[styles.section, styles.oppositeSection]}>
            <Text style={[styles.sectionTitle, { color: selectedEmotion.color }]}>
              Try doing the opposite:
            </Text>
            {selectedEmotion.oppositeActions.map((action, index) => (
              <View key={index} style={styles.actionRow}>
                <View style={[styles.actionDot, { backgroundColor: selectedEmotion.color }]} />
                <Text style={styles.actionText}>{action}</Text>
              </View>
            ))}
          </View>

          {/* Important note */}
          <View style={styles.noteCard}>
            <Ionicons name="information-circle" size={18} color="#6366F1" />
            <View style={styles.noteContent}>
              <Text style={styles.noteTitle}>Important:</Text>
              <Text style={styles.noteText}>
                Opposite action works best when your emotion isn't fitting the facts,
                or when acting on the emotion would make things worse. If your emotion
                IS fitting the facts, it might be telling you something important -
                listen to it.
              </Text>
            </View>
          </View>

          {/* Go all the way */}
          <View style={styles.allWayCard}>
            <Text style={styles.allWayTitle}>Go "All the Way"</Text>
            <Text style={styles.allWayText}>
              Half-hearted opposite action doesn't work as well. If you're going to
              approach what you fear, really approach it. If you're going to act
              kindly despite anger, do it fully. Commit to the opposite action
              body and mind.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Opposite Action</Text>
          <Text style={styles.subtitle}>Change emotions by changing behavior</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Intro */}
      <View style={styles.introBox}>
        <Text style={styles.introText}>
          Sometimes our emotions push us to do things that make them stronger or
          make the situation worse. Opposite action means doing the opposite of
          what the emotion urges, which can help the emotion pass more quickly.
        </Text>
      </View>

      {/* Emotion selection */}
      <Text style={styles.selectPrompt}>Select the emotion you're experiencing:</Text>

      <ScrollView style={styles.emotionList}>
        {EMOTIONS.map((emotion) => (
          <TouchableOpacity
            key={emotion.id}
            style={styles.emotionCard}
            onPress={() => setSelectedEmotion(emotion)}
          >
            <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
            <View style={styles.emotionInfo}>
              <Text style={styles.emotionName}>{emotion.name}</Text>
              <Text style={styles.emotionPreview} numberOfLines={1}>
                Urges: {emotion.urges.slice(0, 2).join(', ')}...
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        ))}
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
  backButton: {
    padding: 8,
    marginRight: 8,
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
  introBox: {
    backgroundColor: '#EEF2FF',
    padding: 14,
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  introText: {
    fontSize: 14,
    color: '#4338CA',
    lineHeight: 20,
  },
  selectPrompt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  emotionList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emotionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emotionEmoji: {
    fontSize: 32,
    marginRight: 14,
  },
  emotionInfo: {
    flex: 1,
  },
  emotionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  emotionPreview: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  oppositeSection: {
    backgroundColor: '#F0FDF4',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  urgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  urgeText: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    marginRight: 10,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  noteContent: {
    flex: 1,
    marginLeft: 10,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4338CA',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 18,
  },
  allWayCard: {
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 12,
  },
  allWayTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 6,
  },
  allWayText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
});
