#!/bin/bash

set -e

echo "[DEBUG] Starting intercomApp/start.sh for production/cloud..."

# Load environment variables from .env if it exists (optional for local dev)
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Install dependencies if needed
if command -v pnpm &> /dev/null; then
  pnpm install
else
  npm install
fi

echo "[DEBUG] Starting Node.js app..."
node src/index.js 