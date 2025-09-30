# Feature Requests for Onboarding Questionnaire

## Per-Question File Upload Widget

**Request Date:** 2025-09-30  
**Requested By:** User (Mark)  
**Priority:** Medium  
**Status:** Backlog

### Description
Allow file upload widget to be attached to any question in the questionnaire, not just at the beginning of the flow.

### User Story
As a user filling out the questionnaire, I want to upload relevant documents (like onboarding JSON, client data, process docs) when answering specific questions, so I can provide supporting evidence and context for my answers.

### Current Behavior
- File upload only available at the start of the questionnaire
- Uploads trigger NLP analysis for the entire session
- Cannot attach files to individual questions

### Desired Behavior
- Each question can optionally have a file upload widget
- Files attached to specific questions
- Files stored with the question response
- Multiple files per question supported
- Files can be referenced in analysis and reporting

### Use Cases
1. **Question: "What questions do we ask clients during initial intake?"**
   - User uploads: `onboarding-questions.json`
   
2. **Question: "What data do you collect from clients?"**
   - User uploads: `client-intake-form.xlsx`, `property-data-template.csv`

3. **Question: "What workflow do you currently follow?"**
   - User uploads: `process-diagram.png`, `workflow-doc.pdf`

### Technical Considerations

**Data Model Changes:**
```typescript
interface QuestionResponse {
  questionId: string;
  sectionId: string;
  question: string;
  answer: string;
  level: number;
  attachments?: Array<{
    fileName: string;
    fileType: string;
    uploadedAt: number;
    parsedData?: ParsedData; // If applicable
    analysis?: DataStructureAnalysis; // If applicable
  }>;
}
```

**UI Changes:**
- Add optional `allowFileUpload?: boolean` to question configuration
- Render `<FileUpload />` component below textarea when enabled
- Show attached files with preview/remove options
- Include attachment count in question progress indicator

**Storage:**
- Store uploaded files in `data/questionnaire-responses/{sessionId}/attachments/`
- Save file metadata with question response
- Include file references in markdown export

**Analysis Enhancement:**
- Run NLP analysis on uploaded data files
- Include attachment insights in question context
- Reference uploaded files in dynamic question generation

### Implementation Plan

**Phase 1: Data Model & Storage (2-3 hours)**
- Update `QuestionResponse` type with attachments array
- Add file storage utility functions
- Update save/load response actions

**Phase 2: UI Integration (3-4 hours)**
- Add `allowFileUpload` to question configuration
- Render FileUpload component per question
- Handle attachment state management
- Update progress indicators

**Phase 3: Analysis Integration (2-3 hours)**
- Trigger NLP analysis for uploaded files
- Store analysis results with attachment metadata
- Include insights in question context

**Phase 4: Export Enhancement (1-2 hours)**
- Include attachments in markdown export
- Add attachment links/references
- Export file list with metadata

### Dependencies
- Existing FileUpload component (✅ complete)
- NLP analyzer (✅ complete)
- Question response storage (✅ complete)

### Alternatives Considered
1. **Global upload at start only** - Current implementation, too limiting
2. **Upload all files at end** - Loses context of which files relate to which questions
3. **Separate attachment page** - Extra navigation, breaks flow

### Notes
- User is currently filling out questionnaire (session 37858051)
- Request came while answering "Client Intake & Requirements Gathering" section
- Example use case: uploading existing onboarding questions JSON

