/**
 * Kaleidoscope
 *
 * Mesmerizing symmetrical drawing experience.
 * Draw and watch your patterns multiply in kaleidoscopic beauty.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Vibration,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Drawing colors
const COLORS = [
  '#FF6B6B',
  '#FFE66D',
  '#4ECDC4',
  '#95E1D3',
  '#DDA0DD',
  '#87CEEB',
  '#FFA07A',
  '#98FB98',
];

// Symmetry modes
const SYMMETRY_MODES = {
  4: { name: '4-fold', segments: 4 },
  6: { name: '6-fold', segments: 6 },
  8: { name: '8-fold', segments: 8 },
  12: { name: '12-fold', segments: 12 },
};

type SymmetryMode = keyof typeof SYMMETRY_MODES;

interface DrawPoint {
  x: number;
  y: number;
  color: string;
  size: number;
}

interface KaleidoscopeProps {
  onClose?: () => void;
}

export default function Kaleidoscope({ onClose }: KaleidoscopeProps) {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const canvasSize = Math.min(screenWidth - 32, screenHeight - 300);
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;

  const [symmetry, setSymmetry] = useState<SymmetryMode>(6);
  const [brushColor, setBrushColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(8);
  const [points, setPoints] = useState<DrawPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rainbowMode, setRainbowMode] = useState(false);

  const rainbowIndexRef = useRef(0);

  // Get symmetrical points
  const getSymmetricalPoints = useCallback(
    (x: number, y: number, color: string, size: number): DrawPoint[] => {
      const result: DrawPoint[] = [];
      const segments = SYMMETRY_MODES[symmetry].segments;
      const angleStep = (2 * Math.PI) / segments;

      // Convert to polar coordinates relative to center
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      for (let i = 0; i < segments; i++) {
        const newAngle = angle + i * angleStep;
        const newX = centerX + distance * Math.cos(newAngle);
        const newY = centerY + distance * Math.sin(newAngle);
        result.push({ x: newX, y: newY, color, size });

        // Add mirrored point for each segment
        const mirrorAngle = -angle + i * angleStep;
        const mirrorX = centerX + distance * Math.cos(mirrorAngle);
        const mirrorY = centerY + distance * Math.sin(mirrorAngle);
        result.push({ x: mirrorX, y: mirrorY, color, size });
      }

      return result;
    },
    [symmetry, centerX, centerY]
  );

  // Get rainbow color
  const getRainbowColor = useCallback(() => {
    const color = COLORS[rainbowIndexRef.current % COLORS.length];
    rainbowIndexRef.current++;
    return color;
  }, []);

  // Draw point
  const drawPoint = useCallback(
    (x: number, y: number) => {
      const color = rainbowMode ? getRainbowColor() : brushColor;
      const symmetricalPoints = getSymmetricalPoints(x, y, color, brushSize);
      setPoints((prev) => [...prev, ...symmetricalPoints]);
    },
    [rainbowMode, getRainbowColor, brushColor, brushSize, getSymmetricalPoints]
  );

  // Pan responder for drawing
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDrawing(true);
        const { locationX, locationY } = evt.nativeEvent;
        drawPoint(locationX, locationY);
        if (Platform.OS !== 'web') {
          Vibration.vibrate(5);
        }
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        drawPoint(locationX, locationY);
      },
      onPanResponderRelease: () => {
        setIsDrawing(false);
      },
    })
  ).current;

  // Clear canvas
  const clearCanvas = useCallback(() => {
    setPoints([]);
    if (Platform.OS !== 'web') {
      Vibration.vibrate(30);
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Kaleidoscope</Text>
          <Text style={styles.subtitle}>Draw symmetrical patterns</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Symmetry selector */}
      <View style={styles.symmetryContainer}>
        {(Object.keys(SYMMETRY_MODES) as unknown as SymmetryMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.symmetryButton,
              symmetry === mode && styles.symmetryButtonActive,
            ]}
            onPress={() => setSymmetry(mode as SymmetryMode)}
          >
            <Text
              style={[
                styles.symmetryText,
                symmetry === mode && styles.symmetryTextActive,
              ]}
            >
              {SYMMETRY_MODES[mode as SymmetryMode].name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Canvas */}
      <View
        style={[
          styles.canvas,
          { width: canvasSize, height: canvasSize, borderRadius: canvasSize / 2 },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Center guide */}
        <View style={[styles.centerDot, { left: centerX - 4, top: centerY - 4 }]} />

        {/* Segment guides */}
        {[...Array(SYMMETRY_MODES[symmetry].segments)].map((_, i) => {
          const angle = (i * 2 * Math.PI) / SYMMETRY_MODES[symmetry].segments;
          return (
            <View
              key={i}
              style={[
                styles.segmentLine,
                {
                  left: centerX,
                  top: centerY,
                  width: canvasSize / 2,
                  transform: [
                    { translateX: 0 },
                    { translateY: -0.5 },
                    { rotate: `${angle}rad` },
                  ],
                  transformOrigin: 'left center',
                },
              ]}
            />
          );
        })}

        {/* Drawn points */}
        {points.map((point, index) => (
          <View
            key={index}
            style={[
              styles.point,
              {
                left: point.x - point.size / 2,
                top: point.y - point.size / 2,
                width: point.size,
                height: point.size,
                borderRadius: point.size / 2,
                backgroundColor: point.color,
              },
            ]}
          />
        ))}

        {/* Empty state */}
        {points.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Draw with your finger</Text>
          </View>
        )}
      </View>

      {/* Color palette */}
      <View style={styles.paletteContainer}>
        {COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorButton,
              { backgroundColor: color },
              brushColor === color && !rainbowMode && styles.colorButtonActive,
            ]}
            onPress={() => {
              setBrushColor(color);
              setRainbowMode(false);
            }}
          />
        ))}
        <TouchableOpacity
          style={[
            styles.rainbowButton,
            rainbowMode && styles.rainbowButtonActive,
          ]}
          onPress={() => setRainbowMode(!rainbowMode)}
        >
          <Text style={styles.rainbowText}>🌈</Text>
        </TouchableOpacity>
      </View>

      {/* Brush size */}
      <View style={styles.brushContainer}>
        <Text style={styles.brushLabel}>Brush Size:</Text>
        <View style={styles.brushSizes}>
          {[4, 8, 12, 20].map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.brushSizeButton,
                brushSize === size && styles.brushSizeActive,
              ]}
              onPress={() => setBrushSize(size)}
            >
              <View
                style={[
                  styles.brushPreview,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Clear button */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.clearButton} onPress={clearCanvas}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={styles.clearText}>Clear Canvas</Text>
        </TouchableOpacity>

        <Text style={styles.pointCount}>{points.length} points</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  symmetryContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  symmetryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    marginHorizontal: 4,
  },
  symmetryButtonActive: {
    backgroundColor: '#6366F1',
  },
  symmetryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  symmetryTextActive: {
    color: '#fff',
  },
  canvas: {
    backgroundColor: '#1E293B',
    position: 'relative',
    overflow: 'hidden',
    marginVertical: 16,
  },
  centerDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  segmentLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  point: {
    position: 'absolute',
  },
  emptyState: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#475569',
  },
  paletteContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: '#fff',
  },
  rainbowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rainbowButtonActive: {
    borderColor: '#fff',
  },
  rainbowText: {
    fontSize: 16,
  },
  brushContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  brushLabel: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 12,
  },
  brushSizes: {
    flexDirection: 'row',
  },
  brushSizeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  brushSizeActive: {
    backgroundColor: '#334155',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  brushPreview: {
    backgroundColor: '#fff',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  clearText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 6,
    fontWeight: '600',
  },
  pointCount: {
    fontSize: 14,
    color: '#64748B',
  },
});
