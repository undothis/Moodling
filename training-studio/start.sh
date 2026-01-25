#!/bin/bash
#
# Training Studio - One-Button Startup
#
# This script starts both the backend and frontend servers.
# Usage: ./start.sh
#

echo "=========================================="
echo "     Training Studio - Starting Up       "
echo "=========================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend venv exists
if [ ! -d "$SCRIPT_DIR/backend/venv" ]; then
    echo -e "${YELLOW}Backend virtual environment not found.${NC}"
    echo "Creating virtual environment..."
    cd "$SCRIPT_DIR/backend"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    echo -e "${GREEN}Backend environment created.${NC}"
else
    echo -e "${GREEN}Backend environment found.${NC}"
fi

# Check if frontend node_modules exists
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo -e "${YELLOW}Frontend dependencies not found.${NC}"
    echo "Installing dependencies..."
    cd "$SCRIPT_DIR/frontend"
    npm install
    echo -e "${GREEN}Frontend dependencies installed.${NC}"
else
    echo -e "${GREEN}Frontend dependencies found.${NC}"
fi

echo ""
echo "Starting servers..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
cd "$SCRIPT_DIR/backend"
echo -e "${GREEN}Starting Backend on http://localhost:8000${NC}"
source venv/bin/activate
python3 main.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
cd "$SCRIPT_DIR/frontend"
echo -e "${GREEN}Starting Frontend on http://localhost:3000${NC}"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo -e "${GREEN}  Training Studio is running!${NC}"
echo "=========================================="
echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo ""

# Wait for either process to exit
wait $BACKEND_PID $FRONTEND_PID
