#!/bin/bash

# Usage: bash git_changes_summary.sh
# Summarizes all changes since the last git push and appends to the README.md

cd "$(dirname "$0")/../.." || exit 1

TIMESTAMP=$(date)
README="README.md"

# Get short status and recent log
GIT_STATUS=$(git status --short)
GIT_LOG=$(git log --oneline -20)

SUMMARY="\n---\n\n## Git Changes Summary (as of $TIMESTAMP)\n\n### Uncommitted Changes\n\n\
$GIT_STATUS\n\n### Recent Commits\n\n\
$GIT_LOG\n\n---\n"

echo -e "$SUMMARY" >> "$README"

echo "Summary appended to $README" 