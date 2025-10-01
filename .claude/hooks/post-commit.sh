#!/bin/bash

# Post-Commit Hook: Auto-close issues when commit message includes "Closes #123"

set -e

# Get the commit message
COMMIT_MSG=$(git log -1 --pretty=%B)

# Extract issue numbers that should be closed
CLOSE_ISSUES=$(echo "$COMMIT_MSG" | grep -oE "(Closes|Fixes|Resolves) #[0-9]+" | grep -oE "#[0-9]+" | tr -d '#' | sort -u)

if [ -z "$CLOSE_ISSUES" ]; then
    exit 0
fi

echo "🎯 Found close commands in commit..."

for ISSUE_NUM in $CLOSE_ISSUES; do
    echo -n "   Issue #$ISSUE_NUM: "

    # Check if issue exists and is open
    if ISSUE_STATE=$(gh issue view "$ISSUE_NUM" --json state --jq .state 2>/dev/null); then
        if [ "$ISSUE_STATE" = "OPEN" ]; then
            # Close the issue with a comment
            COMMIT_SHA=$(git rev-parse --short HEAD)
            gh issue close "$ISSUE_NUM" --comment "✅ **Completed and committed**

Commit: \`$COMMIT_SHA\`

**Message:**
\`\`\`
$COMMIT_MSG
\`\`\`" 2>/dev/null && echo "✅ Closed" || echo "⚠️  Could not close"
        else
            echo "ℹ️  Already closed"
        fi
    else
        echo "⚠️  Not found"
    fi
done

exit 0
