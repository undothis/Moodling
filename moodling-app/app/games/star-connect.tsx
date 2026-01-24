/**
 * Star Connect Game
 *
 * Slowly connect stars to make constellations.
 * Meditative drawing game with night sky pixel art aesthetic.
 *
 * Mental benefit: Meditative focus, completion satisfaction
 * Category: Relaxation
 * Difficulty: Gentle
 */

import React, { useState, useCallback, useRef } from 'react';
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
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';
import { recordGameSession } from '@/services/gamesService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = SCREEN_WIDTH - 32;
const STAR_RADIUS = 12;

interface Star {
  id: number;
  x: number;
  y: number;
  connected: boolean;
}

interface Connection {
  from: number;
  to: number;
}

interface Constellation {
  name: string;
  stars: { x: number; y: number }[];
  connections: [number, number][];
}

const CONSTELLATIONS: Constellation[] = [
  {
    name: 'Ursa Minor',
    stars: [
      { x: 0.5, y: 0.15 },  // Polaris
      { x: 0.55, y: 0.25 },
      { x: 0.45, y: 0.35 },
      { x: 0.55, y: 0.45 },
      { x: 0.65, y: 0.55 },
      { x: 0.75, y: 0.50 },
      { x: 0.60, y: 0.60 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6]],
  },
  {
    name: 'Cassiopeia',
    stars: [
      { x: 0.2, y: 0.3 },
      { x: 0.35, y: 0.2 },
      { x: 0.5, y: 0.35 },
      { x: 0.65, y: 0.2 },
      { x: 0.8, y: 0.3 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    name: 'Orion',
    stars: [
      { x: 0.35, y: 0.15 },  // Shoulder
      { x: 0.65, y: 0.15 },  // Shoulder
      { x: 0.3, y: 0.35 },   // Belt
      { x: 0.5, y: 0.35 },   // Belt
      { x: 0.7, y: 0.35 },   // Belt
      { x: 0.25, y: 0.55 },  // Knee
      { x: 0.75, y: 0.55 },  // Knee
      { x: 0.5, y: 0.70 },   // Foot
    ],
    connections: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [5, 7], [6, 7]],
  },
  {
    name: 'Big Dipper',
    stars: [
      { x: 0.2, y: 0.25 },
      { x: 0.3, y: 0.30 },
      { x: 0.4, y: 0.32 },
      { x: 0.5, y: 0.30 },
      { x: 0.60, y: 0.40 },
      { x: 0.75, y: 0.35 },
      { x: 0.80, y: 0.50 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [4, 6]],
  },
  {
    name: 'Leo',
    stars: [
      { x: 0.25, y: 0.20 },  // Head
      { x: 0.35, y: 0.15 },
      { x: 0.40, y: 0.30 },
      { x: 0.55, y: 0.35 },
      { x: 0.70, y: 0.40 },
      { x: 0.80, y: 0.55 },
      { x: 0.55, y: 0.55 },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [3, 6]],
  },
];

type GameState = 'playing' | 'complete';

export default function StarConnectGame() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [constellationIndex, setConstellationIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [selectedStar, setSelectedStar] = useState<number | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [startTime] = useState<Date>(new Date());

  const constellation = CONSTELLATIONS[constellationIndex];
  const stars: Star[] = constellation.stars.map((pos, index) => ({
    id: index,
    x: pos.x * CANVAS_SIZE,
    y: pos.y * CANVAS_SIZE,
    connected: connections.some(c => c.from === index || c.to === index),
  }));

  // Check if a connection exists
  const connectionExists = useCallback((from: number, to: number) => {
    return connections.some(
      c => (c.from === from && c.to === to) || (c.from === to && c.to === from)
    );
  }, [connections]);

  // Check if connection is valid (in the constellation definition)
  const isValidConnection = useCallback((from: number, to: number) => {
    return constellation.connections.some(
      ([a, b]) => (a === from && b === to) || (a === to && b === from)
    );
  }, [constellation]);

  // Handle star tap
  const handleStarTap = useCallback((starId: number) => {
    Vibration.vibrate(10);

    if (selectedStar === null) {
      // First star selected
      setSelectedStar(starId);
    } else if (selectedStar === starId) {
      // Deselect
      setSelectedStar(null);
    } else {
      // Try to connect
      if (isValidConnection(selectedStar, starId) && !connectionExists(selectedStar, starId)) {
        const newConnections = [...connections, { from: selectedStar, to: starId }];
        setConnections(newConnections);

        // Check if complete
        if (newConnections.length === constellation.connections.length) {
          setGameState('complete');
          Vibration.vibrate([0, 50, 100, 50]);

          // Record session
          const endTime = new Date();
          recordGameSession({
            gameId: 'star_connect',
            startedAt: startTime.toISOString(),
            endedAt: endTime.toISOString(),
            completedSuccessfully: true,
            duration: Math.floor((endTime.getTime() - startTime.getTime()) / 1000),
            score: constellationIndex + 1,
          });
        }
      }
      setSelectedStar(null);
    }
  }, [selectedStar, connections, constellation, connectionExists, isValidConnection, constellationIndex, startTime]);

  // Next constellation
  const nextConstellation = useCallback(() => {
    const nextIndex = (constellationIndex + 1) % CONSTELLATIONS.length;
    setConstellationIndex(nextIndex);
    setConnections([]);
    setSelectedStar(null);
    setGameState('playing');
  }, [constellationIndex]);

  // Reset current
  const resetConstellation = useCallback(() => {
    setConnections([]);
    setSelectedStar(null);
    setGameState('playing');
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0a0a1a' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Star Connect</Text>
        <TouchableOpacity style={styles.backButton} onPress={resetConstellation}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Constellation name */}
      <View style={styles.nameContainer}>
        <Text style={styles.constellationName}>{constellation.name}</Text>
        <Text style={styles.progressText}>
          {connections.length}/{constellation.connections.length} connections
        </Text>
      </View>

      {/* Star field */}
      <View style={styles.canvasContainer}>
        {/* Background stars (decorative) */}
        {Array.from({ length: 30 }).map((_, i) => (
          <View
            key={`bg-${i}`}
            style={[
              styles.backgroundStar,
              {
                left: Math.random() * CANVAS_SIZE,
                top: Math.random() * CANVAS_SIZE,
                opacity: 0.3 + Math.random() * 0.4,
                width: 2 + Math.random() * 2,
                height: 2 + Math.random() * 2,
              },
            ]}
          />
        ))}

        <Svg width={CANVAS_SIZE} height={CANVAS_SIZE}>
          {/* Connections */}
          {connections.map((conn, index) => {
            const fromStar = stars[conn.from];
            const toStar = stars[conn.to];
            return (
              <Line
                key={`conn-${index}`}
                x1={fromStar.x}
                y1={fromStar.y}
                x2={toStar.x}
                y2={toStar.y}
                stroke="#ffd700"
                strokeWidth={2}
                opacity={0.8}
              />
            );
          })}

          {/* Pending connection line */}
          {selectedStar !== null && (
            <G opacity={0.5}>
              {constellation.connections
                .filter(([a, b]) => a === selectedStar || b === selectedStar)
                .filter(([a, b]) => !connectionExists(a, b))
                .map(([a, b], i) => {
                  const targetId = a === selectedStar ? b : a;
                  const targetStar = stars[targetId];
                  const fromStar = stars[selectedStar];
                  return (
                    <Line
                      key={`hint-${i}`}
                      x1={fromStar.x}
                      y1={fromStar.y}
                      x2={targetStar.x}
                      y2={targetStar.y}
                      stroke="#ffd700"
                      strokeWidth={1}
                      strokeDasharray="5,5"
                    />
                  );
                })}
            </G>
          )}

          {/* Stars */}
          {stars.map((star) => (
            <G key={star.id}>
              {/* Glow */}
              <Circle
                cx={star.x}
                cy={star.y}
                r={STAR_RADIUS + 8}
                fill={
                  selectedStar === star.id
                    ? 'rgba(255, 215, 0, 0.3)'
                    : star.connected
                    ? 'rgba(255, 215, 0, 0.15)'
                    : 'rgba(255, 255, 255, 0.1)'
                }
              />
              {/* Star */}
              <Circle
                cx={star.x}
                cy={star.y}
                r={STAR_RADIUS}
                fill={
                  selectedStar === star.id
                    ? '#ffd700'
                    : star.connected
                    ? '#ffd700'
                    : '#fff'
                }
                onPress={() => handleStarTap(star.id)}
              />
            </G>
          ))}
        </Svg>
      </View>

      {/* Instructions or completion */}
      {gameState === 'playing' ? (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionText}>
            Tap stars to connect them and reveal the constellation.
            {'\n'}Take your time — there's no rush.
          </Text>
        </View>
      ) : (
        <View style={styles.completeContainer}>
          <Text style={styles.completeText}>
            {constellation.name} Complete!
          </Text>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextConstellation}
          >
            <Text style={styles.nextButtonText}>Next Constellation</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Constellation selector */}
      <View style={styles.selectorContainer}>
        {CONSTELLATIONS.map((c, i) => (
          <TouchableOpacity
            key={c.name}
            style={[
              styles.selectorDot,
              i === constellationIndex && styles.selectorDotActive,
            ]}
            onPress={() => {
              setConstellationIndex(i);
              setConnections([]);
              setSelectedStar(null);
              setGameState('playing');
            }}
          />
        ))}
      </View>
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
    color: '#fff',
  },
  nameContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  constellationName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffd700',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  canvasContainer: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    marginVertical: 16,
    overflow: 'hidden',
  },
  backgroundStar: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  instructionsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },
  completeContainer: {
    padding: 24,
    alignItems: 'center',
  },
  completeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffd700',
    marginBottom: 16,
  },
  nextButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffd700',
  },
  nextButtonText: {
    color: '#ffd700',
    fontSize: 16,
    fontWeight: '600',
  },
  selectorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  selectorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectorDotActive: {
    backgroundColor: '#ffd700',
  },
});
