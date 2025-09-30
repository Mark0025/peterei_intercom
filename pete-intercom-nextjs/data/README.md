# Data Storage Directory

This directory contains runtime data for the Pete Intercom application.

## Questionnaire Responses

**Location:** `questionnaire-responses/*.json`

### Format
Each questionnaire session is stored as a JSON file with the following structure:

```json
{
  "sessionId": "session-1736473200000",
  "respondent": "Jon",
  "startedAt": 1736473200000,
  "completedAt": 1736475000000,
  "resolutionCategory": "Process",
  "notes": "Additional insights about the session",
  "responses": [
    {
      "questionId": "data-upload-l1",
      "sectionId": "data-upload",
      "level": 1,
      "question": "What is our current data upload process?",
      "answer": "We use CSV imports...",
      "timestamp": 1736473300000,
      "respondent": "Jon"
    }
  ]
}
```

### File Naming
- Files are named: `{sessionId}.json`
- Example: `session-1736473200000.json`

### Git Tracking
These files can be tracked in Git to maintain a history of onboarding discoveries over time.

### Access
- **View Responses:** `/admin/onboarding-responses`
- **Export Markdown:** Click "Export" button on any session
- **Server Actions:** `src/actions/questionnaire.ts`

## Best Practices

1. **Backup Regularly:** These files contain valuable business insights
2. **Version Control:** Commit completed sessions to Git
3. **Privacy:** Contains internal business insights - handle appropriately
4. **Markdown Exports:** Save exports to `DEV_MAN/Onboarding-7DEEP/responses/` for documentation