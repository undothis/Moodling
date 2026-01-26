# Training Studio Backend

Python FastAPI backend for MoodLeaf AI training data harvesting.

## Overview

This backend provides:
- YouTube video/audio download via yt-dlp
- Transcription with word-level timestamps via OpenAI Whisper
- Speaker diarization via pyannote.audio
- Prosody extraction (pitch, rhythm, pauses, voice quality) via librosa/parselmouth
- Facial analysis (emotions, action units) via py-feat/MediaPipe
- Insight extraction via Claude API
- SQLite database for storage
- REST API for frontend

## Prerequisites

### System Dependencies (Homebrew - macOS)

```bash
# Required
brew install python@3.11    # Python 3.11 recommended
brew install yt-dlp         # YouTube downloader
brew install ffmpeg         # Audio/video processing

# Optional (for audio analysis)
brew install portaudio      # Audio recording support
brew install libsndfile     # Audio file format support
```

### System Dependencies (Linux)

```bash
sudo apt install python3.11 python3.11-venv python3-pip ffmpeg
sudo pip3 install yt-dlp
sudo apt install portaudio19-dev libsndfile1-dev  # Optional
```

### API Keys

- **Anthropic API key** (required for insight extraction)
- **HuggingFace token** (optional, for pyannote speaker diarization)

## Setup

```bash
# Navigate to backend directory
cd training-studio/backend

# Create virtual environment with Python 3.11
python3.11 -m venv venv
source venv/bin/activate  # bash/zsh
# OR: source venv/bin/activate.csh  # tcsh

# Upgrade pip
pip install --upgrade pip

# Install base dependencies
pip install -r requirements.txt

# Copy environment file and configure
cp .env.example .env
# Edit .env with your API keys

# Run the server
python main.py
# or
uvicorn main:app --reload --port 8000
```

## Installing Full Mode Dependencies

For local transcription, speaker diarization, and facial analysis:

```bash
# Ensure venv is activated first
source venv/bin/activate

# Whisper (local transcription)
pip install openai-whisper

# Audio analysis
pip install librosa
pip install praat-parselmouth

# Speaker diarization (requires HuggingFace token)
pip install pyannote.audio

# Facial analysis
pip install py-feat mediapipe opencv-python
```

**Or install all at once:**

```bash
pip install openai-whisper librosa praat-parselmouth pyannote.audio py-feat mediapipe opencv-python
```

> **See also**: [Complete Setup Guide](../docs/SETUP.md) for detailed installation instructions.

## API Endpoints

### Health & Info
- `GET /` - Health check
- `GET /categories` - List extraction categories
- `GET /recommended-channels` - Suggested YouTube channels

### Channels
- `GET /channels` - List all channels
- `POST /channels` - Add a channel
- `DELETE /channels/{id}` - Remove a channel
- `GET /channels/{id}/videos` - Fetch videos from channel

### Processing
- `POST /process` - Start processing a video (background task)
- `GET /process/{job_id}` - Get job status
- `GET /jobs` - List all jobs

### Insights
- `GET /insights` - List insights (filterable by status/category)
- `POST /insights/{id}/review` - Approve/reject an insight
- `DELETE /insights/{id}` - Delete an insight

### Export
- `GET /statistics` - Aggregate statistics
- `GET /export?format=alpaca` - Export training data

### Compatibility
- `GET /transcript?v=VIDEO_ID` - Fetch transcript (transcript-server compatible)

## Processing Pipeline

```
1. Download video/audio (yt-dlp)
   ↓
2. Transcribe (Whisper)
   ↓
3. Diarize speakers (pyannote)
   ↓
4. Extract prosody (librosa/parselmouth)
   ↓
5. Analyze faces (py-feat) [optional]
   ↓
6. Classify interview type (Claude)
   ↓
7. Extract insights (Claude)
   ↓
8. Save to database
```

## Whisper Models

| Model | VRAM | Speed | Quality |
|-------|------|-------|---------|
| tiny | 1GB | Fastest | Low |
| base | 1GB | Fast | Medium |
| small | 2GB | Medium | Good |
| medium | 5GB | Slow | Better |
| large | 10GB | Slowest | Best |
| large-v3 | 10GB | Slowest | Best |

Set `WHISPER_MODEL` in `.env` based on your hardware.

## Files

- `main.py` - FastAPI application
- `models.py` - Pydantic models
- `config.py` - Configuration and settings
- `database.py` - SQLAlchemy models and database service
- `youtube.py` - YouTube download service
- `transcription.py` - Whisper transcription
- `diarization.py` - Speaker diarization
- `prosody.py` - Prosodic feature extraction
- `facial.py` - Facial analysis
- `insights.py` - Claude insight extraction
