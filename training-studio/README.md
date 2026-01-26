# Training Studio - MoodLeaf AI Training Data Harvester

A web application for harvesting YouTube interview videos and extracting coaching insights for AI training.

## Quick Start

### One-Button Startup

**For bash/zsh:**
```bash
cd training-studio
./start.sh
```

**For tcsh:**
```tcsh
cd training-studio
source start.csh
```

This will:
1. Check and create Python virtual environment if needed
2. Install frontend dependencies if needed
3. Start both backend (port 8000) and frontend (port 3000)
4. Open http://localhost:3000 in your browser

---

## ⚠️ IMPORTANT: Dependency Management (READ THIS!)

### DO NOT Commit Dependencies!

The following folders are **automatically installed** and should **NEVER be committed to GitHub**:

| Folder | What it is | Why NOT to commit |
|--------|-----------|-------------------|
| `frontend/node_modules/` | JavaScript packages | 100s of MB, platform-specific |
| `backend/venv/` | Python virtual environment | Platform/path-specific |

### What IS Committed (This is correct!)

| File | Purpose |
|------|---------|
| `frontend/package.json` | Lists JS dependencies to install |
| `frontend/package-lock.json` | Locks exact versions |
| `backend/requirements.txt` | Lists Python dependencies to install |

### Setting Up on a New Computer

Just clone the repo and run `./start.sh` - it automatically installs everything fresh!

```bash
git clone <your-repo-url>
cd Mood-Leaf/training-studio
./start.sh
```

### GitHub Desktop Instructions

**If you see `node_modules` or `venv` in your changes list:**

1. **DO NOT check/stage them** - they should be ignored
2. If they appear, the `.gitignore` may not be working. Check that these files exist:
   - `training-studio/frontend/.gitignore` (should contain `node_modules/`)
   - `training-studio/backend/.gitignore` (should contain `venv/`)

**What you SHOULD commit:**
- ✅ Source code files (`.py`, `.tsx`, `.ts`, `.js`)
- ✅ `package.json` and `package-lock.json`
- ✅ `requirements.txt`
- ✅ Configuration files

**What you should NEVER commit:**
- ❌ `node_modules/` folder
- ❌ `venv/` folder
- ❌ `.env` files (contain secrets!)
- ❌ `__pycache__/` folders
- ❌ `.next/` build folder

**To discard unwanted changes in GitHub Desktop:**
1. Right-click on the file/folder in the changes list
2. Select "Discard Changes"

**If dependencies accidentally got staged:**
1. Uncheck them in the changes list
2. Make sure `.gitignore` is properly configured
3. If already committed, you'll need to remove them (ask for help)

---

## Manual Setup

### Prerequisites

1. **Python 3.9+**
2. **Node.js 18+**
3. **yt-dlp** - YouTube downloader
   ```bash
   brew install yt-dlp
   ```
4. **ffmpeg** - Audio/video processing
   ```bash
   brew install ffmpeg
   ```

### Backend Setup

```bash
cd training-studio/backend

# Create virtual environment
python3 -m venv venv

# Activate (choose based on your shell)
source venv/bin/activate      # bash/zsh
source venv/bin/activate.csh  # tcsh

# Install dependencies
pip install -r requirements.txt

# Start server
python3 main.py
```

### Frontend Setup

```bash
cd training-studio/frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## Configuration

### Claude API Key

**Option 1: Environment File**
Create `backend/.env`:
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Option 2: UI Configuration**
1. Open http://localhost:3000
2. In the sidebar, click "Claude API Key"
3. Enter your API key

### Optional: HuggingFace Token (for speaker diarization)
```
HUGGINGFACE_TOKEN=hf_...
```

---

## Features

### Dashboard
- View processing statistics
- Monitor active jobs
- **System Diagnostics** - Test all pipeline components

### Channels
- Add YouTube channels to harvest
- Supports @handle, /channel/, and /c/ URL formats
- Set trust levels and categories

**70+ Recommended Channels**
- Pre-curated list from MoodLeaf's interview sources
- Organized by category: Philosophy, Therapy, Relationships, Grief, Addiction, etc.
- One-click add to your channel list
- Shows "Added" badge for channels already in your list

**Channel Discovery**
- Search through recommended channels by topic
- Quick topic buttons: therapy sessions, emotional intelligence, life coaching, etc.
- Find channels that fit MoodLeaf's coaching style

**AI Channel Recommender**
- Describe what you want your AI to do in natural language
- Claude analyzes your description and recommends the best channels
- Each recommendation includes a personalized explanation of WHY it fits your AI
- Get training tips specific to your use case
- One-click "Add All Recommended" to add all suggested channels
- Example: "I want an AI that helps people cope with grief and loss, providing comfort and understanding"

### Movies

Training Studio can also process movies for rich emotional training data.

**Upload Movies**
- Upload your own movie files (mp4, mkv, avi, etc.)
- Whisper AI automatically extracts and transcribes all dialogue
- More reliable than subtitles (no sync issues, no missing dialogue)
- Categorize movies by emotional theme

**40+ Recommended Movies**
- Pre-curated list organized by emotional category:
  - Grief & Loss (Manchester by the Sea, Ordinary People, etc.)
  - Therapy & Mental Health (Good Will Hunting, Silver Linings Playbook)
  - Addiction & Recovery (Beautiful Boy, 28 Days)
  - Relationships & Love (Marriage Story, Blue Valentine)
  - Trauma & Healing (Room, The Perks of Being a Wallflower)
  - Family Dynamics (Ladybird, The Squid and the Whale)
  - And more...

**AI Movie Recommender**
- Describe your AI's purpose and get personalized movie recommendations
- Each recommendation explains WHY the movie fits your training goals
- Get training tips specific to your use case

**Important**: You must own or have legal rights to any movie files you upload.

### Process Videos

**Simple Mode (Recommended)**
- Uses YouTube's auto-generated transcripts
- Extracts insights with Claude
- Fast and reliable
- Option to auto-approve insights with quality score >= 85

**Full Mode**
- Downloads video/audio
- Whisper transcription
- Speaker diarization
- Prosody analysis
- Facial expression analysis
- More detailed but requires more dependencies

**Batch Processing**
- Process multiple videos from a channel at once
- Click "Batch Process" to enter batch mode
- Select individual videos or "Select All"
- Click "Process X Videos" to start batch
- Videos are queued with automatic pacing to avoid overload

### Review Insights
- View extracted insights
- Approve or reject individually
- **Batch Approve** - Approve all insights with quality >= 85 in one click
- Filter by category and status

### Statistics
- Category distribution charts
- Quality and safety score distributions
- Average scores with progress bars
- Quick stats panel

### Tuning Dashboard

The Tuning page helps you control how each channel influences your training data:

**Channel Influence Controls**
- **Weight Slider** (0x to 2x) - Increase or decrease a channel's influence on training
- **Include Toggle** - Quickly exclude a channel from exports without deleting data
- **Contribution View** - See what percentage of training data each channel provides

**Category Breakdown**
- See which categories each channel contributes (e.g., "emotional regulation", "coping strategies")
- Warning if a channel is too focused on one category (>50%)
- Helps balance your training data across topics

**Quality Alerts**
- Automatically identifies problematic channels/videos with:
  - Low average quality scores (<75)
  - Low safety scores (<75)
  - High rejection rates (>30%)
  - Many flagged insights
- Helps you pinpoint what's contributing bad data

**Data Provenance (Source Tokens)**
- Every insight gets a unique source token
- Track which channel/video each training example came from
- If your fine-tuned model behaves strangely, trace it back to the source
- Delete all insights from a problematic channel or video with one click

### Export

**Recommended Formats (Multi-turn with Emotional Context):**
- **ChatML** - Best for Llama 3+, OpenAI. Includes system prompt and emotional context
- **ShareGPT** - Best for Unsloth. Community standard with human/gpt roles
- **Conversations** - Richest format with therapeutic techniques, emotional states tagged

**Legacy Formats:**
- **Alpaca** - Classic instruction/input/output (single-turn only)
- **JSONL** - JSON Lines with basic messages
- **Raw** - Complete data with all scores and metadata

**Emotional Context in Exports:**
Each training example includes emotional data when available:
```json
{
  "emotional_context": {
    "emotions": ["sad", "anxious"],
    "intensity": 0.7,
    "incongruence": true,
    "therapeutic_response": "Acknowledge the sadness while gently exploring..."
  }
}
```

---

## MoodLeaf Deployment Architecture

Training Studio creates data for a **three-tiered AI architecture** optimized for iOS and Android:

```
┌─────────────────────────────────────────────────────────────────┐
│                    MoodLeaf Mobile App                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TIER 1: BUILT-IN LLM (Instant, Free, Private)                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  iOS: Apple Foundation Models (~3B)                       │   │
│  │  Android: Gemini Nano / On-device Llama                   │   │
│  │                                                           │   │
│  │  Handles:                                                 │   │
│  │  • Quick acknowledgments ("I hear you...")               │   │
│  │  • Context assembly and memory retrieval                 │   │
│  │  • Basic emotion classification                          │   │
│  │  • Session state management                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  TIER 2: LOCAL FINE-TUNED LLAMA (Free, Private, Your Data)     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Llama 3.2 1B-3B (GGUF format via llama.cpp)              │   │
│  │  Fine-tuned on YOUR Training Studio data                  │   │
│  │                                                           │   │
│  │  Handles:                                                 │   │
│  │  • Empathetic coaching responses                         │   │
│  │  • Therapeutic techniques (CBT, DBT, etc.)               │   │
│  │  • Emotion-aware conversations                           │   │
│  │  • 90% of user interactions                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  TIER 3: CLOUD (Optional Premium, Complex Cases)                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Llama 3.1 70B / Claude API                               │   │
│  │                                                           │   │
│  │  Handles:                                                 │   │
│  │  • Complex trauma/crisis situations                      │   │
│  │  • Deep multi-session reasoning                          │   │
│  │  • Premium feature (revenue stream)                      │   │
│  │  • Fallback for edge cases                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why Three Tiers?

| Tier | Cost | Latency | Privacy | Intelligence |
|------|------|---------|---------|--------------|
| Built-in LLM | FREE | Instant | 100% private | Basic |
| Local Llama | FREE | Fast | 100% private | Good (your training) |
| Cloud | Pay-per-use | ~1-2s | Sent to server | Excellent |

### Training Data Flow

```
YouTube Videos → Training Studio → Export (ChatML/ShareGPT)
                                          ↓
                                   Fine-tune with Unsloth
                                          ↓
                              Llama 3.2 3B (your coaching style)
                                          ↓
                              Convert to GGUF for mobile
                                          ↓
                              Deploy in MoodLeaf app
```

### Recommended Setup

**For 100% Free/Private Operation:**
1. Export training data in **ShareGPT** format
2. Fine-tune **Llama 3.2 3B** using Unsloth (free Colab works)
3. Convert to GGUF format
4. Deploy on-device with llama.cpp
5. Use Apple Foundation Models for quick responses (iOS)

**For Premium Features:**
- Add cloud tier for users who want "deeper" sessions
- Host Llama 3.1 8B on Together.ai (~$0.20/1M tokens)
- Or use Claude API for complex cases

### Mobile Framework Recommendations

**iOS:**
- Apple Foundation Models API (iOS 18+, FREE)
- llama.cpp with Core ML optimization
- MLX for Apple Silicon

**Android:**
- llama.cpp with Vulkan/OpenCL
- MLC-LLM for optimized inference
- Google's Gemini Nano (Pixel phones)

---

## System Diagnostics

The Dashboard shows status for each component:

| Component | Description | Required for Simple Mode | Required for Full Mode |
|-----------|-------------|-------------------------|----------------------|
| yt-dlp | YouTube download | ✅ Yes | ✅ Yes |
| ffmpeg | Audio processing | No | ✅ Yes |
| Whisper | Transcription | No | ✅ Yes |
| pyannote | Speaker diarization | No | Optional |
| librosa | Prosody analysis | No | Optional |
| Praat | Voice quality | No | Optional |
| py-feat | Facial analysis | No | Optional |
| Claude API | Insight extraction | ✅ Yes | ✅ Yes |

**Simple Mode** only requires yt-dlp and Claude API - the fastest way to get started.

---

## Workflow

1. **Add Channels** - Add YouTube channels with interview content
2. **Process Videos** - Either paste URLs or select from channel listings
3. **Review Insights** - Approve good insights, reject bad ones
4. **Tune Data** - Adjust channel weights, remove bad sources
5. **Export Data** - Export approved insights for model training
6. **Test in MoodLeaf** - Test the fine-tuned model in the actual app

### Tuning Workflow

After processing several channels, use the Tuning page to:

1. **Check Quality Alerts** - See if any channels are producing low-quality data
2. **Review Category Balance** - Ensure training isn't too weighted toward one topic
3. **Adjust Weights** - Reduce influence of channels pushing the model in unwanted directions
4. **Remove Bad Data** - Delete insights from problematic videos/channels
5. **Re-export** - Export with updated weights applied

### Testing Strategy

Training Studio focuses on **data curation**. For testing the fine-tuned model:

- **Don't test here** - A test panel in Training Studio would be misleading
- **Test in MoodLeaf** - The real app has system prompts, exclusions, and memory that affect responses
- **Use source tokens** - If the model misbehaves, trace the behavior back to specific training data

---

## Training Data Formats Explained

### ChatML (Recommended for Llama 3+)

ChatML is the format used by OpenAI and Llama 3. It uses role-based messages:

```json
{
  "messages": [
    {"role": "system", "content": "You are MoodLeaf, a compassionate wellness coach..."},
    {"role": "user", "content": "[User appears sad, anxious] I've been struggling lately..."},
    {"role": "assistant", "content": "I can hear that you're going through a difficult time..."}
  ]
}
```

**Best for:** Llama 3+, OpenAI fine-tuning, production deployments

### ShareGPT (Best for Unsloth)

ShareGPT uses human/gpt roles and is the community standard:

```json
{
  "conversations": [
    {"from": "system", "value": "You are MoodLeaf, a compassionate wellness coach..."},
    {"from": "human", "value": "[Detected emotions: sad] I've been struggling lately..."},
    {"from": "gpt", "value": "I can hear that you're going through a difficult time..."}
  ]
}
```

**Best for:** Unsloth, community datasets, quick experimentation

### Emotional Context

Training Studio automatically includes emotional context from facial/voice analysis:

```json
{
  "emotional_context": {
    "emotions": ["sad", "anxious"],
    "intensity": 0.7,
    "incongruence": true,
    "therapeutic_response": "Acknowledge unspoken sadness"
  }
}
```

This teaches the model to:
- Recognize when someone SAYS "I'm fine" but LOOKS sad
- Respond to emotional undercurrents
- Use appropriate therapeutic techniques

### How the AI Learns from This

**Without emotional context:**
> User: "I'm fine, just tired"
> AI: "Make sure to get enough sleep!"

**With emotional context:**
> User: [appears anxious, tense] "I'm fine, just tired"
> AI: "I notice you seem a bit tense. Sometimes 'tired' can mean more than just needing sleep. Would you like to talk about what's been on your mind?"

---

## Troubleshooting

### "No videos found" when selecting channel
- The channel URL format may not be working
- Try adding the channel with full `/videos` URL
- Check backend logs for yt-dlp errors

### Processing fails immediately
- Run diagnostics on the Dashboard
- Check that yt-dlp is installed: `yt-dlp --version`
- Verify Claude API key is configured

### Whisper not working
- Whisper loads models on first use (may take time)
- Check you have enough disk space for models
- Try Simple Mode which uses YouTube transcripts instead

### API key not saving
- API keys are stored in memory only
- They reset when the backend restarts
- For persistence, use the `.env` file

### "Failed to add channel" error
- Check the terminal running the backend for the actual error
- Common causes:
  - Database schema mismatch (delete `backend/*.db` and restart)
  - Invalid channel URL format
  - Network issues reaching YouTube

### Backend won't start / "greenlet" error
- Install missing dependency: `pip install greenlet`
- Or reinstall all dependencies:
  ```bash
  cd backend
  source venv/bin/activate  # or activate.csh for tcsh
  pip install -r requirements.txt
  ```

### Viewing Logs
- **Terminal**: The terminal running `./start.sh` shows all logs in real-time
- **API**: Visit http://localhost:8000/logs to view recent logs (if logging is enabled)
- **Log files**: Check `backend/logs/` directory for persistent logs

### tcsh Shell Issues
If you use tcsh (common on Mac), use `activate.csh` instead of `activate`:
```tcsh
source venv/bin/activate.csh
```

### Database Reset
If you get database errors about missing columns, reset the database:
```bash
rm backend/*.db
./start.sh
```
This creates a fresh database with the correct schema.

---

## Architecture

```
training-studio/
├── backend/           # Python FastAPI
│   ├── main.py        # API endpoints
│   ├── youtube.py     # yt-dlp download service
│   ├── transcription.py # Whisper service
│   ├── diarization.py # pyannote service
│   ├── prosody.py     # Voice analysis
│   ├── facial.py      # Facial analysis
│   ├── insights.py    # Claude extraction
│   ├── database.py    # SQLite storage
│   └── config.py      # Settings
│
├── frontend/          # Next.js 14
│   └── src/
│       ├── app/
│       │   ├── page.tsx      # Dashboard
│       │   ├── channels/     # Channel management
│       │   ├── process/      # Video processing
│       │   ├── review/       # Insight review
│       │   ├── stats/        # Statistics
│       │   ├── tuning/       # Tuning dashboard
│       │   └── export/       # Data export
│       └── lib/
│           └── api.ts        # API client
│
├── start.sh           # One-button startup (bash)
├── start.csh          # One-button startup (tcsh)
└── README.md          # This file
```

---

## Ports

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## License

Part of the MoodLeaf project.
