#!/bin/tcsh
#
# Training Studio - One-Button Startup (tcsh version)
#
# This script starts both the backend and frontend servers.
# Usage: source start.csh
#

echo "=========================================="
echo "     Training Studio - Starting Up       "
echo "=========================================="
echo ""

set SCRIPT_DIR = `dirname $0`
set SCRIPT_DIR = `cd $SCRIPT_DIR && pwd`

# Check if backend venv exists
if ( ! -d "$SCRIPT_DIR/backend/venv" ) then
    echo "Backend virtual environment not found."
    echo "Creating virtual environment..."
    cd "$SCRIPT_DIR/backend"
    python3 -m venv venv
    source venv/bin/activate.csh
    pip install -r requirements.txt
    echo "Backend environment created."
else
    echo "Backend environment found."
endif

# Check if frontend node_modules exists
if ( ! -d "$SCRIPT_DIR/frontend/node_modules" ) then
    echo "Frontend dependencies not found."
    echo "Installing dependencies..."
    cd "$SCRIPT_DIR/frontend"
    npm install
    echo "Frontend dependencies installed."
else
    echo "Frontend dependencies found."
endif

echo ""
echo "Starting servers..."
echo ""

# Start backend in background
cd "$SCRIPT_DIR/backend"
echo "Starting Backend on http://localhost:8000"
source venv/bin/activate.csh
python3 main.py &

# Wait a moment for backend to start
sleep 2

# Start frontend in background
cd "$SCRIPT_DIR/frontend"
echo "Starting Frontend on http://localhost:3000"
npm run dev &

echo ""
echo "=========================================="
echo "  Training Studio is running!"
echo "=========================================="
echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo ""
echo "  Use 'kill %1 %2' to stop both servers"
echo ""
