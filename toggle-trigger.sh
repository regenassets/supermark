#!/bin/bash

# Script to quickly disable or enable Trigger.dev in production
# Usage: ./toggle-trigger.sh [enable|disable]

set -e

ENV_FILE="${ENV_FILE:-.env.production}"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found"
    echo "Usage: ENV_FILE=.env.production ./toggle-trigger.sh [enable|disable]"
    exit 1
fi

ACTION="${1:-}"

if [ "$ACTION" != "enable" ] && [ "$ACTION" != "disable" ]; then
    echo "Usage: $0 [enable|disable]"
    echo ""
    echo "Examples:"
    echo "  $0 disable  # Disable Trigger.dev (quick fix)"
    echo "  $0 enable   # Re-enable Trigger.dev (after worker deployment)"
    exit 1
fi

# Backup the env file
cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✓ Backed up $ENV_FILE"

if [ "$ACTION" = "disable" ]; then
    echo ""
    echo "Disabling Trigger.dev..."
    echo ""

    # Comment out TRIGGER_SECRET_KEY if it exists and is not already commented
    if grep -q "^TRIGGER_SECRET_KEY=" "$ENV_FILE"; then
        sed -i 's/^TRIGGER_SECRET_KEY=/#TRIGGER_SECRET_KEY=/g' "$ENV_FILE"
        echo "✓ Disabled TRIGGER_SECRET_KEY"
    elif grep -q "^#TRIGGER_SECRET_KEY=" "$ENV_FILE"; then
        echo "  TRIGGER_SECRET_KEY already disabled"
    else
        echo "  TRIGGER_SECRET_KEY not found in $ENV_FILE"
    fi

    echo ""
    echo "✅ Trigger.dev has been disabled"
    echo ""
    echo "What this means:"
    echo "  ✓ PDF uploads will still work"
    echo "  ✓ No more 'waiting for worker' messages"
    echo "  ✗ Office/CAD file conversions won't work"
    echo "  ✗ Video optimization won't work"
    echo ""
    echo "Next steps:"
    echo "  1. Restart your app:"
    echo "     docker compose --env-file $ENV_FILE restart supermark"
    echo ""
    echo "  2. Test uploading a PDF and creating a link"
    echo ""

elif [ "$ACTION" = "enable" ]; then
    echo ""
    echo "Enabling Trigger.dev..."
    echo ""

    # Uncomment TRIGGER_SECRET_KEY if it exists and is commented
    if grep -q "^#TRIGGER_SECRET_KEY=" "$ENV_FILE"; then
        sed -i 's/^#TRIGGER_SECRET_KEY=/TRIGGER_SECRET_KEY=/g' "$ENV_FILE"
        echo "✓ Enabled TRIGGER_SECRET_KEY"
    elif grep -q "^TRIGGER_SECRET_KEY=" "$ENV_FILE"; then
        echo "  TRIGGER_SECRET_KEY already enabled"
    else
        echo "  TRIGGER_SECRET_KEY not found in $ENV_FILE"
        echo "  You'll need to add it manually"
    fi

    echo ""
    echo "✅ Trigger.dev has been enabled"
    echo ""
    echo "⚠️  IMPORTANT: Make sure you've deployed the Trigger.dev worker!"
    echo ""
    echo "If you haven't deployed the worker yet:"
    echo "  1. See TRIGGER-DEPLOYMENT.md for instructions"
    echo "  2. Run: npm run trigger:deploy"
    echo ""
    echo "Then restart your app:"
    echo "  docker compose --env-file $ENV_FILE restart supermark"
    echo ""
fi

echo "Backup saved to: ${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
