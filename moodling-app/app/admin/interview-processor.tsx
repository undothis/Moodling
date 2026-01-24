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
  resetAllInterviewData,
  clearProcessedVideos,
  getProcessedChannelsHistory,
  addProcessedChannelRecord,
  isChannelProcessed,
  clearProcessedChannelsHistory,
  CuratedChannel,
  ProcessingJob,
  ExtractedInsight,
  ChannelCategory,
  InsightExtractionCategory,
  QualityStats,
  ProcessedChannelRecord,
  CHANNEL_CATEGORIES,
  EXTRACTION_CATEGORIES,
} from '@/services/youtubeProcessorService';
import { exportAllData, devQuickSave } from '@/services/dataPersistenceService';

// Auto-backup settings
const AUTO_BACKUP_INTERVAL = 10; // Backup after every 10 approvals

type Tab = 'channels' | 'batch' | 'process' | 'review' | 'stats';

// Batch processing state
interface BatchQueueItem {
  channel: CuratedChannel | typeof RECOMMENDED_CHANNELS[0];
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  videosProcessed?: number;
  insightsFound?: number;
  error?: string;
}

// Checkpoint for resume functionality
interface BatchCheckpoint {
  timestamp: string;
  queue: BatchQueueItem[];
  currentChannelIndex: number;
  currentVideoIndex: number;
  videosPerChannel: number;
  totalInsights: number;
  totalVideosProcessed: number;
  totalSkipped: number;
  log: string[];
}

const BATCH_CHECKPOINT_KEY = 'moodling_batch_checkpoint';

// Recommended channels to pre-load
// Curated for MoodLeaf ethos: warm honesty, anti-toxic-positivity, full human experience,
// embraces messy middle, non-clinical, pro-human-connection, neurodiversity aware
// Channel IDs are pre-populated to avoid YouTube fetch failures
const RECOMMENDED_CHANNELS = [
  // ╔══════════════════════════════════════════════════════════════════════════════╗
  // ║  ORGANIZED BY EXTRACTION DIMENSIONS - Human Experience Schema               ║
  // ╚══════════════════════════════════════════════════════════════════════════════╝

  // ══════════════════════════════════════════════════════════════════════════════
  // EMOTIONAL EXPERIENCE
  // ══════════════════════════════════════════════════════════════════════════════

  // --- Awe & Wonder ---
  { name: 'The School of Life', handle: 'theschooloflife', channelId: 'UC7IcJI8PUf5Z3zKxnZvTBog', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Alain de Botton - philosophy for everyday emotional life, beauty in the mundane' },
  { name: 'Shots of Awe', handle: 'ShotsOfAwe', channelId: 'UClYb9NpXnRemxYoWbcYANsA', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Jason Silva - micro-documentaries on wonder, consciousness, transcendence' },

  // --- Joy & Delight ---
  { name: 'SoulPancake', handle: 'soulpancake', channelId: 'UCvddZU4j9oalKOxCJ0IuNyg', category: 'joy_celebration' as ChannelCategory, trust: 'high' as const, description: 'Uplifting content about human connection, joy, and meaning' },
  { name: 'The Holderness Family', handle: 'TheHoldernessFamily', channelId: 'UCjMgq_nGK5dg6pVDvH5LW8Q', category: 'humor_comedy' as ChannelCategory, trust: 'medium' as const, description: 'Parenting humor, relatable family chaos, joy in imperfection' },

  // --- Playfulness & Spontaneity ---
  { name: 'Yes Theory', handle: 'YesTheory', channelId: 'UCvK4bOhULCpmLabd2pDMtnA', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Seek discomfort - embracing uncertainty, spontaneous connection, adventure' },

  // --- Gratitude & Appreciation ---
  { name: 'StoryCorps', handle: 'storycorps', channelId: 'UCBYXhmHfUOpb9TYuPpVzFWA', category: 'elderly_wisdom' as ChannelCategory, trust: 'high' as const, description: 'Ordinary people\'s stories - gratitude, love, appreciation for life' },

  // --- Love & Compassion ---
  { name: 'Esther Perel', handle: 'estherperel', channelId: 'UCyktTJjKdR81Cv9sMXK5QCA', category: 'relationships_love' as ChannelCategory, trust: 'high' as const, description: 'Love as complex & contradictory. Never prescriptive. "Where Do We Begin"' },
  { name: 'The Gottman Institute', handle: 'gottmaninstitute', channelId: 'UCWxbz64r6vI7E2awwc8apLQ', category: 'relationships_love' as ChannelCategory, trust: 'high' as const, description: 'John Gottman - research-based love, compassion in relationships' },
  { name: 'Tara Brach', handle: 'TaraBrach', channelId: 'UCxNFlBjJtHXLhHIkqxzJ7Tw', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Radical self-compassion, loving kindness, mindfulness' },

  // --- Vulnerability & Openness ---
  { name: 'Brené Brown', handle: 'BreneBrown', channelId: 'UCpLsVgZrECIhPdJJCxyNRlQ', category: 'vulnerability_authenticity' as ChannelCategory, trust: 'high' as const, description: 'Vulnerability research, courage, authenticity' },
  { name: 'Diary of a CEO', handle: 'TheDiaryOfACEO', channelId: 'UCGq-a57w-aPwyi3pW7XLiHw', category: 'vulnerability_authenticity' as ChannelCategory, trust: 'high' as const, description: 'Deep conversations on failure, vulnerability, raw truth' },
  { name: 'Lewis Howes', handle: 'LewisHowes', channelId: 'UCQjBpfPj72zwYFpS7U7gd_A', category: 'vulnerability_authenticity' as ChannelCategory, trust: 'high' as const, description: 'School of Greatness - men\'s vulnerability, emotional openness' },

  // --- Fear & Anxiety ---
  { name: 'Therapy in a Nutshell', handle: 'TherapyinaNutshell', channelId: 'UCpuKvNRyiFKC4Cgz5bulHjg', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Licensed LMFT - anxiety, fear, evidence-based mental health' },
  { name: 'Kati Morton', handle: 'KatiMorton', channelId: 'UCzBYOHyEEzlkRdDOSobbpvw', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Licensed therapist - anxiety, fear, accessible mental health' },
  { name: 'The Anxiety Guy', handle: 'TheAnxietyGuy', channelId: 'UCrJ9_a2zUNnVRvAq-OPuxgQ', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Dennis Simsek - anxiety recovery, fear confrontation' },

  // --- Anger & Frustration ---
  { name: 'Psychology In Seattle', handle: 'PsychologyInSeattle', channelId: 'UCVQXbB1rSYdPb2boNNpu3og', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Dr. Kirk Honda - anger, frustration, nuanced emotional analysis' },

  // --- Shame & Guilt ---
  { name: 'Dr. Ramani', handle: 'DoctorRamani', channelId: 'UC9Qixc77KhCo88E5gMs-caQ', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Shame, guilt, narcissistic abuse recovery, healing' },

  // --- Grief & Sorrow ---
  { name: 'Refuge in Grief', handle: 'RefugeinGrief', channelId: 'UCwzQ3DPTgKmE6GUmfWuFxkQ', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Megan Devine - grief that doesn\'t need fixing, anti-toxic positivity' },
  { name: 'The Grief Recovery Method', handle: 'GriefRecoveryMethod', channelId: 'UCiE6-nB-c9qB5n0f3Cq1uRQ', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Evidence-based grief recovery, practical tools' },
  { name: 'What\'s Your Grief', handle: 'WhatsYourGrief', channelId: 'UCmQcjPmjwB7QmHM_NiP3EQg', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Practical grief education, normalizing all types of loss' },
  { name: 'Nora McInerny', handle: 'NoraMcInerny', channelId: 'UC0aCvDr7E_Cvq0KHB3FQXpg', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Terrible, Thanks for Asking - grief with humor and honesty' },

  // --- Calm & Contentment ---
  { name: 'Michael Sealey', handle: 'MichaelSealey', channelId: 'UC9GoqsWjluXVSKHO4Wistbw', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Guided meditations, hypnotherapy, deep relaxation' },
  { name: 'The Honest Guys', handle: 'thehonestguys', channelId: 'UC7tD6Ifrwbiy-BoaAHEinmQ', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Guided meditations, calm, sleep stories' },
  { name: 'Jason Stephenson', handle: 'JasonStephensonSleep', channelId: 'UCqDBSTeuGa1e3MSqG_nq2Uw', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Sleep meditation, peace, anxiety relief' },

  // ══════════════════════════════════════════════════════════════════════════════
  // COGNITIVE PATTERNS
  // ══════════════════════════════════════════════════════════════════════════════

  // --- Ambiguity & Uncertainty ---
  { name: 'Vsauce', handle: 'Vsauce', channelId: 'UC6nSFpj9HTCZ5t-N3Rm3-HA', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Michael Stevens - embracing uncertainty, existential curiosity' },
  { name: 'Veritasium', handle: 'veritasium', channelId: 'UCHnyfMqiRRG1u-2MsSQLbXA', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Derek Muller - uncertainty in science, changing one\'s mind' },

  // --- Cognitive Flow & Rhythm ---
  { name: 'How to ADHD', handle: 'HowtoADHD', channelId: 'UC-nPM1_kSZf91ZGkcgy_95Q', category: 'neurodivergence' as ChannelCategory, trust: 'high' as const, description: 'Jessica McCabe - ADHD cognitive patterns, flow states, rhythms' },
  { name: 'Purple Ella', handle: 'PurpleElla', channelId: 'UCvj7WmANb1VdDwPv_L0D4ag', category: 'neurodivergence' as ChannelCategory, trust: 'high' as const, description: 'Autism + ADHD - different cognitive rhythms, authentic experience' },

  // --- Perspective & Worldview ---
  { name: 'Contrapoints', handle: 'ContraPoints', channelId: 'UCNvsIonJdJ5E4EXMa65VYpA', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Natalie Wynn - philosophy, perspective shifts, nuance' },
  { name: 'Philosophy Tube', handle: 'PhilosophyTube', channelId: 'UC2PA-AKmVpU6NKCGtZq_rKQ', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Abigail Thorn - philosophy, changing worldviews, identity' },

  // ══════════════════════════════════════════════════════════════════════════════
  // EXISTENTIAL THEMES
  // ══════════════════════════════════════════════════════════════════════════════

  // --- Identity & Selfhood ---
  { name: 'Jammidodger', handle: 'Jammidodger', channelId: 'UCXc4jQMOy2wvVo_jK1EuLSQ', category: 'vulnerability_authenticity' as ChannelCategory, trust: 'high' as const, description: 'Trans identity journey - discovering and becoming oneself' },
  { name: 'Thais Gibson', handle: 'PersonalDevelopmentSchool', channelId: 'UCHQ4lSAu7jQXmVN3MPCPZGQ', category: 'relationships_love' as ChannelCategory, trust: 'high' as const, description: 'Attachment theory, identity patterns, self-discovery' },

  // --- Meaning & Purpose ---
  { name: 'The Minimalists', handle: 'TheMinimalists', channelId: 'UCRPrmdh5FLt4bxWgvQ8SWOg', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Joshua & Ryan - meaning over materialism, intentional living' },
  { name: 'Victor Frankl Institute', handle: 'ViktorFranklInstitute', channelId: 'UCNqv3JbxGJ0gZ_fZG_QXLjw', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Man\'s Search for Meaning - logotherapy, finding purpose' },
  { name: 'Academy of Ideas', handle: 'AcademyofIdeas', channelId: 'UCiRiQGCHGjDLT9FQXFW0I3A', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Philosophy for life - meaning, purpose, existentialism' },

  // --- Growth & Personal Development ---
  { name: 'Mel Robbins', handle: 'melrobbins', channelId: 'UCk2U-Oqn7RXf-ydPqfSxG5g', category: 'vulnerability_authenticity' as ChannelCategory, trust: 'high' as const, description: 'Personal growth without toxic positivity, science-backed' },
  { name: 'Rich Roll', handle: 'richroll', channelId: 'UCOF0J3ms6IeZZCOp-jJMuXQ', category: 'vulnerability_authenticity' as ChannelCategory, trust: 'high' as const, description: 'Transformation, addiction recovery, personal evolution' },

  // --- Transformation & Change ---
  { name: 'Gabor Maté', handle: 'DrGaborMate', channelId: 'UC6JLfDwuqC6OmJAqVVn5f7w', category: 'addiction_recovery' as ChannelCategory, trust: 'high' as const, description: 'Trauma-informed transformation, compassionate change' },
  { name: 'Annie Grace', handle: 'ThisNakedMind', channelId: 'UCDSEuXPwLJh4zLrVbYXj0Nw', category: 'addiction_recovery' as ChannelCategory, trust: 'high' as const, description: 'This Naked Mind - alcohol freedom, identity transformation' },

  // --- Mortality & Death Awareness ---
  { name: 'Ask a Mortician', handle: 'AskAMortician', channelId: 'UCi5iiEyLwSLvlqnMi02u5gQ', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Caitlin Doughty - death positivity, confronting mortality honestly' },
  { name: 'Ram Dass', handle: 'RamDassOrg', channelId: 'UCrmD3-ZZTJRfxAOxS1LHkkQ', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Be Here Now - aging, dying, consciousness, acceptance' },
  { name: 'The Order of the Good Death', handle: 'OrderOfTheGoodDeath', channelId: 'UCkVMpFPDK1F67eCM60ICAVQ', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Death acceptance movement, mortality awareness' },

  // --- Hope & Despair ---
  { name: 'The Moth', handle: 'TheMoth', channelId: 'UCkVMpFPDK1F67eCM60ICAVQ', category: 'storytelling_human_experience' as ChannelCategory, trust: 'high' as const, description: 'True stories - the full spectrum from despair to hope' },
  { name: 'Humans of New York', handle: 'HumansofNewYork', channelId: 'UCQvJR3UyQ8K-TrVz0rENKxg', category: 'storytelling_human_experience' as ChannelCategory, trust: 'high' as const, description: 'Real human stories - struggles, hope, resilience' },

  // ══════════════════════════════════════════════════════════════════════════════
  // RELATIONAL DYNAMICS
  // ══════════════════════════════════════════════════════════════════════════════

  // --- Connection & Belonging ---
  { name: 'NVC Marshall Rosenberg', handle: 'NonviolentCommunicationNVC', channelId: 'UC2iuX2CG6jgCgHVfMM7w3Yw', category: 'relationships_love' as ChannelCategory, trust: 'high' as const, description: 'Nonviolent Communication - deep connection through needs' },
  { name: 'Center for Nonviolent Communication', handle: 'CNVC', channelId: 'UCnYIS6HlFTpkNpkrXLvxOaw', category: 'relationships_love' as ChannelCategory, trust: 'high' as const, description: 'NVC training - compassionate connection' },

  // --- Isolation & Loneliness ---
  { name: 'Kurzgesagt', handle: 'Kurzgesagt', channelId: 'UCsXVk37bltHxD1rDPwtNM8Q', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'In a Nutshell - loneliness, isolation, existential themes' },
  { name: 'HealthyGamerGG', handle: 'HealthyGamerGG', channelId: 'UClHVl2N3jPEbkNJVx-ItQIQ', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Dr. K - isolation, gaming culture, mental health for lonely people' },

  // --- Conflict & Discord ---
  { name: 'TED Talks', handle: 'TED', channelId: 'UCAuUUnT6oDeKwE6v1NGQxug', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Ideas worth spreading - conflict resolution, understanding' },

  // --- Caregiving & Nurturance ---
  { name: 'Dr. Becky Kennedy', handle: 'drbeckyatgoodinside', channelId: 'UC2oF2TmQVzRCW3M6BQmwEFQ', category: 'relationships_love' as ChannelCategory, trust: 'high' as const, description: 'Good Inside - parenting as caregiving, nurturing connection' },
  { name: 'Janet Lansbury', handle: 'JanetLansbury', channelId: 'UC-pMWdv3GhJIBmYqAJWBQfQ', category: 'relationships_love' as ChannelCategory, trust: 'high' as const, description: 'RIE parenting - respectful caregiving, trust' },
  { name: 'Teepa Snow', handle: 'TeepaSnow', channelId: 'UCmqMv7z9YqQf_J7bqMzPr1w', category: 'relationships_love' as ChannelCategory, trust: 'high' as const, description: 'Dementia caregiving - compassionate care, understanding' },

  // --- Empathy & Understanding ---
  { name: 'Andrew Huberman', handle: 'hubermanlab', channelId: 'UC2D2CMWXMOVWx7giW1n3LIg', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Neuroscience of empathy, connection, understanding others' },

  // ══════════════════════════════════════════════════════════════════════════════
  // SYMBOLIC EXPRESSION
  // ══════════════════════════════════════════════════════════════════════════════

  // --- Metaphoric Language & Symbolic Imagery ---
  { name: 'Nerdwriter', handle: 'Nerdwriter1', channelId: 'UCJkMlOu7faDgqh4PfzbpLdg', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Video essays on art, metaphor, meaning in culture' },
  { name: 'The Art Assignment', handle: 'theartassignment', channelId: 'UCmQThz1OLYt8mb2PaGJSJeQ', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Art as emotional expression, symbolic meaning' },

  // --- Archetypal & Mythic Themes ---
  { name: 'Joseph Campbell Foundation', handle: 'JosephCampbellFdn', channelId: 'UCq6v1HuYQ6m4d9PVcA0rqPQ', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Hero\'s journey, myth, archetypal psychology' },
  { name: 'Jordan Peterson Clips', handle: 'JordanPetersonClips', channelId: 'UC6g_3zHOI47T6rjAA0RlV-w', category: 'philosophy_meaning' as ChannelCategory, trust: 'medium' as const, description: 'Jungian archetypes, mythology, meaning (use critically)' },

  // ══════════════════════════════════════════════════════════════════════════════
  // TEMPORAL & NARRATIVE PATTERNS
  // ══════════════════════════════════════════════════════════════════════════════

  // --- Narrative Arc / Personal Journey ---
  { name: 'Soft White Underbelly', handle: 'SoftWhiteUnderbelly', channelId: 'UCCvcd0FYi58LwyTQP8MYTgg', category: 'storytelling_human_experience' as ChannelCategory, trust: 'high' as const, description: 'Mark Laita - raw life stories, personal journeys, humanity' },
  { name: 'Special Books by Special Kids', handle: 'SpecialBooksbySpecialKids', channelId: 'UC4E98HDsPXrf5kTKIgrSmtQ', category: 'storytelling_human_experience' as ChannelCategory, trust: 'high' as const, description: 'Chris Ulmer - stories of disability, difference, humanity' },

  // --- Temporal Focus (Past, Present, Future) ---
  { name: 'Eckhart Tolle', handle: 'EckhartTolle', channelId: 'UCJ9rg3_ApZFpfIR0vftNPAA', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Present moment awareness, releasing past and future' },

  // ══════════════════════════════════════════════════════════════════════════════
  // LIFE CONTEXT (STAGES & TRANSITIONS)
  // ══════════════════════════════════════════════════════════════════════════════

  // --- Birth & New Beginnings ---
  { name: 'The Birth Hour', handle: 'TheBirthHour', channelId: 'UCt1FgWrRWzYj_r3z0MWMtDA', category: 'storytelling_human_experience' as ChannelCategory, trust: 'high' as const, description: 'Birth stories - new beginnings, transformation' },

  // --- Aging & Life Stages ---
  { name: 'Sixty and Me', handle: 'SixtyandMe', channelId: 'UCuEb_KLhBhZ_fQVZMbR2EJw', category: 'elderly_wisdom' as ChannelCategory, trust: 'high' as const, description: 'Women over 60 - embracing aging, wisdom' },
  { name: 'Old Souls', handle: 'OldSoulsTV', channelId: 'UCeP6_FX8IfVl3xXQtjw1z2w', category: 'elderly_wisdom' as ChannelCategory, trust: 'high' as const, description: 'Elderly wisdom, life lessons, aging gracefully' },

  // --- Death & Loss ---
  // (see Grief & Mortality sections above)

  // --- Major Life Transitions ---
  { name: 'The Financial Diet', handle: 'TheFinancialDiet', channelId: 'UCSPYNpQ2fHv9HJ-q6MIMaPw', category: 'philosophy_meaning' as ChannelCategory, trust: 'medium' as const, description: 'Life transitions, adulting, major changes' },

  // --- Rupture (Breakdown or Crisis) ---
  { name: 'After Prison Show', handle: 'AfterPrisonShow', channelId: 'UCo2LGlvPwPJ_vD-dN8FdT8w', category: 'addiction_recovery' as ChannelCategory, trust: 'high' as const, description: 'Joe Guerrero - life after rupture, rebuilding from crisis' },
  { name: 'Russell Brand', handle: 'RussellBrand', channelId: 'UCswH8ovgUp5Bdg-0_JTYFNw', category: 'addiction_recovery' as ChannelCategory, trust: 'medium' as const, description: 'Addiction crisis, spiritual recovery, transformation' },
  { name: 'Recovery Elevator', handle: 'RecoveryElevator', channelId: 'UChvKBUy9eLU-5xVz2Rre7-g', category: 'addiction_recovery' as ChannelCategory, trust: 'high' as const, description: 'Alcohol crisis and recovery, community support' },
  { name: 'Club Soda', handle: 'ClubSodaUK', channelId: 'UC8oCJLZ_DLu7e5Qu3qbqRQw', category: 'addiction_recovery' as ChannelCategory, trust: 'high' as const, description: 'Mindful drinking, harm reduction, choice' },

  // --- Repair (Healing or Reconciliation) ---
  { name: 'Austin Kleon', handle: 'AustinKleon', channelId: 'UCqQxXxW8qJw_9WqC8J8TfSQ', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Creative repair, finding your way back, showing your work' },

  // ══════════════════════════════════════════════════════════════════════════════
  // EMBODIED EXPERIENCE
  // ══════════════════════════════════════════════════════════════════════════════

  // --- Vitality & Aliveness ---
  { name: 'Yoga With Adriene', handle: 'yogawithadriene', channelId: 'UCFKE7WVJfvaHW5q283SxchA', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Embodied practice, vitality, movement as healing' },

  // --- Rest & Recovery ---
  { name: 'The Nap Ministry', handle: 'TheNapMinistry', channelId: 'UCwJlZ8L-aSPb-PVNGNZDe-g', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Tricia Hersey - rest as resistance, recovery, rejecting grind' },

  // --- Tension & Relaxation ---
  { name: 'The Body Keeps the Score', handle: 'BesselVanDerKolk', channelId: 'UCQ2GfCOybQWdtcA0qVaM1aw', category: 'therapy_mental_health' as ChannelCategory, trust: 'high' as const, description: 'Bessel van der Kolk - trauma in the body, somatic healing' },

  // --- Chronic Illness & Disability (Embodied Difference) ---
  { name: 'Jessica Kellgren-Fozard', handle: 'JessicaKellgrenFozard', channelId: 'UCqZ3eDbxCaKBnE9W6w7xRGg', category: 'vulnerability_authenticity' as ChannelCategory, trust: 'high' as const, description: 'Deaf, disabled LGBTQ+ - joy and chronic illness coexist' },
  { name: 'Invisible i', handle: 'invisiblei', channelId: 'UCy0f7VLjz7L_rkF1pePJaOg', category: 'vulnerability_authenticity' as ChannelCategory, trust: 'high' as const, description: 'Chronic illness, invisible disability, lived experience' },

  // ══════════════════════════════════════════════════════════════════════════════
  // IDENTITY & DIVERSITY
  // ══════════════════════════════════════════════════════════════════════════════

  // --- LGBTQ+ Experience ---
  { name: 'Ash Hardell', handle: 'AshHardell', channelId: 'UCnIX4jtXbqEwb8kEU3blzlg', category: 'vulnerability_authenticity' as ChannelCategory, trust: 'high' as const, description: 'Non-binary, queer identity journey, education' },

  // --- Cultural & Racial Identity ---
  { name: 'Jay Shetty', handle: 'JayShetty', channelId: 'UCbV60AGIHKz3xMfY3TdvLsQ', category: 'philosophy_meaning' as ChannelCategory, trust: 'high' as const, description: 'Former monk - wisdom traditions, cross-cultural meaning' },

  // --- Neurodivergent Experience ---
  { name: 'Yo Samdy Sam', handle: 'YoSamdySam', channelId: 'UCwVr5NHzQ4GqPuvViLoXLgw', category: 'neurodivergence' as ChannelCategory, trust: 'high' as const, description: 'Autism, late diagnosis, neurodivergent identity' },
  { name: 'The Aspie World', handle: 'TheAspieWorld', channelId: 'UCkpYu4pKJWY2PLe7a6o7G6A', category: 'neurodivergence' as ChannelCategory, trust: 'high' as const, description: 'Dan Jones - autism, ADHD, neurodivergent experience' },
];

export default function InterviewProcessorScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
  const [addingRecommendedHandle, setAddingRecommendedHandle] = useState<string | null>(null);

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
  const [selectedInsightIds, setSelectedInsightIds] = useState<Set<string>>(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);

  // Backup state
  const [approvalsSinceBackup, setApprovalsSinceBackup] = useState(0);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Review grouping state
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());
  const [groupByChannel, setGroupByChannel] = useState(true);

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

  // Processed channels history
  const [processedChannelsHistory, setProcessedChannelsHistory] = useState<ProcessedChannelRecord[]>([]);
  const [showProcessedHistory, setShowProcessedHistory] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [channelsData, pendingData, approvedData, statsData, historyData, storedApiKey, storedYoutubeKey] = await Promise.all([
        getCuratedChannels(),
        getPendingInsights(),
        getApprovedInsights(),
        getQualityStats(),
        getProcessedChannelsHistory(),
        AsyncStorage.getItem('moodling_claude_api_key'),
        AsyncStorage.getItem('youtube_api_key'),
      ]);
      setChannels(channelsData);
      setPendingInsights(pendingData);
      setApprovedInsights(approvedData);
      setQualityStats(statsData);
      setProcessedChannelsHistory(historyData);
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
    // Check for saved checkpoint on mount
    checkForSavedCheckpoint();
  }, [loadData]);

  // Checkpoint state
  const [savedCheckpoint, setSavedCheckpoint] = useState<BatchCheckpoint | null>(null);

  // Check for saved checkpoint
  const checkForSavedCheckpoint = async () => {
    try {
      const checkpointStr = await AsyncStorage.getItem(BATCH_CHECKPOINT_KEY);
      if (checkpointStr) {
        const checkpoint: BatchCheckpoint = JSON.parse(checkpointStr);
        setSavedCheckpoint(checkpoint);
      }
    } catch (error) {
      console.error('Failed to load checkpoint:', error);
    }
  };

  // Save checkpoint
  const saveCheckpoint = async (
    queue: BatchQueueItem[],
    channelIndex: number,
    videoIndex: number,
    videosPerChannel: number,
    totalInsights: number,
    totalVideosProcessed: number,
    totalSkipped: number,
    log: string[]
  ) => {
    const checkpoint: BatchCheckpoint = {
      timestamp: new Date().toISOString(),
      queue,
      currentChannelIndex: channelIndex,
      currentVideoIndex: videoIndex,
      videosPerChannel,
      totalInsights,
      totalVideosProcessed,
      totalSkipped,
      log,
    };
    await AsyncStorage.setItem(BATCH_CHECKPOINT_KEY, JSON.stringify(checkpoint));
  };

  // Clear checkpoint
  const clearCheckpoint = async () => {
    await AsyncStorage.removeItem(BATCH_CHECKPOINT_KEY);
    setSavedCheckpoint(null);
  };

  // Resume from checkpoint
  const resumeFromCheckpoint = () => {
    if (!savedCheckpoint) return;

    // Restore state
    setBatchQueue(savedCheckpoint.queue);
    setProcessingLog(savedCheckpoint.log);
    setBatchVideosPerChannel(savedCheckpoint.videosPerChannel.toString());
    setBatchProgress({
      currentChannelIndex: savedCheckpoint.currentChannelIndex,
      totalChannels: savedCheckpoint.queue.length,
      totalInsights: savedCheckpoint.totalInsights,
      totalVideosProcessed: savedCheckpoint.totalVideosProcessed,
      totalSkipped: savedCheckpoint.totalSkipped,
    });

    // Start processing from checkpoint
    startBatchProcessingFromCheckpoint(savedCheckpoint);
  };

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
    setAddingRecommendedHandle(rec.handle);
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
      setAddingRecommendedHandle(null);
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
    addLog(`Fetching ${numVideos} videos (this may take up to 30s)...`);

    try {
      // Fetch videos - pass channelId to skip unreliable handle resolution
      const { videos, error } = await fetchChannelVideos(selectedChannel.url, numVideos, selectedChannel.channelId);

      if (error) {
        addLog(`Error fetching videos: ${error}`);
        if (error.includes('Network') || error.includes('aborted')) {
          addLog(`💡 Tip: Check your internet connection or try again in a minute`);
        }
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

        // Fetch transcript (pass addLog for detailed logging in UI)
        const { transcript, error: transcriptError } = await fetchVideoTranscript(video.videoId, addLog);

        if (transcriptError || !transcript) {
          addLog(`  ⚠ No transcript: ${transcriptError || 'empty transcript'}`);
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
  const handleStopBatch = async () => {
    batchProcessingRef.current = false;
    batchPausedRef.current = false;
    setBatchPaused(false);
    addLog('⏹ Stopping batch processing... (checkpoint saved)');
    // Checkpoint is saved automatically during processing
  };

  // Discard checkpoint and start fresh
  const handleDiscardCheckpoint = async () => {
    await clearCheckpoint();
    addLog('🗑 Checkpoint discarded. Ready to start fresh.');
  };

  // Start batch processing from checkpoint
  const startBatchProcessingFromCheckpoint = async (checkpoint: BatchCheckpoint) => {
    if (!apiKey) {
      Alert.alert('API Key Required', 'Please set your Claude API key in Settings → AI Coaching');
      return;
    }

    const numVideos = checkpoint.videosPerChannel;
    setBatchProcessing(true);
    batchProcessingRef.current = true;
    batchPausedRef.current = false;

    addLog(`\n🔄 RESUMING from checkpoint (saved ${new Date(checkpoint.timestamp).toLocaleString()})`);
    addLog(`Resuming at channel ${checkpoint.currentChannelIndex + 1}/${checkpoint.queue.length}`);

    let totalInsightsAllChannels = checkpoint.totalInsights;
    let totalVideosAllChannels = checkpoint.totalVideosProcessed;
    let totalSkippedAllChannels = checkpoint.totalSkipped;

    // Start from saved channel index
    for (let channelIndex = checkpoint.currentChannelIndex; channelIndex < checkpoint.queue.length && batchProcessingRef.current; channelIndex++) {
      // Check for pause
      while (batchPausedRef.current && batchProcessingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!batchProcessingRef.current) break;

      const queueItem = checkpoint.queue[channelIndex];

      // Skip already completed channels
      if (queueItem.status === 'completed' || queueItem.status === 'skipped') {
        continue;
      }

      const channelInfo = queueItem.channel;

      addLog(`\n[${channelIndex + 1}/${checkpoint.queue.length}] Processing: ${'name' in channelInfo ? channelInfo.name : channelInfo.name}`);

      // Update queue item status
      setBatchQueue(prev => prev.map((item, i) =>
        i === channelIndex ? { ...item, status: 'processing' } : item
      ));

      setBatchProgress(prev => ({
        ...prev,
        currentChannelIndex: channelIndex + 1,
      }));

      try {
        // Get channel
        let channel: CuratedChannel;

        if ('handle' in channelInfo) {
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
        const { videos, error } = await fetchChannelVideos(channel.url, numVideos, channel.channelId);

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

        // Determine starting video index (for resumed channel)
        const startVideoIndex = (channelIndex === checkpoint.currentChannelIndex)
          ? checkpoint.currentVideoIndex
          : 0;

        // Process each video
        for (let i = startVideoIndex; i < videos.length && batchProcessingRef.current; i++) {
          while (batchPausedRef.current && batchProcessingRef.current) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          if (!batchProcessingRef.current) {
            // Save checkpoint before exiting
            await saveCheckpoint(
              batchQueue, channelIndex, i, numVideos,
              totalInsightsAllChannels + channelInsights,
              totalVideosAllChannels + channelVideosProcessed,
              totalSkippedAllChannels + channelSkipped,
              processingLog
            );
            break;
          }

          const video = videos[i];
          addLog(`    [${i + 1}/${videos.length}] ${video.title.slice(0, 40)}...`);

          const { transcript, error: transcriptError } = await fetchVideoTranscript(video.videoId);

          if (transcriptError || !transcript) {
            addLog(`      ⚠ No transcript, skipping`);
            channelSkipped++;
            continue;
          }

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

          // Save checkpoint after each video
          await saveCheckpoint(
            batchQueue, channelIndex, i + 1, numVideos,
            totalInsightsAllChannels + channelInsights,
            totalVideosAllChannels + channelVideosProcessed,
            totalSkippedAllChannels + channelSkipped,
            processingLog
          );

          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        totalInsightsAllChannels += channelInsights;
        totalVideosAllChannels += channelVideosProcessed;
        totalSkippedAllChannels += channelSkipped;

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

        // Save processed channel record to history (from checkpoint resume)
        await addProcessedChannelRecord({
          channelId: channel.channelId,
          channelName: channel.name,
          handle: 'handle' in channelInfo ? (channelInfo as typeof RECOMMENDED_CHANNELS[0]).handle : undefined,
          processedAt: new Date().toISOString(),
          videosProcessed: channelVideosProcessed,
          insightsExtracted: channelInsights,
          insightsApproved: 0,
          avgQualityScore: 0,
        });

        addLog(`  ✓ Channel complete: ${channelInsights} insights from ${channelVideosProcessed} videos`);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        addLog(`  ❌ Error: ${errorMsg}`);

        setBatchQueue(prev => prev.map((item, i) =>
          i === channelIndex ? { ...item, status: 'failed', error: errorMsg } : item
        ));
      }

      if (channelIndex < checkpoint.queue.length - 1 && batchProcessingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Clear checkpoint on completion
    await clearCheckpoint();

    addLog(`\n✅ Batch processing complete!`);
    addLog(`Total: ${totalInsightsAllChannels} insights from ${totalVideosAllChannels} videos`);
    addLog(`Skipped: ${totalSkippedAllChannels} videos (no transcript)`);

    setBatchProcessing(false);
    batchProcessingRef.current = false;

    loadData();
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
        const { videos, error } = await fetchChannelVideos(channel.url, numVideos, channel.channelId);

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

          if (!batchProcessingRef.current) {
            // Save checkpoint before exiting
            await saveCheckpoint(
              batchQueue, channelIndex, i, numVideos,
              totalInsightsAllChannels + channelInsights,
              totalVideosAllChannels + channelVideosProcessed,
              totalSkippedAllChannels + channelSkipped,
              processingLog
            );
            break;
          }

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

          // Save checkpoint after each video
          await saveCheckpoint(
            batchQueue, channelIndex, i + 1, numVideos,
            totalInsightsAllChannels + channelInsights,
            totalVideosAllChannels + channelVideosProcessed,
            totalSkippedAllChannels + channelSkipped,
            processingLog
          );

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

        // Save processed channel record to history (from main batch)
        await addProcessedChannelRecord({
          channelId: channel.channelId,
          channelName: channel.name,
          handle: 'handle' in queueItem.channel ? (queueItem.channel as typeof RECOMMENDED_CHANNELS[0]).handle : undefined,
          processedAt: new Date().toISOString(),
          videosProcessed: channelVideosProcessed,
          insightsExtracted: channelInsights,
          insightsApproved: 0,
          avgQualityScore: 0,
        });

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

    // Clear checkpoint on completion
    await clearCheckpoint();

    addLog(`\n✅ Batch processing complete!`);
    addLog(`Total: ${totalInsightsAllChannels} insights from ${totalVideosAllChannels} videos`);
    addLog(`Skipped: ${totalSkippedAllChannels} videos (no transcript)`);

    setBatchProcessing(false);
    batchProcessingRef.current = false;

    // Refresh data
    loadData();
  };

  // Auto-backup helper - runs after N approvals
  const checkAndRunAutoBackup = async (newApprovals: number) => {
    const total = approvalsSinceBackup + newApprovals;
    setApprovalsSinceBackup(total);

    if (total >= AUTO_BACKUP_INTERVAL) {
      console.log(`[AutoBackup] Running backup after ${total} approvals...`);
      try {
        const result = await devQuickSave();
        if (result.success) {
          setApprovalsSinceBackup(0);
          setLastBackupTime(new Date().toISOString());
          console.log('[AutoBackup] Success:', result.message);
        }
      } catch (error) {
        console.error('[AutoBackup] Failed:', error);
      }
    }
  };

  // Manual export handler
  const handleExportBackup = async () => {
    setExporting(true);
    try {
      const result = await exportAllData();
      if (result.success) {
        setLastBackupTime(new Date().toISOString());
        setApprovalsSinceBackup(0);
        Alert.alert('Export Complete', result.message);
      } else {
        Alert.alert('Export Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  // Quick backup handler
  const handleQuickBackup = async () => {
    setExporting(true);
    try {
      const result = await devQuickSave();
      if (result.success) {
        setLastBackupTime(new Date().toISOString());
        setApprovalsSinceBackup(0);
        Alert.alert('Backup Complete', result.message);
      } else {
        Alert.alert('Backup Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to backup data');
    } finally {
      setExporting(false);
    }
  };

  // Approve insight
  const handleApproveInsight = async (insight: ExtractedInsight) => {
    await approvePendingInsight(insight.id);
    await updateQualityStats({ humanApproved: (qualityStats?.humanApproved || 0) + 1 });
    await checkAndRunAutoBackup(1);
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

  // Toggle insight selection
  const toggleInsightSelection = (insightId: string) => {
    setSelectedInsightIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(insightId)) {
        newSet.delete(insightId);
      } else {
        newSet.add(insightId);
      }
      return newSet;
    });
  };

  // Select all pending insights
  const selectAllInsights = () => {
    if (selectedInsightIds.size === pendingInsights.length) {
      setSelectedInsightIds(new Set());
    } else {
      setSelectedInsightIds(new Set(pendingInsights.map(i => i.id)));
    }
  };

  // Bulk approve selected insights
  const handleBulkApprove = async () => {
    if (selectedInsightIds.size === 0) {
      Alert.alert('No Selection', 'Please select insights to approve');
      return;
    }

    setBulkApproving(true);
    try {
      let approvedCount = 0;
      for (const id of selectedInsightIds) {
        await approvePendingInsight(id);
        approvedCount++;
      }
      await updateQualityStats({ humanApproved: (qualityStats?.humanApproved || 0) + approvedCount });
      await checkAndRunAutoBackup(approvedCount);
      setSelectedInsightIds(new Set());
      loadData();
      Alert.alert('Success', `Approved ${approvedCount} insights`);
    } catch (error) {
      Alert.alert('Error', 'Failed to approve some insights');
    } finally {
      setBulkApproving(false);
    }
  };

  // Bulk reject selected insights
  const handleBulkReject = async () => {
    if (selectedInsightIds.size === 0) {
      Alert.alert('No Selection', 'Please select insights to reject');
      return;
    }

    Alert.alert(
      'Confirm Rejection',
      `Reject ${selectedInsightIds.size} selected insights?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setBulkApproving(true);
            try {
              let rejectedCount = 0;
              for (const id of selectedInsightIds) {
                await rejectPendingInsight(id, 'Bulk rejected by user');
                rejectedCount++;
              }
              await updateQualityStats({ humanRejected: (qualityStats?.humanRejected || 0) + rejectedCount });
              setSelectedInsightIds(new Set());
              loadData();
              Alert.alert('Done', `Rejected ${rejectedCount} insights`);
            } catch (error) {
              Alert.alert('Error', 'Failed to reject some insights');
            } finally {
              setBulkApproving(false);
            }
          }
        }
      ]
    );
  };

  // Auto-approve high quality insights (quality >= 85, safety >= 95)
  const handleAutoApproveHighQuality = async (minQuality: number = 85) => {
    const highQuality = pendingInsights.filter(
      i => i.qualityScore >= minQuality && (i.safetyScore || 100) >= 95 && !i.needsHumanReview
    );

    if (highQuality.length === 0) {
      Alert.alert('No Matches', `No insights found with quality ≥${minQuality}%, safety ≥95%, and no review flags`);
      return;
    }

    Alert.alert(
      `Auto-Approve (≥${minQuality}%)`,
      `Found ${highQuality.length} insights with quality ≥${minQuality}% and safety ≥95%.\n\nApprove all?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Approve ${highQuality.length}`,
          onPress: async () => {
            setBulkApproving(true);
            try {
              for (const insight of highQuality) {
                await approvePendingInsight(insight.id);
              }
              await updateQualityStats({ humanApproved: (qualityStats?.humanApproved || 0) + highQuality.length });
              await checkAndRunAutoBackup(highQuality.length);
              setSelectedInsightIds(new Set());
              loadData();
              Alert.alert('Success', `Auto-approved ${highQuality.length} insights (≥${minQuality}%)`);
            } catch (error) {
              Alert.alert('Error', 'Failed to approve some insights');
            } finally {
              setBulkApproving(false);
            }
          }
        }
      ]
    );
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

      {RECOMMENDED_CHANNELS.filter(rec => !channels.find(c => c.name === rec.name)).map(rec => {
        const isAddingThis = addingRecommendedHandle === rec.handle;
        const isAddingAny = addingRecommendedHandle !== null;
        return (
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
              style={[styles.addRecButton, { borderColor: colors.tint, opacity: isAddingAny && !isAddingThis ? 0.5 : 1 }]}
              onPress={() => handleAddRecommended(rec)}
              disabled={isAddingAny}
            >
              {isAddingThis ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <Text style={{ color: colors.tint }}>+ Add Channel</Text>
              )}
            </Pressable>
          </View>
        );
      })}

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

          {/* Resume from checkpoint banner */}
          {savedCheckpoint && !batchProcessing && (
            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#FF9800', marginBottom: 12 }]}>
              <Text style={[styles.cardTitle, { color: '#FF9800' }]}>📋 Saved Progress Found</Text>
              <Text style={{ color: colors.text, marginBottom: 8 }}>
                Stopped at: Channel {savedCheckpoint.currentChannelIndex + 1}/{savedCheckpoint.queue.length}{'\n'}
                Saved: {new Date(savedCheckpoint.timestamp).toLocaleString()}{'\n'}
                Progress: {savedCheckpoint.totalInsights} insights from {savedCheckpoint.totalVideosProcessed} videos
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  style={[styles.processButton, { backgroundColor: '#4CAF50', flex: 1 }]}
                  onPress={resumeFromCheckpoint}
                >
                  <Text style={styles.processButtonText}>▶ Resume</Text>
                </Pressable>
                <Pressable
                  style={[styles.processButton, { backgroundColor: '#F44336', flex: 1 }]}
                  onPress={handleDiscardCheckpoint}
                >
                  <Text style={styles.processButtonText}>🗑 Discard</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Start/Stop/Pause buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            {!batchProcessing ? (
              <Pressable
                style={[styles.processButton, { backgroundColor: colors.tint, flex: 1 }]}
                onPress={handleStartBatchProcessing}
                disabled={batchQueue.length === 0 || !!savedCheckpoint}
              >
                <Text style={styles.processButtonText}>
                  {savedCheckpoint ? 'Resume or Discard First' : `Start Batch (${batchQueue.filter(q => q.status === 'pending').length})`}
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

        {/* Processed Channels History */}
        <Pressable
          style={{ marginTop: 24 }}
          onPress={() => setShowProcessedHistory(!showProcessedHistory)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
              Previously Processed ({processedChannelsHistory.length})
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
              {showProcessedHistory ? '▼' : '▶'}
            </Text>
          </View>
        </Pressable>

        {showProcessedHistory && processedChannelsHistory.length > 0 && (
          <View style={{ marginTop: 8 }}>
            {processedChannelsHistory
              .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime())
              .map((record, index) => (
              <View key={`${record.channelId}-${index}`} style={[styles.queueItem, { backgroundColor: colors.cardBackground }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.queueItemName, { color: colors.text }]}>{record.channelName}</Text>
                  <Text style={[styles.queueItemMeta, { color: colors.textSecondary }]}>
                    {record.videosProcessed} videos • {record.insightsExtracted} insights
                  </Text>
                  <Text style={[styles.queueItemMeta, { color: colors.textSecondary, fontSize: 10 }]}>
                    Last: {new Date(record.processedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.trustBadge, { backgroundColor: '#4CAF5030' }]}>
                  <Text style={{ color: '#4CAF50', fontSize: 11 }}>✓ Done</Text>
                </View>
              </View>
            ))}

            {processedChannelsHistory.length > 0 && (
              <Pressable
                style={[styles.bulkButton, { backgroundColor: '#F4433630', marginTop: 8, alignSelf: 'flex-start' }]}
                onPress={() => {
                  Alert.alert(
                    'Clear History',
                    'Clear all processed channels history? This does not delete any data, just the tracking history.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Clear',
                        style: 'destructive',
                        onPress: async () => {
                          await clearProcessedChannelsHistory();
                          setProcessedChannelsHistory([]);
                        }
                      }
                    ]
                  );
                }}
              >
                <Text style={{ color: '#F44336', fontSize: 12 }}>Clear History</Text>
              </Pressable>
            )}
          </View>
        )}

        {showProcessedHistory && processedChannelsHistory.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 8 }]}>
            No channels processed yet. Process some channels to see history here.
          </Text>
        )}

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
        {/* Server Instructions */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderLeftWidth: 4, borderLeftColor: '#FF9800' }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>⚡ Transcript Server Required</Text>
          <Text style={[styles.helperText, { color: colors.textSecondary, marginBottom: 8 }]}>
            1. Install yt-dlp (one time):
          </Text>
          <View style={{ backgroundColor: isDark ? '#1a1a2e' : '#f5f5f5', padding: 10, borderRadius: 8, marginBottom: 10 }}>
            <Text style={{ fontFamily: 'monospace', fontSize: 12, color: colors.text }}>
              brew install yt-dlp
            </Text>
          </View>
          <Text style={[styles.helperText, { color: colors.textSecondary, marginBottom: 8 }]}>
            2. Start server (separate terminal):
          </Text>
          <View style={{ backgroundColor: isDark ? '#1a1a2e' : '#f5f5f5', padding: 10, borderRadius: 8, marginBottom: 8 }}>
            <Text style={{ fontFamily: 'monospace', fontSize: 12, color: colors.text }}>
              cd transcript-server{'\n'}
              npm install{'\n'}
              npm start
            </Text>
          </View>
          <Text style={[styles.helperText, { color: colors.textSecondary, fontSize: 11 }]}>
            Keep terminal open while processing. Server uses yt-dlp for reliable transcripts.
          </Text>
        </View>

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
      {/* BACKUP SECTION - Prominent at top */}
      <View style={[styles.card, {
        backgroundColor: '#FF980015',
        borderWidth: 2,
        borderColor: '#FF9800',
        marginBottom: 16
      }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 20, marginRight: 8 }}>💾</Text>
          <Text style={[styles.cardTitle, { color: '#FF9800', marginBottom: 0, flex: 1 }]}>
            Backup Your Data
          </Text>
          {approvalsSinceBackup > 0 && (
            <View style={{ backgroundColor: '#FF980030', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
              <Text style={{ color: '#FF9800', fontSize: 11 }}>
                {approvalsSinceBackup} since backup
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.helperText, { color: colors.textSecondary, marginBottom: 12 }]}>
          Auto-backup runs every {AUTO_BACKUP_INTERVAL} approvals. Export to save a permanent copy.
        </Text>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            style={[styles.processButton, {
              backgroundColor: '#FF9800',
              flex: 1,
              opacity: exporting ? 0.6 : 1
            }]}
            onPress={handleQuickBackup}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>
                ⚡ Quick Backup
              </Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.processButton, {
              backgroundColor: '#4CAF50',
              flex: 1,
              opacity: exporting ? 0.6 : 1
            }]}
            onPress={handleExportBackup}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>
                📤 Export File
              </Text>
            )}
          </Pressable>
        </View>

        {lastBackupTime && (
          <Text style={[styles.helperText, { color: '#4CAF50', marginTop: 8, textAlign: 'center' }]}>
            ✓ Last backup: {new Date(lastBackupTime).toLocaleTimeString()}
          </Text>
        )}

        <Pressable
          style={{ marginTop: 8 }}
          onPress={() => {
            Alert.alert(
              'Storage Info',
              'Data is stored in:\n\n' +
              '• AsyncStorage (device internal)\n' +
              '• Quick Backup: App Documents folder\n' +
              '• Export File: Shareable JSON (save anywhere)\n\n' +
              'Use "Export File" to save a copy you can access from your computer.',
              [{ text: 'OK' }]
            );
          }}
        >
          <Text style={[styles.helperText, { color: colors.tint, textAlign: 'center', textDecorationLine: 'underline' }]}>
            📁 Where is my data stored?
          </Text>
        </Pressable>
      </View>

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

      {/* Bulk Actions */}
      {pendingInsights.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.cardBackground, marginBottom: 12 }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Bulk Actions</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Pressable
              style={[styles.bulkButton, { backgroundColor: colors.border }]}
              onPress={selectAllInsights}
            >
              <Text style={{ color: colors.text, fontSize: 13 }}>
                {selectedInsightIds.size === pendingInsights.length ? '☑ Deselect All' : '☐ Select All'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.bulkButton, {
                backgroundColor: selectedInsightIds.size > 0 ? '#4CAF50' : colors.border,
                opacity: selectedInsightIds.size > 0 ? 1 : 0.5
              }]}
              onPress={handleBulkApprove}
              disabled={selectedInsightIds.size === 0 || bulkApproving}
            >
              <Text style={{ color: selectedInsightIds.size > 0 ? '#fff' : colors.textSecondary, fontSize: 13 }}>
                ✓ Approve Selected ({selectedInsightIds.size})
              </Text>
            </Pressable>

            <Pressable
              style={[styles.bulkButton, {
                backgroundColor: selectedInsightIds.size > 0 ? '#F44336' : colors.border,
                opacity: selectedInsightIds.size > 0 ? 1 : 0.5
              }]}
              onPress={handleBulkReject}
              disabled={selectedInsightIds.size === 0 || bulkApproving}
            >
              <Text style={{ color: selectedInsightIds.size > 0 ? '#fff' : colors.textSecondary, fontSize: 13 }}>
                ✗ Reject Selected
              </Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
            <Text style={[styles.helperText, { color: colors.text, fontWeight: '600', marginBottom: 8 }]}>
              Auto-Approve by Quality Threshold:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Pressable
                style={[styles.bulkButton, { backgroundColor: '#9C27B0' }]}
                onPress={() => handleAutoApproveHighQuality(90)}
                disabled={bulkApproving}
              >
                <Text style={{ color: '#fff', fontSize: 13 }}>
                  ⭐ 90%+ ({pendingInsights.filter(i => i.qualityScore >= 90 && (i.safetyScore || 100) >= 95 && !i.needsHumanReview).length})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.bulkButton, { backgroundColor: '#2196F3' }]}
                onPress={() => handleAutoApproveHighQuality(85)}
                disabled={bulkApproving}
              >
                <Text style={{ color: '#fff', fontSize: 13 }}>
                  ⚡ 85%+ ({pendingInsights.filter(i => i.qualityScore >= 85 && (i.safetyScore || 100) >= 95 && !i.needsHumanReview).length})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.bulkButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => handleAutoApproveHighQuality(80)}
                disabled={bulkApproving}
              >
                <Text style={{ color: '#fff', fontSize: 13 }}>
                  ✓ 80%+ ({pendingInsights.filter(i => i.qualityScore >= 80 && (i.safetyScore || 100) >= 95 && !i.needsHumanReview).length})
                </Text>
              </Pressable>
            </View>
            <Text style={[styles.helperText, { color: colors.textSecondary, marginTop: 6 }]}>
              All require safety ≥95% and no review flags
            </Text>
          </View>

          {bulkApproving && (
            <View style={{ marginTop: 8 }}>
              <ActivityIndicator color={colors.tint} />
              <Text style={[styles.helperText, { color: colors.textSecondary, textAlign: 'center' }]}>
                Processing...
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Pending Insights Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
          Pending Review ({pendingInsights.length})
        </Text>
        <Pressable
          style={[styles.bulkButton, { backgroundColor: colors.border }]}
          onPress={() => setGroupByChannel(!groupByChannel)}
        >
          <Text style={{ color: colors.text, fontSize: 12 }}>
            {groupByChannel ? '📁 By Channel' : '📋 Flat List'}
          </Text>
        </Pressable>
      </View>

      {pendingInsights.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No insights pending review. Process some videos first!
        </Text>
      ) : groupByChannel ? (
        // GROUPED BY CHANNEL VIEW
        (() => {
          // Group insights by channel
          const groupedByChannel: Record<string, ExtractedInsight[]> = {};
          pendingInsights.forEach(insight => {
            const channel = insight.channelName || 'Unknown Channel';
            if (!groupedByChannel[channel]) {
              groupedByChannel[channel] = [];
            }
            groupedByChannel[channel].push(insight);
          });

          // Sort channels by insight count (most first)
          const sortedChannels = Object.keys(groupedByChannel).sort(
            (a, b) => groupedByChannel[b].length - groupedByChannel[a].length
          );

          return sortedChannels.map(channelName => {
            const channelInsights = groupedByChannel[channelName];
            const isExpanded = expandedChannels.has(channelName);
            const selectedInChannel = channelInsights.filter(i => selectedInsightIds.has(i.id)).length;
            const avgQuality = Math.round(
              channelInsights.reduce((sum, i) => sum + i.qualityScore, 0) / channelInsights.length
            );

            return (
              <View key={channelName} style={{ marginBottom: 12 }}>
                {/* Channel Header */}
                <Pressable
                  style={[styles.card, {
                    backgroundColor: colors.cardBackground,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.tint,
                    marginBottom: 0,
                    paddingVertical: 10,
                  }]}
                  onPress={() => {
                    setExpandedChannels(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(channelName)) {
                        newSet.delete(channelName);
                      } else {
                        newSet.add(channelName);
                      }
                      return newSet;
                    });
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 2 }]}>
                        {isExpanded ? '▼' : '▶'} {channelName}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        {channelInsights.length} insights • Avg: {avgQuality}%
                        {selectedInChannel > 0 && ` • ${selectedInChannel} selected`}
                      </Text>
                    </View>
                    <Pressable
                      style={[styles.bulkButton, { backgroundColor: '#4CAF5020' }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        // Toggle select all in this channel
                        const allSelected = channelInsights.every(i => selectedInsightIds.has(i.id));
                        setSelectedInsightIds(prev => {
                          const newSet = new Set(prev);
                          channelInsights.forEach(i => {
                            if (allSelected) {
                              newSet.delete(i.id);
                            } else {
                              newSet.add(i.id);
                            }
                          });
                          return newSet;
                        });
                      }}
                    >
                      <Text style={{ color: '#4CAF50', fontSize: 11 }}>
                        {channelInsights.every(i => selectedInsightIds.has(i.id)) ? '☑ All' : '☐ All'}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>

                {/* Expanded Insights */}
                {isExpanded && channelInsights.map(insight => (
                  <Pressable
                    key={insight.id}
                    style={[
                      styles.insightCard,
                      { backgroundColor: colors.cardBackground, marginLeft: 12, marginTop: 4 },
                      selectedInsightIds.has(insight.id) && { borderColor: '#4CAF50', borderWidth: 2 }
                    ]}
                    onPress={() => setSelectedInsight(insight)}
                    onLongPress={() => toggleInsightSelection(insight.id)}
                  >
                    <View style={styles.insightHeader}>
                      <Pressable
                        style={[
                          styles.checkbox,
                          { borderColor: colors.border },
                          selectedInsightIds.has(insight.id) && { backgroundColor: '#4CAF50', borderColor: '#4CAF50' }
                        ]}
                        onPress={() => toggleInsightSelection(insight.id)}
                      >
                        {selectedInsightIds.has(insight.id) && (
                          <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                        )}
                      </Pressable>
                      <Text style={[styles.insightTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
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
                    <Text style={[styles.insightText, { color: colors.textSecondary, marginLeft: 28 }]} numberOfLines={2}>
                      {insight.insight}
                    </Text>
                    {insight.needsHumanReview && (
                      <View style={[styles.reviewFlag, { backgroundColor: '#FF980020', marginLeft: 28 }]}>
                        <Text style={{ color: '#FF9800', fontSize: 11 }}>⚠ Needs careful review</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            );
          });
        })()
      ) : (
        // FLAT LIST VIEW (original)
        pendingInsights.slice(0, 50).map(insight => (
          <Pressable
            key={insight.id}
            style={[
              styles.insightCard,
              { backgroundColor: colors.cardBackground },
              selectedInsightIds.has(insight.id) && { borderColor: '#4CAF50', borderWidth: 2 }
            ]}
            onPress={() => setSelectedInsight(insight)}
            onLongPress={() => toggleInsightSelection(insight.id)}
          >
            <View style={styles.insightHeader}>
              <Pressable
                style={[
                  styles.checkbox,
                  { borderColor: colors.border },
                  selectedInsightIds.has(insight.id) && { backgroundColor: '#4CAF50', borderColor: '#4CAF50' }
                ]}
                onPress={() => toggleInsightSelection(insight.id)}
              >
                {selectedInsightIds.has(insight.id) && (
                  <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                )}
              </Pressable>
              <Text style={[styles.insightTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
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
            <Text style={[styles.insightSource, { color: colors.tint, marginLeft: 28 }]}>
              {insight.channelName}
            </Text>
            <Text style={[styles.insightText, { color: colors.textSecondary, marginLeft: 28 }]} numberOfLines={2}>
              {insight.insight}
            </Text>
            {insight.needsHumanReview && (
              <View style={[styles.reviewFlag, { backgroundColor: '#FF980020', marginLeft: 28 }]}>
                <Text style={{ color: '#FF9800', fontSize: 11 }}>⚠ Needs careful review</Text>
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

      {/* Reset Section */}
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Reset Options</Text>

        <Pressable
          style={[styles.dangerButton, { borderColor: '#FF6B6B' }]}
          onPress={() => {
            Alert.alert(
              'Clear Processed Videos',
              'This will allow all videos to be re-processed. Channels and insights will be preserved.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  onPress: async () => {
                    await clearProcessedVideos();
                    Alert.alert('Done', 'Processed videos list cleared');
                  }
                }
              ]
            );
          }}
        >
          <Text style={{ color: '#FF6B6B' }}>Clear Processed Videos (Re-harvest)</Text>
        </Pressable>

        <Pressable
          style={[styles.dangerButton, { borderColor: '#FF4444', marginTop: 12 }]}
          onPress={() => {
            Alert.alert(
              'Reset All Data',
              'This will clear ALL channels, insights, and stats. This cannot be undone!',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset Everything',
                  style: 'destructive',
                  onPress: async () => {
                    const result = await resetAllInterviewData();
                    await loadData();
                    Alert.alert(
                      'Reset Complete',
                      `Channels: ${result.channelsCleared ? '✓' : '✗'}\n` +
                      `Queue: ${result.queueCleared ? '✓' : '✗'}\n` +
                      `Insights: ${result.insightsCleared ? '✓' : '✗'}\n` +
                      `Videos: ${result.videosCleared ? '✓' : '✗'}\n` +
                      `Stats: ${result.statsCleared ? '✓' : '✗'}`
                    );
                  }
                }
              ]
            );
          }}
        >
          <Text style={{ color: '#FF4444', fontWeight: '600' }}>⚠️ Reset All Data</Text>
        </Pressable>
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
  dangerButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
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
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
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
