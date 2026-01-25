# Training Studio - Future Project

> **Status:** Planning document - not to be built now
> **Purpose:** Separate application for harvesting and processing training data
> **Relationship to Mood Leaf:** Produces training data that Mood Leaf consumes

---

## Repository Structure: Same Repo (Monorepo)

**Recommendation: Keep in same repo as Mood Leaf**

```
/Mood-Leaf/                          # Single GitHub repo
├── moodling-app/                    # React Native app (existing)
│   └── ...
├── training-studio/                 # NEW: Python + Web app
│   ├── backend/                     # Python FastAPI
│   │   ├── main.py
│   │   ├── transcription.py
│   │   ├── diarization.py
│   │   ├── prosody.py
│   │   ├── facial.py
│   │   └── requirements.txt
│   ├── frontend/                    # React web UI
│   │   ├── src/
│   │   └── package.json
│   └── README.md
├── docs/                            # Shared documentation
│   └── ...
└── README.md
```

### Why Monorepo?

| ✅ Pros | ❌ Cons |
|---------|---------|
| Shared types/interfaces | Larger repo size |
| One place for all docs | Different languages (TS + Python) |
| Easier cross-references | Different deploy pipelines |
| Simpler for solo/small team | |
| Single source of truth | |

### Why NOT Separate Repos?

- More overhead managing two repos
- Documentation gets fragmented
- Harder to keep types in sync
- No real benefit for a small team

---

## Why Separate Apps (but same repo)?

| Concern | Solution |
|---------|----------|
| Mood Leaf app bloat | Training code lives elsewhere |
| App store risk | Harvesting tools never touch app stores |
| Python dependencies | Desktop/server app can use native Python |
| Heavy processing | Server-grade CPU/GPU, not mobile |
| Admin vs user | Clear separation of concerns |

---

## Two Data Streams, Two Purposes

### The Dual-Purpose Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      TRAINING DATA STREAMS                           │
├────────────────────────────────┬────────────────────────────────────┤
│                                │                                     │
│   TRANSCRIPTS (Text)           │   AUDIO/VIDEO (Media)              │
│   ─────────────────────        │   ─────────────────────            │
│                                │                                     │
│   Purpose:                     │   Purpose:                         │
│   • WISDOM                     │   • ALIVENESS                      │
│   • What to say                │   • How to say it                  │
│   • Human knowledge            │   • Human expression               │
│   • Emotional intelligence     │   • Prosodic patterns              │
│   • Coping strategies          │   • Facial expressions             │
│   • Life lessons               │   • Voice quality                  │
│   • Therapeutic techniques     │   • Cadence/rhythm                 │
│                                │                                     │
│   Makes AI:                    │   Makes AI:                        │
│   • Knowledgeable              │   • Natural                        │
│   • Wise                       │   • Alive                          │
│   • Helpful                    │   • Human-feeling                  │
│   • Understanding              │   • Emotionally attuned            │
│                                │                                     │
│   Source:                      │   Source:                          │
│   • Invidious API (fast)       │   • yt-dlp download (slow)         │
│   • Already built ✅           │   • Needs Training Studio          │
│                                │                                     │
└────────────────────────────────┴────────────────────────────────────┘
```

### Stream 1: Transcripts → Wisdom (✅ ALREADY WORKING)

**Existing infrastructure:** `transcript-server/`

```
transcript-server/
├── server.js           # Express server on port 3333
├── package.json
└── README.md

Endpoints:
├── GET  /transcript?v=VIDEO_ID     # Single transcript via yt-dlp
├── POST /batch-transcripts         # Batch transcripts
└── POST /claude-extract            # Claude API proxy for insights

To start:
  cd ~/Desktop/Mood-Leaf/transcript-server
  npm install
  npm start
```

What the current system extracts:
- **Life lessons** - What people have learned
- **Coping strategies** - What helps and hurts
- **Emotional patterns** - How people describe feelings
- **Therapeutic insights** - Techniques that work
- **Human stories** - Real experiences
- **Relationship wisdom** - Love, friendship, family
- **Humor & warmth** - What makes conversations feel good

**This makes the AI coach WISE and UNDERSTANDING.**

### Stream 2: Audio/Video → Aliveness (🔨 NEEDS TRAINING STUDIO)

**What Training Studio adds** (extends existing transcript-server):

```
training-studio/                    # NEW - adds to existing system
├── backend/
│   ├── download.py                # yt-dlp video/audio download
│   ├── transcription.py           # Whisper (word-level timing)
│   ├── diarization.py             # pyannote (speaker separation)
│   ├── prosody.py                 # librosa/parselmouth
│   ├── facial.py                  # MediaPipe/DeepFace
│   └── main.py                    # FastAPI server
└── frontend/                       # Web UI for analysis review
```

What full media processing extracts:
- **Prosody** - Rhythm, cadence, pitch, pauses
- **Voice quality** - Warmth, tremor, breathiness
- **Facial expressions** - Emotions, micro-expressions
- **Distress markers** - Crying, voice breaks
- **Speaking patterns** - Rate, emphasis, flow
- **Mirroring** - How people sync with each other

**This makes the AI coach feel ALIVE and HUMAN.**

### Both Are Needed

| Without Transcripts | Without Audio/Video |
|---------------------|---------------------|
| AI doesn't know what to say | AI sounds robotic |
| No wisdom or insight | No natural rhythm |
| Generic responses | Mechanical pacing |
| Missing emotional intelligence | Missing "aliveness" |

**The goal: AI that is both WISE and ALIVE.**

---

## Current State: Transcripts Working, Media Needs Building

### Current State (Transcript-Only) - ✅ WORKING

```
YouTube Video
     │
     ▼
┌─────────────────────────┐
│  Invidious API          │
│  (transcript only)      │
└───────────┬─────────────┘
            │
            ▼
    ┌───────────────┐
    │  Text Only    │
    │  • Words      │
    │  • Timestamps │
    └───────────────┘
```

**What we get:**
- ✅ Transcript text
- ✅ Word timestamps
- ✅ Speaker labels (sometimes)
- ❌ NO audio
- ❌ NO video
- ❌ NO prosody (pitch, volume, rate)
- ❌ NO facial expressions
- ❌ NO voice quality

### What We Need (Full Behavioral Analytics)

```
YouTube Video
     │
     ▼
┌─────────────────────────┐
│  yt-dlp                 │
│  (full download)        │
└───────────┬─────────────┘
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
┌─────────┐   ┌─────────┐
│  Audio  │   │  Video  │
│  (.wav) │   │  (.mp4) │
└────┬────┘   └────┬────┘
     │             │
     ▼             ▼
┌─────────────────────────────────────────────────────────┐
│                   FULL ANALYSIS                          │
│                                                          │
│  Audio Processing:           Video Processing:           │
│  • Whisper transcription     • Face detection            │
│  • Speaker diarization       • Emotion recognition       │
│  • Pitch extraction          • Action Units (FACS)       │
│  • Volume dynamics           • Gaze tracking             │
│  • Speech rate               • Body language             │
│  • Pause patterns            • Micro-expressions         │
│  • Voice quality             │                           │
│  • Distress markers          │                           │
│    (crying, tremor, etc.)    │                           │
└─────────────────────────────────────────────────────────┘
```

---

## Data Gap Analysis

| Feature | Current (Transcript) | Needed (Full) | Gap |
|---------|---------------------|---------------|-----|
| **What was said** | ✅ Yes | ✅ Yes | None |
| **Who said it** | ⚠️ Sometimes | ✅ Always | Speaker diarization |
| **Speech rate (WPM)** | ⚠️ Estimated | ✅ Precise | Audio analysis |
| **Pitch/intonation** | ❌ No | ✅ Yes | Audio required |
| **Volume dynamics** | ❌ No | ✅ Yes | Audio required |
| **Pause patterns** | ⚠️ Estimated | ✅ Precise | Audio required |
| **Voice quality** | ❌ No | ✅ Yes | Audio required |
| **Distress markers** | ❌ No | ✅ Yes | Audio required |
| **Facial emotions** | ❌ No | ✅ Yes | Video required |
| **Eye gaze** | ❌ No | ✅ Yes | Video required |
| **Body language** | ❌ No | ✅ Yes | Video required |

### Conclusion

**Transcripts alone give us ~30% of the behavioral data.**

For the full "Aliveness" analysis (prosody, cadence, emotional expression), we need actual audio/video files.

---

## Training Studio Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    TRAINING STUDIO                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    WEB UI                            │    │
│  │  (React/Next.js)                                     │    │
│  │                                                      │    │
│  │  • Channel management                                │    │
│  │  • Batch processing queue                            │    │
│  │  • Insight review/approval                           │    │
│  │  • Statistics dashboard                              │    │
│  │  • Training data export                              │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│                         │ REST API                           │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 PYTHON BACKEND                       │    │
│  │  (FastAPI)                                           │    │
│  │                                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │   Ingest    │  │   Process   │  │   Analyze   │  │    │
│  │  │             │  │             │  │             │  │    │
│  │  │ • yt-dlp    │  │ • Whisper   │  │ • Claude    │  │    │
│  │  │ • Channel   │  │ • pyannote  │  │ • Quality   │  │    │
│  │  │   fetch     │  │ • librosa   │  │   scoring   │  │    │
│  │  │ • Queue     │  │ • MediaPipe │  │ • Dedup     │  │    │
│  │  │   mgmt      │  │ • DeepFace  │  │ • Insights  │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  │                                                      │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   DATABASE                           │    │
│  │  (PostgreSQL + pgvector)                             │    │
│  │                                                      │    │
│  │  • Videos metadata                                   │    │
│  │  • Transcripts                                       │    │
│  │  • Prosodic features                                 │    │
│  │  • Facial features                                   │    │
│  │  • Extracted insights                                │    │
│  │  • Vector embeddings (for semantic search)           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 FILE STORAGE                         │    │
│  │  (Local disk or S3)                                  │    │
│  │                                                      │    │
│  │  • Downloaded videos (temporary)                     │    │
│  │  • Extracted audio (.wav)                            │    │
│  │  • Processed frames (temporary)                      │    │
│  │  • Training data exports (.jsonl)                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Web UI** | React + Next.js | Admin interface |
| **API Server** | Python + FastAPI | Backend orchestration |
| **Video Download** | yt-dlp | Fetch YouTube content |
| **Transcription** | OpenAI Whisper (large-v3) | Speech-to-text |
| **Speaker Separation** | pyannote-audio | Who said what |
| **Audio Features** | librosa + parselmouth | Prosody extraction |
| **Face Detection** | MediaPipe | Face localization |
| **Emotion Recognition** | DeepFace or Py-Feat | Facial emotions |
| **Action Units** | OpenFace or Py-Feat | FACS coding |
| **Insight Extraction** | Claude API | Generate training insights |
| **Database** | PostgreSQL + pgvector | Storage + vector search |
| **File Storage** | Local / S3 | Media files |

---

## Processing Pipeline

### Step 1: Ingest

```python
# Download video + audio
yt-dlp -f 'bestvideo[height<=720]+bestaudio' \
       -o '%(id)s.%(ext)s' \
       --write-auto-sub \
       'https://youtube.com/watch?v=VIDEO_ID'

# Extract audio only (for processing)
ffmpeg -i video.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 audio.wav
```

### Step 2: Transcribe + Diarize

```python
# Whisper transcription with word-level timestamps
result = whisper.transcribe(
    "audio.wav",
    model="large-v3",
    word_timestamps=True,
    language="en"
)

# Speaker diarization
from pyannote.audio import Pipeline
diarization = Pipeline.from_pretrained("pyannote/speaker-diarization-3.0")
speakers = diarization("audio.wav")
```

### Step 3: Extract Prosody

```python
import librosa
import parselmouth

# Load audio
y, sr = librosa.load("audio.wav")

# Pitch (F0)
sound = parselmouth.Sound("audio.wav")
pitch = sound.to_pitch()
f0_values = pitch.selected_array['frequency']

# Speech rate, pauses, volume, etc.
# (detailed extraction per the interviewAnalysisService.ts types)
```

### Step 4: Extract Facial Features (if video)

```python
import mediapipe as mp
import cv2
from deepface import DeepFace

# Face mesh for landmarks
face_mesh = mp.solutions.face_mesh.FaceMesh()

# Process frames
cap = cv2.VideoCapture("video.mp4")
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Face detection
    results = face_mesh.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

    # Emotion recognition
    emotions = DeepFace.analyze(frame, actions=['emotion'])
```

### Step 5: Generate Insights

```python
# Send to Claude with full context
prompt = f"""
Analyze this interview segment:

Transcript: {transcript}
Speaker: {speaker_role}
Prosody: {prosody_features}
Emotions: {facial_emotions}

Extract insights for training an AI coach...
"""

response = claude.messages.create(
    model="claude-sonnet-4-20250514",
    messages=[{"role": "user", "content": prompt}]
)
```

### Step 6: Store + Export

```python
# Store in database
db.insert_insight(insight)

# Export for training
export_training_data(format="jsonl", output="training_data.jsonl")
```

---

## Files to Remove from Mood Leaf

When Training Studio is ready, remove these from `moodling-app/`:

### Services (move to Training Studio)
- `services/youtubeProcessorService.ts` (~1200 lines)
- `services/interviewAnalysisService.ts` (~835 lines)
- `services/prosodyExtractionService.ts` (~300 lines)
- `services/trainingDataService.ts`
- `services/trainingQualityService.ts`
- `services/trainingStatusService.ts`
- `services/trainingCleanupService.ts`

### UI (move to Training Studio)
- `app/admin/interview-processor.tsx`
- `app/admin/training.tsx`

### Documentation (move to Training Studio repo)
- `docs/TRAINING_ADMIN_MANUAL.md`
- `docs/AI_TRAINING_SYSTEM_MANUAL.md`
- `docs/TRAINING_FOR_BEGINNERS.md`
- `docs/TRAINING_MODULE.md`
- `docs/What We're Building: Behavioral Analytics System.md`
- `docs/Training Studio - Future Project.md` (this file)

---

## Estimated Effort

| Phase | Work | Time |
|-------|------|------|
| **1. Backend scaffold** | FastAPI, database, yt-dlp | 1 week |
| **2. Transcription** | Whisper integration | 3-4 days |
| **3. Diarization** | pyannote integration | 3-4 days |
| **4. Prosody extraction** | librosa/parselmouth | 1 week |
| **5. Web UI** | React dashboard | 1-2 weeks |
| **6. Facial analysis** | MediaPipe/DeepFace | 1 week |
| **7. Insight generation** | Claude integration | 3-4 days |
| **8. Polish + testing** | End-to-end testing | 1 week |

**Total: ~6-8 weeks**

---

## Storage Requirements

| Content Type | Size per Video | 1000 Videos |
|--------------|----------------|-------------|
| Video (720p, 30min avg) | ~500 MB | 500 GB |
| Audio (WAV, 30min) | ~150 MB | 150 GB |
| Transcripts | ~50 KB | 50 MB |
| Prosodic features | ~100 KB | 100 MB |
| Facial features | ~200 KB | 200 MB |
| Insights (JSON) | ~20 KB | 20 MB |

**Note:** Videos can be deleted after processing. Only keep:
- Transcripts
- Prosodic features
- Facial features (aggregated, not frames)
- Insights

Estimated permanent storage: **~500 MB per 1000 videos**

---

## Legal Considerations

### YouTube Terms of Service
- Downloading videos violates YouTube ToS
- For research/educational purposes, consider:
  - Using only publicly available content
  - Not redistributing downloaded content
  - Deleting source files after processing
  - Only storing derived features, not raw media

### Fair Use Considerations
- Transformative use (extracting features, not republishing)
- Educational/research purpose
- No commercial redistribution of content
- Attribution maintained in database

### Privacy
- No PII extracted from videos
- Faces → features only, no stored images
- Voices → prosodic features only, no stored audio
- All data anonymized before training use

---

## Output: Training Data Format

The final output for Mood Leaf AI training:

```jsonl
{"category": "emotional_struggles", "insight": "...", "coaching_implication": "...", "prosody": {...}, "source": "video_id"}
{"category": "coping_strategies", "insight": "...", "coaching_implication": "...", "prosody": {...}, "source": "video_id"}
...
```

This `.jsonl` file can be:
1. Imported into Mood Leaf's existing training system
2. Used to fine-tune models
3. Fed into RAG systems for coach context

---

## Next Steps (When Ready to Build)

1. Create folder: `/Mood-Leaf/training-studio/`
2. Scaffold Python backend with FastAPI
3. Implement yt-dlp download pipeline
4. Add Whisper transcription
5. Add pyannote diarization
6. Add prosody extraction
7. Build React web UI
8. Add facial analysis (optional, phase 2)
9. Test end-to-end pipeline
10. **Copy/migrate existing code from Mood Leaf** (see below)
11. Remove training code from Mood Leaf

---

## Code Migration: Copy from Mood Leaf to Training Studio

> **GOAL:** Copy all training-related code from `moodling-app/` to `training-studio/`,
> then eventually DELETE it from Mood Leaf to keep the app lean.

### Files to Copy/Migrate

#### Services (TypeScript → Port to Python or keep as reference)

| Source File | Lines | What It Contains | Migration Action |
|-------------|-------|------------------|------------------|
| `moodling-app/services/youtubeProcessorService.ts` | 1200+ | Channel management, video fetching, insight extraction, quality scoring, deduplication, batch processing | Port core logic to Python backend |
| `moodling-app/services/interviewAnalysisService.ts` | 835 | Prosody types, interview dynamics, speaker profiles, distress markers, statistics types | Convert types to Python Pydantic models |
| `moodling-app/services/prosodyExtractionService.ts` | 300+ | Prosodic feature types, voice quality types | Convert types to Python Pydantic models |
| `moodling-app/services/trainingDataService.ts` | - | Training data storage, retrieval | Port to Python with SQLite/PostgreSQL |
| `moodling-app/services/trainingQualityService.ts` | - | Quality metrics, scoring | Port to Python |
| `moodling-app/services/trainingStatusService.ts` | - | Processing status tracking | Port to Python |
| `moodling-app/services/trainingCleanupService.ts` | - | Data cleanup utilities | Port to Python |

#### UI Components (React Native → Port to React/Next.js Web)

| Source File | What It Contains | Migration Action |
|-------------|------------------|------------------|
| `moodling-app/app/admin/interview-processor.tsx` | Full harvester UI: channels, batch, process, review, stats tabs | Port to Next.js web app |
| `moodling-app/app/admin/training.tsx` | Training admin panel | Port to Next.js web app |

#### Key Data Structures to Preserve

```typescript
// From youtubeProcessorService.ts - MUST PRESERVE
const CHANNEL_CATEGORIES = [...];           // 60+ channel categories
const EXTRACTION_CATEGORIES = [...];        // 50+ insight extraction types
const RECOMMENDED_CHANNELS = [...];         // 60+ pre-populated channels
const QUALITY_THRESHOLDS = {...};           // Scoring thresholds

// From interviewAnalysisService.ts - MUST PRESERVE
type MetricalFoot = 'iamb' | 'trochee' | ...;
interface ScansionAnalysis {...};
interface RhythmAnalysis {...};
interface CadenceAnalysis {...};
interface SpeakerProfile {...};
interface InterviewDynamics {...};
interface DistressMarkerProfile {...};
type InterviewType = 'therapeutic_session' | ...;
type TherapeuticApproach = 'cbt' | 'dbt' | ...;

// From prosodyExtractionService.ts - MUST PRESERVE
interface ProsodicFeatures {...};
interface VoiceQualityFeatures {...};
```

### Migration Process

```
Step 1: COPY (Don't delete yet)
─────────────────────────────────────────────────────────────────
moodling-app/services/youtubeProcessorService.ts
    │
    └──► training-studio/reference/youtubeProcessorService.ts
    └──► training-studio/backend/youtube.py (port to Python)

moodling-app/services/interviewAnalysisService.ts
    │
    └──► training-studio/reference/interviewAnalysisService.ts
    └──► training-studio/backend/models.py (Pydantic models)

moodling-app/app/admin/interview-processor.tsx
    │
    └──► training-studio/reference/interview-processor.tsx
    └──► training-studio/frontend/src/app/processor/page.tsx


Step 2: VERIFY Training Studio works
─────────────────────────────────────────────────────────────────
- All channels load correctly
- Batch processing works
- Insight extraction works
- Quality scoring works
- Statistics dashboard works


Step 3: DELETE from Mood Leaf (only after Step 2 verified)
─────────────────────────────────────────────────────────────────
rm moodling-app/services/youtubeProcessorService.ts
rm moodling-app/services/interviewAnalysisService.ts
rm moodling-app/services/prosodyExtractionService.ts
rm moodling-app/services/trainingDataService.ts
rm moodling-app/services/trainingQualityService.ts
rm moodling-app/services/trainingStatusService.ts
rm moodling-app/services/trainingCleanupService.ts
rm moodling-app/app/admin/interview-processor.tsx
rm moodling-app/app/admin/training.tsx
```

### Existing transcript-server (Already Separate)

The `transcript-server/` folder is already outside of `moodling-app/`:

```
/Mood-Leaf/
├── moodling-app/           # React Native app (will be cleaned)
├── transcript-server/      # Already separate ✅
│   ├── server.js           # yt-dlp + transcript fetching
│   ├── package.json
│   └── README.md
└── training-studio/        # New (will contain migrated code)
    ├── backend/
    ├── frontend/
    ├── reference/          # Original TS files for reference
    └── docs/
```

### What Stays in Mood Leaf After Migration

Only user-facing features:
- ✅ Coach chat
- ✅ Journaling
- ✅ Skills & games
- ✅ Tree visualization
- ✅ Onboarding
- ✅ Settings (user-facing only)
- ✅ User cadence analysis (on-device, if built)

**Everything training/harvesting related → Training Studio**
11. Remove training code from Mood Leaf

---

## Claude Build Instructions

> **For Claude:** When the user says "build the Training Studio" or similar, follow these instructions.

### Location

**Same repo as Mood Leaf, NOT a separate repo.**

```bash
# Create in the existing Mood-Leaf repo
cd /home/user/Mood-Leaf
mkdir -p training-studio/backend training-studio/frontend
```

### Phase 1: Backend Scaffold

```bash
# Create Python backend structure
cd /home/user/Mood-Leaf/training-studio/backend

# Create these files:
# - main.py (FastAPI app)
# - requirements.txt
# - transcription.py (Whisper)
# - diarization.py (pyannote)
# - prosody.py (librosa/parselmouth)
# - facial.py (MediaPipe/DeepFace)
# - database.py (SQLite/PostgreSQL)
# - models.py (Pydantic models matching interviewAnalysisService.ts types)
```

**requirements.txt:**
```
fastapi>=0.109.0
uvicorn>=0.27.0
openai-whisper>=20231117
pyannote.audio>=3.1.0
librosa>=0.10.1
parselmouth>=0.4.3
mediapipe>=0.10.9
deepface>=0.0.79
opencv-python>=4.9.0
numpy>=1.26.0
pydantic>=2.5.0
python-multipart>=0.0.6
aiofiles>=23.2.1
sqlalchemy>=2.0.25
```

**main.py skeleton:**
```python
from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Mood Leaf Training Studio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...)):
    """Transcribe audio using Whisper"""
    pass

@app.post("/api/diarize")
async def diarize(file: UploadFile = File(...)):
    """Separate speakers using pyannote"""
    pass

@app.post("/api/extract-prosody")
async def extract_prosody(file: UploadFile = File(...)):
    """Extract prosodic features"""
    pass

@app.post("/api/analyze-interview")
async def analyze_interview(file: UploadFile = File(...)):
    """Full interview analysis"""
    pass

@app.get("/api/statistics")
async def get_statistics():
    """Get aggregate statistics"""
    pass

@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

### Phase 2: Frontend Scaffold

```bash
cd /home/user/Mood-Leaf/training-studio/frontend
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
```

**Key pages to create:**
- `src/app/page.tsx` - Dashboard
- `src/app/channels/page.tsx` - Channel management
- `src/app/process/page.tsx` - Video processing
- `src/app/review/page.tsx` - Insight review
- `src/app/statistics/page.tsx` - Analytics dashboard

### Phase 3: Port Existing Code

**Copy types from Mood Leaf:**
- `interviewAnalysisService.ts` → Convert to Python Pydantic models
- `prosodyExtractionService.ts` → Convert to Python Pydantic models
- `youtubeProcessorService.ts` → Port relevant logic to Python

**Copy UI patterns from:**
- `app/admin/interview-processor.tsx` → Port to React/Next.js
- `app/admin/training.tsx` → Port to React/Next.js

### Phase 4: Implement Processing

**Whisper transcription:**
```python
import whisper

model = whisper.load_model("large-v3")

def transcribe(audio_path: str):
    result = model.transcribe(
        audio_path,
        word_timestamps=True,
        language="en"
    )
    return result
```

**Speaker diarization:**
```python
from pyannote.audio import Pipeline

pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization-3.0",
    use_auth_token="YOUR_HF_TOKEN"
)

def diarize(audio_path: str):
    diarization = pipeline(audio_path)
    speakers = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        speakers.append({
            "start": turn.start,
            "end": turn.end,
            "speaker": speaker
        })
    return speakers
```

**Prosody extraction:**
```python
import librosa
import parselmouth

def extract_prosody(audio_path: str):
    # Load with librosa
    y, sr = librosa.load(audio_path)

    # Pitch with parselmouth
    sound = parselmouth.Sound(audio_path)
    pitch = sound.to_pitch()

    # Extract features matching ProsodicFeatures type
    return {
        "rhythm": {...},
        "cadence": {...},
        "tempo": {...},
        # etc.
    }
```

### Phase 5: Test & Integrate

```bash
# Run backend
cd /home/user/Mood-Leaf/training-studio/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Run frontend
cd /home/user/Mood-Leaf/training-studio/frontend
npm run dev
```

### Phase 6: Remove from Mood Leaf

After Training Studio is working, delete these from `moodling-app/`:

```bash
# Services
rm moodling-app/services/youtubeProcessorService.ts
rm moodling-app/services/interviewAnalysisService.ts
rm moodling-app/services/prosodyExtractionService.ts
rm moodling-app/services/trainingDataService.ts
rm moodling-app/services/trainingQualityService.ts
rm moodling-app/services/trainingStatusService.ts
rm moodling-app/services/trainingCleanupService.ts

# UI
rm moodling-app/app/admin/interview-processor.tsx
rm moodling-app/app/admin/training.tsx
```

### Key Reference Files

When building, refer to these existing files for types and logic:

| Mood Leaf File | Contains |
|----------------|----------|
| `services/interviewAnalysisService.ts` | All prosody/interview types |
| `services/prosodyExtractionService.ts` | Voice quality types |
| `services/youtubeProcessorService.ts` | Extraction categories, quality scoring |
| `app/admin/interview-processor.tsx` | UI patterns, channel list |
| `docs/TRAINING_ADMIN_MANUAL.md` | Aliveness philosophy |

### Environment Variables Needed

```bash
# training-studio/backend/.env
ANTHROPIC_API_KEY=sk-ant-...
HUGGINGFACE_TOKEN=hf_...  # For pyannote
OPENAI_API_KEY=sk-...     # Optional, for Whisper API fallback
DATABASE_URL=sqlite:///./training.db
```

---

*Document Version: 1.1*
*Created: January 2025*
*Updated: January 2025*
*Status: Planning - Do Not Build Yet*
