#!/bin/bash

# FleetInspect Pro - EAS Tokens & Secrets Setup Script
# Reads from eas-tokens.json and sets them in EAS
# Uses the new `eas env:create` command (eas secret:create is deprecated)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOKENS_FILE="$SCRIPT_DIR/eas-tokens.json"

echo "========================================"
echo "FleetInspect Pro - EAS Setup"
echo "========================================"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq not found. Install with: brew install jq"
    exit 1
fi

# Check if eas-cli is installed
if ! command -v eas &> /dev/null; then
    echo "Error: EAS CLI not found. Install with: npm install -g eas-cli"
    exit 1
fi

# Check if tokens file exists
if [ ! -f "$TOKENS_FILE" ]; then
    echo "Error: eas-tokens.json not found at $TOKENS_FILE"
    echo "Please create the file with your tokens and secrets."
    exit 1
fi

# Check if logged in
echo "Checking EAS login status..."
if ! eas whoami &> /dev/null; then
    echo "Not logged in. Please login first:"
    eas login
fi

echo ""
echo "Current EAS user: $(eas whoami)"
echo ""

# Function to set an environment variable (using new eas env:create)
set_env_var() {
    local name=$1
    local value=$2
    local visibility=$3  # "sensitive" for EXPO_PUBLIC_, "secret" for others

    if [ -z "$value" ] || [ "$value" = "null" ]; then
        echo "  ⏭  Skipping $name (no value)"
        return
    fi

    echo "  📤 Setting $name (visibility: $visibility)..."
    # Try to create, if exists try to update
    if eas env:create --name "$name" --value "$value" --visibility "$visibility" --environment production --non-interactive 2>&1 | grep -q "Created"; then
        echo "  ✅ $name created successfully"
    elif eas env:update --variable-name "$name" --value "$value" --environment production --non-interactive 2>&1 | grep -q "Updated"; then
        echo "  ✅ $name updated successfully"
    else
        echo "  ⚠️  $name may already exist with same value or failed"
    fi
}

echo "========================================"
echo "Setting TOKENS (API keys for services)"
echo "========================================"
echo ""
echo "Note: EXPO_PUBLIC_* vars use 'sensitive' visibility (visible in app but hidden in UI)"
echo ""

# Read and set tokens - EXPO_PUBLIC_ vars should use "sensitive" visibility
for key in $(jq -r '.tokens | keys[]' "$TOKENS_FILE"); do
    value=$(jq -r ".tokens[\"$key\"]" "$TOKENS_FILE")
    if [[ "$key" == EXPO_PUBLIC_* ]]; then
        set_env_var "$key" "$value" "sensitive"
    else
        set_env_var "$key" "$value" "secret"
    fi
done

echo ""
echo "========================================"
echo "Setting SECRETS (Sentry config)"
echo "========================================"
echo ""

# Read and set secrets
for key in $(jq -r '.secrets | keys[]' "$TOKENS_FILE"); do
    value=$(jq -r ".secrets[\"$key\"]" "$TOKENS_FILE")
    if [[ "$key" == EXPO_PUBLIC_* ]]; then
        set_env_var "$key" "$value" "sensitive"
    else
        set_env_var "$key" "$value" "secret"
    fi
done

echo ""
echo "========================================"
echo "Verifying EAS environment variables..."
echo "========================================"
echo ""
eas env:list --environment production 2>/dev/null || eas env:list 2>/dev/null || echo "Run 'eas env:list' to verify"

echo ""
echo "========================================"
echo "Setup complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Build for production: eas build --platform all --profile production"
echo "  2. Submit to stores: eas submit --platform all"
echo ""
