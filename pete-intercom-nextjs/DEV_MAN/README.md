# DEV_MAN - Development Manual

**Purpose**: Track development plans, learning sessions, and architectural decisions for Pete Intercom Next.js app.

---

## Directory Structure

```
DEV_MAN/
├── README.md                                      # This file
├── completed/                                     # Completed plans with GitHub issue links
│   └── [task-name]-[issue-#].md                  # Archived completed work
├── clerk-integration-plan.md                      # IN PROGRESS: Clerk auth integration
├── company-timeline-analysis-plan.md              # IN PROGRESS: Company timeline system (6 stages)
├── LEARNING-2025-01-company-timeline-planning.md  # COMPLETED: Planning session learnings
├── TYPESCRIPT-ANY-TYPES-PREVENTION.md            # COMPLETED: Type safety guide
└── tailwind-shadcn-best-practices.md             # REFERENCE: UI best practices
```

---

## Active Plans

### 1. Company Timeline Analysis System
**File**: `company-timeline-analysis-plan.md`
**Status**: Stage 1 in progress (TypeScript fixes)
**Branch**: `Next-refactor`
**GitHub Issues**: TBD (need to create 6 issues for 6 stages)

**Stages**:
1. ✅ Fix TypeScript build errors (DONE - see TYPESCRIPT-ANY-TYPES-PREVENTION.md)
2. ⏳ Enhance PeteAI with fuzzy company search
3. ⏳ Create company timeline UI
4. ⏳ Add topic-by-company analysis
5. ⏳ Build agent config UI
6. ⏳ Add help docs comparison

### 2. Clerk Integration
**File**: `clerk-integration-plan.md`
**Status**: Planning complete, not yet started
**Branch**: TBD
**GitHub Issues**: None created

---

## Completed Work

### LEARNING-2025-01-company-timeline-planning.md
**Date**: 2025-01-30
**Summary**: Planning session for company timeline analysis system
**Key Learnings**:
- Always analyze existing code before building
- Reuse types, don't create duplicates
- Create comprehensive plans with architecture diagrams
- Break large tasks into manageable stages

**Move to**: `completed/` once all 6 stages are done

### TYPESCRIPT-ANY-TYPES-PREVENTION.md
**Date**: 2025-01-30
**Summary**: Comprehensive guide to prevent `any` types in TypeScript
**Outcome**:
- Fixed 20+ `any` types across 6 files
- Added ESLint rule to block future `any` types
- Documented patterns and prevention strategies

**Move to**: `completed/typescript-any-prevention-[issue-#].md` after Stage 1 GitHub issue closed

---

## Reference Guides

### tailwind-shadcn-best-practices.md
**Purpose**: UI component and Tailwind CSS best practices
**Status**: Living document
**Keep**: In root DEV_MAN (reference material)

---

## Workflow

### When Starting New Work
1. Check if plan exists in DEV_MAN
2. If not, create `[feature-name]-plan.md`
3. Update this README with active plans section
4. Create GitHub issues for each stage
5. Link plan to issues

### When Completing Work
1. Update plan with ✅ checkmarks
2. Run final tests
3. Commit and close GitHub issue
4. Move plan to `completed/[plan-name]-[issue-#].md`
5. Update this README

### GitHub Issue Creation
```bash
# For each stage in a plan
gh issue create --title "Stage X: [Feature Name]" \
  --body "See DEV_MAN/[plan-file].md for details" \
  --label "feature,stage-x"
```

### Moving to Completed
```bash
# After closing GitHub issue #123
mv DEV_MAN/feature-plan.md DEV_MAN/completed/feature-plan-issue-123.md
git add DEV_MAN/
git commit -m "docs: archive completed plan for feature (closes #123)"
```

---

## Related DEV_MAN Directories

**Other locations**:
- `../intercomApp/DEV_MAN/` - Old Express app docs (pre-Next.js migration)
- `../DEV_MAN/` - Root project docs
- Other projects: `../../*/DEV_MAN/`

**This directory** (`pete-intercom-nextjs/DEV_MAN/`) is the ACTIVE development manual for the Next.js app.

---

## Best Practices

1. **One Plan Per Feature** - Each major feature gets its own plan file
2. **Stage-Based Development** - Break work into stages with clear success criteria
3. **Learning Documentation** - Document surprises, gotchas, and solutions
4. **Architecture Diagrams** - Use Mermaid diagrams for complex systems
5. **GitHub Integration** - Link plans to issues, issues to commits
6. **Archive Completed Work** - Move to `completed/` with issue number
7. **Update README** - Keep this file current with active/completed status

---

**Last Updated**: 2025-01-30
**Maintained By**: Claude Code + Mark Carpenter
