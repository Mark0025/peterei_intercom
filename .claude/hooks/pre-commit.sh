#!/bin/bash

# Pre-Commit Hook: Verify Issue Reference
# Ensures every commit references a GitHub issue

set -e

# Get the commit message
COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null || echo "")

# Check if this is the initial commit
if [ -z "$COMMIT_MSG" ]; then
    echo "⚠️  Initial commit detected, skipping issue check"
    exit 0
fi

# Check if commit message references an issue
if echo "$COMMIT_MSG" | grep -qE "#[0-9]+|Closes #[0-9]+|Fixes #[0-9]+|Issue #[0-9]+|Resolves #[0-9]+"; then
    echo "✅ Issue reference found in commit message"
    exit 0
fi

# Allow commits with --no-verify to bypass
if [ "$1" = "--no-verify" ]; then
    echo "⚠️  Bypassing issue check with --no-verify"
    exit 0
fi

echo ""
echo "❌ ERROR: Commit must reference a GitHub issue"
echo ""
echo "📋 Required format:"
echo "   - #123 (anywhere in commit message)"
echo "   - Closes #123"
echo "   - Fixes #123"
echo "   - Resolves #123"
echo ""
echo "💡 Quick fix:"
echo "   1. Create issue: gh issue create --title 'Your feature'"
echo "   2. Amend commit: git commit --amend -m 'Your message Closes #123'"
echo ""
echo "⚠️  To bypass this check: git commit --no-verify"
echo ""

exit 1
