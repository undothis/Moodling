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

### Review Insights
- View extracted insights
- Approve or reject individually
- **Batch Approve** - Approve all insights with quality >= 85 in one click
- Filter by category and status

### Statistics
- Category distribution charts
- Quality score distributions
- Processing trends

### Export
- **Alpaca format** - For Llama fine-tuning
- **JSONL format** - For OpenAI-style training
- **Raw format** - Full insight data

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
4. **Export Data** - Export approved insights for model training

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
│       ├── app/       # Pages
│       └── lib/       # API client
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
