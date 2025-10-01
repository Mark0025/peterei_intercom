#!/bin/bash

# Install Claude Code Git Hooks
# This script symlinks Claude hooks to Git's hooks directory

set -e

echo "🔧 Installing Claude Code Git Hooks..."
echo ""

# Get the project root (where .git is located)
PROJECT_ROOT=$(git rev-parse --show-toplevel)
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
CLAUDE_HOOKS_DIR="$PROJECT_ROOT/.claude/hooks"

# Verify we're in a git repository
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "❌ ERROR: Not in a git repository"
    exit 1
fi

# Create .claude/hooks directory if it doesn't exist
if [ ! -d "$CLAUDE_HOOKS_DIR" ]; then
    echo "❌ ERROR: .claude/hooks directory not found"
    echo "   Expected at: $CLAUDE_HOOKS_DIR"
    exit 1
fi

# Make all hook scripts executable
chmod +x "$CLAUDE_HOOKS_DIR"/*.sh

# Install each hook
HOOKS=("pre-commit" "post-commit" "pre-push" "post-push")

for HOOK in "${HOOKS[@]}"; do
    SOURCE="$CLAUDE_HOOKS_DIR/$HOOK.sh"
    TARGET="$GIT_HOOKS_DIR/$HOOK"

    if [ ! -f "$SOURCE" ]; then
        echo "⚠️  Warning: $HOOK.sh not found, skipping"
        continue
    fi

    # Backup existing hook if it exists
    if [ -f "$TARGET" ] && [ ! -L "$TARGET" ]; then
        echo "   📦 Backing up existing $HOOK to $HOOK.backup"
        mv "$TARGET" "$TARGET.backup"
    fi

    # Remove old symlink if it exists
    if [ -L "$TARGET" ]; then
        rm "$TARGET"
    fi

    # Create symlink
    ln -s "$SOURCE" "$TARGET"
    echo "   ✅ Installed $HOOK hook"
done

echo ""
echo "✅ All hooks installed successfully!"
echo ""
echo "📋 Installed hooks:"
echo "   - pre-commit: Verifies issue reference in commits"
echo "   - post-commit: Auto-closes issues with 'Closes #123'"
echo "   - pre-push: Verifies issues exist before pushing"
echo "   - post-push: Comments on issues after push"
echo ""
echo "💡 To bypass a hook: git commit --no-verify"
echo ""
echo "🔍 Test a hook manually:"
echo "   .claude/hooks/pre-commit.sh"
echo ""
