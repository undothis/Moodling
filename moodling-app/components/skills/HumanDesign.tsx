import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface HumanDesignType {
  id: string;
  name: string;
  emoji: string;
  percentage: string;
  strategy: string;
  signature: string;
  notSelf: string;
  description: string;
  strengths: string[];
  challenges: string[];
  tips: string[];
}

const HUMAN_DESIGN_TYPES: HumanDesignType[] = [
  {
    id: 'manifestor',
    name: 'Manifestor',
    emoji: '🔥',
    percentage: '~9%',
    strategy: 'Inform before acting',
    signature: 'Peace',
    notSelf: 'Anger',
    description: 'Manifestors are here to initiate and make things happen. They have a closed, repelling aura that gives them independence but can create resistance from others.',
    strengths: [
      'Natural initiators and trailblazers',
      'Independent and self-sufficient',
      'Can make things happen without waiting',
      'Powerful impact on others',
    ],
    challenges: [
      'May feel controlled or slowed down by others',
      'Can forget to inform and create resistance',
      'May struggle with anger when blocked',
      'Can feel isolated or misunderstood',
    ],
    tips: [
      'Inform others before taking action - it reduces resistance',
      'Honor your need for independence',
      'Rest when you need to - you work in bursts',
      'Your anger is a signal you\'re being controlled',
    ],
  },
  {
    id: 'generator',
    name: 'Generator',
    emoji: '⚡',
    percentage: '~37%',
    strategy: 'Wait to respond',
    signature: 'Satisfaction',
    notSelf: 'Frustration',
    description: 'Generators are the life force of the planet. They have sustainable energy when doing work they love, and their sacral response guides them to what\'s correct.',
    strengths: [
      'Sustainable, powerful life force energy',
      'Built-in guidance system (sacral response)',
      'Mastery through commitment',
      'Magnetic aura that attracts opportunities',
    ],
    challenges: [
      'May initiate instead of waiting to respond',
      'Can get stuck in unfulfilling work',
      'Frustration when not honored',
      'May ignore sacral "no" signals',
    ],
    tips: [
      'Wait for something to respond TO before acting',
      'Trust your gut response (uh-huh or uh-uh)',
      'Do work that lights you up',
      'Frustration means you\'re off track',
    ],
  },
  {
    id: 'manifesting_generator',
    name: 'Manifesting Generator',
    emoji: '⚡🔥',
    percentage: '~33%',
    strategy: 'Wait to respond, then inform',
    signature: 'Satisfaction',
    notSelf: 'Frustration & Anger',
    description: 'Manifesting Generators combine Generator life force with Manifestor initiating power. They\'re multi-passionate, fast-moving, and here to find shortcuts.',
    strengths: [
      'Incredible energy and speed',
      'Multi-passionate and versatile',
      'Find efficient shortcuts',
      'Can pivot and change direction quickly',
    ],
    challenges: [
      'May skip steps and have to go back',
      'Can feel scattered or "too much"',
      'Impatience with slower processes',
      'May not inform before acting',
    ],
    tips: [
      'It\'s okay to have many interests',
      'Wait to respond, THEN move fast',
      'Inform others before big moves',
      'Skipping steps is part of your process',
    ],
  },
  {
    id: 'projector',
    name: 'Projector',
    emoji: '🎯',
    percentage: '~20%',
    strategy: 'Wait for the invitation',
    signature: 'Success',
    notSelf: 'Bitterness',
    description: 'Projectors are here to guide and direct others. They have a focused, penetrating aura that sees deeply into others, but need recognition and invitation to share their gifts.',
    strengths: [
      'Deep insight into others and systems',
      'Natural guides and advisors',
      'Efficient - work smarter not harder',
      'Can see what others miss',
    ],
    challenges: [
      'May give unsolicited advice',
      'Can feel unseen or unrecognized',
      'Limited energy - not built for 9-5',
      'Bitterness when gifts aren\'t valued',
    ],
    tips: [
      'Wait for recognition and invitation',
      'Rest is productive for you',
      'Study what fascinates you',
      'Your bitterness signals lack of recognition',
    ],
  },
  {
    id: 'reflector',
    name: 'Reflector',
    emoji: '🌙',
    percentage: '~1%',
    strategy: 'Wait a lunar cycle (28 days)',
    signature: 'Surprise',
    notSelf: 'Disappointment',
    description: 'Reflectors are the rarest type, with no defined centers. They sample and reflect the energy around them, serving as mirrors for community health.',
    strengths: [
      'Can see the big picture clearly',
      'Deeply attuned to environment',
      'Wise perspective on others',
      'Barometer for community health',
    ],
    challenges: [
      'Highly sensitive to environment',
      'May lose sense of self',
      'Need time for major decisions',
      'Can feel invisible or overlooked',
    ],
    tips: [
      'Wait 28 days for major decisions',
      'Your environment IS your health',
      'Surround yourself with good energy',
      'You\'re here to be surprised by life',
    ],
  },
];

interface Authority {
  id: string;
  name: string;
  emoji: string;
  description: string;
  howToUse: string;
}

const AUTHORITIES: Authority[] = [
  {
    id: 'emotional',
    name: 'Emotional Authority',
    emoji: '🌊',
    description: 'Your emotions move in waves. Never make decisions in the high or low - wait for clarity.',
    howToUse: 'Sleep on important decisions. Notice how you feel about something over time. Clarity comes when the emotional wave settles.',
  },
  {
    id: 'sacral',
    name: 'Sacral Authority',
    emoji: '🔴',
    description: 'Your gut knows. Listen for the "uh-huh" (yes) or "uh-uh" (no) response in your body.',
    howToUse: 'Ask yes/no questions. Notice your immediate gut response. The sacral speaks in sounds and sensations, not words.',
  },
  {
    id: 'splenic',
    name: 'Splenic Authority',
    emoji: '⚡',
    description: 'Instant, in-the-moment knowing. Your intuition speaks once, quietly, and doesn\'t repeat.',
    howToUse: 'Trust your first instinct. The splenic whispers - if you have to think about it, you missed it. It\'s about survival and timing.',
  },
  {
    id: 'ego',
    name: 'Ego/Heart Authority',
    emoji: '❤️',
    description: 'What do YOU want? Your willpower and desires guide you correctly.',
    howToUse: 'Ask "What\'s in it for me?" without guilt. Your commitments must serve your heart. Only promise what you truly want to deliver.',
  },
  {
    id: 'self',
    name: 'Self-Projected Authority',
    emoji: '🗣️',
    description: 'You find clarity by talking it out. Your truth emerges through your voice.',
    howToUse: 'Talk to trusted people about decisions. Listen to what YOU say - not their advice. Your voice reveals your truth.',
  },
  {
    id: 'lunar',
    name: 'Lunar Authority',
    emoji: '🌙',
    description: 'You need a full lunar cycle (28 days) to gain clarity on major decisions.',
    howToUse: 'Don\'t rush big decisions. Discuss with different people throughout the month. Notice patterns in how you feel over time.',
  },
];

type Tab = 'types' | 'authority' | 'myType';

export default function HumanDesign() {
  const [activeTab, setActiveTab] = useState<Tab>('types');
  const [selectedType, setSelectedType] = useState<HumanDesignType | null>(null);
  const [myType, setMyType] = useState<string | null>(null);
  const [myAuthority, setMyAuthority] = useState<string | null>(null);

  React.useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const savedType = await AsyncStorage.getItem('mood_leaf_hd_type');
      const savedAuthority = await AsyncStorage.getItem('mood_leaf_hd_authority');
      if (savedType) setMyType(savedType);
      if (savedAuthority) setMyAuthority(savedAuthority);
    } catch (error) {
      console.error('Error loading HD data:', error);
    }
  };

  const saveMyType = async (typeId: string) => {
    try {
      await AsyncStorage.setItem('mood_leaf_hd_type', typeId);
      setMyType(typeId);
    } catch (error) {
      console.error('Error saving type:', error);
    }
  };

  const saveMyAuthority = async (authorityId: string) => {
    try {
      await AsyncStorage.setItem('mood_leaf_hd_authority', authorityId);
      setMyAuthority(authorityId);
    } catch (error) {
      console.error('Error saving authority:', error);
    }
  };

  const renderTypesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.introText}>
        Human Design combines astrology, I Ching, Kabbalah, and the chakra system
        to reveal your unique energetic blueprint. Use this as a lens for
        self-reflection - take what resonates, leave what doesn't.
      </Text>

      {selectedType ? (
        <View style={styles.typeDetail}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedType(null)}
          >
            <Text style={styles.backButtonText}>← Back to Types</Text>
          </TouchableOpacity>

          <View style={[styles.typeHeader, { backgroundColor: '#1E1E2E' }]}>
            <Text style={styles.typeEmoji}>{selectedType.emoji}</Text>
            <Text style={styles.typeName}>{selectedType.name}</Text>
            <Text style={styles.typePercentage}>{selectedType.percentage} of population</Text>
          </View>

          <View style={styles.strategyBox}>
            <Text style={styles.strategyLabel}>Strategy</Text>
            <Text style={styles.strategyValue}>{selectedType.strategy}</Text>
          </View>

          <View style={styles.signatureRow}>
            <View style={styles.signatureItem}>
              <Text style={styles.signatureLabel}>Signature (aligned)</Text>
              <Text style={styles.signatureValue}>✨ {selectedType.signature}</Text>
            </View>
            <View style={styles.signatureItem}>
              <Text style={styles.signatureLabel}>Not-Self (misaligned)</Text>
              <Text style={styles.notSelfValue}>⚠️ {selectedType.notSelf}</Text>
            </View>
          </View>

          <Text style={styles.descriptionText}>{selectedType.description}</Text>

          <View style={styles.listSection}>
            <Text style={styles.listTitle}>💪 Strengths</Text>
            {selectedType.strengths.map((strength, index) => (
              <Text key={index} style={styles.listItem}>• {strength}</Text>
            ))}
          </View>

          <View style={styles.listSection}>
            <Text style={styles.listTitle}>🌱 Growth Areas</Text>
            {selectedType.challenges.map((challenge, index) => (
              <Text key={index} style={styles.listItem}>• {challenge}</Text>
            ))}
          </View>

          <View style={styles.listSection}>
            <Text style={styles.listTitle}>💡 Tips</Text>
            {selectedType.tips.map((tip, index) => (
              <Text key={index} style={styles.listItem}>• {tip}</Text>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.selectButton,
              myType === selectedType.id && styles.selectedButton,
            ]}
            onPress={() => saveMyType(selectedType.id)}
          >
            <Text style={styles.selectButtonText}>
              {myType === selectedType.id ? '✓ This is My Type' : 'Set as My Type'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.typesGrid}>
          {HUMAN_DESIGN_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                myType === type.id && styles.selectedTypeCard,
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={styles.cardEmoji}>{type.emoji}</Text>
              <Text style={styles.cardName}>{type.name}</Text>
              <Text style={styles.cardPercentage}>{type.percentage}</Text>
              <Text style={styles.cardStrategy}>{type.strategy}</Text>
              {myType === type.id && (
                <View style={styles.myTypeBadge}>
                  <Text style={styles.myTypeBadgeText}>My Type</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderAuthorityTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.introText}>
        Your Authority is your inner decision-making compass. It tells you HOW
        to make decisions that are correct for you. This is separate from your Type.
      </Text>

      {AUTHORITIES.map((authority) => (
        <TouchableOpacity
          key={authority.id}
          style={[
            styles.authorityCard,
            myAuthority === authority.id && styles.selectedAuthorityCard,
          ]}
          onPress={() => saveMyAuthority(authority.id)}
        >
          <View style={styles.authorityHeader}>
            <Text style={styles.authorityEmoji}>{authority.emoji}</Text>
            <Text style={styles.authorityName}>{authority.name}</Text>
            {myAuthority === authority.id && (
              <Text style={styles.checkMark}>✓</Text>
            )}
          </View>
          <Text style={styles.authorityDescription}>{authority.description}</Text>
          <View style={styles.howToUseBox}>
            <Text style={styles.howToUseLabel}>How to use:</Text>
            <Text style={styles.howToUseText}>{authority.howToUse}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderMyTypeTab = () => {
    const myTypeData = HUMAN_DESIGN_TYPES.find((t) => t.id === myType);
    const myAuthorityData = AUTHORITIES.find((a) => a.id === myAuthority);

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {myTypeData || myAuthorityData ? (
          <View>
            <Text style={styles.sectionTitle}>Your Human Design Profile</Text>

            {myTypeData && (
              <View style={styles.profileCard}>
                <Text style={styles.profileLabel}>Type</Text>
                <View style={styles.profileRow}>
                  <Text style={styles.profileEmoji}>{myTypeData.emoji}</Text>
                  <View>
                    <Text style={styles.profileName}>{myTypeData.name}</Text>
                    <Text style={styles.profileStrategy}>
                      Strategy: {myTypeData.strategy}
                    </Text>
                  </View>
                </View>
                <View style={styles.signatureRow}>
                  <Text style={styles.miniSignature}>
                    ✨ Aligned: {myTypeData.signature}
                  </Text>
                  <Text style={styles.miniNotSelf}>
                    ⚠️ Off-track: {myTypeData.notSelf}
                  </Text>
                </View>
              </View>
            )}

            {myAuthorityData && (
              <View style={styles.profileCard}>
                <Text style={styles.profileLabel}>Authority</Text>
                <View style={styles.profileRow}>
                  <Text style={styles.profileEmoji}>{myAuthorityData.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>{myAuthorityData.name}</Text>
                    <Text style={styles.authorityHint}>
                      {myAuthorityData.howToUse}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {myTypeData && (
              <View style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>Daily Reminders</Text>
                {myTypeData.tips.map((tip, index) => (
                  <Text key={index} style={styles.tipItem}>• {tip}</Text>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔮</Text>
            <Text style={styles.emptyTitle}>No Type Selected Yet</Text>
            <Text style={styles.emptyText}>
              Explore the Types and Authority tabs to learn about Human Design,
              then select yours to save it here.
            </Text>
            <Text style={styles.emptyHint}>
              Don't know your type? Search "free Human Design chart" online -
              you'll need your birth date, time, and location.
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Human Design</Text>
        <Text style={styles.subtitle}>Discover your energetic blueprint</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'types' && styles.activeTab]}
          onPress={() => setActiveTab('types')}
        >
          <Text style={[styles.tabText, activeTab === 'types' && styles.activeTabText]}>
            Types
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'authority' && styles.activeTab]}
          onPress={() => setActiveTab('authority')}
        >
          <Text style={[styles.tabText, activeTab === 'authority' && styles.activeTabText]}>
            Authority
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myType' && styles.activeTab]}
          onPress={() => setActiveTab('myType')}
        >
          <Text style={[styles.tabText, activeTab === 'myType' && styles.activeTabText]}>
            My Profile
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'types' && renderTypesTab()}
      {activeTab === 'authority' && renderAuthorityTab()}
      {activeTab === 'myType' && renderMyTypeTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#8B5CF6',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  introText: {
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 22,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: (width - 48) / 2,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  selectedTypeCard: {
    borderColor: '#8B5CF6',
    backgroundColor: '#1E1E3E',
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardPercentage: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  cardStrategy: {
    fontSize: 12,
    color: '#8B5CF6',
    marginTop: 8,
  },
  myTypeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  myTypeBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  typeDetail: {
    flex: 1,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#8B5CF6',
    fontSize: 14,
  },
  typeHeader: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  typeEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  typeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  typePercentage: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  strategyBox: {
    backgroundColor: '#8B5CF620',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#8B5CF640',
  },
  strategyLabel: {
    fontSize: 12,
    color: '#8B5CF6',
    marginBottom: 4,
  },
  strategyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  signatureItem: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
  },
  signatureLabel: {
    fontSize: 10,
    color: '#888888',
    marginBottom: 4,
  },
  signatureValue: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  notSelfValue: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 15,
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 20,
  },
  listSection: {
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  listItem: {
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 24,
    marginLeft: 8,
  },
  selectButton: {
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  selectedButton: {
    backgroundColor: '#8B5CF6',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  authorityCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  selectedAuthorityCard: {
    borderColor: '#8B5CF6',
    backgroundColor: '#1E1E3E',
  },
  authorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorityEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  authorityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  checkMark: {
    fontSize: 18,
    color: '#8B5CF6',
  },
  authorityDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 22,
    marginBottom: 12,
  },
  howToUseBox: {
    backgroundColor: '#0D0D0D',
    borderRadius: 8,
    padding: 12,
  },
  howToUseLabel: {
    fontSize: 12,
    color: '#8B5CF6',
    marginBottom: 4,
  },
  howToUseText: {
    fontSize: 13,
    color: '#AAAAAA',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  profileLabel: {
    fontSize: 12,
    color: '#8B5CF6',
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileStrategy: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  miniSignature: {
    fontSize: 12,
    color: '#22C55E',
    marginTop: 12,
  },
  miniNotSelf: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  authorityHint: {
    fontSize: 13,
    color: '#AAAAAA',
    marginTop: 8,
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: '#8B5CF620',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#8B5CF640',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  emptyHint: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
