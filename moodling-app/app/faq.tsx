/**
 * Full FAQ Screen
 *
 * Displays all FAQ content from UserGuideContent.ts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { FAQ_CONTENT, FAQItem } from '@/constants/UserGuideContent';

const CATEGORY_LABELS: Record<FAQItem['category'], { label: string; emoji: string }> = {
  basics: { label: 'Getting Started', emoji: '🌱' },
  guide: { label: 'Your AI Guide', emoji: '💬' },
  privacy: { label: 'Privacy & Security', emoji: '🔒' },
  features: { label: 'Features & Settings', emoji: '⚙️' },
};

const CATEGORY_ORDER: FAQItem['category'][] = ['basics', 'guide', 'privacy', 'features'];

export default function FAQScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const toggleQuestion = (index: number) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const renderCategory = (category: FAQItem['category']) => {
    const items = FAQ_CONTENT.filter(item => item.category === category);
    if (items.length === 0) return null;

    const { label, emoji } = CATEGORY_LABELS[category];

    return (
      <View key={category} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryEmoji}>{emoji}</Text>
          <Text style={[styles.categoryTitle, { color: colors.text }]}>{label}</Text>
        </View>

        {items.map((item, idx) => {
          const globalIndex = FAQ_CONTENT.indexOf(item);
          const isExpanded = expandedQuestions.has(globalIndex);

          return (
            <TouchableOpacity
              key={globalIndex}
              style={[styles.questionCard, { backgroundColor: colors.card }]}
              onPress={() => toggleQuestion(globalIndex)}
              activeOpacity={0.7}
            >
              <View style={styles.questionHeader}>
                <Text style={[styles.questionText, { color: colors.text }]}>
                  {item.question}
                </Text>
                <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
                  {isExpanded ? '−' : '+'}
                </Text>
              </View>

              {isExpanded && (
                <Text style={[styles.answerText, { color: colors.textSecondary }]}>
                  {item.answer}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.tint }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>FAQ</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Frequently asked questions about Mood Leaf. Tap any question to see the answer.
        </Text>

        {CATEGORY_ORDER.map(renderCategory)}
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 70,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  expandIcon: {
    fontSize: 18,
    fontWeight: '300',
    marginLeft: 8,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
});
