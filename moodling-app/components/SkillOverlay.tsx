/**
 * SkillOverlay - Transparent overlay for displaying skills during coach chat
 *
 * Features:
 * - Semi-transparent background so chat is still visible
 * - Can display any skill component (BreathingOrb, grounding, etc.)
 * - Close button to dismiss
 * - Coach can guide while skill is active
 *
 * Usage:
 * <SkillOverlay
 *   visible={true}
 *   skillId="breathing_orb"
 *   onClose={() => setShowOverlay(false)}
 * />
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  useColorScheme,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { BreathingBall, BreathingPattern } from '@/components/BreathingBall';

// Map skill IDs to their configurations
export interface SkillConfig {
  id: string;
  name: string;
  emoji: string;
  component: 'breathing_orb' | 'grounding' | 'body_scan' | 'custom';
  breathingPattern?: BreathingPattern;
  instructions?: string;
}

export const OVERLAY_SKILLS: Record<string, SkillConfig> = {
  // Breathing skills
  breathing_orb: {
    id: 'breathing_orb',
    name: 'Breathing Exercise',
    emoji: '🫧',
    component: 'breathing_orb',
    breathingPattern: 'box',
    instructions: 'Follow the orb. Breathe in as it grows, out as it shrinks.',
  },
  box_breathing: {
    id: 'box_breathing',
    name: 'Box Breathing',
    emoji: '🔲',
    component: 'breathing_orb',
    breathingPattern: 'box',
    instructions: 'Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat.',
  },
  '478_breathing': {
    id: '478_breathing',
    name: '4-7-8 Breathing',
    emoji: '😴',
    component: 'breathing_orb',
    breathingPattern: '478',
    instructions: 'Inhale 4s, hold 7s, exhale 8s. Great for sleep.',
  },
  physiological_sigh: {
    id: 'physiological_sigh',
    name: 'Physiological Sigh',
    emoji: '💨',
    component: 'breathing_orb',
    breathingPattern: 'sigh',
    instructions: 'Double inhale through nose, long exhale through mouth.',
  },
  calm_breathing: {
    id: 'calm_breathing',
    name: 'Calm Breathing',
    emoji: '🌊',
    component: 'breathing_orb',
    breathingPattern: 'calm',
    instructions: 'Slow, gentle breaths. Let your body relax.',
  },
};

// Parse AI response for skill triggers
// Format: [OPEN_SKILL:skill_id] or [SKILL:skill_id]
export function parseSkillTrigger(text: string): { skillId: string | null; cleanText: string } {
  const skillRegex = /\[(?:OPEN_)?SKILL:(\w+)\]/gi;
  const match = skillRegex.exec(text);

  if (match) {
    const skillId = match[1].toLowerCase();
    const cleanText = text.replace(skillRegex, '').trim();
    return { skillId, cleanText };
  }

  return { skillId: null, cleanText: text };
}

// Check if a skill ID is valid for overlay
export function isOverlaySkill(skillId: string): boolean {
  return skillId in OVERLAY_SKILLS;
}

interface SkillOverlayProps {
  visible: boolean;
  skillId: string;
  onClose: () => void;
  coachMessage?: string; // Optional message from coach to show alongside
}

export function SkillOverlay({ visible, skillId, onClose, coachMessage }: SkillOverlayProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const skill = OVERLAY_SKILLS[skillId];

  if (!skill) {
    return null;
  }

  const renderSkillComponent = () => {
    switch (skill.component) {
      case 'breathing_orb':
        return (
          <View style={styles.breathingContainer}>
            <BreathingBall
              pattern={skill.breathingPattern || 'box'}
              size={Math.min(Dimensions.get('window').width * 0.6, 200)}
              autoStart={true}
              showLabel={true}
            />
          </View>
        );

      case 'grounding':
        // TODO: Add grounding component
        return (
          <View style={styles.placeholderContainer}>
            <Text style={[styles.placeholderText, { color: colors.text }]}>
              Grounding exercise coming soon
            </Text>
          </View>
        );

      case 'body_scan':
        // TODO: Add body scan component
        return (
          <View style={styles.placeholderContainer}>
            <Text style={[styles.placeholderText, { color: colors.text }]}>
              Body scan coming soon
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Semi-transparent backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Skill content */}
        <View style={[styles.content, { backgroundColor: colors.card + 'F5' }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.skillEmoji}>{skill.emoji}</Text>
              <Text style={[styles.skillName, { color: colors.text }]}>
                {skill.name}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.border }]}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          {skill.instructions && (
            <Text style={[styles.instructions, { color: colors.textSecondary }]}>
              {skill.instructions}
            </Text>
          )}

          {/* Coach message if provided */}
          {coachMessage && (
            <View style={[styles.coachMessage, { backgroundColor: colors.background }]}>
              <Text style={[styles.coachMessageText, { color: colors.text }]}>
                {coachMessage}
              </Text>
            </View>
          )}

          {/* Skill component */}
          <View style={styles.skillContent}>
            {renderSkillComponent()}
          </View>

          {/* Done button */}
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: colors.tint }]}
            onPress={onClose}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skillEmoji: {
    fontSize: 28,
  },
  skillName: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructions: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  coachMessage: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  coachMessageText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  skillContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    marginBottom: 16,
  },
  breathingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
  },
  doneButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SkillOverlay;
