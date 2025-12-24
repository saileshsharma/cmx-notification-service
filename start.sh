#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Load environment variables from .env file if it exists
if [ -f "$SCRIPT_DIR/.env" ]; then
    echo -e "${GREEN}Loading environment variables from .env${NC}"
    set -a
    source "$SCRIPT_DIR/.env"
    set +a
else
    echo -e "${YELLOW}Warning: .env file not found. Copy .env.example to .env and configure your secrets.${NC}"
fi

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}Backend stopped${NC}"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}Frontend stopped${NC}"
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  CMX Surveyor Calendar - Startup${NC}"
echo -e "${GREEN}========================================${NC}"

# Check for Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}Error: Java is not installed${NC}"
    exit 1
fi

# Check for Maven
if ! command -v mvn &> /dev/null; then
    echo -e "${RED}Error: Maven is not installed${NC}"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

# Kill any existing processes on ports 8080 and 4200
echo -e "${YELLOW}Checking for existing processes on ports 8080 and 4200...${NC}"
lsof -ti:8080 | xargs kill -9 2>/dev/null && echo -e "${YELLOW}Killed process on port 8080${NC}"
lsof -ti:4200 | xargs kill -9 2>/dev/null && echo -e "${YELLOW}Killed process on port 4200${NC}"

# Clean up H2 database files to avoid stale table issues
echo -e "${YELLOW}Cleaning up H2 database files...${NC}"
rm -rf "$BACKEND_DIR/data/"*.db "$BACKEND_DIR/data/"*.trace.db 2>/dev/null

echo -e "\n${YELLOW}Starting Backend (Spring Boot)...${NC}"
cd "$BACKEND_DIR"

# Build and run backend in background
mvn clean compile -q
mvn spring-boot:run > "$BACKEND_DIR/backend-startup.log" 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}Backend starting on http://localhost:8080${NC} (PID: $BACKEND_PID)"

# Wait a moment for backend to start
sleep 5

echo -e "\n${YELLOW}Starting Frontend (Angular)...${NC}"
cd "$FRONTEND_DIR"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing npm dependencies...${NC}"
    # Use local cache to avoid permission issues
    npm install --cache "$SCRIPT_DIR/.npm-cache" --no-audit 2>&1
fi

# Run frontend in background (force port 4200)
npx ng serve --host 0.0.0.0 --port 4200 > "$FRONTEND_DIR/frontend-startup.log" 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend starting on http://localhost:4200${NC} (PID: $FRONTEND_PID)"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Both services are starting!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Backend:  ${YELLOW}http://localhost:8080${NC}"
echo -e "Frontend: ${YELLOW}http://localhost:4200${NC}"
echo -e "\nLogs:"
echo -e "  Backend:  $BACKEND_DIR/backend-startup.log"
echo -e "  Frontend: $FRONTEND_DIR/frontend-startup.log"
echo -e "\n${YELLOW}Press Ctrl+C to stop both services${NC}\n"

# Wait for both processes
wait
