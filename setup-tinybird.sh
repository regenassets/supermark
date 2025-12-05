#!/bin/bash
set -e

echo "================================================"
echo "Tinybird Setup Script for Supermark"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if tb CLI is installed
if ! command -v tb &> /dev/null; then
    echo -e "${RED}Error: Tinybird CLI not found${NC}"
    echo "Install it with: npm install -g @tinybirdco/cli"
    exit 1
fi

echo -e "${GREEN}✓ Tinybird CLI found${NC}"
echo ""

# Check if already authenticated
if ! tb workspace ls &> /dev/null; then
    echo -e "${YELLOW}You need to authenticate with Tinybird${NC}"
    echo "Running: tb auth"
    tb auth
fi

echo -e "${GREEN}✓ Authenticated with Tinybird${NC}"
echo ""

# Ask for workspace name
read -p "Enter workspace name (default: supermark-analytics): " WORKSPACE
WORKSPACE=${WORKSPACE:-supermark-analytics}

# Check if workspace exists, create if not
if tb workspace ls | grep -q "$WORKSPACE"; then
    echo -e "${GREEN}✓ Workspace '$WORKSPACE' exists${NC}"
    tb workspace use "$WORKSPACE"
else
    echo -e "${YELLOW}Creating workspace '$WORKSPACE'${NC}"
    tb workspace create "$WORKSPACE"
    tb workspace use "$WORKSPACE"
fi

echo ""
echo -e "${YELLOW}Pushing datasources...${NC}"
cd lib/tinybird
tb push datasources/*.datasource --force

echo ""
echo -e "${YELLOW}Pushing endpoints (pipes)...${NC}"
tb push endpoints/*.pipe --force

echo ""
echo -e "${GREEN}✓ Tinybird datasources and pipes deployed${NC}"
echo ""

# Create token
echo -e "${YELLOW}Creating API token...${NC}"
TOKEN_OUTPUT=$(tb token create supermark-production-$(date +%Y%m%d) \
  --permissions "DATASOURCES:READ,DATASOURCES:APPEND,PIPES:READ" 2>&1)

# Extract token from output
TOKEN=$(echo "$TOKEN_OUTPUT" | grep -oE 'p\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+' | head -1)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Error: Could not extract token${NC}"
    echo "Please create a token manually and add it to .env.docker"
    echo "Run: tb token create supermark-production --permissions \"DATASOURCES:READ,DATASOURCES:APPEND,PIPES:READ\""
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Token created successfully${NC}"
echo ""
echo -e "${YELLOW}Token:${NC} ${TOKEN}"
echo ""

# Update .env.docker
cd ../..
if [ -f ".env.docker" ]; then
    # Check if TINYBIRD_TOKEN line exists
    if grep -q "^#\? *TINYBIRD_TOKEN=" .env.docker; then
        # Update existing line
        sed -i.bak "s|^#\? *TINYBIRD_TOKEN=.*|TINYBIRD_TOKEN=${TOKEN}|" .env.docker
        echo -e "${GREEN}✓ Updated TINYBIRD_TOKEN in .env.docker${NC}"
    else
        # Add new line
        echo "" >> .env.docker
        echo "# Tinybird Analytics Token" >> .env.docker
        echo "TINYBIRD_TOKEN=${TOKEN}" >> .env.docker
        echo -e "${GREEN}✓ Added TINYBIRD_TOKEN to .env.docker${NC}"
    fi
else
    echo -e "${YELLOW}Warning: .env.docker not found${NC}"
    echo "Please manually add this to your environment file:"
    echo "TINYBIRD_TOKEN=${TOKEN}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}Tinybird Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Restart your Docker containers:"
echo "   docker compose down && docker compose up -d"
echo ""
echo "2. Test analytics by viewing a document"
echo ""
echo "3. Check Tinybird dashboard:"
echo "   https://ui.tinybird.co"
echo ""
echo "Token saved to .env.docker"
echo "Backup created at .env.docker.bak"
echo ""
