# GitHub Issues for 7-Levels Deep Onboarding System

## Overview
This document outlines the implementation phases for the onboarding discovery system, broken into testable GitHub issues.

---

## Phase 1: Data Analysis & Visualization

### Issue #1: Conversation Analysis Server Actions
**Title:** Implement onboarding conversation analysis with keyword matching

**Description:**
Create server actions to analyze all cached Intercom conversations for onboarding-related keywords and patterns.

**Tasks:**
- [x] Create `src/actions/onboarding-analysis.ts` with keyword matching
- [x] Implement topic categorization (8 major categories)
- [x] Generate timeline data for visualization
- [x] Add keyword frequency counting
- [x] Return structured insights with conversation excerpts

**Files:**
- `src/actions/onboarding-analysis.ts`

**Testing:**
- Verify keyword matching accuracy across conversation titles and bodies
- Test topic categorization logic
- Validate timeline data generation
- Ensure performance with large conversation datasets

**Acceptance Criteria:**
- Analysis completes in < 2 seconds for 1000+ conversations
- All 8 onboarding topics correctly identified
- Keyword matching case-insensitive and accurate

---

### Issue #2: Onboarding Insights Dashboard UI
**Title:** Build beautiful Pete-branded dashboard for onboarding insights

**Description:**
Create a visual dashboard at `/admin/onboarding-insights` to display conversation analysis results.

**Tasks:**
- [x] Create `src/app/admin/onboarding-insights/page.tsx`
- [x] Display stats cards (total conversations, onboarding-related, topics)
- [x] Render Mermaid diagram code for process flow
- [x] Show topic breakdown with filtering
- [x] List conversation insights with badges and excerpts
- [x] Display top keywords
- [x] Add navigation link in admin dashboard

**Design:**
- Pete branding: Purple (#8B5CF6) to Pink (#EC4899) gradients
- shadcn/ui components for consistency
- Responsive grid layouts
- Clean, modern aesthetics

**Files:**
- `src/app/admin/onboarding-insights/page.tsx`
- `src/app/admin/page.tsx` (navigation update)

**Testing:**
- Verify all stats calculate correctly
- Test topic filtering functionality
- Ensure responsive design on mobile/tablet/desktop
- Validate Mermaid diagram syntax

**Acceptance Criteria:**
- Dashboard loads in < 1 second
- All visualizations render correctly
- Topic filtering works immediately
- Mermaid diagram is valid and can be visualized

---

### Issue #3: Mermaid Diagram Generator
**Title:** Auto-generate Mermaid flowchart from conversation analysis

**Description:**
Create logic to automatically generate a Mermaid diagram representing the current onboarding process based on conversation data.

**Tasks:**
- [x] Implement `generateOnboardingMermaid()` server action
- [x] Convert topic breakdown to flowchart nodes
- [x] Add percentages and conversation counts to nodes
- [x] Include styling (colors, shapes)
- [x] Sort topics by frequency

**Files:**
- `src/actions/onboarding-analysis.ts` (added function)

**Testing:**
- Verify Mermaid syntax validity
- Test with different conversation datasets
- Ensure proper node connections
- Validate percentages calculate correctly

**Acceptance Criteria:**
- Generated diagram renders at mermaid.live
- All topics with > 0 conversations included
- Percentages sum correctly
- Styling applied consistently

---

## Phase 2: Questionnaire System

### Issue #4: Questionnaire Data Structure
**Title:** Design and implement 7-levels deep questionnaire JSON schema

**Description:**
Create comprehensive questionnaire covering 8 major onboarding topics with 7 levels of "why" questions each.

**Tasks:**
- [x] Create `src/data/onboarding-questionnaire.json`
- [x] Define 8 sections (Data Upload, Marketing Handoff, Intake, Timeline, Technical, Training, Workflow, Success Metrics)
- [x] Write 7 questions per section (56 total questions)
- [x] Add context and expectedAnswerType for each question
- [x] Include resolution categories metadata

**Philosophy:**
Each level digs deeper:
1. **What** is the current process?
2. **Why** do we use this approach?
3. **Why** is this better than alternatives?
4. **Why** does it fail or struggle?
5. **Why** haven't we fixed it?
6. **Why** does fixing it matter?
7. **Why** would perfection transform outcomes?

**Files:**
- `src/data/onboarding-questionnaire.json`

**Testing:**
- JSON validates against schema
- All questions follow 7-level structure
- Context provides clear guidance
- Resolution categories cover all scenarios

**Acceptance Criteria:**
- 8 sections × 7 questions = 56 total questions
- Every question has context and expectedAnswerType
- Questions progress logically from surface to deep
- JSON is valid and well-formatted

---

### Issue #5: Questionnaire Server Actions
**Title:** Implement server actions for questionnaire response management

**Description:**
Build server actions to save, retrieve, and export questionnaire responses with file-based storage.

**Tasks:**
- [x] Create `src/actions/questionnaire.ts`
- [x] Implement `saveQuestionnaireResponse()` with session management
- [x] Add `completeQuestionnaireSession()` with categorization
- [x] Build `getQuestionnaireSession()` for loading progress
- [x] Create `listQuestionnaireSessions()` for all sessions
- [x] Implement `exportSessionToMarkdown()` for documentation

**Storage:**
- File-based storage in `data/questionnaire-responses/`
- JSON format for easy editing and version control
- Session-based architecture for resume capability

**Files:**
- `src/actions/questionnaire.ts`
- `data/questionnaire-responses/*.json` (created at runtime)

**Testing:**
- Test session creation and updates
- Verify file persistence
- Validate Markdown export formatting
- Test concurrent session handling

**Acceptance Criteria:**
- Responses saved within 200ms
- Sessions can be resumed after page refresh
- Markdown export includes all answers formatted correctly
- Multiple sessions can exist simultaneously

---

### Issue #6: Beautiful Questionnaire UI
**Title:** Build Pete-branded 7-levels deep questionnaire form

**Description:**
Create an engaging, user-friendly questionnaire interface with progress tracking and Pete branding.

**Tasks:**
- [x] Create `src/app/admin/onboarding-questionnaire/page.tsx`
- [x] Design welcome screen with respondent name input
- [x] Build question display with level badges
- [x] Add progress bar and section overview
- [x] Implement auto-save functionality
- [x] Create completion screen with categorization
- [x] Add markdown export download
- [x] Include navigation buttons (previous/next)

**Design Features:**
- Purple-to-pink gradients (Pete branding)
- Large, readable question text
- Context hints for each question
- Visual progress indicators
- 7-level grid showing completion status
- Responsive layout

**Files:**
- `src/app/admin/onboarding-questionnaire/page.tsx`

**Testing:**
- Test full questionnaire flow (56 questions)
- Verify progress saves automatically
- Test previous/next navigation
- Validate completion and export
- Ensure responsive on all devices

**Acceptance Criteria:**
- Can complete entire questionnaire without losing progress
- Progress bar updates in real-time
- Markdown export includes all responses
- UI is beautiful and intuitive
- Works on mobile, tablet, and desktop

---

## Phase 3: AI Integration (Future)

### Issue #7: PeteAI Questionnaire Assistant
**Title:** Integrate PeteAI to help answer questionnaire questions

**Description:**
Add AI-powered assistance to help users think through questions and provide richer answers.

**Tasks:**
- [ ] Add "Ask PeteAI" button to each question
- [ ] Implement context-aware prompts based on question level
- [ ] Generate follow-up questions to dig deeper
- [ ] Suggest answer structure based on expectedAnswerType
- [ ] Provide examples from similar questions

**Dependencies:**
- Existing PeteAI integration
- Questionnaire data structure (Issue #4)
- Questionnaire UI (Issue #6)

**Files:**
- `src/app/admin/onboarding-questionnaire/page.tsx` (AI integration)
- `src/actions/peteai.ts` (new prompts)

**Testing:**
- Test AI responses for each question type
- Verify context relevance
- Validate follow-up question quality
- Ensure responses help, not distract

**Acceptance Criteria:**
- AI provides relevant context for each question
- Follow-ups help users think deeper
- Suggestions improve answer quality
- Integration feels natural, not intrusive

---

### Issue #8: Automated Insight Extraction
**Title:** Use AI to extract patterns from completed questionnaires

**Description:**
Build AI analysis to identify common themes, root causes, and actionable insights across questionnaire responses.

**Tasks:**
- [ ] Create analysis prompts for each section
- [ ] Implement theme extraction across responses
- [ ] Generate summary reports
- [ ] Identify most common root causes
- [ ] Suggest prioritized action items

**Dependencies:**
- Completed questionnaires (Issue #6)
- Multiple respondent data

**Files:**
- `src/actions/insight-extraction.ts` (new)
- `src/app/admin/onboarding-insights/page.tsx` (add AI insights)

**Testing:**
- Test with real questionnaire data
- Verify theme extraction accuracy
- Validate action item relevance
- Ensure summary is actionable

**Acceptance Criteria:**
- AI identifies 3-5 major themes per section
- Root causes clearly stated
- Action items are specific and testable
- Report is readable and useful

---

## Phase 4: Integration & Workflow

### Issue #9: Intercom Integration for Questionnaire
**Title:** Enable questionnaire completion via Intercom Messenger

**Description:**
Integrate questionnaire into Intercom Canvas Kit so users can complete it in Messenger.

**Tasks:**
- [ ] Create Canvas Kit version of questionnaire
- [ ] Adapt questions for Messenger UI constraints
- [ ] Implement multi-message flow
- [ ] Save responses to Intercom custom attributes
- [ ] Add "Continue in Browser" option for deep dive

**Dependencies:**
- Canvas Kit infrastructure
- Questionnaire system (Issue #5, #6)

**Files:**
- `src/actions/canvas-kit.ts` (questionnaire flow)
- `src/intercom/` (Canvas Kit components)

**Testing:**
- Test full flow in Intercom Messenger
- Verify Canvas Kit component rendering
- Test data persistence
- Validate "Continue in Browser" handoff

**Acceptance Criteria:**
- Questionnaire accessible in Messenger
- All 56 questions available
- Responses sync with browser version
- Seamless handoff between Messenger and web

---

### Issue #10: Analytics Dashboard
**Title:** Build analytics dashboard for questionnaire completion metrics

**Description:**
Create dashboard showing questionnaire completion rates, common answers, and trends over time.

**Tasks:**
- [ ] Track completion metrics
- [ ] Show common themes across respondents
- [ ] Visualize answer patterns
- [ ] Compare Jon vs Mark responses
- [ ] Track resolution category distribution

**Dependencies:**
- Multiple completed questionnaires
- Questionnaire system (Issue #5)

**Files:**
- `src/app/admin/questionnaire-analytics/page.tsx` (new)
- `src/actions/questionnaire-analytics.ts` (new)

**Testing:**
- Test with multiple sessions
- Verify metric calculations
- Validate visualizations
- Ensure performance with many responses

**Acceptance Criteria:**
- Dashboard shows completion rate per section
- Theme extraction highlights patterns
- Resolution category breakdown visible
- Trends over time tracked

---

## Implementation Timeline

**Week 1: Data & Visualization**
- Issues #1, #2, #3
- Get insights from existing conversations
- Visualize current state

**Week 2: Questionnaire Core**
- Issues #4, #5, #6
- Build and test questionnaire system
- Get Jon and Mark to complete first round

**Week 3: AI Enhancement**
- Issues #7, #8
- Add AI assistance
- Extract automated insights

**Week 4: Integration & Polish**
- Issues #9, #10
- Intercom integration
- Analytics and reporting

---

## Success Metrics

1. **Conversation Analysis:**
   - ≥ 80% of onboarding conversations correctly identified
   - < 2 second analysis time
   - Mermaid diagram accurately represents process

2. **Questionnaire Completion:**
   - Jon and Mark complete all 56 questions
   - ≥ 200 characters average answer length
   - Clear patterns emerge from responses

3. **Actionable Insights:**
   - Identify 3-5 major onboarding pain points
   - Categorize 80%+ issues into resolution types
   - Generate prioritized backlog of improvements

4. **User Experience:**
   - Beautiful, Pete-branded UI
   - < 45 minutes to complete questionnaire
   - Zero data loss during completion
   - Positive feedback from Jon and Mark

---

## Notes

- All completed: Issues #1-6 ✓
- Phase 1 & 2 complete and ready for use
- Jon and Mark can now access at `/admin/onboarding-insights` and `/admin/onboarding-questionnaire`
- Phase 3 & 4 are roadmap items for future enhancement
- Focus now shifts to getting actual questionnaire responses from Jon and Mark