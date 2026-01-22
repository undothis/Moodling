/**
 * Untangle
 *
 * Relaxing puzzle game where you untangle connected nodes.
 * Drag nodes to eliminate all crossing lines.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Vibration,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATS_KEY = 'mood_leaf_untangle_stats';

// Difficulty levels
const DIFFICULTY = {
  easy: { nodes: 6, connections: 7, label: 'Easy' },
  medium: { nodes: 8, connections: 11, label: 'Medium' },
  hard: { nodes: 12, connections: 18, label: 'Hard' },
};

type DifficultyLevel = keyof typeof DIFFICULTY;

interface Node {
  id: number;
  x: number;
  y: number;
}

interface Connection {
  from: number;
  to: number;
}

interface UntangleProps {
  onClose?: () => void;
}

export default function Untangle({ onClose }: UntangleProps) {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const areaWidth = screenWidth - 32;
  const areaHeight = screenHeight - 320;

  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [crossings, setCrossings] = useState(0);
  const [moves, setMoves] = useState(0);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [draggingNode, setDraggingNode] = useState<number | null>(null);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  // Load stats
  useEffect(() => {
    AsyncStorage.getItem(STATS_KEY).then((stored) => {
      if (stored) {
        const stats = JSON.parse(stored);
        setPuzzlesSolved(stats.solved || 0);
      }
    });
  }, []);

  // Check if two line segments intersect
  const segmentsIntersect = useCallback(
    (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) => {
      const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
      if (Math.abs(denom) < 0.0001) return false;

      const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
      const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

      return ua > 0.01 && ua < 0.99 && ub > 0.01 && ub < 0.99;
    },
    []
  );

  // Count crossings
  const countCrossings = useCallback(
    (nodeList: Node[], connectionList: Connection[]) => {
      let count = 0;
      for (let i = 0; i < connectionList.length; i++) {
        for (let j = i + 1; j < connectionList.length; j++) {
          const c1 = connectionList[i];
          const c2 = connectionList[j];

          // Skip if they share a node
          if (c1.from === c2.from || c1.from === c2.to || c1.to === c2.from || c1.to === c2.to) {
            continue;
          }

          const n1 = nodeList.find((n) => n.id === c1.from)!;
          const n2 = nodeList.find((n) => n.id === c1.to)!;
          const n3 = nodeList.find((n) => n.id === c2.from)!;
          const n4 = nodeList.find((n) => n.id === c2.to)!;

          if (segmentsIntersect(n1.x, n1.y, n2.x, n2.y, n3.x, n3.y, n4.x, n4.y)) {
            count++;
          }
        }
      }
      return count;
    },
    [segmentsIntersect]
  );

  // Generate new puzzle
  const generatePuzzle = useCallback(() => {
    const config = DIFFICULTY[difficulty];
    const padding = 50;
    const newNodes: Node[] = [];
    const newConnections: Connection[] = [];

    // Create nodes in a solvable configuration (circle)
    for (let i = 0; i < config.nodes; i++) {
      const angle = (i / config.nodes) * 2 * Math.PI;
      const radius = Math.min(areaWidth, areaHeight) / 2 - padding;
      newNodes.push({
        id: i,
        x: areaWidth / 2 + radius * Math.cos(angle) * 0.8,
        y: areaHeight / 2 + radius * Math.sin(angle) * 0.8,
      });
    }

    // Create connections (ensure graph is connected and planar when arranged in circle)
    const connected = new Set<number>([0]);
    const edges = new Set<string>();

    // First, create a spanning tree
    for (let i = 1; i < config.nodes; i++) {
      const from = Array.from(connected)[Math.floor(Math.random() * connected.size)];
      newConnections.push({ from, to: i });
      edges.add(`${Math.min(from, i)}-${Math.max(from, i)}`);
      connected.add(i);
    }

    // Add more edges up to the target
    while (newConnections.length < config.connections) {
      const from = Math.floor(Math.random() * config.nodes);
      const to = Math.floor(Math.random() * config.nodes);
      const edgeKey = `${Math.min(from, to)}-${Math.max(from, to)}`;

      if (from !== to && !edges.has(edgeKey)) {
        newConnections.push({ from, to });
        edges.add(edgeKey);
      }
    }

    // Now scramble the nodes
    const scrambledNodes = newNodes.map((node) => ({
      ...node,
      x: padding + Math.random() * (areaWidth - padding * 2),
      y: padding + Math.random() * (areaHeight - padding * 2),
    }));

    setNodes(scrambledNodes);
    setConnections(newConnections);
    setMoves(0);
    setIsSolved(false);

    const initialCrossings = countCrossings(scrambledNodes, newConnections);
    setCrossings(initialCrossings);
  }, [difficulty, areaWidth, areaHeight, countCrossings]);

  // Initialize puzzle
  useEffect(() => {
    generatePuzzle();
  }, [difficulty]); // Regenerate when difficulty changes

  // Update crossings when nodes change
  useEffect(() => {
    if (nodes.length > 0 && connections.length > 0) {
      const newCrossings = countCrossings(nodes, connections);
      setCrossings(newCrossings);

      if (newCrossings === 0 && !isSolved && moves > 0) {
        setIsSolved(true);
        setPuzzlesSolved((s) => {
          const newCount = s + 1;
          AsyncStorage.setItem(STATS_KEY, JSON.stringify({ solved: newCount }));
          return newCount;
        });
        if (Platform.OS !== 'web') {
          Vibration.vibrate([0, 50, 100, 50]);
        }
      }
    }
  }, [nodes, connections, countCrossings, isSolved, moves]);

  // Handle drag
  const handleDrag = useCallback(
    (event: GestureResponderEvent, nodeId: number) => {
      const { locationX, locationY } = event.nativeEvent;

      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                x: Math.max(20, Math.min(areaWidth - 20, locationX)),
                y: Math.max(20, Math.min(areaHeight - 20, locationY)),
              }
            : n
        )
      );
    },
    [areaWidth, areaHeight]
  );

  // Check if line crosses
  const isLineCrossing = useCallback(
    (conn: Connection) => {
      for (const other of connections) {
        if (conn === other) continue;
        if (conn.from === other.from || conn.from === other.to || conn.to === other.from || conn.to === other.to) continue;

        const n1 = nodes.find((n) => n.id === conn.from);
        const n2 = nodes.find((n) => n.id === conn.to);
        const n3 = nodes.find((n) => n.id === other.from);
        const n4 = nodes.find((n) => n.id === other.to);

        if (n1 && n2 && n3 && n4 && segmentsIntersect(n1.x, n1.y, n2.x, n2.y, n3.x, n3.y, n4.x, n4.y)) {
          return true;
        }
      }
      return false;
    },
    [connections, nodes, segmentsIntersect]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Untangle</Text>
          <Text style={styles.subtitle}>{puzzlesSolved} puzzles solved</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Ionicons
            name={crossings === 0 ? 'checkmark-circle' : 'alert-circle'}
            size={18}
            color={crossings === 0 ? '#10B981' : '#EF4444'}
          />
          <Text style={[styles.statValue, crossings === 0 && styles.statValueSolved]}>
            {crossings} crossings
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="move" size={18} color="#64748B" />
          <Text style={styles.statValue}>{moves} moves</Text>
        </View>
      </View>

      {/* Difficulty selector */}
      <View style={styles.difficultyContainer}>
        {(Object.keys(DIFFICULTY) as DifficultyLevel[]).map((level) => (
          <TouchableOpacity
            key={level}
            style={[styles.difficultyButton, difficulty === level && styles.difficultyButtonActive]}
            onPress={() => setDifficulty(level)}
          >
            <Text style={[styles.difficultyText, difficulty === level && styles.difficultyTextActive]}>
              {DIFFICULTY[level].label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Puzzle area */}
      <View style={[styles.puzzleArea, { width: areaWidth, height: areaHeight }]}>
        {/* Connections */}
        <View style={styles.connectionsLayer}>
          {connections.map((conn, idx) => {
            const fromNode = nodes.find((n) => n.id === conn.from);
            const toNode = nodes.find((n) => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            const crossing = isLineCrossing(conn);
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            return (
              <View
                key={idx}
                style={[
                  styles.connection,
                  {
                    left: fromNode.x,
                    top: fromNode.y,
                    width: length,
                    transform: [{ rotate: `${angle}rad` }],
                    backgroundColor: crossing ? '#EF4444' : '#10B981',
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Nodes */}
        {nodes.map((node) => (
          <View
            key={node.id}
            style={[
              styles.node,
              {
                left: node.x - 18,
                top: node.y - 18,
              },
              draggingNode === node.id && styles.nodeDragging,
            ]}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={() => {
              setDraggingNode(node.id);
              if (Platform.OS !== 'web') {
                Vibration.vibrate(10);
              }
            }}
            onResponderMove={(e) => handleDrag(e, node.id)}
            onResponderRelease={() => {
              setDraggingNode(null);
              setMoves((m) => m + 1);
            }}
          >
            <View style={styles.nodeInner} />
          </View>
        ))}

        {/* Solved overlay */}
        {isSolved && (
          <View style={styles.solvedOverlay}>
            <Text style={styles.solvedEmoji}>🎉</Text>
            <Text style={styles.solvedText}>Untangled!</Text>
            <Text style={styles.solvedMoves}>Completed in {moves} moves</Text>
            <TouchableOpacity style={styles.nextButton} onPress={generatePuzzle}>
              <Text style={styles.nextButtonText}>Next Puzzle</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.newPuzzleButton} onPress={generatePuzzle}>
          <Ionicons name="refresh" size={20} color="#6366F1" />
          <Text style={styles.newPuzzleText}>New Puzzle</Text>
        </TouchableOpacity>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipText}>
          💡 Drag nodes to eliminate all red crossing lines
        </Text>
      </View>
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
    paddingBottom: 8,
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
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  statValueSolved: {
    color: '#10B981',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  difficultyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 4,
  },
  difficultyButtonActive: {
    backgroundColor: '#6366F1',
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  difficultyTextActive: {
    color: '#fff',
  },
  puzzleArea: {
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  connectionsLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  connection: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
    transformOrigin: 'left center',
  },
  node: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  nodeDragging: {
    transform: [{ scale: 1.2 }],
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  nodeInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  solvedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  solvedEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  solvedText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  solvedMoves: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  controlsContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  newPuzzleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#EEF2FF',
  },
  newPuzzleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginLeft: 8,
  },
  tipsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
  },
  tipText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
});
