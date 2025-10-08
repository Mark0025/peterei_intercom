# Learning: Company Timeline Analysis System Planning

**Date**: 2025-01-30
**Status**: Planning Complete
**Branch**: Next-refactor

## The Full Story

### The Problem We Encountered

User needed a sophisticated onboarding analysis system that:
- Groups conversations by company_id to show complete timelines
- Uses NLP analysis with LangGraph agent tools
- Provides topic-specific drill-downs
- Compares actual vs documented processes
- Maintains strict type safety
- Has UI config for all settings

Also had a reported TypeScript build error in `conversations.ts:77` claiming `priority` property didn't exist.

### What We Initially Thought

- Believed there was a type definition error where `IntercomConversation` was missing the `priority` property
- Thought we'd need to add the property to the type definition
- Assumed we'd need to build everything from scratch

### What We Discovered Was Actually True

1. **No Build Error in conversations.ts**: The `priority` property DOES exist in `IntercomConversation` type (line 226 of index.ts) as `priority: 'not_priority' | 'priority'`

2. **Actual Build Errors**: Were in `questionnaire-analysis.ts` - ESLint warnings about `any` types, NOT the conversations file

3. **Extensive Existing Infrastructure**: We already have:
   - Intercom cache system with conversations, contacts, companies
   - Proper TypeScript type definitions
   - Company lookup actions (search, get, update)
   - Onboarding analysis with topic grouping
   - UI components (shadcn/ui, Mermaid diagrams)
   - Settings system with UI config

4. **What Was Actually Missing**:
   - Company tools not integrated into LangGraph agent
   - No fuzzy search (only exact match)
   - No company-grouped analysis in UI
   - No timeline view
   - No help docs comparison
   - No AI config UI

### The Journey: Troubleshooting Steps

1. **Analyzed TypeScript Types**
   - Read `src/types/index.ts` lines 215-275
   - Found `IntercomConversation` interface
   - Confirmed `priority` property exists on line 226

2. **Ran Actual Build**
   - Executed `pnpm build`
   - Discovered errors were in `questionnaire-analysis.ts`, not `conversations.ts`
   - Errors were ESLint warnings for `any` types

3. **Audited Existing Codebase**
   - `src/services/intercom.ts` - cache system ✅
   - `src/actions/company-lookup.ts` - company functions ✅
   - `src/actions/onboarding-analysis.ts` - topic analysis ✅
   - `src/types/index.ts` - all types properly defined ✅

4. **Created Architecture Diagram**
   ```mermaid
   graph TD
       A[Intercom Cache] --> B[Company Tools Module]
       B --> C[Fuzzy Search]
       B --> D[Timeline Extraction]
       B --> E[Attribute JSONify]
       B --> F[Topic Analysis]
       G[LangGraph Agent] --> B
       G --> H[PeteAI Chat]
       G --> I[Onboarding Analyzer]
   ```

5. **Designed 6-Stage Plan**
   - Stage 1: Fix build errors
   - Stage 2: Enhanced company search
   - Stage 3: Company timeline UI
   - Stage 4: Topic-by-company analysis
   - Stage 5: Settings UI for agent
   - Stage 6: Help docs comparison

### The Solution That Worked

**Created Comprehensive Development Plan**: `DEV_MAN/company-timeline-analysis-plan.md`

**Key Components**:

1. **What We Already Have Section**
   - Detailed audit of existing infrastructure
   - Identified reusable components
   - Listed what's actually missing

2. **6-Stage Implementation Plan**
   - Each stage has clear tasks
   - Files to modify listed
   - Success criteria defined
   - GitHub workflow documented

3. **Created Company Tools Module**: `src/services/company-tools.ts`
   - `fuzzySearchCompany()` - handles "stkcam" → "Stkcam"
   - `getCompanyTimeline()` - full company conversation history
   - `extractCompanyAttributes()` - JSONifies company data
   - `analyzeTopicByCompany()` - groups conversations by company

4. **GitHub Workflow Process**
   ```bash
   # Create issue for each stage
   gh issue create --title "..." --body "..." --label "..."

   # Create feature branch
   git checkout -b feat/feature-name

   # Push and create PR
   git push origin feat/feature-name
   gh pr create --base Next-refactor --fill

   # Close issue when complete
   gh issue close <issue-number> --comment "Fixed in commit abc123"
   ```

5. **Type Safety Checklist**
   - All functions return typed results
   - LangGraph tools have proper schemas
   - UI components use proper types
   - No `any` types in production code
   - Settings config is typed

## The Lesson Learned

### Before Building: Analyze First

**Always Do This**:
1. ✅ Audit existing codebase thoroughly
2. ✅ Read type definitions before assuming they're wrong
3. ✅ Run actual build to see real errors, not reported errors
4. ✅ Map what exists vs what's needed
5. ✅ Create architecture diagrams
6. ✅ Design staged implementation plan
7. ✅ Document GitHub workflow

**Never Do This**:
1. ❌ Assume reported errors are accurate without verification
2. ❌ Start building before understanding what exists
3. ❌ Add duplicate functionality
4. ❌ Build without a plan
5. ❌ Skip architecture analysis

### Development Process

**The Right Way**:
```
1. Analyze existing code
2. Create DEV_MAN plan with diagrams
3. Break into small stages
4. Create GitHub issues
5. Build incrementally
6. Test each stage
7. Commit frequently
8. Link commits to plan
9. Document as you go
```

**Key Principles**:
- Build on what exists, don't rebuild
- Type safety first, always
- UI for every config option
- Test incrementally, commit often
- Document the journey, not just the destination

### Technical Insights

1. **TypeScript Type Checking**: Just because code reports an error doesn't mean the type is wrong - could be a caching or resolution issue

2. **Existing Infrastructure Value**: Pete Intercom app already has:
   - Robust cache system
   - Proper type definitions
   - Company lookup functions
   - Analysis pipeline
   - UI component library

   Building on this is 10x faster than starting fresh

3. **Fuzzy Search Implementation**: Used Levenshtein distance algorithm for "stkcam" → "Stkcam" matching

4. **Company Timeline Structure**:
   ```typescript
   {
     companyId, companyName,
     conversations: [...],
     contacts: [...],
     topics: { "Data Upload": 5, ... },
     firstInteraction, lastInteraction
   }
   ```

5. **LangGraph Tool Pattern**: Each tool returns:
   ```typescript
   { success: boolean, data?: T, error?: string }
   ```

## Files Created/Modified

### Created
- `DEV_MAN/company-timeline-analysis-plan.md` - Master plan
- `src/services/company-tools.ts` - Company analysis tools
- `DEV_MAN/LEARNING-2025-01-company-timeline-planning.md` - This file

### To Be Created (Per Plan)
- `src/app/admin/companies/[id]/timeline/page.tsx`
- `src/app/admin/settings/ai/page.tsx`
- `src/services/help-docs-fetcher.ts`

### To Be Modified (Per Plan)
- `src/actions/onboarding-analysis.ts` - Add company grouping
- `src/app/admin/onboarding-insights/page.tsx` - Show companies per topic
- `src/services/langraph-agent.ts` - Integrate company tools
- `src/types/ui-config.ts` - Add AIConfig type

## Success Metrics

**This Planning Session**:
- ✅ Comprehensive plan created
- ✅ Architecture documented
- ✅ Existing code audited
- ✅ Company tools module built
- ✅ 6-stage roadmap defined
- ✅ GitHub workflow documented
- ✅ Type safety checklist created

**Next Session Goals**:
1. Fix questionnaire-analysis.ts `any` types
2. Create GitHub issues for 6 stages
3. Start Stage 2: Enhanced company search

## Related Documentation

- `DEV_MAN/company-timeline-analysis-plan.md` - Full implementation plan
- `DEV_MAN/nextjs-migration-plan.md` - Overall architecture
- `CLAUDE.md` - Project instructions
- `src/services/company-tools.ts` - Tool implementations

## Command Reference

```bash
# Verify types
cat src/types/index.ts | grep -A 30 "IntercomConversation"

# Run build
pnpm build

# Create GitHub issue
gh issue create --title "Feature title" --body "Description" --label "feature"

# Create feature branch
git checkout -b feat/feature-name

# Create PR
gh pr create --base Next-refactor --fill
```

---

**The Bottom Line**: Always analyze before building. Create the plan first, code second. Build incrementally, test often, document thoroughly. This approach turns a complex multi-stage project into manageable, trackable work.