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

interface ZodiacSign {
  id: string;
  name: string;
  symbol: string;
  dates: string;
  element: 'fire' | 'earth' | 'air' | 'water';
  modality: 'cardinal' | 'fixed' | 'mutable';
  rulingPlanet: string;
  traits: string[];
  strengths: string[];
  challenges: string[];
  compatibility: string[];
  selfCareThemes: string[];
}

const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    id: 'aries',
    name: 'Aries',
    symbol: '♈',
    dates: 'Mar 21 - Apr 19',
    element: 'fire',
    modality: 'cardinal',
    rulingPlanet: 'Mars',
    traits: ['Bold', 'Ambitious', 'Energetic', 'Pioneering', 'Direct'],
    strengths: ['Natural leader', 'Courageous', 'Enthusiastic', 'Quick to act'],
    challenges: ['Impatience', 'Impulsiveness', 'Can be aggressive', 'Difficulty finishing'],
    compatibility: ['Leo', 'Sagittarius', 'Gemini', 'Aquarius'],
    selfCareThemes: ['Physical activity', 'New challenges', 'Competition', 'Independence'],
  },
  {
    id: 'taurus',
    name: 'Taurus',
    symbol: '♉',
    dates: 'Apr 20 - May 20',
    element: 'earth',
    modality: 'fixed',
    rulingPlanet: 'Venus',
    traits: ['Grounded', 'Sensual', 'Patient', 'Reliable', 'Determined'],
    strengths: ['Stable', 'Persistent', 'Appreciates beauty', 'Practical'],
    challenges: ['Stubbornness', 'Possessiveness', 'Resistance to change', 'Indulgence'],
    compatibility: ['Virgo', 'Capricorn', 'Cancer', 'Pisces'],
    selfCareThemes: ['Comfort', 'Nature', 'Good food', 'Sensory pleasures', 'Routine'],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    symbol: '♊',
    dates: 'May 21 - Jun 20',
    element: 'air',
    modality: 'mutable',
    rulingPlanet: 'Mercury',
    traits: ['Curious', 'Adaptable', 'Communicative', 'Witty', 'Versatile'],
    strengths: ['Quick learner', 'Great communicator', 'Flexible', 'Social'],
    challenges: ['Inconsistency', 'Restlessness', 'Superficiality', 'Overthinking'],
    compatibility: ['Libra', 'Aquarius', 'Aries', 'Leo'],
    selfCareThemes: ['Mental stimulation', 'Variety', 'Social connection', 'Learning'],
  },
  {
    id: 'cancer',
    name: 'Cancer',
    symbol: '♋',
    dates: 'Jun 21 - Jul 22',
    element: 'water',
    modality: 'cardinal',
    rulingPlanet: 'Moon',
    traits: ['Nurturing', 'Intuitive', 'Protective', 'Emotional', 'Home-oriented'],
    strengths: ['Deeply caring', 'Strong intuition', 'Loyal', 'Creative'],
    challenges: ['Moodiness', 'Over-sensitivity', 'Clinginess', 'Holding grudges'],
    compatibility: ['Scorpio', 'Pisces', 'Taurus', 'Virgo'],
    selfCareThemes: ['Home sanctuary', 'Family time', 'Emotional processing', 'Cooking'],
  },
  {
    id: 'leo',
    name: 'Leo',
    symbol: '♌',
    dates: 'Jul 23 - Aug 22',
    element: 'fire',
    modality: 'fixed',
    rulingPlanet: 'Sun',
    traits: ['Confident', 'Generous', 'Dramatic', 'Warm', 'Creative'],
    strengths: ['Natural performer', 'Big-hearted', 'Loyal', 'Inspiring'],
    challenges: ['Pride', 'Need for attention', 'Stubbornness', 'Ego sensitivity'],
    compatibility: ['Aries', 'Sagittarius', 'Gemini', 'Libra'],
    selfCareThemes: ['Creative expression', 'Being seen', 'Luxury', 'Play'],
  },
  {
    id: 'virgo',
    name: 'Virgo',
    symbol: '♍',
    dates: 'Aug 23 - Sep 22',
    element: 'earth',
    modality: 'mutable',
    rulingPlanet: 'Mercury',
    traits: ['Analytical', 'Practical', 'Helpful', 'Detail-oriented', 'Health-conscious'],
    strengths: ['Problem solver', 'Organized', 'Reliable', 'Modest'],
    challenges: ['Perfectionism', 'Over-critical', 'Worry', 'Difficulty relaxing'],
    compatibility: ['Taurus', 'Capricorn', 'Cancer', 'Scorpio'],
    selfCareThemes: ['Organization', 'Health routines', 'Service to others', 'Nature walks'],
  },
  {
    id: 'libra',
    name: 'Libra',
    symbol: '♎',
    dates: 'Sep 23 - Oct 22',
    element: 'air',
    modality: 'cardinal',
    rulingPlanet: 'Venus',
    traits: ['Diplomatic', 'Aesthetic', 'Harmonious', 'Social', 'Fair'],
    strengths: ['Peacemaker', 'Charming', 'Artistic', 'Cooperative'],
    challenges: ['Indecision', 'People-pleasing', 'Avoids conflict', 'Codependency'],
    compatibility: ['Gemini', 'Aquarius', 'Leo', 'Sagittarius'],
    selfCareThemes: ['Beauty', 'Balance', 'Partnership', 'Art and music'],
  },
  {
    id: 'scorpio',
    name: 'Scorpio',
    symbol: '♏',
    dates: 'Oct 23 - Nov 21',
    element: 'water',
    modality: 'fixed',
    rulingPlanet: 'Pluto (Mars)',
    traits: ['Intense', 'Passionate', 'Transformative', 'Secretive', 'Perceptive'],
    strengths: ['Deeply loyal', 'Powerful intuition', 'Resilient', 'Focused'],
    challenges: ['Jealousy', 'Obsession', 'Controlling', 'Difficulty trusting'],
    compatibility: ['Cancer', 'Pisces', 'Virgo', 'Capricorn'],
    selfCareThemes: ['Depth', 'Transformation', 'Privacy', 'Emotional release'],
  },
  {
    id: 'sagittarius',
    name: 'Sagittarius',
    symbol: '♐',
    dates: 'Nov 22 - Dec 21',
    element: 'fire',
    modality: 'mutable',
    rulingPlanet: 'Jupiter',
    traits: ['Adventurous', 'Optimistic', 'Philosophical', 'Free-spirited', 'Honest'],
    strengths: ['Open-minded', 'Enthusiastic', 'Inspiring', 'Truth-seeking'],
    challenges: ['Restlessness', 'Bluntness', 'Commitment issues', 'Overconfidence'],
    compatibility: ['Aries', 'Leo', 'Libra', 'Aquarius'],
    selfCareThemes: ['Adventure', 'Learning', 'Travel', 'Philosophy', 'Freedom'],
  },
  {
    id: 'capricorn',
    name: 'Capricorn',
    symbol: '♑',
    dates: 'Dec 22 - Jan 19',
    element: 'earth',
    modality: 'cardinal',
    rulingPlanet: 'Saturn',
    traits: ['Ambitious', 'Disciplined', 'Responsible', 'Traditional', 'Patient'],
    strengths: ['Hard-working', 'Reliable', 'Strategic', 'Mature'],
    challenges: ['Workaholism', 'Pessimism', 'Rigid', 'Difficulty with emotions'],
    compatibility: ['Taurus', 'Virgo', 'Scorpio', 'Pisces'],
    selfCareThemes: ['Achievement', 'Structure', 'Long-term goals', 'Mountain time'],
  },
  {
    id: 'aquarius',
    name: 'Aquarius',
    symbol: '♒',
    dates: 'Jan 20 - Feb 18',
    element: 'air',
    modality: 'fixed',
    rulingPlanet: 'Uranus (Saturn)',
    traits: ['Innovative', 'Independent', 'Humanitarian', 'Unconventional', 'Intellectual'],
    strengths: ['Visionary', 'Original thinker', 'Friendly', 'Progressive'],
    challenges: ['Detachment', 'Rebelliousness', 'Unpredictable', 'Aloof'],
    compatibility: ['Gemini', 'Libra', 'Aries', 'Sagittarius'],
    selfCareThemes: ['Community', 'Innovation', 'Causes', 'Technology', 'Uniqueness'],
  },
  {
    id: 'pisces',
    name: 'Pisces',
    symbol: '♓',
    dates: 'Feb 19 - Mar 20',
    element: 'water',
    modality: 'mutable',
    rulingPlanet: 'Neptune (Jupiter)',
    traits: ['Dreamy', 'Compassionate', 'Artistic', 'Intuitive', 'Spiritual'],
    strengths: ['Empathetic', 'Creative', 'Wise', 'Gentle'],
    challenges: ['Escapism', 'Over-sensitivity', 'Victim mentality', 'Boundaries'],
    compatibility: ['Cancer', 'Scorpio', 'Taurus', 'Capricorn'],
    selfCareThemes: ['Creativity', 'Water', 'Solitude', 'Spirituality', 'Music'],
  },
];

const ELEMENTS = {
  fire: { emoji: '🔥', color: '#EF4444', signs: ['Aries', 'Leo', 'Sagittarius'], traits: 'Passionate, dynamic, temperamental' },
  earth: { emoji: '🌍', color: '#22C55E', signs: ['Taurus', 'Virgo', 'Capricorn'], traits: 'Grounded, practical, reliable' },
  air: { emoji: '💨', color: '#3B82F6', signs: ['Gemini', 'Libra', 'Aquarius'], traits: 'Intellectual, social, communicative' },
  water: { emoji: '💧', color: '#8B5CF6', signs: ['Cancer', 'Scorpio', 'Pisces'], traits: 'Emotional, intuitive, mysterious' },
};

const MODALITIES = {
  cardinal: { signs: ['Aries', 'Cancer', 'Libra', 'Capricorn'], description: 'Initiators - start new things' },
  fixed: { signs: ['Taurus', 'Leo', 'Scorpio', 'Aquarius'], description: 'Stabilizers - maintain and persist' },
  mutable: { signs: ['Gemini', 'Virgo', 'Sagittarius', 'Pisces'], description: 'Adapters - flexible and changeable' },
};

type Tab = 'signs' | 'elements' | 'myChart';

export default function AstrologyBasics() {
  const [activeTab, setActiveTab] = useState<Tab>('signs');
  const [selectedSign, setSelectedSign] = useState<ZodiacSign | null>(null);
  const [mySun, setMySun] = useState<string | null>(null);
  const [myMoon, setMyMoon] = useState<string | null>(null);
  const [myRising, setMyRising] = useState<string | null>(null);
  const [selectingFor, setSelectingFor] = useState<'sun' | 'moon' | 'rising' | null>(null);

  React.useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const sun = await AsyncStorage.getItem('mood_leaf_astro_sun');
      const moon = await AsyncStorage.getItem('mood_leaf_astro_moon');
      const rising = await AsyncStorage.getItem('mood_leaf_astro_rising');
      if (sun) setMySun(sun);
      if (moon) setMyMoon(moon);
      if (rising) setMyRising(rising);
    } catch (error) {
      console.error('Error loading astrology data:', error);
    }
  };

  const savePlacement = async (placement: 'sun' | 'moon' | 'rising', signId: string) => {
    try {
      await AsyncStorage.setItem(`mood_leaf_astro_${placement}`, signId);
      if (placement === 'sun') setMySun(signId);
      if (placement === 'moon') setMyMoon(signId);
      if (placement === 'rising') setMyRising(signId);
      setSelectingFor(null);
    } catch (error) {
      console.error('Error saving placement:', error);
    }
  };

  const getSignById = (id: string | null) => ZODIAC_SIGNS.find((s) => s.id === id);

  const renderSignsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.introText}>
        The zodiac wheel contains 12 signs, each with unique qualities. Use these
        as a framework for self-reflection - they're archetypes, not prescriptions.
      </Text>

      {selectingFor && (
        <View style={styles.selectingBanner}>
          <Text style={styles.selectingText}>
            Tap a sign to set as your {selectingFor.toUpperCase()}
          </Text>
          <TouchableOpacity onPress={() => setSelectingFor(null)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedSign ? (
        <View style={styles.signDetail}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedSign(null)}
          >
            <Text style={styles.backButtonText}>← Back to Signs</Text>
          </TouchableOpacity>

          <View style={[styles.signHeader, { borderColor: ELEMENTS[selectedSign.element].color }]}>
            <Text style={styles.signSymbol}>{selectedSign.symbol}</Text>
            <Text style={styles.signName}>{selectedSign.name}</Text>
            <Text style={styles.signDates}>{selectedSign.dates}</Text>
            <View style={styles.signMeta}>
              <Text style={[styles.elementBadge, { backgroundColor: ELEMENTS[selectedSign.element].color }]}>
                {ELEMENTS[selectedSign.element].emoji} {selectedSign.element}
              </Text>
              <Text style={styles.modalityBadge}>{selectedSign.modality}</Text>
              <Text style={styles.planetBadge}>☿ {selectedSign.rulingPlanet}</Text>
            </View>
          </View>

          <View style={styles.traitsRow}>
            {selectedSign.traits.map((trait, index) => (
              <View key={index} style={styles.traitBadge}>
                <Text style={styles.traitText}>{trait}</Text>
              </View>
            ))}
          </View>

          <View style={styles.listSection}>
            <Text style={styles.listTitle}>💪 Strengths</Text>
            {selectedSign.strengths.map((item, index) => (
              <Text key={index} style={styles.listItem}>• {item}</Text>
            ))}
          </View>

          <View style={styles.listSection}>
            <Text style={styles.listTitle}>🌱 Growth Areas</Text>
            {selectedSign.challenges.map((item, index) => (
              <Text key={index} style={styles.listItem}>• {item}</Text>
            ))}
          </View>

          <View style={styles.listSection}>
            <Text style={styles.listTitle}>💕 Compatible With</Text>
            <Text style={styles.compatText}>{selectedSign.compatibility.join(', ')}</Text>
          </View>

          <View style={styles.selfCareSection}>
            <Text style={styles.listTitle}>🌿 Self-Care Themes</Text>
            <View style={styles.selfCareGrid}>
              {selectedSign.selfCareThemes.map((theme, index) => (
                <View key={index} style={styles.selfCareItem}>
                  <Text style={styles.selfCareText}>{theme}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.signsGrid}>
          {ZODIAC_SIGNS.map((sign) => (
            <TouchableOpacity
              key={sign.id}
              style={[
                styles.signCard,
                { borderLeftColor: ELEMENTS[sign.element].color },
                (mySun === sign.id || myMoon === sign.id || myRising === sign.id) && styles.mySignCard,
              ]}
              onPress={() => {
                if (selectingFor) {
                  savePlacement(selectingFor, sign.id);
                } else {
                  setSelectedSign(sign);
                }
              }}
            >
              <Text style={styles.cardSymbol}>{sign.symbol}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{sign.name}</Text>
                <Text style={styles.cardDates}>{sign.dates}</Text>
              </View>
              <View style={styles.mySignBadges}>
                {mySun === sign.id && <Text style={styles.sunBadge}>☀️</Text>}
                {myMoon === sign.id && <Text style={styles.moonBadge}>🌙</Text>}
                {myRising === sign.id && <Text style={styles.risingBadge}>⬆️</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderElementsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.introText}>
        The four elements represent fundamental energies. Each sign belongs to one
        element, shaping its core nature.
      </Text>

      <View style={styles.elementsSection}>
        {Object.entries(ELEMENTS).map(([key, element]) => (
          <View
            key={key}
            style={[styles.elementCard, { borderColor: element.color }]}
          >
            <View style={styles.elementHeader}>
              <Text style={styles.elementEmoji}>{element.emoji}</Text>
              <Text style={[styles.elementName, { color: element.color }]}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
            </View>
            <Text style={styles.elementTraits}>{element.traits}</Text>
            <Text style={styles.elementSigns}>{element.signs.join(' • ')}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Modalities</Text>
      <Text style={styles.introText}>
        Modalities describe how signs express their energy - through initiation,
        stabilization, or adaptation.
      </Text>

      {Object.entries(MODALITIES).map(([key, modality]) => (
        <View key={key} style={styles.modalityCard}>
          <Text style={styles.modalityName}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </Text>
          <Text style={styles.modalityDesc}>{modality.description}</Text>
          <Text style={styles.modalitySigns}>{modality.signs.join(' • ')}</Text>
        </View>
      ))}
    </ScrollView>
  );

  const renderMyChartTab = () => {
    const sunSign = getSignById(mySun);
    const moonSign = getSignById(myMoon);
    const risingSign = getSignById(myRising);

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Your Big Three</Text>
        <Text style={styles.introText}>
          Your Sun, Moon, and Rising signs form the foundation of your astrological
          profile. Together they represent your core identity, emotional nature,
          and outward persona.
        </Text>

        <TouchableOpacity
          style={[styles.placementCard, mySun && { borderColor: ELEMENTS[sunSign!.element].color }]}
          onPress={() => setSelectingFor('sun')}
        >
          <View style={styles.placementHeader}>
            <Text style={styles.placementEmoji}>☀️</Text>
            <View style={styles.placementInfo}>
              <Text style={styles.placementLabel}>Sun Sign</Text>
              <Text style={styles.placementDesc}>Your core identity & ego</Text>
            </View>
            {sunSign && <Text style={styles.placementSymbol}>{sunSign.symbol}</Text>}
          </View>
          {sunSign ? (
            <View style={styles.placementContent}>
              <Text style={styles.placementName}>{sunSign.name}</Text>
              <Text style={styles.placementTraits}>{sunSign.traits.slice(0, 3).join(' • ')}</Text>
            </View>
          ) : (
            <Text style={styles.tapToSelect}>Tap to select</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.placementCard, myMoon && { borderColor: ELEMENTS[moonSign!.element].color }]}
          onPress={() => setSelectingFor('moon')}
        >
          <View style={styles.placementHeader}>
            <Text style={styles.placementEmoji}>🌙</Text>
            <View style={styles.placementInfo}>
              <Text style={styles.placementLabel}>Moon Sign</Text>
              <Text style={styles.placementDesc}>Your emotional nature & needs</Text>
            </View>
            {moonSign && <Text style={styles.placementSymbol}>{moonSign.symbol}</Text>}
          </View>
          {moonSign ? (
            <View style={styles.placementContent}>
              <Text style={styles.placementName}>{moonSign.name}</Text>
              <Text style={styles.placementTraits}>{moonSign.traits.slice(0, 3).join(' • ')}</Text>
            </View>
          ) : (
            <Text style={styles.tapToSelect}>Tap to select</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.placementCard, myRising && { borderColor: ELEMENTS[risingSign!.element].color }]}
          onPress={() => setSelectingFor('rising')}
        >
          <View style={styles.placementHeader}>
            <Text style={styles.placementEmoji}>⬆️</Text>
            <View style={styles.placementInfo}>
              <Text style={styles.placementLabel}>Rising Sign (Ascendant)</Text>
              <Text style={styles.placementDesc}>How others see you</Text>
            </View>
            {risingSign && <Text style={styles.placementSymbol}>{risingSign.symbol}</Text>}
          </View>
          {risingSign ? (
            <View style={styles.placementContent}>
              <Text style={styles.placementName}>{risingSign.name}</Text>
              <Text style={styles.placementTraits}>{risingSign.traits.slice(0, 3).join(' • ')}</Text>
            </View>
          ) : (
            <Text style={styles.tapToSelect}>Tap to select</Text>
          )}
        </TouchableOpacity>

        {(sunSign || moonSign || risingSign) && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Your Elemental Balance</Text>
            <View style={styles.elementalBalance}>
              {Object.entries(ELEMENTS).map(([key, element]) => {
                const count = [sunSign, moonSign, risingSign].filter(
                  (s) => s?.element === key
                ).length;
                return (
                  <View key={key} style={styles.balanceItem}>
                    <Text style={styles.balanceEmoji}>{element.emoji}</Text>
                    <View
                      style={[
                        styles.balanceBar,
                        { width: `${(count / 3) * 100}%`, backgroundColor: element.color },
                      ]}
                    />
                    <Text style={styles.balanceCount}>{count}/3</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Finding Your Chart</Text>
          <Text style={styles.noteText}>
            Don't know your Moon or Rising? Search "free birth chart calculator"
            online. You'll need your birth date, time, and location.
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Astrology Basics</Text>
        <Text style={styles.subtitle}>Explore the zodiac for self-reflection</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'signs' && styles.activeTab]}
          onPress={() => { setActiveTab('signs'); setSelectingFor(null); }}
        >
          <Text style={[styles.tabText, activeTab === 'signs' && styles.activeTabText]}>
            Signs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'elements' && styles.activeTab]}
          onPress={() => { setActiveTab('elements'); setSelectingFor(null); }}
        >
          <Text style={[styles.tabText, activeTab === 'elements' && styles.activeTabText]}>
            Elements
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myChart' && styles.activeTab]}
          onPress={() => { setActiveTab('myChart'); setSelectingFor(null); }}
        >
          <Text style={[styles.tabText, activeTab === 'myChart' && styles.activeTabText]}>
            My Chart
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'signs' && renderSignsTab()}
      {activeTab === 'elements' && renderElementsTab()}
      {activeTab === 'myChart' && renderMyChartTab()}
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
  selectingBanner: {
    backgroundColor: '#8B5CF620',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  selectingText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  cancelText: {
    color: '#888888',
  },
  signsGrid: {
    gap: 8,
  },
  signCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  mySignCard: {
    backgroundColor: '#1E1E3E',
  },
  cardSymbol: {
    fontSize: 28,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardDates: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  mySignBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  sunBadge: {
    fontSize: 16,
  },
  moonBadge: {
    fontSize: 16,
  },
  risingBadge: {
    fontSize: 16,
  },
  signDetail: {
    flex: 1,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#8B5CF6',
    fontSize: 14,
  },
  signHeader: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  signSymbol: {
    fontSize: 56,
    marginBottom: 8,
  },
  signName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  signDates: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  signMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  elementBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  modalityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2A2A3E',
    color: '#AAAAAA',
    fontSize: 12,
    overflow: 'hidden',
  },
  planetBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#2A2A3E',
    color: '#AAAAAA',
    fontSize: 12,
    overflow: 'hidden',
  },
  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  traitBadge: {
    backgroundColor: '#2A2A3E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  traitText: {
    color: '#CCCCCC',
    fontSize: 13,
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
  compatText: {
    fontSize: 14,
    color: '#AAAAAA',
    marginLeft: 8,
  },
  selfCareSection: {
    marginBottom: 32,
  },
  selfCareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selfCareItem: {
    backgroundColor: '#22C55E20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22C55E40',
  },
  selfCareText: {
    color: '#22C55E',
    fontSize: 13,
  },
  elementsSection: {
    gap: 12,
    marginBottom: 24,
  },
  elementCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
  },
  elementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  elementEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  elementName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  elementTraits: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  elementSigns: {
    fontSize: 13,
    color: '#888888',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    marginTop: 8,
  },
  modalityCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modalityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalityDesc: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 8,
  },
  modalitySigns: {
    fontSize: 13,
    color: '#666666',
  },
  placementCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2A2A3E',
  },
  placementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placementEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  placementInfo: {
    flex: 1,
  },
  placementLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placementDesc: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  placementSymbol: {
    fontSize: 28,
  },
  placementContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
  },
  placementName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  placementTraits: {
    fontSize: 13,
    color: '#AAAAAA',
  },
  tapToSelect: {
    color: '#666666',
    marginTop: 12,
    fontStyle: 'italic',
  },
  summaryCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  elementalBalance: {
    gap: 12,
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceEmoji: {
    fontSize: 20,
    width: 28,
  },
  balanceBar: {
    height: 8,
    borderRadius: 4,
    minWidth: 4,
  },
  balanceCount: {
    color: '#888888',
    fontSize: 12,
    width: 30,
  },
  noteCard: {
    backgroundColor: '#8B5CF620',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#8B5CF640',
    marginBottom: 32,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    color: '#AAAAAA',
    lineHeight: 20,
  },
});
