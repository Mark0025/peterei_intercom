#!/bin/bash

# Run conversation analysis script
# This will generate JSON files in data/conversation-analysis/

echo "🔍 Running conversation data analysis..."
echo ""

cd "$(dirname "$0")/../.." || exit 1

# Run the TypeScript analysis script with tsx
npx tsx src/scripts/analyze-conversations.ts

echo ""
echo "📦 Files ready for download:"
echo "   data/conversation-analysis/first-questions.json"
echo "   data/conversation-analysis/error-resolutions.json"
echo "   data/conversation-analysis/analysis-stats.json"
