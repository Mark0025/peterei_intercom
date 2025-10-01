#!/bin/bash

# Post-Push Hook: Auto-comment on Issues
# Adds a comment to referenced issues after successful push

set -e

# Get the current branch
BRANCH=$(git branch --show-current)
COMMIT_SHA=$(git rev-parse HEAD)
SHORT_SHA=$(git rev-parse --short HEAD)

# Get the remote branch
REMOTE_BRANCH="origin/$BRANCH"

# Check if remote branch exists (if not, this is first push)
if ! git rev-parse --verify "$REMOTE_BRANCH" &>/dev/null; then
    echo "ℹ️  First push, no previous commits to compare"
    exit 0
fi

# Extract issue numbers from the most recent commit
ISSUE_NUMS=$(git log -1 --pretty=%B | grep -oE "#[0-9]+" | tr -d '#' | sort -u)

if [ -z "$ISSUE_NUMS" ]; then
    echo "ℹ️  No issues referenced in latest commit"
    exit 0
fi

echo "💬 Adding comments to issues..."

# Comment on each issue
for ISSUE_NUM in $ISSUE_NUMS; do
    # Get commit message
    COMMIT_MSG=$(git log -1 --pretty=%B)

    # Create comment body
    COMMENT="✅ **Changes pushed to \`$BRANCH\`**

**Commit:** \`$SHORT_SHA\`
**Branch:** \`$BRANCH\`

**Commit message:**
\`\`\`
$COMMIT_MSG
\`\`\`

View commit: https://github.com/Mark0025/peterei_intercom/commit/$COMMIT_SHA"

    if gh issue comment "$ISSUE_NUM" --body "$COMMENT" 2>/dev/null; then
        echo "   ✅ Commented on issue #$ISSUE_NUM"
    else
        echo "   ⚠️  Could not comment on issue #$ISSUE_NUM (might be closed or permission issue)"
    fi
done

echo ""
echo "✅ Post-push processing complete"
exit 0
