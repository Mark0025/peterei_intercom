# Conversation Data Analysis

This directory contains JSON exports of analyzed Intercom conversation data.

## Files Generated

### 1. `first-questions-[timestamp].json`
Every first question/message from users in all conversations.

**Use Cases:**
- Understand what users ask about most frequently
- Identify common onboarding questions
- Build FAQ content based on real user questions
- Train AI models on actual user language patterns
- Create targeted help documentation

**Data Fields:**
- `conversation_id` - Unique conversation identifier
- `user_id` - User who asked the question
- `user_name` - User's name (if available)
- `user_email` - User's email (if available)
- `question` - The actual first message text
- `timestamp` - Unix timestamp when asked
- `date` - ISO 8601 formatted date
- `conversation_state` - Current state (open/closed/snoozed)
- `word_count` - Number of words in the question
- `contains_question_mark` - Boolean flag for actual questions

### 2. `error-resolutions-[timestamp].json`
Timeline of errors reported and their resolution status.

**Use Cases:**
- Calculate average time to resolve issues
- Identify recurring error patterns
- Track which error types take longest to resolve
- Measure support team performance
- Find opportunities for product improvements
- Build error prediction models

**Data Fields:**
- `conversation_id` - Unique conversation identifier
- `error_type` - Categorized error type (upload_error, data_error, auth_error, etc.)
- `reported_at` - Unix timestamp when error was reported
- `resolved_at` - Unix timestamp when resolved (if resolved)
- `resolution_time_hours` - Time to resolution in hours
- `user_id` - User who reported the error
- `user_name` - User's name
- `initial_message` - Original error report text
- `resolution_message` - Final message indicating resolution
- `status` - Current status (resolved, in_progress, unresolved)
- `error_keywords` - Keywords that triggered error detection

### 3. `analysis-stats-[timestamp].json`
Aggregated statistics and insights.

**Use Cases:**
- Executive reporting
- Trend analysis over time
- Performance benchmarking
- Resource allocation planning

**Data Fields:**
- `analysis_metadata` - When analysis was run and scope
- `first_questions` - Summary statistics about questions
- `errors` - Summary statistics about error resolutions
  - Error type distribution
  - Resolution time metrics (average, median)
  - Monthly trends
  - Resolution success rates

## Error Type Categories

The analysis automatically categorizes errors into these types:

- **upload_error** - Data upload, import, CSV issues
- **data_error** - Missing data, data quality issues
- **auth_error** - Login, authentication, password problems
- **porting_error** - Number porting, Twilio transfers
- **sync_error** - Integration, webhook, sync issues
- **performance_error** - Slow loading, timeouts
- **ui_error** - Display, rendering, UI bugs
- **general** - Other uncategorized errors

## Example Analysis Queries

### Most Common First Questions
```javascript
// Load first questions
const questions = require('./first-questions-[timestamp].json');

// Count questions by text
const questionCounts = questions.reduce((acc, q) => {
  acc[q.question] = (acc[q.question] || 0) + 1;
  return acc;
}, {});

// Sort by frequency
const sorted = Object.entries(questionCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

console.log('Top 10 most common first questions:', sorted);
```

### Average Resolution Time by Error Type
```javascript
const errors = require('./error-resolutions-[timestamp].json');

const byType = errors
  .filter(e => e.status === 'resolved')
  .reduce((acc, e) => {
    if (!acc[e.error_type]) {
      acc[e.error_type] = { times: [], count: 0 };
    }
    acc[e.error_type].times.push(e.resolution_time_hours);
    acc[e.error_type].count++;
    return acc;
  }, {});

Object.entries(byType).forEach(([type, data]) => {
  const avg = data.times.reduce((a, b) => a + b, 0) / data.times.length;
  console.log(`${type}: ${avg.toFixed(2)} hours (${data.count} cases)`);
});
```

### Questions by Month
```javascript
const questions = require('./first-questions-[timestamp].json');

const byMonth = questions.reduce((acc, q) => {
  const month = q.date.substring(0, 7); // YYYY-MM
  acc[month] = (acc[month] || 0) + 1;
  return acc;
}, {});

console.log('Questions by month:', byMonth);
```

## Data Refresh

To refresh the analysis with latest conversations:

```bash
cd pete-intercom-nextjs
bun src/scripts/full-conversation-analysis.ts
```

This will:
1. Refresh Intercom cache from API
2. Fetch detailed conversation data
3. Extract and analyze first questions
4. Track error resolutions
5. Generate new timestamped JSON files

## Integration Ideas

### 1. AI Training Data
Use first questions to:
- Fine-tune chatbot responses
- Create intent classification models
- Generate synthetic training data

### 2. Product Insights
Use error data to:
- Prioritize feature development
- Identify UX pain points
- Measure impact of product changes

### 3. Support Optimization
Use resolution times to:
- Set SLA targets
- Allocate support resources
- Identify knowledge gaps

### 4. Content Strategy
Use question patterns to:
- Write targeted help articles
- Create video tutorials
- Build interactive guides

## Notes

- Files are timestamped to prevent overwrites
- Data is pulled from Intercom API (subject to API rate limits)
- Some conversations may not have extractable first questions (automated messages, etc.)
- Error detection uses keyword matching (see script for full list)
- Resolution detection looks for positive sentiment keywords in user responses

## Privacy

These files contain real user data. Handle with care:
- Do not commit to public repositories
- Do not share externally without anonymization
- Follow data retention policies
- Comply with GDPR/privacy regulations

The `.gitignore` should already exclude this directory from version control.
