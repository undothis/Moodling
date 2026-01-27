# MoodLeaf Training Studio - Installation Guide

Complete guide to installing all dependencies for the Training Studio.

---

## Quick Start

```bash
cd training-studio
./install.sh
```

Then:
1. Edit `backend/.env` and add your `ANTHROPIC_API_KEY`
2. Run `./start.sh`
3. Open http://localhost:3000

---

## What Gets Installed

### System Dependencies

| Dependency | Purpose | How It's Used |
|------------|---------|---------------|
| **Python 3.10+** | Backend programming language | Runs the FastAPI server |
| **Node.js 18+** | Frontend runtime | Runs the Next.js UI |
| **ffmpeg** | Audio/video processing | Extracts audio from videos, converts formats |
| **yt-dlp** | YouTube downloading | Downloads videos, audio, and metadata |

### Python Packages (Backend)

#### Web Server
| Package | Purpose |
|---------|---------|
| `fastapi` | API framework |
| `uvicorn` | ASGI server |
| `python-multipart` | File uploads |
| `aiofiles` | Async file operations |

#### Transcription (Speech-to-Text)
| Package | Purpose |
|---------|---------|
| **`openai-whisper`** | OpenAI's Whisper model for accurate transcription |

Whisper is the core transcription engine. It converts spoken audio to text with timestamps. Model sizes available:
- `tiny` (75MB) - Fast, basic accuracy
- `base` (150MB) - Default, good balance
- `small` (500MB) - Better accuracy
- `medium` (1.5GB) - Great accuracy
- `large-v3` (3GB) - Best accuracy (recommended for production)

Configure in `backend/.env`:
```env
WHISPER_MODEL=base
```

#### Speaker Diarization (Who's Speaking)
| Package | Purpose |
|---------|---------|
| `pyannote.audio` | Identifies different speakers in audio |
| `torch` | PyTorch - ML framework |
| `torchaudio` | Audio processing for PyTorch |

**Note:** Speaker diarization requires a HuggingFace token. Add to `.env`:
```env
HF_TOKEN=your-huggingface-token
```

#### Prosody Analysis (How They Speak)
| Package | Purpose |
|---------|---------|
| `librosa` | Audio feature extraction (pitch, tempo, energy) |
| `praat-parselmouth` | Voice quality analysis (jitter, shimmer) |
| `numpy` | Numerical computing |
| `scipy` | Scientific computing |
| `soundfile` | Audio file I/O |

#### Facial Analysis
| Package | Purpose |
|---------|---------|
| `mediapipe` | Google's face detection and mesh |
| `opencv-python` | Computer vision library |
| `py-feat` | Facial expression/emotion detection |

#### AI Integration
| Package | Purpose |
|---------|---------|
| `anthropic` | Claude API client for insight extraction |

#### Database
| Package | Purpose |
|---------|---------|
| `sqlalchemy` | ORM for database operations |
| `aiosqlite` | Async SQLite support |

#### Utilities
| Package | Purpose |
|---------|---------|
| `pydantic` | Data validation |
| `httpx` | Async HTTP client |
| `python-dotenv` | Environment variables |
| `yt-dlp` | YouTube downloading (Python API) |
| `tqdm` | Progress bars |

### Node.js Packages (Frontend)

| Package | Purpose |
|---------|---------|
| `next` | React framework (SSR, routing) |
| `react` | UI library |
| `@tanstack/react-query` | Server state management |
| `tailwindcss` | Utility-first CSS |
| `recharts` | Charts and visualizations |
| `lucide-react` | Icons |

---

## Installation Options

### Full Installation
```bash
./install.sh
```
Installs everything automatically.

### Check Dependencies Only
```bash
./install.sh --check
```
Verifies what's installed without making changes.

### Show Help
```bash
./install.sh --help
```
Shows usage information and dependency list.

---

## Manual Installation

If the script doesn't work for your system, install manually:

### 1. System Dependencies

**macOS (Homebrew):**
```bash
brew install python@3.11 node ffmpeg yt-dlp
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv python3-dev
sudo apt install nodejs npm
sudo apt install ffmpeg
pip3 install yt-dlp
```

**Fedora:**
```bash
sudo dnf install python3 python3-pip nodejs npm ffmpeg
pip3 install yt-dlp
```

### 2. Python Environment
```bash
cd training-studio/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
```

### 3. Python Packages

**Install PyTorch first:**
```bash
# CPU only
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# Or with CUDA (if you have NVIDIA GPU)
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**Then install requirements:**
```bash
pip install -r requirements.txt
```

### 4. Node.js Packages
```bash
cd training-studio/frontend
npm install
```

### 5. Create .env File
```bash
cd training-studio/backend
cat > .env << 'EOF'
ANTHROPIC_API_KEY=your-api-key-here
WHISPER_MODEL=base
DEFAULT_SAMPLE_RATE=16000
STORAGE_PATH=./storage
TEMP_PATH=./temp
EOF
```

---

## Configuration

### Required: Anthropic API Key

Get your key at: https://console.anthropic.com/

Add to `backend/.env`:
```env
ANTHROPIC_API_KEY=sk-ant-...
```

### Optional: HuggingFace Token

Required for speaker diarization (identifying who's speaking).

Get your token at: https://huggingface.co/settings/tokens

Add to `backend/.env`:
```env
HF_TOKEN=hf_...
```

### Optional: Whisper Model Size

Configure transcription accuracy vs speed:
```env
WHISPER_MODEL=base  # Options: tiny, base, small, medium, large-v3
```

---

## Running the Application

### Using start.sh (Recommended)
```bash
cd training-studio
./start.sh
```

### Manual Start

**Terminal 1 - Backend:**
```bash
cd training-studio/backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd training-studio/frontend
npm run dev
```

Then open: http://localhost:3000

---

## Troubleshooting

### "Command not found: yt-dlp"
```bash
pip3 install --upgrade yt-dlp
# Or on macOS:
brew install yt-dlp
```

### "No module named 'whisper'"
Make sure you're in the virtual environment:
```bash
cd backend
source venv/bin/activate
pip install openai-whisper
```

### "torch not found" or PyTorch errors
Install PyTorch separately first:
```bash
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
```

### Whisper is slow
Use a smaller model:
```env
WHISPER_MODEL=tiny  # Fastest
WHISPER_MODEL=base  # Balanced (default)
```

Or if you have a GPU, install CUDA version of PyTorch.

### ffmpeg errors
Make sure ffmpeg is installed:
```bash
ffmpeg -version
# If not found:
brew install ffmpeg  # macOS
sudo apt install ffmpeg  # Ubuntu
```

### Speaker diarization fails
You need a HuggingFace token:
1. Create account at https://huggingface.co
2. Go to Settings → Access Tokens
3. Create a token and add to `.env`:
   ```env
   HF_TOKEN=hf_your_token_here
   ```

---

## Updating Dependencies

### Update yt-dlp (recommended weekly)
YouTube changes frequently:
```bash
pip install --upgrade yt-dlp
# Or:
brew upgrade yt-dlp
```

### Update all Python packages
```bash
cd backend
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

### Update Node.js packages
```bash
cd frontend
npm update
```

---

## Disk Space Requirements

| Component | Size |
|-----------|------|
| Python venv (all packages) | ~3-5 GB |
| Node.js modules | ~200 MB |
| Whisper models | 75 MB - 3 GB (varies by model) |
| Temporary video storage | Varies (auto-cleaned) |

**Recommended:** At least 10 GB free space.
