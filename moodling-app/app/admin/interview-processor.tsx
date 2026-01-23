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

type Tab = 'channels' | 'batch' | 'process' | 'review' | 'stats';

// Batch processing state
interface BatchQueueItem {
  channel: CuratedChannel | typeof RECOMMENDED_CHANNELS[0];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  videosProcessed?: number;
  insightsFound?: number;
  error?: string;
}

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

  // === COMMUNICATION & NVC ===
  { name: 'NVC Marshall Rosenberg', handle: 'NonviolentCommunicationNVC', channelId: 'UC2iuX2CG6jgCgHVfMM7w3Yw', category: 'relationships_love' as ChannelCategory, trust: 'high' as const, description: 'Marshall Rosenberg - Nonviolent Communication (NVC): observations, feelings, needs, requests' },
  { name: 'Center for Nonviolent Communication', handle: 'CNVC', channelId: 'UCnYIS6HlFTpkNpkrXLvxOaw', category: 'relationships_love' as ChannelCategory, trust: 'high' as const, description: 'Official CNVC channel - NVC training, workshops, compassionate communication' },

  // === MEN'S EMOTIONAL HEALTH ===
  { name: 'Lewis Howes', handle: 'LewisHowes', channelId: 'UCQjBpfPj72zwYFpS7U7gd_A', category: 'vulnerability_authenticity' as ChannelCategory, trust: 'high' as const, description: 'School of Greatness - men\'s mental health, vulnerability, growth' },
  { name: 'The Minimalists', handle: 'TheMinimalists', channelId: 'UCRPrmdh5FLt4bxWgvQ8SWOg', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Joshua & Ryan - intentional living, meaning over materialism' },
  { name: 'Rich Roll', handle: 'richroll', channelId: 'UCOF0J3ms6IeZZCOp-jJMuXQ', category: 'vulnerability_authenticity' as ChannelCategory, trust: 'high' as const, description: 'Plant-powered living, addiction recovery, men\'s transformation' },

  // === GUIDED MEDITATION ===
  { name: 'Michael Sealey', handle: 'MichaelSealey', channelId: 'UC9GoqsWjluXVSKHO4Wistbw', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Guided meditations, hypnotherapy, sleep and relaxation' },
  { name: 'The Honest Guys', handle: 'thehonestguys', channelId: 'UC7tD6Ifrwbiy-BoaAHEinmQ', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Guided meditations, relaxation, sleep stories' },
  { name: 'Jason Stephenson', handle: 'JasonStephensonSleep', channelId: 'UCqDBSTeuGa1e3MSqG_nq2Uw', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Sleep meditation, guided relaxation, anxiety relief' },

  // === ADDICTION & RECOVERY ===
  // Curated for compassionate, trauma-informed, non-judgmental approach to addiction
  { name: 'Gabor Maté', handle: 'DrGaborMate', channelId: 'UC6JLfDwuqC6OmJAqVVn5f7w', category: 'addiction_recovery' as ChannelCategory, trust: 'high' as const, description: 'Trauma-informed addiction specialist, compassionate approach to understanding addiction' },
  { name: 'Russell Brand', handle: 'RussellBrand', channelId: 'UCswH8ovgUp5Bdg-0_JTYFNw', category: 'addiction_recovery' as ChannelCategory, trust: 'high' as const, description: 'Recovered addict, spiritual approach to recovery, raw and authentic' },
  { name: 'Annie Grace', handle: 'ThisNakedMind', channelId: 'UCDSEuXPwLJh4zLrVbYXj0Nw', category: 'addiction_recovery' as ChannelCategory, trust: 'high' as const, description: 'This Naked Mind - alcohol freedom without shame, science-based' },
  { name: 'After Prison Show', handle: 'AfterPrisonShow', channelId: 'UCo2LGlvPwPJ_vD-dN8FdT8w', category: 'addiction_recovery' as ChannelCategory, trust: 'high' as const, description: 'Joe Guerrero - real talk about addiction, recovery, and life after prison' },
  { name: 'Recovery Elevator', handle: 'RecoveryElevator', channelId: 'UChvKBUy9eLU-5xVz2Rre7-g', category: 'addiction_recovery' as ChannelCategory, trust: 'high' as const, description: 'Paul Churchill - podcast about alcohol recovery, community-focused' },
  { name: 'Club Soda', handle: 'ClubSodaUK', channelId: 'UC8oCJLZ_DLu7e5Qu3qbqRQw', category: 'addiction_recovery' as ChannelCategory, trust: 'high' as const, description: 'Mindful drinking movement, harm reduction, choice without judgment' },
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

  // Progress tracking state
  const [progressState, setProgressState] = useState<{
    phase: 'idle' | 'fetching_videos' | 'processing' | 'complete' | 'error';
    currentVideo: number;
    totalVideos: number;
    currentVideoTitle: string;
    currentStep: 'transcript' | 'extracting' | 'saving' | 'done';
    insightsFound: number;
    videosSkipped: number;
    startTime: number | null;
    estimatedTimeRemaining: string;
  }>({
    phase: 'idle',
    currentVideo: 0,
    totalVideos: 0,
    currentVideoTitle: '',
    currentStep: 'transcript',
    insightsFound: 0,
    videosSkipped: 0,
    startTime: null,
    estimatedTimeRemaining: '',
  });

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

  // Batch processing state
  const [batchQueue, setBatchQueue] = useState<BatchQueueItem[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchPaused, setBatchPaused] = useState(false);
  const [batchVideosPerChannel, setBatchVideosPerChannel] = useState('5');
  const [batchProgress, setBatchProgress] = useState({
    currentChannelIndex: 0,
    totalChannels: 0,
    totalInsights: 0,
    totalVideosProcessed: 0,
    totalSkipped: 0,
  });
  const batchProcessingRef = useRef(false);
  const batchPausedRef = useRef(false);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [channelsData, pendingData, approvedData, statsData, storedApiKey, storedYoutubeKey] = await Promise.all([
        getCuratedChannels(),
        getPendingInsights(),
        getApprovedInsights(),
        getQualityStats(),
        AsyncStorage.getItem('moodling_claude_api_key'),
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
    console.log('[InterviewProcessor] Saving YouTube API key, length:', youtubeApiKey?.length);
    if (!youtubeApiKey || !youtubeApiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key first');
      return;
    }
    try {
      await AsyncStorage.setItem('youtube_api_key', youtubeApiKey.trim());
      setShowYoutubeApiInput(false);
      console.log('[InterviewProcessor] YouTube API key saved successfully');
      Alert.alert('Saved', 'YouTube API key saved. This enables video statistics for better sampling.');
    } catch (error) {
      console.error('[InterviewProcessor] Failed to save YouTube API key:', error);
      Alert.alert('Error', `Failed to save API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Calculate estimated time remaining
  const calculateETA = (currentVideo: number, totalVideos: number, startTime: number): string => {
    if (currentVideo === 0) return 'Calculating...';
    const elapsed = Date.now() - startTime;
    const avgTimePerVideo = elapsed / currentVideo;
    const remaining = avgTimePerVideo * (totalVideos - currentVideo);

    if (remaining < 60000) {
      return `~${Math.round(remaining / 1000)}s remaining`;
    } else {
      return `~${Math.round(remaining / 60000)}m remaining`;
    }
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

    // Initialize progress state
    const startTime = Date.now();
    setProgressState({
      phase: 'fetching_videos',
      currentVideo: 0,
      totalVideos: numVideos,
      currentVideoTitle: '',
      currentStep: 'transcript',
      insightsFound: 0,
      videosSkipped: 0,
      startTime,
      estimatedTimeRemaining: 'Calculating...',
    });

    addLog(`Starting processing for ${selectedChannel.name}...`);
    addLog(`Fetching ${numVideos} videos...`);

    try {
      // Fetch videos
      const { videos, error } = await fetchChannelVideos(selectedChannel.url, numVideos);

      if (error) {
        addLog(`Error: ${error}`);
        setProgressState(prev => ({ ...prev, phase: 'error' }));
        setProcessing(false);
        return;
      }

      addLog(`Found ${videos.length} videos to process`);

      // Update progress with actual video count
      setProgressState(prev => ({
        ...prev,
        phase: 'processing',
        totalVideos: videos.length,
      }));

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
      let videosSkipped = 0;

      // Process each video
      for (let i = 0; i < videos.length && processingRef.current; i++) {
        const video = videos[i];

        // Update progress - starting new video
        setProgressState(prev => ({
          ...prev,
          currentVideo: i + 1,
          currentVideoTitle: video.title.slice(0, 60),
          currentStep: 'transcript',
          estimatedTimeRemaining: calculateETA(i, videos.length, startTime),
        }));

        addLog(`[${i + 1}/${videos.length}] Processing: ${video.title.slice(0, 50)}...`);

        // Fetch transcript
        const { transcript, error: transcriptError } = await fetchVideoTranscript(video.videoId);

        if (transcriptError || !transcript) {
          addLog(`  ⚠ No transcript available, skipping`);
          videosSkipped++;
          setProgressState(prev => ({ ...prev, videosSkipped }));
          continue;
        }

        addLog(`  ✓ Got transcript (${transcript.length} chars)`);

        // Update progress - extracting insights
        setProgressState(prev => ({ ...prev, currentStep: 'extracting' }));

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
          videosSkipped++;
          setProgressState(prev => ({ ...prev, videosSkipped }));
          continue;
        }

        addLog(`  ✓ Extracted ${insights.length} insights`);
        totalInsights += insights.length;

        // Update progress - saving
        setProgressState(prev => ({
          ...prev,
          currentStep: 'saving',
          insightsFound: totalInsights,
        }));

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

        // Update progress - done with this video
        setProgressState(prev => ({
          ...prev,
          currentStep: 'done',
          estimatedTimeRemaining: calculateETA(i + 1, videos.length, startTime),
        }));

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Complete job
      await updateProcessingJob(job.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      // Update progress - complete
      setProgressState(prev => ({
        ...prev,
        phase: 'complete',
        currentStep: 'done',
        estimatedTimeRemaining: 'Complete!',
      }));

      addLog(`\n✅ Processing complete!`);
      addLog(`Total insights extracted: ${totalInsights}`);
      addLog(`Videos skipped (no transcript): ${videosSkipped}`);

      // Refresh data
      loadData();

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProgressState(prev => ({ ...prev, phase: 'error' }));
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

  // ============================================
  // BATCH PROCESSING FUNCTIONS
  // ============================================

  // Add recommended channel to batch queue
  const handleAddToBatchQueue = (rec: typeof RECOMMENDED_CHANNELS[0]) => {
    // Check if already in queue
    if (batchQueue.find(item => 'handle' in item.channel && item.channel.handle === rec.handle)) {
      return;
    }
    setBatchQueue(prev => [...prev, { channel: rec, status: 'pending' }]);
  };

  // Add all recommended channels to batch queue
  const handleAddAllRecommended = () => {
    const notAdded = RECOMMENDED_CHANNELS.filter(rec =>
      !channels.find(c => c.name === rec.name) &&
      !batchQueue.find(item => 'handle' in item.channel && item.channel.handle === rec.handle)
    );
    const newItems: BatchQueueItem[] = notAdded.map(rec => ({ channel: rec, status: 'pending' }));
    setBatchQueue(prev => [...prev, ...newItems]);
  };

  // Add existing channels to batch queue
  const handleAddChannelsToBatch = () => {
    const notInQueue = channels.filter(c =>
      !batchQueue.find(item => 'channelId' in item.channel && item.channel.channelId === c.channelId)
    );
    const newItems: BatchQueueItem[] = notInQueue.map(c => ({ channel: c, status: 'pending' }));
    setBatchQueue(prev => [...prev, ...newItems]);
  };

  // Remove from batch queue
  const handleRemoveFromBatchQueue = (index: number) => {
    setBatchQueue(prev => prev.filter((_, i) => i !== index));
  };

  // Clear batch queue
  const handleClearBatchQueue = () => {
    if (!batchProcessing) {
      setBatchQueue([]);
    }
  };

  // Pause batch processing
  const handlePauseBatch = () => {
    batchPausedRef.current = true;
    setBatchPaused(true);
    addLog('⏸ Pausing batch processing...');
  };

  // Resume batch processing
  const handleResumeBatch = () => {
    batchPausedRef.current = false;
    setBatchPaused(false);
    addLog('▶ Resuming batch processing...');
  };

  // Stop batch processing
  const handleStopBatch = () => {
    batchProcessingRef.current = false;
    batchPausedRef.current = false;
    setBatchPaused(false);
    addLog('⏹ Stopping batch processing...');
  };

  // Start batch processing
  const handleStartBatchProcessing = async () => {
    if (batchQueue.length === 0) {
      Alert.alert('Empty Queue', 'Add channels to the batch queue first');
      return;
    }

    if (!apiKey) {
      Alert.alert('API Key Required', 'Please set your Claude API key in Settings → AI Coaching');
      return;
    }

    const numVideos = parseInt(batchVideosPerChannel) || 5;
    setBatchProcessing(true);
    batchProcessingRef.current = true;
    batchPausedRef.current = false;
    setProcessingLog([]);

    addLog(`Starting batch processing of ${batchQueue.length} channels...`);
    addLog(`Videos per channel: ${numVideos}`);

    setBatchProgress({
      currentChannelIndex: 0,
      totalChannels: batchQueue.length,
      totalInsights: 0,
      totalVideosProcessed: 0,
      totalSkipped: 0,
    });

    let totalInsightsAllChannels = 0;
    let totalVideosAllChannels = 0;
    let totalSkippedAllChannels = 0;

    for (let channelIndex = 0; channelIndex < batchQueue.length && batchProcessingRef.current; channelIndex++) {
      // Check for pause
      while (batchPausedRef.current && batchProcessingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!batchProcessingRef.current) break;

      const queueItem = batchQueue[channelIndex];
      const channelInfo = queueItem.channel;

      addLog(`\n[${ channelIndex + 1}/${batchQueue.length}] Processing: ${'name' in channelInfo ? channelInfo.name : channelInfo.name}`);

      // Update queue item status
      setBatchQueue(prev => prev.map((item, i) =>
        i === channelIndex ? { ...item, status: 'processing' } : item
      ));

      setBatchProgress(prev => ({
        ...prev,
        currentChannelIndex: channelIndex + 1,
      }));

      try {
        // First, ensure the channel is added (for recommended channels)
        let channel: CuratedChannel;

        if ('handle' in channelInfo) {
          // It's a recommended channel, add it first
          const rec = channelInfo as typeof RECOMMENDED_CHANNELS[0];
          const url = `https://www.youtube.com/@${rec.handle}`;

          if (rec.channelId) {
            await addCuratedChannel(url, rec.channelId, rec.name, rec.category, rec.trust, rec.description);
          } else {
            const result = await fetchChannelVideos(url, 1);
            if (result.error || !result.channelId) {
              throw new Error(result.error || 'Could not get channel ID');
            }
            await addCuratedChannel(url, result.channelId, rec.name, rec.category, rec.trust, rec.description);
          }

          // Reload channels to get the newly added one
          const updatedChannels = await getCuratedChannels();
          channel = updatedChannels.find(c => c.name === rec.name)!;

          if (!channel) {
            throw new Error('Channel was not added properly');
          }
        } else {
          channel = channelInfo as CuratedChannel;
        }

        // Fetch videos
        addLog(`  Fetching ${numVideos} videos...`);
        const { videos, error } = await fetchChannelVideos(channel.url, numVideos);

        if (error) {
          throw new Error(error);
        }

        if (videos.length === 0) {
          addLog(`  ⚠ No videos found, skipping`);
          setBatchQueue(prev => prev.map((item, i) =>
            i === channelIndex ? { ...item, status: 'skipped', error: 'No videos found' } : item
          ));
          continue;
        }

        addLog(`  Found ${videos.length} videos`);

        let channelInsights = 0;
        let channelVideosProcessed = 0;
        let channelSkipped = 0;

        // Process each video
        for (let i = 0; i < videos.length && batchProcessingRef.current; i++) {
          // Check for pause
          while (batchPausedRef.current && batchProcessingRef.current) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          if (!batchProcessingRef.current) break;

          const video = videos[i];
          addLog(`    [${i + 1}/${videos.length}] ${video.title.slice(0, 40)}...`);

          // Fetch transcript
          const { transcript, error: transcriptError } = await fetchVideoTranscript(video.videoId);

          if (transcriptError || !transcript) {
            addLog(`      ⚠ No transcript, skipping`);
            channelSkipped++;
            continue;
          }

          // Extract insights
          const { insights, error: extractError } = await extractInsightsWithClaude(
            transcript,
            video.title,
            video.videoId,
            channel.name,
            ['emotional_struggles', 'humor_wit', 'companionship', 'vulnerability', 'growth_moments'],
            apiKey
          );

          if (extractError) {
            addLog(`      ⚠ Extraction error: ${extractError}`);
            channelSkipped++;
            continue;
          }

          addLog(`      ✓ ${insights.length} insights`);
          channelInsights += insights.length;
          channelVideosProcessed++;

          if (insights.length > 0) {
            await savePendingInsights(insights);
          }

          await markVideoProcessed(video.videoId);

          // Small delay
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        totalInsightsAllChannels += channelInsights;
        totalVideosAllChannels += channelVideosProcessed;
        totalSkippedAllChannels += channelSkipped;

        // Update queue item
        setBatchQueue(prev => prev.map((item, i) =>
          i === channelIndex ? {
            ...item,
            status: 'completed',
            videosProcessed: channelVideosProcessed,
            insightsFound: channelInsights,
          } : item
        ));

        setBatchProgress(prev => ({
          ...prev,
          totalInsights: totalInsightsAllChannels,
          totalVideosProcessed: totalVideosAllChannels,
          totalSkipped: totalSkippedAllChannels,
        }));

        addLog(`  ✓ Channel complete: ${channelInsights} insights from ${channelVideosProcessed} videos`);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        addLog(`  ❌ Error: ${errorMsg}`);

        setBatchQueue(prev => prev.map((item, i) =>
          i === channelIndex ? { ...item, status: 'failed', error: errorMsg } : item
        ));
      }

      // Delay between channels
      if (channelIndex < batchQueue.length - 1 && batchProcessingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    addLog(`\n✅ Batch processing complete!`);
    addLog(`Total: ${totalInsightsAllChannels} insights from ${totalVideosAllChannels} videos`);
    addLog(`Skipped: ${totalSkippedAllChannels} videos (no transcript)`);

    setBatchProcessing(false);
    batchProcessingRef.current = false;

    // Refresh data
    loadData();
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
              autoCorrect={false}
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

  // ============================================
  // BATCH TAB RENDERER
  // ============================================

  const renderBatchTab = () => {
    const queueProgress = batchQueue.length > 0
      ? Math.round((batchProgress.currentChannelIndex / batchQueue.length) * 100)
      : 0;

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Batch Controls */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Batch Processing</Text>
          <Text style={[styles.helperText, { color: colors.textSecondary, marginTop: 0 }]}>
            Process multiple channels automatically with pause/resume
          </Text>

          {/* Videos per channel */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>
            Videos per Channel
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            value={batchVideosPerChannel}
            onChangeText={setBatchVideosPerChannel}
            keyboardType="number-pad"
            placeholder="5"
            editable={!batchProcessing}
          />

          {/* Quick add buttons */}
          {!batchProcessing && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Pressable
                style={[styles.addRecButton, { borderColor: colors.tint, flex: 1 }]}
                onPress={handleAddAllRecommended}
              >
                <Text style={{ color: colors.tint, fontSize: 12 }}>+ All Recommended</Text>
              </Pressable>
              <Pressable
                style={[styles.addRecButton, { borderColor: colors.tint, flex: 1 }]}
                onPress={handleAddChannelsToBatch}
              >
                <Text style={{ color: colors.tint, fontSize: 12 }}>+ My Channels</Text>
              </Pressable>
            </View>
          )}

          {/* Start/Stop/Pause buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            {!batchProcessing ? (
              <Pressable
                style={[styles.processButton, { backgroundColor: colors.tint, flex: 1 }]}
                onPress={handleStartBatchProcessing}
                disabled={batchQueue.length === 0}
              >
                <Text style={styles.processButtonText}>
                  Start Batch ({batchQueue.filter(q => q.status === 'pending').length})
                </Text>
              </Pressable>
            ) : (
              <>
                {batchPaused ? (
                  <Pressable
                    style={[styles.processButton, { backgroundColor: '#4CAF50', flex: 1 }]}
                    onPress={handleResumeBatch}
                  >
                    <Text style={styles.processButtonText}>▶ Resume</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[styles.processButton, { backgroundColor: '#FF9800', flex: 1 }]}
                    onPress={handlePauseBatch}
                  >
                    <Text style={styles.processButtonText}>⏸ Pause</Text>
                  </Pressable>
                )}
                <Pressable
                  style={[styles.processButton, { backgroundColor: '#F44336', flex: 1 }]}
                  onPress={handleStopBatch}
                >
                  <Text style={styles.processButtonText}>⏹ Stop</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* Batch Progress */}
        {batchProcessing && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>
                {batchPaused ? '⏸ Paused' : 'Processing...'}
              </Text>
              {!batchPaused && <ActivityIndicator size="small" color={colors.tint} />}
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={[styles.progressLabel, { color: colors.text }]}>
                  Channel {batchProgress.currentChannelIndex} of {batchQueue.length}
                </Text>
                <Text style={[styles.progressPercent, { color: colors.tint }]}>
                  {queueProgress}%
                </Text>
              </View>
              <View style={[styles.progressBarLarge, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFillLarge,
                    { width: `${queueProgress}%`, backgroundColor: colors.tint }
                  ]}
                />
              </View>
            </View>

            <View style={styles.processingStats}>
              <View style={styles.processingStat}>
                <Text style={[styles.processingStatValue, { color: '#4CAF50' }]}>
                  {batchProgress.totalInsights}
                </Text>
                <Text style={[styles.processingStatLabel, { color: colors.textSecondary }]}>
                  Insights
                </Text>
              </View>
              <View style={styles.processingStat}>
                <Text style={[styles.processingStatValue, { color: colors.text }]}>
                  {batchProgress.totalVideosProcessed}
                </Text>
                <Text style={[styles.processingStatLabel, { color: colors.textSecondary }]}>
                  Videos
                </Text>
              </View>
              <View style={styles.processingStat}>
                <Text style={[styles.processingStatValue, { color: '#FF9800' }]}>
                  {batchProgress.totalSkipped}
                </Text>
                <Text style={[styles.processingStatLabel, { color: colors.textSecondary }]}>
                  Skipped
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Batch Queue */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Queue ({batchQueue.length})
          </Text>
          {batchQueue.length > 0 && !batchProcessing && (
            <Pressable onPress={handleClearBatchQueue}>
              <Text style={{ color: '#F44336', fontSize: 13 }}>Clear All</Text>
            </Pressable>
          )}
        </View>

        {batchQueue.length === 0 ? (
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary, marginVertical: 8 }]}>
              Add channels to the queue below, then start batch processing
            </Text>
          </View>
        ) : (
          batchQueue.map((item, index) => {
            const name = 'name' in item.channel ? item.channel.name : item.channel.name;
            const statusColor = item.status === 'completed' ? '#4CAF50' :
                               item.status === 'processing' ? colors.tint :
                               item.status === 'failed' ? '#F44336' :
                               item.status === 'skipped' ? '#FF9800' : colors.textSecondary;
            const statusIcon = item.status === 'completed' ? '✓' :
                              item.status === 'processing' ? '⚙' :
                              item.status === 'failed' ? '✗' :
                              item.status === 'skipped' ? '⊘' : '○';

            return (
              <View key={index} style={[styles.queueItem, { backgroundColor: colors.cardBackground }]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.queueItemStatus, { color: statusColor }]}>
                      {statusIcon}
                    </Text>
                    <Text style={[styles.queueItemName, { color: colors.text }]} numberOfLines={1}>
                      {name}
                    </Text>
                  </View>
                  {item.status === 'completed' && (
                    <Text style={[styles.queueItemMeta, { color: colors.textSecondary }]}>
                      {item.insightsFound} insights from {item.videosProcessed} videos
                    </Text>
                  )}
                  {item.status === 'failed' && (
                    <Text style={[styles.queueItemMeta, { color: '#F44336' }]}>
                      {item.error}
                    </Text>
                  )}
                </View>
                {!batchProcessing && item.status === 'pending' && (
                  <Pressable onPress={() => handleRemoveFromBatchQueue(index)} hitSlop={10}>
                    <Text style={{ color: '#F44336', fontSize: 18 }}>×</Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}

        {/* Add from Recommended */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
          Add from Recommended
        </Text>

        {RECOMMENDED_CHANNELS.filter(rec =>
          !channels.find(c => c.name === rec.name) &&
          !batchQueue.find(item => 'handle' in item.channel && item.channel.handle === rec.handle)
        ).slice(0, 10).map(rec => (
          <View key={rec.handle} style={[styles.queueItem, { backgroundColor: colors.cardBackground }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.queueItemName, { color: colors.text }]}>{rec.name}</Text>
              <Text style={[styles.queueItemMeta, { color: colors.textSecondary }]}>{rec.category.replace(/_/g, ' ')}</Text>
            </View>
            <Pressable
              style={[styles.addRecButton, { borderColor: colors.tint, paddingHorizontal: 12, paddingVertical: 6 }]}
              onPress={() => handleAddToBatchQueue(rec)}
              disabled={batchProcessing}
            >
              <Text style={{ color: colors.tint, fontSize: 12 }}>+ Add</Text>
            </Pressable>
          </View>
        ))}

        {/* Processing Log */}
        {processingLog.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground, marginTop: 16 }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Batch Log</Text>
            <ScrollView style={styles.logContainer} nestedScrollEnabled>
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
  };

  const renderProcessTab = () => {
    const progressPercent = progressState.totalVideos > 0
      ? Math.round((progressState.currentVideo / progressState.totalVideos) * 100)
      : 0;

    const getStepLabel = (step: typeof progressState.currentStep): string => {
      switch (step) {
        case 'transcript': return 'Getting transcript...';
        case 'extracting': return 'Extracting insights with AI...';
        case 'saving': return 'Saving insights...';
        case 'done': return 'Done';
      }
    };

    const getPhaseColor = (phase: typeof progressState.phase): string => {
      switch (phase) {
        case 'fetching_videos': return '#FF9800';
        case 'processing': return colors.tint;
        case 'complete': return '#4CAF50';
        case 'error': return '#F44336';
        default: return colors.textSecondary;
      }
    };

    return (
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
                  onPress={() => !processing && setSelectedChannel(channel)}
                  disabled={processing}
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
        {selectedChannel && !processing && (
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

            <Pressable
              style={[styles.processButton, { backgroundColor: colors.tint }]}
              onPress={handleProcessChannel}
            >
              <Text style={styles.processButtonText}>Start Processing</Text>
            </Pressable>
          </View>
        )}

        {/* Progress Section - shown during processing */}
        {processing && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>
                Processing {selectedChannel?.name}
              </Text>
              <ActivityIndicator size="small" color={colors.tint} />
            </View>

            {/* Phase indicator */}
            <View style={[styles.phaseIndicator, { backgroundColor: getPhaseColor(progressState.phase) + '20' }]}>
              <Text style={[styles.phaseText, { color: getPhaseColor(progressState.phase) }]}>
                {progressState.phase === 'fetching_videos' ? '📡 Fetching video list...' :
                 progressState.phase === 'processing' ? '⚙️ Processing videos...' :
                 progressState.phase === 'complete' ? '✅ Complete!' :
                 progressState.phase === 'error' ? '❌ Error occurred' :
                 'Ready'}
              </Text>
            </View>

            {/* Main progress bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={[styles.progressLabel, { color: colors.text }]}>
                  Video {progressState.currentVideo} of {progressState.totalVideos}
                </Text>
                <Text style={[styles.progressPercent, { color: colors.tint }]}>
                  {progressPercent}%
                </Text>
              </View>

              <View style={[styles.progressBarLarge, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFillLarge,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: colors.tint,
                    }
                  ]}
                />
              </View>

              <Text style={[styles.etaText, { color: colors.textSecondary }]}>
                {progressState.estimatedTimeRemaining}
              </Text>
            </View>

            {/* Current video info */}
            {progressState.currentVideoTitle && (
              <View style={[styles.currentVideoBox, { backgroundColor: colors.background }]}>
                <Text style={[styles.currentVideoLabel, { color: colors.textSecondary }]}>
                  Now processing:
                </Text>
                <Text style={[styles.currentVideoTitle, { color: colors.text }]} numberOfLines={2}>
                  {progressState.currentVideoTitle}
                </Text>
                <View style={styles.stepIndicator}>
                  <View style={[
                    styles.stepDot,
                    { backgroundColor: progressState.currentStep === 'transcript' ? colors.tint : '#4CAF50' }
                  ]} />
                  <View style={[styles.stepLine, { backgroundColor: progressState.currentStep === 'transcript' ? colors.border : '#4CAF50' }]} />
                  <View style={[
                    styles.stepDot,
                    { backgroundColor: progressState.currentStep === 'extracting' ? colors.tint :
                                       progressState.currentStep === 'saving' || progressState.currentStep === 'done' ? '#4CAF50' : colors.border }
                  ]} />
                  <View style={[styles.stepLine, { backgroundColor: progressState.currentStep === 'saving' || progressState.currentStep === 'done' ? '#4CAF50' : colors.border }]} />
                  <View style={[
                    styles.stepDot,
                    { backgroundColor: progressState.currentStep === 'saving' ? colors.tint :
                                       progressState.currentStep === 'done' ? '#4CAF50' : colors.border }
                  ]} />
                </View>
                <Text style={[styles.stepLabel, { color: colors.tint }]}>
                  {getStepLabel(progressState.currentStep)}
                </Text>
              </View>
            )}

            {/* Stats during processing */}
            <View style={styles.processingStats}>
              <View style={styles.processingStat}>
                <Text style={[styles.processingStatValue, { color: '#4CAF50' }]}>
                  {progressState.insightsFound}
                </Text>
                <Text style={[styles.processingStatLabel, { color: colors.textSecondary }]}>
                  Insights Found
                </Text>
              </View>
              <View style={styles.processingStat}>
                <Text style={[styles.processingStatValue, { color: '#FF9800' }]}>
                  {progressState.videosSkipped}
                </Text>
                <Text style={[styles.processingStatLabel, { color: colors.textSecondary }]}>
                  Skipped
                </Text>
              </View>
              <View style={styles.processingStat}>
                <Text style={[styles.processingStatValue, { color: colors.text }]}>
                  {progressState.currentVideo - progressState.videosSkipped}
                </Text>
                <Text style={[styles.processingStatLabel, { color: colors.textSecondary }]}>
                  Processed
                </Text>
              </View>
            </View>

            {/* Stop button */}
            <Pressable
              style={[styles.processButton, { backgroundColor: '#F44336' }]}
              onPress={handleStopProcessing}
            >
              <Text style={styles.processButtonText}>Stop Processing</Text>
            </Pressable>
          </View>
        )}

        {/* Processing complete summary */}
        {progressState.phase === 'complete' && !processing && (
          <View style={[styles.card, { backgroundColor: '#4CAF5015', borderColor: '#4CAF50', borderWidth: 1 }]}>
            <Text style={[styles.cardTitle, { color: '#4CAF50' }]}>✅ Processing Complete!</Text>
            <View style={styles.completeSummary}>
              <Text style={[styles.summaryText, { color: colors.text }]}>
                <Text style={{ fontWeight: '700' }}>{progressState.insightsFound}</Text> insights extracted from{' '}
                <Text style={{ fontWeight: '700' }}>{progressState.currentVideo - progressState.videosSkipped}</Text> videos
              </Text>
              {progressState.videosSkipped > 0 && (
                <Text style={[styles.summaryNote, { color: colors.textSecondary }]}>
                  ({progressState.videosSkipped} videos skipped - no transcript available)
                </Text>
              )}
            </View>
            <Pressable
              style={[styles.reviewButton, { backgroundColor: colors.tint }]}
              onPress={() => {
                setProgressState(prev => ({ ...prev, phase: 'idle' }));
                setActiveTab('review');
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Review Insights →</Text>
            </Pressable>
          </View>
        )}

        {/* Processing Log */}
        {processingLog.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Processing Log</Text>
            <ScrollView style={styles.logContainer} nestedScrollEnabled>
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
  };

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
      case 'batch': return renderBatchTab();
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
        {(['channels', 'batch', 'process', 'review', 'stats'] as Tab[]).map(tab => (
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
               tab === 'batch' ? `Batch${batchQueue.length > 0 ? ` (${batchQueue.length})` : ''}` :
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
  // Progress UI styles
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  phaseIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  phaseText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressBarLarge: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFillLarge: {
    height: '100%',
    borderRadius: 6,
  },
  etaText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
  currentVideoBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  currentVideoLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  currentVideoTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    height: 2,
    width: 40,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  processingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginBottom: 12,
  },
  processingStat: {
    alignItems: 'center',
  },
  processingStatValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  processingStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  completeSummary: {
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 22,
  },
  summaryNote: {
    fontSize: 12,
    marginTop: 4,
  },
  reviewButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  // Batch queue styles
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  queueItemName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  queueItemStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  queueItemMeta: {
    fontSize: 11,
    marginTop: 2,
    marginLeft: 22,
  },
});
