#!/bin/bash
# Supermark Environment Validation Script
# This script helps identify and prevent environment variable duplication issues

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=========================================="
echo "Supermark Environment Validation"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check 1: Look for .env file
echo "1. Checking for .env file..."
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${GREEN}✓ Found .env file${NC}"
else
    echo -e "${RED}✗ No .env file found${NC}"
    echo "  Please create .env file: cp .env.production.example .env"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 2: Look for multiple .env files that could cause conflicts
echo "2. Checking for conflicting .env files..."
ENV_FILES=$(find "$PROJECT_ROOT" -maxdepth 1 -name ".env*" -type f ! -name "*.example" | wc -l)
if [ "$ENV_FILES" -eq 1 ]; then
    echo -e "${GREEN}✓ Only one .env file found (good)${NC}"
elif [ "$ENV_FILES" -gt 1 ]; then
    echo -e "${YELLOW}⚠ Multiple .env files found:${NC}"
    find "$PROJECT_ROOT" -maxdepth 1 -name ".env*" -type f ! -name "*.example"
    echo "  This may cause environment variable duplication"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 3: Verify required variables are set in .env
echo "3. Checking required environment variables..."
if [ -f "$PROJECT_ROOT/.env" ]; then
    REQUIRED_VARS=(
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
        "DOCUMENT_PASSWORD_KEY"
        "POSTGRES_PASSWORD"
    )

    for VAR in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${VAR}=" "$PROJECT_ROOT/.env"; then
            VALUE=$(grep "^${VAR}=" "$PROJECT_ROOT/.env" | cut -d'=' -f2)
            if [ -n "$VALUE" ] && [ "$VALUE" != "CHANGE_ME_GENERATE_WITH_OPENSSL" ] && [ "$VALUE" != "CHANGE_ME_GENERATE_STRONG_PASSWORD" ]; then
                echo -e "  ${GREEN}✓ ${VAR} is set${NC}"
            else
                echo -e "  ${RED}✗ ${VAR} is not configured (still using placeholder)${NC}"
                ERRORS=$((ERRORS + 1))
            fi
        else
            echo -e "  ${RED}✗ ${VAR} is missing${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    done
fi
echo ""

# Check 4: Test docker-compose config for duplicates
echo "4. Checking for duplicate variables in docker-compose config..."
if command -v docker compose &> /dev/null; then
    # Temporarily disable error exit for this check
    set +e

    CONFIG_OUTPUT=$(cd "$PROJECT_ROOT" && docker compose config 2>&1)
    CONFIG_EXIT_CODE=$?

    set -e

    if [ $CONFIG_EXIT_CODE -eq 0 ]; then
        # Check for duplicate NEXTAUTH_SECRET in the config
        NEXTAUTH_SECRET_COUNT=$(echo "$CONFIG_OUTPUT" | grep -c "NEXTAUTH_SECRET:" || true)
        NEXTAUTH_URL_COUNT=$(echo "$CONFIG_OUTPUT" | grep -c "NEXTAUTH_URL:" || true)

        if [ "$NEXTAUTH_SECRET_COUNT" -eq 1 ] && [ "$NEXTAUTH_URL_COUNT" -eq 1 ]; then
            echo -e "${GREEN}✓ No duplicate environment variables detected in docker-compose config${NC}"
        else
            echo -e "${YELLOW}⚠ Found $NEXTAUTH_SECRET_COUNT occurrences of NEXTAUTH_SECRET${NC}"
            echo -e "${YELLOW}⚠ Found $NEXTAUTH_URL_COUNT occurrences of NEXTAUTH_URL${NC}"
            echo "  This might be normal if you have multiple services, but verify carefully"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${YELLOW}⚠ Could not validate docker-compose config${NC}"
        echo "  Error: $CONFIG_OUTPUT"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠ Docker Compose not found, skipping docker-compose validation${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 5: If containers are running, check for duplicates inside container
echo "5. Checking running containers for duplicate environment variables..."
if command -v docker compose &> /dev/null; then
    set +e
    CONTAINER_RUNNING=$(cd "$PROJECT_ROOT" && docker compose ps -q supermark 2>/dev/null)
    set -e

    if [ -n "$CONTAINER_RUNNING" ]; then
        echo "  Checking environment variables inside supermark container..."

        set +e
        NEXTAUTH_LINES=$(cd "$PROJECT_ROOT" && docker compose exec -T supermark printenv 2>/dev/null | grep "^NEXTAUTH_SECRET=" | wc -l)
        NEXTAUTH_URL_LINES=$(cd "$PROJECT_ROOT" && docker compose exec -T supermark printenv 2>/dev/null | grep "^NEXTAUTH_URL=" | wc -l)
        set -e

        if [ "$NEXTAUTH_LINES" -eq 1 ] && [ "$NEXTAUTH_URL_LINES" -eq 1 ]; then
            echo -e "${GREEN}✓ No duplicate environment variables in running container${NC}"
        elif [ "$NEXTAUTH_LINES" -gt 1 ] || [ "$NEXTAUTH_URL_LINES" -gt 1 ]; then
            echo -e "${RED}✗ DUPLICATE environment variables detected!${NC}"
            echo -e "  Found $NEXTAUTH_LINES occurrences of NEXTAUTH_SECRET"
            echo -e "  Found $NEXTAUTH_URL_LINES occurrences of NEXTAUTH_URL"
            echo ""
            echo "  This is the ROOT CAUSE of NextAuth failures!"
            echo "  See docker/PRODUCTION_SETUP.md for how to fix this."
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${YELLOW}⚠ No running supermark container found${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Docker Compose not found, skipping container validation${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo -e "Errors:   ${RED}${ERRORS}${NC}"
echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Your environment is properly configured."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Validation completed with warnings${NC}"
    echo ""
    echo "Please review the warnings above."
    exit 0
else
    echo -e "${RED}✗ Validation failed with errors${NC}"
    echo ""
    echo "Please fix the errors above before deploying."
    echo "See docker/PRODUCTION_SETUP.md for detailed instructions."
    exit 1
fi
