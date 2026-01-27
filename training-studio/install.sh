#!/bin/bash

# =============================================================================
# MoodLeaf Training Studio - Complete Installation Script
# =============================================================================
#
# DESCRIPTION:
#   This script installs ALL dependencies needed to run the Training Studio.
#   It handles system packages, Python backend, and Node.js frontend setup.
#
# USAGE:
#   ./install.sh           Run full installation
#   ./install.sh --help    Show this help message
#   ./install.sh --check   Only verify dependencies (no install)
#
# WHAT IT INSTALLS:
#
#   SYSTEM DEPENDENCIES:
#   - Python 3.10+         (programming language for backend)
#   - Node.js 18+ / npm    (JavaScript runtime for frontend)
#   - ffmpeg               (audio/video processing)
#   - yt-dlp               (YouTube video/audio downloading)
#
#   PYTHON PACKAGES (backend):
#   - FastAPI, uvicorn     (web server framework)
#   - OpenAI Whisper       (speech-to-text transcription)
#   - pyannote.audio       (speaker diarization - who's speaking)
#   - PyTorch              (machine learning framework)
#   - librosa              (audio analysis)
#   - praat-parselmouth    (prosody/speech analysis)
#   - MediaPipe            (face detection)
#   - py-feat              (facial expression analysis)
#   - opencv-python        (computer vision)
#   - anthropic            (Claude AI API client)
#   - SQLAlchemy           (database ORM)
#   - And more...
#
#   NODE.JS PACKAGES (frontend):
#   - Next.js 14           (React framework)
#   - React 18             (UI library)
#   - TanStack React Query (data fetching)
#   - Tailwind CSS         (styling)
#   - Recharts             (charts/visualizations)
#   - Lucide React         (icons)
#
# AFTER INSTALLATION:
#   1. Edit backend/.env and add your ANTHROPIC_API_KEY
#      Get one at: https://console.anthropic.com/
#   2. Run: ./start.sh
#   3. Open: http://localhost:3000
#
# SUPPORTED OPERATING SYSTEMS:
#   - macOS (via Homebrew)
#   - Ubuntu/Debian (via apt)
#   - Fedora/RHEL (via dnf)
#   - Arch Linux (via pacman)
#
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# -----------------------------------------------------------------------------
# Help Message
# -----------------------------------------------------------------------------
show_help() {
    echo -e "${BLUE}"
    echo "============================================================================="
    echo "  MoodLeaf Training Studio - Installation Script"
    echo "============================================================================="
    echo -e "${NC}"
    echo ""
    echo "USAGE:"
    echo "  ./install.sh           Run full installation"
    echo "  ./install.sh --help    Show this help message"
    echo "  ./install.sh --check   Only verify dependencies (no install)"
    echo ""
    echo "============================================================================="
    echo "  COMPLETE LIST OF DEPENDENCIES"
    echo "============================================================================="
    echo ""
    echo -e "${YELLOW}SYSTEM DEPENDENCIES:${NC}"
    echo "  - Python 3.10+         Programming language for backend"
    echo "  - Node.js 18+          JavaScript runtime for frontend"
    echo "  - npm                  Node package manager"
    echo "  - ffmpeg               Audio/video processing & conversion"
    echo "  - yt-dlp               YouTube video/audio downloading"
    echo ""
    echo -e "${YELLOW}PYTHON PACKAGES - Web Server:${NC}"
    echo "  - fastapi              API framework"
    echo "  - uvicorn              ASGI server"
    echo "  - python-multipart     File upload handling"
    echo "  - aiofiles             Async file operations"
    echo ""
    echo -e "${YELLOW}PYTHON PACKAGES - Database:${NC}"
    echo "  - sqlalchemy           Database ORM"
    echo "  - aiosqlite            Async SQLite support"
    echo "  - greenlet             Concurrency support"
    echo ""
    echo -e "${YELLOW}PYTHON PACKAGES - Transcription:${NC}"
    echo "  - openai-whisper       Speech-to-text (Whisper AI model)"
    echo ""
    echo -e "${YELLOW}PYTHON PACKAGES - Speaker Diarization:${NC}"
    echo "  - pyannote.audio       Speaker identification"
    echo "  - torch                PyTorch ML framework"
    echo "  - torchaudio           Audio processing for PyTorch"
    echo ""
    echo -e "${YELLOW}PYTHON PACKAGES - Audio/Prosody Analysis:${NC}"
    echo "  - librosa              Audio feature extraction"
    echo "  - praat-parselmouth    Voice quality analysis"
    echo "  - numpy                Numerical computing"
    echo "  - scipy                Scientific computing"
    echo "  - soundfile            Audio file I/O"
    echo ""
    echo -e "${YELLOW}PYTHON PACKAGES - Facial Analysis:${NC}"
    echo "  - mediapipe            Face detection/mesh"
    echo "  - opencv-python        Computer vision"
    echo "  - py-feat              Facial expression analysis"
    echo ""
    echo -e "${YELLOW}PYTHON PACKAGES - AI & Utilities:${NC}"
    echo "  - anthropic            Claude AI API client"
    echo "  - pydantic             Data validation"
    echo "  - pydantic-settings    Settings management"
    echo "  - httpx                Async HTTP client"
    echo "  - python-dotenv        Environment variables"
    echo "  - yt-dlp               YouTube API (Python)"
    echo "  - tqdm                 Progress bars"
    echo ""
    echo -e "${YELLOW}NODE.JS PACKAGES - Frontend:${NC}"
    echo "  - next                 React framework"
    echo "  - react                UI library"
    echo "  - react-dom            React DOM rendering"
    echo "  - @tanstack/react-query  Server state management"
    echo "  - lucide-react         Icons"
    echo "  - recharts             Charts/visualizations"
    echo "  - clsx                 CSS class utilities"
    echo "  - tailwindcss          Utility-first CSS"
    echo "  - typescript           Type checking"
    echo "  - postcss              CSS processing"
    echo "  - autoprefixer         CSS vendor prefixes"
    echo ""
    echo "============================================================================="
    echo "AFTER INSTALLATION:"
    echo "  1. Edit backend/.env and add your ANTHROPIC_API_KEY"
    echo "     Get one at: https://console.anthropic.com/"
    echo "  2. (Optional) Add HF_TOKEN for speaker diarization"
    echo "     Get one at: https://huggingface.co/settings/tokens"
    echo "  3. Run: ./start.sh"
    echo "  4. Open: http://localhost:3000"
    echo ""
    echo "============================================================================="
    exit 0
}

# Check for --help or --check flags
CHECK_ONLY=false
for arg in "$@"; do
    case $arg in
        --help|-h)
            show_help
            ;;
        --check|-c)
            CHECK_ONLY=true
            ;;
    esac
done

echo -e "${BLUE}"
echo "============================================================================="
echo "  MoodLeaf Training Studio - Installation Script"
echo "============================================================================="
echo -e "${NC}"

# -----------------------------------------------------------------------------
# Detect OS
# -----------------------------------------------------------------------------
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        PKG_MANAGER="brew"
    elif [[ -f /etc/debian_version ]]; then
        OS="debian"
        PKG_MANAGER="apt"
    elif [[ -f /etc/redhat-release ]]; then
        OS="redhat"
        PKG_MANAGER="dnf"
    elif [[ -f /etc/arch-release ]]; then
        OS="arch"
        PKG_MANAGER="pacman"
    else
        OS="unknown"
        PKG_MANAGER="unknown"
    fi
    echo -e "${GREEN}Detected OS: $OS (package manager: $PKG_MANAGER)${NC}"
}

# -----------------------------------------------------------------------------
# Check if command exists
# -----------------------------------------------------------------------------
command_exists() {
    command -v "$1" &> /dev/null
}

# -----------------------------------------------------------------------------
# Install System Dependencies
# -----------------------------------------------------------------------------
install_system_deps() {
    echo -e "\n${BLUE}[1/6] Installing System Dependencies...${NC}"

    case $PKG_MANAGER in
        brew)
            # macOS with Homebrew
            if ! command_exists brew; then
                echo -e "${YELLOW}Installing Homebrew...${NC}"
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi

            echo "Installing system packages via Homebrew..."
            brew update

            # Required packages
            brew install python@3.11 || true
            brew install node || true
            brew install ffmpeg || true
            brew install yt-dlp || true

            # Optional but recommended
            brew install portaudio || true  # For audio processing
            ;;

        apt)
            # Debian/Ubuntu
            echo "Installing system packages via apt..."
            sudo apt update

            # Python
            sudo apt install -y python3 python3-pip python3-venv python3-dev

            # Node.js (via NodeSource for latest version)
            if ! command_exists node; then
                echo "Installing Node.js..."
                curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
                sudo apt install -y nodejs
            fi

            # FFmpeg and audio libraries
            sudo apt install -y ffmpeg libsndfile1 libportaudio2 portaudio19-dev

            # yt-dlp (install via pip for latest version)
            pip3 install --upgrade yt-dlp

            # OpenCV dependencies
            sudo apt install -y libgl1-mesa-glx libglib2.0-0

            # Build tools (needed for some Python packages)
            sudo apt install -y build-essential cmake
            ;;

        dnf)
            # Fedora/RHEL
            echo "Installing system packages via dnf..."
            sudo dnf update -y

            sudo dnf install -y python3 python3-pip python3-devel
            sudo dnf install -y nodejs npm
            sudo dnf install -y ffmpeg ffmpeg-devel
            sudo dnf install -y portaudio portaudio-devel
            sudo dnf install -y cmake gcc-c++

            pip3 install --upgrade yt-dlp
            ;;

        pacman)
            # Arch Linux
            echo "Installing system packages via pacman..."
            sudo pacman -Syu --noconfirm

            sudo pacman -S --noconfirm python python-pip
            sudo pacman -S --noconfirm nodejs npm
            sudo pacman -S --noconfirm ffmpeg
            sudo pacman -S --noconfirm yt-dlp
            sudo pacman -S --noconfirm portaudio
            sudo pacman -S --noconfirm base-devel cmake
            ;;

        *)
            echo -e "${YELLOW}Unknown package manager. Please install manually:${NC}"
            echo "  - Python 3.10+"
            echo "  - Node.js 18+"
            echo "  - ffmpeg"
            echo "  - yt-dlp"
            echo ""
            read -p "Press Enter to continue after installing these manually..."
            ;;
    esac

    echo -e "${GREEN}System dependencies installed!${NC}"
}

# -----------------------------------------------------------------------------
# Verify System Dependencies
# -----------------------------------------------------------------------------
verify_system_deps() {
    echo -e "\n${BLUE}[2/6] Verifying System Dependencies...${NC}"

    local missing=()

    if ! command_exists python3; then
        missing+=("python3")
    else
        echo -e "  ${GREEN}✓${NC} Python: $(python3 --version)"
    fi

    if ! command_exists node; then
        missing+=("node")
    else
        echo -e "  ${GREEN}✓${NC} Node.js: $(node --version)"
    fi

    if ! command_exists npm; then
        missing+=("npm")
    else
        echo -e "  ${GREEN}✓${NC} npm: $(npm --version)"
    fi

    if ! command_exists ffmpeg; then
        missing+=("ffmpeg")
    else
        echo -e "  ${GREEN}✓${NC} ffmpeg: $(ffmpeg -version 2>&1 | head -1)"
    fi

    if ! command_exists yt-dlp; then
        missing+=("yt-dlp")
    else
        echo -e "  ${GREEN}✓${NC} yt-dlp: $(yt-dlp --version)"
    fi

    if [ ${#missing[@]} -ne 0 ]; then
        echo -e "${RED}Missing dependencies: ${missing[*]}${NC}"
        echo "Please install them manually and run this script again."
        exit 1
    fi

    echo -e "${GREEN}All system dependencies verified!${NC}"
}

# -----------------------------------------------------------------------------
# Setup Python Virtual Environment
# -----------------------------------------------------------------------------
setup_python_env() {
    echo -e "\n${BLUE}[3/6] Setting up Python Virtual Environment...${NC}"

    cd "$BACKEND_DIR"

    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    else
        echo "Virtual environment already exists."
    fi

    # Activate virtual environment
    source venv/bin/activate

    # Upgrade pip
    echo "Upgrading pip..."
    pip install --upgrade pip

    echo -e "${GREEN}Python environment ready!${NC}"
}

# -----------------------------------------------------------------------------
# Install Python Dependencies
# -----------------------------------------------------------------------------
install_python_deps() {
    echo -e "\n${BLUE}[4/6] Installing Python Dependencies...${NC}"
    echo -e "${YELLOW}Note: This may take 10-20 minutes (PyTorch, Whisper, etc.)${NC}"
    echo ""
    echo "  Dependencies to install:"
    echo "    - PyTorch (ML framework)"
    echo "    - OpenAI Whisper (speech-to-text transcription)"
    echo "    - pyannote.audio (speaker diarization)"
    echo "    - librosa (audio analysis)"
    echo "    - MediaPipe (facial detection)"
    echo "    - And more..."
    echo ""

    cd "$BACKEND_DIR"
    source venv/bin/activate

    # Install PyTorch first (required for whisper and pyannote)
    echo -e "${BLUE}[4a/6] Installing PyTorch...${NC}"
    if [[ "$OS" == "macos" ]]; then
        # macOS - use default pip install
        pip install torch torchaudio
    else
        # Linux - try to detect CUDA
        if command_exists nvidia-smi; then
            echo "CUDA detected, installing GPU version..."
            pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
        else
            echo "No CUDA detected, installing CPU version..."
            pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
        fi
    fi
    echo -e "${GREEN}  PyTorch installed!${NC}"

    # Install Whisper explicitly (core transcription engine)
    echo -e "${BLUE}[4b/6] Installing OpenAI Whisper (transcription)...${NC}"
    pip install openai-whisper
    echo -e "${GREEN}  Whisper installed!${NC}"

    # Install remaining requirements
    echo -e "${BLUE}[4c/6] Installing remaining Python packages...${NC}"
    pip install -r requirements.txt

    # Verify key packages
    echo ""
    echo -e "${GREEN}Verifying key packages:${NC}"
    python -c "import whisper; print(f'  Whisper: installed')" 2>/dev/null || echo -e "  ${RED}Whisper: FAILED${NC}"
    python -c "import torch; print(f'  PyTorch: {torch.__version__}')" 2>/dev/null || echo -e "  ${RED}PyTorch: FAILED${NC}"
    python -c "import librosa; print(f'  librosa: installed')" 2>/dev/null || echo -e "  ${RED}librosa: FAILED${NC}"
    python -c "import anthropic; print(f'  anthropic: installed')" 2>/dev/null || echo -e "  ${RED}anthropic: FAILED${NC}"

    echo -e "\n${GREEN}Python dependencies installed!${NC}"
}

# -----------------------------------------------------------------------------
# Install Node.js Dependencies
# -----------------------------------------------------------------------------
install_node_deps() {
    echo -e "\n${BLUE}[5/6] Installing Node.js Dependencies (Frontend)...${NC}"

    cd "$FRONTEND_DIR"

    echo "Installing npm packages..."
    npm install

    echo -e "${GREEN}Node.js dependencies installed!${NC}"
}

# -----------------------------------------------------------------------------
# Setup Directories and Configuration
# -----------------------------------------------------------------------------
setup_directories() {
    echo -e "\n${BLUE}[6/6] Setting up Directories and Configuration...${NC}"

    cd "$BACKEND_DIR"

    # Create storage directories
    mkdir -p storage/videos
    mkdir -p storage/audio
    mkdir -p storage/transcripts
    mkdir -p storage/exports
    mkdir -p temp

    echo "Created storage directories:"
    echo "  - storage/videos"
    echo "  - storage/audio"
    echo "  - storage/transcripts"
    echo "  - storage/exports"
    echo "  - temp"

    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        echo "Creating .env file..."
        cat > .env << 'EOF'
# =============================================================================
# MoodLeaf Training Studio - Environment Configuration
# =============================================================================

# -----------------------------------------------------------------------------
# REQUIRED: Anthropic API Key (for Claude-powered insight extraction)
# Get your key at: https://console.anthropic.com/
# -----------------------------------------------------------------------------
ANTHROPIC_API_KEY=your-api-key-here

# -----------------------------------------------------------------------------
# OPTIONAL: HuggingFace Token (for speaker diarization with pyannote)
# Required for advanced speaker diarization features
# Get your token at: https://huggingface.co/settings/tokens
# -----------------------------------------------------------------------------
# HF_TOKEN=your-huggingface-token-here

# -----------------------------------------------------------------------------
# Processing Settings
# -----------------------------------------------------------------------------
# Whisper model size: tiny, base, small, medium, large-v3
# Larger = more accurate but slower
WHISPER_MODEL=base

# Default audio sample rate
DEFAULT_SAMPLE_RATE=16000

# Storage paths (relative to backend directory)
STORAGE_PATH=./storage
TEMP_PATH=./temp
EOF
        echo -e "${YELLOW}Created .env file - please edit it to add your ANTHROPIC_API_KEY${NC}"
    else
        echo ".env file already exists."
    fi

    echo -e "${GREEN}Setup complete!${NC}"
}

# -----------------------------------------------------------------------------
# Print Summary
# -----------------------------------------------------------------------------
print_summary() {
    echo -e "\n${BLUE}"
    echo "============================================================================="
    echo "  Installation Complete!"
    echo "============================================================================="
    echo -e "${NC}"

    echo -e "${GREEN}ALL DEPENDENCIES INSTALLED:${NC}"
    echo ""
    echo -e "${YELLOW}SYSTEM:${NC}"
    echo "    Python 3.x              Programming language"
    echo "    Node.js / npm           JavaScript runtime"
    echo "    ffmpeg                  Audio/video processing"
    echo "    yt-dlp                  YouTube downloading"
    echo ""
    echo -e "${YELLOW}PYTHON - Web Server:${NC}"
    echo "    fastapi                 API framework"
    echo "    uvicorn                 ASGI server"
    echo "    python-multipart        File uploads"
    echo "    aiofiles                Async file I/O"
    echo ""
    echo -e "${YELLOW}PYTHON - Transcription:${NC}"
    echo "    openai-whisper          Speech-to-text (Whisper AI)"
    echo ""
    echo -e "${YELLOW}PYTHON - Speaker Diarization:${NC}"
    echo "    pyannote.audio          Who's speaking when"
    echo "    torch                   PyTorch ML framework"
    echo "    torchaudio              Audio for PyTorch"
    echo ""
    echo -e "${YELLOW}PYTHON - Audio/Prosody:${NC}"
    echo "    librosa                 Audio feature extraction"
    echo "    praat-parselmouth       Voice quality analysis"
    echo "    numpy                   Numerical computing"
    echo "    scipy                   Scientific computing"
    echo "    soundfile               Audio file I/O"
    echo ""
    echo -e "${YELLOW}PYTHON - Facial Analysis:${NC}"
    echo "    mediapipe               Face detection/mesh"
    echo "    opencv-python           Computer vision"
    echo "    py-feat                 Facial expressions"
    echo ""
    echo -e "${YELLOW}PYTHON - AI & Database:${NC}"
    echo "    anthropic               Claude AI API"
    echo "    sqlalchemy              Database ORM"
    echo "    aiosqlite               Async SQLite"
    echo "    pydantic                Data validation"
    echo "    httpx                   HTTP client"
    echo "    python-dotenv           Environment vars"
    echo "    tqdm                    Progress bars"
    echo ""
    echo -e "${YELLOW}NODE.JS - Frontend:${NC}"
    echo "    next                    React framework"
    echo "    react / react-dom       UI library"
    echo "    @tanstack/react-query   Data fetching"
    echo "    tailwindcss             CSS styling"
    echo "    recharts                Charts"
    echo "    lucide-react            Icons"
    echo "    typescript              Type checking"
    echo ""
    echo "============================================================================="
    echo -e "${YELLOW}IMPORTANT: Before running, you must:${NC}"
    echo "  1. Edit backend/.env and add your ANTHROPIC_API_KEY"
    echo "     Get one at: https://console.anthropic.com/"
    echo ""
    echo "  2. (Optional) Add HF_TOKEN for speaker diarization"
    echo "     Get one at: https://huggingface.co/settings/tokens"
    echo ""
    echo "============================================================================="
    echo -e "${GREEN}To start the Training Studio:${NC}"
    echo ""
    echo "  cd $SCRIPT_DIR"
    echo "  ./start.sh"
    echo ""
    echo "  Or manually:"
    echo "    # Terminal 1 - Backend"
    echo "    cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000"
    echo ""
    echo "    # Terminal 2 - Frontend"
    echo "    cd frontend && npm run dev"
    echo ""
    echo "  Then open: http://localhost:3000"
    echo ""
    echo "============================================================================="
}

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
main() {
    detect_os

    if [ "$CHECK_ONLY" = true ]; then
        echo -e "${YELLOW}Running in CHECK ONLY mode - no installation will occur${NC}"
        echo ""
        verify_system_deps
        echo ""
        echo -e "${BLUE}To run full installation:${NC} ./install.sh"
        exit 0
    fi

    install_system_deps
    verify_system_deps
    setup_python_env
    install_python_deps
    install_node_deps
    setup_directories
    print_summary
}

# Run main function
main "$@"
