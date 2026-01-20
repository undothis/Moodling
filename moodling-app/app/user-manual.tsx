/**
 * Full User Manual Screen
 *
 * Displays comprehensive guide content from UserGuideContent.ts
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
import { USER_MANUAL_CONTENT, ManualSection } from '@/constants/UserGuideContent';

export default function UserManualScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['introduction']));

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderSection = (section: ManualSection) => {
    const isExpanded = expandedSections.has(section.id);

    return (
      <View key={section.id} style={[styles.section, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(section.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionEmoji}>{section.emoji}</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {section.title}
          </Text>
          <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
            {isExpanded ? '−' : '+'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
              {section.content}
            </Text>

            {section.subsections?.map((sub, index) => (
              <View key={index} style={styles.subsection}>
                <Text style={[styles.subsectionTitle, { color: colors.tint }]}>
                  {sub.title}
                </Text>
                <Text style={[styles.subsectionText, { color: colors.textSecondary }]}>
                  {sub.content}
                </Text>
              </View>
            ))}
          </View>
        )}
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>User Manual</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Everything you need to know about Mood Leaf. Tap any section to expand.
        </Text>

        {USER_MANUAL_CONTENT.map(renderSection)}
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
    gap: 12,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  section: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sectionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 20,
    fontWeight: '300',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  subsection: {
    marginTop: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subsectionText: {
    fontSize: 14,
    lineHeight: 21,
  },
});
