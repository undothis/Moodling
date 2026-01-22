/**
 * Window of Tolerance
 *
 * Helps users visualize where they are on the arousal spectrum.
 * Based on Dan Siegel's Window of Tolerance model.
 */

import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const WINDOW_LOG_KEY = 'mood_leaf_window_log';

type ZoneType = 'hyperarousal' | 'window' | 'hypoarousal';

interface ZoneInfo {
  type: ZoneType;
  name: string;
  emoji: string;
  color: string;
  description: string;
  signs: string[];
  strategies: string[];
}

const ZONES: ZoneInfo[] = [
  {
    type: 'hyperarousal',
    name: 'Hyperarousal',
    emoji: '⚡',
    color: '#EF4444',
    description: 'Fight/Flight Zone - Too much activation',
    signs: [
      'Racing thoughts',
      'Heart pounding',
      'Feeling panicked or overwhelmed',
      'Irritable, snappy, or reactive',
      'Difficulty sitting still',
      'Tension in body',
    ],
    strategies: [
      'Grounding (5-4-3-2-1)',
      'Long exhales (physiological sigh)',
      'Cold water on face',
      'Slow, deliberate movement',
      'Name what you\'re feeling',
    ],
  },
  {
    type: 'window',
    name: 'Window of Tolerance',
    emoji: '🌿',
    color: '#10B981',
    description: 'Optimal Zone - You can think and feel',
    signs: [
      'Able to think clearly',
      'Can feel emotions without being overwhelmed',
      'Present in the moment',
      'Can handle challenges',
      'Connected to yourself and others',
      'Flexible responses',
    ],
    strategies: [
      'Savor this - notice what it feels like',
      'Build awareness of what helps you stay here',
      'Practice skills when you\'re here (easier to learn)',
      'This is your home base',
    ],
  },
  {
    type: 'hypoarousal',
    name: 'Hypoarousal',
    emoji: '🥶',
    color: '#3B82F6',
    description: 'Freeze/Shutdown Zone - Too little activation',
    signs: [
      'Feeling numb or disconnected',
      'Foggy, can\'t think',
      'No energy, want to sleep',
      'Feeling hopeless or empty',
      'Dissociated or "not real"',
      'Collapsed posture',
    ],
    strategies: [
      'Movement (even small)',
      'Strong sensations (ice, sour candy)',
      'Orienting (look around, name objects)',
      'Stand up, stretch',
      'Splash cold water on face',
    ],
  },
];

interface LogEntry {
  timestamp: string;
  zone: ZoneType;
  notes?: string;
}

interface WindowOfToleranceProps {
  onClose?: () => void;
}

export default function WindowOfTolerance({ onClose }: WindowOfToleranceProps) {
  const [selectedZone, setSelectedZone] = useState<ZoneType>('window');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [showStrategies, setShowStrategies] = useState(false);

  // Load log
  useEffect(() => {
    AsyncStorage.getItem(WINDOW_LOG_KEY).then((stored) => {
      if (stored) {
        setLog(JSON.parse(stored));
      }
    });
  }, []);

  // Log current zone
  const logZone = async (zone: ZoneType) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      zone,
    };
    const updated = [entry, ...log].slice(0, 100);
    await AsyncStorage.setItem(WINDOW_LOG_KEY, JSON.stringify(updated));
    setLog(updated);
    setSelectedZone(zone);
    if (Platform.OS !== 'web') {
      Vibration.vibrate(30);
    }
    setShowStrategies(zone !== 'window');
  };

  const currentZone = ZONES.find((z) => z.type === selectedZone)!;

  // Calculate recent patterns
  const recentLogs = log.slice(0, 10);
  const zoneCount = {
    hyperarousal: recentLogs.filter((l) => l.zone === 'hyperarousal').length,
    window: recentLogs.filter((l) => l.zone === 'window').length,
    hypoarousal: recentLogs.filter((l) => l.zone === 'hypoarousal').length,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Window of Tolerance</Text>
          <Text style={styles.subtitle}>Where are you right now?</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Zone selector - visual representation */}
        <View style={styles.zoneVisual}>
          {ZONES.map((zone) => (
            <TouchableOpacity
              key={zone.type}
              style={[
                styles.zoneBar,
                { backgroundColor: zone.color + '20', borderColor: zone.color },
                selectedZone === zone.type && { backgroundColor: zone.color + '40' },
              ]}
              onPress={() => logZone(zone.type)}
            >
              <Text style={styles.zoneEmoji}>{zone.emoji}</Text>
              <Text style={[styles.zoneName, { color: zone.color }]}>{zone.name}</Text>
              {selectedZone === zone.type && (
                <View style={[styles.selectedIndicator, { backgroundColor: zone.color }]}>
                  <Ionicons name="location" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Instruction */}
        <Text style={styles.instruction}>
          Tap the zone that best describes how you feel right now
        </Text>

        {/* Current zone info */}
        <View style={[styles.zoneCard, { borderLeftColor: currentZone.color }]}>
          <View style={styles.zoneCardHeader}>
            <Text style={styles.zoneCardEmoji}>{currentZone.emoji}</Text>
            <View style={styles.zoneCardHeaderText}>
              <Text style={[styles.zoneCardTitle, { color: currentZone.color }]}>
                {currentZone.name}
              </Text>
              <Text style={styles.zoneCardDescription}>{currentZone.description}</Text>
            </View>
          </View>

          {/* Signs */}
          <View style={styles.signsSection}>
            <Text style={styles.sectionLabel}>Signs you might notice:</Text>
            {currentZone.signs.map((sign, index) => (
              <View key={index} style={styles.signRow}>
                <View style={[styles.signDot, { backgroundColor: currentZone.color }]} />
                <Text style={styles.signText}>{sign}</Text>
              </View>
            ))}
          </View>

          {/* Strategies (shown for non-window zones) */}
          {selectedZone !== 'window' && (
            <TouchableOpacity
              style={styles.strategiesToggle}
              onPress={() => setShowStrategies(!showStrategies)}
            >
              <Text style={[styles.strategiesToggleText, { color: currentZone.color }]}>
                {showStrategies ? 'Hide' : 'Show'} helpful strategies
              </Text>
              <Ionicons
                name={showStrategies ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={currentZone.color}
              />
            </TouchableOpacity>
          )}

          {showStrategies && selectedZone !== 'window' && (
            <View style={styles.strategiesSection}>
              <Text style={styles.sectionLabel}>Things that might help:</Text>
              {currentZone.strategies.map((strategy, index) => (
                <View key={index} style={styles.strategyRow}>
                  <Ionicons name="arrow-forward" size={14} color={currentZone.color} />
                  <Text style={styles.strategyText}>{strategy}</Text>
                </View>
              ))}
            </View>
          )}

          {selectedZone === 'window' && (
            <View style={styles.windowMessage}>
              <Text style={styles.windowMessageText}>
                You're in a good place right now. This is where healing and growth happen.
                Notice what helped you get here.
              </Text>
            </View>
          )}
        </View>

        {/* Recent patterns */}
        {log.length > 0 && (
          <View style={styles.patternsCard}>
            <Text style={styles.patternsTitle}>Your recent check-ins</Text>
            <View style={styles.patternsRow}>
              <View style={styles.patternItem}>
                <Text style={[styles.patternCount, { color: ZONES[0].color }]}>
                  {zoneCount.hyperarousal}
                </Text>
                <Text style={styles.patternLabel}>High</Text>
              </View>
              <View style={styles.patternItem}>
                <Text style={[styles.patternCount, { color: ZONES[1].color }]}>
                  {zoneCount.window}
                </Text>
                <Text style={styles.patternLabel}>Regulated</Text>
              </View>
              <View style={styles.patternItem}>
                <Text style={[styles.patternCount, { color: ZONES[2].color }]}>
                  {zoneCount.hypoarousal}
                </Text>
                <Text style={styles.patternLabel}>Low</Text>
              </View>
            </View>
            <Text style={styles.patternsNote}>
              Last {recentLogs.length} check-ins
            </Text>
          </View>
        )}

        {/* Educational note */}
        <View style={styles.eduCard}>
          <Text style={styles.eduTitle}>About the Window of Tolerance</Text>
          <Text style={styles.eduText}>
            Everyone has a "window" where they can handle life's challenges.
            Stress, trauma, or lack of sleep can shrink this window.
            Self-care, support, and practice can expand it.
          </Text>
          <Text style={styles.eduText}>
            There's no judgment about where you are - just noticing.
            Awareness itself is a skill that grows with practice.
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  zoneVisual: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  zoneBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
    position: 'relative',
  },
  zoneEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  selectedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instruction: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  zoneCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  zoneCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  zoneCardEmoji: {
    fontSize: 36,
    marginRight: 12,
  },
  zoneCardHeaderText: {
    flex: 1,
  },
  zoneCardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  zoneCardDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  signsSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  signRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  signDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  signText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  strategiesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  strategiesToggleText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  strategiesSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  strategyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  strategyText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    marginLeft: 8,
    lineHeight: 20,
  },
  windowMessage: {
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 10,
  },
  windowMessageText: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
    textAlign: 'center',
  },
  patternsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  patternsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  patternsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  patternItem: {
    alignItems: 'center',
  },
  patternCount: {
    fontSize: 28,
    fontWeight: '700',
  },
  patternLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  patternsNote: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  eduCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
  },
  eduTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  eduText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
    marginBottom: 8,
  },
});
