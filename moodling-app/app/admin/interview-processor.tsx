/**
 * Interview Processor - YouTube Channel Harvester
 *
 * Admin page for processing YouTube channels to extract
 * human insights for AI training.
 *
 * Features:
 * - Add curated channels by category
 * - Process videos and extract insights
 * - Review and approve/reject insights
 * - Track processing progress and quality stats
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchChannelVideos,
  fetchVideoTranscript,
  extractInsightsWithClaude,
  addCuratedChannel,
  getCuratedChannels,
  removeCuratedChannel,
  createProcessingJob,
  updateProcessingJob,
  getProcessingJobs,
  savePendingInsights,
  getPendingInsights,
  approvePendingInsight,
  rejectPendingInsight,
  getApprovedInsights,
  markVideoProcessed,
  getQualityStats,
  updateQualityStats,
  CuratedChannel,
  ProcessingJob,
  ExtractedInsight,
  ChannelCategory,
  InsightExtractionCategory,
  QualityStats,
  CHANNEL_CATEGORIES,
  EXTRACTION_CATEGORIES,
} from '@/services/youtubeProcessorService';

type Tab = 'channels' | 'process' | 'review' | 'stats';

// Recommended channels to pre-load
// Curated for MoodLeaf ethos: warm honesty, anti-toxic-positivity, full human experience,
// embraces messy middle, non-clinical, pro-human-connection, neurodiversity aware
// Channel IDs are pre-populated to avoid YouTube fetch failures
const RECOMMENDED_CHANNELS = [
  // === TIER 1: PERFECT ALIGNMENT ===
  { name: 'Esther Perel', handle: 'estherperel', channelId: 'UCyktTJjKdR81Cv9sMXK5QCA', category: 'relationships_love' as ChannelCategory, trust: 'high' as const, description: 'Relationships as complex & contradictory. Never prescriptive. "Where Do We Begin"' },
  { name: 'How to ADHD', handle: 'HowtoADHD', channelId: 'UC-nPM1_kSZf91ZGkcgy_95Q', category: 'neurodivergence' as ChannelCategory, trust: 'high' as const, description: 'Jessica McCabe - warm, non-judgmental, practical ADHD content' },
  { name: 'The School of Life', handle: 'theschooloflife', channelId: 'UC7IcJI8PUf5Z3zKxnZvTBog', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Alain de Botton - philosophy for everyday emotional life' },

  // === TIER 2: STRONG ALIGNMENT ===
  { name: 'The Moth', handle: 'TheMoth', channelId: 'UCkVMpFPDK1F67eCM60ICAVQ', category: 'storytelling_human_experience' as ChannelCategory, trust: 'high' as const, description: 'True stories told live - raw, unpolished, deeply human' },
  { name: 'Therapy in a Nutshell', handle: 'TherapyinaNutshell', channelId: 'UCpuKvNRyiFKC4Cgz5bulHjg', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Licensed LMFT, evidence-based mental health education' },
  { name: 'Kati Morton', handle: 'KatiMorton', channelId: 'UCzBYOHyEEzlkRdDOSobbpvw', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Licensed therapist, personal + educational, accessible' },
  { name: 'Psychology In Seattle', handle: 'PsychologyInSeattle', channelId: 'UCVQXbB1rSYdPb2boNNpu3og', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Dr. Kirk Honda - licensed therapist + professor, nuanced' },
  { name: 'Brené Brown', handle: 'BreneBrown', channelId: 'UCpLsVgZrECIhPdJJCxyNRlQ', category: 'vulnerability_authenticity' as ChannelCategory, trust: 'high' as const, description: 'Vulnerability, shame research, authenticity' },

  // === NEURODIVERGENCE ===
  { name: 'Purple Ella', handle: 'PurpleElla', channelId: 'UCvj7WmANb1VdDwPv_L0D4ag', category: 'neurodivergence' as ChannelCategory, trust: 'high' as const, description: 'Autism + ADHD, authentic lived experience' },

  // === RELATIONSHIPS & CONNECTION ===
  { name: 'The Gottman Institute', handle: 'gottmaninstitute', channelId: 'UCWxbz64r6vI7E2awwc8apLQ', category: 'relationships_love' as ChannelCategory, trust: 'high' as const, description: 'John Gottman - research-based relationship insights, non-judgmental' },
  { name: 'Diary of a CEO', handle: 'TheDiaryOfACEO', channelId: 'UCGq-a57w-aPwyi3pW7XLiHw', category: 'vulnerability_authenticity' as ChannelCategory, trust: 'high' as const, description: 'Deep conversations on mental health, failure, relationships' },

  // === ELDERLY WISDOM ===
  { name: 'StoryCorps', handle: 'storycorps', channelId: 'UCBYXhmHfUOpb9TYuPpVzFWA', category: 'elderly_wisdom' as ChannelCategory, trust: 'high' as const, description: 'Ordinary people\'s stories, especially elderly wisdom, deeply human' },

  // === JOY & CELEBRATION ===
  { name: 'SoulPancake', handle: 'soulpancake', channelId: 'UCvddZU4j9oalKOxCJ0IuNyg', category: 'joy_celebration' as ChannelCategory, trust: 'medium' as const, description: 'Uplifting content about human connection, joy, and meaning' },

  // === SCIENCE-BASED WELLBEING ===
  { name: 'Andrew Huberman', handle: 'hubermanlab', channelId: 'UC2D2CMWXMOVWx7giW1n3LIg', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Huberman Lab - neuroscience-based tools for mental health, sleep, focus, stress' },

  // === WOMEN'S EMOTIONAL HEALTH ===
  { name: 'Mel Robbins', handle: 'melrobbins', channelId: 'UCk2U-Oqn7RXf-ydPqfSxG5g', category: 'vulnerability_authenticity' as ChannelCategory, trust: 'high' as const, description: 'Motivation without toxic positivity, science-backed mindset tools' },
  { name: 'Dr. Ramani', handle: 'DoctorRamani', channelId: 'UC9Qixc77KhCo88E5gMs-caQ', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Narcissistic abuse recovery, boundaries, healing from toxic relationships' },

  // === RELATIONSHIP HEALTH ===
  { name: 'Thais Gibson', handle: 'PersonalDevelopmentSchool', channelId: 'UCHQ4lSAu7jQXmVN3MPCPZGQ', category: 'relationships_love' as ChannelCategory, trust: 'high' as const, description: 'Attachment theory, relationship patterns, personal development' },

  // === MEN'S EMOTIONAL HEALTH ===
  { name: 'Lewis Howes', handle: 'LewisHowes', channelId: 'UCQjBpfPj72zwYFpS7U7gd_A', category: 'vulnerability_authenticity' as ChannelCategory, trust: 'high' as const, description: 'School of Greatness - men\'s mental health, vulnerability, growth' },
  { name: 'The Minimalists', handle: 'TheMinimalists', channelId: 'UCRPrmdh5FLt4bxWgvQ8SWOg', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Joshua & Ryan - intentional living, meaning over materialism' },
  { name: 'Rich Roll', handle: 'richroll', channelId: 'UCOF0J3ms6IeZZCOp-jJMuXQ', category: 'vulnerability_authenticity' as ChannelCategory, trust: 'high' as const, description: 'Plant-powered living, addiction recovery, men\'s transformation' },

  // === GUIDED MEDITATION ===
  { name: 'Michael Sealey', handle: 'MichaelSealey', channelId: 'UC9GoqsWjluXVSKHO4Wistbw', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Guided meditations, hypnotherapy, sleep and relaxation' },
  { name: 'The Honest Guys', handle: 'thehonestguys', channelId: 'UC7tD6Ifrwbiy-BoaAHEinmQ', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Guided meditations, relaxation, sleep stories' },
  { name: 'Jason Stephenson', handle: 'JasonStephensonSleep', channelId: 'UCqDBSTeuGa1e3MSqG_nq2Uw', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Sleep meditation, guided relaxation, anxiety relief' },
];

export default function InterviewProcessorScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<Tab>('channels');
  const [loading, setLoading] = useState(true);

  // Channels state
  const [channels, setChannels] = useState<CuratedChannel[]>([]);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [newChannelCategory, setNewChannelCategory] = useState<ChannelCategory>('therapy_mental_health');
  const [addingChannel, setAddingChannel] = useState(false);

  // Processing state
  const [selectedChannel, setSelectedChannel] = useState<CuratedChannel | null>(null);
  const [videosToProcess, setVideosToProcess] = useState('10');
  const [processing, setProcessing] = useState(false);
  const [currentJob, setCurrentJob] = useState<ProcessingJob | null>(null);
  const [processingLog, setProcessingLog] = useState<string[]>([]);
  const processingRef = useRef(false);

  // Review state
  const [pendingInsights, setPendingInsights] = useState<ExtractedInsight[]>([]);
  const [approvedInsights, setApprovedInsights] = useState<ExtractedInsight[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<ExtractedInsight | null>(null);

  // Stats state
  const [qualityStats, setQualityStats] = useState<QualityStats | null>(null);

  // API Keys
  const [apiKey, setApiKey] = useState('');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [showYoutubeApiInput, setShowYoutubeApiInput] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [channelsData, pendingData, approvedData, statsData, storedApiKey, storedYoutubeKey] = await Promise.all([
        getCuratedChannels(),
        getPendingInsights(),
        getApprovedInsights(),
        getQualityStats(),
        AsyncStorage.getItem('claude_api_key'),
        AsyncStorage.getItem('youtube_api_key'),
      ]);
      setChannels(channelsData);
      setPendingInsights(pendingData);
      setApprovedInsights(approvedData);
      setQualityStats(statsData);
      if (storedApiKey) setApiKey(storedApiKey);
      if (storedYoutubeKey) setYoutubeApiKey(storedYoutubeKey);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save YouTube API key
  const handleSaveYoutubeApiKey = async () => {
    try {
      await AsyncStorage.setItem('youtube_api_key', youtubeApiKey);
      setShowYoutubeApiInput(false);
      Alert.alert('Saved', 'YouTube API key saved. This enables video statistics for better sampling.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add log message
  const addLog = (message: string) => {
    setProcessingLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Add a curated channel
  const handleAddChannel = async () => {
    if (!newChannelUrl.trim()) {
      Alert.alert('Missing URL', 'Please enter a YouTube channel URL [ERR_NO_URL]');
      return;
    }

    console.log('[InterviewProcessor] Adding channel:', newChannelUrl);
    setAddingChannel(true);
    addLog(`Attempting to add channel: ${newChannelUrl}`);

    try {
      // Fetch channel info
      addLog('Fetching channel info from YouTube...');
      const result = await fetchChannelVideos(newChannelUrl, 1);

      console.log('[InterviewProcessor] Fetch result:', JSON.stringify(result, null, 2));
      addLog(`Fetch result: channelId=${result.channelId}, channelName=${result.channelName}, error=${result.error || 'none'}`);

      if (result.error) {
        console.error('[InterviewProcessor] Fetch error:', result.error);
        addLog(`ERROR: ${result.error}`);
        Alert.alert('Error [ERR_FETCH_FAILED]', result.error);
        return;
      }

      if (!result.channelId) {
        console.error('[InterviewProcessor] No channel ID returned');
        addLog('ERROR: No channel ID returned from YouTube');
        Alert.alert('Error [ERR_NO_CHANNEL_ID]', 'Could not determine channel ID. Try using the channel ID format (youtube.com/channel/UC...)');
        return;
      }

      addLog(`Adding channel to storage: ${result.channelName} (${result.channelId})`);
      await addCuratedChannel(
        newChannelUrl,
        result.channelId,
        result.channelName,
        newChannelCategory,
        'curated',
        `Added manually`
      );

      setNewChannelUrl('');
      setShowAddChannel(false);
      loadData();
      addLog(`SUCCESS: Added ${result.channelName}`);
      Alert.alert('Success', `Added ${result.channelName}`);
    } catch (error) {
      console.error('[InterviewProcessor] Add channel error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addLog(`EXCEPTION: ${errorMsg}`);
      Alert.alert('Error [ERR_EXCEPTION]', `Failed to add channel: ${errorMsg}`);
    } finally {
      setAddingChannel(false);
    }
  };

  // Add recommended channel (uses pre-populated channel IDs to avoid YouTube fetch)
  const handleAddRecommended = async (rec: typeof RECOMMENDED_CHANNELS[0]) => {
    setAddingChannel(true);
    try {
      const url = `https://www.youtube.com/@${rec.handle}`;

      // Use pre-populated channel ID if available (more reliable)
      if (rec.channelId) {
        await addCuratedChannel(
          url,
          rec.channelId,
          rec.name,
          rec.category,
          rec.trust,
          rec.description
        );
        loadData();
        Alert.alert('Success', `Added ${rec.name}`);
      } else {
        // Fallback to fetching from YouTube if no channelId
        const result = await fetchChannelVideos(url, 1);

        if (result.error || !result.channelId) {
          Alert.alert('Error', `Could not add ${rec.name}: ${result.error || 'Unknown error'}`);
          return;
        }

        await addCuratedChannel(
          url,
          result.channelId,
          rec.name,
          rec.category,
          rec.trust,
          rec.description
        );
        loadData();
        Alert.alert('Success', `Added ${rec.name}`);
      }
    } catch (error) {
      console.error('[InterviewProcessor] Add recommended error:', error);
      Alert.alert('Error', `Failed to add ${rec.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAddingChannel(false);
    }
  };

  // Remove channel
  const handleRemoveChannel = async (channel: CuratedChannel) => {
    Alert.alert('Remove Channel', `Remove ${channel.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeCuratedChannel(channel.channelId);
          loadData();
        },
      },
    ]);
  };

  // Process channel
  const handleProcessChannel = async () => {
    if (!selectedChannel) {
      Alert.alert('Select Channel', 'Please select a channel to process');
      return;
    }

    if (!apiKey) {
      Alert.alert('API Key Required', 'Please set your Claude API key in Settings → AI Coaching');
      return;
    }

    const numVideos = parseInt(videosToProcess) || 10;
    setProcessing(true);
    setProcessingLog([]);
    processingRef.current = true;

    addLog(`Starting processing for ${selectedChannel.name}...`);
    addLog(`Fetching ${numVideos} videos...`);

    try {
      // Fetch videos
      const { videos, error } = await fetchChannelVideos(selectedChannel.url, numVideos);

      if (error) {
        addLog(`Error: ${error}`);
        setProcessing(false);
        return;
      }

      addLog(`Found ${videos.length} videos to process`);

      // Create job
      const job = await createProcessingJob(
        selectedChannel.url,
        selectedChannel.name,
        selectedChannel.channelId,
        videos,
        ['emotional_struggles', 'humor_wit', 'companionship', 'vulnerability', 'growth_moments']
      );
      setCurrentJob(job);

      let totalInsights = 0;
      let totalFiltered = 0;

      // Process each video
      for (let i = 0; i < videos.length && processingRef.current; i++) {
        const video = videos[i];
        addLog(`[${i + 1}/${videos.length}] Processing: ${video.title.slice(0, 50)}...`);

        // Fetch transcript
        const { transcript, error: transcriptError } = await fetchVideoTranscript(video.videoId);

        if (transcriptError || !transcript) {
          addLog(`  ⚠ No transcript available, skipping`);
          continue;
        }

        addLog(`  ✓ Got transcript (${transcript.length} chars)`);

        // Extract insights
        const { insights, error: extractError } = await extractInsightsWithClaude(
          transcript,
          video.title,
          video.videoId,
          selectedChannel.name,
          ['emotional_struggles', 'humor_wit', 'companionship', 'vulnerability', 'growth_moments'],
          apiKey
        );

        if (extractError) {
          addLog(`  ⚠ Extraction error: ${extractError}`);
          continue;
        }

        addLog(`  ✓ Extracted ${insights.length} insights`);
        totalInsights += insights.length;

        // Save insights
        if (insights.length > 0) {
          await savePendingInsights(insights);
        }

        // Mark video processed
        await markVideoProcessed(video.videoId);

        // Update job
        await updateProcessingJob(job.id, {
          videosProcessed: i + 1,
          insightsFound: totalInsights,
          currentVideoIndex: i + 1,
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Complete job
      await updateProcessingJob(job.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      addLog(`\n✅ Processing complete!`);
      addLog(`Total insights extracted: ${totalInsights}`);

      // Refresh data
      loadData();

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
      processingRef.current = false;
    }
  };

  // Stop processing
  const handleStopProcessing = () => {
    processingRef.current = false;
    addLog('⏹ Stopping processing...');
  };

  // Approve insight
  const handleApproveInsight = async (insight: ExtractedInsight) => {
    await approvePendingInsight(insight.id);
    await updateQualityStats({ humanApproved: (qualityStats?.humanApproved || 0) + 1 });
    loadData();
    setSelectedInsight(null);
  };

  // Reject insight
  const handleRejectInsight = async (insight: ExtractedInsight) => {
    await rejectPendingInsight(insight.id, 'Rejected by user');
    await updateQualityStats({ humanRejected: (qualityStats?.humanRejected || 0) + 1 });
    loadData();
    setSelectedInsight(null);
  };

  // Render tabs
  const renderChannelsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* YouTube API Key Settings */}
      <View style={[styles.card, { backgroundColor: colors.cardBackground, marginBottom: 16 }]}>
        <Pressable
          style={styles.settingsHeader}
          onPress={() => setShowYoutubeApiInput(!showYoutubeApiInput)}
        >
          <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>
            YouTube API Settings
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 18 }}>
            {showYoutubeApiInput ? '−' : '+'}
          </Text>
        </Pressable>

        {showYoutubeApiInput && (
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.helperText, { color: colors.textSecondary, marginBottom: 8 }]}>
              Optional: Add a YouTube Data API v3 key to enable video statistics for better sampling.
              Get one free at console.cloud.google.com
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="AIza..."
              placeholderTextColor={colors.textSecondary}
              value={youtubeApiKey}
              onChangeText={setYoutubeApiKey}
              autoCapitalize="none"
              secureTextEntry
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              {youtubeApiKey ? (
                <Pressable
                  style={[styles.channelAction, { backgroundColor: '#F4433620', flex: 1 }]}
                  onPress={() => {
                    setYoutubeApiKey('');
                    AsyncStorage.removeItem('youtube_api_key');
                    Alert.alert('Cleared', 'YouTube API key removed');
                  }}
                >
                  <Text style={{ color: '#F44336', textAlign: 'center' }}>Clear Key</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={[styles.channelAction, { backgroundColor: colors.tint + '20', flex: 1 }]}
                onPress={handleSaveYoutubeApiKey}
              >
                <Text style={{ color: colors.tint, textAlign: 'center' }}>Save Key</Text>
              </Pressable>
            </View>
            {youtubeApiKey && (
              <Text style={[styles.helperText, { color: '#4CAF50', marginTop: 8 }]}>
                API key configured
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Add Channel Button */}
      <Pressable
        style={[styles.addButton, { backgroundColor: colors.tint }]}
        onPress={() => setShowAddChannel(true)}
      >
        <Text style={styles.addButtonText}>+ Add Channel</Text>
      </Pressable>

      {/* Current Channels */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Curated Channels ({channels.length})
      </Text>

      {channels.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No channels added yet. Add from recommendations below or paste a URL.
        </Text>
      ) : (
        channels.map(channel => (
          <View key={channel.id} style={[styles.channelCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.channelHeader}>
              <Text style={[styles.channelName, { color: colors.text }]}>{channel.name}</Text>
              <View style={[styles.trustBadge, { backgroundColor: channel.trustLevel === 'high' ? '#4CAF5030' : '#FF980030' }]}>
                <Text style={{ color: channel.trustLevel === 'high' ? '#4CAF50' : '#FF9800', fontSize: 11 }}>
                  {channel.trustLevel}
                </Text>
              </View>
            </View>
            <Text style={[styles.channelCategory, { color: colors.textSecondary }]}>
              {CHANNEL_CATEGORIES.find(c => c.value === channel.category)?.label || channel.category}
            </Text>
            <Text style={[styles.channelDesc, { color: colors.textSecondary }]} numberOfLines={2}>
              {channel.description}
            </Text>
            <View style={styles.channelStats}>
              <Text style={[styles.channelStat, { color: colors.textSecondary }]}>
                Videos: {channel.videosProcessed}
              </Text>
              <Text style={[styles.channelStat, { color: colors.textSecondary }]}>
                Insights: {channel.insightsExtracted}
              </Text>
            </View>
            <View style={styles.channelActions}>
              <Pressable
                style={[styles.channelAction, { backgroundColor: colors.tint + '20' }]}
                onPress={() => {
                  setSelectedChannel(channel);
                  setActiveTab('process');
                }}
              >
                <Text style={{ color: colors.tint }}>Process</Text>
              </Pressable>
              <Pressable
                style={[styles.channelAction, { backgroundColor: '#F4433620' }]}
                onPress={() => handleRemoveChannel(channel)}
              >
                <Text style={{ color: '#F44336' }}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}

      {/* Recommended Channels */}
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
        Recommended Channels
      </Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
        High-quality sources for human insights
      </Text>

      {RECOMMENDED_CHANNELS.filter(rec => !channels.find(c => c.name === rec.name)).map(rec => (
        <View key={rec.handle} style={[styles.recCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.recHeader}>
            <Text style={[styles.recName, { color: colors.text }]}>{rec.name}</Text>
            <View style={[styles.trustBadge, { backgroundColor: '#4CAF5030' }]}>
              <Text style={{ color: '#4CAF50', fontSize: 11 }}>recommended</Text>
            </View>
          </View>
          <Text style={[styles.recCategory, { color: colors.tint }]}>
            {CHANNEL_CATEGORIES.find(c => c.value === rec.category)?.label}
          </Text>
          <Text style={[styles.recDesc, { color: colors.textSecondary }]}>{rec.description}</Text>
          <Pressable
            style={[styles.addRecButton, { borderColor: colors.tint }]}
            onPress={() => handleAddRecommended(rec)}
            disabled={addingChannel}
          >
            {addingChannel ? (
              <ActivityIndicator size="small" color={colors.tint} />
            ) : (
              <Text style={{ color: colors.tint }}>+ Add Channel</Text>
            )}
          </Pressable>
        </View>
      ))}

      {/* Add Channel Modal */}
      <Modal visible={showAddChannel} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add YouTube Channel</Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Channel URL</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              placeholder="https://www.youtube.com/@channelname"
              placeholderTextColor={colors.textSecondary}
              value={newChannelUrl}
              onChangeText={setNewChannelUrl}
              autoCapitalize="none"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CHANNEL_CATEGORIES.map(cat => (
                <Pressable
                  key={cat.value}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: newChannelCategory === cat.value ? colors.tint : colors.border }
                  ]}
                  onPress={() => setNewChannelCategory(cat.value)}
                >
                  <Text style={{ color: newChannelCategory === cat.value ? '#fff' : colors.text, fontSize: 12 }}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowAddChannel(false)}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={handleAddChannel}
                disabled={addingChannel}
              >
                {addingChannel ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff' }}>Add Channel</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );

  const renderProcessTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Channel Selection */}
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Select Channel</Text>

        {channels.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Add channels first in the Channels tab
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {channels.map(channel => (
              <Pressable
                key={channel.id}
                style={[
                  styles.channelChip,
                  {
                    backgroundColor: selectedChannel?.id === channel.id ? colors.tint : colors.border,
                  }
                ]}
                onPress={() => setSelectedChannel(channel)}
              >
                <Text style={{ color: selectedChannel?.id === channel.id ? '#fff' : colors.text }}>
                  {channel.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Processing Options */}
      {selectedChannel && (
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Processing Options</Text>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Videos to Process</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={videosToProcess}
            onChangeText={setVideosToProcess}
            keyboardType="number-pad"
            placeholder="10"
          />

          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Processes random videos from the channel's most recent uploads.
            Each video costs ~$0.01-0.05 in API calls.
          </Text>

          {!processing ? (
            <Pressable
              style={[styles.processButton, { backgroundColor: colors.tint }]}
              onPress={handleProcessChannel}
            >
              <Text style={styles.processButtonText}>Start Processing</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.processButton, { backgroundColor: '#F44336' }]}
              onPress={handleStopProcessing}
            >
              <Text style={styles.processButtonText}>Stop Processing</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Processing Log */}
      {processingLog.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Processing Log</Text>
          <ScrollView style={styles.logContainer}>
            {processingLog.map((log, i) => (
              <Text key={i} style={[styles.logText, { color: colors.textSecondary }]}>
                {log}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );

  const renderReviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Stats Summary */}
      <View style={[styles.statsRow, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: colors.tint }]}>{pendingInsights.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{approvedInsights.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Approved</Text>
        </View>
      </View>

      {/* Pending Insights */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Pending Review ({pendingInsights.length})
      </Text>

      {pendingInsights.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No insights pending review. Process some videos first!
        </Text>
      ) : (
        pendingInsights.slice(0, 20).map(insight => (
          <Pressable
            key={insight.id}
            style={[styles.insightCard, { backgroundColor: colors.cardBackground }]}
            onPress={() => setSelectedInsight(insight)}
          >
            <View style={styles.insightHeader}>
              <Text style={[styles.insightTitle, { color: colors.text }]} numberOfLines={1}>
                {insight.title}
              </Text>
              <View style={[
                styles.qualityBadge,
                { backgroundColor: insight.qualityScore >= 80 ? '#4CAF5030' : insight.qualityScore >= 60 ? '#FF980030' : '#F4433630' }
              ]}>
                <Text style={{
                  color: insight.qualityScore >= 80 ? '#4CAF50' : insight.qualityScore >= 60 ? '#FF9800' : '#F44336',
                  fontSize: 11
                }}>
                  {insight.qualityScore}%
                </Text>
              </View>
            </View>
            <Text style={[styles.insightSource, { color: colors.tint }]}>
              {insight.channelName}
            </Text>
            <Text style={[styles.insightText, { color: colors.textSecondary }]} numberOfLines={2}>
              {insight.insight}
            </Text>
            {insight.needsHumanReview && (
              <View style={[styles.reviewFlag, { backgroundColor: '#FF980020' }]}>
                <Text style={{ color: '#FF9800', fontSize: 11 }}>Needs careful review</Text>
              </View>
            )}
          </Pressable>
        ))
      )}

      {/* Insight Detail Modal */}
      <Modal visible={!!selectedInsight} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.insightModal, { backgroundColor: colors.cardBackground }]}>
            {selectedInsight && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedInsight.title}</Text>

                <Pressable onPress={() => Linking.openURL(selectedInsight.videoUrl)}>
                  <Text style={[styles.videoLink, { color: colors.tint }]}>
                    From: {selectedInsight.videoTitle} →
                  </Text>
                </Pressable>

                <View style={styles.insightMetaRow}>
                  <View style={[styles.metaBadge, { backgroundColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontSize: 11 }}>Quality: {selectedInsight.qualityScore}%</Text>
                  </View>
                  <View style={[styles.metaBadge, { backgroundColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontSize: 11 }}>Confidence: {Math.round(selectedInsight.confidenceScore * 100)}%</Text>
                  </View>
                  <View style={[styles.metaBadge, { backgroundColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontSize: 11 }}>{selectedInsight.emotionalTone}</Text>
                  </View>
                </View>

                <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Insight</Text>
                <Text style={[styles.insightFullText, { color: colors.text }]}>{selectedInsight.insight}</Text>

                {selectedInsight.quotes.length > 0 && (
                  <>
                    <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Quotes</Text>
                    {selectedInsight.quotes.map((quote, i) => (
                      <Text key={i} style={[styles.quoteText, { color: colors.text }]}>"{quote}"</Text>
                    ))}
                  </>
                )}

                <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Coaching Implication</Text>
                <Text style={[styles.insightFullText, { color: colors.text }]}>{selectedInsight.coachingImplication}</Text>

                {selectedInsight.antiPatterns && selectedInsight.antiPatterns.length > 0 && (
                  <>
                    <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Anti-Patterns (What NOT to do)</Text>
                    {selectedInsight.antiPatterns.map((ap, i) => (
                      <Text key={i} style={[styles.antiPatternText, { color: '#F44336' }]}>• {ap}</Text>
                    ))}
                  </>
                )}

                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.modalButton, { backgroundColor: '#F44336' }]}
                    onPress={() => handleRejectInsight(selectedInsight)}
                  >
                    <Text style={{ color: '#fff' }}>Reject</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalButton, { backgroundColor: colors.border }]}
                    onPress={() => setSelectedInsight(null)}
                  >
                    <Text style={{ color: colors.text }}>Close</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
                    onPress={() => handleApproveInsight(selectedInsight)}
                  >
                    <Text style={{ color: '#fff' }}>Approve</Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );

  const renderStatsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Training Data Stats</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{channels.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Channels</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{pendingInsights.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>{approvedInsights.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Approved</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {qualityStats?.humanRejected || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rejected</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Quality Metrics</Text>

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Avg Quality Score</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {qualityStats?.avgQualityScore?.toFixed(0) || 0}%
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Approval Rate</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {approvedInsights.length + (qualityStats?.humanRejected || 0) > 0
              ? Math.round((approvedInsights.length / (approvedInsights.length + (qualityStats?.humanRejected || 0))) * 100)
              : 0}%
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Duplicates Filtered</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {qualityStats?.duplicatesRemoved || 0}
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Training Readiness</Text>

        <View style={styles.readinessItem}>
          <Text style={[styles.readinessLabel, { color: colors.textSecondary }]}>
            Approved Insights
          </Text>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[
              styles.progressFill,
              { width: `${Math.min((approvedInsights.length / 50) * 100, 100)}%`, backgroundColor: colors.tint }
            ]} />
          </View>
          <Text style={[styles.readinessValue, { color: colors.text }]}>
            {approvedInsights.length} / 50 minimum
          </Text>
        </View>

        <Text style={[styles.readinessNote, { color: colors.textSecondary }]}>
          For effective fine-tuning, aim for 50-100 high-quality approved insights minimum.
          More data = better results.
        </Text>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'channels': return renderChannelsTab();
      case 'process': return renderProcessTab();
      case 'review': return renderReviewTab();
      case 'stats': return renderStatsTab();
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={20}>
          <Text style={[styles.backButton, { color: colors.tint }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Interview Processor</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['channels', 'process', 'review', 'stats'] as Tab[]).map(tab => (
          <Pressable
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: colors.tint, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.tint : colors.textSecondary }]}>
              {tab === 'channels' ? 'Channels' :
               tab === 'process' ? 'Process' :
               tab === 'review' ? `Review (${pendingInsights.length})` :
               'Stats'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {renderTabContent()}
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
    paddingVertical: 12,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  addButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 14,
  },
  channelCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  channelName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  trustBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  channelCategory: {
    fontSize: 12,
    marginBottom: 4,
  },
  channelDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  channelStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  channelStat: {
    fontSize: 12,
  },
  channelActions: {
    flexDirection: 'row',
    gap: 8,
  },
  channelAction: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  recCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  recHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recName: {
    fontSize: 15,
    fontWeight: '600',
  },
  recCategory: {
    fontSize: 12,
    marginBottom: 4,
  },
  recDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  addRecButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  channelChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  processButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  processButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  logContainer: {
    maxHeight: 300,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
    padding: 12,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  insightCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  insightSource: {
    fontSize: 12,
    marginBottom: 6,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 18,
  },
  reviewFlag: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  insightModal: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  videoLink: {
    fontSize: 13,
    marginBottom: 12,
  },
  insightMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  insightLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  insightFullText: {
    fontSize: 14,
    lineHeight: 20,
  },
  quoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 6,
  },
  antiPatternText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  metricLabel: {
    fontSize: 14,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  readinessItem: {
    marginBottom: 16,
  },
  readinessLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  readinessValue: {
    fontSize: 13,
  },
  readinessNote: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
