#!/bin/bash

# Pre-Push Hook: Ensure Issue Exists and is Open
# Verifies that referenced issues exist before pushing

set -e

# Get the current branch
BRANCH=$(git branch --show-current)

# Get commits that are about to be pushed
REMOTE_BRANCH="origin/$BRANCH"

# Check if remote branch exists
if ! git rev-parse --verify "$REMOTE_BRANCH" &>/dev/null; then
    echo "ℹ️  First push to $BRANCH, skipping issue verification"
    exit 0
fi

# Extract issue numbers from commits being pushed
ISSUE_NUMS=$(git log "$REMOTE_BRANCH..HEAD" --pretty=%B | grep -oE "#[0-9]+" | tr -d '#' | sort -u)

if [ -z "$ISSUE_NUMS" ]; then
    echo "⚠️  No issue references found in commits being pushed"
    echo "   This might be okay for minor changes, but consider creating an issue"
    exit 0
fi

echo "🔍 Verifying issues..."

# Check each issue
for ISSUE_NUM in $ISSUE_NUMS; do
    echo -n "   Issue #$ISSUE_NUM: "

    # Check if issue exists and get its state
    if ISSUE_STATE=$(gh issue view "$ISSUE_NUM" --json state --jq .state 2>/dev/null); then
        if [ "$ISSUE_STATE" = "OPEN" ]; then
            echo "✅ Open"
        else
            echo "⚠️  Closed (this is fine, just FYI)"
        fi
    else
        echo "❌ Not found"
        echo ""
        echo "ERROR: Issue #$ISSUE_NUM does not exist!"
        echo "Please create it or fix the reference."
        exit 1
    fi
done

echo ""
echo "✅ All referenced issues verified"
exit 0
