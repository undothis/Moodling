# Training Studio - Complete Setup Guide

This guide walks you through setting up Training Studio from scratch, including all optional Full Mode dependencies.

---

## Quick Reference: What Mode Do You Need?

| Mode | What It Does | Dependencies |
|------|--------------|--------------|
| **Simple Mode** | Uses YouTube's transcripts + Claude AI | yt-dlp, Claude API key |
| **Full Mode** | Local transcription, speaker ID, emotion analysis | All dependencies below |

**Recommendation**: Start with Simple Mode. It's faster and works great for most use cases.

---

## System Requirements

- **macOS** 11+ (Big Sur or later) or **Linux**
- **Python** 3.10+ (3.11 recommended)
- **Node.js** 18+
- **8GB RAM** minimum (16GB recommended for Full Mode)
- **10GB disk space** (for Whisper models and dependencies)

---

## Step 1: Install Homebrew (macOS)

If you don't have Homebrew installed:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

---

## Step 2: Install System Dependencies

### macOS (Homebrew)

```bash
# Core requirements
brew install python@3.11
brew install node
brew install yt-dlp
brew install ffmpeg

# Optional: For audio analysis (librosa)
brew install portaudio
brew install libsndfile

# Verify installations
python3.11 --version   # Should show Python 3.11.x
node --version         # Should show v18.x or higher
yt-dlp --version       # Should show version number
ffmpeg -version        # Should show ffmpeg version
```

### Linux (Ubuntu/Debian)

```bash
# Core requirements
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip
sudo apt install nodejs npm
sudo apt install ffmpeg

# Install yt-dlp
sudo pip3 install yt-dlp

# Optional: For audio analysis
sudo apt install portaudio19-dev libsndfile1-dev
```

---

## Step 3: Backend Setup

```bash
# Navigate to backend
cd training-studio/backend

# Create virtual environment with Python 3.11
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate      # bash/zsh
# OR
source venv/bin/activate.csh  # tcsh/csh

# Upgrade pip
pip install --upgrade pip

# Install base dependencies
pip install -r requirements.txt
```

---

## Step 4: Configure API Keys

Create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your keys:

```env
# Required: For insight extraction
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional: For speaker diarization
HUGGINGFACE_TOKEN=hf_...

# Optional: Whisper model size (tiny, base, small, medium, large)
WHISPER_MODEL=base
```

### Getting API Keys

**Anthropic API Key** (Required):
1. Go to https://console.anthropic.com
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new key

**HuggingFace Token** (Optional - for speaker diarization):
1. Create account at https://huggingface.co
2. Go to https://huggingface.co/pyannote/speaker-diarization-3.1
3. Accept the terms to access the model
4. Go to https://huggingface.co/settings/tokens
5. Create a new token with "read" permissions

---

## Step 5: Install Full Mode Dependencies (Optional)

If you want to use Full Mode features (local transcription, facial analysis, etc.), install these additional packages:

### 5a. Whisper (Local Transcription)

```bash
# Make sure venv is activated
pip install openai-whisper

# Test installation
python -c "import whisper; print('Whisper installed!')"
```

**Note**: The first time you use Whisper, it will download the model (tiny=39MB, base=74MB, small=244MB, medium=769MB, large=1.5GB).

### 5b. Librosa (Audio/Prosody Analysis)

```bash
pip install librosa

# Test installation
python -c "import librosa; print('librosa installed!')"
```

### 5c. Praat/Parselmouth (Voice Quality Analysis)

```bash
pip install praat-parselmouth

# Test installation
python -c "import parselmouth; print('parselmouth installed!')"
```

### 5d. Speaker Diarization (pyannote)

Requires HuggingFace token (see Step 4).

```bash
pip install pyannote.audio

# Test installation
python -c "import pyannote.audio; print('pyannote installed!')"
```

### 5e. Facial Analysis (py-feat)

```bash
pip install py-feat

# Test installation
python -c "import feat; print('py-feat installed!')"
```

### 5f. MediaPipe (Backup Facial Analysis)

```bash
pip install mediapipe
pip install opencv-python

# Test installation
python -c "import mediapipe; print('MediaPipe installed!')"
```

### Install All Full Mode Dependencies At Once

```bash
# One command to install everything
pip install openai-whisper librosa praat-parselmouth pyannote.audio py-feat mediapipe opencv-python
```

---

## Step 6: Frontend Setup

```bash
# Navigate to frontend
cd training-studio/frontend

# Install dependencies
npm install

# Return to training-studio root
cd ..
```

---

## Step 7: Start Training Studio

### Option A: One-Button Start (Recommended)

```bash
cd training-studio
./start.sh
```

### Option B: Manual Start

Terminal 1 (Backend):
```bash
cd training-studio/backend
source venv/bin/activate
python main.py
```

Terminal 2 (Frontend):
```bash
cd training-studio/frontend
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Troubleshooting

### Error: "Whisper not installed"

```bash
cd training-studio/backend
source venv/bin/activate
pip install openai-whisper
```

### Error: "librosa not installed"

```bash
# macOS: Install system dependency first
brew install libsndfile

# Then install Python package
pip install librosa
```

### Error: "parselmouth not installed"

```bash
pip install praat-parselmouth
```

### Error: "py-feat not installed"

```bash
pip install py-feat
```

### Error: "MediaPipe not installed"

```bash
pip install mediapipe opencv-python
```

### Error: "No HuggingFace token"

This is a warning, not an error. Speaker diarization is optional. If you want it:

1. Get a token from https://huggingface.co/settings/tokens
2. Accept terms at https://huggingface.co/pyannote/speaker-diarization-3.1
3. Add to `.env`: `HUGGINGFACE_TOKEN=hf_...`

### Error: Torch/PyTorch installation issues

If you get errors related to torch:

```bash
# Uninstall and reinstall
pip uninstall torch torchaudio torchvision
pip install torch torchaudio
```

### Error: "Permission denied" on start.sh

```bash
chmod +x start.sh
```

### Frontend: "Module not found" errors

```bash
cd training-studio/frontend
rm -rf node_modules package-lock.json
npm install
```

---

## Verifying Your Installation

Run the backend and check the Dashboard diagnostics:

1. Start Training Studio (`./start.sh`)
2. Open http://localhost:3000
3. Look at the "System Diagnostics" panel
4. Green checkmarks = working
5. Yellow warnings = optional features disabled
6. Red errors = needs attention

### Expected Results

**Simple Mode (minimum):**
- YouTube Downloader: OK
- Claude API: Configured

**Full Mode (all features):**
- YouTube Downloader: OK
- Audio Processing (ffmpeg): OK
- Whisper Transcription: OK
- Speaker Diarization: OK
- Prosody (librosa): OK
- Voice Quality (Praat): OK
- Facial Analysis: OK
- MediaPipe: OK
- Claude API: Configured

---

## Updating Dependencies

To update all Python dependencies:

```bash
cd training-studio/backend
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

To update Homebrew packages:

```bash
brew update
brew upgrade yt-dlp ffmpeg
```

---

## Uninstalling

To completely remove Training Studio dependencies:

```bash
# Remove virtual environment
cd training-studio/backend
rm -rf venv

# Remove node modules
cd ../frontend
rm -rf node_modules

# Optionally remove Homebrew packages
brew uninstall yt-dlp ffmpeg portaudio libsndfile
```

---

## Summary: Complete Install Commands

Copy and run these commands for a complete Full Mode installation:

```bash
# 1. Homebrew dependencies (macOS)
brew install python@3.11 node yt-dlp ffmpeg portaudio libsndfile

# 2. Backend setup
cd training-studio/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install openai-whisper librosa praat-parselmouth pyannote.audio py-feat mediapipe opencv-python

# 3. Configure API keys
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY and optionally HUGGINGFACE_TOKEN

# 4. Frontend setup
cd ../frontend
npm install

# 5. Start
cd ..
./start.sh
```
