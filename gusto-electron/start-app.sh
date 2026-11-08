#!/bin/bash

echo "🍽️  Starting Gusto Restaurant Management System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "${YELLOW}📦 Starting Backend Server...${NC}"
cd "$DIR/../gusto-backend"
npm start > /tmp/gusto-backend.log 2>&1 &
BACKEND_PID=$!
echo "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo ""

sleep 2

echo "${YELLOW}🎨 Starting Frontend Dev Server...${NC}"
cd "$DIR/../gusto-frontend"
npm run dev > /tmp/gusto-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
echo ""

sleep 3

echo "${YELLOW}🖥️  Starting Electron App...${NC}"
cd "$DIR"
npm start

echo ""
echo "${RED}Shutting down servers...${NC}"
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
echo "${GREEN}✅ All servers stopped${NC}"

