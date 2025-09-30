# Git Safety Rules - CRITICAL

## NEVER Use `git checkout` on Working Directory Files

**RULE:** Never use `git checkout -- <file>` or `git restore <file>` to revert uncommitted changes without explicit user confirmation.

### Why This Rule Exists

On 2025-09-29, uncommitted work was nearly lost when `git checkout` was used to revert files that had styling changes. The changes were recovered using `git fsck --lost-found` to find a dangling stash commit, but this could have resulted in permanent data loss.

### Safe Alternatives

Instead of `git checkout` to revert changes:

1. **ALWAYS ask the user first:**
   ```
   "I see these files have uncommitted changes. Do you want me to:
   1. Stash the changes (can be recovered later)
   2. Commit them first
   3. Discard them (PERMANENT - cannot be undone)"
   ```

2. **Use git stash when safety is needed:**
   ```bash
   # Safe: Can be recovered
   git stash push -m "Safety stash before changes"
   ```

3. **Show what will be lost:**
   ```bash
   # Show the user what changes will be lost
   git diff <file>
   ```

### Recovery Procedure (If It Happens Again)

If uncommitted changes are accidentally lost:

```bash
# 1. Check for dangling commits
git fsck --lost-found

# 2. Look for stash-related commits
git show <commit-hash> --stat

# 3. Restore files from the dangling commit
git checkout <commit-hash> -- <file-path>
```

### Git Commands That Are DANGEROUS Without Confirmation

- `git checkout -- <file>` - Discards uncommitted changes
- `git restore <file>` - Same as checkout, discards changes
- `git reset --hard` - Discards all uncommitted changes
- `git clean -fd` - Deletes untracked files permanently

### Git Commands That Are SAFE

- `git stash` - Saves changes, can be recovered
- `git commit` - Permanently saves changes
- `git diff` - Shows changes without modifying anything
- `git status` - Shows status without modifying anything

## Implementation

This rule should be enforced in:
- Project CLAUDE.md files
- AI assistant system prompts
- Developer onboarding documentation
- Code review guidelines

**Remember:** Uncommitted work represents real human effort and should NEVER be discarded without explicit permission.