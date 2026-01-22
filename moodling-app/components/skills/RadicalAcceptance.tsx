/**
 * Radical Acceptance
 *
 * DBT skill for accepting painful realities without judgment.
 * Reduces suffering by stopping the fight against what is.
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

interface RadicalAcceptanceProps {
  onClose?: () => void;
}

export default function RadicalAcceptance({ onClose }: RadicalAcceptanceProps) {
  const [activeSection, setActiveSection] = useState<'what' | 'how' | 'practice'>('what');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Radical Acceptance</Text>
          <Text style={styles.subtitle}>Accept reality as it is</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeSection === 'what' && styles.tabActive]}
          onPress={() => setActiveSection('what')}
        >
          <Text style={[styles.tabText, activeSection === 'what' && styles.tabTextActive]}>
            What It Is
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeSection === 'how' && styles.tabActive]}
          onPress={() => setActiveSection('how')}
        >
          <Text style={[styles.tabText, activeSection === 'how' && styles.tabTextActive]}>
            How To
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeSection === 'practice' && styles.tabActive]}
          onPress={() => setActiveSection('practice')}
        >
          <Text style={[styles.tabText, activeSection === 'practice' && styles.tabTextActive]}>
            Practice
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeSection === 'what' && (
          <>
            {/* Core concept */}
            <View style={styles.quoteCard}>
              <Text style={styles.quoteText}>
                "Pain is inevitable. Suffering is optional."
              </Text>
              <Text style={styles.quoteAttribution}>— Buddhist saying</Text>
            </View>

            <View style={styles.explanationCard}>
              <Text style={styles.explanationTitle}>What is Radical Acceptance?</Text>
              <Text style={styles.explanationText}>
                Radical acceptance means fully accepting reality as it is, right now,
                without fighting it, denying it, or wishing it were different.
              </Text>
              <Text style={styles.explanationText}>
                It's not approval or giving up. It's acknowledging what IS so you can
                respond effectively rather than being stuck in suffering.
              </Text>
            </View>

            {/* Pain vs Suffering */}
            <View style={styles.comparisonCard}>
              <View style={styles.comparisonColumn}>
                <Text style={styles.comparisonTitle}>Pain</Text>
                <Text style={styles.comparisonEmoji}>😔</Text>
                <Text style={styles.comparisonDesc}>
                  The natural response to difficult events. Can't be avoided.
                </Text>
              </View>
              <View style={styles.comparisonDivider}>
                <Text style={styles.plusSign}>+</Text>
              </View>
              <View style={styles.comparisonColumn}>
                <Text style={styles.comparisonTitle}>Non-Acceptance</Text>
                <Text style={styles.comparisonEmoji}>❌</Text>
                <Text style={styles.comparisonDesc}>
                  Fighting reality, saying "this shouldn't be happening"
                </Text>
              </View>
              <View style={styles.comparisonDivider}>
                <Text style={styles.equalsSign}>=</Text>
              </View>
              <View style={styles.comparisonColumn}>
                <Text style={[styles.comparisonTitle, styles.sufferingTitle]}>Suffering</Text>
                <Text style={styles.comparisonEmoji}>😭</Text>
                <Text style={styles.comparisonDesc}>
                  Prolonged, intense pain. This CAN be reduced.
                </Text>
              </View>
            </View>

            {/* What it's not */}
            <View style={styles.notCard}>
              <Text style={styles.notTitle}>What Radical Acceptance is NOT:</Text>
              <View style={styles.notRow}>
                <Ionicons name="close-circle" size={16} color="#EF4444" />
                <Text style={styles.notText}>Approval or agreeing something is okay</Text>
              </View>
              <View style={styles.notRow}>
                <Ionicons name="close-circle" size={16} color="#EF4444" />
                <Text style={styles.notText}>Giving up or being passive</Text>
              </View>
              <View style={styles.notRow}>
                <Ionicons name="close-circle" size={16} color="#EF4444" />
                <Text style={styles.notText}>Saying you can't change things</Text>
              </View>
              <View style={styles.notRow}>
                <Ionicons name="close-circle" size={16} color="#EF4444" />
                <Text style={styles.notText}>Pretending you're not hurt</Text>
              </View>
            </View>
          </>
        )}

        {activeSection === 'how' && (
          <>
            <View style={styles.stepsCard}>
              <Text style={styles.stepsTitle}>Steps to Practice:</Text>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Observe that you're resisting</Text>
                  <Text style={styles.stepText}>
                    Notice thoughts like "this isn't fair," "why me," or "this shouldn't
                    be happening." Physical signs: tension, clenched jaw, tight chest.
                  </Text>
                </View>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Remind yourself of the reality</Text>
                  <Text style={styles.stepText}>
                    This moment is the result of millions of prior moments. Reality is
                    what it is, whether you accept it or not.
                  </Text>
                </View>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Consider the causes</Text>
                  <Text style={styles.stepText}>
                    Everything has causes. This doesn't mean it's okay - just that it
                    makes sense given all the factors that led to it.
                  </Text>
                </View>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Practice acceptance in your body</Text>
                  <Text style={styles.stepText}>
                    Relax your face, hands, and stomach. Let your body express
                    acceptance even if your mind is still struggling.
                  </Text>
                </View>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>5</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Allow disappointment and grief</Text>
                  <Text style={styles.stepText}>
                    Acceptance doesn't mean no sadness. You can accept AND grieve.
                    The grief is the pain; fighting it is the suffering.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.mantrasCard}>
              <Text style={styles.mantrasTitle}>Helpful phrases:</Text>
              <Text style={styles.mantra}>"It is what it is"</Text>
              <Text style={styles.mantra}>"This is the reality right now"</Text>
              <Text style={styles.mantra}>"Fighting this doesn't change it"</Text>
              <Text style={styles.mantra}>"I can accept this AND want it to change"</Text>
              <Text style={styles.mantra}>"The present moment is the result of many causes"</Text>
            </View>
          </>
        )}

        {activeSection === 'practice' && (
          <>
            <View style={styles.promptCard}>
              <Text style={styles.promptTitle}>Reflection Exercise</Text>
              <Text style={styles.promptText}>
                Think of something in your life right now that you're having trouble
                accepting. It could be something small or something significant.
              </Text>
            </View>

            <View style={styles.questionCard}>
              <Text style={styles.questionTitle}>Ask yourself:</Text>

              <View style={styles.question}>
                <Text style={styles.questionNumber}>1</Text>
                <Text style={styles.questionText}>
                  What is the reality I'm resisting? (State it factually, without judgment)
                </Text>
              </View>

              <View style={styles.question}>
                <Text style={styles.questionNumber}>2</Text>
                <Text style={styles.questionText}>
                  What suffering am I adding by not accepting it?
                </Text>
              </View>

              <View style={styles.question}>
                <Text style={styles.questionNumber}>3</Text>
                <Text style={styles.questionText}>
                  What led to this moment? (Consider all causes - yours and others')
                </Text>
              </View>

              <View style={styles.question}>
                <Text style={styles.questionNumber}>4</Text>
                <Text style={styles.questionText}>
                  If I accepted this reality, what would I do differently?
                </Text>
              </View>

              <View style={styles.question}>
                <Text style={styles.questionNumber}>5</Text>
                <Text style={styles.questionText}>
                  What can I actually control or change from here?
                </Text>
              </View>
            </View>

            <View style={styles.reminderCard}>
              <Ionicons name="heart" size={18} color="#EC4899" />
              <Text style={styles.reminderText}>
                Radical acceptance is a practice, not a one-time decision. You may
                need to accept the same thing over and over. That's okay. Each
                moment of acceptance reduces suffering in that moment.
              </Text>
            </View>
          </>
        )}
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  quoteCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
  },
  quoteAttribution: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 12,
  },
  explanationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  explanationText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 10,
  },
  comparisonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  comparisonColumn: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  sufferingTitle: {
    color: '#EF4444',
  },
  comparisonEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  comparisonDesc: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 14,
  },
  comparisonDivider: {
    paddingHorizontal: 4,
  },
  plusSign: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  equalsSign: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  notCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  notTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 12,
  },
  notRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notText: {
    fontSize: 13,
    color: '#991B1B',
    marginLeft: 8,
  },
  stepsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  mantrasCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  mantrasTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 12,
  },
  mantra: {
    fontSize: 14,
    color: '#065F46',
    fontStyle: 'italic',
    marginBottom: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#10B981',
  },
  promptCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4338CA',
    marginBottom: 8,
  },
  promptText: {
    fontSize: 14,
    color: '#4338CA',
    lineHeight: 20,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  question: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
    marginRight: 12,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FCE7F3',
    borderRadius: 16,
    padding: 16,
  },
  reminderText: {
    flex: 1,
    fontSize: 13,
    color: '#9D174D',
    marginLeft: 10,
    lineHeight: 18,
  },
});
