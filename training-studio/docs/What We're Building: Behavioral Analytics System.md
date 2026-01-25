# Behavioral Analytics System - Complete Specification

## Executive Summary

### The Goal: Train Llama to Be a Human-Feeling Coach

The Behavioral Analytics System harvests YouTube content to build training data for **fine-tuning Llama** (or other open-source LLMs). The goal is an AI coach that:
- Knows **WHAT** to say (wisdom from transcripts)
- Knows **HOW** to say it (aliveness from audio/video)
- Feels **human**, not robotic

### Yes, We Download Full Videos

This system downloads **full video and audio files** (via yt-dlp), not just transcripts. This is required for:
- Prosody extraction (pitch, rhythm, pauses)
- Facial expression analysis
- Voice quality detection
- Distress marker identification

The Behavioral Analytics System harvests YouTube content to extract two types of training data:

| Stream | Purpose | What We Extract | Makes AI... |
|--------|---------|-----------------|-------------|
| **Transcripts** | Wisdom | What people say, life lessons, coping strategies | Knowledgeable, wise |
| **Audio/Video** | Aliveness | How people speak/express, prosody, facial expressions | Natural, human-feeling |

---

## The Two-Stream Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         YOUTUBE VIDEO INPUT                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────────┐
│     STREAM 1: TRANSCRIPTS       │   │     STREAM 2: AUDIO/VIDEO           │
│         (WISDOM)                │   │         (ALIVENESS)                 │
├─────────────────────────────────┤   ├─────────────────────────────────────┤
│                                 │   │                                     │
│  Source: Invidious API          │   │  Source: yt-dlp full download       │
│  Status: ✅ WORKING             │   │  Status: 🔨 NEEDS TRAINING STUDIO   │
│                                 │   │                                     │
│  Extracts:                      │   │  Extracts:                          │
│  • Words spoken                 │   │  • Prosody (how words are said)     │
│  • Life lessons                 │   │  • Facial expressions               │
│  • Coping strategies            │   │  • Voice quality                    │
│  • Emotional patterns           │   │  • Distress markers                 │
│  • Therapeutic insights         │   │  • Body language                    │
│  • Relationship wisdom          │   │  • Eye movements                    │
│  • Human stories                │   │  • Micro-expressions                │
│                                 │   │                                     │
│  Makes AI:                      │   │  Makes AI:                          │
│  • Know what to say             │   │  • Know HOW to say it               │
│  • Understand emotions          │   │  • Feel natural/human               │
│  • Give wise advice             │   │  • Match user's energy              │
│  • Recognize patterns           │   │  • Respond with aliveness           │
│                                 │   │                                     │
└─────────────────────────────────┘   └─────────────────────────────────────┘
```

---

## Part 1: Prosody Extraction (Audio Analysis)

### What Is Prosody?

Prosody = the music of speech. It's not WHAT you say, but HOW you say it.

### Prosodic Features We Extract

#### 1.1 Pitch Analysis

| Feature | What It Measures | Emotional Indicator |
|---------|------------------|---------------------|
| **Pitch Mean (F0)** | Average fundamental frequency | Baseline vocal register |
| **Pitch Range** | Highest - lowest pitch | Emotional expressiveness |
| **Pitch Variability** | Standard deviation of F0 | Engagement, liveliness |
| **Pitch Contour** | Pattern over time (rising/falling) | Question vs statement, mood |
| **Pitch Peaks** | Moments of high pitch | Excitement, emphasis, stress |
| **Pitch Valleys** | Moments of low pitch | Sadness, fatigue, calm |

```python
# Pitch extraction with parselmouth
import parselmouth

sound = parselmouth.Sound("audio.wav")
pitch = sound.to_pitch()

pitch_values = pitch.selected_array['frequency']
pitch_mean = np.nanmean(pitch_values)
pitch_std = np.nanstd(pitch_values)
pitch_range = np.nanmax(pitch_values) - np.nanmin(pitch_values)
```

#### 1.2 Rhythm & Tempo Analysis

| Feature | What It Measures | Emotional Indicator |
|---------|------------------|---------------------|
| **Speech Rate (WPM)** | Words per minute | Anxiety (fast), depression (slow) |
| **Syllables/Second** | Syllabic pace | Processing speed, cognitive load |
| **Articulation Rate** | Speech rate excluding pauses | Speaking style |
| **Tempo Variability** | Changes in speed | Emotional shifts |
| **Rushing Tendency** | Acceleration patterns | Anxiety, urgency |
| **Dragging Tendency** | Deceleration patterns | Fatigue, depression |

```python
# Tempo extraction with librosa
import librosa

y, sr = librosa.load("audio.wav")
tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
onset_env = librosa.onset.onset_strength(y=y, sr=sr)
```

#### 1.3 Pause Analysis

| Feature | What It Measures | Emotional Indicator |
|---------|------------------|---------------------|
| **Pause Frequency** | Pauses per minute | Thoughtfulness, hesitation |
| **Pause Duration (mean)** | Average pause length | Processing time |
| **Pause Duration (max)** | Longest pause | Deep thinking, avoidance |
| **Filled Pauses** | "um", "uh", "like" | Uncertainty, searching |
| **Silent Pauses** | Pure silence | Contemplation, discomfort |
| **Pause Placement** | Before/after key words | Emphasis, hesitation |

```python
# Pause detection
intervals = librosa.effects.split(y, top_db=30)
pauses = []
for i in range(len(intervals) - 1):
    pause_start = intervals[i][1] / sr
    pause_end = intervals[i + 1][0] / sr
    pause_duration = pause_end - pause_start
    if pause_duration > 0.2:  # Minimum 200ms
        pauses.append({
            'start': pause_start,
            'end': pause_end,
            'duration': pause_duration
        })
```

#### 1.4 Volume & Intensity

| Feature | What It Measures | Emotional Indicator |
|---------|------------------|---------------------|
| **Volume Mean** | Average loudness (dB) | Energy level |
| **Volume Range** | Dynamic range | Emotional expression |
| **Volume Peaks** | Moments of high volume | Emphasis, excitement, anger |
| **Volume Valleys** | Moments of low volume | Intimacy, sadness, secrets |
| **Volume Trajectory** | Change over time | Engagement, fatigue |

#### 1.5 Voice Quality

| Feature | What It Measures | Emotional Indicator |
|---------|------------------|---------------------|
| **Jitter** | Pitch irregularity | Stress, age, health |
| **Shimmer** | Amplitude irregularity | Breathiness, fatigue |
| **HNR** | Harmonic-to-noise ratio | Voice clarity |
| **Breathiness** | Air in voice | Intimacy, fatigue, emotion |
| **Creakiness** | Vocal fry | Casual, fatigue, disengagement |
| **Tremor** | Voice shake | Distress, crying, fear |

```python
# Voice quality with parselmouth
point_process = parselmouth.praat.call(sound, "To PointProcess (periodic, cc)", 75, 500)
jitter = parselmouth.praat.call(point_process, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3)
shimmer = parselmouth.praat.call([sound, point_process], "Get shimmer (local)", 0, 0, 0.0001, 0.02, 1.3, 1.6)
```

#### 1.6 Cadence Patterns (Metrical Analysis)

| Pattern | Description | Example | Emotional Quality |
|---------|-------------|---------|-------------------|
| **Iambic** | da-DUM | "I WANT to GO" | Natural, flowing |
| **Trochaic** | DUM-da | "NEver GOING" | Commanding, definitive |
| **Anapestic** | da-da-DUM | "in the NIGHT" | Building, anticipatory |
| **Dactylic** | DUM-da-da | "BEAUtiful" | Expansive, lyrical |
| **Spondaic** | DUM-DUM | "HEART-BREAK" | Heavy, emphatic |

### Prosody Output Schema

```typescript
interface ProsodicFeatures {
  pitch: {
    mean: number;           // Hz
    std: number;            // Hz
    range: number;          // Hz
    contour: number[];      // Time series
    trajectory: 'rising' | 'falling' | 'stable' | 'variable';
  };

  rhythm: {
    speechRate: number;     // WPM
    syllablesPerSecond: number;
    tempoVariability: number;  // 0-1
    dominantPattern: 'iambic' | 'trochaic' | 'anapestic' | 'dactylic' | 'spondaic' | 'mixed';
  };

  pauses: {
    frequency: number;      // Per minute
    meanDuration: number;   // Seconds
    maxDuration: number;    // Seconds
    filledPauseCount: number;
    silentPauseCount: number;
    pattern: 'minimal' | 'normal' | 'frequent' | 'excessive';
  };

  volume: {
    mean: number;           // dB
    range: number;          // dB
    trajectory: 'increasing' | 'decreasing' | 'stable' | 'variable';
  };

  voiceQuality: {
    jitter: number;         // Percentage
    shimmer: number;        // Percentage
    hnr: number;            // dB
    breathiness: number;    // 0-1
    creakiness: number;     // 0-1
    tremor: number;         // 0-1
  };

  overall: {
    aliveness: number;      // 0-100
    naturalness: number;    // 0-100
    emotionalExpressiveness: number;  // 0-100
    engagement: number;     // 0-100
  };
}
```

---

## Part 2: Facial Expression Analysis (Video Analysis)

### What We Extract From Faces

#### 2.1 Basic Emotions (Ekman Model)

| Emotion | Facial Markers | Action Units |
|---------|---------------|--------------|
| **Happy** | Lip corners up, crow's feet | AU6 + AU12 |
| **Sad** | Brow down, lip corners down | AU1 + AU4 + AU15 |
| **Angry** | Brow down, lips pressed | AU4 + AU5 + AU7 + AU23 |
| **Fearful** | Brow raised, eyes wide | AU1 + AU2 + AU4 + AU5 + AU20 |
| **Surprised** | Eyebrows up, mouth open | AU1 + AU2 + AU5 + AU26 |
| **Disgusted** | Nose wrinkle, upper lip raise | AU9 + AU15 + AU16 |
| **Contempt** | One-sided lip raise | AU12 + AU14 (unilateral) |

#### 2.2 Action Units (FACS)

The Facial Action Coding System breaks expressions into individual muscle movements:

| AU | Name | What It Shows |
|----|------|---------------|
| AU1 | Inner Brow Raise | Sadness, worry |
| AU2 | Outer Brow Raise | Surprise |
| AU4 | Brow Lowerer | Anger, concentration |
| AU5 | Upper Lid Raise | Fear, surprise |
| AU6 | Cheek Raise | Genuine smile (Duchenne) |
| AU7 | Lid Tightener | Anger, concentration |
| AU9 | Nose Wrinkle | Disgust |
| AU10 | Upper Lip Raise | Disgust, contempt |
| AU12 | Lip Corner Pull | Smile (any type) |
| AU14 | Dimpler | Contempt |
| AU15 | Lip Corner Depress | Sadness |
| AU17 | Chin Raise | Doubt, anger |
| AU20 | Lip Stretch | Fear |
| AU23 | Lip Tightener | Anger |
| AU24 | Lip Press | Tension |
| AU25 | Lips Part | Various |
| AU26 | Jaw Drop | Surprise |
| AU28 | Lip Suck | Tension, thinking |
| AU43 | Eyes Closed | Rest, pain |
| AU45 | Blink | Normal, stress indicator |

```python
# Facial analysis with Py-Feat
from feat import Detector

detector = Detector()
results = detector.detect_image("frame.jpg")

# Get Action Units
action_units = results.aus
# Get Emotions
emotions = results.emotions
# Get Face landmarks
landmarks = results.landmarks
```

#### 2.3 Micro-expressions

| Type | Duration | What It Reveals |
|------|----------|-----------------|
| **Suppressed** | <500ms | Concealed emotion |
| **Neutralized** | <500ms, returns to neutral | Controlled emotion |
| **Masked** | <500ms, replaced by different emotion | Deliberate cover-up |
| **Fragmentary** | Partial expression | Partial suppression |

#### 2.4 Eye Tracking

| Feature | What It Measures | Indicator |
|---------|------------------|-----------|
| **Gaze Direction** | Where person looks | Attention, avoidance |
| **Gaze Aversion** | Looking away | Shame, discomfort |
| **Pupil Dilation** | Pupil size change | Arousal, interest |
| **Blink Rate** | Blinks per minute | Stress (high), dissociation (low) |
| **Eye Contact Duration** | Time maintaining gaze | Connection, dominance |
| **Saccades** | Rapid eye movements | Processing, searching |

### Facial Analysis Output Schema

```typescript
interface FacialFeatures {
  emotions: {
    neutral: number;      // 0-1 confidence
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    surprised: number;
    disgusted: number;
    contempt: number;
    dominant: EmotionType;
    intensity: number;    // 0-1
  };

  actionUnits: {
    AU1: number;          // 0-5 intensity
    AU2: number;
    AU4: number;
    AU5: number;
    AU6: number;
    AU7: number;
    AU9: number;
    AU10: number;
    AU12: number;
    AU14: number;
    AU15: number;
    AU17: number;
    AU20: number;
    AU23: number;
    AU24: number;
    AU25: number;
    AU26: number;
    AU28: number;
    AU43: number;
    AU45: number;
  };

  gaze: {
    direction: { x: number; y: number };  // Normalized
    aversion: boolean;
    contactDuration: number;  // Seconds
  };

  blink: {
    rate: number;          // Per minute
    pattern: 'normal' | 'frequent' | 'rare' | 'irregular';
  };

  microExpressions: Array<{
    timestamp: number;
    emotion: EmotionType;
    duration: number;      // ms
    type: 'suppressed' | 'neutralized' | 'masked' | 'fragmentary';
  }>;

  headPose: {
    pitch: number;         // Up/down
    yaw: number;           // Left/right
    roll: number;          // Tilt
  };

  overall: {
    authenticity: number;  // 0-100 (fake vs genuine expressions)
    congruence: number;    // 0-100 (face matches words)
    engagement: number;    // 0-100
  };
}
```

---

## Part 3: Mood & Emotional State Detection

### Combined Analysis (Multimodal)

We combine prosody + facial + content for accurate mood detection:

```
┌─────────────────────────────────────────────────────────────────┐
│                    MULTIMODAL MOOD DETECTION                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   VOICE (Prosody)     FACE (Expression)     TEXT (Content)      │
│        30%                  40%                  30%             │
│          │                    │                    │             │
│          └────────────────────┼────────────────────┘             │
│                               │                                  │
│                               ▼                                  │
│                    ┌─────────────────────┐                      │
│                    │   FUSION MODEL      │                      │
│                    │                     │                      │
│                    │  Weighted ensemble  │                      │
│                    │  Cross-modal check  │                      │
│                    │  Confidence score   │                      │
│                    └──────────┬──────────┘                      │
│                               │                                  │
│                               ▼                                  │
│                    ┌─────────────────────┐                      │
│                    │   MOOD OUTPUT       │                      │
│                    │                     │                      │
│                    │  Primary: anxious   │                      │
│                    │  Secondary: hopeful │                      │
│                    │  Intensity: 0.72    │                      │
│                    │  Confidence: 0.85   │                      │
│                    └─────────────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Mood Categories

| Category | Voice Markers | Face Markers | Content Markers |
|----------|--------------|--------------|-----------------|
| **Anxious** | Fast rate, high pitch, tremor | Tense brow, eye widening | "worried", "what if", uncertainty |
| **Depressed** | Slow rate, low pitch, flat | Sad AU1+15, low engagement | "hopeless", "can't", fatigue words |
| **Angry** | Loud, clipped, fast | Furrowed brow, lip press | "frustrated", "unfair", blame |
| **Calm** | Steady rate, mid pitch, smooth | Relaxed, slight smile | Neutral language, longer sentences |
| **Excited** | Fast, varied pitch, loud | Wide eyes, genuine smile | Exclamations, positive words |
| **Sad** | Slow, sighing, low volume | Drooped features, AU1+15 | "miss", "lost", past tense |
| **Fearful** | Shaky, rapid, high pitch | Wide eyes, frozen face | "scared", "worried", escape words |
| **Hopeful** | Rising intonation, warm | Light smile, engaged gaze | Future tense, possibility words |
| **Contemplative** | Slow, measured, pauses | Gaze aversion, thinking face | Questions, "maybe", "I wonder" |
| **Distressed** | Crying markers, voice breaks | Crying AUs, flushed | Crisis language |

### Distress Markers (Special Detection)

| Marker | Audio Detection | Visual Detection |
|--------|-----------------|------------------|
| **Crying** | Wet voice, sniffling, voice breaks | Red eyes, tears, AU1+4+15 |
| **Sobbing** | Rhythmic catches, gasps | Shoulder heaving, face contortion |
| **Voice Break** | Pitch crack, sudden silence | Visible effort, swallowing |
| **Tremor** | Pitch wobble, amplitude variation | Lip quiver, chin tremble |
| **Breath Holding** | Silence, then gasp | Visible tension, then release |
| **Sighing** | Long exhale, pitch drop | Chest deflation, eye close |

```typescript
interface DistressMarkers {
  crying: {
    detected: boolean;
    type: 'tearful' | 'sniffling' | 'sobbing' | 'suppressed' | 'breakthrough';
    intensity: number;  // 0-1
    timestamps: number[];
  };

  voiceBreaks: {
    count: number;
    timestamps: number[];
  };

  tremor: {
    detected: boolean;
    severity: number;  // 0-1
    pattern: 'intermittent' | 'constant' | 'increasing' | 'decreasing';
  };

  breathing: {
    pattern: 'regular' | 'shallow' | 'rapid' | 'held' | 'sighing';
    distressLevel: number;  // 0-1
  };
}
```

---

## Part 4: Interview Dynamics Analysis

When analyzing two-person interviews (therapist + client, host + guest):

### Turn-Taking Patterns

| Pattern | What It Measures | Indicator |
|---------|------------------|-----------|
| **Overlap** | Both speaking at once | Excitement or interruption |
| **Gap Duration** | Silence between turns | Comfort, thoughtfulness |
| **Interruptions** | Cut-offs | Dominance, eagerness |
| **Back-channels** | "mm-hmm", "yeah" | Active listening, rapport |
| **Turn Length Ratio** | Speaking time balance | Power dynamics |

### Rapport Indicators

| Indicator | What It Measures | How Detected |
|-----------|------------------|--------------|
| **Mirroring** | Matching other's style | Prosody similarity over time |
| **Laughter Sync** | Laughing together | Temporal proximity |
| **Energy Matching** | Matching intensity | Volume/rate correlation |
| **Topic Tracking** | Staying with other's topics | Semantic analysis |
| **Validation Markers** | Verbal affirmation | "yes", "exactly", "I hear you" |

### Emotional Journey Mapping

Track how emotions change over a conversation:

```
Session Start ──────────────────────────────────────── Session End

Emotion:  😰 → 😰 → 😢 → 😢 → 🤔 → 🤔 → 😌 → 😌 → 😊
          │    │    │    │    │    │    │    │    │
Time:     0    5   10   15   20   25   30   35   40 min

Arc Type: U-shaped (down then up) - TRANSFORMATIVE
Peak Distress: 12:34 (topic: childhood)
Resolution: 35:00 (insight moment)
Transformation Score: 78/100
```

---

## Part 5: Training Data Output

### How This Feeds Into AI Training

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRAINING DATA PIPELINE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Raw YouTube Videos                                            │
│          │                                                       │
│          ▼                                                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                TRAINING STUDIO                           │   │
│   │                                                          │   │
│   │   Transcript ─┬─► Wisdom Insights ──┐                   │   │
│   │               │                      │                   │   │
│   │   Audio ──────┼─► Prosody Features ─┼─► Training Data   │   │
│   │               │                      │                   │   │
│   │   Video ──────┴─► Facial Features ──┘                   │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│          │                                                       │
│          ▼                                                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                TRAINING OUTPUT                           │   │
│   │                                                          │   │
│   │   training_data.jsonl                                    │   │
│   │   ├── Insight: "When feeling overwhelmed..."            │   │
│   │   ├── Prosody context: {slow, warm, pausing}            │   │
│   │   ├── Emotional context: {calm → supportive}            │   │
│   │   └── Coaching implication: "Match pace, validate..."   │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│          │                                                       │
│          ▼                                                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                MOOD LEAF AI COACH                        │   │
│   │                                                          │   │
│   │   Uses training data to:                                │   │
│   │   • Know WHAT to say (wisdom)                           │   │
│   │   • Know HOW to say it (aliveness)                      │   │
│   │   • Match user's emotional state                        │   │
│   │   • Pace responses appropriately                        │   │
│   │   • Recognize distress patterns                         │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Output Format

```jsonl
{"id": "abc123", "category": "emotional_struggles", "insight": "When someone is catastrophizing, asking 'what's the worst that could happen' often backfires. Instead, acknowledge the fear first.", "coaching_implication": "Don't jump to reframing. Start with 'That sounds really scary' before any cognitive work.", "prosody_context": {"ideal_pace": "slow", "ideal_volume": "soft", "pause_frequency": "high"}, "source_video": "VIDEO_ID", "timestamp": "12:34"}
{"id": "def456", "category": "coping_strategies", "insight": "Physical movement, even small, helps break rumination loops.", "coaching_implication": "Suggest micro-movements: 'What if you stood up for just a moment?' rather than full exercise.", "emotional_context": {"user_state": "stuck", "response_energy": "gentle_activation"}, "source_video": "VIDEO_ID", "timestamp": "23:45"}
```

---

## Part 6: Current Status & What's Needed

### What's Already Built

| Component | Location | Status |
|-----------|----------|--------|
| Transcript fetching | `transcript-server/` | ✅ Working |
| Channel management | `youtubeProcessorService.ts` | ✅ Working |
| Insight extraction | Claude API integration | ✅ Working |
| Quality scoring | `youtubeProcessorService.ts` | ✅ Working |
| Review UI | `interview-processor.tsx` | ✅ Working |
| Prosody types | `interviewAnalysisService.ts` | ✅ Types defined |
| Facial types | `interviewAnalysisService.ts` | ✅ Types defined |

### What Training Studio Needs to Add

| Component | Technology | Status |
|-----------|------------|--------|
| Video download | yt-dlp | 🔨 Needs implementation |
| Audio extraction | ffmpeg | 🔨 Needs implementation |
| Whisper transcription | openai-whisper | 🔨 Needs implementation |
| Speaker diarization | pyannote-audio | 🔨 Needs implementation |
| Prosody extraction | librosa + parselmouth | 🔨 Needs implementation |
| Face detection | MediaPipe | 🔨 Needs implementation |
| Emotion recognition | DeepFace / Py-Feat | 🔨 Needs implementation |
| Action Unit detection | OpenFace / Py-Feat | 🔨 Needs implementation |
| Multimodal fusion | Custom model | 🔨 Needs implementation |

---

## Part 7: Research Foundation

### Accuracy Benchmarks

| Task | State of Art | Our Target |
|------|--------------|------------|
| Facial emotion recognition | 95% (lab) / 85% (wild) | 80% |
| Speech emotion recognition | 75-80% | 70% |
| Depression detection (voice) | 80% sensitivity | 75% |
| Anxiety detection (multimodal) | 82% | 75% |
| Speaker diarization | 95% DER | 90% |

### Key Research Papers

| Paper | Finding | Relevance |
|-------|---------|-----------|
| Cummins et al., 2015 | Depression detectable from voice with 80% accuracy | Prosody validity |
| Girard et al., 2014 | Facial AU intensity correlates with depression severity | Facial analysis validity |
| Schuller et al., 2021 | Multimodal emotion recognition outperforms unimodal | Fusion approach |
| Ekman & Friesen, 1978 | FACS system for coding facial movements | Action Unit basis |
| Juslin & Laukka, 2003 | Vocal emotion expression patterns | Prosody patterns |

---

## Part 8: One-Button Processing Pipeline

The goal is simple: **one button to process an interview and get everything**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ONE-BUTTON INTERVIEW PROCESSING                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   INPUT: Video file or YouTube URL                                          │
│                                                                              │
│                         [  PROCESS  ]                                        │
│                              │                                               │
│                              ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      PROCESSING STEPS                                │   │
│   │                                                                      │   │
│   │   1. Download video + audio (yt-dlp)                                │   │
│   │   2. Extract audio → WAV file (ffmpeg)                              │   │
│   │   3. Transcribe with word timestamps (Whisper)                      │   │
│   │   4. Separate speakers (pyannote diarization)                       │   │
│   │   5. Extract prosody features (librosa + parselmouth)               │   │
│   │   6. Detect emotional markers (crying, tremor, voice breaks)        │   │
│   │   7. Extract facial features from video (MediaPipe + DeepFace)      │   │
│   │   8. Classify interview type + therapeutic approach                 │   │
│   │   9. Generate training insights (Claude API)                        │   │
│   │  10. Score quality on 5 dimensions                                  │   │
│   │  11. Store in database                                              │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│   OUTPUT:                                                                    │
│   ├── Full transcript with word-level timestamps                            │
│   ├── Speaker segments (who said what when)                                 │
│   ├── Prosodic features (tempo, pitch, volume, pauses)                      │
│   ├── Voice quality metrics (jitter, shimmer, tremor)                       │
│   ├── Facial emotion timeline                                               │
│   ├── Distress markers timeline                                             │
│   ├── Interview classification (type, approach, quality)                    │
│   ├── Training insights (wisdom + coaching implications)                    │
│   └── Aliveness scores                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 9: The 10 Aliveness Qualities

These are the qualities that make something feel **alive** rather than **animated**. They're extracted from interviews and used to train the AI coach.

### 1. Imperfect Rhythm
Human things don't loop cleanly. Speech has micro-pauses, uneven timing, accelerations and decelerations.

**What to extract**: Speech rate variability, pause irregularity, tempo changes.

### 2. Asymmetry Over Time
Humans aren't symmetrical in motion. We shift, favor one side, return to center imperfectly.

**What to extract**: How speech patterns shift during conversation. Leading with questions then settling into statements.

### 3. Latency (Reaction Delay)
Living systems don't respond instantly. There's a gap between feeling and expression.

**What to extract**: Response latency, "wait, let me think" moments, processing pauses.

### 4. Rest Is Part of Motion
We don't move constantly. We settle, hover, pause mid-breath.

**What to extract**: Comfortable silences, pauses that aren't awkward, breathing room.

### 5. Amplitude Restraint
Humans rarely move at full range unless distressed. Most motion is 10-20% of possible range.

**What to extract**: Volume restraint, emotional understatement, not-dramatic delivery.

### 6. Flow Without Destination
Human life doesn't always move toward something. Sometimes it just continues.

**What to extract**: Conversations that don't conclude neatly, the messy middle, being without resolution.

### 7. Consistency Across States
Humans don't behave "better" when doing well. Character persists through joy, grief, exhaustion.

**What to extract**: How communication patterns persist across emotional states.

### 8. Scale Independence
Same principles at all scales. A check-in isn't "less" than a deep session.

**What to extract**: How different people embody similar needs at different scales.

### 9. Backgrounded Attention
Humans can be with things that don't demand focus. Companionship without pressure.

**What to extract**: What makes people feel "accompanied" without pressure.

### 10. Non-Instrumentality
Humans can feel when something exists FOR them vs WITH them.

**What to extract**: The distinction between instrumental advice vs real presence.

### Aliveness Scoring

Each interview is scored on these qualities:

```
Aliveness Scores (0-100 each):
├── Imperfect Rhythm:      78  (high speech rate variability)
├── Natural Latency:       85  (presence of thinking pauses)
├── Amplitude Restraint:   62  (moderate, some dramatic moments)
├── Flow Quality:          91  (natural, not choppy)
└── Overall Aliveness:     79  (weighted average)
```

---

## Part 10: Statistics Dashboard

The dashboard shows aggregate metrics across all processed interviews:

```
╔════════════════════════════════════════════════════════════════════════════╗
║                         TRAINING STUDIO DASHBOARD                           ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║  PROCESSING OVERVIEW                                                        ║
║  ┌────────────────────────────────────────────────────────────────────┐    ║
║  │  Total Videos Processed:     1,247                                  │    ║
║  │  Total Hours Analyzed:       2,156 hours                            │    ║
║  │  Approved Insights:          8,432                                  │    ║
║  │  Pending Review:             342                                    │    ║
║  │  Rejected:                   1,891                                  │    ║
║  └────────────────────────────────────────────────────────────────────┘    ║
║                                                                             ║
║  INTERVIEW TYPE BREAKDOWN                                                   ║
║  ┌────────────────────────────────────────────────────────────────────┐    ║
║  │ Therapeutic Session    ████████████████████  42%                   │    ║
║  │ Coaching Conversation  ██████████████        28%                   │    ║
║  │ Crisis Support         ████████              15%                   │    ║
║  │ Skill Teaching         ████                   8%                   │    ║
║  │ Other                  ███                    7%                   │    ║
║  └────────────────────────────────────────────────────────────────────┘    ║
║                                                                             ║
║  THERAPEUTIC APPROACH FREQUENCY                                             ║
║  ┌────────────────────────────────────────────────────────────────────┐    ║
║  │ CBT                    ████████████████████  234 videos            │    ║
║  │ Motivational Interview ████████████████      189 videos            │    ║
║  │ Mindfulness-Based      ██████████████        156 videos            │    ║
║  │ Solution-Focused       ████████████          134 videos            │    ║
║  │ Trauma-Informed        ██████████            112 videos            │    ║
║  │ DBT                    ████████               89 videos            │    ║
║  │ Somatic                ██████                 67 videos            │    ║
║  │ IFS                    ████                   45 videos            │    ║
║  └────────────────────────────────────────────────────────────────────┘    ║
║                                                                             ║
║  EMOTIONAL ARC PATTERNS                                                     ║
║  ┌────────────────────────────────────────────────────────────────────┐    ║
║  │ U-shaped (down→up)        ████████████████  35%  TRANSFORMATIVE   │    ║
║  │ Ascending (improving)     ████████████      25%                   │    ║
║  │ Stable                    ██████████        20%                   │    ║
║  │ Rollercoaster             ██████            12%                   │    ║
║  │ Descending                ████               8%                   │    ║
║  └────────────────────────────────────────────────────────────────────┘    ║
║                                                                             ║
║  DISTRESS MARKER FREQUENCY                                                  ║
║  ┌────────────────────────────────────────────────────────────────────┐    ║
║  │ Crying detected:          23% of interviews                        │    ║
║  │ Voice tremor:             18% of interviews                        │    ║
║  │ Choking/gulping:          12% of interviews                        │    ║
║  │ Breath irregularity:      31% of interviews                        │    ║
║  │ Voice breaks:             15% of interviews                        │    ║
║  └────────────────────────────────────────────────────────────────────┘    ║
║                                                                             ║
║  PROSODY STATISTICS                                                         ║
║  ┌────────────────────────────────────────────────────────────────────┐    ║
║  │ Average Speech Rate:      142 WPM (range: 80-220)                  │    ║
║  │ Average Pitch (F0):       178 Hz (women: 210, men: 125)            │    ║
║  │ Average Pause Duration:   0.8 seconds                              │    ║
║  │ Pause Frequency:          4.2 per minute                           │    ║
║  │ Volume Variability:       12 dB average range                      │    ║
║  └────────────────────────────────────────────────────────────────────┘    ║
║                                                                             ║
║  SPEAKING RATIO (Interviewer vs Interviewee)                                ║
║  ┌────────────────────────────────────────────────────────────────────┐    ║
║  │ Interviewer: ███████████████░░░░░ 38%                              │    ║
║  │ Interviewee: ████████████████████████░░ 62%                        │    ║
║  │                                                                    │    ║
║  │ Ideal ratio: 30-40% interviewer / 60-70% interviewee              │    ║
║  └────────────────────────────────────────────────────────────────────┘    ║
║                                                                             ║
║  ALIVENESS SCORES (Average)                                                 ║
║  ┌────────────────────────────────────────────────────────────────────┐    ║
║  │ Imperfect Rhythm:     ████████████████░░░░  78/100                │    ║
║  │ Natural Latency:      █████████████████░░░  82/100                │    ║
║  │ Amplitude Restraint:  ██████████████░░░░░░  68/100                │    ║
║  │ Flow Quality:         ███████████████████░  89/100                │    ║
║  │ Overall Aliveness:    ████████████████░░░░  79/100                │    ║
║  └────────────────────────────────────────────────────────────────────┘    ║
║                                                                             ║
║  QUALITY SCORE DISTRIBUTION                                                 ║
║  ┌────────────────────────────────────────────────────────────────────┐    ║
║  │ 90-100 (Excellent):   ████████              312 insights          │    ║
║  │ 80-89  (Good):        ██████████████████    1,847 insights        │    ║
║  │ 70-79  (Acceptable):  ████████████████████  2,891 insights        │    ║
║  │ 60-69  (Marginal):    ████████████          1,234 insights        │    ║
║  │ <60    (Rejected):    ██████                 891 insights         │    ║
║  └────────────────────────────────────────────────────────────────────┘    ║
║                                                                             ║
║  TOPIC CLUSTERS                                                             ║
║  ┌────────────────────────────────────────────────────────────────────┐    ║
║  │ ● Anxiety/Fear         ● Relationships        ● Self-Worth        │    ║
║  │ ● Work Stress          ● Family Dynamics      ● Life Transitions  │    ║
║  │ ● Grief/Loss           ● Identity             ● Trauma Recovery   │    ║
║  │ ● Depression           ● Anger Management     ● Addiction         │    ║
║  └────────────────────────────────────────────────────────────────────┘    ║
║                                                                             ║
║  TRAINING GAPS IDENTIFIED                                                   ║
║  ┌────────────────────────────────────────────────────────────────────┐    ║
║  │ ⚠️ Low coverage: Elderly population (3% of data)                  │    ║
║  │ ⚠️ Low coverage: Non-English speakers                             │    ║
║  │ ⚠️ Limited: Male vulnerability examples                           │    ║
║  │ ⚠️ Limited: Neurodivergent-specific techniques                    │    ║
║  └────────────────────────────────────────────────────────────────────┘    ║
║                                                                             ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## Part 11: Llama Fine-Tuning Output

The ultimate goal is to export training data for fine-tuning Llama.

### Training Data Format for Llama

```jsonl
{"messages": [{"role": "system", "content": "You are Moodling, a warm and grounded AI coach. Respond with the aliveness qualities: imperfect rhythm, natural latency, amplitude restraint."}, {"role": "user", "content": "I can't stop worrying about everything"}, {"role": "assistant", "content": "Yeah.\n\nThat sounds exhausting.\n\n...what kind of worrying? The spinning kind, or the heavy kind?"}], "prosody_context": {"ideal_pace": "slow", "ideal_volume": "soft", "pause_frequency": "high"}, "source": "video_abc123"}
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}], "prosody_context": {...}, "source": "..."}
```

### Fine-Tuning Approach

1. **Base model**: Llama 3.1 8B or 70B
2. **Method**: LoRA (Low-Rank Adaptation) for efficient fine-tuning
3. **Training data**: 10,000+ high-quality examples from harvested interviews
4. **Validation**: Held-out test set of real coaching conversations
5. **Evaluation**: Human preference rating + automated aliveness scoring

### Export Pipeline

```
Approved Insights (8,000+)
         │
         ▼
┌─────────────────────────────────┐
│   TRAINING DATA GENERATOR       │
│                                 │
│   1. Format as conversation     │
│   2. Add prosody context        │
│   3. Add system prompt          │
│   4. Validate format            │
│   5. Split train/val/test       │
│                                 │
└─────────────────────────────────┘
         │
         ▼
    training_data.jsonl
    validation_data.jsonl
    test_data.jsonl
         │
         ▼
┌─────────────────────────────────┐
│   LLAMA FINE-TUNING             │
│                                 │
│   - LoRA adapters               │
│   - 3-5 epochs                  │
│   - Learning rate: 1e-4         │
│   - Batch size: 4               │
│                                 │
└─────────────────────────────────┘
         │
         ▼
    moodling-llama-v1.gguf
         │
         ▼
    Deploy to Mood Leaf app
    (on-device inference)
```

---

## Part 12: Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMPLETE DATA FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   60+ CURATED YOUTUBE CHANNELS                                              │
│   (therapy, mental health, vulnerability, wisdom)                           │
│                              │                                               │
│                              ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    TRAINING STUDIO                                   │   │
│   │                                                                      │   │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │   │
│   │   │  DOWNLOAD   │    │   PROCESS   │    │   ANALYZE   │            │   │
│   │   │             │    │             │    │             │            │   │
│   │   │ • yt-dlp    │───▶│ • Whisper   │───▶│ • Claude    │            │   │
│   │   │ • Video     │    │ • pyannote  │    │ • Quality   │            │   │
│   │   │ • Audio     │    │ • librosa   │    │ • Scoring   │            │   │
│   │   │ • Metadata  │    │ • MediaPipe │    │ • Insights  │            │   │
│   │   └─────────────┘    └─────────────┘    └─────────────┘            │   │
│   │                                                │                    │   │
│   │                                                ▼                    │   │
│   │   ┌─────────────────────────────────────────────────────────────┐  │   │
│   │   │                      DATABASE                                │  │   │
│   │   │                                                              │  │   │
│   │   │  Videos │ Transcripts │ Prosody │ Facial │ Insights        │  │   │
│   │   │  ────── │ ─────────── │ ─────── │ ────── │ ────────        │  │   │
│   │   │  1,247  │   1,247     │  1,247  │   892  │   8,432         │  │   │
│   │   │                                                              │  │   │
│   │   └─────────────────────────────────────────────────────────────┘  │   │
│   │                                                │                    │   │
│   │                                                ▼                    │   │
│   │   ┌─────────────────────────────────────────────────────────────┐  │   │
│   │   │                    WEB UI                                    │  │   │
│   │   │                                                              │  │   │
│   │   │  [Channels] [Process] [Review] [Stats] [Export]             │  │   │
│   │   │                                                              │  │   │
│   │   └─────────────────────────────────────────────────────────────┘  │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    TRAINING EXPORT                                   │   │
│   │                                                                      │   │
│   │   training_data.jsonl (10,000+ examples)                            │   │
│   │   ├── Wisdom insights                                               │   │
│   │   ├── Prosody context                                               │   │
│   │   ├── Aliveness markers                                             │   │
│   │   └── Coaching implications                                         │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    LLAMA FINE-TUNING                                 │   │
│   │                                                                      │   │
│   │   Llama 3.1 8B + LoRA → moodling-llama-v1.gguf                      │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    MOOD LEAF APP                                     │   │
│   │                                                                      │   │
│   │   On-device Llama inference                                         │   │
│   │   ├── Knows WHAT to say (wisdom)                                    │   │
│   │   ├── Knows HOW to say it (aliveness)                               │   │
│   │   └── Feels HUMAN, not robotic                                      │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary: What Gets Downloaded & Extracted

### Downloads (per video)

| File | Purpose | Size | Kept? |
|------|---------|------|-------|
| Video (.mp4) | Facial analysis | ~500 MB | Deleted after processing |
| Audio (.wav) | Prosody extraction | ~150 MB | Deleted after processing |
| Transcript (.json) | Word-level timestamps | ~50 KB | Kept |

### Extractions (per video)

| Data | Source | Storage |
|------|--------|---------|
| Full transcript | Whisper | Database |
| Word timestamps | Whisper | Database |
| Speaker segments | pyannote | Database |
| Prosodic features | librosa + parselmouth | Database |
| Facial emotions | DeepFace | Database (features only, not frames) |
| Action Units | Py-Feat | Database |
| Distress markers | Audio analysis | Database |
| Interview classification | Claude | Database |
| Training insights | Claude | Database |
| Quality scores | Claude | Database |
| Aliveness scores | Computed | Database |

### Final Training Output

| Format | Records | Use |
|--------|---------|-----|
| `training_data.jsonl` | 10,000+ | Llama fine-tuning |
| `prosody_features.json` | Per video | Context for inference |
| `insights_approved.json` | 8,000+ | RAG retrieval |

---

*Document Version: 3.0*
*Created: January 2025*
*Status: Complete specification for Training Studio - Llama training edition*
