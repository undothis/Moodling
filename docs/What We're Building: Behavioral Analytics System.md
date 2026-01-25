# Behavioral Analytics System - Complete Specification

## Executive Summary

The Behavioral Analytics System consists of two interconnected components that are **largely already built**:

| Component | Status | Location |
|-----------|--------|----------|
| **YouTube Harvester** | 85% Complete | `youtubeProcessorService.ts`, `interview-processor.tsx` |
| **Interview Analysis** | 70% Complete (types defined) | `interviewAnalysisService.ts` |
| **Prosody Extraction** | 70% Complete (types defined) | `prosodyExtractionService.ts` |
| **User Cadence Analysis** | 20% Complete | Planned for in-app |

---

## Part 1: YouTube Harvester (MOSTLY BUILT)

### 1.1 What's Already Built

#### Services
- **`youtubeProcessorService.ts`** - 1200+ lines
  - CORS proxy fallbacks (4 proxies with auto-rotation)
  - Invidious instance integration (6 instances)
  - Rate limiting (2s between requests)
  - Channel management (add/remove/categorize)
  - Video fetching with sampling strategies
  - Transcript fetching via Invidious API
  - Insight extraction with Claude API
  - Quality scoring (5 dimensions)
  - Deduplication (content hash + semantic)
  - Batch processing with checkpoints
  - Resume functionality

#### UI
- **`app/admin/interview-processor.tsx`** - Full admin interface
  - Channels tab (manage curated channels)
  - Batch tab (process multiple channels)
  - Process tab (single video processing)
  - Review tab (approve/reject insights)
  - Stats tab (quality metrics dashboard)

#### Pre-populated Data
- **60+ curated channels** organized by extraction dimension:
  - Emotional Experience (awe, joy, fear, grief, etc.)
  - Cognitive Patterns (ambiguity, flow, perspective)
  - Existential Themes (identity, meaning, mortality)
  - Relational Dynamics (connection, conflict, caregiving)
  - Life Context (birth, aging, death, transitions)
  - Embodied Experience (vitality, rest, chronic illness)

### 1.2 Extraction Categories (50+ defined)

```typescript
// From youtubeProcessorService.ts
type InsightExtractionCategory =
  // Understanding Pain & Struggle
  | 'emotional_struggles' | 'coping_strategies' | 'what_helps_hurts'
  | 'vulnerability' | 'mental_health_patterns' | 'trauma_recovery'
  | 'shame_guilt' | 'anger_frustration' | 'grief_loss'
  | 'fear_anxiety' | 'depression_hopelessness'

  // Understanding Joy & Flourishing
  | 'humor_wit' | 'joy_celebration' | 'excitement_passion'
  | 'playfulness' | 'gratitude_appreciation' | 'contentment_peace'
  | 'hope_optimism' | 'pride_accomplishment' | 'awe_wonder'

  // Understanding Connection & Relationships
  | 'companionship' | 'friendship_dynamics' | 'romantic_love'
  | 'family_bonds' | 'belonging_community' | 'loneliness_isolation'
  | 'parenting' | 'boundaries' | 'conflict_repair'
  | 'trust_betrayal' | 'communication_patterns' | 'caregiving'

  // ... 20+ more categories
```

### 1.3 Quality Scoring (Already Implemented)

| Dimension | Range | Purpose |
|-----------|-------|---------|
| `qualityScore` | 0-100 | Overall insight quality |
| `specificityScore` | 0-100 | Specific vs generic |
| `actionabilityScore` | 0-100 | Can coach use this? |
| `safetyScore` | 0-100 | Could this cause harm? |
| `noveltyScore` | 0-100 | Unique or duplicate? |

**Thresholds:**
```
MIN_QUALITY_SCORE:      60  → Below = rejected
MIN_SPECIFICITY_SCORE:  50  → Below = rejected
MIN_SAFETY_SCORE:       80  → Below = rejected
HUMAN_REVIEW_THRESHOLD: 75  → Below = needs human approval
```

### 1.4 Communication Style Analysis (Already Defined)

```typescript
// Extracted from interviews
communicationStyle: {
  cadence: 'rapid' | 'measured' | 'slow' | 'variable';
  verbosity: 'terse' | 'concise' | 'moderate' | 'verbose';
  directness: 'very_direct' | 'direct' | 'exploratory' | 'indirect';
  formality: 'casual' | 'conversational' | 'professional' | 'formal';
  emotionalExpression: 'reserved' | 'moderate' | 'expressive' | 'highly_expressive';
};

personalityMarkers: {
  thinkingStyle: 'analytical' | 'intuitive' | 'practical' | 'creative';
  socialEnergy: 'introverted' | 'ambivert' | 'extroverted';
  decisionMaking: 'deliberate' | 'balanced' | 'spontaneous';
  conflictStyle: 'avoidant' | 'accommodating' | 'direct' | 'collaborative';
  humorStyle: 'dry' | 'self_deprecating' | 'playful' | 'observational' | 'dark';
};

speechPatterns: {
  fillerWords: string[];        // "um", "like", "you know"
  catchPhrases: string[];       // Repeated expressions
  sentenceStructure: 'simple' | 'compound' | 'complex' | 'varied';
  questioningStyle: 'rhetorical' | 'genuine' | 'leading' | 'rare';
  storytellingStyle: 'linear' | 'tangential' | 'dramatic' | 'minimal';
};
```

### 1.5 Audio Aliveness Analysis (Defined, Needs Backend)

```typescript
audioAliveness: {
  imperfectRhythm: number;      // 0-100: Natural variation in speech rate
  naturalLatency: number;       // 0-100: Presence of thinking pauses
  amplitudeRestraint: number;   // 0-100: Understatement vs drama
  flowQuality: number;          // 0-100: Natural flow vs choppy
  overallAliveness: number;     // 0-100: Combined score
  notableMoments: string[];     // Timestamps of aliveness markers
  analysisSource: 'audio' | 'transcript_inferred';
};
```

### 1.6 What Still Needs Implementation

| Feature | Status | Effort |
|---------|--------|--------|
| **Audio processing backend** | Not started | 2-3 weeks |
| **Whisper integration** | Not started | 1 week |
| **Speaker diarization** | Not started | 1 week |
| **Actual prosody extraction** | Types defined, no implementation | 2 weeks |
| **Facial expression extraction** | Not started | 3 weeks |
| **Video frame analysis** | Not started | 2 weeks |
| **Vector embeddings for semantic dedup** | Placeholder | 1 week |

---

## Part 2: Interview Analysis Service (TYPES COMPLETE)

### 2.1 What's Already Defined

**File:** `interviewAnalysisService.ts` (835 lines)

#### Prosodic Analysis Types
```typescript
// Metrical foot types (scansion)
type MetricalFoot =
  | 'iamb'      // da-DUM (unstressed-stressed)
  | 'trochee'   // DUM-da (stressed-unstressed)
  | 'anapest'   // da-da-DUM
  | 'dactyl'    // DUM-da-da
  | 'spondee'   // DUM-DUM
  | 'pyrrhic'   // da-da
  | 'amphibrach' | 'amphimacer' | 'tribrach' | 'molossus';

// Scansion analysis
interface ScansionAnalysis {
  dominantFoot: MetricalFoot;
  footDistribution: Record<MetricalFoot, number>;
  metricalRegularity: number;     // 0-1
  stressPattern: string;          // "x/x/x/"
  syllablesPerPhrase: number;
  beatsPerMinute: number;
  syncopation: number;            // 0-1
}

// Rhythm analysis
interface RhythmAnalysis {
  overallTempo: TempoCategory;    // very_slow → very_fast
  wordsPerMinute: number;
  syllablesPerSecond: number;
  tempoVariability: number;
  tempoTrajectory: TempoTrajectory;
  pauseFrequency: number;
  pauseDuration: PauseDuration;
  rhythmicConsistency: number;
  rushingTendency: number;
  draggingTendency: number;
}

// Cadence analysis
interface CadenceAnalysis {
  overallPattern: CadencePattern;
  sentenceEndingStyle: SentenceEnding;
  questionIntonation: QuestionIntonation;
  emphasisPlacement: EmphasisPlacement;
  pitchRange: PitchRange;
  pitchVariability: number;
  melodicContour: MelodicContour[];
  naturalness: number;
}
```

#### Speaker Profile (Complete Type Definition)
```typescript
interface SpeakerProfile {
  role: 'interviewer' | 'interviewee';
  speakingTime: number;
  speakingPercentage: number;
  turnCount: number;
  averageTurnLength: number;

  communicationStyle: {
    overall: StyleCategory;
    warmth: number;
    directness: number;
    formality: number;
    energy: number;
    patience: number;
    empathy: number;
    dominance: number;
    adaptability: number;
  };

  rhythm: RhythmAnalysis;
  cadence: CadenceAnalysis;
  scansion: ScansionAnalysis;
  voiceQuality: VoiceQualityProfile;
  emotionalExpression: EmotionalExpressionProfile;
  linguistics: LinguisticProfile;
}
```

#### Distress Markers (Complete)
```typescript
interface DistressMarkerProfile {
  crying: {
    detected: boolean;
    type: 'tearful' | 'sniffling' | 'sobbing' | 'suppressed' | 'breakthrough';
    occurrences: number;
    totalDuration: number;
  };

  choking: {
    detected: boolean;
    type: 'mild_catch' | 'gulping' | 'gasping' | 'full_choke';
    occurrences: number;
  };

  tremor: {
    detected: boolean;
    severity: number;
    pattern: 'intermittent' | 'increasing' | 'decreasing' | 'constant';
  };

  breathing: {
    pattern: 'regular' | 'shallow' | 'deep' | 'irregular' | 'rapid' | 'sighing';
    audibleBreaths: number;
    breathHolds: number;
  };
}
```

#### Interview Dynamics (Complete Types)
```typescript
interface InterviewDynamics {
  rapport: {
    overallRapport: number;
    rapportTrajectory: 'building' | 'stable' | 'declining' | 'fluctuating';
    mirroringScore: number;
    backchannelFrequency: number;
    laughter: LaughterAnalysis;
    warmthExchange: number;
    tensionMoments: TensionMoment[];
    connectionMoments: ConnectionMoment[];
  };

  turnTaking: {
    smoothness: number;
    interruptionsByInterviewer: number;
    interruptionsByInterviewee: number;
    overlappingSpeech: number;
    averageGapBetweenTurns: number;
    longestMonologue: { speaker: SpeakerRole; duration: number };
    balanceRatio: number;
  };

  powerDynamics: {
    balance: number;           // -1 to 1
    shift: PowerShift[];
    interviewerControl: number;
    intervieweeAgency: number;
  };

  emotionalJourney: {
    overallArc: EmotionalArc;
    peaks: EmotionalPeak[];
    valleys: EmotionalValley[];
    resolution: EmotionalResolution;
    transformationScore: number;
  };
}
```

#### Interview Classification (Complete)
```typescript
type InterviewType =
  | 'therapeutic_session'
  | 'coaching_conversation'
  | 'crisis_support'
  | 'intake_assessment'
  | 'follow_up_check_in'
  | 'deep_exploration'
  | 'skill_teaching'
  | 'motivational'
  | 'casual_check_in'
  | 'trauma_processing'
  | 'grief_support'
  | 'relationship_focused'
  | 'career_focused'
  | 'health_focused';

type TherapeuticApproach =
  | 'cbt' | 'dbt' | 'psychodynamic' | 'humanistic'
  | 'solution_focused' | 'narrative' | 'mindfulness_based'
  | 'motivational_interviewing' | 'trauma_informed'
  | 'somatic' | 'ifs' | 'act';
```

#### Statistics Dashboard Types (Complete)
```typescript
interface InterviewStatistics {
  totalInterviewsAnalyzed: number;
  totalDuration: number;

  typeDistribution: Record<InterviewType, number>;
  averageQualityScore: number;
  qualityDistribution: { range: string; count: number }[];
  approachFrequency: Record<TherapeuticApproach, number>;
  commonEmotionalArcs: Record<EmotionalArc, number>;
  averageDuration: number;
  durationDistribution: { range: string; count: number }[];
  dominantFootTypes: Record<MetricalFoot, number>;
  averageTempo: number;

  effectiveTechniques: EffectiveTechnique[];
  trainingGaps: string[];
  strengthAreas: string[];
}
```

### 2.2 What Still Needs Implementation

| Feature | Status | Required |
|---------|--------|----------|
| `analyzeInterview()` | Stub throws error | Backend audio processing |
| `analyzeInterviewBatch()` | Stub throws error | Backend audio processing |
| `getInterviewStatistics()` | Stub throws error | Stored analysis data |
| Speaker diarization | Not started | pyannote or similar |
| Audio feature extraction | Not started | librosa/parselmouth |
| Real-time prosody | Not started | TensorFlow Lite |

---

## Part 3: Prosody Extraction Service (TYPES COMPLETE)

### 3.1 What's Already Defined

**File:** `prosodyExtractionService.ts` (300+ lines)

```typescript
// Complete type definitions for:
interface ProsodicFeatures {
  meter: MeterAnalysis;       // Stress patterns
  rhythm: RhythmAnalysis;     // Flow type, breathing
  cadence: CadenceAnalysis;   // Rise/fall, phrase endings
  tempo: TempoAnalysis;       // Speech rate, acceleration
  intonation: IntonationAnalysis;
  pitchRange: PitchRangeAnalysis;
  stress: StressAnalysis;
  emphasis: EmphasisAnalysis;
}

interface VoiceQualityFeatures {
  volume: VolumeAnalysis;
  dynamicRange: DynamicRangeAnalysis;
  texture: VoiceTextureAnalysis;   // clarity, breathiness, warmth
  stability: VoiceStabilityAnalysis;  // jitter, shimmer, tremor
  resonance: ResonanceAnalysis;
}
```

### 3.2 What Still Needs Implementation

The entire extraction logic - types are complete but no actual audio processing.

---

## Part 4: The "Aliveness" Philosophy (DOCUMENTED)

From `TRAINING_ADMIN_MANUAL.md`, the 10 Aliveness Qualities that make coaching feel human:

| Quality | Description | Coach Behavior |
|---------|-------------|----------------|
| **Imperfect Rhythm** | Human things don't loop cleanly | Vary response pace and length |
| **Asymmetry Over Time** | We're not symmetrical in motion | Don't always mirror user |
| **Latency** | Living systems don't respond instantly | Acknowledgment before response |
| **Rest Is Part of Motion** | We don't move constantly | Don't fill every silence |
| **Amplitude Restraint** | Humans rarely move at full range | Understatement > enthusiasm |
| **Flow Without Destination** | Life doesn't move toward something | Don't always drive to outcomes |
| **Consistency Across States** | Character persists through emotions | Same warmth when thriving or struggling |
| **Scale Independence** | Same principles at all scales | Check-in = deep session quality |
| **Backgrounded Attention** | Tolerate being ignored | Remain alive without acknowledgment |
| **Non-Instrumentality** | WITH not FOR the user | Presence, not performance |

---

## Part 5: What Actually Needs Building

### 5.1 Backend Audio Processing Server

**Required for:** Actual prosody extraction, speaker diarization, audio analysis

```
┌─────────────────────────────────────────────────────────────┐
│                 AUDIO PROCESSING BACKEND                     │
│                     (NOT YET BUILT)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Technology Stack:                                           │
│  ├── Python 3.11+                                           │
│  ├── FastAPI (REST endpoints)                               │
│  ├── Whisper (transcription)                                │
│  ├── pyannote-audio (speaker diarization)                   │
│  ├── librosa (audio features)                               │
│  ├── parselmouth/praat (pitch analysis)                     │
│  └── PostgreSQL (storage)                                   │
│                                                              │
│  Endpoints Needed:                                           │
│  POST /transcribe          → Whisper transcription          │
│  POST /diarize             → Speaker separation             │
│  POST /extract-prosody     → Full prosodic analysis         │
│  POST /analyze-interview   → Complete interview analysis    │
│  GET  /statistics          → Aggregate stats                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Video/Facial Analysis (NOT STARTED)

| Feature | Technology | Status |
|---------|------------|--------|
| Face detection | MediaPipe | Not started |
| Emotion recognition | DeepFace/FER | Not started |
| Action Units (FACS) | OpenFace/Py-Feat | Not started |
| Eye tracking | ARKit (iOS only) | Not started |
| Frame extraction | OpenCV | Not started |

### 5.3 User Cadence Analysis (In-App) (PLANNED)

The in-app feature for analyzing users during their own sessions:

```
/app/cadence/              # New route group (not created)
  index.tsx                # Cadence dashboard
  session.tsx              # Active recording session
  insights.tsx             # Historical analysis
  settings.tsx             # Privacy controls

/services/
  cadenceService.ts        # Core orchestration (not created)
  facialAnalysisService.ts # On-device face ML (not created)
  voiceAnalysisService.ts  # On-device voice ML (not created)
```

---

## Part 6: Implementation Roadmap

### Phase 1: Complete Backend Audio Processing (Priority)

| Week | Deliverable |
|------|-------------|
| 1 | Python backend scaffold, Whisper integration |
| 2 | Speaker diarization (pyannote), word-level timing |
| 3 | Prosody extraction (librosa, parselmouth) |
| 4 | API endpoints, integration with React Native app |

**Exit Criteria:** Can process a YouTube video and get full prosodic analysis back.

### Phase 2: Connect Existing UI to Backend

| Week | Deliverable |
|------|-------------|
| 5 | Wire interview-processor.tsx to backend |
| 6 | Implement `analyzeInterview()` with real backend |
| 7 | Statistics dashboard with real data |
| 8 | Batch processing at scale (100+ videos) |

**Exit Criteria:** Full pipeline from YouTube → insights with audio analysis.

### Phase 3: Video/Facial Analysis

| Week | Deliverable |
|------|-------------|
| 9 | Frame extraction pipeline |
| 10 | Face detection + emotion recognition |
| 11 | Action Unit extraction |
| 12 | Integration with interview analysis |

**Exit Criteria:** Videos analyzed for both audio AND visual features.

### Phase 4: User Cadence Feature (In-App)

| Week | Deliverable |
|------|-------------|
| 13 | On-device voice analysis (TensorFlow Lite models) |
| 14 | Real-time speech pattern detection in coach chat |
| 15 | Session insights + long-term patterns |
| 16 | Coach integration (context-aware responses) |

**Exit Criteria:** Mood Leaf users can opt-in to cadence analysis.

### Phase 5: Model Training

| Week | Deliverable |
|------|-------------|
| 17 | Export training data from harvested insights |
| 18 | Train emotion recognition model on harvested data |
| 19 | Fine-tune coach dialogue on Q&A pairs |
| 20 | Deploy updated models, A/B testing |

---

## Part 7: Current Files Reference

### Services (Already Built)

| File | Lines | Description |
|------|-------|-------------|
| `youtubeProcessorService.ts` | 1200+ | YouTube harvesting, insight extraction |
| `interviewAnalysisService.ts` | 835 | Interview analysis types (stubs) |
| `prosodyExtractionService.ts` | 300+ | Prosody types (no implementation) |
| `trainingDataService.ts` | - | Training data storage |
| `trainingQualityService.ts` | - | Quality metrics |
| `trainingStatusService.ts` | - | Processing status |
| `trainingCleanupService.ts` | - | Data cleanup |

### UI (Already Built)

| File | Description |
|------|-------------|
| `app/admin/interview-processor.tsx` | Full harvester UI |
| `app/admin/training.tsx` | Training admin panel |

### Documentation (Already Written)

| File | Content |
|------|---------|
| `TRAINING_ADMIN_MANUAL.md` | Complete usage guide, aliveness philosophy |
| `AI_TRAINING_SYSTEM_MANUAL.md` | Technical training docs |
| `TRAINING_FOR_BEGINNERS.md` | Simplified guide |
| `TRAINING_MODULE.md` | Module overview |

---

## Part 8: Statistics Dashboard (Already Specified)

From the existing types, the stats dashboard should show:

```
╔════════════════════════════════════════════════════════════════╗
║                    INTERVIEW ANALYTICS                          ║
╠════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  INTERVIEW TYPE BREAKDOWN                                        ║
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │ Therapeutic     ████████████████████  42%                │   ║
║  │ Coaching        ██████████████        28%                │   ║
║  │ Crisis Support  ████████              15%                │   ║
║  │ Skill Teaching  ████                   8%                │   ║
║  │ Other           ███                    7%                │   ║
║  └──────────────────────────────────────────────────────────┘   ║
║                                                                  ║
║  AVERAGE SESSION DURATION                                        ║
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │ Mean: 34 minutes    Median: 28 minutes                   │   ║
║  │ Range: 5 min - 2.5 hours                                 │   ║
║  └──────────────────────────────────────────────────────────┘   ║
║                                                                  ║
║  EMOTIONAL PATTERNS (ARC TYPES)                                  ║
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │ U-shaped (down→up)     ████████████████  35%            │   ║
║  │ Ascending (improving)  ████████████      25%            │   ║
║  │ Stable                 ██████████        20%            │   ║
║  │ Rollercoaster          ██████            12%            │   ║
║  │ Descending             ████               8%            │   ║
║  └──────────────────────────────────────────────────────────┘   ║
║                                                                  ║
║  DISTRESS MARKER FREQUENCY                                       ║
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │ Crying detected:     23% of interviews                   │   ║
║  │ Voice tremor:        18% of interviews                   │   ║
║  │ Choking/gulping:     12% of interviews                   │   ║
║  │ Breath irregularity: 31% of interviews                   │   ║
║  └──────────────────────────────────────────────────────────┘   ║
║                                                                  ║
║  VOICE QUALITY OVER TIME                                         ║
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │     Session Start ──────────────── Session End           │   ║
║  │                                                          │   ║
║  │  Pitch:    ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅                    │   ║
║  │  Volume:   ▅▆▇▆▅▄▃▄▅▆▇▆▅▄▃▂▃▄▅▆▇▆▅▄                    │   ║
║  │  Rate:     ▂▃▄▅▆▇▆▅▄▃▂▃▄▅▆▇▆▅▄▃▂▃▄                    │   ║
║  └──────────────────────────────────────────────────────────┘   ║
║                                                                  ║
║  SPEAKING RATIO                                                  ║
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │ Interviewer: ███████████████░░░░░ 42%                    │   ║
║  │ Interviewee: ████████████████████████░░ 58%              │   ║
║  │                                                          │   ║
║  │ Ideal ratio: 30-40% interviewer / 60-70% interviewee    │   ║
║  └──────────────────────────────────────────────────────────┘   ║
║                                                                  ║
║  TOPIC CLUSTERS                                                  ║
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │ ● Anxiety/Fear         ● Relationships                   │   ║
║  │ ● Self-Worth           ● Work Stress                     │   ║
║  │ ● Family Dynamics      ● Life Transitions                │   ║
║  │ ● Grief/Loss           ● Identity                        │   ║
║  └──────────────────────────────────────────────────────────┘   ║
║                                                                  ║
║  THERAPEUTIC APPROACH EFFECTIVENESS                              ║
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │                        Transformation │ Quality │ Uses   │   ║
║  │ Motivational Interview    ████████░░░ │  85%   │  156   │   ║
║  │ CBT Techniques            ███████░░░░ │  78%   │  234   │   ║
║  │ Somatic/Body-Based        ███████░░░░ │  76%   │   89   │   ║
║  │ Mindfulness               ██████░░░░░ │  72%   │  178   │   ║
║  │ Solution-Focused          ██████░░░░░ │  68%   │  112   │   ║
║  └──────────────────────────────────────────────────────────┘   ║
║                                                                  ║
╚════════════════════════════════════════════════════════════════╝
```

---

## Part 9: Separate App vs. In-App?

### Recommendation: Keep in Mood Leaf app

| Aspect | In Mood Leaf | Separate App |
|--------|--------------|--------------|
| **Data context** | ✅ Connected to journals, coach | ❌ Siloed |
| **User trust** | ✅ Already established | ❌ New trust needed |
| **Development** | ✅ Shared components | ❌ Duplicate work |
| **Deployment** | ✅ Single update | ❌ Coordinate releases |
| **Privacy** | ✅ Unified consent | ❌ Complex syncing |

**Exception:** The Python audio processing backend is necessarily separate (server-side), but it's a backend service, not a user-facing app.

---

## Appendix: Quick Reference

### To Process a YouTube Video Today

1. Go to Settings → Developer Tools → Interview Processor
2. Add channel URL or use recommended channels
3. Select extraction categories
4. Click Process
5. Review generated insights
6. Approve/reject for training

### To Add Training Insights Manually

1. Go to Settings → Developer Tools → Training Admin
2. Use Single Import or Batch Import (JSON)
3. Fill in category, insight, coaching implication
4. Approve in Insights tab

### Key Storage Keys

```typescript
STORAGE_KEYS = {
  PROCESSING_QUEUE: 'moodleaf_youtube_queue',
  PROCESSED_VIDEOS: 'moodleaf_processed_videos',
  PENDING_INSIGHTS: 'moodleaf_youtube_pending_insights',
  APPROVED_INSIGHTS: 'moodleaf_youtube_approved_insights',
  CURATED_CHANNELS: 'moodleaf_curated_channels',
  INSIGHT_HASHES: 'moodleaf_insight_hashes',
  QUALITY_STATS: 'moodleaf_quality_stats',
};
```

---

*Document Version: 2.0*
*Last Updated: January 2025*
*Status: Reflects actual codebase state*
