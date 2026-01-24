#!/bin/bash
# Start Mood Leaf Development Environment
# Runs both the React Native app and the transcript server

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Mood Leaf Development Environment    ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo -e "${YELLOW}Warning: yt-dlp not found. Install with: brew install yt-dlp${NC}"
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    kill $TRANSCRIPT_PID 2>/dev/null
    kill $EXPO_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start transcript server in background
echo -e "${GREEN}Starting transcript server on port 3333...${NC}"
cd "$SCRIPT_DIR/transcript-server"
npm start &
TRANSCRIPT_PID=$!
cd "$SCRIPT_DIR"

# Wait a moment for transcript server to start
sleep 2

# Start the Expo app
echo ""
echo -e "${GREEN}Starting Expo app...${NC}"
cd "$SCRIPT_DIR/moodling-app"
npx expo start &
EXPO_PID=$!

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Servers running:${NC}"
echo -e "${GREEN}  - Transcript server: http://localhost:3333${NC}"
echo -e "${GREEN}  - Expo app: Press 'i' for iOS, 'a' for Android${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Wait for either process to exit
wait
