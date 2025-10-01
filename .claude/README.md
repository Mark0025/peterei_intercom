# Claude Code Configuration

This directory contains Claude Code configuration and hooks for enforcing development protocols.

## Issue-First Protocol

All feature development must follow the **issue → commit → push → close** workflow.

### Workflow

1. **Create Issue**
   ```bash
   gh issue create --title "Add feature X" --body "Description..."
   ```

2. **Work on Feature**
   ```bash
   # Make your changes
   git add .
   git commit -m "feat: implement feature X

   Closes #123"
   ```

3. **Push Changes**
   ```bash
   git push
   # Hooks automatically comment on issue and close if "Closes #123" is in commit
   ```

## Hooks

### Pre-Commit Hook
- ✅ Verifies commit message references an issue (#123, Closes #123, etc.)
- ❌ Blocks commits without issue references
- 💡 Provides helpful error messages

### Post-Commit Hook
- 🎯 Auto-closes issues when commit message includes "Closes #123"
- 💬 Adds completion comment to issue

### Pre-Push Hook
- 🔍 Verifies all referenced issues exist
- ✅ Checks issue state (open/closed)
- ❌ Blocks push if issues don't exist

### Post-Push Hook
- 💬 Adds comment to issues with commit details
- 🔗 Links to commit on GitHub
- 📋 Shows commit message in issue

## Bypassing Hooks

For emergency fixes or minor changes:

```bash
git commit --no-verify -m "hotfix: emergency fix"
```

**Warning:** Use sparingly! The protocol exists for a reason.

## Configuration

Edit `.claude/config.json` to customize:

```json
{
  "protocol": {
    "requireIssueReference": true,
    "autoCommentOnPush": true,
    "autoCloseOnCompletion": true
  }
}
```

## Testing Hooks

Test hooks manually:

```bash
# Test pre-commit
.claude/hooks/pre-commit.sh

# Test pre-push
.claude/hooks/pre-push.sh
```

## Troubleshooting

### "Issue not found" error
- Make sure you created the issue first
- Verify you have GitHub CLI (`gh`) installed and authenticated

### Hooks not running
- Check hook permissions: `ls -l .claude/hooks/`
- Make executable: `chmod +x .claude/hooks/*.sh`

### Need to bypass temporarily
- Use `--no-verify` flag with git commands
- Example: `git commit --no-verify -m "message"`
