#!/bin/bash
set -e

echo "================================================"
echo "Deploying R2 SSL Fix to Supermark"
echo "================================================"
echo

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Pulling latest code...${NC}"
git pull origin main

echo -e "${YELLOW}Step 2: Stopping containers...${NC}"
docker compose down

echo -e "${YELLOW}Step 3: Rebuilding supermark image with R2 fix...${NC}"
docker compose build supermark

echo -e "${YELLOW}Step 4: Starting containers...${NC}"
docker compose up -d

echo -e "${YELLOW}Step 5: Waiting for startup...${NC}"
sleep 5

echo -e "${YELLOW}Step 6: Checking if containers are running...${NC}"
docker compose ps

echo
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo
echo "Next steps:"
echo "1. Try uploading a document through the UI"
echo "2. Check logs if issues occur: docker compose logs -f supermark"
echo
